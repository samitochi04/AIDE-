import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import DOMPurify from 'dompurify';
import { Button, Card, Loading, UpgradeModal } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { api, API_ENDPOINTS } from '../../../config/api';
import styles from './Chat.module.css';

// Suggested questions for quick start
const SUGGESTED_QUESTIONS = [
  { icon: 'ri-home-line', key: 'housing' },
  { icon: 'ri-file-list-3-line', key: 'eligibility' },
  { icon: 'ri-file-text-line', key: 'documents' },
  { icon: 'ri-calendar-line', key: 'timeline' }
];

export function Chat() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Add welcome message when starting fresh
  useEffect(() => {
    if (messages.length === 0 && !loadingMessages) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: t('dashboard.chat.welcomeMessage'),
        timestamp: new Date()
      }]);
    }
  }, [messages.length, loadingMessages, t]);

  const loadConversations = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.get(API_ENDPOINTS.CHAT.GET_CONVERSATIONS);
      if (response?.data?.conversations) {
        setConversations(response.data.conversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadConversation = async (convId) => {
    setLoadingMessages(true);
    try {
      const response = await api.get(API_ENDPOINTS.CHAT.GET_CONVERSATION(convId));
      if (response?.data?.messages) {
        setMessages(response.data.messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at)
        })));
        setConversationId(convId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error(t('dashboard.chat.loadError'));
    } finally {
      setLoadingMessages(false);
    }
  };

  const deleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await api.delete(API_ENDPOINTS.CHAT.DELETE_CONVERSATION(convId));
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (conversationId === convId) {
        startNewChat();
      }
      toast.success(t('dashboard.chat.deleted'));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error(t('dashboard.chat.deleteError'));
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleSuggestedQuestion = (questionKey) => {
    const question = t(`dashboard.chat.suggestions.${questionKey}`);
    setInputValue(question);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Add empty assistant message that will be streamed into
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }]);

    try {
      // Build request body - only include conversationId if it exists
      const requestBody = { message: userMessage.content };
      if (conversationId) {
        requestBody.conversationId = conversationId;
      }

      // Get auth token
      const { supabase } = await import('../../../lib/supabaseClient');
      const { data: { session } } = await supabase.auth.getSession();
      
      // Use streaming endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/v1/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let newConversationId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              
              // Handle limit exceeded error from stream
              if (parsed.error === 'limit_exceeded') {
                setUpgradeInfo({
                  current: parsed.current,
                  limit: parsed.limit,
                  tier: parsed.tier,
                });
                setShowUpgradeModal(true);
                // Remove the empty assistant message
                setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
                setIsTyping(false);
                return;
              }
              
              if (parsed.content) {
                fullContent += parsed.content;
                // Update the streaming message
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              }
              if (parsed.conversationId) {
                newConversationId = parsed.conversationId;
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Mark message as complete
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));

      // Update conversation ID if new
      if (newConversationId && !conversationId) {
        setConversationId(newConversationId);
        loadConversations();
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(t('dashboard.chat.sendError'));
      
      // Update to error message
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: t('dashboard.chat.errorResponse'), isError: true, isStreaming: false }
          : msg
      ));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
  };

  // Parse markdown text and convert to HTML with clickable links
  const parseMarkdown = (text) => {
    if (!text) return '';
    
    let result = text;
    
    // Convert markdown links [text](url) to clickable <a> tags
    result = result.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="' + styles.messageLink + '">$1</a>'
    );
    
    // Convert plain URLs to clickable links (but not if already in an <a> tag)
    result = result.replace(
      /(?<!href="|">)(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="' + styles.messageLink + '">$1</a>'
    );
    
    // Bold text
    result = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    result = result.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Sanitize to prevent XSS attacks
    return DOMPurify.sanitize(result, { 
      ALLOWED_TAGS: ['a', 'strong', 'em', 'b', 'i'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
    });
  };

  // Render markdown-like formatting
  const renderMessageContent = (content) => {
    if (!content) return null;

    // Split by lines and process
    const lines = content.split('\n');
    const elements = [];
    let currentList = [];
    let inList = false;

    lines.forEach((line, index) => {
      // Parse markdown for this line
      const parsedLine = parseMarkdown(line);
      
      // Check for bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().match(/^\d+\./)) {
        if (!inList) {
          inList = true;
          currentList = [];
        }
        const listContent = parseMarkdown(line.trim().replace(/^[•\-\*]\s*/, '').replace(/^\d+\.\s*/, ''));
        currentList.push(listContent);
      } else {
        // End list if we were in one
        if (inList && currentList.length > 0) {
          elements.push(
            <ul key={`list-${index}`} className={styles.messageList}>
              {currentList.map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }
        
        // Add regular paragraph
        if (line.trim()) {
          elements.push(
            <p key={index} dangerouslySetInnerHTML={{ __html: parsedLine }} />
          );
        } else if (index > 0 && lines[index - 1].trim()) {
          elements.push(<br key={index} />);
        }
      }
    });

    // Don't forget trailing list
    if (inList && currentList.length > 0) {
      elements.push(
        <ul key="list-end" className={styles.messageList}>
          {currentList.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
    }

    return elements;
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>{t('dashboard.chat.pageTitle')} | AIDE+</title>
      </Helmet>
      
      {/* Sidebar - Conversation History */}
      <aside className={`${styles.sidebar} ${showHistory ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <h2>{t('dashboard.chat.history')}</h2>
          <Button variant="ghost" size="sm" onClick={startNewChat}>
            <i className="ri-add-line" />
            {t('dashboard.chat.newChat')}
          </Button>
        </div>
        
        <div className={styles.historyList}>
          {loadingHistory ? (
            <div className={styles.loadingHistory}>
              <Loading.Spinner size="sm" />
            </div>
          ) : conversations.length === 0 ? (
            <div className={styles.noHistory}>
              <i className="ri-chat-3-line" />
              <p>{t('dashboard.chat.noHistory')}</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`${styles.historyItem} ${conv.id === conversationId ? styles.active : ''}`}
                onClick={() => loadConversation(conv.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && loadConversation(conv.id)}
              >
                <div className={styles.historyIcon}>
                  <i className="ri-message-3-line" />
                </div>
                <div className={styles.historyContent}>
                  <span className={styles.historyTitle}>{conv.title || t('dashboard.chat.untitled')}</span>
                  <span className={styles.historyPreview}>{conv.message_count} {t('dashboard.chat.messages')}</span>
                  <span className={styles.historyDate}>{formatDate(conv.updated_at)}</span>
                </div>
                <button
                  className={styles.deleteConversation}
                  onClick={(e) => deleteConversation(conv.id, e)}
                  aria-label={t('common.delete')}
                >
                  <i className="ri-delete-bin-line" />
                </button>
              </div>
            ))
          )}
        </div>
        
        <button 
          className={styles.closeSidebar}
          onClick={() => setShowHistory(false)}
        >
          <i className="ri-close-line" />
        </button>
      </aside>

      {/* Main Chat Area */}
      <div className={styles.chatArea}>
        {/* Chat Header */}
        <div className={styles.chatHeader}>
          <button 
            className={styles.historyToggle}
            onClick={() => setShowHistory(true)}
          >
            <i className="ri-menu-line" />
          </button>
          
          <div className={styles.chatHeaderContent}>
            <div className={styles.assistantInfo}>
              <div className={styles.assistantAvatar}>
                <span className={styles.avatarText}>A+</span>
              </div>
              <div>
                <h1>{t('dashboard.chat.title')}</h1>
                <span className={styles.assistantStatus}>
                  <span className={styles.statusDot} />
                  {t('dashboard.chat.online')}
                </span>
              </div>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={startNewChat}>
            <i className="ri-refresh-line" />
          </Button>
        </div>

        {/* Messages */}
        <div className={styles.messagesContainer}>
          <div className={styles.messages}>
            {loadingMessages ? (
              <div className={styles.loadingMessages}>
                <Loading.Spinner size="lg" />
                <p>{t('dashboard.chat.loadingMessages')}</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`${styles.message} ${styles[message.role]} ${message.isError ? styles.error : ''} ${message.isStreaming ? styles.streaming : ''}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    layout
                  >
                    {message.role === 'assistant' && (
                      <div className={styles.messageAvatar}>
                        <span>A+</span>
                      </div>
                    )}
                    
                    <div className={styles.messageContent}>
                      <div className={styles.messageBubble}>
                        {message.isStreaming && !message.content ? (
                          <div className={styles.typingInline}>
                            <span className={styles.typingDot} />
                            <span className={styles.typingDot} />
                            <span className={styles.typingDot} />
                          </div>
                        ) : (
                          renderMessageContent(message.content)
                        )}
                      </div>
                      {message.sources && message.sources.length > 0 && (
                        <div className={styles.messageSources}>
                          <span className={styles.sourcesLabel}>
                            <i className="ri-links-line" />
                            {t('dashboard.chat.sources')}:
                          </span>
                          {message.sources.map((source, i) => (
                            <span key={i} className={styles.sourceTag}>
                              {source}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className={styles.messageTime}>
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className={styles.messageAvatar}>
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="" />
                        ) : (
                          <span>{user?.full_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}</span>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                className={`${styles.message} ${styles.assistant}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={styles.messageAvatar}>
                  <span>A+</span>
                </div>
                <div className={styles.messageContent}>
                  <div className={`${styles.messageBubble} ${styles.typing}`}>
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions (shown when few messages) */}
          {messages.length <= 2 && (
            <div className={styles.suggestions}>
              <p className={styles.suggestionsLabel}>
                {t('dashboard.chat.suggestionsLabel')}
              </p>
              <div className={styles.suggestionCards}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q.key}
                    className={styles.suggestionCard}
                    onClick={() => handleSuggestedQuestion(q.key)}
                  >
                    <i className={q.icon} />
                    <span>{t(`dashboard.chat.suggestions.${q.key}`)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          <Card className={styles.inputCard}>
            <div className={styles.inputWrapper}>
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={t('dashboard.chat.placeholder')}
                className={styles.input}
                rows={1}
                disabled={isTyping}
              />
              <div className={styles.inputActions}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className={styles.sendButton}
                >
                  <i className="ri-send-plane-fill" />
                </Button>
              </div>
            </div>
            <p className={styles.disclaimer}>
              {t('dashboard.chat.disclaimer')}
            </p>
          </Card>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature="aiMessages"
        currentUsage={upgradeInfo?.current}
        limit={upgradeInfo?.limit}
        currentTier={upgradeInfo?.tier}
      />
    </div>
  );
}

export default Chat;

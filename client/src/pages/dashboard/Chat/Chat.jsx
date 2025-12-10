import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Input, Loading, Logo } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import styles from './Chat.module.css';

// Suggested questions for quick start
const SUGGESTED_QUESTIONS = [
  { icon: 'ri-home-line', key: 'housing' },
  { icon: 'ri-file-list-3-line', key: 'eligibility' },
  { icon: 'ri-file-text-line', key: 'documents' },
  { icon: 'ri-calendar-line', key: 'timeline' }
];

// Mock conversation history
const INITIAL_MESSAGES = [
  {
    id: 1,
    role: 'assistant',
    content: 'Hello! I\'m your AIDE+ assistant. I can help you understand French social benefits, check your eligibility, and guide you through application processes. What would you like to know?',
    timestamp: new Date(Date.now() - 60000)
  }
];

export function Chat() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([
    { id: 1, title: 'APL Eligibility', date: '2024-01-15', preview: 'Am I eligible for APL...' },
    { id: 2, title: 'Required Documents', date: '2024-01-14', preview: 'What documents do I need...' },
    { id: 3, title: 'CAF Registration', date: '2024-01-12', preview: 'How do I create a CAF account...' }
  ]);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSuggestedQuestion = (questionKey) => {
    const question = t(`dashboard.chat.suggestions.${questionKey}`);
    setInputValue(question);
    inputRef.current?.focus();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock AI response
    const responses = {
      housing: 'For housing assistance in France, the main options are APL (Aide Personnalisée au Logement) and ALS (Allocation de Logement Social). To be eligible, you need to:\n\n1. Have a valid residence permit\n2. Have a rental agreement in your name\n3. Pay rent regularly\n4. Meet income criteria\n\nWould you like me to check your specific eligibility?',
      default: 'That\'s a great question! Based on your profile, here\'s what I can tell you:\n\nThere are several social benefits you might be eligible for in France. The main categories include:\n\n• **Housing assistance** (APL, ALS)\n• **Family benefits** (Allocations familiales)\n• **Employment support** (Prime d\'activité, ARE)\n• **Health coverage** (CSS)\n\nWould you like me to explain any of these in more detail, or shall we run a quick eligibility check?'
    };

    const assistantMessage = {
      id: messages.length + 2,
      role: 'assistant',
      content: inputValue.toLowerCase().includes('housing') || inputValue.toLowerCase().includes('apl') 
        ? responses.housing 
        : responses.default,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewChat = () => {
    setMessages(INITIAL_MESSAGES);
    setShowHistory(false);
  };

  return (
    <div className={styles.container}>
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
          {conversationHistory.map(conv => (
            <button
              key={conv.id}
              className={styles.historyItem}
              onClick={() => {/* Load conversation */}}
            >
              <div className={styles.historyIcon}>
                <i className="ri-message-3-line" />
              </div>
              <div className={styles.historyContent}>
                <span className={styles.historyTitle}>{conv.title}</span>
                <span className={styles.historyPreview}>{conv.preview}</span>
                <span className={styles.historyDate}>{conv.date}</span>
              </div>
            </button>
          ))}
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
                <Logo size="sm" iconOnly />
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
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={`${styles.message} ${styles[message.role]}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  layout
                >
                  {message.role === 'assistant' && (
                    <div className={styles.messageAvatar}>
                      <Logo size="xs" iconOnly />
                    </div>
                  )}
                  
                  <div className={styles.messageContent}>
                    <div className={styles.messageBubble}>
                      {message.content.split('\n').map((line, i) => (
                        <p key={i}>{line || <br />}</p>
                      ))}
                    </div>
                    <span className={styles.messageTime}>
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className={styles.messageAvatar}>
                      <span>{user?.email?.[0]?.toUpperCase() || 'U'}</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                className={`${styles.message} ${styles.assistant}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className={styles.messageAvatar}>
                  <Logo size="xs" iconOnly />
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
    </div>
  );
}

export default Chat;

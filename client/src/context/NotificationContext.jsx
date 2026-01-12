import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

/**
 * Notification types for in-app notifications
 */
const NOTIFICATION_TYPES = {
  NEW_AIDE: 'new_aide',
  AIDE_UPDATE: 'aide_update',
  PROCEDURE_REMINDER: 'procedure_reminder',
  DEADLINE_ALERT: 'deadline_alert',
  SUBSCRIPTION: 'subscription',
  SYSTEM: 'system',
  WELCOME: 'welcome',
};

export function NotificationProvider({ children }) {
  const { user, profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [latestNotification, setLatestNotification] = useState(null);

  /**
   * Fetch notifications from email_logs table
   * These are notifications sent to the user (we show them in-app too)
   */
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch from email_logs table - most recent first
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Transform email logs to notification format
      const transformedNotifications = (data || []).map(log => ({
        id: log.id,
        title: getNotificationTitle(log.subject),
        message: extractPreviewFromSubject(log.subject),
        type: getNotificationTypeFromTemplate(log.template_id),
        time: getRelativeTime(log.created_at),
        createdAt: log.created_at,
        read: log.opened_at !== null,
        subject: log.subject,
        status: log.status,
      }));

      setNotifications(transformedNotifications);
      setUnreadCount(transformedNotifications.filter(n => !n.read).length);

    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Fetch notifications on mount and when user changes
   */
  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Set up real-time subscription for new notifications
      const subscription = supabase
        .channel('notification-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'email_logs',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = {
              id: payload.new.id,
              title: getNotificationTitle(payload.new.subject),
              message: extractPreviewFromSubject(payload.new.subject),
              type: getNotificationTypeFromTemplate(payload.new.template_id),
              time: 'Just now',
              createdAt: payload.new.created_at,
              read: false,
              subject: payload.new.subject,
              status: payload.new.status,
            };

            // Add to notifications list
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show popup for new notification if in-app notifications are enabled
            if (profile?.notification_preferences?.inApp !== false) {
              setLatestNotification(newNotification);
              setShowNotificationPopup(true);

              // Auto-hide popup after 5 seconds
              setTimeout(() => {
                setShowNotificationPopup(false);
              }, 5000);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, profile, fetchNotifications]);

  /**
   * Mark a notification as read
   */
  const markAsRead = useCallback(async (notificationId) => {
    if (!user) return;

    try {
      // Update email_logs to mark as opened
      const { error } = await supabase
        .from('email_logs')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [user]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('email_logs')
        .update({ opened_at: new Date().toISOString() })
        .in('id', unreadIds)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);

    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [user, notifications]);

  /**
   * Dismiss popup notification
   */
  const dismissPopup = useCallback(() => {
    setShowNotificationPopup(false);
    setLatestNotification(null);
  }, []);

  /**
   * Clear all notifications (doesn't delete from DB, just clears local state)
   */
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    showNotificationPopup,
    latestNotification,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismissPopup,
    clearNotifications,
    NOTIFICATION_TYPES,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Helper functions
function getNotificationTitle(subject) {
  // Extract a clean title from email subject
  if (!subject) return 'Notification';
  
  // Remove common prefixes like "AIDE+ - "
  return subject.replace(/^AIDE\+\s*[-:]\s*/i, '').trim() || 'Notification';
}

function extractPreviewFromSubject(subject) {
  // For now, use subject as preview. In a full implementation,
  // you might store a separate preview field
  return subject || '';
}

function getNotificationTypeFromTemplate(templateId) {
  // Map template IDs to notification types
  // This would need to be updated based on actual template keys
  if (!templateId) return 'system';
  return 'system';
}

function getRelativeTime(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  
  return date.toLocaleDateString();
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export default NotificationContext;

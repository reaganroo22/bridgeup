import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import {
  registerForPushNotifications,
  savePushToken,
  handleNotificationReceived,
  handleNotificationTapped,
  getBadgeCount,
  setBadgeCount,
  scheduleLocalNotification,
  NotificationData,
} from '@/lib/notifications';
import notificationService, {
  scheduleWelcomeNotifications,
  scheduleWeeklyReminders,
  notifyTrendingPost,
  notifyMentorsOfNewQuestion,
  setupNotificationCategories,
} from '@/lib/notificationService';
import { supabase } from '@/lib/supabase';

interface NotificationContextType {
  // Permission state
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  requestPermissions: () => Promise<boolean>;

  // Push token
  pushToken: string | null;

  // Notification counts
  unreadCount: number;
  setUnreadCount: (count: number) => void;

  // Notification functions
  sendLocalNotification: (title: string, body: string, data?: NotificationData) => Promise<void>;
  clearBadge: () => Promise<void>;

  // Wizzmo-specific notification workflows
  scheduleWelcomeFlow: (userId: string) => Promise<void>;
  scheduleWeeklyReminder: (userId: string) => Promise<void>;
  notifyTrendingPost: (userId: string, postTitle: string, categoryName: string) => Promise<void>;
  notifyMentorsOfNewQuestion: (questionId: string, questionTitle: string, categoryName: string, urgency: 'low' | 'medium' | 'high') => Promise<void>;

  // For showing rating modal
  showRatingModal: boolean;
  ratingChatId: string | null;
  setShowRatingModal: (show: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingChatId, setRatingChatId] = useState<string | null>(null);

  // Refs for notification listeners
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  // Initialize notifications on mount
  useEffect(() => {
    initializeNotifications();

    return () => {
      // Clean up listeners
      // Note: On web, removeNotificationSubscription may not exist
      try {
        if (notificationListener.current && Notifications.removeNotificationSubscription) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        if (responseListener.current && Notifications.removeNotificationSubscription) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      } catch (error) {
        console.log('Could not remove notification subscriptions (may be on web):', error);
      }
    };
  }, []);

  // Update badge count when unreadCount changes
  useEffect(() => {
    setBadgeCount(unreadCount);
  }, [unreadCount]);

  // Subscribe to real-time notifications from Supabase
  useEffect(() => {
    if (!pushToken) return;

    const setupRealtimeSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to new messages
      const messagesChannel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('New message notification:', payload);
            // Increment unread count
            setUnreadCount(prev => prev + 1);

            // Show local notification if app is in background
            scheduleLocalNotification(
              'New Message',
              'You have a new message from your Wizzmo',
              {
                type: 'new_message',
                chatId: payload.new.chat_id,
              }
            );
          }
        )
        .subscribe();

      // Subscribe to question matches
      const questionsChannel = supabase
        .channel('question_matches')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'questions',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.new.status === 'matched') {
              console.log('Question matched notification:', payload);
              setUnreadCount(prev => prev + 1);

              scheduleLocalNotification(
                'Question Matched!',
                'Your question has been matched with a Wizzmo',
                {
                  type: 'question_matched',
                  chatId: payload.new.chat_id,
                  questionId: payload.new.id,
                }
              );
            }
          }
        )
        .subscribe();

      return () => {
        messagesChannel.unsubscribe();
        questionsChannel.unsubscribe();
      };
    };

    setupRealtimeSubscriptions();
  }, [pushToken]);

  const initializeNotifications = async () => {
    // On web, notifications might not be fully supported - wrap in try/catch
    try {
      // Setup notification categories first
      await setupNotificationCategories();
      
      // Check initial permission status
      const { status } = await Notifications.getPermissionsAsync();
      if (status === 'granted') {
        setPermissionStatus('granted');
        await setupPushNotifications();
      } else if (status === 'denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('undetermined');
      }

      // Get initial badge count
      const badgeCount = await getBadgeCount();
      setUnreadCount(badgeCount);

      // Set up notification listeners (may not work on web)
      if (Notifications.addNotificationReceivedListener) {
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
          console.log('Notification received in foreground:', notification);
          handleNotificationReceived(notification);

          // Increment unread count
          setUnreadCount(prev => prev + 1);
        });
      }

      if (Notifications.addNotificationResponseReceivedListener) {
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
          console.log('Notification tapped:', response);

          const data = response.notification.request.content.data as NotificationData;

          // Handle chat_resolved specially - show rating modal
          if (data.type === 'chat_resolved' && data.chatId) {
            setRatingChatId(data.chatId);
            setShowRatingModal(true);
          }

          // Navigate based on notification type
          handleNotificationTapped(response, router);

          // Decrement unread count
          setUnreadCount(prev => Math.max(0, prev - 1));
        });
      }
    } catch (error) {
      console.log('[NotificationContext] Notifications not supported on this platform (may be web):', error);
      // Don't throw - just set to undetermined state
      setPermissionStatus('undetermined');
    }
  };

  const setupPushNotifications = async () => {
    try {
      const token = await registerForPushNotifications();

      if (token) {
        setPushToken(token);

        // Save token to Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await savePushToken(user.id, token);
        }
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const token = await registerForPushNotifications();

      if (token) {
        setPermissionStatus('granted');
        setPushToken(token);

        // Save token to Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await savePushToken(user.id, token);
        }

        return true;
      } else {
        setPermissionStatus('denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      setPermissionStatus('denied');
      return false;
    }
  };

  const sendLocalNotification = async (
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<void> => {
    await scheduleLocalNotification(title, body, data);
  };

  const clearBadge = async (): Promise<void> => {
    await setBadgeCount(0);
    setUnreadCount(0);
  };

  // Wizzmo-specific notification workflows
  const scheduleWelcomeFlow = async (userId: string): Promise<void> => {
    try {
      await scheduleWelcomeNotifications(userId);
      console.log('[NotificationContext] Welcome flow scheduled for user:', userId);
    } catch (error) {
      console.error('[NotificationContext] Error scheduling welcome flow:', error);
    }
  };

  const scheduleWeeklyReminderFlow = async (userId: string): Promise<void> => {
    try {
      await scheduleWeeklyReminders(userId);
      console.log('[NotificationContext] Weekly reminder scheduled for user:', userId);
    } catch (error) {
      console.error('[NotificationContext] Error scheduling weekly reminder:', error);
    }
  };

  const notifyTrendingPostFlow = async (userId: string, postTitle: string, categoryName: string): Promise<void> => {
    try {
      await notifyTrendingPost(userId, postTitle, categoryName);
      console.log('[NotificationContext] Trending post notification sent');
    } catch (error) {
      console.error('[NotificationContext] Error sending trending post notification:', error);
    }
  };

  const notifyMentorsOfNewQuestionFlow = async (
    questionId: string, 
    questionTitle: string, 
    categoryName: string, 
    urgency: 'low' | 'medium' | 'high'
  ): Promise<void> => {
    try {
      await notifyMentorsOfNewQuestion(questionId, questionTitle, categoryName, urgency);
      console.log('[NotificationContext] Mentors notified of new question:', questionId);
    } catch (error) {
      console.error('[NotificationContext] Error notifying mentors:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        permissionStatus,
        requestPermissions,
        pushToken,
        unreadCount,
        setUnreadCount,
        sendLocalNotification,
        clearBadge,
        scheduleWelcomeFlow,
        scheduleWeeklyReminder: scheduleWeeklyReminderFlow,
        notifyTrendingPost: notifyTrendingPostFlow,
        notifyMentorsOfNewQuestion: notifyMentorsOfNewQuestionFlow,
        showRatingModal,
        ratingChatId,
        setShowRatingModal,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

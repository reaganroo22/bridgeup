/**
 * Wizzmo Push Notification Service
 * 
 * Handles all push notification functionality including:
 * - Token registration and management
 * - Notification permissions
 * - Scheduling and delivery
 * - Student and mentor notification workflows
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  categoryId?: string;
  sound?: string;
  badge?: number;
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  type: NotificationType;
  payload: NotificationPayload;
  scheduledFor: Date;
  sent: boolean;
  createdAt: Date;
}

export type NotificationType = 
  | 'welcome'
  | 'weekly_reminder'
  | 'trending_post'
  | 'new_question'
  | 'question_answered'
  | 'chat_message'
  | 'mentor_match';

// ============================================================================
// NOTIFICATION CONFIGURATION
// ============================================================================

// Configure how notifications are handled when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Configure notification categories with actions
export const setupNotificationCategories = async () => {
  await Notifications.setNotificationCategoryAsync('new_question', [
    {
      identifier: 'answer',
      buttonTitle: 'Answer',
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: 'pass',
      buttonTitle: 'Pass',
      options: {
        isDestructive: false,
      },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('trending_post', [
    {
      identifier: 'view',
      buttonTitle: 'View',
      options: {
        opensAppToForeground: true,
      },
    },
  ]);
};

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF4DB8',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('[NotificationService] Failed to get push token for push notification!');
      return null;
    }
    
    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '39527180-db95-4a45-b683-4ee7ee48757d',
      });
      token = pushTokenData.data;
      console.log('[NotificationService] Push token received:', token);
    } catch (error) {
      console.error('[NotificationService] Error getting push token:', error);
      return null;
    }
  } else {
    console.log('[NotificationService] Must use physical device for push notifications');
  }

  return token;
}

export async function savePushTokenToDatabase(userId: string, token: string) {
  try {
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert({
        user_id: userId,
        push_token: token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('[NotificationService] Error saving push token:', error);
    } else {
      console.log('[NotificationService] Push token saved successfully');
    }
  } catch (error) {
    console.error('[NotificationService] Unexpected error saving push token:', error);
  }
}

// ============================================================================
// NOTIFICATION SENDING
// ============================================================================

export async function sendPushNotification(
  expoPushToken: string,
  notification: NotificationPayload
): Promise<boolean> {
  try {
    const message = {
      to: expoPushToken,
      sound: notification.sound || 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      categoryId: notification.categoryId,
      badge: notification.badge,
    };

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const data = await response.json();
    console.log('[NotificationService] Push notification sent:', data);
    return true;
  } catch (error) {
    console.error('[NotificationService] Error sending push notification:', error);
    return false;
  }
}

// ============================================================================
// STUDENT NOTIFICATION WORKFLOWS
// ============================================================================

export async function scheduleWelcomeNotifications(userId: string) {
  const notifications = [
    {
      type: 'welcome' as NotificationType,
      payload: {
        title: 'welcome to wizzmo! 💕',
        body: 'ready to get some amazing college advice? your first question is free!',
        data: { screen: 'ask' },
      },
      delayHours: 1, // 1 hour after signup
    },
    {
      type: 'weekly_reminder' as NotificationType,
      payload: {
        title: 'missing you bestie! 💭',
        body: 'got any college questions? our wizzmos are here to help',
        data: { screen: 'ask' },
      },
      delayHours: 24 * 7, // 1 week after signup
    },
  ];

  for (const notification of notifications) {
    await scheduleNotification(userId, notification.type, notification.payload, notification.delayHours);
  }
}

export async function scheduleWeeklyReminders(userId: string) {
  const payload: NotificationPayload = {
    title: 'hey there! 👋',
    body: 'got any new college questions? our wizzmos miss you!',
    data: { screen: 'ask' },
  };

  // Schedule for next week, then it will repeat
  await scheduleNotification(userId, 'weekly_reminder', payload, 24 * 7);
}

export async function notifyTrendingPost(userId: string, postTitle: string, categoryName: string) {
  const payload: NotificationPayload = {
    title: 'trending: ' + categoryName,
    body: postTitle + ' - see what everyone\'s talking about!',
    data: { screen: 'feed', category: categoryName },
    categoryId: 'trending_post',
  };

  await sendImmediateNotification(userId, 'trending_post', payload);
}

// ============================================================================
// MENTOR NOTIFICATION WORKFLOWS
// ============================================================================

export async function notifyMentorsOfNewQuestion(
  questionId: string,
  questionTitle: string,
  categoryName: string,
  urgency: 'low' | 'medium' | 'high'
) {
  // Get all mentors who can answer questions in this category
  const { data: mentors } = await supabase
    .from('users')
    .select(`
      id,
      user_push_tokens!inner (push_token),
      mentor_profiles!inner (expertise_areas, is_available)
    `)
    .eq('role', 'mentor')
    .eq('mentor_profiles.is_available', true);

  if (!mentors || mentors.length === 0) {
    console.log('[NotificationService] No available mentors found');
    return;
  }

  const urgencyEmojis = {
    low: '💭',
    medium: '⚡',
    high: '🚨'
  };

  const payload: NotificationPayload = {
    title: `new ${urgency} priority question ${urgencyEmojis[urgency]}`,
    body: `${categoryName}: ${questionTitle}`,
    data: { 
      screen: 'mentor-inbox',
      questionId,
      urgency 
    },
    categoryId: 'new_question',
  };

  // Send to all available mentors
  for (const mentor of mentors) {
    if (mentor.user_push_tokens && mentor.user_push_tokens.length > 0) {
      for (const tokenData of mentor.user_push_tokens) {
        await sendPushNotification(tokenData.push_token, payload);
      }
    }
  }

  console.log(`[NotificationService] Notified ${mentors.length} mentors of new question`);
}

export async function notifyMentorOfQuestionAccepted(mentorId: string, studentName: string) {
  const payload: NotificationPayload = {
    title: 'question accepted! 🎉',
    body: `${studentName} is waiting for your wisdom`,
    data: { screen: 'mentor-chats' },
  };

  await sendImmediateNotification(mentorId, 'mentor_match', payload);
}

// ============================================================================
// SCHEDULING & DELIVERY
// ============================================================================

async function scheduleNotification(
  userId: string,
  type: NotificationType,
  payload: NotificationPayload,
  delayHours: number
) {
  const scheduledFor = new Date(Date.now() + delayHours * 60 * 60 * 1000);

  try {
    const { error } = await supabase
      .from('scheduled_notifications')
      .insert({
        user_id: userId,
        type,
        payload,
        scheduled_for: scheduledFor.toISOString(),
        sent: false,
      });

    if (error) {
      console.error('[NotificationService] Error scheduling notification:', error);
    } else {
      console.log(`[NotificationService] Scheduled ${type} notification for ${scheduledFor}`);
    }
  } catch (error) {
    console.error('[NotificationService] Unexpected error scheduling notification:', error);
  }
}

async function sendImmediateNotification(
  userId: string,
  type: NotificationType,
  payload: NotificationPayload
) {
  try {
    // Get user's push tokens
    const { data: tokens } = await supabase
      .from('user_push_tokens')
      .select('push_token')
      .eq('user_id', userId);

    if (!tokens || tokens.length === 0) {
      console.log(`[NotificationService] No push tokens found for user ${userId}`);
      return;
    }

    // Send to all user's devices
    for (const tokenData of tokens) {
      await sendPushNotification(tokenData.push_token, payload);
    }

    // Log the notification
    await supabase
      .from('notification_history')
      .insert({
        user_id: userId,
        type,
        payload,
        sent_at: new Date().toISOString(),
      });

  } catch (error) {
    console.error('[NotificationService] Error sending immediate notification:', error);
  }
}

// ============================================================================
// NOTIFICATION PROCESSING (for scheduled notifications)
// ============================================================================

export async function processPendingNotifications() {
  try {
    const now = new Date().toISOString();
    
    // Get all pending notifications that are due
    const { data: pendingNotifications } = await supabase
      .from('scheduled_notifications')
      .select(`
        id,
        user_id,
        type,
        payload,
        users!inner (
          user_push_tokens (push_token)
        )
      `)
      .eq('sent', false)
      .lte('scheduled_for', now);

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return;
    }

    console.log(`[NotificationService] Processing ${pendingNotifications.length} pending notifications`);

    for (const notification of pendingNotifications) {
      const { user_push_tokens } = notification.users;
      
      if (user_push_tokens && user_push_tokens.length > 0) {
        // Send to all user's devices
        for (const tokenData of user_push_tokens) {
          await sendPushNotification(tokenData.push_token, notification.payload);
        }

        // Mark as sent
        await supabase
          .from('scheduled_notifications')
          .update({ sent: true, sent_at: new Date().toISOString() })
          .eq('id', notification.id);

        // Log to history
        await supabase
          .from('notification_history')
          .insert({
            user_id: notification.user_id,
            type: notification.type,
            payload: notification.payload,
            sent_at: new Date().toISOString(),
          });
      }
    }
  } catch (error) {
    console.error('[NotificationService] Error processing pending notifications:', error);
  }
}

// ============================================================================
// NOTIFICATION HANDLING
// ============================================================================

export function setupNotificationListeners() {
  // Handle notification received while app is foregrounded
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('[NotificationService] Notification received:', notification);
  });

  // Handle user tapping on notification
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('[NotificationService] Notification response:', response);
    
    const { data } = response.notification.request.content;
    
    // Handle navigation based on notification data
    if (data?.screen) {
      // Navigation logic will be implemented in the context
      console.log(`[NotificationService] Navigate to: ${data.screen}`);
    }
  });

  return () => {
    Notifications.removeNotificationSubscription(notificationListener);
    Notifications.removeNotificationSubscription(responseListener);
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  registerForPushNotificationsAsync,
  savePushTokenToDatabase,
  setupNotificationCategories,
  setupNotificationListeners,
  scheduleWelcomeNotifications,
  scheduleWeeklyReminders,
  notifyTrendingPost,
  notifyMentorsOfNewQuestion,
  notifyMentorOfQuestionAccepted,
  processPendingNotifications,
};
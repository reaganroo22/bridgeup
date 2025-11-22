import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'new_message' | 'question_matched' | 'chat_resolved' | 'new_comment' | 'new_follower';
  chatId?: string;
  questionId?: string;
  userId?: string;
  postId?: string;
  [key: string]: any;
}

/**
 * Register for push notifications and get device token
 * Requests permissions on iOS, automatically granted on Android
 */
export async function registerForPushNotifications(): Promise<string | null> {
  let token: string | null = null;

  // Check if running on physical device
  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // If permission not granted, return null
  if (finalStatus !== 'granted') {
    console.log('Permission not granted for push notifications');
    return null;
  }

  // Get the push token
  try {
    const pushToken = await Notifications.getExpoPushTokenAsync({
      projectId: '39527180-db95-4a45-b683-4ee7ee48757d',
    });
    token = pushToken.data;
    console.log('Push token:', token);
  } catch (error) {
    console.error('Error getting push token:', error);
  }

  // Configure notification channel for Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF4DB8',
    });

    // Create separate channels for different notification types
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF4DB8',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('updates', {
      name: 'Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#8B5CF6',
    });
  }

  return token;
}

/**
 * Save push token to Supabase user profile
 */
export async function savePushToken(userId: string, token: string): Promise<void> {
  try {
    // Use the user_push_tokens table instead since push_token column doesn't exist in users table
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert({
        user_id: userId,
        push_token: token,
        platform: 'ios', // or get from Platform.OS
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,push_token'
      });

    if (error) {
      // Ignore duplicate key errors (token already exists)
      if (error.code === '23505') {
        console.log('Push token already exists, skipping');
        return;
      }
      console.error('Error saving push token:', error);
      throw error;
    }

    console.log('Push token saved successfully');
  } catch (error) {
    console.error('Failed to save push token:', error);
  }
}

/**
 * Schedule a local notification
 * Useful for reminders, delayed notifications, etc.
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: NotificationData,
  delaySeconds: number = 0
): Promise<string> {
  try {
    if (Platform.OS === 'web') {
      console.log('[scheduleLocalNotification] Notifications not supported on web');
      return '';
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
        badge: 1,
      },
      trigger: delaySeconds > 0
        ? { seconds: delaySeconds }
        : null, // null = immediate
    });

    return notificationId;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return '';
  }
}

/**
 * Handle notification received while app is in foreground
 */
export function handleNotificationReceived(
  notification: Notifications.Notification
): void {
  console.log('Notification received:', notification);

  const data = notification.request.content.data as NotificationData;

  // You can show a custom in-app notification here
  // Or update badge counts, etc.

  console.log('Notification type:', data.type);
  console.log('Notification data:', data);
}

/**
 * Handle notification tapped by user
 * Navigate to appropriate screen based on notification type
 */
export function handleNotificationTapped(
  response: Notifications.NotificationResponse,
  router: any // expo-router router instance
): void {
  console.log('Notification tapped:', response);

  const data = response.notification.request.content.data as NotificationData;

  switch (data.type) {
    case 'new_message':
      // Navigate to chat screen
      if (data.chatId) {
        router.push({
          pathname: '/chat',
          params: { chatId: data.chatId }
        });
      }
      break;

    case 'question_matched':
      // Navigate to chat screen for newly matched question
      if (data.chatId) {
        router.push({
          pathname: '/chat',
          params: { chatId: data.chatId }
        });
      }
      break;

    case 'chat_resolved':
      // Show rating modal - handled in context
      // The context will show the rating modal automatically
      if (data.chatId) {
        router.push({
          pathname: '/chat',
          params: {
            chatId: data.chatId,
            showRating: 'true'
          }
        });
      }
      break;

    case 'new_comment':
      // Navigate to feed/post
      if (data.postId) {
        router.push({
          pathname: '/(tabs)/feed',
          params: { postId: data.postId }
        });
      }
      break;

    case 'new_follower':
      // Navigate to user's profile
      if (data.userId) {
        router.push({
          pathname: '/student-profile',
          params: { userId: data.userId }
        });
      }
      break;

    default:
      console.log('Unknown notification type:', data.type);
  }
}

/**
 * Get notification badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    if (Platform.OS === 'web') return 0;
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    console.log('[getBadgeCount] Not supported on this platform:', error);
    return 0;
  }
}

/**
 * Set notification badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    if (Platform.OS === 'web') return;
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.log('[setBadgeCount] Not supported on this platform:', error);
  }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}

/**
 * Cancel scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Send a test notification (for development)
 */
export async function sendTestNotification(): Promise<void> {
  await scheduleLocalNotification(
    'Test Notification',
    'This is a test from Wizzmo!',
    {
      type: 'new_message',
      chatId: 'test-chat-123',
    }
  );
}

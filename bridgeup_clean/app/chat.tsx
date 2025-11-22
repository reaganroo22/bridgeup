import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
  ActivityIndicator,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '../contexts/AuthContext';
import VoiceRecorder, { AudioRecording } from '@/components/VoiceRecorder';
import VoicePlayer from '@/components/VoicePlayer';
import RatingModal from '@/components/RatingModal';
import GifPicker from '@/components/GifPicker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as supabaseService from '../lib/supabaseService';
import { supabase } from '../lib/supabase';

interface Reaction {
  emoji: string;
  user_id: string;
  created_at: string;
}

interface Message {
  id: string;
  advice_session_id: string;
  sender_id: string;
  content?: string;
  audio_url?: string;
  audio_duration?: number;
  image_url?: string;
  is_read: boolean;
  reactions?: Reaction[];
  created_at: string;
}

interface AdviceSession {
  id: string;
  student_id: string;
  mentor_id: string;
  question_id: string;
  status: 'pending' | 'active' | 'resolved';
  rating?: number;
  feedback?: string;
  created_at: string;
  resolved_at?: string;
  questions?: {
    title: string;
    content: string;
    category_id: string;
    categories?: {
      name: string;
    };
  };
  students?: {
    full_name: string;
    avatar_url?: string;
  };
  mentors?: {
    full_name: string;
    avatar_url?: string;
  };
}

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();

  const [inputText, setInputText] = useState('');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [session, setSession] = useState<AdviceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [visibleTimestamps, setVisibleTimestamps] = useState<Set<string>>(new Set());
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [isRecordingActive, setIsRecordingActive] = useState(false); // Recording or previewing
  const [showQuestionContext, setShowQuestionContext] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch session and messages on mount
  useEffect(() => {
    if (!chatId || !user) return;

    const loadChatData = async () => {
      setLoading(true);

      // Fetch session details
      const { data: sessionData } = await supabase
        .from('advice_sessions')
        .select(`
          *,
          questions (
            title,
            content,
            category_id,
            categories (name)
          ),
          students:users!advice_sessions_student_id_fkey (
            full_name,
            avatar_url
          ),
          mentors:users!advice_sessions_mentor_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('id', chatId)
        .single();

      if (sessionData) {
        setSession(sessionData);
      }

      // Fetch messages
      const { data: messagesData } = await supabaseService.getChatMessages(chatId);
      if (messagesData) {
        setMessages(messagesData);
      }

      // Mark messages as read
      await supabaseService.markMessagesAsRead(chatId, user.id);

      setLoading(false);
    };

    loadChatData();
  }, [chatId, user]);

  // Real-time message subscription
  useEffect(() => {
    if (!chatId) return;

    console.log('[Chat] Setting up real-time subscription for chat:', chatId);

    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `advice_session_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('[Chat] New message received via real-time:', payload.new);
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          // Mark as read if not from current user
          if (user && newMessage.sender_id !== user.id) {
            supabaseService.markMessagesAsRead(chatId, user.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `advice_session_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('[Chat] Message updated via real-time:', payload.new);
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
          );
        }
      )
      .subscribe((status) => {
        console.log('[Chat] Subscription status:', status);
      });

    return () => {
      console.log('[Chat] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [chatId, user]);

  // Typing indicator presence
  useEffect(() => {
    if (!chatId || !user) return;

    const presenceChannel = supabase.channel(`typing:${chatId}`, {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const typingUsers = Object.keys(state).filter(id => id !== user.id);
        setOtherUserTyping(typingUsers.length > 0);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [chatId, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleTyping = useCallback((text: string) => {
    // Sanitize input to prevent Unicode issues
    const sanitizedText = text.replace(/[\u{10000}-\u{10FFFF}]/gu, '').substring(0, 500);
    setInputText(sanitizedText);

    // Broadcast typing status
    if (chatId && user && text.trim().length > 0) {
      const channel = supabase.channel(`typing:${chatId}`);
      channel.track({ typing: true, userId: user.id });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        channel.untrack();
      }, 2000);
    }
  }, [chatId, user]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatId || !user || sending) return;

    setSending(true);
    // Sanitize message text before sending
    const messageText = inputText.trim().replace(/[\u{10000}-\u{10FFFF}]/gu, '');
    setInputText('');

    // Stop typing indicator
    const channel = supabase.channel(`typing:${chatId}`);
    channel.untrack();

    try {
      const { data, error } = await supabaseService.sendMessage(
        chatId,
        user.id,
        messageText
      );

      if (error) {
        console.error('[Chat] Error sending message:', error);
        Alert.alert('error', 'failed to send message. please try again.');
        setInputText(messageText); // Restore input
      } else if (data) {
        // Immediately add the message to the UI (don't wait for real-time)
        console.log('[Chat] Message sent successfully, adding to UI:', data);
        setMessages((prev) => [...prev, data]);
      }
    } catch (error) {
      console.error('[Chat] Error sending message:', error);
      Alert.alert('error', 'failed to send message. please try again.');
      setInputText(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleMarkAsResolved = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Alert.alert(
      'mark as resolved?',
      'this will end the chat and let you rate your experience.',
      [
        {
          text: 'cancel',
          style: 'cancel',
          onPress: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
        {
          text: 'resolve',
          style: 'default',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            if (chatId) {
              console.log('[Chat] Resolving chat:', chatId);

              // Update session status to resolved using service function
              const { data: updatedSession, error } = await supabaseService.updateSessionStatus(
                chatId,
                'resolved',
                user?.id
              );

              if (error) {
                console.error('[Chat] Error resolving chat:', error);
                Alert.alert('error', 'failed to resolve chat. please try again.');
                return;
              }

              console.log('[Chat] Chat resolved successfully');

              // Update mentor stats immediately when resolved
              if (session?.mentor_id) {
                console.log('[Chat] Updating mentor stats after resolution:', session.mentor_id);
                const statsResult = await supabaseService.updateMentorStats(session.mentor_id);
                if (statsResult.error) {
                  console.error('[Chat] Error updating mentor stats:', statsResult.error);
                } else {
                  console.log('[Chat] Mentor stats updated successfully');
                }
              }

              // Update local state
              if (session) {
                setSession({ ...session, status: 'resolved', resolved_at: new Date().toISOString() });
              }

              setTimeout(() => {
                setShowRatingModal(true);
              }, 300);
            }
          }
        }
      ]
    );
  };

  const handleRatingSubmit = async (rating: number, feedback: string, isFavorite: boolean) => {
    if (!chatId || !user || !session) return;

    try {
      console.log('[Chat] Submitting rating for chat:', chatId, 'Rating:', rating);

      // Update session with rating using RPC to bypass RLS
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('update_session_rating', {
          p_feedback: feedback || '',
          p_rating: rating,
          p_session_id: chatId,
          p_user_id: user.id
        });

      if (rpcError) {
        console.error('[Chat] RPC error for rating, using fallback:', rpcError);

        // Fallback to direct update
        const { error: fallbackError } = await supabase
          .from('advice_sessions')
          .update({ rating, feedback: feedback || '' })
          .eq('id', chatId);

        if (fallbackError) {
          console.error('[Chat] Fallback rating error:', fallbackError);
          Alert.alert('error', 'failed to submit rating. please try again.');
          return;
        }

        console.log('[Chat] Rating submitted successfully via fallback');
      } else {
        console.log('[Chat] Rating submitted successfully via RPC');
      }

      // Handle favorite toggle
      if (isFavorite && session.mentor_id) {
        console.log('[Chat] Adding mentor to favorites:', session.mentor_id);
        // Add to favorites
        const { error: favoriteError } = await supabase
          .from('favorite_wizzmos')
          .insert({
            student_id: user.id,
            mentor_id: session.mentor_id,
          });

        if (favoriteError && favoriteError.code !== '23505') {
          // Ignore duplicate key errors (23505)
          console.error('[Chat] Error adding favorite:', favoriteError);
        } else {
          console.log('[Chat] Mentor added to favorites successfully');
        }
      }

      // Update mentor stats (average rating, questions answered, etc.)
      if (session.mentor_id) {
        console.log('[Chat] Updating mentor stats for:', session.mentor_id);
        const statsResult = await supabaseService.updateMentorStats(session.mentor_id);
        if (statsResult.error) {
          console.error('[Chat] Error updating mentor stats:', statsResult.error);
        } else {
          console.log('[Chat] Mentor stats updated successfully');
        }
      }

      setShowRatingModal(false);

      // Show success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      console.log('[Chat] Navigating back to advice screen...');

      // Force a small delay to ensure database transaction completes
      // Then navigate back which will trigger useFocusEffect
      setTimeout(() => {
        router.back();
      }, 800);
    } catch (error) {
      console.error('[Chat] Error submitting rating:', error);
      Alert.alert('error', 'failed to submit rating. please try again.');
    }
  };

  const handleVoiceRecordingComplete = useCallback(async (recording: AudioRecording) => {
    if (!chatId || !user) return;

    try {
      console.log('[Chat] Uploading voice message:', recording.uri);

      // For React Native, we need to use arrayBuffer instead of blob
      const response = await fetch(recording.uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      // Upload audio to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.m4a`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, fileData, {
          contentType: 'audio/m4a',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading voice message:', uploadError);
        Alert.alert('error', 'failed to send voice message. please try again.');
        return;
      }

      console.log('[Chat] Voice message uploaded:', uploadData.path);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      // Send message with audio URL
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          advice_session_id: chatId,
          sender_id: user.id,
          content: '', // Empty string for voice-only messages
          audio_url: publicUrl,
          audio_duration: recording.duration,
          is_read: false,
        })
        .select()
        .single();

      if (messageError) {
        console.error('Error sending voice message:', messageError);
        Alert.alert('error', 'failed to send voice message. please try again.');
        return;
      }

      // Immediately add the message to the UI (don't wait for real-time)
      if (messageData) {
        console.log('[Chat] Voice message sent successfully, adding to UI:', messageData);
        setMessages((prev) => [...prev, messageData]);
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error handling voice message:', error);
      Alert.alert('error', 'failed to send voice message. please try again.');
    }
  }, [chatId, user]);

  const handleCamera = useCallback(async () => {
    if (!chatId || !user) return;

    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('permission needed', 'we need camera permissions to take photos');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const fileName = `${user.id}/${Date.now()}.jpg`;

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: fileName,
      } as any);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, formData, {
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        console.error('[Chat] Error uploading image:', uploadError);
        Alert.alert('error', 'failed to send image. please try again.');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      // Send message with image URL
      const { data, error: messageError } = await supabase
        .from('messages')
        .insert({
          advice_session_id: chatId,
          sender_id: user.id,
          image_url: publicUrl,
          is_read: false,
        })
        .select()
        .single();

      if (messageError) {
        console.error('[Chat] Error sending image message:', messageError);
        Alert.alert('error', 'failed to send image. please try again.');
        return;
      }

      // Add to messages immediately
      if (data) {
        setMessages((prev) => [...prev, data]);
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[Chat] Error taking photo:', error);
      Alert.alert('error', 'failed to send photo. please try again.');
    }
  }, [chatId, user]);

  const handleImagePick = useCallback(async () => {
    if (!chatId || !user) return;

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('permission needed', 'we need camera roll permissions to share photos');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled) return;

      const uri = result.assets[0].uri;
      const fileName = `${user.id}/${Date.now()}.jpg`;

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: fileName,
      } as any);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, formData, {
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        console.error('[Chat] Error uploading image:', uploadError);
        Alert.alert('error', 'failed to send image. please try again.');
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      // Send message with image URL
      const { data, error: messageError } = await supabase
        .from('messages')
        .insert({
          advice_session_id: chatId,
          sender_id: user.id,
          image_url: publicUrl,
          is_read: false,
        })
        .select()
        .single();

      if (messageError) {
        console.error('[Chat] Error sending image message:', messageError);
        Alert.alert('error', 'failed to send image. please try again.');
        return;
      }

      // Add to messages immediately
      if (data) {
        setMessages((prev) => [...prev, data]);
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[Chat] Error picking image:', error);
      Alert.alert('error', 'failed to send image. please try again.');
    }
  }, [chatId, user]);

  const handleGifSelect = useCallback(async (gifUrl: string) => {
    if (!chatId || !user) return;

    try {
      // Send message with GIF URL
      const { data, error: messageError } = await supabase
        .from('messages')
        .insert({
          advice_session_id: chatId,
          sender_id: user.id,
          content: '', // Empty for GIF-only messages
          image_url: gifUrl, // Store GIF as image
          is_read: false,
        })
        .select()
        .single();

      if (messageError) {
        console.error('[Chat] Error sending GIF:', messageError);
        Alert.alert('error', 'failed to send gif. please try again.');
        return;
      }

      // Add to messages immediately
      if (data) {
        setMessages((prev) => [...prev, data]);
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[Chat] Error sending GIF:', error);
      Alert.alert('error', 'failed to send gif. please try again.');
    }
  }, [chatId, user]);

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Get current message
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const reactions = message.reactions || [];

      // Check if user already reacted with this emoji
      const existingReactionIndex = reactions.findIndex(
        r => r.user_id === user.id && r.emoji === emoji
      );

      let updatedReactions;
      if (existingReactionIndex >= 0) {
        // Remove reaction
        updatedReactions = reactions.filter((_, i) => i !== existingReactionIndex);
      } else {
        // Add reaction
        updatedReactions = [
          ...reactions,
          { emoji, user_id: user.id, created_at: new Date().toISOString() }
        ];
      }

      // Update in database
      const { error } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);

      if (error) {
        console.error('[Chat] Error updating reaction:', error);
        return;
      }

      // Update local state
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, reactions: updatedReactions } : m
        )
      );

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[Chat] Error handling reaction:', error);
    }
  }, [user, messages]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.sender_id === user?.id;
    const isVoice = !!item.audio_url;
    const isImage = !!item.image_url;

    // Check if this is the last message from me
    const isLastFromMe = isMe && !messages.slice(index + 1).some(m => m.sender_id === user?.id);

    // Message grouping logic (iMessage style)
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

    const isSameSenderAsPrev = prevMessage?.sender_id === item.sender_id;
    const isSameSenderAsNext = nextMessage?.sender_id === item.sender_id;

    // Check if within 2 minutes of previous message
    const timeDiffPrev = prevMessage
      ? (new Date(item.created_at).getTime() - new Date(prevMessage.created_at).getTime()) / 1000 / 60
      : 999;

    const timeDiffNext = nextMessage
      ? (new Date(nextMessage.created_at).getTime() - new Date(item.created_at).getTime()) / 1000 / 60
      : 999;

    const isGroupedWithPrev = isSameSenderAsPrev && timeDiffPrev < 2;
    const isGroupedWithNext = isSameSenderAsNext && timeDiffNext < 2;

    const isFirstInGroup = !isGroupedWithPrev;
    const isLastInGroup = !isGroupedWithNext;
    const shouldShowTimestamp = !isGroupedWithPrev || timeDiffPrev > 60; // Show if >1 hour apart

    // Determine sender info
    let senderName = 'Unknown';
    let senderAvatar = '👤';
    let isWizzmo = false;

    if (session) {
      if (item.sender_id === session.mentor_id) {
        senderName = session.mentors?.full_name || 'Wizzmo';
        senderAvatar = session.mentors?.avatar_url || '🎓';
        isWizzmo = true;
      } else if (item.sender_id === session.student_id) {
        senderName = session.students?.full_name || 'User';
        senderAvatar = session.students?.avatar_url || '👤';
      }
    }

    return (
      <>
        {/* Timestamp separator */}
        {shouldShowTimestamp && (
          <View style={styles.timestampSeparator}>
            <Text style={[styles.timestampSeparatorText, { color: colors.textSecondary }]}>
              {new Date(item.created_at).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </Text>
          </View>
        )}

        <View style={[
          styles.messageContainer,
          isMe ? styles.myMessage : styles.theirMessage,
          !isFirstInGroup && styles.groupedMessage
        ]}>
          {!isMe && isFirstInGroup && (
            <TouchableOpacity
              style={styles.messageHeader}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (item.sender_id === session?.mentor_id) {
                  // Viewing mentor profile
                  router.push(`/wizzmo-profile?userId=${session.mentor_id}`);
                } else if (item.sender_id === session?.student_id) {
                  // Viewing student profile
                  router.push(`/student-profile?userId=${session.student_id}`);
                }
              }}
            >
              {senderAvatar && senderAvatar.includes('http') ? (
                <Image 
                  source={{ uri: senderAvatar }} 
                  style={styles.avatarImage}
                  defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
                />
              ) : (
                <Text style={styles.avatar}>{senderAvatar}</Text>
              )}
              <Text style={[styles.senderName, { color: colors.primary }]}>
                {senderName}
              </Text>
              {isWizzmo && (
                <View style={[styles.wizmoBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.wizmoBadgeText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

        <TouchableOpacity
          onPress={() => {
            // Toggle timestamp for all messages
            setVisibleTimestamps(prev => {
              const newSet = new Set(prev);
              if (newSet.has(item.id)) {
                newSet.delete(item.id);
              } else {
                newSet.add(item.id);
              }
              return newSet;
            });
          }}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowReactionPicker(item.id);
          }}
          activeOpacity={0.9}
          style={{ backgroundColor: 'transparent' }}
        >
          {isVoice ? (
            <VoicePlayer
              audioUri={item.audio_url!}
              duration={item.audio_duration || 0}
              isMe={isMe}
            />
          ) : isImage ? (
            <Image
              source={{ uri: item.image_url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[
              styles.messageBubble,
              {
                backgroundColor: isMe ? colors.primary : '#E5E5EA',
                borderColor: colors.border
              }
            ]}>
              <Text style={[
                styles.messageText,
                { color: isMe ? 'white' : '#000000' }
              ]}>
                {/* Filter out accidental URL messages */}
                {item.content && !item.content.includes('supabase.co/storage') ? item.content : '[message error]'}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {visibleTimestamps.has(item.id) && (
          <Text style={[styles.timestamp, { color: colors.textMuted }]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}

        {/* Delivery status for sent messages - only show on last message from me */}
        {isLastFromMe && (
          <Text style={[styles.deliveryStatus, { color: colors.textTertiary }]}>
            {item.is_read ? 'Read' : 'Delivered'}
          </Text>
        )}

        {/* Reactions Display */}
        {item.reactions && item.reactions.length > 0 && (
          <View style={styles.reactionsContainer}>
            {/* Group reactions by emoji */}
            {Object.entries(
              item.reactions.reduce((acc, reaction) => {
                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([emoji, count]) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.reactionBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => handleReaction(item.id, emoji)}
              >
                <Text style={styles.reactionEmoji}>{emoji}</Text>
                {count > 1 && <Text style={[styles.reactionCount, { color: colors.text }]}>{count}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reaction Picker */}
        {showReactionPicker === item.id && (
          <View style={[styles.reactionPicker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.reactionOption}
                onPress={() => {
                  handleReaction(item.id, emoji);
                  setShowReactionPicker(null);
                }}
              >
                <Text style={styles.reactionOptionEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.reactionOption}
              onPress={() => setShowReactionPicker(null)}
            >
              <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      </>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>
          loading chat...
        </Text>
      </View>
    );
  }

  // Session not found
  if (!session) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          chat not found
        </Text>
        <TouchableOpacity
          style={[styles.backToHomeButton, { borderColor: colors.border, marginTop: 20 }]}
          onPress={() => router.back()}
        >
          <Text style={[styles.backToHomeText, { color: colors.text }]}>go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categoryName = session.questions?.categories?.name || 'chat';
  const otherPersonName = user?.id === session.student_id
    ? session.mentors?.full_name
    : session.students?.full_name;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.separator }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerContent}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            console.log('[Chat] Navigating to profile. Current user:', user?.id, 'Student:', session.student_id, 'Mentor:', session.mentor_id);
            if (user?.id === session.student_id) {
              // Student viewing mentor profile
              console.log('[Chat] Student viewing mentor profile:', session.mentor_id);
              router.push(`/wizzmo-profile?userId=${session.mentor_id}`);
            } else {
              // Mentor viewing student profile
              console.log('[Chat] Mentor viewing student profile:', session.student_id);
              router.push(`/student-profile?userId=${session.student_id}`);
            }
          }}
        >
          {/* Avatar and Name */}
          <View style={[styles.headerUserInfo, { backgroundColor: 'transparent' }]}>
            {(() => {
              const avatarUrl = user?.id === session.student_id 
                ? session.mentors?.avatar_url
                : session.students?.avatar_url;
              const fallbackEmoji = user?.id === session.student_id ? '🎓' : '👤';
              
              return avatarUrl ? (
                <Image 
                  source={{ uri: avatarUrl }} 
                  style={styles.headerAvatarImage}
                  defaultSource={{ uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' }}
                  onError={() => console.log('Avatar failed to load:', avatarUrl)}
                />
              ) : (
                <Text style={styles.headerAvatar}>{fallbackEmoji}</Text>
              );
            })()}
            <View style={[styles.headerTextContainer, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {otherPersonName || 'loading...'}
              </Text>
              <Text style={[styles.headerSubtitle, { color: session.status === 'resolved' ? '#4CAF50' : colors.textSecondary }]}>
                {session.status === 'resolved' ? 'Chat Ended' : 'Active'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {session.status === 'active' && user?.id === session.student_id && (
          <TouchableOpacity
            style={[styles.resolveButton, { borderColor: colors.border }]}
            onPress={handleMarkAsResolved}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.text} />
            <Text style={[styles.resolveButtonText, { color: colors.text }]}>
              resolve
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Original Question Context */}
      {session.questions && (
        <View style={[styles.questionContext, { backgroundColor: colors.surfaceElevated, borderBottomColor: colors.separator }]}>
          <TouchableOpacity
            style={[styles.questionHeader, { backgroundColor: 'transparent' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowQuestionContext(!showQuestionContext);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.questionHeaderLeft}>
              <Text style={[styles.questionLabel, { color: colors.textSecondary }]}>
                original question
              </Text>
              <Text style={[styles.questionCategory, { color: colors.primary }]}>
                {categoryName}
              </Text>
            </View>
            <Ionicons
              name={showQuestionContext ? "chevron-up" : "chevron-down"}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          
          {showQuestionContext && (
            <View style={[styles.questionBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.questionTitle, { color: colors.text }]}>
                {session.questions.title}
              </Text>
              {session.questions.content && (
                <Text style={[styles.questionContent, { color: colors.textSecondary }]}>
                  {session.questions.content}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item, index }) => renderMessage({ item, index })}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Typing Indicator */}
      {otherUserTyping && (
        <View style={[styles.typingIndicator, { backgroundColor: colors.background }]}>
          <View style={styles.typingDots}>
            <View style={[styles.typingDot, { backgroundColor: colors.textTertiary }]} />
            <View style={[styles.typingDot, { backgroundColor: colors.textTertiary }]} />
            <View style={[styles.typingDot, { backgroundColor: colors.textTertiary }]} />
          </View>
          <Text style={[styles.typingText, { color: colors.textSecondary }]}>
            {otherPersonName} is typing...
          </Text>
        </View>
      )}

      {/* Input */}
      {session.status === 'active' && (
        <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.separator }]}>
          {!isRecordingActive && (
            <>
              <TouchableOpacity
                style={styles.plusButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAttachmentMenu(!showAttachmentMenu);
                }}
              >
                <Ionicons
                  name={showAttachmentMenu ? "close-circle" : "add-circle"}
                  size={28}
                  color={colors.primary}
                />
              </TouchableOpacity>

              <TextInput
                style={[styles.textInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
                placeholder="message..."
                placeholderTextColor={colors.textTertiary}
                value={inputText}
                onChangeText={handleTyping}
                multiline
                maxLength={500}
                editable={!sending}
              />
            </>
          )}

          {inputText.trim().length === 0 ? (
            <VoiceRecorder
              onRecordingComplete={handleVoiceRecordingComplete}
              onRecordingStateChange={setIsRecordingActive}
            />
          ) : (
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: colors.primary }
              ]}
              onPress={handleSendMessage}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Attachment Menu */}
      {showAttachmentMenu && session.status === 'active' && (
        <View style={[styles.attachmentMenu, { backgroundColor: colors.surface, borderTopColor: colors.separator }]}>
          <TouchableOpacity
            style={styles.attachmentOption}
            onPress={() => {
              setShowAttachmentMenu(false);
              handleImagePick();
            }}
          >
            <View style={[styles.attachmentIconContainer, { backgroundColor: colors.primary }]}>
              <Ionicons name="image" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.attachmentLabel, { color: colors.text }]}>photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.attachmentOption}
            onPress={() => {
              setShowAttachmentMenu(false);
              handleCamera();
            }}
          >
            <View style={[styles.attachmentIconContainer, { backgroundColor: '#FF4DB8' }]}>
              <Ionicons name="camera" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.attachmentLabel, { color: colors.text }]}>camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.attachmentOption}
            onPress={() => {
              setShowAttachmentMenu(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowGifPicker(true);
            }}
          >
            <View style={[styles.attachmentIconContainer, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="happy" size={24} color="#FFFFFF" />
            </View>
            <Text style={[styles.attachmentLabel, { color: colors.text }]}>gif</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Resolved status */}
      {session.status === 'resolved' && (
        <View style={[styles.resolvedBanner, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border }]}>
          <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
          <Text style={[styles.resolvedText, { color: colors.textSecondary }]}>
            this chat has been resolved
          </Text>
        </View>
      )}

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSubmit={handleRatingSubmit}
        wizzmoName={otherPersonName || 'your wizzmo'}
        mentorId={session.mentor_id}
      />

      {/* GIF Picker */}
      <GifPicker
        visible={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelectGif={handleGifSelect}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    fontSize: 20,
    marginRight: 12,
  },
  headerAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  headerTextContainer: {
    flex: 1,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 0,
    gap: 6,
  },
  resolveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 16,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  groupedMessage: {
    marginBottom: 2, // Tighter spacing for grouped messages
  },
  timestampSeparator: {
    alignItems: 'center',
    marginVertical: 16,
  },
  timestampSeparatorText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  avatar: {
    fontSize: 16,
    marginRight: 8,
  },
  avatarImage: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    letterSpacing: -0.1,
  },
  wizmoBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizmoBadgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '700',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  deliveryStatus: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '400',
    alignSelf: 'flex-end',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  reactionPicker: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'center',
  },
  reactionOption: {
    padding: 4,
  },
  reactionOptionEmoji: {
    fontSize: 24,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    fontWeight: '400',
  },
  plusButton: {
    padding: 4,
    marginRight: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  attachmentMenu: {
    flexDirection: 'row',
    padding: 16,
    gap: 20,
    borderTopWidth: 1,
  },
  attachmentOption: {
    alignItems: 'center',
    gap: 8,
  },
  attachmentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  messageImage: {
    width: 250,
    height: 200,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
  },
  backToHomeButton: {
    borderWidth: 1,
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backToHomeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resolvedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  resolvedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  questionContext: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  questionHeaderLeft: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  questionCategory: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  questionBox: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  questionContent: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
});

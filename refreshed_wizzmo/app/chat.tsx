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
  Image,
  Pressable,
  Modal,
  Clipboard
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '../contexts/AuthContext';
import VoiceRecorder, { AudioRecording } from '@/components/VoiceRecorder';
import VoicePlayer from '@/components/VoicePlayer';
import RatingModal from '@/components/RatingModal';
import GifPicker from '@/components/GifPicker';
import FullscreenMediaModal from '@/components/FullscreenMediaModal';
import { UnsendButton, EditButton, ReplyButton } from '@/components/MessageActions';
import { ReplyPreview } from '@/components/ReplyPreview';
// Custom emoji picker - no external dependency needed
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
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
  content?: string | null;
  audio_url?: string | null;
  audio_duration?: number | null;
  image_url?: string | null;
  is_read?: boolean | null;
  reactions?: any;
  reply_to_message_id?: string;
  reply_to_message?: any;
  created_at: string | null;
  edit_count?: number;
  edited_at?: string | null;
}

interface AdviceSession {
  id: string;
  student_id: string | null;
  mentor_id: string;
  question_id: string;
  status: 'pending' | 'active' | 'resolved' | string | null;
  rating?: number | null;
  feedback?: string | null;
  created_at: string | null;
  resolved_at?: string | null;
  questions?: {
    title: string;
    content: string;
    category_id: string;
    categories?: {
      name: string;
    };
  };
  students?: {
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
  mentors?: {
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
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
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const retryTimeoutRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [visibleTimestamps, setVisibleTimestamps] = useState<Set<string>>(new Set());
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiForMessage, setEmojiForMessage] = useState<string | null>(null);
  const [showInlineReactions, setShowInlineReactions] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [isRecordingActive, setIsRecordingActive] = useState(false); // Recording or previewing
  const [showQuestionContext, setShowQuestionContext] = useState(true);
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editText, setEditText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const deletedMessageIds = useRef<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<number | undefined>(undefined);
  const pollingIntervalRef = useRef<number | null>(null);

  // Helper function to detect video files by URL
  const isVideoUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v', '.3gp', '.flv'];
    const lowerUrl = url.toLowerCase();
    const isVideo = videoExtensions.some(ext => lowerUrl.includes(ext));
    if (isVideo) {
      console.log('[Chat] 🎬 Detected video URL:', url.slice(0, 80));
    }
    return isVideo;
  };

  // Helper functions for status display
  const getStatusText = () => {
    if (!session) return 'loading...';
    
    switch (session.status) {
      case 'active':
        return 'active chat';
      case 'pending':
        return 'waiting for mentor';
      case 'accepted':
        return 'chat accepted';
      case 'resolved':
        return 'chat ended';
      default:
        return session.status;
    }
  };

  const getStatusColor = () => {
    if (!session) return colors.textSecondary;
    
    switch (session.status) {
      case 'active':
        return colors.primary;
      case 'pending':
        return colors.warning;
      case 'accepted':
        return colors.success;
      case 'resolved':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  // Fetch messages function
  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    
    const { data: messagesData } = await supabase
      .from('messages')
      .select(`
        *,
        reply_to_message:reply_to_message_id (
          id,
          sender_id,
          content,
          image_url,
          audio_url,
          created_at
        )
      `)
      .eq('advice_session_id', chatId)
      .order('created_at', { ascending: true });
    
    if (messagesData) {
      setMessages(messagesData);
    }
  }, [chatId]);

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

      // Clear deleted message tracking on fresh load
      deletedMessageIds.current.clear();

      // Fetch messages with reply data
      const { data: messagesData } = await supabase
        .from('messages')
        .select(`
          *,
          reply_to_message:reply_to_message_id (
            id,
            sender_id,
            content,
            image_url,
            audio_url,
            created_at
          )
        `)
        .eq('advice_session_id', chatId)
        .order('created_at', { ascending: true });
      
      if (messagesData) {
        console.log('[Chat] 📨 Loaded', messagesData.length, 'messages from database');
        // Debug: Check for video messages (videos are stored in image_url field)
        const videoMessages = messagesData.filter((m: any) => isVideoUrl(m.image_url));
        console.log('[Chat] 🎥 Found', videoMessages.length, 'video messages (stored in image_url field)');
        if (videoMessages.length > 0) {
          console.log('[Chat] 🎥 Video message URLs:', videoMessages.map((m: any) => ({ 
            id: m.id?.slice(0, 8), 
            image_url: m.image_url?.slice(0, 80) 
          })));
        }
        setMessages(messagesData);
      }

      // Mark messages as read
      await supabaseService.markMessagesAsRead(chatId, user.id);

      setLoading(false);
    };

    loadChatData();
  }, [chatId, user]);

  // Mark messages as read when chat comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!chatId || !user) return;
      
      console.log('[Chat] 👁️ Chat focused - marking all messages as read');
      supabaseService.markMessagesAsRead(chatId, user.id).then(({ data: readCount }) => {
        if (readCount && readCount > 0) {
          console.log('[Chat] ✅ Marked', readCount, 'messages as read on focus');
        }
      });
    }, [chatId, user])
  );

  // Simple polling approach for reliable message delivery
  useEffect(() => {
    if (!chatId || !user) return;

    console.log('[Chat] 🔄 Setting up message polling for chat:', chatId);
    
    // Poll for new messages and session status every 1.5 seconds
    const pollForMessages = async () => {
      try {
        // Check for session status changes
        const { data: sessionData } = await supabase
          .from('advice_sessions')
          .select('status')
          .eq('id', chatId)
          .single();

        if (sessionData && session && sessionData.status !== session.status) {
          console.log('[Chat] 🔄 Session status changed from', session.status, 'to', sessionData.status);
          setSession(prev => prev ? { ...prev, status: sessionData.status } : prev);
        }

        const { data: latestMessages } = await supabase
          .from('messages')
          .select(`
            *,
            reply_to_message:reply_to_message_id (
              id,
              sender_id,
              content,
              image_url,
              audio_url,
              created_at
            )
          `)
          .eq('advice_session_id', chatId)
          .order('created_at', { ascending: true });
        
        if (latestMessages) {
          setMessages(currentMessages => {
            // Filter out messages that were locally deleted
            const filteredMessages = latestMessages.filter(m => !deletedMessageIds.current.has(m.id));
            
            // Check if we have new messages
            const existingIds = new Set(currentMessages.map(m => m.id));
            const newMessages = filteredMessages.filter(m => !existingIds.has(m.id));
            
            if (newMessages.length > 0) {
              console.log('[Chat] 📩 Found', newMessages.length, 'new messages via polling');
              
              // Mark new messages from other users as read
              const newMessagesFromOthers = newMessages.filter(m => m.sender_id !== user.id);
              if (newMessagesFromOthers.length > 0) {
                console.log('[Chat] 👁️ Marking', newMessagesFromOthers.length, 'new messages as read');
                supabaseService.markMessagesAsRead(chatId, user.id).then(({ data: readCount }) => {
                  if (readCount && readCount > 0) {
                    console.log('[Chat] ✅ Read receipt sent for', readCount, 'messages');
                  }
                });
              }
              
              // Scroll to bottom when new messages arrive
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 100);
              
              // Add new messages
              return [...currentMessages, ...newMessages];
            }
            
            return currentMessages;
          });
        }
      } catch (error) {
        console.error('[Chat] ❌ Polling error:', error);
      }
    };

    // Initial poll
    pollForMessages();
    
    // Set up regular polling
    pollingIntervalRef.current = setInterval(pollForMessages, 1500);

    return () => {
      console.log('[Chat] 🧹 Cleaning up message polling');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [chatId, user]);

  // Real-time subscription for message updates (for edits, deletes, reactions)
  useEffect(() => {
    if (!chatId || !user) return;

    console.log('[Chat] 🔄 Setting up real-time subscription for message updates');
    
    const messageChannel = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `advice_session_id=eq.${chatId}`,
        },
        (payload) => {
          console.log('[Chat] 📝 Message UPDATE received via real-time:');
          console.log('  - Message ID:', payload.new.id);
          console.log('  - New content:', payload.new.content);
          console.log('  - Edit count:', payload.new.edit_count);
          console.log('  - Edited at:', payload.new.edited_at);
          console.log('  - Full payload:', JSON.stringify(payload, null, 2));
          
          setMessages(prev => {
            console.log('[Chat] 📝 Updating message in state...');
            const updated = prev.map(msg => 
              msg.id === payload.new.id 
                ? { 
                    ...msg, 
                    content: payload.new.content,
                    edit_count: payload.new.edit_count,
                    edited_at: payload.new.edited_at,
                    // Preserve existing reply_to_message structure
                    reply_to_message: msg.reply_to_message 
                  }
                : msg
            );
            console.log('[Chat] 📝 Message state updated successfully');
            return updated;
          });
        }
      )
      .subscribe(
        (status) => {
          console.log('[Chat] 📡 Subscription status:', status);
        }
      );

    return () => {
      console.log('[Chat] 🧹 Cleaning up message updates subscription');
      supabase.removeChannel(messageChannel);
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
  }, [chatId, user, replyingToMessage]);

  // Context menu functions
  const handleLongPress = (message: Message) => {
    // Allow long press for text, images, and videos
    if (!message.content && !message.image_url && !message.audio_url) return;
    setSelectedMessage(message);
    setShowInlineReactions(message.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Fullscreen media functions (legacy - now using handleDoubleTap)
  const openFullscreenImage = (imageUrl: string) => {
    setFullscreenMedia({ url: imageUrl, type: 'image' });
  };

  const openFullscreenVideo = (videoUrl: string) => {
    setFullscreenMedia({ url: videoUrl, type: 'video' });
  };

  const closeFullscreenMedia = () => {
    setFullscreenMedia(null);
  };

  // Video playback functions
  const toggleVideoPlayback = (messageId: string) => {
    setPlayingVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Double tap handler for fullscreen
  const handleDoubleTap = (mediaUrl: string, mediaType: 'image' | 'video') => {
    setFullscreenMedia({ url: mediaUrl, type: mediaType });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleCopyMessage = () => {
    if (selectedMessage?.content) {
      Clipboard.setString(selectedMessage.content);
      setShowContextMenu(false);
      setSelectedMessage(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };


  const handleUnsendMessage = async (messageToUnsend?: Message) => {
    const targetMessage = messageToUnsend || selectedMessage;
    if (!targetMessage) return;

    // Show confirmation alert
    Alert.alert(
      'Unsend Message',
      'This will permanently remove the message for both you and the recipient. You can only unsend messages within 5 minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unsend', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('[Chat] 🔄 Attempting to unsend message:', targetMessage.id);
              
              // Track deletion to prevent polling restoration
              deletedMessageIds.current.add(targetMessage.id);
              
              // Immediately update local state
              setMessages(prev => {
                const filtered = prev.filter(msg => msg.id !== targetMessage.id);
                console.log('[Chat] 📱 Local state updated. Messages before:', prev.length, 'after:', filtered.length);
                return filtered;
              });
              
              // Delete from database with additional conditions to bypass RLS issues
              const { error, count } = await supabase
                .from('messages')
                .delete({ count: 'exact' })
                .eq('id', targetMessage.id)
                .eq('sender_id', user?.id || ''); // Ensure only sender can delete

              if (error) {
                console.error('[Chat] ❌ Database deletion failed:', error);
                // Restore message if database deletion failed
                deletedMessageIds.current.delete(targetMessage.id);
                // Trigger refresh to restore message
                await fetchMessages();
                Alert.alert('Error', 'Failed to delete message from database');
                return;
              }

              console.log('[Chat] ✅ Database deletion successful. Rows affected:', count);
              
              if (count === 0) {
                console.warn('[Chat] ⚠️ No rows were deleted - message may have already been removed');
                Alert.alert('Warning', 'Message was already deleted or not found');
                return;
              }
              
              // Clean up UI state
              setShowContextMenu(false);
              setShowInlineReactions(null);
              setSelectedMessage(null);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              console.log('[Chat] 🎉 Message deletion complete');
            } catch (error) {
              console.error('[Chat] ❌ Unexpected error during deletion:', error);
              // Restore message on error
              deletedMessageIds.current.delete(targetMessage.id);
              await fetchMessages();
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };


  // Check if message can be deleted (within 5 minutes) - only delete is time restricted
  const canUnsendMessage = (message: Message): boolean => {
    if (message.sender_id !== user?.id) {
      return false;
    }
    
    // Check if within 5 minutes
    if (message.created_at) {
      const messageTime = new Date(message.created_at).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      return (now - messageTime) < fiveMinutes;
    }
    
    return false;
  };

  const canEditMessage = (message: Message): boolean => {
    return message.sender_id === user?.id && 
           !!message.content && 
           !message.image_url && 
           !message.audio_url;
  };

  const handleEditMessage = (messageId: string, content: string) => {
    setEditingMessage(messages.find(m => m.id === messageId) || null);
    setEditText(content);
    setShowInlineReactions(null);
  };

  const saveEditedMessage = async () => {
    if (!editingMessage || !editText.trim() || !user?.id) return;

    try {
      setSending(true);
      
      console.log('[Chat] 🔧 Starting message edit:');
      console.log('  - Message ID:', editingMessage.id);
      console.log('  - Original content:', editingMessage.content);
      console.log('  - New content:', editText.trim());
      console.log('  - User ID:', user.id);
      
      const { error } = await supabaseService.editMessage(
        editingMessage.id,
        user.id,
        editText.trim()
      );

      if (error) {
        console.error('[Chat] ❌ Failed to edit message:', error);
        Alert.alert('Error', 'Failed to edit message');
        return;
      }

      console.log('[Chat] ✅ Message edit successful - waiting for real-time update...');
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setEditingMessage(null);
      setEditText('');
      
      // The real-time subscription will handle updating the UI
      
    } catch (error) {
      console.error('[Chat] ❌ Unexpected error editing message:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSending(false);
    }
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setEditText('');
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyingToMessage(message);
    setShowInlineReactions(null);
    setShowContextMenu(false);
    setSelectedMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const cancelReply = () => {
    setReplyingToMessage(null);
  };


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
      console.log('[Chat] 📤 Sending message:', {
        chatId: chatId?.slice(0, 8),
        senderId: user.id.slice(0, 8),
        messageLength: messageText.length,
        replyTo: replyingToMessage?.id?.slice(0, 8) || 'none',
        timestamp: new Date().toISOString()
      });

      // Send message with optional reply reference
      const { data, error } = await supabase
        .from('messages')
        .insert({
          advice_session_id: chatId,
          sender_id: user.id,
          content: messageText,
          reply_to_message_id: replyingToMessage?.id || null,
          is_read: false,
        })
        .select(`
          *,
          reply_to_message:reply_to_message_id (
            id,
            sender_id,
            content,
            image_url,
            audio_url,
            created_at
          )
        `)
        .single();

      if (error) {
        console.error('[Chat] ❌ Error sending message:', error);
        Alert.alert('error', 'failed to send message. please try again.');
        setInputText(messageText); // Restore input
      } else if (data) {
        console.log('[Chat] ✅ Message sent successfully:', {
          messageId: data.id?.slice(0, 8),
          content: data.content?.slice(0, 50) + '...',
          replyTo: replyingToMessage?.id?.slice(0, 8) || 'none'
        });
        
        // Clear reply state after successful send
        setReplyingToMessage(null);
        
        // Don't add message immediately - let polling handle it for consistency
        console.log('[Chat] ✅ Message sent successfully, polling will pick it up');
        
        // Scroll to bottom anticipating the message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 200);
      }
    } catch (error) {
      console.error('[Chat] ❌ Unexpected error sending message:', error);
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
          reply_to_message_id: replyingToMessage?.id || null,
          is_read: false,
        })
        .select(`
          *,
          reply_to_message:reply_to_message_id (
            id,
            sender_id,
            content,
            image_url,
            audio_url,
            created_at
          )
        `)
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

      // Clear reply state after successful send
      setReplyingToMessage(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Error handling voice message:', error);
      Alert.alert('error', 'failed to send voice message. please try again.');
    }
  }, [chatId, user, replyingToMessage]);

  const handleCamera = useCallback(async () => {
    if (!chatId || !user) return;

    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('permission needed', 'we need camera permissions to take photos');
        return;
      }

      // Launch camera for photos and videos
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both photos and videos
        allowsEditing: false,
        quality: 0.8,
        videoMaxDuration: 30, // 30 seconds max for videos
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const uri = asset.uri;
      const isVideo = asset.type === 'video';
      const fileName = `${user.id}/${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;

      // Create FormData for upload
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: isVideo ? 'video/mp4' : 'image/jpeg',
        name: fileName,
      } as any);

      // Upload to Supabase Storage
      const bucketName = 'chat-media';
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, formData, {
          contentType: isVideo ? 'video/mp4' : 'image/jpeg',
        });

      if (uploadError) {
        console.error(`[Chat] Error uploading ${isVideo ? 'video' : 'image'}:`, uploadError);
        Alert.alert('error', `failed to send ${isVideo ? 'video' : 'image'}. please try again.`);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      // Send message with media URL (all media goes in image_url field)
      const { data, error: messageError } = await supabase
        .from('messages')
        .insert({
          advice_session_id: chatId,
          sender_id: user.id,
          image_url: publicUrl,
          reply_to_message_id: replyingToMessage?.id || null,
          is_read: false,
        })
        .select(`
          *,
          reply_to_message:reply_to_message_id (
            id,
            sender_id,
            content,
            image_url,
            audio_url,
            created_at
          )
        `)
        .single();


      if (messageError) {
        console.error(`[Chat] Error sending ${isVideo ? 'video' : 'image'} message:`, messageError);
        Alert.alert('error', `failed to send ${isVideo ? 'video' : 'image'}. please try again.`);
        return;
      }

      // Add to messages immediately
      if (data) {
        setMessages((prev) => [...prev, data]);
      }

      // Clear reply state after successful send
      setReplyingToMessage(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[Chat] Error taking photo/video:', error);
      Alert.alert('error', 'failed to send media. please try again.');
    }
  }, [chatId, user, replyingToMessage]);

  const handleImagePick = useCallback(async () => {
    if (!chatId || !user) return;

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('permission needed', 'we need camera roll permissions to share photos and videos');
        return;
      }

      // Pick image or video
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
        allowsEditing: false,
        allowsMultipleSelection: true, // Enable multiple selection
        quality: 0.8,
        videoMaxDuration: 30, // 30 seconds max for videos
      });

      if (result.canceled) return;

      // Process multiple files
      for (const asset of result.assets) {
        try {
          const uri = asset.uri;
          const isVideo = asset.type === 'video';
          const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${isVideo ? 'mp4' : 'jpg'}`;

          // Create FormData for upload
          const formData = new FormData();
          formData.append('file', {
            uri: uri,
            type: isVideo ? 'video/mp4' : 'image/jpeg',
            name: fileName,
          } as any);

          // Upload to Supabase Storage
          const bucketName = 'chat-media';
          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(fileName, formData, {
              contentType: isVideo ? 'video/mp4' : 'image/jpeg',
            });

          if (uploadError) {
            console.error(`[Chat] Error uploading ${isVideo ? 'video' : 'image'}:`, uploadError);
            continue; // Continue with other files
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);

          // Send message with media URL (all media goes in image_url field)
          const { data, error: messageError } = await supabase
            .from('messages')
            .insert({
              advice_session_id: chatId,
              sender_id: user.id,
              image_url: publicUrl,
              reply_to_message_id: replyingToMessage?.id || null,
              is_read: false,
            })
            .select(`
              *,
              reply_to_message:reply_to_message_id (
                id,
                sender_id,
                content,
                image_url,
                audio_url,
                created_at
              )
            `)
            .single();

          if (messageError) {
            console.error(`[Chat] Error sending ${isVideo ? 'video' : 'image'} message:`, messageError);
            continue; // Continue with other files
          }

          // Add to messages immediately
          if (data) {
            setMessages((prev) => [...prev, data]);
          }

          // Small delay between uploads to avoid overwhelming
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error('[Chat] Error processing file:', error);
          continue;
        }
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[Chat] Error picking media:', error);
      Alert.alert('error', 'failed to send media. please try again.');
    }
  }, [chatId, user, replyingToMessage]);


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
          reply_to_message_id: replyingToMessage?.id || null,
          is_read: false,
        })
        .select(`
          *,
          reply_to_message:reply_to_message_id (
            id,
            sender_id,
            content,
            image_url,
            audio_url,
            created_at
          )
        `)
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

      // Clear reply state after successful send
      setReplyingToMessage(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('[Chat] Error sending GIF:', error);
      Alert.alert('error', 'failed to send gif. please try again.');
    }
  }, [chatId, user, replyingToMessage]);

  const handleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      // Get current message
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const reactions = message.reactions || [];

      // Check if user already reacted with this emoji
      const existingReactionIndex = reactions.findIndex(
        (r: any) => r.user_id === user.id && r.emoji === emoji
      );

      let updatedReactions;
      if (existingReactionIndex >= 0) {
        // Remove reaction
        updatedReactions = reactions.filter((_: any, i: number) => i !== existingReactionIndex);
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
    // Check if image_url contains a video file (by extension)
    const isVideo = isVideoUrl(item.image_url);
    const isImage = (!!item.image_url && !isVideo); // Image only if not a video
    
    // Debug: Log what type of message this is
    if (item.image_url || item.audio_url) {
      console.log('[Chat] 📱 Message type detection:', {
        id: item.id?.slice(0, 8),
        hasImageUrl: !!item.image_url,
        hasAudioUrl: !!item.audio_url,
        isVideo,
        isImage,
        isVoice,
        imageUrl: item.image_url?.slice(0, 50)
      });
    }

    // Check if this is the last message from me
    const isLastFromMe = isMe && !messages.slice(index + 1).some(m => m.sender_id === user?.id);

    // Message grouping logic (iMessage style)
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const nextMessage = index < messages.length - 1 ? messages[index + 1] : null;

    const isSameSenderAsPrev = prevMessage?.sender_id === item.sender_id;
    const isSameSenderAsNext = nextMessage?.sender_id === item.sender_id;

    // Check if within 2 minutes of previous message
    const timeDiffPrev = prevMessage
      ? (new Date(item.created_at || 0).getTime() - new Date(prevMessage.created_at || 0).getTime()) / 1000 / 60
      : 999;

    const timeDiffNext = nextMessage
      ? (new Date(nextMessage.created_at || 0).getTime() - new Date(item.created_at || 0).getTime()) / 1000 / 60
      : 999;

    const isGroupedWithPrev = isSameSenderAsPrev && timeDiffPrev < 2;
    const isGroupedWithNext = isSameSenderAsNext && timeDiffNext < 2;

    const isFirstInGroup = !isGroupedWithPrev;
    const isLastInGroup = !isGroupedWithNext;
    const shouldShowTimestamp = timeDiffPrev > 30; // Show if >30 minutes apart from any message

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
              {new Date(item.created_at || 0).toLocaleDateString('en-US', {
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
          !isFirstInGroup && styles.groupedMessage,
          // Apply strong dimming to non-selected messages (for 75% cases without center animation)
          showInlineReactions && showInlineReactions !== item.id && styles.strongDimmedMessage,
          // Elevate selected message (iPhone-style floating effect) - ensure it's above blur overlay
          showInlineReactions === item.id && styles.elevatedMessage
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
            // Close any open inline menus first
            if (showInlineReactions) {
              setShowInlineReactions(null);
              return;
            }
            
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
            
            // Show inline reactions first
            setShowInlineReactions(item.id);
            setShowReactionPicker(null);
            setShowContextMenu(false);
            
            // Center the message after a brief delay for layout
            setTimeout(() => {
              const messageIndex = messages.findIndex(m => m.id === item.id);
              if (messageIndex !== -1 && flatListRef.current) {
                try {
                  flatListRef.current.scrollToIndex({
                    index: messageIndex,
                    animated: true,
                    viewPosition: 0.5, // Center the message
                  });
                  console.log('[Chat] 📍 Centered message at index:', messageIndex);
                } catch (error) {
                  console.log('[Chat] ⚠️ Could not center message:', error);
                  // Fallback to scrollToOffset
                  flatListRef.current.scrollToOffset({
                    offset: messageIndex * 60, // Approximate message height
                    animated: true,
                  });
                }
              }
            }, 100);
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
          ) : isVideo ? (
            <View style={styles.videoContainer}>
              {/* Video background - double tap for fullscreen */}
              <Pressable 
                style={styles.videoFullscreenZone}
                onPress={() => {
                  const now = Date.now();
                  const lastTap = item.id + '_fullscreen_lastTap';
                  const lastTapTime = (global as any)[lastTap] || 0;
                  
                  if (now - lastTapTime < 300) {
                    // Double tap detected - go fullscreen
                    if (item.image_url) {
                      handleDoubleTap(item.image_url, 'video');
                    }
                    // Clear the timestamp to prevent triple-tap issues
                    (global as any)[lastTap] = 0;
                  } else {
                    // Single tap - just store timestamp, no action
                    (global as any)[lastTap] = now;
                  }
                }}
                onLongPress={() => handleLongPress(item)}
              >
                <Video
                  source={{ uri: item.image_url || '' }}
                  style={styles.messageVideo}
                  resizeMode={ResizeMode.COVER}
                  shouldPlay={playingVideos.has(item.id)}
                  isLooping={false}
                  useNativeControls={false}
                />
              </Pressable>
              
              {/* Play/pause button overlay - separate interaction zone */}
              <View style={[styles.videoOverlay, playingVideos.has(item.id) && styles.videoOverlayPlaying]} pointerEvents="box-none">
                <TouchableOpacity 
                  style={styles.playPauseButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    toggleVideoPlayback(item.id);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name={playingVideos.has(item.id) ? "pause" : "play"} 
                    size={24} 
                    color="white" 
                  />
                </TouchableOpacity>
              </View>
            </View>
          ) : isImage ? (
            <Pressable 
              onPress={() => {
                const now = Date.now();
                const lastTap = item.id + '_image_lastTap';
                const lastTapTime = (global as any)[lastTap] || 0;
                
                if (now - lastTapTime < 300) {
                  // Double tap detected - go fullscreen
                  if (item.image_url) {
                    handleDoubleTap(item.image_url, 'image');
                  }
                  // Clear the timestamp to prevent triple-tap issues
                  (global as any)[lastTap] = 0;
                } else {
                  // Single tap - just store timestamp, no action
                  (global as any)[lastTap] = now;
                }
              }}
              onLongPress={() => handleLongPress(item)}
            >
              <Image
                source={{ uri: item.image_url || undefined }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </Pressable>
          ) : (
            <View style={{
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
            }}>
              {/* Reply Preview - OUTSIDE message bubble */}
              {item.reply_to_message && (
                <ReplyPreview
                  replyToMessage={item.reply_to_message}
                  currentUserId={user?.id || ''}
                  session={session}
                  isMyMessage={isMe}
                  colors={colors}
                  onPress={() => {
                    // Scroll to replied message
                    const replyIndex = messages.findIndex(m => m.id === item.reply_to_message?.id);
                    if (replyIndex !== -1 && flatListRef.current) {
                      flatListRef.current.scrollToIndex({ 
                        index: replyIndex, 
                        animated: true,
                        viewPosition: 0.5 
                      });
                    }
                  }}
                />
              )}
              {/* Message bubble */}
              <View style={[
                styles.messageBubble,
                {
                  backgroundColor: isMe ? colors.primary : '#E5E5EA',
                  borderColor: colors.border,
                  zIndex: showInlineReactions === item.id ? 1001 : 1, // Elevate selected message
                }
              ]}>
                <Text style={[
                  styles.messageText,
                  { color: isMe ? 'white' : '#000000' }
                ]}>
                  {/* Filter out accidental URL messages */}
                  {item.content && !item.content.includes('supabase.co/storage') ? item.content : '[message error]'}
                  {item.edited_at && (
                    <Text style={[styles.editedIndicator, { color: isMe ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                      {' '}(edited)
                    </Text>
                  )}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* Inline Reaction Menu - Shows directly below message */}
        {showInlineReactions === item.id && (
          <View style={[
            styles.inlineReactionMenu, 
            { 
              backgroundColor: colors.surface,
              borderColor: colors.border,
              alignSelf: isMe ? 'flex-end' : 'flex-start',
              shadowColor: colors.text,
              zIndex: 1001, // Above blur overlay
            }
          ]}>
            {/* Scrollable Emoji Reactions */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.emojiScrollView}
              contentContainerStyle={styles.emojiScrollContent}
            >
              {[
                '❤️', '👍', '👎', '😂', '😮', '😢', '🔥', '🎉', '👏', '💯', 
                '😍', '🥰', '😘', '🤗', '🤔', '😊', '😎', '🙃', '😇', '🤩',
                '💪', '🙏', '✨', '⭐', '🌟', '💫', '🏆', '🎯', '💕', '💖'
              ].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.scrollableEmojiButton}
                  onPress={() => {
                    handleReaction(item.id, emoji);
                    setShowInlineReactions(null);
                  }}
                >
                  <Text style={styles.scrollableEmojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
              
              {/* Plus button for more emojis */}
              <TouchableOpacity
                style={styles.emojiPlusButton}
                onPress={() => {
                  setEmojiForMessage(item.id);
                  setShowEmojiPicker(true);
                  setShowInlineReactions(null);
                }}
              >
                <Ionicons name="add" size={18} color={colors.primary} />
              </TouchableOpacity>
            </ScrollView>
            
            {/* Action Buttons Row */}
            {(() => {
              // Calculate which buttons should show
              const showUnsend = canUnsendMessage(item);
              const showEdit = canEditMessage(item);
              const showCopy = !!(item.content || item.image_url);
              
              // Equal flex distribution for all buttons
              const flexValue = 1;
              
              return (
                <View style={styles.inlineActionRow}>
                  {/* Unsend button */}
                  {showUnsend && (
                    <TouchableOpacity 
                      style={[styles.modernActionButton, { flex: flexValue }]}
                      onPress={() => {
                        handleUnsendMessage(item);
                        setShowInlineReactions(null);
                      }}
                    >
                      <Ionicons name="arrow-undo" size={16} color="#000000" />
                      <Text style={[styles.modernActionText, { color: '#000000' }]}>Unsend</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Edit button */}
                  {showEdit && (
                    <TouchableOpacity 
                      style={[styles.modernActionButton, { flex: flexValue }]}
                      onPress={() => {
                        handleEditMessage(item.id, item.content || '');
                      }}
                    >
                      <Ionicons name="pencil" size={16} color={colors.text} />
                      <Text style={[styles.modernActionText, { color: colors.text }]}>Edit</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Reply button */}
                  <TouchableOpacity 
                    style={[styles.modernActionButton, { flex: flexValue }]}
                    onPress={() => {
                      handleReplyToMessage(item);
                    }}
                  >
                    <Ionicons name="arrow-undo-outline" size={16} color={colors.text} />
                    <Text style={[styles.modernActionText, { color: colors.text }]}>Reply</Text>
                  </TouchableOpacity>
                  
                  {/* Copy button */}
                  {showCopy && (
                    <TouchableOpacity 
                      style={[styles.modernActionButton, { flex: flexValue }]}
                      onPress={() => {
                        if (item.content) {
                          Clipboard.setString(item.content);
                        } else if (item.image_url) {
                          Clipboard.setString(item.image_url);
                        }
                        setShowInlineReactions(null);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Ionicons name="copy" size={16} color={colors.text} />
                      <Text style={[styles.modernActionText, { color: colors.text }]}>Copy</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}
            
            {/* Close X button - positioned better */}
            <TouchableOpacity 
              style={styles.modernCloseButton}
              onPress={() => setShowInlineReactions(null)}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {visibleTimestamps.has(item.id) && (
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {new Date(item.created_at || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              item.reactions.reduce((acc: any, reaction: any) => {
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
                {(count as number) > 1 && <Text style={[styles.reactionCount, { color: colors.text }]}>{count as number}</Text>}
              </TouchableOpacity>
            ))}
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
              <Text style={[styles.headerSubtitle, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {session.status === 'active' && (user?.id === session.student_id || user?.id === session.mentor_id) && (
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

      {/* Enhanced Original Question Context */}
      {session.questions && (
        <View style={[styles.enhancedQuestionContext, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.text }]}>
          {/* Question Header */}
          <View style={styles.enhancedQuestionHeader}>
            <View style={styles.questionCategoryRow}>
              <Text style={styles.questionEmoji}>
                {categoryName === 'dating & relationships' ? '💕' : 
                 categoryName === 'career & internships' ? '💼' :
                 categoryName === 'academics' ? '📚' :
                 categoryName === 'mental health' ? '🧠' :
                 categoryName === 'finance' ? '💰' : '💭'}
              </Text>
              <View style={[styles.enhancedCategoryBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                <Text style={[styles.enhancedCategoryText, { color: colors.primary }]}>
                  {categoryName}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.collapseButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowQuestionContext(!showQuestionContext);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showQuestionContext ? "chevron-up" : "chevron-down"}
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Question Title */}
          <Text style={[styles.enhancedQuestionTitle, { color: colors.text }]}>
            {user?.id === session.student_id ? 'my question' : session.questions.title}
          </Text>

          {/* Question Content */}
          {showQuestionContext && session.questions.content && (
            <View style={[styles.enhancedQuestionBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.enhancedQuestionLabel, { color: colors.primary }]}>
                💭 Full question:
              </Text>
              <Text style={[styles.enhancedQuestionContent, { color: colors.textSecondary }]}>
                {session.questions.content}
              </Text>
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

      {/* Background Blur - Only for bottom 25% messages, excludes selected message area */}
      {showInlineReactions && (() => {
        const selectedMessage = messages.find(msg => msg.id === showInlineReactions);
        if (!selectedMessage) return null;
        
        // Calculate if message is in bottom 25% of chat
        const messageIndex = messages.findIndex(msg => msg.id === showInlineReactions);
        const totalMessages = messages.length;
        const isInBottomTwentyFive = messageIndex >= (totalMessages * 0.75);
        
        // Only blur background for bottom 25% messages
        return isInBottomTwentyFive ? (
          <View style={styles.backgroundBlurOverlay} pointerEvents="none" />
        ) : null;
      })()}

      {/* iPhone-style Animated Message Container - Only for bottom 25% */}
      {showInlineReactions && (() => {
        const selectedMessage = messages.find(msg => msg.id === showInlineReactions);
        if (!selectedMessage) return null;
        
        const isMe = selectedMessage.sender_id === user?.id;
        const isVideo = isVideoUrl(selectedMessage.image_url) && !selectedMessage.content;
        const isImage = selectedMessage.image_url && !isVideo && !selectedMessage.content;
        const isVoice = selectedMessage.audio_url && !selectedMessage.content;

        // Calculate if message is in bottom 25% of chat
        const messageIndex = messages.findIndex(msg => msg.id === showInlineReactions);
        const totalMessages = messages.length;
        const isInBottomTwentyFive = messageIndex >= (totalMessages * 0.75);
        
        // Only use animated container for bottom 25%, otherwise return null (use original inline reactions)
        if (!isInBottomTwentyFive) return null;
        
        // Use conditional container style based on position
        const containerStyle = styles.animatedMessageContainer;

        return (
          <View style={containerStyle}>
            {/* Message maintains left/right alignment but moves up to center */}
            <View style={[
              styles.animatedMessageWrapper,
              isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }
            ]}>
              <View style={[
                styles.messageContainer,
                isMe ? styles.myMessage : styles.theirMessage,
                styles.animatedMessage,
                { 
                  backgroundColor: 'transparent',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }
              ]}>
                {isImage ? (
                  <Pressable 
                    onPress={() => {
                      const now = Date.now();
                      const lastTap = selectedMessage.id + '_context_image_lastTap';
                      const lastTapTime = (global as any)[lastTap] || 0;
                      
                      if (now - lastTapTime < 300) {
                        // Double tap detected - go fullscreen
                        if (selectedMessage.image_url) {
                          handleDoubleTap(selectedMessage.image_url, 'image');
                        }
                        (global as any)[lastTap] = 0;
                      } else {
                        // Single tap - just store timestamp
                        (global as any)[lastTap] = now;
                      }
                    }}
                    onLongPress={() => handleLongPress(selectedMessage)}
                  >
                    <Image
                      source={{ uri: selectedMessage.image_url || undefined }}
                      style={[styles.messageImage, { maxWidth: 280 }]}
                      resizeMode="cover"
                    />
                  </Pressable>
                ) : isVideo ? (
                  <View style={styles.videoContainer}>
                    <Pressable 
                      style={styles.videoFullscreenZone}
                      onPressIn={() => {
                        // Track press timing for double-tap detection for fullscreen
                        const now = Date.now();
                        const lastTap = selectedMessage.id + '_context_video_fullscreen_lastTap';
                        const lastTapTime = (global as any)[lastTap] || 0;
                        
                        if (now - lastTapTime < 300) {
                          // Double tap detected for fullscreen
                          if (selectedMessage.image_url) handleDoubleTap(selectedMessage.image_url, 'video');
                        } else {
                          // Single tap on fullscreen zone - do nothing
                          (global as any)[lastTap] = now;
                        }
                      }}
                      onLongPress={() => handleLongPress(selectedMessage)}
                    >
                      <Video
                        source={{ uri: selectedMessage.image_url || '' }}
                        style={[styles.messageVideo, { maxWidth: 280 }]}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={playingVideos.has(selectedMessage.id)}
                        useNativeControls={false}
                      />
                      <View style={[styles.videoOverlay, playingVideos.has(selectedMessage.id) && styles.videoOverlayPlaying]}>
                        <TouchableOpacity 
                          style={styles.playPauseButton}
                          onPress={(event) => {
                            event.stopPropagation();
                            toggleVideoPlayback(selectedMessage.id);
                          }}
                        >
                          <Ionicons 
                            name={playingVideos.has(selectedMessage.id) ? "pause" : "play"} 
                            size={24} 
                            color="white" 
                          />
                        </TouchableOpacity>
                      </View>
                    </Pressable>
                  </View>
                ) : (
                  <View style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: 280,
                  }}>
                    {/* Reply Preview - OUTSIDE message bubble */}
                    {selectedMessage.reply_to_message && (
                      <ReplyPreview
                        replyToMessage={selectedMessage.reply_to_message}
                        currentUserId={user?.id || ''}
                        session={session}
                        isMyMessage={isMe}
                        colors={colors}
                        onPress={() => {
                          // Close inline reactions and scroll to replied message
                          setShowInlineReactions(null);
                          const replyIndex = messages.findIndex(m => m.id === selectedMessage.reply_to_message?.id);
                          if (replyIndex !== -1 && flatListRef.current) {
                            flatListRef.current.scrollToIndex({ 
                              index: replyIndex, 
                              animated: true,
                              viewPosition: 0.5 
                            });
                          }
                        }}
                      />
                    )}
                    {/* Message bubble */}
                    <View style={[
                      styles.messageBubble,
                      {
                        backgroundColor: isMe ? colors.primary : '#E5E5EA',
                        borderColor: colors.border,
                      }
                    ]}>
                      <Text style={[
                        styles.messageText,
                        { color: isMe ? '#FFFFFF' : '#000000' }
                      ]}>
                        {selectedMessage.content || '[message error]'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
              
              {/* Reaction Menu positioned below the message */}
              <View style={[
                styles.centeredReactionMenu,
                { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  shadowColor: colors.text,
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                }
              ]}>
                {/* Scrollable Emoji Row */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.emojiScrollView}
                  contentContainerStyle={styles.emojiScrollContent}
                >
                  {['❤️', '👍', '👎', '😂', '😮', '😢', '😡', '🔥', '💯', '🎉', '❓', '💀'].map((emoji) => (
                    <TouchableOpacity
                      key={emoji}
                      style={styles.scrollableEmojiButton}
                      onPress={() => {
                        handleReaction(selectedMessage.id, emoji);
                        setShowInlineReactions(null);
                      }}
                    >
                      <Text style={styles.scrollableEmojiText}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Plus button for more emojis */}
                  <TouchableOpacity
                    style={styles.emojiPlusButton}
                    onPress={() => {
                      setEmojiForMessage(selectedMessage.id);
                      setShowEmojiPicker(true);
                      setShowInlineReactions(null);
                    }}
                  >
                    <Ionicons name="add" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </ScrollView>
                
                {/* Action Buttons Row */}
                {(() => {
                  // Calculate which buttons should show
                  const showUnsend = canUnsendMessage(selectedMessage);
                  const showCopy = !!(selectedMessage.content || selectedMessage.image_url);
                  
                  return (
                    <View style={styles.inlineActionRow}>
                      {showCopy && (
                        <TouchableOpacity 
                          style={[styles.modernActionButton, { flex: 1 }]}
                          onPress={async () => {
                            try {
                              if (selectedMessage.content) {
                                Clipboard.setString(selectedMessage.content);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                console.log('[Chat] 📋 Text copied to clipboard');
                              } else if (selectedMessage.image_url) {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                Alert.alert('Copied', 'Image URL copied to clipboard');
                                Clipboard.setString(selectedMessage.image_url);
                              }
                              setShowInlineReactions(null);
                            } catch (error) {
                              console.error('[Chat] Error copying to clipboard:', error);
                            }
                          }}
                        >
                          <Ionicons name="copy" size={16} color={colors.text} />
                          <Text style={[styles.modernActionText, { color: colors.text }]}>Copy</Text>
                        </TouchableOpacity>
                      )}
                      
                      {showUnsend && (
                        <TouchableOpacity 
                          style={[styles.modernActionButton, { flex: 1 }]}
                          onPress={() => {
                            handleUnsendMessage(selectedMessage);
                            setShowInlineReactions(null);
                          }}
                        >
                          <Ionicons name="arrow-undo" size={16} color="#000000" />
                          <Text style={[styles.modernActionText, { color: '#000000' }]}>Unsend</Text>
                        </TouchableOpacity>
                      )}
                      
                      {/* Reply button */}
                      <TouchableOpacity 
                        style={[styles.modernActionButton, { flex: 1 }]}
                        onPress={() => {
                          handleReplyToMessage(selectedMessage);
                        }}
                      >
                        <Ionicons name="arrow-undo-outline" size={16} color={colors.text} />
                        <Text style={[styles.modernActionText, { color: colors.text }]}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })()}
                
                {/* Close X button - positioned better */}
                <TouchableOpacity 
                  style={styles.modernCloseButton}
                  onPress={() => setShowInlineReactions(null)}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })()}

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


      {/* Edit Interface */}
      {editingMessage && (
        <View style={[styles.editContainer, { backgroundColor: colors.surface, borderTopColor: colors.separator }]}>
          <View style={styles.editMessagePreview}>
            <View style={[styles.editLine, { backgroundColor: colors.primary }]} />
            <Text style={[styles.editPreviewText, { color: colors.textSecondary }]} numberOfLines={1}>
              Editing message: {editingMessage.content}
            </Text>
          </View>
          <TouchableOpacity onPress={cancelEdit} style={styles.editCancel}>
            <Ionicons name="close" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Reply Preview */}
      {replyingToMessage && (
        <View style={[styles.replyPreviewContainer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={[styles.replyLine, { backgroundColor: colors.primary }]} />
          <View style={styles.replyContent}>
            <Text style={[styles.replyingToText, { color: colors.primary }]}>
              Replying to {replyingToMessage.sender_id === user?.id ? 'yourself' : (
                replyingToMessage.sender_id === session?.mentor_id 
                  ? (session?.mentors?.full_name || 'Wizzmo')
                  : (session?.students?.full_name || 'User')
              )}
            </Text>
            <Text style={[styles.replyMessageText, { color: colors.text }]} numberOfLines={1}>
              {replyingToMessage.content || 
               (replyingToMessage.image_url ? '📷 Photo' : '') ||
               (replyingToMessage.audio_url ? '🎤 Voice message' : 'Message')}
            </Text>
          </View>
          <TouchableOpacity style={styles.cancelReplyButton} onPress={cancelReply}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
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
                placeholder={editingMessage ? "edit message..." : "message..."}
                placeholderTextColor={colors.textTertiary}
                value={editingMessage ? editText : inputText}
                onChangeText={editingMessage ? setEditText : handleTyping}
                multiline
                maxLength={500}
                editable={!sending}
              />
            </>
          )}

          {editingMessage ? (
            // Edit mode: Show save and cancel buttons
            <View style={styles.editButtonsRow}>
              <TouchableOpacity
                style={[styles.editCancelButton, { borderColor: colors.border }]}
                onPress={cancelEdit}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.editSaveButton,
                  { backgroundColor: editText.trim() ? colors.primary : colors.textTertiary }
                ]}
                onPress={saveEditedMessage}
                disabled={sending || !editText.trim()}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          ) : (inputText.trim().length === 0 ? (
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
          ))}
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
        mentorName={otherPersonName || 'your advisor'}
        mentorId={session.mentor_id}
        showFavorite={user?.id === session.student_id}
      />

      {/* GIF Picker */}
      <GifPicker
        visible={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onSelectGif={handleGifSelect}
      />

      {/* Fullscreen Media Modal */}
      <FullscreenMediaModal
        visible={!!fullscreenMedia}
        onClose={closeFullscreenMedia}
        mediaUrl={fullscreenMedia?.url || ''}
        mediaType={fullscreenMedia?.type || 'image'}
      />

      {/* Apple-Style Context Menu Modal - DISABLED in favor of inline reactions */}
      <Modal
        visible={false}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowContextMenu(false)}
      >
        <Pressable 
          style={styles.contextMenuOverlay}
          onPress={() => setShowContextMenu(false)}
        >
          <View style={[styles.appleContextMenu, { backgroundColor: colors.surface }]}>
            {/* Quick Reactions Row */}
            <View style={styles.quickReactionsRow}>
              {['💖', '👍', '👎', '😂', '‼️', '❓'].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.quickReaction}
                  onPress={() => {
                    if (selectedMessage) {
                      handleReaction(selectedMessage.id, emoji);
                    }
                    setShowContextMenu(false);
                    setSelectedMessage(null);
                  }}
                >
                  <Text style={styles.quickReactionEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Items */}
            <View style={styles.contextMenuActions}>

              <TouchableOpacity 
                style={styles.appleMenuItem}
                onPress={() => {
                  handleCopyMessage();
                }}
              >
                <Text style={[styles.appleMenuText, { color: colors.text }]}>Copy</Text>
              </TouchableOpacity>


              {selectedMessage && canUnsendMessage(selectedMessage) && (
                <TouchableOpacity 
                  style={styles.appleMenuItem}
                  onPress={() => {
                    handleUnsendMessage();
                  }}
                >
                  <Text style={[styles.appleMenuText, { color: "#000000" }]}>Unsend...</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* Native Emoji Picker */}
      <Modal
        visible={showEmojiPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <View style={styles.emojiPickerOverlay}>
          <View style={[styles.emojiPickerContainer, { backgroundColor: colors.background }]}>
            <View style={styles.emojiPickerHeader}>
              <Text style={[styles.emojiPickerTitle, { color: colors.text }]}>Add Reaction</Text>
              <TouchableOpacity 
                style={styles.emojiPickerClose}
                onPress={() => setShowEmojiPicker(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.emojiInputContainer}>
              <TextInput
                style={[styles.emojiInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Type or select an emoji"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                onChangeText={(text) => {
                  if (text.length > 0 && emojiForMessage) {
                    // Get the last character (emoji)
                    const emoji = text.slice(-1);
                    handleReaction(emojiForMessage, emoji);
                    setShowEmojiPicker(false);
                    setEmojiForMessage(null);
                  }
                }}
                multiline={false}
                returnKeyType="done"
                onSubmitEditing={() => setShowEmojiPicker(false)}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 60, // Extra padding to see delivered status below last message
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

  // Enhanced Question Context Styles
  enhancedQuestionContext: {
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  enhancedQuestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questionEmoji: {
    fontSize: 20,
  },
  enhancedCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  enhancedCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  collapseButton: {
    padding: 4,
  },
  enhancedQuestionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 24,
    marginBottom: 8,
  },
  enhancedQuestionBox: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginTop: 8,
  },
  enhancedQuestionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
    marginBottom: 6,
  },
  enhancedQuestionContent: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 22,
  },


  // Apple-style context menu styles
  contextMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appleContextMenu: {
    minWidth: 280,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  quickReactionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  quickReaction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickReactionEmoji: {
    fontSize: 18,
  },
  contextMenuActions: {
    paddingVertical: 8,
  },
  appleMenuItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  appleMenuText: {
    fontSize: 17,
    fontWeight: '400',
  },

  // Enhanced emoji picker styles
  reactionScrollContent: {
    paddingHorizontal: 8,
    gap: 4,
  },


  // Subtle dimming for non-selected messages  
  dimmedMessage: {
    opacity: 0.6, // Much more subtle dimming
  },

  // Strong dimming for non-selected messages (75% cases)
  strongDimmedMessage: {
    opacity: 0.15, // Much stronger dimming for better contrast with selected message
  },
  
  // Selected message elevation - appears above blur overlay
  elevatedMessage: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001, // Above blur overlay (which is at 1000)
    position: 'relative',
  },

  // Modern inline reaction menu styles
  inlineReactionMenu: {
    position: 'relative',
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    maxWidth: '90%',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 2000, // Much higher z-index
  },
  emojiScrollView: {
    maxHeight: 70, // Increased for better scrolling
    marginBottom: 12,
  },
  emojiScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  scrollableEmojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  scrollableEmojiText: {
    fontSize: 20,
  },
  emojiPlusButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderStyle: 'dashed',
  },
  inlineActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  modernActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center content within each button
    paddingVertical: 8,
    paddingHorizontal: 4, // Reduced padding since we're using flex
    marginHorizontal: 4, // Small margin between buttons
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    gap: 6,
  },
  modernActionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  modernCloseButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
  },

  // iPhone-style edit interface
  iphoneEditContainer: {
    position: 'relative',
    width: '100%',
  },
  iphoneEditCancel: {
    position: 'absolute',
    left: -12,
    top: '50%',
    transform: [{ translateY: -16 }],
    zIndex: 10,
  },
  iphoneCancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iphoneEditInput: {
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    minHeight: 44,
    textAlignVertical: 'top',
    marginHorizontal: 40, // Space for buttons
  },
  iphoneEditSave: {
    position: 'absolute',
    right: -12,
    top: '50%',
    transform: [{ translateY: -16 }],
    zIndex: 10,
  },
  iphoneSaveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iphoneEditDelivered: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'right',
    marginRight: 40,
  },

  

  // Background blur overlay for bottom 25% messages (doesn't cover selected message)
  backgroundBlurOverlay: {
    position: 'absolute',
    top: 120, // Start below header
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.65)', // 65% opacity blur for bottom 25%
    zIndex: 900, // Below selected message
  },

  // iPhone-style animated message container (for bottom 20% messages)
  animatedMessageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingHorizontal: 20,
    zIndex: 1002, // Above blur overlay
  },
  
  animatedMessageWrapper: {
    justifyContent: 'center',
    minHeight: 200, // Ensure space for message + menu
  },
  
  // In-place container (for messages not in bottom 20%)
  inPlaceMessageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingHorizontal: 20,
    paddingTop: 200, // Offset from top, can be adjusted
    zIndex: 1002, // Above blur overlay
  },
  
  inPlaceWrapper: {
    minHeight: 200, // Ensure space for message + menu
  },
  
  animatedMessage: {
    transform: [{ scale: 1.02 }], // Slightly larger for emphasis
    marginBottom: 12, // Space between message and reaction menu
  },

  // Centered reaction menu below the animated message
  centeredReactionMenu: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    paddingBottom: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 1003,
    maxWidth: 320,
  },

  // Emoji Picker Modal Styles
  emojiPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  emojiPickerContainer: {
    height: 500,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  emojiPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emojiPickerClose: {
    padding: 4,
  },
  emojiInputContainer: {
    padding: 20,
    paddingTop: 10,
  },
  emojiInput: {
    fontSize: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    minHeight: 50,
  },

  videoContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 4,
  },
  messageVideo: {
    width: 200,
    height: 150,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  videoOverlayPlaying: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  videoFullscreenZone: {
    position: 'relative',
  },
  playPauseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Edit functionality styles
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  editMessagePreview: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  editButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editCancelButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  editSaveButton: {
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editedIndicator: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  editLine: {
    width: 2,
    height: 20,
    borderRadius: 1,
    marginRight: 8,
  },
  editPreviewText: {
    fontSize: 12,
    fontWeight: '400',
    flex: 1,
  },
  editCancel: {
    padding: 4,
    marginLeft: 8,
  },
  
  // Reply preview styles
  replyPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    minHeight: 60,
  },
  replyLine: {
    width: 3,
    height: 36,
    borderRadius: 1.5,
    marginRight: 12,
  },
  replyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  replyingToText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyMessageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  cancelReplyButton: {
    padding: 4,
    marginLeft: 8,
  },
});

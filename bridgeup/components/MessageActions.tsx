import React from 'react';
import {
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  sender_id: string;
  content?: string | null;
  image_url?: string | null;
  audio_url?: string | null;
  created_at?: string | null;
}

interface MessageActionsProps {
  message: Message;
  currentUserId: string;
  onSuccess: () => void;
  colors: any;
}

interface EditButtonProps extends MessageActionsProps {
  onEdit: (messageId: string, content: string) => void;
}

interface ReplyButtonProps extends MessageActionsProps {
  onReply: (message: Message) => void;
}


export const UnsendButton: React.FC<MessageActionsProps> = ({
  message,
  currentUserId,
  onSuccess,
  colors,
}) => {
  const canUnsendMessage = (msg: Message): boolean => {
    if (msg.sender_id !== currentUserId) return false;
    
    if (msg.created_at) {
      const messageTime = new Date(msg.created_at).getTime();
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      return (now - messageTime) < fiveMinutes;
    }
    
    return false;
  };

  const handleUnsend = async () => {
    if (!canUnsendMessage(message)) return;

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
              const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', message.id)
                .eq('sender_id', currentUserId);

              if (error) {
                console.error('Failed to delete message:', error);
                Alert.alert('Error', 'Failed to delete message');
                return;
              }

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSuccess();
            } catch (error) {
              console.error('Unexpected error:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          }
        }
      ]
    );
  };

  if (!canUnsendMessage(message)) return null;

  return (
    <TouchableOpacity 
      style={[styles.actionButton, { flex: 1 }]}
      onPress={handleUnsend}
    >
      <Ionicons name="arrow-undo" size={16} color="#000000" />
      <Text style={[styles.actionText, { color: '#000000' }]}>Unsend</Text>
    </TouchableOpacity>
  );
};

export const EditButton: React.FC<EditButtonProps> = ({
  message,
  currentUserId,
  onSuccess,
  colors,
  onEdit,
}) => {
  const canEditMessage = (msg: Message): boolean => {
    return msg.sender_id === currentUserId && 
           !!msg.content && 
           !msg.image_url && 
           !msg.audio_url;
  };

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit(message.id, message.content || '');
    onSuccess();
  };

  if (!canEditMessage(message)) return null;

  return (
    <TouchableOpacity 
      style={[styles.actionButton, { flex: 1 }]}
      onPress={handleEdit}
    >
      <Ionicons name="pencil" size={16} color="#000000" />
      <Text style={[styles.actionText, { color: '#000000' }]}>Edit</Text>
    </TouchableOpacity>
  );
};

export const ReplyButton: React.FC<ReplyButtonProps> = ({
  message,
  currentUserId,
  onSuccess,
  colors,
  onReply,
}) => {
  const handleReply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReply(message);
    onSuccess();
  };

  return (
    <TouchableOpacity 
      style={[styles.actionButton, { flex: 1 }]}
      onPress={handleReply}
    >
      <Ionicons name="arrow-undo-outline" size={16} color="#000000" />
      <Text style={[styles.actionText, { color: '#000000' }]}>Reply</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
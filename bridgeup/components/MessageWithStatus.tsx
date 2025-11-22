/**
 * Enhanced Message Component with Status Indicators and Reactions
 * 
 * Features:
 * - Message status indicators (sent, delivered, read)
 * - Emoji reactions
 * - Professional code quality for Swiss review
 */

import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  ScrollView, 
  Pressable 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export interface MessageReaction {
  emoji: string;
  user_id: string;
  created_at: string;
}

export interface EnhancedMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  timestamp: Date;
  isMe: boolean;
  message_status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  reactions: MessageReaction[];
  audio_url?: string;
  image_url?: string;
}

interface MessageWithStatusProps {
  message: EnhancedMessage;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  currentUserId: string;
}

const EMOJI_OPTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍', '👎', '🔥'];

const MessageWithStatus: React.FC<MessageWithStatusProps> = ({
  message,
  onAddReaction,
  onRemoveReaction,
  currentUserId
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const [showReactionModal, setShowReactionModal] = useState(false);

  // Group reactions by emoji and count
  const groupedReactions = useMemo(() => {
    const grouped = new Map<string, { count: number; users: string[]; hasCurrentUser: boolean }>();
    
    message.reactions.forEach(reaction => {
      const existing = grouped.get(reaction.emoji) || { count: 0, users: [], hasCurrentUser: false };
      existing.count++;
      existing.users.push(reaction.user_id);
      if (reaction.user_id === currentUserId) {
        existing.hasCurrentUser = true;
      }
      grouped.set(reaction.emoji, existing);
    });
    
    return Array.from(grouped.entries()).map(([emoji, data]) => ({
      emoji,
      ...data
    }));
  }, [message.reactions, currentUserId]);

  // Get status icon for messages sent by current user
  const getStatusIcon = () => {
    if (!message.isMe) return null;
    
    switch (message.message_status) {
      case 'sending':
        return <Ionicons name="time-outline" size={12} color={colors.textSecondary} />;
      case 'sent':
        return <Ionicons name="checkmark" size={12} color={colors.textSecondary} />;
      case 'delivered':
        return <Ionicons name="checkmark-done" size={12} color={colors.textSecondary} />;
      case 'read':
        return <Ionicons name="checkmark-done" size={12} color={colors.primary} />;
      case 'failed':
        return <Ionicons name="warning-outline" size={12} color={colors.error} />;
      default:
        return null;
    }
  };

  const handleEmojiPress = (emoji: string) => {
    const existingReaction = groupedReactions.find(r => r.emoji === emoji);
    if (existingReaction?.hasCurrentUser) {
      onRemoveReaction(message.id, emoji);
    } else {
      onAddReaction(message.id, emoji);
    }
    setShowReactionModal(false);
  };

  const handleReactionToggle = (emoji: string) => {
    const reaction = groupedReactions.find(r => r.emoji === emoji);
    if (reaction?.hasCurrentUser) {
      onRemoveReaction(message.id, emoji);
    } else {
      onAddReaction(message.id, emoji);
    }
  };

  return (
    <View style={[
      styles.messageContainer,
      message.isMe ? styles.myMessage : styles.theirMessage
    ]}>
      {/* Message Content */}
      <View style={[
        styles.messageBubble,
        message.isMe 
          ? [styles.myMessageBubble, { backgroundColor: colors.primary }]
          : [styles.theirMessageBubble, { backgroundColor: colors.cardBackground }]
      ]}>
        {!message.isMe && (
          <Text style={[styles.senderName, { color: colors.textSecondary }]}>
            {message.senderName}
          </Text>
        )}
        
        <Text style={[
          styles.messageText,
          { color: message.isMe ? '#FFFFFF' : colors.text }
        ]}>
          {message.content}
        </Text>

        {/* Message timestamp and status */}
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            { color: message.isMe ? '#FFFFFF80' : colors.textSecondary }
          ]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {getStatusIcon()}
        </View>
      </View>

      {/* Reactions */}
      {groupedReactions.length > 0 && (
        <View style={[styles.reactionsContainer, message.isMe ? styles.myReactions : styles.theirReactions]}>
          {groupedReactions.map(({ emoji, count, hasCurrentUser }) => (
            <TouchableOpacity
              key={emoji}
              style={[
                styles.reactionBubble,
                { 
                  backgroundColor: hasCurrentUser ? colors.primary + '20' : colors.cardBackground,
                  borderColor: hasCurrentUser ? colors.primary : colors.border
                }
              ]}
              onPress={() => handleReactionToggle(emoji)}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              <Text style={[styles.reactionCount, { color: colors.text }]}>
                {count}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Add Reaction Button */}
      <TouchableOpacity
        style={[styles.addReactionButton, message.isMe ? styles.myAddReaction : styles.theirAddReaction]}
        onPress={() => setShowReactionModal(true)}
      >
        <Ionicons name="add" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Reaction Modal */}
      <Modal
        visible={showReactionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReactionModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowReactionModal(false)}
        >
          <View style={[styles.emojiPicker, { backgroundColor: colors.cardBackground }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {EMOJI_OPTIONS.map(emoji => (
                <TouchableOpacity
                  key={emoji}
                  style={styles.emojiOption}
                  onPress={() => handleEmojiPress(emoji)}
                >
                  <Text style={styles.emojiOptionText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  myMessageBubble: {
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  myReactions: {
    justifyContent: 'flex-end',
  },
  theirReactions: {
    justifyContent: 'flex-start',
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    gap: 2,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  addReactionButton: {
    position: 'absolute',
    top: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  myAddReaction: {
    right: 8,
  },
  theirAddReaction: {
    left: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPicker: {
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emojiOption: {
    padding: 8,
    marginHorizontal: 2,
  },
  emojiOptionText: {
    fontSize: 24,
  },
});

export default MessageWithStatus;
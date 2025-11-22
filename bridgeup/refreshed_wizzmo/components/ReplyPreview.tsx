import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface Message {
  id: string;
  sender_id: string;
  content?: string;
  image_url?: string;
  audio_url?: string;
}

interface Session {
  mentor_id?: string;
  mentors?: { full_name?: string | null; avatar_url?: string | null } | null;
  students?: { full_name?: string | null } | null;
}

interface ReplyPreviewProps {
  replyToMessage: Message;
  currentUserId: string;
  session: Session | null;
  isMyMessage: boolean;
  colors: any;
  onPress: () => void;
}

export const ReplyPreview: React.FC<ReplyPreviewProps> = ({
  replyToMessage,
  currentUserId,
  session,
  isMyMessage,
  colors,
  onPress,
}) => {
  const isReplyingToOwnMessage = replyToMessage.sender_id === currentUserId;

  const getReplyContent = () => {
    const content = replyToMessage.content;
    if (content && content.trim()) {
      return content;
    } else if (replyToMessage.image_url) {
      return '📷 Photo';
    } else if (replyToMessage.audio_url) {
      return '🎵 Voice Message';
    }
    return '[No content found]';
  };

  const getAuthorName = () => {
    if (replyToMessage.sender_id === currentUserId) {
      return 'You';
    } else if (replyToMessage.sender_id === session?.mentor_id) {
      return session?.mentors?.full_name || 'Wizzmo';
    } else {
      return session?.students?.full_name || 'User';
    }
  };

  // For replies to own messages, show on left side like other person's messages
  if (isReplyingToOwnMessage && isMyMessage) {
    return (
      <View style={styles.ownReplyContainer}>
        <TouchableOpacity 
          style={styles.ownReplyPreview}
          onPress={() => {
            onPress();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.curvedLine} />
          <View style={styles.ownReplyContent}>
            <Text style={styles.ownReplyAuthor}>You</Text>
            <Text style={styles.ownReplyText} numberOfLines={2}>
              {getReplyContent()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // Normal reply preview
  return (
    <TouchableOpacity 
      style={styles.normalReplyContainer}
      onPress={() => {
        onPress();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.normalReplyLine, { 
        backgroundColor: colors.primary 
      }]} />
      <View style={[styles.normalReplyContent, { 
        backgroundColor: isMyMessage ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.08)' 
      }]}>
        <Text style={[styles.normalReplyAuthor, { 
          color: colors.primary 
        }]}>
          {getAuthorName()}
        </Text>
        <Text style={[styles.normalReplyText, { 
          color: '#666666' 
        }]} numberOfLines={2}>
          {getReplyContent()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Own reply styles (positioned on left)
  ownReplyContainer: {
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingLeft: 20,
    paddingRight: 20,
  },
  ownReplyPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '70%',
  },
  curvedLine: {
    width: 3,
    marginRight: 8,
    alignSelf: 'stretch',
    minHeight: 40,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    borderTopRightRadius: 1,
    borderBottomRightRadius: 1,
    backgroundColor: '#FF6B9D',
  },
  ownReplyContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 8,
    maxWidth: 200,
  },
  ownReplyAuthor: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 2,
  },
  ownReplyText: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 16,
  },

  // Normal reply styles
  normalReplyContainer: {
    flexDirection: 'row',
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  normalReplyLine: {
    width: 2,
    borderRadius: 1,
    marginRight: 8,
    alignSelf: 'stretch',
    minHeight: 32,
    marginBottom: 2,
  },
  normalReplyContent: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 2,
  },
  normalReplyAuthor: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 1,
  },
  normalReplyText: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
  },
});
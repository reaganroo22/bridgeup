import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Avatar from './Avatar';

export interface Comment {
  id: string;
  mentorName: string;
  mentorAvatar?: string;
  mentorId?: string;
  text: string;
  timestamp: string;
  helpfulCount: number;
  isHelpful: boolean;
}

interface FeedCommentProps {
  comment: Comment;
  onHelpfulPress?: (commentId: string) => void;
}

export default function FeedComment({ comment, onHelpfulPress }: FeedCommentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const handleHelpfulPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onHelpfulPress?.(comment.id);
  };

  const handleMentorNamePress = () => {
    if (comment.mentorId) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/wizzmo-profile?id=${comment.mentorId}`);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <Avatar
        name={comment.mentorName}
        imageUrl={comment.mentorAvatar}
        size="small"
      />

      <View style={[styles.contentContainer, { backgroundColor: 'transparent' }]}>
        <View style={[styles.header, { backgroundColor: 'transparent' }]}>
          <TouchableOpacity 
            style={[styles.nameContainer, { backgroundColor: 'transparent' }]}
            onPress={handleMentorNamePress}
            disabled={!comment.mentorId}
            activeOpacity={0.7}
          >
            <Text style={[styles.mentorName, { color: colors.text }]}>
              {comment.mentorName}
            </Text>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={colors.primary}
              style={styles.verifiedBadge}
            />
          </TouchableOpacity>
          <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
            {comment.timestamp}
          </Text>
        </View>

        <Text style={[styles.commentText, { color: colors.textSecondary }]}>
          {comment.text}
        </Text>

        <TouchableOpacity
          style={[
            styles.helpfulButton,
            {
              backgroundColor: comment.isHelpful
                ? `${colors.primary}15`
                : 'transparent',
              borderColor: comment.isHelpful ? colors.primary : colors.border,
            }
          ]}
          onPress={handleHelpfulPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name={comment.isHelpful ? "heart" : "heart-outline"}
            size={14}
            color={comment.isHelpful ? colors.primary : colors.textSecondary}
          />
          <Text style={[
            styles.helpfulText,
            { color: comment.isHelpful ? colors.primary : colors.textSecondary }
          ]}>
            {comment.helpfulCount > 0 ? comment.helpfulCount : 'helpful?'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    gap: 12,
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mentorName: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  commentText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 8,
  },
  helpfulButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 0,
    gap: 6,
  },
  helpfulText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

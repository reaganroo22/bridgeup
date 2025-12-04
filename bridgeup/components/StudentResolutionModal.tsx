import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as Haptics from 'expo-haptics';

interface StudentResolutionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
  mentorName?: string;
}

export default function StudentResolutionModal({
  visible,
  onClose,
  onSubmit,
  mentorName = 'your mentor'
}: StudentResolutionModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState<string>('');

  const handleRatingPress = (selectedRating: number) => {
    setRating(selectedRating);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(rating, feedback.trim());
    
    // Reset form
    setRating(5);
    setFeedback('');
  };

  const handleClose = () => {
    // Reset form
    setRating(5);
    setFeedback('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              mark as resolved
            </Text>
            <TouchableOpacity 
              onPress={handleSubmit}
              style={[styles.submitButton, { opacity: rating > 0 ? 1 : 0.5 }]}
              disabled={rating === 0}
            >
              <Text style={[styles.submitText, { color: colors.primary }]}>
                done
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: colors.text }]}>
                ✨ how was your chat with {mentorName}?
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                your feedback helps us improve the bridgeup experience
              </Text>
            </View>

            {/* Rating */}
            <View style={styles.ratingSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                rate your experience (1-5 stars)
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRatingPress(star)}
                    style={styles.starButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={40}
                      color={star <= rating ? colors.primary : colors.textTertiary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                {rating === 1 && 'poor experience'}
                {rating === 2 && 'below expectations'}
                {rating === 3 && 'okay experience'}
                {rating === 4 && 'good experience'}
                {rating === 5 && 'amazing experience!'}
              </Text>
            </View>

            {/* Feedback */}
            <View style={styles.feedbackSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                additional feedback (optional)
              </Text>
              <TextInput
                style={[
                  styles.feedbackInput,
                  { 
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.border
                  }
                ]}
                placeholder="share any thoughts about your chat..."
                placeholderTextColor={colors.textTertiary}
                value={feedback}
                onChangeText={setFeedback}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={[styles.characterCount, { color: colors.textTertiary }]}>
                {feedback.length}/500
              </Text>
            </View>

            {/* Info */}
            <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                marking as resolved will move this chat to your resolved section. you can always revisit it later.
              </Text>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  submitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
  },
  ratingSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  starButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  feedbackSection: {
    marginBottom: 24,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    flex: 1,
  },
});
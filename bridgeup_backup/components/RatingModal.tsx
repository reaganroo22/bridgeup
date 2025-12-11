import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Keyboard, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as Haptics from 'expo-haptics';

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string, isFavorite: boolean) => void;
  wizzmoName?: string;
  mentorId?: string;
  showFavorite?: boolean;
}

export default function RatingModal({
  visible,
  onClose,
  onSubmit,
  wizzmoName = 'your wizzmo',
  mentorId,
  showFavorite = true,
}: RatingModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const handleStarPress = (star: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(star);
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(rating, feedback, isFavorite);
    setRating(0);
    setFeedback('');
    setIsFavorite(false);
  };

  const handleClose = () => {
    setRating(0);
    setFeedback('');
    setIsFavorite(false);
    onClose();
  };

  const toggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFavorite(!isFavorite);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={handleClose}
          />
          <Pressable style={styles.modalWrapper} onPress={Keyboard.dismiss}>
            <ScrollView
              style={[styles.modalContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
              contentContainerStyle={styles.modalContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              rate your experience
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
            How was your chat with {wizzmoName}?
          </Text>

          {/* Star Rating */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? '#FFD700' : colors.textTertiary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Favorite Toggle - Only show for students */}
          {showFavorite && (
            <TouchableOpacity
              style={[styles.favoriteToggle, { borderColor: colors.border }]}
              onPress={toggleFavorite}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? '#FF4DB8' : colors.textSecondary}
              />
              <Text style={[styles.favoriteText, { color: colors.text }]}>
                add {wizzmoName} to favorites
              </Text>
            </TouchableOpacity>
          )}

          {/* Feedback Input */}
          <View style={styles.feedbackSection}>
            <Text style={[styles.feedbackLabel, { color: colors.text }]}>
              anything else? (optional)
            </Text>
            <TextInput
              style={[styles.feedbackInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
              placeholder="share your thoughts..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
              value={feedback}
              onChangeText={setFeedback}
              textAlignVertical="top"
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { opacity: rating === 0 ? 0.5 : 1 }]}
            onPress={handleSubmit}
            disabled={rating === 0}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.submitButtonGradient}
            >
              <Text style={styles.submitButtonText}>submit rating</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={handleClose}>
            <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
              skip for now
            </Text>
          </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalWrapper: {
    width: '90%',
    maxWidth: 400,
  },
  modalContainer: {
    borderWidth: 1,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    marginBottom: 24,
  },

  // Stars
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  starButton: {
    padding: 4,
  },

  // Feedback
  feedbackSection: {
    marginBottom: 20,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    fontWeight: '400',
  },

  // Buttons
  submitButton: {
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 12,
  },
  submitButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },

  // Favorite Toggle
  favoriteToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 0,
    marginBottom: 20,
  },
  favoriteText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});

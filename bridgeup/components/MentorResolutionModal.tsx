import React, { useState } from 'react';
import { StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Keyboard, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as Haptics from 'expo-haptics';

interface MentorResolutionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number, reason: string) => void;
  studentName?: string;
}

export default function MentorResolutionModal({
  visible,
  onClose,
  onSubmit,
  studentName = 'the student',
}: MentorResolutionModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [rating, setRating] = useState(0);
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (rating === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(rating, reason);
    setRating(0);
    setReason('');
  };

  const handleClose = () => {
    setRating(0);
    setReason('');
    onClose();
  };

  const handleRatingPress = (value: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(value);
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
                resolve chat
              </Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Why are you resolving this chat with {studentName}?
            </Text>

            {/* Reason Input */}
            <View style={styles.reasonSection}>
              <Text style={[styles.reasonLabel, { color: colors.text }]}>
                resolution reason
              </Text>
              <TextInput
                style={[styles.reasonInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.text }]}
                placeholder="e.g., question answered, advice given..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
                value={reason}
                onChangeText={setReason}
                textAlignVertical="top"
              />
            </View>

            {/* Student Rating */}
            <View style={styles.ratingSection}>
              <Text style={[styles.ratingLabel, { color: colors.text }]}>
                rate the student (1-10)
              </Text>
              <Text style={[styles.ratingSubtitle, { color: colors.textSecondary }]}>
                How engaged and responsive was {studentName}?
              </Text>
              
              <View style={styles.numbersContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((number) => (
                  <TouchableOpacity
                    key={number}
                    onPress={() => handleRatingPress(number)}
                    style={[
                      styles.numberButton,
                      {
                        backgroundColor: number === rating ? colors.primary : colors.surfaceElevated,
                        borderColor: number === rating ? colors.primary : colors.border,
                      }
                    ]}
                  >
                    <Text
                      style={[
                        styles.numberText,
                        {
                          color: number === rating ? '#FFFFFF' : colors.text,
                        }
                      ]}
                    >
                      {number}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
                <Text style={styles.submitButtonText}>resolve chat</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
                cancel
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

  // Reason Section
  reasonSection: {
    marginBottom: 24,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    fontWeight: '400',
  },

  // Rating Section
  ratingSection: {
    marginBottom: 24,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  ratingSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: -0.1,
    marginBottom: 16,
  },
  numbersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  numberButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
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
  cancelButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
});
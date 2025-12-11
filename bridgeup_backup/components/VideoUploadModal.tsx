import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as supabaseService from '@/lib/supabaseService';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface VideoUploadModalProps {
  visible: boolean;
  onClose: () => void;
  videoUri: string;
  mentorId: string;
  onUploadSuccess: () => void;
}

export default function VideoUploadModal({
  visible,
  onClose,
  videoUri,
  mentorId,
  onUploadSuccess,
}: VideoUploadModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('title required', 'please enter a title for your video');
      return;
    }

    try {
      setUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { data, error } = await supabaseService.uploadMentorVideo(
        mentorId,
        videoUri,
        title.trim(),
        description.trim()
      );

      if (error) {
        console.error('Error uploading video:', error);
        Alert.alert('upload failed', error.message || 'failed to upload video. please try again.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUploadSuccess();
      onClose();
      
      // Reset form
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('upload failed', 'failed to upload video. please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
    }
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={handleClose}
            disabled={uploading}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            post video
          </Text>
          
          <TouchableOpacity
            onPress={handleUpload}
            disabled={uploading || !title.trim()}
            style={[
              styles.postButton,
              { 
                backgroundColor: (!title.trim() || uploading) ? colors.border : colors.primary,
                opacity: (!title.trim() || uploading) ? 0.5 : 1
              }
            ]}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.postButtonText}>post</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Video Preview */}
          <View style={[styles.videoPreview, { backgroundColor: colors.surface }]}>
            <Video
              source={{ uri: videoUri }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              shouldPlay={true}
              isLooping={true}
              isMuted={true}
            />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                title
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }
                ]}
                value={title}
                onChangeText={setTitle}
                placeholder="what's your video about?"
                placeholderTextColor={colors.textSecondary}
                maxLength={100}
                editable={!uploading}
              />
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                {title.length}/100
              </Text>
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>
                description (optional)
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  { 
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.text
                  }
                ]}
                value={description}
                onChangeText={setDescription}
                placeholder="share more details about your advice..."
                placeholderTextColor={colors.textSecondary}
                maxLength={500}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!uploading}
              />
              <Text style={[styles.charCount, { color: colors.textSecondary }]}>
                {description.length}/500
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  postButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  videoPreview: {
    width: 200,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'center',
    marginBottom: 32,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});
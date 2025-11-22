import React, { useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Image,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface FullscreenMediaModalProps {
  visible: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType: 'image' | 'video';
}

export default function FullscreenMediaModal({
  visible,
  onClose,
  mediaUrl,
  mediaType,
}: FullscreenMediaModalProps) {
  const videoRef = useRef<Video>(null);
  const [isMuted, setIsMuted] = useState(false);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Modal
      visible={visible}
      presentationStyle="overFullScreen"
      animationType="slide"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Native-style header with close button */}
        <View style={styles.nativeHeader}>
          <TouchableOpacity onPress={handleClose} style={styles.nativeCloseButton}>
            <Ionicons name="chevron-down" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {/* Media Content */}
        <View style={styles.mediaContainer}>
          {mediaType === 'video' ? (
            <Video
              ref={videoRef}
              source={{ uri: mediaUrl }}
              style={styles.media}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={visible}
              isLooping={false}
              isMuted={isMuted}
              useNativeControls
            />
          ) : (
            <Image
              source={{ uri: mediaUrl }}
              style={styles.media}
              resizeMode="contain"
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  nativeHeader: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  nativeCloseButton: {
    alignSelf: 'flex-start',
    padding: 8,
  },
  mediaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: width,
    height: '100%',
  },
});
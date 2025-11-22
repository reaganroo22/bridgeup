import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Avatar from '@/components/Avatar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

interface MentorVideo {
  id: string;
  mentor_id: string;
  video_url: string;
  title: string;
  description?: string;
  view_count?: number;
  created_at: string;
  mentor_profile?: {
    id: string;
    username?: string;
    full_name: string;
    avatar_url?: string;
    university?: string;
    graduation_year?: number;
  };
}

interface FullscreenVideoModalProps {
  visible: boolean;
  onClose: () => void;
  video: MentorVideo | null;
  onMentorPress?: (mentorId: string) => void;
  onAskAdvice?: (mentorId: string) => void;
}

export default function FullscreenVideoModal({
  visible,
  onClose,
  video,
  onMentorPress,
  onAskAdvice,
}: FullscreenVideoModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const videoRef = useRef<Video>(null);
  const [isMuted, setIsMuted] = useState(false);

  const handleMentorPress = () => {
    if (video?.mentor_id && onMentorPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onMentorPress(video.mentor_id);
      onClose();
    }
  };

  const handleAskAdvice = () => {
    if (video?.mentor_id && onAskAdvice) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onAskAdvice(video.mentor_id);
      onClose();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };


  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const posted = new Date(timestamp);
    const diffMs = now.getTime() - posted.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffDays > 0) {
      return `${diffDays}d ago`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ago`;
    }
    return 'now';
  };

  if (!video) return null;

  return (
    <Modal
      visible={visible}
      presentationStyle="fullScreen"
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Video Background */}
        <Video
          ref={videoRef}
          source={{ uri: video.video_url }}
          style={styles.video}
          resizeMode={ResizeMode.COVER}
          shouldPlay={visible}
          isLooping={true}
          isMuted={isMuted}
        />

        {/* Overlay Content */}
        <SafeAreaView style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Side Actions */}
          <View style={styles.sideActions}>
            {/* Mentor Profile */}
            <TouchableOpacity style={styles.actionButton} onPress={handleMentorPress}>
              <View style={styles.mentorAvatar}>
                <Avatar
                  name={video.mentor_profile?.full_name || 'Mentor'}
                  imageUrl={video.mentor_profile?.avatar_url}
                  size="medium"
                />
              </View>
            </TouchableOpacity>

            {/* Ask Advice */}
            <TouchableOpacity style={styles.actionButton} onPress={handleAskAdvice}>
              <LinearGradient
                colors={['#FF6B9D', '#C147E9']}
                style={styles.askButton}
              >
                <Ionicons name="chatbubble-ellipses" size={24} color="white" />
              </LinearGradient>
            </TouchableOpacity>


            {/* Audio Toggle */}
            <TouchableOpacity style={styles.actionButton} onPress={toggleMute}>
              <View style={styles.muteButton}>
                <Ionicons 
                  name={isMuted ? "volume-mute" : "volume-high"} 
                  size={24} 
                  color="white" 
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Bottom Info */}
          <View style={styles.bottomInfo}>
            <View style={styles.mentorInfo}>
              <Text style={styles.mentorName}>
                @{video.mentor_profile?.username || video.mentor_profile?.full_name}
              </Text>
              <Text style={styles.mentorDetails}>
                {video.mentor_profile?.university} • {getTimeAgo(video.created_at)}
              </Text>
            </View>
            
            <Text style={styles.videoTitle}>
              {video.title}
            </Text>
            
            {video.description && (
              <Text style={styles.videoDescription}>
                {video.description}
              </Text>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideActions: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -100 }],
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mentorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  askButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muteButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomInfo: {
    padding: 20,
    paddingBottom: 40,
  },
  mentorInfo: {
    marginBottom: 12,
  },
  mentorName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  mentorDetails: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'lowercase',
  },
  videoTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
    textTransform: 'lowercase',
  },
  videoDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    textTransform: 'lowercase',
  },
});
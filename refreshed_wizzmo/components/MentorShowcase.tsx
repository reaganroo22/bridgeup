/**
 * Instagram-Style Video Feed
 * Minimal, modern, no-bullshit video discovery
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Image,
  Animated,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '../contexts/AuthContext';
import * as supabaseService from '../lib/supabaseService';
import * as Haptics from 'expo-haptics';
import FullscreenVideoModal from './FullscreenVideoModal';
import { getInitials, getColorFromString } from '@/lib/avatarUtils';

const { width: screenWidth } = Dimensions.get('window');

type MentorVideo = supabaseService.MentorVideo;

interface MentorShowcaseProps {
  onMentorPress?: (mentorId: string) => void;
}

const MentorShowcase: React.FC<MentorShowcaseProps> = ({ onMentorPress }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();
  
  const [mentorVideos, setMentorVideos] = useState<MentorVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set()); // Start with all videos muted
  const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);
  const [showFullscreenVideo, setShowFullscreenVideo] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<MentorVideo | null>(null);
  
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadMentorVideos();
  }, []);

  useEffect(() => {
    if (mentorVideos.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
      
      // Auto-play the first video
      const firstVideo = mentorVideos[0];
      if (firstVideo) {
        setTimeout(() => {
          handleAutoPlay(firstVideo.id);
        }, 1000);
      }
    }
  }, [mentorVideos]);

  // Auto-play current visible video
  useEffect(() => {
    if (mentorVideos.length > currentVisibleIndex) {
      const currentVideo = mentorVideos[currentVisibleIndex];
      if (currentVideo) {
        handleAutoPlay(currentVideo.id);
      }
    }
  }, [currentVisibleIndex]);

  const loadMentorVideos = async () => {
    try {
      setLoading(true);
      
      // Load featured mentor videos using service
      const { data: videos, error } = await supabaseService.getFeaturedMentorVideos(10);

      if (error) {
        console.error('[MentorShowcase] Error loading videos:', error);
        setMentorVideos([]);
        return;
      }

      if (videos && videos.length > 0) {
        setMentorVideos(videos);
        // Initialize all videos as muted
        setMutedVideos(new Set(videos.map(v => v.id)));
      } else {
        // No videos available
        setMentorVideos([]);
      }
    } catch (error) {
      console.error('[MentorShowcase] Error:', error);
      setMentorVideos([]);
    } finally {
      setLoading(false);
    }
  };


  const handleAutoPlay = async (videoId: string) => {
    try {
      // Stop currently playing video
      if (currentlyPlaying && currentlyPlaying !== videoId) {
        const currentVideo = videoRefs.current[currentlyPlaying];
        if (currentVideo) {
          await currentVideo.pauseAsync();
        }
      }

      // Start playing the new video
      const video = videoRefs.current[videoId];
      if (video) {
        await video.playAsync();
        setCurrentlyPlaying(videoId);
      }
    } catch (error) {
      console.error('[MentorShowcase] Error auto-playing video:', error);
    }
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const cardWidth = screenWidth - 40 + 20; // Card width + margin
    const newIndex = Math.round(scrollX / cardWidth);
    
    if (newIndex !== currentVisibleIndex && newIndex >= 0 && newIndex < mentorVideos.length) {
      setCurrentVisibleIndex(newIndex);
    }
  };

  const handleVideoPress = async (videoId: string, mentorId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Stop currently playing video
    if (currentlyPlaying && currentlyPlaying !== videoId) {
      const currentVideo = videoRefs.current[currentlyPlaying];
      if (currentVideo) {
        await currentVideo.pauseAsync();
      }
    }

    // Toggle play/pause for selected video
    const video = videoRefs.current[videoId];
    if (video) {
      if (currentlyPlaying === videoId) {
        await video.pauseAsync();
        setCurrentlyPlaying(null);
      } else {
        await video.playAsync();
        setCurrentlyPlaying(videoId);
      }
    }

    // Increment view count using service
    try {
      await supabaseService.incrementVideoViewCount(videoId);
    } catch (error) {
      console.error('[MentorShowcase] Error updating view count:', error);
    }
  };

  const handleMuteToggle = (videoId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newMutedVideos = new Set(mutedVideos);
    if (mutedVideos.has(videoId)) {
      newMutedVideos.delete(videoId);
    } else {
      newMutedVideos.add(videoId);
    }
    setMutedVideos(newMutedVideos);
  };

  const handleMentorProfilePress = (mentorId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to public wizzmo-profile with favorites/ask advice
    router.push(`/wizzmo-profile?userId=${mentorId}&forcePublic=true`);
  };

  const handleVideoTap = (video: MentorVideo) => {
    // Single tap on video should open fullscreen
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedVideo(video);
    setShowFullscreenVideo(true);
  };

  const handleAskAdvice = (mentorId: string) => {
    // Handle ask advice action - navigate to spill page with mentor pre-selected
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/ask?mentorId=${mentorId}`);
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const posted = new Date(timestamp);
    const diffMs = now.getTime() - posted.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          mentor stories
        </Text>
        <View style={[styles.loadingContainer, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            loading stories...
          </Text>
        </View>
      </View>
    );
  }

  if (mentorVideos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            advisor posts
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            real advice from college students
          </Text>
        </View>
        <View style={[styles.emptyState, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            no videos yet. be the first mentor to post!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          wizzmo posts
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          real advice from college girls
        </Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={screenWidth - 40 + 20} // Card width + margin
        snapToAlignment="start"
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {mentorVideos.map((video, index) => (
          <View key={video.id} style={styles.videoCard}>
            {/* Video Container */}
            <TouchableOpacity 
              style={styles.videoContainer}
              onPress={() => handleVideoTap(video)}
              activeOpacity={0.9}
            >
              <Video
                ref={(ref) => { videoRefs.current[video.id] = ref; }}
                source={{ uri: video.video_url }}
                style={styles.video}
                resizeMode={ResizeMode.COVER}
                shouldPlay={false} // We'll control this via auto-play
                isLooping={true}
                isMuted={mutedVideos.has(video.id)}
                usePosterFrame={false}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded && status.didJustFinish && !status.isLooping) {
                    // Auto-play the next video
                    const currentIndex = mentorVideos.findIndex(v => v.id === video.id);
                    if (currentIndex < mentorVideos.length - 1) {
                      setCurrentVisibleIndex(currentIndex + 1);
                    }
                  }
                }}
              />
              
              {/* Mute toggle */}
              <TouchableOpacity 
                style={styles.muteToggle}
                onPress={() => handleMuteToggle(video.id)}
              >
                <View style={styles.muteIcon}>
                  <Ionicons 
                    name={mutedVideos.has(video.id) ? "volume-mute" : "volume-high"} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                </View>
              </TouchableOpacity>
              
              {/* Video title overlay */}
              <View style={styles.titleOverlay}>
                <Text style={styles.videoTitle} numberOfLines={2}>
                  {video.title}
                </Text>
                <Text style={styles.timeStamp}>
                  {getTimeAgo(video.created_at)}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Profile section - clickable (no ask button) */}
            <TouchableOpacity 
              style={styles.profileSection}
              onPress={() => handleMentorProfilePress(video.mentor_id)}
              activeOpacity={0.7}
            >
              <TouchableOpacity
                style={styles.avatarContainer}
                onPress={() => handleMentorProfilePress(video.mentor_id)}
              >
                {video.mentor_profile?.avatar_url && !video.mentor_profile.avatar_url.startsWith('file://') ? (
                  <Image
                    source={{ uri: video.mentor_profile.avatar_url }}
                    style={styles.avatar}
                    onError={() => {
                      console.log('[MentorShowcase] Avatar failed to load, will show initials');
                    }}
                  />
                ) : (
                  <View style={[
                    styles.avatar,
                    { backgroundColor: getColorFromString(video.mentor_profile?.full_name || 'User'), alignItems: 'center', justifyContent: 'center' }
                  ]}>
                    <Text style={styles.avatarInitials}>
                      {getInitials(video.mentor_profile?.full_name || 'User')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={styles.mentorInfo}>
                <Text style={[styles.mentorName, { color: colors.text }]}>
                  {video.mentor_profile?.full_name}
                </Text>
                <Text style={[styles.mentorDetails, { color: colors.textSecondary }]}>
                  {video.mentor_profile?.university} • {video.mentor_profile?.graduation_year}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Fullscreen Video Modal */}
      <FullscreenVideoModal
        visible={showFullscreenVideo}
        onClose={() => setShowFullscreenVideo(false)}
        video={selectedVideo}
        onMentorPress={handleMentorProfilePress}
        onAskAdvice={handleAskAdvice}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    textTransform: 'lowercase',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'lowercase',
  },
  loadingContainer: {
    height: 160,
    marginHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    paddingLeft: 20,
    paddingRight: 0,
    paddingBottom: 20,
    flexDirection: 'row',
  },
  videoCard: {
    width: screenWidth - 40, // Full width minus padding
    marginRight: 20,
    backgroundColor: 'transparent',
  },
  videoContainer: {
    width: '100%',
    height: 480, // Taller for portrait 9:16 aspect ratio
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  muteToggle: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  muteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timeStamp: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FF4DB8',
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  mentorDetails: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    marginHorizontal: 20,
    padding: 40,
    borderWidth: 1,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});

export default MentorShowcase;
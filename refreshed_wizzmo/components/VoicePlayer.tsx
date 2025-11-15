import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface VoicePlayerProps {
  audioUri: string;
  duration: number;
  isMe: boolean;
  waveformData?: number[]; // Optional waveform visualization data
}

export const VoicePlayer: React.FC<VoicePlayerProps> = ({
  audioUri,
  duration,
  isMe,
  waveformData,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Generate default waveform if not provided (fewer bars for compact design)
  const defaultWaveformData = Array.from({ length: 15 }, () => Math.random() * 0.8 + 0.2);
  const waveform = waveformData || defaultWaveformData;

  // Play/pause audio - using the same logic as VoiceRecorder
  const togglePlayback = useCallback(async () => {
    try {
      if (!audioUri) {
        console.log('[VoicePlayer] No audio URI');
        return;
      }

      console.log('[VoicePlayer] Toggle playback, isPlaying:', isPlaying);

      if (isPlaying) {
        // Pause
        if (soundRef.current) {
          console.log('[VoicePlayer] Pausing...');
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        }
      } else {
        // Play
        if (soundRef.current) {
          console.log('[VoicePlayer] Resuming existing sound...');
          await soundRef.current.playAsync();
          setIsPlaying(true);
        } else {
          console.log('[VoicePlayer] Creating new sound from URI:', audioUri);

          // Set audio mode for playback
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
          });

          console.log('[VoicePlayer] Audio mode set for playback');

          const { sound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true, volume: 1.0 },
            (status) => {
              if (status.isLoaded) {
                // Update playback position
                const currentPos = (status.positionMillis || 0) / 1000;
                setPlaybackPosition(currentPos);
                
                // Update progress bar
                const progress = Math.min(currentPos / duration, 1);
                progressAnim.setValue(progress);

                if (status.didJustFinish) {
                  console.log('[VoicePlayer] Playback finished');
                  setIsPlaying(false);
                  setPlaybackPosition(0);
                  progressAnim.setValue(0);
                  sound.setPositionAsync(0).catch(console.error);
                }
              }
            }
          );

          soundRef.current = sound;
          setIsPlaying(true);
          console.log('[VoicePlayer] Sound created and playing');
        }
      }
    } catch (error) {
      console.error('[VoicePlayer] Failed to toggle playback:', error);
      setIsPlaying(false);
    }
  }, [audioUri, isPlaying, duration, progressAnim]);

  const handlePlayPause = useCallback(() => {
    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    togglePlayback();
  }, [togglePlayback, scaleAnim]);

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(console.error);
      }
    };
  }, []);

  const getPlayButtonIcon = (): string => {
    if (isLoading) return 'ellipsis-horizontal';
    return isPlaying ? 'pause' : 'play';
  };

  const getDisplayTime = (): string => {
    if (isPlaying && playbackPosition > 0) {
      return formatTime(playbackPosition);
    }
    return formatTime(duration);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isMe ? '#FF4DB8' : '#E5E5EA',
        },
      ]}
    >
      <TouchableOpacity
        style={styles.playButton}
        onPress={handlePlayPause}
        disabled={isLoading}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={getPlayButtonIcon() as any}
            size={20}
            color={isMe ? '#FFFFFF' : '#000000'}
          />
        </Animated.View>
      </TouchableOpacity>

      <View style={[styles.waveformContainer, { backgroundColor: 'transparent' }]}>
        {/* Progress bar background */}
        <View
          style={[
            styles.progressBackground,
            {
              backgroundColor: isMe
                ? 'rgba(255,255,255,0.3)'
                : colors.border,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: isMe ? '#FFFFFF' : '#FF4DB8',
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>

        {/* Waveform visualization */}
        <View style={[styles.waveform, { backgroundColor: 'transparent' }]}>
          {waveform.map((amplitude, index) => (
            <View
              key={index}
              style={[
                styles.waveformBar,
                {
                  height: amplitude * 24,
                  backgroundColor: isMe
                    ? 'rgba(255,255,255,0.7)'
                    : '#666666',
                },
              ]}
            />
          ))}
        </View>
      </View>

      <Text
        style={[
          styles.duration,
          {
            color: isMe ? 'rgba(255,255,255,0.9)' : '#666666',
          },
        ]}
      >
        {getDisplayTime()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18, // iMessage style rounded
    minWidth: 200,
    maxWidth: 250,
    gap: 10,
  },
  playButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveformContainer: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
    position: 'relative',
  },
  progressBackground: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    height: 3,
    borderRadius: 1.5,
  },
  progressBar: {
    height: 3,
    borderRadius: 1.5,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 28,
    paddingHorizontal: 2,
  },
  waveformBar: {
    width: 2,
    borderRadius: 1,
    minHeight: 4,
    opacity: 0.8,
  },
  duration: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 40,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
});

export default VoicePlayer;
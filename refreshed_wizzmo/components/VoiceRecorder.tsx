import React, { useState, useRef, useCallback, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, Alert, Vibration, Animated, AppState } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export interface AudioRecording {
  uri: string;
  duration: number;
}

interface VoiceRecorderProps {
  onRecordingComplete: (recording: AudioRecording) => void;
  onRecordingStateChange?: (isActive: boolean) => void; // Active = recording or previewing
}

type RecordingState = 'idle' | 'recording' | 'preview';

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onRecordingStateChange,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [playbackPosition, setPlaybackPosition] = useState(0); // Position in milliseconds

  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const waveformAnims = useRef(
    Array.from({ length: 30 }, () => new Animated.Value(0.3))
  ).current;
  const meteringRef = useRef<number>(0);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      console.log('[VoiceRecorder] Starting recording...');
      
      // Check if app is in foreground
      if (AppState.currentState !== 'active') {
        console.log('[VoiceRecorder] App not in foreground, cannot start recording');
        Alert.alert('Recording Error', 'Please make sure the app is in the foreground to record audio.');
        return;
      }

      const { status } = await Audio.requestPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow microphone access.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false, // Don't stay active in background
        shouldDuckAndroid: true, // Lower other audio
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          android: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android,
            extension: '.m4a',
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
          },
          ios: {
            ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios,
            extension: '.m4a',
            outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: 'audio/webm',
            bitsPerSecond: 128000,
          },
        },
        (status) => {
          // Update waveform based on audio metering
          if (status.isRecording) {
            console.log('[VoiceRecorder] Metering:', status.metering);

            let volume = 0.5; // Default middle value

            if (status.metering !== undefined && status.metering !== null) {
              meteringRef.current = status.metering;

              // iOS/Android metering: -160 (silence) to 0 (max)
              // Normalize to 0-1 range, with better sensitivity
              const normalized = Math.max(0, Math.min(1, (status.metering + 60) / 60));
              volume = normalized;
            }

            // Capture waveform data for preview (30 samples)
            if (waveformData.length < 30) {
              setWaveformData(prev => [...prev, volume]);
            }

            // Update waveform bars based on volume - Apple style
            waveformAnims.forEach((anim, i) => {
              // Create wave effect from center outward
              const centerDistance = Math.abs(i - waveformAnims.length / 2) / (waveformAnims.length / 2);

              // Each bar gets a slightly different height based on position
              const positionVariation = (1 - centerDistance * 0.3); // Center bars taller
              const randomVariation = (Math.random() * 0.3 - 0.15); // ±15% random

              // Combine volume with variations
              const targetValue = Math.max(0.15, Math.min(1, volume * positionVariation + randomVariation));

              Animated.spring(anim, {
                toValue: targetValue,
                friction: 8,
                tension: 100,
                useNativeDriver: false,
              }).start();
            });
          }
        },
        50 // Update interval in milliseconds - faster updates
      );

      recordingRef.current = recording;
      setState('recording');
      setDuration(0);
      setWaveformData([]); // Reset waveform data
      onRecordingStateChange?.(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      Vibration.vibrate(50);
    } catch (error) {
      console.error('[VoiceRecorder] Failed to start:', error);
      Alert.alert('Error', 'Failed to start recording.');
    }
  }, [onRecordingStateChange]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      if (!recordingRef.current) return;

      console.log('[VoiceRecorder] Stopping recording...');

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop waveform animations
      waveformAnims.forEach(anim => {
        anim.stopAnimation();
        anim.setValue(0.5);
      });

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();

      if (uri) {
        setRecordingUri(uri);
        setState('preview');
        // Keep onRecordingStateChange as true - still in active state
      }

      recordingRef.current = null;
      Vibration.vibrate(50);
    } catch (error) {
      console.error('[VoiceRecorder] Failed to stop:', error);
      cancelRecording();
    }
  }, [waveformAnims]);

  // Cancel recording/preview
  const cancelRecording = useCallback(async () => {
    try {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setState('idle');
      setDuration(0);
      setRecordingUri(null);
      setIsPlaying(false);
      setWaveformData([]);
      setPlaybackPosition(0);
      onRecordingStateChange?.(false);

      Vibration.vibrate([50, 50, 50]);
    } catch (error) {
      console.error('[VoiceRecorder] Failed to cancel:', error);
    }
  }, [onRecordingStateChange]);

  // Play/pause preview
  const togglePlayback = useCallback(async () => {
    try {
      if (!recordingUri) {
        console.log('[VoiceRecorder] No recording URI');
        return;
      }

      console.log('[VoiceRecorder] Toggle playback, isPlaying:', isPlaying);

      if (isPlaying) {
        // Pause
        if (soundRef.current) {
          console.log('[VoiceRecorder] Pausing...');
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        }
      } else {
        // Play
        if (soundRef.current) {
          console.log('[VoiceRecorder] Resuming existing sound...');
          await soundRef.current.playAsync();
          setIsPlaying(true);
        } else {
          console.log('[VoiceRecorder] Creating new sound from URI:', recordingUri);

          // Set audio mode for playback
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: false,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
          });

          console.log('[VoiceRecorder] Audio mode set for playback');

          const { sound } = await Audio.Sound.createAsync(
            { uri: recordingUri },
            { shouldPlay: true, volume: 1.0 },
            (status) => {
              if (status.isLoaded) {
                // Update playback position
                setPlaybackPosition(status.positionMillis || 0);

                if (status.didJustFinish) {
                  console.log('[VoiceRecorder] Playback finished');
                  setIsPlaying(false);
                  setPlaybackPosition(0);
                  sound.setPositionAsync(0).catch(console.error);
                }
              }
            }
          );

          soundRef.current = sound;
          setIsPlaying(true);
          console.log('[VoiceRecorder] Sound created and playing');
        }
      }
    } catch (error) {
      console.error('[VoiceRecorder] Playback error:', error);
      setIsPlaying(false);
    }
  }, [recordingUri, isPlaying]);

  // Send recording
  const sendRecording = useCallback(async () => {
    if (recordingUri && duration > 0) {
      onRecordingComplete({ uri: recordingUri, duration });

      // Cleanup
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setState('idle');
      setDuration(0);
      setRecordingUri(null);
      setIsPlaying(false);
      setWaveformData([]);
      setPlaybackPosition(0);
      onRecordingStateChange?.(false);
    }
  }, [recordingUri, duration, onRecordingComplete, onRecordingStateChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordingRef.current) recordingRef.current.stopAndUnloadAsync().catch(console.error);
      if (soundRef.current) soundRef.current.unloadAsync().catch(console.error);
    };
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // RECORDING STATE - Full width with animated waveform
  if (state === 'recording') {
    return (
      <View style={styles.recordingContainer}>
        {/* Animated waveform */}
        <View style={styles.waveformContainer}>
          {waveformAnims.map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.waveformBar,
                {
                  height: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [6, 32],
                  }),
                  backgroundColor: '#FF3B30',
                  opacity: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                }
              ]}
            />
          ))}
        </View>

        {/* Duration */}
        <Text style={[styles.durationText, { color: colors.text }]}>
          {formatDuration(duration)}
        </Text>

        {/* Stop button (red square) */}
        <TouchableOpacity
          style={styles.stopButton}
          onPress={stopRecording}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.stopButtonSquare} />
        </TouchableOpacity>
      </View>
    );
  }

  // PREVIEW STATE - Full width with play button and send arrow
  if (state === 'preview') {
    return (
      <View style={styles.previewContainer}>
        {/* Cancel (X) button */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceElevated }]}
          onPress={cancelRecording}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Play/Pause button */}
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceElevated }]}
          onPress={togglePlayback}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name={isPlaying ? "pause" : "play"} size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Static waveform - uses actual recorded data with playback progress */}
        <View style={styles.waveformContainer}>
          {Array.from({ length: 30 }).map((_, i) => {
            let height = 10; // Default height

            // Calculate playback progress (0-1)
            const totalDuration = duration * 1000; // Convert to milliseconds
            const progress = totalDuration > 0 ? playbackPosition / totalDuration : 0;
            const barProgress = i / 30; // Position of this bar (0-1)
            const isPlayed = barProgress <= progress; // Has this bar been played?

            if (waveformData.length > 0) {
              // Map captured waveform data to 30 bars
              const dataIndex = Math.floor((i / 30) * waveformData.length);
              const volumeValue = waveformData[dataIndex] || 0.5;

              // Convert volume (0-1) to height (6-32)
              const centerDistance = Math.abs(i - 15) / 15;
              const positionVariation = (1 - centerDistance * 0.3);
              height = Math.max(6, Math.min(32, volumeValue * positionVariation * 32));
            } else {
              // Fallback pattern if no data
              const centerDistance = Math.abs(i - 15) / 15;
              const baseHeight = (1 - centerDistance * 0.4) * 24;
              const variation = (Math.random() - 0.5) * 8;
              height = Math.max(6, Math.min(32, baseHeight + variation));
            }

            return (
              <View
                key={i}
                style={[
                  styles.waveformBar,
                  {
                    height,
                    backgroundColor: isPlayed ? colors.primary : colors.textSecondary,
                    opacity: isPlayed ? 1 : 0.4,
                  }
                ]}
              />
            );
          })}
        </View>

        {/* Duration with + */}
        <Text style={[styles.durationText, { color: colors.textSecondary }]}>
          + {formatDuration(duration)}
        </Text>

        {/* Send button (blue arrow) */}
        <TouchableOpacity
          style={styles.sendArrowButton}
          onPress={sendRecording}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  // IDLE STATE - Just the waveform icon button
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }
      ]}
      onPress={startRecording}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="mic-outline" size={20} color={colors.primary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Recording container (full width)
  recordingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    flex: 1,
    backgroundColor: 'rgba(255, 59, 48, 0.1)', // Light pink/red background
    borderRadius: 24,
  },

  // Preview container (full width)
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    flex: 1,
  },

  // Waveform
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
    height: 32,
    justifyContent: 'center',
  },
  waveformBar: {
    width: 2.5,
    borderRadius: 1.25,
    minHeight: 4,
  },

  // Duration text
  durationText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    fontVariant: ['tabular-nums'],
  },

  // Stop button (red circle with white square)
  stopButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonSquare: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },

  // Icon buttons (X and Play)
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Send arrow button (pink)
  sendArrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF4DB8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Idle button
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: 8,
  },
});

export default VoiceRecorder;

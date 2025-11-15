import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/Themed';
import { useUserMode } from '../contexts/UserModeContext';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

interface ModeToggleProps {
  style?: any;
  showText?: boolean;
}

export default function ModeToggle({ style, showText = true }: ModeToggleProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { currentMode, availableModes, switchMode, canSwitch, isLoading } = useUserMode();

  console.log('🔧 [ModeToggle] Rendering with:', { canSwitch, isLoading, currentMode, availableModes });

  if (!canSwitch || isLoading) {
    console.log('🔧 [ModeToggle] NOT RENDERING - canSwitch:', canSwitch, 'isLoading:', isLoading);
    return null;
  }

  console.log('✅ [ModeToggle] SHOULD BE VISIBLE');

  const handleModeSwitch = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const newMode = currentMode === 'student' ? 'mentor' : 'student';
      await switchMode(newMode);
      
      // Navigate to the appropriate profile screen for the new mode
      if (newMode === 'mentor') {
        router.push('/(tabs)/mentor-profile');
      } else {
        router.push('/(tabs)/profile');
      }
    } catch (error) {
      console.error('Error switching mode:', error);
    }
  };

  const isStudentMode = currentMode === 'student';

  return (
    <View style={[styles.container, style]}>
      {showText && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          mode
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.toggle,
          { 
            backgroundColor: isStudentMode ? colors.primary : colors.success,
            borderColor: colors.border 
          }
        ]}
        onPress={handleModeSwitch}
        activeOpacity={0.8}
      >
        <View style={[
          styles.toggleContent,
          !showText && styles.toggleContentCompact
        ]}>
          <Ionicons 
            name={isStudentMode ? 'school-outline' : 'people-outline'} 
            size={16} 
            color="#FFFFFF" 
          />
          {showText && (
            <Text style={styles.toggleText}>
              {isStudentMode ? 'student' : 'mentor'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'lowercase',
    marginBottom: 4,
  },
  toggle: {
    borderRadius: 0,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 80,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  toggleContentCompact: {
    gap: 0,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
});
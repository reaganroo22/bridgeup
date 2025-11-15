import React, { useRef } from 'react';
import { StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface FloatingActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  onPress: () => void;
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left';
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  label,
  onPress,
  position = 'bottom-right',
  size = 'medium',
  variant = 'primary',
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 48, height: 48, iconSize: 20 };
      case 'large':
        return { width: 72, height: 72, iconSize: 28 };
      default:
        return { width: 56, height: 56, iconSize: 24 };
    }
  };

  const getPositionStyles = () => {
    const base = { position: 'absolute' as const, bottom: 20 };
    switch (position) {
      case 'bottom-left':
        return { ...base, left: 20 };
      case 'bottom-center':
        return { ...base, alignSelf: 'center' as const };
      default:
        return { ...base, right: 20 };
    }
  };

  const sizeStyles = getSizeStyles();
  const positionStyles = getPositionStyles();

  const gradientColors = variant === 'primary'
    ? colors.gradientPrimary
    : [colors.surface, colors.surfaceElevated];

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyles,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            width: sizeStyles.width,
            height: sizeStyles.height,
            shadowColor: colors.text,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={gradientColors}
          style={[
            styles.gradient,
            {
              width: sizeStyles.width,
              height: sizeStyles.height,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={sizeStyles.iconSize}
            color={variant === 'primary' ? '#FFFFFF' : colors.text}
          />
        </LinearGradient>
      </TouchableOpacity>

      {label && (
        <View style={[styles.labelContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    zIndex: 1000,
  },
  button: {
    borderRadius: 0,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  labelContainer: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
    borderWidth: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});

export default FloatingActionButton;
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  animate?: boolean;
}

export default function NotificationBadge({
  count,
  size = 'small',
  color = '#FF4DB8',
  animate = true,
}: NotificationBadgeProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animate && count > 0) {
      // Pulse animation when count changes
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.3,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 200,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [count, animate, scale]);

  if (count === 0) return null;

  const sizeStyles = {
    small: { width: 18, height: 18, fontSize: 10 },
    medium: { width: 22, height: 22, fontSize: 11 },
    large: { width: 26, height: 26, fontSize: 12 },
  };

  const { width, height, fontSize } = sizeStyles[size];

  return (
    <Animated.View
      style={[
        styles.badge,
        {
          backgroundColor: color,
          minWidth: width,
          height,
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <Text style={[styles.badgeText, { fontSize }]}>
        {count > 99 ? '99+' : count}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    overflow: 'hidden',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
});

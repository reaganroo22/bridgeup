import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';

interface LiveIndicatorProps {
  isLive?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  showPulse?: boolean;
}

export default function LiveIndicator({
  isLive = true,
  size = 'small',
  color = '#4CAF50',
  showPulse = true,
}: LiveIndicatorProps) {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  const sizeMap = {
    small: 8,
    medium: 10,
    large: 12,
  };

  const dotSize = sizeMap[size];
  const pulseSize = dotSize * 2.5;

  useEffect(() => {
    if (isLive && showPulse) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1.8,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseScale, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(pulseOpacity, {
              toValue: 0.6,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [isLive, showPulse, pulseScale, pulseOpacity]);

  if (!isLive) return null;

  return (
    <View style={[styles.container, { width: pulseSize, height: pulseSize }]}>
      {showPulse && (
        <Animated.View
          style={[
            styles.pulse,
            {
              width: pulseSize,
              height: pulseSize,
              borderRadius: pulseSize / 2,
              backgroundColor: color,
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            },
          ]}
        />
      )}
      <View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
  },
  dot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});

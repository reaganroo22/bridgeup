import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

export default function LoadingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  // Animation values - smoother, more modern animation
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle breathing animation for the logo
    const breatheAnimation = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => breatheAnimation());
    };

    // Very subtle rotation for visual interest
    const rotateAnimation = () => {
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      }).start(() => {
        rotateAnim.setValue(0);
        rotateAnimation();
      });
    };

    // Start animations after entrance
    setTimeout(() => {
      breatheAnimation();
      rotateAnimation();
    }, 800);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }) }
            ],
          },
        ]}
      >
        {/* Wizzmobare Icon */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Brand Name */}
        <Text style={[styles.brandText, { color: colors.text }]}>
          wizzmo
        </Text>
        
        {/* Tagline */}
        <Text style={[styles.taglineText, { color: colors.textSecondary }]}>
          college advice that matters
        </Text>

        {/* Loading dots animation */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <LoadingDot key={index} delay={index * 200} color={colors.primary} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// Individual dot component with its own animation
function LoadingDot({ delay, color }: { delay: number; color: string }) {
  const dotAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = () => {
      Animated.sequence([
        Animated.timing(dotAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => animateDot());
    };

    const timer = setTimeout(animateDot, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color, opacity: dotAnim }
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#FF4DB8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  brandText: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  taglineText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 40,
    textTransform: 'lowercase',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
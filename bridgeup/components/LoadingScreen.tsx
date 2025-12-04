import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Image } from 'react-native';

export default function LoadingScreen() {
  // BridgeUp logo
  const bridgeupLogo = require('../assets/images/bridgeup-logo.png');
  
  
  // Animation values - smoother, more modern animation
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

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


    // Start breathing animation after entrance
    setTimeout(() => {
      breatheAnimation();
    }, 800);

  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* BridgeUp Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={bridgeupLogo}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        
        {/* Brand Name */}
        <Text style={styles.brandText}>
          bridgeup
        </Text>
        
        {/* Tagline */}
        <Text style={styles.taglineText}>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2', // Blue background
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
    shadowColor: '#FFFFFF',
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
    color: '#FFFFFF', // White text
  },
  taglineText: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 40,
    textTransform: 'lowercase',
    color: 'rgba(255, 255, 255, 0.9)', // Light white text
  },
});
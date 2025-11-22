import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Image } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

export default function AuthIndex() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF4DB8', '#8B5CF6']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>wizzmo</Text>
          </View>

          {/* Get Started Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.signupButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push('/auth/oauth-signin');
              }}
            >
              <Text style={styles.signupButtonText}>get started</Text>
            </TouchableOpacity>
          </View>
        </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF4DB8', // Ensure no white background shows
  },
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 80,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.5,
    textTransform: 'lowercase',
  },
  bearLogo: {
    width: 80,
    height: 80,
    marginTop: 16,
  },
  buttonContainer: {
    width: '100%',
  },
  signupButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 0,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF4DB8',
    letterSpacing: -0.3,
    textTransform: 'lowercase',
  },
})
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as oauthService from '@/lib/oauthService';
import * as supabaseService from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { Animated } from 'react-native';
import { CURRENT_VERTICAL } from '../../config/current-vertical';

const { width } = Dimensions.get('window');

export default function OAuthSignIn() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const [loading, setLoading] = useState<string | null>(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  
  // Animation values
  const logoScale = useRef(new Animated.Value(1)).current;
  const buttonTranslateY = useRef(new Animated.Value(50)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo and buttons on mount
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1.1,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        useNativeDriver: true,
      })
    ]).start();
    
    Animated.timing(buttonTranslateY, {
      toValue: 0,
      delay: 300,
      duration: 800,
      useNativeDriver: true,
    }).start();
    
    Animated.timing(buttonOpacity, {
      toValue: 1,
      delay: 300,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    if (loading) return;

    setLoading(provider);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log(`[OAuthSignIn] Starting ${provider} sign-in`);
      
      // Ensure we start with a clean auth state
      await supabase.auth.signOut({ scope: 'local' });
      
      const { data, error } = await oauthService.signInWithProvider(provider);

      if (error) {
        console.error(`[OAuthSignIn] ${provider} sign-in error:`, error);
        
        // Don't show error for cancellation
        if (error.message.includes('cancelled') || error.message.includes('cancel')) {
          console.log(`[OAuthSignIn] ${provider} sign-in was cancelled by user`);
          return;
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('sign in failed', error.message || 'Something went wrong. Please try again.');
        return;
      }

      if (data?.user) {
        console.log(`[OAuthSignIn] ${provider} sign-in successful`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Extract user data from OAuth
        const userData = oauthService.extractUserDataFromOAuth(data.user);
        
        // Check if user profile exists, if not create it
        const { data: existingProfile } = await supabaseService.getUserProfile(data.user.id);
        
        if (!existingProfile) {
          console.log('[OAuthSignIn] Creating new user profile for OAuth user');
          
          // Create user profile with OAuth data using the new function
          const { error: profileError } = await supabaseService.createOAuthUserProfile(
            data.user.id,
            userData.email,
            userData.full_name,
            userData.avatar_url
          );

          if (profileError) {
            console.error('[OAuthSignIn] Error creating profile:', profileError);
          }
        }

        // Check onboarding status and redirect accordingly
        await checkOnboardingStatus(data.user.id);
      }
    } catch (error) {
      console.error(`[OAuthSignIn] Unexpected error:`, error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const checkOnboardingStatus = async (userId: string) => {
    if (hasNavigated) return; // Prevent double navigation
    
    try {
      setHasNavigated(true);
      
      // Add a small delay to prevent race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const { data: userProfile } = await supabaseService.getUserProfile(userId);
      
      if (!userProfile || !userProfile.onboarding_completed) {
        console.log('[OAuthSignIn] Redirecting to onboarding');
        router.replace('/auth/onboarding');
      } else {
        console.log('[OAuthSignIn] Redirecting to app');
        router.replace('/(tabs)/');
      }
    } catch (error) {
      console.error('[OAuthSignIn] Error checking onboarding:', error);
      // Default to onboarding on error to be safe
      router.replace('/auth/onboarding');
    }
  };

  const openTermsOfService = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://wizzmo.app/terms-of-service');
    } catch (error) {
      console.error('Error opening terms of service:', error);
    }
  };

  const openPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://wizzmo.app/privacy-policy');
    } catch (error) {
      console.error('Error opening privacy policy:', error);
    }
  };

  const renderOAuthButton = (provider: { provider: string; label: string }) => {
    const isLoading = loading === provider.provider;
    const isDisabled = loading !== null;

    return (
      <TouchableOpacity
        key={provider.provider}
        style={[
          styles.oauthButton,
          {
            backgroundColor: provider.provider === 'apple' ? '#000000' : '#FFFFFF',
            borderColor: provider.provider === 'apple' ? '#000000' : colors.border,
            opacity: isDisabled && !isLoading ? 0.5 : 1,
          }
        ]}
        onPress={() => handleOAuthSignIn(provider.provider as 'apple' | 'google')}
        disabled={isDisabled}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator 
            color={provider.provider === 'apple' ? '#FFFFFF' : '#000000'} 
            size="small" 
          />
        ) : (
          <Ionicons
            name={provider.provider === 'apple' ? 'logo-apple' : 'logo-google'}
            size={20}
            color={provider.provider === 'apple' ? '#FFFFFF' : '#000000'}
          />
        )}
        <Text style={[
          styles.oauthButtonText,
          { color: provider.provider === 'apple' ? '#FFFFFF' : '#000000' }
        ]}>
          {isLoading ? 'signing in...' : provider.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={colors.gradientPrimary}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Section */}
          <Animated.View style={[styles.logoSection, { transform: [{ scale: logoScale }] }]}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>wizzmo</Text>
            </View>
            <Text style={[styles.subtitle, { color: '#FFFFFF' }]}>
              life / dating advice from college girls
            </Text>
          </Animated.View>

          {/* OAuth Buttons */}
          <Animated.View style={[styles.authSection, { transform: [{ translateY: buttonTranslateY }], opacity: buttonOpacity }]}>
            <View style={styles.buttonsContainer}>
              {[
                { provider: 'apple', label: 'Continue with Apple' },
                { provider: 'google', label: 'Continue with Google' }
              ].map(renderOAuthButton)}
            </View>

            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Text style={[styles.infoText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                new to wizzmo? we'll create your account automatically
              </Text>
            </View>
          </Animated.View>
        </View>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <View style={styles.termsTextContainer}>
              <Text style={[styles.termsText, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                by continuing, you agree to our{' '}
              </Text>
              <TouchableOpacity onPress={openTermsOfService}>
                <Text style={[styles.termsLink, { color: colors.primary }]}>
                  terms of service
                </Text>
              </TouchableOpacity>
              <Text style={[styles.termsText, { color: 'rgba(255, 255, 255, 0.6)' }]}>
                {' '}and{' '}
              </Text>
              <TouchableOpacity onPress={openPrivacyPolicy}>
                <Text style={[styles.termsLink, { color: colors.primary }]}>
                  privacy policy
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CURRENT_VERTICAL.primaryColor, // Ensure no white background shows
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  authSection: {
    gap: 16,
  },
  buttonsContainer: {
    gap: 12,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 0,
    gap: 12,
  },
  oauthButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  infoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  termsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  termsTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  termsText: {
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    textDecorationLine: 'underline',
  },
});
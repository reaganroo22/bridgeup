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
      try {
        await supabase.auth.signOut({ scope: 'local' });
        // Add a small delay to ensure clean state
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (signOutError) {
        console.warn('[OAuthSignIn] Sign out warning (continuing):', signOutError);
      }
      
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
        
        // Wait a moment for auth session to fully establish
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Debug: Check auth session is properly established
        console.log('[OAuthSignIn] Checking auth session...');
        const { data: sessionCheck } = await supabase.auth.getSession();
        console.log('[OAuthSignIn] Current session user:', sessionCheck?.session?.user?.email || 'none');

        // Check if user profile exists, if not create it
        const { data: existingProfile } = await supabaseService.getUserProfile(data.user.id);
        
        if (!existingProfile) {
          console.log('[OAuthSignIn] Creating new user profile for OAuth user');
          
          // Create user profile with OAuth data using the new function
          const { data: createdProfile, error: profileError } = await supabaseService.createOAuthUserProfile(
            data.user.id,
            userData.email,
            userData.full_name,
            userData.avatar_url
          );

          if (profileError) {
            console.error('[OAuthSignIn] Error creating profile:', profileError);
            // Continue anyway - the profile might exist from account linking
          } else if (createdProfile) {
            console.log('[OAuthSignIn] Profile created successfully:', createdProfile.email);
          }
        } else {
          console.log('[OAuthSignIn] Profile already exists:', existingProfile.email, 'role:', existingProfile.role);
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
      
      let { data: userProfile } = await supabaseService.getUserProfile(userId);
      
      if (!userProfile) {
        console.log('[OAuthSignIn] No user profile found, redirecting to onboarding');
        router.replace('/auth/onboarding');
        return;
      }

      // Check for mentor application to determine available roles
      console.log('[OAuthSignIn] Checking for mentor application for:', userProfile.email);
      
      let hasApprovedMentorApplication = false;
      let hasPendingMentorApplication = false;
      
      try {
        const { data: application, error } = await supabase
          .from('mentor_applications')
          .select('*')
          .eq('email', userProfile.email.toLowerCase())
          .single();

        if (!error && application) {
          console.log('[OAuthSignIn] Found mentor application with status:', application.application_status);
          
          if (application.application_status === 'approved') {
            hasApprovedMentorApplication = true;
          } else if (application.application_status === 'pending') {
            hasPendingMentorApplication = true;
          }
        } else if (error && error.code !== 'PGRST116') {
          console.error('[OAuthSignIn] Error checking mentor application:', error);
        } else {
          console.log('[OAuthSignIn] No mentor application found');
        }
      } catch (mentorError) {
        console.error('[OAuthSignIn] Error in mentor check:', mentorError);
      }

      // Handle pending applications - only block NEW users, not existing students
      if (hasPendingMentorApplication) {
        console.log('[OAuthSignIn] User profile check - onboarding_completed:', userProfile.onboarding_completed, 'role:', userProfile.role);
        
        if (userProfile.onboarding_completed && userProfile.role === 'student') {
          console.log('[OAuthSignIn] Existing student has pending mentor application - allowing normal app access');
          // Let existing students continue to use the app normally
        } else {
          console.log('[OAuthSignIn] New user with pending mentor application, redirecting to pending approval');
          router.replace('/auth/pending-approval');
          return;
        }
      }

      // Check if user needs role selection (existing student with approved mentor application)
      if (hasApprovedMentorApplication && userProfile.role === 'student' && userProfile.onboarding_completed) {
        console.log('[OAuthSignIn] User eligible for both roles, showing role selection');
        router.replace('/auth/role-selection');
        return;
      }

      // Auto-upgrade role for new users with approved mentor applications
      if (hasApprovedMentorApplication && !userProfile.onboarding_completed && userProfile.role !== 'mentor' && userProfile.role !== 'both') {
        const newRole = userProfile.role === 'student' ? 'both' : 'mentor';
        console.log('[OAuthSignIn] Auto-upgrading new user role from', userProfile.role, 'to:', newRole);
        
        const { error: updateError } = await supabaseService.updateUserProfile(userId, { role: newRole });
        if (!updateError) {
          userProfile = { ...userProfile, role: newRole };
          console.log('[OAuthSignIn] Role upgraded successfully to:', newRole);
        } else {
          console.error('[OAuthSignIn] Failed to update role:', updateError);
        }
      }

      // Check onboarding status and redirect accordingly  
      if (!userProfile.onboarding_completed) {
        // Check if this is a mentor who needs mentor onboarding
        if ((userProfile.role === 'mentor' || userProfile.role === 'both')) {
          console.log('[OAuthSignIn] Redirecting new mentor to mentor onboarding');
          router.replace('/auth/mentor-onboarding');
        } else {
          console.log('[OAuthSignIn] Redirecting to student onboarding');
          router.replace('/auth/onboarding');
        }
      } else {
        // For BridgeUp, mentors with completed onboarding can go straight to app
        console.log('[OAuthSignIn] Onboarding completed, redirecting to app');
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
      await WebBrowser.openBrowserAsync('https://bridgeup.app/terms-of-service');
    } catch (error) {
      console.error('Error opening terms of service:', error);
    }
  };

  const openPrivacyPolicy = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://bridgeup.app/privacy-policy');
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
              <Text style={styles.logoText}>bridgeup</Text>
            </View>
            <Text style={[styles.subtitle, { color: '#FFFFFF' }]}>
              college admissions advice from verified mentors
            </Text>
          </Animated.View>

          {/* OAuth Buttons */}
          <Animated.View style={[styles.authSection, { transform: [{ translateY: buttonTranslateY }], opacity: buttonOpacity }]}>
            <View style={styles.buttonsContainer}>
              {[
                { provider: 'apple', label: 'Continue with Apple' },
                { provider: 'google', label: 'Continue with Google' }
              ].map(renderOAuthButton)}
              
              {/* Demo Button */}
              <TouchableOpacity
                style={[styles.oauthButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.3)' }]}
                onPress={() => router.push('/demo')}
                activeOpacity={0.8}
              >
                <Ionicons name="play-circle" size={20} color="#FFFFFF" />
                <Text style={[styles.oauthButtonText, { color: '#FFFFFF' }]}>
                  View Live Demo
                </Text>
              </TouchableOpacity>
              
              {/* Bypass Button for Development */}
              <TouchableOpacity
                style={[styles.oauthButton, { backgroundColor: 'rgba(34, 197, 94, 0.9)', borderColor: 'rgba(34, 197, 94, 1)' }]}
                onPress={() => router.replace('/(tabs)/')}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={[styles.oauthButtonText, { color: '#FFFFFF' }]}>
                  Enter App (Bypass)
                </Text>
              </TouchableOpacity>
              
            </View>

            {/* Info Text */}
            <View style={styles.infoContainer}>
              <Text style={[styles.infoText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                new to bridgeup? we'll create your account automatically
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
    backgroundColor: '#FF4DB8', // Ensure no white background shows
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
    fontSize: 54,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -2.5,
    textAlign: 'center',
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '300',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    fontFamily: 'System',
    letterSpacing: 0.5,
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
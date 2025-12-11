import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Platform, ActivityIndicator, Image, Text } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { CURRENT_VERTICAL } from '@/config/current-vertical';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AppProvider } from '@/contexts/AppContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { UserModeProvider } from '@/contexts/UserModeContext';
import { RealTimeProfileProvider } from '@/contexts/RealTimeProfileContext';
import * as supabaseService from '@/lib/supabaseService';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'auth',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
try {
  SplashScreen.preventAutoHideAsync();
} catch (error) {
  console.warn('[RootLayout] SplashScreen.preventAutoHideAsync failed:', error);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) {
      console.error('[RootLayout] Font loading error:', error);
      // Don't throw in production, just log and continue
      if (__DEV__) {
        throw error;
      }
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      console.log('[RootLayout] Fonts loaded, hiding splash screen');
      try {
        SplashScreen.hideAsync().catch((error) => {
          console.warn('[RootLayout] SplashScreen.hideAsync failed:', error);
        });
      } catch (error) {
        console.warn('[RootLayout] SplashScreen.hideAsync sync error:', error);
      }
    }
  }, [loaded]);

  console.log('[RootLayout] Rendering app with fonts loaded:', loaded);

  if (!loaded) {
    return null;
  }
  
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const headerColor = CURRENT_VERTICAL.primaryColor; // Exact match to gradientHero first color
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[1] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    
    // Allow these screens for authenticated users (outside of tabs)
    const allowedScreens = [
      'subscription', 
      'edit-profile', 
      'student-profile', 
      'bridgeup-profile', 
      'notifications', 
      'help', 
      'privacy', 
      'about',
      'chat',
      'modal'
    ];
    const inAllowedScreen = allowedScreens.includes(segments[0]);

    const handleNavigation = async () => {
      if (!user) {
        // No user - go to auth
        if (!inAuthGroup) {
          router.replace('/auth');
        }
      } else {
        // User exists - check onboarding
        try {
          const { data: userProfile, error: profileError } = await supabaseService.getUserProfile(user.id);
          
          if (profileError) {
            console.error('[RootLayout] Profile fetch error:', profileError);
            // If we can't fetch profile, assume onboarding needed
            if (!inOnboarding) {
              router.replace('/auth/onboarding');
            }
            return;
          }
          
          // Check if user has mentor profile - mentors bypass onboarding
          const hasMentorProfile = userProfile?.role === 'mentor' || userProfile?.role === 'both';
          
          // Check if user completed onboarding specifically for this vertical
          const hasCompletedOnboardingForVertical = userProfile?.onboarding_completed && userProfile?.vertical === CURRENT_VERTICAL.name.toLowerCase();
          
          if (!hasCompletedOnboardingForVertical && !hasMentorProfile) {
            // Needs onboarding (students without mentor profile)
            if (!inOnboarding) {
              router.replace('/auth/onboarding');
            }
          } else {
            // Ready for app - either completed onboarding for this vertical OR has mentor profile
            if (!inTabs && !inAllowedScreen) {
              router.replace('/(tabs)');
            }
          }
        } catch (error) {
          console.error('[RootLayout] Error checking profile:', error);
          // On any error, redirect to auth to be safe
          if (!inAuthGroup) {
            router.replace('/auth');
          }
        }
      }
    };

    handleNavigation();
  }, [user, loading, segments]);

  // Show loading screen while checking auth state
  if (loading) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={headerColor} translucent={true} />
      <View style={{
        flex: 1,
        backgroundColor: headerColor
      }}>
        <SafeAreaProvider>
          <SubscriptionProvider>
            <AppProvider>
              <UserProfileProvider>
                <UserModeProvider>
                  <RealTimeProfileProvider>
                    <NotificationProvider>
                      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack
                  screenOptions={{
                    contentStyle: { backgroundColor: headerColor },
                    headerShown: false
                  }}
                >
                  <Stack.Screen name="auth" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="chat" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
                  <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
                  <Stack.Screen name="student-profile" options={{ headerShown: false }} />
                  <Stack.Screen name="bridgeup-profile" options={{ headerShown: false }} />
                  <Stack.Screen name="subscription" options={{ headerShown: false }} />
                  <Stack.Screen name="notifications" options={{ headerShown: false }} />
                  <Stack.Screen name="help" options={{ headerShown: false }} />
                  <Stack.Screen name="privacy" options={{ headerShown: false }} />
                  <Stack.Screen name="about" options={{ headerShown: false }} />
                  <Stack.Screen name="demo" options={{ headerShown: false }} />
                </Stack>
                </ThemeProvider>
                    </NotificationProvider>
                  </RealTimeProfileProvider>
                </UserModeProvider>
              </UserProfileProvider>
            </AppProvider>
          </SubscriptionProvider>
        </SafeAreaProvider>
      </View>
    </>
  );
}

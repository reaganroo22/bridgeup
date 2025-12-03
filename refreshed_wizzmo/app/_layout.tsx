import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Platform, ActivityIndicator, Image, Text } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LoadingScreen from '@/components/LoadingScreen';
import { AppProvider } from '@/contexts/AppContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { UserModeProvider } from '@/contexts/UserModeContext';
import { RealTimeProfileProvider } from '@/contexts/RealTimeProfileContext';
import { getUserProfile, updateUserProfile } from '@/lib/supabaseService';
import * as supabaseService from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';

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
    'Inter-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'), // Using SpaceMono as fallback for now
    'Inter-Medium': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Inter-SemiBold': require('../assets/fonts/SpaceMono-Regular.ttf'), 
    'Inter-Bold': require('../assets/fonts/SpaceMono-Regular.ttf'),
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
  const headerColor = '#FF4DB8'; // Exact match to gradientHero first color
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  
  // Enhanced navigation guard to prevent double-navigation during logout and reload
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasInitialNavigation, setHasInitialNavigation] = useState(false);
  const [appInitialized, setAppInitialized] = useState(false);
  const lastNavigationTime = useRef(0);
  const initializationTime = useRef(Date.now());
  
  // Protected navigation function to prevent double navigation with reload detection
  const safeNavigate = async (path: string, reason: string = '') => {
    if (isNavigating) {
      console.log(`[RootLayout] 🔒 Navigation already in progress, skipping navigation to ${path}`);
      return false;
    }
    
    // Additional check: if we're already on the target path, don't navigate
    const currentPath = `/${segments.join('/')}`;
    if (currentPath === path) {
      console.log(`[RootLayout] ✅ Already on target path ${path}, skipping navigation`);
      return false;
    }
    
    // Enhanced reload protection: Check if app just reloaded/refreshed
    const timeSinceInit = Date.now() - initializationTime.current;
    if (timeSinceInit < 3000) { // 3 seconds grace period after reload
      try {
        const lastNavigation = await AsyncStorage.getItem('lastNavigation');
        if (lastNavigation) {
          const { timestamp, path: lastPath } = JSON.parse(lastNavigation);
          const timeSinceLastNav = Date.now() - timestamp;
          
          // If same navigation happened very recently (within 5 seconds), skip
          if (timeSinceLastNav < 5000 && lastPath === path) {
            console.log(`[RootLayout] 🔄 Recent reload detected, same navigation to ${path} was just performed, skipping`);
            return false;
          }
        }
      } catch (error) {
        console.warn('[RootLayout] AsyncStorage check failed:', error);
      }
    }
    
    // Prevent rapid successive navigation calls during app reload
    if (hasInitialNavigation && Date.now() - lastNavigationTime.current < 2000) {
      console.log(`[RootLayout] ⏰ Too soon since last navigation, skipping ${path}`);
      return false;
    }
    
    console.log(`[RootLayout] 🧭 Safe navigation to: ${path} ${reason ? `(${reason})` : ''}`);
    console.log(`[RootLayout] Current path: ${currentPath} → Target: ${path}`);
    setIsNavigating(true);
    setHasInitialNavigation(true);
    lastNavigationTime.current = Date.now();
    
    // Store navigation in AsyncStorage for reload protection
    try {
      await AsyncStorage.setItem('lastNavigation', JSON.stringify({
        timestamp: Date.now(),
        path: path,
        reason: reason
      }));
    } catch (error) {
      console.warn('[RootLayout] Failed to store navigation state:', error);
    }
    
    try {
      router.replace(path);
      return true;
    } catch (error) {
      console.error(`[RootLayout] Navigation error to ${path}:`, error);
      setIsNavigating(false); // Reset immediately on error
      return false;
    } finally {
      // Reset navigation guard after a delay
      setTimeout(() => {
        setIsNavigating(false);
      }, 2000); // Increased timeout for reload scenarios
    }
  };

  // Comprehensive 6-case mentor application flow logic
  const checkMentorApplication = async (user: any, userProfile: any) => {
    try {
      console.log('🔍 [checkMentorApplication] === STARTING 6-CASE MENTOR APPLICATION CHECK ===');
      console.log('🔍 [checkMentorApplication] User email:', user.email);
      console.log('🔍 [checkMentorApplication] Current user profile:', JSON.stringify(userProfile, null, 2));
      
      const { data: application, error } = await supabase
        .from('mentor_applications')
        .select('*')
        .eq('email', user.email.toLowerCase())
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ [checkMentorApplication] Database error:', error);
        return userProfile;
      }

      // Case 6: No Application - Normal user flow
      if (error && error.code === 'PGRST116') {
        console.log('📋 [checkMentorApplication] === CASE 6: NO APPLICATION ===');
        console.log('✅ [checkMentorApplication] Normal user flow - no mentor application found');
        return userProfile;
      }

      if (application) {
        console.log('📋 [checkMentorApplication] === MENTOR APPLICATION FOUND ===');
        console.log('📋 [checkMentorApplication] Application status:', application.application_status);
        console.log('📋 [checkMentorApplication] User onboarding_completed:', userProfile.onboarding_completed);
        console.log('📋 [checkMentorApplication] User role:', userProfile.role);
        console.log('📋 [checkMentorApplication] User role_selection_completed:', userProfile.role_selection_completed);
        
        if (application.application_status === 'pending') {
          // Case 1: New User + Pending Application
          if (!userProfile.onboarding_completed) {
            console.log('🎯 [checkMentorApplication] === CASE 1: NEW USER + PENDING APPLICATION ===');
            console.log('🎯 [checkMentorApplication] First time login → No onboarding → Pending approval screen');
            return { ...userProfile, mentorApplicationStatus: 'pending', needsPendingApproval: true };
          }
          
          // Case 2: Existing Student + Pending Application
          if (userProfile.onboarding_completed && userProfile.role === 'student') {
            console.log('🎯 [checkMentorApplication] === CASE 2: EXISTING STUDENT + PENDING APPLICATION ===');
            console.log('🎯 [checkMentorApplication] Existing student → Has onboarding → Continues normally (no blocking)');
            return userProfile; // No special flags - just let them use the app
          }
        }
        
        if (application.application_status === 'approved') {
          // SPECIAL CASE: Rejected → Approved mentor application (user needs fresh mentor onboarding)
          if (userProfile.role === 'mentor' && userProfile.onboarding_completed) {
            // Check if they have a mentor profile - if not, they need onboarding
            const { data: mentorProfile } = await supabase
              .from('mentor_profiles')
              .select('bio, experience_description')
              .eq('user_id', user.id)
              .single();
              
            // CRITICAL: Only reset onboarding for users who haven't completed mentor onboarding yet
            // If they completed onboarding but have a profile that looks incomplete, DON'T reset them
            const hasIncompleteProfile = !mentorProfile || 
              !mentorProfile.bio || mentorProfile.bio.length < 10 ||
              !mentorProfile.experience_description || mentorProfile.experience_description.length < 10;
              
            if (hasIncompleteProfile && !userProfile.onboarding_completed) {
              console.log('🎯 [checkMentorApplication] === SPECIAL CASE: REJECTED→APPROVED MENTOR NEEDS FRESH ONBOARDING ===');
              console.log('🎯 [checkMentorApplication] Mentor role but incomplete/no mentor profile → Reset for fresh mentor onboarding');
              
              // Reset onboarding status so they go through mentor onboarding again with preloaded data
              const { error: resetError } = await updateUserProfile(user.id, {
                onboarding_completed: false,
                role_selection_completed: true // Keep mentor role, just reset onboarding
              });
              
              if (!resetError) {
                console.log('✅ [checkMentorApplication] Reset mentor onboarding status for fresh start');
                return { 
                  ...userProfile, 
                  onboarding_completed: false,
                  role_selection_completed: true
                };
              }
            }
          }
          
          // Case 5: Existing Mentor + Any Application Status
          if (userProfile.role === 'mentor' || (userProfile.role === 'both' && userProfile.role_selection_completed)) {
            console.log('🎯 [checkMentorApplication] === CASE 5: EXISTING MENTOR + ANY APPLICATION ===');
            console.log('🎯 [checkMentorApplication] Already mentor → Ignores application → Normal mentor experience');
            return userProfile;
          }
          
          // Case 3: Existing Student + Approved Application
          if (userProfile.onboarding_completed && 
              userProfile.role === 'student' && 
              !userProfile.role_selection_completed) {
            console.log('🎯 [checkMentorApplication] === CASE 3: EXISTING STUDENT + APPROVED APPLICATION ===');
            console.log('🎯 [checkMentorApplication] Existing student → Has onboarding → Role selection popup');
            return { ...userProfile, mentorApplicationStatus: 'approved', needsRoleSelection: true };
          }
          
          // Handle edge case: user has "both" role but hasn't completed selection process
          if (userProfile.onboarding_completed && 
              userProfile.role === 'both' && 
              !userProfile.role_selection_completed) {
            console.log('🎯 [checkMentorApplication] === CASE 3 VARIANT: BOTH ROLE WITHOUT SELECTION ===');
            console.log('🎯 [checkMentorApplication] User has "both" role but never chose it → Role selection required');
            return { ...userProfile, mentorApplicationStatus: 'approved', needsRoleSelection: true };
          }
          
          // Case 4: New User + Approved Application
          if (!userProfile.onboarding_completed) {
            console.log('🎯 [checkMentorApplication] === CASE 4: NEW USER + APPROVED APPLICATION ===');
            console.log('🎯 [checkMentorApplication] First time login → Auto-upgrade role → Mentor onboarding');
            
            // Auto-upgrade role for new users with approved applications
            // CRITICAL FIX: First-time mentors should get pure 'mentor' role, not 'both'
            // Only existing students who applied should get 'both' to preserve their data
            const hasUsedAppAsStudent = userProfile.onboarding_completed; // Already checked false above, but being explicit
            const newRole = hasUsedAppAsStudent ? 'both' : 'mentor';
            console.log('🚀 [checkMentorApplication] Auto-upgrading new user to role:', newRole, '(hasUsedAppAsStudent:', hasUsedAppAsStudent, ')');
            
            const { error: updateError } = await updateUserProfile(user.id, { 
              role: newRole,
              role_selection_completed: true 
            });
            
            if (updateError) {
              console.error('❌ [checkMentorApplication] Failed to auto-upgrade role:', updateError);
              return userProfile;
            }
            
            console.log('✅ [checkMentorApplication] Role auto-upgraded successfully to:', newRole);
            return { ...userProfile, role: newRole, role_selection_completed: true };
          }
          
          // If role selection already completed, maintain current setup
          if (userProfile.role_selection_completed) {
            console.log('✅ [checkMentorApplication] === ROLE SELECTION ALREADY COMPLETED ===');
            console.log('✅ [checkMentorApplication] Maintaining current role:', userProfile.role);
            return userProfile;
          }
        }
        
        // Handle other application statuses (rejected, etc.)
        if (application.application_status === 'rejected') {
          console.log('❌ [checkMentorApplication] === APPLICATION REJECTED ===');
          
          // CRITICAL FIX: Reset role to student and clear role selection for rejected applications
          // This ensures new users can go through student onboarding properly
          if (userProfile.role === 'both' || userProfile.role === 'mentor') {
            console.log('🔧 [checkMentorApplication] Rejected user has non-student role, resetting to student');
            
            try {
              const { error: resetError } = await updateUserProfile(user.id, {
                role: 'student',
                role_selection_completed: false
              });
              
              if (!resetError) {
                console.log('✅ [checkMentorApplication] Role reset to student for rejected application');
                return { 
                  ...userProfile, 
                  role: 'student', 
                  role_selection_completed: false 
                };
              } else {
                console.error('❌ [checkMentorApplication] Failed to reset role:', resetError);
              }
            } catch (error) {
              console.error('❌ [checkMentorApplication] Error resetting role:', error);
            }
          }
          
          console.log('❌ [checkMentorApplication] User can continue as normal student');
          return userProfile;
        }
        
        console.log('⚠️ [checkMentorApplication] Unhandled application status:', application.application_status);
      }

      return userProfile;
    } catch (error) {
      console.error('💥 [checkMentorApplication] Unexpected error:', error);
      return userProfile;
    }
  };

  // Initialize app state and clean up old navigation entries
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Clean up old navigation entries on app start
        const lastNav = await AsyncStorage.getItem('lastNavigation');
        if (lastNav) {
          const { timestamp } = JSON.parse(lastNav);
          const age = Date.now() - timestamp;
          
          // If older than 10 seconds, clean it up
          if (age > 10000) {
            await AsyncStorage.removeItem('lastNavigation');
            console.log('[RootLayout] Cleaned up old navigation state');
          }
        }
        
        setAppInitialized(true);
      } catch (error) {
        console.warn('[RootLayout] App initialization error:', error);
        setAppInitialized(true); // Continue anyway
      }
    };

    initializeApp();
  }, []);

  // Reset navigation guard when user or loading state changes  
  useEffect(() => {
    if (loading) {
      setIsNavigating(false);
    }
    // Don't reset on user change to prevent rapid navigation during auth state changes
  }, [loading]);

  useEffect(() => {
    if (loading) return;
    if (!appInitialized) {
      console.log('[RootLayout] 🔄 App not initialized yet, waiting...');
      return;
    }
    if (isNavigating) {
      console.log('[RootLayout] ⏸️ Navigation in progress, skipping effect');
      return;
    }

    // CRITICAL: For unauthenticated users, navigate immediately without delay
    if (!user && !loading) {
      console.log('[RootLayout] 🚫 NO USER - IMMEDIATE NAVIGATION TO AUTH');
      if (segments[0] !== 'auth') {
        console.log('[RootLayout] 🔄 Emergency redirect to /auth for unauthenticated user');
        safeNavigate('/auth', 'user signed out - redirect to auth').then((navigationSuccess) => {
          // Fallback: If safeNavigate failed, force navigation
          if (!navigationSuccess) {
            console.log('[RootLayout] 🚨 safeNavigate failed, forcing router.replace to /auth');
            router.replace('/auth');
          }
        }).catch(() => {
          // If safeNavigate throws error, force navigation
          console.log('[RootLayout] 🚨 safeNavigate error, forcing router.replace to /auth');
          router.replace('/auth');
        });
      }
      return;
    }

    // Add small delay only for authenticated users to prevent rapid-fire during app reload
    const navigationTimeout = setTimeout(() => {
      console.log('[RootLayout] === NAVIGATION DEBUG ===');
      console.log('[RootLayout] Current segments:', segments);
      console.log('[RootLayout] User exists:', !!user);
      console.log('[RootLayout] Loading state:', loading);
    
    const inAuthGroup = segments[0] === 'auth';
    const inOnboarding = segments[1] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    const isMentorOnboarding = segments[1] === 'mentor-onboarding';
    
    // Allow these screens for authenticated users (outside of tabs)
    const allowedScreens = [
      'subscription', 
      'edit-profile', 
      'student-profile', 
      'wizzmo-profile', 
      'notifications', 
      'help', 
      'privacy', 
      'about',
      'chat',
      'modal'
    ];
    const inAllowedScreen = allowedScreens.includes(segments[0]);
    
    console.log('[RootLayout] Navigation flags:', {
      inAuthGroup, inOnboarding, inTabs, isMentorOnboarding, inAllowedScreen
    });

    const handleNavigation = async () => {
      // CRITICAL: Unauthenticated users MUST go directly to auth - NO other checks
      if (!user) {
        console.log('[RootLayout] 🚫 NO USER - FORCING IMMEDIATE AUTH REDIRECT');
        
        // Clear only onboarding-related cache for logged out users
        try {
          console.log('[RootLayout] 🧹 Clearing onboarding cache for logged out user');
          const allKeys = await AsyncStorage.getAllKeys();
          const onboardingKeys = allKeys.filter(key => 
            key.includes('onboarding') || 
            key.includes('role_selection') ||
            key.includes('user_mode')
          );
          if (onboardingKeys.length > 0) {
            await AsyncStorage.multiRemove(onboardingKeys);
          }
        } catch (error) {
          console.warn('[RootLayout] Could not clear onboarding cache:', error);
        }
        
        if (!inAuthGroup) {
          console.log('[RootLayout] 🔄 Redirecting unauthenticated user to /auth');
          safeNavigate('/auth', 'user logged out');
        } else {
          console.log('[RootLayout] ✅ User already in auth group, staying in auth');
        }
        return; // CRITICAL: Stop all processing for unauthenticated users
      } else {
        // User exists - check onboarding
        try {
          console.log('👤 [RootLayout] === USER EXISTS - CHECKING PROFILE ===');
          console.log('👤 [RootLayout] User ID:', user.id);
          console.log('👤 [RootLayout] User Email:', user.email);
          
          let userProfile;
          try {
            const { data, error: profileError } = await getUserProfile(user.id);
            
            if (profileError) {
              console.error('❌ [RootLayout] Profile fetch error:', profileError);
              
              // Check if this is a "no rows" error (new user - normal case)
              if (profileError.code === 'PGRST116') {
                console.log('🆕 [RootLayout] NEW USER: Auth user exists but no profile found');
                console.log('🆕 [RootLayout] User ID:', user.id);
                console.log('🆕 [RootLayout] User Email:', user.email);
                
                // Define navigation flags for new user case  
                const isPendingApproval = segments[1] === 'pending-approval';
                const isRoleSelection = segments[1] === 'role-selection';
                
                // CRITICAL: Check for mentor application BEFORE directing to onboarding
                console.log('🔍 [RootLayout] === CHECKING MENTOR APPLICATION FOR NEW USER ===');
                try {
                  const { data: application, error: appError } = await supabase
                    .from('mentor_applications')
                    .select('*')
                    .eq('email', user.email.toLowerCase())
                    .single();

                  if (application) {
                    console.log('🎯 [RootLayout] === NEW USER WITH MENTOR APPLICATION ===');
                    console.log('🎯 [RootLayout] Application status:', application.application_status);
                    
                    if (application.application_status === 'pending') {
                      console.log('🎯 [RootLayout] === CASE 1: NEW USER + PENDING APPLICATION ===');
                      console.log('🎯 [RootLayout] Redirecting to pending approval screen');
                      if (!isPendingApproval) {
                        safeNavigate('/auth/pending-approval', 'Case 1: new user with pending application');
                      } else {
                        console.log('✅ [RootLayout] Already on pending approval screen');
                      }
                      return;
                    } else if (application.application_status === 'approved') {
                      console.log('🎯 [RootLayout] === CASE 4: NEW USER + APPROVED APPLICATION ===');
                      console.log('🎯 [RootLayout] Will auto-upgrade during onboarding');
                      // Continue to onboarding, but the checkMentorApplication will handle auto-upgrade
                    }
                  } else {
                    console.log('✅ [RootLayout] === CASE 6: NEW USER WITHOUT APPLICATION ===');
                    console.log('✅ [RootLayout] Normal new user flow');
                  }
                } catch (mentorCheckError) {
                  console.warn('⚠️ [RootLayout] Could not check mentor application:', mentorCheckError);
                  // Continue to onboarding as fallback
                }
                
                // NEW USER FLOW: Go to onboarding (after mentor check)
                if (!inOnboarding && !inAuthGroup) {
                  console.log('🔄 [RootLayout] New user → Redirecting to onboarding');
                  safeNavigate('/auth/onboarding', 'new user needs onboarding');
                } else if (inAuthGroup && !inOnboarding) {
                  console.log('🔄 [RootLayout] New user in auth group → Redirecting to onboarding');
                  safeNavigate('/auth/onboarding', 'new user needs onboarding');
                } else {
                  console.log('✅ [RootLayout] New user already in onboarding flow');
                }
              } else {
                // Other database error - go to auth as fallback
                console.error('❌ [RootLayout] Critical: Profile fetch failed completely');
                if (!inAuthGroup) {
                  safeNavigate('/auth', 'critical profile error fallback');
                }
              }
              return;
            }
            
            userProfile = data;
          } catch (criticalError) {
            console.error('💥 [RootLayout] CRITICAL: getUserProfile threw exception:', criticalError);
            // Force auth redirect on any unexpected error
            if (!inAuthGroup) {
              safeNavigate('/auth', 'critical exception fallback');
            }
            return;
          }
          
          // Handle new user case (no profile exists yet) - this should be rare since we handle PGRST116 above
          if (!userProfile) {
            console.log('🆕 [RootLayout] No profile found after error handling - directing to onboarding');
            console.log('🆕 [RootLayout] User ID:', user.id);
            console.log('🆕 [RootLayout] User Email:', user.email);
            
            // Direct new users to onboarding (normal flow)
            if (!inOnboarding && !inAuthGroup) {
              console.log('🔄 [RootLayout] No profile user → Redirecting to onboarding');
              safeNavigate('/auth/onboarding', 'no profile user needs onboarding');
            } else if (inAuthGroup && !inOnboarding) {
              console.log('🔄 [RootLayout] No profile user in auth → Redirecting to onboarding');
              safeNavigate('/auth/onboarding', 'no profile user needs onboarding');
            } else {
              console.log('✅ [RootLayout] No profile user already in onboarding flow');
            }
            return;
          }

          // Check if user has actually used the app (asked/answered questions)
          let hasUsedApp = false;
          try {
            // Check if user has asked questions
            const { data: questions } = await supabase
              .from('questions')
              .select('id')
              .eq('student_id', user.id)
              .limit(1);
            
            // Check if user has mentor activity
            const { data: sessions } = await supabase
              .from('advice_sessions')
              .select('id')
              .eq('mentor_id', user.id)
              .limit(1);
            
            hasUsedApp = (questions && questions.length > 0) || (sessions && sessions.length > 0);
            console.log('[RootLayout] User has used app:', hasUsedApp);
          } catch (error) {
            console.warn('[RootLayout] Could not check app usage:', error);
          }
          
          // If user has used the app, skip onboarding regardless of missing data
          if (hasUsedApp && userProfile.onboarding_completed) {
            console.log('✅ [RootLayout] Existing user with app activity - skipping onboarding validation');
            // Allow them to proceed even with null username/bio
          } else if (userProfile.onboarding_completed && (!userProfile.username || !userProfile.bio)) {
            console.log('🔄 [RootLayout] New user with missing data - allowing completion anyway');
            // Don't force re-onboarding, just let them proceed
          }

          console.log('✅ [RootLayout] Profile fetched successfully');
          console.log('📋 [RootLayout] User profile before mentor check:', JSON.stringify(userProfile, null, 2));

          // Check for mentor application and update role if needed
          console.log('🔍 [RootLayout] === CALLING MENTOR APPLICATION CHECK ===');
          userProfile = await checkMentorApplication(user, userProfile);
          console.log('✅ [RootLayout] Mentor application check completed');
          console.log('📋 [RootLayout] User profile after mentor check:', JSON.stringify(userProfile, null, 2));
          
          // === HANDLE 6-CASE MENTOR APPLICATION NAVIGATION ===
          const isPendingApproval = segments[1] === 'pending-approval';
          const isRoleSelection = segments[1] === 'role-selection';
          
          console.log('🔍 [RootLayout] === PROCESSING NAVIGATION FOR 6-CASE FLOW ===');
          console.log('🔍 [RootLayout] - needsPendingApproval:', userProfile?.needsPendingApproval);
          console.log('🔍 [RootLayout] - needsRoleSelection:', userProfile?.needsRoleSelection);
          console.log('🔍 [RootLayout] - isPendingApproval screen:', isPendingApproval);
          console.log('🔍 [RootLayout] - isRoleSelection screen:', isRoleSelection);
          
          // Case 1: New User + Pending Application → Pending approval screen
          if (userProfile?.needsPendingApproval && !isPendingApproval) {
            console.log('🎯 [RootLayout] === CASE 1 NAVIGATION ===');
            console.log('🎯 [RootLayout] New user with pending application → Redirecting to pending approval');
            safeNavigate('/auth/pending-approval', 'Case 1: new user with pending application');
            return;
          }

          // If user is on pending approval screen, don't do any other navigation checks
          if (isPendingApproval) {
            console.log('✅ [RootLayout] User is on pending approval screen, allowing access');
            return;
          }

          // Case 3: Existing Student + Approved Application → Role selection popup
          if (userProfile?.needsRoleSelection && !isRoleSelection) {
            console.log('🎯 [RootLayout] === CASE 3 NAVIGATION ===');
            console.log('🎯 [RootLayout] Existing student with approved application → Redirecting to role selection');
            safeNavigate('/auth/role-selection', 'Case 3: student with approved application');
            return;
          }
          
          // CRITICAL FIX: Handle 'both' role users without completed role selection
          // Check if role_selection_completed field exists (in case migration not run)
          const hasRoleSelectionField = userProfile.hasOwnProperty('role_selection_completed');
          console.log('🔍 [RootLayout] role_selection_completed field exists:', hasRoleSelectionField);
          
          if (userProfile.role === 'both' && hasRoleSelectionField && !userProfile.role_selection_completed && !isRoleSelection) {
            console.log('🚨 [RootLayout] CRITICAL: User has "both" role but role selection not completed');
            console.log('🔄 [RootLayout] This indicates incomplete role selection process - forcing completion');
            safeNavigate('/auth/role-selection', 'both role needs completion');
            return;
          }
          
          // SAFETY CHECK: If role_selection_completed field doesn't exist, try to set it
          if (!hasRoleSelectionField && (userProfile.role === 'mentor' || userProfile.role === 'both')) {
            console.log('⚠️ [RootLayout] role_selection_completed field missing - attempting to add via update');
            try {
              await updateUserProfile(user.id, { role_selection_completed: true });
              console.log('✅ [RootLayout] Added missing role_selection_completed field');
            } catch (updateError) {
              console.warn('❌ [RootLayout] Could not add role_selection_completed field:', updateError);
            }
          }
          
          if (userProfile?.needsRoleSelection && isRoleSelection) {
            console.log('✅ [RootLayout] User is already on role selection screen, allowing access');
            return;
          }
          
          // Check if user has mentor profile and completed onboarding
          const hasMentorProfile = userProfile?.mentor_profile || userProfile?.role === 'mentor' || userProfile?.role === 'both';
          
          // Note: Mentor application check is now handled above in checkMentorApplication
          
          if (!userProfile?.onboarding_completed) {
            // Check if this is an existing user who somehow lost their onboarding flag
            if (hasUsedApp) {
              console.log('🔄 [RootLayout] Existing user missing onboarding flag - auto-completing');
              await updateUserProfile(user.id, { onboarding_completed: true });
              // Continue to app - don't force onboarding for existing users
            } else {
              // New user - show appropriate onboarding
              if (hasMentorProfile && !isMentorOnboarding) {
                // Approved mentor needs mentor onboarding
                safeNavigate('/auth/mentor-onboarding', 'mentor needs onboarding');
                return;
              } else if (!hasMentorProfile && !inOnboarding) {
                // Student needs regular onboarding
                safeNavigate('/auth/onboarding', 'student needs onboarding');
                return;
              }
            }
          } else {
            // Onboarding completed - but check for mentor onboarding requirement
            
            // CRITICAL: Only mentors with APPROVED applications can access mentor onboarding
            if ((userProfile.role === 'mentor' || userProfile.role === 'both')) {
              console.log('[RootLayout] 🔍 MENTOR ROLE DETECTED - checking completion status');
              console.log('[RootLayout] Current segments:', segments);
              console.log('[RootLayout] isMentorOnboarding:', isMentorOnboarding);
              
              // VERIFICATION: Check if they actually have an approved application
              let hasApprovedApplication = false;
              let applicationStatus = null;
              try {
                const { data: application, error: appError } = await supabase
                  .from('mentor_applications')
                  .select('application_status')
                  .eq('email', user.email.toLowerCase())
                  .single();
                
                if (appError && appError.code !== 'PGRST116') {
                  console.warn('[RootLayout] Application check error:', appError);
                }
                
                applicationStatus = application?.application_status || null;
                hasApprovedApplication = applicationStatus === 'approved';
                console.log('[RootLayout] 🔍 Application status check:', applicationStatus);
                console.log('[RootLayout] 🔍 Has approved application:', hasApprovedApplication);
              } catch (error) {
                console.warn('[RootLayout] Could not verify application status:', error);
              }
              
              // BLOCK ACCESS: Mentor role requires APPROVED application (not pending/rejected/null)
              if (!hasApprovedApplication) {
                console.log('[RootLayout] 🚫 MENTOR ROLE WITHOUT APPROVED APPLICATION - BLOCKING');
                console.log('[RootLayout] 🚫 Status:', applicationStatus, '- User should not have mentor role!');
                
                // Reset to student role and force re-onboarding for security
                try {
                  const { error: resetError } = await updateUserProfile(user.id, { 
                    role: 'student',
                    role_selection_completed: false,
                    onboarding_completed: false
                  });
                  
                  if (!resetError) {
                    console.log('[RootLayout] ✅ Reset unauthorized mentor role to student - forcing re-onboarding');
                    // Force navigation to auth to reload with new role
                    router.replace('/auth');
                    return;
                  } else {
                    console.error('[RootLayout] ❌ Could not reset role:', resetError);
                    // Even if database update fails, block access
                    safeNavigate('/auth', 'unauthorized mentor access blocked');
                    return;
                  }
                } catch (resetError) {
                  console.error('[RootLayout] ❌ Critical error resetting unauthorized mentor:', resetError);
                  // Block access regardless
                  safeNavigate('/auth', 'security block - unauthorized mentor');
                  return;
                }
              }
              
              // Check if mentor has completed their profile in mentor_profiles table
              let hasMentorProfileRecord = false;
              try {
                const { data: mentorProfile } = await supabase
                  .from('mentor_profiles')
                  .select('id')
                  .eq('user_id', user.id)
                  .single();
                  
                hasMentorProfileRecord = !!mentorProfile;
                console.log('[RootLayout] 🔍 Has mentor_profiles record:', hasMentorProfileRecord);
              } catch (error) {
                console.warn('[RootLayout] Could not check mentor_profiles table:', error);
              }
              
              // If no mentor_profiles record, they MUST complete mentor onboarding (but only if approved)
              if (!hasMentorProfileRecord && hasApprovedApplication) {
                console.log('[RootLayout] 🚫 APPROVED MENTOR WITHOUT MENTOR PROFILE RECORD - NEEDS ONBOARDING');
                
                if (!isMentorOnboarding) {
                  console.log('[RootLayout] 🔄 FORCING REDIRECT TO MENTOR ONBOARDING');
                  safeNavigate('/auth/mentor-onboarding', 'approved mentor needs onboarding');
                  return;
                } else {
                  console.log('[RootLayout] ✅ Already in mentor onboarding - allowing');
                  // Allow mentor onboarding to proceed
                  return;
                }
              } else {
                console.log('[RootLayout] ✅ Mentor profile completed - allowing app access');
              }
            }
            
            // Ready for app
            if (!inTabs && !inAllowedScreen) {
              // For pure mentors, route directly to index (inbox) tab
              // For students and dual-role users, use default tabs routing
              if (userProfile.role === 'mentor' && userProfile.mentor_profile) {
                console.log('[RootLayout] Pure mentor with completed profile - routing to inbox');
                safeNavigate('/(tabs)/', 'mentor to inbox');
              } else {
                safeNavigate('/(tabs)', 'user to tabs');
              }
            }
          }
        } catch (error) {
          console.error('[RootLayout] Error checking profile:', error);
          // On any error, redirect to auth to be safe
          if (!inAuthGroup) {
            safeNavigate('/auth', 'profile error fallback');
          } else {
            console.log('[RootLayout] ⚠️ Profile error, but already in auth group');
          }
        }
      }
    };

      handleNavigation();
    }, 100); // 100ms delay to prevent rapid navigation during reload

    return () => clearTimeout(navigationTimeout);
  }, [user, loading, segments, appInitialized]);

  // Show loading screen while checking auth state OR during initial navigation OR when no user and not on auth
  if (loading || !appInitialized || (!user && segments[0] !== 'auth')) {
    return <LoadingScreen />;
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
            <UserModeProvider>
              <AppProvider>
                <UserProfileProvider>
                  <RealTimeProfileProvider>
                    <NotificationProvider>
                      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack
                  screenOptions={{
                    contentStyle: { backgroundColor: headerColor },
                    headerShown: false
                  }}
                >
                  <Stack.Screen 
                    name="auth" 
                    options={{ 
                      headerShown: false,
                      gestureEnabled: false,
                      animation: 'none'
                    }} 
                  />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="chat" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
                  <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
                  <Stack.Screen name="student-profile" options={{ headerShown: false }} />
                  <Stack.Screen name="wizzmo-profile" options={{ headerShown: false }} />
                  <Stack.Screen name="subscription" options={{ headerShown: false }} />
                  <Stack.Screen name="notifications" options={{ headerShown: false }} />
                  <Stack.Screen name="help" options={{ headerShown: false }} />
                  <Stack.Screen name="privacy" options={{ headerShown: false }} />
                  <Stack.Screen name="about" options={{ headerShown: false }} />
                </Stack>
                </ThemeProvider>
                    </NotificationProvider>
                  </RealTimeProfileProvider>
                </UserProfileProvider>
              </AppProvider>
            </UserModeProvider>
          </SubscriptionProvider>
        </SafeAreaProvider>
      </View>
    </>
  );
}

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
            const newRole = userProfile.role === 'student' ? 'both' : 'mentor';
            console.log('🚀 [checkMentorApplication] Auto-upgrading new user to role:', newRole);
            
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

    // Add small delay to prevent rapid-fire during app reload
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
      if (!user) {
        // No user - go to auth
        if (!inAuthGroup) {
          safeNavigate('/auth', 'user logged out');
        } else {
          console.log('[RootLayout] ✅ User already in auth group, skipping navigation');
        }
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
              
              // Check if this is a "no rows" error (user hasn't completed onboarding)
              if (profileError.code === 'PGRST116') {
                console.log('🚨 [RootLayout] CRITICAL: Auth user exists but no profile found (PGRST116)');
                console.log('🚨 [RootLayout] User ID:', user.id);
                console.log('🚨 [RootLayout] User Email:', user.email);
                
                // Try to create missing OAuth profile as emergency fallback
                try {
                  console.log('🔄 [RootLayout] Attempting emergency profile creation...');
                  const { data: createdProfile, error: createError } = await supabaseService.createOAuthUserProfile(
                    user.id,
                    user.email || '',
                    user.user_metadata?.full_name || '',
                    user.user_metadata?.avatar_url || ''
                  );
                  
                  if (createError) {
                    console.error('❌ [RootLayout] Emergency profile creation failed:', createError);
                  } else if (createdProfile) {
                    console.log('✅ [RootLayout] Emergency profile created successfully - refreshing navigation');
                    // Refresh and try navigation again
                    router.replace('/auth');
                    return;
                  }
                } catch (emergencyError) {
                  console.error('💥 [RootLayout] Emergency profile creation exception:', emergencyError);
                }
                
                console.log('📋 [RootLayout] Profile creation failed, redirecting to auth');
                // Only navigate to onboarding if we're not already in auth flow
                if (!inAuthGroup) {
                  safeNavigate('/auth', 'user needs profile creation');
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
          
          // Handle new user case (no profile exists yet) - try to create profile first
          if (!userProfile) {
            console.log('🚨 [RootLayout] CRITICAL: Auth user exists but no profile found');
            console.log('🚨 [RootLayout] User ID:', user.id);
            console.log('🚨 [RootLayout] User Email:', user.email);
            
            // Try to create missing OAuth profile as emergency fallback
            try {
              console.log('🔄 [RootLayout] Attempting emergency profile creation...');
              const { data: createdProfile, error: createError } = await supabaseService.createOAuthUserProfile(
                user.id,
                user.email || '',
                user.user_metadata?.full_name || '',
                user.user_metadata?.avatar_url || ''
              );
              
              if (createError) {
                console.error('❌ [RootLayout] Emergency profile creation failed:', createError);
              } else if (createdProfile) {
                console.log('✅ [RootLayout] Emergency profile created successfully');
                // Refresh and try navigation again
                router.replace('/auth');
                return;
              }
            } catch (emergencyError) {
              console.error('💥 [RootLayout] Emergency profile creation exception:', emergencyError);
            }
            
            console.log('📋 [RootLayout] No profile exists, redirecting to auth');
            if (!inAuthGroup) {
              safeNavigate('/auth', 'user needs profile creation');
            }
            return;
          }

          // CRITICAL FIX: Handle users with completed onboarding but missing critical data
          if (userProfile.onboarding_completed && (!userProfile.username || !userProfile.bio)) {
            console.error('🚨 [RootLayout] CRITICAL: User has completed onboarding but missing username/bio');
            console.error('🚨 [RootLayout] This user needs to re-complete onboarding to fix data corruption');
            console.log('🔄 [RootLayout] Forcing re-onboarding for data integrity');
            
            // Reset onboarding completion flag to force proper re-onboarding
            await updateUserProfile(user.id, { onboarding_completed: false });
            
            // Route to appropriate onboarding based on role
            const hasMentorProfile = userProfile?.mentor_profile || userProfile?.role === 'mentor' || userProfile?.role === 'both';
            if (hasMentorProfile && !isMentorOnboarding) {
              safeNavigate('/auth/mentor-onboarding', 'fixing corrupted mentor data');
            } else if (!hasMentorProfile && !inOnboarding) {
              safeNavigate('/auth/onboarding', 'fixing corrupted student data');
            }
            return;
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
          if (userProfile.role === 'both' && !userProfile.role_selection_completed && !isRoleSelection) {
            console.log('🚨 [RootLayout] CRITICAL: User has "both" role but role selection not completed');
            console.log('🔄 [RootLayout] This indicates incomplete role selection process - forcing completion');
            safeNavigate('/auth/role-selection', 'both role needs completion');
            return;
          }
          
          if (userProfile?.needsRoleSelection && isRoleSelection) {
            console.log('✅ [RootLayout] User is already on role selection screen, allowing access');
            return;
          }
          
          // Check if user has mentor profile and completed onboarding
          const hasMentorProfile = userProfile?.mentor_profile || userProfile?.role === 'mentor' || userProfile?.role === 'both';
          
          // Note: Mentor application check is now handled above in checkMentorApplication
          
          if (!userProfile?.onboarding_completed) {
            if (hasMentorProfile && !isMentorOnboarding) {
              // Approved mentor needs mentor onboarding
              safeNavigate('/auth/mentor-onboarding', 'mentor needs onboarding');
            } else if (!hasMentorProfile && !inOnboarding) {
              // Student needs regular onboarding
              safeNavigate('/auth/onboarding', 'student needs onboarding');
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

  // Show loading screen while checking auth state
  if (loading) {
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

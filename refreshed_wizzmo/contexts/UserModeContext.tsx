import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import * as supabaseService from '../lib/supabaseService';

type UserMode = 'student' | 'mentor';

interface UserModeContextType {
  currentMode: UserMode | null;
  availableModes: UserMode[];
  switchMode: (mode: UserMode) => Promise<void>;
  refreshUserData: () => Promise<void>;
  canSwitch: boolean;
  isLoading: boolean;
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined);

export function UserModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentMode, setCurrentMode] = useState<UserMode | null>(null); // Start with null to prevent flicker
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');

  // FORCE LOG ON MOUNT TO ENSURE COMPONENT IS RUNNING
  useEffect(() => {
    console.log('🔧 [UserMode] ===== PROVIDER MOUNTED =====');
    console.log('🔧 [UserMode] Initial state:', { 
      hasUser: !!user, 
      userId: user?.id?.slice(0, 8) + '...', 
      currentMode, 
      userRole, 
      isLoading 
    });
  }, []);

  // Fetch user role from database
  useEffect(() => {
    const fetchUserRole = async () => {
      console.log(`🔧 [UserMode] ===== FETCHING USER ROLE =====`);
      console.log(`🔧 [UserMode] User exists: ${!!user}, User ID: ${user?.id?.slice(0, 8)}...`);
      
      if (!user?.id) {
        console.log(`🔧 [UserMode] No user ID, setting loading false`);
        setIsLoading(false);
        return;
      }

      try {
        console.log(`🔧 [UserMode] Calling getUserProfile for: ${user.id.slice(0, 8)}...`);
        const { data: userProfile } = await supabaseService.getUserProfile(user.id);
        console.log(`🔧 [UserMode] Profile fetch result:`, { 
          hasProfile: !!userProfile, 
          role: userProfile?.role, 
          email: userProfile?.email?.slice(0, 10) + '...'
        });
        
        if (userProfile?.role) {
          setUserRole(userProfile.role);
          console.log(`🔧 [UserMode] User role fetched: ${userProfile.role} for ${userProfile.email}`);
          
          // IMMEDIATELY set the correct mode based on role to prevent any flicker
          if (userProfile.role === 'mentor') {
            setCurrentMode('mentor');
            console.log(`🔧 [UserMode] 🎯 PURE MENTOR - immediately set to mentor mode`);
          } else if (userProfile.role === 'student') {
            setCurrentMode('student');
            console.log(`🔧 [UserMode] Student detected - immediately set to student mode`);
          } else if (userProfile.role === 'both') {
            setCurrentMode('mentor'); // Default to mentor for dual role
            console.log(`🔧 [UserMode] Dual role detected - immediately set to mentor mode`);
          }
        } else {
          console.log(`🔧 [UserMode] No user profile or role found for user: ${user.id}`);
          // If no profile, default to student
          setCurrentMode('student');
        }

        // FORCE ROLE VALIDATION: If we have a mentor but wrong mode, fix it immediately
        setTimeout(() => {
          if (userProfile?.role === 'mentor' && currentMode !== 'mentor') {
            console.log('🔧 [UserMode] 🚨 FORCE FIXING: Pure mentor detected with wrong mode');
            setCurrentMode('mentor');
            setUserRole('mentor');
          }
        }, 100);

      } catch (error) {
        console.error('🔧 [UserMode] Error fetching user role:', error);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  // Store available modes in state to prevent unnecessary re-renders
  const [availableModes, setAvailableModes] = useState<UserMode[]>(['student']);
  
  // Update available modes when user role changes
  useEffect(() => {
    const getAvailableModes = (userRole: string): UserMode[] => {
      switch (userRole) {
        case 'student':
          return ['student'];
        case 'mentor':
          return ['mentor'];
        case 'both':
          return ['student', 'mentor'];
        default:
          return ['student'];
      }
    };

    const newAvailableModes = getAvailableModes(userRole);
    setAvailableModes(newAvailableModes);
    
    // If current mode is null or not in available modes, switch to appropriate default
    if (currentMode === null || !newAvailableModes.includes(currentMode)) {
      const defaultMode = userRole === 'mentor' ? 'mentor' : userRole === 'both' ? 'mentor' : 'student';
      if (newAvailableModes.includes(defaultMode)) {
        setCurrentMode(defaultMode);
        console.log(`🔧 [UserMode] Switched to ${defaultMode} because current mode ${currentMode} not available for role ${userRole}`);
      }
    }
  }, [userRole, currentMode]);

  const canSwitch = availableModes.length > 1;


  // Load saved mode from AsyncStorage
  useEffect(() => {
    const loadSavedMode = async () => {
      if (!user || userRole === '') {
        console.log('🔧 [UserMode] Early return - user:', !!user, 'userRole:', userRole);
        setIsLoading(false);
        return;
      }

      // Wait for availableModes to be set
      if (availableModes.length === 0) {
        console.log('🔧 [UserMode] Waiting for available modes to be set');
        return;
      }

      try {
        // CRITICAL: For pure mentors, FORCE mentor mode regardless of saved preferences
        if (userRole === 'mentor') {
          console.log('🔧 [UserMode] 🚫 PURE MENTOR - FORCING mentor mode, ignoring any saved preferences');
          setCurrentMode('mentor');
          await AsyncStorage.setItem(`user_mode_${user.id}`, 'mentor');
          setIsLoading(false);
          return;
        }
        
        const savedMode = await AsyncStorage.getItem(`user_mode_${user.id}`);
        
        // CRITICAL FIX: Check if this is a newly completed mentor onboarding
        // If user has 'both' role and recently completed mentor onboarding, force mentor mode
        const recentMentorOnboarding = await AsyncStorage.getItem(`recent_mentor_onboarding_${user.id}`);
        
        if (recentMentorOnboarding && userRole === 'both') {
          console.log('🔧 [UserMode] 🎯 RECENT MENTOR ONBOARDING - forcing mentor mode regardless of saved preference');
          setCurrentMode('mentor');
          await AsyncStorage.setItem(`user_mode_${user.id}`, 'mentor');
          await AsyncStorage.removeItem(`recent_mentor_onboarding_${user.id}`); // Clean up flag
          return;
        }
        
        if (savedMode && availableModes.includes(savedMode as UserMode)) {
          setCurrentMode(savedMode as UserMode);
          console.log(`🔧 [UserMode] Loaded saved mode: ${savedMode}`);
        } else {
          // Default to mentor mode if user is mentor or both, otherwise student
          let defaultMode: UserMode = 'student';
          if (userRole === 'mentor') {
            defaultMode = 'mentor';
          } else if (userRole === 'both') {
            defaultMode = 'mentor'; // Prefer mentor mode for dual-role users
          }
          
          if (availableModes.includes(defaultMode)) {
            setCurrentMode(defaultMode);
            console.log(`🔧 [UserMode] Set default mode: ${defaultMode} for role: ${userRole}`);
            // Save this default mode to storage
            await AsyncStorage.setItem(`user_mode_${user.id}`, defaultMode);
          }
        }
      } catch (error) {
        console.error('Error loading user mode:', error);
      } finally {
        setIsLoading(false);
        console.log(`🔧 [UserMode] FINISHED LOADING - isLoading set to false`);
      }
    };

    // Only load when we have user, userRole is set, and availableModes is populated
    if (user && userRole !== '' && availableModes.length > 0) {
      loadSavedMode();
    } else if (!user) {
      setIsLoading(false);
    }
  }, [user, userRole, availableModes]);

  const switchMode = async (mode: UserMode) => {
    if (!availableModes.includes(mode)) {
      throw new Error(`Mode ${mode} not available for user`);
    }

    try {
      // Update state immediately for real-time UI updates
      setCurrentMode(mode);
      console.log(`🔄 [UserMode] Switching to ${mode} mode`);
      
      // Persist to AsyncStorage
      if (user) {
        await AsyncStorage.setItem(`user_mode_${user.id}`, mode);
        console.log(`💾 [UserMode] Saved ${mode} mode to storage`);
      }
      
      console.log(`✅ [UserMode] Successfully switched to ${mode} mode`);
    } catch (error) {
      console.error('❌ [UserMode] Error switching user mode:', error);
      throw error;
    }
  };

  // Force refresh user profile and role data
  const refreshUserData = async () => {
    if (!user?.id) {
      console.log('🔄 [UserMode] No user ID, cannot refresh');
      return;
    }

    try {
      console.log('🔄 [UserMode] Force refreshing user role data...');
      setIsLoading(true);
      
      // Re-fetch user profile from database
      const { data: userProfile } = await supabaseService.getUserProfile(user.id);
      console.log('🔄 [UserMode] Refreshed profile role:', userProfile?.role);
      
      if (userProfile?.role) {
        setUserRole(userProfile.role);
        
        // Immediately set the correct mode based on refreshed role
        if (userProfile.role === 'mentor') {
          setCurrentMode('mentor');
          console.log('🔄 [UserMode] 🎯 REFRESHED PURE MENTOR - set to mentor mode');
        } else if (userProfile.role === 'student') {
          setCurrentMode('student');
          console.log('🔄 [UserMode] Refreshed student - set to student mode');
        } else if (userProfile.role === 'both') {
          setCurrentMode('mentor'); // Default to mentor for dual role
          console.log('🔄 [UserMode] Refreshed dual role - set to mentor mode');
        }
      }
    } catch (error) {
      console.error('❌ [UserMode] Error refreshing user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value: UserModeContextType = {
    currentMode,
    availableModes,
    switchMode,
    refreshUserData,
    canSwitch,
    isLoading
  };


  return (
    <UserModeContext.Provider value={value}>
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode() {
  const context = useContext(UserModeContext);
  if (context === undefined) {
    throw new Error('useUserMode must be used within a UserModeProvider');
  }
  return context;
}
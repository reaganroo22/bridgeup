import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import * as supabaseService from '../lib/supabaseService';

type UserMode = 'student' | 'mentor';

interface UserModeContextType {
  currentMode: UserMode;
  availableModes: UserMode[];
  switchMode: (mode: UserMode) => Promise<void>;
  canSwitch: boolean;
  isLoading: boolean;
}

const UserModeContext = createContext<UserModeContextType | undefined>(undefined);

export function UserModeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentMode, setCurrentMode] = useState<UserMode>('student');
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('student');

  // Fetch user role from database
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        console.log('🔧 [UserMode] No user ID available, setting loading to false');
        setIsLoading(false);
        return;
      }

      try {
        console.log(`🔧 [UserMode] Fetching profile for user: ${user.id}`);
        
        // Add retry logic for profile fetch
        let userProfile = null;
        let retries = 3;
        
        while (!userProfile && retries > 0) {
          const { data } = await supabaseService.getUserProfile(user.id);
          userProfile = data;
          
          if (!userProfile && retries > 1) {
            console.log(`🔧 [UserMode] Profile not found, retrying in 1s... (${retries - 1} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          retries--;
        }
        
        if (userProfile?.role) {
          setUserRole(userProfile.role);
          console.log(`🔧 [UserMode] User role fetched: ${userProfile.role} for ${userProfile.email}`);
        } else {
          console.warn(`🔧 [UserMode] No profile found for user ${user.id} after retries`);
          setUserRole('student'); // Default fallback
        }
      } catch (error) {
        console.error('🔧 [UserMode] Error fetching user role:', error);
        setUserRole('student'); // Default fallback
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
  }, [userRole]);

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
        const savedMode = await AsyncStorage.getItem(`user_mode_${user.id}`);
        
        if (savedMode && availableModes.includes(savedMode as UserMode)) {
          setCurrentMode(savedMode as UserMode);
          console.log(`🔧 [UserMode] Loaded saved mode: ${savedMode}`);
        } else {
          // Default to mentor mode if user is mentor or both
          const defaultMode = userRole === 'mentor' || userRole === 'both' ? 'mentor' : 'student';
          if (availableModes.includes(defaultMode)) {
            setCurrentMode(defaultMode);
            console.log(`🔧 [UserMode] Set default mode: ${defaultMode} (userRole: ${userRole})`);
          } else {
            console.warn(`🔧 [UserMode] Default mode ${defaultMode} not available in modes:`, availableModes);
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

  const value: UserModeContextType = {
    currentMode,
    availableModes,
    switchMode,
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
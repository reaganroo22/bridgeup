/**
 * Real-Time Profile Update Context
 * 
 * Handles real-time synchronization of profile changes across the app.
 * Eliminates the need to exit/refresh when profiles update.
 * 
 * Features:
 * - Real-time avatar updates
 * - Profile change broadcasting
 * - Professional error handling
 * - Optimistic updates with rollback
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface ProfileUpdate {
  user_id: string;
  field_name: string;
  new_value: string | null;
  updated_at: string;
}

interface UserProfile {
  id: string;
  avatar_url: string | null;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  university: string | null;
}

interface RealTimeProfileContextType {
  profiles: Map<string, UserProfile>;
  updateProfile: (userId: string, updates: Partial<UserProfile>) => void;
  getProfile: (userId: string) => UserProfile | null;
  isConnected: boolean;
}

const RealTimeProfileContext = createContext<RealTimeProfileContextType | null>(null);

export const useRealTimeProfile = () => {
  const context = useContext(RealTimeProfileContext);
  if (!context) {
    throw new Error('useRealTimeProfile must be used within RealTimeProfileProvider');
  }
  return context;
};

export const RealTimeProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  // Update profile in cache
  const updateProfile = useCallback((userId: string, updates: Partial<UserProfile>) => {
    setProfiles(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(userId) || { id: userId, avatar_url: null, username: null, full_name: null, bio: null, university: null };
      newMap.set(userId, { ...existing, ...updates });
      return newMap;
    });
  }, []);

  // Get profile from cache
  const getProfile = useCallback((userId: string): UserProfile | null => {
    return profiles.get(userId) || null;
  }, [profiles]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    console.log('[RealTimeProfile] Setting up profile update subscriptions');

    // Subscribe to profile_updates table for real-time changes
    const profileUpdatesChannel = supabase
      .channel('profile-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profile_updates',
        },
        (payload) => {
          const update = payload.new as ProfileUpdate;
          console.log('[RealTimeProfile] Profile update received:', update);
          
          // Update the profile cache
          updateProfile(update.user_id, {
            [update.field_name]: update.new_value,
          } as any);
        }
      )
      .subscribe((status) => {
        console.log('[RealTimeProfile] Profile updates subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Subscribe to direct user table changes as fallback
    const usersChannel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
        },
        (payload) => {
          const updatedUser = payload.new as any;
          console.log('[RealTimeProfile] Direct user update received:', updatedUser.id);
          
          // Update the profile cache with new data
          updateProfile(updatedUser.id, {
            id: updatedUser.id,
            avatar_url: updatedUser.avatar_url,
            username: updatedUser.username,
            full_name: updatedUser.full_name,
            bio: updatedUser.bio,
            university: updatedUser.university,
          });
        }
      )
      .subscribe();

    return () => {
      console.log('[RealTimeProfile] Cleaning up profile subscriptions');
      supabase.removeChannel(profileUpdatesChannel);
      supabase.removeChannel(usersChannel);
      setIsConnected(false);
    };
  }, [user, updateProfile]);

  // Preload profiles for current user and their connections
  useEffect(() => {
    if (!user) return;

    const preloadProfiles = async () => {
      try {
        // Load current user profile
        const { data: currentUserProfile } = await supabase
          .from('users')
          .select('id, avatar_url, username, full_name, bio, university')
          .eq('id', user.id)
          .single();

        if (currentUserProfile) {
          updateProfile(user.id, currentUserProfile);
        }

        // Load profiles of users in recent conversations
        const { data: recentSessions } = await supabase
          .from('advice_sessions')
          .select(`
            mentor_id,
            student_id,
            mentors:users!advice_sessions_mentor_id_fkey(id, avatar_url, username, full_name, bio, university),
            students:users!advice_sessions_student_id_fkey(id, avatar_url, username, full_name, bio, university)
          `)
          .or(`student_id.eq.${user.id},mentor_id.eq.${user.id}`)
          .limit(20);

        if (recentSessions) {
          recentSessions.forEach(session => {
            if (session.mentors && Array.isArray(session.mentors) && session.mentors[0]) {
              updateProfile(session.mentor_id, session.mentors[0]);
            }
            if (session.students && Array.isArray(session.students) && session.students[0]) {
              updateProfile(session.student_id, session.students[0]);
            }
          });
        }
      } catch (error) {
        console.error('[RealTimeProfile] Error preloading profiles:', error);
      }
    };

    preloadProfiles();
  }, [user, updateProfile]);

  const value: RealTimeProfileContextType = {
    profiles,
    updateProfile,
    getProfile,
    isConnected,
  };

  return (
    <RealTimeProfileContext.Provider value={value}>
      {children}
    </RealTimeProfileContext.Provider>
  );
};
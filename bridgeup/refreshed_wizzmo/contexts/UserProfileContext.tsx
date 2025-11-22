import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import * as supabaseService from '../lib/supabaseService';

interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  bio?: string;
  avatar_url?: string;
  education_level?: 'high_school' | 'university' | 'graduate' | 'not_student';
  graduation_year?: number | null;
  age?: number;
  gender?: string;
  interests?: string[];
  onboarding_completed?: boolean;
  university?: string;
  created_at?: string;
  updated_at?: string;
}

interface UserProfileContextType {
  userProfile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  isStudent: boolean;
  isHighSchool: boolean;
  isUniversity: boolean;
  isGraduate: boolean;
  getPersonalizedGreeting: () => string;
  getRelevantCategories: () => string[];
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabaseService.getUserProfile(user.id);
      
      if (error) {
        console.error('[UserProfileContext] Error fetching profile:', error);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('[UserProfileContext] Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  // Computed properties based on profile data
  const isStudent = userProfile?.education_level !== 'not_student';
  const isHighSchool = userProfile?.education_level === 'high_school';
  const isUniversity = userProfile?.education_level === 'university';
  const isGraduate = userProfile?.education_level === 'graduate';

  const getPersonalizedGreeting = (): string => {
    const hour = new Date().getHours();
    let timeGreeting = '';
    
    if (hour < 12) timeGreeting = 'good morning';
    else if (hour < 17) timeGreeting = 'good afternoon';
    else timeGreeting = 'good evening';

    // Extract first name from full_name or fall back to username, then to "bestie"
    const firstName = userProfile?.full_name?.split(' ')[0]?.trim() || userProfile?.username?.trim();
    if (!firstName) return `${timeGreeting} bestie 💕`;

    if (isHighSchool) {
      return `${timeGreeting} ${firstName}! how's high school treating you? 🎒`;
    } else if (isUniversity) {
      return `${timeGreeting} ${firstName}! college life hitting different? 📚`;
    } else if (isGraduate) {
      return `${timeGreeting} ${firstName}! grad school is tough but you got this 🎓`;
    } else {
      return `${timeGreeting} ${firstName}! ready to spill some tea? ☕`;
    }
  };

  const getRelevantCategories = (): string[] => {
    if (!userProfile?.interests) return [];

    // Return categories that match user's interests
    const allCategories = [
      'dating-advice', 'crushes', 'first-dates', 'long-distance', 'self-confidence',
      'friendships', 'greek-life', 'campus-life', 'party-culture', 'future-planning',
      'academics', 'hookup-culture', 'relationship-problems', 'breakups',
      'toxic-relationships', 'body-image', 'mental-health', 'social-anxiety',
      'roommate-issues', 'college-stress', 'family-pressure', 'career-anxiety',
      'financial-stress', 'friendship-drama'
    ];

    // Prioritize categories based on education level
    if (isHighSchool) {
      const highSchoolPriority = ['crushes', 'first-dates', 'self-confidence', 'friendships', 'social-anxiety', 'family-pressure'];
      return [...userProfile.interests.filter(i => highSchoolPriority.includes(i)), ...userProfile.interests.filter(i => !highSchoolPriority.includes(i))];
    } else if (isUniversity) {
      const collegePriority = ['dating-advice', 'campus-life', 'greek-life', 'party-culture', 'roommate-issues', 'college-stress', 'career-anxiety'];
      return [...userProfile.interests.filter(i => collegePriority.includes(i)), ...userProfile.interests.filter(i => !collegePriority.includes(i))];
    }

    return userProfile.interests;
  };

  const contextValue: UserProfileContextType = {
    userProfile,
    loading,
    refreshProfile,
    isStudent,
    isHighSchool,
    isUniversity,
    isGraduate,
    getPersonalizedGreeting,
    getRelevantCategories,
  };

  return (
    <UserProfileContext.Provider value={contextValue}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
}
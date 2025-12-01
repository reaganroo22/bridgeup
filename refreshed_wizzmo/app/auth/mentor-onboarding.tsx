import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Image,
  Share,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMode } from '@/contexts/UserModeContext';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import * as supabaseService from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const topics = [
  { id: 'dating', name: 'Dating', emoji: '💕' },
  { id: 'drama-talk', name: 'Drama Talk', emoji: '🗣️' },
  { id: 'matchmaking', name: 'Matchmaking', emoji: '💝' },
  { id: 'classes', name: 'Classes', emoji: '📚' },
  { id: 'roommates', name: 'Roommates', emoji: '🏠' },
  { id: 'style', name: 'Style', emoji: '👗' },
  { id: 'wellness', name: 'Wellness', emoji: '🧘' },
  { id: 'friend-drama', name: 'Friend Drama', emoji: '👭' },
  { id: 'situationships', name: 'Situationships', emoji: '🤷' },
  { id: 'hookup-culture', name: 'Hookup Culture', emoji: '💋' },
  { id: 'study-tips', name: 'Study Tips', emoji: '📖' },
  { id: 'social-life', name: 'Social Life', emoji: '🎉' },
  { id: 'first-dates', name: 'First Dates', emoji: '🌹' },
  { id: 'breakups', name: 'Breakups', emoji: '💔' },
  { id: 'body-image', name: 'Body Image', emoji: '💪' },
  { id: 'self-care', name: 'Self Care', emoji: '🛀' },
  { id: 'greek-life', name: 'Greek Life', emoji: '🏛️' },
  { id: 'making-friends', name: 'Making Friends', emoji: '👯' },
  { id: 'dining-hall', name: 'Dining Hall', emoji: '🍽️' },
  { id: 'confidence', name: 'Confidence', emoji: '✨' },
  { id: 'fashion', name: 'Fashion', emoji: '👠' },
];

const sessionFormats = [
  { id: 'async-chat', name: 'Async chat (within 24–48h)', emoji: '💬' },
  { id: 'live-audio', name: 'Live audio', emoji: '🎤' },
  { id: 'live-video', name: 'Live video', emoji: '📹' },
];

const hoursPerWeek = [
  { value: 1, label: '1–3 hours' },
  { value: 4, label: '4–6 hours' }, 
  { value: 7, label: '7–10 hours' },
  { value: 10, label: '10+ hours' }
];

const currentYear = new Date().getFullYear();
const graduationYears = Array.from({ length: 16 }, (_, i) => (2015 + i).toString());

const universities = [
  'Georgetown University', 'George Washington University', 'American University', 'Harvard University',
  'Stanford University', 'MIT', 'Yale University', 'Princeton University', 'Columbia University',
  'University of Pennsylvania', 'Dartmouth College', 'Brown University', 'Cornell University',
  'Duke University', 'Northwestern University', 'University of Chicago', 'Vanderbilt University',
  'Rice University', 'Notre Dame', 'Emory University', 'UCLA', 'UC Berkeley', 'USC',
  'University of Michigan', 'University of Virginia', 'University of North Carolina',
  'Georgia Tech', 'University of Florida', 'University of Texas', 'New York University',
  'Carnegie Mellon', 'Johns Hopkins', 'Washington University in St. Louis', 'Boston University',
  'Boston College', 'Northeastern University', 'Tulane University', 'University of Miami',
  'Syracuse University', 'Fordham University', 'Villanova University'
];

// Bear state mapping for each step - using all 7 images
const bearStateMapping = {
  1: 'happy',       // Welcome
  2: 'interested',  // Username selection  
  3: 'stargazed',   // Personal info
  4: 'glow',        // Bio & motivation  
  5: 'sleepy',      // Topics/expertise
  6: 'sleepy',      // Availability & formats
  7: 'glowing',     // Media uploads (social media)
  8: 'wizzmo',      // Success
};

const bearImages = {
  'happy': require('@/assets/images/happy.png'),
  'interested': require('@/assets/images/interested.png'),
  'stargazed': require('@/assets/images/stargazed.png'),
  'glow': require('@/assets/images/glow.png'),
  'sleepy': require('@/assets/images/sleepy.png'),
  'glowing': require('@/assets/images/glowing.png'),
  'wizzmo': require('@/assets/images/wizzmo.png'),
};

export default function MentorOnboarding() {
  const { user } = useAuth();
  const { switchMode } = useUserMode();
  const [accessDenied, setAccessDenied] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [universitySearchText, setUniversitySearchText] = useState('');
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [filteredUniversities, setFilteredUniversities] = useState(universities);

  // Animation state
  const [currentBearState, setCurrentBearState] = useState('happy');

  // Form data
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    university: '',
    graduationYear: '',
    major: '',
    selectedTopics: [] as string[],
    selectedFormats: [] as string[],
    weeklyHours: '',
    languages: 'English',
    socialLinks: '',
    profilePhoto: null as any,
    introVideo: null as any,
    bio: '',
    motivation: '',
  });

  // Username validation state
  const [usernameStatus, setUsernameStatus] = useState<'available' | 'taken' | 'checking' | 'error' | null>(null);
  const [usernameTimeout, setUsernameTimeout] = useState<NodeJS.Timeout | null>(null);

  // PROGRESS SAVING: Auto-save mentor form progress
  const saveMentorProgress = async () => {
    if (!user) return;
    try {
      const progress = {
        currentStep,
        formData: {
          ...formData,
          profilePhoto: null, // Don't save photo in storage
          introVideo: null,   // Don't save video in storage
        },
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(`mentor_onboarding_progress_${user.id}`, JSON.stringify(progress));
    } catch (error) {
      console.warn('[MentorOnboarding] Could not save progress:', error);
    }
  };

  // PROGRESS LOADING: Restore mentor form progress on mount
  useEffect(() => {
    const loadMentorProgress = async () => {
      if (!user) return;
      try {
        const saved = await AsyncStorage.getItem(`mentor_onboarding_progress_${user.id}`);
        if (saved) {
          const progress = JSON.parse(saved);
          // Only restore if recent (within 24 hours)
          if (Date.now() - progress.timestamp < 24 * 60 * 60 * 1000) {
            console.log('[MentorOnboarding] Restoring saved progress...');
            setCurrentStep(progress.currentStep || 1);
            setFormData(prev => ({
              ...prev,
              ...progress.formData,
              profilePhoto: null, // Reset media
              introVideo: null,   // Reset media
            }));
          }
        }
      } catch (error) {
        console.warn('[MentorOnboarding] Could not load progress:', error);
      }
    };
    loadMentorProgress();
  }, [user]);

  // AUTO-SAVE: Save progress whenever form data changes
  useEffect(() => {
    saveMentorProgress();
  }, [currentStep, formData]);

  // Bear state transition animation

  // Custom function to handle step changes and scroll to top
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    
    // Update bear state
    const newBearState = bearStateMapping[step] || 'happy';
    setCurrentBearState(newBearState);
    
    // Scroll to top when moving to new step
    if (scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
  };

  // Initialize bear state and add idle animation
  useEffect(() => {
    const initialState = bearStateMapping[currentStep] || 'happy';
    setCurrentBearState(initialState);
  }, [currentStep]);

  // SECURITY: Verify mentor application approval before allowing access
  useEffect(() => {
    const verifyMentorAccess = async () => {
      if (!user?.email) {
        setAccessLoading(false);
        return;
      }

      try {
        console.log('[MentorOnboarding] 🔒 VERIFYING ACCESS for:', user.email);
        
        // Check if user has approved mentor application
        const { data: application, error } = await supabase
          .from('mentor_applications')
          .select('application_status')
          .eq('email', user.email.toLowerCase())
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('[MentorOnboarding] 🚫 Database error checking application:', error);
          setAccessDenied(true);
          setAccessLoading(false);
          return;
        }

        // No application found
        if (error && error.code === 'PGRST116') {
          console.log('[MentorOnboarding] 🚫 NO APPLICATION FOUND - ACCESS DENIED');
          setAccessDenied(true);
          setAccessLoading(false);
          return;
        }

        // Application not approved
        if (application?.application_status !== 'approved') {
          console.log('[MentorOnboarding] 🚫 APPLICATION NOT APPROVED - ACCESS DENIED');
          console.log('[MentorOnboarding] Status:', application?.application_status);
          setAccessDenied(true);
          setAccessLoading(false);
          return;
        }

        console.log('[MentorOnboarding] ✅ ACCESS GRANTED - Approved application found');
        setAccessDenied(false);
        setAccessLoading(false);

      } catch (error) {
        console.error('[MentorOnboarding] 💥 Unexpected access verification error:', error);
        setAccessDenied(true);
        setAccessLoading(false);
      }
    };

    verifyMentorAccess();
  }, [user?.email]);

  // Load existing mentor application data
  useEffect(() => {
    const loadMentorApplicationData = async () => {
      if (!user?.email || accessDenied || accessLoading) return;

      try {
        // Check for existing mentor application
        const { data: application } = await supabaseService.getMentorApplicationByEmail(user.email);
        
        if (application) {
          // Preload application data into form
          setFormData(prev => ({
            ...prev,
            fullName: application.full_name || user.user_metadata?.full_name || '',
            university: application.university || '',
            graduationYear: application.graduation_year?.toString() || '',
            major: application.major || '',
            motivation: application.motivation || '',
            selectedTopics: application.topics_comfortable_with || [],
            selectedFormats: application.session_formats || [],
            weeklyHours: application.hours_per_week || '',
            languages: application.languages || 'English',
          }));

          // Set university search text for dropdown
          if (application.university) {
            setUniversitySearchText(application.university);
          }
        }

        // Also try to load existing user profile data
        const { data: userProfile } = await supabaseService.getUserProfile(user.id);
        if (userProfile) {
          setFormData(prev => {
            // Set university search text if needed
            if (!prev.university && userProfile.university) {
              setUniversitySearchText(userProfile.university);
            }

            return {
              ...prev,
              fullName: prev.fullName || userProfile.full_name || '',
              university: prev.university || userProfile.university || '',
              graduationYear: prev.graduationYear || userProfile.graduation_year?.toString() || '',
              bio: userProfile.bio || '',
            };
          });
        }
      } catch (error) {
        console.error('[MentorOnboarding] Error loading application data:', error);
      }
    };

    loadMentorApplicationData();
  }, [user]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleScrollTap = () => {
    dismissKeyboard();
  };

  const handleUniversitySearch = (text: string) => {
    setUniversitySearchText(text);
    setFormData(prev => ({ ...prev, university: text }));
    
    if (text.length > 0) {
      const filtered = universities.filter(uni =>
        uni.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredUniversities(filtered);
      setShowUniversityDropdown(true);
    } else {
      setFilteredUniversities(universities);
      setShowUniversityDropdown(false);
    }
  };

  const selectUniversity = (university: string) => {
    setFormData(prev => ({ ...prev, university }));
    setUniversitySearchText(university);
    setShowUniversityDropdown(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 2:
        if (!formData.username.trim()) {
          Alert.alert('Username required', 'Please enter a username');
          return false;
        }
        if (formData.username.length < 3) {
          Alert.alert('Username too short', 'Username must be at least 3 characters');
          return false;
        }
        if (usernameStatus !== 'available') {
          Alert.alert('Username not available', 'Please choose a different username');
          return false;
        }
        return true;
      case 3:
        if (!formData.fullName.trim()) {
          Alert.alert('Name required', 'Please enter your full name');
          return false;
        }
        if (!formData.university.trim()) {
          Alert.alert('University required', 'Please enter your university');
          return false;
        }
        if (!formData.graduationYear) {
          Alert.alert('Graduation year required', 'Please select your graduation year');
          return false;
        }
        return true;
      case 4:
        if (!formData.bio.trim()) {
          Alert.alert('Bio required', 'Please add a short bio about yourself');
          return false;
        }
        if (!formData.motivation.trim()) {
          Alert.alert('Motivation required', 'Please tell us why you want to be a mentor');
          return false;
        }
        return true;
      case 5:
        if (formData.selectedTopics.length === 0) {
          Alert.alert('Topics required', 'Please select at least one topic you\'re comfortable advising on');
          return false;
        }
        return true;
      case 6:
        if (formData.selectedFormats.length === 0) {
          Alert.alert('Formats required', 'Please select at least one session format');
          return false;
        }
        if (!formData.weeklyHours) {
          Alert.alert('Hours required', 'Please select how many hours you can dedicate');
          return false;
        }
        return true;
      case 7:
        // PROFILE PHOTO REQUIRED for mentors, intro video optional
        if (!formData.profilePhoto) {
          Alert.alert('Profile photo required', 'Please upload a profile photo to help students connect with you');
          return false;
        }
        // Intro video is optional
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (currentStep === 7) {
      await completeOnboarding();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      handleStepChange(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    if (!user) {
      Alert.alert('Error', 'No user found. Please sign in again.');
      router.replace('/auth');
      return;
    }

    setLoading(true);
    
    try {
      console.log('[MentorOnboarding] Starting bulletproof completion...');
      
      // BULLETPROOF: Handle all optional fields gracefully
      const mentorProfileData = {
        username: formData.username?.trim() || `mentor_${user.id.slice(0, 8)}`,
        full_name: formData.fullName?.trim() || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Mentor',
        university: formData.university?.trim() || null,
        graduation_year: formData.graduationYear ? parseInt(formData.graduationYear) : null,
        bio: formData.bio?.trim() || formData.motivation?.trim() || null,
        major: formData.major?.trim() || null,
        onboarding_completed: true,
        role: 'mentor',
        // Profile photo is required for mentors
        avatar_url: formData.profilePhoto?.uri || null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
      };
      
      let profileSuccess = false;
      let mentorSuccess = false;
      let expertiseSuccess = false;
      
      // ATTEMPT 1: Try service function for user profile
      try {
        console.log('[MentorOnboarding] Attempt 1: Using service function');
        console.log('[MentorOnboarding] 🎯 CRITICAL: Setting role to MENTOR in profile data:', mentorProfileData.role);
        const { error: userError } = await supabaseService.updateUserProfile(user.id, mentorProfileData);
        
        if (!userError) {
          console.log('[MentorOnboarding] ✅ User profile updated successfully with role: mentor');
          profileSuccess = true;
        } else {
          console.warn('[MentorOnboarding] Service function failed:', userError);
        }
      } catch (serviceError) {
        console.warn('[MentorOnboarding] Service function error:', serviceError);
      }
      
      // FALLBACK 1: Direct database upsert if service failed
      if (!profileSuccess) {
        try {
          console.log('[MentorOnboarding] Fallback 1: Direct upsert');
          const { error: directError } = await supabase
            .from('users')
            .upsert({
              id: user.id,
              email: user.email,
              ...mentorProfileData,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            });
          
          if (!directError) {
            console.log('[MentorOnboarding] ✅ Direct upsert successful');
            profileSuccess = true;
          } else {
            console.warn('[MentorOnboarding] Direct upsert failed:', directError);
          }
        } catch (directError) {
          console.warn('[MentorOnboarding] Direct upsert error:', directError);
        }
      }
      
      // If profile creation still failed, it's a real error
      if (!profileSuccess) {
        throw new Error('Could not create user profile after multiple attempts');
      }
      
      // ATTEMPT 2: Create mentor profile record (separate table) - SAVE ALL FORM DATA
      try {
        console.log('[MentorOnboarding] Creating mentor profile record with ALL form data');
        const { error: mentorError } = await supabaseService.updateMentorProfile(user.id, {
          availability_status: 'available',
          verification_status: 'pending',
          is_verified: false,
          bio: formData.bio?.trim() || formData.motivation?.trim() || null,
          session_formats_offered: formData.selectedFormats || [],
          weekly_hour_commitment: formData.weeklyHours ? parseInt(formData.weeklyHours) : 3,
          languages_spoken: formData.languages || 'English',
          social_media_links: formData.socialMediaLinks || null,
          experience_description: formData.motivation?.trim() || null,
          profile_photo_url: formData.profilePhoto?.uri || null,
          intro_video_url: formData.introVideo?.uri || null,
          major: formData.major?.trim() || null,
        });
        
        if (!mentorError) {
          console.log('[MentorOnboarding] ✅ Mentor profile created');
          mentorSuccess = true;
        } else {
          console.warn('[MentorOnboarding] Mentor profile creation failed:', mentorError);
        }
      } catch (mentorError) {
        console.warn('[MentorOnboarding] Mentor profile error:', mentorError);
      }
      
      // ATTEMPT 3: Create mentor expertise (non-critical)
      if (formData.selectedTopics && formData.selectedTopics.length > 0) {
        try {
          console.log('[MentorOnboarding] Creating expertise records');
          const { error: expertiseError } = await supabaseService.createMentorExpertise(
            user.id,
            formData.selectedTopics
          );
          
          if (!expertiseError) {
            console.log('[MentorOnboarding] ✅ Expertise created');
            expertiseSuccess = true;
          } else {
            console.warn('[MentorOnboarding] Expertise creation failed:', expertiseError);
          }
        } catch (expertiseError) {
          console.warn('[MentorOnboarding] Expertise error:', expertiseError);
        }
      }
      
      // Clear saved progress since onboarding completed
      try {
        await AsyncStorage.removeItem(`mentor_onboarding_progress_${user.id}`);
        console.log('[MentorOnboarding] Progress data cleared');
      } catch (cleanupError) {
        console.warn('[MentorOnboarding] Could not clear progress:', cleanupError);
      }
      
      // SUCCESS: If user profile was created (critical), proceed
      if (profileSuccess) {
        console.log('[MentorOnboarding] ✅ COMPLETION SUCCESSFUL', {
          profile: profileSuccess,
          mentor: mentorSuccess,
          expertise: expertiseSuccess
        });
        
        // Force reload user context to pick up new role
        console.log('[MentorOnboarding] 🔄 Forcing user context refresh for role update');
        
        // CRITICAL: Force immediate role verification
        setTimeout(async () => {
          const { data: verifyProfile } = await supabaseService.getUserProfile(user.id);
          console.log('[MentorOnboarding] 🔍 Role verification after completion:', verifyProfile?.role);
        }, 1000);
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        handleStepChange(8); // Success screen
        return;
      }
      
      // FAILURE: Critical profile creation failed
      console.error('[MentorOnboarding] ❌ COMPLETION FAILED - Could not create user profile');
      Alert.alert(
        'Almost there!', 
        'We saved most of your information. Please try completing your profile from the settings page.',
        [
          { text: 'Go to App', onPress: () => router.replace('/(tabs)/') },
          { text: 'Try Again', style: 'cancel' }
        ]
      );
      
    } catch (error) {
      console.error('[MentorOnboarding] Unexpected completion error:', error);
      Alert.alert(
        'Connection Issue',
        'Please check your internet connection and try again.',
        [
          { text: 'Go to App', onPress: () => router.replace('/(tabs)/') },
          { text: 'Retry', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleTopic = (topicId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedTopics: prev.selectedTopics.includes(topicId)
        ? prev.selectedTopics.filter(id => id !== topicId)
        : [...prev.selectedTopics, topicId]
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleFormat = (formatId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedFormats: prev.selectedFormats.includes(formatId)
        ? prev.selectedFormats.filter(id => id !== formatId)
        : [...prev.selectedFormats, formatId]
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleProfilePhotoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData(prev => ({ ...prev, profilePhoto: result.assets[0] }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('Image picker error:', error);
      Alert.alert('Photo upload not available', 'You can add a photo later in your profile settings.');
    }
  };

  const handleIntroVideoUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setFormData(prev => ({ ...prev, introVideo: result.assets[0] }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('Video picker error:', error);
      Alert.alert('Video upload not available', 'You can add an intro video later in your profile settings.');
    }
  };

  // Handle notification permissions
  const handleEnableNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        Alert.alert('Great!', 'You\'ll receive notifications when students ask questions.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.log('Notification permission error:', error);
    }
  };

  // Handle sharing
  const handleShare = async () => {
    try {
      await Share.share({
        message: 'I just became a mentor on Wizzmo! 🐻 Join me in helping college students with dating, relationships & life advice.',
        url: 'https://wizzmo.app',
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  // Bear Component with title
  const BearImage = ({ size = 'medium', title }) => {
    const bearSizes = {
      small: { width: 100, height: 100 },
      medium: { width: 140, height: 140 },
      large: { width: 180, height: 180 },
    };

    return (
      <View style={styles.bearContainer}>
        <Image
          source={bearImages[currentBearState]}
          style={[styles.bearImage, bearSizes[size]]}
          resizeMode="contain"
        />
      </View>
    );
  };

  // Username availability checking
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameStatus(null);
      return;
    }

    setUsernameStatus('checking');
    
    try {
      const { data, error } = await supabaseService.checkUsernameAvailable(username);
      
      if (error) {
        console.error('[MentorOnboarding] Username check error:', error);
        setUsernameStatus('error');
        return;
      }
      
      setUsernameStatus(data ? 'available' : 'taken');
    } catch (error) {
      console.error('[MentorOnboarding] Username check failed:', error);
      setUsernameStatus('error');
    }
  };

  const handleUsernameChange = (text: string) => {
    // Clean username: lowercase, alphanumeric + underscore only
    const cleanUsername = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData(prev => ({ ...prev, username: cleanUsername }));
    
    // Clear existing timeout
    if (usernameTimeout) {
      clearTimeout(usernameTimeout);
    }
    
    // Set new timeout for checking availability
    if (cleanUsername.length >= 3) {
      const timeout = setTimeout(() => {
        checkUsernameAvailability(cleanUsername);
      }, 500);
      setUsernameTimeout(timeout);
    } else {
      setUsernameStatus(null);
    }
  };

  const renderWelcome = () => (
    <View style={styles.stepContent}>
      <View style={styles.logoContainer}>
        <BearImage size="large" />
      </View>
      <Text style={styles.welcomeTitle}>become a wizzmo mentor!</Text>
      <Text style={styles.welcomeSubtitle}>
        help students with dating, relationships & life advice
      </Text>
      
      <View style={styles.featuresList}>
        <View style={styles.feature}>
          <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
          <Text style={styles.featureText}>share your wisdom</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="people-outline" size={20} color="#FFFFFF" />
          <Text style={styles.featureText}>help students succeed</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="star-outline" size={20} color="#FFFFFF" />
          <Text style={styles.featureText}>make a real impact</Text>
        </View>
      </View>
    </View>
  );

  const renderUsername = () => (
    <View style={styles.stepContent}>
      <BearImage size="medium" />
      <Text style={styles.stepDescription}>choose your username</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>username</Text>
        <Text style={styles.inputSubtitle}>this will be your unique handle on wizzmo</Text>
        <View style={styles.usernameInputContainer}>
          <TextInput
            style={[
              styles.textInput,
              styles.usernameInput,
              usernameStatus === 'available' && styles.usernameInputSuccess,
              usernameStatus === 'taken' && styles.usernameInputError
            ]}
            value={formData.username}
            onChangeText={handleUsernameChange}
            placeholder="your_username"
            placeholderTextColor="rgba(0,0,0,0.4)"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            maxLength={20}
            onSubmitEditing={dismissKeyboard}
            blurOnSubmit={true}
          />
          <View style={styles.usernameStatusContainer}>
            {usernameStatus === 'checking' && (
              <ActivityIndicator size="small" color="#FF4DB8" />
            )}
            {usernameStatus === 'available' && (
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            )}
            {usernameStatus === 'taken' && (
              <Ionicons name="close-circle" size={20} color="#FF453A" />
            )}
            {usernameStatus === 'error' && (
              <Ionicons name="warning" size={20} color="#FF9500" />
            )}
          </View>
        </View>
        
        {usernameStatus === 'available' && (
          <Text style={styles.usernameHintSuccess}>✓ username is available!</Text>
        )}
        {usernameStatus === 'taken' && (
          <Text style={styles.usernameHintError}>username already taken</Text>
        )}
        {usernameStatus === 'error' && (
          <Text style={styles.usernameHintError}>error checking availability</Text>
        )}
        {formData.username.length > 0 && formData.username.length < 3 && (
          <Text style={styles.usernameHint}>username must be at least 3 characters</Text>
        )}
        {formData.username.length === 0 && (
          <Text style={styles.usernameHint}>letters, numbers, and underscores only</Text>
        )}
      </View>
    </View>
  );

  const renderPersonalInfo = () => (
    <View style={styles.stepContent}>
      <BearImage size="medium" />
      <Text style={styles.stepDescription}>tell us about yourself</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>full name</Text>
        <TextInput
          style={styles.textInput}
          value={formData.fullName}
          onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
          placeholder="enter your full name"
          placeholderTextColor="rgba(0,0,0,0.4)"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={dismissKeyboard}
          blurOnSubmit={true}
        />
      </View>

      <View style={[styles.inputGroup, styles.universitySearchContainer]}>
        <Text style={styles.inputLabel}>university</Text>
        <TextInput
          style={styles.textInput}
          value={universitySearchText || formData.university}
          onChangeText={handleUniversitySearch}
          onFocus={() => setShowUniversityDropdown(true)}
          placeholder="search for your university..."
          placeholderTextColor="rgba(0,0,0,0.4)"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={dismissKeyboard}
          blurOnSubmit={true}
        />
        {showUniversityDropdown && filteredUniversities.length > 0 && (
          <ScrollView style={styles.universityDropdown} nestedScrollEnabled={true}>
            {filteredUniversities.slice(0, 5).map((university, index) => (
              <TouchableOpacity
                key={index}
                style={styles.universityOption}
                onPress={() => selectUniversity(university)}
              >
                <Text style={styles.universityOptionText}>{university}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>graduation year</Text>
        <View style={styles.wheelPickerContainer}>
          <Picker
            selectedValue={formData.graduationYear}
            style={styles.wheelPicker}
            itemStyle={styles.wheelPickerItem}
            onValueChange={(value) => {
              setFormData(prev => ({ ...prev, graduationYear: value }));
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Picker.Item label="select graduation year" value="" />
            {graduationYears.map((year) => (
              <Picker.Item key={year} label={year} value={year} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>major (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.major}
          onChangeText={(text) => setFormData(prev => ({ ...prev, major: text }))}
          placeholder={
            formData.graduationYear && 
            parseInt(formData.graduationYear) >= currentYear 
              ? "what do you study?" 
              : "what did you study?"
          }
          placeholderTextColor="rgba(0,0,0,0.4)"
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={dismissKeyboard}
          blurOnSubmit={true}
        />
      </View>
    </View>
  );

  const renderBioAndMotivation = () => (
    <View style={styles.stepContent}>
      <BearImage size="medium" />
      <Text style={styles.stepDescription}>share your story</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>bio</Text>
        <Text style={styles.inputSubtitle}>tell students about yourself</Text>
        <TextInput
          style={[styles.textInput, styles.bioInput]}
          value={formData.bio}
          onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
          placeholder="hey! i'm a college senior who loves helping with..."
          placeholderTextColor="rgba(0,0,0,0.4)"
          multiline
          maxLength={200}
          textAlignVertical="top"
          returnKeyType="done"
          onSubmitEditing={dismissKeyboard}
          blurOnSubmit={true}
          scrollEnabled={true}
        />
        <Text style={styles.inputHint}>{formData.bio.length}/200 characters</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>why do you want to be a mentor?</Text>
        <Text style={styles.inputSubtitle}>what motivates you to help?</Text>
        <TextInput
          style={[styles.textInput, styles.bioInput]}
          value={formData.motivation}
          onChangeText={(text) => setFormData(prev => ({ ...prev, motivation: text }))}
          placeholder="i love helping other students because..."
          placeholderTextColor="rgba(0,0,0,0.4)"
          multiline
          maxLength={300}
          textAlignVertical="top"
          returnKeyType="done"
          onSubmitEditing={dismissKeyboard}
          blurOnSubmit={true}
          scrollEnabled={true}
        />
        <Text style={styles.inputHint}>{formData.motivation.length}/300 characters</Text>
      </View>
    </View>
  );

  const renderTopicsAndExpertise = () => (
    <View style={styles.stepContent}>
      <BearImage size="medium" />
      <Text style={styles.stepDescription}>your expertise areas</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>topics you're comfortable with</Text>
        <Text style={styles.inputSubtitle}>select all that apply</Text>
        <View style={styles.topicsGrid}>
          {topics.map((topic) => (
            <TouchableOpacity
              key={topic.id}
              style={[
                styles.topicChip,
                formData.selectedTopics.includes(topic.id) && styles.topicChipSelected
              ]}
              onPress={() => toggleTopic(topic.id)}
            >
              <Text style={styles.topicEmoji}>{topic.emoji}</Text>
              <Text style={[
                styles.topicText,
                formData.selectedTopics.includes(topic.id) && styles.topicTextSelected
              ]}>
                {topic.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderAvailabilityAndFormats = () => (
    <View style={styles.stepContent}>
      <BearImage size="medium" />
      <Text style={styles.stepDescription}>your availability</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>session formats you offer</Text>
        <Text style={styles.inputSubtitle}>select all that apply</Text>
        <View style={styles.formatsGrid}>
          {sessionFormats.map((format) => (
            <TouchableOpacity
              key={format.id}
              style={[
                styles.formatChip,
                formData.selectedFormats.includes(format.id) && styles.formatChipSelected
              ]}
              onPress={() => toggleFormat(format.id)}
            >
              <Text style={styles.formatEmoji}>{format.emoji}</Text>
              <Text style={[
                styles.formatText,
                formData.selectedFormats.includes(format.id) && styles.formatTextSelected
              ]}>
                {format.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>weekly time commitment</Text>
        <Text style={styles.inputSubtitle}>how many hours can you dedicate per week?</Text>
        <View style={styles.optionsGrid}>
          {hoursPerWeek.map((hours) => (
            <TouchableOpacity
              key={hours.value}
              style={[
                styles.optionButton,
                formData.weeklyHours === hours.label && styles.optionButtonSelected
              ]}
              onPress={() => {
                setFormData(prev => ({ ...prev, weeklyHours: hours.label }));
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[
                styles.optionText,
                formData.weeklyHours === hours.label && styles.optionTextSelected
              ]}>
                {hours.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>languages (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.languages}
          onChangeText={(text) => setFormData(prev => ({ ...prev, languages: text }))}
          placeholder="english, spanish, french..."
          placeholderTextColor="rgba(0,0,0,0.4)"
          returnKeyType="done"
          onSubmitEditing={dismissKeyboard}
          blurOnSubmit={true}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>social links (optional)</Text>
        <TextInput
          style={styles.textInput}
          value={formData.socialLinks}
          onChangeText={(text) => setFormData(prev => ({ ...prev, socialLinks: text }))}
          placeholder="instagram, linkedin, portfolio..."
          placeholderTextColor="rgba(0,0,0,0.4)"
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={dismissKeyboard}
          blurOnSubmit={true}
        />
      </View>
    </View>
  );

  const renderMediaUploads = () => (
    <View style={styles.stepContent}>
      <BearImage size="medium" />
      <Text style={styles.stepDescription}>
        add media to enhance your profile
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>profile photo (required)</Text>
        <Text style={styles.inputSubtitle}>add a welcoming photo of yourself</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleProfilePhotoUpload}>
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.uploadGradient}
          >
            <Ionicons 
              name={formData.profilePhoto ? "checkmark-circle" : "camera-outline"} 
              size={20} 
              color={formData.profilePhoto ? "#4CAF50" : "#FF4DB8"} 
            />
            <Text style={[styles.uploadText, formData.profilePhoto && styles.uploadTextSuccess]}>
              {formData.profilePhoto ? 'photo uploaded!' : 'upload photo'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>intro video (optional)</Text>
        <Text style={styles.inputSubtitle}>30-60 seconds introducing yourself</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={handleIntroVideoUpload}>
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.uploadGradient}
          >
            <Ionicons 
              name={formData.introVideo ? "checkmark-circle" : "videocam-outline"} 
              size={20} 
              color={formData.introVideo ? "#4CAF50" : "#FF4DB8"} 
            />
            <Text style={[styles.uploadText, formData.introVideo && styles.uploadTextSuccess]}>
              {formData.introVideo ? 'video uploaded!' : 'upload video'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.stepContent}>
      <BearImage size="large" title="Welcome to the team!" />
      
      <View>
        <LinearGradient
          colors={['#FF4DB8', '#8B5CF6']}
          style={styles.completionIcon}
        >
          <Ionicons name="heart" size={32} color="#FFFFFF" />
        </LinearGradient>
      </View>
      
      <View>
        <Text style={styles.completionTitle}>you're a wizzmo mentor!</Text>
        <Text style={styles.completionSubtitle}>
          congratulations! you're ready to help students succeed.
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={async () => {
            console.log('[MentorOnboarding] 🚀 Start Mentoring pressed - navigating with mentor role');
            
            try {
              // Force switch to mentor mode to trigger context refresh
              console.log('[MentorOnboarding] 🔄 Force switching to mentor mode');
              await switchMode('mentor');
              
              // Small delay to ensure context and database sync
              setTimeout(() => {
                console.log('[MentorOnboarding] ➡️ Navigating to main app as mentor');
                router.replace('/(tabs)/');
              }, 1000);
            } catch (error) {
              console.warn('[MentorOnboarding] Could not switch mode, navigating anyway:', error);
              // Fallback navigation even if mode switch fails
              setTimeout(() => {
                router.replace('/(tabs)/');
              }, 500);
            }
          }}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.continueGradient}
          >
            <Text style={styles.continueButtonText}>start mentoring!</Text>
            <Ionicons name="arrow-forward" size={20} color="#FF4DB8" />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleEnableNotifications}>
          <Text style={styles.secondaryButtonText}>enable notifications</Text>
          <Ionicons name="notifications-outline" size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
          <Text style={styles.secondaryButtonText}>share with friends</Text>
          <Ionicons name="share-outline" size={18} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>

      </View>
    </View>
  );

  const getStepInfo = () => {
    switch (currentStep) {
      case 1: return { title: 'hello!', subtitle: 'welcome to mentor onboarding' };
      case 2: return { title: 'username', subtitle: 'choose your handle' };
      case 3: return { title: 'about you', subtitle: 'basic information' };
      case 4: return { title: 'your story', subtitle: 'share your background' };
      case 5: return { title: 'expertise', subtitle: 'topics you can help with' };
      case 6: return { title: 'availability', subtitle: 'when can you mentor?' };
      case 7: return { title: 'media', subtitle: 'optional profile enhancements' };
      case 8: return { title: 'done!', subtitle: 'you are ready to mentor' };
      default: return { title: '', subtitle: '' };
    }
  };

  const stepInfo = getStepInfo();

  // Show loading screen while checking access
  if (accessLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#FF4DB8', '#8B5CF6']} style={styles.gradientBackground}>
          <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={[styles.stepTitle, { textAlign: 'center', marginTop: 20 }]}>
              verifying access...
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Show access denied screen if no approved application
  if (accessDenied) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#FF4DB8', '#8B5CF6']} style={styles.gradientBackground}>
          <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }]}>
            <Ionicons name="shield-checkmark-outline" size={64} color="#FFFFFF" style={{ marginBottom: 24 }} />
            <Text style={[styles.stepTitle, { textAlign: 'center', marginBottom: 16 }]}>
              access restricted
            </Text>
            <Text style={[styles.stepDescription, { textAlign: 'center', marginBottom: 32 }]}>
              mentor onboarding requires an approved application
            </Text>
            <TouchableOpacity
              style={styles.nextButton}
              onPress={() => router.replace('/(tabs)/')}
            >
              <LinearGradient colors={['#FFFFFF', '#F8F9FA']} style={styles.nextGradient}>
                <Text style={styles.nextButtonText}>back to app</Text>
                <Ionicons name="arrow-forward" size={20} color="#FF4DB8" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF4DB8', '#8B5CF6']}
        style={styles.gradientBackground}
      >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              {currentStep > 1 && currentStep < 8 && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBack}
                >
                  <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              )}
              
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${(currentStep / 8) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.stepCounter}>
                  step {currentStep} of 8
                </Text>
              </View>

              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>{stepInfo.title}</Text>
              <Text style={styles.stepSubtitle}>{stepInfo.subtitle}</Text>
            </View>

            {/* Content */}
            <KeyboardAvoidingView 
              style={styles.keyboardAvoid}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
              <ScrollView 
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                scrollEnabled={true}
                bounces={true}
                alwaysBounceVertical={false}
                contentInsetAdjustmentBehavior="automatic"
                removeClippedSubviews={false}
                onScrollBeginDrag={dismissKeyboard}
                scrollEventThrottle={16}
              >
                {currentStep === 1 && renderWelcome()}
                {currentStep === 2 && renderUsername()}
                {currentStep === 3 && renderPersonalInfo()}
                {currentStep === 4 && renderBioAndMotivation()}
                {currentStep === 5 && renderTopicsAndExpertise()}
                {currentStep === 6 && renderAvailabilityAndFormats()}
                {currentStep === 7 && renderMediaUploads()}
                {currentStep === 8 && renderSuccess()}
              </ScrollView>
            </KeyboardAvoidingView>

            {/* Next Button */}
            {currentStep <= 7 && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={loading ? ['#CCCCCC', '#CCCCCC'] : ['#FFFFFF', '#F8F9FA']}
                    style={styles.nextGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FF4DB8" size="small" />
                    ) : (
                      <>
                        <Text style={styles.nextButtonText}>
                          {currentStep === 7 ? 'complete setup' : 'continue'}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="#FF4DB8" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF4DB8',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 0,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  progressTrack: {
    height: 6,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 0,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
  },
  stepCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'lowercase',
  },
  headerSpacer: {
    width: 44,
  },
  stepHeader: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  stepSubtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
    textTransform: 'lowercase',
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    paddingTop: 20,
    minHeight: '100%',
  },
  stepContent: {
    paddingVertical: 20,
    gap: 24,
  },
  stepDescription: {
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    textTransform: 'lowercase',
  },

  // Welcome Screen
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bearContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bearTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 12,
    textShadow: '0px 1px 2px rgba(0,0,0,0.3)',
  },
  bearImage: {
    width: 80,
    height: 80,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  welcomeSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    textTransform: 'lowercase',
  },
  featuresList: {
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },

  // Form Components
  inputGroup: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  inputSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: -8,
    textTransform: 'lowercase',
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  bioInput: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'lowercase',
  },

  // University Search Dropdown
  universitySearchContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  universityDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderTopWidth: 0,
    maxHeight: 200,
    zIndex: 1000,
  },
  universityOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  universityOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },

  // Wheel Picker
  wheelPickerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 3,
    borderColor: '#000000',
    borderRadius: 0,
    marginVertical: 8,
    height: 180,
    overflow: 'hidden',
  },
  wheelPicker: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  wheelPickerItem: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    height: 180,
  },

  // Options Grid
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 70,
  },
  optionButtonSelected: {
    backgroundColor: '#FF4DB8',
    borderColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },

  // Topics
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 6,
  },
  topicChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  topicEmoji: {
    fontSize: 14,
  },
  topicText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  topicTextSelected: {
    color: '#FF4DB8',
  },

  // Formats
  formatsGrid: {
    gap: 12,
  },
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  formatChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  formatEmoji: {
    fontSize: 16,
  },
  formatText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'lowercase',
    flex: 1,
  },
  formatTextSelected: {
    color: '#FF4DB8',
  },

  // Upload Buttons
  uploadButton: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  uploadGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF4DB8',
    textTransform: 'lowercase',
  },
  uploadTextSuccess: {
    color: '#4CAF50',
  },

  // Completion
  completionIcon: {
    width: 64,
    height: 64,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  completionSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    textTransform: 'lowercase',
  },
  actionButtons: {
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 0,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'lowercase',
  },

  // Buttons
  continueButton: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  continueGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF4DB8',
    textTransform: 'lowercase',
  },

  // Next Button
  buttonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'transparent',
    gap: 12,
  },
  nextButton: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF4DB8',
    textTransform: 'lowercase',
  },

  // Username Input Styles
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  usernameInput: {
    flex: 1,
  },
  usernameInputSuccess: {
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  usernameInputError: {
    borderColor: '#FF453A',
    borderWidth: 3,
  },
  usernameStatusContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  usernameHint: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'lowercase',
  },
  usernameHintSuccess: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    textTransform: 'lowercase',
  },
  usernameHintError: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF453A',
    textTransform: 'lowercase',
  },
});
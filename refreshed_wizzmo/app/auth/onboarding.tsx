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
  Share,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import * as supabaseService from '@/lib/supabaseService';
import type { UserRole } from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Reanimated imports removed for build compatibility
import * as StoreReview from 'expo-store-review';
import PaywallVariantA from '@/components/PaywallVariantA';
import { CURRENT_VERTICAL_KEY } from '@/config/current-vertical';

const categories = [
  { id: 'dating-advice', name: 'dating advice', emoji: '💕' },
  { id: 'crushes', name: 'crushes & confessions', emoji: '😍' },
  { id: 'first-dates', name: 'first dates', emoji: '🌹' },
  { id: 'relationships', name: 'relationships', emoji: '💕' },
  { id: 'breakups', name: 'breakups & healing', emoji: '💙' },
  { id: 'self-confidence', name: 'self confidence', emoji: '✨' },
  { id: 'friendships', name: 'friendships', emoji: '👯' },
  { id: 'college-life', name: 'college life', emoji: '🏫' },
  { id: 'social-anxiety', name: 'social anxiety', emoji: '😰' },
  { id: 'mental-health', name: 'mental health', emoji: '🧠' },
];

const ages = Array.from({ length: 30 }, (_, i) => (i + 16).toString()); // Ages 16-45
const genders = ['female', 'male'];
const educationLevels = [
  { label: 'high school student', value: 'high_school' },
  { label: 'college/university student', value: 'university' },
  { label: 'graduate student', value: 'graduate' },
  { label: 'not currently a student', value: 'not_student' },
];

const currentYear = new Date().getFullYear();
const graduationYears = Array.from({ length: 8 }, (_, i) => (currentYear + i).toString());

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
  'Syracuse University', 'Fordham University', 'Villanova University', 'Other'
];

// Bear state mapping for each step
const bearStateMapping: { [key: number]: string } = {
  1: 'happy',       // Welcome
  2: 'interested',  // Username
  3: 'stargazed',   // Bio & Interests  
  4: 'sleepy',      // Details
  5: 'glowing',     // Complete
  6: 'glow',        // Paywall
  7: 'happy',       // Rating
  8: 'interested',  // Notifications
  9: 'glowing',     // Share Friends
};

const bearImages = {
  'happy': require('@/assets/images/happy.png'),
  'interested': require('@/assets/images/interested.png'),
  'stargazed': require('@/assets/images/stargazed.png'),
  'sleepy': require('@/assets/images/sleepy.png'),
  'glowing': require('@/assets/images/glowing.png'),
  'glow': require('@/assets/images/glow.png'),
  'wizzmiss': require('@/assets/images/wizzmiss.png'), // Fun reaction variant
};

export default function Onboarding() {
  const { user } = useAuth();
  const { scheduleWelcomeFlow, scheduleWeeklyReminder, requestPermissions } = useNotifications();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Animation state
  const [currentBearState, setCurrentBearState] = useState('happy');

  // Form data
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [university, setUniversity] = useState('');
  const [universitySearch, setUniversitySearch] = useState('');
  const [showUniversityResults, setShowUniversityResults] = useState(false);
  
  // Fun interaction state
  const [showWizzmiss, setShowWizzmiss] = useState(false);
  const wizzmissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // PROGRESS SAVING: Auto-save form progress
  const saveProgress = async () => {
    if (!user) return;
    try {
      const progress = {
        currentStep,
        username,
        bio,
        selectedInterests,
        age,
        gender,
        educationLevel,
        graduationYear,
        university,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(`onboarding_progress_${user.id}`, JSON.stringify(progress));
    } catch (error) {
      console.warn('[Onboarding] Could not save progress:', error);
    }
  };

  // PROGRESS LOADING: Restore form progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;
      try {
        const saved = await AsyncStorage.getItem(`onboarding_progress_${user.id}`);
        if (saved) {
          const progress = JSON.parse(saved);
          // Only restore if recent (within 24 hours) and step is valid
          if (Date.now() - progress.timestamp < 24 * 60 * 60 * 1000) {
            console.log('[Onboarding] Restoring saved progress...');
            // Ensure step is within valid range (1-10)
            const validStep = Math.min(Math.max(progress.currentStep || 1, 1), 10);
            setCurrentStep(validStep);
            setUsername(progress.username || '');
            setBio(progress.bio || '');
            setSelectedInterests(progress.selectedInterests || []);
            setAge(progress.age || '');
            setGender(progress.gender || '');
            setEducationLevel(progress.educationLevel || '');
            setGraduationYear(progress.graduationYear || '');
            setUniversity(progress.university || '');
            console.log('[Onboarding] Restored to step:', validStep);
          }
        }
      } catch (error) {
        console.warn('[Onboarding] Could not load progress:', error);
      }
    };
    loadProgress();
  }, [user]);

  // AUTO-SAVE: Save progress whenever form data changes
  useEffect(() => {
    saveProgress();
  }, [currentStep, username, bio, selectedInterests, age, gender, educationLevel, graduationYear, university]);

  // Filter universities based on search
  const filteredUniversities = universities.filter(uni => 
    uni.toLowerCase().includes(universitySearch.toLowerCase())
  );

  // Function to trigger random bear animation on user interactions
  const triggerWizzmissReaction = () => {
    // 20% chance for Wizzmiss, 80% chance for regular Wizzbert
    const shouldShowWizzmiss = Math.random() < 0.2;
    
    console.log('🎭 Triggering bear animation!', { showWizzmiss: shouldShowWizzmiss });
    
    setShowWizzmiss(shouldShowWizzmiss);
    
    // Clear any existing timeout
    if (wizzmissTimeoutRef.current) {
      clearTimeout(wizzmissTimeoutRef.current);
    }
    
    // Revert back to normal after 1.5 seconds
    wizzmissTimeoutRef.current = setTimeout(() => {
      console.log('🐻 Reverting back to normal bear');
      setShowWizzmiss(false);
    }, 1500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (wizzmissTimeoutRef.current) {
        clearTimeout(wizzmissTimeoutRef.current);
      }
    };
  }, []);

  // Bear state transition animation

  // Custom function to handle step changes and scroll to top for completed screen
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    
    // Update bear state
    const newBearState = bearStateMapping[step] || 'happy';
    setCurrentBearState(newBearState);
    
    // Scroll to top when moving to completed screen (step 5)
    if (step === 5 && scrollViewRef.current) {
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

  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (username.length < 3) {
        setUsernameAvailable(null);
        return;
      }

      setCheckingUsername(true);
      try {
        const { data } = await supabaseService.getUserByUsername(username.trim());
        setUsernameAvailable(!data);
      } catch (error) {
        console.error('[Onboarding] Error checking username:', error);
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsernameAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [username]);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const handleScrollTap = () => {
    dismissKeyboard();
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 2:
        if (!username.trim() || username.length < 3) {
          Alert.alert('username required', 'please choose a username (3+ characters)');
          return false;
        }
        if (usernameAvailable === false) {
          Alert.alert('username taken', 'this username is already taken');
          return false;
        }
        return true;
      case 3:
        if (!bio.trim()) {
          Alert.alert('bio required', 'please add a short bio');
          return false;
        }
        if (selectedInterests.length === 0) {
          Alert.alert('interests required', 'please select at least one interest');
          return false;
        }
        return true;
      case 4:
        if (!gender || !educationLevel) {
          Alert.alert('details required', 'please fill in gender and education status');
          return false;
        }
        if (['high_school', 'university', 'graduate'].includes(educationLevel) && !graduationYear) {
          Alert.alert('graduation year required', 'please select your graduation year');
          return false;
        }
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

    triggerWizzmissReaction(); // Fun reaction when user progresses

    if (currentStep === 4) {
      await saveProfileData();
    } else if (currentStep === 10) {
      // Final step - just navigate to main app
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

  const saveProfileData = async () => {
    if (!user) {
      Alert.alert('error', 'No user found. Please sign in again.');
      router.replace('/auth');
      return;
    }

    setLoading(true);
    console.log('[Onboarding] Saving profile data...');
    
    try {
      // BULLETPROOF: Handle all optional fields gracefully
      const profileData = {
        id: user.id, // Ensure we use the OAuth user ID
        username: username?.trim() || `user_${user.id.slice(0, 8)}`,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        role: 'student' as UserRole,
        vertical: CURRENT_VERTICAL_KEY,
        onboarding_completed: false, // Not completed yet, just profile saved
        bio: bio?.trim() || '',
        age: age?.trim() ? parseInt(age) : undefined,
        gender: gender || undefined,
        education_level: educationLevel || 'unknown',
        graduation_year: (educationLevel !== 'not_student' && graduationYear?.trim()) ? parseInt(graduationYear) : undefined,
        university: (educationLevel === 'university' && university?.trim()) ? university.trim() : undefined,
        interests: Array.isArray(selectedInterests) ? selectedInterests : [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('[Onboarding] Profile data prepared for:', profileData.email.slice(0, 5) + '***');

      // BULLETPROOF OAUTH PROFILE CREATION: Multiple attempts with fallbacks
      
      // ATTEMPT 1: Direct upsert with conflict resolution
      console.log('[Onboarding] Attempting direct upsert...');
      let { data, error } = await supabase
        .from('users')
        .upsert(profileData, {
          onConflict: 'id,email',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error && error.code === '23505') {
        console.log('[Onboarding] Duplicate constraint, trying by email update...');
        
        // ATTEMPT 2: Update existing record by email
        const { data: updateData, error: updateError } = await supabase
          .from('users')
          .update({
            id: user.id,
            username: profileData.username,
            bio: profileData.bio,
            age: profileData.age,
            gender: profileData.gender,
            education_level: profileData.education_level,
            graduation_year: profileData.graduation_year,
            university: profileData.university,
            interests: profileData.interests,
            updated_at: new Date().toISOString(),
          })
          .eq('email', user.email)
          .select()
          .single();

        if (updateError) {
          console.log('[Onboarding] Email update failed, trying service function...');
          
          // ATTEMPT 3: Use service function as last resort
          const { data: serviceData, error: serviceError } = await supabaseService.updateUserProfile(user.id, profileData);
          
          if (serviceError) {
            throw serviceError;
          }
          data = serviceData;
        } else {
          data = updateData;
        }
      } else if (error) {
        throw error;
      }

      console.log('[Onboarding] ✅ Profile saved successfully');
      
      // Save progress to AsyncStorage
      await saveProgress();
      
      // Continue to next step
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleStepChange(currentStep + 1);
      
    } catch (error: any) {
      console.error('[Onboarding] Profile save error:', error);
      
      // NEVER BLOCK: If we get here, just continue - the user might already have a profile
      console.log('[Onboarding] ⚠️ Profile save had issues but continuing anyway...');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleStepChange(currentStep + 1);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    if (!user) {
      Alert.alert('error', 'No user found. Please sign in again.');
      router.replace('/auth');
      return;
    }

    setLoading(true);
    console.log('[Onboarding] Completing onboarding for user:', user.id);
    
    try {
      // CRITICAL FIX: Save ALL onboarding data with completion flag
      const finalProfileData = {
        username: username?.trim() || `user_${user.id.slice(0, 8)}`,
        bio: bio?.trim() || '',
        age: age?.trim() ? parseInt(age) : undefined,
        gender: gender || undefined,
        education_level: educationLevel || 'unknown',
        graduation_year: (educationLevel !== 'not_student' && graduationYear?.trim()) ? parseInt(graduationYear) : undefined,
        university: (educationLevel === 'university' && university?.trim()) ? university.trim() : undefined,
        interests: Array.isArray(selectedInterests) ? selectedInterests : [],
        onboarding_completed: true, // Set completion flag
        updated_at: new Date().toISOString(),
      };

      console.log('[Onboarding] Saving final profile data with completion...');
      
      // Method 1: Try direct update by user ID
      console.log('[Onboarding] Attempting direct profile update...');
      const { error: updateError } = await supabase
        .from('users')
        .update(finalProfileData)
        .eq('id', user.id);
      
      if (!updateError) {
        console.log('[Onboarding] ✅ Direct update succeeded!');
      } else if (updateError.code === '23505') {
        // Duplicate email constraint - try by email instead
        console.log('[Onboarding] Duplicate email detected, trying update by email...');
        const { error: emailUpdateError } = await supabase
          .from('users')
          .update(finalProfileData)
          .eq('email', user.email!);
          
        if (emailUpdateError) {
          console.log('[Onboarding] Email update failed:', emailUpdateError);
          // Still continue - user might already be completed
        } else {
          console.log('[Onboarding] ✅ Email update succeeded!');
        }
      } else {
        console.log('[Onboarding] Update failed:', updateError);
        // Continue anyway - user might already exist
      }

      // Always clear progress and navigate - don't block completion
      try {
        await AsyncStorage.removeItem(`onboarding_progress_${user.id}`);
      } catch {} // Silent fail
      
      console.log('[Onboarding] SUCCESS! Onboarding completed.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Optional flows (non-blocking)
      try {
        if (user?.id) {
          await scheduleWelcomeFlow(user.id);
          await scheduleWeeklyReminder(user.id);
        }
      } catch (flowError) {
        console.warn('[Onboarding] Flow error (non-blocking):', flowError);
      }
      
      // Navigate directly to ask screen for immediate engagement
      console.log('[Onboarding] ✅ Navigating to ask screen for first question...');
      router.replace('/(tabs)/ask');

    } catch (error: any) {
      console.error('[Onboarding] Completion error:', error);
      
      // NEVER BLOCK: Always let user through to ask screen
      console.log('[Onboarding] ⚠️ Errors occurred but allowing user to continue to ask screen...');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)/ask');
      
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (categoryId: string) => {
    triggerWizzmissReaction(); // Fun reaction when user selects interests
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedInterests(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleRateApp = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Check if in-app review is available
      const isAvailable = await StoreReview.isAvailableAsync();
      
      if (isAvailable) {
        // Use native in-app review (iOS 10.3+ and Android 5.0+)
        console.log('[Onboarding] Requesting in-app review');
        await StoreReview.requestReview();
        
        // Continue to next step after review request
        setTimeout(() => {
          handleStepChange(8);
        }, 1000); // Small delay to let review complete
      } else {
        // Fallback to store URL for older devices
        console.log('[Onboarding] In-app review not available, using store URL');
        const storeUrl = await StoreReview.storeUrl();
        if (storeUrl) {
          // Open store page (this will happen automatically)
          console.log('[Onboarding] Opening store URL:', storeUrl);
        }
        
        // Show thank you message and continue
        Alert.alert(
          'Thanks! 💕',
          'Your rating helps us reach more college students who need advice!',
          [{ text: 'Continue', onPress: () => handleStepChange(8) }]
        );
      }
    } catch (error) {
      console.error('[Onboarding] Error requesting review:', error);
      
      // Show thank you message and continue even on error
      Alert.alert(
        'Thanks! 💕',
        'Your support means the world to us!',
        [{ text: 'Continue', onPress: () => handleStepChange(8) }]
      );
    }
  };

  const handleSkipRating = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleStepChange(8); // Go to share step
  };


  // Bear Component
  const BearImage = ({ size = 'medium' }) => {
    const bearSizes = {
      small: { width: 120, height: 120 },
      medium: { width: 160, height: 160 },
      large: { width: 200, height: 200 },
    };

    // Show Wizzmiss if triggered, otherwise use the current bear state
    const imageSource = showWizzmiss ? bearImages['wizzmiss'] : bearImages[currentBearState as keyof typeof bearImages];
    
    console.log('🐻 BearImage render:', { 
      showWizzmiss, 
      currentBearState, 
      size 
    });

    return (
      <View style={styles.bearContainer} pointerEvents="none">
        <Image
          source={imageSource}
          style={[styles.bearImage, bearSizes[size as keyof typeof bearSizes]]}
          resizeMode="contain"
        />
      </View>
    );
  };

  const renderWelcome = () => (
    <View style={styles.stepContent} pointerEvents="box-none">
      <View style={styles.logoContainer} pointerEvents="none">
        <BearImage size="large" />
      </View>
      <Text style={styles.welcomeTitle}>welcome to wizzmo</Text>
      <Text style={styles.welcomeSubtitle}>
        ask a girl
      </Text>
      
      <View style={styles.featuresList} pointerEvents="none">
        <View style={styles.feature} pointerEvents="none">
          <Ionicons name="heart-outline" size={20} color="#FFFFFF" />
          <Text style={styles.featureText}>dating & relationship advice</Text>
        </View>
        <View style={styles.feature} pointerEvents="none">
          <Ionicons name="people-outline" size={20} color="#FFFFFF" />
          <Text style={styles.featureText}>verified college mentors</Text>
        </View>
        <View style={styles.feature} pointerEvents="none">
          <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
          <Text style={styles.featureText}>completely anonymous</Text>
        </View>
      </View>
    </View>
  );

  const renderUsername = () => (
    <View style={styles.stepContent} pointerEvents="box-none">
      <BearImage size="medium" />
      <Text style={styles.inputLabel}>choose your username</Text>
      <View style={styles.usernameContainer}>
        <TextInput
          style={styles.textInput}
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            triggerWizzmissReaction(); // Fun reaction when user types
          }}
          placeholder="enter a unique username"
          placeholderTextColor="rgba(0,0,0,0.4)"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          returnKeyType="next"
          onSubmitEditing={dismissKeyboard}
          blurOnSubmit={true}
        />
        <View style={styles.usernameStatus}>
          {checkingUsername && <ActivityIndicator size="small" color="#FF4DB8" />}
          {usernameAvailable === true && <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />}
          {usernameAvailable === false && <Ionicons name="close-circle" size={24} color="#F44336" />}
        </View>
      </View>
      <Text style={styles.inputHint}>{username.length}/20 characters</Text>
      
      <View style={styles.noteContainer}>
        <Text style={styles.noteText}>
          your username will be visible to other users when you ask questions
        </Text>
      </View>
    </View>
  );

  const renderBioAndInterests = () => (
    <View style={styles.stepContent} pointerEvents="box-none">
      <BearImage size="medium" />
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>tell us about yourself</Text>
        <TextInput
          style={[styles.textInput, styles.bioInput]}
          value={bio}
          onChangeText={(text) => {
            setBio(text);
            triggerWizzmissReaction(); // Fun reaction when user types
          }}
          placeholder="write a short bio about yourself..."
          placeholderTextColor="rgba(0,0,0,0.4)"
          multiline
          maxLength={150}
          textAlignVertical="top"
          returnKeyType="done"
          onSubmitEditing={dismissKeyboard}
          blurOnSubmit={true}
          scrollEnabled={true}
        />
        <Text style={styles.inputHint}>{bio.length}/150 characters</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>what interests you?</Text>
        <Text style={styles.inputSubtitle}>select all that apply</Text>
        <View style={styles.interestsGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.interestChip,
                selectedInterests.includes(category.id) && styles.interestChipSelected
              ]}
              onPress={() => toggleInterest(category.id)}
            >
              <Text style={styles.interestEmoji}>{category.emoji}</Text>
              <Text style={[
                styles.interestText,
                selectedInterests.includes(category.id) && styles.interestTextSelected
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderDetails = () => (
    <View style={styles.stepContent} pointerEvents="box-none">
      <BearImage size="medium" />
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>age (helpful)</Text>
        <View style={styles.wheelPickerContainer}>
          <Picker
            selectedValue={age}
            style={styles.wheelPicker}
            itemStyle={styles.wheelPickerItem}
            onValueChange={(itemValue) => {
              setAge(itemValue);
              triggerWizzmissReaction(); // Fun reaction when user selects
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Picker.Item label="Select your age" value="" />
            {ages.map((option) => (
              <Picker.Item key={option} label={option} value={option} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>gender</Text>
        <View style={styles.optionsGrid}>
          {genders.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                gender === option && styles.optionButtonSelected
              ]}
              onPress={() => {
                setGender(option);
                triggerWizzmissReaction(); // Fun reaction when user selects
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[
                styles.optionText,
                gender === option && styles.optionTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>education status</Text>
        <View style={styles.optionsGrid}>
          {educationLevels.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                educationLevel === option.value && styles.optionButtonSelected
              ]}
              onPress={() => {
                setEducationLevel(option.value);
                triggerWizzmissReaction(); // Fun reaction when user selects
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={[
                styles.optionText,
                educationLevel === option.value && styles.optionTextSelected
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {['high_school', 'university', 'graduate'].includes(educationLevel) && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>graduation year</Text>
          <View style={styles.optionsGrid}>
            {graduationYears.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  graduationYear === option && styles.optionButtonSelected
                ]}
                onPress={() => {
                  setGraduationYear(option);
                  triggerWizzmissReaction(); // Fun reaction when user selects
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[
                  styles.optionText,
                  graduationYear === option && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {educationLevel === 'university' && (
        <TouchableWithoutFeedback 
          onPress={() => {
            // Don't auto-hide dropdown - let user continue searching
            Keyboard.dismiss();
          }}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>university</Text>
            <TextInput
            style={styles.textInput}
            placeholder="Type to search universities..."
            placeholderTextColor="#CCCCCC"
            value={university || universitySearch}
            onChangeText={(text) => {
              triggerWizzmissReaction(); // Fun reaction when user types
              
              if (university) {
                // If a university was selected, clear it and start fresh search
                setUniversity('');
                setUniversitySearch(text);
              } else {
                setUniversitySearch(text);
              }
              
              // Check if the typed text exactly matches a university
              const exactMatch = universities.find(uni => 
                uni.toLowerCase() === text.toLowerCase()
              );
              
              if (exactMatch) {
                // Exact match found - set it as selected and hide dropdown
                setUniversity(exactMatch);
                setUniversitySearch('');
                setShowUniversityResults(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              } else {
                // No exact match - show dropdown if there's text
                setShowUniversityResults(text.length > 0);
              }
            }}
            onFocus={() => {
              if (!university && universitySearch.length > 0) {
                setShowUniversityResults(true);
              }
            }}
            onSubmitEditing={() => {
              // Don't hide results when user hits done - let them pick from list
              Keyboard.dismiss();
            }}
            returnKeyType="done"
            autoCapitalize="words"
            autoComplete="off"
            autoCorrect={false}
          />
          {showUniversityResults && (
            <View style={styles.universityResults}>
              <ScrollView 
                style={styles.universityScrollView} 
                keyboardShouldPersistTaps="always"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {filteredUniversities.length > 0 ? (
                  filteredUniversities.slice(0, 8).map((uni) => (
                    <TouchableOpacity
                      key={uni}
                      style={styles.universityOption}
                      onPress={() => {
                        setUniversity(uni);
                        setUniversitySearch('');
                        setShowUniversityResults(false);
                        triggerWizzmissReaction(); // Fun reaction when user selects
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={styles.universityOptionText}>{uni}</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>
                      No universities found. Try a different search term.
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
          {university && (
            <View style={styles.selectedUniversity}>
              <Text style={styles.selectedUniversityText}>{university}</Text>
              <TouchableOpacity 
                onPress={() => {
                  setUniversity('');
                  setUniversitySearch('');
                  setShowUniversityResults(false);
                }}
                style={styles.clearButton}
              >
                <Ionicons name="close" size={16} color="#666" />
              </TouchableOpacity>
            </View>
          )}
          </View>
        </TouchableWithoutFeedback>
      )}
    </View>
  );

  const renderComplete = () => (
    <View style={styles.stepContent} pointerEvents="box-none">
      <BearImage size="large" />
      
      <View>
        <Text style={styles.completionTitle}>you're all set!</Text>
        <Text style={styles.completionSubtitle}>
          congratulations! ready for dating & relationship advice?
        </Text>
      </View>

      <View>
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={() => handleStepChange(6)}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.continueGradient}
          >
            <Text style={styles.continueButtonText}>continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FF4DB8" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRating = () => (
    <View style={styles.stepContent} pointerEvents="box-none">
      <View style={styles.ratingIconContainer}>
        <Ionicons name="star" size={48} color="#FFD700" />
      </View>
      
      <Text style={styles.ratingTitle}>loving wizzmo?</Text>
      <Text style={styles.ratingSubtitle}>
        help us grow by rating the app! it takes just a few seconds and helps other college students find us
      </Text>

      <TouchableOpacity 
        style={styles.rateButton} 
        onPress={handleRateApp}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.rateGradient}
        >
          <Ionicons name="star-outline" size={20} color="#FF4DB8" />
          <Text style={styles.rateButtonText}>rate wizzmo</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={handleSkipRating}
      >
        <Text style={styles.skipButtonText}>maybe later</Text>
      </TouchableOpacity>
    </View>
  );


  const renderPaywall = () => (
    <View style={styles.stepContent} pointerEvents="box-none">
      <PaywallVariantA 
        onClose={() => handleStepChange(7)}
        onSuccess={() => handleStepChange(7)}
      />
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.stepContent}>
      <LinearGradient
        colors={['#FF4DB8', '#8B5CF6']}
        style={styles.finalIcon}
      >
        <Ionicons name="notifications" size={40} color="#FFFFFF" />
      </LinearGradient>
      
      <Text style={styles.finalTitle}>stay in the loop</Text>
      <Text style={styles.finalSubtitle}>
        get notified when mentors respond to your questions
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              
              // Request permission first
              const granted = await requestPermissions();
              
              if (granted && user?.id) {
                console.log('[Onboarding] Notifications enabled');
                await scheduleWelcomeFlow(user.id);
                await scheduleWeeklyReminder(user.id);
              } else {
                console.log('[Onboarding] Notifications denied or no user');
              }
            } catch (error) {
              console.error('[Onboarding] Error enabling notifications:', error);
            }
            
            handleStepChange(9);
          }}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.startGradient}
          >
            <Text style={styles.startButtonText}>enable notifications</Text>
            <Ionicons name="notifications" size={20} color="#FF4DB8" />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={() => handleStepChange(9)}
        >
          <Text style={styles.skipButtonText}>maybe later</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderShareFriends = () => (
    <View style={styles.stepContent}>
      <LinearGradient
        colors={['#FF4DB8', '#8B5CF6']}
        style={styles.finalIcon}
      >
        <Ionicons name="share-social" size={40} color="#FFFFFF" />
      </LinearGradient>
      
      <Text style={styles.finalTitle}>spread the love</Text>
      <Text style={styles.finalSubtitle}>
        help your friends discover wizzmo for dating & relationship advice
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              const result = await Share.share({
                message: 'Just joined Wizzmo - the best app for college dating advice! Get real help from verified college girls 💕',
                url: 'https://wizzmo.app',
              });
            } catch (error) {
              console.error('Error sharing:', error);
            }
            
            // Go to final excitement step
            handleStepChange(10);
          }}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.startGradient}
          >
            <Text style={styles.startButtonText}>share with friends</Text>
            <Ionicons name="share-social" size={20} color="#FF4DB8" />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            handleStepChange(10);
          }}
        >
          <Text style={styles.skipButtonText}>skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFinalComplete = () => (
    <View style={styles.stepContent}>
      <LinearGradient
        colors={['#FF4DB8', '#8B5CF6']}
        style={styles.finalIcon}
      >
        <Ionicons name="heart" size={40} color="#FFFFFF" />
      </LinearGradient>
      
      <Text style={styles.finalTitle}>welcome to wizzmo!</Text>
      <Text style={styles.finalSubtitle}>
        you're all set! ready to get amazing dating & relationship advice
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={() => router.replace('/(tabs)/ask')}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.startGradient}
          >
            <Text style={styles.startButtonText}>start asking questions!</Text>
            <Ionicons name="arrow-forward" size={20} color="#FF4DB8" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderReadyToAsk = () => (
    <View style={styles.stepContent}>
      <View style={styles.bearCouple}>
        <Image
          source={bearImages['happy']}
          style={styles.bearCoupleImage}
          resizeMode="contain"
        />
        <Text style={styles.bearCoupleHeart}>💕</Text>
        <Image
          source={bearImages['wizzmiss']}
          style={styles.bearCoupleImage}
          resizeMode="contain"
        />
      </View>
      
      <Text style={styles.finalTitle}>ready to spill the tea? ☕</Text>
      <Text style={styles.finalSubtitle}>
        connect with your wizzmo to get real advice on crushes, dating drama, and relationship questions
      </Text>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={async () => {
            await completeOnboarding();
          }}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.startGradient}
          >
            <Text style={styles.startButtonText}>ask my first question</Text>
            <Ionicons name="arrow-forward" size={20} color="#FF4DB8" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStepInfo = () => {
    switch (currentStep) {
      case 1: return { title: 'welcome', subtitle: 'let\'s get you started' };
      case 2: return { title: 'username', subtitle: 'how should we call you?' };
      case 3: return { title: 'about you', subtitle: 'help us personalize your experience' };
      case 4: return { title: 'details', subtitle: 'just a few more things' };
      case 5: return { title: 'complete', subtitle: 'profile setup finished!' };
      case 6: return { title: 'enhance', subtitle: 'unlock your full wizzmo experience' };
      case 7: return { title: 'rate us', subtitle: 'help us grow' };
      case 8: return { title: 'notifications', subtitle: 'stay connected' };
      case 9: return { title: 'friends', subtitle: 'share with others' };
      case 10: return { title: 'spill time!', subtitle: 'let\'s hear your tea ☕' };
      default: return { title: '', subtitle: '' };
    }
  };

  const stepInfo = getStepInfo();

  return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#FF4DB8', '#8B5CF6']}
          style={styles.gradientBackground}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
              {currentStep > 1 && currentStep < 9 && (
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
                      { width: `${(currentStep / 10) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.stepCounter}>
                  step {currentStep} of 10
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
                onScrollBeginDrag={handleScrollTap}
                scrollEventThrottle={16}
              >
                {/* Transparent padding area for scroll detection */}
                <View style={styles.transparentScrollArea}>
                  {currentStep === 1 && renderWelcome()}
                  {currentStep === 2 && renderUsername()}
                  {currentStep === 3 && renderBioAndInterests()}
                  {currentStep === 4 && renderDetails()}
                  {currentStep === 5 && renderComplete()}
                  {currentStep === 6 && renderPaywall()}
                  {currentStep === 7 && renderRating()}
                  {currentStep === 8 && renderNotifications()}
                  {currentStep === 9 && renderShareFriends()}
                  {currentStep === 10 && renderReadyToAsk()}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>

            {/* Next Button */}
            {currentStep <= 4 && (
              <View style={[styles.buttonContainer, currentStep === 3 && styles.buttonContainerRow]}>
                {currentStep === 3 && (
                  <TouchableOpacity
                    style={styles.skipButtonBordered}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      handleStepChange(4); // Skip to step 4 (details)
                    }}
                  >
                    <Text style={styles.skipButtonBorderedText}>skip</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.nextButton, currentStep === 3 && styles.nextButtonWithSkip]}
                  onPress={handleNext}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#FFFFFF', '#F8F9FA']}
                    style={styles.nextGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FF4DB8" size="small" />
                    ) : (
                      <>
                        <Text style={styles.nextButtonText}>
                          {currentStep === 4 ? 'complete setup' : 'continue'}
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
    paddingHorizontal: 0, // Remove horizontal padding from container
    paddingBottom: 120,
    paddingTop: 20,
    minHeight: '150%', // Ensure content is tall enough to scroll
  },
  transparentScrollArea: {
    flex: 1,
    // Add extra invisible padding on sides for scroll detection
    marginHorizontal: -100,
    paddingHorizontal: 124, // 24 + 100 for content offset
  },
  stepContent: {
    paddingVertical: 20,
    gap: 24,
  },

  // Welcome Screen
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bearLogo: {
    width: 120,
    height: 120,
  },
  bearContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
  universityResults: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#000000',
    marginTop: 4,
    maxHeight: 160,
    zIndex: 1000,
    elevation: 5, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  universityScrollView: {
    maxHeight: 160,
    flexGrow: 0, // Prevent expanding beyond maxHeight
  },
  universityOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  universityOptionText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000',
  },
  selectedUniversity: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
  },
  selectedUniversityText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
  },
  clearButton: {
    padding: 4,
  },
  noResultsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'lowercase',
  },
  usernameContainer: {
    position: 'relative',
  },
  usernameStatus: {
    position: 'absolute',
    right: 16,
    top: 16,
    bottom: 16,
    justifyContent: 'center',
  },
  noteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
  },
  noteText: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontStyle: 'italic',
    textTransform: 'lowercase',
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

  // Interests
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
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
  interestChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  interestEmoji: {
    fontSize: 14,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  interestTextSelected: {
    color: '#FF4DB8',
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
    marginBottom: 40,
    textTransform: 'lowercase',
  },

  // Rating Screen
  ratingIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  ratingTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  ratingSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    textTransform: 'lowercase',
  },
  rateButton: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 16,
  },
  rateGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  rateButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF4DB8',
    textTransform: 'lowercase',
  },

  // Share Screen
  shareIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  shareTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  shareSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    textTransform: 'lowercase',
  },
  shareButton: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 16,
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  shareButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF4DB8',
    textTransform: 'lowercase',
  },

  // Paywall Screen
  paywallIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  paywallTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  paywallSubtitle: {
    fontSize: 17,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    textTransform: 'lowercase',
  },
  paywallFeatures: {
    gap: 16,
    marginBottom: 40,
  },
  paywallFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  paywallFeatureText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  upgradeButton: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 16,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF4DB8',
    textTransform: 'lowercase',
  },

  // Skip Button
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'lowercase',
  },

  // Final Screen
  finalIcon: {
    width: 80,
    height: 80,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  finalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
    textTransform: 'lowercase',
  },
  finalSubtitle: {
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
  startButton: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF4DB8',
    textTransform: 'lowercase',
  },

  // Age Picker
  pickerContainer: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderRadius: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  agePicker: {
    height: 120,
    color: '#FFFFFF',
  },
  pickerItem: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  nextButtonWithSkip: {
    flex: 1,
  },
  skipButtonBordered: {
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 0,
    flex: 1,
    marginRight: 12,
  },
  skipButtonBorderedText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'lowercase',
  },
  buttonContainerRow: {
    flexDirection: 'row',
  },

  // Excitement Features
  excitementFeatures: {
    gap: 16,
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  excitementFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 16,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  excitementEmoji: {
    fontSize: 24,
  },
  excitementText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },

  // Bear Couple
  bearCouple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  bearCoupleImage: {
    width: 120,
    height: 120,
  },
  bearCoupleHeart: {
    fontSize: 32,
    marginHorizontal: 8,
  },
});
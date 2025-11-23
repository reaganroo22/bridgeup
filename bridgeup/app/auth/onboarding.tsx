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
// Reanimated imports removed for build compatibility
import * as StoreReview from 'expo-store-review';
import PaywallVariantA from '@/components/PaywallVariantA';
import { CURRENT_VERTICAL, CURRENT_VERTICAL_KEY } from '@/config/current-vertical';

const categories = [
  { id: 'college-applications', name: 'college applications', emoji: '📝' },
  { id: 'sat-act-prep', name: 'sat/act prep', emoji: '📚' },
  { id: 'essay-writing', name: 'essay writing', emoji: '✍️' },
  { id: 'college-selection', name: 'college selection', emoji: '🎓' },
  { id: 'scholarships-aid', name: 'scholarships & aid', emoji: '💰' },
  { id: 'extracurriculars', name: 'extracurriculars', emoji: '🏆' },
  { id: 'interviews', name: 'interviews', emoji: '🗣️' },
  { id: 'recommendation-letters', name: 'recommendation letters', emoji: '📄' },
  { id: 'college-visits', name: 'college visits', emoji: '🏫' },
  { id: 'early-decision-action', name: 'early decision/action', emoji: '⏰' },
  { id: 'gap-year', name: 'gap year', emoji: '🌍' },
  { id: 'community-college', name: 'community college', emoji: '🏛️' },
  { id: 'stress-anxiety', name: 'stress & anxiety', emoji: '😰' },
  { id: 'family-parents', name: 'family & parents', emoji: '👨‍👩‍👧‍👦' },
  { id: 'career-exploration', name: 'career exploration', emoji: '💼' },
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

export default function Onboarding() {
  const { user } = useAuth();
  const { scheduleWelcomeFlow, scheduleWeeklyReminder } = useNotifications();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Form data
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [educationLevel, setEducationLevel] = useState('');
  const [graduationYear, setGraduationYear] = useState('');

  // Custom function to handle step changes and scroll to top for completed screen
  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    // Scroll to top when moving to completed screen (step 5)
    if (step === 5 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 100);
    }
  };

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

    if (currentStep === 4) {
      await completeOnboarding();
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    if (!user) {
      Alert.alert('error', 'No user found. Please sign in again.');
      router.replace('/auth');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabaseService.updateUserProfile(user.id, {
        username: username.trim(),
        bio: bio.trim(),
        age: age ? parseInt(age) : undefined,
        gender,
        education_level: educationLevel,
        graduation_year: (educationLevel !== 'not_student' && graduationYear) ? parseInt(graduationYear) : null,
        interests: selectedInterests,
        onboarding_completed: true,
        vertical: CURRENT_VERTICAL_KEY,
      });

      if (error) {
        console.error('[Onboarding] Error completing onboarding:', error);
        Alert.alert('error', 'Failed to complete setup. Please try again.');
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await scheduleWelcomeFlow(user.id);
      await scheduleWeeklyReminder(user.id);
      handleStepChange(5);
    } catch (error) {
      console.error('[Onboarding] Unexpected error:', error);
      Alert.alert('error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (categoryId: string) => {
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
          setCurrentStep(8);
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
          [{ text: 'Continue', onPress: () => setCurrentStep(8) }]
        );
      }
    } catch (error) {
      console.error('[Onboarding] Error requesting review:', error);
      
      // Show thank you message and continue even on error
      Alert.alert(
        'Thanks! 💕',
        'Your support means the world to us!',
        [{ text: 'Continue', onPress: () => setCurrentStep(8) }]
      );
    }
  };

  const handleSkipRating = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(8); // Go to share step
  };

  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await Share.share({
        message: `Just joined ${CURRENT_VERTICAL.name} - the best app for college preparation advice! Get real help from verified college students 🎓`,
        url: 'https://bridgeup.app',
      });
      
      if (result.action === Share.sharedAction) {
        setCurrentStep(9); // Go to final step
      } else {
        setCurrentStep(9); // Go to final step
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setCurrentStep(9); // Go to final step
    }
  };

  const handleSkipShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(9); // Go to final step
  };

  const renderWelcome = () => (
    <View style={styles.stepContent}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>{CURRENT_VERTICAL.name.toLowerCase()}</Text>
      </View>
      <Text style={styles.welcomeTitle}>welcome to {CURRENT_VERTICAL.name.toLowerCase()}</Text>
      <Text style={styles.welcomeSubtitle}>
        {CURRENT_VERTICAL.description.toLowerCase()}
      </Text>
      
      <View style={styles.featuresList}>
        <View style={styles.feature}>
          <Ionicons name="school-outline" size={20} color="#FFFFFF" />
          <Text style={styles.featureText}>college preparation guidance</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="people-outline" size={20} color="#FFFFFF" />
          <Text style={styles.featureText}>verified college student mentors</Text>
        </View>
        <View style={styles.feature}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
          <Text style={styles.featureText}>completely anonymous</Text>
        </View>
      </View>
    </View>
  );

  const renderUsername = () => (
    <View style={styles.stepContent}>
      <Text style={styles.inputLabel}>choose your username</Text>
      <View style={styles.usernameContainer}>
        <TextInput
          style={styles.textInput}
          value={username}
          onChangeText={setUsername}
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
          {checkingUsername && <ActivityIndicator size="small" color={CURRENT_VERTICAL.primaryColor} />}
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
    <View style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>tell us about yourself</Text>
        <TextInput
          style={[styles.textInput, styles.bioInput]}
          value={bio}
          onChangeText={setBio}
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
    <View style={styles.stepContent}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>age (optional)</Text>
        <View style={styles.wheelPickerContainer}>
          <Picker
            selectedValue={age}
            style={styles.wheelPicker}
            itemStyle={styles.wheelPickerItem}
            onValueChange={(itemValue) => {
              setAge(itemValue);
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
    </View>
  );

  const renderComplete = () => (
    <View style={styles.stepContent}>
      <View>
        <LinearGradient
          colors={['#4A90E2', '#6C9BD1']}
          style={styles.completionIcon}
        >
          <Ionicons name="checkmark" size={32} color="#FFFFFF" />
        </LinearGradient>
      </View>
      
      <View>
        <Text style={styles.completionTitle}>you're all set!</Text>
        <Text style={styles.completionSubtitle}>
          your profile is complete and you're ready to start getting amazing college preparation guidance
        </Text>
      </View>

      <View>
        <TouchableOpacity 
          style={styles.continueButton} 
          onPress={() => setCurrentStep(6)}
        >
          <LinearGradient
            colors={['#FFFFFF', '#F8F9FA']}
            style={styles.continueGradient}
          >
            <Text style={styles.continueButtonText}>continue</Text>
            <Ionicons name="arrow-forward" size={20} color={CURRENT_VERTICAL.primaryColor} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRating = () => (
    <View style={styles.stepContent}>
      <View style={styles.ratingIconContainer}>
        <Ionicons name="star" size={48} color="#FFD700" />
      </View>
      
      <Text style={styles.ratingTitle}>loving {CURRENT_VERTICAL.name.toLowerCase()}?</Text>
      <Text style={styles.ratingSubtitle}>
        help us grow by rating the app! it takes just a few seconds and helps other high schoolers find us
      </Text>

      <TouchableOpacity 
        style={styles.rateButton} 
        onPress={handleRateApp}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.rateGradient}
        >
          <Ionicons name="star-outline" size={20} color={CURRENT_VERTICAL.primaryColor} />
          <Text style={styles.rateButtonText}>rate {CURRENT_VERTICAL.name.toLowerCase()}</Text>
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

  const renderShare = () => (
    <View style={styles.stepContent}>
      <View style={styles.shareIconContainer}>
        <Ionicons name="share-social" size={48} color="#FFFFFF" />
      </View>
      
      <Text style={styles.shareTitle}>spread the word</Text>
      <Text style={styles.shareSubtitle}>
        help your friends discover {CURRENT_VERTICAL.name.toLowerCase()}! share the app with other high schoolers who could use college prep advice
      </Text>

      <TouchableOpacity 
        style={styles.shareButton} 
        onPress={handleShare}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.shareGradient}
        >
          <Ionicons name="share-outline" size={20} color={CURRENT_VERTICAL.primaryColor} />
          <Text style={styles.shareButtonText}>share {CURRENT_VERTICAL.name.toLowerCase()}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.skipButton} 
        onPress={handleSkipShare}
      >
        <Text style={styles.skipButtonText}>skip for now</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPaywall = () => (
    <View style={styles.stepContent}>
      <PaywallVariantA 
        visible={true}
        onClose={() => setCurrentStep(7)}
      />
    </View>
  );

  const renderFinalComplete = () => (
    <View style={styles.stepContent}>
      <LinearGradient
        colors={CURRENT_VERTICAL.gradientColors as readonly [string, string, ...string[]]}
        style={styles.finalIcon}
      >
        <Ionicons name="heart" size={40} color="#FFFFFF" />
      </LinearGradient>
      
      <Text style={styles.finalTitle}>welcome to the community!</Text>
      <Text style={styles.finalSubtitle}>
        ready to start getting amazing college preparation guidance and connect with verified mentors
      </Text>

      <TouchableOpacity 
        style={styles.startButton} 
        onPress={() => router.replace('/(tabs)')}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8F9FA']}
          style={styles.startGradient}
        >
          <Text style={styles.startButtonText}>start exploring</Text>
          <Ionicons name="arrow-forward" size={20} color={CURRENT_VERTICAL.primaryColor} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const getStepInfo = () => {
    switch (currentStep) {
      case 1: return { title: 'welcome', subtitle: 'let\'s get you started' };
      case 2: return { title: 'username', subtitle: 'how should we call you?' };
      case 3: return { title: 'about you', subtitle: 'help us personalize your experience' };
      case 4: return { title: 'details', subtitle: 'just a few more things' };
      case 5: return { title: 'complete', subtitle: 'profile setup finished!' };
      case 6: return { title: 'enhance', subtitle: 'unlock your full bridgeup experience' };
      case 7: return { title: 'rate us', subtitle: 'help us grow' };
      case 8: return { title: 'share', subtitle: 'spread the love' };
      case 9: return { title: 'ready', subtitle: 'let\'s begin your journey' };
      default: return { title: '', subtitle: '' };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#4A90E2', '#6C9BD1']}
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
                      { width: `${(currentStep / 9) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.stepCounter}>
                  step {currentStep} of 9
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
                keyboardShouldPersistTaps="handled"
                bounces={true}
                scrollEnabled={true}
                alwaysBounceVertical={true}
                contentInsetAdjustmentBehavior="automatic"
                onScrollBeginDrag={handleScrollTap}
              >
                {currentStep === 1 && renderWelcome()}
                {currentStep === 2 && renderUsername()}
                {currentStep === 3 && renderBioAndInterests()}
                {currentStep === 4 && renderDetails()}
                {currentStep === 5 && renderComplete()}
                {currentStep === 6 && renderPaywall()}
                {currentStep === 7 && renderRating()}
                {currentStep === 8 && renderShare()}
                {currentStep === 9 && renderFinalComplete()}
              </ScrollView>
            </KeyboardAvoidingView>

            {/* Next Button */}
            {currentStep <= 4 && (
              <View style={[styles.buttonContainer, currentStep === 3 && styles.buttonContainerRow]}>
                {currentStep === 3 && (
                  <TouchableOpacity
                    style={styles.skipButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCurrentStep(4); // Skip to step 4 (details)
                    }}
                  >
                    <Text style={styles.skipButtonText}>skip</Text>
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
                      <ActivityIndicator color={CURRENT_VERTICAL.primaryColor} size="small" />
                    ) : (
                      <>
                        <Text style={styles.nextButtonText}>
                          {currentStep === 4 ? 'complete setup' : 'continue'}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color={CURRENT_VERTICAL.primaryColor} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CURRENT_VERTICAL.primaryColor,
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
    paddingBottom: 200,
    flexGrow: 1,
    justifyContent: 'flex-start',
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
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    textTransform: 'lowercase',
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
    backgroundColor: CURRENT_VERTICAL.primaryColor,
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
    color: CURRENT_VERTICAL.primaryColor,
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
    color: CURRENT_VERTICAL.primaryColor,
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
    color: CURRENT_VERTICAL.primaryColor,
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
    color: CURRENT_VERTICAL.primaryColor,
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
    marginBottom: 40,
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
    color: CURRENT_VERTICAL.primaryColor,
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
    color: CURRENT_VERTICAL.primaryColor,
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
    color: CURRENT_VERTICAL.primaryColor,
    textTransform: 'lowercase',
  },
  nextButtonWithSkip: {
    flex: 1,
  },
  skipButtonSecondary: {
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 0,
    flex: 1,
    marginRight: 12,
  },
  skipButtonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'lowercase',
  },
  buttonContainerRow: {
    flexDirection: 'row',
  },
});
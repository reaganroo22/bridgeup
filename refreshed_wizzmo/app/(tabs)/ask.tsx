import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { useNotifications } from '../../contexts/NotificationContext';
import CustomHeader from '@/components/CustomHeader';
import PaywallModal from '@/components/PaywallModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as supabaseService from '../../lib/supabaseService';
import { supabase } from '../../lib/supabase';

interface FavoriteMentor {
  id: string;
  mentor_id: string;
  mentors: {
    full_name: string | null;
    avatar_url?: string | null;
  };
}

export default function AskScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();
  const { canAskQuestion, incrementQuestionCount, getQuestionsRemaining, isProUser } = useSubscription();
  const { userProfile, getRelevantCategories, isHighSchool, isUniversity } = useUserProfile();
  const { notifyMentorsOfNewQuestion } = useNotifications();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [allowPublicShare, setAllowPublicShare] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [categories, setCategories] = useState<Array<{id: string, slug: string, name: string, icon: string | null, description: string | null}>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [favoriteMentors, setFavoriteMentors] = useState<FavoriteMentor[]>([]);
  const [selectedMentor, setSelectedWizzmo] = useState<string | null>(null);
  const [selectedMentorData, setSelectedWizzmoData] = useState<any>(null);
  const [preSelectedMentors, setPreSelectedMentors] = useState<Array<{id: string, name: string, avatar_url?: string}>>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{id: string, full_name: string | null, username: string | null, avatar_url?: string | null, mentor_profiles: any}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMentorSearch, setShowMentorSearch] = useState(false);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showAnimation, setShowAnimation] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  // Gender-specific static placeholders and examples for split testing
  const getGenderContent = () => {
    const isFemale = userProfile?.gender === 'female';
    
    if (isFemale) {
      // Female-focused content - more emotional, relationship-heavy
      return {
        staticPlaceholders: [
          "what's on your mind, babe?",
          "spill the tea, what's happening?"
        ],
        exampleQuestions: [
          "My boyfriend hasn't texted me back in 2 days...",
          "Should I tell my roommate her boyfriend is cheating?",
          "My ex wants to be friends but I still have feelings...",
          "How do I know if this guy actually likes me?",
          "My friend copied my style and now everyone thinks she's original...",
          "I saw my crush with another girl, what should I do?",
          "My roommate brings guys over every night...",
          "Should I tell my friend her boyfriend DMed me?",
          "I'm the only single one in my friend group...",
          "My best friend is talking behind my back...",
          "I can't afford to keep up with my rich friends...",
          "My professor keeps flirting with me and it's weird...",
          "I accidentally liked my ex's post from 2 years ago...",
          "My parents want me to break up with my boyfriend...",
          "My long distance relationship is falling apart...",
          "Everyone thinks I'm the 'mom friend' but I need help too...",
          "My girl friends are being fake and I'm over it...",
          "Should I get back with my ex for the 3rd time?",
          "My roommate steals my clothes and pretends they're hers...",
          "I think my boyfriend is losing interest in me..."
        ]
      };
    } else {
      // Male-focused content - single men seeking female perspective on dating/relationships
      return {
        staticPlaceholders: [
          "what's on your mind?",
          "what's on your mind?"
        ],
        exampleQuestions: [
          "She left me on read... what does that actually mean?",
          "Rate my outfit 1-10... be honest",
          "Do looks actually matter or is personality enough?",
          "Should I ask my crush out or am I reading the signs wrong?",
          "Would you swipe right on me? Need honest female opinion",
          "My ex keeps texting me... does she want me back?",
          "How do I know if she's actually interested or just being nice?",
          "Rate my dating profile pics... which ones should I keep?",
          "I've been talking to this girl for weeks but nothing's happening...",
          "She said she's not ready for a relationship... is that real?",
          "Do girls care about height? I'm 5'7 and insecure about it",
          "I don't know how to flirt without being creepy...",
          "Should I double text or does that look desperate?",
          "What do girls think about guys who go to the gym a lot?",
          "She cancelled our date last minute... red flag?",
          "I like her but she talks about other guys around me...",
          "How do I approach girls at parties without being awkward?",
          "Rate my haircut... should I grow it out or keep it short?",
          "She posts thirst traps but won't text me back...",
          "I accidentally came on too strong... how do I recover?",
          "Do girls judge guys for living with their parents?",
          "She said we should be friends... is there still a chance?",
          "I don't understand why she's being hot and cold...",
          "Should I tell her how I feel or will that ruin everything?",
          "What's more attractive: being mysterious or being open?",
          "She seems interested in person but distant over text...",
          "I think she's out of my league but my friends say go for it...",
          "She talks to me about her problems... friend zone?",
          "How do I ask her out without making it weird if she says no?",
          "Do girls prefer guys who text back immediately or wait?",
          "She's giving mixed signals and I'm so confused...",
          "I don't know how to keep conversations interesting over text..."
        ]
      };
    }
  };

  const genderContent = getGenderContent();
  const staticPlaceholders = genderContent.staticPlaceholders;
  const exampleQuestions = genderContent.exampleQuestions;

  // Sort categories based on user profile
  const sortCategoriesForUser = (cats: typeof categories) => {
    // Separate "Other" category from the rest
    const otherCategory = cats.find(cat => cat.slug === 'other');
    const normalCategories = cats.filter(cat => cat.slug !== 'other');

    if (!userProfile?.interests) {
      // No user interests - just put "Other" at the end
      return otherCategory ? [...normalCategories, otherCategory] : normalCategories;
    }

    const relevantCats = getRelevantCategories();
    const sortedCategories = [...normalCategories];

    // Move user's interested categories to the top
    sortedCategories.sort((a, b) => {
      const aIsRelevant = relevantCats.includes(a.slug) || relevantCats.includes(a.id);
      const bIsRelevant = relevantCats.includes(b.slug) || relevantCats.includes(b.id);
      
      if (aIsRelevant && !bIsRelevant) return -1;
      if (!aIsRelevant && bIsRelevant) return 1;
      return 0;
    });

    // Add "Other" at the end
    if (otherCategory) {
      sortedCategories.push(otherCategory);
    }

    return sortedCategories;
  };

  // Default categories matching real Wizzmo topics
  const defaultCategories = [
    'Dating', 'Drama Talk', 'Matchmaking', 'Classes', 'Roommates', 'Style', 'Wellness',
    'Friend Drama', 'Situationships', 'Hookup Culture', 'Study Tips', 'Social Life',
    'First Dates', 'Breakups', 'Body Image', 'Mental Health', 'Self Care',
    'Greek Life', 'Making Friends', 'Dining Hall', 'Confidence', 'Fashion'
  ];

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const { data, error } = await supabaseService.getCategories();
        
        if (data && !error && data.length > 0) {
          console.log('[AskScreen] Database returned old categories, using Wizzmo categories instead');
          // Force use of Wizzmo categories instead of old database categories
          setCategories(defaultCategories.map((name, index) => ({
            id: `wizzmo-${index}`,
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
            name: name,
            icon: null,
            description: null
          })));
        } else {
          console.log('[AskScreen] Using fallback categories');
          // Use fallback categories if database fails or is empty
          setCategories(defaultCategories.map((name, index) => ({
            id: `fallback-${index}`,
            slug: name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
            name: name,
            icon: null,
            description: null
          })));
        }
      } catch (error) {
        console.error('[AskScreen] Error fetching categories, using fallback:', error);
        // Use fallback categories on error
        setCategories(defaultCategories.map((name, index) => ({
          id: `fallback-${index}`,
          slug: name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and'),
          name: name,
          icon: null,
          description: null
        })));
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch favorite wizzmos
  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from('favorite_wizzmos')
        .select(`
          id,
          mentor_id,
          mentors:users!favorite_wizzmos_mentor_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('student_id', user.id);

      if (data) {
        // Log mentor_id values to debug UUID issues
        console.log('[AskScreen] Favorite wizzmos mentor IDs:', data.map(f => ({id: f.id, mentor_id: f.mentor_id})));
        console.log('[AskScreen] Loaded', data.length, 'favorite wizzmos');
        setFavoriteMentors(data);
      } else if (error) {
        console.error('[AskScreen] Error loading favorites:', error);
      }
    };

    fetchFavorites();
  }, [user]);

  // Reset animation state when screen becomes focused
  useEffect(() => {
    // Reset everything when the component mounts or when navigating to this tab
    setShowAnimation(false);
    setDisplayText('');
    setCurrentExampleIndex(0);
    setIsTyping(true);
    setPlaceholderIndex(0);
    
    const timer = setTimeout(() => {
      if (!title.trim()) {
        setShowAnimation(true);
      }
    }, 7000); // Wait 7 seconds before starting animation

    return () => clearTimeout(timer);
  }, []); // Only run on mount

  // Additional reset when title is cleared
  useEffect(() => {
    if (!title.trim()) {
      // Reset animation state when text is cleared
      setShowAnimation(false);
      setDisplayText('');
      setCurrentExampleIndex(0);
      setIsTyping(true);
      
      const timer = setTimeout(() => {
        setShowAnimation(true);
      }, 7000); // Wait 7 seconds before starting animation

      return () => clearTimeout(timer);
    }
  }, [title]);

  // Typing animation effect - only when input is completely empty and not focused
  useEffect(() => {
    if (!title.trim() && showAnimation) { // Only animate when user hasn't typed anything and delay has passed
      const currentQuestion = exampleQuestions[currentExampleIndex];
      
      if (isTyping) {
        // Typing phase
        if (displayText.length < currentQuestion.length) {
          const timer = setTimeout(() => {
            setDisplayText(currentQuestion.slice(0, displayText.length + 1));
          }, 50 + Math.random() * 50); // Variable typing speed
          return () => clearTimeout(timer);
        } else {
          // Finished typing, pause then start deleting
          const timer = setTimeout(() => {
            setIsTyping(false);
          }, 2000);
          return () => clearTimeout(timer);
        }
      } else {
        // Deleting phase
        if (displayText.length > 0) {
          const timer = setTimeout(() => {
            setDisplayText(displayText.slice(0, -1));
          }, 30);
          return () => clearTimeout(timer);
        } else {
          // Finished deleting, move to next question
          setCurrentExampleIndex((prev) => (prev + 1) % exampleQuestions.length);
          setIsTyping(true);
        }
      }
    } else if (title.trim()) {
      // User has started typing, clear the animation
      setDisplayText('');
      setShowAnimation(false);
    }
  }, [displayText, isTyping, currentExampleIndex, title, exampleQuestions, showAnimation]);

  // Search mentors
  useEffect(() => {
    const searchMentors = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      console.log('[AskScreen] Searching for:', searchQuery);
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            full_name,
            username,
            avatar_url,
            mentor_profiles!inner (
              id,
              average_rating,
              total_questions_answered
            )
          `)
          .in('role', ['mentor', 'both'])
          .or(`full_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
          .limit(5);

        if (data && !error) {
          console.log('[AskScreen] Search results:', data.length, 'mentors found');
          setSearchResults(data);
        } else if (error) {
          console.error('[AskScreen] Search error:', error);
        }
      } catch (error) {
        console.error('[AskScreen] Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchMentors, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle pre-selected mentor from profile
  useEffect(() => {
    if (params.mentorId && typeof params.mentorId === 'string') {
      setSelectedWizzmo(params.mentorId);
      setShowMentorSearch(true);
      console.log('[AskScreen] Pre-selected mentor:', params.mentorId);
    }
  }, [params.mentorId]);

  // Handle selected mentors from wizzmos tab
  useEffect(() => {
    if (params.selectedMentors && typeof params.selectedMentors === 'string') {
      try {
        const mentors = JSON.parse(params.selectedMentors);
        setPreSelectedMentors(mentors);
        console.log('[AskScreen] Pre-selected mentors from wizzmos tab:', mentors);
      } catch (error) {
        console.error('[AskScreen] Error parsing selected mentors:', error);
      }
    }
  }, [params.selectedMentors]);

  const handleSubmit = async () => {
    // Check if user selected a specific wizzmo (premium feature)
    if (selectedMentor && !isProUser) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowPaywall(true);
      return;
    }

    // Check if user can ask a question
    if (!canAskQuestion()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowPaywall(true);
      return;
    }

    if (!title.trim()) {
      Alert.alert('Missing question', 'What\'s going on? Tell us your situation.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Category needed', 'Choose a category so we can match you with the right mentor.');
      return;
    }

    // Validate selectedCategory exists in available categories
    const categoryExists = categories.some(cat => cat.id === selectedCategory);
    if (!categoryExists) {
      console.error('[AskScreen] Invalid category selected:', selectedCategory, 'Available categories:', categories.map(c => ({ id: c.id, name: c.name })));
      Alert.alert('Error', 'Invalid category selected. Please try selecting a category again.');
      return;
    }

    if (!user) {
      Alert.alert('oops!', 'you need to be logged in to ask a question 💕');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[AskScreen] Submitting question to Supabase');

      // Track gender split test engagement for analytics
      const isFemale = userProfile?.gender === 'female';
      console.log(`[Analytics] Question submitted - Gender: ${isFemale ? 'female' : 'male'}, Category: ${selectedCategory}, HasDetails: ${!!question.trim()}`);

      // Create the question in Supabase
      const { data: newQuestion, error } = await supabaseService.createQuestion(
        user.id,
        selectedCategory,
        title.trim(),
        question.trim() || title.trim(), // Use title as question if no details provided
        isAnonymous
      );

      if (error) {
        console.error('[AskScreen] Error creating question:', error);
        throw error;
      }

      console.log('[AskScreen] Question created successfully:', newQuestion?.id);

      // Notify mentors of the new question
      if (newQuestion) {
        const selectedCategoryName = categories.find(cat => cat.id === selectedCategory)?.name || 'general';
        const urgency = selectedCategoryName.includes('urgent') || selectedCategoryName.includes('emergency') ? 'high' : 
                      selectedCategoryName.includes('help') || selectedCategoryName.includes('advice') ? 'medium' : 'low';
        
        await notifyMentorsOfNewQuestion(
          newQuestion.id,
          title.trim(),
          selectedCategoryName,
          urgency
        );
      }

      // If a specific wizzmo was selected, create advice session directly (premium feature)
      if (selectedMentor && newQuestion) {
        // Validate selectedMentor is a proper UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(selectedMentor)) {
          console.error('[AskScreen] Invalid mentor UUID:', selectedMentor);
          Alert.alert('Error', 'Invalid mentor selection. Please try again.');
          setIsSubmitting(false);
          return;
        }
        
        console.log('[AskScreen] Creating direct session with selected wizzmo:', selectedMentor);
        const { data: session, error: sessionError } = await supabaseService.createAdviceSession(
          newQuestion.id,
          selectedMentor
        );

        if (sessionError) {
          console.error('[AskScreen] Error creating session:', sessionError);
          // Question still created, just not the direct session
        } else {
          console.log('[AskScreen] Direct session created:', session?.id);
        }
      }

      // Increment question count for free users - critical for subscription tracking
      try {
        console.log('[Ask] Attempting to increment question count...');
        await incrementQuestionCount();
        console.log('[Ask] Successfully incremented question count');
      } catch (incrementError) {
        console.error('[Ask] CRITICAL ERROR - Failed to increment question count:', incrementError);
        // Still continue with question submission but log the critical error
        // This ensures users can submit questions even if tracking fails
        Alert.alert(
          'Warning', 
          'Your question was submitted but there was an issue updating your usage count. Please contact support if this continues.',
          [{ text: 'OK' }]
        );
      }

      // Reset form
      setTitle('');
      setQuestion('');
      setSelectedCategory('');
      setSelectedWizzmo(null);
      setIsSubmitting(false);

      const message = selectedMentor
        ? 'your chosen wizzmo is getting notified now! 💕'
        : preSelectedMentors.length > 0
        ? `your ${preSelectedMentors.length} selected wizzmos are getting notified now! 💕`
        : 'ur wizzmos are getting ready to slide into the chat... this usually takes like 5-15 min max!';

      const alertTitle = (userProfile?.gender === 'female') ? 'we got u girl! 💕' : 'we got u bestie! 💪';

      Alert.alert(
        alertTitle,
        message,
        [
          {
            text: 'let\'s go check it out! ✨',
            onPress: () => {
              router.push('/(tabs)/advice');
            }
          }
        ]
      );
    } catch (error) {
      console.error('[AskScreen] Submit error:', error);
      setIsSubmitting(false);
      Alert.alert('oops!', 'something went wrong... try again bestie 💕');
    }
  };

  const handleUpgradePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPaywall(true);
  };

  return (
    <>
      <CustomHeader
        title="Ask a Wizzmo!"
        showBackButton={true}
        showChatButton={false}
        showProfileButton={false}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 100 }} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.keyboardContainer, { backgroundColor: colors.background }]}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              style={[styles.scrollContainer, { backgroundColor: colors.background }]}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            <View style={[styles.content, { backgroundColor: colors.background }]}>
            {/* Subscription Status Banner */}
            {isProUser() ? (
              <View
                style={[styles.upgradeBanner, { backgroundColor: colors.surfaceElevated, borderColor: '#10B981' }]}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeBannerGradient}
                >
                  <View style={[styles.upgradeBannerContent, { backgroundColor: 'transparent' }]}>
                    <View style={{ backgroundColor: 'transparent' }}>
                      <Text style={styles.upgradeBannerTitle}>
                        pro member ✨
                      </Text>
                      <Text style={styles.upgradeBannerSubtitle}>
                        unlimited questions, priority support
                      </Text>
                    </View>
                    <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.upgradeBanner, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}
                onPress={handleUpgradePress}
              >
                <LinearGradient
                  colors={[colors.primary, colors.primary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.upgradeBannerGradient}
                >
                  <View style={[styles.upgradeBannerContent, { backgroundColor: 'transparent' }]}>
                    <View style={{ backgroundColor: 'transparent' }}>
                      <Text style={styles.upgradeBannerTitle}>
                        {getQuestionsRemaining() === -1 ? 'unlimited' : `${getQuestionsRemaining()} questions remaining`}
                      </Text>
                      <Text style={styles.upgradeBannerSubtitle}>
                        upgrade to pro for unlimited questions ✨
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            )}


            {/* Main Question Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              what's going on?
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: 'transparent', borderColor: colors.border }]}>
              <View style={styles.titleInputContainer}>
                <TextInput
                  style={[styles.titleInput, { color: colors.text }]}
                  placeholder={!showAnimation ? staticPlaceholders[placeholderIndex] : ""}
                  placeholderTextColor={colors.textTertiary}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={120}
                  multiline={true}
                  numberOfLines={2}
                  textAlignVertical="top"
                />
                {!title.trim() && showAnimation && displayText && (
                  <View style={styles.animatedPlaceholder} pointerEvents="none">
                    <Text style={[styles.animatedPlaceholderText, { color: colors.textTertiary }]}>
                      {displayText}
                      <Text style={[styles.cursor, { color: colors.textTertiary, opacity: isTyping ? 1 : 0 }]}>|</Text>
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.characterCount, { color: colors.textTertiary }]}>
                {title.length}/120
              </Text>
            </View>
          </View>

          {/* Question Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              details (optional)
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: 'transparent', borderColor: colors.border }]}>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="the more details, the better advice we can give you..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={8}
                value={question}
                onChangeText={setQuestion}
                maxLength={800}
                textAlignVertical="top"
              />
              <Text style={[styles.characterCount, { color: colors.textTertiary }]}>
                {question.length}/800
              </Text>
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              what type of advice? 💭
            </Text>

            {loadingCategories ? (
              <View style={[styles.categoriesContainer, { backgroundColor: colors.surface, borderColor: colors.border, alignItems: 'center', padding: 40 }]}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>loading categories...</Text>
              </View>
            ) : categories.length === 0 ? (
              <View style={[styles.categoriesContainer, { backgroundColor: colors.surface, borderColor: colors.border, padding: 20 }]}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>no categories available. please try again later.</Text>
              </View>
            ) : (
            <View style={[styles.categoriesContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <ScrollView 
                style={{ backgroundColor: 'transparent' }}
                contentContainerStyle={styles.categoriesScrollContent}
                showsVerticalScrollIndicator={false}
              >
              {sortCategoriesForUser(categories).map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryRow,
                    {
                      backgroundColor: 'transparent',
                      borderBottomColor: colors.separator,
                    },
                    isSelected && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => {
                    console.log('[AskScreen] Category selected:', { id: category.id, name: category.name });
                    setSelectedCategory(category.id);
                  }}
                >
                  <View style={[styles.categoryContent, { backgroundColor: 'transparent' }]}>
                    <Text style={[styles.categoryEmoji, { fontSize: 20 }]}>
                      {category.name === 'Dating' ? '💕' : 
                       category.name === 'Drama Talk' ? '🍵' :
                       category.name === 'Matchmaking' ? '💘' :
                       category.name === 'Classes' ? '📚' :
                       category.name === 'Roommates' ? '🏠' :
                       category.name === 'Style' ? '✨' :
                       category.name === 'Wellness' ? '🌱' :
                       category.name === 'Friend Drama' ? '😤' :
                       category.name === 'Situationships' ? '💭' :
                       category.name === 'Hookup Culture' ? '🔥' :
                       category.name === 'Study Tips' ? '📖' :
                       category.name === 'Social Life' ? '🎉' :
                       category.name === 'First Dates' ? '💫' :
                       category.name === 'Breakups' ? '💔' :
                       category.name === 'Body Image' ? '💪' :
                       category.name === 'Mental Health' ? '🧠' :
                       category.name === 'Self Care' ? '🌸' :
                       category.name === 'Greek Life' ? '🏛️' :
                       category.name === 'Making Friends' ? '👯‍♀️' :
                       category.name === 'Dining Hall' ? '🍽️' :
                       category.name === 'Confidence' ? '👑' :
                       category.name === 'Fashion' ? '👗' : '💬'}
                    </Text>
                    <Text
                      style={[
                        styles.categoryRowName,
                        { color: isSelected ? 'white' : colors.text }
                      ]}
                    >
                      {category.name}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text style={[styles.selectedIcon, { color: 'white' }]}>✓</Text>
                  )}
                </TouchableOpacity>
                );
              })}
              </ScrollView>
            </View>
            )}
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <View style={[styles.privacyCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.privacyOption}>
                <View style={styles.privacyContent}>
                  <Text style={[styles.privacyTitle, { color: colors.text }]}>
                    help other students
                  </Text>
                  <Text style={[styles.privacyDescription, { color: colors.textSecondary }]}>
                    share your question & advice publicly to help others (anonymous)
                  </Text>
                </View>
                <Switch
                  value={allowPublicShare}
                  onValueChange={setAllowPublicShare}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={allowPublicShare ? '#FFFFFF' : colors.textTertiary}
                />
              </View>
            </View>
          </View>

          {/* Choose Specific Wizzmo Section */}
          <View style={styles.section}>
            <View style={[styles.mentorSearchToggle, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.mentorToggleContent}>
                <Text style={[styles.mentorToggleTitle, { color: colors.text }]}>
                  specific mentor?
                </Text>
                <Text style={[styles.mentorToggleSubtitle, { color: colors.textSecondary }]}>
                  search or select from favorites
                </Text>
              </View>
              <Switch
                value={showMentorSearch}
                onValueChange={setShowMentorSearch}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={showMentorSearch ? '#FFFFFF' : colors.textTertiary}
              />
            </View>

            {/* Pre-selected Mentors from Wizzmos Tab */}
            {preSelectedMentors.length > 0 && (
              <View style={[styles.preSelectedSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.preSelectedTitle, { color: colors.text }]}>
                  ✨ Selected Wizzmos ({preSelectedMentors.length})
                </Text>
                <Text style={[styles.preSelectedSubtitle, { color: colors.textSecondary }]}>
                  These mentors will get your question first
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.preSelectedScroll}>
                  {preSelectedMentors.map((mentor) => (
                    <View key={mentor.id} style={[styles.preSelectedMentor, { backgroundColor: colors.background }]}>
                      {mentor.avatar_url ? (
                        <Image 
                          source={{ uri: mentor.avatar_url }} 
                          style={styles.preSelectedAvatar}
                        />
                      ) : (
                        <View style={[styles.preSelectedAvatar, { backgroundColor: colors.primary }]}>
                          <Text style={styles.preSelectedAvatarText}>
                            {mentor.name?.charAt(0) || 'W'}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.preSelectedName, { color: colors.text }]} numberOfLines={1}>
                        {mentor.name}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
                <TouchableOpacity 
                  style={[styles.clearSelectedButton, { borderColor: colors.border }]}
                  onPress={() => {
                    setPreSelectedMentors([]);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.clearSelectedText, { color: colors.textSecondary }]}>
                    Clear selection
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Mentor Search Content - Only shown when toggle is on */}
            {showMentorSearch && (
              <View style={[styles.mentorSearchContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {/* Search Input */}
                <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="search" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="search wizzmos..."
                    placeholderTextColor={colors.textTertiary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {isSearching && (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )}
                </View>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <View style={[styles.searchResults, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    {searchResults.map((mentor) => {
                      const isSelected = selectedMentor === mentor.id;
                      const profile = mentor.mentor_profiles[0];
                      return (
                        <TouchableOpacity
                          key={mentor.id}
                          style={[
                            styles.searchResultItem,
                            {
                              backgroundColor: isSelected ? colors.primary : 'transparent',
                              borderBottomColor: colors.separator,
                            }
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            if (isSelected) {
                              // Deselecting - clear everything
                              setSelectedWizzmo(null);
                              setSelectedWizzmoData(null);
                              setSearchResults([]);
                              setSearchQuery('');
                            } else {
                              // Validate mentor ID is a proper UUID before setting
                              const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                              if (!uuidRegex.test(mentor.id)) {
                                console.error('[AskScreen] Invalid search mentor UUID:', mentor.id);
                                Alert.alert('Error', 'Invalid mentor data. Please try refreshing the app.');
                                return;
                              }
                              
                              // Selecting - store mentor data, clear results
                              setSelectedWizzmo(mentor.id);
                              setSelectedWizzmoData(mentor);
                              setSearchResults([]);
                              setSearchQuery('');
                            }
                          }}
                        >
                          <View style={[styles.searchResultAvatar, { backgroundColor: isSelected ? '#FFFFFF' : colors.primary }]}>
                            <Text style={[styles.searchResultInitial, { color: isSelected ? colors.primary : '#FFFFFF' }]}>
                              {mentor.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </Text>
                          </View>
                          <View style={[styles.searchResultInfo, { backgroundColor: 'transparent' }]}>
                            <Text style={[styles.searchResultName, { color: isSelected ? '#FFFFFF' : colors.text }]}>
                              {mentor.full_name}
                            </Text>
                            {mentor.username && (
                              <Text style={[styles.searchResultUsername, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                                @{mentor.username}
                              </Text>
                            )}
                            {profile?.average_rating && (
                              <View style={[styles.searchResultRating, { backgroundColor: 'transparent' }]}>
                                <Ionicons name="star" size={12} color={isSelected ? '#FFFFFF' : colors.primary} />
                                <Text style={[styles.searchResultRatingText, { color: isSelected ? '#FFFFFF' : colors.textSecondary }]}>
                                  {profile.average_rating.toFixed(1)} • {profile.total_questions_answered || 0} questions
                                </Text>
                              </View>
                            )}
                          </View>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Favorite Wizzmos */}
                {favoriteMentors.length > 0 && (
                  <View style={styles.favoritesSection}>
                    <Text style={[styles.favoritesTitle, { color: colors.text }]}>
                      your favorites
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.favoritesScrollContent}
                    >
                      {favoriteMentors.map((favorite) => {
                        const isSelected = selectedMentor === favorite.mentor_id;
                        return (
                          <TouchableOpacity
                            key={favorite.id}
                            style={[
                              styles.favoriteCard,
                              {
                                backgroundColor: isSelected ? colors.primary : colors.background,
                                borderColor: isSelected ? colors.primary : colors.border,
                                borderWidth: isSelected ? 2 : 1,
                              }
                            ]}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              
                              if (!isSelected) {
                                // Validate mentor_id is a proper UUID before setting
                                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                                if (!uuidRegex.test(favorite.mentor_id)) {
                                  console.error('[AskScreen] Invalid favorite mentor UUID:', favorite.mentor_id);
                                  Alert.alert('Error', 'Invalid mentor data. Please try refreshing the app.');
                                  return;
                                }
                              }
                              
                              setSelectedWizzmo(isSelected ? null : favorite.mentor_id);
                            }}
                          >
                            <View style={[styles.favoriteAvatar, { backgroundColor: isSelected ? '#FFFFFF' : colors.primary }]}>
                              <Text style={[styles.favoriteInitial, { color: isSelected ? colors.primary : '#FFFFFF' }]}>
                                {favorite.mentors?.full_name?.charAt(0).toUpperCase() || 'W'}
                              </Text>
                            </View>
                            <Text style={[styles.favoriteName, { color: isSelected ? '#FFFFFF' : colors.text }]} numberOfLines={1}>
                              {favorite.mentors?.full_name || 'Wizzmo'}
                            </Text>
                            <Ionicons name={isSelected ? "checkmark-circle" : "heart"} size={16} color={isSelected ? "#FFFFFF" : "#FF4DB8"} />
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Selected Mentor from Search */}
                {selectedMentor && !favoriteMentors.find(f => f.mentor_id === selectedMentor) && (
                  <View style={styles.selectedMentorSection}>
                    <Text style={[styles.favoritesTitle, { color: colors.text }]}>
                      selected wizzmo
                    </Text>
                    <View style={[styles.selectedMentorCard, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                      <View style={[styles.favoriteAvatar, { backgroundColor: '#FFFFFF' }]}>
                        <Text style={[styles.favoriteInitial, { color: colors.primary }]}>
                          {selectedMentorData?.full_name?.charAt(0).toUpperCase() || 'W'}
                        </Text>
                      </View>
                      <Text style={[styles.favoriteName, { color: '#FFFFFF' }]} numberOfLines={1}>
                        {selectedMentorData?.full_name || 'Selected Wizzmo'}
                      </Text>
                      <TouchableOpacity onPress={() => {
                        setSelectedWizzmo(null);
                        setSelectedWizzmoData(null);
                      }}>
                        <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Submit Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  opacity: (!title.trim() || !selectedCategory || isSubmitting) ? 0.5 : 1
                }
              ]}
              onPress={handleSubmit}
              disabled={!title.trim() || !selectedCategory || isSubmitting}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary]}
                style={styles.submitButtonGradient}
              >
                <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                  {isSubmitting ? 'connecting you with your wizzmo...' : 'get my advice ✨'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
            </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>

        {/* Paywall Modal */}
        <PaywallModal visible={showPaywall} onClose={() => setShowPaywall(false)} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  upgradeBanner: {
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 3,
    overflow: 'hidden',
  },
  upgradeBannerGradient: {
    padding: 16,
  },
  upgradeBannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  upgradeBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  upgradeBannerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: -0.1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
    marginBottom: 12,
    lineHeight: 18,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'transparent',
  },
  titleInput: {
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: 'top',
    fontWeight: '400',
    paddingVertical: 12,
    minHeight: 56,
    maxHeight: 56,
    paddingHorizontal: 0,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 140,
    textAlignVertical: 'top',
    fontWeight: '400',
  },
  characterCount: {
    alignSelf: 'flex-end',
    marginTop: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  categoriesContainer: {
    borderWidth: 1,
    borderRadius: 20,
    maxHeight: 300,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  categoriesScrollContent: {
    paddingBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    borderRadius: 12,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
  categoryRowName: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    letterSpacing: -0.2,
  },
  selectedIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  relevantIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  relevantDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  selectedCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  categoryEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
  },
  relevantBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  relevantBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
  submitButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  privacyCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  privacyDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },

  // Favorite Wizzmos
  favoritesScrollContent: {
    gap: 12,
  },
  favoriteCard: {
    width: 100,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    gap: 8,
  },
  favoriteAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  favoriteName: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
  },

  // Search Components
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  searchResults: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  searchResultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultInitial: {
    fontSize: 16,
    fontWeight: '700',
  },
  searchResultInfo: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  searchResultUsername: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginBottom: 4,
  },
  searchResultRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchResultRatingText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },

  // Mentor Search Toggle
  mentorSearchToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mentorToggleContent: {
    flex: 1,
  },
  mentorToggleTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  mentorToggleSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  mentorSearchContent: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
  },
  favoritesSection: {
    marginTop: 16,
  },
  favoritesTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  selectedMentorSection: {
    marginTop: 16,
  },
  selectedMentorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderRadius: 20,
    gap: 12,
  },

  // Animated typing placeholder styles
  titleInputContainer: {
    position: 'relative',
  },
  animatedPlaceholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  animatedPlaceholderText: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  cursor: {
    fontSize: 16,
    fontWeight: '400',
    opacity: 1,
  },

  // Pre-selected mentors styles
  preSelectedSection: {
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 20,
  },
  preSelectedTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  preSelectedSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 12,
  },
  preSelectedScroll: {
    marginBottom: 12,
  },
  preSelectedMentor: {
    alignItems: 'center',
    padding: 8,
    marginRight: 12,
    borderRadius: 16,
    width: 80,
  },
  preSelectedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preSelectedAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  preSelectedName: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  clearSelectedButton: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
  },
  clearSelectedText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
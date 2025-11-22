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

interface FavoriteWizzmo {
  id: string;
  mentor_id: string;
  mentors: {
    full_name: string;
    avatar_url?: string;
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
  const [categories, setCategories] = useState<Array<{id: string, slug: string, name: string, emoji: string, description: string}>>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [favoriteWizzmos, setFavoriteWizzmos] = useState<FavoriteWizzmo[]>([]);
  const [selectedWizzmo, setSelectedWizzmo] = useState<string | null>(null);
  const [selectedWizzmoData, setSelectedWizzmoData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{id: string, full_name: string, avatar_url?: string, mentor_profiles: any}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showMentorSearch, setShowMentorSearch] = useState(false);

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

  // Fetch categories from Supabase on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('[AskScreen] Fetching categories from Supabase');
        const { data: dbCategories } = await supabaseService.getCategories();
        if (dbCategories && dbCategories.length > 0) {
          // Transform database categories to app format
          const transformedCategories = dbCategories.map(cat => ({
            id: cat.id,
            slug: cat.slug,
            name: cat.name.toLowerCase(),
            emoji: cat.icon || '💭',
            description: cat.description || '',
          }));
          setCategories(transformedCategories);
          console.log('[AskScreen] Loaded categories:', transformedCategories.length);
        }
      } catch (error) {
        console.error('[AskScreen] Error fetching categories:', error);
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
        console.log('[AskScreen] Loaded', data.length, 'favorite wizzmos');
        setFavoriteWizzmos(data);
      } else if (error) {
        console.error('[AskScreen] Error loading favorites:', error);
      }
    };

    fetchFavorites();
  }, [user]);

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

  const handleSubmit = async () => {
    // Check if user selected a specific wizzmo (premium feature)
    if (selectedWizzmo && !isProUser) {
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
      Alert.alert('hold up babe!', 'give your question a quick title first 💕');
      return;
    }
    if (!question.trim()) {
      Alert.alert('almost there!', 'tell us what\'s going on 💕');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('one more thing!', 'pick a vibe so we know who to connect u with ✨');
      return;
    }

    if (!user) {
      Alert.alert('oops!', 'you need to be logged in to ask a question 💕');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[AskScreen] Submitting question to Supabase');

      // Create the question in Supabase
      const { data: newQuestion, error } = await supabaseService.createQuestion(
        user.id,
        selectedCategory,
        title.trim(),
        question.trim(),
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
      if (selectedWizzmo && newQuestion) {
        console.log('[AskScreen] Creating direct session with selected wizzmo:', selectedWizzmo);
        const { data: session, error: sessionError } = await supabaseService.createAdviceSession(
          newQuestion.id,
          selectedWizzmo
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

      const message = selectedWizzmo
        ? 'your chosen wizzmo is getting notified now! 💕'
        : 'ur wizzmos are getting ready to slide into the chat... this usually takes like 5-15 min max!';

      Alert.alert(
        'we got u girl! 💕',
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
        title="spill tea"
        showBackButton={false}
        showChatButton={true}
        showProfileButton={true}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 100 }} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.keyboardContainer, { backgroundColor: colors.background }]}
        >
          <ScrollView
            style={[styles.scrollContainer, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
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
                  colors={colors.gradientPrimary}
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


            {/* Title Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              title
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.titleInput, { color: colors.text }]}
                placeholder="what's this about?"
                placeholderTextColor={colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                maxLength={80}
              />
              <Text style={[styles.characterCount, { color: colors.textTertiary }]}>
                {title.length}/80
              </Text>
            </View>
          </View>

          {/* Question Input */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              details
            </Text>

            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.textInput, { color: colors.text }]}
                placeholder="what's happening?"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={8}
                value={question}
                onChangeText={setQuestion}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={[styles.characterCount, { color: colors.textTertiary }]}>
                {question.length}/500
              </Text>
            </View>
          </View>

          {/* Category Selection */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              category
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
              {sortCategoriesForUser(categories).map((category, index) => {
                const isRelevant = userProfile?.interests && (
                  userProfile.interests.includes(category.slug) || 
                  userProfile.interests.includes(category.id)
                );
                return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    {
                      backgroundColor: selectedCategory === category.id
                        ? colors.primary
                        : 'transparent',
                      borderBottomColor: colors.separator,
                    },
                    index === categories.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <Text style={styles.categoryEmoji}>
                    {category.emoji}
                  </Text>
                  <View style={[styles.categoryInfo, { backgroundColor: 'transparent' }]}>
                    <View style={[styles.categoryHeader, { backgroundColor: 'transparent' }]}>
                      <Text
                        style={[
                          styles.categoryName,
                          { color: selectedCategory === category.id ? '#000000' : colors.text }
                        ]}
                      >
                        {category.name}
                      </Text>
                      {isRelevant && (
                        <View style={[styles.relevantBadge, { backgroundColor: colors.primary }]}>
                          <Text style={styles.relevantBadgeText}>your interest</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
                );
              })}
            </View>
            )}
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              sharing
            </Text>

            <View style={[styles.privacyCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.privacyOption}>
                <View style={styles.privacyContent}>
                  <Text style={[styles.privacyTitle, { color: colors.text }]}>
                    help other students
                  </Text>
                  <Text style={[styles.privacyDescription, { color: colors.textSecondary }]}>
                    share your question & advice in our public feed to help other students with similar situations (your name stays anonymous)
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
                  choose specific wizzmo
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
                      const isSelected = selectedWizzmo === mentor.id;
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
                {favoriteWizzmos.length > 0 && (
                  <View style={styles.favoritesSection}>
                    <Text style={[styles.favoritesTitle, { color: colors.text }]}>
                      your favorites
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.favoritesScrollContent}
                    >
                      {favoriteWizzmos.map((favorite) => {
                        const isSelected = selectedWizzmo === favorite.mentor_id;
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
                {selectedWizzmo && !favoriteWizzmos.find(f => f.mentor_id === selectedWizzmo) && (
                  <View style={styles.selectedMentorSection}>
                    <Text style={[styles.favoritesTitle, { color: colors.text }]}>
                      selected wizzmo
                    </Text>
                    <View style={[styles.selectedMentorCard, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                      <View style={[styles.favoriteAvatar, { backgroundColor: '#FFFFFF' }]}>
                        <Text style={[styles.favoriteInitial, { color: colors.primary }]}>
                          {selectedWizzmoData?.full_name?.charAt(0).toUpperCase() || 'W'}
                        </Text>
                      </View>
                      <Text style={[styles.favoriteName, { color: '#FFFFFF' }]} numberOfLines={1}>
                        {selectedWizzmoData?.full_name || 'Selected Wizzmo'}
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
                  opacity: (!title.trim() || !question.trim() || !selectedCategory || isSubmitting) ? 0.5 : 1
                }
              ]}
              onPress={handleSubmit}
              disabled={!title.trim() || !question.trim() || !selectedCategory || isSubmitting}
            >
              <LinearGradient
                colors={colors.gradientPrimary}
                style={styles.submitButtonGradient}
              >
                <Text style={[styles.submitButtonText, { color: '#FFFFFF' }]}>
                  {isSubmitting ? 'submitting...' : 'submit'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
            </View>
          </ScrollView>
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
    borderRadius: 0,
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
    fontWeight: '600',
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
    borderRadius: 0,
    padding: 16,
  },
  titleInput: {
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
    fontWeight: '400',
    paddingVertical: 12,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
    overflow: 'hidden',
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
    borderRadius: 0,
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
    fontWeight: '600',
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
    borderRadius: 0,
    alignItems: 'center',
    gap: 8,
  },
  favoriteAvatar: {
    width: 56,
    height: 56,
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
    padding: 16,
    marginBottom: 12,
  },
  mentorToggleContent: {
    flex: 1,
  },
  mentorToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    borderRadius: 0,
    padding: 16,
  },
  favoritesSection: {
    marginTop: 16,
  },
  favoritesTitle: {
    fontSize: 14,
    fontWeight: '600',
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
    borderRadius: 0,
    gap: 12,
  },
});
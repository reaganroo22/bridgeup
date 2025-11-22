import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  View,
  Text,
  Platform,
  TextInput,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Typography, FontFamily } from '@/constants/Fonts';
import { useColorScheme } from '@/components/useColorScheme';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserProfile } from '../../contexts/UserProfileContext';
import { useUserMode } from '../../contexts/UserModeContext';
import { supabase } from '../../lib/supabase';
import * as supabaseService from '../../lib/supabaseService';
import FloatingActionButton from '@/components/FloatingActionButton';
import CustomHeader from '@/components/CustomHeader';
import ModeToggle from '@/components/ModeToggle';
import MentorShowcase from '@/components/MentorShowcase';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { trendingTopics } = useApp();
  const { user } = useAuth();
  const { userProfile, getPersonalizedGreeting, isHighSchool, isUniversity, isGraduate } = useUserProfile();
  const { currentMode } = useUserMode();
  const isWizzmo = currentMode === 'mentor';
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Mentor-specific state
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [activeChatCount, setActiveChatCount] = useState(0);
  const [helpfulPercentage, setHelpfulPercentage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [processingQuestions, setProcessingQuestions] = useState<Set<string>>(new Set());
  
  const insets = useSafeAreaInsets();

  const pulseScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const rotationDegree = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    // Pulse animation for live indicator
    const pulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();
    };

    pulseAnimation();
    const pulseInterval = setInterval(pulseAnimation, 2000);

    // Fetch mentor data if user is a wizzmo
    if (isWizzmo && user) {
      fetchMentorData();
    }

    return () => {
      clearInterval(timer);
      clearInterval(pulseInterval);
    };
  }, [isWizzmo, user, pulseScale]);

  const handlePress = (destination: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(destination as any);
  };


  // Category icon mapping
  const getCategoryIcon = (categoryName: string) => {
    const iconMap: { [key: string]: string } = {
      'Academics': '📚',
      'Career & Internships': '💼',
      'Dating & Relationships': '💕',
      'Dorm Life': '🏠',
      'Finance': '💰',
      'General Advice': '💭',
      'Mental Health': '🧠',
      'Other': '🤔',
      'Social Life': '🎉'
    };
    return iconMap[categoryName] || '💭';
  };

  // Mentor-specific functions
  const fetchMentorData = async () => {
    if (!user) return;

    try {
      // Fetch pending questions
      const { data: questions } = await supabaseService.getPendingQuestions(user.id);
      if (questions) {
        const transformedQuestions = questions.map(q => ({
          id: q.id,
          title: q.title,
          content: q.content,
          category: q.category?.name || 'General',
          category_icon: getCategoryIcon(q.category?.name || 'General'),
          urgency: q.urgency || 'medium',
          created_at: q.created_at,
          is_anonymous: q.is_anonymous || false,
        }));
        setPendingQuestions(transformedQuestions);
      }

      // Fetch active chat count
      const { data: activeSessions } = await supabaseService.getActiveSessions(user.id, 'mentor');
      setActiveChatCount(activeSessions?.length || 0);

      // Fetch helpful percentage
      const { data: profile } = await supabaseService.getUserProfile(user.id);
      if (profile?.mentor_profile) {
        const { total_questions_answered, total_helpful_votes } = profile.mentor_profile;
        const percentage = total_questions_answered > 0
          ? Math.round((total_helpful_votes / total_questions_answered) * 100)
          : 0;
        setHelpfulPercentage(percentage);
      }
    } catch (error) {
      console.error('[HomeScreen] Error fetching mentor data:', error);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - then.getTime()) / 60000);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const handleAcceptQuestion = async (questionId: string) => {
    if (!user) return;

    // Prevent duplicate processing
    if (processingQuestions.has(questionId)) {
      console.log('[HomeScreen] Question already being processed:', questionId);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Mark as processing
    setProcessingQuestions(prev => new Set(prev).add(questionId));

    try {
      // Check if session already exists for this question
      const { data: existingSession } = await supabaseService.getSessionByQuestionId(questionId);
      
      if (existingSession) {
        console.log('[HomeScreen] Session already exists for question:', questionId);
        setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
        router.push(`/chat?chatId=${existingSession.id}`);
        return;
      }

      const { data: session, error } = await supabaseService.createAdviceSession(questionId, user.id);
      if (error) {
        console.error('[HomeScreen] Error creating session:', error);
        return;
      }

      setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
      
      if (session?.id) {
        router.push(`/chat?chatId=${session.id}`);
      }
    } catch (error) {
      console.error('[HomeScreen] Error accepting question:', error);
    } finally {
      // Remove from processing set
      setProcessingQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const handleDeclineQuestion = async (questionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleMentorPress = (mentorId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to ask tab with advisor pre-selected
    if (mentorId.startsWith('demo-')) {
      // For demo advisors, just go to ask tab (they'll be available to select there)
      router.push('/(tabs)/ask');
    } else {
      // For real advisors, go to their profile first, then they can ask for advice
      router.push(`/bridgeup-profile?userId=${mentorId}`);
    }
  };


  // Animation style can be used directly in component style prop if needed
  // { transform: [{ scale: pulseScale }] }

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'good morning';
    if (hour < 17) return 'good afternoon';
    return 'good evening';
  };

  // Use dynamic trending topics from context (top 5 buzzy posts)
  const liveTopics = trendingTopics.slice(0, 5).map(topic => ({
    ...topic,
    gradient: colors.gradientPrimary
  }));

  // Removed quick actions since we now have floating buttons

  // Render different content based on user role
  if (isWizzmo) {
    return (
      <>
        <CustomHeader 
          title="inbox"
          showBackButton={false}
          showChatButton={false}
          showProfileButton={true}
          rightActions={
            <>
              <ModeToggle showText={false} />
            </>
          }
        />

        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          refreshControl={
            <View />
          }
        >
          <View style={{ height: insets.top + 100 }} />
          <View style={[styles.content, { backgroundColor: colors.background }]}>

            {/* Header Stats */}
            <View style={[styles.statsCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.primary }]}>{pendingQuestions.length}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>pending</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{activeChatCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>active chats</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: helpfulPercentage >= 90 ? '#10B981' : colors.text }]}>
                  {Math.min(helpfulPercentage, 100)}%
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>helpful rate</Text>
              </View>
            </View>

            {/* Pending Questions */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                new questions
              </Text>

              {pendingQuestions.length > 0 ? (
                <View style={[styles.topicsList, { borderColor: colors.border }]}>
                  {(showAllQuestions ? pendingQuestions : pendingQuestions.slice(0, 3)).map((question, index) => (
                    <View
                      key={question.id}
                      style={[
                        styles.enhancedQuestionCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          shadowColor: colors.text
                        },
                      ]}
                    >
                      {/* Header with category and time */}
                      <View style={styles.questionHeader}>
                        <View style={styles.categoryRow}>
                          <Text style={styles.categoryEmoji}>{question.category_icon || '💬'}</Text>
                          <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                            <Text style={[styles.categoryText, { color: colors.primary }]}>
                              {question.category}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.timeStamp, { color: colors.textSecondary }]}>
                          {getTimeAgo(question.created_at)}
                        </Text>
                      </View>

                      {/* Question Title */}
                      <Text style={[styles.enhancedQuestionTitle, { color: colors.text }]} numberOfLines={3}>
                        {question.title}
                      </Text>

                      {/* Question Content Preview */}
                      <View style={[styles.enhancedQuestionPreview, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <View style={styles.questionLabelRow}>
                          <Text style={[styles.enhancedQuestionLabel, { color: colors.primary }]}>
                            💭 Student asks:
                          </Text>
                          {question.content && question.content.length > 120 && (
                            <TouchableOpacity 
                              style={[styles.expandButton, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}
                              onPress={() => {
                                Alert.alert(
                                  `📚 ${question.category}`,
                                  `"${question.title}"\n\n${question.content}`,
                                  [
                                    { 
                                      text: '✨ Accept & Help', 
                                      onPress: () => handleAcceptQuestion(question.id), 
                                      style: 'default' 
                                    },
                                    { text: 'Close', onPress: () => {}, style: 'cancel' }
                                  ]
                                );
                              }}
                            >
                              <Text style={[styles.expandText, { color: colors.primary }]}>
                                Full question
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        
                        <Text style={[styles.enhancedQuestionContent, { color: colors.textSecondary }]} numberOfLines={3}>
                          {question.content}
                        </Text>
                      </View>
                      
                      {/* Action Buttons */}
                      <View style={styles.enhancedActionButtons}>
                        <TouchableOpacity
                          style={[styles.enhancedDeclineButton, { borderColor: colors.border, backgroundColor: colors.background }]}
                          onPress={() => handleDeclineQuestion(question.id)}
                        >
                          <Text style={[styles.enhancedDeclineText, { color: colors.textSecondary }]}>
                            Pass
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.enhancedAcceptButton,
                            { backgroundColor: processingQuestions.has(question.id) ? colors.textSecondary : colors.primary }
                          ]}
                          onPress={() => handleAcceptQuestion(question.id)}
                          disabled={processingQuestions.has(question.id)}
                        >
                          <Text style={styles.enhancedAcceptText}>
                            {processingQuestions.has(question.id) ? 'Accepting...' : '✨ Accept & Help'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                  
                  {/* Show More/Less Button */}
                  {pendingQuestions.length > 3 && (
                    <TouchableOpacity
                      style={[styles.showMoreButton, { borderTopColor: colors.border, backgroundColor: colors.surface }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowAllQuestions(!showAllQuestions);
                      }}
                    >
                      <Text style={[styles.showMoreText, { color: colors.primary }]}>
                        {showAllQuestions ? 'show less' : `show ${pendingQuestions.length - 3} more`}
                      </Text>
                      <Ionicons 
                        name={showAllQuestions ? 'chevron-up' : 'chevron-down'} 
                        size={18} 
                        color={colors.primary} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={[styles.tipCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <Text style={[styles.tipTitle, { color: colors.text }]}>
                    ✨ all caught up!
                  </Text>
                  <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                    no new questions right now. check back later for students who need advice!
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <CustomHeader 
        showProfileButton={true}
        rightActions={
          <>
            <ModeToggle showText={false} />
          </>
        }
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 100 }} />
        <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Personalized Greeting */}
        <View style={styles.section}>
          <Text style={[styles.greetingText, { color: colors.text }]}>
            {getPersonalizedGreeting()}
          </Text>
        </View>

        {/* Mentor Showcase */}
        <MentorShowcase onMentorPress={handleMentorPress} />

        {/* Active Conversations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            active now
          </Text>

          <View style={[styles.topicsList, { borderColor: colors.border }]}>
            {liveTopics.map((topic, index) => (
                <TouchableOpacity
                  key={topic.id}
                  style={[
                    styles.topicItem,
                    { borderBottomColor: colors.separator },
                    index === liveTopics.length - 1 && { borderBottomWidth: 0 },
                  ]}
                  onPress={() => handlePress('/(tabs)/feed')}
                  activeOpacity={0.7}
                >
                  <View style={styles.topicContent}>
                    <Text style={[styles.topicEmoji]}>{topic.emoji}</Text>
                    <View style={styles.topicInfo}>
                      <View style={styles.topicTitleRow}>
                        <Text style={[styles.topicTitle, { color: colors.text }]}>
                          {topic.title}
                        </Text>
                        {topic.isLive && (
                          <View style={[styles.liveBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.liveText}>live</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.topicMeta, { color: colors.textSecondary }]}>
                        {topic.participants > 0
                          ? `${topic.participants} engaged • ${topic.category}`
                          : `${topic.category} • just posted`
                        }
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
            ))}
          </View>
        </View>


        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon="add"
        label="ask question"
        onPress={() => handlePress('/(tabs)/ask')}
        position="bottom-right"
        size="large"
      />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Content
  scrollContainer: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  subGreeting: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
    textTransform: 'lowercase',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 16,
  },

  // Topic List
  topicsList: {
    borderWidth: 1,
    borderRadius: 0,
  },
  topicItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  topicContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
  },
  liveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  topicMeta: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
  },

  // Enhanced Question Preview
  questionPreview: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  questionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  questionContent: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 20,
    marginBottom: 8,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Enhanced Question Cards
  enhancedQuestionCard: {
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  timeStamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  enhancedQuestionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    lineHeight: 24,
    marginBottom: 12,
  },
  enhancedQuestionPreview: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  questionLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  enhancedQuestionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  expandButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  expandText: {
    fontSize: 11,
    fontWeight: '600',
  },
  enhancedQuestionContent: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 22,
  },
  enhancedActionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  enhancedDeclineButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  enhancedDeclineText: {
    fontSize: 14,
    fontWeight: '600',
  },
  enhancedAcceptButton: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  enhancedAcceptText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },

  // Tip Card
  tipCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 20,
  },

  bottomSpacing: {
    height: 80,
  },
  
  // Mentor UI Styles
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  statsCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  questionCard: {
    padding: 16,
    borderBottomWidth: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  declineButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 0,
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  acceptButton: {
    flex: 2,
    borderRadius: 0,
    overflow: 'hidden',
  },
  acceptButtonBg: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.6,
  },
  
  // Show More Button
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 6,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
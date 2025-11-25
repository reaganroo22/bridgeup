import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CustomHeader from '@/components/CustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import * as supabaseService from '@/lib/supabaseService';

interface Question {
  id: string;
  title: string;
  content: string;
  category: string;
  urgency: 'low' | 'medium' | 'high';
  created_at: string;
  is_anonymous: boolean;
  category_icon?: string;
}

export default function MentorInboxScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [pendingQuestions, setPendingQuestions] = useState<Question[]>([]);
  const [requestedQuestions, setRequestedQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatCount, setActiveChatCount] = useState(0);
  const [helpfulPercentage, setHelpfulPercentage] = useState(0);

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

  // Fetch pending questions from Supabase
  const fetchPendingQuestions = async () => {
    if (!authUser) {
      console.log('[MentorInbox] No authUser, skipping fetch');
      return;
    }

    try {
      console.log('[MentorInbox] Fetching questions for mentor:', authUser.id);
      
      // Fetch both general pending questions and specifically requested questions
      const [generalResponse, requestedResponse] = await Promise.all([
        supabaseService.getPendingQuestions(authUser.id),
        supabaseService.getRequestedQuestions(authUser.id)
      ]);

      console.log('[MentorInbox] Response data:', { 
        general: generalResponse.data, 
        requested: requestedResponse.data 
      });

      if (generalResponse.error) {
        console.error('[MentorInbox] Error fetching general questions:', generalResponse.error);
        return;
      }

      if (requestedResponse.error) {
        console.error('[MentorInbox] Error fetching requested questions:', requestedResponse.error);
        return;
      }

      // Transform general questions
      if (generalResponse.data) {
        const transformedQuestions: Question[] = generalResponse.data.map(q => ({
          id: q.id,
          title: q.title,
          content: q.content,
          category: q.category?.name || 'General',
          category_icon: getCategoryIcon(q.category?.name || 'General'),
          urgency: q.urgency || 'medium',
          created_at: q.created_at,
          is_anonymous: q.is_anonymous || false,
        }));

        console.log('[MentorInbox] Setting general pending questions count:', transformedQuestions.length);
        setPendingQuestions(transformedQuestions);
      } else {
        setPendingQuestions([]);
      }

      // Transform requested questions  
      if (requestedResponse.data) {
        const transformedRequestedQuestions: Question[] = requestedResponse.data.map(q => ({
          id: q.id,
          title: q.title,
          content: q.content,
          category: q.category?.name || 'General',
          category_icon: getCategoryIcon(q.category?.name || 'General'),
          urgency: q.urgency || 'medium',
          created_at: q.created_at,
          is_anonymous: q.is_anonymous || false,
        }));

        console.log('[MentorInbox] Setting requested questions count:', transformedRequestedQuestions.length);
        setRequestedQuestions(transformedRequestedQuestions);
      } else {
        setRequestedQuestions([]);
      }

      // Fetch active chat count
      const { data: activeSessions } = await supabaseService.getActiveSessions(authUser.id, 'mentor');
      setActiveChatCount(activeSessions?.length || 0);

      // Fetch mentor profile to get helpful percentage
      const { data: profile } = await supabaseService.getUserProfile(authUser.id);
      if (profile?.mentor_profile) {
        const { total_questions_answered, total_helpful_votes } = profile.mentor_profile;
        const percentage = total_questions_answered > 0
          ? Math.round((total_helpful_votes / total_questions_answered) * 100)
          : 0;
        setHelpfulPercentage(percentage);
      }
    } catch (error) {
      console.error('[MentorInbox] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingQuestions();
  }, [authUser]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingQuestions();
    setRefreshing(false);
  };

  const handleAcceptQuestion = async (questionId: string) => {
    if (!authUser) {
      Alert.alert('error', 'You must be signed in to accept questions');
      return;
    }

    try {
      console.log('[MentorInbox] Accepting question:', questionId, 'by user:', authUser.id);

      // First check if this is a dual role user trying to accept their own question
      const { data: questionData } = await supabaseService.supabase
        .from('questions')
        .select('student_id')
        .eq('id', questionId)
        .single();

      if (questionData?.student_id === authUser.id) {
        console.log('[MentorInbox] Dual role user trying to accept own question');
        Alert.alert('Cannot Accept', 'You cannot accept chats you yourself have sent.');
        return;
      }

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Create advice session
      console.log('[MentorInbox] Creating advice session...');
      const { data: session, error } = await supabaseService.createAdviceSession(
        questionId,
        authUser.id
      );

      if (error) {
        console.error('[MentorInbox] Error creating session:', error);
        
        // Handle specific error for self-mentoring attempts
        if (error.message === 'Students cannot ask questions to themselves') {
          Alert.alert(
            'Cannot Accept Own Question', 
            "As a mentor, you can't accept questions you asked as a student. This helps maintain objective advice.",
            [{ text: 'OK', style: 'default' }]
          );
        } else {
          Alert.alert('Error', 'Failed to accept question. Please try again.');
        }
        return;
      }

      console.log('[MentorInbox] Session created:', session?.id, 'with status:', session?.status);

      // Accept the session to make it active
      if (session?.id) {
        console.log('[MentorInbox] Accepting session to make it active...');
        
        // Debug: Check current auth state
        const { data: authData } = await supabaseService.supabase.auth.getUser();
        console.log('[MentorInbox] Current auth state:', {
          authUserId: authUser.id,
          supabaseUserId: authData?.user?.id,
          match: authUser.id === authData?.user?.id
        });
        
        const { data: acceptedSession, error: acceptError } = await supabaseService.acceptAdviceSession(
          session.id,
          authUser.id
        );

        if (acceptError) {
          console.error('[MentorInbox] Error accepting session:', acceptError);
          Alert.alert('error', 'Failed to activate chat. Please try again.');
          return;
        }

        console.log('[MentorInbox] ✅ Session accepted successfully, new status:', acceptedSession?.status);

        // Remove from both pending and requested lists
        setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
        setRequestedQuestions(prev => prev.filter(q => q.id !== questionId));

        // Navigate to chat immediately - the chat screen will poll for status updates
        console.log('[MentorInbox] 🚀 Navigating to chat with session:', session.id);
        router.push(`/chat?chatId=${session.id}`);
      }
    } catch (error) {
      console.error('[MentorInbox] Error:', error);
      Alert.alert('error', 'Something went wrong');
    }
  };

  const handleDeclineQuestion = async (questionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('[MentorInbox] Declining question:', questionId);

    // Remove from both pending and requested lists
    setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
    setRequestedQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return '#FF4444';
      case 'medium': return '#FFA500';
      case 'low': return '#4CAF50';
      default: return colors.textSecondary;
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

  return (
    <>
      <CustomHeader
        title="inbox"
        showBackButton={false}
        showChatButton={false}
        showProfileButton={true}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={{ height: insets.top + 100 }} />
        <View style={[styles.content, { backgroundColor: colors.background }]}>

          {/* Header Stats */}
          <View style={[styles.statsCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{pendingQuestions.length + requestedQuestions.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>pending</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{requestedQuestions.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>requested</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{activeChatCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>active</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.separator }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{helpfulPercentage}%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>helpful</Text>
            </View>
          </View>

          {/* Requested Questions */}
          {requestedQuestions.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                ⭐ requested for you
              </Text>

              <View style={[styles.questionsList, { borderColor: colors.border }]}>
                {requestedQuestions.map((question, index) => (
                  <View
                    key={question.id}
                    style={[
                      styles.questionCard,
                      {
                        backgroundColor: colors.surface,
                        borderBottomColor: colors.separator
                      },
                      index === requestedQuestions.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    {/* Question Header */}
                    <View style={styles.questionHeader}>
                      <View style={styles.questionMeta}>
                        <Text style={styles.categoryIcon}>
                          {question.category_icon}
                        </Text>
                        <Text style={[styles.categoryBadge, { color: colors.primary }]}>
                          {question.category}
                        </Text>
                      </View>
                      <View style={styles.timestampRow}>
                        <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                          {getTimeAgo(question.created_at)}
                        </Text>
                      </View>
                    </View>

                    {/* Question Content - Redesigned for better visibility */}
                    <View style={[styles.questionContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.questionLabel, { color: colors.primary }]}>
                        💬 QUESTION:
                      </Text>
                      <Text style={[styles.questionTitle, { color: colors.text }]} numberOfLines={4}>
                        {question.title}
                      </Text>
                      <Text style={[styles.questionPreview, { color: colors.textSecondary }]} numberOfLines={6}>
                        {question.content}
                      </Text>
                      
                      {/* Expandable preview toggle */}
                      <TouchableOpacity 
                        style={styles.readMoreButton}
                        onPress={() => {
                          Alert.alert(
                            '⭐ Requested Question',
                            question.content,
                            [
                              { text: 'Accept & Chat', onPress: () => handleAcceptQuestion(question.id), style: 'default' },
                              { text: 'Close', onPress: () => {}, style: 'cancel' }
                            ]
                          );
                        }}
                      >
                        <Text style={[styles.readMoreText, { color: colors.primary }]}>
                          Read full question →
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Anonymous Badge */}
                    {question.is_anonymous && (
                      <View style={[styles.anonymousBadge, { backgroundColor: colors.surfaceElevated }]}>
                        <Ionicons name="eye-off-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.anonymousText, { color: colors.textSecondary }]}>
                          anonymous
                        </Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.declineButton, { borderColor: colors.border }]}
                        onPress={() => handleDeclineQuestion(question.id)}
                      >
                        <Text style={[styles.declineButtonText, { color: colors.textSecondary }]}>
                          pass
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAcceptQuestion(question.id)}
                      >
                        <LinearGradient
                          colors={colors.gradientPrimary}
                          style={styles.acceptButtonGradient}
                        >
                          <Text style={styles.acceptButtonText}>accept & chat</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* General Pending Questions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              new questions
            </Text>

            {pendingQuestions.length > 0 ? (
              <View style={[styles.questionsList, { borderColor: colors.border }]}>
                {pendingQuestions.map((question, index) => (
                  <View
                    key={question.id}
                    style={[
                      styles.questionCard,
                      {
                        backgroundColor: colors.surface,
                        borderBottomColor: colors.separator
                      },
                      index === pendingQuestions.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    {/* Question Header */}
                    <View style={styles.questionHeader}>
                      <View style={styles.questionMeta}>
                        <Text style={styles.categoryIcon}>
                          {question.category_icon}
                        </Text>
                        <Text style={[styles.categoryBadge, { color: colors.primary }]}>
                          {question.category}
                        </Text>
                      </View>
                      <View style={styles.timestampRow}>
                        <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                          {getTimeAgo(question.created_at)}
                        </Text>
                      </View>
                    </View>

                    {/* Question Content - Redesigned for better visibility */}
                    <View style={[styles.questionContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.questionLabel, { color: colors.primary }]}>
                        💬 QUESTION:
                      </Text>
                      <Text style={[styles.questionTitle, { color: colors.text }]} numberOfLines={4}>
                        {question.title}
                      </Text>
                      <Text style={[styles.questionPreview, { color: colors.textSecondary }]} numberOfLines={6}>
                        {question.content}
                      </Text>
                      
                      {/* Expandable preview toggle */}
                      <TouchableOpacity 
                        style={styles.readMoreButton}
                        onPress={() => {
                          Alert.alert(
                            'Full Question',
                            question.content,
                            [
                              { text: 'Accept & Chat', onPress: () => handleAcceptQuestion(question.id), style: 'default' },
                              { text: 'Close', onPress: () => {}, style: 'cancel' }
                            ]
                          );
                        }}
                      >
                        <Text style={[styles.readMoreText, { color: colors.primary }]}>
                          Read full question →
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Anonymous Badge */}
                    {question.is_anonymous && (
                      <View style={[styles.anonymousBadge, { backgroundColor: colors.surfaceElevated }]}>
                        <Ionicons name="eye-off-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.anonymousText, { color: colors.textSecondary }]}>
                          anonymous
                        </Text>
                      </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.declineButton, { borderColor: colors.border }]}
                        onPress={() => handleDeclineQuestion(question.id)}
                      >
                        <Text style={[styles.declineButtonText, { color: colors.textSecondary }]}>
                          pass
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.acceptButton}
                        onPress={() => handleAcceptQuestion(question.id)}
                      >
                        <LinearGradient
                          colors={colors.gradientPrimary}
                          style={styles.acceptButtonGradient}
                        >
                          <Text style={styles.acceptButtonText}>accept & chat</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Ionicons name="checkmark-circle-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                  all caught up!
                </Text>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No new questions right now. Check back later.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Stats Card
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

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 12,
  },

  // Questions List
  questionsList: {
    borderWidth: 1,
    borderRadius: 0,
  },
  questionCard: {
    padding: 12, // Reduced from 16
    borderBottomWidth: 1,
  },
  questionContainer: {
    marginVertical: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  questionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Reduced from 12
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  urgencyBadge: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginLeft: 4,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 8,
    lineHeight: 22,
  },
  questionPreview: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 20,
    marginBottom: 12,
  },
  readMoreButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  anonymousBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
    marginBottom: 12,
  },
  anonymousText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginLeft: 4,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
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
  acceptButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: '#FFFFFF',
  },

  // Empty State
  emptyState: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
});

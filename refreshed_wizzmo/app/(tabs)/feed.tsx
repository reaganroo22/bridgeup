import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, TextInput, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserMode } from '../../contexts/UserModeContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import * as supabaseService from '@/lib/supabaseService';
import CustomHeader from '@/components/CustomHeader';
import PaywallManager from '@/components/PaywallManager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeedComment, { Comment } from '@/components/FeedComment';

interface PublicQuestion {
  id: string;
  title: string;
  content?: string;
  category: string;
  category_id: string;
  timeAgo: string;
  upvotes: number;
  downvotes: number;
  emoji: string;
  isUpvoted: boolean;
  isDownvoted: boolean;
  comments: Comment[];
  showComments: boolean;
  showFullContent: boolean;
  created_at: string;
}

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { currentMode } = useUserMode();
  const isWizzmo = currentMode === 'mentor';
  const { user: authUser } = useAuth();
  const { isProUser } = useSubscription();
  const params = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newComments, setNewComments] = useState<{ [key: string]: string }>({});
  const [submittingComments, setSubmittingComments] = useState<{ [key: string]: boolean }>({});
  const [publicQuestions, setPublicQuestions] = useState<PublicQuestion[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);
  const [userVotes, setUserVotes] = useState<{ [key: string]: 'upvote' | 'downvote' | null }>({});
  const [activeFilter, setActiveFilter] = useState<'trending' | 'recent'>('trending');
  const insets = useSafeAreaInsets();

  // Fetch public questions from Supabase
  const fetchPublicQuestions = async (sortBy: 'recent' | 'trending' = 'trending') => {
    try {
      console.log('[Feed] Fetching public questions');
      // If we have a questionId parameter, fetch more questions to ensure we find it
      const limit = params.questionId ? 50 : 12;
      const { data, error } = await supabaseService.getPublicQuestions(limit, sortBy);

      if (error) {
        console.error('[Feed] Error fetching questions:', error);
        return;
      }

      if (data) {
        console.log('[Feed] Raw data from database:', data.length, 'questions');
        console.log('[Feed] First question sample:', data[0] ? { id: data[0].id, title: data[0].title, is_anonymous: data[0].is_anonymous } : 'No questions');
        
        // Transform data to match interface
        const transformedQuestions: PublicQuestion[] = await Promise.all(
          data.map(async (q: any) => {
            // Fetch comments for this question
            const { data: commentsData } = await supabaseService.getFeedComments(q.id);
            // Calculate votes
            const upvotes = q.feed_votes?.filter((v: any) => v.vote_type === 'upvote').length || 0;
            const downvotes = q.feed_votes?.filter((v: any) => v.vote_type === 'downvote').length || 0;

            // Check if current user voted
            const userVote = authUser
              ? q.feed_votes?.find((v: any) => v.user_id === authUser.id)
              : null;

            // Transform comments - simplified approach for now
            const comments: Comment[] = (commentsData || []).map((c: any) => ({
              id: c.id,
              mentorName: c.user?.full_name || c.user?.username || 'anonymous user',
              mentorAvatar: c.user?.avatar_url,
              mentorId: c.user?.id,
              mentorRole: (c.user?.role === 'both' || c.user?.role === 'mentor') ? 'mentor' : 'student',
              text: c.content,
              timestamp: getTimeAgo(c.created_at),
              helpfulCount: c.helpful_votes || 0,
              isHelpful: false, // Simple approach - always start as false
            }));

            return {
              id: q.id,
              title: q.title && q.title.trim() !== ''
                ? q.title
                : q.content?.substring(0, 50) || 'New Question',
              content: q.content,
              category: q.category?.name?.toLowerCase() || 'general',
              category_id: q.category_id,
              emoji: q.category?.icon || '💭',
              timeAgo: getTimeAgo(q.created_at),
              upvotes,
              downvotes,
              isUpvoted: userVote?.vote_type === 'upvote',
              isDownvoted: userVote?.vote_type === 'downvote',
              comments,
              showComments: false,
              showFullContent: true,
              created_at: q.created_at,
            };
          })
        );

        console.log('[Feed] Loaded', transformedQuestions.length, 'questions');
        setPublicQuestions(transformedQuestions);
      }
    } catch (error) {
      console.error('[Feed] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicQuestions(activeFilter);
  }, [activeFilter]);

  // Handle questionId parameter from Active Now navigation
  useEffect(() => {
    if (params.questionId && publicQuestions.length > 0) {
      console.log('[Feed] Auto-expanding question:', params.questionId);
      const questionIndex = publicQuestions.findIndex(q => q.id === params.questionId);
      if (questionIndex !== -1) {
        console.log('[Feed] Found question at index:', questionIndex, 'expanding comments and highlighting');
        // Auto-expand the target question and collapse others for clarity
        setPublicQuestions(prev => prev.map((q, index) => 
          index === questionIndex 
            ? { ...q, showComments: true, showFullContent: true }
            : { ...q, showComments: false }
        ));
        
        // Clear the questionId parameter after handling it
        setTimeout(() => {
          if (params.questionId) {
            router.replace('/(tabs)/feed'); // Remove questionId from URL
          }
        }, 1000);
      } else {
        console.log('[Feed] Question not found in current questions list. Available IDs:', publicQuestions.map(q => q.id).slice(0, 5));
      }
    }
  }, [params.questionId, publicQuestions.length]); // Watch length instead of whole array

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - then.getTime()) / 60000);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const handleUpvote = async (questionId: string) => {
    if (!authUser) {
      Alert.alert('sign in required', 'You must be signed in to vote');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    setPublicQuestions(prev => prev.map(q =>
      q.id === questionId
        ? {
            ...q,
            isUpvoted: !q.isUpvoted,
            isDownvoted: false,
            upvotes: q.isUpvoted ? q.upvotes - 1 : q.upvotes + 1,
            downvotes: q.isDownvoted ? q.downvotes - 1 : q.downvotes
          }
        : q
    ));

    // Update in database
    try {
      await supabaseService.upvoteQuestion(questionId, authUser.id);
    } catch (error) {
      console.error('[Feed] Error voting:', error);
      // Revert on error
      fetchPublicQuestions();
    }
  };

  const handleDownvote = async (questionId: string) => {
    if (!authUser) {
      Alert.alert('sign in required', 'You must be signed in to vote');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update
    setPublicQuestions(prev => prev.map(q =>
      q.id === questionId
        ? {
            ...q,
            isDownvoted: !q.isDownvoted,
            isUpvoted: false,
            downvotes: q.isDownvoted ? q.downvotes - 1 : q.downvotes + 1,
            upvotes: q.isUpvoted ? q.upvotes - 1 : q.upvotes
          }
        : q
    ));

    // Update in database
    try {
      await supabaseService.downvoteQuestion(questionId, authUser.id);
    } catch (error) {
      console.error('[Feed] Error voting:', error);
      // Revert on error
      fetchPublicQuestions();
    }
  };

  const toggleComments = (questionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPublicQuestions(prev => prev.map(q =>
      q.id === questionId
        ? { ...q, showComments: !q.showComments }
        : q
    ));
  };

  const toggleFullContent = (questionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPublicQuestions(prev => prev.map(q =>
      q.id === questionId
        ? { ...q, showFullContent: !q.showFullContent }
        : q
    ));
  };

  const handleHelpfulPress = async (questionId: string, commentId: string) => {
    if (!authUser) {
      Alert.alert('sign in required', 'You must be signed in to mark as helpful');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic update - just increment count and mark as helpful
    setPublicQuestions(prev => prev.map(q =>
      q.id === questionId
        ? {
            ...q,
            comments: q.comments.map(c =>
              c.id === commentId
                ? {
                    ...c,
                    isHelpful: true,
                    helpfulCount: c.helpfulCount + 1
                  }
                : c
            )
          }
        : q
    ));

    // Update in database - simple increment for now
    try {
      await supabaseService.markCommentHelpful(commentId, authUser.id);
      console.log('[Feed] Comment marked helpful successfully');
    } catch (error) {
      console.error('[Feed] Error toggling helpful vote:', error);
      // Revert on error
      fetchPublicQuestions();
    }
  };

  const handleAddComment = async (questionId: string) => {
    const commentText = newComments[questionId]?.trim();
    if (!commentText || !authUser || submittingComments[questionId]) {
      return;
    }

    // Only pro users and mentors can comment
    const isUserPro = isProUser();
    console.log('[Feed] Comment attempt - currentMode:', currentMode, 'isProUser:', isUserPro);
    if (currentMode !== 'mentor' && !isUserPro) {
      console.log('[Feed] Blocking comment - non-mentor without pro');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      console.log('[Feed] Setting showPaywall to true');
      setShowPaywall(true);
      return;
    }
    console.log('[Feed] Allowing comment - user is mentor or pro');

    // Prevent double submission
    setSubmittingComments(prev => ({ ...prev, [questionId]: true }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      console.log('[Feed] Adding comment to question:', questionId);

      // Add comment to database
      const { data: newComment, error } = await supabaseService.addFeedComment(
        questionId,
        authUser.id,
        commentText
      );

      if (error) {
        console.error('[Feed] Error adding comment:', error);
        Alert.alert('error', 'Failed to post comment. Please try again.');
        return;
      }

      // Fetch user profile for comment
      const { data: userProfile } = await supabaseService.getUserProfile(authUser.id);

      // Add comment to UI
      const comment: Comment = {
        id: newComment!.id,
        mentorName: userProfile?.full_name || userProfile?.username || 'you',
        mentorAvatar: userProfile?.avatar_url || undefined,
        mentorId: authUser.id,
        mentorRole: userProfile?.role || 'student',
        text: commentText,
        timestamp: 'just now',
        helpfulCount: 0,
        isHelpful: false,
      };

      setPublicQuestions(prev => prev.map(q =>
        q.id === questionId
          ? { ...q, comments: [...q.comments, comment] }
          : q
      ));

      setNewComments(prev => ({ ...prev, [questionId]: '' }));
    } catch (error) {
      console.error('[Feed] Error:', error);
      Alert.alert('error', 'Something went wrong');
    } finally {
      // Clear submission state
      setSubmittingComments(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPublicQuestions();
    setRefreshing(false);
  };

  const filteredQuestions = publicQuestions.filter(question =>
    question.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    question.category.toLowerCase().includes(searchQuery.toLowerCase())
  );


  if (loading) {
    return (
      <>
        <CustomHeader
          title="trending"
          showBackButton={false}
          showChatButton={true}
          showProfileButton={true}
        />
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 16 }}>loading questions...</Text>
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <CustomHeader
        title="trending"
        showBackButton={false}
        showChatButton={true}
        showProfileButton={true}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 100 }} />

        <ScrollView
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
        {/* Disclaimer */}
        <View style={[styles.disclaimer, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.primary} />
          <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
            mentor advice is private • you can choose to share your question publicly
          </Text>
        </View>


        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={20} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="search questions or topics..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: activeFilter === 'trending' ? colors.primary : 'transparent',
                borderColor: colors.primary
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveFilter('trending');
            }}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.filterText,
              { color: activeFilter === 'trending' ? '#FFFFFF' : colors.primary }
            ]}>
              trending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              {
                backgroundColor: activeFilter === 'recent' ? colors.primary : 'transparent',
                borderColor: colors.primary
              }
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveFilter('recent');
            }}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.filterText,
              { color: activeFilter === 'recent' ? '#FFFFFF' : colors.primary }
            ]}>
              recent
            </Text>
          </TouchableOpacity>
        </View>

        {/* Questions Feed */}
        <View style={styles.feedContainer}>
          {filteredQuestions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Ionicons name="chatbubbles-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                no questions yet
              </Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {currentMode === 'mentor' 
                  ? 'No questions to review right now!'
                  : 'Be the first to ask a question!'}
              </Text>
            </View>
          ) : (
            filteredQuestions.map((question, index) => (
                <TouchableOpacity
                  key={question.id}
                  style={[
                    styles.questionCard,
                    {
                      backgroundColor: '#FFFFFF',
                      borderColor: colors.border
                    }
                  ]}
                  activeOpacity={0.7}
                  onPress={() => toggleFullContent(question.id)}
                >
                  <View style={styles.questionHeader}>
                    <Text style={styles.emoji}>{question.emoji}</Text>
                    <View style={styles.questionMeta}>
                      <Text style={[styles.category, { color: colors.primary }]}>
                        {question.category}
                      </Text>
                      <Text style={[styles.timeAgo, { color: colors.textTertiary }]}>
                        {question.timeAgo} ago
                      </Text>
                    </View>
                  </View>

                  <View>
                    <Text style={[styles.questionTitle, { color: colors.text }]}>
                      {question.title}
                    </Text>
                    {question.showFullContent && question.content && question.content !== question.title && (
                      <Text style={[styles.questionContent, { color: colors.textSecondary }]}>
                        {question.content}
                      </Text>
                    )}
                    {question.content && question.content !== question.title && (
                      <Text style={[styles.expandHint, { color: colors.textTertiary }]}>
                        {question.showFullContent ? 'tap to collapse' : 'tap to read more'}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.questionActions, { backgroundColor: 'transparent' }]}>
                    <View style={[styles.votingContainer, { backgroundColor: 'transparent' }]}>
                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          {
                            backgroundColor: question.isUpvoted
                              ? `${colors.primary}15`
                              : colors.surface,
                            borderColor: question.isUpvoted ? colors.primary : colors.border
                          }
                        ]}
                        onPress={() => handleUpvote(question.id)}
                      >
                        <Ionicons
                          name={question.isUpvoted ? "chevron-up" : "chevron-up-outline"}
                          size={18}
                          color={question.isUpvoted ? colors.primary : colors.textSecondary}
                        />
                        <Text style={[
                          styles.voteText,
                          { color: question.isUpvoted ? colors.text : colors.textSecondary }
                        ]}>
                          {question.upvotes}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          {
                            backgroundColor: question.isDownvoted
                              ? `${colors.danger}15`
                              : colors.surface,
                            borderColor: question.isDownvoted ? colors.danger : colors.border
                          }
                        ]}
                        onPress={() => handleDownvote(question.id)}
                      >
                        <Ionicons
                          name={question.isDownvoted ? "chevron-down" : "chevron-down-outline"}
                          size={18}
                          color={question.isDownvoted ? colors.danger : colors.textSecondary}
                        />
                        <Text style={[
                          styles.voteText,
                          { color: question.isDownvoted ? colors.text : colors.textSecondary }
                        ]}>
                          {question.downvotes}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.helpfulText, { color: colors.textTertiary }]}>
                      {question.isUpvoted ? 'you found this relatable' : question.isDownvoted ? 'you found this unrelatable' : 'tap if relatable or not'}
                    </Text>
                  </View>

                  {/* Comments Section */}
                  <View style={[styles.commentsSection, { backgroundColor: 'transparent', borderTopColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.commentsToggle, { backgroundColor: 'transparent' }]}
                      onPress={() => toggleComments(question.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={question.showComments ? "chatbox" : "chatbox-outline"}
                        size={16}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.commentsCount, { color: colors.textSecondary }]}>
                        {question.comments.length === 0
                          ? 'no mentor advice yet'
                          : question.comments.length === 1
                          ? '1 mentor comment'
                          : `${question.comments.length} mentor comments`
                        }
                      </Text>
                      <Ionicons
                        name={question.showComments ? "chevron-up" : "chevron-down"}
                        size={16}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>

                    {question.showComments && (
                      <View style={[styles.commentsContainer, { backgroundColor: 'transparent' }]}>
                        {question.comments.map((comment, commentIndex) => (
                          <View key={comment.id}>
                            <FeedComment
                              comment={comment}
                              onHelpfulPress={(commentId) => handleHelpfulPress(question.id, commentId)}
                            />
                          </View>
                        ))}

                        {/* Add Comment Input */}
                          <View style={[styles.addCommentContainer, { backgroundColor: 'transparent', borderTopColor: colors.border }]}>
                            <TextInput
                              style={[
                                styles.commentInput,
                                {
                                  backgroundColor: '#FFFFFF',
                                  borderColor: colors.border,
                                  color: colors.text
                                }
                              ]}
                              placeholder="add your advice..."
                              placeholderTextColor={colors.textTertiary}
                              value={newComments[question.id] || ''}
                              onChangeText={(text) => setNewComments(prev => ({ ...prev, [question.id]: text }))}
                              multiline
                              maxLength={500}
                            />
                            <TouchableOpacity
                              style={styles.submitButton}
                              onPress={() => handleAddComment(question.id)}
                              disabled={!newComments[question.id]?.trim() || submittingComments[question.id]}
                              activeOpacity={0.8}
                            >
                              <LinearGradient
                                colors={newComments[question.id]?.trim() && !submittingComments[question.id] ? [colors.primary, colors.primary] : ['#666666', '#666666']}
                                style={styles.submitGradient}
                              >
                                <Text style={styles.submitButtonText}>
                                  {submittingComments[question.id] ? 'posting...' : 'post'}
                                </Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
      </View>

      {/* Paywall Manager with A/B Testing */}
      {console.log('[Feed] Rendering PaywallManager with visible:', showPaywall)}
      <PaywallManager 
        visible={showPaywall} 
        onClose={() => setShowPaywall(false)}
        variant="auto" // Let the system choose the best variant
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 0,
  },
  disclaimerText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  feedContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  questionCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 0,
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 18,
    marginRight: 12,
  },
  questionMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginRight: 8,
  },
  timeAgo: {
    fontSize: 14,
    fontWeight: '500',
  },
  questionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
    marginBottom: 8,
  },
  questionContent: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    marginBottom: 8,
  },
  expandHint: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  questionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  votingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 16,
    minWidth: 50,
    justifyContent: 'center',
  },
  voteText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  helpfulText: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  commentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  commentsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  commentsCount: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    letterSpacing: -0.2,
  },
  commentsContainer: {
    marginTop: 12,
  },
  addCommentContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '400',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    alignSelf: 'flex-end',
  },
  submitGradient: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 0,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 0,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  bottomSpacing: {
    height: 80,
  },
});

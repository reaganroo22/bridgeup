import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CustomHeader from '@/components/CustomHeader';
import NotificationBadge from '@/components/NotificationBadge';
import RatingModal from '@/components/RatingModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMode } from '@/contexts/UserModeContext';
import * as Haptics from 'expo-haptics';
import * as supabaseService from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';
import AdviceScreen from './advice';

interface AdviceSession {
  id: string;
  student_id: string;
  mentor_id: string;
  question_id: string;
  status: 'pending' | 'active' | 'resolved';
  rating?: number;
  feedback?: string;
  created_at: string;
  resolved_at?: string;
  questions?: {
    title: string;
    content: string;
    category_id: string;
    categories?: {
      name: string;
    };
  };
  students?: {
    full_name: string;
    avatar_url?: string;
  };
  messages?: Array<{
    id: string;
    content?: string;
    audio_url?: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
  }>;
}

export default function UnifiedChatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { currentMode } = useUserMode();
  const isWizzmo = currentMode === 'mentor';

  // All hooks must be called before any conditional logic
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedChatForRating, setSelectedChatForRating] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AdviceSession[]>([]);

  // Fetch mentor's advice sessions
  const fetchSessions = useCallback(async () => {
    if (!user || !isWizzmo) return;

    try {
      const { data, error } = await supabase
        .from('advice_sessions')
        .select(`
          *,
          questions (
            title,
            content,
            category_id,
            categories (name)
          ),
          students:users!advice_sessions_student_id_fkey (
            full_name,
            avatar_url
          ),
          messages (
            id,
            content,
            audio_url,
            created_at,
            sender_id,
            is_read
          )
        `)
        .eq('mentor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MentorChats] Error fetching sessions:', error);
        return;
      }

      console.log('[MentorChats] Fetched sessions:', data?.length);
      console.log('[MentorChats] Session statuses:', data?.map(s => ({ id: s.id.slice(0, 8), status: s.status })));
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  }, [user, isWizzmo]);

  useEffect(() => {
    if (!isWizzmo) return;
    
    const loadData = async () => {
      setLoading(true);
      await fetchSessions();
      setLoading(false);
    };

    loadData();
  }, [user, isWizzmo, fetchSessions]);

  // Refetch data when screen comes into focus (after returning from chat)
  useFocusEffect(
    useCallback(() => {
      if (!isWizzmo) return;
      
      console.log('[MentorChats] Screen focused, refetching sessions...');
      if (user) {
        // Small delay to ensure any database transactions have completed
        setTimeout(() => {
          console.log('[MentorChats] Executing delayed refetch...');
          fetchSessions();
        }, 100);
      }
    }, [user, isWizzmo, fetchSessions])
  );

  // Real-time subscription for session updates
  useEffect(() => {
    if (!user || !isWizzmo) return;

    const channel = supabase
      .channel('mentor_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advice_sessions',
          filter: `mentor_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[MentorChats] Real-time update received:', payload.eventType, 'for session:', payload.new?.id?.slice(0, 8));
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isWizzmo, fetchSessions]);

  // For students, render the advice screen directly
  if (!isWizzmo) {
    return <AdviceScreen />;
  }

  const handleOpenRating = (chatId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedChatForRating(chatId);
    setShowRatingModal(true);
  };

  const handleRatingSubmit = async (rating: number, feedback: string) => {
    if (!selectedChatForRating) return;

    try {
      // Update session with rating (from mentor perspective)
      const { error } = await supabase
        .from('advice_sessions')
        .update({ rating, feedback })
        .eq('id', selectedChatForRating);

      if (error) {
        console.error('Error submitting rating:', error);
        return;
      }

      setShowRatingModal(false);
      setSelectedChatForRating(null);

      // Show success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Refresh sessions
      fetchSessions();
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSessions();
    setRefreshing(false);
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < rating ? 'star' : 'star-outline'}
        size={14}
        color={i < rating ? '#FFD700' : colors.textTertiary}
      />
    ));
  };

  // Calculate unread count for a session
  const getUnreadCount = (session: AdviceSession) => {
    if (!session.messages) return 0;
    return session.messages.filter(m => m.sender_id !== user?.id && !m.is_read).length;
  };

  // Get last message for a session
  const getLastMessage = (session: AdviceSession) => {
    if (!session.messages || session.messages.length === 0) return null;
    const sorted = [...session.messages].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0];
  };

  // Filter sessions by status
  const activeSessions = sessions.filter(s => s.status === 'active');
  const resolvedSessions = sessions.filter(s => s.status === 'resolved');

  console.log('[MentorChats] Filtered - Active:', activeSessions.length, 'Resolved:', resolvedSessions.length);

  if (loading) {
    return (
      <>
        <CustomHeader
          title="my chats"
          showBackButton={false}
          showChatButton={false}
          showProfileButton={true}
        />
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <CustomHeader
        title="my chats"
        showBackButton={false}
        showChatButton={false}
        showProfileButton={true}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={{ height: insets.top + 100 }} />
        <View style={[styles.content, { backgroundColor: colors.background }]}>

          {/* Active Chats Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                active chats
              </Text>
              <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                {activeSessions.length}
              </Text>
            </View>

            {activeSessions.length > 0 ? (
              <View style={[styles.chatsList, { borderColor: colors.border }]}>
                {activeSessions.map((session, index) => {
                  const lastMessage = getLastMessage(session);
                  const unreadCount = getUnreadCount(session);
                  const categoryName = session.questions?.categories?.name || 'chat';
                  const questionTitle = session.questions?.title || 'Question';
                  const studentName = session.students?.full_name || 'User';

                  return (
                    <TouchableOpacity
                      key={session.id}
                      style={[
                        styles.chatItem,
                        { borderBottomColor: colors.separator },
                        index === activeSessions.length - 1 && { borderBottomWidth: 0 },
                      ]}
                      onPress={() => router.push(`/chat?chatId=${session.id}`)}
                    >
                      <View style={styles.chatContent}>
                        {/* Header */}
                        <View style={styles.chatHeader}>
                          <Text style={[styles.categoryBadge, { color: colors.primary }]}>
                            {categoryName}
                          </Text>
                        </View>

                        {/* Question Title */}
                        <Text style={[styles.chatTitle, { color: colors.text }]} numberOfLines={1}>
                          {questionTitle}
                        </Text>

                        {/* Last Message */}
                        <Text style={[styles.chatPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                          {lastMessage
                            ? (lastMessage.audio_url ? '🎤 voice message' : lastMessage.content)
                            : 'no messages yet'
                          }
                        </Text>
                      </View>

                      {/* Meta */}
                      <View style={styles.chatMeta}>
                        {unreadCount > 0 && (
                          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.unreadText}>{unreadCount}</Text>
                          </View>
                        )}
                        <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                          {lastMessage
                            ? getTimeAgo(lastMessage.created_at)
                            : getTimeAgo(session.created_at)
                          }
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No active chats. Check your inbox for new questions!
                </Text>
              </View>
            )}
          </View>

          {/* Resolved Chats Section */}
          {resolvedSessions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  resolved
                </Text>
                <Text style={[styles.sectionCount, { color: colors.textSecondary }]}>
                  {resolvedSessions.length}
                </Text>
              </View>

              <View style={[styles.resolvedList, { borderColor: colors.border }]}>
                {resolvedSessions.map((session, index) => {
                  const categoryName = session.questions?.categories?.name || 'chat';
                  const questionTitle = session.questions?.title || 'Question';
                  const studentName = session.students?.full_name || 'User';

                  return (
                    <View
                      key={session.id}
                      style={[
                        styles.resolvedItem,
                        { borderBottomColor: colors.separator },
                        index === resolvedSessions.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.resolvedMainContent}
                        onPress={() => router.push(`/chat?chatId=${session.id}`)}
                      >
                        <View style={styles.resolvedContent}>
                          <Text style={[styles.resolvedTitle, { color: colors.text }]} numberOfLines={1}>
                            {questionTitle}
                          </Text>
                          <View style={styles.resolvedMeta}>
                            <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                              {categoryName}
                            </Text>
                            {session.rating && (
                              <View style={styles.ratingContainer}>
                                {renderStars(session.rating)}
                              </View>
                            )}
                          </View>
                        </View>

                        <View style={styles.resolvedRight}>
                          {session.rating && (
                            <View style={[styles.helpfulBadge, { backgroundColor: colors.surfaceElevated }]}>
                              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                            </View>
                          )}
                          <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                            {getTimeAgo(session.created_at)}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Rate Session Button (if not rated) */}
                      {!session.rating && (
                        <TouchableOpacity
                          style={[styles.rateButton, { borderTopColor: colors.separator }]}
                          onPress={() => handleOpenRating(session.id)}
                        >
                          <Ionicons name="star-outline" size={16} color={colors.primary} />
                          <Text style={[styles.rateButtonText, { color: colors.primary }]}>
                            rate this session
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <RatingModal
        visible={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setSelectedChatForRating(null);
        }}
        onSubmit={handleRatingSubmit}
        wizzmoName={
          selectedChatForRating
            ? sessions.find(s => s.id === selectedChatForRating)?.students?.full_name || 'student'
            : 'user'
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerButton: {
    padding: 8,
  },
  iconWithBadge: {
    position: 'relative',
    backgroundColor: 'transparent',
  },
  badgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Chats List
  chatsList: {
    borderWidth: 1,
    borderRadius: 0,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  chatPreview: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  chatMeta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Resolved List
  resolvedList: {
    borderWidth: 1,
    borderRadius: 0,
  },
  resolvedItem: {
    borderBottomWidth: 1,
  },
  resolvedMainContent: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  resolvedContent: {
    flex: 1,
  },
  resolvedTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  resolvedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  resolvedRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  helpfulBadge: {
    padding: 4,
    borderRadius: 0,
  },

  // Rate Button
  rateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    borderTopWidth: 1,
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  // Empty State
  emptyState: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
});

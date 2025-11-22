import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CustomHeader from '@/components/CustomHeader';
import NotificationBadge from '@/components/NotificationBadge';
import RatingModal from '@/components/RatingModal';
import ModeToggle from '@/components/ModeToggle';
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
  const isAdvisor = currentMode === 'mentor';

  // All hooks must be called before any conditional logic
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedChatForRating, setSelectedChatForRating] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AdviceSession[]>([]);

  // Fetch mentor's advice sessions
  const fetchSessions = useCallback(async () => {
    if (!user || !isAdvisor) return;

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
  }, [user, isAdvisor]);

  useEffect(() => {
    if (!isAdvisor) return;
    
    const loadData = async () => {
      setLoading(true);
      await fetchSessions();
      setLoading(false);
    };

    loadData();
  }, [user, isAdvisor, fetchSessions]);

  // Refetch data when screen comes into focus (after returning from chat)
  useFocusEffect(
    useCallback(() => {
      if (!isAdvisor) return;
      
      console.log('[MentorChats] Screen focused, refetching sessions...');
      if (user) {
        // Small delay to ensure any database transactions have completed
        setTimeout(async () => {
          console.log('[MentorChats] Executing delayed refetch...');
          fetchSessions();
          
          // Force another refresh after a bit to catch any read status updates
          setTimeout(() => {
            console.log('[MentorChats] Secondary refetch for read status...');
            fetchSessions();
          }, 2000);
        }, 100);
      }
    }, [user, isAdvisor, fetchSessions])
  );

  // Real-time subscription for session and message updates
  useEffect(() => {
    if (!user || !isAdvisor) return;

    console.log('[MentorChats] 📡 Setting up real-time subscriptions for mentor:', user.id.slice(0, 8));

    const sessionsChannel = supabase
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
          console.log('[MentorChats] 🔄 Session update received:', payload.eventType, 'for session:', payload.new?.id?.slice(0, 8));
          setTimeout(() => fetchSessions(), 100);
        }
      )
      .subscribe((status) => {
        console.log('[MentorChats] Sessions subscription status:', status);
      });

    // Also listen for new messages in any of the mentor's sessions
    const messagesChannel = supabase
      .channel('mentor_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('[MentorChats] 💬 New message received:', payload.new?.id?.slice(0, 8));
          
          // Check if this message is in one of our sessions
          const messageSessionId = payload.new?.advice_session_id;
          if (messageSessionId) {
            const { data: session } = await supabase
              .from('advice_sessions')
              .select('mentor_id')
              .eq('id', messageSessionId)
              .eq('mentor_id', user.id)
              .single();
            
            if (session) {
              console.log('[MentorChats] 📨 Message is for our session, refreshing...');
              setTimeout(() => fetchSessions(), 100);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[MentorChats] Messages subscription status:', status);
      });

    return () => {
      console.log('[MentorChats] 🧹 Cleaning up real-time subscriptions');
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user, isAdvisor, fetchSessions]);

  // For students, render the advice screen directly
  if (!isAdvisor) {
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

  // Filter and sort sessions by status and most recent activity
  const sortSessionsByRecentActivity = (sessionList: AdviceSession[]) => {
    return sessionList.sort((a, b) => {
      const aLastMessage = getLastMessage(a);
      const bLastMessage = getLastMessage(b);
      
      const aTimestamp = aLastMessage ? aLastMessage.created_at : a.created_at;
      const bTimestamp = bLastMessage ? bLastMessage.created_at : b.created_at;
      
      return new Date(bTimestamp).getTime() - new Date(aTimestamp).getTime();
    });
  };

  const activeSessions = sortSessionsByRecentActivity(sessions.filter(s => s.status === 'active'));
  const resolvedSessions = sortSessionsByRecentActivity(sessions.filter(s => s.status === 'resolved'));

  console.log('[MentorChats] Filtered - Active:', activeSessions.length, 'Resolved:', resolvedSessions.length);

  if (loading) {
    return (
      <>
        <CustomHeader
          title="my chats"
          showBackButton={false}
          showChatButton={false}
          showProfileButton={true}
          rightActions={
            <>
              <ModeToggle showText={false} />
            </>
          }
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
        rightActions={
          <>
            <ModeToggle showText={false} />
          </>
        }
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
              <View style={styles.chatsList}>
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
                        { 
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                          shadowColor: colors.text,
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        },
                        index < activeSessions.length - 1 && { marginBottom: 8 },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/chat?chatId=${session.id}`);
                      }}
                      activeOpacity={0.8}
                    >
                      {/* Left side with avatar */}
                      <View style={styles.chatLeft}>
                        <Image
                          source={{
                            uri: session.students?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=FF4DB8&color=fff&size=128`
                          }}
                          style={styles.studentAvatar}
                        />
                        {unreadCount > 0 && (
                          <View style={[styles.unreadIndicator, { backgroundColor: colors.primary }]} />
                        )}
                      </View>

                      {/* Main content */}
                      <View style={styles.chatContent}>
                        <View style={styles.chatHeader}>
                          <View style={styles.chatTitleRow}>
                            <Text style={[styles.studentName, { color: colors.text }]} numberOfLines={1}>
                              {studentName}
                            </Text>
                            <View style={[styles.categoryPill, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                              <Text style={[styles.categoryText, { color: colors.primary }]}>
                                {categoryName}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                            {lastMessage
                              ? getTimeAgo(lastMessage.created_at)
                              : getTimeAgo(session.created_at)
                            }
                          </Text>
                        </View>

                        <Text style={[styles.questionTitle, { color: colors.text }]} numberOfLines={2}>
                          {questionTitle}
                        </Text>
                        
                        {session.questions?.content && (
                          <Text style={[styles.questionContent, { color: colors.textSecondary }]} numberOfLines={3}>
                            {session.questions.content}
                          </Text>
                        )}

                        <View style={styles.lastMessageRow}>
                          {lastMessage?.audio_url ? (
                            <View style={styles.audioMessageRow}>
                              <Ionicons name="mic" size={14} color={colors.primary} />
                              <Text style={[styles.audioMessageText, { color: colors.textSecondary }]}>
                                Voice message
                              </Text>
                            </View>
                          ) : (
                            <Text style={[styles.lastMessageText, { color: lastMessage ? colors.text : colors.textSecondary }]} numberOfLines={1}>
                              {lastMessage?.content || 'No messages yet'}
                            </Text>
                          )}
                        </View>
                      </View>

                      {/* Right side with indicators */}
                      <View style={styles.chatRight}>
                        {unreadCount > 0 && (
                          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.unreadText}>
                              {unreadCount > 99 ? '99+' : unreadCount.toString()}
                            </Text>
                          </View>
                        )}
                        <Ionicons 
                          name="chevron-forward" 
                          size={16} 
                          color={colors.textSecondary} 
                          style={{ marginTop: 4 }}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
                <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                  No active chats
                </Text>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  New questions will appear here when students ask for advice
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
                          <Text style={[styles.resolvedTitle, { color: colors.text }]} numberOfLines={2}>
                            {questionTitle}
                          </Text>
                          {session.questions?.content && (
                            <Text style={[styles.resolvedQuestionContent, { color: colors.textSecondary }]} numberOfLines={2}>
                              {session.questions.content}
                            </Text>
                          )}
                          <View style={styles.resolvedMeta}>
                            <Text style={[styles.resolvedCategoryText, { color: colors.textSecondary }]}>
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
    gap: 0,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  
  // Left section with avatar
  chatLeft: {
    position: 'relative',
    marginRight: 12,
  },
  studentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
  },
  unreadIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  
  // Main content area
  chatContent: {
    flex: 1,
    gap: 4,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 2,
  },
  chatTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
  questionTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
    lineHeight: 20,
  },
  questionContent: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    marginBottom: 6,
    lineHeight: 18,
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  audioMessageText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  lastMessageText: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  
  // Right section with indicators
  chatRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
    minHeight: 48,
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
    marginBottom: 4,
  },
  resolvedQuestionContent: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    marginBottom: 8,
    lineHeight: 18,
  },
  resolvedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resolvedCategoryText: {
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
    borderRadius: 12,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginVertical: 8,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    textAlign: 'center',
    lineHeight: 20,
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, ActivityIndicator, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '../../contexts/AuthContext';
import CustomHeader from '@/components/CustomHeader';
import WizzmoIntroCard from '@/components/WizzmoIntroCard';
import ModeToggle from '@/components/ModeToggle';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import * as supabaseService from '../../lib/supabaseService';
import * as Haptics from 'expo-haptics';

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
  mentors?: {
    id: string;
    full_name: string;
    avatar_url: string;
    university?: string;
    bio?: string;
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

export default function AdviceScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [sessions, setSessions] = useState<AdviceSession[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWizzmoIntro, setShowWizzmoIntro] = useState(false);
  const [newActiveSession, setNewActiveSession] = useState<AdviceSession | null>(null);
  const [wizzmoProfile, setWizzmoProfile] = useState<any>(null);

  // Fetch user's advice sessions
  const fetchSessions = async () => {
    if (!user) return;

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
          mentors:users!advice_sessions_mentor_id_fkey (
            id,
            full_name,
            avatar_url,
            university,
            bio
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
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      console.log('[AdviceScreen] Fetched sessions:', data?.length);
      console.log('[AdviceScreen] Session statuses:', data?.map(s => ({ id: s.id.slice(0, 8), status: s.status })));
      console.log('[AdviceScreen] Session details:', data?.map(s => ({ 
        id: s.id.slice(0, 8), 
        status: s.status, 
        student_id: s.student_id?.slice(0, 8),
        question_title: s.questions?.title 
      })));
      const validSessions = (data || []).filter(s => s.student_id) as AdviceSession[];
      setSessions(validSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Fetch pending questions (not yet matched with a mentor)
  const fetchPendingQuestions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          categories (name)
        `)
        .eq('student_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending questions:', error);
        return;
      }

      setPendingQuestions(data || []);
    } catch (error) {
      console.error('Error fetching pending questions:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([fetchSessions(), fetchPendingQuestions()]);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAllData();
  }, [user]);

  // Refetch data when screen comes into focus (after returning from chat)
  useFocusEffect(
    useCallback(() => {
      console.log('[AdviceScreen] Screen focused, refetching sessions...');
      if (user) {
        // Small delay to ensure any database transactions have completed
        setTimeout(() => {
          console.log('[AdviceScreen] Executing delayed refetch...');
          fetchSessions();
          // Force another refresh after a bit to catch any read status updates
          setTimeout(() => {
            console.log('[AdviceScreen] Secondary refetch for read status...');
            fetchSessions();
          }, 2000);
        }, 1000);
      }
    }, [user])
  );

  // Real-time subscription for session updates
  useEffect(() => {
    if (!user) return;

    const sessionsChannel = supabase
      .channel('advice_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'advice_sessions',
          filter: `student_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('[AdviceScreen] Real-time update received:', payload.eventType, 'for session:', payload.new?.id?.slice(0, 8));
          
          // Check if this is a session becoming active (mentor accepted)
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'active' && payload.old?.status === 'pending') {
            console.log('[AdviceScreen] Session became active, showing Wizzmo intro');
            
            // Fetch the full session with mentor details
            try {
              const { data: sessionData } = await supabase
                .from('advice_sessions')
                .select(`
                  *,
                  questions (
                    title,
                    content,
                    category_id,
                    categories (name)
                  ),
                  mentors:users!advice_sessions_mentor_id_fkey (
                    id,
                    full_name,
                    avatar_url,
                    university,
                    major,
                    year,
                    bio,
                    expertise
                  )
                `)
                .eq('id', payload.new.id)
                .single();

              if (sessionData && sessionData.mentors) {
                // Fetch mentor stats
                const { data: statsData } = await supabaseService.getMentorStats(sessionData.mentor_id);
                
                const wizzmoData = {
                  ...sessionData.mentors,
                  questions_answered: statsData?.questions_answered || 0,
                  average_rating: statsData?.average_rating || 0,
                  helpful_votes: statsData?.helpful_votes || 0,
                };

                setNewActiveSession(sessionData);
                setWizzmoProfile(wizzmoData);
                setShowWizzmoIntro(true);
              }
            } catch (error) {
              console.error('[AdviceScreen] Error fetching session/mentor data:', error);
            }
          }
          
          fetchSessions();
        }
      )
      .subscribe();

    const questionsChannel = supabase
      .channel('questions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
          filter: `student_id=eq.${user.id}`,
        },
        () => {
          fetchPendingQuestions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(questionsChannel);
    };
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAllData();
  };

  const handleWizzmoIntroClose = () => {
    setShowWizzmoIntro(false);
    setNewActiveSession(null);
    setWizzmoProfile(null);
    
    // Navigate to the chat if we have a session
    if (newActiveSession) {
      router.push(`/chat?chatId=${newActiveSession.id}`);
    }
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

  // Helper function to get time ago
  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
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
  const pendingSessions = sortSessionsByRecentActivity(sessions.filter(s => s.status === 'pending'));
  const resolvedSessions = sortSessionsByRecentActivity(sessions.filter(s => s.status === 'resolved'));

  console.log('[AdviceScreen] Filtered - Active:', activeSessions.length, 'Pending:', pendingSessions.length, 'Resolved:', resolvedSessions.length);

  if (loading) {
    return (
      <>
        <CustomHeader
          title="chats"
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
        title="chats"
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
        {/* Active Chats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            active
          </Text>

          {activeSessions.length > 0 ? (
            <View style={styles.chatsList}>
              {activeSessions.map((session, index) => {
                const lastMessage = getLastMessage(session);
                const unreadCount = getUnreadCount(session);
                const categoryName = session.questions?.categories?.name || 'chat';
                const questionTitle = session.questions?.title || 'Question';

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
                    {/* Left side with mentor avatar */}
                    <View style={styles.chatLeft}>
                      <Image
                        source={{
                          uri: session.mentors?.avatar_url || `https://ui-avatars.com/api/?name=Mentor&background=FF4DB8&color=fff&size=128`
                        }}
                        style={styles.mentorAvatar}
                      />
                      {unreadCount > 0 && (
                        <View style={[styles.unreadIndicator, { backgroundColor: colors.primary }]} />
                      )}
                    </View>

                    {/* Main content */}
                    <View style={styles.chatContent}>
                      <View style={styles.chatHeader}>
                        <View style={styles.chatTitleRow}>
                          <Text style={[styles.mentorName, { color: colors.text }]} numberOfLines={1}>
                            {session.mentors?.full_name || 'Your Mentor'}
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

                      <Text style={[styles.questionPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                        {questionTitle}
                      </Text>

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
            <View style={[styles.emptyState, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                no active chats
              </Text>
              <TouchableOpacity
                style={styles.askButton}
                onPress={() => router.push('/(tabs)/ask')}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.askButtonGradient}
                >
                  <Text style={[styles.askButtonText, { color: '#FFFFFF' }]}>ask a question</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Pending Questions */}
        {pendingQuestions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              pending
            </Text>

            <View style={styles.chatsList}>
              {pendingQuestions.map((question, index) => {
                const questionTitle = question.title && question.title.trim() !== ''
                  ? question.title
                  : question.content?.substring(0, 50) || 'New Question';
                const categoryName = question.categories?.name || 'General';

                return (
                  <View
                    key={question.id}
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
                      index < pendingQuestions.length - 1 && { marginBottom: 8 },
                    ]}
                  >
                    <View style={styles.chatContent}>
                      <Text style={[styles.mentorName, { color: colors.text }]} numberOfLines={1}>
                        {categoryName}
                      </Text>
                      <Text style={[styles.questionPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                        {questionTitle}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colors.warning }]}>
                      <Text style={styles.statusText}>pending</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Resolved */}
        {resolvedSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              resolved
            </Text>

            <View style={styles.chatsList}>
              {resolvedSessions.map((session, index) => {
                const questionTitle = session.questions?.title && session.questions.title.trim() !== ''
                  ? session.questions.title
                  : session.questions?.content?.substring(0, 50) || 'Chat Session';
                const categoryName = session.questions?.categories?.name || 'General';

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
                      index < resolvedSessions.length - 1 && { marginBottom: 8 },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/chat?chatId=${session.id}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.chatContent}>
                      <Text style={[styles.mentorName, { color: colors.text }]} numberOfLines={1}>
                        {questionTitle}
                      </Text>
                      <Text style={[styles.questionPreview, { color: colors.textSecondary }]}>
                        {categoryName}{session.rating ? ` • ${session.rating} stars` : ''}
                      </Text>
                    </View>
                    <View style={styles.chatRight}>
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
          </View>
        )}
        </View>
      </ScrollView>

      {/* Wizzmo Introduction Card */}
      {showWizzmoIntro && wizzmoProfile && (
        <WizzmoIntroCard
          visible={showWizzmoIntro}
          onClose={handleWizzmoIntroClose}
          wizzmo={wizzmoProfile}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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

  // Chat List
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
  
  // Left section with mentor avatar
  chatLeft: {
    position: 'relative',
    marginRight: 12,
  },
  mentorAvatar: {
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
  mentorName: {
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
  questionPreview: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginBottom: 2,
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
    letterSpacing: -0.1,
  },

  // Empty State
  emptyState: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  askButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  askButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  askButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },


  // Status Badge
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
});

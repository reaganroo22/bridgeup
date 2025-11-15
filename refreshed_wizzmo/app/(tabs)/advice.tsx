import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useAuth } from '../../contexts/AuthContext';
import CustomHeader from '@/components/CustomHeader';
import WizzmoIntroCard from '@/components/WizzmoIntroCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import * as supabaseService from '../../lib/supabaseService';

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

  // Filter sessions by status
  const activeSessions = sessions.filter(s => s.status === 'active');
  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const resolvedSessions = sessions.filter(s => s.status === 'resolved');

  console.log('[AdviceScreen] Filtered - Active:', activeSessions.length, 'Pending:', pendingSessions.length, 'Resolved:', resolvedSessions.length);

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

  if (loading) {
    return (
      <>
        <CustomHeader
          title="chats"
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
        title="chats"
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
        {/* Active Chats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            active
          </Text>

          {activeSessions.length > 0 ? (
            <View style={[styles.chatsList, { borderColor: colors.border }]}>
              {activeSessions.map((session, index) => {
                const lastMessage = getLastMessage(session);
                const unreadCount = getUnreadCount(session);
                const categoryName = session.questions?.categories?.name || 'chat';

                return (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.chatItem,
                      { borderBottomColor: colors.separator },
                      index === activeSessions.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => {
                      router.push(`/chat?chatId=${session.id}`);
                    }}
                  >
                    <View style={styles.chatContent}>
                      <Text style={[styles.chatTitle, { color: colors.text }]}>
                        {categoryName}
                      </Text>
                      <Text style={[styles.chatPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                        {lastMessage
                          ? (lastMessage.audio_url ? '🎤 voice message' : lastMessage.content)
                          : 'new chat'
                        }
                      </Text>
                    </View>

                    <View style={styles.chatMeta}>
                      {unreadCount > 0 && (
                        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                      )}
                      <Text style={[styles.timestamp, { color: colors.textTertiary }]}>
                        {lastMessage
                          ? new Date(lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'now'
                        }
                      </Text>
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

            <View style={[styles.chatsList, { borderColor: colors.border }]}>
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
                      { borderBottomColor: colors.separator },
                      index === pendingQuestions.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={styles.chatContent}>
                      <Text style={[styles.chatTitle, { color: colors.text }]} numberOfLines={1}>
                        {categoryName}
                      </Text>
                      <Text style={[styles.chatPreview, { color: colors.textSecondary }]} numberOfLines={1}>
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

            <View style={[styles.resolvedList, { borderColor: colors.border }]}>
              {resolvedSessions.map((session, index) => {
                const questionTitle = session.questions?.title && session.questions.title.trim() !== ''
                  ? session.questions.title
                  : session.questions?.content?.substring(0, 50) || 'Chat Session';
                const categoryName = session.questions?.categories?.name || 'General';

                return (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.resolvedItem,
                      { borderBottomColor: colors.separator },
                      index === resolvedSessions.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => {
                      router.push(`/chat?chatId=${session.id}`);
                    }}
                  >
                    <View style={styles.resolvedContent}>
                      <Text style={[styles.resolvedTitle, { color: colors.text }]} numberOfLines={1}>
                        {questionTitle}
                      </Text>
                      <Text style={[styles.resolvedMeta, { color: colors.textSecondary }]}>
                        {categoryName}{session.rating ? ` • ${session.rating} stars` : ''}
                      </Text>
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
    borderWidth: 1,
    borderRadius: 0,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  chatContent: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  chatPreview: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    borderWidth: 1,
    borderRadius: 0,
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
    borderRadius: 0,
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

  // Resolved List
  resolvedList: {
    borderWidth: 1,
    borderRadius: 0,
  },
  resolvedItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  resolvedContent: {
    flex: 1,
  },
  resolvedTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  resolvedMeta: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
});

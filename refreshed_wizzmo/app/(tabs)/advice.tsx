import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, ActivityIndicator, Image, Animated, Modal, Alert } from 'react-native';
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
import StudentResolutionModal from '@/components/StudentResolutionModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import * as supabaseService from '../../lib/supabaseService';
import * as Haptics from 'expo-haptics';
import { getInitials, getColorFromString } from '@/lib/avatarUtils';

interface AdviceSession {
  id: string;
  student_id: string;
  mentor_id: string;
  question_id: string;
  status: 'pending' | 'assigned' | 'active' | 'resolved';
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'assigned' | 'pending' | 'unrated' | 'resolved'>('all');
  const [newActiveSession, setNewActiveSession] = useState<AdviceSession | null>(null);
  const [wizzmoProfile, setWizzmoProfile] = useState<any>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<AdviceSession | null>(null);

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
            status,
            preferred_mentor_id,
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
        .neq('status', 'deleted') // Exclude any sessions that might be marked as deleted
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sessions:', error);
        return;
      }

      console.log('[AdviceScreen] ✅ Fetched sessions:', data?.length);
      console.log('[AdviceScreen] Session details:', data?.map(s => ({ 
        id: s.id.slice(0, 8), 
        status: s.status,
        questionTitle: s.questions?.title,
        mentorName: s.mentors?.full_name,
        createdAt: s.created_at 
      })));
      
      // Log pending/assigned sessions specifically
      const assignedSessions = data?.filter(s => s.status === 'pending' || s.status === 'assigned') || [];
      if (assignedSessions.length > 0) {
        console.log('[AdviceScreen] 🟡 Found assigned sessions:', assignedSessions.length);
        assignedSessions.forEach(s => console.log(`  - ${s.id.slice(0, 8)}: ${s.questions?.title} -> ${s.mentors?.full_name || 'NULL'} (${s.status}) mentor_id: ${s.mentor_id || 'NULL'}`));
      }
      
      const validSessions = (data || []).filter(s => s.student_id) as AdviceSession[];
      
      // Deduplicate sessions by ID (same logic as AppContext)
      const uniqueSessions = Array.from(new Map(validSessions.map(s => [s.id, s])).values());
      
      console.log('[AdviceScreen] Sessions fetched:', validSessions.length, 'raw, deduplicated to:', uniqueSessions.length);
      if (validSessions.length > 0) {
        console.log('[AdviceScreen] First session details:', {
          id: validSessions[0].id?.slice(0, 8),
          status: validSessions[0].status,
          questionTitle: validSessions[0].questions?.title,
          questionContent: validSessions[0].questions?.content,
          categoryName: validSessions[0].questions?.categories?.name,
          hasQuestionData: !!validSessions[0].questions
        });
      }
      
      setSessions(uniqueSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Fetch pending questions (not yet matched with a mentor)
  const fetchPendingQuestions = async () => {
    if (!user) return;

    try {
      console.log('[AdviceScreen] Fetching pending questions for user:', user.id);
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

      console.log('[AdviceScreen] Pending questions fetched:', data?.length, 'questions');
      console.log('[AdviceScreen] First question preview:', data?.[0] ? {
        id: data[0].id?.slice(0, 8),
        title: data[0].title?.slice(0, 30),
        content: data[0].content?.slice(0, 50)
      } : 'none');
      
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
          if (payload.eventType === 'UPDATE' && payload.new?.status === 'active' && (payload.old?.status === 'pending' || payload.old?.status === 'assigned')) {
            console.log('[AdviceScreen] 🔄 Session became active!', {
              sessionId: payload.new?.id?.slice(0, 8),
              oldStatus: payload.old?.status,
              newStatus: payload.new?.status,
              mentorId: payload.new?.mentor_id?.slice(0, 8)
            });
            
            // Immediately refresh sessions to update UI
            console.log('[AdviceScreen] 🔃 Refreshing sessions after status change...');
            fetchSessions();
            
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
                    status,
                    preferred_mentor_id,
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

  const handleResolutionSubmit = async (rating: number, feedback: string) => {
    if (!selectedSession || !user) return;
    
    try {
      console.log('[AdviceScreen] Student submitting resolution for session:', selectedSession.id, 'Rating:', rating);
      
      // Update session with student's resolution data
      const { error, data } = await supabase
        .from('advice_sessions')
        .update({ 
          rating: rating, 
          feedback: feedback,
          student_resolved_at: new Date().toISOString() 
        })
        .eq('id', selectedSession.id)
        .select();

      if (error) {
        console.error('[AdviceScreen] Error updating session with rating:', error);
        Alert.alert('Error', 'Failed to submit rating. Please try again.');
        return;
      }

      console.log('[AdviceScreen] ✅ Session rating submitted successfully:', data);
      
      // Update the local session state immediately to prevent UI lag
      const updatedSession = data[0];
      if (updatedSession) {
        setSessions(prevSessions => 
          prevSessions.map(session => 
            session.id === updatedSession.id 
              ? { ...session, rating: updatedSession.rating, student_resolved_at: updatedSession.student_resolved_at }
              : session
          )
        );
      }
      
      // Close modal
      setShowResolutionModal(false);
      setSelectedSession(null);
      
      // Also refresh from database to be sure
      await fetchSessions();
      
      console.log('[AdviceScreen] Session state updated and refreshed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
    } catch (error) {
      console.error('[AdviceScreen] Error in resolution submission:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
  
  // Add resolved sessions (using profile.tsx pattern)
  const resolvedSessions = sortSessionsByRecentActivity(sessions.filter(s => s.status === 'resolved'));
  
  // Filter out assigned/pending sessions that have an active session for the same question
  const activeQuestionIds = new Set(activeSessions.map(s => s.question_id).filter(Boolean));
  const assignedSessions = sortSessionsByRecentActivity(
    sessions.filter(s => {
      const isPendingOrAssigned = s.status === 'pending' || s.status === 'assigned';
      const hasActiveVersion = s.question_id && activeQuestionIds.has(s.question_id);
      
      if (isPendingOrAssigned && hasActiveVersion) {
        console.log('[AdviceScreen] 🚫 Hiding orphaned session:', s.id.slice(0, 8), 'because active session exists for question:', s.question_id?.slice(0, 8));
        return false; // Hide this session
      }
      
      return isPendingOrAssigned; // Show if pending/assigned and no active version
    })
  );
  
  // State for mentor counts for multi-mentor questions
  const [mentorCounts, setMentorCounts] = useState<{ [questionId: string]: number }>({});
  
  // Fetch mentor counts for multi-mentor questions
  useEffect(() => {
    const fetchMentorCounts = async () => {
      const multiMentorQuestions = assignedSessions.filter(session => 
        session.mentor_id === null && (session.status === 'assigned' || session.status === 'pending')
      );
      
      if (multiMentorQuestions.length > 0) {
        const counts: { [questionId: string]: number } = {};
        
        for (const session of multiMentorQuestions) {
          if (session.question_id) {
            const { data, error } = await supabase
              .from('question_mentor_assignments')
              .select('mentor_id')
              .eq('question_id', session.question_id);
            
            if (error) {
              console.error('[AdviceScreen] Error fetching mentor assignments:', error);
            } else {
              // Remove duplicates by using Set
              const uniqueMentorIds = Array.from(new Set(data?.map(item => item.mentor_id) || []));
              counts[session.question_id] = uniqueMentorIds.length;
              
              console.log('[AdviceScreen] Mentor count for question', session.question_id.slice(0, 8) + ':', {
                raw_assignments: data?.length || 0,
                unique_mentors: uniqueMentorIds.length,
                mentor_ids: uniqueMentorIds.map(id => id.slice(0, 8))
              });
            }
          }
        }
        
        setMentorCounts(counts);
      }
    };
    
    fetchMentorCounts();
  }, [assignedSessions.length]);
  
  // Group assigned sessions by question_id for multi-mentor display
  const groupedAssignedSessions = assignedSessions.reduce((groups: { [key: string]: AdviceSession[] }, session) => {
    const questionId = session.question_id;
    if (!groups[questionId]) {
      groups[questionId] = [];
    }
    groups[questionId].push(session);
    return groups;
  }, {});
  
  const assignedSessionGroups = Object.values(groupedAssignedSessions);
  const resolvedSessions = sortSessionsByRecentActivity(sessions.filter(s => s.status === 'resolved'));
  const unratedResolvedSessions = sortSessionsByRecentActivity(sessions.filter(s => s.status === 'resolved' && !s.rating));
  const ratedResolvedSessions = sortSessionsByRecentActivity(sessions.filter(s => s.status === 'resolved' && s.rating));

  console.log('[AdviceScreen] Filtered - Active:', activeSessions.length, 'Assigned:', assignedSessions.length, 'Resolved:', resolvedSessions.length);
  console.log('[AdviceScreen] Unrated resolved:', unratedResolvedSessions.length, 'Rated resolved:', ratedResolvedSessions.length);
  
  // Debug the crush question specifically
  const crushSession = sessions.find(s => s.questions?.content?.includes('crush'));
  if (crushSession) {
    console.log('[AdviceScreen] Crush session debug:', {
      id: crushSession.id.slice(0, 8),
      status: crushSession.status,
      rating: crushSession.rating,
      student_resolved_at: crushSession.student_resolved_at,
      shouldBeUnrated: crushSession.status === 'resolved' && !crushSession.rating
    });
  }

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
        
        {/* Instagram-Style Filter Button */}
        <View style={[styles.filterContainer, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowFilterModal(true);
            }}
          >
            <Ionicons name="options-outline" size={20} color={colors.text} />
            <Text style={[styles.filterButtonText, { color: colors.text }]}>
              {activeFilter === 'all' ? 'all chats' : 
               activeFilter === 'active' ? 'active' :
               activeFilter === 'assigned' ? 'assigned' :
               activeFilter === 'pending' ? 'pending' :
               activeFilter === 'unrated' ? 'rate mentors' :
               'resolved'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.content, { backgroundColor: colors.background }]}>
        {/* Active Chats */}
        {(activeFilter === 'all' || activeFilter === 'active') && (
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
                // Show actual question content, not just "Question"
                const questionTitle = session.questions?.title || session.questions?.content || 'Question';

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
                      {session.mentors?.avatar_url && !session.mentors.avatar_url.startsWith('file://') ? (
                        <Image
                          source={{ uri: session.mentors.avatar_url }}
                          style={styles.mentorAvatar}
                          onError={() => {
                            console.log('[Advice] Mentor avatar failed to load, will show initials');
                          }}
                        />
                      ) : (
                        <View style={[
                          styles.mentorAvatar,
                          { backgroundColor: getColorFromString(session.mentors?.full_name || 'Mentor'), alignItems: 'center', justifyContent: 'center' }
                        ]}>
                          <Text style={styles.avatarInitials}>
                            {getInitials(session.mentors?.full_name || 'Mentor')}
                          </Text>
                        </View>
                      )}
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
        )}

        {/* Assigned Chats */}
        {(activeFilter === 'all' || activeFilter === 'assigned') && assignedSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              assigned
            </Text>

            <View style={styles.chatsList}>
              {assignedSessions.map((session, index) => {
                const categoryName = session.questions?.categories?.name || 'chat';
                const questionTitle = session.questions?.title || session.questions?.content || 'Question';
                
                // Check if this is a multi-mentor question
                const isMultiMentor = session.mentor_id === null && (session.status === 'assigned' || session.status === 'pending');
                const mentorCount = session.question_id ? (mentorCounts[session.question_id] || 0) : 0;
                
                // Debug logging for the "Huh" question
                if (session.questions?.title === 'Huh') {
                  console.log('[AdviceScreen] Huh question debug:', {
                    questionTitle: session.questions?.title,
                    preferredMentorId: session.questions?.preferred_mentor_id,
                    questionStatus: session.questions?.status,
                    isMultiMentor,
                    mentorCount,
                    sessionMentorName: session.mentors?.full_name
                  });
                }

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
                      index < assignedSessions.length - 1 && { marginBottom: 8 },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/chat?chatId=${session.id}`);
                    }}
                    activeOpacity={0.8}
                  >
                    {/* Left side - show count badge for multi-mentor, avatar for single mentor */}
                    <View style={styles.chatLeft}>
                      {isMultiMentor && mentorCount > 1 ? (
                        <View style={[styles.mentorAvatar, { backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
                          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>
                            {mentorCount}
                          </Text>
                        </View>
                      ) : (
                        session.mentors?.avatar_url && !session.mentors.avatar_url.startsWith('file://') ? (
                          <Image
                            source={{ uri: session.mentors.avatar_url }}
                            style={styles.mentorAvatar}
                            onError={() => {
                              console.log('[Advice] Mentor avatar failed to load, will show initials');
                            }}
                          />
                        ) : (
                          <View style={[
                            styles.mentorAvatar,
                            { backgroundColor: getColorFromString(session.mentors?.full_name || 'Mentor'), alignItems: 'center', justifyContent: 'center' }
                          ]}>
                            <Text style={styles.avatarInitials}>
                              {getInitials(session.mentors?.full_name || 'Mentor')}
                            </Text>
                          </View>
                        )
                      )}
                    </View>

                    {/* Main content */}
                    <View style={styles.chatContent}>
                      <View style={styles.chatHeader}>
                        <View style={styles.chatTitleRow}>
                          <Text style={[styles.mentorName, { color: colors.text }]} numberOfLines={1}>
                            {isMultiMentor && mentorCount > 1 ? `${mentorCount} Mentors` : (session.mentors?.full_name || 'Your Mentor')}
                          </Text>
                          <View style={[styles.categoryPill, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                            <Text style={[styles.categoryText, { color: colors.primary }]}>
                              {categoryName}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                          {getTimeAgo(session.created_at)}
                        </Text>
                      </View>

                      <Text style={[styles.questionPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                        {questionTitle}
                      </Text>

                      <View style={styles.lastMessageRow}>
                        <Text style={[styles.lastMessageText, { color: colors.textSecondary }]} numberOfLines={1}>
                          Waiting for mentor to start chat...
                        </Text>
                      </View>
                    </View>

                    {/* Right side with status */}
                    <View style={styles.chatRight}>
                      <View style={[styles.statusBadge, { backgroundColor: colors.text + '15' }]}>
                        <Text style={[styles.statusText, { color: colors.text }]}>assigned</Text>
                      </View>
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

        {/* Resolved Chats */}
        {(activeFilter === 'all' || activeFilter === 'resolved') && resolvedSessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              resolved
            </Text>

            <View style={styles.chatsList}>
              {resolvedSessions.map((session, index) => {
                const lastMessage = getLastMessage(session);
                const categoryName = session.questions?.categories?.name || 'chat';
                const questionTitle = session.questions?.title || session.questions?.content || 'Question';
                const mentorName = session.mentors?.full_name || session.mentors?.username || 'Anonymous';

                // Check if session needs rating (resolved but no rating)
                const needsRating = session.status === 'resolved' && !session.rating;

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
                      console.log('[AdviceScreen] 📱 Opening resolved chat:', session.id?.slice(0, 8));
                      router.push({
                        pathname: '/chat',
                        params: { sessionId: session.id }
                      });
                    }}
                  >
                    <View style={styles.chatContent}>
                      <Text style={[styles.mentorName, { color: colors.text }]} numberOfLines={1}>
                        {mentorName}
                      </Text>
                      <Text style={[styles.questionTitle, { color: colors.textSecondary }]} numberOfLines={1}>
                        {questionTitle}
                      </Text>
                      {lastMessage && (
                        <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                          {lastMessage.content || (lastMessage.audio_url ? '🎵 Voice message' : 'Message')}
                        </Text>
                      )}
                    </View>

                    <View style={styles.chatMeta}>
                      {lastMessage && (
                        <Text style={[styles.timeStamp, { color: colors.textSecondary }]}>
                          {getTimeAgo(lastMessage.created_at)}
                        </Text>
                      )}
                      {needsRating ? (
                        <View style={[styles.statusContainer, { backgroundColor: colors.accent }]}>
                          <Text style={[styles.statusText, { color: '#FFFFFF' }]}>rate mentor</Text>
                        </View>
                      ) : (
                        <View style={[styles.statusContainer, { backgroundColor: colors.success }]}>
                          <Text style={[styles.statusText, { color: '#FFFFFF' }]}>completed</Text>
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
          </View>
        )}

        {/* Pending Questions */}
        {(activeFilter === 'all' || activeFilter === 'pending') && pendingQuestions.length > 0 && (
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


        {/* Resolved Sessions - Including Both Unrated and Rated */}
        {(activeFilter === 'all' || activeFilter === 'resolved' || activeFilter === 'unrated') && (unratedResolvedSessions.length > 0 || ratedResolvedSessions.length > 0) && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              resolved
            </Text>

            <View style={styles.chatsList}>
              {/* Unrated Sessions - Need Rating (only show when appropriate) */}
              {(activeFilter === 'all' || activeFilter === 'unrated') && unratedResolvedSessions.map((session, index) => {
                const questionTitle = session.questions?.title && session.questions.title.trim() !== ''
                  ? session.questions.title
                  : session.questions?.content?.substring(0, 50) || 'Chat Session';
                const categoryName = session.questions?.categories?.name || 'General';
                
                return (
                  <View
                    key={`unrated-${session.id}`}
                    style={[
                      styles.chatItem,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      },
                      { marginBottom: 8, flexDirection: 'column', paddingBottom: 20 },
                    ]}
                  >
                    {/* Main Chat Content - Clickable to open chat */}
                    <TouchableOpacity
                      style={[styles.chatContentRow, { flexDirection: 'row', alignItems: 'center' }]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        router.push(`/chat?chatId=${session.id}`);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.chatLeft}>
                        {session.mentors?.avatar_url && !session.mentors.avatar_url.startsWith('file://') ? (
                          <Image
                            source={{ uri: session.mentors.avatar_url }}
                            style={styles.mentorAvatar}
                            onError={() => {
                              console.log('[Advice] Mentor avatar failed to load, will show initials');
                            }}
                          />
                        ) : (
                          <View style={[
                            styles.mentorAvatar,
                            { backgroundColor: getColorFromString(session.mentors?.full_name || 'Mentor'), alignItems: 'center', justifyContent: 'center' }
                          ]}>
                            <Text style={styles.avatarInitials}>
                              {getInitials(session.mentors?.full_name || 'Mentor')}
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={[styles.chatContent, { flex: 1 }]}>
                        <View style={styles.chatHeader}>
                          <View style={styles.chatTitleRow}>
                            <Text style={[styles.mentorName, { color: colors.text }]} numberOfLines={1}>
                              {session.mentors?.full_name || 'Mentor'}
                            </Text>
                            <View style={[styles.categoryPill, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                              <Text style={[styles.categoryText, { color: colors.primary }]}>
                                {categoryName}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <Text style={[styles.questionPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                          {questionTitle}
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

                    {/* Rating Section - Positioned below main content */}
                    <View style={[styles.ratingSection, { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border }]}>
                      <Text style={[styles.ratingPrompt, { color: colors.text, marginBottom: 8 }]}>
                        How was your chat with {session.mentors?.full_name}?
                      </Text>
                      <TouchableOpacity
                        style={[styles.ratingButton, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          setSelectedSession(session);
                          setShowResolutionModal(true);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.starsRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons key={star} name="star-outline" size={20} color={colors.primary} style={{ marginRight: 4 }} />
                          ))}
                        </View>
                        <Text style={[styles.ratingButtonText, { color: colors.primary }]}>
                          Tap to rate
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {/* Rated Sessions - Already Completed (only show when appropriate) */}
              {(activeFilter === 'all' || activeFilter === 'resolved') && ratedResolvedSessions.map((session, index) => {
                const questionTitle = session.questions?.title && session.questions.title.trim() !== ''
                  ? session.questions.title
                  : session.questions?.content?.substring(0, 50) || 'Chat Session';
                const categoryName = session.questions?.categories?.name || 'General';

                return (
                  <TouchableOpacity
                    key={`rated-${session.id}`}
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
                      { marginBottom: 8 },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/chat?chatId=${session.id}`);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.chatLeft}>
                      {session.mentors?.avatar_url && !session.mentors.avatar_url.startsWith('file://') ? (
                        <Image
                          source={{ uri: session.mentors.avatar_url }}
                          style={styles.mentorAvatar}
                          onError={() => {
                            console.log('[Advice] Mentor avatar failed to load, will show initials');
                          }}
                        />
                      ) : (
                        <View style={[
                          styles.mentorAvatar,
                          { backgroundColor: getColorFromString(session.mentors?.full_name || 'Mentor'), alignItems: 'center', justifyContent: 'center' }
                        ]}>
                          <Text style={styles.avatarInitials}>
                            {getInitials(session.mentors?.full_name || 'Mentor')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.chatContent}>
                      <View style={styles.chatHeader}>
                        <View style={styles.chatTitleRow}>
                          <Text style={[styles.mentorName, { color: colors.text }]} numberOfLines={1}>
                            {session.mentors?.full_name || 'Mentor'}
                          </Text>
                          <View style={[styles.categoryPill, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '40' }]}>
                            <Text style={[styles.categoryText, { color: colors.primary }]}>
                              {categoryName}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <Text style={[styles.questionPreview, { color: colors.textSecondary }]} numberOfLines={1}>
                        {questionTitle}
                      </Text>
                      <View style={styles.lastMessageRow}>
                        <Text style={[styles.lastMessageText, { color: colors.textSecondary }]} numberOfLines={1}>
                          Rated {session.rating} stars
                        </Text>
                      </View>
                    </View>
                    <View style={styles.chatRight}>
                      <View style={[styles.statusBadge, { backgroundColor: colors.text + '10' }]}>
                        <Text style={[styles.statusText, { color: colors.text }]}>✓</Text>
                      </View>
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

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity 
              onPress={() => setShowFilterModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              filter chats
            </Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Filter Options */}
          <ScrollView style={styles.modalContent}>
            {[
              { key: 'all', label: 'all chats', count: sessions.length },
              { key: 'active', label: 'active', count: activeSessions.length },
              { key: 'assigned', label: 'assigned', count: assignedSessions.length },
              { key: 'pending', label: 'pending', count: pendingQuestions.length },
              { key: 'unrated', label: 'rate mentors', count: unratedResolvedSessions.length },
              { key: 'resolved', label: 'resolved', count: resolvedSessions.length },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.filterOption,
                  { 
                    backgroundColor: activeFilter === option.key ? colors.primary + '10' : colors.surface,
                    borderColor: activeFilter === option.key ? colors.primary : colors.border
                  }
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveFilter(option.key as any);
                  setShowFilterModal(false);
                }}
              >
                <View style={styles.filterOptionContent}>
                  <Text style={[
                    styles.filterOptionLabel, 
                    { color: activeFilter === option.key ? colors.primary : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.filterOptionCount, 
                    { color: colors.textSecondary }
                  ]}>
                    {option.count}
                  </Text>
                </View>
                {activeFilter === option.key && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Student Resolution Modal */}
      <StudentResolutionModal
        visible={showResolutionModal}
        onClose={() => {
          setShowResolutionModal(false);
          setSelectedSession(null);
        }}
        onSubmit={handleResolutionSubmit}
        mentorName={selectedSession?.mentors?.full_name}
      />
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
  
  // Instagram-Style Filter Button
  filterContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    flex: 1,
    textAlign: 'center',
  },

  // Filter Modal Styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    paddingTop: 60,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  filterOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    marginRight: 12,
  },
  filterOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  filterOptionCount: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Rating Section Styles
  chatContentRow: {
    flex: 1,
  },
  ratingSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  ratingPrompt: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  ratingButton: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingButtonText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Multi-mentor indicator styles
  multiMentorIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiMentorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
});

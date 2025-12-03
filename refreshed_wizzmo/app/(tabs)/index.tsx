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
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
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
  const isMentor = currentMode === 'mentor';
  
  // DEBUG: Log mode detection for troubleshooting
  useEffect(() => {
    console.log('[HomeScreen] 🔍 Mode Detection Debug:', {
      currentMode,
      isMentor,
      userProfileRole: userProfile?.role,
      userEmail: user?.email?.slice(0, 10) + '...'
    });
  }, [currentMode, isMentor, userProfile?.role, user?.email]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Mentor-specific state
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([]);
  const [activeChatCount, setActiveChatCount] = useState(0);
  const [helpfulPercentage, setHelpfulPercentage] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [processingQuestions, setProcessingQuestions] = useState<Set<string>>(new Set());
  const [inboxFilter, setInboxFilter] = useState<'specific' | 'open'>('specific');
  // Removed auto-pass functionality
  
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
    if (isMentor && user) {
      fetchMentorData();
    }

    return () => {
      clearInterval(timer);
      clearInterval(pulseInterval);
    };
  }, [isMentor, user, pulseScale]);

  // Only auto-switch to specific tab on first load when specific requests are available
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    const hasSpecificRequests = pendingQuestions.some(q => q.is_specific_request);
    if (hasSpecificRequests && !hasInitializedRef.current) {
      // Auto-focus logic removed - no tabs anymore
    }
    if (pendingQuestions.length > 0) {
      hasInitializedRef.current = true;
    }
  }, [pendingQuestions]);

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
    console.log('[HomeScreen] 🔍 Fetching mentor data for:', user.id.slice(0, 8));

    try {
      // Fetch assigned advice sessions (pending status)
      const { data: assignedSessions, error: sessionError } = await supabase
        .from('advice_sessions')
        .select(`
          *,
          questions (
            title,
            content,
            category_id,
            preferred_mentor_id,
            status,
            categories (name)
          ),
          students:users!advice_sessions_student_id_fkey (
            full_name,
            email
          )
        `)
        .eq('mentor_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      console.log('[HomeScreen] 📝 Assigned sessions fetched:', assignedSessions?.length || 0);

      // Also fetch general pending questions that aren't assigned yet
      const { data: questions } = await supabaseService.getPendingQuestions(user.id);
      console.log('[HomeScreen] 📝 Pending questions fetched:', questions?.length || 0);
      console.log('[HomeScreen] 🔍 Raw questions data:', questions?.map(q => ({ 
        id: q.id.slice(0, 8), 
        title: q.title?.slice(0, 30), 
        preferred_mentor_id: q.preferred_mentor_id,
        hasPreferredMentor: !!q.preferred_mentor_id 
      })));
      // Transform assigned sessions into question format
      const transformedAssignedSessions = (assignedSessions || []).map(session => ({
        id: session.questions?.id || session.id, // Use question ID if available, fallback to session ID
        session_id: session.id, // Keep track of session ID for navigation
        title: session.questions?.title,
        content: session.questions?.content,
        category: session.questions?.categories?.name || 'General',
        category_icon: getCategoryIcon(session.questions?.categories?.name || 'General'),
        urgency: 'medium',
        created_at: session.created_at,
        is_anonymous: false,
        preferred_mentor_id: session.questions?.preferred_mentor_id,
        is_specific_request: session.questions?.status === 'assigned',
        student_name: session.questions?.preferred_mentor_id ? (session.students?.full_name || 'Student') : null,
        is_assigned_session: true, // Flag to identify these as assigned sessions
      }));

      // Transform general pending questions - exclude ones that are already assigned sessions
      const assignedQuestionIds = new Set((assignedSessions || []).map(session => session.questions?.id).filter(Boolean));
      console.log('[HomeScreen] 🔍 Assigned question IDs:', Array.from(assignedQuestionIds));
      
      const transformedPendingQuestions = (questions || [])
        .filter(q => {
          const isAlreadyAssigned = assignedQuestionIds.has(q.id);
          if (isAlreadyAssigned) {
            console.log('[HomeScreen] 🚫 Filtering out already assigned question:', q.id.slice(0, 8), q.title?.slice(0, 30));
          }
          return !isAlreadyAssigned;
        })
        .map(q => {
          const isSpecificRequest = q.preferred_mentor_id === user.id || 
                                   ((q as any).preferred_mentor_ids && (q as any).preferred_mentor_ids.includes(user.id));
          console.log('[HomeScreen] 📝 Pending question:', {
            id: q.id.slice(0, 8),
            title: q.title?.slice(0, 30),
            preferred_mentor_id: q.preferred_mentor_id?.slice(0, 8),
            current_mentor: user.id.slice(0, 8),
            is_specific_request: isSpecificRequest
          });
          return {
            id: q.id,
            title: q.title,
            content: q.content,
            category: q.category?.name || 'General',
            category_icon: getCategoryIcon(q.category?.name || 'General'),
            urgency: q.urgency || 'medium',
            created_at: q.created_at,
            is_anonymous: q.is_anonymous || false,
            preferred_mentor_id: q.preferred_mentor_id,
            is_specific_request: isSpecificRequest,
            is_assigned_session: false,
          };
        });

      // Combine both types and sort by date (most recent first)
      const allQuestions = [...transformedAssignedSessions, ...transformedPendingQuestions].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
      setPendingQuestions(allQuestions);

      const specificRequests = allQuestions.filter(q => q.is_specific_request);
      const generalRequests = allQuestions.filter(q => !q.is_specific_request);
      console.log('[HomeScreen] 👤 Current mentor ID:', user.id.slice(0, 8));
      console.log('[HomeScreen] 📊 Total assigned sessions:', transformedAssignedSessions.length);
      console.log('[HomeScreen] 📊 Total pending questions:', transformedPendingQuestions.length);
      console.log('[HomeScreen] Questions split - Specific:', specificRequests.length, 'General:', generalRequests.length);
      
      console.log('[HomeScreen] ⭐ Specific requests:', specificRequests.map(q => ({ 
        id: q.id?.slice(0, 8), 
        title: q.title?.slice(0, 30),
        isSession: q.is_assigned_session,
        preferred_mentor_id: q.preferred_mentor_id?.slice(0, 8)
      })));
      
      console.log('[HomeScreen] 💬 General requests:', generalRequests.map(q => ({ 
        id: q.id?.slice(0, 8), 
        title: q.title?.slice(0, 30),
        isSession: q.is_assigned_session,
        preferred_mentor_id: q.preferred_mentor_id?.slice(0, 8)
      })));
      
      // Check for duplicates by question title
      const titleCounts = {};
      allQuestions.forEach(q => {
        const title = q.title?.toLowerCase();
        if (title) {
          titleCounts[title] = (titleCounts[title] || 0) + 1;
        }
      });
      
      const duplicateTitles = Object.entries(titleCounts).filter(([title, count]) => count > 1);
      if (duplicateTitles.length > 0) {
        console.log('[HomeScreen] 🚨 DUPLICATE QUESTIONS DETECTED:', duplicateTitles);
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

  const onRefresh = async () => {
    console.log('[HomeScreen] 🔄 Manual refresh triggered');
    setRefreshing(true);
    if (isMentor && user) {
      await fetchMentorData();
    }
    setRefreshing(false);
    console.log('[HomeScreen] ✅ Manual refresh completed');
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
      // Find the question in our current list to check if it's an assigned session
      const question = pendingQuestions.find(q => q.id === questionId);
      
      if (question?.is_assigned_session && question?.session_id) {
        // This is an assigned session - need to activate it first
        console.log('[HomeScreen] 🔄 Activating assigned session:', question.session_id);
        
        const { data: acceptedSession, error: acceptError } = await supabaseService.acceptAdviceSession(
          question.session_id,
          user.id
        );

        if (acceptError) {
          console.error('[HomeScreen] Error activating assigned session:', acceptError);
          Alert.alert('Error', 'Failed to activate chat. Please try again.');
          return;
        }

        console.log('[HomeScreen] ✅ Assigned session activated successfully, new status:', acceptedSession?.status);
        setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
        router.push(`/chat?chatId=${question.session_id}`);
        return;
      }

      // For general pending questions, create a new session  
      const { data: existingSession } = await supabaseService.getSessionByQuestionId(questionId);
      
      if (existingSession) {
        console.log('[HomeScreen] Session already exists for question:', questionId);
        
        // For students: redirect to existing chat
        // For mentors: only redirect if they are the assigned mentor
        if (!isMentor || existingSession.mentor_id === user.id) {
          setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
          router.push(`/chat?chatId=${existingSession.id}`);
          return;
        } else {
          // Mentor trying to accept a question that's already assigned to another mentor
          Alert.alert('Question Already Assigned', 'This question has already been assigned to another mentor.');
          setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
          return;
        }
      }

      const { data: session, error } = await supabaseService.createAdviceSession(questionId, user.id);
      if (error) {
        console.error('[HomeScreen] Error creating session:', error);
        
        // Handle specific error for self-mentoring attempts
        if (error.message === 'Students cannot ask questions to themselves') {
          Alert.alert(
            'Cannot Accept Own Question', 
            "You can't accept questions you asked yourself. This helps maintain objective advice.",
            [{ text: 'OK', style: 'default' }]
          );
        } else {
          Alert.alert('Error', 'Failed to accept question. Please try again.');
        }
        return;
      }

      console.log('[HomeScreen] Session created:', session?.id, 'with status:', session?.status);

      // Accept the session to make it active
      if (session?.id) {
        console.log('[HomeScreen] Accepting session to make it active...');
        const { data: acceptedSession, error: acceptError } = await supabaseService.acceptAdviceSession(
          session.id,
          user.id
        );

        if (acceptError) {
          console.error('[HomeScreen] Error accepting session:', acceptError);
          Alert.alert('Error', 'Failed to activate chat. Please try again.');
          return;
        }

        console.log('[HomeScreen] ✅ Session accepted successfully, new status:', acceptedSession?.status);

        setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
        
        // Navigate to chat
        console.log('[HomeScreen] 🚀 Navigating to chat with session:', session.id);
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
    if (!user) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      // Record the pass in database
      const { error } = await supabase
        .from('mentor_passes')
        .insert({
          question_id: questionId,
          mentor_id: user.id,
          auto_passed: false
        });
      
      if (error && !error.message.includes('duplicate key')) {
        console.error('[HomeScreen] Error recording pass:', error);
      }
      
      // Check if all mentors have passed
      const { data: allPassed } = await supabase
        .rpc('check_all_mentors_passed', { question_id: questionId });
      
      if (allPassed) {
        // Return question to student
        await supabase
          .from('questions')
          .update({ 
            preferred_mentor_id: null,
            question_returned_at: new Date().toISOString()
          })
          .eq('id', questionId);
      }
      
      console.log('[HomeScreen] Question passed, all mentors passed:', allPassed);
      
    } catch (error) {
      console.error('[HomeScreen] Error in decline flow:', error);
    }
    
    setPendingQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleMentorPress = (mentorId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Navigate to spill tab with mentor pre-selected
    if (mentorId.startsWith('demo-')) {
      // For demo mentors, just go to spill tab (they'll be available to select there)
      router.push('/(tabs)/spill');
    } else {
      // For real mentors, go to their profile first, then they can ask for advice
      router.push(`/wizzmo-profile?userId=${mentorId}`);
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
  if (isMentor) {
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
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


            {/* Email-Style Inbox with Tabs */}
            <View style={styles.section}>
              {(() => {
                const allQuestions = pendingQuestions;

                // Split questions into specific requests and open questions
                const specificRequests = allQuestions.filter(q => 
                  q.is_specific_request || 
                  q.preferred_mentor_id === user?.id ||
                  ((q as any).preferred_mentor_ids && (q as any).preferred_mentor_ids.includes(user?.id))
                );
                const openQuestions = allQuestions.filter(q => 
                  !q.is_specific_request && 
                  q.preferred_mentor_id !== user?.id &&
                  !((q as any).preferred_mentor_ids && (q as any).preferred_mentor_ids.includes(user?.id))
                );

                // Get current filtered questions
                const currentQuestions = inboxFilter === 'specific' ? specificRequests : openQuestions;
                
                return (
                  <>
                    {/* Filter Tabs */}
                    <View style={styles.filterTabs}>
                      <TouchableOpacity
                        style={[
                          styles.filterTab,
                          { backgroundColor: inboxFilter === 'specific' ? colors.primary : 'transparent', borderColor: colors.border }
                        ]}
                        onPress={() => {
                          setInboxFilter('specific');
                          setShowAllQuestions(false);
                        }}
                      >
                        <Text style={[
                          styles.filterTabText,
                          { color: inboxFilter === 'specific' ? 'white' : colors.text }
                        ]}>
                          specific requests ({specificRequests.length})
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.filterTab,
                          { backgroundColor: inboxFilter === 'open' ? colors.primary : 'transparent', borderColor: colors.border }
                        ]}
                        onPress={() => {
                          setInboxFilter('open');
                          setShowAllQuestions(false);
                        }}
                      >
                        <Text style={[
                          styles.filterTabText,
                          { color: inboxFilter === 'open' ? 'white' : colors.text }
                        ]}>
                          open questions ({openQuestions.length})
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Current Questions */}
                    {currentQuestions.length === 0 ? (
                      <View style={[styles.tipCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                        <Text style={[styles.tipTitle, { color: colors.text }]}>
                          {inboxFilter === 'specific' ? '✨ no specific requests' : '✨ no open questions'}
                        </Text>
                        <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                          {inboxFilter === 'specific' 
                            ? 'no students have requested you specifically right now.' 
                            : 'no open questions available. check back later!'}
                        </Text>
                      </View>
                    ) : (
                        <View style={[styles.questionsContainer]}>
                          {currentQuestions.slice(0, showAllQuestions ? currentQuestions.length : 5).map((question, index) => (
                      <View
                        key={question.id}
                        style={[
                          styles.enhancedQuestionCard,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            borderWidth: 1,
                            shadowColor: colors.text
                          },
                        ]}
                      >
                        {/* Header with category and time */}
                        <View style={styles.questionHeader}>
                          <View style={styles.categoryRow}>
                            <Text style={styles.categoryEmoji}>
                              {question.is_specific_request ? '⭐' : (question.category_icon || '💬')}
                            </Text>
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
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                          <Text style={[styles.enhancedQuestionTitle, { color: colors.text, flex: 1 }]} numberOfLines={5}>
                            {question.title}
                          </Text>
                          {question.is_assigned_session && (
                            <View style={[styles.categoryBadge, { backgroundColor: colors.text + '15', borderColor: colors.text + '30', paddingHorizontal: 6, paddingVertical: 2 }]}>
                              <Text style={[styles.categoryText, { color: colors.text, fontSize: 10 }]}>
                                assigned
                              </Text>
                            </View>
                          )}
                          {question.is_specific_request && question.student_name && (
                            <View style={[styles.categoryBadge, { backgroundColor: colors.surface, borderColor: colors.primary + '40', paddingHorizontal: 6, paddingVertical: 2 }]}>
                              <Text style={[styles.categoryText, { color: colors.primary, fontSize: 10 }]}>
                                from {question.student_name}
                              </Text>
                            </View>
                          )}
                        </View>

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
                          
                          <Text style={[styles.enhancedQuestionContent, { color: colors.textSecondary }]} numberOfLines={6}>
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
                        
                        {/* View More Button */}
                        {!showAllQuestions && currentQuestions.length > 5 && (
                          <TouchableOpacity
                            style={[styles.showMoreButton, { borderTopColor: colors.border }]}
                            onPress={() => setShowAllQuestions(true)}
                          >
                            <Text style={[styles.showMoreText, { color: colors.primary }]}>
                              view {currentQuestions.length - 5} more
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={colors.primary} />
                          </TouchableOpacity>
                        )}
                        
                        </View>
                    )}
                  </>
                );
              })()}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Personalized Greeting */}
        <View style={styles.section}>
          <Text style={[styles.greetingText, { color: colors.text }]}>
            {getPersonalizedGreeting()}
          </Text>
        </View>

        {/* Mentor Showcase */}
        <MentorShowcase onMentorPress={handleMentorPress} />

        {/* Active Conversations - Only show if there are real topics */}
        {liveTopics.length > 0 && (
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
                  onPress={() => handlePress(`/(tabs)/feed?questionId=${topic.id}`)}
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
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon="add"
        label="spill tea"
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
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
    marginBottom: 0,
    borderRadius: 0,
    borderWidth: 2,
    padding: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    width: '100%',
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
    borderRadius: 0,
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
    gap: 8,
  },
  enhancedDeclineButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  enhancedDeclineText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  enhancedAcceptButton: {
    flex: 2,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  enhancedAcceptText: {
    fontSize: 13,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
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

  // Filter Tabs
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 0,
    borderWidth: 2,
    alignItems: 'center',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Question Container
  questionsContainer: {
    gap: 16,
  },

  // Enhanced Action Row for open questions
  enhancedActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  enhancedPassButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 0,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    minHeight: 48,
  },
  enhancedPassText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  
});
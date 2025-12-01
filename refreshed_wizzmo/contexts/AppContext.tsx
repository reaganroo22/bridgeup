import React, { createContext, useContext, useState, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import { useUserMode } from './UserModeContext';
import * as supabaseService from '../lib/supabaseService';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Wizzmo {
  id: string;
  name: string;
  avatar: string;
  school: string;
  year: string;
  specialties: string[];
  isOnline: boolean;
}

export interface Question {
  id: string;
  text: string;
  category: string;
  isAnonymous: boolean;
  timestamp: Date;
  status: 'pending' | 'matched' | 'active' | 'resolved';
  assignedWizzmos?: Wizzmo[];
  chatId?: string;
}

export interface Message {
  id: string;
  chatId: string;
  text: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  isWizzmo: boolean;
  timestamp: Date;
  isMe: boolean;
}

export interface Chat {
  id: string;
  questionId: string;
  question: string;
  category: string;
  participants: Wizzmo[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  status: 'active' | 'resolved';
  createdAt: Date;
  rating?: number;
  ratingFeedback?: string;
}

export interface TrendingTopic {
  id: string;
  title: string;
  participants: number;
  category: string;
  emoji: string;
  isLive: boolean;
  trendingScore: number;
}

interface AppContextType {
  user: {
    id: string;
    name: string;
    avatar: string;
    questionsAsked: number;
    hasUsedFreeQuestion: boolean;
  } | null;
  questions: Question[];
  chats: Chat[];
  availableWizzmos: Wizzmo[];
  trendingTopics: TrendingTopic[];
  loading: boolean;
  submitQuestion: (title: string, content: string, category: string, isAnonymous: boolean, preferredMentorId?: string, preferredMentorIds?: string[]) => Promise<string>;
  sendMessage: (chatId: string, text: string) => void;
  markChatAsRead: (chatId: string) => void;
  resolvChat: (chatId: string) => void;
  submitRating: (chatId: string, rating: number, feedback?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

// ============================================================================
// APP PROVIDER
// ============================================================================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get authenticated user from AuthContext
  const { user: authUser } = useAuth();
  // Get current user mode
  const { currentMode, availableModes } = useUserMode();

  // State
  const [user, setUser] = useState<AppContextType['user']>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [availableWizzmos, setAvailableWizzmos] = useState<Wizzmo[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryMap, setCategoryMap] = useState<Map<string, supabaseService.Category>>(new Map());

  // Real-time subscriptions
  const [messageChannels, setMessageChannels] = useState<Map<string, RealtimeChannel>>(new Map());
  const [notificationChannel, setNotificationChannel] = useState<RealtimeChannel | null>(null);

  // ============================================================================
  // INITIALIZATION - Fetch all data when user logs in
  // ============================================================================

  useEffect(() => {
    if (!authUser) {
      // User logged out, reset state
      setUser(null);
      setQuestions([]);
      setChats([]);
      setAvailableWizzmos([]);
      setLoading(false);
      return;
    }

    // User logged in, fetch all data
    initializeAppData();
  }, [authUser, availableModes]);

  const initializeAppData = async () => {
    // Sync all mentor stats on startup to ensure fresh helpful vote data
    try {
      console.log('[AppContext] Syncing mentor stats on startup...');
      await supabaseService.syncAllMentorStats();
      console.log('[AppContext] Mentor stats sync completed');
    } catch (error) {
      console.error('[AppContext] Error syncing mentor stats:', error);
    }
    if (!authUser) return;

    try {
      setLoading(true);
      console.log('[AppContext] Initializing app data for user:', authUser.id);

      // Fetch categories first (needed for trending topics)
      await fetchCategories();

      // Fetch all other data in parallel for better performance
      await Promise.all([
        fetchUserProfile(),
        fetchQuestions(),
        fetchChats(),
        fetchAvailableMentors(),
        fetchTrendingTopics(),
      ]);

      // Set up real-time subscriptions
      setupRealtimeSubscriptions();

      console.log('[AppContext] App data initialized successfully');
    } catch (error) {
      console.error('[AppContext] Error initializing app data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FETCH FUNCTIONS - Get data from Supabase
  // ============================================================================

  /**
   * Fetch current user profile from Supabase
   */
  const fetchUserProfile = async () => {
    if (!authUser) return;

    try {
      console.log('[AppContext] Fetching user profile');
      const { data: profile, error } = await supabaseService.getUserProfile(authUser.id);

      if (error) throw error;
      if (!profile) return;

      // Get subscription to check questions used
      const { data: subscription } = await supabaseService.getUserSubscription(authUser.id);

      // Transform to app user format
      setUser({
        id: profile.id,
        name: profile.username || profile.full_name || 'you',
        avatar: profile.avatar_url || '🥺',
        questionsAsked: subscription?.questions_used || 0,
        hasUsedFreeQuestion: (subscription?.questions_used || 0) > 0,
      });

      console.log('[AppContext] User profile loaded');
    } catch (error) {
      console.error('[AppContext] Error fetching user profile:', error);
    }
  };

  /**
   * Fetch categories for mapping category IDs to names
   */
  const fetchCategories = async () => {
    try {
      console.log('[AppContext] Fetching categories');
      const { data: categories, error } = await supabaseService.getCategories();

      if (error) throw error;
      if (!categories) return;

      // Create map for quick lookups
      const map = new Map<string, supabaseService.Category>();
      categories.forEach(cat => map.set(cat.id, cat));
      setCategoryMap(map);

      console.log('[AppContext] Categories loaded:', categories.length);
    } catch (error) {
      console.error('[AppContext] Error fetching categories:', error);
    }
  };

  /**
   * Fetch user's questions from Supabase
   */
  const fetchQuestions = async () => {
    if (!authUser) return;

    try {
      console.log('[AppContext] Fetching user questions');
      const { data: dbQuestions, error } = await supabaseService.getQuestionsByStudent(authUser.id);

      if (error) throw error;
      if (!dbQuestions) return;

      // Transform database questions to app format
      const transformedQuestions: Question[] = dbQuestions.map(q => ({
        id: q.id,
        text: q.content,
        category: categoryMap.get(q.category_id)?.name || q.category_id,
        isAnonymous: q.is_anonymous,
        timestamp: new Date(q.created_at),
        status: mapQuestionStatus(q.status),
        assignedWizzmos: [], // Will be populated from sessions
        chatId: undefined, // Will be populated from sessions
      }));

      setQuestions(transformedQuestions);
      console.log('[AppContext] Questions loaded:', transformedQuestions.length);
    } catch (error) {
      console.error('[AppContext] Error fetching questions:', error);
    }
  };

  /**
   * Fetch user's active and resolved chat sessions from Supabase
   */
  const fetchChats = async () => {
    if (!authUser) return;

    try {
      console.log('[AppContext] Fetching user chats for mode:', currentMode, 'available modes:', availableModes);

      let allActiveSessions: any[] = [];
      let allResolvedSessions: any[] = [];

      // For dual role users or when available modes include both, fetch sessions for both roles
      if (availableModes.includes('student')) {
        const [studentActiveSessions, studentResolvedSessions] = await Promise.all([
          supabaseService.getActiveSessions(authUser.id, 'student'),
          supabaseService.getResolvedSessions(authUser.id, 'student'),
        ]);

        if (studentActiveSessions.error) throw studentActiveSessions.error;
        if (studentResolvedSessions.error) throw studentResolvedSessions.error;

        allActiveSessions.push(...(studentActiveSessions.data || []));
        allResolvedSessions.push(...(studentResolvedSessions.data || []));
        console.log('[AppContext] Fetched student sessions - active:', studentActiveSessions.data?.length, 'resolved:', studentResolvedSessions.data?.length);
      }

      if (availableModes.includes('mentor')) {
        const [mentorActiveSessions, mentorResolvedSessions] = await Promise.all([
          supabaseService.getActiveSessions(authUser.id, 'mentor'),
          supabaseService.getResolvedSessions(authUser.id, 'mentor'),
        ]);

        if (mentorActiveSessions.error) throw mentorActiveSessions.error;
        if (mentorResolvedSessions.error) throw mentorResolvedSessions.error;

        allActiveSessions.push(...(mentorActiveSessions.data || []));
        allResolvedSessions.push(...(mentorResolvedSessions.data || []));
        console.log('[AppContext] Fetched mentor sessions - active:', mentorActiveSessions.data?.length, 'resolved:', mentorResolvedSessions.data?.length);
      }

      // Remove duplicates (in case user has both roles and appears in both lists)
      const uniqueActiveSessions = Array.from(new Map(allActiveSessions.map(s => [s.id, s])).values());
      const uniqueResolvedSessions = Array.from(new Map(allResolvedSessions.map(s => [s.id, s])).values());

      console.log('[AppContext] Unique sessions after deduplication - active:', uniqueActiveSessions.length, 'resolved:', uniqueResolvedSessions.length);

      const allSessions = [
        ...uniqueActiveSessions,
        ...uniqueResolvedSessions,
      ];

      // Transform sessions to chat format
      const transformedChats: Chat[] = [];

      for (const session of allSessions) {
        // Determine if user is student or mentor in this session
        const isUserMentor = session.mentor_id === authUser.id;
        const isUserStudent = session.student_id === authUser.id;
        
        // Get the other person's profile
        const otherPersonId = isUserMentor ? session.student_id : session.mentor_id;
        const { data: otherPersonProfile } = await supabaseService.getUserProfile(otherPersonId);

        if (!otherPersonProfile) continue;

        // Transform messages
        const transformedMessages: Message[] = (session.messages || []).map(m => ({
          id: m.id,
          chatId: session.id,
          text: m.content,
          senderId: m.sender_id,
          senderName: m.sender_id === authUser.id ? (user?.name || 'you') : (otherPersonProfile.username || otherPersonProfile.full_name || 'user'),
          senderAvatar: m.sender_id === authUser.id ? (user?.avatar || '🥺') : (otherPersonProfile.avatar_url || '💕'),
          isWizzmo: isUserMentor ? m.sender_id === session.student_id : m.sender_id === session.mentor_id,
          timestamp: new Date(m.created_at),
          isMe: m.sender_id === authUser.id,
        }));

        // Count unread messages (messages from the other person that are unread)
        const unreadCount = transformedMessages.filter(m => !m.isMe).length;

        // Get rating if exists (only for resolved sessions)
        let rating: number | undefined;
        let ratingFeedback: string | undefined;
        if (session.status === 'resolved') {
          // Find rating in any of the resolved sessions arrays
          const allResolvedSessions = [...uniqueResolvedSessions];
          const sessionWithRating = allResolvedSessions.find(s => s.id === session.id);
          if (sessionWithRating?.ratings && Array.isArray(sessionWithRating.ratings) && sessionWithRating.ratings.length > 0) {
            const ratingData = sessionWithRating.ratings[0];
            rating = ratingData.rating;
            ratingFeedback = ratingData.feedback_text || undefined;
          }
        }

        const chat: Chat = {
          id: session.id,
          questionId: session.question_id,
          question: session.question?.content || 'No question content',
          category: categoryMap.get(session.question?.category_id)?.name || session.question?.category_id || 'General',
          participants: [{
            id: otherPersonProfile.id,
            name: otherPersonProfile.username || otherPersonProfile.full_name || 'user',
            avatar: otherPersonProfile.avatar_url || (isUserMentor ? '🥺' : '💕'),
            school: otherPersonProfile.university || 'Unknown',
            year: 'junior', // TODO: Add year to user profile
            specialties: [], // TODO: Fetch from mentor expertise
            isOnline: true, // TODO: Add presence tracking
          }],
          messages: transformedMessages,
          lastMessage: transformedMessages[transformedMessages.length - 1],
          unreadCount,
          status: session.status === 'resolved' ? 'resolved' : 'active',
          createdAt: new Date(session.created_at),
          rating,
          ratingFeedback,
        };

        transformedChats.push(chat);

        // Update questions with session info
        setQuestions(prev => prev.map(q =>
          q.id === session.question_id
            ? {
                ...q,
                assignedWizzmos: chat.participants,
                chatId: session.id,
                status: session.status === 'resolved' ? 'resolved' : 'active',
              }
            : q
        ));
      }

      setChats(transformedChats);
      console.log('[AppContext] Chats loaded:', transformedChats.length);
    } catch (error) {
      console.error('[AppContext] Error fetching chats:', error);
    }
  };

  /**
   * Fetch available mentors (wizzmos) from Supabase
   * For now, we'll just fetch users with mentor role
   */
  const fetchAvailableMentors = async () => {
    try {
      console.log('[AppContext] Fetching available mentors');

      // TODO: Create a proper query to get available mentors
      // For now, we'll return empty array until we implement mentor listing
      setAvailableWizzmos([]);

      console.log('[AppContext] Mentors loaded');
    } catch (error) {
      console.error('[AppContext] Error fetching mentors:', error);
    }
  };

  /**
   * Fetch trending topics (public questions with high engagement)
   */
  const fetchTrendingTopics = async () => {
    try {
      console.log('[AppContext] Fetching trending topics');
      const { data: publicQuestions, error } = await supabaseService.getPublicQuestions(50);

      if (error) throw error;
      if (!publicQuestions) return;

      // Transform to trending topics format
      const topics: TrendingTopic[] = publicQuestions.map(q => {
        // Count votes and comments for trending score
        const upvotes = Array.isArray(q.feed_votes) ? q.feed_votes.filter((v: any) => v.vote_type === 'upvote').length : 0;
        const downvotes = Array.isArray(q.feed_votes) ? q.feed_votes.filter((v: any) => v.vote_type === 'downvote').length : 0;
        const comments = Array.isArray(q.feed_comments) ? q.feed_comments.length : 0;

        // Calculate age in hours
        const ageInHours = (Date.now() - new Date(q.created_at).getTime()) / (1000 * 60 * 60);

        // Trending algorithm: balances engagement with recency
        // - Upvotes and comments add to engagement score
        // - Recency decay: older posts need more engagement to rank high
        // - Gravity of 1.5 means score drops moderately over time
        const engagementScore = (upvotes - downvotes) * 2 + comments * 4; // Comments weighted higher
        const trendingScore = engagementScore / Math.pow(ageInHours + 2, 1.5); // Time decay

        // Mark as "live" if posted in last 3 hours OR has recent activity
        const isLive = ageInHours < 3 || (ageInHours < 24 && comments > 2);

        return {
          id: q.id,
          title: q.title && q.title.trim() !== ''
            ? q.title
            : q.content?.substring(0, 50) || 'New Question',
          participants: upvotes + comments,
          category: categoryMap.get(q.category_id)?.name || 'general',
          emoji: getEmojiForCategory(categoryMap.get(q.category_id)?.name || 'general'),
          isLive,
          trendingScore,
        };
      })
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 10); // Top 10

      // Only show real trending topics - no demo data
      setTrendingTopics(topics);
      
      console.log('[AppContext] Trending topics loaded:', topics.length);
    } catch (error) {
      console.error('[AppContext] Error fetching trending topics:', error);
      // No demo data fallback - show empty list
      setTrendingTopics([]);
    }
  };

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  /**
   * Set up real-time subscriptions for messages and notifications
   */
  const setupRealtimeSubscriptions = () => {
    if (!authUser) return;

    console.log('[AppContext] Setting up real-time subscriptions');

    // Subscribe to notifications
    const notifChannel = supabaseService.subscribeToNotifications(authUser.id, (notification) => {
      console.log('[AppContext] New notification:', notification);
      // Handle new notification (could show toast, update badge, etc.)
    });
    setNotificationChannel(notifChannel);

    // Subscribe to messages for each active chat
    chats.forEach(chat => {
      if (chat.status === 'active') {
        const channel = supabaseService.subscribeToMessages(chat.id, (message) => {
          console.log('[AppContext] New message in chat:', chat.id);
          handleNewMessage(chat.id, message);
        });
        setMessageChannels(prev => new Map(prev.set(chat.id, channel)));
      }
    });
  };

  /**
   * Handle new message from real-time subscription
   */
  const handleNewMessage = async (sessionId: string, dbMessage: supabaseService.Message) => {
    try {
      // Get sender profile
      const { data: senderProfile } = await supabaseService.getUserProfile(dbMessage.sender_id);

      // Transform message to app format
      const newMessage: Message = {
        id: dbMessage.id,
        chatId: sessionId,
        text: dbMessage.content,
        senderId: dbMessage.sender_id,
        senderName: senderProfile?.username || senderProfile?.full_name || 'unknown',
        senderAvatar: senderProfile?.avatar_url || '💕',
        isWizzmo: dbMessage.sender_id !== authUser?.id,
        timestamp: new Date(dbMessage.created_at),
        isMe: dbMessage.sender_id === authUser?.id,
      };

      // Update chats state
      setChats(prev => prev.map(chat => {
        if (chat.id === sessionId) {
          return {
            ...chat,
            messages: [...chat.messages, newMessage],
            lastMessage: newMessage,
            unreadCount: newMessage.isMe ? chat.unreadCount : chat.unreadCount + 1,
          };
        }
        return chat;
      }));
    } catch (error) {
      console.error('[AppContext] Error handling new message:', error);
    }
  };

  /**
   * Clean up real-time subscriptions on unmount
   */
  useEffect(() => {
    return () => {
      console.log('[AppContext] Cleaning up real-time subscriptions');

      // Unsubscribe from all message channels
      messageChannels.forEach(channel => {
        supabaseService.unsubscribeChannel(channel);
      });

      // Unsubscribe from notification channel
      if (notificationChannel) {
        supabaseService.unsubscribeChannel(notificationChannel);
      }
    };
  }, [messageChannels, notificationChannel]);

  // ============================================================================
  // ACTION FUNCTIONS - Modify data
  // ============================================================================

  /**
   * Submit a new question
   * Creates question in Supabase and returns question ID
   */
  const submitQuestion = async (title: string, content: string, category: string, isAnonymous: boolean, preferredMentorId?: string, preferredMentorIds?: string[]): Promise<string> => {
    if (!authUser) {
      throw new Error('User not authenticated');
    }

    try {
      console.log('[AppContext] Submitting question:', { title, category, isAnonymous });

      // Find category ID from name or slug
      let categoryId: string | undefined;

      // First try exact match on slug (which is usually the category id from ask screen)
      if (categoryMap.has(category)) {
        categoryId = category;
      } else {
        // Otherwise search by name or slug
        categoryMap.forEach((cat, id) => {
          if (cat.name.toLowerCase() === category.toLowerCase() || cat.slug === category) {
            categoryId = id;
          }
        });
      }

      if (!categoryId) {
        console.error('[AppContext] Category not found:', category, 'Available categories:', Array.from(categoryMap.entries()));
        throw new Error(`Invalid category: ${category}. Please select a valid category.`);
      }

      // Check subscription limit before creating question
      const { data: subscription } = await supabaseService.getUserSubscription(authUser.id);
      console.log('[AppContext] Subscription check:', {
        plan_type: subscription?.plan_type,
        status: subscription?.status,
        questions_limit: subscription?.questions_limit,
        questions_used: subscription?.questions_used,
        limitCheckPasses: !(subscription?.questions_limit > 0 && subscription.questions_used >= subscription.questions_limit)
      });
      
      // Fix for pro users who have wrong questions_limit in database
      if (subscription?.plan_type?.includes('pro') && subscription?.questions_limit !== -1) {
        console.log('[AppContext] Pro user has wrong limit, attempting to fix...');
        await supabaseService.updateSubscription(authUser.id, subscription.plan_type as any, 'active');
      }
      
      // Only check limits if questions_limit is positive (not -1 for unlimited)
      if (subscription?.questions_limit > 0 && subscription.questions_used >= subscription.questions_limit) {
        // Double-check for pro users
        if (subscription?.plan_type?.includes('pro')) {
          console.log('[AppContext] Pro user bypassing limit check');
        } else {
          throw new Error('Question limit reached. Please upgrade your plan.');
        }
      }

      // Create question in Supabase
      const { data: newQuestion, error } = await supabaseService.createQuestion(
        authUser.id,
        categoryId,
        title, // title
        content, // content
        isAnonymous,
        'medium', // default urgency
        'wizzmo', // vertical
        preferredMentorId, // preferred mentor ID
        preferredMentorIds // preferred mentor IDs array
      );

      if (error) throw error;
      if (!newQuestion) throw new Error('Failed to create question');

      // Increment question count
      await supabaseService.incrementQuestionCount(authUser.id);

      // Add to local state
      const question: Question = {
        id: newQuestion.id,
        text: newQuestion.content,
        category: categoryMap.get(newQuestion.category_id)?.name || newQuestion.category_id,
        isAnonymous: newQuestion.is_anonymous,
        timestamp: new Date(newQuestion.created_at),
        status: 'pending',
      };

      setQuestions(prev => [...prev, question]);

      // Update user's question count
      setUser(prev => prev ? {
        ...prev,
        questionsAsked: prev.questionsAsked + 1,
        hasUsedFreeQuestion: true,
      } : null);

      console.log('[AppContext] Question created:', newQuestion.id);
      return newQuestion.id;
    } catch (error) {
      console.error('[AppContext] Error submitting question:', error);
      throw error;
    }
  };

  /**
   * Send a message in a chat
   * Creates message in Supabase and updates local state
   */
  const sendMessage = async (chatId: string, text: string) => {
    if (!authUser) return;

    try {
      console.log('[AppContext] Sending message in chat:', chatId);

      // Create message in Supabase
      const { data: newMessage, error } = await supabaseService.sendMessage(
        chatId,
        authUser.id,
        text
      );

      if (error) throw error;
      if (!newMessage) return;

      // Message will be added to state via real-time subscription
      // But we'll add it immediately for better UX
      const message: Message = {
        id: newMessage.id,
        chatId,
        text: newMessage.content,
        senderId: authUser.id,
        senderName: user?.name || 'you',
        senderAvatar: user?.avatar || '🥺',
        isWizzmo: false,
        timestamp: new Date(newMessage.created_at),
        isMe: true,
      };

      setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, message],
            lastMessage: message,
          };
        }
        return chat;
      }));

      console.log('[AppContext] Message sent');
    } catch (error) {
      console.error('[AppContext] Error sending message:', error);
    }
  };

  /**
   * Mark all messages in a chat as read
   */
  const markChatAsRead = async (chatId: string) => {
    if (!authUser) return;

    try {
      console.log('[AppContext] Marking chat as read:', chatId);

      // Mark messages as read in Supabase
      const { error } = await supabaseService.markMessagesAsRead(chatId, authUser.id);

      if (error) throw error;

      // Update local state
      setChats(prev => prev.map(chat =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      ));

      console.log('[AppContext] Chat marked as read');
    } catch (error) {
      console.error('[AppContext] Error marking chat as read:', error);
    }
  };

  /**
   * Resolve a chat session
   * Updates session status to resolved in Supabase
   */
  const resolvChat = async (chatId: string) => {
    try {
      console.log('[AppContext] Resolving chat:', chatId);

      // Update session status in Supabase
      const { error } = await supabaseService.updateSessionStatus(chatId, 'resolved');

      if (error) throw error;

      // Update local state
      setChats(prev => prev.map(chat =>
        chat.id === chatId ? { ...chat, status: 'resolved' } : chat
      ));

      setQuestions(prev => prev.map(q =>
        q.chatId === chatId ? { ...q, status: 'resolved' } : q
      ));

      console.log('[AppContext] Chat resolved');
    } catch (error) {
      console.error('[AppContext] Error resolving chat:', error);
    }
  };

  /**
   * Submit rating for a resolved chat
   * Creates rating in Supabase and updates mentor stats
   */
  const submitRating = async (chatId: string, rating: number, feedback?: string) => {
    if (!authUser) return;

    try {
      console.log('[AppContext] Submitting rating for chat:', chatId, rating);

      // Find the chat to get mentor ID
      const chat = chats.find(c => c.id === chatId);
      if (!chat || chat.participants.length === 0) {
        throw new Error('Chat not found');
      }

      const mentorId = chat.participants[0].id;

      // Submit rating to Supabase
      const { error } = await supabaseService.submitRating(
        chatId,
        authUser.id,
        mentorId,
        rating,
        feedback || null
      );

      if (error) throw error;

      // Ensure chat is resolved
      await supabaseService.updateSessionStatus(chatId, 'resolved');

      // Update local state
      setChats(prev => prev.map(c =>
        c.id === chatId
          ? {
              ...c,
              status: 'resolved',
              rating,
              ratingFeedback: feedback,
            }
          : c
      ));

      setQuestions(prev => prev.map(q =>
        q.chatId === chatId ? { ...q, status: 'resolved' } : q
      ));

      console.log('[AppContext] Rating submitted');
    } catch (error) {
      console.error('[AppContext] Error submitting rating:', error);
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Map database question status to app status
   */
  const mapQuestionStatus = (dbStatus: string): Question['status'] => {
    switch (dbStatus) {
      case 'pending':
        return 'pending';
      case 'assigned':
        return 'matched';
      case 'active':
        return 'active';
      case 'resolved':
        return 'resolved';
      default:
        return 'pending';
    }
  };

  /**
   * Get emoji for category
   */
  const getEmojiForCategory = (category: string): string => {
    const emojiMap: { [key: string]: string } = {
      'boy drama': '💕',
      'roomie drama': '🏠',
      'friend issues': '👯',
      'family stuff': '👨‍👩‍👧',
      'college stress': '📚',
      'mental health': '🧠',
    };
    return emojiMap[category.toLowerCase()] || '💭';
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  return (
    <AppContext.Provider value={{
      user,
      questions,
      chats,
      availableWizzmos,
      trendingTopics,
      loading,
      submitQuestion,
      sendMessage,
      markChatAsRead,
      resolvChat,
      submitRating,
    }}>
      {children}
    </AppContext.Provider>
  );
};

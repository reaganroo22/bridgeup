import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMode } from '@/contexts/UserModeContext';
import { supabase } from '@/lib/supabase';

export interface BadgeCounts {
  unreadMessages: number;
  pendingQuestions: number;
}

export function useBadgeCounts(): BadgeCounts {
  const { user } = useAuth();
  const { currentMode } = useUserMode();
  const [counts, setCounts] = useState<BadgeCounts>({
    unreadMessages: 0,
    pendingQuestions: 0,
  });

  useEffect(() => {
    if (!user) {
      setCounts({ unreadMessages: 0, pendingQuestions: 0 });
      return;
    }

    const fetchCounts = async () => {
      try {
        // Fetch unread messages count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .eq('read', false);

        // Fetch pending questions count (for mentors)
        let pendingCount = 0;
        if (currentMode === 'mentor') {
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending')
            .is('mentor_id', null);
          
          pendingCount = count || 0;
        }

        setCounts({
          unreadMessages: unreadCount || 0,
          pendingQuestions: pendingCount,
        });
      } catch (error) {
        console.error('[useBadgeCounts] Error fetching counts:', error);
        setCounts({ unreadMessages: 0, pendingQuestions: 0 });
      }
    };

    // Initial fetch
    fetchCounts();

    // Set up real-time subscription for messages
    const messagesSubscription = supabase
      .channel('badge-messages')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        }, 
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    // Set up real-time subscription for questions (for mentors)
    const questionsSubscription = currentMode === 'mentor' 
      ? supabase
          .channel('badge-questions')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'questions'
            }, 
            () => {
              fetchCounts();
            }
          )
          .subscribe()
      : null;

    // Refresh every 30 seconds as fallback
    const interval = setInterval(fetchCounts, 30000);

    return () => {
      messagesSubscription.unsubscribe();
      if (questionsSubscription) {
        questionsSubscription.unsubscribe();
      }
      clearInterval(interval);
    };
  }, [user, currentMode]);

  return counts;
}
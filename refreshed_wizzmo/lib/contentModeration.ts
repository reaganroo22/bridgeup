/**
 * Content Moderation Service
 * Basic keyword filtering for questions, chats, and trending content
 */

// Inappropriate content keywords - keep this list updated
const INAPPROPRIATE_KEYWORDS = [
  // Explicit content
  'fuck', 'shit', 'bitch', 'damn', 'hell', 'ass', 'crap',
  // Harassment terms
  'kill yourself', 'kys', 'die', 'hate you', 'stupid', 'idiot', 'retard',
  // Inappropriate requests
  'nude', 'naked', 'sex', 'porn', 'xxx', 'adult', 'hookup',
  // Bullying terms
  'ugly', 'fat', 'loser', 'worthless', 'pathetic',
  // Spam indicators
  'click here', 'buy now', 'make money', 'get rich', 'free money',
  // Add more as needed
];

export interface ModerationResult {
  isApproved: boolean;
  flaggedWords: string[];
  severity: 'low' | 'medium' | 'high';
  reason?: string;
}

/**
 * Check content for inappropriate keywords
 */
export function moderateContent(content: string): ModerationResult {
  if (!content || typeof content !== 'string') {
    return {
      isApproved: true,
      flaggedWords: [],
      severity: 'low'
    };
  }

  const lowerContent = content.toLowerCase();
  const flaggedWords: string[] = [];

  // Check for inappropriate keywords
  for (const keyword of INAPPROPRIATE_KEYWORDS) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      flaggedWords.push(keyword);
    }
  }

  // Determine severity
  let severity: 'low' | 'medium' | 'high' = 'low';
  if (flaggedWords.length >= 3) {
    severity = 'high';
  } else if (flaggedWords.length >= 1) {
    severity = 'medium';
  }

  // Check for high-severity terms
  const highSeverityTerms = ['kill yourself', 'kys', 'nude', 'naked', 'porn'];
  const hasHighSeverityTerm = flaggedWords.some(word => 
    highSeverityTerms.includes(word.toLowerCase())
  );

  if (hasHighSeverityTerm) {
    severity = 'high';
  }

  const isApproved = flaggedWords.length === 0 || severity === 'low';

  return {
    isApproved,
    flaggedWords,
    severity,
    reason: flaggedWords.length > 0 ? `Flagged words: ${flaggedWords.join(', ')}` : undefined
  };
}

/**
 * Clean content by replacing flagged words with asterisks
 */
export function cleanContent(content: string): string {
  if (!content) return content;

  let cleanedContent = content;
  
  for (const keyword of INAPPROPRIATE_KEYWORDS) {
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    cleanedContent = cleanedContent.replace(regex, '*'.repeat(keyword.length));
  }

  return cleanedContent;
}

/**
 * Report content for manual review
 */
export async function reportContent(
  reporterId: string,
  reportedUserId: string,
  reportType: 'harassment' | 'inappropriate_content' | 'spam' | 'fake_profile' | 'other',
  content?: string,
  contextType?: 'message' | 'question' | 'profile' | 'other',
  contextId?: string
) {
  const { supabase } = await import('./supabase');
  
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: reporterId,
        reported_user_id: reportedUserId,
        report_type: reportType,
        content,
        context_type: contextType,
        context_id: contextId
      })
      .select()
      .single();

    if (error) {
      console.error('[ContentModeration] Error creating report:', error);
      return { success: false, error };
    }

    console.log('[ContentModeration] ✅ Report created:', data.id);
    
    // Send email notification to moderation team
    try {
      const { triggerContentReportAlert } = await import('./emailService');
      await triggerContentReportAlert({
        reportId: data.id,
        reportType: reportType,
        reportedUserId: reportedUserId,
        reporterId: reporterId,
        content: content,
        contextType: contextType
      });
      console.log('[ContentModeration] ✅ Moderation alert email sent');
    } catch (emailError) {
      console.error('[ContentModeration] Email notification error (non-blocking):', emailError);
    }

    return { success: true, data };
  } catch (error) {
    console.error('[ContentModeration] Error reporting content:', error);
    return { success: false, error };
  }
}

/**
 * Block a user
 */
export async function blockUser(blockerId: string, blockedId: string) {
  const { supabase } = await import('./supabase');
  
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .insert({
        blocker_id: blockerId,
        blocked_id: blockedId
      })
      .select()
      .single();

    if (error) {
      console.error('[ContentModeration] Error blocking user:', error);
      return { success: false, error };
    }

    console.log('[ContentModeration] ✅ User blocked:', data.id);
    return { success: true, data };
  } catch (error) {
    console.error('[ContentModeration] Error blocking user:', error);
    return { success: false, error };
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(blockerId: string, blockedId: string) {
  const { supabase } = await import('./supabase');
  
  try {
    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId);

    if (error) {
      console.error('[ContentModeration] Error unblocking user:', error);
      return { success: false, error };
    }

    console.log('[ContentModeration] ✅ User unblocked');
    return { success: true };
  } catch (error) {
    console.error('[ContentModeration] Error unblocking user:', error);
    return { success: false, error };
  }
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const { supabase } = await import('./supabase');
  
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', blockerId)
      .eq('blocked_id', blockedId)
      .maybeSingle();

    if (error) {
      console.error('[ContentModeration] Error checking block status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('[ContentModeration] Error checking block status:', error);
    return false;
  }
}

/**
 * Get blocked users for a user
 */
export async function getBlockedUsers(userId: string) {
  const { supabase } = await import('./supabase');
  
  try {
    const { data, error } = await supabase
      .from('blocked_users')
      .select(`
        blocked_id,
        created_at,
        blocked_user:users!blocked_users_blocked_id_fkey (
          id,
          full_name,
          username,
          avatar_url
        )
      `)
      .eq('blocker_id', userId);

    if (error) {
      console.error('[ContentModeration] Error fetching blocked users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[ContentModeration] Error fetching blocked users:', error);
    return [];
  }
}
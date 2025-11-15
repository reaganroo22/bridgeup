/**
 * Google Forms Webhook Integration for React Native/Expo
 * Handles real-time processing of mentor applications
 */

import { supabase } from './supabase';

// Types
interface GoogleFormsWebhookPayload {
  timestamp: string;
  email: string;
  responses: {
    [questionId: string]: string | string[];
  };
}

interface ProcessedApplication {
  email: string;
  full_name: string;
  university: string;
  graduation_year: number;
  age_confirmed: boolean;
  comfortable_with_college_girl_perspective: boolean;
  topics_comfortable_with: string[];
  prior_experience: string;
  session_formats: string[];
  hours_per_week: string;
  languages?: string;
  social_portfolio_links?: string;
  agreement_accepted: boolean;
}

/**
 * Main webhook handler for Google Forms submissions
 */
export async function handleGoogleFormsWebhook(payload: GoogleFormsWebhookPayload) {
  try {
    console.log('🎯 Processing Google Forms webhook:', payload.email);
    
    // Transform webhook data to application format
    const applicationData = transformWebhookPayload(payload);
    
    // Validate the application
    const validation = validateApplicationData(applicationData);
    if (!validation.isValid) {
      console.error('❌ Validation failed:', validation.errors);
      return {
        success: false,
        error: 'Validation failed',
        details: validation.errors
      };
    }
    
    // Check for duplicates
    const duplicateCheck = await checkForDuplicateApplication(applicationData.email);
    if (duplicateCheck.exists) {
      console.log(`⚠️ Duplicate application detected for ${applicationData.email}`);
      return {
        success: false,
        error: 'Application already exists',
        existing_status: duplicateCheck.status
      };
    }
    
    // Insert into database
    const insertResult = await insertApplication(applicationData);
    if (!insertResult.success) {
      throw new Error(`Database insert failed: ${insertResult.error}`);
    }
    
    console.log('✅ Application processed successfully:', insertResult.data.id);
    
    // Send notifications
    await Promise.all([
      sendApplicantConfirmation(applicationData),
      notifyAdminsNewApplication(applicationData, insertResult.data.id)
    ]);
    
    return {
      success: true,
      application_id: insertResult.data.id,
      message: 'Application processed successfully'
    };
    
  } catch (error) {
    console.error('💥 Error processing webhook:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Transform Google Forms webhook payload to application format
 */
function transformWebhookPayload(payload: GoogleFormsWebhookPayload): ProcessedApplication {
  const responses = payload.responses;
  
  return {
    email: payload.email.toLowerCase().trim(),
    full_name: extractResponse(responses, 'full_name', '').trim(),
    university: extractResponse(responses, 'university', '').trim(),
    graduation_year: parseInt(extractResponse(responses, 'graduation_year', '2024')),
    age_confirmed: extractResponse(responses, 'age_confirmation', '') === 'I confirm I am 18 or older',
    comfortable_with_college_girl_perspective: extractResponse(responses, 'college_girl_perspective', '') === 'Yes',
    topics_comfortable_with: parseTopicsFromResponse(extractResponse(responses, 'topics', '')),
    prior_experience: extractResponse(responses, 'prior_experience', '').trim(),
    session_formats: parseSessionFormatsFromResponse(extractResponse(responses, 'session_formats', '')),
    hours_per_week: extractResponse(responses, 'hours_per_week', '').trim(),
    languages: extractResponse(responses, 'languages', 'English').trim(),
    social_portfolio_links: extractResponse(responses, 'social_links', '') || null,
    agreement_accepted: extractResponse(responses, 'agreement', '') === 'I agree'
  };
}

/**
 * Extract response by question identifier
 */
function extractResponse(responses: { [key: string]: string | string[] }, key: string, defaultValue: string): string {
  // This mapping depends on your Google Form question IDs
  // You'll need to update these based on your actual form structure
  const questionMap: { [key: string]: string } = {
    'full_name': 'What is your full name?',
    'university': 'What university do you currently attend or recently graduate from?',
    'graduation_year': 'What is your graduation year?',
    'age_confirmation': 'Age confirmation (select one)',
    'college_girl_perspective': 'Are you comfortable advising from a \'college girl\' perspective?',
    'topics': 'Which topics are you comfortable advising on? (Select all that apply)',
    'prior_experience': 'Do you have prior advice/listening/mentoring experience? Please describe.',
    'session_formats': 'Which session formats can you offer?',
    'hours_per_week': 'How many hours per week can you dedicate to advising?',
    'languages': 'Languages you can advise in (optional)',
    'social_links': 'Social/portfolio links (optional)',
    'agreement': 'Agreement (required)'
  };
  
  const questionText = questionMap[key];
  if (questionText && responses[questionText]) {
    const response = responses[questionText];
    return Array.isArray(response) ? response.join(', ') : response;
  }
  
  return defaultValue;
}

/**
 * Parse topics from response string
 */
function parseTopicsFromResponse(topicsString: string): string[] {
  if (!topicsString) return [];
  
  const topicMap: { [key: string]: string } = {
    'Texting analysis & response crafting': 'texting_analysis',
    'First dates & planning': 'first_dates',
    'Red flags / green flags': 'red_green_flags',
    'Breakup support': 'breakup_support',
    'Situationship clarity': 'situationship_clarity',
    'Confidence & appearance tips': 'confidence_appearance',
    'Social dynamics & parties': 'social_dynamics',
    'Roommate/friend drama': 'roommate_friend_drama',
    'Faith/values & boundaries (non-therapeutic)': 'faith_values_boundaries',
    'Long-distance strategies': 'long_distance_strategies'
  };
  
  return topicsString
    .split(',')
    .map(topic => topic.trim())
    .map(topic => topicMap[topic] || topic.toLowerCase().replace(/[^a-z0-9]/g, '_'))
    .filter(Boolean);
}

/**
 * Parse session formats from response string
 */
function parseSessionFormatsFromResponse(formatsString: string): string[] {
  if (!formatsString) return [];
  
  const formatMap: { [key: string]: string } = {
    'Async chat (within 24–48h)': 'async_chat',
    'Live audio': 'live_audio',
    'Live video': 'live_video'
  };
  
  return formatsString
    .split(',')
    .map(format => format.trim())
    .map(format => formatMap[format] || format.toLowerCase().replace(/[^a-z0-9]/g, '_'))
    .filter(Boolean);
}

/**
 * Validate application data
 */
function validateApplicationData(data: ProcessedApplication): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.email || !data.email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!data.full_name) {
    errors.push('Full name is required');
  }
  
  if (!data.university) {
    errors.push('University is required');
  }
  
  if (!data.graduation_year || data.graduation_year < 2020 || data.graduation_year > 2030) {
    errors.push('Valid graduation year is required');
  }
  
  if (!data.age_confirmed) {
    errors.push('Age confirmation is required (must be 18+)');
  }
  
  if (!data.agreement_accepted) {
    errors.push('Agreement acceptance is required');
  }
  
  if (!data.topics_comfortable_with || data.topics_comfortable_with.length === 0) {
    errors.push('At least one topic must be selected');
  }
  
  if (!data.session_formats || data.session_formats.length === 0) {
    errors.push('At least one session format must be selected');
  }
  
  if (!data.hours_per_week) {
    errors.push('Hours per week commitment is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check for duplicate applications
 */
async function checkForDuplicateApplication(email: string) {
  try {
    const { data, error } = await supabase
      .from('mentor_applications')
      .select('id, application_status, created_at')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    return {
      exists: data && data.length > 0,
      status: data?.[0]?.application_status || null,
      id: data?.[0]?.id || null
    };
    
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return { exists: false, status: null, id: null };
  }
}

/**
 * Insert application into database
 */
async function insertApplication(applicationData: ProcessedApplication) {
  try {
    const { data, error } = await supabase
      .from('mentor_applications')
      .insert([{
        ...applicationData,
        application_status: 'pending'
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
    
  } catch (error) {
    console.error('Database insert error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send confirmation email to applicant
 */
async function sendApplicantConfirmation(applicationData: ProcessedApplication) {
  try {
    // Insert notification for the applicant
    await supabase
      .from('notifications')
      .insert([{
        type: 'mentor_application_received',
        title: 'Application Received',
        body: `Thank you ${applicationData.full_name}! We'll review your mentor application within 24-48 hours.`,
        data: {
          email: applicationData.email,
          next_steps: 'approval_pending'
        }
      }]);
    
    console.log(`📧 Confirmation notification created for ${applicationData.email}`);
    
    // TODO: Integrate with actual email service (Resend, etc.)
    // This would send the actual email confirmation
    
  } catch (error) {
    console.error('Error sending applicant confirmation:', error);
  }
}

/**
 * Notify admins of new application
 */
async function notifyAdminsNewApplication(applicationData: ProcessedApplication, applicationId: string) {
  try {
    // Get admin users
    const { data: adminUsers } = await supabase
      .from('users')
      .select('id, email')
      .in('role', ['mentor', 'both']);
    
    if (adminUsers && adminUsers.length > 0) {
      // Create notifications for each admin
      const notifications = adminUsers.map(admin => ({
        user_id: admin.id,
        type: 'new_mentor_application',
        title: 'New Mentor Application',
        body: `${applicationData.full_name} from ${applicationData.university} applied to become a mentor`,
        data: {
          application_id: applicationId,
          applicant_email: applicationData.email,
          applicant_name: applicationData.full_name,
          university: applicationData.university,
          topics: applicationData.topics_comfortable_with
        }
      }));
      
      await supabase
        .from('notifications')
        .insert(notifications);
      
      console.log(`🔔 Created ${notifications.length} admin notifications`);
    }
    
  } catch (error) {
    console.error('Error notifying admins:', error);
  }
}

/**
 * Webhook endpoint handler for Express/Expo server
 */
export function createWebhookEndpoint() {
  return async (req: any, res: any) => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }
      
      // Optional: Verify webhook signature for security
      const signature = req.headers['x-webhook-signature'];
      const expectedSignature = process.env.GOOGLE_FORMS_WEBHOOK_SECRET;
      
      if (expectedSignature && signature !== expectedSignature) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const result = await handleGoogleFormsWebhook(req.body);
      
      if (result.success) {
        res.status(201).json(result);
      } else {
        res.status(400).json(result);
      }
      
    } catch (error) {
      console.error('Webhook endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
}

/**
 * Test function for development
 */
export async function testWebhookWithSampleData() {
  const samplePayload: GoogleFormsWebhookPayload = {
    timestamp: new Date().toISOString(),
    email: 'test.webhook@example.com',
    responses: {
      'What is your full name?': 'Webhook Test User',
      'What university do you currently attend or recently graduate from?': 'Webhook University',
      'What is your graduation year?': '2024',
      'Age confirmation (select one)': 'I confirm I am 18 or older',
      'Are you comfortable advising from a \'college girl\' perspective?': 'Yes',
      'Which topics are you comfortable advising on? (Select all that apply)': 'Texting analysis & response crafting, First dates & planning',
      'Do you have prior advice/listening/mentoring experience? Please describe.': 'Test webhook experience',
      'Which session formats can you offer?': 'Async chat (within 24–48h), Live audio',
      'How many hours per week can you dedicate to advising?': '4–6 hours per week',
      'Languages you can advise in (optional)': 'English',
      'Agreement (required)': 'I agree'
    }
  };
  
  const result = await handleGoogleFormsWebhook(samplePayload);
  console.log('🧪 Webhook test result:', result);
  
  return result;
}
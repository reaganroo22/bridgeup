import { supabase } from './supabase';
import emailService from './emailService';

// Types for the mentor application
export interface MentorApplication {
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
  application_status: 'pending' | 'approved' | 'rejected';
}

export interface GoogleFormResponse {
  'Email': string;
  'What is your full name?': string;
  'What university do you currently attend or recently graduate from?': string;
  'What is your graduation year?': string;
  'Age confirmation (select one)': string;
  'Are you comfortable advising from a \'college girl\' perspective?': string;
  'Which topics are you comfortable advising on? (Select all that apply)': string;
  'Do you have prior advice/listening/mentoring experience? Please describe.': string;
  'Which session formats can you offer?': string;
  'How many hours per week can you dedicate to advising?': string;
  'Languages you can advise in (optional)'?: string;
  'Social/portfolio links (optional)'?: string;
  'Agreement (required)': string;
}

// Process Google Form CSV data
export function processFormResponses(csvData: GoogleFormResponse[]): MentorApplication[] {
  const responses: MentorApplication[] = [];
  
  csvData.forEach(row => {
    const response: MentorApplication = {
      email: row['Email'].trim().toLowerCase(),
      full_name: row['What is your full name?'].trim(),
      university: row['What university do you currently attend or recently graduate from?'].trim(),
      graduation_year: parseInt(row['What is your graduation year?']),
      age_confirmed: row['Age confirmation (select one)'] === 'I confirm I am 18 or older',
      comfortable_with_college_girl_perspective: row['Are you comfortable advising from a \'college girl\' perspective?'] === 'Yes',
      topics_comfortable_with: parseTopics(row['Which topics are you comfortable advising on? (Select all that apply)']),
      prior_experience: row['Do you have prior advice/listening/mentoring experience? Please describe.'].trim(),
      session_formats: parseSessionFormats(row['Which session formats can you offer?']),
      hours_per_week: row['How many hours per week can you dedicate to advising?'].trim(),
      languages: row['Languages you can advise in (optional)']?.trim() || null,
      social_portfolio_links: row['Social/portfolio links (optional)']?.trim() || null,
      agreement_accepted: row['Agreement (required)'] === 'I agree',
      application_status: 'pending'
    };
    
    // Validate required fields
    if (response.email && response.full_name && response.university && 
        response.graduation_year && response.age_confirmed && 
        response.agreement_accepted) {
      responses.push(response);
    } else {
      console.warn('Skipping incomplete application:', response.email);
    }
  });
  
  return responses;
}

function parseTopics(topicsString: string): string[] {
  if (!topicsString) return [];
  
  const topicMap: Record<string, string> = {
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
  
  return topicsString.split(',').map(topic => {
    const trimmed = topic.trim();
    return topicMap[trimmed] || trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }).filter(Boolean);
}

function parseSessionFormats(formatsString: string): string[] {
  if (!formatsString) return [];
  
  const formatMap: Record<string, string> = {
    'Async chat (within 24–48h)': 'async_chat',
    'Live audio': 'live_audio',
    'Live video': 'live_video'
  };
  
  return formatsString.split(',').map(format => {
    const trimmed = format.trim();
    return formatMap[trimmed] || trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }).filter(Boolean);
}

// Insert applications into Supabase
export async function insertMentorApplications(applications: MentorApplication[]) {
  try {
    const { data, error } = await supabase
      .from('mentor_applications')
      .insert(applications)
      .select();
    
    if (error) {
      console.error('Error inserting applications:', error);
      return { success: false, error };
    }
    
    console.log(`Successfully inserted ${data.length} applications`);
    
    // Send application received emails
    for (const application of data) {
      try {
        await emailService.sendEmail('mentor_application_submitted', application.email, {
          firstName: application.full_name.split(' ')[0],
          fullName: application.full_name
        });
        console.log('✅ Application submitted email sent to:', application.email);
      } catch (emailError) {
        console.error('📧 Email notification error (non-blocking):', emailError);
      }
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('Database error:', err);
    return { success: false, error: err };
  }
}

// Check for duplicate emails
export async function checkDuplicateApplications(email: string) {
  const { data, error } = await supabase
    .from('mentor_applications')
    .select('id, email, application_status')
    .eq('email', email.toLowerCase())
    .single();
  
  return { exists: !!data, data, error };
}

// Get pending applications (admin function)
export async function getPendingApplications() {
  const { data, error } = await supabase
    .from('mentor_applications')
    .select('*')
    .eq('application_status', 'pending')
    .order('created_at', { ascending: true });
  
  return { data, error };
}

// Approve application and create mentor account
export async function approveApplication(applicationId: string, reviewerId: string) {
  try {
    // 1. Update application status
    const { error: updateError } = await supabase
      .from('mentor_applications')
      .update({
        application_status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId);
    
    if (updateError) throw updateError;
    
    // 2. Get application details
    const { data: application, error: fetchError } = await supabase
      .from('mentor_applications')
      .select('*')
      .eq('id', applicationId)
      .single();
    
    if (fetchError || !application) throw fetchError || new Error('Application not found');
    
    // 3. Check if user exists
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', application.email)
      .single();
    
    // 4. Create user if doesn't exist
    if (!user) {
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: application.email,
          full_name: application.full_name,
          username: generateUsername(application.full_name),
          university: application.university,
          graduation_year: application.graduation_year,
          role: 'mentor'
        })
        .select()
        .single();
      
      if (userError) throw userError;
      user = newUser;
    } else {
      // Update existing user to mentor role
      const { error: roleError } = await supabase
        .from('users')
        .update({ role: 'mentor' })
        .eq('id', user.id);
      
      if (roleError) throw roleError;
    }
    
    // 5. Create mentor profile
    const { error: profileError } = await supabase
      .from('mentor_profiles')
      .insert({
        user_id: user.id,
        verification_status: 'verified',
        specialization: 'dating_relationships',
        topics_comfortable_with: application.topics_comfortable_with,
        session_formats: application.session_formats,
        hours_per_week: application.hours_per_week,
        languages: application.languages ? application.languages.split(',').map(l => l.trim()) : ['English'],
        is_verified: true
      });
    
    if (profileError) throw profileError;
    
    // 6. Send approval email to new mentor
    try {
      await emailService.sendEmail('mentor_application_approved', application.email, {
        firstName: application.full_name.split(' ')[0],
        fullName: application.full_name,
        university: application.university
      });
      console.log('✅ Mentor approval email sent to:', application.email);
    } catch (emailError) {
      console.error('📧 Email notification error (non-blocking):', emailError);
    }
    
    return { success: true, userId: user.id };
  } catch (error) {
    console.error('Error approving application:', error);
    return { success: false, error };
  }
}

// Reject application
export async function rejectApplication(applicationId: string, reviewerId: string, notes?: string) {
  try {
    // 1. Update application status
    const { error } = await supabase
      .from('mentor_applications')
      .update({
        application_status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
        notes
      })
      .eq('id', applicationId);
    
    if (error) throw error;
    
    // 2. Get application details for email
    const { data: application, error: fetchError } = await supabase
      .from('mentor_applications')
      .select('email, full_name')
      .eq('id', applicationId)
      .single();
    
    if (!fetchError && application) {
      // 3. Send rejection email
      try {
        await emailService.sendEmail('mentor_application_rejected', application.email, {
          firstName: application.full_name.split(' ')[0],
          fullName: application.full_name,
          notes: notes
        });
        console.log('✅ Mentor rejection email sent to:', application.email);
      } catch (emailError) {
        console.error('📧 Email notification error (non-blocking):', emailError);
      }
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

function generateUsername(fullName: string): string {
  const base = fullName.toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 12);
  
  const suffix = Math.floor(Math.random() * 1000);
  return `${base}${suffix}`;
}

// Track conversion success rate
export async function trackConversionSuccess() {
  const { data: applications } = await supabase
    .from('mentor_applications')
    .select('application_status');
    
  const { data: mentors } = await supabase
    .from('mentor_profiles')
    .select('user_id')
    .eq('verification_status', 'verified');
    
  const approvedApps = applications?.filter(app => app.application_status === 'approved').length || 0;
  const verifiedMentors = mentors?.length || 0;
  
  const successRate = approvedApps > 0 ? (verifiedMentors / approvedApps) * 100 : 0;
  
  console.log(`Approved applications: ${approvedApps}`);
  console.log(`Verified mentors: ${verifiedMentors}`);
  console.log(`Conversion success rate: ${successRate.toFixed(2)}%`);
  
  return {
    approvedApplications: approvedApps,
    verifiedMentors,
    successRate: Math.round(successRate * 100) / 100
  };
}
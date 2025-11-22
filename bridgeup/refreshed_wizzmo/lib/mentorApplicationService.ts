import { supabase } from './supabase';

// Types for the mentor application system
export interface MentorApplication {
  id?: string;
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
  created_at?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  notes?: string;
}

export interface GoogleFormRow {
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

// Parse CSV data from Google Form export
export function parseGoogleFormCSV(csvText: string): GoogleFormRow[] {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const rows: GoogleFormRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row as GoogleFormRow);
    }
  }
  
  return rows;
}

// Parse a single CSV line handling quotes and commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Transform Google Form data to application format
export function transformFormData(formRows: GoogleFormRow[]): MentorApplication[] {
  return formRows.map(row => ({
    email: row['Email'].trim().toLowerCase(),
    full_name: row['What is your full name?'].trim(),
    university: row['What university do you currently attend or recently graduate from?'].trim(),
    graduation_year: parseInt(row['What is your graduation year?']) || 2024,
    age_confirmed: row['Age confirmation (select one)'] === 'I confirm I am 18 or older',
    comfortable_with_college_girl_perspective: row['Are you comfortable advising from a \'college girl\' perspective?'] === 'Yes',
    topics_comfortable_with: parseTopics(row['Which topics are you comfortable advising on? (Select all that apply)']),
    prior_experience: row['Do you have prior advice/listening/mentoring experience? Please describe.'].trim(),
    session_formats: parseSessionFormats(row['Which session formats can you offer?']),
    hours_per_week: row['How many hours per week can you dedicate to advising?'].trim(),
    languages: row['Languages you can advise in (optional)']?.trim() || 'English',
    social_portfolio_links: row['Social/portfolio links (optional)']?.trim() || null,
    agreement_accepted: row['Agreement (required)'] === 'I agree',
    application_status: 'pending' as const
  })).filter(app => 
    app.email && 
    app.full_name && 
    app.university && 
    app.age_confirmed && 
    app.agreement_accepted
  );
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
  
  // Split by semicolon or comma and clean up
  const topics = topicsString.split(/[;,]/).map(topic => topic.trim());
  
  return topics.map(topic => topicMap[topic] || topic.toLowerCase().replace(/[^a-z0-9]/g, '_')).filter(Boolean);
}

function parseSessionFormats(formatsString: string): string[] {
  if (!formatsString) return [];
  
  const formatMap: Record<string, string> = {
    'Async chat (within 24–48h)': 'async_chat',
    'Live audio': 'live_audio',
    'Live video': 'live_video'
  };
  
  const formats = formatsString.split(/[;,]/).map(format => format.trim());
  return formats.map(format => formatMap[format] || format.toLowerCase().replace(/[^a-z0-9]/g, '_')).filter(Boolean);
}

// Database operations
export async function insertApplications(applications: MentorApplication[]) {
  try {
    const { data, error } = await supabase
      .from('mentor_applications')
      .insert(applications)
      .select();
    
    if (error) throw error;
    
    console.log(`✅ Successfully inserted ${data.length} applications`);
    return { success: true, data, count: data.length };
  } catch (error) {
    console.error('❌ Error inserting applications:', error);
    return { success: false, error };
  }
}

export async function getPendingApplications() {
  try {
    const { data, error } = await supabase
      .from('mentor_applications')
      .select('*')
      .eq('application_status', 'pending')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error fetching pending applications:', error);
    return { success: false, error };
  }
}

export async function getAllApplications() {
  try {
    const { data, error } = await supabase
      .from('mentor_applications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error fetching all applications:', error);
    return { success: false, error };
  }
}

export async function approveApplication(applicationId: string, reviewerId: string) {
  try {
    const { data, error } = await supabase.rpc('process_mentor_application', {
      p_application_id: applicationId,
      p_reviewer_id: reviewerId
    });
    
    if (error) throw error;
    
    console.log('✅ Application approved:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error approving application:', error);
    return { success: false, error };
  }
}

export async function rejectApplication(applicationId: string, reviewerId: string, notes?: string) {
  try {
    const { data, error } = await supabase.rpc('reject_mentor_application', {
      p_application_id: applicationId,
      p_reviewer_id: reviewerId,
      p_notes: notes
    });
    
    if (error) throw error;
    
    console.log('✅ Application rejected:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error rejecting application:', error);
    return { success: false, error };
  }
}

export async function getConversionStats() {
  try {
    const { data, error } = await supabase.rpc('get_mentor_conversion_stats');
    
    if (error) throw error;
    
    console.log('📊 Conversion Stats:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error fetching conversion stats:', error);
    return { success: false, error };
  }
}

export async function checkDuplicateApplication(email: string) {
  try {
    const { data, error } = await supabase
      .from('mentor_applications')
      .select('id, email, application_status, created_at')
      .eq('email', email.toLowerCase())
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    return { 
      success: true, 
      exists: data && data.length > 0,
      existing: data?.[0] || null
    };
  } catch (error) {
    console.error('❌ Error checking duplicate application:', error);
    return { success: false, error };
  }
}

// Utility function for batch processing
export async function processBatchFromCSV(csvText: string, options: { skipDuplicates?: boolean } = {}) {
  try {
    console.log('🔄 Starting batch processing from CSV...');
    
    // Parse and transform data
    const formRows = parseGoogleFormCSV(csvText);
    const applications = transformFormData(formRows);
    
    console.log(`📋 Parsed ${applications.length} applications from CSV`);
    
    // Handle duplicates if requested
    if (options.skipDuplicates) {
      const uniqueApplications = [];
      const duplicates = [];
      
      for (const app of applications) {
        const duplicateCheck = await checkDuplicateApplication(app.email);
        if (duplicateCheck.success && !duplicateCheck.exists) {
          uniqueApplications.push(app);
        } else {
          duplicates.push({ email: app.email, existing: duplicateCheck.existing });
        }
      }
      
      console.log(`📊 Found ${uniqueApplications.length} new applications, ${duplicates.length} duplicates`);
      
      if (uniqueApplications.length > 0) {
        const insertResult = await insertApplications(uniqueApplications);
        return {
          success: true,
          inserted: insertResult.count || 0,
          duplicates: duplicates.length,
          total_processed: applications.length
        };
      } else {
        return {
          success: true,
          inserted: 0,
          duplicates: duplicates.length,
          total_processed: applications.length,
          message: 'No new applications to insert'
        };
      }
    } else {
      // Insert all applications
      const insertResult = await insertApplications(applications);
      return {
        success: insertResult.success,
        inserted: insertResult.count || 0,
        total_processed: applications.length,
        error: insertResult.error
      };
    }
  } catch (error) {
    console.error('❌ Error in batch processing:', error);
    return { success: false, error };
  }
}
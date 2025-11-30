import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://miygmdboiesbxwlqgnsx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1peWdtZGJvaWVzYnh3bHFnbnN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNjY1MywiZXhwIjoyMDc1NDgyNjUzfQ._CA9e584ZPcUZeVT_oq_uDJFv-QQU0Pk8vMD6f72d2s';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract form data
    const {
      firstName,
      lastName,
      email,
      university,
      year,
      major,
      whyJoin,
      experience,
      topics,
      instagram,
      referral
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !university || !year || !major || !whyJoin || !experience || !topics?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Prepare application data for database
    const applicationData = {
      email: email.toLowerCase().trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`,
      university: university.trim(),
      graduation_year: year,
      age_confirmed: 'Yes', // Assuming all applicants confirm age
      comfortable_college_girl: whyJoin.trim(),
      topics: topics,
      boundaries_will_not_cover: null, // Will be filled during in-app onboarding
      experience: experience.trim(),
      formats: ['Text'], // Default format, can be updated during onboarding
      availability: 'Flexible', // Default, can be updated during onboarding
      languages: 'English', // Default, can be updated during onboarding
      social_links: instagram ? `https://instagram.com/${instagram.replace('@', '')}` : null,
      agreement: ['Terms accepted'], // Default agreement
      application_status: 'pending',
      submitted_at: new Date().toISOString()
    };

    // Check if email already has an application
    const { data: existingApplication } = await supabase
      .from('mentor_applications')
      .select('id, application_status')
      .eq('email', applicationData.email)
      .single();

    if (existingApplication) {
      return NextResponse.json(
        { 
          error: 'An application with this email already exists',
          status: existingApplication.application_status
        },
        { status: 409 }
      );
    }

    // Insert application into database
    const { data, error } = await supabase
      .from('mentor_applications')
      .insert(applicationData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      );
    }

    // Send confirmation email (optional - could be done via database trigger)
    // For now, just return success

    return NextResponse.json(
      { 
        success: true,
        message: 'Application submitted successfully',
        applicationId: data.id
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Configure route as dynamic
export const dynamic = 'force-dynamic';

// Supabase configuration
const supabaseUrl = 'https://miygmdboiesbxwlqgnsx.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1peWdtZGJvaWVzYnh3bHFnbnN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNjY1MywiZXhwIjoyMDc1NDgyNjUzfQ._CA9e584ZPcUZeVT_oq_uDJFv-QQU0Pk8vMD6f72d2s';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Add GET endpoint for testing
export async function GET() {
  console.log('[API] GET request to mentor-application endpoint');
  return NextResponse.json({ 
    message: 'Mentor application API endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
}

export async function POST(request: NextRequest) {
  console.log('[API] === MENTOR APPLICATION POST ENDPOINT CALLED ===');
  
  try {
    console.log('[API] 1. Parsing request body...');
    const body = await request.json();
    console.log('[API] 2. Request body parsed successfully:', JSON.stringify(body, null, 2));
    
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

    console.log('[API] 3. Validating required fields...');
    console.log('[API] Field check:', { firstName: !!firstName, lastName: !!lastName, email: !!email, university: !!university, year: !!year, major: !!major, whyJoin: !!whyJoin, experience: !!experience, topics: topics?.length });
    
    // Validate required fields (only check what the form actually collects)
    if (!firstName || !lastName || !email || !university || !year || !whyJoin) {
      console.log('[API] ❌ Validation failed - missing required fields');
      console.log('[API] Missing:', { firstName: !firstName, lastName: !lastName, email: !email, university: !university, year: !year, whyJoin: !whyJoin });
      return NextResponse.json(
        { error: 'Missing required fields. Please fill out all required fields.' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Prepare application data for database (FIXED: Only use fields that exist after cleanup)
    const applicationData = {
      email: email.toLowerCase().trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      university: university.trim(),
      graduation_year: year.toString(), // Keep as string to match database
      why_join: whyJoin.trim(),
      instagram: instagram || null,
      confirm_woman: true, // Assuming they confirmed during form
      confirm_advice: true, // Assuming they confirmed during form
      major: major || null,
      referral: referral || null,
      application_status: 'pending',
      submitted_at: new Date().toISOString()
    };

    console.log('[API] 4. Checking for existing applications...');
    // Check if email already has an application
    const { data: existingApplication, error: checkError } = await supabase
      .from('mentor_applications')
      .select('id, application_status')
      .eq('email', applicationData.email)
      .single();
    
    console.log('[API] 5. Existing application check result:', { existingApplication, checkError: checkError?.code });

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
      console.error('[API] Supabase error:', error);
      return NextResponse.json(
        { 
          error: 'Failed to submit application', 
          details: error.message,
          supabaseError: error 
        },
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
    console.error('[API] Critical error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
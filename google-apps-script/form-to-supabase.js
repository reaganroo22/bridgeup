/**
 * Simple Google Form to Supabase Script
 * This script ONLY processes form submissions and sends them to Supabase
 * No sheet editing, no complex permissions needed
 */

// Your Supabase credentials - WIZZMO DATABASE
const SUPABASE_URL = 'https://miygmdboiesbxwlqgnsx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1peWdtZGJvaWVzYnh3bHFnbnN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNjY1MywiZXhwIjoyMDc1NDgyNjUzfQ._CA9e584ZPcUZeVT_oq_uDJFv-QQU0Pk8vMD6f72d2s';

/**
 * Called when Google Form is submitted
 */
function onFormSubmit(e) {
  console.log('Form submitted!');
  
  try {
    // Get form responses
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    
    // Extract email and motivation from form
    let email = '';
    let motivation = '';
    
    itemResponses.forEach(function(itemResponse) {
      const question = itemResponse.getItem().getTitle();
      const answer = itemResponse.getResponse();
      
      console.log('Question: ' + question);
      console.log('Answer: ' + answer);
      
      // Map your form questions to variables
      if (question.toLowerCase().includes('email')) {
        email = answer;
      } else if (question.toLowerCase().includes('good wizzmo') || question.toLowerCase().includes('mentor')) {
        motivation = answer;
      }
    });
    
    console.log('Extracted email: ' + email);
    console.log('Extracted motivation: ' + motivation);
    
    // Validate we got the required fields
    if (!email || !motivation) {
      console.error('Missing required fields - email: ' + email + ', motivation: ' + motivation);
      return;
    }
    
    // Send to Supabase
    const success = sendToSupabase(email, motivation);
    
    if (success) {
      console.log('SUCCESS: Application sent to Supabase');
      sendConfirmationEmail(email);
    } else {
      console.error('FAILED: Could not send to Supabase');
    }
    
  } catch (error) {
    console.error('Error processing form: ' + error.toString());
  }
}

/**
 * Send application data to Supabase
 */
function sendToSupabase(email, motivation) {
  try {
    const url = SUPABASE_URL + '/rest/v1/mentor_applications';
    
    const data = {
      email: email.toLowerCase().trim(),
      full_name: email.split('@')[0], // Use email prefix as temporary name
      university: 'To be provided during onboarding',
      graduation_year: '2025',
      age_confirmed: 'Yes',
      comfortable_college_girl: motivation.trim(), // Use motivation for this field
      topics: ['Dating', 'Relationships'], // Default topics
      experience: motivation.trim(),
      formats: ['Text', 'Video'], // Default formats
      availability: 'Flexible',
      agreement: ['Terms accepted'],
      application_status: 'pending'
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      payload: JSON.stringify(data)
    };
    
    console.log('Sending to Supabase: ' + JSON.stringify(data));
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    console.log('Supabase response code: ' + responseCode);
    
    if (responseCode === 201 || responseCode === 200) {
      return true;
    } else {
      console.error('Supabase error: ' + response.getContentText());
      return false;
    }
    
  } catch (error) {
    console.error('Error sending to Supabase: ' + error.toString());
    return false;
  }
}

/**
 * Send confirmation email to applicant
 */
function sendConfirmationEmail(email) {
  try {
    const subject = 'Your Wizzmo Mentor Application Received! 🐻💕';
    const message = 'Hi!\n\nThanks for applying to become a Wizzmo mentor! 🐻\n\nThe bear is excited to review your application. We\'ll get back to you within 1-2 business days.\n\nThanks for wanting to help students!\nThe Wizzmo Team 🐻💕';
    
    MailApp.sendEmail(email, subject, message);
    console.log('Confirmation email sent to: ' + email);
    
  } catch (error) {
    console.error('Error sending email: ' + error.toString());
  }
}

/**
 * Test function - run this to test Supabase connection
 */
function testSupabase() {
  console.log('Testing connection to Supabase...');
  
  try {
    const url = SUPABASE_URL + '/rest/v1/mentor_applications?select=count';
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'apikey': SUPABASE_SERVICE_KEY
      }
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      console.log('✅ SUCCESS: Connected to Supabase!');
      return true;
    } else {
      console.log('❌ FAILED: Response code ' + responseCode);
      console.log('Response: ' + response.getContentText());
      return false;
    }
    
  } catch (error) {
    console.log('❌ ERROR: ' + error.toString());
    return false;
  }
}

/**
 * Test with fake data
 */
function testWithFakeData() {
  console.log('Testing with fake submission...');
  
  const success = sendToSupabase('test@example.com', 'I love helping students with dating advice!');
  
  if (success) {
    console.log('✅ Test submission successful!');
  } else {
    console.log('❌ Test submission failed!');
  }
}
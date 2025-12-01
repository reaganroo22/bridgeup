/**
 * Google Apps Script for Processing Mentor Applications
 * 
 * This script automatically processes mentor application form submissions:
 * 1. Captures form responses (email + motivation)
 * 2. Inserts into Supabase mentor_applications table
 * 3. Triggers database function to assign mentor role when approved
 * 
 * Setup Instructions:
 * 1. Create a new Google Apps Script project
 * 2. Replace the default code with this file
 * 3. Set up a trigger on form submission
 * 4. Add your Supabase URL and service key to Script Properties
 */

// Configuration - Set these in Script Properties
const SUPABASE_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_KEY');

/**
 * Main function triggered when Google Form is submitted
 * @param {Object} e - Form submission event
 */
function onFormSubmit(e) {
  console.log('Form submission received:', e);
  
  try {
    // Extract form responses
    const responses = e.response.getItemResponses();
    const formData = {};
    
    responses.forEach(response => {
      const question = response.getItem().getTitle();
      const answer = response.getResponse();
      formData[question] = answer;
    });
    
    // Map form fields to our expected structure
    const applicationData = {
      email: formData['Email'] || formData['email'] || '',
      motivation: formData['Why would you make a good Wizzmo?'] || formData['motivation'] || ''
    };
    
    console.log('Processed application data:', applicationData);
    
    // Validate required fields
    if (!applicationData.email || !applicationData.motivation) {
      throw new Error('Missing required fields: email or motivation');
    }
    
    // Insert into Supabase
    const result = insertMentorApplication(applicationData);
    
    if (result.success) {
      console.log('✅ Successfully processed mentor application for:', applicationData.email);
      
      // Optional: Send confirmation email to applicant
      sendConfirmationEmail(applicationData.email);
      
      // Optional: Notify admins of new application
      notifyAdmins(applicationData);
      
    } else {
      console.error('❌ Failed to process application:', result.error);
      
      // Optional: Send error notification to admins
      notifyAdminsOfError(applicationData, result.error);
    }
    
  } catch (error) {
    console.error('❌ Error processing form submission:', error);
    
    // Optional: Send error notification to admins
    notifyAdminsOfError(null, error.message);
  }
}

/**
 * Insert mentor application into Supabase database
 * @param {Object} applicationData - The application data
 * @returns {Object} Result object with success status
 */
function insertMentorApplication(applicationData) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/mentor_applications`;
    
    const payload = {
      email: applicationData.email.toLowerCase().trim(),
      motivation: applicationData.motivation.trim(),
      application_status: 'pending'
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      payload: JSON.stringify(payload)
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('Supabase response code:', responseCode);
    console.log('Supabase response:', responseText);
    
    if (responseCode === 201) {
      const data = JSON.parse(responseText);
      return { success: true, data: data };
    } else {
      return { success: false, error: `HTTP ${responseCode}: ${responseText}` };
    }
    
  } catch (error) {
    console.error('Error inserting to Supabase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send confirmation email to applicant
 * @param {string} email - Applicant's email
 */
function sendConfirmationEmail(email) {
  try {
    const subject = 'Your Wizzmo Mentor Application Has Been Received! 🐻💕';
    const body = `
Hi there!

Thank you for applying to become a Wizzmo mentor! The bear is so excited about your application. 

Here's what happens next:
🐻 Our team will review your application
💕 If approved, you'll get access to the mentor onboarding in the app
✨ You'll start helping college students with their biggest questions!

We'll get back to you within 1-2 business days.

Thanks for wanting to make a difference!

The Wizzmo Team 🐻
    `;
    
    MailApp.sendEmail(email, subject, body);
    console.log('✅ Confirmation email sent to:', email);
    
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
  }
}

/**
 * Notify admins of new application
 * @param {Object} applicationData - The application data
 */
function notifyAdmins(applicationData) {
  try {
    // Replace with your admin email(s)
    const adminEmails = ['admin@wizzmo.app']; // TODO: Replace with actual admin emails
    
    const subject = '🐻 New Wizzmo Mentor Application Received';
    const body = `
A new mentor application has been submitted!

Email: ${applicationData.email}
Motivation: ${applicationData.motivation}

Review and approve/reject in your admin panel.

🐻 The Wizzmo Bear Team
    `;
    
    adminEmails.forEach(adminEmail => {
      MailApp.sendEmail(adminEmail, subject, body);
    });
    
    console.log('✅ Admin notification sent');
    
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
  }
}

/**
 * Notify admins of processing errors
 * @param {Object} applicationData - The application data (if available)
 * @param {string} error - Error message
 */
function notifyAdminsOfError(applicationData, error) {
  try {
    // Replace with your admin email(s)
    const adminEmails = ['admin@wizzmo.app']; // TODO: Replace with actual admin emails
    
    const subject = '🚨 Wizzmo Mentor Application Processing Error';
    const body = `
There was an error processing a mentor application:

Error: ${error}
Application Data: ${JSON.stringify(applicationData, null, 2)}

Please check the Google Apps Script logs and Supabase for more details.

🐻 The Wizzmo System
    `;
    
    adminEmails.forEach(adminEmail => {
      MailApp.sendEmail(adminEmail, subject, body);
    });
    
    console.log('✅ Error notification sent to admins');
    
  } catch (error) {
    console.error('❌ Error sending error notification:', error);
  }
}

/**
 * Test function to verify Supabase connection
 * Run this manually to test your setup
 */
function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/mentor_applications?select=id&limit=1`;
    
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      }
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      console.log('✅ Supabase connection successful!');
      return true;
    } else {
      console.error('❌ Supabase connection failed:', responseCode, response.getContentText());
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing Supabase connection:', error);
    return false;
  }
}

/**
 * Test function with sample data
 * Run this manually to test the complete flow
 */
function testWithSampleData() {
  console.log('Testing with sample data...');
  
  const sampleData = {
    email: 'test@example.com',
    motivation: 'I love helping other students with their dating and life questions!'
  };
  
  const result = insertMentorApplication(sampleData);
  
  if (result.success) {
    console.log('✅ Sample application processed successfully!');
  } else {
    console.error('❌ Sample application failed:', result.error);
  }
  
  return result;
}
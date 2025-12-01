/**
 * Google Apps Script for Processing Wizzmo Mentor Applications 
 * Works with Google Sheets: "Become a Wizzmo (Responses)"
 * 
 * This script:
 * 1. Processes new form submissions automatically
 * 2. Handles manual approval via "Approved?" column
 * 3. Syncs with Supabase mentor_applications table
 */

// Configuration - Set these in Script Properties  
const SUPABASE_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL') || 'https://qpttxbcglzocxbzzevmg.supabase.co';
const SUPABASE_SERVICE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_KEY');

/**
 * Called when form is submitted - processes new applications
 */
function onFormSubmit(e) {
  console.log('Form submission received');
  
  try {
    const range = e.range;
    const row = range.getRow();
    const sheet = range.getSheet();
    
    // Get the data from the new row
    const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Map to object
    const formData = {};
    headers.forEach((header, index) => {
      formData[header] = rowData[index];
    });
    
    console.log('Form data:', formData);
    
    // Extract required fields based on your column headers
    const applicationData = {
      email: formData['Email'] || '',
      motivation: formData['Why would you make a good Wizzmo?'] || ''
    };
    
    // Validate required fields
    if (!applicationData.email || !applicationData.motivation) {
      console.error('Missing required fields:', applicationData);
      return;
    }
    
    // Insert into Supabase
    const result = insertMentorApplication(applicationData);
    
    if (result.success) {
      console.log('✅ Successfully processed application for:', applicationData.email);
      
      // Add timestamp to "Notes" column  
      const notesColIndex = headers.indexOf('Notes') + 1;
      if (notesColIndex > 0) {
        sheet.getRange(row, notesColIndex).setValue(`Submitted: ${new Date().toISOString()}`);
      }
      
      // Send confirmation email
      sendConfirmationEmail(applicationData.email);
      
    } else {
      console.error('❌ Failed to process application:', result.error);
      
      // Add error to "Notes" column
      const notesColIndex = headers.indexOf('Notes') + 1;
      if (notesColIndex > 0) {
        sheet.getRange(row, notesColIndex).setValue(`ERROR: ${result.error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error processing form submission:', error);
  }
}

/**
 * Called when any cell is edited - handles manual approvals
 */
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  
  // Only process if this is the responses sheet
  if (sheet.getName() !== 'Form Responses 1' && !sheet.getName().includes('Responses')) {
    return;
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const approvedColIndex = headers.indexOf('Approved?');
  
  // Check if the edited cell is in the "Approved?" column
  if (range.getColumn() === approvedColIndex + 1 && range.getRow() > 1) {
    const newValue = range.getValue();
    const row = range.getRow();
    
    console.log(`Approval status changed to: ${newValue} for row ${row}`);
    
    if (newValue === true || newValue === 'TRUE' || newValue === 'Yes' || newValue === 'Approved') {
      handleApproval(sheet, row, headers);
    }
  }
}

/**
 * Handle manual approval from the sheet
 */
function handleApproval(sheet, row, headers) {
  try {
    // Get the row data
    const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Map to object
    const formData = {};
    headers.forEach((header, index) => {
      formData[header] = rowData[index];
    });
    
    const email = formData['Email'];
    if (!email) {
      console.error('No email found for approval');
      return;
    }
    
    console.log(`Approving application for: ${email}`);
    
    // Update Supabase application status
    const result = approveMentorApplication(email);
    
    if (result.success) {
      console.log('✅ Application approved successfully');
      
      // Update "Notes" column
      const notesColIndex = headers.indexOf('Notes') + 1;
      if (notesColIndex > 0) {
        const currentNotes = formData['Notes'] || '';
        sheet.getRange(row, notesColIndex).setValue(
          `${currentNotes}\nApproved: ${new Date().toISOString()}`
        );
      }
      
      // Update "Reviewed by" column
      const reviewedColIndex = headers.indexOf('Reviewed by') + 1;
      if (reviewedColIndex > 0) {
        sheet.getRange(row, reviewedColIndex).setValue(Session.getActiveUser().getEmail());
      }
      
      // Send approval email
      sendApprovalEmail(email);
      
    } else {
      console.error('❌ Failed to approve application:', result.error);
      
      // Add error to notes
      const notesColIndex = headers.indexOf('Notes') + 1;
      if (notesColIndex > 0) {
        sheet.getRange(row, notesColIndex).setValue(`ERROR: ${result.error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error handling approval:', error);
  }
}

/**
 * Insert mentor application into Supabase
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
    
    if (responseCode === 201) {
      return { success: true, data: JSON.parse(responseText) };
    } else {
      return { success: false, error: `HTTP ${responseCode}: ${responseText}` };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Approve mentor application in Supabase
 */
function approveMentorApplication(email) {
  try {
    const url = `${SUPABASE_URL}/rest/v1/mentor_applications?email=eq.${encodeURIComponent(email.toLowerCase())}`;
    
    const payload = {
      application_status: 'approved',
      reviewed_at: new Date().toISOString()
    };
    
    const options = {
      method: 'PATCH',
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
    
    if (responseCode === 200) {
      return { success: true, data: JSON.parse(responseText) };
    } else {
      return { success: false, error: `HTTP ${responseCode}: ${responseText}` };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send confirmation email to applicant
 */
function sendConfirmationEmail(email) {
  try {
    const subject = 'Your Wizzmo Mentor Application Received! 🐻💕';
    const body = `
Hi there!

Thanks for applying to become a Wizzmo mentor! 🐻

The bear is excited to review your application. Here's what happens next:

🐻 Our team will review your application within 1-2 business days
💕 If approved, you'll be able to log into the app and complete mentor onboarding
✨ You'll start helping college students with dating, drama, and life advice!

We'll email you once your application has been reviewed.

Thanks for wanting to help students!
The Wizzmo Team 🐻💕
    `;
    
    MailApp.sendEmail(email, subject, body);
    console.log('✅ Confirmation email sent');
    
  } catch (error) {
    console.error('❌ Error sending confirmation email:', error);
  }
}

/**
 * Send approval email to new mentor
 */
function sendApprovalEmail(email) {
  try {
    const subject = 'Welcome to the Wizzmo Mentor Team! 🎉🐻';
    const body = `
Congratulations! 🎉

Your Wizzmo mentor application has been APPROVED! The bear is so excited to have you on the team!

🐻 Next Steps:
1. Download the Wizzmo app (if you haven't already)
2. Sign in with the same Google account (${email})
3. Complete the mentor onboarding flow
4. Start helping students!

You'll see a special mentor onboarding experience when you log in - the bear will guide you through setting up your mentor profile.

Thank you for joining our mission to help college students navigate dating, drama, and life challenges!

Welcome to the team! 🐻💕
The Wizzmo Family
    `;
    
    MailApp.sendEmail(email, subject, body);
    console.log('✅ Approval email sent');
    
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
  }
}

/**
 * Test function - run this manually to verify setup
 */
function testConnection() {
  console.log('Testing Supabase connection...');
  
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY not set in Script Properties');
    return false;
  }
  
  try {
    const url = `${SUPABASE_URL}/rest/v1/mentor_applications?select=count&limit=1`;
    
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
      console.error('❌ Supabase connection failed:', responseCode);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Connection test error:', error);
    return false;
  }
}

/**
 * Setup function - run this once to create triggers
 */
function setupTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Create new triggers
  ScriptApp.newTrigger('onFormSubmit')
    .onFormSubmit()
    .create();
    
  ScriptApp.newTrigger('onEdit')
    .onEdit()
    .create();
    
  console.log('✅ Triggers created successfully');
}
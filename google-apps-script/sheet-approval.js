/**
 * Simple Google Sheets Approval Script
 * This script ONLY handles manual approvals from your sheet
 * No form processing, just watch the "Approved?" column
 */

// Your Supabase credentials - WIZZMO DATABASE
const SUPABASE_URL = 'https://miygmdboiesbxwlqgnsx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1peWdtZGJvaWVzYnh3bHFnbnN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNjY1MywiZXhwIjoyMDc1NDgyNjUzfQ._CA9e584ZPcUZeVT_oq_uDJFv-QQU0Pk8vMD6f72d2s';

/**
 * PERMISSION FUNCTION - Run this to grant all permissions needed
 * This makes actual calls to Supabase to ensure permissions work
 */
function requestPermissions() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test the actual Supabase endpoints we'll use
    const testUrls = [
      SUPABASE_URL + '/rest/v1/users?select=id&limit=1',
      SUPABASE_URL + '/rest/v1/mentor_profiles?select=id&limit=1',
      SUPABASE_URL + '/rest/v1/mentor_applications?select=id&limit=1'
    ];
    
    for (const url of testUrls) {
      const response = UrlFetchApp.fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
          'apikey': SUPABASE_SERVICE_KEY
        }
      });
      console.log('✅ Connected to: ' + url + ' - Status: ' + response.getResponseCode());
    }
    
    // Test email sending
    MailApp.sendEmail(Session.getActiveUser().getEmail(), 'Wizzmo Permissions Test', 'Permissions granted successfully!');
    console.log('✅ Email permissions granted');
    
    console.log('🎉 ALL PERMISSIONS GRANTED SUCCESSFULLY!');
    return true;
  } catch (error) {
    console.error('❌ Permission error: ' + error.toString());
    return false;
  }
}

/**
 * Called when any cell in the sheet is edited
 */
function onEdit(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();
    const row = range.getRow();
    const column = range.getColumn();
    
    console.log('Edit detected - Sheet: ' + sheet.getName() + ', Row: ' + row + ', Column: ' + column);
    
    // Only process sheets that look like form responses
    const sheetName = sheet.getName().toLowerCase();
    if (!sheetName.includes('response') && !sheetName.includes('form')) {
      console.log('Ignoring edit in non-response sheet: ' + sheet.getName());
      return;
    }
    
    // Skip if this is the header row
    if (row === 1) {
      console.log('Ignoring header row edit');
      return;
    }
    
    // Debug: Log sheet info
    console.log('Sheet name: ' + sheet.getName());
    console.log('Last column: ' + sheet.getLastColumn());
    console.log('Last row: ' + sheet.getLastRow());
    
    // Get all headers to find the "Approved?" column
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Debug: Log headers
    console.log('Headers raw: ' + JSON.stringify(headers));
    
    // Safety check for headers
    if (!headers || headers.length === 0) {
      console.error('Unable to read sheet headers - sheet may be empty');
      return;
    }
    
    let approvedColumnIndex = -1;
    
    // Find the "Approved?" column
    for (let i = 0; i < headers.length; i++) {
      if (headers[i].toString().toLowerCase().includes('approved')) {
        approvedColumnIndex = i + 1; // Convert to 1-based index
        break;
      }
    }
    
    console.log('Approved column found at index: ' + approvedColumnIndex);
    console.log('Edited column: ' + column);
    
    // Check if the edited cell is in the "Approved?" column OR if it's column 5 (E)
    if (column === approvedColumnIndex || column === 5) {
      const newValue = range.getValue();
      console.log('Approval value changed to: ' + newValue + ' for row ' + row);
      
      // Check if it's been approved (checkbox checked or "Yes" or "Approved")
      if (newValue === true || newValue.toString().toLowerCase() === 'yes' || newValue.toString().toLowerCase() === 'approved') {
        console.log('Processing approval for row ' + row);
        handleApproval(sheet, row, headers);
      } else {
        console.log('Value is not an approval: ' + newValue);
      }
    } else {
      console.log('Edit was not in approval column. Expected: ' + approvedColumnIndex + ' or 5, Got: ' + column);
    }
    
  } catch (error) {
    console.error('Error in onEdit: ' + error.toString());
  }
}

/**
 * Handle the approval process
 */
function handleApproval(sheet, row, headers) {
  try {
    console.log('Processing approval for row ' + row);
    
    // Based on your sheet structure:
    // A = Timestamp, B = Email, C = Why would you make a good Wizzmo?, 
    // D = I understand Wizzmo is peer advice, E = Approved?, F = Notes, G = Reviewed by
    
    // Get the email from column B (index 1)
    const email = sheet.getRange(row, 2).getValue(); // Column B = Email
    
    console.log('Email found: ' + email);
    
    if (!email) {
      console.error('No email found in row ' + row + ', column B');
      return;
    }
    
    console.log('Approving application for: ' + email);
    
    // Update Supabase
    const result = approveInSupabase(email);
    
    if (result.success) {
      console.log('✅ Successfully approved: ' + email);
      updateSheetWithApproval(sheet, row, headers);
      sendApprovalEmail(email);
    } else {
      console.error('❌ Failed to approve: ' + email + ' - ' + result.error);
      updateSheetWithError(sheet, row, headers, result.error);
    }
    
  } catch (error) {
    console.error('Error handling approval: ' + error.toString());
  }
}

/**
 * Check if user already has a mentor profile
 */
function checkExistingMentorProfile(email) {
  try {
    // First, get the user ID from the email
    const userUrl = SUPABASE_URL + '/rest/v1/users?select=id,role&email=eq.' + encodeURIComponent(email.toLowerCase());
    
    const userOptions = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'apikey': SUPABASE_SERVICE_KEY
      }
    };
    
    const userResponse = UrlFetchApp.fetch(userUrl, userOptions);
    const userResponseCode = userResponse.getResponseCode();
    
    if (userResponseCode !== 200) {
      return { exists: false, reason: 'User not found in database' };
    }
    
    const userData = JSON.parse(userResponse.getContentText());
    if (!userData || userData.length === 0) {
      return { exists: false, reason: 'User not found in database' };
    }
    
    const user = userData[0];
    
    // Check if user already has mentor role
    if (user.role === 'mentor' || user.role === 'both') {
      return { exists: true, reason: 'User already has mentor role' };
    }
    
    // Check if user has a mentor profile
    const profileUrl = SUPABASE_URL + '/rest/v1/mentor_profiles?select=id&user_id=eq.' + user.id;
    
    const profileOptions = {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'apikey': SUPABASE_SERVICE_KEY
      }
    };
    
    const profileResponse = UrlFetchApp.fetch(profileUrl, profileOptions);
    const profileResponseCode = profileResponse.getResponseCode();
    
    if (profileResponseCode === 200) {
      const profileData = JSON.parse(profileResponse.getContentText());
      if (profileData && profileData.length > 0) {
        return { exists: true, reason: 'User already has mentor profile' };
      }
    }
    
    return { exists: false, reason: 'User can be approved' };
    
  } catch (error) {
    console.error('Error checking mentor profile: ' + error.toString());
    return { exists: false, reason: 'Error checking mentor status: ' + error.toString() };
  }
}

/**
 * Approve the application in Supabase
 */
function approveInSupabase(email) {
  try {
    // First check if user already has mentor profile
    const existingCheck = checkExistingMentorProfile(email);
    
    if (existingCheck.exists) {
      console.log('Cannot approve - ' + existingCheck.reason);
      return { success: false, error: existingCheck.reason };
    }
    
    const url = SUPABASE_URL + '/rest/v1/mentor_applications?email=eq.' + encodeURIComponent(email.toLowerCase());
    
    const data = {
      application_status: 'approved',
      reviewed_at: new Date().toISOString()
    };
    
    const options = {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(data)
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    console.log('Supabase update response: ' + responseCode);
    
    if (responseCode === 200 || responseCode === 204) {
      return { success: true };
    } else {
      console.error('Supabase error: ' + response.getContentText());
      return { success: false, error: 'Database update failed: ' + response.getContentText() };
    }
    
  } catch (error) {
    console.error('Error updating Supabase: ' + error.toString());
    return { success: false, error: 'Error updating database: ' + error.toString() };
  }
}

/**
 * Update the sheet with error info
 */
function updateSheetWithError(sheet, row, headers, errorMessage) {
  try {
    const now = new Date();
    const timestamp = now.toISOString();
    const reviewer = Session.getActiveUser().getEmail();
    
    // Column F = Notes (index 6)
    const currentNotes = sheet.getRange(row, 6).getValue() || '';
    const newNotes = currentNotes + '\\nCANNOT APPROVE: ' + errorMessage + ' (' + timestamp + ')';
    sheet.getRange(row, 6).setValue(newNotes);
    
    // Column G = Reviewed by (index 7) 
    sheet.getRange(row, 7).setValue(reviewer);
    
    console.log('Sheet updated with error info: ' + errorMessage);
    
  } catch (error) {
    console.error('Error updating sheet with error: ' + error.toString());
  }
}

/**
 * Update the sheet with approval info
 */
function updateSheetWithApproval(sheet, row, headers) {
  try {
    const now = new Date();
    const timestamp = now.toISOString();
    const reviewer = Session.getActiveUser().getEmail();
    
    // Column F = Notes (index 6)
    const currentNotes = sheet.getRange(row, 6).getValue() || '';
    const newNotes = currentNotes + '\nApproved: ' + timestamp;
    sheet.getRange(row, 6).setValue(newNotes);
    
    // Column G = Reviewed by (index 7)
    sheet.getRange(row, 7).setValue(reviewer);
    
    console.log('Sheet updated with approval info');
    
  } catch (error) {
    console.error('Error updating sheet: ' + error.toString());
  }
}

/**
 * Send approval email
 */
function sendApprovalEmail(email) {
  try {
    const subject = 'Welcome to the Wizzmo Mentor Team! 🎉🐻';
    const message = 'Congratulations! 🎉\n\nYour Wizzmo mentor application has been APPROVED! The bear is so excited to have you on the team!\n\n🐻 Next Steps:\n1. Download the Wizzmo app (if you haven\'t already)\n2. Sign in with the same Google account (' + email + ')\n3. Complete the mentor onboarding flow\n4. Start helping students!\n\nYou\'ll see a special mentor onboarding experience when you log in - the bear will guide you through setting up your mentor profile.\n\nWelcome to the team! 🐻💕\nThe Wizzmo Family';
    
    MailApp.sendEmail(email, subject, message);
    console.log('Approval email sent to: ' + email);
    
  } catch (error) {
    console.error('Error sending approval email: ' + error.toString());
  }
}

/**
 * Test function
 */
function testConnection() {
  console.log('Testing Supabase connection...');
  
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
    } else {
      console.log('❌ FAILED: Response code ' + responseCode);
    }
    
  } catch (error) {
    console.log('❌ ERROR: ' + error.toString());
  }
}
/**
 * Google Apps Script to watch for approval checkbox changes
 * and automatically approve mentor applications in Supabase
 */

// Configuration - UPDATE THESE VALUES
const SUPABASE_URL = 'https://miygmdboiesbxwlqgnsx.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_KEY_HERE'; // Need service key for admin functions
const RESPONSES_SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // The sheet with form responses
const APPROVED_COLUMN = 'J'; // Column where the "Approved" checkbox is (adjust as needed)
const EMAIL_COLUMN = 'B'; // Column where the email is (adjust as needed)

// Validation function to check configuration
function validateConfig() {
  const errors = [];
  
  if (SUPABASE_SERVICE_KEY === 'YOUR_SUPABASE_SERVICE_KEY_HERE' || !SUPABASE_SERVICE_KEY) {
    errors.push('❌ SUPABASE_SERVICE_KEY not configured');
  }
  
  if (RESPONSES_SHEET_ID === 'YOUR_GOOGLE_SHEET_ID_HERE' || !RESPONSES_SHEET_ID) {
    errors.push('❌ RESPONSES_SHEET_ID not configured');
  }
  
  return errors;
}

/**
 * Helper function to get the current sheet ID
 * Run this to get the ID of the current sheet
 */
function getCurrentSheetId() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet();
  const id = sheet.getId();
  const name = sheet.getName();
  
  console.log('📋 Current Google Sheet Information:');
  console.log(`📝 Name: "${name}"`);
  console.log(`🆔 ID: ${id}`);
  console.log('');
  console.log('👆 Copy the ID above and paste it as the RESPONSES_SHEET_ID in the configuration');
  
  return id;
}

/**
 * Install an onEdit trigger to watch for changes
 * Run this function once to set up the trigger
 */
function installApprovalTrigger() {
  try {
    console.log('🔧 Installing approval trigger...');
    
    // Validate configuration first
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
      console.error('❌ Configuration errors found:');
      configErrors.forEach(error => console.error(error));
      console.error('👆 Please update the configuration values at the top of the script');
      return false;
    }
    
    // Test sheet access
    try {
      const testSheet = SpreadsheetApp.openById(RESPONSES_SHEET_ID);
      console.log(`✅ Successfully connected to sheet: "${testSheet.getName()}"`);
    } catch (sheetError) {
      console.error('❌ Cannot access Google Sheet with ID:', RESPONSES_SHEET_ID);
      console.error('👆 Make sure the RESPONSES_SHEET_ID is correct and you have access');
      return false;
    }
    
    // Delete any existing triggers first
    console.log('🧹 Cleaning up existing triggers...');
    const triggers = ScriptApp.getProjectTriggers();
    let deletedCount = 0;
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'onApprovalChange') {
        ScriptApp.deleteTrigger(trigger);
        deletedCount++;
      }
    });
    console.log(`🗑️ Deleted ${deletedCount} existing triggers`);
    
    // Create new installable trigger for onEdit
    const trigger = ScriptApp.newTrigger('onApprovalChange')
      .onEdit()
      .create();
      
    console.log('✅ Approval trigger installed successfully!');
    console.log(`🆔 Trigger ID: ${trigger.getUniqueId()}`);
    console.log('📝 The script will now run whenever you edit cells in your sheet');
    console.log(`👀 Watching for changes in column ${APPROVED_COLUMN} (approval checkbox)`);
    return true;
    
  } catch (error) {
    console.error('❌ Error installing trigger:', error.toString());
    console.error('🔍 Error details:', error);
    
    // Try alternative approach - using simple trigger
    console.log('');
    console.log('🔄 Alternative: You can use a Simple Trigger instead:');
    console.log('1. Rename the function from "onApprovalChange" to "onEdit"');
    console.log('2. Simple triggers run automatically without installation');
    console.log('3. No setup required, but they have some limitations');
    
    return false;
  }
}

/**
 * Simple Trigger - automatically runs when any cell is edited
 * This is the EASIEST way to set up the approval system
 * Just rename this function to "onEdit" and it will work automatically!
 */
function onEdit(e) {
  try {
    // Validate configuration first
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
      console.error('❌ Configuration not set up. Please update the values at the top of the script.');
      return;
    }
    
    console.log('📝 Edit detected, checking if approval column...');
    
    // Get the edited range info
    const range = e.range;
    const sheet = range.getSheet();
    const row = range.getRow();
    const column = range.getColumn();
    
    // Check if this is the responses sheet and approval column
    if (sheet.getParent().getId() !== RESPONSES_SHEET_ID) {
      console.log('⏭️ Not the responses sheet, ignoring');
      return;
    }
    
    // Convert column letter to number for comparison
    const approvedColumnNum = columnLetterToNumber(APPROVED_COLUMN);
    
    if (column !== approvedColumnNum) {
      console.log(`⏭️ Not the approval column (${column} !== ${approvedColumnNum}), ignoring`);
      return;
    }
    
    // Check if the checkbox was checked (not unchecked)
    const newValue = range.getValue();
    if (newValue !== true) {
      console.log('⏭️ Checkbox not checked (unchecked or false), ignoring');
      return;
    }
    
    console.log(`✅ Approval checkbox checked in row ${row}!`);
    
    // Get the email from the same row
    const emailColumnNum = columnLetterToNumber(EMAIL_COLUMN);
    const email = sheet.getRange(row, emailColumnNum).getValue();
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error(`❌ Invalid email found in row ${row}: ${email}`);
      return;
    }
    
    console.log(`📧 Processing approval for email: ${email}`);
    
    // Find and approve the mentor application
    approveMentorApplication(email, row);
    
  } catch (error) {
    console.error('❌ Error in onEdit:', error);
  }
}

/**
 * Trigger function that runs when any cell is edited (for installable triggers)
 * Checks if it's the approval checkbox and processes accordingly
 */
function onApprovalChange(e) {
  try {
    console.log('📝 Edit detected, checking if approval column...');
    
    // Get the edited range info
    const range = e.range;
    const sheet = range.getSheet();
    const row = range.getRow();
    const column = range.getColumn();
    
    // Check if this is the responses sheet and approval column
    if (sheet.getParent().getId() !== RESPONSES_SHEET_ID) {
      console.log('⏭️ Not the responses sheet, ignoring');
      return;
    }
    
    // Convert column letter to number for comparison
    const approvedColumnNum = columnLetterToNumber(APPROVED_COLUMN);
    
    if (column !== approvedColumnNum) {
      console.log(`⏭️ Not the approval column (${column} !== ${approvedColumnNum}), ignoring`);
      return;
    }
    
    // Check if the checkbox was checked (not unchecked)
    const newValue = range.getValue();
    if (newValue !== true) {
      console.log('⏭️ Checkbox not checked (unchecked or false), ignoring');
      return;
    }
    
    console.log(`✅ Approval checkbox checked in row ${row}!`);
    
    // Get the email from the same row
    const emailColumnNum = columnLetterToNumber(EMAIL_COLUMN);
    const email = sheet.getRange(row, emailColumnNum).getValue();
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      console.error(`❌ Invalid email found in row ${row}: ${email}`);
      return;
    }
    
    console.log(`📧 Processing approval for email: ${email}`);
    
    // Find and approve the mentor application
    approveMentorApplication(email, row);
    
  } catch (error) {
    console.error('❌ Error in onApprovalChange:', error);
  }
}

/**
 * Find mentor application by email and approve it
 */
function approveMentorApplication(email, sheetRow) {
  try {
    console.log(`🔍 Looking up mentor application for email: ${email}`);
    
    // First, find the application ID by email
    const findApplicationResponse = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/mentor_applications?email=eq.${encodeURIComponent(email)}&select=id,application_status`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const applications = JSON.parse(findApplicationResponse.getContentText());
    
    if (!applications || applications.length === 0) {
      console.error(`❌ No mentor application found for email: ${email}`);
      return;
    }
    
    const application = applications[0];
    
    if (application.application_status === 'approved') {
      console.log(`✅ Application for ${email} is already approved`);
      return;
    }
    
    console.log(`📋 Found application ID: ${application.id}, current status: ${application.application_status}`);
    
    // Call the Supabase function to process the mentor application
    const approveResponse = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/rpc/process_mentor_application`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        p_application_id: application.id,
        p_reviewer_id: null // You can set a reviewer ID if needed
      })
    });
    
    const result = JSON.parse(approveResponse.getContentText());
    
    if (result.success) {
      console.log(`✅ Successfully approved mentor application for ${email}`);
      console.log(`👤 User ID: ${result.user_id}`);
      console.log(`🎯 Mentor Profile ID: ${result.mentor_profile_id}`);
      
      // Optional: Add a timestamp or note in the sheet to confirm processing
      const sheet = SpreadsheetApp.openById(RESPONSES_SHEET_ID).getSheets()[0];
      const timestampColumn = columnLetterToNumber(APPROVED_COLUMN) + 1; // Next column after approval
      sheet.getRange(sheetRow, timestampColumn).setValue(new Date());
      
    } else {
      console.error(`❌ Failed to approve mentor application for ${email}:`, result.error);
    }
    
  } catch (error) {
    console.error('❌ Error approving mentor application:', error);
  }
}

/**
 * Utility function to convert column letter to number
 * e.g., 'A' -> 1, 'B' -> 2, 'J' -> 10, 'AA' -> 27
 */
function columnLetterToNumber(letter) {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result;
}

/**
 * Test function to manually approve a mentor application
 * Use this to test the approval process
 */
function testApproval() {
  const testEmail = 'test.rls.fixed@example.com'; // Replace with actual email from your sheet
  console.log(`🧪 Testing approval process for: ${testEmail}`);
  approveMentorApplication(testEmail, 999); // Row 999 as test
}

/**
 * Debug function to check current sheet structure
 */
function debugSheetStructure() {
  try {
    const sheet = SpreadsheetApp.openById(RESPONSES_SHEET_ID).getSheets()[0];
    const lastRow = sheet.getLastRow();
    const lastColumn = sheet.getLastColumn();
    
    console.log(`📊 Sheet has ${lastRow} rows and ${lastColumn} columns`);
    
    // Show headers
    if (lastRow >= 1) {
      const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
      console.log('📋 Headers:');
      headers.forEach((header, index) => {
        const columnLetter = String.fromCharCode(65 + index);
        console.log(`  ${columnLetter}: ${header}`);
      });
    }
    
    // Show a few data rows
    if (lastRow >= 2) {
      console.log('\n📝 Sample data (first 3 rows):');
      for (let row = 2; row <= Math.min(lastRow, 4); row++) {
        const rowData = sheet.getRange(row, 1, 1, lastColumn).getValues()[0];
        console.log(`Row ${row}:`, rowData);
      }
    }
    
  } catch (error) {
    console.error('❌ Error debugging sheet:', error);
  }
}

/**
 * Manual test function to simulate checkbox change
 */
function simulateApprovalChange() {
  const testRow = 2; // Adjust to a real row in your sheet
  const testEmail = 'test.rls.fixed@example.com'; // Adjust to real email
  
  console.log(`🎭 Simulating approval change for row ${testRow}, email: ${testEmail}`);
  approveMentorApplication(testEmail, testRow);
}
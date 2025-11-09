// Configuration - UPDATE THESE VALUES
const SUPABASE_URL = 'https://miygmdboiesbxwlqgnsx.supabase.co';
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_KEY_HERE'; // Get from Supabase dashboard
const RESPONSES_SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Your sheet ID
const APPROVED_COLUMN = 'J'; // Column with approval checkbox
const EMAIL_COLUMN = 'B'; // Column with email addresses

/**
 * Main function - runs when you check the approval box
 */
function onEdit(e) {
  // Check if this is a manual run vs actual edit
  if (!e || !e.range) {
    console.log('⚠️ This function should run automatically when you edit cells, not manually');
    console.log('💡 To test manually, use the test() function instead');
    return;
  }
  
  const range = e.range;
  const sheet = range.getSheet();
  const row = range.getRow();
  const column = range.getColumn();
  
  // Only run for approval column
  if (column !== columnToNumber(APPROVED_COLUMN)) return;
  
  // Only run if checkbox was checked
  if (range.getValue() !== true) return;
  
  console.log(`✅ Approval checked in row ${row}`);
  
  // Get email from same row
  const email = sheet.getRange(row, columnToNumber(EMAIL_COLUMN)).getValue();
  
  if (!email || !email.includes('@')) {
    console.error('❌ No valid email found');
    return;
  }
  
  console.log(`📧 Approving mentor: ${email}`);
  
  // Approve the mentor
  approveMentor(email);
}

/**
 * Approve mentor in Supabase
 */
function approveMentor(email) {
  try {
    // Find application
    const findResponse = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/mentor_applications?email=eq.${encodeURIComponent(email)}&select=id,application_status`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const applications = JSON.parse(findResponse.getContentText());
    
    if (!applications || applications.length === 0) {
      console.error(`❌ No application found for: ${email}`);
      return;
    }
    
    const appId = applications[0].id;
    console.log(`📋 Found application: ${appId}`);
    
    // Approve application
    const approveResponse = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/rpc/process_mentor_application`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        p_application_id: appId,
        p_reviewer_id: null
      })
    });
    
    const result = JSON.parse(approveResponse.getContentText());
    
    if (result.success) {
      console.log(`✅ Mentor approved: ${email}`);
    } else {
      console.error(`❌ Approval failed: ${result.error}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Convert column letter to number
 */
function columnToNumber(letter) {
  let result = 0;
  for (let i = 0; i < letter.length; i++) {
    result = result * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
  }
  return result;
}

/**
 * Test function
 */
function test() {
  approveMentor('test.rls.fixed@example.com'); // Replace with real email
}
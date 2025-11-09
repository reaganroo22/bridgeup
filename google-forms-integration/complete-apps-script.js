/**
 * WIZZMO MENTOR ONBOARDING AUTOMATION
 * 
 * This Google Apps Script automatically processes mentor application form responses
 * and creates corresponding records in the Supabase database.
 * 
 * Setup Instructions:
 * 1. Create a Google Form with the required fields (see FORM_FIELDS below)
 * 2. Create this script in Google Apps Script (script.google.com)
 * 3. Set up the form trigger (see setupFormTrigger function)
 * 4. Configure Supabase credentials in script properties
 * 5. Test with a form submission
 */

// ==================== CONFIGURATION ====================

const FORM_FIELDS = {
  EMAIL: 'Email Address',
  FIRST_NAME: 'First Name',
  LAST_NAME: 'Last Name',
  USERNAME: 'Desired Username',
  UNIVERSITY: 'University/College',
  MAJOR: 'Major/Field of Study',
  GRADUATION_YEAR: 'Expected Graduation Year',
  BIO: 'Bio (Tell us about yourself, your experiences, and what advice you can offer)',
  VIDEO_URL: 'Video Introduction URL (Optional - YouTube, Vimeo, or Google Drive link)',
  EXPERTISE_AREAS: 'Areas of Expertise (Select all that apply)',
  WHY_MENTOR: 'Why do you want to become a mentor?',
  AVAILABILITY: 'How many hours per week can you dedicate to mentoring?',
  EXPERIENCE: 'Previous mentoring or leadership experience'
};

const SUPABASE_CONFIG = {
  URL: PropertiesService.getScriptProperties().getProperty('SUPABASE_URL'),
  SERVICE_ROLE_KEY: PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_ROLE_KEY')
};

const EMAIL_CONFIG = {
  FROM_NAME: 'Wizzmo Team',
  SUBJECT_CONFIRMATION: '✨ Your Wizzmo Mentor Application Has Been Received!',
  SUBJECT_ADMIN: '🚀 New Mentor Application Submitted'
};

// ==================== MAIN FUNCTIONS ====================

/**
 * Main function triggered on form submission
 * This is the entry point for all form processing
 */
function onFormSubmit(e) {
  try {
    Logger.log('📝 Processing new mentor application form submission');
    
    // Extract and validate form response
    const formData = extractFormData(e);
    if (!formData) {
      throw new Error('Failed to extract form data');
    }
    
    Logger.log('✅ Form data extracted successfully');
    Logger.log('📧 Applicant: ' + formData.firstName + ' ' + formData.lastName + ' (' + formData.email + ')');
    
    // Create application record in Supabase
    const applicationResult = await createMentorApplication(formData);
    if (!applicationResult.success) {
      throw new Error('Failed to create mentor application: ' + applicationResult.error);
    }
    
    Logger.log('✅ Application created in Supabase with ID: ' + applicationResult.id);
    
    // Send confirmation email to applicant
    const confirmationResult = sendConfirmationEmail(formData);
    if (confirmationResult.success) {
      Logger.log('✅ Confirmation email sent to applicant');
    } else {
      Logger.log('⚠️ Failed to send confirmation email: ' + confirmationResult.error);
    }
    
    // Notify admin team
    const adminResult = notifyAdminTeam(formData, applicationResult.id);
    if (adminResult.success) {
      Logger.log('✅ Admin notification sent');
    } else {
      Logger.log('⚠️ Failed to send admin notification: ' + adminResult.error);
    }
    
    Logger.log('🎉 Form processing completed successfully');
    
  } catch (error) {
    Logger.log('❌ Error processing form submission: ' + error.toString());
    
    // Send error notification to admin
    notifyAdminError(error, e);
    
    // Re-throw to ensure the error is visible in Apps Script logs
    throw error;
  }
}

/**
 * Extract and structure form response data
 */
function extractFormData(e) {
  try {
    const response = e.response;
    const itemResponses = response.getItemResponses();
    
    // Create mapping from question titles to responses
    const responseMap = {};
    itemResponses.forEach(itemResponse => {
      const question = itemResponse.getItem().getTitle();
      let answer = itemResponse.getResponse();
      
      // Handle multiple choice arrays
      if (Array.isArray(answer)) {
        answer = answer.join(', ');
      }
      
      responseMap[question] = answer;
    });
    
    // Structure the data
    const formData = {
      email: responseMap[FORM_FIELDS.EMAIL]?.toLowerCase()?.trim(),
      firstName: responseMap[FORM_FIELDS.FIRST_NAME]?.trim(),
      lastName: responseMap[FORM_FIELDS.LAST_NAME]?.trim(),
      username: responseMap[FORM_FIELDS.USERNAME]?.toLowerCase()?.trim(),
      university: responseMap[FORM_FIELDS.UNIVERSITY]?.trim(),
      major: responseMap[FORM_FIELDS.MAJOR]?.trim(),
      graduationYear: responseMap[FORM_FIELDS.GRADUATION_YEAR],
      bio: responseMap[FORM_FIELDS.BIO]?.trim(),
      videoUrl: responseMap[FORM_FIELDS.VIDEO_URL]?.trim(),
      expertiseAreas: responseMap[FORM_FIELDS.EXPERTISE_AREAS],
      whyMentor: responseMap[FORM_FIELDS.WHY_MENTOR]?.trim(),
      availability: responseMap[FORM_FIELDS.AVAILABILITY],
      experience: responseMap[FORM_FIELDS.EXPERIENCE]?.trim(),
      submittedAt: new Date().toISOString(),
      formResponseId: response.getId()
    };
    
    // Basic validation
    if (!formData.email || !formData.firstName || !formData.lastName) {
      throw new Error('Missing required fields: email, firstName, or lastName');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error('Invalid email format');
    }
    
    // Clean and validate video URL if provided
    if (formData.videoUrl) {
      formData.videoUrl = cleanVideoUrl(formData.videoUrl);
    }
    
    // Generate and validate username
    formData.finalUsername = await generateUniqueUsername(formData.username, formData.firstName, formData.lastName);
    
    return formData;
    
  } catch (error) {
    Logger.log('❌ Error extracting form data: ' + error.toString());
    return null;
  }
}

/**
 * Clean and validate video URL
 */
function cleanVideoUrl(url) {
  if (!url || url.trim() === '') return null;
  
  url = url.trim();
  
  // Add https:// if missing protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  // Validate that it's a reasonable video URL
  const videoHosts = ['youtube.com', 'youtu.be', 'vimeo.com', 'drive.google.com', 'loom.com'];
  const isValidVideoUrl = videoHosts.some(host => url.toLowerCase().includes(host));
  
  if (!isValidVideoUrl) {
    Logger.log('⚠️ Video URL may not be from a supported platform: ' + url);
  }
  
  return url;
}

// ==================== SUPABASE INTEGRATION ====================

/**
 * Create mentor application record in Supabase
 */
async function createMentorApplication(formData) {
  try {
    const payload = {
      email: formData.email,
      first_name: formData.firstName,
      last_name: formData.lastName,
      username: formData.finalUsername,
      desired_username: formData.username,
      university: formData.university,
      major: formData.major,
      graduation_year: formData.graduationYear,
      bio: formData.bio,
      video_introduction_url: formData.videoUrl,
      expertise_areas: formData.expertiseAreas,
      why_mentor: formData.whyMentor,
      availability_hours: formData.availability,
      previous_experience: formData.experience,
      status: 'pending',
      submitted_at: formData.submittedAt,
      form_response_id: formData.formResponseId
    };
    
    const response = UrlFetchApp.fetch(`${SUPABASE_CONFIG.URL}/rest/v1/mentor_applications`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_CONFIG.SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_CONFIG.SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      payload: JSON.stringify(payload)
    });
    
    if (response.getResponseCode() !== 201) {
      throw new Error(`Supabase API error: ${response.getResponseCode()} - ${response.getContentText()}`);
    }
    
    const result = JSON.parse(response.getContentText());
    return {
      success: true,
      id: result[0].id
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Check if user already exists and get their ID
 */
async function getUserByEmail(email) {
  try {
    const response = UrlFetchApp.fetch(`${SUPABASE_CONFIG.URL}/rest/v1/users?email=eq.${encodeURIComponent(email)}&select=id`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_CONFIG.SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_CONFIG.SERVICE_ROLE_KEY}`
      }
    });
    
    const users = JSON.parse(response.getContentText());
    return users.length > 0 ? users[0].id : null;
    
  } catch (error) {
    Logger.log('Error checking user: ' + error.toString());
    return null;
  }
}

/**
 * Check if username is available in Supabase
 */
async function checkUsernameAvailable(username) {
  try {
    const response = UrlFetchApp.fetch(`${SUPABASE_CONFIG.URL}/rest/v1/users?username=eq.${encodeURIComponent(username)}&select=id`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_CONFIG.SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_CONFIG.SERVICE_ROLE_KEY}`
      }
    });
    
    const users = JSON.parse(response.getContentText());
    return users.length === 0; // Available if no users found
    
  } catch (error) {
    Logger.log('Error checking username availability: ' + error.toString());
    return false; // Assume not available on error
  }
}

/**
 * Generate a unique username, handling conflicts automatically
 */
async function generateUniqueUsername(desiredUsername, firstName, lastName) {
  try {
    // Clean the desired username
    let baseUsername = desiredUsername || generateUsernameFromName(firstName, lastName);
    baseUsername = cleanUsername(baseUsername);
    
    Logger.log(`🔍 Checking username availability for: ${baseUsername}`);
    
    // Check if base username is available
    if (await checkUsernameAvailable(baseUsername)) {
      Logger.log(`✅ Username '${baseUsername}' is available`);
      return baseUsername;
    }
    
    Logger.log(`❌ Username '${baseUsername}' is taken, generating alternatives...`);
    
    // Try numbered variations
    for (let i = 2; i <= 100; i++) {
      const variation = `${baseUsername}${i}`;
      
      if (await checkUsernameAvailable(variation)) {
        Logger.log(`✅ Found available username: ${variation}`);
        return variation;
      }
    }
    
    // If all numbered variations fail, add random suffix
    const randomSuffix = Math.floor(Math.random() * 10000);
    const randomUsername = `${baseUsername}_${randomSuffix}`;
    
    Logger.log(`⚠️ Generated random username: ${randomUsername}`);
    return randomUsername;
    
  } catch (error) {
    Logger.log('❌ Error generating username: ' + error.toString());
    // Fallback to a safe username
    return generateUsernameFromName(firstName, lastName) + '_' + Date.now();
  }
}

/**
 * Generate a username from first and last name
 */
function generateUsernameFromName(firstName, lastName) {
  const first = (firstName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const last = (lastName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (first && last) {
    return `${first}${last}`;
  } else if (first) {
    return `${first}123`;
  } else if (last) {
    return `${last}123`;
  } else {
    return 'wizzmo' + Math.floor(Math.random() * 10000);
  }
}

/**
 * Clean username to ensure it meets requirements
 */
function cleanUsername(username) {
  if (!username) return '';
  
  return username
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '') // Only letters, numbers, underscore
    .replace(/^[^a-z]/g, '') // Must start with letter
    .substring(0, 20) // Max 20 characters
    || 'user' + Math.floor(Math.random() * 10000); // Fallback if nothing left
}

// ==================== EMAIL FUNCTIONS ====================

/**
 * Send confirmation email to the applicant
 */
function sendConfirmationEmail(formData) {
  try {
    const subject = EMAIL_CONFIG.SUBJECT_CONFIRMATION;
    const htmlBody = generateConfirmationEmailHTML(formData);
    
    MailApp.sendEmail({
      to: formData.email,
      subject: subject,
      htmlBody: htmlBody,
      name: EMAIL_CONFIG.FROM_NAME
    });
    
    return { success: true };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

/**
 * Generate HTML for confirmation email
 */
function generateConfirmationEmailHTML(formData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FF4DB8, #8B5CF6); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 900; text-transform: lowercase; }
        .content { padding: 30px; background: #fafafa; }
        .highlight { background: #fff; padding: 20px; margin: 20px 0; border-left: 4px solid #FF4DB8; }
        .footer { text-align: center; padding: 20px; font-size: 14px; color: #666; }
        .cta-button { background: linear-gradient(135deg, #FF4DB8, #8B5CF6); color: white; padding: 12px 24px; text-decoration: none; display: inline-block; margin: 20px 0; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>wizzmo</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">mentor application received ✨</p>
        </div>
        
        <div class="content">
          <h2>hey ${formData.firstName}! 👋</h2>
          
          <p>we're excited to review your mentor application! here's what we received:</p>
          
          <div class="highlight">
            <strong>application details:</strong><br>
            📧 email: ${formData.email}<br>
            👤 username: ${formData.finalUsername}${formData.username !== formData.finalUsername ? ` (modified from "${formData.username}")` : ''}<br>
            🎓 university: ${formData.university}<br>
            📚 major: ${formData.major}<br>
            🗓️ graduation: ${formData.graduationYear}<br>
            💡 expertise: ${formData.expertiseAreas}<br>
            ⏰ availability: ${formData.availability}
          </div>
          
          ${formData.username !== formData.finalUsername ? `
          <div class="highlight" style="border-left-color: #FFA500;">
            <p><strong>📝 Username Update:</strong></p>
            <p>Your desired username "${formData.username}" was already taken, so we've assigned you "${formData.finalUsername}" instead. You can change this later in your profile settings once you're approved!</p>
          </div>
          ` : ''}
          
          <h3>what happens next?</h3>
          <ul>
            <li><strong>review process:</strong> our team will carefully review your application (usually within 3-5 business days)</li>
            <li><strong>background check:</strong> we'll verify your university enrollment and academic standing</li>
            <li><strong>interview:</strong> if selected, we'll schedule a brief video interview to get to know you better</li>
            <li><strong>onboarding:</strong> approved mentors receive access to our platform and training materials</li>
          </ul>
          
          <div class="highlight">
            <p><strong>💡 pro tip:</strong> while you wait, check out our <a href="https://wizzmo.com/mentor-guide">mentor guide</a> to learn more about what makes a great wizzmo mentor!</p>
          </div>
          
          <p>questions? just reply to this email and we'll get back to you quickly.</p>
          
          <p>thanks for wanting to help other students succeed! 🚀</p>
          
          <p style="margin-top: 30px;">
            <strong>the wizzmo team</strong><br>
            <em>connecting students with amazing mentors like you</em>
          </p>
        </div>
        
        <div class="footer">
          <p>this is an automated message from the wizzmo mentor application system.</p>
          <p>if you didn't apply to become a mentor, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Notify admin team of new application
 */
function notifyAdminTeam(formData, applicationId) {
  try {
    const adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || 'team@wizzmo.com';
    const subject = EMAIL_CONFIG.SUBJECT_ADMIN;
    const htmlBody = generateAdminEmailHTML(formData, applicationId);
    
    MailApp.sendEmail({
      to: adminEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: EMAIL_CONFIG.FROM_NAME
    });
    
    return { success: true };
    
  } catch (error) {
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

/**
 * Generate HTML for admin notification email
 */
function generateAdminEmailHTML(formData, applicationId) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 700px; margin: 0 auto; padding: 20px; }
        .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .details { background: white; padding: 20px; margin: 20px 0; border: 1px solid #ddd; }
        .details h3 { margin-top: 0; color: #FF4DB8; }
        .quick-actions { background: #fff; padding: 20px; margin: 20px 0; text-align: center; }
        .action-btn { background: #FF4DB8; color: white; padding: 10px 20px; text-decoration: none; margin: 0 10px; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 New Mentor Application</h1>
          <p>Application ID: ${applicationId}</p>
        </div>
        
        <div class="content">
          <div class="details">
            <h3>👤 Applicant Information</h3>
            <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
            <p><strong>Email:</strong> ${formData.email}</p>
            <p><strong>Username:</strong> ${formData.finalUsername}${formData.username !== formData.finalUsername ? ` (requested: "${formData.username}")` : ''}</p>
            <p><strong>University:</strong> ${formData.university}</p>
            <p><strong>Major:</strong> ${formData.major}</p>
            <p><strong>Graduation Year:</strong> ${formData.graduationYear}</p>
          </div>
          
          <div class="details">
            <h3>🎯 Mentor Details</h3>
            <p><strong>Expertise Areas:</strong> ${formData.expertiseAreas}</p>
            <p><strong>Availability:</strong> ${formData.availability}</p>
            ${formData.videoUrl ? `<p><strong>Video Introduction:</strong> <a href="${formData.videoUrl}" target="_blank">Watch Video</a></p>` : ''}
          </div>
          
          <div class="details">
            <h3>💭 Application Responses</h3>
            <p><strong>Why they want to mentor:</strong></p>
            <p>${formData.whyMentor}</p>
            
            <p><strong>Previous experience:</strong></p>
            <p>${formData.experience}</p>
            
            <p><strong>Bio:</strong></p>
            <p>${formData.bio}</p>
          </div>
          
          <div class="quick-actions">
            <h3>📋 Next Steps</h3>
            <p>Review this application in the admin dashboard:</p>
            <a href="https://admin.wizzmo.com/mentor-applications/${applicationId}" class="action-btn">Review Application</a>
            <a href="https://admin.wizzmo.com/mentor-applications" class="action-btn">All Applications</a>
          </div>
          
          <div class="details">
            <h3>📊 Submission Details</h3>
            <p><strong>Submitted:</strong> ${new Date(formData.submittedAt).toLocaleString()}</p>
            <p><strong>Form Response ID:</strong> ${formData.formResponseId}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Notify admin of processing errors
 */
function notifyAdminError(error, originalEvent) {
  try {
    const adminEmail = PropertiesService.getScriptProperties().getProperty('ADMIN_EMAIL') || 'team@wizzmo.com';
    
    MailApp.sendEmail({
      to: adminEmail,
      subject: '🚨 Error Processing Mentor Application Form',
      htmlBody: `
        <h2>Error Processing Form Submission</h2>
        <p><strong>Error:</strong> ${error.toString()}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Event Data:</strong> ${JSON.stringify(originalEvent, null, 2)}</p>
        <p>Please check the Apps Script logs for more details.</p>
      `,
      name: EMAIL_CONFIG.FROM_NAME
    });
  } catch (emailError) {
    Logger.log('❌ Failed to send error notification: ' + emailError.toString());
  }
}

// ==================== SETUP FUNCTIONS ====================

/**
 * One-time setup function to create the form trigger
 * Run this once manually after setting up the script
 */
function setupFormTrigger() {
  try {
    // Get the form by ID (you'll need to update this)
    const formId = PropertiesService.getScriptProperties().getProperty('FORM_ID');
    if (!formId) {
      throw new Error('Please set FORM_ID in script properties');
    }
    
    const form = FormApp.openById(formId);
    
    // Delete existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'onFormSubmit') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new trigger
    ScriptApp.newTrigger('onFormSubmit')
      .timeBased()
      .everyMinutes(1)  // Check for new submissions every minute
      .create();
    
    // Alternative: Create form submit trigger (if you prefer this method)
    // ScriptApp.newTrigger('onFormSubmit')
    //   .timeBased()
    //   .onFormSubmit()
    //   .create();
    
    Logger.log('✅ Form trigger created successfully');
    
  } catch (error) {
    Logger.log('❌ Error setting up trigger: ' + error.toString());
  }
}

/**
 * Setup script properties (run once)
 */
function setupScriptProperties() {
  const properties = PropertiesService.getScriptProperties();
  
  // You'll need to set these values
  properties.setProperties({
    'SUPABASE_URL': 'YOUR_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY': 'YOUR_SERVICE_ROLE_KEY',
    'FORM_ID': 'YOUR_GOOGLE_FORM_ID',
    'ADMIN_EMAIL': 'YOUR_ADMIN_EMAIL'
  });
  
  Logger.log('✅ Script properties template created. Please update with actual values.');
}

/**
 * Test function - manually trigger form processing with sample data
 */
function testFormProcessing() {
  const sampleFormData = {
    email: 'test@university.edu',
    firstName: 'Test',
    lastName: 'Mentor',
    username: 'testmentor',
    university: 'Test University',
    major: 'Computer Science',
    graduationYear: '2025',
    bio: 'I am a passionate computer science student with experience in web development and algorithms.',
    videoUrl: 'https://youtube.com/watch?v=test',
    expertiseAreas: 'Computer Science, Web Development, Career Advice',
    whyMentor: 'I want to help other students succeed and share my knowledge.',
    availability: '5-10 hours per week',
    experience: 'I have tutored students in my university and led study groups.',
    submittedAt: new Date().toISOString(),
    formResponseId: 'test-response-id'
  };
  
  Logger.log('🧪 Testing with sample data...');
  
  // Test Supabase integration
  const result = createMentorApplication(sampleFormData);
  Logger.log('Database result: ' + JSON.stringify(result));
  
  // Test email sending
  const emailResult = sendConfirmationEmail(sampleFormData);
  Logger.log('Email result: ' + JSON.stringify(emailResult));
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Log detailed information about form structure (for debugging)
 */
function analyzeFormStructure() {
  try {
    const formId = PropertiesService.getScriptProperties().getProperty('FORM_ID');
    const form = FormApp.openById(formId);
    
    Logger.log('📋 Form Analysis:');
    Logger.log('Form Title: ' + form.getTitle());
    Logger.log('Form Description: ' + form.getDescription());
    
    const items = form.getItems();
    Logger.log('Number of questions: ' + items.length);
    
    items.forEach((item, index) => {
      Logger.log(`${index + 1}. ${item.getTitle()} (${item.getType()})`);
    });
    
  } catch (error) {
    Logger.log('❌ Error analyzing form: ' + error.toString());
  }
}

/**
 * Get recent form responses for testing
 */
function getRecentResponses() {
  try {
    const formId = PropertiesService.getScriptProperties().getProperty('FORM_ID');
    const form = FormApp.openById(formId);
    const responses = form.getResponses();
    
    Logger.log('📊 Recent responses:');
    responses.slice(-5).forEach((response, index) => {
      Logger.log(`Response ${index + 1}: ${response.getTimestamp()} - ${response.getRespondentEmail()}`);
    });
    
  } catch (error) {
    Logger.log('❌ Error getting responses: ' + error.toString());
  }
}
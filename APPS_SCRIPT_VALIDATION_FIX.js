// VALIDATION FIX for Google Apps Script
// Replace your validateApplication function with this fixed version

/**
 * Fixed validation function - handles checkbox values properly
 */
function validateApplication(data) {
  console.log('🔍 Validating application data:', JSON.stringify(data, null, 2));
  
  const required = [
    'email', 'full_name', 'university', 'graduation_year'
  ];
  
  // Check required text fields
  for (const field of required) {
    if (!data[field] && data[field] !== 0) {
      console.error(`❌ Missing required field: ${field}, value: ${data[field]}`);
      return false;
    }
  }
  
  // Email validation
  if (!data.email || !data.email.includes('@')) {
    console.error('❌ Invalid email format:', data.email);
    return false;
  }
  
  // Age confirmation - Check multiple possible values
  console.log(`🔍 Age confirmation check: ${data.age_confirmed} (type: ${typeof data.age_confirmed})`);
  if (!data.age_confirmed && data.age_confirmed !== true) {
    console.error('❌ Age confirmation required - must be 18+');
    console.error('❌ Current value:', data.age_confirmed);
    return false;
  }
  
  // Agreement acceptance - Check multiple possible values  
  console.log(`🔍 Agreement check: ${data.agreement_accepted} (type: ${typeof data.agreement_accepted})`);
  if (!data.agreement_accepted && data.agreement_accepted !== true) {
    console.error('❌ Agreement acceptance required');
    console.error('❌ Current value:', data.agreement_accepted);
    return false;
  }
  
  console.log('✅ All validation checks passed');
  return true;
}

/**
 * Fixed form response transformation - handles checkboxes properly
 */
function transformFormResponse(itemResponses, respondentEmail) {
  const data = {
    email: respondentEmail || '',
    full_name: '',
    university: '',
    graduation_year: 2024,
    age_confirmed: false,
    comfortable_with_college_girl_perspective: false,
    topics_comfortable_with: [],
    prior_experience: '',
    bio: '',
    intro_video_url: null,
    session_formats: [],
    hours_per_week: '',
    languages: 'English',
    social_portfolio_links: null,
    agreement_accepted: false,
    application_status: 'pending'
  };
  
  console.log(`📝 Processing ${itemResponses.length} form responses`);
  
  // Map form questions to data fields
  itemResponses.forEach(itemResponse => {
    const question = itemResponse.getItem().getTitle();
    const answer = itemResponse.getResponse();
    
    console.log(`📋 Question: "${question}"`);
    console.log(`📝 Answer: "${answer}" (type: ${typeof answer})`);
    
    switch (question) {
      case 'Email':
        data.email = answer.toString().trim().toLowerCase();
        break;
        
      case 'What is your full name?':
        data.full_name = answer.toString().trim();
        break;
        
      case 'What university do you currently attend or recently graduate from?':
        data.university = answer.toString().trim();
        break;
        
      case 'What is your graduation year?':
        data.graduation_year = parseInt(answer.toString()) || 2024;
        break;
        
      case 'Age confirmation (select one)':
        // Handle multiple possible checkbox values
        const ageAnswer = answer.toString().toLowerCase();
        data.age_confirmed = ageAnswer.includes('18') || 
                            ageAnswer.includes('older') || 
                            ageAnswer === 'yes' ||
                            ageAnswer === 'true' ||
                            answer === true;
        console.log(`🔍 Age confirmation processed: "${ageAnswer}" -> ${data.age_confirmed}`);
        break;
        
      case 'Are you comfortable advising from a \'college girl\' perspective?':
        const perspectiveAnswer = answer.toString().toLowerCase();
        data.comfortable_with_college_girl_perspective = perspectiveAnswer === 'yes' || 
                                                        perspectiveAnswer === 'true' ||
                                                        answer === true;
        break;
        
      case 'Which topics are you comfortable advising on? (Select all that apply)':
        data.topics_comfortable_with = parseTopicsArray(answer);
        break;
        
      case 'Do you have prior advice/listening/mentoring experience? Please describe.':
        data.prior_experience = answer.toString().trim();
        break;
        
      case 'Tell us about yourself - what makes you a great mentor? (Bio)':
        data.bio = answer.toString().trim();
        break;
        
      case 'Introduction video URL (YouTube, Loom, etc.) - Optional':
        data.intro_video_url = answer ? answer.toString().trim() : null;
        break;
        
      case 'Which session formats can you offer?':
        data.session_formats = parseSessionFormatsArray(answer);
        break;
        
      case 'How many hours per week can you dedicate to advising?':
        data.hours_per_week = answer.toString().trim();
        break;
        
      case 'Languages you can advise in (optional)':
        data.languages = answer ? answer.toString().trim() : 'English';
        break;
        
      case 'Social/portfolio links (optional)':
        data.social_portfolio_links = answer ? answer.toString().trim() : null;
        break;
        
      case 'Agreement (required)':
        // Handle multiple possible agreement values
        const agreementAnswer = answer.toString().toLowerCase();
        data.agreement_accepted = agreementAnswer.includes('agree') || 
                                 agreementAnswer === 'yes' ||
                                 agreementAnswer === 'true' ||
                                 answer === true;
        console.log(`🔍 Agreement processed: "${agreementAnswer}" -> ${data.agreement_accepted}`);
        break;
        
      default:
        console.log(`⚠️ Unrecognized question: "${question}"`);
        break;
    }
  });
  
  // Use respondent email if no email field in form
  if (!data.email && respondentEmail) {
    data.email = respondentEmail.toLowerCase().trim();
  }
  
  console.log('🔄 Final transformed data:', JSON.stringify(data, null, 2));
  return data;
}

/**
 * Enhanced debugging function to check form values
 */
function debugLastFormResponse() {
  try {
    if (!FORM_ID || FORM_ID === 'YOUR_GOOGLE_FORM_ID') {
      console.error('❌ Please set your FORM_ID first');
      return;
    }
    
    const form = FormApp.openById(FORM_ID);
    const responses = form.getResponses();
    
    if (responses.length === 0) {
      console.log('📭 No form responses found');
      return;
    }
    
    const lastResponse = responses[responses.length - 1];
    const itemResponses = lastResponse.getItemResponses();
    
    console.log(`🔍 DEBUGGING LAST FORM RESPONSE`);
    console.log(`📅 Timestamp: ${lastResponse.getTimestamp()}`);
    console.log(`📧 Email: ${lastResponse.getRespondentEmail()}`);
    console.log(`📊 Total answers: ${itemResponses.length}`);
    console.log('\n📝 Raw responses:');
    
    itemResponses.forEach((itemResponse, index) => {
      const question = itemResponse.getItem().getTitle();
      const answer = itemResponse.getResponse();
      console.log(`${index + 1}. Q: "${question}"`);
      console.log(`   A: "${answer}" (type: ${typeof answer})`);
      console.log(`   Raw value: ${JSON.stringify(answer)}`);
      console.log('');
    });
    
    // Transform and validate the response
    console.log('\n🔄 TRANSFORMATION TEST:');
    const transformedData = transformFormResponse(itemResponses, lastResponse.getRespondentEmail());
    
    console.log('\n✅ VALIDATION TEST:');
    const isValid = validateApplication(transformedData);
    console.log(`Validation result: ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`);
    
  } catch (error) {
    console.error('❌ Error debugging form response:', error);
  }
}

/**
 * Quick test function to simulate form processing
 */
function testFormProcessing() {
  console.log('🧪 Testing form processing with debug...');
  
  // First debug the last response
  debugLastFormResponse();
  
  console.log('\n📤 Testing Supabase submission...');
  
  // Then test a sample submission
  const sampleData = {
    email: 'debug.test@example.com',
    full_name: 'Debug Test User',
    university: 'Debug University',
    graduation_year: 2024,
    age_confirmed: true,  // Explicit true
    comfortable_with_college_girl_perspective: true,
    topics_comfortable_with: ['texting_analysis'],
    prior_experience: 'Debug test experience',
    session_formats: ['async_chat'],
    hours_per_week: '4–6 hours per week',
    languages: 'English',
    agreement_accepted: true,  // Explicit true
    application_status: 'pending'
  };
  
  const isValid = validateApplication(sampleData);
  console.log(`Sample validation: ${isValid ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  if (isValid) {
    const result = submitToSupabase(sampleData);
    console.log('Submission result:', result);
  }
}
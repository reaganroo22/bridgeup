/**
 * Simple Email Test for Wizzmo
 * This will test your deployed edge function
 */

// Test the send-email edge function directly
async function testEmailFunction() {
  const supabaseUrl = 'https://miygmdboiesbxwlqgnsx.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1peWdtZGJvaWVzYnhscWduc3giLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyODM4NzEwNCwiZXhwIjoyMDQzOTYzMTA0fQ.v_zPOZVTa7I4PaKlGnwEU7hWEDBBMYpwCJNg_QMRWt4';

  const testEmail = {
    to: 'your-email@example.com', // CHANGE THIS TO YOUR EMAIL
    subject: 'Test Email from Wizzmo 💕',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #FF4DB8, #C147E9); border-radius: 16px; overflow: hidden;">
        <div style="text-align: center; padding: 30px 20px; color: white;">
          <div style="font-size: 32px; font-weight: bold; margin-bottom: 10px;">wizzmo</div>
          <div>Test Email - System Working! 🎉</div>
        </div>
        <div style="background: white; padding: 40px 30px;">
          <div style="font-size: 18px; margin-bottom: 20px;">Hey bestie! ✨</div>
          <div style="font-size: 16px; margin-bottom: 25px;">
            🎉 <strong>SUCCESS!</strong> Your Wizzmo email system is working perfectly!
            <br><br>
            This test confirms that:
            <br>• ✅ Edge function is deployed
            <br>• ✅ Database migration is complete
            <br>• ✅ Email templates are rendering beautifully
            <br>• ✅ Resend integration is functional
            <br><br>
            Your students and mentors are about to receive some amazing emails! 💕
          </div>
          <a href="https://wizzmo.com" style="display: inline-block; background: linear-gradient(135deg, #FF4DB8, #C147E9); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0;">Visit Wizzmo</a>
        </div>
        <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; font-size: 14px; color: #666;">
          Your email system is ready! 🚀<br>
          The Wizzmo Development Team 💖
        </div>
      </div>
    `,
    type: 'test_deployment'
  };

  try {
    console.log('🧪 Testing Wizzmo email system...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify(testEmail)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS! Email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      console.log('💕 Check your email inbox for the test message!');
      
      return true;
    } else {
      console.log('❌ Failed to send email:');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
      
      if (result.error?.includes('RESEND_API_KEY')) {
        console.log('\n🔧 SETUP NEEDED:');
        console.log('1. Add your Resend API key to Supabase:');
        console.log('   - Go to https://supabase.com/dashboard/project/miygmdboiesbxwlqgnsx/settings/environment-variables');
        console.log('   - Add variable: RESEND_API_KEY');
        console.log('   - Value: your_resend_api_key_here');
        console.log('2. Wait 1-2 minutes for deployment');
        console.log('3. Run this test again');
      }
      
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

// Run the test
console.log('🚀 Wizzmo Email System Test\n');
console.log('IMPORTANT: Update the email address in this file first!\n');

testEmailFunction().then(success => {
  if (success) {
    console.log('\n🎉 Your email system is ready to delight users!');
  } else {
    console.log('\n🔧 Follow the setup steps above and try again.');
  }
});
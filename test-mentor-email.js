/**
 * Test Mentor Application Email System
 * Send retroactive confirmation email to Reagan
 */

async function testMentorApplicationEmail() {
  const supabaseUrl = 'https://miygmdboiesbxwlqgnsx.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1peWdtZGJvaWVzYnhscWduc3giLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyODM4NzEwNCwiZXhwIjoyMDQzOTYzMTA0fQ.v_zPOZVTa7I4PaKlGnwEU7hWEDBBMYpwCJNg_QMRWt4';

  try {
    console.log('🧪 Testing Mentor Application Confirmation Email...');
    
    // Send confirmation email to Reagan
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        type: 'mentor_application_confirmation',
        to: 'reagan.stock@icloud.com',
        data: {
          firstName: 'Reagan',
          lastName: 'Stock',
          university: 'Georgetown University',
          applicationId: 'a34c62fb-a2c4-4ab2-9892-68ccf3face77'
        }
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Mentor application confirmation email sent successfully!');
      console.log('📧 Email sent to: reagan.stock@icloud.com');
      console.log('🔗 Message ID:', result.messageId);
      
      // Test admin notification too
      console.log('\n🧪 Testing Admin Notification Email...');
      
      const adminResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          type: 'mentor_application_admin_alert',
          to: 'team@wizzmo.app',
          data: {
            firstName: 'Reagan',
            lastName: 'Stock',
            email: 'reagan.stock@icloud.com',
            university: 'Georgetown University',
            graduationYear: '2029',
            whyJoin: "I'd be a good mentor because I'm kind.",
            applicationId: 'a34c62fb-a2c4-4ab2-9892-68ccf3face77'
          }
        }),
      });

      const adminResult = await adminResponse.json();
      
      if (adminResult.success) {
        console.log('✅ Admin notification email sent successfully!');
        console.log('📧 Email sent to: team@wizzmo.app');
        console.log('🔗 Message ID:', adminResult.messageId);
      } else {
        console.log('❌ Admin email failed:', adminResult.error);
      }
      
      console.log('\n🎉 Mentor application email system is now working!');
      return true;
      
    } else {
      console.log('❌ Failed to send confirmation email:');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
      return false;
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    return false;
  }
}

// Run the test
testMentorApplicationEmail();
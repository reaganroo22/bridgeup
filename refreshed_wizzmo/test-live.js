/**
 * Live test of Wizzmo email system
 */

async function testEmailSystem() {
  const supabaseUrl = 'https://miygmdboiesbxwlqgnsx.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1peWdtZGJvaWVzYnhscWduc3giLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyODM4NzEwNCwiZXhwIjoyMDQzOTYzMTA0fQ.v_zPOZVTa7I4PaKlGnwEU7hWEDBBMYpwCJNg_QMRWt4';

  console.log('🧪 Testing Wizzmo Email System...\n');

  // Test 1: Welcome Email
  console.log('1️⃣ Testing Welcome Email...');
  const welcomeTest = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      to: 'test@wizzmo.com',
      subject: 'Welcome to Wizzmo! 💕 Your college bestie is here',
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #FF4DB8, #C147E9); border-radius: 16px; overflow: hidden;">
          <div style="text-align: center; padding: 30px; color: white;">
            <h1 style="font-size: 32px; margin: 0;">wizzmo</h1>
            <p>Your college advice companion</p>
          </div>
          <div style="background: white; padding: 40px;">
            <h2>Hey bestie! ✨</h2>
            <p>Welcome to Wizzmo - where college girls get real advice from amazing mentors! 💕</p>
            <p><strong>Your first question is completely FREE!</strong> 🎉</p>
            <a href="wizzmo://ask" style="display: inline-block; background: linear-gradient(135deg, #FF4DB8, #C147E9); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0;">Ask Your First Question</a>
          </div>
        </div>
      `,
      type: 'student_welcome'
    })
  });

  const welcomeResult = await welcomeTest.json();
  console.log(welcomeTest.ok ? '✅ Welcome email: SUCCESS' : '❌ Welcome email: FAILED');
  console.log('Response:', welcomeResult);

  // Test 2: New Question Notification
  console.log('\n2️⃣ Testing Mentor Notification...');
  const mentorTest = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      to: 'mentor@wizzmo.com',
      subject: 'New dating advice question ⚡',
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #FF4DB8, #C147E9); border-radius: 16px; overflow: hidden;">
          <div style="text-align: center; padding: 30px; color: white;">
            <h1 style="font-size: 32px; margin: 0;">wizzmo</h1>
            <p>Perfect match for your expertise</p>
          </div>
          <div style="background: white; padding: 40px;">
            <h2>Hey amazing mentor! 🎯</h2>
            <p>A college student needs your wisdom in <strong>dating advice</strong>:</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; border-left: 4px solid #FF4DB8; margin: 20px 0;">
              <strong>"How do I know if he's actually interested or just being friendly?"</strong>
              <br><small style="color: #666;">Priority • dating advice • College student</small>
            </div>
            <a href="wizzmo://mentor-questions" style="display: inline-block; background: linear-gradient(135deg, #FF4DB8, #C147E9); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px;">Answer This Question</a>
          </div>
        </div>
      `,
      type: 'new_question_available'
    })
  });

  const mentorResult = await mentorTest.json();
  console.log(mentorTest.ok ? '✅ Mentor notification: SUCCESS' : '❌ Mentor notification: FAILED');
  console.log('Response:', mentorResult);

  console.log('\n🎉 Email system test complete!');
  console.log('Check the email_logs table to see logged emails.');
}

testEmailSystem();
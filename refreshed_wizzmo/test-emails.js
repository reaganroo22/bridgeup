/**
 * Email Testing Script for Wizzmo
 * 
 * Run this script to test individual email templates and flows
 * Usage: node test-emails.js
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://miygmdboiesbxwlqgnsx.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWelcomeEmail() {
  console.log('🧪 Testing Welcome Email...');
  
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'test@example.com',
        subject: 'Welcome to Wizzmo! 💕 Your college bestie is here',
        html: `
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #FF4DB8, #C147E9); border-radius: 16px; overflow: hidden; }
            .header { text-align: center; padding: 30px 20px; color: white; }
            .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .content { background: white; padding: 40px 30px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #FF4DB8, #C147E9); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
          </style>
          <div class="container">
            <div class="header">
              <div class="logo">wizzmo</div>
              <div>Your college advice companion</div>
            </div>
            <div class="content">
              <div style="font-size: 18px; margin-bottom: 20px;">Hey bestie! ✨</div>
              <div style="font-size: 16px; margin-bottom: 25px;">
                Welcome to Wizzmo - the place where college girls get real advice from amazing mentors! 💕
                <br><br>
                <strong>Your first question is completely FREE!</strong> 🎉
              </div>
              <a href="wizzmo://ask" class="cta-button">Ask Your First Question</a>
            </div>
          </div>
        `,
        type: 'test_welcome'
      }
    });

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Welcome email sent successfully!', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

async function testNewQuestionEmail() {
  console.log('🧪 Testing New Question Email...');
  
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'mentor@example.com',
        subject: 'New dating advice question ⚡',
        html: `
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #FF4DB8, #C147E9); border-radius: 16px; overflow: hidden; }
            .header { text-align: center; padding: 30px 20px; color: white; }
            .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .content { background: white; padding: 40px 30px; }
            .question-box { background: #f8f9fa; padding: 20px; border-radius: 12px; border-left: 4px solid #FF4DB8; margin: 20px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #FF4DB8, #C147E9); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
          </style>
          <div class="container">
            <div class="header">
              <div class="logo">wizzmo</div>
              <div>Perfect match for your expertise</div>
            </div>
            <div class="content">
              <div style="font-size: 18px; margin-bottom: 20px;">Hey amazing mentor! 🎯</div>
              <div style="font-size: 16px; margin-bottom: 25px;">
                A college student needs your wisdom in <strong>dating advice</strong>:
              </div>
              <div class="question-box">
                <strong>"How do I know if he's actually interested or just being friendly?"</strong>
                <br><br>
                <small style="color: #666;">Priority priority • dating advice • College student</small>
              </div>
              <a href="wizzmo://mentor-questions" class="cta-button">Answer This Question</a>
            </div>
          </div>
        `,
        type: 'test_new_question'
      }
    });

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ New question email sent successfully!', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

async function testMessageNotificationEmail() {
  console.log('🧪 Testing Message Notification Email...');
  
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'student@example.com',
        subject: 'Sarah responded to your question! 💬',
        html: `
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #FF4DB8, #C147E9); border-radius: 16px; overflow: hidden; }
            .header { text-align: center; padding: 30px 20px; color: white; }
            .logo { font-size: 32px; font-weight: bold; margin-bottom: 10px; }
            .content { background: white; padding: 40px 30px; }
            .message-preview { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #FF4DB8; font-style: italic; margin: 20px 0; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #FF4DB8, #C147E9); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; margin: 20px 0; }
          </style>
          <div class="container">
            <div class="header">
              <div class="logo">wizzmo</div>
              <div>New message received</div>
            </div>
            <div class="content">
              <div style="font-size: 18px; margin-bottom: 20px;">Hey gorgeous! 💌</div>
              <div style="font-size: 16px; margin-bottom: 25px;">
                <strong>Sarah</strong> just sent you some amazing advice:
              </div>
              <div class="message-preview">
                "Girl, I've been exactly where you are! When I was a sophomore, I had the same confusion about signals. Here's what I learned..."
              </div>
              <a href="wizzmo://chat" class="cta-button">Read Full Response</a>
            </div>
          </div>
        `,
        type: 'test_message_notification'
      }
    });

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Message notification email sent successfully!', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Wizzmo Email Tests...\n');
  
  await testWelcomeEmail();
  console.log('');
  
  await testNewQuestionEmail();
  console.log('');
  
  await testMessageNotificationEmail();
  console.log('');
  
  console.log('✅ All email tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testWelcomeEmail,
  testNewQuestionEmail,
  testMessageNotificationEmail,
  runAllTests
};
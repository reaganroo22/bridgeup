/**
 * Wizzmo Email Service using Resend
 * 
 * Handles all email communications including:
 * - Student journey emails
 * - Mentor notifications
 * - Transactional emails
 * - Engagement campaigns
 */

import { supabase } from './supabase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  reply_to?: string;
}

export type EmailType = 
  // Student emails
  | 'student_welcome'
  | 'student_getting_started'
  | 'student_encouragement'
  | 'question_submitted'
  | 'question_matched'
  | 'new_message_from_mentor'
  | 'chat_resolved'
  | 'session_feedback_request'
  | 'weekly_digest_student'
  | 'inactive_student'
  // Mentor emails
  | 'mentor_application_submitted'
  | 'mentor_application_approved'
  | 'mentor_application_rejected'
  | 'new_question_available'
  | 'student_accepted_mentor'
  | 'new_message_from_student'
  | 'session_rated'
  | 'weekly_stats_mentor'
  | 'monthly_impact_mentor'
  | 'inactive_mentor'
  // Transactional
  | 'password_reset'
  | 'email_verification'
  | 'profile_updated';

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const WIZZMO_STYLES = `
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #FF4DB8, #C147E9);
      padding: 0;
      border-radius: 16px;
      overflow: hidden;
    }
    .header {
      text-align: center;
      padding: 30px 20px;
      color: white;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .content {
      background: white;
      padding: 40px 30px;
      margin: 0;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .main-text {
      font-size: 16px;
      margin-bottom: 25px;
      line-height: 1.6;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #FF4DB8, #C147E9);
      color: white !important;
      padding: 15px 30px;
      text-decoration: none;
      border-radius: 25px;
      font-weight: bold;
      margin: 20px 0;
      text-align: center;
      box-shadow: 0 4px 12px rgba(255, 77, 184, 0.3);
    }
    .footer {
      background: #f8f9fa;
      padding: 20px 30px;
      text-align: center;
      font-size: 14px;
      color: #666;
    }
    .emoji {
      font-size: 20px;
    }
    .highlight {
      background: linear-gradient(135deg, #FF4DB8, #C147E9);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: bold;
    }
  </style>
`;

export const EMAIL_TEMPLATES: Record<EmailType, (data: any) => EmailTemplate> = {
  
  // ============================================================================
  // STUDENT EMAIL TEMPLATES
  // ============================================================================
  
  student_welcome: (data: { firstName?: string }) => ({
    subject: "Welcome to Wizzmo! 💕 Your college bestie is here",
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>Your college advice companion</div>
        </div>
        <div class="content">
          <div class="greeting">Hey ${data.firstName || 'bestie'}! <span class="emoji">✨</span></div>
          <div class="main-text">
            Welcome to Wizzmo - the place where college girls get real advice from amazing mentors who've been exactly where you are! 💕
            <br><br>
            Whether you need help with dating, friendships, academics, or just navigating college life, our incredible Wizzmos are here to support you every step of the way.
            <br><br>
            <strong>Your first question is completely FREE!</strong> 🎉
          </div>
          <a href="wizzmo://ask" class="cta-button">Ask Your First Question</a>
          <div class="main-text">
            Ready to get some life-changing advice? We can't wait to help you shine! ✨
          </div>
        </div>
        <div class="footer">
          With love,<br>
          The Wizzmo Team 💖<br>
          <a href="mailto:support@wizzmo.app">support@wizzmo.app</a>
        </div>
      </div>
    `,
  }),

  student_getting_started: (data: { firstName?: string }) => ({
    subject: "Ready for some amazing advice? Here's how Wizzmo works 🌟",
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>How to get the best advice</div>
        </div>
        <div class="content">
          <div class="greeting">Hey ${data.firstName || 'gorgeous'}! <span class="emoji">💫</span></div>
          <div class="main-text">
            Ready to unlock the best advice of your life? Here's how Wizzmo works:
            <br><br>
            <strong>1. Ask your question</strong> 💭<br>
            Choose a category and share what's on your mind - dating, friendships, college life, anything!
            <br><br>
            <strong>2. Get matched with a Wizzmo</strong> ✨<br>
            Our amazing mentors will see your question and the perfect one will reach out to help!
            <br><br>
            <strong>3. Chat and get advice</strong> 💬<br>
            Have a real conversation with someone who truly gets it and has been there before.
            <br><br>
            Popular categories right now: Dating advice, Self confidence, Mental health, College life 🔥
          </div>
          <a href="wizzmo://ask" class="cta-button">Browse Popular Questions</a>
        </div>
        <div class="footer">
          Your support team,<br>
          The Wizzmo Family 💕
        </div>
      </div>
    `,
  }),

  question_submitted: (data: { firstName?: string; questionTitle: string; category: string }) => ({
    subject: "Your question is live! 🚀",
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>Question submitted successfully</div>
        </div>
        <div class="content">
          <div class="greeting">Amazing work, ${data.firstName || 'bestie'}! <span class="emoji">🎉</span></div>
          <div class="main-text">
            Your question "<strong>${data.questionTitle}</strong>" is now live in the <span class="highlight">${data.category}</span> category!
            <br><br>
            Here's what happens next:
            <br><br>
            ✨ Our mentors are already seeing your question<br>
            💕 The perfect Wizzmo will reach out within hours<br>
            💬 You'll get a notification when they want to help<br>
            🌟 Then you can start your advice session!
            <br><br>
            <strong>Pro tip:</strong> The more details you share, the better advice you'll get! 💡
          </div>
          <a href="wizzmo://advice" class="cta-button">Check Your Inbox</a>
        </div>
        <div class="footer">
          Connecting you with amazing mentors,<br>
          The Wizzmo Team 💖
        </div>
      </div>
    `,
  }),

  question_matched: (data: { firstName?: string; mentorName: string; mentorUniversity?: string; mentorBio?: string; questionTitle: string }) => ({
    subject: `Amazing! ${data.mentorName} wants to help you 💕`,
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>You've been matched!</div>
        </div>
        <div class="content">
          <div class="greeting">Exciting news, ${data.firstName || 'bestie'}! <span class="emoji">🎯</span></div>
          <div class="main-text">
            <strong>${data.mentorName}</strong> wants to help you with "${data.questionTitle}"!
            <br><br>
            <strong>About your mentor:</strong><br>
            🎓 ${data.mentorUniversity || 'Amazing university'}<br>
            ✨ ${data.mentorBio || 'Experienced mentor ready to help you succeed'}<br>
            💕 Perfect match for your question<br>
            <br>
            ${data.mentorName} has been exactly where you are and knows how to help you navigate this situation. Ready to get some life-changing advice?
          </div>
          <a href="wizzmo://chat" class="cta-button">Start Chatting Now</a>
        </div>
        <div class="footer">
          Making connections that matter,<br>
          The Wizzmo Team 💫
        </div>
      </div>
    `,
  }),

  new_message_from_mentor: (data: { firstName?: string; mentorName: string; messagePreview: string; urgent?: boolean }) => ({
    subject: `${data.mentorName} responded to your question! ${data.urgent ? '🚨' : '💬'}`,
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>New message received</div>
        </div>
        <div class="content">
          <div class="greeting">Hey ${data.firstName || 'gorgeous'}! <span class="emoji">💌</span></div>
          <div class="main-text">
            <strong>${data.mentorName}</strong> just sent you some amazing advice:
            <br><br>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #FF4DB8; font-style: italic;">
              "${data.messagePreview}..."
            </div>
            <br>
            ${data.urgent ? '⚡ This looks important - check it out now!' : 'Ready to see the full message and continue the conversation?'}
          </div>
          <a href="wizzmo://chat" class="cta-button">Read Full Response</a>
        </div>
        <div class="footer">
          Delivering wisdom that matters,<br>
          The Wizzmo Team 💕
        </div>
      </div>
    `,
  }),

  // ============================================================================
  // MENTOR EMAIL TEMPLATES
  // ============================================================================

  mentor_application_submitted: (data: { firstName?: string; fullName?: string }) => ({
    subject: "Thanks for applying to be a Wizzmo! 💕",
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>Application received</div>
        </div>
        <div class="content">
          <div class="greeting">Hey ${data.firstName || 'amazing'}! <span class="emoji">✨</span></div>
          <div class="main-text">
            Thank you for applying to become a Wizzmo mentor! We're so excited that you want to help support college women. 💕
            <br><br>
            <strong>What happens next:</strong><br>
            ✨ We'll review your application within 3-5 business days<br>
            💕 Our team will check your background and expertise<br>
            📧 You'll receive an email with our decision<br>
            🌟 If approved, we'll send you onboarding materials!
            <br><br>
            We can't wait to potentially welcome you to the Wizzmo family of incredible mentors who are changing lives every day.
          </div>
          <a href="https://wizzmo.app/mentor" class="cta-button">Learn About Mentoring</a>
        </div>
        <div class="footer">
          Grateful for your interest,<br>
          The Wizzmo Team 💖
        </div>
      </div>
    `,
  }),

  mentor_application_approved: (data: { firstName?: string }) => ({
    subject: "Welcome to the Wizzmo family! 🎉",
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>You're officially a Wizzmo!</div>
        </div>
        <div class="content">
          <div class="greeting">Congratulations, ${data.firstName || 'amazing'}! <span class="emoji">🌟</span></div>
          <div class="main-text">
            Your application has been approved and you're now an official Wizzmo mentor! 🎉
            <br><br>
            You're about to make such an incredible impact on students' lives. Here's what's next:
            <br><br>
            ✨ Browse available questions in your expertise areas<br>
            💕 Choose questions that resonate with you<br>
            💬 Start meaningful conversations with students<br>
            🌟 Help shape the next generation of amazing women<br>
            <br>
            <strong>Your mentor dashboard is ready!</strong> Students are already asking questions that you're perfect to answer.
          </div>
          <a href="wizzmo://mentor-dashboard" class="cta-button">Start Helping Students</a>
        </div>
        <div class="footer">
          So grateful to have you,<br>
          The Wizzmo Team 💖
        </div>
      </div>
    `,
  }),

  new_question_available: (data: { mentorName?: string; questionTitle: string; category: string; urgency: 'low' | 'medium' | 'high'; studentYear?: string }) => {
    const urgencyEmoji = { low: '💭', medium: '⚡', high: '🚨' };
    const urgencyText = { low: 'New', medium: 'Priority', high: 'Urgent' };
    
    return {
      subject: `${urgencyText[data.urgency]} ${data.category} question ${urgencyEmoji[data.urgency]}`,
      html: `
        ${WIZZMO_STYLES}
        <div class="container">
          <div class="header">
            <div class="logo">wizzmo</div>
            <div>Perfect match for your expertise</div>
          </div>
          <div class="content">
            <div class="greeting">Hey ${data.mentorName || 'amazing mentor'}! <span class="emoji">🎯</span></div>
            <div class="main-text">
              A ${data.studentYear || 'college student'} needs your wisdom in <span class="highlight">${data.category}</span>:
              <br><br>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; border-left: 4px solid #FF4DB8;">
                <strong>"${data.questionTitle}"</strong>
                <br><br>
                <small style="color: #666;">
                  ${urgencyText[data.urgency]} priority • ${data.category} • ${data.studentYear || 'College student'}
                </small>
              </div>
              <br>
              This feels like the perfect question for your expertise! Ready to make a difference in this student's life?
            </div>
            <a href="wizzmo://mentor-questions" class="cta-button">Answer This Question</a>
          </div>
          <div class="footer">
            Connecting wisdom with those who need it,<br>
            The Wizzmo Team 💫
          </div>
        </div>
      `,
    };
  },

  student_accepted_mentor: (data: { mentorName?: string; studentName: string; questionTitle: string }) => ({
    subject: "You're matched! ✨ Time to share your wisdom",
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>Student accepted your help!</div>
        </div>
        <div class="content">
          <div class="greeting">Fantastic news, ${data.mentorName || 'mentor'}! <span class="emoji">🎉</span></div>
          <div class="main-text">
            <strong>${data.studentName}</strong> chose YOU to help with their question: "${data.questionTitle}"
            <br><br>
            She's excited to learn from your experience and wisdom. This is your chance to make a real difference in a young woman's college journey!
            <br><br>
            <strong>Tips for a great session:</strong><br>
            💕 Share your personal experiences<br>
            ✨ Be encouraging and supportive<br>
            💬 Ask follow-up questions to understand better<br>
            🌟 Help her see her own strength and potential
          </div>
          <a href="wizzmo://mentor-chat" class="cta-button">Start the Conversation</a>
        </div>
        <div class="footer">
          Thank you for being amazing,<br>
          The Wizzmo Team 💖
        </div>
      </div>
    `,
  }),

  new_message_from_student: (data: { mentorName?: string; studentName: string; messagePreview: string }) => ({
    subject: `${data.studentName} sent you a message 💬`,
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>New message from student</div>
        </div>
        <div class="content">
          <div class="greeting">Hi ${data.mentorName || 'mentor'}! <span class="emoji">💌</span></div>
          <div class="main-text">
            <strong>${data.studentName}</strong> just replied:
            <br><br>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #FF4DB8; font-style: italic;">
              "${data.messagePreview}..."
            </div>
            <br>
            She's waiting for your wisdom! Keep the conversation going and help her navigate this situation.
          </div>
          <a href="wizzmo://mentor-chat" class="cta-button">Reply Now</a>
        </div>
        <div class="footer">
          Facilitating meaningful connections,<br>
          The Wizzmo Team 💕
        </div>
      </div>
    `,
  }),

  session_rated: (data: { mentorName?: string; rating: number; feedback?: string; studentName: string }) => {
    const stars = '⭐'.repeat(data.rating);
    return {
      subject: `You got ${stars} from ${data.studentName}! 🎉`,
      html: `
        ${WIZZMO_STYLES}
        <div class="container">
          <div class="header">
            <div class="logo">wizzmo</div>
            <div>Student feedback received</div>
          </div>
          <div class="content">
            <div class="greeting">Amazing work, ${data.mentorName || 'mentor'}! <span class="emoji">🌟</span></div>
            <div class="main-text">
              <strong>${data.studentName}</strong> rated your session:
              <br><br>
              <div style="text-align: center; font-size: 32px; margin: 20px 0;">
                ${stars}
              </div>
              ${data.feedback ? `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #FF4DB8; font-style: italic;">
                  "${data.feedback}"
                </div>
                <br>
              ` : ''}
              You're making such an incredible difference in students' lives! Thank you for sharing your wisdom and helping young women thrive.
            </div>
            <a href="wizzmo://mentor-stats" class="cta-button">See Your Impact</a>
          </div>
          <div class="footer">
            Grateful for mentors like you,<br>
            The Wizzmo Team 💖
          </div>
        </div>
      `,
    };
  },

  weekly_stats_mentor: (data: { mentorName?: string; questionsAnswered: number; avgRating: number; responseTime: string; rank?: number }) => ({
    subject: "Your Wizzmo week in review 📊",
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>Weekly impact report</div>
        </div>
        <div class="content">
          <div class="greeting">Look at this impact, ${data.mentorName || 'superstar'}! <span class="emoji">💪</span></div>
          <div class="main-text">
            Here's how you changed lives this week:
            <br><br>
            <div style="background: linear-gradient(135deg, #FF4DB8, #C147E9); padding: 20px; border-radius: 12px; color: white; text-align: center;">
              <div style="font-size: 24px; font-weight: bold;">${data.questionsAnswered}</div>
              <div>Questions Answered</div>
              <br>
              <div style="font-size: 24px; font-weight: bold;">${data.avgRating.toFixed(1)} ⭐</div>
              <div>Average Rating</div>
              <br>
              <div style="font-size: 24px; font-weight: bold;">${data.responseTime}</div>
              <div>Avg Response Time</div>
            </div>
            ${data.rank ? `<br><div style="text-align: center; font-size: 18px;">🏆 You're #${data.rank} this week!</div>` : ''}
            <br>
            Every conversation you have helps a young woman feel more confident, supported, and ready to take on the world. Thank you for being incredible! 💕
          </div>
          <a href="wizzmo://mentor-dashboard" class="cta-button">Keep Making Impact</a>
        </div>
        <div class="footer">
          Celebrating your amazing work,<br>
          The Wizzmo Team 🌟
        </div>
      </div>
    `,
  }),

  // ============================================================================
  // TRANSACTIONAL EMAIL TEMPLATES
  // ============================================================================

  email_verification: (data: { firstName?: string; verificationLink: string }) => ({
    subject: "Verify your Wizzmo email 💌",
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>Email verification</div>
        </div>
        <div class="content">
          <div class="greeting">Hey ${data.firstName || 'gorgeous'}! <span class="emoji">✨</span></div>
          <div class="main-text">
            Just one more step to complete your Wizzmo account setup!
            <br><br>
            Click the button below to verify your email address and unlock all the amazing advice waiting for you.
          </div>
          <a href="${data.verificationLink}" class="cta-button">Verify Email Address</a>
          <div class="main-text">
            <small>This link will expire in 24 hours. If you didn't create a Wizzmo account, you can safely ignore this email.</small>
          </div>
        </div>
        <div class="footer">
          Setting you up for success,<br>
          The Wizzmo Team 💕
        </div>
      </div>
    `,
  }),

  password_reset: (data: { firstName?: string; resetLink: string }) => ({
    subject: "Reset your Wizzmo password 🔐",
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>Password reset request</div>
        </div>
        <div class="content">
          <div class="greeting">Hi ${data.firstName || 'bestie'}! <span class="emoji">💪</span></div>
          <div class="main-text">
            Someone (hopefully you!) requested a password reset for your Wizzmo account.
            <br><br>
            Click the button below to create a new password:
          </div>
          <a href="${data.resetLink}" class="cta-button">Reset Password</a>
          <div class="main-text">
            <small>This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email - your account is secure! 🛡️</small>
          </div>
        </div>
        <div class="footer">
          Keeping your account safe,<br>
          The Wizzmo Team 🔒
        </div>
      </div>
    `,
  }),

  mentor_application_rejected: (data: { firstName?: string; fullName?: string; notes?: string }) => ({
    subject: "Thank you for your interest in Wizzmo 💙",
    html: `
      ${WIZZMO_STYLES}
      <div class="container">
        <div class="header">
          <div class="logo">wizzmo</div>
          <div>Application update</div>
        </div>
        <div class="content">
          <div class="greeting">Hi ${data.firstName || 'there'}! <span class="emoji">💙</span></div>
          <div class="main-text">
            Thank you so much for your interest in becoming a Wizzmo mentor. We were genuinely impressed by your passion for supporting college women! 💕
            <br><br>
            After careful consideration, we've decided not to move forward with your application at this time. This decision reflects our current capacity and specific needs rather than your qualifications.
            ${data.notes ? `<br><br><strong>Additional feedback:</strong><br>${data.notes}` : ''}
            <br><br>
            <strong>Don't lose heart!</strong> We encourage you to apply again in 6 months as our needs evolve. In the meantime, you can still support college women by:
            <br><br>
            💕 Following @wizzmo for tips and community<br>
            ✨ Sharing Wizzmo with friends who need support<br>
            🌟 Staying connected for future opportunities
          </div>
          <a href="https://wizzmo.app/community" class="cta-button">Join Our Community</a>
        </div>
        <div class="footer">
          With gratitude for your interest,<br>
          The Wizzmo Team 💖
        </div>
      </div>
    `,
  }),
};

// ============================================================================
// EMAIL SERVICE FUNCTIONS
// ============================================================================

export async function sendEmail(type: EmailType, recipientEmail: string, data: any): Promise<boolean> {
  try {
    const template = EMAIL_TEMPLATES[type](data);
    
    // Use Supabase Edge Function to send email via Resend
    const { data: result, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: recipientEmail,
        subject: template.subject,
        html: template.html,
        type: type
      }
    });

    if (error) {
      console.error('[EmailService] Error sending email:', error);
      return false;
    }

    console.log(`[EmailService] Email sent successfully: ${type} to ${recipientEmail}`);
    
    // Log email in database
    await logEmail(type, recipientEmail, template.subject, 'sent');
    
    return true;
  } catch (error) {
    console.error('[EmailService] Unexpected error:', error);
    await logEmail(type, recipientEmail, '', 'failed');
    return false;
  }
}

async function logEmail(type: EmailType, recipient: string, subject: string, status: 'sent' | 'failed') {
  try {
    await supabase.from('email_logs').insert({
      email_type: type,
      recipient_email: recipient,
      subject: subject,
      status: status,
      sent_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('[EmailService] Error logging email:', error);
  }
}

// ============================================================================
// EMAIL TRIGGER FUNCTIONS
// ============================================================================

export async function triggerWelcomeEmail(userId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  if (!user) return false;

  return await sendEmail('student_welcome', user.email, {
    firstName: user.full_name?.split(' ')[0]
  });
}

export async function triggerQuestionSubmitted(questionId: string) {
  const { data: question } = await supabase
    .from('questions')
    .select(`
      title,
      categories (name),
      users!student_id (email, full_name)
    `)
    .eq('id', questionId)
    .single();

  if (!question) return false;

  return await sendEmail('question_submitted', question.users.email, {
    firstName: question.users.full_name?.split(' ')[0],
    questionTitle: question.title,
    category: question.categories?.name || 'General'
  });
}

export async function triggerQuestionMatched(sessionId: string) {
  const { data: session } = await supabase
    .from('advice_sessions')
    .select(`
      questions!question_id (title),
      users!student_id (email, full_name),
      mentors:users!mentor_id (full_name, university, bio)
    `)
    .eq('id', sessionId)
    .single();

  if (!session) return false;

  return await sendEmail('question_matched', session.users.email, {
    firstName: session.users.full_name?.split(' ')[0],
    mentorName: session.mentors.full_name,
    mentorUniversity: session.mentors.university,
    mentorBio: session.mentors.bio,
    questionTitle: session.questions.title
  });
}

export async function triggerNewQuestionForMentors(questionId: string) {
  const { data: question } = await supabase
    .from('questions')
    .select(`
      title,
      urgency,
      categories (name),
      users!student_id (graduation_year)
    `)
    .eq('id', questionId)
    .single();

  if (!question) return false;

  // Get available mentors
  const { data: mentors } = await supabase
    .from('users')
    .select('id, email, full_name, mentor_profiles!inner(*)')
    .eq('role', 'mentor')
    .eq('mentor_profiles.availability_status', 'available');

  if (!mentors) return false;

  const studentYear = question.users.graduation_year ? 
    `Class of ${question.users.graduation_year}` : 'College student';

  // Send to all available mentors
  const promises = mentors.map(mentor => 
    sendEmail('new_question_available', mentor.email, {
      mentorName: mentor.full_name?.split(' ')[0],
      questionTitle: question.title,
      category: question.categories?.name || 'General',
      urgency: question.urgency,
      studentYear: studentYear
    })
  );

  await Promise.all(promises);
  return true;
}

export async function triggerNewMessageNotification(messageId: string) {
  const { data: message } = await supabase
    .from('messages')
    .select(`
      content,
      sender_id,
      advice_sessions!advice_session_id (
        student_id,
        mentor_id,
        students:users!student_id (email, full_name),
        mentors:users!mentor_id (email, full_name)
      )
    `)
    .eq('id', messageId)
    .single();

  if (!message) return false;

  const isFromMentor = message.sender_id === message.advice_sessions.mentor_id;
  const recipient = isFromMentor ? 
    message.advice_sessions.students : 
    message.advice_sessions.mentors;
  
  const senderName = isFromMentor ? 
    message.advice_sessions.mentors.full_name :
    message.advice_sessions.students.full_name;

  const emailType = isFromMentor ? 'new_message_from_mentor' : 'new_message_from_student';
  const messagePreview = message.content.length > 100 ? 
    message.content.substring(0, 100) : message.content;

  return await sendEmail(emailType, recipient.email, {
    firstName: recipient.full_name?.split(' ')[0],
    [isFromMentor ? 'mentorName' : 'studentName']: senderName,
    messagePreview: messagePreview
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  sendEmail,
  triggerWelcomeEmail,
  triggerQuestionSubmitted,
  triggerQuestionMatched,
  triggerNewQuestionForMentors,
  triggerNewMessageNotification,
};
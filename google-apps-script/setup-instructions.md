# Wizzmo Mentor Application Google Form Setup

## Quick Overview

✅ **Database ready** - `mentor_applications` table created with auto-approval trigger  
✅ **In-app onboarding** - Beautiful bear-centric mentor onboarding flow  
✅ **Auto-routing** - Approved mentors automatically go to mentor onboarding  
✅ **Google Apps Script** - Ready to process form submissions  

## 🚀 Implementation Steps

### 1. Create Simple Google Form

Create a Google Form with exactly **2 questions**:

1. **Email** (Required)
   - Question type: Short answer
   - Validation: Email format
   - Description: "Use the email you'll sign in with Google"

2. **Why would you be a good mentor?** (Required) 
   - Question type: Paragraph
   - Description: "Tell us why you'd be great at helping college students!"

### 2. Set Up Google Apps Script

1. Open your Google Form → **Three dots menu** → **Script editor**
2. Replace the default code with `mentor-form-processor.js`
3. **Set up Script Properties** (Script editor → Settings → Properties):
   - `SUPABASE_URL`: `https://qpttxbcglzocxbzzevmg.supabase.co`
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key
4. **Create trigger**: Triggers → Add trigger → Form submit

### 3. Test the Setup

1. Run `testSupabaseConnection()` in Apps Script to verify connection
2. Submit a test form response
3. Check Supabase `mentor_applications` table for the entry

## 🐻 How It Works

### Form Submission Flow:
```
Google Form Submission
    ↓
Google Apps Script processes
    ↓
Inserts into mentor_applications table (status: pending)
    ↓
Admin approves application
    ↓
Database trigger assigns mentor role
    ↓
Creates mentor_profile entry  
    ↓
User logs in → Gets mentor onboarding with bear! 🐻
```

### User Experience:
1. **Apply**: Fill out simple 2-question form
2. **Wait**: Get confirmation email, admin reviews
3. **Approved**: Admin changes status to 'approved' 
4. **Login**: User signs in with Google
5. **Onboarding**: Gets beautiful bear-centric mentor onboarding
6. **Ready**: Can start helping students!

## 🛠️ What You Need To Provide

1. **Supabase Service Key** - Add to Google Apps Script properties
2. **Admin Email(s)** - Replace in `mentor-form-processor.js` line 122
3. **Form Questions** - Create the 2-question Google Form
4. **Approval Process** - How you want to review/approve applications

## 🎯 Next Steps

The bear is ready to welcome new mentors! Just:
1. Create the Google Form
2. Set up the Apps Script 
3. Add your Supabase service key
4. Start collecting applications!

When you approve someone, they'll automatically get the mentor role and see the beautiful onboarding experience next time they log in.

---

*The bear believes in you! 🐻💕*
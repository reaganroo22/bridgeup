# 🐻 Wizzmo Mentor Application Setup Instructions

## 📋 Two Separate Scripts Setup

You need **TWO different Apps Script projects**:

### 1. 📝 Google Form Script (for submissions)

1. **Open your Google Form** (not the sheet)
2. **Click the 3 dots** → **Script editor** 
3. **Replace the default code** with `form-to-supabase.js`
4. **Save** (Ctrl+S or Cmd+S)

### 2. 📊 Google Sheets Script (for approvals)

1. **Open your Google Sheet**: "Become a Wizzmo (Responses)"
2. **Go to Extensions** → **Apps Script**
3. **Replace the default code** with `sheet-approval.js`
4. **Save** (Ctrl+S or Cmd+S)

### 3. 🎯 Set Up Triggers

**For the FORM script:**
1. **Run** `testSupabase()` to verify connection
2. **Triggers** → **Add Trigger** → **On form submit** → **Save**

**For the SHEET script:** 
1. **Run** `testConnection()` to verify connection  
2. **Triggers** → **Add Trigger** → **On edit** → **Save**

### 4. ✅ Test Everything

1. **Test connection**: Run `testConnection()` function
2. **Submit test form**: Fill out your Google Form
3. **Approve manually**: Check a box in "Approved?" column
4. **Check logs**: View → Logs to see what happened

## 🎯 How It Works

### For New Submissions:
1. **Student fills form** → Gets added to sheet
2. **Apps Script triggers** → Sends to Supabase database  
3. **Confirmation email** sent to applicant
4. **"Notes" column** updated with timestamp

### For Approvals:
1. **You check "Approved?" box** in sheet
2. **Apps Script triggers** → Updates Supabase to "approved"
3. **Database trigger** → Assigns mentor role to user
4. **Approval email** sent to new mentor
5. **Sheet columns updated** (Notes, Reviewed by)

### For User Login:
1. **Approved mentor logs in** → App detects mentor role
2. **Routing logic** → Sends to mentor onboarding  
3. **Bear-guided flow** → 7-step beautiful onboarding
4. **Ready to help** students!

## 📧 Email Flow

**Confirmation Email** (sent immediately):
```
Subject: Your Wizzmo Mentor Application Received! 🐻💕
- Thanks for applying
- Bear is excited to review
- 1-2 business day timeline
```

**Approval Email** (sent when approved):
```  
Subject: Welcome to the Wizzmo Mentor Team! 🎉🐻
- Congratulations message
- Next steps to log in
- Explanation of mentor onboarding
```

## 🔧 Your Sheet Columns (Detected):

- **Timestamp** ✅
- **Email** ✅ 
- **Why would you make a good Wizzmo?** ✅
- **I understand Wizzmo is peer advice, not therapy** ✅
- **Approved?** ✅ (You check this to approve)
- **Notes** ✅ (Auto-updated with timestamps)
- **Reviewed by** ✅ (Auto-updated with your email)

## 🚨 Important Notes

- **Use the same email** for Google OAuth login in the app
- **Database auto-assigns mentor role** when approved
- **Bear onboarding triggers** automatically for approved mentors
- **Manual approval** via sheet checkbox is the easiest workflow

## 🐻 Ready to Go!

Once set up, your flow is:
1. Share Google Form link
2. Applications come into your sheet
3. Review and check "Approved?" 
4. They automatically become mentors with bear onboarding!

The bear is ready to welcome new mentors! 🎉
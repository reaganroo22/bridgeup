# Google Forms → Supabase Mentor Approval Setup

This guide will help you set up automatic mentor approval when you check the "Approved" checkbox in your Google Sheets responses.

## 🔧 Setup Steps

### 1. Get Your Supabase Service Key

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/miygmdboiesbxwlqgnsx
2. Go to **Settings** → **API**
3. Copy the **service_role** key (NOT the anon key)
4. ⚠️ **Keep this secret** - it has admin privileges

### 2. Find Your Google Sheet Information

1. Open your mentor application responses Google Sheet
2. Copy the Sheet ID from the URL:
   - URL looks like: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
   - Copy the `{SHEET_ID}` part
3. Note which columns contain:
   - **Email addresses** (probably column B)
   - **Approval checkbox** (probably column J or later)

### 3. Create the Apps Script

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Delete any existing code in `Code.gs`
4. Copy and paste the entire `GOOGLE_APPS_SCRIPT_APPROVAL_WATCHER.js` code
5. **Update the configuration** at the top:
   ```javascript
   const SUPABASE_URL = 'https://miygmdboiesbxwlqgnsx.supabase.co';
   const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_KEY_HERE'; // Paste your service key
   const RESPONSES_SHEET_ID = 'YOUR_SHEET_ID_HERE'; // Paste your sheet ID
   const APPROVED_COLUMN = 'J'; // Update to your approval column letter
   const EMAIL_COLUMN = 'B'; // Update to your email column letter
   ```

### 4. Install the Trigger

1. In Apps Script, run the function **`installApprovalTrigger`**
2. When prompted, **authorize** the script to access your sheets
3. You should see "✅ Approval trigger installed successfully" in the logs

### 5. Test the Setup

1. First, run **`debugSheetStructure`** to verify column mappings
2. Then run **`testApproval`** with a real email from your sheet
3. Check the logs to see if it works

## 🎯 How It Works

1. **You check** the "Approved" checkbox in your responses sheet
2. **Apps Script detects** the change automatically
3. **Script finds** the mentor application in Supabase by email
4. **Script calls** the `process_mentor_application` function
5. **Supabase automatically:**
   - Updates application status to "approved"
   - Creates user account (if needed)
   - Sets user role to "mentor" or "both"
   - Creates mentor profile with verification
   - Sets up mentor expertise

## 📋 Sheet Structure Expected

Your Google Sheet should have columns like:

| A | B | C | ... | J | K |
|---|---|---|-----|---|---|
| Timestamp | Email | Name | ... | Approved | Processed |
| 2024-11-09 | user@email.com | John Doe | ... | ☑️ | 2024-11-09 15:30 |

- **Column B**: Email addresses
- **Column J**: Approval checkboxes  
- **Column K**: Auto-filled processing timestamp (optional)

## 🐛 Troubleshooting

### If approval doesn't work:

1. **Check the logs** in Apps Script → Executions
2. **Verify configuration** - run `debugSheetStructure`
3. **Test manually** - run `testApproval` with a real email
4. **Check Supabase** - verify the application exists in `mentor_applications` table

### Common issues:

- **Wrong column letters** - Update `APPROVED_COLUMN` and `EMAIL_COLUMN`
- **Invalid service key** - Make sure you're using the service_role key
- **Email mismatch** - Email in sheet must exactly match Supabase
- **Already approved** - Application might already be processed

### Debug functions available:

- `debugSheetStructure()` - Shows your sheet columns and data
- `testApproval()` - Manually test approval for a specific email
- `simulateApprovalChange()` - Simulate a checkbox change

## 🔒 Security Notes

- **Service key has admin privileges** - keep it secret
- **Only you can edit** the approval column in your sheet
- **Script only triggers** on checkbox changes in approval column
- **Emails must match exactly** between sheet and Supabase

## ✅ Success Indicators

When approval works correctly, you'll see:

1. ✅ in Apps Script logs: "Successfully approved mentor application"
2. 📧 User gets mentor role in Supabase `users` table
3. 👤 Mentor profile created in `mentor_profiles` table
4. 📱 User can now switch to mentor mode in the app

## 🆘 Need Help?

If something isn't working:

1. Run `debugSheetStructure()` and share the output
2. Run `testApproval()` and share any error messages
3. Check the Supabase `mentor_applications` table to verify data exists
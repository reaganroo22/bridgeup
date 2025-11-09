# Wizzmo Mentor Application Google Forms Integration Setup Guide

## Overview
This guide walks you through setting up the Google Forms integration for automatic mentor application processing. The Apps Script automatically processes form submissions and creates mentor application records in your Supabase database.

## Prerequisites
- Google Workspace/Gmail account with access to Google Forms and Apps Script
- Supabase project with mentor_applications table set up
- Admin email address for notifications

## Step 1: Create the Google Form

1. Go to [Google Forms](https://forms.google.com)
2. Create a new form titled "Wizzmo Mentor Application"
3. Add the following questions (exact titles matter for the script):

### Required Form Fields:
- **Email Address** (Email validation)
- **First Name** (Short answer)
- **Last Name** (Short answer)
- **University/College** (Short answer)
- **Major/Field of Study** (Short answer)
- **Expected Graduation Year** (Short answer)
- **Bio (Tell us about yourself, your experiences, and what advice you can offer)** (Long answer)
- **Video Introduction URL (Optional - YouTube, Vimeo, or Google Drive link)** (Short answer)
- **Areas of Expertise (Select all that apply)** (Multiple choice checkboxes)
  - Computer Science
  - Engineering
  - Business
  - Pre-Med
  - Liberal Arts
  - Graduate School
  - Career Development
  - Other
- **Why do you want to become a mentor?** (Long answer)
- **How many hours per week can you dedicate to mentoring?** (Multiple choice)
  - 1-2 hours
  - 3-5 hours
  - 5-10 hours
  - 10+ hours
- **Previous mentoring or leadership experience** (Long answer)

## Step 2: Set Up Apps Script

1. Open your Google Form
2. Click the three dots menu (⋮) → "Script editor"
3. Delete any existing code
4. Copy and paste the entire contents of `complete-apps-script.js` into the script editor
5. Save the project (Ctrl/Cmd + S)
6. Name it "Wizzmo Mentor Form Processor"

## Step 3: Configure Script Properties

1. In Apps Script, click "Project Settings" (gear icon)
2. Scroll down to "Script Properties"
3. Add the following properties:

| Property Name | Value | Description |
|---------------|-------|-------------|
| `SUPABASE_URL` | Your Supabase project URL | Found in Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Found in Supabase Dashboard → Settings → API (keep secret!) |
| `FORM_ID` | Your Google Form ID | Copy from form URL: `https://docs.google.com/forms/d/[FORM_ID]/edit` |
| `ADMIN_EMAIL` | Your admin email | Where notifications will be sent |

## Step 4: Set Up Database Table

Ensure your Supabase database has a `mentor_applications` table with these columns:

```sql
CREATE TABLE mentor_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    university TEXT,
    major TEXT,
    graduation_year TEXT,
    bio TEXT,
    video_introduction_url TEXT,
    expertise_areas TEXT,
    why_mentor TEXT,
    availability_hours TEXT,
    previous_experience TEXT,
    status TEXT DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    form_response_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Step 5: Set Up Form Trigger

1. In Apps Script, run the `setupFormTrigger()` function:
   - Click the function dropdown and select "setupFormTrigger"
   - Click the "Run" button
   - Grant necessary permissions when prompted

2. Alternatively, set up manually:
   - Go to "Triggers" (clock icon) in Apps Script
   - Click "Add Trigger"
   - Choose: `onFormSubmit` function
   - Event source: "From form"
   - Select your form
   - Event type: "On form submit"
   - Save

## Step 6: Test the Integration

1. **Test with sample data:**
   - Run the `testFormProcessing()` function in Apps Script
   - Check the logs for any errors

2. **Test with real form submission:**
   - Submit a test application through your form
   - Check Apps Script logs (View → Logs)
   - Verify the record appears in your Supabase database
   - Confirm emails are sent

## Step 7: Verify Form Field Mapping

Run the `analyzeFormStructure()` function to ensure your form fields match the expected titles in the script. If there are mismatches, either:

1. Update your form question titles to match the script, or
2. Update the `FORM_FIELDS` object in the script to match your form

## Troubleshooting

### Common Issues:

1. **"Permission denied" errors:**
   - Re-run the setup and grant all requested permissions
   - Ensure your Google account has access to both the form and script

2. **Database errors:**
   - Verify your Supabase credentials are correct
   - Check that the service role key has INSERT permissions on mentor_applications table
   - Ensure your database table structure matches the expected schema

3. **Email not sending:**
   - Verify the admin email is set correctly in script properties
   - Check if emails are in spam folder
   - Ensure your Google account has Gmail enabled

4. **Form field mapping errors:**
   - Run `analyzeFormStructure()` to see current form structure
   - Ensure question titles exactly match the `FORM_FIELDS` object

### Debug Functions:

- `testFormProcessing()` - Test with sample data
- `analyzeFormStructure()` - Check form field structure
- `getRecentResponses()` - View recent form submissions
- `setupScriptProperties()` - Reset script properties template

## Security Notes

- Never commit or share your `SUPABASE_SERVICE_ROLE_KEY`
- The service role key grants full database access - handle with care
- Consider setting up Row Level Security (RLS) policies in Supabase
- Regularly review and rotate your API keys

## Monitoring

1. **Apps Script Logs:**
   - View → Logs to see processing details
   - Set up email notifications for script failures

2. **Supabase Dashboard:**
   - Monitor the mentor_applications table for new entries
   - Check API usage and any errors

3. **Email Confirmations:**
   - Verify applicants receive confirmation emails
   - Monitor admin notifications

## Support

If you encounter issues:

1. Check Apps Script logs for detailed error messages
2. Verify all script properties are set correctly
3. Test individual functions using the debug functions provided
4. Ensure your Supabase table schema matches the expected structure

The script includes comprehensive error handling and will send admin notifications if processing fails, helping you quickly identify and resolve any issues.
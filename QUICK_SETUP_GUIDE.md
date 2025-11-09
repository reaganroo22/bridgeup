# 🚀 Quick Setup Guide - Fix the Configuration Error

The error you're seeing happens because the script needs to be configured with your actual values. Here's how to fix it:

## Step 1: Get Your Google Sheet ID

1. **In Apps Script**, run the function `getCurrentSheetId()`
2. **Copy the ID** from the logs (it will look like: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`)

## Step 2: Get Your Supabase Service Key  

1. Go to: https://supabase.com/dashboard/project/miygmdboiesbxwlqgnsx/settings/api
2. **Copy the `service_role` key** (the long one, NOT the anon key)
3. ⚠️ **Keep this secret** - it has admin privileges

## Step 3: Update the Configuration

**Replace these lines at the top of your script:**

```javascript
const SUPABASE_SERVICE_KEY = 'YOUR_SUPABASE_SERVICE_KEY_HERE'; 
const RESPONSES_SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; 
```

**With your actual values:**

```javascript
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Your actual service key
const RESPONSES_SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'; // Your actual sheet ID
```

## Step 4: Check Your Column Letters

Look at your Google Sheet and verify:
- **Which column has email addresses?** (probably B)
- **Which column will have the approval checkbox?** (probably J or later)

Update these if needed:
```javascript
const APPROVED_COLUMN = 'J'; // Update to your approval column
const EMAIL_COLUMN = 'B'; // Update to your email column  
```

## Step 5: Install the Trigger

1. **Save your script** (Ctrl+S)
2. **Run `installApprovalTrigger()`**  
3. **Authorize** when prompted
4. You should see "✅ Approval trigger installed successfully!"

## ✅ Test It

1. **Run `debugSheetStructure()`** to see your columns
2. **Add an "Approved" column** to your sheet if you don't have one
3. **Check the approval box** for a test entry
4. **Check the Apps Script logs** to see if it worked

## 🎯 What Happens Next

Once configured:
1. ✅ You check "Approved" checkbox in your sheet
2. 🤖 Script automatically finds the mentor application in Supabase  
3. 🎉 User gets mentor role and can use mentor features in the app

## 🆘 Still Having Issues?

Run these debug functions:
- `getCurrentSheetId()` - Get your sheet ID
- `debugSheetStructure()` - See your sheet structure  
- `validateConfig()` - Check if configuration is correct
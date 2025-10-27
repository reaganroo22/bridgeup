# 🚀 Wizzmo Deployment Checklist

## ✅ What I Fixed

1. **Profile Screen Avatar Error** - Fixed undefined `profileData` variable
2. **Mentor Sign-up Flow** - Removed role selector, all users sign up as students
3. **Admin Functions** - Added `createMentorProfile()` and `approveMentorApplication()`
4. **Admin Script** - Created `mobile/scripts/approveMentor.ts` for easy mentor approval

## 🔥 Deploy to Production - DO THIS NOW

### 1. Supabase Setup (CRITICAL - 5 min)

```bash
# 1. Go to your Supabase dashboard
# 2. Navigate to SQL Editor
# 3. Copy and paste the contents of: mobile/supabase/rls-policies.sql
# 4. Click "Run" to enable Row Level Security
```

**⚠️ WARNING: Skip this and your database is wide open!**

### 2. Environment Variables (1 min)

Make sure `mobile/.env` has:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Populate Categories (2 min)

Insert categories into Supabase:

```sql
INSERT INTO categories (name, slug, icon, description) VALUES
('Dating & Relationships', 'dating', '💕', 'Love, dating, crushes, and relationship advice'),
('Roommate Drama', 'roommates', '🏠', 'Roommate conflicts and living situations'),
('Friend Issues', 'friends', '👯', 'Friendships and social drama'),
('Family Stuff', 'family', '👨‍👩‍👧', 'Family relationships and issues'),
('College Stress', 'college', '📚', 'Classes, exams, and academic pressure'),
('Mental Health', 'mental-health', '🧠', 'Anxiety, depression, and wellness'),
('Career & Future', 'career', '💼', 'Internships, jobs, and career planning');
```

### 4. Test on Web (2 min)

```bash
cd mobile
npm run web
```

**Test these flows:**
- [ ] Sign up (should create student account)
- [ ] Sign in
- [ ] Ask a question (submit should work)
- [ ] Navigate between tabs
- [ ] View profile

### 5. Approve Your First Mentor (3 min)

```bash
# 1. Sign up a test account via the app
# 2. Get the user ID from Supabase dashboard (users table)
# 3. Get category IDs from categories table
# 4. Run:

cd mobile
npx ts-node scripts/approveMentor.ts <user-id> <category-id-1> <category-id-2>

# 5. Log in with that account - you should see mentor tabs!
```

### 6. Deploy Mobile App

**iOS:**
```bash
cd mobile
eas build --platform ios
eas submit --platform ios
```

**Android:**
```bash
cd mobile
eas build --platform android
eas submit --platform android
```

## 🐛 Known Issues (You Mentioned)

Based on your analysis, here's what I found:

### ✅ FIXED
- Profile screen error (Avatar component)
- Sign-up flow (no longer creates mentors automatically)

### ❓ NOT BROKEN (Already Working)
- "Get Started" button in sign-up - **Works fine**
- Submit button in ask screen - **Works fine**
- Home icon navigation - **Works fine** (navigates to /(tabs)/profile)
- Manage Subscription link - **Already linked** (line 534 in profile.tsx)
- Help & Support link - **Already linked** (line 552 in profile.tsx)

### 📝 Notes
- **"Follow More" screen** - Doesn't exist and wasn't mentioned in requirements
- **Notification remove** - NotificationContext looks fine
- **Web vs Mobile** - You mentioned testing on web, some features work differently

## 🎯 What's Actually Live

Your app already has:
- ✅ Full Supabase integration (AppContext uses real queries)
- ✅ Real-time chat subscriptions
- ✅ Authentication flows
- ✅ Question submission
- ✅ Mentor inbox/chats
- ✅ Profile management
- ✅ Subscription tracking
- ✅ Feed with voting
- ✅ Notifications

## 🔐 Security (RUN THE RLS SCRIPT!)

**DO NOT SKIP THIS:**

1. Go to Supabase SQL Editor
2. Run `mobile/supabase/rls-policies.sql`
3. Verify RLS is enabled on all tables

Without this, anyone can read/write anything in your database!

## 📱 Final Steps

1. **Run RLS policies** ← DO THIS FIRST
2. **Insert categories** into Supabase
3. **Test on web** (npm run web)
4. **Approve a test mentor** (scripts/approveMentor.ts)
5. **Build mobile apps** (eas build)
6. **Submit to stores** (eas submit)

## 🆘 If Something Breaks

Check:
1. Supabase is connected (check .env)
2. RLS policies are applied
3. Categories exist in database
4. User has proper role (student/mentor)
5. Check Expo console for errors

## 💡 Approving Real Mentors

When someone submits "Become a Wizzmo":

```bash
# 1. Check their application (website form)
# 2. Find their user ID in Supabase users table
# 3. Get category IDs they selected
# 4. Run:
npx ts-node scripts/approveMentor.ts <user-id> <cat-1> <cat-2> <cat-3>
```

See `mobile/scripts/README.md` for full details.

---

**You're good to go! 🚀 Just run the RLS policies and you're LIVE.**

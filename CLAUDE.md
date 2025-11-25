- We can't build and it crashes upon every startup so we're transferring to Animated instead of Reanimated

📋 COMPREHENSIVE PROJECT DOCUMENTATION - UPDATED

  Wizzmo College Advice & BridgeUp Rebranding Project

  ---
  🗄️ DATABASE CONFIGURATION

  Current Setup:

  - Wizzmo Database: miygmdboiesbxwlqgnsx (existing)
  - BridgeUp Database: qpttxbcglzocxbzzevmg (NEW - configured and initialized)
  - BridgeUp URL: https://qpttxbcglzocxbzzevmg.supabase.co
  - BridgeUp Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

  Database Strategy - SEPARATE DATABASES CONFIRMED:

  ✅ Wizzmo: Uses existing schema with favorite_wizzmos table
  ✅ BridgeUp: Clean separate database with favorite_mentors table
  ✅ BridgeUp: All vertical filtering removed from codebase
  ✅ BridgeUp: Complete schema initialized with all tables
  📍 Location: /Users/username/Documents/Wizzmo College Advice/

  ---
  ✅ COMPLETED SETUP (4/4 DATABASE TASKS)

  Database Separation Complete:

  1. ✅ BridgeUp database connection configured (bridgeup/lib/supabase.ts)
  2. ✅ Complete database schema initialized with all tables
  3. ✅ Vertical filtering removed from all BridgeUp database queries
  4. ✅ BridgeUp now uses clean separate database without conflicts

  Core App Fixes (9/17 total issues):

  5. ✅ Database schema mismatch - Fixed favorite_wizzmos vs favorite_mentors
  6. ✅ Favorite Wizzmos shows null instead of 0 - Now shows count with proper display
  7. ✅ Questions not appearing in "my questions" - Fixed profile.tsx to query questions table directly
  8. ✅ "Selected Wizzmo" should show actual name - Added mentor data fetching in ask.tsx
  9. ✅ "Other" topic option missing - Added manual "Other" category as last option
  10. ✅ 4 selected Wizzmos should auto-check specific mentor - Auto-enables and locks mentor toggle
  11. ✅ Pending questions not showing in chats screen - Fixed by using AppContext's submitQuestion
  12. ✅ Role switching for mentor accounts - Fixed UserModeContext to default mentors to mentor mode
  13. ✅ Favorite wizzmos display in profile - Fixed table references and added empty state

  ---
  🔴 REMAINING CRITICAL ISSUES (8/17)

  High Priority - Core Functionality Broken:

  1. Mark comments helpful not working - Core engagement feature
  2. Add 4+ Wizzmos from filter screen not working - Mentor selection broken
  3. Chat won't begin after acceptance - Critical "waiting for mentor" error
  4. Mentor questions answered tab only shows resolved - Should show accepted chats

  Medium Priority - UX Issues:

  5. Profile photo upload infinite loop - Avatar component endless updates
  6. Active Now should navigate to specific question - Navigation to trending
  7. University typing/edit profile needs matching structure - School selection consistency
  8. Mentor accounts going to student onboarding - Wrong onboarding flow

  ---
  🏗️ BRIDGEUP DATABASE STRUCTURE

  Fully Initialized Tables:

  📄 Core Tables:
    - users (with role, university, etc.)
    - categories (8 default categories added)
    - questions (student questions)
    - mentor_profiles (mentor extended info)
    - advice_sessions (student-mentor matches)
    - messages (chat messages)

  📄 Social Features:
    - favorite_mentors (BridgeUp uses this vs favorite_wizzmos)
    - followers (social following)
    - feed_comments (public comments)
    - feed_votes (upvotes/downvotes)

  📄 Additional Features:
    - mentor_videos (introduction videos)
    - ratings (session feedback)
    - notifications (system notifications)

  Key Differences from Wizzmo:
  - Uses 'favorite_mentors' table instead of 'favorite_wizzmos'
  - No vertical filtering - clean separation
  - Fresh database with no legacy data conflicts

  ---
  🔧 CRITICAL CODE PATTERNS ESTABLISHED

  1. Database Access Patterns:

  // BridgeUp (UPDATED - no vertical filtering):
  await supabase.from('favorite_mentors').select('*').eq('student_id', userId)
  await supabase.from('questions').select('*').eq('student_id', userId)
  await supabase.from('categories').select('*').order('name')

  // Wizzmo (unchanged):
  await supabase.from('favorite_wizzmos').select('*').eq('student_id', userId)

  2. Question Display Pattern (FIXED):

  // CORRECT (shows all questions including pending):
  .from('questions').select('*').eq('student_id', userId)

  3. User Mode Detection (FIXED):

  // UserModeContext properly defaults mentors to mentor mode
  const defaultMode = userRole === 'mentor' ? 'mentor' : userRole === 'both' ? 'mentor' : 'student';

  ---
  🚀 NEXT STEPS PRIORITY ORDER

  Phase 1: Critical Bug Fixes (CURRENT FOCUS)

  1. Fix mark comments helpful - investigate database/UI issue
  2. Fix mentor filter selection - 4+ Wizzmos not working  
  3. Fix chat acceptance flow - "waiting for mentor" error
  4. Fix mentor questions tab - show accepted not just resolved

  Phase 2: UX Improvements

  1. Fix profile photo infinite loop - Avatar component
  2. Fix navigation flows - Active Now, onboarding routes
  3. Clean up UI conditionals - Privacy mode, subscription features

  ---
  📝 CODE LOCATIONS FOR QUICK REFERENCE

  BridgeUp Database Files (UPDATED):
  
  - bridgeup/lib/supabase.ts - ✅ Updated with new credentials
  - bridgeup/lib/supabaseService.ts - ✅ All vertical filtering removed
  - bridgeup/database/01_initial_schema.sql - ✅ Complete schema created
  - bridgeup/database/02_storage_setup.sql - ✅ Storage buckets defined

  Files With Recent Critical Fixes (Don't Break):

  - refreshed_wizzmo/app/(tabs)/ask.tsx - Uses AppContext.submitQuestion ✅
  - refreshed_wizzmo/app/(tabs)/profile.tsx - Queries questions table ✅
  - refreshed_wizzmo/contexts/UserModeContext.tsx - Mentor mode defaults ✅
  - refreshed_wizzmo/app/wizzmo-profile.tsx - Uses favorite_wizzmos ✅

  Database Status:
  ✅ BridgeUp database fully initialized and ready for testing
  ✅ No more schema conflicts between apps
  ✅ Clean separation allows independent development
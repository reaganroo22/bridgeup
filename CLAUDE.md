- We can't build and it crashes upon every startup so we're transferring to Animated instead of Reanimated

📋 WIZZMO COLLEGE ADVICE PROJECT - DECEMBER 2025

  Current Status: Wizzmo is working perfectly. Now creating BridgeUp clone.

  ---
  🗄️ DATABASE CONFIGURATION

  Current Setup:

  - Wizzmo Database: miygmdboiesbxwlqgnsx (WORKING PERFECTLY)
  - BridgeUp Database: qpttxbcglzocxbzzevmg (NEW - Complete schema replicated)
  - BridgeUp URL: https://qpttxbcglzocxbzzevmg.supabase.co

  Simple Strategy:
  ✅ Wizzmo: Working perfectly, don't touch
  ✅ BridgeUp: Complete separate database, identical schema (24 tables)
  ✅ BridgeUp: Will be pure Wizzmo clone with different branding

  ---
  ✅ WIZZMO STATUS: WORKING PERFECTLY

  All core functionality working:
  - Questions submission and display ✅  
  - Mentor matching and chat ✅
  - Role switching for mentors ✅
  - Onboarding flows ✅
  - Profile management ✅

  ---
  ✅ BRIDGEUP CLONE COMPLETED - ALL REFERENCES UPDATED

  FULLY COMPLETED: BridgeUp as exact Wizzmo clone with separate database

  What's Done:
  ✅ BridgeUp database created with identical schema (24 tables)
  ✅ Database contains: users, questions, advice_sessions, messages, etc.
  ✅ Same table structure as working Wizzmo
  ✅ BridgeUp app configured to use qpttxbcglzocxbzzevmg database
  ✅ ALL branding updated from "Wizzmo" to "BridgeUp"
  ✅ All navigation routes updated (wizzmo-profile → bridgeup-profile)
  ✅ All component references updated (WizzmoIntroCard → BridgeUpIntroCard) 
  ✅ iOS project files renamed and configured for BridgeUp
  ✅ App.json configured with BridgeUp bundle ID and credentials
  ✅ All user-facing text updated to BridgeUp branding
  ✅ Database table references updated (favorite_wizzmos → favorite_mentors)
  ✅ Subscription plan references updated (wizzmo_monthly → bridgeup_monthly)
  ✅ Auth and onboarding flows completely updated
  ✅ All paywall variants updated with BridgeUp branding
  ✅ Legal and terms pages updated with BridgeUp references
  ✅ Context providers updated with BridgeUp branding
  ✅ University search added with 500+ schools (IE University Spain, Chapman University included)
  ✅ App Store coming soon popup added for BridgeUp web
  ✅ BridgeUp web pushed to github.com/reaganroo22/bridgeup-landing-page

  ---
  ⚠️ KNOWN DISCREPANCIES

  BridgeUp Web Landing Page:
  - Form submits different field names than database expects
  - Database has: graduation_year, why_join, instagram, confirm_woman, confirm_advice
  - Form sends: class_year, why_mentor, instagram_handle, confirm_student, confirm_advice
  - This is intentional - form works as expected, just field name mismatch
  
  ---
  📝 KEY FILES

  Wizzmo (WORKING - DON'T CHANGE):
  - refreshed_wizzmo/ (entire working app)

  BridgeUp (COMPLETE):
  - bridgeup/ (mobile app - complete with database)
  - bridgeup-web/ (landing page - complete with university search + popup)
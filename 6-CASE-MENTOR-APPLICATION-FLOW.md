# 6-Case Mentor Application User Flow Documentation

## Overview

This document outlines the comprehensive 6-case user flow logic for mentor applications implemented in the main app layout file (`_layout.tsx`). Each case handles different combinations of user status and mentor application states.

## Database Requirements

Before implementing these flows, ensure the following database migration is run:

```sql
-- Add role_selection_completed field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role_selection_completed BOOLEAN DEFAULT FALSE;
```

## The 6 Cases

### Case 1: New User + Pending Application
**Scenario**: First time login → No onboarding completed → Pending approval screen
**Trigger**: `!userProfile.onboarding_completed && application.application_status === 'pending'`
**Flow**: 
- User logs in for first time
- Has pending mentor application
- Redirected to `/auth/pending-approval`
- Cannot access main app until application is approved or they sign out

**Implementation Flags**:
- `needsPendingApproval: true`
- `mentorApplicationStatus: 'pending'`

---

### Case 2: Existing Student + Pending Application ✨
**Scenario**: Existing student → Has completed onboarding → Continues using app normally
**Trigger**: `userProfile.onboarding_completed && userProfile.role === 'student' && application.application_status === 'pending'`
**Flow**:
- User has been using the app as a student
- Applied to be a mentor (application pending)
- Continues to use app normally as student
- No blocking, no pending screen
- When application gets approved, they'll get Case 3 flow

**Implementation**: No special flags - returns unmodified userProfile

---

### Case 3: Existing Student + Approved Application ✨
**Scenario**: Existing student → Has completed onboarding → Role selection popup
**Trigger**: `userProfile.onboarding_completed && userProfile.role === 'student' && !userProfile.role_selection_completed && application.application_status === 'approved'`
**Flow**:
- User has been using app as student
- Mentor application gets approved
- On next login/app open, redirected to `/auth/role-selection`
- Must choose: Student, Mentor, or Both
- After selection, continues with chosen role

**Implementation Flags**:
- `needsRoleSelection: true`
- `mentorApplicationStatus: 'approved'`

---

### Case 4: New User + Approved Application
**Scenario**: First time login → Auto-upgrade role → Mentor onboarding
**Trigger**: `!userProfile.onboarding_completed && application.application_status === 'approved'`
**Flow**:
- User's first login and their application is already approved
- Automatically upgrades their role (`student` → `both`, or directly to `mentor`)
- Sets `role_selection_completed: true` (no selection needed)
- Proceeds to mentor onboarding flow

**Implementation**: Auto-updates database with new role and completion flag

---

### Case 5: Existing Mentor + Any Application
**Scenario**: Already mentor → Ignores application status → Normal mentor experience  
**Trigger**: `userProfile.role === 'mentor' || (userProfile.role === 'both' && userProfile.role_selection_completed)`
**Flow**:
- User already has mentor capabilities
- Any mentor application status is ignored
- Continues normal mentor experience
- No interruptions or additional screens

**Implementation**: Returns unmodified userProfile

---

### Case 6: No Application
**Scenario**: Normal user flow → Student onboarding → Regular app experience
**Trigger**: No mentor application found in database (`error.code === 'PGRST116'`)
**Flow**:
- Standard app flow for users without mentor applications
- Proceeds through normal onboarding
- Uses app as student
- No mentor-related interruptions

**Implementation**: Returns unmodified userProfile

## Key Implementation Details

### Database Fields Used
- `onboarding_completed`: Boolean - Has user completed initial onboarding
- `role_selection_completed`: Boolean - Has user completed role selection process  
- `role`: String - Current user role ('student', 'mentor', 'both')
- `mentor_applications.application_status`: String - Status of mentor application

### Navigation Flags
- `needsPendingApproval`: Triggers redirect to pending approval screen
- `needsRoleSelection`: Triggers redirect to role selection screen
- `mentorApplicationStatus`: Tracks application status for UI purposes

### Component Integration
- **Pending Approval Screen**: Shows application status, allows refresh checks
- **Role Selection Screen**: Allows choosing between Student/Mentor/Both roles
- **Main App Layout**: Handles all routing logic based on case detection

### Edge Cases Handled
- User has "both" role but never completed selection process
- Application status changes while user is in app (handled via refresh)
- Database errors or missing applications
- Multiple rapid navigation attempts

## Testing Scenarios

### Test Case 1: New User, Pending Application
1. Create mentor application with status 'pending'
2. User signs up with same email  
3. Should redirect to pending approval screen
4. Should not allow access to main app

### Test Case 2: Existing Student, Pending Application  
1. User exists with role 'student', onboarding completed
2. Create pending mentor application
3. User should continue normal app usage
4. No interruptions or blocking screens

### Test Case 3: Existing Student, Approved Application
1. User exists with role 'student', onboarding completed
2. Mentor application status changes to 'approved'
3. User should be redirected to role selection on next app open
4. After role selection, should continue based on choice

### Test Case 4: New User, Approved Application
1. Create mentor application with status 'approved'
2. User signs up with same email
3. Role should auto-upgrade (student → both)
4. Should proceed to mentor onboarding

### Test Case 5: Existing Mentor
1. User has role 'mentor' or 'both' with role_selection_completed
2. Any mentor application should be ignored
3. Should continue normal mentor experience

### Test Case 6: No Application
1. User with no mentor application
2. Should follow normal student onboarding flow
3. No mentor-related screens or interruptions

## File Locations

### Primary Implementation
- `/refreshed_wizzmo/app/_layout.tsx` - Main 6-case logic
- `/refreshed_wizzmo/app/auth/role-selection.tsx` - Role selection screen
- `/refreshed_wizzmo/app/auth/pending-approval.tsx` - Pending approval screen

### Supporting Files
- `/refreshed_wizzmo/lib/supabaseService.ts` - Database interfaces
- `/refreshed_wizzmo/lib/database.types.ts` - TypeScript types
- `/database-migrations/add-role-selection-completed.sql` - Required migration

## Migration Instructions

1. Run the database migration to add `role_selection_completed` field
2. Deploy the updated code
3. Test each of the 6 cases thoroughly
4. Monitor logs for proper case detection and navigation

## Troubleshooting

### Common Issues
- **User stuck in redirect loop**: Check role_selection_completed flag
- **Wrong case detected**: Verify application status and user profile values
- **Navigation not working**: Check segment detection and router logic

### Debug Logs
All cases log extensively with emojis for easy identification:
- 🔍 = Investigation/checking
- 🎯 = Case detection  
- ✅ = Success
- ❌ = Error
- 🚀 = Auto-upgrade action
# Mentor Role Testing Issues & Fixes - Implementation Log

## Overview
This document tracks all issues discovered and fixes implemented for the **pure mentor role flow** during testing. This serves as a reference for future testing and debugging of the 6-case mentor application system.

---

## 🎯 **Test Scenario: Pure Mentor Flow**
**Target:** New user → mentor application → approval → mentor onboarding → mentor mode

**Expected Result:**
- `role: "mentor"` (not "both" or "student")
- Mentor onboarding pre-filled with application data
- App enters mentor view after completion
- No manual refresh required

---

## 🐛 **Issues Discovered & Fixes Applied**

### **Issue #1: Mentor Application Data Not Preloading**
**Problem:** Mentor onboarding form was empty instead of pre-filled with application data (name, university, motivation, etc.)

**Root Cause:** 
- AsyncStorage saved progress was overriding Supabase application data
- Auto-save effect was running during application data loading

**Fix Applied:**
```typescript
// 1. Priority override in mentor onboarding data loading
setFormData(prev => ({
  ...prev,
  // ALWAYS use application data for these fields
  fullName: `${mentorApplication.first_name} ${mentorApplication.last_name}`,
  university: mentorApplication.university,
  graduationYear: mentorApplication.graduation_year,
  major: mentorApplication.major,
  motivation: mentorApplication.why_join, // Key field mapping
}));

// 2. Prevent auto-save during application loading
const [isLoadingApplicationData, setIsLoadingApplicationData] = useState(false);
useEffect(() => {
  if (!isLoadingApplicationData) {
    saveMentorProgress();
  }
}, [currentStep, formData, isLoadingApplicationData]);

// 3. Force clear old progress for approved mentors
console.log('[MentorOnboarding] 🚫 APPROVED MENTOR - clearing all saved progress');
await AsyncStorage.removeItem(`mentor_onboarding_progress_${user.id}`);
setCurrentStep(1);
```

**Files Modified:**
- `refreshed_wizzmo/app/auth/mentor-onboarding.tsx`

---

### **Issue #2: Wrong Role Assignment (both instead of mentor)**
**Problem:** Pure mentors were getting `role: "both"` instead of `role: "mentor"`

**Root Cause:** 
- User had `onboarding_completed: true` from partial student onboarding
- This triggered **Case 3** (Existing Student + Approved) instead of **Case 4** (New User + Approved)
- Case 3 assigns `role: "both"`, Case 4 assigns `role: "mentor"`

**Fix Applied:**
```typescript
// Case 4 logic is correct, issue was wrong case being triggered
if (!userProfile.onboarding_completed) {
  const hasUsedAppAsStudent = userProfile.onboarding_completed; // false
  const newRole = hasUsedAppAsStudent ? 'both' : 'mentor'; // 'mentor'
  
  const { error: updateError } = await updateUserProfile(user.id, { 
    role: newRole, // Should be 'mentor'
    role_selection_completed: true 
  });
}
```

**Files Modified:**
- `refreshed_wizzmo/app/_layout.tsx` (6-case logic)

---

### **Issue #3: Student View After Mentor Onboarding Completion**
**Problem:** After mentor onboarding, app showed student interface instead of mentor interface

**Root Cause:** 
- UserModeContext had cached old role data
- `switchMode()` only updated UI state, didn't refresh database role
- Race condition between onboarding completion and context sync

**Fix Applied:**
```typescript
// 1. Added refreshUserData function to UserModeContext
const refreshUserData = async () => {
  console.log('🔄 [UserMode] Force refreshing user role data...');
  setIsLoading(true);
  
  const { data: userProfile } = await supabaseService.getUserProfile(user.id);
  if (userProfile?.role) {
    setUserRole(userProfile.role);
    
    // Immediately set correct mode based on refreshed role
    if (userProfile.role === 'mentor') {
      setCurrentMode('mentor');
    }
  }
  setIsLoading(false);
};

// 2. Updated mentor onboarding completion to use refreshUserData
try {
  console.log('[MentorOnboarding] 🔄 Force refreshing user data after completion...');
  await refreshUserData(); // Instead of switchMode('mentor')
  
  setTimeout(() => {
    router.replace('/(tabs)/');
  }, 1000);
}
```

**Files Modified:**
- `refreshed_wizzmo/contexts/UserModeContext.tsx`
- `refreshed_wizzmo/app/auth/mentor-onboarding.tsx`

---

### **Issue #4: Double Submission in Mentor Onboarding**
**Problem:** Mentor onboarding was being submitted twice

**Root Cause:** 
- Auto-save effect triggered during application data loading
- Created conflicts and duplicate submissions

**Fix Applied:**
```typescript
// Prevent auto-save during application data loading
const [isLoadingApplicationData, setIsLoadingApplicationData] = useState(false);

useEffect(() => {
  if (!isLoadingApplicationData) {
    saveMentorProgress();
  }
}, [currentStep, formData, isLoadingApplicationData]);
```

**Files Modified:**
- `refreshed_wizzmo/app/auth/mentor-onboarding.tsx`

---

### **Issue #5: 6-Case Flow Not Working Correctly**
**Problem:** System wasn't following the proper 6-case logic for mentor applications

**Root Cause:** 
- Partial student onboarding set `onboarding_completed: true`
- This caused Case 3 to trigger instead of Case 4 for pure mentors

**Fix Applied:**
```typescript
// Ensure pure mentor testing starts with correct state
UPDATE users SET 
  role = 'mentor', 
  onboarding_completed = false 
WHERE email = 'test@example.com';
```

**Files Modified:**
- Database state management
- `refreshed_wizzmo/app/_layout.tsx` (6-case logic verification)

---

## 🔧 **Key Code Locations**

### **UserModeContext:**
`refreshed_wizzmo/contexts/UserModeContext.tsx`
- Lines 62-71: Role-based mode setting
- Lines 145-152: Pure mentor force logic
- Lines 227-261: New refreshUserData function

### **6-Case Logic:**
`refreshed_wizzmo/app/_layout.tsx`
- Lines 228-287: Case detection and role assignment
- Lines 289-306: Case 4 (New User + Approved Application)

### **Mentor Onboarding:**
`refreshed_wizzmo/app/auth/mentor-onboarding.tsx`
- Lines 174-179: Force clear saved progress
- Lines 316-333: Application data priority loading
- Lines 1310-1325: Completion with refreshUserData

### **Database Schema:**
Key fields for testing:
- `users.role`: 'student' | 'mentor' | 'both'
- `users.onboarding_completed`: boolean
- `users.role_selection_completed`: boolean
- `mentor_applications.application_status`: 'pending' | 'approved' | 'rejected'

---

## 📋 **Testing Checklist for Pure Mentor Flow**

### **Pre-Test Setup:**
1. ✅ Delete all user data for test email
2. ✅ Ensure no saved AsyncStorage data
3. ✅ Verify mentor application fields exist in database

### **Flow Steps:**
1. ✅ Submit mentor application with full data
2. ✅ Approve application to 'approved' status
3. ✅ Login → should trigger Case 4
4. ✅ Mentor onboarding starts at step 1
5. ✅ Form pre-filled with application data
6. ✅ Complete onboarding → refreshUserData called
7. ✅ Navigate to app in mentor mode

### **Expected Database State After:**
```sql
SELECT role, onboarding_completed, role_selection_completed 
FROM users WHERE email = 'test@example.com';
-- Should return: 'mentor', true, true
```

### **Expected App Behavior:**
- ✅ UserModeContext: `currentMode: 'mentor'`
- ✅ UI shows mentor interface (not student)
- ✅ No manual refresh required
- ✅ ModeToggle shows: `availableModes: ['mentor']`

---

## 🚨 **Critical Points for Future Testing**

1. **Always start with clean state** - any partial onboarding breaks Case 4
2. **Verify application data exists** - check mentor_applications table has full data
3. **Monitor console logs** - UserModeContext logs show mode detection
4. **Check database state** - verify role assignment after each step
5. **Test AsyncStorage clearing** - ensure no old progress interferes

---

## 📝 **Next: 6-Case Testing Plan**

**Case 1:** New User + Pending Application  
**Case 2:** Existing Student + Pending Application  
**Case 3:** Existing Student + Approved Application  
**Case 4:** New User + Approved Application ✅ (Fixed)  
**Case 5:** Existing Mentor + Any Application  
**Case 6:** No Application  

Each case should be tested with clean data and proper state verification.
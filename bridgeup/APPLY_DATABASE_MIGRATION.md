# Database Migration Instructions

## ✅ COMPLETED - Issue Fixed
The BridgeUp app was failing during onboarding with the error:
```
Could not find the 'vertical' column of 'users' in the schema cache
```

## ✅ Solution Applied
A `vertical` column has been successfully added to the `users` table to support multiple app verticals (Wizzmo, BridgeUp, TechMentor).

## Steps to Apply Migration

### 1. Run the Migration
Execute the SQL script in your Supabase database:
```bash
# Navigate to the migration file
cat database/migrations/add_vertical_column.sql
```

Copy and execute this SQL in your Supabase SQL Editor:
```sql
-- Add vertical column to users table to support multiple app verticals
ALTER TABLE users 
ADD COLUMN vertical text DEFAULT 'wizzmo';

-- Add index for efficient querying by vertical  
CREATE INDEX idx_users_vertical ON users(vertical);

-- Update existing users to have 'wizzmo' vertical (preserving existing data)
UPDATE users 
SET vertical = 'wizzmo' 
WHERE vertical IS NULL;

-- Add constraint to ensure valid vertical values
ALTER TABLE users 
ADD CONSTRAINT check_vertical_values 
CHECK (vertical IN ('wizzmo', 'bridgeup', 'techmentor'));
```

### 2. Re-enable Vertical Filtering
After the migration is complete, uncomment these lines:

**In `app/auth/onboarding.tsx` (line 199-200):**
```typescript
// Change from:
// vertical: CURRENT_VERTICAL_KEY,

// To:
vertical: CURRENT_VERTICAL_KEY,
```

**In `app/_layout.tsx` (line 140-142):**
```typescript
// Change from:
// const hasCompletedOnboardingForVertical = userProfile?.onboarding_completed && userProfile?.vertical === CURRENT_VERTICAL.name.toLowerCase();
const hasCompletedOnboardingForVertical = userProfile?.onboarding_completed;

// To:
const hasCompletedOnboardingForVertical = userProfile?.onboarding_completed && userProfile?.vertical === CURRENT_VERTICAL.name.toLowerCase();
```

### 3. Update Database Types (if needed)
The TypeScript types in `lib/database.types.ts` have already been updated to include the `vertical` column.

### 4. Test the Apps
- **Wizzmo users**: Should continue working normally with `vertical = 'wizzmo'`
- **BridgeUp users**: Should be prompted for onboarding and get `vertical = 'bridgeup'`
- **Data separation**: Each app should only show content from their vertical

## Benefits After Migration
- ✅ Proper data separation between Wizzmo and BridgeUp
- ✅ Onboarding works correctly for both apps
- ✅ Users can complete different onboarding for different verticals
- ✅ Database queries are properly filtered by vertical
- ✅ Future scalability for additional verticals (TechMentor, etc.)

## Rollback (if needed)
If you need to rollback the migration:
```sql
ALTER TABLE users DROP COLUMN vertical;
DROP INDEX IF EXISTS idx_users_vertical;
```
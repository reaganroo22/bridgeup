# BridgeUp App Configuration - Differences from Wizzmo Template

## 🎯 Purpose
BridgeUp is a peer mentoring platform that uses the exact same database schema and core functionality as Wizzmo, with only branding and content differences. This document outlines the specific customizations needed for BridgeUp.

---

## 🗄️ Database Configuration
- **Database ID**: `qpttxbcglzocxbzzevmg`
- **Base Schema**: Identical to Wizzmo (`miygmdboiesbxwlqgnsx`)
- **Tables**: All 24 tables replicated exactly from Wizzmo template
- **Status**: ✅ Complete schema replication confirmed

---

## 🎨 App-Specific Differences

### 1. **Branding & Visual Identity**
- **App Name**: "BridgeUp" instead of "Wizzmo"
- **Color Scheme**: TBD (likely different primary/accent colors)
- **Logo/Icons**: BridgeUp-specific assets
- **App Store Listings**: Separate identity and descriptions

### 2. **Content & Copy Differences**
- **Onboarding Flow**: BridgeUp-specific welcome messages and instructions
- **Category Names**: May have different category focuses (e.g., "Academic Success" vs "Dating")
- **Notification Text**: App-specific messaging ("Your BridgeUp mentor responded...")
- **Email Templates**: BridgeUp branding in transactional emails

### 3. **Target Audience**
- **Focus**: [TBD - specify BridgeUp's specific mentoring focus]
- **User Types**: [TBD - any specialization vs general college advice]
- **Geographic/Demo**: [TBD - any targeting differences]

### 4. **Feature Variations** (if any)
- **Categories**: BridgeUp may enable/disable different advice categories
- **Mentor Requirements**: Different application criteria or verification process
- **Subscription Plans**: Potentially different pricing or features

---

## 🔧 Technical Implementation

### Database Vertical Field
All tables include a `vertical` field with these values:
- `'wizzmo'` - Original Wizzmo data
- `'bridgeup'` - BridgeUp-specific data  
- `'techmentor'` - Future third app

### Environment Variables (Required for BridgeUp)
```env
# BridgeUp Supabase Configuration
BRIDGEUP_SUPABASE_URL=https://qpttxbcglzocxbzzevmg.supabase.co
BRIDGEUP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Code Pattern Example
```typescript
// Auto-filter all queries by vertical
const { data } = await supabase
  .from('questions')
  .select('*')
  .eq('vertical', 'bridgeup')  // BridgeUp-specific data only
  .eq('student_id', userId);
```

---

## 📝 Development Workflow

### 1. **Template Updates**
When Wizzmo schema changes:
1. Update Wizzmo database first (template)
2. Apply identical changes to BridgeUp database
3. Test both apps independently

### 2. **App-Specific Changes**
- Branding updates only affect frontend code
- Database changes must be synchronized across all verticals
- Content/copy can vary per app

### 3. **Deployment Strategy**
- Separate app store builds for each vertical
- Shared backend infrastructure (but separate databases)
- Independent release cycles possible

---

## 🚀 Next Steps for BridgeUp Launch

### Phase 1: Content Configuration
- [ ] Define BridgeUp-specific categories
- [ ] Create onboarding flow copy
- [ ] Design BridgeUp branding assets
- [ ] Set up app store presence

### Phase 2: Technical Setup  
- [ ] Configure environment variables
- [ ] Update frontend to use BridgeUp database
- [ ] Test vertical filtering thoroughly
- [ ] Set up separate build/deployment pipeline

### Phase 3: Content Population
- [ ] Add BridgeUp-specific categories to database
- [ ] Configure initial mentor applications process
- [ ] Set up notification templates
- [ ] Test end-to-end user flows

---

## ⚠️ Important Notes

1. **Database Changes**: Any schema modifications must be applied to BOTH Wizzmo and BridgeUp databases
2. **Shared Codebase**: Core functionality should remain identical across verticals
3. **Data Isolation**: BridgeUp users should only see BridgeUp content (enforced by `vertical` field)
4. **Testing**: Always test both apps when making changes to shared components

---

*Last Updated: [Current Date]*
*Database Replication Status: ✅ Complete (24/24 tables)*
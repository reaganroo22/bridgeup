# RevenueCat Implementation Documentation - Wizzmo App

## Overview

The Wizzmo Expo app implements RevenueCat for subscription management using `react-native-purchases` v9.6.4. This implementation handles subscription tiers, paywall management, and usage tracking for a college dating advice app.

## Files Containing RevenueCat Implementation

### Core Files

1. **`contexts/SubscriptionContext.tsx`** - Main RevenueCat integration and state management
2. **`components/PaywallManager.tsx`** - A/B testing and paywall orchestration
3. **`components/PaywallVariantA.tsx`** - Primary paywall variant
4. **`components/PaywallVariantB.tsx`** - Secondary paywall variant  
5. **`components/PaywallVariantC.tsx`** - Tertiary paywall variant
6. **`components/ExitIntentPaywall.tsx`** - Exit-intent paywall with discount
7. **`components/PaywallModal.tsx`** - Generic paywall modal component
8. **`app/subscription.tsx`** - Subscription management screen
9. **`package.json`** - Dependencies declaration

### Supporting Files

- **`app/_layout.tsx`** - SubscriptionProvider wrapper
- **`app/(tabs)/profile.tsx`** - Subscription status display
- **Various tab files** - Purchase triggers and subscription checks

## Technical Implementation

### 1. Configuration

```typescript
// RevenueCat API Keys
const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_YcszOesLPQEJgSAAwfWosRBrHkT', // Wizzmo iOS SDK key
  android: 'goog_YOUR_ANDROID_API_KEY', // Android key TBD
}) || '';

const ENTITLEMENT_ID = 'premium'; // Entitlement identifier
```

### 2. Subscription Plans

The app supports three subscription tiers:

- **`free`** - 3 questions limit
- **`pro_monthly`** - Unlimited questions, monthly billing 
- **`pro_yearly`** - Unlimited questions + VIP features, annual billing

### 3. RevenueCat Product Identifiers

- **Monthly**: `$rc_monthly` → `com.wizzmo.app.pro_monthly`
- **Annual**: `$rc_annual` → `com.wizzmo.app.pro_annual`

### 4. Core Architecture

#### SubscriptionContext Provider

The `SubscriptionContext` is the central hub that:

- Initializes RevenueCat SDK
- Manages subscription state
- Handles purchases and restorations
- Syncs with Supabase backend
- Tracks question usage limits

#### Key Methods

```typescript
// Initialize RevenueCat
await Purchases.configure({ apiKey: REVENUECAT_API_KEY });

// Get customer info
const customerInfo = await Purchases.getCustomerInfo();

// Purchase package
const { customerInfo } = await Purchases.purchasePackage(pkg);

// Restore purchases
const customerInfo = await Purchases.restorePurchases();
```

## Features Implemented

### 1. Subscription Management

- **Question Usage Tracking**: Free users limited to 3 questions
- **Unlimited Access**: Pro users get unlimited questions
- **Status Synchronization**: RevenueCat state synced with Supabase
- **Dual Subscription Handling**: Logic to handle users with both monthly/annual

### 2. Paywall System

#### A/B Testing
- **3 Paywall Variants**: PaywallVariantA, B, C
- **Automatic Assignment**: Round-robin testing in development
- **Analytics Tracking**: Event logging for conversion analysis

#### Exit-Intent Strategy
- **Exit-Intent Paywall**: Shows discount offer when user tries to close
- **50% Discount**: Special pricing for exit-intent scenarios
- **Countdown Timer**: Creates urgency with time-limited offer

### 3. Developer Features

- **Debug Logging**: Extensive console logging for development
- **Cache Management**: Development cache clearing
- **User Reset**: Testing function to reset RevenueCat user
- **Manual Refresh**: Force refresh subscription status

### 4. Error Handling

- **Purchase Failures**: User-friendly error messages
- **Network Issues**: Graceful fallbacks
- **Cache Issues**: Automatic cache invalidation
- **State Recovery**: Safe fallback states

## Integration Points

### 1. Supabase Database

The app maintains subscription data in Supabase:

```sql
-- Subscription table structure (inferred)
- user_id
- plan_type: 'free' | 'pro_monthly' | 'pro_yearly'  
- status: 'active' | 'cancelled'
- questions_used: integer
- questions_limit: integer
- trial_ends_at: timestamp
- subscription_ends_at: timestamp
```

### 2. Usage Tracking

Question usage is tracked through:

- `incrementQuestionCount()` - Increments usage for free users
- `canAskQuestion()` - Checks if user can ask questions
- `getQuestionsRemaining()` - Returns remaining question count

### 3. UI Integration

Paywalls are triggered from:

- Question limit reached
- Feature access attempts
- Manual subscription page access
- Exit intent detection

## Development Notes

### Environment-Specific Behavior

- **Development Mode**: Cache clearing enabled, debug logs verbose
- **Production Mode**: Optimized caching, minimal logging

### Testing Features

- **RevenueCat Sandbox**: Uses sandbox environment for testing
- **User Reset**: `resetRevenueCatUser()` for testing different states
- **Manual Refresh**: `refreshSubscription()` for debugging

### Known Issues

- **Dual Subscription Handling**: Special logic for users with both monthly/annual
- **Android Key Pending**: Android RevenueCat key not yet configured
- **Cache Management**: Development cache clearing may cause delays

## Analytics & Tracking

The implementation includes comprehensive analytics:

```typescript
// Example analytics events
logPaywallEvent('paywall_viewed', variant, { timestamp, variant });
logPaywallEvent('exit_intent_triggered', variant, { main_variant });
logPaywallEvent('paywall_dismissed', variant, { had_exit_intent: true });
```

Events tracked:
- Paywall impressions
- Variant assignments  
- Purchase completions
- Exit intent triggers
- Dismissal events

## Security Considerations

- **API Keys**: Platform-specific key configuration
- **Entitlements**: Server-side validation through RevenueCat
- **Purchase Verification**: RevenueCat handles receipt validation
- **User Identity**: Anonymous user IDs for privacy

## Future Improvements

1. **Android Support**: Complete Android RevenueCat key configuration
2. **Advanced Analytics**: Integration with external analytics platforms
3. **Personalization**: Dynamic paywall content based on user behavior
4. **Localization**: Multi-language support for international users
5. **Promotions**: Promotional codes and seasonal discounts

## Dependencies

```json
{
  "react-native-purchases": "^9.6.4",
  "@supabase/supabase-js": "^2.58.0", 
  "expo-secure-store": "^15.0.7"
}
```

## Related Documentation

- [RevenueCat React Native SDK](https://docs.revenuecat.com/docs/reactnative)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
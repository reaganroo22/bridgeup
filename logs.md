  "periodType": "NORMAL",
  "productPlanIdentifier": null,
  "store": "APP_STORE",
  "expirationDate": "2025-12-02T02:52:24Z",
  "verification": "NOT_REQUESTED",
  "originalPurchaseDate": "2025-11-09T08:01:37Z",
  "isSandbox": true,
  "latestPurchaseDateMillis": 1764557544000,
  "billingIssueDetectedAt": null,
  "unsubscribeDetectedAtMillis": null,
  "expirationDateMillis": 1764643944000
}
 LOG  [SubscriptionContext] Detected ANNUAL plan from entitlement
 LOG  [SubscriptionContext] Final results:
 LOG  [SubscriptionContext] - Plan: pro_yearly
 LOG  [SubscriptionContext] - Active: true
 LOG  [SubscriptionContext] - Billing period end: 2025-12-01T02:52:24.000Z
 LOG  [SubscriptionContext] === SUBSCRIPTION DEBUG END ===
 LOG  [SubscriptionContext] Customer entitlements: ["premium"]
 LOG  [SubscriptionContext] Looking for entitlement: premium
 LOG  [SubscriptionContext] Available entitlements: {"premium": {"billingIssueDetectedAt": null, "billingIssueDetectedAtMillis": null, "expirationDate": "2025-12-02T02:52:24Z", "expirationDateMillis": 1764643944000, "identifier": "premium", "isActive": true, "isSandbox": true, "latestPurchaseDate": "2025-12-01T02:52:24Z", "latestPurchaseDateMillis": 1764557544000, "originalPurchaseDate": "2025-11-09T08:01:37Z", "originalPurchaseDateMillis": 1762675297000, "ownershipType": "PURCHASED", "periodType": "NORMAL", "productIdentifier": "com.wizzmo.app.pro_annual", "productPlanIdentifier": null, "store": "APP_STORE", "unsubscribeDetectedAt": null, "unsubscribeDetectedAtMillis": null, "verification": "NOT_REQUESTED", "willRenew": true}}
 LOG  [SubscriptionContext] Active subscriptions: ["com.wizzmo.app.pro_annual"]
 LOG  [SubscriptionContext] isPro check result: true
 LOG  [SubscriptionContext] Product ID from entitlement: com.wizzmo.app.pro_annual
 LOG  [SubscriptionContext] Final plan type: pro_yearly
 LOG  [SubscriptionContext] Final status: active
 LOG  [SubscriptionContext] Subscription sync disabled - preventing RLS errors during account switching
 LOG  [SubscriptionContext] === SUBSCRIPTION DEBUG START ===
 LOG  [SubscriptionContext] Raw CustomerInfo: {
  "activeSubscriptions": [
    "com.wizzmo.app.pro_annual"
  ],
  "entitlements": [
    "premium"
  ],
  "subscriptionsByProductIdentifier": [
    "com.wizzmo.app.pro_annual",
    "com.wizzmo.app.pro_monthly"
  ],
  "allSubscriptions": {
    "com.wizzmo.app.pro_annual": {
      "expiresDate": "2025-12-02T02:52:24Z",
      "productIdentifier": "com.wizzmo.app.pro_annual",
      "unsubscribeDetectedAt": null,
      "isSandbox": true,
      "isActive": true,
      "originalPurchaseDate": "2025-11-09T08:01:37Z",
      "ownershipType": "PURCHASED",
      "periodType": "NORMAL",
      "refundedAt": null,
      "storeTransactionId": "2000001069194137",
      "billingIssuesDetectedAt": null,
      "gracePeriodExpiresDate": null,
      "willRenew": true,
      "price": {
        "currency": "USD",
        "amount": 59.99
      },
      "purchaseDate": "2025-12-01T02:52:24Z",
      "store": "APP_STORE"
    },
    "com.wizzmo.app.pro_monthly": {
      "billingIssuesDetectedAt": null,
      "refundedAt": null,
      "ownershipType": "PURCHASED",
      "isActive": false,
      "willRenew": true,
      "gracePeriodExpiresDate": null,
      "purchaseDate": "2025-11-09T08:01:37Z",
      "storeTransactionId": "2000001052093162",
      "price": {
        "amount": 9.99,
        "currency": "USD"
      },
      "expiresDate": "2025-11-10T08:01:37Z",
      "store": "APP_STORE",
      "unsubscribeDetectedAt": null,
      "originalPurchaseDate": "2025-11-09T08:01:37Z",
      "productIdentifier": "com.wizzmo.app.pro_monthly",
      "periodType": "NORMAL",
      "isSandbox": true
    }
  }
}
 LOG  [SubscriptionContext] Subscription check: {"hasAnnual": true, "hasMonthly": false}
 LOG  [SubscriptionContext] Entitlement check result: true
 LOG  [SubscriptionContext] Product ID from entitlement: com.wizzmo.app.pro_annual
 LOG  [SubscriptionContext] Full entitlement data: {
  "isActive": true,
  "expirationDateMillis": 1764643944000,
  "billingIssueDetectedAt": null,
  "productPlanIdentifier": null,
  "periodType": "NORMAL",
  "latestPurchaseDateMillis": 1764557544000,
  "originalPurchaseDate": "2025-11-09T08:01:37Z",
  "store": "APP_STORE",
  "expirationDate": "2025-12-02T02:52:24Z",
  "unsubscribeDetectedAtMillis": null,
  "billingIssueDetectedAtMillis": null,
  "willRenew": true,
  "verification": "NOT_REQUESTED",
  "isSandbox": true,
  "latestPurchaseDate": "2025-12-01T02:52:24Z",
  "originalPurchaseDateMillis": 1762675297000,
  "identifier": "premium",
  "productIdentifier": "com.wizzmo.app.pro_annual",
  "unsubscribeDetectedAt": null,
  "ownershipType": "PURCHASED"
}
 LOG  [SubscriptionContext] Detected ANNUAL plan from entitlement
 LOG  [SubscriptionContext] Final results:
 LOG  [SubscriptionContext] - Plan: pro_yearly
 LOG  [SubscriptionContext] - Active: true
 LOG  [SubscriptionContext] - Billing period end: 2025-12-01T02:52:24.000Z
 LOG  [SubscriptionContext] === SUBSCRIPTION DEBUG END ===
 LOG  [SubscriptionContext] Customer entitlements: ["premium"]
 LOG  [SubscriptionContext] Looking for entitlement: premium
 LOG  [SubscriptionContext] Available entitlements: {"premium": {"billingIssueDetectedAt": null, "billingIssueDetectedAtMillis": null, "expirationDate": "2025-12-02T02:52:24Z", "expirationDateMillis": 1764643944000, "identifier": "premium", "isActive": true, "isSandbox": true, "latestPurchaseDate": "2025-12-01T02:52:24Z", "latestPurchaseDateMillis": 1764557544000, "originalPurchaseDate": "2025-11-09T08:01:37Z", "originalPurchaseDateMillis": 1762675297000, "ownershipType": "PURCHASED", "periodType": "NORMAL", "productIdentifier": "com.wizzmo.app.pro_annual", "productPlanIdentifier": null, "store": "APP_STORE", "unsubscribeDetectedAt": null, "unsubscribeDetectedAtMillis": null, "verification": "NOT_REQUESTED", "willRenew": true}}
 LOG  [SubscriptionContext] Active subscriptions: ["com.wizzmo.app.pro_annual"]
 LOG  [SubscriptionContext] isPro check result: true
 LOG  [SubscriptionContext] Product ID from entitlement: com.wizzmo.app.pro_annual
 LOG  [SubscriptionContext] Final plan type: pro_yearly
 LOG  [SubscriptionContext] Final status: active
 LOG  [SubscriptionContext] Subscription sync disabled - preventing RLS errors during account switching
 LOG  [SubscriptionContext] Customer entitlements: ["premium"]
 LOG  [SubscriptionContext] Looking for entitlement: premium
 LOG  [SubscriptionContext] Available entitlements: {"premium": {"billingIssueDetectedAt": null, "billingIssueDetectedAtMillis": null, "expirationDate": "2025-12-02T02:52:24Z", "expirationDateMillis": 1764643944000, "identifier": "premium", "isActive": true, "isSandbox": true, "latestPurchaseDate": "2025-12-01T02:52:24Z", "latestPurchaseDateMillis": 1764557544000, "originalPurchaseDate": "2025-11-09T08:01:37Z", "originalPurchaseDateMillis": 1762675297000, "ownershipType": "PURCHASED", "periodType": "NORMAL", "productIdentifier": "com.wizzmo.app.pro_annual", "productPlanIdentifier": null, "store": "APP_STORE", "unsubscribeDetectedAt": null, "unsubscribeDetectedAtMillis": null, "verification": "NOT_REQUESTED", "willRenew": true}}
 LOG  [SubscriptionContext] Active subscriptions: ["com.wizzmo.app.pro_annual"]
 LOG  [SubscriptionContext] isPro check result: true
 LOG  [SubscriptionContext] Product ID from entitlement: com.wizzmo.app.pro_annual
 LOG  [SubscriptionContext] Final plan type: pro_yearly
 LOG  [SubscriptionContext] Final status: active
 LOG  [SubscriptionContext] Subscription sync disabled - preventing RLS errors during account switching
 LOG  [Onboarding] Requesting in-app review
 LOG  [Onboarding] Completing onboarding for user: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3
 LOG  [Onboarding] Saving final profile data with completion...
 LOG  [Onboarding] Attempting direct profile update...
 LOG  [Onboarding] ✅ Direct update succeeded!
 LOG  [Onboarding] SUCCESS! Onboarding completed.
 ERROR  [NotificationService] Error scheduling notification: {"code": "23503", "details": "Key is not present in table \"users\".", "hint": null, "message": "insert or update on table \"scheduled_notifications\" violates foreign key constraint \"scheduled_notifications_user_id_fkey\""} 

Code: notificationService.ts
  337 |
  338 |     if (error) {
> 339 |       console.error('[NotificationService] Error scheduling notification:', error);
      |                    ^
  340 |     } else {
  341 |       console.log(`[NotificationService] Scheduled ${type} notification for ${scheduledFor}`);
  342 |     }
Call Stack
  scheduleNotification (lib/notificationService.ts:339:20)
 LOG  [NotificationContext] Welcome flow scheduled for user: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3
 ERROR  [NotificationService] Error scheduling notification: {"code": "23503", "details": "Key is not present in table \"users\".", "hint": null, "message": "insert or update on table \"scheduled_notifications\" violates foreign key constraint \"scheduled_notifications_user_id_fkey\""} 

Code: notificationService.ts
  337 |
  338 |     if (error) {
> 339 |       console.error('[NotificationService] Error scheduling notification:', error);
      |                    ^
  340 |     } else {
  341 |       console.log(`[NotificationService] Scheduled ${type} notification for ${scheduledFor}`);
  342 |     }
Call Stack
  scheduleNotification (lib/notificationService.ts:339:20)
 LOG  [NotificationContext] Weekly reminder scheduled for user: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3
 LOG  [Onboarding] ✅ Navigating to main app...
 ERROR  [NotificationService] Error scheduling notification: {"code": "23503", "details": "Key is not present in table \"users\".", "hint": null, "message": "insert or update on table \"scheduled_notifications\" violates foreign key constraint \"scheduled_notifications_user_id_fkey\""} 

Code: notificationService.ts
  337 |
  338 |     if (error) {
> 339 |       console.error('[NotificationService] Error scheduling notification:', error);
      |                    ^
  340 |     } else {
  341 |       console.log(`[NotificationService] Scheduled ${type} notification for ${scheduledFor}`);
  342 |     }
Call Stack
  scheduleNotification (lib/notificationService.ts:339:20)
 LOG  🔧 [ModeToggle] Rendering with: {"availableModes": ["student"], "canSwitch": false, "currentMode": "student", "isLoading": false}
 LOG  🔧 [ModeToggle] NOT RENDERING - canSwitch: false isLoading: false
 LOG  [getFeaturedMentorVideos] Fetching featured videos, limit: 10
 LOG  [AppContext] Syncing mentor stats on startup...
 LOG  [syncAllMentorStats] Syncing stats for all mentors
 LOG  [SubscriptionContext] Initializing RevenueCat
 LOG  [SubscriptionContext] Development mode: clearing RevenueCat cache
 LOG  [SubscriptionContext] Loading subscription from database for user: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3
 LOG  [getUserSubscription] Fetching subscription for user: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3
 LOG  🔧 [ModeToggle] Rendering with: {"availableModes": ["student"], "canSwitch": false, "currentMode": "student", "isLoading": false}
 LOG  🔧 [ModeToggle] NOT RENDERING - canSwitch: false isLoading: false
 LOG  [getFeaturedMentorVideos] Found 2 featured videos
 LOG  [getUserSubscription] No subscription found, creating default free subscription
 LOG  [updateMentorHelpfulVotes] Updating helpful votes for mentor: 8a7e57eb-7f92-4434-a716-87eb7d04eea1
 LOG  [RootLayout] === NAVIGATION DEBUG ===
 LOG  [RootLayout] Current segments: ["(tabs)"]
 LOG  [RootLayout] User exists: true
 LOG  [RootLayout] Loading state: false
 LOG  [RootLayout] Navigation flags: {"inAllowedScreen": false, "inAuthGroup": false, "inOnboarding": false, "inTabs": true, "isMentorOnboarding": false}
 LOG  👤 [RootLayout] === USER EXISTS - CHECKING PROFILE ===
 LOG  👤 [RootLayout] User ID: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3
 LOG  👤 [RootLayout] User Email: tstock14@gmail.com
 LOG  [getUserProfile] Fetching profile for user: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3
 LOG  📋 [RootLayout] User not found in profiles - needs to complete authentication and onboarding
 LOG  [RootLayout] 🧭 Safe navigation to: /auth (user needs to complete authentication)
 LOG  [RootLayout] Current path: /(tabs) → Target: /auth
 LOG  [updateMentorHelpfulVotes] Calculated 0 total helpful votes for mentor 8a7e57eb-7f92-4434-a716-87eb7d04eea1
 LOG  🔧 [ModeToggle] Rendering with: {"availableModes": ["student"], "canSwitch": false, "currentMode": "student", "isLoading": false}
 LOG  🔧 [ModeToggle] NOT RENDERING - canSwitch: false isLoading: false
 ERROR  [getUserSubscription] Error: {"code": "23503", "details": "Key is not present in table \"users\".", "hint": null, "message": "insert or update on table \"subscriptions\" violates foreign key constraint \"subscriptions_user_id_fkey\""} 

Code: supabaseService.ts
  2298 |     return { data, error: null }
  2299 |   } catch (error) {
> 2300 |     console.error('[getUserSubscription] Error:', error)
       |                  ^
  2301 |     return { data: null, error: error as Error }
  2302 |   }
  2303 | }
Call Stack
  getUserSubscription (lib/supabaseService.ts:2300:18)
 ERROR  [SubscriptionContext] Error loading subscription: {"code": "23503", "details": "Key is not present in table \"users\".", "hint": null, "message": "insert or update on table \"subscriptions\" violates foreign key constraint \"subscriptions_user_id_fkey\""} 

Code: SubscriptionContext.tsx
  155 |       
  156 |       if (error) {
> 157 |         console.error('[SubscriptionContext] Error loading subscription:', error);
      |                      ^
  158 |         return;
  159 |       }
  160 |
Call Stack
  loadSubscriptionFromDatabase (contexts/SubscriptionContext.tsx:157:22)
 LOG  [AppContext] Cleaning up real-time subscriptions
 ERROR  [getUserProfile] Error: {"code": "PGRST116", "details": "The result contains 0 rows", "hint": null, "message": "Cannot coerce the result to a single JSON object"} 

Code: supabaseService.ts
  221 |     return { data: user, error: null }
  222 |   } catch (error) {
> 223 |     console.error('[getUserProfile] Error:', error)
      |                  ^
  224 |     return { data: null, error: error as Error }
  225 |   }
  226 | }
Call Stack
  getUserProfile (lib/supabaseService.ts:223:18)
 ERROR  ❌ [RootLayout] Profile fetch error: {"code": "PGRST116", "details": "The result contains 0 rows", "hint": null, "message": "Cannot coerce the result to a single JSON object"} 

Code: _layout.tsx
  397 |             
  398 |             if (profileError) {
> 399 |               console.error('❌ [RootLayout] Profile fetch error:', profileError);
      |                            ^
  400 |               
  401 |               // Check if this is a "no rows" error (user hasn't completed onboarding)
  402 |               if (profileError.code === 'PGRST116') {
Call Stack
  handleNavigation (app/_layout.tsx:399:28)
 LOG  [RootLayout] ⏸️ Navigation in progress, skipping effect
 LOG  [updateMentorHelpfulVotes] Mentor helpful votes updated successfully
 LOG  [updateMentorHelpfulVotes] Updating helpful votes for mentor: d487d208-f9ed-40b8-b2fd-8e8c905f0a19
 LOG  [updateMentorHelpfulVotes] Calculated 0 total helpful votes for mentor d487d208-f9ed-40b8-b2fd-8e8c905f0a19
 LOG  [updateMentorHelpfulVotes] Mentor helpful votes updated successfully
 LOG  [updateMentorHelpfulVotes] Updating helpful votes for mentor: 09e621ca-0b8c-412b-a6f2-049d711a204e
 LOG  [updateMentorHelpfulVotes] Calculated 0 total helpful votes for mentor 09e621ca-0b8c-412b-a6f2-049d711a204e
 LOG  [updateMentorHelpfulVotes] Mentor helpful votes updated successfully
 LOG  [updateMentorHelpfulVotes] Updating helpful votes for mentor: 195f2f71-a3c6-46f8-9ef7-f3bcd49982f5
 LOG  [updateMentorHelpfulVotes] Calculated 0 total helpful votes for mentor 195f2f71-a3c6-46f8-9ef7-f3bcd49982f5
 LOG  [updateMentorHelpfulVotes] Mentor helpful votes updated successfully
 LOG  [updateMentorHelpfulVotes] Updating helpful votes for mentor: abf0e76f-7660-443f-bf15-a9f6ed82dc5c
 LOG  [updateMentorHelpfulVotes] Calculated 0 total helpful votes for mentor abf0e76f-7660-443f-bf15-a9f6ed82dc5c
 LOG  [updateMentorHelpfulVotes] Mentor helpful votes updated successfully
 LOG  [updateMentorHelpfulVotes] Updating helpful votes for mentor: 9850e264-9e36-4f1f-97db-17e92e175b8d
 LOG  [updateMentorHelpfulVotes] Calculated 0 total helpful votes for mentor 9850e264-9e36-4f1f-97db-17e92e175b8d
 LOG  [updateMentorHelpfulVotes] Mentor helpful votes updated successfully
 LOG  [updateMentorHelpfulVotes] Updating helpful votes for mentor: a6b91dd8-994a-4bb6-9092-c8135ebda8db
 LOG  [SubscriptionContext] Development cache clear completed
 LOG  [updateMentorHelpfulVotes] Calculated 0 total helpful votes for mentor a6b91dd8-994a-4bb6-9092-c8135ebda8db
 DEBUG  [RevenueCat] ℹ️ Found 0 unsynced attributes for App User ID: $RCAnonymousID:9768344ac09d4d7eacef409608fdbcc3
 INFO  [RevenueCat] ℹ️ Purchases instance already set. Did you mean to configure two Purchases objects?
 DEBUG  [RevenueCat] ℹ️ Configuring SDK using RevenueCat's UserDefaults suite.
 DEBUG  [RevenueCat] 👤 Identifying App User ID
 DEBUG  [RevenueCat] ℹ️ Observing StoreKit.Transaction.updates
 DEBUG  [RevenueCat] ℹ️ Debug logging enabled
 DEBUG  [RevenueCat] ℹ️ SDK Version - 5.46.3
 DEBUG  [RevenueCat] ℹ️ Bundle ID - com.wizzmo.app
 DEBUG  [RevenueCat] ℹ️ System Version - Version 26.1 (Build 23B85)
 DEBUG  [RevenueCat] ℹ️ Not using a simulator.
 DEBUG  [RevenueCat] 👤 No initial App User ID
 DEBUG  [RevenueCat] ℹ️ Purchases is configured with response verification disabled
 DEBUG  [RevenueCat] ℹ️ Purchases is configured with StoreKit version 2
 DEBUG  [RevenueCat] ℹ️ Observing StoreKit.PurchaseIntent.intents
 DEBUG  [RevenueCat] ℹ️ Delegate set
 DEBUG  [RevenueCat] ℹ️ Offerings cache is stale, updating from network in foreground
 DEBUG  [RevenueCat] ℹ️ CustomerInfo cache is stale, updating from network in foreground.
 DEBUG  [RevenueCat] ℹ️ GetOfferingsOperation: Started
 DEBUG  [RevenueCat] ℹ️ There are no requests currently running, starting request GET /v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/offerings
 DEBUG  [RevenueCat] ℹ️ API request started: GET '/v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/offerings'
 DEBUG  [RevenueCat] ℹ️ Network operation 'GetCustomerInfoOperation' found with the same cache key 'GetCustomerInfo…'. Skipping request.
 LOG  [updateMentorHelpfulVotes] Mentor helpful votes updated successfully
 LOG  [updateMentorHelpfulVotes] Updating helpful votes for mentor: c6512688-16fa-4e3f-a9da-11e8d16bb5fc
 DEBUG  [RevenueCat] ℹ️ API request completed: GET '/v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/offerings' (304)
 DEBUG  [RevenueCat] ℹ️ No existing products cached, starting store products request for: ["com.wizzmo.app.pro_monthly", "com.wizzmo.app.pro_annual"]
 DEBUG  [RevenueCat] ℹ️ GetOfferingsOperation: Finished
 DEBUG  [RevenueCat] ℹ️ Serial request done: GET /v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/offerings, 0 requests left in the queue
 DEBUG  [RevenueCat] ℹ️ HealthReportAvailabilityOperation: Started
 DEBUG  [RevenueCat] ℹ️ There are no requests currently running, starting request GET /v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/health_report_availability
 DEBUG  [RevenueCat] ℹ️ API request started: GET '/v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/health_report_availability'
 DEBUG  [RevenueCat] ℹ️ Skipping products request for these products because they were already cached: ["com.wizzmo.app.pro_annual"]
 DEBUG  [RevenueCat] ℹ️ PostReceiptDataOperation: Started
 DEBUG  [RevenueCat] ℹ️ PostReceiptDataOperation: Posting JWS token (source: 'restore'):
eyJhbGciOiJFUzI1NiIsIng1YyI6WyJNSUlFTVRDQ0E3YWdBd0lCQWdJUVI4S0h6ZG41NTRaL1VvcmFkTng5dHpBS0JnZ3Foa2pPUFFRREF6QjFNVVF3UWdZRFZRUURERHRCY0hCc1pTQlhiM0pzWkhkcFpHVWdSR1YyWld4dmNHVnlJRkpsYkdGMGFXOXVjeUJEWlhKMGFXWnBZMkYwYVc5dUlFRjFkR2h2Y21sMGVURUxNQWtHQTFVRUN3d0NSell4RXpBUkJnTlZCQW9NQ2tGd2NHeGxJRWx1WXk0eEN6QUpCZ05WQkFZVEFsVlRNQjRYRFRJMU1Ea3hPVEU1TkRRMU1Wb1hEVEkzTVRBeE16RTNORGN5TTFvd2daSXhRREErQmdOVkJBTU1OMUJ5YjJRZ1JVTkRJRTFoWXlCQmNIQWdVM1J2Y21VZ1lXNWtJR2xVZFc1bGN5QlRkRzl5WlNCU1pXTmxhWEIwSUZOcFoyNXBibWN4TERBcUJnTlZCQXNNSTBGd2NHeGxJRmR2Y214a2QybGtaU0JFWlhabGJHOXdaWElnVW1Wc1lYUnBiMjV6TVJNd0VRWURWUVFLREFwQmNIQnNaU0JKYm1NdU1Rc3dDUVlEVlFRR0V3SlZVekJaTUJNR0J5cUdTTTQ5QWdFR0NDcUdTTTQ5QXdFSEEwSUFCTm5WdmhjdjdpVCs3RXg1dEJNQmdyUXNwSHpJc1hSaTBZeGZlazdsdjh3RW1qL2JIaVd0TndKcWMyQm9IenNRaUVqUDdLRklJS2c0WTh5MC9ueW51QW1qZ2dJSU1JSUNCREFNQmdOVkhSTUJBZjhFQWpBQU1COEdBMVVkSXdRWU1CYUFGRDh2bENOUjAxREptaWc5N2JCODVjK2xrR0taTUhBR0NDc0dBUVVGQndFQkJHUXdZakF0QmdnckJnRUZCUWN3QW9ZaGFIUjBjRG92TDJObGNuUnpMbUZ3Y0d4bExtTnZiUzkzZDJSeVp6WXVaR1Z5TURFR0NDc0dBUVVGQnpBQmhpVm9kSFJ3T2k4dmIyTnpjQzVoY0hCc1pTNWpiMjB2YjJOemNEQXpMWGQzWkhKbk5qQXlNSUlCSGdZRFZSMGdCSUlCRlRDQ0FSRXdnZ0VOQmdvcWhraUc5Mk5rQlFZQk1JSCtNSUhEQmdnckJnRUZCUWNDQWpDQnRneUJzMUpsYkdsaGJtTmxJRzl1SUhSb2FYTWdZMlZ5ZEdsbWFXTmhkR1VnWW5rZ1lXNTVJSEJoY25SNUlHRnpjM1Z0WlhNZ1lXTmpaWEIwWVc1alpTQnZaaUIwYUdVZ2RHaGxiaUJoY0hCc2FXTmhZbXhsSUhOMFlXNWtZWEprSUhSbGNtMXpJR0Z1WkNCamIyNWthWFJwYjI1eklHOW1JSFZ6WlN3Z1kyVnlkR2xtYVdOaGRHVWdjRzlzYVdONUlHRnVaQ0JqWlhKMGFXWnBZMkYwYVc5dUlIQnlZV04wYVdObElITjBZWFJsYldWdWRITXVNRFlHQ0NzR0FRVUZCd0lCRmlwb2RIUndPaTh2ZDNkM0xtRndjR3hsTG1OdmJTOWpaWEowYVdacFkyRjBaV0YxZEdodmNtbDBlUzh3SFFZRFZSME9CQllFRklGaW9HNHdNTVZBMWt1OXpKbUdOUEFWbjNlcU1BNEdBMVVkRHdFQi93UUVBd0lIZ0RBUUJnb3Foa2lHOTJOa0Jnc0JCQUlGQURBS0JnZ3Foa2pPUFFRREF3TnBBREJtQWpFQStxWG5SRUM3aFhJV1ZMc0x4em5qUnBJelBmN1ZIejlWL0NUbTgrTEpsclFlcG5tY1B2R0xOY1g2WFBubGNnTEFBakVBNUlqTlpLZ2c1cFE3OWtuRjRJYlRYZEt2OHZ1dElETVhEbWpQVlQzZEd2RnRzR1J3WE95d1Iya1pDZFNyZmVvdCIsIk1JSURGakNDQXB5Z0F3SUJBZ0lVSXNHaFJ3cDBjMm52VTRZU3ljYWZQVGp6Yk5jd0NnWUlLb1pJemowRUF3TXdaekViTUJrR0ExVUVBd3dTUVhCd2JHVWdVbTl2ZENCRFFTQXRJRWN6TVNZd0pBWURWUVFMREIxQmNIQnNaU0JEWlhKMGFXWnBZMkYwYVc5dUlFRjFkR2h2Y21sMGVURVRNQkVHQTFVRUNnd0tRWEJ3YkdVZ1NXNWpMakVMTUFrR0ExVUVCaE1DVlZNd0hoY05NakV3TXpFM01qQXpOekV3V2hjTk16WXdNekU1TURBd01EQXdXakIxTVVRd1FnWURWUVFERER0QmNIQnNaU0JYYjNKc1pIZHBaR1VnUkdWMlpXeHZjR1Z5SUZKbGJHRjBhVzl1Y3lCRFpYSjBhV1pwWTJGMGFXOXVJRUYxZEdodmNtbDBlVEVMTUFrR0ExVUVDd3dDUnpZeEV6QVJCZ05WQkFvTUNrRndjR3hsSUVsdVl5NHhDekFKQmdOVkJBWVRBbFZUTUhZd0VBWUhLb1pJemowQ0FRWUZLNEVFQUNJRFlnQUVic1FLQzk0UHJsV21aWG5YZ3R4emRWSkw4VDBTR1luZ0RSR3BuZ24zTjZQVDhKTUViN0ZEaTRiQm1QaENuWjMvc3E2UEYvY0djS1hXc0w1dk90ZVJoeUo0NXgzQVNQN2NPQithYW85MGZjcHhTdi9FWkZibmlBYk5nWkdoSWhwSW80SDZNSUgzTUJJR0ExVWRFd0VCL3dRSU1BWUJBZjhDQVFBd0h3WURWUjBqQkJnd0ZvQVV1N0Rlb1ZnemlKcWtpcG5ldnIzcnI5ckxKS3N3UmdZSUt3WUJCUVVIQVFFRU9qQTRNRFlHQ0NzR0FRVUZCekFCaGlwb2RIUndPaTh2YjJOemNDNWhjSEJzWlM1amIyMHZiMk56Y0RBekxXRndjR3hsY205dmRHTmhaek13TndZRFZSMGZCREF3TGpBc29DcWdLSVltYUhSMGNEb3ZMMk55YkM1aGNIQnNaUzVqYjIwdllYQndiR1Z5YjI5MFkyRm5NeTVqY213d0hRWURWUjBPQkJZRUZEOHZsQ05SMDFESm1pZzk3YkI4NWMrbGtHS1pNQTRHQTFVZER3RUIvd1FFQXdJQkJqQVFCZ29xaGtpRzkyTmtCZ0lCQkFJRkFEQUtCZ2dxaGtqT1BRUURBd05vQURCbEFqQkFYaFNxNUl5S29nTUNQdHc0OTBCYUI2NzdDYUVHSlh1ZlFCL0VxWkdkNkNTamlDdE9udU1UYlhWWG14eGN4ZmtDTVFEVFNQeGFyWlh2TnJreFUzVGtVTUkzM3l6dkZWVlJUNHd4V0pDOTk0T3NkY1o0K1JHTnNZRHlSNWdtZHIwbkRHZz0iLCJNSUlDUXpDQ0FjbWdBd0lCQWdJSUxjWDhpTkxGUzVVd0NnWUlLb1pJemowRUF3TXdaekViTUJrR0ExVUVBd3dTUVhCd2JHVWdVbTl2ZENCRFFTQXRJRWN6TVNZd0pBWURWUVFMREIxQmNIQnNaU0JEWlhKMGFXWnBZMkYwYVc5dUlFRjFkR2h2Y21sMGVURVRNQkVHQTFVRUNnd0tRWEJ3YkdVZ1NXNWpMakVMTUFrR0ExVUVCaE1DVlZNd0hoY05NVFF3TkRNd01UZ3hPVEEyV2hjTk16a3dORE13TVRneE9UQTJXakJuTVJzd0dRWURWUVFEREJKQmNIQnNaU0JTYjI5MElFTkJJQzBnUnpNeEpqQWtCZ05WQkFzTUhVRndjR3hsSUVObGNuUnBabWxqWVhScGIyNGdRWFYwYUc5eWFYUjVNUk13RVFZRFZRUUtEQXBCY0hCc1pTQkpibU11TVFzd0NRWURWUVFHRXdKVlV6QjJNQkFHQnlxR1NNNDlBZ0VHQlN1QkJBQWlBMklBQkpqcEx6MUFjcVR0a3lKeWdSTWMzUkNWOGNXalRuSGNGQmJaRHVXbUJTcDNaSHRmVGpqVHV4eEV0WC8xSDdZeVlsM0o2WVJiVHpCUEVWb0EvVmhZREtYMUR5eE5CMGNUZGRxWGw1ZHZNVnp0SzUxN0lEdll1VlRaWHBta09sRUtNYU5DTUVBd0hRWURWUjBPQkJZRUZMdXczcUZZTTRpYXBJcVozcjY5NjYvYXl5U3JNQThHQTFVZEV3RUIvd1FGTUFNQkFmOHdEZ1lEVlIwUEFRSC9CQVFEQWdFR01Bb0dDQ3FHU000OUJBTURBMmdBTUdVQ01RQ0Q2Y0hFRmw0YVhUUVkyZTN2OUd3T0FFWkx1Tit5UmhIRkQvM21lb3locG12T3dnUFVuUFdUeG5TNGF0K3FJeFVDTUcxbWloREsxQTNVVDgyTlF6NjBpbU9sTTI3amJkb1h0MlFmeUZNbStZaGlkRGtMRjF2TFVhZ002QmdENTZLeUtBPT0iXX0.eyJ0cmFuc2FjdGlvbklkIjoiMjAwMDAwMTA2OTE5NDEzNyIsIm9yaWdpbmFsVHJhbnNhY3Rpb25JZCI6IjIwMDAwMDEwNTIwOTMxNjIiLCJ3ZWJPcmRlckxpbmVJdGVtSWQiOiIyMDAwMDAwMTIwMjI3MzA3IiwiYnVuZGxlSWQiOiJjb20ud2l6em1vLmFwcCIsInByb2R1Y3RJZCI6ImNvbS53aXp6bW8uYXBwLnByb19hbm51YWwiLCJzdWJzY3JpcHRpb25Hcm91cElkZW50aWZpZXIiOiIyMTgyMjQ4MiIsInB1cmNoYXNlRGF0ZSI6MTc2NDU1NzU0NDAwMCwib3JpZ2luYWxQdXJjaGFzZURhdGUiOjE3NjI2NzUyOTcwMDAsImV4cGlyZXNEYXRlIjoxNzY0NjQzOTQ0MDAwLCJxdWFudGl0eSI6MSwidHlwZSI6IkF1dG8tUmVuZXdhYmxlIFN1YnNjcmlwdGlvbiIsImRldmljZVZlcmlmaWNhdGlvbiI6Ik82dUh1OHN2REJTRVlKcG5TeXhiZnBzejBZY3FiTkNIZjlCRXQxQm9UcTFOTmRSSWRFc2hkcDVITW1UZjRjU1MiLCJkZXZpY2VWZXJpZmljYXRpb25Ob25jZSI6Ijg4MjA3ZmQxLTcxODktNDhmMC1iMDMyLTc0OThmNDU4NzQ3YyIsImluQXBwT3duZXJzaGlwVHlwZSI6IlBVUkNIQVNFRCIsInNpZ25lZERhdGUiOjE3NjQ1NzIzOTMxMzQsImVudmlyb25tZW50IjoiU2FuZGJveCIsInRyYW5zYWN0aW9uUmVhc29uIjoiUkVORVdBTCIsInN0b3JlZnJvbnQiOiJVU0EiLCJzdG9yZWZyb250SWQiOiIxNDM0NDEiLCJwcmljZSI6NTk5OTAsImN1cnJlbmN5IjoiVVNEIiwiYXBwVHJhbnNhY3Rpb25JZCI6IjcwNTAwNzQzMDg0NjUxMjE5OSJ9.vQfJAUTFf5HUXC-s7LIMb30PRZgHRM9JFsok8GGbhOGLXIrZlgQmgwS53RaBv2_UwMqlxboqfErTiPXk8Yf28w
 DEBUG  [RevenueCat] ℹ️ There are no requests currently running, starting request POST /v1/receipts
 DEBUG  [RevenueCat] ℹ️ API request started: POST '/v1/receipts'
 DEBUG  [RevenueCat] ℹ️ API request completed: GET '/v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/health_report_availability' (200)
 DEBUG  [RevenueCat] ℹ️ HealthReportAvailabilityOperation: Finished
 DEBUG  [RevenueCat] ℹ️ GetCustomerInfoOperation: Started
 DEBUG  [RevenueCat] ℹ️ Serial request done: GET /v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/health_report_availability, 0 requests left in the queue
 DEBUG  [RevenueCat] ℹ️ There are no requests currently running, starting request GET /v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3
 DEBUG  [RevenueCat] ℹ️ API request started: GET '/v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3'
 DEBUG  [RevenueCat] ℹ️ API request completed: GET '/v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3' (304)
 DEBUG  [RevenueCat] ℹ️ Sending latest CustomerInfo to delegate.
 DEBUG  [RevenueCat] 😻 CustomerInfo updated from network.
 DEBUG  [RevenueCat] 😻 CustomerInfo updated from network.
 DEBUG  [RevenueCat] ℹ️ GetCustomerInfoOperation: Finished
 DEBUG  [RevenueCat] ℹ️ Serial request done: GET /v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3, 0 requests left in the queue
 DEBUG  [RevenueCat] ℹ️ HealthReportOperation: Started
 LOG  [SubscriptionContext] Customer info updated {"activeSubscriptions": ["com.wizzmo.app.pro_annual"], "allExpirationDates": {"com.wizzmo.app.pro_annual": "2025-12-02T02:52:24Z", "com.wizzmo.app.pro_monthly": "2025-11-10T08:01:37Z"}, "allExpirationDatesMillis": {"com.wizzmo.app.pro_annual": 1764643944000, "com.wizzmo.app.pro_monthly": 1762761697000}, "allPurchaseDates": {"com.wizzmo.app.pro_annual": "2025-12-01T02:52:24Z", "com.wizzmo.app.pro_monthly": "2025-11-09T08:01:37Z"}, "allPurchaseDatesMillis": {"com.wizzmo.app.pro_annual": 1764557544000, "com.wizzmo.app.pro_monthly": 1762675297000}, "allPurchasedProductIdentifiers": ["com.wizzmo.app.pro_annual", "com.wizzmo.app.pro_monthly"], "entitlements": {"active": {"premium": [Object]}, "all": {"premium": [Object]}, "verification": "NOT_REQUESTED"}, "firstSeen": "2025-11-09T08:01:37Z", "firstSeenMillis": 1762675297000, "latestExpirationDate": "2025-12-02T02:52:24Z", "latestExpirationDateMillis": 1764643944000, "managementURL": "https://apps.apple.com/account/subscriptions", "nonSubscriptionTransactions": [], "originalAppUserId": "$RCAnonymousID:c95dca9d153a438e8293e3bc3e30ce5b", "originalApplicationVersion": "1.0", "originalPurchaseDate": "2025-11-09T08:01:37Z", "originalPurchaseDateMillis": 1762675297000, "requestDate": "2025-12-01T08:51:01Z", "requestDateMillis": 1764579061187, "subscriptionsByProductIdentifier": {"com.wizzmo.app.pro_annual": {"billingIssuesDetectedAt": null, "expiresDate": "2025-12-02T02:52:24Z", "gracePeriodExpiresDate": null, "isActive": true, "isSandbox": true, "originalPurchaseDate": "2025-11-09T08:01:37Z", "ownershipType": "PURCHASED", "periodType": "NORMAL", "price": [Object], "productIdentifier": "com.wizzmo.app.pro_annual", "purchaseDate": "2025-12-01T02:52:24Z", "refundedAt": null, "store": "APP_STORE", "storeTransactionId": "2000001069194137", "unsubscribeDetectedAt": null, "willRenew": true}, "com.wizzmo.app.pro_monthly": {"billingIssuesDetectedAt": null, "expiresDate": "2025-11-10T08:01:37Z", "gracePeriodExpiresDate": null, "isActive": false, "isSandbox": true, "originalPurchaseDate": "2025-11-09T08:01:37Z", "ownershipType": "PURCHASED", "periodType": "NORMAL", "price": [Object], "productIdentifier": "com.wizzmo.app.pro_monthly", "purchaseDate": "2025-11-09T08:01:37Z", "refundedAt": null, "store": "APP_STORE", "storeTransactionId": "2000001052093162", "unsubscribeDetectedAt": null, "willRenew": true}}}
 LOG  [SubscriptionContext] === SUBSCRIPTION DEBUG START ===
 LOG  [SubscriptionContext] Raw CustomerInfo: {
  "activeSubscriptions": [
    "com.wizzmo.app.pro_annual"
  ],
  "entitlements": [
    "premium"
  ],
  "subscriptionsByProductIdentifier": [
    "com.wizzmo.app.pro_monthly",
    "com.wizzmo.app.pro_annual"
  ],
  "allSubscriptions": {
    "com.wizzmo.app.pro_monthly": {
      "storeTransactionId": "2000001052093162",
      "isSandbox": true,
      "price": {
        "amount": 9.99,
        "currency": "USD"
      },
      "ownershipType": "PURCHASED",
      "willRenew": true,
      "expiresDate": "2025-11-10T08:01:37Z",
      "isActive": false,
      "unsubscribeDetectedAt": null,
      "store": "APP_STORE",
      "periodType": "NORMAL",
      "purchaseDate": "2025-11-09T08:01:37Z",
      "billingIssuesDetectedAt": null,
      "productIdentifier": "com.wizzmo.app.pro_monthly",
      "refundedAt": null,
      "gracePeriodExpiresDate": null,
      "originalPurchaseDate": "2025-11-09T08:01:37Z"
    },
    "com.wizzmo.app.pro_annual": {
      "unsubscribeDetectedAt": null,
      "periodType": "NORMAL",
      "store": "APP_STORE",
      "isActive": true,
      "refundedAt": null,
      "gracePeriodExpiresDate": null,
      "originalPurchaseDate": "2025-11-09T08:01:37Z",
      "ownershipType": "PURCHASED",
      "willRenew": true,
      "expiresDate": "2025-12-02T02:52:24Z",
      "storeTransactionId": "2000001069194137",
      "price": {
        "currency": "USD",
        "amount": 59.99
      },
      "isSandbox": true,
      "productIdentifier": "com.wizzmo.app.pro_annual",
      "billingIssuesDetectedAt": null,
      "purchaseDate": "2025-12-01T02:52:24Z"
    }
  }
}
 LOG  [SubscriptionContext] Subscription check: {"hasAnnual": true, "hasMonthly": false}
 LOG  [SubscriptionContext] Entitlement check result: true
 LOG  [SubscriptionContext] Product ID from entitlement: com.wizzmo.app.pro_annual
 LOG  [SubscriptionContext] Full entitlement data: {
  "billingIssueDetectedAt": null,
  "unsubscribeDetectedAtMillis": null,
  "billingIssueDetectedAtMillis": null,
  "expirationDateMillis": 1764643944000,
  "store": "APP_STORE",
  "periodType": "NORMAL",
  "productPlanIdentifier": null,
  "isActive": true,
  "identifier": "premium",
  "unsubscribeDetectedAt": null,
  "ownershipType": "PURCHASED",
  "willRenew": true,
  "expirationDate": "2025-12-02T02:52:24Z",
  "latestPurchaseDate": "2025-12-01T02:52:24Z",
  "originalPurchaseDate": "2025-11-09T08:01:37Z",
  "verification": "NOT_REQUESTED",
  "originalPurchaseDateMillis": 1762675297000,
  "latestPurchaseDateMillis": 1764557544000,
  "isSandbox": true,
  "productIdentifier": "com.wizzmo.app.pro_annual"
}
 LOG  [SubscriptionContext] Detected ANNUAL plan from entitlement
 LOG  [SubscriptionContext] Final results:
 LOG  [SubscriptionContext] - Plan: pro_yearly
 LOG  [SubscriptionContext] - Active: true
 LOG  [SubscriptionContext] - Billing period end: 2025-12-01T02:52:24.000Z
 LOG  [SubscriptionContext] === SUBSCRIPTION DEBUG END ===
 LOG  [SubscriptionContext] Customer entitlements: ["premium"]
 LOG  [SubscriptionContext] Looking for entitlement: premium
 LOG  [SubscriptionContext] Available entitlements: {"premium": {"billingIssueDetectedAt": null, "billingIssueDetectedAtMillis": null, "expirationDate": "2025-12-02T02:52:24Z", "expirationDateMillis": 1764643944000, "identifier": "premium", "isActive": true, "isSandbox": true, "latestPurchaseDate": "2025-12-01T02:52:24Z", "latestPurchaseDateMillis": 1764557544000, "originalPurchaseDate": "2025-11-09T08:01:37Z", "originalPurchaseDateMillis": 1762675297000, "ownershipType": "PURCHASED", "periodType": "NORMAL", "productIdentifier": "com.wizzmo.app.pro_annual", "productPlanIdentifier": null, "store": "APP_STORE", "unsubscribeDetectedAt": null, "unsubscribeDetectedAtMillis": null, "verification": "NOT_REQUESTED", "willRenew": true}}
 LOG  [SubscriptionContext] Active subscriptions: ["com.wizzmo.app.pro_annual"]
 LOG  [SubscriptionContext] isPro check result: true
 LOG  [SubscriptionContext] Product ID from entitlement: com.wizzmo.app.pro_annual
 LOG  [SubscriptionContext] Final plan type: pro_yearly
 LOG  [SubscriptionContext] Final status: active
 LOG  [SubscriptionContext] Subscription sync disabled - preventing RLS errors during account switching
 LOG  [SubscriptionContext] Customer info updated {"activeSubscriptions": ["com.wizzmo.app.pro_annual"], "allExpirationDates": {"com.wizzmo.app.pro_annual": "2025-12-02T02:52:24Z", "com.wizzmo.app.pro_monthly": "2025-11-10T08:01:37Z"}, "allExpirationDatesMillis": {"com.wizzmo.app.pro_annual": 1764643944000, "com.wizzmo.app.pro_monthly": 1762761697000}, "allPurchaseDates": {"com.wizzmo.app.pro_annual": "2025-12-01T02:52:24Z", "com.wizzmo.app.pro_monthly": "2025-11-09T08:01:37Z"}, "allPurchaseDatesMillis": {"com.wizzmo.app.pro_annual": 1764557544000, "com.wizzmo.app.pro_monthly": 1762675297000}, "allPurchasedProductIdentifiers": ["com.wizzmo.app.pro_annual", "com.wizzmo.app.pro_monthly"], "entitlements": {"active": {"premium": [Object]}, "all": {"premium": [Object]}, "verification": "NOT_REQUESTED"}, "firstSeen": "2025-11-09T08:01:37Z", "firstSeenMillis": 1762675297000, "latestExpirationDate": "2025-12-02T02:52:24Z", "latestExpirationDateMillis": 1764643944000, "managementURL": "https://apps.apple.com/account/subscriptions", "nonSubscriptionTransactions": [], "originalAppUserId": "$RCAnonymousID:c95dca9d153a438e8293e3bc3e30ce5b", "originalApplicationVersion": "1.0", "originalPurchaseDate": "2025-11-09T08:01:37Z", "originalPurchaseDateMillis": 1762675297000, "requestDate": "2025-12-01T08:51:01Z", "requestDateMillis": 1764579061187, "subscriptionsByProductIdentifier": {"com.wizzmo.app.pro_annual": {"billingIssuesDetectedAt": null, "expiresDate": "2025-12-02T02:52:24Z", "gracePeriodExpiresDate": null, "isActive": true, "isSandbox": true, "originalPurchaseDate": "2025-11-09T08:01:37Z", "ownershipType": "PURCHASED", "periodType": "NORMAL", "price": [Object], "productIdentifier": "com.wizzmo.app.pro_annual", "purchaseDate": "2025-12-01T02:52:24Z", "refundedAt": null, "store": "APP_STORE", "storeTransactionId": "2000001069194137", "unsubscribeDetectedAt": null, "willRenew": true}, "com.wizzmo.app.pro_monthly": {"billingIssuesDetectedAt": null, "expiresDate": "2025-11-10T08:01:37Z", "gracePeriodExpiresDate": null, "isActive": false, "isSandbox": true, "originalPurchaseDate": "2025-11-09T08:01:37Z", "ownershipType": "PURCHASED", "periodType": "NORMAL", "price": [Object], "productIdentifier": "com.wizzmo.app.pro_monthly", "purchaseDate": "2025-11-09T08:01:37Z", "refundedAt": null, "store": "APP_STORE", "storeTransactionId": "2000001052093162", "unsubscribeDetectedAt": null, "willRenew": true}}}
 LOG  [SubscriptionContext] === SUBSCRIPTION DEBUG START ===
 LOG  [SubscriptionContext] Raw CustomerInfo: {
  "activeSubscriptions": [
    "com.wizzmo.app.pro_annual"
  ],
  "entitlements": [
    "premium"
  ],
  "subscriptionsByProductIdentifier": [
    "com.wizzmo.app.pro_monthly",
    "com.wizzmo.app.pro_annual"
  ],
  "allSubscriptions": {
    "com.wizzmo.app.pro_monthly": {
      "storeTransactionId": "2000001052093162",
      "isSandbox": true,
      "price": {
        "amount": 9.99,
        "currency": "USD"
      },
      "ownershipType": "PURCHASED",
      "willRenew": true,
      "expiresDate": "2025-11-10T08:01:37Z",
      "isActive": false,
      "unsubscribeDetectedAt": null,
      "store": "APP_STORE",
      "periodType": "NORMAL",
      "purchaseDate": "2025-11-09T08:01:37Z",
      "billingIssuesDetectedAt": null,
      "productIdentifier": "com.wizzmo.app.pro_monthly",
      "refundedAt": null,
      "gracePeriodExpiresDate": null,
      "originalPurchaseDate": "2025-11-09T08:01:37Z"
    },
    "com.wizzmo.app.pro_annual": {
      "unsubscribeDetectedAt": null,
      "periodType": "NORMAL",
      "store": "APP_STORE",
      "isActive": true,
      "refundedAt": null,
      "gracePeriodExpiresDate": null,
      "originalPurchaseDate": "2025-11-09T08:01:37Z",
      "ownershipType": "PURCHASED",
      "willRenew": true,
      "expiresDate": "2025-12-02T02:52:24Z",
      "storeTransactionId": "2000001069194137",
      "price": {
        "currency": "USD",
        "amount": 59.99
      },
      "isSandbox": true,
      "productIdentifier": "com.wizzmo.app.pro_annual",
      "billingIssuesDetectedAt": null,
      "purchaseDate": "2025-12-01T02:52:24Z"
    }
  }
}
 LOG  [SubscriptionContext] Subscription check: {"hasAnnual": true, "hasMonthly": false}
 LOG  [SubscriptionContext] Entitlement check result: true
 LOG  [SubscriptionContext] Product ID from entitlement: com.wizzmo.app.pro_annual
 LOG  [SubscriptionContext] Full entitlement data: {
  "billingIssueDetectedAt": null,
  "unsubscribeDetectedAtMillis": null,
  "billingIssueDetectedAtMillis": null,
  "expirationDateMillis": 1764643944000,
  "store": "APP_STORE",
  "periodType": "NORMAL",
  "productPlanIdentifier": null,
  "isActive": true,
  "identifier": "premium",
  "unsubscribeDetectedAt": null,
  "ownershipType": "PURCHASED",
  "willRenew": true,
  "expirationDate": "2025-12-02T02:52:24Z",
  "latestPurchaseDate": "2025-12-01T02:52:24Z",
  "originalPurchaseDate": "2025-11-09T08:01:37Z",
  "verification": "NOT_REQUESTED",
  "originalPurchaseDateMillis": 1762675297000,
  "latestPurchaseDateMillis": 1764557544000,
  "isSandbox": true,
  "productIdentifier": "com.wizzmo.app.pro_annual"
}
 LOG  [SubscriptionContext] Detected ANNUAL plan from entitlement
 LOG  [SubscriptionContext] Final results:
 LOG  [SubscriptionContext] - Plan: pro_yearly
 LOG  [SubscriptionContext] - Active: true
 LOG  [SubscriptionContext] - Billing period end: 2025-12-01T02:52:24.000Z
 LOG  [SubscriptionContext] === SUBSCRIPTION DEBUG END ===
 LOG  [SubscriptionContext] Customer entitlements: ["premium"]
 LOG  [SubscriptionContext] Looking for entitlement: premium
 LOG  [SubscriptionContext] Available entitlements: {"premium": {"billingIssueDetectedAt": null, "billingIssueDetectedAtMillis": null, "expirationDate": "2025-12-02T02:52:24Z", "expirationDateMillis": 1764643944000, "identifier": "premium", "isActive": true, "isSandbox": true, "latestPurchaseDate": "2025-12-01T02:52:24Z", "latestPurchaseDateMillis": 1764557544000, "originalPurchaseDate": "2025-11-09T08:01:37Z", "originalPurchaseDateMillis": 1762675297000, "ownershipType": "PURCHASED", "periodType": "NORMAL", "productIdentifier": "com.wizzmo.app.pro_annual", "productPlanIdentifier": null, "store": "APP_STORE", "unsubscribeDetectedAt": null, "unsubscribeDetectedAtMillis": null, "verification": "NOT_REQUESTED", "willRenew": true}}
 LOG  [SubscriptionContext] Active subscriptions: ["com.wizzmo.app.pro_annual"]
 LOG  [SubscriptionContext] isPro check result: true
 LOG  [SubscriptionContext] Product ID from entitlement: com.wizzmo.app.pro_annual
 LOG  [SubscriptionContext] Final plan type: pro_yearly
 LOG  [SubscriptionContext] Final status: active
 LOG  [SubscriptionContext] Subscription sync disabled - preventing RLS errors during account switching
 LOG  [SubscriptionContext] Customer info updated {"activeSubscriptions": ["com.wizzmo.app.pro_annual"], "allExpirationDates": {"com.wizzmo.app.pro_annual": "2025-12-02T02:52:24Z", "com.wizzmo.app.pro_monthly": "2025-11-10T08:01:37Z"}, "allExpirationDatesMillis": {"com.wizzmo.app.pro_annual": 1764643944000, "com.wizzmo.app.pro_monthly": 1762761697000}, "allPurchaseDates": {"com.wizzmo.app.pro_annual": "2025-12-01T02:52:24Z", "com.wizzmo.app.pro_monthly": "2025-11-09T08:01:37Z"}, "allPurchaseDatesMillis": {"com.wizzmo.app.pro_annual": 1764557544000, "com.wizzmo.app.pro_monthly": 1762675297000}, "allPurchasedProductIdentifiers": ["com.wizzmo.app.pro_annual", "com.wizzmo.app.pro_monthly"], "entitlements": {"active": {"premium": [Object]}, "all": {"premium": [Object]}, "verification": "NOT_REQUESTED"}, "firstSeen": "2025-11-09T08:01:37Z", "firstSeenMillis": 1762675297000, "latestExpirationDate": "2025-12-02T02:52:24Z", "latestExpirationDateMillis": 1764643944000, "managementURL": "https://apps.apple.com/account/subscriptions", "nonSubscriptionTransactions": [], "originalAppUserId": "$RCAnonymousID:c95dca9d153a438e8293e3bc3e30ce5b", "originalApplicationVersion": "1.0", "originalPurchaseDate": "2025-11-09T08:01:37Z", "originalPurchaseDateMillis": 1762675297000, "requestDate": "2025-12-01T08:51:01Z", "requestDateMillis": 1764579061187, "subscriptionsByProductIdentifier": {"com.wizzmo.app.pro_annual": {"billingIssuesDetectedAt": null, "expiresDate": "2025-12-02T02:52:24Z", "gracePeriodExpiresDate": null, "isActive": true, "isSandbox": true, "originalPurchaseDate": "2025-11-09T08:01:37Z", "ownershipType": "PURCHASED", "periodType": "NORMAL", "price": [Object], "productIdentifier": "com.wizzmo.app.pro_annual", "purchaseDate": "2025-12-01T02:52:24Z", "refundedAt": null, "store": "APP_STORE", "storeTransactionId": "2000001069194137", "unsubscribeDetectedAt": null, "willRenew": true}, "com.wizzmo.app.pro_monthly": {"billingIssuesDetectedAt": null, "expiresDate": "2025-11-10T08:01:37Z", "gracePeriodExpiresDate": null, "isActive": false, "isSandbox": true, "originalPurchaseDate": "2025-11-09T08:01:37Z", "ownershipType": "PURCHASED", "periodType": "NORMAL", "price": [Object], "productIdentifier": "com.wizzmo.app.pro_monthly", "purchaseDate": "2025-11-09T08:01:37Z", "refundedAt": null, "store": "APP_STORE", "storeTransactionId": "2000001052093162", "unsubscribeDetectedAt": null, "willRenew": true}}}
 LOG  [SubscriptionContext] === SUBSCRIPTION DEBUG START ===
 LOG  [SubscriptionContext] Raw CustomerInfo: {
  "activeSubscriptions": [
    "com.wizzmo.app.pro_annual"
  ],
  "entitlements": [
    "premium"
  ],
  "subscriptionsByProductIdentifier": [
    "com.wizzmo.app.pro_monthly",
    "com.wizzmo.app.pro_annual"
  ],
  "allSubscriptions": {
    "com.wizzmo.app.pro_monthly": {
      "storeTransactionId": "2000001052093162",
      "isSandbox": true,
      "price": {
        "amount": 9.99,
        "currency": "USD"
      },
      "ownershipType": "PURCHASED",
      "willRenew": true,
      "expiresDate": "2025-11-10T08:01:37Z",
      "isActive": false,
      "unsubscribeDetectedAt": null,
      "store": "APP_STORE",
      "periodType": "NORMAL",
      "purchaseDate": "2025-11-09T08:01:37Z",
      "billingIssuesDetectedAt": null,
      "productIdentifier": "com.wizzmo.app.pro_monthly",
      "refundedAt": null,
      "gracePeriodExpiresDate": null,
      "originalPurchaseDate": "2025-11-09T08:01:37Z"
    },
    "com.wizzmo.app.pro_annual": {
      "unsubscribeDetectedAt": null,
      "periodType": "NORMAL",
      "store": "APP_STORE",
      "isActive": true,
      "refundedAt": null,
      "gracePeriodExpiresDate": null,
      "originalPurchaseDate": "2025-11-09T08:01:37Z",
      "ownershipType": "PURCHASED",
      "willRenew": true,
      "expiresDate": "2025-12-02T02:52:24Z",
      "storeTransactionId": "2000001069194137",
      "price": {
        "currency": "USD",
        "amount": 59.99
      },
      "isSandbox": true,
      "productIdentifier": "com.wizzmo.app.pro_annual",
      "billingIssuesDetectedAt": null,
      "purchaseDate": "2025-12-01T02:52:24Z"
    }
  }
}
 LOG  [SubscriptionContext] Subscription check: {"hasAnnual": true, "hasMonthly": false}
 LOG  [SubscriptionContext] Entitlement check result: true
 LOG  [SubscriptionContext] Product ID from entitlement: com.wizzmo.app.pro_annual
 LOG  [SubscriptionContext] Full entitlement data: {
  "billingIssueDetectedAt": null,
  "unsubscribeDetectedAtMillis": null,
  "billingIssueDetectedAtMillis": null,
  "expirationDateMillis": 1764643944000,
  "store": "APP_STORE",
  "periodType": "NORMAL",
  "productPlanIdentifier": null,
  "isActive": true,
  "identifier": "premium",
  "unsubscribeDetectedAt": null,
  "ownershipType": "PURCHASED",
  "willRenew": true,
  "expirationDate": "2025-12-02T02:52:24Z",
  "latestPurchaseDate": "2025-12-01T02:52:24Z",
  "originalPurchaseDate": "2025-11-09T08:01:37Z",
  "verification": "NOT_REQUESTED",
  "originalPurchaseDateMillis": 1762675297000,
  "latestPurchaseDateMillis": 1764557544000,
  "isSandbox": true,
  "productIdentifier": "com.wizzmo.app.pro_annual"
}
 LOG  [SubscriptionContext] Detected ANNUAL plan from entitlement
 LOG  [SubscriptionContext] Final results:
 LOG  [SubscriptionContext] - Plan: pro_yearly
 LOG  [SubscriptionContext] - Active: true
 LOG  [SubscriptionContext] - Billing period end: 2025-12-01T02:52:24.000Z
 LOG  [SubscriptionContext] === SUBSCRIPTION DEBUG END ===
 LOG  [SubscriptionContext] Customer entitlements: ["premium"]
 LOG  [SubscriptionContext] Looking for entitlement: premium
 LOG  [SubscriptionContext] Available entitlements: {"premium": {"billingIssueDetectedAt": null, "billingIssueDetectedAtMillis": null, "expirationDate": "2025-12-02T02:52:24Z", "expirationDateMillis": 1764643944000, "identifier": "premium", "isActive": true, "isSandbox": true, "latestPurchaseDate": "2025-12-01T02:52:24Z", "latestPurchaseDateMillis": 1764557544000, "originalPurchaseDate": "2025-11-09T08:01:37Z", "originalPurchaseDateMillis": 1762675297000, "ownershipType": "PURCHASED", "periodType": "NORMAL", "productIdentifier": "com.wizzmo.app.pro_annual", "productPlanIdentifier": null, "store": "APP_STORE", "unsubscribeDetectedAt": null, "unsubscribeDetectedAtMillis": null, "verification": "NOT_REQUESTED", "willRenew": true}}
 LOG  [SubscriptionContext] Active subscriptions: ["com.wizzmo.app.pro_annual"]
 LOG  [SubscriptionContext] isPro check result: true
 LOG  [SubscriptionContext] Product ID from entitlement: com.wizzmo.app.pro_annual
 LOG  [SubscriptionContext] Final plan type: pro_yearly
 LOG  [SubscriptionContext] Final status: active
 LOG  [SubscriptionContext] Subscription sync disabled - preventing RLS errors during account switching
 LOG  [SubscriptionContext] === SUBSCRIPTION DEBUG START ===
 LOG  [SubscriptionContext] Raw CustomerInfo: {
  "activeSubscriptions": [
    "com.wizzmo.app.pro_annual"
  ],
  "entitlements": [
    "premium"
  ],
  "subscriptionsByProductIdentifier": [
    "com.wizzmo.app.pro_annual",
    "com.wizzmo.app.pro_monthly"
  ],
  "allSubscriptions": {
    "com.wizzmo.app.pro_annual": {
      "willRenew": true,
      "billingIssuesDetectedAt": null,
      "ownershipType": "PURCHASED",
      "storeTransactionId": "2000001069194137",
      "price": {
        "amount": 59.99,
        "currency": "USD"
      },
      "isSandbox": true,
      "expiresDate": "2025-12-02T02:52:24Z",
      "unsubscribeDetectedAt": null,
      "productIdentifier": "com.wizzmo.app.pro_annual",
      "refundedAt": null,
      "gracePeriodExpiresDate": null,
      "periodType": "NORMAL",
      "originalPurchaseDate": "2025-11-09T08:01:37Z",
      "store": "APP_STORE",
      "purchaseDate": "2025-12-01T02:52:24Z",
      "isActive": true
    },
    "com.wizzmo.app.pro_monthly": {
      "storeTransactionId": "2000001052093162",
      "unsubscribeDetectedAt": null,
      "ownershipType": "PURCHASED",
      "isSandbox": true,
      "originalPurchaseDate": "2025-11-09T08:01:37Z",
      "isActive": false,
      "purchaseDate": "2025-11-09T08:01:37Z",
      "billingIssuesDetectedAt": null,
      "refundedAt": null,
      "expiresDate": "2025-11-10T08:01:37Z",
      "gracePeriodExpiresDate": null,
      "productIdentifier": "com.wizzmo.app.pro_monthly",
      "store": "APP_STORE",
      "willRenew": true,
      "price": {
        "amount": 9.99,
        "currency": "USD"
      },
      "periodType": "NORMAL"
    }
  }
}
 LOG  [SubscriptionContext] Subscription check: {"hasAnnual": true, "hasMonthly": false}
 LOG  [SubscriptionContext] Entitlement check result: true
 LOG  [SubscriptionContext] Product ID from entitlement: com.wizzmo.app.pro_annual
 LOG  [SubscriptionContext] Full entitlement data: {
  "productIdentifier": "com.wizzmo.app.pro_annual",
  "verification": "NOT_REQUESTED",
  "originalPurchaseDateMillis": 1762675297000,
  "isActive": true,
  "expirationDate": "2025-12-02T02:52:24Z",
  "identifier": "premium",
  "willRenew": true,
  "latestPurchaseDate": "2025-12-01T02:52:24Z",
  "isSandbox": true,
  "unsubscribeDetectedAt": null,
  "expirationDateMillis": 1764643944000,
  "billingIssueDetectedAtMillis": null,
  "unsubscribeDetectedAtMillis": null,
  "productPlanIdentifier": null,
  "originalPurchaseDate": "2025-11-09T08:01:37Z",
  "latestPurchaseDateMillis": 1764557544000,
  "ownershipType": "PURCHASED",
  "periodType": "NORMAL",
  "billingIssueDetectedAt": null,
  "store": "APP_STORE"
}
 LOG  [SubscriptionContext] Detected ANNUAL plan from entitlement
 LOG  [SubscriptionContext] Final results:
 LOG  [SubscriptionContext] - Plan: pro_yearly
 LOG  [SubscriptionContext] - Active: true
 LOG  [SubscriptionContext] - Billing period end: 2025-12-01T02:52:24.000Z
 LOG  [SubscriptionContext] === SUBSCRIPTION DEBUG END ===
 LOG  [SubscriptionContext] Customer entitlements: ["premium"]
 LOG  [SubscriptionContext] Looking for entitlement: premium
 LOG  [SubscriptionContext] Available entitlements: {"premium": {"billingIssueDetectedAt": null, "billingIssueDetectedAtMillis": null, "expirationDate": "2025-12-02T02:52:24Z", "expirationDateMillis": 1764643944000, "identifier": "premium", "isActive": true, "isSandbox": true, "latestPurchaseDate": "2025-12-01T02:52:24Z", "latestPurchaseDateMillis": 1764557544000, "originalPurchaseDate": "2025-11-09T08:01:37Z", "originalPurchaseDateMillis": 1762675297000, "ownershipType": "PURCHASED", "periodType": "NORMAL", "productIdentifier": "com.wizzmo.app.pro_annual", "productPlanIdentifier": null, "store": "APP_STORE", "unsubscribeDetectedAt": null, "unsubscribeDetectedAtMillis": null, "verification": "NOT_REQUESTED", "willRenew": true}}
 LOG  [SubscriptionContext] Active subscriptions: ["com.wizzmo.app.pro_annual"]
 LOG  [SubscriptionContext] isPro check result: true
 LOG  [SubscriptionContext] Product ID from entitlement: com.wizzmo.app.pro_annual
 LOG  [SubscriptionContext] Final plan type: pro_yearly
 LOG  [SubscriptionContext] Final status: active
 LOG  [SubscriptionContext] Subscription sync disabled - preventing RLS errors during account switching
 DEBUG  [RevenueCat] ℹ️ There are no requests currently running, starting request GET /v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/health_report
 DEBUG  [RevenueCat] ℹ️ API request started: GET '/v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/health_report'
 DEBUG  [RevenueCat] ℹ️ No cached Offerings, fetching from network
 DEBUG  [RevenueCat] ℹ️ Offerings cache is stale, updating from network in foreground
 LOG  [updateMentorHelpfulVotes] Calculated 0 total helpful votes for mentor c6512688-16fa-4e3f-a9da-11e8d16bb5fc
 LOG  [updateMentorHelpfulVotes] Mentor helpful votes updated successfully
 LOG  [updateMentorHelpfulVotes] Updating helpful votes for mentor: f8e7a452-d89b-479c-97b8-87bd1c776cff
 LOG  [updateMentorHelpfulVotes] Calculated 0 total helpful votes for mentor f8e7a452-d89b-479c-97b8-87bd1c776cff
 LOG  [updateMentorHelpfulVotes] Mentor helpful votes updated successfully
 LOG  [updateMentorHelpfulVotes] Updating helpful votes for mentor: 9f565350-c568-4a5e-a939-f3c8b724c08f
 LOG  [updateMentorHelpfulVotes] Calculated 20 total helpful votes for mentor 9f565350-c568-4a5e-a939-f3c8b724c08f
 DEBUG  [RevenueCat] 😻 Store products request received response
 DEBUG  [RevenueCat] ℹ️ Store products request finished
 WARN  [RevenueCat] ⚠️ There's a problem with your configuration. No packages could be found for offering with  identifier default. This could be due to Products not being configured correctly in the RevenueCat dashboard, App Store Connect (or the StoreKit Configuration file if one is being used). 
To configure products, follow the instructions in https://rev.cat/how-to-configure-offerings. 
More information: https://rev.cat/why-are-offerings-empty
 DEBUG  [RevenueCat] 😻 Offerings updated from network.
 LOG  [updateMentorHelpfulVotes] Mentor helpful votes updated successfully
 LOG  [updateMentorHelpfulVotes] Updating helpful votes for mentor: 372b170e-b119-444a-ad3a-0a7a5f3788f4
 DEBUG  [RevenueCat] ℹ️ API request completed: POST '/v1/receipts' (200)
 DEBUG  [RevenueCat] ℹ️ PostReceiptDataOperation: Finished
 DEBUG  [RevenueCat] ℹ️ Serial request done: POST /v1/receipts, 0 requests left in the queue
 LOG  [updateMentorHelpfulVotes] Calculated 0 total helpful votes for mentor 372b170e-b119-444a-ad3a-0a7a5f3788f4
 LOG  [updateMentorHelpfulVotes] Mentor helpful votes updated successfully
 LOG  [updateMentorHelpfulVotes] Updating helpful votes for mentor: 23c08c80-3299-44c7-8feb-09a5ff2d99b3
 LOG  [updateMentorHelpfulVotes] Calculated 0 total helpful votes for mentor 23c08c80-3299-44c7-8feb-09a5ff2d99b3
 LOG  [updateMentorHelpfulVotes] Mentor helpful votes updated successfully
 LOG  [syncAllMentorStats] Synced stats for 12 mentors successfully
 LOG  [AppContext] Mentor stats sync completed
 LOG  [AppContext] Initializing app data for user: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3
 LOG  [AppContext] Fetching categories
 LOG  [getCategories] Fetching categories for vertical: wizzmo
 LOG  [getCategories] Found 21 categories
 LOG  [AppContext] Categories loaded: 21
 LOG  [AppContext] Fetching user profile
 LOG  [getUserProfile] Fetching profile for user: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3
 LOG  [AppContext] Fetching user questions
 LOG  [getQuestionsByStudent] Fetching questions for student: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3, vertical: wizzmo
 LOG  [AppContext] Fetching user chats for mode: student available modes: ["student"]
 LOG  [getActiveSessions] Fetching active sessions for: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3 student
 LOG  [getResolvedSessions] Fetching resolved sessions for: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3 student
 LOG  [AppContext] Fetching available mentors
 LOG  [AppContext] Mentors loaded
 LOG  [AppContext] Fetching trending topics
 LOG  [getPublicQuestions] Fetching public questions, limit: 50 sortBy: recent vertical: wizzmo
 LOG  [getResolvedSessions] Found 0 resolved sessions
 LOG  [getActiveSessions] Found 0 active sessions
 LOG  [AppContext] Fetched student sessions - active: 0 resolved: 0
 LOG  [AppContext] Unique sessions after deduplication - active: 0 resolved: 0
 LOG  [AppContext] Chats loaded: 0
 LOG  [getQuestionsByStudent] Found 0 questions
 LOG  [AppContext] Questions loaded: 0
 LOG  [getPublicQuestions] Found 2 questions
 ERROR  [getUserProfile] Error: {"code": "PGRST116", "details": "The result contains 0 rows", "hint": null, "message": "Cannot coerce the result to a single JSON object"} 

Code: supabaseService.ts
  221 |     return { data: user, error: null }
  222 |   } catch (error) {
> 223 |     console.error('[getUserProfile] Error:', error)
      |                  ^
  224 |     return { data: null, error: error as Error }
  225 |   }
  226 | }
Call Stack
  getUserProfile (lib/supabaseService.ts:223:18)
 ERROR  [AppContext] Error fetching user profile: {"code": "PGRST116", "details": "The result contains 0 rows", "hint": null, "message": "Cannot coerce the result to a single JSON object"} 

Code: AppContext.tsx
  208 |       console.log('[AppContext] User profile loaded');
  209 |     } catch (error) {
> 210 |       console.error('[AppContext] Error fetching user profile:', error);
      |                    ^
  211 |     }
  212 |   };
  213 |
Call Stack
  fetchUserProfile (contexts/AppContext.tsx:210:20)
 LOG  [getPublicQuestions] Enhanced 2 questions with votes/comments
 LOG  [AppContext] Trending topics loaded: 2
 LOG  [AppContext] Setting up real-time subscriptions
 LOG  [subscribeToNotifications] Setting up subscription for user: 4c463dcc-5629-456a-bcf8-f1dadd6d3ec3
 LOG  [AppContext] App data initialized successfully
 DEBUG  [RevenueCat] ℹ️ API request completed: GET '/v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/health_report' (304)
 DEBUG  [RevenueCat] ℹ️ HealthReportOperation: Finished
 DEBUG  [RevenueCat] ℹ️ GetOfferingsOperation: Started
 WARN  [RevenueCat] ⚠️ RevenueCat SDK is configured correctly, but contains some issues you might want to address

Warnings:
  • Your products are configured in RevenueCat but aren't approved in App Store Connect yet. This prevents users from making purchases in production. Please ensure all products are approved and available for sale in App Store Connect.
  • The offerings 'default', 'wizzmo default' have configuration issues that may prevent users from seeing product options or making purchases.

Product Issues:
  ⚠️ com.wizzmo.app.pro_monthly (Monthly Subscription): This product's status (MISSING_METADATA) requires you to take action in App Store Connect before using it in production purchases.
  ⚠️ com.wizzmo.app.pro_annual (Annual Subscription): This product's status (MISSING_METADATA) requires you to take action in App Store Connect before using it in production purchases.

Offering Issues:
  ⚠️ default
  ⚠️ wizzmo default
    ⚠️ $rc_annual (com.wizzmo.app.pro_annual): This product's status (MISSING_METADATA) requires you to take action in App Store Connect before using it in production purchases.
    ⚠️ $rc_monthly (com.wizzmo.app.pro_monthly): This product's status (MISSING_METADATA) requires you to take action in App Store Connect before using it in production purchases.
 DEBUG  [RevenueCat] ℹ️ Serial request done: GET /v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/health_report, 0 requests left in the queue
 DEBUG  [RevenueCat] ℹ️ There are no requests currently running, starting request GET /v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/offerings
 DEBUG  [RevenueCat] ℹ️ API request started: GET '/v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/offerings'
 DEBUG  [RevenueCat] ℹ️ API request completed: GET '/v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/offerings' (304)
 DEBUG  [RevenueCat] ℹ️ Skipping products request for these products because they were already cached: ["com.wizzmo.app.pro_monthly", "com.wizzmo.app.pro_annual"]
 WARN  [RevenueCat] ⚠️ There's a problem with your configuration. No packages could be found for offering with  identifier default. This could be due to Products not being configured correctly in the RevenueCat dashboard, App Store Connect (or the StoreKit Configuration file if one is being used). 
To configure products, follow the instructions in https://rev.cat/how-to-configure-offerings. 
More information: https://rev.cat/why-are-offerings-empty
 DEBUG  [RevenueCat] 😻 Offerings updated from network.
 DEBUG  [RevenueCat] ℹ️ GetOfferingsOperation: Finished
 DEBUG  [RevenueCat] ℹ️ Serial request done: GET /v1/subscribers/$RCAnonymousID%3A9768344ac09d4d7eacef409608fdbcc3/offerings, 0 requests left in the queue
 LOG  [SubscriptionContext] Raw offerings: {"all": {"wizzmo default": {"annual": [Object], "availablePackages": [Array], "identifier": "wizzmo default", "metadata": [Object], "monthly": [Object], "serverDescription": "The standard set of wizzmo packages."}}, "current": {"annual": {"identifier": "$rc_annual", "offeringIdentifier": "wizzmo default", "packageType": "ANNUAL", "presentedOfferingContext": [Object], "product": [Object]}, "availablePackages": [[Object], [Object]], "identifier": "wizzmo default", "metadata": {}, "monthly": {"identifier": "$rc_monthly", "offeringIdentifier": "wizzmo default", "packageType": "MONTHLY", "presentedOfferingContext": [Object], "product": [Object]}, "serverDescription": "The standard set of wizzmo packages."}}
 LOG  [SubscriptionContext] Current offering: {"annual": {"identifier": "$rc_annual", "offeringIdentifier": "wizzmo default", "packageType": "ANNUAL", "presentedOfferingContext": {"offeringIdentifier": "wizzmo default", "placementIdentifier": null, "targetingContext": null}, "product": {"currencyCode": "USD", "description": "Annual Wizzmo Pro Subscription.", "discounts": [Array], "identifier": "com.wizzmo.app.pro_annual", "introPrice": null, "price": 59.989999999999995, "pricePerMonth": 5, "pricePerMonthString": "$5.00", "pricePerWeek": 1.15, "pricePerWeekString": "$1.15", "pricePerYear": 59.989999999999995, "pricePerYearString": "$59.99", "priceString": "$59.99", "productCategory": "SUBSCRIPTION", "productType": "AUTO_RENEWABLE_SUBSCRIPTION", "subscriptionPeriod": "P1Y", "title": "Annual Subscription"}}, "availablePackages": [{"identifier": "$rc_annual", "offeringIdentifier": "wizzmo default", "packageType": "ANNUAL", "presentedOfferingContext": [Object], "product": [Object]}, {"identifier": "$rc_monthly", "offeringIdentifier": "wizzmo default", "packageType": "MONTHLY", "presentedOfferingContext": [Object], "product": [Object]}], "identifier": "wizzmo default", "metadata": {}, "monthly": {"identifier": "$rc_monthly", "offeringIdentifier": "wizzmo default", "packageType": "MONTHLY", "presentedOfferingContext": {"offeringIdentifier": "wizzmo default", "placementIdentifier": null, "targetingContext": null}, "product": {"currencyCode": "USD", "description": "Monthly subscription", "discounts": [Array], "identifier": "com.wizzmo.app.pro_monthly", "introPrice": null, "price": 9.99, "pricePerMonth": 9.99, "pricePerMonthString": "$9.99", "pricePerWeek": 2.3, "pricePerWeekString": "$2.30", "pricePerYear": 119.88, "pricePerYearString": "$119.88", "priceString": "$9.99", "productCategory": "SUBSCRIPTION", "productType": "AUTO_RENEWABLE_SUBSCRIPTION", "subscriptionPeriod": "P1M", "title": "Wizzmo Pro Subscription"}}, "serverDescription": "The standard set of wizzmo packages."}
 LOG  [SubscriptionContext] All offerings: {"wizzmo default": {"annual": {"identifier": "$rc_annual", "offeringIdentifier": "wizzmo default", "packageType": "ANNUAL", "presentedOfferingContext": [Object], "product": [Object]}, "availablePackages": [[Object], [Object]], "identifier": "wizzmo default", "metadata": {}, "monthly": {"identifier": "$rc_monthly", "offeringIdentifier": "wizzmo default", "packageType": "MONTHLY", "presentedOfferingContext": [Object], "product": [Object]}, "serverDescription": "The standard set of wizzmo packages."}}
 LOG  [SubscriptionContext] RevenueCat initialized successfully
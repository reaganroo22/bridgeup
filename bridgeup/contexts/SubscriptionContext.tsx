import React, { createContext, useContext, useState, useEffect } from 'react';
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from './AuthContext';
import * as supabaseService from '../lib/supabaseService';

export type SubscriptionPlan = 'free' | 'pro_monthly' | 'pro_yearly';

export interface SubscriptionStatus {
  plan: SubscriptionPlan;
  questionsUsed: number;
  questionsLimit: number;
  trialEndsAt: Date | null;
  isActive: boolean;
  billingPeriodEnd: Date | null;
}

interface SubscriptionContextType {
  subscriptionStatus: SubscriptionStatus;
  canAskQuestion: () => boolean;
  incrementQuestionCount: () => Promise<void>;
  getQuestionsRemaining: () => number;
  upgradeToPlan: (plan: SubscriptionPlan) => void;
  restorePurchases: () => Promise<void>;
  isProUser: () => boolean;
  offerings: PurchasesOffering[] | null;
  customerInfo: CustomerInfo | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  resetRevenueCatUser: () => Promise<void>;
  isLoading: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
};

// RevenueCat Configuration
const REVENUECAT_API_KEY = Platform.select({
  ios: 'appl_YcszOesLPQEJgSAAwfWosRBrHkT', // Wizzmo iOS SDK key
  android: 'goog_YOUR_ANDROID_API_KEY', // Android key TBD
}) || '';

const ENTITLEMENT_ID = 'premium'; // This should match your RevenueCat entitlement
const QUESTIONS_STORAGE_KEY = 'wizzmo_questions_used';
const QUESTIONS_RESET_DATE_KEY = 'wizzmo_questions_reset_date';

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    plan: 'free',
    questionsUsed: 0,
    questionsLimit: 3,
    trialEndsAt: null,
    isActive: true,
    billingPeriodEnd: null,
  });

  const [offerings, setOfferings] = useState<PurchasesOffering[] | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize RevenueCat
  useEffect(() => {
    const initRevenueCat = async () => {
      try {
        console.log('[SubscriptionContext] Initializing RevenueCat');
        
        // Initialize RevenueCat (works in development and production)
        if (REVENUECAT_API_KEY) {
          Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
          
          // Clear cache in development to avoid stale subscription data
          if (__DEV__) {
            console.log('[SubscriptionContext] Development mode: clearing RevenueCat cache');
            try {
              await Purchases.invalidateCustomerInfoCache();
              // Wait for cache clear
              await new Promise(resolve => setTimeout(resolve, 1000));
              // Also sync purchases to get latest subscription changes
              await Purchases.syncPurchases();
              console.log('[SubscriptionContext] Development cache clear completed');
            } catch (cacheError) {
              console.log('[SubscriptionContext] Cache clearing failed (normal):', cacheError);
            }
          }
          
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
          
          // Set up listener for customer info updates
          Purchases.addCustomerInfoUpdateListener((customerInfo) => {
            console.log('[SubscriptionContext] Customer info updated', customerInfo);
            setCustomerInfo(customerInfo);
            updateSubscriptionStatusFromCustomerInfo(customerInfo);
          });

          // Get initial customer info
          const customerInfo = await Purchases.getCustomerInfo();
          setCustomerInfo(customerInfo);
          updateSubscriptionStatusFromCustomerInfo(customerInfo);

          // Get offerings
          const offerings = await Purchases.getOfferings();
          console.log('[SubscriptionContext] Raw offerings:', offerings);
          console.log('[SubscriptionContext] Current offering:', offerings.current);
          console.log('[SubscriptionContext] All offerings:', offerings.all);
          
          setOfferings(offerings.all ? Object.values(offerings.all) : []);
          
          console.log('[SubscriptionContext] RevenueCat initialized successfully');
        } else {
          console.warn('[SubscriptionContext] RevenueCat API key not configured');
        }
      } catch (error) {
        console.error('[SubscriptionContext] Error initializing RevenueCat:', error);
        // Set safe fallback state
        setOfferings([]);
        setCustomerInfo(null);
        setSubscriptionStatus({
          plan: 'free',
          questionsUsed: 0,
          questionsLimit: 3,
          trialEndsAt: null,
          isActive: false,
          billingPeriodEnd: null,
        });
      } finally {
        setIsLoading(false);
      }
    };

    initRevenueCat();
  }, []);

  // Load subscription data from database
  useEffect(() => {
    if (user) {
      loadSubscriptionFromDatabase();
    }
  }, [user]);

  const loadSubscriptionFromDatabase = async () => {
    if (!user) return;

    try {
      console.log('[SubscriptionContext] Loading subscription from database for user:', user.id);
      const { data: subscription, error } = await supabaseService.getUserSubscription(user.id);
      
      if (error) {
        console.error('[SubscriptionContext] Error loading subscription:', error);
        return;
      }

      if (subscription) {
        // Map database subscription to app state
        let plan: SubscriptionPlan = 'free';
        if (subscription.plan_type === 'pro_monthly') {
          plan = 'pro_monthly';
        } else if (subscription.plan_type === 'pro_yearly') {
          plan = 'pro_yearly';
        }

        setSubscriptionStatus(prev => ({
          ...prev,
          plan,
          questionsUsed: subscription.questions_used,
          questionsLimit: subscription.questions_limit || 3,
          isActive: subscription.status === 'active',
          trialEndsAt: subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null,
          billingPeriodEnd: subscription.subscription_ends_at ? new Date(subscription.subscription_ends_at) : null,
        }));

        console.log('[SubscriptionContext] Loaded subscription:', {
          plan,
          questionsUsed: subscription.questions_used,
          questionsLimit: subscription.questions_limit,
          status: subscription.status
        });
      }
    } catch (error) {
      console.error('[SubscriptionContext] Error loading subscription from database:', error);
    }
  };

  const updateSupabaseSubscription = async (customerInfo: CustomerInfo) => {
    try {
      console.log('[SubscriptionContext] Customer entitlements:', Object.keys(customerInfo.entitlements.active));
      console.log('[SubscriptionContext] Looking for entitlement:', ENTITLEMENT_ID);
      console.log('[SubscriptionContext] Available entitlements:', customerInfo.entitlements.active);
      
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      
      console.log('[SubscriptionContext] Active subscriptions:', customerInfo.activeSubscriptions);
      console.log('[SubscriptionContext] isPro check result:', isPro);
      
      let planType: 'free' | 'pro_monthly' | 'pro_yearly' = 'free';
      
      if (isPro) {
        const activeEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
        if (activeEntitlement) {
          const productId = activeEntitlement.productIdentifier;
          console.log('[SubscriptionContext] Product ID from entitlement:', productId);
          
          if (productId.includes('monthly')) {
            planType = 'pro_monthly';
          } else if (productId.includes('annual') || productId.includes('yearly')) {
            planType = 'pro_yearly';
          }
        }
      }
      
      console.log('[SubscriptionContext] Final plan type:', planType);
      console.log('[SubscriptionContext] Final status:', isPro ? 'active' : 'cancelled');
      
      const { error } = await supabaseService.updateSubscription(
        user!.id,
        planType,
        isPro ? 'active' : 'cancelled'
      );
      
      if (error) {
        console.error('[SubscriptionContext] Error updating Supabase subscription:', error);
      } else {
        console.log('[SubscriptionContext] Supabase subscription updated successfully');
      }
    } catch (error) {
      console.error('[SubscriptionContext] Error updating Supabase subscription:', error);
    }
  };

  const updateSubscriptionStatusFromCustomerInfo = (customerInfo: CustomerInfo) => {
    // Debug: Check if we have BOTH monthly and annual subscriptions
    const hasMonthly = customerInfo.activeSubscriptions.includes('com.bridgeupapp.app.pro_monthly');
    const hasAnnual = customerInfo.activeSubscriptions.includes('com.bridgeupapp.app.pro_annual');
    
    if (__DEV__) {
      console.log('[SubscriptionContext] === SUBSCRIPTION DEBUG START ===');
      console.log('[SubscriptionContext] Raw CustomerInfo:', JSON.stringify({
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
        subscriptionsByProductIdentifier: Object.keys(customerInfo.subscriptionsByProductIdentifier || {}),
        allSubscriptions: customerInfo.subscriptionsByProductIdentifier
      }, null, 2));
      console.log('[SubscriptionContext] Subscription check:', { hasMonthly, hasAnnual });
      
      if (hasMonthly && hasAnnual) {
        console.log('[SubscriptionContext] ⚠️ BOTH monthly and annual subscriptions detected - this is the issue!');
      }
    }
    
    // Only check entitlements - no fallback to activeSubscriptions
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    const activeEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
    
    console.log('[SubscriptionContext] Entitlement check result:', isPro);
    
    let plan: SubscriptionPlan = 'free';
    let billingPeriodEnd: Date | null = null;

    if (isPro && activeEntitlement) {
      const productId = activeEntitlement.productIdentifier;
      
      if (__DEV__) {
        console.log('[SubscriptionContext] Product ID from entitlement:', productId);
        console.log('[SubscriptionContext] Full entitlement data:', JSON.stringify(activeEntitlement, null, 2));
      }
      
      // PRIORITY FIX: If user has BOTH subscriptions, prioritize annual over monthly
      if (hasMonthly && hasAnnual) {
        if (__DEV__) {
          console.log('[SubscriptionContext] 🔧 FIXING: User has both subscriptions, forcing ANNUAL priority');
        }
        plan = 'pro_yearly';
        
        // Try to get annual subscription expiration date
        const annualSubscription = customerInfo.subscriptionsByProductIdentifier?.['com.bridgeupapp.app.pro_annual'];
        if (annualSubscription) {
          billingPeriodEnd = annualSubscription.expiresDate ? new Date(annualSubscription.expiresDate) : null;
          if (__DEV__) {
            console.log('[SubscriptionContext] Using annual expiration date:', billingPeriodEnd);
          }
        }
      } else if (productId.includes('annual') || productId.includes('yearly')) {
        plan = 'pro_yearly';
        if (__DEV__) {
          console.log('[SubscriptionContext] Detected ANNUAL plan from entitlement');
        }
        billingPeriodEnd = activeEntitlement.latestPurchaseDate ? new Date(activeEntitlement.latestPurchaseDate) : null;
      } else if (productId.includes('monthly')) {
        plan = 'pro_monthly';
        if (__DEV__) {
          console.log('[SubscriptionContext] Detected MONTHLY plan from entitlement');
        }
        billingPeriodEnd = activeEntitlement.latestPurchaseDate ? new Date(activeEntitlement.latestPurchaseDate) : null;
      } else {
        if (__DEV__) {
          console.log('[SubscriptionContext] Unknown product ID format:', productId);
        }
        billingPeriodEnd = activeEntitlement.latestPurchaseDate ? new Date(activeEntitlement.latestPurchaseDate) : null;
      }
    }

    if (__DEV__) {
      console.log('[SubscriptionContext] Final results:');
      console.log('[SubscriptionContext] - Plan:', plan);
      console.log('[SubscriptionContext] - Active:', isPro);
      console.log('[SubscriptionContext] - Billing period end:', billingPeriodEnd);
      console.log('[SubscriptionContext] === SUBSCRIPTION DEBUG END ===');
    }

    setSubscriptionStatus(prev => ({
      ...prev,
      plan,
      isActive: isPro,
      billingPeriodEnd,
      questionsLimit: isPro ? -1 : 3, // -1 for unlimited (pro), 3 for free trial
    }));

    // Also update Supabase to keep in sync
    if (user) {
      updateSupabaseSubscription(customerInfo);
    }
  };

  // Check if user can ask a question
  const canAskQuestion = (): boolean => {
    if (isProUser()) {
      return true; // Unlimited questions for pro users
    }

    return subscriptionStatus.questionsUsed < subscriptionStatus.questionsLimit;
  };

  // Increment question count
  const incrementQuestionCount = async () => {
    if (!user) {
      console.log('[SubscriptionContext] No user found, skipping question count increment');
      return;
    }

    if (isProUser()) {
      console.log('[SubscriptionContext] Pro user detected, skipping question count increment');
      return;
    }

    try {
      console.log('[SubscriptionContext] Starting question count increment for user:', user.id);
      const { data: updatedSubscription, error } = await supabaseService.incrementQuestionCount(user.id);
      
      if (error) {
        console.error('[SubscriptionContext] ERROR incrementing question count:', error.message || error);
        // Still throw the error so the calling code can handle it
        throw error;
      }

      if (!updatedSubscription) {
        console.error('[SubscriptionContext] No subscription data returned from increment');
        throw new Error('No subscription data returned');
      }

      console.log('[SubscriptionContext] Successfully incremented question count to:', updatedSubscription.questions_used);

      setSubscriptionStatus(prev => ({
        ...prev,
        questionsUsed: updatedSubscription.questions_used,
        questionsLimit: updatedSubscription.questions_limit || 3,
      }));

      console.log('[SubscriptionContext] Updated local state - questions used:', updatedSubscription.questions_used);
    } catch (error) {
      console.error('[SubscriptionContext] CRITICAL ERROR incrementing question count:', error);
      // Re-throw so the UI can show an error message
      throw error;
    }
  };

  // Get remaining questions
  const getQuestionsRemaining = (): number => {
    if (isProUser()) {
      return -1; // Unlimited
    }

    return Math.max(0, subscriptionStatus.questionsLimit - subscriptionStatus.questionsUsed);
  };

  // Check if user is pro
  const isProUser = (): boolean => {
    // First check local subscription state
    if (subscriptionStatus.plan === 'pro_monthly' || subscriptionStatus.plan === 'pro_yearly') {
      return true;
    }

    // Check RevenueCat entitlements only
    if (customerInfo) {
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      return isPro;
    }

    return false;
  };

  // Purchase a package
  const purchasePackage = async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      console.log('[SubscriptionContext] Purchasing package:', pkg.identifier);
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(customerInfo);
      updateSubscriptionStatusFromCustomerInfo(customerInfo);
      
      // Update Supabase subscription status
      if (user) {
        await updateSupabaseSubscription(customerInfo);
      }
      
      return true;
    } catch (error: any) {
      console.error('[SubscriptionContext] Purchase error:', error);
      
      if (error.userCancelled) {
        console.log('[SubscriptionContext] User cancelled purchase');
        return false;
      }
      
      Alert.alert(
        'Purchase Failed',
        'There was an error processing your purchase. Please try again.'
      );
      return false;
    }
  };

  // Upgrade to a plan (for backward compatibility)
  const upgradeToPlan = (plan: SubscriptionPlan) => {
    console.log(`[SubscriptionContext] Upgrade to ${plan} requested`);
    // This will be handled by the PaywallModal now
  };

  // Restore purchases
  const restorePurchases = async (): Promise<void> => {
    try {
      console.log('[SubscriptionContext] Restoring purchases');
      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);
      updateSubscriptionStatusFromCustomerInfo(customerInfo);
    } catch (error) {
      console.error('[SubscriptionContext] Error restoring purchases:', error);
      throw new Error('Failed to restore purchases');
    }
  };

  // Manual refresh subscription data (useful for debugging)
  const refreshSubscription = async (): Promise<void> => {
    try {
      console.log('[SubscriptionContext] Manual subscription refresh started');
      setIsLoading(true);
      
      // Clear cache and get fresh data
      await Purchases.invalidateCustomerInfoCache();
      
      // Wait a moment for cache to clear
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to sync with RevenueCat servers
      await Purchases.syncPurchases();
      
      const customerInfo = await Purchases.getCustomerInfo();
      
      console.log('[SubscriptionContext] Fresh customer info retrieved');
      setCustomerInfo(customerInfo);
      updateSubscriptionStatusFromCustomerInfo(customerInfo);
      
      // Also reload from database
      if (user) {
        await loadSubscriptionFromDatabase();
      }
      
      console.log('[SubscriptionContext] Manual subscription refresh completed');
    } catch (error) {
      console.error('[SubscriptionContext] Error refreshing subscription:', error);
      throw new Error('Failed to refresh subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset RevenueCat user completely (for testing only)
  const resetRevenueCatUser = async (): Promise<void> => {
    try {
      console.log('[SubscriptionContext] Resetting RevenueCat user...');
      setIsLoading(true);
      
      // Generate a new anonymous user ID
      const newUserId = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('[SubscriptionContext] Switching to new user ID:', newUserId);
      
      // Clear all caches first
      console.log('[SubscriptionContext] Clearing all caches...');
      await Purchases.invalidateCustomerInfoCache();
      
      // Try to sync any pending purchases first
      try {
        await Purchases.syncPurchases();
      } catch (syncError) {
        console.log('[SubscriptionContext] Sync error (expected):', syncError);
      }
      
      // Switch to new user (this clears all cached data)
      await Purchases.logIn(newUserId);
      
      // Wait a moment for the switch to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear cache again after user switch
      await Purchases.invalidateCustomerInfoCache();
      
      // Get fresh customer info for new user
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('[SubscriptionContext] New user customer info:', JSON.stringify({
        activeSubscriptions: customerInfo.activeSubscriptions,
        entitlements: Object.keys(customerInfo.entitlements.active),
        originalAppUserId: customerInfo.originalAppUserId
      }, null, 2));
      
      setCustomerInfo(customerInfo);
      updateSubscriptionStatusFromCustomerInfo(customerInfo);
      
      // Reset local subscription state to free
      setSubscriptionStatus({
        plan: 'free',
        questionsUsed: 0,
        questionsLimit: 3,
        trialEndsAt: null,
        isActive: false,
        billingPeriodEnd: null,
      });
      
      console.log('[SubscriptionContext] RevenueCat user reset completed - should now be free user');
    } catch (error) {
      console.error('[SubscriptionContext] Error resetting RevenueCat user:', error);
      throw new Error('Failed to reset RevenueCat user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        canAskQuestion,
        incrementQuestionCount,
        getQuestionsRemaining,
        upgradeToPlan,
        restorePurchases,
        isProUser,
        offerings,
        customerInfo,
        purchasePackage,
        refreshSubscription,
        resetRevenueCatUser,
        isLoading,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

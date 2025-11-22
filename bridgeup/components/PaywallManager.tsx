import React, { useState, useEffect } from 'react';
import PaywallVariantA from './PaywallVariantA';
import PaywallVariantB from './PaywallVariantB';
import PaywallVariantC from './PaywallVariantC';
import ExitIntentPaywall from './ExitIntentPaywall';

interface PaywallManagerProps {
  visible: boolean;
  onClose: () => void;
  variant?: 'A' | 'B' | 'C' | 'auto'; // 'auto' will use A/B testing
}

type PaywallVariant = 'A' | 'B' | 'C';

// Global counter to cycle variants on each paywall open
let globalVariantCounter = 0;

export default function PaywallManager({ visible, onClose, variant = 'auto' }: PaywallManagerProps) {
  const [selectedVariant, setSelectedVariant] = useState<PaywallVariant>('A');
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [hasShownExitIntent, setHasShownExitIntent] = useState(false);

  // A/B Test Logic - Revenue Cat will handle this in production
  useEffect(() => {
    if (variant === 'auto' && visible) {
      // For testing: cycle through variants on each paywall open
      // In production, use consistent user ID for stable assignment
      const variants: PaywallVariant[] = ['A', 'B', 'C'];
      
      // Increment counter each time paywall opens
      const variantIndex = globalVariantCounter % variants.length;
      const assignedVariant = variants[variantIndex];
      globalVariantCounter++;
      
      setSelectedVariant(assignedVariant);
      
      // Log for analytics
      logPaywallEvent('paywall_variant_assigned', assignedVariant, { 
        variant_index: variantIndex,
        counter: globalVariantCounter - 1,
        testing_mode: true 
      });
      console.log(`[PaywallManager] 🎯 A/B Test - Variant ${assignedVariant} assigned (${variantIndex + 1}/3)`);
      console.log(`[PaywallManager] 📊 Next paywall will show: ${variants[(globalVariantCounter) % variants.length]}`);
    } else if (variant !== 'auto') {
      setSelectedVariant(variant);
    }
  }, [variant, visible]);

  // Log paywall view when it becomes visible
  useEffect(() => {
    if (visible && !showExitIntent) {
      logPaywallEvent('paywall_viewed', selectedVariant, {
        timestamp: new Date().toISOString(),
        variant: selectedVariant
      });
    }
  }, [visible, showExitIntent, selectedVariant]);

  const handleMainPaywallClose = () => {
    if (!hasShownExitIntent) {
      // Show exit-intent paywall on first close attempt
      setHasShownExitIntent(true);
      setShowExitIntent(true);
      
      // Log exit-intent trigger for analytics
      logPaywallEvent('exit_intent_triggered', selectedVariant, {
        main_variant: selectedVariant,
        timestamp: new Date().toISOString()
      });
      console.log('[PaywallManager] Exit-intent paywall triggered');
    } else {
      // Really close if they've already seen exit intent
      logPaywallEvent('paywall_dismissed', selectedVariant, {
        had_exit_intent: true
      });
      onClose();
    }
  };

  const handleExitIntentClose = () => {
    setShowExitIntent(false);
    // User purchased from exit-intent, close everything
    logPaywallEvent('exit_intent_purchase_completed', selectedVariant, {
      main_variant: selectedVariant,
      exit_intent_variant: 'discount_50'
    });
    onClose();
  };

  const handleFinalExit = () => {
    setShowExitIntent(false);
    onClose();
    // Log conversion event for failed exit-intent
    logPaywallEvent('exit_intent_dismissed', selectedVariant, {
      main_variant: selectedVariant,
      conversion: false
    });
    console.log('[PaywallManager] User exited without purchasing after exit-intent');
  };

  // Render the appropriate paywall variant
  const renderMainPaywall = () => {
    switch (selectedVariant) {
      case 'A':
        return (
          <PaywallVariantA
            visible={visible && !showExitIntent}
            onClose={handleMainPaywallClose}
          />
        );
      case 'B':
        return (
          <PaywallVariantB
            visible={visible && !showExitIntent}
            onClose={handleMainPaywallClose}
          />
        );
      case 'C':
        return (
          <PaywallVariantC
            visible={visible && !showExitIntent}
            onClose={handleMainPaywallClose}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderMainPaywall()}
      
      <ExitIntentPaywall
        visible={showExitIntent}
        onClose={handleExitIntentClose}
        onFinalExit={handleFinalExit}
      />
    </>
  );
}

// Analytics helper for tracking paywall performance
export const logPaywallEvent = (event: string, variant: PaywallVariant, additionalData?: any) => {
  const analyticsData = {
    variant,
    timestamp: new Date().toISOString(),
    event_type: 'paywall_analytics',
    app_version: '1.0.0',
    ...additionalData,
  };
  
  console.log(`[PaywallAnalytics] ${event}`, analyticsData);
  
  // TODO: In production, send to analytics service:
  // Example implementations:
  // 
  // Firebase Analytics:
  // analytics().logEvent(`paywall_${event}`, analyticsData);
  //
  // RevenueCat Analytics:
  // Purchases.logEvent(event, {
  //   paywall_variant: variant,
  //   ...additionalData
  // });
  //
  // Mixpanel:
  // mixpanel.track(`Paywall ${event}`, analyticsData);
};
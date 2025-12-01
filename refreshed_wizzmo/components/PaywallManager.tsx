import React, { useState, useEffect } from 'react';
import PaywallVariantA from './PaywallVariantA';
import PaywallVariantB from './PaywallVariantB';
import PaywallVariantC from './PaywallVariantC';

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
    if (visible) {
      logPaywallEvent('paywall_viewed', selectedVariant, {
        timestamp: new Date().toISOString(),
        variant: selectedVariant
      });
    }
  }, [visible, selectedVariant]);

  const handlePaywallClose = () => {
    logPaywallEvent('paywall_dismissed', selectedVariant);
    onClose();
  };

  // Render the appropriate paywall variant
  const renderPaywall = () => {
    switch (selectedVariant) {
      case 'A':
        return (
          <PaywallVariantA
            visible={visible}
            onClose={handlePaywallClose}
          />
        );
      case 'B':
        return (
          <PaywallVariantB
            visible={visible}
            onClose={handlePaywallClose}
          />
        );
      case 'C':
        return (
          <PaywallVariantC
            visible={visible}
            onClose={handlePaywallClose}
          />
        );
      default:
        return null;
    }
  };

  return renderPaywall();
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
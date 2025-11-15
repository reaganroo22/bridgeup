import React, { useState } from 'react';
import {
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSubscription, SubscriptionPlan } from '@/contexts/SubscriptionContext';

interface PaywallVariantAProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaywallVariantA({ visible, onClose }: PaywallVariantAProps) {
  const { purchasePackage, offerings } = useSubscription();
  
  // Debug RevenueCat offerings
  console.log('[PaywallVariantA] Offerings:', offerings);
  console.log('[PaywallVariantA] Offerings length:', offerings?.length);
  if (offerings?.[0]) {
    console.log('[PaywallVariantA] First offering packages:', offerings[0].availablePackages);
    offerings[0].availablePackages.forEach(pkg => {
      console.log('[PaywallVariantA] Package:', pkg.identifier, pkg.product.priceString);
    });
  }
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('wizzmo_monthly'); // Default to monthly
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async (plan: SubscriptionPlan) => {
    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Find the appropriate package from offerings
      const currentOffering = offerings?.[0];
      if (!currentOffering) {
        Alert.alert('Error', 'No subscription packages available');
        return;
      }

      const packageIdentifier = plan === 'wizzmo_monthly' ? '$rc_monthly' : '$rc_annual';
      const selectedPackage = currentOffering.availablePackages.find(
        pkg => pkg.identifier === packageIdentifier
      );

      if (!selectedPackage) {
        Alert.alert('Error', 'Selected subscription package not found');
        return;
      }

      const success = await purchasePackage(selectedPackage);
      if (success) {
        onClose();
        Alert.alert('Welcome to Wizzmo Pro! 💕', 'You now have unlimited access to dating advice from college girls!');
      }
    } catch (error) {
      console.error('[PaywallVariantA] Purchase error:', error);
      Alert.alert('Purchase Failed', 'Please try again or contact support.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <LinearGradient
        colors={['#FF4DB8', '#8B5CF6']}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Title */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>unlock unlimited spill 💅</Text>
              <Text style={styles.subtitle}>
                get dating advice from college girls who actually know what they're talking about
              </Text>
            </View>

            {/* Features */}
            <View style={styles.featuresSection}>
              <View style={styles.feature}>
                <Text style={styles.featureEmoji}>💬</Text>
                <Text style={styles.featureText}>unlimited questions & advice</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureEmoji}>⚡</Text>
                <Text style={styles.featureText}>priority responses from top wizzmos</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureEmoji}>🔥</Text>
                <Text style={styles.featureText}>exclusive dating masterclasses</Text>
              </View>
              {selectedPlan === 'wizzmo_annual' && (
                <>
                  <View style={styles.feature}>
                    <Text style={styles.featureEmoji}>👑</Text>
                    <Text style={styles.featureText}>VIP status & profile badge</Text>
                  </View>
                  <View style={styles.feature}>
                    <Text style={styles.featureEmoji}>💎</Text>
                    <Text style={styles.featureText}>exclusive premium wizzmo network</Text>
                  </View>
                  <View style={styles.feature}>
                    <Text style={styles.featureEmoji}>🎁</Text>
                    <Text style={styles.featureText}>monthly dating guides & templates</Text>
                  </View>
                </>
              )}
            </View>

            {/* Pricing - Monthly First */}
            <View style={styles.pricingSection}>
              <TouchableOpacity
                style={[styles.pricingCard, selectedPlan === 'wizzmo_monthly' && styles.selectedCard]}
                onPress={() => {
                  setSelectedPlan('wizzmo_monthly');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.planName}>starter</Text>
                  <View style={styles.basicBadge}>
                    <Text style={styles.basicText}>basic</Text>
                  </View>
                </View>
                <Text style={styles.planPrice}>
                  {offerings?.[0]?.availablePackages.find(pkg => pkg.identifier === '$rc_monthly')?.product.priceString || '$9.99'}
                </Text>
                <Text style={styles.planPer}>per month</Text>
                <Text style={styles.planFeatures}>unlimited advice + priority support</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pricingCard, styles.premiumCard, selectedPlan === 'wizzmo_annual' && styles.selectedCard]}
                onPress={() => {
                  setSelectedPlan('wizzmo_annual');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.planName, styles.premiumText]}>VIP pro</Text>
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>save 67%</Text>
                  </View>
                </View>
                <Text style={[styles.planPrice, styles.premiumPriceText]}>
                  {offerings?.[0]?.availablePackages.find(pkg => pkg.identifier === '$rc_annual')?.product.priceString || '$59.99'}
                </Text>
                <Text style={styles.planPer}>just $0.16/day</Text>
                <Text style={styles.planFeatures}>everything + VIP perks + exclusive content</Text>
              </TouchableOpacity>
            </View>

            {/* CTA */}
            <View style={styles.ctaSection}>
              <TouchableOpacity
                style={[styles.ctaButton, { opacity: isPurchasing ? 0.7 : 1 }]}
                onPress={() => handlePurchase(selectedPlan)}
                disabled={isPurchasing}
              >
                <View style={styles.ctaButtonBg}>
                  {isPurchasing ? (
                    <ActivityIndicator color="#FF4DB8" size="small" />
                  ) : (
                    <Text style={styles.ctaText}>start getting advice</Text>
                  )}
                </View>
              </TouchableOpacity>
              
              <Text style={styles.disclaimer}>
                cancel anytime • no commitment
              </Text>
            </View>

            {/* Bottom padding for scroll */}
            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  closeButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 0, // Brutalist - no rounded corners
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 32,
    paddingTop: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  
  // Title
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Features
  featuresSection: {
    marginBottom: 40,
    backgroundColor: 'transparent',
    alignItems: 'center',
    width: '100%',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Pricing
  pricingSection: {
    marginBottom: 40,
    gap: 16,
    backgroundColor: 'transparent',
    width: '100%',
  },
  pricingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 24,
    borderRadius: 0, // Brutalist - no rounded corners
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.02 }],
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF4DB8',
    textTransform: 'lowercase',
  },
  savingsBadge: {
    backgroundColor: '#FF4DB8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 0, // Brutalist
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    marginBottom: 4,
  },
  planPer: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  planFeatures: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
    textTransform: 'lowercase',
  },
  basicBadge: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 0,
  },
  basicText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  premiumCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.95)',
    borderColor: '#FFD700',
    borderWidth: 4,
  },
  premiumText: {
    color: '#B45309',
  },
  premiumPriceText: {
    color: '#B45309',
  },

  // CTA
  ctaSection: {
    backgroundColor: 'transparent',
  },
  ctaButton: {
    marginBottom: 16,
  },
  ctaButtonBg: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 0, // Brutalist
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF4DB8',
    textTransform: 'lowercase',
  },
  disclaimer: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    textTransform: 'lowercase',
  },
});
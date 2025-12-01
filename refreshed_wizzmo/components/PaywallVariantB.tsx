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

interface PaywallVariantBProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaywallVariantB({ visible, onClose }: PaywallVariantBProps) {
  const { purchasePackage, offerings } = useSubscription();
  
  // Debug offerings
  console.log('[PaywallVariantB] Offerings:', offerings);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('wizzmo_monthly');
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async (plan: SubscriptionPlan) => {
    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
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
        Alert.alert('Welcome to Wizzmo Pro! 💕', 'You now have unlimited access to dating advice!');
      }
    } catch (error) {
      console.error('[PaywallVariantB] Purchase error:', error);
      Alert.alert('Purchase Failed', 'Please try again or contact support.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <LinearGradient
        colors={['#8B5CF6', '#6366F1']}
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
              <Text style={styles.title}>upgrade your dating game 💫</Text>
              <Text style={styles.subtitle}>
                get unlimited advice from college wizzmos who know what works
              </Text>
            </View>

            {/* Key Benefits */}
            <View style={styles.benefitsSection}>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>💬</Text>
                <Text style={styles.benefitText}>unlimited questions (vs 3 total free)</Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>💕</Text>
                <Text style={styles.benefitText}>comment & engage on all posts</Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>⚡</Text>
                <Text style={styles.benefitText}>priority responses & faster support</Text>
              </View>
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
                  <Text style={styles.planName}>monthly</Text>
                </View>
                <Text style={styles.planPrice}>
                  {offerings?.[0]?.availablePackages.find(pkg => pkg.identifier === '$rc_monthly')?.product.priceString || '$9.99'}
                </Text>
                <Text style={styles.planPer}>per month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pricingCard, selectedPlan === 'wizzmo_annual' && styles.selectedCard]}
                onPress={() => {
                  setSelectedPlan('wizzmo_annual');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.planName}>yearly</Text>
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>save $40</Text>
                  </View>
                </View>
                <Text style={styles.planPrice}>
                  {offerings?.[0]?.availablePackages.find(pkg => pkg.identifier === '$rc_annual')?.product.priceString || '$59.99'} per year
                </Text>
                <Text style={styles.planPer}>best value</Text>
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
                    <ActivityIndicator color="#8B5CF6" size="small" />
                  ) : (
                    <Text style={styles.ctaText}>get unlimited access</Text>
                  )}
                </View>
              </TouchableOpacity>
              
              <Text style={styles.disclaimer}>
                cancel anytime • instant access
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
    borderRadius: 0,
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

  // Benefits
  benefitsSection: {
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  benefitText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Pricing
  pricingSection: {
    marginBottom: 40,
    gap: 16,
    backgroundColor: 'transparent',
  },
  pricingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 24,
    borderRadius: 0,
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
    color: '#8B5CF6',
    textTransform: 'lowercase',
  },
  savingsBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 0,
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
    borderRadius: 0,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
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
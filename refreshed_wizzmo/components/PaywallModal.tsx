import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSubscription, SubscriptionPlan } from '@/contexts/SubscriptionContext';
import { PurchasesPackage } from 'react-native-purchases';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: SubscriptionPlan;
  name: string;
  price: string;
  period: string;
  savings?: string;
  features: PlanFeature[];
  isPopular?: boolean;
  package?: PurchasesPackage;
}

export default function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { offerings, purchasePackage, isLoading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('pro_yearly');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
    }
  }, [visible, fadeAnim, slideAnim]);

  // Convert RevenueCat offerings to our plan structure
  useEffect(() => {
    if (!offerings || offerings.length === 0) {
      // Fallback to static plans if RevenueCat not configured
      setPlans([
        {
          id: 'free',
          name: 'free trial',
          price: '$0',
          period: 'forever',
          features: [
            { text: '3 questions total', included: true },
            { text: 'access to wizzmos', included: true },
            { text: 'unlimited questions', included: false },
            { text: 'priority matching', included: false },
            { text: 'ad-free experience', included: false },
          ],
        },
        {
          id: 'wizzmo_monthly',
          name: 'pro monthly',
          price: '$9.99',
          period: '/month',
          features: [
            { text: 'unlimited questions', included: true },
            { text: 'priority matching', included: true },
            { text: 'faster response times', included: true },
            { text: 'ad-free experience', included: true },
            { text: 'ad-free experience', included: true },
          ],
        },
        {
          id: 'wizzmo_annual',
          name: 'pro yearly',
          price: '$59.99 per year',
          period: '/year',
          savings: 'save $40',
          isPopular: true,
          features: [
            { text: 'unlimited questions', included: true },
            { text: 'priority matching', included: true },
            { text: 'faster response times', included: true },
            { text: 'ad-free experience', included: true },
            { text: 'ad-free experience', included: true },
          ],
        },
      ]);
      return;
    }

    // Map RevenueCat offerings to plans
    const dynamicPlans: Plan[] = [
      {
        id: 'free',
        name: 'free trial',
        price: '$0',
        period: 'forever',
        features: [
          { text: '3 questions total', included: true },
          { text: 'access to wizzmos', included: true },
          { text: 'unlimited questions', included: false },
          { text: 'priority matching', included: false },
          { text: 'ad-free experience', included: false },
        ],
      },
    ];

    // Find the main offering - try multiple patterns to be flexible
    const mainOffering = offerings.find(o => 
      o.identifier === 'wizzmo default' ||
      o.identifier === 'default' || 
      o.identifier.toLowerCase().includes('default') ||
      o.identifier.toLowerCase().includes('main') ||
      o.identifier.toLowerCase().includes('wizzmo') ||
      offerings.length === 1
    ) || offerings[0];

    if (mainOffering && mainOffering.availablePackages) {
      mainOffering.availablePackages.forEach(pkg => {
        const packageId = pkg.identifier.toLowerCase();
        let planId: SubscriptionPlan;
        let name: string;
        let period: string;
        let savings: string | undefined;
        let isPopular = false;

        if (packageId.includes('monthly') || packageId === '$rc_monthly') {
          planId = 'pro_monthly';
          name = 'pro monthly';
          period = '/month';
        } else if (packageId.includes('annual') || packageId.includes('yearly') || packageId === '$rc_annual') {
          planId = 'pro_yearly';
          name = 'pro yearly';
          period = '/year';
          savings = 'save $40';
          isPopular = true;
        } else {
          // Default to monthly for unknown packages
          planId = 'pro_monthly';
          name = pkg.storeProduct.title || 'premium';
          period = '/month';
        }

        dynamicPlans.push({
          id: planId,
          name,
          price: pkg.product.priceString,
          period,
          savings,
          isPopular,
          package: pkg,
          features: [
            { text: 'unlimited questions', included: true },
            { text: 'priority matching', included: true },
            { text: 'faster response times', included: true },
            { text: 'ad-free experience', included: true },
          ],
        });
      });
    }

    setPlans(dynamicPlans);
  }, [offerings]);

  const handleSelectPlan = (planId: SubscriptionPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPlan(planId);
  };

  const handleChoosePlan = async (planId: SubscriptionPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (planId === 'free') {
      Alert.alert(
        'already on free trial!',
        'you already have access to the free trial. upgrade to pro for unlimited questions! 💕'
      );
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan?.package) {
      Alert.alert(
        'error',
        'unable to find subscription package. please try again.'
      );
      return;
    }

    setIsPurchasing(true);

    try {
      const success = await purchasePackage(plan.package);
      
      if (success) {
        onClose();
        Alert.alert(
          'welcome to pro! 💕',
          'you now have unlimited questions and priority matching! ✨'
        );
      }
    } catch (error) {
      console.error('[PaywallModal] Purchase error:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const openTermsAndConditions = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://wizzmo.app/terms-of-service');
    } catch (error) {
      console.error('Error opening terms and conditions:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[styles.modalContent, { backgroundColor: colors.background, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          {/* Header */}
          <LinearGradient
            colors={colors.gradientPrimary}
            style={styles.header}
          >
            <View style={[styles.headerContent, { backgroundColor: 'transparent' }]}>
              <Text style={styles.headerTitle}>upgrade to pro</Text>
              <Text style={styles.headerSubtitle}>
                unlock unlimited advice & priority support
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Loading State */}
            {(isLoading || plans.length === 0) && (
              <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                  loading subscription plans...
                </Text>
              </View>
            )}

            {/* Plans */}
            {plans.length > 0 && (
              <View style={[styles.plansContainer, { backgroundColor: colors.background }]}>
                {plans.map((plan, index) => (
                <Animated.View
                  key={plan.id}
                  style={{
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }]
                  }}
                >
                  <Pressable
                    onPress={() => handleSelectPlan(plan.id)}
                    style={({ pressed }) => [
                      styles.planCard,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: selectedPlan === plan.id ? colors.primary : colors.border,
                        borderWidth: selectedPlan === plan.id ? 3 : 1,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    {plan.isPopular && (
                      <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.popularText}>most popular ✨</Text>
                      </View>
                    )}

                    <View style={[styles.planHeader, { backgroundColor: 'transparent' }]}>
                      <View style={{ backgroundColor: 'transparent' }}>
                        <Text style={[styles.planName, { color: colors.text }]}>
                          {plan.name}
                        </Text>
                        <View style={[styles.priceRow, { backgroundColor: 'transparent' }]}>
                          <Text style={[styles.planPrice, { color: colors.text }]}>
                            {plan.price}
                          </Text>
                          <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>
                            {plan.period}
                          </Text>
                        </View>
                        {plan.savings && (
                          <View style={[styles.savingsBadge, { backgroundColor: colors.success }]}>
                            <Text style={styles.savingsText}>{plan.savings}</Text>
                          </View>
                        )}
                      </View>

                      {selectedPlan === plan.id && (
                        <Animated.View style={{ opacity: fadeAnim }}>
                          <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
                        </Animated.View>
                      )}
                    </View>

                    <View style={[styles.featuresContainer, { backgroundColor: 'transparent' }]}>
                      {plan.features.map((feature, idx) => (
                        <View
                          key={idx}
                          style={[styles.featureRow, { backgroundColor: 'transparent' }]}
                        >
                          <Ionicons
                            name={feature.included ? 'checkmark' : 'close'}
                            size={18}
                            color={feature.included ? colors.success : colors.textTertiary}
                            style={styles.featureIcon}
                          />
                          <Text
                            style={[
                              styles.featureText,
                              {
                                color: feature.included ? colors.text : colors.textTertiary,
                                textDecorationLine: feature.included ? 'none' : 'line-through',
                              },
                            ]}
                          >
                            {feature.text}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {plan.id !== 'free' && (
                      <TouchableOpacity
                        style={[styles.choosePlanButton, { opacity: isPurchasing ? 0.7 : 1 }]}
                        onPress={() => handleChoosePlan(plan.id)}
                        disabled={isPurchasing}
                      >
                        <LinearGradient
                          colors={colors.gradientPrimary}
                          style={styles.choosePlanGradient}
                        >
                          {isPurchasing && selectedPlan === plan.id ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.choosePlanText}>
                              {selectedPlan === plan.id ? 'choose this plan' : 'select plan'}
                            </Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </Pressable>
                </Animated.View>
              ))}
            </View>
            )}

            {/* Footer Info */}
            <View style={[styles.footer, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                subscriptions auto-renew unless cancelled 24 hours before period ends. manage in
                app store settings.
              </Text>
              <TouchableOpacity onPress={openTermsAndConditions}>
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  terms & conditions
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '95%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    overflow: 'hidden',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    position: 'relative',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: -0.2,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    letterSpacing: -0.2,
  },
  plansContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },
  planCard: {
    borderRadius: 0,
    padding: 20,
    position: 'relative',
    marginBottom: 16,
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  planPeriod: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  savingsBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
    marginTop: 4,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
    flex: 1,
  },
  choosePlanButton: {
    borderRadius: 0,
    overflow: 'hidden',
    marginTop: 8,
  },
  choosePlanGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  choosePlanText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 12,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

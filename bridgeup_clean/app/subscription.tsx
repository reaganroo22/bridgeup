import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
  Animated,
} from 'react-native';
import PaywallModal from '@/components/PaywallModal';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSubscription } from '@/contexts/SubscriptionContext';
import CustomHeader from '@/components/CustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FAQItem {
  question: string;
  answer: string;
}

export default function SubscriptionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;
  const fadeAnim5 = useRef(new Animated.Value(0)).current;
  const fadeAnim6 = useRef(new Animated.Value(0)).current;
  const fadeAnim7 = useRef(new Animated.Value(0)).current;
  
  const slideAnim1 = useRef(new Animated.Value(50)).current;
  const slideAnim2 = useRef(new Animated.Value(50)).current;
  const slideAnim3 = useRef(new Animated.Value(50)).current;
  const slideAnim4 = useRef(new Animated.Value(50)).current;
  const slideAnim5 = useRef(new Animated.Value(50)).current;
  const slideAnim6 = useRef(new Animated.Value(50)).current;
  const slideAnim7 = useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(fadeAnim1, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim1, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim2, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim2, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim3, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim3, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim4, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim4, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim5, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim5, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim6, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim6, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(fadeAnim7, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(slideAnim7, { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);
  const { subscriptionStatus, restorePurchases, isProUser, getQuestionsRemaining } = useSubscription();

  const handleManageSubscription = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (Platform.OS === 'ios') {
      // iOS: Open App Store subscription management
      const url = 'https://apps.apple.com/account/subscriptions';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Manage Subscription',
          'To manage your subscription:\n\n1. Open Settings app\n2. Tap your name at the top\n3. Tap "Subscriptions"\n4. Find Wizzmo and tap it'
        );
      }
    } else {
      // Android: Open Google Play subscription management
      const url = 'https://play.google.com/store/account/subscriptions';
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Manage Subscription',
          'To manage your subscription:\n\n1. Open Google Play Store\n2. Tap your profile icon\n3. Tap "Payments & subscriptions"\n4. Tap "Subscriptions"\n5. Find Wizzmo and tap it'
        );
      }
    }
  };
  const insets = useSafeAreaInsets();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const faqs: FAQItem[] = [
    {
      question: 'what happens after my free trial?',
      answer: 'after your 3 free questions, you can upgrade to pro for unlimited questions! your free questions don\'t reset - you get 3 total.',
    },
    {
      question: 'can i cancel anytime?',
      answer: 'yes babe! cancel anytime from your app store settings. you\'ll keep pro access until the end of your billing period.',
    },
    {
      question: 'what\'s included in pro?',
      answer: 'unlimited questions, priority matching with wizzmos, faster response times, and an ad-free experience! ✨',
    },
    {
      question: 'do my questions reset?',
      answer: 'free users get 3 questions total, then you can upgrade to pro for unlimited questions all the time!',
    },
    {
      question: 'can i switch plans?',
      answer: 'absolutely! upgrade from monthly to yearly (or vice versa) anytime. your new plan starts when your current period ends.',
    },
    {
      question: 'how do i restore my purchases?',
      answer: 'tap the "restore purchases" button below! this will check your app store for any active subscriptions and sync them with your account.',
    },
  ];

  const comparisons = [
    { feature: 'total questions', free: '3 total', pro: 'unlimited' },
    { feature: 'response time', free: '5-15 min', pro: '2-5 min' },
    { feature: 'priority matching', free: false, pro: true },
    { feature: 'ad-free', free: false, pro: true },
  ];

  const handleRestorePurchases = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await restorePurchases();
      Alert.alert(
        'purchases restored! ✨',
        'we checked your app store and everything is synced up!'
      );
    } catch (error) {
      Alert.alert(
        'no purchases found',
        'we couldn\'t find any active subscriptions. if you think this is wrong, contact support!'
      );
    }
  };

  const handleContactSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('mailto:support@wizzmo.com?subject=Subscription Help');
  };

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPaywall(true);
  };

  const toggleFAQ = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'n/a';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <CustomHeader
        title="subscription"
        showBackButton={true}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 60 }} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Plan Status */}
          <Animated.View style={{ opacity: fadeAnim1, transform: [{ translateY: slideAnim1 }] }}>
            <View style={[styles.statusCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <LinearGradient
                colors={isProUser() ? colors.gradientPrimary : ['#71717A', '#3F3F46']}
                style={styles.statusGradient}
              >
                <View style={[styles.statusContent, { backgroundColor: 'transparent' }]}>
                  <Text style={styles.statusLabel}>current plan</Text>
                  <Text style={styles.statusPlan}>
                    {isProUser() ? (
                      subscriptionStatus.plan === 'pro_monthly' ? 'wizzmo pro monthly' :
                      subscriptionStatus.plan === 'pro_yearly' ? 'wizzmo pro yearly' :
                      'wizzmo pro'
                    ) : 'free trial'}
                  </Text>
                </View>
              </LinearGradient>

              <View style={[styles.statusDetails, { backgroundColor: 'transparent' }]}>
                {!isProUser() ? (
                  <>
                    <View style={[styles.statusRow, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.statusDetailLabel, { color: colors.textSecondary }]}>
                        questions remaining
                      </Text>
                      <Text style={[styles.statusDetailValue, { color: colors.text }]}>
                        {getQuestionsRemaining() === -1 ? 'unlimited' : `${getQuestionsRemaining()} / ${subscriptionStatus.questionsLimit}`}
                      </Text>
                    </View>
                    <View style={[styles.statusRow, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.statusDetailLabel, { color: colors.textSecondary }]}>
                        resets
                      </Text>
                      <Text style={[styles.statusDetailValue, { color: colors.text }]}>
                        next month
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={[styles.statusRow, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.statusDetailLabel, { color: colors.textSecondary }]}>
                        status
                      </Text>
                      <Text style={[styles.statusDetailValue, { color: colors.success }]}>
                        active ✨
                      </Text>
                    </View>
                    <View style={[styles.statusRow, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.statusDetailLabel, { color: colors.textSecondary }]}>
                        questions
                      </Text>
                      <Text style={[styles.statusDetailValue, { color: colors.primary }]}>
                        unlimited ∞
                      </Text>
                    </View>
                    <View style={[styles.statusRow, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.statusDetailLabel, { color: colors.textSecondary }]}>
                        renews on
                      </Text>
                      <Text style={[styles.statusDetailValue, { color: colors.text }]}>
                        {formatDate(subscriptionStatus.billingPeriodEnd)}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {!isProUser() && (
                <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                  <LinearGradient colors={colors.gradientPrimary} style={styles.upgradeGradient}>
                    <Text style={styles.upgradeButtonText}>upgrade to pro ✨</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Plan Change Suggestion */}
          {isProUser() && (
            <Animated.View style={{ opacity: fadeAnim2, transform: [{ translateY: slideAnim2 }] }}>
              {subscriptionStatus.plan === 'pro_monthly' ? (
                <View style={[styles.savingsCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    style={styles.savingsGradient}
                  >
                    <View style={[styles.savingsContent, { backgroundColor: 'transparent' }]}>
                      <View style={{ backgroundColor: 'transparent' }}>
                        <Text style={styles.savingsTitle}>save 50% with annual ✨</Text>
                        <Text style={styles.savingsSubtitle}>
                          switch to yearly and save $59.89 annually
                        </Text>
                      </View>
                      <Ionicons name="trending-up" size={24} color="#FFFFFF" />
                    </View>
                  </LinearGradient>
                  
                  <View style={[styles.savingsDetails, { backgroundColor: 'transparent' }]}>
                    <View style={[styles.savingsRow, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.savingsLabel, { color: colors.textSecondary }]}>
                        current: monthly
                      </Text>
                      <Text style={[styles.savingsValue, { color: colors.text }]}>
                        $9.99/month ($119.88/year)
                      </Text>
                    </View>
                    <View style={[styles.savingsRow, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.savingsLabel, { color: colors.textSecondary }]}>
                        annual plan
                      </Text>
                      <Text style={[styles.savingsValue, { color: colors.primary }]}>
                        $59.99/year ($4.99/month)
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.changePlanButton} onPress={handleUpgrade}>
                    <LinearGradient colors={colors.gradientPrimary} style={styles.changePlanGradient}>
                      <Text style={styles.changePlanText}>switch to annual</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.savingsCard, { backgroundColor: colors.surfaceElevated, borderColor: '#10B981' }]}>
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    style={styles.savingsGradient}
                  >
                    <View style={[styles.savingsContent, { backgroundColor: 'transparent' }]}>
                      <View style={{ backgroundColor: 'transparent' }}>
                        <Text style={styles.savingsTitle}>you're saving 50% ✨</Text>
                        <Text style={styles.savingsSubtitle}>
                          annual plan - great choice!
                        </Text>
                      </View>
                      <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    </View>
                  </LinearGradient>
                  
                  <View style={[styles.savingsDetails, { backgroundColor: 'transparent' }]}>
                    <View style={[styles.savingsRow, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.savingsLabel, { color: colors.textSecondary }]}>
                        your annual plan
                      </Text>
                      <Text style={[styles.savingsValue, { color: '#10B981' }]}>
                        $59.99/year ($4.99/month)
                      </Text>
                    </View>
                    <View style={[styles.savingsRow, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.savingsLabel, { color: colors.textSecondary }]}>
                        vs monthly
                      </Text>
                      <Text style={[styles.savingsValue, { color: colors.text }]}>
                        $119.88/year ($9.99/month)
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {/* Change Plan Section for All Pro Users */}
          {isProUser() && (
            <Animated.View style={{ opacity: fadeAnim3, transform: [{ translateY: slideAnim3 }] }}>
              <View style={[styles.changePlanSection, { backgroundColor: 'transparent' }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  manage plan
                </Text>
                
                <View style={[styles.managePlanCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={[styles.managePlanRow, { backgroundColor: 'transparent', borderBottomColor: colors.separator }]}>
                    <View style={[styles.managePlanInfo, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.managePlanTitle, { color: colors.text }]}>
                        change plan
                      </Text>
                      <Text style={[styles.managePlanSubtitle, { color: colors.textSecondary }]}>
                        switch between monthly and yearly
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.managePlanButton, { backgroundColor: colors.primary }]}
                      onPress={handleUpgrade}
                    >
                      <Text style={styles.managePlanButtonText}>change</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[styles.managePlanRow, { backgroundColor: 'transparent', borderBottomWidth: 0 }]}
                    onPress={handleManageSubscription}
                  >
                    <View style={[styles.managePlanInfo, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.managePlanTitle, { color: colors.text }]}>
                        app store settings
                      </Text>
                      <Text style={[styles.managePlanSubtitle, { color: colors.textSecondary }]}>
                        cancel or modify subscription
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          )}

          {/* Plan Comparison */}
          <Animated.View style={{ opacity: fadeAnim4, transform: [{ translateY: slideAnim4 }] }}>
            <View style={[styles.section, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                plan comparison
              </Text>

              <View style={[styles.comparisonCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                {/* Header */}
                <View style={[styles.comparisonHeader, { backgroundColor: 'transparent', borderBottomColor: colors.border }]}>
                  <Text style={[styles.comparisonHeaderText, { color: colors.textSecondary }]}>
                    feature
                  </Text>
                  <Text style={[styles.comparisonHeaderText, { color: colors.textSecondary }]}>
                    free
                  </Text>
                  <Text style={[styles.comparisonHeaderText, { color: colors.textSecondary }]}>
                    pro
                  </Text>
                </View>

                {/* Rows */}
                {comparisons.map((item, index) => (
                  <View
                    key={index}
                    style={[
                      styles.comparisonRow,
                      { backgroundColor: 'transparent', borderBottomColor: colors.separator },
                      index === comparisons.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <Text style={[styles.comparisonFeature, { color: colors.text }]}>
                      {item.feature}
                    </Text>
                    <View style={[styles.comparisonValue, { backgroundColor: 'transparent' }]}>
                      {typeof item.free === 'boolean' ? (
                        <Ionicons
                          name={item.free ? 'checkmark' : 'close'}
                          size={18}
                          color={item.free ? colors.success : colors.textTertiary}
                        />
                      ) : (
                        <Text style={[styles.comparisonValueText, { color: colors.textSecondary }]}>
                          {item.free}
                        </Text>
                      )}
                    </View>
                    <View style={[styles.comparisonValue, { backgroundColor: 'transparent' }]}>
                      {typeof item.pro === 'boolean' ? (
                        <Ionicons
                          name={item.pro ? 'checkmark' : 'close'}
                          size={18}
                          color={item.pro ? colors.success : colors.textTertiary}
                        />
                      ) : (
                        <Text style={[styles.comparisonValueText, { color: colors.text }]}>
                          {item.pro}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* FAQ Section */}
          <Animated.View style={{ opacity: fadeAnim5, transform: [{ translateY: slideAnim5 }] }}>
            <View style={[styles.section, { backgroundColor: 'transparent' }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                frequently asked questions
              </Text>

              {faqs.map((faq, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.faqCard,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                      marginBottom: 12,
                    },
                  ]}
                  onPress={() => toggleFAQ(index)}
                >
                  <View style={[styles.faqHeader, { backgroundColor: 'transparent' }]}>
                    <Text style={[styles.faqQuestion, { color: colors.text }]}>
                      {faq.question}
                    </Text>
                    <Ionicons
                      name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </View>

                  {expandedFAQ === index && (
                    <Animated.View
                      style={{ opacity: fadeAnim6, transform: [{ translateY: slideAnim6 }] }}
                      style={[styles.faqAnswer, { backgroundColor: 'transparent' }]}
                    >
                      <Text style={[styles.faqAnswerText, { color: colors.textSecondary }]}>
                        {faq.answer}
                      </Text>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Actions */}
          <Animated.View style={{ opacity: fadeAnim7, transform: [{ translateY: slideAnim7 }] }}>
            <View style={[styles.actionsSection, { backgroundColor: 'transparent' }]}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                onPress={handleRestorePurchases}
              >
                <Ionicons name="refresh" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>
                  restore purchases
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                onPress={handleContactSupport}
              >
                <Ionicons name="mail" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>
                  contact support
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Footer */}
          <View style={[styles.footer, { backgroundColor: 'transparent' }]}>
            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              subscriptions managed through app store
            </Text>
          </View>
        </ScrollView>
      </View>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statusCard: {
    borderRadius: 0,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  statusGradient: {
    padding: 20,
  },
  statusContent: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: -0.1,
    marginBottom: 8,
  },
  statusPlan: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  statusDetails: {
    padding: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  statusDetailValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  upgradeButton: {
    margin: 20,
    marginTop: 0,
    borderRadius: 0,
    overflow: 'hidden',
  },
  upgradeGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  comparisonCard: {
    borderRadius: 0,
    borderWidth: 1,
    overflow: 'hidden',
  },
  comparisonHeader: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  comparisonHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
    flex: 1,
    textAlign: 'center',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  comparisonFeature: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
  },
  comparisonValue: {
    flex: 1,
    alignItems: 'center',
  },
  comparisonValueText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  faqCard: {
    borderRadius: 0,
    borderWidth: 1,
    padding: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    marginTop: 12,
    paddingTop: 12,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  actionsSection: {
    marginBottom: 32,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 0,
    borderWidth: 1,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },

  // Savings Card
  savingsCard: {
    borderRadius: 0,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 24,
  },
  savingsGradient: {
    padding: 20,
  },
  savingsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  savingsSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
  savingsDetails: {
    padding: 20,
    paddingTop: 16,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savingsLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
  savingsValue: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    textTransform: 'lowercase',
  },
  changePlanButton: {
    margin: 20,
    marginTop: 0,
    borderRadius: 0,
    overflow: 'hidden',
  },
  changePlanGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  changePlanText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textTransform: 'lowercase',
  },

  // Manage Plan Section
  changePlanSection: {
    marginBottom: 32,
  },
  managePlanCard: {
    borderRadius: 0,
    borderWidth: 1,
    overflow: 'hidden',
  },
  managePlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  managePlanInfo: {
    flex: 1,
    marginRight: 16,
  },
  managePlanTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  managePlanSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
  managePlanButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 0,
  },
  managePlanButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
});

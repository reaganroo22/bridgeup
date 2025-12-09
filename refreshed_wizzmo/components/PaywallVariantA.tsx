import React, { useState, useEffect, useRef } from 'react';
import { GIRL_IMAGES } from '@/lib/imageService';
import {
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Text,
  View,
  ScrollView,
  Image,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSubscription, SubscriptionPlan } from '@/contexts/SubscriptionContext';

interface PaywallVariantAProps {
  visible?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PaywallVariantA({ visible = true, onClose, onSuccess }: PaywallVariantAProps) {
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
  const [showCloseButton, setShowCloseButton] = useState(false);

  // Animation values for subtle floating effect
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;

  // Show close button after 12 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowCloseButton(true);
    }, 12000); // 12 seconds

    return () => clearTimeout(timer);
  }, []);

  // Subtle floating animation for mentor photos
  useEffect(() => {
    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim1, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim1, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Offset second animation
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(floatAnim2, {
              toValue: 1,
              duration: 3500,
              useNativeDriver: true,
            }),
            Animated.timing(floatAnim2, {
              toValue: 0,
              duration: 3500,
              useNativeDriver: true,
            }),
          ])
        ).start();
      }, 1500);
    };

    if (visible) {
      startAnimation();
      
      // Preload images for faster display
      const imagesToPreload = [
        GIRL_IMAGES.girl2,
        GIRL_IMAGES.girl11, 
        GIRL_IMAGES.girl9,
        GIRL_IMAGES.girl5,
        GIRL_IMAGES.girl4,
        GIRL_IMAGES.girl12
      ];
      
      imagesToPreload.forEach(imageUri => {
        Image.prefetch(imageUri).catch(() => {
          // Ignore preload failures
        });
      });
    }
  }, [visible, floatAnim1, floatAnim2]);

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
        onSuccess ? onSuccess() : onClose();
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
          {showCloseButton && (
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Scrollable Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>

            {/* Title */}
            <View style={styles.titleSection}>
              <Text style={styles.title}>spill the tea with college girls 💅</Text>
              <Text style={styles.subtitle}>
            connect with wizzmos who've been through it all and are ready to share their honest experiences
              </Text>
            </View>

            {/* Features */}
            <View style={styles.featuresSection}>
              <View style={styles.feature}>
                <Text style={styles.featureEmoji}>💬</Text>
                <Text style={styles.featureText}>unlimited questions & advice</Text>
              </View>
              
              {/* First Girl Image - Between bullet points */}
              <View style={styles.featureMentorSection}>
                <Animated.View 
                  style={[
                    styles.featureMentorContainer,
                    {
                      transform: [{
                        translateY: floatAnim1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -6]
                        })
                      }]
                    }
                  ]}
                >
                  <Image 
                    source={{ uri: GIRL_IMAGES.girl2 }} 
                    style={styles.featureMentorPhoto}
                    defaultSource={require('@/assets/images/wizzmo.png')}
                    loadingIndicatorSource={require('@/assets/images/wizzmo.png')}
                  />
                  <View style={[styles.mentorBadge, styles.liveBadge]}>
                    <Text style={styles.badgeText}>online</Text>
                  </View>
                </Animated.View>
              </View>

              <View style={styles.feature}>
                <Text style={styles.featureEmoji}>⚡</Text>
                <Text style={styles.featureText}>priority responses from top wizzmos</Text>
              </View>

              {/* Second Girl Image - Between bullet points */}
              <View style={styles.featureMentorSection}>
                <Animated.View 
                  style={[
                    styles.featureMentorContainer,
                    {
                      transform: [{
                        translateY: floatAnim2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -8]
                        })
                      }]
                    }
                  ]}
                >
                  <Image 
                    source={{ uri: GIRL_IMAGES.girl11 }} 
                    style={styles.featureMentorPhoto}
                    defaultSource={require('@/assets/images/wizzmo.png')}
                    loadingIndicatorSource={require('@/assets/images/wizzmo.png')}
                  />
                  <View style={styles.mentorBadge}>
                    <Text style={styles.badgeText}>verified</Text>
                  </View>
                </Animated.View>
              </View>

              <View style={styles.feature}>
                <Text style={styles.featureEmoji}>🔥</Text>
                <Text style={styles.featureText}>exclusive dating masterclasses</Text>
              </View>

              {/* Girl9 Image - After exclusive dating masterclasses */}
              <View style={styles.featureMentorSection}>
                <Animated.View 
                  style={[
                    styles.featureMentorContainer,
                    {
                      transform: [{
                        translateY: floatAnim1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -5]
                        })
                      }]
                    }
                  ]}
                >
                  <Image 
                    source={{ uri: GIRL_IMAGES.girl9 }} 
                    style={styles.featureMentorPhoto}
                    defaultSource={require('@/assets/images/wizzmo.png')}
                    loadingIndicatorSource={require('@/assets/images/wizzmo.png')}
                  />
                  <View style={[styles.mentorBadge, styles.activeBadge]}>
                    <Text style={styles.badgeText}>expert</Text>
                  </View>
                </Animated.View>
              </View>

              {selectedPlan === 'wizzmo_annual' && (
                <>
                  <View style={styles.feature}>
                    <Text style={styles.featureEmoji}>👑</Text>
                    <Text style={styles.featureText}>VIP status & profile badge</Text>
                  </View>

                  {/* Third Girl Image - Premium feature separator */}
                  <View style={styles.featureMentorSection}>
                    <Animated.View 
                      style={[
                        styles.featureMentorContainer,
                        {
                          transform: [{
                            translateY: floatAnim1.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -4]
                            })
                          }]
                        }
                      ]}
                    >
                      <Image 
                        source={{ uri: GIRL_IMAGES.girl5 }} 
                        style={styles.featureMentorPhoto}
                        defaultSource={require('@/assets/images/wizzmo.png')}
                        loadingIndicatorSource={require('@/assets/images/wizzmo.png')}
                      />
                      <View style={[styles.mentorBadge, styles.activeBadge]}>
                        <Text style={styles.badgeText}>VIP</Text>
                      </View>
                    </Animated.View>
                  </View>

                  <View style={styles.feature}>
                    <Text style={styles.featureEmoji}>💎</Text>
                    <Text style={styles.featureText}>premium wizzmo mentorship circle</Text>
                  </View>

                  {/* Fourth Girl Image - Between premium features */}
                  <View style={styles.featureMentorSection}>
                    <Animated.View 
                      style={[
                        styles.featureMentorContainer,
                        {
                          transform: [{
                            translateY: floatAnim2.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -7]
                            })
                          }]
                        }
                      ]}
                    >
                      <Image 
                        source={{ uri: GIRL_IMAGES.girl4 }} 
                        style={styles.featureMentorPhoto}
                        defaultSource={require('@/assets/images/wizzmo.png')}
                        loadingIndicatorSource={require('@/assets/images/wizzmo.png')}
                      />
                      <View style={styles.mentorBadge}>
                        <Text style={styles.badgeText}>premium</Text>
                      </View>
                    </Animated.View>
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
                  handlePurchase('wizzmo_monthly');
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
                  handlePurchase('wizzmo_annual');
                }}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.planName, styles.premiumText]}>VIP pro</Text>
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>save 67%</Text>
                  </View>
                </View>
                <Text style={[styles.planPrice, styles.premiumPriceText]}>
                  {offerings?.[0]?.availablePackages.find(pkg => pkg.identifier === '$rc_annual')?.product.priceString || '$59.99'} per year
                </Text>
                <Text style={styles.planPer}>just $0.16/day</Text>
                <Text style={styles.planFeatures}>everything + VIP perks + exclusive content</Text>
              </TouchableOpacity>
            </View>

            {/* Girl10 Image - Near CTA for final conversion push */}
            <View style={styles.ctaMentorSection}>
              <Animated.View 
                style={[
                  styles.ctaMentorContainer,
                  {
                    transform: [{
                      translateY: floatAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -5]
                      })
                    }]
                  }
                ]}
              >
                <Image 
                  source={{ uri: GIRL_IMAGES.girl12 }} 
                  style={styles.ctaMentorPhoto}
                  defaultSource={require('@/assets/images/wizzmo.png')}
                  loadingIndicatorSource={require('@/assets/images/wizzmo.png')}
                />
                <View style={[styles.mentorBadge, styles.liveBadge]}>
                  <Text style={styles.badgeText}>ready to help</Text>
                </View>
              </Animated.View>
            </View>

            {/* CTA - Now handled by direct plan selection */}
            <View style={styles.ctaSection}>
              
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
  
  // Multiple Mentor Photos
  mentorPhotoSection: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  mentorGrid: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mentorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  mentorPhotoContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  mentorPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  mentorPhoto1: {
    transform: [{ rotate: '-8deg' }],
  },
  mentorPhoto2: {
    transform: [{ rotate: '12deg' }],
  },
  mentorPhoto3: {
    transform: [{ rotate: '6deg' }],
  },
  mentorPhoto4: {
    transform: [{ rotate: '-10deg' }],
  },
  mentorBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#FF4DB8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 0, // Brutalist
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  liveBadge: {
    backgroundColor: '#10B981',
  },
  activeBadge: {
    backgroundColor: '#F59E0B',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  mentorCount: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    textTransform: 'lowercase',
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

  // Feature Mentor Image
  featureMentorSection: {
    alignItems: 'center',
    marginVertical: 25,
    backgroundColor: 'transparent',
  },
  featureMentorContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  featureMentorPhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '15deg' }],
  },

  // Pricing Mentor Image
  pricingMentorSection: {
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  pricingMentorContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 10,
  },
  pricingMentorPhoto: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-12deg' }],
  },
  pricingMentorText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },

  // CTA Mentor Image
  ctaMentorSection: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'transparent',
  },
  ctaMentorContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  ctaMentorPhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '15deg' }],
    resizeMode: 'cover',
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
    borderColor: '#FF4DB8',
    borderWidth: 6,
    backgroundColor: '#FFFFFF',
    transform: [{ scale: 1.05 }],
    shadowColor: '#FF4DB8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1.0,
    shadowRadius: 20,
    elevation: 20,
    // Add a glowing pink outline effect
    shadowBlur: 25,
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
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text,
  View,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface ExitIntentPaywallProps {
  visible: boolean;
  onClose: () => void;
  onFinalExit: () => void;
}

export default function ExitIntentPaywall({ visible, onClose, onFinalExit }: ExitIntentPaywallProps) {
  const { purchasePackage, offerings } = useSubscription();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes
  const [promoPrice, setPromoPrice] = useState('$4.99');
  const [regularPrice, setRegularPrice] = useState('$9.99');
  
  const fadeAnim1 = useRef(new Animated.Value(0)).current;
  const fadeAnim2 = useRef(new Animated.Value(0)).current;
  const fadeAnim3 = useRef(new Animated.Value(0)).current;
  const fadeAnim4 = useRef(new Animated.Value(0)).current;
  const fadeAnim5 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.stagger(100, [
        Animated.timing(fadeAnim1, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim2, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim3, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim4, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim5, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim1.setValue(0);
      fadeAnim2.setValue(0);
      fadeAnim3.setValue(0);
      fadeAnim4.setValue(0);
      fadeAnim5.setValue(0);
    }
  }, [visible, fadeAnim1, fadeAnim2, fadeAnim3, fadeAnim4, fadeAnim5]);

  // Get pricing info from RevenueCat offerings
  useEffect(() => {
    if (offerings && offerings.length > 0) {
      const currentOffering = offerings.find(o => 
        o.identifier === 'wizzmo default' ||
        o.identifier === 'default' || 
        o.identifier.toLowerCase().includes('default') ||
        o.identifier.toLowerCase().includes('main') ||
        o.identifier.toLowerCase().includes('wizzmo') ||
        offerings.length === 1
      ) || offerings[0];

      const monthlyPackage = currentOffering?.availablePackages.find(
        pkg => pkg.identifier === '$rc_monthly'
      );

      if (monthlyPackage) {
        setRegularPrice(monthlyPackage.product.priceString);
        
        // Check for promotional offer pricing
        const promoOffer = monthlyPackage.product.discounts?.find(
          discount => discount.identifier === '3214353215241556'
        );
        
        if (promoOffer) {
          setPromoPrice(promoOffer.priceString);
        }
      }
    }
  }, [offerings]);

  // Countdown timer
  useEffect(() => {
    if (!visible) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinalExit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, onFinalExit]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      // Find the main offering (same logic as PaywallModal)
      const currentOffering = offerings?.find(o => 
        o.identifier === 'wizzmo default' ||
        o.identifier === 'default' || 
        o.identifier.toLowerCase().includes('default') ||
        o.identifier.toLowerCase().includes('main') ||
        o.identifier.toLowerCase().includes('wizzmo') ||
        offerings.length === 1
      ) || offerings?.[0];
      
      if (!currentOffering) {
        Alert.alert('Error', 'No subscription packages available');
        return;
      }

      const monthlyPackage = currentOffering.availablePackages.find(
        pkg => pkg.identifier === '$rc_monthly'
      );
      
      if (monthlyPackage) {
        // RevenueCat automatically applies promotional offers when available
        const success = await purchasePackage(monthlyPackage);
        if (success) {
          onClose();
          Alert.alert('Welcome to Wizzmo Pro! 💕', 'You now have unlimited advice access! 🎉');
        }
      } else {
        Alert.alert('Package Not Found', 'Unable to find the monthly subscription package.');
      }
    } catch (error) {
      console.error('[ExitIntentPaywall] Purchase error:', error);
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
          <TouchableOpacity onPress={onFinalExit} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Main Message */}
          <Animated.View style={[styles.messageSection, { opacity: fadeAnim1, transform: [{ translateY: fadeAnim1.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
            <Text style={styles.emoji}>💕</Text>
            <Text style={styles.title}>
              wait! special offer
            </Text>
            <Text style={styles.subtitle}>
              get your first month 50% off
            </Text>
          </Animated.View>

          {/* Timer */}
          <Animated.View style={[styles.timerSection, { opacity: fadeAnim2, transform: [{ translateY: fadeAnim2.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
            <Text style={styles.timerLabel}>
              offer expires in:
            </Text>
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </View>
          </Animated.View>

          {/* Price */}
          <Animated.View style={[styles.priceSection, { opacity: fadeAnim3, transform: [{ translateY: fadeAnim3.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.originalPrice}>{regularPrice}</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF80" />
                <Text style={styles.discountPrice}>{promoPrice}</Text>
              </View>
              <Text style={styles.priceDescription}>
                first month, then {regularPrice}/month
              </Text>
            </View>
          </Animated.View>

          {/* Features */}
          <Animated.View style={[styles.featuresSection, { opacity: fadeAnim4, transform: [{ translateY: fadeAnim4.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.featureText}>unlimited questions</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.featureText}>priority responses</Text>
            </View>
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.featureText}>ad-free experience</Text>
            </View>
          </Animated.View>

          {/* CTA */}
          <Animated.View style={[styles.ctaSection, { opacity: fadeAnim5, transform: [{ translateY: fadeAnim5.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
            <TouchableOpacity
              style={[styles.ctaButton, { opacity: isPurchasing ? 0.7 : 1 }]}
              onPress={handlePurchase}
              disabled={isPurchasing}
            >
              <View style={styles.ctaContent}>
                {isPurchasing ? (
                  <ActivityIndicator color="#FF4DB8" />
                ) : (
                  <>
                    <Text style={styles.ctaText}>claim 50% off ✨</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={onFinalExit} style={styles.skipButton}>
              <Text style={styles.skipText}>
                no thanks, I'll pay full price
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            auto-renews at {regularPrice}/month • cancel anytime
          </Text>
        </View>
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
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  messageSection: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle: {
    color: '#FFFFFF90',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  timerLabel: {
    color: '#FFFFFF80',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  timerContainer: {
    backgroundColor: '#FFFFFF20',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF30',
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 2,
  },
  priceSection: {
    marginBottom: 32,
    width: '100%',
  },
  priceCard: {
    backgroundColor: '#FFFFFF20',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF30',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  originalPrice: {
    color: '#FFFFFF60',
    fontSize: 24,
    fontWeight: '700',
    textDecorationLine: 'line-through',
  },
  discountPrice: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  priceDescription: {
    color: '#FFFFFF80',
    fontSize: 14,
    fontWeight: '500',
  },
  featuresSection: {
    marginBottom: 40,
    gap: 12,
    backgroundColor: 'transparent',
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  ctaSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  ctaButton: {
    width: '100%',
    marginBottom: 16,
  },
  ctaContent: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FF4DB8',
    fontSize: 18,
    fontWeight: '800',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  skipText: {
    color: '#FFFFFF60',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  disclaimer: {
    color: '#FFFFFF60',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
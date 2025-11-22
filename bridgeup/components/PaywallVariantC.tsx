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

interface PaywallVariantCProps {
  visible: boolean;
  onClose: () => void;
}

export default function PaywallVariantC({ visible, onClose }: PaywallVariantCProps) {
  const { purchasePackage, offerings } = useSubscription();
  
  // Debug offerings
  console.log('[PaywallVariantC] Offerings:', offerings);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('pro_monthly');
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

      const packageIdentifier = plan === 'pro_monthly' ? '$rc_monthly' : '$rc_annual';
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
        Alert.alert('Welcome to Wizzmo Pro! ✨', 'You now have unlimited access to dating advice!');
      }
    } catch (error) {
      console.error('[PaywallVariantC] Purchase error:', error);
      Alert.alert('Purchase Failed', 'Please try again or contact support.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>upgrade to pro 💕</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={20} color="#666666" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            {/* Benefits List */}
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
                <Text style={styles.benefitText}>priority responses from wizzmos</Text>
              </View>
              <View style={styles.benefit}>
                <Text style={styles.benefitIcon}>✨</Text>
                <Text style={styles.benefitText}>ad-free experience</Text>
              </View>
            </View>

            {/* Quick Selection Buttons */}
            <View style={styles.quickSection}>
              <TouchableOpacity
                style={[styles.quickButton, styles.primaryQuick]}
                onPress={() => handlePurchase('pro_monthly')}
                disabled={isPurchasing}
              >
                {isPurchasing && selectedPlan === 'pro_monthly' ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.quickButtonTitle}>monthly</Text>
                    <Text style={styles.quickButtonPrice}>
                      {offerings?.[0]?.availablePackages.find(pkg => pkg.identifier === '$rc_monthly')?.product.priceString || '$9.99'}/month
                    </Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.quickButton, styles.secondaryQuick]}
                onPress={() => handlePurchase('pro_yearly')}
                disabled={isPurchasing}
              >
                {isPurchasing && selectedPlan === 'pro_yearly' ? (
                  <ActivityIndicator color="#FF4DB8" size="small" />
                ) : (
                  <>
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>save $40</Text>
                    </View>
                    <Text style={[styles.quickButtonTitle, { color: '#FF4DB8' }]}>yearly</Text>
                    <Text style={[styles.quickButtonPrice, { color: '#FF4DB8' }]}>
                      {offerings?.[0]?.availablePackages.find(pkg => pkg.identifier === '$rc_annual')?.product.priceString || '$59.99'}/year
                    </Text>
                    <Text style={styles.quickButtonSub}>just $0.16/day</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Trust Signals */}
            <View style={styles.trustSection}>
              <Text style={styles.trustText}>✓ cancel anytime</Text>
              <Text style={styles.trustText}>✓ no commitment</Text>
              <Text style={styles.trustText}>✓ instant activation</Text>
            </View>

            {/* Bottom padding */}
            <View style={{ height: 20 }} />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    textTransform: 'lowercase',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  
  // Benefits
  benefitsSection: {
    marginBottom: 32,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    flex: 1,
  },
  
  // Quick Selection
  quickSection: {
    gap: 12,
    marginBottom: 32,
  },
  quickButton: {
    padding: 20,
    borderRadius: 0,
    borderWidth: 2,
    position: 'relative',
  },
  primaryQuick: {
    backgroundColor: '#FF4DB8',
    borderColor: '#FF4DB8',
  },
  secondaryQuick: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FF4DB8',
  },
  quickButtonTitle: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'lowercase',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  quickButtonPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickButtonSub: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
    marginTop: 2,
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: '#FF4DB8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 0,
  },
  savingsText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  
  // Trust Signals
  trustSection: {
    alignItems: 'center',
    gap: 8,
  },
  trustText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
});
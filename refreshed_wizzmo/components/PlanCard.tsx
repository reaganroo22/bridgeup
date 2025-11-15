import React from 'react';
import { StyleSheet, TouchableOpacity, View as RNView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface PlanCardProps {
  name: string;
  price: string;
  period: string;
  features: string[];
  isPopular?: boolean;
  isSelected?: boolean;
  savings?: string;
  onPress?: () => void;
}

export default function PlanCard({
  name,
  price,
  period,
  features,
  isPopular = false,
  isSelected = false,
  savings,
  onPress,
}: PlanCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceElevated,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: isSelected ? 3 : 1,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      {isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.popularText}>most popular ✨</Text>
        </View>
      )}

      <View style={[styles.header, { backgroundColor: 'transparent' }]}>
        <RNView>
          <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
          <RNView style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.text }]}>{price}</Text>
            <Text style={[styles.period, { color: colors.textSecondary }]}>{period}</Text>
          </RNView>
          {savings && (
            <View style={[styles.savingsBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.savingsText}>{savings}</Text>
            </View>
          )}
        </RNView>

        {isSelected && (
          <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
        )}
      </View>

      <View style={[styles.featuresContainer, { backgroundColor: 'transparent' }]}>
        {features.map((feature, index) => (
          <View key={index} style={[styles.featureRow, { backgroundColor: 'transparent' }]}>
            <Ionicons name="checkmark" size={18} color={colors.success} style={styles.featureIcon} />
            <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
    zIndex: 10,
  },
  popularText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  name: {
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
  price: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  period: {
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
});

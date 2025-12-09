import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TabBadgeProps {
  count: number;
  maxCount?: number;
  children: React.ReactNode;
  badgeColor?: string;
  textColor?: string;
  size?: 'small' | 'medium';
}

export default function TabBadge({ 
  count, 
  maxCount = 99, 
  children, 
  badgeColor = '#FF4DB8',
  textColor = '#FFFFFF',
  size = 'small'
}: TabBadgeProps) {
  const shouldShowBadge = count > 0;
  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const badgeSize = size === 'small' ? 16 : 20;
  const fontSize = size === 'small' ? 10 : 12;

  return (
    <View style={styles.container}>
      {children}
      {shouldShowBadge && (
        <View 
          style={[
            styles.badge,
            {
              backgroundColor: badgeColor,
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            }
          ]}
        >
          <Text 
            style={[
              styles.badgeText,
              {
                color: textColor,
                fontSize: fontSize,
              }
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {displayCount}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    minWidth: 16,
  },
  badgeText: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
});
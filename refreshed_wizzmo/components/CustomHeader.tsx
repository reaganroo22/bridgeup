import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Colors from '@/constants/Colors';
import { Typography, FontFamily, FontWeight } from '@/constants/Fonts';
import { useColorScheme } from '@/components/useColorScheme';
import NotificationBadge from './NotificationBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMode } from '@/contexts/UserModeContext';
import * as supabaseService from '@/lib/supabaseService';

interface CustomHeaderProps {
  title?: string;
  showBackButton?: boolean;
  showProfileButton?: boolean;
  showChatButton?: boolean;
  showHomeButton?: boolean;
  showInboxButton?: boolean;
  backgroundColor?: string;
  useGradient?: boolean;
  rightActions?: React.ReactNode;
  onBackPress?: () => void;
  notificationCount?: number;
  showNotificationBadge?: boolean;
  currentScreen?: string; // To help determine which icons to show
}

export default function CustomHeader({
  title = 'bridge up',
  showBackButton = false,
  showProfileButton = true,
  showChatButton = true,
  showHomeButton = true,
  showInboxButton = true,
  backgroundColor,
  useGradient = true,
  rightActions,
  onBackPress,
  notificationCount = 0,
  showNotificationBadge = false,
  currentScreen,
}: CustomHeaderProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const { currentMode, canSwitch } = useUserMode();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const headerContent = (
    <View style={styles.headerContainer}>
      {/* Top spacer to fill the notch/Dynamic Island area */}
      <View style={[styles.topSpacer, { height: insets.top }]} />

      <View style={[
        styles.headerContent,
        {
          paddingTop: 2,
          paddingBottom: 5,
          paddingHorizontal: 20,
        }
      ]}>
        <View style={styles.headerRow}>
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          )}
          <Text style={styles.brandTitle}>{title}</Text>
        </View>

        <View style={styles.rightSection}>
          {/* Profile button - always show when enabled */}
          {showProfileButton && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (currentMode === 'mentor') {
                  router.push('/(tabs)/mentor-profile');
                } else {
                  router.push('/(tabs)/profile');
                }
              }}
            >
              <Ionicons name="person-circle-outline" size={26} color="rgba(255,255,255,0.9)" />
            </TouchableOpacity>
          )}
          {/* Additional right actions */}
          {rightActions}
        </View>
        </View>
      </View>
    </View>
  );

  if (useGradient) {
    return (
      <LinearGradient
        colors={colors.gradientHero}
        style={styles.gradientHeader}
      >
        {headerContent}
      </LinearGradient>
    );
  }

  return (
    <View style={[
      styles.solidHeader,
      { backgroundColor: backgroundColor || colors.surface }
    ]}>
      {headerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  gradientHeader: {
    position: 'absolute',
    top: -50, // Start above screen edge
    left: 0,
    right: 0,
    paddingTop: 50, // Compensate for negative top
    paddingBottom: 20,
    minHeight: 50, // Ensure minimum height
    zIndex: 1000,
  },
  solidHeader: {
    position: 'absolute',
    top: -50, // Start above screen edge
    left: 0,
    right: 0,
    paddingTop: 50, // Compensate for negative top
    paddingBottom: 20,
    minHeight: 50, // Ensure minimum height
    zIndex: 1000,
  },
  headerContainer: {
    width: '100%',
  },
  topSpacer: {
    width: '100%',
  },
  headerContent: {
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  brandTitle: {
    ...Typography.navTitle,
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
    textTransform: 'lowercase',
  },
  actionButton: {
    padding: 8,
  },
  iconWithBadge: {
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
});
import React, { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { AppProvider } from '../../contexts/AppContext';
import { SubscriptionProvider } from '../../contexts/SubscriptionContext';
import { useAuth } from '../../contexts/AuthContext';
import { useUserMode } from '../../contexts/UserModeContext';
import * as supabaseService from '../../lib/supabaseService';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user: authUser } = useAuth();
  const { currentMode, isLoading } = useUserMode();

  // Show loading spinner while UserModeContext is loading or currentMode is null
  if (isLoading || currentMode === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SubscriptionProvider>
      <AppProvider>
          <Tabs
          screenOptions={{
            tabBarActiveTintColor: colors.tabIconSelected,
            tabBarInactiveTintColor: colors.tabIconDefault,
            tabBarStyle: {
              backgroundColor: colors.tabBackground,
              borderTopColor: colors.tabBorder,
              borderTopWidth: 3,
              paddingBottom: 25,
              paddingTop: 12,
              height: 90,
              shadowColor: colors.text,
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 0,
              elevation: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '700',
              marginTop: 6,
              letterSpacing: -0.2,
              textTransform: 'lowercase',
            },
            tabBarIconStyle: {
              marginTop: 2,
            },
            headerShown: false,
          }}
        >
          {/* TAB 1: HOME/INBOX */}
          <Tabs.Screen
            name="index"
            options={{
              title: currentMode === 'student' ? '🏠 home' : '📬 inbox',
              href: undefined, // Visible for both
              tabBarIcon: ({ color, size, focused }) => (
                currentMode === 'student' ? 
                  <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> :
                  <Ionicons name={focused ? 'mail' : 'mail-outline'} size={size} color={color} />
              ),
            }}
          />
          
          {/* TAB 2: WIZZMOS - Only visible for students */}
          <Tabs.Screen
            name="mentors"
            options={{
              title: '✨ wizzmos',
              href: currentMode === 'student' ? undefined : null, // Only visible for students
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} />
              ),
            }}
          />
          
          {/* TAB 3: CHAT */}
          <Tabs.Screen
            name="mentor-chats"
            options={{
              title: '💬 chat',
              href: undefined, // Visible for both students and mentors
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} />
              ),
            }}
          />
          
          {/* TAB 4: TRENDING/FEED */}
          <Tabs.Screen
            name="feed"
            options={{
              title: '🔥 trending',
              href: undefined, // Visible for both students and mentors
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons name={focused ? 'flame' : 'flame-outline'} size={size} color={color} />
              ),
            }}
          />

          {/* HIDDEN TABS - Not in tab bar but accessible via navigation */}
          <Tabs.Screen
            name="ask"
            options={{
              title: '☕ spill',
              href: null, // Hidden from tabs, accessible as full form
              presentation: 'modal',
              headerShown: false,
              tabBarStyle: { display: 'none' }, // Hide tab bar on this screen
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="mentor-inbox"
            options={{
              title: '📬 inbox',
              href: null, // Hidden since we're using index for this
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons name={focused ? 'mail' : 'mail-outline'} size={size} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="mentor-profile"
            options={{
              title: '👤 profile',
              href: null, // Hidden from tabs, accessible via header only
              tabBarIcon: ({ color, size, focused }) => (
                <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
              ),
            }}
          />

          {/* Shared screens - Not in tab bar but accessible via navigation */}
          <Tabs.Screen
            name="advice"
            options={{
              href: null, // Hidden from tabs but accessible via header navigation
              title: 'advice',
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              href: null, // Hidden from tabs but accessible via header icon
              title: 'profile',
            }}
          />
        </Tabs>
        </AppProvider>
      </SubscriptionProvider>
  );
}

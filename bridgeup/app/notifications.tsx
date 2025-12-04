import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Platform, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CustomHeader from '@/components/CustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState({
    newMessages: true,
    questionMatched: true,
    dailyTrending: false,
    weeklyDigest: true,
    mentorAvailable: true,
    questionResolved: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationGroups = [
    {
      title: "important",
      settings: [
        {
          id: 'newMessages',
          title: 'new messages',
          description: 'when a mentor responds to your question',
          value: settings.newMessages,
        },
        {
          id: 'questionMatched',
          title: 'question matched',
          description: 'when your question gets matched with mentors',
          value: settings.questionMatched,
        },
        {
          id: 'questionResolved',
          title: 'question resolved',
          description: 'when your advice chat is marked as resolved',
          value: settings.questionResolved,
        },
      ]
    },
    {
      title: "discovery",
      settings: [
        {
          id: 'mentorAvailable',
          title: 'mentor online',
          description: 'when your favorite mentors come online',
          value: settings.mentorAvailable,
        },
        {
          id: 'dailyTrending',
          title: 'trending topics',
          description: 'daily updates on what\'s popular',
          value: settings.dailyTrending,
        },
        {
          id: 'weeklyDigest',
          title: 'weekly digest',
          description: 'summary of helpful advice from the week',
          value: settings.weeklyDigest,
        },
      ]
    }
  ];

  return (
    <>
      <CustomHeader
        title="notifications"
        showBackButton={true}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 60 }} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
        {/* Overview */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            stay in the loop
          </Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            customize when and how you want to hear from bridgeup. you can always change these settings later.
          </Text>
        </View>

        {/* Key Notifications Only */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            notifications
          </Text>

          <View style={[styles.settingsList, { borderColor: colors.border }]}>
            <View style={[styles.settingItem, { borderBottomColor: colors.separator }]}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  new messages
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  when mentors respond to your questions
                </Text>
              </View>
              <Switch
                value={settings.newMessages}
                onValueChange={() => toggleSetting('newMessages')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.newMessages ? '#FFFFFF' : colors.textTertiary}
              />
            </View>

            <View style={[styles.settingItem, { borderBottomColor: colors.separator }]}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  question matched
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  when your question gets matched with mentors
                </Text>
              </View>
              <Switch
                value={settings.questionMatched}
                onValueChange={() => toggleSetting('questionMatched')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.questionMatched ? '#FFFFFF' : colors.textTertiary}
              />
            </View>

            <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  trending topics
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  daily updates on what's popular
                </Text>
              </View>
              <Switch
                value={settings.dailyTrending}
                onValueChange={() => toggleSetting('dailyTrending')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.dailyTrending ? '#FFFFFF' : colors.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Quiet Hours */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            quiet hours
          </Text>

          <TouchableOpacity style={[styles.quietHoursCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.quietHoursContent}>
              <Text style={[styles.quietHoursTitle, { color: colors.text }]}>
                set quiet hours
              </Text>
              <Text style={[styles.quietHoursDescription, { color: colors.textSecondary }]}>
                currently: 10 PM - 8 AM
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>

          <Text style={[styles.helpText, { color: colors.textTertiary }]}>
            notifications will be silenced during these hours, except for urgent messages
          </Text>
        </View>

        {/* Delivery Method */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            how you'll hear from us
          </Text>

          <View style={[styles.deliveryCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
            <View style={styles.deliveryContent}>
              <Text style={[styles.deliveryTitle, { color: colors.text }]}>
                push notifications
              </Text>
              <Text style={[styles.deliveryDescription, { color: colors.textSecondary }]}>
                instant alerts on your phone
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: colors.success }]}>
              <Text style={styles.statusText}>enabled</Text>
            </View>
          </View>

          <Text style={[styles.helpText, { color: colors.textTertiary }]}>
            we'll only send you notifications for things you care about. no spam, ever.
          </Text>
        </View>
        </ScrollView>
      </View>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 12,
    textTransform: 'lowercase',
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  settingsList: {
    borderWidth: 1,
    borderRadius: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  quietHoursCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 0,
    marginBottom: 8,
  },
  quietHoursContent: {
    flex: 1,
  },
  quietHoursTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  quietHoursDescription: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  deliveryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 0,
    marginBottom: 8,
  },
  deliveryContent: {
    flex: 1,
    marginLeft: 12,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  deliveryDescription: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  helpText: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
});
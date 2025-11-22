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

export default function PrivacyScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  const [settings, setSettings] = useState({
    anonymousPosting: true,
    publicQuestions: false,
    dataCollection: true,
    analyticsTracking: false,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const privacySettings = [
    {
      id: 'anonymousPosting',
      title: 'anonymous by default',
      description: 'always post questions anonymously unless you choose otherwise',
      value: settings.anonymousPosting,
    },
    {
      id: 'publicQuestions',
      title: 'allow public questions',
      description: 'let your resolved questions be shown publicly to help other students',
      value: settings.publicQuestions,
    },
    {
      id: 'dataCollection',
      title: 'improve matching',
      description: 'help us improve mentor matching by analyzing question patterns',
      value: settings.dataCollection,
    },
    {
      id: 'analyticsTracking',
      title: 'usage analytics',
      description: 'share anonymous usage data to help improve the app',
      value: settings.analyticsTracking,
    },
  ];

  return (
    <>
      <CustomHeader
        title="privacy & data"
        showBackButton={true}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 60 }} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
        {/* Privacy Policy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            your privacy matters
          </Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            wizzmo is built with privacy in mind. we collect only what's necessary to provide you with great advice and match you with the right mentors.
          </Text>
        </View>

        {/* Key Settings Only */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            quick settings
          </Text>

          <View style={[styles.settingsList, { borderColor: colors.border }]}>
            <View style={[styles.settingItem, { borderBottomColor: colors.separator }]}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  anonymous by default
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  always post questions anonymously
                </Text>
              </View>
              <Switch
                value={settings.anonymousPosting}
                onValueChange={() => toggleSetting('anonymousPosting')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.anonymousPosting ? '#FFFFFF' : colors.textTertiary}
              />
            </View>

            <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  allow public sharing
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  let resolved questions help other students
                </Text>
              </View>
              <Switch
                value={settings.publicQuestions}
                onValueChange={() => toggleSetting('publicQuestions')}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings.publicQuestions ? '#FFFFFF' : colors.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Data We Collect */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            what we collect
          </Text>

          <View style={[styles.dataCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.dataTitle, { color: colors.text }]}>to provide the service:</Text>
            <Text style={[styles.dataItem, { color: colors.textSecondary }]}>• your questions and messages</Text>
            <Text style={[styles.dataItem, { color: colors.textSecondary }]}>• basic usage patterns</Text>
            <Text style={[styles.dataItem, { color: colors.textSecondary }]}>• question categories and topics</Text>
          </View>

          <View style={[styles.dataCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.dataTitle, { color: colors.text }]}>to improve matching:</Text>
            <Text style={[styles.dataItem, { color: colors.textSecondary }]}>• response times and engagement</Text>
            <Text style={[styles.dataItem, { color: colors.textSecondary }]}>• successful advice ratings</Text>
            <Text style={[styles.dataItem, { color: colors.textSecondary }]}>• mentor specialties effectiveness</Text>
          </View>

          <View style={[styles.dataCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.dataTitle, { color: colors.text }]}>we never collect:</Text>
            <Text style={[styles.dataItem, { color: colors.textSecondary }]}>• your real name (unless you share it)</Text>
            <Text style={[styles.dataItem, { color: colors.textSecondary }]}>• contact information</Text>
            <Text style={[styles.dataItem, { color: colors.textSecondary }]}>• location data</Text>
            <Text style={[styles.dataItem, { color: colors.textSecondary }]}>• device information</Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            questions about privacy?
          </Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            reach out to us at privacy@wizzmo.app if you have any questions about how we handle your data.
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
  dataCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 0,
    marginBottom: 12,
  },
  dataTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  dataItem: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
    marginBottom: 2,
  },
});
import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { BridgeUpDesign, createCard, createHeading } from '@/constants/BridgeUpDesign';

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={colors.gradientHero}
        style={styles.headerGradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#FFFFFF' }]}>
          about bridgeup
        </Text>
      </LinearGradient>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {/* Mission */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            our mission
          </Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            bridgeup connects high school students with current college students for authentic college admissions and preparation guidance. we believe every high schooler deserves honest, practical advice from people who recently navigated the college journey themselves.
          </Text>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            how it works
          </Text>
          <View style={[styles.stepCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.stepNumber, { color: colors.primary }]}>1</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>ask your questions</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                get guidance on college applications, essays, campus life, and admissions
              </Text>
            </View>
          </View>

          <View style={[styles.stepCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.stepNumber, { color: colors.primary }]}>2</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>connect with advisors</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                current college students share practical insights from their recent admissions experience
              </Text>
            </View>
          </View>

          <View style={[styles.stepCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.stepNumber, { color: colors.primary }]}>3</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>succeed in admissions</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                apply to college with confidence and clarity about your path forward
              </Text>
            </View>
          </View>
        </View>

        {/* Team */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            built by students
          </Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            we're a team of college students who understand the challenges of the admissions process. no corporate bs, just real students helping high schoolers navigate the path to college success.
          </Text>
        </View>

        {/* Version info */}
        <View style={styles.section}>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
            version 1.0.0
          </Text>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
            made with 💕 for high schoolers everywhere
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: BridgeUpDesign.fontSize.title,
    fontWeight: BridgeUpDesign.fontWeight.semibold,
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: BridgeUpDesign.fontSize.heading,
    fontWeight: BridgeUpDesign.fontWeight.semibold,
    letterSpacing: -0.2,
    marginBottom: BridgeUpDesign.spacing.md,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: BridgeUpDesign.spacing.md,
    borderWidth: 1,
    borderRadius: BridgeUpDesign.borderRadius.medium,
    marginBottom: BridgeUpDesign.spacing.sm,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stepNumber: {
    fontSize: BridgeUpDesign.fontSize.heading,
    fontWeight: BridgeUpDesign.fontWeight.bold,
    marginRight: BridgeUpDesign.spacing.md,
    marginTop: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
});
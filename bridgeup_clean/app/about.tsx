import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

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
          about wizzmo
        </Text>
      </LinearGradient>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {/* Mission */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            our mission
          </Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            wizzmo is the college advice app made by students, for students. we believe every college girl deserves honest, judgment-free advice from people who actually get it.
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
              <Text style={[styles.stepTitle, { color: colors.text }]}>ask anonymously</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                drop your question about dating, drama, classes, or life
              </Text>
            </View>
          </View>

          <View style={[styles.stepCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.stepNumber, { color: colors.primary }]}>2</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>get real advice</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                verified college girls share honest takes from real experience
              </Text>
            </View>
          </View>

          <View style={[styles.stepCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.stepNumber, { color: colors.primary }]}>3</Text>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>act confidently</Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                move forward with clarity and confidence
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
            we're a team of college students who saw a need for real, honest advice in the college space. no corporate bs, just girls helping girls navigate the beautiful chaos of college life.
          </Text>
        </View>

        {/* Version info */}
        <View style={styles.section}>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
            version 1.0.0
          </Text>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
            made with 💕 for college girls everywhere
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
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
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
  stepCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderWidth: 1,
    borderRadius: 0,
    marginBottom: 12,
  },
  stepNumber: {
    fontSize: 24,
    fontWeight: '900',
    marginRight: 16,
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
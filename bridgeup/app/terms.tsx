import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CustomHeader from '@/components/CustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  return (
    <>
      <CustomHeader
        title="terms of service"
        showBackButton={true}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 60 }} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Introduction */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              welcome to bridgeup
            </Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              these terms govern your use of bridgeup's college admissions advice platform. by using our app, you agree to these terms.
            </Text>
          </View>

          {/* What Wizzmo Is */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              what bridgeup is
            </Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• high school students asking for college admissions advice</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• verified college students ("advisors") providing guidance</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• peer-to-peer advice platform, not professional therapy</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• community focused on respectful, helpful interactions</Text>
            </View>
          </View>

          {/* User Responsibilities */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              your responsibilities
            </Text>
            
            <Text style={[styles.subsectionTitle, { color: colors.text }]}>be respectful</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• treat all users with kindness and respect</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• no harassment, hate speech, or inappropriate content</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• respect boundaries when advisors decline to answer</Text>
            </View>

            <Text style={[styles.subsectionTitle, { color: colors.text }]}>use appropriately</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• ask genuine questions seeking advice</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• don't spam or send repetitive messages</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• provide accurate information about yourself</Text>
            </View>

            <Text style={[styles.subsectionTitle, { color: colors.text }]}>age requirement</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• you must be 16+ to use bridgeup</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• advisors are verified college students or recent graduates</Text>
            </View>
          </View>

          {/* What We Don't Allow */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              prohibited content
            </Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• explicit sexual content or solicitation</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• requests for personal contact information</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• commercial promotion or advertising</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• illegal activities or harmful advice</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• impersonation or false identities</Text>
            </View>
          </View>

          {/* Advice Disclaimer */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              advice disclaimer
            </Text>
            <View style={[styles.warningCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.primary }]}>
              <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                bridgeup provides peer advice, not professional counseling. advice shared should not replace professional college consulting, therapy, medical care, or legal counsel. use your judgment and seek professional help when needed.
              </Text>
            </View>
          </View>

          {/* Account Terms */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              your account
            </Text>
            <View style={[styles.infoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• you're responsible for keeping your account secure</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• one account per person</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• we may suspend accounts that violate these terms</Text>
              <Text style={[styles.cardItem, { color: colors.textSecondary }]}>• you can delete your account anytime in settings</Text>
            </View>
          </View>

          {/* Intellectual Property */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              content ownership
            </Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              you own the content you share. by posting on bridgeup, you grant us permission to display and share your content within the platform to provide the service.
            </Text>
          </View>

          {/* Limitation of Liability */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              service availability
            </Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              we strive to keep bridgeup available 24/7, but we can't guarantee uninterrupted service. we're not liable for any issues resulting from service outages or technical problems.
            </Text>
          </View>

          {/* Changes to Terms */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              changes to these terms
            </Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              we may update these terms occasionally. we'll notify you of significant changes through the app. continued use means you accept the updated terms.
            </Text>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              questions?
            </Text>
            <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
              reach out to us at legal@bridgeup.app if you have any questions about these terms.
            </Text>
            <Text style={[styles.bodyText, { color: colors.textTertiary, marginTop: 16 }]}>
              last updated: november 2024
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 12,
    marginTop: 16,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  infoCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 0,
    marginBottom: 12,
  },
  warningCard: {
    padding: 16,
    borderWidth: 2,
    borderRadius: 0,
    marginBottom: 12,
  },
  cardItem: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: -0.1,
    fontStyle: 'italic',
  },
});
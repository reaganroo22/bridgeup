import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CustomHeader from '@/components/CustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HelpScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  const faqItems = [
    {
      question: "how does matching work?",
      answer: "when you submit a question, our system matches you with 2-3 verified college mentors (bridgeups) who specialize in your topic. they'll join a private chat to help you out."
    },
    {
      question: "are my questions really anonymous?",
      answer: "yes! when you post anonymously, mentors can't see your identity. only you can decide if you want to share more about yourself in the chat."
    },
    {
      question: "how do i become a bridgeup?",
      answer: "we're currently building our mentor network! if you're interested in helping other college students, reach out through our contact form."
    },
    {
      question: "what if i don't like the advice?",
      answer: "you can always resolve a chat if it's not helpful. we're constantly working to improve mentor quality and matching."
    },
    {
      question: "is this app free?",
      answer: "yes! bridgeup is free to use. you can ask questions and get advice without any cost."
    }
  ];

  const contactOptions = [
    {
      title: "email us",
      subtitle: "hello@bridgeup.app",
      icon: "mail-outline",
      action: () => Linking.openURL('mailto:hello@bridgeup.app')
    },
    {
      title: "report an issue",
      subtitle: "something not working?",
      icon: "warning-outline",
      action: () => Alert.alert('report issue', 'issue reporting coming soon! for now, email us at hello@bridgeup.app')
    },
    {
      title: "give feedback",
      subtitle: "help us improve",
      icon: "heart-outline",
      action: () => Alert.alert('feedback', 'feedback form coming soon! for now, email us your thoughts at hello@bridgeup.app')
    }
  ];

  return (
    <>
      <CustomHeader
        title="help & support"
        showBackButton={true}
        showChatButton={false}
        showProfileButton={false}
      />

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 100 }} />
        <View style={[styles.content, { backgroundColor: colors.background }]}>
        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            frequently asked questions
          </Text>

          <View style={[styles.faqList, { borderColor: colors.border }]}>
            {faqItems.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.faqItem,
                  { borderBottomColor: colors.separator },
                  index === faqItems.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <Text style={[styles.faqQuestion, { color: colors.text }]}>
                  {item.question}
                </Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>
                  {item.answer}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            get in touch
          </Text>

          <View style={[styles.contactList, { borderColor: colors.border }]}>
            {contactOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.contactItem,
                  { borderBottomColor: colors.separator },
                  index === contactOptions.length - 1 && { borderBottomWidth: 0 },
                ]}
                onPress={option.action}
              >
                <Ionicons name={option.icon as any} size={20} color={colors.primary} />
                <View style={styles.contactContent}>
                  <Text style={[styles.contactTitle, { color: colors.text }]}>
                    {option.title}
                  </Text>
                  <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
                    {option.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Guidelines */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            community guidelines
          </Text>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
            bridgeup is a safe space for college students to get honest advice. we ask that everyone:
          </Text>
          <View style={styles.guidelinesList}>
            <Text style={[styles.guideline, { color: colors.textSecondary }]}>• be kind and respectful</Text>
            <Text style={[styles.guideline, { color: colors.textSecondary }]}>• give honest, helpful advice</Text>
            <Text style={[styles.guideline, { color: colors.textSecondary }]}>• respect privacy and anonymity</Text>
            <Text style={[styles.guideline, { color: colors.textSecondary }]}>• no harassment or bullying</Text>
            <Text style={[styles.guideline, { color: colors.textSecondary }]}>• no sharing personal information</Text>
          </View>
        </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
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
    marginBottom: 16,
  },
  faqList: {
    borderWidth: 1,
    borderRadius: 0,
  },
  faqItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  contactList: {
    borderWidth: 1,
    borderRadius: 0,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  contactContent: {
    flex: 1,
    marginLeft: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  guidelinesList: {
    marginTop: 8,
  },
  guideline: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: -0.1,
    marginBottom: 4,
  },
});
import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CustomHeader from '@/components/CustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  const handleReportContent = () => {
    Linking.openURL('https://wizzmo.app/safety');
  };

  return (
    <>
      <CustomHeader
        title="settings"
        showBackButton={true}
        showChatButton={false}
        showProfileButton={false}
      />
      
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 100 }} />
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          
          {/* Safety Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              safety & support
            </Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={handleReportContent}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons name="flag-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  report content
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Legal Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              legal
            </Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={() => Linking.openURL('https://wizzmo.app/terms-of-service')}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  terms of service
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              onPress={() => Linking.openURL('https://wizzmo.app/privacy-policy')}
            >
              <View style={styles.settingItemLeft}>
                <Ionicons name="shield-outline" size={20} color={colors.textSecondary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  privacy policy
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
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

  // Sections
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 16,
  },

  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    marginBottom: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingItemText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CustomHeader from '@/components/CustomHeader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as supabaseService from '@/lib/supabaseService';

export default function StudentProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const profileUserId = (params.userId || params.id) as string;

  useEffect(() => {
    fetchStudentProfile();
  }, [profileUserId]);

  const fetchStudentProfile = async () => {
    if (!profileUserId) return;

    try {
      // Fetch profile data
      const { data: profile } = await supabaseService.getUserProfile(profileUserId);
      if (profile) {
        setStudentProfile(profile);
      }
    } catch (error) {
      console.error('[StudentProfile] Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !studentProfile) {
    return (
      <>
        <CustomHeader
          title="profile"
          showBackButton={true}
          showChatButton={false}
          showProfileButton={false}
        />
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: colors.textSecondary }}>loading profile...</Text>
        </View>
      </>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <>
      <CustomHeader
        title="profile"
        showBackButton={true}
        showChatButton={false}
        showProfileButton={false}
      />

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 100 }} />
        <View style={[styles.content, { backgroundColor: colors.background }]}>

          {/* Profile Header - Instagram Style */}
          <View style={styles.headerSection}>
            <View style={styles.topRow}>
              {/* Avatar */}
              <View style={[styles.avatarContainer, { borderColor: colors.border }]}>
                {studentProfile.avatar_url && !studentProfile.avatar_url.startsWith('file://') ? (
                  <Image 
                    source={{ uri: studentProfile.avatar_url }} 
                    style={styles.avatar}
                    onError={() => console.log('[StudentProfile] Avatar failed to load, showing initials')}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={[styles.avatarText, { color: colors.text }]}>
                      {getInitials(studentProfile.full_name)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: colors.text }]}>
                    0
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>questions</Text>
                </View>
              </View>
            </View>

            {/* Name & Bio */}
            <View style={styles.bioSection}>
              <Text style={[styles.fullName, { color: colors.text }]}>
                {studentProfile.full_name || studentProfile.username || 'User'}
              </Text>
              <Text style={[styles.username, { color: colors.textSecondary }]}>
                @{studentProfile.username || 'username'}
              </Text>
              <Text style={[styles.university, { color: colors.textSecondary }]}>
                {studentProfile.university || 'University'} • Class of {studentProfile.graduation_year || '2026'}
              </Text>
              {studentProfile.bio && (
                <Text style={[styles.bio, { color: colors.text }]}>
                  {studentProfile.bio}
                </Text>
              )}
            </View>

          </View>

          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.infoRow}>
              <Ionicons name="school-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                {studentProfile.university || 'University'}
              </Text>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: colors.separator }]} />
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Class of {studentProfile.graduation_year || '2026'}
              </Text>
            </View>
          </View>

          {/* Privacy Notice */}
          <View style={[styles.privacyNotice, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.privacyText, { color: colors.textSecondary }]}>
              Questions asked anonymously are not shown publicly
            </Text>
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

  // Header Section
  headerSection: {
    marginBottom: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    borderWidth: 2,
    borderRadius: 50,
    padding: 3,
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },

  // Bio Section
  bioSection: {
    marginBottom: 16,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  username: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginBottom: 2,
  },
  university: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 20,
  },

  // Follow Button
  followButton: {
    borderWidth: 1,
    borderRadius: 0,
    paddingVertical: 8,
    alignItems: 'center',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Info Card
  infoCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  infoDivider: {
    height: 1,
    marginVertical: 12,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 12,
  },

  // Activity Card
  activityCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
  },
  activityRow: {
    flexDirection: 'row',
  },
  activityItem: {
    flex: 1,
    alignItems: 'center',
  },
  activityNumber: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 8,
    marginBottom: 4,
  },
  activityLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  activityDivider: {
    width: 1,
    marginHorizontal: 16,
  },

  // Privacy Notice
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 0,
    padding: 12,
    gap: 10,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 16,
  },
});

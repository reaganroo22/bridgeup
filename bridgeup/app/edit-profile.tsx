import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CustomHeader from '@/components/CustomHeader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

export default function EditProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user: authUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [university, setUniversity] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [major, setMajor] = useState('');

  // Mentor-specific fields
  const [userRole, setUserRole] = useState<'student' | 'mentor' | 'both'>('student');
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    if (!authUser) return;

    try {
      // Fetch user profile
      const { data, error } = await supabase
        .from('users')
        .select('full_name, username, bio, university, graduation_year, major, role')
        .eq('id', authUser.id)
        .single();

      if (data) {
        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setBio(data.bio || '');
        setUniversity(data.university || '');
        setGraduationYear(data.graduation_year?.toString() || '');
        setMajor(data.major || '');
        setUserRole(data.role || 'student');

        // If user is a mentor, fetch mentor profile
        if (data.role === 'mentor' || data.role === 'both') {
          const { data: mentorProfile } = await supabase
            .from('mentor_profiles')
            .select('availability_status')
            .eq('user_id', authUser.id)
            .single();

          if (mentorProfile) {
            setAvailabilityStatus(mentorProfile.availability_status || 'available');
          }

          // Fetch all categories
          const { data: categoriesData } = await supabase
            .from('categories')
            .select('*')
            .order('name');

          if (categoriesData) {
            setCategories(categoriesData);
          }

          // Fetch mentor's expertise areas
          const { data: mentorProfileData } = await supabase
            .from('mentor_profiles')
            .select('id')
            .eq('user_id', authUser.id)
            .single();

          if (mentorProfileData) {
            const { data: expertiseData } = await supabase
              .from('mentor_expertise')
              .select('category_id')
              .eq('mentor_profile_id', mentorProfileData.id);

            if (expertiseData) {
              setSelectedCategories(expertiseData.map(e => e.category_id));
            }
          }
        }
      }
    } catch (error) {
      console.error('[EditProfile] Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!authUser) return;

    // Validation
    if (!fullName.trim()) {
      Alert.alert('error', 'please enter your full name');
      return;
    }

    if (!username.trim()) {
      Alert.alert('error', 'please enter a username');
      return;
    }

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName.trim(),
          username: username.trim().toLowerCase(),
          bio: bio.trim() || null,
          university: university.trim() || null,
          graduation_year: graduationYear ? parseInt(graduationYear) : null,
          major: major.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      if (error) {
        console.error('[EditProfile] Error updating profile:', error);
        Alert.alert('error', 'failed to update profile. please try again.');
        return;
      }

      // If mentor, update mentor-specific fields
      if (userRole === 'mentor' || userRole === 'both') {
        // Update availability status
        const { error: mentorError } = await supabase
          .from('mentor_profiles')
          .update({
            availability_status: availabilityStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', authUser.id);

        if (mentorError) {
          console.error('[EditProfile] Error updating mentor profile:', mentorError);
        }

        // Update expertise areas
        const { data: mentorProfileData } = await supabase
          .from('mentor_profiles')
          .select('id')
          .eq('user_id', authUser.id)
          .single();

        if (mentorProfileData) {
          // Delete existing expertise
          await supabase
            .from('mentor_expertise')
            .delete()
            .eq('mentor_profile_id', mentorProfileData.id);

          // Insert new expertise
          if (selectedCategories.length > 0) {
            const expertiseInserts = selectedCategories.map(catId => ({
              mentor_profile_id: mentorProfileData.id,
              category_id: catId,
            }));

            await supabase
              .from('mentor_expertise')
              .insert(expertiseInserts);
          }
        }
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('success', 'profile updated successfully!', [
        { text: 'ok', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('[EditProfile] Error:', error);
      Alert.alert('error', 'something went wrong. please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  if (loading) {
    return (
      <>
        <CustomHeader
          title="edit profile"
          showBackButton={true}
          showChatButton={false}
          showProfileButton={false}
        />
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <CustomHeader
        title="edit profile"
        showBackButton={true}
        showChatButton={false}
        showProfileButton={false}
      />

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>full name *</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
          </View>

          {/* Username */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>username *</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={username}
              onChangeText={(text) => setUsername(text.toLowerCase())}
              placeholder="johndoe"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Bio */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>bio</Text>
            <TextInput
              style={[styles.textArea, {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={bio}
              onChangeText={setBio}
              placeholder="tell others about yourself..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* University */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>university</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={university}
              onChangeText={setUniversity}
              placeholder="Harvard University"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
          </View>

          {/* Graduation Year */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>graduation year</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={graduationYear}
              onChangeText={setGraduationYear}
              placeholder="2025"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>

          {/* Major */}
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: colors.text }]}>major</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.border,
                color: colors.text
              }]}
              value={major}
              onChangeText={setMajor}
              placeholder="Computer Science"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="words"
            />
          </View>

          {/* Role/Mentor Interest Section */}
          <View style={[styles.divider, { borderTopColor: colors.border }]}>
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
              {userRole === 'student' ? 'mentor interest' : 'bridgeup settings'}
            </Text>
          </View>

          {userRole === 'student' && (
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: colors.text }]}>are you interested in mentoring?</Text>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                let us know if you're looking for advice or would be down to help other students
              </Text>
              <View style={[styles.roleButtons, { borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    { borderColor: colors.border, backgroundColor: colors.primary }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Text style={[styles.roleButtonText, { color: '#FFFFFF' }]}>
                    looking for mentor
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    { borderColor: colors.border, backgroundColor: colors.surfaceElevated }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert(
                      'become a bridgeup',
                      'want to help other college students? apply to become a verified bridgeup mentor!',
                      [
                        { text: 'maybe later', style: 'cancel' },
                        { text: 'apply now', onPress: () => {
                          // TODO: Navigate to mentor application
                          Alert.alert('coming soon', 'mentor applications will be available soon!');
                        }}
                      ]
                    );
                  }}
                >
                  <Text style={[styles.roleButtonText, { color: colors.text }]}>
                    down to be a mentor
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Mentor-specific fields */}
          {(userRole === 'mentor' || userRole === 'both') && (
            <>

              {/* Availability Status */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>availability status</Text>
                <View style={[styles.statusButtons, { borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { borderColor: colors.border },
                      availabilityStatus === 'available' && { backgroundColor: '#4CAF50', borderColor: '#4CAF50' }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAvailabilityStatus('available');
                    }}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      { color: availabilityStatus === 'available' ? '#FFFFFF' : colors.text }
                    ]}>
                      available
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { borderColor: colors.border },
                      availabilityStatus === 'busy' && { backgroundColor: '#FFA500', borderColor: '#FFA500' }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAvailabilityStatus('busy');
                    }}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      { color: availabilityStatus === 'busy' ? '#FFFFFF' : colors.text }
                    ]}>
                      busy
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      { borderColor: colors.border },
                      availabilityStatus === 'offline' && { backgroundColor: '#757575', borderColor: '#757575' }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setAvailabilityStatus('offline');
                    }}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      { color: availabilityStatus === 'offline' ? '#FFFFFF' : colors.text }
                    ]}>
                      offline
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Expertise Areas */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: colors.text }]}>
                  expertise areas (select at least 1)
                </Text>
                <View style={styles.categoriesGrid}>
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: selectedCategories.includes(category.id)
                            ? colors.primary
                            : colors.surfaceElevated,
                          borderColor: selectedCategories.includes(category.id)
                            ? colors.primary
                            : colors.border
                        }
                      ]}
                      onPress={() => toggleCategory(category.id)}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        {
                          color: selectedCategories.includes(category.id)
                            ? '#FFFFFF'
                            : colors.text
                        }
                      ]}>
                        {category.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>save changes</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 8,
    textTransform: 'lowercase',
  },
  input: {
    borderWidth: 1,
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    minHeight: 100,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 0,
    gap: 8,
    marginTop: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textTransform: 'lowercase',
  },
  divider: {
    borderTopWidth: 1,
    paddingTop: 20,
    marginTop: 20,
    marginBottom: 4,
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    textTransform: 'lowercase',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    textTransform: 'lowercase',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 0,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
    textTransform: 'lowercase',
  },
  description: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    marginBottom: 12,
    textTransform: 'lowercase',
  },
  roleButtons: {
    flexDirection: 'column',
    gap: 12,
  },
  roleButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    textTransform: 'lowercase',
  },
});

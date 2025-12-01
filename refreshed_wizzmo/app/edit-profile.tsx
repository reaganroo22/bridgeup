import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CustomHeader from '@/components/CustomHeader';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import * as supabaseService from '@/lib/supabaseService';
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
  const [universityQuery, setUniversityQuery] = useState('');
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [graduationYear, setGraduationYear] = useState('');
  const [major, setMajor] = useState('');

  // Mentor-specific fields
  const [userRole, setUserRole] = useState<'student' | 'mentor' | 'both'>('student');
  const [availabilityStatus, setAvailabilityStatus] = useState<'available' | 'busy' | 'offline'>('available');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Comprehensive university list (matching mentor filter screen)
  const UNIVERSITIES = [
    // Ivy League + Top Tier
    'Harvard University', 'Stanford University', 'Massachusetts Institute of Technology', 'Yale University',
    'Princeton University', 'University of Pennsylvania', 'California Institute of Technology', 'Columbia University',
    'University of Chicago', 'Duke University', 'Dartmouth College', 'Northwestern University', 'Brown University',
    'Cornell University', 'Johns Hopkins University', 'Rice University', 'Vanderbilt University', 'Washington University in St. Louis',
    
    // Top Public Universities
    'University of California Berkeley', 'University of California Los Angeles', 'University of Michigan Ann Arbor',
    'University of Virginia', 'Georgia Institute of Technology', 'University of North Carolina Chapel Hill',
    'University of California San Diego', 'University of Florida', 'University of Texas Austin', 'University of Wisconsin Madison',
    'University of Illinois Urbana-Champaign', 'University of Washington', 'Pennsylvania State University', 'Ohio State University',
    'University of California Davis', 'University of California Irvine', 'University of California Santa Barbara',
    'Purdue University', 'University of Maryland College Park', 'University of Minnesota Twin Cities',
    
    // Liberal Arts Colleges
    'Williams College', 'Amherst College', 'Swarthmore College', 'Wellesley College', 'Pomona College',
    'Bowdoin College', 'Middlebury College', 'Claremont McKenna College', 'Carleton College', 'Davidson College',
    'Haverford College', 'Vassar College', 'Grinnell College', 'Hamilton College', 'Colby College',
    'Harvey Mudd College', 'Bates College', 'Colgate University', 'Wesleyan University', 'Oberlin College',
    
    // Major Universities by State
    'University of Alabama', 'Auburn University', 'University of Alaska Anchorage', 'Arizona State University',
    'University of Arizona', 'University of Arkansas', 'University of California Riverside', 'University of California Merced',
    'Colorado State University', 'University of Colorado Boulder', 'University of Connecticut', 'University of Delaware',
    'Florida State University', 'University of Miami', 'Emory University', 'University of Georgia', 'University of Hawaii Manoa',
    'Boise State University', 'University of Idaho', 'University of Illinois Chicago', 'DePaul University',
    'Indiana University Bloomington', 'Purdue University', 'University of Iowa', 'Iowa State University',
    'University of Kansas', 'Kansas State University', 'University of Kentucky', 'University of Louisville',
    'Louisiana State University', 'Tulane University', 'University of Maine', 'University of Massachusetts Amherst',
    'Boston University', 'Boston College', 'Northeastern University', 'Tufts University', 'Michigan State University',
    'University of Mississippi', 'Mississippi State University', 'University of Missouri', 'Washington University in St. Louis',
    'University of Montana', 'University of Nebraska Lincoln', 'University of Nevada Las Vegas', 'University of New Hampshire',
    'Rutgers University', 'Princeton University', 'University of New Mexico', 'New York University', 'Syracuse University',
    'Fordham University', 'North Carolina State University', 'Wake Forest University', 'University of North Dakota',
    'Case Western Reserve University', 'University of Oklahoma', 'Oklahoma State University', 'University of Oregon',
    'Oregon State University', 'Temple University', 'University of Pittsburgh', 'Carnegie Mellon University',
    'University of Rhode Island', 'Clemson University', 'University of South Carolina', 'University of South Dakota',
    'University of Tennessee Knoxville', 'Vanderbilt University', 'Texas A&M University', 'Texas Tech University',
    'University of Houston', 'Southern Methodist University', 'Utah State University', 'University of Utah',
    'University of Vermont', 'Virginia Tech', 'George Mason University', 'University of Washington', 'Washington State University',
    'West Virginia University', 'University of Wisconsin Milwaukee', 'Marquette University', 'University of Wyoming',
    
    // Additional Major Universities
    'American University', 'Arizona State University', 'Baylor University', 'Brigham Young University',
    'California State University Long Beach', 'California State University Fullerton', 'California State University Northridge',
    'California Polytechnic State University', 'Central Michigan University', 'Chapman University', 'Creighton University',
    'Drexel University', 'Florida International University', 'Florida Institute of Technology', 'George Washington University',
    'Georgetown University', 'Georgia Southern University', 'Grand Canyon University', 'Howard University',
    'Illinois Institute of Technology', 'Indiana University', 'Iowa State University', 'James Madison University',
    'Kent State University', 'Liberty University', 'Louisiana Tech University', 'Loyola Marymount University',
    'Loyola University Chicago', 'Miami University', 'Montana State University', 'New Mexico State University',
    'North Carolina A&T State University', 'Northern Arizona University', 'Oakland University', 'Old Dominion University',
    'Pacific University', 'Portland State University', 'Quinnipiac University', 'Rensselaer Polytechnic Institute',
    'Rochester Institute of Technology', 'Saint Louis University', 'San Diego State University', 'San Jose State University',
    'Santa Clara University', 'Seattle University', 'Seton Hall University', 'Southern Illinois University',
    'St. John\'s University', 'Texas Christian University', 'Texas State University', 'The New School',
    'University at Buffalo', 'University of Alabama Birmingham', 'University of Central Florida', 'University of Cincinnati',
    'University of Colorado Denver', 'University of Dayton', 'University of Denver', 'University of Hartford',
    'University of Memphis', 'University of Nevada Reno', 'University of New Orleans', 'University of Northern Colorado',
    'University of Notre Dame', 'University of Richmond', 'University of Rochester', 'University of San Diego',
    'University of San Francisco', 'University of Southern California', 'University of Tampa', 'University of Tulsa',
    'Villanova University', 'Virginia Commonwealth University', 'Wichita State University', 'Xavier University',
    
    // Historically Black Colleges and Universities (HBCUs)
    'Howard University', 'Spelman College', 'Morehouse College', 'Hampton University', 'Florida A&M University',
    'North Carolina A&T State University', 'Prairie View A&M University', 'Tennessee State University',
    'Jackson State University', 'Southern University', 'Tuskegee University', 'Clark Atlanta University',
    'Norfolk State University', 'Delaware State University', 'Bethune-Cookman University', 'Fisk University',
    
    // Additional Notable Schools
    'Abilene Christian University', 'Adelphi University', 'Air Force Academy', 'Albany State University',
    'Alfred University', 'Allegheny College', 'Alma College', 'Andrews University', 'Appalachian State University',
    'Arkansas State University', 'Armstrong State University', 'Ashland University', 'Assumption College',
    'Ball State University', 'Barry University', 'Belmont University', 'Bentley University', 'Berry College',
    'Biola University', 'Bradley University', 'Brandeis University', 'Bryant University', 'Bucknell University',
    'Butler University', 'Calvin College', 'Canisius College', 'Capital University', 'Carroll University',
    'Catholic University of America', 'Cedarville University', 'Centre College', 'Champlain College',
    'Christian Brothers University', 'Clark University', 'Coastal Carolina University', 'Coe College',
    'College of Charleston', 'College of the Holy Cross', 'College of William & Mary', 'Colorado College',
    'Connecticut College', 'Concordia University', 'Cornerstone University', 'Creighton University'
  ];

  // Filter universities based on query
  const getFilteredUniversities = () => {
    if (!universityQuery.trim()) return [];
    return UNIVERSITIES.filter(uni => 
      uni.toLowerCase().includes(universityQuery.toLowerCase())
    ).slice(0, 10); // Show max 10 results
  };

  const handleUniversitySearch = (text: string) => {
    setUniversityQuery(text);
    setShowUniversityDropdown(text.length > 0);
  };

  const selectUniversity = (selectedUniversity: string) => {
    setUniversity(selectedUniversity);
    setUniversityQuery(selectedUniversity);
    setShowUniversityDropdown(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    // Initialize university query with current university value
    setUniversityQuery(university);
  }, [university]);

  const fetchProfile = async () => {
    if (!authUser) return;

    try {
      // Fetch user profile using service
      const { data: profile, error: profileError } = await supabaseService.getUserProfile(authUser.id);
      
      if (profileError) {
        console.error('[EditProfile] Error fetching profile:', profileError);
        Alert.alert('Error', 'Failed to load profile. Please try again.');
        return;
      }

      if (profile) {
        setFullName(profile.full_name || '');
        setUsername(profile.username || '');
        setBio(profile.bio || '');
        setUniversity(profile.university || '');
        setGraduationYear(profile.graduation_year?.toString() || '');
        setUserRole(profile.role || 'student');

        // If user is a mentor, fetch mentor-specific data
        if (profile.role === 'mentor' || profile.role === 'both') {
          if (profile.mentor_profile) {
            setAvailabilityStatus(profile.mentor_profile.availability_status || 'available');
            setMajor(profile.mentor_profile.major || '');
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
          if (profile.mentor_profile) {
            const { data: expertiseData } = await supabase
              .from('mentor_expertise')
              .select('category_id')
              .eq('mentor_profile_id', profile.mentor_profile.id);

            if (expertiseData) {
              setSelectedCategories(expertiseData.map(e => e.category_id));
            }
          }
        } else {
          // For students, clear the major field since they don't have mentor_profile
          setMajor('');
        }
      }
    } catch (error) {
      console.error('[EditProfile] Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!authUser) {
      Alert.alert('error', 'no user session found');
      return;
    }

    // Validation
    if (!fullName.trim()) {
      Alert.alert('error', 'please enter your full name');
      return;
    }

    if (!username.trim()) {
      Alert.alert('error', 'please enter a username');
      return;
    }

    // Check for username uniqueness if username changed
    const { data: currentProfile } = await supabaseService.getUserProfile(authUser.id);
    const currentUsername = currentProfile?.username?.toLowerCase();
    const newUsername = username.trim().toLowerCase();
    
    if (currentUsername !== newUsername) {
      console.log('[EditProfile] Username changed, checking availability...');
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', newUsername)
        .neq('id', authUser.id)
        .single();
        
      if (existingUser) {
        Alert.alert('error', 'username is already taken. please choose another.');
        return;
      }
    }

    console.log('[EditProfile] Starting save for user:', authUser.id);
    console.log('[EditProfile] Data to save:', {
      full_name: fullName.trim(),
      username: newUsername,
      bio: bio.trim(),
      university: university.trim(),
      graduation_year: graduationYear,
      major: major.trim(),
      userRole,
      availabilityStatus,
      selectedCategories
    });

    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Update user profile using service function - always include fields being edited
      const profileUpdates = {
        full_name: fullName.trim(),
        username: newUsername.trim(), 
        bio: bio.trim() || null,
        university: university.trim() || null,
        graduation_year: graduationYear ? parseInt(graduationYear) : null,
      };

      console.log('[EditProfile] Updating user profile with data:', profileUpdates);

      const { error: updateError } = await supabaseService.updateUserProfile(authUser.id, profileUpdates);

      if (updateError) {
        console.error('[EditProfile] Error updating user profile:', updateError);
        Alert.alert('error', 'failed to update profile. please try again.');
        return;
      }

      console.log('[EditProfile] ✅ User profile updated successfully');

      // If mentor, update mentor-specific fields including major
      if (userRole === 'mentor' || userRole === 'both') {
        console.log('[EditProfile] Updating mentor profile for availability and major:', {
          availability_status: availabilityStatus,
          major: major.trim() || null
        });
        
        // Update mentor profile using proper service function
        const { error: mentorError } = await supabaseService.updateMentorProfile(authUser.id, {
          availability_status: availabilityStatus,
          major: major.trim() || null,
        });

        if (mentorError) {
          console.error('[EditProfile] Error updating mentor profile:', mentorError);
          console.error('[EditProfile] Mentor error code:', mentorError.message);
          // Don't fail completely, just warn
          Alert.alert('warning', 'profile updated but mentor settings may not have saved completely');
        } else {
          console.log('[EditProfile] ✅ Mentor profile updated successfully');
        }

        // Update expertise areas - still use direct supabase for complex operations
        try {
          console.log('[EditProfile] Updating expertise areas for categories:', selectedCategories);
          
          const { data: mentorProfileData, error: mentorProfileError } = await supabase
            .from('mentor_profiles')
            .select('id')
            .eq('user_id', authUser.id)
            .single();

          if (mentorProfileError) {
            console.error('[EditProfile] Error fetching mentor profile for expertise:', mentorProfileError);
          } else if (mentorProfileData) {
            console.log('[EditProfile] Found mentor profile with ID:', mentorProfileData.id);
            
            // Delete existing expertise
            const { error: deleteError } = await supabase
              .from('mentor_expertise')
              .delete()
              .eq('mentor_profile_id', mentorProfileData.id);

            if (deleteError) {
              console.error('[EditProfile] Error deleting old expertise:', deleteError);
            } else {
              console.log('[EditProfile] Deleted old expertise areas');
            }

            // Insert new expertise
            if (selectedCategories.length > 0) {
              const expertiseInserts = selectedCategories.map(catId => ({
                mentor_profile_id: mentorProfileData.id,
                category_id: catId,
              }));

              console.log('[EditProfile] Inserting new expertise:', expertiseInserts);

              const { error: expertiseError } = await supabase
                .from('mentor_expertise')
                .insert(expertiseInserts);

              if (expertiseError) {
                console.error('[EditProfile] Error inserting new expertise:', expertiseError);
              } else {
                console.log('[EditProfile] ✅ Expertise areas updated successfully');
              }
            } else {
              console.log('[EditProfile] No expertise areas selected (this is okay)');
            }
          }
        } catch (expertiseError) {
          console.error('[EditProfile] Unexpected error with expertise areas:', expertiseError);
          // Don't fail completely
        }
      }

      console.log('[EditProfile] ✅ All updates completed successfully');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Refresh profile data to show the updated values
      await fetchProfile();
      
      Alert.alert('success', 'profile updated successfully!', [
        { text: 'ok', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('[EditProfile] Unexpected error during save:', error);
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

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView 
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
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
            <View style={styles.universitySearchContainer}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.border,
                  color: colors.text
                }]}
                value={universityQuery}
                onChangeText={handleUniversitySearch}
                onFocus={() => setShowUniversityDropdown(universityQuery.length > 0)}
                placeholder="Type university name..."
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
              />
              {showUniversityDropdown && (
                <ScrollView 
                  style={[styles.universityDropdown, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  keyboardShouldPersistTaps="always"
                  nestedScrollEnabled={true}
                >
                  {getFilteredUniversities().map((uni) => (
                    <TouchableOpacity
                      key={uni}
                      style={[styles.universityOption, { borderBottomColor: colors.border }]}
                      onPress={() => selectUniversity(uni)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.universityOptionText, { color: colors.text }]}>
                        {uni}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
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

          {/* Major - Only for mentors */}
          {(userRole === 'mentor' || userRole === 'both') && (
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
          )}

          {/* Role/Mentor Interest Section */}
          <View style={[styles.divider, { borderTopColor: colors.border }]}>
            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
              {userRole === 'student' ? 'mentor interest' : 'wizzmo settings'}
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
                      'become a wizzmo',
                      'want to help other college students? apply to become a verified wizzmo mentor!',
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
      </TouchableWithoutFeedback>
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
    marginBottom: 24,
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
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.2,
    minHeight: 120,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  universitySearchContainer: {
    position: 'relative',
  },
  universityDropdown: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  universityOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  universityOptionText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile, cleanupMentorData, cleanupStudentData } from '@/lib/supabaseService';
import * as Haptics from 'expo-haptics';

export default function RoleSelectionScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'student' | 'mentor' | 'both' | null>(null);

  const handleRoleSelection = async (role: 'student' | 'mentor' | 'both') => {
    if (!user || loading) return;

    setLoading(true);
    setSelectedRole(role);
    
    try {
      console.log('[RoleSelection] User selected role:', role);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // If user chooses "student", completely cleanup all mentor data
      if (role === 'student') {
        console.log('[RoleSelection] 🧹 User chose STUDENT - cleaning up ALL mentor data');
        const { error: cleanupError } = await cleanupMentorData(user.id, user.email || '');
        
        if (cleanupError) {
          console.error('[RoleSelection] Error cleaning up mentor data:', cleanupError);
          // Continue anyway - don't block user
        } else {
          console.log('[RoleSelection] ✅ Mentor data cleanup completed successfully');
        }
      }

      // If user chooses "mentor", cleanup all student-specific data
      if (role === 'mentor') {
        console.log('[RoleSelection] 🧹 User chose MENTOR - cleaning up ALL student data');
        const { error: cleanupError } = await cleanupStudentData(user.id);
        
        if (cleanupError) {
          console.error('[RoleSelection] Error cleaning up student data:', cleanupError);
          // Continue anyway - don't block user
        } else {
          console.log('[RoleSelection] ✅ Student data cleanup completed successfully');
        }
      }

      // If user chooses "both", DO NOT cleanup any data - preserve everything
      if (role === 'both') {
        console.log('[RoleSelection] 👥 User chose BOTH - preserving ALL existing student data');
        console.log('[RoleSelection] Student profile data will be retained and mentor capabilities added');
      }

      // Update user role in database and mark role selection as completed
      console.log('[RoleSelection] 🎯 CRITICAL: Updating role to:', role, 'with role_selection_completed: true');
      const { error } = await updateUserProfile(user.id, { 
        role,
        role_selection_completed: true 
      });
      
      if (error) {
        console.error('[RoleSelection] Error updating role:', error);
        alert('Something went wrong. Please try again.');
        setLoading(false);
        setSelectedRole(null);
        return;
      }

      // Store the role selection state in storage for persistence
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        
        // Store the role selection
        await AsyncStorage.default.setItem(`selected_role_${user.id}`, role);
        await AsyncStorage.default.setItem(`role_selection_completed_${user.id}`, 'true');
        
        // CRITICAL: Clear onboarding progress to prevent conflicts between student/mentor flows
        await AsyncStorage.default.removeItem(`onboarding_step_${user.id}`);
        await AsyncStorage.default.removeItem('onboarding_step'); // Also clear legacy key
        console.log('[RoleSelection] 🧹 Cleared onboarding progress to prevent flow conflicts');
        
        // For mentor role, also clear any cached student mode preferences
        if (role === 'mentor') {
          await AsyncStorage.default.setItem(`user_mode_${user.id}`, 'mentor');
          console.log('[RoleSelection] ✅ Set mentor mode in storage to prevent student mode flicker');
        } else if (role === 'both') {
          await AsyncStorage.default.setItem(`user_mode_${user.id}`, 'mentor'); // Default to mentor for dual-role
          console.log('[RoleSelection] ✅ Set default mentor mode for dual-role user');
        } else {
          await AsyncStorage.default.setItem(`user_mode_${user.id}`, 'student');
          console.log('[RoleSelection] ✅ Set student mode in storage');
        }
      } catch (storageError) {
        console.error('[RoleSelection] Error setting role in storage:', storageError);
      }

      console.log('[RoleSelection] ✅ Role updated successfully to:', role);

      // VERIFICATION: Double-check the role was actually saved
      try {
        const { getUserProfile } = await import('@/lib/supabaseService');
        const { data: verifiedProfile } = await getUserProfile(user.id);
        console.log('[RoleSelection] 🔍 VERIFICATION: Database role after update:', verifiedProfile?.role);
        console.log('[RoleSelection] 🔍 VERIFICATION: role_selection_completed:', (verifiedProfile as any)?.role_selection_completed);
        
        if (verifiedProfile?.role !== role) {
          console.error('[RoleSelection] ❌ CRITICAL: Role not properly saved! Expected:', role, 'Got:', verifiedProfile?.role);
          alert('Role update failed. Please try again.');
          setLoading(false);
          setSelectedRole(null);
          return;
        }
      } catch (verifyError) {
        console.warn('[RoleSelection] Could not verify role update:', verifyError);
      }

      // Navigate based on selected role
      if (role === 'student') {
        console.log('[RoleSelection] User chose to remain student only - redirecting to app');
        router.replace('/(tabs)');
      } else if (role === 'mentor' || role === 'both') {
        console.log('[RoleSelection] User chose mentor role - redirecting to mentor onboarding');
        router.replace('/auth/mentor-onboarding');
      }
    } catch (error) {
      console.error('[RoleSelection] Error:', error);
      alert('Something went wrong. Please try again.');
      setLoading(false);
      setSelectedRole(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/bridgeup-logo.png')}
            style={styles.bearImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>
            You can be both a student asking questions and a mentor helping others. 
            What would you like to do?
          </Text>
          <Text style={styles.warningText}>
            ⚠️ This choice cannot be changed later
          </Text>
        </View>

        {/* Role Options */}
        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'student' && styles.selectedCard,
              loading && selectedRole !== 'student' && styles.disabledCard
            ]}
            onPress={() => handleRoleSelection('student')}
            disabled={loading}
          >
            <View style={styles.roleIcon}>
              <Text style={styles.emoji}>🎓</Text>
            </View>
            <Text style={styles.roleTitle}>Student</Text>
            <Text style={styles.roleDescription}>
              Ask questions and get advice from college mentors
            </Text>
            {loading && selectedRole === 'student' && (
              <ActivityIndicator color="#FF6B6B" style={styles.loader} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'mentor' && styles.selectedCard,
              loading && selectedRole !== 'mentor' && styles.disabledCard
            ]}
            onPress={() => handleRoleSelection('mentor')}
            disabled={loading}
          >
            <View style={styles.roleIcon}>
              <Text style={styles.emoji}>🌟</Text>
            </View>
            <Text style={styles.roleTitle}>Mentor</Text>
            <Text style={styles.roleDescription}>
              Help fellow Georgetown students with your experience
            </Text>
            {loading && selectedRole === 'mentor' && (
              <ActivityIndicator color="#FF6B6B" style={styles.loader} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleCard,
              selectedRole === 'both' && styles.selectedCard,
              loading && selectedRole !== 'both' && styles.disabledCard
            ]}
            onPress={() => handleRoleSelection('both')}
            disabled={loading}
          >
            <View style={styles.roleIcon}>
              <Text style={styles.emoji}>💫</Text>
            </View>
            <Text style={styles.roleTitle}>Both</Text>
            <Text style={styles.roleDescription}>
              Ask questions when you need help, mentor others when you can
            </Text>
            {loading && selectedRole === 'both' && (
              <ActivityIndicator color="#FF6B6B" style={styles.loader} />
            )}
          </TouchableOpacity>
        </View>

            <Text style={styles.note}>
              
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F3',
  },
  content: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  bearImage: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C2C2E',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#48484A',
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'System',
  },
  roleContainer: {
    gap: 16,
    marginBottom: 30,
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  disabledCard: {
    opacity: 0.5,
  },
  roleIcon: {
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C2C2E',
    marginBottom: 8,
    fontFamily: 'System',
  },
  roleDescription: {
    fontSize: 14,
    color: '#48484A',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'System',
  },
  loader: {
    marginTop: 12,
  },
  note: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontFamily: 'System',
  },
  warningText: {
    fontSize: 14,
    color: '#FF6B6B',
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
    fontFamily: 'System',
  },
  
  // Scroll Container Styles
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 50,
    minHeight: '100%',
    justifyContent: 'center',
  },
});
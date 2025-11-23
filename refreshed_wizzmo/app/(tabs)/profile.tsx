import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
// Reanimated imports removed for build compatibility
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useRealTimeProfile } from '../../contexts/RealTimeProfileContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useUserMode } from '../../contexts/UserModeContext';
import CustomHeader from '@/components/CustomHeader';
import ModeToggle from '@/components/ModeToggle';
import VideoUploadModal from '@/components/VideoUploadModal';
import Avatar from '@/components/Avatar';
import PaywallManager from '@/components/PaywallManager';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as supabaseService from '../../lib/supabaseService';
import { supabase } from '../../lib/supabase';

// Mock data types
interface Question {
  id: string;
  text: string;
  category: string;
  status: 'pending' | 'active' | 'resolved';
  timestamp: Date;
}

interface FavoriteMentor {
  id: string;
  mentor_id: string;
  mentors: {
    full_name: string;
    avatar_url?: string;
  };
}

interface SubscriptionPlan {
  type: 'free_trial' | 'wizzmo_monthly' | 'wizzmo_annual';
  questionsRemaining: number;
  nextBillingDate?: Date;
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const {  user, loading } = useApp();
  const { updateProfile: updateRealtimeProfile, getProfile: getRealtimeProfile } = useRealTimeProfile();
  const insets = useSafeAreaInsets();
  const { user: authUser, signOut, updatePassword } = useAuth();
  const { subscriptionStatus, getQuestionsRemaining, isProUser, refreshSubscription, resetRevenueCatUser, customerInfo } = useSubscription();
  const { permissionStatus, requestPermissions } = useNotifications();
  const { currentMode, canSwitch } = useUserMode();

  // Debug what profile screen receives
  console.log('🔧 [Profile] canSwitch:', canSwitch, 'currentMode:', currentMode);

  // Real questions from Supabase
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(permissionStatus === 'granted');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [bioEditing, setBioEditing] = useState(false);
  const [bioText, setBioText] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editedName, setEditedName] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [editedUniversity, setEditedUniversity] = useState('');
  const [editedGradYear, setEditedGradYear] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [favoriteMentors, setFavoriteMentors] = useState<FavoriteMentor[]>([]);
  const [showVideoUploadModal, setShowVideoUploadModal] = useState(false);
  const [selectedVideoUri, setSelectedVideoUri] = useState<string | null>(null);

  // Fetch user profile from Supabase
  useEffect(() => {
    const fetchProfile = async () => {
      if (!authUser) return;

      try {
        const { data: profile } = await supabaseService.getUserProfile(authUser.id);
        if (profile) {
          setUserProfile(profile);
          setBioText(profile.bio || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [authUser]);

  // Update notifications enabled state when permission status changes
  useEffect(() => {
    setNotificationsEnabled(permissionStatus === 'granted');
  }, [permissionStatus]);

  // Fetch favorite wizzmos from database
  useEffect(() => {
    if (!authUser) return;

    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from('favorite_mentors')
        .select(`
          id,
          mentor_id,
          mentors:users!favorite_mentors_mentor_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('student_id', authUser.id);

      if (data) {
        setFavoriteMentors(data);
      }
    };

    fetchFavorites();
  }, [authUser]);

  // Fetch recent sessions from database
  useEffect(() => {
    if (!authUser) return;

    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('advice_sessions')
        .select(`
          *,
          questions (
            title,
            content,
            category_id,
            categories (name)
          )
        `)
        .eq('student_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setRecentSessions(data);
      }
    };

    fetchSessions();
  }, [authUser]);

  // Refresh function for pull-to-refresh
  const handleRefresh = async () => {
    if (!authUser) return;
    
    setRefreshing(true);
    console.log('🔄 [Profile] Refreshing profile data...');
    
    try {
      // Refresh user profile
      const { data: profile } = await supabaseService.getUserProfile(authUser.id);
      if (profile) {
        setUserProfile(profile);
        setBioText(profile.bio || '');
      }
      
      // Refresh recent sessions
      const { data: sessions } = await supabase
        .from('advice_sessions')
        .select(`
          *,
          questions (
            title,
            content,
            category_id,
            categories (name)
          )
        `)
        .eq('student_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (sessions) {
        setRecentSessions(sessions);
      }
      
      // Refresh subscription status
      await refreshSubscription();
      
      console.log('✅ [Profile] Profile refresh completed');
    } catch (error) {
      console.error('❌ [Profile] Error refreshing profile:', error);
      Alert.alert('Error', 'Failed to refresh profile data. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Real-time profile updates
  useEffect(() => {
    if (!authUser) return;

    // Set up real-time subscription for profile changes
    const profileSubscription = supabase
      .channel(`profile_${authUser.id}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${authUser.id}`
        }, 
        (payload) => {
          console.log('🔄 [Profile] Real-time profile update received:', payload.new);
          
          // Update local profile state with new data
          const updatedProfile = payload.new as any;
          setUserProfile(updatedProfile);
          setBioText(updatedProfile.bio || '');
          
          // Also update the real-time profile context
          updateRealtimeProfile(updatedProfile);
        }
      )
      .subscribe();

    console.log('📡 [Profile] Real-time subscription established for profile updates');

    return () => {
      console.log('📡 [Profile] Cleaning up real-time subscription');
      profileSubscription.unsubscribe();
    };
  }, [authUser?.id, updateRealtimeProfile]);

  // Get subscription info from real subscription context
  const subscription = {
    type: isProUser() ? (subscriptionStatus.plan === 'pro_monthly' ? 'pro_monthly' : 'pro_yearly') : 'free_trial',
    questionsRemaining: getQuestionsRemaining(),
  };

  // Stats from real data
  const stats = {
    questionsAsked: recentSessions.length,
    activeChats: recentSessions.filter(s => s.status === 'active').length,
    favoriteWizzmos: favoriteMentors.length,
  };

  // Loading state
  if (loading || loadingProfile) {
    return (
      <>
        <CustomHeader
          title="profile"
          showBackButton={false}
          showChatButton={true}
          showProfileButton={false}
          currentScreen="profile"
        />
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: colors.textSecondary }}>loading profile...</Text>
        </View>
      </>
    );
  }

  const handleEditProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Set initial values from current profile
    setEditedName(userProfile?.full_name || '');
    setEditedUsername(userProfile?.username || '');
    setEditedUniversity(userProfile?.university || '');
    setEditedGradYear(userProfile?.graduation_year?.toString() || '');
    setShowEditProfileModal(true);
  };

  // Check username availability with debouncing
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === userProfile?.username) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    
    try {
      const { data: isAvailable } = await supabaseService.checkUsernameAvailable(
        username, 
        authUser?.id
      );
      setUsernameAvailable(isAvailable ?? false);
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailable(false);
    } finally {
      setUsernameChecking(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!authUser) return;

    // Validate username if it was changed
    if (editedUsername !== userProfile?.username) {
      if (!usernameAvailable) {
        Alert.alert('error', 'username is not available or invalid');
        return;
      }
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const updates = {
        full_name: editedName,
        username: editedUsername,
        university: editedUniversity,
        graduation_year: parseInt(editedGradYear),
      };

      const { error } = await supabaseService.updateUserProfile(authUser.id, updates);

      if (error) {
        Alert.alert('error', 'failed to update profile');
        return;
      }

      // Update local state
      setUserProfile({ ...userProfile, ...updates });
      setShowEditProfileModal(false);
      setUsernameAvailable(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('success', 'profile updated!');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('error', 'something went wrong');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('error', 'please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('error', 'password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('error', 'passwords do not match');
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { error } = await updatePassword(newPassword);

      if (error) {
        Alert.alert('error', error.message);
        return;
      }

      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('success', 'password updated!');
    } catch (error) {
      console.error('Error updating password:', error);
      Alert.alert('error', 'something went wrong');
    }
  };

  const handleAvatarPress = async () => {
    if (!authUser) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('🖼️ [Profile] Starting avatar upload process');

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('🔐 [Profile] Permission status:', status);
    if (status !== 'granted') {
      Alert.alert('permission needed', 'please allow access to your photos to update your profile picture');
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    console.log('📸 [Profile] Image picker result:', { canceled: result.canceled, hasAssets: !!result.assets?.[0] });
    if (result.canceled || !result.assets[0]) return;

    const photo = result.assets[0];
    
    // Optimistic update - show new image immediately
    const currentProfile = getRealtimeProfile(authUser.id);
    const oldAvatarUrl = currentProfile?.avatar_url;
    updateRealtimeProfile(authUser.id, { avatar_url: photo.uri });
    setUserProfile(prev => ({ ...prev, avatar_url: photo.uri }));

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Upload with retry logic
      const uploadWithRetry = async (retries = 3): Promise<string> => {
        const fileExt = photo.uri.split('.').pop()?.toLowerCase() || 'jpeg';
        const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
        const filePath = `${authUser.id}/${fileName}`;

        // Map file extensions to proper MIME types
        const getMimeType = (ext: string): string => {
          switch (ext) {
            case 'jpg':
            case 'jpeg':
              return 'image/jpeg';
            case 'png':
              return 'image/png';
            case 'gif':
              return 'image/gif';
            case 'webp':
              return 'image/webp';
            default:
              return 'image/jpeg';
          }
        };

        const contentType = getMimeType(fileExt);

        console.log(`📁 [Profile] Upload attempt (${4 - retries}/3):`, { fileName, filePath, contentType });

        try {
          // Convert URI to ArrayBuffer for upload
          const response = await fetch(photo.uri);
          if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
          
          const arrayBuffer = await response.arrayBuffer();
          console.log('📦 [Profile] ArrayBuffer size:', arrayBuffer.byteLength);

          const { data, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, arrayBuffer, {
              contentType,
              upsert: true,
            });

          if (uploadError) throw uploadError;
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          return publicUrl;
        } catch (error) {
          if (retries > 0) {
            console.log(`🔄 [Profile] Upload failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
            return uploadWithRetry(retries - 1);
          }
          throw error;
        }
      };

      const publicUrl = await uploadWithRetry();
      console.log('✅ [Profile] Upload successful:', publicUrl);

      // Update database with retry logic
      const updateDatabaseWithRetry = async (retries = 3): Promise<void> => {
        try {
          const { error: updateError } = await supabase
            .from('users')
            .update({ avatar_url: publicUrl })
            .eq('id', authUser.id);

          if (updateError) throw updateError;
        } catch (error) {
          if (retries > 0) {
            console.log(`🔄 [Profile] Database update failed, retrying... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return updateDatabaseWithRetry(retries - 1);
          }
          throw error;
        }
      };

      await updateDatabaseWithRetry();
      console.log('✅ [Profile] Database updated successfully');

      // Add cache busting timestamp to force image refresh
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      
      // Update real-time profile with final URL (this will broadcast to all users)
      updateRealtimeProfile(authUser.id, { avatar_url: cacheBustedUrl });

      // Update local state with final URL
      setUserProfile(prev => ({ ...prev, avatar_url: cacheBustedUrl }));

      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('success', 'profile picture updated!');
      
    } catch (error) {
      console.error('💥 [Profile] Avatar update failed:', error);
      
      // Rollback optimistic update
      updateRealtimeProfile(authUser.id, { avatar_url: oldAvatarUrl });
      setUserProfile(prev => ({ ...prev, avatar_url: oldAvatarUrl }));
      
      // Error feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // User-friendly error messages
      let errorMessage = 'there was an issue updating your profile picture. please try again.';
      if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'network error. please check your connection and try again.';
      } else if (error.message?.includes('storage')) {
        errorMessage = 'upload failed. please try again or use a smaller image.';
      }
      
      Alert.alert('upload failed', errorMessage);
    }
  };

  const handleQuestionPress = (question: Question) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (question.status === 'active') {
      router.push(`/chat?chatId=${question.id}`);
    } else {
      Alert.alert('view question', question.text);
    }
  };

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowPaywall(true);
  };

  const handlePostVideo = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'post video',
      'choose how you want to create your video',
      [
        { text: 'cancel', style: 'cancel' },
        { text: 'camera', onPress: () => recordVideo() },
        { text: 'gallery', onPress: () => pickVideoFromGallery() },
      ]
    );
  };

  const recordVideo = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('permission needed', 'camera access is required to record videos');
        return;
      }

      // For now, use ImagePicker for video recording since it's simpler
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [9, 16], // Vertical video like TikTok
        quality: 0.8,
        videoMaxDuration: 60, // 1 minute max
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedVideoUri(result.assets[0].uri);
        setShowVideoUploadModal(true);
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('error', 'failed to record video. please try again.');
    }
  };

  const pickVideoFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        aspect: [9, 16],
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedVideoUri(result.assets[0].uri);
        setShowVideoUploadModal(true);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('error', 'failed to select video. please try again.');
    }
  };

  const handleVideoUploadSuccess = () => {
    Alert.alert('video posted!', 'your video has been posted and will appear in the student feed.');
  };

  const handleSignOut = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'sign out',
      'are you sure you want to sign out?',
      [
        { text: 'cancel', style: 'cancel' },
        { text: 'sign out', style: 'default', onPress: async () => {
          try {
            await signOut();
            router.replace('/auth');
          } catch (error) {
            console.error('Sign out error:', error);
            Alert.alert('error', 'failed to sign out');
          }
        }},
      ]
    );
  };

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'delete account',
      'this will permanently delete your account and all your data. this action cannot be undone.',
      [
        { text: 'cancel', style: 'cancel' },
        { 
          text: 'delete account', 
          style: 'destructive', 
          onPress: () => {
            // Second confirmation for critical action
            Alert.alert(
              'final confirmation',
              'are you absolutely sure? your account, messages, questions, and all data will be permanently deleted.',
              [
                { text: 'cancel', style: 'cancel' },
                { 
                  text: 'yes, delete everything', 
                  style: 'destructive', 
                  onPress: performAccountDeletion 
                }
              ]
            );
          }
        }
      ]
    );
  };

  const performAccountDeletion = async () => {
    try {
      // Show loading state
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      if (!authUser?.id) {
        throw new Error('No user ID found');
      }

      // Delete user data from Supabase
      console.log('🗑️ Starting account deletion for user:', authUser.id);
      
      // Use database function to handle complete account deletion (including auth user)
      console.log('🔧 Calling database function to delete account completely...');
      
      const { data: deletionResult, error: deletionError } = await supabase.rpc('delete_user_account', {
        user_id_to_delete: authUser.id
      });

      if (deletionError) {
        console.error('❌ Database deletion function failed:', deletionError);
        throw new Error('Failed to delete user account: ' + deletionError.message);
      }

      if (!deletionResult) {
        console.error('❌ Database function returned false - deletion failed');
        throw new Error('Account deletion was not successful');
      }

      console.log('✅ Account deletion completed successfully');

      // Auth user has been deleted by the database function, so we just need to clear local session
      await supabase.auth.signOut({ scope: 'local' });

      // Navigate to auth screen
      router.replace('/auth');
      
      Alert.alert(
        'account deleted',
        'your account and all data have been permanently deleted. thank you for using wizzmo.'
      );
    } catch (error) {
      console.error('Account deletion error:', error);
      Alert.alert(
        'error',
        'failed to delete account. please try again or contact support.'
      );
    }
  };

  const getStatusBadgeColor = (status: Question['status']) => {
    switch (status) {
      case 'pending':
        return colors.warning;
      case 'active':
        return colors.primary;
      case 'resolved':
        return colors.success;
      default:
        return colors.textTertiary;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  return (
    <>
      <CustomHeader
        title="profile"
        showBackButton={false}
        showChatButton={true}
        showProfileButton={false}
        currentScreen="profile"
        rightActions={
          <>
            <ModeToggle showText={false} />
          </>
        }
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            title="Pull to refresh"
            titleColor={colors.textSecondary}
          />
        }
      >
        <View style={{ height: insets.top + 100 }} />
        <View style={[styles.content, { backgroundColor: colors.background }]}>

          {/* Profile Header Section */}
          <View style={styles.section}>
            <View style={[styles.profileHeader, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.avatarContainer}>
                <Avatar
                  name={userProfile?.full_name || userProfile?.username || user?.name || 'You'}
                  imageUrl={userProfile?.avatar_url}
                  size="xlarge"
                  showEditButton={true}
                  onPress={handleAvatarPress}
                />
              </View>

              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {userProfile?.full_name || userProfile?.username || user?.name || 'your profile'}
                </Text>
                <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
                  @{userProfile?.username || 'you'}
                </Text>
                <Text style={[styles.profileUniversity, { color: colors.textSecondary }]}>
                  {userProfile?.university || 'your university'} {userProfile?.graduation_year ? `• class of ${userProfile.graduation_year}` : ''}
                </Text>
              </View>

              <View style={styles.bioContainer}>
                {bioEditing ? (
                  <TextInput
                    style={[styles.bioInput, {
                      color: colors.text,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                    }]}
                    value={bioText}
                    onChangeText={setBioText}
                    multiline
                    onBlur={async () => {
                      setBioEditing(false);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                      // Save bio to Supabase
                      if (authUser) {
                        await supabaseService.updateUserProfile(authUser.id, { bio: bioText });
                      }
                    }}
                    autoFocus
                  />
                ) : (
                  <TouchableOpacity onPress={() => {
                    setBioEditing(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}>
                    <Text style={[styles.bioText, { color: colors.textSecondary }]}>
                      {bioText || 'tap to add a bio...'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditProfile}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.editButtonGradient}
                >
                  <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.editButtonText}>edit profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Current Mode Section */}
          {canSwitch && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                current mode
              </Text>
              
              <View style={[styles.modeCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={styles.modeInfo}>
                  <View style={styles.modeIconContainer}>
                    <Ionicons 
                      name={currentMode === 'student' ? 'school' : 'people'} 
                      size={32} 
                      color={currentMode === 'student' ? colors.primary : colors.success} 
                    />
                  </View>
                  <View style={styles.modeDetails}>
                    <Text style={[styles.modeTitle, { color: colors.text }]}>
                      {currentMode} mode
                    </Text>
                    <Text style={[styles.modeDescription, { color: colors.textSecondary }]}>
                      {currentMode === 'student' 
                        ? 'you can ask questions and get advice'
                        : 'you can provide advice and help other students'
                      }
                    </Text>
                  </View>
                  <ModeToggle showText={true} />
                </View>
              </View>
            </View>
          )}

          {/* Post Video Section - Mentor Mode Only */}
          {currentMode === 'mentor' && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                content creation
              </Text>
              
              <TouchableOpacity
                style={[styles.postVideoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                onPress={handlePostVideo}
                activeOpacity={0.8}
              >
                <View style={styles.postVideoContent}>
                  <View style={[styles.postVideoIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="videocam" size={28} color={colors.primary} />
                  </View>
                  
                  <View style={styles.postVideoText}>
                    <Text style={[styles.postVideoTitle, { color: colors.text }]}>
                      post video
                    </Text>
                    <Text style={[styles.postVideoDescription, { color: colors.textSecondary }]}>
                      share your advice with students. videos help them get to know you better and increase requests.
                    </Text>
                  </View>
                  
                  <View style={styles.postVideoArrow}>
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Stats Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              stats
            </Text>

            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {stats.questionsAsked}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  questions asked
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {stats.activeChats}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  active chats
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.statValue, { color: colors.primary }]}>
                  {stats.favoriteMentors}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  favorite wizzmos
                </Text>
              </View>
            </View>
          </View>

          {/* Subscription Status */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              subscription
            </Text>

            <View style={[styles.subscriptionCard, { 
              backgroundColor: colors.surfaceElevated, 
              borderColor: isProUser() ? colors.primary : colors.border,
              shadowColor: colorScheme === 'dark' ? colors.primary : '#000000',
            }]}>
              <View style={styles.subscriptionHeader}>
                <View style={styles.subscriptionInfo}>
                  <View style={[styles.subscriptionBadge, { 
                    backgroundColor: isProUser() ? colors.primary : colors.border 
                  }]}>
                    <Text style={[styles.subscriptionBadgeText, { 
                      color: isProUser() ? '#FFFFFF' : colors.textSecondary 
                    }]}>
                      {isProUser() ? 'pro' : 'free'}
                    </Text>
                  </View>
                  <Text style={[styles.subscriptionType, { color: colors.text }]}>
                    {subscription.type === 'free_trial' ? 'free trial' : 
                     subscription.type === 'pro_monthly' ? 'bridge up pro monthly' : 
                     subscription.type === 'pro_yearly' ? 'bridge up pro yearly' : 'bridge up pro'}
                  </Text>
                  <Text style={[styles.subscriptionSubtext, { color: colors.textSecondary }]}>
                    {subscription.questionsRemaining === -1 ? 'unlimited questions • priority support' : 
                     `${subscription.questionsRemaining} ${subscription.questionsRemaining === 1 ? 'question' : 'questions'} remaining this month`}
                  </Text>
                </View>
                <View style={[styles.subscriptionIcon, { 
                  backgroundColor: isProUser() ? `${colors.primary}15` : `${colors.border}30` 
                }]}>
                  {subscription.type === 'free_trial' ? (
                    <Ionicons name="gift-outline" size={28} color={colors.primary} />
                  ) : (
                    <Ionicons name="diamond" size={28} color={colors.primary} />
                  )}
                </View>
              </View>

              {isProUser() && subscriptionStatus.billingPeriodEnd && (
                <View style={[styles.subscriptionDetails, { 
                  backgroundColor: colors.background,
                  borderTopColor: colors.separator, 
                  borderTopWidth: 1 
                }]}>
                  <View style={[styles.subscriptionDetailRow, { backgroundColor: 'transparent' }]}>
                    <Text style={[styles.subscriptionDetailLabel, { color: colors.textSecondary }]}>
                      status
                    </Text>
                    <View style={styles.statusContainer}>
                      <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
                      <Text style={[styles.subscriptionDetailValue, { color: colors.text }]}>
                        active
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.subscriptionDetailRow, { backgroundColor: 'transparent' }]}>
                    <Text style={[styles.subscriptionDetailLabel, { color: colors.textSecondary }]}>
                      renews on
                    </Text>
                    <Text style={[styles.subscriptionDetailValue, { color: colors.text }]}>
                      {subscriptionStatus.billingPeriodEnd.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              )}


              {subscription.type === 'free_trial' && (
                <View style={[styles.upgradeSection, { backgroundColor: colors.background, borderTopColor: colors.separator, borderTopWidth: 1 }]}>
                  <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={handleUpgrade}
                  >
                    <LinearGradient
                      colors={colors.gradientPrimary}
                      style={styles.upgradeButtonGradient}
                    >
                      <Text style={styles.upgradeButtonText}>unlock unlimited ✨</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* My Questions Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              my questions
            </Text>

            {recentSessions.length > 0 ? (
            <View style={[styles.questionsList, { borderColor: colors.border }]}>
              {recentSessions.map((session, index) => {
                const categoryName = session.questions?.categories?.name || 'General';
                const questionTitle = session.questions?.title && session.questions.title.trim() !== ''
                  ? session.questions.title
                  : session.questions?.content?.substring(0, 50) || 'Chat Session';

                return (
                <View
                  key={session.id}
                  style={{}}
                >
                  <TouchableOpacity
                    style={[
                      styles.questionItem,
                      { borderBottomColor: colors.separator },
                      index === recentSessions.length - 1 && { borderBottomWidth: 0 },
                    ]}
                    onPress={() => router.push(`/chat?chatId=${session.id}`)}
                  >
                    <View style={styles.questionContent}>
                      <View style={styles.questionHeader}>
                        <Text style={[styles.categoryBadge, { color: colors.textSecondary }]}>
                          {categoryName}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusBadgeColor(session.status) }]}>
                          <Text style={styles.statusBadgeText}>{session.status}</Text>
                        </View>
                      </View>
                      <Text style={[styles.questionText, { color: colors.text }]} numberOfLines={2}>
                        {questionTitle}
                      </Text>
                      <Text style={[styles.questionTimestamp, { color: colors.textTertiary }]}>
                        {formatTimeAgo(new Date(session.created_at))}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
                );
              })}
            </View>
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  no questions yet. tap the ask button to get started!
                </Text>
              </View>
            )}
          </View>

          {/* Favorite Advisors Section */}
          {favoriteMentors.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                favorite wizzmos
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.favoritesScrollContent}
              >
                {favoriteMentors.map((favorite) => (
                  <TouchableOpacity
                    key={favorite.id}
                    style={[styles.favoriteCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/wizzmo-profile?userId=${favorite.mentor_id}`);
                    }}
                  >
                    <View style={[styles.favoriteAvatar, { backgroundColor: colors.primary }]}>
                      <Text style={styles.favoriteInitial}>
                        {favorite.mentors?.full_name?.charAt(0).toUpperCase() || 'W'}
                      </Text>
                    </View>
                    <Text style={[styles.favoriteName, { color: colors.text }]} numberOfLines={1}>
                      {favorite.mentors?.full_name || 'Wizzmo'}
                    </Text>
                    <Ionicons name="heart" size={16} color="#FF4DB8" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              settings
            </Text>

            <View style={[styles.settingsList, { borderColor: colors.border }]}>
              {/* Account Settings */}
              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.separator }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Alert.alert('email', userProfile?.email || authUser?.email || 'no email set');
                }}
              >
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>email</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    {userProfile?.email || authUser?.email || 'no email set'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>

              {/* Only show change password for email/password users, not OAuth users */}
              {authUser?.app_metadata?.provider === 'email' && (
                <TouchableOpacity
                  style={[styles.settingItem, { borderBottomColor: colors.separator }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPasswordModal(true);
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>password</Text>
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                      change password
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}

              {/* Notification Preferences */}
              <View style={[styles.settingItem, { borderBottomColor: colors.separator }]}>
                <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>notifications</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    push notifications
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={async (value) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                    if (value) {
                      // Request permissions
                      const granted = await requestPermissions();
                      setNotificationsEnabled(granted);
                      if (!granted) {
                        Alert.alert(
                          'notifications disabled',
                          'please enable notifications in your device settings to receive updates'
                        );
                      }
                    } else {
                      // Can't revoke permissions programmatically, show alert
                      Alert.alert(
                        'disable notifications',
                        'to disable notifications, please go to your device settings',
                        [{ text: 'ok', style: 'default' }]
                      );
                    }
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Privacy Settings */}
              <View style={[styles.settingItem, { borderBottomColor: colors.separator }]}>
                <Ionicons name="shield-outline" size={20} color={colors.textSecondary} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>privacy mode</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    hide profile from search
                  </Text>
                </View>
                <Switch
                  value={privacyMode}
                  onValueChange={(value) => {
                    setPrivacyMode(value);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Subscription Management */}
              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.separator }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/subscription');
                }}
              >
                <Ionicons name="card-outline" size={20} color={colors.textSecondary} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>manage subscription</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    plans & billing
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>

              {/* Help & Support */}
              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.separator }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/help');
                }}
              >
                <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>help & support</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    get help
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>

              {/* Delete Account */}
              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.separator }]}
                onPress={handleDeleteAccount}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.danger }]}>delete account</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                    permanently delete all data
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>

              {/* Sign Out */}
              <TouchableOpacity
                style={[styles.settingItem, { borderBottomWidth: 0 }]}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.danger }]}>sign out</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom padding for tab bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowPasswordModal(false)}
          />
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>change password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: colors.text }]}>new password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  placeholder="min 8 characters"
                  placeholderTextColor={colors.textTertiary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: colors.text }]}>confirm password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  placeholder="re-enter password"
                  placeholderTextColor={colors.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleChangePassword}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>update password</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEditProfileModal(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEditProfileModal(false)}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalKeyboardView}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>edit profile</Text>
                <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView 
                style={styles.modalBody} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: colors.text }]}>full name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  placeholder="your name"
                  placeholderTextColor={colors.textTertiary}
                  value={editedName}
                  onChangeText={setEditedName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: colors.text }]}>username</Text>
                <View style={styles.usernameInputContainer}>
                  <TextInput
                    style={[
                      styles.input, 
                      { 
                        backgroundColor: colors.surfaceElevated, 
                        color: colors.text, 
                        borderColor: usernameAvailable === true ? colors.success : 
                                   usernameAvailable === false ? colors.danger : colors.border,
                        flex: 1
                      }
                    ]}
                    placeholder="username"
                    placeholderTextColor={colors.textTertiary}
                    value={editedUsername}
                    onChangeText={(text) => {
                      setEditedUsername(text);
                      // Debounced username check
                      clearTimeout((global as any).usernameTimeout);
                      (global as any).usernameTimeout = setTimeout(() => {
                        checkUsernameAvailability(text);
                      }, 500);
                    }}
                    autoCapitalize="none"
                  />
                  {usernameChecking && (
                    <View style={styles.usernameStatus}>
                      <Text style={[styles.usernameStatusText, { color: colors.textSecondary }]}>
                        checking...
                      </Text>
                    </View>
                  )}
                  {!usernameChecking && usernameAvailable === true && (
                    <View style={styles.usernameStatus}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={[styles.usernameStatusText, { color: colors.success }]}>
                        available
                      </Text>
                    </View>
                  )}
                  {!usernameChecking && usernameAvailable === false && (
                    <View style={styles.usernameStatus}>
                      <Ionicons name="close-circle" size={16} color={colors.danger} />
                      <Text style={[styles.usernameStatusText, { color: colors.danger }]}>
                        taken
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: colors.text }]}>university</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  placeholder="your university"
                  placeholderTextColor={colors.textTertiary}
                  value={editedUniversity}
                  onChangeText={setEditedUniversity}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={[styles.label, { color: colors.text }]}>graduation year</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surfaceElevated, color: colors.text, borderColor: colors.border }]}
                  placeholder="2025"
                  placeholderTextColor={colors.textTertiary}
                  value={editedGradYear}
                  onChangeText={setEditedGradYear}
                  keyboardType="number-pad"
                />
              </View>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleSaveProfile}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.modalButtonGradient}
                >
                  <Text style={styles.modalButtonText}>save changes</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Paywall Manager with A/B Testing */}
      <PaywallManager 
        visible={showPaywall} 
        onClose={() => setShowPaywall(false)}
        variant="auto" // Let the system choose the best variant
      />

      {/* Video Upload Modal */}
      {selectedVideoUri && (
        <VideoUploadModal
          visible={showVideoUploadModal}
          onClose={() => {
            setShowVideoUploadModal(false);
            setSelectedVideoUri(null);
          }}
          videoUri={selectedVideoUri}
          mentorId={authUser?.id || ''}
          onUploadSuccess={handleVideoUploadSuccess}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 12,
    textTransform: 'lowercase',
  },

  // Profile Header
  profileHeader: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  profileUsername: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  profileUniversity: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
  bioContainer: {
    marginBottom: 16,
  },
  bioText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  bioInput: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 0,
    padding: 12,
    minHeight: 80,
    letterSpacing: -0.1,
  },
  editButton: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  editButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },

  // Subscription Card
  subscriptionCard: {
    borderWidth: 2,
    borderRadius: 0,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 4,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
  },
  subscriptionInfo: {
    flex: 1,
    marginRight: 16,
  },
  subscriptionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  subscriptionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subscriptionType: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 6,
    textTransform: 'lowercase',
  },
  subscriptionSubtext: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 20,
    textTransform: 'lowercase',
  },
  subscriptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscriptionDetails: {
    padding: 20,
  },
  subscriptionDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
  subscriptionDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 0,
  },
  upgradeSection: {
    padding: 20,
  },
  upgradeButton: {
    borderRadius: 0,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    textTransform: 'lowercase',
  },

  // Debug styles
  debugSection: {
    padding: 16,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 0,
  },
  debugButtonText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
    marginLeft: 6,
  },

  // Questions List
  questionsList: {
    borderWidth: 1,
    borderRadius: 0,
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  questionContent: {
    flex: 1,
    marginRight: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 0,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  questionTimestamp: {
    fontSize: 12,
    fontWeight: '400',
    textTransform: 'lowercase',
  },

  // Wizzmo Grid
  // Favorite Wizzmos
  favoritesScrollContent: {
    gap: 12,
  },
  favoriteCard: {
    width: 100,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 0,
    alignItems: 'center',
    gap: 8,
  },
  favoriteAvatar: {
    width: 56,
    height: 56,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  favoriteName: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  followMoreCard: {
    width: '48%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 0,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  followMoreText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    textTransform: 'lowercase',
  },

  // Settings List
  settingsList: {
    borderWidth: 1,
    borderRadius: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
    textTransform: 'lowercase',
  },
  settingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },

  // Empty State
  emptyState: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalKeyboardView: {
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderColor: '#FF4DB8',
    maxHeight: '80%',
    minHeight: '60%',
    shadowColor: '#FF4DB8',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 20,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#FF4DB8',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  },
  modalBody: {
    padding: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: -0.3,
    textTransform: 'lowercase',
  },
  input: {
    borderWidth: 2,
    borderRadius: 0,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    letterSpacing: -0.1,
    fontWeight: '500',
    minHeight: 56,
  },
  modalButton: {
    borderRadius: 0,
    overflow: 'hidden',
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#FF4DB8',
  },
  modalButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textTransform: 'lowercase',
  },

  // Username validation styles
  usernameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  usernameStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 0,
    minWidth: 100,
    justifyContent: 'center',
  },
  usernameStatusText: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'lowercase',
    letterSpacing: -0.1,
  },

  // Mode Toggle Styles
  modeCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modeIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeDetails: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  modeDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
  
  // Post Video Section
  postVideoCard: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
  },
  postVideoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postVideoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  postVideoText: {
    flex: 1,
  },
  postVideoTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  postVideoDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },
  postVideoArrow: {
    marginLeft: 12,
  },
});

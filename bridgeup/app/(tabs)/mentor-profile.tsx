import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CustomHeader from '@/components/CustomHeader';
import Avatar from '@/components/Avatar';
import ModeToggle from '@/components/ModeToggle';
import { useUserMode } from '@/contexts/UserModeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import * as supabaseService from '@/lib/supabaseService';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
// Reanimated imports removed for build compatibility
import { supabase } from '@/lib/supabase';

export default function MentorProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();
  const { user: authUser, signOut: authSignOut, updatePassword } = useAuth();
  const { permissionStatus, requestPermissions } = useNotifications();
  const { subscriptionStatus, getQuestionsRemaining, isProUser } = useSubscription();
  const { currentMode, canSwitch } = useUserMode();

  const [isAvailable, setIsAvailable] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(permissionStatus === 'granted');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [bioEditing, setBioEditing] = useState(false);
  const [bioText, setBioText] = useState('');
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [editedName, setEditedName] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [editedUniversity, setEditedUniversity] = useState('');
  const [editedGradYear, setEditedGradYear] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);

  // Real questions from Supabase
  const [recentSessions, setRecentSessions] = useState<any[]>([]);

  // Mentor-specific stats
  const [mentorStats, setMentorStats] = useState({
    questions_answered: 0,
    average_rating: 0,
    helpful_percentage: 0,
  });

  useEffect(() => {
    fetchProfileData();
  }, [authUser]);


  // Fetch answered sessions from database (for mentors)
  useEffect(() => {
    if (!authUser) return;

    const fetchAnsweredSessions = async () => {
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
        .eq('mentor_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (data) {
        setRecentSessions(data);
      }
    };

    fetchAnsweredSessions();
  }, [authUser]);

  useEffect(() => {
    setNotificationsEnabled(permissionStatus === 'granted');
  }, [permissionStatus]);

  const getStatusBadgeColor = (status: string) => {
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

  // Refetch profile data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[MentorProfile] Screen focused, refetching profile data...');
      if (authUser) {
        fetchProfileData();
      }
    }, [authUser])
  );

  const fetchProfileData = async () => {
    if (!authUser) return;

    try {
      // Fetch user profile
      const { data: profile } = await supabaseService.getUserProfile(authUser.id);
      if (profile) {
        setUserProfile(profile);
        setBioText(profile.bio || '');

        // Fetch mentor stats
        if (profile.mentor_profile) {
          const { total_questions_answered, average_rating, total_helpful_votes } = profile.mentor_profile;
          const helpfulPercentage = total_questions_answered > 0
            ? Math.round((total_helpful_votes / total_questions_answered) * 100)
            : 0;

          setMentorStats({
            questions_answered: total_questions_answered,
            average_rating: average_rating,
            helpful_percentage: helpfulPercentage,
          });
        }
      }
    } catch (error) {
      console.error('[MentorProfile] Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
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
  };

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('🖼️ [MentorProfile] Starting avatar upload process');

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('🔐 [MentorProfile] Permission status:', status);
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

    console.log('📸 [MentorProfile] Image picker result:', { canceled: result.canceled, hasAssets: !!result.assets?.[0] });
    if (result.canceled || !result.assets[0]) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Upload to Supabase Storage
      const photo = result.assets[0];
      const fileExt = photo.uri.split('.').pop()?.toLowerCase() || 'jpeg';
      const fileName = `${authUser?.id}-${Date.now()}.${fileExt}`;
      const filePath = `${authUser?.id}/${fileName}`;

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

      console.log('📁 [MentorProfile] Upload details:', { fileName, filePath, fileExt, contentType, userId: authUser?.id });

      // Convert URI to ArrayBuffer for upload
      const response = await fetch(photo.uri);
      const arrayBuffer = await response.arrayBuffer();
      console.log('📦 [MentorProfile] ArrayBuffer size:', arrayBuffer.byteLength);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error('☁️ [MentorProfile] Upload error:', uploadError);
        throw uploadError;
      }
      console.log('✅ [MentorProfile] Upload successful');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      console.log('🔗 [MentorProfile] Public URL:', publicUrl);

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', authUser?.id);

      if (updateError) {
        console.error('💾 [MentorProfile] Database update error:', updateError);
        throw updateError;
      }
      console.log('✅ [MentorProfile] Database updated');

      // Update local state
      setUserProfile(prev => ({ ...prev, avatar_url: publicUrl }));

      // Refresh profile data to ensure UI updates
      setTimeout(async () => {
        try {
          await fetchProfileData();
          console.log('🔄 [MentorProfile] Profile refreshed after upload');
        } catch (error) {
          console.error('🔄 [MentorProfile] Error refreshing profile:', error);
        }
      }, 500);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('success', 'profile picture updated!');
    } catch (error) {
      console.error('[MentorProfile] Error uploading avatar:', error);
      Alert.alert('error', 'failed to upload photo. please try again.');
    }
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
        quality: 0.5, // Lower quality for smaller file size
        videoMaxDuration: 30, // 30 seconds max for better UX and smaller files
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadVideo(result.assets[0].uri);
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
        quality: 0.5, // Lower quality for smaller file size
        videoMaxDuration: 30, // 30 seconds max for better UX and smaller files
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadVideo(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('error', 'failed to select video. please try again.');
    }
  };

  const uploadVideo = async (videoUri: string) => {
    try {
      if (!authUser) {
        Alert.alert('error', 'you must be logged in to post videos');
        return;
      }

      // Prompt for video details
      Alert.prompt(
        'video title',
        'enter a title for your video:',
        (title) => {
          if (title) {
            Alert.prompt(
              'video description',
              'enter a description for your video:',
              async (description) => {
                if (description) {
                  try {
                    // Check file size before upload
                    const fileInfo = await fetch(videoUri);
                    const fileSize = parseInt(fileInfo.headers.get('content-length') || '0');
                    const fileSizeMB = fileSize / (1024 * 1024);
                    
                    console.log(`[uploadVideo] Video file size: ${fileSizeMB.toFixed(2)}MB`);
                    
                    // Warn if file is large (>50MB is usually too big for Supabase)
                    if (fileSizeMB > 50) {
                      Alert.alert(
                        'video too large',
                        `this video is ${fileSizeMB.toFixed(1)}MB which is too large. please record a shorter video or try again with lower quality.`,
                        [{ text: 'OK' }]
                      );
                      return;
                    }

                    // Show loading state
                    Alert.alert('uploading...', 'your video is being uploaded. this may take a moment.');

                    const { data, error } = await supabaseService.uploadMentorVideo(
                      authUser.id,
                      videoUri,
                      title,
                      description
                    );

                    if (error) {
                      console.error('Error uploading video:', error);
                      
                      // Provide specific error messages for common issues
                      let errorMessage = 'failed to upload video. please try again.';
                      if (error.message?.includes('exceeded the maximum allowed size')) {
                        errorMessage = 'video file is too large. please record a shorter video or select a different one. videos are limited to 30 seconds.';
                      } else if (error.message?.includes('network')) {
                        errorMessage = 'network error. please check your connection and try again.';
                      } else if (error.message) {
                        errorMessage = error.message;
                      }
                      
                      Alert.alert('upload failed', errorMessage);
                      return;
                    }

                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    Alert.alert(
                      'video posted!', 
                      'your video has been posted and will appear in the student feed.'
                    );
                  } catch (error) {
                    console.error('Error uploading video:', error);
                    Alert.alert('upload failed', 'failed to upload video. please try again.');
                  }
                }
              },
              'plain-text'
            );
          }
        },
        'plain-text'
      );
    } catch (error) {
      console.error('Error uploading video:', error);
      Alert.alert('upload failed', 'failed to upload video. please check your connection and try again.');
    }
  };

  const handleSignOut = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'sign out',
      'are you sure you want to sign out?',
      [
        { text: 'cancel', style: 'cancel' },
        {
          text: 'sign out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authSignOut();
              router.replace('/auth');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('error', 'failed to sign out');
            }
          }
        },
      ]
    );
  };


  if (loading) {
    return (
      <>
        <CustomHeader
          title="profile"
          showBackButton={false}
          showChatButton={false}
          showProfileButton={false}
        />
        <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: colors.textSecondary }}>loading profile...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <CustomHeader
        title="profile"
        showBackButton={false}
        showChatButton={false}
        showProfileButton={false}
      />

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 100 }} />
        <View style={[styles.content, { backgroundColor: colors.background }]}>

          {/* Profile Header Section */}
          <View style={styles.section}>
            <View style={[styles.profileHeader, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <View style={styles.avatarContainer}>
                <Avatar
                  name={userProfile?.full_name || userProfile?.username || 'You'}
                  imageUrl={userProfile?.avatar_url}
                  size="xlarge"
                  showEditButton={true}
                  onPress={handleAvatarPress}
                />
              </View>

              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>
                  {userProfile?.full_name || userProfile?.username || 'your profile'}
                </Text>
                <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
                  @{userProfile?.username || 'you'}
                </Text>
                <Text style={[styles.profileUniversity, { color: colors.textSecondary }]}>
                  {userProfile?.university || 'your university'} {userProfile?.graduation_year ? `• class of ${userProfile.graduation_year}` : ''}
                </Text>
                <View style={[styles.verifiedBadge, { backgroundColor: colors.surface }]}>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={[styles.verifiedText, { color: colors.text }]}>verified advisor</Text>
                </View>
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

          {/* View Public Profile Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              mentor profile
            </Text>

            <View style={[styles.subscriptionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  console.log('🔄 Navigating to public profile for user:', authUser?.id);
                  router.push(`/bridgeup-profile?userId=${authUser?.id}&forcePublic=true`);
                }}
              >
                <LinearGradient
                  colors={colors.gradientPrimary}
                  style={styles.upgradeButtonGradient}
                >
                  <Text style={styles.upgradeButtonText}>view public profile</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Post Video Section - Always show for mentor profile */}
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

          {/* Questions Answered Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              questions answered
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
                  no questions answered yet. check your inbox for new questions!
                </Text>
              </View>
            )}
          </View>


          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>settings</Text>

            <View style={[styles.settingsList, { borderColor: colors.border }]}>
              {/* Email */}
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

              {/* Password - Only show for email/password users */}
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
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>change password</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                </TouchableOpacity>
              )}

              {/* Notifications */}
              <View style={[styles.settingItem, { borderBottomColor: colors.separator }]}>
                <Ionicons name="notifications-outline" size={20} color={colors.textSecondary} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>notifications</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>push notifications</Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
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
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>get help</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
              </TouchableOpacity>

              {/* Sign Out */}
              <TouchableOpacity
                style={[styles.settingItem, { borderBottomWidth: 0 }]}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={20} color={colors.danger || colors.error} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.danger || colors.error }]}>sign out</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom padding */}
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
                                     usernameAvailable === false ? (colors.danger || colors.error) : colors.border,
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
                        <Ionicons name="close-circle" size={16} color={colors.danger || colors.error} />
                        <Text style={[styles.usernameStatusText, { color: colors.danger || colors.error }]}>
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
    marginBottom: 8,
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

  // Profile Card
  profileCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  university: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
    gap: 4,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Edit Button
  editButton: {
    borderRadius: 0,
    overflow: 'hidden',
    marginTop: 16,
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

  // Availability Card
  availabilityCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    marginBottom: 20,
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availabilityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  availabilityText: {
    flex: 1,
  },
  availabilityTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  availabilitySubtitle: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 4,
  },

  // Section
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

  // Bio Container
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

  // Actions List
  actionsList: {
    borderWidth: 1,
    borderRadius: 0,
    marginBottom: 20,
  },
  actionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
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
  },
  settingSubtitle: {
    fontSize: 14,
    fontWeight: '400',
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

  // View Public Profile Button
  upgradeButton: {
    borderRadius: 0,
    overflow: 'hidden',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#FF4DB8',
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
    borderWidth: 1,
    borderRadius: 0,
    overflow: 'hidden',
  },
  postVideoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  postVideoIcon: {
    width: 56,
    height: 56,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
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
    padding: 4,
  },
});

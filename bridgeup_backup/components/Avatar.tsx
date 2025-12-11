import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ActionSheetIOS, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { uploadAvatar, takePhoto, pickImageFromLibrary } from '@/lib/imageUpload';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  onPress?: () => void;
  showEditButton?: boolean;
  userId?: string; // User ID for uploading avatar
  onAvatarUpdate?: (newUrl: string) => void; // Callback when avatar is updated
}

export default function Avatar({
  name,
  imageUrl,
  size = 'medium',
  onPress,
  showEditButton = false,
  userId,
  onAvatarUpdate,
}: AvatarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl);
  const [isUploading, setIsUploading] = useState(false);

  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 80,
  };

  const fontSizeMap = {
    small: 14,
    medium: 18,
    large: 24,
    xlarge: 32,
  };

  const avatarSize = sizeMap[size];
  const fontSize = fontSizeMap[size];

  // Update currentImageUrl when imageUrl prop changes
  useEffect(() => {
    const stripTimestamp = (url: string | undefined) => {
      if (!url) return url;
      return url.split('?t=')[0];
    };
    
    const baseImageUrl = stripTimestamp(imageUrl);
    const baseCurrentUrl = stripTimestamp(currentImageUrl);
    
    if (baseImageUrl !== baseCurrentUrl) {
      const cacheBustedUrl = imageUrl ? `${imageUrl}?t=${Date.now()}` : imageUrl;
      setCurrentImageUrl(cacheBustedUrl);
      console.log('🔄 [Avatar] Image URL updated:', { old: currentImageUrl, new: cacheBustedUrl });
    }
  }, [imageUrl]); // Only depend on imageUrl prop, not currentImageUrl state

  const getInitials = (fullName: string) => {
    if (!fullName || typeof fullName !== 'string') {
      return '?';
    }
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(name);

  const handleImageUpload = async (imageUri: string) => {
    if (!userId) {
      Alert.alert('Error', 'User ID is required to upload avatar');
      return;
    }

    setIsUploading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await uploadAvatar(imageUri, userId);

      if (result.success && result.url) {
        setCurrentImageUrl(result.url);
        onAvatarUpdate?.(result.url);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Avatar updated successfully!');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Upload Failed', result.error || 'Failed to upload avatar');
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'An unexpected error occurred');
      console.error('Avatar upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const showImagePickerOptions = () => {
    if (!userId) {
      Alert.alert('Error', 'User ID is required to change avatar');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === 'ios') {
      // Use ActionSheetIOS for iOS
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Take Photo
            try {
              const uri = await takePhoto();
              if (uri) {
                await handleImageUpload(uri);
              }
            } catch (error) {
              Alert.alert(
                'Permission Denied',
                'Camera access is required to take photos. Please enable it in Settings.'
              );
            }
          } else if (buttonIndex === 2) {
            // Choose from Library
            try {
              const uri = await pickImageFromLibrary();
              if (uri) {
                await handleImageUpload(uri);
              }
            } catch (error) {
              Alert.alert(
                'Permission Denied',
                'Photo library access is required. Please enable it in Settings.'
              );
            }
          }
        }
      );
    } else {
      // Use Alert for Android
      Alert.alert(
        'Change Avatar',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              try {
                const uri = await takePhoto();
                if (uri) {
                  await handleImageUpload(uri);
                }
              } catch (error) {
                Alert.alert(
                  'Permission Denied',
                  'Camera access is required to take photos. Please enable it in Settings.'
                );
              }
            },
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              try {
                const uri = await pickImageFromLibrary();
                if (uri) {
                  await handleImageUpload(uri);
                }
              } catch (error) {
                Alert.alert(
                  'Permission Denied',
                  'Photo library access is required. Please enable it in Settings.'
                );
              }
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handlePress = () => {
    if (showEditButton && userId) {
      showImagePickerOptions();
    } else if (onPress) {
      onPress();
    }
  };

  const Container = (showEditButton && userId) || onPress ? TouchableOpacity : View;

  return (
    <Container
      onPress={handlePress}
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
          backgroundColor: currentImageUrl ? 'transparent' : colors.primary,
        },
      ]}
    >
      {currentImageUrl ? (
        <Image
          source={{ uri: currentImageUrl }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      )}

      {isUploading && (
        <View style={[styles.loadingOverlay, { borderRadius: avatarSize / 2 }]}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      )}

      {showEditButton && (
        <View style={[styles.editButton, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
          <Ionicons name="camera" size={size === 'xlarge' ? 16 : 12} color="#FFFFFF" />
        </View>
      )}
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import CustomHeader from '@/components/CustomHeader';
import Avatar from '@/components/Avatar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import * as supabaseService from '@/lib/supabaseService';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import FullscreenVideoModal from '@/components/FullscreenVideoModal';

interface HelpfulAdvice {
  id: string;
  question_title: string;
  category: string;
  helpful_votes: number;
  preview: string;
}

export default function WizzmoProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { user: authUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [wizzmoProfile, setWizzmoProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isViewingSelf, setIsViewingSelf] = useState(false);
  const [ratings, setRatings] = useState<any[]>([]);
  const [ratingBreakdown, setRatingBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [averageRating, setAverageRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [mentorVideos, setMentorVideos] = useState<any[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [showFullscreenVideo, setShowFullscreenVideo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const profileUserId = (params.userId || params.id) as string;
  const forcePublic = params.forcePublic === 'true';

  useEffect(() => {
    fetchWizzmoProfile();
  }, [profileUserId, authUser]);

  // Refetch profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('[WizzmoProfile] Screen focused, refetching profile...');
      if (profileUserId) {
        fetchWizzmoProfile();
      }
    }, [profileUserId])
  );

  const fetchWizzmoProfile = async () => {
    if (!profileUserId) return;

    try {
      // Check if viewing own profile - allow self-management even in public view
      const isOwnProfile = authUser?.id === profileUserId;
      setIsViewingSelf(isOwnProfile);

      // Fetch current user's profile to get their role
      let currentProfile = null;
      if (authUser) {
        const { data: currentProfileData } = await supabaseService.getUserProfile(authUser.id);
        currentProfile = currentProfileData;
        setCurrentUserProfile(currentProfileData);
      }

      // Fetch profile data
      const { data: profile } = await supabaseService.getUserProfile(profileUserId);
      if (profile) {
        setWizzmoProfile(profile);
        
        // Update mentor stats to ensure helpful votes are current (now with corrected SQL)
        if (profile.mentor_profile) {
          await supabaseService.updateMentorHelpfulVotes(profileUserId);
          // Refetch profile to get updated stats
          const { data: updatedProfile } = await supabaseService.getUserProfile(profileUserId);
          if (updatedProfile) {
            setWizzmoProfile(updatedProfile);
          }
        }

        // Check if following
        if (authUser && authUser.id !== profileUserId) {
          const { data: following } = await supabaseService.isFollowing(authUser.id, profileUserId);
          setIsFollowing(following || false);

          // Check if favorited - only for users who can act as students
          if (currentProfile?.role === 'student' || currentProfile?.role === 'both') {
            const { data: favorite } = await supabase
              .from('favorite_wizzmos')
              .select('id')
              .eq('student_id', authUser.id)
              .eq('mentor_id', profileUserId)
              .single();
            setIsFavorited(!!favorite);
          }
        }
      }

      // Fetch ratings for this mentor
      await fetchRatings();
      
      // Fetch follower count
      await fetchFollowerCount();

      // Fetch mentor videos
      await fetchMentorVideos();
    } catch (error) {
      console.error('[WizzmoProfile] Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowerCount = async () => {
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('id')
        .eq('following_id', profileUserId);

      if (error) {
        console.error('[WizzmoProfile] Error fetching followers:', error);
        return;
      }

      setFollowerCount(data?.length || 0);
    } catch (error) {
      console.error('[WizzmoProfile] Error fetching follower count:', error);
    }
  };

  const fetchRatings = async () => {
    try {
      // Fetch all advice sessions for this mentor that have ratings
      const { data, error } = await supabase
        .from('advice_sessions')
        .select(`
          id,
          rating,
          feedback,
          resolved_at,
          student_id,
          students:users!advice_sessions_student_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .eq('mentor_id', profileUserId)
        .not('rating', 'is', null)
        .order('resolved_at', { ascending: false });

      if (data) {
        setRatings(data);

        // Calculate rating breakdown
        const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalRating = 0;

        data.forEach(session => {
          if (session.rating) {
            breakdown[session.rating as 1 | 2 | 3 | 4 | 5]++;
            totalRating += session.rating;
          }
        });

        setRatingBreakdown(breakdown);
        setTotalRatings(data.length);
        setAverageRating(data.length > 0 ? totalRating / data.length : 0);
      }
    } catch (error) {
      console.error('[WizzmoProfile] Error fetching ratings:', error);
    }
  };

  const handleFollowToggle = async () => {
    if (!authUser || !profileUserId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (isFollowing) {
        await supabaseService.unfollowMentor(authUser.id, profileUserId);
        setIsFollowing(false);
      } else {
        await supabaseService.followMentor(authUser.id, profileUserId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('[WizzmoProfile] Error toggling follow:', error);
    }
  };

  const fetchMentorVideos = async () => {
    try {
      if (!profileUserId) return;

      const { data: videos, error } = await supabaseService.getMentorVideos(profileUserId);
      if (error) {
        console.error('[WizzmoProfile] Error fetching videos:', error);
        return;
      }

      setMentorVideos(videos || []);
      console.log('[WizzmoProfile] Loaded', videos?.length || 0, 'videos for mentor');
    } catch (error) {
      console.error('[WizzmoProfile] Error fetching mentor videos:', error);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!authUser || !profileUserId || (currentUserProfile?.role !== 'student' && currentUserProfile?.role !== 'both')) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_wizzmos')
          .delete()
          .eq('student_id', authUser.id)
          .eq('mentor_id', profileUserId);

        if (error) throw error;
        setIsFavorited(false);
        console.log('[WizzmoProfile] Removed from favorites');
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorite_wizzmos')
          .insert({
            student_id: authUser.id,
            mentor_id: profileUserId,
            created_at: new Date().toISOString(),
          });

        if (error && error.code !== '23505') throw error; // Ignore duplicate key errors
        setIsFavorited(true);
        console.log('[WizzmoProfile] Added to favorites');
      }
    } catch (error) {
      console.error('[WizzmoProfile] Error toggling favorite:', error);
    }
  };

  const handleVideoPress = (video: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedVideo({
      ...video,
      mentor_profile: wizzmoProfile
    });
    setShowFullscreenVideo(true);
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Delete from storage and database
      const { error } = await supabaseService.deleteMentorVideo(videoId);
      
      if (error) {
        console.error('[WizzmoProfile] Error deleting video:', error);
        return;
      }

      // Remove from local state
      setMentorVideos(mentorVideos.filter(video => video.id !== videoId));
      setShowDeleteConfirm(null);
      
      console.log('[WizzmoProfile] Video deleted successfully');
    } catch (error) {
      console.error('[WizzmoProfile] Error deleting video:', error);
    }
  };

  if (loading || !wizzmoProfile) {
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? 'star' : i < rating ? 'star-half' : 'star-outline'}
        size={16}
        color="#FFD700"
      />
    ));
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
              <View style={styles.avatarContainer}>
                <Avatar
                  name={wizzmoProfile.full_name || wizzmoProfile.username || 'Wizzmo'}
                  imageUrl={wizzmoProfile.avatar_url}
                  size="xlarge"
                  showEditButton={false}
                />
              </View>

            </View>

            {/* Name & Bio */}
            <View style={styles.bioSection}>
              <View style={styles.nameRow}>
                <Text style={[styles.fullName, { color: colors.text }]}>
                  {wizzmoProfile.full_name || wizzmoProfile.username || 'Wizzmo'}
                </Text>
                {wizzmoProfile?.mentor_profile?.is_verified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.surfaceElevated }]}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  </View>
                )}
              </View>
              <Text style={[styles.username, { color: colors.textSecondary }]}>
                @{wizzmoProfile.username || 'username'}
              </Text>
              <Text style={[styles.university, { color: colors.textSecondary }]}>
                {wizzmoProfile.university || 'University'} • Class of {wizzmoProfile.graduation_year || '2025'}
              </Text>
              {wizzmoProfile.bio && (
                <Text style={[styles.bio, { color: colors.text }]}>
                  {wizzmoProfile.bio}
                </Text>
              )}
            </View>

            {/* Action Buttons - Only show for users who can act as students viewing mentors */}
            {!isViewingSelf && (currentUserProfile?.role === 'student' || currentUserProfile?.role === 'both') && (
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    router.push(`/(tabs)/ask?mentorId=${profileUserId}`);
                  }}
                >
                  <LinearGradient
                    colors={colors.gradientPrimary}
                    style={styles.primaryButtonGradient}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>ask for advice</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryButton, { 
                    borderColor: isFavorited ? colors.primary : colors.border,
                    backgroundColor: isFavorited ? colors.primary : 'transparent'
                  }]}
                  onPress={handleFavoriteToggle}
                >
                  <Ionicons 
                    name={isFavorited ? "heart" : "heart-outline"} 
                    size={16} 
                    color={isFavorited ? "#FFFFFF" : colors.text} 
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.secondaryButtonText, { 
                    color: isFavorited ? "#FFFFFF" : colors.text 
                  }]}>
                    {isFavorited ? "favorited" : "+ favorite"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Stats Card */}
          <View style={[styles.statsCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={styles.statsCardRow}>
              <View style={styles.statsCardItem}>
                <Text style={[styles.statsCardValue, { color: colors.primary }]}>
                  {wizzmoProfile?.mentor_profile?.total_questions_answered || 0}
                </Text>
                <Text style={[styles.statsCardLabel, { color: colors.textSecondary }]}>
                  questions answered
                </Text>
              </View>
              <View style={[styles.statsCardDivider, { backgroundColor: colors.separator }]} />
              <View style={styles.statsCardItem}>
                <Text style={[styles.statsCardValue, { color: colors.primary }]}>
                  {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
                </Text>
                <Text style={[styles.statsCardLabel, { color: colors.textSecondary }]}>
                  avg rating ({totalRatings})
                </Text>
              </View>
              <View style={[styles.statsCardDivider, { backgroundColor: colors.separator }]} />
              <View style={styles.statsCardItem}>
                <Text style={[styles.statsCardValue, { color: colors.primary }]}>
                  {wizzmoProfile?.mentor_profile?.total_helpful_votes || 0}
                </Text>
                <Text style={[styles.statsCardLabel, { color: colors.textSecondary }]}>
                  helpful votes
                </Text>
              </View>
            </View>
          </View>

          {/* Videos Section */}
          {mentorVideos.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                recent videos
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.videosScrollContainer}
              >
                {mentorVideos.slice(0, 5).map((video) => (
                  <View
                    key={video.id}
                    style={[styles.videoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                  >
                    {/* Delete button for own videos */}
                    {isViewingSelf && (
                      <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
                        onPress={() => setShowDeleteConfirm(video.id)}
                      >
                        <Ionicons name="trash" size={16} color="white" />
                      </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity
                      onPress={() => handleVideoPress(video)}
                      activeOpacity={0.8}
                      style={styles.videoTouchable}
                    >
                    <View style={styles.videoThumbnail}>
                      {/* Video Preview */}
                      <Video
                        source={{ uri: video.video_url }}
                        style={styles.videoThumbnailImage}
                        resizeMode={ResizeMode.COVER}
                        shouldPlay={false}
                        isMuted={true}
                        usePosterFrame={true}
                        posterSource={video.thumbnail_url ? { uri: video.thumbnail_url } : undefined}
                      />
                      
                      {/* Play overlay */}
                      <View style={styles.videoPlayOverlay}>
                        <Ionicons name="play" size={24} color="white" />
                      </View>
                      

                      {/* Duration overlay if available */}
                      {video.duration_seconds && (
                        <View style={styles.videoDuration}>
                          <Text style={styles.videoDurationText}>
                            {Math.floor(video.duration_seconds / 60)}:{(video.duration_seconds % 60).toString().padStart(2, '0')}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.videoInfo}>
                      <Text 
                        style={[styles.videoTitle, { color: colors.text }]}
                        numberOfLines={2}
                      >
                        {video.title}
                      </Text>
                      <Text style={[styles.videoDescription, { color: colors.textSecondary }]}>
                        {video.description || 'No description'}
                      </Text>
                    </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Ratings & Reviews Section */}
          {totalRatings > 0 ? (
            <View style={styles.reviewsSection}>
              <Text style={[styles.reviewsTitle, { color: colors.text }]}>
                ratings & reviews
              </Text>

              {/* Rating Breakdown */}
              <View style={[styles.ratingBreakdownCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <View style={styles.ratingBreakdownHeader}>
                  <Text style={[styles.averageRatingLarge, { color: colors.text }]}>
                    {averageRating.toFixed(1)}
                  </Text>
                  <View style={styles.ratingBreakdownHeaderInfo}>
                    <View style={styles.starsLarge}>
                      {renderStars(averageRating)}
                    </View>
                    <Text style={[styles.totalRatingsText, { color: colors.textSecondary }]}>
                      based on {totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'}
                    </Text>
                  </View>
                </View>

                {/* Rating bars */}
                <View style={styles.ratingBars}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = ratingBreakdown[star as 1 | 2 | 3 | 4 | 5];
                    const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                    return (
                      <View key={star} style={styles.ratingBarRow}>
                        <Text style={[styles.ratingBarLabel, { color: colors.textSecondary }]}>
                          {star}★
                        </Text>
                        <View style={[styles.ratingBarTrack, { backgroundColor: colors.border }]}>
                          <View
                            style={[
                              styles.ratingBarFill,
                              {
                                backgroundColor: colors.primary,
                                width: `${percentage}%`
                              }
                            ]}
                          />
                        </View>
                        <Text style={[styles.ratingBarCount, { color: colors.textSecondary }]}>
                          {count}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Individual Reviews */}
              <View style={styles.reviewsList}>
                {ratings.slice(0, 10).map(review => (
                  <View
                    key={review.id}
                    style={[styles.reviewCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewerInfo}>
                        <View style={[styles.reviewerAvatar, { backgroundColor: colors.primary }]}>
                          <Text style={styles.reviewerInitial}>
                            {review.students?.full_name?.charAt(0).toUpperCase() || 'S'}
                          </Text>
                        </View>
                        <View>
                          <Text style={[styles.reviewerName, { color: colors.text }]}>
                            {review.students?.full_name || 'User'}
                          </Text>
                          <Text style={[styles.reviewDate, { color: colors.textTertiary }]}>
                            {new Date(review.resolved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.reviewStars}>
                        {renderStars(review.rating)}
                      </View>
                    </View>
                    {review.feedback && (
                      <Text style={[styles.reviewFeedback, { color: colors.textSecondary }]}>
                        "{review.feedback}"
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.noReviewsSection}>
              <Text style={[styles.reviewsTitle, { color: colors.text }]}>
                ratings & reviews
              </Text>
              <View style={[styles.noReviewsCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Ionicons name="star-outline" size={48} color={colors.textTertiary} />
                <Text style={[styles.noReviewsText, { color: colors.textSecondary }]}>
                  no reviews yet
                </Text>
                <Text style={[styles.noReviewsSubtext, { color: colors.textTertiary }]}>
                  be the first to ask for advice!
                </Text>
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Fullscreen Video Modal */}
      {selectedVideo && (
        <FullscreenVideoModal
          visible={showFullscreenVideo}
          onClose={() => {
            setShowFullscreenVideo(false);
            setSelectedVideo(null);
          }}
          video={selectedVideo}
        />
      )}

      {/* Delete Video Confirmation */}
      {showDeleteConfirm && (
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModal, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Text style={[styles.deleteTitle, { color: colors.text }]}>
              Delete Video
            </Text>
            <Text style={[styles.deleteMessage, { color: colors.textSecondary }]}>
              Are you sure you want to delete this video? This action cannot be undone.
            </Text>
            <View style={styles.deleteActions}>
              <TouchableOpacity
                style={[styles.deleteCancel, { borderColor: colors.border }]}
                onPress={() => setShowDeleteConfirm(null)}
              >
                <Text style={[styles.deleteCancelText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteConfirm, { backgroundColor: '#FF4444' }]}
                onPress={() => handleDeleteVideo(showDeleteConfirm)}
              >
                <Text style={styles.deleteConfirmText}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingBottom: 40,
    width: '100%',
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
    marginRight: 20,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  statsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    minWidth: 80,
    paddingHorizontal: 4,
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
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 2,
  },

  // Bio Section
  bioSection: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  fullName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    padding: 2,
    borderRadius: 10,
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

  // Header Action Buttons
  headerActionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  headerPrimaryButton: {
    flex: 2,
    borderRadius: 0,
    overflow: 'hidden',
  },
  headerPrimaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  headerPrimaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },
  headerSecondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 0,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  headerSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },

  // Action Buttons (old)
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 2,
    borderRadius: 0,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 0,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
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

  // Expertise Tags
  expertiseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertiseTag: {
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  expertiseTagText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Badges
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  // Advice List
  adviceList: {
    borderWidth: 1,
    borderRadius: 0,
  },
  adviceCard: {
    padding: 16,
    borderBottomWidth: 1,
  },
  adviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  helpfulVotes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  votesText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  adviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  advicePreview: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 18,
  },

  // Stats Card
  statsCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    marginBottom: 24,
  },
  statsCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsCardItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsCardValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statsCardLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  statsCardDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },

  // Ratings & Reviews Section
  reviewsSection: {
    marginTop: 24,
  },
  reviewsTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: 16,
    textTransform: 'lowercase',
  },

  // Rating Breakdown Card
  ratingBreakdownCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 20,
    marginBottom: 20,
  },
  ratingBreakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  averageRatingLarge: {
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -2,
  },
  ratingBreakdownHeaderInfo: {
    flex: 1,
    gap: 6,
  },
  starsLarge: {
    flexDirection: 'row',
    gap: 4,
  },
  totalRatingsText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },

  // Rating Bars
  ratingBars: {
    gap: 10,
  },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingBarLabel: {
    fontSize: 13,
    fontWeight: '600',
    width: 30,
  },
  ratingBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 0,
    overflow: 'hidden',
  },
  ratingBarFill: {
    height: 8,
    borderRadius: 0,
  },
  ratingBarCount: {
    fontSize: 12,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },

  // Reviews List
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewerInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginBottom: 2,
    textTransform: 'lowercase',
  },
  reviewDate: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewFeedback: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // No Reviews Section
  noReviewsSection: {
    marginTop: 24,
  },
  noReviewsCard: {
    borderWidth: 1,
    borderRadius: 0,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  noReviewsText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    textTransform: 'lowercase',
  },
  noReviewsSubtext: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.1,
    textTransform: 'lowercase',
  },

  // Videos Section
  videosScrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  videoCard: {
    width: 160,
    borderWidth: 1,
    borderRadius: 16,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  videoThumbnail: {
    height: 240, // Portrait 9:16 ratio (160w x 240h)
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  videoInfo: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginBottom: 6,
    lineHeight: 18,
    textTransform: 'lowercase',
  },
  videoDescription: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 16,
    textTransform: 'lowercase',
  },
  videoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  videoViews: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  videoThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlayOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  videoDurationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },

  // Section
  section: {
    marginTop: 24,
  },

  // Video functionality
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  videoTouchable: {
    flex: 1,
  },
  
  // Delete modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  deleteModal: {
    width: '80%',
    maxWidth: 300,
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
  },
  deleteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteCancel: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteConfirm: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

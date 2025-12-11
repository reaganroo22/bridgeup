import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import Avatar from './Avatar';
import * as Haptics from 'expo-haptics';
import { BridgeUpDesign, createCard } from '@/constants/BridgeUpDesign';

interface AdvisorIntroCardProps {
  visible: boolean;
  onClose: () => void;
  advisor: {
    id: string;
    full_name: string;
    avatar_url?: string;
    university?: string;
    major?: string;
    year?: string;
    bio?: string;
    expertise?: string[];
    questions_answered?: number;
    average_rating?: number;
    helpful_votes?: number;
  };
}

export default function AdvisorIntroCard({ visible, onClose, advisor }: AdvisorIntroCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const handleViewProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    router.push(`/advisor-profile?id=${advisor.id}`);
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            meet your advisor
          </Text>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Advisor Profile Card */}
          <View style={[styles.profileCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            {/* Avatar and Basic Info */}
            <View style={[styles.profileHeader, { backgroundColor: 'transparent' }]}>
              <Avatar
                name={advisor.full_name}
                imageUrl={advisor.avatar_url}
                size="xlarge"
              />
              
              <View style={[styles.profileInfo, { backgroundColor: 'transparent' }]}>
                <View style={[styles.nameContainer, { backgroundColor: 'transparent' }]}>
                  <Text style={[styles.advisorName, { color: colors.text }]}>
                    {advisor.full_name}
                  </Text>
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                </View>
                
                {advisor.university && (
                  <Text style={[styles.university, { color: colors.primary }]}>
                    {advisor.university}
                  </Text>
                )}
                
                {advisor.major && (
                  <Text style={[styles.major, { color: colors.textSecondary }]}>
                    {advisor.major} {advisor.year && `• ${advisor.year}`}
                  </Text>
                )}
              </View>
            </View>

            {/* Stats */}
            {(advisor.questions_answered || advisor.average_rating || advisor.helpful_votes) && (
              <View style={[styles.statsContainer, { backgroundColor: 'transparent', borderTopColor: colors.border }]}>
                <Text style={[styles.statsTitle, { color: colors.text }]}>
                  advisor stats
                </Text>
                
                <View style={[styles.statsGrid, { backgroundColor: 'transparent' }]}>
                  {advisor.questions_answered && (
                    <View style={[styles.statItem, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.statNumber, { color: colors.primary }]}>
                        {advisor.questions_answered}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        students helped
                      </Text>
                    </View>
                  )}
                  
                  {advisor.average_rating && (
                    <View style={[styles.statItem, { backgroundColor: 'transparent' }]}>
                      <View style={[styles.ratingContainer, { backgroundColor: 'transparent' }]}>
                        <Text style={[styles.statNumber, { color: colors.primary }]}>
                          {advisor.average_rating.toFixed(1)}
                        </Text>
                        <Ionicons name="star" size={16} color={colors.primary} />
                      </View>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        average rating
                      </Text>
                    </View>
                  )}
                  
                  {advisor.helpful_votes && (
                    <View style={[styles.statItem, { backgroundColor: 'transparent' }]}>
                      <Text style={[styles.statNumber, { color: colors.primary }]}>
                        {advisor.helpful_votes}
                      </Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        helpful votes
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Bio */}
            {advisor.bio && (
              <View style={[styles.bioContainer, { backgroundColor: 'transparent', borderTopColor: colors.border }]}>
                <Text style={[styles.bioTitle, { color: colors.text }]}>
                  about me
                </Text>
                <Text style={[styles.bioText, { color: colors.textSecondary }]}>
                  {advisor.bio}
                </Text>
              </View>
            )}

            {/* Expertise */}
            {advisor.expertise && advisor.expertise.length > 0 && (
              <View style={[styles.expertiseContainer, { backgroundColor: 'transparent', borderTopColor: colors.border }]}>
                <Text style={[styles.expertiseTitle, { color: colors.text }]}>
                  areas of expertise
                </Text>
                <View style={[styles.expertiseTags, { backgroundColor: 'transparent' }]}>
                  {advisor.expertise.map((area, index) => (
                    <View 
                      key={index}
                      style={[styles.expertiseTag, { backgroundColor: `${colors.primary}15`, borderColor: colors.primary }]}
                    >
                      <Text style={[styles.expertiseTagText, { color: colors.primary }]}>
                        {area}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Connection Message */}
          <View style={[styles.connectionCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={[styles.connectionHeader, { backgroundColor: 'transparent' }]}>
              <Ionicons name="chatbubbles" size={24} color={colors.primary} />
              <Text style={[styles.connectionTitle, { color: colors.text }]}>
                ready to help you succeed!
              </Text>
            </View>
            <Text style={[styles.connectionText, { color: colors.textSecondary }]}>
              {advisor.full_name.split(' ')[0]} has accepted your question and is ready to guide you through the college admissions process. 
              Feel free to ask about applications, essays, campus life, or any other college-related questions!
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.chatButton, { backgroundColor: 'transparent', borderColor: colors.border }]}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.chatButtonText, { color: colors.text }]}>
              start chatting
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleViewProfile}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={colors.gradientPrimary}
              style={styles.profileGradient}
            >
              <Text style={styles.profileButtonText}>view full profile</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  closeButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  profileCard: {
    borderWidth: 1,
    borderRadius: BridgeUpDesign.borderRadius.large,
    padding: BridgeUpDesign.spacing.lg,
    marginBottom: BridgeUpDesign.spacing.md,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 16,
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  advisorName: {
    fontSize: BridgeUpDesign.fontSize.heading,
    fontWeight: BridgeUpDesign.fontWeight.semibold,
    letterSpacing: -0.2,
  },
  verifiedBadge: {
    width: 24,
    height: 24,
    borderRadius: BridgeUpDesign.borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  university: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  major: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    paddingTop: 20,
    borderTopWidth: 1,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  bioContainer: {
    paddingTop: 20,
    borderTopWidth: 1,
    marginBottom: 20,
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  bioText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  expertiseContainer: {
    paddingTop: 20,
    borderTopWidth: 1,
  },
  expertiseTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  expertiseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  expertiseTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: BridgeUpDesign.borderRadius.full,
  },
  expertiseTagText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  connectionCard: {
    borderWidth: 1,
    borderRadius: BridgeUpDesign.borderRadius.medium,
    padding: BridgeUpDesign.spacing.lg,
  },
  connectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  connectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  connectionText: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  chatButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BridgeUpDesign.borderRadius.medium,
    paddingVertical: 16,
    alignItems: 'center',
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  profileButton: {
    flex: 1,
  },
  profileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: BridgeUpDesign.borderRadius.medium,
    gap: 8,
  },
  profileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
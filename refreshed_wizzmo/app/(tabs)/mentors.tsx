/**
 * Brutalist College Advisor Discovery
 * Clean, focused, no-bullshit advisor finding
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { Typography, FontFamily } from '@/constants/Fonts';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import CustomHeader from '@/components/CustomHeader';
import ModeToggle from '@/components/ModeToggle';
import * as supabaseService from '../../lib/supabaseService';
import * as Haptics from 'expo-haptics';

interface AdvisorProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  major: string | null;
  graduation_year: number | null;
  availability_status: 'available' | 'busy' | 'offline';
  specialties: string[];
  // From Google Form
  session_formats: string[];
  response_time: string;
  languages: string[];
  experience_description: string;
  // Personality indicators
  vibe: 'direct' | 'gentle' | 'funny' | 'empathetic' | null;
  // Experience tags
  has_experience_with: string[];
  school_type: 'big_state' | 'private' | 'ivy' | 'community' | 'religious';
  // From mentor_profiles table
  average_rating: number;
  total_questions_answered: number;
}

export default function MentorsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const insets = useSafeAreaInsets();

  const [mentors, setMentors] = useState<AdvisorProfile[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<AdvisorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMentors, setHasMoreMentors] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const MENTORS_PER_PAGE = 20;
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [universityQuery, setUniversityQuery] = useState('');
  const [showUniversityDropdown, setShowUniversityDropdown] = useState(false);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{
    topics: string[];
    sessionFormats: string[];
    university: string;
    graduationYearMin: number | null;
    graduationYearMax: number | null;
    availability: boolean;
    vibes: string[];
    minRating: number | null;
    minQuestionsAnswered: number | null;
  }>({
    topics: [],
    sessionFormats: [],
    university: '',
    graduationYearMin: null,
    graduationYearMax: null,
    availability: false,
    vibes: [],
    minRating: null,
    minQuestionsAnswered: null,
  });

  // Selected mentors for multi-select functionality
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  
  const searchInputRef = useRef<TextInput>(null);
  const universityInputRef = useRef<TextInput>(null);

  // Format response time based on minutes
  const formatResponseTime = (minutes: number): string => {
    if (minutes < 60) {
      return `within ${minutes} min`;
    } else if (minutes < 360) { // Less than 6 hours
      return `within ${Math.round(minutes / 60)} hrs`;
    } else {
      return 'within 12 hrs';
    }
  };

  // Comprehensive university list (300 top US universities)
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

  const selectUniversity = (university: string) => {
    setActiveFilters(prev => ({ ...prev, university }));
    setUniversityQuery(university);
    setShowUniversityDropdown(false);
  };

  const handleProFeatureAttempt = () => {
    setShowProUpgradeModal(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    loadMentors();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [mentors, searchTerm, activeFilters]);

  // Reset pagination when filters change
  useEffect(() => {
    if (searchTerm || hasActiveFilters()) {
      // When filters are applied, work with current loaded mentors
      applyFilters();
    } else {
      // When filters are cleared, reload from beginning
      setCurrentPage(0);
      setHasMoreMentors(true);
      loadMentors(0, false);
    }
  }, [searchTerm, activeFilters]);

  useEffect(() => {
    // Initialize university query with current filter value
    setUniversityQuery(activeFilters.university);
  }, [activeFilters.university]);

  const loadMentors = async (page = 0, append = false) => {
    try {
      if (page === 0) {
        setLoading(true);
        setMentors([]);
        setCurrentPage(0);
      } else {
        setLoadingMore(true);
      }
      
      // Load real mentors from database with pagination
      console.log(`[MentorsScreen] Loading mentors page ${page}...`);
      const { data, error } = await supabaseService.getAllMentors(page, MENTORS_PER_PAGE);
      
      if (error) {
        console.error('[MentorsScreen] Error loading mentors:', error);
        if (page === 0) {
          setMentors([]);
        }
      } else if (data) {
        // Transform database data to match our interface
        const transformedMentors = (data.mentors || []).map((mentor, index) => {
          // Production-ready availability status based on real user activity
          const getProductionAvailabilityStatus = () => {
            const now = new Date();
            const lastSeen = mentor.mentor_profile?.last_seen ? new Date(mentor.mentor_profile.last_seen) : null;
            const manualStatus = mentor.mentor_profile?.manual_availability_status;
            
            // If mentor manually set their status, respect that first
            if (manualStatus && ['available', 'busy', 'offline'].includes(manualStatus)) {
              // But only if it's not too old (within last 24 hours)
              const statusUpdated = mentor.mentor_profile?.status_updated_at ? new Date(mentor.mentor_profile.status_updated_at) : null;
              if (statusUpdated && (now.getTime() - statusUpdated.getTime()) < 24 * 60 * 60 * 1000) {
                return manualStatus as 'available' | 'busy' | 'offline';
              }
            }
            
            // Auto-determine based on activity
            if (!lastSeen) {
              return 'offline' as const; // Never seen = offline
            }
            
            const minutesSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60);
            
            if (minutesSinceLastSeen < 5) {
              return 'available' as const; // Active within 5 minutes = available
            } else if (minutesSinceLastSeen < 30) {
              return 'busy' as const; // Active within 30 minutes = busy
            } else {
              return 'offline' as const; // More than 30 minutes = offline
            }
          };
          
          return {
            id: mentor.id,
            user_id: mentor.user_id,
            full_name: mentor.full_name,
            avatar_url: mentor.avatar_url,
            university: mentor.university,
            major: mentor.major,
            graduation_year: mentor.graduation_year,
            availability_status: getProductionAvailabilityStatus(),
            specialties: mentor.expertise || [],
            session_formats: ['text chat'],
            response_time: mentor.mentor_profile?.avg_response_time_minutes ? 
              formatResponseTime(mentor.mentor_profile.avg_response_time_minutes) : 'within 24 hours',
            languages: ['English'],
            experience_description: mentor.bio,
            vibe: mentor.vibe || null, // Only show actual vibe if set
            has_experience_with: mentor.expertise || [],
            school_type: 'big_state' as const,
            bio: mentor.bio,
            average_rating: mentor.mentor_profile?.average_rating || 0,
            total_questions_answered: mentor.mentor_profile?.total_questions_answered || 0,
          };
        });
        
        console.log(`[MentorsScreen] Loaded ${transformedMentors.length} mentors on page ${page}`);
        
        if (append) {
          setMentors(prev => [...prev, ...transformedMentors]);
        } else {
          setMentors(transformedMentors);
        }
        
        setHasMoreMentors(data.hasMore);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('[MentorsScreen] Error loading mentors:', error);
      if (page === 0) {
        setMentors([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMentors = () => {
    // Don't load more if filters are active (we filter locally)
    if (!loadingMore && hasMoreMentors && !searchTerm && !hasActiveFilters()) {
      loadMentors(currentPage + 1, true);
    }
  };


  const applyFilters = () => {
    let filtered = [...mentors];

    // Apply search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(mentor => 
        mentor.full_name?.toLowerCase().includes(searchLower) ||
        mentor.university?.toLowerCase().includes(searchLower) ||
        mentor.experience_description?.toLowerCase().includes(searchLower) ||
        mentor.specialties.some(specialty => specialty.toLowerCase().includes(searchLower)) ||
        mentor.has_experience_with.some(exp => exp.toLowerCase().includes(searchLower))
      );
    }

    // Apply availability filter
    if (activeFilters.availability) {
      filtered = filtered.filter(mentor => mentor.availability_status === 'available');
    }

    // Apply topic filters (from Google Form topics)
    if (activeFilters.topics.length > 0) {
      filtered = filtered.filter(mentor => 
        activeFilters.topics.some(topic => 
          mentor.specialties.some(specialty => 
            specialty.toLowerCase().includes(topic.toLowerCase())
          )
        )
      );
    }

    // Apply vibe filters
    if (activeFilters.vibes.length > 0) {
      filtered = filtered.filter(mentor => 
        activeFilters.vibes.includes(mentor.vibe)
      );
    }

    // Apply session format filters
    if (activeFilters.sessionFormats.length > 0) {
      filtered = filtered.filter(mentor => 
        activeFilters.sessionFormats.some(format => 
          mentor.session_formats.some(mentorFormat => 
            mentorFormat.toLowerCase().includes(format.toLowerCase())
          )
        )
      );
    }

    // Apply university filter
    if (activeFilters.university.trim()) {
      filtered = filtered.filter(mentor => 
        mentor.university?.toLowerCase().includes(activeFilters.university.toLowerCase())
      );
    }

    // Apply graduation year range filters
    if (activeFilters.graduationYearMin) {
      filtered = filtered.filter(mentor => 
        mentor.graduation_year && mentor.graduation_year >= activeFilters.graduationYearMin!
      );
    }
    if (activeFilters.graduationYearMax) {
      filtered = filtered.filter(mentor => 
        mentor.graduation_year && mentor.graduation_year <= activeFilters.graduationYearMax!
      );
    }

    // Apply minimum rating filter
    if (activeFilters.minRating) {
      filtered = filtered.filter(mentor => 
        mentor.average_rating >= activeFilters.minRating!
      );
    }

    // Apply minimum questions answered filter
    if (activeFilters.minQuestionsAnswered) {
      filtered = filtered.filter(mentor => 
        mentor.total_questions_answered >= activeFilters.minQuestionsAnswered!
      );
    }

    setFilteredMentors(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchTerm(text);
  };

  const toggleFilter = (category: keyof typeof activeFilters, value: string | boolean) => {
    setActiveFilters(prev => {
      if (category === 'availability') {
        return { ...prev, availability: !prev.availability };
      }
      
      const categoryValues = prev[category] as string[];
      const hasValue = categoryValues.includes(value as string);
      
      return {
        ...prev,
        [category]: hasValue 
          ? categoryValues.filter(v => v !== value)
          : [...categoryValues, value as string]
      };
    });
  };

  const handleMentorPress = (mentor: AdvisorProfile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/bridgeup-profile?userId=${mentor.user_id}`);
  };

  const clearAllFilters = () => {
    setActiveFilters({
      topics: [],
      sessionFormats: [],
      university: '',
      graduationYearMin: null,
      graduationYearMax: null,
      availability: false,
      vibes: [],
      minRating: null,
      minQuestionsAnswered: null,
    });
    setUniversityQuery('');
    setShowUniversityDropdown(false);
    setSearchTerm('');
    // This will trigger the useEffect to reload mentors
  };

  const hasActiveFilters = () => {
    return activeFilters.availability || 
           activeFilters.topics.length > 0 || 
           activeFilters.sessionFormats.length > 0 || 
           activeFilters.university.trim() !== '' ||
           activeFilters.graduationYearMin !== null ||
           activeFilters.graduationYearMax !== null ||
           activeFilters.vibes.length > 0 ||
           activeFilters.minRating !== null ||
           activeFilters.minQuestionsAnswered !== null;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (activeFilters.availability) count++;
    count += activeFilters.topics.length;
    count += activeFilters.sessionFormats.length;
    if (activeFilters.university.trim()) count++;
    if (activeFilters.graduationYearMin) count++;
    if (activeFilters.graduationYearMax) count++;
    count += activeFilters.vibes.length;
    if (activeFilters.minRating) count++;
    if (activeFilters.minQuestionsAnswered) count++;
    return count;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return colors.primary;
      case 'busy': return '#F59E0B';
      default: return colors.textSecondary;
    }
  };

  const renderMentorCard = ({ item: mentor }: { item: AdvisorProfile }) => {
    const isSelected = selectedMentors.includes(mentor.user_id);
    
    return (
      <TouchableOpacity
        style={[
          styles.mentorCard, 
          { 
            backgroundColor: colors.surface, 
            borderColor: isSelected ? colors.primary : colors.border,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => handleMentorSelection(mentor)}
        onLongPress={() => handleMentorPress(mentor)}
        activeOpacity={0.8}
      >
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Image
            source={{
              uri: mentor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.full_name || 'User')}&background=FF4DB8&color=fff&size=128`
            }}
            style={styles.avatarImage}
          />
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>
            {mentor.full_name}
          </Text>
          <Text style={[styles.school, { color: colors.textSecondary }]} numberOfLines={1}>
            {mentor.university} '{mentor.graduation_year?.toString().slice(-2)}{mentor.vibe ? ` • ${mentor.vibe}` : ''}
          </Text>
          {mentor.bio ? (
            <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
              {mentor.bio}
            </Text>
          ) : (
            <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>
              Available to chat about college life and guidance
            </Text>
          )}
        </View>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(mentor.availability_status) }]} />
      </View>

      <View style={styles.expertiseSection}>
        {mentor.has_experience_with.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={[styles.tagLabel, { color: colors.textSecondary }]}>experienced with</Text>
            <View style={styles.tagRow}>
              {mentor.has_experience_with.slice(0, 3).map((exp, index) => (
                <View key={index} style={[styles.experienceTag, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
                  <Text style={[styles.experienceTagText, { color: colors.primary }]}>
                    {exp}
                  </Text>
                </View>
              ))}
              {mentor.has_experience_with.length > 3 && (
                <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                  +{mentor.has_experience_with.length - 3}
                </Text>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionLabel, { color: colors.textSecondary }]}>
            responds {mentor.response_time}
          </Text>
          {mentor.average_rating > 0 && (
            <Text style={[styles.ratingLabel, { color: colors.text }]}>
              ⭐ {mentor.average_rating.toFixed(1)} • {mentor.total_questions_answered} questions
            </Text>
          )}
        </View>
        
        {/* Selection indicator */}
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

  // Handle mentor selection for multi-select
  const handleMentorSelection = (mentor: AdvisorProfile) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setSelectedMentors(prev => {
      const isSelected = prev.includes(mentor.user_id);
      if (isSelected) {
        // Deselect
        return prev.filter(id => id !== mentor.user_id);
      } else {
        // Select (limit to 5)
        if (prev.length >= 5) {
          return prev;
        }
        return [...prev, mentor.user_id];
      }
    });
  };

  return (
    <>
      <CustomHeader 
        title="find an advisor"
        showBackButton={false}
        showChatButton={false}
        showProfileButton={true}
        rightActions={
          <>
            <ModeToggle showText={false} />
          </>
        }
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{ height: insets.top + 100 }} />
        
        {/* Search */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="search by experience, university, or expertise..."
              placeholderTextColor={colors.textSecondary}
              value={searchTerm}
              onChangeText={handleSearch}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[
              styles.filterButton, 
              { backgroundColor: colors.surface, borderColor: colors.border },
              hasActiveFilters() && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <Ionicons name="options" size={16} color={hasActiveFilters() ? colors.primary : colors.text} />
            <Text style={[
              styles.filterButtonText, 
              { color: hasActiveFilters() ? colors.primary : colors.text }
            ]}>
              filters
            </Text>
            {hasActiveFilters() && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterBadgeText}>
                  {getActiveFilterCount()}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.filterButton, 
              { backgroundColor: colors.surface, borderColor: colors.border },
              activeFilters.availability && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
            ]}
            onPress={() => toggleFilter('availability', true)}
          >
            <Text style={[
              styles.filterButtonText, 
              { color: activeFilters.availability ? colors.primary : colors.text }
            ]}>
              online now
            </Text>
          </TouchableOpacity>

          {hasActiveFilters() && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearAllFilters}
            >
              <Text style={[styles.clearButtonText, { color: colors.textSecondary }]}>
                clear all
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
            {filteredMentors.length} advisor{filteredMentors.length === 1 ? '' : 's'} found
          </Text>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {/* TODO: Add sort functionality */}}
          >
            <Text style={[styles.sortText, { color: colors.text }]}>
              best match
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mentors Grid */}
        <FlatList
          data={filteredMentors}
          renderItem={renderMentorCard}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={styles.row}
          onEndReached={loadMoreMentors}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => {
            if (loadingMore) {
              return (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    loading more advisors...
                  </Text>
                </View>
              );
            }
            if (!hasMoreMentors && filteredMentors.length > 0) {
              return (
                <View style={styles.endFooter}>
                  <Text style={[styles.endText, { color: colors.textSecondary }]}>
                    you've seen all {filteredMentors.length} advisors
                  </Text>
                </View>
              );
            }
            return null;
          }}
        />

        {/* Request Wizzmos Button - Show when mentors are selected */}
        {selectedMentors.length > 0 && (
          <View style={[styles.requestButtonContainer, { backgroundColor: colors.background }]}>
            <TouchableOpacity 
              style={[styles.requestButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Get selected mentor data
                const selectedMentorData = mentors.filter(mentor => 
                  selectedMentors.includes(mentor.user_id)
                );
                
                // Navigate to ask tab with selected mentors
                router.push({
                  pathname: '/(tabs)/ask',
                  params: { 
                    selectedMentors: JSON.stringify(selectedMentorData.map(m => ({
                      id: m.user_id,
                      name: m.full_name,
                      avatar_url: m.avatar_url
                    })))
                  }
                });
              }}
            >
              <Text style={styles.requestButtonText}>
                Request {selectedMentors.length} Selected Advisor{selectedMentors.length === 1 ? '' : 's'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>filters</Text>
            <TouchableOpacity onPress={() => {
              // Apply filters and close
              setShowFilterModal(false);
            }}>
              <Text style={[styles.modalDone, { color: colors.primary }]}>done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Availability */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>availability</Text>
              <TouchableOpacity 
                style={[
                  styles.filterOption,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  activeFilters.availability && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                ]}
                onPress={() => toggleFilter('availability', true)}
              >
                <Text style={[
                  styles.filterOptionText,
                  { color: activeFilters.availability ? colors.primary : colors.text }
                ]}>
                  online now
                </Text>
                {activeFilters.availability && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>

            {/* Topics */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>topics</Text>
              <View style={styles.topicGrid}>
                {[
                  'Dating & Relationships', 'Breakups & Moving On', 'Roommate Issues', 
                  'Friend Drama', 'Confidence & Self-Esteem', 'Stress & Mental Health',
                  'Social Anxiety', 'Long Distance', 'Toxic Relationships', 'First Dates',
                  'Communication Skills', 'Body Image', 'Academic Help', 'Career Advice',
                  'Family Issues', 'Money & Budgeting', 'Greek Life', 'Transfer Life',
                  'Future Planning', 'Work-Life Balance', 'Independence', 'Making Friends'
                ].map((topic) => (
                <TouchableOpacity 
                  key={topic}
                  style={[
                    styles.topicChip,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    activeFilters.topics.includes(topic) && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                  ]}
                  onPress={() => toggleFilter('topics', topic)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: activeFilters.topics.includes(topic) ? colors.primary : colors.text }
                  ]}>
                    {topic}
                  </Text>
                  {activeFilters.topics.includes(topic) && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              </View>
            </View>

            {/* Communication Style */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>communication style</Text>
              {['direct', 'gentle', 'funny', 'empathetic'].map((vibe) => (
                <TouchableOpacity 
                  key={vibe}
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    activeFilters.vibes.includes(vibe) && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                  ]}
                  onPress={() => toggleFilter('vibes', vibe)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: activeFilters.vibes.includes(vibe) ? colors.primary : colors.text }
                  ]}>
                    {vibe}
                  </Text>
                  {activeFilters.vibes.includes(vibe) && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Session Format */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>favorite session format</Text>
              {['voice memo', 'text chat'].map((format) => (
                <TouchableOpacity 
                  key={format}
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    activeFilters.sessionFormats.includes(format) && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                  ]}
                  onPress={() => toggleFilter('sessionFormats', format)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: activeFilters.sessionFormats.includes(format) ? colors.primary : colors.text }
                  ]}>
                    {format}
                  </Text>
                  {activeFilters.sessionFormats.includes(format) && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Response Time */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>response time</Text>
              {['within 1 hour', 'within 2-6 hours', 'within 24 hours'].map((time) => (
                <TouchableOpacity 
                  key={time}
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    activeFilters.sessionFormats.includes(time) && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                  ]}
                  onPress={() => toggleFilter('sessionFormats', time)}
                >
                  <Text style={[
                    styles.filterOptionText,
                    { color: activeFilters.sessionFormats.includes(time) ? colors.primary : colors.text }
                  ]}>
                    {time}
                  </Text>
                  {activeFilters.sessionFormats.includes(time) && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* University Search */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>university</Text>
              <View style={styles.universitySearchContainer}>
                <TextInput
                  ref={universityInputRef}
                  style={[
                    styles.universityInput,
                    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }
                  ]}
                  placeholder="type university name..."
                  placeholderTextColor={colors.textSecondary}
                  value={universityQuery}
                  onChangeText={handleUniversitySearch}
                  onFocus={() => setShowUniversityDropdown(universityQuery.length > 0)}
                />
                {showUniversityDropdown && (
                  <ScrollView 
                    style={[styles.universityDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    keyboardShouldPersistTaps="always"
                    nestedScrollEnabled={true}
                  >
                    {getFilteredUniversities().map((university) => (
                      <TouchableOpacity
                        key={university}
                        style={[styles.universityOption, { borderBottomColor: colors.border }]}
                        onPress={() => selectUniversity(university)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.universityOptionText, { color: colors.text }]}>
                          {university}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            {/* Graduation Year */}
            <View style={styles.filterSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>graduation year</Text>
              <View style={styles.yearInputs}>
                <TextInput
                  style={[
                    styles.yearInput,
                    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }
                  ]}
                  placeholder="min"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={activeFilters.graduationYearMin?.toString() || ''}
                  onChangeText={(text) => setActiveFilters(prev => ({ 
                    ...prev, 
                    graduationYearMin: text ? parseInt(text) : null 
                  }))}
                />
                <Text style={[styles.yearSeparator, { color: colors.textSecondary }]}>to</Text>
                <TextInput
                  style={[
                    styles.yearInput,
                    { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }
                  ]}
                  placeholder="max"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={activeFilters.graduationYearMax?.toString() || ''}
                  onChangeText={(text) => setActiveFilters(prev => ({ 
                    ...prev, 
                    graduationYearMax: text ? parseInt(text) : null 
                  }))}
                />
              </View>
            </View>

            {/* Rating Filter - Premium */}
            <View style={styles.filterSection}>
              <View style={styles.premiumHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>minimum rating</Text>
                <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <View style={[styles.ratingOptions, !isProUser && styles.premiumFeature]}>
                {[4, 4.5, 5].map((rating) => (
                  <TouchableOpacity 
                    key={rating}
                    style={[
                      styles.ratingOption,
                      { 
                        backgroundColor: isProUser() ? colors.surface : colors.surface + '50', 
                        borderColor: isProUser() ? colors.border : colors.border + '50' 
                      },
                      activeFilters.minRating === rating && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                    ]}
                    onPress={() => isProUser() ? setActiveFilters(prev => ({ 
                      ...prev, 
                      minRating: prev.minRating === rating ? null : rating 
                    })) : handleProFeatureAttempt()}
                    disabled={!isProUser()}
                  >
                    <Text style={[
                      styles.ratingText,
                      { color: isProUser() ? (activeFilters.minRating === rating ? colors.primary : colors.text) : colors.textSecondary }
                    ]}>
                      {rating}+ ⭐
                    </Text>
                    {isProUser() && activeFilters.minRating === rating && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Experience Level - Premium */}
            <View style={styles.filterSection}>
              <View style={styles.premiumHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>experience level</Text>
                <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              </View>
              <View style={[styles.experienceOptions, !isProUser && styles.premiumFeature]}>
                {[
                  { label: '10+ questions answered', value: 10 },
                  { label: '25+ questions answered', value: 25 },
                  { label: '50+ questions answered', value: 50 },
                ].map(({ label, value }) => (
                  <TouchableOpacity 
                    key={value}
                    style={[
                      styles.filterOption,
                      { 
                        backgroundColor: isProUser() ? colors.surface : colors.surface + '50', 
                        borderColor: isProUser() ? colors.border : colors.border + '50' 
                      },
                      activeFilters.minQuestionsAnswered === value && { backgroundColor: colors.primary + '20', borderColor: colors.primary }
                    ]}
                    onPress={() => isProUser() ? setActiveFilters(prev => ({ 
                      ...prev, 
                      minQuestionsAnswered: prev.minQuestionsAnswered === value ? null : value 
                    })) : handleProFeatureAttempt()}
                    disabled={!isProUser()}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      { color: isProUser() ? (activeFilters.minQuestionsAnswered === value ? colors.primary : colors.text) : colors.textSecondary }
                    ]}>
                      {label}
                    </Text>
                    {isProUser() && activeFilters.minQuestionsAnswered === value && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>


            {/* Clear All */}
            {hasActiveFilters() && (
              <TouchableOpacity 
                style={[styles.clearAllButton, { borderColor: colors.border }]}
                onPress={clearAllFilters}
              >
                <Text style={[styles.clearAllText, { color: colors.textSecondary }]}>
                  clear all filters
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Pro Upgrade Modal */}
      <Modal
        visible={showProUpgradeModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowProUpgradeModal(false)}>
              <Text style={[styles.modalCancel, { color: colors.textSecondary }]}>close</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>upgrade to pro</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.proUpgradeContent}>
            <View style={[styles.proIcon, { backgroundColor: colors.primary }]}>
              <Text style={styles.proIconText}>✨</Text>
            </View>
            
            <Text style={[styles.proTitle, { color: colors.text }]}>
              Unlock Premium Filters
            </Text>
            
            <Text style={[styles.proDescription, { color: colors.textSecondary }]}>
              Get access to advanced filtering by advisor ratings and experience levels to find the perfect advisor for your needs.
            </Text>

            <View style={styles.proFeatures}>
              <View style={styles.proFeature}>
                <Text style={[styles.proFeatureIcon, { color: colors.primary }]}>⭐</Text>
                <Text style={[styles.proFeatureText, { color: colors.text }]}>Filter by minimum rating</Text>
              </View>
              <View style={styles.proFeature}>
                <Text style={[styles.proFeatureIcon, { color: colors.primary }]}>🎯</Text>
                <Text style={[styles.proFeatureText, { color: colors.text }]}>Filter by experience level</Text>
              </View>
              <View style={styles.proFeature}>
                <Text style={[styles.proFeatureIcon, { color: colors.primary }]}>🚀</Text>
                <Text style={[styles.proFeatureText, { color: colors.text }]}>Priority support</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setShowProUpgradeModal(false);
                // TODO: Navigate to subscription screen
              }}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 0,
    borderRadius: 20,
    gap: 12,
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 2,
    gap: 6,
  },
  filterButtonText: {
    ...Typography.buttonSmall,
    fontSize: 14,
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: '#FF4DB8',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  clearFiltersButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultsText: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  mentorCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    position: 'relative',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  avatar: {
    width: 48,
    height: 48,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#000000',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: FontFamily.primary,
    marginBottom: 2,
  },
  school: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: FontFamily.secondary,
    marginBottom: 1,
  },
  major: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusDot: {
    width: 8,
    height: 8,
    marginTop: 4,
  },
  bio: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  expertiseSection: {
    marginTop: 12,
    gap: 8,
  },
  tagsContainer: {
    gap: 4,
  },
  sessionInfo: {
    marginTop: 4,
  },
  sessionLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  ratingLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tagLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  experienceTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  experienceTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 11,
    fontWeight: '500',
    alignSelf: 'center',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Video indicator styles
  videoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  videoText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalCancel: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'lowercase',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  filterSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'lowercase',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  clearAllButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 32,
    marginBottom: 40,
    borderWidth: 1,
    borderRadius: 12,
  },
  clearAllText: {
    fontSize: 16,
    fontWeight: '600',
  },
  yearInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  yearInput: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  yearSeparator: {
    fontSize: 16,
    fontWeight: '500',
  },
  ratingOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  ratingOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  experienceOptions: {
    gap: 8,
  },
  topicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 8,
  },
  universitySearchContainer: {
    position: 'relative',
  },
  universityInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  universityDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    maxHeight: 200,
    borderWidth: 2,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  // Premium feature styles
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  premiumFeature: {
    opacity: 0.6,
  },
  // Pro upgrade modal styles
  proUpgradeContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  proIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  proIconText: {
    fontSize: 32,
  },
  proTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  proDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  proFeatures: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  proFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  proFeatureIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  proFeatureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  upgradeButton: {
    alignSelf: 'stretch',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Request button styles
  requestButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  requestButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Loading states
  loadingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  endFooter: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
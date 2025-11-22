import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const GIPHY_API_KEY = 'sXpGFDGZs0Dv1mmNFvYaGUvYwKX0PWIh'; // Public demo key

interface GifPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectGif: (gifUrl: string) => void;
}

interface GifResult {
  id: string;
  images: {
    fixed_height: {
      url: string;
      height: string;
      width: string;
    };
    downsized: {
      url: string;
    };
  };
}

export default function GifPicker({ visible, onClose, onSelectGif }: GifPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      // Load trending GIFs when no search query
      fetchTrendingGifs();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=30&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error searching GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingGifs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=30&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error fetching trending GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load trending GIFs when modal opens
  useEffect(() => {
    if (visible && gifs.length === 0) {
      fetchTrendingGifs();
    }
  }, [visible]);

  const handleSelectGif = (gif: GifResult) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectGif(gif.images.downsized.url);
    onClose();
    setSearchQuery('');
  };

  const handleClose = () => {
    setSearchQuery('');
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
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            choose a gif
          </Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="search for gifs..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchGifs(text);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  fetchTrendingGifs();
                }}
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* GIF Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              loading gifs...
            </Text>
          </View>
        ) : (
          <FlatList
            data={gifs}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gifItem}
                onPress={() => handleSelectGif(item)}
                activeOpacity={0.8}
              >
                <Image
                  source={{ uri: item.images.fixed_height.url }}
                  style={[
                    styles.gifImage,
                    {
                      height: parseInt(item.images.fixed_height.height),
                      width: parseInt(item.images.fixed_height.width),
                    },
                  ]}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.gifRow}
            contentContainerStyle={styles.gifGrid}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Powered by Giphy */}
        <View style={[styles.footer, { backgroundColor: colors.surfaceElevated }]}>
          <Text style={[styles.footerText, { color: colors.textTertiary }]}>
            powered by giphy
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 0,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  gifGrid: {
    padding: 20,
    paddingBottom: 80,
  },
  gifRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gifItem: {
    width: (width - 52) / 2, // Account for padding and gap
    borderRadius: 0,
    overflow: 'hidden',
  },
  gifImage: {
    width: '100%',
    borderRadius: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 12,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

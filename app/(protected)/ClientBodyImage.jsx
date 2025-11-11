import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import {
Dimensions,
    Image,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    FlatList,
    RefreshControl,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Logger from '../utils/logger';
import OfflineApiService from "../services/OfflineApiService";
import LoadingGif from '../components/LoadingGif';


const screenWidth = Dimensions.get("window").width;
const imageMargin = 10;
const numColumns = 3;
const imageWidth = (screenWidth - imageMargin * (numColumns + 1)) / numColumns;
const imageHeight = imageWidth * 1.33;

export default function ClientBodyImage() {
  const { userId } = useLocalSearchParams();
  const [photos, setPhotos] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const CACHE_KEY = `user_photos_${userId}`;
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    Logger.debug('ClientBodyImage useEffect - userId:', userId);
    if (userId) {
      loadCachedPhotos();
    } else {
      Logger.log('❌ No userId provided');
      setError('No user ID provided');
      setLoading(false);
    }
  }, [userId]);

  // Load cached photos first for instant display
  const loadCachedPhotos = async () => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        
        if (age < CACHE_DURATION) {
          Logger.log('📦 Using cached photos (age:', Math.round(age / 1000), 'seconds)');
          setPhotos(data);
          setLoading(false);
          
          // Prefetch images in background
          data.forEach(photo => {
            if (photo.front) Image.prefetch(photo.front);
            if (photo.side) Image.prefetch(photo.side);
            if (photo.back) Image.prefetch(photo.back);
          });
          return;
        }
      }
    } catch (err) {
      Logger.log('Cache read error:', err);
    }
    
    // No valid cache, load from server
    loadUserPhotos();
  };

  const loadUserPhotos = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      Logger.debug('Loading photos for userId:', userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const response = await Promise.race([
        OfflineApiService.getUserPhotos(userId),
        timeoutPromise
      ]);
      
      Logger.log('📸 Photos API response:', response);
      
      if (response.success) {
        Logger.success('Photos loaded successfully:', response.photos.length, 'photos');
        
        // Transform backend data to match component format
        const transformedPhotos = response.photos.map(photo => {
          return {
            id: photo._id,
            date: new Date(photo.date).toLocaleDateString(),
            front: photo.photos?.front,
            side: photo.photos?.side,
            back: photo.photos?.back,
            notes: photo.notes || '',
          };
        });
        
        setPhotos(transformedPhotos);
        
        // Cache the data
        try {
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({
            data: transformedPhotos,
            timestamp: Date.now()
          }));
          Logger.log('💾 Photos cached successfully');
        } catch (cacheErr) {
          Logger.log('Cache write error:', cacheErr);
        }
        
        // Prefetch images for smooth scrolling
        transformedPhotos.slice(0, 6).forEach(photo => {
          if (photo.front) Image.prefetch(photo.front);
          if (photo.side) Image.prefetch(photo.side);
          if (photo.back) Image.prefetch(photo.back);
        });
      } else {
        Logger.log('❌ Photos API failed:', response);
        setError('Failed to load photos');
      }
    } catch (err) {
      Logger.failure('Error loading photos:', err);
      setError(err.message || 'Failed to load photos');
      
      // Try to use cached data even if expired
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data } = JSON.parse(cached);
          setPhotos(data);
          setError('Using offline data');
        }
      } catch (cacheErr) {
        Logger.log('Failed to load cached data:', cacheErr);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    loadUserPhotos(true);
  }, [userId]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingGif size={100} />
      </View>
    );
  }

  if (error && photos.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#ff6b6b', textAlign: 'center', margin: 20 }}>
          {error}
        </Text>
        <TouchableOpacity 
          style={{ backgroundColor: '#d5ff5f', padding: 10, borderRadius: 5 }}
          onPress={loadUserPhotos}
        >
          <Text style={{ color: '#000' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Front</Text>
        <Text style={styles.header}>Side</Text>
        <Text style={styles.header}>Back</Text>
      </View>
      
      {photos.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
            No photos available for this user
          </Text>
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#d5ff5f"
              colors={["#d5ff5f"]}
            />
          }
        >
          {photos.map((item, idx) => {
            return (
            <View key={item.id || idx} style={styles.row}>
              <TouchableOpacity
                style={styles.photoBox}
                onPress={() => setSelectedImage(item.front)}
              >
                <Image
                  source={{ uri: item.front || 'https://picsum.photos/300/400?random=1' }}
                  style={styles.photo}
                  resizeMode="cover"
                  onLoad={() => Logger.success('Front image loaded:', item.front)}
                  onError={(error) => Logger.log('❌ Front image error:', error.nativeEvent.error, 'URL:', item.front)}
                />
                <Text style={styles.date}>{item.date}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoBox}
                onPress={() => setSelectedImage(item.side)}
              >
                <Image
                  source={{ uri: item.side || 'https://picsum.photos/300/400?random=2' }}
                  style={styles.photo}
                  resizeMode="cover"
                  onLoad={() => Logger.success('Side image loaded:', item.side)}
                  onError={(error) => Logger.log('❌ Side image error:', error.nativeEvent.error, 'URL:', item.side)}
                />
                <Text style={styles.date}>{item.date}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoBox}
                onPress={() => setSelectedImage(item.back)}
              >
                <Image
                  source={{ uri: item.back || 'https://picsum.photos/300/400?random=3' }}
                  style={styles.photo}
                  resizeMode="cover"
                  onLoad={() => Logger.success('Back image loaded:', item.back)}
                  onError={(error) => Logger.log('❌ Back image error:', error.nativeEvent.error, 'URL:', item.back)}
                />
                <Text style={styles.date}>{item.date}</Text>
              </TouchableOpacity>
            </View>
            );
          })}
        </ScrollView>
      )}

      {/* Fullscreen modal for photo preview */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade">
        <View style={styles.modalBackground}>
          <Pressable
            style={styles.closeArea}
            onPress={() => setSelectedImage(null)}
          />
          <Image
            source={{ uri: selectedImage }}
            style={styles.fullImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  header: { color: "white", fontSize: 18, fontWeight: "400" },
  scroll: { padding: imageMargin, paddingBottom: 30 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  photoBox: { alignItems: "center", width: imageWidth },
  photo: {
    width: imageWidth,
    height: imageHeight,
    borderRadius: 8,
    backgroundColor: "#222",
  },
  date: { marginTop: 6, color: "#f7f9fbff", fontSize: 17, fontWeight: "300" },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImage: { width: "95%", height: "80%", borderRadius: 12 },
  closeArea: { ...StyleSheet.absoluteFillObject },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 25,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 8,
  },
  closeText: { fontSize: 22, color: "white" },
});
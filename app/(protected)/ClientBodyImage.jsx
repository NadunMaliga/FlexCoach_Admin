import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
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
} from "react-native";
import Logger from '../utils/logger';
import ApiService from "../services/api";
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
  const [error, setError] = useState(null);

  useEffect(() => {
    Logger.debug('ClientBodyImage useEffect - userId:', userId);
    if (userId) {
      loadUserPhotos();
    } else {
      Logger.log('❌ No userId provided');
      setError('No user ID provided');
      setLoading(false);
    }
  }, [userId]);

  const loadUserPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      Logger.debug('Loading photos for userId:', userId);
      
      const response = await ApiService.getUserPhotos(userId);
      
      Logger.log('📸 Photos API response:', response);
      
      if (response.success) {
        Logger.success('Photos loaded successfully:', response.photos.length, 'photos');
        
        // Transform backend data to match component format
        const transformedPhotos = response.photos.map(photo => {
          Logger.debug('Processing photo:', {
            id: photo._id,
            date: photo.date,
            photos: photo.photos,
            front: photo.photos?.front,
            side: photo.photos?.side,
            back: photo.photos?.back
          });
          
          return {
            id: photo._id,
            date: new Date(photo.date).toLocaleDateString(),
            front: photo.photos?.front,
            side: photo.photos?.side,
            back: photo.photos?.back,
            notes: photo.notes || '',
          };
        });
        
        Logger.log('🔄 Transformed photos:', transformedPhotos);
        setPhotos(transformedPhotos);
      } else {
        Logger.log('❌ Photos API failed:', response);
        setError('Failed to load photos');
      }
    } catch (err) {
      Logger.failure('Error loading photos:', err);
      setError(err.message || 'Failed to load photos');
      
      // Set sample data as fallback for testing
      Logger.log('🔄 Setting fallback sample data');
      setPhotos([
        {
          id: 'sample-1',
          date: new Date().toLocaleDateString(),
          front: "https://picsum.photos/300/400?random=1",
          side: "https://picsum.photos/300/400?random=2",
          back: "https://picsum.photos/300/400?random=3",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingGif size={100} />
        <Text style={{ color: '#fff', marginTop: 10 }}>Loading photos...</Text>
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
      
      {/* Debug info */}
      <View style={{ padding: 10, backgroundColor: '#333' }}>
        <Text style={{ color: '#fff', fontSize: 12 }}>
          Debug: {photos.length} photos loaded for user {userId}
        </Text>
        {photos.length > 0 && (
          <Text style={{ color: '#fff', fontSize: 10 }}>
            First photo URLs: F:{photos[0].front?.substring(0, 50)}...
          </Text>
        )}
      </View>

      {photos.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
            No photos available for this user
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {photos.map((item, idx) => {
            Logger.debug('Rendering photo item:', idx, item);
            return (
            <View key={item.id || idx} style={styles.row}>
              <TouchableOpacity
                style={styles.photoBox}
                onPress={() => setSelectedImage(item.front)}
              >
                <Image
                  source={{ uri: item.front || 'https://picsum.photos/300/400?random=1' }}
                  style={styles.photo}
                  resizeMode="contain"
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
                  resizeMode="contain"
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
                  resizeMode="contain"
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
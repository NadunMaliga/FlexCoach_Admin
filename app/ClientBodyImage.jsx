import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
} from "react-native";

const screenWidth = Dimensions.get("window").width;
const imageMargin = 10;
const numColumns = 3;
const imageWidth = (screenWidth - imageMargin * (numColumns + 1)) / numColumns;
const imageHeight = imageWidth * 1.33;

export default function ClientBodyImage() {
  const [photos, setPhotos] = useState([
    // sample data (oya add karapu photos display wenna)
    {
      date: new Date().toLocaleDateString(),
      front: "https://placekitten.com/300/400",
      side: "https://placekitten.com/301/400",
      back: "https://placekitten.com/302/400",
    },
  ]);
  const [selectedImage, setSelectedImage] = useState(null);

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.header}>Front</Text>
        <Text style={styles.header}>Side</Text>
        <Text style={styles.header}>Back</Text>
      </View>

      {/* Photos grid */}
      <ScrollView contentContainerStyle={styles.scroll}>
        {photos.map((item, idx) => (
          <View key={idx} style={styles.row}>
            <TouchableOpacity
              style={styles.photoBox}
              onPress={() => setSelectedImage(item.front)}
            >
              <Image
                source={{ uri: item.front }}
                style={styles.photo}
                resizeMode="contain"
              />
              <Text style={styles.date}>{item.date}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoBox}
              onPress={() => setSelectedImage(item.side)}
            >
              <Image
                source={{ uri: item.side }}
                style={styles.photo}
                resizeMode="contain"
              />
              <Text style={styles.date}>{item.date}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.photoBox}
              onPress={() => setSelectedImage(item.back)}
            >
              <Image
                source={{ uri: item.back }}
                style={styles.photo}
                resizeMode="contain"
              />
              <Text style={styles.date}>{item.date}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

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

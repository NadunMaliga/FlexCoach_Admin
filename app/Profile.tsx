import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function Profile() {
  const [user, setUser] = useState({
    name: "Nadun Malinga",
    email: "nadun321@gmail.com",
    age: 24,
    gender: "Male",
    contact: "+94 71 234 5678",
    photo:
      "https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg",
  });

  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [tempName, setTempName] = useState(user.name);
  const [tempContact, setTempContact] = useState(user.contact);

  // Truncate helper
  const truncate = (text: string, max: number) =>
    text.length > max ? text.substring(0, max) + "..." : text;

  // Pick image
  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Permission to access gallery is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setUser({ ...user, photo: result.assets[0].uri });
      setPhotoModalVisible(false);
    }
  };

  // Save edits
  const saveEdits = () => {
    setUser({ ...user, name: tempName, contact: tempContact });
    setEditModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Profile Picture */}
      <TouchableOpacity onPress={() => setPhotoModalVisible(true)}>
        <Image source={{ uri: user.photo }} style={styles.profilePic} />
        <View style={styles.cameraIcon}>
          <Ionicons name="camera" size={20} color="white" />
        </View>
      </TouchableOpacity>

      {/* Name & Email */}
      <Text style={styles.name}>{truncate(user.name, 12)}</Text>
      <Text style={styles.email}>{truncate(user.email, 25)}</Text>

      {/* Edit Profile Button */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => setEditModalVisible(true)}
      >
        <Text style={styles.editText}>Edit Profile</Text> 
      </TouchableOpacity>

      {/* Personal Info */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        {[
          { icon: "person-outline", label: "Age", value: user.age },
          { icon: "male-female-outline", label: "Gender", value: user.gender },
          { icon: "call-outline", label: "Contact", value: user.contact },
          { icon: "mail-outline", label: "Email", value: user.email },
        ].map((item, index) => (
          <View style={styles.infoRow} key={index}>
            <View style={styles.iconBox}>
              <Ionicons name={item.icon as any} size={22} color="white" />
            </View>
            <View style={styles.textBox}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text style={styles.infoValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Photo Modal */}
      <Modal
        visible={photoModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.bottomModal}>
            <Text style={styles.modalTitle}>Change Profile Photo</Text>
            <TouchableOpacity style={styles.modalButton} onPress={pickImage}>
              <Ionicons name="image-outline" size={20} color="black" />
              <Text style={styles.modalButtonText}>Choose Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#373737ff" }]}
              onPress={() => setPhotoModalVisible(false)}
            >
        
              <Text  style={styles.modalButtonTexttwo}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.bottomModal}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Name"
              placeholderTextColor="#ebebebff"
            />
            <TextInput
              style={styles.modalInput}
              value={tempContact}
              onChangeText={setTempContact}
              placeholder="Contact"
              placeholderTextColor="#f8f8f8ff"
            />
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#7f7f7fff", flex: 0.48 }]}
                onPress={() => setEditModalVisible(false)}
              >
           
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { flex: 0.48 }]}
                onPress={saveEdits}
              >
               
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", alignItems: "center" },
  profilePic: { width: 180, height: 180, borderRadius: 100, marginTop: 40, marginBottom: 10 },
  cameraIcon: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#00000080",
    padding: 8,
    borderRadius: 25,
  },
  name: { color: "white", fontSize: 28, fontWeight: "bold" },
  email: { color: "gray", fontSize: 16, marginBottom: 20 },
  editBtn: { flexDirection: "row", backgroundColor: "white", paddingVertical: 12, borderRadius: 20, marginBottom: 30, width: "90%", justifyContent: "center", alignItems: "center" },
  editText: { color: "black", fontSize: 15 },
  infoSection: { width: "90%", marginTop: 10 },
  sectionTitle: { color: "white", fontSize: 20, marginBottom: 15 },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 18 },
  iconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: "#333", justifyContent: "center", alignItems: "center", marginRight: 12 },
  textBox: { flexDirection: "column" },
  infoLabel: { color: "white", fontSize: 16, fontWeight: "600" },
  infoValue: { color: "gray", fontSize: 14, marginTop: 2 },

  modalBackground: { flex: 1, backgroundColor: "#606060aa", justifyContent: "flex-end" },
  bottomModal: { backgroundColor: "#111", padding: 20, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  modalTitle: { fontSize: 23, fontWeight: "600", color: "white", marginBottom: 35, marginTop:20, textAlign: "center" },
  modalInput: { backgroundColor: "#292929", color: "white", borderRadius: 10, paddingHorizontal: 18, paddingVertical: 17, marginBottom: 10 },
  modalButton: { flexDirection: "row", backgroundColor: "#fff", paddingVertical: 12, borderRadius: 20, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  modalButtonText: { color: "black", fontSize: 16, marginLeft: 8 },
  modalButtonTexttwo:{ color: "white", fontSize: 16, marginLeft: 8 },
});

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Audio from "expo-av";
import EmojiPicker from "rn-emoji-keyboard";
import { useNavigation } from "@react-navigation/native";

export default function ChatScreen() {
  const navigation = useNavigation();

  const [messages, setMessages] = useState([
    { id: "1", text: "Hi! 👋", sender: "other" },
    { id: "2", text: "Hello! 😃", sender: "me" },
    {
      id: "3",
      image:
        "https://i.pinimg.com/736x/c3/6e/ed/c36eed741fed20b9b96a4b498dce6752.jpg",
      sender: "me",
    },
    { id: "4", text: "🔥🔥🔥", sender: "other" },
  ]);
  const [input, setInput] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const soundRef = useRef(null);

  // fullscreen image
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // delete modal
  const [deleteMsgId, setDeleteMsgId] = useState(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([
      ...messages,
      { id: Date.now().toString(), text: input, sender: "me" },
    ]);
    setInput("");
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) {
      setMessages([
        ...messages,
        { id: Date.now().toString(), image: result.assets[0].uri, sender: "me" },
      ]);
    }
  };

  const handleDelete = () => {
    if (deleteMsgId) {
      setMessages(messages.filter((msg) => msg.id !== deleteMsgId));
      setDeleteMsgId(null);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender === "me";
    return (
      <TouchableOpacity
        onLongPress={() => setDeleteMsgId(item.id)}
        delayLongPress={300}
        activeOpacity={0.9}
      >
        <View
          style={[
            styles.messageContainer,
            isMe ? styles.myMessage : styles.otherMessage,
          ]}
        >
          {item.text && (
            <Text style={{ color: isMe ? "black" : "white", fontSize: 16 }}>
              {item.text}
            </Text>
          )}

          {item.image && (
            <TouchableOpacity onPress={() => setFullscreenImage(item.image)}>
              <Image
                source={{ uri: item.image }}
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 10,
                  marginTop: item.text ? 5 : 0,
                }}
              />
            </TouchableOpacity>
          )}

          {item.audio && (
            <TouchableOpacity
              onPress={async () => {
                if (soundRef.current) await soundRef.current.unloadAsync();
                const { sound } = await Audio.Sound.createAsync({
                  uri: item.audio,
                });
                soundRef.current = sound;
                await sound.playAsync();
              }}
              style={{ marginTop: item.text || item.image ? 5 : 0 }}
            >
              <Ionicons
                name="play-circle-outline"
                size={32}
                color={isMe ? "black" : "white"}
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
      <StatusBar barStyle="light-content" backgroundColor="#111" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90} // adjust header height
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={{ marginRight: 15 }}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={28} color="#fff" />
              </TouchableOpacity>

              <Image
                source={{ uri: "https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg" }}
                style={styles.profilePic}
              />
              <View>
                <Text style={styles.username}>Nadun Malinga</Text>
                <Text style={styles.status}>Online</Text>
              </View>
            </View>
          </View>

          {/* Messages */}
          <FlatList
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={{ paddingVertical: 10 }}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={{ marginRight: 10 }} onPress={pickImage}>
              <Ionicons name="image-outline" size={24} color="#afafaf" />
            </TouchableOpacity>

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#999"
                value={input}
                onChangeText={setInput}
              />
              <TouchableOpacity
                style={styles.emojiInside}
                onPress={() => setIsEmojiOpen(true)}
              >
                <Ionicons name="happy-outline" size={22} color="#afafaf" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Ionicons name="send" size={22} color="black" />
            </TouchableOpacity>
          </View>

          {/* Emoji Picker */}
          <EmojiPicker
            open={isEmojiOpen}
            onClose={() => setIsEmojiOpen(false)}
            onEmojiSelected={(emoji) => setInput((prev) => prev + emoji.emoji)}
          />

          {/* Fullscreen Image Modal */}
          <Modal visible={!!fullscreenImage} transparent={true}>
            <View style={styles.fullscreenContainer}>
              <Image
                source={{ uri: fullscreenImage }}
                style={styles.fullscreenImage}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setFullscreenImage(null)}
              >
                <Ionicons name="close" size={35} color="white" />
              </TouchableOpacity>
            </View>
          </Modal>

          {/* Delete Modal */}
          <Modal visible={!!deleteMsgId} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.deleteBox}>
                <Text style={styles.deleteTitle}>Delete this message?</Text>
                <View style={styles.deleteActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#444" }]}
                    onPress={() => setDeleteMsgId(null)}
                  >
                    <Text style={{ color: "white", fontSize: 16 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: "#d9534f" }]}
                    onPress={handleDelete}
                  >
                    <Text style={{ color: "white", fontSize: 16 }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#212121",
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 50,
    marginRight: 10,
    borderColor: "#8cf728",
    borderWidth: 2,
  },
  username: { color: "#fff", fontSize: 19, fontWeight: "500" },
  status: { color: "rgba(213,213,213,1)", fontSize: 13 },
  messagesList: { flex: 1, paddingHorizontal: 12 },
  messageContainer: {
    padding: 15,
    borderRadius: 30,
    marginVertical: 6,
    maxWidth: "70%",
  },
  myMessage: { backgroundColor: "#d5ff5f", alignSelf: "flex-end" },
  otherMessage: { backgroundColor: "#333", alignSelf: "flex-start" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 20,
    backgroundColor: "#222",
  },
  inputWrapper: { flex: 1, position: "relative", marginRight: 8 },
  input: {
    flex: 1,
    backgroundColor: "#333",
    color: "white",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingRight: 40,
    paddingVertical: 12,
    fontSize: 16,
  },
  emojiInside: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -12 }],
  },
  sendButton: {
    backgroundColor: "#d5ff5f",
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 25,
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBox: {
    backgroundColor: "#2a2a2a",
    padding: 25,
    borderRadius: 35,
    width: "75%",
    alignItems: "center",
  },
  deleteTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "200",
    marginBottom: 20,
  },
  deleteActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
});

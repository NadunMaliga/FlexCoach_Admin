import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import * as Audio from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  } from "react-native";
import EmojiPicker from "rn-emoji-keyboard";
import ApiService from "../services/api";
import Logger from '../utils/logger';
import ChatService from "../services/chatService";
import { compressChatImage } from "../utils/imageCompression";
import LoadingGif from '../components/LoadingGif';


export default function ChatScreen() {
  const { userId } = useLocalSearchParams();

  const [userInfo, setUserInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const soundRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // fullscreen image
  const [fullscreenImage, setFullscreenImage] = useState(null);

  // delete modal
  const [deleteMsgId, setDeleteMsgId] = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());
  const [lastImageUri, setLastImageUri] = useState(null);

  // Initialize chat service and load data
  useEffect(() => {
    const initializeChat = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // Load user information
        const userResponse = await ApiService.getUserById(userId);
        const profileResponse = await ApiService.getUserProfile(userId);

        if (userResponse.success) {
          const user = userResponse.user;
          const profilePhoto = profileResponse.success
            ? profileResponse.userProfile.profilePhoto
            : null;

          setUserInfo({
            name: `${user.firstName} ${user.lastName}`,
            avatar: profilePhoto || user.profilePhoto || "https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg",
            status: user.isActive ? "Online" : "Offline"
          });
        }

        // Connect to chat service
        setConnectionStatus('connecting');
        await ChatService.connect();
        setConnectionStatus('connected');

        // Set current chat user for polling
        ChatService.setCurrentChatUser(userId);

        // Load chat history
        const chatHistory = await ChatService.getChatHistory(userId);
        if (chatHistory.success && chatHistory.data) {
          setChatId(chatHistory.data.chatId);

          // Transform messages to match our UI format using ChatService helper
          const transformedMessages = chatHistory.data.messages.map(msg =>
            ChatService.transformMessage(msg)
          );

          setMessages(transformedMessages);

          // Set last message timestamp for polling
          if (transformedMessages.length > 0) {
            ChatService.lastMessageTimestamp = transformedMessages[0].timestamp;
          }

          Logger.info(`Admin loaded ${transformedMessages.length} messages ${chatHistory.fromCache ? '(from cache)' : '(from server)'}`);
        }

      } catch (error) {
        Logger.error('Error initializing chat:', error);
        setConnectionStatus('error');
        Alert.alert('Connection Error', `Failed to connect to chat service: ${error.message}`);

        // Set default user info if loading fails
        setUserInfo({
          name: "User",
          avatar: "https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg",
          status: "Unknown"
        });
      } finally {
        setLoading(false);
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      ChatService.disconnect();
    };
  }, [userId]);

  // Setup chat event listeners
  useEffect(() => {
    const handleMessageReceived = (data) => {
      const newMessage = data.message;
      setMessages(prev => {
        // Avoid duplicates by checking both ID and content
        const isDuplicate = prev.find(msg =>
          msg.id === newMessage.id ||
          (msg.text === newMessage.text && msg.image === newMessage.image &&
            Math.abs(new Date(msg.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000)
        );

        if (isDuplicate) {
          Logger.log('🚫 Duplicate message detected, skipping:', newMessage.id);
          return prev;
        }

        Logger.info('New message received:', newMessage.id);
        return [...prev, newMessage];
      });
    };

    const handleMessageSent = (data) => {
      setSending(false);
      // Replace optimistic message with real message ID if provided
      if (data.messageId) {
        setMessages(prev => prev.map(msg =>
          msg.sending ? { ...msg, id: data.messageId, sending: false } : msg
        ));
      } else {
        // Just remove sending state if no real ID provided
        setMessages(prev => prev.map(msg =>
          msg.sending ? { ...msg, sending: false } : msg
        ));
      }
    };

    const handleMessageError = (data) => {
      setSending(false);
      Alert.alert('Send Error', data.error || 'Failed to send message');
      // Remove failed optimistic messages
      setMessages(prev => prev.filter(msg => !msg.sending));
    };

    // Add event listeners
    ChatService.on('messageReceived', handleMessageReceived);
    ChatService.on('messageSent', handleMessageSent);
    ChatService.on('messageError', handleMessageError);

    // Cleanup listeners
    return () => {
      ChatService.off('messageReceived', handleMessageReceived);
      ChatService.off('messageSent', handleMessageSent);
      ChatService.off('messageError', handleMessageError);
    };
  }, [userId]);

  const sendMessage = async () => {
    if (!input.trim() || sending) {
      Logger.log('📝 Send message blocked - empty input or already sending');
      return;
    }

    const messageText = input.trim();
    Logger.log('📝 Sending text message:', messageText);
    const tempId = `temp_text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Optimistic update
    const optimisticMessage = {
      id: tempId,
      text: messageText,
      sender: "me",
      timestamp: new Date().toISOString(),
      sending: true
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setInput("");
    setSending(true);

    try {
      // Send via chat service
      await ChatService.sendMessage(userId, messageText, 'text');

      // Stop typing indicator
      ChatService.stopTyping(userId);

      // Update optimistic message to remove sending state
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...msg, sending: false } : msg
      ));
      setSending(false);

    } catch (error) {
      Logger.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setSending(false);
      Alert.alert('Send Error', 'Failed to send message. Please try again.');
    }
  };

  const pickImage = async () => {
    if (sending) return;

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Disable editing to keep original aspect ratio
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled) {
        const originalUri = result.assets[0].uri;
        const tempId = `temp_image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        Logger.log('📷 Admin: Compressing image before upload...');

        // Compress the image before sending
        const compressedUri = await compressChatImage(originalUri);

        Logger.log('📷 Admin: Sending compressed image with tempId:', tempId);

        // Clear any previous image state
        setLastImageUri(null);

        // Optimistic update (show compressed image in UI)
        const optimisticMessage = {
          id: tempId,
          image: compressedUri,
          sender: "me",
          timestamp: new Date().toISOString(),
          sending: true
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setSending(true);

        try {
          // Send compressed image via chat service
          await ChatService.sendImage(userId, compressedUri);

          // Update optimistic message to remove sending state
          setMessages(prev => prev.map(msg =>
            msg.id === tempId ? { ...msg, sending: false } : msg
          ));
          setSending(false);

          // Clear the image URI after successful send
          setLastImageUri(null);
        } catch (error) {
          Logger.error('Error sending image:', error);
          // Remove optimistic message on error
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          setSending(false);
          setLastImageUri(null);
          Alert.alert('Send Error', 'Failed to send image. Please try again.');
        }
      }
    } catch (error) {
      Logger.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (deleteMsgId) {
      try {
        await ChatService.deleteMessage(deleteMsgId);
        setMessages(messages.filter((msg) => msg.id !== deleteMsgId));
        setDeleteMsgId(null);
      } catch (error) {
        Logger.error('Error deleting message:', error);
        Alert.alert('Delete Error', 'Failed to delete message. Please try again.');
        setDeleteMsgId(null);
      }
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender === "me";
    return (
      <TouchableOpacity
        onLongPress={() => !item.sending && setDeleteMsgId(item.id)}
        delayLongPress={300}
        activeOpacity={0.9}
      >
        <View
          style={[
            styles.messageContainer,
            isMe ? styles.myMessage : styles.otherMessage,
            item.sending && styles.sendingMessage
          ]}
        >
          {item.text && (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{
                color: isMe ? "black" : "white",
                fontSize: 16,
                opacity: item.sending ? 0.7 : 1
              }}>
                {item.text}
              </Text>
              {item.sending && (
                <ActivityIndicator
                  size="small"
                  color={isMe ? "black" : "white"}
                  style={{ marginLeft: 8 }}
                />
              )}
            </View>
          )}

          {item.image && (
            <TouchableOpacity
              onPress={() => {
                Logger.debug('Image tapped:', item.image);
                if (!item.sending) setFullscreenImage(item.image);
              }}
              disabled={item.sending}
            >
              {failedImages.has(item.id) ? (
                <View style={{
                  width: 200,
                  height: 150,
                  borderRadius: 10,
                  backgroundColor: '#333',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: item.text ? 5 : 0,
                }}>
                  <Ionicons name="image-outline" size={40} color="#666" />
                  <Text style={{ color: '#666', fontSize: 12, marginTop: 5 }}>
                    Image failed to load
                  </Text>
                </View>
              ) : (
                <Image
                  source={{ uri: item.image }}
                  style={{
                    maxWidth: 200,
                    maxHeight: 200,
                    minWidth: 100,
                    minHeight: 100,
                    borderRadius: 10,
                    marginTop: item.text ? 5 : 0,
                    opacity: item.sending ? 0.7 : 1
                  }}
                  resizeMode="contain" // Maintain aspect ratio
                  onError={(error) => {
                    Logger.failure('Image load error:', error);
                    Logger.error('   Image URL:', item.image);
                    setFailedImages(prev => new Set([...prev, item.id]));
                  }}
                  onLoad={() => {
                    Logger.success('Image loaded successfully:', item.image);
                    setFailedImages(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(item.id);
                      return newSet;
                    });
                  }}
                />
              )}
              {item.sending && (
                <View style={styles.sendingOverlay}>
                  <LoadingGif size={24} />
                </View>
              )}
            </TouchableOpacity>
          )}

          {item.audio && (
            <TouchableOpacity
              onPress={async () => {
                if (item.sending) return;
                if (soundRef.current) await soundRef.current.unloadAsync();
                const { sound } = await Audio.Sound.createAsync({
                  uri: item.audio,
                });
                soundRef.current = sound;
                await sound.playAsync();
              }}
              style={{
                marginTop: item.text || item.image ? 5 : 0,
                flexDirection: 'row',
                alignItems: 'center'
              }}
              disabled={item.sending}
            >
              <Ionicons
                name="play-circle-outline"
                size={32}
                color={isMe ? "black" : "white"}
                style={{ opacity: item.sending ? 0.7 : 1 }}
              />
              {item.sending && (
                <ActivityIndicator
                  size="small"
                  color={isMe ? "black" : "white"}
                  style={{ marginLeft: 8 }}
                />
              )}
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.container}>
          {/* User info section */}
          <View style={styles.userInfo}>
            <Image
              source={{ uri: userInfo?.avatar || "https://i.pinimg.com/736x/6f/a3/6a/6fa36aa2c367da06b2a4c8ae1cf9ee02.jpg" }}
              style={styles.profilePic}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.username}>{userInfo?.name || "Loading..."}</Text>
              <Text style={styles.status}>{userInfo?.status || "Unknown"}</Text>
            </View>

            {/* Connection status indicator */}
            <View style={styles.connectionIndicator}>
              <View style={[
                styles.connectionDot,
                connectionStatus === 'connected' && styles.connectedDot,
                connectionStatus === 'connecting' && styles.connectingDot,
                connectionStatus === 'error' && styles.errorDot
              ]} />
              <Text style={styles.connectionText}>
                {connectionStatus === 'connected' ? 'Connected' :
                  connectionStatus === 'connecting' ? 'Connecting...' :
                    connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
              </Text>
            </View>
          </View>

          {/* Messages */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingGif size={100} />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation with {userInfo?.name || "this user"}</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <FlatList
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={{ paddingVertical: 10 }}
                showsVerticalScrollIndicator={false}
              />

              {/* Typing indicator */}
              {isTyping && (
                <View style={styles.typingContainer}>
                  <Text style={styles.typingText}>{userInfo?.name || "User"} is typing...</Text>
                </View>
              )}
            </View>
          )}

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
                onChangeText={(text) => {
                  setInput(text);

                  // Handle typing indicators
                  if (text.trim()) {
                    ChatService.startTyping(userId);

                    // Clear existing timeout
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }

                    // Stop typing after 2 seconds of inactivity
                    typingTimeoutRef.current = setTimeout(() => {
                      ChatService.stopTyping(userId);
                    }, 2000);
                  } else {
                    ChatService.stopTyping(userId);
                    if (typingTimeoutRef.current) {
                      clearTimeout(typingTimeoutRef.current);
                    }
                  }
                }}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                multiline={false}
                editable={!sending}
              />
              <TouchableOpacity
                style={styles.emojiInside}
                onPress={() => setIsEmojiOpen(true)}
              >
                <Ionicons name="happy-outline" size={22} color="#afafaf" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={sending || !input.trim()}
            >
              {sending ? (
                <LoadingGif size={24} />
              ) : (
                <Ionicons name="send" size={22} color="black" />
              )}
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
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#212121",
  },
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
  connectionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#666',
    marginRight: 6,
  },
  connectedDot: {
    backgroundColor: '#4CAF50',
  },
  connectingDot: {
    backgroundColor: '#FF9800',
  },
  errorDot: {
    backgroundColor: '#F44336',
  },
  connectionText: {
    color: '#999',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    color: "#999",
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    color: "#999",
    fontSize: 16,
    marginTop: 10,
  },
  typingContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#1a1a1a",
  },
  typingText: {
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
  },
  sendingMessage: {
    opacity: 0.8,
  },
  sendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
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
  sendButtonDisabled: {
    backgroundColor: "#666",
    opacity: 0.6,
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
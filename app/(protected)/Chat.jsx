import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import * as Audio from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  ImageBackground,
  Keyboard,
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
import OfflineApiService from "../services/OfflineApiService";
import Logger from '../utils/logger';
import ChatService from "../services/chatService";
import { compressChatImage } from "../utils/imageCompression";
import { validateUserId, validateName, validateEmail, sanitizeString } from '../utils/validators';
import { showAlert, showSuccess, showError } from '../utils/customAlert';


export default function ChatScreen() {
  const { userId, userName } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();

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
  const flatListRef = useRef(null);

  // fullscreen image
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const imageModalOpacity = useRef(new Animated.Value(0)).current;
  const imageModalScale = useRef(new Animated.Value(0.8)).current;

  // delete modal
  const [deleteMsgId, setDeleteMsgId] = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());
  const [lastImageUri, setLastImageUri] = useState(null);

  // Animate image modal open/close
  useEffect(() => {
    if (fullscreenImage) {
      // Open animation
      Animated.parallel([
        Animated.timing(imageModalOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(imageModalScale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset for next open
      imageModalOpacity.setValue(0);
      imageModalScale.setValue(0.8);
    }
  }, [fullscreenImage]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      // Small delay to ensure FlatList has rendered
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Initialize chat service and load data
  useEffect(() => {
    const initializeChat = async () => {
      if (!userId) return;

      try {
        // Load cached messages immediately for instant display
        const cachedMessages = await ChatService.getCachedMessages(userId);
        if (cachedMessages.length > 0) {
          const transformedCached = cachedMessages.map(msg => ChatService.transformMessage(msg));
          setMessages(transformedCached);
          setLoading(false); // Show cached messages immediately
        }

        // Load user info for header
        const [userResponse, profileResponse] = await Promise.all([
          OfflineApiService.getUserById(userId),
          OfflineApiService.getUserProfile(userId)
        ]);

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

        // Connect to chat service in background
        setConnectionStatus('connecting');
        await ChatService.connect();
        setConnectionStatus('connected');

        // Set current chat user for polling
        ChatService.setCurrentChatUser(userId);

        // Load fresh chat history from server
        const chatHistory = await ChatService.getChatHistory(userId);
        if (chatHistory.success && chatHistory.data) {
          setChatId(chatHistory.data.chatId);

          // Transform messages - preserve read status from database
          const transformedMessages = chatHistory.data.messages.map(msg =>
            ChatService.transformMessage(msg)
          );

          setMessages(transformedMessages);

          // Set last message timestamp for polling
          if (transformedMessages.length > 0) {
            ChatService.lastMessageTimestamp = transformedMessages[0].timestamp;
          }
        }

      } catch (error) {
        Logger.error('Error initializing chat:', error);
        setConnectionStatus('error');

        // Set default user info if loading fails
        setUserInfo({
          name: userName || "User",
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

  // Update header with user info and connection status
  useEffect(() => {
    if (userInfo) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingVertical: 8 }}>
            <Image
              source={{
                uri: userInfo.avatar,
                cache: 'force-cache'
              }}
              style={{
                width: 50,
                height: 50,
                borderRadius: 50,
                marginRight: 10,
              }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', fontFamily: 'Poppins_300Light' }}>
                {userInfo.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>

                <Text style={{ color: '#999', fontSize: 13, marginTop: -9, fontFamily: 'Poppins_300Light' }}>
                  {connectionStatus === 'connected' ? 'Connected' :
                    connectionStatus === 'connecting' ? 'Connecting...' :
                      connectionStatus === 'error' ? 'Connection Error' : 'Disconnected'}
                </Text>
              </View>
            </View>
          </View>
        ),
        headerRight: () => null, // Remove logout icon
      });
    }
  }, [userInfo, connectionStatus, navigation]);

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
      showAlert('Send Error', data.error || 'Failed to send message');
      // Remove failed optimistic messages
      setMessages(prev => prev.filter(msg => !msg.sending));
    };

    const handleMessageRead = (data) => {
      Logger.log('📖 Message read receipt:', data);
      // Mark messages as read
      setMessages(prev => prev.map(msg => ({
        ...msg,
        read: true
      })));
    };

    // Add event listeners
    ChatService.on('messageReceived', handleMessageReceived);
    ChatService.on('messageSent', handleMessageSent);
    ChatService.on('messageError', handleMessageError);
    ChatService.on('messageRead', handleMessageRead);

    // Emit that admin has opened the chat (mark messages as read)
    ChatService.socket?.emit('markAsRead', { userId });

    // Cleanup listeners
    return () => {
      ChatService.off('messageReceived', handleMessageReceived);
      ChatService.off('messageSent', handleMessageSent);
      ChatService.off('messageError', handleMessageError);
      ChatService.off('messageRead', handleMessageRead);
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
      showAlert('Send Error', 'Failed to send message. Please try again.');
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
          showAlert('Send Error', 'Failed to send image. Please try again.');
        }
      }
    } catch (error) {
      Logger.error('Error picking image:', error);
      showAlert('Error', 'Failed to pick image. Please try again.');
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
        showAlert('Delete Error', 'Failed to delete message. Please try again.');
        setDeleteMsgId(null);
      }
    }
  };

  // Helper function to format date like WhatsApp
  const formatDateSeparator = (timestamp) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to compare dates only
    const resetTime = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const msgDate = resetTime(messageDate);
    const todayDate = resetTime(today);
    const yesterdayDate = resetTime(yesterday);

    if (msgDate.getTime() === todayDate.getTime()) {
      return 'Today';
    } else if (msgDate.getTime() === yesterdayDate.getTime()) {
      return 'Yesterday';
    } else {
      // Check if within last week
      const daysDiff = Math.floor((todayDate - msgDate) / (1000 * 60 * 60 * 24));
      if (daysDiff < 7) {
        return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        return messageDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
      }
    }
  };

  // Check if we should show date separator
  const shouldShowDateSeparator = (currentItem, index) => {
    if (index === 0) return true;

    const prevItem = messages[index - 1];
    const currentDate = new Date(currentItem.timestamp).toDateString();
    const prevDate = new Date(prevItem.timestamp).toDateString();

    return currentDate !== prevDate;
  };

  const renderItem = ({ item, index }) => {
    const isMe = item.sender === "me";
    const hasOnlyImage = item.image && !item.text;
    const showDateSeparator = shouldShowDateSeparator(item, index);

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateSeparatorLine} />
            <Text style={styles.dateSeparatorText}>
              {formatDateSeparator(item.timestamp)}
            </Text>
            <View style={styles.dateSeparatorLine} />
          </View>
        )}
        <TouchableOpacity
          onLongPress={() => !item.sending && setDeleteMsgId(item.id)}
          delayLongPress={300}
          activeOpacity={0.9}
          style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', marginVertical: 6 }}
        >
          <View
            style={[
              !hasOnlyImage && styles.messageContainer,
              !hasOnlyImage && (isMe ? styles.myMessage : styles.otherMessage),
              item.sending && styles.sendingMessage
            ]}
          >
            {item.text && (
              <View>
                <Text style={{
                  color: isMe ? "black" : "white",
                  fontSize: 16,
                  opacity: item.sending ? 0.7 : 1,
                  paddingRight: 50, // Space for timestamp
                }}>
                  {(() => {
                    // Better emoji detection using regex
                    const emojiRegex = /([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{FE00}-\u{FE0F}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F18E}]|[\u{3030}]|[\u{2B50}]|[\u{2B55}]|[\u{231A}]|[\u{231B}]|[\u{23E9}-\u{23EC}]|[\u{23F0}]|[\u{23F3}]|[\u{25FD}]|[\u{25FE}]|[\u{2614}]|[\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}]|[\u{26AB}]|[\u{26BD}]|[\u{26BE}]|[\u{26C4}]|[\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}]|[\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2705}]|[\u{270A}]|[\u{270B}]|[\u{2728}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2795}-\u{2797}]|[\u{27B0}]|[\u{27BF}]|[\u{2B1B}]|[\u{2B1C}])/gu;

                    const parts = [];
                    let lastIndex = 0;
                    let match;

                    while ((match = emojiRegex.exec(item.text)) !== null) {
                      // Add text before emoji
                      if (match.index > lastIndex) {
                        parts.push(item.text.substring(lastIndex, match.index));
                      }

                      // Add emoji with larger size
                      parts.push(
                        <Text key={`emoji-${match.index}`} style={{ fontSize: 32 }}>
                          {match[0]}
                        </Text>
                      );

                      lastIndex = emojiRegex.lastIndex;
                    }

                    // Add remaining text
                    if (lastIndex < item.text.length) {
                      parts.push(item.text.substring(lastIndex));
                    }

                    return parts.length > 0 ? parts : item.text;
                  })()}
                </Text>
                <View style={styles.timestampContainer}>
                  <Text style={[
                    styles.timestamp,
                    { color: isMe ? "#666" : "#aaa" }
                  ]}>
                    {new Date(item.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </Text>
                  {isMe && !item.sending && (
                    <Ionicons
                      name={item.read ? "checkmark-done" : "checkmark"}
                      size={16}
                      color={item.read ? "#53bdeb" : "#666"}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                  {item.sending && (
                    <ActivityIndicator
                      size="small"
                      color={isMe ? "#666" : "#aaa"}
                      style={{ marginLeft: 4 }}
                    />
                  )}
                </View>
              </View>
            )}

            {item.image && (
              <TouchableOpacity
                onPress={() => {
                  Logger.debug('Image tapped:', item.image);
                  if (!item.sending) setFullscreenImage(item.image);
                }}
                disabled={item.sending}
                style={{ marginTop: item.text ? 5 : 0 }}
              >
                {failedImages.has(item.id) ? (
                  <View style={{
                    width: 200,
                    height: 150,
                    borderRadius: 10,
                    backgroundColor: '#333',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Ionicons name="image-outline" size={40} color="#666" />
                    <Text style={{ color: '#666', fontSize: 12, marginTop: 5 }}>
                      Image failed to load
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{
                      uri: item.image,
                      cache: 'force-cache' // Enable aggressive caching
                    }}
                    style={{
                      width: 200,
                      height: 200,
                      borderRadius: 10,
                      opacity: item.sending ? 0.7 : 1
                    }}
                    resizeMode="cover"
                    onError={(error) => {
                      Logger.failure('Image load error:', error);
                      Logger.error('   Image URL:', item.image);
                      setFailedImages(prev => new Set([...prev, item.id]));
                    }}
                    onLoad={() => {
                      Logger.success('Image loaded successfully (cached):', item.image);
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
                    <ActivityIndicator size="large" color="#d5ff5f" />
                  </View>
                )}
              </TouchableOpacity>
            )}

            {/* Timestamp for image-only messages */}
            {item.image && !item.text && (
              <View style={[styles.timestampContainer, { marginTop: 4 }]}>
                <Text style={[
                  styles.timestamp,
                  { color: isMe ? "#666" : "#aaa" }
                ]}>
                  {new Date(item.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </Text>
                {isMe && !item.sending && (
                  <Ionicons
                    name={item.read ? "checkmark-done" : "checkmark"}
                    size={16}
                    color={item.read ? "#53bdeb" : "#666"}
                    style={{ marginLeft: 4 }}
                  />
                )}
                {item.sending && (
                  <ActivityIndicator
                    size="small"
                    color={isMe ? "#666" : "#aaa"}
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
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
      </>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#111" }}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={-20}
      >
        <ImageBackground
          source={require('../../assets/images/chatbg.jpg')}
          style={styles.container}
          resizeMode="cover"
        >

          {/* Messages */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#d5ff5f" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={{ paddingVertical: 10 }}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />

              {/* Typing indicator */}
              {isTyping && (
                <View style={styles.typingContainer}>
                  <Text style={styles.typingText}>Typing...</Text>
                </View>
              )}
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                placeholderTextColor="#999"
                value={input}
                maxLength={1000}
                multiline={true}
                numberOfLines={1}
                textAlignVertical="center"
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
                editable={!sending}
              />
              <View style={styles.inputIconsContainer}>
                <TouchableOpacity
                  style={styles.inputIcon}
                  onPress={pickImage}
                >
                  <Ionicons name="attach-outline" size={26} color="#afafaf" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inputIcon}
                  onPress={() => setIsEmojiOpen(true)}
                >
                  <Ionicons name="happy-outline" size={26} color="#afafaf" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.sendButton, sending && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={sending || !input.trim()}
            >
              {sending ? (
                <ActivityIndicator size="small" color="black" />
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
          <Modal visible={!!fullscreenImage} transparent={true} animationType="none">
            <Animated.View
              style={[
                styles.fullscreenContainer,
                { opacity: imageModalOpacity }
              ]}
            >
              <Animated.View
                style={{
                  transform: [{ scale: imageModalScale }],
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={{
                    uri: fullscreenImage,
                    cache: 'force-cache'
                  }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />
              </Animated.View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setFullscreenImage(null)}
              >
                <Ionicons name="close" size={35} color="white" />
              </TouchableOpacity>
            </Animated.View>
          </Modal>

          {/* Delete Modal */}
          <Modal visible={!!deleteMsgId} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.deleteBox}>
                <Text style={styles.deleteTitle}>Delete this message?</Text>
                <View style={styles.deleteActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, {color:"red"}]}
                    onPress={() => setDeleteMsgId(null)}
                  >
                    <Text style={{ color: "white", fontSize: 16 }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { color:"red"}]}
                    onPress={handleDelete}
                  >
                    <Text style={{ color: "white", fontSize: 16 }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ImageBackground>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 50,
    marginVertical: -1,
    maxWidth: "70%",
  },
  myMessage: { backgroundColor: "#d5ff5f", alignSelf: "flex-end" },
  otherMessage: { backgroundColor: "#333", alignSelf: "flex-start" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 20,
    backgroundColor: "#000000",
    borderTopWidth: 1,
    borderTopColor: "#000000ff",
  },
  inputWrapper: { flex: 1, position: "relative", marginRight: 8 },
  input: {
    flex: 1,
    backgroundColor: "#333",
    color: "white",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingRight: 80,
    paddingVertical: 15,
    fontSize: 15,
    minHeight: 50,
    maxHeight: 100,
  },
  inputIconsContainer: {
    position: "absolute",
    right: 10,
    top: "50%",
    transform: [{ translateY: -13 }],
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputIcon: {
    padding: 2,
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
    backgroundColor: "#090909ff",
    borderWidth:1,
    borderColor:"#2e2e2eff",
    padding: 25,
    borderRadius: 20,
    width: "75%",
    alignItems: "center",
  },
  deleteTitle: {
    color: "white",
    fontFamily: 'Poppins_300Light',
    fontSize: 18,
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
    borderRadius: 50,
    alignItems: "center",
    marginHorizontal: 5,
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    fontWeight: '400',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  dateSeparatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dateSeparatorText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 12,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
import React, { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path } from "react-native-svg";



import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  useFonts,
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";

export default function Clients() {
  const [searchText, setSearchText] = useState("");
  const navigation = useNavigation();

  const [filter, setFilter] = useState("All"); // All, Active, Inactive
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "John Doe",
      daysAgo: 2,
      status: "Active",
      avatar:
        "https://i.pinimg.com/736x/8c/6d/db/8c6ddb5fe6600fcc4b183cb2ee228eb7.jpg",
    },
    {
      id: 2,
      name: "Jane Smith",
      daysAgo: 4,
      status: "Inactive",
      avatar:
        "https://i.pinimg.com/736x/3b/2d/23/3b2d2393c14ec7650927614922186347.jpg",
    },
    {
      id: 3,
      name: "Chris Brown",
      daysAgo: 5,
      status: "Active",
      avatar:
        "https://i.pinimg.com/1200x/33/68/c4/3368c4cf650b851ed3f13b87bc882db9.jpg",
    },
  ]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  let [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) return null;

  // Filter users by searchText and filter status
  const filteredUsers = users.filter((user) => {
    const matchesText = user.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesFilter =
      filter === "All"
        ? true
        : filter === "Active"
          ? user.status === "Active"
          : user.status === "Inactive";
    return matchesText && matchesFilter;
  });

  // Handle status badge click
  const handleStatusPress = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  // Confirm status change
  const confirmChangeStatus = () => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === selectedUser.id
          ? {
            ...u,
            status: u.status === "Active" ? "Inactive" : "Active",
          }
          : u
      )
    );
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={25}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search users..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {["All", "Active", "Inactive"].map((item) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.filterButton,
              filter === item && styles.filterButtonActive,
            ]}
            onPress={() => setFilter(item)}
          >
            <Text
              style={[
                styles.filterText,
                filter === item && {
                  color: "#000",
                  fontFamily: "Poppins_600SemiBold",
                },
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Users List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 140 }}
      >
        {filteredUsers.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={styles.userRow}
            onPress={() =>
              navigation.push("ClientProfile", { user: JSON.stringify(user) })
            }
          >
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {user.name}
              </Text>
              <Text style={styles.userJoined}>
                Joined {user.daysAgo} days ago
              </Text>
            </View>

            {/* Chat Icon for Active Users */}
            {user.status === "Active" && (
              <TouchableOpacity
                style={{ marginRight: 15 }}
                onPress={() => navigation.push("Chat", { userId: user.id })}
              >
                <Svg width={25} height={25} viewBox="0 0 24 24" fill="none" stroke="#707070ff" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M21 15C21 16.6569 19.6569 18 18 18H7L3 22V4C3 2.34315 4.34315 1 6 1H18C19.6569 1 21 2.34315 21 4V15Z" />
                </Svg>
              </TouchableOpacity>
            )}


            {/* Status Button */}
            <TouchableOpacity
              style={[
                styles.statusBadge,
                user.status === "Active" ? styles.active : styles.inactive,
              ]}
              onPress={() => handleStatusPress(user)}
            >
              <Text
                style={[
                  styles.statusText,
                  user.status === "Active"
                    ? { color: "#010e03ff" }
                    : { color: "#fff" },
                ]}
              >
                {user.status}
              </Text>
            </TouchableOpacity>


          </TouchableOpacity>
        ))}


        {filteredUsers.length === 0 && (
          <Text style={{ color: "#999", textAlign: "center", marginTop: 50 }}>
            No users found.
          </Text>
        )}
      </ScrollView>

      {/* Modal for Change Status */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Change Status</Text>
            {selectedUser && (
              <Text style={styles.modalMessage}>
                Do you want to{" "}
                {selectedUser.status === "Active"
                  ? "deactivate"
                  : "activate"}{" "}
                {selectedUser.name}?
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: "#d5ff5f" }]}
                onPress={confirmChangeStatus}
              >
                <Text style={[styles.modalBtnText, { color: "#000" }]}>
                  Yes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, { borderWidth: 1, borderColor: "#555" }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: "#fff" }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1c1c1c",
    paddingHorizontal: 20,
    paddingVertical: 1,
    borderRadius: 40,
    margin: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontFamily: "Poppins_400Regular",
    fontSize: 17,
    marginTop: 5,
  },
  filterContainer: {
    flexDirection: "row",
    marginHorizontal: 10,
    marginVertical: 10,
    paddingHorizontal: 3,
    justifyContent: "flex-start",
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderColor: "#848484ff",
    borderWidth: 1,
    marginRight: 5,
  },
  filterButtonActive: {
    backgroundColor: "#d5ff5f",
    borderColor: "#d5ff5f",
  },
  filterText: {
    fontFamily: "Poppins_400Regular",
    color: "#fff",
    fontSize: 16,
  },
  userRow: {
    flexDirection: "row",
    borderRadius: 50,
    alignItems: "center",
    paddingVertical: 9,
    paddingHorizontal: 3,
    marginBottom: 5,
  },
  avatar: { width: 65, height: 65, borderRadius: 50, marginRight: 13 },
  userName: {
    color: "#d4d3d3ff",
    fontSize: 18,
    fontFamily: "Poppins_400Regular",
  },
  userJoined: {
    color: "#aaa",
    fontSize: 13,
    fontFamily: "Poppins_300Light",
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  active: { backgroundColor: "#fbfefcff" },
  inactive: { backgroundColor: "#444444ff" },
  statusText: { fontSize: 13, fontFamily: "Poppins_400Regular" },

  // Modal Styles
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#1C1C1E",
    borderRadius: 25,
    padding: 25,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 10,
    fontFamily: "Poppins_600SemiBold",
  },
  modalMessage: {
    fontSize: 15,
    color: "#aaa",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Poppins_400Regular",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalBtnText: {
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
  },
});

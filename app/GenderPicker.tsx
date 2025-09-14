import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";

export default function GenderPicker({ value, onChange }) {
  const [visible, setVisible] = useState(false);
  const options = ["Male", "Female", "Other"];

  return (
    <View style={{ marginBottom: 15 }}>
      <TouchableOpacity
        style={styles.inputWrapper}
        onPress={() => setVisible(true)}
      >
        <Ionicons name="male-female-outline" size={22} color="white" />
        <Text style={[styles.input, { paddingVertical: 0 }]}>
          {value || "Select Gender"}
        </Text>
        <Ionicons name="chevron-down-outline" size={20} color="white" />
      </TouchableOpacity>

      <Modal
        isVisible={visible}
        onBackdropPress={() => setVisible(false)}
        backdropOpacity={0.3}
        style={{ justifyContent: "flex-end", margin: 0 }}
      >
        <View style={styles.modalContainer}>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalItem}
                onPress={() => {
                  onChange(item);
                  setVisible(false);
                }}
              >
                <Text style={styles.modalText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#292929",
    borderRadius: 13,
    paddingHorizontal: 15,
    height: 55,
  },
  input: {
    flex: 1,
    color: "white",
    marginLeft: 10,
    fontSize: 17,
  },
  modalContainer: {
    backgroundColor: "#2a2a2aff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 20,
  },
  modalItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#343434ff",
  },
  modalText: {
    color: "white",
    fontSize: 18,
  },
});

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "./Themed";

export default function Home() {
  const [searchText, setSearchText] = useState("");
  const [newAppName, setNewAppName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwords, setPasswords] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});
  const [editingPassword, setEditingPassword] = useState({});
  const [editingUsername, setEditingUsername] = useState({});

  useEffect(() => {
    loadPasswords();
  }, []);

  function generateStrongPassword() {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const all = upper + lower + digits + symbols;
    let password = [
      upper[Math.floor(Math.random() * upper.length)],
      lower[Math.floor(Math.random() * lower.length)],
      digits[Math.floor(Math.random() * digits.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];
    for (let i = 4; i < 12; i++) {
      password.push(all[Math.floor(Math.random() * all.length)]);
    }
    return password.sort(() => Math.random() - 0.5).join("");
  }

  function getPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: "Weak", color: "#FF4D4D", width: "33%" };
    if (strength <= 4) return { level: "Medium", color: "#FFD700", width: "66%" };
    return { level: "Strong", color: "#28a745", width: "100%" };
  }

  const loadPasswords = async () => {
    try {
      const storedPasswords = await AsyncStorage.getItem("passwords");
      if (storedPasswords) {
        setPasswords(JSON.parse(storedPasswords));
      }
    } catch (error) {
      console.error("Error loading passwords:", error);
    }
  };

  const savePasswords = async (updatedPasswords) => {
    try {
      await AsyncStorage.setItem("passwords", JSON.stringify(updatedPasswords));
      setPasswords(updatedPasswords);
    } catch (error) {
      console.error("Error saving passwords:", error);
    }
  };

  const addPassword = () => {
    if (newAppName && newUsername && newPassword) {
      const newId = Date.now().toString();
      const updatedPasswords = [
        ...passwords,
        { id: newId, appName: newAppName, username: newUsername, password: newPassword },
      ];
      savePasswords(updatedPasswords);
      setShowPasswords((prev) => ({ ...prev, [newId]: false }));
      setNewAppName("");
      setNewUsername("");
      setNewPassword("");
    }
  };

  const deletePassword = (id) => {
    const updatedPasswords = passwords.filter((item) => item.id !== id);
    savePasswords(updatedPasswords);
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (id, currentUsername, currentPassword) => {
    setEditingUsername((prev) => ({ ...prev, [id]: currentUsername }));
    setEditingPassword((prev) => ({ ...prev, [id]: currentPassword }));
  };

  const saveEditedPassword = (id) => {
    const updatedPasswords = passwords.map((item) =>
      item.id === id
        ? { ...item, username: editingUsername[id], password: editingPassword[id] }
        : item
    );
    savePasswords(updatedPasswords);
    setEditingUsername((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    setEditingPassword((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  const renderPasswordStrengthBar = (password) => {
    const { level, color, width } = getPasswordStrength(password);
    return (
      <View style={styles.strengthContainer}>
        <View style={[styles.strengthBar, { backgroundColor: color, width }]} />
        <Text style={[styles.strengthLabel, { color }]}>{level}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const currentPassword =
      editingPassword[item.id] !== undefined
        ? editingPassword[item.id]
        : item.password;

    return (
      <View style={styles.passwordItem}>
        <View style={styles.card}>
          <Text style={styles.appName}>{item.appName}</Text>
          {editingUsername[item.id] !== undefined ? (
            <TextInput
              style={styles.input}
              value={editingUsername[item.id]}
              onChangeText={(text) =>
                setEditingUsername((prev) => ({ ...prev, [item.id]: text }))
              }
            />
          ) : (
            <Text style={styles.username}>User: {item.username}</Text>
          )}
          {editingPassword[item.id] !== undefined ? (
            <TextInput
              style={styles.input}
              value={editingPassword[item.id]}
              onChangeText={(text) =>
                setEditingPassword((prev) => ({ ...prev, [item.id]: text }))
              }
            />
          ) : (
            <Text>{showPasswords[item.id] ? item.password : "*****"}</Text>
          )}
          {renderPasswordStrengthBar(currentPassword)}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => togglePasswordVisibility(item.id)}
            >
              <Text style={styles.buttonText}>
                {showPasswords[item.id] ? "Hide" : "Show"}
              </Text>
            </TouchableOpacity>
            {editingPassword[item.id] !== undefined ? (
              <TouchableOpacity
                style={styles.button}
                onPress={() => saveEditedPassword(item.id)}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.button}
                onPress={() => startEditing(item.id, item.username, item.password)}
              >
                <Text style={styles.buttonText}>Edit</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deletePassword(item.id)}
            >
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Search for app/website"
        value={searchText}
        onChangeText={setSearchText}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter app/website name"
        value={newAppName}
        onChangeText={setNewAppName}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter username"
        value={newUsername}
        onChangeText={setNewUsername}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        value={newPassword}
        onChangeText={setNewPassword}
        placeholderTextColor="#888"
      />
      <TouchableOpacity
        style={styles.generateButton}
        onPress={() => setNewPassword(generateStrongPassword())}
      >
        <Text style={styles.generateText}>Generate Strong Password</Text>
      </TouchableOpacity>
      {newPassword.length > 0 && renderPasswordStrengthBar(newPassword)}
      <TouchableOpacity style={styles.addButton} onPress={addPassword}>
        <Text style={styles.addButtonText}>Add New Password</Text>
      </TouchableOpacity>
      <FlatList
        data={passwords.filter((item) =>
          item.appName.toLowerCase().includes(searchText.toLowerCase())
        )}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 20 }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F4F6F9" },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    textAlignVertical: "center",
  },
  card: { padding: 15, backgroundColor: "#fff", borderRadius: 8, marginBottom: 10 },
  appName: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  username: { fontSize: 14, marginBottom: 5 },
  actions: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  button: { backgroundColor: "#007BFF", padding: 8, borderRadius: 5 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  deleteButton: { backgroundColor: "#FF4D4D", padding: 8, borderRadius: 5 },
  deleteText: { color: "#fff", fontWeight: "bold" },
  addButton: { backgroundColor: "#28a745", padding: 10, borderRadius: 5, marginTop: 10 },
  addButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  generateButton: {
    backgroundColor: "#6c757d",
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  generateText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  strengthContainer: {
    marginTop: 5,
    marginBottom: 10,
  },
  strengthBar: {
    height: 6,
    borderRadius: 3,
  },
  strengthLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "bold",
  },
});

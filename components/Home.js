import React, { useState, useEffect } from "react"; 
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "./Themed";
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';



export default function Home() {
  const [searchText, setSearchText] = useState("");
  const [newAppName, setNewAppName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState(generateStrongPassword());
  const [passwords, setPasswords] = useState([]);
  const [showPasswords, setShowPasswords] = useState({});
  const [editingPassword, setEditingPassword] = useState({});
  const [editingUsername, setEditingUsername] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    loadPasswords();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
      }
    } catch (error) {
      console.error('认证检查失败:', error);
      Alert.alert('错误', '认证检查失败');
    } finally {
      setIsLoading(false);
    }
  };

  function generateStrongPassword() {
    return Math.random().toString(36).slice(-10);
  }

  // const loadPasswords = async () => {
  //   try {
  //     const response = await axios.get('http://localhost:3000?Name=AAA');
  //     console.log(response.data.message);
  //   } catch (error) {
  //     Alert.alert("Error", error.message);
  //   }
  //   // try {
  //   //   const storedPasswords = await AsyncStorage.getItem("passwords");
  //   //   if (storedPasswords) {
  //   //     setPasswords(JSON.parse(storedPasswords));
  //   //   }
  //   // } catch (error) {
  //   //   console.error("Error loading passwords:", error);
  //   // }
  // };
  const loadPasswords = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('未登录');
      }
      
      const response = await axios.get('http://localhost:3000/passwords', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setPasswords(response.data);
    } catch (error) {
      setError(error.message);
      Alert.alert("错误", error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveEditedPassword = async (id) => {
    try {
      const response = await axios.put(`http://localhost:3000/passwords/${id}`, {
        username: editingUsername[id],
        password: editingPassword[id]
      }, {
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
        }
      });
      
      const updatedPasswords = passwords.map(item =>
        item.id === id ? response.data : item
      );
      setPasswords(updatedPasswords);
      setEditingUsername({});
      setEditingPassword({});
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const addPassword = async () => {
    if (newAppName && newUsername && newPassword) {
      try {
        const response = await axios.post('http://localhost:3000/passwords', {
          appName: newAppName,
          username: newUsername,
          password: newPassword
        }, {
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
          }
        });
        
        setPasswords([...passwords, response.data]);
        setNewAppName("");
        setNewUsername("");
        setNewPassword(generateStrongPassword());
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    }
  };

  const deletePassword = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/passwords/${id}`, {
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`
        }
      });
      setPasswords(passwords.filter(item => item.id !== id));
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (id, currentUsername, currentPassword) => {
    setEditingUsername((prev) => ({ ...prev, [id]: currentUsername }));
    setEditingPassword((prev) => ({ ...prev, [id]: currentPassword }));
  };

  // const saveEditedPassword = (id) => {
  //   const updatedPasswords = passwords.map((item) =>
  //     item.id === id
  //       ? { ...item, username: editingUsername[id], password: editingPassword[id] }
  //       : item
  //   );
  //   savePasswords(updatedPasswords);
  //   setEditingUsername((prev) => {
  //     const updated = { ...prev };
  //     delete updated[id];
  //     return updated;
  //   });
  //   setEditingPassword((prev) => {
  //     const updated = { ...prev };
  //     delete updated[id];
  //     return updated;
  //   });
  // };

  const renderItem = ({ item }) => (
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
  return (
    <ThemedView style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TextInput
        style={styles.searchBar}
        placeholder="Search for app/website"
        value={searchText}
        onChangeText={setSearchText}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter app/website name"
        value={newAppName}
        onChangeText={setNewAppName}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter username"
        value={newUsername}
        onChangeText={setNewUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter password"
        value={newPassword}
        onChangeText={setNewPassword}
      />
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
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10
  },
  card: { padding: 15, backgroundColor: "#fff", borderRadius: 8 , boxShadow: '0 2px 4px rgba(0,0,0,0.1)'},
  appName: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  username: { fontSize: 14, marginBottom: 5 },
  actions: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  button: { backgroundColor: "#007BFF", padding: 8, borderRadius: 5 },
  buttonText: { color: "#fff", fontWeight: "bold" },
  deleteButton: { backgroundColor: "#FF4D4D", padding: 8, borderRadius: 5 },
  deleteText: { color: "#fff", fontWeight: "bold" },
  addButton: { backgroundColor: "#28a745", padding: 10, borderRadius: 5, marginTop: 10 },
  addButtonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
});

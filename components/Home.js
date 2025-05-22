import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
  Linking,
  Clipboard,
  Platform
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "./Themed";
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import config from './config'; 

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
      console.error('Authentication check failed:', error);
      Alert.alert('Error', 'Authentication check failed');
    } finally {
      setIsLoading(false);
    }
  };

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

  // 密码强度评估函数
  function getPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    // 添加提示信息
    let tips = [];
    if (password.length < 8) tips.push("increase password length");
    if (!/[A-Z]/.test(password)) tips.push("add uppercase letters");
    if (!/[a-z]/.test(password)) tips.push("add lowercase letters");
    if (!/[0-9]/.test(password)) tips.push("add numbers");
    if (!/[^A-Za-z0-9]/.test(password)) tips.push("add special characters");
    
    return { 
      level: strength <= 2 ? "weak" : strength <= 4 ? "medium" : "strong", 
      color: strength <= 2 ? "#FF4D4D" : strength <= 4 ? "#FFD700" : "#28a745", 
      width: strength <= 2 ? "33%" : strength <= 4 ? "66%" : "100%",
      tips: tips.length > 0 ? tips.join(",") : ""
    };
  }

  // 密码强度条渲染函数
  const renderPasswordStrengthBar = (password) => {
    const { level, color, width, tips } = getPasswordStrength(password);
    return (
      <View style={styles.strengthContainer}>
        <View style={[styles.strengthBar, { backgroundColor: color, width }]} />
        <View style={styles.strengthLabelContainer}>
          <Text style={[styles.strengthLabel, { color }]}>{level}</Text>
          {tips.length > 0 && <Text style={styles.strengthTips}>Suggestion: {tips}</Text>}
        </View>
      </View>
    );
  };

  const loadPasswords = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        throw new Error('Not logged in');
      }
      
      const response = await axios.get(`${config.API_BASE_URL}/passwords`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setPasswords(response.data);
    } catch (error) {
      setError(error.message);
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveEditedPassword = async (id) => {
    try {
      const response = await axios.put(`${config.API_BASE_URL}/passwords/${id}`, {
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
      // 检查密码强度，如果弱则警告
      const strength = getPasswordStrength(newPassword);
      if (strength.level === "weak") {
        Alert.alert(
          "Weak password warning",
          `You are using a weak password. ${strength.tips}`,
          [
            {text: "modify password", style: "cancel"},
            {text: "still use", onPress: () => submitNewPassword()}
          ]
        );
      } else {
        submitNewPassword();
      }
    }
  };

  const submitNewPassword = async () => {
    try {
      const response = await axios.post(`${config.API_BASE_URL}/passwords`, {
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
  };

  const deletePassword = async (id) => {
    try {
      await axios.delete(`${config.API_BASE_URL}/passwords/${id}`, {
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

  // 快速登录和自动填充功能
  const visitWebsite = async (website, username, password) => {
    try {
      let url = website;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      // 复制凭据到剪贴板 - 使用特殊格式便于解析
      const credentials = `${username}\t${password}`;
      if (Platform.OS === 'web') {
        try {
          await navigator.clipboard.writeText(credentials);
          
          // 在Web环境中，可以尝试使用新窗口打开并注入辅助脚本
          const newWindow = window.open(url, '_blank');
          if (newWindow) {
            // 提示用户使用快捷键粘贴
            Alert.alert(
              "快速登录准备就绪",
              "用户名和密码已按顺序复制到剪贴板。你可以:\n\n" +
              "1. 点击'确认'后，在新窗口中\n" +
              "2. 点击用户名输入框\n" +
              "3. 粘贴 (Ctrl/Cmd+V)\n" +
              "4. 按Tab键自动移动到密码输入框",
              [{ text: "确认", style: "default" }]
            );
          } else {
            Alert.alert(
              "弹窗被阻止",
              "请允许弹窗并重试，或手动访问网站并粘贴凭据。",
              [{ text: "手动打开", onPress: () => Linking.openURL(url) }]
            );
          }
        } catch (err) {
          console.error("复制凭据失败:", err);
          // 如果复制失败，回退到普通链接打开
          Linking.openURL(url);
        }
      } else {
        // 移动设备处理
        await Clipboard.setString(credentials);
        
        Alert.alert(
          "快速登录准备就绪",
          "用户名和密码已按顺序复制到剪贴板。你可以:\n\n" +
          "1. 点击'确认'打开网站\n" +
          "2. 点击用户名输入框\n" +
          "3. 长按并选择粘贴\n" +
          "4. 对密码输入框重复同样操作",
          [{ text: "确认", onPress: () => Linking.openURL(url) }]
        );
      }
    } catch (error) {
      console.error("访问网站时出错:", error);
      Alert.alert("错误", "准备网站登录失败");
    }
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
            <Text style={styles.username}>username: {item.username}</Text>
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
          
          {/* 密码强度条显示 */}
          {renderPasswordStrengthBar(currentPassword)}
          
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => togglePasswordVisibility(item.id)}
            >
              <Text style={styles.buttonText}>
                {showPasswords[item.id] ? "hide" : "show"}
              </Text>
            </TouchableOpacity>
            
            {/* 快速登录按钮 */}
            <TouchableOpacity
              style={[styles.button, {backgroundColor: '#4a6fa5'}]}
              onPress={() => visitWebsite(item.appName, item.username, item.password)}
            >
              <Text style={styles.buttonText}>quick login</Text>
            </TouchableOpacity>
            
            {editingPassword[item.id] !== undefined ? (
              <TouchableOpacity
                style={styles.button}
                onPress={() => saveEditedPassword(item.id)}
              >
                <Text style={styles.buttonText}>save</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.button}
                onPress={() => startEditing(item.id, item.username, item.password)}
              >
                <Text style={styles.buttonText}>edit</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deletePassword(item.id)}
            >
              <Text style={styles.deleteText}>delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <ThemedView style={styles.container}>
      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TextInput
        style={styles.searchBar}
        placeholder="search app/website"
        value={searchText}
        onChangeText={setSearchText}
      />
      <TextInput
        style={styles.input}
        placeholder="input app/website name"
        value={newAppName}
        onChangeText={setNewAppName}
      />
      <TextInput
        style={styles.input}
        placeholder="input username"
        value={newUsername}
        onChangeText={setNewUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="input password"
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TouchableOpacity
        style={styles.generateButton}
        onPress={() => setNewPassword(generateStrongPassword())}
      >
        <Text style={styles.generateText}>generate strong password</Text>
      </TouchableOpacity>
      
      {/* 新密码的密码强度显示 */}
      {newPassword.length > 0 && renderPasswordStrengthBar(newPassword)}
      
      <TouchableOpacity style={styles.addButton} onPress={addPassword}>
        <Text style={styles.addButtonText}>add new password</Text>
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
  passwordItem: {
    marginBottom: 15,
  },
  card: { 
    padding: 15, 
    backgroundColor: "#fff", 
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  appName: { fontWeight: "bold", fontSize: 16, marginBottom: 5 },
  username: { fontSize: 14, marginBottom: 5 },
  actions: { 
    marginTop: 10, 
    flexDirection: "row", 
    justifyContent: "space-between",
    flexWrap: "wrap"
  },
  button: { 
    backgroundColor: "#007BFF", 
    padding: 8, 
    borderRadius: 5,
    marginRight: 5,
    marginBottom: 5
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  deleteButton: { 
    backgroundColor: "#FF4D4D", 
    padding: 8, 
    borderRadius: 5,
    marginBottom: 5
  },
  deleteText: { color: "#fff", fontWeight: "bold" },
  addButton: { 
    backgroundColor: "#28a745", 
    padding: 10, 
    borderRadius: 5, 
    marginTop: 10 
  },
  addButtonText: { 
    color: "#fff", 
    textAlign: "center", 
    fontWeight: "bold" 
  },
  generateButton: {
    backgroundColor: "#6c757d",
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
  },
  generateText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  // 密码强度相关样式
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
  strengthLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2
  },
  strengthTips: {
    fontSize: 11,
    color: '#666',
    flex: 1,
    textAlign: 'right'
  }
});
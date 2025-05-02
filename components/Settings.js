import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Button,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker"; // RNCPicker
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "../components/Themed";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import { useNavigation } from '@react-navigation/native';  // 改回使用 React Navigation


export default function Settings() {
  const navigation = useNavigation();
  const [passwords, setPasswords] = useState([]);
  const [selectedPassword, setSelectedPassword] = useState(""); // SelectedPassword
  const [reminderDate, setReminderDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false); // Control Modal Picker

  // loadPasswords
  useEffect(() => {
    async function loadPasswords() {
      try {
        const storedPasswords = await AsyncStorage.getItem("passwords");
        if (storedPasswords) {
          setPasswords(JSON.parse(storedPasswords));
        }
      } catch (error) {
        console.error("Failed to load passwords:", error);
      }
    }
    loadPasswords();
  }, []);

  // Listen for passwords changes to ensure the Picker component has default values
  useEffect(() => {
    if (passwords.length > 0) {
      setSelectedPassword(passwords[0].appName); // pick the first password
    }
  }, [passwords]);
  //设置登出
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('错误', '登出失败');
    }
  };

  // Set notifications
  const scheduleNotification = async () => {
    if (!selectedPassword) {
      Alert.alert("Error", "Please select a password to set a reminder.");
      return;
    }

    const trigger = new Date(reminderDate);
    trigger.setSeconds(0);

    if (trigger <= new Date()) {
      Alert.alert("Error", "Selected time must be in the future.");
      return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Password Change Reminder",
          body: `It's time to change the password for ${selectedPassword}!`,
          sound: true,
        },
        trigger,
      });

      Alert.alert(
        "Reminder Set",
        `You will be reminded to change ${selectedPassword} on ${moment(reminderDate).format("YYYY-MM-DD HH:mm")}.`
      );
    } catch (error) {
      console.error("Failed to schedule notification:", error);
      Alert.alert("Error", "Failed to set reminder.");
    }
  };

  // show datepicker
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  // choose date
  const handleConfirm = (date) => {
    setReminderDate(date);
    hideDatePicker();
  };

  // show/hide
  const togglePicker = () => setPickerVisible(!isPickerVisible);

  return (
    <ThemedView style={styles.container}>
      {/* choose password */}
      <View style={[styles.row, styles.rowWithMargin]}>
        <Text style={styles.label}>Select Password</Text>
        <View style={styles.pickerContainer}>
          {/* iOS use Modal Picker */}
          {Platform.OS === "ios" ? (
            <>
              <Button title={selectedPassword || "Please Select"} onPress={togglePicker} />
              {isPickerVisible && (
                <View style={styles.modalPicker}>
                  <Picker
                    selectedValue={selectedPassword}
                    onValueChange={(itemValue) => {
                      setSelectedPassword(itemValue);
                      setPickerVisible(false); // close Modal after picking
                    }}
                    style={styles.pickerIos} // Picker style for iOS
                  >
                    {passwords.length === 0 ? (
                      <Picker.Item label="No passwords available" value="" />
                    ) : (
                      passwords.map((item) => (
                        <Picker.Item key={item.id} label={item.appName} value={item.appName} />
                      ))
                    )}
                  </Picker>
                </View>
              )}
            </>
          ) : (
            // Android Picker
            <Picker
              selectedValue={selectedPassword}
              onValueChange={(itemValue) => setSelectedPassword(itemValue)}
              style={styles.picker} // Picker style for Android
            >
              {passwords.length === 0 ? (
                <Picker.Item label="No passwords available" value="" />
              ) : (
                passwords.map((item) => (
                  <Picker.Item key={item.id} label={item.appName} value={item.appName} />
                ))
              )}
            </Picker>
          )}
        </View>
      </View>

      {/* Datetime picker */}
      <View style={[styles.row, styles.rowWithMargin]}>
        <Text style={styles.label}>Reminder Date & Time</Text>
        <Button title="Pick Date & Time" onPress={showDatePicker} />
      </View>

      {/* Datetime picker Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        date={reminderDate}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        minimumDate={new Date()} // Prevent selection of past dates
      />

      {/* Set reminder button */}
      <Button title="Set Reminder" onPress={scheduleNotification} />
      {/* <Button title="Logout" onPress={handleLogout} /> */}
      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>登出</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F4F6F9" },
  
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  row: {
    flexDirection: "row",
    alignItems: "center", // Make sure the text and selection box are vertically centered
  },
  rowWithMargin: {
    marginBottom: 30, // Increase the spacing between lines
  },
  label: { fontSize: 18, color: "#000", flex: 1 },
  pickerContainer: {
    flex: 1,
    justifyContent: "center", // Make sure the left and right sides are on the same level
  },
  picker: {
    height: 50, // Make sure the Android Picker is tall enough to display content
    color: "#000",
  },
  modalPicker: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  pickerIos: {
    height: 100, // iOS Picker height slightly increased
    color: "#000",
  },
});

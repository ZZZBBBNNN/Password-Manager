import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  Button,
  Alert,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "../components/Themed";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import { useFocusEffect } from "@react-navigation/native";

export default function Settings() {
  const [passwords, setPasswords] = useState([]);
  const [selectedPassword, setSelectedPassword] = useState("");
  const [reminderDate, setReminderDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function loadPasswords() {
        try {
          const storedPasswords = await AsyncStorage.getItem("passwords");
          if (storedPasswords) {
            const parsed = JSON.parse(storedPasswords);
            setPasswords(parsed);
            if (parsed.length > 0) {
              setSelectedPassword(parsed[0].appName);
            } else {
              setSelectedPassword("");
            }
          } else {
            setPasswords([]);
            setSelectedPassword("");
          }
        } catch (error) {
          console.error("Failed to load passwords:", error);
        }
      }

      loadPasswords();
    }, [])
  );

  const scheduleNotification = async () => {
    if (!selectedPassword) {
      Alert.alert("Error", "Please select a password to set a reminder.");
      return;
    }

    const now = new Date();
    const selectedTime = new Date(reminderDate);
    selectedTime.setSeconds(0);

    if (selectedTime <= now) {
      Alert.alert("Error", "Selected time must be in the future.");
      return;
    }

    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission Denied", "Notification permission not granted.");
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Password Change Reminder",
          body: `It's time to change the password for ${selectedPassword}!`,
          sound: true,
        },
        trigger: {
          type: "date",
          date: selectedTime,
        },
      });

      Alert.alert(
        "Reminder Set",
        `You will be reminded to change ${selectedPassword} on ${moment(reminderDate).format(
          "YYYY-MM-DD HH:mm"
        )}.`
      );
    } catch (error) {
      console.error("Failed to schedule notification:", error);
      Alert.alert("Error", "Failed to set reminder.");
    }
  };

  Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
  });


  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirm = (date) => {
    setReminderDate(date);
    hideDatePicker();
  };

  const togglePicker = () => setPickerVisible(!isPickerVisible);

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.row, styles.rowWithMargin]}>
        <Text style={styles.label}>Select Password</Text>
        <View style={styles.pickerContainer}>
          {Platform.OS === "ios" ? (
            <>
              <Button title={selectedPassword || "Please Select"} onPress={togglePicker} />
              {isPickerVisible && (
                <View style={styles.modalPicker}>
                  <Picker
                    selectedValue={selectedPassword}
                    onValueChange={(itemValue) => {
                      setSelectedPassword(itemValue);
                      setPickerVisible(false);
                    }}
                    style={styles.pickerIos}
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
            <Picker
              selectedValue={selectedPassword}
              onValueChange={(itemValue) => setSelectedPassword(itemValue)}
              style={styles.picker}
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

      <View style={[styles.row, styles.rowWithMargin]}>
        <Text style={styles.label}>Reminder Date & Time</Text>
        <Button title="Pick Date & Time" onPress={showDatePicker} />
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        date={reminderDate}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        minimumDate={new Date()}
      />

      <Button title="Set Reminder" onPress={scheduleNotification} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F4F6F9" },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowWithMargin: {
    marginBottom: 30,
  },
  label: { fontSize: 18, color: "#000", flex: 1 },
  pickerContainer: {
    flex: 1,
    justifyContent: "center",
  },
  picker: {
    height: 50,
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
    height: 100,
    color: "#000",
  },
});

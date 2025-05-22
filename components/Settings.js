import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  Button,
  Alert,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as Notifications from "expo-notifications";
import * as Device from 'expo-device';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedView } from "../components/Themed";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from "moment";
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import config from './config';

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function Settings() {
  const navigation = useNavigation();
  const [passwords, setPasswords] = useState([]);
  const [selectedPassword, setSelectedPassword] = useState("");
  const [reminderDate, setReminderDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reminders, setReminders] = useState([]);
  const API_BASE_URL = config.API_BASE_URL;
  const [notificationPermission, setNotificationPermission] = useState(false);
  
  // Manual date input related states
  const [manualYear, setManualYear] = useState(new Date().getFullYear());
  const [manualMonth, setManualMonth] = useState(new Date().getMonth() + 1);
  const [manualDay, setManualDay] = useState(new Date().getDate());
  const [manualHour, setManualHour] = useState(new Date().getHours());
  const [manualMinute, setManualMinute] = useState(new Date().getMinutes());
  const [showManualInput, setShowManualInput] = useState(false);

  // Request notification permissions
  useEffect(() => {
    async function requestNotificationPermission() {
      if (Platform.OS === 'web') {
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            setNotificationPermission(true);
          } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission === 'granted');
          }
        }
        return;
      }
      
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        setNotificationPermission(finalStatus === 'granted');
        
        if (finalStatus !== 'granted') {
          Alert.alert(
            'Permission Required',
            'You need to grant notification permissions to receive reminders'
          );
        }
      }
    }
    
    requestNotificationPermission();
  }, []);

  // Web platform notification check
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Check for due reminders
      const checkWebReminders = () => {
        const webReminders = JSON.parse(localStorage.getItem('webReminders') || '[]');
        const now = new Date();
        
        webReminders.forEach((reminder, index) => {
          const reminderTime = new Date(reminder.reminderTime);
          
          // If reminder time has passed, show notification
          if (reminderTime <= now) {
            // Display browser notification
            if (Notification.permission === 'granted') {
              new Notification('Password Reminder', {
                body: `It's time to update your ${reminder.passwordName} password!`,
              });
              
              // Remove triggered reminder from list
              webReminders.splice(index, 1);
              localStorage.setItem('webReminders', JSON.stringify(webReminders));
            }
          }
        });
      };
      
      // Check reminders every minute
      const intervalId = setInterval(checkWebReminders, 60000);
      
      // Check once on page load
      checkWebReminders();
      
      return () => {
        clearInterval(intervalId);
      };
    }
  }, []);

  // Use useFocusEffect to ensure data is reloaded each time the page is entered
  useFocusEffect(
    React.useCallback(() => {
      async function loadPasswords() {
        try {
          setLoading(true);
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            navigation.replace('Login');
            return;
          }
          
          const response = await axios.get(`${API_BASE_URL}/passwords`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.data && response.data.length > 0) {
            setPasswords(response.data);
            setSelectedPassword(response.data[0].appName);
          }
          
          // Also load existing reminders
          loadReminders(token);
        } catch (error) {
          console.error("Failed to load passwords:", error);
          Alert.alert("Error", "Unable to load password data");
        } finally {
          setLoading(false);
        }
      }
      loadPasswords();
      return () => {}; // Cleanup function
    }, [])
  );

  // Load reminder data
  const loadReminders = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reminders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setReminders(response.data);
    } catch (error) {
      console.error("Failed to load reminders:", error);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Error', 'Logout failed');
    }
  };

  // Date selection related functions
  const showDatePicker = () => {
    console.log("Showing date picker");
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    console.log("Hiding date picker");
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    console.log("Selected date:", date);
    setReminderDate(date);
    hideDatePicker();
  };
  
  // Toggle manual date input
  const toggleManualDateInput = () => {
    setShowManualInput(!showManualInput);
    
    // If opening, initialize input values with current selected date
    if (!showManualInput) {
      const date = new Date(reminderDate);
      setManualYear(date.getFullYear());
      setManualMonth(date.getMonth() + 1);
      setManualDay(date.getDate());
      setManualHour(date.getHours());
      setManualMinute(date.getMinutes());
    }
  };

  // Apply manually entered date
  const applyManualDate = () => {
    try {
      const newDate = new Date(
        manualYear, 
        manualMonth - 1, 
        manualDay, 
        manualHour, 
        manualMinute
      );
      setReminderDate(newDate);
      setShowManualInput(false);
      Alert.alert("Date Updated", `Set to: ${moment(newDate).format('YYYY-MM-DD HH:mm')}`);
    } catch (error) {
      console.error("Date setting error:", error);
      Alert.alert("Error", "Please enter a valid date and time");
    }
  };

  // Web platform specific date selection function
  const selectDateForWeb = () => {
    if (Platform.OS === 'web') {
      console.log("Using Web native picker");
      
      // Create a visible date time picker
      const datePickerContainer = document.createElement('div');
      datePickerContainer.style.position = 'fixed';
      datePickerContainer.style.top = '50%';
      datePickerContainer.style.left = '50%';
      datePickerContainer.style.transform = 'translate(-50%, -50%)';
      datePickerContainer.style.backgroundColor = 'white';
      datePickerContainer.style.padding = '20px';
      datePickerContainer.style.borderRadius = '8px';
      datePickerContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
      datePickerContainer.style.zIndex = '10000';
      
      // Add title
      const title = document.createElement('h3');
      title.textContent = 'Select Date and Time';
      title.style.marginBottom = '15px';
      datePickerContainer.appendChild(title);
      
      // Create date time input
      const dateInput = document.createElement('input');
      dateInput.type = 'datetime-local';
      dateInput.style.padding = '8px';
      dateInput.style.fontSize = '16px';
      dateInput.style.marginBottom = '15px';
      dateInput.style.display = 'block';
      dateInput.style.width = '100%';
      
      // Set initial value
      const dateValue = moment(reminderDate).format('YYYY-MM-DDTHH:mm');
      dateInput.value = dateValue;
      datePickerContainer.appendChild(dateInput);
      
      // Add button container
      const buttonContainer = document.createElement('div');
      buttonContainer.style.display = 'flex';
      buttonContainer.style.justifyContent = 'space-between';
      
      // Confirm button
      const confirmButton = document.createElement('button');
      confirmButton.textContent = 'Confirm';
      confirmButton.style.padding = '8px 16px';
      confirmButton.style.backgroundColor = '#4361ee';
      confirmButton.style.color = 'white';
      confirmButton.style.border = 'none';
      confirmButton.style.borderRadius = '4px';
      confirmButton.style.cursor = 'pointer';
      confirmButton.style.marginRight = '10px';
      
      // Cancel button
      const cancelButton = document.createElement('button');
      cancelButton.textContent = 'Cancel';
      cancelButton.style.padding = '8px 16px';
      cancelButton.style.backgroundColor = '#6c757d';
      cancelButton.style.color = 'white';
      cancelButton.style.border = 'none';
      cancelButton.style.borderRadius = '4px';
      cancelButton.style.cursor = 'pointer';
      
      // Add buttons to container
      buttonContainer.appendChild(confirmButton);
      buttonContainer.appendChild(cancelButton);
      datePickerContainer.appendChild(buttonContainer);
      
      // Add to document
      document.body.appendChild(datePickerContainer);
      
      // Add event listeners
      confirmButton.addEventListener('click', () => {
        const selectedDate = new Date(dateInput.value);
        console.log("Selected new date:", selectedDate);
        setReminderDate(selectedDate);
        document.body.removeChild(datePickerContainer);
        
        // Show selected date and time
        Alert.alert(
          "Date and Time Selected",
          `You selected: ${moment(selectedDate).format('YYYY-MM-DD HH:mm')}`
        );
      });
      
      cancelButton.addEventListener('click', () => {
        document.body.removeChild(datePickerContainer);
      });
      
      // Focus input
      dateInput.focus();
    } else {
      // Mobile platform uses Modal
      showDatePicker();
    }
  };

  // Schedule notification
  const scheduleNotification = async () => {
    if (!selectedPassword) {
      Alert.alert("Error", "Please select a password");
      return;
    }

    try {
      // Web platform handling
      if (Platform.OS === 'web') {
        // Check browser notification permission
        if ('Notification' in window) {
          if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              Alert.alert("Error", "Notification permission required");
              return;
            }
          }
        }
        
        // Save reminder to localStorage
        const webReminders = JSON.parse(localStorage.getItem('webReminders') || '[]');
        const newReminder = {
          id: Date.now().toString(),
          passwordName: selectedPassword,
          reminderTime: reminderDate.toISOString()
        };
        
        webReminders.push(newReminder);
        localStorage.setItem('webReminders', JSON.stringify(webReminders));
        
        // Add to current display
        setReminders([...reminders, {
          id: newReminder.id,
          passwordName: selectedPassword,
          reminderTime: reminderDate.toISOString()
        }]);
        
        Alert.alert("Success", "Reminder set");
        return;
      }
      
      // Mobile platform handling
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }
      
      // Save to server
      const response = await axios.post(`${API_BASE_URL}/reminders`, {
        passwordName: selectedPassword,
        reminderTime: reminderDate.toISOString()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Set local notification
      if (notificationPermission) {
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Password Reminder",
            body: `It's time to update your ${selectedPassword} password!`,
          },
          trigger: {
            date: reminderDate,
          },
        });
        console.log("Notification scheduled:", notificationId);
      }
      
      // Refresh reminder list
      loadReminders(token);
      Alert.alert("Success", "Reminder set");
      
    } catch (error) {
      console.error("Failed to set reminder:", error);
      Alert.alert("Error", "Unable to set reminder");
    }
  };

  // Delete reminder
  const deleteReminder = async (reminderId) => {
    try {
      // Web platform handling
      if (Platform.OS === 'web') {
        const webReminders = JSON.parse(localStorage.getItem('webReminders') || '[]');
        const updatedReminders = webReminders.filter(reminder => reminder.id !== reminderId);
        localStorage.setItem('webReminders', JSON.stringify(updatedReminders));
        
        // Update UI
        setReminders(reminders.filter(reminder => reminder.id !== reminderId));
        Alert.alert("Success", "Reminder deleted");
        return;
      }
      
      // Mobile platform handling
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.replace('Login');
        return;
      }
      
      await axios.delete(`${API_BASE_URL}/reminders/${reminderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      loadReminders(token);
      Alert.alert("Success", "Reminder deleted");
    } catch (error) {
      console.error("Failed to delete reminder:", error);
      Alert.alert("Error", "Unable to delete reminder");
    }
  };

  // Toggle password picker
  const togglePasswordPicker = () => {
    setPickerVisible(!isPickerVisible);
  };

  // Render
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={[styles.container, styles.centered]}>
            <ActivityIndicator size="large" color="#4361ee" />
            <Text style={{marginTop: 20}}>Loading...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Set Password Update Reminder</Text>

            {/* Password selection section */}
            <View style={[styles.row, styles.rowWithMargin]}>
              <Text style={styles.label}>Select Password:</Text>
              <TouchableOpacity
                style={styles.pickerContainer}
                onPress={togglePasswordPicker}
              >
                <Text style={styles.pickerText}>{selectedPassword || "Select app"}</Text>
              </TouchableOpacity>
            </View>

            {/* Password dropdown selector */}
            {isPickerVisible && (
              <View style={styles.modalPicker}>
                {passwords.map((password) => (
                  <TouchableOpacity
                    key={password.id}
                    style={{padding: 15}}
                    onPress={() => {
                      setSelectedPassword(password.appName);
                      setPickerVisible(false);
                    }}
                  >
                    <Text>{password.appName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Date selection section */}
            <View style={[styles.row, styles.rowWithMargin]}>
              <Text style={styles.label}>Select Date and Time:</Text>
              <TouchableOpacity 
                style={[styles.button, styles.dateButton]} 
                onPress={Platform.OS === 'web' ? selectDateForWeb : showDatePicker}
              >
                <Text style={styles.buttonText}>
                  {moment(reminderDate).format("YYYY-MM-DD HH:mm")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Toggle to manual input button */}
            <TouchableOpacity 
              style={styles.themeButton}
              onPress={toggleManualDateInput}
            >
              <Text style={styles.themeButtonText}>
                {showManualInput ? "Cancel Manual Input" : "Manually Set Date & Time"}
              </Text>
            </TouchableOpacity>

            {/* Manual date input area */}
            {showManualInput && (
              <View style={styles.manualDateContainer}>
                <Text style={styles.sectionTitle}>Manual Date and Time Input</Text>
                
                <View style={styles.manualInputRow}>
                  <Text style={styles.manualInputLabel}>Year:</Text>
                  <TextInput
                    style={styles.manualInput}
                    keyboardType="number-pad"
                    value={manualYear.toString()}
                    onChangeText={(text) => setManualYear(parseInt(text) || 2023)}
                  />
                </View>
                
                <View style={styles.manualInputRow}>
                  <Text style={styles.manualInputLabel}>Month (1-12):</Text>
                  <TextInput
                    style={styles.manualInput}
                    keyboardType="number-pad"
                    value={manualMonth.toString()}
                    onChangeText={(text) => {
                      const val = parseInt(text) || 1;
                      setManualMonth(Math.min(Math.max(val, 1), 12));
                    }}
                  />
                </View>
                
                <View style={styles.manualInputRow}>
                  <Text style={styles.manualInputLabel}>Day (1-31):</Text>
                  <TextInput
                    style={styles.manualInput}
                    keyboardType="number-pad"
                    value={manualDay.toString()}
                    onChangeText={(text) => {
                      const val = parseInt(text) || 1;
                      setManualDay(Math.min(Math.max(val, 1), 31));
                    }}
                  />
                </View>
                
                <View style={styles.manualInputRow}>
                  <Text style={styles.manualInputLabel}>Hour (0-23):</Text>
                  <TextInput
                    style={styles.manualInput}
                    keyboardType="number-pad"
                    value={manualHour.toString()}
                    onChangeText={(text) => {
                      const val = parseInt(text) || 0;
                      setManualHour(Math.min(Math.max(val, 0), 23));
                    }}
                  />
                </View>
                
                <View style={styles.manualInputRow}>
                  <Text style={styles.manualInputLabel}>Minute (0-59):</Text>
                  <TextInput
                    style={styles.manualInput}
                    keyboardType="number-pad"
                    value={manualMinute.toString()}
                    onChangeText={(text) => {
                      const val = parseInt(text) || 0;
                      setManualMinute(Math.min(Math.max(val, 0), 59));
                    }}
                  />
                </View>
                
                <TouchableOpacity
                  style={[styles.addButton, {marginTop: 15}]}
                  onPress={applyManualDate}
                >
                  <Text style={styles.addButtonText}>Apply Date</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Mobile platform date picker modal */}
            {Platform.OS !== 'web' && (
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="datetime"
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
                date={reminderDate}
                confirmTextIOS="Confirm"
                cancelTextIOS="Cancel"
              />
            )}

            {/* Set reminder button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={scheduleNotification}
            >
              <Text style={styles.addButtonText}>Set Reminder</Text>
            </TouchableOpacity>

            <View style={styles.remindersContainer}>
              <Text style={styles.sectionTitle}>Set Reminders</Text>
              {reminders.length === 0 ? (
                <Text>You haven't set any reminders yet</Text>
              ) : (
                reminders.map((reminder) => (
                  <View key={reminder.id} style={styles.reminderItem}>
                    <View style={styles.reminderInfo}>
                      <Text style={styles.reminderText}>
                        App: {reminder.passwordName}
                      </Text>
                      <Text style={styles.reminderText}>
                        Time: {moment(reminder.reminderTime).format("YYYY-MM-DD HH:mm")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteReminder(reminder.id)}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6F9"
  },
  scrollContent: {
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20, // Add bottom margin for scroll space
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowWithMargin: {
    marginBottom: 30,
  },
  label: { 
    fontSize: 18, 
    color: "#000", 
    flex: 1 
  },
  pickerContainer: {
    flex: 1,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  pickerText: {
    fontSize: 16,
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
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pickerIos: {
    height: 100,
    color: "#000",
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
  },
  dateButton: {
    backgroundColor: "#4361ee", 
    borderWidth: 1,
    borderColor: "#3a0ca3",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  addButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  themeButton: {
    backgroundColor: "#6c757d",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  themeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  remindersContainer: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderText: {
    fontSize: 16,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  // Manual date input related styles
  manualDateContainer: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  manualInputLabel: {
    width: 100,
    fontSize: 16,
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  }
});
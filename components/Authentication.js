// components/Authentication.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Button,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";

const Authentication = () => {
  const navigation = useNavigation();
  const [authFailed, setAuthFailed] = useState(false); // Track authentication failure

  useEffect(() => {
    authenticateUser();
  }, []);

  // Function to handle biometric authentication
  const authenticateUser = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        Alert.alert(
          "Biometric Authentication Not Available",
          "Your device does not support biometric authentication. Continuing without biometric authentication."
        );
        navigation.replace("Main");
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate",
        fallbackLabel: "Enter Passcode",
      });

      if (result.success) {
        navigation.replace("Main"); // Navigate to the main screen on success
      } else {
        setAuthFailed(true); // Show retry button on failure
      }
    } catch (error) {
      Alert.alert("Authentication Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {authFailed ? (
        <>
          <Text style={styles.errorText}>Authentication Failed</Text>
          <Button title="Retry" onPress={authenticateUser} />
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.text}>Verifying Identity...</Text>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: Constants.statusBarHeight,
  },
  text: {
    marginTop: 20,
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 18,
    marginBottom: 10,
  },
});

export default Authentication;

import React, { createContext, useContext, useState, useEffect } from "react";
import { View, Text, StyleSheet, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    async function loadTheme() {
      const savedTheme = await AsyncStorage.getItem("theme");
      setTheme(savedTheme || systemTheme || "light");
    }
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    await AsyncStorage.setItem("theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

// Themed View - background color
export const ThemedView = ({ style, children }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, theme === "dark" ? styles.dark : styles.light, style]}>
      {children}
    </View>
  );
};

// Themed Text - text color
export const ThemedText = ({ style, children }) => {
  const { theme } = useTheme();
  return (
    <Text style={[style, theme === "dark" ? styles.darkText : styles.lightText]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, // Make ThemedView fill the entire screen
  },
  light: {
    backgroundColor: "#fff",
  },
  dark: {
    backgroundColor: "#333",
  },
  lightText: {
    color: "#000",
  },
  darkText: {
    color: "#fff",
  },
});

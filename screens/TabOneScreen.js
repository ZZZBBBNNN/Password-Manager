import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../components/Themed";
import Home from "../components/Home";

export default function TabOneScreen() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === "dark" ? "#121212" : "#f9f9f9" },  // backgroundColor
      ]}
    >
      <Home />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

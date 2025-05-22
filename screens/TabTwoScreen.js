import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../components/Themed";
import Settings from "../components/Settings";

export default function TabTwoScreen() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme === "dark" ? "#121212" : "#f9f9f9" },  // backgroundColor
      ]}
    >
      <Settings />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

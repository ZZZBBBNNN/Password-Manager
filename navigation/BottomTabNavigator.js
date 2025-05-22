import Ionicons from "@expo/vector-icons/Ionicons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useColorScheme } from "react-native";
import Colors from "../constants/Colors";
import HomeScreen from "../screens/TabOneScreen"; 
import SettingsScreen from "../screens/TabTwoScreen"; 

const BottomTab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme] || Colors.light;

  return (
    <BottomTab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: themeColors.tint,
        tabBarInactiveTintColor: themeColors.tabIconDefault,
        tabBarStyle: { backgroundColor: themeColors.tabBarBackground },
        headerStyle: { backgroundColor: themeColors.headerBackground },
        headerTintColor: themeColors.headerText,
        headerTitle: "PM", // Title
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: "bold",
          width: 100,
          textAlign: "center",
        },
      }}
    >
      <BottomTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
          tabBarLabel: "Home",
          tabBarLabelStyle: { fontSize: 12 },
        }}
      />
      <BottomTab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings" size={24} color={color} />
          ),
          tabBarLabel: "Settings",
          tabBarLabelStyle: { fontSize: 12 },
        }}
      />
    </BottomTab.Navigator>
  );
}

import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/native";
import AuthScreen from "../screens/AuthScreen";
import HomeScreen from "../screens/HomeScreen";
import LanguageSelector from "../screens/LanguageSelector";
import AddLanguages from "../screens/AddLanguages";
import ViewImages from "../screens/ViewImages";

const Stack = createStackNavigator();

const CustomBackButton = () => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
      <Text style={styles.backArrow}>{"<"}</Text>
    </TouchableOpacity>
  );
};

const AppNavigator = () => (
  <Stack.Navigator
    initialRouteName="AuthScreen"
    screenOptions={{
      headerLeft: () => <CustomBackButton />, // Use the custom back button
      headerBackTitleVisible: false, // Hide default "Back" text
    }}
  >
    <Stack.Screen
      name="AuthScreen"
      component={AuthScreen}
      options={{
        headerLeft: null, // Hide the back button
      }}
    />
    <Stack.Screen
      name="HomeScreen"
      component={HomeScreen}
      options={{
        headerLeft: null, // Hide the back button
      }}
    />
    <Stack.Screen name="LanguageSelector" component={LanguageSelector} />
    <Stack.Screen name="AddLanguages" component={AddLanguages} />
    <Stack.Screen name="ViewImages" component={ViewImages} />
  </Stack.Navigator>
);

const styles = StyleSheet.create({
  backButton: {
    marginLeft: 20,
    // padding: 10,
  },
  backArrow: {
    fontSize: 35, // Customize the size of the arrow
    fontWeight: "bold",
    color: "black", // Change the arrow color
  },
});

export default AppNavigator;

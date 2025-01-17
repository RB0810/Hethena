import React from "react";
import { NavigationContainer } from "@react-navigation/native"; // Import NavigationContainer
import AppNavigator from "./src/navigation/AppNavigator"; // Import your navigator


export default function App() {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
}

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons"; // Import Material Icons from Expo
import AudioPlayer from "../components/AudioPlayer";

const HomeScreen = ({ navigation, route }) => {
  const { userId } = route.params; // Retrieve the user ID passed from AuthScreen

  return (
    <View style={styles.container}>
      {/* Play Audio Button */}
      <View style={styles.audioPlayer}>
        <AudioPlayer userId={userId} />
      </View>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => navigation.navigate("ViewImages", { userId })}
      >
        <MaterialIcons name="photo" size={100} color="#fffff" />
        <Text style={styles.iconText}>View Images</Text>
      </TouchableOpacity>

      {/* Second Button with Icon */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => navigation.navigate("LanguageSelector", { userId })}
      >
        <MaterialIcons name="language" size={100} color="#fffff" />
        <Text style={styles.iconText}>Change Language</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: "center",
    // alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  audioPlayer: {
    marginBottom: 20,
  },
  iconButton: {
    height: 250, // Set fixed height for uniform size
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    marginVertical: 10,
    elevation: 2, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconText: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
    marginTop: 8,
    textAlign: "center", // Center-align text
  },
});


export default HomeScreen;

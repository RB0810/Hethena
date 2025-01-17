import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { fetchUserData, saveFavorites, saveSelectedLanguage } from "../utils/firebaseUtils";
import { useFocusEffect } from "@react-navigation/native";
import AudioPlayer from "../components/AudioPlayer";


const LanguageSelector = ({ navigation, route }) => {
  const { userId } = route.params; // User ID passed from HomeScreen
  const [selectedLanguage, setSelectedLanguage] = useState("English"); // Default language
  const [favorites, setFavorites] = useState([]); // User's favorite languages

  // Fetch user data on mount
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        try {
          const userData = await fetchUserData(userId); // Fetch updated data
          setSelectedLanguage(userData.selectedLanguage || "English");
          setFavorites(userData.favorites || []);
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      };
      fetchData();
    }, [userId])
  );

  const toggleFavorite = async (language) => {
    let updatedFavorites;
  
    if (favorites.some((fav) => fav.code === language.code)) {
      // Remove from favorites
      updatedFavorites = favorites.filter((fav) => fav.code !== language.code);
    } else {
      // Add to favorites
      updatedFavorites = [...favorites, language];
    }
  
    setFavorites(updatedFavorites); // Update local state
    await saveFavorites(userId, updatedFavorites); // Save to Firebase
  };
  

  // Handle language selection
  const handleSelectLanguage = (language) => {
    Alert.alert(
      "Change Language",
      `Do you want to switch the app language to ${language.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            setSelectedLanguage(language.name);
            await saveSelectedLanguage(userId, language.name, language.code); // Save selected language in Firebase
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
    <AudioPlayer userId={userId} />
      <Text style={styles.heading}>Current Language: {selectedLanguage}</Text>
      <Text style={styles.subheading}>Favorites</Text>

      {/* Display Favorites */}
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <TouchableOpacity onPress={() => handleSelectLanguage(item)}>
              <Text style={styles.language}>{item.name}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleFavorite(item)}>
              <Text style={styles.heart}>❤️</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddLanguages", { userId, favorites })}
      >
        <Text style={styles.addButtonText}>+ Add Languages</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  heading: {
    fontSize: 25,
    fontWeight: "bold",
    marginVertical: 16,
  },
  subheading: {
    fontSize: 25,
    fontWeight: "bold",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  language: {
    fontSize: 25,
  },
  heart: {
    fontSize: 25,
    color: "red",
  },
  addButton: {
    marginBottom: 30,
    padding: 16,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 25,
    fontWeight: "bold",
  },
});

export default LanguageSelector;

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import languagePack from "../utils/languagePack.json";
import { saveFavorites, saveSelectedLanguage } from "../utils/firebaseUtils";

const AddLanguages = ({ navigation, route }) => {
  const { userId, favorites: initialFavorites } = route.params; // User ID and current favorites
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState(initialFavorites); // Initialize favorites state
  const [filteredLanguages, setFilteredLanguages] = useState(languagePack);

  // Effect to re-fetch the updated favorites when the component is rendered
  useEffect(() => {
    setFavorites(initialFavorites);
  }, [initialFavorites]);

  // Filter languages based on search query
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredLanguages(languagePack);
    } else {
      const filtered = languagePack.filter((lang) =>
        lang.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredLanguages(filtered);
    }
  };

  // Handle selection of a language
  const handleSelectLanguage = (language) => {
    Alert.alert(
      "Change Language",
      `Do you want to switch to ${language.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            await saveSelectedLanguage(userId, language.name); // Save to Firebase
            Alert.alert("Language Changed", `The app language is now set to ${language.name}.`);
          },
        },
      ]
    );
  };

  // Add or remove a language from favorites
  const toggleFavorite = async (language) => {
    let updatedFavorites;
    if (favorites.some((fav) => fav.code === language.code)) {
      // Remove from favorites
      updatedFavorites = favorites.filter((fav) => fav.code !== language.code);
    } else {
      // Add to favorites
      updatedFavorites = [...favorites, language];
    }
    setFavorites(updatedFavorites); // Update the local state
    await saveFavorites(userId, updatedFavorites); // Save to Firebase
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search languages..."
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredLanguages}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {/* Language Name */}
            <TouchableOpacity onPress={() => handleSelectLanguage(item)}>
              <Text style={styles.language}>{item.name}</Text>
            </TouchableOpacity>

            {/* Favorite Heart Toggle */}
            <TouchableOpacity onPress={() => toggleFavorite(item)}>
              <Text style={styles.heart}>
                {favorites.some((fav) => fav.code === item.code) ? "❤️" : "🤍"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    fontSize: 25,
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
    color: "red", // Default heart color for active favorites
  },
});

export default AddLanguages;

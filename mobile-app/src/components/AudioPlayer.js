import React, { useState, useEffect } from "react";
import { View, Button, StyleSheet, Text, TouchableOpacity} from "react-native";
import { Audio } from "expo-av";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebaseConfig"; // Import Firestore instance
import { FontAwesome } from "@expo/vector-icons";

const AudioPlayer = ({ userId }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState("");
  const [shouldPlay, setShouldPlay] = useState(false); // Track if `play = 1`

  // Real-time listener for audio URL and play status
  useEffect(() => {
    const userDocRef = doc(db, "users", userId); // Reference to the user's document

    const unsubscribe = onSnapshot(userDocRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();

        if (userData.audio_url) {
          console.log("Audio URL updated:", userData.audio_url);
          setAudioUrl(userData.audio_url); // Update the audio URL in state

          // Check if play = 1
          if (userData.play === 1) {
            setShouldPlay(true); // Mark that the audio should play
            await updateDoc(userDocRef, { play: 0 }); // Update play to 0
          }
        } else {
          setError("Audio URL not found in Firestore document.");
        }
      } else {
        setError("User document does not exist.");
      }
    });

    // Cleanup listener on component unmount
    return () => {
      unsubscribe();
    };
  }, [userId]);

  // Automatically play audio when `shouldPlay` is true
  useEffect(() => {
    if (shouldPlay && audioUrl) {
      playAudio();
      setShouldPlay(false); // Reset play trigger
    }
  }, [shouldPlay, audioUrl]);

  const playAudio = async () => {
    try {
      if (!audioUrl) {
        setError("Audio URL not available.");
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl }, // Use the current URL
        { shouldPlay: true }
      );
      setSound(sound);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isPlaying && status.didJustFinish) {
          setIsPlaying(false); // Reset play state when playback finishes
        }
      });
    } catch (err) {
      console.error("Error playing audio:", err);
      setError("Failed to play audio.");
    }
  };

  const stopAudio = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync(); // Unload the sound
      setSound(null);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync(); // Unload the sound on component unmount
      }
    };
  }, [sound]);

  return (
    <View>
      {error ? <Text style={[styles.error, styles.largeText]}>{error}</Text> : null}
      <Text style={[styles.largeText, styles.largeText]}>
        {isPlaying ? "Audio is Playing..." : ""}
      </Text>
      <TouchableOpacity
  style={styles.largeButton} // Updated style for the button
  onPress={isPlaying ? stopAudio : playAudio}
  disabled={!audioUrl}
>
  <Text style={styles.largeButtonText}>{isPlaying ? "Stop Audio" : "Play Audio"}</Text>
</TouchableOpacity>

    </View>
  );
  
};

const styles = StyleSheet.create({
    largeButton: {
      backgroundColor: "#4CAF50", // Green color
      paddingVertical: 20, // Increased vertical padding
      paddingHorizontal: 40, // Increased horizontal padding
      borderRadius: 12, // Rounded corners
    //   marginVertical: 20, // Add vertical margin for spacing
    },
    largeButtonText: {
      color: "#fff", // White text color
      fontSize: 30, // Larger font size
      fontWeight: "bold", // Bold text
      textAlign: "center",
    },
    largeText: {
        fontSize: 30
        , // Set a larger font size
        fontWeight: "bold", // Optional for bold text
      },
    // Removed unnecessary container styles
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });  
  

export default AudioPlayer;

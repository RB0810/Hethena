import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

import { db } from './firebaseConfig';

// Fetch user data from Firebase
export const fetchUserData = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // If user data exists, return it
      return docSnap.data();
    } else {
      // If no data found, create a new user entry with defaults
      const defaultData = { favorites: [], selectedLanguage: 'English' };
      await setDoc(docRef, defaultData);
      console.log('New user data initialized in Firebase');
      return defaultData; // Return the newly created default data
    }
  } catch (error) {
    console.error('Error fetching or initializing user data: ', error);
    throw error;
  }
};

// Save favorites to Firebase
export const saveFavorites = async (userId, favorites) => {
  try {
    const docRef = doc(db, 'users', userId);
    await updateDoc(docRef, { favorites });
    console.log('Favorites updated successfully');
  } catch (error) {
    console.error('Error updating favorites: ', error);
    throw error;
  }
};

// Save selected language to Firebase
export const saveSelectedLanguage = async (userId, language, languageCode) => {
  try {
    const docRef = doc(db, "users", userId);

    // Update Firestore with selected language name and code
    await updateDoc(docRef, { 
      selectedLanguage: language, 
      selectLanguageCode: languageCode 
    });

    console.log("Selected language and code updated successfully");
  } catch (error) {
    console.error('Error updating selected language: ', error);
    throw error;
  }
};

// Function to fetch audio URL from Firestore
export const getAudioFileUrl = async (userId) => {
  try {
    // Reference to the user's document in Firestore
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData.audio_url) {
        console.log('Audio URL fetched successfully:', userData.audio_url);
        return userData.audio_url; // Return the audio_url field
      } else {
        throw new Error('Audio URL not found in Firestore document.');
      }
    } else {
      throw new Error('User document does not exist.');
    }
  } catch (error) {
    console.error('Error fetching audio URL from Firestore:', error);
    throw error;
  }
};

// Function to fetch image URLs from Firestore
export const getImageUrls = async (userId) => {
  try {
    // Reference to the user's document in Firestore
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData.images && Array.isArray(userData.images)) {
        console.log('Image URLs fetched successfully:', userData.images);
        return userData.images; // Return the image_urls field as an array
      } else {
        throw new Error(
          'Image URLs not found or improperly formatted in Firestore document.'
        );
      }
    } else {
      throw new Error('User document does not exist.');
    }
  } catch (error) {
    console.error('Error fetching image URLs from Firestore:', error);
    throw error;
  }
};

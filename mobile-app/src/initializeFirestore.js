import { getFirestore, doc, collection, setDoc, updateDoc, increment } from 'firebase/firestore';
import app from './utils/firebaseConfig'; // Make sure firebaseConfig.js exports the initialized app

const firestore = getFirestore(app); // Initialize Firestore

// Function to initialize gates in Firestore
export const initializeGates = async () => {
  try {
    for (let i = 1; i <= 30; i++) {
      const gateId = `gate${i}`;

      // Set each gate document with default fields
      await setDoc(doc(firestore, 'gates', gateId), {
        status: "available",
        numberOfUsers: 0,
        users: {} // Start with an empty object for users or set up as a subcollection
      });

      console.log(`Initialized ${gateId}`);
    }
    console.log("All 30 gates initialized successfully.");
  } catch (error) {
    console.error("Error initializing gates:", error);
  }
};

// Function to add user to a specific gate
export const addUserToGate = async (gateId, userId, userData) => {
  try {
    // Reference to the specific gate's users subcollection
    const userRef = doc(collection(firestore, 'gates', gateId, 'users'), userId);

    // Add user document with the specified fields
    await setDoc(userRef, {
      image_status: userData.image_status || "no_image",
      finger: userData.finger || null
    });

    // Update the number of users in the gate document
    const gateRef = doc(firestore, 'gates', gateId);
    await updateDoc(gateRef, {
      numberOfUsers: increment(1)
    });

    console.log(`User ${userId} added to ${gateId}`);
  } catch (error) {
    console.error(`Error adding user to ${gateId}:`, error);
  }
};

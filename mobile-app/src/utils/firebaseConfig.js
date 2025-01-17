import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCy3lsDt8I0FEDRzX79AAUjEihm5p_2awc",
  authDomain: "notsmartglasses.firebaseapp.com",
  projectId: "notsmartglasses",
  storageBucket: "notsmartglasses.firebasestorage.app",
  messagingSenderId: "427015571141",
  appId: "1:427015571141:web:ba9fb21bc88a40a65c12ac",
  measurementId: "G-69BT4T3QRN"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
const db = getFirestore(app);


export { db };

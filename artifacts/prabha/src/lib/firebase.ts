import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDziO6YTlDIKTxDkfjScaZ-LfRjOJQKxQo",
  authDomain: "prabha-9f629.firebaseapp.com",
  projectId: "prabha-9f629",
  storageBucket: "prabha-9f629.firebasestorage.app",
  messagingSenderId: "707455553316",
  appId: "1:707455553316:web:3a0e6084df107bbe266db1"
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);
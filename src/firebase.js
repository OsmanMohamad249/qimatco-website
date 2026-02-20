import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase configuration for Qimmah project
const firebaseConfig = {
  apiKey: "AIzaSyBqqAHLXdBvb_vMVw8Ju0L6XmlE5yrEtfE",
  authDomain: "qimatco-db.firebaseapp.com",
  projectId: "qimatco-db",
  storageBucket: "qimatco-db.firebasestorage.app",
  messagingSenderId: "636572916565",
  appId: "1:636572916565:web:91c6940a23d2297cbbeddc",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export common Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;


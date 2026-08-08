import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCe8dpGyUuOsTGiNmPbDoCTC04N8yVl914",
  authDomain: "zeeprep01.firebaseapp.com",
  projectId: "zeeprep01",
  storageBucket: "zeeprep01.firebasestorage.app",
  messagingSenderId: "51016839352",
  appId: "1:51016839352:web:75db958ecdc0e43d1a3c63",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

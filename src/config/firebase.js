import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAfAONV9PWhNzFGOv4UMm0dTiH7RyAWa50",
  authDomain: "miningchecklist.firebaseapp.com",
  projectId: "miningchecklist",
  storageBucket: "miningchecklist.firebasestorage.app",
  messagingSenderId: "577979776386",
  appId: "1:577979776386:web:646788e7bfac04c5c5639b",
  measurementId: "G-GW10K1XC0Q"
};

const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyArlprwdFQB7SGh4pUcoCib3U_2-7D0j5Q",
  authDomain: "med-tracker-87ca0.firebaseapp.com",
  projectId: "med-tracker-87ca0",
  storageBucket: "med-tracker-87ca0.appspot.com",
  messagingSenderId: "83666469268",
  appId: "1:83666469268:web:907a9eac43b9d17cee0f81",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
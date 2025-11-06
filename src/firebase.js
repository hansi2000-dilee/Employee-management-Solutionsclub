
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDw0i3lKkGGjE32B0qU57KbcL77FVvcbEQ",
  authDomain: "solutionclub-54787.firebaseapp.com",
  databaseURL: "https://solutionclub-54787-default-rtdb.firebaseio.com",
  projectId: "solutionclub-54787",
  storageBucket: "solutionclub-54787.appspot.com",
  messagingSenderId: "703000996721",
  appId: "1:703000996721:web:22dc5dc0b9d7322533e4d0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { db, auth };

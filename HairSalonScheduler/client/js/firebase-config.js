// client/js/firebase-config.js

// PASTE YOUR FIREBASE CONFIGURATION SNIPPET HERE
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC29sXmysvCLP8dMyya8HnYTwH0pzYD1zM",
  authDomain: "seminal-work-gemini.firebaseapp.com",
  projectId: "seminal-work-gemini",
  storageBucket: "seminal-work-gemini.firebasestorage.app",
  messagingSenderId: "504452334961",
  appId: "1:504452334961:web:5c4dcdd1bedb399c81e2d0",
  measurementId: "G-93TEZ46PTE"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();
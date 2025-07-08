// lib/firebase.ts
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAR-WZNMiiF5c1u9UoObTGrs_iP5xnw5EU",
  authDomain: "arquivo-interdisciplinar.firebaseapp.com",
  projectId: "arquivo-interdisciplinar",
  storageBucket: "arquivo-interdisciplinar.appspot.com",
  messagingSenderId: "118743177993",
  appId: "1:118743177993:web:a6979d8aef0d27826c11d8",
  measurementId: "G-NES70LQ2RX"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

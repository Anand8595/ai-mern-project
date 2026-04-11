import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "authexamnotes-4a485.firebaseapp.com",
  projectId: "authexamnotes-4a485",
  storageBucket: "authexamnotes-4a485.firebasestorage.app",
  messagingSenderId: "771254224182",
  appId: "1:771254224182:web:acb4940bc68a01c5f69f97"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
export {auth,provider}
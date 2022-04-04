import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const config = {
    FIREBASE_API_KEY: "AIzaSyA43GkvEwu2rVvitE1G9-biG-RhO-ieKMQ",
    FIREBASE_DOMAIN: "solarbitrage-tamu.firebaseapp.com",
    FIREBASE_DATABASE_URL: "https://solarbitrage-tamu-default-rtdb.firebaseio.com",
    FIREBASE_PROJECT_ID: "solarbitrage-tamu",
    FIREBASE_STORAGE_BUCKET: "solarbitrage-tamu.appspot.com",
    FIREBASE_MESSAGING_SENDER_ID: "764784752645",
    FIREBASE_APP_ID: "1:764784752645:web:ab86d8a2c9a0132403846c"
}

var firebaseConfig = {
    apiKey: config.FIREBASE_API_KEY,
    authDomain: config.FIREBASE_DOMAIN,
    databaseURL: config.FIREBASE_DATABASE_URL,
    projectId: config.FIREBASE_PROJECT_ID,
    storageBucket: config.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.FIREBASE_APP_ID
};
  
const app = initializeApp(firebaseConfig);
  
const database = getFirestore(app);

export default database;
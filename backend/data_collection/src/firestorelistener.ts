import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildChanged } from "firebase/database";
import { collection, getFirestore, addDoc, serverTimestamp} from "firebase/firestore";

import config from "./common/src/config"

// Firebase Configuration
const firebaseConfig = {
  apiKey: config.FIREBASE_API_KEY,
  authDomain: config.FIREBASE_DOMAIN,
  databaseURL: config.FIREBASE_DATABASE_URL,
  projectId: config.FIREBASE_PROJECT_ID,
  storageBucket: config.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
  appId: config.FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const firestore = getFirestore(app);

function main() {
    const latestPricesRef = ref(database, 'latest_prices/');
    onChildChanged(latestPricesRef, (data) => {
        console.log(data.key, data.val())
        addDoc(collection(firestore, "pricing_history"), {
            pool_id: data.key,
            timestamp: serverTimestamp(),
            expected_output_amount: data.val().expected_output_amount || null,
            lp_fees: data.val().lp_fees || null,
            min_output_amount: data.val().min_output_amount || null,
            network_fees: data.val().network_fees || null,
            price_impact: data.val().price_impact || null,
            rate: data.val().rate || null,
        })
    })
}

main();
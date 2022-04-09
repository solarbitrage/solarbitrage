import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildChanged } from "firebase/database";
import { collection, getFirestore, addDoc, serverTimestamp} from "firebase/firestore";
import fetch from "node-fetch"
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

let timeout: NodeJS.Timeout;
const DISCORD_STATUS_WEBHOOK = process.env.DISCORD_STATUS_WEBHOOK;

function main() {
    const slippageRef = ref(database, 'mainnet_pool_to_slippage_map/');
    const latestPricesRef = ref(database, 'latest_prices/');

    const currentSlippage = {};

    onChildChanged(slippageRef, (snapshot) => {
        const data = snapshot.val();
        for (const key of Object.keys(data)) {
            currentSlippage[key] = [data[key]["0"], data[key]["1"]]
        }
    })

    onChildChanged(latestPricesRef, (data) => {
        console.log(data.key, data.val());

        if (timeout) {
            clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
            if (!DISCORD_STATUS_WEBHOOK) return;

            fetch(DISCORD_STATUS_WEBHOOK, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    content: "⚠️ Exchange rates have not been updated in over 2 hours!"
                })
            }).catch(e => console.error(e));
        }, 2 * 60 * 60 * 1000); // 2 hours

        addDoc(collection(firestore, "pricing_history"), {
            pool_id: data.key,
            currentSlippage: currentSlippage[data.key],
            direction: "buy",
            timestamp: serverTimestamp(),
            expected_output_amount: data.val().buy.expected_output_amount || null,
            lp_fees: data.val().buy.lp_fees || null,
            min_output_amount: data.val().buy.min_output_amount || null,
            network_fees: data.val().buy.network_fees || null,
            price_impact: data.val().buy.price_impact || null,
            rate: data.val().buy.rate || null,
        })

        addDoc(collection(firestore, "pricing_history"), {
            pool_id: data.key,
            currentSlippage: currentSlippage[data.key],
            direction: "sell",
            timestamp: serverTimestamp(),
            expected_output_amount: data.val().sell.expected_output_amount || null,
            lp_fees: data.val().sell.lp_fees || null,
            min_output_amount: data.val().sell.min_output_amount || null,
            network_fees: data.val().sell.network_fees || null,
            price_impact: data.val().sell.price_impact || null,
            rate: data.val().sell.rate || null,
        })
    })
}

main();
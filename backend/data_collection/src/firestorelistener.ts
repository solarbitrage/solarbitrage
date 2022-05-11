import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildChanged, get } from "firebase/database";
import { collection, getFirestore, addDoc, serverTimestamp} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import fetch from "node-fetch"
import config from "./common/src/config"
import { formatDistance, formatDuration } from "date-fns"

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
const auth = getAuth(app);
const database = getDatabase(app);
const firestore = getFirestore(app);

const args = process.argv.slice(2);

let timeout: NodeJS.Timeout;
const DISCORD_STATUS_WEBHOOK = process.env.DISCORD_STATUS_WEBHOOK;

function lastUpdatedArrToAvg(arr: Date[]) {
    const diffs = [];
    for (let i=1; i<arr.length; i++) {
        diffs.push(arr[i].getTime() - arr[i-1].getTime());
    }
    return diffs.reduce((a, b) => a + b, 0) / (diffs.length || 1);
}

async function get_slippages() {
    const slip_map = ref(database, 'mainnet_pool_to_slippage_map/');
    return get(slip_map).then((snapshot) => {
        if (!snapshot.exists()) return {};
        const data = snapshot.val();
        const ret = {}
        for (const key of Object.keys(data)) {
            ret[key] = [data[key]["0"] || 0, data[key]["1"] || 0]
        }
        return ret;
    })
}

async function main() {
    const slippageRef = ref(database, 'mainnet_pool_to_slippage_map/');
    const latestPricesRef = ref(database, 'latest_prices/');

    const currentSlippage = await get_slippages();
    const currentRates = {};

    onChildChanged(slippageRef, (snapshot) => {
        const data = snapshot.val();
        const key = snapshot.key;
        currentSlippage[key] = [data["0"], data["1"]];
    })

    onChildChanged(latestPricesRef, (data) => {
        
        if (!data.exists()) return;

        const now = new Date();
        currentRates[data.key] = {
            ...data.val(),
            lastUpdated: now,
            lastUpdatedArr: (currentRates[data.key]?.lastUpdatedArr || []),
        };
        // console.log(data.key, data.val());

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

        console.table(Object.keys(currentRates)
            .sort((a, b) => currentRates[a].lastUpdated.getTime() - currentRates[b].lastUpdated.getTime())
            .map(key => ({
                "Pool ID": key,
                "Last Buy Rate": currentRates[key]?.buy?.rate,
                "Rate Last Changed": formatDistance(currentRates[key].lastUpdated, now, { addSuffix: true, includeSeconds: true }),
                "Average Price Change Rate": formatDuration({
                    seconds: parseFloat((lastUpdatedArrToAvg([...currentRates[key].lastUpdatedArr, now]) / 1000).toFixed(6))
                }, { format: ["hours", "minutes", "seconds"], delimiter: ', ' }),
            })));
        
        currentRates[data.key].lastUpdatedArr.push(now)
        currentRates[data.key].lastUpdatedArr = currentRates[data.key].lastUpdatedArr.slice(-20);

        if (args[0] === "SKIP_DOC_SAVE") return;

        addDoc(collection(firestore, "pricing_history"), {
            pool_id: data.key,
            currentSlippage: currentSlippage[data.key] || null,
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
            currentSlippage: currentSlippage[data.key] || null,
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

signInWithEmailAndPassword(auth, config.FIREBASE_EMAIL, config.FIREBASE_PASSWORD)
  .then(() => {
    // Signed in..
    console.log("Signed in!");
    main().catch(e => console.error(e));
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorMessage);
    // ...
  });

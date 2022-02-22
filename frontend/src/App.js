import logo from './logo.svg';
import './App.css';

import { initializeApp, deleteApp } from "firebase/app";
import { collection, query, where, onSnapshot, getFirestore } from "firebase/firestore";
import { useState, useEffect } from "react";

import config from "./firestore.config";

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

function App() {
  const [datas, setDatas] = useState([]);

  useEffect(() => {
    const q = query(collection(database, "dummy"));
    onSnapshot(q, (querySnapshot) => {
      setDatas(querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      })))
    })
  },[])

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
      <h1>Howdy!</h1>

      <p>
        {datas.map((dummy) => (
          dummy.data.a_string
        ))}
      </p>      


    </div>
  );
}

export default App;

import logo from './logo.svg';
import './App.css';

import { initializeApp, deleteApp } from "firebase/app";
import { collection, query, where, onSnapshot, getFirestore } from "firebase/firestore";
import { useState, useEffect } from "react";

var firebaseConfig = {
  apiKey: "super secret",
  authDomain: "solarbitrage-tamu.firebaseapp.com",
  databaseURL: "https://solarbitrage-tamu-default-rtdb.firebaseio.com",
  projectId: "solarbitrage-tamu",
  storageBucket: "solarbitrage-tamu.appspot.com",
  messagingSenderId: "764784752645",
  appId: "1:764784752645:web:ab86d8a2c9a0132403846c"
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

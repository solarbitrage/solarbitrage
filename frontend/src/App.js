import logo from './logo.svg';
import './App.css';

import { initializeApp, deleteApp } from "firebase/app";
import { collection, query, where, onSnapshot, getFirestore } from "firebase/firestore";

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
const q = query(collection(database, "dummy"));
const dummyDatas = [];
  const dart = onSnapshot(q, (querySnapshot) => {
    querySnapshot.forEach((doc) => {
      dummyDatas.push(doc.data().a_string);
    });
  });
function App() {
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
        {dummyDatas[0]}
      </p>      


    </div>
  );
}

export default App;

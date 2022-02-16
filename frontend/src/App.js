import logo from './logo.svg';
import './App.css';

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA43GkvEwu2rVvitE1G9-biG-RhO-ieKMQ",
  authDomain: "solarbitrage-tamu.firebaseapp.com",
  databaseURL: "https://solarbitrage-tamu-default-rtdb.firebaseio.com",
  projectId: "solarbitrage-tamu",
  storageBucket: "solarbitrage-tamu.appspot.com",
  messagingSenderId: "764784752645",
  appId: "1:764784752645:web:ab86d8a2c9a0132403846c"
};

import { getFirestore } from "firebase/firestore";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let defaultFirestore = getFirestore(app);

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
    </div>
  );
}

export default App;

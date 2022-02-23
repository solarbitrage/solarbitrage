import logo from './logo.svg';
import './App.css';

import { collection, query, where, onSnapshot, limitToFirst, orderByChild } from "firebase/firestore";
import { useState, useEffect } from "react";

import PriceHistoryPlot from './components/dashboard/pricingHistoryPlot';

//import database from "./firestore.config";

function App() {
  // const [datas, setDatas] = useState([]);

  // useEffect(() => {
  //   const q = query(collection(database, "dummy"));
  //   onSnapshot(q, (querySnapshot) => {
  //     setDatas(querySnapshot.docs.map(doc => ({
  //       id: doc.id,
  //       data: doc.data()
  //     })))
  //   })
  // },[])

  // const [pricingHistory, setPricingHistory] = useState([]);
  // useEffect(() => {
  //   const q = query(collection(database, "pricing_history")).orderByChild("timestamp").limitToFirst(50);
  //   onSnapshot(q, (querySnapshot) => {
  //     setPricingHistory(querySnapshot.docs.map(doc => ({
  //       id: doc.id,
  //       data: doc.data()
  //     })))
  //   })
  // }, [])

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
        {/* {datas.map((dummy) => (
          dummy.data.a_string
        ))} */}

        {
          
        }
      </p>

      <PriceHistoryPlot 
        times={[0, 1, 2, 3]} 
        prices={[0.5, 10, 20, 5]} />
    </div>
  );
}

export default App;

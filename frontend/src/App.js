import './App.css';

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";

import NavBar from './components/navbar/navbar';
import Dashboard from "./pages/Dashboard";
import Metrics from "./pages/Metrics";

// import { collection, query, where, onSnapshot, limitToFirst, orderByChild } from "firebase/firestore";
// import database from "./firestore.config";

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

  return (
    <div className="App">
      <Router>
        <NavBar />
        <Routes>
            <Route element={ <App /> } />
            <Route path="/dashboard" element={ <Dashboard /> } />
            <Route path="/metrics" element={ <Metrics /> } />
        </Routes>
    </Router>
    </div>
  );
}

export default App;

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

function App() {
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

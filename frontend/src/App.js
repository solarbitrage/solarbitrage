import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";

import NavBar from './components/navbar/navbar';
import Dashboard from "./pages/Dashboard";
import Metrics from "./pages/Metrics";
import Landing from './pages/Landing';
import Footer from './components/footer'

function App() {
  return (
    <div className="App">
      <Router>
        <NavBar />
        <Routes>
            <Route element={ <App /> } />
            <Route path="/" element={ <Landing /> } />
            <Route path="/dashboard" element={ <Dashboard /> } />
            <Route path="/metrics" element={ <Metrics /> } />
        </Routes>
        <Footer />
    </Router>
    </div>
  );
}

export default App;

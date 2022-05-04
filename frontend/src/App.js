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
import Monitoring from './pages/Monitoring'
import { TransactionView } from './pages/TransactionView';

export const AppContext = React.createContext({
  showFooter: true,
  setShowFooter: () => {},
})

function App() {
  const [showFooter, setShowFooter] = React.useState(true);
  return (
    <div className="App">
      <AppContext.Provider value={{
        showFooter,
        setShowFooter
      }}>
        <Router>
          <NavBar />
          <Routes>
              <Route element={ <App /> } />
              <Route path="/" element={ <Landing /> } />
              <Route path="/dashboard" element={ <Dashboard /> } />
              <Route path="/tx/:tx" element={ <TransactionView /> } />
              <Route path="/metrics" element={ <Metrics /> } />
              <Route path="/monitoring" element= { <Monitoring /> } />
          </Routes>
          {showFooter ? <Footer /> : null}
      </Router>
      </AppContext.Provider>
    </div>
  );
}

export default App;

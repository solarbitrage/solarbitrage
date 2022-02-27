import React from "react";
import { Link } from "react-router-dom";

function NavBar() {
    return(
        <div className="NavBar">
            <Link to="/">Home</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/metrics">Metrics</Link>
        </div>
    )
}

export default NavBar;

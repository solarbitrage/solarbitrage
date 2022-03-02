import React from "react";
import { Link } from "react-router-dom";
import { slide as Menu } from "react-burger-menu";

class NavBar extends React.Component {
	showSettings (event) {
    event.preventDefault();
  }

	render() {
		return(
			<div className="NavBar">
				<Link to="/">Home</Link>
				<Link to="/dashboard">Dashboard</Link>
				<Link to="/metrics">Metrics</Link>
			</div>
		)
	}
}

export default NavBar;

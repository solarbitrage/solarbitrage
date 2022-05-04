import React from "react";
import { Container, Nav, Navbar, Button, Image} from "react-bootstrap"
import { LinkContainer } from 'react-router-bootstrap'

import logo from '../../assets/logo.svg'

function NavBar() {
	return (
		<Navbar collapseOnSelect expand="lg" sticky="top" bg="dark" variant="dark">
			<Container fluid>
				<LinkContainer to="/">
					<Navbar.Brand href="#home">
						<img
							src={logo}
							width="150"
							height="30"
							className="d-inline-block align-top logo"
							alt="Solarbitrage logo"
						/>
					</Navbar.Brand>
				</LinkContainer>
				<Navbar.Toggle aria-controls="responsive-navbar-nav" />
				<Navbar.Collapse id="responsive-navbar-nav">
					<Nav className="me-auto">
						<LinkContainer to="/">
							<Nav.Link>
								Home
							</Nav.Link>
						</LinkContainer>
						<LinkContainer to="/dashboard">
							<Nav.Link>
								Dashboard
							</Nav.Link>
						</LinkContainer>
						<LinkContainer to="/metrics">
							<Nav.Link>
								Metrics
							</Nav.Link>
						</LinkContainer>
						<LinkContainer to="/monitoring">
							<Nav.Link>
								Monitoring
							</Nav.Link>
						</LinkContainer>
					</Nav>
					<Button>
                        View our project on GitHub! <i class="bi bi-github"></i>
                    </Button>
				</Navbar.Collapse>
			</Container>
		</Navbar>
	)
}

export default NavBar;

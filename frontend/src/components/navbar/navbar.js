import React from "react";
import { Container, Nav, Navbar, Button, Form} from "react-bootstrap"
import { LinkContainer } from 'react-router-bootstrap'

function NavBar() {
	return (
		<Navbar collapseOnSelect expand="lg" sticky="top" bg="dark" variant="dark">
			<Container>
				<LinkContainer to="/">
					<Navbar.Brand>Solarbitrage</Navbar.Brand>
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
					</Nav>
					<Form inline>
						<Button variant="primary">Connect Wallet <i class="bi bi-wallet2"></i></Button>
					</Form>
				</Navbar.Collapse>
			</Container>
		</Navbar>
	)
}

export default NavBar;

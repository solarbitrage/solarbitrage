import React from "react";
import { Container, Row, Col, Button, Image } from "react-bootstrap";
import solanalogo from '../assets/solana-logo.png'

function Dashboard() {
    return (
        <div class="landing-page-jumbotron">
            <div class="center">
                <div class="d-flex p-2 align-items-center justify-content-center borderGrey">
                    <Container fluid>
                        <Row>
                            <Col sm>
                                <div class="landing-page-text">
                                    <h1><strong>Solarbitrage</strong></h1>
                                    <h2>An <strong>efficient</strong>, <strong>state of the art</strong> arbitrage bot powered by the Solana blockchain.</h2>
                                    <h3>Finding opportunities between <strong>15</strong> cryptocurrencies on <strong>2</strong> automatic money makers.</h3>
                                    <Button variant="primary">Learn more</Button>
                                </div>
                            </Col>

                            <Col sm>
                                <img class="landing-page-image" src={solanalogo}></img>
                            </Col>
                        </Row>
                    </Container>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
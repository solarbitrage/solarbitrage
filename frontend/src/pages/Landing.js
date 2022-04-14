import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import stockphoto from '../assets/stock_photo.png'

function Dashboard() {
    return (
        <div>
            <div class='landing-page-jumbotron'>
                <div class='center'>
                    <div>
                        <Container fluid>
                            <Row className='align-items-center'>
                                <Col lg> 
                                    <div class='landing-page-text'>
                                        <h1>
                                            <strong>Blazing fast</strong>, <strong>no fee</strong> arbitraging.
                                        </h1>
                                        <h2>
                                            <strong>15</strong> cryptocurrencies. <br></br> 
                                            <strong>2</strong> automatic money makers. <br></br>
                                            <strong>1</strong> platform.
                                        </h2> 
                                        <br></br>
                                        <Button size='lg' variant='primary'>Learn more</Button>
                                    </div>
                                </Col>

                                <Col lg>
                                    <img class='landing-page-image d-none d-lg-block' alt='decorative' src={stockphoto}></img>
                                </Col>
                            </Row>
                        </Container>
                    </div>
                </div>
            </div>

            <div id="info-section" class="info-section">
                <h2>
                    Information
                </h2>
                <div class = 'borderGrey'>
                    <Container>
                        <Row className='align-items-center'>
                            <Col md>
                                Create an account
                            </Col>
                            <Col md>
                                Deposit funds 
                            </Col>
                            <Col md>
                                Start your trading bot
                            </Col>
                            <Col md>
                                Monitor your profit
                            </Col>
                        </Row>
                    </Container>
                </div>
            </div>
        </div>

    )
}

export default Dashboard
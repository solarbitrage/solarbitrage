import React from 'react';
import { Container, Row, Col, Button, Card, CardGroup } from 'react-bootstrap';
import Footer from '../components/footer'
import FAQ from '../components/faq'
import Team from '../components/team'
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
                                    <div class='landing-page-text text-white'>
                                        <h1>
                                            <strong>Blazing fast</strong>, <strong>no fee</strong> arbitraging.
                                        </h1>
                                        <h2>
                                            <strong>15</strong> cryptocurrencies. <br></br> 
                                            <strong>2</strong> automatic money makers. <br></br>
                                            <strong>1</strong> platform.
                                        </h2> 
                                        <br></br>
                                        <a href="#info-section">
                                            <Button size='lg' variant='primary'>Learn more</Button>                      
                                        </a>
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

            <Team />

            <div id="info-section" class="info-section">
                <div>
                    <Container>
                        <h2 className="text-white" style={{paddingTop: "25px", paddingBottom: "25px"}}>
                            How does it work?
                        </h2>
                        <Row className='align-items-center'>
                            <CardGroup>
                                <Card className="mb-3">
                                    <Card.Header as="h5">Step 1.</Card.Header>
                                    <Card.Body>
                                        <Card.Title>Create an Account</Card.Title>
                                        <Card.Text>
                                        Start your arbitraging experience by creating an account!
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                                <Card className="mb-3">
                                    <Card.Header as="h5">Step 2.</Card.Header>
                                    <Card.Body>
                                        <Card.Title>Deposit Funds</Card.Title>
                                        <Card.Text>
                                        By depositing funds into Solarbitrage, your bot will then have starting capital to begin trading with.
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                                <Card className="mb-3">
                                    <Card.Header as="h5">Step 3.</Card.Header>
                                    <Card.Body>
                                        <Card.Title>Create Your Arbitrage Bot</Card.Title>
                                        <Card.Text>
                                        Go through a simple set up process to create your arbitrage bot.
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                                    <Card className="mb-3" >
                                    <Card.Header as="h5">Step 4.</Card.Header>
                                    <Card.Body>
                                        <Card.Title>Watch Your Profits Grow</Card.Title>
                                        <Card.Text>
                                        Yes. It's really that simple!
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </CardGroup>
                        </Row>
                    </Container>
                </div>
            </div>
            
            <FAQ />
            <Footer />
        </div>

    )
}

export default Dashboard
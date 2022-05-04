import React from 'react';
import { Container, Row, Col, Button, Card, CardGroup } from 'react-bootstrap';
import FAQ from '../components/faq'
import Team from '../components/team'
import landingphoto from '../assets/landing_photo.png'

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
                                            <strong>18</strong> cryptocurrencies. <br></br> 
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
                                    <img class='landing-page-image d-none d-lg-block' alt='decorative' src={landingphoto}></img>
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
                                        <Card.Title>Near realtime data collection</Card.Title>
                                        <Card.Text>
                                        Our bot collects near realtime data for all of the currencies and AMMs it is monitoring.
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                                <Card className="mb-3">
                                    <Card.Header as="h5">Step 2.</Card.Header>
                                    <Card.Body>
                                        <Card.Title>Determine profitable trades</Card.Title>
                                        <Card.Text>
                                        Solarbitrage then decides using it's own algorithms what could possibly be a profitable trade.
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                                <Card className="mb-3">
                                    <Card.Header as="h5">Step 3.</Card.Header>
                                    <Card.Body>
                                        <Card.Title>Execute trades</Card.Title>
                                        <Card.Text>
                                        Solarbitrage then executes a single atomic transaction on the blockchain containing the multiple swaps.
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                                    <Card className="mb-3" >
                                    <Card.Header as="h5">Step 4.</Card.Header>
                                    <Card.Body>
                                        <Card.Title>Monitoring performance</Card.Title>
                                        <Card.Text>
                                        We then monitor the performance of the bot over time and fine tune our trading strategy.
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            </CardGroup>
                        </Row>
                    </Container>
                </div>
            </div>
            
            <FAQ />
        </div>

    )
}

export default Dashboard
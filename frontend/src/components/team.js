import React from "react"
import { Container, Row, Card, CardGroup} from "react-bootstrap"

import daniel from '../assets/daniel.png'
import george from '../assets/george.png'
import noel from '../assets/noel.png'
import ryan from '../assets/ryan.png'

function Team() {
    return (
        <div>
            <div id="team" class="team-section">
            <Container>
                <h2 class="text-white" style={{paddingTop: "25px", paddingBottom: "25px"}}>Meet the team</h2>
                <Row className='align-items-center'>
                    <CardGroup>
                        <Card style={{ width: '18rem' }}>
                            <Card.Img variant="top" src={ryan} />
                            <Card.Body class="team-text">
                                <Card.Title>Ryan Hall</Card.Title>
                                <Card.Text>
                                Data Collection<br></br>
                                Front End<br></br>
                                Monitoring
                                </Card.Text>
                            </Card.Body>
                        </Card>
                        <Card style={{ width: '18rem' }}>
                            <Card.Img variant="top" src={noel} />
                            <Card.Body class="team-text">
                                <Card.Title>Noel John</Card.Title>
                                <Card.Text>
                                Algorithm Development<br></br>
                                Team Lead<br></br>
                                Trading Bot Programming
                                </Card.Text>
                            </Card.Body>
                        </Card>
                        <Card style={{ width: '18rem' }}>
                            <Card.Img variant="top" src={daniel} />
                            <Card.Body class="team-text">
                                <Card.Title>Daniel Phan</Card.Title>
                                <Card.Text>
                                Front End<br></br>
                                Metrics Development
                                </Card.Text>
                            </Card.Body>
                        </Card>
                        <Card style={{ width: '18rem' }}>
                            <Card.Img variant="top" src={george} />
                            <Card.Body class="team-text">
                                <Card.Title>George Thayamkery</Card.Title>
                                <Card.Text>
                                Algorithm Development <br></br>
                                Back End <br></br>
                                Trading Bot Programming
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </CardGroup>
                </Row>
            </Container>
        </div>
        </div>
    )
}

export default Team;
import React from "react"
import { Row, Col , Stack, Button} from "react-bootstrap"

function Footer() {
    return (
        <div class="footer-section">
            <Row>
                <Col xs={6}>
                    <h4>
                        Solarbitrage
                    </h4>
                    <p>
                        Solarbitrage is an arbitrage bot designed by students enrolled in CSCE 482: Senior Capstone Design at
                        Texas A&M University. This project was created over the Spring 2022 semester and reflects the student's
                        work and understanding of blockchain technologies including how to build full stack applications on the
                        Solana blockchain.
                    </p>
                    <Button>
                        View our project! <i class="bi bi-github"></i>
                    </Button>
                </Col>
                <Col>
                    <Stack gap={3}>
                        <h4>Links</h4>
                        <a class="footer-links" href="https://github.tamu.edu/solarbitrage/solarbitrage/">GitHub Project</a>
                        <a class="footer-links" href="https://github.tamu.edu/solarbitrage/weekly-reports/blob/master/Solarbitrage%20Proposal.pdf">Project Proposal</a>
                        <a class="footer-links" href="https://github.tamu.edu/solarbitrage/weekly-reports/blob/master/Senior_Design_CDR_Solarbitrage.pdf">Critical Design Review</a>
                        <a class="footer-links" href="#nowhere">Final Presentation</a>
                    </Stack>
                </Col>
                <Col>
                    <Stack gap={3}>
                            <h4>External Links</h4>
                            <a class="footer-links" href="https://solana.com/">Solana</a>
                            <a class="footer-links" href="https://solscan.io/account/DcdQUY7TAh5GSgTzoAEG5q6bZeVk95xFkJLqu4JHKa7z">Solscan Trading Bot</a>
                    </Stack>
                </Col>
            </Row>
        </div>
    )
}

export default Footer;
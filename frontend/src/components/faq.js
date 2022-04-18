import React from 'react'
import { Accordion, Container } from 'react-bootstrap'
function FAQ() {
    return (
        <div id="faq" class="faq-section">
            <Container>
                <h2 class="text-white" style={{paddingTop: "25px", paddingBottom: "25px"}}>Frequently Asked Questions</h2>
                <Accordion>
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Is this application really free?</Accordion.Header>
                        <Accordion.Body>
                        Absolutely! This project was created as a capstone project for seniors at Texas A&M University
                        during the Spring 2022 semester. This product was created by students and because of that we don't
                        see this project ever opening completely to the public.
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                        <Accordion.Header>What automatic money makers do you use?</Accordion.Header>
                        <Accordion.Body>
                        We currently leverage two automatic money makers, Orca and Raydium. This list will get updated as more automatic money makers are added.
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="2">
                        <Accordion.Header>What cryptocurrencies do you trade?</Accordion.Header>
                        <Accordion.Body>
                        We currently perform arbitrage between the following list of currencies. This list will get updated as more cryptocurrencies are added.
                        <ul>
                            <li>ATLAS</li>
                            <li>ETH</li>
                            <li>LIQ</li>
                            <li>MNGO</li>
                            <li>mSOL</li>
                            <li>ORCA</li>
                            <li>PORT</li>
                            <li>RAY</li>
                            <li>SBR</li>
                            <li>SLIM</li>
                            <li>SLRS</li>
                            <li>SOL</li>
                            <li>SNY</li>
                            <li>UPS</li>
                            <li>USDC</li>
                        </ul>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="3">
                        <Accordion.Header>What is the risk of investing using Solarbitrage</Accordion.Header>
                        <Accordion.Body>
                        By using our proprietary transaction system, we only make successful transactions. This 
                        means for any transaction that is completed, Solarbitrage will make profit. Any transaction that 
                        will net a loss will not be processed, but will still be subject to a transaction fee. 
                        This typically costs around 0.0005 SOL. This fee is not created by Solarbitrage, but rather the
                        Solana network.
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="4">
                        <Accordion.Header>Is this project open source?</Accordion.Header>
                        <Accordion.Body>
                        Yes! You can find the link to all of our source code posted on our <a href="https://github.tamu.edu/solarbitrage/solarbitrage">GitHub</a>.
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Container>
        </div>
    )
}

export default FAQ;
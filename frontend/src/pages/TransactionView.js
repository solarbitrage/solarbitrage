import React, { useEffect } from "react";
import { AppContext } from "../App";
import { useParams } from "react-router-dom";
import {Button, Col, Table} from "react-bootstrap"
import {BigNumber} from "../components/bigNumber";

export const TransactionView = () => {
    const { tx } = useParams();

    const [txData, setTxData] = React.useState(null);
    const [poolKeysMap, setPoolKeysMap] = React.useState(null);

    const { setShowFooter } = React.useContext(AppContext);
    useEffect(() => {
        setShowFooter(false);

        return () => {
            setShowFooter(true);
        }
    }, [setShowFooter]);

    useEffect(() => {
        (async () => {
            const data = await fetch("https://sb-bot-insights.herokuapp.com/api/tx/" + tx).then(res => res.json());
            console.log(data);
            setTxData(data);
        })()
    }, [tx, setTxData]);

    return (
        <div fluid className="d-flex flow-row" style={{ gap: "0.5rem" }}>
            <div style={{ width: "70%" }}>
                <iframe src={`https://solscan.io/tx/${tx}`} style={{ width: "100%", height: 'calc(100vh - 56px)'}} title="Solarbitrage Monitoring"></iframe>
            </div>
            <div style={{ flex: 1, maxHeight: 'calc(100vh - 56px)', overflow: "auto" }} className="bg-white p-3">
                <Button variant="outline-primary mb-4" href={`https://solscan.io/tx/${tx}`} target="_blank">Open in Solscan</Button>
                {txData ? (
                <>
                    <h4 className="mb-3">
                        Trading 
                        <img alt={txData.baseToken} src={`https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${txData.baseTokenMint}/logo.png`} style={{borderRadius: "50%", width: "1.2rem", height: "1.2rem", marginBottom: "0.2rem"}} className="mx-2 border"/>
                        {txData.baseToken} for 
                        <img alt={txData.middleToken} src={`https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${txData.middleTokenMint}/logo.png`} style={{borderRadius: "50%", width: "1.2rem", height: "1.2rem", marginBottom: "0.2rem"}} className="mx-2 border"/>
                        {txData.middleToken} and back
                    </h4>
                    <dl className="row">
                        <Col>
                        <dt>First Pool</dt>
                        <dd><code>{txData.route[0]}</code></dd>
                        </Col>
                        <Col>
                        <dt>Second Pool</dt>
                        <dd><code>{txData.route[1]}</code></dd>
                        </Col>
                    </dl>
                    <h5>Expectation vs Reality</h5>
                    <Table size="small">
                        <thead>
                            <tr>
                                <th>Expectation</th>
                                <th>Reality</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    Swap <BigNumber number={txData.transactionExpectation.startingAmount}/>{" "}
                                    {txData.baseToken}{" "}<br/>
                                    for <BigNumber number={txData.transactionExpectation.afterFirstSwap}/>{" "}
                                    {txData.middleToken}{" "}
                                </td>
                                <td>
                                    Swap <BigNumber number={txData.transactionReality.startingAmount}/>{" "}
                                    {txData.baseToken}{" "}<br/>
                                    for <BigNumber number={txData.transactionReality.afterFirstSwap}/>{" "}
                                    {txData.middleToken}{" "}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Swap <BigNumber number={txData.transactionExpectation.afterFirstSwap}/>{" "}
                                    {txData.middleToken}{" "}<br/>
                                    for <BigNumber number={txData.transactionExpectation.afterSecondSwap}/>{" "}
                                    {txData.baseToken}{" "}
                                </td>
                                <td>
                                Swap <BigNumber number={txData.transactionExpectation.afterFirstSwap}/>{" "}
                                    {txData.middleToken}{" "}<br/>
                                    for <BigNumber number={txData.transactionReality.afterSecondSwap}/>{" "}
                                    {txData.baseToken}{" "}
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                    <h5 className="mt-3">Route given correct exchange rates</h5>
                    <Table size="small">
                        <thead>
                            <tr>
                                <th>Best Case Scenario</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    Swap <BigNumber number={txData.transactionAltReality.startingAmount}/>{" "}
                                    {txData.baseToken}{" "}<br/>
                                    for <BigNumber number={txData.transactionAltReality.afterFirstSwap}/>{" "}
                                    {txData.middleToken}{" "}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    Swap <BigNumber number={txData.transactionAltReality.afterFirstSwap}/>{" "}
                                    {txData.middleToken}{" "}<br/>
                                    for <BigNumber number={txData.transactionAltReality.afterSecondSwap}/>{" "}
                                    {txData.baseToken}{" "}
                                </td>
                            </tr>
                        </tbody>
                    </Table>
                </>
                ): null}
            </div>
        </div>
    )
}

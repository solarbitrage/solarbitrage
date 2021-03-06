import React from "react";
import HistoryPlot from "../components/historyPlot";
import Checkbox from "../components/checkbox";
import {Button} from "react-bootstrap";
import Plot from "react-plotly.js";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Datetime from "react-datetime";
import "react-datetime/css/react-datetime.css";
import NumericInput from "react-numeric-input";

import { getDatabase, ref, child, get } from "firebase/database";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import database from "../firestore.config";
//import { async } from "@firebase/util";

function Metrics() {
  // Display names.
  const ammsDisplay = ["Orca", "Raydium"];
  const directionsDisplay = ["Buy", "Sell"];

  // Names as listed in the firestore database.
  const amms = ["ORCA", "RAYDIUM"];
  const directions = ["buy", "sell"];

  const [ammCheckedState, setAMMCheckedState] = React.useState(new Array(amms.length).fill(true));
  const [currencyCheckedState, setCurrencyCheckedState] = React.useState(new Array(0).fill(false));
  const [directionCheckedState, setDirectionCheckedState] = React.useState(new Array(directions.length).fill(true));

  const [rateDatas, setRateDatas] = React.useState(new Array(0).fill(null));
  const [rateDisplays, setRateDisplays] = React.useState(new Array(0).fill(null));

  const [endDateTime, setEndDateTime] = React.useState(new Date());
  const [startDateTime, setStartDateTime] = React.useState(new Date().getTime() - (1000 * 60 * 60));

  const [profitDatas, setProfitDatas] = React.useState(new Array(0).fill(null));
  const [slippageData, setSlippage] = React.useState(0.0);

  /**
   * Sends a constructed query to firebase and places them in
   * the rateDatas array.
   * @param {Query<DocumentData>} q The constructed query to send
   * @param {string} rateDisplay The name of the pool to be displayed on the graph
   * @param {number} directionIndex 0 for buy, 1 for sell
   */
  const queryPoolRate = async(q, rateDisplay, directionIndex) => {
    const docSnap = await getDocs(q);
    setRateDatas(rateDatas => [...rateDatas, docSnap.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }))]);

    if (directionIndex === 0) {
      setRateDisplays(rateDisplays => [...rateDisplays, {
        displayName: rateDisplay,
        yaxis: "y1"
      }])  
    }
    else {
      setRateDisplays(rateDisplays => [...rateDisplays, {
        displayName: rateDisplay,
        yaxis: "y2"
      }])  
    }
  }

  /**
   * Fetches data based on which filters are checked.
   */
  function fetchData() {
    setProfitDatas(new Array(0).fill(null));
    setRateDatas(new Array(0).fill(null));
    setRateDisplays(new Array(0).fill(null));
    const startDate = new Date(startDateTime);
    const endDate = new Date(endDateTime);

    for (let directionIndex = 0; directionIndex < directions.length; directionIndex++) {
      for (let ammIndex = 0; ammIndex < amms.length; ammIndex++) {
        for (let currencyIndex = 0; currencyIndex < currencyCheckedState.length; currencyIndex++) {
          // Check if the filters are checked
          if (ammCheckedState[ammIndex] && currencyCheckedState[currencyIndex].enabled && directionCheckedState[directionIndex]) {

            // Create pairs
            for (let currencyPairIndex = currencyIndex + 1; currencyPairIndex < currencyCheckedState.length; currencyPairIndex++) {
              if (currencyCheckedState[currencyPairIndex].enabled) {
                let poolID = amms[ammIndex] + "_" + currencyCheckedState[currencyIndex].currency + "_" + currencyCheckedState[currencyPairIndex].currency;
                let poolIDReversed = amms[ammIndex] + "_" + currencyCheckedState[currencyPairIndex].currency + "_" + currencyCheckedState[currencyIndex].currency;

                const q1 = query(collection(database, "pricing_history"), 
                  where("pool_id", "==", poolID), 
                  where("direction", "==", directions[directionIndex]), 
                  where("timestamp", ">=", startDate),
                  where("timestamp", "<=", endDate),
                  orderBy("timestamp", "desc"));
                const q2 = query(collection(database, "pricing_history"), 
                  where("pool_id", "==", poolIDReversed), 
                  where("direction", "==", directions[directionIndex]), 
                  where("timestamp", ">=", startDate),
                  where("timestamp", "<=", endDate),
                  orderBy("timestamp", "desc"));
                
                let rateDisplay = ammsDisplay[ammIndex] + " | " + directionsDisplay[directionIndex] + " " + currencyCheckedState[currencyIndex].currency + " to " + currencyCheckedState[currencyPairIndex].currency;
                queryPoolRate(q1, rateDisplay, directionIndex);

                rateDisplay = ammsDisplay[ammIndex] + " | " + directionsDisplay[directionIndex] + " " + currencyCheckedState[currencyPairIndex].currency + " to " + currencyCheckedState[currencyIndex].currency;
                queryPoolRate(q2, rateDisplay, directionIndex);
              }
            }
          }
        }
      }
    }
    return;
  }

  // On change handlers
  function slippageOnChangeHandler(value) { setSlippage(old => value); }
  function slippageNumInputOnChangeHandler(value) { setSlippage(old => value / 100.0); }
  function startDateTimeOnChangeHandler(value) { setStartDateTime(old => value); }
  function endDateTimeOnChangeHandler(value) { setEndDateTime(old => value); }

  /**
   * Toggles the checkbox state of the AMMs filter.
   * @param {number} position the index of the checkbox of the AMMs filter. 
   */
  const handleAMMCheckboxOnChange = (position) => {
    const updatedAMMCheckedState = ammCheckedState.map((item, index) => {
      return (index === position ? !item : item);
    });
    setAMMCheckedState(updatedAMMCheckedState);
  }

  /**
   * Toggles the checkbox state of the currency filter.
   * @param {number} position the index of the checkbox of the currency filter. 
   */
  const handleCurrenciesCheckboxOnChange = (position) => {
    const updatedCurrencyCheckedState = currencyCheckedState.map((item, index) => {
      if (index === position) {
        item.enabled = !item.enabled
      }
      return item;
    })
    setCurrencyCheckedState(updatedCurrencyCheckedState);
  }

  /**
   * Toggles the checkbox state of the directions filter.
   * @param {number} position the index of the checkbox of the directions filter. 
   */
   const handleDirectionCheckboxOnChange = (position) => {
    const updatedDirectionCheckedState = directionCheckedState.map((item, index) => {
      return (index === position ? !item : item);
    });
    setDirectionCheckedState(updatedDirectionCheckedState);
  }

  // Calculate Profits
  React.useEffect(() => {
    if (ammCheckedState.filter(x => x === true).length < 2 
      || currencyCheckedState.filter(x => x.enabled === true).length < 2
      || directionCheckedState.filter(x => x === true).length < 2) {
      return;
    }

    const calculateProfitability = (poolABuy, poolASell, poolBBuy, poolBSell, transasctionFee) => {
      if (poolABuy.length === 0 || poolASell.length === 0 || poolBBuy.length === 0 || poolBSell.length === 0) {
        return null;
      }
      
      console.log({poolABuy, poolBBuy});
      // Grabbing relevant data
      let poolARates = {
        buyTime: poolABuy.map(ph => new Date((ph.data.timestamp.seconds * 1000.0) + (ph.data.timestamp.nanoseconds / 1000000))),
        buyRate: poolABuy.map(ph => ph.data.rate),
        sellTime: poolASell.map(ph => new Date((ph.data.timestamp.seconds * 1000.0) + (ph.data.timestamp.nanoseconds / 1000000))),
        sellRate: poolASell.map(ph => ph.data.rate)
      }
      let poolBRates = {
        buyTime: poolBBuy.map(ph => new Date((ph.data.timestamp.seconds * 1000.0) + (ph.data.timestamp.nanoseconds / 1000000))),
        buyRate: poolBBuy.map(ph => ph.data.rate),
        sellTime: poolBSell.map(ph => new Date((ph.data.timestamp.seconds * 1000.0) + (ph.data.timestamp.nanoseconds / 1000000))),
        sellRate: poolBSell.map(ph => ph.data.rate)
      }
      
      let estimatedProfits = [];
      let times = [];
  
      while (poolARates.buyTime.length > 0 && poolARates.sellTime.length > 0 && poolBRates.buyTime.length > 0 && poolBRates.sellTime.length > 0) {
        let newestTime = new Date(Math.max.apply(null, [poolARates.buyTime[0], poolARates.sellTime[0], poolBRates.buyTime[0], poolBRates.sellTime[0]]));
        let estimatedProfit = {
          aThenB: ((1 * poolARates.buyRate[0] * (1 - slippageData)) * poolBRates.sellRate[0] * (1 - slippageData)) - 1,
          bThenA: ((1 * poolBRates.buyRate[0] * (1 - slippageData)) * poolARates.sellRate[0] * (1 - slippageData)) - 1
        }
        estimatedProfits.push(Math.max(estimatedProfit.aThenB, estimatedProfit.bThenA));
        times.push(newestTime);
  
        if (newestTime.getTime() === poolARates.buyTime[0].getTime()) {
          poolARates.buyTime.shift();
          poolARates.buyRate.shift();
        }
        if (newestTime.getTime() === poolARates.sellTime[0].getTime()) {
          poolARates.sellTime.shift();
          poolARates.sellRate.shift();
        }
        if (newestTime.getTime() === poolBRates.buyTime[0].getTime()) {
          poolBRates.buyTime.shift();
          poolBRates.buyRate.shift();
        }
        if (newestTime.getTime() === poolBRates.sellTime[0].getTime()) {
          poolBRates.sellTime.shift();
          poolBRates.sellRate.shift();
        }
      }
  
      console.log({poolARates, poolBRates, estimatedProfits});
      console.log("Best possible trade:", Math.max.apply(null, estimatedProfits));
      console.log("Worst possible trade:", Math.min.apply(null, estimatedProfits));    
      const poolName = poolABuy[0].data.pool_id.split("_");
      console.log(poolName);
  
      setProfitDatas(profitDatas => [...profitDatas, {
        profit: estimatedProfits,
        time: times,
        name: poolName[1] + " and " + poolName[2]
      }]);
    }

    let offset = rateDatas.length / 4;
    console.log(rateDatas);
    for (let i = 0; i < rateDatas.length; i++) {
      if (rateDatas[i] && rateDatas[(offset * 1) + i] && rateDatas[(offset * 2) + i] && rateDatas[(offset * 3) + i]) {
        calculateProfitability(rateDatas[i], rateDatas[(offset * 2) + i], rateDatas[(offset * 1) + i], rateDatas[(offset * 3) + i], 0);
      }
    }
  }, [rateDatas, slippageData, ammCheckedState, currencyCheckedState, directionCheckedState]);

  /**
	 * Functions to fire once when the page loads.
	 */
	React.useEffect(() => {
		// Getting configurable variables from the real time database. 
		const realtimeDBRef = ref(getDatabase());
		get(child(realtimeDBRef, "currencies_to_use")).then((snapshot) => {
			if (snapshot.exists()) {
				let initialCurrenciesChecked = new Array(0);
				
				let i = 0;
				for (const currency in snapshot.val()) {
					initialCurrenciesChecked[i] = {
						currency: currency,
						enabled: false
					}
					++i;
				}
				setCurrencyCheckedState(initialCurrenciesChecked);
			} else {
				console.log("No data avaliable.");
			}
		}).catch((error) => {
			console.error(error);
		})
	}, []);

  return (
    <div className="page-container">
      <div className="container">
        <h1>Metrics</h1>
        <div className="widget-container white-boxed col-centric">

            <div className="widget-container">
              <div className="amm-checkbox-container filter">
                <h3>AMMs</h3>
                {ammsDisplay.map((name, index) => {
                  return (
                    <Checkbox key={index} label={name} value={ammCheckedState[index]} onChange={() => handleAMMCheckboxOnChange(index)} id={"amm-" + index} />
                  );
                })}
              </div>
              <div className="currency-checkbox-container filter">
                <h3>Currencies</h3>
                {currencyCheckedState.map((entry, index) => {
                  return (
                    <Checkbox key={index} label={entry.currency} value={entry.enabled} onChange={() => handleCurrenciesCheckboxOnChange(index)} id={"currency-" + index} />
                  );
                })}
              </div>
              <div className="direction-checkbox-container filter">
                <h3>Direction</h3>
                {directionsDisplay.map((name, index) => {
                  return (
                    <Checkbox key={index} label={name} value={directionCheckedState[index]} onChange={() => handleDirectionCheckboxOnChange(index)} id={"direction-" + index}/>
                  );
                })}
              </div>

              <div className="datetime-container filter">
                <h3>Time range</h3>
                <div className="date-time">
                  <p>Start Time:</p>
                  <Datetime value={startDateTime} onChange={startDateTimeOnChangeHandler}/>
                </div>
                
                <div className="date-time">
                  <p>End Time:</p>
                  <Datetime value={endDateTime} onChange={endDateTimeOnChangeHandler}/>
                </div>
              </div>

              <div className="profitability-attributes filter">
                <h3>Profitability Data Augments</h3>
                <div>
                  <label>Slippage: </label>
                  <NumericInput min={0} max={100} value={slippageData * 100} onChange={slippageNumInputOnChangeHandler}/> %
                  <br />
                  <br />
                  <Slider value={slippageData} min={0.0} max={1.0} step={0.01} onChange={slippageOnChangeHandler} />
                </div>
              </div>

              <Button className="filter-apply-btn" variant="primary" onClick={fetchData}>Apply</Button>

            </div>

          <HistoryPlot
            data={
              rateDatas.map((data, index) => {
                //console.log(index);
                if (data && rateDisplays[index]) {
                  let arrayData = {};
                  if (rateDisplays[index].yaxis === "y1") {
                    arrayData = {
                      type: "scatter",
                      mode: "lines+points",
                      name: rateDisplays[index].displayName,
                      secondary_y: rateDisplays[index].secondaryYAxis,
                      x: data.map(ph => new Date((ph.data.timestamp.seconds * 1000) + (ph.data.timestamp.nanoseconds / 1000000))),
                      y: data.map(ph => ph.data.rate)
                    }
                  }
                  else if (rateDisplays[index].yaxis === "y2"){
                    arrayData = {
                      type: "scatter",
                      mode: "lines+points",
                      name: rateDisplays[index].displayName,
                      secondary_y: rateDisplays[index].secondaryYAxis,
                      x: data.map(ph => new Date((ph.data.timestamp.seconds * 1000) + (ph.data.timestamp.nanoseconds / 1000000))),
                      y: data.map(ph => ph.data.rate),
                      yaxis: "y2"
                    }
                  }
                  else if (rateDisplays[index].yaxis === "y3"){
                    arrayData = {
                      type: "scatter",
                      mode: "lines",
                      name: "Profits",
                      x: data.time,
                      y: data.profit,
                      yaxis: "y3",
                      opacity: 0.5,
                      fill: "tozeroy"
                    }
                  }
                  return arrayData;
                } else {
                  return {
                    type: "scatter",
                    mode: "lines+points"
                  };
                }
              })}
            layout = {
              {
                autosize: true,
                title: "Rates over time",
                yaxis: {title: 'Buy Rates'},
                yaxis2: {
                  title: 'Sell Rates',
                  overlaying: 'y',
                  side: 'right'
                },
                yaxis3: {
                  title: 'USDC',
                  anchor: "free",
                  overlaying: "y",
                  side:"right",
                  position: 1.15
                }
              }
            }
          />

          <Plot
            data={
              profitDatas.map((data, index) => {
                if (data && rateDisplays[index]) {
                  let arrayData = {};
                    arrayData = {
                      type: "scatter",
                      mode: "lines+points",
                      name: data.name,
                      x: data.time,
                      y: data.profit
                    }
                  return arrayData;
                } else {
                  return {
                    type: "scatter",
                    mode: "lines+points"
                  };
                }
              })}
            layout={ 
              {
                autosize: true,
                title: "Possible Profits From Trades",              
              }
            }
            useResizeHandler={true}
            style={{width: "100%", height: "70vh"}}
          />

        </div>
      </div>
    </div>
  )
}

export default Metrics

import React from "react";
import HistoryPlot from "../components/historyPlot";
import Checkbox from "../components/checkbox";
import {Button} from "react-bootstrap";

import { collection, query, where, limit, orderBy, getDocs } from "firebase/firestore";
import database from "../firestore.config";
//import { async } from "@firebase/util";

function Metrics() {
  // Display names.
  const ammsDisplay = ["Orca", "Raydium"];
  const poolsDisplay = ["SOL to USDC", "BTC to USDC", "ORCA to SOL", "ORCA to USDC", "ETH to USDC", "RAY to USDC"];
  const directionsDisplay = ["Buy", "Sell"];

  // Names as listed in the firestore database.
  const amms = ["ORCA", "RAYDIUM"];
  const pools = ["SOL_USDC", "BTC_USDC", "ORCA_SOL", "ORCA_USDC", "ETH_USDC", "RAY_USDC"];
  const directions = ["buy", "sell"];

  const [ammCheckedState, setAMMCheckedState] = React.useState(new Array(amms.length).fill(false));
  const [poolCheckedState, setPoolCheckedState] = React.useState(new Array(pools.length).fill(false));
  const [directionCheckedState, setDirectionCheckedState] = React.useState(new Array(directions.length).fill(false));

  const [rateDatas, setRateDatas] = React.useState(new Array(ammCheckedState.length * poolCheckedState.length * directionCheckedState.length).fill(null));
  const [rateDisplays, setRateDisplays] = React.useState(new Array(ammCheckedState.length * poolCheckedState.length * directionCheckedState.length).fill(null));

  const [profitDatas, setProfitDatas] = React.useState(new Array(0).fill(null));

  /**
   * Fetches data based on which filters are checked.
   */
  const fetchData = async() => {
    for (let ammIndex = 0; ammIndex < amms.length; ammIndex++) {
      for (let poolIndex = 0; poolIndex < pools.length; poolIndex++) {
        for (let directionIndex = 0; directionIndex < directions.length; directionIndex++) {
          if (ammCheckedState[ammIndex] && poolCheckedState[poolIndex] && directionCheckedState[directionIndex]) {
            let poolID = amms[ammIndex] + "_" + pools[poolIndex];
            const q = query(collection(database, "pricing_history"), 
              where("pool_id", "==", poolID), 
              where("direction", "==", directions[directionIndex]), 
              orderBy("timestamp", "desc"),
              limit(100));
            
            const docSnap = await getDocs(q);

            setRateDatas(existingData => {
              return existingData.map((data, i) => {
                // Mapping a "3d" array to a 1d array
                if ((ammIndex * pools.length * directions.length) 
                  + (poolIndex * directions.length) 
                  + directionIndex === i) {
                  data = docSnap.docs.map(doc => ({
                    id: doc.id,
                    data: doc.data()
                  }));
                }
                return data;
              })
            })

            setRateDisplays(exisitingDisplays => {
              return exisitingDisplays.map((display, j) => {
                if ((ammIndex * pools.length * directions.length) 
                  + (poolIndex * directions.length) 
                  + directionIndex === j) {
                  
                  // Seperate Buy and Sell rates onto different axises
                  // Buy
                  if (directionIndex === 0) {
                    display = {
                      displayName: ammsDisplay[ammIndex] + " " + poolsDisplay[poolIndex] + " " + directionsDisplay[directionIndex],
                      yaxis: "y1"
                    }
                  }
                  // Sell
                  else {
                    display = {
                      displayName: ammsDisplay[ammIndex] + " " + poolsDisplay[poolIndex] + " " + directionsDisplay[directionIndex],
                      yaxis: "y2"
                    }
                  }
                }
                return display;
              });
            })
          }
          else {
            // Unchecked, delete data.
            setRateDatas(existingData => {
              return existingData.map((data, i) => {
                // Mapping a "3d" array to a 1d array
                if ((ammIndex * pools.length * directions.length) 
                  + (poolIndex * directions.length) 
                  + directionIndex === i) {
                  data = null;
                }
                return data;
              })
            })

            setRateDisplays(exisitingDisplays => {
              return exisitingDisplays.map((display, j) => {
                if ((ammIndex * pools.length * directions.length) 
                  + (poolIndex * directions.length) 
                  + directionIndex === j) {
                  display = null;
                }
                return display;
              });
            })
          }
        }
      }
    }
  }

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
   * Toggles the checkbox state of the pools filter.
   * @param {number} position the index of the checkbox of the pool filter. 
   */
  const handlePoolCheckboxOnChange = (position) => {
    const updatedPoolCheckedState = poolCheckedState.map((item, index) => {
      return (index === position ? !item : item);
    })
    setPoolCheckedState(updatedPoolCheckedState);
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

  React.useEffect(() => {
		//console.log(rateDisplays);
    // if (rateDisplays[0]) {
    //   console.log(rateDisplays[0].displayName);
    // }
    calculateProfitability(rateDatas[0], rateDatas[1], rateDatas[12], rateDatas[13], 0);
  }, [rateDatas])

  React.useEffect(() => {
    console.log(profitDatas);
  }, [profitDatas])

  const calculateProfitability = (poolABuy, poolASell, poolBBuy, poolBSell, transasctionFee) => {
    
    if (!poolABuy || !poolASell || !poolBBuy || !poolBSell) {
      return null;
    }
    
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

    console.log(poolARates);
    console.log(poolBRates);
    
    let estimatedProfits = [];
    let estimatedTimes = [];

    while (poolARates.buyTime.length > 0 && poolARates.sellTime.length > 0 && poolBRates.buyTime.length > 0 && poolBRates.sellTime.length > 0) {
      let newestTime = new Date(Math.max.apply(null, [poolARates.buyTime[0], poolARates.sellTime[0], poolBRates.buyTime[0], poolBRates.sellTime[0]]));
      let estimatedProfit = {
        aThenB: (poolARates.buyRate[0] * poolBRates.sellRate[0]) - 1,
        bThenA: (poolBRates.buyRate[0] * poolARates.sellRate[0]) - 1
      }
      // console.log("Estimated Profit", estimatedProfit, 
      // "Rates", { 
      //   "A then B": [poolARates.buyRate[0], poolBRates.sellRate[0]], 
      //   "B then A": [poolBRates.buyRate[0], poolARates.sellRate[0]]
      // });
      estimatedProfits.push(Math.max(estimatedProfit.aThenB, estimatedProfit.bThenA));
      estimatedTimes.push(newestTime);

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

    setProfitDatas({
      profit: estimatedProfits,
      time: estimatedTimes
    });
  }

  return (
    <div className="page-container">
      <h1>Metrics</h1>
      <div className="widget-container white-boxed col-centric">

          <div className="widget-container">
            <div className="amm-checkbox-container filter">
              <h3>AMMs</h3>
              {ammsDisplay.map((name, index) => {
                return (
                  <Checkbox
                    key={index}
                    label={name}
                    value={ammCheckedState[index]}
                    onChange={() => handleAMMCheckboxOnChange(index)}
                  />
                );
              })}
            </div>
            <div className="pool-checkbox-container filter">
              <h3>Pools</h3>
              {poolsDisplay.map((name, index) => {
                return (
                  <Checkbox
                    key={index}
                    label={name}
                    value={poolCheckedState[index]}
                    onChange={() => handlePoolCheckboxOnChange(index)}
                  />
                );
              })}
            </div>
            <div className="direction-checkbox-container filter">
              <h3>Direction</h3>
              {directionsDisplay.map((name, index) => {
                return (
                  <Checkbox
                    key={index}
                    label={name}
                    value={directionCheckedState[index]}
                    onChange={() => handleDirectionCheckboxOnChange(index)}
                  />
                );
              })}
            </div>

            <Button className="filter-apply-btn" variant="primary" onClick={fetchData}>Apply</Button>

          </div>

        <HistoryPlot
          data={
            rateDatas.map((data, index) => {
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
              }
            }
          }
        />

      </div>
    </div>
  )
}

export default Metrics

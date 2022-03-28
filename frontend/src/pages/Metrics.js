import React from "react";
import PriceHistoryPlot from "../components/dashboard/pricingHistoryPlot";
import Checkbox from "../components/checkbox";

import { collection, query, where, limit, orderBy, getDocs } from "firebase/firestore";
import database from "../firestore.config";

function Metrics() {  
  const pools = ["ORCA_SOL_USDC_BUY", "RAYDIUM_SOL_USDC_BUY"];
  const [poolDatas, setPoolDatas] = React.useState(new Array(pools.length).fill(null));
  const [checkedState, setCheckedState] = React.useState(new Array(pools.length).fill(false));

  /**
   * Fetches data and then updates poolDatas, which will automatically 
   * update the metrics graph when changed.
   * @param {string} pool_id id of the pool as listed in firestore
   * @param {number} index index of pool_id in the pools array
   */
  const fetchData = async(pool_id, index) => {
    const q = query(collection(database, "pricing_history"), where("pool_id", "==", pool_id), orderBy("timestamp", "desc"), limit(10));
    const docSnap = await getDocs(q);

    // Saves existing data and updates new data.
    setPoolDatas(existingData => {
      return existingData.map((poolItem, j) => {
        if (index === j) {
          poolItem = docSnap.docs.map(doc => ({
            id: doc.id,
            data: doc.data()
          }))
        }
        return poolItem;
      })
    })
  }

  /**
   * Fetches data if the checkbox in the corresponding position is true.
   * If the checkbox turns false, removes data from poolDatas.
   * @param {number} position the index of the checkbox. 
   */
  const handleCheckboxOnChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) => {
      if (index === position) {
        item = !item;

        // Checkbox checked
        if (item) {
          fetchData(pools[index], index);
        }
        // Checkbox unchecked, remove data
        else {
          setPoolDatas(existingData => {
            return existingData.map((poolItem, j) => {
              if (index === j) {
                poolItem = null;
              }
              return poolItem;
            })
          })
        }
      }
      return item;
    })
    setCheckedState(updatedCheckedState);
  }

  React.useEffect(() => {
    //console.log();
  }, [poolDatas])

  return (
    <div className="page-container">
      <h1>Metrics</h1>
      <div className="widget-container">

        <div className="checkboxes-container">
          {pools.map((name, index) => {
            return (
              <Checkbox
                key={index}
                label={name}
                value={checkedState[index]}
                onChange={() => handleCheckboxOnChange(index)}
              />
            );
          })}
        </div>
        
        <PriceHistoryPlot
          data={
            poolDatas.map((data, index) => {
              if (data) {
                const arrayData = {
                  type: "scatter",
                  mode: "lines+points",
                  name: pools[index],
                  x: data.map(ph => new Date(ph.data.timestamp.seconds * 1000)),
                  y: data.map(ph => ph.data.rate)
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
              width: 950, 
              height: 460, 
              title: "Sell Rates over time"
            }
          }
        />

      </div>
    </div>
  )
}

export default Metrics
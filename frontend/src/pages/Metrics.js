import React from "react";
import PriceHistoryPlot from "../components/dashboard/pricingHistoryPlot";
import Checkbox from "../components/checkbox";

import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";
import database from "../firestore.config";

function Metrics() {  
  // Checkbox
  const pools = ["ORCA_SOL_USDC_BUY", "RAYDIUM_SOL_USDC_BUY"];
  const [checkedState, setCheckedState] = React.useState(new Array(pools.length).fill(false));
  const handleCheckboxOnChange = (position) => {
    const updatedCheckedState = checkedState.map((item, index) =>
      index === position ? !item : item
    )
    console.log(updatedCheckedState);
    setCheckedState(updatedCheckedState);
  }

  const [poolDatas, setPoolDatas] = React.useState(new Array(pools.length).fill(null));
  React.useEffect(() => {
    const pricingRef = collection(database, "pricing_history");
    for (let i = 0; i < pools.length; ++i) {
      console.log(pools[i]);
      const q = query(pricingRef, where("pool_id", "==", pools[i]), orderBy("timestamp", "desc"), limit(10));
      onSnapshot(q, (querySnapshot) => {
        setPoolDatas(existingData => {
          return existingData.map((item, j) => {
            if (i === j) {
              console.log("ITEM UPDATING");
              console.log(item);
              item = querySnapshot.docs.map(doc => ({
                id: doc.id,
                data: doc.data()
              }))
              console.log(item);
            }
            return item;
          })
        })
      })
    }
  }, [setPoolDatas]);

  React.useEffect(() => {
    console.log(poolDatas);
  }, [poolDatas])

  return (
    <div className="metric">
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
						data={[
							{
								type: "scatter",
								mode: "lines+points",
								x: [0, 1, 2, 3, 4, 5],
								y: [0, 1, 2, 3, 4, 5]
							}
						]}
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
    </div>
  )
}

export default Metrics

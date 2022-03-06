import React from "react";
import PriceHistoryPlot from "../components/dashboard/pricingHistoryPlot";

function Metrics() {
  return (
    <div className="metric">
      <div className="page-container">
        <h1>Metrics</h1>

        <div className="widget-container">
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

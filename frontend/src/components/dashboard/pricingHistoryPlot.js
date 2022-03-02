import React, { useEffect } from "react";
import Plot from "react-plotly.js";

import { collection, query, where, onSnapshot, limit, orderBy } from "firebase/firestore";
import database from "../../firestore.config";

function PriceHistoryPlot(props) {
	const [pricingHistory, setPricingHistory] = React.useState([]);
  React.useEffect(() => {
		const pricingRef = collection(database, "pricing_history");
    const q = query(pricingRef, orderBy("timestamp", "desc"), limit(10));
    onSnapshot(q, (querySnapshot) => {
			const datas = querySnapshot.docs.map(doc => ({
				id: doc.id,
        data: doc.data()
      }));
      setPricingHistory(() => [...datas])
    })
  }, [setPricingHistory])

	React.useEffect(() => {
		console.log(pricingHistory);
	}, [pricingHistory])
	

	return (
		<Plot
			data={
				pricingHistory.map(ph => ({
					x: ph.data.timestamp,	
					y: ph.data.rate,
					type: 'scatter',
					mode: 'lines+markers',
					marker: {color: 'red'}
				}))
			}
			layout={ {width: 950, height: 460, title: props.title} }
		/>
	);
	
}

export default PriceHistoryPlot;

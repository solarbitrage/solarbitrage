import React from 'react';
import { AppContext } from "../App";

function Monitoring() {
    const { setShowFooter } = React.useContext(AppContext);
    React.useEffect(() => {
        setShowFooter(false);

        return () => {
            setShowFooter(true);
        }
    }, [setShowFooter])
    return (
        <div>
           <iframe src="https://triangulum.ryanhall.net/" style={{width: '100vw', height: 'calc(100vh - 56px)'}} title="Solarbitrage Monitoring"></iframe>
        </div>

    )
}

export default Monitoring
import React from "react";
import {OverlayTrigger, Tooltip} from "react-bootstrap";
export const BigNumber = ({number, digits}) => {
    return (
        <OverlayTrigger
            placement="top"
            trigger="hover"
            overlay={
            <Tooltip>
                {number}
            </Tooltip>
            }
        >
            <span>{number.toFixed(digits || 2)}</span>
        </OverlayTrigger>
    )
}
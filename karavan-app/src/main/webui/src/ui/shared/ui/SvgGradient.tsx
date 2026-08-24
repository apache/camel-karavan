import React from 'react';

export function SvgGradient() {
    return (
        <svg style={{width: 0, height: 0, position: 'absolute'}} aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id="sdxSvgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(0, 102, 204, 1)"/>
                    <stop offset="25%" stopColor="rgba(67, 148, 229, 1)"/>
                    {/* Add the rest of your gradient stops here */}
                    <stop offset="100%" stopColor="rgb(219, 91, 4)"/>
                </linearGradient>
            </defs>
        </svg>
    )
}
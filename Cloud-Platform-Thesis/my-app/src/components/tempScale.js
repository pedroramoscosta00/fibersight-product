import React from 'react'
import '../App.css';
import { useRef, useEffect, useState } from 'react';


function TempScale({ activeParameter }) {
    const showMoist = activeParameter === 'moisture';

    return (
        <div className="temp-scale">
            <div className={`bar-grad ${showMoist ? 'hidden' : ''}`} >
                <div className="bar-trace-main" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace-main" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace-main" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace-main" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace-main" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace-main" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace-main" />
            </div>
            <div className={`scale-values ${showMoist ? 'hidden' : ''}`} >
                <p>35°C</p>
                <p>30°C</p>
                <p>25°C</p>
                <p>20°C</p>
                <p>15°C</p>
                <p>10°C</p>
                <p>5°C</p>
            </div>
            <div className={`bar-grad2 ${showMoist ? 'visible' : 'hidden'}`} >
                <div className="bar-trace-main" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace-main" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace-main" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace-main" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace" />
                <div className="bar-trace-main" />
            </div>
            <div className={`scale-values2 ${showMoist ? 'visible' : 'hidden'}`} >
                <p>20%</p>
                <p>15%</p>
                <p>10%</p>
                <p>5%</p>
                <p>0%</p>
            </div>

        </div>
    )
}

export { TempScale };
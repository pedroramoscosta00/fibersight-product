import { useState, useEffect, useRef } from 'react';
import React from 'react';
import Plot from 'react-plotly.js';
//import Plotly from 'plotly.js-dist-min';


import calendarData from '../resources/calendarData.json'; // Adjust path as needed

const CalendarVisualization = ({ onDateClick, clickedDate }) => {
    const [isDarkMode, setIsDarkMode] = useState(
        document.documentElement.getAttribute('data-theme') === 'dark'
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            setIsDarkMode(currentTheme === 'dark');
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme'],
        });

        return () => observer.disconnect();
    }, []);

    const plotRef = useRef(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Prepare data points for each day
    const traces = Object.entries(calendarData.data).map(([dateStr, value]) => {
        const dateOnly = dateStr.split('T')[0]; // Extract YYYY-MM-DD
        const date = new Date(dateStr);
        const month = date.getMonth();
        const dayOfMonth = date.getDate();
        const weekday = date.getDay();
        const firstDay = new Date(date.getFullYear(), month, 1);
        const weekOfMonth = Math.floor((dayOfMonth + firstDay.getDay() - 1) / 7);

        //console.log("Generating trace:", { dateStr, dateOnly, value }); // Log values

        return {
            x: [month + (weekOfMonth / 6)],
            y: [weekday],
            mode: 'markers',
            marker: {
                size: 20,
                color: getColor(value),
                symbol: createRoundedSquarePath(),
                line: { width: 1, color: isDarkMode ? '#f8f8ff' : '#252525' }
            },
            hoverinfo: 'text',
            hovertext: `${dateOnly}:<br />Value ${value}`,
            customdata: [dateStr], // Store as array for Plotly compatibility
        };
    });

    const handleClick = (data) => {
        //console.log("Full click event data:", data);

        if (!data?.points?.[0]) return;

        const clickedDate = data.points[0].customdata;
        //console.log("Clicked Date (raw customdata):", clickedDate); // Log the raw customdata
        const dateObject = new Date(clickedDate);  // Convert it into a Date object
        //console.log("Date Object:", dateObject);  // Log the Date object

        const formattedDate = dateObject.toISOString().split('T')[0];
        //console.log("Formatted Clicked Date:", formattedDate);  // Log the formatted date
        //console.log("Clicked point data:", data.points[0]); // Full object
        //console.log("Extracted clickedDate:", clickedDate); // Should match dateStr

        if (onDateClick) {
            onDateClick(formattedDate);
        }
    };

    //console.log("Calendar Data:", calendarData); // Log the whole object

    return (
        <>
            <Plot
                ref={plotRef}
                data={traces}
                layout={{
                    font: {
                        color: isDarkMode ? '#f8f8ff' : '#252525',
                    },
                    autosize: true,
                    dragmode: false,
                    responsive: true,
                    margin: { l: 30, r: 0, t: 20, b: 0 },
                    xaxis: {
                        tickvals: [...Array(12).keys()],
                        ticktext: ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'],
                        tickfont: {
                            family: 'Inter',
                            size: '18',
                        },
                        range: [-0.5, 12],
                        domain: [0, 1], //Uses full width
                        showgrid: false,
                        zeroline: false,
                        side: 'top',
                    },
                    yaxis: {
                        tickvals: [0, 1, 2, 3, 4, 5, 6],
                        ticktext: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                        tickfont: {
                            family: 'Inter',
                            size: '14   ',
                        },
                        autorange: 'reversed',
                        showgrid: false,
                        range: [0.5, 6.5], // Decrease range to fit all squares
                        dtick: 1, // Ensures even spacing between each day
                        zeroline: false,
                    },
                    plot_bgcolor: 'rgba(0,0,0,0)',
                    showlegend: false,
                    padding: { t: 0, l: 0, b: 0, r: 0 },
                    hovermode: 'closest',
                    hoverlabel: {
                        font: { size: 12 },
                        bgcolor: "white",
                        bordercolor: isDarkMode ? '#f8f8ff' : '#252525',
                        namelength: 0,
                    },

                }}
                config={{
                    responsive: true,
                    displayModeBar: false,
                    doubleClick: 'reset', // Optional: control double-click behavior
                    scrollZoom: false, // Disables zoom via scroll

                }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
                onClick={handleClick} // Properly connect the click handler
            />
        </>
    );
};

// Color mapping function
function getColor(value) {
    const colors = {
        0: 'rgba(37, 37, 37, 1)', // Light gray (no activity)
        1: 'rgba(153, 202, 141, 1)', // Light green
        2: 'rgba(54, 247, 5, 1)', // Medium green
        3: 'rgba(254, 240, 119, 1)', // Darker green
        4: 'rgba(237, 106, 70, 1)', // Darkest green
    };
    return colors[value] || '#EBEDF0';
}

// SVG path generator for rounded squares
function createRoundedSquarePath(radiusPercent) {
    const radius = 3; // Convert percentage to pixels

    return `M ${radius},0
            L ${20 - radius},0
            Q ${20},0 ${20},${radius}
            L ${20},${20 - radius}
            Q ${20},${20} ${20 - radius},${20}
            L ${radius},${20}
            Q 0,${20} 0,${20 - radius}
            L 0,${radius}
            Q 0,0 ${radius},0
            Z`;
}

export { CalendarVisualization };
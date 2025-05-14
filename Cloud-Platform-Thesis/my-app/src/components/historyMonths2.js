import React from "react";
import Plot from "react-plotly.js";

// Function to generate calendar data
const generateCalendarData = () => {
    const year = 2025;
    
    let days = [];

    for (let month = 0; month < 12; month++) {
        let firstDay = new Date(year, month, 1);
        let lastDay = new Date(year, month + 1, 0);
        let startWeekday = firstDay.getDay();    // Get weekday (0 = Sunday, 6 = Saturday)

        //Add empty slots before the first day
        for (let i = 0; i < startWeekday; i++) {
            days.push({ month, week: -1, value: null }); //Empty space
        }

        //Add actual days of the month
        let weekIndex = 0;
        for (let day = 1; day <= lastDay.getDate(); day++) {
            let date = new Date(year, month, day);
            let weekday = date.getDay();    // 0 = Sunday, 6 = Saturday

            //Start a new week when monday arrives
            if (weekday === 0 && day !== 1) {
                weekIndex++;
            }

            days.push({
                date: date.toISOString().split("T")[0],
                month,
                week: weekIndex,
                weekday,
                value: Math.floor(Math.random() * 5),   // Fake data (0-4)
            });
        }
    }
    return days;
};

const colorscale = {
    0: 'rgba(37, 37, 37, 1)', // Light gray (no activity)
    1: 'rgba(153, 202, 141, 1)', // Light green
    2: 'rgba(54, 247, 5, 1)', // Medium green
    3: 'rgba(254, 240, 119, 1)', // Darker green
    4: 'rgba(237, 106, 70, 1)', // Darkest green
};

const HistoryMonths2 = () => {
    const data = generateCalendarData();

    const traces = data.map((day) => ({
        x: [day.month + day.week / 5],
        y: [day.weekday],
        mode: "markers",
        marker: {
            size: 20, // Square size
            color: colorscale[day.value], // Color based on value
            symbol: "square",
            line: { width: 1, color: "white" }, // Adds spacing between squares
        },
        hovertext: day.date || "", // Show date or empty space
        hoverinfo: "text",
    }));

    return (
        <div className="plot-container" style={{ width: "100%", height: '100%' }}>
            <Plot
                data={traces}
                layout={{
                    title: "",
                    autosize: true,
                    responsive: true,
                    margin: { l: 30, r: 0, t: 20, b: 0 }, // Adjust margins
                    xaxis: {
                        tickvals: [...Array(12).keys()], // 0-11 for each month
                        ticktext: [
                            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
                        ],
                        showgrid: false,
                        domain: [0, 1], //Uses full width
                        range: [-0.5, 12], //Ensures full months fit
                        zeroline: false,
                        side: 'top',
                    },
                    yaxis: {
                        showgrid: false,
                        tickmode: "array",
                        tickvals: [1, 2, 3, 4, 5, 6, 0],
                        ticktext: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                        autorange: 'reversed',
                        range: [0.5, 6.5], // Decrease range to fit all squares
                        dtick: 1, // Ensures even spacing between each day
                        zeroline: false,
                    },
                    plot_bgcolor: 'none',
                    showlegend: false,
                    padding: { t: 0, l: 0, b: 0, r: 0 }
                }}
                config={{ responsive: true }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
};

export { HistoryMonths2 };

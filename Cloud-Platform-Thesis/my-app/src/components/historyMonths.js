import Plot from 'react-plotly.js';


function HistoryMonths() {
    const dataJan = [
        {
            z: [
                [null, 2, 3, 5, 2],
                [null, 2, 1, 5, 3],
                [2, 2, 3, 5, 3],
                [2, 4, 2, 4, 3],
                [2, 4, 2, 3, 2],
                [3, 4, 2, 2, null],
                [2, 3, 1, 4, null],
            ],
            x: [
                'W1',
                'W2',
                'W3',
                'W4',
                'W5',
            ],
            y: [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
            ],
            type: 'heatmap',
            colorscale: [
                [0.00, 'rgba(0, 0, 0, 0)'],       // Null (transparent)
                [0.20, 'rgba(153, 202, 141, 1)'], // 1
                [0.40, 'rgba(54, 247, 5, 1)'],    // 2
                [0.60, 'rgba(254, 240, 119, 1)'], // 3 (Yellow)
                [0.80, 'rgba(237, 106, 70, 1)'],  // 4
                [1.00, 'rgba(37, 37, 37, 1)']     // 5
            ],
            colorbar: {
                tickvals: [1, 2, 3, 4, 5], // Ensures exact values
                ticktext: ['1', '2', '3', '4', '5']
            },
            zmin: 0,
            zmax: 5,
            showscale: false,
            xgap: 2,
            ygap: 2,
        }
    ]
    const layoutJan = {
        yaxis: {
            autorange: 'reversed',
            scaleanchor: 'x',
            constrain: 'domain',
            visible: false,
            automargin: true,
        },
        xaxis: {
            constrain: 'domain',
            visible: false,
            automargin: true,
        },
        autosize: true,
        plot_bgcolor: 'rgba(248, 248, 255, 1)',
        margin: {
            l: 0,
            r: 0,
            t: 0,
            b: 0,
            pad: 0,
        },
        width: 150,
        height: 200,
    }

    return (
        <Plot
            data={dataJan}
            layout={layoutJan}
            config={{ staticPlot: true }}
            className='plotJan'
        />
    )
}

export { HistoryMonths }
import { useMemo } from 'react';
import Plot from 'react-plotly.js';
import calendarData from '../resources/calendarData.json';

function getCurrentTheme() {
    return localStorage.getItem('theme') || 'light';
}

function isDarkMode() {
    return getCurrentTheme() === 'dark';
}

function getLabelColors() {
    return isDarkMode() ? {
        textColor: '#F8F8FF',
        bgColor: '#1E1E1E',
        gridColor: '#444',
    } : {
        textColor: '#252525',
        bgColor: '#FFFFFF',
        gridColor: '#EEE',
    };
}

function getColor(value) {
    const colors = {
        0: 'rgba(37, 37, 37, 1)',
        1: 'rgba(153, 202, 141, 1)',
        2: 'rgba(54, 247, 5, 1)',
        3: 'rgba(254, 240, 119, 1)',
        4: 'rgba(237, 106, 70, 1)',
    };
    return colors[value] || '#EBEDF0';
}

function createRoundedSquarePath() {
    const radius = 3;
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

const CalendarVisualization = ({ onDateClick }) => {
    const colors = getLabelColors();

    const layout = useMemo(() => {
        return {
            font: {
                color: '#252525',
            },
            autosize: true,
            dragmode: false,
            responsive: true,
            margin: { l: 30, r: 0, t: 20, b: 0 },
            xaxis: {
                tickvals: [...Array(12).keys()],
                ticktext: [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ],
                tickfont: {
                    family: 'Inter',
                    size: '18',
                    color: colors.textColor,
                },
                range: [-0.5, 12],
                domain: [0, 1],
                showgrid: false,
                zeroline: false,
                side: 'top',
            },
            yaxis: {
                tickvals: [0, 1, 2, 3, 4, 5, 6],
                ticktext: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                tickfont: {
                    family: 'Inter',
                    size: '14',
                    color: colors.textColor,
                },
                autorange: 'reversed',
                showgrid: false,
                range: [0.5, 6.5],
                dtick: 1,
                zeroline: false,
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: false,
            padding: { t: 0, l: 0, b: 0, r: 0 },
            hovermode: 'closest',
            hoverlabel: {
                font: { size: 12, color: '#252525' },
                bgcolor: "white",
                bordercolor: isDarkMode() ? '#f8f8ff' : '#252525',
                namelength: 0,
            },
        };
    }, [colors.textColor]);

    const traces = Object.entries(calendarData.data).map(([dateStr, value]) => {
        const dateOnly = dateStr.split('T')[0];
        const date = new Date(dateStr);
        const month = date.getMonth();
        const dayOfMonth = date.getDate();
        const weekday = date.getDay();
        const firstDay = new Date(date.getFullYear(), month, 1);
        const weekOfMonth = Math.floor((dayOfMonth + firstDay.getDay() - 1) / 7);
        const monthAbbr = date.toLocaleString('en-US', { month: 'short' });
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        const formatted = `${day}-${monthAbbr}-${year}`;

        return {
            x: [month + (weekOfMonth / 6)],
            y: [weekday],
            mode: 'markers',
            marker: {
                size: 20,
                color: getColor(value),
                symbol: createRoundedSquarePath(),
                line: { width: 1, color: isDarkMode() ? '#f8f8ff' : '#252525' }
            },
            hoverinfo: 'text',
            //hovertext: `${formatted}:<br />Value ${value}`,
            hovertext: `${formatted}`,
            customdata: [dateStr],
        };
    });

    const handleClick = (data) => {
        if (!data?.points?.[0]) return;
        const clickedDate = data.points[0].customdata;
        const dateObject = new Date(clickedDate);
        const formattedDate = dateObject.toISOString().split('T')[0];

        if (onDateClick) {
            onDateClick(formattedDate);
        }
    };

    return (
        <Plot
            data={traces}
            layout={layout}
            config={{
                responsive: true,
                displayModeBar: false,
                doubleClick: 'reset',
                scrollZoom: false,
            }}
            useResizeHandler={true}
            style={{ width: "100%", height: "100%" }}
            onClick={handleClick}
        />
    );
};

export { CalendarVisualization };
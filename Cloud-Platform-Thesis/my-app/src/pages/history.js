import { useState, useEffect } from 'react';
import { CalendarVisualization } from '../components/calendarVisualization';
import Plot from 'react-plotly.js';

//MUI
import DeviceThermostatRoundedIcon from '@mui/icons-material/DeviceThermostatRounded';
import WaterDropRoundedIcon from '@mui/icons-material/WaterDropRounded';

import { TagFiber } from '../components/tagFiber';

function History() {
    const [selectedDate, setSelectedDate] = useState(null);
    const [geoData, setGeoData] = useState(null);
    const [matchedData, setMatchedData] = useState(null);
    const [dailyAverages, setDailyAverages] = useState(null);
    const [averagedData, setAveragedData] = useState({
        timestamps: [],
        temperatures: [],
        moistures: [],
    });
    const [weatherInfo, setWeatherInfo] = useState(null);
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

    //Fiber Toggles
    const fiberNames = ["fiber1", "fiber2", "fiber3"];
    const [activeFibers, setActiveFibers] = useState(new Set(fiberNames));
    const [fiberGeoData, setFiberGeoData] = useState({});
    const noFibersSelected = activeFibers.size === 0;

    //Weather API
    const fetchWeather = async (date) => {
        const unixTime = Math.floor(new Date(date).getTime() / 1000);
        const lat = 37.933560;
        const lon = -7.796754;
        const apiKey = "0e490f626d07e91317f3f423ba4d72a0";

        const url = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${unixTime}&units=metric&appid=${apiKey}`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            if (data && data.data && data.data.length > 0) {
                const first = data.data[0];
                setWeatherInfo({
                    avgTemp: Math.round(first.temp),
                    icon: first.weather[0].icon,
                    description: first.weather[0].description,
                });
            } else {
                setWeatherInfo(null);
            }

        } catch (error) {
            console.error("Failed to fetch weather:", error);
            setWeatherInfo(null);
        }
    };

    console.log("🌤️ Weather info:", weatherInfo);

    useEffect(() => {
        const loadAllFibers = async () => {
            const newFiberData = {};
            for (const fiber of fiberNames) {
                const res = await fetch(`/fibers/${fiber}.geojson`);
                const data = await res.json();
                newFiberData[fiber] = data;
            }
            setFiberGeoData(newFiberData);
        };

        loadAllFibers();
    }, []);

    const handleFiberToggle = (fiberId, isActive) => {
        const fiberName = fiberNames[fiberId - 1]; // Map numeric id back to "fiber1", "fiber2", etc.
        const updated = new Set(activeFibers);

        if (isActive) {
            updated.add(fiberName);
        } else {
            updated.delete(fiberName);
        }
        setActiveFibers(updated);

        // if a date is selected, reprocess the data!
        if (selectedDate) {
            processDate(selectedDate, updated);
        }

    };

    const processDate = (clickedDate, activeSet = activeFibers) => {
        const clickedDateOnly = new Date(clickedDate).toISOString().split('T')[0];
        let allMatchingData = [];

        for (const fiber of activeSet) {
            const data = fiberGeoData[fiber];
            if (!data || !data.features) continue;

            let fiberEntryCount = 0;
            let fiberTempSum = 0;
            let fiberMoistSum = 0;

            data.features.forEach(feature => {
                const entries = feature.properties?.timeSeries?.filter(entry => {
                    const entryDateOnly = new Date(entry.timestamp).toISOString().split('T')[0];
                    return entryDateOnly === clickedDateOnly;
                }) ?? [];

                if (entries.length > 0) {
                    fiberEntryCount += entries.length;
                    fiberTempSum += entries.reduce((sum, e) => sum + (e.temperature ?? 0), 0);
                    fiberMoistSum += entries.reduce((sum, e) => sum + (e.moisture ?? 0), 0);
                    allMatchingData.push(...entries);
                }
            });
            // ✅ Log only once per fiber
            if (fiberEntryCount > 0) {
                console.log(`📡 ${fiber}: ${fiberEntryCount} entries, Avg Temp: ${(fiberTempSum / fiberEntryCount).toFixed(2)}°C, Avg Moist: ${(fiberMoistSum / fiberEntryCount).toFixed(2)}%`);
            }
        }

        if (allMatchingData.length > 0) {
            const total = allMatchingData.reduce((acc, curr) => ({
                temp: acc.temp + (curr.temperature ?? 0),
                moist: acc.moist + (curr.moisture ?? 0),
            }), { temp: 0, moist: 0 });

            setDailyAverages({
                temperature: Math.round(total.temp / allMatchingData.length), // Rounds to nearest integer
                moisture: Math.round(total.moist / allMatchingData.length),   // Rounds to nearest integer
            });

            setMatchedData(allMatchingData);
            calculateAverages(allMatchingData);
        } else {
            setDailyAverages(null);
            setMatchedData(null);
            setAveragedData({ timestamps: [], temperatures: [], moistures: [] });
        }


    };

    const handleDateClick = (clickedDate) => {
        setSelectedDate(clickedDate);
        processDate(clickedDate, activeFibers);
        fetchWeather(clickedDate); // Fetch weather when a date is clicked
    }

    const searchGeoJSON = (clickedTimestamp) => {
        if (!geoData || !geoData.features) {
            console.error("GeoJSON data is missing or not structured correctly.");
            return;
        }

        const clickedDateOnly = new Date(clickedTimestamp).toISOString().split('T')[0];
        let matchingData = [];

        geoData.features.forEach(feature => {
            if (!feature.properties || !feature.properties.timeSeries) return;

            const entries = feature.properties.timeSeries.filter(entry => {
                const entryDateOnly = new Date(entry.timestamp).toISOString().split('T')[0];
                return entryDateOnly === clickedDateOnly;
            });

            if (entries.length > 0) {
                matchingData.push(...entries);
            }
        });

        if (matchingData.length > 0) {
            const total = matchingData.reduce((acc, curr) => {
                return {
                    temp: acc.temp + (curr.temperature ?? 0),
                    moist: acc.moist + (curr.moisture ?? 0),
                };
            }, { temp: 0, moist: 0 });

            const averages = {
                temperature: (total.temp / matchingData.length).toFixed(2),
                moisture: (total.moist / matchingData.length).toFixed(2),
            };

            setDailyAverages(averages);
            setMatchedData(matchingData);
            calculateAverages(matchingData);  // Calculate the averages for the entire day
        } else {
            setMatchedData(null);
            setDailyAverages(null);
        }
    };

    const calculateAverages = (matchingData) => {
        const timestampMap = {};

        matchingData.forEach((entry) => {
            const timestamp = entry.timestamp;
            const temperature = entry.temperature;
            const moisture = entry.moisture;

            if (!timestampMap[timestamp]) {
                timestampMap[timestamp] = { temperatures: [], moistures: [] };
            }

            timestampMap[timestamp].temperatures.push(temperature);
            timestampMap[timestamp].moistures.push(moisture);
        });

        const timestamps = [];
        const temperatures = [];
        const moistures = [];

        Object.keys(timestampMap).forEach((timestamp) => {
            const temps = timestampMap[timestamp].temperatures;
            const moists = timestampMap[timestamp].moistures;

            const avgTemp = temps.reduce((sum, t) => sum + t, 0) / temps.length;
            const avgMoist = moists.reduce((sum, m) => sum + m, 0) / moists.length;

            const formattedTimestamp = new Date(timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            });

            timestamps.push(formattedTimestamp);
            temperatures.push(avgTemp);
            moistures.push(avgMoist);
        });

        setAveragedData({ timestamps, temperatures, moistures });
    };

    const layout1 = {
        title: 'Average Temperature',
        xaxis: {
            title: 'Timestamp',
            tickangle: 0,
            tickvals: averagedData.timestamps,
            automargin: true,
            gridcolor: isDarkMode ? '#f8f8ff' : '#252525',
        },
        yaxis: {
            autorange: false,
            range: [Math.min(...averagedData.temperatures) - 0.01, Math.max(...averagedData.temperatures) + 0.01],
            title: 'Average Temperature (°C)',
            gridcolor: isDarkMode ? '#f8f8ff' : '#252525',
        },
        autosize: true,
        margin: {
            l: 50,
            r: 0,
            b: 50,
            t: 10,
            pad: 0
        },
        paper_bgcolor: isDarkMode ? '#4A4A4A' : '#FFFFFF',
        plot_bgcolor: isDarkMode ? '#4A4A4A' : '#FFFFFF',
        font: {
            color: isDarkMode ? '#f8f8ff' : '#252525',
        },
    }
    const layout2 = {
        title: 'Average Temperature',
        xaxis: {

            title: 'Timestamp',
            tickangle: 0,
            tickvals: averagedData.timestamps,
            automargin: true,
            gridcolor: isDarkMode ? '#f8f8ff' : '#252525',
        },
        yaxis: {
            autorange: false,
            range: [Math.min(...averagedData.moistures) - 0.01, Math.max(...averagedData.moistures) + 0.01],
            title: 'Average Temperature (°C)',
            gridcolor: isDarkMode ? '#f8f8ff' : '#252525',
        },
        autosize: true,
        margin: {
            l: 50,
            r: 0,
            b: 50,
            t: 10,
            pad: 0
        },
        paper_bgcolor: isDarkMode ? '#4A4A4A' : '#FFFFFF',
        plot_bgcolor: isDarkMode ? '#4A4A4A' : '#FFFFFF',
        font: {
            color: isDarkMode ? '#f8f8ff' : '#252525',
        },
    }

    return (
        <>
            <div className='history-parent'>
                <div className='history-head'>
                    <div className='history-head-legend'>
                        <div className='history-head-child'>
                            <span className='square1' />
                            <span>
                                <p className='p1'>Data Available</p>
                                <p className='p2'>No Alerts</p>
                            </span>
                        </div>
                        <div className='history-head-child'>
                            <span className='square2' />
                            <span>
                                <p className='p1'>Data Available</p>
                                <p className='p2'>Information</p>
                            </span>
                        </div>
                        <div className='history-head-child'>
                            <span className='square3' />
                            <span>
                                <p className='p1'>Data Available</p>
                                <p className='p2'>Warning</p>
                            </span>
                        </div>
                        <div className='history-head-child'>
                            <span className='square4' />
                            <span>
                                <p className='p1'>Data Available</p>
                                <p className='p2'>Urgent</p>
                            </span>
                        </div>
                        <div className='history-head-child'>
                            <span className='square5' />
                            <span>
                                <p className='p1'>No data aquired</p>
                            </span>
                        </div>
                    </div>
                    <div className='hist-fiber-toggles-parent'>
                        <div className='hist-fiber-toggles'>
                            {fiberNames.map((fiber, index) => (
                                <TagFiber
                                    key={fiber}
                                    fiberId={index + 1}
                                    label={`Fiber ${index + 1}`}

                                    defaultActive={true}
                                    onToggle={handleFiberToggle}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <div className='history-body'>
                    <CalendarVisualization
                        style={{ cursor: 'pointer' }}
                        onDateClick={(date) => {
                            //console.log("Parent received date:", date);
                            handleDateClick(date);
                        }}
                    />
                </div>
                {selectedDate && (
                    <div className='history-info'>
                        <div className="rule-date">
                            <div className="rule rule-left" />
                            <h2>Data for {selectedDate}</h2>
                            <div className="rule rule-right" />
                        </div>
                        {activeFibers.size === 0 ? (
                            <p style={{ padding: '1rem', fontWeight: 'bold' }}>
                                No fiber selected. Please choose one to display the information.
                            </p>
                        ) : dailyAverages && (
                            <>
                                <div className='avg-graphs-parent'>
                                    <div className='avg-graphs'>
                                        <div className='avg-graphs-title'>
                                            <h2>Daily Averages</h2>
                                        </div>
                                        <div className='avg-list'>
                                            <div className='avg-card'>
                                                Alerts
                                            </div>
                                            <div className='avg-card'>
                                                <DeviceThermostatRoundedIcon sx={{ fontSize: 50 }} />
                                                {dailyAverages.temperature}°C
                                            </div>
                                            <div className='avg-card'>
                                                <WaterDropRoundedIcon sx={{ fontSize: 50 }} />
                                                {dailyAverages.moisture}%
                                            </div>
                                            <div className='avg-card'>
                                                {weatherInfo ? (
                                                    <>
                                                        <img
                                                            src={`https://openweathermap.org/img/wn/${weatherInfo.icon.replace('n', 'd')}@2x.png`}
                                                            alt={weatherInfo.description}
                                                            style={{ width: 50, height: 50 }}
                                                        />
                                                        <div>{weatherInfo.avgTemp}°C</div>
                                                    </>
                                                ) : (
                                                    <p style={{ fontSize: '0.8rem', color: '#888' }}>No weather data</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className='hist-graphs-parent'>
                                        <div className='hist-graphs-temp'>
                                            <div className='hist-graphs-title'>
                                                <h2>Temperature</h2>
                                            </div>
                                            <Plot
                                                data={[
                                                    {
                                                        type: 'scatter',
                                                        mode: 'lines+markers',
                                                        x: averagedData.timestamps,
                                                        y: averagedData.temperatures,
                                                        marker: { color: '#ED6A46' },
                                                        line: { color: '#ED6A46' },
                                                        fill: 'tozeroy',
                                                        fillcolor: 'rgba(254, 240, 119, 0.5)',
                                                    },
                                                ]}
                                                layout={layout1}
                                            />
                                        </div>
                                        <div className='hist-graphs-moist'>
                                            <div className='hist-graphs-title'>
                                                <h2>Moisture</h2>
                                            </div>
                                            <Plot
                                                data={[
                                                    {
                                                        type: 'scatter',
                                                        mode: 'lines+markers',
                                                        x: averagedData.timestamps,
                                                        y: averagedData.moistures,
                                                        marker: { color: '#42509E' },
                                                        line: { color: '#42509E' },
                                                        fill: 'tozeroy',
                                                        fillcolor: 'rgba(167, 219, 243, 0.5)',
                                                    },
                                                ]}
                                                layout={layout2}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {/*matchedData ? (
                            <pre>{JSON.stringify(matchedData, null, 2)}</pre>
                        ) : (
                            <p>No data found for this date.</p>
                        )*/}
                    </div>
                )}
            </div>
        </>
    )
}

export { History };
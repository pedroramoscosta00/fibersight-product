import { useState, useEffect } from "react";
import MinimizeRoundedIcon from '@mui/icons-material/MinimizeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';


const WeatherWidget = () => {
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState(null);
    const [error, setError] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [hoverTimeout, setHoverTimeout] = useState(null);
    const [ShowLoadingBar, setShowLoadingBar] = useState(false);
    const [minimize, setMinimize] = useState(false);

    const key = "0e490f626d07e91317f3f423ba4d72a0";
    const city = "Beja";

    // Current weather fetch - modified to include more data
    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${key}`
                );
                const data = await response.json();
                if (data.cod !== 200) throw new Error(data.message);
                setWeather(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchWeather();
    }, []);

    // Forecast fetch - modified to include precipitation data
    useEffect(() => {
        const fetchForecast = async () => {
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${key}`
                );
                const data = await response.json();
                if (data.cod !== "200") throw new Error(data.message);
                if (data && Array.isArray(data.list)) setForecast(data);
                else throw new Error("Invalid forecast data");
            } catch (error) {
                setError(error.message);
            }
        };
        fetchForecast();
    }, []);

    const getForecastItems = () => {
        if (!forecast?.list) return [];

        const now = new Date();
        const nowTime = now.getTime();

        // Find forecasts closest to 1h, 4h, and 7h from now
        return [3, 6, 9].map(offset => {
            const targetTime = nowTime + (offset * 60 * 60 * 1000);
            return forecast.list.reduce((closest, item) => {
                const itemTime = item.dt * 1000;
                const closestDiff = Math.abs(closest.dt * 1000 - targetTime);
                const currentDiff = Math.abs(itemTime - targetTime);
                return currentDiff < closestDiff ? item : closest;
            });
        });
    };

    const getWindDirection = (degrees) => {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round((degrees % 360) / 45);
        return directions[index % 8];
    }

    const getRainVolume = (rain) => {
        if (!rain) return '0mm';
        if (rain['1h']) return `${rain['1h']}mm`;
        if (rain['3h']) return `${(rain['3h'] / 3).toFixed(1)}mm`;
    }

    const handleMouseEnter = () => {
        //Start the animation 
        setShowLoadingBar(true);

        const timeout = setTimeout(() => {
            setShowDetails(true);
            setShowLoadingBar(false);
        }, 2000);
        setHoverTimeout(timeout);
    };

    const handleMouseLeave = () => {
        clearTimeout(hoverTimeout);
        setShowDetails(false);
        setShowLoadingBar(false);
    };

    // Calculate rain probability
    const getRainProbability = () => {
        if (!forecast?.list) return '0%';

        //Check next 12 hours for rain
        const now = new Date();
        const next12Hours = forecast.list.filter(item =>
            (item.dt * 1000 - now.getTime()) <= 12 * 60 * 60 * 1000
        );

        //Count how many periods have rain
        const rainyPeriods = next12Hours.filter(item =>
            item.rain || item.weather[0].main.toLowerCase().includes('rain')
        ).length;

        return `${Math.round((rainyPeriods / next12Hours.length) * 100)}%`;
    }



    if (error) return <div className="weather-widget">Error: {error}</div>;
    if (!weather) return <div className="weather-widget">Loading...</div>;

    const forecastItems = getForecastItems();

    return (
        <>
            <div
                className={`weather-widget ${minimize ? 'hidden' : ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {/* Main weather display */}
                <div className={`weather-main ${showDetails ? 'hidden' : ''}`}>
                    <div className="weather-top">
                        <div className="weather-current">
                            <img
                                src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}.png`}
                                alt={weather.weather[0].description}
                            />
                            <p>{Math.round(weather.main.temp)}°C</p>
                        </div>
                        <div className="weather-minimize">
                            <MinimizeRoundedIcon
                                className='minimize-icon'
                                onClick={() => setMinimize(!minimize)}
                            />
                        </div>
                    </div>
                    {forecastItems.length > 0 && (
                        <div className="weather-forecast">
                            {forecastItems.map((item, index) => (

                                {/*Used index to not repeat the item key*/ },
                                < div key={`${item.dt}-${index}`} className="forecast-item">
                                    <p className="p-forecast">{new Date(item.dt * 1000).getHours()}:00</p>
                                    <img
                                        src={`http://openweathermap.org/img/wn/${item.weather[0].icon}.png`}
                                        alt={item.weather[0].description}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Detailed information */}
                <div className={`more-info ${showDetails ? 'visible' : 'hidden'}`}>
                    <div className="info-lines">
                        <span>Average Wind</span>
                        <span>
                            {getWindDirection(weather.wind.deg)} <br />
                            {Math.round(weather.wind.speed * 3.6)}km/h
                        </span>
                    </div>
                    <div className="info-lines">
                        <span>Air Humidity</span>
                        <span>
                            {weather.main.humidity}%
                        </span>
                    </div>
                    <div className="info-lines">
                        <span>Rain Probability</span>
                        <span>{getRainProbability()}</span>
                    </div>
                    <div className="info-lines">
                        <span>Rain Amount</span>
                        <span>{getRainVolume(weather.rain)}</span>
                    </div>
                </div>
                <div className="loading-bar-container">
                    <div className={`weather-loading ${ShowLoadingBar ? 'visible' : ''}`} />
                </div>
            </div >
            <div className={`weather-widget-minimized ${minimize ? 'visible' : 'hidden'}`}>
                <AddRoundedIcon
                    className='maximize-icon'
                    onClick={() => setMinimize(!minimize)}
                />
            </div>
        </>
    );
};

export { WeatherWidget };
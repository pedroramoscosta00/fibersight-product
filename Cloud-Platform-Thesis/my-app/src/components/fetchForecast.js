function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;  // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
  
  export async function fetchForecast({ thresholdHigh, thresholdLowTemp, thresholdLowHumidity, thresholdHighHumidity, weatherAlerts = [] }) {
    const lat = '37.93368938103214';
    const lon = '-7.7964679692230865';
    const key = '0e490f626d07e91317f3f423ba4d72a0';
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${key}`;
  
    try {
      const response = await fetch(url);
      const data = await response.json();
  
      if (!data.list || !Array.isArray(data.list)) return [];
  
      const upcomingPeriods = data.list?.slice(0, 2);
      const now = new Date().toISOString();
      const alerts = [];
  
      // [Your same rain/high temp/low temp/humidity logic here...]
      // I can paste it for you fully if you want.
  
      // Example:
      const rainExpected = upcomingPeriods.some(period =>
        period.weather.some(w => w.main.toLowerCase().includes('rain'))
      );
  
      if (rainExpected) {
        const message = 'Rain expected in the next few hours. Prepare accordingly.';
        const alertId = `rain-alert-${simpleHash(message)}`;
  
        alerts.push({
          id: alertId,
          type: 'info weather',
          message,
          timestamp: now,
          fiberid: '1, 2, 3',
        });
      }
  
      // [continue here with high temp, low temp, snow, humidity checks, etc.]
  
      return alerts;
    } catch (error) {
      console.error('[fetchForecast] Error fetching forecast:', error);
      return [];
    }
  }
  
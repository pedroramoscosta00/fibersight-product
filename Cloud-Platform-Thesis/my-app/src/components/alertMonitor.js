// components/AlertMonitor.js
import { useEffect } from 'react';
import { useMuiAlert } from './muiAlertProvider';
import cosmic from './cosmic';

export function AlertMonitor({ thresholds }) {
  const { showAlert } = useMuiAlert();

  useEffect(() => {
    const checkAlerts = async () => {
      try {
        // 1. Check Cosmic for new alerts
        const cosmicAlerts = await cosmic.objects
          .find({ type: 'alerts' })
          .props(['metadata'])
          .limit(5)
          .sort('-created_at');

        cosmicAlerts.objects.forEach(obj => {
          showAlert(obj.metadata.message, 'info', {
            id: obj.id,
            title: obj.metadata.title,
            timestamp: obj.created_at
          });
        });

        // 2. Check weather API (example)
        const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=37.93&lon=-7.79&units=metric&appid=0e490f626d07e91317f3f423ba4d72a0`);
        const weatherData = await weatherResponse.json();

        if (weatherData.main.temp > thresholds.high) {
          showAlert(`High temperature: ${weatherData.main.temp}°C`, 'warning', {
            title: 'Temperature Alert'
          });
        }
      } catch (error) {
        console.error('Alert monitoring error:', error);
      }
    };

    // Run immediately
    checkAlerts();

    // Then run every 5 minutes
    const interval = setInterval(checkAlerts, 300000);
    return () => clearInterval(interval);
  }, [thresholds, showAlert]);

  return null;
}
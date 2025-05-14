import { useEffect, useState, useRef } from 'react';
import { TagFiber } from '../components/tagFiber';
import cosmic from '../components/cosmic';
import { useMuiAlert } from '../components/muiAlertProvider';

// Alert Icons
import InfoM from '../resources/alert_icons/info_m.svg';
import InfoT from '../resources/alert_icons/info_t.svg';
import InfoW from '../resources/alert_icons/info_w.svg';
import WarningM from '../resources/alert_icons/warning_m.svg';
import WarningT from '../resources/alert_icons/warning_t.svg';
import WarningW from '../resources/alert_icons/warning_w.svg';
import UrgentM from '../resources/alert_icons/urgent_m.svg';
import UrgentT from '../resources/alert_icons/urgent_t.svg';
import UrgentW from '../resources/alert_icons/urgent_w.svg';

import InfoMDark from '../resources/alert_icons/info_m_dark.svg';
import InfoTDark from '../resources/alert_icons/info_t_dark.svg';
import InfoWDark from '../resources/alert_icons/info_w_dark.svg';
import WarningMDark from '../resources/alert_icons/warning_m_dark.svg';
import WarningTDark from '../resources/alert_icons/warning_t_dark.svg';
import WarningWDark from '../resources/alert_icons/warning_w_dark.svg';
import UrgentMDark from '../resources/alert_icons/urgent_m_dark.svg';
import UrgentTDark from '../resources/alert_icons/urgent_t_dark.svg';
import UrgentWDark from '../resources/alert_icons/urgent_w_dark.svg';

//MUI
import NavigateNextRoundedIcon from '@mui/icons-material/NavigateNextRounded';
import NavigateBeforeRoundedIcon from '@mui/icons-material/NavigateBeforeRounded';

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;  //Convert to 32bit integer
  }
  return Math.abs(hash);
}

function Alerts({
  isDarkMode,
  thresholdHigh, thresholdLowTemp = 2,
  thresholdLowHumidity = 20, thresholdHighHumidity = 50,
  onNewAlert
}) {
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const { showAlert } = useMuiAlert();

  //Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const alertsPerPage = 13;

  const handleNewAlert = (alert) => {
    onNewAlert({
      ...alert,
      timestamp: alert.timestamp || new Date().toISOString
    });
  }

  const fetchForecast = async () => {
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

      //Rain alerts
      const rainExpected = upcomingPeriods.some(period =>
        period.weather.some(w => w.main.toLowerCase().includes('rain'))
      );

      if (rainExpected) {
        const message = 'Rain expected in the next few hours. Prepare accordingly.';
        const alertId = `rain-alert-${simpleHash(message)}`;

        alerts.push({
          //id: 'custom-rain-alert',
          id: alertId,
          type: 'info weather',
          message,
          timestamp: now,
          fiberid: '1, 2, 3',
        });

        // Show as popup only if this is a new alert
        if (!weatherAlerts.some(a => a.id === alertId)) {
          showAlert(message, 'info', {
            id: alertId,
            title: 'Weather Alert',
            duration: 3000
          });

          /*handleNewAlert({
            id: alertId,
            message,
            type: 'info weather',
            title: 'Rain Alert',
            duration: 5000
          });*/
        };
      }

      //High Temperature Alerts
      for (const period of upcomingPeriods) {
        const temperature = period.main.temp;

        if (temperature >= thresholdHigh) {
          const tempTime = new Date(period.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const now = new Date().toISOString();
          const message = `High temperature of ${temperature.toFixed(1)}°C predicted around ${tempTime}.`;
          const alertId = `forecast-temp-${simpleHash(message)}`;

          alerts.push({
            id: alertId,
            type: 'warning weather',
            message,
            timestamp: now,
            fiberid: '1, 2, 3',
          });

          if (!weatherAlerts.some(a => a.id === alertId)) {
            showAlert(message, 'warning', {
              id: alertId,
              title: 'Weather Alert',
              autoHide: true
            });

            /*handleNewAlert({
              id: alertId,
              message,
              type: 'warning weather',
              title: 'High Temperature Alert',
              duration: 5000
            });*/
          }
        } else {
          console.log(`[Alert Check] No high temp alert (value: ${temperature}°C)`);
        }

        //Low Temperature Alert
        if (temperature <= thresholdLowTemp) {
          const tempTime = new Date(period.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const message = `Low temperature of ${temperature.toFixed(1)}°C predicted. Frost may occur around ${tempTime}.`;
          const alertId = `low-temp-alert-${simpleHash(message)}`;

          alerts.push({
            id: alertId,
            type: 'warning weather',
            message,
            timestamp: now,
            fiberid: '1, 2, 3',
          });

          handleNewAlert({
            id: alertId,
            message,
            type: 'warning weather',
            title: 'Low Temperature Alert',
            duration: 3000
          });
        } else {
          console.log(`[Alert Check] No low temp alert (value: ${temperature}°C)`);
        }

        //Snow Alert
        if (period.weather.some(w => w.main.toLowerCase().includes('snow'))) {
          const tempTime = new Date(period.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const message = `Very low humidity (${period.main.humidity}%) expected around ${tempTime}.`;

          alerts.push({
            id: `snow-alert-${simpleHash(message)}`,
            type: 'info weather',
            message,
            timestamp: now,
            fiberid: '1, 2, 3',
          });
        } else {
          console.log('[Alert Check] No snow expected in this forecast window.');
        }

        //Humidity Alert
        if (period.main.humidity >= thresholdHighHumidity) {
          const tempTime = new Date(period.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const message = `Very low humidity (${period.main.humidity}%) expected around ${tempTime}.`;

          alerts.push({
            id: `humidity-high-alert-${simpleHash(message)}`,
            type: 'info weather',
            message,
            timestamp: now,
            fiberid: '1, 2, 3',
          });
          //console.log('[Forecast Alert]', message);
        } else if (period.main.humidity <= thresholdLowHumidity) {
          const tempTime = new Date(period.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const message = `Very low humidity (${period.main.humidity}%) expected around ${tempTime}.`;

          alerts.push({
            id: `humidity-low-alert-${simpleHash(message)}`,
            type: 'info weather',
            message,
            timestamp: now,
            fiberid: '1, 2, 3',
          });
        } else {
          console.log(`[Alert Check] Humidity normal (${period.main.humidity}%), no alert emitted.`);
        }

      }
      //console.log('[Forecast Periods]', upcomingPeriods);

      console.log('[fetchForecastAlerts] No rain expected in next 6 hours.');
      return alerts;
    } catch (error) {
      console.error('[fetchForecast] Error fetching forecast:', error);
      return [];
    }
  };


  const postAlertToCosmic = async (alert) => {
    try {
      await cosmic.objects.insertOne({
        title: alert.message.slice(0, 40),
        type: 'alerts',
        metadata: alert,
      });
      console.log('[postAlertToCosmic] Alert saved:', alert.id);
    } catch (err) {
      console.error('[postAlertToCosmic] Failed to post alert:', err);
    }
  }

  const fetchCosmicAlerts = async () => {
    try {
      const response = await cosmic.objects
        .find({ type: 'alerts' })
        .props(['metadata.id', 'metadata.type', 'metadata.message', 'metadata.timestamp', 'metadata.fiberid'])
        .limit(100);

      return response.objects.map(obj => ({
        id: obj.metadata.id,
        type: obj.metadata.type,
        message: obj.metadata.message,
        timestamp: obj.metadata.timestamp,
        fiberId: obj.metadata.fiberid,
      }));
    } catch (err) {
      console.error('[fetchCosmicAlerts] Error:', err);
      return [];
    }
  };

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return; // skip duplicate runs
    hasFetched.current = true;

    const fetchAlerts = async () => {
      const cosmicAlerts = await fetchCosmicAlerts();
      const forecastAlerts = await fetchForecast();

      // Write only new forecast alerts
      for (const alert of forecastAlerts) {
        const alreadyExists = cosmicAlerts.some(a => a.id === alert.id);
        if (!alreadyExists) {
          await postAlertToCosmic(alert);
        }
      }

      // Combine and remove duplicates for frontend rendering
      const all = [...cosmicAlerts, ...forecastAlerts];
      const unique = Object.values(
        all.reduce((acc, alert) => {
          if (!acc[alert.id]) acc[alert.id] = alert;
          return acc;
        }, {})
      );
      const sortedUnique = unique.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setWeatherAlerts(sortedUnique);
    };

    fetchAlerts();
  }, []);

  const icons = isDarkMode
    ? {
      'info moisture': InfoMDark,
      'info temperature': InfoTDark,
      'info weather': InfoWDark,
      'warning moisture': WarningMDark,
      'warning temperature': WarningTDark,
      'warning weather': WarningWDark,
      'urgent moisture': UrgentMDark,
      'urgent temperature': UrgentTDark,
      'urgent weather': UrgentWDark,
    }
    : {
      'info moisture': InfoM,
      'info temperature': InfoT,
      'info weather': InfoW,
      'warning moisture': WarningM,
      'warning temperature': WarningT,
      'warning weather': WarningW,
      'urgent moisture': UrgentM,
      'urgent temperature': UrgentT,
      'urgent weather': UrgentW,
    };

  const indexOfLastAlert = currentPage * alertsPerPage;
  const indexOfFirstAlert = indexOfLastAlert - alertsPerPage;
  const currentAlerts = weatherAlerts.slice(indexOfFirstAlert, indexOfLastAlert);


  return (
    <>


      <button
        onClick={() => showAlert("Test alert!", "info", {
          id: `forecast-temp-${simpleHash("Test alert!")}`,
          title: 'Test Alertttt',
          timestamp: new Date().toISOString(),
        })}
        style={{ position: 'fixed', top: 20, left: 20, zIndex: 1000 }}
      >
        Test Alert Popup
      </button>

      <div className="alerts-parent">
        <div className="alerts-head" />
        <div className="alerts-child">
          <ul>
            {currentAlerts.map(alert => {
              const fiberIds = (alert.fiberid || alert.fiberId || '')
                .split(',')
                .map(id => id.trim())
                .filter(Boolean);

              return (
                <li key={alert.id} className={`alerts-message ${alert.severity}`}>
                  <div className="alerts-message-first">
                    <img src={icons[alert.type]} alt={alert.type} className="alert-icon" />
                    <span className="alerts-message-text">{alert.message}</span>
                    <div className="alerts-message-tags">
                      {fiberIds.map(id => (
                        <TagFiber key={id} fiberId={id} label={`Fiber ${id}`} defaultActive={false} />
                      ))}
                    </div>
                  </div>
                  <div className="alerts-message-second">
                    <small className="alerts-message-date">
                      {new Date(alert.timestamp).toLocaleDateString()}
                      <br />
                      {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </small>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {weatherAlerts.length > alertsPerPage && (
        <div className="pagination-controls">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <NavigateBeforeRoundedIcon />
          </button>
          <span className='pagination-label'>
            Page {currentPage} of {Math.ceil(weatherAlerts.length / alertsPerPage)}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(weatherAlerts.length / alertsPerPage)))}
            disabled={currentPage === Math.ceil(weatherAlerts.length / alertsPerPage)}
          >
            <NavigateNextRoundedIcon />
          </button>
        </div>
      )}

    </>
  );
}

export { Alerts };
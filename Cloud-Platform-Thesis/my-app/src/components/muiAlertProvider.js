import React, { createContext, useState, useCallback } from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';

//Icons
//Icons
/*import InfoM from '../resources/alert_icons/info_m.svg';
import InfoT from '../resources/alert_icons/info_t.svg';
import InfoW from '../resources/alert_icons/info_w.svg';*/
import WarningM from '../resources/alert_icons/warning_m.svg';
import WarningT from '../resources/alert_icons/warning_t.svg';
/*import WarningW from '../resources/alert_icons/warning_w.svg';
import UrgentM from '../resources/alert_icons/urgent_m.svg';
import UrgentT from '../resources/alert_icons/urgent_t.svg';
import UrgentW from '../resources/alert_icons/urgent_w.svg';*/

const AlertContext = createContext();

const Timestamp = ({ time }) => {
    if (!time) return null;

    const formattedTime = new Date(time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    const formattedDate = new Date(time).toLocaleDateString();

    return (
        <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.7 }}>
            {formattedDate} at {formattedTime}
        </Typography>
    );
}

export const MuiAlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const [recentAlerts, setRecentAlerts] = useState([]);

    const showAlert = useCallback((message, severity = 'info', options = {}) => {
        if (!options.timestamp) {
            console.warn('Alert created without timestamp. Cosmic JS alerts should include timestamps.');
        }
        const id = options.id || Date.now();
        const newAlert = {
            id,
            message,
            severity,
            title: options.title,
            timestamp: options.timestamp,
            autoHide: options.autoHide ?? true,
            duration: options.duration ?? 6000
        };

        setAlerts(prev => [...prev, newAlert]);
        setRecentAlerts(prev => [newAlert, ...prev].slice(0, 5)); // Keep last 5 alerts

        if (newAlert.duration) {
            setTimeout(() => {
                setAlerts(prev => prev.filter(a => a.id !== id));
            }, newAlert.duration);
        }
    }, []);

    const handleClose = (id) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
    };

    const value = {
        showAlert,
        recentAlerts
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            {alerts.map((alert, index) => (
                <Snackbar
                    key={alert.id}
                    open={true}
                    autoHideDuration={alert.autoHide ? alert.duration : null}
                    onClose={() => handleClose(alert.id)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    //sx={{ marginTop: `${alerts.indexOf(alert) * 60 + 60}px` }}
                    sx={{
                        '&:not(:first-of-type)': {
                            marginTop: `${index * 6 + 6}rem`, // Dynamic spacing
                        },
                    }}
                >
                    <Alert
                        severity={alert.severity}
                        variant="filled"
                        onClose={() => handleClose(alert.id)}
                        sx={{ width: '100%' }}

                        icon={alert.severity === 'warning' && alert.title === 'Temperature' ?
                            <WarningT /> :
                            alert.title === 'Moisture' ?
                                <WarningM /> :
                                null
                        }
                    >
                        {alert.title && <AlertTitle>{alert.title}</AlertTitle>}
                        <Timestamp time={alert.timestamp} />
                        {alert.message}
                    </Alert>
                </Snackbar>
            ))}
        </AlertContext.Provider>
    );
};

export const useMuiAlert = () => {
    const context = React.useContext(AlertContext);
    if (!context) {
        throw new Error('useMuiAlert must be used within a MuiAlertProvider');
    }
    return context;
};
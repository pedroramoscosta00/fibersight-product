import React, { createContext, useContext, useState, useCallback } from 'react';

//Icons
import InfoM from '../resources/alert_icons/info_m.svg';
import InfoT from '../resources/alert_icons/info_t.svg';
import InfoW from '../resources/alert_icons/info_w.svg';
import WarningM from '../resources/alert_icons/warning_m.svg';
import WarningT from '../resources/alert_icons/warning_t.svg';
import WarningW from '../resources/alert_icons/warning_w.svg';
import UrgentM from '../resources/alert_icons/urgent_m.svg';
import UrgentT from '../resources/alert_icons/urgent_t.svg';
import UrgentW from '../resources/alert_icons/urgent_w.svg';

const AlertContext = createContext();

const getAlertStyle = (alertType) => {
    const type = alertType.toLowerCase();
    // Default style (can be used as fallback)
    const baseStyle = {
        padding: '12px 16px',
        borderRadius: '8px',
        borderWidth: '2px',
        borderStyle: 'solid',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        animation: 'fadeIn 0.3s ease-out forwards'
    };

    // Check for specific keywords in the type string
    if (type.includes('info')) {
        return {
            ...baseStyle,
            background: '#D8E7D4',
            borderColor: '#7BAD6E',
            color: '#252525'
        };
    }
    if (type.includes('warning')) {
        return {
            ...baseStyle,
            background: '#FCEEBD',
            borderColor: '#F3C623',
            color: '#252525'
        };
    }
    if (type.includes('urgent')) {
        return {
            ...baseStyle,
            background: '#F9CCC0',
            borderColor: '#ED6A46',
            color: '#252525'
        };
    }
    if (type.includes('success')) {
        return {
            ...baseStyle,
            background: '#D5E8D4',
            borderColor: '#82C982',
            color: '#252525'
        };
    }
    if (type.includes('error')) {
        return {
            ...baseStyle,
            background: '#FADBD8',
            borderColor: '#E67C73',
            color: '#252525'
        };
    }

    // Default style if no matches
    return {
        ...baseStyle,
        background: '#EAF2F8',
        borderColor: '#5DADE2',
        color: 'var(--text-color)'
    };
}

const getAlertIcon = (type) => {
    if (type.includes('info') && type.includes('temperature')) return <InfoT />
    if (type.includes('info') && type.includes('moisture')) return <InfoM />
    if (type.includes('info') && type.includes('weather')) return <InfoW />

    if (type.includes('warning') && type.includes('temperature')) return <WarningT />
    if (type.includes('warning') && type.includes('moisture')) return <WarningM />
    if (type.includes('warning') && type.includes('weather')) return <WarningW />

    if (type.includes('urgent') && type.includes('temperature')) return <UrgentT />
    if (type.includes('urgent') && type.includes('moisture')) return <UrgentM />
    if (type.includes('urgent') && type.includes('weather')) return <UrgentW />
}

export const AlertProvider = ({ children }) => {
    const [alerts, setAlerts] = useState([]);

    const showAlert = useCallback((message, type = 'info', duration = 5000) => {
        const isDuplicate = alerts.some(
            alert => alert.message === message && alert.type === type
        );

        if (isDuplicate) return;

        const id = Date.now();
        const newAlert = { id, message, type };

        setAlerts((prev) => [...prev, newAlert]);

        setTimeout(() => {
            setAlerts((prev) => prev.filter((alert) => alert.id !== id));
        }, duration);
    }, [alerts]);

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            <div
                className="fixed top-4 right-4 z-50 space-y-2"
                style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}
            >
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className={`px-4 py-2 rounded shadow text-white ${alert.type === 'success' ? 'bg-green-500' :
                            alert.type === 'error' ? 'bg-red-500' :
                                'bg-blue-500'
                            }transition-all duration-300 animate-fadeIn`}
                        style={getAlertStyle(alert.type)}
                    >
                        {getAlertIcon(alert.type)}
                        <span className="flex-grow">{alert.message}</span>
                    </div>
                ))}
            </div>
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};

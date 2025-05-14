import '../App.css';
import { NavLink } from "react-router-dom";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useEffect, useRef } from 'react';

//Import Icons
import InfoM from '../resources/alert_icons/info_m.svg';
import InfoT from '../resources/alert_icons/info_t.svg';
import InfoW from '../resources/alert_icons/info_w.svg';
import WarningM from '../resources/alert_icons/warning_m.svg';
import WarningT from '../resources/alert_icons/warning_t.svg';
import WarningW from '../resources/alert_icons/warning_w.svg';
import UrgentM from '../resources/alert_icons/urgent_m.svg';
import UrgentT from '../resources/alert_icons/urgent_t.svg';
import UrgentW from '../resources/alert_icons/urgent_w.svg';

function OverlayAlerts({ isOpen, onClose, alerts }) {
    const recentAlerts = alerts
        ? [...alerts]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5)
        : [];

    const getAlertIcon = (type) => {
        if (type.includes('urgent') && type.includes('temperature')) return UrgentT;
        if (type.includes('urgent') && type.includes('moisture')) return UrgentM;
        if (type.includes('urgent') && type.includes('weather')) return UrgentW;

        if (type.includes('warning') && type.includes('temperature')) return WarningT;
        if (type.includes('warning') && type.includes('moisture')) return WarningM;
        if (type.includes('warning') && type.includes('weather')) return WarningW;

        if (type.includes('info') && type.includes('temperature')) return WarningT;
        if (type.includes('info') && type.includes('moisture')) return WarningM;
        if (type.includes('info') && type.includes('weather')) return WarningW;
    };

    const overlayRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (overlayRef.current && !overlayRef.current.contains(event.target)) {
                onClose(); // Reuse your existing onClose logic!
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);


    return (
        <>
            {isOpen && (
                <div className="overlay" ref={overlayRef}>
                    <div className="overlay-controls">
                        Recent Alerts
                        <CloseRoundedIcon onClick={onClose} className='overlay-close' />
                    </div>
                    {recentAlerts.length > 0 ? (
                        recentAlerts.map(alert => (
                            <div key={alert.id} className="overlay-message">
                                <div className="overlay-message-child">
                                    <img
                                        src={getAlertIcon(alert.type)}
                                        alt={alert.type}
                                    />
                                    {alert.message}
                                </div>
                                <div className="overlay-message-child2">
                                    {new Date(alert.timestamp).toLocaleDateString()}
                                    <br />
                                    {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="overlay-no-alerts">
                            No recent alerts
                        </div>
                    )}
                    <NavLink to="/alerts">
                        <div className='overlay-more' onClick={onClose}>
                            <button className="overlay-bt">See All</button>
                        </div>
                    </NavLink>
                </div>
            )}
        </>
    );
}

export { OverlayAlerts };
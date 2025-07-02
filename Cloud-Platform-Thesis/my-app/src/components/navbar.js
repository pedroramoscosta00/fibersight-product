import { React, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import logo from '../logo.png';
import '../App.css';
import UserIcon from '../resources/profile.png';
import cosmic from "./cosmic";
import { OverlayAlerts } from "../pages";
import { OverlayProfile } from "../pages";
import { useAuth } from "../hooks/useAuth";

//Material UI
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded';
import MapRoundedIcon from '@mui/icons-material/MapRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import Avatar from '@mui/material/Avatar';
import { useMuiAlert } from "./muiAlertProvider";
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';

function Navbar() {
    const [alerts, setAlerts] = useState([]);
    const { recentAlerts } = useMuiAlert();
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);
    const [isProfileOverlayOpen, setIsProfileOverlayOpen] = useState(false);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const toggleMenu = () => setIsMenuOpen((prev) => !prev);

    const { user } = useAuth();

    const profilePicture = user?.profilepicture?.url ||
        user?.profilepicture ||
        UserIcon;

    const fetchCosmicAlerts = async () => {
        try {
            const response = await cosmic.objects
                .find({ type: 'alerts' })
                .props(['metadata.id', 'metadata.type', 'metadata.message', 'metadata.timestamp'])
                .limit(5) // Only get the most recent 5
                .sort('-metadata.timestamp'); // Newest first

            setAlerts(response.objects.map(obj => ({
                id: obj.metadata.id,
                type: obj.metadata.type,
                message: obj.metadata.message,
                timestamp: obj.metadata.timestamp
            })));
        } catch (err) {
            console.error('Error fetching alerts:', err);
        }
    };

    useEffect(() => {
        fetchCosmicAlerts();

        // Optional: Refresh alerts periodically
        const interval = setInterval(fetchCosmicAlerts, 60000); // Every minute
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <nav className="navbar">
                <div className="div-img">
                    <img src={logo} alt="fibersight_logo"></img>
                </div>
                <div className="nav-pages">
                    <div className="nav-buttons">
                        <NavLink to="/map">
                            {({ isActive }) => (
                                <>
                                    <button className={`nav-bt ${isActive ? "active" : ""}`}>
                                        <MapRoundedIcon className="nav-bt-icon" fontSize="large" />
                                        <span className="nav-bt-text">Map</span>
                                    </button>
                                </>
                            )}
                        </NavLink>
                    </div>
                    <div>
                        <NavLink to="/analytics">
                            {({ isActive }) => (
                                <>
                                    <button className={`nav-bt ${isActive ? "active" : ""}`}>
                                        <ShowChartRoundedIcon className="nav-bt-icon" fontSize="large" />
                                        <span className="nav-bt-text">Analytics</span>
                                    </button>
                                </>
                            )}

                        </NavLink>
                    </div>
                    <div>
                        <NavLink to="/history">
                            {({ isActive }) => (
                                <>
                                    <button className={`nav-bt ${isActive ? "active" : ""}`}>
                                        <HistoryRoundedIcon className="nav-bt-icon" fontSize="large" />
                                        <span className="nav-bt-text">History</span>
                                    </button>
                                </>
                            )}

                        </NavLink>
                    </div>
                    <div>
                        <NavLink to="/settings">
                            {({ isActive }) => (
                                <>
                                    <button className={`nav-bt ${isActive ? "active" : ""}`}>
                                        <SettingsRoundedIcon className="nav-bt-icon" fontSize="large" />
                                        <span className="nav-bt-text">Settings</span>
                                    </button>
                                </>
                            )}
                        </NavLink>
                    </div>
                    <div>
                        <>
                            <NotificationsRoundedIcon className={`nav-noti-icon ${isOverlayOpen ? "active" : ""}`}
                                fontSize="large"
                                onClick={() => setIsOverlayOpen(!isOverlayOpen)}
                            />
                        </>
                    </div>
                    <div className='nav-profile'>
                        <Avatar
                            alt="User icon"
                            src={profilePicture}
                            className={`nav-profile-icon ${isProfileOverlayOpen ? "active" : ""}`}
                            onClick={() => user && setIsProfileOverlayOpen(!isProfileOverlayOpen)}
                        />
                    </div>
                </div>

                <button className="hamburger-menu" onClick={toggleMenu}>
                    <MenuRoundedIcon />
                </button>
            </nav>
            <OverlayAlerts
                isOpen={isOverlayOpen}
                onClose={() => setIsOverlayOpen(false)}
                alerts={alerts}
            />
            {/*<OverlayAlerts
                isOpen={isOverlayOpen}
                onClose={() => setIsOverlayOpen(false)}
                alerts={recentAlerts}
            />*/}
            <OverlayProfile
                isOpen={isProfileOverlayOpen}
                onClose={() => setIsProfileOverlayOpen(false)}
            />
        </>
    );
}



export default Navbar;
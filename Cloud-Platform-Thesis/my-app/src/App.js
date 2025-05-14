import './App.css';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { ProtectedRoute } from './components/protectedRoutes';
import { useEffect, useState } from "react";
import { AuthProvider } from './components/authContext';
import { useAuth } from './hooks/useAuth';

//Import components
import Navbar from './components/navbar';
import { FiberColorProvider } from './components/fiberColorContext';
import { MuiAlertProvider } from './components/muiAlertProvider';

//Import Pages
import {
  Map, Analytics, History, Settings,
  Alerts, OverlayAlerts, OverlayProfile, EditProfile, Login
} from "./pages";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme');
  });
  const [globalAlerts, setGlobalAlerts] = useState([]);
  const addAlert = (newAlert) => {
    setGlobalAlerts(prev => [...prev, newAlert]);
  }
  const { user } = useAuth();

  //const location = useLocation();
  //const showNavBar = !['/login', '/'].includes(location.pathname);

  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);

  //Temperature
  const [thresholdHigh, setThresholdHigh] = useState(() => {
    const stored = localStorage.getItem('tempThreshold');
    return stored ? Number(stored) : 10;
  });

  useEffect(() => {
    localStorage.setItem('tempThreshold', thresholdHigh);
  }, [thresholdHigh]);

  const [thresholdLow, setThresholdLow] = useState(() => {
    const stored = localStorage.getItem('tempThreshold2');
    return stored ? Number(stored) : 10;
  });

  useEffect(() => {
    localStorage.setItem('tempThreshold2', thresholdLow);
  }, [thresholdLow]);

  //Humidity
  const [humidityHigh, setHumidityHigh] = useState(() => {
    const stored = localStorage.getItem('moistThreshold');
    return stored ? Number(stored) : 10;
  });

  useEffect(() => {
    localStorage.setItem('moistThreshold', humidityHigh);
  }, [humidityHigh]);

  const [humidityLow, setHumidityLow] = useState(() => {
    const stored = localStorage.getItem('moistThreshold2');
    return stored ? Number(stored) : 10;
  });

  useEffect(() => {
    localStorage.setItem('moistThreshold2', humidityLow);
  }, [humidityLow]);


  return (
    <>
      <AuthProvider>
        <MuiAlertProvider>
          <FiberColorProvider>
            <Router>
              <Navbar />
              <Routes>
                <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />

                <Route path="/" element={<Navigate to="/login" replace />} />

                <Route path="*" element={<Navigate to="/login" replace />} />

                <Route element={<ProtectedRoute />}>
                  <Route
                    path="/map"
                    element={<Map isDarkMode={isDarkMode} onNewAlert={addAlert} />}
                  />
                  <Route
                    path="/analytics"
                    element={<Analytics isDarkMode={isDarkMode} onNewAlert={addAlert} />}
                  />
                  <Route
                    path="/history"
                    element={<History isDarkMode={isDarkMode} onNewAlert={addAlert} />}
                  />
                  <Route
                    path="/settings"
                    element={
                      <Settings
                        isDarkMode={isDarkMode}
                        toggleDarkMode={toggleDarkMode}
                        setIsDarkMode={setIsDarkMode}
                        thresholdHigh={thresholdHigh}
                        setThresholdHigh={setThresholdHigh}
                        thresholdLow={thresholdLow}
                        setThresholdLow={setThresholdLow}
                        humidityLow={humidityLow}
                        setHumidityLow={setHumidityLow}
                        humidityHigh={humidityHigh}
                        setHumidityHigh={setHumidityHigh}
                        onNewAlert={addAlert}
                      />
                    }
                  />
                  <Route
                    path="/overlayAlerts"
                    element={<OverlayAlerts isDarkMode={isDarkMode} onNewAlert={addAlert} />}
                  />
                  <Route
                    path="/alerts"
                    element={
                      <Alerts
                        isDarkMode={isDarkMode}
                        thresholdHigh={thresholdHigh}
                        thresholdLow={thresholdLow}
                        humidityLow={humidityLow}
                        humidityHigh={humidityHigh}
                        onNewAlert={addAlert}
                      />
                    }
                  />
                  <Route
                    path="/overlayProfile"
                    element={<OverlayProfile isDarkMode={isDarkMode} onNewAlert={addAlert} user={user} />}
                  />
                  <Route
                    path="/editProfile"
                    element={<EditProfile isDarkMode={isDarkMode} />}
                  />
                </Route>
              </Routes>
            </Router>
          </FiberColorProvider>
        </MuiAlertProvider>
      </AuthProvider>
    </>
  );
}

export default App;
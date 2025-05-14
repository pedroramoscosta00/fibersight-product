// hooks/useGlobalAlerts.js
import { useContext } from 'react';
import { MuiAlertContext } from '../components/muiAlertProvider';

export const useGlobalAlerts = () => {
    const context = useContext(MuiAlertContext);
    if (!context) {
        throw new Error('useGlobalAlerts must be used within a MuiAlertProvider');
    }
    return context;
};
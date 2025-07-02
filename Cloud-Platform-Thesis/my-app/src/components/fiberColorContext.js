// FiberColorContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const FiberColorContext = createContext();

function FiberColorProvider({ children }) {
    const [fiberColors, setFiberColors] = useState({
        system1: '#3675F8',
        system2: '#EF095F',
        system3: '#30CE60'
    });

    useEffect(() => {
        const storedColors = localStorage.getItem('fiberColors');
        if (storedColors) {
            setFiberColors(JSON.parse(storedColors));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('fiberColors', JSON.stringify(fiberColors));
    }, [fiberColors]);

    const getColor = (fiberId) => {
        // Map numeric IDs to system IDs
        let key = fiberId;
        if (/^\d+$/.test(fiberId)) {
            key = `system${fiberId}`;
        }
        return fiberColors[key] || '#ccc';
    };

    const setColor = (fiberId, color) => {
        setFiberColors((prev) => ({ ...prev, [fiberId]: color }));
    };

    return (
        <FiberColorContext.Provider value={{ fiberColors, getColor, setColor }}>
            {children}
        </FiberColorContext.Provider>
    );
}

export function useFiberColors() {
    return useContext(FiberColorContext);
}

export { FiberColorProvider, FiberColorContext };

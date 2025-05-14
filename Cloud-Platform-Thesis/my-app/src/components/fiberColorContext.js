// FiberColorContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const FiberColorContext = createContext();

function FiberColorProvider({ children }) {
    const [fiberColors, setFiberColors] = useState({
        1: '#3675F8',
        2: '#EF095F',
        3: '#30CE60'
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

    const getColor = (fiberId) => fiberColors[fiberId] || '#ccc';

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

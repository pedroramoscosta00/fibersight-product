// TagFiber.js
import '../App.css';
import React, { useState, useContext } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { FiberColorContext } from './fiberColorContext';

function TagFiber({ fiberId, label, defaultActive = true, onToggle, onClick }) {
    const [isActive, setIsActive] = useState(defaultActive);
    const { getColor } = useContext(FiberColorContext);
    const color = getColor(fiberId);

    const handleClick = () => {
        const newActive = !isActive;
        setIsActive(newActive);
        if (onToggle) onToggle(fiberId, newActive);

        // Toggle logic for visibility (e.g., map heatmap)
        if (onClick) {
            onClick(fiberId, newActive); // Optional: pass fiberId and state
        }
    };

    return (
        <div
            className={`tag-fiber1 ${isActive ? 'active' : ''}`}
            onClick={handleClick}
            style={{
                borderColor: color,
                backgroundColor: color,
                color: '#F8F8FF',
            }}
        >
            {/*<span className="dot" style={{ backgroundColor: isActive ? '#F8F8FF' : color }} />*/}
            {label}
            {isActive && <CloseRoundedIcon fontSize="small" />}
            
        </div>
    );
}

export { TagFiber };

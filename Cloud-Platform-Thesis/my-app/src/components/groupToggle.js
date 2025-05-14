//import { useState } from "react";

const GroupToggle = ({ displayMode, setDisplayMode }) => {
    return (
        <div className='analytics-group-control'>
            <label>
                <input
                    type="radio"
                    name="displayMode"
                    value="all"
                    checked={displayMode === 'all'}
                    onChange={() => setDisplayMode('all')}
                />
                Show All Sensors
            </label>
            <label>
                <input
                    type="radio"
                    name="displayMode"
                    value="grouped"
                    checked={displayMode === 'grouped'}
                    onChange={() => setDisplayMode('grouped')}
                />
                Group sensors (20 per group)
            </label>
        </div>
    );
};

export { GroupToggle };
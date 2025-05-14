import React, { use } from 'react';
import '../App.css';
import { useState } from 'react';
import { TagFiber } from '../components/tagFiber';

//Material UI
import MinimizeRoundedIcon from '@mui/icons-material/MinimizeRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

function FiberToggles({ onTagClick }) {
    const [minimize, setMinimize] = useState(false);

    return (
        <>
            <div className={`fiber-toggles ${minimize ? 'hidden' : ''}`}>
                <span className='span-title'>
                    Filter
                    <MinimizeRoundedIcon
                        className='minimize-icon'
                        onClick={() => setMinimize(!minimize)}
                    />
                </span>
                <TagFiber fiberId={1} label="Fiber 1" defaultActive={true} onClick={onTagClick} />
                <TagFiber fiberId={2} label="Fiber 2" defaultActive={true} onClick={onTagClick} />
                <TagFiber fiberId={3} label="Fiber 3" defaultActive={true} onClick={onTagClick} />
            </div>

            <div className={`fiber-toggles-minimized ${minimize ? 'visible' : 'hidden'}`}>
                <AddRoundedIcon
                    className='maximize-icon'
                    onClick={() => setMinimize(!minimize)}
                />
            </div>
        </>
    )
}

export { FiberToggles };
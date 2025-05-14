import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

function LightModeTheme({ onClick, isActive }) {
    return (
        <>
            <div
                className={`light-mode-parent ${isActive ? 'active' : ''}`}
                onClick={onClick}
            >
                <div className="light-mode-child">
                    <div className="light-mode-text1" />
                    <div className="light-mode-text2" />
                    <div className="light-mode-text2" />

                </div>
                {isActive && (
                    <CheckCircleOutlineRoundedIcon className="check-light" />
                )}
            </div>
        </>
    );
}
function DarkModeTheme({ onClick, isActive }) {
    return (
        <>
            <div
                className={`dark-mode-parent ${isActive ? 'active' : ''}`}
                onClick={onClick}
            >
                <div className="dark-mode-child">
                    <div className="dark-mode-text1" />
                    <div className="dark-mode-text2" />
                    <div className="dark-mode-text2" />

                </div>
                {isActive && (
                    <CheckCircleOutlineRoundedIcon className="check-dark" />
                )}
            </div>
        </>
    );
}

export { LightModeTheme, DarkModeTheme };
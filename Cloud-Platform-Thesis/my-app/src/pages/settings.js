import { useState, useEffect } from 'react';

//Components
import { FiberCard } from '../components/fiberCard';
import { LightModeTheme, DarkModeTheme } from '../components/darkModeToggles';

//MUI
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useMuiAlert } from '../components/muiAlertProvider';

function ThresholdInput({ label, thresholdValue, setThresholdValue, value, onChange }) {
  return (
    <>
      <label className='alert-threshold-label'>
        {/*High Temp Threshold: <br />*/}
        {label}
        <div className='alert-threshold-input'>
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          °C
        </div>
      </label>
      {/*{hasChanged && (
        <div className='threshold-bts'>
          <button className='threshold-reset-bt' onClick={handleReset}>Reset</button>
          <button className='threshold-save-bt' onClick={handleSave}>Save</button>
        </div>
      )}*/}
    </>
  );
}

function Settings({
  isDarkMode, setIsDarkMode,
  thresholdHigh, setThresholdHigh,
  thresholdLow, setThresholdLow,
  humidityHigh, setHumidityHigh,
  humidityLow, setHumidityLow
}) {
  const [fibers, setFibers] = useState([
    { id: 1, title: 'Fiber 1', distance: '2km', geojsonPath: '/fibers/fiber1.geojson' },
    { id: 2, title: 'Fiber 2', distance: '2km', geojsonPath: '/fibers/fiber2.geojson' },
    { id: 3, title: 'Fiber 3', distance: '2km', geojsonPath: '/fibers/fiber3.geojson' },
  ]);

  const [availableFiles, setAvailableFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [fiberToDelete, setFiberToDelete] = useState(null);

  // Local state for the input values
  const [localThresholdHigh, setLocalThresholdHigh] = useState(thresholdHigh);
  const [localThresholdLow, setLocalThresholdLow] = useState(thresholdLow);
  const [localHumidityHigh, setLocalHumidityHigh] = useState(humidityHigh);
  const [localHumidityLow, setLocalHumidityLow] = useState(humidityLow);

  const { showAlert } = useMuiAlert();

  useEffect(() => {
    setLocalThresholdHigh(thresholdHigh);
  }, [thresholdHigh]);

  useEffect(() => {
    setLocalThresholdLow(thresholdLow);
  }, [thresholdLow]);

  useEffect(() => {
    setLocalHumidityHigh(humidityHigh);
  }, [humidityHigh]);

  useEffect(() => {
    setLocalHumidityLow(humidityLow);
  }, [humidityLow]);

  const hasChanged =
    localThresholdHigh !== thresholdHigh ||
    localThresholdLow !== thresholdLow ||
    localHumidityHigh !== humidityHigh ||
    localHumidityLow !== humidityLow;

  const handleSave = () => {
    setThresholdHigh(localThresholdHigh);
    setThresholdLow(localThresholdLow);
    setHumidityHigh(localHumidityHigh);
    setHumidityLow(localHumidityLow);

    showAlert('Threshold settings saved successfully.', 'success', {
      title: 'Settings Updated',
      timestamp: new Date().toISOString(),
    });
  }
  const handleReset = () => {
    setLocalThresholdHigh(thresholdHigh);
    setLocalThresholdLow(thresholdLow);
    setLocalHumidityHigh(humidityHigh);
    setLocalHumidityLow(humidityLow);

    showAlert('Threshold values reset to their previous saved values', 'success', {
      title: 'Settings Reset',
      timestamp: new Date().toISOString(),
    });
  }

  const handleDeleteFiber = () => {
    setFibers(prev => prev.filter(f => f.id !== fiberToDelete.id));
    setFiberToDelete(null); // Close the modal
  };

  useEffect(() => {
    fetch('/fibers/index.json')
      .then((res) => res.json())
      .then((files) => setAvailableFiles(files))
      .catch((err) => console.error('Failed to fetch index.json', err));
  }, []);

  const addFiberFromFile = (filename) => {
    const alreadyExists = fibers.some(fiber => fiber.geojsonPath === `/fibers/${filename}`);
    if (alreadyExists) {
      setLoadError(`The file "${filename}" has already been added.`);
      return;
    }

    const nextId = fibers.length + 1;
    const path = `/fibers/${filename}`;

    const newFiber = {
      id: nextId,
      title: `Fiber ${nextId}`,
      distance: '2km',
      geojsonPath: path
    };
    setFibers((prev) => [...prev, newFiber]);
    setShowModal(false);
    setLoadError(""); // clear error if successful
  };

  return (
    <>
      <div className="fiber-parent">
        <div className="fiber-settings">
          <h2>Fiber Settings</h2>
          <div className="fiber-cards">
            {fibers.map((fiber) => (
              <FiberCard
                key={fiber.id}
                fiberId={fiber.id}
                fiberName={fiber.title}
                geojsonPath={fiber.geojsonPath}
                onDelete={() => setFiberToDelete(fiber)}
              />
            ))}
            <div className='card-add-fiber' onClick={() => setShowModal(true)}>
              <AddRoundedIcon
                style={{
                  color: 'var(--bg-color)',
                  backgroundColor: 'var(--text-color)',
                  padding: '0.5rem',
                  borderRadius: '0.7rem',
                  fontSize: '2rem'
                }}
              />
            </div>
            {/* overlay */}
            {showModal && (
              <div className="fiber-modal-overlay" onClick={() => {
                setShowModal(false);
                setLoadError(null);
              }}>
                <div
                  className="fiber-modal-content"
                  onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
                >
                  <h3>Select a GeoJSON File</h3>
                  <ul>
                    {availableFiles.map((filename) => (
                      <li key={filename} onClick={() => addFiberFromFile(filename)}>
                        {filename}
                      </li>
                    ))}
                  </ul>
                  {loadError && (
                    <p className="fiber-modal-error">
                      {loadError}
                    </p>
                  )}
                  <button className='cancel-bt' onClick={() => {
                    setShowModal(false);
                    setLoadError(null);
                  }} >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/*Delete Confirm*/}
            {fiberToDelete && (
              <div className="confirmation-overlay" onClick={() => setFiberToDelete(null)}>
                <div
                  className="confirmation-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3>Are you sure you want to delete {fiberToDelete.title}?</h3>
                  {/*<p>This will remove the fiber from view, but not from the file system.</p>*/}
                  <div className="modal-buttons">
                    <button onClick={() => setFiberToDelete(null)} className="no-bt">No</button>
                    <button onClick={handleDeleteFiber} className="yes-bt">Yes</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
        <div className="alert-settings">
          <h2>Alert Settings</h2>
          <div className="alert-settings-toggles">
            <div className="threshold-control">
              <h2>Thresholds</h2>
              <div className="threshold-temperature">
                <ThresholdInput
                  label="High Temperature Threshold"
                  value={localThresholdHigh}
                  onChange={setLocalThresholdHigh}
                />
                <ThresholdInput
                  label="Low Temperature Threshold"
                  value={localThresholdLow}
                  onChange={setLocalThresholdLow}
                />
              </div>
              <div className="threshold-moisture">
                <ThresholdInput
                  label="High Humidity Threshold"
                  value={localHumidityHigh}
                  onChange={setLocalHumidityHigh}
                />
                <ThresholdInput
                  label="Low Humidity Threshold"
                  value={localHumidityLow}
                  onChange={setLocalHumidityLow}
                />
              </div>
              {hasChanged && (
                <div className='threshold-bts'>
                  <button className='threshold-reset-bt' onClick={handleReset}>Reset All</button>
                  <button className='threshold-save-bt' onClick={handleSave}>Save All</button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className='theme-toggle-container'>
          <h2>
            System Theme
          </h2>
          <div className='theme-toggle-container-child'>
            <LightModeTheme
              onClick={() => setIsDarkMode(false)}
              isActive={!isDarkMode}
            />
            <DarkModeTheme
              onClick={() => setIsDarkMode(true)}
              isActive={isDarkMode}
            />
          </div>

        </div>
      </div>
    </>
  );

}

export { Settings };
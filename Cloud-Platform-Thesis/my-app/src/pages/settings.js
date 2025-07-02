import { useState, useEffect } from 'react';

//Components
import { FiberCard } from '../components/fiberCard';
import { LightModeTheme, DarkModeTheme } from '../components/darkModeToggles';
import { ProfileCard } from '../components/profileCard';

import { systemFolders, fileNames } from './map';

//MUI
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useMuiAlert } from '../components/muiAlertProvider';
import CircularProgress from '@mui/material/CircularProgress';

function ThresholdInput({ label, thresholdValue, setThresholdValue, value, onChange, unit }) {
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
          {unit}
        </div>
      </label>
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
  /*const [fibers, setFibers] = useState([
    { id: 1, title: 'Fiber 1', distance: '2km', geojsonPath: '/fibers/fiber1.geojson' },
    { id: 2, title: 'Fiber 2', distance: '2km', geojsonPath: '/fibers/fiber2.geojson' },
    { id: 3, title: 'Fiber 3', distance: '2km', geojsonPath: '/fibers/fiber3.geojson' },
  ]);*/

  const [availableFiles, setAvailableFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [fiberToDelete, setFiberToDelete] = useState(null);

  // Local state for the input values
  const [localThresholdHigh, setLocalThresholdHigh] = useState(thresholdHigh);
  const [localThresholdLow, setLocalThresholdLow] = useState(thresholdLow);
  const [localHumidityHigh, setLocalHumidityHigh] = useState(humidityHigh);
  const [localHumidityLow, setLocalHumidityLow] = useState(humidityLow);

  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    password: '',
    confirmPassword: '',
    profilePicture: ''
  });
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profiles, setProfiles] = useState([]);

  // Add to your Settings component
  const [deletingProfileId, setDeletingProfileId] = useState(null);
  const [profileToDelete, setProfileToDelete] = useState(null);

  const user = JSON.parse(localStorage.getItem('user_data'));
  const isAdmin = Array.isArray(user?.isadmin) && user.isadmin.includes('admin');

  const { showAlert } = useMuiAlert();

  const latestFile = fileNames[fileNames.length - 1];
  const [fibers, setFibers] = useState(
    systemFolders.map((system, idx) => ({
      id: system,
      title: `Fiber ${idx + 1}`,
      distance: '2km',
      geojsonPath: `/fiber-points/${system}/${latestFile}`,
    }))
  );

  const [openPickerFiberId, setOpenPickerFiberId] = useState(null);

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
    async function fetchProfiles() {
      try {
        const res = await fetch('http://localhost:5000/profiles');
        const data = await res.json();
        setProfiles(data.profiles || []);
      } catch (err) {
        console.error('Failed to fetch profiles', err);
      }
    }
    fetchProfiles();
  }, []);

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
    const systemId = `system${nextId}`;
    const path = `/fibers/${filename}`;

    const newFiber = {
      id: systemId,
      title: `Fiber ${nextId}`,
      distance: '2km',
      geojsonPath: path
    };
    setFibers((prev) => [...prev, newFiber]);
    setShowModal(false);
    setLoadError(""); // clear error if successful
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    setAddError('');
    try {
      const formData = new FormData();
      formData.append('media', file);

      const res = await fetch('http://localhost:5000/upload-media', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload profile picture');

      setNewAccount(a => ({
        ...a,
        profilePicture: data.mediaUrl, // for preview
        profilePictureName: data.mediaName // for backend save
      }));
    } catch (err) {
      setAddError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (isUploading || isSubmitting) return; // Prevent double submit
    setIsSubmitting(true);
    setAddError('');
    setAddSuccess('');

    // Password confirmation check
    if (newAccount.password !== newAccount.confirmPassword) {
      setAddError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAccount,
          profilePicture: newAccount.profilePictureName
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create account');
      setAddSuccess('Account created!');
      setNewAccount({
        firstName: '', lastName: '', email: '', phone: '', position: '',
        password: '', confirmPassword: '', profilePicture: ''
      });

      setShowAddAccount(false);
      if (typeof showAlert === 'function') {
        showAlert('Account created successfully!', 'success');
      }
    } catch (err) {
      setAddError(err.message);
    }
  };

  const handleDeleteProfile = async (id) => {
    setDeletingProfileId(id);
    try {
      const res = await fetch(`http://localhost:5000/profiles/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to delete profile');
      setProfiles(prev => prev.filter(profile => profile.id !== id));
      showAlert('Profile deleted successfully!', 'success');
    } catch (err) {
      showAlert(err.message, 'error');
    } finally {
      setDeletingProfileId(null);
    }
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
                showPicker={openPickerFiberId === fiber.id}
                setShowPicker={open => setOpenPickerFiberId(open ? fiber.id : null)}

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
        {isAdmin && (
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
                    unit='°C'
                  />
                  <ThresholdInput
                    label="Low Temperature Threshold"
                    value={localThresholdLow}
                    onChange={setLocalThresholdLow}
                    unit='°C'
                  />
                </div>
                <div className="threshold-moisture">
                  <ThresholdInput
                    label="High Humidity Threshold"
                    value={localHumidityHigh}
                    onChange={setLocalHumidityHigh}
                    unit='%'
                  />
                  <ThresholdInput
                    label="Low Humidity Threshold"
                    value={localHumidityLow}
                    onChange={setLocalHumidityLow}
                    unit='%'
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
        )}
        <div
          className='theme-toggle-container'
          style={{
            position: 'relative'
          }}>
          <h2>
            System Theme
          </h2>

          <div className='theme-toggle-container-child' style={{ pointerEvents: 'none', opacity: 0.5 }}>
            <div
              className="theme-toggle-overlay"
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                fontWeight: 700,
                zIndex: 2,
                pointerEvents: 'auto',
                borderRadius: '1.25rem'
              }}
            >
              Coming soon
            </div>
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
        {isAdmin && (
          <div className='add-profile-container'>
            <h2>Manage Team</h2>
            <div className="profile-cards">
              {profiles.map(profile => (
                <ProfileCard
                  key={profile.slug}
                  profile={profile}
                  //onDelete={() => handleDeleteProfile(profile.id)}
                  onDelete={() => setProfileToDelete(profile)}
                  isDeleting={deletingProfileId === profile.id}
                />
              ))}
              <div
                className='card-add-fiber'
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setShowAddAccount(true);
                  setAddError('');
                  setAddSuccess('');
                  setIsSubmitting(false);
                  setIsUploading(false);
                  setNewAccount({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    position: '',
                    password: '',
                    confirmPassword: '',
                    profilePicture: '',
                    profilePictureName: ''
                  });
                }}
              >
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
            </div>

            {showAddAccount && (
              <div className="fiber-modal-overlay" onClick={() => setShowAddAccount(false)}>
                <div className="fiber-modal-content" onClick={e => e.stopPropagation()}>
                  <h3>Add New Account</h3>
                  <form onSubmit={handleAddAccount}>
                    <div className='create-account-line'>
                      <input
                        placeholder="First Name"
                        value={newAccount.firstName}
                        onChange={e => setNewAccount(a => ({ ...a, firstName: e.target.value }))}
                        required
                      />
                      <input
                        placeholder="Last Name"
                        value={newAccount.lastName}
                        onChange={e => setNewAccount(a => ({ ...a, lastName: e.target.value }))}
                        required
                      />
                    </div>
                    <div className='create-account-line'>
                      <input
                        type="email"
                        placeholder="Email"
                        value={newAccount.email}
                        onChange={e => setNewAccount(a => ({ ...a, email: e.target.value }))}
                        required
                      />
                      <input
                        placeholder="Phone"
                        value={newAccount.phone}
                        onChange={e => setNewAccount(a => ({ ...a, phone: e.target.value }))}
                      />
                    </div>
                    <div className='create-account-line'>
                      <input
                        placeholder="Position"
                        value={newAccount.position}
                        onChange={e => setNewAccount(a => ({ ...a, position: e.target.value }))}
                      />
                    </div>
                    <div className='create-account-line'>
                      <input
                        type="password"
                        placeholder="Password"
                        value={newAccount.password}
                        onChange={e => setNewAccount(a => ({ ...a, password: e.target.value }))}
                        required
                      />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={newAccount.confirmPassword}
                        onChange={e => setNewAccount(a => ({ ...a, confirmPassword: e.target.value }))}
                        required
                      />
                    </div>
                    <div className='create-account-line'>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        disabled={isUploading}
                      />
                      {isUploading && (
                        <span style={{ marginLeft: 8 }}>
                          <CircularProgress size={24} />
                        </span>
                      )}
                      {newAccount.profilePicture && !isUploading && (
                        <img
                          src={newAccount.profilePicture}
                          alt="Profile Preview"
                          style={{ width: 40, height: 40, borderRadius: '50%' }}
                        />
                      )}
                    </div>
                    {addError && <div className="form-error">{addError}</div>}
                    {addSuccess && <div className="form-success">{addSuccess}</div>}
                    <div className="modal-buttons">
                      <button type="button" className="create-cancel-bt" onClick={() => setShowAddAccount(false)}>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className='create-create-bt'
                        disabled={isUploading || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <CircularProgress size={18} style={{ marginRight: 8, color: 'white' }} />
                            Creating...
                          </>
                        ) : 'Create'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {profileToDelete && (
              <div className="confirmation-overlay" onClick={() => setProfileToDelete(null)}>
                <div
                  className="confirmation-content"
                  onClick={e => e.stopPropagation()}
                >
                  <h3>
                    Are you sure you want to delete {profileToDelete.metadata.firstname} {profileToDelete.metadata.lastname}?
                  </h3>
                  <div className="modal-buttons">
                    <button onClick={() => setProfileToDelete(null)} className="no-bt">No</button>
                    <button
                      onClick={() => {
                        handleDeleteProfile(profileToDelete.id);
                        setProfileToDelete(null);
                      }}
                      className="yes-bt"
                    >
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );

}

export { Settings };
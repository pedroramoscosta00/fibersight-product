import { useState, useEffect } from 'react';
import { getCosmicProfile, saveCosmicProfile } from '../components/cosmic';
import UserIcon from '../resources/profile.png'
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

//MUI
import { useMuiAlert } from '../components/muiAlertProvider';
import Avatar from '@mui/material/Avatar';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CircularProgress from '@mui/material/CircularProgress';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

function EditProfile() {
    const { showAlert } = useMuiAlert();
    const { user, updateUserData } = useAuth();
    const navigate = useNavigate();
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: user.firstname || '',
        lastName: user.lastname || '',
        email: user.email || '',
        phone: user.phone || '',
        position: user.position || '',
        profilePicture: user.profilepicture || '',
    });

    const [originalData, setOriginalData] = useState({ ...formData });
    const [editingField, setEditingField] = useState('');
    const [errors, setErrors] = useState({});
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [showSaveConfirm, setShowSaveConfirm] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFormValid, setIsFormValid] = useState(true);

    const [activeView, setActiveView] = useState('profile');

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        form: '' // For general form errors
    });
    const [hasPasswordChanges, setHasPasswordChanges] = useState(false);
    const [editingPasswordField, setEditingPasswordField] = useState('');

    // Load profile on mount
    useEffect(() => {
        if (!user.slug) return;

        const fetchProfile = async () => {
            try {
                const profile = await getCosmicProfile(user.slug);
                console.log('Fetched profile data:', profile);

                if (profile) {
                    setFormData({
                        firstName: profile.firstname || '',
                        lastName: profile.lastname || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        position: profile.position || '',
                        profilePicture: profile.profilepicture?.url || '', // Ensure it's a string
                    });
                    setOriginalData({
                        firstName: profile.firstname || '',
                        lastName: profile.lastname || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        position: profile.position || '',
                        profilePicture: profile.profilepicture?.url || '', // Ensure it's a string
                    });
                }
            } catch (error) {
                console.error('Error fetching profile:', error.message); // Debug log
            }
        };
        fetchProfile();
    }, [user.slug]);

    useEffect(() => {
        const changed = Object.keys(formData).some(key => formData[key] !== originalData[key]);
        setHasChanges(changed);
    }, [formData, originalData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        //console.log('Editing field set to:', fieldKey);
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleFileChange = async (e, name) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append('media', file);

            const response = await fetch('http://localhost:5000/upload-media', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            console.log('Upload response:', data);

            if (!response.ok) throw new Error(data.error || 'Upload failed');

            // Store just the media name as per Cosmic documentation
            setFormData(prev => ({
                ...prev,
                profilePicture: {
                    mediaName: data.mediaName,  // Store the media name
                    url: data.mediaUrl         // Keep URL for display purposes
                }
            }));

            showAlert('Profile picture uploaded successfully', 'success');
        } catch (error) {
            console.error('Upload error:', error);
            showAlert('Failed to upload profile picture', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        validateField(name);
    }

    const validateField = (field) => {
        let error = '';
        const value = formData[field];

        if (field === 'profilePicture') {
            return;
        }

        if ((field === 'firstName' || field === 'lastName') && (!value || !value.trim())) {
            error = 'This field is required';
        }

        if (field === 'email') {
            if (!value || !value.trim()) error = 'Email is required';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
        }

        if (!value || !value.trim()) {
            error = 'This field is required';
        }

        /*if (field === 'phone' && value && !/^[0-9]{10,15}$/.test(value)) {
            error = 'Invalid phone number';
        }*/

        setErrors(prev => ({ ...prev, [field]: error }));
        return error;
    };

    const validateForm = () => {
        const newErrors = {};
        const fields = ['firstName', 'lastName', 'email', 'phone', 'position'];

        fields.forEach(field => {
            const error = validateField(field);
            if (error) newErrors[field] = error;
        });

        setErrors(newErrors);
        //return fields.every(field => !errors[field] && formData[field]?.trim());
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        const fields = ['firstName', 'lastName', 'email', 'phone', 'position'];
        const isValid = fields.every(field => {
            const value = formData[field];
            return typeof value === 'string' ? value.trim() : true;
        });
        setIsFormValid(isValid);
    }, [formData, errors]);

    const handleSave = async () => {
        if (activeView === 'password') {
            await handlePasswordUpdate();
        } else {
            if (!validateForm()) return;

            setIsSubmitting(true);
            try {
                const result = await saveCosmicProfile(user.slug, formData);

                if (result.success) {
                    setOriginalData({ ...formData });
                    await updateUserData(user.slug);
                    showAlert('Profile updated successfully', 'success');
                    setShowSaveConfirm(false);
                } else {
                    throw new Error(result.message || 'Failed to update profile');
                }
            } catch (error) {
                console.error('Save error:', error);
                showAlert(error.message || 'Failed to update profile', 'error');
            } finally {
                setIsSubmitting(false);
                setShowSaveConfirm(false);
            }
        }
    };

    const resetForm = () => {
        setFormData(originalData);
        setErrors({});
        setShowCancelConfirm(false);
        setEditingField('');
    }

    const renderField = (label, name, type = 'text') => {
        const isInvalid = type !== 'file' && !formData[name]?.trim();

        return (
            <div className={`profile-${name}`}>
                <p>{label}</p>
                {editingField === name ? (
                    type === 'file' ? (
                        <>
                            <input
                                type="file"
                                name={name}
                                onChange={(e) => handleFileChange(e, name)}
                                autoFocus

                                accept='image/*'
                            />
                        </>
                    ) : (
                        <input
                            name={name}
                            value={formData[name]}
                            onChange={handleChange}
                            onBlur={(e) => {
                                handleBlur(e);
                                setEditingField('');
                            }}
                            autoFocus
                            required
                        />
                    )
                ) : (
                    <div
                        onClick={() => setEditingField(name)}
                        className={`editable-label`}
                    >
                        {type === 'file' ? (
                            // Handle profile picture display
                            <span>
                                {'Click to change picture'}
                            </span>
                        ) : (
                            // Handle other fields
                            formData[name] || <span className="placeholder-text">Click to edit</span>
                        )}
                        <EditRoundedIcon />
                    </div>
                )}
                {errors[name] && <span className="form-error">{errors[name]}</span>}
            </div>
        );
    };


    // In your EditProfile component, add this useEffect
    useEffect(() => {
        const testProfileFetch = async () => {
            try {
                const test = await getCosmicProfile(user.slug);
                console.log('Profile fetch test:', test);
            } catch (err) {
                console.error('Profile fetch failed:', err);
            }
        };
        testProfileFetch();
    }, [user.slug]);

    const handleViewChange = (view) => {
        setActiveView(view);
        setEditingField('');
        setErrors({});

        if (view === 'profile') {
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setPasswordErrors({});
            setHasPasswordChanges(false);
        } else if (view === 'password') {
            setFormData(originalData);
            setErrors({});
            setHasChanges(false);
        }
    };
    const renderButtons = () => (
        <div className="profile-left-left">
            <button
                type="button"
                onClick={() => handleViewChange('profile')}
                className={`view-button ${activeView === 'profile' ? 'active' : ''}`}
            >
                Edit Profile Details
            </button>
            <button
                type="button"
                onClick={() => handleViewChange('password')}
                className={`view-button ${activeView === 'password' ? 'active' : ''}`}
            >
                Change Password
            </button>
        </div>
    );

    const renderSaveCancelButtons = () => {
        // Show buttons when:
        // - In profile view with changes and valid form
        // - In password view with any password field filled
        const showButtons =
            (activeView === 'profile' && hasChanges && isFormValid) ||
            (activeView === 'password' && (
                passwordData.currentPassword ||
                passwordData.newPassword ||
                passwordData.confirmPassword
            ));

        if (!showButtons) return null;

        const handleSaveClick = () => {
            if (activeView === 'profile') {
                if (!validateForm()) {
                    showAlert('Please fix the errors before saving.', 'error');
                    return;
                }
            } else if (activeView === 'password') {
                if (!validatePasswordForm()) {
                    showAlert('Please fix the errors before saving.', 'error');
                    return;
                }
            }

            setShowSaveConfirm(true);
        };

        return (
            <div className="profile-child2">
                <button
                    className="profile-cancel-bt"
                    onClick={() => {
                        if (activeView === 'profile') {
                            resetForm();
                        } else if (activeView === 'password') {
                            setPasswordData({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                            });
                            setPasswordErrors({});
                            setHasPasswordChanges(false);
                        }
                    }}
                    disabled={isSubmitting}
                >
                    Cancel <CancelRoundedIcon />
                </button>
                <button
                    className="profile-save-bt"
                    onClick={handleSaveClick}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? <CircularProgress size={20} /> : <>Save <CheckRoundedIcon /></>}
                </button>
            </div>
        );
    };

    const validatePasswordForm = () => {
        let isValid = true;
        const newErrors = {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            form: ''
        };

        // Basic validation
        if (!passwordData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
            isValid = false;
        }

        if (!passwordData.newPassword) {
            newErrors.newPassword = 'New password is required';
            isValid = false;
        } else if (passwordData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
            isValid = false;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        setPasswordErrors(newErrors);
        return isValid;
    };

    const handlePasswordUpdate = async () => {
        // Clear previous errors
        setPasswordErrors({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
            form: ''
        });

        // Validate form locally first
        if (!validatePasswordForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('http://localhost:5000/update-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    slug: user.slug, // Send user ID instead of slug
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword
                }),
                credentials: 'include' // If using cookies
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific error cases
                if (response.status === 401) {
                    throw new Error('Current password is incorrect');
                }
                throw new Error(data.message || 'Failed to update password');
            }

            // Success case
            showAlert('Password updated successfully', 'success');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setActiveView('profile');
            setShowSaveConfirm(false);
        } catch (error) {
            console.error('Password update error:', error);

            // Set appropriate error message
            if (error.message.includes('Current password')) {
                setPasswordErrors(prev => ({
                    ...prev,
                    currentPassword: error.message
                }));
            } else {
                setPasswordErrors(prev => ({
                    ...prev,
                    form: error.message
                }));
            }

            showAlert(error.message || 'Failed to update password', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when typing starts
        if (field === 'currentPassword') {
            setPasswordErrors(prev => ({
                ...prev,
                currentPassword: ''
            }));
        }

        // Check if all password fields have values to determine if changes exist
        const allFieldsFilled = (
            passwordData.currentPassword.trim() ||
            passwordData.newPassword.trim() ||
            passwordData.confirmPassword.trim()
        );

        setHasPasswordChanges(allFieldsFilled);
    };

    /*const handlePasswordBlur = async (field) => {
        if (field === 'currentPassword' && passwordData.currentPassword) {
            try {
                const profile = await getCosmicProfile(user.slug);

                console.log('Fetched password from profile:', profile.password);
                console.log('Entered current password:', passwordData.currentPassword);

                // Compare the entered password with the one in the database
                if (profile.password === passwordData.currentPassword) {
                    console.log('Password match: true');
                    // Clear the error if the password matches
                    setPasswordErrors(prev => ({
                        ...prev,
                        currentPassword: ''
                    }));
                } else {
                    console.log('Password match: false');
                    // Set an error if the password does not match
                    setPasswordErrors(prev => ({
                        ...prev,
                        currentPassword: 'Current password is incorrect'
                    }));
                }
            } catch (error) {
                console.error('Error validating current password:', error);
                setPasswordErrors(prev => ({
                    ...prev,
                    currentPassword: 'Error validating password'
                }));
            }
        }
    };*/

    const handlePasswordBlur = (field) => {
        if (field === 'currentPassword' && !passwordData.currentPassword) {
            setPasswordErrors(prev => ({
                ...prev,
                currentPassword: 'Current password is required'
            }));
        }
        // Do NOT fetch the profile or compare the password here!
    };

    // Add this helper function
    const renderPasswordField = (label, name) => (
        <div className={`profile-${name}`}>
            <p>{label}</p>
            {editingPasswordField === name ? (
                <input
                    type="password"
                    value={passwordData[name]}
                    onChange={e => handlePasswordChange(name, e.target.value)}
                    onBlur={() => setEditingPasswordField('')}
                    autoFocus
                    className={passwordErrors[name] ? 'invalid' : ''}
                />
            ) : (
                <div
                    className="editable-label"
                    onClick={() => setEditingPasswordField(name)}
                >
                    <span className="placeholder-text">Click to edit</span>
                    <EditRoundedIcon />
                </div>
            )}
            {passwordErrors[name] && (
                <span className="form-error">{passwordErrors[name]}</span>
            )}
        </div>
    );

    const renderPasswordForm = () => (
        <div className="password-form">
            {passwordErrors.form && (
                <div className="form-error-message">
                    {passwordErrors.form}
                </div>
            )}

            <div className="profile-right">
                <div className="profile-right-child">
                    {renderPasswordField('Current Password', 'currentPassword')}
                </div>
                <div className="profile-right-child">
                    {renderPasswordField('New Password', 'newPassword')}
                    {renderPasswordField('Confirm New Password', 'confirmPassword')}
                </div>
            </div>
        </div>
    );


    return (
        <>
            <form onSubmit={(e) => e.preventDefault()}>
                <div className="profile-parent">
                    <div className="profile-child1">
                        {renderButtons()}
                        {activeView === 'profile' ? (
                            <>
                                <div className="profile-left">
                                    <p>Profile Picture</p>
                                    <Avatar
                                        alt="Profile Picture"
                                        src={
                                            formData.profilePicture?.url ||
                                            formData.profilePicture ||
                                            UserIcon
                                        }
                                        className="profile-left-picture"
                                    />
                                    {renderField('', 'profilePicture', 'file')}
                                    {isUploading && <CircularProgress size={20} />}
                                </div>
                                <div className="profile-right">
                                    <div className="profile-right-child">
                                        <div className="profile-firstname">
                                            {renderField('First Name', 'firstName')}
                                        </div>
                                        <div className="profile-lastname">
                                            {renderField('Last Name', 'lastName')}
                                        </div>
                                        <div className="profile-email">
                                            {renderField('Email Address', 'email')}
                                        </div>
                                        <div className="profile-phone">
                                            {renderField('Phone', 'phone')}
                                        </div>
                                        <div className="profile-position">
                                            {renderField('Position', 'position')}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            renderPasswordForm()
                        )}
                    </div>
                    {renderSaveCancelButtons()}
                </div>
            </form>

            {showSaveConfirm && (
                <div className="confirmation-overlay" onClick={() => setShowSaveConfirm(false)}>
                    <div className="confirmation-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Are you sure you want to save these changes?</h3>
                        <div className="modal-buttons">
                            <button onClick={() => setShowSaveConfirm(false)} className="no-bt">
                                No, keep editing.
                            </button>
                            <button onClick={handleSave} className="yes-bt" disabled={isSubmitting}>
                                {isSubmitting ? 'Saving...' : 'Yes, save changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export { EditProfile };
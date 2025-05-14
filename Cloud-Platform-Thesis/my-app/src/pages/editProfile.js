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
    const { user } = useAuth();
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

            const response = await fetch('http://localhost:5000/api/upload-media', {
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
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const result = await saveCosmicProfile(user.slug, formData);

            if (result.success) {
                setOriginalData({ ...formData });
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
    };

    /*const handleCancel = () => {
        if (hasChanges) {
            setShowCancelConfirm(true);
        } else {
            navigate(-1);
        }
    };*/

    const resetForm = () => {
        setFormData(originalData);
        setErrors({});
        setShowCancelConfirm(false);
        setEditingField('');
    }

    const renderField = (label, name, type = 'text') => {
        //console.log(`Rendering field: ${name}, type: ${type}`);
        const isInvalid = type !== 'file' && !formData[name]?.trim();

        return (
            <div className={`profile-${name}`}>
                <p>{label}</p>
                {editingField === name ? (
                    type === 'file' ? (
                        <>
                            {console.log('Rendering file input for:', name)}
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
                                {typeof formData[name] === 'object'
                                    ? formData[name].url
                                    : formData[name] || 'Click to upload picture'}
                            </span>
                        ) : (
                            // Handle other fields
                            formData[name] || <span className="placeholder-text">Click to edit</span>
                        )}                        <EditRoundedIcon />
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


    return (
        <>
            <form onSubmit={(e) => {
                e.preventDefault();
                //setShowSaveConfirm(true);
            }}>
                <div className="profile-parent">
                    <div className="profile-child1">
                        <div className="profile-left">
                            <Avatar alt="Profile Picture"
                                src={
                                    formData.profilePicture?.url || // First check for object with url
                                    formData.profilePicture || // Then check for direct URL string
                                    UserIcon // Fallback to default
                                }
                            />

                            {renderField('Profile Picture', 'profilePicture', 'file')}
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
                            </div>
                            <div className="profile-right-child">
                                <div className="profile-email">
                                    {renderField('Email Address', 'email')}
                                </div>
                                <div className="profile-phone">
                                    {renderField('Phone', 'phone')}
                                </div>
                            </div>
                            <div className="profile-right-child">
                                <div className="profile-position">
                                    {renderField('Position', 'position')}
                                </div>
                            </div>
                        </div>
                    </div>
                    {hasChanges && isFormValid && (
                        <div className="profile-child2">
                            <button
                                className="profile-cancel-bt"
                                onClick={resetForm}
                                disabled={isSubmitting}
                            >
                                Cancel <CancelRoundedIcon />
                            </button>
                            <button
                                className="profile-save-bt"
                                onClick={() => setShowSaveConfirm(true)}
                                disabled={!hasChanges || isSubmitting}
                            >
                                {isSubmitting ? <CircularProgress size={20} /> : <>Save <CheckRoundedIcon /></>}
                            </button>
                        </div>
                    )}
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
    )
}

export { EditProfile };
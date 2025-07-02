import React from 'react';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CircularProgress from '@mui/material/CircularProgress';

function ProfileCard({ profile, onDelete, isDeleting }) {
    return (
        <div className="profile-card">
            <div className="card-head">
                <div className='card-title'>
                    <h4>{profile.metadata.firstname} {profile.metadata.lastname}</h4>
                    <p>{profile.metadata.email}</p>
                    <p>{profile.metadata.position}</p>
                </div>
            </div>
            <div className="image-container">
                <img
                    src={profile.metadata.profilepicture.url}
                    alt="Profile"
                    className="profile-avatar"
                    width="100%"
                />
            </div>
            <div className='card-buttons'>
                <button
                    className="card-delete"
                    onClick={() => onDelete(profile.id)}
                    disabled={isDeleting}
                >
                    {isDeleting ? '' : <DeleteRoundedIcon />}
                    {isDeleting ? <CircularProgress size={20} /> : 'Delete'}
                </button>
            </div>
        </div>
    );
}

export { ProfileCard };
import '../App.css';
import UserIcon from '../resources/profile.png'
import { useAuth } from '../hooks/useAuth';

//Material UI
import Avatar from '@mui/material/Avatar';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function OverlayProfile({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const overlayRef = useRef(null);

    const handleLogout = () => {
        logout();
        onClose();
        navigate('/login');
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (overlayRef.current && !overlayRef.current.contains(event.target)) {
                onClose(); // Reuse your existing onClose logic!
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!user) {
        console.warn('OverlayProfile rendered without user');
        return null;
    };

    return (
        <>
            {
                isOpen ? (
                    <div className='overlay-profile' ref={overlayRef}>
                        <div className='overlay-profile-head'>
                            <Avatar alt="User icon" src={UserIcon} />
                            <h1>Hello, {user.firstname}</h1>
                        </div>
                        <div className='profile-overlay-parent'>
                            <div className='profile-overlay-child1'>
                                <h2>{user.firstname} {user.lastname}</h2>
                                <p>{user.position}</p>
                            </div>
                            <div className='profile-overlay-child2'>
                                <div className='profile-overlay-grandchild'>
                                    <h2>E-mail</h2>
                                    <p>{user.email}</p>
                                </div>
                                <div className='profile-overlay-grandchild'>
                                    <h2>Phone</h2>
                                    <p>{user.phone}</p>
                                </div>
                            </div>
                        </div>
                        <div className='profile-overlay-bts'>
                            <button className='logout-bt' onClick={handleLogout}>
                                Logout
                                <LogoutRoundedIcon />
                            </button>
                            <NavLink to="/editProfile" className='edit-bt-nav'>
                                <button className='edit-bt' onClick={onClose}>
                                    Edit
                                    <EditRoundedIcon />
                                </button>
                            </NavLink>
                        </div>
                    </div>
                ) : null
            }
        </>
    )
}

export { OverlayProfile };
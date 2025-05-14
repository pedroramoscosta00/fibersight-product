// src/hooks/useAuth.js
import { useEffect, useState } from 'react';
import { getCosmicProfile } from '../components/cosmic';

export const useAuth = () => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user_data');
        return storedUser ? JSON.parse(storedUser) : null;
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const validateSession = async () => {
            const token = localStorage.getItem('cosmic_token');
            if (token) {
                try {
                    const profile = await getCosmicProfile(token); // Use token (slug) to fetch profile
                    setUser({ ...profile, slug: token }); // Include slug in user object
                } catch (error) {
                    console.error('Session validation failed:', error);
                    logout();
                }
            }
            setIsLoading(false);
        };
        validateSession();
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('cosmic_token', token);
        localStorage.setItem('user_data', JSON.stringify(userData));
        setUser({ ...userData, slug: token }); // Include slug in user object
    };

    const logout = () => {
        localStorage.removeItem('cosmic_token');
        localStorage.removeItem('user_data');
        setUser(null);
    };

    return { user, isLoading, login, logout };
};
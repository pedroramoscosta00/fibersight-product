// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { getCosmicProfile } from './cosmic';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const profile = await getCosmicProfile(token);
                    setUser(profile);
                } catch (error) {
                    console.error('Session validation failed:', error);
                    logout();
                }
            }
            setIsLoading(false);
        };
        initializeAuth();
    }, []);

    const login = (token, userData) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateUserData = async () => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const updatedProfile = await getCosmicProfile(token);
            const userData = { ...updatedProfile, slug: token };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('✅ User updated in context:', userData);
        } catch (error) {
            console.error('Failed to update user data:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updateUserData }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
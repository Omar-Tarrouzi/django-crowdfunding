import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/api';

const Logout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const performLogout = async () => {
            try {
                await logout();
                // Clear all auth-related data
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('username');
                localStorage.removeItem('userRole');
                
                // Dispatch custom event for logout
                window.dispatchEvent(new Event('logout'));
                
                // Redirect to login page
                navigate('/login');
            } catch (error) {
                console.error('Logout error:', error);
                // Even if there's an error, clear local storage and redirect
                localStorage.clear();
                window.dispatchEvent(new Event('logout'));
                navigate('/login');
            }
        };

        performLogout();
    }, [navigate]);

    return null; // This component doesn't render anything
};

export default Logout; 
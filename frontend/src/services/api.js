import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Helper function to check if user is authenticated
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
};

// Helper function to get user role
export const getUserRole = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.role || null;
};

// Login function
export const login = async (username, password) => {
    try {
        const response = await api.post('/auth/login/', {
            username,
            password
        });

        if (response.data.token) {
            // Store tokens
            localStorage.setItem('token', response.data.token.access);
            localStorage.setItem('refreshToken', response.data.token.refresh);
            
            // Store user data
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('username', response.data.user.username);
            localStorage.setItem('userRole', response.data.user.role);
        }

        return response.data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// Logout function
export const logout = async () => {
    try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            await api.post('/auth/logout/', {
                refresh_token: refreshToken
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Clear all auth-related data
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
    }
};

// Register function
export const register = async (userData) => {
    try {
        const response = await api.post('/auth/register/', userData);
        return response.data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

// Get user info
export const getUserInfo = async () => {
    try {
        const response = await api.get('/auth/user/');
        return response.data;
    } catch (error) {
        console.error('Get user info error:', error);
        throw error;
    }
};

export const getProjects = async () => {
    try {
        const response = await api.get('/projects/');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getProjectDetails = async (projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}/`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const createProject = async (projectData) => {
    try {
        const response = await api.post('/projects/', projectData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateProject = async (projectId, projectData) => {
    try {
        const response = await api.put(`/projects/${projectId}/`, projectData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteProject = async (projectId) => {
    try {
        await api.delete(`/projects/${projectId}/`);
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const toggleFavorite = async (projectId) => {
    try {
        const response = await api.post(`/projects/${projectId}/favorite/`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getFavoriteProjects = async () => {
    try {
        const response = await api.get('/favorites/');
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const makeDonation = async (projectId, donationData) => {
    try {
        const response = await api.post(`/projects/${projectId}/donate/`, donationData);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getToken = () => {
    return localStorage.getItem('token');
};

export default api; 
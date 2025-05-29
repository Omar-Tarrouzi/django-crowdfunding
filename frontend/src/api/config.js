import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
    timeout: 10000 // 10 seconds timeout
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle errors and token refresh
api.interceptors.response.use(
    (response) => {
        console.log('Response received:', response.status);
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        
        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }
                
                // Try to refresh the token
                const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
                    refresh: refreshToken
                });
                
                const { access } = response.data;
                localStorage.setItem('token', access);
                
                // Retry the original request with the new token
                originalRequest.headers.Authorization = `Bearer ${access}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        console.error('Response error:', {
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
        });

        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
        } else if (error.response?.status === 500) {
            console.error('Server error:', error.response.data);
        } else if (!error.response) {
            console.error('Network error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api; 
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import axios from 'axios';

// Helper function to get CSRF token
const getCSRFToken = () => {
  const name = 'csrftoken';
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
};

const Login = () => {
  console.log('Login component rendered');
  
  useEffect(() => {
    console.log('Login component mounted');
  }, []);

  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    console.log('Form field changed:', name, value);
    setCredentials((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login...');
      // Optionally, pass CSRF token if your backend requires it
      const csrfToken = getCSRFToken();
      const data = await login(
        credentials.username,
        credentials.password,
        csrfToken // Pass as third argument if your login() supports it
      );
      console.log('Login response:', data);

      if (data.token) {
        // Store tokens
        localStorage.setItem('token', data.token.access);
        localStorage.setItem('refreshToken', data.token.refresh);
        
        // Store user data
        const userData = {
          ...data.user,
          role: data.user.role || 'donor' // Ensure role is set
        };
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('username', userData.username);
        localStorage.setItem('userRole', userData.role);
        
        // Debug logs
        console.log('Stored user data:', {
          user: JSON.parse(localStorage.getItem('user')),
          username: localStorage.getItem('username'),
          role: localStorage.getItem('userRole')
        });

        // Dispatch custom event for login
        const loginEvent = new Event('login');
        window.dispatchEvent(loginEvent);
        
        // Redirect based on role
        if (userData.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (userData.role === 'creator') {
          navigate('/projects');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      // Improved error logging for debugging
      if (error.response) {
        console.error('Login error:', error.response.status, error.response.data);
        setError(
          error.response.data.detail ||
          error.response.data.message ||
          'Identifiants invalides ou accès refusé'
        );
      } else {
        console.error('Login error:', error);
        setError(error.message || 'Une erreur est survenue lors de la connexion');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Connexion</h2>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={credentials.username}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="d-grid">
                <button
                  type="submit"
                    className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Connexion en cours...' : 'Se connecter'}
                </button>
                </div>
              </form>
              <div className="mt-3 text-center">
                <p>
                  Vous n'avez pas de compte ?{' '}
                  <a href="/signup" className="text-decoration-none">
                    S'inscrire
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
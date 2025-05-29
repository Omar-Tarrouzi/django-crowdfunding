import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert } from 'react-bootstrap';
import axios from 'axios';

const SignUp = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    user_type: 'donneur' // default role (French spelling)
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [csrfToken, setCsrfToken] = useState('');
  const navigate = useNavigate();

  // Get CSRF token on component mount
  useEffect(() => {
    const getCsrfToken = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/auth/csrf-token/', {
          withCredentials: true
        });
        setCsrfToken(response.data.csrfToken);
      } catch (err) {
        console.error('Error getting CSRF token:', err);
      }
    };
    getCsrfToken();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    if (!csrfToken) {
      setError('CSRF token manquant. Veuillez rafraîchir la page.');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      setLoading(false);
      return;
    }

    try {
      // Prepare the data to send
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        // Convert to backend expected value if needed
        role: formData.user_type === 'donneur' ? 'donor' : (formData.user_type === 'createur' ? 'creator' : formData.user_type)
      };

      console.log('Attempting signup with data:', userData);
      
      const response = await axios.post(
        'http://localhost:8000/api/auth/register/', // <-- corrigez ici
        userData,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
          },
          withCredentials: true
        }
      );

      console.log('Server response:', response.data);

      // Store user information
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('username', response.data.user.username);
      localStorage.setItem('userRole', response.data.user.role);
      navigate('/');
    } catch (error) {
      console.error('Signup error details:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      if (error.message === 'Failed to fetch') {
        setError('Impossible de se connecter au serveur. Veuillez vérifier que le serveur est en cours d\'exécution.');
      } else if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data) {
        const errors = Object.entries(error.response.data)
          .map(([field, messages]) => {
            if (Array.isArray(messages)) {
              return `${field}: ${messages.join(', ')}`;
            } else {
              return `${field}: ${messages}`;
            }
          })
          .join('\n');
        setError(errors);
      } else {
        setError(error.message || 'Une erreur est survenue lors de l\'inscription');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Inscription</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom d'utilisateur</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Prénom</Form.Label>
                  <Form.Control
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Nom</Form.Label>
                  <Form.Control
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Confirmer le mot de passe</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Rôle</Form.Label>
                  <Form.Select
                    name="user_type"
                    value={formData.user_type}
                    onChange={handleChange}
                  >
                    <option value="donneur">Donneur</option>
                    <option value="createur">Créateur</option>
                  </Form.Select>
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? 'Inscription en cours...' : 'S\'inscrire'}
                </Button>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default SignUp;
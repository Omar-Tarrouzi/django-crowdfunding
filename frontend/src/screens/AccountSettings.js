import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, TextField, Button, Alert, Paper, CircularProgress } from '@mui/material';

const AccountSettings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    // ...add more fields as needed
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/user/me/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setUser(data);
        setFormData({
          username: data.username,
          email: data.email,
          // ...add more fields as needed
        });
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchUser();
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
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/user/me/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }
  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 6 }}>
        <Alert severity="error">Utilisateur introuvable</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4, background: "rgba(255,255,255,0.98)" }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700, color: "#1e90ff" }}>
          Paramètres du compte
        </Typography>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            mt: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 3
          }}
        >
          <TextField
            label="Nom d'utilisateur"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined"
            InputProps={{
              style: { borderRadius: 8 }
            }}
          />
          <TextField
            label="Adresse email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
            variant="outlined"
            InputProps={{
              style: { borderRadius: 8 }
            }}
          />
          {/* ...add more fields as needed... */}
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              fontWeight: 600,
              borderRadius: 8,
              py: 1.5,
              mt: 2,
              background: "linear-gradient(90deg, #1e90ff 60%, #47ffb5 100%)"
            }}
            disabled={loading}
          >
            {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </Box>
        {success && (
          <Alert severity="success" sx={{ mt: 3 }}>
            Modifications enregistrées avec succès !
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default AccountSettings;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Container,
  Paper,
  Alert,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import axios from 'axios';

const DonateForm = ({ onDonationSuccess }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    amount: '',
    cardNumber: '',
    cardExpiry: '',
    cardCVV: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creatorEmail, setCreatorEmail] = useState('');

  // Fetch project to get creator email
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/projects/${projectId}/`);
        if (res.data && res.data.createur && res.data.createur.email) {
          setCreatorEmail(res.data.createur.email);
        }
      } catch (e) {
        setCreatorEmail('');
      }
    };
    if (projectId) fetchProject();
  }, [projectId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!projectId) {
      setError('No project selected for donation.');
      setLoading(false);
      return;
    }

    const amountValue = parseFloat(formData.amount);
    if (
      !formData.amount ||
      isNaN(amountValue) ||
      amountValue < 1 ||
      !Number.isInteger(amountValue)
    ) {
      setError('Veuillez entrer un montant entier valide (minimum 1).');
      setLoading(false);
      return;
    }

    // Simple validation for card fields (not stored)
    if (!formData.cardNumber.trim() || !/^\d{13,19}$/.test(formData.cardNumber)) {
      setError('Please enter a valid credit card number.');
      setLoading(false);
      return;
    }
    if (!formData.cardExpiry.trim() || !/^\d{2}\/\d{2,4}$/.test(formData.cardExpiry)) {
      setError('Please enter a valid expiry date (MM/YY or MM/YYYY).');
      setLoading(false);
      return;
    }
    if (!formData.cardCVV.trim() || !/^\d{3,4}$/.test(formData.cardCVV)) {
      setError('Please enter a valid CVV.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login', { state: { from: `/project/${projectId}/donate` } });
        return;
      }

      // Only send montant to backend
      await axios.post(
        `http://localhost:8000/api/projects/${projectId}/donate/`,
        {
          montant: amountValue
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess('Donation successful! Thank you for your support.');
      setFormData({
        amount: '',
        cardNumber: '',
        cardExpiry: '',
        cardCVV: ''
      });

      // Call parent callback to refresh project detail
      if (typeof onDonationSuccess === 'function') {
        onDonationSuccess();
      }

      setTimeout(() => {
        navigate(`/project/${projectId}`);
      }, 2000);
    } catch (err) {
      console.error('Donation error:', err);
      const errorMessage = err.response?.data?.detail || 
                         err.response?.data?.message || 
                         err.response?.data?.error ||
                         'An error occurred while processing your donation.';
      setError(errorMessage);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { state: { from: `/project/${projectId}/donate` } });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Faites un don
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            id="amount"
            label="montant"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            InputProps={{
              inputProps: { 
                min: 1,
                step: 1
              }
            }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="cardNumber"
            label="numéro de carte"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleChange}
            inputProps={{ maxLength: 19 }}
            sx={{ mt: 2 }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="cardExpiry"
            label="date d'expiration (MM/YY)"
            name="cardExpiry"
            value={formData.cardExpiry}
            onChange={handleChange}
            placeholder="MM/YY"
            sx={{ mt: 2 }}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            id="cardCVV"
            label="CVV"
            name="cardCVV"
            value={formData.cardCVV}
            onChange={handleChange}
            inputProps={{ maxLength: 4 }}
            sx={{ mt: 2 }}
          />

          <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 2 }}>
            {creatorEmail
              ? `Contactez le créateur à ${creatorEmail} si vous voulez contribuer autrement`
              : "Email du créateur non disponible"}
          </Typography>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'confirmer'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default DonateForm;
// No changes needed in this file for the footer color.
// The footer color should be set in your layout or App component, not in DonateForm.
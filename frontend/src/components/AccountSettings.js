import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Typography, Box, CircularProgress, Alert, List, ListItem, ListItemText } from '@mui/material';

const DonationHistory = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDonations = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:8000/api/donations/history/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setDonations(response.data);
      } catch (err) {
        setError('Erreur lors du chargement de l\'historique des dons.');
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Mon historique de donations
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {donations.length === 0 ? (
        <Typography>Aucun don trouvé.</Typography>
      ) : (
        <List>
          {donations.map((donation) => (
            <ListItem key={donation.id}>
              <ListItemText
                primary={`Projet : ${donation.project_title || donation.project}`}
                secondary={`Montant : ${donation.montant} € | Date : ${new Date(donation.date).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Container>
  );
};

export default DonationHistory;
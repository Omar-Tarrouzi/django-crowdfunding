import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CardMedia, 
  Button, 
  Grid, 
  Alert, 
  CircularProgress 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const FavoriteProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        // Use the correct endpoint (should match your Django backend)
        const response = await axios.get('http://localhost:8000/api/favorite-projects/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setProjects(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des projets favoris.');
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
        <Typography>Aucun projet favori trouvé.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Mes projets favoris
      </Typography>
      <Grid container spacing={3}>
        {projects.map((project) => (
          <Grid item xs={12} md={6} lg={4} key={project.id}>
            <Card>
              {project.image ? (
                <CardMedia
                  component="img"
                  height="160"
                  image={
                    project.image.startsWith('http')
                      ? project.image
                      : `http://localhost:8000${project.image}`
                  }
                  alt={project.titre}
                />
              ) : (
                <Box sx={{
                  height: 160,
                  bgcolor: '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2">Pas d'image</Typography>
                </Box>
              )}
              <CardContent>
                <Typography variant="h6" component="div">
                  {project.titre}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {project.description?.slice(0, 100)}...
                </Typography>
                <Typography variant="body2">
                  <strong>Montant récolté:</strong> {project.montant_recolte} / {project.montant_objectif} DH
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate(`/project/donate/${project.id}`)}
                  >
                    Refaire un don
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    Voir le projet
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FavoriteProjects;
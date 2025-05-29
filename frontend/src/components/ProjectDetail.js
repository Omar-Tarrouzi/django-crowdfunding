import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardMedia,
  Chip
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:8000/api/projects/${projectId}/`,
        {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        }
      );
      setProject(response.data);
      setIsFavorite(response.data.is_favorite);
    } catch (err) {
      setError('Erreur lors du chargement du projet');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      await axios.post(
        `http://localhost:8000/api/projects/${projectId}/toggle-favorite/`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      setIsFavorite(!isFavorite);
    } catch (err) {
      setError('Erreur lors de la mise à jour des favoris');
    }
  };

  const handleDonate = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    navigate(`/donate/${projectId}`);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!project) return <Alert severity="error">Projet non trouvé</Alert>;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 2 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            {project.image && (
              <CardMedia
                component="img"
                height="400"
                image={project.image}
                alt={project.titre}
                sx={{ objectFit: 'cover', borderRadius: 1 }}
              />
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {project.titre}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                {project.description}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Objectif : {project.montant_objectif} DH
              </Typography>
              <Typography variant="h6" gutterBottom>
                Récolté : {project.montant_recolte} DH
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avancement : {project.avancement}%
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleDonate}
                fullWidth
              >
                Faire un don
              </Button>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleFavorite}
                startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              >
                {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
              </Button>
            </Box>

            {project.paliers && project.paliers.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Paliers de don
                </Typography>
                <Grid container spacing={2}>
                  {project.paliers.map((palier) => (
                    <Grid item xs={12} sm={6} key={palier.id}>
                      <Card sx={{ bgcolor: palier.couleur + '10' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {palier.titre}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {palier.montant} DH
                          </Typography>
                          <Typography variant="body2">
                            {palier.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProjectDetail; 
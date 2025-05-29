import { useEffect, useState } from 'react';
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
  const [favoriteProjects, setFavoriteProjects] = useState([]);
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

        // Use the correct endpoint for favorite projects (should match your backend)
        const response = await axios.get('http://localhost:8000/api/favorite-projects/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setFavoriteProjects(response.data);
      } catch (err) {
        setError('Erreur lors du chargement des projets favoris.');
        console.error(err);
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

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: "#1e90ff", mb: 3 }}>
        <span style={{ borderBottom: "3px solid #47ffb5", paddingBottom: 4 }}>Mes projets favoris</span>
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {favoriteProjects.length === 0 ? (
        <Typography>Vous n'avez pas encore de projets favoris.</Typography>
      ) : (
        <Grid container spacing={4}>
          {favoriteProjects.map(project => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 8px 32px rgba(30,144,255,0.10)",
                  transition: "transform 0.25s cubic-bezier(.4,2,.3,1), box-shadow 0.25s cubic-bezier(.4,2,.3,1)",
                  '&:hover': {
                    transform: "translateY(-10px) scale(1.03)",
                    boxShadow: "0 16px 48px 0 rgba(30,144,255,0.18), 0 2px 8px rgba(30,144,255,0.10)",
                    borderColor: "#1e90ff"
                  },
                  border: "2px solid #e3e3e3",
                  background: "#fff"
                }}
              >
                {project.image ? (
                  <CardMedia
                    component="img"
                    height="180"
                    image={
                      project.image.startsWith('http')
                        ? project.image
                        : `http://localhost:8000${project.image}`
                    }
                    alt={project.titre}
                    sx={{
                      objectFit: "cover",
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                      borderBottom: "3px solid #1e90ff"
                    }}
                  />
                ) : (
                  <Box sx={{ 
                    height: 180, 
                    bgcolor: '#f0f0f0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12
                  }}>
                    <Typography variant="body2">Pas d'image</Typography>
                  </Box>
                )}
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 700, color: "#1e90ff", mb: 1 }}>
                    {project.titre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, minHeight: 40 }}>
                    {project.description?.slice(0, 100)}...
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: "#47ffb5" }}>
                      <strong>Montant récolté:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {project.montant_recolte} / {project.montant_objectif} Dh
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      sx={{ fontWeight: 600, borderRadius: 2, boxShadow: "0 2px 8px #2ecc71" }}
                      onClick={() => navigate(`/donate/${project.id}`)}
                    >
                      reFaire un don
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      sx={{ fontWeight: 600, borderRadius: 2 }}
                      onClick={() => navigate(`/project/${project.id}`)}
                    >
                      Voir le projet
                    </Button>
                    <Button
                      variant="text"
                      color="error"
                      sx={{ fontWeight: 600, borderRadius: 2 }}
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          await axios.post(
                            `http://localhost:8000/api/project/${project.id}/favorite/`,
                            { remove: true },
                            {
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              }
                            }
                          );
                          setFavoriteProjects(favoriteProjects.filter(p => p.id !== project.id));
                        } catch (err) {
                          alert("Erreur lors du retrait des favoris");
                        }
                      }}
                    >
                      Retirer
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default FavoriteProjects;
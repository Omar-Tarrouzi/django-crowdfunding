import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { IconButton, Tooltip } from '@mui/material';

const FavoriteButton = ({ projectId, onFavorite, initialFavorited = false }) => {
  const [loading, setLoading] = useState(false);
  const [favorited, setFavorited] = useState(initialFavorited);

  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  const handleFavorite = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      if (!favorited) {
        // Add to favorites
        await axios.post(
          `http://localhost:8000/api/project/${projectId}/favorite/`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setFavorited(true);
      } else {
        // Remove from favorites (POST with remove: true)
        await axios.post(
          `http://localhost:8000/api/project/${projectId}/favorite/`,
          { remove: true },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        setFavorited(false);
      }
      if (onFavorite) onFavorite();
    } catch (err) {
      alert('Erreur lors de la modification des favoris');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tooltip title={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}>
      <span>
        <IconButton
          sx={{
            backgroundColor: favorited ? '#fff' : 'transparent',
            border: favorited ? '1px solid #f44336' : 'none',
            transition: 'background 0.2s, border 0.2s'
          }}
          onClick={handleFavorite}
          disabled={loading}
          aria-label="like"
        >
          <FavoriteIcon sx={{ color: favorited ? '#f44336' : 'inherit' }} />
        </IconButton>
      </span>
    </Tooltip>
  );
};

export default FavoriteButton;

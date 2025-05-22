import React, { useState, useEffect } from 'react';

const FavoriteProjects = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/favorites/');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setFavorites(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (favorites.length === 0) return <div>No favorite projects found</div>;

  return (
    <div>
      <h1>Favorite Projects</h1>
      <ul>
        {favorites.map((favorite) => (
          <li key={favorite.id}>
            <h2>{favorite.project.title}</h2>
            <p>{favorite.project.description}</p>
            {/* Add more JSX to display other project fields */}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FavoriteProjects; 
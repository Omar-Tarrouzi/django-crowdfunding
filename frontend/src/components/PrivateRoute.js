import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
    return <Navigate to="/login" replace />;
  }

  // Si l'utilisateur est authentifié, afficher le composant enfant
  return children;
};

export default PrivateRoute; 
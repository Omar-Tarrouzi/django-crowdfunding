import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Debug logs for user and role
  useEffect(() => {
    console.log('Navbar - Current user:', user);
    console.log('Navbar - User role:', user?.role);
  }, [user]);

  useEffect(() => {
    // Initialize Bootstrap dropdowns
    const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
    const dropdownList = [...dropdownElementList].map(dropdownToggleEl => {
      return new window.bootstrap.Dropdown(dropdownToggleEl);
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Helper functions to check user roles
  const isCreator = () => {
    const role = user?.role?.toLowerCase();
    console.log('Navbar - Checking creator role:', role);
    return role === 'createur';
  };

  const isDonor = () => {
    const role = user?.role?.toLowerCase();
    console.log('Navbar - Checking donor role:', role);
    return role === 'donneur';
  };

  const isAdmin = () => {
    const role = user?.role?.toLowerCase();
    console.log('Navbar - Checking admin role:', role);
    return role === 'admin';
  };

  // Debug log for menu items
  useEffect(() => {
    console.log('Navbar - Menu visibility:', {
      isCreator: isCreator(),
      isDonor: isDonor(),
      isAdmin: isAdmin()
    });
  }, [user]);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link className="navbar-brand" to="/">Crowdfunding</Link>
        <button 
          className="navbar-toggler" 
          type="button" 
          onClick={toggleMenu}
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/" onClick={() => setIsMenuOpen(false)}>Accueil</Link>
            </li>
            
            {user && (
              <>
                {/* Menu items for authenticated users */}
                {isDonor() && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/favorites" onClick={() => setIsMenuOpen(false)}>Favoris</Link>
                  </li>
                )}
                
                {/* Menu items for creators */}
                {isCreator() && (
                  <>
                    <li className="nav-item">
                      <Link className="nav-link" to="/my-projects" onClick={() => setIsMenuOpen(false)}>Mes Projets</Link>
                    </li>
                    <li className="nav-item">
                      <Link className="nav-link" to="/create-project" onClick={() => setIsMenuOpen(false)}>Créer un Projet</Link>
                    </li>
                  </>
                )}
                
                {/* Menu items for admins */}
                {isAdmin() && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/admin/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                  </li>
                )}
              </>
            )}
          </ul>
          
          <ul className="navbar-nav">
            {user ? (
              <>
                <li className="nav-item dropdown">
                  <button 
                    className="nav-link dropdown-toggle" 
                    type="button"
                    id="accountDropdown"
                    data-bs-toggle="dropdown" 
                    aria-expanded="false"
                  >
                    Mon Compte
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
                    <li>
                      <Link 
                        className="dropdown-item" 
                        to="/profile" 
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fas fa-user me-2"></i>Profil
                      </Link>
                    </li>
                    <li>
                      <Link 
                        className="dropdown-item" 
                        to="/account-settings" 
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <i className="fas fa-cog me-2"></i>Paramètres
                      </Link>
                    </li>
                    
                    {/* Menu items for donors */}
                    {isDonor() && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <Link 
                            className="dropdown-item" 
                            to="/favorites" 
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <i className="fas fa-heart me-2"></i>Mes Favoris
                          </Link>
                        </li>
                        <li>
                          <Link 
                            className="dropdown-item" 
                            to="/my-donations" 
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <i className="fas fa-hand-holding-usd me-2"></i>Mes Dons
                          </Link>
                        </li>
                      </>
                    )}
                    
                    {/* Menu items for creators */}
                    {isCreator() && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <Link 
                            className="dropdown-item" 
                            to="/my-projects" 
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <i className="fas fa-list me-2"></i>Mes Projets
                          </Link>
                        </li>
                        <li>
                          <Link 
                            className="dropdown-item" 
                            to="/create-project" 
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <i className="fas fa-plus me-2"></i>Créer un Projet
                          </Link>
                        </li>
                        <li>
                          <Link 
                            className="dropdown-item" 
                            to="/manage-projects" 
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <i className="fas fa-edit me-2"></i>Gérer mes Projets
                          </Link>
                        </li>
                      </>
                    )}
                    
                    {/* Menu items for admins */}
                    {isAdmin() && (
                      <>
                        <li><hr className="dropdown-divider" /></li>
                        <li>
                          <Link 
                            className="dropdown-item" 
                            to="/admin/dashboard" 
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <i className="fas fa-tachometer-alt me-2"></i>Dashboard Admin
                          </Link>
                        </li>
                      </>
                    )}
                    
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button 
                        className="dropdown-item text-danger" 
                        onClick={handleLogout}
                      >
                        <i className="fas fa-sign-out-alt me-2"></i>Déconnexion
                      </button>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login" onClick={() => setIsMenuOpen(false)}>Connexion</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register" onClick={() => setIsMenuOpen(false)}>Inscription</Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 
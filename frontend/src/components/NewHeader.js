import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/img/Logoalt.gif';
import userIcon from '../assets/img/user_icon.gif';

const NewHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();
  const [currentUser, setCurrentUser] = useState(user);

  // Listen for login/logout events to force header update
  useEffect(() => {
    const handleAuthChange = () => {
      setDropdownOpen(false);
      // Force update user from localStorage (or context)
      setCurrentUser(JSON.parse(localStorage.getItem('user')) || null);
    };
    window.addEventListener('login', handleAuthChange);
    window.addEventListener('logout', handleAuthChange);
    return () => {
      window.removeEventListener('login', handleAuthChange);
      window.removeEventListener('logout', handleAuthChange);
    };
  }, []);

  // Sync with context user (for direct context changes)
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = () => {
    logout();
    setCurrentUser(null); // Immediately update header on logout
    window.dispatchEvent(new Event('logout')); // Notify other tabs/components
    setDropdownOpen(false); // Close dropdown immediately

    // Clear all user-related data from localStorage to avoid stale session
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');

    // Optionally, force a reload to clear any cached auth state
    navigate('/login');
    setTimeout(() => window.location.reload(), 100);
  };

  return (
    <nav
      className="navbar navbar-expand-lg"
      style={{
        background: 'linear-gradient(to right, #1e90ff, #47ffb5)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          <img src={logo} alt="Logo" height="70" />
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarColor01"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarColor01">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link active" to="/">
                Accueil
              </Link>
            </li>
          </ul>
          {currentUser ? (
            <div className="dropdown" ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                className="btn btn-light dropdown-toggle"
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                aria-expanded={dropdownOpen}
                id="accountMenu"
                style={{ marginRight: '10px' }} // Move the button 10px to the left
              >
                <img
                  src={userIcon}
                  alt="User"
                  height="30"
                  style={{ marginRight: 8 }}
                />
                {currentUser.username}
              </button>
              <ul
                className={`dropdown-menu dropdown-menu-end${
                  dropdownOpen ? ' show' : ''
                }`}
                aria-labelledby="accountMenu"
                style={{
                  minWidth: 200,
                  right: 0,
                  left: 'auto',
                  transform: 'translateX(-10px)', // Move dropdown 10px to the left
                }}
              >
                <li>
                  <Link
                    className="dropdown-item"
                    to="/account"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <i className="fas fa-cog"></i> Mon compte
                  </Link>
                </li>
                <li>
                  <Link
                    className="dropdown-item"
                    to="/favorites"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <i className="fas fa-heart"></i> Mes favoris
                  </Link>
                </li>
                {currentUser.role === 'createur' && (
                  <>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/projects/create"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <i className="fas fa-plus-circle"></i> Créer un projet
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/projects"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <i className="fas fa-list"></i> Mes projets
                      </Link>
                    </li>
                  </>
                )}
                {currentUser.role === 'admin' && (
                  <>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/admin/dashboard"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <i className="fas fa-tachometer-alt"></i> Dashboard Admin
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i> Déconnexion
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link className="btn btn-light" to="/login">
              <i className="fas fa-sign-in-alt"></i> Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NewHeader;
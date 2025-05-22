import React from 'react';
import { Link } from 'react-router-dom';
import { FaSignInAlt, FaSignOutAlt, FaCog, FaHeart, FaPlusCircle, FaEdit } from 'react-icons/fa';

function Header() {
    const isAuthenticated = localStorage.getItem('token') !== null;
    const userRole = localStorage.getItem('userRole') || 'donor'; // Default to donor if not set

    return (
        <nav className="navbar navbar-expand-lg bg-primary" data-bs-theme="dark">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">
                    <img 
                        src="/img/Logoalt.gif" 
                        alt="Logo" 
                        height="70"
                        onError={(e) => {
                            e.target.onerror = null; 
                            e.target.src = "https://via.placeholder.com/70x70?text=Logo";
                        }}
                    />
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
                            <Link className="nav-link active" to="/">Accueil</Link>
                        </li>
                    </ul>

                    {isAuthenticated ? (
                        <div className="dropdown">
                            <button
                                className="btn btn-light dropdown-toggle"
                                type="button"
                                id="accountMenu"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                            >
                                <img 
                                    src="/img/user_icon.gif" 
                                    alt="User" 
                                    height="30"
                                    onError={(e) => {
                                        e.target.onerror = null; 
                                        e.target.src = "https://via.placeholder.com/30x30?text=User";
                                    }}
                                />{" "}
                                {localStorage.getItem('username') || 'User'}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountMenu">
                                <li>
                                    <Link className="dropdown-item" to="/account">
                                        <FaCog className="me-2" />Mon compte
                                    </Link>
                                </li>
                                <li>
                                    <Link className="dropdown-item" to="/favorites">
                                        <FaHeart className="me-2" />Mes favoris
                                    </Link>
                                </li>
                                
                                {userRole === "creator" && (
                                    <>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <Link className="dropdown-item" to="/projects/create">
                                                <FaPlusCircle className="me-2" />Créer un projet
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item" to="/projects">
                                                <FaEdit className="me-2" />Mes projets
                                            </Link>
                                        </li>
                                    </>
                                )}
                                
                                <li><hr className="dropdown-divider" /></li>
                                <li>
                                    <Link className="dropdown-item" to="/logout">
                                        <FaSignOutAlt className="me-2" />Déconnexion
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    ) : (
                        <Link className="btn btn-light" to="/login">
                            <FaSignInAlt className="me-2" />Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Header;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEdit, FaTrash, FaEye, FaPlus } from 'react-icons/fa';
import axios from 'axios';

const CreatorDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/projects/creator/', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setProjects(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching projects:', error);
            setError('Erreur lors du chargement des projets');
            setLoading(false);
        }
    };

    const handleDelete = async (projectId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
            try {
                await axios.delete(`http://localhost:8000/api/projects/${projectId}/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                // Rafraîchir la liste des projets
                fetchProjects();
            } catch (error) {
                console.error('Error deleting project:', error);
                setError('Erreur lors de la suppression du projet');
            }
        }
    };

    if (loading) return <div className="container mt-4">Chargement...</div>;
    if (error) return <div className="container mt-4 alert alert-danger">{error}</div>;

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Mes Projets</h2>
                <Link to="/projects/create" className="btn btn-primary">
                    <FaPlus className="me-2" />Nouveau Projet
                </Link>
            </div>

            {projects.length === 0 ? (
                <div className="alert alert-info">
                    Vous n'avez pas encore de projets. Commencez par en créer un !
                </div>
            ) : (
                <div className="row">
                    {projects.map((project) => (
                        <div key={project.id} className="col-md-6 col-lg-4 mb-4">
                            <div className="card h-100">
                                <img
                                    src={project.image || 'https://via.placeholder.com/300x200'}
                                    className="card-img-top"
                                    alt={project.title}
                                    style={{ height: '200px', objectFit: 'cover' }}
                                />
                                <div className="card-body">
                                    <h5 className="card-title">{project.title}</h5>
                                    <p className="card-text">{project.description.substring(0, 100)}...</p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <div className="btn-group">
                                            <Link
                                                to={`/projects/${project.id}`}
                                                className="btn btn-sm btn-outline-primary"
                                            >
                                                <FaEye className="me-1" />Voir
                                            </Link>
                                            <Link
                                                to={`/projects/${project.id}/edit`}
                                                className="btn btn-sm btn-outline-secondary"
                                            >
                                                <FaEdit className="me-1" />Modifier
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(project.id)}
                                                className="btn btn-sm btn-outline-danger"
                                            >
                                                <FaTrash className="me-1" />Supprimer
                                            </button>
                                        </div>
                                        <small className="text-muted">
                                            {project.current_amount}€ / {project.target_amount}€
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CreatorDashboard; 
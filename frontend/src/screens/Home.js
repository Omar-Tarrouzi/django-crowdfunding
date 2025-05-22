import React, { useEffect, useState } from 'react';
import api from '../api/config';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, ProgressBar, Button } from 'react-bootstrap';
import { FaHeart, FaDonate } from 'react-icons/fa';

function Home() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalRaised: 0,
        totalDonors: 0
    });

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true);
                const response = await api.get('/projects/');
                setProjects(response.data);
                
                // Calculate total raised from all projects
                const totalRaised = response.data.reduce((sum, project) => 
                    sum + parseFloat(project.montant_recolte || 0), 0);
                setStats({
                    totalRaised,
                    totalDonors: response.data.length // This is a placeholder, should come from API
                });
            } catch (err) {
                console.error('Error fetching projects:', err);
                setError(err.response?.data || 'Failed to load projects');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    if (loading) {
        return (
            <Container className="mt-5 text-center">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="mt-5">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Error!</h4>
                    <p>{error}</p>
                </div>
            </Container>
        );
    }

    return (
        <Container className="mt-5">
            {/* Hero Section */}
            <div className="hero-section text-center mb-5">
                <h1>Welcome to Crowdfunding</h1>
                <p>Empowering dreams with your help</p>
            </div>

            {/* Overview Box */}
            <Row className="mb-5">
                <Col>
                    <div className="overview-box p-4 bg-light rounded shadow-sm">
                        <h3 className="text-center mb-4">Crowdfunding Overview</h3>
                        <Row className="text-center">
                            <Col md={4} className="mb-3">
                                <h4><strong>Total Projects:</strong> {projects.length}</h4>
                            </Col>
                            <Col md={4} className="mb-3">
                                <h4>
                                    <strong>
                                        <img src="/img/donate_icon.gif" alt="Donate" height="50" />
                                        Total Raised:
                                    </strong> {stats.totalRaised.toFixed(2)}€
                                </h4>
                            </Col>
                            <Col md={4} className="mb-3">
                                <h4>
                                    <strong>
                                        <img src="/img/user_icon.gif" alt="Users" height="50" />
                                        Total Donors:
                                    </strong> {stats.totalDonors}
                                </h4>
                            </Col>
                        </Row>
                    </div>
                </Col>
            </Row>

            {/* Project Feed */}
            <h2 className="mb-4">Browse Projects</h2>
            <Row>
                {projects.map(project => (
                    <Col key={project.id} md={4} className="mb-4">
                        <Card className="project-card h-100">
                            <Card.Img 
                                variant="top" 
                                src={project.image || '/img/default_image.jpg'} 
                                alt={project.titre}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/img/default_image.jpg';
                                }}
                            />
                            <Card.Body>
                                <Card.Title>{project.titre}</Card.Title>
                                <Card.Text>
                                    {project.description?.slice(0, 100)}...
                                </Card.Text>

                                {/* Progress Bar */}
                                <ProgressBar 
                                    now={(project.montant_recolte / project.montant_objectif) * 100} 
                                    className="mb-2"
                                />
                                <p>
                                    <strong>{project.montant_recolte}€</strong> raised of{' '}
                                    <strong>{project.montant_objectif}€</strong> goal
                                </p>

                                {/* Action Buttons */}
                                <div className="d-flex justify-content-between mb-3">
                                    <Button variant="success" as={Link} to={`/donate/${project.id}`}>
                                        <FaDonate /> Donate
                                    </Button>
                                    <Button variant="danger">
                                        <FaHeart /> Like
                                    </Button>
                                </div>

                                {/* View Details Button */}
                                <Button 
                                    variant="primary" 
                                    as={Link} 
                                    to={`/project/${project.id}`}
                                    className="w-100"
                                >
                                    See Details
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}

export default Home;
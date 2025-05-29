import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const CreateProject = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [csrfToken, setCsrfToken] = useState('');
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        montant_objectif: '',
        date_fin: '',
        image: null,
        paliers: [{ titre: '', montant: '', description: '', couleur: '#000000' }]
    });

    // Get CSRF token on component mount
    useEffect(() => {
        const getCsrfToken = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/auth/csrf-token/', {
                    withCredentials: true
                });
                setCsrfToken(response.data.csrfToken);
            } catch (err) {
                console.error('Error getting CSRF token:', err);
                setError('Erreur de connexion au serveur. Veuillez rafraîchir la page.');
            }
        };
        getCsrfToken();
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: files ? files[0] : value
        }));
    };

    const handlePalierChange = (index, field, value) => {
        const newPaliers = [...formData.paliers];
        newPaliers[index][field] = value;
        setFormData(prevState => ({
            ...prevState,
            paliers: newPaliers
        }));
    };

    const addPalier = () => {
        setFormData(prevState => ({
            ...prevState,
            paliers: [...prevState.paliers, { titre: '', montant: '', description: '', couleur: '#000000' }]
        }));
    };

    const removePalier = (index) => {
        setFormData(prevState => ({
            ...prevState,
            paliers: prevState.paliers.filter((_, i) => i !== index)
        }));
    };

    const validateForm = () => {
        // Basic validation
        if (!formData.titre.trim()) {
            setError('Veuillez entrer un titre pour le projet');
            return false;
        }
        if (!formData.description.trim()) {
            setError('Veuillez entrer une description');
            return false;
        }
        const objectifValue = parseFloat(formData.montant_objectif);
        if (
            !formData.montant_objectif ||
            isNaN(objectifValue) ||
            objectifValue < 100 ||
            !Number.isInteger(objectifValue)
        ) {
            setError('Veuillez entrer un montant objectif entier valide (minimum 100)');
            return false;
        }
        if (!formData.date_fin) {
            setError('Veuillez sélectionner une date de fin');
            return false;
        }
        
        // Validate paliers
        for (let i = 0; i < formData.paliers.length; i++) {
            const palier = formData.paliers[i];
            const palierMontant = parseFloat(palier.montant);
            if (!palier.titre.trim()) {
                setError(`Veuillez entrer un titre pour le palier ${i + 1}`);
                return false;
            }
            if (
                !palier.montant ||
                isNaN(palierMontant) ||
                palierMontant < 1 ||
                !Number.isInteger(palierMontant)
            ) {
                setError(`Veuillez entrer un montant entier valide pour le palier ${i + 1} (minimum 1)`);
                return false;
            }
            if (!palier.description.trim()) {
                setError(`Veuillez entrer une description pour le palier ${i + 1}`);
                return false;
            }
        }
        
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        const token = localStorage.getItem('token');
        if (!token || !csrfToken) {
            setError('Session invalide. Veuillez vous reconnecter.');
            setLoading(false);
            return;
        }

        try {
            // Verify user is authenticated and has creator privileges
            const authCheck = await axios.get('http://localhost:8000/api/auth/user/', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-CSRFToken': csrfToken
                },
                withCredentials: true
            });

            if (!authCheck.data.creator_id) {
                setError('Vous devez être un créateur vérifié pour créer un projet.');
                setLoading(false);
                return;
            }

            // Prepare form data
            const projectData = new FormData();
            projectData.append('titre', formData.titre);
            projectData.append('description', formData.description);
            projectData.append('montant_objectif', formData.montant_objectif);
            projectData.append('date_fin', formData.date_fin);

            if (formData.image) {
                projectData.append('image', formData.image);
            }

            // Add paliers as a JSON string (most DRF backends expect this for a JSONField)
            projectData.append('paliers', JSON.stringify(
                formData.paliers.map((palier, index) => ({
                    ...palier,
                    ordre: index
                }))
            ));

            // Create the project
            const response = await axios.post(
                'http://localhost:8000/api/projects/',
                projectData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-CSRFToken': csrfToken,
                        'Authorization': `Bearer ${token}`
                    },
                    withCredentials: true
                }
            );

            navigate(`/project/${response.data.id}`);
        } catch (err) {
            console.error('Error creating project:', err);
            
            if (err.response) {
                if (err.response.status === 401) {
                    setError('Session expirée. Veuillez vous reconnecter.');
                    logout();
                } else if (err.response.status === 403) {
                    if (err.response.data?.detail === 'CSRF Failed: CSRF token missing or incorrect.') {
                        setError('Erreur de sécurité. Veuillez rafraîchir la page.');
                    } else {
                        setError('Permission refusée. Vous devez être un créateur vérifié.');
                    }
                } else if (err.response.status === 400) {
                    // Handle validation errors
                    const errorData = err.response.data;
                    if (typeof errorData === 'object') {
                        const errorMessages = Object.entries(errorData)
                            .map(([field, messages]) => {
                                const message = Array.isArray(messages) ? messages.join(', ') : messages;
                                return `${field}: ${message}`;
                            })
                            .join('\n');
                        setError(errorMessages);
                    } else {
                        setError(errorData || 'Erreur de validation des données');
                    }
                } else {
                    setError(err.response.data?.message || 'Une erreur est survenue lors de la création du projet');
                }
            } else {
                setError('Erreur de connexion au serveur. Veuillez réessayer plus tard.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <h2 className="mb-4">Créer un nouveau projet</h2>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Titre du projet <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        type="text"
                        name="titre"
                        value={formData.titre}
                        onChange={handleChange}
                        required
                        placeholder="Entrez le titre du projet"
                        maxLength="100"
                    />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Description <span className="text-danger">*</span></Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        placeholder="Décrivez votre projet en détail"
                        maxLength="2000"
                    />
                </Form.Group>

                <Row>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Montant objectif (DH) <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="number"
                                name="montant_objectif"
                                value={formData.montant_objectif}
                                onChange={handleChange}
                                required
                                min="100"
                                step="1"
                                placeholder="Montant minimum: 100 DH"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group className="mb-3">
                            <Form.Label>Date de fin <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="datetime-local"
                                name="date_fin"
                                value={formData.date_fin}
                                onChange={handleChange}
                                required
                                min={new Date().toISOString().slice(0, 16)}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                <Form.Group className="mb-3">
                    <Form.Label>Image du projet</Form.Label>
                    <Form.Control
                        type="file"
                        name="image"
                        onChange={handleChange}
                        accept="image/*"
                    />
                    <Form.Text className="text-muted">
                        Formats acceptés : JPG, PNG, GIF. Taille maximale : 5MB
                    </Form.Text>
                </Form.Group>

                <div className="mb-4">
                    <h4>Paliers de financement <span className="text-danger">*</span></h4>
                    {formData.paliers.map((palier, index) => (
                        <div key={index} className="border p-3 mb-3 rounded">
                            <Row>
                                <Col md={4}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Titre du palier</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={palier.titre}
                                            onChange={(e) => handlePalierChange(index, 'titre', e.target.value)}
                                            placeholder="Titre du palier"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Montant (DH)</Form.Label>
                                        <Form.Control
                                            type="number"
                                            value={palier.montant}
                                            onChange={(e) => handlePalierChange(index, 'montant', e.target.value)}
                                            placeholder="Montant"
                                            required
                                            min="1"
                                            step="1"
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Description</Form.Label>
                                        <Form.Control
                                            type="text"
                                            value={palier.description}
                                            onChange={(e) => handlePalierChange(index, 'description', e.target.value)}
                                            placeholder="Description du palier"
                                            required
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={2}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>Couleur</Form.Label>
                                        <Form.Control
                                            type="color"
                                            value={palier.couleur}
                                            onChange={(e) => handlePalierChange(index, 'couleur', e.target.value)}
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                            {index > 0 && (
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => removePalier(index)}
                                    className="mt-2"
                                >
                                    Supprimer ce palier
                                </Button>
                            )}
                        </div>
                    ))}
                    <Button
                        variant="outline-primary"
                        onClick={addPalier}
                        className="mt-2"
                        disabled={formData.paliers.length >= 5}
                    >
                        Ajouter un palier (max 5)
                    </Button>
                </div>

                <div className="d-flex justify-content-between mt-4">
                    <Button variant="outline-secondary" onClick={() => navigate(-1)}>
                        Annuler
                    </Button>
                    <Button variant="primary" type="submit" disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Création en cours...
                            </>
                        ) : (
                            'Créer le projet'
                        )}
                    </Button>
                </div>
            </Form>
        </Container>
    );
};

export default CreateProject;
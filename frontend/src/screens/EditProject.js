import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Button, Container, Alert, Row, Col, Spinner } from 'react-bootstrap';
import axios from 'axios';

const EditProject = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [csrfToken, setCsrfToken] = useState('');
    const [formData, setFormData] = useState({
        titre: '',
        description: '',
        montant_objectif: '',
        date_fin: '',
        image: null,
        paliers: [{ titre: '', montant: '', description: '', couleur: '#000000' }]
    });

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/projects/${id}/`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                const data = response.data;
                setFormData({
                    titre: data.titre || '',
                    description: data.description || '',
                    montant_objectif: data.montant_objectif || '',
                    date_fin: data.date_fin ? data.date_fin.slice(0, 16) : '',
                    image: data.image || null,
                    paliers: data.paliers && data.paliers.length > 0
                        ? data.paliers.map(p => ({
                            titre: p.titre,
                            montant: p.montant,
                            description: p.description,
                            couleur: p.couleur || '#000000'
                        }))
                        : [{ titre: '', montant: '', description: '', couleur: '#000000' }]
                });
                setLoading(false);
            } catch (error) {
                setError('Erreur lors du chargement du projet');
                setLoading(false);
            }
        };

        const getCsrfToken = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/auth/csrf-token/', {
                    withCredentials: true
                });
                setCsrfToken(response.data.csrfToken);
            } catch (err) {
                setError('Erreur de connexion au serveur. Veuillez rafraîchir la page.');
            }
        };

        fetchProject();
        getCsrfToken();
    }, [id]);

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
        if (!formData.titre.trim()) {
            setError('Veuillez entrer un titre pour le projet');
            return false;
        }
        if (!formData.description.trim()) {
            setError('Veuillez entrer une description');
            return false;
        }
        if (!formData.montant_objectif || parseFloat(formData.montant_objectif) <= 0) {
            setError('Veuillez entrer un montant objectif valide');
            return false;
        }
        if (!formData.date_fin) {
            setError('Veuillez sélectionner une date de fin');
            return false;
        }
        for (let i = 0; i < formData.paliers.length; i++) {
            const palier = formData.paliers[i];
            if (!palier.titre.trim()) {
                setError(`Veuillez entrer un titre pour le palier ${i + 1}`);
                return false;
            }
            if (!palier.montant || parseFloat(palier.montant) <= 0) {
                setError(`Veuillez entrer un montant valide pour le palier ${i + 1}`);
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
        if (!validateForm()) return;

        try {
            const token = localStorage.getItem('token');
            const projectData = new FormData();
            projectData.append('titre', formData.titre);
            projectData.append('description', formData.description);
            projectData.append('montant_objectif', formData.montant_objectif);
            projectData.append('date_fin', formData.date_fin);

            if (formData.image && typeof formData.image !== 'string') {
                projectData.append('image', formData.image);
            }

            projectData.append('paliers', JSON.stringify(
                formData.paliers.map((palier, index) => ({
                    ...palier,
                    ordre: index
                }))
            ));

            await axios.patch(
                `http://localhost:8000/api/projects/${id}/`,
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

            navigate(`/project/${id}`);
        } catch (error) {
            setError(error.response?.data?.message || 'Erreur lors de la mise à jour du projet');
        }
    };

    if (loading) return <div className="container mt-4">Chargement...</div>;

    return (
        <Container className="py-5">
            <h2 className="mb-4">Modifier le projet</h2>
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
                                step="100"
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
                    {formData.image && typeof formData.image === 'string' && (
                        <img
                            src={formData.image}
                            alt="Projet"
                            className="mt-2"
                            style={{ maxWidth: '200px' }}
                        />
                    )}
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
                                            min="0"
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
                                Mise à jour en cours...
                            </>
                        ) : (
                            'Mettre à jour le projet'
                        )}
                    </Button>
                </div>
            </Form>
        </Container>
    );
};

export default EditProject;
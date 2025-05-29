import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FaHeart, FaRegHeart, FaUser, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import DonateForm from '../components/DonateForm';
import '../styles/ProjectDetail.css';

const ProjectDetail = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [donationAmount, setDonationAmount] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [showDonationForm, setShowDonationForm] = useState(false);
    const [currentPalierColor, setCurrentPalierColor] = useState('#2ecc71');
    const [refreshFlag, setRefreshFlag] = useState(0);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/api/projects/${projectId}/`);
                setProject(response.data);
                setIsFavorite(response.data.is_favorite);
                // Determine current palier color
                if (response.data.paliers && response.data.paliers.length > 0) {
                    // Find the highest palier reached
                    const reached = response.data.paliers
                        .filter(p => parseFloat(response.data.montant_recolte) >= parseFloat(p.montant))
                        .sort((a, b) => parseFloat(b.montant) - parseFloat(a.montant));
                    if (reached.length > 0) {
                        setCurrentPalierColor(reached[0].couleur || '#2ecc71');
                    } else {
                        setCurrentPalierColor('#2ecc71');
                    }
                } else {
                    setCurrentPalierColor('#2ecc71');
                }
                setLoading(false);
            } catch (err) {
                setError('Erreur lors du chargement du projet');
                setLoading(false);
            }
        };

        fetchProject();
    }, [projectId, refreshFlag]);

    const handleDonate = async (e) => {
        e.preventDefault();
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.post(
                // Correction: use singular "project" in the endpoint to match backend
                `http://localhost:8000/api/project/${projectId}/donate/`,
                { montant: parseFloat(donationAmount) },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            // Rafraîchir les données du projet
            const updatedProject = await axios.get(`http://localhost:8000/api/projects/${projectId}/`);
            setProject(updatedProject.data);
            setShowDonationForm(false);
            setDonationAmount('');
        } catch (err) {
            setError('Erreur lors du don');
        }
    };

    const toggleFavorite = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        try {
            const response = await axios.post(
                `http://localhost:8000/api/projects/${projectId}/toggle-favorite/`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setIsFavorite(response.data.is_favorite);
        } catch (err) {
            setError('Erreur lors de la mise à jour des favoris');
        }
    };

    if (loading) return <div className="loading">Chargement...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!project) return <div className="error">Projet non trouvé</div>;

    return (
        <div className="project-detail fade-in">
            <div className="project-header">
                <h1>{project.titre}</h1>
                <button 
                    className={`favorite-button ${isFavorite ? 'active' : ''}`}
                    onClick={toggleFavorite}
                >
                    {isFavorite ? <FaHeart /> : <FaRegHeart />}
                </button>
                {/* Show edit button if user is the creator */}
                {user && project.createur && user.id === project.createur.id && (
                    <button
                        className="edit-project-btn"
                        style={{
                            marginLeft: 16,
                            padding: '6px 14px',
                            background: '#1e90ff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                        }}
                        onClick={() => navigate(`/project/${projectId}/edit`)}
                    >
                        Modifier le projet
                    </button>
                )}
            </div>

            <div className="project-content">
                <div className="project-image">
                    {project.image ? (
                        <img src={project.image} alt={project.titre} />
                    ) : (
                        <div className="no-image">Pas d'image</div>
                    )}
                </div>

                <div className="project-info">
                    <div className="creator-info">
                        <FaUser />
                        <span>Créé par {project.createur.nom}</span>
                    </div>

                    <div className="project-dates">
                        <FaCalendarAlt />
                        <span>Date de fin: {new Date(project.date_fin).toLocaleDateString()}</span>
                    </div>

                    <div className="project-progress">
                        <div className="progress-bar" style={{ position: 'relative', height: 24 }}>
                            {/* Segments and stars for each palier */}
                            {project.paliers && project.paliers.length > 0 ? (() => {
                                const montantObjectif = parseFloat(project.montant_objectif) || 1;
                                const montantRecolte = parseFloat(project.montant_recolte) || 0;
                                const overGoal = montantRecolte >= montantObjectif;
                                const barColor = overGoal ? '#FFD700' : '#2ecc71';
                                const starColor = overGoal ? '#FFD700' : '#FFA500';
                                // Sort paliers by montant
                                const sortedPaliers = [...project.paliers].sort((a, b) => parseFloat(a.montant) - parseFloat(b.montant));
                                let lastMontant = 0;
                                let totalWidth = 0;
                                // Segments
                                const segments = sortedPaliers.map((palier, idx) => {
                                    const palierMontant = parseFloat(palier.montant);
                                    let segmentWidth = ((palierMontant - lastMontant) / montantObjectif) * 100;
                                    let fillWidth = 0;
                                    if (montantRecolte >= palierMontant) {
                                        fillWidth = segmentWidth;
                                    } else if (montantRecolte > lastMontant) {
                                        fillWidth = ((montantRecolte - lastMontant) / montantObjectif) * 100;
                                    }
                                    const left = totalWidth;
                                    totalWidth += segmentWidth;
                                    lastMontant = palierMontant;
                                    return (
                                        <div
                                            key={palier.id}
                                            style={{
                                                position: 'absolute',
                                                left: `${left}%`,
                                                width: `${fillWidth}%`,
                                                height: '100%',
                                                backgroundColor: overGoal ? barColor : palier.couleur,
                                                transition: 'width 0.3s'
                                            }}
                                        />
                                    );
                                });
                                // Last segment to objectif
                                const lastPalier = sortedPaliers[sortedPaliers.length - 1];
                                const lastMontantPalier = parseFloat(lastPalier.montant);
                                const left = ((lastMontantPalier) / montantObjectif) * 100;
                                let fillWidth = 0;
                                if (montantRecolte > lastMontantPalier) {
                                    fillWidth = Math.min(100 - left, ((montantRecolte - lastMontantPalier) / montantObjectif) * 100);
                                }
                                segments.push(
                                    <div
                                        key="last-segment"
                                        style={{
                                            position: 'absolute',
                                            left: `${left}%`,
                                            width: `${fillWidth}%`,
                                            height: '100%',
                                            backgroundColor: barColor,
                                            transition: 'width 0.3s'
                                        }}
                                    />
                                );
                                // Stars at each palier boundary
                                const stars = sortedPaliers.map((palier, idx) => {
                                    const palierMontant = parseFloat(palier.montant);
                                    const left = Math.min(100, (palierMontant / montantObjectif) * 100);
                                    return (
                                        <span
                                            key={`star-${palier.id}`}
                                            style={{
                                                position: 'absolute',
                                                left: `calc(${left}% - 10px)`,
                                                top: 0,
                                                fontSize: 20,
                                                color: starColor,
                                                zIndex: 2,
                                                textShadow: '0 0 2px #fff'
                                            }}
                                            title={`Palier: ${palier.titre}`}
                                        >★</span>
                                    );
                                });
                                // If over goal, add a gold star at 100%
                                if (overGoal) {
                                    stars.push(
                                        <span
                                            key="star-goal"
                                            style={{
                                                position: 'absolute',
                                                left: 'calc(100% - 10px)',
                                                top: 0,
                                                fontSize: 20,
                                                color: '#FFD700',
                                                zIndex: 2,
                                                textShadow: '0 0 2px #fff'
                                            }}
                                            title="Objectif atteint"
                                        >★</span>
                                    );
                                }
                                return (
                                    <>
                                        {segments}
                                        {stars}
                                    </>
                                );
                            })() : (
                                // Si pas de palier, barre verte classique (or gold if over goal)
                                <div
                                    className="progress-fill"
                                    style={{
                                        width: `${
                                            (parseFloat(project.montant_objectif) > 0 && !isNaN(parseFloat(project.montant_recolte)))
                                                ? Math.min(100, (parseFloat(project.montant_recolte) / parseFloat(project.montant_objectif)) * 100)
                                                : 0
                                        }%`,
                                        backgroundColor: (parseFloat(project.montant_recolte) >= parseFloat(project.montant_objectif)) ? '#FFD700' : currentPalierColor
                                    }}
                                />
                            )}
                        </div>
                        <div className="progress-stats" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <span>
                                {project.montant_recolte} DH / {project.montant_objectif} DH
                            </span>
                            <span style={{fontWeight: 'bold', color: '#1e90ff'}}>
                                {
                                    (parseFloat(project.montant_objectif) > 0 && !isNaN(parseFloat(project.montant_recolte)))
                                        ? ((parseFloat(project.montant_recolte) / parseFloat(project.montant_objectif)) * 100).toFixed(1)
                                        : 0
                                }%
                            </span>
                        </div>
                        {/* Ajout du message "plus que ..." */}
                        {project.paliers && project.paliers.length > 0 && (() => {
                            const sortedPaliers = [...project.paliers].sort((a, b) => parseFloat(a.montant) - parseFloat(b.montant));
                            const prochainPalier = sortedPaliers.find(p => parseFloat(project.montant_recolte) < parseFloat(p.montant));
                            if (prochainPalier) {
                                const montantRestant = Math.max(0, parseFloat(prochainPalier.montant) - parseFloat(project.montant_recolte));
                                return (
                                    <div style={{ color: '#1e90ff', marginTop: 8 }}>
                                        Plus que {montantRestant} DH jusqu'au prochain palier !
                                    </div>
                                );
                            }
                            return null;
                        })()}
                    </div>

                    <div className="project-description">
                        <h3>Description</h3>
                        <p>{project.description}</p>
                    </div>

                    {/* Show paliers if present */}
                    {project.paliers && project.paliers.length > 0 && (
                        <div className="project-paliers">
                            <h3>Paliers de récompense</h3>
                            <div className="paliers-grid">
                                {project.paliers.map((palier) => {
                                    const atteint = parseFloat(project.montant_recolte) >= parseFloat(palier.montant);
                                    return (
                                        <div 
                                            key={palier.id} 
                                            className="palier-card palier-hover-animate"
                                            style={{ borderColor: palier.couleur, position: 'relative' }}
                                        >
                                            <h4>
                                                {palier.titre}
                                                {atteint && (
                                                    <span style={{
                                                        color: '#2ecc71',
                                                        marginLeft: 8,
                                                        fontSize: '1.1em',
                                                        verticalAlign: 'middle'
                                                    }}>
                                                        <i className="fas fa-check-circle"></i> atteint !
                                                    </span>
                                                )}
                                            </h4>
                                            <p className="palier-montant">{palier.montant} DH</p>
                                            <p className="palier-description">{palier.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="donation-section">
                        {!showDonationForm ? (
                            <button 
                                className="donate-button"
                                onClick={() => setShowDonationForm(true)}
                            >
                                <FaMoneyBillWave /> Faire un don
                            </button>
                        ) : (
                            <DonateForm onDonationSuccess={() => setRefreshFlag(f => f + 1)} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetail;

// Add this at the end of the file (or in your CSS file if preferred)
if (typeof document !== "undefined" && !document.getElementById("palier-hover-animate-style")) {
    const palierStyle = document.createElement('style');
    palierStyle.id = "palier-hover-animate-style";
    palierStyle.innerHTML = `
    .palier-hover-animate {
        transition: transform 0.25s cubic-bezier(.4,2,.3,1), box-shadow 0.25s cubic-bezier(.4,2,.3,1);
    }
    .palier-hover-animate:hover {
        transform: scale(1.07) translateY(-6px);
        box-shadow: 0 8px 32px 0 rgba(30,144,255,0.18), 0 2px 8px rgba(30,144,255,0.10);
        z-index: 2;
    }
    `;
    document.head.appendChild(palierStyle);
}
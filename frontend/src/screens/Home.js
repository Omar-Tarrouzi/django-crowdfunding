import React, { useEffect, useState } from 'react';
import api from '../api/config';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { FaHeart, FaDonate } from 'react-icons/fa';
import FavoriteButton from '../components/FavoriteButton';

function Home() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalProjects: 0,
        totalRaised: 0,
        totalDonors: 0
    });
    const [displayedRaised, setDisplayedRaised] = useState(0);
    const [favoriteIds, setFavoriteIds] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                //récupere les projets
                const response = await api.get('/projects/');
                setProjects(response.data);

                // récupere les projets favoris
                try {
                    const token = localStorage.getItem('token');
                    if (token) {
                        const favRes = await fetch('http://localhost:8000/api/favorite-projects/', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        if (favRes.ok) {
                            const favData = await favRes.json();
                            setFavoriteIds(Array.isArray(favData) ? favData.map(p => p.id) : []);
                        }
                    }
                } catch (e) {
                    setFavoriteIds([]);
                }

                // Use the public dashboard API for overview stats
                let backendStats = {};
                let useBackendStats = false;
                try {
                    const statsRes = await fetch('http://localhost:8000/api/dashboard/', {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('dashboard status:', statsRes.status);
                    const rawText = await statsRes.clone().text();
                    console.log('dashboard raw response:', rawText);
                    if (
                        statsRes.ok &&
                        statsRes.headers.get('content-type') &&
                        statsRes.headers.get('content-type').includes('application/json')
                    ) {
                        backendStats = await statsRes.json();
                        console.log('dashboard parsed:', backendStats);
                        if (
                            backendStats.total_projects > 0 ||
                            backendStats.total_raised > 0 ||
                            backendStats.total_donors > 0
                        ) {
                            useBackendStats = true;
                        }
                    }
                } catch (err) {
                    backendStats = {};
                }

                if (useBackendStats) {
                    setStats({
                        totalProjects: backendStats.total_projects || 0,
                        totalRaised: backendStats.total_raised || 0,
                        totalDonors: Number(backendStats.total_donors) > 0
                            ? Number(backendStats.total_donors)
                            : 0
                    });
                } else {
                    // Fallback: calculate from projects list
                    const totalProjects = Array.isArray(response.data) ? response.data.length : 0;
                    const totalRaised = Array.isArray(response.data)
                        ? response.data.reduce((sum, project) => sum + parseFloat(project.montant_recolte || 0), 0)
                        : 0;
                    setStats({
                        totalProjects,
                        totalRaised,
                        totalDonors: 0
                    });
                }
            } catch (err) {
                console.error('Error fetching stats:', err);
                setError('Failed to load overview stats');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Animate the displayedRaised value from 0 to stats.totalRaised, smoothly and gradually
    useEffect(() => {
        let rafId;
        let frame = 0;
        let start = 0;
        let end = stats.totalRaised;
        let duration = 1800; // ms, increase for smoother/slower
        let steps = 60; // number of animation frames
        let increment = (end - start) / steps;

        function animate() {
            frame++;
            let value = start + increment * frame;
            if ((increment > 0 && value >= end) || (increment < 0 && value <= end)) {
                setDisplayedRaised(end);
                return;
            }
            setDisplayedRaised(value);
            rafId = requestAnimationFrame(animate);
        }

        if (end > 0) {
            setDisplayedRaised(0);
            frame = 0;
            rafId = requestAnimationFrame(animate);
        } else {
            setDisplayedRaised(0);
        }

        return () => rafId && cancelAnimationFrame(rafId);
    }, [stats.totalRaised]);

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
        <Container
            className="p-0"
            style={{
                background: "linear-gradient(120deg, #1e90ff 0%, #47ffb5 100%)",
                minHeight: "100vh",
                padding: 0,
                maxWidth: "100vw",
                width: "100vw"
            }}
            fluid
        >
            <div style={{
                background: "linear-gradient(120deg, #1e90ff 0%, #47ffb5 100%)",
                minHeight: "100vh",
                width: "100%",
                paddingTop: 0,
                marginTop: 0
            }}>
                {/* Hero Section */}
                <div
                    style={{
                        background: "rgba(0,0,0,0.18)",
                        borderRadius: "0 0 32px 32px",
                        marginBottom: "40px",
                        boxShadow: "0 4px 24px rgba(30,144,255,0.08)",
                        position: "relative",
                        overflow: "hidden"
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                            zIndex: 1,
                            animation: "darkFluctuate 4s ease-in-out infinite",
                            background: "rgba(0,0,0,0.12)"
                        }}
                    />
                    <div className="hero-section text-center mb-0" style={{
                        background: "none",
                        color: "white",
                        padding: "70px 0 40px 0",
                        marginTop: 0,
                        position: "relative",
                        zIndex: 2
                    }}>
                        <h1 style={{
                            fontFamily: "'Montserrat', 'Poppins', sans-serif",
                            fontWeight: 800,
                            fontSize: "4.2rem",
                            letterSpacing: "1px",
                            marginBottom: 10,
                            background: "linear-gradient(90deg, #fff 30%, #ffd700 70%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexWrap: "wrap"
                        }}>
                            CRO
                            <img
                                src={require('../assets/img/Logoalt.gif')}
                                alt="Crown"
                                style={{
                                    height: 80,
                                    margin: "0 4px",
                                    verticalAlign: "middle",
                                    filter: "drop-shadow(0 2px 12px #ffd700)"
                                }}
                            />
                            N F
                            <img
                                src={require('../assets/img/coin.gif')}
                                alt="Coin"
                                style={{
                                    height: 54,
                                    margin: "0 2px",
                                    verticalAlign: "middle",
                                    filter: "drop-shadow(0 2px 8px #ffd700)",
                                    position: "relative",
                                    top: "12px" // move coin down for better alignment
                                }}
                            />
                            nding
                        </h1>
                        <p style={{
                            fontSize: "1.5rem",
                            color: "#e0f7fa",
                            fontWeight: 500,
                            marginBottom: 0
                        }}>
                            Rêvez, postez, financez... <span style={{ color: "#ffd700" }}>On s'occupe du reste</span>
                        </p>
                    </div>
                </div>
                {/* Overview Box */}
                <Row className="mb-5">
                    <Col>
                        <div
                            className="overview-box p-4 rounded shadow-sm"
                            style={{
                                background: "rgba(0,0,0,0.82)",
                                color: "white",
                                borderRadius: "18px",
                                marginBottom: "32px",
                                boxShadow: "0 8px 32px rgba(30,144,255,0.18)",
                                backdropFilter: "blur(12px)",
                                position: "relative",
                                overflow: "hidden"
                            }}
                        >
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    pointerEvents: "none",
                                    zIndex: 1,
                                    animation: "darkFluctuate 4s ease-in-out infinite",
                                    background: "rgba(0,0,0,0.10)"
                                }}
                            />
                            <div style={{ position: "relative", zIndex: 2 }}>
                                <h3 className="text-center mb-4" style={{
                                    fontWeight: 700,
                                    letterSpacing: "1px",
                                    color: "#ffd700"
                                }}>Vue d'ensemble</h3>
                                <Row className="text-center">
                                    <Col md={4} className="mb-3">
                                        <h4 style={{ fontWeight: 600 }}>
                                            <span style={{ color: "#47ffb5" }}>Total Projets:</span> {stats.totalProjects}
                                        </h4>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <h4 style={{ fontWeight: 600 }}>
                                            <img src={require('../assets/img/donate_icon.gif')} alt="Donate" height="40" style={{ marginRight: 8, verticalAlign: "middle" }} />
                                            <span style={{ color: "#ffd700" }}>Total Collecté:</span>
                                            <span style={{ color: '#2ecc71', fontWeight: 700, marginLeft: 8 }}>
                                                {displayedRaised.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Dh
                                            </span>
                                        </h4>
                                    </Col>
                                    <Col md={4} className="mb-3">
                                        <h4 style={{ fontWeight: 600 }}>
                                            <img src={require('../assets/img/users icon gif.gif')} alt="Donors" height="40" style={{ marginRight: 8, verticalAlign: "middle" }} />
                                            <span style={{ color: "#47ffb5" }}>Donateurs:</span> {typeof stats.totalDonors === 'number' && !isNaN(stats.totalDonors) ? stats.totalDonors : 0}
                                        </h4>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </Col>
                </Row>
                {/* Project Feed */}
                <h2 className="mb-4" style={{
                    fontFamily: "'Montserrat', 'Poppins', sans-serif",
                    fontWeight: 700,
                    color: "#1e90ff",
                    letterSpacing: "1px",
                    textShadow: "0 2px 8px #fff"
                }}>Nos Projets</h2>
                <Row>
                    {projects.map((project, idx) => (
                        <Col key={project.id} md={4} className="mb-4">
                            <Card
                                className={`project-card h-100 home-project-card slide-in-card`}
                                style={{
                                    border: "none",
                                    borderRadius: "18px",
                                    boxShadow: "0 8px 32px rgba(30,144,255,0.12)",
                                    transition: "transform 0.35s cubic-bezier(.4,2,.3,1), box-shadow 0.35s cubic-bezier(.4,2,.3,1)",
                                    background: "#fff",
                                    cursor: "pointer",
                                    animation: `slideIn 1.3s cubic-bezier(.4,2,.3,1) forwards`,
                                    animationDelay: `${0.18 * idx}s`,
                                    opacity: 0
                                }}
                            >
                                <Card.Img 
                                    variant="top" 
                                    src={project.image || '/img/default_image.jpg'} 
                                    alt={project.titre}
                                    style={{
                                        height: 200,
                                        width: '100%',
                                        objectFit: 'cover',
                                        objectPosition: 'center',
                                        borderTopLeftRadius: '18px',
                                        borderTopRightRadius: '18px',
                                        borderBottom: "4px solid #1e90ff"
                                    }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/img/default_image.jpg';
                                    }}
                                />
                                <Card.Body style={{ padding: "1.5rem" }}>
                                    <Card.Title style={{
                                        fontWeight: 700,
                                        fontSize: "1.3rem",
                                        color: "#1e90ff",
                                        marginBottom: 8
                                    }}>{project.titre}</Card.Title>
                                    <Card.Text style={{
                                        color: "#444",
                                        fontSize: "1rem",
                                        minHeight: 60
                                    }}>
                                        {project.description?.slice(0, 100)}...
                                    </Card.Text>
                                    {/* Custom Progress Bar with paliers and stars */}
                                    <div style={{
                                        position: 'relative',
                                        height: 22,
                                        marginBottom: 10,
                                        background: '#e9ecef',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        boxShadow: "0 2px 8px rgba(30,144,255,0.08)"
                                    }}>
                                        {(() => {
                                            const montantObjectif = parseFloat(project.montant_objectif) || 1;
                                            const montantRecolte = parseFloat(project.montant_recolte) || 0;
                                            const overGoal = montantRecolte >= montantObjectif;
                                            const barColor = overGoal ? '#FFD700' : '#2ecc71';
                                            const starColor = overGoal ? '#FFD700' : '#FFA500';
                                            if (project.paliers && project.paliers.length > 0) {
                                                const sortedPaliers = [...project.paliers].sort((a, b) => parseFloat(a.montant) - parseFloat(b.montant));
                                                let lastMontant = 0;
                                                let totalWidth = 0;
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
                                                    const seg = (
                                                        <div
                                                            key={palier.id}
                                                            style={{
                                                                position: 'absolute',
                                                                left: `${left}%`,
                                                                width: `${fillWidth}%`,
                                                                height: '100%',
                                                                background: `linear-gradient(90deg, ${palier.couleur}, #fff)`,
                                                                transition: 'width 0.3s'
                                                            }}
                                                        />
                                                    );
                                                    lastMontant = palierMontant;
                                                    return seg;
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
                                                            background: barColor,
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
                                                                fontSize: 18,
                                                                color: starColor,
                                                                zIndex: 2,
                                                                textShadow: '0 0 2px #fff'
                                                            }}
                                                            title={`Palier: ${palier.titre}`}
                                                        >★</span>
                                                    );
                                                });
                                                if (overGoal) {
                                                    stars.push(
                                                        <span
                                                            key="star-goal"
                                                            style={{
                                                                position: 'absolute',
                                                                left: 'calc(100% - 10px)',
                                                                top: 0,
                                                                fontSize: 18,
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
                                            } else {
                                                return (
                                                    <div
                                                        style={{
                                                            width: `${
                                                                (parseFloat(project.montant_objectif) > 0 && !isNaN(parseFloat(project.montant_recolte)))
                                                                    ? Math.min(100, (parseFloat(project.montant_recolte) / parseFloat(project.montant_objectif)) * 100)
                                                                    : 0
                                                            }%`,
                                                            height: '100%',
                                                            background: "linear-gradient(90deg, #2ecc71, #fff)",
                                                            transition: 'width 0.3s'
                                                        }}
                                                    />
                                                );
                                            }
                                        })()}
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: 15,
                                        marginBottom: 4,
                                        color: "#1e90ff"
                                    }}>
                                        <span>
                                            <strong>{project.montant_recolte} Dh</strong> / <strong>{project.montant_objectif} Dh</strong>
                                        </span>
                                        <span style={{fontWeight: 'bold'}}>
                                            {
                                                (parseFloat(project.montant_objectif) > 0 && !isNaN(parseFloat(project.montant_recolte)))
                                                    ? ((parseFloat(project.montant_recolte) / parseFloat(project.montant_objectif)) * 100).toFixed(1)
                                                    : 0
                                            }%
                                        </span>
                                    </div>
                                    {/* Next palier message */}
                                    {project.paliers && project.paliers.length > 0 && (() => {
                                        const sortedPaliers = [...project.paliers].sort((a, b) => parseFloat(a.montant) - parseFloat(b.montant));
                                        const prochainPalier = sortedPaliers.find(p => parseFloat(project.montant_recolte) < parseFloat(p.montant));
                                        if (prochainPalier) {
                                            const montantRestant = Math.max(0, parseFloat(prochainPalier.montant) - parseFloat(project.montant_recolte));
                                            return (
                                                <div style={{ color: '#1e90ff', marginBottom: 8, fontWeight: 500 }}>
                                                    Plus que {montantRestant} DH jusqu'au prochain palier !
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                    {/* Action Buttons */}
                                    <div className="d-flex justify-content-between mb-3">
                                        <Button variant="success" as={Link} to={`/donate/${project.id}`} style={{
                                            fontWeight: 600,
                                            borderRadius: 8,
                                            boxShadow: "0 2px 8px #2ecc71",
                                            background: "linear-gradient(90deg, #2ecc71 60%, #47ffb5 100%)",
                                            border: "none"
                                        }}>
                                            <FaDonate style={{ marginRight: 6 }} /> Donner
                                        </Button>
                                        <FavoriteButton
                                            projectId={project.id}
                                            initialFavorited={favoriteIds.includes(project.id)}
                                        />
                                    </div>
                                    <Button 
                                        variant="primary" 
                                        as={Link} 
                                        to={`/project/${project.id}`}
                                        className="w-100"
                                        style={{
                                            fontWeight: 600,
                                            borderRadius: 8,
                                            background: "linear-gradient(90deg, #1e90ff 60%, #47ffb5 100%)",
                                            border: "none",
                                            marginTop: 8
                                        }}
                                    >
                                        Voir détails
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </Container>
    );
}


const style = document.createElement('style');
style.innerHTML = `
@keyframes darkFluctuate {
  0% { background: rgba(0,0,0,0.18); }
  50% { background: rgba(0,0,0,0.38); }
  100% { background: rgba(0,0,0,0.18); }
}
.home-project-card {
  transition: transform 0.35s cubic-bezier(.4,2,.3,1), box-shadow 0.35s cubic-bezier(.4,2,.3,1), outline 0.25s;
  outline: 3px solid transparent;
  outline-offset: 0px;
}
@keyframes outlineFluctuate {
  0%   { outline-color: #1e90ff; outline-offset: 0px; }
  30%  { outline-color: #47ffb5; outline-offset: 4px; }
  60%  { outline-color: #ffd700; outline-offset: 2px; }
  100% { outline-color: #1e90ff; outline-offset: 0px; }
}
.home-project-card:hover {
  transform: translateY(-18px) scale(1.07) rotate(-1.5deg);
  box-shadow: 0 24px 64px 0 rgba(30,144,255,0.22), 0 4px 16px rgba(30,144,255,0.13);
  z-index: 2;
  outline: 4px solid #1e90ff;
  animation: outlineFluctuate 1.2s infinite linear;
}
@keyframes slideIn {
  0% {
    opacity: 0;
    transform: translateY(80px) scale(0.96);
  }
  80% {
    opacity: 1;
    transform: translateY(-12px) scale(1.05);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;
if (typeof document !== "undefined" && !document.getElementById("darkFluctuateKeyframes")) {
  style.id = "darkFluctuateKeyframes";
  document.head.appendChild(style);
}

export default Home;
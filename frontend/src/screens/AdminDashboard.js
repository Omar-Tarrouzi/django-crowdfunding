import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/admin-stats/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Vous devez être connecté en tant qu\'admin pour accéder au dashboard.');
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <Container className="mt-5 text-center"><div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div></Container>;
  if (error) return <Container className="mt-5"><div className="alert alert-danger" role="alert">{error}</div></Container>;
  if (!stats) return <Container className="mt-5"><div>No stats found</div></Container>;

  return (
    <Container className="mt-5">
      <Card className="overview-box mb-5 p-4 bg-dark text-white shadow">
        <h3 className="text-center mb-4">Dashboard Administrateur</h3>
        <Row className="text-center">
          <Col md={3} className="mb-3">
            <h4>
              <strong>
                <img src="/img/project_icon.gif" alt="Projet Icon" height="50" style={{verticalAlign: 'middle'}} />
                Nombre de projets:
              </strong> {stats.total_projects}
            </h4>
          </Col>
          <Col md={3} className="mb-3">
            <h4>
              <strong>
                <img src="/img/donate_icon.gif" alt="Logo" height="50" style={{verticalAlign: 'middle'}} />
                Total Raised:
              </strong> {stats.total_raised}€
            </h4>
          </Col>
          <Col md={3} className="mb-3">
            <h4>
              <strong>
                <img src="/img/user_icon.gif" alt="Logo" height="50" style={{verticalAlign: 'middle'}} />
                Total Creators:
              </strong> {stats.total_creators}
            </h4>
          </Col>
          <Col md={3} className="mb-3">
            <h4>
              <strong>
                <img src="/img/user_icon.gif" alt="Logo" height="50" style={{verticalAlign: 'middle'}} />
                Total Donors:
              </strong> {stats.total_donors}
            </h4>
          </Col>
        </Row>
        <div className="text-center mt-4">
          <Button
            variant="dark"
            size="lg"
            href="http://127.0.0.1:8000/admin/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fas fa-tools"></i> Accéder à Django Admin
          </Button>
        </div>
      </Card>
    </Container>
  );
};

export default AdminDashboard;
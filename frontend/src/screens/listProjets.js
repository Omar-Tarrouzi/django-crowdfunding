import React, { useEffect, useState }  from "react";
import axios from "axios";
import projet from "../components/Projets";
import { Container, Row, Col } from 'react-bootstrap';

function ListProjets(){
    const [projets, setProjets] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProjets() {
            try {
                const { data } = await axios.get("http://localhost:8000/api/projects/");
                setProjets(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching projects:', err);
                setError(err.response?.data || 'Failed to load projects');
                setLoading(false);
            }
        }
        fetchProjets();
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
        <Container>
            <h1 className="mb-4">Nos projets</h1>
            <Row>
                {projets.map((projet) => (
                    <Col key={projet.id} sm={12} md={6} lg={4} xl={3} className="mb-4">
                        <Projet projet={projet}/>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}

export default ListProjets;
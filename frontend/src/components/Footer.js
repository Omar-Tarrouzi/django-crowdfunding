import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

function Footer() {
    return (
        <footer className="bg-dark text-light py-4 mt-5">
            <Container>
                <Row>
                    <Col md={4} className="mb-3">
                        <h5>About Us</h5>
                        <p className="text-muted">
                            We help bring creative projects to life through crowdfunding.
                            Join our community of creators and supporters.
                        </p>
                    </Col>
                    <Col md={4} className="mb-3">
                        <h5>Quick Links</h5>
                        <ul className="list-unstyled">
                            <li><a href="/about" className="text-muted">About</a></li>
                            <li><a href="/contact" className="text-muted">Contact</a></li>
                            <li><a href="/terms" className="text-muted">Terms of Service</a></li>
                            <li><a href="/privacy" className="text-muted">Privacy Policy</a></li>
                        </ul>
                    </Col>
                    <Col md={4} className="mb-3">
                        <h5>Connect With Us</h5>
                        <div className="d-flex gap-3">
                            <a href="#" className="text-light"><FaFacebook size={24} /></a>
                            <a href="#" className="text-light"><FaTwitter size={24} /></a>
                            <a href="#" className="text-light"><FaInstagram size={24} /></a>
                            <a href="#" className="text-light"><FaLinkedin size={24} /></a>
                        </div>
                    </Col>
                </Row>
                <hr className="my-4" />
                <Row>
                    <Col className="text-center text-muted">
                        <p className="mb-0">
                            &copy; {new Date().getFullYear()} Crowdfunding Platform. All rights reserved.
                        </p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}

export default Footer;
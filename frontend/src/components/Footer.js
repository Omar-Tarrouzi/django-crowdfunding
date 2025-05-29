import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

function Footer() {
    return (
        <footer
            style={{
                background: "linear-gradient(to right, #1e90ff, #47ffb5)",
                color: "#fff",
                paddingTop: "32px",
                paddingBottom: "16px",
                marginTop: 0,
                borderTop: "none",
                position: "relative",
                zIndex: 1
            }}
            className="footer-no-gap"
        >
            {/* White transparent foreground box */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "rgba(255,255,255,0.18)",
                    zIndex: 1,
                    pointerEvents: "none"
                }}
            />
            <Container style={{ position: "relative", zIndex: 2 }}>
                <Row>
                    <Col md={4} className="mb-3">
                        <h5>About Us</h5>
                        <p className="text-light">
                            We help bring creative projects to life through crowdfunding.
                            Join our community of creators and supporters.
                        </p>
                    </Col>
                    <Col md={4} className="mb-3">
                        <h5>Quick Links</h5>
                        <ul className="list-unstyled">
                            <li><a href="/about" className="text-light">About</a></li>
                            <li><a href="/contact" className="text-light">Contact</a></li>
                            <li><a href="/terms" className="text-light">Terms of Service</a></li>
                            <li><a href="/privacy" className="text-light">Privacy Policy</a></li>
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
                <hr className="my-4" style={{ borderColor: "rgba(255,255,255,0.3)" }} />
                <Row>
                    <Col className="text-center text-light">
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
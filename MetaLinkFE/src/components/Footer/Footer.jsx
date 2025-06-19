import React from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section brand-section">
          <h2>metaLink <span className="highlight">Education</span></h2>
          <p>Revolutionizing education through AI-powered personalized learning experiences.</p>
          <div className="social-links">
            <a href="https://www.facebook.com/" className="social-icon">
              <FaFacebook />
            </a>
            <a href="https://x.com/" className="social-icon">
              <FaTwitter />
            </a>
            <a href="https://www.linkedin.com/" className="social-icon">
              <FaLinkedin />
            </a>
            <a href="https://www.instagram.com/" className="social-icon">
              <FaInstagram />
            </a>
            <a href="https://www.youtube.com/" className="social-icon">
              <FaYoutube />
            </a>
          </div>
        </div>

        <div className="footer-section links-section">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about-us">About Us</Link></li>
            <li><Link to="/contact-us">Contact Us</Link></li>
            <li><Link to="/mission-vision">Mission & Vision</Link></li>
          </ul>
        </div>

        <div className="footer-section contact-section">
          <h3>Contact Information</h3>
          <div className="info-item">
            <FaMapMarkerAlt className="info-icon" />
            <p>E5 Highway Atakoy Campus, Atakoy 7-8-9-10. Section, 34158 Bakirkoy</p>
          </div>
          <div className="info-item">
            <FaPhone className="info-icon" />
            <p>+1 (555) 123-4567</p>
          </div>
          <div className="info-item">
            <FaEnvelope className="info-icon" />
            <p>info@metalink-education.com</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} metaLink Education. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
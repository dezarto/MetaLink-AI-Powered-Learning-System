import React, { useState, useEffect } from 'react';
import './communicationPage.css';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebook, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa';
import FirstNavbar from "../../components/Navbar/FirstNavbar.jsx";
import Footer from '../../components/Footer/Footer.jsx';
import { getCompanyProfile } from '../../services/user-api.js';
import HamsterWheel from "../../components/Spinner/HamsterWheel"; // <-- Eklendi


const Communication = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [contactInfo, setContactInfo] = useState({
    Address: '',
    Phone: '',
    Email: '',
    Facebook: '',
    LinkedIn: '',
    X: '',
    Instagram: ''
  });
    const [loading, setLoading] = useState(true);  // <-- BU SATIR ÖNEMLİ
  

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const data = await getCompanyProfile();
        if (data && data.contactInfo) {
          const parsedContactInfo = JSON.parse(data.contactInfo);
          setContactInfo({
            Address: parsedContactInfo.Address || '',
            Phone: parsedContactInfo.Phone || '',
            Email: parsedContactInfo.Email || '',
            Facebook: parsedContactInfo.Facebook || '',
            LinkedIn: parsedContactInfo.LinkedIn || '',
            X: parsedContactInfo.X || '',
            Instagram: parsedContactInfo.Instagram || ''
          });
        }
      } catch (error) {
        console.error('İletişim bilgileri yüklenirken hata oluştu:', error);
      }finally {
        setLoading(false); // <-- İşlem bitince loading false
      }
    
    };
    fetchCompanyProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

  
  if (loading) {
    return (
       <div className="sublogin-fullpage-loading">
        <div className="sublogin-hamster-loading">
          <HamsterWheel />
        </div>
        <p className="loading-text">Communication Loading...</p>
      </div>
    );
  }

  return (
    <div className="communication-container">
      <FirstNavbar visibleButtons={["home", "about", "contact", "missionvision", "login"]} />

      <div className="hero-section">
        <div className="hero-content">
          <h1>Get in <span className="highlight">Touch</span></h1>
          <p className="tagline">We'd Love to Hear From You</p>
        </div>
      </div>

      <div className="content-section">
        <div className="contact-grid">
          <div className="contact-info">
            <h2>Contact Information</h2>
            <p>
              We're always eager to hear from parents, educators, and partners interested in
              revolutionizing education through AI-powered personalized learning.
            </p>

            <div className="info-item">
              <FaMapMarkerAlt className="info-icon" />
              <div>
                <h3>Address</h3>
                <p>{contactInfo.Address || 'Loading...'}</p>
              </div>
            </div>

            <div className="info-item">
              <FaPhone className="info-icon" />
              <div>
                <h3>Phone</h3>
                <p>{contactInfo.Phone || 'Loading...'}</p>
              </div>
            </div>

            <div className="info-item">
              <FaEnvelope className="info-icon" />
              <div>
                <h3>Email</h3>
                <p>{contactInfo.Email || 'Loading...'}</p>
              </div>
            </div>

            <div className="social-links">
              <a href={contactInfo.Facebook || 'https://www.facebook.com/'} className="social-icon">
                <FaFacebook />
              </a>
              <a href={contactInfo.X || 'https://x.com/'} className="social-icon">
                <FaTwitter />
              </a>
              <a href={contactInfo.LinkedIn || 'https://www.linkedin.com/'} className="social-icon">
                <FaLinkedin />
              </a>
              <a href={contactInfo.Instagram || 'https://www.instagram.com/'} className="social-icon">
                <FaInstagram />
              </a>
            </div>
          </div>

          <div className="contact-form-container">
            <h2>Send Us a Message</h2>
            <form className="contact-us-form" onSubmit={handleSubmit}>
              <div className="contact-us-form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="contact-us-form-group">
                <label htmlFor="email">Your Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="contact-us-form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="contact-us-form-group">
                <label htmlFor="message">Your Message</label>
                <textarea
                  id="message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleChange}
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">Send Message</button>
            </form>
          </div>
        </div>
      </div>

      <div className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>How does the learning style assessment work?</h3>
            <p>
              Our proprietary assessment evaluates multiple dimensions of learning preferences including
              visual, auditory, kinesthetic, logical, and social learning tendencies. Through a series of
              interactive questions and scenarios, we create a comprehensive learning profile.
            </p>
          </div>

          <div className="faq-item">
            <h3>Is my child's data secure?</h3>
            <p>
              Absolutely. We implement industry-leading security measures and comply with all relevant
              data protection regulations. Your child's data is encrypted, anonymized when used for
              analytics, and never sold to third parties.
            </p>
          </div>

          <div className="faq-item">
            <h3>Can metaLink work alongside traditional curriculum?</h3>
            <p>
              Yes! metaLink is designed to complement existing educational programs. Our system can adapt
              to various curricula and provide personalized approaches to standard educational content.
            </p>
          </div>

          <div className="faq-item">
            <h3>How often should my child use metaLink?</h3>
            <p>
              For optimal results, we recommend regular usage of 3-5 sessions per week, each lasting
              20-30 minutes. However, the platform adapts to each student's schedule and can provide
              benefit even with less frequent use.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Communication;
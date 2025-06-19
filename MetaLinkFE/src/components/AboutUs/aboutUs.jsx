import React, { useState, useEffect } from 'react';
import './AboutUs.css';
import eduimageadem from '../../assets/adem.jpeg';
import eduimageumut from '../../assets/umut.jpg';
import eduimagesemir from '../../assets/semir.jpeg';
import eduimage from '../../assets/edy.ai.2.png';
import eduimage2 from '../../assets/edu.ai.3.webp';
import eduimage3 from '../../assets/ai4.jpg';
import FirstNavbar from '../../components/Navbar/FirstNavbar.jsx';
import Footer from '../../components/Footer/Footer.jsx';
import { getCompanyProfile } from '../../services/user-api.js';
import HamsterWheel from '../../components/Spinner/HamsterWheel';

const AboutUs = () => {
  const [whatWeDo, setWhatWeDo] = useState([]);
  const [differenceItems, setDifferenceItems] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [whoWeAre, setWhoWeAre] = useState('');
  const [loading, setLoading] = useState(true);

  const imageMap = {
    'adem.jpeg': eduimageadem,
    'umut.jpg': eduimageumut,
    'semir.jpeg': eduimagesemir,
  };

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const data = await getCompanyProfile();
        if (data) {
          setWhatWeDo(data.whatWeDo ? JSON.parse(data.whatWeDo) : []);
          setDifferenceItems(data.differenceItems ? JSON.parse(data.differenceItems) : []);
          setTeamMembers(data.teamMembers ? JSON.parse(data.teamMembers) : []);
          setWhoWeAre(data.whoWeAre || '');
        }
      } catch (error) {
        console.error('An error occurred while loading about us information:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyProfile();
  }, []);

  if (loading) {
    return (
      <div className="sublogin-fullpage-loading">
        <div className="sublogin-hamster-loading">
          <HamsterWheel />
        </div>
        <p className="loading-text">About Us Loading...</p>
      </div>
    );
  }

  return (
    <div className="about-container">
      <FirstNavbar visibleButtons={['home', 'about', 'contact', 'missionvision', 'login']} />

      <div className="hero-section">
        <div className="hero-content">
          <h1>About <span className="highlight">metaLink</span></h1>
          <p className="tagline">Revolutionizing Education Through Personalized AI Learning</p>
        </div>
      </div>

      <div className="content-section">
        <div className="about-card">
          <div className="image-container">
            <img src={eduimage} alt="AI in Education" className="about-image" />
          </div>
          <div className="text-content">
            <h2>Who We Are</h2>
            {whoWeAre ? (
              <p>{whoWeAre}</p>
            ) : (
              <p>Loading who we are...</p>
            )}
          </div>
        </div>

        <div className="about-card reverse">
          <div className="image-container">
            <img src={eduimage2} alt="Personalized Learning Experience" className="about-image" />
          </div>
          <div className="text-content">
            <h2>What We Do</h2>
            {whatWeDo.length > 0 ? (
              whatWeDo.map((item, index) => (
                <div key={index}>
                  <h3>{item.Title}</h3>
                  <p>{item.Description}</p>
                </div>
              ))
            ) : (
              <p>Loading what we do...</p>
            )}
          </div>
        </div>

        <div className="about-card">
          <div className="image-container">
            <img src={eduimage3} alt="Connected Learning Environment" className="about-image" />
          </div>
          <div className="text-content">
            <h2>Our Difference</h2>
            {differenceItems.length > 0 ? (
              <ul>
                {differenceItems.map((item, index) => (
                  <li key={index}>
                    <strong>{item.Title}:</strong> {item.Description}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Loading differences...</p>
            )}
          </div>
        </div>
      </div>

      <div className="team-section">
        <h2>Meet Our Team</h2>
        <div className="team-grid">
          {teamMembers.length > 0 ? (
            teamMembers.map((member, index) => (
              <div key={index} className="team-member">
                <img
                  src={imageMap[member.image] || '/path/to/default-image.jpg'}
                  alt={member.FullName}
                  className="member-image"
                  onError={(e) => (e.target.src = '/path/to/default-image.jpg')}
                />
                <h3>{member.FullName}</h3>
                <p>{member.Title}</p>
              </div>
            ))
          ) : (
            <p>Loading team members...</p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AboutUs;
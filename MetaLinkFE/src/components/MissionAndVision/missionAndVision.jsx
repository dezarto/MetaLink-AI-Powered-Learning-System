import React, { useState, useEffect } from 'react';
import './MissionAndVision.css';
import mission2 from '../../assets/mission2.png';
import vision2 from '../../assets/mission.avif';
import FirstNavbar from "../Navbar/FirstNavbar.jsx";
import Footer from '../Footer/Footer.jsx';
import { getCompanyProfile } from '../../services/user-api.js';
import HamsterWheel from '../Spinner/HamsterWheel';

const MissionVision = () => {
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [coreValues, setCoreValues] = useState({});
  const [loading, setLoading] = useState(true);  // <-- BU SATIR ÖNEMLİ

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const data = await getCompanyProfile();
        if (data) {
          setMission(data.mission || '');
          setVision(data.vision || '');
          setCoreValues(data.coreValues ? JSON.parse(data.coreValues) : {});
        }
      } catch (error) {
        console.error('Misyon ve vizyon bilgileri yüklenirken hata oluştu:', error);
      }finally {
        setLoading(false); // <-- İşlem bitince loading false
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
        <p className="loading-text">Mission And Vision Loading...</p>
      </div>
    );
  }

  return (
    <div className="mission-container">
      <FirstNavbar visibleButtons={["home", "about", "contact", "missionvision", "login"]} />

      <div className="hero-section">
        <div className="hero-content">
          <h1>Our <span className="highlight">Mission</span> & <span className="highlight">Vision</span></h1>
          <p className="tagline">Transforming Education Through Personalized Intelligence</p>
        </div>
      </div>

      <div className="content-section">
        <div className="mission-vision-card">
          <div className="image-container">
            <img src={mission2} alt="Our Mission" className="mv-image" />
          </div>
          <div className="text-content">
            <h2>Our Mission</h2>
            <p>{mission || 'Loading mission...'}</p>
          </div>
        </div>

        <div className="mission-vision-card reverse">
          <div className="image-container">
            <img src={vision2} alt="Our Vision" className="mv-image" />
          </div>
          <div className="text-content">
            <h2>Our Vision</h2>
            <p>{vision || 'Loading vision...'}</p>
          </div>
        </div>

        <div className="values-section">
          <h2>Our Core Values</h2>
          <div className="values-grid">
            {Object.entries(coreValues).map(([key, value]) => (
              <div key={key} className="value-card">
                <h3>{key}</h3>
                <p>{value || 'Loading...'}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MissionVision;
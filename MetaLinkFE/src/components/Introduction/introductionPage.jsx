import React, { useState, useEffect } from 'react';
import './IntroductionPage.css';
import man1 from '../../assets/adam1.jpg';
import woman1 from '../../assets/kadın1.jpg';
import child1 from '../../assets/çocuk 1.jpg';
import FirstNavbar from "../Navbar/FirstNavbar.jsx";
import { useNavigate } from "react-router-dom";
import Footer from '../Footer/Footer.jsx';
import HamsterWheel from '../Spinner/HamsterWheel.jsx';

const Introduction = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // Show loading spinner for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="sublogin-fullpage-loading">
        <div className="sublogin-hamster-loading">
          <HamsterWheel />
        </div>
        <p className="loading-text">Introduction Loading...</p>
      </div>
    );
  }

  return (
    <div className="intro-container">
      <FirstNavbar visibleButtons={["home", "about", "contact", "missionvision", "login"]} />

      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to <span className="highlight">metaLink</span></h1>
          <p className="tagline">Where AI Meets Your Unique Learning Style</p>
          <button className="cta-button" onClick={() => navigate("/")}>Start Your Learning Journey</button>
        </div>
      </div>

      <div className="feature-section">
        <h2>Transforming Education Through AI Personalization</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Learning Style Assessment</h3>
            <p>
              Our proprietary assessment technology analyzes your unique learning preferences and
              cognitive patterns to create a personalized learning profile.
            </p>
          </div>

          <div className="feature-card">
            <h3>Tailored Study Materials</h3>
            <p>
              Our AI engine creates customized study notes, exercises, and tests optimized for
              your specific learning style and current knowledge level.
            </p>
          </div>

          <div className="feature-card">
            <h3>Adaptive Learning Path</h3>
            <p>
              As you progress, our system continuously adapts to your performance, strengthening
              weak areas and accelerating through mastered content.
            </p>
          </div>

          <div className="feature-card">
            <h3>Comprehensive Analytics</h3>
            <p>
              Track your progress with detailed performance metrics and compare your results
              with peers while maintaining privacy.
            </p>
          </div>
        </div>
      </div>

      <div className="how-it-works">
        <h2>How metaLink Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Take the Assessment</h3>
              <p>
                Complete our comprehensive learning style assessment to determine your
                unique cognitive profile and preferences.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Receive Your Profile</h3>
              <p>
                Get detailed insights about your learning style, strengths, and areas
                for improvement.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Access Custom Materials</h3>
              <p>
                Dive into AI-generated study materials and exercises tailored specifically
                to your learning profile.
              </p>
            </div>
          </div>

          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Track Your Progress</h3>
              <p>
                Monitor your advancement with detailed analytics and adjust your learning
                path as needed.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="testimonial-section">
        <h2>What Our Users Say</h2>
        <div className="testimonial-grid">
          <div className="testimonial-card">
            <div className="quote">"</div>
            <p>
              metaLink completely transformed my daughter's learning experience. After struggling
              with traditional teaching methods for years, she finally found a system that speaks
              her language. Her grades have improved dramatically, but more importantly, she's
              excited about learning again.
            </p>
            <div className="testimonial-author">
              <img src={woman1} alt="Parent Testimonial" className="author-image" />
              <div>
                <h4>Sarah Thompson</h4>
                <p>Parent of a 2th grader</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="quote">"</div>
            <p>
              As an educator with 20 years of experience, I've seen many educational technologies
              come and go. metaLink stands out because it truly understands that each student learns
              differently. The detailed analytics have allowed me to better support my students'
              individual needs.
            </p>
            <div className="testimonial-author">
              <img src={man1} alt="Teacher Testimonial" className="author-image" />
              <div>
                <h4>James Wilson</h4>
                <p>Primary School Science Teacher</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="quote">"</div>
            <p>
              I used to struggle with math concepts until I started using metaLink. The way the AI
              presents information matches exactly how my brain works. Now math is actually my
              favorite subject, and I'm thinking about pursuing engineering in college!
            </p>
            <div className="testimonial-author">
              <img src={child1} alt="Student Testimonial" className="author-image" />
              <div>
                <h4>Miguel Rodriguez</h4>
                <p>4th Grade Student</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-card">
          <h3>95%</h3>
          <p>of students showed improvement in test scores</p>
        </div>
        <div className="stats-card">
          <h3>87%</h3>
          <p>reported increased engagement with learning</p>
        </div>
        <div className="stats-card">
          <h3>92%</h3>
          <p>of parents observed positive changes in study habits</p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Introduction;
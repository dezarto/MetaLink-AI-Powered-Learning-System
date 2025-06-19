import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';
import ParentStudentManagement from './ParentStudentManagement';
import AvatarManagement from './AvatarManagement';
import CourseLessonManagement from './CourseLessonManagement';
import AIPromptsManagement from './AIPromptsManagement';
import GameManagement from './GameManagement';
import CompanyProfile from './CompanyProfile';
import LearningStyle from './LearningStyle';
import FirstNavbar from '../components/Navbar/FirstNavbar';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sections = [
    { id: 1, name: 'Company Profile', component: <CompanyProfile /> },
    { id: 2, name: 'Parents & Students', component: <ParentStudentManagement /> },
    { id: 3, name: 'Avatars', component: <AvatarManagement /> },
    { id: 4, name: 'Courses & Lessons', component: <CourseLessonManagement /> },
    { id: 5, name: 'AI Prompts', component: <AIPromptsManagement /> },
    { id: 6, name: 'Learning Styles', component: <LearningStyle /> },
    { id: 7, name: 'Game Functionality', component: <GameManagement /> },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('studentToken');
    sessionStorage.removeItem('isChildPerspective');
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className='admin-all'>
      <FirstNavbar visibleButtons={["home", "about", "contact", "missionvision", "login"]} />
      <div className="admin-panel">
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <span className="admin-hamburger"></span>
        </button>

        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <h1>Admin Control</h1>
          <div className="table-buttons">
            {sections.map(section => (
              <button
                key={section.id}
                className={activeSection === section.name ? 'active' : ''}
                onClick={() => {
                  setActiveSection(section.name);
                  if (window.innerWidth <= 992) {
                    setSidebarOpen(false);
                  }
                }}
              >
                {section.name}
              </button>
            ))}
          </div>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>

        {/* Main Content */}
        <div className={`admin-main-content ${sidebarOpen ? 'shifted' : ''}`}>
          {activeSection ? (
            sections.find(section => section.name === activeSection)?.component
          ) : (
            <div className="no-selection">
              <h2>Welcome to Admin Control Panel</h2>
              <p>Please select a section from the sidebar to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
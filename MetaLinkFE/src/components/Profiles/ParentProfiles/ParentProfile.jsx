import React, { useState, useEffect } from 'react';
import './ParentProfile.css';
import UserInfo from './UserInfo';
import ChildrenSection from './ChildrenSection';
import Settings from './Settings';
import ConfirmationModal from './ConfirmationModal';
import FirstNavbar from "../../Navbar/FirstNavbar.jsx";
import PersonPhoto from "../../../assets/person-image.png";
import HamsterWheel from '../../Spinner/HamsterWheel';
import {
  getUserInformation,
  updateUserById,
  getStudentsByUser
} from '../../../services/user-api.js';
import authService from '../../../services/authService';

// ParentProfile component manages the user profile interface with sidebar navigation
const ParentProfile = () => {
  // State for managing active section, sidebar state, user data, and loading status
  const [activeSection, setActiveSection] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [userData, setUserData] = useState(null);
  const [childrenData, setChildrenData] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const userID = authService.getUserIdFromToken();

  // Handle sidebar collapse based on window size
  useEffect(() => {
    const checkWindowSize = () => {
      setSidebarCollapsed(window.innerWidth < 768);
    };

    checkWindowSize();
    window.addEventListener('resize', checkWindowSize);
    return () => window.removeEventListener('resize', checkWindowSize);
  }, []);

  // Fetch user and children data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getUserInformation(userID);
        setUserData({
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          isActive: data.isActive,
          dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : '',
          phone: data.phone,
          pin: data.pin
        });

        const children = await getStudentsByUser(userID);
        setChildrenData(children);
      } catch (error) {
        console.error("Data fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userID]);

  // Switch between profile sections (info, children, settings)
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  // Store pending user info changes and show confirmation modal
  const handleUserInfoChange = (updatedInfo) => {
    setPendingChanges(updatedInfo);
    setShowConfirmation(true);
  };

  // Handle confirmation for saving user info changes
  const handleConfirmation = async (confirmed) => {
    if (confirmed && pendingChanges) {
      setIsLoading(true);
      try {
        const response = await updateUserById(userID, pendingChanges);

        if (response.status === 200) {
          const data = await getUserInformation(userID);
          setUserData({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            isActive: data.isActive,
            dateOfBirth: data.dateOfBirth ? data.dateOfBirth.split("T")[0] : '',
            phone: data.phone,
            pin: data.pin
          });

          alert("User updated successfully.");
        }
      } catch (error) {
        console.error("Error updating user:", error);
      } finally {
        setIsLoading(false);
      }
    }

    setShowConfirmation(false);
    setPendingChanges(null);
  };

  // Toggle sidebar collapse state
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Show loading spinner while data is being fetched
  if (isLoading) {
    return (
      <div className="sublogin-fullpage-loading">
        <div className="sublogin-hamster-loading">
          <HamsterWheel />
        </div>
        <p className="loading-text">Profile Loading...</p>
      </div>
    );
  }

  // Render the profile interface with sidebar and content area
  return (
    <div className='parentProfileBody'>
      <div>
        <FirstNavbar visibleButtons={["users", "subLogin", "logout"]} />
      </div>
      <div className="profile-container">
        <div className={`parent-sidebar ${sidebarCollapsed ? 'parent-collapsed' : ''}`}>
          <div className="toggle-sidebar" onClick={toggleSidebar}>
            {sidebarCollapsed ? '→' : '←'}
          </div>
          <div className={`profile-photo ${sidebarCollapsed ? 'small' : ''}`}>
            <img src={PersonPhoto} alt="Profile" />
          </div>
          <div className="parent-navigation">
            <button
              className={`parent-nav-button ${activeSection === 'info' ? 'active' : ''}`}
              onClick={() => handleSectionChange('info')}
              title="My Information"
            >
              {sidebarCollapsed ? (
                <span className="icon">👤</span>
              ) : (
                "My Information"
              )}
            </button>
            <button
              className={`parent-nav-button ${activeSection === 'children' ? 'active' : ''}`}
              onClick={() => handleSectionChange('children')}
              title="My Children"
            >
              {sidebarCollapsed ? (
                <span className="icon">👪</span>
              ) : (
                "My Children"
              )}
            </button>
            <button
              className={`parent-nav-button ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={() => handleSectionChange('settings')}
              title="Settings"
            >
              {sidebarCollapsed ? (
                <span className="icon">⚙️</span>
              ) : (
                "Settings"
              )}
            </button>
          </div>
        </div>
        <div className="content-area">
          {activeSection === 'info' && userData && (
            <UserInfo
              userData={userData}
              onSave={handleUserInfoChange}
            />
          )}
          {activeSection === 'children' && (
            <ChildrenSection children={childrenData} />
          )}
          {activeSection === 'settings' && (
            <Settings />
          )}
          {!activeSection && (
            <div className="parent-welcome-message">
              <h2>Welcome to your profile</h2>
              <p>Select an option from the menu to get started</p>
            </div>
          )}
        </div>

        {showConfirmation && (
          <ConfirmationModal
            message="Are you sure you want to save these changes?"
            onConfirm={() => handleConfirmation(true)}
            onCancel={() => handleConfirmation(false)}
          />
        )}
      </div>
    </div>
  );
};

export default ParentProfile;
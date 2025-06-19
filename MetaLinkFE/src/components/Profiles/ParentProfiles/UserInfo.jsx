import React, { useState } from 'react';
import './UserInfo.css';

const UserInfo = ({ userData, onSave }) => {
  const [editedData, setEditedData] = useState({ ...userData });
  const [showPin, setShowPin] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setEditedData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedData);
  };

  const toggleShowPin = () => {
    setShowPin(!showPin);
  };

  return (
    <div className="user-info-container">
      <h2>My Information</h2>
      <form onSubmit={handleSubmit}>
        <div className="parent-form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={editedData.email}
            onChange={handleChange}
          />
        </div>

        <div className="parent-form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={editedData.firstName}
            onChange={handleChange}
          />
        </div>

        <div className="parent-form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={editedData.lastName}
            onChange={handleChange}
          />
        </div>

        <div className="parent-form-group">
          <label htmlFor="dateOfBirth">Date of Birth</label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={editedData.dateOfBirth}
            onChange={handleChange}
          />
        </div>

        <div className="parent-form-group">
          <label htmlFor="phone">Phone</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={editedData.phone}
            onChange={handleChange}
          />
        </div>

        <div className="parent-form-group password-group">
          <label htmlFor="pin">PIN</label>
          <div className="password-input-container">
            <input
              type={showPin ? "text" : "password"}
              id="pin"
              name="pin"
              value={editedData.pin}
              onChange={handleChange}
            />
            <button 
              type="button" 
              className="toggle-pin-visibility"
              onClick={toggleShowPin}
              aria-label={showPin ? "Hide password" : "Show password"}
            >
              {showPin ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
          </div>
        </div>

        <button type="submit" className="user-info-save-button">Save Changes</button>
      </form>
    </div>
  );
};

export default UserInfo;
import React, { useState } from 'react';
import './Settings.css';
import {
  updatePasswordByUser
} from '../../../services/user-api';

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'english',
    privacyLevel: 'medium'
  });

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleChangePasswordClick = () => {
    // Reset all fields and error messages when the modal is opened
    setOldPassword('');
    setNewPassword1('');
    setNewPassword2('');
    setError('');
    setShowChangePasswordModal(true);
  };

  const handleChangePasswordSubmit = async () => {
    if (!oldPassword || !newPassword1 || !newPassword2) {
      setError('Please do not leave any place.');
      return;
    }
    if (newPassword1 !== newPassword2) {
      setError('New passwords do not match.');
      return;
    }

    try {
      await updatePasswordByUser({
        oldPassword,
        newPassword: newPassword1,
        confirmNewPassword: newPassword2
      });
      setShowChangePasswordModal(false);
      setError('');
      alert('Password changed successfully!');
    } catch (error) {
      setError('Failed to change password. Please try again.');
    }
  };

  const handleChangePasswordCancel = () => {
    setShowChangePasswordModal(false);
    setOldPassword('');
    setNewPassword1('');
    setNewPassword2('');
    setError('');
  };

  return (
    <div className="settings-container">
      <h2>Settings</h2>
      <div className="settings-group">
        <div className="setting-item">
          {/* Other settings items */}
        </div>
      </div>

      <div className="settings-group">
        <h3>Account</h3>
        <button className="change-password-button" onClick={handleChangePasswordClick}>Change Password</button>
        <button className="delete-account-button" disabled>Delete Account</button>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="change-password-modal-overlay">
          <div className="change-password-modal">
            <h2>Change Password</h2>
            <p>Please enter your old password and new password</p>

            <div className="change-password-input-container">
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Old Password"
                className="change-password-input"
              />
              <input
                type="password"
                value={newPassword1}
                onChange={(e) => setNewPassword1(e.target.value)}
                placeholder="New Password"
                className="change-password-input"
              />
              <input
                type="password"
                value={newPassword2}
                onChange={(e) => setNewPassword2(e.target.value)}
                placeholder="Confirm New Password"
                className="change-password-input"
              />
              {error && <p className="change-password-error">{error}</p>}
            </div>

            <div className="change-password-buttons">
              <button className="change-password-button change-password-cancel" onClick={handleChangePasswordCancel}>
                Cancel
              </button>
              <button className="change-password-button change-password-submit" onClick={handleChangePasswordSubmit}>
                Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
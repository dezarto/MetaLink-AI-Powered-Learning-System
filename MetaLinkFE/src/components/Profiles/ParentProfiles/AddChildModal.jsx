import React, { useState } from 'react';
import './AddChildModal.css';
import { addStudent } from '../../../services/user-api';
import authService from '../../../services/authService';

const AddChildModal = ({ onAdd, onClose }) => {
  const parentId = parseInt(authService.getUserIdFromToken(), 10);

  const [childData, setChildData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    class: 1,
    gender: false,
    themeChoice: 1,
    parentId: parentId,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'gender') {
      setChildData(prev => ({
        ...prev,
        [name]: value === 'false' ? false : true
      }));
    } else {
      setChildData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setChildData(prev => ({
      ...prev,
      [name]: parseInt(value, 10) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const addedStudent = await addStudent(childData);
      onAdd(addedStudent);
      onClose();
    } catch (err) {
      setError('Failed to add student: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Child</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="add-child-form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={childData.firstName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="add-child-form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={childData.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="add-child-form-group">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={childData.dateOfBirth}
              onChange={handleChange}
              required
            />
          </div>

          <div className="add-child-form-group">
            <label htmlFor="class">Class</label>
            <input
              type="number"
              id="class"
              name="class"
              value={childData.class}
              onChange={handleNumberChange}
              min="1"
              max="12"
              required
            />
          </div>

          <div className="add-child-form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={childData.gender.toString()}
              onChange={handleChange}
            >
              <option value="false">Erkek</option>
              <option value="true">Kadın</option>
            </select>
          </div>

          <div className="add-child-form-group">
            <label htmlFor="themeChoice">Theme Choice</label>
            <input
              type="number"
              id="themeChoice"
              name="themeChoice"
              value={childData.themeChoice}
              onChange={handleNumberChange}
              min="1"
              max="5"
            />
          </div>

          <div className="modal-buttons">
            <button
              type="submit"
              className="add-child-confirm-button"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Child'}
            </button>
            <button
              type="button"
              className="add-child-cancel-button"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddChildModal;
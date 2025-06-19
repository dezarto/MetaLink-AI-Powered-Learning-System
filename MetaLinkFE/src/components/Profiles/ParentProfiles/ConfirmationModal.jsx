// src/components/Profiles/ConfirmationModal.jsx

import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content confirmation-modal">
        <h3>{message}</h3>
        <div className="confirmationmodal-modal-buttons">
          <button onClick={() => onConfirm()} className="confirmationmodal-confirm-button">Yes</button>
          <button onClick={() => onCancel()} className="confirmationmodal-cancel-button">No</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
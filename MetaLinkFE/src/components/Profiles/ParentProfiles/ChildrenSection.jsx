import React, { useState, useEffect } from 'react';
import './ChildrenSection.css';
import AddChildModal from './AddChildModal';
import ChildDetail from './ChildDetail';
import ConfirmationModal from './ConfirmationModal';
import {
  getStudentsByUser,
  updateStudentsByStudentId,
  deleteStudentByStudentId
} from '../../../services/user-api';
import authService from '../../../services/authService';

const ChildrenSection = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(null);
  const [activeTab, setActiveTab] = useState('info');
  const parentID = authService.getUserIdFromToken();

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const students = await getStudentsByUser();
        setChildren(students);
      } catch (error) {
        console.error("Error fetching children:", error);
      }
    };
    fetchChildren();
  }, []);

  const handleSelectChild = (child) => {
    setSelectedChild(child);
    setActiveTab('info');
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleSaveChildInfo = (updatedInfo) => {
    setPendingChanges(updatedInfo);
    setShowConfirmation(true);
  };

  const handleConfirmation = async (confirmed) => {
    if (confirmed && pendingChanges) {
      try {
        const newInfo = {
          parentId: parentID,
          firstName: pendingChanges.firstName,
          lastName: pendingChanges.lastName,
          dateOfBirth: pendingChanges.dateOfBirth,
          gender: pendingChanges.gender,
          themeChoice: pendingChanges.themeChoice,
          class: pendingChanges.class
        };

        await updateStudentsByStudentId(selectedChild.studentID, newInfo);

        setChildren(prev =>
          prev.map(child =>
            child.studentID === selectedChild.studentID ? { ...child, ...pendingChanges } : child
          )
        );
        setSelectedChild(prev => ({ ...prev, ...pendingChanges }));
      } catch (error) {
        console.error("Error updating child:", error);
        alert("Çocuk bilgileri güncellenirken bir hata oluştu.");
      }
    }
    setShowConfirmation(false);
    setPendingChanges(null);
  };

  const handleDeleteChild = async (childId) => {
    try {
      await deleteStudentByStudentId(childId);
      setChildren(prev => prev.filter(child => child.studentID !== childId));
      setSelectedChild(null);
    } catch (error) {
      console.error("Error deleting child:", error);
    }
  };

  return (
    <div className="children-section">
      <div className="children-top-section">
        <div className="children-list">
          {children.length > 0 ? (
            children.map(child => (
              <div
                key={child.studentID} // Use studentID as key
                className={`child-box ${selectedChild?.studentID === child.studentID ? 'selected' : ''}`}
                onClick={() => handleSelectChild(child)}
              >
                {child.firstName} {child.lastName}
              </div>
            ))
          ) : (
            <div className="no-children-message">No children added yet</div>
          )}
        </div>
        <button className="add-child-button" onClick={() => setShowAddModal(true)}>
          Add Child
        </button>
      </div>

      <div className="children-detail-section">
        {selectedChild ? (
          <>
            <div className="child-tabs">
              <button
                className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
                onClick={() => handleTabChange('info')}
              >
                Information
              </button>
              <button
                className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
                onClick={() => handleTabChange('friends')}
              >
                Friends
              </button>
              <button
                className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
                onClick={() => handleTabChange('statistics')}
              >
                Statistics
              </button>
              <button
                className={`tab-button ${activeTab === 'perspective' ? 'active' : ''}`}
                onClick={() => handleTabChange('perspective')}
              >
                Child's Perspective
              </button>
            </div>

            <ChildDetail
              child={selectedChild}
              activeTab={activeTab}
              onSave={handleSaveChildInfo}
              onUpdate={(updatedChild) => {
                setChildren(prev =>
                  prev.map(child =>
                    child.studentID === selectedChild.studentID ? updatedChild : child
                  )
                );
                setSelectedChild(updatedChild);
              }}
              onDelete={() => handleDeleteChild(selectedChild.studentID)}
              key={selectedChild.studentID} // Use studentID as key
            />
          </>
        ) : (
          <div className="no-child-selected">
            <p>Select a child or add a new one to view details</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <AddChildModal
          onAdd={(childData) => {
            setChildren(prev => [...prev, childData]);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showConfirmation && (
        <ConfirmationModal
          message="Are you sure you want to save these changes?"
          onConfirm={() => handleConfirmation(true)}
          onCancel={() => handleConfirmation(false)}
        />
      )}
    </div>
  );
};

export default ChildrenSection;
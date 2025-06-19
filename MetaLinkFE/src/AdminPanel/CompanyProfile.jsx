import React, { useState, useEffect } from 'react';
import {
    getCompanyProfile,
    createCompanyProfile,
    updateCompanyProfile,
    deleteCompanyProfile,
} from '../services/admin-api';

const CompanyProfile = () => {
    const [profile, setProfile] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingProfile, setEditingProfile] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await getCompanyProfile();
                setProfile(data || null);
            } catch (error) {
                console.error('Şirket profili alma hatası:', error);
                setProfile(null);
            }
        };
        fetchProfile();
    }, []);

    const handleAdd = () => {
        setModalType('add');
        setEditingProfile({
            name: '',
            mission: '',
            vision: '',
            coreValues: '',
            contactInfo: '',
            teamMembers: '',
            whatWeDo: '',
            differenceItems: '',
            whoWeAre: ''
        });
        setShowModal(true);
    };

    const handleEdit = () => {
        setModalType('edit');
        setEditingProfile({ ...profile });
        setShowModal(true);
    };

    const handleDelete = () => {
        setShowDeleteConfirm(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditingProfile({ ...editingProfile, [name]: value });
    };

    const handleSave = async () => {
        try {
            if (modalType === 'add') {
                const response = await createCompanyProfile(editingProfile);
                if (response) {
                    const data = await getCompanyProfile();
                    setProfile(data);
                }
            } else if (modalType === 'edit') {
                const response = await updateCompanyProfile(editingProfile);
                if (response) {
                    const data = await getCompanyProfile();
                    setProfile(data);
                }
            }
            setShowModal(false);
            setEditingProfile(null);
        } catch (error) {
            console.error('Şirket profili kaydetme hatası:', error);
        }
    };

    const confirmDelete = async () => {
        try {
            if (profile && profile.id) {
                const response = await deleteCompanyProfile(profile.id);
                if (response) {
                    setProfile(null);
                }
            }
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('Şirket profili silme hatası:', error);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
    };

    return (
        <div className="table-main">
            <div className="table-header">
                <h2>Company Profile</h2>
                {!profile && (
                    <button className="add-button" onClick={handleAdd}>
                        Add Company Profile
                    </button>
                )}
            </div>
            <div className="table-container">
                {!profile ? (
                    <div className="empty-state">
                        <p>Şirket profili bulunamadı.</p>
                    </div>
                ) : (
                    <div>
                        <h3>{profile.name}</h3>
                        <p><strong>Who We Are:</strong> {profile.whoWeAre}</p>
                        <p><strong>Mission:</strong> {profile.mission}</p>
                        <p><strong>Vision:</strong> {profile.vision}</p>
                        <p><strong>Core Values:</strong> {profile.coreValues}</p>
                        <p><strong>Contact Info:</strong> {profile.contactInfo}</p>
                        <p><strong>Team Members:</strong> {profile.teamMembers}</p>
                        <p><strong>What We Do:</strong> {profile.whatWeDo}</p>
                        <p><strong>Difference Items:</strong> {profile.differenceItems}</p>
                        <div className="admin-actions">
                            <button onClick={handleEdit}>Edit</button>
                            <button onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modalType === 'add' ? 'Add Company Profile' : 'Edit Company Profile'}</h3>
                            <button className="close-button" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {['name', 'whoWeAre', 'mission', 'vision', 'coreValues', 'contactInfo', 'teamMembers', 'whatWeDo', 'differenceItems'].map((field) => (
                                <div className="form-group" key={field}>
                                    <label>{field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}</label>
                                    <textarea
                                        name={field}
                                        value={editingProfile[field]}
                                        onChange={handleInputChange}
                                        rows="3"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="modal-footer">
                            <button className="save-button" onClick={handleSave}>Save</button>
                            <button className="cancel-button" onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && (
                <div className="modal-backdrop">
                    <div className="modal confirm-modal">
                        <div className="modal-header">
                            <h3>Confirm Deletion</h3>
                        </div>
                        <div className="modal-body">
                            <p>Şirket profilini silmek istediğine emin misin?</p>
                            {profile && <p className="delete-item-name">{profile.name}</p>}
                        </div>
                        <div className="modal-footer">
                            <button className="delete-confirm-button" onClick={confirmDelete}>Yes, Delete</button>
                            <button className="cancel-button" onClick={cancelDelete}>No, Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyProfile;

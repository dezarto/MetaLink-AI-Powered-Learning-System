import React, { useState, useEffect } from 'react';
import {
    getAllAvatars,
    createAvatar,
    updateAvatar,
    deleteAvatar,
} from '../services/admin-api';

const AvatarManagement = () => {
    const [avatars, setAvatars] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'add', 'edit'
    const [editingItem, setEditingItem] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const BASE_URL = 'https://localhost:7239';

    useEffect(() => {
        const fetchAvatars = async () => {
            try {
                const data = await getAllAvatars();
                console.log(data);
                setAvatars(data);
            } catch (error) {
                console.error('Avatarları alma hatası:', error);
            }
        };
        fetchAvatars();
    }, []);

    const handleAdd = () => {
        setModalType('add');
        setEditingItem({
            avatarName: '',
            avatarLevel: 0,
            isActive: true,
            base64Image: '',
        });
        setShowModal(true);
    };

    const handleEdit = (avatar) => {
        setModalType('edit');
        setEditingItem({
            avatarID: avatar.avatarID,
            avatarName: avatar.avatarName,
            avatarLevel: avatar.avatarLevel,
            isActive: avatar.isActive,
            base64Image: '',
        });
        setShowModal(true);
    };

    const handleDelete = (avatar) => {
        setItemToDelete(avatar);
        setShowDeleteConfirm(true);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = value;

        if (name === 'avatarLevel') {
            newValue = value === '' ? 0 : parseInt(value, 10);
        } else if (name === 'isActive') {
            newValue = checked;
        } else if (name === 'base64Image' && e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setEditingItem({ ...editingItem, base64Image: reader.result });
            };
            reader.readAsDataURL(file);
            return;
        }

        setEditingItem({ ...editingItem, [name]: newValue });
    };

    const handleSave = async () => {
        try {
            if (modalType === 'add') {
                const avatarData = {
                    avatarName: editingItem.avatarName,
                    avatarLevel: parseInt(editingItem.avatarLevel, 10),
                    isActive: editingItem.isActive,
                    base64Image: editingItem.base64Image,
                };
                const response = await createAvatar(avatarData);
                if (response) {
                    const data = await getAllAvatars();
                    setAvatars(data);
                }
            } else if (modalType === 'edit') {
                const avatarData = {
                    avatarName: editingItem.avatarName,
                    avatarLevel: parseInt(editingItem.avatarLevel, 10),
                    isActive: editingItem.isActive,
                    base64Image: editingItem.base64Image || null,
                };
                const response = await updateAvatar(editingItem.avatarID, avatarData);
                if (response) {
                    const data = await getAllAvatars();
                    setAvatars(data);
                }
            }
            setShowModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Avatar kaydetme hatası:', error);
        }
    };

    const confirmDelete = async () => {
        try {
            const response = await deleteAvatar(itemToDelete.avatarID);
            if (response) {
                setAvatars(avatars.filter(a => a.avatarID !== itemToDelete.avatarID));
            }
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Avatar silme hatası:', error);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
    };

    return (
        <div className="table-main">
            <div className="table-header">
                <h2>Avatars</h2>
                <button className="add-button" onClick={handleAdd}>Add Avatar</button>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Level</th>
                            <th>Image</th>
                            <th>Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {avatars.map(avatar => (
                            <tr key={avatar.avatarID}>
                                <td>{avatar.avatarName}</td>
                                <td>{avatar.avatarLevel}</td>
                                <td>
                                    <img
                                        src={`${BASE_URL}${avatar.avatarPath}`}
                                        alt={avatar.avatarName}
                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                        onError={(e) => {
                                            e.target.src = '/path/to/fallback-image.png'; // Hata durumunda yedek resim
                                        }}
                                    />
                                </td>
                                <td>{avatar.isActive ? 'Yes' : 'No'}</td>
                                <td className="admin-actions">
                                    <button onClick={() => handleEdit(avatar)}>Edit</button>
                                    <button onClick={() => handleDelete(avatar)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modalType === 'add' ? 'Add Avatar' : 'Edit Avatar'}</h3>
                            <button className="close-button" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Avatar Name</label>
                                <input
                                    type="text"
                                    name="avatarName"
                                    value={editingItem.avatarName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Avatar Level</label>
                                <input
                                    type="number"
                                    name="avatarLevel"
                                    value={editingItem.avatarLevel}
                                    onChange={handleInputChange}
                                    step="1"
                                />
                            </div>
                            <div className="form-group">
                                <label>Is Active</label>
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={editingItem.isActive}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Avatar Image (PNG/JPG)</label>
                                <input
                                    type="file"
                                    name="base64Image"
                                    accept="image/png, image/jpeg"
                                    onChange={handleInputChange}
                                />
                                {modalType === 'edit' && !editingItem.base64Image && (
                                    <p>Mevcut resim: {avatars.find(a => a.avatarID === editingItem.avatarID)?.avatarPath}</p>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="save-button" onClick={handleSave}>Save</button>
                            <button className="cancel-button" onClick={() => setShowModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal-backdrop">
                    <div className="modal confirm-modal">
                        <div className="modal-header">
                            <h3>Confirm Deletion</h3>
                        </div>
                        <div className="modal-body">
                            <p>Silmek istediğine emin misin?</p>
                            <p className="delete-item-name">{itemToDelete.avatarName}</p>
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

export default AvatarManagement;
import React, { useState, useEffect } from 'react';
import { getAllGames, createGame, updateGame, deleteGame } from '../services/admin-api';

const GameManagement = () => {
    const [games, setGames] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Enum mapping for GameTypeEnum
    const gameTypeMap = {
        0: 'Single',
        1: 'Online',
        2: 'Both',
    };

    const reverseGameTypeMap = {
        Single: 0,
        Online: 1,
        Both: 2,
    };

    useEffect(() => {
        const fetchGames = async () => {
            try {
                const data = await getAllGames();
                setGames(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Oyunları alma hatası:', error);
                setGames([]);
            }
        };
        fetchGames();
    }, []);

    const handleAdd = () => {
        setModalType('add');
        setEditingItem({
            name: '',
            type: 'Single', // Default to Single for ColorMatch
            description: '',
        });
        setShowModal(true);
    };

    const handleEdit = (game) => {
        setModalType('edit');
        setEditingItem({
            id: game.id,
            name: game.name,
            type: gameTypeMap[game.type], // Convert enum to string
            description: game.description,
        });
        setShowModal(true);
    };

    const handleDelete = (game) => {
        setItemToDelete(game);
        setShowDeleteConfirm(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditingItem({ ...editingItem, [name]: value });
    };

    const handleSave = async () => {
        try {
            const gameData = {
                name: editingItem.name,
                type: reverseGameTypeMap[editingItem.type], // Convert string to enum
                description: editingItem.description,
            };

            if (modalType === 'add') {
                const response = await createGame(gameData);
                if (response) {
                    const data = await getAllGames();
                    setGames(Array.isArray(data) ? data : []);
                }
            } else if (modalType === 'edit') {
                const response = await updateGame(editingItem.id, gameData);
                if (response) {
                    const data = await getAllGames();
                    setGames(Array.isArray(data) ? data : []);
                }
            }
            setShowModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('Oyun kaydetme hatası:', error);
        }
    };

    const confirmDelete = async () => {
        try {
            const response = await deleteGame(itemToDelete.id);
            if (response) {
                setGames(games.filter((g) => g.id !== itemToDelete.id));
            }
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('Oyun silme hatası:', error);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
    };

    return (
        <div className="table-main">
            <div className="table-header">
                <h2>Game Management</h2>
                <button className="add-button" onClick={handleAdd}>
                    Add Game
                </button>
            </div>
            <div className="table-container">
                {games.length === 0 ? (
                    <div className="empty-state">
                        <p>Oyun eklenmedi.</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {games.map((game) => (
                                <tr key={game.id}>
                                    <td>{game.id}</td>
                                    <td>{game.name}</td>
                                    <td>{gameTypeMap[game.type] || 'Bilinmeyen Tür'}</td>
                                    <td>{game.description}</td>
                                    <td className="admin-actions">
                                        <button onClick={() => handleEdit(game)}>Edit</button>
                                        <button onClick={() => handleDelete(game)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modalType === 'add' ? 'Add Game' : 'Edit Game'}</h3>
                            <button className="close-button" onClick={() => setShowModal(false)}>
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editingItem.name}
                                    onChange={handleInputChange}
                                    placeholder="Enter game name"
                                />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select name="type" value={editingItem.type} onChange={handleInputChange}>
                                    <option value="Single">Single</option>
                                    <option value="Online">Online</option>
                                    <option value="Both">Both</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={editingItem.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="Enter game description"
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="save-button" onClick={handleSave}>
                                Save
                            </button>
                            <button className="cancel-button" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
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
                            <p className="delete-item-name">{itemToDelete.name}</p>
                        </div>
                        <div className="modal-footer">
                            <button className="delete-confirm-button" onClick={confirmDelete}>
                                Yes, Delete
                            </button>
                            <button className="cancel-button" onClick={cancelDelete}>
                                No, Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GameManagement;
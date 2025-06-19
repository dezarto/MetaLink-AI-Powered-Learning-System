import React, { useState, useEffect } from 'react';
import {
    getAllAIPrompts,
    createAIPrompt,
    updateAIPrompt,
    deleteAIPrompt,
} from '../services/admin-api';

const AIPromptsManagement = () => {
    const [prompts, setPrompts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Enum mapping
    const contentTypeMap = {
        0: "LessonSummary",
        1: "LessonContent",
        2: "Test",
        3: "Quiz",
        4: "AssistantRobot",
        5: "ContentAssistantRobot",
        6: "GeneralTest",
        7: "TestAssistantRobot",
        8: "QuizAssistantRobot",
        9: "AvatarAssistantRobot",
        10: "AnalyzeMessageContent",
        11: "LessonImage",
        12: "GeneralQuiz",
        13: "GenerateReport",
        14: "ReviewSessionLessonSummary",
        15: "ReviewSessionLessonContent"
    };

    const reverseContentTypeMap = {
        "LessonSummary": 0,
        "LessonContent": 1,
        "Test": 2,
        "Quiz": 3,
        "AssistantRobot": 4,
        "ContentAssistantRobot": 5,
        "GeneralTest": 6,
        "TestAssistantRobot": 7,
        "QuizAssistantRobot": 8,
        "AvatarAssistantRobot": 9,
        "AnalyzeMessageContent": 10,
        "LessonImage": 11,
        "GeneralQuiz": 12,
        "GenerateReport": 13,
        "ReviewSessionLessonSummary": 14,
        "ReviewSessionLessonContent": 15
    };

    useEffect(() => {
        const fetchPrompts = async () => {
            try {
                const data = await getAllAIPrompts();
                setPrompts(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('AI prompt’ları alma hatası:', error);
                setPrompts([]);
            }
        };
        fetchPrompts();
    }, []);

    const handleAdd = () => {
        setModalType('add');
        setEditingItem({
            promptText: '',
            contentType: 'LessonSummary', // Varsayılan string değer
            createDate: new Date().toISOString().slice(0, 10),
        });
        setShowModal(true);
    };

    const handleEdit = (prompt) => {
        setModalType('edit');
        setEditingItem({
            promptID: prompt.promptID,
            promptText: prompt.promptText,
            contentType: contentTypeMap[prompt.contentType], // Sayıyı string’e çevir
            createDate: prompt.createDate.slice(0, 10),
        });
        setShowModal(true);
    };

    const handleDelete = (prompt) => {
        setItemToDelete(prompt);
        setShowDeleteConfirm(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditingItem({ ...editingItem, [name]: value });
    };

    const handleSave = async () => {
        try {
            const promptData = {
                promptText: editingItem.promptText,
                contentType: reverseContentTypeMap[editingItem.contentType], // String’i sayıya çevir
                createDate: new Date(editingItem.createDate).toISOString(),
            };

            if (modalType === 'add') {
                const response = await createAIPrompt(promptData);
                if (response) {
                    const data = await getAllAIPrompts();
                    setPrompts(Array.isArray(data) ? data : []);
                }
            } else if (modalType === 'edit') {
                const response = await updateAIPrompt(editingItem.promptID, promptData);
                if (response) {
                    const data = await getAllAIPrompts();
                    setPrompts(Array.isArray(data) ? data : []);
                }
            }
            setShowModal(false);
            setEditingItem(null);
        } catch (error) {
            console.error('AI prompt kaydetme hatası:', error);
        }
    };

    const confirmDelete = async () => {
        try {
            const response = await deleteAIPrompt(itemToDelete.promptID);
            if (response) {
                setPrompts(prompts.filter(p => p.promptID !== itemToDelete.promptID));
            }
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        } catch (error) {
            console.error('AI prompt silme hatası:', error);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
    };

    return (
        <div className="table-main">
            <div className="table-header">
                <h2>AI Prompts</h2>
                <button className="add-button" onClick={handleAdd}>Add AI Prompt</button>
            </div>
            <div className="table-container">
                {prompts.length === 0 ? (
                    <div className="empty-state">
                        <p>Prompt eklenmedi.</p>
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Prompt Text</th>
                                <th>Content Type</th>
                                <th>Create Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prompts.map(prompt => (
                                <tr key={prompt.promptID}>
                                    <td>{prompt.promptText}</td>
                                    <td>{contentTypeMap[prompt.contentType] || 'Bilinmeyen Tür'}</td>
                                    <td>{new Date(prompt.createDate).toLocaleDateString()}</td>
                                    <td className="admin-actions">
                                        <button onClick={() => handleEdit(prompt)}>Edit</button>
                                        <button onClick={() => handleDelete(prompt)}>Delete</button>
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
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modalType === 'add' ? 'Add AI Prompt' : 'Edit AI Prompt'}</h3>
                            <button className="close-button" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Prompt Text</label>
                                <textarea
                                    name="promptText"
                                    value={editingItem.promptText}
                                    onChange={handleInputChange}
                                    rows="4"
                                    placeholder="Enter prompt text here"
                                />
                            </div>
                            <div className="form-group">
                                <label>Content Type</label>
                                <select
                                    name="contentType"
                                    value={editingItem.contentType}
                                    onChange={handleInputChange}
                                >
                                    <option value="LessonSummary">Lesson Summary</option>
                                    <option value="LessonContent">Lesson Content</option>
                                    <option value="Test">Test</option>
                                    <option value="Quiz">Quiz</option>
                                    <option value="AssistantRobot">Assistant Robot</option>
                                    <option value="ContentAssistantRobot">Content Assistant Robot</option>
                                    <option value="GeneralTest">General Test</option>
                                    <option value="TestAssistantRobot">Test Assistant Robot</option>
                                    <option value="QuizAssistantRobot">Quiz Assistant Robot</option>
                                    <option value="AvatarAssistantRobot">Avatar Assistant Robot</option>
                                    <option value="AnalyzeMessageContent">Analyze Message Content</option>
                                    <option value="LessonImage">Lesson Image</option>
                                    <option value="GeneralQuiz">General Quiz</option>
                                    <option value="GenerateReport">Generate Report</option>
                                    <option value="ReviewSessionLessonSummary">Review Session Lesson Summary</option>
                                    <option value="ReviewSessionLessonContent">Review Session Lesson Content</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Create Date</label>
                                <input
                                    type="date"
                                    name="createDate"
                                    value={editingItem.createDate}
                                    onChange={handleInputChange}
                                />
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
                            <p className="delete-item-name">{itemToDelete.promptText}</p>
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

export default AIPromptsManagement;
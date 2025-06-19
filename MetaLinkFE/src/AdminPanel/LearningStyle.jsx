import React, { useState, useEffect } from 'react';
import {
    getLearningStyles,
    createLearningStyleCategory,
    updateLearningStyleCategory,
    deleteLearningStyleCategory,
    createLearningStyleQuestion,
    updateLearningStyleQuestion,
    deleteLearningStyleQuestion,
} from '../services/admin-api';

const LearningStyle = () => {
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getLearningStyles();
                // Backend'den gelen verinin yapısına bağlı olarak categories ve questions'ı ayarla
                setCategories(data.learningStyleCategories || []);
            } catch (error) {
                console.error('Veri çekme hatası:', error);
            }
        };
        fetchData();
    }, []);

    const handleAddCategory = () => {
        setModalType('addCategory');
        setEditingItem({
            id: 0, // Yeni kategori için ID sıfır
            categoryName: '',
        });
        setShowModal(true);
    };

    const handleEditCategory = (category) => {
        setModalType('editCategory');
        setEditingItem({ ...category });
        setShowModal(true);
    };

    const handleAddQuestion = (category) => {
        setModalType('addQuestion');
        setSelectedCategory(category);
        setEditingItem({
            id: 0, // Yeni soru için ID sıfır
            learningStyleCategoryID: category.id,
            questionText: '',
        });
        setShowModal(true);
    };

    const handleEditQuestion = (question, category) => {
        setModalType('editQuestion');
        setSelectedCategory(category);
        setEditingItem({ ...question });
        setShowModal(true);
    };

    const handleDeleteCategory = (category) => {
        setItemToDelete(category);
        setDeleteType('category');
        setShowDeleteConfirm(true);
    };

    const handleDeleteQuestion = (question, category) => {
        setItemToDelete(question);
        setDeleteType('question');
        setSelectedCategory(category);
        setShowDeleteConfirm(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditingItem({
            ...editingItem,
            [name]: value,
        });
    };

    const handleSave = async () => {
        try {
            if (modalType === 'addCategory') {
                const response = await createLearningStyleCategory(editingItem);
                if (response) {
                    const data = await getLearningStyles();
                    setCategories(data.learningStyleCategories || []);
                }
            } else if (modalType === 'editCategory') {
                const response = await updateLearningStyleCategory(editingItem);
                if (response) {
                    setCategories(categories.map(c => (c.id === editingItem.id ? editingItem : c)));
                }
            } else if (modalType === 'addQuestion') {
                const response = await createLearningStyleQuestion(editingItem);
                if (response) {
                    const data = await getLearningStyles();
                    setCategories(data.learningStyleCategories || []);
                }
            } else if (modalType === 'editQuestion') {
                const response = await updateLearningStyleQuestion(editingItem);
                if (response) {
                    setCategories(categories.map(c =>
                        c.id === selectedCategory.id
                            ? {
                                ...c,
                                learningStyleQuestions: c.learningStyleQuestions.map(q =>
                                    q.id === editingItem.id ? editingItem : q
                                ),
                            }
                            : c
                    ));
                }
            }
            setShowModal(false);
            setEditingItem(null);
            setSelectedCategory(null);
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            if (error.response) {
                console.error('Sunucu hata detayları:', error.response.data);
            }
        }
    };

    const confirmDelete = async () => {
        try {
            if (deleteType === 'category') {
                const response = await deleteLearningStyleCategory(itemToDelete.id);
                if (response) {
                    setCategories(categories.filter(c => c.id !== itemToDelete.id));
                }
            } else if (deleteType === 'question') {
                const response = await deleteLearningStyleQuestion(itemToDelete.id);
                if (response) {
                    setCategories(categories.map(c =>
                        c.id === selectedCategory.id
                            ? {
                                ...c,
                                learningStyleQuestions: c.learningStyleQuestions.filter(q => q.id !== itemToDelete.id),
                            }
                            : c
                    ));
                }
            }
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            setSelectedCategory(null);
        } catch (error) {
            console.error('Silme hatası:', error);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setSelectedCategory(null);
    };

    const isCategoryModal = modalType.includes('Category');
    const itemType = isCategoryModal ? 'Category' : 'Question';

    const renderFormFields = () => {
        if (isCategoryModal) {
            return (
                <>
                    <div className="form-group">
                        <label>Category Name</label>
                        <input
                            type="text"
                            name="categoryName"
                            value={editingItem.categoryName}
                            onChange={handleInputChange}
                        />
                    </div>
                </>
            );
        } else {
            return (
                <>
                    <div className="form-group">
                        <label>Question Text</label>
                        <input
                            type="text"
                            name="questionText"
                            value={editingItem.questionText}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Category ID</label>
                        <input
                            type="number"
                            name="learningStyleCategoryID"
                            value={editingItem.learningStyleCategoryID}
                            onChange={handleInputChange}
                            disabled
                        />
                    </div>
                </>
            );
        }
    };

    return (
        <div className="table-main">
            <div className="table-header">
                <h2>Learning Styles Management</h2>
                <button className="add-button" onClick={handleAddCategory}>Add Category</button>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Category Name</th>
                            <th>Question Count</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(category => (
                            <React.Fragment key={category.id}>
                                <tr>
                                    <td>{category.categoryName}</td>
                                    <td>{category.learningStyleQuestions ? category.learningStyleQuestions.length : 0}</td>
                                    <td className="admin-actions">
                                        <button onClick={() => handleEditCategory(category)}>Edit Category</button>
                                        <button onClick={() => handleDeleteCategory(category)}>Delete Category</button>
                                        <button onClick={() => handleAddQuestion(category)}>Add Question</button>
                                    </td>
                                </tr>
                                {category.learningStyleQuestions && category.learningStyleQuestions.map(question => (
                                    <tr key={question.id} className="child-row">
                                        <td colSpan="2">{question.questionText}</td>
                                        <td className="admin-actions">
                                            <button onClick={() => handleEditQuestion(question, category)}>Edit Question</button>
                                            <button onClick={() => handleDeleteQuestion(question, category)}>Delete Question</button>
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="modal-backdrop" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{modalType.startsWith('add') ? 'Add' : 'Edit'} {itemType}</h3>
                            <button className="close-button" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {renderFormFields()}
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
                            <p className="delete-item-name">
                                {deleteType === 'category'
                                    ? itemToDelete.categoryName
                                    : itemToDelete.questionText}
                            </p>
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

export default LearningStyle;
import React, { useState, useEffect } from 'react';
import {
    getParentAndStudentInformation,
    createParent,
    updateParent,
    deleteParent,
    createStudent,
    updateStudent,
    deleteStudent,
} from '../services/admin-api';

const ParentStudentManagement = () => {
    const [parents, setParents] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [selectedParent, setSelectedParent] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getParentAndStudentInformation();
                setParents(data.parents);
            } catch (error) {
                console.error('Veri çekme hatası:', error);
            }
        };
        fetchData();
    }, []);

    const handleAddParent = () => {
        setModalType('addParent');
        setEditingItem({
            email: '',
            password: '',
            pin: '',
            firstName: '',
            lastName: '',
            phone: '',
            isActive: true,
            dateOfBirth: '',
        });
        setShowModal(true);
    };

    const handleEditParent = (parent) => {
        setModalType('editParent');
        setEditingItem({ ...parent });
        setShowModal(true);
    };

    const handleAddStudent = (parent) => {
        setModalType('addStudent');
        setSelectedParent(parent);
        setEditingItem({
            firstName: '',
            lastName: '',
            class: 0,
            gender: true,
            dateOfBirth: '',
            themeChoice: 0,
        });
        setShowModal(true);
    };

    const handleEditStudent = (student, parent) => {
        setModalType('editStudent');
        setSelectedParent(parent);
        setEditingItem({
            ...student,
            class: parseInt(student.class, 10),
            gender: student.gender,
            themeChoice: student.themeChoice ? parseInt(student.themeChoice, 10) : 0,
        });
        setShowModal(true);
    };

    const handleDeleteParent = (parent) => {
        setItemToDelete(parent);
        setDeleteType('parent');
        setShowDeleteConfirm(true);
    };

    const handleDeleteStudent = (student, parent) => {
        setItemToDelete(student);
        setDeleteType('student');
        setSelectedParent(parent);
        setShowDeleteConfirm(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        let newValue = value;
        if (name === 'class') {
            newValue = value === '' ? 0 : parseInt(value, 10);
        } else if (name === 'themeChoice') {
            newValue = value === '' ? 0 : parseInt(value, 10);
        } else if (name === 'gender') {
            newValue = value === 'true';
        } else if (name === 'isActive') {
            newValue = e.target.checked;
        }

        setEditingItem({
            ...editingItem,
            [name]: newValue,
        });
    };

    const handleSave = async () => {
        try {
            if (modalType === 'addParent') {
                const response = await createParent(editingItem);
                if (response) {
                    const data = await getParentAndStudentInformation();
                    setParents(data.parents);
                }
            } else if (modalType === 'editParent') {
                const response = await updateParent(editingItem.id, {
                    email: editingItem.email,
                    pin: editingItem.pin,
                    firstName: editingItem.firstName,
                    lastName: editingItem.lastName,
                    phone: editingItem.phone,
                    isActive: editingItem.isActive,
                    dateOfBirth: editingItem.dateOfBirth,
                });
                if (response) {
                    setParents(parents.map(p => (p.id === editingItem.id ? editingItem : p)));
                }
            } else if (modalType === 'addStudent') {
                const studentData = {
                    firstName: editingItem.firstName,
                    lastName: editingItem.lastName,
                    class: parseInt(editingItem.class, 10),
                    gender: editingItem.gender === 'true' || editingItem.gender === true,
                    dateOfBirth: new Date(editingItem.dateOfBirth).toISOString(),
                    themeChoice: parseInt(editingItem.themeChoice, 10),
                };
                console.log('Gönderilen öğrenci verisi:', studentData);
                const response = await createStudent(selectedParent.id, studentData);
                if (response) {
                    const data = await getParentAndStudentInformation();
                    setParents(data.parents);
                }
            } else if (modalType === 'editStudent') {
                const studentData = {
                    parentId: selectedParent.id,
                    firstName: editingItem.firstName,
                    lastName: editingItem.lastName,
                    class: parseInt(editingItem.class, 10),
                    gender: editingItem.gender === 'true' || editingItem.gender === true,
                    dateOfBirth: new Date(editingItem.dateOfBirth).toISOString(),
                };
                console.log('Gönderilen güncellenmiş öğrenci verisi:', studentData);
                const response = await updateStudent(editingItem.studentID, studentData);
                if (response) {
                    setParents(parents.map(p =>
                        p.id === selectedParent.id
                            ? {
                                ...p,
                                students: p.students.map(s => (s.studentID === editingItem.studentID ? editingItem : s)),
                            }
                            : p
                    ));
                }
            }
            setShowModal(false);
            setEditingItem(null);
            setSelectedParent(null);
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            if (error.response) {
                console.error('Sunucu hata detayları:', error.response.data);
            }
        }
    };

    const confirmDelete = async () => {
        try {
            if (deleteType === 'parent') {
                const response = await deleteParent(itemToDelete.id);
                if (response) {
                    setParents(parents.filter(p => p.id !== itemToDelete.id));
                }
            } else if (deleteType === 'student') {
                const response = await deleteStudent(itemToDelete.studentID);
                if (response) {
                    setParents(parents.map(p =>
                        p.id === selectedParent.id
                            ? { ...p, students: p.students.filter(s => s.studentID !== itemToDelete.studentID) }
                            : p
                    ));
                }
            }
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            setSelectedParent(null);
        } catch (error) {
            console.error('Silme hatası:', error);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setSelectedParent(null);
    };

    const isParentModal = modalType.includes('Parent');
    const itemType = isParentModal ? 'Parent' : 'Student';

    const renderFormFields = () => {
        if (isParentModal) {
            return (
                <>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" name="email" value={editingItem.email} onChange={handleInputChange} />
                    </div>
                    {modalType === 'addParent' && (
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" name="password" value={editingItem.password} onChange={handleInputChange} />
                        </div>
                    )}
                    <div className="form-group">
                        <label>Pin</label>
                        <input type="text" name="pin" value={editingItem.pin} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>First Name</label>
                        <input type="text" name="firstName" value={editingItem.firstName} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Last Name</label>
                        <input type="text" name="lastName" value={editingItem.lastName} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Phone</label>
                        <input type="text" name="phone" value={editingItem.phone} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <div className="checkbox-container">

                            <label>Is Active</label>
                            <input type="checkbox" name="isActive" checked={editingItem.isActive} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Date of Birth</label>
                        <input type="date" name="dateOfBirth" value={editingItem.dateOfBirth.split('T')[0]} onChange={handleInputChange} />
                    </div>
                </>
            );
        } else {
            return (
                <>
                    <div className="form-group">
                        <label>First Name</label>
                        <input type="text" name="firstName" value={editingItem.firstName} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Last Name</label>
                        <input type="text" name="lastName" value={editingItem.lastName} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                        <label>Class</label>
                        <input
                            type="number"
                            name="class"
                            value={editingItem.class}
                            onChange={handleInputChange}
                            step="1"
                        />
                    </div>
                    <div className="form-group">
                        <label>Gender</label>
                        <select name="gender" value={editingItem.gender.toString()} onChange={handleInputChange}>
                            <option value="true">Female</option>
                            <option value="false">Male</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Date of Birth</label>
                        <input type="date" name="dateOfBirth" value={editingItem.dateOfBirth.split('T')[0]} onChange={handleInputChange} />
                    </div>
                    {modalType === 'addStudent' && (
                        <div className="form-group">
                            <label>Theme Choice</label>
                            <input
                                type="number"
                                name="themeChoice"
                                value={editingItem.themeChoice}
                                onChange={handleInputChange}
                                step="1"
                            />
                        </div>
                    )}
                </>
            );
        }
    };

    return (
        <div className="table-main">
            <div className="table-header">
                <h2>Parents & Students</h2>
                <button className="add-button" onClick={handleAddParent}>Add Parent</button>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email/Class</th>
                            <th>Phone/Gender</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {parents.map(parent => (
                            <React.Fragment key={parent.id}>
                                <tr>
                                    <td>{`${parent.firstName} ${parent.lastName}`}</td>
                                    <td>{parent.email}</td>
                                    <td>{parent.phone}</td>
                                    <td className="admin-actions">
                                        <button onClick={() => handleEditParent(parent)}>Edit Parent</button>
                                        <button onClick={() => handleDeleteParent(parent)}>Delete Parent</button>
                                        <button onClick={() => handleAddStudent(parent)}>Add Student</button>
                                    </td>
                                </tr>
                                {parent.students.map(student => (
                                    <tr key={student.studentID} className="child-row">
                                        <td>{`${student.firstName} ${student.lastName}`}</td>
                                        <td>{student.class}</td>
                                        <td>{student.gender ? 'Female' : 'Male'}</td>
                                        <td className="admin-actions">
                                            <button onClick={() => handleEditStudent(student, parent)}>Edit Student</button>
                                            <button onClick={() => handleDeleteStudent(student, parent)}>Delete Student</button>
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
                                {deleteType === 'parent'
                                    ? `${itemToDelete.firstName} ${itemToDelete.lastName}`
                                    : `${itemToDelete.firstName} ${itemToDelete.lastName}`}
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

export default ParentStudentManagement;
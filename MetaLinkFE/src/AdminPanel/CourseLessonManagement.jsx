import React, { useState, useEffect } from 'react';
import {
    getCourseLessonAndSublessonInformation,
    createCourse,
    updateCourse,
    deleteCourse,
    createLesson,
    updateLesson,
    deleteLesson,
    createSubLesson,
    updateSubLesson,
    deleteSubLesson,
} from '../services/admin-api';

const CourseLessonManagement = () => {
    const [courses, setCourses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'addCourse', 'editCourse', 'addLesson', 'editLesson', 'addSublesson', 'editSublesson'
    const [editingItem, setEditingItem] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [deleteType, setDeleteType] = useState('');

    // API'den kurs, ders ve alt ders bilgilerini çekme
    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getCourseLessonAndSublessonInformation();
                setCourses(data.courses); // Backend'den gelen "Courses" alanını kullanıyoruz
            } catch (error) {
                console.error('Veri çekme hatası:', error);
            }
        };
        fetchData();
    }, []);

    const handleAddCourse = () => {
        setModalType('addCourse');
        setEditingItem({ name: '', classLevel: 0 });
        setShowModal(true);
    };

    const handleEditCourse = (course) => {
        setModalType('editCourse');
        setEditingItem({ courseID: course.courseID, name: course.name, classLevel: course.classLevel });
        setShowModal(true);
    };

    const handleAddLesson = (course) => {
        setModalType('addLesson');
        setSelectedCourse(course);
        setEditingItem({ title: '' });
        setShowModal(true);
    };

    const handleEditLesson = (lesson, course) => {
        setModalType('editLesson');
        setSelectedCourse(course);
        setEditingItem({ id: lesson.id, title: lesson.title });
        setShowModal(true);
    };

    const handleAddSublesson = (lesson, course) => {
        setModalType('addSublesson');
        setSelectedCourse(course);
        setSelectedLesson(lesson);
        setEditingItem({ title: '', lessonObjective: '' });
        setShowModal(true);
    };

    const handleEditSublesson = (sublesson, lesson, course) => {
        setModalType('editSublesson');
        setSelectedCourse(course);
        setSelectedLesson(lesson);
        setEditingItem({
            subLessonID: sublesson.subLessonID,
            title: sublesson.title,
            lessonObjective: sublesson.lessonObjective || ''
        });
        setShowModal(true);
    };

    const handleDeleteCourse = (course) => {
        setItemToDelete(course);
        setDeleteType('course');
        setShowDeleteConfirm(true);
    };

    const handleDeleteLesson = (lesson, course) => {
        setItemToDelete(lesson);
        setDeleteType('lesson');
        setSelectedCourse(course);
        setShowDeleteConfirm(true);
    };

    const handleDeleteSublesson = (sublesson, lesson, course) => {
        setItemToDelete(sublesson);
        setDeleteType('sublesson');
        setSelectedCourse(course);
        setSelectedLesson(lesson);
        setShowDeleteConfirm(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;

        if (name === 'classLevel') {
            newValue = value === '' ? 0 : parseInt(value, 10);
        }

        setEditingItem({ ...editingItem, [name]: newValue });
    };

    const handleSave = async () => {
        try {
            if (modalType === 'addCourse') {
                const courseData = {
                    name: editingItem.name,
                    classLevel: parseInt(editingItem.classLevel, 10),
                };
                const response = await createCourse(courseData);
                if (response) {
                    const data = await getCourseLessonAndSublessonInformation();
                    setCourses(data.courses);
                }
            } else if (modalType === 'editCourse') {
                const courseData = {
                    name: editingItem.name,
                    classLevel: parseInt(editingItem.classLevel, 10),
                };
                const response = await updateCourse(editingItem.courseID, courseData);
                if (response) {
                    const data = await getCourseLessonAndSublessonInformation();
                    setCourses(data.courses);
                }
            } else if (modalType === 'addLesson') {
                const response = await createLesson(selectedCourse.courseID, editingItem.title);
                if (response) {
                    const data = await getCourseLessonAndSublessonInformation();
                    setCourses(data.courses);
                }
            } else if (modalType === 'editLesson') {
                const response = await updateLesson(editingItem.id, editingItem.title);
                if (response) {
                    const data = await getCourseLessonAndSublessonInformation();
                    setCourses(data.courses);
                }
            } else if (modalType === 'addSublesson') {
                const response = await createSubLesson(selectedLesson.id, {
                    title: editingItem.title,
                    lessonObjective: editingItem.lessonObjective
                });
                if (response) {
                    const data = await getCourseLessonAndSublessonInformation();
                    setCourses(data.courses);
                }
            } else if (modalType === 'editSublesson') {
                const response = await updateSubLesson(editingItem.subLessonID, {
                    title: editingItem.title,
                    lessonObjective: editingItem.lessonObjective
                });
                if (response) {
                    const data = await getCourseLessonAndSublessonInformation();
                    setCourses(data.courses);
                }
            }
            setShowModal(false);
            setEditingItem(null);
            setSelectedCourse(null);
            setSelectedLesson(null);
        } catch (error) {
            console.error('Kaydetme hatası:', error);
        }
    };

    const confirmDelete = async () => {
        try {
            if (deleteType === 'course') {
                const response = await deleteCourse(itemToDelete.courseID);
                if (response) {
                    setCourses(courses.filter(c => c.courseID !== itemToDelete.courseID));
                }
            } else if (deleteType === 'lesson') {
                const response = await deleteLesson(itemToDelete.id);
                if (response) {
                    setCourses(courses.map(c =>
                        c.courseID === selectedCourse.courseID
                            ? { ...c, lessons: c.lessons.filter(l => l.id !== itemToDelete.id) }
                            : c
                    ));
                }
            } else if (deleteType === 'sublesson') {
                const response = await deleteSubLesson(itemToDelete.subLessonID);
                if (response) {
                    setCourses(courses.map(c =>
                        c.courseID === selectedCourse.courseID
                            ? {
                                ...c,
                                lessons: c.lessons.map(l =>
                                    l.id === selectedLesson.id
                                        ? { ...l, subLessons: l.subLessons.filter(s => s.subLessonID !== itemToDelete.subLessonID) }
                                        : l
                                ),
                            }
                            : c
                    ));
                }
            }
            setShowDeleteConfirm(false);
            setItemToDelete(null);
            setSelectedCourse(null);
            setSelectedLesson(null);
        } catch (error) {
            console.error('Silme hatası:', error);
        }
    };

    const cancelDelete = () => {
        setShowDeleteConfirm(false);
        setItemToDelete(null);
        setSelectedCourse(null);
        setSelectedLesson(null);
    };

    const getItemType = () => {
        if (modalType.includes('Course')) return 'Course';
        if (modalType.includes('Lesson')) return 'Lesson';
        return 'Sublesson';
    };

    return (
        <div className="table-main">
            <div className="table-header">
                <h2>Courses & Lessons</h2>
                <button className="add-button" onClick={handleAddCourse}>Add Course</button>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Class Level</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map(course => (
                            <React.Fragment key={course.courseID}>
                                <tr>
                                    <td>{course.name}</td>
                                    <td>{course.classLevel}</td>
                                    <td className="admin-actions">
                                        <button onClick={() => handleEditCourse(course)}>Edit Course</button>
                                        <button onClick={() => handleDeleteCourse(course)}>Delete Course</button>
                                        <button onClick={() => handleAddLesson(course)}>Add Lesson</button>
                                    </td>
                                </tr>
                                {course.lessons.map(lesson => (
                                    <React.Fragment key={lesson.id}>
                                        <tr className="child-row">
                                            <td>{lesson.title}</td>
                                            <td>-</td>
                                            <td className="admin-actions">
                                                <button onClick={() => handleEditLesson(lesson, course)}>Edit Lesson</button>
                                                <button onClick={() => handleDeleteLesson(lesson, course)}>Delete Lesson</button>
                                                <button onClick={() => handleAddSublesson(lesson, course)}>Add Sublesson</button>
                                            </td>
                                        </tr>
                                        {lesson.subLessons.map(sublesson => (
                                            <tr key={sublesson.subLessonID} className="subchild-row">
                                                <td>{sublesson.title}</td>
                                                <td>-</td>
                                                <td className="admin-actions">
                                                    <button onClick={() => handleEditSublesson(sublesson, lesson, course)}>Edit Sublesson</button>
                                                    <button onClick={() => handleDeleteSublesson(sublesson, lesson, course)}>Delete Sublesson</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
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
                            <h3>{modalType.startsWith('add') ? 'Add' : 'Edit'} {getItemType()}</h3>
                            <button className="close-button" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {modalType.includes('Course') ? (
                                <>
                                    <div className="form-group">
                                        <label>Course Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={editingItem.name}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Class Level</label>
                                        <input
                                            type="number"
                                            name="classLevel"
                                            value={editingItem.classLevel}
                                            onChange={handleInputChange}
                                            step="1"
                                        />
                                    </div>
                                </>
                            ) : modalType.includes('Sublesson') ? (
                                <>
                                    <div className="form-group">
                                        <label>Sublesson Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={editingItem.title}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Lesson Objective</label>
                                        <textarea
                                            name="lessonObjective"
                                            value={editingItem.lessonObjective}
                                            onChange={handleInputChange}
                                            rows="4"
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="form-group">
                                    <label>Lesson Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={editingItem.title}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            )}
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
                                {deleteType === 'course' ? itemToDelete.name : itemToDelete.title}
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

export default CourseLessonManagement;
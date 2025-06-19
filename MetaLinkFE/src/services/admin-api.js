import axios from 'axios';
import authService from './authService';

const API_URL = 'https://localhost:7239/api';

// #region Helper Functions
const getHeaders = () => ({
    headers: {
        Authorization: `Bearer ${authService.getToken()}`,
        'Content-Type': 'application/json',
    },
});

const handleError = (error, action) => {
    let errorMessage = `${action} error: `;
    if (error.response) {
        if (error.response.status === 401) {
            authService.logout(); // Clear token and log out on 401 error
            window.location.href = '/'; // Redirect to home page
        }
        errorMessage += `Server error - ${error.response.status}: ${error.response.data?.message || 'Unknown error'} - ${JSON.stringify(error.response, null, 2)}`;
    } else if (error.request) {
        errorMessage += 'No response from server. Check your network connection.';
    } else {
        errorMessage += `Request error: ${error.message}`;
    }
    console.error(errorMessage);
    throw errorMessage;
};
// #endregion

// #region Parent and Student Operations
export const getParentAndStudentInformation = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/get-parent-and-student-information`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Ebeveyn ve öğrenci bilgisi alma');
    }
};

export const createParent = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/admin/create-parent`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Ebeveyn oluşturma');
    }
};

export const updateParent = async (parentId, data) => {
    try {
        const response = await axios.put(`${API_URL}/admin/update-parent-by-parent-id/${parentId}`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Ebeveyn güncelleme');
    }
};

export const deleteParent = async (parentId) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/delete-parent-by-parent-id/${parentId}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Ebeveyn silme');
    }
};

export const createStudent = async (parentId, data) => {
    try {
        const response = await axios.post(`${API_URL}/admin/create-student-by-parent-id/${parentId}`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Öğrenci oluşturma');
    }
};

export const updateStudent = async (studentId, data) => {
    try {
        const response = await axios.put(`${API_URL}/admin/update-student-by-student-id/${studentId}`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Öğrenci güncelleme');
    }
};

export const deleteStudent = async (studentId) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/delete-student-by-student-id/${studentId}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Öğrenci silme');
    }
};
// #endregion

// #region Avatar Operations
export const getAllAvatars = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/get-all-avatars`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Avatar listesi alma');
    }
};

export const createAvatar = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/admin/create-avatar`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Avatar oluşturma');
    }
};

export const updateAvatar = async (avatarId, data) => {
    try {
        const response = await axios.put(`${API_URL}/admin/update-avatar-by-avatar-id/${avatarId}`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Avatar güncelleme');
    }
};

export const deleteAvatar = async (avatarId) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/delete-avatar-by-avatar-id/${avatarId}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Avatar silme');
    }
};
// #endregion

// #region Course Operations
export const getCourseLessonAndSublessonInformation = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/get-course-lesson-and-sublesson-informations`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Kurs, ders ve alt ders bilgisi alma');
    }
};

export const createCourse = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/admin/create-course`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Kurs oluşturma');
    }
};

export const updateCourse = async (courseId, data) => {
    try {
        const response = await axios.put(`${API_URL}/admin/update-course-by-course-id/${courseId}`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Kurs güncelleme');
    }
};

export const deleteCourse = async (courseId) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/delete-course-by-course-id/${courseId}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Kurs silme');
    }
};
// #endregion

// #region Lesson Operations
export const createLesson = async (courseId, title) => {
    try {
        const response = await axios.post(`${API_URL}/admin/create-lesson-by-course-id/${courseId}/${title}`, {}, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Ders oluşturma');
    }
};

export const updateLesson = async (lessonId, title) => {
    try {
        const response = await axios.put(`${API_URL}/admin/update-lesson-by-lesson-id/${lessonId}/${title}`, {}, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Ders güncelleme');
    }
};

export const deleteLesson = async (lessonId) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/delete-lesson-by-lesson-id/${lessonId}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Ders silme');
    }
};
// #endregion

// #region SubLesson Operations
export const createSubLesson = async (lessonId, data) => {
    try {
        const response = await axios.post(`${API_URL}/admin/create-sublesson-by-lesson-id/${lessonId}`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Alt ders oluşturma');
    }
};

export const updateSubLesson = async (subLessonId, data) => {
    try {
        const response = await axios.put(`${API_URL}/admin/update-sublesson-by-sublesson-id/${subLessonId}`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Alt ders güncelleme');
    }
};

export const deleteSubLesson = async (subLessonId) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/delete-sublesson-by-sublesson-id/${subLessonId}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Alt ders silme');
    }
};
// #endregion

// #region AI Prompt Operations
export const getAllAIPrompts = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/get-all-ai-prompts`, getHeaders());
        console.log(response.data);
        return response.data;
    } catch (error) {
        handleError(error, 'AI prompt listesi alma');
    }
};

export const createAIPrompt = async (data) => {
    try {
        console.log(data);
        const response = await axios.post(`${API_URL}/admin/create-ai-prompt`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'AI prompt oluşturma');
    }
};

export const updateAIPrompt = async (promptId, data) => {
    try {
        const response = await axios.put(`${API_URL}/admin/update-ai-prompt-by-prompt-id/${promptId}`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'AI prompt güncelleme');
    }
};

export const deleteAIPrompt = async (promptId) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/delete-ai-prompt-by-prompt-id/${promptId}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'AI prompt silme');
    }
};
// #endregion

// #region Company Profile Operations
export const getCompanyProfile = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/company-profile`, getHeaders());
        console.log(response.data);
        return response.data;
    } catch (error) {
        handleError(error, 'Şirket profili alma');
    }
};

export const createCompanyProfile = async (data) => {
    try {
        console.log(data);
        const response = await axios.post(`${API_URL}/admin/company-profile`, data, getHeaders());
        return response.status === 200;
    } catch (error) {
        handleError(error, 'Şirket profili oluşturma');
        return false;
    }
};

export const updateCompanyProfile = async (data) => {
    try {
        const response = await axios.put(`${API_URL}/admin/company-profile`, data, getHeaders());
        return response.status === 200;
    } catch (error) {
        handleError(error, 'Şirket profili güncelleme');
        return false;
    }
};

export const deleteCompanyProfile = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/company-profile/${id}`, getHeaders());
        return response.status === 200;
    } catch (error) {
        handleError(error, 'Şirket profili silme');
        return false;
    }
};
// #endregion

// #region Learning Style Operations
export const getLearningStyles = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/learning-styles`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Öğrenme stilleri listesi alma');
    }
};

export const createLearningStyleCategory = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/admin/learning-style-category`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Öğrenme stili kategorisi oluşturma');
    }
};

export const updateLearningStyleCategory = async (data) => {
    try {
        const response = await axios.put(`${API_URL}/admin/learning-style-category`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Öğrenme stili kategorisi güncelleme');
    }
};

export const deleteLearningStyleCategory = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/learning-style-category-by-ls-id/${id}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Öğrenme stili kategorisi silme');
    }
};

export const createLearningStyleQuestion = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/admin/learning-style-question`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Öğrenme stili sorusu oluşturma');
    }
};

export const updateLearningStyleQuestion = async (data) => {
    try {
        const response = await axios.put(`${API_URL}/admin/learning-style-question`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Öğrenme stili sorusu güncelleme');
    }
};

export const deleteLearningStyleQuestion = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/learning-style-question-by-ls-id/${id}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Öğrenme stili sorusu silme');
    }
};
// #endregion

// #region Game Operations
export const getAllGames = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/games`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Oyunlar getirilirken');
    }
};

export const createGame = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/admin/game`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Oyun oluşturma');
    }
};

export const updateGame = async (gameId, data) => {
    try {
        const response = await axios.put(`${API_URL}/admin/game/${gameId}`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Oyun güncelleme');
    }
};

export const deleteGame = async (gameId) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/game/${gameId}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Oyun silme');
    }
};
// #endregion
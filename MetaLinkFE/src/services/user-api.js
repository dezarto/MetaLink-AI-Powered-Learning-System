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

const getAnonymousHeaders = () => ({
    headers: {
        'Content-Type': 'application/json',
    },
});

// Handle API errors and log out on 401 Unauthorized
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

// #region Authentication Operations

export const checkPin = async (pin) => {
    try {
        const response = await axios.get(`${API_URL}/auth/check-pin/${pin}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'PIN verification');
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await axios.post(`${API_URL}/auth/forgot-password/${email}`, {}, getAnonymousHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Password reset request');
    }
};

export const resetPassword = async (data) => {
    try {
        const response = await axios.post(`${API_URL}/auth/reset-password`, data, getAnonymousHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Password reset');
    }
};

// #endregion

// #region User Operations

export const getCompanyProfile = async () => {
    try {
        const response = await axios.get(`${API_URL}/user/company-profile`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Fetching company profile');
    }
};

export const updatePasswordByUser = async (data) => {
    try {
        const response = await axios.put(`${API_URL}/user/update-password`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Updating password');
    }
};

export const getUserInformation = async (userID) => {
    try {
        const response = await axios.get(`${API_URL}/user/get-user-by-user-id/${userID}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Fetching user information');
    }
};

export const updateUserById = async (userID, data) => {
    try {
        const response = await axios.put(`${API_URL}/user/update-user-by-user-id/${userID}`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Updating user');
    }
};

// #endregion

// #region Student Operations

export const getStudentInformationByStudentId = async (studentId) => {
    try {
        const response = await axios.get(`${API_URL}/student/get-student-information-by-student-id/${studentId}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Fetching student information');
    }
};

export const addStudent = async (studentData) => {
    try {
        const response = await axios.post(`${API_URL}/student/add-student`, studentData, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Adding student');
    }
};

export const getStudentsByUser = async () => {
    try {
        const response = await axios.get(`${API_URL}/student/get-students-by-user`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Fetching students');
    }
};

export const updateStudentsByStudentId = async (studentId, data) => {
    try {
        const response = await axios.put(`${API_URL}/student/edit-student-by-student-id/${studentId}`, data, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Updating student');
    }
};

export const deleteStudentByStudentId = async (studentID) => {
    try {
        const response = await axios.delete(`${API_URL}/student/delete-student-by-student-id/${studentID}`, getHeaders());
        return response.data;
    } catch (error) {
        handleError(error, 'Deleting student');
    }
};

// #endregion
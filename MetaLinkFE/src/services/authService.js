import { jwtDecode } from "jwt-decode";

const BASE_URL = 'https://localhost:7239';
const API_URL = 'https://localhost:7239/api';

const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/Auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      throw data.message || 'Registration failed';
    }
  } catch (error) {
    throw error.message || 'Network error occurred';
  }
};

const login = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (response.ok && data.token) {
      sessionStorage.setItem('user', JSON.stringify({
        token: data.token,
        user: data.user
      }));
      return data;
    } else {
      throw data.message || 'Invalid credentials';
    }
  } catch (error) {
    throw error.message || 'Network error occurred';
  }
};

const logout = () => {
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('studentToken');
  sessionStorage.removeItem('isChildPerspective');
};

const getToken = () => {
  const userStr = sessionStorage.getItem('user');
  if (userStr) {
    try {
      const userData = JSON.parse(userStr);
      return userData.token || null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

const getCurrentUser = () => {
  const userStr = sessionStorage.getItem('user');
  if (userStr) {
    try {
      const userData = JSON.parse(userStr);
      return userData.user;
    } catch (error) {
      return null;
    }
  }
  return null;
};

const getRoleFromToken = () => {
  const token = getToken();
  if (token) {
    try {
      const decoded = jwtDecode(token);
      return decoded.role || null;
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }
  return null;
};

const getUserIdFromToken = () => {
  const token = getToken();
  if (token) {
    try {
      const decoded = jwtDecode(token);
      return decoded.userId || null;
    } catch (error) {
      console.error('Invalid token:', error);
      return null;
    }
  }
  return null;
};

const getStudentToken = async (studentId) => {
  try {
    const response = await fetch(`${API_URL}/auth/student-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(studentId)
    });
    const data = await response.json();
    if (response.ok) {
      const token = typeof data.token === 'string' ? data.token : JSON.stringify(data.token);
      sessionStorage.setItem('studentToken', token);
      return { success: true, token: data.token };
    } else {
      console.error("Token alınamadı", data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error("İstek hatası:", error);
    return { success: false, error };
  }
};

const authService = {
  BASE_URL,
  register,
  login,
  logout,
  getCurrentUser,
  getToken,
  getRoleFromToken,
  getUserIdFromToken,
  getStudentToken
};

export default authService;
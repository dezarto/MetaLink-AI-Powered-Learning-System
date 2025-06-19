import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FirstNavbar from "../../components/Navbar/FirstNavbar.jsx";
import HamsterWheel from "../../components/Spinner/HamsterWheel.jsx";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  IconButton,
} from '@mui/material';
import {
  School as SchoolIcon,
  Cake as CakeIcon,
  AccountCircle as AccountCircleIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import "./SubLogin.css";
import authService from '../../services/authService';
import {
  getStudentsByUser,
  getUserInformation,
  checkPin
} from '../../services/user-api.js';
import {
  getAllAvatars
} from '../../services/student-api.js';

// SubLogin component manages user and student selection with PIN-based parent profile access
const SubLogin = () => {
  // State for user data, students, avatars, loading, and PIN modal
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Fetch user, student, and avatar data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDatas = await getUserInformation(authService.getUserIdFromToken());
        if (!userDatas) {
          navigate('/');
          return;
        }
        setUser(userDatas);

        const [studentData, avatarData] = await Promise.all([
          getStudentsByUser(),
          getAllAvatars()
        ]);
        setStudents(studentData);
        setAvatars(avatarData);
      } catch (err) {
        setError('Data fetching error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Navigate to student home page after successful token retrieval
  const handleStudentClick = async (student) => {
    const result = await authService.getStudentToken(student.studentID);

    if (result.success) {
      navigate(`/user/${student.studentID}/student-home-page`);
    } else {
      alert("Failed to retrieve token");
    }
  };

  // Log out user and redirect to home page
  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  // Open PIN modal for parent profile access
  const handleParentProfileClick = () => {
    setShowPinModal(true);
  };

  // Validate and submit PIN for parent profile access
  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setPinError('The PIN must be exactly 4 digits.');
      return;
    }
    const status = await checkPin(pin);

    if (status.isValid) {
      setShowPinModal(false);
      setPin('');
      setPinError('');
      navigate('/user/parent-profile');
    } else {
      setPinError('Incorrect PIN. Please try again.');
    }
  };

  // Close PIN modal and reset PIN state
  const handlePinCancel = () => {
    setShowPinModal(false);
    setPin('');
    setPinError('');
  };

  // Redirect to home if user is not authenticated
  if (!user) {
    navigate('/');
    return null;
  }

  // Show loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="sublogin-fullpage-loading">
        <div className="sublogin-hamster-loading">
          <HamsterWheel />
        </div>
        <p className="loading-text">Loading Users...</p>
      </div>
    );
  }

  // Render student details dialog
  const renderStudentDetails = () => {
    if (!selectedStudent) return null;

    return (
      <Dialog
        open={openDetailsModal}
        onClose={() => setOpenDetailsModal(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#ff9966',
          color: 'white'
        }}>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Student Details
          </Typography>
          <Typography variant="h4">
            {selectedStudent.firstName} {selectedStudent.lastName}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Box sx={{
            mt: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            p: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SchoolIcon color="primary" />
              <Typography variant="h6">
                Class: {selectedStudent.class}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CakeIcon color="primary" />
              <Typography variant="h6">
                Date of Birth: {new Date(selectedStudent.dateOfBirth).toLocaleDateString()}
              </Typography>
            </Box>
            {selectedStudent.gender !== undefined && (
              <>
                <Divider />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AccountCircleIcon color="primary" />
                  <Typography variant="h6">
                    Gender: {selectedStudent.gender ? 'Female' : 'Male'}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsModal(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Get avatar image URL or fallback
  const getAvatarImage = (selectedAvatarID) => {
    const avatar = avatars.find(a => a.avatarID === selectedAvatarID);
    return avatar ? `${authService.BASE_URL}${avatar.avatarPath}` : '/path/to/fallback-image.png';
  };

  // Render the SubLogin interface with user and student cards
  return (
    <div className="generalSub">
      <div>
        <FirstNavbar visibleButtons={["home", "login"]} />
      </div>

      <div className="containerSub">
        <div className="cardWrapper">
          <div className="cardPlace">
            <div
              className="cardSub parentCard"
              onClick={handleParentProfileClick}
              style={{ cursor: 'pointer' }}
            >
              <div className="parent-info">
                <AccountCircleIcon className="parent-icon" />
                <span style={{
                  fontSize: '0.9em',
                  wordBreak: 'break-word',
                  textAlign: 'center',
                  padding: '0 10px'
                }}>
                  {user?.email || 'Loading...'}
                </span>
              </div>
            </div>

            {students.map((student) => (
              <div
                className="cardSub"
                key={student.studentID}
                onClick={() => handleStudentClick(student)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                <img
                  src={getAvatarImage(student.selectedAvatarID)}
                  alt={`${student.firstName}'s avatar`}
                  className="sublogin-avatar-image"
                  onError={(e) => {
                    e.target.src = '/path/to/fallback-image.png';
                  }}
                />
                <span>{student.firstName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showPinModal && (
        <div className="pin-modal-overlay">
          <div className="pin-modal">
            <h2>Enter Parent PIN</h2>
            <p>Please enter your PIN to access the parent profile</p>

            <div className="pin-input-container" style={{ position: 'relative' }}>
              <input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter PIN"
                className="pin-input"
                maxLength={4}
              />
              <IconButton
                onClick={() => setShowPin(!showPin)}
                style={{
                  position: 'absolute',
                  right: 30,
                  top: '50%',
                  transform: 'translateY(-50%)'
                }}
              >
                {showPin ? <VisibilityOff /> : <Visibility />}
              </IconButton>
              {pinError && <p className="pin-error">{pinError}</p>}
            </div>

            <div className="pin-buttons">
              <button className="pin-button pin-cancel" onClick={handlePinCancel}>
                Cancel
              </button>
              <button className="pin-button pin-enter" onClick={handlePinSubmit}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {renderStudentDetails()}
    </div>
  );
};

export default SubLogin;
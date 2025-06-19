import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { usePerspective } from '../../../context/PerspectiveContext';
import './StudentProfiles.css';
import PersonPhoto from '../../../assets/person-image.png';
import SecondNavbar from '../../Navbar/SecondNavbar.jsx';
import { Lock } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';
import womanAvatar from '../../../assets/talking-avatar-w.json';
import manAvatar from '../../../assets/talking-avatar-m.json';
import robotAvatar from '../../../assets/talking-avatar-r.json';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  getStudentInformationByStudentId,
} from '../../../services/user-api.js';
import {
  getAllAvatars,
  updateStudentSelectAvatar,
  updateStudentVoiceType,
  sendFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  blockFriend,
  deleteFriendship,
  getPendingRequests,
  getFriends,
  getSentRequests,
  getBlockedUsers,
  sendMessage,
  getMessages,
  markMessageAsRead,
  getStudentStatisticByStudentId
} from '../../../services/student-api.js';
import HamsterWheel from '../../Spinner/HamsterWheel';

// VoiceTypeEnum mapping
const voiceTypeMap = {
  0: 'Alloy',
  1: 'Ash',
  2: 'Ballad',
  3: 'Coral',
  4: 'Echo',
  5: 'Fable',
  6: 'Onyx',
  7: 'Nova',
  8: 'Sage',
  9: 'Shimmer',
  10: 'Verse',
};

const reverseVoiceTypeMap = {
  Alloy: 0,
  Ash: 1,
  Ballad: 2,
  Coral: 3,
  Echo: 4,
  Fable: 5,
  Onyx: 6,
  Nova: 7,
  Sage: 8,
  Shimmer: 9,
  Verse: 10,
};

// Voice to avatar mapping
const voiceToAvatarMap = {
  Alloy: manAvatar,    // Male, technological
  Ash: manAvatar,     // Male, melancholic
  Ballad: womanAvatar, // Female, melodic
  Coral: womanAvatar,  // Female, soft
  Echo: robotAvatar,   // Neutral, dramatic
  Fable: robotAvatar,  // Neutral, storytelling
  Onyx: manAvatar,     // Male, strong
  Nova: womanAvatar,   // Female, dynamic
  Sage: manAvatar,     // Male, wise
  Shimmer: womanAvatar, // Female, vibrant
  Verse: robotAvatar,   // Neutral, poetic
};

// Custom notification component
const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    // Auto close notification after 3 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getNotificationStyle = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#4CAF50', color: 'white' };
      case 'error':
        return { backgroundColor: '#f44336', color: 'white' };
      case 'warning':
        return { backgroundColor: '#ff9800', color: 'white' };
      default:
        return { backgroundColor: '#2196F3', color: 'white' };
    }
  };

  return (
    <div className="notification-popup" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 24px',
      borderRadius: '5px',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: '300px',
      marginTop: '70px',
      ...getNotificationStyle()
    }}>
      <div>{message}</div>
      <button
        onClick={onClose}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'inherit',
          fontSize: '18px',
          cursor: 'pointer',
          marginLeft: '10px'
        }}
      >
        ×
      </button>
    </div>
  );
};

// AvatarSelection component
const AvatarSelection = ({ student, studentId, isChildPerspective }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatars, setAvatars] = useState([]);
  // Add notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const avatarData = await getAllAvatars();
        const formattedAvatars = avatarData.map((avatar) => ({
          id: avatar.avatarID,
          name: avatar.avatarName,
          image: avatar.avatarPath,
          requiredLevel: avatar.avatarLevel,
          isActive: avatar.isActive,
        }));
        setAvatars(formattedAvatars);

        const currentAvatar = formattedAvatars.find((avatar) => avatar.id === student.selectedAvatarID) ||
          formattedAvatars.find((avatar) => avatar.isActive) ||
          formattedAvatars[0];
        setSelectedAvatar(currentAvatar);
      } catch (error) {
        console.error('Error fetching avatars:', error);
      }
    };

    fetchAvatars();
  }, [student.selectedAvatarID]);

  const handleAvatarClick = (avatar) => {
    if (avatar.isActive && !isChildPerspective) {
      setSelectedAvatar(avatar);
    }
  };

  const closeNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const handleSaveAvatar = async () => {
    if (isChildPerspective) {
      setNotification({
        show: true,
        message: 'Avatar selection is disabled in child perspective!',
        type: 'warning'
      });
      return;
    }
    if (!selectedAvatar || !selectedAvatar.isActive) {
      setNotification({
        show: true,
        message: 'This avatar cannot be selected!',
        type: 'error'
      });
      return;
    }

    if (selectedAvatar.requiredLevel > student.gameLevel) {
      setNotification({
        show: true,
        message: 'You have not reached the required level for this avatar!',
        type: 'warning'
      });
      return;
    }

    try {
      await updateStudentSelectAvatar(studentId, selectedAvatar.id);
      setNotification({
        show: true,
        message: `"${selectedAvatar.name}" avatar saved successfully!`,
        type: 'success'
      });
    } catch (error) {
      setNotification({
        show: true,
        message: 'An error occurred while saving the avatar. Please try again.',
        type: 'error'
      });
      console.error('Error saving avatar:', error);
    }
  };

  return (
    <div className="avatar-selection-container">
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
      <h3>Avatar Selection</h3>
      <p className="avatar-selection-description">
        {isChildPerspective
          ? 'Avatar selection is currently disabled. Focus on your lessons!'
          : 'Choose your avatar below. Some avatars require higher levels or are unavailable.'}
      </p>

      <div className="avatar-selection-main">
        <div className="avatar-selection-list">
          {avatars.map((avatar) => {
            const isLocked = avatar.requiredLevel > student.gameLevel || !avatar.isActive || isChildPerspective;

            return (
              <div
                key={avatar.id}
                className={`avatar-option 
                     ${selectedAvatar?.id === avatar.id ? 'selected' : ''} 
                     ${isLocked ? 'locked' : ''}`}
                onClick={() => handleAvatarClick(avatar)}
                style={isLocked ? { cursor: 'not-allowed' } : { cursor: 'pointer' }}
              >
                <div className="avatar-option-content">
                  <span className="avatar-name">{avatar.name}</span>
                  <span className="avatar-level">Level {avatar.requiredLevel}+</span>
                </div>
                {isLocked && <Lock size={16} className="lock-icon" />}
              </div>
            );
          })}
        </div>

        <div className="avatar-preview">
          {selectedAvatar && (
            <>
              <div className="avatar-preview-image">
                <img
                  src={`https://localhost:7239${selectedAvatar.image}`}
                  alt={selectedAvatar.name}
                  onError={(e) => (e.target.src = PersonPhoto)}
                />
              </div>
              <div className="avatar-preview-info">
                <h4>{selectedAvatar.name}</h4>
                <p>Required Level: {selectedAvatar.requiredLevel}</p>
                {isChildPerspective ? (
                  <p className="avatar-locked-message">Avatar selection is disabled!</p>
                ) : !selectedAvatar.isActive ? (
                  <p className="avatar-locked-message">This avatar is currently unavailable.</p>
                ) : selectedAvatar.requiredLevel > student.gameLevel ? (
                  <p className="avatar-locked-message">
                    Locked! Level {selectedAvatar.requiredLevel} is required to unlock this avatar.
                  </p>
                ) : (
                  <p className="avatar-available-message">Available!</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <button
        className="avatar-save-button"
        onClick={handleSaveAvatar}
        disabled={isChildPerspective || !selectedAvatar || selectedAvatar.requiredLevel > student.gameLevel || !selectedAvatar.isActive}
      >
        Save Avatar
      </button>
    </div>
  );
};

// VoiceSelection component with custom notifications
const VoiceSelection = ({ student, studentId, isChildPerspective }) => {
  const [selectedVoice, setSelectedVoice] = useState(student?.voiceType || 'Nova');
  const lottieRef = useRef(null);
  // Add notification state
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const voiceOptions = [
    { value: 'Alloy', label: 'Alloy (Modern, technological)', description: 'A modern and robotic voice tone.', enumValue: 0 },
    { value: 'Ash', label: 'Ash (Melancholic)', description: 'An emotional and melancholic voice.', enumValue: 1 },
    { value: 'Ballad', label: 'Ballad (Melodic)', description: 'A melodic voice, like singing.', enumValue: 2 },
    { value: 'Coral', label: 'Coral (Soft)', description: 'A soothing and warm voice.', enumValue: 3 },
    { value: 'Echo', label: 'Echo (Dramatic)', description: 'An echoing and dramatic voice.', enumValue: 4 },
    { value: 'Fable', label: 'Fable (Storytelling)', description: 'A warm voice for storytelling.', enumValue: 5 },
    { value: 'Onyx', label: 'Onyx (Strong)', description: 'A bold and resolute voice.', enumValue: 6 },
    { value: 'Nova', label: 'Nova (Dynamic)', description: 'A youthful and energetic voice.', enumValue: 7 },
    { value: 'Sage', label: 'Sage (Wise)', description: 'A wise and deep voice.', enumValue: 8 },
    { value: 'Shimmer', label: 'Shimmer (Vibrant)', description: 'A bright and uplifting voice.', enumValue: 9 },
    { value: 'Verse', label: 'Verse (Poetic)', description: 'A melodic and poetic voice.', enumValue: 10 },
  ];

  const handleVoiceClick = (voice) => {
    if (!isChildPerspective) {
      setSelectedVoice(voice);
    }
  };

  const closeNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const handleSaveVoice = async () => {
    if (isChildPerspective) {
      setNotification({
        show: true,
        message: 'Voice selection is disabled in child perspective!',
        type: 'warning'
      });
      return;
    }

    try {
      const enumValue = reverseVoiceTypeMap[selectedVoice];
      await updateStudentVoiceType(studentId, enumValue);
      setNotification({
        show: true,
        message: `"${selectedVoice}" voice saved successfully!`,
        type: 'success'
      });
    } catch (error) {
      setNotification({
        show: true,
        message: 'An error occurred while saving the voice. Please try again.',
        type: 'error'
      });
      console.error('Error saving voice:', error);
    }
  };

  return (
    <div className="voice-selection-container">
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
      <h3>Voice Selection</h3>
      <p className="voice-selection-description">
        {isChildPerspective
          ? 'Voice selection is currently disabled. Focus on your lessons!'
          : 'Choose your preferred voice for your avatar. Pick a voice that suits your style!'}
      </p>

      <div className="voice-selection-main">
        <div className="voice-selection-list">
          {voiceOptions.map((voice) => {
            const isLocked = isChildPerspective;

            return (
              <div
                key={voice.value}
                className={`voice-option 
                     ${selectedVoice === voice.value ? 'selected' : ''} 
                     ${isLocked ? 'locked' : ''}`}
                onClick={() => handleVoiceClick(voice.value)}
                style={isLocked ? { cursor: 'not-allowed' } : { cursor: 'pointer' }}
              >
                <div className="voice-option-content">
                  <span className="voice-name">{voice.label}</span>
                  <span className="voice-description">{voice.description}</span>
                </div>
                {isLocked && <Lock size={16} className="lock-icon" />}
              </div>
            );
          })}
        </div>

        <div className="voice-preview">
          {selectedVoice ? (
            <div className='voice-preview-image-info'>
              <div className="voice-preview-image">
                <Player
                  ref={lottieRef}
                  autoplay={false}
                  loop
                  src={voiceToAvatarMap[selectedVoice]}
                  style={{ height: 150, width: 150, borderRadius: '15px', border: '3px solid #007bff' }}
                  aria-label="Voice avatar preview"
                />
              </div>
              <div className="voice-preview-info">
                <h4>{voiceOptions.find((v) => v.value === selectedVoice)?.label}</h4>
                <p>{voiceOptions.find((v) => v.value === selectedVoice)?.description}</p>
                {isChildPerspective ? (
                  <p className="voice-locked-message">Voice selection is disabled!</p>
                ) : (
                  <p className="voice-available-message">Available!</p>
                )}
              </div>
            </div>
          ) : (
            <div className="voice-placeholder">Loading voice avatar...</div>
          )}
        </div>
      </div>

      <button
        className="voice-save-button"
        onClick={handleSaveVoice}
        disabled={isChildPerspective}
      >
        Save Voice
      </button>
    </div>
  );
};

const ChatWindow = ({ studentId, friendId, friendName, onClose }) => {
  const { isChildPerspective } = usePerspective();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const data = await getMessages(studentId, friendId);
        setMessages(data);

        const unreadMessages = data.filter(
          (msg) => msg.senderStudentId !== studentId && !msg.isRead
        );
        for (const msg of unreadMessages) {
          try {
            await markMessageAsRead(msg.id);
            setMessages((prevMessages) =>
              prevMessages.map((m) =>
                m.id === msg.id ? { ...m, isRead: true } : m
              )
            );
          } catch (error) {
            console.error('Error marking message as read:', error);
          }
        }
      } catch (error) {
        setNotification({
          show: true,
          message: 'An error occurred while loading messages.',
          type: 'error'
        });
      }
      setLoading(false);
    };
    fetchMessages();
  }, [studentId, friendId]);

  const closeNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isChildPerspective) return;
    try {
      const sentMessage = await sendMessage(studentId, friendId, newMessage);
      setMessages([...messages, sentMessage]);
      setNewMessage('');
    } catch (error) {
      setNotification({
        show: true,
        message: 'An error occurred while sending the message.',
        type: 'error'
      });
    }
  };

  return (
    <div className="student-profile-chat-container">
      {notification.show && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
      <div className="student-profile-chat-header">
        <h3>Chat with {friendName}</h3>
        <button onClick={onClose}>Close</button>
      </div>
      <div className="student-profile-chat-messages">
        {loading ? (
          <p>Loading...</p>
        ) : messages.length === 0 ? (
          <p>No messages yet.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`student-profile-chat-message ${msg.senderStudentId === studentId ? 'sent' : 'received'}`}
            >
              <p>{msg.messageTXT}</p>
              <small>{new Date(msg.sentAt).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>
      <div className="student-profile-chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isChildPerspective ? 'Messaging is disabled in child perspective!' : 'Type a message...'}
          disabled={isChildPerspective}
        />
        <button
          onClick={handleSendMessage}
          disabled={isChildPerspective}
          className={`student-profile-send-btn ${isChildPerspective ? 'disabled' : ''}`}
          title={isChildPerspective ? 'Messaging is disabled in child perspective!' : 'Send message'}
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Main component
const StudentProfiles = () => {
  const { studentId } = useParams();
  const { isChildPerspective } = usePerspective();
  const [activeSection, setActiveSection] = useState(null);
  const [student, setStudent] = useState(null);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showAddFriendPopup, setShowAddFriendPopup] = useState(false);
  const [friendId, setFriendId] = useState('');
  const [loading, setLoading] = useState(true);
  const [avatars, setAvatars] = useState([]);
  const [selectedAvatarPath, setSelectedAvatarPath] = useState(PersonPhoto);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });
  const closeNotification = () => {
    setNotification({ ...notification, show: false });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentData = await getStudentInformationByStudentId(studentId);
        setStudent({
          ...studentData,
          voiceType: voiceTypeMap[studentData.voiceType] || 'Nova',
        });

        const avatarData = await getAllAvatars();
        const formattedAvatars = avatarData.map((avatar) => ({
          id: avatar.avatarID,
          name: avatar.avatarName,
          image: avatar.avatarPath,
          requiredLevel: avatar.avatarLevel,
          isActive: avatar.isActive,
        }));
        setAvatars(formattedAvatars);

        const selectedAvatar = formattedAvatars.find((avatar) => avatar.id === studentData.selectedAvatarID);
        if (selectedAvatar) {
          setSelectedAvatarPath(selectedAvatar.image);
        }

        const stats = await getStudentStatisticByStudentId(studentId);
        setStudentStats(stats);

        const [friendsData, pendingData, sentData, blockedData] = await Promise.all([
          getFriends(studentId),
          getPendingRequests(studentId),
          getSentRequests(studentId),
          getBlockedUsers(studentId),
        ]);

        const friendsWithNames = await Promise.all(
          friendsData.map(async (friend) => {
            const friendStudentId = friend.targetStudentId === parseInt(studentId) ? friend.requesterStudentId : friend.targetStudentId;
            try {
              const friendData = await getStudentInformationByStudentId(friendStudentId);
              return {
                ...friend,
                friendName: `${friendData.firstName} ${friendData.lastName}`,
              };
            } catch (error) {
              console.error(`Error fetching friend data for ID ${friendStudentId}:`, error);
              return {
                ...friend,
                friendName: `UserID: ${friendStudentId}`,
              };
            }
          })
        );

        setFriends(friendsWithNames);
        setPendingRequests(pendingData);
        setSentRequests(sentData);
        setBlockedUsers(blockedData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSelectedAvatarPath(PersonPhoto);
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  // Öğrenme stilini enum'dan metne çevir
  const getLearningStyleText = (styleType) => {
    switch (styleType) {
      case 1:
        return 'Visual Learning Style';
      case 2:
        return 'Auditory Learning Style';
      case 3:
        return 'Tactile/Kinesthetic Learning Style';
      default:
        return 'Unknown';
    }
  };

  // Test tipini enum'dan metne çevir
  const getTestTypeText = (testType) => {
    switch (testType) {
      case 0:
        return 'QuickTest';
      case 1:
        return 'NormalTest';
      case 2:
        return 'GeneralTest';
      default:
        return 'Unknown';
    }
  };

  // Quiz tipini enum'dan metne çevir
  const getQuizTypeText = (quizType) => {
    switch (quizType) {
      case 0:
        return 'QuickQuiz';
      case 1:
        return 'NormalQuiz';
      case 2:
        return 'GeneralQuiz';
      default:
        return 'Unknown';
    }
  };

  // Ders ilerlemesi istatistiklerini hesapla
  const calculateLessonStats = (courseProgress) => {
    let totalLessons = 0;
    let completedLessons = 0;
    let totalSubLessons = 0;
    let completedSubLessons = 0;

    courseProgress.forEach(course => {
      totalLessons += course.totalLesson || 0;
      completedLessons += course.compleatedLessonCount || 0;
      totalSubLessons += course.totalSubLesson || 0;
      completedSubLessons += course.compleatedSubLessonCount || 0;
    });

    const incompleteLessons = totalLessons - completedLessons;
    const completionRate = totalLessons > 0 ? ((completedLessons / totalLessons) * 100).toFixed(2) : 0;
    const incompleteSubLessons = totalSubLessons - completedSubLessons;
    const subLessonCompletionRate = totalSubLessons > 0 ? ((completedSubLessons / totalSubLessons) * 100).toFixed(2) : 0;

    return {
      totalLessons,
      completedLessons,
      incompleteLessons,
      completionRate,
      totalSubLessons,
      completedSubLessons,
      incompleteSubLessons,
      subLessonCompletionRate,
      chartData: [{
        name: 'Lesson Stats',
        total: totalLessons,
        completed: completedLessons,
        incomplete: incompleteLessons
      }], subLessonChartData: [{
        name: 'Sub-Lesson Stats',
        total: totalSubLessons,
        completed: completedSubLessons,
        incomplete: incompleteSubLessons
      }]
    };
  };

  // Test istatistiklerini hesapla
  const calculateTestStats = (statistic) => {
    const testStats = statistic.filter(stat => stat.testID !== null);
    const groupedStats = {};

    // BarChart için test tiplerine göre gruplandırma
    testStats.forEach(stat => {
      const testType = stat.testType;
      if (!groupedStats[testType]) {
        groupedStats[testType] = {
          count: 0,
          correct: 0,
          wrong: 0
        };
      }
      groupedStats[testType].count += 1;
      groupedStats[testType].correct += stat.correctAnswers;
      groupedStats[testType].wrong += stat.wrongAnswers;
    });

    const barChartData = Object.keys(groupedStats).map(testType => {
      const stats = groupedStats[testType];
      return {
        name: getTestTypeText(parseInt(testType)),
        tests: stats.count,
        correct: stats.correct,
        wrong: stats.wrong
      };
    });

    // LineChart için her test için bireysel veri
    const lineChartData = testStats.map(stat => ({
      name: `Test ID: ${stat.testID} (${getTestTypeText(stat.testType)})`,
      totalQuestions: stat.totalQuestions,
      duration: (stat.durationInMilliseconds / 1000).toFixed(2), // Saniyeye çevir
      topic: stat.testTopic || 'N/A',
      correctAnswers: stat.correctAnswers,
      wrongAnswers: stat.wrongAnswers,
      date: stat.testDate
    }));

    return {
      totalTests: testStats.length,
      barChartData,
      lineChartData
    };
  };

  // Quiz istatistiklerini hesapla
  const calculateQuizStats = (statistic) => {
    const quizStats = statistic.filter(stat => stat.quizID !== null);
    const groupedStats = {};

    // BarChart için quiz tiplerine göre gruplandırma
    quizStats.forEach(stat => {
      const quizType = stat.quizType;
      if (!groupedStats[quizType]) {
        groupedStats[quizType] = {
          count: 0,
          correct: 0,
          wrong: 0
        };
      }
      groupedStats[quizType].count += 1;
      groupedStats[quizType].correct += stat.correctAnswers;
      groupedStats[quizType].wrong += stat.wrongAnswers;
    });

    const barChartData = Object.keys(groupedStats).map(quizType => {
      const stats = groupedStats[quizType];
      return {
        name: getQuizTypeText(parseInt(quizType)),
        quizzes: stats.count,
        correct: stats.correct,
        wrong: stats.wrong
      };
    });

    // LineChart için her quiz için bireysel veri
    const lineChartData = quizStats.map(stat => ({
      name: `Quiz ID: ${stat.quizID} (${getQuizTypeText(stat.quizType)})`,
      totalQuestions: stat.totalQuestions,
      duration: (stat.durationInMilliseconds / 1000).toFixed(2), // Saniyeye çevir
      topic: stat.quizTopic || 'N/A',
      correctAnswers: stat.correctAnswers,
      wrongAnswers: stat.wrongAnswers,
      date: stat.testDate
    }));

    return {
      totalQuizzes: quizStats.length,
      barChartData,
      lineChartData
    };
  };

  const handleSendFriendRequest = async () => {
    if (friendId.trim() === '' || isChildPerspective) return;
    try {
      await sendFriendRequest(studentId, parseInt(friendId));
      setNotification({
        show: true,
        message: 'Friend request sent successfully!',
        type: 'success'
      });
      setFriendId('');
      setShowAddFriendPopup(false);
      const sentData = await getSentRequests(studentId);
      setSentRequests(sentData);
    } catch (error) {
      setNotification({
        show: true,
        message: 'An error occurred while sending the friend request. Please try again.',
        type: 'error'
      });
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptFriendRequest = async (friendshipId) => {
    if (isChildPerspective) return;
    try {
      await acceptFriendRequest(friendshipId, studentId);

      setNotification({
        show: true,
        message: 'Friend request accepted!',
        type: 'success'
      });
      const [friendsData, pendingData] = await Promise.all([
        getFriends(studentId),
        getPendingRequests(studentId),
      ]);

      const friendsWithNames = await Promise.all(
        friendsData.map(async (friend) => {
          const friendStudentId = friend.targetStudentId === parseInt(studentId) ? friend.requesterStudentId : friend.targetStudentId;
          try {
            const friendData = await getStudentInformationByStudentId(friendStudentId);
            return {
              ...friend,
              friendName: `${friendData.firstName} ${friendData.lastName}`,
            };
          } catch (error) {
            console.error(`Error fetching friend data for ID ${friendStudentId}:`, error);
            return {
              ...friend,
              friendName: `UserID: ${friendStudentId}`,
            };
          }
        })
      );

      setFriends(friendsWithNames);
      setPendingRequests(pendingData);
    } catch (error) {
      setNotification({
        show: true,
        message: 'An error occurred while accepting the friend request.',
        type: 'error'
      });
      console.error('Error accepting friend request:', error);
    }
  };

  const handleCancelFriendRequest = async (friendshipId) => {
    if (isChildPerspective) return;
    try {
      await cancelFriendRequest(friendshipId, studentId);

      setNotification({
        show: true,
        message: 'Friend request canceled!',
        type: 'success'
      });
      const [pendingData, sentData] = await Promise.all([
        getPendingRequests(studentId),
        getSentRequests(studentId),
      ]);
      setPendingRequests(pendingData);
      setSentRequests(sentData);
    } catch (error) {
      setNotification({
        show: true,
        message: 'An error occurred while canceling the friend request.',
        type: 'error'
      });
      console.error('Error canceling friend request:', error);
    }
  };

  const handleBlockFriend = async (friendshipId) => {
    if (isChildPerspective) return;
    try {
      await blockFriend(friendshipId, studentId);
      setNotification({
        show: true,
        message: 'Friend blocked!',
        type: 'success'
      });
      const [friendsData, blockedData] = await Promise.all([
        getFriends(studentId),
        getBlockedUsers(studentId),
      ]);

      const friendsWithNames = await Promise.all(
        friendsData.map(async (friend) => {
          const friendStudentId = friend.targetStudentId === parseInt(studentId) ? friend.requesterStudentId : friend.targetStudentId;
          try {
            const friendData = await getStudentInformationByStudentId(friendStudentId);
            return {
              ...friend,
              friendName: `${friendData.firstName} ${friendData.lastName}`,
            };
          } catch (error) {
            console.error(`Error fetching friend data for ID ${friendStudentId}:`, error);
            return {
              ...friend,
              friendName: `UserID: ${friendStudentId}`,
            };
          }
        })
      );

      setFriends(friendsWithNames);
      setBlockedUsers(blockedData);
    } catch (error) {
      setNotification({
        show: true,
        message: 'An error occurred while blocking the friend.',
        type: 'error'
      });
      console.error('Error blocking friend:', error);
    }
  };

  const handleUnblockUser = async (friendshipId) => {
    if (isChildPerspective) return;
    try {
      await deleteFriendship(friendshipId, studentId);
      setNotification({
        show: true,
        message: 'User unblocked!',
        type: 'success'
      });
      const blockedData = await getBlockedUsers(studentId);
      setBlockedUsers(blockedData);
    } catch (error) {
      setNotification({
        show: true,
        message: 'An error occurred while unblocking the user.',
        type: 'error'
      });
      console.error('Error unblocking user:', error);
    }
  };

  const handleRemoveFriend = async (friendshipId) => {
    if (isChildPerspective) return;
    try {
      await deleteFriendship(friendshipId, studentId);
      setNotification({
        show: true,
        message: 'Friend removed from the list!',
        type: 'success'
      });
      const friendsData = await getFriends(studentId);

      const friendsWithNames = await Promise.all(
        friendsData.map(async (friend) => {
          const friendStudentId = friend.targetStudentId === parseInt(studentId) ? friend.requesterStudentId : friend.targetStudentId;
          try {
            const friendData = await getStudentInformationByStudentId(friendStudentId);
            return {
              ...friend,
              friendName: `${friendData.firstName} ${friendData.lastName}`,
            };
          } catch (error) {
            console.error(`Error fetching friend data for ID ${friendStudentId}:`, error);
            return {
              ...friend,
              friendName: `UserID: ${friendStudentId}`,
            };
          }
        })
      );

      setFriends(friendsWithNames);
    } catch (error) {
      setNotification({
        show: true,
        message: 'An error occurred while removing the friend.',
        type: 'error'
      });
      console.error('Error removing friend:', error);
    }
  };

  const handleSelectFriend = (friend) => {
    setSelectedFriend({
      id: friend.targetStudentId === parseInt(studentId) ? friend.requesterStudentId : friend.targetStudentId,
      name: friend.friendName,
    });
  };

  const renderContent = () => {
    if (loading) {
      return <div className="student-profile-loading">Loading...</div>;
    }

    switch (activeSection) {
      case 'info':
        return (
          <div className="student-profile-info-section">
            <h2>My Information</h2>
            <div className="student-profile-info-list">
              <div className="student-profile-info-item">
                <span className="student-profile-info-label">First Name:</span>
                <span className="student-profile-info-value">{student.firstName}</span>
              </div>
              <div className="student-profile-info-item">
                <span className="student-profile-info-label">Last Name:</span>
                <span className="student-profile-info-value">{student.lastName}</span>
              </div>
              <div className="student-profile-info-item">
                <span className="student-profile-info-label">Date of Birth:</span>
                <span className="student-profile-info-value">{formatDate(student.dateOfBirth)}</span>
              </div>
              <div className="student-profile-info-item">
                <span className="student-profile-info-label">Class:</span>
                <span className="student-profile-info-value">{student.class}</span>
              </div>
              <div className="student-profile-info-item">
                <span className="student-profile-info-label">Gender:</span>
                <span className="student-profile-info-value">
                  {student.gender === false ? 'Male' : student.gender === true ? 'Female' : 'Not specified'}
                </span>
              </div>
              <div className="student-profile-info-item">
                <span className="student-profile-info-label">Theme Choice:</span>
                <span className="student-profile-info-value">{student.themeChoice || 'Default'}</span>
              </div>
              <div className="student-profile-info-item">
                <span className="student-profile-info-label">Role:</span>
                <span className="student-profile-info-value">{student.role || 'Not specified'}</span>
              </div>
              <div className="student-profile-info-item">
                <span className="student-profile-info-label">Voice Type:</span>
                <span className="student-profile-info-value">{student.voiceType || 'Nova'}</span>
              </div>
            </div>
          </div>
        );
      case 'friends':
        return (
          <div className="student-profile-friends-section">
            {notification.show && (
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={closeNotification}
              />
            )}
            <div className="student-profile-friends-header">
              <h2>My Friends</h2>
              <button
                className="student-profile-add-friend-btn"
                onClick={() => setShowAddFriendPopup(true)}
                disabled={isChildPerspective}
              >
                Add Friend
              </button>
            </div>
            <div className="student-profile-sent-requests">
              <h3>Sent Friend Requests</h3>
              {sentRequests.length === 0 ? (
                <p>No sent friend requests.</p>
              ) : (
                sentRequests.map((request) => (
                  <div className="student-profile-friend-card" key={request.id}>
                    <div className="student-profile-friend-info">
                      <h3>Student Name: {request.targetStudentFullName}</h3>
                      <p>Request Date: {formatDate(request.requestedAt)}</p>
                    </div>
                    <div className="student-profile-friend-actions">
                      <button
                        className="student-profile-cancel-btn"
                        onClick={() => handleCancelFriendRequest(request.id)}
                        disabled={isChildPerspective}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="student-profile-pending-requests">
              <h3>Pending Friend Requests</h3>
              {pendingRequests.length === 0 ? (
                <p>No pending friend requests.</p>
              ) : (
                pendingRequests.map((request) => (
                  <div className="student-profile-friend-card" key={request.id}>
                    <div className="student-profile-friend-info">
                      <h3>Student Name: {request.requesterStudenFullName}</h3>
                      <p>Request Date: {formatDate(request.requestedAt)}</p>
                    </div>
                    <div className="student-profile-friend-actions">
                      <button
                        className="student-profile-accept-btn"
                        onClick={() => handleAcceptFriendRequest(request.id)}
                        disabled={isChildPerspective}
                      >
                        Accept
                      </button>
                      <button
                        className="student-profile-cancel-btn"
                        onClick={() => handleCancelFriendRequest(request.id)}
                        disabled={isChildPerspective}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="student-profile-friends-list">
              <h3>Friends</h3>
              {friends.length === 0 ? (
                <p className="student-profile-no-friends">
                  {isChildPerspective ? 'Adding friends is currently disabled!' : 'You have no friends yet.'}
                </p>
              ) : (
                friends.map((friend) => (
                  <div className="student-profile-friend-card" key={friend.id}>
                    <div className="student-profile-friend-info">
                      <h3>{friend.friendName}</h3>
                      <p>Status: {friend.status}</p>
                    </div>
                    <div className="student-profile-friend-actions">
                      <button
                        className="student-profile-block-btn"
                        onClick={() => handleBlockFriend(friend.id)}
                        disabled={isChildPerspective}
                      >
                        Block
                      </button>
                      <button
                        className="student-profile-remove-friend-btn"
                        onClick={() => handleRemoveFriend(friend.id)}
                        disabled={isChildPerspective}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="student-profile-blocked-users">
              <h3>Blocked Users</h3>
              {blockedUsers.length === 0 ? (
                <p>No blocked users.</p>
              ) : (
                blockedUsers.map((user) => (
                  <div className="student-profile-friend-card" key={user.id}>
                    <div className="student-profile-friend-info">
                      <h3>Student Name: {user.targetStudentId === parseInt(studentId) ? user.requesterStudenFullName : user.targetStudentFullName}</h3>
                      <p>Block Date: {formatDate(user.requestedAt)}</p>
                    </div>
                    <div className="student-profile-friend-actions">
                      <button
                        className="student-profile-unblock-btn"
                        onClick={() => handleUnblockUser(user.id)}
                        disabled={isChildPerspective}
                      >
                        Unblock
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {showAddFriendPopup && !isChildPerspective && (
              <div className="student-profile-popup-overlay">
                <div className="student-profile-add-friend-popup">
                  <h3>Add Friend</h3>
                  <input
                    type="text"
                    placeholder="Enter your friend's User ID"
                    value={friendId}
                    onChange={(e) => setFriendId(e.target.value)}
                    disabled={isChildPerspective}
                  />
                  <div className="student-profile-popup-buttons">
                    <button onClick={handleSendFriendRequest} disabled={isChildPerspective}>
                      Send Request
                    </button>
                    <button onClick={() => setShowAddFriendPopup(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'messages':
        return (
          <div className="student-profile-messages-section">
            <h2>My Messages</h2>
            <div className='student-profile-friends-full'>
              <div className="student-profile-friends-list">
                <h3>Friends</h3>
                {friends.length === 0 ? (
                  <p className="student-profile-no-friends">
                    You need to add friends to start messaging!
                  </p>
                ) : (
                  friends.map((friend) => (
                    <div className="student-profile-friend-card" key={friend.id}>
                      <div className="student-profile-friend-info">
                        <h3>{friend.friendName}</h3>
                        <p>Status: {friend.status}</p>
                      </div>
                      <div className="student-profile-friend-actions">
                        <button
                          className="student-profile-message-btn"
                          onClick={() => handleSelectFriend(friend)}
                        >
                          Open Chat
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {selectedFriend && (
                <ChatWindow
                  studentId={parseInt(studentId)}
                  friendId={selectedFriend.id}
                  friendName={selectedFriend.name}
                  onClose={() => setSelectedFriend(null)}
                />
              )}
            </div>
          </div>
        );
      case 'stats':
        if (!studentStats) {
          return (
            <div className="student-profile-stats-section">
              <h2>My Statistics</h2>
              <div className="statistics-card">
                <h4>Loading...</h4>
                <p>Loading student statistics...</p>
              </div>
            </div>
          );
        }

        const { firstName, lastName, class: grade, learningStyleType, learningStyleCompleated, courseProgress, statistic } = studentStats;
        const lessonStats = calculateLessonStats(courseProgress);
        const testStats = calculateTestStats(statistic);
        const quizStats = calculateQuizStats(statistic);

        return (
          <div className="student-profile-stats-section">
            <h2>My Statistics</h2>

            <div className="statistics-card">
              <h4>Learning Profile</h4>
              <div className="statistics-list">
                <div className="statistic-item">
                  <div className="statistic-label">Name:</div>
                  <div className="statistic-value">{firstName} {lastName}</div>
                </div>
                <div className="statistic-item">
                  <div className="statistic-label">Class:</div>
                  <div className="statistic-value">{grade}</div>
                </div>
                <div className="statistic-item">
                  <div className="statistic-label">Learning Style:</div>
                  <div className="statistic-value">{learningStyleCompleated ? getLearningStyleText(learningStyleType) : 'Not Completed'}</div>
                </div>
                {!learningStyleCompleated && (
                  <div className="statistic-message">
                    Please complete the learning style test to view your statistics.
                  </div>
                )}
              </div>
            </div>

            {!learningStyleCompleated ? (
              <div className="statistics-card">
                <h4>No Data Available</h4>
                <p>No statistics are available until the learning style test is completed.</p>
              </div>
            ) : (
              <>
                <div className="statistics-card">
                  <h4>Lesson Progress</h4>
                  {lessonStats.totalLessons === 0 ? (
                    <p>No lesson data available.</p>
                  ) : (
                    <div className="chart-container">
                      <div className="chart-lesson-all">
                        <div className='chart-lesson'>
                          <h5>Lessons</h5>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={lessonStats.chartData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="total" name="Total Lessons" fill="#8884d8" />
                              <Bar dataKey="completed" name="Completed Lessons" fill="#82ca9d" />
                              <Bar dataKey="incomplete" name="Incomplete Lessons" fill="#ff4444" />
                            </BarChart>
                          </ResponsiveContainer>
                          <div className="statistic-item">
                            <div className="statistic-label">Completion Rate:</div>
                            <div className="statistic-value">{lessonStats.completionRate}%</div>
                          </div>
                        </div>

                        <div className='chart-sub-lesson'>
                          <h5>Sub-Lessons</h5>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                              data={lessonStats.subLessonChartData}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="total" name="Total Sub-Lessons" fill="#8884d8" />
                              <Bar dataKey="completed" name="Completed Sub-Lessons" fill="#82ca9d" />
                              <Bar dataKey="incomplete" name="Incomplete Sub-Lessons" fill="#ff4444" />
                            </BarChart>
                          </ResponsiveContainer>
                          <div className="statistic-item">
                            <div className="statistic-label">Sub-Lesson Completion Rate:</div>
                            <div className="statistic-value">{lessonStats.subLessonCompletionRate}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="statistics-card">
                  <h4>Test Statistics</h4>
                  {testStats.totalTests === 0 ? (
                    <p>No test data available.</p>
                  ) : (
                    <>
                      <h5>Test Counts and Answers</h5>
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={testStats.barChartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="tests" name="Total Tests" fill="#8884d8" />
                            <Bar dataKey="correct" name="Correct Answers" fill="#82ca9d" />
                            <Bar dataKey="wrong" name="Wrong Answers" fill="#ff4444" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <h5>Questions and Duration per Test</h5>
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={testStats.lineChartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="totalQuestions" name="Total Questions" stroke="#2196f3" activeDot={{ r: 8 }} />
                            <Line yAxisId="right" type="monotone" dataKey="duration" name="Duration (s)" stroke="#ff9800" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>

                <div className="statistics-card">
                  <h4>Quiz Statistics</h4>
                  {quizStats.totalQuizzes === 0 ? (
                    <p>No quiz data available.</p>
                  ) : (
                    <>
                      <h5>Quiz Counts and Answers</h5>
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={quizStats.barChartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="quizzes" name="Total Quizzes" fill="#8884d8" />
                            <Bar dataKey="correct" name="Correct Answers" fill="#82ca9d" />
                            <Bar dataKey="wrong" name="Wrong Answers" fill="#ff4444" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <h5>Questions and Duration per Quiz</h5>
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={quizStats.lineChartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis yAxisId="left" />
                            <YAxis yAxisId="right" orientation="right" />
                            <Tooltip />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="totalQuestions" name="Total Questions" stroke="#2196f3" activeDot={{ r: 8 }} />
                            <Line yAxisId="right" type="monotone" dataKey="duration" name="Duration (s)" stroke="#ff9800" activeDot={{ r: 8 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        );
      case 'settings':
        return (
          <div className="student-profile-settings-section">
            <h2>My Settings</h2>
            <AvatarSelection student={student} studentId={studentId} isChildPerspective={isChildPerspective} />
            <VoiceSelection student={student} studentId={studentId} isChildPerspective={isChildPerspective} />
          </div>
        );
      default:
        return (
          <div className="student-profile-welcome-section">
            <h2>Welcome to Your Profile</h2>
            <p>Select a section from the menu on the left to view details.</p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="student-profile-fullpage-loading">
        <div className="student-profile-hamster-loading">
          <HamsterWheel />
        </div>
        <p className="loading-text">Profile Loading...</p>
      </div>
    );
  }

  return (
    <div className='student-profile-all'>
      <div>
        <SecondNavbar
          visibleButtons={['testBank', 'lectures', 'avatar', 'profile', 'game', 'logout', 'exitChildPerspective']}
          isChildPerspective={isChildPerspective}
        />
      </div>
      <div className="student-profile-container">
        <div className="student-profile-sidebar">
          <img
            src={loading ? PersonPhoto : `https://localhost:7239${selectedAvatarPath}`}
            alt="Avatar"
            onError={(e) => (e.target.src = PersonPhoto)}
          />
          <div className="student-profile-menu-buttons">
            <button
              className={activeSection === 'info' ? 'active' : ''}
              onClick={() => setActiveSection('info')}
            >
              My Information
            </button>
            <button
              className={activeSection === 'friends' ? 'active' : ''}
              onClick={() => setActiveSection('friends')}
            >
              My Friends
            </button>
            <button
              className={activeSection === 'messages' ? 'active' : ''}
              onClick={() => setActiveSection('messages')}
            >
              My Messages
            </button>
            <button
              className={activeSection === 'stats' ? 'active' : ''}
              onClick={() => setActiveSection('stats')}
            >
              My Statistics
            </button>
            <button
              className={activeSection === 'settings' ? 'active' : ''}
              onClick={() => setActiveSection('settings')}
            >
              My Settings
            </button>
          </div>
        </div>
        <div className="student-profile-content-area">
          <div className="student-profile-header-section">
            {!loading && (
              <>
                <h1>{student.firstName} {student.lastName}</h1>
                <p className="student-profile-user-id">Student ID: {student.studentID}</p>
                <p className="student-profile-level">Level: {student.gameLevel}</p>
              </>
            )}
          </div>
          <div className="student-profile-main-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfiles;
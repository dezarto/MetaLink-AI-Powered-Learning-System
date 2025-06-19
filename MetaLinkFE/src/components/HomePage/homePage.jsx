import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePerspective } from '../../context/PerspectiveContext.jsx';
import PremiumRoadmap from './RoadMap.jsx';
import './HomePage.css';
import SecondNavbar from '../Navbar/SecondNavbar.jsx';
import HamsterWheel from '../Spinner/HamsterWheel.jsx';
import {
  getLearningStyleQuestions,
  getCourseLessonAndSubLessonInformationByStudentId,
  askQuestionAssistantRobot,
  getReviewSessionDatas
} from '../../services/student-api.js';

const parseAIResponse = (text, navigate) => {
  const buttonRegex = /<button label="(.*?)">(.*?)<\/button>/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = buttonRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const buttonLabel = match[1];
    const buttonContent = match[2];

    if (!buttonContent.startsWith('http://localhost:5173/user/')) {
      parts.push(`[Invalid button: ${buttonLabel}]`);
      lastIndex = buttonRegex.lastIndex;
      continue;
    }

    parts.push(<br key={`br-${match.index}`} />);

    parts.push(
      <button
        key={match.index}
        className="ai-response-button"
        onClick={() => navigate(buttonContent.replace('http://localhost:5173', ''))}
        aria-label={`Go to topic: ${buttonLabel}`}
      >
        {buttonLabel}
      </button>
    );

    lastIndex = buttonRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
};

// Missing Topics Popup Component
const MissingTopicsPopup = ({ isOpen, onClose, selectedCourse, studentId, navigate }) => {
  const { isChildPerspective } = usePerspective();
  const [missingTopics, setMissingTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedCourse) {
      const fetchMissingTopics = async () => {
        setIsLoading(true);
        try {
          const data = await getReviewSessionDatas(studentId, selectedCourse.id);
          // Group data by lesson
          const groupedTopics = data.reduce((acc, item) => {
            const [courseName, lessonName, subLessonName] = item.subLessonName.split(' - ');
            if (!acc[lessonName]) {
              acc[lessonName] = {
                id: item.reviewSessionId,
                title: lessonName,
                subTopics: []
              };
            }
            acc[lessonName].subTopics.push({
              id: item.reviewSessionId,
              name: subLessonName,
              subLessonId: item.subLessonId
            });
            return acc;
          }, {});
          setMissingTopics(Object.values(groupedTopics));
        } catch (error) {
          console.error('Error fetching missing topics:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchMissingTopics();
    }
  }, [isOpen, selectedCourse, studentId]);

  if (!isOpen || !selectedCourse) return null;

  const handleStudyClick = (subLessonId) => {
    if (isChildPerspective) return;
    navigate(`/user/${studentId}/review-session/${subLessonId}`);
    onClose();
  };

  return (
    <div className="missing-topics-overlay">
      <div className="missing-topics-popup">
        <div className="missing-topics-header">
          <h2 className="missing-topics-title" style={{ color: selectedCourse.color }}>
            Missing Topics - {selectedCourse.name}
          </h2>
          <button className="missing-topics-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="missing-topics-content">
          {isLoading ? (
            <div className="loading">Loading...</div>
          ) : missingTopics.length === 0 ? (
            <div className="missing-empty-state">No missing topics found.</div>
          ) : (
            missingTopics.map((topic) => (
              <div key={topic.id} className="missing-topic-section">
                <h3 className="missing-topic-title">{topic.title}</h3>
                <div className="missing-subtopics-list">
                  {topic.subTopics.map((subTopic) => (
                    <div key={subTopic.id} className="missing-subtopic-item">
                      <span className="missing-subtopic-name">{subTopic.name}</span>
                      <button
                        className={`missing-subtopic-study-btn ${isChildPerspective ? 'disabled' : ''}`}
                        onClick={() => handleStudyClick(subTopic.subLessonId)}
                        disabled={isChildPerspective}
                        title={isChildPerspective ? 'Study is disabled in child perspective!' : 'Study this topic'}
                      >
                        Study
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Missing Topics Section Component
const MissingTopicsSection = ({ selectedCourse, studentId, navigate, onSeeAllClick }) => {
  const { isChildPerspective } = usePerspective();
  const [missingTopics, setMissingTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedCourse) {
      const fetchMissingTopics = async () => {
        setIsLoading(true);
        try {
          const data = await getReviewSessionDatas(studentId, selectedCourse.id);
          // Group data by lesson, limit to 3 subtopics
          const groupedTopics = data.reduce((acc, item) => {
            const [courseName, lessonName, subLessonName] = item.subLessonName.split(' - ');
            if (!acc[lessonName]) {
              acc[lessonName] = {
                id: item.reviewSessionId,
                title: lessonName,
                subTopics: []
              };
            }
            acc[lessonName].subTopics.push({
              id: item.reviewSessionId,
              name: subLessonName,
              subLessonId: item.subLessonId
            });
            return acc;
          }, {});
          // Limit to 3 subtopics total
          const limitedTopics = Object.values(groupedTopics).reduce((acc, topic) => {
            if (acc.subTopicCount < 3) {
              const subTopicsToAdd = topic.subTopics.slice(0, 3 - acc.subTopicCount);
              acc.topics.push({
                ...topic,
                subTopics: subTopicsToAdd
              });
              acc.subTopicCount += subTopicsToAdd.length;
            }
            return acc;
          }, { topics: [], subTopicCount: 0 }).topics;
          setMissingTopics(limitedTopics);
        } catch (error) {
          console.error('Error fetching missing topics:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchMissingTopics();
    }
  }, [selectedCourse, studentId]);

  if (!selectedCourse) return null;

  const handleStudyClick = (subLessonId) => {
    if (isChildPerspective) return;
    navigate(`/user/${studentId}/review-session/${subLessonId}`);
  };

  return (
    <div className="missing-topics-section">
      <div className="missing-topics-section-header">
        <h3 className="missing-topics-section-title" style={{ color: selectedCourse.color }}>
          Missing Topics - {selectedCourse.name}
        </h3>
      </div>

      <div className="missing-topics-section-content">
        {isLoading ? (
          <div className="loading">Loading...</div>
        ) : missingTopics.length === 0 ? (
          <div className="missing-empty-state">No missing topics found.</div>
        ) : (
          missingTopics.map((topic) => (
            <div key={topic.id} className="missing-topic-section-item">
              <h4 className="missing-topic-section-subtitle">{topic.title}</h4>
              <div className="missing-subtopics-section-list">
                {topic.subTopics.map((subTopic) => (
                  <div key={subTopic.id} className="missing-subtopic-section-item">
                    <span className="missing-subtopic-section-name">{subTopic.name}</span>
                    <button
                      className={`missing-subtopic-section-study-btn ${isChildPerspective ? 'disabled' : ''}`}
                      onClick={() => handleStudyClick(subTopic.subLessonId)}
                      disabled={isChildPerspective}
                      title={isChildPerspective ? 'Study is disabled in child perspective!' : 'Study this topic'}
                    >
                      Study
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        {missingTopics.length > 0 && (
          <button className="missing-topics-see-all-btn" onClick={onSeeAllClick}>
            See All
          </button>
        )}
      </div>
    </div>
  );
};

const HomePage = () => {
  const { isChildPerspective } = usePerspective();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [coursesData, setCoursesData] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showMissingTopicsPopup, setShowMissingTopicsPopup] = useState(false);

  const courseColors = [
    '#FF6B6B',
    '#4ECDC4',
    '#FFD166',
    '#6A0572',
    '#1A8FE3',
    '#F94144',
    '#F3722C',
    '#F8961E',
    '#F9C74F',
    '#90BE6D',
  ];

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowMobileChat(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsPageLoading(true);
      try {
        const learningStyleData = await getLearningStyleQuestions(studentId);
        if (!learningStyleData.learningStyleCompleated) {
          navigate(`/user/${studentId}/learningstyletest`);
          return;
        }

        const courseData = await getCourseLessonAndSubLessonInformationByStudentId(studentId);
        const coursesWithColors = courseData.courses.map((course, index) => ({
          id: course.courseID,
          name: course.name,
          color: courseColors[index % courseColors.length],
        }));
        setCoursesData(coursesWithColors);
        if (coursesWithColors.length > 0) {
          setSelectedCourse(coursesWithColors[0]);
        }
      } catch (err) {
        setError('An error occurred while loading data: ' + err);
        console.error(err);
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchData();
  }, [studentId, navigate]);

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
  };

  const handleCourseSelect = (e) => {
    const courseId = e.target.value;
    const course = coursesData.find((course) => course.id === parseInt(courseId));
    if (course) {
      setSelectedCourse(course);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!currentMessage.trim() || isChildPerspective) return;

    const newMessage = {
      id: Number(studentId),
      text: currentMessage,
      sender: 'user',
    };

    setMessages([...messages, newMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      const messageData = {
        StudentId: Number(studentId),
        message: currentMessage,
        VoiceEnable: false,
      };

      const aiResponseData = await askQuestionAssistantRobot(messageData);
      const aiResponse = {
        id: Date.now() + 1,
        text: aiResponseData.response || 'No response received.',
        sender: 'ai',
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    } catch (error) {
      const errorResponse = {
        id: Date.now() + 1,
        text: 'There was a problem sending the message: ' + error.message,
        sender: 'ai',
      };
      setMessages((prevMessages) => [...prevMessages, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    if (isChildPerspective) return;
    navigate(`/user/${studentId}/avatar-chat`);
  };

  const toggleMobileChat = () => {
    setShowMobileChat(!showMobileChat);
  };

  const handleSeeAllClick = () => {
    setShowMissingTopicsPopup(true);
  };

  const handleCloseMissingTopicsPopup = () => {
    setShowMissingTopicsPopup(false);
  };

  if (isPageLoading) {
    return (
      <div className="student-profile-fullpage-loading">
        <div className='home-page-hamster-loading'>
          <HamsterWheel />
        </div>
        <p className="home-page-loading-text">Loading Courses...</p>
      </div>
    );
  }

  if (error) {
    return <div className="lectures-home-main">Error: {error}</div>;
  }

  return (
    <div className="lectures-home-main">
      <div>
        <SecondNavbar
          visibleButtons={['testBank', 'lectures', 'avatar', 'profile', 'game', 'logout', 'exitChildPerspective']}
          isChildPerspective={isChildPerspective}
        />
      </div>
      <div className="homepage-container">
        <div className="top-section">
          <div className="course-section">
            <div className="course-buttons-container">
              <div className="course-buttons-row">
                {coursesData.map((course) => (
                  <button
                    key={course.id}
                    className="course-button"
                    onClick={() => handleCourseClick(course)}
                    style={{ backgroundColor: course.color }}
                  >
                    {course.name}
                    <div className="course-button-decoration"></div>
                  </button>
                ))}

                {selectedCourse && (
                  <button
                    className="home-quick-test-button"
                    onClick={() => navigate(`/user/${studentId}/test-bank`)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Test Bank
                  </button>
                )}
              </div>

              <div className="mobile-courses-dropdown">
                <select
                  className="mobile-courses-select"
                  value={selectedCourse ? selectedCourse.id : ''}
                  onChange={handleCourseSelect}
                >
                  <option value="" disabled>
                    Select a Course
                  </option>
                  {coursesData.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>

                {selectedCourse && (
                  <button
                    className="home-quick-test-button"
                    style={{ width: '100%', marginTop: '10px' }}
                    onClick={() => navigate(`/user/${studentId}/test-bank`)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    Test Bank
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="avatar-box">
            <button
              className={`avatar-button ${isChildPerspective ? 'disabled' : ''}`}
              onClick={handleAvatarClick}
              disabled={isChildPerspective}
              title={isChildPerspective ? 'Avatar chat is disabled in child perspective!' : 'Consult Your Avatar'}
            >
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>

            <p className="avatar-button-text">{isChildPerspective ? 'Avatar is disabled' : 'Consult Your Avatar'}</p>
          </div>
        </div>

        <div className="lectures-home-main-content">
          <div className={`map-content-section ${isMobile && showMobileChat ? 'mobile-hide' : ''}`}>
            <div className="decoration-circle-1"></div>
            <div className="decoration-circle-2"></div>

            {selectedCourse ? (
              <div>
                <h2 className="home-course-title" style={{ color: selectedCourse.color }}>
                  {selectedCourse.name} Course
                </h2>
                <PremiumRoadmap
                  key={selectedCourse.id}
                  courseId={selectedCourse.id}
                  studentId={studentId}
                  onNodeClick={(nodeId) => console.log(`Node ${nodeId} clicked`)}
                />
              </div>
            ) : (
              <div className="empty-course-state">
                <img src="/api/placeholder/150/150" alt="Select Course" style={{ marginBottom: '20px' }} />
                <h2 className="empty-course-title">Select a Course</h2>
                <p className="empty-course-text">You can start by selecting one of the course buttons above.</p>
              </div>
            )}
          </div>

          <div className="right-sidebar">
            <MissingTopicsSection
              selectedCourse={selectedCourse}
              studentId={studentId}
              navigate={navigate}
              onSeeAllClick={handleSeeAllClick}
            />

            <div className={`chat-box ${isMobile && !showMobileChat ? 'mobile-hide' : ''}`}>
              <div className="chat-header">
                <div className="chat-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                  </svg>
                </div>
                <h2 className="chat-title">Assistant Robot</h2>
              </div>

              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="empty-chat-state">
                    <p>{isChildPerspective ? 'Chat is currently disabled!' : 'Hello! How can I help you?'}</p>
                    <p>{isChildPerspective ? 'You can focus on your studies.' : 'Ask a question and let\'s get started...'}</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message-bubble ${message.sender === 'user' ? 'user-message-bubble' : ''}`}
                    >
                      {message.sender === 'ai' ? (
                        <span>{parseAIResponse(message.text, navigate)}</span>
                      ) : (
                        message.text
                      )}
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="message-bubble ai-message-bubble loading-message">
                    <span className="assistant-robot-loading-text">Thinking...</span>
                  </div>
                )}
              </div>

              <form className="chat-input-form" onSubmit={handleChatSubmit}>
                <input
                  type="text"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder={isChildPerspective ? 'Chat is disabled, focus on your courses!' : 'Write your question here...'}
                  className={`chat-input-field ${isChildPerspective ? 'disabled' : ''}`}
                  disabled={isLoading || isChildPerspective}
                />
                <button
                  type="submit"
                  className={`chat-submit-button ${isChildPerspective ? 'disabled' : ''}`}
                  disabled={isLoading || isChildPerspective}
                  title={isChildPerspective ? 'Chat is disabled in child perspective!' : 'Send message'}
                >
                  {isLoading ? (
                    <span className="button-loading">
                      <div className="button-spinner"></div>
                    </span>
                  ) : (
                    <>
                      Send
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ marginLeft: '6px' }}
                      >
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <MissingTopicsPopup
        isOpen={showMissingTopicsPopup}
        onClose={handleCloseMissingTopicsPopup}
        selectedCourse={selectedCourse}
        studentId={studentId}
        navigate={navigate}
      />
    </div>
  );
};

export default HomePage;
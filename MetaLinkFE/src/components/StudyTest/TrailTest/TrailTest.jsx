import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePerspective } from '../../../context/PerspectiveContext';
import SecondNavbar from "../../Navbar/SecondNavbar.jsx";
import './TrailTest.css';
import {
  getTestByTestAndStudentId,
  askTestAssistantRobot,
  compareTest
} from '../../../services/student-api.js';
import ReactMarkdown from 'react-markdown';
import HamsterWheel from "../../../components/Spinner/HamsterWheel";
import { TestResultPopup, AverageComparison } from './TestResultPopup';

const TrailTest = () => {
  const navigate = useNavigate();
  const { studentId, testID } = useParams();
  const { isChildPerspective } = usePerspective();
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isComparisonLoading, setIsComparisonLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    unansweredQuestions: 0,
    score: 0
  });

  const [showPopup, setShowPopup] = useState(false);
  const [averageData, setAverageData] = useState({
    avgCorrectAnswers: 0,
    avgWrongAnswers: 0,
    avgDurationInMillis: 0,
    studentCorrectAnswers: 0,
    studentWrongAnswers: 0,
    studentDurationInMillis: 0,
    isSuccessful: false
  });

  const [chatMessages, setChatMessages] = useState([
    { sender: 'MetaLink AI', message: 'Merhaba! Çözdüğün testle ilgili soruların varsa bana sorabilirsin.' }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const chatContainerRef = useRef(null);

  // Test verilerini çekmek için useEffect
  useEffect(() => {
    const fetchTestData = async () => {
      setIsLoading(true);
      try {
        const testData = await getTestByTestAndStudentId(studentId, testID);
        setTestData(testData);

        const formattedQuestions = testData.testQuestions.map((q, index) => ({
          id: index + 1,
          question: q.questionText,
          options: q.testQuestionOptions.map((option, optIndex) => ({
            id: String.fromCharCode(97 + optIndex),
            text: option.optionText,
            optionId: option.optionID,
            isCorrect: option.isCorrect,
            isSelected: option.isSelected
          }))
        }));
        setQuestions(formattedQuestions);

        // Stats hesaplamaları
        let correctCount = 0;
        let incorrectCount = 0;
        let unansweredCount = 0;

        formattedQuestions.forEach(q => {
          const selectedOption = q.options.find(opt => opt.isSelected);
          if (!selectedOption) {
            unansweredCount++;
          } else if (selectedOption.isCorrect) {
            correctCount++;
          } else {
            incorrectCount++;
          }
        });

        const totalQuestions = formattedQuestions.length;
        const answeredQuestions = totalQuestions - unansweredCount;
        const score = answeredQuestions > 0
          ? Math.round((correctCount / answeredQuestions) * 100)
          : 0;

        setStats({
          totalQuestions,
          correctAnswers: correctCount,
          incorrectAnswers: incorrectCount,
          unansweredQuestions: unansweredCount,
          score
        });

        const initialAnswers = {};
        testData.testQuestions.forEach((q, index) => {
          const selectedOption = q.testQuestionOptions.find(opt => opt.isSelected);
          if (selectedOption) {
            const optIndex = q.testQuestionOptions.indexOf(selectedOption);
            initialAnswers[index + 1] = String.fromCharCode(97 + optIndex);
          }
        });
        setAnswers(initialAnswers);
      } catch (error) {
        console.error('Test verisi alınırken hata:', error);
        setErrorMessage('Test verisi yüklenemedi. Lütfen tekrar deneyin.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestData();
  }, [studentId, testID]);

  // CompareTest için ayrı useEffect (5 saniye gecikmeli)
  useEffect(() => {
    if (testData) {
      setIsComparisonLoading(true);
      const timer = setTimeout(async () => {
        try {
          const comparisonData = await compareTest({
            studentId: parseInt(studentId),
            testId: parseInt(testID),
            quizId: 0
          });

          setAverageData({
            avgCorrectAnswers: comparisonData.avgCorrectAnswers,
            avgWrongAnswers: comparisonData.avgWrongAnswers,
            avgDurationInMillis: comparisonData.avgDurationInMillis,
            studentCorrectAnswers: comparisonData.studentCorrectAnswers,
            studentWrongAnswers: comparisonData.studentWrongAnswers,
            studentDurationInMillis: comparisonData.studentDurationInMillis,
            isSuccessful: comparisonData.isSuccessful
          });
          setShowPopup(true);
        } catch (error) {
          console.error('CompareTest isteği başarısız:', error);
          setErrorMessage('Karşılaştırma verisi yüklenemedi.');
        } finally {
          setIsComparisonLoading(false);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [testData, studentId, testID]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userMessage.trim() || isChildPerspective) return;

    setChatMessages(prev => [...prev, { sender: 'User', message: userMessage }]);
    setUserMessage('');

    try {
      const requestData = {
        studentId: parseInt(studentId),
        testId: parseInt(testID),
        userMessage: userMessage
      };
      const response = await askTestAssistantRobot(requestData);
      setChatMessages(prev => [...prev, {
        sender: 'MetaLink AI',
        message: response.content || 'Size nasıl yardımcı olabileceğimi anlamadım.'
      }]);
    } catch (error) {
      console.error('Content Assistant isteği başarısız:', error);
      setChatMessages(prev => [...prev, {
        sender: 'MetaLink AI',
        message: 'Bir hata oluştu, lütfen tekrar deneyin.'
      }]);
    }
  };

  const handleBack = () => {
    navigate(`/user/${studentId}/test-bank`);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <div>
      <div>
        <SecondNavbar visibleButtons={['lectures', 'avatar', 'profile', 'logout']} isChildPerspective={isChildPerspective} />
      </div>

      {showPopup && testData && !isLoading && !isComparisonLoading && (
        <TestResultPopup
          studentCorrectAnswers={averageData.studentCorrectAnswers}
          studentWrongAnswers={averageData.studentWrongAnswers}
          studentDurationInMillis={averageData.studentDurationInMillis}
          avgCorrectAnswers={averageData.avgCorrectAnswers}
          isSuccessful={averageData.isSuccessful}
          onClose={handleClosePopup}
        />
      )}

      <div className="trailtest-container">
        <div className="trailtest-main-content">
          {isLoading ? (
            <div className="trailtest-sipnner-loading-container">
              <div className='trailtest-hamster-loading'>
                <HamsterWheel />
              </div>
              <p className="trailtest-loading-text">Test Loading...</p>
            </div>
          ) : testData ? (
            <>
              <div className="trailtest-test-section">
                <h1>{testData.title}</h1>
                <p>{testData.description}</p>

                <div className="trailtest-actions">
                  <button onClick={handleBack} className="trailtest-back-button">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                    Return to Topic List
                  </button>
                </div>

                <div className="trailtest-score-summary">
                  <div className="trailtest-score-box">
                    <span className="trailtest-score-title">Total Score</span>
                    <span className="trailtest-score-value" style={{
                      color: stats.score >= 70 ? '#27ae60' : stats.score >= 50 ? '#f39c12' : '#e74c3c'
                    }}>
                      {stats.score}%
                    </span>
                  </div>
                  <div className="trailtest-score-details">
                    <div className="trailtest-score-detail">
                      <span>Total Questions:</span>
                      <span>{stats.totalQuestions}</span>
                    </div>
                    <div className="trailtest-score-detail">
                      <span>Correct Answer:</span>
                      <span className="trailtest-correct-count">{stats.correctAnswers}</span>
                    </div>
                    <div className="trailtest-score-detail">
                      <span>Wrong Answer:</span>
                      <span className="trailtest-incorrect-count">{stats.incorrectAnswers}</span>
                    </div>
                    <div className="trailtest-score-detail">
                      <span>Question Left Blank:</span>
                      <span className="trailtest-unanswered-count">{stats.unansweredQuestions}</span>
                    </div>

                    {isComparisonLoading ? (
                      <div className="trailtest-loading-text">Loading comparison data...</div>
                    ) : (
                      <AverageComparison
                        avgCorrectAnswers={averageData.avgCorrectAnswers}
                        avgWrongAnswers={averageData.avgWrongAnswers}
                        avgDurationInMillis={averageData.avgDurationInMillis}
                        studentCorrectAnswers={averageData.studentCorrectAnswers}
                        studentWrongAnswers={averageData.studentWrongAnswers}
                        studentDurationInMillis={averageData.studentDurationInMillis}
                      />
                    )}
                  </div>
                </div>

                <div className="trailtest-questions-container">
                  {questions.map((q) => {
                    const isAnswered = q.options.some(option => option.isSelected);
                    const correctOption = q.options.find(option => option.isCorrect);
                    const selectedOption = q.options.find(option => option.isSelected);
                    let statusMessage = '';
                    let statusClass = '';

                    if (!isAnswered) {
                      statusMessage = `You left this question blank. The correct answer is: ${correctOption.id.toUpperCase()}`;
                      statusClass = 'trailtest-status-empty';
                    } else if (selectedOption.isCorrect) {
                      statusMessage = 'You answered correctly!';
                      statusClass = 'trailtest-status-correct';
                    } else {
                      statusMessage = `You answered incorrectly. The correct answer is: ${correctOption.id.toUpperCase()}`;
                      statusClass = 'trailtest-status-incorrect';
                    }

                    return (
                      <div key={q.id} className="trailtest-question-card">
                        <h3 className="trailtest-question-title">
                          Question {q.id}: {q.question}
                        </h3>
                        <div className="trailtest-options">
                          {q.options.map((option) => (
                            <div
                              key={option.id}
                              className={`trailtest-option 
                                ${option.isSelected ? 'trailtest-selected' : ''} 
                                ${option.isCorrect ? 'trailtest-correct' : option.isSelected && !option.isCorrect ? 'trailtest-incorrect' : ''}`}
                            >
                              <span className="trailtest-option-label">{option.id.toUpperCase()})</span>
                              <span className="trailtest-option-text">{option.text}</span>
                              <span className="trailtest-status-icon">
                                {option.isCorrect && (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2ecc71" strokeWidth="2">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                )}
                                {option.isSelected && !option.isCorrect && (
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className={`trailtest-status-message ${statusClass}`}>
                          {statusMessage}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="trailtest-side-panel">
                <div className={`trailtest-chat-box ${isChildPerspective ? 'trailtest-disabled' : ''}`}>
                  <div className="trailtest-chat-header">
                    <h2>Content Assistant</h2>
                  </div>
                  <div className="trailtest-chat-messages" ref={chatContainerRef}>
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`trailtest-message ${msg.sender === 'User' ? 'trailtest-user-message' : 'trailtest-ai-message'}`}
                      >
                        <span className="trailtest-sender">{msg.sender}:</span>
                        {msg.sender === 'MetaLink AI' ? (
                          <ReactMarkdown>{msg.message}</ReactMarkdown>
                        ) : (
                          <p>{msg.message}</p>
                        )}
                      </div>
                    ))}
                    {isChildPerspective && (
                      <div className="trailtest-disabled-message">
                        Content Assistant is disabled in child perspective.
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleSendMessage} className="trailtest-chat-input">
                    <input
                      type="text"
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      placeholder={isChildPerspective ? "Chat disabled in child perspective" : "Write your questions here..."}
                      disabled={isChildPerspective}
                      title={isChildPerspective ? "Content Assistant is disabled in child perspective" : ""}
                    />
                    <button
                      type="submit"
                      disabled={isChildPerspective}
                      title={isChildPerspective ? "Content Assistant is disabled in child perspective" : "Send message"}
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </>
          ) : (
            <div className="trailtest-error-message">No test data found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrailTest;
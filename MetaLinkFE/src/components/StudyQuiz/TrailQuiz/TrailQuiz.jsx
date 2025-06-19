import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePerspective } from '../../../context/PerspectiveContext';
import SecondNavbar from "../../Navbar/SecondNavbar.jsx";
import './TrailQuiz.css';
import { getQuizByQuizAndStudentId, askQuizAssistantRobot, compareQuiz } from '../../../services/student-api.js';
import ReactMarkdown from 'react-markdown';
import HamsterWheel from "../../../components/Spinner/HamsterWheel";
import { TestResultPopup, AverageComparison } from '../../StudyTest/TrailTest/TestResultPopup.jsx';

const TrailQuiz = () => {
  const navigate = useNavigate();
  const { studentId, quizId } = useParams();
  const { isChildPerspective } = usePerspective();
  const [quizData, setQuizData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
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
    { sender: 'MetaLink AI', message: 'Hello! If you have any questions about the quiz you solved, you can ask me.' }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      setIsLoading(true);
      try {
        const quizData = await getQuizByQuizAndStudentId(studentId, quizId);
        setQuizData(quizData);

        const formattedQuestions = quizData.quizQuestions.map((q, index) => ({
          id: index + 1,
          question: q.questionText,
          options: q.quizQuestionOptions.map((option, optIndex) => ({
            id: String.fromCharCode(97 + optIndex),
            text: option.optionText,
            optionId: option.optionID,
            isCorrect: option.isCorrect,
            isSelected: option.isSelected
          }))
        }));
        setQuestions(formattedQuestions);

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
        quizData.quizQuestions.forEach((q, index) => {
          const selectedOption = q.quizQuestionOptions.find(opt => opt.isSelected);
          if (selectedOption) {
            const optIndex = q.quizQuestionOptions.indexOf(selectedOption);
            initialAnswers[index + 1] = String.fromCharCode(97 + optIndex);
          }
        });
        setAnswers(initialAnswers);
      } catch (error) {
        console.error('Error while retrieving quiz data:', error);
        setErrorMessage('Failed to load quiz data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizData();
  }, [studentId, quizId]);

  useEffect(() => {
    if (quizData) {
      setIsComparisonLoading(true);
      const timer = setTimeout(async () => {
        try {
          const comparisonData = await compareQuiz({
            studentId: parseInt(studentId),
            quizId: parseInt(quizId),
            testId: 0
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
          console.error('CompareQuiz request failed:', error);
          setErrorMessage('Failed to load comparison data.');
        } finally {
          setIsComparisonLoading(false);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [quizData, studentId, quizId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isChildPerspective || !userMessage.trim()) return;

    setChatMessages(prev => [...prev, { sender: 'User', message: userMessage }]);
    setUserMessage('');

    try {
      const requestData = {
        studentId: parseInt(studentId),
        quizId: parseInt(quizId),
        userMessage: userMessage,
        quizData: quizData,
        questions: questions.map(q => ({
          id: q.id,
          questionText: q.question,
          options: q.options.map(opt => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.isCorrect,
            isSelected: opt.isSelected
          }))
        }))
      };

      const response = await askQuizAssistantRobot(requestData);
      setChatMessages(prev => [...prev, {
        sender: 'MetaLink AI',
        message: response.content || 'I don\'t see how I can help you.'
      }]);
    } catch (error) {
      console.error('Content Assistant request failed:', error);
      setChatMessages(prev => [...prev, {
        sender: 'MetaLink AI',
        message: 'An error occurred, please try again.'
      }]);
    }
  };

  const handleBack = () => {
    navigate(`/user/${studentId}/test-bank`);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const renderQuizContent = () => {
    if (!quizData) return <div className="trailquiz-error-message">No quiz data found.</div>;

    return (
      <div className="trailquiz-all">
        <div className="trailquiz-container">
          <div className="trailquiz-main-content">
            <div className="trailquiz-test-section">
              <h1>{quizData.title}</h1>
              <p>{quizData.description}</p>

              <div className="trailquiz-actions">
                <button onClick={handleBack} className="trailquiz-back-button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                  Return to Topic List
                </button>
              </div>

              <div className="trailquiz-score-summary">
                <div className="trailquiz-score-box">
                  <span className="trailquiz-score-title">Total Score</span>
                  <span className="trailquiz-score-value" style={{
                    color: stats.score >= 70 ? '#27ae60' : stats.score >= 50 ? '#f39c12' : '#e74c3c'
                  }}>
                    {stats.score}%
                  </span>
                </div>
                <div className="trailquiz-score-details">
                  <div className="trailquiz-score-detail">
                    <span>Total Questions:</span>
                    <span>{stats.totalQuestions}</span>
                  </div>
                  <div className="trailquiz-score-detail">
                    <span>True Answer:</span>
                    <span className="trailquiz-correct-count">{stats.correctAnswers}</span>
                  </div>
                  <div className="trailquiz-score-detail">
                    <span>Wrong Answer:</span>
                    <span className="trailquiz-incorrect-count">{stats.incorrectAnswers}</span>
                  </div>
                  <div className="trailquiz-score-detail">
                    <span>Empty:</span>
                    <span className="trailquiz-unanswered-count">{stats.unansweredQuestions}</span>
                  </div>

                  {isComparisonLoading ? (
                    <div className="trailquiz-loading-text">Loading comparison data...</div>
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

              <div className="trailquiz-questions-container">
                {questions.map((q) => {
                  const isAnswered = q.options.some(option => option.isSelected);
                  const correctOption = q.options.find(option => option.isCorrect);
                  const selectedOption = q.options.find(option => option.isSelected);
                  let statusMessage = '';
                  let statusClass = '';

                  if (!isAnswered) {
                    statusMessage = `You left this question blank. Correct answer: ${correctOption?.id.toUpperCase() || 'Unknown'}`;
                    statusClass = 'trailquiz-status-empty';
                  } else if (selectedOption && selectedOption.isCorrect) {
                    statusMessage = 'You answered correctly!';
                    statusClass = 'trailquiz-status-correct';
                  } else {
                    statusMessage = `You answered wrong. Correct answer: ${correctOption?.id.toUpperCase() || 'Unknown'}`;
                    statusClass = 'trailquiz-status-incorrect';
                  }

                  return (
                    <div key={q.id} className="trailquiz-question-card">
                      <h3 className="trailquiz-question-title">
                        Question {q.id}: {q.question}
                      </h3>
                      <div className="trailquiz-options">
                        {q.options.map((option) => (
                          <div
                            key={option.id}
                            className={`trailquiz-option 
                              ${option.isSelected ? 'trailquiz-selected' : ''} 
                              ${option.isCorrect ? 'trailquiz-correct' : option.isSelected && !option.isCorrect ? 'trailquiz-incorrect' : ''}`}
                          >
                            <span className="trailquiz-option-label">{option.id.toUpperCase()})</span>
                            <span className="trailquiz-option-text">{option.text}</span>
                            <span className="trailquiz-status-icon">
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
                      <div className={`trailquiz-status-message ${statusClass}`}>
                        {statusMessage}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="trailquiz-side-panel">
          <div className="trailquiz-chat-box">
            <div className="trailquiz-chat-header">
              <h2>Content Assistant</h2>
            </div>
            <div className="trailquiz-chat-messages" ref={chatContainerRef}>
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`trailquiz-message ${msg.sender === 'User' ? 'trailquiz-user-message' : 'trailquiz-ai-message'}`}
                >
                  <span className="trailquiz-sender">{msg.sender}:</span>
                  {msg.sender === 'MetaLink AI' ? (
                    <ReactMarkdown>{msg.message}</ReactMarkdown>
                  ) : (
                    <p>{msg.message}</p>
                  )}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} className="trailquiz-chat-input">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Write your questions here..."
                disabled={isChildPerspective}
                title={isChildPerspective ? 'Content Assistant is disabled in child perspective' : ''}
              />
              <button
                type="submit"
                disabled={isChildPerspective}
                title={isChildPerspective ? 'Content Assistant is disabled in child perspective' : ''}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div>
        <SecondNavbar visibleButtons={['lectures', 'avatar', 'profile', 'logout']} isChildPerspective={isChildPerspective} />
      </div>

      {showPopup && quizData && !isLoading && !isComparisonLoading && (
        <TestResultPopup
          studentCorrectAnswers={averageData.studentCorrectAnswers}
          studentWrongAnswers={averageData.studentWrongAnswers}
          studentDurationInMillis={averageData.studentDurationInMillis}
          avgCorrectAnswers={averageData.avgCorrectAnswers}
          isSuccessful={averageData.isSuccessful}
          onClose={handleClosePopup}
        />
      )}

      {isLoading ? (
        <div className="trailquiz-fullpage-loading">
          <div className='trailquiz-hamster-loading'>
            <HamsterWheel />
          </div>
          <p className="trailquiz-loading-text">Quiz Results Loading...</p>
        </div>
      ) : (
        renderQuizContent()
      )}
    </div>
  );
};

export default TrailQuiz;
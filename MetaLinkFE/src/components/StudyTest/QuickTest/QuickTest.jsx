import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SecondNavbar from "../../../components/Navbar/SecondNavbar.jsx";
import './QuickTest.css';
import { generateTest, saveTestResult } from '../../../services/student-api.js';
import HamsterWheel from "../../Spinner/HamsterWheel.jsx";

const QuickTest = () => {
  const navigate = useNavigate();
  const { studentId, subLessonId } = useParams();
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [startTime, setStartTime] = useState(null);
  const [showStartPopup, setShowStartPopup] = useState(false);
  const [showEndPopup, setShowEndPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showTestInitiation, setShowTestInitiation] = useState(true);
  const timerRef = useRef(null);

  const fetchTestData = async () => {
    setIsLoading(true);
    try {
      const testData = await generateTest({
        studentId: studentId,
        subLessonId: subLessonId,
        quickTest: true,
        normalTest: false,
        generalTest: false,
      });
      setTestData(testData);

      if (testData.isSolved) {
        navigate(`/user/${studentId}/trail-test/${testData.testID}`);
      } else {
        const formattedQuestions = testData.testQuestions.map((q, index) => ({
          id: index + 1,
          question: `Question ${index + 1}: ${q.questionText}`,
          options: q.testQuestionOptions.map((option, optIndex) => ({
            id: String.fromCharCode(97 + optIndex),
            text: option.optionText,
            optionId: option.optionID,
            isCorrect: option.isCorrect
          }))
        }));
        setQuestions(formattedQuestions);
        setShowStartPopup(true);
      }
    } catch (error) {
      console.error('Error fetching test data:', error);
      setErrorMessage('Test data could not be loaded. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const initiateTest = () => {
    setShowTestInitiation(false);
    fetchTestData();
  };

  useEffect(() => {
    if (testStarted && !testFinished && questions.length > 0) {
      if (!startTime) {
        setStartTime(Date.now());
      }

      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            endTest();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [testStarted, testFinished, questions, startTime]);

  const handleOptionSelect = (questionId, optionId) => {
    if (testStarted && !testFinished) {
      setAnswers(prevAnswers => ({
        ...prevAnswers,
        [questionId]: optionId
      }));
    }
  };

  const startTest = () => {
    setTestStarted(true);
    setShowStartPopup(false);
  };

  const endTest = async () => {
    setTestFinished(true);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (testData && startTime) {
      const durationInMilliseconds = Date.now() - startTime;

      const resultData = {
        testID: testData.testID,
        subLessonID: testData.subLessonID,
        title: testData.title,
        description: testData.description,
        createDate: testData.createDate,
        durationInMilliseconds: durationInMilliseconds,
        testQuestions: testData.testQuestions.map((q, index) => ({
          questionID: q.questionID,
          testID: q.testID,
          questionText: q.questionText,
          testQuestionOptions: q.testQuestionOptions.map(option => ({
            optionID: option.optionID,
            questionID: option.questionID,
            optionText: option.optionText,
            isCorrect: option.isCorrect,
            isSelected: answers[index + 1] === String.fromCharCode(97 + q.testQuestionOptions.indexOf(option))
          }))
        }))
      };

      try {
        const savedResult = await saveTestResult(resultData, studentId);
        setTestResult(savedResult);
        setShowEndPopup(true);
      } catch (error) {
        console.error('Error saving test result:', error);
        setErrorMessage('Test result could not be saved.');
        setShowEndPopup(true);
      }
    } else {
      setShowEndPopup(true);
    }
  };

  const submitTest = async () => {
    const answeredCount = Object.keys(answers).length;

    if (answeredCount < 15) {
      setErrorMessage('Please answer at least 15 questions before finishing.');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    await endTest();
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getOptionClass = (questionId, optionId) => {
    return answers[questionId] === optionId ? 'cog-test-selected' : '';
  };

  return (
    <div>
      <SecondNavbar visibleButtons={["lectures", "avatar", "profile", "logout"]} />
      <div className="cog-test-container">
        {showTestInitiation && (
          <div className="cog-test-popup">
            <div className="cog-test-popup-content">
              <h2>Ready to Begin?</h2>
              <p>Click below to generate your quick test.</p>
              <button onClick={initiateTest}>Generate Quick Test</button>
            </div>
          </div>
        )}

        {showStartPopup && (
          <div className="cog-test-popup">
            <div className="cog-test-popup-content">
              <h2>Are you ready for the test?</h2>
              <p>You will have 30 minutes to complete this quick test.</p>
              <button onClick={startTest}>I'm Ready</button>
            </div>
          </div>
        )}

        {showEndPopup && (
          <div className="cog-test-popup">
            <div className="cog-test-popup-content">
              <h2>Exam Finished!</h2>
              <p>{errorMessage || 'Your answers have been saved.'}</p>
              <div className="cog-test-popup-buttons">
                <button
                  className="cog-test-back-button"
                  onClick={() => navigate(`/user/${studentId}/trail-test/${testData.testID}`)}
                >
                  See result
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`cog-test-main-content ${showStartPopup ? 'cog-test-blurred' : ''}`}>
          {isLoading ? (
            <div className="quick-test-loading-main">
              <div className="quick-test-loading-container">
                <HamsterWheel />
                <p className="quick-test-loading-text">Test Loading...</p>

              </div>
            </div>
          ) : (
            questions.length > 0 && (
              <>
                <div className="cog-test-section">
                  <h1>{testData?.title || "Cognitive Test"}</h1>
                  <div className="cog-test-questions-container">
                    {questions.map((q) => (
                      <div key={q.id} className="cog-test-question-card">
                        <h3>{q.question}</h3>
                        <div className="cog-test-options">
                          {q.options.map((option) => (
                            <div
                              key={option.id}
                              className={`cog-test-option ${getOptionClass(q.id, option.id)} ${testFinished ? 'cog-test-disabled' : ''}`}
                              onClick={() => handleOptionSelect(q.id, option.id)}
                            >
                              <span className="cog-test-option-label">{option.id})</span>
                              <span className="cog-test-option-text">{option.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="cog-test-side-panel">
                  <div className="cog-test-timer-section">
                    <h2>Time Remaining</h2>
                    <div className="cog-test-timer">{formatTime(timeRemaining)}</div>
                  </div>

                  <div className="cog-test-answer-sheet-section">
                    <h2>Answer Sheet</h2>
                    <div className="cog-test-answer-grid">
                      {questions.map((q) => (
                        <div key={q.id} className="cog-test-answer-item">
                          <span className="cog-test-question-number">{q.id}</span>
                          <div className="cog-test-option-indicators">
                            {q.options.map((option) => (
                              <div
                                key={option.id}
                                className={`cog-test-indicator ${answers[q.id] === option.id ? 'cog-test-marked' : ''}`}
                              >
                                {option.id}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="cog-test-submit-section">
                    <button
                      className="cog-test-submit-button"
                      onClick={submitTest}
                      disabled={testFinished}
                    >
                      Finish Exam
                    </button>
                    {errorMessage && <div className="cog-test-error-message">{errorMessage}</div>}
                    <div className="cog-test-status">
                      Questions answered: {Object.keys(answers).length} / {questions.length}
                    </div>
                  </div>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickTest;
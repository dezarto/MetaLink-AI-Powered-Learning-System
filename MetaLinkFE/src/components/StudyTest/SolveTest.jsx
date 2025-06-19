import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SecondNavbar from "../Navbar/SecondNavbar.jsx";
import './SolveTest.css';
import { getTestByTestAndStudentId, saveTestResult } from '../../services/student-api.js';
import HamsterWheel from '../Spinner/HamsterWheel.jsx';

const SolveTest = () => {
    const navigate = useNavigate();
    const { studentId, testID } = useParams();
    const [testData, setTestData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [testStarted, setTestStarted] = useState(false);
    const [testFinished, setTestFinished] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(30 * 60);
    const [startTime, setStartTime] = useState(null);
    const [showStartPopup, setShowStartPopup] = useState(true);
    const [showEndPopup, setShowEndPopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        const fetchTestData = async () => {
            setIsLoading(true);
            try {
                const testData = await getTestByTestAndStudentId(studentId, testID);
                setTestData(testData);

                // Soruları formatla
                const formattedQuestions = testData.testQuestions.map((q, index) => ({
                    id: index + 1,
                    question: `Question ${index + 1}: ${q.questionText}`,
                    options: q.testQuestionOptions.map((option, optIndex) => ({
                        id: String.fromCharCode(97 + optIndex),
                        text: option.optionText,
                        optionId: option.optionID
                    }))
                }));
                setQuestions(formattedQuestions);

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
                console.error('Error while getting test data:', error);
                setErrorMessage('Failed to load test data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchTestData();
    }, [studentId, testID]);

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
        setShowEndPopup(true);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        if (testData && startTime) {
            const durationInMilliseconds = Date.now() - startTime;

            const resultData = {
                testID: testData.testID,
                subLessonID: testData.subLessonID,
                lessonID: testData.lessonID,
                title: testData.title,
                description: testData.description,
                createDate: testData.createDate,
                testType: testData.testType,
                durationInMilliseconds: durationInMilliseconds,
                testQuestions: testData.testQuestions.map((q, index) => ({
                    questionID: q.questionID,
                    testID: q.testID,
                    questionText: q.questionText,
                    testQuestionOptions: q.testQuestionOptions.map((option, optIndex) => ({
                        optionID: option.optionID,
                        questionID: option.questionID,
                        optionText: option.optionText,
                        isCorrect: option.isCorrect,
                        isSelected: answers[index + 1] === String.fromCharCode(97 + optIndex)
                    }))
                }))
            };
            console.log(resultData);
            try {
                await saveTestResult(resultData, studentId);
            } catch (error) {
                console.error('Error while saving test result:', error);
                setErrorMessage('The test result could not be saved.');
            }
        }
    };

    const submitTest = async () => {
        const answeredCount = Object.keys(answers).length;

        if (answeredCount < 15) {
            setErrorMessage('Please mark at least 15 questions before finishing.');
            setTimeout(() => setErrorMessage(''), 5000);
            return;
        }

        await endTest();
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div>
                <div className="study-test-loading-container">
                    <HamsterWheel />
                </div>
            </div>
        );
    }

    return (
        <div>
            <div>
                <SecondNavbar visibleButtons={["lectures", "avatar", "profile", "logout"]} />
            </div>

            <div className="solve-test-container">
                {showStartPopup && (
                    <div className="solve-test-popup">
                        <div className="solve-test-popup-content">
                            <h2>{testData ? `Test: ${testData.title}` : 'Are You Ready for the Test?'}</h2>
                            <p>You have 30 minutes to complete this test.</p>
                            <button onClick={startTest}>Start</button>
                        </div>
                    </div>
                )}

                {showEndPopup && (
                    <div className="solve-test-popup">
                        <div className="solve-test-popup-content">
                            <h2>Testing is Over!</h2>
                            <p>Your answers have been recorded.</p>
                            <button onClick={() => navigate(`/user/${studentId}/trail-test/${testID}`)}>See Result</button>
                        </div>
                    </div>
                )}

                <div className={`solve-test-main-content ${showStartPopup ? 'solve-test-blurred' : ''}`}>
                    {testData ? (
                        <>
                            <div className="solve-test-section">
                                <h1>{testData.title}</h1>
                                <p>{testData.description}</p>
                                <div className="solve-test-questions-container">
                                    {questions.map((q) => (
                                        <div key={q.id} className="solve-test-question-card">
                                            <h3>{q.question}</h3>
                                            <div className="solve-test-options">
                                                {q.options.map((option) => (
                                                    <div
                                                        key={option.id}
                                                        className={`solve-test-option ${answers[q.id] === option.id ? 'solve-test-selected' : ''} ${testFinished ? 'solve-test-disabled' : ''}`}
                                                        onClick={() => handleOptionSelect(q.id, option.id)}
                                                    >
                                                        <span className="solve-test-option-label">{option.id})</span>
                                                        <span className="solve-test-option-text">{option.text}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="solve-test-side-panel">
                                <div className="solve-test-timer-section">
                                    <h2>Remaining Time</h2>
                                    <div className="solve-test-timer">{formatTime(timeRemaining)}</div>
                                </div>

                                <div className="solve-test-answer-sheet-section">
                                    <h2>Answer Sheet</h2>
                                    <div className="solve-test-answer-grid">
                                        {questions.map((q) => (
                                            <div key={q.id} className="solve-test-answer-item">
                                                <span className="solve-test-question-number">{q.id}</span>
                                                <div className="solve-test-option-indicators">
                                                    {q.options.map((option) => (
                                                        <div
                                                            key={option.id}
                                                            className={`solve-test-indicator ${answers[q.id] === option.id ? 'solve-test-marked' : ''}`}
                                                        >
                                                            {option.id}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="solve-test-submit-section">
                                    <button
                                        className="solve-test-submit-button"
                                        onClick={submitTest}
                                        disabled={testFinished}
                                    >
                                        Finish Test
                                    </button>
                                    {errorMessage && <div className="solve-test-error-message">{errorMessage}</div>}
                                    <div className="solve-test-status">
                                        Answered questions: {Object.keys(answers).length} / {questions.length}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="solve-test-error-message">No test data found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SolveTest;
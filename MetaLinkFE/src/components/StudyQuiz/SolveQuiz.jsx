import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SecondNavbar from "../Navbar/SecondNavbar.jsx";
import '../StudyTest/QuickTest/QuickTest.css';
import './SolveQuiz.css';
import { getQuizByQuizAndStudentId, saveQuizResult, askQuizAssistantRobot } from '../../services/student-api.js';
import HamsterWheel from '../Spinner/HamsterWheel.jsx';
import ReactMarkdown from 'react-markdown';

const SolveQuiz = () => {
    const navigate = useNavigate();
    const { studentId, quizID } = useParams();
    const [quizData, setQuizData] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(15 * 60);
    const [startTime, setStartTime] = useState(null);
    const [showStartPopup, setShowStartPopup] = useState(true);
    const [showEndPopup, setShowEndPopup] = useState(false);
    const [showConfirmLeavePopup, setShowConfirmLeavePopup] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [alreadySolved, setAlreadySolved] = useState(false);
    const timerRef = useRef(null);

    const [chatMessages, setChatMessages] = useState([
        { sender: 'MetaLink AI', message: 'Hello! If you have any questions about this quiz, feel free to ask me.' }
    ]);
    const [userMessage, setUserMessage] = useState('');
    const chatContainerRef = useRef(null);

    useEffect(() => {
        const fetchQuizData = async () => {
            setIsLoading(true);
            try {
                const quizData = await getQuizByQuizAndStudentId(studentId, quizID);

                if (!quizData || !quizData.quizQuestions || quizData.quizQuestions.length === 0) {
                    setErrorMessage('Quiz data not found. Please go back to the test bank and try again.');
                    return;
                }

                setQuizData(quizData);

                if (quizData.isSolved) {
                    setAlreadySolved(true);
                    setQuizFinished(true);
                    setShowStartPopup(false);
                }

                const formattedQuestions = quizData.quizQuestions.map((q, index) => ({
                    id: index + 1,
                    questionId: q.questionID,
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
                setErrorMessage('Unable to load quiz data. Please try again or return to the test bank.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuizData();
    }, [studentId, quizID]);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    useEffect(() => {
        if (quizStarted && !quizFinished && questions.length > 0) {
            if (!startTime) {
                setStartTime(Date.now());
            }

            timerRef.current = setInterval(() => {
                setTimeRemaining(prevTime => {
                    if (prevTime <= 1) {
                        endQuiz();
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
    }, [quizStarted, quizFinished, questions, startTime]);

    const handleOptionSelect = (questionId, optionId) => {
        if (quizStarted && !quizFinished) {
            setAnswers(prevAnswers => ({
                ...prevAnswers,
                [questionId]: optionId
            }));
        }
    };

    const startQuiz = () => {
        setQuizStarted(true);
        setShowStartPopup(false);
    };

    const endQuiz = async () => {
        setQuizFinished(true);
        setShowEndPopup(true);
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        if (quizData && startTime) {
            const durationInMilliseconds = Date.now() - startTime;

            try {
                console.log('Quiz sonuçları kaydediliyor...', {
                    studentId: studentId,
                    quizId: quizData.quizID,
                    answers: answers
                });

                const resultData = {
                    quizID: quizData.quizID,
                    subLessonID: quizData.subLessonID,
                    lessonID: quizData.lessonID,
                    studentId: parseInt(studentId),
                    title: quizData.title,
                    description: quizData.description,
                    createDate: quizData.createDate,
                    quizType: quizData.quizType,
                    durationInMilliseconds: durationInMilliseconds,
                    quizQuestions: quizData.quizQuestions.map((q, index) => {
                        const questionIndex = index + 1;
                        const selectedOptionId = answers[questionIndex];

                        return {
                            questionID: q.questionID,
                            quizID: q.quizID,
                            questionText: q.questionText,
                            quizQuestionOptions: q.quizQuestionOptions.map((option, optIndex) => {
                                const optionLetter = String.fromCharCode(97 + optIndex);
                                return {
                                    optionID: option.optionID,
                                    questionID: option.questionID,
                                    optionText: option.optionText,
                                    isCorrect: option.isCorrect,
                                    isSelected: optionLetter === selectedOptionId
                                };
                            })
                        };
                    })
                };

                console.log('Backend\'e gönderilen veri:', resultData);
                const response = await saveQuizResult(resultData, studentId);
                console.log('Quiz sonucu başarıyla kaydedildi:', response);
            } catch (error) {
                console.error('Quiz sonucu kaydedilirken hata oluştu:', error);
                setErrorMessage('Quiz sonucu kaydedilemedi, lütfen daha sonra tekrar deneyin.');
            }
        }
    };

    const submitQuiz = async () => {
        const answeredCount = Object.keys(answers).length;

        if (answeredCount < 5) {
            setShowConfirmLeavePopup(true);
            return;
        }

        await endQuiz();
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const closeEndPopup = () => {
        setShowEndPopup(false);
        navigate(`/user/${studentId}/test-bank`);
    };

    const viewQuizResults = () => {
        setShowEndPopup(false);
        navigate(`/user/${studentId}/trail-quiz/${quizID}`);
    };

    const cancelLeaveQuiz = () => {
        setShowConfirmLeavePopup(false);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userMessage.trim()) return;

        setChatMessages(prev => [...prev, { sender: 'User', message: userMessage }]);
        setUserMessage('');

        try {
            const requestData = {
                studentId: parseInt(studentId),
                quizId: parseInt(quizID),
                userMessage: userMessage,
                quizData: quizData
            };

            const response = await askQuizAssistantRobot(requestData);
            setChatMessages(prev => [...prev, {
                sender: 'MetaLink AI',
                message: response.content || 'I do not understand how I can help you.'
            }]);
        } catch (error) {
            console.error('Content Assistant request failed:', error);
            setChatMessages(prev => [...prev, {
                sender: 'MetaLink AI',
                message: 'An error occurred, please try again.'
            }]);
        }
    };

    const renderSolvedQuizContent = () => {
        return (
            <div className="solvequiz-layout">
                <div className="solvequiz-content">
                    <div className="solvequiz-header">
                        <h1>{quizData.title}</h1>
                        <div className="solvequiz-solved-banner">
                            <span>This quiz has been solved before</span>
                            <button
                                className="solvequiz-back-button"
                                onClick={() => navigate(`/user/${studentId}/test-bank`)}
                            >
                                Return to Test Bank
                            </button>
                        </div>
                    </div>

                    <div className="solvequiz-questions-container">
                        {questions.map((q) => {
                            const selectedOption = q.options.find(opt => opt.isSelected);
                            const correctOption = q.options.find(opt => opt.isCorrect);
                            let statusMessage = '';
                            let statusClass = '';

                            if (!selectedOption) {
                                statusMessage = `You left this question blank. The correct answer is: ${correctOption?.id.toUpperCase() || 'Belirsiz'}`;
                                statusClass = 'solvequiz-status-empty';
                            } else if (selectedOption.isCorrect) {
                                statusMessage = 'You answered correctly!';
                                statusClass = 'solvequiz-status-correct';
                            } else {
                                statusMessage = `You answered incorrectly. The correct answer is: ${correctOption?.id.toUpperCase() || 'Belirsiz'}`;
                                statusClass = 'solvequiz-status-incorrect';
                            }

                            return (
                                <div key={q.id} className="solvequiz-question-item">
                                    <h3 className="solvequiz-question-text">{q.id}. {q.question}</h3>
                                    <div className="solvequiz-options-container">
                                        {q.options.map((option) => (
                                            <div
                                                key={option.id}
                                                className={`solvequiz-option 
                                                    ${option.isSelected ? 'solvequiz-selected' : ''} 
                                                    ${option.isCorrect ? 'solvequiz-correct' : (option.isSelected && !option.isCorrect) ? 'solvequiz-incorrect' : ''}`}
                                            >
                                                <span className="solvequiz-option-label">{option.id}</span>
                                                <span className="solvequiz-option-text">{option.text}</span>
                                                <span className="solvequiz-status-icon">
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
                                    <div className={`solvequiz-status-message ${statusClass}`}>
                                        {statusMessage}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="solvequiz-side-panel">
                    <div className="solvequiz-chat-box">
                        <div className="solvequiz-chat-header">
                            <h2>Quiz Assistant</h2>
                        </div>
                        <div className="solvequiz-chat-messages" ref={chatContainerRef}>
                            {chatMessages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`solvequiz-message ${msg.sender === 'User' ? 'solvequiz-user-message' : 'solvequiz-ai-message'}`}
                                >
                                    <span className="solvequiz-sender">{msg.sender}:</span>
                                    {msg.sender === 'MetaLink AI' ? (
                                        <ReactMarkdown>{msg.message}</ReactMarkdown>
                                    ) : (
                                        <p>{msg.message}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="solvequiz-chat-input">
                            <input
                                type="text"
                                value={userMessage}
                                onChange={(e) => setUserMessage(e.target.value)}
                                placeholder="Write your questions here..."
                            />
                            <button type="submit">Send</button>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="solvequiz-main">
            <SecondNavbar visibleButtons={["lectures", "avatar", "profile", "logout"]} />

            {!alreadySolved && showStartPopup && !errorMessage && (
                <div className="solvequiz-popup-overlay">
                    <div className="solvequiz-popup-content">
                        <h2>Are You Ready to Start the Quiz?</h2>
                        <p>This quiz consists of {questions.length} questions and you have {Math.floor(timeRemaining / 60)} minutes.</p>
                        <div className="solvequiz-popup-buttons">
                            <button className="solvequiz-popup-button solvequiz-cancel" onClick={() => navigate(`/user/${studentId}/test-bank`)}>
                                Cancel
                            </button>
                            <button className="solvequiz-popup-button solvequiz-start" onClick={startQuiz}>
                                Start
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!alreadySolved && showEndPopup && (
                <div className="solvequiz-popup-overlay">
                    <div className="solvequiz-popup-content">
                        <h2>Quiz Completed!</h2>
                        <p>You have completed the quiz. Thank you.</p>
                        <div className="solvequiz-popup-buttons">
                            <button className="solvequiz-popup-button solvequiz-cancel" onClick={closeEndPopup}>
                                Return to Test Bank
                            </button>
                            <button className="solvequiz-popup-button solvequiz-start" onClick={viewQuizResults}>
                                View Results
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!alreadySolved && showConfirmLeavePopup && (
                <div className="solvequiz-popup-overlay">
                    <div className="solvequiz-popup-content">
                        <h2>Minimum Question Requirement</h2>
                        <p>You must answer at least 5 questions to complete the quiz.</p>
                        <div className="solvequiz-popup-buttons">
                            <button className="solvequiz-popup-button solvequiz-cancel" onClick={cancelLeaveQuiz}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="solvequiz-container">
                <div className={`solvequiz-main-content ${!alreadySolved && showStartPopup ? 'solvequiz-blurred' : ''}`}>
                    {isLoading ? (
                        <div className="solvequiz-loading-message">
                            <HamsterWheel />
                            <p>Quiz Loading...</p>
                        </div>
                    ) : errorMessage ? (
                        <div className="solvequiz-error-message">
                            <h2>{errorMessage}</h2>
                            <button className="solvequiz-popup-button solvequiz-cancel" onClick={() => navigate(`/user/${studentId}/test-bank`)}>
                                Return to Test Bank
                            </button>
                        </div>
                    ) : quizData ? (
                        alreadySolved ? (
                            renderSolvedQuizContent()
                        ) : (
                            <div className="solvequiz-layout">
                                <div className="solvequiz-mobile-timer-section">
                                    <div className="solvequiz-timer-section">
                                        <h2>Remaining Time</h2>
                                        <div className="solvequiz-timer">{formatTime(timeRemaining)}</div>
                                    </div>
                                </div>

                                <div className="solvequiz-content">
                                    <div className="solvequiz-header">
                                        <h1>{quizData.title}</h1>
                                    </div>

                                    <div className="solvequiz-questions-container">
                                        {questions.map((q) => (
                                            <div key={q.id} className="solvequiz-question-item">
                                                <h3 className="solvequiz-question-text">{q.id}. {q.question}</h3>
                                                <div className="solvequiz-options-container">
                                                    {q.options.map((option) => (
                                                        <div
                                                            key={option.id}
                                                            className={`solvequiz-option ${answers[q.id] === option.id ? 'solvequiz-selected' : ''}`}
                                                            onClick={() => handleOptionSelect(q.id, option.id)}
                                                        >
                                                            <span className="solvequiz-option-label">{option.id}</span>
                                                            <span className="solvequiz-option-text">{option.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="solvequiz-side-panel">
                                    <div className="solvequiz-desktop-timer-section">
                                        <div className="solvequiz-timer-section">
                                            <h2>Remaining Time</h2>
                                            <div className="solvequiz-timer">{formatTime(timeRemaining)}</div>
                                        </div>
                                    </div>

                                    <div className="solvequiz-answer-sheet-section">
                                        <h2>Answer Sheet</h2>
                                        <div className="solvequiz-answer-grid">
                                            {questions.map((q) => (
                                                <div key={q.id} className="solvequiz-answer-item">
                                                    <span className="solvequiz-question-number">{q.id}</span>
                                                    <div className="solvequiz-option-indicators">
                                                        {q.options.map((option) => (
                                                            <div
                                                                key={option.id}
                                                                className={`solvequiz-indicator ${answers[q.id] === option.id ? 'solvequiz-marked' : ''}`}
                                                            >
                                                                {option.id}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="solvequiz-submit-section">
                                        <button
                                            className="solvequiz-submit-button"
                                            onClick={submitQuiz}
                                            disabled={quizFinished}
                                        >
                                            Finish Quiz
                                        </button>
                                        {errorMessage && <div className="solvequiz-error-message">{errorMessage}</div>}
                                        <div className="solvequiz-status">
                                            Answered questions: {Object.keys(answers).length} / {questions.length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="solvequiz-no-data">No quiz data found.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SolveQuiz;
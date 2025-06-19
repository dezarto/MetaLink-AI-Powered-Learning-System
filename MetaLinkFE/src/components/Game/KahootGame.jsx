import React, { useState, useEffect, useRef } from 'react';
import './KahootGame.css';
import { xpProcess } from '../../services/student-api.js';

const KahootGame = ({ gameStatus, gameMode, hubConnection, onBack, studentId, sessionId, isInviter }) => {
  const [gameState, setGameState] = useState('lobby');
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [options, setOptions] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [results, setResults] = useState([]);
  const [finalScores, setFinalScores] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const answerStartTimeRef = useRef(null);
  const timerRef = useRef(null);
  const sessionIdRef = useRef(sessionId);
  const [isLoading, setIsLoading] = useState(false);
  const questionIndexRef = useRef(0); // Track the latest question index

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    if (!currentPlayer && studentId) {
      const newPlayer = { id: parseInt(studentId), score: 0 };
      setCurrentPlayer(newPlayer);
      setPlayers([newPlayer]);
      setGameState('lobby');
    }
  }, [studentId, currentPlayer]);

  useEffect(() => {
    if (!hubConnection) return;

    hubConnection.on('InviteAccepted', (data) => {
      setPlayers((prev) => [...prev, { id: data.inviteeId, score: 0 }]);
    });

    hubConnection.on('GameStarted', () => {
      setIsLoading(true);
    });

    hubConnection.on('QuestionStarted', (data) => {
      setIsLoading(false);
      setCurrentQuestion({ text: data.questionText });
      setCurrentQuestionIndex(data.questionIndex);
      questionIndexRef.current = data.questionIndex; // Update the latest question index
      setOptions([]);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
      setShowOptions(false);
      setCorrectAnswer(null);
      setGameState('question');
      setTimeLeft(5);

      // Clear any existing timeout to prevent stale submissions
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        setShowOptions(true);
        setTimeLeft(10);
        answerStartTimeRef.current = Date.now();

        timerRef.current = setTimeout(() => {
          if (!answerSubmitted && questionIndexRef.current === data.questionIndex) {
            handleAnswerSelect(-1, questionIndexRef.current);
          }
        }, 10000);
      }, 5000);
    });

    hubConnection.on('OptionsShown', (data) => {
      setOptions(data.options);
    });

    hubConnection.on('QuestionEnded', (data) => {
      clearTimeout(timerRef.current); // Clear timeout to prevent stale submissions
      setResults(data.results);
      setCorrectAnswer(data.correctAnswer);
      setGameState('results');
      console.log('QuestionEnded results:', data.results, 'CorrectAnswer:', data.correctAnswer, 'Current studentId:', studentId);
      if (!data.results.some(r => parseInt(r.studentId) === parseInt(studentId))) {
        showNotification('Your data is missing in the leaderboard. Please restart the game.');
      }
    });

    hubConnection.on('QuizEnded', (data) => {
      clearTimeout(timerRef.current); // Clear timeout to ensure no further submissions
      setFinalScores(data.finalScores);
      setGameState('finalResults');
      console.log('QuizEnded finalScores:', data.finalScores, 'Current studentId:', studentId);

      // Award XP based on the player's final score
      if (Object.keys(data.finalScores).includes(studentId.toString())) {
        awardXP(data.finalScores[studentId]);
      } else {
        showNotification('Your data is missing in the final scores. Please restart the game.');
      }
    });

    hubConnection.on('InviteError', (data) => {
      showNotification(data.message || 'An error occurred.');
    });

    hubConnection.on('AnswerReceived', (data) => {
      if (data.studentId === parseInt(studentId) && data.questionIndex === questionIndexRef.current) {
        console.log(`Answer confirmed for studentId: ${studentId}, questionIndex: ${data.questionIndex}`);
        showNotification('Your answer has been received, waiting for other players.');
      }
    });

    return () => {
      hubConnection.off('InviteAccepted');
      hubConnection.off('QuestionStarted');
      hubConnection.off('OptionsShown');
      hubConnection.off('QuestionEnded');
      hubConnection.off('QuizEnded');
      hubConnection.off('InviteError');
      hubConnection.off('AnswerReceived');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [hubConnection, studentId]);

  useEffect(() => {
    if (timeLeft > 0) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timeLeft]);

  const awardXP = async (earnedScore) => {
    const xpRequest = {
      studentId: parseInt(studentId),
      gameId: 5, // Assuming gameId 5 for Kahoot based on console logs
      amount: earnedScore,
      xpType: 1,
      description: 'Completed Kahoot Quiz',
    };
    console.log(`[awardXP] Sending XP request: ${JSON.stringify(xpRequest)}`);
    try {
      const earnedAmount = await xpProcess(xpRequest);
      console.log(`[awardXP] XP awarded successfully: ${earnedAmount}`);
      showNotification(`Earned ${earnedAmount} XP for completing the quiz!`);
    } catch (error) {
      console.error('[awardXP] Error awarding XP:', error);
      console.error('[awardXP] Error details:', error.response || error.message);
      showNotification(`Failed to award XP: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAnswerSelect = async (answerIndex, questionIndex = currentQuestionIndex) => {
    console.log('handleAnswerSelect called with:', { sessionId: sessionIdRef.current, answerIndex, questionIndex, currentQuestionIndex, studentId });
    if (answerSubmitted || questionIndex !== questionIndexRef.current) {
      console.log('Answer submission skipped: already submitted or outdated question index', { questionIndex, current: questionIndexRef.current });
      return;
    }
    setSelectedAnswer(answerIndex);
    setAnswerSubmitted(true);
    clearTimeout(timerRef.current);

    const timeTaken = answerStartTimeRef.current ? (Date.now() - answerStartTimeRef.current) / 1000 : 10;
    const safeAnswerIndex = answerIndex ?? -1;
    try {
      await hubConnection.invoke('SendAnswer', String(sessionIdRef.current), parseInt(studentId), questionIndex, safeAnswerIndex, timeTaken);
      console.log('SendAnswer invoked with:', { sessionId: sessionIdRef.current, studentId, questionIndex, safeAnswerIndex, timeTaken });
    } catch (error) {
      showNotification('Answer could not be sent. Please try again.');
      console.error('Error submitting answer:', error);
      setAnswerSubmitted(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!isInviter) return;
    try {
      await hubConnection.invoke('NextQuestion', sessionId);
    } catch (error) {
      showNotification('Failed to advance to next question');
      console.error('Error advancing question:', error);
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartGame = async () => {
    if (!isInviter) return;
    try {
      await hubConnection.invoke('StartGame', parseInt(studentId), 5, sessionId, 'default');
    } catch (error) {
      showNotification('Failed to start game');
      console.error('Error starting game:', error);
    }
  };

  return (
    <div className="kahoot-game">
      <button className="back-button" onClick={onBack}>
        ← Back to Games
      </button>
      <h2>Kahoot Quiz Game</h2>

      {notification && <div className="notification show">{notification}</div>}

      {isLoading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Game is starting...</p>
        </div>
      )}

      {!isLoading && gameState === 'lobby' && (
        <div className="lobby">
          <div className="player-list">
            <h3>Players ({players.length})</h3>
            {players.map((player) => (
              <div key={player.id} className="player-item">
                User {player.id}
                {player.id === parseInt(studentId) && ' (You)'}
              </div>
            ))}
          </div>
          {isInviter && (
            <button className="start-button" onClick={handleStartGame}>
              Start Game
            </button>
          )}
        </div>
      )}

      {gameState === 'question' && (
        <div className="question-container">
          <div className="question-number">
            Question {currentQuestionIndex + 1} of 5
          </div>
          <div className="timer-bar">
            <div
              className="timer-progress"
              style={{ width: `${(timeLeft / (showOptions ? 10 : 5)) * 100}%` }}
            ></div>
          </div>
          <div className="question-text">{currentQuestion?.text}</div>
          {showOptions && options.length > 0 && (
            <div className="answers-grid">
              {options.map((answer, index) => (
                <button
                  key={index}
                  className={`answer-button ${index === 0 ? 'red' : index === 1 ? 'blue' : index === 2 ? 'yellow' : 'green'
                    } ${selectedAnswer === index ? 'selected' : ''}`}
                  onClick={() => handleAnswerSelect(index, currentQuestionIndex)}
                  disabled={answerSubmitted}
                >
                  {answer}
                </button>
              ))}
            </div>
          )}
          {answerSubmitted && (
            <div className="waiting-message">
              Waiting for other players to answer...
            </div>
          )}
        </div>
      )}

      {gameState === 'results' && (
        <div className="results-container">
          <div className="answer-feedback">
            {results.find((r) => r.studentId === parseInt(studentId))?.isCorrect
              ? 'Correct!'
              : 'Incorrect!'}
          </div>
          <div className="correct-answer">
            Correct answer: {correctAnswer !== null && options.length > correctAnswer ? options[correctAnswer] : 'Unknown'}
          </div>
          <div className="points-earned">
            Your score: {results.find((r) => r.studentId === parseInt(studentId))?.score || 0}
          </div>
          <div className="leaderboard">
            <h3 className="leaderboard-title">Leaderboard</h3>
            {results.length > 0 ? (
              results
                .sort((a, b) => b.score - a.score)
                .map((result, index) => (
                  <div key={result.studentId} className="leaderboard-item">
                    <span>
                      <span className="rank">{index + 1}.</span> User {result.studentId}
                      {parseInt(result.studentId) === parseInt(studentId) && ' (You)'}
                    </span>
                    <span>{result.score} pts</span>
                  </div>
                ))
            ) : (
              <div className="leaderboard-item">No leaderboard data found.</div>
            )}
          </div>
          {isInviter && (
            <button className="next-button" onClick={handleNextQuestion}>
              {currentQuestionIndex < 4 ? 'Next Question' : 'See Final Results'}
            </button>
          )}
        </div>
      )}

      {gameState === 'finalResults' && (
        <div className="final-results">
          <h3>Game Over!</h3>
          <div className="podium">
            {Object.entries(finalScores || {})
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([playerId, score], index) => (
                <div key={playerId} className="podium-place">
                  <div className="podium-name">
                    User {playerId}
                    {parseInt(playerId) === parseInt(studentId) && ' (You)'}
                  </div>
                  <div className="podium-score">{score} pts</div>
                  <div className={`podium-block ${['first-place', 'second-place', 'third-place'][index]}`}>
                    <div className="podium-position">{index + 1}</div>
                  </div>
                </div>
              ))}
          </div>
          <div className="leaderboard">
            <h3 className="leaderboard-title">Final Scores</h3>
            {Object.keys(finalScores || {}).length > 0 ? (
              Object.entries(finalScores)
                .sort(([, a], [, b]) => b - a)
                .map(([playerId, score], index) => (
                  <div key={playerId} className="leaderboard-item">
                    <span>
                      <span className="rank">{index + 1}.</span> User {playerId}
                      {parseInt(playerId) === parseInt(studentId) && ' (You)'}
                    </span>
                    <span>{score} pts</span>
                  </div>
                ))
            ) : (
              <div className="leaderboard-item">No leaderboard data found.</div>
            )}
          </div>
          <p>Invite your friend to play again</p>
        </div>
      )}
    </div>
  );
};

export default KahootGame;
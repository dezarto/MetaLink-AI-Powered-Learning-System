import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './BalloonPop.css';
import { xpProcess } from '../../services/student-api.js';

const BalloonPop = ({ onBack }) => {
  const { studentId } = useParams();
  const [balloons, setBalloons] = useState([]);
  const [score, setScore] = useState(0);
  const [xpEarned, setXPEarned] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [notification, setNotification] = useState(null);
  const gameAreaRef = useRef(null);
  const timerRef = useRef(null);
  const balloonIntervalRef = useRef(null);
  const animationFrameRef = useRef(null);

  const colors = ['#ff4d4d', '#4d79ff', '#4dff4d', '#ffff4d', '#9f4dff', '#ffb84d'];

  const difficultySettings = {
    easy: {
      interval: 1200,
      speedDistribution: { slow: 0.8, fast: 0.2 },
      slowSpeed: [1, 2],
      fastSpeed: [3, 4],
    },
    medium: {
      interval: 800,
      speedDistribution: { slow: 0.6, fast: 0.4 },
      slowSpeed: [2, 3],
      fastSpeed: [4, 5],
    },
    hard: {
      interval: 500,
      speedDistribution: { slow: 0.4, fast: 0.6 },
      slowSpeed: [3, 4],
      fastSpeed: [5, 6],
    },
  };

  const startGame = () => {
    setScore(0);
    setXPEarned(0);
    setTimeLeft(30);
    setBalloons([]);
    setGameActive(true);
    setGameOver(false);
    setNotification(null);
  };

  const createBalloon = () => {
    if (!gameAreaRef.current) {
      console.warn('Game area not ready for balloon creation');
      return;
    }

    const gameArea = gameAreaRef.current.getBoundingClientRect();
    const size = Math.floor(Math.random() * 40) + 40;
    const maxLeft = gameArea.width - size;

    const settings = difficultySettings[difficulty];
    const isFast = Math.random() < settings.speedDistribution.fast;
    const speedRange = isFast ? settings.fastSpeed : settings.slowSpeed;
    const speed = Math.random() * (speedRange[1] - speedRange[0]) + speedRange[0];

    const newBalloon = {
      id: Date.now(),
      x: Math.floor(Math.random() * maxLeft),
      y: gameArea.height + size,
      size: size,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: speed,
    };

    setBalloons((prev) => [...prev, newBalloon]);
    console.log('Created balloon:', newBalloon);
  };

  const updateBalloons = () => {
    setBalloons((prev) =>
      prev
        .map((balloon) => ({
          ...balloon,
          y: balloon.y - balloon.speed,
        }))
        .filter((balloon) => balloon.y + balloon.size > 0)
    );
  };

  const popBalloon = (id) => {
    setBalloons((prev) => prev.filter((balloon) => balloon.id !== id));
    setScore((prev) => prev + 1);
    setXPEarned((prev) => prev + 1);
  };

  const handleDifficultyChange = (e) => {
    setDifficulty(e.target.value);
  };

  const endGame = async () => {
    setGameActive(false);
    setGameOver(true);
    if (xpEarned > 0) {
      try {
        const xpRequest = {
          studentId: parseInt(studentId),
          gameId: 8,
          amount: xpEarned,
          xpType: 1,
          description: 'Completed BalloonPop'
        };
        const earnedAmount = await xpProcess(xpRequest);
        setTotalXP((prev) => prev + earnedAmount);
        setNotification(`You earned ${earnedAmount} XP!`);
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        console.error('Error awarding XP:', error);
        setNotification('Failed to award XP.');
        setTimeout(() => setNotification(null), 3000);
      }
    }
  };

  useEffect(() => {
    if (gameActive) {
      // Delay balloon creation to ensure game area is rendered
      setTimeout(() => {
        balloonIntervalRef.current = setInterval(() => {
          createBalloon();
        }, difficultySettings[difficulty].interval);
      }, 100);

      // Smooth balloon movement with requestAnimationFrame
      const animate = () => {
        if (gameActive) {
          updateBalloons();
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      animationFrameRef.current = requestAnimationFrame(animate);

      // Timer countdown
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            clearInterval(balloonIntervalRef.current);
            cancelAnimationFrame(animationFrameRef.current);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(balloonIntervalRef.current);
      clearInterval(timerRef.current);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameActive, difficulty, xpEarned, studentId]);

  return (
    <div className="balloon-pop">
      {notification && <div className="xp-notification">{notification}</div>}

      <h2>Balloon Pop Challenge</h2>

      {!gameActive && !gameOver && (
        <div className="balloon-start">
          <p>Pop as many balloons as you can in 30 seconds!</p>
          <div className="difficulty-selector">
            <label>Zorluk: </label>
            <select value={difficulty} onChange={handleDifficultyChange}>
              <option value="easy">Kolay (Yavaş balonlar)</option>
              <option value="medium">Orta (Karışık hızlar)</option>
              <option value="hard">Zor (Hızlı balonlar)</option>
            </select>
          </div>
          <button className="start-button" onClick={startGame}>Start Game</button>
        </div>
      )}

      {gameActive && (
        <div className="balloon-game-container">
          <div className="balloon-stats">
            <div className="score">Score: {score}</div>
            <div className="timer">Time: {timeLeft}s</div>
            <div className="xp">Total XP: {totalXP}</div>
          </div>

          <div className="balloon-game-area" ref={gameAreaRef}>
            {balloons.map((balloon) => (
              <div
                key={balloon.id}
                className="balloon"
                style={{
                  left: `${balloon.x}px`,
                  bottom: `${balloon.y}px`,
                  width: `${balloon.size}px`,
                  height: `${balloon.size * 1.2}px`,
                  backgroundColor: balloon.color,
                }}
                onClick={() => popBalloon(balloon.id)}
              >
                <div className="balloon-string"></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {gameOver && (
        <div className="game-over">
          <h3>Game Over!</h3>
          <p>You popped {score} balloons!</p>
          <p>Earned {xpEarned} XP this game!</p>
          <p>Total XP: {totalXP}</p>
          <div className="difficulty-selector">
            <label>Zorluk: </label>
            <select value={difficulty} onChange={handleDifficultyChange}>
              <option value="easy">Kolay (Yavaş balonlar)</option>
              <option value="medium">Orta (Karışık hızlar)</option>
              <option value="hard">Zor (Hızlı balonlar)</option>
            </select>
          </div>
          <button className="play-again-button" onClick={startGame}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default BalloonPop;
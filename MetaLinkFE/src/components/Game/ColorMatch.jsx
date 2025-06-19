import React, { useState, useEffect, useRef } from 'react';
import './ColorMatch.css';
import { xpProcess } from '../../services/student-api.js';
import { useParams } from 'react-router-dom';

const ColorMatch = ({ onBack }) => {
  const { studentId } = useParams();
  const [targetColor, setTargetColor] = useState('');
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState('easy');
  const [notification, setNotification] = useState(null);
  const [answeredColors, setAnsweredColors] = useState([]);
  const timerRef = useRef(null);

  const colorSets = {
    easy: [
      { name: 'Red', hex: '#ff4d4d' },
      { name: 'Blue', hex: '#4d79ff' },
      { name: 'Green', hex: '#4dff4d' },
      { name: 'Yellow', hex: '#ffff4d' },
      { name: 'Purple', hex: '#9f4dff' },
      { name: 'Orange', hex: '#ffb84d' },
    ],
    medium: [
      { name: 'Red', hex: '#ff4d4d' },
      { name: 'Blue', hex: '#4d79ff' },
      { name: 'Green', hex: '#4dff4d' },
      { name: 'Yellow', hex: '#ffff4d' },
      { name: 'Purple', hex: '#9f4dff' },
      { name: 'Orange', hex: '#ffb84d' },
      { name: 'Pink', hex: '#ff4da6' },
      { name: 'Cyan', hex: '#4dffff' },
      { name: 'Magenta', hex: '#ff4dff' },
      { name: 'Lime', hex: '#bfff4d' },
    ],
    hard: [
      { name: 'Red', hex: '#ff4d4d' },
      { name: 'Blue', hex: '#4d79ff' },
      { name: 'Green', hex: '#4dff4d' },
      { name: 'Yellow', hex: '#ffff4d' },
      { name: 'Purple', hex: '#9f4dff' },
      { name: 'Orange', hex: '#ffb84d' },
      { name: 'Pink', hex: '#ff4da6' },
      { name: 'Cyan', hex: '#4dffff' },
      { name: 'Magenta', hex: '#ff4dff' },
      { name: 'Lime', hex: '#bfff4d' },
      { name: 'Teal', hex: '#4dbfb9' },
      { name: 'Indigo', hex: '#4d4d99' },
      { name: 'Violet', hex: '#b94dff' },
      { name: 'Olive', hex: '#99b94d' },
    ],
  };

  const difficultySettings = {
    easy: { time: 30, colors: 6 },
    medium: { time: 25, colors: 10 },
    hard: { time: 20, colors: 14 },
  };

  const startGame = async () => {
    setScore(0);
    setTimeLeft(difficultySettings[difficulty].time);
    setGameActive(true);
    setGameOver(false);
    setNotification(null);
    setAnsweredColors([]);
    generateNewRound();
  };

  const stopGame = async (completed = false) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setGameActive(false);
    setGameOver(true);

    // XP kazanımı: score kadar XP, oyun tamamlanmışsa veya süre bitmişse
    if (score > 0) {
      try {
        const xpRequest = {
          studentId: parseInt(studentId),
          gameId: 1, // Assuming 1 for ColorMatch
          amount: score,
          xpType: 1, // EarnXP
          description: `Completed ColorMatch game with ${score} correct answers`
        };
        const earnedAmount = await xpProcess(xpRequest);
        setNotification(`Tebrikler! ${earnedAmount} XP kazandınız!`);
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        console.error('Error awarding XP:', error);
        setNotification('XP kazanılamadı. Bir hata oluştu.');
        setTimeout(() => setNotification(null), 3000);
      }
    } else {
      setNotification('Hiç doğru cevap vermediniz, XP kazanılmadı.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const generateNewRound = () => {
    const colors = colorSets[difficulty];
    const unansweredColors = colors.filter(
      (color) => !answeredColors.includes(color.hex)
    );

    // Henüz cevaplanmamış renklerden rastgele bir hedef seç
    const targetIndex = Math.floor(Math.random() * unansweredColors.length);
    const target = unansweredColors[targetIndex] || colors[0]; // Fallback: eğer hata olursa ilk renk
    setTargetColor(target);

    // Yanlış seçenekler, tüm renk setinden rastgele seçilir (tekrar olabilir)
    const wrongColors = colors
      .filter((color) => color.hex !== target.hex)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const allOptions = [target, ...wrongColors].sort(
      () => 0.5 - Math.random()
    );
    setOptions(allOptions);
  };

  const handleColorSelect = (selected) => {
    if (!gameActive) return;

    const maxAnswers = difficultySettings[difficulty].colors;

    // Eğer zaten maksimum cevap sayısına ulaşıldıysa, oyunu bitir
    if (answeredColors.length >= maxAnswers) {
      stopGame(true);
      return;
    }

    // Doğruysa skoru artır
    if (selected.hex === targetColor.hex) {
      setScore(score + 1);
    }

    // Rengi cevaplanmış olarak işaretle
    setAnsweredColors([...answeredColors, targetColor.hex]);

    // Eğer bu cevapla maksimum sayıya ulaşıldıysa, oyunu bitir
    if (answeredColors.length + 1 >= maxAnswers) {
      stopGame(true);
    } else {
      // Yeni tur başlat
      generateNewRound();
    }
  };

  useEffect(() => {
    if (gameActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            stopGame(false); // Süre bitti
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameActive]);

  return (
    <div className="color-match">
      <button className="back-button" onClick={onBack}>
        ← Back to Games
      </button>

      <h2>Color Match Challenge</h2>

      {notification && (
        <div className="xp-notification">
          {notification}
        </div>
      )}

      {!gameActive && !gameOver && (
        <div className="color-match-start">
          <p>
            Match all {difficultySettings[difficulty].colors} colors with their
            correct names before time runs out!
          </p>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="difficulty-select"
          >
            <option value="easy">Easy (6 colors)</option>
            <option value="medium">Medium (10 colors)</option>
            <option value="hard">Hard (14 colors)</option>
          </select>
          <button className="start-button" onClick={startGame}>
            Start Game
          </button>
        </div>
      )}

      {gameActive && (
        <div className="color-match-game">
          <div className="color-match-stats">
            <div className="score">Score: {score}</div>
            <div className="timer">Time: {timeLeft}s</div>
            <div className="difficulty">
              Difficulty: {difficulty} ({difficultySettings[difficulty].colors}{' '}
              colors)
            </div>
          </div>

          <div className="color-target" style={{ backgroundColor: targetColor.hex }}>
            <p>Match this color</p>
          </div>

          <div className="color-options">
            {options.map((color, index) => (
              <button
                key={index}
                className="color-option"
                onClick={() => handleColorSelect(color)}
              >
                {color.name}
              </button>
            ))}
          </div>

          <button className="stop-button" onClick={() => stopGame(false)}>
            Stop Game
          </button>
        </div>
      )}

      {gameOver && (
        <div className="game-over">
          <h3>
            {answeredColors.length >= difficultySettings[difficulty].colors
              ? 'Game Completed!'
              : 'Time’s Up!'}
          </h3>
          <p>Your final score: {score}</p>
          <p>XP Earned: {score}</p>
          <p>Difficulty: {difficulty}</p>
          <p>Time Remaining: {timeLeft}s</p>
          <button className="play-again-button" onClick={startGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default ColorMatch;
import React, { useState, useEffect, useRef } from 'react';
import './MemoryGame.css';
import { useParams } from 'react-router-dom';
import { xpProcess, getTotalXP } from '../../services/student-api.js';

const MemoryGame = ({ gameStatus, gameMode, hubConnection, onBack, initialCards, gameMove, initialDifficulty }) => {
  const { studentId } = useParams();
  const [cards, setCards] = useState([]);
  const [playerFlipped, setPlayerFlipped] = useState([]);
  const [playerSolved, setPlayerSolved] = useState([]);
  const [opponentFlipped, setOpponentFlipped] = useState([]);
  const [opponentSolved, setOpponentSolved] = useState([]);
  const [playerDisabled, setPlayerDisabled] = useState(false);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [difficulty, setDifficulty] = useState(initialDifficulty || '4x4');
  const [notification, setNotification] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [isOpponentBoardBlurred, setIsOpponentBoardBlurred] = useState(true);
  const [totalXP, setTotalXP] = useState(0);
  const timerRef = useRef(null);
  const blurTimerRef = useRef(null);

  const emojiSets = {
    '2x2': ['🐶', '🐱'],
    '3x2': ['🐶', '🐱', '🐭'],
    '4x4': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'],
    '5x4': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🦁', '🐯'],
    '6x6': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🦁', '🐯', '🐨', '🐵', '🐷', '🐸', '🐴', '🦒', '🦓', '🦒'],
  };

  const difficultySettings = {
    '2x2': { time: 120, xpPerMatch: 2, rows: 2, cols: 2 },
    '3x2': { time: 150, xpPerMatch: 4, rows: 3, cols: 2 },
    '4x4': { time: 240, xpPerMatch: 8, rows: 4, cols: 4 },
    '5x4': { time: 300, xpPerMatch: 12, rows: 5, cols: 4 },
    '6x6': { time: 360, xpPerMatch: 16, rows: 6, cols: 6 },
  };

  useEffect(() => {
    const fetchTotalXP = async () => {
      try {
        const xp = await getTotalXP(studentId);
        setTotalXP(xp);
      } catch (error) {
        console.error('Error fetching total XP:', error);
        setNotification('XP could not be loaded.');
        setTimeout(() => setNotification(null), 3000);
      }
    };
    fetchTotalXP();
  }, [studentId]);

  useEffect(() => {
    if (hubConnection) {
      hubConnection.on('ReceiveMove', (data) => {
        let moveData = data.moveData;
        if (typeof moveData === 'string') {
          try {
            moveData = JSON.parse(moveData);
          } catch (err) {
            console.error("JSON parse error:", err);
            return;
          }
        }

        if (moveData?.type === 'flip' && moveData.playerId !== Number(studentId)) {
          handleOpponentFlip(moveData.cardId);
        } else if (moveData.type === 'match' && moveData.playerId !== Number(studentId)) {
          handleOpponentMatch(moveData.cardIds);
        }
      });

      hubConnection.on('GameEnded', (data) => {
        setGameActive(false);
        setGameOver(true);
        setGameWon(data.IsWinner && data.StudentId === Number(studentId));
      });

      hubConnection.on('PlayerDisconnected', (data) => {
        setGameActive(false);
        setGameOver(true);
        setGameWon(false);
        setNotification(data.message || `Player ${data.studentId} disconnected, game is being terminated.`);
        setTimeout(() => setNotification(null), 3000);
      });

      hubConnection.on('BlurUnlocked', (data) => {
        setNotification(`Player ${data.studentId} unlocked blur, be careful!`);
        setTimeout(() => setNotification(null), 3000);
      });
    }
  }, [hubConnection]);

  useEffect(() => {
    if (gameMove) {
      let moveData = gameMove.moveData;
      if (typeof moveData === 'string') {
        try {
          moveData = JSON.parse(moveData);
        } catch (err) {
          console.error("JSON parse error:", err);
          return;
        }
      }

      if (moveData.type === 'flip' && moveData.playerId !== Number(studentId)) {
        handleOpponentFlip(moveData.cardId);
      } else if (moveData.type === 'match' && moveData.playerId !== Number(studentId)) {
        handleOpponentMatch(moveData.cardIds);
      }
    }
  }, [gameMove]);

  useEffect(() => {
    if (gameStatus === 'playing' && !gameActive) {
      startGame();
    } else if (gameStatus === 'ended') {
      setGameActive(false);
      setGameOver(true);
      setGameWon(false);
    }
  }, [gameStatus]);

  useEffect(() => {
    if (gameActive) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameActive(false);
            setGameOver(true);
            endGame(false);
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

  const handleUnlockBlur = async () => {
    if (totalXP < 20) {
      setNotification('Insufficient XP! At least 20 XP is required.');
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    try {
      const xpRequest = {
        studentId: parseInt(studentId),
        gameId: 6,
        amount: 20,
        xpType: 2, // SpendXP
        description: 'Unlocked opponent board blur in MemoryGame'
      };
      const spentAmount = await xpProcess(xpRequest);
      if (spentAmount) {
        setTotalXP((prev) => prev - spentAmount);
        setIsOpponentBoardBlurred(false);
        setNotification('Blur unlocked! You can see the opponent’s board for 20 seconds.');
        setTimeout(() => setNotification(null), 3000);

        if (hubConnection) {
          await hubConnection.invoke('UnlockBlur', Number(studentId));
        }

        blurTimerRef.current = setTimeout(() => {
          setIsOpponentBoardBlurred(true);
        }, 5000);
      }
    } catch (error) {
      console.error('Error unlocking blur:', error);
      setNotification('XP could not be spent. Insufficient XP or an error occurred.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const startGame = () => {
    setMoves(0);
    setTimeLeft(difficultySettings[difficulty].time);
    setGameActive(true);
    setGameOver(false);
    setGameWon(false);
    setNotification(null);
    setPlayerScore(0);
    setOpponentScore(0);
    setPlayerFlipped([]);
    setPlayerSolved([]);
    setOpponentFlipped([]);
    setOpponentSolved([]);
    setPlayerDisabled(false);
    setIsOpponentBoardBlurred(true);
    initGame(gameMode === 'multiple' ? initialCards : null);
  };

  const initGame = (initialGameState = null) => {
    let emojis = emojiSets[difficulty];
    let duplicatedEmojis;
    if (initialGameState) {
      duplicatedEmojis = initialGameState;
    } else {
      duplicatedEmojis = [...emojis, ...emojis];
      duplicatedEmojis = shuffleArray(duplicatedEmojis);
    }

    setCards(
      duplicatedEmojis.map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        solved: false,
      }))
    );
  };

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleClick = async (id) => {
    if (!gameActive || playerDisabled || playerFlipped.includes(id) || playerSolved.includes(id)) return;

    setPlayerFlipped([...playerFlipped, id]);
    setMoves(moves + 1);

    if (hubConnection && gameMode === 'multiple') {
      const moveData = JSON.stringify({ type: 'flip', cardId: id, playerId: Number(studentId) });
      console.log("Sending move:", moveData);
      await hubConnection.invoke('SendMove', Number(studentId), 6, moveData);
    }

    const newFlipped = [...playerFlipped, id];
    if (newFlipped.length === 2) {
      setPlayerDisabled(true);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        setPlayerSolved([...playerSolved, first, second]);
        setPlayerScore((prev) => prev + 1);
        setPlayerFlipped([]);
        setPlayerDisabled(false);

        if (hubConnection && gameMode === 'multiple') {
          const moveData = JSON.stringify({ type: 'match', cardIds: [first, second], playerId: Number(studentId) });
          console.log("Sending match move:", moveData);
          await hubConnection.invoke('SendMove', Number(studentId), 6, moveData);
        }

        if (playerSolved.length + 2 === cards.length) {
          setGameWon(true);
          setGameActive(false);
          setGameOver(true);
          awardXP(true);
          if (hubConnection) {
            hubConnection.invoke('EndGame', Number(studentId), 6, true, moves + 1, difficulty);
          }
        }
      } else {
        setTimeout(() => {
          setPlayerFlipped([]);
          setPlayerDisabled(false);
        }, 1000);
      }
    }
  };

  const handleOpponentFlip = (cardId) => {
    if (!gameActive || opponentFlipped.includes(cardId) || opponentSolved.includes(cardId)) {
      console.warn(`Opponent flip ignored: cardId=${cardId}, gameActive=${gameActive}`);
      return;
    }

    setOpponentFlipped((prev) => {
      const newFlipped = [...prev, cardId];
      console.log("Opponent flipped cards:", newFlipped);

      if (newFlipped.length === 2) {
        setTimeout(() => {
          setOpponentFlipped([]);
        }, 1000);
      }

      return newFlipped;
    });
  };

  const handleOpponentMatch = (cardIds) => {
    if (!gameActive) {
      console.warn("Opponent match ignored: game is not active");
      return;
    }

    setOpponentSolved((prev) => {
      const newSolved = [...prev, ...cardIds];
      console.log("Opponent solved cards:", newSolved);
      return newSolved;
    });
    setOpponentScore((prev) => prev + 1);
    setOpponentFlipped([]);

    if (opponentSolved.length + cardIds.length === cards.length) {
      setGameWon(false);
      setGameActive(false);
      setGameOver(true);
      awardXP(false);
      if (hubConnection) {
        hubConnection.invoke('EndGame', Number(studentId), 6, false, moves, difficulty);
      }
    }
  };

  const awardXP = async (isWinner) => {
    if (isWinner) {
      const numMatches = emojiSets[difficulty].length;
      const xpEarned = numMatches * difficultySettings[difficulty].xpPerMatch;
      try {
        const xpRequest = {
          studentId: parseInt(studentId),
          gameId: 6,
          amount: xpEarned,
          xpType: 1, // EarnXP
          description: 'Completed MemoryGame'
        };
        const earnedAmount = await xpProcess(xpRequest);
        setTotalXP((prev) => prev + earnedAmount);
        setNotification(`Congratulations! You earned ${earnedAmount} XP!`);
        setTimeout(() => setNotification(null), 3000);
      } catch (error) {
        console.error('Error awarding XP:', error);
      }
    }
  };

  const stopGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
    }
    setGameActive(false);
    setGameOver(true);
    setPlayerDisabled(true);
    if (hubConnection && gameMode === 'multiple') {
      hubConnection.invoke('EndGame', Number(studentId), 6, false, moves, difficulty).catch((err) => {
        console.error('Error ending game:', err);
      });
    }
  };

  const endGame = (isWinner) => {
    if (hubConnection) {
      hubConnection.invoke('EndGame', Number(studentId), 6, isWinner, moves, difficulty);
    }
  };

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const renderGrid = (isPlayerGrid) => {
    const flipped = isPlayerGrid ? playerFlipped : opponentFlipped;
    const solved = isPlayerGrid ? playerSolved : opponentSolved;

    return (
      <div
        className={`memory-grid grid-${difficulty} ${isPlayerGrid ? 'player-grid' : 'opponent-grid'} ${!isPlayerGrid && isOpponentBoardBlurred ? 'blurred' : ''}`}
        style={{
          gridTemplateColumns: `repeat(${difficultySettings[difficulty].cols}, 1fr)`,
          gridTemplateRows: `repeat(${difficultySettings[difficulty].rows}, 1fr)`,
        }}
      >
        {cards.map((card) => (
          <div
            key={card.id}
            className={`memory-card ${flipped.includes(card.id) || solved.includes(card.id) ? 'flipped' : ''} ${solved.includes(card.id) ? 'solved' : ''}`}
            onClick={isPlayerGrid ? () => handleClick(card.id) : undefined}
          >
            <div className="memory-card-inner">
              <div className="memory-card-front">?</div>
              <div className="memory-card-back">{card.emoji}</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="first-memory-game">
      {notification && (
        <div className="xp-notification">
          {notification}
        </div>
      )}
      <button className="back-button" onClick={onBack}>
        ← Back to Games
      </button>

      {!gameActive && !gameOver && (
        <div className="memory-start">
          {gameMode === 'multiple' ? (
            <div className="multiplayer-invite">
              <p>Find the matching cards!</p>
              <p>Invite a friend to start the game!</p>
              <p>The first to finish wins, good luck!</p>
            </div>
          ) : (
            <>
              <p>Find the matching cards!</p>
              <select
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
                className="difficulty-select"
              >
                <option value="2x2">2x2 (4 Cards)</option>
                <option value="3x2">3x2 (6 Cards)</option>
                <option value="4x4">4x4 (16 Cards)</option>
                <option value="5x4">5x4 (20 Cards)</option>
                <option value="6x6">6x6 (36 Cards)</option>
              </select>
              <button className="start-button" onClick={startGame}>
                Start Game
              </button>
            </>
          )}
        </div>
      )}

      {gameActive && (
        <div className="memory-game">
          <div className="memory-header">
            <div className="memory-stats">
              <p>Moves: {moves}</p>
              <p>Time: {formatTime(timeLeft)}</p>
              <p>Your Score: {playerScore}</p>
              {gameMode === 'multiple' && <p>Opponent Score: {opponentScore}</p>}
              <p>Total XP: {totalXP}</p>
            </div>
            <button className="stop-button" onClick={stopGame}>
              Stop Game
            </button>
          </div>

          {gameMode === 'multiple' ? (
            <div className="memory-multiplayer-container">
              <div className="memory-player-section">
                <h3>Your Board</h3>
                {renderGrid(true)}
              </div>
              <div className="memory-opponent-section">
                <h3>Opponent's Board</h3>
                {renderGrid(false)}
                {isOpponentBoardBlurred && (
                  <button className="unlock-blur-button" onClick={handleUnlockBlur}>
                    Unlock Blur (20 XP)
                  </button>
                )}
              </div>
            </div>
          ) : (
            renderGrid(true)
          )}
        </div>
      )}

      {gameOver && (
        <div className="game-over">
          <h3>{gameWon ? 'Congratulations! 🎉' : 'Game Over!'}</h3>
          <p>Moves: {moves}</p>
          <p>Your Score: {playerScore}</p>
          {gameMode === 'multiple' && <p>Opponent Score: {opponentScore}</p>}
          <p>Time Remaining: {formatTime(timeLeft)}</p>
          {gameWon && (
            <p>You earned a total of {emojiSets[difficulty].length * difficultySettings[difficulty].xpPerMatch} XP!</p>
          )}
          {gameMode !== 'multiple' ? (
            <button className="play-again-button" onClick={startGame}>
              Play Again
            </button>
          ) : (
            <p>Invite your friend to play again</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MemoryGame;
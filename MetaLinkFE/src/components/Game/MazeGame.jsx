import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './MazeGame.css';
import Confetti from 'react-confetti';
import { xpProcess } from '../../services/student-api.js';

const MazeGame = ({ onComplete, onBack }) => {
    const { studentId } = useParams();
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
    const [maze, setMaze] = useState([]);
    const [difficulty, setDifficulty] = useState('easy');
    const [gameStarted, setGameStarted] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [moves, setMoves] = useState(0);
    const [xpEarned, setXPEarned] = useState(0);
    const [notification, setNotification] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [gameOver, setGameOver] = useState(false);
    const gameAreaRef = useRef(null);

    const difficultySettings = {
        easy: { size: 5, xpPerWin: 5, time: 30 },
        medium: { size: 7, xpPerWin: 10, time: 40 },
        hard: { size: 10, xpPerWin: 15, time: 50 },
    };

    const difficultyDisplay = {
        easy: 'Easy (5x5)',
        medium: 'Medium (7x7)',
        hard: 'Hard (10x10)',
    };

    useEffect(() => {
        if (gameAreaRef.current && gameStarted) {
            gameAreaRef.current.focus();
        }
    }, [gameStarted]);

    useEffect(() => {
        if (gameStarted) {
            initGame();
        }
    }, [gameStarted, difficulty]);

    useEffect(() => {
        if (gameStarted && !gameWon && !gameOver) {
            const timer = setInterval(() => {
                setTimeRemaining((prev) => {
                    if (prev <= 0) {
                        clearInterval(timer);
                        setGameOver(true);
                        setNotification('Time is up! Game over.');
                        setTimeout(() => {
                            setNotification(null);
                            setGameStarted(false);
                        }, 3000);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [gameStarted, gameWon, gameOver]);

    useEffect(() => {
        if (gameWon) {
            awardXP();
            onComplete?.();
        }
    }, [gameWon]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!gameStarted || gameWon || gameOver) return;
            const { x, y } = playerPos;
            let newPos = { x, y };

            if (e.key === 'ArrowUp' && y > 0 && maze[y - 1][x] !== 1) {
                newPos = { x, y: y - 1 };
            } else if (
                e.key === 'ArrowDown' &&
                y < maze.length - 1 &&
                maze[y + 1][x] !== 1
            ) {
                newPos = { x, y: y + 1 };
            } else if (
                e.key === 'ArrowLeft' &&
                x > 0 &&
                maze[y][x - 1] !== 1
            ) {
                newPos = { x: x - 1, y };
            } else if (
                e.key === 'ArrowRight' &&
                x < maze[0].length - 1 &&
                maze[y][x + 1] !== 1
            ) {
                newPos = { x: x + 1, y };
            }

            if (newPos.x !== x || newPos.y !== y) {
                setPlayerPos(newPos);
                setMoves(moves + 1);
                if (newPos.x === maze[0].length - 1 && newPos.y === maze.length - 1) {
                    setGameWon(true);
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 1500);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [playerPos, maze, gameStarted, gameWon, moves, gameOver]);

    const initGame = () => {
        const { size, time } = difficultySettings[difficulty];
        const newMaze = generateMaze(size);
        setMaze(newMaze);
        setPlayerPos({ x: 0, y: 0 });
        setGameWon(false);
        setShowConfetti(false);
        setMoves(0);
        setXPEarned(0);
        setGameOver(false);
        setTimeRemaining(time);
        setNotification(null);
    };

    const resetGame = () => {
        setGameStarted(true);
        setPlayerPos({ x: 0, y: 0 });
        setMaze([]);
        setGameWon(false);
        setShowConfetti(false);
        setMoves(0);
        setXPEarned(0);
        setGameOver(false);
        setTimeRemaining(difficultySettings[difficulty].time);
        setNotification(null);
        initGame();
    };

    const generateMaze = (size) => {
        const maze = Array(size)
            .fill()
            .map(() => Array(size).fill(1));

        const stack = [];
        const directions = [
            { dx: 0, dy: -2 },
            { dx: 0, dy: 2 },
            { dx: -2, dy: 0 },
            { dx: 2, dy: 0 },
        ];

        maze[0][0] = 0;
        stack.push({ x: 0, y: 0 });

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const { x, y } = current;

            const neighbors = directions
                .map((dir) => ({
                    x: x + dir.dx,
                    y: y + dir.dy,
                    wallX: x + dir.dx / 2,
                    wallY: y + dir.dy / 2,
                }))
                .filter(
                    (n) =>
                        n.x >= 0 &&
                        n.x < size &&
                        n.y >= 0 &&
                        n.y < size &&
                        maze[n.y][n.x] === 1
                );

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                maze[next.y][next.x] = 0;
                maze[next.wallY][next.wallX] = 0;
                stack.push({ x: next.x, y: next.y });
            } else {
                stack.pop();
            }
        }

        maze[size - 1][size - 1] = 0;
        if (maze[size - 2][size - 1] === 1 && maze[size - 1][size - 2] == 1) {
            maze[size - 2][size - 1] = 0;
        }

        return maze;
    };

    const awardXP = async () => {
        const earned = difficultySettings[difficulty].xpPerWin;
        setXPEarned(earned);

        if (earned > 0) {
            try {
                const xpRequest = {
                    studentId: parseInt(studentId),
                    gameId: 9,
                    amount: earned,
                    xpType: 1,
                    description: 'Completed MazeGame',
                };
                const earnedAmount = await xpProcess(xpRequest);
                console.log('XP awarded:', earnedAmount);
                setNotification(`You earned ${earnedAmount} XP!`);
                setTimeout(() => {
                    setNotification(null);
                    console.log('Notification cleared');
                }, 3000);
            } catch (error) {
                console.error('Error awarding XP:', error);
                setNotification('Failed to award XP.');
                setTimeout(() => {
                    setNotification(null);
                    console.log('Error notification cleared');
                }, 3000);
            }
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || seconds < 0) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStartGame = () => {
        setGameStarted(true);
    };

    return (
        <div
            className="maze-game"
            ref={gameAreaRef}
            tabIndex={0}
            onKeyDown={() => { }}
        >
            {notification && <div className="xp-notification">{notification}</div>}
            {showConfetti && <Confetti />}

            <div className="game-header">
                <h2>Maze Puzzle</h2>
                {!gameStarted && !gameWon && !gameOver ? (
                    <div className="start-screen">
                        <div className="difficulty-selector">
                            <label>Select Difficulty: </label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value)}
                            >
                                <option value="easy">Easy (5x5, 5 XP, 30s)</option>
                                <option value="medium">Medium (7x7, 10 XP, 40s)</option>
                                <option value="hard">Hard (10x10, 15 XP, 50s)</option>
                            </select>
                        </div>
                        <button className="start-button" onClick={handleStartGame}>
                            Start
                        </button>
                    </div>
                ) : (
                    <div className="game-controls">
                        {gameStarted && !gameWon && !gameOver ? (
                            <div className="difficulty-display">
                                <label>Difficulty: </label>
                                <span>{difficultyDisplay[difficulty]}</span>
                            </div>
                        ) : (
                            <div className="difficulty-selector">
                                <label>Difficulty: </label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => {
                                        setDifficulty(e.target.value);
                                        setGameStarted(false);
                                    }}
                                >
                                    <option value="easy">Easy (5x5)</option>
                                    <option value="medium">Medium (7x7)</option>
                                    <option value="hard">Hard (10x10)</option>
                                </select>
                            </div>
                        )}
                        <div className="game-stats">
                            <p>Moves: {moves}</p>
                            <p>Time Remaining: {formatTime(timeRemaining)}</p>
                            <p>XP: {xpEarned}</p>
                        </div>
                    </div>
                )}
            </div>

            {gameStarted && !gameWon && !gameOver ? (
                <div className='maze-game-place'>
                    <div className={`maze-grid ${difficulty}`}>
                        {maze.map((row, y) =>
                            row.map((cell, x) => (
                                <div
                                    key={`${x}-${y}`}
                                    className={`cell ${cell === 1
                                        ? 'wall'
                                        : x === playerPos.x && y === playerPos.y
                                            ? 'player'
                                            : x === maze[0].length - 1 && y === maze.length - 1
                                                ? 'exit'
                                                : ''
                                        }`}
                                >
                                    {x === playerPos.x && y === playerPos.y
                                        ? '🐰'
                                        : x === maze[0].length - 1 && y === maze.length - 1
                                            ? '🏁'
                                            : ''}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : gameWon ? (
                <div className="win-message">
                    <h3 className="success">Congratulations! 🎉</h3>
                    <p>You reached the exit in {moves} moves!</p>
                    <p className="xp-earned">Earned {xpEarned} XP this game!</p>
                    <button
                        className="play-again-button"
                        onClick={resetGame}
                    >
                        Play Again
                    </button>
                </div>
            ) : gameOver ? (
                <div className="win-message">
                    <h3>Game Over!</h3>
                    <p>Time ran out! Want to try again?</p>
                    <button
                        className="play-again-button"
                        onClick={resetGame}
                    >
                        Play Again
                    </button>
                </div>
            ) : (
                <div className="welcome-message">
                    <p>Select a difficulty level and start the game!</p>
                </div>
            )}
        </div>
    );
};

export default MazeGame;
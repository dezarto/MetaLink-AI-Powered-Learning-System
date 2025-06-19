import React, { useState, useEffect, useRef } from 'react';
import './NumberPuzzleGame.css';
import Confetti from 'react-confetti';
import { xpProcess } from '../../services/student-api.js';
import { useParams } from 'react-router-dom';

const NumberPuzzleGame = ({ onBack }) => {
    const { studentId } = useParams();
    const [grid, setGrid] = useState([]);
    const [options, setOptions] = useState([]);
    const [correctGrid, setCorrectGrid] = useState([]);
    const [difficulty, setDifficulty] = useState('easy');
    const [gameWon, setGameWon] = useState(false);
    const [gameActive, setGameActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [moves, setMoves] = useState(0);
    const [errorIndex, setErrorIndex] = useState(null);
    const [timeLeft, setTimeLeft] = useState(40);
    const [notification, setNotification] = useState(null);
    const timerRef = useRef(null);

    const difficultySettings = {
        easy: { size: 4, missing: 2, range: 10, time: 40 },
        medium: { size: 6, missing: 4, range: 50, time: 60 },
        hard: { size: 8, missing: 6, range: 100, time: 90 },
    };

    const startGame = () => {
        setMoves(0);
        setTimeLeft(difficultySettings[difficulty].time);
        setGameActive(true);
        setGameOver(false);
        setGameWon(false);
        setShowConfetti(false);
        setNotification(null);
        initGame();
    };

    const stopGame = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setGameActive(false);
        setGameOver(true);
    };

    const initGame = () => {
        const { size, missing, range } = difficultySettings[difficulty];
        const numbers = Array.from({ length: size }, () =>
            Math.floor(Math.random() * range) + 1
        ).sort((a, b) => a - b);
        const missingIndices = shuffleArray([...Array(size).keys()]).slice(0, missing);
        const newGrid = numbers.map((num, index) =>
            missingIndices.includes(index) ? null : num
        );
        const newOptions = numbers
            .filter((_, index) => missingIndices.includes(index))
            .sort((a, b) => a - b);

        setCorrectGrid(numbers);
        setGrid(newGrid);
        setOptions(newOptions);
        setErrorIndex(null);
    };

    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const handleDrop = async (index, number) => {
        if (!gameActive) return;

        if (correctGrid[index] === number) {
            const newGrid = [...grid];
            newGrid[index] = number;
            setGrid(newGrid);
            setOptions(options.filter((opt) => opt !== number));
            setMoves(moves + 1);
            setErrorIndex(null);

            if (!newGrid.includes(null)) {
                const isCorrect = newGrid.every((num, i) => num === correctGrid[i]);
                if (isCorrect) {
                    setGameWon(true);
                    setGameActive(false);
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 2000);

                    // Award 10 XP per correct placement when game is won
                    const numCorrectPlacements = difficultySettings[difficulty].missing;
                    const xpEarned = numCorrectPlacements * 2;
                    try {
                        const xpRequest = {
                            studentId: parseInt(studentId),
                            gameId: 4, // Assuming 4 for NumberPuzzle
                            amount: xpEarned,
                            xpType: 1, // EarnXP
                            description: 'Completed puzzle in NumberPuzzle game'
                        };
                        const earnedAmount = await xpProcess(xpRequest);
                        setNotification(`Tebrikler! ${earnedAmount} XP kazandınız!`);
                        setTimeout(() => setNotification(null), 3000);
                    } catch (error) {
                        console.error('XP kazandırma hatası:', error);
                        setNotification('XP kazanılamadı. Bir hata oluştu.');
                        setTimeout(() => setNotification(null), 3000);
                    }
                }
            }
        } else {
            setErrorIndex(index);
            setTimeout(() => setErrorIndex(null), 500);
        }
    };

    const handleDragStart = (e, number) => {
        e.dataTransfer.setData('number', number);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const onDrop = (e, index) => {
        const number = parseInt(e.dataTransfer.getData('number'));
        if (grid[index] === null) {
            handleDrop(index, number);
        }
    };

    useEffect(() => {
        if (gameActive) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setGameActive(false);
                        setGameOver(true);
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
        <div className="number-puzzle-game">
            {showConfetti && <Confetti />}
            {notification && (
                <div className="xp-notification">
                    {notification}
                </div>
            )}
            <button className="back-button" onClick={onBack}>
                ← Back to Games
            </button>

            <h2>Sayı Bulmaca</h2>

            {!gameActive && !gameOver && (
                <div className="number-puzzle-start">
                    <p>Sayıları soldan sağa sıralı yerleştir!</p>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="difficulty-select"
                    >
                        <option value="easy">Kolay (1-10, 2 boş)</option>
                        <option value="medium">Orta (1-50, 4 boş)</option>
                        <option value="hard">Zor (1-100, 6 boş)</option>
                    </select>
                    <button className="start-button" onClick={startGame}>
                        Oyunu Başlat
                    </button>
                </div>
            )}

            {gameActive && (
                <div className="number-puzzle-game">
                    <div className="game-stats">
                        <div className="moves">Hamle: {moves}</div>
                        <div className="timer">Süre: {timeLeft}s</div>
                        <div className="difficulty">Zorluk: {difficulty}</div>
                    </div>

                    <div className="game-container">
                        <div className={`game-grid ${difficulty}`}>
                            {grid.map((num, index) => (
                                <div
                                    key={index}
                                    className={`grid-cell ${num === null ? 'empty' : ''} ${errorIndex === index ? 'error' : ''
                                        }`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => onDrop(e, index)}
                                >
                                    {num || '?'}
                                    {index < grid.length - 1 && <span className="arrow">→</span>}
                                </div>
                            ))}
                        </div>
                        <div className="options">
                            {options.map((num) => (
                                <div
                                    key={num}
                                    className="number-tile"
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, num)}
                                >
                                    {num}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="stop-button" onClick={stopGame}>
                        Oyunu Durdur
                    </button>
                </div>
            )}

            {(gameOver || gameWon) && (
                <div className="game-over">
                    <h3>{gameWon ? 'Tebrikler! 🎉' : 'Oyun Bitti!'}</h3>
                    <p>Hamle: {moves}</p>
                    <p>Zorluk: {difficulty}</p>
                    <p>Kalan Süre: {timeLeft}s</p>
                    {gameWon && (
                        <p>Toplam {difficultySettings[difficulty].missing * 10} XP kazandın!</p>
                    )}
                    <button className="play-again-button" onClick={startGame}>
                        Tekrar Oyna
                    </button>
                </div>
            )}
        </div>
    );
};

export default NumberPuzzleGame;
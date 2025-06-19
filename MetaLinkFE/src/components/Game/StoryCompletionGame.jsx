import React, { useState, useEffect, useRef } from 'react';
import './StoryCompletionGame.css';
import Confetti from 'react-confetti';
import { xpProcess, fetchStory } from '../../services/student-api.js';
import { useParams } from 'react-router-dom';

const StoryCompletionGame = ({ onBack }) => {
    const { studentId } = useParams();
    const [cards, setCards] = useState([]);
    const [difficulty, setDifficulty] = useState('easy');
    const [gameWon, setGameWon] = useState(false);
    const [gameActive, setGameActive] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [moves, setMoves] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(false);
    const timerRef = useRef(null);

    const difficultySettings = {
        easy: { cards: 3, time: 45 },
        medium: { cards: 5, time: 60 },
        hard: { cards: 7, time: 120 },
    };

    const startGame = async () => {
        setMoves(0);
        setTimeLeft(difficultySettings[difficulty].time);
        setGameActive(false); // Henüz aktif değil, hikaye gelince aktif olacak
        setGameOver(false);
        setGameWon(false);
        setShowConfetti(false);
        setNotification(null);
        setLoading(true); // Yükleme başlıyor

        // Backend'den hikaye al
        try {
            const story = await fetchStory(parseInt(studentId), difficultySettings[difficulty].cards);
            const shuffledStory = shuffleArray([...story]);
            setCards(shuffledStory);
            setLoading(false); // Yükleme bitti
            setGameActive(true); // Oyun şimdi aktif
        } catch (error) {
            console.error('Hikaye alma hatası:', error);
            setNotification('Hikaye yüklenemedi. Lütfen tekrar deneyin.');
            setTimeout(() => setNotification(null), 3000);
            setLoading(false);
            setGameActive(false);
            setGameOver(true);
        }
    };

    const stopGame = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setGameActive(false);
        setGameOver(true);
    };

    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    const handleDragStart = (e, id) => {
        e.dataTransfer.setData('id', id);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e, targetIndex) => {
        if (!gameActive) return;

        const id = parseInt(e.dataTransfer.getData('id'));
        const sourceIndex = cards.findIndex((card) => card.id === id);
        const newCards = [...cards];
        [newCards[sourceIndex], newCards[targetIndex]] = [
            newCards[targetIndex],
            newCards[sourceIndex],
        ];
        setCards(newCards);
        setMoves(moves + 1);

        // Check if the order is correct
        const isCorrect = newCards.every((card, index) => card.order === index + 1);
        if (isCorrect) {
            setGameWon(true);
            setGameActive(false);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 2000);

            // Award 5 XP per card
            const numCards = difficultySettings[difficulty].cards;
            const xpEarned = numCards * 5;
            try {
                const xpRequest = {
                    studentId: parseInt(studentId),
                    gameId: 3, // Assuming 3 for StoryCompletion
                    amount: xpEarned,
                    xpType: 1, // EarnXP
                    description: 'Completed story in StoryCompletion game'
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
    };

    useEffect(() => {
        if (gameActive && cards.length > 0) {
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
    }, [gameActive, cards]);

    return (
        <div className="story-completion-game">
            {showConfetti && <Confetti />}
            {notification && (
                <div className="xp-notification">
                    {notification}
                </div>
            )}
            <button className="back-button" onClick={onBack}>
                ← Back to Games
            </button>

            <h2>Hikaye Tamamlama</h2>

            {!gameActive && !gameOver && !loading && (
                <div className="story-completion-start">
                    <p>Kartları doğru sıraya dizerek hikayeyi tamamla!</p>
                    <select
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="difficulty-select"
                    >
                        <option value="easy">Kolay (3 kart)</option>
                        <option value="medium">Orta (5 kart)</option>
                        <option value="hard">Zor (7 kart)</option>
                    </select>
                    <button className="start-button" onClick={startGame}>
                        Oyunu Başlat
                    </button>
                </div>
            )}

            {loading && (
                <div className="loader-container">
                    <div className="loader"></div>
                    <p>Hikaye oluşturuluyor...</p>
                </div>
            )}

            {gameActive && !loading && (
                <div className="story-completion-game">
                    <div className="game-stats">
                        <div className="moves">Hamle: {moves}</div>
                        <div className="timer">Süre: {timeLeft}s</div>
                        <div className="difficulty">Zorluk: {difficulty}</div>
                    </div>

                    <div className="story-board">
                        {cards.map((card, index) => (
                            <div
                                key={card.id}
                                className="story-card"
                                draggable
                                onDragStart={(e) => handleDragStart(e, card.id)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, index)}
                            >
                                {card.text}
                            </div>
                        ))}
                    </div>

                    <button className="stop-button" onClick={stopGame}>
                        Oyunu Durdur
                    </button>
                </div>
            )}

            {(gameOver || gameWon) && !loading && (
                <div className="game-over">
                    <h3>{gameWon ? 'Tebrikler! 🎉' : 'Oyun Bitti!'}</h3>
                    <p>Hamle: {moves}</p>
                    <p>Zorluk: {difficulty}</p>
                    <p>Kalan Süre: {timeLeft}s</p>
                    {gameWon && (
                        <p>Toplam {difficultySettings[difficulty].cards * 5} XP kazandın!</p>
                    )}
                    <button className="play-again-button" onClick={startGame}>
                        Tekrar Oyna
                    </button>
                </div>
            )}
        </div>
    );
};

export default StoryCompletionGame;
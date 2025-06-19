import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import './BattleshipGame.css';
import { xpProcess } from '../../services/student-api.js';

const BattleshipGame = ({ onBack, gameStatus, gameMode, hubConnection }) => {
    const { studentId } = useParams();
    const [playerGrid, setPlayerGrid] = useState([]);
    const [opponentGrid, setOpponentGrid] = useState([]);
    const [playerShips, setPlayerShips] = useState([]);
    const [opponentShips, setOpponentShips] = useState([]);
    const [gamePhase, setGamePhase] = useState(gameMode === 'multiple' ? 'invite' : 'placement');
    const [moves, setMoves] = useState(0);
    const [gameWon, setGameWon] = useState(false);
    const [gameLost, setGameLost] = useState(false);
    const [notification, setNotification] = useState(null);
    const [isPlayerTurn, setIsPlayerTurn] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300);
    const [selectedShip, setSelectedShip] = useState(null);
    const [selectedCells, setSelectedCells] = useState([]);
    const [playerReady, setPlayerReady] = useState(false);
    const [opponentReady, setOpponentReady] = useState(false);
    const [shotHistory, setShotHistory] = useState([]);
    const timerRef = useRef(null);

    const shipTypes = [
        { name: 'Aircraft Carrier', size: 5, id: 'carrier' },
        { name: 'Battleship', size: 4, id: 'battleship' },
        { name: 'Destroyer 1', size: 3, id: 'destroyer1' },
        { name: 'Destroyer 2', size: 3, id: 'destroyer2' },
        { name: 'Submarine', size: 2, id: 'submarine' },
    ];

    useEffect(() => {
        initGrids();
    }, []);

    useEffect(() => {
        if (gameMode === 'multiple') {
            switch (gameStatus) {
                case 'idle':
                    setGamePhase('invite');
                    break;
                case 'playing':
                    if (playerReady && opponentReady) {
                        setGamePhase('playing');
                    } else {
                        setGamePhase('placement');
                    }
                    break;
                case 'ended':
                    setGamePhase('ended');
                    break;
                default:
                    setGamePhase('invite');
                    break;
            }
        } else {
            setGamePhase('placement');
        }
    }, [gameStatus, gameMode, playerReady, opponentReady]);

    useEffect(() => {
        if (gamePhase === 'playing') {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setGamePhase('ended');
                        setGameLost(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [gamePhase]);

    useEffect(() => {
        if (hubConnection && gameMode === 'multiple') {
            hubConnection.on('InviteAccepted', (data) => {
                console.log('InviteAccepted received:', data);
                setNotification('Invitation accepted! Place your ships.');
                setTimeout(() => setNotification(null), 3000);
                setIsPlayerTurn(Number(studentId) === data.inviterId);
            });

            hubConnection.on('GameStarted', (data) => {
                console.log('GameStarted received:', data);
                setNotification('Game started!');
                setTimeout(() => setNotification(null), 3000);
            });

            hubConnection.on('ReceiveMove', (data) => {
                console.log('ReceiveMove received:', data);
                let moveData = data.moveData;
                if (typeof moveData === 'string') {
                    try {
                        moveData = JSON.parse(moveData);
                    } catch (err) {
                        console.error("JSON parse error:", err);
                        return;
                    }
                }

                if (moveData.type === 'shot' && moveData.playerId !== Number(studentId)) {
                    handleOpponentShot(moveData.x, moveData.y);
                } else if (moveData.type === 'shotResult' && moveData.playerId === Number(studentId)) {
                    updateOpponentGrid(moveData.x, moveData.y, moveData.isHit, moveData.isSunk, moveData.sunkShipCoords);
                } else if (moveData.type === 'ready' && moveData.playerId !== Number(studentId)) {
                    setOpponentReady(true);
                    setNotification('Opponent is ready!');
                    setTimeout(() => setNotification(null), 3000);
                    if (playerReady && gameStatus === 'playing') {
                        setGamePhase('playing');
                        setNotification(Number(studentId) === data.inviterId ? 'Game started! Your turn.' : 'Game started! Opponent\'s turn.');
                        setTimeout(() => setNotification(null), 3000);
                    }
                }
            });

            hubConnection.on('GameEnded', async (data) => {
                console.log('GameEnded received:', data);
                const isWinner = data.isWinner && data.studentId === Number(studentId);
                setGameWon(isWinner);
                setGameLost(!data.isWinner && data.studentId === Number(studentId));
                setGamePhase('ended');

                if (isWinner) {
                    try {
                        const xpRequest = {
                            studentId: parseInt(studentId),
                            gameId: 10,
                            amount: 200,
                            xpType: 1,
                            description: 'Completed BattleshipGame'
                        };
                        const earnedAmount = await xpProcess(xpRequest);
                        console.log(`XP earned: ${earnedAmount}`);
                        setNotification('You won! Earned 200 XP!');
                    } catch (error) {
                        console.error('XP processing error:', error);
                        setNotification('You won! But an error occurred while adding XP.');
                    }
                } else {
                    setNotification('Opponent won!');
                }
                setTimeout(() => setNotification(null), 5000);
            });

            hubConnection.on('PlayerDisconnected', (data) => {
                console.log('PlayerDisconnected received:', data);
                setGameWon(false);
                setGameLost(true);
                setGamePhase('ended');
                setNotification(data.message || 'Opponent disconnected, game over.');
                setTimeout(() => setNotification(null), 3000);
            });

            return () => {
                hubConnection.off('InviteAccepted');
                hubConnection.off('GameStarted');
                hubConnection.off('ReceiveMove');
                hubConnection.off('GameEnded');
                hubConnection.off('PlayerDisconnected');
            };
        }
    }, [hubConnection, gameMode, playerReady, gameStatus, studentId]);

    const initGrids = () => {
        console.log('initGrids called:', new Date().toISOString());
        const emptyGrid = Array(12).fill().map(() => Array(12).fill(0));
        setPlayerGrid(emptyGrid);
        setOpponentGrid(emptyGrid);
        setPlayerShips([]);
        setOpponentShips([]);
        setMoves(0);
        setGameWon(false);
        setGameLost(false);
        setGamePhase(gameMode === 'multiple' ? 'invite' : 'placement');
        setIsPlayerTurn(false);
        setSelectedShip(null);
        setSelectedCells([]);
        setTimeLeft(300);
        setPlayerReady(false);
        setOpponentReady(false);
        setShotHistory([]);
        console.log('Grids reset:', { playerGrid: emptyGrid, opponentGrid: emptyGrid });
    };

    const handleCellClick = (x, y) => {
        if (gamePhase !== 'placement' || !selectedShip || playerReady) return;

        const newCell = [x, y];
        if (selectedCells.some(([cx, cy]) => cx === x && cy === y)) {
            setSelectedCells(selectedCells.filter(([cx, cy]) => cx !== x || cy !== y));
            return;
        }

        if (selectedCells.length >= selectedShip.size) {
            setNotification(`You have already selected ${selectedShip.size} cells. Choose another ship or complete placement.`);
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        const newSelectedCells = [...selectedCells, newCell];
        setSelectedCells(newSelectedCells);

        if (newSelectedCells.length === selectedShip.size) {
            placeShip(newSelectedCells);
        }
    };

    const placeShip = (cells) => {
        const newGrid = playerGrid.map((row) => [...row]);
        let valid = true;

        const isHorizontalPlacement = cells.every(([cx, cy]) => cy === cells[0][1]);
        const isVerticalPlacement = cells.every(([cx, cy]) => cx === cells[0][0]);

        if (!isHorizontalPlacement && !isVerticalPlacement) {
            setNotification('Cells must form a horizontal or vertical line!');
            setSelectedCells([]);
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        cells.sort((a, b) => (isHorizontalPlacement ? a[0] - b[0] : a[1] - b[1]));
        for (let i = 1; i < cells.length; i++) {
            if (
                isHorizontalPlacement &&
                (cells[i][0] !== cells[i - 1][0] + 1 || cells[i][1] !== cells[i - 1][1])
            ) {
                valid = false;
                break;
            }
            if (
                isVerticalPlacement &&
                (cells[i][1] !== cells[i - 1][1] + 1 || cells[i][0] !== cells[i - 1][0])
            ) {
                valid = false;
                break;
            }
        }

        cells.forEach(([cx, cy]) => {
            if (cx >= 12 || cy >= 12 || newGrid[cy][cx] !== 0) {
                valid = false;
            }
        });

        if (valid) {
            cells.forEach(([cx, cy]) => {
                newGrid[cy][cx] = 1;
            });

            setPlayerGrid((prev) => {
                console.log('playerGrid updated (ship placement):', newGrid);
                return newGrid;
            });
            const filteredShips = playerShips.filter((s) => s.id !== selectedShip.id);
            setPlayerShips([
                ...filteredShips,
                { ...selectedShip, coords: cells, hits: 0, isHorizontal: isHorizontalPlacement },
            ]);

            setNotification(`${selectedShip.name} placed.`);
            setTimeout(() => setNotification(null), 1500);

            setSelectedShip(null);
            setSelectedCells([]);
        } else {
            setNotification('Invalid placement! Cells are outside the grid, overlap with another ship, or are not adjacent.');
            setSelectedCells([]);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const handleReady = async () => {
        if (playerShips.length !== shipTypes.length) {
            setNotification('Place all ships before being ready.');
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        setPlayerReady(true);
        setNotification('You are ready! Waiting for opponent...');
        setTimeout(() => setNotification(null), 3000);

        if (hubConnection && gameMode === 'multiple') {
            const moveData = JSON.stringify({
                type: 'ready',
                playerId: Number(studentId),
                ships: playerShips.map(ship => ({
                    id: ship.id,
                    coords: ship.coords
                }))
            });
            await hubConnection.invoke('SendMove', Number(studentId), 10, moveData);
        }
    };

    const handlePlayerShot = async (x, y) => {
        if (
            gamePhase !== 'playing' ||
            !isPlayerTurn ||
            opponentGrid[y][x] === 2 ||
            opponentGrid[y][x] === 3 ||
            opponentGrid[y][x] === 4 ||
            opponentGrid[y][x] === 5 ||
            gameWon ||
            gameLost
        ) return;

        setMoves((prev) => prev + 1);

        setOpponentGrid((prevGrid) => {
            const newOpponentGrid = prevGrid.map((row) => [...row]);
            newOpponentGrid[y][x] = 5;
            console.log('opponentGrid updated (temporary shot):', newOpponentGrid);
            return newOpponentGrid;
        });

        setIsPlayerTurn(false);

        if (hubConnection && gameMode === 'multiple') {
            try {
                const moveData = JSON.stringify({
                    type: 'shot',
                    x,
                    y,
                    playerId: Number(studentId),
                    moves: moves + 1
                });
                await hubConnection.invoke('SendMove', Number(studentId), 10, moveData);
            } catch (error) {
                console.error('SendMove error:', error);
                setOpponentGrid((prevGrid) => {
                    const errorGrid = prevGrid.map((row) => [...row]);
                    errorGrid[y][x] = 0;
                    console.log('opponentGrid reset after error:', errorGrid);
                    return errorGrid;
                });
                setNotification('Shot could not be sent, please try again.');
                setTimeout(() => setNotification(null), 3000);
                setIsPlayerTurn(true);
                setMoves((prev) => prev - 1);
            }
        }
    };

    const handleOpponentShot = (x, y) => {
        setPlayerGrid((prevGrid) => {
            const newPlayerGrid = prevGrid.map((row) => [...row]);
            const newPlayerShips = playerShips.map((ship) => ({ ...ship }));
            const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

            if (newPlayerGrid[y][x] === 2 || newPlayerGrid[y][x] === 3 || newPlayerGrid[y][x] === 4) {
                console.log(`Opponent shot already processed: (${x}, ${y})`);
                return newPlayerGrid;
            }

            const hitShip = newPlayerShips.find((ship) =>
                ship.coords.some(([cx, cy]) => cx === x && cy === y)
            );

            let result = 'miss';
            if (hitShip) {
                const shipIndex = newPlayerShips.findIndex((s) => s.id === hitShip.id);
                newPlayerShips[shipIndex].hits += 1;
                const isSunk = newPlayerShips[shipIndex].hits === hitShip.size;
                if (isSunk) {
                    hitShip.coords.forEach(([cx, cy]) => {
                        newPlayerGrid[cy][cx] = 4;
                    });
                } else {
                    newPlayerGrid[y][x] = 2;
                }
                result = isSunk ? 'sunk' : 'hit';
                setNotification(
                    isSunk ? `Opponent sank your ${hitShip.name}!` : `Opponent hit your ${hitShip.name}!`
                );
            } else {
                newPlayerGrid[y][x] = 3;
                setNotification('Opponent missed!');
            }

            setMoves((prev) => prev + 1);

            setShotHistory((prev) => {
                const coords = `${alphabet[x]}${y + 1}`;
                const exists = prev.some(
                    (shot) => shot.coords === coords && shot.moveNumber === moves + 1 && shot.shooter === 'opponent'
                );
                if (exists) {
                    console.log(`Opponent shot already exists, not added: (${x}, ${y})`);
                    return prev;
                }
                console.log(`Opponent shot added: (${x}, ${y}) -> ${result}`);
                return [
                    ...prev,
                    {
                        shooter: 'opponent',
                        coords,
                        result,
                        moveNumber: moves + 1,
                    },
                ];
            });

            console.log(`Opponent shot: (${x}, ${y}) -> ${result}, playerGrid[${y}][${x}] = ${newPlayerGrid[y][x]}`);
            console.log('playerGrid updated (opponent shot):', newPlayerGrid);

            setPlayerShips(newPlayerShips);

            const allSunk = newPlayerShips.every((ship) => ship.hits === ship.size);
            if (allSunk) {
                setGameLost(true);
                setGamePhase('ended');
                setNotification('You lost! All your ships sank.');
                setTimeout(() => setNotification(null), 3000);
                if (hubConnection) {
                    hubConnection.invoke('EndGame', Number(studentId), 10, false, moves, 'default');
                }
                return newPlayerGrid;
            }

            setIsPlayerTurn(true);
            return newPlayerGrid;
        });
    };

    const updateOpponentGrid = (x, y, isHit, isSunk, sunkShipCoords) => {
        setOpponentGrid((prevGrid) => {
            const newOpponentGrid = prevGrid.map((row) => [...row]);
            const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

            if (isSunk && sunkShipCoords) {
                sunkShipCoords.forEach((coord) => {
                    newOpponentGrid[coord.y][coord.x] = 4;
                });
            } else {
                newOpponentGrid[y][x] = isHit ? 2 : 3;
            }

            const result = isSunk ? 'sunk' : isHit ? 'hit' : 'miss';
            console.log(`Player shot: (${x}, ${y}) -> ${result}, opponentGrid[${y}][${x}] = ${newOpponentGrid[y][x]}`);
            console.log('opponentGrid updated (shot result):', newOpponentGrid);

            setShotHistory((prev) => {
                const coords = `${alphabet[x]}${y + 1}`;
                const exists = prev.some(
                    (shot) => shot.coords === coords && shot.moveNumber === moves + 1 && shot.shooter === 'player'
                );
                if (exists) {
                    console.log(`Shot already exists, not added: (${x}, ${y})`);
                    return prev;
                }
                console.log(`Player shot added: (${x}, ${y}) -> ${result}`);
                return [
                    ...prev,
                    {
                        shooter: 'player',
                        coords,
                        result,
                        moveNumber: moves + 1,
                    },
                ];
            });

            setNotification(isSunk ? 'You sank an opponent ship!' : isHit ? 'Hit!' : 'Missed!');
            setTimeout(() => setNotification(null), 1500);

            if (isHit) {
                setOpponentShips((prevShips) => {
                    const newOpponentShips = [...prevShips];
                    const hitShip = newOpponentShips.find((ship) =>
                        ship.coords.some(([cx, cy]) => cx === x && cy === y)
                    );
                    if (hitShip) {
                        const shipIndex = newOpponentShips.findIndex((s) => s.id === hitShip.id);
                        newOpponentShips[shipIndex].hits += 1;
                        if (isSunk && sunkShipCoords) {
                            newOpponentShips[shipIndex].coords = sunkShipCoords.map((coord) => [coord.x, coord.y]);
                        }
                    } else {
                        newOpponentShips.push({
                            id: `opponent-ship-${newOpponentShips.length}`,
                            coords: [[x, y]],
                            hits: 1,
                            size: isSunk ? sunkShipCoords?.length || 2 : 2,
                        });
                    }
                    return newOpponentShips;
                });
            }

            return newOpponentGrid;
        });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const renderGrid = (grid, isPlayerGrid, onClick) => {
        const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

        console.log(`renderGrid called, isPlayerGrid: ${isPlayerGrid}, grid:`, grid);

        return (
            <div className="bship-grid-container">
                <div className="bship-column-labels">
                    {alphabet.map((letter) => (
                        <div key={letter} className="bship-label">
                            {letter}
                        </div>
                    ))}
                </div>
                <div className="bship-row-labels">
                    {Array(12)
                        .fill()
                        .map((_, i) => (
                            <div key={i} className="bship-label">
                                {i + 1}
                            </div>
                        ))}
                </div>
                <div className="bship-game-grid">
                    {grid.map((row, y) =>
                        row.map((cell, x) => {
                            const isSelected = selectedCells.some(([cx, cy]) => cx === x && cy === y);
                            const cellClass = `bship-cell 
                                ${cell === 1 && isPlayerGrid ? 'bship-ship' : ''} 
                                ${cell === 2 ? 'bship-hit' : ''} 
                                ${cell === 3 ? 'bship-miss' : ''} 
                                ${cell === 4 ? 'bship-sunk' : ''} 
                                ${cell === 5 ? 'bship-pending' : ''} 
                                ${isSelected ? 'bship-selected-cell' : ''}`;
                            console.log(`Cell (${x}, ${y}): cell=${cell}, class=${cellClass}`);
                            return (
                                <div
                                    key={`${x}-${y}`}
                                    className={cellClass}
                                    onClick={() => onClick && onClick(x, y)}
                                    data-coords={`${alphabet[x]}${y + 1}`}
                                >
                                    <div className="bship-cell-content">
                                        {cell === 1 && isPlayerGrid ? (
                                            '🚢'
                                        ) : cell === 2 ? (
                                            <span className="bship-icon bship-icon-hit">💥</span>
                                        ) : cell === 3 ? (
                                            <span className="bship-icon bship-icon-miss">🌊</span>
                                        ) : cell === 4 ? (
                                            <span className="bship-icon bship-icon-sunk">🔥</span>
                                        ) : cell === 5 ? (
                                            <span className="bship-icon bship-icon-pending">⌛</span>
                                        ) : isSelected ? (
                                            '📍'
                                        ) : (
                                            ''
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        );
    };

    const renderShotHistory = () => {
        return (
            <div className="bship-shot-history">
                <h3>Shot History</h3>
                {shotHistory.length === 0 ? (
                    <p>No shots made yet.</p>
                ) : (
                    <div className="bship-shot-list">
                        {shotHistory.slice().reverse().map((shot, index) => (
                            <div
                                key={`${shot.shooter}-${shot.coords}-${shot.moveNumber}-${index}`}
                                className={`bship-shot-item ${shot.shooter === 'player' ? 'bship-player-shot' : 'bship-opponent-shot'}`}
                            >
                                <span>#{shot.moveNumber}</span>
                                <span>{shot.shooter === 'player' ? 'You' : 'Opponent'}</span>
                                <span>{shot.coords}</span>
                                <span className={`bship-shot-result bship-${shot.result}`}>
                                    {shot.result === 'hit' ? 'Hit' : shot.result === 'miss' ? 'Miss' : 'Sunk'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bship-game">
            {notification && <div className="bship-notification">{notification}</div>}

            <h2 className="bship-game-title">Battleship</h2>

            {gamePhase === 'invite' && gameMode === 'multiple' && (
                <div className="bship-invite">
                    <p>Invite a friend to play Battleship!</p>
                    <p>The game will start when both players are ready.</p>
                </div>
            )}

            {gamePhase === 'placement' && (
                <div className="bship-placement-phase">
                    <h3>Ship Placement</h3>
                    <div className="bship-placement-container">
                        <div className="bship-ship-sidebar">
                            <p>Select a ship and choose {selectedShip ? `${selectedShip.size} cells` : 'cells'} on the grid:</p>
                            <div className="bship-ship-list">
                                {shipTypes.map((ship) => (
                                    <div
                                        key={ship.id}
                                        className={`bship-ship-item 
                                                  ${playerShips.some((s) => s.id === ship.id) ? 'bship-placed' : ''} 
                                                  ${selectedShip && selectedShip.id === ship.id ? 'bship-selected' : ''}`}
                                        onClick={() => {
                                            if (!playerShips.some((s) => s.id === ship.id) && !playerReady) {
                                                setSelectedShip(ship);
                                                setSelectedCells([]);
                                                setNotification(
                                                    `${ship.name} selected. Choose ${ship.size} cells.`
                                                );
                                                setTimeout(() => setNotification(null), 1500);
                                            }
                                        }}
                                    >
                                        <span>{ship.name}</span>
                                        <div className="bship-ship-preview">
                                            {Array(ship.size)
                                                .fill()
                                                .map((_, i) => (
                                                    <div key={i} className="bship-ship-cell">
                                                        🚢
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={handleReady}
                                className={`bship-ready-button ${playerShips.length === shipTypes.length && !playerReady ? 'bship-active' : ''}`}
                                disabled={playerShips.length !== shipTypes.length || playerReady}
                            >
                                {playerReady ? 'Waiting for Opponent...' : 'Ready to Play'}
                            </button>
                        </div>
                        <div className="bship-game-container">
                            <div className="bship-player-section">
                                <h3 className="bship-player-section-h3">Your Board</h3>
                                {renderGrid(playerGrid, true, handleCellClick)}
                            </div>
                            {gameMode === 'multiple' && (
                                <div className="bship-opponent-section">
                                    <h3>Opponent's Board</h3>
                                    <div className="bship-opponent-status">
                                        {opponentReady ? (
                                            <p className="bship-opponent-ready">Opponent is ready, get ready!</p>
                                        ) : (
                                            <p className="bship-opponent-placing">Opponent is placing ships...</p>
                                        )}
                                    </div>
                                    {renderGrid(opponentGrid, false, null)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {gamePhase === 'playing' && (
                <div className="bship-playing-phase">
                    <div className="bship-game-container">
                        <div className="bship-player-section">
                            <h3>Your Board</h3>
                            {renderGrid(playerGrid, true, null)}
                            <div className="bship-game-info">
                                <p className="bship-time-info">Time Remaining: {formatTime(timeLeft)}</p>
                            </div>
                        </div>
                        <div className="bship-opponent-section">
                            <h3>Opponent's Board</h3>
                            {renderGrid(opponentGrid, false, handlePlayerShot)}
                            <p className="bship-turn-info">
                                Turn: <span className={isPlayerTurn ? 'bship-your-turn' : 'bship-opponent-turn'}>
                                    {isPlayerTurn ? 'Your Turn' : "Opponent's Turn"}
                                </span>
                            </p>
                        </div>
                    </div>
                    {renderShotHistory()}
                </div>
            )}

            {gamePhase === 'ended' && (
                <div className="bship-game-over">
                    <h3 className={gameWon ? 'bship-win' : 'bship-lose'}>
                        {gameWon ? 'Congratulations! 🎉' : 'Game Over! 😔'}
                    </h3>
                    <p>Total Moves: {moves}</p>
                    {gameWon && <p>You won! All opponent's ships sank.</p>}
                    {gameLost && <p>You lost! All your ships sank.</p>}
                    <p>Invite your friend to play again</p>
                </div>
            )}
        </div>
    );
};

export default BattleshipGame;
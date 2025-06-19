import React, { useState, useEffect, useRef } from 'react';
import './ChessGame.css';
import Confetti from 'react-confetti';
import Modal from 'react-modal';
import { xpProcess } from '../../services/student-api.js';
import { Chess } from 'chess.js';

Modal.setAppElement('#root');

const ChessGame = ({ gameStatus, gameMode, hubConnection, onBack, studentId, sessionId, isInviter }) => {
    const [chess] = useState(new Chess());
    const [board, setBoard] = useState(initializeBoard());
    const [selectedPiece, setSelectedPiece] = useState(null);
    const [validMoves, setValidMoves] = useState([]);
    const [currentPlayer, setCurrentPlayer] = useState('white');
    const [gameState, setGameState] = useState('waiting');
    const [moves, setMoves] = useState([]);
    const [moveHistory, setMoveHistory] = useState([]);
    const [showConfetti, setShowConfetti] = useState(false);
    const [playerColor, setPlayerColor] = useState(null);
    const playerColorRef = useRef(null);
    const [opponentColor, setOpponentColor] = useState(null);
    const [yourTurn, setYourTurn] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [systemMessage, setSystemMessage] = useState(null);

    useEffect(() => {
        if (playerColor && playerColorRef.current && playerColor !== playerColorRef.current) {
            console.warn(`[ChessGame] playerColor (${playerColor}) does not match playerColorRef (${playerColorRef.current})!`);
            if (playerColorRef.current) {
                setPlayerColor(playerColorRef.current);
            }
        }
        console.log(`[ChessGame] State Update: studentId=${studentId}, playerColor=${playerColor}, yourTurn=${yourTurn}, currentPlayer=${currentPlayer}, playerColorRef=${playerColorRef.current}`);
    }, [playerColor, yourTurn, currentPlayer, studentId]);

    useEffect(() => {
        if (hubConnection) {
            console.log(`[ChessGame] hubConnection initialized, studentId=${studentId}`);

            hubConnection.on('connectionError', (error) => {
                console.error('[ChessGame] SignalR connection error:', error);
                setErrorMessage('Connection error, please refresh the page.');
            });

            const onGameStarted = (data) => {
                console.log('[GameStarted] received:', data);
                if (!data.initialGameState) {
                    console.error('[GameStarted] initialGameState is missing');
                    setErrorMessage('Game could not start: Initial state missing.');
                    return;
                }
                let initialState;
                try {
                    initialState = JSON.parse(data.initialGameState);
                } catch (error) {
                    console.error('[GameStarted] Failed to parse initialGameState:', error);
                    setErrorMessage('Game could not start: Initial state could not be parsed.');
                    return;
                }
                console.log('[GameStarted] initialState:', initialState);
                const newPlayerColor = initialState.playerColor || 'white';
                const newOpponentColor = initialState.opponentColor || 'black';
                playerColorRef.current = newPlayerColor;
                setPlayerColor(newPlayerColor);
                setOpponentColor(newOpponentColor);
                setGameState('playing');
                setCurrentPlayer('white');
                setYourTurn(newPlayerColor === 'white');

                chess.reset();
                if (initialState.fen) {
                    try {
                        console.log(`[GameStarted] Loading server FEN: ${initialState.fen}`);
                        chess.load(initialState.fen);
                    } catch (error) {
                        console.error('[GameStarted] Failed to load server FEN:', error);
                        setErrorMessage('Initial board could not be loaded.');
                    }
                }
                setBoard(fenToBoard(chess.fen()));
                console.log(`[GameStarted] studentId=${studentId}, playerColor=${newPlayerColor}, yourTurn=${newPlayerColor === 'white'}, playerColorRef=${playerColorRef.current}`);
            };

            const onReceiveMove = (data) => {
                console.log('[ReceiveMove] received:', data);
                console.log(`[ReceiveMove] studentId=${studentId}, data.studentId=${data.studentId}`);

                let move;
                try {
                    move = JSON.parse(data.moveData);
                } catch (error) {
                    console.error('[ReceiveMove] Failed to parse moveData:', error);
                    setErrorMessage('Move data could not be parsed.');
                    return;
                }

                if (!data.currentPlayer) {
                    console.error('[ReceiveMove] currentPlayer is missing');
                    setErrorMessage('Turn information missing.');
                    return;
                }

                try {
                    console.log(`[ReceiveMove] Board state before move: ${chess.fen()}, Turn: ${chess.turn()}`);

                    let from, to;
                    if (Array.isArray(move.from)) {
                        from = coordsToSquare(move.from[0], move.from[1]);
                    } else {
                        from = move.from;
                    }
                    if (Array.isArray(move.to)) {
                        to = coordsToSquare(move.to[0], move.to[1]);
                    } else {
                        to = move.to;
                    }

                    console.log(`[ReceiveMove] Applying move: ${from} to ${to}`);

                    if (data.fen) {
                        console.log(`[ReceiveMove] Loading server FEN: ${data.fen}`);
                        try {
                            chess.load(data.fen);
                        } catch (error) {
                            console.error('[ReceiveMove] Failed to load server FEN:', error);
                            setErrorMessage('Server board state could not be loaded.');
                            return;
                        }
                    } else {
                        console.warn('[ReceiveMove] No server FEN provided, applying move locally');
                        const validMoves = chess.moves({ square: from, verbose: true });
                        const isValidMove = validMoves.some(m => m.to === to);
                        if (!isValidMove) {
                            console.error(`[ReceiveMove] Move ${from} to ${to} is invalid. Valid moves:`, validMoves);
                            throw new Error(`Invalid move: ${from} to ${to}`);
                        }

                        const moveResult = chess.move({ from, to });
                        if (!moveResult) {
                            console.error('[ReceiveMove] Move failed:', { from, to });
                            throw new Error('Move application failed');
                        }
                    }

                    setBoard(fenToBoard(chess.fen()));
                    setCurrentPlayer(data.currentPlayer);
                    setYourTurn(playerColorRef.current === data.currentPlayer);
                    setMoves(prev => [...prev, move]);
                    setMoveHistory(prev => [
                        ...prev,
                        `${data.currentPlayer === 'white' ? Math.floor(prev.length / 2) + 1 + '.' : ''} ${move.notation || chess.move({ from, to }).san}`
                    ]);
                    checkGameState();
                    console.log(`[ReceiveMove] Move applied successfully, yourTurn=${playerColorRef.current === data.currentPlayer}, New FEN: ${chess.fen()}`);
                } catch (error) {
                    console.error('[ReceiveMove] Error applying move:', error);
                    setErrorMessage(`Move could not be applied: ${error.message || 'Invalid move'}`);
                }
            };

            function coordsToSquare(x, y) {
                if (x < 0 || x > 7 || y < 0 || y > 7) {
                    throw new Error(`Invalid coordinates: (${x}, ${y})`);
                }
                const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                const file = files[x];
                const rank = 8 - y;
                return file + rank;
            }

            const onInviteError = (data) => {
                console.error('[InviteError] received:', data.message);
                setErrorMessage(data.Message || 'An error occurred.');
                setTimeout(() => setErrorMessage(null), 3000);
            };

            const onSystemMessage = (data) => {
                console.log('[SystemMessage] received:', data);
                setSystemMessage(data.Message);
                setTimeout(() => setSystemMessage(null), 3000);
            };

            hubConnection.on('InviteAccepted', (data) => {
                console.log('[InviteAccepted] received:', data);
                setGameState('waiting');
            });

            hubConnection.on('GameStarted', onGameStarted);
            hubConnection.on('ReceiveMove', onReceiveMove);
            hubConnection.on('InviteError', onInviteError);
            hubConnection.on('SystemMessage', onSystemMessage);

            hubConnection.on('GameEnded', (data) => {
                console.log('[GameEnded] received:', data);
                setGameState(data.difficulty);
                if (data.isWinner && data.studentId === Number(studentId)) {
                    console.log(`[GameEnded] Player ${studentId} is the winner, awarding XP`);
                    awardXP();
                    setShowConfetti(true);
                    setTimeout(() => setShowConfetti(false), 2000);
                } else {
                    console.log(`[GameEnded] Player ${studentId} did not win, no XP awarded`);
                }
            });

            hubConnection.on('PlayerDisconnected', () => {
                console.log('[PlayerDisconnected] received');
                setGameState('stalemate');
                setErrorMessage('Opponent disconnected, game ended.');
            });

            return () => {
                console.log('[ChessGame] Cleaning up hubConnection listeners');
                hubConnection.off('InviteAccepted');
                hubConnection.off('GameStarted', onGameStarted);
                hubConnection.off('ReceiveMove', onReceiveMove);
                hubConnection.off('InviteError', onInviteError);
                hubConnection.off('SystemMessage', onSystemMessage);
                hubConnection.off('GameEnded');
                hubConnection.off('PlayerDisconnected');
                hubConnection.off('connectionError');
            };
        } else {
            console.log('[ChessGame] hubConnection is null');
        }
    }, [hubConnection, studentId]);

    function initializeBoard() {
        return fenToBoard(chess.fen());
    }

    function fenToBoard(fen) {
        const board = Array(8).fill().map(() => Array(8).fill(null));
        const rows = fen.split(' ')[0].split('/');
        for (let y = 0; y < 8; y++) {
            let x = 0;
            for (const char of rows[y]) {
                if (/\d/.test(char)) {
                    x += parseInt(char);
                } else {
                    board[y][x] = char;
                    x++;
                }
            }
        }
        return board;
    }

    function getValidMoves(x, y) {
        const square = `${String.fromCharCode(97 + x)}${8 - y}`;
        const moves = chess.moves({ square, verbose: true });
        console.log(`[getValidMoves] Valid moves for ${square}: ${JSON.stringify(moves)}`);
        return moves.map(move => {
            const toX = move.to.charCodeAt(0) - 97;
            const toY = 8 - parseInt(move.to[1]);
            return [toX, toY];
        });
    }

    function checkGameState() {
        console.log("test 1");
        if (chess.isCheckmate()) {
            console.log("test 2");
            console.log('[checkGameState] Checkmate detected');
            setGameState('checkmate');
            if (playerColorRef.current && chess.turn() !== playerColorRef.current[0]) {
                console.log("test 3");
                console.log(`[checkGameState] Player ${studentId} is the winner, awarding XP`);
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 2000);
            } else {
                console.warn('[checkGameState] Skipped winner logic: playerColorRef.current is null or not winner', {
                    playerColorRef: playerColorRef.current,
                    turn: chess.turn()
                });
            }
            if (hubConnection && playerColorRef.current) {
                console.log("test 4");
                hubConnection.invoke('EndGame', Number(studentId), 11, playerColorRef.current && chess.turn() !== playerColorRef.current[0], moves.length, 'checkmate')
                    .catch(err => console.error('[checkGameState] EndGame invocation failed:', err));
                console.log("test 4.1: " + playerColorRef.current);
            } else {
                console.warn('[checkGameState] Skipped EndGame invocation: hubConnection or playerColorRef is null', {
                    hubConnection,
                    playerColorRef: playerColorRef.current
                });
            }
        } else if (chess.isStalemate() || chess.isThreefoldRepetition() || chess.isInsufficientMaterial() || chess.isDraw()) {
            console.log("test 5");
            console.log('[checkGameState] Stalemate or draw detected');
            setGameState('stalemate');
            if (hubConnection && playerColorRef.current) {
                console.log("test 6");
                hubConnection.invoke('EndGame', Number(studentId), 11, false, moves.length, 'stalemate')
                    .catch(err => console.error('[checkGameState] EndGame invocation failed:', err));
            } else {
                console.warn('[checkGameState] Skipped EndGame invocation: hubConnection or playerColorRef is null', {
                    hubConnection,
                    playerColorRef: playerColorRef.current
                });
            }
        } else if (chess.inCheck()) {
            console.log("test 7");
            console.log('[checkGameState] Check detected');
            setSystemMessage(`${chess.turn() === 'w' ? 'White' : 'Black'} is in check!`);
            setTimeout(() => setSystemMessage(null), 3000);
        }
    }

    async function handleClick(x, y) {
        console.log(`[handleClick] Clicked at (${x}, ${y}), yourTurn: ${yourTurn}, gameState: ${gameState}, playerColor: ${playerColor}, Board state: ${chess.fen()}`);

        if (!playerColor || !playerColorRef.current || gameState !== 'playing') {
            console.log('[handleClick] Game not initialized or not playing.');
            setErrorMessage('Game state is not ready or the game is not active.');
            return;
        }
        if (!yourTurn) {
            console.log('[handleClick] Not your turn.');
            setErrorMessage('It is not your turn.');
            return;
        }

        if (selectedPiece) {
            console.log(`[handleClick] Selected piece at (${selectedPiece.x}, ${selectedPiece.y}), checking move to (${x}, ${y})`);
            const fromSquare = `${String.fromCharCode(97 + selectedPiece.x)}${8 - selectedPiece.y}`;
            const toSquare = `${String.fromCharCode(97 + x)}${8 - y}`;

            const validMovesList = chess.moves({ square: fromSquare, verbose: true });
            const move = validMovesList.find(m => m.to === toSquare);

            if (move) {
                let promotion = null;
                if (board[selectedPiece.y][selectedPiece.x].toLowerCase() === 'p' && (y === 0 || y === 7)) {
                    promotion = 'q';
                    console.log(`[handleClick] Pawn promotion detected, promoting to queen`);
                }

                const moveData = {
                    type: 'move',
                    from: [selectedPiece.x, selectedPiece.y],
                    to: [x, y],
                    piece: board[selectedPiece.y][selectedPiece.x],
                    notation: move.san,
                    promotion
                };

                try {
                    if (hubConnection.state !== 'Connected') {
                        console.error('[handleClick] SignalR connection is not established, state:', hubConnection.state);
                        setErrorMessage('Connection could not be established, please refresh the page.');
                        return;
                    }

                    console.log(`[handleClick] Sending move: ${JSON.stringify(moveData)}`);
                    await hubConnection.invoke('SendMove', Number(studentId), 11, JSON.stringify(moveData));

                    setSelectedPiece(null);
                    setValidMoves([]);
                    console.log('[handleClick] Move sent, waiting for server confirmation');
                } catch (error) {
                    console.error('[handleClick] Error sending move:', error);
                    setErrorMessage(`Error sending move: ${error.message || 'Unknown error'}`);
                    setSelectedPiece(null);
                    setValidMoves([]);
                }
            } else {
                console.log(`[handleClick] Invalid move to (${x}, ${y})`);
                setErrorMessage('Invalid move.');
                setSelectedPiece(null);
                setValidMoves([]);
            }
        } else {
            const piece = board[y][x];
            if (piece && (piece === piece.toUpperCase()) === (playerColor === 'white')) {
                setSelectedPiece({ x, y });
                const moves = getValidMoves(x, y);
                setValidMoves(moves);
                console.log(`[handleClick] Piece selected: ${piece} at (${x}, ${y}), validMoves: ${JSON.stringify(moves)}`);
            } else {
                console.log(`[handleClick] No valid piece selected at (${x}, ${y})`);
            }
        }
    }

    async function awardXP() {
        const xpRequest = {
            studentId: Number(studentId),
            gameId: 11,
            amount: 100,
            xpType: 1,
            description: 'Chess Game Completed'
        };
        console.log(`[awardXP] Sending XP request: ${JSON.stringify(xpRequest)}`);
        try {
            const earnedAmount = await xpProcess(xpRequest);
            console.log(`[awardXP] XP awarded successfully: ${earnedAmount}`);
            setSystemMessage(`Earned XP: ${earnedAmount}`);
            setTimeout(() => setSystemMessage(null), 3000);
        } catch (error) {
            console.error('[awardXP] Error awarding XP:', error);
            console.error('[awardXP] Error details:', error.response || error.message);
            setErrorMessage(`XP could not be awarded: ${error.message || 'Unknown error'}`);
        }
    }

    const pieceSymbols = {
        'P': '♙', 'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔',
        'p': '♟', 'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚'
    };

    return (
        <div className="chess-container">
            {showConfetti && <Confetti />}

            <div className="chess-game-header">
                <h2>Chess</h2>
                <p className={`chess-instruction ${yourTurn ? 'your-turn' : 'not-your-turn'}`}>
                    {gameState === 'waiting' ? 'Invite a friend to start the game!' :
                        gameState === 'playing' ? (
                            <>
                                You are playing as {playerColor === 'white' ? 'White' : 'Black'}!{' '}
                                {yourTurn ? 'Your turn.' : 'Waiting for opponent\'s move.'}
                            </>
                        ) : (
                            'Game state: ' + (gameState === 'checkmate' ? 'Checkmate' : 'Stalemate')
                        )}
                </p>
                {errorMessage && (
                    <div className="chess-error-message">
                        {errorMessage}
                    </div>
                )}
                {systemMessage && (
                    <div className="chess-system-message">
                        {systemMessage}
                    </div>
                )}
            </div>

            {gameState === 'waiting' ? (
                <div className="chess-waiting-message">
                    <p>Waiting for a friend to join...</p>
                </div>
            ) : (
                <div className="chess-game-container">
                    <div className="chess-board-container">
                        <div className="chess-grid-labels">
                            <div className="chess-row-labels">
                                {Array(8).fill().map((_, i) => (
                                    <div key={i} className="chess-label-row">{8 - i}</div>
                                ))}
                            </div>
                            <div className="chess-column-labels">
                                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((letter) => (
                                    <div key={letter} className="chess-label">{letter}</div>
                                ))}
                            </div>
                            <div className="chess-game-grid">
                                {board.map((row, y) =>
                                    row.map((piece, x) => (
                                        <div
                                            key={`${x}-${y}`}
                                            className={`chess-cell ${(x + y) % 2 === 0 ? 'chess-light' : 'chess-dark'} 
                                                ${selectedPiece && selectedPiece.x === x && selectedPiece.y === y ? 'chess-selected' : ''} 
                                                ${validMoves.some(([mx, my]) => mx === x && my === y) ? 'chess-valid-move' : ''}`}
                                            onClick={() => handleClick(x, y)}
                                        >
                                            {piece && pieceSymbols[piece]}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="chess-move-history">
                        <h3>Move History</h3>
                        <div className="move-history-content">
                            {moveHistory.map((move, index) => (
                                <p key={index}>{move}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {gameState !== 'playing' && gameState !== 'waiting' && (
                <div className="chess-win-message">
                    <h3>
                        {gameState === 'checkmate' && currentPlayer !== playerColor ? 'You Won! 🎉' :
                            gameState === 'checkmate' ? 'You Lost! 😔' : 'Draw! 🤝'}
                    </h3>
                    <p>
                        {gameState === 'checkmate' && currentPlayer !== playerColor ? 'Checkmate! You won the game.' :
                            gameState === 'checkmate' ? 'Checkmate! Opponent won.' : 'The game ended in a stalemate.'}
                    </p>

                    {gameMode !== 'multiple' ? (
                        <button className="chess-play-again-button" onClick={() => {
                            chess.reset();
                            setBoard(fenToBoard(chess.fen()));
                            setGameState('waiting');
                            setMoves([]);
                            setMoveHistory([]);
                        }}>
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

export default ChessGame;
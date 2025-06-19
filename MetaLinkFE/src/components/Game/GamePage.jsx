import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import './GamePage.css';
import SecondNavbar from '../Navbar/SecondNavbar.jsx';
import { PerspectiveProvider } from '../../context/PerspectiveContext.jsx';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { getFriends } from '../../services/student-api.js';
import Modal from 'react-modal';

import ColorMatch from './ColorMatch.jsx';
import StoryCompletion from './StoryCompletionGame.jsx';
import NumberPuzzle from './NumberPuzzleGame.jsx';
import KahootGame from './KahootGame.jsx';
import MemoryMatch from './MemoryGame.jsx';
import ShapeMatch from './ShapeMatchGame.jsx';
import BalloonPop from './BalloonPop.jsx';
import MazePuzzle from './MazeGame.jsx';
import BattleshipGame from './BattleshipGame.jsx';
import ChessGame from './ChessGame.jsx';
import HamsterWheel from '../Spinner/HamsterWheel';

Modal.setAppElement('#root');

const GamePage = () => {
  const { studentId, gameId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { gameMode, gameName } = location.state || {};
  const [userLevel, setUserLevel] = useState(45);
  const [opponentLevel, setOpponentLevel] = useState(30);
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [opponent, setOpponent] = useState(null);
  const [gameStatus, setGameStatus] = useState('idle');
  const [gameKey, setGameKey] = useState(Date.now());
  const [hubConnection, setHubConnection] = useState(null);
  const [inviteNotification, setInviteNotification] = useState(null);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [cards, setCards] = useState(null);
  const [maze, setMaze] = useState(null);
  const [waitingForGame, setWaitingForGame] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [joinedFriends, setJoinedFriends] = useState([]);
  const [isInviter, setIsInviter] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [gameMove, setGameMove] = useState(null);
  const [disconnectionModal, setDisconnectionModal] = useState({ isOpen: false, message: '' });
  const [inviteSentModal, setInviteSentModal] = useState({ isOpen: false, message: '' });
  const [inviteDeclinedModal, setInviteDeclinedModal] = useState({ isOpen: false, message: '' });
  const [gameEndedModal, setGameEndedModal] = useState({ isOpen: false, message: '' });
  const [inviteExpiredModal, setInviteExpiredModal] = useState({ isOpen: false, message: '' });
  const [addFriendModal, setAddFriendModal] = useState({ isOpen: false, message: '' });
  const [difficulty, setDifficulty] = useState(Number(gameId) === 9 ? 'easy' : '4x4');
  const [colorChoice, setColorChoice] = useState('white');
  const [quizTopic, setQuizTopic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTo({
        top: messagesEndRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friendData = await getFriends(studentId);
        const formattedFriends = friendData.map((friend) => {
          const friendId =
            friend.requesterStudentId === Number(studentId)
              ? friend.targetStudentId
              : friend.requesterStudentId;
          return {
            id: friendId,
            name: `User ${friendId}`,
            avatar: `https://i.pravatar.cc/100?img=${friendId}`,
            online: true,
          };
        });
        setFriends(formattedFriends);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();
  }, [studentId]);

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl('https://localhost:7239/gamehub', {
        accessTokenFactory: () => sessionStorage.getItem('studentToken'),
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    setHubConnection(connection);

    connection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.error('SignalR Connection Error:', err));

    connection.onreconnecting((error) => {
      console.log('Connection lost, reconnecting...', error);
      setInviteExpiredModal({
        isOpen: true,
        message: 'Connection lost, reconnecting...',
      });
    });

    connection.onreconnected(() => {
      console.log('Connection reestablished.');
      setInviteExpiredModal({ isOpen: false, message: '' });
    });

    connection.on('ReceiveInvite', (data) => {
      console.log('Received invite:', data);
      setInviteNotification(data);
      setPendingInvites((prev) => [...prev, data]);
    });

    connection.onclose((error) => {
      console.error('Connection closed:', error);
      setDisconnectionModal({
        isOpen: true,
        message: 'Server connection lost. Please refresh the page.',
      });
    });

    connection.on('InviteAccepted', (data) => {
      console.log('Invite accepted:', data);
      setWaitingForGame(true);
      setSessionId(data.sessionId);
      setJoinedFriends([data.inviteeId]);
      setPendingInvite(null);
      setInviteNotification(null);
      setPendingInvites([]);
      setIsInviter(Number(studentId) === data.inviterId);
    });

    connection.on('InviteDeclined', (data) => {
      console.log('Invite declined:', data);
      setInviteDeclinedModal({
        isOpen: true,
        message: `User ${data.studentId} declined your invitation.`,
      });
      setPendingInvite(null);
      setGameStatus('idle');
      setWaitingForGame(false);
      setIsInviter(false);
      setTimeout(() => {
        setInviteDeclinedModal({ isOpen: false, message: '' });
      }, 3000);
    });

    connection.on('InviteExpired', (data) => {
      console.log('Invite expired:', data);
      setInviteExpiredModal({
        isOpen: true,
        message: `Invite expired: ${data.message}`,
      });
      setPendingInvite(null);
      setGameStatus('idle');
      setWaitingForGame(false);
      setIsInviter(false);
      setSessionId(null);
      setJoinedFriends([]);
      setTimeout(() => {
        setInviteExpiredModal({ isOpen: false, message: '' });
      }, 3000);
    });

    connection.on('GameStarted', (data) => {
      console.log('Game started:', data);
      setGameStatus('playing');
      setWaitingForGame(false);
      const opponent = friends.find((f) => f.id !== Number(studentId)) || {
        id: data.studentId,
        name: `User ${data.studentId}`,
      };
      setOpponent(opponent);
      if (data.gameId === 6 || data.gameId === 7) {
        if (data.initialGameState) {
          setCards(JSON.parse(data.initialGameState));
        }
        if (data.initialGameState) {
          setCards(JSON.parse(data.initialGameState));
        }
        if (data.difficulty) {
          setDifficulty(data.difficulty);
        }
      } else if (data.gameId === 8) {
        if (data.initialGameState) {
          window.balloonSequence = JSON.parse(data.initialGameState);
        }
        if (data.difficulty) {
          setDifficulty(data.difficulty);
        }
      } else if (data.gameId === 9) {
        if (data.initialGameState) {
          setMaze(JSON.parse(data.initialGameState));
        }
        if (data.difficulty) {
          setDifficulty(data.difficulty);
        }
      }
    });

    connection.on('GameEnded', (data) => {
      console.log('Game ended:', data);
      setGameStatus('ended');
      setGameEndedModal({
        isOpen: true,
        message: `Game ended! ${data.isWinner && data.studentId === Number(studentId) ? 'You won!' : 'Opponent won!'}`,
      });
      setWaitingForGame(false);
      setJoinedFriends([]);
      setIsInviter(false);
      setTimeout(() => {
        setGameEndedModal({ isOpen: false, message: '' });
      }, 3000);
    });

    connection.on('PlayerDisconnected', (data) => {
      console.log('Player disconnected:', data);
      setDisconnectionModal({
        isOpen: true,
        message: data.message || `User ${data.studentId} disconnected, game is ending.`,
      });
      setGameStatus('ended');
      setOpponent(null);
      setWaitingForGame(false);
      setJoinedFriends([]);
      setIsInviter(false);
      setTimeout(() => {
        setDisconnectionModal({ isOpen: false, message: '' });
        navigate(`/user/${studentId}/game`);
      }, 3000);
    });

    connection.on('InviteError', (data) => {
      console.error('Invite error:', data);
      setInviteExpiredModal({
        isOpen: true,
        message: `Error: ${data.message}`,
      });
      setWaitingForGame(false);
      setIsInviter(false);
      setTimeout(() => {
        setInviteExpiredModal({ isOpen: false, message: '' });
      }, 3000);
    });

    connection.on('ReceiveMove', (data) => {
      console.log('Received move:', data);
      setGameMove(data);
    });

    connection.on('MessageData', (data) => {
      console.log('Received message:', data);
      if (data.studentId !== Number(studentId)) {
        const newMsg = {
          id: messages.length + 1,
          sender: 'opponent',
          text: data.message,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, newMsg]);
      }
    });

    connection.on('SystemMessage', (data) => {
      console.log('Received system message:', data);
      const newMsg = {
        id: messages.length + 1,
        sender: 'system',
        text: data.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, newMsg]);
    });

    return () => {
      connection.stop();
    };
  }, [friends, studentId, gameId, navigate]);

  useEffect(() => {
    let timeout;
    if (waitingForGame && isInviter) {
      timeout = setTimeout(() => {
        if (gameStatus !== 'playing') {
          setInviteExpiredModal({
            isOpen: true,
            message: 'Game could not be started. Please try again.',
          });
          setWaitingForGame(false);
          setIsInviter(false);
          setPendingInvite(null);
          setSessionId(null);
          setJoinedFriends([]);
          setTimeout(() => {
            setInviteExpiredModal({ isOpen: false, message: '' });
          }, 3000);
        }
      }, 10000);
    }
    return () => clearTimeout(timeout);
  }, [waitingForGame, isInviter, gameStatus]);

  useEffect(() => {
    const levelInterval = setInterval(() => {
      if (gameStatus === 'playing') {
        setUserLevel((prev) => Math.min(prev + 1, 100));
        if (gameMode === 'multiple' && opponent) {
          setOpponentLevel((prev) => Math.min(prev + (Math.random() > 0.5 ? 1 : 0), 100));
        }
      }
    }, 3000);

    return () => clearInterval(levelInterval);
  }, [gameStatus, gameMode, opponent]);

  /* useEffect(() => {
   // Set loading to false after a delay when component mounts
   const loadingTimer = setTimeout(() => {
     setIsLoading(false);
   }, 800);
 
   return () => clearTimeout(loadingTimer);
 }, []);*/

  const handleAcceptInvite = async (invite) => {
    if (!hubConnection) return;
    try {
      const inviteId = invite.inviteId || invite.id;
      if (!inviteId) throw new Error('Invite ID is undefined');
      console.log('Accepting invite:', { studentId, inviteId });
      await hubConnection.invoke('AcceptInvite', parseInt(studentId), parseInt(inviteId));
    } catch (error) {
      console.error('Error accepting invite:', error);
      setInviteExpiredModal({
        isOpen: true,
        message: 'Invite could not be accepted: ' + error.message,
      });
      setTimeout(() => {
        setInviteExpiredModal({ isOpen: false, message: '' });
      }, 3000);
    }
  };

  const handleDeclineInvite = async (invite) => {
    if (!hubConnection) return;
    try {
      const inviteId = invite.inviteId || invite.id;
      if (!inviteId) throw new Error('Invite ID is undefined');
      console.log('Declining invite:', { studentId, inviteId });
      await hubConnection.invoke('DeclineInvite', parseInt(studentId), parseInt(inviteId));
      setPendingInvites(pendingInvites.filter((i) => (i.id || i.inviteId) !== inviteId));
      setInviteNotification(null);
    } catch (error) {
      console.error('Error declining invite:', error);
      setInviteExpiredModal({
        isOpen: true,
        message: 'Invite could not be declined: ' + error.message,
      });
      setTimeout(() => {
        setInviteExpiredModal({ isOpen: false, message: '' });
      }, 3000);
    }
  };

  const handleStartGame = async () => {
    if (!hubConnection || !sessionId || isStarting) return;
    if (hubConnection.state !== 'Connected') {
      console.error('SignalR connection is not active:', hubConnection.state);
      setInviteExpiredModal({
        isOpen: true,
        message: 'Server connection lost. Please refresh the page.',
      });
      return;
    }
    setIsStarting(true);
    try {
      let initialGameState = null;
      let topic = null;
      if (Number(gameId) === 11) {
        const opponentColor = colorChoice === 'white' ? 'black' : 'white';
        initialGameState = JSON.stringify({ playerColor: colorChoice, opponentColor });
      } else if (Number(gameId) === 5) {
        if (!quizTopic) {
          setInviteExpiredModal({
            isOpen: true,
            message: 'Please select a quiz topic.',
          });
          setTimeout(() => {
            setInviteExpiredModal({ isOpen: false, message: '' });
          }, 3000);
          setIsStarting(false);
          return;
        }
        topic = quizTopic;
      }
      await hubConnection.invoke('StartGame', parseInt(studentId), parseInt(gameId), sessionId, difficulty, initialGameState, topic);
      console.log('StartGame invoked successfully with difficulty:', difficulty, 'colorChoice:', colorChoice, 'topic:', topic);
    } catch (error) {
      console.error('Error starting game:', error);
      setInviteExpiredModal({
        isOpen: true,
        message: 'Game could not be started: ' + error.message,
      });
      setWaitingForGame(false);
      setIsInviter(false);
      setPendingInvite(null);
      setSessionId(null);
      setJoinedFriends([]);
      setTimeout(() => {
        setInviteExpiredModal({ isOpen: false, message: '' });
      }, 3000);
    } finally {
      setIsStarting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      sender: 'user',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setNewMessage('');

    if (hubConnection && gameStatus === 'playing') {
      try {
        await hubConnection.invoke('SendMessage', parseInt(studentId), newMsg.text);
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages((prev) => prev.slice(0, -1));
        setInviteExpiredModal({
          isOpen: true,
          message: 'Message could not be sent: ' + error.message,
        });
        setTimeout(() => {
          setInviteExpiredModal({ isOpen: false, message: '' });
        }, 3000);
      }
    }
  };

  const handleInviteFriend = async (friendId) => {
    if (!hubConnection) {
      console.error('Hub connection is not established');
      setInviteSentModal({
        isOpen: true,
        message: 'Invite could not be sent: No server connection.',
      });
      setTimeout(() => {
        setInviteSentModal({ isOpen: false, message: '' });
      }, 3000);
      return;
    }

    try {
      await hubConnection.invoke('SendInvite', parseInt(studentId), friendId, parseInt(gameId));
      console.log('Invite sent!');
      setPendingInvite({ friendId, status: 'pending' });
      setIsInviter(true);
      setInviteSentModal({
        isOpen: true,
        message: `Invite sent to User ${friendId}`,
      });
      setTimeout(() => {
        setInviteSentModal({ isOpen: false, message: '' });
      }, 3000);
    } catch (error) {
      console.error('Error sending invite:', error);
      setInviteSentModal({
        isOpen: true,
        message: 'Invite could not be sent. Please try again.',
      });
      setTimeout(() => {
        setInviteSentModal({ isOpen: false, message: '' });
      }, 3000);
    }
  };

  const handleAddFriend = () => {
    setAddFriendModal({
      isOpen: true,
      message: 'To add a friend, please use the My Friends section in your profile.',
    });
    setTimeout(() => {
      setAddFriendModal({ isOpen: false, message: '' });
    }, 5000);
  };

  const handleBackToGames = () => {
    navigate(`/user/${studentId}/home`);
  };

  const getGameComponent = () => {
    const gameIdNum = Number(gameId);

    switch (gameIdNum) {
      case 1:
        return (
          <ColorMatch
            key={gameKey}
            gameStatus={gameStatus}
            gameMode={gameMode}
            hubConnection={hubConnection}
            onBack={handleBackToGames}
          />
        );
      case 3:
        return (
          <StoryCompletion
            key={gameKey}
            gameStatus={gameStatus}
            gameMode={gameMode}
            hubConnection={hubConnection}
            onBack={handleBackToGames}
          />
        );
      case 4:
        return (
          <NumberPuzzle
            key={gameKey}
            gameStatus={gameStatus}
            gameMode={gameMode}
            hubConnection={hubConnection}
            onBack={handleBackToGames}
          />
        );
      case 5:
        return (
          <KahootGame
            key={gameKey}
            gameStatus={gameStatus}
            gameMode={gameMode}
            hubConnection={hubConnection}
            onBack={handleBackToGames}
            studentId={studentId}
            sessionId={sessionId}
            isInviter={isInviter}
          />
        );
      case 6:
        return (
          <MemoryMatch
            key={gameKey}
            gameStatus={gameStatus}
            gameMode={gameMode}
            hubConnection={hubConnection}
            onBack={handleBackToGames}
            initialCards={cards}
            gameMove={gameMove}
            initialDifficulty={difficulty}
          />
        );
      case 7:
        return (
          <ShapeMatch
            key={gameKey}
            gameStatus={gameStatus}
            gameMode={gameMode}
            hubConnection={hubConnection}
            onBack={handleBackToGames}
            initialCards={cards}
            gameMove={gameMove}
            initialDifficulty={difficulty}
          />
        );
      case 8:
        return (
          <BalloonPop
            key={gameKey}
            onBack={handleBackToGames}
          />
        );
      case 9:
        return (
          <MazePuzzle
            key={gameKey}
            gameStatus={gameStatus}
            gameMode={gameMode}
            hubConnection={hubConnection}
            onBack={handleBackToGames}
          />
        );
      case 10:
        return (
          <BattleshipGame
            onBack={handleBackToGames}
            gameStatus={gameStatus}
            gameMode={gameMode}
            hubConnection={hubConnection}
          />
        );
      case 11:
        return (
          <ChessGame
            key={gameKey}
            gameStatus={gameStatus}
            gameMode={gameMode}
            hubConnection={hubConnection}
            onBack={handleBackToGames}
            studentId={studentId}
            sessionId={sessionId}
            isInviter={isInviter}
            colorChoice={colorChoice}
          />
        );
      default:
        return <div>Game not found</div>;
    }
  };

  const quizTopics = ['Mathematics', 'Geography', 'History', 'Science'];

  const renderGameArea = () => {
    return (
      <div className="game-placeholder">
        <div className="game-controls">
          <div className="placeholder-content">{getGameComponent()}</div>
        </div>
      </div>
    );
  };

  return (
    <PerspectiveProvider>
      <div className="game-page">
        <SecondNavbar
          visibleButtons={['testBank', 'lectures', 'avatar', 'profile', 'game', 'logout', 'exitChildPerspective']}
        />
        <div className="game-play-container">
          <div className="game-stats-section">
            <div className="player-stats">
              <div className="avatar-name">
                <div className="avatar">👤</div>
                <div className="player-name">You</div>
              </div>
              <div className="level-progress">
                <div className="level-bar">
                  <div className="level-fill" style={{ width: `${userLevel}%` }}></div>
                </div>
                <div className="level-text">Level: {Math.floor(userLevel / 10)}</div>
              </div>
            </div>
            {gameMode === 'multiple' && opponent && (
              <div className="player-stats opponent">
                <div className="avatar-name">
                  <div className="avatar">👤</div>
                  <div className="player-name">{opponent.name}</div>
                </div>
                <div className="level-progress">
                  <div className="level-bar">
                    <div className="level-fill" style={{ width: `${opponentLevel}%` }}></div>
                  </div>
                  <div className="level-text">Level: {Math.floor(opponentLevel / 10)}</div>
                </div>
              </div>
            )}
          </div>

          <div className="game-area-section">
            <div className="game-area user-game">{renderGameArea()}</div>
          </div>
        </div>

        {gameMode === 'multiple' && (
          <div className="right-side-section">
            {inviteNotification && (
              <div className="invite-notification">
                <p>{`User ${inviteNotification.senderId} invited you to play game ${inviteNotification.gameId}!`}</p>
                <button onClick={() => handleAcceptInvite(inviteNotification)}>Accept</button>
                <button onClick={() => handleDeclineInvite(inviteNotification)}>Decline</button>
              </div>
            )}
            <div className="friends-section">
              <h3>Friends</h3>
              <div className="friends-list">
                {friends.map((friend) => (
                  <div key={friend.id} className="friend-item">
                    <div className="friend-info">
                      <div className={`friend-status ${friend.online ? 'online' : 'offline'}`}></div>
                      <div className="friend-name">{friend.name}</div>
                    </div>
                    <button
                      className="invite-button"
                      onClick={() => handleInviteFriend(friend.id)}
                      disabled={
                        !friend.online ||
                        gameStatus === 'playing' ||
                        (pendingInvite && pendingInvite.friendId !== friend.id) ||
                        joinedFriends.includes(friend.id) ||
                        waitingForGame
                      }
                    >
                      {joinedFriends.includes(friend.id)
                        ? 'Joined'
                        : pendingInvite?.friendId === friend.id && pendingInvite.status === 'pending'
                          ? 'Waiting...'
                          : 'Invite'}
                    </button>
                  </div>
                ))}
              </div>
              <button className="add-friend-button" onClick={handleAddFriend}>
                Add Friend
              </button>
            </div>

            <div className="chat-section">
              <h3>Game Chat</h3>
              <div className="chat-messages" ref={messagesEndRef}>
                {messages.map((msg) => (
                  <div key={msg.id} className={`message ${msg.sender}`}>
                    <div className="message-content">
                      <p>{msg.text}</p>
                      <span className="message-time">{msg.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <form className="gamepage-chat-input" onSubmit={handleSendMessage}>
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="gamepage-submit">Send</button>
              </form>
            </div>
          </div>
        )}

        <Modal
          isOpen={inviteSentModal.isOpen}
          onRequestClose={() => { }}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              maxWidth: '400px',
              backgroundColor: '#fff',
              border: '2px solid #ff9500',
            },
          }}
        >
          <h2>Invite Sent</h2>
          <p>{inviteSentModal.message}</p>
        </Modal>

        <Modal
          isOpen={inviteDeclinedModal.isOpen}
          onRequestClose={() => { }}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              maxWidth: '400px',
              backgroundColor: '#fff',
              border: '2px solid #f44336',
            },
          }}
        >
          <h2>Invite Declined</h2>
          <p>{inviteDeclinedModal.message}</p>
        </Modal>

        <Modal
          isOpen={gameEndedModal.isOpen}
          onRequestClose={() => { }}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              maxWidth: '400px',
              backgroundColor: '#fff',
              border: '2px solid #4caf50',
            },
          }}
        >
          <h2>Game Ended</h2>
          <p>{gameEndedModal.message}</p>
        </Modal>

        <Modal
          isOpen={inviteExpiredModal.isOpen}
          onRequestClose={() => { }}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              maxWidth: '400px',
              backgroundColor: '#fff',
              border: '2px solid #ff9800',
            },
          }}
        >
          <h2>Error</h2>
          <p>{inviteExpiredModal.message}</p>
        </Modal>

        <Modal
          isOpen={addFriendModal.isOpen}
          onRequestClose={() => { }}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              maxWidth: '400px',
              backgroundColor: '#fff',
              border: '2px solid #ff9500',
            },
          }}
        >
          <h2>Add Friend</h2>
          <p>{addFriendModal.message}</p>
        </Modal>

        <Modal
          isOpen={waitingForGame}
          onRequestClose={() => { }}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              maxWidth: '400px',
            },
          }}
        >
          <h2>Start Game</h2>
          <p>{isInviter ? 'Make a selection to start the game...' : 'Waiting for the other player to start the game...'}</p>
          {isInviter ? (
            <div>
              {Number(gameId) === 6 ? (
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="difficulty-select">Memory Match Difficulty: </label>
                  <select
                    id="difficulty-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{
                      padding: '5px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                    }}
                  >
                    <option value="4x4">4x4 (16 Cards)</option>
                    <option value="5x4">5x4 (20 Cards)</option>
                    <option value="6x6">6x6 (36 Cards)</option>
                  </select>
                </div>
              ) : Number(gameId) === 7 ? (
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="difficulty-select">Shape Match Difficulty: </label>
                  <select
                    id="difficulty-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{
                      padding: '5px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                    }}
                  >
                    <option value="2x2">2x2 (Very simple)</option>
                    <option value="3x2">3x2 (Basic)</option>
                    <option value="4x4">4x4 (Medium)</option>
                    <option value="5x4">5x4 (Moderate)</option>
                    <option value="6x6">6x6 (Advanced)</option>
                  </select>
                </div>
              ) : Number(gameId) === 8 ? (
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="difficulty-select">Difficulty Level: </label>
                  <select
                    id="difficulty-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{
                      padding: '5px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                    }}
                  >
                    <option value="easy">Easy (Slow balloons)</option>
                    <option value="medium">Medium (Mixed speeds)</option>
                    <option value="hard">Hard (Fast balloons)</option>
                  </select>
                </div>
              ) : Number(gameId) === 9 ? (
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="difficulty-select">Difficulty Level: </label>
                  <select
                    id="difficulty-select"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    style={{
                      padding: '5px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                    }}
                  >
                    <option value="easy">Easy (5x5)</option>
                    <option value="medium">Medium (7x7)</option>
                    <option value="hard">Hard (10x10)</option>
                    <option value="extreme">Extreme (30x30)</option>
                  </select>
                </div>
              ) : Number(gameId) === 11 ? (
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="color-select">Color Choice: </label>
                  <select
                    id="color-select"
                    value={colorChoice}
                    onChange={(e) => setColorChoice(e.target.value)}
                    style={{
                      padding: '5px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                    }}
                  >
                    <option value="white">White</option>
                    <option value="black">Black</option>
                  </select>
                </div>
              ) : Number(gameId) === 5 ? (
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="topic-select">Quiz Topic: </label>
                  <select
                    id="topic-select"
                    value={quizTopic || ''}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    style={{
                      padding: '5px',
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                    }}
                  >
                    <option value="" disabled>
                      Select a topic
                    </option>
                    {quizTopics.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <button
                onClick={handleStartGame}
                disabled={isStarting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isStarting ? '#ccc' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: isStarting ? 'not-allowed' : 'pointer',
                  marginRight: '10px',
                }}
              >
                {isStarting ? 'Starting...' : 'Start Game'}
              </button>
              <button
                onClick={() => {
                  setWaitingForGame(false);
                  setIsInviter(false);
                  setPendingInvite(null);
                  setSessionId(null);
                  setJoinedFriends([]);
                  setQuizTopic(null);
                  if (hubConnection) {
                    hubConnection.invoke('CancelSession', parseInt(studentId), sessionId).catch((err) => {
                      console.error('Error cancelling session:', err);
                    });
                  }
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <p>Please wait.</p>
          )}
        </Modal>

        <Modal
          isOpen={disconnectionModal.isOpen}
          onRequestClose={() => { }}
          style={{
            content: {
              top: '50%',
              left: '50%',
              right: 'auto',
              bottom: 'auto',
              marginRight: '-50%',
              transform: 'translate(-50%, -50%)',
              padding: '20px',
              borderRadius: '10px',
              textAlign: 'center',
              maxWidth: '400px',
              backgroundColor: '#fff',
              border: '2px solid #f44336',
            },
          }}
        >
          <h2>Disconnected</h2>
          <p>{disconnectionModal.message}</p>
        </Modal>
      </div>
    </PerspectiveProvider>
  );
};

export default GamePage;
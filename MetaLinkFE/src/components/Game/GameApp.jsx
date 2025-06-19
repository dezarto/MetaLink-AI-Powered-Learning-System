import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import './GameApp.css';
import GameModePopup from './GameModePopup';
import SecondNavbar from '../Navbar/SecondNavbar.jsx';
import { PerspectiveProvider } from '../../context/PerspectiveContext.jsx';
import { getAllGames } from '../../services/student-api.js';
import HamsterWheel from '../Spinner/HamsterWheel'; // Import the HamsterWheel component

// Hardcoded game properties for mapping by name
const GAME_PROPERTIES = [
  {
    name: 'Color Match',
    icon: '🎨',
    availableModes: ['single'],
    bgColor: '#FF6B6B',
  },
  {
    name: 'Story Completion',
    icon: '📝',
    availableModes: ['single'],
    bgColor: '#4ECDC4',
  },
  {
    name: 'Number Puzzle',
    icon: '🔢',
    availableModes: ['single'],
    bgColor: '#FFD166',
  },
  {
    name: 'Kahoot',
    icon: '❓',
    availableModes: ['multiple'],
    bgColor: '#6A0572',
  },
  {
    name: 'Memory Match',
    icon: '🧠',
    availableModes: ['single', 'multiple'],
    bgColor: '#1A8FE3',
  },
  {
    name: 'Shape Match',
    icon: '⭐',
    availableModes: ['single', 'multiple'],
    bgColor: '#F94144',
  },
  {
    name: 'Balloon Pop',
    icon: '🎈',
    availableModes: ['single'],
    bgColor: '#F3722C',
  },
  {
    name: 'Maze Puzzle',
    icon: '🧩',
    availableModes: ['single'],
    bgColor: '#F8961E',
  },
  {
    name: 'Admiral Battı',
    icon: '⚓',
    availableModes: ['multiple'],
    bgColor: '#F9C74F',
  },
  {
    name: 'Chess',
    icon: '♟️',
    availableModes: ['multiple'],
    bgColor: '#90BE6D',
  },
];

// Default background colors for unmatched games
const DEFAULT_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFD166',
  '#6A0572',
  '#1A8FE3',
  '#F94144',
  '#F3722C',
  '#F8961E',
  '#F9C74F',
  '#90BE6D',
];

// Map GameTypeEnum to availableModes
const getAvailableModes = (type) => {
  switch (type) {
    case 0: // Single
      return ['single'];
    case 1: // Online
      return ['multiple', 'ai'];
    case 2: // Both
      return ['single', 'multiple', 'ai'];
    default:
      return ['single'];
  }
};

function GameApp() {
  const [timeRemaining, setTimeRemaining] = useState(10 * 60);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [games, setGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Added loading state
  const navigate = useNavigate();
  const location = useLocation();
  const { studentId } = useParams();

  const { topicId, subtopicId } = location.state || {};

  useEffect(() => {
    const fetchGames = async () => {
      setIsLoading(true); // Start loading
      try {
        const apiGames = await getAllGames();
        if (Array.isArray(apiGames)) {
          const filteredGames = apiGames.filter(
            (game) => game.id !== 12 && game.id !== 13
          );

          const mappedGames = filteredGames.map((apiGame, index) => {
            const gameProps =
              GAME_PROPERTIES.find((g) => g.name === apiGame.name) || {
                icon: '🎮',
                availableModes: getAvailableModes(apiGame.type),
                bgColor: DEFAULT_COLORS[index % DEFAULT_COLORS.length],
              };

            return {
              id: apiGame.id,
              name: apiGame.name,
              icon: gameProps.icon,
              availableModes:
                gameProps.availableModes || getAvailableModes(apiGame.type),
              bgColor: gameProps.bgColor,
            };
          });

          setGames(mappedGames);
        } else {
          setGames([]);
        }
      } catch (error) {
        console.error('Oyunları alma hatası:', error);
        setGames([]);
      } finally {
        setTimeout(() => {
          setIsLoading(false);
        }, 800);
      }
    };

    fetchGames();
  }, []);

  const handleGameClick = (game) => {
    setSelectedGame(game);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setSelectedGame(null);
  };

  const handleStartGame = (mode) => {
    console.log(`Starting ${selectedGame.name} in ${mode} mode`);
    setIsPopupOpen(false);

    navigate(`/user/${studentId}/game/${selectedGame.id}`, {
      state: {
        gameMode: mode,
        gameName: selectedGame.name,
      },
    });
  };

  return (
    <PerspectiveProvider>
      <div className="game-app">
        <SecondNavbar
          visibleButtons={['testBank', 'lectures', 'avatar', 'profile', 'game', 'logout', 'exitChildPerspective']}
        />
        <div className="game-container">
          {isLoading ? (
            <div className="game-app-loading-container">
              <div className='game-app-hamster-loading'>
                <HamsterWheel />
              </div>
              <p className="game-app-loading-text">Games Loading...</p>
            </div>
          ) : (
            <div className="game-app-grid">
              {games.map((game) => (
                <div
                  key={game.id}
                  className="game-card"
                  onClick={() => handleGameClick(game)}
                  style={{ backgroundColor: game.bgColor }}
                >
                  <div className="game-icon">{game.icon}</div>
                  <div className="game-name">{game.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isPopupOpen && selectedGame && (
          <GameModePopup
            game={selectedGame}
            onClose={closePopup}
            onStart={handleStartGame}
          />
        )}
      </div>
    </PerspectiveProvider>
  );
}

export default GameApp;
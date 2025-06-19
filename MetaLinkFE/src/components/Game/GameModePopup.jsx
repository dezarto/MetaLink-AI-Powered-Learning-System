import React, { useState } from 'react';
import './GameModePopup.css';

function GameModePopup({ game, onClose, onStart }) {
  const [selectedMode, setSelectedMode] = useState(game.availableModes[0]);

  return (
    <div className="popup-overlay">
      <div className="popup-content" style={{ borderTop: `8px solid ${game.bgColor}` }}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="popup-header">
          <div className="popup-icon" style={{ backgroundColor: game.bgColor }}>{game.icon}</div>
          <h2>{game.name}</h2>
        </div>
        
        <div className="popup-body">
          <p>Select your preferred game mode:</p>
          
          <div className="mode-options">
            {game.availableModes.includes('single') && (
              <div 
                className={`mode-option ${selectedMode === 'single' ? 'selected' : ''}`}
                onClick={() => setSelectedMode('single')}
              >
                <div className="mode-icon">👤</div>
                <div className="mode-name">Single Player</div>
              </div>
            )}
            
            {game.availableModes.includes('multiple') && (
              <div 
                className={`mode-option ${selectedMode === 'multiple' ? 'selected' : ''}`}
                onClick={() => setSelectedMode('multiple')}
              >
                <div className="mode-icon">👥</div>
                <div className="mode-name">Multiplayer</div>
              </div>
            )}
            
            {game.availableModes.includes('ai') && (
              <div 
                className={`mode-option ${selectedMode === 'ai' ? 'selected' : ''}`}
                onClick={() => setSelectedMode('ai')}
              >
                <div className="mode-icon">🤖</div>
                <div className="mode-name">Play vs AI</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="popup-footer">
          <button 
            className="start-button"
            onClick={() => onStart(selectedMode)}
            style={{ backgroundColor: game.bgColor }}
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
}

export default GameModePopup;
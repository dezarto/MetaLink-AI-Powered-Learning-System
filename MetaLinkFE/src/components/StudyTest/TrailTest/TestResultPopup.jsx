import React, { useState, useEffect } from 'react';

// Test Result Popup Component
const TestResultPopup = ({ studentCorrectAnswers, studentWrongAnswers, studentDurationInMillis, avgCorrectAnswers, isSuccessful, onClose }) => {
  const isAboveAverage = studentCorrectAnswers > avgCorrectAnswers;

  // Format duration from milliseconds to minutes and seconds
  const formatDuration = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="trailtest-popup-overlay">
      <div className="trailtest-popup">
        <div className="trailtest-popup-header">
          <h2>{isSuccessful ? 'Congratulations!' : 'Test Completed'}</h2>
        </div>
        <div className="trailtest-popup-content">
          {isSuccessful ? (
            <>
              <p>You did a great job! Keep working for the continuation of your success.</p>
              <div className="trailtest-popup-stats">
                <div className="trailtest-popup-stat">
                  <span>Your Correct Answers:</span>
                  <span className="trailtest-popup-stat-value trailtest-correct-count">{studentCorrectAnswers}</span>
                </div>
                <div className="trailtest-popup-stat">
                  <span>Your Wrong Answers:</span>
                  <span className="trailtest-popup-stat-value trailtest-incorrect-count">{studentWrongAnswers}</span>
                </div>
                <div className="trailtest-popup-stat">
                  <span>Your Time:</span>
                  <span className="trailtest-popup-stat-value">{formatDuration(studentDurationInMillis)}</span>
                </div>
                <div className="trailtest-popup-stat">
                  <span>Average Correct Answers:</span>
                  <span className="trailtest-popup-stat-value">{avgCorrectAnswers}</span>
                </div>
                {isAboveAverage && (
                  <div className="trailtest-popup-achievement">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ffc107" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                    <span>You scored above average!</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <p>You've completed the test. Review your answers to improve.</p>
              <div className="trailtest-popup-stats">
                <div className="trailtest-popup-stat">
                  <span>Your Correct Answers:</span>
                  <span className="trailtest-popup-stat-value trailtest-correct-count">{studentCorrectAnswers}</span>
                </div>
                <div className="trailtest-popup-stat">
                  <span>Your Wrong Answers:</span>
                  <span className="trailtest-popup-stat-value trailtest-incorrect-count">{studentWrongAnswers}</span>
                </div>
                <div className="trailtest-popup-stat">
                  <span>Your Time:</span>
                  <span className="trailtest-popup-stat-value">{formatDuration(studentDurationInMillis)}</span>
                </div>
                <div className="trailtest-popup-stat">
                  <span>Average Correct Answers:</span>
                  <span className="trailtest-popup-stat-value">{avgCorrectAnswers}</span>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="trailtest-popup-footer">
          <button onClick={onClose} className="trailtest-popup-button">
            See Detailed Test Result
          </button>
        </div>
      </div>
    </div>
  );
};

// Average Comparison Component
const AverageComparison = ({ avgCorrectAnswers, avgWrongAnswers, avgDurationInMillis, studentCorrectAnswers, studentWrongAnswers, studentDurationInMillis }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Format duration from milliseconds to minutes and seconds
  const formatDuration = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="trailtest-average-comparison">
      <div
        className="trailtest-average-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Class Average Comparison</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isOpen && (
        <div className="trailtest-average-details">
          <div className="trailtest-score-detail">
            <span>Class Avg. Correct:</span>
            <span className="trailtest-avg-correct-count">{avgCorrectAnswers}</span>
          </div>
          <div className="trailtest-score-detail">
            <span>Class Avg. Wrong:</span>
            <span className="trailtest-avg-incorrect-count">{avgWrongAnswers}</span>
          </div>
          <div className="trailtest-score-detail">
            <span>Class Avg. Time:</span>
            <span className="trailtest-avg-time">{formatDuration(avgDurationInMillis)}</span>
          </div>
          <div className="trailtest-score-detail">
            <span>Your Time:</span>
            <span className="trailtest-avg-time">{formatDuration(studentDurationInMillis)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export { TestResultPopup, AverageComparison };
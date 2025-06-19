import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './RoadMap.css';
import { getCourseLessonAndSubLessonInformationByStudentId, getCourseProgressByStudentId } from '../../services/student-api.js';

const PremiumRoadmap = ({ courseId, studentId, onNodeClick }) => {
  const navigate = useNavigate();
  const [activeNode, setActiveNode] = useState(null);
  const [isHovering, setIsHovering] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [currentView, setCurrentView] = useState('main');
  const [currentMainTopic, setCurrentMainTopic] = useState(null);
  const [subTopics, setSubTopics] = useState([]);
  const [courseData, setCourseData] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 5 });
  const [isScrolling, setIsScrolling] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    setViewportWidth(window.innerWidth);
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseResponse, progressResponse] = await Promise.all([
          getCourseLessonAndSubLessonInformationByStudentId(studentId),
          getCourseProgressByStudentId(studentId)
        ]);
        const selectedCourse = courseResponse.courses.find(course => course.courseID === courseId);
        const selectedProgress = progressResponse.find(progress => progress.courseID === courseId);
        setCourseData(selectedCourse);
        setProgressData(selectedProgress);
      } catch (err) {
        console.error('An error occurred while retrieving data:', err);
      }
    };

    fetchData();
  }, [courseId, studentId]);

  const getCompletionLevelFromProgress = (progress) => {
    if (progress === undefined || progress === null) return 0;
    if (progress <= 25) return 0;
    if (progress <= 50) return 1;
    if (progress <= 75) return 2;
    return 3;
  };

  const handleNodeClick = (nodeId) => {
    if (currentView === 'main') {
      setCurrentMainTopic(nodeId);
      fetchSubTopics(nodeId);
      setCurrentView('sub');
      setVisibleRange({ start: 0, end: 5 });
      setScrollPosition(0);
    } else {
      setActiveNode(nodeId);
      if (onNodeClick) {
        onNodeClick(nodeId);
      }
    }
  };

  const fetchSubTopics = (lessonId) => {
    const lesson = courseData?.lessons.find(l => l.id === lessonId);
    const lessonProgress = progressData?.lessonsProgress.find(lp => lp.lessonID === lessonId);
    if (lesson && lessonProgress) {
      const subTopicsData = lesson.subLessons.map(sub => {
        const subProgress = lessonProgress.subLessonsProgress.find(sp => sp.subLessonID === sub.subLessonID) || {};
        return {
          id: sub.subLessonID,
          title: sub.title,
          lessonObjective: sub.lessonObjective || 'Objective not found',
          isCompleted: subProgress.isCompleted || false,
          isGame: sub.title.toLowerCase().includes('oyun'),
          completionLevel: getCompletionLevelFromProgress(subProgress.progress),
          progress: subProgress.progress || 0
        };
      });
      setSubTopics(subTopicsData);
      setActiveNode(null);
    }
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setCurrentMainTopic(null);
    setActiveNode(null);
    setSubTopics([]);
    setVisibleRange({ start: 0, end: 5 });
    setScrollPosition(0);
  };

  const handleGoToStudyPage = (nodeId) => {
    const isGameContent = isGame(nodeId);
    const topicId = currentMainTopic;
    const subLessonId = nodeId;

    if (isGameContent) {
      navigate('/game', {
        state: {
          topicId,
          subLessonId,
          from: 'roadmap'
        }
      });
    } else {
      navigate(`/user/${studentId}/study/${subLessonId}`, {
        state: {
          topicId,
          subLessonId,
          isGame: false
        }
      });
    }
  };

  const isCompleted = (nodeId) => {
    if (currentView === 'main') {
      const lessonProgress = progressData?.lessonsProgress.find(lp => lp.lessonID === nodeId);
      return lessonProgress?.isCompleted || false;
    } else {
      const subtopic = subTopics.find(topic => topic.id === nodeId);
      return subtopic ? subtopic.isCompleted : false;
    }
  };

  const getCompletionLevel = (nodeId) => {
    if (currentView === 'main') {
      const lessonProgress = progressData?.lessonsProgress.find(lp => lp.lessonID === nodeId);
      return getCompletionLevelFromProgress(lessonProgress?.progress);
    } else {
      const subtopic = subTopics.find(topic => topic.id === nodeId);
      return subtopic ? subtopic.completionLevel : 0;
    }
  };

  const getProgress = (nodeId) => {
    if (currentView === 'main') {
      const lessonProgress = progressData?.lessonsProgress.find(lp => lp.lessonID === nodeId);
      return lessonProgress?.progress || 0;
    } else {
      const subtopic = subTopics.find(topic => topic.id === nodeId);
      return subtopic ? subtopic.progress : 0;
    }
  };

  const isActive = (nodeId) => {
    return false;
  };

  const isFuture = (nodeId) => {
    if (currentView === 'main') {
      return !isCompleted(nodeId);
    } else {
      const subtopic = subTopics.find(topic => topic.id === nodeId);
      return subtopic ? !subtopic.isCompleted : true;
    }
  };

  const isGame = (nodeId) => {
    if (currentView === 'sub') {
      const subtopic = subTopics.find(topic => topic.id === nodeId);
      return subtopic ? subtopic.isGame : false;
    }
    return false;
  };

  const getPathPoints = () => {
    const points = [];
    const startX = 100;
    const startY = 180;
    const horizontalSpacing = 140;
    const verticalDelta = 50;

    let currentX = startX;
    let currentY = startY;
    let direction = 1;
    let nodesInCurrentDirection = 0;

    const nodesToUse = currentView === 'main'
      ? (courseData?.lessons.length || 0)
      : (subTopics.length || 0);

    for (let i = 0; i < nodesToUse; i++) {
      points.push({ x: currentX, y: currentY });

      currentX += horizontalSpacing;
      nodesInCurrentDirection++;
      if (nodesInCurrentDirection >= 4) {
        direction *= -1;
        nodesInCurrentDirection = 0;
      }

      currentY += direction * verticalDelta;
      currentY = Math.max(100, Math.min(300, currentY));
    }

    return points;
  };

  const getVisiblePathPoints = (allPoints) => {
    return allPoints.slice(visibleRange.start, visibleRange.end + 1);
  };

  const handleScroll = (direction) => {
    if (isScrolling) return;

    const totalNodes = currentView === 'main'
      ? (courseData?.lessons.length || 0)
      : (subTopics.length || 0);

    if (direction === 'right' && visibleRange.end < totalNodes - 1) {
      const newStart = Math.min(visibleRange.start + 3, totalNodes - 6);
      const newEnd = Math.min(newStart + 5, totalNodes - 1);

      setIsScrolling(true);

      const startPos = scrollPosition;
      const endPos = newStart * 140;
      const duration = 500;
      const startTime = Date.now();

      const animateScroll = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed < duration) {
          const progress = elapsed / duration;
          const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;

          const newPos = startPos + (endPos - startPos) * easeProgress;
          setScrollPosition(newPos);
          requestAnimationFrame(animateScroll);
        } else {
          setScrollPosition(endPos);
          setVisibleRange({ start: newStart, end: newEnd });
          setIsScrolling(false);
        }
      };

      requestAnimationFrame(animateScroll);
    } else if (direction === 'left' && visibleRange.start > 0) {
      const newStart = Math.max(visibleRange.start - 3, 0);
      const newEnd = newStart + 5;

      setIsScrolling(true);

      const startPos = scrollPosition;
      const endPos = newStart * 140;
      const duration = 500;
      const startTime = Date.now();

      const animateScroll = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;

        if (elapsed < duration) {
          const progress = elapsed / duration;
          const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;

          const newPos = startPos + (endPos - startPos) * easeProgress;
          setScrollPosition(newPos);
          requestAnimationFrame(animateScroll);
        } else {
          setScrollPosition(endPos);
          setVisibleRange({ start: newStart, end: newEnd });
          setIsScrolling(false);
        }
      };

      requestAnimationFrame(animateScroll);
    }
  };

  const renderScrollButtons = () => {
    const totalNodes = currentView === 'main'
      ? (courseData?.lessons.length || 0)
      : (subTopics.length || 0);

    const showLeftButton = visibleRange.start > 0;
    const showRightButton = visibleRange.end < totalNodes - 1;

    return (
      <>
        {showLeftButton && (
          <g
            className="premium-roadmap-scroll-button left"
            transform="translate(30, 360)"
            onClick={() => !isScrolling && handleScroll('left')}
          >
            <circle r="20" fill="#4C1D95" filter="url(#nodeShadow)" />
            <path d="M 5,-8 L -8,0 L 5,8" stroke="white" strokeWidth="3" fill="none" />
          </g>
        )}

        {showRightButton && (
          <g
            className="premium-roadmap-scroll-button right"
            transform={`translate(${viewBoxWidth - 30}, 360)`}
            onClick={() => !isScrolling && handleScroll('right')}
          >
            <circle r="20" fill="#4C1D95" filter="url(#nodeShadow)" />
            <path d="M -5,-8 L 8,0 L -5,8" stroke="white" strokeWidth="3" fill="none" />
          </g>
        )}
      </>
    );
  };

  const createSmoothPath = (points) => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const current = points[i];
      const prev = points[i - 1];

      const cp1x = prev.x + (current.x - prev.x) / 3;
      const cp1y = prev.y;
      const cp2x = current.x - (current.x - prev.x) / 3;
      const cp2y = current.y;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${current.x} ${current.y}`;
    }

    return path;
  };

  const renderCompletionStars = (x, y, completionLevel) => {
    const starPoints = "0,-10 2.9,-3.1 10,-3.1 4.1,1.2 6.9,8.1 0,4 -6.9,8.1 -4.1,1.2 -10,-3.1 -2.9,-3.1";
    const starSpacing = 16;
    const starsArray = [0, 1, 2];

    return (
      <g className="premium-roadmap-completion-stars" transform={`translate(${x}, ${y + 58})`}>
        {starsArray.map((starIndex) => {
          const starX = (starIndex - 1) * starSpacing;
          const isCompleted = starIndex < completionLevel;

          return (
            <g key={`star-${starIndex}`} transform={`translate(${starX}, 0) scale(0.8)`}>
              <polygon
                points={starPoints}
                fill={isCompleted ? "url(#starGradient)" : "#D1D5DB"}
                stroke={isCompleted ? "#F59E0B" : "#9CA3AF"}
                strokeWidth="1"
                opacity={isCompleted ? 1 : 0.5}
                filter={isCompleted ? "url(#starGlow)" : ""}
              />
            </g>
          );
        })}
      </g>
    );
  };

  const renderGameBox = (point, nodeId) => {
    if (currentView !== 'sub' || !isGame(nodeId)) return null;

    return (
      <g key={`game-${nodeId}`} transform={`translate(${point.x - 25}, ${point.y - 75})`}>
        <rect
          x="0" y="0"
          width="50" height="50"
          rx="5"
          fill="url(#giftBoxGradient)"
          filter="url(#nodeShadow)"
        />
        <rect
          x="0" y="-8"
          width="50" height="8"
          rx="2"
          fill="#1E40AF"
        />
        <rect
          x="21" y="-8"
          width="8" height="58"
          fill="url(#giftRibbonGradient)"
        />
        <path
          d="M 15 -8 C 15 -20, 35 -20, 35 -8"
          stroke="#EC4899"
          strokeWidth="8"
          fill="none"
          filter="url(#rockShadow)"
        />
        <text
          x="25" y="70"
          textAnchor="middle"
          className="premium-roadmap-game-label"
        >
          Oyun
        </text>
      </g>
    );
  };

  if (!courseData || !progressData) {
    return <div>Loading...</div>;
  }

  const allPathPoints = getPathPoints();
  const visiblePathPoints = getVisiblePathPoints(allPathPoints);
  const minX = Math.min(...visiblePathPoints.map(p => p.x)) - 100;
  const maxX = Math.max(...visiblePathPoints.map(p => p.x)) + 100;

  // Calculate responsive viewBox width based on screen size
  // Calculate responsive viewBox width based on screen size
const getResponsiveViewBoxWidth = () => {
  const baseWidth = maxX - minX;
  const totalNodes = currentView === 'main'
    ? (courseData?.lessons.length || 0)
    : (subTopics.length || 0);

  // Define breakpoints and corresponding width multipliers (original system)
  let calculatedWidth;
  
  if (viewportWidth <= 501) {
    // Mobile phones
    calculatedWidth = Math.max(baseWidth, 500);
  } else if (viewportWidth <= 510) {
    // Tablets
    calculatedWidth = Math.max(baseWidth, 701);
  } else if (viewportWidth <= 573) {
    // Tablets
    calculatedWidth = Math.max(baseWidth, 700);
  } else if (viewportWidth <= 589) {
    // Tablets
    calculatedWidth = Math.max(baseWidth, 720);
  } else if (viewportWidth <= 640) {
    // Tablets
    calculatedWidth = Math.max(baseWidth, 770);
  } else if (viewportWidth <= 669) {
    // Small laptops
    calculatedWidth = Math.max(baseWidth, 820);
  } else if (viewportWidth <= 720) {
    // Small laptops
    calculatedWidth = Math.max(baseWidth, 890);
  } else if (viewportWidth <= 769) {
    // Standard laptops/desktops
    calculatedWidth = Math.max(baseWidth, 950);
  } else if (viewportWidth <= 1421) {
    // Standard laptops/desktops
    calculatedWidth = Math.max(baseWidth, 100);
  } else if (viewportWidth <= 1600) {
    // Standard laptops/desktops
    calculatedWidth = Math.max(baseWidth, 700);
  } else {
    // Large screens
    calculatedWidth = Math.max(baseWidth, 900);
  }

  // Only for single node, prevent excessive zooming by ensuring reasonable minimum
  if (totalNodes === 1) {
    calculatedWidth = Math.max(calculatedWidth, 600);
  }

  return calculatedWidth;
};

  const viewBoxWidth = getResponsiveViewBoxWidth();
  const viewBox = `0 0 ${viewBoxWidth} 400`;

  const transformStyle = {
    transform: `translateX(${-scrollPosition}px)`,
    transition: isScrolling ? 'none' : 'transform 0.5s ease'
  };

  return (
    <div className="premium-roadmap-container">
      <svg
        ref={svgRef}
        viewBox={viewBox}
        className="premium-roadmap-svg"
      >
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="100%" stopColor="#FDE68A" />
          </linearGradient>

          <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>

          <linearGradient id="roadBorderGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDBA74" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>

          <linearGradient id="nodeActiveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#7E22CE" />
          </linearGradient>

          <linearGradient id="nodeCompletedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#15803D" />
          </linearGradient>

          <linearGradient id="nodeFutureGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>

          <linearGradient id="grassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#84CC16" />
            <stop offset="100%" stopColor="#65A30D" />
          </linearGradient>

          <linearGradient id="flowerCenter" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#EAB308" />
          </linearGradient>

          <linearGradient id="starGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>

          <linearGradient id="rockGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E7E5E4" />
            <stop offset="100%" stopColor="#A8A29E" />
          </linearGradient>

          <linearGradient id="giftBoxGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <linearGradient id="giftRibbonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#DB2777" />
          </linearGradient>

          <filter id="roadShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#7C2D12" floodOpacity="0.3" />
          </filter>

          <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.3)" />
          </filter>

          <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.3" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" mode="screen" />
          </filter>

          <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.5" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" mode="screen" />
          </filter>

          <filter id="greenShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#365314" floodOpacity="0.3" />
          </filter>

          <filter id="rockShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="1" dy="2" stdDeviation="1" floodColor="rgba(0,0,0,0.3)" />
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="url(#skyGradient)" />

        {currentView === 'sub' && (
          <g
            onClick={handleBackToMain}
            className="premium-roadmap-back-button"
            transform="translate(50, 50)"
          >
            <circle r="24" fill="#4C1D95" filter="url(#nodeShadow)" />
            <circle r="22" fill="#6D28D9" />
            <path d="M 5,-10 L -10,0 L 5,10" stroke="white" strokeWidth="4" fill="none" />
            <circle r="30" fill="transparent" />
          </g>
        )}

        {renderScrollButtons()}

        <g style={transformStyle}>
          {allPathPoints.map((point, index) => {
            const nodeId = currentView === 'main'
              ? courseData.lessons[index]?.id
              : subTopics[index]?.id;
            return renderGameBox(point, nodeId);
          })}

          {allPathPoints.map((point, index) => {
            const nodeId = currentView === 'main'
              ? courseData.lessons[index]?.id
              : subTopics[index]?.id;
            if (isCompleted(nodeId)) return null;
            return (
              <g key={`greenarea-${nodeId}`}>
                <ellipse
                  cx={point.x}
                  cy={point.y + 40}
                  rx={60}
                  ry={35}
                  fill="url(#grassGradient)"
                  filter="url(#greenShadow)"
                />
                <circle cx={point.x - 15} cy={point.y + 35} r={6} fill="white" />
                <circle cx={point.x - 15} cy={point.y + 35} r={3} fill="url(#flowerCenter)" />
                <circle cx={point.x + 10} cy={point.y + 30} r={5} fill="white" />
                <circle cx={point.x + 10} cy={point.y + 30} r={2.5} fill="url(#flowerCenter)" />
              </g>
            );
          })}

          <path
            d={createSmoothPath(allPathPoints)}
            fill="none"
            stroke="rgba(124, 45, 18, 0.5)"
            strokeWidth="32"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="blur(8px)"
            transform="translate(0, 8)"
          />

          <path
            d={createSmoothPath(allPathPoints)}
            fill="none"
            stroke="url(#roadGradient)"
            strokeWidth="28"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <path
            d={createSmoothPath(allPathPoints)}
            fill="none"
            stroke="url(#roadBorderGradient)"
            strokeWidth="24"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {allPathPoints.map((point, index) => {
            const nodeId = currentView === 'main'
              ? courseData.lessons[index]?.id
              : subTopics[index]?.id;
            if (!nodeId) return null;

            const nodeStatus = isCompleted(nodeId)
              ? 'completed'
              : isActive(nodeId)
                ? 'active'
                : 'future';

            const gradientId = nodeStatus === 'completed'
              ? 'nodeCompletedGradient'
              : nodeStatus === 'active'
                ? 'nodeActiveGradient'
                : 'nodeFutureGradient';

            const isHovered = isHovering === nodeId;
            const nodeScale = isHovered ? 1.1 : 1;
            const glowEffect = (isHovered || nodeStatus === 'active') ? 'url(#nodeGlow)' : '';

            const nodeTitle = currentView === 'main'
              ? courseData.lessons[index]?.title
              : subTopics[index]?.title;

            const completionLevel = getCompletionLevel(nodeId);

            const isVisible = index >= visibleRange.start && index <= visibleRange.end;
            if (!isVisible) return null;

            return (
              <g
                key={`node-${nodeId}`}
                transform={`translate(${point.x}, ${point.y}) scale(${nodeScale})`}
                className="premium-roadmap-node-group"
              >
                <circle r="22" fill="rgba(0,0,0,0.3)" filter="blur(4px)" transform="translate(2,4)" />
                <circle r="22" fill={nodeStatus === 'completed' ? "#15803D" : "#4C1D95"} filter="url(#nodeShadow)" />
                <circle r="20" fill={`url(#${gradientId})`} filter={glowEffect} />
                <ellipse cx="0" cy="-8" rx="12" ry="8" fill="rgba(255,255,255,0.3)" transform="rotate(-15)" />

                {nodeStatus === 'completed' ? (
                  <text x="0" y="6" className="premium-roadmap-node-checkmark">
                    ✓
                  </text>
                ) : currentView === 'main' ? (
                  <text x="0" y="6" className={`premium-roadmap-node-number ${index + 1 > 9 ? 'premium-roadmap-node-number-double-digit' : ''}`}>
                    {index + 1}
                  </text>
                ) : completionLevel === 3 ? (
                  <text x="0" y="6" className="premium-roadmap-node-checkmark">
                    ✓
                  </text>
                ) : (
                  <text x="0" y="6" className="premium-roadmap-node-arrow">
                    →
                  </text>
                )}

                <text
                  x="0" y="45"
                  className="premium-roadmap-node-title"
                >
                  {nodeTitle}
                </text>

                {renderCompletionStars(0, 0, completionLevel)}

                {isHovered && (
                  <circle r="25" className="premium-roadmap-node-hover-ring" />
                )}

                <circle
                  r="30"
                  className="premium-roadmap-node-click-area"
                  onMouseEnter={() => setIsHovering(nodeId)}
                  onMouseLeave={() => setIsHovering(null)}
                  onClick={() => handleNodeClick(nodeId)}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {activeNode && (
        <div className="premium-roadmap-node-details">
          <div className="premium-roadmap-node-details-header">
            <div className={`premium-roadmap-node-details-icon ${isCompleted(activeNode) ? 'completed' : isActive(activeNode) ? 'active' : 'future'}`}>
              {isCompleted(activeNode) ? '✓' : currentView === 'main' ? activeNode : getProgress(activeNode) === 100 ? '✓' : '→'}
            </div>
            <h3 className="premium-roadmap-node-details-title">
              {currentView === 'main'
                ? courseData.lessons.find(l => l.id === activeNode)?.title
                : subTopics.find(topic => topic.id === activeNode)?.title}
            </h3>
          </div>

          <p className="premium-roadmap-node-details-content">
            {isGame(activeNode)
              ? 'Game content will be displayed here.'
              : (currentView === 'main'
                ? courseData.lessons.find(l => l.id === activeNode)?.lessonObjective
                : subTopics.find(topic => topic.id === activeNode)?.lessonObjective) || 'Objective not found'}
          </p>

          <div className="premium-roadmap-node-details-buttons">
            {currentView === 'sub' && (
              <button
                className={`premium-roadmap-node-details-button ${isGame(activeNode) ? 'game' : ''}`}
                onClick={() => handleGoToStudyPage(activeNode)}
              >
                {isGame(activeNode) ? 'Play the Game' : getProgress(activeNode) === 100 ? 'Repeat This Step' : 'Complete This Step'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumRoadmap;
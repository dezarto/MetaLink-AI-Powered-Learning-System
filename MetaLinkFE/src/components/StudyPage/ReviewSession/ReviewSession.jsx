import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePerspective } from '../../../context/PerspectiveContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './ReviewSession.css';
import SecondNavbar from "../../Navbar/SecondNavbar.jsx";
import PencilWheel from "../../Spinner/PencilWheel.jsx";
import {
  studyReviewContentBySubLessonId,
  getReviewContentImageStatus,
  askQuestionContentAssistantRobot,
  generateTest,
  askTestAssistantRobot,
  saveTestResult
} from '../../../services/student-api.js';

const ImagePlaceholder = () => (
  <div className="image-placeholder">
    <div className="spinner"></div>
  </div>
);

const MarkdownContent = memo(({ content, images }) => {
  const imagePlaceholders = ['[IMAGE1]', '[IMAGE2]', '[IMAGE3]'];

  const renderContent = () => {
    let parts = [content || 'Content could not be loaded.'];
    imagePlaceholders.forEach((placeholder, index) => {
      parts = parts.flatMap(part => {
        if (typeof part !== 'string') return [part];
        if (!part.includes(placeholder)) return [part];
        const splitParts = part.split(placeholder);
        return splitParts.reduce((acc, curr, i) => {
          if (i < splitParts.length - 1) {
            return [
              ...acc,
              curr,
              images[index] ? (
                <img
                  key={`img-${index}-${i}`}
                  src={images[index]}
                  alt={`Image ${index + 1}`}
                  className="content-image"
                  onError={(e) => {
                    console.error(`Image failed to load: ${images[index]}`);
                    e.target.src = 'https://via.placeholder.com/150';
                  }}
                  onLoad={() => console.log(`Image loaded successfully: ${images[index]}`)}
                />
              ) : (
                <ImagePlaceholder key={`placeholder-${index}-${i}`} />
              )
            ];
          }
          return [...acc, curr];
        }, []);
      });
    });

    return parts;
  };

  return (
    <div>
      {renderContent().map((part, index) => {
        if (typeof part === 'string') {
          return (
            <ReactMarkdown
              key={`markdown-${index}`}
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ src, ...props }) => {
                  if (!src || src.trim() === '') {
                    return null;
                  }
                  return (
                    <img
                      {...props}
                      src={src}
                      className="content-image"
                      onError={(e) => {
                        console.error(`Image failed to load: ${src}`);
                        e.target.src = 'https://via.placeholder.com/150';
                      }}
                      onLoad={() => console.log(`Image loaded successfully: ${src}`)}
                    />
                  );
                }
              }}
            >
              {part}
            </ReactMarkdown>
          );
        }
        return part;
      })}
    </div>
  );
});

const ReviewSession = () => {
  const navigate = useNavigate();
  const { studentId, subLessonId } = useParams();
  const { isChildPerspective } = usePerspective();
  const [activeTab, setActiveTab] = useState('topic');
  const [testTimer, setTestTimer] = useState(60);
  const [testUnlocked, setTestUnlocked] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [testCompleted, setTestCompleted] = useState(false);
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(false);
  const [chatPanelExpanded, setChatPanelExpanded] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'MetaLink AI', message: isChildPerspective ? 'Content Assistant is disabled in child perspective!' : 'Please select an assistant mode below to continue.' }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [contentText, setContentText] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState(null);
  const [testStarted, setTestStarted] = useState(false);
  const [testTimeLeft, setTestTimeLeft] = useState(0);
  const [testStartTime, setTestStartTime] = useState(null);
  const [testEndTime, setTestEndTime] = useState(null);
  const [testInProgress, setTestInProgress] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [testId, setTestId] = useState(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [prevSolvedTestExists, setPrevSolvedTestExists] = useState(false);
  const [reviewSessionId, setReviewSessionId] = useState(null);
  const [contentImages, setContentImages] = useState([null, null, null]);
  const [summaryImages, setSummaryImages] = useState([null, null]);
  const [isTestSolved, setIsTestSolved] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const hasFetched = useRef(false);
  const chatContainerRef = useRef(null);
  const testTimerIntervalRef = useRef(null);
  const contentImagePollIntervalRef = useRef(null);
  const summaryImagePollIntervalRef = useRef(null);

  const baseUrl = 'https://localhost:7239';

  useEffect(() => {
    let interval = null;
    if (testTimer > 0 && !testUnlocked) {
      interval = setInterval(() => {
        setTestTimer(prevTime => {
          if (prevTime <= 1) {
            setTestUnlocked(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [testTimer, testUnlocked]);

  useEffect(() => {
    if (testInProgress && testTimeLeft > 0) {
      testTimerIntervalRef.current = setInterval(() => {
        setTestTimeLeft(prevTime => {
          if (prevTime <= 1) {
            endTest(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (testTimeLeft <= 0 && testInProgress) {
      endTest(true);
    }
    return () => {
      if (testTimerIntervalRef.current) {
        clearInterval(testTimerIntervalRef.current);
      }
    };
  }, [testInProgress, testTimeLeft]);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchStudyContent();
      checkPreviouslySolvedTest();
      hasFetched.current = true;
    }
  }, [studentId, subLessonId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (assistantMode) {
      setChatMessages([{
        sender: 'MetaLink AI',
        message: `${assistantMode === 'contentsum' ? 'Content & Summary' : 'Test'} assistant mode activated. How can I help you?`
      }]);
    }
  }, [assistantMode]);

  useEffect(() => {
    if (activeTab === 'topic' && !isLoading) {
      const contentArea = document.querySelector('.topic-content.scrollable');
      if (contentArea) contentArea.scrollTop = 0;
    }
  }, [activeTab, isLoading, contentText]);

  useEffect(() => {
    if (!reviewSessionId) {
      console.log('Content polling skipped: reviewSessionId is missing');
      return;
    }
    console.log('Starting content image polling for reviewSessionId:', reviewSessionId);

    if (contentImages.every(img => img !== null)) {
      console.log('Content polling skipped: All images already loaded', contentImages);
      if (contentImagePollIntervalRef.current) {
        clearInterval(contentImagePollIntervalRef.current);
      }
      return;
    }

    let attempts = 0;
    const maxAttempts = 30;

    contentImagePollIntervalRef.current = setInterval(async () => {
      console.log(`Content polling attempt ${attempts + 1} for reviewSessionId: ${reviewSessionId}`);
      try {
        const response = await getReviewContentImageStatus(reviewSessionId);
        console.log('Content getReviewContentImageStatus response:', response);

        const newImages = [
          response.reviewSessionData.contentImageOne ? `${baseUrl}${response.reviewSessionData.contentImageOne}` : null,
          response.reviewSessionData.contentImageTwo ? `${baseUrl}${response.reviewSessionData.contentImageTwo}` : null,
          response.reviewSessionData.contentImageThree ? `${baseUrl}${response.reviewSessionData.contentImageThree}` : null
        ];

        console.log('Content new images:', newImages);

        const validImages = newImages.map(img =>
          img && img.startsWith(`${baseUrl}/contentimages/`) ? img : null
        );

        setContentImages(validImages);

        if (validImages.every(img => img !== null)) {
          console.log('Content all images loaded, stopping polling:', validImages);
          clearInterval(contentImagePollIntervalRef.current);
        } else if (attempts >= maxAttempts) {
          console.log('Content max attempts reached, stopping polling');
          clearInterval(contentImagePollIntervalRef.current);
          setContentImages(prev => prev.map(img => img || 'https://via.placeholder.com/200'));
          setPopupMessage('Images could not be loaded, please try again.');
          setShowPopup(true);
        }

        attempts++;
      } catch (error) {
        console.error('Error fetching content image status:', error);
        attempts++;
        if (attempts >= maxAttempts) {
          console.log('Content max attempts reached due to error, stopping polling');
          clearInterval(contentImagePollIntervalRef.current);
          setContentImages(prev => prev.map(img => img || 'https://via.placeholder.com/200'));
          setPopupMessage('Images could not be loaded, please try again.');
          setShowPopup(true);
        }
      }
    }, 4000);

    return () => {
      if (contentImagePollIntervalRef.current) {
        console.log('Cleaning up content polling interval');
        clearInterval(contentImagePollIntervalRef.current);
      }
    };
  }, [reviewSessionId, baseUrl, contentImages]);

  useEffect(() => {
    if (!reviewSessionId) {
      console.log('Summary polling skipped: reviewSessionId is missing');
      return;
    }
    console.log('Starting summary image polling for reviewSessionId:', reviewSessionId);

    if (summaryImages.every(img => img !== null)) {
      console.log('Summary polling skipped: All images already loaded', summaryImages);
      if (summaryImagePollIntervalRef.current) {
        clearInterval(summaryImagePollIntervalRef.current);
      }
      return;
    }

    let attempts = 0;
    const maxAttempts = 30;

    summaryImagePollIntervalRef.current = setInterval(async () => {
      console.log(`Summary polling attempt ${attempts + 1} for reviewSessionId: ${reviewSessionId}`);
      try {
        const response = await getReviewContentImageStatus(reviewSessionId);
        console.log('Summary getReviewContentImageStatus response:', response);

        const newImages = [
          response.reviewSessionData.summaryImageOne ? `${baseUrl}${response.reviewSessionData.summaryImageOne}` : null,
          response.reviewSessionData.summaryImageTwo ? `${baseUrl}${response.reviewSessionData.summaryImageTwo}` : null
        ];

        console.log('Summary new images:', newImages);

        const validImages = newImages.map(img =>
          img && img.startsWith(`${baseUrl}/contentimages/`) ? img : null
        );

        setSummaryImages(validImages);

        if (validImages.every(img => img !== null)) {
          console.log('Summary all images loaded, stopping polling:', validImages);
          clearInterval(summaryImagePollIntervalRef.current);
        } else if (attempts >= maxAttempts) {
          console.log('Summary max attempts reached, stopping polling');
          clearInterval(summaryImagePollIntervalRef.current);
          setSummaryImages(prev => prev.map(img => img || 'https://via.placeholder.com/200'));
          setPopupMessage('Summary images could not be loaded, please try again.');
          setShowPopup(true);
        }

        attempts++;
      } catch (error) {
        console.error('Error fetching summary image status:', error);
        attempts++;
        if (attempts >= maxAttempts) {
          console.log('Summary max attempts reached due to error, stopping polling');
          clearInterval(summaryImagePollIntervalRef.current);
          setSummaryImages(prev => prev.map(img => img || 'https://via.placeholder.com/200'));
          setPopupMessage('Summary images could not be loaded, please try again.');
          setShowPopup(true);
        }
      }
    }, 4000);

    return () => {
      if (summaryImagePollIntervalRef.current) {
        console.log('Cleaning up summary polling interval');
        clearInterval(summaryImagePollIntervalRef.current);
      }
    };
  }, [reviewSessionId, baseUrl, summaryImages]);

  const fetchStudyContent = async (newContent = false) => {
    setIsLoading(true);
    try {
      const response = await studyReviewContentBySubLessonId({
        studentId: parseInt(studentId),
        subLessonId: parseInt(subLessonId),
        newContent
      });
      console.log('fetchStudyContent response:', response);

      setContentText(response.reviewSessionData.contentText || 'No content found');
      setSummaryText(response.reviewSessionData.summaryText || 'No summary found');
      setReviewSessionId(response.reviewSessionId);
      setIsTestSolved(response.reviewSessionData.isTestSolved || false);
      setIsCompleted(response.reviewSessionData.isCompleted || false);
      console.log('Setting reviewSessionId:', response.reviewSessionId);

      setContentImages([
        response.reviewSessionData.contentImageOne ? `${baseUrl}${response.reviewSessionData.contentImageOne}` : null,
        response.reviewSessionData.contentImageTwo ? `${baseUrl}${response.reviewSessionData.contentImageTwo}` : null,
        response.reviewSessionData.contentImageThree ? `${baseUrl}${response.reviewSessionData.contentImageThree}` : null
      ]);

      setSummaryImages([
        response.reviewSessionData.summaryImageOne ? `${baseUrl}${response.reviewSessionData.summaryImageOne}` : null,
        response.reviewSessionData.summaryImageTwo ? `${baseUrl}${response.reviewSessionData.summaryImageTwo}` : null
      ]);
    } catch (error) {
      console.error('An error occurred while loading content:', error);
      setContentText('An error occurred while loading content.');
      setSummaryText('An error occurred while loading the summary.');
      setPopupMessage('Content and summary could not be loaded, please try again.');
      setShowPopup(true);
    } finally {
      setIsLoading(false);
    }
  };

  const checkPreviouslySolvedTest = async () => {
    setPrevSolvedTestExists(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startTest = async () => {
    setIsGeneratingTest(true);
    try {
      if (prevSolvedTestExists) {
        setPopupMessage('Previous test results not implemented yet.');
        setShowPopup(true);
        setIsGeneratingTest(false);
        return;
      }

      const testData = {
        studentId: parseInt(studentId),
        subLessonId: parseInt(subLessonId),
        lessonId: 0,
        quickTest: false,
        normalTest: false,
        generalTest: false,
        isReviewSession: true
      };

      const response = await generateTest(testData);
      console.log('generateTest response:', response);

      if (response.status === 300) {
        setPopupMessage('Maximum test limit reached. Please visit the test bank for more tests.');
        setShowPopup(true);
      } else {
        const newTestId = response.testID;
        setTestId(newTestId);
        setIsTestSolved(response.isSolved || false);

        const formattedQuestions = response.testQuestions.map((q, index) => ({
          id: index + 1,
          question: q.questionText,
          options: q.testQuestionOptions.map(opt => opt.optionText),
          correctAnswer: q.testQuestionOptions.find(opt => opt.isCorrect).optionText,
          questionID: q.questionID,
          selectedOption: q.testQuestionOptions.find(opt => opt.isSelected)?.optionText || ''
        }));

        setQuestions(formattedQuestions);
        setTestTimeLeft(formattedQuestions.length * 180);

        const initialAnswers = {};
        formattedQuestions.forEach(question => {
          initialAnswers[question.id] = question.selectedOption || "";
        });
        setUserAnswers(initialAnswers);

        setTestStarted(true);
        setTestInProgress(!response.isSolved);
        setTestStartTime(Date.now());
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setTestCompleted(false);
      }
    } catch (error) {
      console.error('Test generating error:', error);
      setPopupMessage('Failed to generate test. Please try again.');
      setShowPopup(true);
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const endTest = async (timeOut = false) => {
    setTestInProgress(false);
    const endTime = Date.now();
    setTestEndTime(endTime);

    if (testTimerIntervalRef.current) {
      clearInterval(testTimerIntervalRef.current);
    }

    let popupMessage = '';
    if (timeOut) {
      const answeredCount = Object.values(userAnswers).filter(answer => answer && answer !== "").length;
      if (answeredCount < 15) {
        popupMessage = `Time is up! You only answered ${answeredCount} questions (minimum 15 required). Your partial answers have been saved, but the test is marked as incomplete.`;
      } else {
        popupMessage = 'Time is up! Your test has been submitted.';
      }
    } else {
      popupMessage = 'Test submitted successfully!';
    }

    const durationInMilliseconds = endTime - testStartTime;

    try {
      const resultData = {
        testID: testId,
        subLessonID: parseInt(subLessonId),
        lessonID: 0,
        testType: 0,
        title: `Review Session Test - ${new Date().toLocaleDateString()}`,
        description: "Review session test from study page",
        createDate: new Date().toISOString(),
        durationInMilliseconds,
        isSolved: true,
        status: 0,
        isReviewSession: true,
        testQuestions: questions.map((q, index) => ({
          questionID: q.questionID,
          numberOfQuestion: (index + 1).toString(),
          testID: testId,
          questionText: q.question,
          testQuestionOptions: q.options.map((option, optIndex) => ({
            optionID: optIndex + 1,
            questionID: q.questionID,
            optionText: option,
            isCorrect: option === q.correctAnswer,
            isSelected: option === userAnswers[q.id]
          }))
        }))
      };

      const saveResultResponse = await saveTestResult(resultData, studentId);

      if (saveResultResponse) {
        popupMessage = timeOut && answeredCount < 15
          ? `${popupMessage} The answers were recorded.`
          : 'The answers were recorded.';
      } else {
        popupMessage = 'Responses could not be recorded';
      }
    } catch (error) {
      console.error('Error saving test results:', error);
      popupMessage = 'Responses could not be recorded.';
    }

    setTestCompleted(true);
    setPopupMessage(popupMessage);
    setShowPopup(true);
    setTimeout(() => {
      setShowPopup(false);
    }, 3000);

    return durationInMilliseconds;
  };

  const handleOptionSelect = (option, questionId) => {
    if (isTestSolved) return;

    // Update userAnswers
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));

    // Update questions state to reflect selection in UI
    setQuestions(prev => prev.map(q =>
      q.id === questionId
        ? { ...q, selectedOption: option }
        : q
    ));
  };

  const handleFinishTest = async () => {
    if (isTestSolved) return;
    const answeredCount = Object.values(userAnswers).filter(answer => answer && answer !== "").length;
    if (answeredCount < 15) {
      setPopupMessage(`You must answer at least 15 questions to finish the test. You have answered ${answeredCount} questions.`);
      setShowPopup(true);
      return;
    }
    await endTest();
  };

  const handleGenerateNewContent = () => {
    if (isTestSolved && !isCompleted) {
      fetchStudyContent(true);
    }
  };

  const handleSelectAssistantMode = (mode) => {
    setAssistantMode(mode);
  };

  const handleTabClick = (tab) => {
    if (tab === 'test' && isChildPerspective) {
      return;
    }
    if (testInProgress && tab !== 'test') {
      setPopupMessage('Please complete the test before navigating away');
      setShowPopup(true);
      return;
    }
    setActiveTab(tab);
    if (tab === 'test' && !isChildPerspective && testUnlocked) {
      checkPreviouslySolvedTest();
    }
  };

  const toggleLeftPanel = () => {
    setLeftPanelExpanded(!leftPanelExpanded);
  };

  const toggleChatPanel = () => {
    setChatPanelExpanded(!chatPanelExpanded);
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isChildPerspective || !assistantMode || testInProgress) return;

    setChatMessages(prev => [...prev, { sender: 'User', message: userMessage }]);
    setUserMessage('');
    try {
      let requestData;
      if (assistantMode === 'test' && testId) {
        requestData = {
          studentId: parseInt(studentId),
          testId: testId,
          userMessage: userMessage,
          isReviewSession: true,
          sublessonId: parseInt(subLessonId)
        };
        const response = await askTestAssistantRobot(requestData);
        setChatMessages(prev => [...prev, {
          sender: 'MetaLink AI',
          message: response.content || 'I don\'t understand how I can help you..'
        }]);
      } else {
        requestData = {
          studentId: parseInt(studentId),
          subLessonId: parseInt(subLessonId),
          newContent: false,
          userMessage: userMessage,
          assistantMode: assistantMode
        };
        const response = await askQuestionContentAssistantRobot(requestData);
        setChatMessages(prev => [...prev, {
          sender: 'MetaLink AI',
          message: response.content || 'I don\'t understand how I can help you.'
        }]);
      }
    } catch (error) {
      console.error('Content Assistant request failed:', error);
      setChatMessages(prev => [...prev, { sender: 'MetaLink AI', message: 'An error occurred, please try again.' }]);
    }
  };

  return (
    <div className="study-app-container">
      <SecondNavbar visibleButtons={["lectures", "avatar", "profile", "logout"]} isChildPerspective={isChildPerspective} />

      <div className="study-page">
        <div className={`left-panel ${leftPanelExpanded ? 'expanded' : ''}`}>
          <div className="panel-header">
            <div className="tabs-container">
              <div
                className={`tab ${activeTab === 'topic' ? 'active' : ''} ${testInProgress ? 'locked' : ''}`}
                onClick={() => handleTabClick('topic')}
              >
                Content
              </div>
              <div
                className={`tab ${activeTab === 'summary' ? 'active' : ''} ${testInProgress ? 'locked' : ''}`}
                onClick={() => handleTabClick('summary')}
              >
                Summary
              </div>
              <div
                className={`tab ${activeTab === 'test' ? 'active' : ''} ${!testUnlocked || isChildPerspective ? 'locked' : ''}`}
                onClick={() => !isChildPerspective && testUnlocked && handleTabClick('test')}
                title={isChildPerspective ? 'The test is closed in child perspective!' : !testUnlocked ? 'Test is locked!' : 'Test tab'}
              >
                Test {isChildPerspective ? '(Closed)' : !testUnlocked ? `(${formatTime(testTimer)})` : ''}
              </div>
              {isTestSolved && !isCompleted && (
                <button
                  onClick={handleGenerateNewContent}
                  className="tab generate-new-content-button"
                  disabled={isLoading || testInProgress}
                >
                  Generate New Content
                </button>
              )}
            </div>
            <button
              className={`sutdy-expand-button ${testInProgress ? 'locked' : ''}`}
              onClick={toggleLeftPanel}
              disabled={testInProgress}
            >
              {leftPanelExpanded ? 'Shrink' : 'Expand'}
            </button>
          </div>

          <div className="content-area">
            {isLoading && (
              <div className="studypage-loading-container">
                <PencilWheel />
                <p>Content is being generated, please wait...</p>
              </div>
            )}

            {!isLoading && activeTab === 'topic' && (
              <div className="topic-content scrollable">
                <MarkdownContent content={contentText} images={contentImages} />
              </div>
            )}

            {!isLoading && activeTab === 'summary' && (
              <div className="summary-content scrollable">
                <MarkdownContent content={summaryText} images={summaryImages} />
              </div>
            )}

            {activeTab === 'test' && testUnlocked && !isChildPerspective && !testStarted && (
              <div className="test-ready-screen">
                <div className="test-ready-card">
                  {prevSolvedTestExists ? (
                    <>
                      <div className="test-ready-content">
                        <h2>You solved a review session test about this topic</h2>
                        <p>Would you like to see your previous test results?</p>
                        <button
                          className="start-test-button"
                          onClick={startTest}
                          disabled={isGeneratingTest}
                        >
                          {isGeneratingTest ? 'Loading Results...' : 'Show Results'}
                        </button>
                      </div>
                      <div className="test-bank-message">
                        <p>To solve more tests about this topic please visit <a href={`/user/${studentId}/test-bank`}>test bank</a></p>
                      </div>
                    </>
                  ) : (
                    <div className="test-ready-content">
                      <h2>Are you ready for the review session test?</h2>
                      <p>You will have time to complete questions based on this topic.</p>
                      <p>During the test, you won't be able to use Content Assistant or navigate away.</p>
                      <button
                        className="start-test-button"
                        onClick={startTest}
                        disabled={isGeneratingTest}
                      >
                        {isGeneratingTest ? 'Generating Test...' : 'Start Test'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'test' && testUnlocked && !isChildPerspective && testStarted && !testCompleted && questions.length > 0 && (
              <div className="test-layout">
                <div className="test-questions-section">
                  <h2>Test - {questions.length} Questions {isTestSolved ? '(Completed)' : ''}</h2>
                  {questions.map((question, index) => (
                    <div key={question.id} className="test-question-item">
                      <div className="test-question-title">
                        Question {index + 1}: {question.question}
                      </div>
                      <div className="test-options-list">
                        {question.options.map((option, optionIndex) => {
                          const isSelected = question.selectedOption === option;
                          const isCorrect = question.correctAnswer === option;
                          let optionClass = `test-option-item`;
                          if (isTestSolved) {
                            if (isSelected) optionClass += ' selected-option';
                            if (isCorrect) optionClass += ' correct-option';
                            if (isSelected && !isCorrect) optionClass += ' incorrect-option';
                          } else {
                            optionClass += isSelected ? ' selected' : '';
                          }
                          return (
                            <div
                              key={optionIndex}
                              className={optionClass}
                              onClick={isTestSolved ? undefined : () => handleOptionSelect(option, question.id)}
                              style={isTestSolved ? { cursor: 'default' } : {}}
                            >
                              <div className={`test-option-radio ${isSelected ? 'selected' : ''}`}></div>
                              <span>{option}</span>
                              {isTestSolved && isSelected && !isCorrect && (
                                <span className="user-selection"> (Your selection)</span>
                              )}
                              {isTestSolved && isCorrect && (
                                <span className="correct-answer-mark"> (Correct answer)</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="test-answer-sheet-section">
                  <div className="answer-sheet">
                    <h3>Answer Sheet</h3>
                    <div className="answer-grid-new">
                      {questions.map((question, index) => {
                        const selectedOption = userAnswers[question.id] || question.selectedOption || "";
                        const isAnswered = selectedOption && selectedOption !== "";
                        const getOptionLetter = (option) => {
                          if (!option) return '';
                          const optionIndex = question.options.findIndex(opt => opt === option);
                          return optionIndex !== -1 ? String.fromCharCode(65 + optionIndex) : '';
                        };
                        return (
                          <div
                            key={question.id}
                            className={`answer-item-new ${isAnswered ? 'answered' : 'unanswered'}`}
                            onClick={() => {
                              const questionElement = document.querySelector(`.test-question-item:nth-child(${index + 2})`);
                              if (questionElement) {
                                questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                            title={isAnswered ? `Question ${index + 1}: ${getOptionLetter(selectedOption)} - ${selectedOption}` : `Question ${index + 1}: Not answered`}
                          >
                            <span className="question-number">{index + 1}</span>
                            <span className="selected-option">
                              {isAnswered ? getOptionLetter(selectedOption) : '-'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="test-progress">
                      <div>Answered: {questions.filter(q => q.selectedOption && q.selectedOption !== "").length}/{questions.length}</div>
                      <div>Remaining: {questions.length - questions.filter(q => q.selectedOption && q.selectedOption !== "").length}</div>
                    </div>
                  </div>

                  <div className="finish-test-section">
                    <h3>{isTestSolved ? 'Test Completed' : 'Finish Test'}</h3>
                    <div className="test-progress">
                      <div>Questions Answered: {questions.filter(q => q.selectedOption && q.selectedOption !== "").length}/{questions.length}</div>
                      <div>Minimum Required: 15</div>
                    </div>
                    <button
                      className="finish-test-button"
                      onClick={handleFinishTest}
                      disabled={isTestSolved || questions.filter(q => q.selectedOption && q.selectedOption !== "").length < 15}
                    >
                      {isTestSolved
                        ? 'Test Already Submitted'
                        : questions.filter(q => q.selectedOption && q.selectedOption !== "").length < 15
                          ? `Answer ${15 - questions.filter(q => q.selectedOption && q.selectedOption !== "").length} more questions`
                          : 'Finish Test'
                      }
                    </button>
                    {questions.filter(q => q.selectedOption && q.selectedOption !== "").length < 15 && !isTestSolved && (
                      <div className="minimum-questions-warning">
                        You must answer at least 15 questions to finish the test.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'test' && testUnlocked && !isChildPerspective && testCompleted && (
              <div className="test-results scrollable">
                <h2>Test Completed!</h2>
                <div className="test-stats">
                  <div className="stat-item">
                    <span className="stat-label">Total Questions:</span>
                    <span className="stat-value">{questions.length}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Correct Answers:</span>
                    <span className="stat-value">
                      {questions.filter(q => q.selectedOption === q.correctAnswer).length}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Incorrect Answers:</span>
                    <span className="stat-value">
                      {questions.filter(q => q.selectedOption !== q.correctAnswer && q.selectedOption !== "").length}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Unanswered:</span>
                    <span className="stat-value">
                      {questions.filter(q => q.selectedOption === "").length}
                    </span>
                  </div>
                </div>

                <div className="test-detailed-results">
                  <h3>Detailed Results</h3>
                  {questions.map((question, index) => {
                    const questionNumber = index + 1;
                    const userAnswer = question.selectedOption || "";
                    const isCorrect = userAnswer === question.correctAnswer;
                    const isUnanswered = userAnswer === "";

                    let statusClass = isUnanswered
                      ? "unanswered"
                      : (isCorrect ? "correct-answer" : "incorrect-answer");

                    let statusText = isUnanswered
                      ? "Unanswered"
                      : (isCorrect ? "Correct" : "Incorrect");

                    let statusTextClass = isUnanswered
                      ? "status-unanswered"
                      : (isCorrect ? "status-correct" : "status-incorrect");

                    return (
                      <div key={questionNumber} className={`test-result-item ${statusClass}`}>
                        <div className="question-info">
                          <h4>Question {questionNumber}: {question.question}</h4>
                          <span className={`question-status ${statusTextClass}`}>{statusText}</span>
                        </div>
                        <div className="question-options">
                          {question.options.map((option, optionIndex) => {
                            const isUserSelected = userAnswer === option;
                            const isCorrectOption = question.correctAnswer === option;

                            let optionClass = "option-item";
                            if (isUserSelected) optionClass += " selected-option";
                            if (isCorrectOption) optionClass += " correct-option";
                            if (isUserSelected && !isCorrectOption) optionClass += " incorrect-option";

                            return (
                              <div key={optionIndex} className={optionClass}>
                                {option}
                                {isUserSelected && !isCorrectOption &&
                                  <span className="user-selection"> (Your selection)</span>
                                }
                                {isCorrectOption &&
                                  <span className="correct-answer-mark"> (Correct answer)</span>
                                }
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="test-bank-message">
                  <p>To solve more tests about this topic please visit <a href={`/user/${studentId}/test-bank`}>test bank</a></p>
                </div>
              </div>
            )}

            {activeTab === 'test' && isChildPerspective && (
              <div className="test-locked-message">
                <p>Test is disabled in child perspective! Focus on the lesson content.</p>
              </div>
            )}
          </div>
        </div>

        <div className="study-right-panel">
          <div className="test-timer">
            {isChildPerspective ? 'Test disabled!' :
              !testUnlocked ? `Test unlocks in: ${formatTime(testTimer)}` :
                testInProgress ? `Time left: ${formatTime(testTimeLeft)}` :
                  'Test Available!'}
          </div>

          <div className={`study-chat-box ${chatPanelExpanded ? 'expanded' : ''} ${testInProgress ? 'blurred' : ''}`}>
            <div className="study-chat-header">
              <h3>Content Assistant {testInProgress && '(Disabled during test)'}</h3>
              <button
                className="sutdy-expand-button"
                onClick={toggleChatPanel}
                disabled={testInProgress}
              >
                {chatPanelExpanded ? 'Shrink' : 'Expand'}
              </button>
            </div>

            <div className="study-chat-messages" ref={chatContainerRef}>
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.sender === 'User' ? 'user-message' : 'ai-message'}`}
                >
                  <span className="sender">{msg.sender}:</span>
                  {msg.sender === 'MetaLink AI' ? (
                    <ReactMarkdown>{msg.message}</ReactMarkdown>
                  ) : (
                    <p>{msg.message}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="assistant-mode-selection">
              <button
                className={`assistant-mode-button ${assistantMode === 'contentsum' ? 'active' : ''}`}
                onClick={() => handleSelectAssistantMode('contentsum')}
                disabled={isChildPerspective || testInProgress}
              >
                Content&Sum
              </button>
              <button
                className={`assistant-mode-button ${assistantMode === 'test' ? 'active' : ''}`}
                onClick={() => handleSelectAssistantMode('test')}
                disabled={isChildPerspective || !testUnlocked || testInProgress}
              >
                Test
              </button>
            </div>

            <div className="chat-input">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder={
                  isChildPerspective ? 'Content Assistant disabled!' :
                    testInProgress ? 'Content Assistant is disabled during test' :
                      assistantMode ? 'Ask a question...' : 'Please select an assistant mode first'
                }
                disabled={isChildPerspective || !assistantMode || testInProgress}
                className={isChildPerspective || !assistantMode || testInProgress ? 'disabled' : ''}
              />
              <button
                onClick={handleSendMessage}
                disabled={isChildPerspective || !assistantMode || testInProgress}
                className={isChildPerspective || !assistantMode || testInProgress ? 'disabled' : ''}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {showPopup && (
          <div className="popup-overlay">
            <div className="popup">
              <p>{popupMessage}</p>
              <button onClick={() => setShowPopup(false)}>OK</button>
            </div>
          </div>
        )}

        {(leftPanelExpanded || chatPanelExpanded) && (
          <div className="backdrop" onClick={() => {
            if (leftPanelExpanded) setLeftPanelExpanded(false);
            if (chatPanelExpanded) setChatPanelExpanded(false);
          }} />
        )}
      </div>
    </div>
  );
};

export default ReviewSession;
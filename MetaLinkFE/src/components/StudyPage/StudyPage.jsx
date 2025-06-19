import React, { useState, useEffect, useRef, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePerspective } from '../../context/PerspectiveContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './StudyPage.css';
import SecondNavbar from "../Navbar/SecondNavbar.jsx";
import PencilWheel from "../Spinner/PencilWheel.jsx";
import {
  studyContentBySublessonId,
  studySummaryBySublessonId,
  askQuestionContentAssistantRobot,
  generateQuiz,
  askQuizAssistantRobot,
  getAllQuizByStudentId,
  getQuizByQuizAndStudentId,
  saveQuizResult,
  getImageStatus,
  compareQuiz
} from '../../services/student-api.js';

const ImagePlaceholder = () => (
  <div className="sp-image-placeholder">
    <div className="sp-spinner"></div>
  </div>
);

const MarkdownContent = memo(({ content, images }) => {
  const imagePlaceholders = ['[IMAGE1]', '[IMAGE2]', '[IMAGE3]'];

  const renderContent = () => {
    let parts = [content || 'Content not loaded.'];
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
                  className="sp-content-image"
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
                      className="sp-content-image"
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

const StudyPage = () => {
  const navigate = useNavigate();
  const { studentId, subLessonId } = useParams();
  const { isChildPerspective } = usePerspective();
  const [activeTab, setActiveTab] = useState('topic');
  const [quizTimer, setQuizTimer] = useState(60);
  const [quizUnlocked, setQuizUnlocked] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(false);
  const [chatPanelExpanded, setChatPanelExpanded] = useState(false);
  const [topicAudioUrl, setTopicAudioUrl] = useState(null);
  const [summaryAudioUrl, setSummaryAudioUrl] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'MetaLink AI', message: isChildPerspective ? 'Content Assistant is disabled in child perspective!' : 'Please select an assistant mode below to continue.' }
  ]);
  const [userMessage, setUserMessage] = useState('');
  const [topicContent, setTopicContent] = useState('');
  const [summaryContent, setSummaryContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantMode, setAssistantMode] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [quizEndTime, setQuizEndTime] = useState(null);
  const [quizInProgress, setQuizInProgress] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizId, setQuizId] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [prevSolvedQuizExists, setPrevSolvedQuizExists] = useState(false);
  const [contentId, setContentId] = useState(null);
  const [summaryContentId, setSummaryContentId] = useState(null);
  const [images, setImages] = useState([null, null, null]);
  const [summaryImages, setSummaryImages] = useState([null, null, null]);
  const [showAverageStats, setShowAverageStats] = useState(false);
  const [averageStats, setAverageStats] = useState({
    avgCorrectAnswers: 0,
    avgWrongAnswers: 0,
    avgDurationInMillis: 0,
    studentCorrectAnswers: 0,
    studentWrongAnswers: 0,
    studentDurationInMillis: 0,
    isSuccessful: false
  });

  const hasFetched = useRef(false);
  const chatContainerRef = useRef(null);
  const quizTimerIntervalRef = useRef(null);
  const imagePollIntervalRef = useRef(null);
  const summaryImagePollIntervalRef = useRef(null);

  const baseUrl = 'https://localhost:7239';

  useEffect(() => {
    let interval = null;
    if (quizTimer > 0 && !quizUnlocked) {
      interval = setInterval(() => {
        setQuizTimer(prevTime => {
          if (prevTime <= 1) {
            setQuizUnlocked(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [quizTimer, quizUnlocked]);

  useEffect(() => {
    if (quizInProgress && quizTimeLeft > 0) {
      quizTimerIntervalRef.current = setInterval(() => {
        setQuizTimeLeft(prevTime => {
          if (prevTime <= 1) {
            endQuiz(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (quizTimeLeft <= 0 && quizInProgress) {
      endQuiz(true);
    }

    return () => {
      if (quizTimerIntervalRef.current) {
        clearInterval(quizTimerIntervalRef.current);
      }
    };
  }, [quizInProgress, quizTimeLeft]);

  useEffect(() => {
    if (!hasFetched.current) {
      fetchStudyContent();
      checkPreviouslySolvedQuiz();
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
        message: `${assistantMode === 'contentsum' ? 'Content & Summary' : 'Quiz'} assistant mode activated. How can I help you?`
      }]);
    }
  }, [assistantMode]);

  useEffect(() => {
    if (activeTab === 'topic' && !isLoading) {
      const contentArea = document.querySelector('.sp-topic-content.scrollable');
    }
  }, [activeTab, isLoading, topicContent]);

  useEffect(() => {
    if (quizCompleted && quizId) {
      fetchAverageStats();
    }
  }, [quizCompleted, quizId]);

  useEffect(() => {
    if (!contentId) {
      console.log('Topic polling skipped: contentId is missing');
      return;
    }

    console.log('Starting topic image polling for contentId:', contentId);

    if (images.every(img => img !== null)) {
      console.log('Topic polling skipped: All images already loaded', images);
      if (imagePollIntervalRef.current) {
        clearInterval(imagePollIntervalRef.current);
      }
      return;
    }

    let attempts = 0;
    const maxAttempts = 30;

    imagePollIntervalRef.current = setInterval(async () => {
      console.log(`Topic polling attempt ${attempts + 1} for contentId: ${contentId}`);
      try {
        const response = await getImageStatus(contentId);
        console.log('Topic getImageStatus response:', response);

        const newImages = [
          response.generatedImage1 ? `${baseUrl}${response.generatedImage1}` : null,
          response.generatedImage2 ? `${baseUrl}${response.generatedImage2}` : null,
          response.generatedImage3 ? `${baseUrl}${response.generatedImage3}` : null
        ];

        console.log('Topic new images:', newImages);

        const validImages = newImages.map(img =>
          img && img.startsWith(`${baseUrl}/contentimages/`) ? img : null
        );

        setImages(validImages);

        if (validImages.every(img => img !== null)) {
          console.log('Topic all images loaded, stopping polling:', validImages);
          clearInterval(imagePollIntervalRef.current);
        } else if (attempts >= maxAttempts) {
          console.log('Topic max attempts reached, stopping polling');
          clearInterval(imagePollIntervalRef.current);
          setImages(prev => prev.map(img => img || 'https://via.placeholder.com/200'));
          setPopupMessage('Images could not be loaded, please try again.');
          setShowPopup(true);
        }

        attempts++;
      } catch (error) {
        console.error('Error fetching topic image status:', error);
        attempts++;
        if (attempts >= maxAttempts) {
          console.log('Topic max attempts reached due to error, stopping polling');
          clearInterval(imagePollIntervalRef.current);
          setImages(prev => prev.map(img => img || 'https://via.placeholder.com/200'));
          setPopupMessage('Images could not be loaded, please try again.');
          setShowPopup(true);
        }
      }
    }, 4000);

    return () => {
      if (imagePollIntervalRef.current) {
        console.log('Cleaning up topic polling interval');
        clearInterval(imagePollIntervalRef.current);
      }
    };
  }, [contentId, baseUrl, images]);

  useEffect(() => {
    if (!summaryContentId) {
      console.log('Summary polling skipped: summaryContentId is missing');
      return;
    }

    console.log('Starting summary image polling for summaryContentId:', summaryContentId);

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
      console.log(`Summary polling attempt ${attempts + 1} for summaryContentId: ${summaryContentId}`);
      try {
        const response = await getImageStatus(summaryContentId);
        console.log('Summary getImageStatus response:', response);

        const newImages = [
          response.generatedImage1 ? `${baseUrl}${response.generatedImage1}` : null,
          response.generatedImage2 ? `${baseUrl}${response.generatedImage2}` : null,
          response.generatedImage3 ? `${baseUrl}${response.generatedImage3}` : null
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
  }, [summaryContentId, baseUrl, summaryImages]);

  const fetchStudyContent = async (newContent = false) => {
    setIsLoading(true);
    try {
      const response = await studyContentBySublessonId({
        studentId: parseInt(studentId),
        subLessonId: parseInt(subLessonId),
        newContent: newContent
      });

      console.log('fetchStudyContent response:', response);

      setTopicContent(response.content || 'No content found');
      setContentId(response.contentId);
      console.log('Setting contentId:', response.contentId);

      setTopicAudioUrl(
        response.audioUrl ? `${baseUrl}${response.audioUrl}` : null
      );

      setImages([
        response.generatedImage1 ? `${baseUrl}${response.generatedImage1}` : null,
        response.generatedImage2 ? `${baseUrl}${response.generatedImage2}` : null,
        response.generatedImage3 ? `${baseUrl}${response.generatedImage3}` : null
      ]);
    } catch (error) {
      console.error('An error occurred while loading content:', error);
      setTopicContent('An error occurred while loading content.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSummaryContent = async (newContent = false) => {
    setIsLoading(true);
    try {
      const response = await studySummaryBySublessonId({
        studentId: parseInt(studentId),
        subLessonId: parseInt(subLessonId),
        newContent: newContent
      });

      console.log('fetchSummaryContent response:', response);

      setSummaryContent(response.content || 'No summary found');
      setSummaryContentId(response.contentId);
      console.log('Setting summaryContentId:', response.contentId);

      setSummaryAudioUrl(
        response.audioUrl ? `${baseUrl}${response.audioUrl}` : null
      );

      setSummaryImages([
        response.generatedImage1 ? `${baseUrl}${response.generatedImage1}` : null,
        response.generatedImage2 ? `${baseUrl}${response.generatedImage2}` : null,
        response.generatedImage3 ? `${baseUrl}${response.generatedImage3}` : null
      ]);
    } catch (error) {
      console.error('Error loading summary:', error);
      setSummaryContent('An error occurred while loading the summary.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAverageStats = async () => {
    if (!quizId) {
      console.error('Cannot fetch average stats: quizId is missing');
      return;
    }

    try {
      const response = await compareQuiz({
        studentId: parseInt(studentId),
        quizId: parseInt(quizId),
        testId: 0
      });

      setAverageStats({
        avgCorrectAnswers: response.avgCorrectAnswers,
        avgWrongAnswers: response.avgWrongAnswers,
        avgDurationInMillis: response.avgDurationInMillis,
        studentCorrectAnswers: response.studentCorrectAnswers,
        studentWrongAnswers: response.studentWrongAnswers,
        studentDurationInMillis: response.studentDurationInMillis,
        isSuccessful: response.isSuccessful
      });
    } catch (error) {
      console.error('Error fetching average quiz stats:', error);
      setAverageStats({
        avgCorrectAnswers: 0,
        avgWrongAnswers: 0,
        avgDurationInMillis: 0,
        studentCorrectAnswers: 0,
        studentWrongAnswers: 0,
        studentDurationInMillis: 0,
        isSuccessful: false
      });
    }
  };

  const handleGenerateNewContent = () => {
    fetchStudyContent(true);
  };

  const handleSelectAssistantMode = (mode) => {
    setAssistantMode(mode);
  };

  const handleTabClick = (tab) => {
    if (tab === 'quiz' && isChildPerspective) {
      return;
    }

    if (quizInProgress && tab !== 'quiz') {
      setPopupMessage('Please complete the quiz before navigating away');
      setShowPopup(true);
      return;
    }

    setActiveTab(tab);
    if (tab === 'topic') {
      fetchStudyContent();
    } else if (tab === 'summary') {
      fetchSummaryContent();
    } else if (tab === 'quiz' && !isChildPerspective && quizUnlocked) {
      checkPreviouslySolvedQuiz();
    }
  };

  const checkPreviouslySolvedQuiz = async () => {
    try {
      const quizzes = await getAllQuizByStudentId(studentId);
      const sublessonQuizzes = quizzes.filter(q =>
        q.subLessonID === parseInt(subLessonId) &&
        q.quizType === 0 &&
        q.isSolved === true
      );

      if (sublessonQuizzes.length > 0) {
        setPrevSolvedQuizExists(true);
      } else {
        setPrevSolvedQuizExists(false);
      }
    } catch (error) {
      console.error('Error checking previous quizzes:', error);
      setPrevSolvedQuizExists(false);
      if (quizCompleted && quizId) {
        fetchAverageStats();
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const formatDuration = (millis) => {
    const seconds = Math.floor(millis / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startQuiz = async () => {
    setIsGeneratingQuiz(true);
    try {
      const quizzes = await getAllQuizByStudentId(studentId);
      const sublessonQuizzes = quizzes.filter(q =>
        q.subLessonID === parseInt(subLessonId) &&
        q.quizType === 0 &&
        q.isSolved === true
      );

      if (sublessonQuizzes.length > 0) {
        setPrevSolvedQuizExists(true);
        const sortedQuizzes = sublessonQuizzes.sort((a, b) =>
          new Date(b.createDate) - new Date(a.createDate)
        );
        const latestSolvedQuiz = sortedQuizzes[0];
        const quizDetail = await getQuizByQuizAndStudentId(studentId, latestSolvedQuiz.quizID);
        const newQuizId = quizDetail.quizID;
        setQuizId(newQuizId);

        const formattedQuestions = quizDetail.quizQuestions.map((q, index) => ({
          id: index + 1,
          question: q.questionText,
          options: q.quizQuestionOptions.map(opt => opt.optionText),
          correctAnswer: q.quizQuestionOptions.find(opt => opt.isCorrect).optionText
        }));

        setQuestions(formattedQuestions);

        const extractedAnswers = {};
        quizDetail.quizQuestions.forEach((q, index) => {
          const selectedOption = q.quizQuestionOptions.find(opt => opt.isSelected);
          if (selectedOption) {
            extractedAnswers[index + 1] = selectedOption.optionText;
          } else {
            extractedAnswers[index + 1] = "";
          }
        });
        setUserAnswers(extractedAnswers);

        setQuizStarted(true);
        setQuizCompleted(true);
        return;
      } else {
        setPrevSolvedQuizExists(false);
      }

      const quizData = {
        studentId: parseInt(studentId),
        subLessonId: parseInt(subLessonId),
        lessonId: null,
        quickQuiz: true,
        normalQuiz: false,
        generalQuiz: false
      };

      const response = await generateQuiz(quizData);

      if (response.status === 300) {
        setPopupMessage('Maximum quiz limit reached. Please visit the test bank for more quizzes.');
        setShowPopup(true);

        setTimeout(() => {
          setShowPopup(false);
        }, 3000);

      } else {
        const newQuizId = response.quizID;
        setQuizId(newQuizId);

        const formattedQuestions = response.quizQuestions.map((q, index) => ({
          id: index + 1,
          question: q.questionText,
          options: q.quizQuestionOptions.map(opt => opt.optionText),
          correctAnswer: q.quizQuestionOptions.find(opt => opt.isCorrect).optionText
        }));

        setQuestions(formattedQuestions);
        setQuizTimeLeft(formattedQuestions.length * 180);

        const initialAnswers = {};
        formattedQuestions.forEach(question => {
          initialAnswers[question.id] = "";
        });
        setUserAnswers(initialAnswers);

        setQuizStarted(true);
        setQuizInProgress(true);
        setQuizStartTime(Date.now());
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setQuizCompleted(false);
      }
    } catch (error) {
      console.error('Quiz generating error:', error);
      setPopupMessage('Failed to generate quiz. Please try again.');
      setShowPopup(true);

      setTimeout(() => {
        setShowPopup(false);
      }, 3000);

    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const endQuiz = async (timeOut = false) => {
    setQuizInProgress(false);
    const endTime = Date.now();
    setQuizEndTime(endTime);

    if (quizTimerIntervalRef.current) {
      clearInterval(quizTimerIntervalRef.current);
    }

    if (timeOut) {
      setPopupMessage('Time is up! Your quiz has ended.');
      setShowPopup(true);
      setQuizCompleted(true);
      setTimeout(() => {
        setShowPopup(false);
      }, 2000);
    } else {
      setQuizCompleted(true);
    }

    const durationInMilliseconds = endTime - quizStartTime;

    try {
      const resultData = {
        quizID: quizId,
        subLessonID: parseInt(subLessonId),
        lessonID: null,
        studentId: parseInt(studentId),
        durationInMilliseconds: durationInMilliseconds,
        title: `Quick Quiz - ${new Date().toLocaleDateString()}`,
        description: "Quick quiz from study page",
        createDate: new Date().toISOString(),
        quizQuestions: questions.map((q, index) => {
          const questionId = q.id;
          const userAnswer = userAnswers[questionId] || "";

          return {
            questionID: questionId,
            quizID: quizId,
            questionText: q.question,
            quizQuestionOptions: q.options.map((option, optIndex) => {
              return {
                optionID: optIndex + 1,
                questionID: questionId,
                optionText: option,
                isCorrect: option === q.correctAnswer,
                isSelected: option === userAnswer
              };
            })
          };
        })
      };

      await saveQuizResult(resultData, studentId);
      await fetchAverageStats();
    } catch (error) {
      console.error('Error saving quiz results:', error);
      setPopupMessage('Quiz completed but results could not be saved.');
      setShowPopup(true);
      setTimeout(() => {
        setShowPopup(false);
      }, 2000);
    }

    // Return time taken in seconds for consistency with existing code
    return Math.floor(durationInMilliseconds / 1000);
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);

    if (questions[currentQuestionIndex]) {
      setUserAnswers(prev => ({
        ...prev,
        [questions[currentQuestionIndex].id]: option
      }));
    }
  };

  const handleFinishQuiz = async () => {
    if (selectedOption) {
      setUserAnswers(prev => ({
        ...prev,
        [questions[currentQuestionIndex].id]: selectedOption
      }));
    }

    const timeTaken = await endQuiz();
    setQuizCompleted(true);
    setPrevSolvedQuizExists(true);
  };

  const toggleLeftPanel = () => {
    setLeftPanelExpanded(!leftPanelExpanded);
  };

  const toggleChatPanel = () => {
    setChatPanelExpanded(!chatPanelExpanded);
  };

  const handleSendMessage = async () => {
    if (!userMessage.trim() || isChildPerspective || !assistantMode || quizInProgress) return;

    setChatMessages(prev => [...prev, { sender: 'User', message: userMessage }]);
    setUserMessage('');
    try {
      let requestData;

      if (assistantMode === 'quiz' && quizId) {
        requestData = {
          studentId: parseInt(studentId),
          quizId: quizId,
          userMessage: userMessage,
          quizData: {
            questions: questions,
            userAnswers: userAnswers
          }
        };

        const response = await askQuizAssistantRobot(requestData);
        setChatMessages(prev => [...prev, {
          sender: 'MetaLink AI',
          message: response.content || 'I dont understand how I can help you.'
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
          message: response.content || 'I dont understand how I can help you.'
        }]);
      }
    } catch (error) {
      console.error('Content Assistant request failed:', error);
      setChatMessages(prev => [...prev, { sender: 'MetaLink AI', message: 'An error occurred, please try again.' }]);
    }
  };

  return (
    <div className="sp-study-app-container">
      <SecondNavbar visibleButtons={["lectures", "avatar", "profile", "logout"]} isChildPerspective={isChildPerspective} />

      <div className="sp-study-page">
        <div className={`sp-left-panel ${leftPanelExpanded ? 'sp-expanded' : ''}`}>
          <div className="sp-panel-header">
            <div className="sp-tabs-container">
              <div
                className={`sp-tab ${activeTab === 'topic' ? 'sp-active' : ''} ${quizInProgress ? 'sp-locked' : ''}`}
                onClick={() => handleTabClick('topic')}
              >
                Content
              </div>
              <div
                className={`sp-tab ${activeTab === 'summary' ? 'sp-active' : ''} ${quizInProgress ? 'sp-locked' : ''}`}
                onClick={() => handleTabClick('summary')}
              >
                Summary
              </div>
              <div
                className={`sp-tab ${activeTab === 'quiz' ? 'sp-active' : ''} ${!quizUnlocked || isChildPerspective ? 'sp-locked' : ''}`}
                onClick={() => !isChildPerspective && quizUnlocked && handleTabClick('quiz')}
                title={isChildPerspective ? 'Quiz closed in child perspective!' : !quizUnlocked ? 'Quiz is locked!' : 'Quiz tab'}
              >
                Quiz {isChildPerspective ? '(Closed)' : !quizUnlocked ? `(${formatTime(quizTimer)})` : ''}
              </div>
            </div>
            <button
              className={`sp-study-expand-button ${quizInProgress ? 'sp-locked' : ''}`}
              onClick={toggleLeftPanel}
              disabled={quizInProgress}
            >
              {leftPanelExpanded ? 'Shrink' : 'Expand'}
            </button>
          </div>

          <div className="sp-content-area">
            {isLoading && (
              <div className="sp-studypage-loading-container">
                <PencilWheel />
                <p>Content is being generated, please wait...</p>
              </div>
            )}

            {!isLoading && activeTab === 'topic' && (
              <div className="sp-topic-content scrollable">
                <MarkdownContent content={topicContent} images={images} />

                {topicAudioUrl && (
                  <div className="sp-audio-wrapper">
                    <audio
                      className="sp-content-audio-player"
                      controls
                      src={topicAudioUrl}
                    >
                      Your browser might not support audio object.
                    </audio>
                  </div>
                )}

                {/* <button
                  onClick={handleGenerateNewContent}
                  className="sp-generate-new-content-button"
                  disabled={isLoading}
                >
                  Create New Content
                </button> */}
              </div>
            )}

            {!isLoading && activeTab === 'summary' && (
              <div className="sp-summary-content scrollable">
                <MarkdownContent content={summaryContent} images={summaryImages} />

                {summaryAudioUrl && (
                  <div className="sp-audio-wrapper">
                    <audio
                      className="sp-content-audio-player"
                      controls
                      src={summaryAudioUrl}
                    >
                      Your browser might not support audio object.
                    </audio>
                  </div>
                )}

                {/* <button
                  onClick={() => fetchSummaryContent(true)}
                  className="sp-generate-new-content-button"
                  disabled={isLoading}
                >
                  Create New Summary
                </button> */}
              </div>
            )}

            {activeTab === 'quiz' && quizUnlocked && !isChildPerspective && !quizStarted && (
              <div className="sp-quiz-ready-screen">
                {prevSolvedQuizExists ? (
                  <>
                    <h2>You solved a quick quiz about this topic</h2>
                    <p>Would you like to see your previous quiz results?</p>
                    <button
                      className="sp-start-quiz-button"
                      onClick={startQuiz}
                      disabled={isGeneratingQuiz}
                    >
                      {isGeneratingQuiz ? 'Loading Results...' : 'Show Results'}
                    </button>
                    <div className="sp-test-bank-message">
                      <p>To solve more quizzes about this topic please visit <a href={`/user/${studentId}/test-bank`}>test bank</a></p>
                    </div>
                  </>
                ) : (
                  <>
                    <h2>Are you ready for the quiz?</h2>
                    <p>You will have time to complete questions based on this topic.</p>
                    <p>During the quiz, you won't be able to use Content Assistant or navigate away.</p>
                    <button
                      className="sp-start-quiz-button"
                      onClick={startQuiz}
                      disabled={isGeneratingQuiz}
                    >
                      {isGeneratingQuiz ? 'Generating Quiz...' : 'Start Quiz'}
                    </button>
                  </>
                )}
                {isGeneratingQuiz}
              </div>
            )}

            {activeTab === 'quiz' && quizUnlocked && !isChildPerspective && quizStarted && !quizCompleted && questions.length > 0 && (
              <div className="sp-quiz-content">
                <div className="sp-question-container">
                  <h3>Question {currentQuestionIndex + 1} of {questions.length}</h3>
                  <div className="sp-question">
                    <p>{questions[currentQuestionIndex].question}</p>
                  </div>
                </div>

                <div className="sp-options-grid">
                  {questions[currentQuestionIndex].options.map((option, index) => (
                    <div
                      key={index}
                      className={`sp-option ${selectedOption === option ? 'sp-selected' : ''}`}
                      onClick={() => handleOptionSelect(option)}
                    >
                      {option}
                    </div>
                  ))}
                </div>

                <div className="sp-study-page-quiz-navigation">
                  <button
                    onClick={() => {
                      if (currentQuestionIndex > 0) {
                        setCurrentQuestionIndex(prevIndex => prevIndex - 1);
                        setSelectedOption(userAnswers[questions[currentQuestionIndex - 1].id] || null);
                      }
                    }}
                    className="sp-study-page-nav-button"
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </button>

                  {currentQuestionIndex < questions.length - 1 ? (
                    <button
                      onClick={() => {
                        if (selectedOption) {
                          setUserAnswers(prev => ({
                            ...prev,
                            [questions[currentQuestionIndex].id]: selectedOption
                          }));
                        }

                        if (currentQuestionIndex < questions.length - 1) {
                          setCurrentQuestionIndex(prevIndex => prevIndex + 1);
                          setSelectedOption(userAnswers[questions[currentQuestionIndex + 1].id] || null);
                        }
                      }}
                      className="sp-study-page-nav-button"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleFinishQuiz}
                      className="sp-study-page-finish-button"
                    >
                      Finish Quiz
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'quiz' && quizUnlocked && !isChildPerspective && quizCompleted && (
              <div className="sp-quiz-results scrollable">
                <h2>Quiz Completed!</h2>
                <div className="sp-quiz-stats">
                  <div className="sp-stat-item">
                    <span className="sp-stat-label">Total Questions:</span>
                    <span className="sp-stat-value">{questions.length}</span>
                  </div>
                  <div className="sp-stat-item">
                    <span className="sp-stat-label">Correct Answer:</span>
                    <span className="sp-stat-value">{
                      Object.entries(userAnswers).filter(([key, value]) =>
                        value === questions[parseInt(key) - 1]?.correctAnswer
                      ).length
                    }</span>
                  </div>
                  <div className="sp-stat-item">
                    <span className="sp-stat-label">Wrong Answer:</span>
                    <span className="sp-stat-value">{
                      Object.entries(userAnswers).filter(([key, value]) =>
                        value !== questions[parseInt(key) - 1]?.correctAnswer && value !== ""
                      ).length
                    }</span>
                  </div>
                  <div className="sp-stat-item">
                    <span className="sp-stat-label">Unanswered:</span>
                    <span className="sp-stat-value">{
                      Object.entries(userAnswers).filter(([key, value]) =>
                        value === ""
                      ).length
                    }</span>
                  </div>
                </div>
                <div className="sp-average-stats-section">
                  <button
                    className="sp-toggle-average-stats-button"
                    onClick={() => setShowAverageStats(!showAverageStats)}
                  >
                    {showAverageStats ? 'Hide Average Stats' : 'Show Average Stats'}
                  </button>
                  {showAverageStats && (
                    <div className="sp-average-quiz-stats">
                      <div className="sp-stat-item">
                        <span className="sp-stat-label">Average Correct Answers:</span>
                        <span className="sp-stat-value">{averageStats.avgCorrectAnswers.toFixed(1)}</span>
                      </div>
                      <div className="sp-stat-item">
                        <span className="sp-stat-label">Average Wrong Answers:</span>
                        <span className="sp-stat-value">{averageStats.avgWrongAnswers.toFixed(1)}</span>
                      </div>
                      <div className="sp-stat-item">
                        <span className="sp-stat-label">Average Duration:</span>
                        <span className="sp-stat-value">{formatDuration(averageStats.avgDurationInMillis)}</span>
                      </div>
                      <div className="sp-stat-item">
                        <span className="sp-stat-label">Your Duration:</span>
                        <span className="sp-stat-value">{formatDuration(averageStats.studentDurationInMillis)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="sp-quiz-detailed-results">
                  <h3>Detailed Results</h3>
                  {questions.map((question, index) => {
                    const questionNumber = index + 1;
                    const userAnswer = userAnswers[questionNumber] || "";
                    const isCorrect = userAnswer === question.correctAnswer;
                    const isUnanswered = userAnswer === "";

                    let statusClass = isUnanswered
                      ? "sp-unanswered"
                      : (isCorrect ? "sp-correct-answer" : "sp-incorrect-answer");

                    let statusText = isUnanswered
                      ? "Unanswered"
                      : (isCorrect ? "True" : "False");

                    let statusTextClass = isUnanswered
                      ? "sp-status-unanswered"
                      : (isCorrect ? "sp-status-correct" : "sp-status-incorrect");

                    return (
                      <div key={questionNumber} className={`sp-quiz-result-item ${statusClass}`}>
                        <div className="sp-question-info">
                          <h4>Question {questionNumber}: {question.question}</h4>
                          <span className={`sp-question-status ${statusTextClass}`}>{statusText}</span>
                        </div>

                        <div className="sp-question-options">
                          {question.options.map((option, optionIndex) => {
                            const isUserSelected = userAnswer === option;
                            const isCorrectOption = question.correctAnswer === option;

                            let optionClass = "sp-option-item";
                            if (isUserSelected) optionClass += " sp-selected-option";
                            if (isCorrectOption) optionClass += " sp-correct-option";
                            if (isUserSelected && !isCorrect) optionClass += " sp-incorrect-option";

                            return (
                              <div key={optionIndex} className={optionClass}>
                                {option}
                                {isUserSelected && !isCorrectOption &&
                                  <span className="sp-user-selection"> (Your choice)</span>
                                }
                                {isCorrectOption &&
                                  <span className="sp-correct-answer-mark"> (Correct answer)</span>
                                }
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="sp-test-bank-message">
                  <p>To solve more quizzes about this topic please visit <a href={`/user/${studentId}/test-bank`}>test bank</a></p>
                </div>
              </div>
            )}

            {activeTab === 'quiz' && isChildPerspective && (
              <div className="sp-quiz-locked-message">
                <p>Quiz is closed in child perspective! Focus on the lesson content.</p>
              </div>
            )}
          </div>
        </div>

        <div className="sp-study-right-panel">
          <div className="sp-quiz-timer">
            {isChildPerspective ? 'Quiz is closed!' :
              !quizUnlocked ? `Quiz unlocks in: ${formatTime(quizTimer)}` :
                quizInProgress ? `Time left: ${formatTime(quizTimeLeft)}` :
                  'Quiz Available!'}
          </div>

          <div className={`sp-study-chat-box ${chatPanelExpanded ? 'sp-expanded' : ''} ${quizInProgress ? 'sp-blurred' : ''}`}>
            <div className="sp-study-chat-header">
              <h3>Content Assistant {quizInProgress && '(Disabled during quiz)'}</h3>
              <button
                className="sp-sutdy-expand-button"
                onClick={toggleChatPanel}
                disabled={quizInProgress}
              >
                {chatPanelExpanded ? 'Shrink' : 'Expand'}
              </button>
            </div>

            <div className="sp-study-chat-messages" ref={chatContainerRef}>
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`sp-message ${msg.sender === 'User' ? 'sp-user-message' : 'sp-ai-message'}`}
                >
                  <span className="sp-sender">{msg.sender}:</span>
                  {msg.sender === 'MetaLink AI' ? (
                    <ReactMarkdown>{msg.message}</ReactMarkdown>
                  ) : (
                    <p>{msg.message}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="sp-assistant-mode-selection">
              <button
                className={`sp-assistant-mode-button ${assistantMode === 'contentsum' ? 'sp-active' : ''}`}
                onClick={() => handleSelectAssistantMode('contentsum')}
                disabled={isChildPerspective || quizInProgress}
              >
                Content&Sum
              </button>
              <button
                className={`sp-assistant-mode-button ${assistantMode === 'quiz' ? 'sp-active' : ''}`}
                onClick={() => handleSelectAssistantMode('quiz')}
                disabled={isChildPerspective || !quizUnlocked || quizInProgress}
              >
                Quiz
              </button>
            </div>

            <div className="sp-chat-input">
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder={
                  isChildPerspective ? 'Content Assistant is off!' :
                    quizInProgress ? 'Content Assistant is disabled during quiz' :
                      assistantMode ? 'Ask a question...' : 'Please select an assistant mode first'
                }
                disabled={isChildPerspective || !assistantMode || quizInProgress}
                className={isChildPerspective || !assistantMode || quizInProgress ? 'disabled' : ''}
              />
              <button
                onClick={handleSendMessage}
                disabled={isChildPerspective || !assistantMode || quizInProgress}
                className={isChildPerspective || !assistantMode || quizInProgress ? 'disabled' : ''}
              >
                Send
              </button>
            </div>
          </div>

          <button
            onClick={() => !isChildPerspective && !quizInProgress && navigate(`/user/${studentId}/quicktest/${subLessonId}`)}
            className={`sp-quick-test-button ${isChildPerspective || quizInProgress ? 'disabled' : ''}`}
            disabled={isChildPerspective || quizInProgress}
            title={
              isChildPerspective ? 'Quick Test closed in child perspective!' :
                quizInProgress ? 'Quick Test is disabled during quiz' :
                  'Quick Test başlat'
            }
          >
            Quick Test
          </button>
        </div>

        {showPopup && (
          <div className="sp-popup-overlay">
            <div className="sp-popup">
              <p>{popupMessage}</p>
              {popupMessage === 'Please mark your answer for the question' && (
                <button onClick={() => setShowPopup(false)}>OK</button>
              )}
            </div>
          </div>
        )}

        {(leftPanelExpanded || chatPanelExpanded) && (
          <div className="sp-backdrop" onClick={() => {
            if (leftPanelExpanded) setLeftPanelExpanded(false);
            if (chatPanelExpanded) setChatPanelExpanded(false);
          }} />
        )}
      </div>
    </div>
  );
};

export default StudyPage;
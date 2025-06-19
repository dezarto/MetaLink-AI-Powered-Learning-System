import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePerspective } from '../../context/PerspectiveContext';
import './StudyTest.css';
import {
  getAllTestByStudentId,
  getAllQuizByStudentId,
  getCourseLessonAndSubLessonInformationByStudentId,
  generateTest,
  generateQuiz,
  getAllTestProgressByStudentId
} from '../../services/student-api.js';
import SecondNavbar from "../Navbar/SecondNavbar.jsx";
import HamsterWheel from "../Spinner/HamsterWheel.jsx";

const SubjectRanking = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { isChildPerspective } = usePerspective();
  const [subjectData, setSubjectData] = useState([]);
  const [tests, setTests] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [testProgress, setTestProgress] = useState(null);
  const [expandedLessons, setExpandedLessons] = useState({});
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedSubLessons, setExpandedSubLessons] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const subjectColors = [
    '#FF6B6B', '#4ECDC4', '#FFD166', '#6A0572',
    '#1A8FE3', '#F94144', '#F3722C', '#F8961E',
    '#F9C74F', '#90BE6D'
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch course hierarchy
        const hierarchyData = await getCourseLessonAndSubLessonInformationByStudentId(studentId);
        setSubjectData(hierarchyData.courses);

        // Fetch test progress
        const progressData = await getAllTestProgressByStudentId(studentId);
        setTestProgress(progressData);

        // Fetch tests
        const testData = await getAllTestByStudentId(studentId);
        setTests(testData);

        // Fetch quizzes (with fallback for missing endpoint)
        try {
          const quizData = await getAllQuizByStudentId(studentId);
          setQuizzes(quizData);
        } catch (quizErr) {
          console.log("Quiz verisi alınamadı, boş dizi kullanılıyor");
          setQuizzes([]);
        }

        // Initialize expand states
        const lessonState = {};
        const subjectState = {};
        const subLessonState = {};
        hierarchyData.courses.forEach(course => {
          subjectState[course.courseID] = false;
          course.lessons.forEach(lesson => {
            lessonState[lesson.id] = false;
            lesson.subLessons.forEach(subLesson => {
              subLessonState[subLesson.subLessonID] = false;
            });
          });
        });
        setExpandedLessons(lessonState);
        setExpandedSubjects(subjectState);
        setExpandedSubLessons(subLessonState);
        setIsLoading(false);
      } catch (err) {
        setError('An error occurred while loading data: ' + err.message);
        console.error(err);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const getTestTypeLabel = (testType) => {
    if (testType === 0) return 'Quick Test';
    if (testType === 1) return 'Normal Test';
    if (testType === 2) return 'General Test';
    return 'Test';
  };

  const getQuizTypeLabel = (quizType) => {
    if (quizType === 0) return 'Quick Quiz';
    if (quizType === 1) return 'Normal Quiz';
    if (quizType === 2) return 'General Quiz';
    return 'Quiz';
  };

  const toggleSubject = (subjectId) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subjectId]: !prev[subjectId]
    }));
  };

  const toggleLesson = (lessonId) => {
    setExpandedLessons(prev => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }));
  };

  const toggleSubLesson = (subLessonId) => {
    setExpandedSubLessons(prev => ({
      ...prev,
      [subLessonId]: !prev[subLessonId]
    }));
  };

  const handleTestClick = (testID, isSolved) => {
    if (isChildPerspective && !isSolved) return;
    if (isSolved) {
      navigate(`/user/${studentId}/trail-test/${testID}`);
    } else {
      navigate(`/user/${studentId}/solve-test/${testID}`);
    }
  };

  const handleQuizClick = (quizID, isSolved) => {
    if (isChildPerspective && !isSolved) return;
    if (isSolved) {
      navigate(`/user/${studentId}/trail-quiz/${quizID}`);
    } else {
      navigate(`/user/${studentId}/solve-quiz/${quizID}`);
    }
  };

  const handleGenerateTest = async (id, type) => {
    setIsGeneratingTest(true);
    try {
      let testData;
      if (type === 'subLesson') {
        testData = {
          studentId: parseInt(studentId),
          subLessonId: id,
          lessonId: null,
          quickTest: false,
          normalTest: true,
          generalTest: false
        };
      } else if (type === 'lesson') {
        testData = {
          studentId: parseInt(studentId),
          subLessonId: null,
          lessonId: id,
          quickTest: false,
          normalTest: false,
          generalTest: true
        };
      }

      const response = await generateTest(testData);
      const newTestId = response.testID;

      setTests(prevTests => [...prevTests, response]);
      navigate(`/user/${studentId}/solve-test/${newTestId}`);
    } catch (error) {
      console.error(`Test generation error (${type}):`, error);
      setError('The test could not be generated. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const handleGenerateQuiz = async (id, type) => {
    setIsGeneratingQuiz(true);
    try {
      let quizData;
      if (type === 'subLesson') {
        quizData = {
          studentId: parseInt(studentId),
          subLessonId: id,
          lessonId: null,
          quickQuiz: false,
          normalQuiz: true,
          generalQuiz: false
        };
      } else if (type === 'lesson') {
        quizData = {
          studentId: parseInt(studentId),
          subLessonId: null,
          lessonId: id,
          quickQuiz: false,
          normalQuiz: false,
          generalQuiz: true
        };
      }

      const response = await generateQuiz(quizData);
      const newQuizId = response.quizID;

      setQuizzes(prevQuizzes => [...prevQuizzes, response]);
      navigate(`/user/${studentId}/solve-quiz/${newQuizId}`);
    } catch (error) {
      console.error(`Quiz generation error (${type}):`, error);
      setError('The quiz could not be generated. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const getCourseProgress = (courseId) => {
    if (!testProgress || !testProgress.courseProcess) return 0;
    const courseProgress = testProgress.courseProcess.find(cp => cp.courseID === courseId);
    return courseProgress ? courseProgress.progress : 0;
  };

  const getLessonProgress = (courseId, lessonId) => {
    if (!testProgress || !testProgress.courseProcess) return 0;
    const courseProgress = testProgress.courseProcess.find(cp => cp.courseID === courseId);
    if (!courseProgress || !courseProgress.lessonsProgress) return 0;
    const lessonProgress = courseProgress.lessonsProgress.find(lp => lp.lessonID === lessonId);
    return lessonProgress ? lessonProgress.progress : 0;
  };

  if (error) {
    return (
      <div className="subject-ranking-main">
        <div className="error-container">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="subject-ranking-main">
        <div className="study-test-loading-container">
          <HamsterWheel />
          <p className="study-test-loading-text">Test Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="subject-ranking-main">
      <SecondNavbar visibleButtons={["lectures", "avatar", "profile", "logout"]} isChildPerspective={isChildPerspective} />
      {(isGeneratingTest || isGeneratingQuiz) && (
        <div className="generating-test-message">
          <div className="studyTest-hamster">
          <HamsterWheel />
          </div>
          <p>{isGeneratingTest ? 'Test is being produced, please wait...' : 'Quiz is being generated, please wait...'}</p>
        </div>
      )}
      <div className="subject-ranking-container">
        <h1 className="page-title">Course Topics</h1>

        <div className="subjects-list">
          {subjectData.map((subject, subjectIndex) => (
            <div
              key={subject.courseID}
              className="subject-card"
              style={{ borderLeftColor: subjectColors[subjectIndex % subjectColors.length] }}
            >
              <div
                className="subject-header"
                onClick={() => toggleSubject(subject.courseID)}
              >
                <div className="subject-info">
                  <span
                    className="subject-icon"
                    style={{ backgroundColor: subjectColors[subjectIndex % subjectColors.length] }}
                  >
                    {subject.name.charAt(0)}
                  </span>
                  <h2 className="subject-title">{subject.name}</h2>
                </div>
                <div className="subject-progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${getCourseProgress(subject.courseID)}%`,
                        backgroundColor: subjectColors[subjectIndex % subjectColors.length]
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">{getCourseProgress(subject.courseID)}%</span>
                  <button
                    className={`expand-button ${expandedSubjects[subject.courseID] ? 'expanded' : ''}`}
                    aria-label={expandedSubjects[subject.courseID] ? 'Hide topic titles' : 'Show topic titles'}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                </div>
              </div>

              {expandedSubjects[subject.courseID] && (
                <div className="lessons-list">
                  {subject.lessons.map((lesson, lessonIndex) => {
                    const lessonTests = tests.filter(test => test.lessonID === lesson.id && test.testType === 2);
                    const testSlots = Array.from({ length: 3 }, (_, index) => lessonTests[index] || null);

                    const lessonQuizzes = quizzes.filter(quiz => quiz.lessonID === lesson.id && quiz.quizType === 2);
                    const quizSlots = Array.from({ length: 3 }, (_, index) => lessonQuizzes[index] || null);

                    return (
                      <div key={lesson.id} className="lesson-item">
                        <div
                          className="lesson-header"
                          onClick={() => toggleLesson(lesson.id)}
                        >
                          <div className="lesson-info">
                            <span className="lesson-number">{lessonIndex + 1}</span>
                            <h3 className="lesson-title">{lesson.title}</h3>
                          </div>
                          <div className="lesson-progress-container">
                            <div className="progress-bar lesson-progress-bar">
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${getLessonProgress(subject.courseID, lesson.id)}%`,
                                  backgroundColor: subjectColors[subjectIndex % subjectColors.length]
                                }}
                              ></div>
                            </div>
                            <span className="progress-text">{getLessonProgress(subject.courseID, lesson.id)}%</span>
                            <button
                              className={`expand-button ${expandedLessons[lesson.id] ? 'expanded' : ''}`}
                              aria-label={expandedLessons[lesson.id] ? 'Hide subheadings' : 'Show subheadings'}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                          </div>
                        </div>

                        {expandedLessons[lesson.id] && (
                          <div className="lesson-content">
                            {lesson.subLessons && (
                              <div className="topics-list">
                                {lesson.subLessons.map((subLesson) => {
                                  const subLessonTests = tests.filter(
                                    test => test.subLessonID === subLesson.subLessonID && (test.testType === 0 || test.testType === 1)
                                  );
                                  const subLessonTestSlots = Array.from({ length: 3 }, (_, index) => subLessonTests[index] || null);

                                  const subLessonQuizzes = quizzes.filter(
                                    quiz => quiz.subLessonID === subLesson.subLessonID && (quiz.quizType === 0 || quiz.quizType === 1)
                                  );
                                  const subLessonQuizSlots = Array.from({ length: 3 }, (_, index) => subLessonQuizzes[index] || null);

                                  return (
                                    <div key={subLesson.subLessonID} className="topic-item">
                                      <div
                                        className="topic-header"
                                        onClick={() => toggleSubLesson(subLesson.subLessonID)}
                                      >
                                        <div className="topic-info">
                                          <div className="topic-dot"></div>
                                          <p className="topic-title">{subLesson.title}</p>
                                        </div>
                                        <button
                                          className={`expand-button ${expandedSubLessons[subLesson.subLessonID] ? 'expanded' : ''}`}
                                          aria-label={expandedSubLessons[subLesson.subLessonID] ? 'Hide tests' : 'Show tests'}
                                        >
                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                          </svg>
                                        </button>
                                      </div>
                                      {expandedSubLessons[subLesson.subLessonID] && (
                                        <div className="topic-content">
                                          <h5>Tests</h5>
                                          <div className="topic-tests">
                                            {subLessonTestSlots.map((test, slotIndex) => (
                                              <div key={slotIndex} className="test-slot">
                                                {test ? (
                                                  <button
                                                    className={`test-button ${test.isSolved ? 'solved' : 'unsolved'}`}
                                                    onClick={() => handleTestClick(test.testID, test.isSolved)}
                                                    disabled={isChildPerspective && !test.isSolved}
                                                    title={isChildPerspective && !test.isSolved ? 'Solving tests is disabled in child perspective' : ''}
                                                  >
                                                    {getTestTypeLabel(test.testType)} {slotIndex + 1}
                                                    <span className={`status-icon ${test.isSolved ? 'solved' : 'unsolved'}`}>
                                                      {test.isSolved ? (
                                                        <>
                                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                          </svg>
                                                          <span className="status-text">Solved</span>
                                                        </>
                                                      ) : (
                                                        <>
                                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                          </svg>
                                                          <span className="status-text">Not Solved</span>
                                                        </>
                                                      )}
                                                    </span>
                                                  </button>
                                                ) : (
                                                  <button
                                                    className="generate-test-button"
                                                    onClick={() => handleGenerateTest(subLesson.subLessonID, 'subLesson')}
                                                    disabled={isChildPerspective || isGeneratingTest || isGeneratingQuiz}
                                                    title={isChildPerspective ? 'Test generation disabled in child perspective' : 'Generate Test'}
                                                  >
                                                    Generate Test
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                          </div>

                                          <h5>Quizzes</h5>
                                          <div className="topic-quiz-tests">
                                            {subLessonQuizSlots.map((quiz, slotIndex) => (
                                              <div key={slotIndex} className="test-quiz-slot">
                                                {quiz ? (
                                                  <button
                                                    className={`test-quiz-button ${quiz.isSolved ? 'solved' : 'unsolved'}`}
                                                    onClick={() => handleQuizClick(quiz.quizID, quiz.isSolved)}
                                                    disabled={isChildPerspective && !quiz.isSolved}
                                                    title={isChildPerspective && !quiz.isSolved ? 'Solving quizzes is disabled in child perspective' : ''}
                                                  >
                                                    {getQuizTypeLabel(quiz.quizType)} {slotIndex + 1}
                                                    <span className={`status-icon ${quiz.isSolved ? 'solved' : 'unsolved'}`}>
                                                      {quiz.isSolved ? (
                                                        <>
                                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                          </svg>
                                                          <span className="status-text">Solved</span>
                                                        </>
                                                      ) : (
                                                        <>
                                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                                          </svg>
                                                          <span className="status-text">Not Solved</span>
                                                        </>
                                                      )}
                                                    </span>
                                                  </button>
                                                ) : (
                                                  <button
                                                    className="generate-study-quiz-button"
                                                    onClick={() => handleGenerateQuiz(subLesson.subLessonID, 'subLesson')}
                                                    disabled={isChildPerspective || isGeneratingTest || isGeneratingQuiz}
                                                    title={isChildPerspective ? 'Quiz generation disabled in child perspective' : 'Generate Quiz'}
                                                  >
                                                    Generate Quiz
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <div className="lesson-tests-container">
                              <div className="lesson-tests">
                                <h4>General Tests</h4>
                                <div className="topic-tests">
                                  {testSlots.map((test, slotIndex) => (
                                    <div key={slotIndex} className="test-slot">
                                      {test ? (
                                        <button
                                          className={`test-button ${test.isSolved ? 'solved' : 'unsolved'}`}
                                          onClick={() => handleTestClick(test.testID, test.isSolved)}
                                          disabled={isChildPerspective && !test.isSolved}
                                          title={isChildPerspective && !test.isSolved ? 'Solving tests is disabled in child perspective' : ''}
                                        >
                                          {getTestTypeLabel(test.testType)} {slotIndex + 1}
                                          <span className={`status-icon ${test.isSolved ? 'solved' : 'unsolved'}`}>
                                            {test.isSolved ? (
                                              <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                  <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                <span className="status-text">Solved</span>
                                              </>
                                            ) : (
                                              <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                                <span className="status-text">Not Solved</span>
                                              </>
                                            )}
                                          </span>
                                        </button>
                                      ) : (
                                        <button
                                          className={`generate-test-button ${isChildPerspective ? 'disabled' : ''}`}
                                          onClick={() => handleGenerateTest(lesson.id, 'lesson')}
                                          disabled={isChildPerspective || isGeneratingTest || isGeneratingQuiz}
                                          title={isChildPerspective ? 'Test generation disabled in child perspective' : 'Generate Test'}
                                        >
                                          Generate Test
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="lesson-tests">
                                <h4>General Quizzes</h4>
                                <div className="topic-tests">
                                  {quizSlots.map((quiz, slotIndex) => (
                                    <div key={slotIndex} className="test-slot">
                                      {quiz ? (
                                        <button
                                          className={`test-quiz-button ${quiz.isSolved ? 'solved' : 'unsolved'}`}
                                          onClick={() => handleQuizClick(quiz.quizID, quiz.isSolved)}
                                          disabled={isChildPerspective && !quiz.isSolved}
                                          title={isChildPerspective && !quiz.isSolved ? 'Solving quizzes is disabled in child perspective' : ''}
                                        >
                                          {getQuizTypeLabel(quiz.quizType)} {slotIndex + 1}
                                          <span className={`status-icon ${quiz.isSolved ? 'solved' : 'unsolved'}`}>
                                            {quiz.isSolved ? (
                                              <>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                  <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                                <span className="status-text">Solved</span>
                                              </>
                                            ) : (
                                              <>
                                                <svg width="14" height="14" viewBox="0 0 24 22" fill="none" stroke="currentColor" strokeWidth="2">
                                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                                </svg>
                                                <span className="status-text">Not Solved</span>
                                              </>
                                            )}
                                          </span>
                                        </button>
                                      ) : (
                                        <button
                                          className={`generate-study-quiz-button ${isChildPerspective ? 'disabled' : ''}`}
                                          onClick={() => handleGenerateQuiz(lesson.id, 'lesson')}
                                          disabled={isChildPerspective || isGeneratingTest || isGeneratingQuiz}
                                          title={isChildPerspective ? 'Quiz generation disabled in child perspective' : 'Generate Quiz'}
                                        >
                                          Generate Quiz
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {subjectData.length === 0 && (
          <div className="empty-state">
            <img src="/api/placeholder/150/150" alt="Henüz ders yok" />
            <h2>No Courses Yet</h2>
            <p>As course content is added, it will be listed here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectRanking;
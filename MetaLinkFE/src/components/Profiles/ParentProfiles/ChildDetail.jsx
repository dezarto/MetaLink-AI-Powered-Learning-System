import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerspective } from '../../../context/PerspectiveContext';
import DOMPurify from 'dompurify';
import './ChildDetail.css';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  getFriends,
  getStudentStatisticByStudentId,
  generateReportByStudentId,
  getAllReportByStudentId
} from '../../../services/student-api.js';

const CustomTooltip = ({ active, payload, label, isTest }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip" style={{
        backgroundColor: '#fff',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <p><strong>{label}</strong></p>
        {data.topic && <p><strong>Topic:</strong> {data.topic}</p>}
        <p><strong>Total Questions:</strong> {data.totalQuestions}</p>
        <p><strong>Correct Answers:</strong> {data.correctAnswers}</p>
        <p><strong>Wrong Answers:</strong> {data.wrongAnswers}</p>
        <p><strong>Duration:</strong> {data.duration} seconds</p>
        <p><strong>Date:</strong> {new Date(data.date).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })}</p>
      </div>
    );
  }
  return null;
};

const ChildDetail = ({ child, activeTab, onSave, onUpdate, onDelete }) => {
  const { togglePerspective } = usePerspective();
  const navigate = useNavigate();
  const [editedData, setEditedData] = useState({ ...child });
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [studentStats, setStudentStats] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [expandedLessons, setExpandedLessons] = useState({});
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [expandedReports, setExpandedReports] = useState({});

  useEffect(() => {
    const formattedDate = new Date(child.dateOfBirth).toISOString().split('T')[0];
    setEditedData({ ...child, dateOfBirth: formattedDate });

    const fetchStudentStats = async () => {
      try {
        const stats = await getStudentStatisticByStudentId(child.studentID);
        setStudentStats(stats);
      } catch (error) {
        console.error('Error fetching student statistics:', error);
      }
    };

    const fetchFriends = async () => {
      setFriendsLoading(true);
      try {
        const friendsData = await getFriends(child.studentID);
        const friendsWithDetails = await Promise.all(
          friendsData.map(async (friend) => {
            const friendStudentId = friend.targetStudentId === child.studentID ? friend.requesterStudentId : friend.targetStudentId;
            try {
              const response = await fetch(`https://localhost:7239/api/Student/get-student-information-by-student-id/${friendStudentId}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
              });
              const friendData = await response.json();
              return {
                ...friend,
                friendName: `${friendData.firstName} ${friendData.lastName}`
              };
            } catch (error) {
              console.error(`Error fetching friend data for ID ${friendStudentId}:`, error);
              return {
                ...friend,
                friendName: `UserID: ${friendStudentId}`,
              };
            }
          })
        );
        setFriends(friendsWithDetails);
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
      setFriendsLoading(false);
    };

    const fetchReports = async () => {
      try {
        const reportsData = await getAllReportByStudentId(child.studentID);
        setReports(reportsData.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      } catch (error) {
        console.error('Error fetching reports:', error);
      }
    };

    fetchStudentStats();
    fetchFriends();
    fetchReports();
  }, [child]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({
      ...prev,
      [name]: parseInt(value) || 0,
    }));
  };

  const handleGenderChange = (gender) => {
    setEditedData((prev) => ({
      ...prev,
      gender,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(editedData);
  };

  const handleDeleteChild = (e) => {
    e.preventDefault();
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = () => {
    onDelete(child.studentID);
    setShowDeleteConfirmation(false);
  };

  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getLearningStyleText = (styleType) => {
    switch (styleType) {
      case 1:
        return 'Visual Learning Style';
      case 2:
        return 'Auditory Learning Style';
      case 3:
        return 'Tactile/Kinesthetic Learning Style';
      default:
        return 'Unknown';
    }
  };

  const getTestTypeText = (testType) => {
    switch (testType) {
      case 0:
        return 'QuickTest';
      case 1:
        return 'NormalTest';
      case 2:
        return 'GeneralTest';
      default:
        return 'Unknown';
    }
  };

  const getQuizTypeText = (quizType) => {
    switch (quizType) {
      case 0:
        return 'QuickQuiz';
      case 1:
        return 'NormalQuiz';
      case 2:
        return 'GeneralQuiz';
      default:
        return 'Unknown';
    }
  };

  const calculateLessonStats = (courseProgress) => {
    let totalLessons = 0;
    let completedLessons = 0;
    let totalSubLessons = 0;
    let completedSubLessons = 0;

    courseProgress.forEach(course => {
      totalLessons += course.totalLesson || 0;
      completedLessons += course.compleatedLessonCount || 0;
      totalSubLessons += course.totalSubLesson || 0;
      completedSubLessons += course.compleatedSubLessonCount || 0;
    });

    const incompleteLessons = totalLessons - completedLessons;
    const incompleteSubLessons = totalSubLessons - completedSubLessons;
    const completionRate = totalLessons > 0 ? ((completedLessons / totalLessons) * 100).toFixed(2) : 0;
    const subLessonCompletionRate = totalSubLessons > 0 ? ((completedSubLessons / totalSubLessons) * 100).toFixed(2) : 0;

    return {
      totalLessons,
      completedLessons,
      incompleteLessons,
      completionRate,
      totalSubLessons,
      completedSubLessons,
      incompleteSubLessons,
      subLessonCompletionRate,
      lessonChartData: [{
        name: 'Lesson Stats',
        total: totalLessons,
        completed: completedLessons,
        incomplete: incompleteLessons
      }],
      subLessonChartData: [{
        name: 'Sub-Lesson Stats',
        total: totalSubLessons,
        completed: completedSubLessons,
        incomplete: incompleteSubLessons
      }]
    };
  };

  const calculateTestStats = (statistic) => {
    const testStats = statistic.filter(stat => stat.testID !== null);
    const groupedStats = {};

    testStats.forEach(stat => {
      const testType = stat.testType;
      if (!groupedStats[testType]) {
        groupedStats[testType] = {
          count: 0,
          correct: 0,
          wrong: 0
        };
      }
      groupedStats[testType].count += 1;
      groupedStats[testType].correct += stat.correctAnswers;
      groupedStats[testType].wrong += stat.wrongAnswers;
    });

    const barChartData = Object.keys(groupedStats).map(testType => {
      const stats = groupedStats[testType];
      return {
        name: getTestTypeText(parseInt(testType)),
        tests: stats.count,
        correct: stats.correct,
        wrong: stats.wrong
      };
    });

    const lineChartData = testStats.map(stat => ({
      name: `Test ID: ${stat.testID} (${getTestTypeText(stat.testType)})`,
      totalQuestions: stat.totalQuestions,
      duration: (stat.durationInMilliseconds / 1000).toFixed(2),
      topic: stat.testTopic || 'N/A',
      correctAnswers: stat.correctAnswers,
      wrongAnswers: stat.wrongAnswers,
      date: stat.testDate
    }));

    return {
      totalTests: testStats.length,
      barChartData,
      lineChartData
    };
  };

  const calculateQuizStats = (statistic) => {
    const quizStats = statistic.filter(stat => stat.quizID !== null);
    const groupedStats = {};

    quizStats.forEach(stat => {
      const quizType = stat.quizType;
      if (!groupedStats[quizType]) {
        groupedStats[quizType] = {
          count: 0,
          correct: 0,
          wrong: 0
        };
      }
      groupedStats[quizType].count += 1;
      groupedStats[quizType].correct += stat.correctAnswers;
      groupedStats[quizType].wrong += stat.wrongAnswers;
    });

    const barChartData = Object.keys(groupedStats).map(quizType => {
      const stats = groupedStats[quizType];
      return {
        name: getQuizTypeText(parseInt(quizType)),
        quizzes: stats.count,
        correct: stats.correct,
        wrong: stats.wrong
      };
    });

    const lineChartData = quizStats.map(stat => ({
      name: `Quiz ID: ${stat.quizID} (${getQuizTypeText(stat.quizType)})`,
      totalQuestions: stat.totalQuestions,
      duration: (stat.durationInMilliseconds / 1000).toFixed(2),
      topic: stat.quizTopic || 'N/A',
      correctAnswers: stat.correctAnswers,
      wrongAnswers: stat.wrongAnswers,
      date: stat.testDate
    }));

    return {
      totalQuizzes: quizStats.length,
      barChartData,
      lineChartData
    };
  };

  const renderStatisticsTab = () => {
    const currentDate = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const toggleCourse = (courseName) => {
      setExpandedCourses(prev => ({
        ...prev,
        [courseName]: !prev[courseName]
      }));
    };

    const toggleLesson = (courseName, lessonName) => {
      setExpandedLessons(prev => ({
        ...prev,
        [`${courseName}-${lessonName}`]: !prev[`${courseName}-${lessonName}`]
      }));
    };

    const toggleReport = (reportId) => {
      setExpandedReports(prev => ({
        ...prev,
        [reportId]: !prev[reportId]
      }));
    };

    const handleGenerateReport = async () => {
      setIsReportLoading(true);
      try {
        await generateReportByStudentId(child.studentID);
        const updatedReports = await getAllReportByStudentId(child.studentID);
        setReports(updatedReports.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
      } catch (error) {
        console.error('Error generating report:', error);
      } finally {
        setIsReportLoading(false);
      }
    };

    const renderReportContent = (reportText) => {
      // Sanitize the HTML content to prevent XSS
      const sanitizedHtml = DOMPurify.sanitize(reportText, {
        ADD_TAGS: ['style'], // Allow style tags
        ADD_ATTR: ['class'], // Allow class attributes for styling
      });

      // Extract <style> content and body content
      const styleMatch = sanitizedHtml.match(/<style>([\s\S]*?)<\/style>/);
      const styleContent = styleMatch ? styleMatch[1] : '';
      const bodyContent = sanitizedHtml.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<!DOCTYPE html>|<html[^>]*>|<\/html>|<head[^>]*>|<\/head>|<body[^>]*>|<\/body>/gi, '');

      return (
        <div className="report-content-wrapper">
          {styleContent && <style>{styleContent}</style>}
          <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
        </div>
      );
    };

    if (!studentStats) {
      return (
        <div className="statistics-tab">
          <div className="report-card">
            <h4>Statistics Report</h4>
            <button
              className="report-button"
              onClick={handleGenerateReport}
              disabled={isReportLoading}
            >
              {isReportLoading ? (
                <div className="report-loading">
                  <div className="spinner"></div>
                  Generating...
                </div>
              ) : (
                'Generate Report'
              )}
            </button>
            <div className="report-details">
              <p><strong>Report Date:</strong> {currentDate}</p>
              <p><strong>Student Name:</strong> Loading...</p>
              <p><strong>Grade:</strong> Loading...</p>
              <p><strong>Learning Style:</strong> Loading...</p>
            </div>
          </div>
          <h3>Statistics</h3>
          <div className="statistics-card">
            <h4>Loading...</h4>
            <p>Student statistics are loading...</p>
          </div>
        </div>
      );
    }

    const { firstName, lastName, class: grade, learningStyleType, learningStyleCompleated, courseProgress, statistic } = studentStats;

    let lessonStats = { totalLessons: 0 };
    let testStats = { totalTests: 0, barChartData: [], lineChartData: [] };
    let quizStats = { totalQuizzes: 0, barChartData: [], lineChartData: [] };

    if (statistic && Array.isArray(statistic)) {
      lessonStats = calculateLessonStats(courseProgress || []);
      testStats = calculateTestStats(statistic);
      quizStats = calculateQuizStats(statistic);
    }

    return (
      <div className="statistics-tab">
        <div className="report-card">
          <h4>Statistics Report</h4>
          <button
            className="report-button"
            onClick={handleGenerateReport}
            disabled={isReportLoading}
          >
            {isReportLoading ? (
              <div className="report-loading">
                <div className="spinner"></div>
                Generating...
              </div>
            ) : (
              'Generate Report'
            )}
          </button>
          <div className="report-details">
            <p><strong>Report Date:</strong> {currentDate}</p>
            <p><strong>Student Name:</strong> {firstName} {lastName}</p>
            <p><strong>Grade:</strong> {grade}</p>
            <p><strong>Learning Style:</strong> {learningStyleCompleated ? getLearningStyleText(learningStyleType) : 'Not Completed'}</p>
          </div>
        </div>

        <div className="reports-section">
          <h4>Generated Reports</h4>
          {reports.length === 0 ? (
            <p>No reports available.</p>
          ) : (
            reports.map((report, index) => (
              <div key={report.id} className="report-item">
                <div
                  className="report-header"
                  onClick={() => toggleReport(report.id)}
                  role="button"
                  aria-expanded={expandedReports[report.id]}
                >
                  <div className="report-title">Report {index + 1}</div>
                  <div className="report-meta">
                    <span>Created: {formatDate(report.createdAt)}</span>
                    <span>By: {report.createdBy}</span>
                    <span>{expandedReports[report.id] ? '▼' : '▶'}</span>
                  </div>
                </div>
                {expandedReports[report.id] && (
                  <div className="report-content">
                    {renderReportContent(report.reportText)}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <h3>Statistics</h3>

        <div className="statistics-card">
          <h4>Learning Profile</h4>
          <div className="statistics-list">
            <div className="statistic-item">
              <div className="statistic-label">Name:</div>
              <div className="statistic-value">{firstName} {lastName}</div>
            </div>
            <div className="statistic-item">
              <div className="statistic-label">Grade:</div>
              <div className="statistic-value">{grade}</div>
            </div>
            <div className="statistic-item">
              <div className="statistic-label">Learning Style:</div>
              <div className="statistic-value">{learningStyleCompleated ? getLearningStyleText(learningStyleType) : 'Not Completed'}</div>
            </div>
            {!learningStyleCompleated && (
              <div className="statistic-message">
                Please ensure your student completes the learning style test.
              </div>
            )}
          </div>
        </div>

        {!learningStyleCompleated ? (
          <div className="statistics-card">
            <h4>No Data</h4>
            <p>Statistics are not available until the learning style test is completed.</p>
          </div>
        ) : (
          <>
            <div className="statistics-card">
              <h4>Lesson Progress</h4>
              {lessonStats.totalLessons === 0 ? (
                <p>No lesson data available.</p>
              ) : (
                <div className="chart-container">
                  <div className='chart-lesson-all'>
                    <div className='chart-lesson'>
                      <h5>Lessons</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={lessonStats.lessonChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total" name="Total Lessons" fill="#8884d8" />
                          <Bar dataKey="completed" name="Completed Lessons" fill="#82ca9d" />
                          <Bar dataKey="incomplete" name="Incomplete Lessons" fill="#ff4444" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="statistic-item">
                        <div className="statistic-label">Completion Rate:</div>
                        <div className="statistic-value">{lessonStats.completionRate}%</div>
                      </div>
                    </div>

                    <div className='chart-sub-lesson'>
                      <h5>Sub-Lessons</h5>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={lessonStats.subLessonChartData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total" name="Total Sub-Lessons" fill="#8884d8" />
                          <Bar dataKey="completed" name="Completed Sub-Lessons" fill="#82ca9d" />
                          <Bar dataKey="incomplete" name="Incomplete Sub-Lessons" fill="#ff4444" />
                        </BarChart>
                      </ResponsiveContainer>
                      <div className="statistic-item">
                        <div className="statistic-label">Sub-Lesson Completion Rate:</div>
                        <div className="statistic-value">{lessonStats.subLessonCompletionRate}%</div>
                      </div>
                    </div>
                  </div>
                  <h5>Lesson Details</h5>
                  <div className="course-details">
                    {courseProgress.map(course => (
                      <div key={course.courseID} className="course-card">
                        <div
                          className="course-header"
                          onClick={() => toggleCourse(course.courseName)}
                          role="button"
                          aria-expanded={expandedCourses[course.courseName]}
                          aria-label={`Toggle ${course.courseName} details`}
                        >
                          <h6>{course.courseName}</h6>
                          <span>{expandedCourses[course.courseName] ? '▼' : '▶'}</span>
                        </div>
                        {expandedCourses[course.courseName] && (
                          <div className="lesson-list">
                            {course.lessonsProgress.map(lesson => (
                              <div key={lesson.lessonID} className="lesson-item">
                                <div
                                  className="lesson-header"
                                  onClick={() => toggleLesson(course.courseName, lesson.lessonName)}
                                  role="button"
                                  aria-expanded={expandedLessons[`${course.courseName}-${lesson.lessonName}`]}
                                  aria-label={`Toggle ${lesson.lessonName} details`}
                                >
                                  <span>{lesson.lessonName}</span>
                                  <span>
                                    {lesson.isCompleted ? '✅' : '❌'} ({lesson.progress}%) {expandedLessons[`${course.courseName}-${lesson.lessonName}`] ? '▼' : '▶'}
                                  </span>
                                </div>
                                {expandedLessons[`${course.courseName}-${lesson.lessonName}`] && (
                                  <div className="sub-lesson-list">
                                    {lesson.subLessonsProgress.map(subLesson => (
                                      <div key={subLesson.subLessonID} className="sub-lesson-item">
                                        <div className="sub-lesson-info">
                                          <span>{subLesson.subLessonName}</span>
                                          <span>
                                            {subLesson.isCompleted ? `✅ Completed (${formatDate(subLesson.completionDate)})` : `❌ Not Completed`} ({subLesson.progress}%)
                                          </span>
                                        </div>
                                        <div className="progress-bar" role="progressbar" aria-valuenow={subLesson.progress} aria-valuemin="0" aria-valuemax="100">
                                          <div
                                            className="progress-fill"
                                            style={{ width: `${subLesson.progress}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="statistics-card">
              <h4>Test Statistics</h4>
              {testStats.totalTests === 0 ? (
                <p>No test data available.</p>
              ) : (
                <>
                  <h5>Test Counts and Answers</h5>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={testStats.barChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="tests" name="Total Tests" fill="#8884d8" />
                        <Bar dataKey="correct" name="Correct Answers" fill="#82ca9d" />
                        <Bar dataKey="wrong" name="Wrong Answers" fill="#ff4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <h5>Questions and Duration per Test</h5>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={testStats.lineChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip content={<CustomTooltip isTest={true} />} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="totalQuestions" name="Total Questions" stroke="#2196f3" activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="duration" name="Duration (s)" stroke="#ff9800" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>

            <div className="statistics-card">
              <h4>Quiz Statistics</h4>
              {quizStats.totalQuizzes === 0 ? (
                <p>No quiz data available.</p>
              ) : (
                <>
                  <h5>Quiz Counts and Answers</h5>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={quizStats.barChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="quizzes" name="Total Quizzes" fill="#8884d8" />
                        <Bar dataKey="correct" name="Correct Answers" fill="#82ca9d" />
                        <Bar dataKey="wrong" name="Wrong Answers" fill="#ff4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <h5>Questions and Duration per Quiz</h5>
                  <div className="chart-container">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart
                        data={quizStats.lineChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip content={<CustomTooltip isTest={false} />} />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="totalQuestions" name="Total Questions" stroke="#2196f3" activeDot={{ r: 8 }} />
                        <Line yAxisId="right" type="monotone" dataKey="duration" name="Duration (s)" stroke="#ff9800" activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderInfoTab = () => (
    <form onSubmit={handleSubmit}>
      <div className="chid-detail-form-group">
        <label htmlFor="firstName">First Name</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          value={editedData.firstName || ''}
          onChange={handleChange}
        />
      </div>
      <div className="chid-detail-form-group">
        <label htmlFor="lastName">Last Name</label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          value={editedData.lastName || ''}
          onChange={handleChange}
        />
      </div>
      <div className="chid-detail-form-group">
        <label htmlFor="dateOfBirth">Date of Birth</label>
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          value={editedData.dateOfBirth || ''}
          onChange={handleChange}
        />
      </div>
      <div className="chid-detail-form-group">
        <label htmlFor="class">Grade</label>
        <input
          type="number"
          id="class"
          name="class"
          value={editedData.class || 0}
          onChange={handleNumberChange}
          min="1"
          max="12"
        />
      </div>
      <div className="chid-detail-form-group">
        <label>Gender</label>
        <div className="gender-buttons">
          <button
            type="button"
            className={`gender-button ${editedData.gender === false ? 'active' : ''}`}
            onClick={() => handleGenderChange(false)}
          >
            Male
          </button>
          <button
            type="button"
            className={`gender-button ${editedData.gender === true ? 'active' : ''}`}
            onClick={() => handleGenderChange(true)}
          >
            Female
          </button>
        </div>
      </div>

      <div className="child-all-buttons">
        <button type="submit" className="save-button">
          Save Changes
        </button>
        <button
          type="button"
          className="delete-child-button"
          onClick={handleDeleteChild}
        >
          Delete Child
        </button>
      </div>
    </form>
  );

  const renderFriendsTab = () => (
    <div className="friends-tab">
      <div className="friends-header">
        <h3>Friends</h3>
      </div>
      <div className="friends-list">
        {friendsLoading ? (
          <div className="friends-loading">Loading friends...</div>
        ) : friends.length > 0 ? (
          <div className="friends-grid">
            {friends.map((friend) => (
              <div key={friend.id} className="friend-card">
                <div className="friend-info">
                  <div className="friend-name">{friend.friendName}</div>
                  <div className="friend-details">
                    <p><strong>Requester Student:</strong> {friend.requesterStudenFullName}</p>
                    <p><strong>Target Student:</strong> {friend.targetStudentFullName}</p>
                    <p><strong>Status:</strong> {friend.status}</p>
                    <p><strong>Request Date:</strong> {formatDate(friend.requestedAt)}</p>
                    <p><strong>Response Date:</strong> {formatDate(friend.respondedAt)}</p>
                    <p><strong>Blocker ID:</strong> {friend.blockerId}</p>
                    <p><strong>Deleted:</strong> {friend.isDeleted.toString()}</p>
                    <p><strong>Blocked:</strong> {friend.isBlocked.toString()}</p>
                    <p><strong>Canceled:</strong> {friend.isCanceled.toString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-friends-message">No friends added yet.</div>
        )}
      </div>
    </div>
  );

  const renderPerspectiveTab = () => (
    <div className="perspective-tab">
      <h3>{child.firstName}'s Perspective</h3>
      <div className="perspective-content">
        <button
          className="monitor-button"
          onClick={() => {
            togglePerspective(true);
            navigate(`/user/${child.studentID}/student-home-page`);
          }}
        >
          See what {child.firstName} is doing
        </button>
      </div>
    </div>
  );

  return (
    <div className="child-detail">
      {activeTab === 'info' && renderInfoTab()}
      {activeTab === 'friends' && renderFriendsTab()}
      {activeTab === 'statistics' && renderStatisticsTab()}
      {activeTab === 'perspective' && renderPerspectiveTab()}
      {showDeleteConfirmation && (
        <div className="delete-confirmation-modal">
          <div className="delete-confirmation-content">
            <p>Are you sure you want to delete {child.firstName}?</p>
            <div className="confirmation-buttons">
              <button className="confirm-button" onClick={confirmDelete}>
                Yes
              </button>
              <button className="child-detail-cancel-button" onClick={cancelDelete}>
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildDetail;
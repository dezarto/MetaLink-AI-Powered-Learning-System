import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePerspective } from '../../context/PerspectiveContext';
import './LearningStyleTest.css';
import SecondNavbar from '../Navbar/SecondNavbar.jsx';
import {
  getLearningStyleQuestions,
  postLearningStyleQuestions
} from '../../services/student-api.js';
import HamsterWheel from "../../components/Spinner/HamsterWheel"; // <-- Eklendi


const LearningStyleTest = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { isChildPerspective } = usePerspective();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState({});
  const [sectionTitles, setSectionTitles] = useState([]);
  const [categoryKeys, setCategoryKeys] = useState([]);
  const [categoryIds, setCategoryIds] = useState([]);
  const [visibleQuestionCounts, setVisibleQuestionCounts] = useState({});
  const [showReviewMessage, setShowReviewMessage] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await getLearningStyleQuestions(studentId);

        // Dynamically create keys (A, B, C, etc.) based on number of categories
        const keys = response.learningStyleCategories.map((_, index) =>
          String.fromCharCode(65 + index)
        );

        // Store original category IDs
        const ids = response.learningStyleCategories.map(category => category.id);

        // Map questions from API, preserving original IDs
        const mappedQuestions = response.learningStyleCategories.reduce((acc, category, index) => {
          acc[keys[index]] = category.learningStyleQuestions.map(q => ({
            id: q.id,
            text: q.questionText,
            categoryId: q.learningStyleCategoryID,
            isNew: false // Add a flag to track new questions
          }));
          return acc;
        }, {});

        // Set section titles from API
        const titles = response.learningStyleCategories.map((category, index) =>
          `${keys[index]} - ${category.categoryName}`
        );

        // Initialize answers dynamically based on question counts
        const initialAnswers = response.learningStyleCategories.reduce((acc, category, index) => {
          acc[keys[index]] = Array(category.learningStyleQuestions.length).fill(false);
          return acc;
        }, {});

        // Initialize visible question counts - show first 14 questions initially
        const initialVisibleCounts = keys.reduce((acc, key) => {
          acc[key] = 14;
          return acc;
        }, {});

        setCategoryKeys(keys);
        setCategoryIds(ids);
        setQuestions(mappedQuestions);
        setAnswers(initialAnswers);
        setSectionTitles(titles);
        setVisibleQuestionCounts(initialVisibleCounts);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }

    };

    fetchQuestions();
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="sublogin-fullpage-loading">
        <div className="sublogin-hamster-loading">
          <HamsterWheel />
        </div>
        <p className="loading-text">Test Loading...</p>
      </div>
    );
  }

  const handleCheckboxChange = (section, questionIndex) => {
    if (isChildPerspective) return; // Veli perspektifinde checkbox değişikliği engelleniyor

    setAnswers(prevAnswers => {
      const newSectionAnswers = [...prevAnswers[section]];
      newSectionAnswers[questionIndex] = !newSectionAnswers[questionIndex];
      return {
        ...prevAnswers,
        [section]: newSectionAnswers
      };
    });
  };

  const handleNextSection = () => {
    if (isChildPerspective) return; // Veli perspektifinde ileri gitme engelleniyor

    if (currentSection < categoryKeys.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevSection = () => {
    if (isChildPerspective) return; // Veli perspektifinde geri gitme engelleniyor

    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
      window.scrollTo(0, 0);
    }
  };

  const checkForTies = () => {
    if (isChildPerspective) return { hasTies: false, allQuestionsVisible: false }; // Veli perspektifinde işlem engelleniyor

    // Get the number of selected answers for each category
    const selectedCounts = categoryKeys.reduce((acc, key) => {
      acc[key] = answers[key].filter(answer => answer).length;
      return acc;
    }, {});

    // Check for ties
    const ties = [];
    categoryKeys.forEach((key1, i) => {
      categoryKeys.forEach((key2, j) => {
        if (i < j && selectedCounts[key1] === selectedCounts[key2]) {
          if (!ties.includes(key1)) ties.push(key1);
          if (!ties.includes(key2)) ties.push(key2);
        }
      });
    });

    // For tied categories, add 2 more questions if available
    if (ties.length > 0) {
      let updatedVisibleCounts = { ...visibleQuestionCounts };
      let updatedQuestions = { ...questions };
      let allQuestionsWillBeVisible = true;

      ties.forEach(key => {
        const currentVisible = updatedVisibleCounts[key];
        if (currentVisible < 20) {
          // Add 2 more questions (or however many remain)
          const newVisible = Math.min(currentVisible + 2, 20);
          updatedVisibleCounts[key] = newVisible;

          // Mark new questions as "NEW"
          for (let i = currentVisible; i < newVisible; i++) {
            if (updatedQuestions[key][i]) {
              updatedQuestions[key][i] = {
                ...updatedQuestions[key][i],
                isNew: true
              };
            }
          }

          // Check if all questions will be visible after this update
          if (newVisible < 20) {
            allQuestionsWillBeVisible = false;
          }
        }
      });

      setVisibleQuestionCounts(updatedVisibleCounts);
      setQuestions(updatedQuestions);

      // Check if all questions are now visible for ALL categories
      const allCategoriesComplete = categoryKeys.every(key => updatedVisibleCounts[key] === 20);
      setShowReviewMessage(allCategoriesComplete);

      return {
        hasTies: true,
        allQuestionsVisible: allQuestionsWillBeVisible && allCategoriesComplete
      };
    }

    return { hasTies: false, allQuestionsVisible: false };
  };

  const handleSubmit = async () => {
    if (isChildPerspective) return; // Veli perspektifinde testi gönderme engelleniyor

    // First check if there are any ties that need additional questions
    const { hasTies, allQuestionsVisible } = checkForTies();

    if (hasTies) {
      if (allQuestionsVisible) {
        // All 20 questions are now visible
        alert("Please review your answers.");
      } else {
        // Some categories still have fewer than 20 questions visible
        alert("Some categories have the same number of answers. Additional questions have been added. Please answer the new questions as well.");
      }
      return;
    }

    if (showReviewMessage) {
      alert("Please review your answers.");
      return;
    }

    try {
      // Prepare data in the required format using original IDs
      const postData = {
        learningStyleCategories: categoryKeys.map((key, index) => ({
          id: categoryIds[index],
          categoryName: sectionTitles[index].split(' - ')[1],
          learningStyleQuestions: questions[key].map((q, qIndex) => {
            // For questions that were never shown to the user, send null instead of true/false
            const isQuestionVisible = qIndex < visibleQuestionCounts[key];
            return {
              id: q.id,
              learningStyleCategoryID: q.categoryId,
              questionText: q.text,
              answer: isQuestionVisible ? answers[key][qIndex] : null
            };
          })
        }))
      };

      // Post the data
      await postLearningStyleQuestions(studentId, postData);

      // Navigate to a success page or dashboard
      navigate(`/user/${studentId}/color-blindness-test`);
    } catch (error) {
      console.error("Error submitting test:", error);
      alert("An error occurred while sending the test. Please try again.");
    }
  };

  const getCurrentSectionKey = () => categoryKeys[currentSection];

  // Only show the visible questions for the current section
  const currentSectionKey = getCurrentSectionKey();
  const visibleCount = visibleQuestionCounts[currentSectionKey] || 0;
  const currentQuestions = questions[currentSectionKey]
    ? questions[currentSectionKey].slice(0, visibleCount)
    : [];

  if (isLoading) {
    return (
      <div className="lst-learning-style-container">
        <div className="lst-loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <SecondNavbar
        visibleButtons={["logout", "exitChildPerspective"]}
        isChildPerspective={isChildPerspective}
      />
      <div className="lst-learning-overflow">
        {isChildPerspective ? (
          <div className="lst-child-perspective-warning">
            <h2>Please have your child take the Learning Styles Test!</h2>
            <p>This test is designed to determine your child's learning style. You cannot take the test from a parent's perspective.</p>
            <button
              className="lst-exit-perspective-button"
              onClick={() => navigate(`/user/${studentId}/student-profile`)}
            >
              Return to Student Profile
            </button>
          </div>
        ) : (
          <div className="lst-learning-style-container">
            <div className="lst-test-header">
              <h1>Learning Styles Test</h1>
              <p className="lst-test-description">
                Please put a check mark next to the activities that you think best describe you. There are no right or wrong answers in this test. The section you mark the most determines your dominant learning method.
              </p>
            </div>

            <div className="lst-section-header">
              <h2>{sectionTitles[currentSection]}</h2>
              <div className="lst-progress-indicator">
                {categoryKeys.map((key, index) => (
                  <span key={key} className={currentSection === index ? "lst-active" : ""}>{key}</span>
                ))}
              </div>
            </div>

            <div className="lst-questions-container">
              {currentQuestions.map((question, index) => (
                <div key={question.id} className="lst-question-item">
                  <div className="lst-question-number">{index + 1}</div>
                  <div className="lst-question-text">
                    {question.text}
                    {question.isNew && <span className="lst-new-question-label"> NEW</span>}
                  </div>
                  <div className="lst-checkbox-container">
                    <div
                      className={`lst-custom-checkbox ${answers[getCurrentSectionKey()][index] ? 'lst-checked' : ''} ${isChildPerspective ? 'lst-disabled' : ''}`}
                      onClick={() => handleCheckboxChange(getCurrentSectionKey(), index)}
                    >
                      {answers[getCurrentSectionKey()][index] && <span className="lst-checkmark">✓</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="lst-navigation-buttons">
              {currentSection > 0 && (
                <button
                  className="lst-nav-button lst-prev-button"
                  onClick={handlePrevSection}
                  disabled={isChildPerspective}
                >
                  Back
                </button>
              )}
              {currentSection < categoryKeys.length - 1 ? (
                <button
                  className="lst-nav-button lst-next-button"
                  onClick={handleNextSection}
                  disabled={isChildPerspective}
                >
                  Forward
                </button>
              ) : (
                <button
                  className="lst-submit-button"
                  onClick={handleSubmit}
                  disabled={isChildPerspective}
                >
                Complete the Test      
               </button>
              )}
            </div>

            {currentSection === categoryKeys.length - 1 && (
              <div className="lst-score-summary">
                {sectionTitles.map((title, index) => (
                  <div key={index} className="lst-score-item">
                    <span className="lst-score-label">{title}:</span>
                    <span className="lst-score-value">{answers[categoryKeys[index]].filter(a => a).length}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningStyleTest;
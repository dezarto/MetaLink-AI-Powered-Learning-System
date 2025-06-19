// src/components/LearningStyleTest/ColorBlindnessTest.jsx
import React, { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './ColorBlindnessTest.css';
import SecondNavbar from '../Navbar/SecondNavbar.jsx';
import HamsterWheel from '../../components/Spinner/HamsterWheel';
import {
  getColorBlindPlates,
  submitColorBlindTest,
} from '../../services/student-api.js';
import { usePerspective } from '../../context/PerspectiveContext';

// fallback context if PerspectiveContext is missing
const FallbackContext = createContext({ isChildPerspective: false });

function useSafePerspective() {
  try {
    return usePerspective();
  } catch {
    return useContext(FallbackContext);
  }
}

const ColorBlindnessTest = () => {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { isChildPerspective } = useSafePerspective();

  const [plates, setPlates] = useState([]);
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getColorBlindPlates(studentId);
        setPlates(data);
      } catch (e) {
        console.error(e);
        alert('Test tabloları yüklenemedi');
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const select = (option) => {
    if (isChildPerspective) return;
    setAnswers(a => ({ ...a, [plates[idx].plateId]: option }));
  };

  const next = () => {
    if (idx < plates.length - 1) setIdx(i => i + 1);
    else finish();
  };
  const prev = () => idx > 0 && setIdx(i => i - 1);

  const finish = async () => {
    setSubmitting(true);
    try {
      const payload = plates.map(p => ({
        plateId: p.plateId,
        selectedOption: answers[p.plateId] || '',
      }));
      const res = await submitColorBlindTest(studentId, payload);
      setResult(res);
    } catch (e) {
      console.error(e);
      alert('Error during sending');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="cbt-container">
        <HamsterWheel />
        <div className="cbt-loading-spinner">Loading…</div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="cbt-results-container">
        <SecondNavbar visibleButtons={['logout']} />
        <div className="cbt-results-text">
          <h2 className="cbt-result-message">Test {result.success ? 'Successful' : 'Unsuccessful'}</h2>
          <button className="cbt-result-button" onClick={() => navigate(`/user/${studentId}/student-home-page`)}>
            Return to Home Page
          </button>
        </div>
      </div>
    );
  }

  const plate = plates[idx];
  const sel = answers[plate.plateId] || '';

  return (
    <FallbackContext.Provider value={{ isChildPerspective }}>
      <div className="cbt-container">
        <SecondNavbar visibleButtons={['logout']} />
        <div className="cbt-progress-bar">
          <div
            className="cbt-progress-fill"
            style={{ width: `${(idx + 1) / plates.length * 100}%` }}
          />
          <span className="cbt-progress-text">
            {idx + 1} / {plates.length}
          </span>
        </div>

        <div className="cbt-question-container">
          <img
            src={plate.imageUrl}
            alt={`Plate ${plate.plateId}`}
            className="cbt-test-image"
          />
          <div className="cbt-options-container">
            {plate.options.map((o, i) => (
              <div
                key={i}
                className={`cbt-option ${sel === o ? 'cbt-selected' : ''}`}
                onClick={() => select(o)}
              >
                {o}
              </div>
            ))}
          </div>
        </div>

        <div className="cbt-navigation-buttons">
          {idx > 0 && (
            <button className="cbt-nav-button" onClick={prev} disabled={isChildPerspective}>
              Previous
            </button>
          )}
          <button className="cbt-nav-button-next"
            onClick={next}
            disabled={!sel || isChildPerspective || submitting}
          >
            {idx < plates.length - 1
              ? 'Next'
              : submitting
                ? 'Sending…'
                : 'Finish Test'}
          </button>
        </div>
      </div>
    </FallbackContext.Provider>
  );
};

export default ColorBlindnessTest;
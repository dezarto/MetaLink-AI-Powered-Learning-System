import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import authService from '../services/authService';
import { PerspectiveProvider } from '../context/PerspectiveContext';
import NotFound from '../components/ErrorPage/notFound';

const SubLogin = lazy(() => import('../components/SubLogin/SubLogin'));
const ParentProfile = lazy(() => import('../components/Profiles/ParentProfiles/ParentProfile'));
const StudentProfile = lazy(() => import('../components/Profiles/StudentProfiles/StudentProfiles'));
const AvatarChat = lazy(() => import('../components/AvatarChat/AvatarChat'));
const HomePage = lazy(() => import('../components/HomePage/homePage'));
const LearningStyleTest = lazy(() => import('../components/LearningStyleTest/LearningStyleTest'));
import StudyPage from '../components/StudyPage/StudyPage';
import QuickTest from '../components/StudyTest/QuickTest/QuickTest';
import StudyTest from '../components/StudyTest/studyTest';
import SolveTest from '../components/StudyTest/SolveTest';
import TrailTest from '../components/StudyTest/TrailTest/TrailTest';
import SolveQuiz from '../components/StudyQuiz/SolveQuiz';
import TrailQuiz from '../components/StudyQuiz/TrailQuiz/TrailQuiz';
import GameApp from '../components/Game/GameApp';
import GamePage from '../components/Game/GamePage';
import ReviewSession from '../components/StudyPage/ReviewSession/ReviewSession';
import ColorBlindnessTest from '../components/LearningStyleTest/ColorBlindnessTest';

const PrivateRoute = ({ children }) => {
    const user = authService.getCurrentUser();
    if (!user) {
        return <Navigate to="/" />;
    }
    return children;
};

const UserRoutes = () => (
    <PerspectiveProvider>
        <Suspense>
            <Routes>
                <Route path="/home" element={<PrivateRoute><SubLogin /></PrivateRoute>} />
                <Route path="/parent-profile" element={<PrivateRoute><ParentProfile /></PrivateRoute>} />
                <Route path="/:studentId/student-profile" element={<PrivateRoute><StudentProfile /></PrivateRoute>} />
                <Route path="/:studentId/avatar-chat" element={<PrivateRoute><AvatarChat /></PrivateRoute>} />
                <Route path="/:studentId/student-home-page" element={<PrivateRoute><HomePage /></PrivateRoute>} />
                <Route path="/:studentId/learningstyletest" element={<PrivateRoute><LearningStyleTest /></PrivateRoute>} />
                <Route path="/:studentId/study/:subLessonId" element={<PrivateRoute><StudyPage /></PrivateRoute>} />
                <Route path="/:studentId/review-session/:subLessonId" element={<PrivateRoute><ReviewSession /></PrivateRoute>} />
                <Route path="/:studentId/quicktest/:subLessonId" element={<PrivateRoute><QuickTest /></PrivateRoute>} />
                <Route path="/:studentId/test-bank" element={<PrivateRoute><StudyTest /></PrivateRoute>} />
                <Route path="/:studentId/solve-test/:testID" element={<PrivateRoute><SolveTest /></PrivateRoute>} />
                <Route path="/:studentId/trail-test/:testID" element={<TrailTest />} />
                <Route path="/:studentId/solve-quiz/:quizID" element={<PrivateRoute><SolveQuiz /></PrivateRoute>} />
                <Route path="/:studentId/trail-quiz/:quizId" element={<PrivateRoute><TrailQuiz /></PrivateRoute>} />
                <Route path="/:studentId/color-blindness-test" element={<PrivateRoute><ColorBlindnessTest /></PrivateRoute>} />
                <Route path="/:studentId/game" element={<PrivateRoute><GameApp /></PrivateRoute>} />
                <Route path="/:studentId/game/:gameId" element={<PrivateRoute><GamePage /></PrivateRoute>} />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </Suspense>
    </PerspectiveProvider>
);

export default UserRoutes;
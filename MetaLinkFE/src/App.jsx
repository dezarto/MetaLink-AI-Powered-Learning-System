import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginSignup from './components/LoginSignup/LoginSignup';
import ForgotPassword from './components/LoginSignup/ForgotPassword';
import UserRoutes from './routes/UserRoutes';
import AdminRoutes from './routes/AdminRoutes';
import AboutUs from './components/AboutUs/aboutUs';
import ContactUs from './components/ContactUs/communicationPage';
import Introduction from './components/Introduction/IntroductionPage';
import MissionVision from './components/MissionAndVision/missionAndVision';
import NotFound from './components/ErrorPage/notFound';
import SubLogib from './components/SubLogin/SubLogin';
import ColorBlindnessTest from './components/LearningStyleTest/ColorBlindnessTest';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route path="/user/*" element={<UserRoutes />} />
        <Route path="/login" element={<LoginSignup />} />
        <Route path="/sublogin" element={<SubLogib />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/" element={<Introduction />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/mission-vision" element={<MissionVision />} />
        <Route path="/color-blindness-test" element={<ColorBlindnessTest />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
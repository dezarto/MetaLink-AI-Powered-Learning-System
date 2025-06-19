import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ForgotPassword.css';
import email_icon from '../../assets/email.png';
import password_icon from '../../assets/password.png';
import FirstNavbar from "../Navbar/FirstNavbar.jsx";
import { forgotPassword, resetPassword } from '../../services/user-api.js';
import { Visibility, VisibilityOff } from '@mui/icons-material';

function ForgotPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState("email");
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    email: '',
    token: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setFormData(prev => ({ ...prev, token: tokenFromUrl }));
      setStep("password");
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (step === "email") {
        if (!formData.email) {
          setError('Please enter your email address.');
          setIsLoading(false);
          return;
        }

        if (!formData.email.includes('@')) {
          setError('Please enter a valid email address.');
          setIsLoading(false);
          return;
        }

        const response = await forgotPassword(formData.email);
        setError(response.message);

      } else if (step === "password" && formData.token) {
        if (!formData.newPassword) {
          setError('Please enter your new password.');
          setIsLoading(false);
          return;
        }

        if (formData.newPassword.length < 6) {
          setError('Password must be at least 6 characters long.');
          setIsLoading(false);
          return;
        }

        if (!formData.confirmPassword) {
          setError('Please confirm your password.');
          setIsLoading(false);
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }

        const response = await resetPassword({
          token: formData.token,
          password: formData.newPassword
        });
        setError(response.message);
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div>
        <FirstNavbar visibleButtons={["login"]} />
      </div>
      <div className="forgotPassPage">
        <div className='container'>
          <div className="header">
            <div className="text">Forgot Password</div>
            <div className="underline"></div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="inputs">
            {step === "email" && (
              <div className='input'>
                <img src={email_icon} alt="" />
                <input
                  type="email"
                  placeholder='Enter your email'
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            )}

            {step === "password" && !formData.token && (
              <div className="info-text">
                Please click the password reset link in your email.
              </div>
            )}
            {step === "password" && formData.token && (
              <div className={`input verification-code slide-in`}>
                <img src={password_icon} alt="" />
                <input
                  type="text"
                  name="token"
                  value={formData.token}
                  disabled
                  className="disabled-input"
                />
              </div>
            )}

            {step === "password" && formData.token && (
              <>
                <div className='input slide-in'>
                  <img src={password_icon} alt="" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder='Enter new password'
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                  />
                  <div className="password-toggle" onClick={toggleNewPasswordVisibility}>
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </div>
                </div>
                <div className='input slide-in'>
                  <img src={password_icon} alt="" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder='Confirm new password'
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <div className="password-toggle" onClick={toggleConfirmPasswordVisibility}>
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="submit-container">
            <div
              className="submit"
              onClick={handleSubmit}
            >
              {isLoading ? 'Processing...' :
                (step === "email" ? 'Send Code' :
                  formData.token ? 'Reset Password' : 'Send Code')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
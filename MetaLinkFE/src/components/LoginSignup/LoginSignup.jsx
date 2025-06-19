import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginSignup.css';
import email_icon from '../../assets/email.png';
import password_icon from '../../assets/password.png';
import authService from '../../services/authService';
import FirstNavbar from "../../components/Navbar/FirstNavbar.jsx";
import { Visibility, VisibilityOff } from '@mui/icons-material';

function LoginSignup() {
    const navigate = useNavigate();
    const [action, setAction] = useState("Login");
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showPin, setShowPin] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        pin: '',
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        phone: '',
        agreement: false
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (error) setError('');
    };

    const handleSubmit = async (actionType) => {
        if (isLoading) return;
        setIsLoading(true);
        setError('');

        try {
            if (actionType === "Login") {
                const loginData = {
                    email: formData.email,
                    password: formData.password
                };
                const response = await authService.login(loginData);
                if (response && response.token) {
                    navigate('/user/home');
                } else {
                    setError('Login failed: Invalid credentials');
                }
            } else {
                if (formData.password !== formData.confirmPassword) {
                    setError('Passwords do not match');
                    setIsLoading(false);
                    return;
                }
                if (!formData.agreement) {
                    setError('Please accept the user agreement');
                    setIsLoading(false);
                    return;
                }
                const registerData = {
                    email: formData.email,
                    password: formData.password,
                    pin: formData.pin,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    dateOfBirth: formData.dateOfBirth,
                    phone: formData.phone
                };
                await authService.register(registerData);
                setAction("Login");
                setError('Registration successful! Please login.');
            }
        } catch (err) {
            setError(typeof err === 'string' ? err : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const togglePinVisibility = () => {
        setShowPin(!showPin);
    };

    return (
        <>
            <FirstNavbar visibleButtons={["home", "about", "contact", "missionvision", "login"]} />
            <div className="loginpage">
                <div className="auth-form-container">
                    <div className="form-header">
                        <div className="form-title">{action}</div>
                        <div className="title-underline"></div>
                    </div>
                    {error && <div className="form-error">{error}</div>}

                    <div className="form-fields">
                        {action === "Sign Up" && (
                            <>
                                <div className="form-input">
                                    <input
                                        type="text"
                                        placeholder="First Name"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-input">
                                    <input
                                        type="text"
                                        placeholder="Last Name"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </>
                        )}
                        <div className="form-input">
                            <img src={email_icon} alt="" />
                            <input
                                type="email"
                                placeholder="Enter your e-mail"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-input">
                            <img src={password_icon} alt="" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <div className="password-toggle" onClick={togglePasswordVisibility}>
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </div>
                        </div>
                        {action === "Sign Up" && (
                            <>
                                <div className="form-input">
                                    <img src={password_icon} alt="" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm your password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    <div className="password-toggle" onClick={toggleConfirmPasswordVisibility}>
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </div>
                                </div>
                                <div className="form-input">
                                    <input
                                        type={showPin ? "text" : "password"}
                                        placeholder="PIN"
                                        name="pin"
                                        value={formData.pin}
                                        onChange={handleChange}
                                    />
                                    <div className="password-toggle" onClick={togglePinVisibility}>
                                        {showPin ? <VisibilityOff /> : <Visibility />}
                                    </div>
                                </div>
                                <div className="form-input">
                                    <input
                                        type="tel"
                                        placeholder="Phone Number"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-input">
                                    <input
                                        type="date"
                                        placeholder="Date of Birth"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    {action === "Sign Up" && (
                        <div className="user-agreement">
                            <input
                                type="checkbox"
                                id="agreement"
                                name="agreement"
                                checked={formData.agreement}
                                onChange={handleChange}
                            />
                            <label htmlFor="agreement"> User Agreement</label>
                        </div>
                    )}
                    {action === "Login" && (
                        <div className="forgot-password-link">
                            <span onClick={() => navigate('/forgot-password')}>Forgot Password</span>
                        </div>
                    )}
                    <div className="form-actions">
                        <div
                            className={action === "Login" ? "form-button gray" : "form-button"}
                            onClick={() => action === "Sign Up" ? handleSubmit("Sign Up") : setAction("Sign Up")}
                            disabled={isLoading}
                        >
                            {action === "Sign Up" ? (isLoading ? "Processing..." : "Sign Up") : "Sign Up"}
                        </div>
                        <div
                            className={action === "Sign Up" ? "form-button gray" : "form-button"}
                            onClick={() => action === "Login" ? handleSubmit("Login") : setAction("Login")}
                            disabled={isLoading}
                        >
                            {action === "Login" ? (isLoading ? "Processing..." : "Login") : "Login"}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default LoginSignup;
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Navbar/FirstNavbar.css';
import authService from '../../services/authService';

const Navbar = ({ visibleButtons = [] }) => {
    const navigate = useNavigate();
    const isLoggedIn = !!authService.getToken();
    const userRole = authService.getRoleFromToken();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('studentToken');
        sessionStorage.removeItem('isChildPerspective');
        navigate('/');
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const allButtons = {
        home: <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>,
        about: <Link to="/about-us" onClick={() => setMenuOpen(false)}>About</Link>,
        login: isLoggedIn ? (
            <div className="logged-in-section">
                <Link to="/user/home" className="study-area-link" onClick={() => setMenuOpen(false)}>Study Area</Link>
                {userRole === 'Admin' && (
                    <Link to="/admin/panel" className="admin-panel-link" onClick={() => setMenuOpen(false)}>Admin Panel</Link>
                )}
                <button onClick={() => { handleLogout(); setMenuOpen(false); }}>Log out</button>
            </div>
        ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
        ),
        contact: <Link to="/contact-us" onClick={() => setMenuOpen(false)}>Contact Us</Link>,
        missionvision: <Link to="/mission-vision" onClick={() => setMenuOpen(false)}>Mission&Vision</Link>,
        subLogin: <Link to="/sublogin" onClick={() => setMenuOpen(false)}>Users</Link>,
    };

    return (
        <header className="navheader">
            <a href="/" className="navLogo">MetaLink</a>

            <div className="hamburger" onClick={toggleMenu}>
                <div className={`bar ${menuOpen ? 'active' : ''}`}></div>
                <div className={`bar ${menuOpen ? 'active' : ''}`}></div>
                <div className={`bar ${menuOpen ? 'active' : ''}`}></div>
            </div>

            <nav className={`firstnavbar ${menuOpen ? 'active' : ''}`}>
                {visibleButtons.map((btn) => (
                    <React.Fragment key={btn}>
                        {allButtons[btn]}
                    </React.Fragment>
                ))}
            </nav>
        </header>
    );
};

export default Navbar;
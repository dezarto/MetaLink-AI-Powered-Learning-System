import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { usePerspective } from '../../context/PerspectiveContext';
import '../Navbar/SecondNavbar.css';
import avatarImageDefault from '../../assets/avatar-chat-default.png';

const Navbar = ({ visibleButtons = [] }) => {
    const navigate = useNavigate();
    const { studentId } = useParams();
    const { isChildPerspective, resetPerspective } = usePerspective();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('studentToken');
        sessionStorage.removeItem('isChildPerspective');
        resetPerspective();
        navigate('/');
    };

    const handleExitChildPerspective = () => {
        resetPerspective(); // Veli perspektifinden çık
        navigate(`/user/parent-profile`); // Örnek bir yönlendirme
    };

    const toggleMenu = () => {
        setMenuOpen(!menuOpen);
    };

    const allButtons = {
        lectures: (
            <Link to={`/user/${studentId}/student-home-page`} className="navButton" onClick={() => setMenuOpen(false)}>
                Lectures
            </Link>
        ),
        avatar: (
            <Link
                to={isChildPerspective ? '#' : `/user/${studentId}/avatar-chat`}
                className={`avatarButton ${isChildPerspective ? 'disabled' : ''}`}
                onClick={(e) => {
                    if (isChildPerspective) {
                        e.preventDefault();
                    } else {
                        setMenuOpen(false);
                    }
                }}
                title={isChildPerspective ? 'Avatar sohbet çocuk perspektifinde kapalı!' : 'Avatar sohbetine git'}
            >
                <img
                    src={avatarImageDefault}
                    alt="Avatar"
                    className="avatarImage"
                    style={isChildPerspective ? { opacity: 0.5 } : {}}
                />
                <span className="hoverCircle"></span>
            </Link>
        ),
        profile: (
            <Link to={`/user/${studentId}/student-profile`} className="navButton" onClick={() => setMenuOpen(false)}>
                Profile
            </Link>
        ),
        logout: (
            <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="navlogoutButton">
                Log out
            </button>
        ),
        exitChildPerspective: isChildPerspective ? (
            <button onClick={() => { handleExitChildPerspective(); setMenuOpen(false); }} className="navButton exit-perspective">
                Logout Parent Perspective
            </button>
        ) : null,
        subLogin: <Link to="/sublogin" className="navUsersButton" onClick={() => setMenuOpen(false)}>Users</Link>,
        testBank: (
            <Link to={`/user/${studentId}/test-bank`} className="navButton" onClick={() => setMenuOpen(false)}>
                Test Bank
            </Link>
        ),
        game: (
            <Link
                to={isChildPerspective ? '#' : `/user/${studentId}/game`}
                className={`navButton ${isChildPerspective ? 'disabled' : ''}`}
                onClick={(e) => {
                    if (isChildPerspective) {
                        e.preventDefault();
                    } else {
                        setMenuOpen(false);
                    }
                }}
                title={isChildPerspective ? 'Oyunlar çocuk perspektifinde kapalı!' : 'Oyunlara git'}
            >
                Games
            </Link>
        ),
    };

    return (
        <header className="secondnavheader">
            <a href="/" className="navLogo">
                MetaLink
            </a>

            <div className="second-hamburger" onClick={toggleMenu}>
                <div className={`bar ${menuOpen ? 'active' : ''}`}></div>
                <div className={`bar ${menuOpen ? 'active' : ''}`}></div>
                <div className={`bar ${menuOpen ? 'active' : ''}`}></div>
            </div>

            <nav className={`secondnavbar ${menuOpen ? 'active' : ''}`}>
                <div className="centeredButtons">
                    {visibleButtons
                        .filter((btn) => btn !== 'logout' && btn !== 'exitChildPerspective')
                        .map((btn) => (
                            <React.Fragment key={btn}>{allButtons[btn]}</React.Fragment>
                        ))}
                </div>
                {isChildPerspective && allButtons.exitChildPerspective}

                {visibleButtons.includes('logout') && (
                    <div className="logoutButton">{allButtons['subLogin']}{allButtons['logout']}</div>
                )}
            </nav>
        </header>
    );
};

export default Navbar;
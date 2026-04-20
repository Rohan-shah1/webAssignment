import { Link } from 'react-router-dom';
import './Layout.css';
import { useAuth } from '../../context/AuthContext';
import { useEffect, useState } from 'react';

const Navbar = ({ theme, toggleTheme }) => {
  const { userInfo } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <img 
            src="https://unpkg.com/lucide-static@latest/icons/chef-hat.svg" 
            alt="ChefHat" 
            style={{ width: 28, height: 28, filter: 'var(--primary-filter)' }} 
          />
          <span>RecipeNest</span>
        </Link>
        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <img
            src={
              menuOpen
                ? 'https://unpkg.com/lucide-static@latest/icons/x.svg'
                : 'https://unpkg.com/lucide-static@latest/icons/menu.svg'
            }
            alt=""
            style={{ width: 22, height: 22, filter: 'var(--icon-filter)' }}
          />
        </button>

        <div
          id="primary-navigation"
          className={`navbar-links ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(false)}
        >
          <Link to="/" className="nav-link">Chefs List</Link>
          <Link to="/recipes" className="nav-link">Recipes</Link>
          {userInfo ? (
            <>
              {userInfo.role === 'Admin' ? (
                <Link to="/admin" className="nav-link">Dashboard</Link>
              ) : (
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
              )}
              <Link to="/profile" className="nav-link">Profile</Link>
              <Link to="/saved-recipes" className="nav-link">Saved</Link>
            </>
          ) : (
            <>
              <Link to="/register" className="nav-link">Join Us</Link>
              <Link to="/login" className="nav-link login-btn">Log In</Link>
            </>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTheme();
            }}
            className="theme-toggle"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? (
              <img src="https://unpkg.com/lucide-static@latest/icons/moon.svg" alt="Moon" style={{ width: 20, height: 20, filter: 'var(--icon-filter)' }} />
            ) : (
              <img src="https://unpkg.com/lucide-static@latest/icons/sun.svg" alt="Sun" style={{ width: 20, height: 20, filter: 'var(--icon-filter)' }} />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

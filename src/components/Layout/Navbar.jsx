import { Link } from 'react-router-dom';
import { Moon, Sun, ChefHat } from 'lucide-react';
import './Layout.css';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ theme, toggleTheme }) => {
  const { userInfo } = useAuth();

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <ChefHat size={28} color="var(--primary-color)" />
          <span>RecipeNest</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className="nav-link">Chefs List</Link>
          {userInfo ? (
            <>
              {userInfo.role === 'Admin' && <Link to="/admin" className="nav-link">Admin</Link>}
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
            </>
          ) : (
            <>
              <Link to="/register" className="nav-link">Join Us</Link>
              <Link to="/login" className="nav-link login-btn">Log In</Link>
            </>
          )}
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">RecipeNest</Link>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Chefs List</Link></li>
        <li><Link to="/join-us">Join Us</Link></li>
        <li><Link to="/login">Log In</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;

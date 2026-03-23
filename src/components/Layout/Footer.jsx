import './Layout.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container text-center">
        <p>&copy; {new Date().getFullYear()} RecipeNest Chef Portal. Created by Rohan Kumar Shah.</p>
      </div>
    </footer>
  );
};

export default Footer;

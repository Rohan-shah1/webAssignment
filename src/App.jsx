import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ToastProvider from './components/Layout/ToastProvider';
import ChefList from './pages/Home/ChefList';
import RecipeFeed from './pages/Home/RecipeFeed';
import ChefProfile from './pages/ChefProfile/ChefProfile';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ChefDashboard from './pages/Dashboard/ChefDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import RecipeDetails from './pages/RecipeDetails/RecipeDetails';
import SavedRecipes from './pages/SavedRecipes/SavedRecipes';
import UserProfile from './pages/Profile/UserProfile';
import ChangePassword from './pages/Profile/ChangePassword';
import EmailOtpVerify from './pages/Auth/EmailOtpVerify';
import ForgotPassword from './pages/Auth/ForgotPassword';
import GoogleOtpVerify from './pages/Auth/GoogleOtpVerify';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

/**
 * AppContent Component
 * This is the heart of our frontend routing and layout.
 * It manages the global theme (Light/Dark mode) and defines all application paths.
 */
function AppContent() {
  // Sync theme with localStorage so it persists even after refresh
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const { userInfo } = useAuth(); // Get current user session from our Auth Context

  // Side effect: Update the HTML data-theme attribute whenever the state changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <Router>
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <ToastProvider theme={theme} />
      
      {/* Main content area - minHeight ensures the footer stays at the bottom */}
      <main style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<ChefList />} />
          <Route path="/recipes" element={<RecipeFeed />} />
          <Route path="/recipe/:id" element={<RecipeDetails />} />
          <Route path="/chef/:id" element={<ChefProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<EmailOtpVerify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/google-otp-verify" element={<GoogleOtpVerify />} />

          {/* Protected Routes
              We use a simple ternary operator to redirect unauthorized users to the login page.
              A more complex app might use a <ProtectedRoute> component, but this is clean for our scale.
          */}
          <Route path="/saved-recipes" element={userInfo ? <SavedRecipes /> : <Login />} />
          <Route path="/profile" element={userInfo ? <UserProfile /> : <Login />} />
          <Route path="/change-password" element={userInfo ? <ChangePassword /> : <Login />} />
          <Route path="/dashboard" element={userInfo ? <ChefDashboard /> : <Login />} />
          
          {/* Admin Restricted Route */}
          <Route path="/admin" element={userInfo?.role === 'Admin' ? <AdminDashboard /> : <Login />} />
        </Routes>
      </main>
      
      <Footer />
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

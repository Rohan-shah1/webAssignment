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
import EmailOtpVerify from './pages/Auth/EmailOtpVerify';
import ForgotPassword from './pages/Auth/ForgotPassword';
import GoogleOtpVerify from './pages/Auth/GoogleOtpVerify';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const { userInfo } = useAuth();

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
      <ToastProvider />
      <main style={{ minHeight: 'calc(100vh - 140px)' }}>
        <Routes>
          <Route path="/" element={<ChefList />} />
          <Route path="/recipes" element={<RecipeFeed />} />
          <Route path="/recipe/:id" element={<RecipeDetails />} />
          <Route path="/chef/:id" element={<ChefProfile />} />
          <Route path="/saved-recipes" element={userInfo ? <SavedRecipes /> : <Login />} />
          <Route path="/profile" element={userInfo ? <UserProfile /> : <Login />} />
          <Route path="/dashboard" element={userInfo ? <ChefDashboard /> : <Login />} />
          <Route path="/admin" element={userInfo?.role === 'Admin' ? <AdminDashboard /> : <Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<EmailOtpVerify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/google-otp-verify" element={<GoogleOtpVerify />} />
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

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import ToastProvider from './components/Layout/ToastProvider';
import ChefList from './pages/Home/ChefList';
import ChefProfile from './pages/ChefProfile/ChefProfile';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ChefDashboard from './pages/Dashboard/ChefDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
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
          <Route path="/chef/:id" element={<ChefProfile />} />
          <Route path="/dashboard" element={userInfo ? <ChefDashboard /> : <Login />} />
          <Route path="/admin" element={userInfo?.role === 'Admin' ? <AdminDashboard /> : <Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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

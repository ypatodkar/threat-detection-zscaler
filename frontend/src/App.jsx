import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/DashboardHome';
import Upload from './pages/Upload';
import Events from './pages/Events';
import AccessLogs from './pages/AccessLogs';
import AIDocumentation from './pages/AIDocumentation';
import Profile from './pages/Profile';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated (stored in localStorage)
    const authStatus = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(authStatus === 'true');
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    if (userData) {
      localStorage.setItem('userId', userData.id.toString());
      localStorage.setItem('username', userData.username);
      if (userData.email) {
        localStorage.setItem('email', userData.email);
      }
      if (userData.name) {
        localStorage.setItem('name', userData.name);
      }
      if (userData.profilePicture) {
        localStorage.setItem('profilePicture', userData.profilePicture);
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('name');
    localStorage.removeItem('profilePicture');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Login onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/signup" 
          element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Signup onLogin={handleLogin} />
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated ? 
              <Dashboard onLogout={handleLogout}><DashboardHome /></Dashboard> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/upload" 
          element={
            isAuthenticated ? 
              <Dashboard onLogout={handleLogout}><Upload /></Dashboard> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/events" 
          element={
            isAuthenticated ? 
              <Dashboard onLogout={handleLogout}><Events /></Dashboard> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/access-logs" 
          element={
            isAuthenticated ? 
              <Dashboard onLogout={handleLogout}><AccessLogs /></Dashboard> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/ai-docs" 
          element={
            isAuthenticated ? 
              <Dashboard onLogout={handleLogout}><AIDocumentation /></Dashboard> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route 
          path="/profile" 
          element={
            isAuthenticated ? 
              <Dashboard onLogout={handleLogout}><Profile /></Dashboard> : 
              <Navigate to="/login" replace />
          } 
        />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;


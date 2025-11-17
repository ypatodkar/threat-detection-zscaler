import { useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { FaChartBar, FaUpload, FaTable, FaNetworkWired, FaRobot, FaSignOutAlt } from 'react-icons/fa';
import API_URL from '../config/api';
import './Dashboard.css';

function Dashboard({ onLogout, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default
  const [isHovered, setIsHovered] = useState(false);
  const username = localStorage.getItem('username') || 'User';
  const name = localStorage.getItem('name') || '';
  const profilePicture = localStorage.getItem('profilePicture') || null;
  
  const getDisplayName = () => {
    return name || username;
  };
  
  const getInitials = () => {
    const displayName = getDisplayName();
    return displayName.charAt(0).toUpperCase();
  };
  
  const getProfileImage = () => {
    if (profilePicture) {
      return `${API_URL}${profilePicture}`;
    }
    return null;
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleSidebarEnter = () => {
    setIsHovered(true);
    setIsCollapsed(false);
  };

  const handleSidebarLeave = () => {
    setIsHovered(false);
    // Only collapse if not manually toggled
    setIsCollapsed(true);
  };

  const handleContentEnter = () => {
    // Collapse when mouse enters main content area
    setIsCollapsed(true);
    setIsHovered(false);
  };

  const handleTriggerEnter = () => {
    // Expand when hovering over left edge trigger
    setIsHovered(true);
    setIsCollapsed(false);
  };

  return (
    <div className="dashboard">
      {/* Hover trigger area on left edge - only active when collapsed */}
      {isCollapsed && (
        <div 
          className="sidebar-hover-trigger"
          onMouseEnter={handleTriggerEnter}
        />
      )}
      
      <aside 
        className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
      >
        <div className="sidebar-header">
          {!isCollapsed && <h1>Threat Detection</h1>}
          <button onClick={toggleSidebar} className="toggle-button" aria-label="Toggle sidebar">
            <span className="arrow-icon">{isCollapsed ? '▶' : '◀'}</span>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <Link 
            to="/dashboard" 
            className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}
            title={isCollapsed ? 'Dashboard' : ''}
          >
            <span className="nav-icon"><FaChartBar /></span>
            {!isCollapsed && <span className="nav-text">Dashboard</span>}
          </Link>
          <Link 
            to="/upload" 
            className={`nav-item ${isActive('/upload') ? 'active' : ''}`}
            title={isCollapsed ? 'Upload Logs' : ''}
          >
            <span className="nav-icon"><FaUpload /></span>
            {!isCollapsed && <span className="nav-text">Upload Logs</span>}
          </Link>
          <Link 
            to="/events" 
            className={`nav-item ${isActive('/events') ? 'active' : ''}`}
            title={isCollapsed ? 'Events' : ''}
          >
            <span className="nav-icon"><FaTable /></span>
            {!isCollapsed && <span className="nav-text">Events</span>}
          </Link>
          <Link 
            to="/access-logs" 
            className={`nav-item ${isActive('/access-logs') ? 'active' : ''}`}
            title={isCollapsed ? 'Access Logs' : ''}
          >
            <span className="nav-icon"><FaNetworkWired /></span>
            {!isCollapsed && <span className="nav-text">Access Logs</span>}
          </Link>
          <Link 
            to="/ai-docs" 
            className={`nav-item ${isActive('/ai-docs') ? 'active' : ''}`}
            title={isCollapsed ? 'AI Documentation' : ''}
          >
            <span className="nav-icon"><FaRobot /></span>
            {!isCollapsed && <span className="nav-text">AI Documentation</span>}
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div 
            className="profile-icon-container"
            onClick={() => navigate('/profile')}
            title={isCollapsed ? 'Profile' : ''}
          >
            <div className="profile-icon">
              {getProfileImage() ? (
                <img src={getProfileImage()} alt="Profile" />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>
            {!isCollapsed && <span className="profile-username">{getDisplayName()}</span>}
          </div>
          <button onClick={onLogout} className="logout-button" title={isCollapsed ? 'Logout' : ''}>
            <span className="nav-icon"><FaSignOutAlt /></span>
            {!isCollapsed && <span className="nav-text">Logout</span>}
          </button>
        </div>
      </aside>
      
      <main 
        className={`dashboard-content ${isCollapsed ? 'expanded' : ''}`}
        onMouseEnter={handleContentEnter}
      >
        {children || <Outlet />}
      </main>
    </div>
  );
}

export default Dashboard;

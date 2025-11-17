import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ThreatDetectionWidget from '../components/ThreatDetectionWidget';
import AccessLogsWidget from '../components/AccessLogsWidget';
import './DashboardHome.css';

function DashboardHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dashboardType, setDashboardType] = useState('web'); // 'web' or 'access'

  // Check URL parameter for dashboard type
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'access' || type === 'web') {
      setDashboardType(type);
    }
  }, [searchParams]);

  const handleDashboardChange = (e) => {
    const newType = e.target.value;
    setDashboardType(newType);
    setSearchParams({ type: newType });
  };

  return (
    <div className="dashboard-home">
      <div className="dashboard-selector">
        <label htmlFor="dashboard-type">Dashboard Type:</label>
        <select
          id="dashboard-type"
          value={dashboardType}
          onChange={handleDashboardChange}
          className="dashboard-dropdown"
        >
          <option value="web">Web Security Logs Dashboard</option>
          <option value="access">Access Logs Dashboard</option>
        </select>
      </div>
      {dashboardType === 'web' ? (
        <ThreatDetectionWidget />
      ) : (
        <AccessLogsWidget />
      )}
    </div>
  );
}

export default DashboardHome;




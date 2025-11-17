import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ThreatDetectionWidget.css';

function ThreatDetectionWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLogs: 0,
    totalAnomalies: 0,
    blockedRequests: 0,
    allowedRequests: 0,
    highThreats: 0,
    topThreatTypes: [],
    topCategories: [],
    topSourceIPs: [],
    topUsers: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Navigate to events page with search filter
  const handleNavigateToEvents = (field, value) => {
    navigate(`/events?${field}=${encodeURIComponent(value)}`);
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const headers = userId ? { 'x-user-id': userId } : {};

      // Fetch dashboard statistics from dedicated endpoint
      const response = await axios.get('http://localhost:3001/logs/stats', { headers });
      
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="threat-widget">
        <div className="widget-loading">Loading dashboard statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="threat-widget">
        <div className="widget-error">{error}</div>
      </div>
    );
  }

  // Calculate percentages for KPIs
  const anomalyRate = stats.totalLogs > 0 ? ((stats.totalAnomalies / stats.totalLogs) * 100).toFixed(1) : 0;
  const blockedRate = stats.totalLogs > 0 ? ((stats.blockedRequests / stats.totalLogs) * 100).toFixed(1) : 0;
  const allowedRate = stats.totalLogs > 0 ? ((stats.allowedRequests / stats.totalLogs) * 100).toFixed(1) : 0;
  const highThreatRate = stats.totalAnomalies > 0 ? ((stats.highThreats / stats.totalAnomalies) * 100).toFixed(1) : 0;
  const ratioLogsToAnomalies = stats.totalAnomalies > 0 ? `${Math.round(stats.totalLogs / stats.totalAnomalies)}:1` : '0:1';

  // Build KPI array with only those that have data
  const kpis = [];
  
  if (stats.totalLogs > 0) {
    kpis.push({
      title: 'Total Logs',
      value: formatNumber(stats.totalLogs),
      change: 'All time',
      positive: true
    });
  }
  
  if (stats.totalAnomalies > 0) {
    kpis.push({
      title: 'Total Anomalies',
      value: formatNumber(stats.totalAnomalies),
      change: `${anomalyRate}% of logs`,
      positive: false
    });
    
    kpis.push({
      title: 'Ratio Logs to Anomalies',
      value: ratioLogsToAnomalies,
      change: `${anomalyRate}% anomaly rate`,
      positive: false
    });
  }
  
  if (stats.highThreats > 0) {
    kpis.push({
      title: 'High Threats',
      value: formatNumber(stats.highThreats),
      change: `${highThreatRate}% of anomalies`,
      positive: false
    });
  }
  
  if (stats.blockedRequests > 0) {
    kpis.push({
      title: 'Blocked Requests',
      value: formatNumber(stats.blockedRequests),
      change: `${blockedRate}% blocked`,
      positive: false
    });
  }
  
  if (stats.allowedRequests > 0) {
    kpis.push({
      title: 'Allowed Requests',
      value: formatNumber(stats.allowedRequests),
      change: `${allowedRate}% allowed`,
      positive: true
    });
  }
  
  if (stats.totalAnomalies > 0) {
    kpis.push({
      title: 'Anomaly Rate',
      value: `${anomalyRate}%`,
      change: 'Detection rate',
      positive: false
    });
  }
  
  if (stats.highThreats > 0 && stats.totalAnomalies > 0) {
    kpis.push({
      title: 'Threat Ratio',
      value: `${highThreatRate}%`,
      change: 'High severity',
      positive: false
    });
  }

  return (
    <div className="threat-widget dark-theme">
      <div className="widget-header">
        <h2>Threat Detection Dashboard</h2>
      </div>
      
      <div className="widget-content">
        {/* Main Dashboard Area */}
        <div className="dashboard-main">
          {/* Top Left Panel: Top 3 Threat Types */}
          <div className="dashboard-panel top-left-panel">
            <div className="panel-title">Top 3 Threat Types</div>
            <div className="panel-content">
              {stats.topThreatTypes.length > 0 ? (
                stats.topThreatTypes.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="panel-item clickable"
                    onClick={() => handleNavigateToEvents('threat_classification', item.type)}
                    title={`Click to view logs with threat classification: ${item.type}`}
                  >
                    <span className="panel-label">{item.type}</span>
                    <span className="panel-value">{formatNumber(item.count)}</span>
                  </div>
                ))
              ) : (
                <div className="panel-item empty">No threats detected</div>
              )}
            </div>
          </div>

          {/* Top Right Panel: Top 3 Source IPs */}
          <div className="dashboard-panel top-right-panel">
            <div className="panel-title">Top 3 Source IPs</div>
            <div className="panel-content">
              {stats.topSourceIPs.length > 0 ? (
                stats.topSourceIPs.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="panel-item clickable"
                    onClick={() => handleNavigateToEvents('src_ip', item.ip)}
                    title={`Click to view logs from IP: ${item.ip}`}
                  >
                    <span className="panel-label">{item.ip}</span>
                    <span className="panel-value">{formatNumber(item.count)}</span>
                  </div>
                ))
              ) : (
                <div className="panel-item empty">No data</div>
              )}
            </div>
          </div>

          {/* Top Right Panel 2: Top 3 Categories */}
          <div className="dashboard-panel top-right-panel-2">
            <div className="panel-title">Top 3 Categories</div>
            <div className="panel-content">
              {stats.topCategories && stats.topCategories.length > 0 ? (
                stats.topCategories.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="panel-item clickable"
                    onClick={() => handleNavigateToEvents('category', item.category)}
                    title={`Click to view logs with category: ${item.category}`}
                  >
                    <span className="panel-label">{item.category}</span>
                    <span className="panel-value">{formatNumber(item.count)}</span>
                  </div>
                ))
              ) : (
                <div className="panel-item empty">No data</div>
              )}
            </div>
          </div>

          {/* Central Flow Visualization - Tree Structure */}
          <div className="flow-visualization">
            <div className="flow-container tree-container">
              {/* Root Node: Total Logs */}
              <div className="flow-node root-node">
                <div className="flow-box primary">
                  <div className="flow-value">{formatNumber(stats.totalLogs)}</div>
                  <div className="flow-label">Total Logs</div>
                </div>
                <div className="tree-connectors">
                  <div className="tree-connector left"></div>
                  <div className="tree-connector right-top"></div>
                  <div className="tree-connector right"></div>
                  <div className="tree-connector left-top"></div>
                </div>
              </div>

              {/* Tree Branches */}
              <div className="tree-branches">
                {/* Left Branch: Allowed */}
                <div className="tree-branch left-branch">
                  <div className="flow-node">
                    <div 
                      className="flow-box allowed clickable"
                      onClick={() => handleNavigateToEvents('action', 'ALLOW')}
                      title="Click to view allowed requests"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="flow-value">{formatNumber(stats.allowedRequests)}</div>
                      <div className="flow-label">Allowed</div>
                    </div>
                  </div>
                </div>

                {/* Right Branch: Blocked */}
                <div className="tree-branch right-branch">
                  <div className="flow-node">
                    <div 
                      className="flow-box blocked clickable"
                      onClick={() => handleNavigateToEvents('action', 'BLOCK')}
                      title="Click to view blocked requests"
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="flow-value">{formatNumber(stats.blockedRequests)}</div>
                      <div className="flow-label">Blocked</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Left Panel: Top 3 Users */}
          <div className="dashboard-panel bottom-left-panel-2">
            <div className="panel-title">Top 3 Users</div>
            <div className="panel-content">
              {stats.topUsers.length > 0 ? (
                stats.topUsers.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="panel-item clickable"
                    onClick={() => handleNavigateToEvents('user', item.user)}
                    title={`Click to view logs for user: ${item.user}`}
                  >
                    <span className="panel-label">{item.user}</span>
                    <span className="panel-value">{formatNumber(item.count)}</span>
                  </div>
                ))
              ) : (
                <div className="panel-item empty">No users</div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom KPI Row - Only show KPIs with data */}
        {kpis.length > 0 && (
          <div className="kpi-row">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="kpi-box">
                <div className="kpi-title">{kpi.title}</div>
                <div className="kpi-value">{kpi.value}</div>
                <div className={`kpi-change ${kpi.positive ? 'positive' : 'negative'}`}>
                  <span className="kpi-arrow">{kpi.positive ? '↑' : '↓'}</span>
                  {kpi.change}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ThreatDetectionWidget;


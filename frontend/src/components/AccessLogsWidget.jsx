import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import './AccessLogsWidget.css';

function AccessLogsWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalLogs: 0,
    totalAnomalies: 0,
    highThreats: 0,
    status2xxRequests: 0,
    status4xxRequests: 0,
    status5xxRequests: 0,
    topSourceIPs: [],
    topHttpMethods: [],
    topPaths: [],
    topUserAgents: [],
    topStatusCodes: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Navigate to access logs page with search filter
  const handleNavigateToAccessLogs = (field, value) => {
    navigate(`/access-logs?${field}=${encodeURIComponent(value)}`);
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const userId = localStorage.getItem('userId');
      const headers = userId ? { 'x-user-id': userId } : {};

      const response = await axios.get(`${API_URL}/access-logs/stats`, { headers });
      
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching access log stats:', err);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="access-logs-widget dark-theme">
        <div className="widget-loading">Loading dashboard statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="access-logs-widget dark-theme">
        <div className="widget-error">{error}</div>
      </div>
    );
  }

  // Calculate percentages for KPIs
  const anomalyRate = stats.totalLogs > 0 ? ((stats.totalAnomalies / stats.totalLogs) * 100).toFixed(1) : 0;
  const errorRate = stats.totalLogs > 0 ? (((stats.status4xxRequests + stats.status5xxRequests) / stats.totalLogs) * 100).toFixed(1) : 0;
  const successRate = stats.totalLogs > 0 ? ((stats.status2xxRequests / stats.totalLogs) * 100).toFixed(1) : 0;
  const highThreatRate = stats.totalAnomalies > 0 ? ((stats.highThreats / stats.totalAnomalies) * 100).toFixed(1) : 0;

  // Build KPI array with only those that have data
  const kpis = [];
  
  if (stats.totalLogs > 0) {
    kpis.push({
      title: 'Total Requests',
      value: formatNumber(stats.totalLogs),
      change: 'All time',
      positive: true
    });
  }
  
  if (stats.totalAnomalies > 0) {
    kpis.push({
      title: 'Total Anomalies',
      value: formatNumber(stats.totalAnomalies),
      change: `${anomalyRate}% of requests`,
      positive: false
    });
  }

  if (stats.status4xxRequests + stats.status5xxRequests > 0) {
    kpis.push({
      title: 'Error Rate',
      value: `${errorRate}%`,
      change: `${stats.status4xxRequests + stats.status5xxRequests} errors`,
      positive: false
    });
  }

  if (stats.highThreats > 0) {
    kpis.push({
      title: 'High Risk Threats',
      value: formatNumber(stats.highThreats),
      change: `${highThreatRate}% of anomalies`,
      positive: false
    });
  }

  return (
    <div className="access-logs-widget dark-theme">
      <div className="widget-header">
        <h2 style={{ color: '#4a9d97' }}>Access Logs Dashboard</h2>
        <Link to="/access-logs" className="view-table-link">
          View Detailed Table →
        </Link>
      </div>
      <div className="widget-content">
        <div className="dashboard-main">
          {/* Top Left Panel: Top 3 Source IPs */}
          <div className="dashboard-panel top-left-panel">
            <div className="panel-title">Top 3 Source IPs</div>
            <div className="panel-content">
              {stats.topSourceIPs && stats.topSourceIPs.length > 0 ? (
                stats.topSourceIPs.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="panel-item clickable"
                    onClick={() => handleNavigateToAccessLogs('src_ip', item.ip)}
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

          {/* Top Right Panel: Top 3 Paths */}
          <div className="dashboard-panel top-right-panel">
            <div className="panel-title">Top 3 Paths</div>
            <div className="panel-content">
              {stats.topPaths && stats.topPaths.length > 0 ? (
                stats.topPaths.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="panel-item clickable"
                    onClick={() => handleNavigateToAccessLogs('url_path', item.path)}
                    title={`Click to view logs for path: ${item.path}`}
                  >
                    <span className="panel-label" title={item.path}>
                      {item.path.length > 30 ? item.path.substring(0, 30) + '...' : item.path}
                    </span>
                    <span className="panel-value">{formatNumber(item.count)}</span>
                  </div>
                ))
              ) : (
                <div className="panel-item empty">No data</div>
              )}
            </div>
          </div>

          {/* Central Flow Visualization - Tree Structure with 3 branches */}
          <div className="flow-visualization">
            <div className="flow-container tree-container">
              {/* Root Node: Total Requests */}
              <div className="flow-node root-node">
                <div className="flow-box primary">
                  <div className="flow-value">{formatNumber(stats.totalLogs)}</div>
                  <div className="flow-label">Total Requests</div>
                </div>
                <div className="tree-connectors">
                  <div className="tree-connector left"></div>
                  <div className="tree-connector left-top"></div>
                  <div className="tree-connector center"></div>
                  <div className="tree-connector right"></div>
                  <div className="tree-connector right-top"></div>
                </div>
              </div>

              {/* Tree Branches - 3 branches for 2xx, 4xx, 5xx */}
              <div className="tree-branches">
                {/* Left Branch: 2xx Success */}
                <div className="tree-branch left-branch">
                  <div 
                    className="flow-box success clickable"
                    onClick={() => handleNavigateToAccessLogs('status_code', '2')}
                    title="Click to view 2xx success requests"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="flow-value">{formatNumber(stats.status2xxRequests)}</div>
                    <div className="flow-label">2xx Success</div>
                  </div>
                </div>

                {/* Center Branch: 4xx Errors */}
                <div className="tree-branch center-branch">
                  <div 
                    className="flow-box warning clickable"
                    onClick={() => handleNavigateToAccessLogs('status_code', '4')}
                    title="Click to view 4xx client errors"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="flow-value">{formatNumber(stats.status4xxRequests)}</div>
                    <div className="flow-label">4xx Errors</div>
                  </div>
                </div>

                {/* Right Branch: 5xx Errors */}
                <div className="tree-branch right-branch">
                  <div 
                    className="flow-box error clickable"
                    onClick={() => handleNavigateToAccessLogs('status_code', '5')}
                    title="Click to view 5xx server errors"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="flow-value">{formatNumber(stats.status5xxRequests)}</div>
                    <div className="flow-label">5xx Errors</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Left Panel: Top 3 User Agents */}
          <div className="dashboard-panel bottom-left-panel">
            <div className="panel-title">Top 3 User Agents</div>
            <div className="panel-content">
              {stats.topUserAgents && stats.topUserAgents.length > 0 ? (
                stats.topUserAgents.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="panel-item clickable"
                    onClick={() => handleNavigateToAccessLogs('user_agent', item.fullUserAgent)}
                    title={`Click to view logs with user agent: ${item.fullUserAgent}`}
                  >
                    <span className="panel-label" title={item.fullUserAgent}>
                      {item.userAgent}
                    </span>
                    <span className="panel-value">{formatNumber(item.count)}</span>
                  </div>
                ))
              ) : (
                <div className="panel-item empty">No data</div>
              )}
            </div>
          </div>

          {/* Bottom Center Panel: Top 3 HTTP Methods */}
          <div className="dashboard-panel bottom-center-panel">
            <div className="panel-title">Top 3 HTTP Methods</div>
            <div className="panel-content">
              {stats.topHttpMethods && stats.topHttpMethods.length > 0 ? (
                stats.topHttpMethods.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="panel-item clickable"
                    onClick={() => handleNavigateToAccessLogs('http_method', item.method)}
                    title={`Click to view ${item.method} requests`}
                  >
                    <span className="panel-label">{item.method}</span>
                    <span className="panel-value">{formatNumber(item.count)}</span>
                  </div>
                ))
              ) : (
                <div className="panel-item empty">No data</div>
              )}
            </div>
          </div>

          {/* Bottom Right Panel: Top 3 Status Codes */}
          <div className="dashboard-panel bottom-right-panel">
            <div className="panel-title">Top 3 Status Codes</div>
            <div className="panel-content">
              {stats.topStatusCodes && stats.topStatusCodes.length > 0 ? (
                stats.topStatusCodes.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="panel-item clickable"
                    onClick={() => handleNavigateToAccessLogs('status_code', item.statusCode.toString())}
                    title={`Click to view logs with status code: ${item.statusCode}`}
                  >
                    <span className="panel-label">{item.statusCode}</span>
                    <span className="panel-value">{formatNumber(item.count)}</span>
                  </div>
                ))
              ) : (
                <div className="panel-item empty">No data</div>
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

export default AccessLogsWidget;


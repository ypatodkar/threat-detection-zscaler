import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import './Events.css';

// Valid search fields mapping
const SEARCH_FIELDS = {
  src_ip: 'src_ip',
  user: 'user',
  url: 'url',
  action: 'action',
  status_code: 'status_code',
  category: 'category',
  threat_classification: 'threat_classification'
};

function Events() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Individual column search inputs
  const [searchInputs, setSearchInputs] = useState({
    src_ip: '',
    user: '',
    url: '',
    action: '',
    status_code: '',
    category: '',
    threat_classification: ''
  });

  // Initialize search inputs from URL parameters on mount
  useEffect(() => {
    const initialInputs = {
      src_ip: '',
      user: '',
      url: '',
      action: '',
      status_code: '',
      category: ''
    };
    let hasParams = false;

    // Check all valid search fields for URL parameters
    Object.keys(SEARCH_FIELDS).forEach(field => {
      const value = searchParams.get(field);
      if (value) {
        initialInputs[field] = decodeURIComponent(value);
        hasParams = true;
      }
    });

    if (hasParams) {
      setSearchInputs(initialInputs);
      // Clear URL params after reading them
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Debounced values for each column (300ms delay)
  const debouncedSrcIp = useDebouncedValue(searchInputs.src_ip, 300);
  const debouncedUser = useDebouncedValue(searchInputs.user, 300);
  const debouncedUrl = useDebouncedValue(searchInputs.url, 300);
  const debouncedAction = useDebouncedValue(searchInputs.action, 300);
  const debouncedStatusCode = useDebouncedValue(searchInputs.status_code, 300);
  const debouncedCategory = useDebouncedValue(searchInputs.category, 300);
  const debouncedThreatClassification = useDebouncedValue(searchInputs.threat_classification, 300);

  // Optimized search function
  const performSearch = useCallback(async (field, query) => {
    if (!query || query.trim() === '') {
      // If query is empty, fetch all logs
      fetchAllLogs();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId');
      const headers = userId ? { 'x-user-id': userId } : {};

      const response = await axios.get(
        `${API_URL}/logs/search?field=${field}&q=${encodeURIComponent(query.trim())}`,
        { headers }
      );

      setLogs(response.data.data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || 'Search failed');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all logs (fallback)
  const fetchAllLogs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId');
      const headers = userId ? { 'x-user-id': userId } : {};

      const params = new URLSearchParams({
        page: '1',
        limit: '50'
      });

      const response = await axios.get(`${API_URL}/logs/events?${params}`, {
        headers
      });

      setLogs(response.data.logs || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect for src_ip search
  useEffect(() => {
    performSearch('src_ip', debouncedSrcIp);
  }, [debouncedSrcIp, performSearch]);

  // Effect for user search
  useEffect(() => {
    performSearch('user', debouncedUser);
  }, [debouncedUser, performSearch]);

  // Effect for url search
  useEffect(() => {
    performSearch('url', debouncedUrl);
  }, [debouncedUrl, performSearch]);

  // Effect for action search
  useEffect(() => {
    performSearch('action', debouncedAction);
  }, [debouncedAction, performSearch]);

  // Effect for status_code search
  useEffect(() => {
    performSearch('status_code', debouncedStatusCode);
  }, [debouncedStatusCode, performSearch]);

  // Effect for category search
  useEffect(() => {
    performSearch('category', debouncedCategory);
  }, [debouncedCategory, performSearch]);

  // Effect for threat_classification search
  useEffect(() => {
    performSearch('threat_classification', debouncedThreatClassification);
  }, [debouncedThreatClassification, performSearch]);

  // Initial load
  useEffect(() => {
    fetchAllLogs();
  }, [fetchAllLogs]);

  const handleSearchChange = (field, value) => {
    setSearchInputs(prev => ({ ...prev, [field]: value }));
  };

  const extractDomain = (url) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      const match = url.match(/https?:\/\/([^\/]+)/);
      return match ? match[1] : url;
    }
  };

  // Check if any search is active
  const hasActiveSearch = Object.values(searchInputs).some(val => val.trim() !== '');

  return (
    <div className="events-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Security Events</h2>
        <Link to="/dashboard?type=web" className="view-dashboard-link">
          ← View Dashboard
        </Link>
      </div>
      <p className="search-description">
        Search as you type in any column field below. Results update automatically after 300ms.
      </p>

      <div className="column-search-filters">
        <div className="search-field">
          <label htmlFor="search-src_ip">Source IP</label>
          <input
            id="search-src_ip"
            type="text"
            placeholder="e.g., 10.1.1"
            value={searchInputs.src_ip}
            onChange={(e) => handleSearchChange('src_ip', e.target.value)}
            className="column-search-input"
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-user">Username</label>
          <input
            id="search-user"
            type="text"
            placeholder="e.g., john"
            value={searchInputs.user}
            onChange={(e) => handleSearchChange('user', e.target.value)}
            className="column-search-input"
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-url">URL</label>
          <input
            id="search-url"
            type="text"
            placeholder="e.g., google.com"
            value={searchInputs.url}
            onChange={(e) => handleSearchChange('url', e.target.value)}
            className="column-search-input"
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-action">Action</label>
          <input
            id="search-action"
            type="text"
            placeholder="ALLOW or BLOCK"
            value={searchInputs.action}
            onChange={(e) => handleSearchChange('action', e.target.value)}
            className="column-search-input"
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-status_code">Status Code</label>
          <input
            id="search-status_code"
            type="text"
            placeholder="e.g., 200, 403"
            value={searchInputs.status_code}
            onChange={(e) => handleSearchChange('status_code', e.target.value)}
            className="column-search-input"
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-category">Category</label>
          <input
            id="search-category"
            type="text"
            placeholder="e.g., Malware, Phishing"
            value={searchInputs.category}
            onChange={(e) => handleSearchChange('category', e.target.value)}
            className="column-search-input"
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-threat_classification">Threat Classification</label>
          <input
            id="search-threat_classification"
            type="text"
            placeholder="e.g., Trojan, Spyware"
            value={searchInputs.threat_classification}
            onChange={(e) => handleSearchChange('threat_classification', e.target.value)}
            className="column-search-input"
          />
        </div>

        {hasActiveSearch && (
          <button
            onClick={() => {
              setSearchInputs({
                src_ip: '',
                user: '',
                url: '',
                action: '',
                status_code: '',
                category: '',
                threat_classification: ''
              });
              fetchAllLogs();
            }}
            className="clear-search-button"
          >
            Clear All
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Searching...</div>
      ) : (
        <>


          <div className="table-container">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Source IP</th>
                  <th>User</th>
                  <th>URL</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Threat</th>
                  <th>Anomaly</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="no-results">
                      {hasActiveSearch ? 'No results found. Try a different search term.' : 'No logs available.'}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className={log.anomaly_score > 0 ? 'anomaly-row' : ''}
                      title={log.anomaly_reason || ''}
                    >
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.src_ip}</td>
                      <td>{log.user || '-'}</td>
                      <td className="url-cell">
                        <a href={log.url} target="_blank" rel="noopener noreferrer">
                          {extractDomain(log.url)}
                        </a>
                      </td>
                      <td>
                        <span className={`action-badge ${log.action.toLowerCase()}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.status_code || '-'}</td>
                      <td>{log.category || '-'}</td>
                      <td>
                        {log.threat_classification && log.threat_classification !== 'None' ? (
                          <span className="threat-badge">{log.threat_classification}</span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {log.anomaly_score > 0 ? (
                          <span className="anomaly-badge" title={log.anomaly_reason}>
                            ⚠ {log.anomaly_score.toFixed(2)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Events;

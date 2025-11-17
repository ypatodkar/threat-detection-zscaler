import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../config/api';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import './AccessLogs.css';

// Valid search fields mapping for access logs
const SEARCH_FIELDS = {
  src_ip: 'src_ip',
  user: 'user',
  url_path: 'url_path',
  http_method: 'http_method',
  status_code: 'status_code',
  user_agent: 'user_agent'
};

function AccessLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Individual column search inputs
  const [searchInputs, setSearchInputs] = useState({
    src_ip: '',
    user: '',
    url_path: '',
    http_method: '',
    status_code: '',
    user_agent: ''
  });

  // Initialize search inputs from URL parameters on mount
  useEffect(() => {
    const initialInputs = {
      src_ip: '',
      user: '',
      url_path: '',
      http_method: '',
      status_code: '',
      user_agent: ''
    };
    let hasParams = false;

    Object.keys(SEARCH_FIELDS).forEach(field => {
      const value = searchParams.get(field);
      if (value) {
        initialInputs[field] = decodeURIComponent(value);
        hasParams = true;
      }
    });

    // Handle status code prefix search (e.g., "2" for 2xx, "4" for 4xx)
    const statusPrefix = searchParams.get('status_code');
    if (statusPrefix && statusPrefix.length === 1) {
      // Don't set it directly, let the search handle it
      hasParams = true;
    }

    if (hasParams) {
      if (statusPrefix && statusPrefix.length === 1) {
        // For prefix searches, we'll search in the performSearch function
        // But we can set a placeholder
        initialInputs.status_code = statusPrefix;
      }
      setSearchInputs(initialInputs);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Debounced values for each column (300ms delay)
  const debouncedSrcIp = useDebouncedValue(searchInputs.src_ip, 300);
  const debouncedUser = useDebouncedValue(searchInputs.user, 300);
  const debouncedUrlPath = useDebouncedValue(searchInputs.url_path, 300);
  const debouncedHttpMethod = useDebouncedValue(searchInputs.http_method, 300);
  const debouncedStatusCode = useDebouncedValue(searchInputs.status_code, 300);
  const debouncedUserAgent = useDebouncedValue(searchInputs.user_agent, 300);

  // Fetch all logs
  const fetchAllLogs = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId');
      const headers = userId ? { 'x-user-id': userId } : {};

      const response = await axios.get(
        `${API_URL}/access-logs/events?page=${page}&limit=50`,
        { headers }
      );

      setLogs(response.data.logs || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.response?.data?.error || 'Failed to fetch access logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  // Optimized search function
  const performSearch = useCallback(async (field, query) => {
    if (!query || query.trim() === '') {
      fetchAllLogs();
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userId = localStorage.getItem('userId');
      const headers = userId ? { 'x-user-id': userId } : {};

      // Handle status code prefix search (e.g., "2" for 2xx, "4" for 4xx)
      let searchQuery = query.trim();
      if (field === 'status_code' && searchQuery.length === 1) {
        // For single digit, search for status codes starting with that digit
        searchQuery = searchQuery;
      }

      const response = await axios.get(
        `${API_URL}/access-logs/search?field=${field}&q=${encodeURIComponent(searchQuery)}`,
        { headers }
      );

      // If status code prefix search, filter results client-side
      let filteredLogs = response.data.logs || [];
      if (field === 'status_code' && query.trim().length === 1) {
        const prefix = parseInt(query.trim());
        filteredLogs = filteredLogs.filter(log => {
          if (!log.status_code) return false;
          const statusStr = log.status_code.toString();
          return statusStr.startsWith(query.trim());
        });
      }

      setLogs(filteredLogs);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.response?.data?.error || 'Search failed');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [fetchAllLogs]);

  // Fetch logs on mount and page change
  useEffect(() => {
    fetchAllLogs();
  }, [fetchAllLogs]);

  // Search effects
  useEffect(() => {
    performSearch('src_ip', debouncedSrcIp);
  }, [debouncedSrcIp, performSearch]);

  useEffect(() => {
    performSearch('user', debouncedUser);
  }, [debouncedUser, performSearch]);

  useEffect(() => {
    performSearch('url_path', debouncedUrlPath);
  }, [debouncedUrlPath, performSearch]);

  useEffect(() => {
    performSearch('http_method', debouncedHttpMethod);
  }, [debouncedHttpMethod, performSearch]);

  useEffect(() => {
    performSearch('status_code', debouncedStatusCode);
  }, [debouncedStatusCode, performSearch]);

  useEffect(() => {
    performSearch('user_agent', debouncedUserAgent);
  }, [debouncedUserAgent, performSearch]);

  const handleSearchChange = (field, value) => {
    setSearchInputs(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page on new search
  };

  const hasActiveSearch = Object.values(searchInputs).some(val => val.trim() !== '');

  const extractDomain = (url) => {
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const urlObj = new URL(url);
        return urlObj.hostname;
      }
      return url.split('/')[0] || url;
    } catch {
      return url;
    }
  };

  return (
    <div className="access-logs-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Access Logs</h2>
        <Link to="/dashboard?type=access" className="view-dashboard-link">
          ← View Dashboard
        </Link>
      </div>
      <p className="search-description">
        View and search through uploaded Apache/Nginx access logs. Use the search fields below to filter by specific criteria.
      </p>

      <div className="column-search-filters">
        <div className="search-field">
          <label htmlFor="search-src_ip">Source IP</label>
          <input
            id="search-src_ip"
            type="text"
            placeholder="e.g., 192.168.1.1"
            value={searchInputs.src_ip}
            onChange={(e) => handleSearchChange('src_ip', e.target.value)}
            className="column-search-input"
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-user">User</label>
          <input
            id="search-user"
            type="text"
            placeholder="e.g., admin"
            value={searchInputs.user}
            onChange={(e) => handleSearchChange('user', e.target.value)}
            className="column-search-input"
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-url_path">URL Path</label>
          <input
            id="search-url_path"
            type="text"
            placeholder="e.g., /api/users"
            value={searchInputs.url_path}
            onChange={(e) => handleSearchChange('url_path', e.target.value)}
            className="column-search-input"
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-http_method">HTTP Method</label>
          <input
            id="search-http_method"
            type="text"
            placeholder="e.g., GET, POST"
            value={searchInputs.http_method}
            onChange={(e) => handleSearchChange('http_method', e.target.value)}
            className="column-search-input"
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-status_code">Status Code</label>
          <input
            id="search-status_code"
            type="text"
            placeholder="e.g., 200, 404"
            value={searchInputs.status_code}
            onChange={(e) => handleSearchChange('status_code', e.target.value)}
            className="column-search-input"
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-user_agent">User Agent</label>
          <input
            id="search-user_agent"
            type="text"
            placeholder="e.g., Mozilla"
            value={searchInputs.user_agent}
            onChange={(e) => handleSearchChange('user_agent', e.target.value)}
            className="column-search-input"
          />
        </div>
      </div>

      {hasActiveSearch && (
        <button
          onClick={() => {
            setSearchInputs({
              src_ip: '',
              user: '',
              url_path: '',
              http_method: '',
              status_code: '',
              user_agent: ''
            });
            fetchAllLogs();
          }}
          className="clear-search-button"
        >
          Clear All
        </button>
      )}

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading access logs...</div>
      ) : (
        <div className="access-logs-table-container">
          <table className="access-logs-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Source IP</th>
                <th>User</th>
                <th>Method</th>
                <th>URL Path</th>
                <th>Status</th>
                <th>Size</th>
                <th>User Agent</th>
                <th>Anomaly</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    No access logs found
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
                    <td>
                      <span className={`method-badge ${log.http_method?.toLowerCase() || ''}`}>
                        {log.http_method || '-'}
                      </span>
                    </td>
                    <td className="url-cell">
                      <span title={log.url_path}>{log.url_path.substring(0, 50)}{log.url_path.length > 50 ? '...' : ''}</span>
                    </td>
                    <td>
                      <span className={`status-badge status-${Math.floor(log.status_code / 100)}xx`}>
                        {log.status_code || '-'}
                      </span>
                    </td>
                    <td>{(log.response_size / 1024).toFixed(2)} KB</td>
                    <td className="user-agent-cell" title={log.user_agent}>
                      {log.user_agent ? (log.user_agent.substring(0, 30) + (log.user_agent.length > 30 ? '...' : '')) : '-'}
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
      )}

      {!hasActiveSearch && totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default AccessLogs;


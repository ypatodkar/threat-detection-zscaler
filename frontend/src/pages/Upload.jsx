import { useState, useRef } from 'react';
import axios from 'axios';
import './Upload.css';

function Upload() {
  const [file, setFile] = useState(null);
  const [logType, setLogType] = useState('web'); // 'web' or 'access'
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/plain' || 
          selectedFile.name.endsWith('.log') || 
          selectedFile.name.endsWith('.txt')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select a .log or .txt file');
        setFile(null);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (droppedFile.type === 'text/plain' || 
          droppedFile.name.endsWith('.log') || 
          droppedFile.name.endsWith('.txt')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Please drop a .log or .txt file');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('logfile', file);

    // Get user ID from localStorage
    const userId = localStorage.getItem('userId');

    try {
      // Choose endpoint based on log type
      const endpoint = logType === 'web' 
        ? 'http://localhost:3001/logs/upload'
        : 'http://localhost:3001/access-logs/upload';
      
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-user-id': userId || ''
        }
      });

      setResult({
        success: true,
        message: response.data.message,
        total: response.data.total,
        anomalies: response.data.anomalies
      });
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-page">
      <h2>Upload Log File</h2>
      <p className="upload-description">
        Upload a .log or .txt file containing security logs. 
        The system will parse the logs and perform anomaly detection.
      </p>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="log-type-selector">
          <label htmlFor="log-type">Log Type:</label>
          <select
            id="log-type"
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            className="log-type-dropdown"
          >
            <option value="web">Web Security Logs (Zscaler)</option>
            <option value="access">Access Logs (Apache/Nginx)</option>
          </select>
        </div>
        <div
          className="drop-zone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".log,.txt"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          {file ? (
            <div className="file-selected">
              <p>✓ {file.name}</p>
              <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div className="drop-zone-content">
              <p>📁 Drag & drop your log file here</p>
              <p>or click to browse</p>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {result && (
          <div className="success-message">
            <h3>✓ Upload Successful!</h3>
            <p>{result.message}</p>
            <div className="result-stats">
              <div className="stat">
                <span className="stat-label">Total Logs:</span>
                <span className="stat-value">{result.total}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Anomalies Detected:</span>
                <span className="stat-value anomaly-count">{result.anomalies}</span>
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={!file || uploading}
          className="upload-button"
        >
          {uploading ? 'Processing...' : 'Upload & Process'}
        </button>
      </form>
    </div>
  );
}

export default Upload;




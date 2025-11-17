import './AIDocumentation.css';

function AIDocumentation() {
  return (
    <div className="ai-docs-page">
      <h2>Anomaly Detection Documentation</h2>

      <section className="doc-section">
        <h3>Overview</h3>
        <p>
          The Threat Detection System is a comprehensive SOC (Security Operations Center) 
          management platform that analyzes security logs from multiple sources. The system 
          uses rule-based anomaly detection to identify potential security threats and 
          suspicious patterns in both Zscaler Web Security logs and Apache/Nginx access logs.
        </p>
      </section>

      <section className="doc-section">
        <h3>Web Security Logs - Anomaly Detection Rules</h3>
        <p>
          The system analyzes Zscaler Web Security logs using the following AI-assisted 
          anomaly detection rules:
        </p>
        <ul>
          <li>
            <strong>Excessive Traffic Detection:</strong> Identifies when a single IP 
            address generates more than 100 requests within a 5-minute window. 
            Confidence: 0.85
          </li>
          <li>
            <strong>Blocked Request Spike:</strong> Detects when 10 or more blocked 
            attempts occur to the same domain within 10 minutes. Confidence: 0.75
          </li>
          <li>
            <strong>Threat Classification:</strong> Flags any log entry with a 
            non-empty threat classification (Malware, Phishing, etc.). Confidence: 0.95
          </li>
          <li>
            <strong>Repeated Errors:</strong> Identifies patterns of more than 20 
            403/404 status codes within 10 minutes. Confidence: 0.70
          </li>
          <li>
            <strong>Unusual URL Patterns:</strong> Detects SQL injection attempts and 
            encoded payloads in URLs (e.g., %00, SQL keywords, encoded characters). 
            Confidence: 0.80
          </li>
        </ul>
      </section>

      <section className="doc-section">
        <h3>Access Logs - Anomaly Detection Rules</h3>
        <p>
          For Apache/Nginx access logs, the system uses specialized rules adapted for 
          HTTP access patterns:
        </p>
        <ul>
          <li>
            <strong>Excessive Traffic from One IP:</strong> Detects when a single IP 
            generates more than 100 requests in 5 minutes. Confidence: 0.85
          </li>
          <li>
            <strong>Repeated 4xx/5xx Errors:</strong> Identifies when 20 or more error 
            responses occur within 10 minutes. Confidence: 0.70
          </li>
          <li>
            <strong>Unusual URL Pattern:</strong> Detects SQL injection attempts, encoded 
            payloads (%00, SQL keywords), and suspicious URL patterns. Confidence: 0.80
          </li>
          <li>
            <strong>Suspicious User-Agent:</strong> Flags empty user agents or known 
            scanner/bot signatures (sqlmap, nikto, nmap, etc.). Confidence: 0.75 (scanners) / 0.60 (empty)
          </li>
          <li>
            <strong>Unusual HTTP Method:</strong> Detects non-standard HTTP methods 
            (other than GET, POST, HEAD, OPTIONS). Confidence: 0.65
          </li>
        </ul>
      </section>

      <section className="doc-section">
        <h3>Web Security Logs - Field Extraction</h3>
        <p>
          The system parses Zscaler Web Security logs (space-separated format) and extracts 
          the following fields:
        </p>
        <div className="field-table">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Description</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>timestamp</td>
                <td>Access timestamp (epoch seconds)</td>
                <td>Date</td>
              </tr>
              <tr>
                <td>src_ip</td>
                <td>Client IP address</td>
                <td>String</td>
              </tr>
              <tr>
                <td>user</td>
                <td>Username or identifier</td>
                <td>String</td>
              </tr>
              <tr>
                <td>url</td>
                <td>Requested website or resource</td>
                <td>String</td>
              </tr>
              <tr>
                <td>action</td>
                <td>ALLOW or BLOCK</td>
                <td>String</td>
              </tr>
              <tr>
                <td>status_code</td>
                <td>HTTP response code</td>
                <td>Number</td>
              </tr>
              <tr>
                <td>bytes_sent</td>
                <td>Outbound traffic volume</td>
                <td>Number</td>
              </tr>
              <tr>
                <td>bytes_received</td>
                <td>Inbound traffic volume</td>
                <td>Number</td>
              </tr>
              <tr>
                <td>category</td>
                <td>Web category classification</td>
                <td>String</td>
              </tr>
              <tr>
                <td>threat_classification</td>
                <td>Threat type (Malware, Phishing, etc.)</td>
                <td>String</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="doc-section">
        <h3>Access Logs - Field Extraction</h3>
        <p>
          The system also supports Apache/Nginx Common Log Format (CLF) and Extended Log 
          Format (ELF), extracting the following fields:
        </p>
        <div className="field-table">
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Description</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>timestamp</td>
                <td>Request timestamp (Apache format)</td>
                <td>Date</td>
              </tr>
              <tr>
                <td>src_ip</td>
                <td>Client IP address</td>
                <td>String</td>
              </tr>
              <tr>
                <td>user</td>
                <td>Remote user (often '-')</td>
                <td>String</td>
              </tr>
              <tr>
                <td>http_method</td>
                <td>HTTP method (GET, POST, etc.)</td>
                <td>String</td>
              </tr>
              <tr>
                <td>url_path</td>
                <td>Requested URL path</td>
                <td>String</td>
              </tr>
              <tr>
                <td>http_version</td>
                <td>HTTP protocol version</td>
                <td>String</td>
              </tr>
              <tr>
                <td>status_code</td>
                <td>HTTP response status code</td>
                <td>Number</td>
              </tr>
              <tr>
                <td>response_size</td>
                <td>Response size in bytes</td>
                <td>Number</td>
              </tr>
              <tr>
                <td>referer</td>
                <td>HTTP referer header</td>
                <td>String</td>
              </tr>
              <tr>
                <td>user_agent</td>
                <td>User agent string</td>
                <td>String</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="doc-section">
        <h3>Threat Classification Mapping</h3>
        <p>
          The system maps Zscaler threat classifications to standardized categories 
          for consistent analysis. AI assistance was used to create this mapping:
        </p>
        <div className="threat-list">
          <div className="threat-item">
            <span className="threat-name">Malware</span>
            <span className="threat-desc">Detected malicious software or code</span>
          </div>
          <div className="threat-item">
            <span className="threat-name">Phishing</span>
            <span className="threat-desc">Suspected phishing attempt or fraudulent site</span>
          </div>
          <div className="threat-item">
            <span className="threat-name">Suspicious</span>
            <span className="threat-desc">Unusual or suspicious activity pattern</span>
          </div>
          <div className="threat-item">
            <span className="threat-name">None</span>
            <span className="threat-desc">No threat classification (normal traffic)</span>
          </div>
        </div>
      </section>

      <section className="doc-section">
        <h3>Confidence Scoring</h3>
        <p>
          Each anomaly detection rule is assigned a confidence score based on the 
          reliability and accuracy of the detection method. Higher scores indicate 
          higher confidence in the anomaly detection:
        </p>
        <ul>
          <li><strong>0.95:</strong> Very High Confidence - Direct threat indicators</li>
          <li><strong>0.85:</strong> High Confidence - Strong behavioral patterns</li>
          <li><strong>0.80:</strong> Medium-High Confidence - Pattern-based detection</li>
          <li><strong>0.75:</strong> Medium Confidence - Statistical anomalies</li>
          <li><strong>0.70:</strong> Medium-Low Confidence - Potential indicators</li>
        </ul>
      </section>

      <section className="doc-section">
        <h3>Key Features</h3>
        <p>
          The platform includes the following features:
        </p>
        <ul>
          <li><strong>Multi-Log Type Support:</strong> Handles both Zscaler Web Security logs and Apache/Nginx access logs</li>
          <li><strong>User Authentication:</strong> Secure login/signup with bcrypt password hashing</li>
          <li><strong>User Profiles:</strong> Profile management with name, email, and profile picture upload</li>
          <li><strong>User-Specific Data:</strong> All logs are filtered by the logged-in user for data isolation</li>
          <li><strong>Interactive Dashboards:</strong> Separate dashboard widgets for Web Security and Access Logs with real-time statistics</li>
          <li><strong>Advanced Search:</strong> Column-specific search with 300ms debounce for optimal performance</li>
          <li><strong>Anomaly Highlighting:</strong> Visual indicators for anomalous entries with confidence scores</li>
          <li><strong>Clickable Metrics:</strong> Dashboard metrics link directly to filtered event views</li>
          <li><strong>Database Optimization:</strong> Indexed columns for fast prefix searches using text_pattern_ops</li>
          <li><strong>Responsive Design:</strong> Dark theme UI with collapsible sidebar navigation</li>
        </ul>
      </section>

      <section className="doc-section">
        <h3>System Architecture</h3>
        <p>
          The threat detection system architecture:
        </p>
        <ul>
          <li><strong>Backend:</strong> Node.js/Express with PostgreSQL database</li>
          <li><strong>Frontend:</strong> React with Vite, React Router for navigation</li>
          <li><strong>Database:</strong> PostgreSQL with separate tables for web_logs and access_logs</li>
          <li><strong>Authentication:</strong> Session-based with localStorage for client-side state</li>
          <li><strong>File Upload:</strong> Multer for handling log file uploads</li>
          <li><strong>Anomaly Detection:</strong> Rule-based engine with configurable confidence scores</li>
          <li><strong>Search Optimization:</strong> PostgreSQL ILIKE queries with text_pattern_ops indexes</li>
        </ul>
      </section>
    </div>
  );
}

export default AIDocumentation;





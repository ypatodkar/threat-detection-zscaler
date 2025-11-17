import './AIDocumentation.css';

function AIDocumentation() {
  return (
    <div className="ai-docs-page">
      <h2>AI Usage Documentation</h2>

      <section className="doc-section">
        <h3>AI-Generated Anomaly Rules</h3>
        <p>
          The threat detection system uses AI-assisted rule generation to identify 
          anomalous patterns in web security logs. The following rules were developed 
          with AI assistance to detect potential security threats:
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
        <h3>Field Extraction Assistance</h3>
        <p>
          AI was used to assist in parsing the Zscaler Web Security log format. 
          The parser extracts the following fields from space-separated log entries:
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
        <h3>System Architecture</h3>
        <p>
          The threat detection system was built with AI assistance for:
        </p>
        <ul>
          <li>Database schema design and optimization</li>
          <li>API endpoint structure and error handling</li>
          <li>Frontend component architecture</li>
          <li>User interface design and UX patterns</li>
          <li>Code organization and best practices</li>
        </ul>
      </section>
    </div>
  );
}

export default AIDocumentation;




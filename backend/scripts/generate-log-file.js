import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate synthetic log data
function generateSyntheticLogs(count = 1000) {
  const logs = [];
  const baseTime = Math.floor(Date.now() / 1000) - (count * 60); // Start from count minutes ago
  
  const users = ['john.doe', 'jane.smith', 'bob.jones', 'alice.williams', 'charlie.brown', 'diana.prince', 'edward.norton', 'fiona.apple'];
  const ips = ['10.1.1.25', '10.1.1.26', '10.1.1.27', '10.1.1.28', '192.168.1.100', '192.168.1.101', '172.16.0.50', '172.16.0.51'];
  const domains = [
    'google.com', 'facebook.com', 'twitter.com', 'linkedin.com', 'github.com',
    'stackoverflow.com', 'reddit.com', 'youtube.com', 'amazon.com', 'netflix.com',
    'malicious-site.com', 'suspicious-domain.net', 'phishing-attempt.com', 'malware-source.org',
    'example.com', 'test-site.com', 'demo-page.com', 'sample-url.com'
  ];
  const actions = ['ALLOW', 'BLOCK'];
  const statusCodes = [200, 301, 302, 403, 404, 500];
  const categories = ['Business', 'Technology', 'Social Media', 'Shopping', 'Entertainment', 'Malware', 'Phishing', 'Suspicious'];
  const threatClassifications = ['None', 'Malware', 'Phishing', 'Suspicious', 'Trojan', 'Spyware'];
  
  // SQL injection patterns
  const sqlPatterns = [
    '', '', '', '', '', // Most URLs are normal
    '/union%20select%20*%20from%20users',
    '/admin?id=1%27%20OR%20%271%27=%271',
    '/search?q=test%27%20UNION%20SELECT%20null--',
    '/login?user=admin%27--',
    '/api?id=1%20AND%201=1'
  ];

  for (let i = 0; i < count; i++) {
    const timestamp = baseTime + (i * 60); // 1 minute apart
    const user = users[Math.floor(Math.random() * users.length)];
    const ip = ips[Math.floor(Math.random() * ips.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];
    const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
    const bytesSent = Math.floor(Math.random() * 5000) + 100;
    const bytesReceived = Math.floor(Math.random() * 20000) + 500;
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // Higher chance of threat for malicious domains
    let threatClassification = 'None';
    if (domain.includes('malicious') || domain.includes('phishing') || domain.includes('suspicious')) {
      threatClassification = threatClassifications[Math.floor(Math.random() * (threatClassifications.length - 1)) + 1];
    } else if (Math.random() < 0.05) { // 5% chance for other domains
      threatClassification = threatClassifications[Math.floor(Math.random() * (threatClassifications.length - 1)) + 1];
    }

    // Add SQL injection pattern occasionally
    const sqlPattern = sqlPatterns[Math.floor(Math.random() * sqlPatterns.length)];
    const url = `https://${domain}${sqlPattern}`;

    const logLine = `${timestamp} ${ip} ${user} ${url} ${action} ${statusCode} ${bytesSent} ${bytesReceived} ${category} ${threatClassification}`;
    logs.push(logLine);
  }

  return logs.join('\n');
}

// Generate and save to file
function generateLogFile(outputPath, count = 1000) {
  try {
    console.log(`Generating ${count} synthetic log entries...`);
    const syntheticLogs = generateSyntheticLogs(count);
    
    // Write to file
    fs.writeFileSync(outputPath, syntheticLogs, 'utf-8');
    
    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(2);
    console.log(`✓ Successfully generated ${count} log entries`);
    console.log(`✓ File saved to: ${outputPath}`);
    console.log(`✓ File size: ${fileSize} KB`);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating log file:', error);
    process.exit(1);
  }
}

// Get output path from command line or use default
const outputPath = process.argv[2] || path.join(__dirname, '../../test-logs/synthetic-logs-1000.txt');
const count = parseInt(process.argv[3]) || 1000;

generateLogFile(outputPath, count);


/**
 * Parses Zscaler Web Security log format
 * Format: timestamp src_ip user url action status_code bytes_sent bytes_received category threat_classification
 * Example: 1731529200 10.1.1.25 john.doe https://malicious-site.com BLOCK 403 1200 5400 Malware
 */

export function parseLogLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  const parts = trimmed.split(/\s+/);
  
  if (parts.length < 9) {
    return null;
  }

  try {
    const timestamp = parseInt(parts[0], 10);
    const date = new Date(timestamp * 1000); // Convert epoch to Date

    // Ensure required fields are present and not empty
    if (!parts[1] || !parts[3] || !parts[4] || !parts[3].trim()) {
      return null;
    }

    return {
      timestamp: date,
      src_ip: parts[1],
      user: parts[2] || null,
      url: parts[3].trim(),
      action: parts[4],
      status_code: parseInt(parts[5], 10) || null,
      bytes_sent: parseInt(parts[6], 10) || 0,
      bytes_received: parseInt(parts[7], 10) || 0,
      category: parts[8] || null,
      threat_classification: parts.slice(9).join(' ') || 'None',
    };
  } catch (error) {
    console.error('Error parsing log line:', line, error);
    return null;
  }
}

export function parseLogFile(fileContent) {
  const lines = fileContent.split('\n');
  const parsedLogs = [];

  for (const line of lines) {
    const parsed = parseLogLine(line);
    if (parsed) {
      parsedLogs.push(parsed);
    }
  }

  return parsedLogs;
}




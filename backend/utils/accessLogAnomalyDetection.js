/**
 * Anomaly Detection Engine for Access Logs (Apache/Nginx)
 * Adapted rules for web server logs
 */

/**
 * Rule 1: Excessive traffic from one IP
 * >100 requests in 5 minutes
 * Confidence: 0.85
 */
function checkExcessiveTraffic(logs, currentLog, index) {
  const fiveMinutesAgo = new Date(currentLog.timestamp.getTime() - 5 * 60 * 1000);
  const sameIpLogs = logs.filter(log => 
    log.src_ip === currentLog.src_ip && 
    log.timestamp >= fiveMinutesAgo &&
    log.timestamp <= currentLog.timestamp
  );

  if (sameIpLogs.length > 100) {
    return {
      score: 0.85,
      reason: `Excessive traffic: ${sameIpLogs.length} requests from ${currentLog.src_ip} in 5 minutes`
    };
  }
  return null;
}

/**
 * Rule 2: Repeated 4xx/5xx errors
 * >20 errors in 10 min
 * Confidence: 0.70
 */
function checkRepeatedErrors(logs, currentLog, index) {
  if (currentLog.status_code < 400) {
    return null;
  }

  const tenMinutesAgo = new Date(currentLog.timestamp.getTime() - 10 * 60 * 1000);
  const errorLogs = logs.filter(log => 
    log.status_code >= 400 &&
    log.timestamp >= tenMinutesAgo &&
    log.timestamp <= currentLog.timestamp
  );

  if (errorLogs.length > 20) {
    return {
      score: 0.70,
      reason: `Repeated errors: ${errorLogs.length} 4xx/5xx errors in 10 minutes`
    };
  }
  return null;
}

/**
 * Rule 3: Unusual URL pattern
 * contains SQL injection keywords or encoded payloads
 * Confidence: 0.80
 */
function checkUnusualUrlPattern(currentLog) {
  if (!currentLog.url_path || typeof currentLog.url_path !== 'string') {
    return null;
  }

  const url = currentLog.url_path.toLowerCase();
  const sqlKeywords = ['union', 'select', 'insert', 'update', 'delete', 'drop', 'exec', 'script'];
  const encodedPatterns = ['%00', '%27', '%22', '%3c', '%3e', '0x', 'char('];
  
  const hasSqlKeyword = sqlKeywords.some(keyword => url.includes(keyword));
  const hasEncodedPattern = encodedPatterns.some(pattern => url.includes(pattern));
  const hasNullByte = url.includes('%00') || url.includes('\x00');

  if (hasSqlKeyword || hasEncodedPattern || hasNullByte) {
    return {
      score: 0.80,
      reason: 'Unusual URL pattern detected (possible SQL injection or encoded payload)'
    };
  }
  return null;
}

/**
 * Rule 4: Suspicious user agent
 * Empty, missing, or suspicious patterns
 * Confidence: 0.75
 */
function checkSuspiciousUserAgent(currentLog) {
  if (!currentLog.user_agent || currentLog.user_agent === '-') {
    return {
      score: 0.60,
      reason: 'Missing or empty user agent'
    };
  }

  const ua = currentLog.user_agent.toLowerCase();
  const suspiciousPatterns = ['sqlmap', 'nikto', 'nmap', 'masscan', 'scanner', 'bot', 'crawler'];
  const hasSuspiciousPattern = suspiciousPatterns.some(pattern => ua.includes(pattern));

  if (hasSuspiciousPattern) {
    return {
      score: 0.75,
      reason: `Suspicious user agent detected: ${currentLog.user_agent.substring(0, 50)}`
    };
  }
  return null;
}

/**
 * Rule 5: Unusual HTTP method
 * Methods other than GET, POST, HEAD, OPTIONS
 * Confidence: 0.65
 */
function checkUnusualHttpMethod(currentLog) {
  const normalMethods = ['get', 'post', 'head', 'options'];
  if (currentLog.http_method && !normalMethods.includes(currentLog.http_method.toLowerCase())) {
    return {
      score: 0.65,
      reason: `Unusual HTTP method: ${currentLog.http_method}`
    };
  }
  return null;
}

/**
 * Run all anomaly detection rules on an access log entry
 */
export function detectAccessLogAnomalies(logs, currentLog, index) {
  const rules = [
    checkUnusualUrlPattern,
    checkSuspiciousUserAgent,
    checkRepeatedErrors,
    checkExcessiveTraffic,
    checkUnusualHttpMethod,
  ];

  let maxScore = 0;
  let maxReason = '';

  for (const rule of rules) {
    const result = rule(logs, currentLog, index);
    if (result && result.score > maxScore) {
      maxScore = result.score;
      maxReason = result.reason;
    }
  }

  if (maxScore > 0) {
    return {
      anomaly_score: maxScore,
      anomaly_reason: maxReason
    };
  }

  return {
    anomaly_score: 0,
    anomaly_reason: null
  };
}


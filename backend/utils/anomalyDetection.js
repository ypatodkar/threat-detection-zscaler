/**
 * Anomaly Detection Engine
 * Implements 5 deterministic rules for threat detection
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
 * Rule 2: Blocked request spike
 * ≥10 blocked attempts to same domain
 * Confidence: 0.75
 */
function checkBlockedRequestSpike(logs, currentLog, index) {
  if (currentLog.action !== 'BLOCK' || !currentLog.url) {
    return null;
  }

  const domain = extractDomain(currentLog.url);
  if (!domain) {
    return null;
  }

  const tenMinutesAgo = new Date(currentLog.timestamp.getTime() - 10 * 60 * 1000);
  
  const blockedToDomain = logs.filter(log => 
    log.action === 'BLOCK' &&
    log.url &&
    extractDomain(log.url) === domain &&
    log.timestamp >= tenMinutesAgo &&
    log.timestamp <= currentLog.timestamp
  );

  if (blockedToDomain.length >= 10) {
    return {
      score: 0.75,
      reason: `Blocked request spike: ${blockedToDomain.length} blocked attempts to ${domain}`
    };
  }
  return null;
}

/**
 * Rule 3: Malware/phishing category
 * threat_classification != "None"
 * Confidence: 0.95
 */
function checkThreatClassification(currentLog) {
  if (currentLog.threat_classification && 
      currentLog.threat_classification.toLowerCase() !== 'none' &&
      currentLog.threat_classification.trim() !== '') {
    return {
      score: 0.95,
      reason: `Threat detected: ${currentLog.threat_classification}`
    };
  }
  return null;
}

/**
 * Rule 4: Repeated 403/404 statuses
 * >20 errors in 10 min
 * Confidence: 0.70
 */
function checkRepeatedErrors(logs, currentLog, index) {
  if (currentLog.status_code !== 403 && currentLog.status_code !== 404) {
    return null;
  }

  const tenMinutesAgo = new Date(currentLog.timestamp.getTime() - 10 * 60 * 1000);
  const errorLogs = logs.filter(log => 
    (log.status_code === 403 || log.status_code === 404) &&
    log.timestamp >= tenMinutesAgo &&
    log.timestamp <= currentLog.timestamp
  );

  if (errorLogs.length > 20) {
    return {
      score: 0.70,
      reason: `Repeated errors: ${errorLogs.length} 403/404 errors in 10 minutes`
    };
  }
  return null;
}

/**
 * Rule 5: Unusual URL pattern
 * contains encoded payload (%00, SQLi keywords)
 * Confidence: 0.80
 */
function checkUnusualUrlPattern(currentLog) {
  if (!currentLog.url || typeof currentLog.url !== 'string') {
    return null;
  }

  const url = currentLog.url.toLowerCase();
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
 * Extract domain from URL
 */
function extractDomain(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    // If URL parsing fails, try simple extraction
    const match = url.match(/https?:\/\/([^\/]+)/);
    return match ? match[1] : url;
  }
}

/**
 * Run all anomaly detection rules on a log entry
 * @param {Array} logs - All logs processed so far (for context)
 * @param {Object} currentLog - Current log entry to check
 * @param {number} index - Index of current log in the array
 * @returns {Object|null} - Anomaly result or null
 */
export function detectAnomalies(logs, currentLog, index) {
  const rules = [
    checkThreatClassification,
    checkUnusualUrlPattern,
    checkBlockedRequestSpike,
    checkExcessiveTraffic,
    checkRepeatedErrors,
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




/**
 * Parses Apache/Nginx Common Log Format (CLF)
 * Format: IP - - [timestamp] "METHOD /path HTTP/1.1" status_code bytes "-" "User-Agent" "-"
 * Example: 40.77.167.129 - - [22/Jan/2019:03:56:18 +0330] "GET /image/45437/productModel/150x150 HTTP/1.1" 200 3688 "-" "Mozilla/5.0..." "-"
 */

export function parseAccessLogLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return null;
  }

  try {
    // Regex to parse Apache/Nginx Common Log Format
    // Pattern: IP - - [timestamp] "METHOD /path HTTP/1.1" status bytes "-" "User-Agent" "-"
    // Try pattern with 3 quoted fields first
    const logPattern = /^(\S+) (\S+) (\S+) \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\S+) "([^"]*)" "([^"]*)" "([^"]*)"$/;
    let match = trimmed.match(logPattern);

    if (!match) {
      // Try simpler pattern without the last quoted field (most common)
      const simplePattern = /^(\S+) (\S+) (\S+) \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\S+) "([^"]*)" "([^"]*)"$/;
      match = trimmed.match(simplePattern);
    }

    if (!match) {
      return null;
    }

    let src_ip, remote_logname, remote_user, timestamp_str, http_method, url_path, http_version, status_code, response_size, referer, user_agent;

    if (match.length === 13) {
      // Pattern with 3 quoted fields
      [
        ,
        src_ip,
        remote_logname,
        remote_user,
        timestamp_str,
        http_method,
        url_path,
        http_version,
        status_code,
        response_size,
        referer,
        user_agent
      ] = match;
    } else {
      // Pattern with 2 quoted fields
      [
        ,
        src_ip,
        remote_logname,
        remote_user,
        timestamp_str,
        http_method,
        url_path,
        http_version,
        status_code,
        response_size,
        referer,
        user_agent
      ] = match;
    }

    // Parse timestamp: [22/Jan/2019:03:56:18 +0330]
    const date = parseApacheTimestamp(timestamp_str);
    if (!date) {
      return null;
    }

    return {
      timestamp: date,
      src_ip: src_ip,
      user: remote_user !== '-' ? remote_user : null,
      http_method: http_method || null,
      url_path: url_path || '/',
      http_version: http_version || null,
      status_code: parseInt(status_code, 10) || null,
      response_size: parseInt(response_size, 10) || 0,
      referer: referer !== '-' ? referer : null,
      user_agent: user_agent !== '-' ? user_agent : null,
    };
  } catch (error) {
    console.error('Error parsing access log line:', line, error);
    return null;
  }
}

/**
 * Parse Apache timestamp format: [22/Jan/2019:03:56:18 +0330]
 */
function parseApacheTimestamp(timestampStr) {
  try {
    // Format: 22/Jan/2019:03:56:18 +0330
    // Remove brackets if present
    const cleanTimestamp = timestampStr.replace(/[\[\]]/g, '');
    
    // Split by space to separate date/time and timezone
    const parts = cleanTimestamp.split(' ');
    if (parts.length < 2) {
      return null;
    }

    const dateTimePart = parts[0]; // 22/Jan/2019:03:56:18
    const timezonePart = parts[1]; // +0330

    // Parse date and time - split by first colon
    const colonIndex = dateTimePart.indexOf(':');
    if (colonIndex === -1) {
      return null;
    }

    const datePart = dateTimePart.substring(0, colonIndex); // 22/Jan/2019
    const timePart = dateTimePart.substring(colonIndex + 1); // 03:56:18

    // Parse date: 22/Jan/2019
    const [day, monthName, year] = datePart.split('/');
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const month = monthMap[monthName];
    if (month === undefined) {
      return null;
    }

    // Parse time: 03:56:18
    const timeParts = timePart.split(':');
    const hour = parseInt(timeParts[0], 10);
    const minute = parseInt(timeParts[1], 10);
    const second = timeParts[2] ? parseInt(timeParts[2], 10) : 0;

    // Parse timezone offset: +0330 or -0500
    let offsetHours = 0;
    let offsetMinutes = 0;
    if (timezonePart && timezonePart.length >= 5) {
      const sign = timezonePart[0] === '+' ? 1 : -1;
      offsetHours = sign * parseInt(timezonePart.substring(1, 3), 10);
      offsetMinutes = sign * parseInt(timezonePart.substring(3, 5), 10);
    }

    // Create date object in local time, then adjust for timezone
    const date = new Date(
      parseInt(year, 10),
      month,
      parseInt(day, 10),
      hour - offsetHours,
      minute - offsetMinutes,
      second
    );

    return date;
  } catch (error) {
    console.error('Error parsing timestamp:', timestampStr, error);
    return null;
  }
}

export function parseAccessLogFile(fileContent) {
  const lines = fileContent.split('\n');
  const parsedLogs = [];

  for (const line of lines) {
    const parsed = parseAccessLogLine(line);
    if (parsed) {
      parsedLogs.push(parsed);
    }
  }

  return parsedLogs;
}


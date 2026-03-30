/**
 * Structured logger for critical mutations.
 * Logs are structured JSON written to console AND optionally to error_logs table.
 * Every log includes: correlation_id, session_id, user_id, action, timestamp, metadata.
 */

import { getSessionId } from './correlation';

export type LogLevel = 'info' | 'warn' | 'error';

interface StructuredLog {
  correlation_id: string;
  session_id: string;
  action: string;
  level: LogLevel;
  user_id?: string;
  profile_id?: string;
  timestamp: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
  error?: string;
}

const LOG_BUFFER: StructuredLog[] = [];
const MAX_BUFFER = 50;

export function logMutation(
  action: string,
  correlationId: string,
  level: LogLevel = 'info',
  extra?: {
    user_id?: string;
    profile_id?: string;
    duration_ms?: number;
    metadata?: Record<string, any>;
    error?: string;
  }
) {
  const entry: StructuredLog = {
    correlation_id: correlationId,
    session_id: getSessionId(),
    action,
    level,
    timestamp: new Date().toISOString(),
    ...extra,
  };

  // Structured console output for dev tools
  const prefix = level === 'error' ? '🔴' : level === 'warn' ? '🟡' : '🟢';
  console.log(
    `${prefix} [${action}] cid=${correlationId}`,
    extra?.metadata || '',
    extra?.error ? `ERROR: ${extra.error}` : ''
  );

  // Buffer for potential batch upload
  LOG_BUFFER.push(entry);
  if (LOG_BUFFER.length > MAX_BUFFER) LOG_BUFFER.shift();

  return entry;
}

export function getRecentLogs(): StructuredLog[] {
  return [...LOG_BUFFER];
}

export function clearLogs() {
  LOG_BUFFER.length = 0;
}

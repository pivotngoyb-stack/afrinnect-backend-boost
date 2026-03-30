/**
 * Correlation ID generator for frontend-backend tracing.
 * Attaches a unique request ID to every critical mutation
 * so logs can be matched across client and edge functions.
 */

let counter = 0;

export function generateCorrelationId(action: string): string {
  counter++;
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 6);
  return `${action}-${ts}-${rand}-${counter}`;
}

export function getSessionId(): string {
  let sid = sessionStorage.getItem('__session_id');
  if (!sid) {
    sid = `sess-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
    sessionStorage.setItem('__session_id', sid);
  }
  return sid;
}

/**
 * Same-origin redirect-target validation (CWE-601 open redirect).
 *
 * A post-login "next" destination must be an internal path, never an external
 * or scheme URL. This rejects absolute URLs (`https://evil.com`),
 * protocol-relative URLs (`//evil.com`), scheme URLs (`javascript:...`, which
 * is also a DOM-XSS sink when assigned to location.href), backslash tricks, and
 * control characters — falling back to a safe default path.
 */

const EMBEDDED_SCHEME = /^\/[a-z][a-z0-9+.-]*:/i;

/** True if the string contains any C0 control char, space, or DEL. */
function hasControlOrSpace(s: string): boolean {
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    if (c <= 0x20 || c === 0x7f) return true;
  }
  return false;
}

export function safeInternalPath(next: string | undefined, fallback: string): string {
  if (!next || typeof next !== 'string') return fallback;
  // Must be a rooted path.
  if (!next.startsWith('/')) return fallback;
  // Reject protocol-relative ("//host") and backslash/encoded variants.
  if (
    next.startsWith('//') ||
    next.startsWith('/\\') ||
    next.slice(0, 4).toLowerCase() === '/%2f' ||
    next.slice(0, 4).toLowerCase() === '/%5c'
  ) {
    return fallback;
  }
  // Reject control chars / whitespace that can smuggle a second target.
  if (hasControlOrSpace(next)) return fallback;
  // Reject an embedded scheme (e.g. "/x:javascript").
  if (EMBEDDED_SCHEME.test(next)) return fallback;
  return next;
}

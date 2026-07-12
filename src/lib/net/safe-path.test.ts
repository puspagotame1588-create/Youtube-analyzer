import { describe, expect, it } from 'vitest';
import { safeInternalPath } from './safe-path';

const FB = '/en/create';

describe('safeInternalPath — open-redirect guard (CWE-601)', () => {
  it('allows normal internal paths (with query)', () => {
    expect(safeInternalPath('/en/universe', FB)).toBe('/en/universe');
    expect(safeInternalPath('/ja/plan?x=1', FB)).toBe('/ja/plan?x=1');
  });

  it('rejects absolute external URLs', () => {
    expect(safeInternalPath('https://evil.com', FB)).toBe(FB);
    expect(safeInternalPath('http://evil.com/path', FB)).toBe(FB);
  });

  it('rejects protocol-relative and backslash/encoded tricks', () => {
    expect(safeInternalPath('//evil.com', FB)).toBe(FB);
    expect(safeInternalPath('/\\evil.com', FB)).toBe(FB);
    expect(safeInternalPath('/%2fevil.com', FB)).toBe(FB);
    expect(safeInternalPath('/%5cevil.com', FB)).toBe(FB);
  });

  it('rejects scheme / javascript: DOM-XSS sinks', () => {
    expect(safeInternalPath('javascript:alert(1)', FB)).toBe(FB);
    expect(safeInternalPath('/x:javascript', FB)).toBe(FB);
    expect(safeInternalPath('data:text/html,x', FB)).toBe(FB);
  });

  it('rejects whitespace/control chars and empty/undefined', () => {
    expect(safeInternalPath('/en/ evil', FB)).toBe(FB);
    expect(safeInternalPath('/en/\tx', FB)).toBe(FB);
    expect(safeInternalPath('', FB)).toBe(FB);
    expect(safeInternalPath(undefined, FB)).toBe(FB);
  });
});

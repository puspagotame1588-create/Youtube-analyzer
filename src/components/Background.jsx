/**
 * Fixed ambient layer: Tokyo grid, radial glows, falling data streams.
 * Pure CSS — zero JS per frame, cheap on mobile.
 */
const STREAMS = [
  { left: '8%', duration: '11s', delay: '0s' },
  { left: '22%', duration: '14s', delay: '3s' },
  { left: '37%', duration: '10s', delay: '6s' },
  { left: '58%', duration: '13s', delay: '1.5s' },
  { left: '74%', duration: '12s', delay: '4.5s' },
  { left: '91%', duration: '15s', delay: '2s' },
]

export default function Background() {
  return (
    <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden">
      {/* base vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(47,92,196,0.16),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_85%_20%,rgba(79,216,208,0.06),transparent_65%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_10%_75%,rgba(224,96,61,0.05),transparent_65%)]" />
      {/* Tokyo grid */}
      <div className="absolute inset-0 bg-tokyo-grid" />
      {/* data streams */}
      {STREAMS.map((s, i) => (
        <span
          key={i}
          className="data-stream"
          style={{ left: s.left, animationDuration: s.duration, animationDelay: s.delay }}
        />
      ))}
    </div>
  )
}

'use client';

/**
 * Tier C / no-WebGL / reduced-motion alternative for the Parallel Futures
 * Universe: an accessible SVG route diagram with depth styling. Identical
 * information and interactions to the 3D scene.
 */

import { useLocale } from 'next-intl';
import type { SimRoute } from '@/lib/simulation/types';

const COLORS: Record<string, string> = {
  university: '#00B8D9',
  vocational: '#8B5CF6',
  employment: '#10B981',
};

export function Universe2D({
  routes,
  selectedRouteId,
  selectedMilestoneId,
  onSelectMilestone,
  onSelectRoute,
  routeNames,
}: {
  routes: SimRoute[];
  selectedRouteId: string | null;
  selectedMilestoneId: string | null;
  onSelectMilestone: (routeId: string, milestoneId: string) => void;
  onSelectRoute: (routeId: string) => void;
  routeNames: Record<string, string>;
}): React.JSX.Element {
  const locale = useLocale();
  const ja = locale === 'ja';
  const width = 900;
  const rowH = 130;
  const height = routes.length * rowH + 40;
  const maxMonths = Math.max(...routes.flatMap((r) => r.milestones.map((m) => m.monthOffset)), 1);

  return (
    <div className="cv-depth-card overflow-x-auto rounded-panel bg-white/80 p-4">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[640px]"
        role="group"
        aria-label={ja ? '並行する未来のルート図' : 'Parallel futures route diagram'}
      >
        {/* Now beacon */}
        <circle cx={30} cy={height / 2} r={12} fill="#00B8D9" opacity={0.9} />
        <circle cx={30} cy={height / 2} r={18} fill="none" stroke="#00B8D9" strokeOpacity={0.35} strokeWidth={3} />
        <text x={30} y={height / 2 + 34} textAnchor="middle" fontSize={11} fill="#5A6384">
          {ja ? '現在' : 'Now'}
        </text>

        {routes.map((route, ri) => {
          const y = 60 + ri * rowH;
          const color = COLORS[route.kind] ?? '#00B8D9';
          const selected = selectedRouteId === route.id;
          const x = (m: number): number => 90 + (m / maxMonths) * (width - 150);
          return (
            <g key={route.id} opacity={selectedRouteId && !selected ? 0.45 : 1}>
              <path
                d={`M 30 ${height / 2} C 60 ${height / 2}, 60 ${y}, 90 ${y} L ${width - 40} ${y}`}
                fill="none"
                stroke={color}
                strokeWidth={selected ? 5 : 3}
                strokeOpacity={0.55}
                strokeLinecap="round"
              />
              <foreignObject x={90} y={y - 46} width={320} height={32}>
                <button
                  onClick={() => onSelectRoute(route.id)}
                  style={{
                    background: selected ? color : 'rgba(255,255,255,0.9)',
                    color: selected ? '#fff' : '#1B2340',
                    border: `1px solid ${color}66`,
                    borderRadius: 999,
                    padding: '4px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {routeNames[route.id] ?? (ja ? route.nameJa : route.nameEn)} · {route.scores.expected}
                </button>
              </foreignObject>
              {route.milestones.map((m) => {
                const sel = selectedMilestoneId === m.id;
                return (
                  <g key={m.id}>
                    <circle
                      cx={x(m.monthOffset)}
                      cy={y}
                      r={sel ? 11 : 7}
                      fill={m.riskFlag ? '#F0564A' : color}
                      stroke="#fff"
                      strokeWidth={2}
                      style={{ cursor: 'pointer' }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${ja ? m.titleJa : m.titleEn} (${ja ? `${m.monthOffset}か月後` : `month ${m.monthOffset}`})`}
                      onClick={() => onSelectMilestone(route.id, m.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectMilestone(route.id, m.id);
                        }
                      }}
                    />
                    {sel && (
                      <circle cx={x(m.monthOffset)} cy={y} r={16} fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.6} />
                    )}
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-xs text-ink-soft">
        {ja
          ? '丸をタップするとマイルストーンの詳細が開きます。赤い丸はリスクのあるステップです。'
          : 'Tap a circle to open milestone details. Red circles mark risk steps.'}
      </p>
    </div>
  );
}

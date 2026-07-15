"use client";

/**
 * Polished 2D animated fallback for the Future Route Universe.
 * Used when WebGL is unavailable, on very low-end devices, or when the
 * user prefers reduced motion (in which case the flow animation is
 * disabled via the prefers-reduced-motion CSS rule on .route-flow).
 * Tells the same story: student → institutions → careers, both-way data flow.
 */
import { useMemo } from "react";
import { buildHeroPaths, type HeroControls, type HeroPath } from "@/components/3d/sceneGraph";

export default function Fallback2D({
  controls,
  selectedId,
  onSelect,
}: {
  controls: HeroControls;
  selectedId: string | null;
  onSelect: (path: HeroPath | null) => void;
}) {
  const paths = useMemo(() => buildHeroPaths(controls), [controls]);

  // Map 3D layout into a 2D viewBox (0..100 x 0..60)
  const project = (p: [number, number, number]): [number, number] => [
    ((p[0] + 4.5) / 10.5) * 100,
    30 - p[1] * 8.5,
  ];

  return (
    <svg
      viewBox="0 0 100 60"
      className="h-full w-full"
      role="img"
      aria-label="Diagram: an international student node connects to university and vocational school programs, which lead to career destinations. Brighter connections indicate a higher route-fit score."
    >
      <defs>
        <radialGradient id="fb-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0" />
        </radialGradient>
      </defs>

      {paths.map((path) => {
        const [sx, sy] = project(path.studentPos);
        const [ix, iy] = project(path.institutionPos);
        const [cx2, cy2] = project(path.careerPos);
        const active = selectedId === path.program.id;
        const dim = selectedId !== null && !active;
        const opacity = dim ? 0.12 : 0.35 + (path.match.score / 100) * 0.65;
        const midY = (sy + iy) / 2 - 6;
        return (
          <g key={path.program.id} opacity={opacity}>
            <path
              d={`M ${sx} ${sy} Q ${(sx + ix) / 2} ${midY} ${ix} ${iy}`}
              fill="none"
              stroke={path.color}
              strokeWidth={active ? 1 : 0.5 + path.match.score / 180}
              className="route-flow"
            />
            <path
              d={`M ${ix} ${iy} L ${cx2} ${cy2}`}
              fill="none"
              stroke={path.color}
              strokeWidth={0.4}
              strokeDasharray="1.5 1.5"
            />
            <circle
              cx={ix}
              cy={iy}
              r={path.isUniversity ? 1.7 : 1.4}
              fill={path.color}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              aria-label={`${path.institutionShortLabel}, route fit ${path.match.score}`}
              onClick={() => onSelect(active ? null : path)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(active ? null : path);
                }
              }}
            />
            {path.match.missingRequirements.length > 0 && !dim && (
              <circle cx={(sx + ix) / 2} cy={midY + 3} r={0.7} fill="#f59e0b" />
            )}
            <circle cx={cx2} cy={cy2} r={0.9} fill="#c4b5fd" />
            <text x={ix} y={iy - 2.6} textAnchor="middle" fontSize="2.1" fill="#dbeafe" fontWeight={600}>
              {path.institutionShortLabel}
            </text>
            <text x={ix} y={iy + 4.2} textAnchor="middle" fontSize="1.8" fill="#93c5fd">
              fit {path.match.score}
            </text>
            <text x={cx2} y={cy2 - 1.8} textAnchor="middle" fontSize="1.7" fill="#c4b5fd">
              {path.careerLabel}
            </text>
          </g>
        );
      })}

      {/* Student node */}
      <circle cx={project([-3.8, 0, 0])[0]} cy={project([-3.8, 0, 0])[1]} r={5} fill="url(#fb-glow)" />
      <circle cx={project([-3.8, 0, 0])[0]} cy={project([-3.8, 0, 0])[1]} r={2.2} fill="#7dd3fc" />
      <text
        x={project([-3.8, 0, 0])[0]}
        y={project([-3.8, 0, 0])[1] + 5.5}
        textAnchor="middle"
        fontSize="2.2"
        fill="#cffafe"
        fontWeight={700}
      >
        You
      </text>
    </svg>
  );
}

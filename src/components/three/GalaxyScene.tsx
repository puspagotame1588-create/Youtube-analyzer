'use client';

/**
 * School Galaxy — schools as a spatial constellation.
 * Position encodes cost (x) and employment outcome (y); shape encodes
 * institution type (box = vocational, icosahedron = university); a ring marks
 * scholarship availability. Color is never the only signal — the list view
 * carries identical information.
 */

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { School } from '@/lib/data/types';
import { useQuality } from '@/lib/store/quality';

function SchoolStar({
  school,
  position,
  selected,
  onSelect,
  label,
  labelBelow,
}: {
  school: School;
  position: THREE.Vector3;
  selected: boolean;
  onSelect: (id: string) => void;
  label: string;
  labelBelow: boolean;
}): React.JSX.Element {
  const isUni = school.institutionType === 'university';
  const color = isUni ? '#00B8D9' : '#8B5CF6';
  const size = 0.28 + (school.employmentOutcome?.value ?? 0.6) * 0.35;
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = position.y + Math.sin(clock.getElapsedTime() * 0.5 + position.x) * 0.06;
  });

  return (
    <group ref={ref} position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect(school.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        {isUni ? (
          <icosahedronGeometry args={[size, 1]} />
        ) : (
          <boxGeometry args={[size * 1.4, size * 1.4, size * 1.4]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 1.3 : 0.55}
          roughness={0.25}
        />
      </mesh>
      {school.scholarshipIds.length > 0 && (
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <torusGeometry args={[size + 0.18, 0.02, 8, 40]} />
          <meshBasicMaterial color="#F59E0B" transparent opacity={0.85} />
        </mesh>
      )}
      <Html
        zIndexRange={[5, 0]}
        center
        distanceFactor={11}
        position={[0, labelBelow ? -(size + 0.55) : size + 0.55, 0]}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: selected ? color : 'rgba(255,255,255,0.88)',
            color: selected ? '#fff' : '#1B2340',
            borderRadius: 999,
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            border: `1px solid ${color}55`,
          }}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

function GalaxyCamera(): null {
  const { camera, pointer } = useThree();
  useFrame(() => {
    camera.position.x += (pointer.x * 1.5 - camera.position.x) * 0.04;
    camera.position.y += (2.8 + pointer.y * 0.8 - camera.position.y) * 0.04;
    camera.lookAt(0, 2.4, -4);
  });
  return null;
}

export function GalaxyScene({
  schools,
  selectedId,
  onSelect,
  locale,
}: {
  schools: School[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  locale: string;
}): React.JSX.Element {
  const { reducedMotion } = useQuality();

  const positions = useMemo(() => {
    const costs = schools.map((s) => s.firstYearCostJpy + s.annualTuitionJpy * (s.programYears - 1));
    const outcomes = schools.map((s) => s.employmentOutcome?.value ?? 0.6);
    const minC = Math.min(...costs);
    const maxC = Math.max(...costs);
    const minO = Math.min(...outcomes);
    const maxO = Math.max(...outcomes);
    return schools.map((s, i) => {
      const total = costs[i] ?? minC;
      const nx = maxC === minC ? 0.5 : (total - minC) / (maxC - minC);
      // Relative normalization keeps the constellation spread even when the
      // dataset's outcome values sit in a narrow band.
      const o = outcomes[i] ?? minO;
      const ny = maxO === minO ? 0.5 : (o - minO) / (maxO - minO);
      return new THREE.Vector3(
        (nx - 0.5) * 12,
        0.8 + ny * 3.8,
        -2 - (i % 4) * 2.4,
      );
    });
  }, [schools]);

  return (
    <group>
      <color attach="background" args={['#f4f6fc']} />
      <fog attach="fog" args={['#f4f6fc', 12, 26]} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 8, 5]} intensity={1} />
      <pointLight position={[0, 5, -2]} intensity={18} color="#8B5CF6" />

      {schools.map((s, i) => {
        const pos = positions[i];
        if (!pos) return null;
        return (
          <SchoolStar
            key={s.id}
            school={s}
            position={pos}
            selected={selectedId === s.id}
            onSelect={onSelect}
            label={locale === 'ja' ? s.nameJa.replace('（デモ）', '') : s.nameEn.replace(' (Demo)', '')}
            labelBelow={i % 2 === 1}
          />
        );
      })}

      {/* Axis hints */}
      <Html zIndexRange={[5, 0]} position={[-6.2, -0.4, -3]} style={{ pointerEvents: 'none' }}>
        <div style={{ fontSize: 11, color: '#5A6384', whiteSpace: 'nowrap' }}>
          ← {locale === 'ja' ? '学費が低い' : 'Lower cost'}
        </div>
      </Html>
      <Html zIndexRange={[5, 0]} position={[5, -0.4, -3]} style={{ pointerEvents: 'none' }}>
        <div style={{ fontSize: 11, color: '#5A6384', whiteSpace: 'nowrap' }}>
          {locale === 'ja' ? '学費が高い' : 'Higher cost'} →
        </div>
      </Html>
      <Html zIndexRange={[5, 0]} position={[-7.4, 5.4, -3]} style={{ pointerEvents: 'none' }}>
        <div style={{ fontSize: 11, color: '#5A6384', whiteSpace: 'nowrap' }}>
          ↑ {locale === 'ja' ? '就職実績が高い' : 'Stronger outcomes'}
        </div>
      </Html>

      {!reducedMotion && <GalaxyCamera />}
    </group>
  );
}

"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { IAnatomyPart as AnatomyPart, IAnatomyScene as AnatomyScene } from "@/types";

// ── Part mesh ──────────────────────────────────────────────────────────────
function AnatomyMesh({
  part,
  selected,
  onSelect,
}: {
  part: AnatomyPart;
  selected: boolean;
  onSelect: (p: AnatomyPart | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const t = useRef(Math.random() * Math.PI * 2);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    t.current += delta;

    if (part.pulse) {
      const scale = 1 + Math.sin(t.current * 2) * 0.05;
      meshRef.current.scale.setScalar(scale);
    }
    if (selected) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const geometry = useMemo(() => {
    const s = part.size;
    switch (part.geometry) {
      case "sphere":
        return new THREE.SphereGeometry(s[0], (s[2] as number) ?? 16, (s[3] as number) ?? 16);
      case "cylinder":
        return new THREE.CylinderGeometry(s[0], s[1], s[2], (s[3] as number) ?? 12);
      case "box":
        return new THREE.BoxGeometry(s[0], s[1], s[2]);
      case "torus":
        return new THREE.TorusGeometry(s[0], s[1], (s[2] as number) ?? 16, (s[3] as number) ?? 8);
      case "cone":
        return new THREE.ConeGeometry(s[0], s[1], (s[2] as number) ?? 8);
      case "capsule":
        return new THREE.CapsuleGeometry(s[0], s[2], 8, 16);
      default:
        return new THREE.SphereGeometry(0.5, 16, 16);
    }
  }, [part.geometry, part.size]);

  const color = hovered || selected ? "#ffffff" : part.color;
  const emissive = selected ? part.emissiveColor || part.color : hovered ? part.color : "#000000";
  const emissiveIntensity = selected ? 0.6 : hovered ? 0.3 : 0;
  const opacity = hovered || selected ? 1.0 : 0.88;

  return (
    <group position={part.position} rotation={part.rotation}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(selected ? null : part);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={opacity}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Label */}
      <Html
        position={[0, (part.size[1] ?? part.size[0]) * 0.7 + 0.2, 0]}
        center
        distanceFactor={12}
        occlude={false}
      >
        <div
          className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap pointer-events-none select-none transition-all ${
            selected
              ? "bg-white text-black shadow-lg scale-110"
              : hovered
              ? "bg-white/90 text-black shadow"
              : "bg-black/60 text-white"
          }`}
          style={{ fontSize: "10px", lineHeight: "1.4" }}
        >
          {part.label}
        </div>
      </Html>
    </group>
  );
}

// ── Scene wrapper with auto-rotation ──────────────────────────────────────
function SceneGroup({
  scene,
  selectedPart,
  onSelect,
  autoRotate,
}: {
  scene: AnatomyScene;
  selectedPart: AnatomyPart | null;
  onSelect: (p: AnatomyPart | null) => void;
  autoRotate: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (autoRotate) {
      groupRef.current.rotation.y += delta * 0.25;
    }
  });

  return (
    <group ref={groupRef}>
      {scene.parts.map((part) => (
        <AnatomyMesh
          key={part.id}
          part={part}
          selected={selectedPart?.id === part.id}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}

// ── Main exported component ─────────────────────────────────────────────────
export default function AnatomyViewer({ scene }: { scene: AnatomyScene }) {
  const [selectedPart, setSelectedPart] = useState<AnatomyPart | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);

  return (
    <div className="w-full h-full relative">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: scene.cameraPosition, fov: 50 }}
        shadows
        style={{ background: scene.bgColor }}
        onPointerMissed={() => setSelectedPart(null)}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.6} color="#aaccff" />
        <pointLight position={[5, -5, 5]} intensity={0.4} color="#ffaaaa" />

        <SceneGroup
          scene={scene}
          selectedPart={selectedPart}
          onSelect={setSelectedPart}
          autoRotate={autoRotate}
        />

        <OrbitControls
          enablePan={false}
          minDistance={5}
          maxDistance={20}
          autoRotate={false}
        />
      </Canvas>

      {/* Controls overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <button
          onClick={() => setAutoRotate((v) => !v)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-lg ${
            autoRotate
              ? "bg-primary text-primary-foreground"
              : "bg-black/60 text-white hover:bg-black/80"
          }`}
        >
          {autoRotate ? "⏸ Pause" : "▶ Auto Rotate"}
        </button>
      </div>

      {/* Tip */}
      {!selectedPart && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none">
          Click any structure to learn more • Drag to rotate • Scroll to zoom
        </div>
      )}

      {/* Info panel */}
      {selectedPart && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/85 backdrop-blur border-t border-white/10 p-4 animate-in slide-in-from-bottom">
          <div className="flex items-start justify-between gap-3 max-w-2xl mx-auto">
            <div>
              <h3 className="text-white font-bold text-sm mb-1">{selectedPart.label}</h3>
              <p className="text-gray-300 text-xs leading-relaxed">{selectedPart.info}</p>
            </div>
            <button
              onClick={() => setSelectedPart(null)}
              className="text-gray-400 hover:text-white text-xl leading-none shrink-0 mt-0.5"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

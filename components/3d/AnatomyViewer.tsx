"use client";

import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { IAnatomyPart as AnatomyPart, IAnatomyScene as AnatomyScene } from "@/types";

export type ViewPhase = "overview" | "transitioning" | "detail";

// ── Body region map ─────────────────────────────────────────────────────────
const BODY_REGION_MAP: Record<string, {
  highlightCenter: [number, number, number];
  highlightSize: [number, number, number];
  markerPositions: Array<{ pos: [number, number, number]; label: string }>;
  overviewLookAt: [number, number, number];
  regionLabel: string;
}> = {
  "upper-limb": {
    highlightCenter: [-1.3, 2.6, 0],
    highlightSize: [1.4, 3.2, 1.0],
    markerPositions: [
      { pos: [-1.0, 3.8, 0.3], label: "Shoulder" },
      { pos: [-1.15, 3.0, 0.3], label: "Upper Arm" },
      { pos: [-1.3, 2.1, 0.3], label: "Elbow" },
      { pos: [-1.35, 1.5, 0.3], label: "Forearm" },
      { pos: [-1.4, 1.0, 0.3], label: "Hand/Wrist" },
    ],
    overviewLookAt: [-0.5, 2.5, 0],
    regionLabel: "Upper Limb",
  },
  "lower-limb": {
    highlightCenter: [0, -1.2, 0],
    highlightSize: [1.8, 4.5, 1.0],
    markerPositions: [
      { pos: [0.45, 1.2, 0.3], label: "Hip / Femoral" },
      { pos: [0.45, 0.3, 0.3], label: "Thigh" },
      { pos: [0.45, -0.8, 0.3], label: "Knee" },
      { pos: [0.45, -1.7, 0.3], label: "Leg" },
      { pos: [0.45, -2.5, 0.4], label: "Foot" },
    ],
    overviewLookAt: [0, -1.0, 0],
    regionLabel: "Lower Limb",
  },
  "thorax": {
    highlightCenter: [0, 3.1, 0],
    highlightSize: [2.2, 2.6, 1.0],
    markerPositions: [
      { pos: [0, 4.2, 0.4], label: "Trachea" },
      { pos: [0.6, 3.2, 0.4], label: "Right Lung" },
      { pos: [-0.6, 3.2, 0.4], label: "Left Lung" },
      { pos: [0, 3.0, 0.3], label: "Heart" },
      { pos: [0, 2.2, 0.3], label: "Diaphragm" },
    ],
    overviewLookAt: [0, 3.1, 0],
    regionLabel: "Thorax",
  },
  "abdomen": {
    highlightCenter: [0, 2.2, 0],
    highlightSize: [2.0, 2.2, 1.0],
    markerPositions: [
      { pos: [0.6, 2.8, 0.4], label: "Liver" },
      { pos: [-0.4, 2.5, 0.4], label: "Stomach" },
      { pos: [0, 2.0, 0.4], label: "Bowel" },
      { pos: [0.7, 1.8, 0.3], label: "Right Kidney" },
      { pos: [0, 1.4, 0.3], label: "Aorta" },
    ],
    overviewLookAt: [0, 2.2, 0],
    regionLabel: "Abdomen",
  },
  "head-neck": {
    highlightCenter: [0, 4.8, 0],
    highlightSize: [2.0, 3.0, 1.2],
    markerPositions: [
      { pos: [0, 5.6, 0.4], label: "Skull" },
      { pos: [0.8, 5.3, 0.6], label: "Pterion" },
      { pos: [0, 4.8, 0.5], label: "Brain" },
      { pos: [0, 4.1, 0.5], label: "Neck" },
      { pos: [0, 3.7, 0.6], label: "Thyroid" },
    ],
    overviewLookAt: [0, 4.8, 0],
    regionLabel: "Head & Neck",
  },
  "neuroanatomy": {
    highlightCenter: [0, 5.0, 0],
    highlightSize: [1.8, 2.2, 1.4],
    markerPositions: [
      { pos: [0, 5.6, 0.3], label: "Frontal Lobe" },
      { pos: [0.8, 5.1, 0.4], label: "Temporal Lobe" },
      { pos: [0, 5.2, -0.4], label: "Parietal Lobe" },
      { pos: [0, 4.5, 0.4], label: "Brainstem" },
      { pos: [0, 4.2, -0.5], label: "Cerebellum" },
    ],
    overviewLookAt: [0, 5.0, 0],
    regionLabel: "Brain",
  },
  "pelvis-perineum": {
    highlightCenter: [0, 1.3, 0],
    highlightSize: [2.0, 1.6, 1.0],
    markerPositions: [
      { pos: [0, 1.8, 0.4], label: "Bladder" },
      { pos: [0, 1.5, 0.4], label: "Uterus / Prostate" },
      { pos: [0, 1.0, 0.2], label: "Pelvic Floor" },
      { pos: [0.7, 1.4, 0.3], label: "Hip Bone" },
      { pos: [0, 0.8, -0.3], label: "Rectum" },
    ],
    overviewLookAt: [0, 1.3, 0],
    regionLabel: "Pelvis",
  },
  "back-vertebral": {
    highlightCenter: [0, 2.0, -0.2],
    highlightSize: [1.0, 8.5, 0.7],
    markerPositions: [
      { pos: [0, 4.5, -0.4], label: "Cervical" },
      { pos: [0, 3.0, -0.4], label: "Thoracic" },
      { pos: [0, 1.5, -0.4], label: "Lumbar" },
      { pos: [0, 0.2, -0.3], label: "Sacrum" },
      { pos: [0, 2.5, -0.4], label: "Spinal Cord" },
    ],
    overviewLookAt: [0, 2.0, 0],
    regionLabel: "Spine",
  },
  "general-anatomy": {
    highlightCenter: [0, 1.5, 0],
    highlightSize: [4.0, 13.0, 1.8],
    markerPositions: [
      { pos: [0, 5.3, 0.5], label: "Head" },
      { pos: [0, 3.0, 0.5], label: "Thorax" },
      { pos: [0, 1.5, 0.5], label: "Abdomen" },
      { pos: [0, -1.0, 0.5], label: "Lower Limb" },
    ],
    overviewLookAt: [0, 1.5, 0],
    regionLabel: "Whole Body",
  },
  "embryology": {
    highlightCenter: [0, 2.0, 0],
    highlightSize: [2.5, 5.0, 1.5],
    markerPositions: [
      { pos: [0, 3.5, 0.5], label: "Germ Layers" },
      { pos: [0, 2.5, 0.5], label: "Organogenesis" },
      { pos: [0, 1.5, 0.5], label: "Heart" },
      { pos: [0, 0.8, 0.5], label: "Neural Tube" },
    ],
    overviewLookAt: [0, 2.0, 0],
    regionLabel: "Development",
  },
  "histology": {
    highlightCenter: [0, 1.5, 0],
    highlightSize: [4.0, 13.0, 1.8],
    markerPositions: [
      { pos: [0, 5.0, 0.5], label: "Epithelium" },
      { pos: [0, 3.0, 0.5], label: "Connective Tissue" },
      { pos: [0, 1.5, 0.5], label: "Muscle" },
      { pos: [0, -0.5, 0.5], label: "Nervous Tissue" },
    ],
    overviewLookAt: [0, 1.5, 0],
    regionLabel: "Cellular Level",
  },
};

function getRegion(chapterKey: string) {
  return (
    BODY_REGION_MAP[chapterKey] ??
    BODY_REGION_MAP["general-anatomy"]
  );
}

// ── Human Body Silhouette ───────────────────────────────────────────────────
function BodySilhouette({ opacity }: { opacity: number }) {
  const mat = (color = "#64748b") => ({
    color,
    transparent: true,
    opacity: opacity * 0.28,
    roughness: 0.9,
    metalness: 0.0,
  });

  return (
    <group>
      {/* Head */}
      <mesh position={[0, 5.3, 0]}>
        <sphereGeometry args={[0.78, 16, 16]} />
        <meshStandardMaterial {...mat()} />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 4.55, 0]}>
        <cylinderGeometry args={[0.24, 0.28, 0.65, 10]} />
        <meshStandardMaterial {...mat()} />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 3.1, 0]}>
        <capsuleGeometry args={[0.85, 2.2, 4, 12]} />
        <meshStandardMaterial {...mat()} />
      </mesh>
      {/* Pelvis */}
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[2.0, 0.9, 0.75]} />
        <meshStandardMaterial {...mat()} />
      </mesh>

      {/* Left upper arm */}
      <mesh position={[-1.3, 3.4, 0]} rotation={[0, 0, 0.2]}>
        <capsuleGeometry args={[0.22, 1.1, 4, 10]} />
        <meshStandardMaterial {...mat()} />
      </mesh>
      {/* Left forearm */}
      <mesh position={[-1.5, 2.1, 0]} rotation={[0, 0, 0.15]}>
        <capsuleGeometry args={[0.17, 1.0, 4, 10]} />
        <meshStandardMaterial {...mat()} />
      </mesh>
      {/* Left hand */}
      <mesh position={[-1.6, 1.3, 0]}>
        <boxGeometry args={[0.3, 0.38, 0.14]} />
        <meshStandardMaterial {...mat()} />
      </mesh>

      {/* Right upper arm */}
      <mesh position={[1.3, 3.4, 0]} rotation={[0, 0, -0.2]}>
        <capsuleGeometry args={[0.22, 1.1, 4, 10]} />
        <meshStandardMaterial {...mat()} />
      </mesh>
      {/* Right forearm */}
      <mesh position={[1.5, 2.1, 0]} rotation={[0, 0, -0.15]}>
        <capsuleGeometry args={[0.17, 1.0, 4, 10]} />
        <meshStandardMaterial {...mat()} />
      </mesh>
      {/* Right hand */}
      <mesh position={[1.6, 1.3, 0]}>
        <boxGeometry args={[0.3, 0.38, 0.14]} />
        <meshStandardMaterial {...mat()} />
      </mesh>

      {/* Left upper leg */}
      <mesh position={[-0.5, 0.55, 0]}>
        <capsuleGeometry args={[0.3, 1.5, 4, 10]} />
        <meshStandardMaterial {...mat()} />
      </mesh>
      {/* Left lower leg */}
      <mesh position={[-0.5, -1.35, 0]}>
        <capsuleGeometry args={[0.22, 1.4, 4, 10]} />
        <meshStandardMaterial {...mat()} />
      </mesh>
      {/* Left foot */}
      <mesh position={[-0.5, -2.35, 0.22]}>
        <boxGeometry args={[0.32, 0.22, 0.7]} />
        <meshStandardMaterial {...mat()} />
      </mesh>

      {/* Right upper leg */}
      <mesh position={[0.5, 0.55, 0]}>
        <capsuleGeometry args={[0.3, 1.5, 4, 10]} />
        <meshStandardMaterial {...mat()} />
      </mesh>
      {/* Right lower leg */}
      <mesh position={[0.5, -1.35, 0]}>
        <capsuleGeometry args={[0.22, 1.4, 4, 10]} />
        <meshStandardMaterial {...mat()} />
      </mesh>
      {/* Right foot */}
      <mesh position={[0.5, -2.35, 0.22]}>
        <boxGeometry args={[0.32, 0.22, 0.7]} />
        <meshStandardMaterial {...mat()} />
      </mesh>
    </group>
  );
}

// ── Animated region highlight ───────────────────────────────────────────────
function RegionHighlight({
  center,
  size,
  opacity,
}: {
  center: [number, number, number];
  size: [number, number, number];
  opacity: number;
}) {
  const fillRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!fillRef.current) return;
    const mat = fillRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.25 + Math.sin(clock.elapsedTime * 2.2) * 0.15;
    mat.opacity = opacity * (0.1 + Math.sin(clock.elapsedTime * 2.2) * 0.04);
  });

  return (
    <group position={center}>
      <mesh ref={fillRef}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#4f46e5"
          emissiveIntensity={0.3}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[size[0] + 0.04, size[1] + 0.04, size[2] + 0.04]} />
        <meshStandardMaterial
          color="#a5b4fc"
          wireframe
          transparent
          opacity={opacity * 0.55}
        />
      </mesh>
    </group>
  );
}

// ── Pulsing marker dot ──────────────────────────────────────────────────────
function PulsingMarker({
  position,
  label,
  index,
  onClick,
}: {
  position: [number, number, number];
  label: string;
  index: number;
  onClick: () => void;
}) {
  const dotRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const t = useRef(index * 0.65);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    t.current += delta;
    if (dotRef.current) {
      dotRef.current.scale.setScalar(1 + Math.sin(t.current * 3) * 0.28);
    }
    if (ringRef.current) {
      const progress = (t.current * 0.55) % 1;
      ringRef.current.scale.setScalar(1 + progress * 2.2);
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = Math.max(0, 0.7 - progress * 0.7);
    }
  });

  return (
    <group position={position}>
      {/* Expanding ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.1, 0.018, 8, 24]} />
        <meshStandardMaterial color="#818cf8" transparent opacity={0.6} />
      </mesh>
      {/* Core dot */}
      <mesh
        ref={dotRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial
          color={hovered ? "#ffffff" : "#818cf8"}
          emissive={hovered ? "#6366f1" : "#4338ca"}
          emissiveIntensity={hovered ? 1.2 : 0.8}
        />
      </mesh>
      {hovered && (
        <Html center distanceFactor={10} style={{ pointerEvents: "none" }}>
          <div
            style={{ fontSize: "10px", lineHeight: 1.4 }}
            className="bg-black/80 text-white px-2 py-1 rounded-md whitespace-nowrap font-medium shadow-lg"
          >
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Camera controller ───────────────────────────────────────────────────────
function CameraController({
  phase,
  phaseRef,
  overviewCam,
  detailCam,
  overviewLookAt,
  controlsRef,
  onTransitionDone,
}: {
  phase: ViewPhase;
  phaseRef: React.MutableRefObject<ViewPhase>;
  overviewCam: THREE.Vector3;
  detailCam: THREE.Vector3;
  overviewLookAt: THREE.Vector3;
  controlsRef: React.RefObject<any>;
  onTransitionDone: () => void;
}) {
  const { camera } = useThree();
  const arrived = useRef(false);

  // Sync phase ref
  phaseRef.current = phase;

  useFrame((_, delta) => {
    const currentPhase = phaseRef.current;

    if (currentPhase === "overview") {
      camera.position.lerp(overviewCam, delta * 2.5);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(overviewLookAt, delta * 2.5);
        controlsRef.current.update();
      }
      arrived.current = false;
      return;
    }

    if (currentPhase === "transitioning") {
      camera.position.lerp(detailCam, delta * 1.8);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), delta * 1.8);
        controlsRef.current.update();
      }

      if (!arrived.current && camera.position.distanceTo(detailCam) < 0.3) {
        arrived.current = true;
        camera.position.copy(detailCam);
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          controlsRef.current.update();
        }
        onTransitionDone();
      }
    }
  });

  return null;
}

// ── Anatomy mesh (detail mode) ──────────────────────────────────────────────
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
    if (part.pulse) meshRef.current.scale.setScalar(1 + Math.sin(t.current * 2) * 0.05);
    if (selected) meshRef.current.rotation.y += delta * 0.5;
  });

  const geometry = useMemo(() => {
    const s = part.size;
    switch (part.geometry) {
      case "sphere":   return new THREE.SphereGeometry(s[0], s[2] ?? 16, s[3] ?? 16);
      case "cylinder": return new THREE.CylinderGeometry(s[0], s[1], s[2], s[3] ?? 12);
      case "box":      return new THREE.BoxGeometry(s[0], s[1], s[2]);
      case "torus":    return new THREE.TorusGeometry(s[0], s[1], s[2] ?? 16, s[3] ?? 8);
      case "cone":     return new THREE.ConeGeometry(s[0], s[1], s[2] ?? 8);
      case "capsule":  return new THREE.CapsuleGeometry(s[0], s[2], 8, 16);
      default:         return new THREE.SphereGeometry(0.5, 16, 16);
    }
  }, [part.geometry, part.size]);

  return (
    <group position={part.position} rotation={part.rotation}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={(e) => { e.stopPropagation(); onSelect(selected ? null : part); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "auto"; }}
        castShadow
      >
        <meshStandardMaterial
          color={hovered || selected ? "#ffffff" : part.color}
          emissive={selected ? part.emissiveColor ?? part.color : hovered ? part.color : "#000000"}
          emissiveIntensity={selected ? 0.6 : hovered ? 0.3 : 0}
          transparent
          opacity={hovered || selected ? 1.0 : 0.88}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      <Html
        position={[0, (part.size[1] ?? part.size[0]) * 0.7 + 0.2, 0]}
        center
        distanceFactor={12}
        occlude={false}
      >
        <div
          className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap pointer-events-none select-none transition-all ${
            selected ? "bg-white text-black shadow-lg scale-110"
            : hovered ? "bg-white/90 text-black shadow"
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

// ── Scene group (detail mode) ───────────────────────────────────────────────
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
    if (autoRotate) groupRef.current.rotation.y += delta * 0.25;
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
export default function AnatomyViewer({
  scene,
  onPhaseChange,
}: {
  scene: AnatomyScene;
  onPhaseChange?: (phase: ViewPhase) => void;
}) {
  const [phase, setPhase] = useState<ViewPhase>("overview");
  const phaseRef = useRef<ViewPhase>("overview");
  const [selectedPart, setSelectedPart] = useState<AnatomyPart | null>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const controlsRef = useRef<any>(null);

  const region = getRegion(scene.chapterKey);

  const overviewCam = useMemo(() => new THREE.Vector3(0, 1.5, 14), []);
  const detailCam = useMemo(() => new THREE.Vector3(...scene.cameraPosition), [scene.cameraPosition]);
  const overviewLookAt = useMemo(() => new THREE.Vector3(...region.overviewLookAt), [region]);

  function changePhase(p: ViewPhase) {
    setPhase(p);
    onPhaseChange?.(p);
  }

  function handleExplore() {
    changePhase("transitioning");
  }

  function handleTransitionDone() {
    changePhase("detail");
  }

  function handleBackToOverview() {
    changePhase("overview");
    setSelectedPart(null);
    setAutoRotate(false);
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 1.5, 14], fov: 50 }}
        shadows
        style={{ background: phase === "overview" ? "#080c14" : scene.bgColor }}
        onPointerMissed={() => setSelectedPart(null)}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#aaccff" />
        <pointLight position={[5, -5, 5]} intensity={0.35} color="#ffaaaa" />

        <CameraController
          phase={phase}
          phaseRef={phaseRef}
          overviewCam={overviewCam}
          detailCam={detailCam}
          overviewLookAt={overviewLookAt}
          controlsRef={controlsRef}
          onTransitionDone={handleTransitionDone}
        />

        {/* Overview: body + region highlight + markers */}
        {(phase === "overview" || phase === "transitioning") && (
          <>
            <BodySilhouette opacity={phase === "overview" ? 1 : 0.3} />
            <RegionHighlight
              center={region.highlightCenter}
              size={region.highlightSize}
              opacity={phase === "overview" ? 1 : 0.2}
            />
          </>
        )}

        {phase === "overview" && (
          <>
            {region.markerPositions.map((m, i) => (
              <PulsingMarker
                key={i}
                position={m.pos}
                label={m.label}
                index={i}
                onClick={handleExplore}
              />
            ))}

            {/* Region label */}
            <Html position={[...region.highlightCenter.slice(0, 2) as [number, number], region.highlightSize[2] / 2 + 0.3]} center>
              <div className="text-xs font-bold text-indigo-300 bg-black/60 px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none">
                {region.regionLabel}
              </div>
            </Html>
          </>
        )}

        {/* Detail: anatomy parts */}
        {phase === "detail" && (
          <SceneGroup
            scene={scene}
            selectedPart={selectedPart}
            onSelect={setSelectedPart}
            autoRotate={autoRotate}
          />
        )}

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={4}
          maxDistance={22}
          enabled={phase === "detail"}
          autoRotate={false}
        />
      </Canvas>

      {/* ── OVERVIEW overlay ── */}
      {phase === "overview" && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-10">
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <p className="text-white/60 text-xs">
              Click a marker or the button below to explore
            </p>
            <button
              onClick={handleExplore}
              className="px-6 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              Explore {region.regionLabel} →
            </button>
          </div>
        </div>
      )}

      {/* ── TRANSITIONING overlay ── */}
      {phase === "transitioning" && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <p className="text-white/40 text-sm animate-pulse">Loading anatomy...</p>
        </div>
      )}

      {/* ── DETAIL overlays ── */}
      {phase === "detail" && (
        <>
          {/* Back button */}
          <div className="absolute top-3 left-3">
            <button
              onClick={handleBackToOverview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 text-white/80 hover:text-white text-xs font-medium transition-colors hover:bg-black/80"
            >
              ← Body Overview
            </button>
          </div>

          {/* Auto-rotate toggle */}
          <div className="absolute top-3 right-3">
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

          {/* Click hint */}
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
        </>
      )}
    </div>
  );
}

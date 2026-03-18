"use client";

import { useRef, useState, useMemo, useEffect } from "react";
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
  // ── Biochemistry chapters — highlight metabolically active regions ──────────
  "carbohydrate-metabolism": {
    highlightCenter: [0, 2.2, 0],
    highlightSize: [2.0, 2.5, 1.0],
    markerPositions: [
      { pos: [0, 3.0, 0.4], label: "Glucose Entry" },
      { pos: [0, 2.5, 0.4], label: "Glycolysis (PFK-1)" },
      { pos: [0, 1.8, 0.4], label: "TCA / Mitochondria" },
      { pos: [0.6, 2.8, 0.3], label: "Liver Glycogen" },
    ],
    overviewLookAt: [0, 2.2, 0],
    regionLabel: "Carbohydrate Metabolism",
  },
  "lipid-metabolism": {
    highlightCenter: [0, 2.5, 0],
    highlightSize: [2.2, 3.0, 1.0],
    markerPositions: [
      { pos: [0, 3.8, 0.4], label: "Lipid Bilayer" },
      { pos: [-0.5, 2.8, 0.4], label: "β-Oxidation" },
      { pos: [0.5, 2.8, 0.4], label: "Cholesterol / HMG-CoA" },
      { pos: [0, 2.0, 0.4], label: "Ketone Bodies" },
    ],
    overviewLookAt: [0, 2.5, 0],
    regionLabel: "Lipid Metabolism",
  },
  "protein-amino-acid-metabolism": {
    highlightCenter: [0, 2.0, 0],
    highlightSize: [2.0, 3.0, 1.0],
    markerPositions: [
      { pos: [0, 3.2, 0.4], label: "Protein Synthesis" },
      { pos: [-0.5, 2.2, 0.4], label: "Urea Cycle" },
      { pos: [0.5, 2.2, 0.4], label: "Transamination" },
      { pos: [0, 1.2, 0.4], label: "AA Disorders" },
    ],
    overviewLookAt: [0, 2.0, 0],
    regionLabel: "Protein Metabolism",
  },
  "enzymology": {
    highlightCenter: [0, 1.5, 0],
    highlightSize: [4.0, 13.0, 1.8],
    markerPositions: [
      { pos: [0, 4.5, 0.5], label: "Enzyme (Active Site)" },
      { pos: [0, 2.5, 0.5], label: "Kinetics (Km/Vmax)" },
      { pos: [-0.5, 1.0, 0.5], label: "Inhibition" },
      { pos: [0.5, 1.0, 0.5], label: "Coenzymes" },
    ],
    overviewLookAt: [0, 2.0, 0],
    regionLabel: "Enzymology",
  },
  "vitamins-minerals": {
    highlightCenter: [0, 1.5, 0],
    highlightSize: [4.0, 13.0, 1.8],
    markerPositions: [
      { pos: [0, 5.0, 0.5], label: "Fat-Soluble (A,D,E,K)" },
      { pos: [0, 3.0, 0.5], label: "B Vitamins" },
      { pos: [0, 1.5, 0.5], label: "Vitamin C" },
      { pos: [0, 0.0, 0.5], label: "Minerals (Ca, Fe)" },
    ],
    overviewLookAt: [0, 2.0, 0],
    regionLabel: "Vitamins & Minerals",
  },
  "nucleic-acids-molecular-biology": {
    highlightCenter: [0, 5.0, 0],
    highlightSize: [1.8, 2.2, 1.4],
    markerPositions: [
      { pos: [0, 5.6, 0.3], label: "DNA Replication" },
      { pos: [0.5, 5.0, 0.4], label: "Transcription" },
      { pos: [0, 4.5, 0.4], label: "Translation" },
      { pos: [-0.5, 5.0, 0.4], label: "Mutations / PCR" },
    ],
    overviewLookAt: [0, 5.0, 0],
    regionLabel: "Molecular Biology",
  },
  "hormones-cell-signaling": {
    highlightCenter: [0, 2.2, 0],
    highlightSize: [2.5, 3.0, 1.2],
    markerPositions: [
      { pos: [0, 3.5, 0.4], label: "GPCR / RTK" },
      { pos: [-0.5, 2.5, 0.4], label: "cAMP / Insulin" },
      { pos: [0.5, 2.5, 0.4], label: "Steroid Hormones" },
      { pos: [0, 1.5, 0.4], label: "Ca²⁺ / IP3" },
    ],
    overviewLookAt: [0, 2.5, 0],
    regionLabel: "Cell Signaling",
  },
  "clinical-biochemistry": {
    highlightCenter: [0, 1.5, 0],
    highlightSize: [4.0, 13.0, 1.8],
    markerPositions: [
      { pos: [0, 4.5, 0.5], label: "Cardiac Markers" },
      { pos: [0.5, 3.0, 0.5], label: "Liver Enzymes" },
      { pos: [-0.5, 1.5, 0.5], label: "Acid-Base" },
      { pos: [0, 0.0, 0.5], label: "Tumor Markers" },
    ],
    overviewLookAt: [0, 2.0, 0],
    regionLabel: "Clinical Biochemistry",
  },
};

function getRegion(chapterKey: string) {
  return (
    BODY_REGION_MAP[chapterKey] ??
    BODY_REGION_MAP["general-anatomy"]
  );
}

// ── Human Body Silhouette — clean skeleton on black ─────────────────────────
function BodySilhouette({ opacity }: { opacity: number }) {
  const o = opacity;

  const bone = {
    color: "#ddd5be", transparent: true, opacity: o,
    roughness: 0.55, metalness: 0.08,
    emissive: "#a89878" as string, emissiveIntensity: 0.18,
  };
  const cartilage = {
    color: "#aac4d4", transparent: true, opacity: o * 0.85,
    roughness: 0.4, metalness: 0.0,
    emissive: "#6699aa" as string, emissiveIntensity: 0.12,
  };
  const dark = { color: "#000000" };

  return (
    <group>
      {/* ── SKULL ── */}
      <mesh position={[0, 5.55, 0]}>
        <sphereGeometry args={[0.72, 24, 18]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Eye orbits (dark holes) */}
      <mesh position={[-0.23, 5.5, 0.58]}>
        <sphereGeometry args={[0.155, 10, 10]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh position={[0.23, 5.5, 0.58]}>
        <sphereGeometry args={[0.155, 10, 10]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      {/* Nasal aperture */}
      <mesh position={[0, 5.2, 0.66]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      {/* Zygomatic arches */}
      <mesh position={[-0.58, 5.38, 0.3]} rotation={[0, 0.35, 0.1]}>
        <capsuleGeometry args={[0.05, 0.5, 4, 6]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[0.58, 5.38, 0.3]} rotation={[0, -0.35, -0.1]}>
        <capsuleGeometry args={[0.05, 0.5, 4, 6]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Maxilla / midface */}
      <mesh position={[0, 5.0, 0.44]}>
        <boxGeometry args={[0.62, 0.38, 0.38]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Mandible */}
      <mesh position={[0, 4.74, 0.36]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.55, 0.16, 0.32]} />
        <meshStandardMaterial {...bone} />
      </mesh>

      {/* ── CERVICAL SPINE C1–C7 ── */}
      {[4.42, 4.28, 4.14, 4.0, 3.86, 3.74, 3.62].map((y, i) => (
        <mesh key={i} position={[0, y, -0.06]}>
          <cylinderGeometry args={[0.17 - i * 0.004, 0.19 - i * 0.004, 0.1, 8]} />
          <meshStandardMaterial {...bone} />
        </mesh>
      ))}

      {/* ── CLAVICLES ── */}
      <mesh position={[-0.74, 4.08, 0.12]} rotation={[0.05, 0.22, 0.15]}>
        <capsuleGeometry args={[0.06, 1.0, 4, 8]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[0.74, 4.08, 0.12]} rotation={[0.05, -0.22, -0.15]}>
        <capsuleGeometry args={[0.06, 1.0, 4, 8]} />
        <meshStandardMaterial {...bone} />
      </mesh>

      {/* ── SCAPULAE ── */}
      <mesh position={[-1.1, 3.65, -0.42]} rotation={[0.18, 0.18, 0.12]}>
        <boxGeometry args={[0.82, 0.88, 0.08]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[1.1, 3.65, -0.42]} rotation={[0.18, -0.18, -0.12]}>
        <boxGeometry args={[0.82, 0.88, 0.08]} />
        <meshStandardMaterial {...bone} />
      </mesh>

      {/* ── RIBCAGE ── */}
      {/* Sternum — manubrium + body */}
      <mesh position={[0, 3.75, 0.46]}>
        <boxGeometry args={[0.26, 0.42, 0.1]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[0, 3.2, 0.47]}>
        <boxGeometry args={[0.2, 0.95, 0.09]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Xiphoid process */}
      <mesh position={[0, 2.7, 0.46]}>
        <coneGeometry args={[0.08, 0.22, 6]} />
        <meshStandardMaterial {...cartilage} />
      </mesh>
      {/* Thoracic spine T1–T12 */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[0, 3.9 - i * 0.16, -0.42]}>
          <cylinderGeometry args={[0.16, 0.18, 0.12, 8]} />
          <meshStandardMaterial {...bone} />
        </mesh>
      ))}
      {/* Ribs — 12 pairs, proper arc shape */}
      {[3.88, 3.72, 3.56, 3.4, 3.24, 3.08, 2.92, 2.76, 2.62, 2.5, 2.4, 2.3].map((y, i) => {
        const r = 0.82 - i * 0.038;
        const thickness = i < 10 ? 0.042 : 0.032;
        // last 2 are floating ribs (shorter arc)
        const arc = i < 10 ? Math.PI : Math.PI * 0.65;
        return (
          <mesh key={i} position={[0, y, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, thickness, 6, 20, arc]} />
            <meshStandardMaterial {...bone} />
          </mesh>
        );
      })}
      {/* Costal cartilage connecting floating ribs to sternum */}
      {[2.78, 2.62].map((y, i) => (
        <group key={i}>
          <mesh position={[-0.55 - i * 0.12, y, 0.3]} rotation={[0.1, 0, 0.4]}>
            <capsuleGeometry args={[0.035, 0.5, 4, 6]} />
            <meshStandardMaterial {...cartilage} />
          </mesh>
          <mesh position={[0.55 + i * 0.12, y, 0.3]} rotation={[0.1, 0, -0.4]}>
            <capsuleGeometry args={[0.035, 0.5, 4, 6]} />
            <meshStandardMaterial {...cartilage} />
          </mesh>
        </group>
      ))}

      {/* ── LUMBAR SPINE L1–L5 ── */}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0, 2.15 - i * 0.18, -0.28]}>
          <cylinderGeometry args={[0.22, 0.24, 0.14, 8]} />
          <meshStandardMaterial {...bone} />
        </mesh>
      ))}

      {/* ── SACRUM + PELVIS ── */}
      <mesh position={[0, 1.22, -0.24]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.48, 0.72, 0.28]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Coccyx */}
      <mesh position={[0, 0.82, -0.1]} rotation={[0.5, 0, 0]}>
        <coneGeometry args={[0.07, 0.28, 6]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Iliac wings — curved plates */}
      <mesh position={[-0.9, 1.58, -0.08]} rotation={[0.08, 0, -0.28]}>
        <boxGeometry args={[0.88, 0.72, 0.18]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[0.9, 1.58, -0.08]} rotation={[0.08, 0, 0.28]}>
        <boxGeometry args={[0.88, 0.72, 0.18]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Ischium */}
      <mesh position={[-0.72, 0.98, 0.04]}>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[0.72, 0.98, 0.04]}>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Pubic symphysis */}
      <mesh position={[0, 1.08, 0.34]}>
        <boxGeometry args={[0.52, 0.26, 0.18]} />
        <meshStandardMaterial {...cartilage} />
      </mesh>

      {/* ── LEFT ARM ── */}
      {/* Humerus */}
      <mesh position={[-1.5, 3.08, 0]} rotation={[0, 0, 0.24]}>
        <capsuleGeometry args={[0.14, 1.5, 4, 10]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Elbow */}
      <mesh position={[-1.72, 2.18, 0]}>
        <sphereGeometry args={[0.17, 10, 10]} />
        <meshStandardMaterial {...cartilage} />
      </mesh>
      {/* Radius */}
      <mesh position={[-1.8, 1.48, 0.07]} rotation={[0, 0, 0.12]}>
        <capsuleGeometry args={[0.08, 1.08, 4, 8]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Ulna */}
      <mesh position={[-1.68, 1.48, -0.07]} rotation={[0, 0, 0.14]}>
        <capsuleGeometry args={[0.075, 1.12, 4, 8]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Wrist carpals */}
      <mesh position={[-1.88, 0.74, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Metacarpals */}
      {[-0.12, -0.06, 0, 0.06, 0.12].map((xOff, i) => (
        <mesh key={i} position={[-1.9 + xOff * 0.8, 0.46 - Math.abs(xOff) * 1.2, 0]} rotation={[0, 0, 0.12]}>
          <capsuleGeometry args={[0.03, 0.28, 4, 6]} />
          <meshStandardMaterial {...bone} />
        </mesh>
      ))}
      {/* Proximal phalanges */}
      {[-0.1, -0.05, 0, 0.05, 0.1].map((xOff, i) => (
        <mesh key={i} position={[-1.96 + xOff * 0.9, 0.18 - Math.abs(xOff) * 1.0, 0]} rotation={[0, 0, 0.1]}>
          <capsuleGeometry args={[0.025, 0.18, 4, 6]} />
          <meshStandardMaterial {...bone} />
        </mesh>
      ))}

      {/* ── RIGHT ARM ── */}
      <mesh position={[1.5, 3.08, 0]} rotation={[0, 0, -0.24]}>
        <capsuleGeometry args={[0.14, 1.5, 4, 10]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[1.72, 2.18, 0]}>
        <sphereGeometry args={[0.17, 10, 10]} />
        <meshStandardMaterial {...cartilage} />
      </mesh>
      <mesh position={[1.8, 1.48, 0.07]} rotation={[0, 0, -0.12]}>
        <capsuleGeometry args={[0.08, 1.08, 4, 8]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[1.68, 1.48, -0.07]} rotation={[0, 0, -0.14]}>
        <capsuleGeometry args={[0.075, 1.12, 4, 8]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[1.88, 0.74, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {[-0.12, -0.06, 0, 0.06, 0.12].map((xOff, i) => (
        <mesh key={i} position={[1.9 - xOff * 0.8, 0.46 - Math.abs(xOff) * 1.2, 0]} rotation={[0, 0, -0.12]}>
          <capsuleGeometry args={[0.03, 0.28, 4, 6]} />
          <meshStandardMaterial {...bone} />
        </mesh>
      ))}
      {[-0.1, -0.05, 0, 0.05, 0.1].map((xOff, i) => (
        <mesh key={i} position={[1.96 - xOff * 0.9, 0.18 - Math.abs(xOff) * 1.0, 0]} rotation={[0, 0, -0.1]}>
          <capsuleGeometry args={[0.025, 0.18, 4, 6]} />
          <meshStandardMaterial {...bone} />
        </mesh>
      ))}

      {/* ── LEFT LEG ── */}
      {/* Femoral head */}
      <mesh position={[-0.6, 0.96, 0.06]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial {...cartilage} />
      </mesh>
      {/* Femur shaft */}
      <mesh position={[-0.56, 0.06, 0.04]}>
        <capsuleGeometry args={[0.18, 1.5, 4, 12]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Patella */}
      <mesh position={[-0.56, -0.88, 0.22]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Knee condyles */}
      <mesh position={[-0.56, -0.96, 0.04]}>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial {...cartilage} />
      </mesh>
      {/* Tibia */}
      <mesh position={[-0.5, -1.84, 0.02]}>
        <capsuleGeometry args={[0.13, 1.5, 4, 10]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Fibula */}
      <mesh position={[-0.72, -1.84, -0.02]}>
        <capsuleGeometry args={[0.065, 1.48, 4, 8]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Ankle mortise */}
      <mesh position={[-0.56, -2.66, 0.04]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial {...cartilage} />
      </mesh>
      {/* Calcaneus */}
      <mesh position={[-0.56, -2.82, -0.18]}>
        <boxGeometry args={[0.28, 0.2, 0.52]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {/* Metatarsals */}
      {[-0.1, -0.05, 0, 0.05, 0.1].map((xOff, i) => (
        <mesh key={i} position={[-0.56 + xOff * 0.5, -2.86, 0.22 + i * 0.04]} rotation={[0.22, 0, 0]}>
          <capsuleGeometry args={[0.03, 0.38, 4, 6]} />
          <meshStandardMaterial {...bone} />
        </mesh>
      ))}

      {/* ── RIGHT LEG ── */}
      <mesh position={[0.6, 0.96, 0.06]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial {...cartilage} />
      </mesh>
      <mesh position={[0.56, 0.06, 0.04]}>
        <capsuleGeometry args={[0.18, 1.5, 4, 12]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[0.56, -0.88, 0.22]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[0.56, -0.96, 0.04]}>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial {...cartilage} />
      </mesh>
      <mesh position={[0.5, -1.84, 0.02]}>
        <capsuleGeometry args={[0.13, 1.5, 4, 10]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[0.72, -1.84, -0.02]}>
        <capsuleGeometry args={[0.065, 1.48, 4, 8]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      <mesh position={[0.56, -2.66, 0.04]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial {...cartilage} />
      </mesh>
      <mesh position={[0.56, -2.82, -0.18]}>
        <boxGeometry args={[0.28, 0.2, 0.52]} />
        <meshStandardMaterial {...bone} />
      </mesh>
      {[-0.1, -0.05, 0, 0.05, 0.1].map((xOff, i) => (
        <mesh key={i} position={[0.56 + xOff * 0.5, -2.86, 0.22 + i * 0.04]} rotation={[0.22, 0, 0]}>
          <capsuleGeometry args={[0.03, 0.38, 4, 6]} />
          <meshStandardMaterial {...bone} />
        </mesh>
      ))}
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
  isMobile,
}: {
  position: [number, number, number];
  label: string;
  index: number;
  onClick: () => void;
  isMobile: boolean;
}) {
  const dotRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const t = useRef(index * 0.65);
  const [hovered, setHovered] = useState(false);

  const dotRadius = isMobile ? 0.16 : 0.1;
  const ringRadius = isMobile ? 0.18 : 0.1;

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

  const showLabel = isMobile || hovered;

  return (
    <group position={position}>
      {/* Expanding ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[ringRadius, 0.018, 8, 24]} />
        <meshStandardMaterial color="#818cf8" transparent opacity={0.6} />
      </mesh>
      {/* Core dot */}
      <mesh
        ref={dotRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          if (!isMobile) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          if (!isMobile) document.body.style.cursor = "auto";
        }}
      >
        <sphereGeometry args={[dotRadius, 12, 12]} />
        <meshStandardMaterial
          color={hovered ? "#ffffff" : "#818cf8"}
          emissive={hovered ? "#6366f1" : "#4338ca"}
          emissiveIntensity={hovered ? 1.2 : 0.8}
        />
      </mesh>
      {/* Invisible larger touch target on mobile */}
      {isMobile && (
        <mesh onClick={(e) => { e.stopPropagation(); onClick(); }} visible={false}>
          <sphereGeometry args={[0.35, 6, 6]} />
          <meshStandardMaterial />
        </mesh>
      )}
      {showLabel && (
        <Html
          center
          distanceFactor={10}
          position={[0, dotRadius + 0.22, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{ fontSize: "10px", lineHeight: 1.4 }}
            className="bg-black/85 text-white px-2 py-1 rounded-md whitespace-nowrap font-medium shadow-lg border border-white/10"
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
  isMobile,
}: {
  part: AnatomyPart;
  selected: boolean;
  onSelect: (p: AnatomyPart | null) => void;
  isMobile: boolean;
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

  // Show label on hover or when selected (desktop + mobile)
  const showLabel = hovered || selected;

  return (
    <group position={part.position} rotation={part.rotation}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={(e) => { e.stopPropagation(); onSelect(selected ? null : part); }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          if (!isMobile) document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          if (!isMobile) document.body.style.cursor = "auto";
        }}
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
      {showLabel && (
        <Html
          position={[0, (part.size[1] ?? part.size[0]) * 0.7 + 0.2, 0]}
          center
          distanceFactor={12}
          occlude={false}
        >
          <div
            className={`px-2 py-0.5 rounded font-semibold whitespace-nowrap pointer-events-none select-none ${
              selected ? "bg-white text-black shadow-lg"
              : "bg-white/90 text-black shadow"
            }`}
            style={{ fontSize: "10px", lineHeight: "1.4" }}
          >
            {part.label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Scene group (detail mode) ───────────────────────────────────────────────
function SceneGroup({
  scene,
  selectedPart,
  onSelect,
  autoRotate,
  isMobile,
}: {
  scene: AnatomyScene;
  selectedPart: AnatomyPart | null;
  onSelect: (p: AnatomyPart | null) => void;
  autoRotate: boolean;
  isMobile: boolean;
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
          isMobile={isMobile}
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
  const [isMobile, setIsMobile] = useState(false);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const region = getRegion(scene.chapterKey);

  const overviewCam = useMemo(
    () => new THREE.Vector3(0, 1.5, isMobile ? 18 : 14),
    [isMobile]
  );
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
        camera={{ position: [0, 1.5, isMobile ? 18 : 14], fov: isMobile ? 60 : 50 }}
        shadows
        style={{ background: "#000000", touchAction: "none" }}
        onPointerMissed={() => setSelectedPart(null)}
      >
        <ambientLight intensity={0.25} />
        {/* Main top-front key light */}
        <directionalLight position={[2, 10, 6]} intensity={1.8} castShadow />
        {/* Cool blue rim from behind */}
        <pointLight position={[0, 4, -8]} intensity={0.9} color="#4488cc" />
        {/* Subtle fill from below-left */}
        <pointLight position={[-4, -3, 4]} intensity={0.4} color="#ccddee" />
        {/* Warm accent from right */}
        <pointLight position={[6, 2, 3]} intensity={0.35} color="#ffe0bb" />

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
                isMobile={isMobile}
              />
            ))}

            {/* Region label */}
            <Html
              position={[...region.highlightCenter.slice(0, 2) as [number, number], region.highlightSize[2] / 2 + 0.3]}
              center
              distanceFactor={10}
            >
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
            isMobile={isMobile}
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
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-8 sm:pb-10">
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <p className="text-white/60 text-xs text-center px-4">
              {isMobile ? "Tap a marker or the button below" : "Click a marker or the button below"} to explore
            </p>
            <button
              onClick={handleExplore}
              className="px-6 py-3 sm:py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold shadow-lg transition-all hover:scale-105 active:scale-95"
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
              className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-black/60 text-white/80 hover:text-white text-xs font-medium transition-colors hover:bg-black/80 active:bg-black/90 min-h-[36px] sm:min-h-0"
            >
              ← Body Overview
            </button>
          </div>

          {/* Auto-rotate toggle */}
          <div className="absolute top-3 right-3">
            <button
              onClick={() => setAutoRotate((v) => !v)}
              className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all shadow-lg min-h-[36px] sm:min-h-0 ${
                autoRotate
                  ? "bg-primary text-primary-foreground"
                  : "bg-black/60 text-white hover:bg-black/80"
              }`}
            >
              {autoRotate ? "⏸ Pause" : "▶ Rotate"}
            </button>
          </div>

          {/* Touch/click hint */}
          {!selectedPart && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
              {isMobile
                ? "Tap a structure • Drag to rotate • Pinch to zoom"
                : "Click any structure to learn more • Drag to rotate • Scroll to zoom"}
            </div>
          )}

          {/* Info panel */}
          {selectedPart && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur border-t border-white/10 p-3 sm:p-4 animate-in slide-in-from-bottom">
              <div className="flex items-start justify-between gap-3 max-w-2xl mx-auto">
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-sm mb-1">{selectedPart.label}</h3>
                  <p className="text-gray-300 text-xs leading-relaxed line-clamp-3 sm:line-clamp-none">{selectedPart.info}</p>
                </div>
                <button
                  onClick={() => setSelectedPart(null)}
                  className="text-gray-400 hover:text-white text-xl leading-none shrink-0 mt-0.5 p-1 -m-1"
                  aria-label="Close"
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

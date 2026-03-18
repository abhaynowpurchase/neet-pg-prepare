"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { IAnatomyPart as AnatomyPart, IAnatomyScene as AnatomyScene } from "@/types";

export type ViewPhase = "overview" | "transitioning" | "detail";

type LayerState = {
  skin: boolean;
  muscles: boolean;
  nerves: boolean;
  arteries: boolean;
  bones: boolean;
};

type SelectedInfo = {
  label: string;
  type: "nerve" | "artery" | "muscle" | "bone" | "lesion";
  info: string;
  clinicalNote?: string;
} | null;

// ── Body region map ───────────────────────────────────────────────────────────
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
  return BODY_REGION_MAP[chapterKey] ?? BODY_REGION_MAP["general-anatomy"];
}

// ── Nerve pathway data ────────────────────────────────────────────────────────
const NERVE_PATHS: Array<{
  id: string; label: string; color: string; radius: number;
  points: [number, number, number][];
  info: string; clinicalNote?: string;
}> = [
  // ── Left Brachial Plexus trunks ──────────────────────────────────────────
  {
    id: "bp-upper-L", label: "Upper Trunk C5-C6 (Left)", color: "#ffee55", radius: 0.038,
    points: [[-0.22,4.05,-0.06],[-0.5,3.95,0.08],[-0.82,3.85,0.1],[-1.05,3.7,0.1]],
    info: "Upper trunk of brachial plexus (C5, C6). Supplies: deltoid (axillary), biceps/brachialis (musculocutaneous), supraspinatus, infraspinatus.",
    clinicalNote: "Erb's Palsy: C5-C6 injury → 'waiter's tip' posture. Arm adducted, medially rotated, elbow extended, forearm pronated. Loss of shoulder abduction & elbow flexion.",
  },
  {
    id: "bp-middle-L", label: "Middle Trunk C7 (Left)", color: "#ffee55", radius: 0.032,
    points: [[-0.22,3.78,-0.06],[-0.5,3.75,0.04],[-0.82,3.7,0.04],[-1.05,3.62,0.04]],
    info: "Middle trunk (C7). Contributes to radial nerve (triceps, wrist extensors) and median nerve.",
    clinicalNote: "Isolated C7 injury: wrist drop, triceps weakness, loss of wrist and finger extension.",
  },
  {
    id: "bp-lower-L", label: "Lower Trunk C8-T1 (Left)", color: "#ffee55", radius: 0.038,
    points: [[-0.22,3.58,-0.06],[-0.5,3.6,0.0],[-0.82,3.58,0.0],[-1.05,3.55,-0.06]],
    info: "Lower trunk (C8, T1). Supplies: intrinsic hand muscles via ulnar nerve, thenar eminence via median nerve.",
    clinicalNote: "Klumpke's Palsy: C8-T1 injury → claw hand (intrinsic minus). May have Horner's syndrome (ptosis, miosis, anhidrosis) if T1 sympathetic fibers involved.",
  },
  // ── Left terminal nerves ─────────────────────────────────────────────────
  {
    id: "radial-L", label: "Radial Nerve (Left)", color: "#ffe033", radius: 0.025,
    points: [[-1.05,3.62,0.04],[-1.3,3.45,-0.02],[-1.5,3.1,0.1],[-1.65,2.75,0.18],[-1.8,2.5,0.1],[-1.88,2.1,0.1],[-1.86,1.5,0.08],[-1.88,0.75,0.1]],
    info: "Radial nerve (C5-T1, posterior cord). Motor: all extensors of arm/forearm/wrist/fingers. Sensory: posterior arm, posterior forearm, dorsal hand (lateral 3½ digits).",
    clinicalNote: "Spiral groove injury (Saturday night palsy): wrist drop + finger drop. Cannot extend wrist/fingers. Triceps usually spared (branch above groove). Sensory loss dorsal hand. Axillary injury: add triceps weakness.",
  },
  {
    id: "median-L", label: "Median Nerve (Left)", color: "#ffd700", radius: 0.022,
    points: [[-1.05,3.68,0.1],[-1.42,3.3,0.14],[-1.65,2.82,0.12],[-1.72,2.2,0.1],[-1.75,1.52,0.08],[-1.82,0.75,0.05]],
    info: "Median nerve (C6-T1, lateral + medial cords). Motor: pronators, wrist flexors, most flexor digitorum superficialis, thenar eminence (LOAF: Lumbricals 1&2, Opponens pollicis, Abductor pollicis brevis, Flexor pollicis brevis). Sensory: lateral 3½ digits (palmar), index/middle nail beds.",
    clinicalNote: "Carpal tunnel syndrome: compression at flexor retinaculum → thenar wasting, ape hand (cannot oppose thumb), loss of grip. Tinel's + Phalen's test. Sensory loss index + middle finger. Phalen's test positive.",
  },
  {
    id: "ulnar-L", label: "Ulnar Nerve (Left)", color: "#ffc800", radius: 0.022,
    points: [[-1.05,3.55,-0.08],[-1.45,3.2,-0.05],[-1.62,2.72,-0.08],[-1.65,2.2,-0.14],[-1.62,1.52,-0.08],[-1.72,0.75,-0.05]],
    info: "Ulnar nerve (C8-T1, medial cord). Motor: FCU, FDP (ring+little), hypothenar, interossei, medial 2 lumbricals, adductor pollicis. Sensory: medial 1½ digits.",
    clinicalNote: "Medial epicondyle injury: claw hand (ring+little) — hyperextension at MCP, flexion at IP. 'Ulnar paradox': wrist lesion → worse claw (FDP intact). Loss of little + ring finger sensation. Froment's sign (adductor pollicis weak → uses FPL to hold paper).",
  },
  {
    id: "musculocutaneous-L", label: "Musculocutaneous N. (Left)", color: "#ffe566", radius: 0.018,
    points: [[-1.05,3.7,0.12],[-1.25,3.5,0.18],[-1.45,3.15,0.2],[-1.55,2.75,0.18],[-1.62,2.32,0.12]],
    info: "Musculocutaneous nerve (C5-C7, lateral cord). Motor: coracobrachialis, biceps brachii, brachialis. Sensory: lateral forearm (as lateral cutaneous nerve of forearm).",
    clinicalNote: "Isolated injury rare. Weakness of elbow flexion + supination. Sensory loss: lateral forearm. Usually damaged with other cords in axillary trauma.",
  },
  {
    id: "axillary-L", label: "Axillary Nerve (Left)", color: "#ffe080", radius: 0.018,
    points: [[-1.05,3.62,0.0],[-1.25,3.78,-0.15],[-1.42,3.88,-0.08],[-1.52,3.85,0.05]],
    info: "Axillary nerve (C5-C6, posterior cord). Motor: deltoid, teres minor. Sensory: regimental badge area (lateral upper arm).",
    clinicalNote: "Surgical neck of humerus fracture or shoulder dislocation → deltoid paralysis (cannot abduct arm 15-90°). Sensory loss: regimental badge area. Also injured in quadrilateral space syndrome.",
  },
  // ── Right Brachial Plexus (mirror) ──────────────────────────────────────
  {
    id: "bp-upper-R", label: "Upper Trunk C5-C6 (Right)", color: "#ffee55", radius: 0.038,
    points: [[0.22,4.05,-0.06],[0.5,3.95,0.08],[0.82,3.85,0.1],[1.05,3.7,0.1]],
    info: "Upper trunk of brachial plexus (C5, C6). Supplies: deltoid (axillary), biceps/brachialis (musculocutaneous), supraspinatus, infraspinatus.",
    clinicalNote: "Erb's Palsy: C5-C6 injury → 'waiter's tip' posture. Arm adducted, medially rotated, elbow extended, forearm pronated.",
  },
  {
    id: "bp-lower-R", label: "Lower Trunk C8-T1 (Right)", color: "#ffee55", radius: 0.038,
    points: [[0.22,3.58,-0.06],[0.5,3.6,0.0],[0.82,3.58,0.0],[1.05,3.55,-0.06]],
    info: "Lower trunk (C8, T1). Supplies intrinsic hand muscles via ulnar and median nerves.",
    clinicalNote: "Klumpke's Palsy: C8-T1 injury → claw hand. Cervical rib may compress lower trunk → thoracic outlet syndrome.",
  },
  {
    id: "radial-R", label: "Radial Nerve (Right)", color: "#ffe033", radius: 0.025,
    points: [[1.05,3.62,0.04],[1.3,3.45,-0.02],[1.5,3.1,0.1],[1.65,2.75,0.18],[1.8,2.5,0.1],[1.88,2.1,0.1],[1.86,1.5,0.08],[1.88,0.75,0.1]],
    info: "Radial nerve (C5-T1). Motor: all extensors of arm/forearm/wrist. Spiral groove → wrist drop.",
    clinicalNote: "Midshaft humerus fracture: radial nerve injured at spiral groove → wrist drop. Triceps usually spared.",
  },
  {
    id: "median-R", label: "Median Nerve (Right)", color: "#ffd700", radius: 0.022,
    points: [[1.05,3.68,0.1],[1.42,3.3,0.14],[1.65,2.82,0.12],[1.72,2.2,0.1],[1.75,1.52,0.08],[1.82,0.75,0.05]],
    info: "Median nerve (C6-T1). Thenar muscles, pronators, carpal tunnel compression → ape hand.",
    clinicalNote: "Carpal tunnel syndrome: most common peripheral nerve entrapment. Night pain, thenar wasting, positive Tinel's/Phalen's.",
  },
  {
    id: "ulnar-R", label: "Ulnar Nerve (Right)", color: "#ffc800", radius: 0.022,
    points: [[1.05,3.55,-0.08],[1.45,3.2,-0.05],[1.62,2.72,-0.08],[1.65,2.2,-0.14],[1.62,1.52,-0.08],[1.72,0.75,-0.05]],
    info: "Ulnar nerve (C8-T1). Intrinsic hand muscles, medial 1½ digits sensation.",
    clinicalNote: "Cubital tunnel syndrome (medial epicondyle): ring+little claw hand, sensory loss medial 1½ digits.",
  },
  // ── Phrenic nerves ───────────────────────────────────────────────────────
  {
    id: "phrenic-L", label: "Left Phrenic Nerve C3,4,5", color: "#88ffdd", radius: 0.018,
    points: [[-0.24,4.22,0.04],[-0.3,3.92,0.1],[-0.35,3.52,0.1],[-0.32,3.0,0.1],[-0.3,2.52,0.1],[-0.32,2.2,0.12]],
    info: "Phrenic nerve (C3, C4, C5). Sole motor supply to ipsilateral hemidiaphragm. 'C3,4,5 keeps the diaphragm alive.' Sensory: central diaphragm, pericardium.",
    clinicalNote: "Damage: ipsilateral hemidiaphragm paralysis (raised on CXR). Causes: lung cancer (left), cervical disc/surgery, trauma. Referred pain: shoulder tip (C4 dermatome) — Kehr's sign in splenic rupture.",
  },
  {
    id: "phrenic-R", label: "Right Phrenic Nerve C3,4,5", color: "#88ffdd", radius: 0.018,
    points: [[0.24,4.22,0.04],[0.3,3.92,0.1],[0.35,3.52,0.1],[0.32,3.0,0.1],[0.3,2.52,0.1],[0.32,2.2,0.12]],
    info: "Phrenic nerve (C3, C4, C5). Right side: commonly damaged by hepatic/subphrenic pathology.",
    clinicalNote: "Right phrenic: damaged by lung cancer, pleural disease. Paradoxical movement of diaphragm on sniff test (fluoroscopy).",
  },
  // ── Lumbar Plexus ────────────────────────────────────────────────────────
  {
    id: "femoral-L", label: "Femoral Nerve L2-L4 (Left)", color: "#ffaa33", radius: 0.028,
    points: [[-0.38,1.72,-0.22],[-0.5,1.42,-0.12],[-0.52,1.0,0.06],[-0.55,0.62,0.16],[-0.56,0.12,0.14],[-0.55,-0.42,0.1],[-0.54,-0.82,0.06]],
    info: "Femoral nerve (L2-L4). Exits lateral to femoral artery under inguinal ligament. Motor: iliopsoas (hip flexion), quadriceps (knee extension). Sensory: anteromedial thigh, medial leg (saphenous branch).",
    clinicalNote: "Femoral nerve injury: weak hip flexion + knee extension. Cannot climb stairs. Loss of knee jerk. Sensory loss anterior thigh + medial leg. Causes: pelvic fracture, femoral artery surgery, psoas haematoma.",
  },
  {
    id: "femoral-R", label: "Femoral Nerve L2-L4 (Right)", color: "#ffaa33", radius: 0.028,
    points: [[0.38,1.72,-0.22],[0.5,1.42,-0.12],[0.52,1.0,0.06],[0.55,0.62,0.16],[0.56,0.12,0.14],[0.55,-0.42,0.1],[0.54,-0.82,0.06]],
    info: "Femoral nerve (L2-L4). Motor: quadriceps femoris. Sensory: anteromedial thigh via saphenous nerve.",
    clinicalNote: "Meralgia paresthetica: lateral femoral cutaneous nerve (L2-L3) entrapment under inguinal ligament → burning pain lateral thigh. Common in obesity, tight jeans.",
  },
  // ── Sacral Plexus / Sciatic ──────────────────────────────────────────────
  {
    id: "sciatic-L", label: "Sciatic Nerve L4-S3 (Left)", color: "#ff9900", radius: 0.038,
    points: [[-0.35,1.08,-0.28],[-0.5,0.72,-0.2],[-0.56,0.22,-0.14],[-0.57,-0.48,-0.1],[-0.57,-0.72,-0.06]],
    info: "Sciatic nerve (L4-S3): largest nerve in body. Exits greater sciatic foramen below piriformis. Two divisions: tibial (L4-S3) + common peroneal (L4-S2).",
    clinicalNote: "Piriformis syndrome: sciatic compression by piriformis → buttock pain radiating down leg. Misdiagnosed as disc prolapse. Hip rotation aggravates. Posterior hip dislocation/pelvic fracture → sciatic injury.",
  },
  {
    id: "common-peroneal-L", label: "Common Peroneal N. (Left)", color: "#ff8800", radius: 0.024,
    points: [[-0.57,-0.72,-0.06],[-0.65,-1.02,0.1],[-0.72,-1.32,0.22],[-0.76,-1.52,0.28],[-0.74,-1.82,0.2],[-0.72,-2.22,0.1]],
    info: "Common peroneal nerve (L4-S2): winds around fibular neck. Divides into deep (dorsiflexion, toe extension) and superficial peroneal (eversion, lateral leg sensation).",
    clinicalNote: "Fibular neck injury (most vulnerable peripheral nerve): foot drop (cannot dorsiflex/evert). High-stepping gait. Sensory loss: lateral leg + dorsal foot. Causes: tight POP cast, prolonged squatting, fracture neck fibula.",
  },
  {
    id: "tibial-L", label: "Tibial Nerve (Left)", color: "#ff9933", radius: 0.026,
    points: [[-0.57,-0.72,-0.06],[-0.53,-1.22,-0.1],[-0.52,-1.82,-0.1],[-0.53,-2.32,-0.06],[-0.54,-2.62,-0.02]],
    info: "Tibial nerve (L4-S3): larger terminal branch of sciatic. Motor: posterior leg (plantarflexion, toe flexion), intrinsic foot muscles. Sensory: sole of foot.",
    clinicalNote: "Tarsal tunnel syndrome: tibial nerve entrapment behind medial malleolus → burning pain + numbness of sole. Compartment syndrome of leg → tibial nerve ischaemia. Loss of ankle jerk.",
  },
  {
    id: "sciatic-R", label: "Sciatic Nerve L4-S3 (Right)", color: "#ff9900", radius: 0.038,
    points: [[0.35,1.08,-0.28],[0.5,0.72,-0.2],[0.56,0.22,-0.14],[0.57,-0.48,-0.1],[0.57,-0.72,-0.06]],
    info: "Sciatic nerve (L4-S3). Largest nerve. Tibial + common peroneal divisions.",
    clinicalNote: "IM injection in gluteal region: give in upper outer quadrant to avoid sciatic nerve. Sciatic stretch test (SLR): nerve root irritation.",
  },
  {
    id: "common-peroneal-R", label: "Common Peroneal N. (Right)", color: "#ff8800", radius: 0.024,
    points: [[0.57,-0.72,-0.06],[0.65,-1.02,0.1],[0.72,-1.32,0.22],[0.76,-1.52,0.28],[0.74,-1.82,0.2],[0.72,-2.22,0.1]],
    info: "Common peroneal nerve winds around neck of fibula. Foot drop if injured.",
    clinicalNote: "Fibular neck fracture: immediate foot drop. Check ankle dorsiflexion and eversion after any fibula fracture.",
  },
  {
    id: "tibial-R", label: "Tibial Nerve (Right)", color: "#ff9933", radius: 0.026,
    points: [[0.57,-0.72,-0.06],[0.53,-1.22,-0.1],[0.52,-1.82,-0.1],[0.53,-2.32,-0.06],[0.54,-2.62,-0.02]],
    info: "Tibial nerve: plantarflexion, sole sensation. Tarsal tunnel at medial malleolus.",
    clinicalNote: "Plantar fasciitis differential: tarsal tunnel syndrome causes burning sole pain, especially at medial malleolus.",
  },
  // ── Obturator nerve ──────────────────────────────────────────────────────
  {
    id: "obturator-L", label: "Obturator Nerve L2-L4 (Left)", color: "#ffcc55", radius: 0.018,
    points: [[-0.3,1.62,-0.18],[-0.55,1.42,-0.05],[-0.72,1.22,0.06],[-0.78,0.88,0.08],[-0.72,0.52,0.06]],
    info: "Obturator nerve (L2-L4). Exits obturator foramen. Motor: adductors of thigh. Sensory: medial thigh.",
    clinicalNote: "Hip surgery / obturator hernia → obturator nerve injury. Weakness of hip adduction (cannot cross legs). Referred pain to medial thigh and knee (Howship-Romberg sign in obturator hernia).",
  },
];

// ── Lesion marker data ────────────────────────────────────────────────────────
const LESION_MARKERS: Array<{
  id: string; label: string; position: [number, number, number];
  info: string; clinicalNote: string; color: string;
}> = [
  {
    id: "erb-L", label: "Erb's Point (Left)", position: [-0.78, 3.88, 0.08],
    color: "#ff4444",
    info: "C5-C6 junction at posterior triangle of neck (2 cm above clavicle midpoint). Erb's point: where 5 nerves meet (C5, C6, suprascapular, nerve to subclavius, lateral pectoral).",
    clinicalNote: "Erb's Palsy: forceful separation of head + shoulder (birth injury/RTA). Waiter's tip: arm adducted, medially rotated, elbow extended, forearm pronated. Intact: hand grip (C8-T1).",
  },
  {
    id: "klumpke-L", label: "Klumpke's Lesion (Left)", position: [-0.78, 3.56, -0.04],
    color: "#ff4444",
    info: "C8-T1 roots. Lower trunk of brachial plexus. Forceful arm abduction (grabbing overhead during fall).",
    clinicalNote: "Klumpke's Palsy: claw hand (all intrinsics paralysed), sensory loss medial 1½ digits. Horner's syndrome if T1 sympathetic fibers involved (ptosis + miosis + anhidrosis ipsilateral face).",
  },
  {
    id: "spiral-groove-L", label: "Spiral Groove (Left)", position: [-1.65, 2.76, 0.2],
    color: "#ff6600",
    info: "Radial nerve in the spiral groove (musculospiral groove) of humerus. Most vulnerable point.",
    clinicalNote: "Midshaft humerus fracture: wrist drop + finger drop. Triceps spared (branch given above groove). Test: wrist/finger extension. Sensory: dorsum of hand (anatomical snuffbox). Cannot write or shake hands.",
  },
  {
    id: "medial-epicondyle-L", label: "Medial Epicondyle (Left)", position: [-1.66, 2.2, -0.14],
    color: "#ff6600",
    info: "Ulnar nerve passes posterior to medial epicondyle in cubital tunnel (retrocondylar groove).",
    clinicalNote: "Cubital tunnel syndrome: most common cause of ulnar neuropathy. Tingling ring + little fingers. Claw hand: ring + little (MCP hyperextension, IP flexion). Froment's sign +ve. 'Gunstock deformity' after childhood fracture.",
  },
  {
    id: "carpal-tunnel-L", label: "Carpal Tunnel (Left)", position: [-1.84, 0.74, 0.05],
    color: "#ff6600",
    info: "Median nerve compressed under flexor retinaculum at wrist. Contents of carpal tunnel: 9 flexor tendons + median nerve.",
    clinicalNote: "Most common peripheral nerve entrapment. Thenar wasting, ape hand (cannot oppose thumb). Night pain/numbness (index+middle). Tinel's + Phalen's test. Risk: pregnancy, hypothyroid, RA, diabetes, acromegaly.",
  },
  {
    id: "spiral-groove-R", label: "Spiral Groove (Right)", position: [1.65, 2.76, 0.2],
    color: "#ff6600",
    info: "Radial nerve at spiral groove of humerus.",
    clinicalNote: "Saturday night palsy: prolonged compression in arm-over-chair position while intoxicated → wrist drop.",
  },
  {
    id: "medial-epicondyle-R", label: "Medial Epicondyle (Right)", position: [1.66, 2.2, -0.14],
    color: "#ff6600",
    info: "Ulnar nerve at cubital tunnel (right side).",
    clinicalNote: "Cubital tunnel: repetitive elbow flexion (typing, throwing). Claw ring+little. Surgical options: decompression or anterior transposition.",
  },
  {
    id: "carpal-tunnel-R", label: "Carpal Tunnel (Right)", position: [1.84, 0.74, 0.05],
    color: "#ff6600",
    info: "Median nerve at carpal tunnel (right).",
    clinicalNote: "CTS diagnosis: nerve conduction studies. Treatment: splinting, steroid injection, decompression. Recurrence common without surgery.",
  },
  {
    id: "piriformis", label: "Piriformis / Sciatic Exit", position: [-0.5, 0.72, -0.22],
    color: "#ff4444",
    info: "Greater sciatic notch: sciatic nerve exits pelvis below piriformis (in 85% people). Piriformis muscle separates it from superior gluteal nerve above.",
    clinicalNote: "Piriformis syndrome: pseudo-sciatica. Hip external rotation worsens pain (FAIR test). IM injection: give in upper outer gluteal quadrant. Posterior hip dislocation → sciatic injury.",
  },
  {
    id: "fibular-head-L", label: "Fibular Head (Left)", position: [-0.74, -1.5, 0.26],
    color: "#ff4444",
    info: "Common peroneal nerve winds superficially around posterior head of fibula. Most exposed peripheral nerve in the body.",
    clinicalNote: "Foot drop: cannot dorsiflex/evert foot. High-stepping gait. Causes: fibular neck fracture, POP cast, prolonged squatting, lateral knee surgery. Sensory: lateral leg + dorsum of foot.",
  },
  {
    id: "fibular-head-R", label: "Fibular Head (Right)", position: [0.74, -1.5, 0.26],
    color: "#ff4444",
    info: "Common peroneal nerve at fibular neck (right).",
    clinicalNote: "Check ankle dorsiflexion/eversion after any fibula fracture. Tight below-knee POP = most preventable cause of foot drop.",
  },
  {
    id: "inguinal-L", label: "Femoral Triangle (Left)", position: [-0.54, 0.78, 0.14],
    color: "#ff6600",
    info: "Femoral triangle: femoral nerve, artery, vein, lymphatics. Femoral sheath contains artery + vein + lymphatics (not nerve — lateral). NAVEL from lateral to medial: Nerve, Artery, Vein, Empty space, Lymphatics.",
    clinicalNote: "Femoral hernia: below and lateral to pubic tubercle (inguinal hernia = above and medial). Femoral nerve block. Femoral artery puncture: 1 cm medial to mid-inguinal point.",
  },
];

// ── Artery pathway data ───────────────────────────────────────────────────────
const ARTERY_PATHS: Array<{
  id: string; label: string; radius: number;
  points: [number, number, number][];
  info: string; clinicalNote?: string;
}> = [
  // ── Aorta ────────────────────────────────────────────────────────────────
  {
    id: "ascending-aorta", label: "Ascending Aorta", radius: 0.065,
    points: [[0.1,3.5,0.18],[0.12,3.75,0.18],[0.14,4.0,0.1]],
    info: "Ascending aorta: 5 cm long, from aortic valve to aortic arch. Branches: right and left coronary arteries. Dilated in Marfan syndrome, syphilis.",
    clinicalNote: "Type A aortic dissection: involves ascending aorta → surgical emergency. Type B: descending only → medical management. Widened mediastinum on CXR.",
  },
  {
    id: "aortic-arch", label: "Aortic Arch", radius: 0.06,
    points: [[0.14,4.0,0.1],[0.0,4.12,-0.0],[-0.18,4.12,-0.14],[-0.3,3.92,-0.24]],
    info: "Aortic arch: gives off brachiocephalic trunk (R), left common carotid, left subclavian. 'Salty beer please': Subclavian, Brachiocephalic (Right), CCA (Left)... actually BCA, LCCA, LS.",
    clinicalNote: "Coarctation of aorta: narrowing usually near ligamentum arteriosum. Rib notching (collaterals). HTN upper limbs, weak femoral pulses. Radio-femoral delay. Associated with bicuspid aortic valve, Turner syndrome.",
  },
  {
    id: "desc-aorta", label: "Descending / Abdominal Aorta", radius: 0.052,
    points: [[-0.28,3.88,-0.28],[-0.18,3.5,-0.3],[-0.1,3.0,-0.28],[-0.06,2.5,-0.24],[-0.02,2.0,-0.22],[0.0,1.5,-0.2],[0.0,1.22,-0.16]],
    info: "Descending thoracic aorta → abdominal aorta. Major branches: celiac (T12), SMA (L1), renal arteries (L1-L2), gonadal, IMA (L3), bifurcation at L4 (aortic bifurcation).",
    clinicalNote: "AAA (abdominal aortic aneurysm): >3 cm diameter, risk rupture >5.5 cm. Pulsatile epigastric mass. Screening: ultrasound men 65+. Ruptured AAA: triad — hypotension, back pain, pulsatile mass.",
  },
  // ── Left carotid ─────────────────────────────────────────────────────────
  {
    id: "carotid-L", label: "Left Common Carotid", radius: 0.032,
    points: [[-0.2,4.1,-0.14],[-0.3,4.35,0.15],[-0.35,4.62,0.25],[-0.38,4.88,0.28]],
    info: "Left common carotid arises directly from aortic arch. Right from brachiocephalic trunk. Bifurcates at C4 level (upper border of thyroid cartilage).",
    clinicalNote: "Carotid artery disease: atherosclerosis at bifurcation → TIA, amaurosis fugax, stroke. Carotid bruit + bruit. Endarterectomy if >70% stenosis symptomatic. Carotid sinus: baroreceptors (pressure → bradycardia).",
  },
  {
    id: "carotid-R", label: "Right Common Carotid", radius: 0.032,
    points: [[0.15,4.0,0.08],[0.3,4.35,0.15],[0.35,4.62,0.25],[0.38,4.88,0.28]],
    info: "Right common carotid from brachiocephalic trunk. Bifurcates at C4 level into ICA and ECA.",
    clinicalNote: "Carotid pulse: palpable at anterior border of SCM at C4 level. Central (aortic) pulse character best assessed here.",
  },
  // ── Subclavian → Brachial (Left) ─────────────────────────────────────────
  {
    id: "subclavian-L", label: "Left Subclavian Artery", radius: 0.028,
    points: [[-0.2,4.1,-0.14],[-0.35,4.05,0.04],[-0.62,4.0,0.1],[-0.92,3.96,0.1],[-1.18,3.86,0.1]],
    info: "Left subclavian artery: directly from aortic arch. Branches: vertebral, thyrocervical trunk, internal thoracic (mammary), costocervical trunk, dorsal scapular. Right subclavian from brachiocephalic trunk.",
    clinicalNote: "Subclavian steal syndrome: proximal subclavian stenosis → retrograde flow down vertebral artery → vertebrobasilar insufficiency when arm exercised. Cervical rib → subclavian artery compression (thoracic outlet syndrome).",
  },
  {
    id: "axillary-brachial-L", label: "Axillary → Brachial A. (Left)", radius: 0.024,
    points: [[-1.18,3.86,0.1],[-1.32,3.65,0.06],[-1.42,3.35,0.02],[-1.55,2.9,0.1],[-1.7,2.2,0.08]],
    info: "Axillary artery (1st rib → teres major): 3 parts relative to pectoralis minor. Brachial artery (continues): palpable medial arm, used for BP measurement. Divides into radial + ulnar at elbow (neck of radius).",
    clinicalNote: "Axillary artery: injury in shoulder dislocation, axillary dissection. Brachial artery: injury in supracondylar fracture (risk: Volkmann's ischaemia → compartment syndrome). Absent radial pulse post supracondylar fracture = emergency.",
  },
  {
    id: "radial-A-L", label: "Radial Artery (Left)", radius: 0.016,
    points: [[-1.7,2.2,0.08],[-1.75,1.5,0.08],[-1.82,0.76,0.06],[-1.88,0.42,0.05]],
    info: "Radial artery: lateral forearm. Palpable at wrist (radial pulse, anatomical snuffbox). Continues as princeps pollicis → thumb. Used for arterial line, Allen's test, CABG (radial graft).",
    clinicalNote: "Allen's test: occlude radial + ulnar, release one — tests collateral circulation via palmar arch. Radial pulse: rate, rhythm, character, volume, radio-femoral delay. Collapsing pulse = aortic regurgitation.",
  },
  {
    id: "ulnar-A-L", label: "Ulnar Artery (Left)", radius: 0.016,
    points: [[-1.7,2.2,0.08],[-1.65,1.52,-0.04],[-1.7,0.76,-0.04],[-1.76,0.42,-0.04]],
    info: "Ulnar artery: larger of the two terminal branches. Forms superficial palmar arch (with radial superficialis). Deep branch forms deep palmar arch.",
    clinicalNote: "Ulnar artery more commonly damaged in wrist lacerations. Guyon's canal: ulnar nerve + artery pass through at wrist (distal to carpal tunnel).",
  },
  // ── Subclavian → Brachial (Right) ────────────────────────────────────────
  {
    id: "brachiocephalic", label: "Brachiocephalic Trunk", radius: 0.038,
    points: [[0.1,4.0,0.1],[0.15,4.05,0.08],[0.18,4.08,0.06]],
    info: "Brachiocephalic trunk (innominate artery): first and largest branch of aortic arch. Divides behind right sternoclavicular joint into right common carotid + right subclavian.",
    clinicalNote: "Only artery in body with no named branches except at bifurcation. Right-sided aortic arch: mirror image, brachiocephalic on left.",
  },
  {
    id: "axillary-brachial-R", label: "Axillary → Brachial A. (Right)", radius: 0.024,
    points: [[1.18,3.86,0.1],[1.32,3.65,0.06],[1.42,3.35,0.02],[1.55,2.9,0.1],[1.7,2.2,0.08]],
    info: "Axillary → brachial artery (right). Brachial pulse palpable in antecubital fossa. Site of blood pressure measurement.",
    clinicalNote: "Supracondylar fracture (most common elbow fracture in children): risk of brachial artery + anterior interosseous nerve injury. Volkmann's ischaemic contracture if missed.",
  },
  {
    id: "radial-A-R", label: "Radial Artery (Right)", radius: 0.016,
    points: [[1.7,2.2,0.08],[1.75,1.5,0.08],[1.82,0.76,0.06],[1.88,0.42,0.05]],
    info: "Radial artery (right): radial pulse palpable at lateral wrist.",
    clinicalNote: "Preferred site for arterial blood gas and invasive BP monitoring. Radial artery graft in CABG (long-term patency similar to IMA).",
  },
  // ── Visceral branches ─────────────────────────────────────────────────────
  {
    id: "celiac", label: "Celiac Trunk (T12)", radius: 0.028,
    points: [[0.0,2.42,-0.2],[0.08,2.42,0.04],[0.18,2.42,0.12]],
    info: "Celiac trunk (T12, foregut): 3 branches — left gastric, splenic, hepatic. Supplies: stomach, spleen, liver, proximal duodenum, pancreas.",
    clinicalNote: "Celiac artery compression (median arcuate ligament syndrome): postprandial pain in young thin females. 'Mesenteric angina'. Celiac axis block: pain relief in pancreatic cancer.",
  },
  {
    id: "sma", label: "Superior Mesenteric Artery (L1)", radius: 0.026,
    points: [[0.0,2.22,-0.2],[0.06,2.2,0.06],[0.14,2.08,0.12]],
    info: "SMA (L1, midgut): supplies small bowel (distal duodenum to 2/3 transverse colon). Branches: inferior pancreaticoduodenal, jejunal, ileal, ileocolic, right colic, middle colic.",
    clinicalNote: "SMA syndrome: third part of duodenum compressed between SMA and aorta (narrow angle) → bilious vomiting. Acute mesenteric ischaemia: SMA embolus (AF) → 'pain out of proportion to signs', high mortality.",
  },
  {
    id: "renals", label: "Renal Arteries", radius: 0.022,
    points: [[0.0,2.02,-0.2],[0.5,2.0,-0.08]],
    info: "Renal arteries: L1-L2. Right longer (crosses IVC). Left: shorter. Each kidney: single artery (accessory in 30%). End arteries — infarction = wedge-shaped cortical infarct.",
    clinicalNote: "Renal artery stenosis: fibromuscular dysplasia (young women) vs atherosclerosis (elderly). Secondary hypertension. Renal bruit. ACE inhibitor → acute renal failure in bilateral RAS.",
  },
  // ── Iliac → Femoral ───────────────────────────────────────────────────────
  {
    id: "iliac-femoral-L", label: "Iliac → Femoral A. (Left)", radius: 0.03,
    points: [[0.0,1.22,-0.15],[-0.26,0.88,-0.08],[-0.42,0.72,0.02],[-0.52,0.58,0.06],[-0.56,0.28,0.04],[-0.56,-0.38,0.02],[-0.56,-0.72,0.0]],
    info: "Common iliac (L4 bifurcation) → external iliac → common femoral (below inguinal ligament). Femoral artery: palpable at mid-inguinal point (midway between ASIS and pubic symphysis).",
    clinicalNote: "Peripheral arterial disease: femoral pulse assessment. ABI <0.9 = PAD. Leriche syndrome: aortoiliac occlusion → buttock claudication + impotence + absent femoral pulses. Femoral artery: most used for cardiac catheterisation.",
  },
  {
    id: "popliteal-tibial-L", label: "Popliteal → Tibial (Left)", radius: 0.022,
    points: [[-0.56,-0.72,0.0],[-0.54,-1.32,-0.1],[-0.52,-1.72,-0.2],[-0.5,-2.22,0.08],[-0.5,-2.62,0.14]],
    info: "Popliteal artery (posterior knee): most common aneurysm (bilateral in 50%). Anterior tibial → dorsalis pedis (dorsum of foot). Posterior tibial → medial malleolus → sole of foot.",
    clinicalNote: "Popliteal aneurysm: presents with distal ischaemia, not rupture (unlike AAA). Dorsalis pedis + posterior tibial pulses: assess in peripheral vascular disease. Critical ischaemia: 6 Ps — Pain, Pallor, Pulselessness, Paraesthesia, Paralysis, Perishingly cold.",
  },
  {
    id: "iliac-femoral-R", label: "Iliac → Femoral A. (Right)", radius: 0.03,
    points: [[0.0,1.22,-0.15],[0.26,0.88,-0.08],[0.42,0.72,0.02],[0.52,0.58,0.06],[0.56,0.28,0.04],[0.56,-0.38,0.02],[0.56,-0.72,0.0]],
    info: "Right iliac → femoral artery. Femoral pulse assessed at mid-inguinal point.",
    clinicalNote: "Femoral artery access: used for PCI, TAVI, angiography. Complication: haematoma, pseudoaneurysm, AV fistula.",
  },
  {
    id: "popliteal-tibial-R", label: "Popliteal → Tibial (Right)", radius: 0.022,
    points: [[0.56,-0.72,0.0],[0.54,-1.32,-0.1],[0.52,-1.72,-0.2],[0.5,-2.22,0.08],[0.5,-2.62,0.14]],
    info: "Right popliteal → anterior tibial (dorsalis pedis) + posterior tibial arteries.",
    clinicalNote: "Popliteal pulse: deep, palpated in prone position with knee slightly flexed. Difficult to feel → popliteal aneurysm or Baker's cyst.",
  },
];

// ── Muscle data ───────────────────────────────────────────────────────────────
const MUSCLE_DATA: Array<{
  id: string; label: string; color: string;
  position: [number, number, number]; rotation?: [number, number, number];
  geometry: "capsule" | "box"; size: number[];
  originPos: [number, number, number]; insertionPos: [number, number, number];
  info: string; nerve: string;
}> = [
  { id: "deltoid-L", label: "Deltoid (Left)", color: "#cc5544", position: [-1.38,3.75,0.06], rotation:[0,0,0.28], geometry:"capsule", size:[0.25,0.9,4,10], originPos:[-0.85,4.05,0.05], insertionPos:[-1.68,3.22,0.08], info: "Deltoid: abduction of arm (middle), flexion (anterior), extension (posterior). Origin: lateral clavicle, acromion, spine of scapula. Insertion: deltoid tuberosity.", nerve: "Axillary nerve (C5, C6)" },
  { id: "deltoid-R", label: "Deltoid (Right)", color: "#cc5544", position: [1.38,3.75,0.06], rotation:[0,0,-0.28], geometry:"capsule", size:[0.25,0.9,4,10], originPos:[0.85,4.05,0.05], insertionPos:[1.68,3.22,0.08], info: "Deltoid: prime mover of arm abduction. Paralysis → loss of shoulder contour (flat shoulder).", nerve: "Axillary nerve (C5, C6)" },
  { id: "biceps-L", label: "Biceps Brachii (Left)", color: "#c04040", position: [-1.48,2.92,0.14], rotation:[0,0,0.22], geometry:"capsule", size:[0.22,1.1,4,10], originPos:[-1.1,3.85,0.08], insertionPos:[-1.72,2.2,0.14], info: "Biceps brachii: elbow flexion (most powerful), supination. Two heads: long (supraglenoid tubercle), short (coracoid process). Tested by resisted elbow flexion with supination.", nerve: "Musculocutaneous nerve (C5, C6)" },
  { id: "biceps-R", label: "Biceps Brachii (Right)", color: "#c04040", position: [1.48,2.92,0.14], rotation:[0,0,-0.22], geometry:"capsule", size:[0.22,1.1,4,10], originPos:[1.1,3.85,0.08], insertionPos:[1.72,2.2,0.14], info: "Biceps brachii: elbow flexion + supination. Long head tendon: rupture → 'Popeye' deformity.", nerve: "Musculocutaneous nerve (C5, C6)" },
  { id: "triceps-L", label: "Triceps (Left)", color: "#aa3838", position: [-1.5,2.9,-0.1], rotation:[0,0,0.22], geometry:"capsule", size:[0.22,1.1,4,10], originPos:[-1.12,3.7,-0.18], insertionPos:[-1.72,2.2,-0.08], info: "Triceps brachii: sole extensor of elbow. 3 heads: long (infraglenoid), lateral, medial. Radial nerve supply through spiral groove.", nerve: "Radial nerve (C6-C8)" },
  { id: "triceps-R", label: "Triceps (Right)", color: "#aa3838", position: [1.5,2.9,-0.1], rotation:[0,0,-0.22], geometry:"capsule", size:[0.22,1.1,4,10], originPos:[1.12,3.7,-0.18], insertionPos:[1.72,2.2,-0.08], info: "Triceps: elbow extension. Rarely paralysed alone. Lost with radial nerve at axilla (not spiral groove).", nerve: "Radial nerve (C6-C8)" },
  { id: "pectoralis-maj", label: "Pectoralis Major", color: "#bb4444", position: [0,3.55,0.42], geometry:"box", size:[1.9,1.1,0.24], originPos:[0,4.05,0.42], insertionPos:[0,3.1,0.42], info: "Pectoralis major: adduction, medial rotation, flexion of humerus. Sternocostal head: extends from flexed position. Clavicular head: flexion. Absent in Poland syndrome.", nerve: "Medial + lateral pectoral nerves (C5-T1)" },
  { id: "rectus-abdominis", label: "Rectus Abdominis", color: "#bb3333", position: [0,2.15,0.45], geometry:"box", size:[0.72,1.9,0.18], originPos:[0,1.08,0.45], insertionPos:[0,3.05,0.45], info: "Rectus abdominis: trunk flexion. Enclosed in rectus sheath. Tendinous intersections: 3 (at umbilicus, xiphoid, midway). Arcuate line: below = posterior sheath absent.", nerve: "Thoracoabdominal nerves (T7-T12)" },
  { id: "quad-L", label: "Quadriceps (Left)", color: "#c05050", position: [-0.56,0.06,0.14], geometry:"capsule", size:[0.3,1.45,4,12], originPos:[-0.6,0.96,0.08], insertionPos:[-0.55,-0.92,0.2], info: "Quadriceps femoris: 4 heads (rectus femoris, vastus medialis, lateralis, intermedius). Knee extension. Rectus femoris also hip flexion (only 2-joint muscle). VMO: last 15° of extension — tests integrity in knee injuries.", nerve: "Femoral nerve (L2-L4)" },
  { id: "quad-R", label: "Quadriceps (Right)", color: "#c05050", position: [0.56,0.06,0.14], geometry:"capsule", size:[0.3,1.45,4,12], originPos:[0.6,0.96,0.08], insertionPos:[0.55,-0.92,0.2], info: "Quadriceps: knee extension. Vastus medialis oblique (VMO) stabilises patella. Wasting: disuse, femoral nerve palsy, quadriceps tendon rupture.", nerve: "Femoral nerve (L2-L4)" },
  { id: "hamstrings-L", label: "Hamstrings (Left)", color: "#aa3030", position: [-0.57,0.06,-0.14], geometry:"capsule", size:[0.28,1.42,4,12], originPos:[-0.62,0.9,-0.16], insertionPos:[-0.55,-0.9,-0.1], info: "Hamstrings: biceps femoris (short head: fibula, long head: medial), semitendinosus, semimembranosus. Knee flexion + hip extension. 'Sitting bones' origin = ischial tuberosity.", nerve: "Sciatic nerve (L5, S1-S2)" },
  { id: "hamstrings-R", label: "Hamstrings (Right)", color: "#aa3030", position: [0.57,0.06,-0.14], geometry:"capsule", size:[0.28,1.42,4,12], originPos:[0.62,0.9,-0.16], insertionPos:[0.55,-0.9,-0.1], info: "Hamstrings: hip extension + knee flexion. Hamstring strain: most common muscle injury in sport (sudden hip flexion with knee extended).", nerve: "Sciatic nerve (L5, S1-S2)" },
  { id: "gastrocnemius-L", label: "Gastrocnemius (Left)", color: "#b83838", position: [-0.56,-1.85,-0.12], geometry:"capsule", size:[0.24,1.2,4,10], originPos:[-0.56,-0.96,-0.18], insertionPos:[-0.56,-2.65,-0.08], info: "Gastrocnemius: 2-joint muscle (knee flexion + ankle plantarflexion). Forms calf bulk. With soleus = triceps surae → Achilles tendon.", nerve: "Tibial nerve (S1, S2)" },
  { id: "gastrocnemius-R", label: "Gastrocnemius (Right)", color: "#b83838", position: [0.56,-1.85,-0.12], geometry:"capsule", size:[0.24,1.2,4,10], originPos:[0.56,-0.96,-0.18], insertionPos:[0.56,-2.65,-0.08], info: "Gastrocnemius: plantarflexion. Simmonds test: squeeze calf → absent plantarflexion = Achilles tendon rupture.", nerve: "Tibial nerve (S1, S2)" },
  { id: "gluteus-max-L", label: "Gluteus Maximus (Left)", color: "#c04848", position: [-0.62,0.75,-0.25], rotation:[0.35,0,0.1], geometry:"box", size:[0.75,0.62,0.32], originPos:[-0.55,1.38,-0.35], insertionPos:[-0.62,0.22,-0.18], info: "Gluteus maximus: most powerful hip extensor. Gluteal tuberosity + IT band. Essential for rising from sitting, climbing stairs.", nerve: "Inferior gluteal nerve (L5, S1-S2)" },
  { id: "gluteus-max-R", label: "Gluteus Maximus (Right)", color: "#c04848", position: [0.62,0.75,-0.25], rotation:[0.35,0,-0.1], geometry:"box", size:[0.75,0.62,0.32], originPos:[0.55,1.38,-0.35], insertionPos:[0.62,0.22,-0.18], info: "Gluteus maximus: hip extension + lateral rotation. Trendelenburg gait if weak (superior gluteal nerve) vs waddling gait (bilateral gluteal weakness).", nerve: "Inferior gluteal nerve (L5, S1-S2)" },
];

// ── Tube geometry helper ──────────────────────────────────────────────────────
function useTubeGeometry(pts: [number, number, number][], radius: number) {
  return useMemo(() => {
    try {
      const vecs = pts.map(([x, y, z]) => new THREE.Vector3(x, y, z));
      const curve = new THREE.CatmullRomCurve3(vecs);
      return new THREE.TubeGeometry(curve, Math.max(pts.length * 3, 12), radius, 6, false);
    } catch { return null; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ── Nerve Tube ────────────────────────────────────────────────────────────────
function NerveTube({ path, isMobile, onSelect }: {
  path: typeof NERVE_PATHS[0]; isMobile: boolean;
  onSelect: (i: SelectedInfo) => void;
}) {
  const geo = useTubeGeometry(path.points, path.radius);
  const [hovered, setHovered] = useState(false);
  if (!geo) return null;
  return (
    <mesh
      geometry={geo}
      onClick={(e) => { e.stopPropagation(); onSelect({ label: path.label, type: "nerve", info: path.info, clinicalNote: path.clinicalNote }); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); if (!isMobile) document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); if (!isMobile) document.body.style.cursor = "auto"; }}
    >
      <meshStandardMaterial
        color={hovered ? "#ffffff" : path.color}
        emissive={path.color} emissiveIntensity={hovered ? 0.6 : 0.3}
        roughness={0.5} metalness={0}
      />
    </mesh>
  );
}

// ── Artery Tube ───────────────────────────────────────────────────────────────
function ArteryTube({ path, isMobile, onSelect }: {
  path: typeof ARTERY_PATHS[0]; isMobile: boolean;
  onSelect: (i: SelectedInfo) => void;
}) {
  const geo = useTubeGeometry(path.points, path.radius);
  const [hovered, setHovered] = useState(false);
  if (!geo) return null;
  return (
    <mesh
      geometry={geo}
      onClick={(e) => { e.stopPropagation(); onSelect({ label: path.label, type: "artery", info: path.info, clinicalNote: path.clinicalNote }); }}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); if (!isMobile) document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { setHovered(false); if (!isMobile) document.body.style.cursor = "auto"; }}
    >
      <meshStandardMaterial
        color={hovered ? "#ff9999" : "#dd1111"}
        emissive="#aa0000" emissiveIntensity={hovered ? 0.5 : 0.25}
        roughness={0.4} metalness={0.1}
      />
    </mesh>
  );
}

// ── Muscle Segment ────────────────────────────────────────────────────────────
function MuscleSegment({ m, isMobile, onSelect }: {
  m: typeof MUSCLE_DATA[0]; isMobile: boolean;
  onSelect: (i: SelectedInfo) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group>
      <mesh
        position={m.position}
        rotation={m.rotation ? m.rotation as any : [0,0,0]}
        onClick={(e) => { e.stopPropagation(); onSelect({ label: m.label, type: "muscle", info: `${m.info} Nerve supply: ${m.nerve}` }); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); if (!isMobile) document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); if (!isMobile) document.body.style.cursor = "auto"; }}
      >
        {m.geometry === "capsule"
          ? <capsuleGeometry args={[m.size[0], m.size[1], m.size[2] as any, m.size[3] as any]} />
          : <boxGeometry args={[m.size[0], m.size[1], m.size[2]]} />
        }
        <meshStandardMaterial
          color={hovered ? "#ff9988" : m.color}
          emissive={m.color} emissiveIntensity={hovered ? 0.4 : 0.1}
          transparent opacity={hovered ? 0.82 : 0.55}
          roughness={0.7} metalness={0}
        />
      </mesh>
      {/* Origin (red dot) */}
      <mesh position={m.originPos}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#ff2222" emissive="#cc0000" emissiveIntensity={0.5} />
      </mesh>
      {/* Insertion (blue dot) */}
      <mesh position={m.insertionPos}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color="#2266ff" emissive="#0044cc" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ── Lesion Marker ─────────────────────────────────────────────────────────────
function LesionMarker({ m, isMobile, onSelect }: {
  m: typeof LESION_MARKERS[0]; isMobile: boolean;
  onSelect: (i: SelectedInfo) => void;
}) {
  const dotRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const t = useRef(Math.random() * Math.PI * 2);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    t.current += delta;
    if (dotRef.current) dotRef.current.scale.setScalar(1 + Math.sin(t.current * 3.5) * 0.3);
    if (ringRef.current) {
      const p = (t.current * 0.6) % 1;
      ringRef.current.scale.setScalar(1 + p * 2.5);
      (ringRef.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.65 - p * 0.65);
    }
  });

  return (
    <group position={m.position}>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.14, 0.02, 8, 24]} />
        <meshStandardMaterial color={m.color} transparent opacity={0.6} />
      </mesh>
      <mesh
        ref={dotRef}
        onClick={(e) => { e.stopPropagation(); onSelect({ label: m.label, type: "lesion", info: m.info, clinicalNote: m.clinicalNote }); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); if (!isMobile) document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); if (!isMobile) document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[isMobile ? 0.16 : 0.12, 12, 12]} />
        <meshStandardMaterial
          color={hovered ? "#ffffff" : m.color}
          emissive={m.color} emissiveIntensity={hovered ? 1.2 : 0.8}
        />
      </mesh>
      {isMobile && (
        <mesh onClick={(e) => { e.stopPropagation(); onSelect({ label: m.label, type: "lesion", info: m.info, clinicalNote: m.clinicalNote }); }} visible={false}>
          <sphereGeometry args={[0.38, 6, 6]} />
          <meshStandardMaterial />
        </mesh>
      )}
      {hovered && (
        <Html center distanceFactor={10} position={[0, 0.28, 0]} style={{ pointerEvents: "none" }}>
          <div style={{ fontSize: "10px", lineHeight: 1.4 }} className="bg-red-900/90 text-white px-2 py-1 rounded-md whitespace-nowrap font-semibold shadow-lg border border-red-500/50">
            ⚠ {m.label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Pulsing overview marker (region explore) ──────────────────────────────────
function PulsingMarker({ position, label, index, onClick, isMobile }: {
  position: [number, number, number]; label: string; index: number;
  onClick: () => void; isMobile: boolean;
}) {
  const dotRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const t = useRef(index * 0.65);
  const [hovered, setHovered] = useState(false);
  const dotRadius = isMobile ? 0.16 : 0.1;

  useFrame((_, delta) => {
    t.current += delta;
    if (dotRef.current) dotRef.current.scale.setScalar(1 + Math.sin(t.current * 3) * 0.28);
    if (ringRef.current) {
      const p = (t.current * 0.55) % 1;
      ringRef.current.scale.setScalar(1 + p * 2.2);
      (ringRef.current.material as THREE.MeshStandardMaterial).opacity = Math.max(0, 0.7 - p * 0.7);
    }
  });

  return (
    <group position={position}>
      <mesh ref={ringRef}>
        <torusGeometry args={[dotRadius * 1.2, 0.018, 8, 24]} />
        <meshStandardMaterial color="#818cf8" transparent opacity={0.6} />
      </mesh>
      <mesh
        ref={dotRef}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); if (!isMobile) document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); if (!isMobile) document.body.style.cursor = "auto"; }}
      >
        <sphereGeometry args={[dotRadius, 12, 12]} />
        <meshStandardMaterial color={hovered ? "#ffffff" : "#818cf8"} emissive={hovered ? "#6366f1" : "#4338ca"} emissiveIntensity={hovered ? 1.2 : 0.8} />
      </mesh>
      {(isMobile || hovered) && (
        <Html center distanceFactor={10} position={[0, dotRadius + 0.22, 0]} style={{ pointerEvents: "none" }}>
          <div style={{ fontSize: "10px", lineHeight: 1.4 }} className="bg-black/85 text-white px-2 py-1 rounded-md whitespace-nowrap font-medium shadow-lg border border-white/10">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Bone Layer ────────────────────────────────────────────────────────────────
function BoneLayer({ opacity }: { opacity: number }) {
  const o = opacity;
  const bone = { color: "#ddd5be", transparent: true, opacity: o, roughness: 0.55, metalness: 0.08, emissive: "#a89878" as string, emissiveIntensity: 0.18 };
  const cartilage = { color: "#aac4d4", transparent: true, opacity: o * 0.85, roughness: 0.4, metalness: 0.0, emissive: "#6699aa" as string, emissiveIntensity: 0.12 };
  const dark = { color: "#000000" };
  return (
    <group>
      <mesh position={[0, 5.55, 0]}><sphereGeometry args={[0.72, 24, 18]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[-0.23, 5.5, 0.58]}><sphereGeometry args={[0.155, 10, 10]} /><meshStandardMaterial {...dark} /></mesh>
      <mesh position={[0.23, 5.5, 0.58]}><sphereGeometry args={[0.155, 10, 10]} /><meshStandardMaterial {...dark} /></mesh>
      <mesh position={[0, 5.2, 0.66]}><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial {...dark} /></mesh>
      <mesh position={[-0.58, 5.38, 0.3]} rotation={[0, 0.35, 0.1]}><capsuleGeometry args={[0.05, 0.5, 4, 6]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[0.58, 5.38, 0.3]} rotation={[0, -0.35, -0.1]}><capsuleGeometry args={[0.05, 0.5, 4, 6]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[0, 5.0, 0.44]}><boxGeometry args={[0.62, 0.38, 0.38]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[0, 4.74, 0.36]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.55, 0.16, 0.32]} /><meshStandardMaterial {...bone} /></mesh>
      {[4.42, 4.28, 4.14, 4.0, 3.86, 3.74, 3.62].map((y, i) => (
        <mesh key={i} position={[0, y, -0.06]}><cylinderGeometry args={[0.17 - i * 0.004, 0.19 - i * 0.004, 0.1, 8]} /><meshStandardMaterial {...bone} /></mesh>
      ))}
      <mesh position={[-0.74, 4.08, 0.12]} rotation={[0.05, 0.22, 0.15]}><capsuleGeometry args={[0.06, 1.0, 4, 8]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[0.74, 4.08, 0.12]} rotation={[0.05, -0.22, -0.15]}><capsuleGeometry args={[0.06, 1.0, 4, 8]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[-1.1, 3.65, -0.42]} rotation={[0.18, 0.18, 0.12]}><boxGeometry args={[0.82, 0.88, 0.08]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[1.1, 3.65, -0.42]} rotation={[0.18, -0.18, -0.12]}><boxGeometry args={[0.82, 0.88, 0.08]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[0, 3.75, 0.46]}><boxGeometry args={[0.26, 0.42, 0.1]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[0, 3.2, 0.47]}><boxGeometry args={[0.2, 0.95, 0.09]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[0, 2.7, 0.46]}><coneGeometry args={[0.08, 0.22, 6]} /><meshStandardMaterial {...cartilage} /></mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[0, 3.9 - i * 0.16, -0.42]}><cylinderGeometry args={[0.16, 0.18, 0.12, 8]} /><meshStandardMaterial {...bone} /></mesh>
      ))}
      {[3.88, 3.72, 3.56, 3.4, 3.24, 3.08, 2.92, 2.76, 2.62, 2.5, 2.4, 2.3].map((y, i) => (
        <mesh key={i} position={[0, y, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.82 - i * 0.038, i < 10 ? 0.042 : 0.032, 6, 20, i < 10 ? Math.PI : Math.PI * 0.65]} />
          <meshStandardMaterial {...bone} />
        </mesh>
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <mesh key={i} position={[0, 2.15 - i * 0.18, -0.28]}><cylinderGeometry args={[0.22, 0.24, 0.14, 8]} /><meshStandardMaterial {...bone} /></mesh>
      ))}
      <mesh position={[0, 1.22, -0.24]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.48, 0.72, 0.28]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[0, 0.82, -0.1]} rotation={[0.5, 0, 0]}><coneGeometry args={[0.07, 0.28, 6]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[-0.9, 1.58, -0.08]} rotation={[0.08, 0, -0.28]}><boxGeometry args={[0.88, 0.72, 0.18]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[0.9, 1.58, -0.08]} rotation={[0.08, 0, 0.28]}><boxGeometry args={[0.88, 0.72, 0.18]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[-0.72, 0.98, 0.04]}><sphereGeometry args={[0.2, 10, 10]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[0.72, 0.98, 0.04]}><sphereGeometry args={[0.2, 10, 10]} /><meshStandardMaterial {...bone} /></mesh>
      <mesh position={[0, 1.08, 0.34]}><boxGeometry args={[0.52, 0.26, 0.18]} /><meshStandardMaterial {...cartilage} /></mesh>
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh position={[side * 1.5, 3.08, 0]} rotation={[0, 0, side * 0.24]}><capsuleGeometry args={[0.14, 1.5, 4, 10]} /><meshStandardMaterial {...bone} /></mesh>
          <mesh position={[side * 1.72, 2.18, 0]}><sphereGeometry args={[0.17, 10, 10]} /><meshStandardMaterial {...cartilage} /></mesh>
          <mesh position={[side * 1.8, 1.48, 0.07]} rotation={[0, 0, side * 0.12]}><capsuleGeometry args={[0.08, 1.08, 4, 8]} /><meshStandardMaterial {...bone} /></mesh>
          <mesh position={[side * 1.68, 1.48, -0.07]} rotation={[0, 0, side * 0.14]}><capsuleGeometry args={[0.075, 1.12, 4, 8]} /><meshStandardMaterial {...bone} /></mesh>
          <mesh position={[side * 1.88, 0.74, 0]}><sphereGeometry args={[0.15, 8, 8]} /><meshStandardMaterial {...bone} /></mesh>
          <mesh position={[side * 1.9, 0.46, 0]}><boxGeometry args={[0.32, 0.28, 0.12]} /><meshStandardMaterial {...bone} /></mesh>
          {[-0.12, -0.06, 0, 0.06, 0.12].map((xOff, i) => (
            <mesh key={i} position={[side * (1.9 - xOff * side * 0.8), 0.3 - Math.abs(xOff) * 0.8, 0]} rotation={[0, 0, side * 0.1]}>
              <capsuleGeometry args={[0.025, 0.22, 4, 6]} /><meshStandardMaterial {...bone} />
            </mesh>
          ))}
        </group>
      ))}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <mesh position={[side * 0.6, 0.96, 0.06]}><sphereGeometry args={[0.22, 12, 12]} /><meshStandardMaterial {...cartilage} /></mesh>
          <mesh position={[side * 0.56, 0.06, 0.04]}><capsuleGeometry args={[0.18, 1.5, 4, 12]} /><meshStandardMaterial {...bone} /></mesh>
          <mesh position={[side * 0.56, -0.88, 0.22]}><sphereGeometry args={[0.12, 8, 8]} /><meshStandardMaterial {...bone} /></mesh>
          <mesh position={[side * 0.56, -0.96, 0.04]}><sphereGeometry args={[0.2, 10, 10]} /><meshStandardMaterial {...cartilage} /></mesh>
          <mesh position={[side * 0.5, -1.84, 0.02]}><capsuleGeometry args={[0.13, 1.5, 4, 10]} /><meshStandardMaterial {...bone} /></mesh>
          <mesh position={[side * 0.72, -1.84, -0.02]}><capsuleGeometry args={[0.065, 1.48, 4, 8]} /><meshStandardMaterial {...bone} /></mesh>
          <mesh position={[side * 0.56, -2.66, 0.04]}><sphereGeometry args={[0.15, 8, 8]} /><meshStandardMaterial {...cartilage} /></mesh>
          <mesh position={[side * 0.56, -2.82, -0.18]}><boxGeometry args={[0.28, 0.2, 0.52]} /><meshStandardMaterial {...bone} /></mesh>
          {[-0.1, -0.05, 0, 0.05, 0.1].map((xOff, i) => (
            <mesh key={i} position={[side * (0.56 + xOff * 0.5), -2.86, 0.22 + i * 0.04]} rotation={[0.22, 0, 0]}>
              <capsuleGeometry args={[0.03, 0.38, 4, 6]} /><meshStandardMaterial {...bone} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ── Skin Layer ────────────────────────────────────────────────────────────────
function SkinLayer({ opacity }: { opacity: number }) {
  const skin = { color: "#d4a882", transparent: true, opacity: opacity * 0.18, roughness: 0.85, metalness: 0, side: THREE.DoubleSide };
  return (
    <group>
      <mesh position={[0, 5.55, 0]}><sphereGeometry args={[0.88, 20, 16]} /><meshStandardMaterial {...skin} /></mesh>
      <mesh position={[0, 4.45, 0]}><capsuleGeometry args={[0.36, 0.65, 4, 10]} /><meshStandardMaterial {...skin} /></mesh>
      <mesh position={[0, 3.1, 0]}><capsuleGeometry args={[0.92, 2.4, 4, 16]} /><meshStandardMaterial {...skin} /></mesh>
      <mesh position={[0, 1.8, 0]}><capsuleGeometry args={[0.72, 1.5, 4, 14]} /><meshStandardMaterial {...skin} /></mesh>
      {([-1, 1] as const).map((s) => (
        <group key={s}>
          <mesh position={[s * 1.5, 3.1, 0]} rotation={[0, 0, s * 0.22]}><capsuleGeometry args={[0.35, 1.5, 4, 10]} /><meshStandardMaterial {...skin} /></mesh>
          <mesh position={[s * 1.78, 1.5, 0]} rotation={[0, 0, s * 0.13]}><capsuleGeometry args={[0.28, 1.1, 4, 8]} /><meshStandardMaterial {...skin} /></mesh>
          <mesh position={[s * 0.58, 0.1, 0]}><capsuleGeometry args={[0.42, 1.5, 4, 12]} /><meshStandardMaterial {...skin} /></mesh>
          <mesh position={[s * 0.56, -1.85, 0]}><capsuleGeometry args={[0.32, 1.5, 4, 10]} /><meshStandardMaterial {...skin} /></mesh>
        </group>
      ))}
    </group>
  );
}

// ── Region highlight ──────────────────────────────────────────────────────────
function RegionHighlight({ center, size, opacity }: { center: [number,number,number]; size: [number,number,number]; opacity: number }) {
  const fillRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!fillRef.current) return;
    const mat = fillRef.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.25 + Math.sin(clock.elapsedTime * 2.2) * 0.15;
    mat.opacity = opacity * (0.1 + Math.sin(clock.elapsedTime * 2.2) * 0.04);
  });
  return (
    <group position={center}>
      <mesh ref={fillRef}><boxGeometry args={size} /><meshStandardMaterial color="#6366f1" emissive="#4f46e5" emissiveIntensity={0.3} transparent opacity={0.1} side={THREE.DoubleSide} /></mesh>
      <mesh><boxGeometry args={[size[0]+0.04, size[1]+0.04, size[2]+0.04]} /><meshStandardMaterial color="#a5b4fc" wireframe transparent opacity={opacity * 0.55} /></mesh>
    </group>
  );
}

// ── Camera Controller ─────────────────────────────────────────────────────────
function CameraController({ phase, phaseRef, overviewCam, detailCam, overviewLookAt, controlsRef, onTransitionDone }: {
  phase: ViewPhase; phaseRef: React.MutableRefObject<ViewPhase>;
  overviewCam: THREE.Vector3; detailCam: THREE.Vector3; overviewLookAt: THREE.Vector3;
  controlsRef: React.RefObject<any>; onTransitionDone: () => void;
}) {
  const { camera } = useThree();
  const arrived = useRef(false);
  phaseRef.current = phase;
  useFrame((_, delta) => {
    const p = phaseRef.current;
    if (p === "overview") {
      camera.position.lerp(overviewCam, delta * 2.5);
      if (controlsRef.current) { controlsRef.current.target.lerp(overviewLookAt, delta * 2.5); controlsRef.current.update(); }
      arrived.current = false;
    } else if (p === "transitioning") {
      camera.position.lerp(detailCam, delta * 1.8);
      if (controlsRef.current) { controlsRef.current.target.lerp(new THREE.Vector3(0, 0, 0), delta * 1.8); controlsRef.current.update(); }
      if (!arrived.current && camera.position.distanceTo(detailCam) < 0.3) {
        arrived.current = true;
        camera.position.copy(detailCam);
        if (controlsRef.current) { controlsRef.current.target.set(0, 0, 0); controlsRef.current.update(); }
        onTransitionDone();
      }
    }
  });
  return null;
}

// ── Anatomy Mesh (detail mode) ────────────────────────────────────────────────
function AnatomyMesh({ part, selected, onSelect, isMobile }: {
  part: AnatomyPart; selected: boolean; onSelect: (p: AnatomyPart | null) => void; isMobile: boolean;
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
      case "sphere":   return new THREE.SphereGeometry(s[0], s[2]??16, s[3]??16);
      case "cylinder": return new THREE.CylinderGeometry(s[0], s[1], s[2], s[3]??12);
      case "box":      return new THREE.BoxGeometry(s[0], s[1], s[2]);
      case "torus":    return new THREE.TorusGeometry(s[0], s[1], s[2]??16, s[3]??8);
      case "cone":     return new THREE.ConeGeometry(s[0], s[1], s[2]??8);
      case "capsule":  return new THREE.CapsuleGeometry(s[0], s[2], 8, 16);
      default:         return new THREE.SphereGeometry(0.5, 16, 16);
    }
  }, [part.geometry, part.size]);
  return (
    <group position={part.position} rotation={part.rotation}>
      <mesh ref={meshRef} geometry={geometry}
        onClick={(e) => { e.stopPropagation(); onSelect(selected ? null : part); }}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); if (!isMobile) document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHovered(false); if (!isMobile) document.body.style.cursor = "auto"; }} castShadow>
        <meshStandardMaterial color={hovered||selected?"#ffffff":part.color} emissive={selected?part.emissiveColor??part.color:hovered?part.color:"#000000"} emissiveIntensity={selected?0.6:hovered?0.3:0} transparent opacity={hovered||selected?1.0:0.88} roughness={0.4} metalness={0.1} />
      </mesh>
      {(hovered || selected) && (
        <Html position={[0, (part.size[1]??part.size[0])*0.7+0.2, 0]} center distanceFactor={12} occlude={false}>
          <div className={`px-2 py-0.5 rounded font-semibold whitespace-nowrap pointer-events-none select-none ${selected?"bg-white text-black shadow-lg":"bg-white/90 text-black shadow"}`} style={{ fontSize: "10px", lineHeight: "1.4" }}>{part.label}</div>
        </Html>
      )}
    </group>
  );
}

function SceneGroup({ scene, selectedPart, onSelect, autoRotate, isMobile }: {
  scene: AnatomyScene; selectedPart: AnatomyPart | null;
  onSelect: (p: AnatomyPart | null) => void; autoRotate: boolean; isMobile: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (groupRef.current && autoRotate) groupRef.current.rotation.y += delta * 0.25; });
  return (
    <group ref={groupRef}>
      {scene.parts.map((part) => (
        <AnatomyMesh key={part.id} part={part} selected={selectedPart?.id === part.id} onSelect={onSelect} isMobile={isMobile} />
      ))}
    </group>
  );
}

// ── Layer Toggle UI ───────────────────────────────────────────────────────────
const LAYER_CONFIG = [
  { key: "skin"     as const, icon: "👤", label: "Skin",     color: "#d4a882" },
  { key: "muscles"  as const, icon: "💪", label: "Muscles",  color: "#cc5544" },
  { key: "nerves"   as const, icon: "⚡", label: "Nerves",   color: "#ffdd44" },
  { key: "arteries" as const, icon: "🩸", label: "Arteries", color: "#dd1111" },
  { key: "bones"    as const, icon: "🦴", label: "Bones",    color: "#ddd5be" },
];

function LayerControls({ layers, setLayers, isMobile }: {
  layers: LayerState;
  setLayers: React.Dispatch<React.SetStateAction<LayerState>>;
  isMobile: boolean;
}) {
  return (
    <div className={`absolute ${isMobile ? "top-3 left-1/2 -translate-x-1/2 flex-row gap-1.5" : "top-1/2 -translate-y-1/2 right-3 flex-col gap-2"} flex z-10`}>
      {LAYER_CONFIG.map((l) => {
        const active = layers[l.key];
        return (
          <button
            key={l.key}
            onClick={() => setLayers((prev) => ({ ...prev, [l.key]: !prev[l.key] }))}
            title={l.label}
            className={`flex ${isMobile ? "flex-col items-center px-2 py-1.5 min-w-[48px]" : "flex-row items-center gap-2 px-3 py-2 min-w-[110px]"} rounded-xl text-xs font-semibold transition-all shadow-lg border ${
              active
                ? "bg-white/15 border-white/40 text-white scale-105"
                : "bg-black/50 border-white/10 text-white/40 hover:text-white/70 hover:bg-black/60"
            }`}
            style={{ borderLeftColor: active ? l.color : undefined, borderLeftWidth: active && !isMobile ? "3px" : undefined }}
          >
            <span className={isMobile ? "text-base" : "text-sm"}>{l.icon}</span>
            <span className={isMobile ? "text-[9px] mt-0.5" : ""}>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Info Panel ────────────────────────────────────────────────────────────────
function InfoPanel({ info, onClose }: { info: NonNullable<SelectedInfo>; onClose: () => void }) {
  const typeColors: Record<string, string> = {
    nerve: "text-yellow-400", artery: "text-red-400", muscle: "text-rose-300",
    bone: "text-amber-200", lesion: "text-red-500",
  };
  const typeLabels: Record<string, string> = {
    nerve: "Nerve", artery: "Artery", muscle: "Muscle", bone: "Bone", lesion: "⚠ Lesion Point",
  };
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/92 backdrop-blur border-t border-white/10 animate-in slide-in-from-bottom z-20">
      <div className="max-w-2xl mx-auto p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <span className={`text-xs font-bold uppercase tracking-wider ${typeColors[info.type] ?? "text-gray-400"}`}>
              {typeLabels[info.type] ?? info.type}
            </span>
            <h3 className="text-white font-bold text-sm mt-0.5">{info.label}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none shrink-0 p-1 -m-1">✕</button>
        </div>
        <p className="text-gray-300 text-xs leading-relaxed mb-2">{info.info}</p>
        {info.clinicalNote && (
          <div className="bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-3 py-2">
            <p className="text-yellow-300 text-xs font-semibold mb-0.5">NEET PG Clinical Pearl</p>
            <p className="text-yellow-100 text-xs leading-relaxed">{info.clinicalNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────
function Legend({ isMobile }: { isMobile: boolean }) {
  if (isMobile) return null;
  return (
    <div className="absolute bottom-3 left-3 flex flex-col gap-1 bg-black/60 backdrop-blur rounded-xl px-3 py-2 border border-white/10 z-10">
      <p className="text-white/50 text-[9px] font-bold uppercase tracking-widest mb-0.5">Legend</p>
      {[
        { color: "#ffdd44", label: "Nerve pathway" },
        { color: "#dd1111", label: "Artery" },
        { color: "#ff4444", label: "Lesion / Injury point" },
        { color: "#cc5544", label: "Muscle (🔴 origin · 🔵 insertion)" },
      ].map((l) => (
        <div key={l.label} className="flex items-center gap-2">
          <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: l.color }} />
          <span className="text-white/60 text-[9px]">{l.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main AnatomyViewer ────────────────────────────────────────────────────────
export default function AnatomyViewer({ scene, onPhaseChange }: {
  scene: AnatomyScene; onPhaseChange?: (phase: ViewPhase) => void;
}) {
  const [phase, setPhase] = useState<ViewPhase>("overview");
  const phaseRef = useRef<ViewPhase>("overview");
  const [selectedPart, setSelectedPart] = useState<AnatomyPart | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<SelectedInfo>(null);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [layers, setLayers] = useState<LayerState>({
    skin: false, muscles: false, nerves: true, arteries: true, bones: true,
  });
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const region = getRegion(scene.chapterKey);
  const overviewCam = useMemo(() => new THREE.Vector3(0, 1.5, isMobile ? 18 : 14), [isMobile]);
  const detailCam = useMemo(() => new THREE.Vector3(...scene.cameraPosition), [scene.cameraPosition]);
  const overviewLookAt = useMemo(() => new THREE.Vector3(...region.overviewLookAt), [region]);

  function changePhase(p: ViewPhase) { setPhase(p); onPhaseChange?.(p); }
  function handleExplore() { changePhase("transitioning"); }
  function handleTransitionDone() { changePhase("detail"); }
  function handleBackToOverview() { changePhase("overview"); setSelectedPart(null); setAutoRotate(false); }

  return (
    <div className="w-full h-full relative">
      {/* Layer toggle controls */}
      <LayerControls layers={layers} setLayers={setLayers} isMobile={isMobile} />

      <Canvas
        camera={{ position: [0, 1.5, isMobile ? 18 : 14], fov: isMobile ? 60 : 50 }}
        shadows
        style={{ background: "#000000", touchAction: "none" }}
        onPointerMissed={() => { setSelectedPart(null); setSelectedInfo(null); }}
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[2, 10, 6]} intensity={1.8} castShadow />
        <pointLight position={[0, 4, -8]} intensity={0.9} color="#4488cc" />
        <pointLight position={[-4, -3, 4]} intensity={0.4} color="#ccddee" />
        <pointLight position={[6, 2, 3]} intensity={0.35} color="#ffe0bb" />

        <CameraController
          phase={phase} phaseRef={phaseRef}
          overviewCam={overviewCam} detailCam={detailCam} overviewLookAt={overviewLookAt}
          controlsRef={controlsRef} onTransitionDone={handleTransitionDone}
        />

        {/* ── OVERVIEW layers ── */}
        {(phase === "overview" || phase === "transitioning") && (
          <>
            {layers.skin    && <SkinLayer opacity={phase === "overview" ? 1 : 0.3} />}
            {layers.bones   && <BoneLayer opacity={phase === "overview" ? 1 : 0.4} />}
            {layers.muscles && MUSCLE_DATA.map((m) => (
              <MuscleSegment key={m.id} m={m} isMobile={isMobile} onSelect={setSelectedInfo} />
            ))}
            {layers.nerves && NERVE_PATHS.map((p) => (
              <NerveTube key={p.id} path={p} isMobile={isMobile} onSelect={setSelectedInfo} />
            ))}
            {layers.nerves && phase === "overview" && LESION_MARKERS.map((m) => (
              <LesionMarker key={m.id} m={m} isMobile={isMobile} onSelect={setSelectedInfo} />
            ))}
            {layers.arteries && ARTERY_PATHS.map((p) => (
              <ArteryTube key={p.id} path={p} isMobile={isMobile} onSelect={setSelectedInfo} />
            ))}
            <RegionHighlight
              center={region.highlightCenter}
              size={region.highlightSize}
              opacity={phase === "overview" ? 1 : 0.2}
            />
          </>
        )}

        {/* ── Overview region markers ── */}
        {phase === "overview" && (
          <>
            {region.markerPositions.map((m, i) => (
              <PulsingMarker key={i} position={m.pos} label={m.label} index={i} onClick={handleExplore} isMobile={isMobile} />
            ))}
            <Html position={[...region.highlightCenter.slice(0,2) as [number,number], region.highlightSize[2]/2+0.3]} center distanceFactor={10}>
              <div className="text-xs font-bold text-indigo-300 bg-black/60 px-2 py-0.5 rounded-full whitespace-nowrap pointer-events-none">
                {region.regionLabel}
              </div>
            </Html>
          </>
        )}

        {/* ── DETAIL mode ── */}
        {phase === "detail" && (
          <SceneGroup scene={scene} selectedPart={selectedPart} onSelect={setSelectedPart} autoRotate={autoRotate} isMobile={isMobile} />
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
      {phase === "overview" && !selectedInfo && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-end pb-8 sm:pb-10">
          <div className="pointer-events-auto flex flex-col items-center gap-3">
            <p className="text-white/50 text-xs text-center px-4">
              {isMobile ? "Tap" : "Click"} nerves, arteries or ⚠ lesion points • Toggle layers →
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
          <div className="absolute top-3 left-3">
            <button onClick={handleBackToOverview} className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg bg-black/60 text-white/80 hover:text-white text-xs font-medium transition-colors hover:bg-black/80 active:bg-black/90 min-h-[36px] sm:min-h-0">
              ← Body Overview
            </button>
          </div>
          <div className="absolute top-3 right-14 sm:right-28">
            <button onClick={() => setAutoRotate((v) => !v)} className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-all shadow-lg min-h-[36px] sm:min-h-0 ${autoRotate ? "bg-primary text-primary-foreground" : "bg-black/60 text-white hover:bg-black/80"}`}>
              {autoRotate ? "⏸ Pause" : "▶ Rotate"}
            </button>
          </div>
          {!selectedPart && !selectedInfo && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
              {isMobile ? "Tap a structure • Pinch to zoom" : "Click any structure • Drag to rotate • Scroll to zoom"}
            </div>
          )}
          {selectedPart && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur border-t border-white/10 p-3 sm:p-4 animate-in slide-in-from-bottom z-20">
              <div className="flex items-start justify-between gap-3 max-w-2xl mx-auto">
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-sm mb-1">{selectedPart.label}</h3>
                  <p className="text-gray-300 text-xs leading-relaxed line-clamp-3 sm:line-clamp-none">{selectedPart.info}</p>
                </div>
                <button onClick={() => setSelectedPart(null)} className="text-gray-400 hover:text-white text-xl leading-none shrink-0 mt-0.5 p-1 -m-1" aria-label="Close">✕</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Info panel (nerve/artery/lesion/muscle click) ── */}
      {selectedInfo && <InfoPanel info={selectedInfo} onClose={() => setSelectedInfo(null)} />}

      {/* ── Legend ── */}
      {phase === "overview" && !selectedInfo && <Legend isMobile={isMobile} />}
    </div>
  );
}

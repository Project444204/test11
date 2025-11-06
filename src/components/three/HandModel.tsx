"use client";

import React, { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";

// --- AttachedRing Sub-Component ---
// This component now handles everything related to the ring.
function AttachedRing({ handScene, animating = false }: { handScene: THREE.Group; animating?: boolean }) {
  const { scene: ringScene } = useGLTF("/nenya_galadriels_ring.glb");

  // useMemo to prevent re-cloning on every render
  const ringInstance = useMemo(() => ringScene.clone(true), [ringScene]);

  // Spring animation for ring movement from initial position to finger
  const { ringPosition, ringRotation, ringScale } = useSpring({
    ringPosition: animating ? [0.27, 0.84, 0.11] : [-2, 0.5, 1.5], // Right (x+) and slightly forward (z+)
    ringRotation: animating ? [Math.PI / 2, 0, 0] : [0, 0, 0], // Rotate to fit finger
    ringScale: animating ? [28, 28, 28] : [14, 14, 14], // Smaller ring per request
    config: { tension: 80, friction: 20, duration: animating ? 2000 : 0 }
  });

  useEffect(() => {
    if (!handScene || !ringInstance) return;

    // Debug: Log all available object names
    console.log("All objects in hand model:");
    handScene.traverse((child) => {
      if (child.name) {
        console.log("- ", child.name, child.type);
      }
    });

    // Since the female_hand.glb model doesn't have the expected bone structure,
    // let's attach the ring to the main hand mesh or scene instead
    let targetBone: THREE.Object3D | null = null;
    
    // First try to find the middle finger (third finger) specifically
    handScene.traverse((child) => {
      if (!targetBone && child.name) {
        const name = child.name.toLowerCase();
        // Look for middle finger, third finger, or ring finger specifically
        if (name.includes('middle') || name.includes('ring') || 
            name.includes('finger_02') || name.includes('finger2') ||
            name.includes('finger.002') || name.includes('f_middle')) {
          targetBone = child;
          console.log(`Using middle/ring finger bone: ${child.name}`);
        }
      }
    });
    
    // If no specific finger found, try any finger
    if (!targetBone) {
      handScene.traverse((child) => {
        if (!targetBone && child.name && (
          child.name.toLowerCase().includes('finger')
        )) {
          targetBone = child;
          console.log(`Using finger bone: ${child.name}`);
        }
      });
    }
    
    // If no specific bone found, use the main scene as fallback
    if (!targetBone) {
      targetBone = handScene;
      console.log("Using main hand scene as attachment point");
    }

    // 1. Create a clean container
    const container = new THREE.Group();

    // 2. Add the ring model to the container
    container.add(ringInstance);

    // --- Compute fitted scale from finger diameter ---
    const handMeshes: THREE.Mesh[] = [];
    handScene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh && (obj as THREE.Mesh).geometry) {
        handMeshes.push(obj as THREE.Mesh);
      }
    });

    // Estimate finger direction (world space)
    const worldDir = new THREE.Vector3();
    const tipWorld = new THREE.Vector3();
    const baseWorld = new THREE.Vector3();
    targetBone.getWorldPosition(tipWorld);
    if (targetBone.parent) {
      (targetBone.parent as THREE.Object3D).getWorldPosition(baseWorld);
    } else {
      baseWorld.copy(tipWorld).add(new THREE.Vector3(0, 1, 0));
    }
    worldDir.copy(tipWorld).sub(baseWorld).normalize();

    // Build an orthonormal basis (u, v) spanning plane perpendicular to worldDir
    const arbitrary = Math.abs(worldDir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const u = new THREE.Vector3().crossVectors(worldDir, arbitrary).normalize();
    const v = new THREE.Vector3().crossVectors(worldDir, u).normalize();

    // Center of the ring sampling plane, slightly back from tip along finger
    const center = tipWorld.clone().addScaledVector(worldDir, -0.03);

    const raycaster = new THREE.Raycaster();
    const NUM_RAYS = 18;
    const FAR = 0.12; // 12 cm reach is plenty in scene units

    const diameters: number[] = [];
    for (let i = 0; i < NUM_RAYS; i++) {
      const angle = (i / NUM_RAYS) * Math.PI * 2;
      const dir = u.clone().multiplyScalar(Math.cos(angle)).add(v.clone().multiplyScalar(Math.sin(angle))).normalize();
      // +dir
      raycaster.set(center, dir);
      raycaster.far = FAR;
      const hitPlus = raycaster.intersectObjects(handMeshes, false)[0];
      // -dir
      raycaster.set(center, dir.clone().multiplyScalar(-1));
      raycaster.far = FAR;
      const hitMinus = raycaster.intersectObjects(handMeshes, false)[0];
      if (hitPlus && hitMinus) {
        const d = hitPlus.distance + hitMinus.distance;
        if (d > 0) diameters.push(d);
      }
    }

    const fittedFingerDiameter = (() => {
      if (diameters.length === 0) return 0.018; // fallback ~18 mm
      const sorted = [...diameters].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    })();

    // Measure ring model's base outer diameter in its local space
    const ringBox = new THREE.Box3().setFromObject(ringInstance);
    const ringSize = new THREE.Vector3();
    ringBox.getSize(ringSize);
    const baseOuterDiameter = Math.min(ringSize.x, ringSize.y); // assume hole axis roughly along Z

    // Desired a little clearance (slightly increased)
    const desiredOuterDiameter = fittedFingerDiameter * 9.50;
    // Compute uniform scale so that outer diameter matches desired
    let fittedScale = baseOuterDiameter > 0 ? desiredOuterDiameter / baseOuterDiameter : 28;
    // Clamp to sensible range in case of odd models
    fittedScale = THREE.MathUtils.clamp(fittedScale, 0.001, 100);

    // Compute alignment quaternion once (align ring +Z to finger direction in bone space)
    const boneWorldQuat = new THREE.Quaternion();
    targetBone.getWorldQuaternion(boneWorldQuat);
    const dirInBoneSpace = worldDir.clone().applyQuaternion(boneWorldQuat.clone().invert());
    // Flip orientation: map ring +Z to the opposite of the finger direction
    const fingerDir = dirInBoneSpace.lengthSq() > 0 ? dirInBoneSpace : new THREE.Vector3(0, 1, 0);
    const targetDir = fingerDir.clone().multiplyScalar(-1);
    const alignQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      targetDir
    );

    // Apply animated transforms to the container
    // Note: These will be updated by the spring animation
    let startTime = Date.now();
    const ANIMATION_DURATION = 2000;
    const getAnimT = () => Math.min(1, (Date.now() - startTime) / ANIMATION_DURATION);

    const updateContainer = () => {
      if (animating) {
        // During animation, use spring values
        const t = getAnimT();
        const scaleNow = THREE.MathUtils.lerp(fittedScale * 1.2, fittedScale, t); // shrink to fit
        container.scale.set(scaleNow, scaleNow, scaleNow);
        const [px, py, pz] = ringPosition.get();
        container.position.set(px, py, pz);
        // keep orientation aligned to finger while animating
        container.quaternion.copy(alignQuat);
        // read ringRotation to avoid unused-var lints (not used for orientation)
        const _rr = ringRotation.get();
        void _rr;
      } else {
        // Static final position - positioned on middle finger
        const position: [number, number, number] = [0.27, 0.84, 0.11];
        container.scale.set(fittedScale, fittedScale, fittedScale);
        container.position.set(...position);

        // Professional orientation: align ring hole axis with finger direction
        container.quaternion.copy(alignQuat);

        // 4) Add a slight roll so the gem sits level
        const rollAdjust = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), 0);
        container.quaternion.multiply(rollAdjust);
      }
    };

    updateContainer();

    // Subscribe to spring updates during animation
    let animationId: number | undefined;
    if (animating) {
      startTime = Date.now();
      // ANIMATION_DURATION defined above
      
      const animate = () => {
        updateContainer();
        // Continue animation until duration is reached
        if (Date.now() - startTime < ANIMATION_DURATION) {
          animationId = requestAnimationFrame(animate);
        }
      };
      
      // Start the animation loop
      animationId = requestAnimationFrame(animate);
    }

    // 4. Attach the container (not the ring) to the bone
    targetBone.add(container);

    // 5. Subtle finalize settle animation when not animating (Final state)
    if (!animating) {
      let settleFrame: number | undefined;
      const settleStart = Date.now();
      const settleDuration = 650; // ms
      const initialPos = container.position.clone();
      const downOffset = 0.008; // slight slide down along finger axis
      const easeOutBack = (t: number) => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
      };
      const tick = () => {
        const elapsed = Date.now() - settleStart;
        const t = Math.min(1, elapsed / settleDuration);
        const e = easeOutBack(t);
        container.position.set(
          initialPos.x,
          initialPos.y - e * downOffset,
          initialPos.z
        );
        if (t < 1) settleFrame = requestAnimationFrame(tick);
      };
      settleFrame = requestAnimationFrame(tick);
    }

    // 6. Re-center hand vertically so the ring sits near scene center
    const centerRingVertically = () => {
      try {
        const ringWorld = new THREE.Vector3();
        container.getWorldPosition(ringWorld);
        // Desired ring Y in world space (slightly above exact center for better framing)
        const desiredWorldY = 0.05;
        const deltaY = desiredWorldY - ringWorld.y;
        // Apply offset at the hand scene level (parent of container)
        handScene.position.y += deltaY;
      } catch (e) {
        // noop if any calc fails
      }
    };
    if (animating) {
      const timeoutId = setTimeout(centerRingVertically, 2100);
      // ensure cleanup
      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        clearTimeout(timeoutId);
        if (targetBone) {
          targetBone.remove(container);
        }
      };
    } else {
      centerRingVertically();
    }

    // Cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (targetBone) {
        targetBone.remove(container);
      }
    };
  }, [handScene, ringInstance, animating, ringPosition, ringRotation, ringScale]);

  return null; // This component manages an object, it doesn't render JSX directly.
}


// --- Main HandModel Component ---
const MODEL_PATH = "/female_hand.glb";

type HandModelProps = {
  attachRing?: boolean;
  animating?: boolean;
  position?: [number, number, number];
  scale?: [number, number, number];
};

export default function HandModel({ attachRing = false, animating = false, position, scale, ...props }: HandModelProps) {
  const { scene } = useGLTF(MODEL_PATH);

  // Spring animation for smooth hand movement during ring attachment
  const { position: animatedPosition, scale: animatedScale } = useSpring({
    position: animating ? [0, 0, 0] : (position || [1, 0.01, 0]),
    scale: (scale || [0.3, 0.3, 0.3]),
    config: { tension: 120, friction: 14 }
  });

  // This useEffect handles the hand's appearance (color, material)
  useEffect(() => {
    scene.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.material instanceof THREE.MeshStandardMaterial && object.material.map) {
           object.material.map.colorSpace = THREE.SRGBColorSpace;
           object.material.needsUpdate = true;
        } else {
            // If no texture, apply a base skin-like color
            object.material = new THREE.MeshStandardMaterial({ color: '#E4B59A' });
        }
      }
    });
  }, [scene]);

  return (
    <animated.group position={animatedPosition} scale={animatedScale}>
      <primitive object={scene} />
      {attachRing && <AttachedRing handScene={scene} animating={animating} />}
    </animated.group>
  );
}

useGLTF.preload(MODEL_PATH);
useGLTF.preload("/nenya_galadriels_ring.glb");



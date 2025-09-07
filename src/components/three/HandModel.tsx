"use client";

import React, { useEffect, useMemo } from "react";
import type { ThreeElements } from "@react-three/fiber";
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
  const { ringPosition, ringRotation, ringScale } = useSpring<{
    ringPosition: [number, number, number];
    ringRotation: [number, number, number];
    ringScale: [number, number, number];
  }>({
    ringPosition: animating ? [0, 0.15, 0.03] : [-2, 0.5, 1.5], // From initial position to middle finger
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

    // Apply animated transforms to the container
    // Note: These will be updated by the spring animation
    const updateContainer = () => {
      if (animating) {
        // During animation, use spring values
        const [sx, sy, sz] = ringScale.get();
        container.scale.set(sx, sy, sz);
        const [px, py, pz] = ringPosition.get();
        container.position.set(px, py, pz);
        const [rx, ry, rz] = ringRotation.get();
        container.rotation.set(rx, ry, rz);
      } else {
        // Static final position - positioned on middle finger
        const scale = 28;
        const position: [number, number, number] = [0, 0.15, 0.03];
        const rotation: [number, number, number] = [Math.PI / 2, 0, 0];
        container.scale.set(scale, scale, scale);
        container.position.set(...position);
        container.rotation.set(...rotation);
      }
    };

    updateContainer();

    // Subscribe to spring updates during animation
    let animationId: number | undefined;
    if (animating) {
      const startTime = Date.now();
      const ANIMATION_DURATION = 2000; // 2 seconds
      
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

type HandModelProps = ThreeElements["group"] & {
  attachRing?: boolean;
  animating?: boolean;
};

export default function HandModel({ attachRing = false, animating = false, ...props }: HandModelProps) {
  const { scene } = useGLTF(MODEL_PATH);

  // Spring animation for smooth hand movement during ring attachment
  const { position, scale } = useSpring<{
    position: [number, number, number];
    scale: [number, number, number];
  }>({
    position: animating ? [0, 0, 0] : ((props.position as [number, number, number]) || [1, 0.01, 0]),
    scale: animating ? [1, 1, 1] : ((props.scale as [number, number, number]) || [1, 1, 1]),
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
    <animated.group position={position} scale={scale}>
      <primitive object={scene} />
      {attachRing && <AttachedRing handScene={scene} animating={animating} />}
    </animated.group>
  );
}

useGLTF.preload(MODEL_PATH);
useGLTF.preload("/nenya_galadriels_ring.glb");



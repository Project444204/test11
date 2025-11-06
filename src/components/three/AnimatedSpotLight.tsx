"use client";

import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { SpotLight } from "three";

type AnimatedSpotLightProps = {
  isIlluminated: boolean;
  initialPosition: [number, number, number];
  targetPosition: [number, number, number];
  activeIntensity: number;
  offIntensity?: number;
  angle?: number;
  penumbra?: number;
  color?: string;
  distance?: number;
  castShadow?: boolean;
};

export default function AnimatedSpotLight({
  isIlluminated,
  initialPosition,
  targetPosition,
  activeIntensity,
  offIntensity = 0,
  angle = 0.35,
  penumbra = 1,
  color = "#ffffff",
  distance = 25,
  castShadow = true,
}: AnimatedSpotLightProps) {
  const lightRef = useRef<SpotLight | null>(null);

  useFrame(() => {
    const light = lightRef.current;
    if (!light) return;
    const [tx, ty, tz] = isIlluminated ? targetPosition : initialPosition;
    const targetIntensity = isIlluminated ? activeIntensity : offIntensity;
    // Smoothly approach target position and intensity
    light.position.x += (tx - light.position.x) * 0.12;
    light.position.y += (ty - light.position.y) * 0.12;
    light.position.z += (tz - light.position.z) * 0.12;
    light.intensity += (targetIntensity - light.intensity) * 0.18;
    // Aim at origin (hand centered near [0,0,0])
    light.target.position.set(0, 0, 0);
    light.target.updateMatrixWorld();
  });

  return (
    <spotLight
      ref={lightRef}
      position={initialPosition}
      intensity={offIntensity}
      angle={angle}
      penumbra={penumbra}
      color={color}
      distance={distance}
      castShadow={castShadow}
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-bias={-0.0001}
    />
  );
}



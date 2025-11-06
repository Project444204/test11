"use client";

import React, { useEffect } from "react";
import { useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/nenya_galadriels_ring.glb";

type RingModelProps = {
  position?: [number, number, number];
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
  onClick?: () => void;
  onPointerDown?: () => void;
  tintColor?: string; // New prop for color tint
};

export default function RingModel({ onClick, tintColor = '#ffffff', ...props }: RingModelProps) {
  const { scene } = useGLTF(MODEL_PATH);

  useEffect(() => {
    scene.traverse((object: THREE.Object3D) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material].filter(Boolean);
        if (materials.length === 0) {
          object.material = new THREE.MeshStandardMaterial({ color: tintColor, metalness: 1.0, roughness: 0.1 });
        } else {
          materials.forEach((mat: THREE.Material) => {
            if (!mat) return;
            // Fix rendering artifacts and ensure proper depth handling
            if ("transparent" in mat) mat.transparent = false;
            if ("depthWrite" in mat) mat.depthWrite = true;
            if ("metalness" in mat) mat.metalness = 1.0;
            if ("roughness" in mat) mat.roughness = 0.1;
            if (mat instanceof THREE.MeshStandardMaterial && mat.map) {
              if (mat.map.colorSpace !== THREE.SRGBColorSpace) {
                mat.map.colorSpace = THREE.SRGBColorSpace;
                mat.map.needsUpdate = true;
              }
            }
            if ("vertexColors" in mat) mat.vertexColors = false;
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.color = new THREE.Color(tintColor);
            }
            mat.needsUpdate = true;
          });
        }
      }
    });
  }, [scene, tintColor]); // Add tintColor to dependencies

  return (
    <group {...props} dispose={null}>
      <Center>
        <primitive object={scene} onClick={() => onClick?.()} />
      </Center>
    </group>
  );
}

useGLTF.preload(MODEL_PATH);



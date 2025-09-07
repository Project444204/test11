"use client";

import React, { useEffect } from "react";
import type { ThreeElements } from "@react-three/fiber";
import { useGLTF, Center } from "@react-three/drei";
import * as THREE from "three";

const MODEL_PATH = "/nenya_galadriels_ring.glb";

type RingModelProps = ThreeElements["group"] & {
  onClick?: () => void;
};

export default function RingModel({ onClick, ...props }: RingModelProps) {
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
          object.material = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1.0, roughness: 0.1 });
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
            mat.needsUpdate = true;
          });
        }
      }
    });
  }, [scene]);

  return (
    <group {...props} dispose={null}>
      <Center>
        <primitive object={scene} onClick={() => onClick?.()} />
      </Center>
    </group>
  );
}

useGLTF.preload(MODEL_PATH);



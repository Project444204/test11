"use client";

import React, { useState, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import HandModel from "@/components/three/HandModel";
import RingModel from "@/components/three/RingModel";
import NotificationBar from "@/components/ui/NotificationBar";

// Scene states as per requirements
type SceneState = 'Initial' | 'Animating' | 'Final';

export default function FullScreenCanvas() {
    // Main state management for the three required states
    const [sceneState, setSceneState] = useState<SceneState>('Initial');
    const [showNotification, setShowNotification] = useState(false);
    const controlsRef = useRef<OrbitControlsImpl>(null);

    // Handle ring click - show notification
    const handleRingClick = () => {
        if (sceneState === 'Initial') {
            setShowNotification(true);
        }
    };

    // Handle user confirmation - start animation
    const handleConfirmAttachment = () => {
        setShowNotification(false);
        setSceneState('Animating');
        
        // After animation completes (simulate 2 seconds), move to Final state
        setTimeout(() => {
            setSceneState('Final');
        }, 2000);
    };
  return (
    <>
      <div className="fixed inset-0">
        <Canvas
          shadows
          camera={{ 
            position: sceneState === 'Initial' ? [0, 0, 1] : [3, 3, 3], 
            fov: sceneState === 'Initial' ? 45 : 50 
          }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            outputColorSpace: THREE.SRGBColorSpace,
            toneMappingExposure: sceneState === 'Initial' ? 1.3 : 1.0,
          }}
        >
          <Environment preset="studio" background={false} />
          {/* Three-Point Lighting System */}
          <ambientLight intensity={sceneState === 'Initial' ? 0.6 : 0.3} />
          {/* Key Light */}
          <directionalLight 
            position={sceneState === 'Initial' ? [2, 3, 4] : [5, 5, 5]} 
            intensity={sceneState === 'Initial' ? 3 : 4} 
            castShadow 
            shadow-mapSize-width={2048} 
            shadow-mapSize-height={2048} 
            shadow-bias={-0.0001} 
          />
          {/* Fill Light */}
          <directionalLight 
            position={sceneState === 'Initial' ? [-2, 2, 3] : [-3, 3, 2]} 
            intensity={sceneState === 'Initial' ? 2 : 1.5} 
          />
          {/* Rim Light */}
          <spotLight 
            position={sceneState === 'Initial' ? [0, 3, -3] : [0, 5, -5]} 
            intensity={sceneState === 'Initial' ? 5 : 3} 
            angle={0.3} 
            penumbra={0.8} 
            castShadow
          />
          {/* Additional ring shine light - stronger for initial state */}
          <pointLight 
            position={[0, 1, 1]} 
            intensity={sceneState === 'Initial' ? 6 : 1.5} 
            color="#ffffff" 
          />
          {/* Extra highlight light for metal details */}
          {sceneState === 'Initial' && (
            <pointLight position={[-0.4, 0.3, 0.9]} intensity={3} color="#ffd7a8" />
          )}
          {/* Soft contact shadows under ring/hand */}
          <ContactShadows
            position={[0, -0.2, 0]}
            opacity={0.5}
            scale={10}
            blur={2.5}
            far={2}
          />
          
          {/* Initial State: Ring centered and smaller for better viewing */}
          {sceneState === 'Initial' && (
            <>
              <RingModel 
                position={[0, 0, 0]} 
                scale={0.002}
                onClick={handleRingClick} 
              />
              {/* Hide hand in initial state to focus on ring */}
            </>
          )}
          
          {/* Animating State: Ring moving to hand */}
          {sceneState === 'Animating' && (
            <HandModel 
              position={[0, 0, 0]} 
              scale={1}
              attachRing={true}
              animating={true}
            />
          )}
          
          {/* Final State: Ring attached to hand in center */}
          {sceneState === 'Final' && (
            <HandModel 
              position={[0, 0, 0]} 
              scale={1}
              attachRing={true} 
            />
          )}
          
          <OrbitControls 
            ref={controlsRef} 
            enableDamping 
            target={[0, 0, 0]}
            minDistance={sceneState === 'Initial' ? 0.1 : 1}
            maxDistance={sceneState === 'Initial' ? 50 : 50}
            enablePan
          />
        </Canvas>
        
        {showNotification && (
          <NotificationBar
            text="جربيه؟"
            confirmText="نعم"
            onConfirm={handleConfirmAttachment}
          />
        )}
      </div>
    </>
  );
}



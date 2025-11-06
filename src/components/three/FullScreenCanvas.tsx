"use client";

import React, { useState, useRef, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import HandModel from "@/components/three/HandModel";
import RingModel from "@/components/three/RingModel";
import NotificationBar from "@/components/ui/NotificationBar";
import { Sparkles } from "@react-three/drei";
import AnimatedSpotLight from "./AnimatedSpotLight";

import { useThree } from "@react-three/fiber";

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
            playAttachmentSound();
        }, 2000);
    };

  const playAttachmentSound = () => {
    const AudioContextClass = window.AudioContext || 
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn('AudioContext not supported');
      return;
    }
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 0.3; // subtle volume
    oscillator.type = 'sine';
    oscillator.frequency.value = 440;
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
    }, 300);
  };
  const CameraAdjuster = ({ sceneState }: { sceneState: SceneState }) => {

    const { camera, size, gl } = useThree();

    useEffect(() => {

      const aspect = size.width / size.height;

      const isPortrait = aspect < 1;

      camera.fov = sceneState === 'Initial' ? (isPortrait ? 60 : 45) : (isPortrait ? 70 : 50);

      camera.position.set(...(sceneState === 'Initial' ? (isPortrait ? [0, 0, 0.8] : [0, 0, 1]) : (isPortrait ? [2, 2, 2] : [3, 3, 3])));

      camera.updateProjectionMatrix();

      gl.toneMappingExposure = sceneState === 'Initial' ? 1.3 : 1.0;

    }, [size.width, size.height, sceneState, camera, gl]);

    return null;

  };

  const SceneModels = ({ sceneState, handleRingClick }: { sceneState: SceneState; handleRingClick: () => void }) => {

    const { viewport } = useThree();

    const scaleMultiplier = 1 / (viewport.width * 0.1); // Make larger on smaller screens

    const ringScale = 0.002 * scaleMultiplier;

    const handScale: [number, number, number] = [0.3 * scaleMultiplier, 0.3 * scaleMultiplier, 0.3 * scaleMultiplier];

    const sparkleScale = 0.5 * scaleMultiplier;

    return (

      <>

        {sceneState === 'Initial' && (

          <>

            <RingModel 

              position={[0, 0, 0]} 

              scale={ringScale}

              onPointerDown={handleRingClick} 

            />

            <Sparkles count={50} scale={sparkleScale} size={6} speed={0.5} position={[0, 0, 0]} color="yellow" />

            {/* Hide hand in initial state to focus on ring */}

          </>

        )}

        {sceneState === 'Animating' && (

          <HandModel 

            position={[0, 0, -0.1]} 

            scale={handScale}

            attachRing={true}

            animating={true}

          />

        )}

        {sceneState === 'Final' && (

          <>

            <HandModel 

              position={[0, 0, -0.1]} 

              scale={handScale}

              attachRing={true} 

            />

            <Sparkles count={50} scale={sparkleScale} size={6} speed={0.5} position={[0.27, 0.84, 0.11]} color="yellow" />

          </>

        )}

      </>

    );

  };

  return (

    <>

      <div className="fixed inset-0">

        <Canvas

          shadows

          camera={{ 

            position: [0, 0, 1], 

            fov: 45 

          }}

          gl={{

            antialias: true,

            toneMapping: THREE.ACESFilmicToneMapping,

            outputColorSpace: THREE.SRGBColorSpace,

            toneMappingExposure: 1.3,

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

          {/* Dynamic Rim Light */}

          <AnimatedSpotLight 

            isIlluminated={sceneState !== 'Initial'}

            initialPosition={[0, 3, -3]}

            targetPosition={[0, 5, -5]}

            activeIntensity={3}

            offIntensity={5}

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

          <CameraAdjuster sceneState={sceneState} />

          <SceneModels sceneState={sceneState} handleRingClick={handleRingClick} />

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



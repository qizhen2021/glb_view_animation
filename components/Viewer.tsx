
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Loader } from '@react-three/drei';
import { Model } from './Model';
import { PlaybackState, MaterialOverrides, MaterialConfig } from '../types';

interface ViewerProps {
  fileUrl: string | null;
  playbackState: PlaybackState;
  lightIntensity: number;
  hdrPreset: string;
  showBackground: boolean;
  autoZoom: boolean;
  animationDuration: number;
  materialOverrides: MaterialOverrides;
  onMeshSelect: (id: string, config: MaterialConfig) => void;
  onDeselect: () => void;
  onModelLoaded: (overrides: MaterialOverrides) => void;
}

export const Viewer: React.FC<ViewerProps> = ({ 
  fileUrl, 
  playbackState, 
  lightIntensity,
  hdrPreset,
  showBackground,
  autoZoom,
  animationDuration,
  materialOverrides,
  onMeshSelect,
  onDeselect,
  onModelLoaded
}) => {
  return (
    <>
      <Canvas
        shadows
        camera={{ position: [2, 2, 5], fov: 45 }}
        gl={{ antialias: true, toneMappingExposure: 1.0 }}
        dpr={[1, 2]}
        onPointerMissed={(e) => {
          // Only trigger deselect if we actually clicked the background (type click)
          if (e.type === 'click') onDeselect();
        }}
      >
        <Suspense fallback={null}>
          <Environment 
            preset={hdrPreset as any} 
            environmentIntensity={lightIntensity} 
            background={showBackground}
          />
          
          <ambientLight intensity={0.2 * lightIntensity} />
          <directionalLight 
            position={[5, 10, 5]} 
            intensity={1 * lightIntensity} 
            castShadow 
            shadow-bias={-0.0001}
          />

          <group position={[0, -1, 0]}>
            {fileUrl && (
              <Model 
                url={fileUrl} 
                playbackState={playbackState} 
                autoZoom={autoZoom}
                animationDuration={animationDuration}
                materialOverrides={materialOverrides}
                onMeshSelect={onMeshSelect}
                onModelLoaded={onModelLoaded}
              />
            )}
            <ContactShadows 
              resolution={1024} 
              scale={50} 
              blur={2} 
              opacity={0.5} 
              far={10} 
              color="#000000" 
            />
          </group>

          <OrbitControls 
            makeDefault 
            minPolarAngle={0} 
            maxPolarAngle={Math.PI / 1.8} 
            enableDamping={true} 
            dampingFactor={0.05} 
          />
        </Suspense>
      </Canvas>
      <Loader 
        containerStyles={{ backgroundColor: 'black' }} 
        innerStyles={{ backgroundColor: '#333', width: '200px' }} 
        barStyles={{ backgroundColor: '#fff' }}
        dataStyles={{ color: '#fff', fontSize: '12px', fontFamily: 'system-ui' }}
      />
    </>
  );
};

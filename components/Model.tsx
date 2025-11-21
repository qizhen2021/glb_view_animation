
import React, { useEffect, useRef, useState } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import { PlaybackState, MaterialOverrides, MaterialConfig } from '../types';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

interface ModelProps {
  url: string;
  playbackState: PlaybackState;
  autoZoom: boolean;
  animationDuration: number;
  materialOverrides: MaterialOverrides;
  onMeshSelect: (id: string, config: MaterialConfig) => void;
  onModelLoaded: (overrides: MaterialOverrides) => void;
}

export const Model: React.FC<ModelProps> = ({ 
  url, 
  playbackState, 
  autoZoom,
  animationDuration,
  materialOverrides,
  onMeshSelect,
  onModelLoaded
}) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url);
  const { actions, names } = useAnimations(animations, group);
  const { camera, controls } = useThree() as any; // Typed loosely for Drei controls
  const isInitialized = useRef(false);
  const isLoaded = useRef(false);
  const [hovered, setHovered] = useState<string | null>(null);

  // Initial Setup: Shadow, Auto-Zoom & Material Detection
  useEffect(() => {
    if (isLoaded.current) return;
    
    const glassOverrides: MaterialOverrides = {};

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        
        // We use UUID for stable identification within the session
        if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material;
        }

        // Auto Detect Glass Materials
        const mat = Array.isArray(child.material) ? child.material[0] : child.material;
        if (mat && mat.name && mat.name.toLowerCase().includes('glass')) {
            glassOverrides[child.uuid] = {
                transmission: 1.0,
                roughness: 0.02,
                metalness: 0.1,
                ior: 1.0, // Default requested value for auto-detected glass
                opacity: 1.0,
                color: '#ffffff'
            };
        }
      }
    });

    // Notify parent of auto-detected materials
    if (Object.keys(glassOverrides).length > 0) {
        onModelLoaded(glassOverrides);
    }

    // Auto Zoom Logic
    if (autoZoom) {
        const box = new THREE.Box3().setFromObject(scene);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Standard FoV distance calculation
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraZ *= 1.5; // Zoom out a bit for padding

        // Update Camera
        camera.position.set(center.x + cameraZ / 2, center.y + cameraZ / 4, center.z + cameraZ);
        camera.lookAt(center);
        
        // Update Controls
        if (controls) {
            controls.target.copy(center);
            controls.update();
        }
    }

    isLoaded.current = true;
  }, [scene, autoZoom, camera, controls, onModelLoaded]);

  // Reset loaded state when URL changes
  useEffect(() => {
    isLoaded.current = false;
    isInitialized.current = false;
  }, [url]);

  // Real-time Material Updates
  useFrame(() => {
    if (!group.current) return;
    
    group.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const id = child.uuid;
        const override = materialOverrides[id];

        if (override) {
          let mat = child.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial;
          
          // Upgrade to PhysicalMaterial if Glass features are requested
          if ((override.transmission || 0) > 0 && !(mat instanceof THREE.MeshPhysicalMaterial)) {
            const newMat = new THREE.MeshPhysicalMaterial();
            // Copy properties from the current material (which might be the original StandardMaterial)
            if (mat instanceof THREE.MeshStandardMaterial) {
                newMat.color.copy(mat.color);
                newMat.map = mat.map;
                newMat.normalMap = mat.normalMap;
                newMat.roughnessMap = mat.roughnessMap;
                newMat.metalnessMap = mat.metalnessMap;
                newMat.roughness = mat.roughness;
                newMat.metalness = mat.metalness;
            }
            child.material = newMat;
            mat = newMat;
          }

          // Apply Overrides
          if (override.color) mat.color.set(override.color);
          
          if (override.roughness !== undefined) mat.roughness = override.roughness;
          if (override.metalness !== undefined) mat.metalness = override.metalness;
          
          if (mat instanceof THREE.MeshPhysicalMaterial) {
            if (override.transmission !== undefined) {
              mat.transmission = override.transmission;
              mat.thickness = override.transmission > 0 ? 1.0 : 0; 
              mat.transparent = override.transmission > 0;
            }
            if (override.ior !== undefined) mat.ior = override.ior;
          }
        }
      }
    });
  });

  // Animation Control Logic
  useEffect(() => {
    if (names.length === 0) return;

    const actionName = names[0];
    const action = actions[actionName];
    if (!action) return;

    action.clampWhenFinished = true;
    action.setLoop(THREE.LoopOnce, 1);

    // Calculate timeScale based on desired duration
    const clipDuration = action.getClip().duration;
    const speed = clipDuration / animationDuration;

    if (!isInitialized.current) {
      action.reset();
      action.time = 0;
      action.paused = true;
      action.play();
      isInitialized.current = true;
    }

    switch (playbackState) {
      case PlaybackState.OPEN:
        action.paused = false;
        action.timeScale = speed;
        break;

      case PlaybackState.CLOSE:
        action.paused = false;
        action.timeScale = -speed;
        break;

      case PlaybackState.PAUSE:
        action.paused = true;
        break;
    }
  }, [playbackState, animationDuration, actions, names]);

  const handleClick = (e: any) => {
    e.stopPropagation(); 
    const mesh = e.object as THREE.Mesh;
    
    const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
    
    if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshPhysicalMaterial) {
      const currentConfig: MaterialConfig = {
        color: '#' + mat.color.getHexString(),
        roughness: mat.roughness,
        metalness: mat.metalness,
        transmission: (mat as THREE.MeshPhysicalMaterial).transmission || 0,
        ior: (mat as THREE.MeshPhysicalMaterial).ior || 1.0,
        opacity: mat.opacity
      };
      // Use UUID as the unique key
      onMeshSelect(mesh.uuid, currentConfig);
    }
  };

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
  }, [hovered]);

  return (
    <primitive 
      object={scene} 
      ref={group} 
      onClick={handleClick}
      onPointerOver={(e: any) => { e.stopPropagation(); setHovered(e.object.uuid); }}
      onPointerOut={(e: any) => { e.stopPropagation(); setHovered(null); }}
    />
  );
};

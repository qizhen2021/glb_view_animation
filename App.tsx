
import React, { useState, useCallback, useMemo } from 'react';
import { Viewer } from './components/Viewer';
import { Button } from './components/ui/Button';
import { Slider } from './components/ui/Slider';
import { PlaybackState, MaterialOverrides, MaterialConfig } from './types';

const Icons = {
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Play: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  Pause: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  Rewind: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  X: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
};

export default function App() {
  // Global State
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>(PlaybackState.IDLE);
  
  // Environment State
  const [lightIntensity, setLightIntensity] = useState<number>(1.0);
  const [hdrPreset, setHdrPreset] = useState<string>('city');
  const [showBackground, setShowBackground] = useState<boolean>(true); // Default to true
  const [autoZoom, setAutoZoom] = useState<boolean>(true);
  
  // Animation State
  const [animationDuration, setAnimationDuration] = useState<number>(2.0); // Seconds

  // Selection & Material State
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMesh, setSelectedMesh] = useState<string | null>(null);
  const [selectedBaseMaterial, setSelectedBaseMaterial] = useState<MaterialConfig | null>(null);
  const [materialOverrides, setMaterialOverrides] = useState<MaterialOverrides>({});

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setPlaybackState(PlaybackState.IDLE);
      setMaterialOverrides({});
      setSelectedMesh(null);
      setSelectedBaseMaterial(null);
      setShowSettings(false);
    }
  };

  const handleModelLoaded = useCallback((autoOverrides: MaterialOverrides) => {
    setMaterialOverrides(prev => ({ ...prev, ...autoOverrides }));
  }, []);

  const handleMeshSelect = useCallback((id: string, currentMaterial: MaterialConfig) => {
    setSelectedMesh(id);
    // Store the exact values read from the mesh at the moment of click
    setSelectedBaseMaterial(currentMaterial);
    setShowSettings(true); 
  }, []);

  const handleDeselect = useCallback(() => {
    if (selectedMesh) {
      setSelectedMesh(null);
      setSelectedBaseMaterial(null);
    }
  }, [selectedMesh]);

  const updateMaterial = (key: keyof MaterialConfig, value: any) => {
    if (!selectedMesh) return;
    setMaterialOverrides(prev => ({
      ...prev,
      [selectedMesh]: {
        ...prev[selectedMesh],
        [key]: value
      }
    }));
  };

  const applyGlassPreset = () => {
    if (!selectedMesh) return;
    setMaterialOverrides(prev => ({
      ...prev,
      [selectedMesh]: {
        ...prev[selectedMesh],
        transmission: 1.0,
        roughness: 0.02,
        metalness: 0.1,
        ior: 1.0, // Default to 1.0 (leftmost) as requested
        opacity: 1.0,
        color: '#ffffff'
      }
    }));
  };

  // Compute the final effective material properties for the UI
  // It merges the original base material with any user overrides
  const currentMat = useMemo(() => {
    if (!selectedMesh || !selectedBaseMaterial) return null;
    const overrides = materialOverrides[selectedMesh] || {};
    
    return {
      ...selectedBaseMaterial,
      ...overrides
    };
  }, [selectedMesh, selectedBaseMaterial, materialOverrides]);

  return (
    <div className="relative w-full h-screen bg-black text-white font-sans selection:bg-apple-blue selection:text-white overflow-hidden">
      
      {/* Header */}
      <div className="absolute top-0 left-0 w-full z-20 flex items-center justify-between px-6 py-4 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-3 text-sm font-semibold tracking-tight text-white/80">Zenith Pro</span>
        </div>

        <div className="flex gap-3 pointer-events-auto">
           <Button 
            icon={<Icons.Settings />} 
            active={showSettings}
            onClick={() => setShowSettings(!showSettings)}
            className="!rounded-full !p-3"
           />
           <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full transition-all border border-white/10 text-sm font-medium group">
            <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleFileUpload} />
            <span className="text-white/70 group-hover:text-white transition-colors"><Icons.Upload /></span>
            <span className="hidden sm:inline">Load Model</span>
          </label>
        </div>
      </div>

      {/* Main Viewer */}
      <div className="w-full h-full z-0">
        <Viewer 
          fileUrl={fileUrl} 
          playbackState={playbackState} 
          lightIntensity={lightIntensity}
          hdrPreset={hdrPreset}
          showBackground={showBackground}
          autoZoom={autoZoom}
          animationDuration={animationDuration}
          materialOverrides={materialOverrides}
          onMeshSelect={handleMeshSelect}
          onDeselect={handleDeselect}
          onModelLoaded={handleModelLoaded}
        />
      </div>

      {/* Hint Text */}
      {fileUrl && !selectedMesh && !showSettings && (
         <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none animate-pulse transition-opacity duration-1000">
            <p className="text-white/30 text-xs uppercase tracking-widest font-medium bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full">Click model to edit materials</p>
         </div>
      )}

      {/* Settings / Material Panel */}
      <div 
        className={`
          absolute top-20 right-6 w-80 z-30 flex flex-col gap-4 transition-all duration-500 ease-out
          ${showSettings ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'}
        `}
      >
        
        {/* Global Settings (Show when nothing selected) */}
        {!selectedMesh && (
          <div className="p-5 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl space-y-6" onPointerDown={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center">
               <h3 className="text-sm font-semibold text-white">Global Settings</h3>
               <button onClick={() => setShowSettings(false)} className="hover:text-white/70 transition-colors"><Icons.X /></button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-white/50 uppercase tracking-wider font-semibold">Environment</label>
                <div className="grid grid-cols-3 gap-2">
                  {['city', 'studio', 'sunset'].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setHdrPreset(preset)}
                      className={`px-2 py-1.5 text-xs rounded-md border transition-all capitalize ${hdrPreset === preset ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/10 hover:border-white/30'}`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <Slider 
                label="Light Intensity" 
                value={lightIntensity} 
                onChange={setLightIntensity} 
                min={0} max={3} step={0.1} 
              />

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Show Background</span>
                <button 
                  onClick={() => setShowBackground(!showBackground)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${showBackground ? 'bg-green-500' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${showBackground ? 'left-5' : 'left-1'}`} />
                </button>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Auto Zoom on Load</span>
                <button 
                  onClick={() => setAutoZoom(!autoZoom)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${autoZoom ? 'bg-green-500' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${autoZoom ? 'left-5' : 'left-1'}`} />
                </button>
              </div>

              <div className="pt-2 border-t border-white/10">
                 <Slider 
                  label={`Anim Duration: ${animationDuration}s`} 
                  value={animationDuration} 
                  onChange={setAnimationDuration} 
                  min={0.5} max={10} step={0.5} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Material Editor (Show when selected) */}
        {selectedMesh && currentMat && (
          <div className="p-5 bg-black/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl space-y-5" onPointerDown={(e) => e.stopPropagation()}>
             <div className="flex justify-between items-center">
               <div className="overflow-hidden">
                 <h3 className="text-sm font-semibold text-white">Material Editor</h3>
                 <p className="text-xs text-white/40 truncate max-w-[200px]">ID: {selectedMesh.slice(0, 8)}</p>
               </div>
               <button onClick={() => setSelectedMesh(null)} className="hover:text-white/70 transition-colors"><Icons.X /></button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <label className="text-xs text-white/60">Color</label>
                 <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20">
                    <input 
                        type="color" 
                        value={currentMat.color || '#ffffff'} 
                        onChange={(e) => updateMaterial('color', e.target.value)}
                        className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 bg-transparent"
                    />
                 </div>
              </div>

              <Slider 
                label="Roughness" 
                value={currentMat.roughness ?? 0.5} 
                onChange={(v) => updateMaterial('roughness', v)} 
                min={0} max={1} step={0.01} 
              />
              
              <Slider 
                label="Metalness" 
                value={currentMat.metalness ?? 0} 
                onChange={(v) => updateMaterial('metalness', v)} 
                min={0} max={1} step={0.01} 
              />

               <div className="pt-4 border-t border-white/10 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-white/80">Glass Properties</span>
                    <button onClick={applyGlassPreset} className="text-[10px] px-2 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30 hover:bg-blue-500/40 transition-colors">
                      Glass Preset
                    </button>
                 </div>
                  <Slider 
                    label="Transmission" 
                    value={currentMat.transmission ?? 0} 
                    onChange={(v) => updateMaterial('transmission', v)} 
                    min={0} max={1} step={0.01} 
                  />
                   <Slider 
                    label="IOR (Refraction)" 
                    value={currentMat.ior ?? 1.0} 
                    onChange={(v) => updateMaterial('ior', v)} 
                    min={1} max={2.33} step={0.01} 
                  />
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-2 p-2 bg-black/40 backdrop-blur-2xl rounded-full border border-white/10 shadow-2xl">
          <Button 
            onClick={() => setPlaybackState(PlaybackState.CLOSE)}
            active={playbackState === PlaybackState.CLOSE}
            icon={<Icons.Rewind />}
            label="Close"
            className="!rounded-full pl-5 pr-6"
            disabled={!fileUrl}
          />
            <Button 
            onClick={() => setPlaybackState(PlaybackState.PAUSE)}
            active={playbackState === PlaybackState.PAUSE}
            icon={<Icons.Pause />}
            className="!rounded-full w-10 h-10 !px-0 flex items-center justify-center"
            disabled={!fileUrl}
          />
          <Button 
            onClick={() => setPlaybackState(PlaybackState.OPEN)}
            active={playbackState === PlaybackState.OPEN}
            icon={<Icons.Play />}
            label="Open"
            className="!rounded-full pl-6 pr-5"
            disabled={!fileUrl}
          />
        </div>
      </div>
      
      {!fileUrl && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <p className="text-white/30 text-xl font-light tracking-wide">Drop a GLB file here to start</p>
        </div>
      )}
    </div>
  );
}

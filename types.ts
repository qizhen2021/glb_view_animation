
export enum PlaybackState {
  IDLE = 'IDLE',
  OPEN = 'OPEN',
  CLOSE = 'CLOSE',
  PAUSE = 'PAUSE'
}

export interface MaterialConfig {
  color: string;
  roughness: number;
  metalness: number;
  transmission: number; // For glass
  ior: number;         // Index of Refraction
  opacity: number;
}

export type MaterialOverrides = Record<string, Partial<MaterialConfig>>;

export interface ViewerState {
  fileUrl: string | null;
  playbackState: PlaybackState;
  lightIntensity: number;
  hdrPreset: string;
  showBackground: boolean;
  animationDuration: number;
  materialOverrides: MaterialOverrides;
}

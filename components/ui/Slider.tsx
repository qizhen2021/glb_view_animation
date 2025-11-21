
import React from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export const Slider: React.FC<SliderProps> = ({ value, onChange, min = 0, max = 100, step = 1, label }) => {
  return (
    <div 
      className="flex flex-col gap-1.5 w-full min-w-[120px]"
      onPointerDown={(e) => e.stopPropagation()} // Prevent OrbitControls from hijacking the drag
      onPointerMove={(e) => e.stopPropagation()}
    >
      {label && <span className="text-xs font-medium text-white/60 ml-1">{label}</span>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white hover:accent-gray-200 transition-all"
      />
    </div>
  );
};

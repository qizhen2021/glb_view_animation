import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  label?: string;
}

export const Button: React.FC<ButtonProps> = ({ active, icon, label, className = '', ...props }) => {
  return (
    <button
      className={`
        flex items-center justify-center gap-2 px-4 py-2.5 rounded-full transition-all duration-300 ease-out
        text-sm font-medium backdrop-blur-md border
        ${active 
          ? 'bg-white/90 text-black border-transparent shadow-lg scale-105' 
          : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20 hover:text-white hover:border-white/20'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label && <span>{label}</span>}
    </button>
  );
};
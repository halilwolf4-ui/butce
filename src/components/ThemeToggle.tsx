import React from 'react';
import { Sun, Moon, Zap } from 'lucide-react';

interface ThemeToggleProps {
  isLight: boolean;
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isLight, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className={`relative w-14 h-8 rounded-lg p-1 border transition-colors flex items-center shadow-sm select-none ${
        isLight
          ? 'bg-gradient-to-r from-[#f72585]/15 to-[#4361ee]/15 border-[#4361ee]/40'
          : 'bg-[#181427] border-[#3e3455]'
      }`}
      title={isLight ? 'Gece Moduna Geç (Dark)' : 'Gündüz Moduna Geç (Futuristik)'}
    >
      <div
        className={`w-6 h-6 rounded-md flex items-center justify-center shadow-md transition-transform duration-150 ${
          isLight
            ? 'translate-x-6 bg-gradient-to-r from-[#f72585] to-[#4361ee] text-white'
            : 'translate-x-0 bg-gradient-to-r from-[#3e3455] to-[#252038] text-cyan-300 border border-[#524470]'
        }`}
      >
        {isLight ? (
          <Zap className="w-3.5 h-3.5 stroke-[2.5]" />
        ) : (
          <Moon className="w-3.5 h-3.5 stroke-[2.5]" />
        )}
      </div>
    </button>
  );
};

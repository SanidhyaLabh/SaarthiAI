import React from 'react';
import { AppMode } from '../types';
import { audioSynth } from '../services/audioSynth';
import { haptics } from '../services/haptics';

interface TactileActionGridProps {
  currentMode: AppMode;
  isProcessing: boolean;
  onSelectAction: (mode: AppMode) => void;
}

export const TactileActionGrid: React.FC<TactileActionGridProps> = ({
  currentMode,
  isProcessing,
  onSelectAction,
}) => {
  const handleAction = (mode: AppMode) => {
    haptics.tap();
    audioSynth.playClickCue();
    onSelectAction(mode);
  };

  return (
    <nav aria-label="Primary Tactile Actions" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Tile 1: Describe Scene */}
      <button
        type="button"
        disabled={isProcessing}
        onClick={() => handleAction('SCENE')}
        aria-label="Describe Scene. Scan your surroundings and hear a full description."
        className={`min-h-[75px] bg-surface-container-lowest border-3 ${currentMode === 'SCENE' ? 'border-primary-fixed bg-primary-fixed/10' : 'border-primary-fixed'} rounded-xl flex items-center justify-center gap-4 p-4 focus:outline-none focus:border-6 focus:bg-primary-fixed focus:text-on-primary-fixed hover:border-6 transition-all duration-100 group active:bg-primary-fixed active:text-on-primary-fixed active:scale-[0.98] select-none`}
      >
        <span 
          aria-hidden="true" 
          className="material-symbols-outlined text-primary-fixed group-focus:text-on-primary-fixed group-active:text-on-primary-fixed text-[34px] fill"
        >
          visibility
        </span>
        <span className="font-label-lg text-[20px] font-extrabold text-primary group-focus:text-on-primary-fixed group-active:text-on-primary-fixed">
          Describe Scene
        </span>
      </button>

      {/* Tile 2: Read Text & Prescription */}
      <button
        type="button"
        disabled={isProcessing}
        onClick={() => handleAction('OCR')}
        aria-label="Read Text. Scan prescription, street signs, and documents."
        className={`min-h-[75px] bg-surface-container-lowest border-3 ${currentMode === 'OCR' ? 'border-primary-fixed bg-primary-fixed/10' : 'border-primary-fixed'} rounded-xl flex items-center justify-center gap-4 p-4 focus:outline-none focus:border-6 focus:bg-primary-fixed focus:text-on-primary-fixed hover:border-6 transition-all duration-100 group active:bg-primary-fixed active:text-on-primary-fixed active:scale-[0.98] select-none`}
      >
        <span 
          aria-hidden="true" 
          className="material-symbols-outlined text-primary-fixed group-focus:text-on-primary-fixed group-active:text-on-primary-fixed text-[34px]"
        >
          description
        </span>
        <span className="font-label-lg text-[20px] font-extrabold text-primary group-focus:text-on-primary-fixed group-active:text-on-primary-fixed">
          Read Text
        </span>
      </button>

      {/* Tile 3: Voice Ask / Query */}
      <button
        type="button"
        disabled={isProcessing}
        onClick={() => handleAction('VOICE')}
        aria-label="Voice Ask. Tap to ask any question about your environment."
        className={`min-h-[75px] bg-surface-container-lowest border-3 ${currentMode === 'VOICE' ? 'border-primary-fixed bg-primary-fixed/10' : 'border-primary-fixed'} rounded-xl flex items-center justify-center gap-4 p-4 focus:outline-none focus:border-6 focus:bg-primary-fixed focus:text-on-primary-fixed hover:border-6 transition-all duration-100 group active:bg-primary-fixed active:text-on-primary-fixed active:scale-[0.98] relative overflow-hidden select-none`}
      >
        <div className="absolute inset-0 bg-primary-fixed opacity-0 group-active:opacity-20 transition-opacity duration-300 pointer-events-none" />
        <span 
          aria-hidden="true" 
          className="material-symbols-outlined text-primary-fixed group-focus:text-on-primary-fixed group-active:text-on-primary-fixed text-[34px]"
        >
          mic
        </span>
        <span className="font-label-lg text-[20px] font-extrabold text-primary group-focus:text-on-primary-fixed group-active:text-on-primary-fixed">
          Voice Ask
        </span>
      </button>

      {/* Tile 4: Identify People & Emotions */}
      <button
        type="button"
        disabled={isProcessing}
        onClick={() => handleAction('PEOPLE')}
        aria-label="Identify People. Recognize people, expressions, and social context."
        className={`min-h-[75px] bg-surface-container-lowest border-3 ${currentMode === 'PEOPLE' ? 'border-primary-fixed bg-primary-fixed/10' : 'border-primary-fixed'} rounded-xl flex items-center justify-center gap-4 p-4 focus:outline-none focus:border-6 focus:bg-primary-fixed focus:text-on-primary-fixed hover:border-6 transition-all duration-100 group active:bg-primary-fixed active:text-on-primary-fixed active:scale-[0.98] select-none`}
      >
        <span 
          aria-hidden="true" 
          className="material-symbols-outlined text-primary-fixed group-focus:text-on-primary-fixed group-active:text-on-primary-fixed text-[34px]"
        >
          group
        </span>
        <span className="font-label-lg text-[20px] font-extrabold text-primary group-focus:text-on-primary-fixed group-active:text-on-primary-fixed">
          Identify People
        </span>
      </button>
    </nav>
  );
};

import React from 'react';
import { audioSynth } from '../services/audioSynth';
import { haptics } from '../services/haptics';

interface BottomNavBarProps {
  currentTab: 'SCAN' | 'SOS';
  onSelectTab: (tab: 'SCAN' | 'SOS') => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <nav 
      aria-label="Global Navigation" 
      className="fixed bottom-0 w-full z-40 flex justify-between items-center h-[85px] md:h-[90px] bg-surface-container-lowest border-t-3 border-primary-fixed select-none"
    >
      {/* Active Tab: SCAN */}
      <button
        type="button"
        onClick={() => {
          haptics.tap();
          audioSynth.playClickCue();
          onSelectTab('SCAN');
        }}
        aria-current={currentTab === 'SCAN' ? 'page' : undefined}
        aria-label="Scan Tab. Real-time camera obstacle detection and AI features."
        className={`flex flex-col items-center justify-center h-full w-full px-4 focus:outline-none transition-all ${
          currentTab === 'SCAN'
            ? 'bg-primary-fixed text-on-primary-fixed font-black'
            : 'text-on-surface hover:bg-surface-container-high'
        }`}
      >
        <span 
          aria-hidden="true" 
          className="material-symbols-outlined text-[32px] mb-1 fill"
        >
          center_focus_strong
        </span>
        <span className="font-label-lg text-[18px] md:text-[20px] tracking-wider uppercase">
          SCAN
        </span>
      </button>

      {/* SOS Tab */}
      <button
        type="button"
        onClick={() => {
          haptics.sos();
          onSelectTab('SOS');
        }}
        aria-current={currentTab === 'SOS' ? 'page' : undefined}
        aria-label="Emergency SOS Tab. Trigger loud siren and GPS emergency beacon."
        className={`flex flex-col items-center justify-center h-full w-full px-4 focus:outline-none transition-all ${
          currentTab === 'SOS'
            ? 'bg-error text-on-error font-black'
            : 'text-brand-amber hover:bg-surface-container-high'
        }`}
      >
        <span 
          aria-hidden="true" 
          className="material-symbols-outlined text-[32px] mb-1 fill"
        >
          emergency
        </span>
        <span className="font-label-lg text-[18px] md:text-[20px] tracking-wider uppercase">
          SOS
        </span>
      </button>
    </nav>
  );
};

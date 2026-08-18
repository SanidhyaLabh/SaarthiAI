import React from 'react';
import { VoiceState } from '../types';

interface CaptionBarProps {
  caption: string;
  voiceState: VoiceState;
  onRepeat: () => void;
}

export const CaptionBar: React.FC<CaptionBarProps> = ({
  caption,
  voiceState,
  onRepeat,
}) => {
  return (
    <div 
      onClick={onRepeat}
      role="region"
      aria-live="polite"
      aria-label="Spoken feedback subtitle bar. Tap to hear again."
      className="relative z-10 bg-surface-container-lowest border-3 border-primary-fixed rounded-xl p-4 min-h-[90px] flex items-center justify-between gap-4 cursor-pointer hover:border-primary-fixed-dim active:bg-surface-container-high transition-all shadow-lg select-none"
    >
      <div className="flex items-center gap-3 flex-grow">
        <span 
          aria-hidden="true" 
          className={`material-symbols-outlined text-primary-fixed text-[30px] flex-shrink-0 ${voiceState === 'SPEAKING' ? 'animate-bounce' : ''}`}
        >
          {voiceState === 'SPEAKING' ? 'volume_up' : voiceState === 'LISTENING' ? 'mic' : voiceState === 'PROCESSING' ? 'hourglass_top' : 'chat_bubble'}
        </span>
        <p className="font-body-lg text-[20px] md:text-[22px] font-bold text-primary leading-snug tracking-tight">
          "{caption || 'SaarthiAI is active. Listening for your voice.'}"
        </p>
      </div>

      <button
        type="button"
        aria-label="Repeat last spoken message"
        className="flex-shrink-0 w-12 h-12 bg-primary-fixed text-on-primary-fixed rounded-lg flex items-center justify-center font-extrabold shadow-md active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-[28px]">
          replay
        </span>
      </button>
    </div>
  );
};

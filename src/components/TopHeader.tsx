import React, { useState, useEffect } from 'react';
import { Language, VoiceState } from '../types';
import { audioSynth } from '../services/audioSynth';
import { haptics } from '../services/haptics';

interface TopHeaderProps {
  language: Language;
  voiceState: VoiceState;
  onToggleLanguage: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  language,
  voiceState,
  onToggleLanguage,
  onOpenSettings,
  onToggleMute,
  isMuted,
}) => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(85);

  useEffect(() => {
    // Read battery status if supported
    if ('getBattery' in navigator) {
      (navigator as unknown as { getBattery: () => Promise<{ level: number; addEventListener: (type: string, fn: () => void) => void }> })
        .getBattery()
        .then(battery => {
          setBatteryLevel(Math.round(battery.level * 100));
          battery.addEventListener('levelchange', () => {
            setBatteryLevel(Math.round(battery.level * 100));
          });
        })
        .catch(() => {});
    }
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-6 h-[70px] bg-surface dark:bg-surface-container-lowest border-b-3 border-primary dark:border-primary-fixed flat select-none">
      <div className="flex items-center gap-3">
        <span 
          aria-hidden="true" 
          className="material-symbols-outlined text-primary-fixed text-[32px] fill"
        >
          visibility
        </span>
        <div className="flex flex-col">
          <h1 className="font-headline-lg text-[24px] md:text-[28px] font-extrabold text-primary-fixed uppercase tracking-tighter leading-none">
            SaarthiAI
          </h1>
          <span className="text-[11px] font-bold text-on-surface tracking-widest uppercase opacity-80">
            {voiceState === 'LISTENING' ? '🎙️ LISTENING...' : voiceState === 'SPEAKING' ? '🔊 SPEAKING...' : 'SPATIAL HUD ACTIVE'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Language Switcher */}
        <button
          onClick={() => {
            haptics.tap();
            audioSynth.playClickCue();
            onToggleLanguage();
          }}
          aria-label={`Switch Language. Current language is ${language === 'en' ? 'English' : 'Hindi'}`}
          className="border-3 border-primary-fixed bg-surface-container-lowest text-primary-fixed px-3 py-1 font-label-md text-[16px] font-bold rounded focus:outline-none focus:ring-4 focus:ring-primary-fixed active:bg-primary-fixed active:text-on-primary-fixed transition-all h-[44px] min-w-[65px] flex items-center justify-center"
        >
          {language === 'en' ? 'EN / HI' : 'HI / EN'}
        </button>

        {/* Audio Mute Toggle */}
        <button
          onClick={() => {
            haptics.tap();
            onToggleMute();
          }}
          aria-label={isMuted ? "Unmute Audio" : "Mute Audio"}
          className="w-[44px] h-[44px] border-2 border-outline rounded flex items-center justify-center text-on-surface hover:text-primary-fixed focus:outline-none focus:border-primary-fixed active:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[24px]">
            {isMuted ? 'volume_off' : 'volume_up'}
          </span>
        </button>

        {/* Battery & Settings */}
        <button
          onClick={() => {
            haptics.tap();
            audioSynth.playClickCue();
            onOpenSettings();
          }}
          aria-label="Settings and Camera Controls"
          className="w-[44px] h-[44px] border-2 border-outline rounded flex items-center justify-center text-on-surface hover:text-primary-fixed focus:outline-none focus:border-primary-fixed active:bg-surface-container-high"
        >
          <span className="material-symbols-outlined text-[24px]">
            settings
          </span>
        </button>

        <div className="flex items-center gap-1 text-primary-fixed pl-1" title={`Battery: ${batteryLevel}%`}>
          <span aria-hidden="true" className="material-symbols-outlined text-[26px]">
            {batteryLevel && batteryLevel > 80 ? 'battery_full' : batteryLevel && batteryLevel > 30 ? 'battery_horiz_075' : 'battery_alert'}
          </span>
        </div>
      </div>
    </header>
  );
};

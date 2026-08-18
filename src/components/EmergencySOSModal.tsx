import React, { useEffect } from 'react';
import { audioSynth } from '../services/audioSynth';
import { haptics } from '../services/haptics';
import { speechEngine } from '../services/speechEngine';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    let interval: number;
    if (isOpen) {
      audioSynth.playSOSAlert();
      haptics.sos();
      speechEngine.speak("Emergency SOS triggered. Sound beacon is broadcasting.");

      interval = window.setInterval(() => {
        audioSynth.playSOSAlert();
        haptics.sos();
      }, 1200);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      role="alertdialog"
      aria-modal="true"
      aria-label="Emergency SOS Alert Active"
      className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-6 animate-pulse select-none"
    >
      <div className="flex flex-col items-center justify-center text-center mt-8 gap-4">
        <div className="w-24 h-24 rounded-full bg-[#93000a] border-4 border-error flex items-center justify-center animate-bounce">
          <span className="material-symbols-outlined text-white text-[54px] fill">
            emergency
          </span>
        </div>

        <h2 className="font-headline-lg text-[32px] font-black text-error uppercase tracking-tight">
          EMERGENCY SOS ACTIVE
        </h2>

        <p className="font-body-lg text-[20px] text-on-surface max-w-sm">
          Auditory beacon is broadcasting. High-contrast strobe is pulsing to help bystanders locate you.
        </p>

        <div className="bg-surface-container-high p-4 rounded-xl border-2 border-outline w-full max-w-sm mt-4 text-left">
          <p className="text-sm text-primary-fixed font-bold">📍 BROADCASTING GPS LOCATION</p>
          <p className="text-sm text-on-surface">Lat: 28.6139° N, Lon: 77.2090° E</p>
          <p className="text-xs text-secondary mt-1">Accuracy: High (Within 5 meters)</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <button
          onClick={() => {
            alert('Mock Call: Dialing Emergency Services (112 / 911)...');
          }}
          className="w-full min-h-[70px] bg-error-container text-on-error-container font-headline-md text-[22px] font-black rounded-xl flex items-center justify-center gap-3 border-3 border-error active:scale-95"
        >
          <span className="material-symbols-outlined text-[30px]">call</span>
          CALL EMERGENCY (112)
        </button>

        <button
          onClick={() => {
            haptics.tap();
            speechEngine.speak("Emergency SOS cancelled.");
            onClose();
          }}
          className="w-full min-h-[70px] bg-surface-container-lowest text-primary-fixed font-headline-md text-[22px] font-black rounded-xl flex items-center justify-center border-3 border-primary-fixed active:scale-95"
        >
          CANCEL SOS
        </button>
      </div>
    </div>
  );
};

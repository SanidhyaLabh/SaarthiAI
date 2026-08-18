import React, { useState } from 'react';
import { multimodalAI } from '../services/multimodalAI';
import { speechEngine } from '../services/speechEngine';
import { haptics } from '../services/haptics';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cameraFacingMode: 'environment' | 'user';
  onToggleCameraFacing: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  cameraFacingMode,
  onToggleCameraFacing,
}) => {
  const [apiKey, setApiKey] = useState<string>(multimodalAI.getApiKey());
  const [speechRate, setSpeechRateState] = useState<number>(1.0);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSaveApiKey = () => {
    multimodalAI.setApiKey(apiKey.trim());
    setIsSaved(true);
    haptics.tap();
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSpeechRateChange = (rate: number) => {
    setSpeechRateState(rate);
    speechEngine.setSpeechRate(rate);
    speechEngine.speak(`Speech speed set to ${rate}x.`);
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="SaarthiAI Settings and Accessibility Controls"
      className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-6 select-none overflow-y-auto"
    >
      <div className="flex justify-between items-center border-b-2 border-primary-fixed pb-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary-fixed text-[32px]">
            tune
          </span>
          <h2 className="font-headline-lg text-[24px] font-extrabold text-primary-fixed uppercase">
            Settings & Guide
          </h2>
        </div>
        <button
          onClick={() => {
            haptics.tap();
            onClose();
          }}
          className="p-2 border-2 border-outline rounded-lg text-primary hover:border-primary-fixed"
        >
          <span className="material-symbols-outlined text-[28px]">close</span>
        </button>
      </div>

      <div className="flex flex-col gap-6 py-6 text-on-surface">
        {/* Hardware & Gesture Guide for Blind Users */}
        <div className="bg-surface-container-high p-4 rounded-xl border-2 border-primary-fixed">
          <h3 className="font-headline-md text-[18px] font-bold text-primary-fixed mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined">touch_app</span>
            Hardware & Gesture Shortcuts:
          </h3>
          <ul className="text-sm space-y-1.5 list-disc list-inside text-on-surface">
            <li><strong>Single Tap:</strong> Read current obstacle radar & distance.</li>
            <li><strong>Double Tap:</strong> Full panoramic scene analysis.</li>
            <li><strong>Hold Anywhere:</strong> Voice Ask (Ask questions hands-free).</li>
            <li><strong>Volume Up / Arrow Up:</strong> Instant environment scan.</li>
            <li><strong>Volume Down / Arrow Down:</strong> Repeat last message.</li>
          </ul>
        </div>

        {/* Camera Facing Mode */}
        <div className="bg-surface-container p-4 rounded-xl border border-outline">
          <label className="text-base font-bold text-primary-fixed block mb-2">Camera Direction</label>
          <button
            onClick={() => {
              haptics.tap();
              onToggleCameraFacing();
            }}
            className="w-full min-h-[50px] bg-surface-container-highest border-2 border-outline rounded-lg flex items-center justify-between px-4 font-bold text-primary active:bg-primary-fixed active:text-on-primary-fixed"
          >
            <span>Current: {cameraFacingMode === 'environment' ? 'Back (World View)' : 'Front (Selfie)'}</span>
            <span className="material-symbols-outlined">flip_camera_ios</span>
          </button>
        </div>

        {/* Voice Speed Slider */}
        <div className="bg-surface-container p-4 rounded-xl border border-outline">
          <div className="flex justify-between items-center mb-2">
            <label className="text-base font-bold text-primary-fixed">Voice Speech Speed</label>
            <span className="font-extrabold text-primary">{speechRate}x</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[0.8, 1.0, 1.2, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => handleSpeechRateChange(rate)}
                className={`py-2 rounded-lg font-bold border-2 ${speechRate === rate ? 'bg-primary-fixed text-on-primary-fixed border-primary-fixed' : 'border-outline text-on-surface'}`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>

        {/* Gemini Multimodal Vision API Key (Optional) */}
        <div className="bg-surface-container p-4 rounded-xl border border-outline">
          <label htmlFor="apiKeyInput" className="text-base font-bold text-primary-fixed block mb-1">
            Google Gemini API Key (Optional)
          </label>
          <p className="text-xs text-secondary mb-3">
            Leave blank to use the built-in fast offline vision simulator.
          </p>
          <input
            id="apiKeyInput"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full bg-surface-container-lowest border-2 border-outline rounded-lg p-3 text-primary text-sm focus:border-primary-fixed focus:outline-none mb-3"
          />
          <button
            onClick={handleSaveApiKey}
            className="w-full py-3 bg-primary-fixed text-on-primary-fixed font-bold rounded-lg flex items-center justify-center gap-2 active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">save</span>
            {isSaved ? 'API KEY SAVED!' : 'SAVE API KEY'}
          </button>
        </div>
      </div>

      <button
        onClick={() => {
          haptics.tap();
          onClose();
        }}
        className="w-full min-h-[60px] bg-primary-fixed text-on-primary-fixed font-headline-md text-[20px] font-black rounded-xl flex items-center justify-center border-3 border-primary-fixed active:scale-95 mt-4"
      >
        DONE
      </button>
    </div>
  );
};

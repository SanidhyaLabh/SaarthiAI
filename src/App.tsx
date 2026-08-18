import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppMode, DetectedObstacle, Language, VoiceState } from './types';
import { speechEngine } from './services/speechEngine';
import { audioSynth } from './services/audioSynth';
import { multimodalAI } from './services/multimodalAI';
import { haptics } from './services/haptics';
import { TopHeader } from './components/TopHeader';
import { SpatialHUD, SpatialHUDHandle } from './components/SpatialHUD';
import { CaptionBar } from './components/CaptionBar';
import { TactileActionGrid } from './components/TactileActionGrid';
import { BottomNavBar } from './components/BottomNavBar';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { SettingsDrawer } from './components/SettingsDrawer';

export const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>('SCENE');
  const [language, setLanguage] = useState<Language>('en');
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [caption, setCaption] = useState<string>('SaarthiAI is active. Scanning your path.');
  const [obstacles, setObstacles] = useState<DetectedObstacle[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const hudRef = useRef<SpatialHUDHandle>(null);
  const hasStartedRef = useRef<boolean>(false);
  const tapTimeoutRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const tapCountRef = useRef<number>(0);

  // Subscribe to speech engine events
  useEffect(() => {
    const unsubState = speechEngine.onStateChange(setVoiceState);
    const unsubCaption = speechEngine.onCaptionUpdate(setCaption);

    const unsubCommand = speechEngine.onCommand((command, rawText) => {
      handleVoiceCommand(command, rawText);
    });

    return () => {
      unsubState();
      unsubCaption();
      unsubCommand();
    };
  }, [language]);

  // Execute Multimodal GenAI Analysis for a given mode
  const triggerMultimodalAnalysis = useCallback(async (mode: AppMode, userQuery?: string) => {
    setIsProcessingAI(true);
    haptics.tap();

    const processingAnnouncement = language === 'hi'
      ? (mode === 'OCR' ? 'पर्ची और लिखावट पढ़ी जा रही है...' : mode === 'PEOPLE' ? 'चेहरे और लोग पहचाने जा रहे हैं...' : 'दृश्य का विश्लेषण किया जा रहा है...')
      : (mode === 'OCR' ? 'Reading text and prescription labels...' : mode === 'PEOPLE' ? 'Analyzing people and social expressions...' : 'Scanning environment...');
    
    speechEngine.speak(processingAnnouncement);

    // Capture current frame from camera or test feed
    const frameBase64 = hudRef.current ? hudRef.current.captureCurrentFrame() : '';

    try {
      const result = await multimodalAI.analyzeFrame(frameBase64, mode, language, userQuery);
      audioSynth.playSuccessCue();
      haptics.modeChange();
      await speechEngine.speak(result.details);
    } catch (err) {
      const errorMsg = language === 'hi' 
        ? 'माफ़ कीजिए, विश्लेषण में त्रुटि हुई। कृपया पुनः प्रयास करें।'
        : 'Analysis encountered an issue. Please try again.';
      speechEngine.speak(errorMsg);
    } finally {
      setIsProcessingAI(false);
    }
  }, [language]);

  // Handle incoming recognized voice commands
  const handleVoiceCommand = useCallback((command: string, rawText: string) => {
    if (command === 'SCENE') {
      setCurrentMode('SCENE');
      triggerMultimodalAnalysis('SCENE');
    } else if (command === 'OCR') {
      setCurrentMode('OCR');
      triggerMultimodalAnalysis('OCR');
    } else if (command === 'PEOPLE') {
      setCurrentMode('PEOPLE');
      triggerMultimodalAnalysis('PEOPLE');
    } else if (command === 'SOS') {
      setIsSOSOpen(true);
    } else {
      // General voice query
      setCurrentMode('VOICE');
      triggerMultimodalAnalysis('VOICE', rawText);
    }
  }, [triggerMultimodalAnalysis]);

  // Start Assistant on first user interaction or mount
  const ensureAssistantStarted = useCallback(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      speechEngine.playWelcomeGreeting();
    }
  }, []);

  useEffect(() => {
    const handleFirstGesture = () => {
      ensureAssistantStarted();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('touchstart', handleFirstGesture);

    // Also attempt prompt start after 1 second
    const timer = setTimeout(() => {
      if (!hasStartedRef.current) {
        ensureAssistantStarted();
      }
    }, 1000);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, [ensureAssistantStarted]);

  // Hardware / Volume / Headset Media Key Navigation (WCAG / Tactile Accessible)
  useEffect(() => {
    // Setup MediaSession for headphone and phone hardware buttons
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'SaarthiAI - Spatial Vision Assistant',
        artist: 'Voice & Computer Vision Active',
        album: 'Accessibility HUD'
      });

      try {
        navigator.mediaSession.setActionHandler('play', () => {
          haptics.modeChange();
          triggerMultimodalAnalysis('SCENE');
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          speechEngine.repeatLast();
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          haptics.tap();
          const modes: AppMode[] = ['SCENE', 'OCR', 'VOICE', 'PEOPLE'];
          const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
          setCurrentMode(modes[nextIndex]);
          speechEngine.speak(`Switched to ${modes[nextIndex]} mode.`);
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          speechEngine.repeatLast();
        });
      } catch (e) {
        // MediaSession handler unsupported catch
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Volume Up / Arrow Up: Instant Scene Scan
      if (e.key === 'ArrowUp' || e.key === 'VolumeUp' || e.key === 'AudioVolumeUp') {
        e.preventDefault();
        haptics.modeChange();
        triggerMultimodalAnalysis('SCENE');
      }
      // Volume Down / Arrow Down: Repeat Last Spoken Message
      else if (e.key === 'ArrowDown' || e.key === 'VolumeDown' || e.key === 'AudioVolumeDown') {
        e.preventDefault();
        speechEngine.repeatLast();
      }
      // Space or Enter: Toggle Voice Assistant / Query
      else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        speechEngine.startListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerMultimodalAnalysis, currentMode]);

  // Full-Screen Universal Tactile Gesture Handling for Blind Navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const now = Date.now();
    const duration = now - touchStartRef.current.time;
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;

    // Horizontal Swipe Gesture (Switch Mode)
    if (Math.abs(diffX) > 80 && Math.abs(diffY) < 60) {
      haptics.modeChange();
      audioSynth.playClickCue();
      const modes: AppMode[] = ['SCENE', 'OCR', 'VOICE', 'PEOPLE'];
      const nextIndex = diffX > 0 
        ? (modes.indexOf(currentMode) + 1) % modes.length 
        : (modes.indexOf(currentMode) - 1 + modes.length) % modes.length;
      const nextMode = modes[nextIndex];
      setCurrentMode(nextMode);
      const modeName = language === 'hi' 
        ? (nextMode === 'SCENE' ? 'दृश्य मोड' : nextMode === 'OCR' ? 'पर्ची और टेक्स्ट मोड' : nextMode === 'PEOPLE' ? 'लोग और भाव मोड' : 'आवाज मोड')
        : `${nextMode} Mode Selected`;
      speechEngine.speak(modeName);
      touchStartRef.current = null;
      return;
    }

    // Long Press (Hold > 600ms): Voice Ask
    if (duration > 600 && Math.abs(diffX) < 20 && Math.abs(diffY) < 20) {
      haptics.warning();
      audioSynth.playMicListeningCue();
      speechEngine.speak(language === 'hi' ? 'मैं सुन रहा हूँ, पूछिए।' : 'Listening, please ask your question.', () => {
        speechEngine.startListening();
      });
      touchStartRef.current = null;
      return;
    }

    // Tap Handling (Single, Double, Triple Tap)
    if (Math.abs(diffX) < 20 && Math.abs(diffY) < 20) {
      tapCountRef.current += 1;

      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }

      tapTimeoutRef.current = window.setTimeout(() => {
        const count = tapCountRef.current;
        tapCountRef.current = 0;

        if (count === 1) {
          // Single Tap: Spatial Obstacle Radar Announcement
          haptics.tap();
          audioSynth.playClickCue();
          announceRadarObstacles();
        } else if (count === 2) {
          // Double Tap: Full Scene Description
          triggerMultimodalAnalysis('SCENE');
        } else if (count >= 3) {
          // Triple Tap: SOS Trigger
          setIsSOSOpen(true);
        }
      }, 280);
    }

    touchStartRef.current = null;
  };

  // Announce current detected obstacles in plain language
  const announceRadarObstacles = () => {
    if (obstacles.length === 0) {
      const msg = language === 'hi' 
        ? 'सामने का रास्ता साफ है, कोई रुकावट नहीं मिली।'
        : 'Path ahead is clear. No obstacles detected.';
      speechEngine.speak(msg);
      return;
    }

    const descriptions = obstacles.map(o => {
      if (language === 'hi') {
        const pos = o.position === 'Left' ? 'बाईं ओर' : o.position === 'Right' ? 'दाईं ओर' : 'सामने केंद्र में';
        return `${pos} ${o.distance} पर ${o.label}`;
      }
      return `${o.label} ${o.distance} on your ${o.position.toLowerCase()}`;
    });

    const radarSummary = language === 'hi'
      ? `रुकावटें: ${descriptions.join(', ')}`
      : `Obstacles: ${descriptions.join(', ')}`;

    speechEngine.speak(radarSummary);
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="bg-surface-container-lowest text-on-surface font-sans min-h-screen flex flex-col pt-[75px] pb-[100px] antialiased selection:bg-primary-fixed selection:text-on-primary-fixed select-none"
    >
      {/* Top App Bar with High Contrast Status */}
      <TopHeader
        language={language}
        voiceState={voiceState}
        onToggleLanguage={() => {
          const nextLang = language === 'en' ? 'hi' : 'en';
          setLanguage(nextLang);
          speechEngine.setLanguage(nextLang);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleMute={() => {
          const next = !isMuted;
          setIsMuted(next);
          audioSynth.setMuted(next);
        }}
        isMuted={isMuted}
      />

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col px-4 md:px-6 gap-4 max-w-2xl mx-auto w-full">
        {/* Spatial HUD Viewfinder */}
        <SpatialHUD
          ref={hudRef}
          obstacles={obstacles}
          onObstaclesDetected={setObstacles}
          isFlashlightOn={isFlashlightOn}
          cameraFacingMode={cameraFacingMode}
          onToggleTorch={() => setIsFlashlightOn(!isFlashlightOn)}
          onTapViewfinder={announceRadarObstacles}
        />

        {/* Live Spoken Subtitle Caption Bar */}
        <CaptionBar
          caption={caption}
          voiceState={voiceState}
          onRepeat={() => speechEngine.repeatLast()}
        />

        {/* Primary 4-Button Tactile Action Grid */}
        <TactileActionGrid
          currentMode={currentMode}
          isProcessing={isProcessingAI}
          onSelectAction={(mode) => {
            setCurrentMode(mode);
            triggerMultimodalAnalysis(mode);
          }}
        />

        {/* Big Orange Emergency SOS Section */}
        <section className="mt-2 pt-2">
          <button
            onClick={() => {
              haptics.sos();
              setIsSOSOpen(true);
            }}
            aria-label="Emergency SOS. Trigger emergency loud alarm and GPS broadcast."
            className="w-full min-h-[72px] bg-brand-amber text-surface-container-lowest font-headline-md text-[24px] font-black rounded-full flex items-center justify-center gap-4 focus:outline-none focus:ring-6 focus:ring-brand-amber focus:ring-offset-4 focus:ring-offset-surface-container-lowest active:scale-95 transition-transform shadow-[0_0_0_3px_#FFA500] select-none"
          >
            <span aria-hidden="true" className="material-symbols-outlined text-[36px] fill">
              emergency
            </span>
            EMERGENCY SOS
          </button>
        </section>
      </main>

      {/* Fixed Bottom Global Navigation Bar */}
      <BottomNavBar
        currentTab={isSOSOpen ? 'SOS' : 'SCAN'}
        onSelectTab={(tab) => {
          if (tab === 'SOS') setIsSOSOpen(true);
          else setIsSOSOpen(false);
        }}
      />

      {/* Emergency SOS Modal */}
      <EmergencySOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
      />

      {/* Settings & Accessibility Controls Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        cameraFacingMode={cameraFacingMode}
        onToggleCameraFacing={() => {
          setCameraFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
        }}
      />
    </div>
  );
};

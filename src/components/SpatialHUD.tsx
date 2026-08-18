import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { DetectedObstacle } from '../types';
import { cvDetector } from '../services/cvDetector';

export interface SpatialHUDHandle {
  captureCurrentFrame: () => string;
}

interface SpatialHUDProps {
  obstacles: DetectedObstacle[];
  onObstaclesDetected: (obstacles: DetectedObstacle[]) => void;
  isFlashlightOn: boolean;
  cameraFacingMode: 'environment' | 'user';
  onToggleTorch: () => void;
  onTapViewfinder?: () => void;
}

export const SpatialHUD = forwardRef<SpatialHUDHandle, SpatialHUDProps>(({
  obstacles,
  onObstaclesDetected,
  isFlashlightOn,
  cameraFacingMode,
  onToggleTorch,
  onTapViewfinder
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraStream, setHasCameraStream] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedDemoScene, setSelectedDemoScene] = useState<number>(0);

  // Demo environments for simulation if camera is unavailable or for testing
  const demoScenes = [
    {
      name: 'Hallway & Chair',
      image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
      description: 'A hallway with a chair on the left and doorway ahead.'
    },
    {
      name: 'Medicine Prescription',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
      description: 'Medical prescription bottle with dosage labels.'
    },
    {
      name: 'Street Crossing',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
      description: 'Crosswalk with pedestrians and street signs.'
    }
  ];

  // Expose frame capture to parent component for GenAI
  useImperativeHandle(ref, () => ({
    captureCurrentFrame: () => {
      const canvas = document.createElement('canvas');
      if (videoRef.current && hasCameraStream) {
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.8);
        }
      }
      
      // Fallback: draw current demo image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = demoScenes[selectedDemoScene].image;
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1b1b1b';
        ctx.fillRect(0, 0, 640, 480);
      }
      return canvas.toDataURL('image/jpeg', 0.8);
    }
  }));

  // Initialize camera stream with robust multi-constraint fallbacks
  const startCamera = async () => {
    try {
      setCameraError(null);
      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: cameraFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (e) {
        // Fallback to any available video camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
      }

      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
        setHasCameraStream(true);
      }
    } catch (err: unknown) {
      console.warn('Camera access could not be acquired directly:', err);
      setHasCameraStream(false);
      setCameraError('Tap here to grant camera access for real-time vision.');
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraFacingMode]);

  // Handle flashlight torch track
  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      if (track && 'applyConstraints' in track) {
        const capabilities = track.getCapabilities() as { torch?: boolean };
        if (capabilities.torch) {
          (track as unknown as { applyConstraints: (c: { advanced: [{ torch: boolean }] }) => void }).applyConstraints({
            advanced: [{ torch: isFlashlightOn }]
          });
        }
      }
    }
  }, [isFlashlightOn]);

  // Real-time obstacle detection loop
  useEffect(() => {
    let animationFrameId: number;
    let isDetecting = false;

    const runDetection = async () => {
      if (isDetecting) return;
      isDetecting = true;

      try {
        if (hasCameraStream && videoRef.current && videoRef.current.readyState >= 2) {
          const results = await cvDetector.detectObstacles(videoRef.current);
          onObstaclesDetected(results);
        } else {
          // Simulation detections
          const simObstacles: DetectedObstacle[] = [
            {
              id: 'sim-chair',
              label: 'Chair',
              confidence: 94,
              bbox: [40, 80, 140, 180],
              distance: '1.2m',
              rawDistanceMeters: 1.2,
              position: 'Left',
              isHazard: true,
              category: 'furniture'
            },
            {
              id: 'sim-person',
              label: 'Person',
              confidence: 89,
              bbox: [180, 100, 120, 240],
              distance: '2.0m',
              rawDistanceMeters: 2.0,
              position: 'Center',
              isHazard: false,
              category: 'person'
            }
          ];
          onObstaclesDetected(simObstacles);
        }
      } catch (err) {
        // detection cycle error handled
      } finally {
        isDetecting = false;
      }
    };

    const intervalId = setInterval(runDetection, 600);

    return () => {
      clearInterval(intervalId);
    };
  }, [hasCameraStream, selectedDemoScene]);

  return (
    <section 
      aria-label="Live camera viewfinder with spatial awareness tags"
      onClick={onTapViewfinder}
      className="relative w-full h-[360px] md:h-[400px] border-3 border-primary-fixed rounded-xl overflow-hidden bg-surface-container flex flex-col shadow-2xl select-none"
    >
      {/* Video Stream or Demo Feed */}
      <div className="absolute inset-0 bg-surface-dim z-0 overflow-hidden flex items-center justify-center">
        {hasCameraStream ? (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full">
            <img
              src={demoScenes[selectedDemoScene].image}
              alt="High contrast scene"
              className="w-full h-full object-cover filter contrast-125 brightness-90"
            />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#fde40015_1px,transparent_1px),linear-gradient(to_bottom,#fde40015_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/40 z-10 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startCamera();
                }}
                className="bg-primary-fixed text-on-primary-fixed font-headline-md text-base md:text-lg font-black px-5 py-2.5 rounded-full border-2 border-white shadow-2xl flex items-center gap-2 active:scale-95 animate-bounce"
              >
                <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                TAP TO ACTIVATE REAL CAMERA
              </button>
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Top HUD Controls Overlay */}
      <div className="relative z-20 flex justify-between items-center p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-fixed opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-fixed"></span>
          </span>
          <span className="text-[13px] font-extrabold uppercase tracking-wider text-primary-fixed bg-surface-container-lowest/80 px-2 py-0.5 rounded border border-primary-fixed/40">
            {hasCameraStream ? 'LIVE OPTICAL FEED' : 'RADAR SIMULATOR'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!hasCameraStream && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDemoScene((prev) => (prev + 1) % demoScenes.length);
              }}
              className="text-xs font-bold bg-surface-container-high text-primary-fixed border border-primary-fixed/60 px-2 py-1 rounded"
              aria-label="Change Demo Scene"
            >
              Scene: {demoScenes[selectedDemoScene].name}
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleTorch();
            }}
            aria-label="Toggle Flashlight Torch"
            className={`p-2 rounded-md border-2 ${isFlashlightOn ? 'bg-primary-fixed text-on-primary-fixed border-primary-fixed' : 'bg-surface-container-lowest/80 text-primary-fixed border-primary-fixed/60'}`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isFlashlightOn ? 'flashlight_on' : 'flashlight_off'}
            </span>
          </button>
        </div>
      </div>

      {/* Real-time Bounding Boxes & Distance Badges */}
      <div className="relative z-10 flex-grow p-4 pointer-events-none">
        {obstacles.map((obs) => {
          const isLeft = obs.position === 'Left';
          const isRight = obs.position === 'Right';
          const leftPos = isLeft ? '12%' : isRight ? '60%' : '35%';
          const topPos = obs.category === 'furniture' ? '25%' : '20%';

          return (
            <div
              key={obs.id}
              aria-hidden="true"
              style={{ left: leftPos, top: topPos }}
              className={`absolute border-4 ${obs.isHazard ? 'border-brand-amber' : 'border-primary-fixed'} p-1 rounded-sm shadow-[0_0_0_3px_#0e0e0e] transition-all duration-300 animate-pulse`}
            >
              {/* High Contrast Distance Tag */}
              <div className="bg-surface-container-lowest text-primary-fixed font-label-md text-[16px] md:text-[18px] font-extrabold px-3 py-1 -mt-10 border-2 border-primary-fixed shadow-[0_0_0_2px_#0e0e0e] whitespace-nowrap flex items-center gap-1.5 rounded">
                <span className="material-symbols-outlined text-[20px]">
                  {obs.category === 'furniture' ? 'chair' : obs.category === 'person' ? 'directions_walk' : 'warning'}
                </span>
                <span>
                  {obs.label} {obs.distance} {obs.position}
                </span>
              </div>
              <div className="w-[110px] md:w-[130px] h-[140px] md:h-[180px] border-2 border-transparent" />
            </div>
          );
        })}
      </div>

      {/* Crosshairs & Center Guide */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
        <div className="w-12 h-12 border-2 border-primary-fixed rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-primary-fixed rounded-full" />
        </div>
      </div>
    </section>
  );
});

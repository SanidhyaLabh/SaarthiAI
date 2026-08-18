export type AppMode = 'SCENE' | 'OCR' | 'VOICE' | 'PEOPLE' | 'RADAR' | 'SOS';

export type Language = 'en' | 'hi';

export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';

export type SpatialPosition = 'Left' | 'Center' | 'Right';

export interface DetectedObstacle {
  id: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  distance: string; // e.g. "1.2m"
  rawDistanceMeters: number;
  position: SpatialPosition;
  isHazard: boolean;
  category: 'furniture' | 'person' | 'vehicle' | 'trip_hazard' | 'structure' | 'general';
}

export interface VisionAnalysisResult {
  mode: AppMode;
  headline: string;
  details: string;
  simplifiedInstructions?: string[];
  hazards?: string[];
  emotionsDetected?: string[];
  timestamp: number;
}

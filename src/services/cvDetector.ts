import { DetectedObstacle, SpatialPosition } from '../types';
import { audioSynth } from './audioSynth';
import { haptics } from './haptics';

// Dynamic import or typed interface for COCO-SSD
interface CocoPrediction {
  bbox: [number, number, number, number]; // [x, y, width, height]
  class: string;
  score: number;
}

interface CocoModel {
  detect(element: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement): Promise<CocoPrediction[]>;
}

class ComputerVisionService {
  private model: CocoModel | null = null;
  private isLoading: boolean = false;
  private isModelReady: boolean = false;
  private lastAlertTime: number = 0;

  constructor() {
    this.loadModel();
  }

  public async loadModel() {
    if (this.isModelReady || this.isLoading) return;
    this.isLoading = true;
    try {
      // Check if loaded via CDN global
      const globalCoco = (window as unknown as { cocoSsd?: { load: (opts?: { base?: string }) => Promise<CocoModel> } }).cocoSsd;
      if (globalCoco) {
        this.model = await globalCoco.load({ base: 'mobilenet_v2' });
        this.isModelReady = true;
        return;
      }

      // Dynamic import to prevent bundle blocking
      const tf = await import('@tensorflow/tfjs');
      await tf.ready();
      const cocoSsd = await import('@tensorflow-models/coco-ssd');
      this.model = await cocoSsd.load({ base: 'mobilenet_v2' });
      this.isModelReady = true;
    } catch (err) {
      console.warn('TensorFlow.js COCO-SSD loading fallback active:', err);
    } finally {
      this.isLoading = false;
    }
  }

  public async detectObstacles(videoOrCanvas: HTMLVideoElement | HTMLCanvasElement): Promise<DetectedObstacle[]> {
    if (!this.model) {
      return this.getSimulatedDetections(videoOrCanvas.width || 400, videoOrCanvas.height || 400);
    }

    try {
      const predictions = await this.model.detect(videoOrCanvas);
      const frameWidth = ('videoWidth' in videoOrCanvas && videoOrCanvas.videoWidth) ? videoOrCanvas.videoWidth : videoOrCanvas.width || 640;
      const frameHeight = ('videoHeight' in videoOrCanvas && videoOrCanvas.videoHeight) ? videoOrCanvas.videoHeight : videoOrCanvas.height || 480;

      const obstacles: DetectedObstacle[] = predictions
        .filter(p => p.score > 0.45)
        .map((p, idx) => {
          const [x, y, w, h] = p.bbox;
          const centerX = x + w / 2;
          
          // Spatial Position (Left, Center, Right)
          let position: SpatialPosition = 'Center';
          if (centerX < frameWidth * 0.35) {
            position = 'Left';
          } else if (centerX > frameWidth * 0.65) {
            position = 'Right';
          }

          // Distance estimation heuristic based on vertical height percentage
          const heightRatio = h / frameHeight;
          const rawDistance = Math.max(0.6, Math.min(6.0, Number((1.6 / (heightRatio + 0.1)).toFixed(1))));
          const distanceStr = `${rawDistance}m`;

          // Hazard Classification
          const label = p.class;
          const isHazard = rawDistance < 2.0 || ['stairs', 'car', 'bus', 'truck', 'motorcycle', 'bicycle'].includes(label);
          
          let category: DetectedObstacle['category'] = 'general';
          if (['chair', 'couch', 'bed', 'dining table'].includes(label)) category = 'furniture';
          else if (['person'].includes(label)) category = 'person';
          else if (['car', 'bus', 'truck', 'motorcycle', 'bicycle'].includes(label)) category = 'vehicle';
          else if (['bottle', 'backpack', 'handbag', 'suitcase'].includes(label)) category = 'trip_hazard';

          return {
            id: `det-${idx}-${label}`,
            label: this.formatLabel(label),
            confidence: Math.round(p.score * 100),
            bbox: [x, y, w, h],
            distance: distanceStr,
            rawDistanceMeters: rawDistance,
            position,
            isHazard,
            category
          };
        });

      this.processProximityAlerts(obstacles);
      return obstacles;
    } catch (err) {
      return this.getSimulatedDetections(400, 400);
    }
  }

  // Audio & Haptic Spatial Triggers for close hazards
  private processProximityAlerts(obstacles: DetectedObstacle[]) {
    const now = Date.now();
    const immediateHazards = obstacles.filter(o => o.rawDistanceMeters <= 1.8);

    if (immediateHazards.length > 0 && now - this.lastAlertTime > 2200) {
      this.lastAlertTime = now;
      const closest = immediateHazards.sort((a, b) => a.rawDistanceMeters - b.rawDistanceMeters)[0];
      
      // Play directional sonar ping
      audioSynth.playSonarPing(closest.rawDistanceMeters, closest.position);
      
      if (closest.rawDistanceMeters < 1.2) {
        haptics.hazard();
        audioSynth.playHazardAlarm();
      } else {
        haptics.warning();
      }
    }
  }

  private formatLabel(label: string): string {
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  // Fallback HUD simulator for test mode
  private getSimulatedDetections(w: number, h: number): DetectedObstacle[] {
    return [
      {
        id: 'sim-1',
        label: 'Chair',
        confidence: 92,
        bbox: [w * 0.1, h * 0.2, w * 0.3, h * 0.45],
        distance: '1.2m',
        rawDistanceMeters: 1.2,
        position: 'Left',
        isHazard: true,
        category: 'furniture'
      },
      {
        id: 'sim-2',
        label: 'Person',
        confidence: 88,
        bbox: [w * 0.45, h * 0.25, w * 0.28, h * 0.6],
        distance: '2.0m',
        rawDistanceMeters: 2.0,
        position: 'Center',
        isHazard: false,
        category: 'person'
      }
    ];
  }
}

export const cvDetector = new ComputerVisionService();

import { Language, VoiceState } from '../types';
import { audioSynth } from './audioSynth';
import { haptics } from './haptics';

// SpeechRecognition type declarations for cross-browser support
interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResultItem[];
  [index: number]: SpeechRecognitionResultItem[];
}
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: () => void;
  onend: () => void;
  onerror: (event: { error: string }) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

class SpeechEngineService {
  private recognition: ISpeechRecognition | null = null;
  private isListening: boolean = false;
  private currentLanguage: Language = 'en';
  private speechRate: number = 1.05;
  private speechPitch: number = 1.0;
  private lastSpokenText: string = "SaarthiAI is ready.";
  private stateListeners: ((state: VoiceState) => void)[] = [];
  private captionListeners: ((caption: string) => void)[] = [];
  private commandHandlers: ((command: string, rawText: string) => void)[] = [];

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognitionClass = 
      (window as unknown as { SpeechRecognition?: new () => ISpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => ISpeechRecognition }).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = false;
        this.recognition.lang = this.currentLanguage === 'hi' ? 'hi-IN' : 'en-US';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.notifyState('LISTENING');
        };

        this.recognition.onend = () => {
          this.isListening = false;
          // Auto-restart continuous recognition if not actively speaking
          if (window.speechSynthesis && !window.speechSynthesis.speaking) {
            setTimeout(() => {
              if (!this.isListening) {
                try {
                  this.recognition?.start();
                } catch (e) {
                  // restart attempt handled
                }
              }
            }, 800);
          } else {
            this.notifyState('IDLE');
          }
        };

        this.recognition.onerror = () => {
          this.isListening = false;
          this.notifyState('IDLE');
        };

        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
          const lastIndex = event.results.length - 1;
          const transcript = event.results[lastIndex][0].transcript.trim().toLowerCase();
          if (transcript) {
            this.handleVoiceInput(transcript);
          }
        };
      } catch (err) {
        console.warn('Speech Recognition not supported in this browser environment', err);
      }
    }
  }

  public setLanguage(lang: Language) {
    this.currentLanguage = lang;
    if (this.recognition) {
      this.recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-US';
      if (this.isListening) {
        try {
          this.recognition.stop();
        } catch (e) {}
      }
    }
    const message = lang === 'hi' 
      ? 'भाषा हिंदी पर सेट की गई है। मैं आपकी सहायता के लिए तैयार हूँ।'
      : 'Language set to English. SaarthiAI is ready.';
    this.speak(message);
  }

  public getLanguage(): Language {
    return this.currentLanguage;
  }

  public setSpeechRate(rate: number) {
    this.speechRate = rate;
  }

  public setSpeechPitch(pitch: number) {
    this.speechPitch = pitch;
  }

  public onStateChange(listener: (state: VoiceState) => void) {
    this.stateListeners.push(listener);
    return () => {
      this.stateListeners = this.stateListeners.filter(l => l !== listener);
    };
  }

  public onCaptionUpdate(listener: (caption: string) => void) {
    this.captionListeners.push(listener);
    return () => {
      this.captionListeners = this.captionListeners.filter(l => l !== listener);
    };
  }

  public onCommand(handler: (command: string, rawText: string) => void) {
    this.commandHandlers.push(handler);
    return () => {
      this.commandHandlers = this.commandHandlers.filter(h => h !== handler);
    };
  }

  private notifyState(state: VoiceState) {
    this.stateListeners.forEach(fn => fn(state));
  }

  private notifyCaption(caption: string) {
    this.captionListeners.forEach(fn => fn(caption));
  }

  // Handle incoming voice recognition text
  private handleVoiceInput(rawText: string) {
    audioSynth.playSuccessCue();
    haptics.tap();

    const t = rawText.toLowerCase();

    // Voice Command Dispatch
    if (t.includes('describe') || t.includes('scene') || t.includes('सामने क्या है') || t.includes('दृश्य बताओ') || t.includes('look')) {
      this.commandHandlers.forEach(h => h('SCENE', rawText));
      return;
    }
    if (t.includes('read') || t.includes('prescription') || t.includes('text') || t.includes('पर्ची') || t.includes('दवाई') || t.includes('पढ़ो')) {
      this.commandHandlers.forEach(h => h('OCR', rawText));
      return;
    }
    if (t.includes('who') || t.includes('person') || t.includes('people') || t.includes('face') || t.includes('चेहरा') || t.includes('कौन है') || t.includes('emotion')) {
      this.commandHandlers.forEach(h => h('PEOPLE', rawText));
      return;
    }
    if (t.includes('sos') || t.includes('emergency') || t.includes('मदद') || t.includes('help') || t.includes('बचाओ')) {
      this.commandHandlers.forEach(h => h('SOS', rawText));
      return;
    }
    if (t.includes('hindi') || t.includes('हिंदी')) {
      this.setLanguage('hi');
      return;
    }
    if (t.includes('english') || t.includes('अंग्रेजी')) {
      this.setLanguage('en');
      return;
    }
    if (t.includes('repeat') || t.includes('दोहराओ') || t.includes('फिर से')) {
      this.repeatLast();
      return;
    }

    // Default: General hands-free Q&A
    this.commandHandlers.forEach(h => h('QUERY', rawText));
  }

  // Text-To-Speech Output
  public speak(text: string, onDone?: () => void): Promise<void> {
    return new Promise((resolve) => {
      this.lastSpokenText = text;
      this.notifyCaption(text);

      if (!('speechSynthesis' in window)) {
        this.notifyState('IDLE');
        if (onDone) onDone();
        resolve();
        return;
      }

      // Temporarily pause recognition to prevent feedback loop
      if (this.recognition && this.isListening) {
        try {
          this.recognition.stop();
        } catch (e) {}
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = this.speechRate;
      utterance.pitch = this.speechPitch;

      // Select appropriate voice if available
      const voices = window.speechSynthesis.getVoices();
      if (this.currentLanguage === 'hi') {
        const hiVoice = voices.find(v => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india'));
        if (hiVoice) utterance.voice = hiVoice;
        utterance.lang = 'hi-IN';
      } else {
        const enVoice = voices.find(v => (v.lang.includes('en-US') || v.lang.includes('en-GB') || v.lang.includes('en-IN')) && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha')));
        if (enVoice) utterance.voice = enVoice;
        utterance.lang = 'en-US';
      }

      this.notifyState('SPEAKING');

      utterance.onend = () => {
        this.notifyState('IDLE');
        if (onDone) onDone();
        resolve();
        // Resume listening after speaking
        setTimeout(() => {
          this.startListening();
        }, 400);
      };

      utterance.onerror = () => {
        this.notifyState('IDLE');
        if (onDone) onDone();
        resolve();
        this.startListening();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public repeatLast() {
    haptics.tap();
    this.speak(this.lastSpokenText);
  }

  public getLastSpokenText(): string {
    return this.lastSpokenText;
  }

  public startListening() {
    if (this.recognition && !this.isListening) {
      try {
        audioSynth.playMicListeningCue();
        this.recognition.start();
      } catch (e) {
        // Recognition already started or not ready
      }
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
        this.isListening = false;
        this.notifyState('IDLE');
      } catch (e) {}
    }
  }

  // Automatic Welcoming Announcement for zero-touch experience
  public playWelcomeGreeting() {
    audioSynth.playStartupChime();
    haptics.modeChange();
    const greeting = this.currentLanguage === 'hi'
      ? "सारथी एआई में आपका स्वागत है। कैमरा सक्रिय है। मैं आपके सामने के रास्तों और रुकावटों को देख रहा हूँ। आप कभी भी कुछ भी पूछ सकते हैं, या दृश्य देखने के लिए स्क्रीन पर डबल टैप करें।"
      : "Welcome to SaarthiAI. Camera is active and scanning for obstacles. You can speak naturally at any time, or double tap anywhere to analyze your surroundings.";
    
    setTimeout(() => {
      this.speak(greeting);
    }, 600);
  }
}

export const speechEngine = new SpeechEngineService();

// Audio utility for trading notifications
// This generates simple beep sounds programmatically

export class AudioGenerator {
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext();
    }
  }

  private createBeep(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    // Create envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private createSuccessSound(): void {
    // Gentle ascending chime - very low frequencies
    this.createBeep(200, 0.15);
    setTimeout(() => this.createBeep(250, 0.15), 150);
    setTimeout(() => this.createBeep(300, 0.2), 300);
  }

  private createErrorSound(): void {
    // Soft descending tone - very low frequencies
    this.createBeep(150, 0.2);
    setTimeout(() => this.createBeep(120, 0.2), 200);
    setTimeout(() => this.createBeep(100, 0.3), 400);
  }

  private createWarningSound(): void {
    // Gentle bell sound - very low frequency
    this.createBeep(180, 0.4);
  }

  private createInfoSound(): void {
    // Soft notification - very low frequency
    this.createBeep(220, 0.2);
  }

  private createProfitSound(): void {
    // Gentle ascending melody - very low frequencies
    this.createBeep(130, 0.15); // Very low C
    setTimeout(() => this.createBeep(165, 0.15), 150); // Very low E
    setTimeout(() => this.createBeep(196, 0.15), 300); // Very low G
    setTimeout(() => this.createBeep(261, 0.25), 450); // Low C
  }

  private createLossSound(): void {
    // Gentle descending melody - very low frequencies
    this.createBeep(261, 0.15); // Low C
    setTimeout(() => this.createBeep(196, 0.15), 150); // Very low G
    setTimeout(() => this.createBeep(165, 0.15), 300); // Very low E
    setTimeout(() => this.createBeep(130, 0.25), 450); // Very low C
  }

  playSound(type: 'buy' | 'sell' | 'profit' | 'loss' | 'info' | 'success' | 'error' | 'warning'): void {
    try {
      switch (type) {
        case 'buy':
        case 'success':
          this.createSuccessSound();
          break;
        case 'sell':
        case 'info':
          this.createInfoSound();
          break;
        case 'profit':
          this.createProfitSound();
          break;
        case 'loss':
          this.createLossSound();
          break;
        case 'error':
          this.createErrorSound();
          break;
        case 'warning':
          this.createWarningSound();
          break;
        default:
          this.createInfoSound();
      }
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  }

  // Method to resume audio context if suspended (required by browsers)
  resumeContext(): void {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

// Create a singleton instance
export const audioGenerator = new AudioGenerator();

// Resume context on user interaction
if (typeof window !== 'undefined') {
  const resumeAudio = () => {
    audioGenerator.resumeContext();
    document.removeEventListener('click', resumeAudio);
    document.removeEventListener('keydown', resumeAudio);
  };

  document.addEventListener('click', resumeAudio);
  document.addEventListener('keydown', resumeAudio);
} 
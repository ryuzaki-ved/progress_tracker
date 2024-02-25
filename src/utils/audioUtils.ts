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
    // Two ascending beeps
    this.createBeep(800, 0.1);
    setTimeout(() => this.createBeep(1000, 0.1), 100);
    setTimeout(() => this.createBeep(1200, 0.2), 200);
  }

  private createErrorSound(): void {
    // Two descending beeps
    this.createBeep(600, 0.1);
    setTimeout(() => this.createBeep(400, 0.1), 100);
    setTimeout(() => this.createBeep(200, 0.2), 200);
  }

  private createWarningSound(): void {
    // Medium pitch beep
    this.createBeep(500, 0.3);
  }

  private createInfoSound(): void {
    // Single short beep
    this.createBeep(700, 0.15);
  }

  private createProfitSound(): void {
    // Ascending arpeggio
    this.createBeep(523, 0.1); // C
    setTimeout(() => this.createBeep(659, 0.1), 100); // E
    setTimeout(() => this.createBeep(784, 0.1), 200); // G
    setTimeout(() => this.createBeep(1047, 0.2), 300); // C (high)
  }

  private createLossSound(): void {
    // Descending arpeggio
    this.createBeep(1047, 0.1); // C (high)
    setTimeout(() => this.createBeep(784, 0.1), 100); // G
    setTimeout(() => this.createBeep(659, 0.1), 200); // E
    setTimeout(() => this.createBeep(523, 0.2), 300); // C
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
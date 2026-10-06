// Sound System using Web Audio API
class AudioSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;

    // Attach user gesture unlocks so browser audio policy doesn't block Web Audio
    const unlock = () => {
      this.init();
      if (this.ctx && this.ctx.state === 'running') {
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
        window.removeEventListener('click', unlock);
      }
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('click', unlock);
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.1, vol = 0.15) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playBuy() {
    this.playTone(523.25, 'square', 0.08, 0.1); // C5
    setTimeout(() => this.playTone(659.25, 'square', 0.12, 0.1), 80); // E5
  }

  playAssemble() {
    this.playTone(220 + Math.random() * 80, 'triangle', 0.05, 0.12);
  }

  playOsInstall() {
    this.playTone(440, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(554.37, 'sine', 0.1, 0.1), 100);
    setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.12), 200);
  }

  playListSale() {
    this.playTone(880, 'sine', 0.06, 0.08);
    setTimeout(() => this.playTone(1760, 'sine', 0.08, 0.08), 60);
  }

  playBox() {
    this.playTone(150, 'sawtooth', 0.08, 0.15);
  }

  playVanArrive() {
    this.playTone(180, 'sawtooth', 0.25, 0.15);
    setTimeout(() => this.playTone(240, 'sawtooth', 0.35, 0.15), 150);
  }

  playCashPayout() {
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.15, 0.15), i * 70);
    });
  }

  playPhoneRing() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Double pulse bell ring (realistic vintage rotary phone ringer)
      [0, 0.1, 0.2, 0.4, 0.5, 0.6].forEach((delay) => {
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'square';
        osc2.type = 'square';
        osc1.frequency.setValueAtTime(850, now + delay);
        osc2.frequency.setValueAtTime(1060, now + delay);

        gain.gain.setValueAtTime(0.12, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now + delay);
        osc2.start(now + delay);
        osc1.stop(now + delay + 0.08);
        osc2.stop(now + delay + 0.08);
      });
    } catch (e) {
      console.warn("Phone ring audio error:", e);
    }
  }

  playPhoneAnswer() {
    this.playTone(600, 'sine', 0.05, 0.15);
    setTimeout(() => this.playTone(400, 'sine', 0.08, 0.15), 50);
  }

  playStarBonus() {
    const freqs = [659.25, 783.99, 987.77, 1318.51];
    freqs.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.12, 0.15), i * 60);
    });
  }

  playPenalty() {
    this.playTone(200, 'sawtooth', 0.2, 0.2);
    setTimeout(() => this.playTone(130, 'sawtooth', 0.3, 0.2), 150);
  }
}

window.soundSystem = new AudioSystem();

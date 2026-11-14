import { AmmoId } from '../types/game';

class SoundController {
  private ctx: AudioContext | null = null;
  public enabled = true;

  private getContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playShot(ammoId: AmmoId) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (ammoId === 'laser') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(780, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.065);
        gain.gain.setValueAtTime(0.038, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
      } else if (ammoId === 'plasma') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.1);
        gain.gain.setValueAtTime(0.055, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      } else if (ammoId === 'cryo') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(560, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.08);
        gain.gain.setValueAtTime(0.042, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(940, now);
        osc.frequency.exponentialRampToValueAtTime(420, now + 0.06);
        gain.gain.setValueAtTime(0.032, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);
    } catch {
      // Ignore audio errors
    }
  }

  playEnemyDown(isMeteor = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isMeteor ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(isMeteor ? 160 : 300, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.14);

      gain.gain.setValueAtTime(0.068, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore
    }
  }

  playStarCollect() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(1120, now + 0.09);

      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  playPowerUp() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // Ignore
    }
  }

  playDamage(shieldBlocked = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = shieldBlocked ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(shieldBlocked ? 520 : 180, now);
      osc.frequency.exponentialRampToValueAtTime(
        shieldBlocked ? 240 : 50,
        now + 0.22
      );

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } catch {
      // Ignore
    }
  }

  playBossAlert() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(310, now + 0.15);
      osc.frequency.setValueAtTime(220, now + 0.3);

      gain.gain.setValueAtTime(0.075, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.46);
    } catch {
      // Ignore
    }
  }

  playBossDefeatedFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.075, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      });
    } catch {
      // Ignore
    }
  }

  playVictoryFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // Nhạc kèn chiến thắng huy hoàng
      const melody = [
        { freq: 523.25, delay: 0, dur: 0.16 },
        { freq: 523.25, delay: 0.18, dur: 0.16 },
        { freq: 523.25, delay: 0.36, dur: 0.16 },
        { freq: 659.25, delay: 0.54, dur: 0.32 },
        { freq: 587.33, delay: 0.9, dur: 0.22 },
        { freq: 659.25, delay: 1.15, dur: 0.22 },
        { freq: 783.99, delay: 1.4, dur: 0.45 },
        { freq: 1046.5, delay: 1.9, dur: 0.65 },
      ];
      melody.forEach((n) => {
        const start = ctx.currentTime + n.delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.freq, start);
        gain.gain.setValueAtTime(0.09, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + n.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + n.dur + 0.02);
      });
    } catch {
      // Ignore
    }
  }

  playFireworkPop() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420 + Math.random() * 380, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.15);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore
    }
  }
}

export const soundFX = new SoundController();

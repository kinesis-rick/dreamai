/* Hellpang - Custom WAV Audio SFX & BGM Manager */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmVolume = 0.5;
    this.sfxVolume = 0.7;

    this.lastStageTrack = null;
    this.isDucked = false;
    this.bgmTracks = {
      title: 'audio/title.mp3',
      menu: 'audio/menu.mp3',
      witch: 'audio/witch.mp3',
      boss: 'audio/boss.mp3',
      gameover: 'audio/gameover.mp3'
    };

    // Stage Music Library Pool (Populated dynamically from /audio/music/ folder)
    this.stageLibrary = [
      { id: 'm_stage1', path: 'audio/music/stage1.mp3' },
      { id: 'm_stage2', path: 'audio/music/stage2.mp3' },
      { id: 'r_stage1', path: 'audio/stage1.mp3' },
      { id: 'r_stage2', path: 'audio/stage2.mp3' }
    ];

    this.scanMusicFolder();

    // Preloaded WAV SFX Audio Elements from /audio folder
    this.sfxWav = {
      pop: new Audio('audio/pop.wav'),
      swish: new Audio('audio/swish.wav'),
      bobaSqueak: new Audio('audio/boba_squeak.wav'),
      crystal: new Audio('audio/crystal.wav'),
      splash: new Audio('audio/splash.wav'),
      warning: new Audio('audio/warning.wav'),
      bobaCry: new Audio('audio/boba_cry.wav'),
      bobaEnrage: new Audio('audio/boba_enrage.wav'),
      witchLaugh: new Audio('audio/witch_laugh.wav')
    };
  }

  isReservedTrack(filePath) {
    if (!filePath) return false;
    const lower = filePath.toLowerCase();
    return lower.includes('witch.mp3') ||
           lower.includes('boss.mp3') ||
           lower.includes('title.mp3') ||
           lower.includes('menu.mp3') ||
           lower.includes('gameover.mp3');
  }

  scanMusicFolder() {
    // 1. Fetch audio/music/playlist.json manifest if present
    fetch('audio/music/playlist.json')
      .then(res => res.json())
      .then(list => {
        if (Array.isArray(list)) {
          list.forEach((filePath, idx) => {
            if (this.isReservedTrack(filePath)) return;
            const trackId = 'json_music_' + idx;
            this.bgmTracks[trackId] = filePath;
            if (!this.stageLibrary.some(item => item.path === filePath)) {
              this.stageLibrary.push({ id: trackId, path: filePath });
            }
          });
        }
      })
      .catch(() => {});

    // 2. Auto-probe stage1..stage30, track1..track30, music1..music30 in audio/music/
    const probePrefixes = [
      'audio/music/stage', 'audio/music/track', 'audio/music/music', 'audio/music/song',
      'audio/stage', 'audio/track'
    ];

    for (let prefix of probePrefixes) {
      for (let i = 1; i <= 30; i++) {
        const testPath = `${prefix}${i}.mp3`;
        const trackId = `probe_${prefix.replace(/[^a-zA-Z0-9]/g, '_')}_${i}`;
        const audio = new Audio();
        audio.src = testPath;
        audio.oncanplaythrough = () => {
          this.bgmTracks[trackId] = testPath;
          if (!this.stageLibrary.some(item => item.path === testPath)) {
            this.stageLibrary.push({ id: trackId, path: testPath });
          }
        };
      }
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (this.currentBgm && this.currentBgm.paused && !this.muted) {
      this.currentBgm.play().catch(() => {});
    }
  }

  isBgmPlaying() {
    return !!(this.currentBgm && !this.currentBgm.paused && this.currentBgm.currentTime > 0 && !this.currentBgm.ended);
  }

  playWav(key, volumeMultiplier = 1.0, playbackRate = 1.0) {
    if (this.muted) return null;
    const wav = this.sfxWav[key];
    if (wav) {
      try {
        const clone = wav.cloneNode();
        clone.volume = Math.max(0, Math.min(1, this.sfxVolume * volumeMultiplier));
        if (playbackRate !== 1.0) {
          clone.playbackRate = playbackRate;
        }
        clone.currentTime = 0;
        clone.play().catch(() => {});
        return clone;
      } catch (e) {}
    }
    return null;
  }

  playGrappleLaunch() {
    this.playWav('swish');
  }

  playBobaPop(tier = 2) {
    this.playWav('pop');
    this.playWav('splash');
  }

  playBossPop() {
    this.playWav('pop', 1.0, 0.45);    // Slowed down 0.45x deep heavy pop
    this.playWav('splash', 1.0, 0.50); // Slowed down 0.50x heavy bass splash
  }

  playBobaHitThump() {
    this.playWav('bobaSqueak', 0.5); // 50% volume
  }

  playBobaSqueak() {
    this.playWav('bobaSqueak', 0.5); // 50% volume
  }

  playCrystalPickup() {
    this.playWav('crystal');
  }

  playHealthWarning() {
    this.playWav('warning');
  }

  playWitchCry() {
    if (!this.activeCrySounds) this.activeCrySounds = [];
    const clone = this.playWav('bobaCry');
    if (clone) {
      this.activeCrySounds.push(clone);
      clone.onended = () => {
        const idx = this.activeCrySounds.indexOf(clone);
        if (idx >= 0) this.activeCrySounds.splice(idx, 1);
      };
    }
  }

  stopWitchCry() {
    if (this.sfxWav.bobaCry) {
      try {
        this.sfxWav.bobaCry.pause();
        this.sfxWav.bobaCry.currentTime = 0;
      } catch (e) {}
    }
    if (this.activeCrySounds) {
      this.activeCrySounds.forEach(snd => {
        try {
          snd.pause();
          snd.currentTime = 0;
        } catch (e) {}
      });
      this.activeCrySounds = [];
    }
  }

  playWitchScreech() {
    this.stopWitchCry(); // Immediately cut off crying sound!
    this.playWav('bobaEnrage');
  }

  playWitchLaugh() {
    this.stopWitchCry(); // Immediately cut off crying sound!
    this.playWav('witchLaugh');
  }

  playClotheslineZap() {
    this.playWav('splash');
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.currentBgm) {
      this.currentBgm.muted = this.muted;
    }
    if (this.muted) {
      this.stopWitchCry();
    }
    return this.muted;
  }

  setDucked(isDucked) {
    this.isDucked = isDucked;
    if (this.currentBgm) {
      const targetVol = isDucked ? this.bgmVolume * 0.32 : this.bgmVolume;
      this.currentBgm.volume = Math.max(0, Math.min(1, targetVol));
    }
  }

  // --- Background Music Manager --- //
  playBgm(trackName, fallbackTrack = null, startOffsetSec = 0) {
    if (this.currentBgm && this.currentTrackName === trackName) {
      if (this.currentBgm.paused && !this.muted) {
        this.currentBgm.play().catch(() => {});
      }
      return;
    }

    if (this.currentBgm) {
      try { this.currentBgm.pause(); } catch(e) {}
      this.currentBgm = null;
    }

    this.currentTrackName = trackName;
    const trackPath = this.bgmTracks[trackName];
    if (trackPath) {
      const audio = new Audio(trackPath);
      audio.loop = true;
      audio.volume = this.isDucked ? this.bgmVolume * 0.32 : this.bgmVolume;
      audio.muted = this.muted;

      if (startOffsetSec > 0) {
        audio.addEventListener('loadedmetadata', () => {
          try { audio.currentTime = startOffsetSec; } catch (e) {}
        });
        try { audio.currentTime = startOffsetSec; } catch (e) {}
      }

      audio.onerror = (err) => {
        console.warn(`[Audio] BGM track "${trackName}" not found at ${trackPath}.`);
        if (fallbackTrack && fallbackTrack !== trackName && this.currentTrackName === trackName) {
          this.playBgm(fallbackTrack, null, startOffsetSec);
        }
      };
      this.currentBgm = audio;
      const p = audio.play();
      if (p && p.catch) {
        p.catch((err) => {
          console.log(`[Audio] Autoplay pending user interaction for "${trackName}":`, err);
        });
      }
    } else if (fallbackTrack && fallbackTrack !== trackName) {
      this.playBgm(fallbackTrack, null, startOffsetSec);
    }
  }

  playRandomStageBgm() {
    if (!this.stageLibrary || this.stageLibrary.length === 0) {
      this.playBgm('menu');
      return 'menu';
    }

    // Pick candidate from scanned stageLibrary
    let candidateObj = this.stageLibrary[Math.floor(Math.random() * this.stageLibrary.length)];
    if (this.stageLibrary.length > 1 && candidateObj.path === this.lastStageTrack) {
      const candidates = this.stageLibrary.filter(item => item.path !== this.lastStageTrack);
      if (candidates.length > 0) {
        candidateObj = candidates[Math.floor(Math.random() * candidates.length)];
      }
    }

    this.lastStageTrack = candidateObj.path;
    this.bgmTracks[candidateObj.id] = candidateObj.path;

    // Pick confirmed fallback
    const fallbackPath = this.stageLibrary[0] ? this.stageLibrary[0].path : 'audio/menu.mp3';
    this.bgmTracks['fallback_stage'] = fallbackPath;

    this.playBgm(candidateObj.id, 'fallback_stage');
    return candidateObj.id;
  }

  fadeOutBgm(durationMs = 1200, callback = null) {
    if (!this.currentBgm) {
      if (callback) callback();
      return;
    }
    const audio = this.currentBgm;
    const startVol = audio.volume;
    const startTime = performance.now();

    const fadeStep = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      audio.volume = Math.max(0, startVol * (1 - progress));

      if (progress < 1 && this.currentBgm === audio) {
        requestAnimationFrame(fadeStep);
      } else {
        if (this.currentBgm === audio) {
          audio.pause();
          this.currentBgm = null;
          this.currentTrackName = null;
        }
        if (callback) callback();
      }
    };
    requestAnimationFrame(fadeStep);
  }

  stopBgm() {
    if (this.currentBgm) {
      this.currentBgm.pause();
      this.currentBgm = null;
    }
    this.currentTrackName = null;
  }
}

const audioManager = new SoundManager();

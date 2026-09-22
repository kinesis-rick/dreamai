/* Hellpang - Core Game Loop, Physics Engine, Collision Solver & Renderer */

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = CONFIG.CANVAS_WIDTH;
    this.canvas.height = CONFIG.CANVAS_HEIGHT;

    // Disable canvas bilinear interpolation blur for crisp pixel art!
    this.ctx.imageSmoothingEnabled = false;

    // Game state
    this.state = 'TITLE_SCREEN'; // TITLE_SCREEN, MENU, PLAYING, CARD_DRAFT, PAUSED, GAME_OVER, WAVE_CLEAR, WAVE_TRANSITION
    this.twoPlayerMode = false;
    this.score = 0;
    this.wave = 1;
    this.waveTimer = 0;
    this.waveClearTimer = 0;
    this.waveTransitionTimer = 0;
    this.screenShake = 0;
    this.hitStopFrames = 0;
    this.bossWarningTimer = 0;
    this.showDevStats = false;
    this.frameCount = 0;
    this.fps = 60;

    // Progression Stats
    this.teamXP = 0;
    this.teamLevel = 1;
    this.xpToNextLevel = 10;
    this.sugarRushMeter = 0;
    this.sugarRushActive = false;
    this.sugarRushTimer = 0;

    // Modifiable Player Base Stats
    this.playerStats = {
      moveSpeed: CONFIG.PLAYER_SPEED,
      grappleSpeed: CONFIG.GRAPPLE_SPEED,
      maxGrapples: CONFIG.GRAPPLE_BASE_MAX,
      stickyResidue: false,
      electricBattery: 0,
      maxElectricBattery: 600,
      juiceDetonationRadius: 0,
      maxShields: 0,
      tetherOvercharge: 1,
      slowEffect: false,
      magnetRadius: 100
    };

    // Entity collections
    this.players = [];
    this.grapples = [];
    this.bullets = [];
    this.bobas = [];
    this.particles = [];
    this.crystals = [];
    this.acidHazards = [];

    // Background Decal Layer (Buffer Canvas)
    this.decalCanvas = document.createElement('canvas');
    this.decalCanvas.width = CONFIG.CANVAS_WIDTH;
    this.decalCanvas.height = CONFIG.CANVAS_HEIGHT;
    this.decalCtx = this.decalCanvas.getContext('2d');

    this.cardManager = new CardManager(this);
    this.acquiredCards = [];

    this.initUIEvents();
    this.showTitleScreen();
    requestAnimationFrame((t) => this.loop(t));
  }

  initUIEvents() {
    const playAudioBtn = document.getElementById('btn-title-play-audio');
    const enterMenuBtn = document.getElementById('btn-title-enter-menu');
    const titleScreenEl = document.getElementById('title-screen');
    const statusEl = document.getElementById('title-audio-status');

    const startTitleMusic = () => {
      audioManager.init();
      audioManager.playBgm('title');
      if (statusEl) {
        statusEl.innerHTML = '🎶 <strong>Playing Title Music:</strong> Hellpang Title Theme<br><span style="font-size:0.8rem; color:#b388ff;">Press Enter / Space or Click "ENTER MAIN MENU" to continue</span>';
      }
      if (playAudioBtn) {
        playAudioBtn.innerHTML = '🔊 MUSIC PLAYING...';
        playAudioBtn.style.opacity = '0.85';
      }
    };

    if (playAudioBtn) {
      playAudioBtn.onclick = (e) => {
        e.stopPropagation();
        startTitleMusic();
      };
    }

    if (enterMenuBtn) {
      enterMenuBtn.onclick = (e) => {
        e.stopPropagation();
        audioManager.init();
        audioManager.playCrystalPickup();
        this.goToMainMenu();
      };
    }

    if (titleScreenEl) {
      titleScreenEl.onclick = (e) => {
        if (this.state === 'TITLE_SCREEN') {
          if (!audioManager.isBgmPlaying()) {
            startTitleMusic();
          } else {
            audioManager.playCrystalPickup();
            this.goToMainMenu();
          }
        }
      };
    }

    window.addEventListener('keydown', (e) => {
      if (this.state === 'TITLE_SCREEN') {
        const activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          audioManager.init();
          audioManager.playCrystalPickup();
          this.goToMainMenu();
        } else {
          startTitleMusic();
        }
      }
    });

    const titleMenuBtn = document.getElementById('btn-title-menu');
    if (titleMenuBtn) {
      titleMenuBtn.onclick = () => this.showTitleScreen();
    }

    document.getElementById('btn-1p').onclick = () => this.startGame(false);
    document.getElementById('btn-2p').onclick = () => this.startGame(true);
    document.getElementById('btn-restart').onclick = () => {
      this.savePlayerName(undefined, true);
      this.startGame(this.twoPlayerMode);
    };
    document.getElementById('btn-mainmenu').onclick = () => {
      this.savePlayerName(undefined, true);
      this.goToMainMenu();
    };

    // Game Over 4-Char Name Input Controls
    const nameInput = document.getElementById('player-name-input');
    if (nameInput) {
      nameInput.oninput = () => {
        let val = nameInput.value.toUpperCase().slice(0, 4);
        nameInput.value = val;
        this.savePlayerName(val, false);
      };
      nameInput.onblur = () => {
        if (!nameInput.value.trim()) {
          nameInput.value = 'HERO';
          this.savePlayerName('HERO', true);
        }
      };
      nameInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.savePlayerName(undefined, true);
          if (typeof audioManager !== 'undefined') {
            audioManager.playCrystalPickup();
          }
        }
      };
    }

    const saveNameBtn = document.getElementById('btn-save-name');
    if (saveNameBtn) {
      saveNameBtn.onclick = () => {
        this.savePlayerName(undefined, true);
        if (typeof audioManager !== 'undefined') {
          audioManager.playCrystalPickup();
        }
      };
    }

    const exportBtn = document.getElementById('btn-export-scores');
    if (exportBtn) exportBtn.onclick = () => this.exportHighScores();

    const importBtn = document.getElementById('btn-import-scores');
    if (importBtn) importBtn.onclick = () => this.importHighScores();

    const customBgBtn = document.getElementById('btn-custom-bg');
    if (customBgBtn) customBgBtn.onclick = () => this.loadCustomBackground();

    // Pause Menu Controls
    const resumeBtn = document.getElementById('btn-resume-game');
    if (resumeBtn) resumeBtn.onclick = () => this.togglePause();

    const pauseMenuBtn = document.getElementById('btn-pause-mainmenu');
    if (pauseMenuBtn) pauseMenuBtn.onclick = () => this.goToMainMenu();

    const copyCodeBtn = document.getElementById('btn-copy-code');
    if (copyCodeBtn) copyCodeBtn.onclick = () => this.copyLevelCode();

    // Load Game Modal Controls
    const loadMenuBtn = document.getElementById('btn-load-game-menu');
    if (loadMenuBtn) loadMenuBtn.onclick = () => {
      document.getElementById('load-modal').classList.remove('hidden');
    };

    const cancelLoadBtn = document.getElementById('btn-cancel-load');
    if (cancelLoadBtn) cancelLoadBtn.onclick = () => {
      document.getElementById('load-modal').classList.add('hidden');
    };

    const submitLoadBtn = document.getElementById('btn-submit-load');
    if (submitLoadBtn) submitLoadBtn.onclick = () => {
      const codeStr = document.getElementById('load-code-textarea').value;
      this.loadGameFromCode(codeStr);
    };

    // Main Menu Leaderboard Modal Controls
    const leaderboardMenuBtn = document.getElementById('btn-leaderboard-menu');
    if (leaderboardMenuBtn) leaderboardMenuBtn.onclick = () => {
      this.renderLeaderboard();
      document.getElementById('leaderboard-modal').classList.remove('hidden');
    };

    const closeLeaderboardBtn = document.getElementById('btn-close-leaderboard');
    if (closeLeaderboardBtn) closeLeaderboardBtn.onclick = () => {
      document.getElementById('leaderboard-modal').classList.add('hidden');
    };

    const exportModalBtn = document.getElementById('btn-export-scores-modal');
    if (exportModalBtn) exportModalBtn.onclick = () => this.exportHighScores();

    const importModalBtn = document.getElementById('btn-import-scores-modal');
    if (importModalBtn) importModalBtn.onclick = () => this.importHighScores();

    // Render initial leaderboard state and game version badge
    const versionEl = document.getElementById('menu-game-version');
    if (versionEl) versionEl.innerText = CONFIG.VERSION;
    this.renderLeaderboard();
  }

  loadCustomBackground() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const img = new Image();
        img.onload = () => {
          this.customBgImage = img;
          alert('Custom desktop background loaded successfully!');
        };
        img.src = evt.target.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  // Base64 + XOR Encryption producing clean, printable Base64 strings
  encryptData(str) {
    try {
      const encoded = encodeURIComponent(str);
      const xored = encoded.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x42)).join('');
      return btoa(xored);
    } catch (e) {
      return btoa(encodeURIComponent(str));
    }
  }

  decryptData(str) {
    if (!str) return null;
    str = str.trim();

    // 1. New Clean Base64 + XOR Decryption
    try {
      const xored = atob(str);
      const decoded = xored.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x42)).join('');
      const json = decodeURIComponent(decoded);
      JSON.parse(json); // Validate JSON
      return json;
    } catch (e) {}

    // 2. Standard Base64 Decryption
    try {
      const json = decodeURIComponent(atob(str));
      JSON.parse(json);
      return json;
    } catch (e) {}

    // 3. Fallback for raw character XOR strings
    try {
      const b64 = str.split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 0x42)).join('');
      const json = decodeURIComponent(atob(b64));
      JSON.parse(json);
      return json;
    } catch (e) {}

    return null;
  }

  exportHighScores() {
    const rawScores = localStorage.getItem('hellpang_highscores') || '[]';
    const encrypted = this.encryptData(rawScores);
    
    // Download as .hellpang text backup file
    const blob = new Blob([encrypted], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `hellpang_scores_backup_${Date.now()}.hellpang`;
    a.click();
  }

  importHighScores() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.hellpang,.txt';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const encryptedStr = evt.target.result.trim();
        const decryptedJson = this.decryptData(encryptedStr);

        if (decryptedJson) {
          try {
            const scores = JSON.parse(decryptedJson);
            if (Array.isArray(scores)) {
              localStorage.setItem('hellpang_highscores', JSON.stringify(scores));
              alert('High Scores restored successfully!');
              this.renderLeaderboard();
              return;
            }
          } catch (err) {}
        }
        alert('Invalid or corrupted High Score backup file!');
      };
      reader.readAsText(file);
    };
    input.click();
  }

  showTitleScreen() {
    this.state = 'TITLE_SCREEN';
    const titleEl = document.getElementById('title-screen');
    if (titleEl) titleEl.classList.remove('hidden');
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('load-modal').classList.add('hidden');
    document.getElementById('leaderboard-modal').classList.add('hidden');

    const statusEl = document.getElementById('title-audio-status');
    const playAudioBtn = document.getElementById('btn-title-play-audio');
    if (audioManager.isBgmPlaying() && audioManager.currentTrackName === 'title') {
      if (statusEl) statusEl.innerHTML = '🎶 <strong>Playing Title Music:</strong> Hellpang Title Theme<br><span style="font-size:0.8rem; color:#b388ff;">Press Enter / Space or Click "ENTER MAIN MENU" to continue</span>';
      if (playAudioBtn) { playAudioBtn.innerHTML = '🔊 MUSIC PLAYING...'; playAudioBtn.style.opacity = '0.85'; }
    } else {
      if (statusEl) statusEl.innerHTML = '🎵 Click <strong>"PLAY TITLE MUSIC"</strong> or click anywhere to listen!';
      if (playAudioBtn) { playAudioBtn.innerHTML = '🎵 PLAY TITLE MUSIC'; playAudioBtn.style.opacity = '1'; }
    }

    audioManager.playBgm('title');
  }

  goToMainMenu() {
    this.state = 'MENU';
    const titleEl = document.getElementById('title-screen');
    if (titleEl) titleEl.classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('load-modal').classList.add('hidden');
    document.getElementById('leaderboard-modal').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
    audioManager.playBgm('menu');
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      document.getElementById('pause-screen').classList.remove('hidden');
      document.getElementById('pause-wave').innerText = this.wave;
      document.getElementById('pause-score').innerText = this.score;
      document.getElementById('pause-level').innerText = this.teamLevel;

      // Render acquired card badges in pause menu
      const container = document.getElementById('pause-cards-loadout');
      if (container) {
        container.innerHTML = '';
        if (this.acquiredCards && this.acquiredCards.length > 0) {
          this.acquiredCards.forEach(cardId => {
            const cardDef = UPGRADE_CARDS.find(c => c.id === cardId);
            if (cardDef) {
              const badge = document.createElement('div');
              badge.className = 'loadout-badge';
              badge.innerHTML = `<span>${cardDef.icon}</span> <span>${cardDef.name}</span>`;
              container.appendChild(badge);
            }
          });
        } else {
          container.innerHTML = '<span style="font-size:0.8rem; color:#888;">No cards acquired yet</span>';
        }
      }

      // Generate Level Code string
      const codeInput = document.getElementById('pause-code-input');
      const statusMsg = document.getElementById('copy-status-msg');
      if (statusMsg) statusMsg.style.display = 'none';
      if (codeInput) codeInput.value = this.generateLevelCode();

    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      document.getElementById('pause-screen').classList.add('hidden');
    }
  }

  generateLevelCode() {
    const saveData = {
      v: 1,
      w: this.wave,
      s: this.score,
      p: this.twoPlayerMode,
      lx: this.teamLevel,
      xp: this.teamXP,
      c: this.acquiredCards || []
    };
    return this.encryptData(JSON.stringify(saveData));
  }

  copyLevelCode() {
    const codeInput = document.getElementById('pause-code-input');
    if (codeInput && codeInput.value) {
      const copySuccess = () => {
        const statusMsg = document.getElementById('copy-status-msg');
        if (statusMsg) {
          statusMsg.style.display = 'block';
          setTimeout(() => { if (statusMsg) statusMsg.style.display = 'none'; }, 3000);
        }
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codeInput.value).then(copySuccess).catch(() => {
          codeInput.select();
          document.execCommand('copy');
          copySuccess();
        });
      } else {
        codeInput.select();
        document.execCommand('copy');
        copySuccess();
      }
    }
  }

  loadGameFromCode(codeStr) {
    if (!codeStr || !codeStr.trim()) {
      alert('Please paste a valid Level Code!');
      return;
    }

    const jsonStr = this.decryptData(codeStr.trim());
    if (!jsonStr) {
      alert('Invalid or corrupted Level Code!');
      return;
    }

    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data.w !== 'number') {
        alert('Invalid Level Code contents!');
        return;
      }

      // Initialize fresh run in 1P or 2P mode
      const is2P = !!data.p;
      this.startGame(is2P);

      // Restore saved state properties
      this.wave = data.w || 1;
      this.score = data.s || 0;
      this.teamLevel = data.lx || 1;
      this.teamXP = data.xp || 0;
      this.acquiredCards = data.c || [];

      // Re-apply upgrade card stats
      this.acquiredCards.forEach(cardId => {
        const cardDef = UPGRADE_CARDS.find(c => c.id === cardId);
        if (cardDef && typeof cardDef.apply === 'function') {
          cardDef.apply(this);
        }
      });

      // Spawn wave bobas & platforms for wave
      this.bobas = [];
      this.grapples = [];
      this.spawnWave(this.wave);

      // Hide modals and resume
      document.getElementById('load-modal').classList.add('hidden');
      document.getElementById('menu-screen').classList.add('hidden');
      this.state = 'PLAYING';
      audioManager.playBgm('stage1');

    } catch (err) {
      alert('Error parsing Level Code: ' + err.message);
    }
  }

  startGame(is2P) {
    this.twoPlayerMode = is2P;
    input.twoPlayerMode = is2P;
    input.easterEggTriggered = false;
    input.keyBuffer = '';
    this.score = 0;
    this.wave = 1;
    this.waveTimer = 0;
    this.teamXP = 0;
    this.teamLevel = 1;
    this.xpToNextLevel = 10;
    this.sugarRushMeter = 0;
    this.sugarRushActive = false;
    this.acquiredCards = [];

    // Reset player stats
    this.playerStats.moveSpeed = CONFIG.PLAYER_SPEED;
    this.playerStats.grappleSpeed = CONFIG.GRAPPLE_SPEED;
    this.playerStats.maxGrapples = CONFIG.GRAPPLE_BASE_MAX;
    this.playerStats.stickyResidue = false;
    this.playerStats.electricBattery = 0;
    this.playerStats.maxElectricBattery = 600;
    this.playerStats.juiceDetonationRadius = 0;
    this.playerStats.maxShields = 0;
    this.playerStats.tetherOvercharge = 1;
    this.playerStats.gatlingAmmoTimer = 0;
    this.playerStats.matchaPulse = false;
    this.playerStats.vHarpoonSplit = false;
    this.playerStats.vampiricSyringe = 0;

    // Spawn Players
    this.players = [
      new Player(1, CONFIG.CANVAS_WIDTH * 0.4, '#ff4081', 'P1')
    ];
    if (is2P) {
      this.players.push(new Player(2, CONFIG.CANVAS_WIDTH * 0.6, '#18ffff', 'P2'));
    }

    this.grapples = [];
    this.bobas = [];
    this.particles = [];
    this.crystals = [];
    this.acidHazards = [];
    this.decalCtx.clearRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Initial Boba Spawns
    this.spawnWave(1);

    this.state = 'PLAYING';
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('gameover-screen').classList.add('hidden');
    document.getElementById('pause-screen').classList.add('hidden');
    document.getElementById('load-modal').classList.add('hidden');
    document.getElementById('leaderboard-modal').classList.add('hidden');
    document.getElementById('card-modal').classList.add('hidden');

    audioManager.playRandomStageBgm();
  }

  spawnWave(waveNum) {
    // Load elevated platform layout for current wave level
    const platData = CONFIG.STAGE_PLATFORMS[waveNum] || CONFIG.STAGE_PLATFORMS[4] || [];
    this.platforms = platData.map(p => new Platform(p.x, p.y, p.width, p.height));

    // --- Wave 5 (and every 5th wave) Boss Wave Spawning ---
    if (waveNum % 5 === 0) {
      this.bossWarningTimer = 180; // 3.0s Warning Banner
      audioManager.playHealthWarning();
      audioManager.playBgm('boss');

      const bossHp = this.getBossHp(waveNum);
      const bossX = CONFIG.CANVAS_WIDTH / 2;
      const boss = new BobaPearl(bossX, 160, 4, 1.4, -3, 'BOSS');
      boss.maxHp = bossHp;
      boss.hp = bossHp;
      boss.radius = 85;
      boss.bounceVelocity = -12.5;
      boss.color = '#ff0055';
      this.bobas.push(boss);

      // Spawn 2 supporting side bobas
      this.bobas.push(new BobaPearl(bossX - 260, 150, 3, -1.5, -4, 'STANDARD'));
      this.bobas.push(new BobaPearl(bossX + 260, 150, 3, 1.5, -4, 'STANDARD'));
      return;
    } else {
      audioManager.playBgm('stage1');
    }

    const bobaCount = 2 + waveNum;
    let witchSpawned = false;
    let acidBossSpawned = false;

    for (let i = 0; i < bobaCount; i++) {
      const x = CONFIG.WALL_LEFT + 100 + Math.random() * (CONFIG.WALL_RIGHT - CONFIG.WALL_LEFT - 200);
      let tier = Math.min(4, Math.max(1, Math.floor(Math.random() * 3) + 2));
      let type = 'STANDARD';

      const rand = Math.random();
      if (rand < 0.12) {
        type = 'EXPLOSIVE';
      } else if (rand < 0.20) {
        type = 'JELLY';
      } else if (rand < 0.23 && !witchSpawned) {
        type = 'WITCH';
        tier = 2; // Always medium size (Tier 2)!
        witchSpawned = true;
      } else if (rand < 0.26 && !acidBossSpawned) {
        type = 'ACID_BOSS';
        tier = 4;
        acidBossSpawned = true;
      }

      this.bobas.push(new BobaPearl(x, 150, tier, null, null, type));
    }
  }

  // Core Game Loop
  loop(timestamp) {
    // Calculate Live FPS & Frame Counter
    this.frameCount = (this.frameCount || 0) + 1;
    if (!this.lastFpsTimestamp) this.lastFpsTimestamp = timestamp;
    if (!this.fpsFrameCounter) this.fpsFrameCounter = 0;
    this.fpsFrameCounter++;
    if (timestamp - this.lastFpsTimestamp >= 500) {
      this.fps = Math.round((this.fpsFrameCounter * 1000) / (timestamp - this.lastFpsTimestamp));
      this.fpsFrameCounter = 0;
      this.lastFpsTimestamp = timestamp;
    }

    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
      requestAnimationFrame((t) => this.loop(t));
      return;
    }

    this.update();
    this.draw();

    requestAnimationFrame((t) => this.loop(t));
  }

  update() {
    if (this.bossWarningTimer > 0) this.bossWarningTimer--;
    // --- 101 Easter Egg Check (Toggles Developer Stats HUD) ---
    if (typeof input !== 'undefined' && input.check101EasterEgg && input.check101EasterEgg()) {
      this.showDevStats = !this.showDevStats;
      audioManager.playBobaSqueak();
    }

    if (input.isPausePressed()) {
      if (this.state === 'PLAYING' || this.state === 'PAUSED') {
        this.togglePause();
        return;
      }
    }

    if (this.state === 'CARD_DRAFT') {
      this.cardManager.handleInput(input);
      return;
    }

    if (this.state === 'WAVE_CLEAR') {
      this.particles.forEach(p => p.update());
      this.players.forEach(p => p.update(0, this));

      if (this.waveClearTimer > 0) {
        this.waveClearTimer--;
      } else {
        this.state = 'WAVE_TRANSITION';
        this.waveTransitionTimer = 110;
      }
      return;
    }

    if (this.state === 'WAVE_TRANSITION') {
      this.particles.forEach(p => p.update());

      if (this.waveTransitionTimer > 0) {
        this.waveTransitionTimer--;

        // At transition midpoint (frame 55), spawn new wave, change scene & pick new stage BGM!
        if (this.waveTransitionTimer === 55) {
          this.wave++;
          this.players.forEach(p => { p.celebrating = false; });
          this.spawnWave(this.wave);

          if (this.wave % 5 === 0) {
            audioManager.playBgm('boss', 'stage1');
          } else {
            audioManager.playRandomStageBgm();
          }
        }
      } else {
        this.state = 'PLAYING';
        audioManager.playGrappleLaunch();
      }
      return;
    }

    if (this.state !== 'PLAYING') return;

    // --- Dynamic Spooky Boss Music & Crying Audio Ducking ---
    const activeSobbingBoss = this.bobas.some(b => 
      (b.type === 'WITCH' && !b.isWitchEnraged && !b.isFlyingOff) || 
      (b.type === 'ACID_BOSS')
    );
    const activeEnragedWitch = this.bobas.some(b => b.type === 'WITCH' && b.isWitchEnraged);

    if (activeSobbingBoss) {
      audioManager.setDucked(true);
      if (audioManager.currentTrackName !== 'witch') {
        audioManager.playBgm('witch', 'boss');
      }
    } else if (activeEnragedWitch) {
      audioManager.setDucked(false);
      if (audioManager.currentTrackName !== 'boss') {
        // Skip 60s (1 min) into boss.mp3 when Witch enrages to hit the established thumping beat drop immediately!
        audioManager.playBgm('boss', 'stage1', 60.0);
      }
    } else {
      audioManager.setDucked(false);
    }

    // --- 666 Easter Egg Check (Spawns Witch Boba on demand one time only) ---
    if (typeof input !== 'undefined' && input.check666EasterEgg && input.check666EasterEgg()) {
      const witch = new BobaPearl(
        CONFIG.CANVAS_WIDTH / 2,
        CONFIG.CEILING_Y + 45,
        2,
        (Math.random() > 0.5 ? 0.45 : -0.45),
        -2,
        'WITCH'
      );
      this.bobas.push(witch);
      this.screenShake = 20;
      audioManager.playWitchCry();
    }

    // --- 5162 Easter Egg Check (Spawns Acid Mini-Boss Boba on demand) ---
    if (typeof input !== 'undefined' && input.check5162EasterEgg && input.check5162EasterEgg()) {
      const acidBoss = new BobaPearl(
        CONFIG.WALL_LEFT + 100 + Math.random() * (CONFIG.WALL_RIGHT - CONFIG.WALL_LEFT - 200),
        150,
        4,
        (Math.random() > 0.5 ? 0.6 : -0.6),
        -3,
        'ACID_BOSS'
      );
      this.bobas.push(acidBoss);
      this.screenShake = 20;
      audioManager.playClotheslineZap();
    }

    // Handle Gatling Machine Gun Frenzy Timer
    if (this.playerStats.gatlingAmmoTimer > 0) {
      this.playerStats.gatlingAmmoTimer--;
      
      // Auto rapid-fire when holding shoot keys
      if (input.isDown('KeyW')) this.tryShootGrapple(this.players[0]);
      if (this.twoPlayerMode && this.players[1] && input.isDown('ArrowUp')) {
        this.tryShootGrapple(this.players[1]);
      }
    }

    // 1. Handle Input & Movement
    const p1Dir = input.getP1Movement();
    this.players[0].update(p1Dir, this);

    if (input.isP1Shooting()) {
      this.tryShootGrapple(this.players[0]);
    }
    if (input.isDown('KeyS')) {
      this.cancelGrapples(1);
    }

    if (this.twoPlayerMode && this.players[1]) {
      const p2Dir = input.getP2Movement();
      this.players[1].update(p2Dir, this);

      if (input.isP2Shooting()) {
        this.tryShootGrapple(this.players[1]);
      }
      if (input.isDown('ArrowDown')) {
        this.cancelGrapples(2);
      }

      this.check2PSynergies();
    }

    // 4. Update Grapples & Gatling Bullets
    this.grapples.forEach(g => g.update(this));
    this.grapples = this.grapples.filter(g => g.state !== 'DONE');

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].update(this);
      if (this.bullets[i].state === 'DONE') {
        this.bullets.splice(i, 1);
      }
    }

    this.checkGrappleBobaCollisions();
    this.checkBulletBobaCollisions();
    this.bobas.forEach(b => b.update(this));

    // 4. Grapple to Boba Collisions
    this.checkGrappleBobaCollisions();

    // 5. Boba to Player Collisions
    this.checkPlayerBobaCollisions();

    // 6. Update Sugar Crystals & XP Magnet
    this.crystals.forEach(c => c.update(this.players, this.playerStats.magnetRadius));
    this.checkCrystalPickups();

    // 7. Update Particles & Acid Hazards
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => p.alpha > 0);

    this.acidHazards.forEach(h => h.update(this));
    this.acidHazards = this.acidHazards.filter(h => !h.isDone);

    // --- Witch Fly Away & Wave End Mechanics --- //
    // If the un-enraged sobbing Witch is the ONLY boba left on screen, she laughs and flies off screen to end the wave!
    const activeNonWitchBobas = this.bobas.filter(b => b.type !== 'WITCH' || b.isWitchEnraged);
    const witchBobas = this.bobas.filter(b => b.type === 'WITCH' && !b.isWitchEnraged);

    if (activeNonWitchBobas.length === 0 && witchBobas.length > 0) {
      witchBobas.forEach(w => {
        if (!w.isFlyingOff) {
          w.isFlyingOff = true;
          audioManager.playWitchLaugh();
        }
      });
    }

    // Filter out bobas that have flown off top of screen
    this.bobas = this.bobas.filter(b => !(b.isFlyingOff && b.y < -50));

    // --- Arcade Stage Clear Wave Progression --- //
    // A new wave spawns ONLY after all bobas on screen have been cleared!
    if (this.bobas.length === 0) {
      this.state = 'WAVE_CLEAR';
      this.waveClearTimer = 90; // ~1.5 seconds celebration animation
      audioManager.fadeOutBgm(1200);

      // Stage Clear Health Bar: Double surviving player's remaining health & trigger celebration animation!
      this.players.forEach(p => {
        if (!p.isGhost) {
          p.celebrating = true;
          p.health = Math.min(p.maxHealth, p.health * 2);
        }
      });

      audioManager.playCrystalPickup();
    }
  }

  expireElectricHarpoonCard() {
    this.playerStats.stickyResidue = false;
    this.playerStats.electricBattery = 0;
    if (this.acquiredCards) {
      this.acquiredCards = this.acquiredCards.filter(c => c !== 'sticky_residue');
    }
  }

  tryShootGrapple(player) {
    if (player.isGhost) return;

    // If Gatling Frenzy is active, fire high-velocity machine gun bullets!
    if (this.playerStats.gatlingAmmoTimer > 0) {
      if (!player.lastGatlingShot || Date.now() - player.lastGatlingShot > 110) {
        player.lastGatlingShot = Date.now();
        this.bullets.push(new GatlingBullet(player.id, player.x, CONFIG.FLOOR_Y - 35));
        audioManager.playGrappleLaunch();
      }
      return;
    }

    const activeGrapples = this.grapples.filter(g => g.playerId === player.id);
    if (activeGrapples.length < this.playerStats.maxGrapples) {
      const hasBattery = this.playerStats.stickyResidue && this.playerStats.electricBattery > 0;
      const splitLevel = this.playerStats.vHarpoonSplit || 0;

      if (splitLevel >= 2 || (splitLevel === 1 && this.playerStats.maxGrapples > 1)) {
        // W-Spread (3 harpoons: -45°, 0°, +45°)
        [-45, 0, 45].forEach(angle => {
          this.grapples.push(
            new Grapple(player.id, player.x, CONFIG.FLOOR_Y, this.playerStats.grappleSpeed, hasBattery, angle)
          );
        });
      } else if (splitLevel === 1) {
        // V-Split (2 harpoons: -45°, +45°)
        [-45, 45].forEach(angle => {
          this.grapples.push(
            new Grapple(player.id, player.x, CONFIG.FLOOR_Y, this.playerStats.grappleSpeed, hasBattery, angle)
          );
        });
      } else {
        // Standard single harpoon (0°)
        this.grapples.push(
          new Grapple(player.id, player.x, CONFIG.FLOOR_Y, this.playerStats.grappleSpeed, hasBattery, 0)
        );
      }

      audioManager.playGrappleLaunch();
    }
  }

  cancelGrapples(playerId) {
    this.grapples.forEach(g => {
      if (g.playerId === playerId && g.state !== 'DONE') {
        g.cancel();
      }
    });
  }

  // --- 2P Co-op Synergy Mechanics --- //
  check2PSynergies() {
    const p1 = this.players[0];
    const p2 = this.players[1];
    if (!p1 || !p2) return;

    // A. 2P Ghost Revive
    if (p1.isGhost || p2.isGhost) {
      const ghost = p1.isGhost ? p1 : p2;
      const survivor = p1.isGhost ? p2 : p1;

      const dist = Math.hypot(ghost.x - survivor.x, ghost.y - survivor.y);
      if (dist < 50) {
        ghost.reviveProgress += 1 / 60;
        if (ghost.reviveProgress >= CONFIG.REVIVE_TIME) {
          ghost.isGhost = false;
          ghost.health = 50; // revive with 50% HP
          ghost.iFrames = 120;
          ghost.reviveProgress = 0;
          audioManager.playCrystalPickup();
        }
      } else {
        ghost.reviveProgress = Math.max(0, ghost.reviveProgress - 0.5 / 60);
      }
    }

    // B. Tackle Vault
    if (!p1.isGhost && !p2.isGhost && p1.tackleCooldown === 0 && p2.tackleCooldown === 0) {
      const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
      if (dist < p1.radius + p2.radius) {
        p1.vx = p1.x < p2.x ? -12 : 12;
        p2.vx = p2.x < p1.x ? -12 : 12;
        p1.iFrames = 30;
        p2.iFrames = 30;
        p1.tackleCooldown = 90;
        p2.tackleCooldown = 90;
        audioManager.playClotheslineZap();
      }
    }

    // C. Boba Clothesline
    const g1 = this.grapples.find(g => g.playerId === 1);
    const g2 = this.grapples.find(g => g.playerId === 2);
    if (g1 && g2) {
      this.drawClotheslineLaser(g1, g2);
      this.checkClotheslineBobaCollisions(g1, g2);
    }
  }

  drawClotheslineLaser(g1, g2) {
    this.ctx.save();
    this.ctx.strokeStyle = '#ffd700';
    this.ctx.lineWidth = 4 * this.playerStats.tetherOvercharge;
    this.ctx.shadowColor = '#ff4081';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.moveTo(g1.x, g1.tipY);
    this.ctx.lineTo(g2.x, g2.tipY);
    this.ctx.stroke();
    this.ctx.restore();
  }

  checkClotheslineBobaCollisions(g1, g2) {
    const minY = Math.min(g1.tipY, g2.tipY);
    const maxY = Math.max(g1.tipY, g2.tipY);
    const minX = Math.min(g1.x, g2.x);
    const maxX = Math.max(g1.x, g2.x);

    for (let i = this.bobas.length - 1; i >= 0; i--) {
      const boba = this.bobas[i];
      if (boba.x >= minX && boba.x <= maxX && boba.y >= minY - 10 && boba.y <= maxY + 10) {
        this.popBoba(i);
        audioManager.playClotheslineZap();
      }
    }
  }

  // Shortest distance from point (px, py) to line segment (x1, y1) -> (x2, y2)
  distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);

    let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));

    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;
    return Math.hypot(px - nearestX, py - nearestY);
  }

  // --- Grapple to Boba Collision Solver --- //
  checkGrappleBobaCollisions() {
    for (let gIdx = this.grapples.length - 1; gIdx >= 0; gIdx--) {
      const g = this.grapples[gIdx];

      for (let bIdx = this.bobas.length - 1; bIdx >= 0; bIdx--) {
        const b = this.bobas[bIdx];

        const dist = this.distToSegment(b.x, b.y, g.startX, g.startY, g.tipX, g.tipY);

        if (dist <= b.radius + 3) {
          if (b.type === 'WITCH') {
            if (!b.isSwooping && !b.isFlyingOff) {
              b.startSwoopAttack(this);
            }
            if (!g.isElectric) {
              g.state = 'DONE';
              break;
            } else {
              audioManager.playClotheslineZap();
            }
          } else {
            b.hp--;
            b.flashFrames = 6;
            if (b.type === 'ACID_BOSS' && b.hp > 0) {
              b.radius += 10; // Grows bigger on each hit!
              b.squishX = 1.35;
              b.squishY = 0.65;
            }
            if (b.hp <= 0) {
              this.popBoba(bIdx);
            } else {
              audioManager.playBobaHitThump();
            }
          }

          // If harpoon is electric (battery > 0), line stays active & shocks bobas!
          // If battery is depleted or standard harpoon, hit once and disappear!
          if (!g.isElectric) {
            g.state = 'DONE';
            break;
          } else {
            audioManager.playClotheslineZap();
          }
        }
      }
    }
  }

  checkBulletBobaCollisions() {
    for (let bIdx = this.bullets.length - 1; bIdx >= 0; bIdx--) {
      const bullet = this.bullets[bIdx];
      for (let bobaIdx = this.bobas.length - 1; bobaIdx >= 0; bobaIdx--) {
        const boba = this.bobas[bobaIdx];
        const dist = Math.hypot(bullet.x - boba.x, bullet.y - boba.y);
        if (dist <= bullet.radius + boba.radius) {
          if (boba.type === 'WITCH') {
            if (!boba.isSwooping && !boba.isFlyingOff) {
              boba.startSwoopAttack(this);
            }
          } else {
            boba.hp--;
            boba.flashFrames = 5;
            if (boba.type === 'ACID_BOSS' && boba.hp > 0) {
              boba.radius += 10; // Grows bigger on each hit!
              boba.squishX = 1.35;
              boba.squishY = 0.65;
            }
            if (boba.hp <= 0) {
              this.popBoba(bobaIdx);
            } else {
              audioManager.playBobaHitThump();
            }
          }
          bullet.state = 'DONE';
          break;
        }
      }
    }
  }

  popBoba(bobaIndex) {
    const boba = this.bobas[bobaIndex];
    if (!boba || boba.isPopping) return;
    boba.isPopping = true;

    if (boba.type === 'BOSS') {
      audioManager.playBossPop();
    } else {
      audioManager.playBobaPop(boba.tier);
    }
    this.score += boba.points;
    this.screenShake = boba.tier * 3.5;
    this.hitStopFrames = boba.tier >= 3 ? 5 : 0;

    for (let i = 0; i < 30; i++) {
      this.particles.push(new SplatterParticle(boba.x, boba.y, boba.color));
    }

    // --- Juice Detonation Non-Recursive Shockwave --- //
    if (this.playerStats.juiceDetonationRadius > 0) {
      const radius = this.playerStats.juiceDetonationRadius;
      this.bobas.forEach((other, idx) => {
        if (idx !== bobaIndex && !other.isPopping) {
          const dist = Math.hypot(boba.x - other.x, boba.y - other.y);
          if (dist <= radius) {
            other.flashFrames = 8;
            other.hp--;
          }
        }
      });
    }

    // --- Matcha Pulse Nova (Repels nearby bobas outward) --- //
    if (this.playerStats.matchaPulse) {
      this.bobas.forEach((other, idx) => {
        if (idx !== bobaIndex && !other.isPopping) {
          const dx = other.x - boba.x;
          const dy = other.y - boba.y;
          const dist = Math.hypot(dx, dy) || 1;
          if (dist < 180) {
            other.vx += (dx / dist) * 7.5;
            other.vy -= 3.5;
          }
        }
      });
    }

    // --- Tapioca Vampiric Syringe (Restores HP on large boba pops) --- //
    if (this.playerStats.vampiricSyringe > 0 && boba.tier >= 3) {
      this.players.forEach(p => {
        if (!p.isGhost) {
          p.health = Math.min(p.maxHealth, p.health + this.playerStats.vampiricSyringe);
        }
      });
    }

    if (boba.tier > 1) {
      if (boba.type === 'BOSS') {
        this.screenShake = 35;
        this.hitStopFrames = 10;
        audioManager.playCrystalPickup();
        for (let i = 0; i < 60; i++) {
          this.particles.push(new SplatterParticle(boba.x, boba.y, '#ff0055'));
        }
        for (let c = 0; c < 15; c++) {
          this.crystals.push(new SugarCrystal(boba.x, boba.y, 1));
        }
      } else if (boba.type === 'ACID_BOSS') {
        this.screenShake = 25;
        audioManager.playClotheslineZap();
        this.acidHazards.push(new AcidGushHazard(boba.x, boba.y));
        for (let c = 0; c < 8; c++) {
          this.crystals.push(new SugarCrystal(boba.x, boba.y, 1));
        }
      } else if (boba.type === 'WITCH') {
        audioManager.stopWitchCry();
        audioManager.playWitchScreech();
        // Splits ONCE into 2 Tier 1 Angry Red Bobas moving fast (takes 4 hits each to pop!)
        const angry1 = new BobaPearl(boba.x - 15, boba.y, 1, -6.5, -6, 'STANDARD');
        const angry2 = new BobaPearl(boba.x + 15, boba.y, 1, 6.5, -6, 'STANDARD');
        angry1.color = '#ff1744';
        angry2.color = '#ff1744';
        angry1.faceType = 'angry';
        angry2.faceType = 'angry';
        angry1.maxHp = 4;
        angry1.hp = 4;
        angry2.maxHp = 4;
        angry2.hp = 4;
        this.bobas.push(angry1, angry2);
      } else {
        const newTier = boba.tier - 1;
        this.bobas.push(new BobaPearl(boba.x - 15, boba.y, newTier, -Math.abs(boba.horizontalSpeed) * 1.2, -6, boba.type, boba.colorScheme));
        this.bobas.push(new BobaPearl(boba.x + 15, boba.y, newTier, Math.abs(boba.horizontalSpeed) * 1.2, -6, boba.type, boba.colorScheme));
      }
    } else {
      for (let c = 0; c < boba.xp; c++) {
        this.crystals.push(new SugarCrystal(boba.x, boba.y, 1));
      }
    }

    this.bobas.splice(bobaIndex, 1);
  }

  getWaveDamageMultiplier() {
    if (this.wave <= 5) return 1.0;
    return 1.0 + (this.wave - 5) * 0.1;
  }

  getBossHp(waveNum) {
    if (waveNum <= 5) return 30;
    if (waveNum <= 10) return 50;
    const bossLevel = (waveNum - 15) / 5;
    return Math.round(100 * Math.pow(2, Math.max(0, bossLevel)));
  }

  damagePlayer(targetPlayer, amount) {
    let p = targetPlayer;
    if (!p || p.isGhost) {
      const alive = this.players.filter(pl => !pl.isGhost);
      if (alive.length > 0) p = alive[0];
      else return;
    }

    const waveMult = this.getWaveDamageMultiplier();
    const finalAmount = amount * waveMult;

    if (p.shield > 0) {
      if (p.shield >= finalAmount) {
        p.shield -= finalAmount;
      } else {
        const leftover = finalAmount - p.shield;
        p.shield = 0;
        p.health -= leftover;
      }
      p.iFrames = 35;
      audioManager.playCrystalPickup();
      if (p.health <= 0) {
        p.health = 0;
        p.isGhost = true;
        this.checkGameOver();
      }
    } else if (p.iFrames <= 0) {
      p.health -= finalAmount;
      p.iFrames = 35;
      if (p.health <= 0) {
        p.health = 0;
        p.isGhost = true;
        this.checkGameOver();
      }
    }
  }

  popBobaByRef(bobaRef) {
    const idx = this.bobas.indexOf(bobaRef);
    if (idx >= 0) {
      this.popBoba(idx);
    }
  }

  // --- Continuous Health Bar Damage Solver --- //
  checkPlayerBobaCollisions() {
    const waveMult = this.getWaveDamageMultiplier();

    this.players.forEach(p => {
      if (p.isGhost) return;

      for (let b of this.bobas) {
        const dist = Math.hypot(p.x - b.x, p.y - b.y);
        if (dist < p.radius + b.radius) {
          const baseDamageRate = (b.tier || 1) * 0.45;
          const damageRate = baseDamageRate * waveMult;

          if (p.shield > 0) {
            if (p.shield >= damageRate) {
              p.shield -= damageRate;
            } else {
              const leftover = damageRate - p.shield;
              p.shield = 0;
              p.health -= leftover;
            }
            if (p.health <= 0) {
              p.health = 0;
              p.isGhost = true;
              this.checkGameOver();
            }
          } else if (p.iFrames <= 0) {
            p.health -= damageRate;

            // Trigger Low Health Warning Beep!
            if (p.health > 0 && p.health < 30 && Math.floor(Date.now() / 300) % 2 === 0) {
              audioManager.playHealthWarning();
            }

            if (p.health <= 0) {
              p.health = 0;
              p.isGhost = true;
              this.checkGameOver();
            }
          }
          break;
        }
      }
    });
  }

  checkCrystalPickups() {
    for (let i = this.crystals.length - 1; i >= 0; i--) {
      const c = this.crystals[i];
      for (let p of this.players) {
        if (p.isGhost) continue;
        const dist = Math.hypot(p.x - c.x, p.y - c.y);
        if (dist < p.radius + c.radius) {
          audioManager.playCrystalPickup();
          this.teamXP += c.value;
          this.crystals.splice(i, 1);

          if (this.teamXP >= this.xpToNextLevel) {
            this.triggerLevelUp();
          }
          break;
        }
      }
    }
  }

  triggerLevelUp() {
    this.teamLevel++;
    this.teamXP = 0;
    this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.35);

    this.state = 'CARD_DRAFT';
    this.cardManager.generateDraftChoices();
    document.getElementById('card-modal').classList.remove('hidden');
  }

  resumeFromCardDraft() {
    this.state = 'PLAYING';
    document.getElementById('card-modal').classList.add('hidden');
  }

  savePlayerName(customName, isFinalSave = false) {
    const nameInput = document.getElementById('player-name-input');
    let rawName = customName !== undefined ? customName : (nameInput ? nameInput.value : '');
    let cleanName = rawName.toUpperCase().slice(0, 4);

    if (isFinalSave && !cleanName.trim()) {
      cleanName = 'HERO';
    }

    if (nameInput && isFinalSave) {
      nameInput.value = cleanName;
    }

    const savedRecordName = cleanName.trim() || 'HERO';

    if (cleanName.trim()) {
      localStorage.setItem('hellpang_player_name', savedRecordName);
    }

    // Update entry in hellpang_highscores
    const scores = JSON.parse(localStorage.getItem('hellpang_highscores') || '[]');
    let updated = false;

    if (this.currentRunId) {
      for (let i = 0; i < scores.length; i++) {
        if (scores[i].id === this.currentRunId) {
          scores[i].name = savedRecordName;
          updated = true;
          break;
        }
      }
    }

    if (!updated && scores.length > 0) {
      for (let i = 0; i < scores.length; i++) {
        if (scores[i].score === this.score && scores[i].wave === this.wave) {
          scores[i].name = savedRecordName;
          updated = true;
          break;
        }
      }
    }

    if (updated) {
      localStorage.setItem('hellpang_highscores', JSON.stringify(scores));
      this.renderLeaderboard();
    }

    const statusEl = document.getElementById('name-save-status');
    if (statusEl) {
      statusEl.innerText = `SAVED: ${savedRecordName}`;
    }
  }

  renderLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('hellpang_highscores') || '[]');
    const targetIds = ['highscore-board', 'menu-highscore-board'];
    
    targetIds.forEach(id => {
      const boardEl = document.getElementById(id);
      if (boardEl) {
        if (scores.length === 0) {
          boardEl.innerHTML = '<div style="font-size:0.85rem; color:#aaa; text-align:center; padding:10px 0;">No high scores saved yet</div>';
        } else {
          boardEl.innerHTML = scores.slice(0, 5).map((s, idx) => {
            const displayName = (s.name || 'HERO').toUpperCase().slice(0, 4).padEnd(4, ' ');
            return `
              <div style="display:flex; justify-content:space-between; align-items:center; margin:6px 0; font-size:0.9rem; color:${idx === 0 ? '#ffd700' : '#fff'};">
                <span style="display:flex; align-items:center; gap:6px;">
                  <span>#${idx + 1}</span>
                  <strong style="color:var(--accent-cyan); font-family:'Press Start 2P', monospace; font-size:0.75rem; letter-spacing:1px; background:rgba(24,255,255,0.15); padding:2px 6px; border-radius:4px; border:1px solid rgba(24,255,255,0.3);">${displayName}</strong>
                </span>
                <span style="font-weight:700;">${(s.score || 0).toLocaleString()} PTS</span>
                <span style="font-size:0.8rem; color:#aaa;">WAVE ${s.wave || 1}</span>
              </div>
            `;
          }).join('');
        }
      }
    });
  }

  checkGameOver() {
    const allGhosts = this.players.every(p => p.isGhost);
    if (allGhosts && this.state !== 'GAME_OVER') {
      this.state = 'GAME_OVER';

      // Load saved player name preference or default to HERO
      const savedName = (localStorage.getItem('hellpang_player_name') || 'HERO').toUpperCase().slice(0, 4);
      this.currentRunId = 'run_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

      // Save Local High Score Leaderboard
      const scores = JSON.parse(localStorage.getItem('hellpang_highscores') || '[]');
      const newEntry = {
        id: this.currentRunId,
        name: savedName,
        score: this.score,
        wave: this.wave,
        date: new Date().toLocaleDateString()
      };
      scores.push(newEntry);
      scores.sort((a, b) => b.score - a.score);
      const topScores = scores.slice(0, 5);
      localStorage.setItem('hellpang_highscores', JSON.stringify(topScores));

      const nameInput = document.getElementById('player-name-input');
      if (nameInput) {
        nameInput.value = savedName;
      }

      const statusEl = document.getElementById('name-save-status');
      if (statusEl) {
        statusEl.innerText = 'SAVED: ' + savedName;
      }

      this.renderLeaderboard();

      document.getElementById('final-score').innerText = this.score;
      document.getElementById('final-wave').innerText = this.wave;
      document.getElementById('gameover-screen').classList.remove('hidden');

      setTimeout(() => {
        const nameInput = document.getElementById('player-name-input');
        if (nameInput) {
          nameInput.focus();
          nameInput.select();
        }
      }, 150);

      audioManager.playBgm('gameover', 'menu');
    }
  }

  // --- Main Render Pass --- //
  draw() {
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;

    if (this.screenShake > 0) {
      const rx = (Math.random() - 0.5) * this.screenShake;
      const ry = (Math.random() - 0.5) * this.screenShake;
      this.ctx.translate(rx, ry);
      this.screenShake *= 0.85;
      if (this.screenShake < 0.5) this.screenShake = 0;
    }

    // 1. Draw Premium HD Background Image (or Custom User Desktop Image if uploaded!)
    let currentBgImg = this.customBgImage;
    if (!currentBgImg) {
      const kawaiiBgs = [SPRITES.bgMatcha, SPRITES.bgStrawberry, SPRITES.bgTaro];
      currentBgImg = kawaiiBgs[(this.wave - 1) % kawaiiBgs.length];
    }

    if (currentBgImg && currentBgImg.complete && currentBgImg.naturalWidth > 0) {
      this.ctx.drawImage(currentBgImg, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
      
      // Soft background fade scrim overlay to improve gameplay focus and contrast
      this.ctx.fillStyle = 'rgba(15, 10, 28, 0.35)';
      this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    } else {
      this.ctx.fillStyle = '#120c24';
      this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
    }

    this.ctx.drawImage(this.decalCanvas, 0, 0);

    // Scalloped Pastel Floor Line
    this.ctx.strokeStyle = '#a5d6a7';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(CONFIG.WALL_LEFT, CONFIG.FLOOR_Y);
    this.ctx.lineTo(CONFIG.WALL_RIGHT, CONFIG.FLOOR_Y);
    this.ctx.stroke();

    this.particles.forEach(p => p.draw(this.ctx));
    this.crystals.forEach(c => c.draw(this.ctx));
    this.acidHazards.forEach(h => h.draw(this.ctx));
    if (this.platforms) this.platforms.forEach(plat => plat.draw(this.ctx));
    this.grapples.forEach(g => g.draw(this.ctx, this));
    this.bullets.forEach(b => b.draw(this.ctx));
    this.bobas.forEach(b => b.draw(this.ctx));
    this.players.forEach(p => p.draw(this.ctx));

    this.drawHUD();

    this.ctx.restore();
  }

  drawHUD() {
    this.ctx.save();

    // High-contrast HUD Drop Shadow & Stroke styling
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    this.ctx.shadowBlur = 8;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    // SCORE & WAVE Text with Black Outline
    this.ctx.font = '20px "Press Start 2P"';
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#000';
    this.ctx.fillStyle = '#fff';

    this.ctx.strokeText(`SCORE: ${this.score}`, 40, 40);
    this.ctx.fillText(`SCORE: ${this.score}`, 40, 40);

    this.ctx.strokeText(`WAVE: ${this.wave}`, CONFIG.CANVAS_WIDTH - 220, 40);
    this.ctx.fillText(`WAVE: ${this.wave}`, CONFIG.CANVAS_WIDTH - 220, 40);

    // Muted HUD Status Badge
    if (typeof audioManager !== 'undefined' && audioManager.muted) {
      this.ctx.font = '10px "Press Start 2P"';
      this.ctx.fillStyle = '#ff1744';
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 3;
      this.ctx.strokeText('🔇 MUTED [M]', CONFIG.CANVAS_WIDTH - 220, 62);
      this.ctx.fillText('🔇 MUTED [M]', CONFIG.CANVAS_WIDTH - 220, 62);
    }

    // Continuous Health Bars & Blue Shield Bar HUD
    this.players.forEach((p, idx) => {
      const offsetX = 40 + idx * 260;
      const barY = CONFIG.CANVAS_HEIGHT - 30;
      const barW = 140;
      const barH = 14;

      const hasShield = (p.maxShield > 0 || p.shield > 0);
      const backdropH = hasShield ? barH + 28 : barH + 18;
      const backdropY = hasShield ? barY - 34 : barY - 26;

      // Dark translucent backdrop panel for player health HUD
      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      this.ctx.fillRect(offsetX - 10, backdropY, barW + 55, backdropH);
      this.ctx.strokeStyle = hasShield ? 'rgba(24, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.25)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(offsetX - 10, backdropY, barW + 55, backdropH);

      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      this.ctx.shadowBlur = 6;
      this.ctx.font = '14px "Fredoka"';
      this.ctx.fillStyle = p.color;
      this.ctx.fillText(p.name, offsetX, barY - 8);

      if (p.isGhost) {
        this.ctx.fillStyle = '#b388ff';
        this.ctx.fillText('👻 GHOST', offsetX + 40, barY + 10);
      } else {
        // 1. Second Blue Shield Health Bar (Stacked directly above Health Bar!)
        if (hasShield) {
          const shieldBarY = barY - 26;
          const shieldBarH = 8;

          // Shield Bar Dark Background
          this.ctx.fillStyle = 'rgba(0, 30, 60, 0.85)';
          this.ctx.fillRect(offsetX + 35, shieldBarY, barW, shieldBarH);

          // Shield Current Fill (Cyan / Electric Blue)
          const shieldWidth = Math.max(0, Math.min(barW, (p.shield / p.maxHealth) * barW));
          this.ctx.fillStyle = '#18ffff';
          this.ctx.shadowColor = '#18ffff';
          this.ctx.shadowBlur = 5;
          this.ctx.fillRect(offsetX + 35, shieldBarY, shieldWidth, shieldBarH);
          this.ctx.shadowBlur = 0;

          // Shield Border
          this.ctx.strokeStyle = '#00e5ff';
          this.ctx.lineWidth = 1;
          this.ctx.strokeRect(offsetX + 35, shieldBarY, barW, shieldBarH);
        }

        // 2. Primary Red/Green Health Bar
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(offsetX + 35, barY - 14, barW, barH);

        // Current Health Fill
        const hpWidth = Math.max(0, (p.health / p.maxHealth) * barW);
        this.ctx.fillStyle = p.health > 40 ? '#00e676' : '#ff1744';
        this.ctx.fillRect(offsetX + 35, barY - 14, hpWidth, barH);

        // Border
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(offsetX + 35, barY - 14, barW, barH);
      }
    });

    // XP Progress Bar Header Pill
    const barW = 380;
    const barH = 16;
    const barX = (CONFIG.CANVAS_WIDTH - barW) / 2;
    const barY = 25;

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    this.ctx.fillRect(barX - 70, barY - 8, barW + 80, barH + 16);
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX - 70, barY - 8, barW + 80, barH + 16);

    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    this.ctx.shadowBlur = 6;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fillRect(barX, barY, barW, barH);

    const progress = Math.min(1, this.teamXP / this.xpToNextLevel);
    this.ctx.fillStyle = '#ffd700';
    this.ctx.fillRect(barX, barY, barW * progress, barH);

    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barW, barH);

    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = '#000';
    this.ctx.font = '12px "Press Start 2P"';
    this.ctx.fillStyle = '#fff';
    this.ctx.strokeText(`LVL ${this.teamLevel}`, barX - 60, barY + 13);
    this.ctx.fillText(`LVL ${this.teamLevel}`, barX - 60, barY + 13);

    // Global Electric Battery HUD Gauge (Displays when Electric Tripwire is unlocked)
    if (this.playerStats.stickyResidue) {
      const batW = 200;
      const batH = 12;
      const batX = (CONFIG.CANVAS_WIDTH - batW) / 2;
      const batY = 50;

      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      this.ctx.fillRect(batX, batY, batW, batH);

      const batProgress = Math.max(0, this.playerStats.electricBattery / this.playerStats.maxElectricBattery);
      this.ctx.fillStyle = batProgress > 0.25 ? '#18ffff' : '#ff1744';
      this.ctx.fillRect(batX, batY, batW * batProgress, batH);

      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(batX, batY, batW, batH);

      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      this.ctx.shadowBlur = 4;
      this.ctx.font = '10px "Fredoka"';
      this.ctx.fillStyle = '#18ffff';
      this.ctx.strokeText(`⚡ BATTERY: ${Math.ceil(batProgress * 100)}%`, batX + 55, batY + 10);
      this.ctx.fillText(`⚡ BATTERY: ${Math.ceil(batProgress * 100)}%`, batX + 55, batY + 10);
    }

    // Gatling Machine Gun Frenzy HUD Gauge
    if (this.playerStats.gatlingAmmoTimer > 0) {
      const gatW = 220;
      const gatH = 14;
      const gatX = (CONFIG.CANVAS_WIDTH - gatW) / 2;
      const gatY = this.playerStats.stickyResidue ? 68 : 50;

      this.ctx.shadowBlur = 0;
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      this.ctx.fillRect(gatX, gatY, gatW, gatH);

      const ammoSec = (this.playerStats.gatlingAmmoTimer / 60).toFixed(1);
      const gatProgress = Math.max(0, this.playerStats.gatlingAmmoTimer / 600);
      this.ctx.fillStyle = '#ff4081';
      this.ctx.fillRect(gatX, gatY, gatW * Math.min(1, gatProgress), gatH);

      this.ctx.strokeStyle = '#ffd700';
      this.ctx.lineWidth = 1.5;
      this.ctx.strokeRect(gatX, gatY, gatW, gatH);

      this.ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      this.ctx.shadowBlur = 4;
      this.ctx.font = '10px "Fredoka"';
      this.ctx.fillStyle = '#fff';
      this.ctx.strokeText(`🔫 GATLING FRENZY: ${ammoSec}s`, gatX + 45, gatY + 11);
      this.ctx.fillText(`🔫 GATLING FRENZY: ${ammoSec}s`, gatX + 45, gatY + 11);
    }

    // Flashing Boss Warning Banner
    if (this.bossWarningTimer > 0) {
      this.ctx.save();
      const alpha = ((Math.sin(Date.now() / 100) + 1) / 2) * 0.7 + 0.3;
      this.ctx.fillStyle = `rgba(255, 0, 85, ${alpha * 0.4})`;
      this.ctx.fillRect(0, CONFIG.CANVAS_HEIGHT / 2 - 45, CONFIG.CANVAS_WIDTH, 90);

      this.ctx.font = 'bold 20px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = '#000';
      this.ctx.fillStyle = '#ff0055';
      this.ctx.strokeText(`⚠️ WARNING! WAVE ${this.wave} BOSS APPROACHING! ⚠️`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 8);
      this.ctx.fillText(`⚠️ WARNING! WAVE ${this.wave} BOSS APPROACHING! ⚠️`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 8);
      this.ctx.restore();
    }

    // --- Wave Clear Victory Banner Overlay ---
    if (this.state === 'WAVE_CLEAR') {
      this.ctx.save();
      const bannerW = 480;
      const bannerH = 95;
      const bannerX = (CONFIG.CANVAS_WIDTH - bannerW) / 2;
      const bannerY = CONFIG.CANVAS_HEIGHT / 2 - 60;

      this.ctx.fillStyle = 'rgba(15, 10, 28, 0.78)';
      this.ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
      this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.85)';
      this.ctx.lineWidth = 3;
      this.ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

      this.ctx.font = 'bold 22px "Press Start 2P"';
      this.ctx.textAlign = 'center';
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = '#000';
      this.ctx.fillStyle = '#ffd700';
      this.ctx.strokeText(`✨ WAVE ${this.wave} CLEARED! ✨`, CONFIG.CANVAS_WIDTH / 2, bannerY + 42);
      this.ctx.fillText(`✨ WAVE ${this.wave} CLEARED! ✨`, CONFIG.CANVAS_WIDTH / 2, bannerY + 42);

      this.ctx.font = 'bold 12px "Press Start 2P"';
      this.ctx.fillStyle = '#69f0ae';
      this.ctx.strokeText('💚 +HEALTH RESTORED!', CONFIG.CANVAS_WIDTH / 2, bannerY + 74);
      this.ctx.fillText('💚 +HEALTH RESTORED!', CONFIG.CANVAS_WIDTH / 2, bannerY + 74);
      this.ctx.restore();
    }

    // --- Wave Intermission Fade & Title Overlay ---
    if (this.state === 'WAVE_TRANSITION') {
      this.ctx.save();
      let fadeAlpha = 0;
      if (this.waveTransitionTimer > 55) {
        fadeAlpha = 1 - (this.waveTransitionTimer - 55) / 55; // Fade in to black
      } else {
        fadeAlpha = this.waveTransitionTimer / 55; // Fade out from black
      }

      this.ctx.fillStyle = `rgba(10, 6, 20, ${Math.min(0.96, Math.max(0, fadeAlpha))})`;
      this.ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

      this.ctx.textAlign = 'center';
      this.ctx.lineWidth = 4;
      this.ctx.strokeStyle = '#000';

      if (this.waveTransitionTimer > 55) {
        const nextWaveNum = this.wave + 1;
        this.ctx.font = 'bold 24px "Press Start 2P"';
        this.ctx.fillStyle = '#b388ff';
        this.ctx.strokeText(`WAVE ${nextWaveNum} STARTING...`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        this.ctx.fillText(`WAVE ${nextWaveNum} STARTING...`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
      } else {
        if (this.waveTransitionTimer > 25) {
          this.ctx.font = 'bold 36px "Press Start 2P"';
          this.ctx.fillStyle = '#18ffff';
          this.ctx.strokeText(`WAVE ${this.wave}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
          this.ctx.fillText(`WAVE ${this.wave}`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        } else {
          this.ctx.font = 'bold 48px "Press Start 2P"';
          this.ctx.fillStyle = '#ffd700';
          this.ctx.strokeText(`⚡ GO! ⚡`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
          this.ctx.fillText(`⚡ GO! ⚡`, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);
        }
      }
      this.ctx.restore();
    }

    if (this.showDevStats) {
      this.drawDevStatsHUD();
    }

    this.ctx.restore();
  }

  drawDevStatsHUD() {
    this.ctx.save();
    const boxW = 285;
    const boxH = 370;
    const boxX = CONFIG.CANVAS_WIDTH - boxW - 15;
    const boxY = 15;

    // Translucent dark window with neon green border
    this.ctx.fillStyle = 'rgba(8, 12, 22, 0.92)';
    this.ctx.fillRect(boxX, boxY, boxW, boxH);
    this.ctx.strokeStyle = '#00e676';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Title Header
    this.ctx.fillStyle = 'rgba(0, 230, 118, 0.18)';
    this.ctx.fillRect(boxX, boxY, boxW, 24);
    this.ctx.font = 'bold 11px monospace';
    this.ctx.fillStyle = '#00e676';
    this.ctx.fillText('🛠️ DEV STATS & ENGINE HUD [101]', boxX + 8, boxY + 16);

    let lineY = boxY + 40;
    const lineStep = 16;
    this.ctx.font = '10px monospace';

    // 1. Performance & Engine Metrics
    const fpsVal = this.fps !== undefined ? this.fps : 60;
    this.ctx.fillStyle = '#18ffff';
    this.ctx.fillText(`[PERF] FPS: ${fpsVal} | Frame: ${this.frameCount || 0}`, boxX + 10, lineY);
    lineY += lineStep;

    this.ctx.fillStyle = '#fff';
    const wMult = this.getWaveDamageMultiplier();
    const isMutedStr = typeof audioManager !== 'undefined' && audioManager.muted ? 'MUTED' : 'ON';
    this.ctx.fillText(`State: ${this.state} | Wave: ${this.wave} | Audio: ${isMutedStr}`, boxX + 10, lineY);
    lineY += lineStep;

    const gravity = CONFIG.GET_GRAVITY(this.wave);
    this.ctx.fillText(`Gravity: ${gravity.toFixed(3)} | Shake: ${this.screenShake.toFixed(1)}`, boxX + 10, lineY);
    lineY += lineStep + 6;

    // 2. Active Entity Breakdown
    const witchCount = this.bobas.filter(b => b.type === 'WITCH').length;
    const jellyCount = this.bobas.filter(b => b.type === 'JELLY').length;
    const bossCount = this.bobas.filter(b => b.type === 'BOSS').length;
    const stdCount = this.bobas.length - witchCount - jellyCount - bossCount;

    this.ctx.fillStyle = '#ffd700';
    this.ctx.fillText(`[ENTITIES] Total Bobas: ${this.bobas.length}`, boxX + 10, lineY);
    lineY += lineStep;

    this.ctx.fillStyle = '#e0e0e0';
    this.ctx.fillText(` - Standard: ${stdCount} | Jelly: ${jellyCount}`, boxX + 10, lineY);
    lineY += lineStep;
    this.ctx.fillText(` - Witch: ${witchCount} | Boss: ${bossCount}`, boxX + 10, lineY);
    lineY += lineStep;

    this.ctx.fillText(` - Cables: ${this.grapples.length} | Bullets: ${this.bullets.length}`, boxX + 10, lineY);
    lineY += lineStep;

    this.ctx.fillText(` - Particles: ${this.particles.length} | Crystals: ${this.crystals.length}`, boxX + 10, lineY);
    lineY += lineStep + 6;

    // 3. Stacked Card Buffs & Player Modifiers
    this.ctx.fillStyle = '#ff4081';
    this.ctx.fillText(`[STACKED CARD MODIFIERS]`, boxX + 10, lineY);
    lineY += lineStep;

    const moveSpeedPct = Math.round((this.playerStats.moveSpeed / CONFIG.PLAYER_SPEED) * 100);
    this.ctx.fillStyle = '#fff';
    this.ctx.fillText(` - Move Speed: ${moveSpeedPct}%`, boxX + 10, lineY);
    lineY += lineStep;

    const harpoonType = this.playerStats.vHarpoonSplit === 2 ? 'W-Spread (3-Way)' : (this.playerStats.vHarpoonSplit === 1 ? 'V-Split (2-Way)' : 'Straight (1-Way)');
    this.ctx.fillText(` - Harpoon Pattern: ${harpoonType}`, boxX + 10, lineY);
    lineY += lineStep;

    this.ctx.fillText(` - Max Harpoon Slots: ${this.playerStats.maxGrapples}`, boxX + 10, lineY);
    lineY += lineStep;

    const batPct = this.playerStats.stickyResidue ? `${Math.ceil((this.playerStats.electricBattery / 600) * 100)}%` : 'EXPIRED/OFF';
    this.ctx.fillText(` - Electric Battery: ${batPct}`, boxX + 10, lineY);
    lineY += lineStep;

    const gatTime = this.playerStats.gatlingAmmoTimer > 0 ? `${(this.playerStats.gatlingAmmoTimer / 60).toFixed(1)}s` : 'OFF';
    this.ctx.fillText(` - Gatling Ammo Timer: ${gatTime}`, boxX + 10, lineY);
    lineY += lineStep;

    const detRad = this.playerStats.juiceDetonationRadius > 0 ? `${this.playerStats.juiceDetonationRadius}px` : 'OFF';
    this.ctx.fillText(` - Juice Detonation: ${detRad}`, boxX + 10, lineY);
    lineY += lineStep;

    this.ctx.fillText(` - Matcha Pulse: ${this.playerStats.matchaPulse ? 'ACTIVE' : 'OFF'}`, boxX + 10, lineY);
    lineY += lineStep;

    const vampHp = this.playerStats.vampiricSyringe > 0 ? `+${this.playerStats.vampiricSyringe} HP` : 'OFF';
    this.ctx.fillText(` - Vampiric Heal: ${vampHp}`, boxX + 10, lineY);
    lineY += lineStep;

    this.ctx.fillText(` - XP Magnet Radius: ${this.playerStats.magnetRadius}px`, boxX + 10, lineY);

    this.ctx.restore();
  }
}

// Instantiate game on window launch
window.onload = () => {
  window.game = new Game();
};

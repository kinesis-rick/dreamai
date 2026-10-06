// Save & Load System for Browser LocalStorage, File Export/Import, and Keycode Passcode
class SaveSystem {
  constructor() {
    this.storageKey = 'tux_pc_empire_save';
    this.autoSaveInterval = null;
    this.beforeUnloadHandler = null;
    this.isDisabled = false;
  }

  // Generate serialized game state object
  getSaveState() {
    const econ = window.economySystem;
    const scene = window.gameScene;

    if (!econ || !scene) return null;

    const deskData = scene.desks.map(desk => ({
      id: desk.id,
      deskType: desk.deskType,
      state: desk.state,
      progress: desk.progress || 0,
      passiveTimer: desk.passiveTimer || 0,
      buyerTimer: desk.buyerTimer || 0
    }));

    const helpdeskData = scene.helpdesks.map(hd => ({
      id: hd.id,
      activeAlert: hd.activeAlert,
      ringCountdown: hd.ringCountdown || 10,
      resolutionProgress: hd.resolutionProgress || 0
    }));

    const p1Data = scene.p1 ? {
      x: scene.p1.x,
      y: scene.p1.y,
      carryingItem: scene.p1.carryingItem
    } : null;

    const p2Data = scene.p2 ? {
      x: scene.p2.x,
      y: scene.p2.y,
      carryingItem: scene.p2.carryingItem,
      active: true
    } : { active: false };

    return {
      version: 1,
      timestamp: Date.now(),
      economy: {
        cash: econ.cash,
        unlockedAssemblyDesks: econ.unlockedAssemblyDesks,
        unlockedTestingDesks: econ.unlockedTestingDesks,
        unlockedDesks: econ.unlockedDesks,
        notifiedCalls: econ.notifiedCalls || false,
        buildingTier: econ.buildingTier,
        reviewStars: econ.reviewStars,
        totalReviews: econ.totalReviews,
        missedCallPenalties: econ.missedCallPenalties,
        currentDay: econ.currentDay,
        dayTimer: econ.dayTimer,
        helpers: { ...econ.helpers }
      },
      desks: deskData,
      helpdesks: helpdeskData,
      game: {
        boxedPCItemsCount: scene.boxedPCItemsCount,
        p1: p1Data,
        p2: p2Data
      },
      settings: {
        muted: window.soundSystem ? window.soundSystem.muted : false,
        labelSettings: scene.labelSettings ? { ...scene.labelSettings } : null,
        hasSeenTutorial: !!localStorage.getItem('tux_pc_tutorial_seen')
      }
    };
  }

  // Restore game state from object
  loadSaveState(data) {
    if (!data || !data.economy || !data.desks) {
      console.error('Invalid save data format');
      if (window.uiSystem) window.uiSystem.showAlert('⚠️ Failed to load save: Invalid file format');
      return false;
    }

    try {
      const econ = window.economySystem;
      const scene = window.gameScene;

      if (!econ || !scene) return false;

      // 1. Restore Economy System
      econ.cash = data.economy.cash;
      if (data.economy.unlockedAssemblyDesks !== undefined) {
        econ.unlockedAssemblyDesks = data.economy.unlockedAssemblyDesks;
        econ.unlockedTestingDesks = data.economy.unlockedTestingDesks !== undefined ? data.economy.unlockedTestingDesks : 1;
      } else if (data.economy.unlockedDesks !== undefined) {
        econ.unlockedDesks = data.economy.unlockedDesks;
      }
      econ.notifiedCalls = !!data.economy.notifiedCalls;
      econ.buildingTier = data.economy.buildingTier;
      econ.reviewStars = data.economy.reviewStars;
      econ.totalReviews = data.economy.totalReviews;
      econ.missedCallPenalties = data.economy.missedCallPenalties;
      econ.currentDay = data.economy.currentDay;
      econ.dayTimer = data.economy.dayTimer;
      econ.helpers = { ...data.economy.helpers };

      if (data.settings && data.settings.hasSeenTutorial) {
        localStorage.setItem('tux_pc_tutorial_seen', 'true');
      }

      // Ensure game scene instantiates desks/helpdesks matching restored unlocked counts
      if (scene.refreshFacilityVisibility) {
        scene.refreshFacilityVisibility();
      }

      // 2. Restore Desks & Realign to Warehouse Line Layout
      data.desks.forEach(savedDesk => {
        const desk = scene.desks.find(d => d.id === savedDesk.id);
        if (desk) {
          desk.state = savedDesk.state;
          desk.progress = savedDesk.progress || 0;
          desk.passiveTimer = savedDesk.passiveTimer || 0;
          desk.buyerTimer = savedDesk.buyerTimer || 0;
          desk.occupiedBy = null;
          
          if (desk.sanitizeState) desk.sanitizeState();
          desk.updateSprite();
          desk.showProgress(desk.progress);
        }
      });

      // 3. Restore Helpdesks
      if (data.helpdesks) {
        data.helpdesks.forEach(savedHd => {
          const hd = scene.helpdesks.find(h => h.id === savedHd.id);
          if (hd) {
            hd.activeAlert = savedHd.activeAlert;
            hd.ringCountdown = savedHd.ringCountdown;
            hd.resolutionProgress = savedHd.resolutionProgress;
            hd.occupiedBy = null;

            // Recalculate spatial coordinates to align against top-right wall
            if (scene.getHelpdeskGridCoord) {
              const coord = scene.getHelpdeskGridCoord(hd.id);
              hd.gridX = coord.gx;
              hd.gridY = coord.gy;
              const pos = scene.gridToIso(coord.gx, coord.gy);
              hd.x = pos.x;
              hd.y = pos.y;
              hd.container.setPosition(pos.x, pos.y);
              hd.container.setDepth(pos.y + 16);
            }

            if (!hd.activeAlert) {
              hd.sprite.setFrame(14);
              hd.sirenGlow.setVisible(false);
              hd.barBg.setVisible(false);
              hd.barFill.setVisible(false);
            }
          }
        });
      }

      // 4. Restore Dispatch Pad visual count
      if (data.game) {
        scene.boxedPCItemsCount = data.game.boxedPCItemsCount || 0;
        if (scene.updateDispatchBoxStack) {
          scene.updateDispatchBoxStack();
        }

        // Restore Player 1 position & carrying item
        if (data.game.p1 && scene.p1) {
          scene.p1.x = data.game.p1.x;
          scene.p1.y = data.game.p1.y;
          scene.p1.carryingItem = data.game.p1.carryingItem;
          scene.p1.container.setPosition(scene.p1.x, scene.p1.y);
        }

        // Restore Player 2 Co-op state
        if (data.game.p2 && data.game.p2.active) {
          scene.togglePlayer2(true);
          if (scene.p2) {
            scene.p2.x = data.game.p2.x;
            scene.p2.y = data.game.p2.y;
            scene.p2.carryingItem = data.game.p2.carryingItem;
            scene.p2.container.setPosition(scene.p2.x, scene.p2.y);
          }
          const btnCoop = document.getElementById('btn-coop');
          if (btnCoop) {
            btnCoop.classList.add('active');
            btnCoop.querySelector('.label').textContent = 'Co-op: ON';
          }
        }
      }

      // 5. Update Background Texture for Building Tier
      const tierBgKey = econ.buildingTier === 0 ? 'garage_bg' : (econ.buildingTier === 1 ? 'warehouse1_bg' : 'warehouse2_bg');
      if (scene.bgSprite) {
        scene.bgSprite.setTexture(tierBgKey);
      }
      scene.refreshDeskVisibility();
      scene.syncAIPenguins();

      // 6. Restore Settings
      if (data.settings) {
        if (window.soundSystem && data.settings.muted !== undefined) {
          window.soundSystem.muted = !!data.settings.muted;
          const btnMute = document.getElementById('btn-toggle-mute');
          if (btnMute) {
            btnMute.textContent = window.soundSystem.muted ? '🔇 Unmute Sound' : '🔊 Mute Sound';
          }
        }
        if (scene && data.settings.labelSettings) {
          scene.labelSettings = { ...scene.labelSettings, ...data.settings.labelSettings };
          if (scene.applyLabelSettings) scene.applyLabelSettings();
          if (window.uiSystem && window.uiSystem.syncLabelCheckboxes) {
            window.uiSystem.syncLabelCheckboxes();
          }
        } else if (window.uiSystem && data.settings.showLabels !== undefined) {
          window.uiSystem.toggleLabels(!!data.settings.showLabels);
        }
      }

      // 7. Update UI HUD
      if (window.uiSystem) {
        window.uiSystem.updateHUD();
        window.uiSystem.showAlert('✅ Game Progress Successfully Loaded!');
      }

      return true;
    } catch (err) {
      console.error('Error applying save data:', err);
      if (window.uiSystem) window.uiSystem.showAlert('⚠️ Error restoring save state');
      return false;
    }
  }

  // LocalStorage Save & Load
  saveToLocalStorage() {
    if (this.isDisabled) return false;
    const data = this.getSaveState();
    if (!data) return false;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      return false;
    }
  }

  loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return this.loadSaveState(data);
    } catch (e) {
      console.error('Failed to parse localStorage save:', e);
      return false;
    }
  }

  hasLocalStorageSave() {
    return !!localStorage.getItem(this.storageKey);
  }

  clearLocalStorage() {
    this.stopAutoSave();
    this.isDisabled = true;
    try {
      localStorage.removeItem(this.storageKey);
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  }

  // File Save Export & Import (.json)
  exportToFile() {
    const data = this.getSaveState();
    if (!data) return;

    const day = data.economy.currentDay;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `PC_Building_Empire_Save_Day${day}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.uiSystem) window.uiSystem.showAlert('💾 Save File Downloaded!');
  }

  importFromFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const success = this.loadSaveState(data);
        if (success) {
          this.saveToLocalStorage(); // Sync to local storage
        }
      } catch (err) {
        console.error('Invalid save JSON file:', err);
        if (window.uiSystem) window.uiSystem.showAlert('⚠️ Invalid Save File!');
      }
    };
    reader.readAsText(file);
  }

  // Keycode Base64 Save String Export & Import
  exportToKeycode() {
    const data = this.getSaveState();
    if (!data) return '';

    try {
      const jsonStr = JSON.stringify(data);
      // UTF-8 to Base64 encoding
      const base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode('0x' + p1);
      }));
      return `TUX1-${base64}`;
    } catch (e) {
      console.error('Error generating keycode:', e);
      return '';
    }
  }

  importFromKeycode(codeStr) {
    if (!codeStr || typeof codeStr !== 'string') return false;

    let cleanCode = codeStr.trim();
    if (cleanCode.startsWith('TUX1-')) {
      cleanCode = cleanCode.substring(5);
    }

    try {
      const jsonStr = decodeURIComponent(atob(cleanCode).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const data = JSON.parse(jsonStr);
      const success = this.loadSaveState(data);
      if (success) {
        this.saveToLocalStorage();
      }
      return success;
    } catch (e) {
      console.error('Failed to decode save keycode:', e);
      if (window.uiSystem) window.uiSystem.showAlert('⚠️ Invalid Save Keycode!');
      return false;
    }
  }

  // Auto-Save background timer (runs every 10 seconds)
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }

  startAutoSave(intervalMs = 10000) {
    this.isDisabled = false;
    this.stopAutoSave();

    this.autoSaveInterval = setInterval(() => {
      this.saveToLocalStorage();
    }, intervalMs);

    this.beforeUnloadHandler = () => {
      this.saveToLocalStorage();
    };
    window.addEventListener('beforeunload', this.beforeUnloadHandler);
  }
}

window.saveSystem = new SaveSystem();

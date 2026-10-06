// UI & HUD System
class UISystem {
  constructor() {
    this.alertTimeout = null;
    this.isPaused = false;
    this.lastCash = null;
    this.bindEvents();
  }

  bindEvents() {
    // Hire Helpers Button
    const btnHire = document.getElementById('btn-hire');
    if (btnHire) {
      btnHire.addEventListener('click', () => this.openModal('modal-hire'));
    }

    // Upgrade Building Button
    const btnUpgrade = document.getElementById('btn-upgrade');
    if (btnUpgrade) {
      btnUpgrade.addEventListener('click', () => this.openModal('modal-upgrade'));
    }

    // Dropdown Quick Action Buttons
    const btnDropdownSave = document.getElementById('btn-dropdown-save');
    if (btnDropdownSave) {
      btnDropdownSave.addEventListener('click', () => {
        const dropdownMenu = document.getElementById('labels-dropdown-menu');
        if (dropdownMenu) dropdownMenu.classList.remove('open');
        this.openModal('modal-save');
      });
    }

    const btnDropdownPause = document.getElementById('btn-dropdown-pause');
    if (btnDropdownPause) {
      btnDropdownPause.addEventListener('click', () => {
        const dropdownMenu = document.getElementById('labels-dropdown-menu');
        if (dropdownMenu) dropdownMenu.classList.remove('open');
        this.togglePause(true);
      });
    }

    const btnDropdownCoop = document.getElementById('btn-dropdown-coop');
    if (btnDropdownCoop) {
      btnDropdownCoop.addEventListener('click', () => {
        const input = window.inputSystem;
        if (input) {
          input.coopEnabled = !input.coopEnabled;
          if (window.gameScene) {
            window.gameScene.togglePlayer2(input.coopEnabled);
          }
          this.showAlert(input.coopEnabled ? '🎮 Player 2 (Co-op) Joined!' : '🎮 Player 2 (Co-op) Left');
        }
      });
    }

    const btnDropdownMute = document.getElementById('btn-dropdown-mute');
    if (btnDropdownMute) {
      btnDropdownMute.addEventListener('click', () => this.toggleMute());
    }

    const btnDropdownTutorial = document.getElementById('btn-dropdown-tutorial');
    if (btnDropdownTutorial) {
      btnDropdownTutorial.addEventListener('click', () => {
        const dropdownMenu = document.getElementById('labels-dropdown-menu');
        if (dropdownMenu) dropdownMenu.classList.remove('open');
        this.openModal('modal-tutorial');
      });
    }

    const btnGotIt = document.getElementById('btn-got-it-tutorial');
    if (btnGotIt) {
      btnGotIt.addEventListener('click', () => this.markTutorialSeen());
    }

    const btnCloseTutorial = document.getElementById('btn-close-tutorial');
    if (btnCloseTutorial) {
      btnCloseTutorial.addEventListener('click', () => this.markTutorialSeen());
    }

    const btnResume = document.getElementById('btn-resume-game');
    if (btnResume) {
      btnResume.addEventListener('click', () => this.togglePause(false));
    }

    // Mute Sound Button
    const btnMute = document.getElementById('btn-toggle-mute');
    if (btnMute) {
      btnMute.addEventListener('click', () => this.toggleMute());
    }

    // Options Dropdown Toggle Button & Settings
    const btnToggleLabels = document.getElementById('btn-toggle-labels');
    const dropdownMenu = document.getElementById('labels-dropdown-menu');

    if (btnToggleLabels && dropdownMenu) {
      btnToggleLabels.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('open');
        this.syncLabelCheckboxes();
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.hud-dropdown-wrapper') && !e.target.closest('#modal-display-settings')) {
          if (dropdownMenu) dropdownMenu.classList.remove('open');
        }
      });
    }

    // Bind dropdown checkbox change listeners
    const checkboxMap = {
      'chk-staff-roles': 'staffRoles',
      'chk-desk-labels': 'deskLabels',
      'chk-idle-labels': 'idleLabels',
      'chk-progress-bars': 'progressBars',
      'chk-money-notifications': 'moneyNotifications',
      'chk-activity-alerts': 'activityAlerts'
    };

    for (const chkId in checkboxMap) {
      const chk = document.getElementById(chkId);
      if (chk) {
        chk.addEventListener('change', (e) => {
          const settingKey = checkboxMap[chkId];
          if (window.gameScene) {
            window.gameScene.setLabelSetting(settingKey, e.target.checked);
          }
        });
      }
    }

    // Quick All ON / All OFF buttons
    const btnAllOn = document.getElementById('btn-labels-all-on');
    if (btnAllOn) {
      btnAllOn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setAllLabelSettings(true);
      });
    }

    const btnAllOff = document.getElementById('btn-labels-all-off');
    if (btnAllOff) {
      btnAllOff.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setAllLabelSettings(false);
      });
    }

    // Pause Menu Display Settings button
    const btnPauseLabels = document.getElementById('btn-pause-labels');
    if (btnPauseLabels) {
      btnPauseLabels.addEventListener('click', () => {
        this.togglePause(false);
        this.openModal('modal-display-settings');
      });
    }

    // Key shortcuts: 'P' or 'Escape' for pause, 'M' for mute, 'L' for dropdown
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      } else if (e.code === 'KeyM') {
        this.toggleMute();
      } else if (e.code === 'KeyL') {
        if (dropdownMenu) {
          dropdownMenu.classList.toggle('open');
          this.syncLabelCheckboxes();
        }
      }
    });

    // Save & Load Buttons
    const btnSaveMenu = document.getElementById('btn-save-menu');
    if (btnSaveMenu) {
      btnSaveMenu.addEventListener('click', () => this.openModal('modal-save'));
    }

    const btnPauseSave = document.getElementById('btn-pause-save');
    if (btnPauseSave) {
      btnPauseSave.addEventListener('click', () => {
        this.togglePause(false);
        this.openModal('modal-save');
      });
    }

    // Save LocalStorage
    const btnSaveLocal = document.getElementById('btn-save-local');
    if (btnSaveLocal) {
      btnSaveLocal.addEventListener('click', () => {
        if (window.saveSystem && window.saveSystem.saveToLocalStorage()) {
          this.showAlert('💾 Progress Saved to Browser Local Storage!');
        }
      });
    }

    // Load LocalStorage
    const btnLoadLocal = document.getElementById('btn-load-local');
    if (btnLoadLocal) {
      btnLoadLocal.addEventListener('click', () => {
        if (window.saveSystem) {
          if (!window.saveSystem.hasLocalStorageSave()) {
            this.showAlert('⚠️ No auto-save data found in browser!');
          } else {
            window.saveSystem.loadFromLocalStorage();
          }
        }
      });
    }

    // Export File (.json)
    const btnExportFile = document.getElementById('btn-export-file');
    if (btnExportFile) {
      btnExportFile.addEventListener('click', () => {
        if (window.saveSystem) window.saveSystem.exportToFile();
      });
    }

    // Import File (.json)
    const btnImportFile = document.getElementById('btn-import-file');
    const importFileInput = document.getElementById('import-file-input');
    if (btnImportFile && importFileInput) {
      btnImportFile.addEventListener('click', () => importFileInput.click());
      importFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0] && window.saveSystem) {
          window.saveSystem.importFromFile(e.target.files[0]);
          e.target.value = ''; // reset
        }
      });
    }

    // Generate Keycode
    const btnGenKeycode = document.getElementById('btn-generate-keycode');
    const keycodeExportInput = document.getElementById('keycode-export-input');
    if (btnGenKeycode && keycodeExportInput) {
      btnGenKeycode.addEventListener('click', () => {
        if (window.saveSystem) {
          const code = window.saveSystem.exportToKeycode();
          keycodeExportInput.value = code;
          this.showAlert('🔑 Save Keycode Generated!');
        }
      });
    }

    // Copy Keycode
    const btnCopyKeycode = document.getElementById('btn-copy-keycode');
    if (btnCopyKeycode && keycodeExportInput) {
      btnCopyKeycode.addEventListener('click', () => {
        if (!keycodeExportInput.value) {
          if (window.saveSystem) keycodeExportInput.value = window.saveSystem.exportToKeycode();
        }
        if (keycodeExportInput.value) {
          navigator.clipboard.writeText(keycodeExportInput.value).then(() => {
            this.showAlert('📋 Save Keycode copied to clipboard!');
          }).catch(() => {
            keycodeExportInput.select();
            document.execCommand('copy');
            this.showAlert('📋 Save Keycode copied!');
          });
        }
      });
    }

    // Load Keycode
    const btnLoadKeycode = document.getElementById('btn-load-keycode');
    const keycodeImportInput = document.getElementById('keycode-import-input');
    if (btnLoadKeycode && keycodeImportInput) {
      btnLoadKeycode.addEventListener('click', () => {
        const val = keycodeImportInput.value;
        if (!val) {
          this.showAlert('⚠️ Please enter or paste a valid keycode!');
          return;
        }
        if (window.saveSystem && window.saveSystem.importFromKeycode(val)) {
          keycodeImportInput.value = '';
          this.closeModal('modal-save');
        }
      });
    }

    // Reset / Discard Save
    const btnResetGame = document.getElementById('btn-reset-game');
    if (btnResetGame) {
      btnResetGame.addEventListener('click', () => {
        if (confirm('Are you sure you want to discard your save game and reset? This will wipe all saved progress and restart from scratch!')) {
          if (window.saveSystem) {
            window.saveSystem.clearLocalStorage();
          }
          localStorage.removeItem('tux_pc_tutorial_seen');
          window.location.reload();
        }
      });
    }

    // Modal Close Buttons
    document.querySelectorAll('.btn-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) this.closeModal(modal.id);
      });
    });
  }

  showTutorialIfNeeded() {
    if (!localStorage.getItem('tux_pc_tutorial_seen')) {
      setTimeout(() => {
        this.openModal('modal-tutorial');
      }, 500);
    }
  }

  markTutorialSeen() {
    localStorage.setItem('tux_pc_tutorial_seen', 'true');
    this.closeModal('modal-tutorial');
  }

  togglePause(forceState) {
    this.isPaused = forceState !== undefined ? forceState : !this.isPaused;
    const overlay = document.getElementById('pause-overlay');
    const btnPause = document.getElementById('btn-pause');

    if (overlay) {
      overlay.classList.toggle('open', this.isPaused);
    }
    if (btnPause) {
      btnPause.classList.toggle('active', this.isPaused);
      btnPause.querySelector('.label').textContent = this.isPaused ? 'Resume' : 'Pause';
    }

    if (this.isPaused) {
      this.updatePauseStats();
    }

    if (window.gameScene) {
      window.gameScene.setPaused(this.isPaused);
    }
  }

  toggleMute() {
    if (window.soundSystem) {
      window.soundSystem.muted = !window.soundSystem.muted;
      const isMuted = window.soundSystem.muted;
      const btnMute = document.getElementById('btn-toggle-mute');
      if (btnMute) {
        btnMute.textContent = isMuted ? '🔇 Unmute Sound' : '🔊 Mute Sound';
      }
      this.showAlert(isMuted ? '🔇 Sound Muted (Key M)' : '🔊 Sound Unmuted (Key M)');
    }
  }

  syncLabelCheckboxes() {
    const scene = window.gameScene;
    if (!scene || !scene.labelSettings) return;

    const map = {
      'chk-staff-roles': 'staffRoles',
      'chk-desk-labels': 'deskLabels',
      'chk-idle-labels': 'idleLabels',
      'chk-progress-bars': 'progressBars',
      'chk-money-notifications': 'moneyNotifications',
      'chk-activity-alerts': 'activityAlerts'
    };

    for (const chkId in map) {
      const chk = document.getElementById(chkId);
      if (chk) {
        chk.checked = !!scene.labelSettings[map[chkId]];
      }
    }
  }

  setAllLabelSettings(enabled) {
    if (window.gameScene) {
      window.gameScene.setLabelsVisible(enabled);
      this.syncLabelCheckboxes();
      this.showAlert(enabled ? '🏷️ All Labels & Indicators: ON' : '🏷️ All Labels & Indicators: OFF');
    }
  }

  toggleLabels(forceState) {
    if (window.gameScene) {
      const scene = window.gameScene;
      let allOn = true;
      for (const k in scene.labelSettings) {
        if (!scene.labelSettings[k]) { allOn = false; break; }
      }
      const newState = forceState !== undefined ? forceState : !allOn;
      this.setAllLabelSettings(newState);
    }
  }

  updatePauseStats() {
    const econ = window.economySystem;
    if (!econ) return;

    const elDay = document.getElementById('pause-stat-day');
    const elCash = document.getElementById('pause-stat-cash');
    const elStars = document.getElementById('pause-stat-stars');
    const elDesks = document.getElementById('pause-stat-desks');

    if (elDay) elDay.textContent = `Day ${econ.currentDay}`;
    if (elCash) elCash.textContent = `$${econ.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (elStars) elStars.textContent = `★ ${econ.reviewStars.toFixed(1)}`;
    if (elDesks) {
      const maxDesks = econ.tierSpecs[econ.buildingTier].maxDesks;
      const testCount = econ.unlockedTestingDesks !== undefined ? econ.unlockedTestingDesks : 0;
      elDesks.textContent = `${econ.unlockedAssemblyDesks || 1}B / ${testCount}T (${econ.unlockedDesks}/${maxDesks})`;
    }
  }

  formatShortCost(val) {
    if (val === null || val === undefined) return 'MAX';
    if (val >= 1000000) return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (val >= 1000) return (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1) + 'k';
    return val.toLocaleString();
  }

  updateHUD() {
    const econ = window.economySystem;
    if (!econ) return;

    // Cash
    const elCash = document.getElementById('hud-cash');
    if (elCash) elCash.textContent = `$${econ.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Review Stars
    const elStars = document.getElementById('hud-stars');
    if (elStars) elStars.textContent = `★ ${econ.reviewStars.toFixed(1)}`;

    // Desks Capacity Card
    const elDesks = document.getElementById('hud-desks');
    const maxDesks = econ.tierSpecs[econ.buildingTier].maxDesks;
    if (elDesks) {
      const buildCount = econ.unlockedAssemblyDesks !== undefined ? econ.unlockedAssemblyDesks : 1;
      const testCount = econ.unlockedTestingDesks !== undefined ? econ.unlockedTestingDesks : 0;
      elDesks.textContent = `${buildCount}B / ${testCount}T (${econ.unlockedDesks}/${maxDesks})`;
    }

    // Next Assembly Desk Cost
    const elAssemblyCost = document.getElementById('next-assembly-cost');
    if (elAssemblyCost) {
      const nextCost = econ.getNextAssemblyDeskCost();
      elAssemblyCost.textContent = this.formatShortCost(nextCost);
    }

    // Next Testing Desk Cost
    const elTestingCost = document.getElementById('next-testing-cost');
    if (elTestingCost) {
      const nextCost = econ.getNextTestingDeskCost();
      elTestingCost.textContent = this.formatShortCost(nextCost);
    }

    // Building Tier
    const elTier = document.getElementById('hud-tier');
    if (elTier) elTier.textContent = econ.tierSpecs[econ.buildingTier].name;

    // Day Cycle Timer
    const elTimer = document.getElementById('hud-timer');
    if (elTimer) {
      const mins = Math.floor(econ.dayTimer / 60);
      const secs = Math.floor(econ.dayTimer % 60);
      elTimer.textContent = `Day ${econ.currentDay} (${mins}:${secs < 10 ? '0' : ''}${secs})`;
    }

    // Refresh open modals only when cash balance changes
    if (this.lastCash !== econ.cash) {
      this.lastCash = econ.cash;
      const modalHire = document.getElementById('modal-hire');
      if (modalHire && modalHire.classList.contains('open')) {
        this.renderHireModal();
      }
      const modalUpgrade = document.getElementById('modal-upgrade');
      if (modalUpgrade && modalUpgrade.classList.contains('open')) {
        this.renderUpgradeModal();
      }
    }
  }

  renderHireModal() {
    const modalBody = document.getElementById('hire-modal-body');
    if (!modalBody) return;

    const econ = window.economySystem;
    let html = '<div class="helper-grid">';

    const roleHatIcons = {
      buyer: '🟡',
      builder: '🔴',
      installer: '🟣',
      seller: '🔵',
      dispatcher: '🟠',
      supportTech: '🟢'
    };

    for (const role in econ.helperSpecs) {
      const spec = econ.helperSpecs[role];
      const count = econ.helpers[role];
      const hatIcon = roleHatIcons[role] || '🪖';

      html += `
        <div class="helper-card">
          <div class="helper-info">
            <div class="helper-avatar">${hatIcon}🐧</div>
            <div class="helper-details">
              <h4>${spec.name} (Hired: ${count})</h4>
              <p>${spec.role}</p>
              <span class="helper-cost">Hire: $${spec.hireCost} | Wage: $${spec.wage}/day</span>
            </div>
          </div>
          <div class="helper-action">
            <button class="btn-primary" onclick="window.economySystem.hireHelper('${role}')" ${econ.cash < spec.hireCost ? 'disabled' : ''}>Hire</button>
            ${count > 0 ? `<button class="btn-danger" onclick="window.economySystem.fireHelper('${role}')" style="margin-top:4px;">Fire</button>` : ''}
          </div>
        </div>
      `;
    }

    html += '</div>';
    modalBody.innerHTML = html;
  }

  renderUpgradeModal() {
    const modalBody = document.getElementById('upgrade-modal-body');
    if (!modalBody) return;

    const econ = window.economySystem;
    const currentTier = econ.buildingTier;
    let html = '<div class="helper-grid">';

    econ.tierSpecs.forEach((spec, idx) => {
      const isCurrent = idx === currentTier;
      const isUnlocked = idx <= currentTier;
      const canBuy = idx === currentTier + 1 && econ.cash >= spec.upgradeCost;

      html += `
        <div class="helper-card ${isCurrent ? 'active' : ''}">
          <div class="helper-info">
            <div class="helper-avatar">🏭</div>
            <div class="helper-details">
              <h4>${spec.name} ${isCurrent ? '(Current Facility)' : ''}</h4>
              <p>Max Capacity: ${spec.maxDesks} Build Desks | ${spec.maxHelpdesks} Helpdesks</p>
              <span class="helper-cost">${spec.upgradeCost > 0 ? `Upgrade Cost: $${spec.upgradeCost.toLocaleString()}` : 'Starter Facility'}</span>
            </div>
          </div>
          <div class="helper-action">
            ${isCurrent ? '<span style="color:#20e070; font-weight:bold;">Active</span>' : ''}
            ${!isUnlocked && idx === currentTier + 1 ? `<button class="btn-primary" onclick="window.economySystem.upgradeTier()" ${!canBuy ? 'disabled' : ''}>Upgrade</button>` : ''}
          </div>
        </div>
      `;
    });

    html += '</div>';
    modalBody.innerHTML = html;
  }

  renderDisplaySettingsModal() {
    const modalBody = document.getElementById('display-settings-modal-body');
    if (!modalBody) return;

    const dropdownBody = document.querySelector('#labels-dropdown-menu .dropdown-body');
    if (dropdownBody) {
      modalBody.innerHTML = dropdownBody.innerHTML;

      // Re-bind modal checkboxes
      const map = {
        'chk-staff-roles': 'staffRoles',
        'chk-desk-labels': 'deskLabels',
        'chk-idle-labels': 'idleLabels',
        'chk-progress-bars': 'progressBars',
        'chk-money-notifications': 'moneyNotifications',
        'chk-activity-alerts': 'activityAlerts'
      };

      for (const chkId in map) {
        const modalChk = modalBody.querySelector(`#${chkId}`);
        if (modalChk) {
          modalChk.id = `modal-${chkId}`;
          if (window.gameScene && window.gameScene.labelSettings) {
            modalChk.checked = !!window.gameScene.labelSettings[map[chkId]];
          }
          modalChk.addEventListener('change', (e) => {
            if (window.gameScene) {
              window.gameScene.setLabelSetting(map[chkId], e.target.checked);
              this.syncLabelCheckboxes();
            }
          });
        }
      }
    }
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      if (window.economySystem) this.lastCash = window.economySystem.cash;
      modal.classList.add('open');
      if (modalId === 'modal-hire') this.renderHireModal();
      if (modalId === 'modal-upgrade') this.renderUpgradeModal();
      if (modalId === 'modal-display-settings') this.renderDisplaySettingsModal();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  showAlert(message) {
    if (window.gameScene && window.gameScene.labelSettings && !window.gameScene.labelSettings.activityAlerts) {
      return;
    }
    const banner = document.getElementById('alert-banner');
    if (!banner) return;

    banner.textContent = message;
    banner.classList.add('show');

    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      banner.classList.remove('show');
    }, 3500);
  }

  showDaySummary(dayNum, wagesPaid, endingBalance) {
    this.showAlert(`Day ${dayNum} Complete! Paid $${wagesPaid} in Penguin wages. Cash: $${endingBalance.toFixed(2)}`);
  }
}

window.uiSystem = new UISystem();

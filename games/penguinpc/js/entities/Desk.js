// Workstation & 8-Step PC Lifecycle FSM
class Desk {
  constructor(id, gridX, gridY, scene, deskType = null, deskNumber = null) {
    this.id = id;
    this.gridX = gridX;
    this.gridY = gridY;
    this.scene = scene;

    if (deskType) {
      this.deskType = deskType;
      this.deskNumber = deskNumber || 1;
    } else {
      const numericId = typeof id === 'number' ? id : parseInt(id, 10) || 1;
      this.deskType = (numericId % 2 !== 0) ? 'assembly' : 'testing';
      this.deskNumber = (this.deskType === 'assembly') ? Math.ceil(numericId / 2) : Math.floor(numericId / 2);
    }

    // FSM States:
    // Assembly Desk: EMPTY -> PARTS -> ASSEMBLED (Picked up -> EMPTY)
    // Testing Desk:  EMPTY -> ASSEMBLED -> INSTALLING -> INSTALLED -> LISTED -> SOLD -> BOXED (Picked up -> EMPTY)
    this.state = 'EMPTY';
    this.progress = 0; // 0 to 1 for active hold or passive progress

    // Mutex lock for co-op / AI
    this.occupiedBy = null;

    // Visual Sprites (Phaser Container)
    this.createGraphics();
  }

  createGraphics() {
    // Iso coordinates calculation
    const pos = this.scene.gridToIso(this.gridX, this.gridY);
    this.x = pos.x;
    this.y = pos.y;

    this.container = this.scene.add.container(this.x, this.y);
    this.container.setDepth(this.y + 16);

    // Desk Base Sprite from Sprite Sheet Row 1 [0,1]
    this.deskSprite = this.scene.add.sprite(0, 0, 'spritesheet', 8); // Row 1, Col 0 -> Index 8
    this.deskSprite.setOrigin(0.5, 0.75);
    this.container.add(this.deskSprite);

    // Progress Bar Background & Fill
    this.progressBarBg = this.scene.add.rectangle(0, -50, 48, 8, 0x181a2a);
    this.progressBarBg.setStrokeStyle(1, 0x3a3f58);
    this.progressBarBg.setVisible(false);

    this.progressBarFill = this.scene.add.rectangle(-23, -50, 0, 6, 0x20e070);
    this.progressBarFill.setOrigin(0, 0.5);
    this.progressBarFill.setVisible(false);

    // Department Header Badge
    const deptTitle = this.deskType === 'assembly' ? `[BUILD #${this.deskNumber}]` : `[TEST #${this.deskNumber}]`;
    const deptColor = this.deskType === 'assembly' ? '#288cf0' : '#9d4edd';
    this.deptText = this.scene.add.text(0, -78, deptTitle, {
      fontFamily: 'Press Start 2P',
      fontSize: '6px',
      color: deptColor,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Status Icon / Label Text
    this.statusText = this.scene.add.text(0, -65, 'EMPTY', {
      fontFamily: 'Press Start 2P',
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.container.add(this.deptText);
    this.container.add(this.progressBarBg);
    this.container.add(this.progressBarFill);
    this.container.add(this.statusText);

    if (this.scene && this.scene.labelsVisible === false) {
      this.deptText.setVisible(false);
      this.statusText.setVisible(false);
    }
  }

  sanitizeState() {
    // If desk is EMPTY, progress MUST be 0 and progress bar MUST be hidden
    if (this.state === 'EMPTY') {
      this.progress = 0;
      if (this.progressBarBg) this.progressBarBg.setVisible(false);
      if (this.progressBarFill) this.progressBarFill.setVisible(false);
    }

    // Assembly Desks only permit: EMPTY, PARTS, ASSEMBLED
    if (this.deskType === 'assembly') {
      if (!['EMPTY', 'PARTS', 'ASSEMBLED'].includes(this.state)) {
        this.state = 'EMPTY';
        this.progress = 0;
        this.occupiedBy = null;
        if (this.progressBarBg) this.progressBarBg.setVisible(false);
        if (this.progressBarFill) this.progressBarFill.setVisible(false);
      }
    } else {
      // Testing Desks only permit: EMPTY, ASSEMBLED, INSTALLING, INSTALLED, LISTED, SOLD, BOXED
      if (this.state === 'PARTS') {
        this.state = 'ASSEMBLED';
        this.progress = 0;
        this.occupiedBy = null;
        if (this.progressBarBg) this.progressBarBg.setVisible(false);
        if (this.progressBarFill) this.progressBarFill.setVisible(false);
      } else if (!['EMPTY', 'ASSEMBLED', 'INSTALLING', 'INSTALLED', 'LISTED', 'SOLD', 'BOXED'].includes(this.state)) {
        this.state = 'EMPTY';
        this.progress = 0;
        this.occupiedBy = null;
        if (this.progressBarBg) this.progressBarBg.setVisible(false);
        if (this.progressBarFill) this.progressBarFill.setVisible(false);
      }
    }
  }

  updateSprite() {
    this.sanitizeState();

    // Row 1 indices in 512x256 atlas (8 columns per row):
    // [0,1] = 8  (Empty Desk)
    // [1,1] = 9  (Desk with Parts)
    // [2,1] = 10 (Assembled PC)
    // [3,1] = 11 (Installing Linux OS - CRT green glow)
    // [4,1] = 12 (Boxed PC)
    if (this.deskType === 'assembly') {
      switch (this.state) {
        case 'EMPTY':
          this.deskSprite.setFrame(8);
          this.statusText.setText('[Place Parts]');
          this.statusText.setColor('#ffb800');
          break;
        case 'PARTS':
          this.deskSprite.setFrame(9);
          this.statusText.setText('[Assemble 4s]');
          this.statusText.setColor('#288cf0');
          break;
        case 'ASSEMBLED':
          this.deskSprite.setFrame(10);
          this.statusText.setText('[Pick Up Rig]');
          this.statusText.setColor('#20e070');
          break;
      }
    } else {
      // Testing Desk
      switch (this.state) {
        case 'EMPTY':
          this.deskSprite.setFrame(8);
          this.statusText.setText('[Place Rig]');
          this.statusText.setColor('#ffb800');
          break;
        case 'ASSEMBLED':
          this.deskSprite.setFrame(10);
          this.statusText.setText('[Install Linux]');
          this.statusText.setColor('#9d4edd');
          break;
        case 'INSTALLING':
          this.deskSprite.setFrame(11);
          this.statusText.setText('Installing OS...');
          this.statusText.setColor('#20e070');
          break;
        case 'INSTALLED':
          this.deskSprite.setFrame(11);
          this.statusText.setText('[Ready to List]');
          this.statusText.setColor('#ffb800');
          break;
        case 'LISTED':
          this.deskSprite.setFrame(11);
          this.statusText.setText('Finding Buyer...');
          this.statusText.setColor('#9499b8');
          break;
        case 'SOLD':
          this.deskSprite.setFrame(10);
          this.statusText.setText('[Box & Label 3s]');
          this.statusText.setColor('#20e070');
          break;
        case 'BOXED':
          this.deskSprite.setFrame(12);
          this.statusText.setText('[Pick Up Box]');
          this.statusText.setColor('#ffb800');
          break;
      }
    }
  }

  getIdleStateSpec() {
    // Check if desk has a PC sitting idle waiting for player/worker action
    if (this.deskType === 'assembly') {
      if (this.state === 'ASSEMBLED') {
        return { text: '[⏳ WAIT FOR TRANSFER]', color: '#20e070', isBottleneck: true };
      } else if (this.state === 'PARTS' && this.progress === 0 && !this.occupiedBy) {
        return { text: '[⏳ WAIT FOR BUILD]', color: '#288cf0', isBottleneck: false };
      }
    } else {
      // Testing Desk
      if (this.state === 'ASSEMBLED' && !this.occupiedBy) {
        return { text: '[⏳ WAIT FOR OS]', color: '#9d4edd', isBottleneck: true };
      } else if (this.state === 'INSTALLED') {
        return { text: '[⏳ READY TO LIST]', color: '#ffb800', isBottleneck: true };
      } else if (this.state === 'SOLD' && this.progress === 0 && !this.occupiedBy) {
        return { text: '[⚠️ WAIT FOR BOXING]', color: '#ff6d00', isBottleneck: true };
      } else if (this.state === 'BOXED') {
        return { text: '[⏳ WAIT FOR DISPATCH]', color: '#ffea00', isBottleneck: false };
      }
    }
    return null;
  }

  updateLabelVisibility(labelSettings) {
    if (!labelSettings) return;

    const idleSpec = this.getIdleStateSpec();

    if (labelSettings.idleLabels && idleSpec) {
      // Show Idle Bottleneck Highlight Label
      this.statusText.setText(idleSpec.text);
      this.statusText.setColor(idleSpec.color);
      this.statusText.setVisible(true);

      // Pulse alpha if bottleneck delay
      if (idleSpec.isBottleneck) {
        this.statusText.setAlpha(0.65 + Math.sin(Date.now() * 0.008) * 0.35);
      } else {
        this.statusText.setAlpha(1.0);
      }
    } else {
      // Normal desk label behavior
      this.statusText.setAlpha(1.0);
      this.updateSprite();
      this.statusText.setVisible(!!labelSettings.deskLabels);
    }
  }

  showProgress(pct) {
    if (this.state === 'EMPTY') {
      this.progress = 0;
      if (this.progressBarBg) this.progressBarBg.setVisible(false);
      if (this.progressBarFill) this.progressBarFill.setVisible(false);
      return;
    }
    this.progress = Math.min(1, Math.max(0, pct));
    const showBars = !this.scene || !this.scene.labelSettings || this.scene.labelSettings.progressBars !== false;
    if (pct > 0 && pct < 1 && showBars) {
      if (this.progressBarBg) this.progressBarBg.setVisible(true);
      if (this.progressBarFill) this.progressBarFill.setVisible(true);
      if (this.progressBarFill) this.progressBarFill.width = 46 * this.progress;
    } else {
      if (this.progressBarBg) this.progressBarBg.setVisible(false);
      if (this.progressBarFill) this.progressBarFill.setVisible(false);
    }
  }

  // Interacted by player or AI worker
  interact(character, deltaSeconds, isHold) {
    if (this.occupiedBy && this.occupiedBy !== character) {
      if (this.occupiedBy.isAI) {
        const distToLock = Phaser.Math.Distance.Between(this.x, this.y, this.occupiedBy.x, this.occupiedBy.y);
        if (distToLock > 60 || (this.occupiedBy.aiTarget && this.occupiedBy.aiTarget.targetObj !== this)) {
          this.occupiedBy = null;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    if (!character.isAI) {
      this.occupiedBy = null;
    }

    if (this.deskType === 'assembly') {
      // --- ASSEMBLY DESK WORKFLOW ---
      switch (this.state) {
        case 'EMPTY':
          // Purchaser / Player places carried pc_parts onto assembly desk
          if (character.carryingItem === 'pc_parts') {
            character.carryingItem = null;
            this.state = 'PARTS';
            this.updateSprite();
            if (window.soundSystem) window.soundSystem.playBuy();
            return true;
          }
          // Fallback: If carrying nothing, buy components & place directly on desk
          else if (!character.carryingItem) {
            const econ = window.economySystem;
            if (econ) {
              const partsCost = econ.getPartsCost();
              if (econ.cash >= partsCost) {
                econ.cash -= partsCost;
                this.state = 'PARTS';
                this.updateSprite();
                if (window.soundSystem) window.soundSystem.playBuy();
                if (!character.isAI && window.uiSystem) window.uiSystem.showAlert('Purchased & Placed PC Components!');
                return true;
              } else if (!character.isAI && window.uiSystem) {
                window.uiSystem.showAlert('Not enough cash to buy components!');
              }
            }
          }
          break;

        case 'PARTS':
          // Builder / Player builds PC hardware (4s active hold)
          this.occupiedBy = character;
          this.progress += deltaSeconds / 4.0;
          this.showProgress(this.progress);

          if (window.soundSystem && Math.random() < 0.2) window.soundSystem.playAssemble();

          if (this.progress >= 1.0) {
            this.state = 'ASSEMBLED';
            this.progress = 0;
            this.showProgress(0);
            this.occupiedBy = null;
            this.updateSprite();
            return true;
          }
          break;

        case 'ASSEMBLED':
          // Builder / Player picks up assembled PC to transfer to Testing Desk (requires available Test Desk)
          if (!character.carryingItem) {
            const hasAvailableTestDesk = this.scene && this.scene.desks && this.scene.desks.some(d => d.container.visible && d.deskType === 'testing' && d.state === 'EMPTY');
            if (!hasAvailableTestDesk) {
              if (!character.isAI && window.uiSystem) {
                window.uiSystem.showAlert('⚠️ Cannot pick up PC! No available Testing Desk!');
              }
              return false;
            }
            character.carryingItem = 'assembled_pc';
            this.state = 'EMPTY';
            this.updateSprite();
            if (window.soundSystem) window.soundSystem.playBuy();
            return true;
          }
          break;
      }
    } else {
      // --- TESTING DESK WORKFLOW ---
      switch (this.state) {
        case 'EMPTY':
          // Builder / Player places assembled PC onto testing desk
          if (character.carryingItem === 'assembled_pc') {
            character.carryingItem = null;
            this.state = 'ASSEMBLED';
            this.updateSprite();
            if (window.soundSystem) window.soundSystem.playBuy();
            return true;
          }
          // Fallback: If carrying nothing and an Assembly Desk has an ASSEMBLED PC, transfer it!
          else if (!character.carryingItem && this.scene && this.scene.desks) {
            const readyBuildDesk = this.scene.desks.find(d => d.container.visible && d.deskType === 'assembly' && d.state === 'ASSEMBLED');
            if (readyBuildDesk) {
              readyBuildDesk.state = 'EMPTY';
              readyBuildDesk.updateSprite();
              this.state = 'ASSEMBLED';
              this.updateSprite();
              if (window.soundSystem) window.soundSystem.playBuy();
              if (!character.isAI && window.uiSystem) window.uiSystem.showAlert('Transferred Assembled PC to Testing Desk!');
              return true;
            }
          }
          break;

        case 'ASSEMBLED':
          // Tester / Player starts Linux OS Install (1s click/hold -> 5s passive install)
          if (isHold || character.isAI) {
            this.state = 'INSTALLING';
            this.passiveTimer = 5.0; // 5s passive installation
            this.updateSprite();
            if (window.soundSystem) window.soundSystem.playOsInstall();
            return true;
          }
          break;

        case 'INSTALLED':
          // Listing is done at Admin Terminal (or direct click if preferred)
          break;

        case 'SOLD':
          // Dispatcher / Player boxes & labels PC (3s active hold)
          this.occupiedBy = character;
          this.progress += deltaSeconds / 3.0;
          this.showProgress(this.progress);

          if (window.soundSystem && Math.random() < 0.15) window.soundSystem.playBox();

          if (this.progress >= 1.0) {
            this.state = 'BOXED';
            this.progress = 0;
            this.showProgress(0);
            this.occupiedBy = null;
            this.updateSprite();
            return true;
          }
          break;

        case 'BOXED':
          // Dispatcher / Player picks up boxed PC to carry to Dispatch Bay
          if (!character.carryingItem) {
            character.carryingItem = 'boxed_pc';
            this.state = 'EMPTY';
            this.updateSprite();
            if (window.soundSystem) window.soundSystem.playBox();
            return true;
          }
          break;
      }
    }

    return false;
  }

  // Update passive timers (Step 3 install OS & Step 5 buyer match)
  updatePassive(deltaSeconds) {
    if (this.deskType === 'testing') {
      if (this.state === 'INSTALLING') {
        this.passiveTimer -= deltaSeconds;
        this.showProgress(1 - (this.passiveTimer / 5.0));

        if (this.passiveTimer <= 0) {
          this.state = 'INSTALLED';
          this.showProgress(0);
          this.updateSprite();
        }
      } else if (this.state === 'LISTED') {
        this.buyerTimer -= deltaSeconds;
        this.showProgress(1 - (this.buyerTimer / 10.0));

        if (this.buyerTimer <= 0) {
          this.state = 'SOLD';
          this.showProgress(0);
          this.updateSprite();
        }
      }
    }
  }

  releaseLock(character) {
    if (this.occupiedBy === character) {
      this.occupiedBy = null;
      if (this.state === 'PARTS' || this.state === 'SOLD') {
        // Reset progress if abandoned mid-assembly/boxing
        this.progress = 0;
        this.showProgress(0);
      }
    }
  }
}


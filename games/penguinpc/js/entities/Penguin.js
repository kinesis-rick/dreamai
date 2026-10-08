// Penguin Character Entity (Player 1, Player 2, and AI Workers)
class Penguin {
  constructor(id, type, gridX, gridY, scene) {
    this.id = id;
    this.type = type; // 'p1', 'p2', 'buyer', 'builder', 'installer', 'seller', 'dispatcher', 'supportTech'
    this.isAI = type !== 'p1' && type !== 'p2';
    this.gridX = gridX;
    this.gridY = gridY;
    this.scene = scene;

    this.speed = 140; // Pixels per sec
    this.facingDir = 'SW'; // SW, SE, NW, NE
    this.carryingItem = null; // 'boxed_pc' or null

    this.aiTarget = null;
    this.aiState = 'IDLE';

    this.createGraphics();
  }

  createGraphics() {
    const pos = this.scene.gridToIso(this.gridX, this.gridY);
    this.x = pos.x;
    this.y = pos.y;

    this.container = this.scene.add.container(this.x, this.y);

    // 1. Sprite using 512x512 penguin atlas ('penguin_anim')
    this.sprite = this.scene.add.sprite(0, 0, 'penguin_anim', 0);
    this.sprite.setOrigin(0.5, 0.85);
    this.container.add(this.sprite);

    // 2. Add Hard Hat Graphics based on role (rendered ON TOP of sprite)
    this.createHatGraphics();
    if (this.hatGraphics) {
      this.container.add(this.hatGraphics);
    }

    // 3. Player & Worker Nametag / Indicator
    if (this.type === 'p1') {
      this.badgeText = this.scene.add.text(0, -60, 'P1 TUX', {
        fontFamily: 'Press Start 2P',
        fontSize: '7px',
        color: '#ff3b4e',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
    } else if (this.type === 'p2') {
      this.badgeText = this.scene.add.text(0, -60, 'P2 CO-OP', {
        fontFamily: 'Press Start 2P',
        fontSize: '7px',
        color: '#00e5ff',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
    } else {
      const roleNames = {
        buyer: 'PURCHASER',
        builder: 'BUILDER',
        installer: 'TESTER',
        seller: 'SELLER',
        dispatcher: 'DISPATCHER',
        supportTech: 'SUPPORT TECH'
      };
      const name = roleNames[this.type] || this.type.toUpperCase();
      this.badgeText = this.scene.add.text(0, -58, name, {
        fontFamily: 'Outfit',
        fontSize: '9px',
        fontWeight: 'bold',
        color: this.hatColorSpec ? this.hatColorSpec.text : '#ffea00',
        stroke: '#000000',
        strokeThickness: 2
      }).setOrigin(0.5);
    }
    this.container.add(this.badgeText);
    if (this.scene && this.scene.labelsVisible === false) {
      this.badgeText.setVisible(false);
    }

    // 4. Carrying Box Sprite Overlay
    this.boxOverlay = this.scene.add.sprite(0, -18, 'spritesheet', 12); // Boxed PC frame
    this.boxOverlay.setScale(0.7);
    this.boxOverlay.setVisible(false);
    this.container.add(this.boxOverlay);
  }

  createHatGraphics() {
    const hatColors = {
      buyer: { fill: 0xffea00, border: 0x998c00, text: '#ffea00' },       // Bright Yellow (Purchaser)
      builder: { fill: 0xff1744, border: 0x800000, text: '#ff4d4d' },     // Bright Red (Builder)
      installer: { fill: 0xab47bc, border: 0x4a148c, text: '#e1bee7' },   // Electric Purple (Tester)
      seller: { fill: 0x29b6f6, border: 0x01579b, text: '#81d4fa' },      // Bright Blue (Seller)
      dispatcher: { fill: 0xff6d00, border: 0x993d00, text: '#ff9e00' },  // Neon Orange (Dispatcher)
      supportTech: { fill: 0x00e676, border: 0x006020, text: '#69f0ae' }, // Bright Green (Support Tech)
      p1: { fill: 0xff1744, border: 0x800000, text: '#ff3b4e' },          // P1 Tux Red
      p2: { fill: 0x00e5ff, border: 0x006080, text: '#00e5ff' }           // P2 Co-op Cyan
    };

    const colorSpec = hatColors[this.type] || { fill: 0xffea00, border: 0x998c00, text: '#ffea00' };
    this.hatColorSpec = colorSpec;

    // Create Hard Hat Graphics Overlay (positioned atop head at y: -48)
    this.hatGraphics = this.scene.add.graphics();
    this.hatGraphics.setPosition(0, -48);

    // Hard Hat Brim
    this.hatGraphics.fillStyle(colorSpec.fill, 1.0);
    this.hatGraphics.fillEllipse(0, 1, 18, 5);

    // Hard Hat Dome
    this.hatGraphics.fillStyle(colorSpec.fill, 1.0);
    this.hatGraphics.fillEllipse(0, -4, 14, 9);

    // Outline & Detailing
    this.hatGraphics.lineStyle(1.5, colorSpec.border, 1.0);
    this.hatGraphics.strokeEllipse(0, 1, 18, 5);
    this.hatGraphics.strokeEllipse(0, -4, 14, 9);

    // Center Safety Ridge
    this.hatGraphics.fillStyle(colorSpec.border, 1.0);
    this.hatGraphics.fillRect(-1.5, -8, 3, 5);
  }

  update(deltaSeconds) {
    if (!this.isAI) {
      this.handlePlayerInput(deltaSeconds);
    } else {
      this.handleAIBehavior(deltaSeconds);
    }

    // Depth Sorting
    this.container.setDepth(this.y + 24);

    // Carried Item Overlay Frame & Visibility
    // Atlas Frames: 9 = Parts Box, 10 = Assembled PC Tower, 12 = Boxed PC
    if (this.carryingItem === 'pc_parts') {
      this.boxOverlay.setFrame(9);
      this.boxOverlay.setScale(0.6);
      this.boxOverlay.setVisible(true);
    } else if (this.carryingItem === 'assembled_pc') {
      this.boxOverlay.setFrame(10);
      this.boxOverlay.setScale(0.6);
      this.boxOverlay.setVisible(true);
    } else if (this.carryingItem === 'boxed_pc') {
      this.boxOverlay.setFrame(12);
      this.boxOverlay.setScale(0.7);
      this.boxOverlay.setVisible(true);
    } else {
      this.boxOverlay.setVisible(false);
    }
  }

  handlePlayerInput(deltaSeconds) {
    const input = window.inputSystem;
    const ctrl = (this.type === 'p1') ? input.p1 : input.p2;

    if (!ctrl) return;

    let moveX = ctrl.x;
    let moveY = ctrl.y;

    if (moveX !== 0 || moveY !== 0) {
      // Determine Isometric Direction:
      // In Isometric Projection:
      // Right (+X) moves Down-Right (SE)
      // Left (-X) moves Up-Left (NW)
      // Down (+Y) moves Down-Left (SW)
      // Up (-Y) moves Up-Right (NE)
      if (moveX > 0 && moveY >= 0) this.facingDir = 'SE';
      else if (moveX < 0 && moveY <= 0) this.facingDir = 'NW';
      else if (moveY > 0) this.facingDir = 'SW';
      else if (moveY < 0) this.facingDir = 'NE';

      const isoVel = this.scene.screenToIsoVelocity(moveX, moveY);
      this.x += isoVel.x * this.speed * deltaSeconds;
      this.y += isoVel.y * this.speed * deltaSeconds;
      this.container.setPosition(this.x, this.y);

      // Play Walking Animation
      this.playAnim('walk');
    } else {
      this.playAnim('idle');
    }

    // Check interaction with nearby desks, admin terminal, dispatch pad, or helpdesk
    if (ctrl.actionHold || ctrl.actionJustPressed || ctrl.action) {
      this.scene.tryInteract(this, deltaSeconds, ctrl.actionJustPressed);
    } else {
      // Release any locks held on workstations if key released
      this.scene.releaseInteract(this);
    }

    // Check Drop or Pick Up item on floor (Key Q)
    if (ctrl.dropJustPressed) {
      this.scene.handleDropOrPickup(this);
    }
  }

  playAnim(state) {
    let frameOffset = 0;
    // Map facingDir to row offset in 8x8 sprite sheet
    if (this.type === 'p2') {
      if (this.facingDir === 'SW' || this.facingDir === 'SE') frameOffset = 40;
      else frameOffset = 48;
    } else {
      // P1 and AI Workers use Rows 0-3 (Hatless Base Penguin Sprite)
      if (this.facingDir === 'SW') frameOffset = 0;
      else if (this.facingDir === 'SE') frameOffset = 8;
      else if (this.facingDir === 'NW') frameOffset = 16;
      else if (this.facingDir === 'NE') frameOffset = 24;
    }

    if (state === 'walk') {
      const step = Math.floor((Date.now() / 150) % 4);
      this.sprite.setFrame(frameOffset + 2 + step % 4);
    } else {
      const breathe = Math.floor((Date.now() / 400) % 2);
      this.sprite.setFrame(frameOffset + breathe);
    }
  }

  handleAIBehavior(deltaSeconds) {
    // Validate target is still available and relevant
    if (this.aiTarget && !this.scene.isAITargetStillValid(this)) {
      this.aiTarget = null;
    }

    // AI Decision Loop based on Helper Role
    if (!this.aiTarget) {
      this.aiTarget = this.scene.findAITask(this);
    }

    if (this.aiTarget) {
      this.idleTimer = 0;
      this.wanderTarget = null;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.aiTarget.x, this.aiTarget.y);
      if (dist > 25) {
        // Move towards target
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.aiTarget.x, this.aiTarget.y);
        this.x += Math.cos(angle) * (this.speed * 0.9) * deltaSeconds;
        this.y += Math.sin(angle) * (this.speed * 0.9) * deltaSeconds;
        this.container.setPosition(this.x, this.y);

        if (Math.cos(angle) > 0) this.facingDir = 'SE';
        else this.facingDir = 'SW';

        this.playAnim('walk');
      } else {
        // Arrived at target! Perform interaction
        this.playAnim('idle');
        const finished = this.scene.executeAITask(this, this.aiTarget, deltaSeconds);
        if (finished) {
          this.aiTarget = null;
        }
      }
    } else {
      this.handleIdleWander(deltaSeconds);
    }
  }

  handleIdleWander(deltaSeconds) {
    if (!this.idleTimer) this.idleTimer = 0;
    this.idleTimer += deltaSeconds;

    if (!this.homeX || !this.homeY) {
      this.homeX = this.x;
      this.homeY = this.y;
    }

    if (this.wanderTarget) {
      const dist = Phaser.Math.Distance.Between(this.x, this.y, this.wanderTarget.x, this.wanderTarget.y);
      if (dist > 5) {
        const angle = Phaser.Math.Angle.Between(this.x, this.y, this.wanderTarget.x, this.wanderTarget.y);
        this.x += Math.cos(angle) * (this.speed * 0.35) * deltaSeconds;
        this.y += Math.sin(angle) * (this.speed * 0.35) * deltaSeconds;
        this.container.setPosition(this.x, this.y);

        if (Math.cos(angle) > 0) this.facingDir = 'SE';
        else this.facingDir = 'SW';

        this.playAnim('walk');
      } else {
        this.wanderTarget = null;
        this.idleTimer = 0;
        this.playAnim('idle');
      }
    } else if (this.idleTimer > 1.2 + (this.id % 3) * 0.4) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 15 + Math.random() * 30;
      this.wanderTarget = {
        x: this.homeX + Math.cos(angle) * radius,
        y: this.homeY + Math.sin(angle) * radius
      };
    } else {
      this.playAnim('idle');
    }
  }
}

// Floor Item Entity (Dropped pc_parts, assembled_pc, boxed_pc on the floor)
class FloorItem {
  constructor(id, itemType, x, y, scene) {
    this.id = id;
    this.itemType = itemType; // 'pc_parts', 'assembled_pc', 'boxed_pc'
    this.x = x;
    this.y = y;
    this.scene = scene;

    this.createGraphics();
  }

  createGraphics() {
    this.container = this.scene.add.container(this.x, this.y);
    this.container.setDepth(this.y + 16);

    // 1. Floor Shadow Ellipse
    this.shadow = this.scene.add.ellipse(0, 4, 26, 12, 0x000000, 0.35);
    this.container.add(this.shadow);

    // 2. Item Sprite from Sprite Sheet
    // Atlas frames: 9 = PC Parts Box, 10 = Assembled Rig, 12 = Boxed PC
    let frame = 9;
    let scale = 0.6;
    if (this.itemType === 'pc_parts') {
      frame = 9;
      scale = 0.6;
    } else if (this.itemType === 'assembled_pc') {
      frame = 10;
      scale = 0.6;
    } else if (this.itemType === 'boxed_pc') {
      frame = 12;
      scale = 0.7;
    }

    this.sprite = this.scene.add.sprite(0, -6, 'spritesheet', frame);
    this.sprite.setOrigin(0.5, 0.75);
    this.sprite.setScale(scale);
    this.container.add(this.sprite);

    // Subtle gentle floating bob animation
    this.scene.tweens.add({
      targets: this.sprite,
      y: -10,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // 3. Name Label (respects deskLabels setting)
    const displayNames = {
      pc_parts: 'PC PARTS',
      assembled_pc: 'ASSEMBLED PC',
      boxed_pc: 'BOXED PC'
    };
    const colors = {
      pc_parts: '#ffb800',
      assembled_pc: '#288cf0',
      boxed_pc: '#20e070'
    };

    const labelName = displayNames[this.itemType] || 'ITEM';
    const labelColor = colors[this.itemType] || '#ffffff';

    this.nameText = this.scene.add.text(0, -36, labelName, {
      fontFamily: 'Press Start 2P',
      fontSize: '6px',
      color: labelColor,
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.container.add(this.nameText);

    // 4. Interactive Pick Up Prompt Tag ([Q] Pick Up)
    this.promptText = this.scene.add.text(0, -48, '[Q] Pick Up', {
      fontFamily: 'Press Start 2P',
      fontSize: '7px',
      color: '#ffea00',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.promptText.setVisible(false);
    this.container.add(this.promptText);

    if (this.scene && this.scene.labelSettings && this.scene.labelSettings.deskLabels === false) {
      this.nameText.setVisible(false);
    }
  }

  update(deltaSeconds) {
    if (!this.container) return;

    // Check proximity to active player characters (P1 or P2)
    const p1 = this.scene.p1;
    const p2 = this.scene.p2;
    let nearPlayer = false;

    if (p1 && !p1.carryingItem) {
      const d1 = Phaser.Math.Distance.Between(this.x, this.y, p1.x, p1.y);
      if (d1 < 50) nearPlayer = true;
    }
    if (p2 && !p2.carryingItem) {
      const d2 = Phaser.Math.Distance.Between(this.x, this.y, p2.x, p2.y);
      if (d2 < 50) nearPlayer = true;
    }

    if (nearPlayer) {
      this.promptText.setVisible(true);
      this.promptText.y = -48 + Math.sin(Date.now() * 0.008) * 2;
    } else {
      this.promptText.setVisible(false);
    }

    // Update name label visibility according to global scene settings
    const showLabels = !this.scene.labelSettings || this.scene.labelSettings.deskLabels !== false;
    if (this.nameText) {
      this.nameText.setVisible(showLabels && !nearPlayer);
    }
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}

// Courier Delivery Van Logistics System
class DeliveryVan {
  constructor(scene) {
    this.scene = scene;
    this.timer = 15.0; // Van arrives every 15 seconds
    this.state = 'IDLE'; // IDLE, ARRIVING, LOADING, LEAVING

    this.createGraphics();
  }

  createGraphics() {
    // Van is rendered using sprite sheet row 2 [3,2] and [4,2] = frames 19 and 20
    this.container = this.scene.add.container(-200, 300);
    this.container.setDepth(400);

    this.vanSprite = this.scene.add.sprite(0, 0, 'spritesheet', 19); // Delivery Van frame
    this.vanSprite.setScale(1.2);
    this.container.add(this.vanSprite);

    this.vanSprite.setOrigin(0.5, 0.75);
    this.container.setVisible(false);
  }

  update(deltaSeconds) {
    const dispatchBay = this.scene.dispatchPadPos;
    if (!dispatchBay) return;

    this.timer -= deltaSeconds;

    if (this.state === 'IDLE') {
      if (this.timer <= 0 && this.scene.boxedPCItemsCount > 0) {
        // Trigger Arrival!
        this.state = 'ARRIVING';
        this.container.setVisible(true);
        this.container.setPosition(dispatchBay.x - 250, dispatchBay.y + 100);
        if (window.soundSystem) window.soundSystem.playVanArrive();
      }
    } else if (this.state === 'ARRIVING') {
      const targetX = dispatchBay.x - 40;
      const targetY = dispatchBay.y + 20;

      const dist = Phaser.Math.Distance.Between(this.container.x, this.container.y, targetX, targetY);
      if (dist > 10) {
        const angle = Phaser.Math.Angle.Between(this.container.x, this.container.y, targetX, targetY);
        this.container.x += Math.cos(angle) * 160 * deltaSeconds;
        this.container.y += Math.sin(angle) * 160 * deltaSeconds;
      } else {
        // Arrived at Dispatch Hazard Bay! Load boxes!
        this.state = 'LOADING';
        this.loadTimer = 2.0;
      }
    } else if (this.state === 'LOADING') {
      this.loadTimer -= deltaSeconds;
      if (this.loadTimer <= 0) {
        // Collect all boxed PCs on dispatch pad!
        const count = this.scene.collectBoxedPCs();
        if (count > 0) {
          const econ = window.economySystem;
          let totalCashEarned = 0;
          for (let i = 0; i < count; i++) {
            totalCashEarned += econ.getSalePrice();
          }
          econ.cash += totalCashEarned;

          if (this.scene && this.scene.spawnMoneyPopup && this.scene.dispatchPadPos) {
            this.scene.spawnMoneyPopup(this.scene.dispatchPadPos.x, this.scene.dispatchPadPos.y, '+$' + totalCashEarned.toFixed(0), true);
          }

          if (window.soundSystem) window.soundSystem.playCashPayout();
          if (window.uiSystem) {
            window.uiSystem.showAlert(`Courier Collected ${count} PCs! Earned +$${totalCashEarned.toFixed(2)}`);
          }
        }

        this.state = 'LEAVING';
      }
    } else if (this.state === 'LEAVING') {
      this.container.x -= 200 * deltaSeconds;
      this.container.y += 100 * deltaSeconds;

      if (this.container.x < -300) {
        this.state = 'IDLE';
        this.container.setVisible(false);
        this.timer = 15.0; // Reset 15s cycle
      }
    }
  }
}

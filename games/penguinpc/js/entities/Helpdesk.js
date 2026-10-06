// Helpdesk Support Station & Crisis Mechanics
class Helpdesk {
  constructor(id, gridX, gridY, scene) {
    this.id = id;
    this.gridX = gridX;
    this.gridY = gridY;
    this.scene = scene;

    this.activeAlert = false;
    this.ringCountdown = 10; // 10s to answer call
    this.resolutionProgress = 0; // 20s active hold to resolve
    this.occupiedBy = null;
    this.ringSoundTimer = 0;

    this.nextTicketCooldown = 75 + Math.random() * 15; // 75-90s spawn interval

    this.createGraphics();
  }

  createGraphics() {
    const pos = this.scene.gridToIso(this.gridX, this.gridY);
    this.x = pos.x;
    this.y = pos.y;

    this.container = this.scene.add.container(this.x, this.y);
    this.container.setDepth(this.y + 16);

    // Sprite from row 1, col 6 = frame 14 (Helpdesk Idle), col 7 = frame 15 (Helpdesk Alert)
    this.sprite = this.scene.add.sprite(0, 0, 'spritesheet', 14);
    this.sprite.setOrigin(0.5, 0.75);
    this.container.add(this.sprite);

    // Siren Alert Overlay Glow
    this.sirenGlow = this.scene.add.circle(0, -35, 12, 0xff3b4e, 0.6);
    this.sirenGlow.setVisible(false);
    this.container.add(this.sirenGlow);

    // Progress / Countdown Bar
    this.barBg = this.scene.add.rectangle(0, -55, 48, 8, 0x181a2a);
    this.barBg.setStrokeStyle(1, 0x3a3f58);
    this.barBg.setVisible(false);

    this.barFill = this.scene.add.rectangle(-23, -55, 0, 6, 0x20e070);
    this.barFill.setOrigin(0, 0.5);
    this.barFill.setVisible(false);

    // Status Text
    this.statusText = this.scene.add.text(0, -70, 'SUPPORT', {
      fontFamily: 'Press Start 2P',
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    this.container.add(this.barBg);
    this.container.add(this.barFill);
    this.container.add(this.statusText);

    if (this.scene && this.scene.labelsVisible === false) {
      this.statusText.setVisible(false);
    }
  }

  triggerCall() {
    if (this.activeAlert) return;

    this.activeAlert = true;
    this.ringCountdown = 10.0;
    this.resolutionProgress = 0;
    this.beingAnswered = false;
    this.ringSoundTimer = 0; // Trigger immediately on first frame

    this.sprite.setFrame(15); // Siren alert frame
    this.sirenGlow.setVisible(true);
    this.barBg.setVisible(true);
    this.barFill.setVisible(true);
    this.barFill.width = 46;
    this.barFill.setFillStyle(0xff3b4e); // Red countdown bar

    if (window.soundSystem) window.soundSystem.playPhoneRing();
    if (window.uiSystem) window.uiSystem.showAlert('INCOMING SUPPORT CALL! Answer before countdown expires!');
  }

  update(deltaSeconds) {
    if (!this.activeAlert) {
      // Support calls are gated until total unlocked desks reach at least 5
      const deskCount = window.economySystem ? window.economySystem.unlockedDesks : 0;
      if (deskCount < 5) return;

      const freqMultiplier = Math.max(0.3, 1 - (deskCount - 10) * 0.05);
      this.nextTicketCooldown -= deltaSeconds;

      if (this.nextTicketCooldown <= 0) {
        this.triggerCall();
        this.nextTicketCooldown = (75 + Math.random() * 15) * freqMultiplier;
      }
      return;
    }

    // Flashing siren animation
    this.sirenGlow.setAlpha(0.3 + Math.sin(Date.now() * 0.01) * 0.3);

    if (!this.beingAnswered) {
      // Ringing countdown (10s)
      this.ringCountdown -= deltaSeconds;
      this.barFill.width = Math.max(0, 46 * (this.ringCountdown / 10.0));

      // Repeat phone ring sound every 1.5 seconds while ringing
      this.ringSoundTimer -= deltaSeconds;
      if (this.ringSoundTimer <= 0) {
        this.ringSoundTimer = 1.5;
        if (window.soundSystem) window.soundSystem.playPhoneRing();
      }

      if (this.ringCountdown <= 0) {
        // MISSED CALL PENALTY! (1 Star)
        this.activeAlert = false;
        this.sprite.setFrame(14);
        this.sirenGlow.setVisible(false);
        this.barBg.setVisible(false);
        this.barFill.setVisible(false);
        this.statusText.setText('SUPPORT');

        const econ = window.economySystem;
        econ.addReviewRating(1.0);
        econ.missedCallPenalties += 3; // -10% on next 3 PCs

        if (window.soundSystem) window.soundSystem.playPenalty();
        if (window.uiSystem) window.uiSystem.showAlert('MISSED SUPPORT CALL! 1 Star rating penalty applied (-10% on next 3 sales)!');
      }
    }
  }

  interact(character, deltaSeconds) {
    if (!this.activeAlert) return false;
    if (this.occupiedBy && this.occupiedBy !== character) return false;

    if (!this.beingAnswered) {
      this.beingAnswered = true;
      if (window.soundSystem) window.soundSystem.playPhoneAnswer();
    }

    this.occupiedBy = character;
    this.barFill.setFillStyle(0x20e070); // Green resolution bar

    // Resolution requires 20 seconds of continuous progress
    this.resolutionProgress += deltaSeconds / 20.0;
    this.barFill.width = Math.min(46, 46 * this.resolutionProgress);

    if (this.resolutionProgress >= 1.0) {
      // RESOLVED SUCCESSFULLY! Calculate Rating based on answer speed (ringCountdown remaining)
      const elapsedAnswerTime = 10.0 - this.ringCountdown;
      let stars = 5;
      let bonus = 200;

      if (elapsedAnswerTime <= 6.0) {
        stars = 5; bonus = 200;
      } else if (elapsedAnswerTime <= 7.0) {
        stars = 4; bonus = 100;
      } else if (elapsedAnswerTime <= 8.0) {
        stars = 3; bonus = 40;
      } else if (elapsedAnswerTime <= 9.0) {
        stars = 2; bonus = 0;
      } else {
        stars = 1; bonus = 0;
      }

      const econ = window.economySystem;
      econ.addReviewRating(stars);
      econ.cash += bonus;

      if (bonus > 0 && this.scene && this.scene.spawnMoneyPopup) {
        this.scene.spawnMoneyPopup(this.x, this.y, '+$' + bonus, true);
      }

      this.activeAlert = false;
      this.occupiedBy = null;
      this.beingAnswered = false;
      this.sprite.setFrame(14);
      this.sirenGlow.setVisible(false);
      this.barBg.setVisible(false);
      this.barFill.setVisible(false);

      if (window.soundSystem) window.soundSystem.playStarBonus();
      if (window.uiSystem) {
        window.uiSystem.showAlert(`Resolved Support Ticket! ${stars} Stars (+ $${bonus} Bonus)`);
      }
      return true;
    }

    return false;
  }

  releaseLock(character) {
    if (this.occupiedBy === character) {
      this.occupiedBy = null;
      this.beingAnswered = false;
    }
  }
}

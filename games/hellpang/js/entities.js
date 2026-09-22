/* Hellpang - Core Game Entities (Player, Grapple, Boba Pearls, Splatters, Pickups) */

// Sprite Preloader
const SPRITES = {
  p1: new Image(),
  p2: new Image(),
  boba: new Image(),
  goofy: new Image(),
  angry: new Image(),
  smiley: new Image(),
  bgMatcha: new Image(),
  bgStrawberry: new Image(),
  bgTaro: new Image()
};
SPRITES.p1.src = 'p1.png';
SPRITES.p2.src = 'p2.png';
SPRITES.boba.src = 'boba.png';
SPRITES.goofy.src = 'boba_goofy.png';
SPRITES.angry.src = 'boba_angry.png';
SPRITES.smiley.src = 'boba_smiley.png';
SPRITES.bgMatcha.src = 'bg_kawaii_matcha.jpg';
SPRITES.bgStrawberry.src = 'bg_kawaii_strawberry.jpg';
SPRITES.bgTaro.src = 'bg_kawaii_taro.jpg';

class Player {
  constructor(id, x, color, name) {
    this.id = id;
    this.x = x;
    this.y = CONFIG.FLOOR_Y - CONFIG.PLAYER_RADIUS;
    this.radius = CONFIG.PLAYER_RADIUS;
    this.color = color;
    this.name = name;

    this.vx = 0;
    this.vy = 0;
    this.facing = id === 1 ? 1 : -1;
    this.maxHealth = 100;
    this.health = 100;
    this.maxShield = 0;
    this.shield = 0;
    this.isGhost = false;
    this.reviveProgress = 0;

    this.iFrames = 0;
    this.tackleCooldown = 0;

    this.squishX = 1;
    this.squishY = 1;
    this.animFrame = 0; // Animation frame index (0-3)
    this.animTimer = 0;
    this.celebrating = false;
  }

  update(moveDir, gameState) {
    if (this.isGhost) {
      this.squishX = 1 + Math.sin(Date.now() * 0.005) * 0.1;
      this.squishY = 1 - Math.sin(Date.now() * 0.005) * 0.1;
      return;
    }

    if (this.celebrating) {
      this.animTimer++;
      if (this.animTimer % 4 === 0) {
        this.animFrame = (this.animFrame + 1) % 4;
      }
      if (gameState && gameState.particles && Math.random() < 0.4) {
        const colors = ['#ffd700', '#18ffff', '#ff4081', '#69f0ae'];
        const pColor = colors[Math.floor(Math.random() * colors.length)];
        const spark = new SplatterParticle(
          this.x + (Math.random() - 0.5) * 40,
          this.y - Math.random() * 50,
          pColor
        );
        spark.vy = -Math.random() * 3 - 1;
        spark.size = Math.random() * 3 + 2;
        gameState.particles.push(spark);
      }
      return;
    }

    if (this.iFrames > 0) this.iFrames--;
    if (this.tackleCooldown > 0) this.tackleCooldown--;

    const currentSpeed = gameState.playerStats.moveSpeed;
    this.vx = moveDir * currentSpeed;
    this.x += this.vx;

    if (this.x < CONFIG.WALL_LEFT + this.radius) this.x = CONFIG.WALL_LEFT + this.radius;
    if (this.x > CONFIG.WALL_RIGHT - this.radius) this.x = CONFIG.WALL_RIGHT - this.radius;

    if (moveDir !== 0) {
      this.facing = moveDir;
      this.animTimer++;
      if (this.animTimer % 6 === 0) {
        this.animFrame = (this.animFrame + 1) % 4; // Cycle 4-frame running animation!
      }
    } else {
      this.animFrame = 0; // Idle frame when standing still
    }
  }

  takeDamage(amount, gameState) {
    if (gameState && typeof gameState.damagePlayer === 'function') {
      gameState.damagePlayer(this, amount);
    }
  }

  draw(ctx) {
    let celebrateY = 0;
    if (this.celebrating) {
      celebrateY = -Math.abs(Math.sin(Date.now() * 0.014)) * 24;
    }

    ctx.save();
    ctx.translate(this.x, this.y + celebrateY);

    if (this.celebrating) {
      ctx.save();
      ctx.font = '12px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.fillText('⭐ WIN! ⭐', 0, -55);
      ctx.restore();
    }

    if (this.iFrames > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    if (this.isGhost) {
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#b388ff';
      ctx.beginPath();
      ctx.arc(0, -10, this.radius, Math.PI, 0, false);
      ctx.lineTo(this.radius, 10);
      ctx.lineTo(-this.radius, 10);
      ctx.fill();

      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, -this.radius - 12, 14, 5, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
      return;
    }

    ctx.scale(this.facing * this.squishX, this.squishY);

    if (this.shield > 0) {
      ctx.save();
      const alpha = 0.2 + (Math.sin(Date.now() * 0.006) + 1) * 0.1;
      ctx.fillStyle = `rgba(24, 255, 255, ${alpha})`;
      ctx.strokeStyle = '#18ffff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#18ffff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, -10, this.radius + 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Render Animated Sprite Sheet Slicing (Un-squished Height, Feet Anchored Flush to Floor Line)
    const spriteImg = this.id === 1 ? SPRITES.p1 : SPRITES.p2;
    if (spriteImg.complete && spriteImg.naturalWidth > 0) {
      const frameW = spriteImg.naturalWidth / 4;
      const frameH = spriteImg.naturalHeight;
      const displayW = 44;
      const displayH = 68; // Fully stretched un-squished height!

      ctx.drawImage(
        spriteImg,
        this.animFrame * frameW, 0, frameW, frameH,
        -displayW / 2, -displayH + 24, displayW, displayH // Feet land flush on floor line!
      );
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// --- 2. Grapple Cable Weapon --- //
class Grapple {
  constructor(playerId, startX, startY, speed, isElectric = false, angleDeg = 0) {
    this.playerId = playerId;
    this.startX = startX;
    this.startY = startY;
    this.tipX = startX;
    this.tipY = startY;
    this.speed = speed;
    this.isElectric = isElectric;
    this.angleDeg = angleDeg; // -45, 0, +45
    this.state = 'ASCENDING'; // ASCENDING, ANCHORED, RETRACTING, DONE

    const rad = (angleDeg * Math.PI) / 180;
    this.vx = speed * Math.sin(rad);
    this.vy = -speed * Math.cos(rad);
  }

  cancel() {
    this.state = 'RETRACTING';
  }

  update(gameState) {
    if (this.state === 'ASCENDING') {
      this.tipX += this.vx;
      this.tipY += this.vy;

      // Wall collision check
      if (this.tipX <= CONFIG.WALL_LEFT) {
        this.tipX = CONFIG.WALL_LEFT;
        this.state = 'ANCHORED';
        return;
      }
      if (this.tipX >= CONFIG.WALL_RIGHT) {
        this.tipX = CONFIG.WALL_RIGHT;
        this.state = 'ANCHORED';
        return;
      }

      // Platform Bottom Anchoring Collision
      if (gameState && gameState.platforms) {
        for (let plat of gameState.platforms) {
          if (this.tipX >= plat.x && this.tipX <= plat.x + plat.width) {
            if (this.tipY <= plat.y + plat.height && this.tipY >= plat.y) {
              this.tipY = plat.y + plat.height;
              this.state = 'ANCHORED';
              return;
            }
          }
        }
      }

      // Ceiling Anchoring
      if (this.tipY <= CONFIG.CEILING_Y) {
        this.tipY = CONFIG.CEILING_Y;
        this.state = 'ANCHORED';
      }
    } else if (this.state === 'ANCHORED') {
      if (this.isElectric && gameState && gameState.playerStats) {
        if (gameState.playerStats.electricBattery > 0) {
          gameState.playerStats.electricBattery--;
          if (gameState.playerStats.electricBattery <= 0) {
            this.isElectric = false;
            if (typeof gameState.expireElectricHarpoonCard === 'function') {
              gameState.expireElectricHarpoonCard();
            }
          }
        } else {
          this.isElectric = false;
        }
      }
    } else if (this.state === 'RETRACTING') {
      this.tipX -= this.vx * 1.5;
      this.tipY -= this.vy * 1.5;

      const dist = Math.hypot(this.tipX - this.startX, this.tipY - this.startY);
      if (dist < 15 || this.tipY >= CONFIG.FLOOR_Y) {
        this.state = 'DONE';
      }
    }
  }

  draw(ctx, gameState) {
    ctx.save();
    ctx.strokeStyle = this.playerId === 1 ? '#ff4081' : '#18ffff';
    ctx.lineWidth = this.state === 'ANCHORED' ? 4 : 3;

    if (this.state === 'ANCHORED' && this.isElectric) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 14;
    }

    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.tipX, this.tipY);
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(this.tipX, this.tipY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Render Electric Battery Energy Gauge near hook
    if (this.state === 'ANCHORED' && this.isElectric && gameState && gameState.playerStats) {
      ctx.beginPath();
      ctx.arc(this.startX, this.startY, 5, 0, Math.PI * 2);
      ctx.fill();

      const meterW = 32;
      const meterH = 5;
      const progress = Math.max(0, gameState.playerStats.electricBattery / gameState.playerStats.maxElectricBattery);

      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(this.tipX - meterW / 2, this.tipY - 12, meterW, meterH);

      ctx.fillStyle = progress > 0.3 ? '#00e676' : '#ff1744';
      ctx.fillRect(this.tipX - meterW / 2, this.tipY - 12, meterW * progress, meterH);
    }

    ctx.restore();
  }
}

// --- 3. Sentient Boba Pearl Base Class --- //
class BobaPearl {
  constructor(x, y, tier, vx = null, vy = null, type = 'STANDARD', colorScheme = null) {
    this.x = x;
    this.y = y;
    this.tier = tier;
    this.type = type;

    const stats = CONFIG.BOBA_TIERS[tier] || CONFIG.BOBA_TIERS[4];
    this.radius = stats.radius;
    this.bounceVelocity = stats.bounceVelocity;
    this.horizontalSpeed = stats.horizontalSpeed;

    const defaultSchemes = [
      { name: 'Taro Purple', primary: '#b388ff', secondary: '#d1c4e9', splash: '#7c4dff' },
      { name: 'Matcha Green', primary: '#69f0ae', secondary: '#c8e6c9', splash: '#00e676' },
      { name: 'Strawberry Neon', primary: '#ff4081', secondary: '#ff80ab', splash: '#f50057' },
      { name: 'Mango Sunshine', primary: '#ffd700', secondary: '#fff9c4', splash: '#ffab00' }
    ];
    const schemes = CONFIG.COLOR_SCHEMES || defaultSchemes;
    this.colorScheme = colorScheme || schemes[Math.floor(Math.random() * schemes.length)];
    this.color = this.colorScheme.primary;
    this.points = stats.points;
    this.xp = stats.xp;
    this.maxHp = type === 'JELLY' ? 3 : (type === 'BOSS' ? 30 : 1);
    this.hp = this.maxHp;

    if (this.type === 'BOSS') {
      this.radius = 85;
      this.bounceVelocity = -12.5;
      this.horizontalSpeed = 1.4;
      this.points = 2500;
      this.xp = 15;
      this.color = '#ff0055';
    } else if (this.type === 'ACID_BOSS') {
      this.radius = 48;
      this.maxHp = 5;
      this.hp = 5;
      this.bounceVelocity = -11.5;
      this.horizontalSpeed = 0.9;
      this.points = 1500;
      this.xp = 8;
      this.color = '#76ff03';
    }

    // Assign Face Variety (Goofy, Angry, Smiley, or Standard Cute)
    const faces = ['standard', 'goofy', 'angry', 'smiley'];
    this.faceType = type === 'BOSS' ? 'angry' : faces[Math.floor(Math.random() * faces.length)];

    this.vx = vx !== null ? vx : (Math.random() > 0.5 ? this.horizontalSpeed : -this.horizontalSpeed);
    this.vy = vy !== null ? vy : -2;

    if (this.type === 'WITCH') {
      this.vx = (Math.random() > 0.5 ? 0.45 : -0.45); // Very very slow movement so players can leave her alone!
      this.isFlyingOff = false;
      this.isSwooping = false;
      this.swoopPhase = 'IDLE';
    }

    this.squishX = 1;
    this.squishY = 1;

    // Ball Rolling Rotation Physics
    this.rotation = 0;
    this.rotationSpeed = (this.vx / this.radius) * 0.8; // Rotates proportionally to horizontal velocity & size!

    this.flashFrames = 0; // White flash on hit!
    this.isWitchEnraged = false;
    this.witchTimer = 0;
    this.bossTimer = 0;
  }

  startSwoopAttack(gameState) {
    if (this.isSwooping || this.isFlyingOff) return;
    this.isSwooping = true;
    this.isWitchEnraged = true;
    this.swoopPhase = 'DOWN';
    this.color = '#d50000';
    this.faceType = 'angry';
    audioManager.stopWitchCry();
    audioManager.playWitchScreech();

    let target = null;
    if (gameState && gameState.players) {
      const alive = gameState.players.filter(p => !p.isGhost);
      if (alive.length > 0) {
        target = alive[0];
        let minDist = Math.hypot(alive[0].x - this.x, alive[0].y - this.y);
        alive.forEach(p => {
          const d = Math.hypot(p.x - this.x, p.y - this.y);
          if (d < minDist) {
            minDist = d;
            target = p;
          }
        });
      }
    }

    this.swoopTargetX = target ? target.x : this.x;
    this.swoopTargetY = CONFIG.FLOOR_Y - 30;
    this.targetPlayerRef = target;
  }

  update(gameState) {
    if (gameState.sugarRushActive) return;

    if (this.type === 'WITCH' && this.isFlyingOff) {
      this.y -= 4.5; // Laugh and float off top of screen!
      this.vx *= 0.95;
      this.rotation += 0.05;
      if (this.y < -60) {
        this.isPopping = true;
      }
      return;
    }

    // --- Witch Revenge Swoop Attack Physics ---
    if (this.type === 'WITCH' && this.isSwooping) {
      if (this.flashFrames > 0) this.flashFrames--;
      this.rotation += 0.25;

      if (this.swoopPhase === 'DOWN') {
        const dx = this.swoopTargetX - this.x;
        this.vx = Math.max(-12, Math.min(12, dx * 0.18));
        this.vy = 18; // High speed dive swoop!
        this.x += this.vx;
        this.y += this.vy;

        // Emit fiery red particle trail
        if (gameState && gameState.particles && Math.random() < 0.6) {
          const p = new SplatterParticle(this.x, this.y, '#ff1744');
          p.vy = -Math.random() * 3;
          p.vx = (Math.random() - 0.5) * 4;
          gameState.particles.push(p);
        }

        // Check impact at target / floor
        if (this.y >= CONFIG.FLOOR_Y - this.radius - 15 || Math.hypot(this.x - this.swoopTargetX, this.y - this.swoopTargetY) < 45) {
          // Guaranteed Hit & Damage Player!
          if (gameState && typeof gameState.damagePlayer === 'function') {
            gameState.damagePlayer(this.targetPlayerRef, 25);
          }
          if (gameState) gameState.screenShake = 30;

          for (let i = 0; i < 25; i++) {
            if (gameState && gameState.particles) {
              const p = new SplatterParticle(this.x, this.y, '#ff1744');
              p.vy = -Math.random() * 6;
              p.vx = (Math.random() - 0.5) * 8;
              gameState.particles.push(p);
            }
          }

          this.swoopPhase = 'REBOUND';
        }
        return;
      }

      if (this.swoopPhase === 'REBOUND') {
        this.vy = -16; // Bounce back up!
        this.vx *= 0.90;
        this.y += this.vy;
        this.x += this.vx;

        if (this.y <= CONFIG.CEILING_Y + 120) {
          if (gameState && typeof gameState.popBobaByRef === 'function') {
            gameState.popBobaByRef(this);
          }
        }
        return;
      }
    }

    // --- Boss 10-Second Radial Minion Spawn Attack ---
    if (this.type === 'BOSS') {
      this.bossTimer = (this.bossTimer || 0) + 1;

      // Fires out 10 tiny bobas every 10 seconds (600 frames at 60 FPS)
      if (this.bossTimer % 600 === 0) {
        audioManager.playHealthWarning();
        if (gameState) gameState.screenShake = 20;

        if (gameState && gameState.bobas) {
          for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const speed = 5.5;
            const minion = new BobaPearl(
              this.x + Math.cos(angle) * (this.radius + 15),
              this.y + Math.sin(angle) * (this.radius + 15),
              1, // Tier 1 Mini
              Math.cos(angle) * speed,
              Math.sin(angle) * speed - 2,
              'STANDARD'
            );
            minion.color = '#ff1744';
            minion.faceType = 'angry';
            gameState.bobas.push(minion);
          }
        }
      }
    }

    if (this.flashFrames > 0) this.flashFrames--;

    // Update rolling ball rotation angle!
    this.rotation += this.rotationSpeed;

    // Apply wave-scaling gravity progression!
    const currentGravity = CONFIG.GET_GRAVITY(gameState.wave || 1);
    this.vy += currentGravity;
    this.x += this.vx;
    this.y += this.vy;

    // Floor Collision & Parabolic Bounce
    if (this.y >= CONFIG.FLOOR_Y - this.radius) {
      this.y = CONFIG.FLOOR_Y - this.radius;
      this.vy = this.bounceVelocity;
      this.squishX = 1.3;
      this.squishY = 0.7;
    }

    // Elevated Platforms Collision Physics (Top bounce & Bottom bounce!)
    if (gameState && gameState.platforms) {
      gameState.platforms.forEach(plat => {
        if (this.x >= plat.x - this.radius && this.x <= plat.x + plat.width + this.radius) {
          // Bouncing on TOP of platform
          if (this.vy > 0 && this.y + this.radius >= plat.y && this.y - this.radius <= plat.y + 10) {
            this.y = plat.y - this.radius;
            this.vy = this.bounceVelocity * 0.85; // Platform bounce
            this.squishX = 1.3;
            this.squishY = 0.7;
          }
          // Bouncing underneath BOTTOM of platform
          else if (this.vy < 0 && this.y - this.radius <= plat.y + plat.height && this.y + this.radius >= plat.y) {
            this.y = plat.y + plat.height + this.radius;
            this.vy = Math.abs(this.vy);
          }
        }
      });
    }

    if (this.y <= CONFIG.CEILING_Y + this.radius) {
      this.y = CONFIG.CEILING_Y + this.radius;
      this.vy = Math.abs(this.vy);
    }

    if (this.x <= CONFIG.WALL_LEFT + this.radius) {
      this.x = CONFIG.WALL_LEFT + this.radius;
      this.vx = Math.abs(this.vx);
      this.rotationSpeed = Math.abs(this.rotationSpeed);
    } else if (this.x >= CONFIG.WALL_RIGHT - this.radius) {
      this.x = CONFIG.WALL_RIGHT - this.radius;
      this.vx = -Math.abs(this.vx);
      this.rotationSpeed = -Math.abs(this.rotationSpeed);
    }

    this.squishX += (1 - this.squishX) * 0.12;
    this.squishY += (1 - this.squishY) * 0.12;

    if (this.type === 'WITCH') {
      this.witchTimer = (this.witchTimer || 0) + 1;

      if (this.isWitchEnraged) {
        const target = (gameState && gameState.players) ? gameState.players[0] : null;
        if (target) {
          this.vx += (target.x - this.x) > 0 ? 0.25 : -0.25;
          this.vx = Math.max(-8, Math.min(8, this.vx));
        }

        // Enraged screech sound played ONCE every 3 seconds (180 frames), not constant loop!
        if (this.witchTimer % 180 === 0) {
          audioManager.playWitchScreech();
        }
      } else {
        // Emit tiny blue water teardrop particles dripping from her eyes!
        if (gameState && gameState.particles && Math.random() < 0.35) {
          const eyeOffsetX = Math.random() < 0.5 ? -6 : 6;
          const tear = new SplatterParticle(this.x + eyeOffsetX, this.y - 2, '#40c4ff');
          tear.vx = (Math.random() - 0.5) * 0.8;
          tear.vy = Math.random() * 2 + 1.2; // Drips downward
          tear.size = Math.random() * 2 + 1.5;
          gameState.particles.push(tear);
        }

        // Weeping cry sound ONCE every 3 seconds (180 frames), not constant loop
        if (this.witchTimer % 180 === 0) {
          audioManager.playWitchCry();
        }
      }
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.squishX, this.squishY);
    ctx.rotate(this.rotation); // Apply ball rolling rotation!

    if (this.type === 'EXPLOSIVE') {
      ctx.shadowColor = '#ff1744';
      ctx.shadowBlur = 15;
    } else if (this.type === 'WITCH' && this.isWitchEnraged) {
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 25;
    } else if (this.type === 'BOSS') {
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 35;
    } else if (this.type === 'ACID_BOSS') {
      ctx.shadowColor = '#76ff03';
      ctx.shadowBlur = 25;
    }

    // Render Boss Spiked Golden Crown
    if (this.type === 'BOSS') {
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(-30, -this.radius + 5);
      ctx.lineTo(-42, -this.radius - 35);
      ctx.lineTo(-14, -this.radius - 12);
      ctx.lineTo(0, -this.radius - 45);
      ctx.lineTo(14, -this.radius - 12);
      ctx.lineTo(42, -this.radius - 35);
      ctx.lineTo(30, -this.radius + 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Pick sprite matching assigned face variety
    let faceSprite = SPRITES.boba;
    if (this.faceType === 'goofy') faceSprite = SPRITES.goofy;
    else if (this.faceType === 'angry') faceSprite = SPRITES.angry;
    else if (this.faceType === 'smiley') faceSprite = SPRITES.smiley;

    if (faceSprite.complete && faceSprite.naturalWidth > 0 && this.type === 'STANDARD') {
      const size = this.radius * 2.1;
      ctx.drawImage(faceSprite, -size / 2, -size / 2, size, size);
    } else {
      // Clean Vector Sphere with Facial Expressions
      ctx.fillStyle = this.type === 'WITCH' ? (this.isWitchEnraged ? '#d50000' : '#80d8ff') : this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Specular Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(-this.radius * 0.35, -this.radius * 0.35, this.radius * 0.3, 0, Math.PI * 2);
      ctx.fill();

      if (this.type === 'WITCH') {
        if (this.isWitchEnraged) {
          // Fiery Yellow Angry Nightmare Eyes & Sharp Fangs
          ctx.fillStyle = '#ffff00';
          ctx.beginPath();
          ctx.arc(-7, -4, 5, 0, Math.PI * 2);
          ctx.arc(7, -4, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.moveTo(-6, 4); ctx.lineTo(-2, 12); ctx.lineTo(2, 4);
          ctx.moveTo(2, 4); ctx.lineTo(6, 12); ctx.lineTo(10, 4);
          ctx.fill();
        } else {
          // Weeping Crying Eyes with Dripping Tears
          ctx.fillStyle = '#120c24';
          ctx.beginPath();
          ctx.arc(-6, -2, 3, 0, Math.PI * 2);
          ctx.arc(6, -2, 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#00b0ff';
          ctx.fillRect(-7, 2, 3, 7);
          ctx.fillRect(5, 2, 3, 7);
        }
      } else {
        // Standard Eye details
        ctx.fillStyle = '#120c24';
        ctx.beginPath();
        ctx.arc(-this.radius * 0.3, -2, Math.max(2, this.radius * 0.1), 0, Math.PI * 2);
        ctx.arc(this.radius * 0.3, -2, Math.max(2, this.radius * 0.1), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // White Flash Effect when struck!
    if (this.flashFrames > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Cracks overlay if boba has taken damage (maxHp > 1 and hp < maxHp)
    if (this.maxHp > 1 && this.hp < this.maxHp) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(-this.radius * 0.4, -this.radius * 0.2);
      ctx.lineTo(-this.radius * 0.1, 0);
      ctx.lineTo(-this.radius * 0.3, this.radius * 0.4);

      if (this.hp <= 1) {
        ctx.moveTo(this.radius * 0.2, -this.radius * 0.5);
        ctx.lineTo(this.radius * 0.4, -this.radius * 0.1);
        ctx.lineTo(this.radius * 0.1, this.radius * 0.3);
      }
      ctx.stroke();
    }

    // Render Mini Health Bar over multi-hit Bobas (e.g., 4 HP Angry Red Bobas)
    if (this.maxHp > 1) {
      const hpW = Math.max(24, this.radius * 1.6);
      const hpH = 5;
      const hpX = -hpW / 2;
      const hpY = -this.radius - 9;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(hpX, hpY, hpW, hpH);

      const fillW = Math.max(0, (this.hp / this.maxHp) * hpW);
      ctx.fillStyle = this.hp > 2 ? '#ff1744' : '#ffab00';
      ctx.fillRect(hpX, hpY, fillW, hpH);

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(hpX, hpY, hpW, hpH);
    }

    ctx.restore();
  }
}

// --- 4. Splatter Particle Decal --- //
class SplatterParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.radius = Math.random() * 5 + 3;
    this.vx = (Math.random() - 0.5) * 12;
    this.vy = (Math.random() - 0.8) * 10;
    this.alpha = 1.0;
    this.isDecal = false;
  }

  update() {
    if (this.isDecal) {
      this.alpha -= 0.002; // slow fade over 8 seconds
      return;
    }
    this.vy += 0.38;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y >= CONFIG.FLOOR_Y) {
      this.y = CONFIG.FLOOR_Y + (Math.random() * 8);
      this.isDecal = true;
    }
  }

  draw(ctx) {
    if (this.alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// --- 5. Sugar Crystal (XP Drop) --- //
class SugarCrystal {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.vy = -3;
    this.vx = (Math.random() - 0.5) * 4;
    this.radius = 8;
  }

  update(players, magnetRadius) {
    this.vy += 0.25;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y >= CONFIG.FLOOR_Y - this.radius) {
      this.y = CONFIG.FLOOR_Y - this.radius;
      this.vx *= 0.8;
    }

    // Magnet Pull to closest active player
    players.forEach(p => {
      if (p.isGhost) return;
      const dx = p.x - this.x;
      const dy = p.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < magnetRadius) {
        this.x += (dx / dist) * 7;
        this.y += (dy / dist) * 7;
      }
    });
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    // Diamond shape crystal
    ctx.moveTo(this.x, this.y - this.radius);
    ctx.lineTo(this.x + this.radius, this.y);
    ctx.lineTo(this.x, this.y + this.radius);
    ctx.lineTo(this.x - this.radius, this.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// --- 7. Gatling Bullet Class (Machine Gun Frenzy Weapon) --- //
class GatlingBullet {
  constructor(playerId, startX, startY) {
    this.playerId = playerId;
    this.x = startX;
    this.y = startY;
    this.speed = 22; // High velocity rapid fire bullet!
    this.radius = 4;
    this.state = 'ACTIVE'; // ACTIVE or DONE
  }

  update(gameState) {
    this.y -= this.speed;

    // Platform bottom collision check (Bullets hit elevated platforms and get blocked!)
    if (gameState && gameState.platforms) {
      for (let plat of gameState.platforms) {
        if (this.x >= plat.x - 2 && this.x <= plat.x + plat.width + 2) {
          if (this.y <= plat.y + plat.height && this.y >= plat.y) {
            this.state = 'DONE';
            // Spawn gold impact sparks under the platform
            if (gameState.particles) {
              for (let i = 0; i < 4; i++) {
                const spark = new SplatterParticle(this.x, plat.y + plat.height, '#ffd700');
                spark.vy = Math.random() * 3 + 1;
                spark.vx = (Math.random() - 0.5) * 4;
                spark.size = Math.random() * 2 + 1;
                gameState.particles.push(spark);
              }
            }
            return;
          }
        }
      }
    }

    if (this.y <= CONFIG.CEILING_Y) {
      this.state = 'DONE';
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = this.playerId === 1 ? '#ff4081' : '#18ffff';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // High velocity trail line
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y + 16);
    ctx.stroke();
    ctx.restore();
  }
}

// --- 6. Platform Class (Elevated Level Structures) --- //
class Platform {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  draw(ctx) {
    ctx.save();
    ctx.fillStyle = '#2a1b4e';
    ctx.fillRect(this.x, this.y, this.width, this.height);

    ctx.strokeStyle = '#b388ff';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#b388ff';
    ctx.shadowBlur = 8;
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    ctx.strokeStyle = '#18ffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.width, this.y);
    ctx.stroke();

    ctx.restore();
  }
}

// --- 8. Acid Gush Hazard Class (Spawned when Acid Mini-Boss Pops) --- //
class AcidGushHazard {
  constructor(x, y) {
    this.x = x;
    this.y = y; // Original pop height
    this.floorY = CONFIG.FLOOR_Y - 10;
    this.gushCount = 0;
    this.timer = 0;
    this.maxGushes = 3;
    this.interval = 60; // 60 frames = 1.0 second between sequential gushes
    this.activeGushes = []; // Active expanding toxic rings
    this.isDone = false;
  }

  update(gameState) {
    this.timer++;

    // Sequential Gush trigger at 0.0s (timer=1), 1.0s (timer=60), 2.0s (timer=120)
    if (this.gushCount < this.maxGushes && (this.timer === 1 || this.timer % this.interval === 0)) {
      this.gushCount++;
      audioManager.playWitchScreech();
      if (gameState) gameState.screenShake = 22;

      // Add new expanding toxic acid ring centered on the floor line
      this.activeGushes.push({
        radius: 15,
        maxRadius: 240,
        alpha: 1.0,
        damageDealt: {}
      });

      // Emit 40 toxic green acid splatter particles springing up from the floor
      if (gameState && gameState.particles) {
        for (let i = 0; i < 40; i++) {
          const angle = (Math.random() * 0.8 + 0.1) * -Math.PI; // Upward spray
          const speed = Math.random() * 9 + 3;
          const p = new SplatterParticle(this.x + (Math.random() - 0.5) * 40, this.floorY, '#76ff03');
          p.vx = Math.cos(angle) * speed;
          p.vy = Math.sin(angle) * speed;
          p.size = Math.random() * 5 + 2;
          gameState.particles.push(p);
        }
      }
    }

    // Expand rings, check player damage, and fade out
    for (let i = this.activeGushes.length - 1; i >= 0; i--) {
      const gush = this.activeGushes[i];
      gush.radius += 5.5;
      gush.alpha -= 0.020;

      // Check toxic acid damage to players
      if (gameState && gameState.players) {
        const waveMult = typeof gameState.getWaveDamageMultiplier === 'function'
          ? gameState.getWaveDamageMultiplier()
          : 1.0;

        gameState.players.forEach(p => {
          if (p.isGhost) return;

          // Distance check to floor pool and vertical acid surge column
          const distFloor = Math.hypot(p.x - this.x, p.y - this.floorY);
          const inVerticalColumn = Math.abs(p.x - this.x) <= (gush.radius * 0.35 + p.radius) && (p.y >= this.y - 30 && p.y <= this.floorY + 20);

          if ((distFloor <= gush.radius + p.radius || inVerticalColumn) && !gush.damageDealt[p.id]) {
            if (p.shield > 0) {
              gush.damageDealt[p.id] = true;
              p.shield--;
              p.iFrames = 40;
              audioManager.playCrystalPickup();
            } else if (p.iFrames <= 0) {
              gush.damageDealt[p.id] = true;
              p.health -= 25 * waveMult; // 25 HP toxic acid damage!
              p.iFrames = 30;
              audioManager.playHealthWarning();
              if (gameState) gameState.screenShake = 25;

              // Toxic impact splash particles
              for (let c = 0; c < 20; c++) {
                const sp = new SplatterParticle(p.x, p.y, '#76ff03');
                sp.vx = (Math.random() - 0.5) * 8;
                sp.vy = -Math.random() * 6 - 2;
                gameState.particles.push(sp);
              }

              if (p.health <= 0) {
                p.health = 0;
                p.isGhost = true;
                if (typeof gameState.checkGameOver === 'function') {
                  gameState.checkGameOver();
                }
              }
            }
          }
        });
      }

      if (gush.alpha <= 0 || gush.radius >= gush.maxRadius) {
        this.activeGushes.splice(i, 1);
      }
    }

    if (this.gushCount >= this.maxGushes && this.activeGushes.length === 0) {
      this.isDone = true;
    }
  }

  draw(ctx) {
    ctx.save();
    this.activeGushes.forEach(gush => {
      // 1. Vertical Acid Waterfall Surge Column from pop height to floor
      if (this.y < this.floorY - 20) {
        const colW = gush.radius * 0.5;
        const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.floorY);
        grad.addColorStop(0, `rgba(118, 255, 3, ${gush.alpha * 0.8})`);
        grad.addColorStop(1, `rgba(118, 255, 3, ${gush.alpha * 0.3})`);
        ctx.fillStyle = grad;
        ctx.fillRect(this.x - colW / 2, this.y, colW, this.floorY - this.y);
      }

      // 2. Glowing Expanding Floor Acid Rings
      ctx.strokeStyle = `rgba(118, 255, 3, ${gush.alpha})`;
      ctx.fillStyle = `rgba(118, 255, 3, ${gush.alpha * 0.32})`;
      ctx.lineWidth = 6;
      ctx.shadowColor = '#76ff03';
      ctx.shadowBlur = 22;

      ctx.beginPath();
      ctx.ellipse(this.x, this.floorY, gush.radius, gush.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();
  }
}

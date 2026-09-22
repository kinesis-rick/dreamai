/* Hellpang - Game Configuration, Constants, and Upgrade Card Catalog */

const CONFIG = {
  VERSION: 'v1.9.1',
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  FPS: 60,
  
  // Base Physics Constants (Floor aligned to line Y=660)
  BASE_GRAVITY: 0.08,
  GET_GRAVITY: (wave) => Math.min(0.38, 0.08 + (wave - 1) * 0.05),
  FLOOR_Y: 660,
  CEILING_Y: 50,
  WALL_LEFT: 40,
  WALL_RIGHT: 1240,

  // Player Defaults
  PLAYER_SPEED: 6.5,
  PLAYER_MAX_HEALTH: 100,
  PLAYER_RADIUS: 24,
  REVIVE_TIME: 3.0,

  // Grapple Defaults
  GRAPPLE_SPEED: 18,
  GRAPPLE_BASE_MAX: 1,

  // Co-op Synergies
  SUGAR_RUSH_DURATION: 3.0,
  SUGAR_RUSH_REQ: 100,

  // Boba Size Tiers (Super floaty -11 bounce velocity for ultra smooth high arcs)
  BOBA_TIERS: {
    4: { name: 'Colossal', radius: 52, bounceVelocity: -11.0, horizontalSpeed: 0.3, hp: 1, color: '#e040fb', points: 400, xp: 4 },
    3: { name: 'Large',    radius: 38, bounceVelocity: -10.0, horizontalSpeed: 0.4, hp: 1, color: '#7c4dff', points: 200, xp: 3 },
    2: { name: 'Medium',   radius: 26, bounceVelocity: -9.0,  horizontalSpeed: 0.5, hp: 1, color: '#00e676', points: 100, xp: 2 },
    1: { name: 'Mini',     radius: 16, bounceVelocity: -8.0,  horizontalSpeed: 0.7, hp: 1, color: '#ff4081', points: 50,  xp: 1 }
  },

  // Stage Platforms Configuration per Wave/Level
  STAGE_PLATFORMS: {
    1: [], // Level 1: Open arena for familiarization
    2: [ { x: 440, y: 380, width: 400, height: 18 } ], // Level 2: Center elevated platform
    3: [ { x: 200, y: 440, width: 260, height: 18 }, { x: 820, y: 440, width: 260, height: 18 } ], // Level 3: Dual side platforms
    4: [ { x: 500, y: 300, width: 280, height: 18 }, { x: 180, y: 480, width: 220, height: 18 }, { x: 880, y: 480, width: 220, height: 18 } ]
  },

  // Color Palette Definitions
  COLOR_SCHEMES: [
    { name: 'Taro Purple', primary: '#b388ff', secondary: '#d1c4e9', splash: '#7c4dff' },
    { name: 'Matcha Green', primary: '#69f0ae', secondary: '#c8e6c9', splash: '#00e676' },
    { name: 'Strawberry Neon', primary: '#ff4081', secondary: '#ff80ab', splash: '#f50057' },
    { name: 'Mango Sunshine', primary: '#ffd700', secondary: '#fff9c4', splash: '#ffab00' }
  ]
};

// Upgrade Cards Catalog (Vampire Survivors Style)
const UPGRADE_CARDS = [
  {
    id: 'multi_hook',
    name: 'Multi-Hook Harpoon',
    icon: '🔱',
    desc: 'Fire +1 additional active grapple cable simultaneously!',
    synergy: false,
    maxLevel: 3,
    apply: (gameState) => {
      gameState.playerStats.maxGrapples += 1;
    }
  },
  {
    id: 'syringe_speed',
    name: 'Boba Syringe',
    icon: '💉',
    desc: '+25% Grapple climb ascent velocity.',
    synergy: false,
    maxLevel: 4,
    apply: (gameState) => {
      gameState.playerStats.grappleSpeed *= 1.25;
    }
  },
  {
    id: 'sugar_dash',
    name: 'Sugar Rush Dash',
    icon: '⚡',
    desc: '+20% Player movement speed.',
    synergy: false,
    maxLevel: 4,
    apply: (gameState) => {
      gameState.playerStats.moveSpeed *= 1.20;
    }
  },
  {
    id: 'sticky_residue',
    name: 'Electric Tapioca Tripwire',
    icon: '⚡',
    desc: 'Anchored harpoons pulse with electricity, shocking any boba touching the cable! (10s Battery supply)',
    synergy: false,
    maxLevel: 1,
    apply: (gameState) => {
      gameState.playerStats.stickyResidue = true;
      gameState.playerStats.electricBattery = 600;
      gameState.playerStats.maxElectricBattery = 600;
    }
  },
  {
    id: 'juice_detonation',
    name: 'Juice Detonation Shockwave',
    icon: '💥',
    desc: 'Popping boba pearls triggers a powerful radial explosion damaging & popping nearby pearls!',
    synergy: false,
    maxLevel: 3,
    apply: (gameState) => {
      gameState.playerStats.juiceDetonationRadius = (gameState.playerStats.juiceDetonationRadius || 0) + 90;
    }
  },
  {
    id: 'bubble_shield',
    name: 'Tapioca Bubble Shield',
    icon: '🛡️',
    desc: 'Adds a blue shield health bar above health (Lvl 1: 25%, Lvl 2: 50%, Lvl 3: 75% max HP). Absorbs damage first!',
    synergy: false,
    maxLevel: 3,
    apply: (gameState) => {
      const acquired = gameState.acquiredCards || [];
      const shieldLevel = Math.min(3, acquired.filter(c => c === 'bubble_shield').length);
      const shieldRatio = shieldLevel * 0.25;

      gameState.players.forEach(p => {
        p.maxShield = Math.round(p.maxHealth * shieldRatio);
        p.shield = p.maxShield; // Grants & refills blue shield bar!
      });
      gameState.playerStats.maxShields = shieldLevel;
    }
  },
  {
    id: 'tether_overcharge',
    name: 'Tether Overcharge',
    icon: '⚡🔗',
    desc: '2P Synergy: Clothesline beam deals double damage & widens laser hitbox!',
    synergy: true,
    maxLevel: 2,
    apply: (gameState) => {
      gameState.playerStats.tetherOvercharge = (gameState.playerStats.tetherOvercharge || 1) + 1;
    }
  },
  {
    id: 'taro_freeze',
    name: 'Taro Syrup Chill',
    icon: '❄️',
    desc: 'Grapples slow boba bounce speed by 35% on hit.',
    synergy: false,
    maxLevel: 2,
    apply: (gameState) => {
      gameState.playerStats.slowEffect = true;
    }
  },
  {
    id: 'sugar_magnet',
    name: 'Sugar Crystal Magnet',
    icon: '🧲',
    desc: 'Increases XP crystal pickup radius by +150%.',
    synergy: false,
    maxLevel: 3,
    apply: (gameState) => {
      gameState.playerStats.magnetRadius = (gameState.playerStats.magnetRadius || 80) + 100;
    }
  },
  {
    id: 'gatling_frenzy',
    name: 'Tapioca Gatling Frenzy',
    icon: '🔫',
    desc: 'Equip a rapid-fire machine gun firing 10s of boba-busting ammo!',
    synergy: false,
    maxLevel: 3,
    apply: (gameState) => {
      gameState.playerStats.gatlingAmmoTimer = (gameState.playerStats.gatlingAmmoTimer || 0) + 600;
    }
  },
  {
    id: 'matcha_nova',
    name: 'Matcha Pulse Nova',
    icon: '🍵',
    desc: 'Popping bobas unleashes a green Matcha shockwave pushing nearby bobas away!',
    synergy: false,
    maxLevel: 2,
    apply: (gameState) => {
      gameState.playerStats.matchaPulse = true;
    }
  },
  {
    id: 'v_harpoon_split',
    name: 'V-Split Harpoon',
    icon: '🔀',
    desc: 'Launches dual angled harpoons at 45°! Upgrading creates a 3-way W-Spread (left, center, right)!',
    synergy: false,
    maxLevel: 2,
    apply: (gameState) => {
      gameState.playerStats.vHarpoonSplit = (gameState.playerStats.vHarpoonSplit || 0) + 1;
    }
  },
  {
    id: 'boba_leech',
    name: 'Tapioca Vampiric Syringe',
    icon: '🩸',
    desc: 'Restores +5 HP to all players whenever a large boba pearl (Tier 3 or 4) is popped!',
    synergy: false,
    maxLevel: 2,
    apply: (gameState) => {
      gameState.playerStats.vampiricSyringe = (gameState.playerStats.vampiricSyringe || 0) + 5;
    }
  }
];

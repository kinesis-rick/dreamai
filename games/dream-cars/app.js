/**
 * DREAM CARS: REALISTIC RACING
 * Complete 2D Top-Down Motorsport Game Engine (ES2024+)
 * Pure HTML5 Canvas, Mathematical Vehicle Dynamics, Web Audio Synthesizer,
 * 50-Car Livery Shader, 4-Layer 3D Bridge Overpass, SAT OBB Collisions,
 * 15 Intelligent AI Racers, and 1920x1080 Catmull-Rom Spline Track Editor.
 */

'use strict';

// ============================================================================
// 1. 50-CAR MOTORSPORT DATABASE & AUDIO PROFILES
// ============================================================================
const CATEGORIES = [
  'EXOTIC HYPERCAR',
  'GT3 RACER',
  'TRACK SPECIAL',
  'GROUP C LEGEND',
  'LMDh HYPERCAR',
  'FORMULA 1',
  'NASCAR STOCK CAR',
  'TRACK HYPERCAR',
  'TRACK DAY COUPE',
  'HOT HATCH'
];

const AUDIO_PROFILES = {
  'FORMULA 1':        { osc1: 'square',   osc2: 'sawtooth', idleHz: 150, maxHz: 650, gears: 7, filterHz: 1800 },
  'NASCAR STOCK CAR': { osc1: 'sawtooth', osc2: 'sine',     idleHz: 28,  maxHz: 185, gears: 4, filterHz: 380  },
  'GT3 RACER':        { osc1: 'sawtooth', osc2: 'sawtooth', idleHz: 50,  maxHz: 360, gears: 6, filterHz: 800  },
  'HOT HATCH':        { osc1: 'sawtooth', osc2: 'sine',     idleHz: 35,  maxHz: 260, gears: 5, filterHz: 600  },
  'EXOTIC HYPERCAR':  { osc1: 'sawtooth', osc2: 'square',   idleHz: 65,  maxHz: 440, gears: 7, filterHz: 1200 },
  'TRACK SPECIAL':    { osc1: 'sawtooth', osc2: 'sawtooth', idleHz: 58,  maxHz: 390, gears: 6, filterHz: 950  },
  'GROUP C LEGEND':   { osc1: 'square',   osc2: 'sine',     idleHz: 52,  maxHz: 410, gears: 5, filterHz: 900  },
  'LMDh HYPERCAR':    { osc1: 'sawtooth', osc2: 'square',   idleHz: 75,  maxHz: 490, gears: 7, filterHz: 1350 },
  'TRACK HYPERCAR':   { osc1: 'sawtooth', osc2: 'square',   idleHz: 70,  maxHz: 470, gears: 7, filterHz: 1300 },
  'TRACK DAY COUPE':  { osc1: 'sawtooth', osc2: 'sine',     idleHz: 42,  maxHz: 310, gears: 6, filterHz: 720  }
};

const LIVERY_SWATCHES = [
  null, // Factory Paint (no tint override)
  '#00f0ff', '#ff0055', '#ffcc00', '#00ff66', '#ff5500',
  '#9933ff', '#ffffff', '#1a66ff', '#ff1a1a', '#00d4aa', '#e6b800'
];

const CARS_DB = [
  // Row 0: EXOTIC HYPERCAR
  { id: 0,  name: 'Valkyrie GTR',         category: 'EXOTIC HYPERCAR', col: 0, row: 0, maxSpeed: 2.78, realTopKmh: 402, acceleration: 0.056, turnSpeed: 0.052, lateralGrip: 0.92, drag: 0.991, width: 46, height: 22, color: '#00d4aa' },
  { id: 1,  name: '911 GT3 RS',           category: 'EXOTIC HYPERCAR', col: 1, row: 0, maxSpeed: 2.62, realTopKmh: 342, acceleration: 0.052, turnSpeed: 0.054, lateralGrip: 0.91, drag: 0.991, width: 45, height: 22, color: '#00f0ff' },
  { id: 2,  name: 'Monza V12 Stradale',   category: 'EXOTIC HYPERCAR', col: 2, row: 0, maxSpeed: 2.74, realTopKmh: 385, acceleration: 0.055, turnSpeed: 0.050, lateralGrip: 0.90, drag: 0.991, width: 46, height: 22, color: '#ff1a1a' },
  { id: 3,  name: 'SantAgata SVJ',        category: 'EXOTIC HYPERCAR', col: 3, row: 0, maxSpeed: 2.72, realTopKmh: 378, acceleration: 0.054, turnSpeed: 0.049, lateralGrip: 0.89, drag: 0.991, width: 46, height: 22, color: '#ffcc00' },
  { id: 4,  name: 'Woking 765LT',         category: 'EXOTIC HYPERCAR', col: 4, row: 0, maxSpeed: 2.70, realTopKmh: 372, acceleration: 0.055, turnSpeed: 0.053, lateralGrip: 0.91, drag: 0.991, width: 45, height: 22, color: '#ff5500' },

  // Row 1: GT3 RACER
  { id: 5,  name: 'Weissach 911 RSR',     category: 'GT3 RACER',       col: 0, row: 1, maxSpeed: 2.58, realTopKmh: 332, acceleration: 0.051, turnSpeed: 0.055, lateralGrip: 0.93, drag: 0.991, width: 46, height: 22, color: '#ffffff' },
  { id: 6,  name: 'Bolognese V10 GT3',    category: 'GT3 RACER',       col: 1, row: 1, maxSpeed: 2.61, realTopKmh: 338, acceleration: 0.052, turnSpeed: 0.053, lateralGrip: 0.92, drag: 0.991, width: 46, height: 22, color: '#00ff66' },
  { id: 7,  name: 'C8.R GTE Pro',         category: 'GT3 RACER',       col: 2, row: 1, maxSpeed: 2.59, realTopKmh: 334, acceleration: 0.051, turnSpeed: 0.053, lateralGrip: 0.92, drag: 0.991, width: 46, height: 22, color: '#ffcc00' },
  { id: 8,  name: 'Affalterbach AMG GT3', category: 'GT3 RACER',       col: 3, row: 1, maxSpeed: 2.57, realTopKmh: 330, acceleration: 0.050, turnSpeed: 0.052, lateralGrip: 0.91, drag: 0.991, width: 46, height: 22, color: '#8aa0bc' },
  { id: 9,  name: 'Maranello 296 GT3',    category: 'GT3 RACER',       col: 4, row: 1, maxSpeed: 2.60, realTopKmh: 336, acceleration: 0.052, turnSpeed: 0.054, lateralGrip: 0.93, drag: 0.991, width: 46, height: 22, color: '#ff0055' },

  // Row 2: TRACK SPECIAL
  { id: 10, name: 'Woking Senna GTR',     category: 'TRACK SPECIAL',   col: 0, row: 2, maxSpeed: 2.68, realTopKmh: 362, acceleration: 0.054, turnSpeed: 0.055, lateralGrip: 0.93, drag: 0.991, width: 46, height: 22, color: '#00f0ff' },
  { id: 11, name: 'Stingray Z06 GT',      category: 'TRACK SPECIAL',   col: 1, row: 2, maxSpeed: 2.56, realTopKmh: 328, acceleration: 0.050, turnSpeed: 0.051, lateralGrip: 0.89, drag: 0.991, width: 45, height: 22, color: '#ff5500' },
  { id: 12, name: 'Suzuka Type-R GT',     category: 'TRACK SPECIAL',   col: 2, row: 2, maxSpeed: 2.46, realTopKmh: 308, acceleration: 0.048, turnSpeed: 0.052, lateralGrip: 0.88, drag: 0.991, width: 44, height: 21, color: '#ffffff' },
  { id: 13, name: 'Nismo GT500 Spec',     category: 'TRACK SPECIAL',   col: 3, row: 2, maxSpeed: 2.64, realTopKmh: 350, acceleration: 0.053, turnSpeed: 0.053, lateralGrip: 0.91, drag: 0.991, width: 46, height: 22, color: '#ff1a1a' },
  { id: 14, name: 'Bavaria M4 CSL',       category: 'TRACK SPECIAL',   col: 4, row: 2, maxSpeed: 2.52, realTopKmh: 320, acceleration: 0.049, turnSpeed: 0.051, lateralGrip: 0.89, drag: 0.991, width: 45, height: 22, color: '#1a66ff' },

  // Row 3: GROUP C LEGEND
  { id: 15, name: 'Retro GP-80 Wing',     category: 'GROUP C LEGEND',  col: 0, row: 3, maxSpeed: 2.75, realTopKmh: 392, acceleration: 0.055, turnSpeed: 0.054, lateralGrip: 0.92, drag: 0.991, width: 47, height: 22, color: '#ffffff' },
  { id: 16, name: 'Hiroshima 4-Rotor GTP',category: 'GROUP C LEGEND',  col: 1, row: 3, maxSpeed: 2.77, realTopKmh: 398, acceleration: 0.056, turnSpeed: 0.053, lateralGrip: 0.91, drag: 0.991, width: 47, height: 22, color: '#ff5500' },
  { id: 17, name: 'Fuji GT-One TS020',    category: 'GROUP C LEGEND',  col: 2, row: 3, maxSpeed: 2.79, realTopKmh: 405, acceleration: 0.056, turnSpeed: 0.054, lateralGrip: 0.92, drag: 0.991, width: 48, height: 22, color: '#ff1a1a' },
  { id: 18, name: 'Rothmans 962C Langheck',category: 'GROUP C LEGEND', col: 3, row: 3, maxSpeed: 2.80, realTopKmh: 410, acceleration: 0.055, turnSpeed: 0.051, lateralGrip: 0.90, drag: 0.992, width: 48, height: 22, color: '#1a66ff' },
  { id: 19, name: 'Silver Arrow C9',      category: 'GROUP C LEGEND',  col: 4, row: 3, maxSpeed: 2.81, realTopKmh: 415, acceleration: 0.056, turnSpeed: 0.050, lateralGrip: 0.90, drag: 0.992, width: 48, height: 22, color: '#d0d8e8' },

  // Row 4: LMDh HYPERCAR
  { id: 20, name: 'Thunder V8 Prototype', category: 'LMDh HYPERCAR',   col: 0, row: 4, maxSpeed: 2.82, realTopKmh: 422, acceleration: 0.057, turnSpeed: 0.056, lateralGrip: 0.94, drag: 0.992, width: 48, height: 22, color: '#ffcc00' },
  { id: 21, name: 'Weissach 963 LMDh',    category: 'LMDh HYPERCAR',   col: 1, row: 4, maxSpeed: 2.84, realTopKmh: 430, acceleration: 0.058, turnSpeed: 0.056, lateralGrip: 0.94, drag: 0.992, width: 48, height: 22, color: '#ffffff' },
  { id: 22, name: '9X8 Wingless Hybrid',  category: 'LMDh HYPERCAR',   col: 2, row: 4, maxSpeed: 2.81, realTopKmh: 418, acceleration: 0.057, turnSpeed: 0.055, lateralGrip: 0.93, drag: 0.992, width: 48, height: 22, color: '#00ff66' },
  { id: 23, name: 'Maranello 499P LMH',   category: 'LMDh HYPERCAR',   col: 3, row: 4, maxSpeed: 2.85, realTopKmh: 435, acceleration: 0.058, turnSpeed: 0.056, lateralGrip: 0.94, drag: 0.992, width: 48, height: 22, color: '#ff1a1a' },
  { id: 24, name: 'Gazoo GR010 Hybrid',   category: 'LMDh HYPERCAR',   col: 4, row: 4, maxSpeed: 2.83, realTopKmh: 426, acceleration: 0.058, turnSpeed: 0.055, lateralGrip: 0.94, drag: 0.992, width: 48, height: 22, color: '#ffffff' },

  // Row 5: FORMULA 1
  { id: 25, name: 'Scuderia Red GP-24',   category: 'FORMULA 1',       col: 0, row: 5, maxSpeed: 2.90, realTopKmh: 465, acceleration: 0.062, turnSpeed: 0.062, lateralGrip: 0.95, drag: 0.992, width: 48, height: 21, color: '#ff1a1a' },
  { id: 26, name: 'Silverstone White GP-24', category: 'FORMULA 1',    col: 1, row: 5, maxSpeed: 2.88, realTopKmh: 458, acceleration: 0.061, turnSpeed: 0.061, lateralGrip: 0.95, drag: 0.992, width: 48, height: 21, color: '#00d4aa' },
  { id: 27, name: 'Milton Keynes RB-24',  category: 'FORMULA 1',       col: 2, row: 5, maxSpeed: 2.90, realTopKmh: 468, acceleration: 0.063, turnSpeed: 0.062, lateralGrip: 0.95, drag: 0.992, width: 48, height: 21, color: '#1a66ff' },
  { id: 28, name: 'Papaya Woking MCL-24', category: 'FORMULA 1',       col: 3, row: 5, maxSpeed: 2.89, realTopKmh: 462, acceleration: 0.062, turnSpeed: 0.061, lateralGrip: 0.95, drag: 0.992, width: 48, height: 21, color: '#ff5500' },
  { id: 29, name: 'Brackley Silver W15',  category: 'FORMULA 1',       col: 4, row: 5, maxSpeed: 2.87, realTopKmh: 455, acceleration: 0.060, turnSpeed: 0.060, lateralGrip: 0.95, drag: 0.992, width: 48, height: 21, color: '#00f0ff' },

  // Row 6: NASCAR STOCK CAR
  { id: 30, name: 'Talladega #9 Stock',   category: 'NASCAR STOCK CAR', col: 0, row: 6, maxSpeed: 2.66, realTopKmh: 358, acceleration: 0.051, turnSpeed: 0.045, lateralGrip: 0.83, drag: 0.991, width: 47, height: 22, color: '#00f0ff' },
  { id: 31, name: 'Daytona V8 #12',       category: 'NASCAR STOCK CAR', col: 1, row: 6, maxSpeed: 2.67, realTopKmh: 360, acceleration: 0.051, turnSpeed: 0.045, lateralGrip: 0.83, drag: 0.991, width: 47, height: 22, color: '#ffcc00' },
  { id: 32, name: 'Charlotte Oval #20',   category: 'NASCAR STOCK CAR', col: 2, row: 6, maxSpeed: 2.65, realTopKmh: 355, acceleration: 0.050, turnSpeed: 0.046, lateralGrip: 0.84, drag: 0.991, width: 47, height: 22, color: '#ff5500' },
  { id: 33, name: 'Bristol Thunder #6',   category: 'NASCAR STOCK CAR', col: 3, row: 6, maxSpeed: 2.64, realTopKmh: 352, acceleration: 0.052, turnSpeed: 0.046, lateralGrip: 0.84, drag: 0.991, width: 47, height: 22, color: '#1a66ff' },
  { id: 34, name: 'Darlington Stripe #97',category: 'NASCAR STOCK CAR', col: 4, row: 6, maxSpeed: 2.66, realTopKmh: 357, acceleration: 0.051, turnSpeed: 0.045, lateralGrip: 0.83, drag: 0.991, width: 47, height: 22, color: '#00ff66' },

  // Row 7: TRACK HYPERCAR
  { id: 35, name: 'Gaydon AMR Pro',       category: 'TRACK HYPERCAR',  col: 0, row: 7, maxSpeed: 2.84, realTopKmh: 438, acceleration: 0.058, turnSpeed: 0.055, lateralGrip: 0.93, drag: 0.992, width: 47, height: 22, color: '#00ff66' },
  { id: 36, name: 'Molsheim W16 Bolide',  category: 'TRACK HYPERCAR',  col: 1, row: 7, maxSpeed: 2.90, realTopKmh: 504, acceleration: 0.061, turnSpeed: 0.051, lateralGrip: 0.91, drag: 0.992, width: 47, height: 22, color: '#00f0ff' },
  { id: 37, name: 'Modena Huayra R',      category: 'TRACK HYPERCAR',  col: 2, row: 7, maxSpeed: 2.82, realTopKmh: 428, acceleration: 0.057, turnSpeed: 0.055, lateralGrip: 0.93, drag: 0.992, width: 47, height: 22, color: '#ffffff' },
  { id: 38, name: 'Jesko Attack Aero',    category: 'TRACK HYPERCAR',  col: 3, row: 7, maxSpeed: 2.89, realTopKmh: 495, acceleration: 0.060, turnSpeed: 0.053, lateralGrip: 0.92, drag: 0.992, width: 47, height: 22, color: '#ff5500' },
  { id: 39, name: 'Rimac Nevera TimeAtk', category: 'TRACK HYPERCAR',  col: 4, row: 7, maxSpeed: 2.83, realTopKmh: 432, acceleration: 0.063, turnSpeed: 0.052, lateralGrip: 0.91, drag: 0.992, width: 47, height: 22, color: '#9933ff' },

  // Row 8: TRACK DAY COUPE (Note: Sprite sheet row 8 faces RIGHT)
  { id: 40, name: '718 Cayman GT4 RS',    category: 'TRACK DAY COUPE', col: 0, row: 8, maxSpeed: 2.42, realTopKmh: 302, acceleration: 0.047, turnSpeed: 0.053, lateralGrip: 0.89, drag: 0.990, width: 44, height: 21, color: '#00f0ff' },
  { id: 41, name: 'M3 Clubsport Touring', category: 'TRACK DAY COUPE', col: 1, row: 8, maxSpeed: 2.40, realTopKmh: 296, acceleration: 0.046, turnSpeed: 0.051, lateralGrip: 0.87, drag: 0.990, width: 44, height: 21, color: '#00ff66' },
  { id: 42, name: 'Godzilla R35 AWD',     category: 'TRACK DAY COUPE', col: 2, row: 8, maxSpeed: 2.48, realTopKmh: 315, acceleration: 0.051, turnSpeed: 0.050, lateralGrip: 0.88, drag: 0.991, width: 45, height: 21, color: '#ffffff' },
  { id: 43, name: 'Enstone A110 R',       category: 'TRACK DAY COUPE', col: 3, row: 8, maxSpeed: 2.36, realTopKmh: 285, acceleration: 0.046, turnSpeed: 0.055, lateralGrip: 0.90, drag: 0.990, width: 43, height: 20, color: '#1a66ff' },
  { id: 44, name: 'Dark Horse Boss 302',  category: 'TRACK DAY COUPE', col: 4, row: 8, maxSpeed: 2.44, realTopKmh: 305, acceleration: 0.048, turnSpeed: 0.047, lateralGrip: 0.84, drag: 0.990, width: 45, height: 22, color: '#ff0055' },

  // Row 9: HOT HATCH (Note: Sprite sheet row 9 faces RIGHT)
  { id: 45, name: 'Dieppe RS Trophy',     category: 'HOT HATCH',       col: 0, row: 9, maxSpeed: 2.22, realTopKmh: 258, acceleration: 0.043, turnSpeed: 0.054, lateralGrip: 0.86, drag: 0.990, width: 41, height: 20, color: '#ffcc00' },
  { id: 46, name: 'GR Rally AWD Hatch',   category: 'HOT HATCH',       col: 1, row: 9, maxSpeed: 2.26, realTopKmh: 268, acceleration: 0.046, turnSpeed: 0.055, lateralGrip: 0.88, drag: 0.990, width: 41, height: 20, color: '#ff1a1a' },
  { id: 47, name: 'Wolfsburg R-Hatch',    category: 'HOT HATCH',       col: 2, row: 9, maxSpeed: 2.24, realTopKmh: 264, acceleration: 0.044, turnSpeed: 0.053, lateralGrip: 0.86, drag: 0.990, width: 42, height: 20, color: '#00f0ff' },
  { id: 48, name: 'Affalterbach A45 S',   category: 'HOT HATCH',       col: 3, row: 9, maxSpeed: 2.28, realTopKmh: 272, acceleration: 0.046, turnSpeed: 0.053, lateralGrip: 0.87, drag: 0.990, width: 42, height: 20, color: '#00ff66' },
  { id: 49, name: 'Turin 695 Biposto',    category: 'HOT HATCH',       col: 4, row: 9, maxSpeed: 2.16, realTopKmh: 246, acceleration: 0.041, turnSpeed: 0.056, lateralGrip: 0.79, drag: 0.990, width: 39, height: 19, color: '#ff5500' }
];

// ============================================================================
// 2. BUILT-IN TRACKS DATABASE (WITH FIGURE-8 OVERPASS CROSSOVER)
// ============================================================================
const DEFAULT_WAYPOINTS = [
  { x: 611, y: 833 }, { x: 512, y: 882 }, { x: 381, y: 881 }, { x: 276, y: 821 },
  { x: 213, y: 753 }, { x: 180, y: 666 }, { x: 167, y: 571 }, { x: 164, y: 463 },
  { x: 184, y: 366 }, { x: 239, y: 286 }, { x: 309, y: 229 }, { x: 405, y: 199 },
  { x: 518, y: 199 }, { x: 598, y: 213 }, { x: 668, y: 256 }, { x: 748, y: 322 },
  { x: 823, y: 394 }, { x: 907, y: 474 }, { x: 986, y: 552 }, { x: 1067, y: 640 },
  { x: 1151, y: 733 }, { x: 1247, y: 811 }, { x: 1365, y: 870 }, { x: 1485, y: 888 },
  { x: 1581, y: 854 }, { x: 1660, y: 791 }, { x: 1713, y: 720 }, { x: 1738, y: 618 },
  { x: 1742, y: 541 }, { x: 1740, y: 444 }, { x: 1718, y: 353 }, { x: 1663, y: 263 },
  { x: 1576, y: 202 }, { x: 1482, y: 187 }, { x: 1376, y: 206 }, { x: 1282, y: 251 },
  { x: 1210, y: 305 }, { x: 1148, y: 358 }, { x: 1088, y: 416 }, { x: 1038, y: 464 },
  { x: 990, y: 511 }, { x: 928, y: 573 }, { x: 863, y: 641 }, { x: 815, y: 689 },
  { x: 748, y: 752 }, { x: 674, y: 807 }
];

// Elevated Bridge Deck Polygon (4-Layer Z-Depth Overpass between railings)
const BRIDGE_DECK_POLYGON = [
  { x: 816, y: 556 },
  { x: 1166, y: 251 },
  { x: 1236, y: 310 },
  { x: 886, y: 620 }
];

const TRACKS_DB = {
  classic: {
    id: 'classic',
    name: 'Grand Prix Paddock',
    src: 'tracks/classic.jpg',
    fallbackSrc: 'assets/track_classic_hd.jpg',
    startPos: { x: 465, y: 901, angle: Math.PI },
    startLine: { x: 478, y: 893, yMin: 843, yMax: 943, angle: Math.PI / 2, width: 100 },
    waypoints: structuredClone(DEFAULT_WAYPOINTS)
  },
  industrial: {
    id: 'industrial',
    name: 'Industrial Dockyard',
    src: 'tracks/industrial.jpg',
    fallbackSrc: 'assets/track_industrial_hd.jpg',
    startPos: { x: 465, y: 901, angle: Math.PI },
    startLine: { x: 478, y: 893, yMin: 843, yMax: 943, angle: Math.PI / 2, width: 100 },
    waypoints: structuredClone(DEFAULT_WAYPOINTS)
  },
  custom_grand_prix_paddock_custom: {
    id: 'custom_grand_prix_paddock_custom',
    name: 'Grand Prix Paddock Custom',
    src: 'tracks/grand_prix_paddock_custom.jpg',
    fallbackSrc: 'assets/track_classic_hd.jpg',
    startPos: { x: 465, y: 901, angle: Math.PI },
    startLine: { x: 478, y: 893, yMin: 843, yMax: 943, angle: Math.PI / 2, width: 100 },
    waypoints: structuredClone(DEFAULT_WAYPOINTS)
  }
};

// ============================================================================
// 3. PROCEDURAL WEB AUDIO API SYNTHESIZER
// ============================================================================
class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.isRunning = false;
    this.osc1 = null;
    this.osc2 = null;
    this.filter = null;
    this.engineGain = null;
    this.currentProfile = AUDIO_PROFILES['EXOTIC HYPERCAR'];
    this.currentGear = 1;
    this.lastShiftTime = 0;
    this.lastCrashTime = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
  }

  startEngine(category) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.stopEngine();

    this.currentProfile = AUDIO_PROFILES[category] || AUDIO_PROFILES['EXOTIC HYPERCAR'];
    const now = this.ctx.currentTime;

    this.osc1 = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();
    this.filter = this.ctx.createBiquadFilter();
    this.engineGain = this.ctx.createGain();

    this.osc1.type = this.currentProfile.osc1;
    this.osc2.type = this.currentProfile.osc2;

    this.osc1.frequency.setValueAtTime(this.currentProfile.idleHz, now);
    this.osc2.frequency.setValueAtTime(this.currentProfile.idleHz * 0.5, now);

    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(this.currentProfile.filterHz, now);
    this.filter.Q.setValueAtTime(2.5, now);

    this.engineGain.gain.setValueAtTime(0.08, now);

    this.osc1.connect(this.filter);
    this.osc2.connect(this.filter);
    this.filter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);

    this.osc1.start(now);
    this.osc2.start(now);
    this.isRunning = true;
    this.currentGear = 1;
  }

  updateEngine(speedRatio, isSlipping = false) {
    if (!this.enabled || !this.isRunning || !this.ctx) return;
    const prof = this.currentProfile;
    const totalGears = prof.gears || 6;
    const clampedRatio = Math.max(0, Math.min(1, speedRatio));

    // Staggered transmission thresholds
    const gearSpan = 1.0 / totalGears;
    let rawGear = Math.floor(clampedRatio / gearSpan) + 1;
    if (rawGear > totalGears) rawGear = totalGears;

    const gearStart = (rawGear - 1) * gearSpan;
    const gearProgress = Math.max(0, Math.min(1, (clampedRatio - gearStart) / gearSpan));

    // Exponential RPM curve within each gear; shifting drops RPM to ~60% before revving up
    const rpmNormalized = (rawGear === 1 ? 0.15 : 0.58) + (rawGear === 1 ? 0.85 : 0.42) * Math.pow(gearProgress, 0.82);
    const overallPitchFactor = (rawGear / totalGears) * rpmNormalized;

    const targetHz = prof.idleHz + (prof.maxHz - prof.idleHz) * Math.min(1.05, overallPitchFactor * 1.15);
    const now = this.ctx.currentTime;

    this.osc1.frequency.setTargetAtTime(targetHz, now, 0.035);
    this.osc2.frequency.setTargetAtTime(targetHz * 0.5, now, 0.035);

    const dynamicFilter = prof.filterHz * (0.65 + 0.65 * clampedRatio) + (isSlipping ? 250 : 0);
    this.filter.frequency.setTargetAtTime(dynamicFilter, now, 0.05);

    const targetGain = 0.055 + clampedRatio * 0.065;
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);

    this.currentGear = rawGear;
    return this.currentGear;
  }

  stopEngine() {
    if (!this.isRunning) return;
    try {
      if (this.osc1) { this.osc1.stop(); this.osc1.disconnect(); }
      if (this.osc2) { this.osc2.stop(); this.osc2.disconnect(); }
      if (this.filter) this.filter.disconnect();
      if (this.engineGain) this.engineGain.disconnect();
    } catch (_) {}
    this.osc1 = null;
    this.osc2 = null;
    this.isRunning = false;
  }

  playCrashImpact(impactMagnitude = 1.0) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const nowMs = performance.now();
    if (nowMs - this.lastCrashTime < 180) return; // 180ms cooldown debounce
    this.lastCrashTime = nowMs;

    const now = this.ctx.currentTime;
    const vol = Math.min(0.28, Math.max(0.08, impactMagnitude * 0.18));

    // 3 resonant sine wave oscillators [850 Hz, 1420 Hz, 2350 Hz] ramping down over 120ms
    const freqs = [850, 1420, 2350];
    for (const f of freqs) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.28, now + 0.12);

      gain.gain.setValueAtTime(vol * 0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.125);
    }

    // 50ms highpass-filtered (1200 Hz) white noise burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const hpFilter = this.ctx.createBiquadFilter();
    hpFilter.type = 'highpass';
    hpFilter.frequency.setValueAtTime(1200, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(vol * 0.85, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(hpFilter);
    hpFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
    noise.stop(now + 0.055);
  }

  playLapChime() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [
      { freq: 523.25, start: 0,    dur: 0.18 }, // C5
      { freq: 659.25, start: 0.14, dur: 0.32 }  // E5
    ];

    for (const n of notes) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.16, now + n.start);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.start + n.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.02);
    }
  }
}

// ============================================================================
// 4. SPRITE SHEET & 3-PASS OFFSCREEN LIVERY SHADER
// ============================================================================
class CarRenderer {
  constructor() {
    this.spriteSheet = new Image();
    this.spriteLoaded = false;
    this.spriteSheet.onload = () => {
      this.spriteLoaded = true;
      this.cache.clear();
      if (window.gameApp) window.gameApp.refreshUI();
    };
    this.spriteSheet.src = 'assets/cars_spritesheet.png';
    this.cache = new Map();
  }

  /**
   * Returns a cached offscreen canvas of the car normalized so angle 0 = facing RIGHT (+X),
   * tinted using the 3-pass offscreen canvas shader if customColor is provided.
   */
  getCarSprite(carSpec, customColor = null) {
    const key = `${carSpec.id}_${customColor || 'factory'}_${this.spriteLoaded}`;
    if (this.cache.has(key)) return this.cache.get(key);

    const w = 128;
    const h = 64;
    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = w;
    baseCanvas.height = h;
    const bCtx = baseCanvas.getContext('2d');

    if (this.spriteLoaded && this.spriteSheet.naturalWidth > 0) {
      const cellW = this.spriteSheet.naturalWidth / 5;   // 204.8
      const cellH = this.spriteSheet.naturalHeight / 10; // 102.4
      const sx = carSpec.col * cellW;
      const sy = carSpec.row * cellH;

      bCtx.save();
      bCtx.translate(w / 2, h / 2);
      // Rows 0-7 face Left in the spritesheet -> rotate by PI so all cached sprites face Right (0 rad)
      if (carSpec.row <= 7) {
        bCtx.rotate(Math.PI);
      }
      bCtx.drawImage(this.spriteSheet, sx, sy, cellW, cellH, -w / 2, -h / 2, w, h);
      bCtx.restore();
    } else {
      // Procedural canvas fallback (detailed top-down motorsport vector facing Right)
      this.drawProceduralCar(bCtx, w, h, carSpec, customColor || carSpec.color);
      this.cache.set(key, baseCanvas);
      return baseCanvas;
    }

    // Apply 3-Pass Offscreen Livery Tinting if customColor is provided
    if (customColor) {
      const tintCanvas = document.createElement('canvas');
      tintCanvas.width = w;
      tintCanvas.height = h;
      const tCtx = tintCanvas.getContext('2d');

      // Pass A: Draw base car sprite
      tCtx.drawImage(baseCanvas, 0, 0);

      // Pass B: globalCompositeOperation = 'color' with 85% opacity to re-tint painted panels
      tCtx.save();
      tCtx.globalCompositeOperation = 'color';
      tCtx.globalAlpha = 0.85;
      tCtx.fillStyle = customColor;
      tCtx.fillRect(0, 0, w, h);
      tCtx.restore();

      // Pass C: globalCompositeOperation = 'multiply' with 25% opacity to deepen panel contours
      tCtx.save();
      tCtx.globalCompositeOperation = 'multiply';
      tCtx.globalAlpha = 0.25;
      tCtx.fillStyle = customColor;
      tCtx.fillRect(0, 0, w, h);
      tCtx.restore();

      // Pass D: globalCompositeOperation = 'destination-in' using original car sprite alpha mask
      tCtx.save();
      tCtx.globalCompositeOperation = 'destination-in';
      tCtx.drawImage(baseCanvas, 0, 0);
      tCtx.restore();

      this.cache.set(key, tintCanvas);
      return tintCanvas;
    }

    this.cache.set(key, baseCanvas);
    return baseCanvas;
  }

  drawProceduralCar(ctx, w, h, carSpec, paintColor) {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    const cw = w * 0.82;
    const ch = h * 0.72;
    const isF1 = carSpec.category === 'FORMULA 1';

    // Tires
    ctx.fillStyle = '#141619';
    const tw = cw * 0.2;
    const th = ch * 0.24;
    ctx.fillRect(-cw * 0.36, -ch * 0.52, tw, th);
    ctx.fillRect(-cw * 0.36,  ch * 0.28, tw, th);
    ctx.fillRect( cw * 0.20, -ch * 0.52, tw, th);
    ctx.fillRect( cw * 0.20,  ch * 0.28, tw, th);

    // Front Splitter & Rear Diffuser
    ctx.fillStyle = '#1e242d';
    ctx.beginPath();
    ctx.roundRect(-cw * 0.48, -ch * 0.42, cw * 0.96, ch * 0.84, 8);
    ctx.fill();

    // Main Painted Body
    ctx.fillStyle = paintColor || '#00f0ff';
    ctx.beginPath();
    if (isF1) {
      ctx.moveTo(cw * 0.48, 0);
      ctx.lineTo(cw * 0.1, -ch * 0.22);
      ctx.lineTo(-cw * 0.15, -ch * 0.38);
      ctx.lineTo(-cw * 0.44, -ch * 0.32);
      ctx.lineTo(-cw * 0.44,  ch * 0.32);
      ctx.lineTo(-cw * 0.15,  ch * 0.38);
      ctx.lineTo(cw * 0.1,  ch * 0.22);
      ctx.closePath();
    } else {
      ctx.roundRect(-cw * 0.45, -ch * 0.44, cw * 0.90, ch * 0.88, 10);
    }
    ctx.fill();

    // Cockpit Windshield & Canopy
    ctx.fillStyle = '#0c131f';
    ctx.beginPath();
    ctx.roundRect(-cw * 0.18, -ch * 0.30, cw * 0.42, ch * 0.60, 6);
    ctx.fill();

    // Rear Wing
    ctx.fillStyle = '#11161f';
    ctx.fillRect(-cw * 0.47, -ch * 0.46, cw * 0.11, ch * 0.92);

    // Headlights
    ctx.fillStyle = '#e6ffff';
    ctx.fillRect(cw * 0.38, -ch * 0.36, 5, 7);
    ctx.fillRect(cw * 0.38,  ch * 0.29, 5, 7);

    ctx.restore();
  }
}

// ============================================================================
// 5. VEHICLE ENTITY (MATHEMATICAL DYNAMICS & AI CONTROLLER)
// ============================================================================
class Vehicle {
  constructor(carSpec, config) {
    this.spec = carSpec;
    this.isAI = !!config.isAI;
    this.playerIndex = config.playerIndex ?? 0;
    this.name = config.name || carSpec.name;
    this.customColor = config.customColor || null;

    // Position & Velocity State
    this.x = config.x || 0;
    this.y = config.y || 0;
    this.vx = 0;
    this.vy = 0;
    this.angle = config.angle ?? Math.PI;
    this.steerInput = 0;

    // Race Progress & Anti-Cheat State
    this.lap = 1;
    this.hasPassedMidpoint = false;
    this.finished = false;
    this.finishTime = 0;
    this.lastLineSign = null;
    this.waypointIndex = 0;
    this.totalProgress = 0;

    // Surface & Telemetry Flags
    this.surface = 'ASPHALT'; // ASPHALT, GRASS SLOWDOWN, CORNER SLIP
    this.isSlipping = false;
    this.isOffroad = false;
    this.onUnderpass = false;

    // AI Specific State
    this.speed = 0;
    this.aiSkill = config.aiSkill || 1.0;
    this.aiLateralOffset = (Math.random() - 0.5) * 14;
    this.debugProbes = [];
  }

  /**
   * 3D Overpass / Underpass Bridge Elevation Check:
   * Position within bridge bounds (x: 740..1340, y: 200..700)
   * Underpass cars travel Down-Right (vx > 0), Overpass bridge deck cars travel Up-Left (vx < 0).
   */
  updateElevation() {
    if (this.x >= 740 && this.x <= 1340 && this.y >= 200 && this.y <= 700) {
      const cosA = Math.cos(this.angle);
      if (Math.abs(this.vx) > 0.05) {
        this.onUnderpass = this.vx > 0;
      } else {
        this.onUnderpass = cosA > 0;
      }
    } else {
      this.onUnderpass = false;
    }
  }
}

// ============================================================================
// 6. MAIN GAME ENGINE & TRACK EDITOR APPLICATION
// ============================================================================
class DreamCarsEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.minimapCanvas = document.getElementById('minimapCanvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    // Offscreen 1920x1080 Collision Canvas, Persistent Skidmark Canvas, & Bridge Overlay Canvas
    this.collisionCanvas = document.createElement('canvas');
    this.collisionCanvas.width = 1920;
    this.collisionCanvas.height = 1080;
    this.collisionCtx = this.collisionCanvas.getContext('2d', { willReadFrequently: true });
    this.collisionPixels = null;

    this.skidmarkCanvas = document.createElement('canvas');
    this.skidmarkCanvas.width = 1920;
    this.skidmarkCanvas.height = 1080;
    this.skidmarkCtx = this.skidmarkCanvas.getContext('2d');

    this.bridgeOverlayCanvas = document.createElement('canvas');
    this.bridgeOverlayCanvas.width = 1920;
    this.bridgeOverlayCanvas.height = 1080;
    this.bridgeOverlayCtx = this.bridgeOverlayCanvas.getContext('2d');

    this.audio = new SoundSynthesizer();
    this.carRenderer = new CarRenderer();

    // Game Configuration State
    this.selectedPlayerSlot = 0;
    this.playerConfigs = [
      { carId: 0,  color: null },
      { carId: 25, color: '#00f0ff' },
      { carId: 5,  color: '#ffcc00' },
      { carId: 30, color: '#ff0055' }
    ];
    this.opponentMode = 'same_class'; // same_car, same_class, multi_class, ffa
    this.multiClassCategories = new Set(['EXOTIC HYPERCAR', 'GT3 RACER', 'LMDh HYPERCAR']);
    this.selectedTrackId = 'classic';
    this.totalLaps = 3;
    this.numPlayers = 1;
    this.aiDifficulty = 1.0;
    this.p1CameraZoom = 2.8;
    this.showDebug = false;

    // Runtime Race State
    this.state = 'MENU'; // MENU, RACING, PAUSED, FINISHED, EDITOR
    this.vehicles = [];
    this.particles = [];
    this.keys = new Set();
    this.raceStartTime = 0;
    this.raceElapsedMs = 0;
    this.pauseStartTimestamp = 0;
    this.cameraX = 960;
    this.cameraY = 540;
    this.trackImages = new Map();

    // Track Editor State
    this.editor = {
      canvas: document.getElementById('editorCanvas'),
      ctx: document.getElementById('editorCanvas').getContext('2d'),
      tool: 'add', // add, move, insert, delete, startPos, startLine
      baseTrackId: 'classic',
      waypoints: structuredClone(DEFAULT_WAYPOINTS),
      startPos: { x: 465, y: 901, angle: Math.PI },
      startLine: { x: 478, y: 893, angle: Math.PI / 2, width: 100 },
      zoom: 1.0,
      panX: 0,
      panY: 0,
      isPanning: false,
      spaceDown: false,
      dragTarget: null,
      hoverIdx: -1,
      cursorX: 0,
      cursorY: 0,
      showGrid: true,
      showSlots: true,
      undoStack: [],
      redoStack: []
    };

    this.preloadTracks();
    this.bindInputEvents();
    this.initMenuUI();
    this.initEditorUI();
    this.refreshUI();

    requestAnimationFrame((ts) => this.mainLoop(ts));
  }

  // --------------------------------------------------------------------------
  // ASSET PRELOADING & TRACK BAKING
  // --------------------------------------------------------------------------
  preloadTracks() {
    Object.values(TRACKS_DB).forEach((track) => {
      const img = new Image();
      img.onload = () => {
        this.trackImages.set(track.id, img);
        this.renderTrackCards();
        if (track.id === this.selectedTrackId) {
          this.bakeTrackLayers(track);
        }
        if (this.state === 'EDITOR') this.renderEditor();
      };
      img.onerror = () => {
        if (track.fallbackSrc && img.src !== track.fallbackSrc) {
          img.src = track.fallbackSrc;
        }
      };
      img.src = track.src;
    });
  }

  bakeTrackLayers(track) {
    const img = this.trackImages.get(track.id);
    this.collisionCtx.clearRect(0, 0, 1920, 1080);

    if (img && img.complete && img.naturalWidth > 0) {
      this.collisionCtx.drawImage(img, 0, 0, 1920, 1080);
    } else {
      // Fallback procedural track surface if image not yet ready
      this.drawProceduralTrackFallback(this.collisionCtx, track);
    }

    // Cache pixel array for instant O(1) terrain sampling at 60 FPS
    this.collisionPixels = this.collisionCtx.getImageData(0, 0, 1920, 1080).data;

    // Pre-bake Layer 6: Elevated Bridge Deck Overlay clipped to bridge railings
    this.bridgeOverlayCtx.clearRect(0, 0, 1920, 1080);
    this.bridgeOverlayCtx.save();
    this.bridgeOverlayCtx.beginPath();
    BRIDGE_DECK_POLYGON.forEach((pt, idx) => {
      if (idx === 0) this.bridgeOverlayCtx.moveTo(pt.x, pt.y);
      else this.bridgeOverlayCtx.lineTo(pt.x, pt.y);
    });
    this.bridgeOverlayCtx.closePath();
    this.bridgeOverlayCtx.clip();

    if (img && img.complete && img.naturalWidth > 0) {
      this.bridgeOverlayCtx.drawImage(img, 0, 0, 1920, 1080);
    } else {
      this.drawProceduralTrackFallback(this.bridgeOverlayCtx, track);
    }

    // Subtle rail edge highlight on the elevated bridge deck
    this.bridgeOverlayCtx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    this.bridgeOverlayCtx.lineWidth = 2;
    this.bridgeOverlayCtx.stroke();
    this.bridgeOverlayCtx.restore();
  }

  drawProceduralTrackFallback(ctx, track) {
    ctx.fillStyle = '#2d5a27';
    ctx.fillRect(0, 0, 1920, 1080);
    if (track.waypoints.length < 2) return;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#cc2222';
    ctx.lineWidth = 118;
    ctx.beginPath();
    track.waypoints.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
    ctx.stroke();

    ctx.strokeStyle = '#383d47';
    ctx.lineWidth = 102;
    ctx.stroke();
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // PIXEL-BASED TERRAIN SAMPLING & EXEMPTION CORRIDORS
  // --------------------------------------------------------------------------
  sampleSurfaceAt(x, y, onUnderpass = false, track = TRACKS_DB[this.selectedTrackId]) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= 1920 || iy < 0 || iy >= 1080) return 'GRASS';

    // Surface Exemption 1: Underpass Tunnel Corridor (prevents bridge trees/rails from triggering grass slowdown)
    if (onUnderpass && ix >= 740 && ix <= 1340 && iy >= 200 && iy <= 700) {
      return 'ASPHALT';
    }

    // Surface Exemption 2: Start/Finish Line Red Paint Corridor
    const sl = track.startLine;
    if (Math.abs(ix - sl.x) < 42 && iy >= (sl.yMin ?? sl.y - 55) - 15 && iy <= (sl.yMax ?? sl.y + 55) + 15) {
      return 'ASPHALT';
    }

    // Surface Exemption 3: Within 46px of waypoint centerline on custom tracks
    if (!this.collisionPixels) return 'ASPHALT';

    const idx = (iy * 1920 + ix) * 4;
    const r = this.collisionPixels[idx];
    const g = this.collisionPixels[idx + 1];
    const b = this.collisionPixels[idx + 2];

    // Red rumble kerbs: r > g + 45 && r > b + 45 && r > 110 -> valid racing surface
    if (r > g + 45 && r > b + 45 && r > 110) {
      return 'KERB';
    }

    // Vegetation / Grass: g > r + 18 && g > b + 18 && g > 55
    if (g > r + 18 && g > b + 18 && g > 55) {
      return 'GRASS';
    }

    // Sand / Dirt traps: r > 130 && g > 110 && b < 110 && abs(r - g) < 40
    if (r > 130 && g > 110 && b < 110 && Math.abs(r - g) < 40) {
      return 'SAND';
    }

    return 'ASPHALT';
  }

  // --------------------------------------------------------------------------
  // RACE INITIALIZATION & STAGGERED 16-CAR STARTING GRID
  // --------------------------------------------------------------------------
  startRace(customTrackOverride = null) {
    if (customTrackOverride) {
      TRACKS_DB.custom_live = customTrackOverride;
      this.selectedTrackId = 'custom_live';
    }

    const track = TRACKS_DB[this.selectedTrackId];
    this.bakeTrackLayers(track);
    this.skidmarkCtx.clearRect(0, 0, 1920, 1080);
    this.particles = [];
    this.vehicles = [];

    const totalCars = 16;
    const startAngle = track.startPos.angle ?? Math.PI;
    const forward = { x: Math.cos(startAngle), y: Math.sin(startAngle) };
    const right = { x: -Math.sin(startAngle), y: Math.cos(startAngle) };

    // Build AI car pool based on Opponent Selection Rules
    const p1Spec = CARS_DB[this.playerConfigs[0].carId];
    const aiPool = this.buildAICarPool(p1Spec);

    for (let slot = 0; slot < totalCars; slot++) {
      const row = Math.floor(slot / 2);
      const col = slot % 2; // 0 = left column, 1 = right column
      const backDist = 36 + row * 52 + (col === 1 ? 18 : 0);
      const latOffset = (col === 0 ? -1 : 1) * 18;

      const spawnX = track.startPos.x - forward.x * backDist + right.x * latOffset;
      const spawnY = track.startPos.y - forward.y * backDist + right.y * latOffset;

      const isHuman = slot < this.numPlayers;
      let spec, customColor, name;

      if (isHuman) {
        const pCfg = this.playerConfigs[slot];
        spec = CARS_DB[pCfg.carId];
        customColor = pCfg.color;
        name = `P${slot + 1} (${spec.name})`;
      } else {
        const aiPick = aiPool[(slot - this.numPlayers) % aiPool.length];
        spec = aiPick.spec;
        customColor = aiPick.color;
        name = `AI #${slot + 1} ${spec.name}`;
      }

      const v = new Vehicle(spec, {
        isAI: !isHuman,
        playerIndex: isHuman ? slot : -1,
        name,
        customColor,
        x: spawnX,
        y: spawnY,
        angle: startAngle,
        aiSkill: this.aiDifficulty * (0.95 + Math.random() * 0.09)
      });

      // Set initial waypoint target ahead of startPos
      v.waypointIndex = 1 % track.waypoints.length;
      this.vehicles.push(v);
    }

    const p1 = this.vehicles[0];
    this.cameraX = p1.x;
    this.cameraY = p1.y;

    this.raceStartTime = performance.now();
    this.raceElapsedMs = 0;
    this.state = 'RACING';

    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('modal-track-editor').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('finish-overlay').classList.add('hidden');
    document.getElementById('hud-overlay').classList.remove('hidden');
    document.getElementById('hud-total-laps').textContent = `/${this.totalLaps}`;
    document.getElementById('hud-car-name').textContent = p1.spec.name.toUpperCase();

    this.audio.startEngine(p1.spec.category);
  }

  buildAICarPool(p1Spec) {
    const palette = ['#00f0ff', '#ff0055', '#ffcc00', '#00ff66', '#ff5500', '#9933ff', '#1a66ff', '#ff1a1a', '#00d4aa', '#ffffff'];
    const pool = [];

    if (this.opponentMode === 'same_car') {
      for (let i = 0; i < 15; i++) {
        pool.push({ spec: p1Spec, color: palette[i % palette.length] });
      }
    } else if (this.opponentMode === 'same_class') {
      const sameClassCars = CARS_DB.filter((c) => c.category === p1Spec.category);
      for (let i = 0; i < 15; i++) {
        const spec = sameClassCars[i % sameClassCars.length];
        pool.push({ spec, color: i >= sameClassCars.length ? palette[i % palette.length] : null });
      }
    } else if (this.opponentMode === 'multi_class') {
      const cats = Array.from(this.multiClassCategories);
      const mcCars = CARS_DB.filter((c) => cats.includes(c.category));
      const list = mcCars.length > 0 ? mcCars : CARS_DB;
      for (let i = 0; i < 15; i++) {
        const spec = list[(i * 3) % list.length];
        pool.push({ spec, color: null });
      }
    } else {
      // Free-For-All across all 50 cars
      for (let i = 0; i < 15; i++) {
        const spec = CARS_DB[(i * 7 + 3) % CARS_DB.length];
        pool.push({ spec, color: null });
      }
    }
    return pool;
  }

  // --------------------------------------------------------------------------
  // 2. VEHICLE DYNAMICS & MATHEMATICAL PHYSICS ENGINE
  // --------------------------------------------------------------------------
  updateHumanPhysics(car, controls, track) {
    car.updateElevation();

    // Nose sensor coordinates for pixel-based terrain sampling
    const noseX = car.x + Math.cos(car.angle) * (car.spec.width * 0.42);
    const noseY = car.y + Math.sin(car.angle) * (car.spec.width * 0.42);
    const terrain = this.sampleSurfaceAt(noseX, noseY, car.onUnderpass, track);
    car.isOffroad = terrain === 'GRASS' || terrain === 'SAND';

    // 1. Orientation & Velocity Decomposition
    const forward = { x: Math.cos(car.angle), y: Math.sin(car.angle) };
    const right = { x: -Math.sin(car.angle), y: Math.cos(car.angle) };

    let forwardVel = car.vx * forward.x + car.vy * forward.y;
    let lateralVel = car.vx * right.x + car.vy * right.y;

    // 2. Dynamic Torque & Drag Acceleration Curve
    const effectiveMaxSpeed = car.isOffroad ? car.spec.maxSpeed * 0.4 : car.spec.maxSpeed;
    const currentSpeed = Math.hypot(car.vx, car.vy);
    const currentSpeedRatio = Math.min(1.0, Math.abs(forwardVel) / Math.max(0.1, effectiveMaxSpeed));

    const dragAtMax = effectiveMaxSpeed * (1.0 - car.spec.drag);
    const launchAccel = Math.max(car.spec.acceleration * 1.65, dragAtMax * 1.55);
    const torqueCurve = 1.0 - 0.70 * Math.pow(currentSpeedRatio, 1.1);
    const enginePower = Math.max(dragAtMax * 1.08, launchAccel * torqueCurve);

    if (controls.up) {
      if (forwardVel < effectiveMaxSpeed) {
        forwardVel += enginePower;
      }
    } else if (controls.down) {
      if (forwardVel > 0.15) {
        // High-power hydraulic braking
        forwardVel -= car.spec.acceleration * 2.1;
      } else {
        // Reverse gear capped at effectiveMaxSpeed * 0.4
        const revCap = -effectiveMaxSpeed * 0.4;
        if (forwardVel > revCap) {
          forwardVel -= enginePower * 0.85;
        }
      }
    }

    // Offroad deceleration & kickup particles
    if (car.isOffroad) {
      forwardVel *= 0.93;
      if (forwardVel > effectiveMaxSpeed) {
        forwardVel = effectiveMaxSpeed;
      }
      if (currentSpeed > 0.35 && Math.random() < 0.65) {
        this.spawnSurfaceParticles(car, terrain);
      }
    }

    // 3. Motion-Dependent Ackermann Steering
    let targetSteer = 0;
    if (controls.left) targetSteer -= 1;
    if (controls.right) targetSteer += 1;
    car.steerInput += (targetSteer - car.steerInput) * 0.22;

    const moveSpeed = Math.hypot(car.vx, car.vy);
    const motionTurnFactor = Math.min(1.0, moveSpeed / 0.35);
    const speedRatio = Math.min(1.0, moveSpeed / car.spec.maxSpeed);
    const turnSensitivity = 0.70 + (1.0 - speedRatio) * 0.30;
    const actualTurn = car.spec.turnSpeed * car.steerInput * turnSensitivity * motionTurnFactor;

    if (forwardVel >= -0.02) {
      car.angle += actualTurn;
    } else {
      car.angle -= actualTurn;
    }

    // 4. Tire Grip, Lateral Drift & Persistent Skidmarks
    lateralVel *= car.spec.lateralGrip;

    const newForward = { x: Math.cos(car.angle), y: Math.sin(car.angle) };
    const newRight = { x: -Math.sin(car.angle), y: Math.cos(car.angle) };

    car.vx = (newForward.x * forwardVel + newRight.x * lateralVel) * car.spec.drag;
    car.vy = (newForward.y * forwardVel + newRight.y * lateralVel) * car.spec.drag;

    car.x += car.vx;
    car.y += car.vy;

    // Boundary containment
    car.x = Math.max(24, Math.min(1896, car.x));
    car.y = Math.max(24, Math.min(1056, car.y));

    // Corner Slip & Persistent Rubber Skidmarks
    car.isSlipping = Math.abs(lateralVel) > 0.12 && currentSpeed > 0.35;
    if (car.isOffroad) {
      car.surface = 'GRASS SLOWDOWN';
    } else if (car.isSlipping) {
      car.surface = 'CORNER SLIP';
      this.stampSkidmarks(car);
    } else {
      car.surface = 'ASPHALT';
    }

    this.checkWaypointAndLap(car, track);
  }

  stampSkidmarks(car) {
    const rearOffset = -car.spec.width * 0.34;
    const tireSpread = car.spec.height * 0.36;
    const cosA = Math.cos(car.angle);
    const sinA = Math.sin(car.angle);

    this.skidmarkCtx.fillStyle = 'rgba(20, 20, 20, 0.48)';
    for (const side of [-1, 1]) {
      const tx = car.x + cosA * rearOffset - sinA * (side * tireSpread);
      const ty = car.y + sinA * rearOffset + cosA * (side * tireSpread);
      this.skidmarkCtx.beginPath();
      this.skidmarkCtx.arc(tx, ty, 2.2, 0, Math.PI * 2);
      this.skidmarkCtx.fill();
    }
  }

  spawnSurfaceParticles(car, terrain) {
    const rearX = car.x - Math.cos(car.angle) * (car.spec.width * 0.38);
    const rearY = car.y - Math.sin(car.angle) * (car.spec.width * 0.38);
    const color = terrain === 'SAND' ? 'rgba(210, 180, 110, 0.8)' : 'rgba(65, 145, 55, 0.8)';
    this.particles.push({
      x: rearX + (Math.random() - 0.5) * 10,
      y: rearY + (Math.random() - 0.5) * 10,
      vx: -car.vx * 0.3 + (Math.random() - 0.5) * 0.8,
      vy: -car.vy * 0.3 + (Math.random() - 0.5) * 0.8,
      radius: 2 + Math.random() * 2.5,
      alpha: 0.9,
      color
    });
  }

  // --------------------------------------------------------------------------
  // 7. AI COMPETITORS (15 INTELLIGENT RACERS)
  // --------------------------------------------------------------------------
  updateAIPhysics(ai, track) {
    ai.updateElevation();
    const wps = track.waypoints;
    if (wps.length < 2) return;

    const currWp = wps[ai.waypointIndex % wps.length];
    const nextWp = wps[(ai.waypointIndex + 1) % wps.length];
    const nextNextWp = wps[(ai.waypointIndex + 2) % wps.length];

    const distToWp = Math.hypot(currWp.x - ai.x, currWp.y - ai.y);

    // Check segment plane crossing or 65px proximity
    const segVecX = nextWp.x - currWp.x;
    const segVecY = nextWp.y - currWp.y;
    const carToWpX = currWp.x - ai.x;
    const carToWpY = currWp.y - ai.y;
    const dotPassed = segVecX * carToWpX + segVecY * carToWpY < 0 && distToWp < 110;

    if (distToWp < 65 || dotPassed) {
      ai.waypointIndex = (ai.waypointIndex + 1) % wps.length;
    }

    const targetWp = wps[ai.waypointIndex % wps.length];
    let targetAngle = Math.atan2(
      targetWp.y + ai.aiLateralOffset - ai.y,
      targetWp.x + ai.aiLateralOffset - ai.x
    );

    // 2. Corner Curvature Lookahead Braking
    const ang1 = Math.atan2(nextWp.y - currWp.y, nextWp.x - currWp.x);
    const ang2 = Math.atan2(nextNextWp.y - nextWp.y, nextNextWp.x - nextWp.x);
    const cornerCurvature = Math.abs(this.normalizeAngle(ang2 - ang1));
    const cornerBrakeFactor = Math.max(0.42, 1.0 - cornerCurvature * 0.70);

    // 3. Multi-Probe Track Edge & Wall Avoidance (+/- 25 deg at 16px and 32px)
    const probeAngles = [-25 * (Math.PI / 180), 25 * (Math.PI / 180)];
    const probeDists = [16, 32];
    ai.debugProbes = [];

    for (const pAng of probeAngles) {
      for (const pDist of probeDists) {
        const rayAngle = ai.angle + pAng;
        const px = ai.x + Math.cos(rayAngle) * (ai.spec.width * 0.4 + pDist);
        const py = ai.y + Math.sin(rayAngle) * (ai.spec.width * 0.4 + pDist);
        const surf = this.sampleSurfaceAt(px, py, ai.onUnderpass, track);
        const isBad = surf === 'GRASS' || surf === 'SAND';
        ai.debugProbes.push({ x: px, y: py, bad: isBad });
        if (isBad) {
          if (pAng < 0) targetAngle += 0.28; // Left probe hit grass -> steer right
          else targetAngle -= 0.28;          // Right probe hit grass -> steer left
        }
      }
    }

    // 4. Overtaking & Spatial Awareness (Scan leading cars within 110px)
    let speedCap = ai.spec.maxSpeed * ai.aiSkill * cornerBrakeFactor;
    for (const other of this.vehicles) {
      if (other === ai || other.onUnderpass !== ai.onUnderpass) continue;
      const dx = other.x - ai.x;
      const dy = other.y - ai.y;
      const d = Math.hypot(dx, dy);
      if (d < 110 && d > 1) {
        const relAngle = Math.abs(this.normalizeAngle(Math.atan2(dy, dx) - ai.angle));
        if (relAngle < 0.48) {
          // Probe left and right passing lanes at 14px lateral offset
          const rightX = -Math.sin(ai.angle);
          const rightY = Math.cos(ai.angle);
          const leftProbeX = ai.x + Math.cos(ai.angle) * 42 - rightX * 14;
          const leftProbeY = ai.y + Math.sin(ai.angle) * 42 - rightY * 14;
          const rightProbeX = ai.x + Math.cos(ai.angle) * 42 + rightX * 14;
          const rightProbeY = ai.y + Math.sin(ai.angle) * 42 + rightY * 14;

          const leftValid = this.sampleSurfaceAt(leftProbeX, leftProbeY, ai.onUnderpass, track) === 'ASPHALT';
          const rightValid = this.sampleSurfaceAt(rightProbeX, rightProbeY, ai.onUnderpass, track) === 'ASPHALT';

          if (leftValid) {
            targetAngle -= 0.22;
          } else if (rightValid) {
            targetAngle += 0.22;
          } else {
            // Both sides blocked -> match speed to avoid rear-ending
            const otherSpeed = Math.hypot(other.vx, other.vy);
            speedCap = Math.min(speedCap, otherSpeed * 0.95);
          }
        }
      }
    }

    // 5. Anti-Spinout Recovery: If off-track and facing away, scan forward 1-4 waypoints
    const noseSurf = this.sampleSurfaceAt(ai.x, ai.y, ai.onUnderpass, track);
    if (noseSurf === 'GRASS' || noseSurf === 'SAND') {
      speedCap *= 0.68;
      let bestIdx = ai.waypointIndex;
      let bestScore = Infinity;
      for (let step = 1; step <= 4; step++) {
        const candIdx = (ai.waypointIndex + step) % wps.length;
        const cand = wps[candIdx];
        const angDiff = Math.abs(this.normalizeAngle(Math.atan2(cand.y - ai.y, cand.x - ai.x) - ai.angle));
        const dist = Math.hypot(cand.x - ai.x, cand.y - ai.y);
        const score = dist + angDiff * 90;
        if (score < bestScore) {
          bestScore = score;
          bestIdx = candIdx;
        }
      }
      ai.waypointIndex = bestIdx;
    }

    // Smooth angular steering
    const angleDiff = this.normalizeAngle(targetAngle - ai.angle);
    const maxTurn = ai.spec.turnSpeed * 1.15;
    ai.angle += Math.max(-maxTurn, Math.min(maxTurn, angleDiff * 0.25));

    // Smooth speed progression
    if (ai.speed < speedCap) {
      ai.speed += ai.spec.acceleration * 1.25;
    } else {
      ai.speed -= ai.spec.acceleration * 1.65;
    }
    ai.speed = Math.max(0.35, Math.min(ai.spec.maxSpeed * ai.aiSkill, ai.speed));

    ai.vx = Math.cos(ai.angle) * ai.speed;
    ai.vy = Math.sin(ai.angle) * ai.speed;
    ai.x += ai.vx;
    ai.y += ai.vy;

    if (Math.abs(angleDiff) > 0.35 && ai.speed > 1.6) {
      this.stampSkidmarks(ai);
    }

    this.checkWaypointAndLap(ai, track);
  }

  // --------------------------------------------------------------------------
  // ANTI-CHEAT START/FINISH LINE SENSOR & LAP COUNTER
  // --------------------------------------------------------------------------
  checkWaypointAndLap(car, track) {
    const totalWps = track.waypoints.length;
    const progressRatio = car.waypointIndex / totalWps;

    // Verify midpoint passed (45% to 75% of the waypoint loop)
    if (progressRatio >= 0.45 && progressRatio <= 0.75) {
      car.hasPassedMidpoint = true;
    }

    // Calculate signed distance across the start/finish line normal vector
    const sl = track.startLine;
    const lineCenterX = sl.x;
    const lineCenterY = sl.y ?? ((sl.yMin + sl.yMax) * 0.5);
    const lineHalfWidth = (sl.width ?? (sl.yMax - sl.yMin)) * 0.5 + 18;

    // Start heading normal vector (pointing in direction of race travel across line)
    const normalAngle = track.startPos.angle ?? Math.PI;
    const nx = Math.cos(normalAngle);
    const ny = Math.sin(normalAngle);

    const relX = car.x - lineCenterX;
    const relY = car.y - lineCenterY;

    const signedDist = relX * nx + relY * ny;
    const lateralDist = Math.abs(-relX * ny + relY * nx);

    if (lateralDist <= lineHalfWidth && Math.abs(signedDist) < 45) {
      if (car.lastLineSign !== null && car.lastLineSign < 0 && signedDist >= 0) {
        if (car.hasPassedMidpoint) {
          car.lap += 1;
          car.hasPassedMidpoint = false;

          if (car === this.vehicles[0]) {
            this.audio.playLapChime();
            this.triggerHudNotification(
              car.lap > this.totalLaps ? 'FINAL LAP COMPLETE!' : `LAP ${car.lap} / ${this.totalLaps}`
            );
          }

          if (car.lap > this.totalLaps && !car.finished) {
            car.finished = true;
            car.finishTime = this.raceElapsedMs;
            if (car === this.vehicles[0]) {
              this.finishRace();
            }
          }
        }
      }
      car.lastLineSign = signedDist;
    } else if (Math.abs(signedDist) >= 45) {
      car.lastLineSign = signedDist < 0 ? -1 : 1;
    }

    // Continuous leaderboard score
    const nextWp = track.waypoints[car.waypointIndex % totalWps];
    const distToNext = Math.hypot(nextWp.x - car.x, nextWp.y - car.y);
    car.totalProgress = car.lap * 100000 + car.waypointIndex * 1000 - distToNext;
  }

  triggerHudNotification(text) {
    const el = document.getElementById('hud-notification');
    el.textContent = text;
    el.classList.remove('hidden');
    clearTimeout(this.notifTimeout);
    this.notifTimeout = setTimeout(() => el.classList.add('hidden'), 2200);
  }

  // --------------------------------------------------------------------------
  // 6. SEPARATING AXIS THEOREM (SAT) OBB CAR COLLISION ENGINE
  // --------------------------------------------------------------------------
  resolveAllCollisions() {
    const n = this.vehicles.length;
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = this.vehicles[i];
        const b = this.vehicles[j];

        // Elevation Collision Check: Underpass and Overpass cars NEVER collide
        if (a.onUnderpass !== b.onUnderpass) continue;

        // Broadphase circle check
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        if (dx * dx + dy * dy > 3600) continue;

        this.resolveSATCollision(a, b);
      }
    }
  }

  getOBB(car) {
    // Tighten collision hitboxes by scaling dimensions (82% length, 76% width)
    const halfL = (car.spec.width * 0.82) * 0.5;
    const halfW = (car.spec.height * 0.76) * 0.5;
    const cosA = Math.cos(car.angle);
    const sinA = Math.sin(car.angle);

    const axes = [
      { x: cosA,  y: sinA  },
      { x: -sinA, y: cosA  }
    ];

    const corners = [
      { x: car.x + cosA * halfL - sinA * halfW, y: car.y + sinA * halfL + cosA * halfW },
      { x: car.x + cosA * halfL + sinA * halfW, y: car.y + sinA * halfL - cosA * halfW },
      { x: car.x - cosA * halfL + sinA * halfW, y: car.y - sinA * halfL - cosA * halfW },
      { x: car.x - cosA * halfL - sinA * halfW, y: car.y - sinA * halfL + cosA * halfW }
    ];

    return { axes, corners };
  }

  resolveSATCollision(carA, carB) {
    const obbA = this.getOBB(carA);
    const obbB = this.getOBB(carB);
    const testAxes = [...obbA.axes, ...obbB.axes];

    let minOverlap = Infinity;
    let smallestAxis = null;

    for (const axis of testAxes) {
      let minA = Infinity, maxA = -Infinity;
      for (const p of obbA.corners) {
        const proj = p.x * axis.x + p.y * axis.y;
        if (proj < minA) minA = proj;
        if (proj > maxA) maxA = proj;
      }

      let minB = Infinity, maxB = -Infinity;
      for (const p of obbB.corners) {
        const proj = p.x * axis.x + p.y * axis.y;
        if (proj < minB) minB = proj;
        if (proj > maxB) maxB = proj;
      }

      const overlap = Math.min(maxA, maxB) - Math.max(minA, minB);
      if (overlap <= 0) {
        return; // Separating axis found -> no collision
      }

      if (overlap < minOverlap) {
        minOverlap = overlap;
        smallestAxis = { x: axis.x, y: axis.y };
      }
    }

    // Ensure axis points from A to B
    const centerDirX = carB.x - carA.x;
    const centerDirY = carB.y - carA.y;
    if (centerDirX * smallestAxis.x + centerDirY * smallestAxis.y < 0) {
      smallestAxis.x = -smallestAxis.x;
      smallestAxis.y = -smallestAxis.y;
    }

    // Displace cars along Minimum Translation Vector: smallestAxis * (overlap * 0.5 + 0.1)
    const disp = minOverlap * 0.5 + 0.1;
    carA.x -= smallestAxis.x * disp;
    carA.y -= smallestAxis.y * disp;
    carB.x += smallestAxis.x * disp;
    carB.y += smallestAxis.y * disp;

    // Relative velocity along collision normal
    const relVx = carA.vx - carB.vx;
    const relVy = carA.vy - carB.vy;
    const normalVel = relVx * smallestAxis.x + relVy * smallestAxis.y;

    if (normalVel > 0) {
      const restitution = 0.35;
      const impulse = (1 + restitution) * normalVel * 0.5;

      if (!carA.isAI) {
        carA.vx -= impulse * smallestAxis.x;
        carA.vy -= impulse * smallestAxis.y;
      } else {
        carA.speed = Math.max(0, carA.speed - impulse * 0.4);
      }

      if (!carB.isAI) {
        carB.vx += impulse * smallestAxis.x;
        carB.vy += impulse * smallestAxis.y;
      } else {
        carB.speed = Math.max(0, carB.speed - impulse * 0.4);
      }

      // Trigger metallic impact audio if human player is involved and impact speed > 0.15
      if ((!carA.isAI || !carB.isAI) && normalVel > 0.15) {
        this.audio.playCrashImpact(normalVel);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 8. 8-LAYER Z-DEPTH RENDERING PIPELINE
  // --------------------------------------------------------------------------
  renderRaceScene() {
    const ctx = this.ctx;
    const track = TRACKS_DB[this.selectedTrackId];
    const img = this.trackImages.get(track.id);

    ctx.save();
    ctx.clearRect(0, 0, 1920, 1080);

    // Camera zoom interpolation for 1P mode (2.8x follow cam) vs 2-4P mode (1.0x full track)
    const activeZoom = this.numPlayers === 1 ? this.p1CameraZoom : 1.0;
    if (activeZoom > 1.01 && this.vehicles.length > 0) {
      const p1 = this.vehicles[0];
      this.cameraX += (p1.x - this.cameraX) * 0.08;
      this.cameraY += (p1.y - this.cameraY) * 0.08;

      const halfW = 960 / activeZoom;
      const halfH = 540 / activeZoom;
      const cx = Math.max(halfW, Math.min(1920 - halfW, this.cameraX));
      const cy = Math.max(halfH, Math.min(1080 - halfH, this.cameraY));

      ctx.translate(960, 540);
      ctx.scale(activeZoom, activeZoom);
      ctx.translate(-cx, -cy);
    }

    // LAYER 1: Base Track Image / Background Canvas
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, 1920, 1080);
    } else {
      ctx.drawImage(this.collisionCanvas, 0, 0);
    }

    // LAYER 2: Start / Finish Checkerboard Line
    this.drawStartFinishLine(ctx, track);

    // LAYER 3: Persistent Rubber Skidmarks Canvas
    ctx.drawImage(this.skidmarkCanvas, 0, 0);

    // LAYER 4: Dirt / Grass Kickup Particles
    this.renderAndUpdateParticles(ctx);

    // Optional AI Waypoint & Sensor Debug Layer
    if (this.showDebug) {
      this.drawDebugOverlays(ctx, track);
    }

    // LAYER 5: Underpass Cars (Z-Level 0)
    for (const v of this.vehicles) {
      if (v.onUnderpass) this.drawVehicle(ctx, v);
    }

    // LAYER 6: Elevated Bridge Deck Overlay
    ctx.drawImage(this.bridgeOverlayCanvas, 0, 0);

    // LAYER 7: Overpass & Standard Track Cars (Z-Level 1)
    for (const v of this.vehicles) {
      if (!v.onUnderpass) this.drawVehicle(ctx, v);
    }

    ctx.restore();

    // LAYER 8: HUD Telemetry & Minimap Radar Overlay
    this.updateHUDAndMinimap(track);
  }

  drawStartFinishLine(ctx, track) {
    const sl = track.startLine;
    const cx = sl.x;
    const cy = sl.y ?? ((sl.yMin + sl.yMax) * 0.5);
    const width = sl.width ?? (sl.yMax - sl.yMin);
    const angle = sl.angle ?? Math.PI / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const cols = 2;
    const rows = Math.floor(width / 8);
    const cellW = 7;
    const cellH = width / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255,255,255,0.88)' : 'rgba(15,18,24,0.88)';
        ctx.fillRect(-cellW + c * cellW, -width * 0.5 + r * cellH, cellW, cellH);
      }
    }
    ctx.restore();
  }

  drawVehicle(ctx, v) {
    const sprite = this.carRenderer.getCarSprite(v.spec, v.customColor);
    const w = v.spec.width;
    const h = v.spec.height;

    ctx.save();
    ctx.translate(v.x, v.y);
    ctx.rotate(v.angle);

    // Dynamic Sun Shadow (+3.5px, +4.5px projected in world space via shadowOffsetX/Y & shadowBlur = 4)
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 3.5;
    ctx.shadowOffsetY = 4.5;
    ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
    ctx.restore();

    // Crisp vehicle pass
    ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
    ctx.restore();

    // Player indicator tag above human players
    if (!v.isAI) {
      const pColors = ['#00f0ff', '#ffcc00', '#ff0055', '#00ff66'];
      ctx.save();
      ctx.font = '700 10px Orbitron, sans-serif';
      ctx.fillStyle = pColors[v.playerIndex % 4];
      ctx.textAlign = 'center';
      ctx.fillText(`P${v.playerIndex + 1}`, v.x, v.y - 16);
      ctx.restore();
    }
  }

  renderAndUpdateParticles(ctx) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawDebugOverlays(ctx, track) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    track.waypoints.forEach((wp, idx) => {
      if (idx === 0) ctx.moveTo(wp.x, wp.y);
      else ctx.lineTo(wp.x, wp.y);
    });
    ctx.closePath();
    ctx.stroke();

    for (const wp of track.waypoints) {
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const v of this.vehicles) {
      if (v.isAI && v.debugProbes) {
        for (const pr of v.debugProbes) {
          ctx.fillStyle = pr.bad ? '#ff0055' : '#00ff66';
          ctx.beginPath();
          ctx.arc(pr.x, pr.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // HUD TELEMETRY & MINIMAP RADAR
  // --------------------------------------------------------------------------
  updateHUDAndMinimap(track) {
    const p1 = this.vehicles[0];
    if (!p1) return;

    // Sort standings
    const sorted = [...this.vehicles].sort((a, b) => b.totalProgress - a.totalProgress);
    const p1Pos = sorted.indexOf(p1) + 1;

    document.getElementById('hud-pos').textContent = p1Pos;
    document.getElementById('hud-lap').textContent = Math.min(this.totalLaps, p1.lap);
    document.getElementById('hud-timer').textContent = this.formatTime(this.raceElapsedMs);

    const speedMag = Math.hypot(p1.vx, p1.vy);
    const speedRatio = Math.min(1.0, speedMag / p1.spec.maxSpeed);
    const displayKmh = Math.round(speedRatio * p1.spec.realTopKmh);

    document.getElementById('hud-speed').textContent = displayKmh;
    document.getElementById('hud-speed-bar').style.width = `${Math.min(100, speedRatio * 100)}%`;

    const activeGear = this.audio.updateEngine(speedRatio, p1.isSlipping) || 1;
    document.getElementById('hud-gear').textContent = `GEAR ${activeGear}`;

    const surfEl = document.getElementById('hud-surface');
    surfEl.textContent = p1.surface;
    surfEl.className = 'surface-badge ' + (
      p1.surface === 'GRASS SLOWDOWN' ? 'offroad' :
      p1.surface === 'CORNER SLIP' ? 'slip' : 'asphalt'
    );

    // Minimap Radar (288x162 -> 0.15x scale of 1920x1080)
    const mCtx = this.minimapCtx;
    const mw = this.minimapCanvas.width;
    const mh = this.minimapCanvas.height;
    const scaleX = mw / 1920;
    const scaleY = mh / 1080;

    mCtx.clearRect(0, 0, mw, mh);
    mCtx.fillStyle = '#060a12';
    mCtx.fillRect(0, 0, mw, mh);

    // Draw scaled track path on radar
    if (track.waypoints.length > 1) {
      mCtx.save();
      mCtx.strokeStyle = 'rgba(0, 240, 255, 0.28)';
      mCtx.lineWidth = 8;
      mCtx.lineCap = 'round';
      mCtx.lineJoin = 'round';
      mCtx.beginPath();
      track.waypoints.forEach((wp, i) => {
        const rx = wp.x * scaleX;
        const ry = wp.y * scaleY;
        if (i === 0) mCtx.moveTo(rx, ry);
        else mCtx.lineTo(rx, ry);
      });
      mCtx.closePath();
      mCtx.stroke();
      mCtx.restore();
    }

    // Draw AI & Player blips
    for (const v of this.vehicles) {
      const rx = v.x * scaleX;
      const ry = v.y * scaleY;
      mCtx.beginPath();
      if (!v.isAI) {
        const pColors = ['#00f0ff', '#ffcc00', '#ff0055', '#00ff66'];
        mCtx.fillStyle = pColors[v.playerIndex % 4];
        mCtx.arc(rx, ry, 4.2, 0, Math.PI * 2);
      } else {
        mCtx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        mCtx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      }
      mCtx.fill();
    }
  }

  finishRace() {
    this.state = 'FINISHED';
    this.audio.stopEngine();

    const sorted = [...this.vehicles].sort((a, b) => b.totalProgress - a.totalProgress);
    const p1 = this.vehicles[0];
    const p1Rank = sorted.indexOf(p1) + 1;

    const suffixes = ['TH', 'ST', 'ND', 'RD'];
    const vMod = p1Rank % 100;
    const suffix = suffixes[(vMod - 20) % 10] || suffixes[vMod] || suffixes[0];

    document.getElementById('finish-headline').textContent = `${p1Rank}${suffix} PLACE FINISH!`;
    document.getElementById('finish-pos').textContent = `P${p1Rank} / ${this.vehicles.length}`;
    document.getElementById('finish-time').textContent = this.formatTime(this.raceElapsedMs);
    document.getElementById('finish-car').textContent = p1.spec.name;

    const lbEl = document.getElementById('finish-leaderboard');
    lbEl.innerHTML = sorted.slice(0, 8).map((v, idx) => `
      <div class="lb-row ${!v.isAI ? 'is-player' : ''}">
        <span>P${idx + 1}. ${v.name}</span>
        <span>${v.spec.category}</span>
      </div>
    `).join('');

    document.getElementById('finish-overlay').classList.remove('hidden');
  }

  // --------------------------------------------------------------------------
  // MAIN 60 FPS GAME LOOP
  // --------------------------------------------------------------------------
  mainLoop(timestamp) {
    if (this.state === 'RACING') {
      this.raceElapsedMs = timestamp - this.raceStartTime;
      const track = TRACKS_DB[this.selectedTrackId];

      // Update Human Players (1-4P) & AI Racers
      for (const v of this.vehicles) {
        if (!v.isAI) {
          const ctrl = this.getPlayerControls(v.playerIndex);
          this.updateHumanPhysics(v, ctrl, track);
        } else {
          this.updateAIPhysics(v, track);
        }
      }

      // Resolve OBB SAT Car-to-Car Collisions
      this.resolveAllCollisions();

      // Render 8-Layer Z-Depth Scene
      this.renderRaceScene();
    } else if (this.state === 'MENU') {
      // Draw subtle background preview on canvas behind glassmorphic menu
      const track = TRACKS_DB[this.selectedTrackId];
      const img = this.trackImages.get(track.id);
      if (img && img.complete && img.naturalWidth > 0) {
        this.ctx.drawImage(img, 0, 0, 1920, 1080);
      }
    }

    requestAnimationFrame((ts) => this.mainLoop(ts));
  }

  // --------------------------------------------------------------------------
  // KEYBOARD INPUT SYSTEM (P1: WASD, P2: ARROWS, P3: IJKL, P4: TFGH, ESC)
  // --------------------------------------------------------------------------
  bindInputEvents() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.state === 'RACING') this.togglePause(true);
        else if (this.state === 'PAUSED') this.togglePause(false);
        return;
      }
      if (e.code === 'Space' && this.state === 'EDITOR') {
        this.editor.spaceDown = true;
      }
      this.keys.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.editor.spaceDown = false;
        this.editor.isPanning = false;
      }
      this.keys.delete(e.code);
    });
  }

  getPlayerControls(playerIndex) {
    if (playerIndex === 0) {
      // In 1P mode, allow both WASD and Arrow keys for Player 1 convenience
      const single = this.numPlayers === 1;
      return {
        up:    this.keys.has('KeyW') || (single && this.keys.has('ArrowUp')),
        down:  this.keys.has('KeyS') || (single && this.keys.has('ArrowDown')),
        left:  this.keys.has('KeyA') || (single && this.keys.has('ArrowLeft')),
        right: this.keys.has('KeyD') || (single && this.keys.has('ArrowRight'))
      };
    }
    if (playerIndex === 1) {
      return {
        up:    this.keys.has('ArrowUp'),
        down:  this.keys.has('ArrowDown'),
        left:  this.keys.has('ArrowLeft'),
        right: this.keys.has('ArrowRight')
      };
    }
    if (playerIndex === 2) {
      return {
        up:    this.keys.has('KeyI'),
        down:  this.keys.has('KeyK'),
        left:  this.keys.has('KeyJ'),
        right: this.keys.has('KeyL')
      };
    }
    return {
      up:    this.keys.has('KeyT'),
      down:  this.keys.has('KeyG'),
      left:  this.keys.has('KeyF'),
      right: this.keys.has('KeyH')
    };
  }

  togglePause(pause) {
    if (pause && this.state === 'RACING') {
      this.state = 'PAUSED';
      this.pauseStartTimestamp = performance.now();
      this.audio.stopEngine();
      document.getElementById('pause-overlay').classList.remove('hidden');
    } else if (!pause && this.state === 'PAUSED') {
      const pausedDur = performance.now() - this.pauseStartTimestamp;
      this.raceStartTime += pausedDur;
      this.state = 'RACING';
      document.getElementById('pause-overlay').classList.add('hidden');
      this.audio.startEngine(this.vehicles[0].spec.category);
    }
  }

  // --------------------------------------------------------------------------
  // PRE-RACE MENU & 50-CAR GARAGE UI
  // --------------------------------------------------------------------------
  initMenuUI() {
    // Tab switching
    document.querySelectorAll('.menu-tabs .tab-btn[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.menu-tabs .tab-btn').forEach((b) => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });

    // Player Slot Tabs (P1-P4)
    document.querySelectorAll('#garage-player-tabs .p-slot-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#garage-player-tabs .p-slot-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedPlayerSlot = parseInt(btn.dataset.player, 10);
        this.refreshUI();
      });
    });

    // Garage Carousel Prev / Next
    document.getElementById('btn-prev-car').addEventListener('click', () => {
      const cfg = this.playerConfigs[this.selectedPlayerSlot];
      cfg.carId = (cfg.carId - 1 + CARS_DB.length) % CARS_DB.length;
      this.refreshUI();
    });
    document.getElementById('btn-next-car').addEventListener('click', () => {
      const cfg = this.playerConfigs[this.selectedPlayerSlot];
      cfg.carId = (cfg.carId + 1) % CARS_DB.length;
      this.refreshUI();
    });

    // Livery Swatches
    const swatchContainer = document.getElementById('livery-swatches');
    LIVERY_SWATCHES.forEach((hex) => {
      if (!hex) return;
      const div = document.createElement('div');
      div.className = 'color-swatch';
      div.style.background = hex;
      div.dataset.color = hex;
      div.addEventListener('click', () => {
        this.playerConfigs[this.selectedPlayerSlot].color = hex;
        document.getElementById('custom-paint-input').value = hex;
        this.refreshUI();
      });
      swatchContainer.appendChild(div);
    });

    document.getElementById('btn-reset-livery').addEventListener('click', () => {
      this.playerConfigs[this.selectedPlayerSlot].color = null;
      this.refreshUI();
    });

    document.getElementById('custom-paint-input').addEventListener('input', (e) => {
      this.playerConfigs[this.selectedPlayerSlot].color = e.target.value;
      this.refreshUI();
    });

    // 50-Car Modal
    document.getElementById('btn-open-50-modal').addEventListener('click', () => {
      this.render50CarModal('ALL');
      document.getElementById('modal-50-cars').classList.remove('hidden');
    });
    document.getElementById('btn-close-50-modal').addEventListener('click', () => {
      document.getElementById('modal-50-cars').classList.add('hidden');
    });

    // Opponent Mode Cards
    document.querySelectorAll('#opponent-mode-cards .select-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#opponent-mode-cards .select-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        this.opponentMode = card.dataset.opp;
        document.getElementById('multiclass-selector').classList.toggle('hidden', this.opponentMode !== 'multi_class');
        this.refreshUI();
      });
    });

    // Multi-Class Category Chips
    const mcContainer = document.getElementById('mc-category-chips');
    CATEGORIES.forEach((cat) => {
      const chip = document.createElement('button');
      chip.className = 'mc-chip' + (this.multiClassCategories.has(cat) ? ' active' : '');
      chip.textContent = cat;
      chip.addEventListener('click', () => {
        if (this.multiClassCategories.has(cat)) {
          if (this.multiClassCategories.size > 1) this.multiClassCategories.delete(cat);
        } else if (this.multiClassCategories.size < 3) {
          this.multiClassCategories.add(cat);
        }
        document.getElementById('mc-count').textContent = this.multiClassCategories.size;
        mcContainer.querySelectorAll('.mc-chip').forEach((c) => {
          c.classList.toggle('active', this.multiClassCategories.has(c.textContent));
        });
      });
      mcContainer.appendChild(chip);
    });

    // Lap Count Pills
    document.querySelectorAll('#lap-count-pills .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#lap-count-pills .pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.totalLaps = parseInt(btn.dataset.laps, 10);
        this.refreshUI();
      });
    });

    // Game Mode (1-4P) Cards
    document.querySelectorAll('#game-mode-cards .select-card').forEach((card) => {
      card.addEventListener('click', () => {
        document.querySelectorAll('#game-mode-cards .select-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        this.numPlayers = parseInt(card.dataset.players, 10);
        this.refreshUI();
      });
    });

    // Settings Controls
    const audioToggle = document.getElementById('toggle-audio');
    audioToggle.addEventListener('click', () => {
      this.audio.enabled = !this.audio.enabled;
      audioToggle.textContent = this.audio.enabled ? 'ENABLED' : 'MUTED';
      audioToggle.classList.toggle('active', this.audio.enabled);
      document.getElementById('btn-pause-audio').textContent = `🔊 AUDIO: ${this.audio.enabled ? 'ON' : 'OFF'}`;
    });

    document.querySelectorAll('#ai-diff-pills .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#ai-diff-pills .pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.aiDifficulty = parseFloat(btn.dataset.diff);
      });
    });

    document.querySelectorAll('#cam-zoom-pills .pill-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#cam-zoom-pills .pill-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.p1CameraZoom = parseFloat(btn.dataset.zoom);
      });
    });

    const debugToggle = document.getElementById('toggle-debug');
    debugToggle.addEventListener('click', () => {
      this.showDebug = !this.showDebug;
      debugToggle.textContent = this.showDebug ? 'ON' : 'OFF';
      debugToggle.classList.toggle('active', this.showDebug);
    });

    // Start Race & Pause / Finish Buttons
    document.getElementById('btn-start-race').addEventListener('click', () => this.startRace());
    document.getElementById('btn-hud-pause').addEventListener('click', () => this.togglePause(true));
    document.getElementById('btn-pause-resume').addEventListener('click', () => this.togglePause(false));
    document.getElementById('btn-pause-restart').addEventListener('click', () => this.startRace());
    document.getElementById('btn-pause-audio').addEventListener('click', () => audioToggle.click());
    document.getElementById('btn-pause-menu').addEventListener('click', () => this.returnToMenu());
    document.getElementById('btn-finish-restart').addEventListener('click', () => this.startRace());
    document.getElementById('btn-finish-menu').addEventListener('click', () => this.returnToMenu());

    this.renderTrackCards();
  }

  returnToMenu() {
    this.audio.stopEngine();
    this.state = 'MENU';
    document.getElementById('hud-overlay').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('finish-overlay').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    this.refreshUI();
  }

  refreshUI() {
    const cfg = this.playerConfigs[this.selectedPlayerSlot];
    const car = CARS_DB[cfg.carId];

    // Garage Preview Stage
    document.getElementById('garage-car-category').textContent = car.category;
    document.getElementById('garage-car-name').textContent = car.name;
    document.getElementById('garage-car-id').textContent = `CAR #${String(car.id + 1).padStart(2, '0')} / 50`;

    const prevCanvas = document.getElementById('garagePreviewCanvas');
    const pCtx = prevCanvas.getContext('2d');
    pCtx.clearRect(0, 0, prevCanvas.width, prevCanvas.height);

    const sprite = this.carRenderer.getCarSprite(car, cfg.color);
    const drawW = car.width * 5.2;
    const drawH = car.height * 5.2;
    pCtx.drawImage(sprite, (prevCanvas.width - drawW) / 2, (prevCanvas.height - drawH) / 2, drawW, drawH);

    // Performance Telemetry Bars
    document.getElementById('stat-val-speed').textContent = `${car.realTopKmh} KM/H`;
    document.getElementById('stat-fill-speed').style.width = `${((car.realTopKmh - 220) / 290) * 100}%`;

    const accelScore = ((car.acceleration - 0.038) / 0.026 * 10).toFixed(1);
    document.getElementById('stat-val-accel').textContent = accelScore;
    document.getElementById('stat-fill-accel').style.width = `${Math.min(100, accelScore * 10)}%`;

    const gripPct = Math.round(car.lateralGrip * 100);
    document.getElementById('stat-val-grip').textContent = `${gripPct}%`;
    document.getElementById('stat-fill-grip').style.width = `${((car.lateralGrip - 0.75) / 0.22) * 100}%`;

    const turnScore = ((car.turnSpeed - 0.040) / 0.024 * 10).toFixed(1);
    document.getElementById('stat-val-turn').textContent = turnScore;
    document.getElementById('stat-fill-turn').style.width = `${Math.min(100, turnScore * 10)}%`;

    document.querySelectorAll('#livery-swatches .color-swatch').forEach((s) => {
      s.classList.toggle('active', s.dataset.color === cfg.color);
    });

    // Live Summary Strip
    const p1Car = CARS_DB[this.playerConfigs[0].carId];
    const oppLabels = {
      same_car: 'Same Car Spec',
      same_class: 'Same Class',
      multi_class: 'Multi-Class (3 Div)',
      ffa: 'Free-For-All'
    };
    const track = TRACKS_DB[this.selectedTrackId] || TRACKS_DB.classic;
    document.getElementById('sum-car').textContent = p1Car.name;
    document.getElementById('sum-opp').textContent = oppLabels[this.opponentMode];
    document.getElementById('sum-track').textContent = `${track.name} (${this.totalLaps} Laps)`;
    document.getElementById('sum-mode').textContent = this.numPlayers === 1 ? '1P vs 15 AI' : `${this.numPlayers}P Local`;
  }

  renderTrackCards() {
    const container = document.getElementById('tracks-grid-container');
    if (!container) return;
    container.innerHTML = '';

    Object.values(TRACKS_DB).forEach((track) => {
      const card = document.createElement('div');
      card.className = 'track-card' + (track.id === this.selectedTrackId ? ' active' : '');

      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'track-thumb-wrap';
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 384;
      thumbCanvas.height = 216;
      thumbWrap.appendChild(thumbCanvas);

      const tCtx = thumbCanvas.getContext('2d');
      const img = this.trackImages.get(track.id);
      if (img && img.complete && img.naturalWidth > 0) {
        tCtx.drawImage(img, 0, 0, 384, 216);
      } else {
        tCtx.fillStyle = '#0c1624';
        tCtx.fillRect(0, 0, 384, 216);
      }

      // Draw racing spline overlay on thumbnail
      if (track.waypoints.length > 1) {
        tCtx.strokeStyle = '#00f0ff';
        tCtx.lineWidth = 2;
        tCtx.beginPath();
        track.waypoints.forEach((wp, idx) => {
          const tx = wp.x * 0.2;
          const ty = wp.y * 0.2;
          if (idx === 0) tCtx.moveTo(tx, ty);
          else tCtx.lineTo(tx, ty);
        });
        tCtx.closePath();
        tCtx.stroke();
      }

      const info = document.createElement('div');
      info.className = 'track-card-info';
      info.innerHTML = `
        <h4>${track.name}</h4>
        <span class="track-wp-badge">${track.waypoints.length} WP</span>
      `;

      card.appendChild(thumbWrap);
      card.appendChild(info);
      card.addEventListener('click', () => {
        this.selectedTrackId = track.id;
        this.renderTrackCards();
        this.refreshUI();
      });
      container.appendChild(card);
    });
  }

  render50CarModal(filterCategory = 'ALL') {
    const filterBar = document.getElementById('modal-cat-filters');
    filterBar.innerHTML = '';

    const allCats = ['ALL', ...CATEGORIES];
    allCats.forEach((cat) => {
      const btn = document.createElement('button');
      btn.className = 'cat-filter-btn' + (cat === filterCategory ? ' active' : '');
      btn.textContent = cat;
      btn.addEventListener('click', () => this.render50CarModal(cat));
      filterBar.appendChild(btn);
    });

    const grid = document.getElementById('cars-50-grid-container');
    grid.innerHTML = '';

    const activeCarId = this.playerConfigs[this.selectedPlayerSlot].carId;
    const activeColor = this.playerConfigs[this.selectedPlayerSlot].color;

    CARS_DB.filter((c) => filterCategory === 'ALL' || c.category === filterCategory).forEach((car) => {
      const item = document.createElement('div');
      item.className = 'car-grid-item' + (car.id === activeCarId ? ' active' : '');

      const cCanvas = document.createElement('canvas');
      cCanvas.width = 160;
      cCanvas.height = 76;
      const cCtx = cCanvas.getContext('2d');
      const sprite = this.carRenderer.getCarSprite(car, car.id === activeCarId ? activeColor : null);
      const dw = car.width * 2.6;
      const dh = car.height * 2.6;
      cCtx.drawImage(sprite, (160 - dw) / 2, (76 - dh) / 2, dw, dh);

      const meta = document.createElement('div');
      meta.style.width = '100%';
      meta.innerHTML = `
        <div class="mini-cat">#${String(car.id + 1).padStart(2, '0')} • ${car.category}</div>
        <h5>${car.name}</h5>
        <div class="mini-specs">
          <span>TOP: ${car.realTopKmh} KM/H</span>
          <span>GRIP: ${Math.round(car.lateralGrip * 100)}%</span>
        </div>
      `;

      item.appendChild(cCanvas);
      item.appendChild(meta);
      item.addEventListener('click', () => {
        this.playerConfigs[this.selectedPlayerSlot].carId = car.id;
        this.refreshUI();
        document.getElementById('modal-50-cars').classList.add('hidden');
      });
      grid.appendChild(item);
    });
  }

  // --------------------------------------------------------------------------
  // 9. IN-GAME 1920x1080 PRO TRACK EDITOR & CATMULL-ROM SPLINE SMOOTHER
  // --------------------------------------------------------------------------
  initEditorUI() {
    const ed = this.editor;

    document.getElementById('btn-open-editor').addEventListener('click', () => {
      this.state = 'EDITOR';
      const base = TRACKS_DB[this.selectedTrackId] || TRACKS_DB.classic;
      ed.baseTrackId = base.id === 'custom_live' ? 'classic' : base.id;
      ed.waypoints = structuredClone(base.waypoints);
      ed.startPos = structuredClone(base.startPos);
      ed.startLine = {
        x: base.startLine.x,
        y: base.startLine.y ?? ((base.startLine.yMin + base.startLine.yMax) * 0.5),
        angle: base.startLine.angle ?? Math.PI / 2,
        width: base.startLine.width ?? 100
      };
      ed.undoStack = [];
      ed.redoStack = [];
      document.getElementById('modal-track-editor').classList.remove('hidden');
      this.syncEditorSliders();
      this.updateEditorTelemetry();
      this.renderEditor();
    });

    document.getElementById('ed-btn-close').addEventListener('click', () => {
      document.getElementById('modal-track-editor').classList.add('hidden');
      this.state = 'MENU';
    });

    // Tool selector buttons
    document.querySelectorAll('#editor-tool-buttons .ed-tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#editor-tool-buttons .ed-tool-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        ed.tool = btn.dataset.tool;
      });
    });

    // Base track selector
    document.getElementById('ed-track-base-select').addEventListener('change', (e) => {
      ed.baseTrackId = e.target.value;
      this.renderEditor();
      this.updateEditorTelemetry();
    });

    document.getElementById('ed-chk-grid').addEventListener('change', (e) => {
      ed.showGrid = e.target.checked;
      this.renderEditor();
    });

    document.getElementById('ed-chk-slots').addEventListener('change', (e) => {
      ed.showSlots = e.target.checked;
      this.renderEditor();
    });

    // Sliders for Start Heading, Start Line Angle, and Start Line Width
    document.getElementById('ed-slider-start-angle').addEventListener('input', (e) => {
      const deg = parseFloat(e.target.value);
      document.getElementById('ed-val-start-angle').textContent = `${deg}°`;
      ed.startPos.angle = (deg * Math.PI) / 180;
      this.updateEditorTelemetry();
      this.renderEditor();
    });

    document.getElementById('ed-slider-line-angle').addEventListener('input', (e) => {
      const deg = parseFloat(e.target.value);
      document.getElementById('ed-val-line-angle').textContent = `${deg}°`;
      ed.startLine.angle = (deg * Math.PI) / 180;
      this.updateEditorTelemetry();
      this.renderEditor();
    });

    document.getElementById('ed-slider-line-width').addEventListener('input', (e) => {
      const w = parseFloat(e.target.value);
      document.getElementById('ed-val-line-width').textContent = `${w}px`;
      ed.startLine.width = w;
      this.updateEditorTelemetry();
      this.renderEditor();
    });

    // Catmull-Rom Auto-Smooth
    document.getElementById('ed-btn-smooth').addEventListener('click', () => {
      if (ed.waypoints.length < 4) return;
      this.pushEditorHistory();
      ed.waypoints = this.catmullRomSubdivide(ed.waypoints, 3);
      this.updateEditorTelemetry();
      this.renderEditor();
    });

    // Reverse Direction (CW / CCW)
    document.getElementById('ed-btn-reverse').addEventListener('click', () => {
      this.pushEditorHistory();
      ed.waypoints.reverse();
      ed.startPos.angle = this.normalizeAngle(ed.startPos.angle + Math.PI);
      this.syncEditorSliders();
      this.updateEditorTelemetry();
      this.renderEditor();
    });

    // Undo / Redo / Clear
    document.getElementById('ed-btn-undo').addEventListener('click', () => {
      if (ed.undoStack.length === 0) return;
      ed.redoStack.push(this.snapshotEditorState());
      this.restoreEditorState(ed.undoStack.pop());
    });

    document.getElementById('ed-btn-redo').addEventListener('click', () => {
      if (ed.redoStack.length === 0) return;
      ed.undoStack.push(this.snapshotEditorState());
      this.restoreEditorState(ed.redoStack.pop());
    });

    document.getElementById('ed-btn-clear').addEventListener('click', () => {
      this.pushEditorHistory();
      ed.waypoints = [];
      this.updateEditorTelemetry();
      this.renderEditor();
    });

    document.getElementById('ed-btn-reset-view').addEventListener('click', () => {
      ed.zoom = 1.0;
      ed.panX = 0;
      ed.panY = 0;
      this.renderEditor();
    });

    // Export / Download / Import
    document.getElementById('ed-btn-copy').addEventListener('click', () => {
      const code = document.getElementById('ed-code-output').value;
      navigator.clipboard?.writeText(code);
    });

    document.getElementById('ed-btn-download').addEventListener('click', () => {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(document.getElementById('ed-code-output').value);
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', 'custom_track.json');
      a.click();
    });

    document.getElementById('ed-file-import').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          if (Array.isArray(parsed.waypoints)) {
            this.pushEditorHistory();
            ed.waypoints = parsed.waypoints;
            if (parsed.startPos) ed.startPos = parsed.startPos;
            if (parsed.startLine) {
              ed.startLine = {
                x: parsed.startLine.x,
                y: parsed.startLine.y ?? ((parsed.startLine.yMin + parsed.startLine.yMax) * 0.5),
                angle: parsed.startLine.angle ?? Math.PI / 2,
                width: parsed.startLine.width ?? 100
              };
            }
            this.syncEditorSliders();
            this.updateEditorTelemetry();
            this.renderEditor();
          }
        } catch (_) {}
      };
      reader.readAsText(file);
    });

    // TEST TRACK LIVE button
    document.getElementById('ed-btn-test').addEventListener('click', () => {
      if (ed.waypoints.length < 3) return;
      const baseTrack = TRACKS_DB[ed.baseTrackId] || TRACKS_DB.classic;
      const customTrack = {
        id: 'custom_live',
        name: `${baseTrack.name} (Custom Live)`,
        src: baseTrack.src,
        fallbackSrc: baseTrack.fallbackSrc,
        startPos: structuredClone(ed.startPos),
        startLine: {
          x: ed.startLine.x,
          y: ed.startLine.y,
          yMin: ed.startLine.y - ed.startLine.width * 0.5,
          yMax: ed.startLine.y + ed.startLine.width * 0.5,
          angle: ed.startLine.angle,
          width: ed.startLine.width
        },
        waypoints: structuredClone(ed.waypoints)
      };
      this.trackImages.set('custom_live', this.trackImages.get(baseTrack.id));
      this.startRace(customTrack);
    });

    // Canvas Mouse Wheel Zoom, Spacebar Pan & Tool Interaction
    ed.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      ed.zoom = Math.max(0.5, Math.min(4.0, ed.zoom * factor));
      this.renderEditor();
    }, { passive: false });

    ed.canvas.addEventListener('mousedown', (e) => {
      const pt = this.getEditorWorldCoords(e);
      if (ed.spaceDown || e.button === 1) {
        ed.isPanning = true;
        ed.panStartX = e.clientX - ed.panX;
        ed.panStartY = e.clientY - ed.panY;
        return;
      }

      if (ed.tool === 'add') {
        this.pushEditorHistory();
        ed.waypoints.push({ x: Math.round(pt.x), y: Math.round(pt.y) });
        this.updateEditorTelemetry();
        this.renderEditor();
      } else if (ed.tool === 'move') {
        const idx = this.findNearestWaypoint(pt.x, pt.y, 24);
        if (idx !== -1) {
          this.pushEditorHistory();
          ed.dragTarget = { type: 'wp', index: idx };
        }
      } else if (ed.tool === 'delete') {
        const idx = this.findNearestWaypoint(pt.x, pt.y, 24);
        if (idx !== -1) {
          this.pushEditorHistory();
          ed.waypoints.splice(idx, 1);
          this.updateEditorTelemetry();
          this.renderEditor();
        }
      } else if (ed.tool === 'insert') {
        const segIdx = this.findNearestSegmentIndex(pt.x, pt.y);
        if (segIdx !== -1) {
          this.pushEditorHistory();
          ed.waypoints.splice(segIdx + 1, 0, { x: Math.round(pt.x), y: Math.round(pt.y) });
          this.updateEditorTelemetry();
          this.renderEditor();
        }
      } else if (ed.tool === 'startPos') {
        this.pushEditorHistory();
        ed.startPos.x = Math.round(pt.x);
        ed.startPos.y = Math.round(pt.y);
        ed.dragTarget = { type: 'startPos' };
        this.updateEditorTelemetry();
        this.renderEditor();
      } else if (ed.tool === 'startLine') {
        this.pushEditorHistory();
        ed.startLine.x = Math.round(pt.x);
        ed.startLine.y = Math.round(pt.y);
        ed.dragTarget = { type: 'startLine' };
        this.updateEditorTelemetry();
        this.renderEditor();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (this.state !== 'EDITOR') return;
      const pt = this.getEditorWorldCoords(e);
      ed.cursorX = Math.max(0, Math.min(1920, Math.round(pt.x)));
      ed.cursorY = Math.max(0, Math.min(1080, Math.round(pt.y)));
      document.getElementById('ed-stat-cursor').textContent = `${ed.cursorX}, ${ed.cursorY}`;

      if (ed.isPanning) {
        ed.panX = e.clientX - ed.panStartX;
        ed.panY = e.clientY - ed.panStartY;
        this.renderEditor();
        return;
      }

      if (ed.dragTarget) {
        if (ed.dragTarget.type === 'wp') {
          ed.waypoints[ed.dragTarget.index] = { x: ed.cursorX, y: ed.cursorY };
        } else if (ed.dragTarget.type === 'startPos') {
          ed.startPos.x = ed.cursorX;
          ed.startPos.y = ed.cursorY;
        } else if (ed.dragTarget.type === 'startLine') {
          ed.startLine.x = ed.cursorX;
          ed.startLine.y = ed.cursorY;
        }
        this.updateEditorTelemetry();
        this.renderEditor();
      } else {
        const prevHover = ed.hoverIdx;
        ed.hoverIdx = this.findNearestWaypoint(pt.x, pt.y, 24);
        if (prevHover !== ed.hoverIdx) this.renderEditor();
      }
    });

    window.addEventListener('mouseup', () => {
      ed.isPanning = false;
      ed.dragTarget = null;
    });
  }

  getEditorWorldCoords(e) {
    const ed = this.editor;
    const rect = ed.canvas.getBoundingClientRect();
    const canvasX = ((e.clientX - rect.left) / rect.width) * 1920;
    const canvasY = ((e.clientY - rect.top) / rect.height) * 1080;

    const worldX = (canvasX - 960 - ed.panX) / ed.zoom + 960;
    const worldY = (canvasY - 540 - ed.panY) / ed.zoom + 540;
    return { x: worldX, y: worldY };
  }

  findNearestWaypoint(x, y, maxRadius = 24) {
    let bestIdx = -1;
    let bestDist = maxRadius;
    this.editor.waypoints.forEach((wp, i) => {
      const d = Math.hypot(wp.x - x, wp.y - y);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    return bestIdx;
  }

  findNearestSegmentIndex(x, y) {
    const wps = this.editor.waypoints;
    if (wps.length < 2) return -1;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < wps.length; i++) {
      const a = wps[i];
      const b = wps[(i + 1) % wps.length];
      const mx = (a.x + b.x) * 0.5;
      const my = (a.y + b.y) * 0.5;
      const d = Math.hypot(mx - x, my - y);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  /**
   * Catmull-Rom Spline Auto-Smoothing Algorithm
   * Subdivides coarse waypoints into smooth, flowing motorsport racing lines.
   */
  catmullRomSubdivide(points, subdivisions = 3) {
    const n = points.length;
    if (n < 4) return points;
    const result = [];

    for (let i = 0; i < n; i++) {
      const p0 = points[(i - 1 + n) % n];
      const p1 = points[i];
      const p2 = points[(i + 1) % n];
      const p3 = points[(i + 2) % n];

      for (let s = 0; s < subdivisions; s++) {
        const t = s / subdivisions;
        const t2 = t * t;
        const t3 = t2 * t;

        const x = 0.5 * (
          (2 * p1.x) +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
        );
        const y = 0.5 * (
          (2 * p1.y) +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
        );

        result.push({ x: Math.round(x), y: Math.round(y) });
      }
    }
    return result;
  }

  pushEditorHistory() {
    this.editor.undoStack.push(this.snapshotEditorState());
    if (this.editor.undoStack.length > 40) this.editor.undoStack.shift();
    this.editor.redoStack = [];
  }

  snapshotEditorState() {
    return JSON.stringify({
      waypoints: this.editor.waypoints,
      startPos: this.editor.startPos,
      startLine: this.editor.startLine
    });
  }

  restoreEditorState(json) {
    const state = JSON.parse(json);
    this.editor.waypoints = state.waypoints;
    this.editor.startPos = state.startPos;
    this.editor.startLine = state.startLine;
    this.syncEditorSliders();
    this.updateEditorTelemetry();
    this.renderEditor();
  }

  syncEditorSliders() {
    const ed = this.editor;
    const startDeg = Math.round((ed.startPos.angle * 180) / Math.PI);
    const lineDeg = Math.round((ed.startLine.angle * 180) / Math.PI);
    document.getElementById('ed-slider-start-angle').value = startDeg;
    document.getElementById('ed-val-start-angle').textContent = `${startDeg}°`;
    document.getElementById('ed-slider-line-angle').value = lineDeg;
    document.getElementById('ed-val-line-angle').textContent = `${lineDeg}°`;
    document.getElementById('ed-slider-line-width').value = ed.startLine.width;
    document.getElementById('ed-val-line-width').textContent = `${ed.startLine.width}px`;
  }

  updateEditorTelemetry() {
    const ed = this.editor;
    const wps = ed.waypoints;
    let totalLen = 0;
    for (let i = 0; i < wps.length; i++) {
      const a = wps[i];
      const b = wps[(i + 1) % wps.length];
      totalLen += Math.hypot(b.x - a.x, b.y - a.y);
    }

    const midIdx = Math.floor(wps.length * 0.5);
    document.getElementById('ed-stat-wp').textContent = wps.length;
    document.getElementById('ed-stat-mid').textContent = midIdx;
    document.getElementById('ed-stat-len').textContent = `${Math.round(totalLen)} px`;

    const exportObj = {
      id: `custom_${ed.baseTrackId}`,
      name: `${TRACKS_DB[ed.baseTrackId]?.name || 'Grand Prix'} Custom`,
      src: TRACKS_DB[ed.baseTrackId]?.src || 'tracks/classic.jpg',
      startPos: {
        x: Math.round(ed.startPos.x),
        y: Math.round(ed.startPos.y),
        angle: Number(ed.startPos.angle.toFixed(4))
      },
      startLine: {
        x: Math.round(ed.startLine.x),
        yMin: Math.round(ed.startLine.y - ed.startLine.width * 0.5),
        yMax: Math.round(ed.startLine.y + ed.startLine.width * 0.5)
      },
      waypoints: wps
    };

    document.getElementById('ed-code-output').value = JSON.stringify(exportObj, null, 2);
  }

  renderEditor() {
    const ed = this.editor;
    const ctx = ed.ctx;
    ctx.save();
    ctx.clearRect(0, 0, 1920, 1080);

    // Apply Pan & Zoom transform
    ctx.translate(960 + ed.panX, 540 + ed.panY);
    ctx.scale(ed.zoom, ed.zoom);
    ctx.translate(-960, -540);

    // Draw base track image
    const img = this.trackImages.get(ed.baseTrackId);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, 1920, 1080);
    } else {
      ctx.fillStyle = '#0a1220';
      ctx.fillRect(0, 0, 1920, 1080);
    }

    // Optional 1920x1080 Grid Lines
    if (ed.showGrid) {
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.14)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= 1920; x += 120) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1080); ctx.stroke();
      }
      for (let y = 0; y <= 1080; y += 120) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1920, y); ctx.stroke();
      }
    }

    // Optional 16-Car Staggered Starting Grid Preview Boxes
    if (ed.showSlots) {
      const ang = ed.startPos.angle;
      const fwd = { x: Math.cos(ang), y: Math.sin(ang) };
      const rgt = { x: -Math.sin(ang), y: Math.cos(ang) };

      for (let slot = 0; slot < 16; slot++) {
        const row = Math.floor(slot / 2);
        const col = slot % 2;
        const backDist = 36 + row * 52 + (col === 1 ? 18 : 0);
        const latOffset = (col === 0 ? -1 : 1) * 18;
        const gx = ed.startPos.x - fwd.x * backDist + rgt.x * latOffset;
        const gy = ed.startPos.y - fwd.y * backDist + rgt.y * latOffset;

        ctx.save();
        ctx.translate(gx, gy);
        ctx.rotate(ang);
        ctx.strokeStyle = slot === 0 ? '#00f0ff' : 'rgba(255, 204, 0, 0.65)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-22, -10, 44, 20);
        ctx.restore();
      }
    }

    // Draw Start/Finish Sensor Line
    ctx.save();
    ctx.translate(ed.startLine.x, ed.startLine.y);
    ctx.rotate(ed.startLine.angle);
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, -ed.startLine.width * 0.5);
    ctx.lineTo(0, ed.startLine.width * 0.5);
    ctx.stroke();
    ctx.restore();

    // Draw Start Position Anchor & Heading Arrow
    ctx.save();
    ctx.translate(ed.startPos.x, ed.startPos.y);
    ctx.rotate(ed.startPos.angle);
    ctx.fillStyle = '#00ff66';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(38, 0);
    ctx.stroke();
    ctx.restore();

    // Draw Waypoint Loop & Direction Arrows
    const wps = ed.waypoints;
    if (wps.length > 0) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      wps.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      if (wps.length > 2) ctx.closePath();
      ctx.stroke();

      const midIdx = Math.floor(wps.length * 0.5);
      wps.forEach((p, i) => {
        const isHovered = i === ed.hoverIdx;
        const isMid = i === midIdx;
        ctx.fillStyle = i === 0 ? '#00ff66' : isMid ? '#ff0055' : isHovered ? '#ffffff' : '#ffcc00';
        ctx.beginPath();
        ctx.arc(p.x, p.y, isHovered ? 9 : 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 11px Orbitron, sans-serif';
        ctx.fillText(String(i), p.x + 8, p.y - 6);
      });
    }

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // UTILITIES
  // --------------------------------------------------------------------------
  normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
  }

  formatTime(ms) {
    const totalSec = Math.max(0, ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new DreamCarsEngine();
});

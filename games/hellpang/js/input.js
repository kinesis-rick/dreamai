/* Hellpang - Keyboard Input Controller for 1P/2P Local Play & UI Navigation */

class InputHandler {
  constructor() {
    this.keys = {};
    this.twoPlayerMode = false;

    // Keybindings configuration
    this.bindings = {
      p1: { left: 'KeyA', right: 'KeyD', shoot: 'KeyW', super: 'KeyS' },
      p2: { left: 'ArrowLeft', right: 'ArrowRight', shoot: 'ArrowUp', super: 'ArrowDown' },
      system: { pause: 'KeyP', toggle2P: 'Digit2', select1: 'Digit1', select2: 'Digit2', select3: 'Digit3' }
    };

    // State tracking to prevent key-repeat triggers
    this.justPressed = {};

    // 666 Easter Egg Sequence Tracking
    this.keyBuffer = '';
    this.easterEggTriggered = false;

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    // Initialize AudioContext on first user keypress
    if (typeof audioManager !== 'undefined') {
      audioManager.init();
    }

    // Global 'M' Mute / Unmute Keybinding
    if ((e.code === 'KeyM' || e.key === 'm' || e.key === 'M') && !e.repeat) {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (activeTag !== 'INPUT' && activeTag !== 'TEXTAREA') {
        if (typeof audioManager !== 'undefined' && typeof audioManager.toggleMute === 'function') {
          audioManager.toggleMute();
        }
      }
    }

    if (!this.keys[e.code]) {
      this.justPressed[e.code] = true;
    }
    this.keys[e.code] = true;

    // Record typed key sequence for easter eggs (666, 101, 5162)
    let char = e.key;
    if (e.code === 'Digit0' || e.code === 'Numpad0') char = '0';
    if (e.code === 'Digit1' || e.code === 'Numpad1') char = '1';
    if (e.code === 'Digit2' || e.code === 'Numpad2') char = '2';
    if (e.code === 'Digit5' || e.code === 'Numpad5') char = '5';
    if (e.code === 'Digit6' || e.code === 'Numpad6') char = '6';

    if (char && char.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      this.keyBuffer += char;
      if (this.keyBuffer.length > 8) {
        this.keyBuffer = this.keyBuffer.slice(-8);
      }
    }
  }

  check666EasterEgg() {
    if (!this.easterEggTriggered && this.keyBuffer.endsWith('666')) {
      this.easterEggTriggered = true;
      return true;
    }
    return false;
  }

  check101EasterEgg() {
    if (this.keyBuffer.endsWith('101')) {
      this.keyBuffer = '';
      return true;
    }
    return false;
  }

  check5162EasterEgg() {
    if (this.keyBuffer.endsWith('5162')) {
      this.keyBuffer = '';
      return true;
    }
    return false;
  }

  onKeyUp(e) {
    this.keys[e.code] = false;
    this.justPressed[e.code] = false;
  }

  isDown(code) {
    return !!this.keys[code];
  }

  wasJustPressed(code) {
    if (this.justPressed[code]) {
      this.justPressed[code] = false; // consume press
      return true;
    }
    return false;
  }

  // Helper getters for Player 1
  getP1Movement() {
    let dir = 0;
    if (this.isDown(this.bindings.p1.left)) dir -= 1;
    if (this.isDown(this.bindings.p1.right)) dir += 1;
    return dir;
  }

  isP1Shooting() {
    return this.wasJustPressed(this.bindings.p1.shoot);
  }

  isP1Super() {
    return this.wasJustPressed(this.bindings.p1.super);
  }

  // Helper getters for Player 2
  getP2Movement() {
    if (!this.twoPlayerMode) return 0;
    let dir = 0;
    if (this.isDown(this.bindings.p2.left)) dir -= 1;
    if (this.isDown(this.bindings.p2.right)) dir += 1;
    return dir;
  }

  isP2Shooting() {
    if (!this.twoPlayerMode) return false;
    return this.wasJustPressed(this.bindings.p2.shoot);
  }

  isP2Super() {
    if (!this.twoPlayerMode) return false;
    return this.wasJustPressed(this.bindings.p2.super);
  }

  isPausePressed() {
    return this.wasJustPressed('Escape') || this.wasJustPressed('KeyP');
  }
}

const input = new InputHandler();


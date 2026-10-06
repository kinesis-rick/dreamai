// Unified Keyboard & HTML5 Gamepad API Input Merger
class InputSystem {
  constructor() {
    this.coopEnabled = false;

    // Keys state tracking
    this.keys = {};

    // P1 Vector
    this.p1 = { x: 0, y: 0, action: false, actionJustPressed: false };
    // P2 Vector
    this.p2 = { x: 0, y: 0, action: false, actionJustPressed: false };

    this.prevActionP1 = false;
    this.prevActionP2 = false;

    this.bindKeyboard();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  update() {
    // Player 1 Keyboard: W, A, S, D & E / Space
    let p1x = 0;
    let p1y = 0;
    if (this.keys['KeyW']) p1y -= 1;
    if (this.keys['KeyS']) p1y += 1;
    if (this.keys['KeyA']) p1x -= 1;
    if (this.keys['KeyD']) p1x += 1;

    const p1ActionHold = !!(this.keys['KeyE'] || this.keys['Space']);

    // Player 2 Keyboard: Arrow Keys & Numpad0 / Enter / ShiftRight
    let p2x = 0;
    let p2y = 0;
    if (this.keys['ArrowUp']) p2y -= 1;
    if (this.keys['ArrowDown']) p2y += 1;
    if (this.keys['ArrowLeft']) p2x -= 1;
    if (this.keys['ArrowRight']) p2x += 1;

    const p2ActionHold = !!(this.keys['Numpad0'] || this.keys['Enter'] || this.keys['ShiftRight']);

    // Poll Gamepads (HTML5 Gamepad API)
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let gp0 = gamepads[0];
    let gp1 = gamepads[1];

    if (gp0 && gp0.connected) {
      const deadzone = 0.2;
      const ax0 = gp0.axes[0] || 0;
      const ax1 = gp0.axes[1] || 0;
      if (Math.abs(ax0) > deadzone) p1x = ax0;
      if (Math.abs(ax1) > deadzone) p1y = ax1;

      // D-Pad buttons
      if (gp0.buttons[14] && gp0.buttons[14].pressed) p1x = -1;
      if (gp0.buttons[15] && gp0.buttons[15].pressed) p1x = 1;
      if (gp0.buttons[12] && gp0.buttons[12].pressed) p1y = -1;
      if (gp0.buttons[13] && gp0.buttons[13].pressed) p1y = 1;

      // Button A (0) or Cross (0) or Right Trigger
      if (gp0.buttons[0] && gp0.buttons[0].pressed) {
        p1ActionHold = true;
      }
    }

    if (gp1 && gp1.connected && this.coopEnabled) {
      const deadzone = 0.2;
      const ax0 = gp1.axes[0] || 0;
      const ax1 = gp1.axes[1] || 0;
      if (Math.abs(ax0) > deadzone) p2x = ax0;
      if (Math.abs(ax1) > deadzone) p2y = ax1;

      if (gp1.buttons[0] && gp1.buttons[0].pressed) {
        p2ActionHold = true;
      }
    }

    // Normalize diagonal vectors
    const len1 = Math.hypot(p1x, p1y);
    if (len1 > 1) {
      p1x /= len1;
      p1y /= len1;
    }

    const len2 = Math.hypot(p2x, p2y);
    if (len2 > 1) {
      p2x /= len2;
      p2y /= len2;
    }

    this.p1.x = p1x;
    this.p1.y = p1y;
    this.p1.action = p1ActionHold;
    this.p1.actionJustPressed = p1ActionHold && !this.prevActionP1;
    this.prevActionP1 = p1ActionHold;

    this.p2.x = p2x;
    this.p2.y = p2y;
    this.p2.action = p2ActionHold;
    this.p2.actionJustPressed = p2ActionHold && !this.prevActionP2;
    this.prevActionP2 = p2ActionHold;
  }
}

window.inputSystem = new InputSystem();

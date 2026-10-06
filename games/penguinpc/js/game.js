// Main Phaser 3 Scene & Engine Setup
class MainGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainGameScene' });
  }

  preload() {
    // Load Room Backgrounds
    this.load.image('garage_bg', 'garage.jpeg');
    this.load.image('warehouse1_bg', 'warehouse-tier1.jpeg');
    this.load.image('warehouse2_bg', 'warehouse-tier2.jpeg');

    // Load Sprite Atlases
    this.load.spritesheet('spritesheet', 'PC Building Empire - Sprite Sheet (512x256).png', {
      frameWidth: 64,
      frameHeight: 64
    });

    this.load.spritesheet('penguin_anim', 'PC Building Empire - Penguin Animations Sprite Sheet (512x512).png', {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  create() {
    window.gameScene = this;

    // Viewport Center Origin for 2:1 Isometric Projection
    this.isoOriginX = this.cameras.main.width / 2;
    this.isoOriginY = this.cameras.main.height / 2 - 80;

    // Background Container
    this.bgContainer = this.add.container(this.cameras.main.width / 2, this.cameras.main.height / 2);
    this.bgSprite = this.add.image(0, 0, 'garage_bg');
    this.bgSprite.setDisplaySize(1280, 720);
    this.bgContainer.add(this.bgSprite);
    this.bgContainer.setDepth(-1000);

    // Entity Lists
    this.desks = [];
    this.helpdesks = [];
    this.penguins = [];
    this.boxedPCItemsCount = 0; // Count of boxes on dispatch pad

    // Display & Label Granular Settings
    this.labelSettings = {
      staffRoles: true,
      deskLabels: true,
      activityAlerts: true,
      moneyNotifications: true,
      progressBars: true,
      idleLabels: true
    };

    // Initialize Facilities & Stations
    this.setupRoomLayout();

    // Spawn Player 1 (Tux)
    this.p1 = new Penguin('p1', 'p1', 4, 4, this);
    this.penguins.push(this.p1);

    // Spawn Delivery Van Logistics
    this.deliveryVan = new DeliveryVan(this);

    // Dynamic AI Penguin Sync Interval
    this.time.addEvent({
      delay: 1000,
      callback: this.syncAIPenguins,
      callbackScope: this,
      loop: true
    });

    // Auto-load Browser Save Data if present & Start Auto-Save Loop
    if (window.saveSystem) {
      if (window.saveSystem.hasLocalStorageSave()) {
        window.saveSystem.loadFromLocalStorage();
      }
      window.saveSystem.startAutoSave(10000);
    }

    if (window.uiSystem) {
      window.uiSystem.showTutorialIfNeeded();
    }
  }

  gridToIso(gx, gy) {
    // 2:1 Dimetric projection (64x32 tile dimensions)
    const tileW = 64;
    const tileH = 32;
    const isoX = this.isoOriginX + (gx - gy) * (tileW / 2);
    const isoY = this.isoOriginY + (gx + gy) * (tileH / 2);
    return { x: isoX, y: isoY };
  }

  screenToIsoVelocity(moveX, moveY) {
    // Converts screen direction inputs into isometric screen movement
    const isoX = (moveX - moveY) * 0.707;
    const isoY = (moveX + moveY) * 0.5;
    return { x: isoX, y: isoY };
  }

  setupRoomLayout() {
    // Admin Terminal Station at top back wall edge (gx: 4.5, gy: 0.5)
    const adminPos = this.gridToIso(4.5, 0.5);
    this.adminStationContainer = this.add.container(adminPos.x, adminPos.y);
    this.adminStationContainer.setDepth(adminPos.y + 16);
    this.adminSprite = this.add.sprite(0, 0, 'spritesheet', 13); // Frame 13 = Admin Terminal [5,1]
    this.adminSprite.setOrigin(0.5, 0.75);
    this.adminText = this.add.text(0, -60, 'ADMIN TERMINAL', {
      fontFamily: 'Press Start 2P',
      fontSize: '7px',
      color: '#288cf0',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    this.adminStationContainer.add(this.adminSprite);
    this.adminStationContainer.add(this.adminText);

    // Parts Store Station at top-left back wall edge (gx: 0.3, gy: 0.5)
    const partsPos = this.gridToIso(0.3, 0.5);
    this.partsStorePos = partsPos;
    this.partsStoreContainer = this.add.container(partsPos.x, partsPos.y);
    this.partsStoreContainer.setDepth(partsPos.y + 16);
    this.partsSprite = this.add.sprite(0, 0, 'spritesheet', 15); // Frame 15 = Parts Rack / Counter
    this.partsSprite.setOrigin(0.5, 0.75);
    this.partsText = this.add.text(0, -60, 'PARTS STORE\n[$1,200 Buy]', {
      fontFamily: 'Press Start 2P',
      fontSize: '7px',
      color: '#ffb800',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center'
    }).setOrigin(0.5);
    this.partsStoreContainer.add(this.partsSprite);
    this.partsStoreContainer.add(this.partsText);

    // Dispatch Hazard Loading Pad
    const dispatchCoord = this.getDispatchPadGridCoord();
    const dispatchPos = this.gridToIso(dispatchCoord.gx, dispatchCoord.gy);
    this.dispatchPadPos = dispatchPos;
    this.dispatchContainer = this.add.container(dispatchPos.x, dispatchPos.y);
    this.dispatchContainer.setDepth(dispatchPos.y);
    this.dispatchPadSprite = this.add.sprite(0, 0, 'spritesheet', 18); // Frame 18 = Dispatch Pad [2,2]
    this.dispatchPadSprite.setOrigin(0.5, 0.5);
    this.dispatchText = this.add.text(0, -40, 'DISPATCH BAY', {
      fontFamily: 'Press Start 2P',
      fontSize: '7px',
      color: '#ffb800',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);

    // Stacked Cardboard Box Item Stack Graphics on Dispatch Pad
    this.dispatchBoxStack = this.add.container(0, -10);
    this.dispatchContainer.add(this.dispatchPadSprite);
    this.dispatchContainer.add(this.dispatchBoxStack);
    this.dispatchContainer.add(this.dispatchText);

    // Build Desks Setup
    this.refreshFacilityVisibility();
  }

  getDispatchPadGridCoord() {
    const econ = window.economySystem;
    const tier = econ ? econ.buildingTier : 0;
    if (tier === 0) {
      // Level 1: Garage - place on the bottom floor space tile
      return { gx: 7.2, gy: 7.2 };
    } else {
      // Level 2 & 3: Warehouses - lower loading edge
      return { gx: 12.5, gy: 9.2 };
    }
  }

  getAssemblyDeskGridCoord(buildIndex) {
    const desksPerRow = 12;
    const row = Math.floor((buildIndex - 1) / desksPerRow);
    const col = (buildIndex - 1) % desksPerRow;

    const pairIndex = Math.floor(row / 2);
    const inPairIndex = row % 2;

    const gx = 1.0 + col * 0.85;
    const gy = 2.4 + pairIndex * 2.2 + inPairIndex * 0.8;
    return { gx: Math.round(gx * 100) / 100, gy: Math.round(gy * 100) / 100 };
  }

  getTestingDeskGridCoord(testIndex) {
    const desksPerRow = 12;
    const row = Math.floor((testIndex - 1) / desksPerRow);
    const col = (testIndex - 1) % desksPerRow;

    const pairIndex = Math.floor(row / 2);
    const inPairIndex = row % 2;

    const gx = 1.0 + col * 0.85;
    const gy = 6.6 + pairIndex * 2.2 + inPairIndex * 0.8;
    return { gx: Math.round(gx * 100) / 100, gy: Math.round(gy * 100) / 100 };
  }

  getDeskGridCoord(deskId) {
    if (typeof deskId === 'string' && deskId.startsWith('assembly_')) {
      const num = parseInt(deskId.replace('assembly_', ''), 10) || 1;
      return this.getAssemblyDeskGridCoord(num);
    }
    if (typeof deskId === 'string' && deskId.startsWith('testing_')) {
      const num = parseInt(deskId.replace('testing_', ''), 10) || 1;
      return this.getTestingDeskGridCoord(num);
    }
    const numericId = typeof deskId === 'number' ? deskId : parseInt(deskId, 10) || 1;
    const isAssembly = (numericId % 2 !== 0);
    const indexInLine = Math.floor((numericId - 1) / 2) + 1;
    return isAssembly ? this.getAssemblyDeskGridCoord(indexInLine) : this.getTestingDeskGridCoord(indexInLine);
  }

  getHelpdeskGridCoord(helpdeskId) {
    // Mount Helpdesk support stations against top-right back wall (gy = 0.5)
    // Starting along the wall after Admin Terminal (from gx = 5.8 onwards)
    const baseGx = 5.8;
    const spacing = 0.7;
    let gx = baseGx + (helpdeskId - 1) * spacing;
    let gy = 0.5;

    // If exceeding back wall length (gx > 12.2), extend down the far right boundary wall (gx = 12.5)
    if (gx > 12.2) {
      const overflowIndex = helpdeskId - Math.floor((12.2 - baseGx) / spacing) - 1;
      gx = 12.5;
      gy = 1.0 + overflowIndex * 0.8;
    }

    return { gx: Math.round(gx * 10) / 10, gy: Math.round(gy * 10) / 10 };
  }

  refreshFacilityVisibility() {
    const econ = window.economySystem;
    if (!econ) return;

    const assemblyCount = econ.unlockedAssemblyDesks !== undefined ? econ.unlockedAssemblyDesks : 1;
    const testingCount = econ.unlockedTestingDesks !== undefined ? econ.unlockedTestingDesks : 0;

    // 1. Maintain & Reposition Assembly Desks
    const currentAssembly = this.desks.filter(d => d.deskType === 'assembly');
    while (currentAssembly.length < assemblyCount) {
      const nextNum = currentAssembly.length + 1;
      const id = `assembly_${nextNum}`;
      const coord = this.getAssemblyDeskGridCoord(nextNum);
      const newDesk = new Desk(id, coord.gx, coord.gy, this, 'assembly', nextNum);
      this.desks.push(newDesk);
      currentAssembly.push(newDesk);
    }

    for (let i = 0; i < currentAssembly.length; i++) {
      const desk = currentAssembly[i];
      desk.deskNumber = i + 1;
      const coord = this.getAssemblyDeskGridCoord(desk.deskNumber);
      desk.gridX = coord.gx;
      desk.gridY = coord.gy;
      const pos = this.gridToIso(coord.gx, coord.gy);
      desk.x = pos.x;
      desk.y = pos.y;
      desk.container.setPosition(pos.x, pos.y);
      desk.container.setDepth(pos.y + 16);
      if (desk.deptText) desk.deptText.setText(`[BUILD #${desk.deskNumber}]`);
    }

    // 2. Maintain & Reposition Testing Desks
    const currentTesting = this.desks.filter(d => d.deskType === 'testing');
    while (currentTesting.length < testingCount) {
      const nextNum = currentTesting.length + 1;
      const id = `testing_${nextNum}`;
      const coord = this.getTestingDeskGridCoord(nextNum);
      const newDesk = new Desk(id, coord.gx, coord.gy, this, 'testing', nextNum);
      this.desks.push(newDesk);
      currentTesting.push(newDesk);
    }

    for (let i = 0; i < currentTesting.length; i++) {
      const desk = currentTesting[i];
      desk.deskNumber = i + 1;
      const coord = this.getTestingDeskGridCoord(desk.deskNumber);
      desk.gridX = coord.gx;
      desk.gridY = coord.gy;
      const pos = this.gridToIso(coord.gx, coord.gy);
      desk.x = pos.x;
      desk.y = pos.y;
      desk.container.setPosition(pos.x, pos.y);
      desk.container.setDepth(pos.y + 16);
      if (desk.deptText) desk.deptText.setText(`[TEST #${desk.deskNumber}]`);
    }

    // 3. Maintain Helpdesks along top-right wall
    const maxHelpdesks = econ.tierSpecs[econ.buildingTier].maxHelpdesks;
    while (this.helpdesks.length < maxHelpdesks) {
      const nextId = this.helpdesks.length + 1;
      const coord = this.getHelpdeskGridCoord(nextId);
      const newHelpdesk = new Helpdesk(nextId, coord.gx, coord.gy, this);
      this.helpdesks.push(newHelpdesk);
    }

    // 4. Update visibility for all desks
    for (const desk of this.desks) {
      const isUnlocked = desk.deskType === 'assembly'
        ? desk.deskNumber <= assemblyCount
        : desk.deskNumber <= testingCount;
      desk.container.setVisible(isUnlocked);
    }

    // 5. Update visibility for all helpdesks (Unlocked at 5+ total desks)
    for (let i = 0; i < this.helpdesks.length; i++) {
      const hd = this.helpdesks[i];
      const isUnlocked = (i < maxHelpdesks) && (econ.unlockedDesks >= 5);
      hd.container.setVisible(isUnlocked);
    }

    // 6. Update Dispatch Pad position for current building tier
    const dispatchCoord = this.getDispatchPadGridCoord();
    const dispatchPos = this.gridToIso(dispatchCoord.gx, dispatchCoord.gy);
    this.dispatchPadPos = dispatchPos;
    if (this.dispatchContainer) {
      this.dispatchContainer.setPosition(dispatchPos.x, dispatchPos.y);
      this.dispatchContainer.setDepth(dispatchPos.y);
    }
  }

  refreshDeskVisibility() {
    this.refreshFacilityVisibility();
  }

  applyLabelSettings() {
    const s = this.labelSettings;

    // Station labels
    if (this.adminText) this.adminText.setVisible(s.deskLabels);
    if (this.partsText) this.partsText.setVisible(s.deskLabels);
    if (this.dispatchText) this.dispatchText.setVisible(s.deskLabels);

    // Desk labels & Idle labels
    for (const desk of this.desks) {
      if (desk.deptText) desk.deptText.setVisible(s.deskLabels);
      if (desk.updateLabelVisibility) desk.updateLabelVisibility(s);
    }

    // Helpdesk labels
    for (const helpdesk of this.helpdesks) {
      if (helpdesk.statusText) helpdesk.statusText.setVisible(s.deskLabels);
    }

    // Penguin / Staff labels
    for (const penguin of this.penguins) {
      if (penguin.badgeText) penguin.badgeText.setVisible(s.staffRoles);
    }
  }

  setLabelSetting(key, enabled) {
    if (this.labelSettings && this.labelSettings.hasOwnProperty(key)) {
      this.labelSettings[key] = !!enabled;
      this.applyLabelSettings();
    }
  }

  setLabelsVisible(visible) {
    const targetState = !!visible;
    for (const key in this.labelSettings) {
      this.labelSettings[key] = targetState;
    }
    this.applyLabelSettings();
  }

  spawnMoneyPopup(x, y, text, isPositive = true) {
    if (!this.labelSettings || !this.labelSettings.moneyNotifications) return;

    const popupText = this.add.text(x, y - 35, text, {
      fontFamily: 'Press Start 2P',
      fontSize: '10px',
      color: isPositive ? '#20e070' : '#ff3b4e',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);

    popupText.setDepth(y + 120);

    this.tweens.add({
      targets: popupText,
      y: y - 75,
      alpha: 0,
      duration: 1400,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        popupText.destroy();
      }
    });
  }

  togglePlayer2(enabled) {
    if (enabled && !this.p2) {
      this.p2 = new Penguin('p2', 'p2', 5, 4, this);
      this.penguins.push(this.p2);
    } else if (!enabled && this.p2) {
      const idx = this.penguins.indexOf(this.p2);
      if (idx !== -1) this.penguins.splice(idx, 1);
      this.p2.container.destroy();
      this.p2 = null;
    }
  }

  syncAIPenguins() {
    const econ = window.economySystem;
    if (!econ) return;

    // Maintain correct AI penguin counts based on hired helpers
    for (const role in econ.helpers) {
      const hiredCount = econ.helpers[role];
      const currentRolePenguins = this.penguins.filter(p => p.type === role);

      while (currentRolePenguins.length < hiredCount) {
        // Spawn AI Penguin Helper
        const newAI = new Penguin(`ai_${role}_${Date.now()}_${currentRolePenguins.length}`, role, 1, 8, this);
        this.penguins.push(newAI);
        currentRolePenguins.push(newAI);
      }
      while (currentRolePenguins.length > hiredCount) {
        // Despawn AI Penguin Helper
        const toRemove = currentRolePenguins.pop();
        const idx = this.penguins.indexOf(toRemove);
        if (idx !== -1) this.penguins.splice(idx, 1);
        toRemove.container.destroy();
      }
    }
  }

  tryInteract(character, deltaSeconds, isJustPressed) {
    // Priority 0: Pick up PC parts at Parts Store if carrying nothing
    const partsDist = Phaser.Math.Distance.Between(character.x, character.y, this.partsStorePos.x, this.partsStorePos.y);
    if (partsDist < 50 && !character.carryingItem && (isJustPressed || character.isAI)) {
      const econ = window.economySystem;
      if (econ) {
        const partsCost = econ.getPartsCost();
        if (econ.cash >= partsCost) {
          econ.cash -= partsCost;
          character.carryingItem = 'pc_parts';
          this.spawnMoneyPopup(this.partsStorePos.x, this.partsStorePos.y, '-$' + partsCost.toLocaleString(), false);
          if (window.soundSystem) window.soundSystem.playBuy();
          if (!character.isAI && window.uiSystem) window.uiSystem.showAlert('Collected PC Components from Parts Store!');
          return;
        } else if (!character.isAI && window.uiSystem) {
          window.uiSystem.showAlert('Not enough cash to buy components!');
        }
      }
    }

    // Priority 1: Drop carrying box at Dispatch Loading Pad if carrying 'boxed_pc'
    if (character.carryingItem === 'boxed_pc') {
      const dispatchDist = Phaser.Math.Distance.Between(character.x, character.y, this.dispatchPadPos.x, this.dispatchPadPos.y);
      if (dispatchDist < 55) {
        character.carryingItem = null;
        this.addBoxToDispatchPad();
        if (window.soundSystem) window.soundSystem.playBox();
        if (window.uiSystem) window.uiSystem.showAlert('Boxed PC placed on Dispatch Loading Pad!');
        return;
      }
    }

    // Priority 2: Check Admin Terminal (Step 4: List for sale on Testing Desks)
    const adminDist = Phaser.Math.Distance.Between(character.x, character.y, this.adminStationContainer.x, this.adminStationContainer.y);
    if (adminDist < 50 && (isJustPressed || character.isAI)) {
      // Find installed testing desks ready to be listed
      const installedDesk = this.desks.find(d => d.container.visible && d.deskType === 'testing' && d.state === 'INSTALLED');
      if (installedDesk) {
        installedDesk.state = 'LISTED';
        installedDesk.buyerTimer = 10.0; // 10s background buyer matching
        installedDesk.updateSprite();
        if (window.soundSystem) window.soundSystem.playListSale();
        if (window.uiSystem) window.uiSystem.showAlert('PC Listed for Sale! Finding Buyer...');
        return;
      }
    }

    // Priority 3: Check nearby build/test desks (find closest desk within 65px)
    let closestDesk = null;
    let minDeskDist = 65;
    for (const desk of this.desks) {
      if (!desk.container.visible) continue;
      const dist = Phaser.Math.Distance.Between(character.x, character.y, desk.x, desk.y);
      if (dist < minDeskDist) {
        minDeskDist = dist;
        closestDesk = desk;
      }
    }
    if (closestDesk) {
      closestDesk.interact(character, deltaSeconds, isJustPressed);
      return;
    }

    // Priority 4: Check Helpdesk
    for (const helpdesk of this.helpdesks) {
      const dist = Phaser.Math.Distance.Between(character.x, character.y, helpdesk.x, helpdesk.y);
      if (dist < 40) {
        helpdesk.interact(character, deltaSeconds);
        return;
      }
    }
  }

  releaseInteract(character) {
    for (const desk of this.desks) {
      desk.releaseLock(character);
    }
    for (const helpdesk of this.helpdesks) {
      helpdesk.releaseLock(character);
    }
  }

  addBoxToDispatchPad() {
    this.boxedPCItemsCount++;
    this.updateDispatchBoxStack();
  }

  updateDispatchBoxStack() {
    if (!this.dispatchBoxStack) return;
    this.dispatchBoxStack.removeAll(true);
    const count = this.boxedPCItemsCount;
    if (count <= 0) return;

    const maxPerColumn = 15;
    for (let i = 0; i < count; i++) {
      const col = Math.floor(i / maxPerColumn);
      const row = i % maxPerColumn;

      let offsetX = 0;
      if (col > 0) {
        const side = (col % 2 === 1) ? -1 : 1;
        const pair = Math.ceil(col / 2);
        offsetX = side * pair * 16;
      }
      const offsetY = -(row + 1) * 9;

      const boxSprite = this.add.sprite(offsetX, offsetY, 'spritesheet', 12);
      boxSprite.setScale(0.8);
      this.dispatchBoxStack.add(boxSprite);
    }
  }

  collectBoxedPCs() {
    const count = this.boxedPCItemsCount;
    this.boxedPCItemsCount = 0;
    this.updateDispatchBoxStack();
    return count;
  }

  isTaskTargeted(targetObj, currentAIPenguin) {
    if (targetObj instanceof Helpdesk) {
      if (targetObj.occupiedBy && targetObj.occupiedBy !== currentAIPenguin) return true;
      return this.penguins.some(p => p.isAI && p !== currentAIPenguin && p.aiTarget && p.aiTarget.targetObj === targetObj);
    }

    const targetX = targetObj.x !== undefined ? targetObj.x : (targetObj === 'parts_store' ? this.partsStorePos.x : (targetObj === 'dispatch_pad' ? this.dispatchPadPos.x : 0));
    const targetY = targetObj.y !== undefined ? targetObj.y : (targetObj === 'parts_store' ? this.partsStorePos.y : (targetObj === 'dispatch_pad' ? this.dispatchPadPos.y : 0));
    const currentDist = Phaser.Math.Distance.Between(currentAIPenguin.x, currentAIPenguin.y, targetX, targetY);

    return this.penguins.some(p => {
      if (!p.isAI || p === currentAIPenguin || !p.aiTarget || p.aiTarget.targetObj !== targetObj) {
        return false;
      }
      const otherDist = Phaser.Math.Distance.Between(p.x, p.y, targetX, targetY);
      return otherDist < currentDist - 40;
    });
  }

  findClosestMatchingDesk(aiPenguin, statePredicate) {
    let closestDesk = null;
    let minDistance = Infinity;

    for (const desk of this.desks) {
      if (!desk.container.visible) continue;
      if (!statePredicate(desk)) continue;
      if (desk.occupiedBy && desk.occupiedBy !== aiPenguin) continue;
      if (this.isTaskTargeted(desk, aiPenguin)) continue;

      const dist = Phaser.Math.Distance.Between(aiPenguin.x, aiPenguin.y, desk.x, desk.y);
      if (dist < minDistance) {
        minDistance = dist;
        closestDesk = desk;
      }
    }

    return closestDesk;
  }

  isAITargetStillValid(aiPenguin) {
    const target = aiPenguin.aiTarget;
    if (!target) return false;

    const role = aiPenguin.type;
    const econ = window.economySystem;

    if (role === 'buyer') {
      if (aiPenguin.carryingItem === 'pc_parts') {
        return target.targetObj instanceof Desk && target.targetObj.container.visible && target.targetObj.deskType === 'assembly' && target.targetObj.state === 'EMPTY';
      } else {
        const hasEmptyAssemblyDesk = this.desks.some(d => d.container.visible && d.deskType === 'assembly' && d.state === 'EMPTY');
        const canAfford = econ && econ.cash >= econ.getPartsCost();
        return target.targetObj === 'parts_store' && hasEmptyAssemblyDesk && canAfford;
      }
    } else if (role === 'builder') {
      if (aiPenguin.carryingItem === 'assembled_pc') {
        return target.targetObj instanceof Desk && target.targetObj.container.visible && target.targetObj.deskType === 'testing' && target.targetObj.state === 'EMPTY';
      } else if (aiPenguin.carryingItem === 'pc_parts') {
        return target.targetObj instanceof Desk && target.targetObj.container.visible && target.targetObj.deskType === 'assembly' && target.targetObj.state === 'EMPTY';
      } else if (target.targetObj === 'parts_store') {
        const hasEmptyAssemblyDesk = this.desks.some(d => d.container.visible && d.deskType === 'assembly' && d.state === 'EMPTY');
        const canAfford = econ && econ.cash >= econ.getPartsCost();
        return hasEmptyAssemblyDesk && canAfford;
      } else if (target.targetObj instanceof Desk && target.targetObj.container.visible && target.targetObj.deskType === 'assembly') {
        if (target.targetObj.state === 'ASSEMBLED') {
          return this.desks.some(d => d.container.visible && d.deskType === 'testing' && d.state === 'EMPTY');
        }
        if (target.targetObj.state === 'PARTS' && (!target.targetObj.occupiedBy || target.targetObj.occupiedBy === aiPenguin)) return true;
      }
      return false;
    } else if (role === 'installer') {
      return target.targetObj instanceof Desk && target.targetObj.container.visible && target.targetObj.deskType === 'testing' && target.targetObj.state === 'ASSEMBLED';
    } else if (role === 'seller') {
      return this.desks.some(d => d.container.visible && d.deskType === 'testing' && d.state === 'INSTALLED');
    } else if (role === 'dispatcher') {
      if (aiPenguin.carryingItem === 'boxed_pc') {
        return target.targetObj === 'dispatch_pad';
      }
      return target.targetObj instanceof Desk && target.targetObj.container.visible && target.targetObj.deskType === 'testing' && (target.targetObj.state === 'SOLD' || target.targetObj.state === 'BOXED') && (!target.targetObj.occupiedBy || target.targetObj.occupiedBy === aiPenguin);
    } else if (role === 'supportTech') {
      if (target.isStation) {
        const hasActiveAlert = this.helpdesks.some(h => h.activeAlert && (!h.occupiedBy || h.occupiedBy === aiPenguin) && !this.isTaskTargeted(h, aiPenguin));
        return !hasActiveAlert;
      }
      return target.targetObj instanceof Helpdesk && target.targetObj.activeAlert && (!target.targetObj.occupiedBy || target.targetObj.occupiedBy === aiPenguin);
    }
    return false;
  }

  // AI Task Finder
  findAITask(aiPenguin) {
    const role = aiPenguin.type;
    const econ = window.economySystem;

    if (role === 'buyer') {
      if (aiPenguin.carryingItem === 'pc_parts') {
        const emptyAssemblyDesk = this.findClosestMatchingDesk(aiPenguin, d => d.deskType === 'assembly' && d.state === 'EMPTY');
        return emptyAssemblyDesk ? { x: emptyAssemblyDesk.x, y: emptyAssemblyDesk.y, targetObj: emptyAssemblyDesk } : null;
      } else {
        const emptyAssemblyDeskExists = this.desks.some(d => d.container.visible && d.deskType === 'assembly' && d.state === 'EMPTY');
        const canAfford = econ && econ.cash >= econ.getPartsCost();
        const otherBuyersTargetingParts = this.penguins.filter(p => p.isAI && p !== aiPenguin && p.aiTarget && p.aiTarget.targetObj === 'parts_store').length;
        const emptyDeskCount = this.desks.filter(d => d.container.visible && d.deskType === 'assembly' && d.state === 'EMPTY').length;

        if (canAfford && emptyAssemblyDeskExists && otherBuyersTargetingParts < emptyDeskCount) {
          return { x: this.partsStorePos.x, y: this.partsStorePos.y, targetObj: 'parts_store' };
        }
        return null;
      }
    } else if (role === 'builder') {
      if (aiPenguin.carryingItem === 'assembled_pc') {
        const emptyTestingDesk = this.findClosestMatchingDesk(aiPenguin, d => d.deskType === 'testing' && d.state === 'EMPTY');
        return emptyTestingDesk ? { x: emptyTestingDesk.x, y: emptyTestingDesk.y, targetObj: emptyTestingDesk } : null;
      } else if (aiPenguin.carryingItem === 'pc_parts') {
        const emptyAssemblyDesk = this.findClosestMatchingDesk(aiPenguin, d => d.deskType === 'assembly' && d.state === 'EMPTY');
        return emptyAssemblyDesk ? { x: emptyAssemblyDesk.x, y: emptyAssemblyDesk.y, targetObj: emptyAssemblyDesk } : null;
      } else {
        // Priority 1: Pick up ASSEMBLED PC from assembly desk (ONLY if a testing desk is available)
        const hasAvailableTestDesk = this.desks.some(d => d.container.visible && d.deskType === 'testing' && d.state === 'EMPTY');
        if (hasAvailableTestDesk) {
          const assembledDesk = this.findClosestMatchingDesk(aiPenguin, d => d.deskType === 'assembly' && d.state === 'ASSEMBLED');
          if (assembledDesk) {
            return { x: assembledDesk.x, y: assembledDesk.y, targetObj: assembledDesk };
          }
        }
        // Priority 2: Assemble PC on desk with PARTS
        const partsDesk = this.findClosestMatchingDesk(aiPenguin, d => d.deskType === 'assembly' && d.state === 'PARTS');
        if (partsDesk) {
          return { x: partsDesk.x, y: partsDesk.y, targetObj: partsDesk };
        }
        // Priority 3 (Fallback): Fetch parts from Parts Store if assembly desks are empty and cash is available
        const emptyAssemblyDeskExists = this.desks.some(d => d.container.visible && d.deskType === 'assembly' && d.state === 'EMPTY');
        const canAfford = econ && econ.cash >= econ.getPartsCost();
        if (canAfford && emptyAssemblyDeskExists) {
          const otherWorkersTargetingParts = this.penguins.filter(p => p.isAI && p !== aiPenguin && p.aiTarget && p.aiTarget.targetObj === 'parts_store').length;
          const emptyDeskCount = this.desks.filter(d => d.container.visible && d.deskType === 'assembly' && d.state === 'EMPTY').length;
          if (otherWorkersTargetingParts < emptyDeskCount) {
            return { x: this.partsStorePos.x, y: this.partsStorePos.y, targetObj: 'parts_store' };
          }
        }
        return null;
      }
    } else if (role === 'installer') {
      const assembledTestingDesk = this.findClosestMatchingDesk(aiPenguin, d => d.deskType === 'testing' && d.state === 'ASSEMBLED');
      return assembledTestingDesk ? { x: assembledTestingDesk.x, y: assembledTestingDesk.y, targetObj: assembledTestingDesk } : null;
    } else if (role === 'seller') {
      const installedCount = this.desks.filter(d => d.container.visible && d.deskType === 'testing' && d.state === 'INSTALLED').length;
      const otherSellersTargetingAdmin = this.penguins.filter(p => p.isAI && p !== aiPenguin && p.type === 'seller' && p.aiTarget && p.aiTarget.targetObj === this.adminStationContainer).length;
      if (installedCount > otherSellersTargetingAdmin) {
        return { x: this.adminStationContainer.x, y: this.adminStationContainer.y, targetObj: this.adminStationContainer };
      }
      return null;
    } else if (role === 'dispatcher') {
      if (aiPenguin.carryingItem === 'boxed_pc') {
        return { x: this.dispatchPadPos.x, y: this.dispatchPadPos.y, targetObj: 'dispatch_pad' };
      }
      const boxedDesk = this.findClosestMatchingDesk(aiPenguin, d => d.deskType === 'testing' && d.state === 'BOXED');
      if (boxedDesk) {
        return { x: boxedDesk.x, y: boxedDesk.y, targetObj: boxedDesk };
      }
      const soldDesk = this.findClosestMatchingDesk(aiPenguin, d => d.deskType === 'testing' && d.state === 'SOLD');
      if (soldDesk) {
        return { x: soldDesk.x, y: soldDesk.y, targetObj: soldDesk };
      }
      return null;
    } else if (role === 'supportTech') {
      // Priority 1: Answer active incoming ticket calls
      let closestHelpdeskAlert = null;
      let minDistance = Infinity;
      for (const helpdesk of this.helpdesks) {
        if (!helpdesk.activeAlert) continue;
        if (helpdesk.occupiedBy && helpdesk.occupiedBy !== aiPenguin) continue;
        if (this.isTaskTargeted(helpdesk, aiPenguin)) continue;

        const dist = Phaser.Math.Distance.Between(aiPenguin.x, aiPenguin.y, helpdesk.x, helpdesk.y);
        if (dist < minDistance) {
          minDistance = dist;
          closestHelpdeskAlert = helpdesk;
        }
      }
      if (closestHelpdeskAlert) {
        return { x: closestHelpdeskAlert.x, y: closestHelpdeskAlert.y, targetObj: closestHelpdeskAlert };
      }

      // Priority 2: Staff assigned Helpdesk station counter
      const techList = this.penguins.filter(p => p.type === 'supportTech');
      const techIndex = techList.indexOf(aiPenguin);
      if (techIndex !== -1 && this.helpdesks.length > 0) {
        const assignedHd = this.helpdesks[techIndex % this.helpdesks.length];
        if (assignedHd && assignedHd.container.visible) {
          return { x: assignedHd.x, y: assignedHd.y, targetObj: assignedHd, isStation: true };
        }
      }
      return null;
    }

    return null;
  }

  executeAITask(aiPenguin, target, deltaSeconds) {
    if (!target) return true;

    if (target.targetObj instanceof Desk) {
      return target.targetObj.interact(aiPenguin, deltaSeconds, true);
    } else if (target.targetObj === 'parts_store') {
      this.tryInteract(aiPenguin, deltaSeconds, true);
      return true;
    } else if (target.targetObj === this.adminStationContainer) {
      this.tryInteract(aiPenguin, deltaSeconds, true);
      return true;
    } else if (target.targetObj === 'dispatch_pad') {
      this.tryInteract(aiPenguin, deltaSeconds, true);
      return true;
    } else if (target.targetObj instanceof Helpdesk) {
      if (target.isStation) {
        aiPenguin.playAnim('idle');
        return false;
      }
      return target.targetObj.interact(aiPenguin, deltaSeconds);
    }

    return true;
  }

  setPaused(paused) {
    this.isPaused = paused;
  }

  update(time, delta) {
    if (this.isPaused) return;

    const deltaSeconds = delta / 1000.0;

    // Update Input System
    if (window.inputSystem) window.inputSystem.update();

    // Update Economy Day Cycle & Unlock Desk Visibility
    if (window.economySystem) {
      window.economySystem.updateDayCycle(deltaSeconds);
    }

    // Refresh Background based on Building Tier
    const econ = window.economySystem;
    if (econ) {
      const tierBgKey = econ.buildingTier === 0 ? 'garage_bg' : (econ.buildingTier === 1 ? 'warehouse1_bg' : 'warehouse2_bg');
      if (this.bgSprite.texture.key !== tierBgKey) {
        this.bgSprite.setTexture(tierBgKey);
      }
      this.refreshDeskVisibility();
    }

    // Update Desks Passive Timers & Label Visibility
    for (const desk of this.desks) {
      if (desk.container.visible) {
        desk.updatePassive(deltaSeconds);
        if (desk.updateLabelVisibility) {
          desk.updateLabelVisibility(this.labelSettings);
        }
      }
    }

    // Update Helpdesks
    for (const helpdesk of this.helpdesks) {
      helpdesk.update(deltaSeconds);
    }

    // Update Penguins
    for (const penguin of this.penguins) {
      penguin.update(deltaSeconds);
    }

    // Update Delivery Van
    if (this.deliveryVan) {
      this.deliveryVan.update(deltaSeconds);
    }

    // Update UI HUD
    if (window.uiSystem) {
      window.uiSystem.updateHUD();
    }
  }
}

// Game Configuration
const config = {
  type: Phaser.WEBGL,
  parent: 'game-container',
  width: 1280,
  height: 720,
  canvas: document.getElementById('phaser-canvas'),
  pixelArt: true,
  scene: [MainGameScene]
};

window.addEventListener('load', () => {
  window.game = new Phaser.Game(config);
});

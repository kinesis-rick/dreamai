// Economy Manager & Balancing Rules
class EconomySystem {
  constructor() {
    this.cash = 2500.00;
    this.unlockedAssemblyDesks = 1; // 1 Build Desk by default
    this.unlockedTestingDesks = 1;  // 1 Test Desk by default
    this.notifiedCalls = false;     // Track if 5th-desk support calls notice has triggered
    this.buildingTier = 0; // 0: Garage, 1: Warehouse 1, 2: Warehouse 2, 3: Industrial Complex
    this.reviewStars = 5.0; // Reputational review score
    this.totalReviews = 1;
    this.missedCallPenalties = 0; // Number of future sales penalized by -10%

    // Day Cycle
    this.dayTimer = 120; // 120 seconds per day
    this.currentDay = 1;

    // Hired Helpers Counts
    this.helpers = {
      buyer: 0,
      builder: 0,
      installer: 0,
      seller: 0,
      dispatcher: 0,
      supportTech: 0
    };

    // Helper Definitions
    this.helperSpecs = {
      buyer: { name: 'Purchaser Penguin', hireCost: 2000, wage: 150, role: 'Fetches parts from Parts Store & places on Assembly Desks' },
      builder: { name: 'Builder Penguin', hireCost: 3500, wage: 250, role: 'Assembles PCs & transfers them to Testing Desks' },
      installer: { name: 'Tester Penguin', hireCost: 2800, wage: 200, role: 'Boots & installs Linux OS on Testing Desks' },
      seller: { name: 'Seller Penguin', hireCost: 2500, wage: 180, role: 'Lists tested PCs for sale at Admin Terminal' },
      dispatcher: { name: 'Dispatcher Penguin', hireCost: 3200, wage: 220, role: 'Boxes up sold PCs & delivers to Dispatch Bay' },
      supportTech: { name: 'Support Tech Penguin', hireCost: 5500, wage: 400, role: 'Answers & resolves support tickets' }
    };

    // Tier Specs
    this.tierSpecs = [
      { name: 'Garage', maxDesks: 10, maxHelpdesks: 1, upgradeCost: 0, bg: 'garage.jpeg' },
      { name: 'Warehouse Tier 1', maxDesks: 50, maxHelpdesks: 5, upgradeCost: 25000, bg: 'warehouse-tier1.jpeg' },
      { name: 'Warehouse Tier 2', maxDesks: 100, maxHelpdesks: 10, upgradeCost: 75000, bg: 'warehouse-tier2.jpeg' },
      { name: 'Industrial Complex', maxDesks: 200, maxHelpdesks: 20, upgradeCost: 200000, bg: 'warehouse-tier2.jpeg' }
    ];

    // Explicit Desk unlock costs per type
    this.garageAssemblyCosts = [0, 200, 450, 800, 1300, 2000, 3000, 4250, 6000, 8250];
    this.garageTestingCosts = [0, 200, 450, 800, 1300, 2000, 3000, 4250, 6000, 8250];
  }

  get unlockedDesks() {
    return (this.unlockedAssemblyDesks || 1) + (this.unlockedTestingDesks || 0);
  }

  set unlockedDesks(val) {
    if (typeof val === 'number') {
      this.unlockedAssemblyDesks = Math.max(1, Math.ceil(val / 2));
      this.unlockedTestingDesks = Math.max(0, Math.floor(val / 2));
    }
  }

  checkCallsUnlockNotification() {
    if (this.unlockedDesks >= 5 && !this.notifiedCalls) {
      this.notifiedCalls = true;
      if (window.soundSystem) window.soundSystem.playStarBonus();
      if (window.uiSystem) {
        window.uiSystem.showAlert('📞 SUPPORT HELPDESK UNLOCKED! Gifted 1 Helpdesk! Customer support phone calls will now start coming in!');
      }
    }
  }

  getPartsCost() {
    // Component Bulk Discount: -0.15% per desk (Capped at -30%)
    const discountPct = Math.min(0.30, 0.0015 * this.unlockedDesks);
    return Math.round(1200 * (1 - discountPct) * 100) / 100;
  }

  getSalePrice() {
    // Reputational Markup: +0.20% per desk (Capped at +40%)
    const markupPct = Math.min(0.40, 0.0020 * this.unlockedDesks);
    let price = 1320 * (1 + markupPct);

    // Apply Penalty if present
    if (this.missedCallPenalties > 0) {
      price *= 0.90; // -10% penalty
      this.missedCallPenalties--;
      if (window.uiSystem) window.uiSystem.showAlert('Penalized Sale! (-10% penalty applied)');
    }

    return Math.round(price * 100) / 100;
  }

  // --- BUILD / ASSEMBLY DESK PURCHASING ---
  getNextAssemblyDeskCost() {
    const nextIndex = this.unlockedAssemblyDesks + 1;
    const currentTierMax = this.tierSpecs[this.buildingTier].maxDesks;

    if (this.unlockedDesks >= currentTierMax) return null; // Total desks hit facility cap

    if (nextIndex <= 10) {
      return this.garageAssemblyCosts[nextIndex - 1];
    } else {
      return Math.round(200 * Math.pow(nextIndex, 1.55) / 100) * 100;
    }
  }

  canUnlockAssemblyDesk() {
    const cost = this.getNextAssemblyDeskCost();
    return cost !== null && this.cash >= cost;
  }

  unlockAssemblyDesk() {
    const cost = this.getNextAssemblyDeskCost();
    if (cost !== null && this.cash >= cost) {
      this.cash -= cost;
      this.unlockedAssemblyDesks++;
      if (window.soundSystem) window.soundSystem.playBuy();
      this.checkCallsUnlockNotification();
      if (window.gameScene) window.gameScene.refreshFacilityVisibility();
      if (window.uiSystem) window.uiSystem.updateHUD();
      return true;
    }
    return false;
  }

  // --- TESTING DESK PURCHASING ---
  getNextTestingDeskCost() {
    const nextIndex = this.unlockedTestingDesks + 1;
    const currentTierMax = this.tierSpecs[this.buildingTier].maxDesks;

    if (this.unlockedDesks >= currentTierMax) return null; // Total desks hit facility cap

    if (nextIndex <= 10) {
      return this.garageTestingCosts[nextIndex - 1];
    } else {
      return Math.round(200 * Math.pow(nextIndex, 1.55) / 100) * 100;
    }
  }

  canUnlockTestingDesk() {
    const cost = this.getNextTestingDeskCost();
    return cost !== null && this.cash >= cost;
  }

  unlockTestingDesk() {
    const cost = this.getNextTestingDeskCost();
    if (cost !== null && this.cash >= cost) {
      this.cash -= cost;
      this.unlockedTestingDesks++;
      if (window.soundSystem) window.soundSystem.playBuy();
      this.checkCallsUnlockNotification();
      if (window.gameScene) window.gameScene.refreshFacilityVisibility();
      if (window.uiSystem) window.uiSystem.updateHUD();
      return true;
    }
    return false;
  }

  // Fallback methods for backwards compatibility
  getNextDeskCost() {
    return this.getNextAssemblyDeskCost();
  }

  canUnlockDesk() {
    return this.canUnlockAssemblyDesk() || this.canUnlockTestingDesk();
  }

  unlockDesk() {
    if (this.unlockedAssemblyDesks <= this.unlockedTestingDesks) {
      return this.unlockAssemblyDesk();
    } else {
      return this.unlockTestingDesk();
    }
  }

  canUpgradeTier() {
    const nextTier = this.buildingTier + 1;
    if (nextTier >= this.tierSpecs.length) return false;
    return this.cash >= this.tierSpecs[nextTier].upgradeCost;
  }

  upgradeTier() {
    const nextTier = this.buildingTier + 1;
    if (nextTier < this.tierSpecs.length && this.cash >= this.tierSpecs[nextTier].upgradeCost) {
      this.cash -= this.tierSpecs[nextTier].upgradeCost;
      this.buildingTier = nextTier;
      if (window.soundSystem) window.soundSystem.playStarBonus();
      if (window.uiSystem) window.uiSystem.renderUpgradeModal();
      if (window.gameScene) window.gameScene.refreshFacilityVisibility();
      return true;
    }
    return false;
  }

  getDailyWages() {
    let total = 0;
    for (const key in this.helpers) {
      total += this.helpers[key] * this.helperSpecs[key].wage;
    }
    return total;
  }

  hireHelper(role) {
    if (!this.helperSpecs[role]) return false;
    const cost = this.helperSpecs[role].hireCost;
    if (this.cash >= cost) {
      this.cash -= cost;
      this.helpers[role]++;
      if (window.soundSystem) window.soundSystem.playBuy();
      if (window.uiSystem) window.uiSystem.renderHireModal();
      if (window.gameScene) window.gameScene.syncAIPenguins();
      return true;
    }
    return false;
  }

  fireHelper(role) {
    if (this.helpers[role] > 0) {
      this.helpers[role]--;
      if (window.uiSystem) window.uiSystem.renderHireModal();
      if (window.gameScene) window.gameScene.syncAIPenguins();
      return true;
    }
    return false;
  }

  updateDayCycle(deltaSeconds) {
    this.dayTimer -= deltaSeconds;
    if (this.dayTimer <= 0) {
      // End of Day Payroll
      this.dayTimer = 120;
      this.currentDay++;
      const wages = this.getDailyWages();
      this.cash -= wages;

      if (window.uiSystem) {
        window.uiSystem.showDaySummary(this.currentDay - 1, wages, this.cash);
      }
    }
  }

  addReviewRating(stars) {
    this.totalReviews++;
    this.reviewStars = Math.round(((this.reviewStars * (this.totalReviews - 1) + stars) / this.totalReviews) * 10) / 10;
  }
}

window.economySystem = new EconomySystem();

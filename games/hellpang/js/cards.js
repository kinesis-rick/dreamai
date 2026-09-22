/* Hellpang - Card Drafting Manager (Roguelite Card Upgrade Selection) */

class CardManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.currentChoices = [];
    this.selectedIndex = 0;
  }

  // Generate 3 random cards for drafting modal
  generateDraftChoices() {
    const available = UPGRADE_CARDS.filter(card => {
      // Exclude 2P synergy cards if in 1P mode
      if (card.synergy && !this.gameState.twoPlayerMode) return false;
      return true;
    });

    // Shuffle and pick 3
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    this.currentChoices = shuffled.slice(0, 3);
    this.selectedIndex = 0;
    this.renderModal();
  }

  renderModal() {
    const container = document.getElementById('cards-container');
    const summaryEl = document.getElementById('card-loadout-summary');
    if (!container) return;

    const acquired = this.gameState.acquiredCards || [];
    const stats = this.gameState.playerStats || {};

    // 1. Render Active Cards Inventory & Live Stacked Stats Summary
    if (summaryEl) {
      const counts = {};
      acquired.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });

      let badgesHtml = '';
      const cardIds = Object.keys(counts);
      if (cardIds.length === 0) {
        badgesHtml = '<div style="font-size:0.85rem; color:rgba(255,255,255,0.5); font-style:italic;">No cards acquired yet (First Upgrade Selection!)</div>';
      } else {
        cardIds.forEach(cardId => {
          const cardDef = UPGRADE_CARDS.find(c => c.id === cardId);
          if (cardDef) {
            const cnt = counts[cardId];
            const lvlText = cardDef.maxLevel > 1 ? `Lvl ${cnt}/${cardDef.maxLevel}` : `x${cnt}`;
            badgesHtml += `
              <div class="loadout-badge">
                <span>${cardDef.icon} ${cardDef.name}</span>
                <span class="badge-count">${lvlText}</span>
              </div>
            `;
          }
        });
      }

      // Format Live Stacked Modifiers
      const speedPct = Math.round(((stats.moveSpeed || CONFIG.PLAYER_SPEED) / CONFIG.PLAYER_SPEED) * 100);
      const harpoonPattern = stats.vHarpoonSplit === 2 ? '3-Way W-Spread' : (stats.vHarpoonSplit === 1 ? '2-Way V-Split' : 'Straight');
      const detRad = stats.juiceDetonationRadius ? `${stats.juiceDetonationRadius}px` : 'OFF';
      const shieldCount = stats.maxShields ? `Lvl ${stats.maxShields} (${stats.maxShields * 25}% HP)` : 'OFF';
      const vampHeal = stats.vampiricSyringe ? `+${stats.vampiricSyringe} HP` : 'OFF';
      const magRad = `${stats.magnetRadius || 100}px`;

      summaryEl.innerHTML = `
        <div class="loadout-summary-header">
          <span>🎒 CURRENT PERKS ON HAND (${acquired.length} Cards)</span>
          <span style="color:var(--accent-yellow); font-size:0.75rem;">TEAM LEVEL ${this.gameState.teamLevel || 1}</span>
        </div>
        <div class="loadout-badges-row">
          ${badgesHtml}
        </div>
        <div class="loadout-stats-grid">
          <div class="loadout-stat-pill">⚡ Speed: <span>${speedPct}%</span></div>
          <div class="loadout-stat-pill">🔀 Harpoon: <span>${harpoonPattern}</span></div>
          <div class="loadout-stat-pill">🎯 Slots: <span>${stats.maxGrapples || 1}</span></div>
          <div class="loadout-stat-pill">💥 Detonation: <span>${detRad}</span></div>
          <div class="loadout-stat-pill">🛡️ Shield: <span>${shieldCount}</span></div>
          <div class="loadout-stat-pill">🩸 Vampiric: <span>${vampHeal}</span></div>
          <div class="loadout-stat-pill">🧲 Magnet: <span>${magRad}</span></div>
        </div>
      `;
    }

    // 2. Render Card Choices with Level/Stack Badges
    container.innerHTML = '';

    this.currentChoices.forEach((card, index) => {
      const cardEl = document.createElement('div');
      cardEl.className = `upgrade-card ${index === this.selectedIndex ? 'focused' : ''}`;
      cardEl.onclick = () => this.selectCard(index);

      const currentLevel = acquired.filter(id => id === card.id).length;
      let stackBadgeHtml = '';
      if (currentLevel > 0) {
        stackBadgeHtml = `<div class="card-stack-badge">IN HAND: Lvl ${currentLevel} / ${card.maxLevel || 1}</div>`;
      } else {
        stackBadgeHtml = `<div class="card-stack-badge new">★ NEW PERK!</div>`;
      }

      cardEl.innerHTML = `
        <div class="card-key">[${index + 1}]</div>
        ${stackBadgeHtml}
        <div class="card-icon">${card.icon}</div>
        <div class="card-name">${card.name}</div>
        <div class="card-desc">${card.desc}</div>
        ${card.synergy ? '<div class="card-synergy-badge">2P Synergy</div>' : ''}
      `;

      container.appendChild(cardEl);
    });
  }

  selectCard(index) {
    if (index >= 0 && index < this.currentChoices.length) {
      const card = this.currentChoices[index];
      
      if (!this.gameState.acquiredCards) {
        this.gameState.acquiredCards = [];
      }
      this.gameState.acquiredCards.push(card.id);

      card.apply(this.gameState);
      
      // Play level-up sound & resume game
      audioManager.playCrystalPickup();
      this.gameState.resumeFromCardDraft();
    }
  }

  handleInput(input) {
    if (input.wasJustPressed('Digit1')) this.selectCard(0);
    if (input.wasJustPressed('Digit2')) this.selectCard(1);
    if (input.wasJustPressed('Digit3')) this.selectCard(2);

    if (input.wasJustPressed('ArrowLeft') || input.wasJustPressed('KeyA')) {
      this.selectedIndex = (this.selectedIndex - 1 + this.currentChoices.length) % this.currentChoices.length;
      this.renderModal();
    }
    if (input.wasJustPressed('ArrowRight') || input.wasJustPressed('KeyD')) {
      this.selectedIndex = (this.selectedIndex + 1) % this.currentChoices.length;
      this.renderModal();
    }
    if (input.wasJustPressed('Enter') || input.wasJustPressed('Space')) {
      this.selectCard(this.selectedIndex);
    }
  }
}

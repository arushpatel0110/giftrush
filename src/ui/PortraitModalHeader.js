import * as PIXI from 'pixi.js';

/**
 * PortraitModalHeader – Top black navigation bar for mobile portrait popups.
 * Touches both screen side borders (edge-to-edge full width).
 * Features 5 prominently sized navigation icons on the left:
 * 1. Settings (⚙)
 * 2. Sound (🔊/🔇)
 * 3. Paytable (💰)
 * 4. Rules (?)
 * 5. History (↺)
 * Active tab has bright white underline indicator.
 * Far right has circular close (✕) button.
 */
export class PortraitModalHeader extends PIXI.Container {
  constructor(options = {}) {
    super();
    this._activeTab = options.activeTab !== undefined ? options.activeTab : null;
    this._isMuted = options.isMuted || false;
    this._onSwitchTab = options.onSwitchTab;
    this._onSoundToggle = options.onSoundToggle;
    this._onClose = options.onClose;
    this._getUITexture = options.getUITexture || null;

    this._buildUI();
  }

  setMuted(muted) {
    this._isMuted = muted;
    this._updateSoundIcon();
  }

  setActiveTab(tab) {
    this._activeTab = tab;
    this._updateActiveIndicator();
  }

  _buildUI() {
    const headerW = 720;
    const headerH = 70;

    // Solid Black Header Strip Background – Full edge-to-edge width touching both side borders (-500 to +1220)
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 1.0);
    bg.drawRect(-500, 0, headerW + 1000, headerH);
    bg.endFill();
    bg.interactive = true;
    bg.on('pointerdown', (e) => e.stopPropagation());
    this.addChild(bg);

    // 5 Tab Icons positions (prominently sized and spaced across top bar)
    this._tabs = [
      { key: 'settings', x: 60 },
      { key: 'sound',    x: 135 },
      { key: 'paytable', x: 210 },
      { key: 'rules',    x: 285 },
      { key: 'history',  x: 360 },
    ];

    this._tabContainers = {};

    this._tabs.forEach((t) => {
      const c = new PIXI.Container();
      c.x = t.x;
      c.y = 35; // Centered vertically in 70px height bar
      c.interactive = true;
      c.cursor = 'pointer';

      // Generous transparent touch hit area (60px diameter) for easy mobile tapping
      const hit = new PIXI.Graphics();
      hit.beginFill(0x000000, 0.001);
      hit.drawCircle(0, 0, 30);
      hit.endFill();
      c.addChild(hit);

      if (t.key === 'settings') {
        // Use real sprite texture if available, otherwise fall back to drawn gear
        const texNormal = this._getUITexture?.('tab_settings');
        const texActive = this._getUITexture?.('tab_settings_active');
        if (texNormal && texNormal !== PIXI.Texture.WHITE) {
          const sprite = new PIXI.Sprite(this._activeTab === 'settings' ? texActive || texNormal : texNormal);
          sprite.anchor.set(0.5);
          sprite.scale.set(0.52);
          this._settingsTabSprite = sprite;
          c.addChild(sprite);
        } else {
          const gearG = this._createGearIcon();
          c.addChild(gearG);
        }
      } else if (t.key === 'sound') {
        this._soundIconContainer = new PIXI.Container();
        c.addChild(this._soundIconContainer);
        this._updateSoundIcon();
      } else if (t.key === 'paytable') {
        const texNormal = this._getUITexture?.('tab_paytable');
        const texActive = this._getUITexture?.('tab_paytable_active');
        if (texNormal && texNormal !== PIXI.Texture.WHITE) {
          const sprite = new PIXI.Sprite(this._activeTab === 'paytable' ? texActive || texNormal : texNormal);
          sprite.anchor.set(0.5);
          sprite.scale.set(0.52);
          this._paytableTabSprite = sprite;
          c.addChild(sprite);
        } else {
          c.addChild(this._createCoinsIcon());
        }
      } else if (t.key === 'rules') {
        const texNormal = this._getUITexture?.('tab_info');
        const texActive = this._getUITexture?.('tab_info_active');
        if (texNormal && texNormal !== PIXI.Texture.WHITE) {
          const sprite = new PIXI.Sprite(this._activeTab === 'rules' ? texActive || texNormal : texNormal);
          sprite.anchor.set(0.5);
          sprite.scale.set(0.52);
          this._rulesTabSprite = sprite;
          c.addChild(sprite);
        } else {
          c.addChild(this._createRulesIcon());
        }
      } else if (t.key === 'history') {
        const texNormal = this._getUITexture?.('tab_history');
        const texActive = this._getUITexture?.('tab_history_active');
        if (texNormal && texNormal !== PIXI.Texture.WHITE) {
          const sprite = new PIXI.Sprite(this._activeTab === 'history' ? texActive || texNormal : texNormal);
          sprite.anchor.set(0.5);
          sprite.scale.set(0.52);
          this._historyTabSprite = sprite;
          c.addChild(sprite);
        } else {
          c.addChild(this._createHistoryIcon());
        }
      }

      c.on('pointerdown', (e) => {
        e.stopPropagation();
        if (t.key === 'sound') {
          if (this._onSoundToggle) {
            const newMuted = this._onSoundToggle();
            this.setMuted(newMuted);
          } else {
            this.setMuted(!this._isMuted);
          }
        } else {
          this._onSwitchTab?.(t.key);
        }
      });

      this.addChild(c);
      this._tabContainers[t.key] = c;
    });

    // Active Underline Indicator Bar
    this._indicator = new PIXI.Graphics();
    this.addChild(this._indicator);
    this._updateActiveIndicator();

    // Close button – sprite version (tab-btn-close / tab-btn-close-p)
    const closeBtnGroup = new PIXI.Container();
    closeBtnGroup.x = headerW - 45;
    closeBtnGroup.y = 35;
    closeBtnGroup.interactive = true;
    closeBtnGroup.cursor = 'pointer';

    const texCloseNormal  = this._getUITexture?.('tab_close');
    const texClosePressed = this._getUITexture?.('tab_close_pressed');

    if (texCloseNormal && texCloseNormal !== PIXI.Texture.WHITE) {
      // Sprite-based close button
      const closeSprite = new PIXI.Sprite(texCloseNormal);
      closeSprite.anchor.set(0.5);
      closeSprite.scale.set(0.52);
      closeBtnGroup.addChild(closeSprite);

      closeBtnGroup.on('pointerdown', (e) => {
        e.stopPropagation();
        if (texClosePressed && texClosePressed !== PIXI.Texture.WHITE) {
          closeSprite.texture = texClosePressed;
        }
        this._onClose?.();
      });
      closeBtnGroup.on('pointerup',        () => { closeSprite.texture = texCloseNormal; });
      closeBtnGroup.on('pointerupoutside', () => { closeSprite.texture = texCloseNormal; });
    } else {
      // Fallback: drawn circle close button
      const closeCircle = new PIXI.Graphics();
      closeCircle.beginFill(0x282828, 1.0);
      closeCircle.lineStyle(2, 0x666666, 1.0);
      closeCircle.drawCircle(0, 0, 23);
      closeCircle.endFill();
      closeBtnGroup.addChild(closeCircle);

      const closeTxt = new PIXI.Text('✕', {
        fontFamily: 'Outfit, sans-serif',
        fontSize: 24,
        fill: 0xFFFFFF,
        fontWeight: 'bold',
      });
      closeTxt.anchor.set(0.5);
      closeBtnGroup.addChild(closeTxt);

      closeBtnGroup.on('pointerdown', (e) => { e.stopPropagation(); this._onClose?.(); });
      closeBtnGroup.on('pointerover', () => {
        closeCircle.clear();
        closeCircle.beginFill(0x444444, 1.0);
        closeCircle.lineStyle(2, 0xFFFFFF, 1.0);
        closeCircle.drawCircle(0, 0, 23);
        closeCircle.endFill();
      });
      closeBtnGroup.on('pointerout', () => {
        closeCircle.clear();
        closeCircle.beginFill(0x282828, 1.0);
        closeCircle.lineStyle(2, 0x666666, 1.0);
        closeCircle.drawCircle(0, 0, 23);
        closeCircle.endFill();
      });
    }

    this.addChild(closeBtnGroup);
  }

  _createGearIcon() {
    const g = new PIXI.Graphics();
    g.lineStyle(3.5, 0xDDDDDD, 1.0);
    g.drawCircle(0, 0, 13);
    g.beginFill(0xDDDDDD);
    g.drawCircle(0, 0, 6.5);
    g.endFill();

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x1 = Math.cos(angle) * 13;
      const y1 = Math.sin(angle) * 13;
      const x2 = Math.cos(angle) * 19;
      const y2 = Math.sin(angle) * 19;
      g.lineStyle(4, 0xDDDDDD, 1.0);
      g.moveTo(x1, y1);
      g.lineTo(x2, y2);
    }
    return g;
  }

  _updateSoundIcon() {
    if (!this._soundIconContainer) return;
    this._soundIconContainer.removeChildren();

    // Try sprite textures first
    if (this._getUITexture) {
      const key = this._isMuted ? 'tab_snd_off' : 'tab_snd_on';
      const tex = this._getUITexture(key);
      if (tex && tex !== PIXI.Texture.WHITE) {
        const sprite = new PIXI.Sprite(tex);
        sprite.anchor.set(0.5);
        sprite.scale.set(0.52);
        this._soundIconContainer.addChild(sprite);
        return;
      }
    }

    // Fallback: drawn speaker icon
    const g = new PIXI.Graphics();
    // Speaker body
    g.beginFill(0xDDDDDD);
    g.drawPolygon([
      -11, -5,
      -6, -5,
      2, -11,
      2, 11,
      -6, 5,
      -11, 5
    ]);
    g.endFill();

    if (!this._isMuted) {
      g.lineStyle(3, 0xDDDDDD, 1.0);
      g.arc(2, 0, 7, -Math.PI / 3, Math.PI / 3);
      g.lineStyle(2.5, 0xDDDDDD, 0.85);
      g.arc(2, 0, 13, -Math.PI / 3, Math.PI / 3);
    } else {
      g.lineStyle(3.5, 0xFF4444, 1.0);
      g.moveTo(-10, 10);
      g.lineTo(12, -10);
    }
    this._soundIconContainer.addChild(g);
  }

  _createCoinsIcon() {
    const g = new PIXI.Graphics();
    const offsets = [
      { x: -6, y: 4 },
      { x: 3, y: 0 },
      { x: -3, y: -6 },
    ];
    offsets.forEach((off) => {
      g.beginFill(0x181818);
      g.lineStyle(2.2, 0xDDDDDD, 1.0);
      g.drawCircle(off.x, off.y, 9.5);
      g.endFill();
      g.beginFill(0xDDDDDD);
      g.drawCircle(off.x, off.y, 3.5);
      g.endFill();
    });
    return g;
  }

  _createRulesIcon() {
    const container = new PIXI.Container();
    const g = new PIXI.Graphics();
    g.lineStyle(2.5, 0xDDDDDD, 1.0);
    g.drawCircle(0, 0, 14);
    container.addChild(g);

    const txt = new PIXI.Text('?', {
      fontFamily: 'Outfit, sans-serif',
      fontSize: 20,
      fill: 0xDDDDDD,
      fontWeight: 'bold',
    });
    txt.anchor.set(0.5);
    txt.x = 0;
    txt.y = 0;
    container.addChild(txt);
    return container;
  }

  _createHistoryIcon() {
    const container = new PIXI.Container();
    const g = new PIXI.Graphics();
    g.lineStyle(3, 0xDDDDDD, 1.0);
    g.arc(0, 0, 11, -Math.PI * 0.7, Math.PI * 0.8);
    const arrowX = Math.cos(-Math.PI * 0.7) * 11;
    const arrowY = Math.sin(-Math.PI * 0.7) * 11;
    g.beginFill(0xDDDDDD);
    g.drawPolygon([
      arrowX - 3, arrowY - 6,
      arrowX + 6, arrowY + 1,
      arrowX - 6, arrowY + 4
    ]);
    g.endFill();
    container.addChild(g);
    return container;
  }

  _updateActiveIndicator() {
    if (!this._indicator || !this._tabs) return;
    const currentTabObj = this._tabs.find((t) => t.key === this._activeTab);
    this._indicator.clear();
    if (currentTabObj) {
      this._indicator.beginFill(0xFFFFFF, 1.0);
      this._indicator.drawRoundedRect(currentTabObj.x - 21, 62, 42, 4, 2);
      this._indicator.endFill();
    }

    if (!this._getUITexture) return;

    // Helper: swap sprite texture based on active state
    const swapSprite = (sprite, activeTab, normalKey, activeKey) => {
      if (!sprite) return;
      const isActive = this._activeTab === activeTab;
      const texActive = this._getUITexture(activeKey);
      const texNormal = this._getUITexture(normalKey);
      const tex = isActive ? (texActive || texNormal) : texNormal;
      if (tex && tex !== PIXI.Texture.WHITE) sprite.texture = tex;
    };

    swapSprite(this._settingsTabSprite,  'settings', 'tab_settings',  'tab_settings_active');
    swapSprite(this._paytableTabSprite,  'paytable', 'tab_paytable',  'tab_paytable_active');
    swapSprite(this._rulesTabSprite,     'rules',    'tab_info',      'tab_info_active');
    swapSprite(this._historyTabSprite,   'history',  'tab_history',   'tab_history_active');
  }
}

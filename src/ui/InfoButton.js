import * as PIXI from 'pixi.js';
import { AnimationUtils } from '../utils/AnimationUtils.js';

class SubMenuButton extends PIXI.Container {
  constructor(btnKey, clickKey, hoverKey, onClick, getUITexture) {
    super();
    this._onClick = onClick;
    this._texNormal = getUITexture ? getUITexture(btnKey) : null;
    this._texClick  = getUITexture ? getUITexture(clickKey) : null;
    this._texHover  = getUITexture ? getUITexture(hoverKey) : null;

    if (this._texNormal && this._texNormal !== PIXI.Texture.WHITE) {
      this._sprite = new PIXI.Sprite(this._texNormal);
      this._sprite.anchor.set(0.5);
      this.addChild(this._sprite);
    }
    this.interactive = true;
    this.cursor = 'pointer';

    this.on('pointerdown', (e) => {
      e?.stopPropagation?.();
      if (this._sprite && this._texClick) this._sprite.texture = this._texClick;
      AnimationUtils.bounce(this, 0.1, 150);
      this._onClick?.();
    });
    this.on('pointerup', () => {
      if (this._sprite && this._texHover) this._sprite.texture = this._texHover;
    });
    this.on('pointerover', () => {
      if (this._sprite && this._texHover) this._sprite.texture = this._texHover;
    });
    this.on('pointerout', () => {
      if (this._sprite && this._texNormal) this._sprite.texture = this._texNormal;
    });
  }
}

export class InfoButton extends PIXI.Container {
  /**
   * @param {Function} onClick
   * @param {Function} getUITexture
   * @param {object} [subCallbacks] { onRules, onHistory, onPaytable }
   */
  constructor(onClick, getUITexture, subCallbacks = {}) {
    super();
    this._onClick = onClick;
    this._getUITexture = getUITexture;
    this._subCallbacks = subCallbacks;
    this._isHovered = false;
    this._isPressed = false;
    this._hideTimer = null;
    this._disabled = false;
    this._isPortrait = false;

    this._buildUI();
    this.scale.set(0.6);
  }

  setEnabled(enabled) {
    this._disabled = !enabled;
    this.interactive = enabled;
    this.cursor = enabled ? 'pointer' : 'default';
    this._updateTexture();
  }

  updateLayout(isPortrait) {
    this._isPortrait = isPortrait;
    this.scale.set(isPortrait ? 1.0 : 0.6);
    if (isPortrait) {
      if (this._hideTimer) clearTimeout(this._hideTimer);
      if (this._popupMenu) this._popupMenu.visible = false;
    }
    this._updateTexture();
  }

  _buildUI() {
    // 1. Expanded interactive hover zone spanning main button + full vertical sub-buttons area
    const hoverZone = new PIXI.Graphics();
    hoverZone.beginFill(0x000000, 0.001);
    hoverZone.drawRect(-70, -205, 140, 255);
    hoverZone.endFill();
    hoverZone.interactive = true;
    hoverZone.cursor = 'pointer';
    this.addChild(hoverZone);

    // 2. Main Info Button Sprite
    this._texNormal = this._getUITexture ? this._getUITexture('info_btn') : null;
    this._texClick  = this._getUITexture ? this._getUITexture('info_click') : null;
    this._texHover  = this._getUITexture ? this._getUITexture('info_hover') : null;

    if (this._texNormal && this._texNormal !== PIXI.Texture.WHITE) {
      this._sprite = new PIXI.Sprite(this._texNormal);
      this._sprite.anchor.set(0.5);
      this.addChild(this._sprite);
    } else {
      this._text = new PIXI.Text('ℹ', { fontSize: 17, fill: 0xFFFFFF, fontWeight: 'bold' });
      this._text.anchor.set(0.5);
      this.addChild(this._text);
    }

    // 3. Create flyout sub-menu container stacked vertically above info button
    this._popupMenu = new PIXI.Container();
    this._popupMenu.visible = false;
    this.addChild(this._popupMenu);

    const hideMenuImmediately = () => {
      if (this._hideTimer) {
        clearTimeout(this._hideTimer);
        this._hideTimer = null;
      }
      this._popupMenu.visible = false;
    };

    // Rules button (bottom of stack)
    this._rulesBtn = new SubMenuButton(
      'rules_btn', 'rules_click', 'rules_hover',
      () => {
        hideMenuImmediately();
        this._subCallbacks.onRules?.();
      },
      this._getUITexture
    );
    this._rulesBtn.y = -50;
    this._popupMenu.addChild(this._rulesBtn);

    // History button (middle of stack)
    this._historyBtn = new SubMenuButton(
      'history_btn', 'history_click', 'history_hover',
      () => {
        hideMenuImmediately();
        this._subCallbacks.onHistory?.();
      },
      this._getUITexture
    );
    this._historyBtn.y = -100;
    this._popupMenu.addChild(this._historyBtn);

    // Paytable button (top of stack)
    this._paytableBtn = new SubMenuButton(
      'paytable_btn', 'paytable_click', 'paytable_hover',
      () => {
        hideMenuImmediately();
        this._subCallbacks.onPaytable?.();
      },
      this._getUITexture
    );
    this._paytableBtn.y = -150;
    this._popupMenu.addChild(this._paytableBtn);

    // 4. Hover & Click event logic using expanded hoverZone + main button
    this.interactive = true;
    this.cursor = 'pointer';
    this.hitArea = new PIXI.Rectangle(-70, -205, 140, 255);

    const showMenu = () => {
      if (this._isPortrait) return; // Do NOT show vertical flyout sub-menu in portrait mode!
      if (this._hideTimer) {
        clearTimeout(this._hideTimer);
        this._hideTimer = null;
      }
      this._popupMenu.visible = true;
    };

    const scheduleHideMenu = () => {
      if (this._hideTimer) clearTimeout(this._hideTimer);
      this._hideTimer = setTimeout(() => {
        this._popupMenu.visible = false;
      }, 350);
    };

    // Hover listeners on the expanded hover zone
    hoverZone.on('pointerover', () => {
      this._isHovered = true;
      this._updateTexture();
      showMenu();
    });

    hoverZone.on('pointerout', () => {
      this._isHovered = false;
      this._isPressed = false;
      this._updateTexture();
      scheduleHideMenu();
    });

    // Interaction on main info icon area
    this.on('pointerdown', (e) => {
      if (this._isPortrait) {
        this._isPressed = true;
        this._updateTexture();
        AnimationUtils.bounce(this, 0.1, 150);
        hideMenuImmediately();
        this._onClick?.();
        return;
      }
      // Landscape: Only trigger main action if click was near the main info icon (y >= -35)
      const localY = e.data.getLocalPosition(this).y;
      if (localY >= -35) {
        this._isPressed = true;
        this._updateTexture();
        AnimationUtils.bounce(this, 0.1, 150);
        hideMenuImmediately();
        this._onClick?.();
      }
    });

    this.on('pointerup', () => {
      this._isPressed = false;
      this._updateTexture();
    });

    this.on('pointerupoutside', () => {
      this._isPressed = false;
      this._updateTexture();
    });

    this.on('pointerover', () => {
      this._isHovered = true;
      this._updateTexture();
      showMenu();
    });

    this.on('pointerout', () => {
      this._isHovered = false;
      this._isPressed = false;
      this._updateTexture();
      scheduleHideMenu();
    });

    // Sub-buttons hover listeners to keep menu visible while hovering over them
    [this._paytableBtn, this._rulesBtn, this._historyBtn].forEach((btn) => {
      btn.on('pointerover', showMenu);
      btn.on('pointerout', scheduleHideMenu);
    });
  }

  _updateTexture() {
    if (this._sprite) {
      if (this._isPortrait) {
        const texNormal = this._getUITexture ? this._getUITexture('info_btn_portrait') : null;
        const texDisabled = this._getUITexture ? (this._getUITexture('info_btn_portrait_disabled') || this._getUITexture('info_btn_portrait')) : null;

        if (this._disabled || this._isPressed) {
          this._sprite.texture = texDisabled || this._texClick || this._texNormal;
        } else {
          this._sprite.texture = texNormal || this._texNormal;
        }
        this._sprite.width = 82;
        this._sprite.height = 82;
      } else {
        this._sprite.scale.set(1.0);
        if (this._disabled) {
          this._sprite.texture = this._texNormal;
        } else if (this._isPressed && this._texClick) {
          this._sprite.texture = this._texClick;
        } else if (this._isHovered && this._texHover) {
          this._sprite.texture = this._texHover;
        } else {
          this._sprite.texture = this._texNormal;
        }
      }
    }
  }
}

import * as PIXI from 'pixi.js';
import { SymbolConfig, ALL_SYMBOL_IDS, SYMBOL_IDS } from '../config/SymbolConfig.js';
import { GameConfig } from '../config/GameConfig.js';
import bgLandscapeUrl from '../../assets/bglandscape.png';
import bgPortraitUrl from '../../assets/bgportrait.png';
import reelsFrameUrl from '../../assets/reelsbgframelandscape.png';
import startLandscapeUrl from '../../assets/startpagelandscape.webp';
import startPortraitUrl from '../../assets/startpageportrait.webp';
import clickToNextUrl from '../../assets/clicktonext.webp';
import topGrassUrl from '../../assets/topgrass.webp';
import brandLogoUrl from '../../assets/brandlogo.webp';
import soundOnUrl from '../../assets/soundon.webp';
import soundOffUrl from '../../assets/soundoff.webp';
import bottomStripUrl from '../../assets/bottomstrip.webp';
import spinBtnUrl from '../../assets/spinbutton.png';
import spinDisableUrl from '../../assets/spindisable.png';
import spinHoverUrl from '../../assets/spinhover.png';
import autoSpinBtnUrl from '../../assets/autospinbutton.png';
import autoSpinDisableUrl from '../../assets/autospindisable.png';
import autoSpinHoverUrl from '../../assets/autospinhover.png';
import autoSpinStopBtnUrl from '../../assets/autospinstopbtn.png';
import autoSpinStopHoverUrl from '../../assets/autospinstophover.png';
import settingBtnUrl from '../../assets/settingbutton.webp';
import settingClickUrl from '../../assets/settingclick.webp';
import settingHoverUrl from '../../assets/settinghover.webp';
import infoBtnUrl from '../../assets/infobutton.webp';
import infoClickUrl from '../../assets/infoclick.webp';
import infoHoverUrl from '../../assets/infohover.webp';

import rulesBtnUrl from '../../assets/rulesbutton.webp';
import rulesClickUrl from '../../assets/rulesclick.webp';
import rulesHoverUrl from '../../assets/ruleshover.webp';

import historyBtnUrl from '../../assets/historybutton.webp';
import historyClickUrl from '../../assets/historyclick.webp';
import historyHoverUrl from '../../assets/historyhover.png';

import paytableBtnUrl from '../../assets/paytablebutton.webp';
import paytableClickUrl from '../../assets/paytableclick.png';
import paytableHoverUrl from '../../assets/paytablehover.webp';

import totalBetBgUrl from '../../assets/totalbetbg.webp';
import betBtnPortraitUrl from '../../assets/mobile-slot/bet-btn.png_100.webp';
import betBtnPortraitDisabledUrl from '../../assets/mobile-slot/bet-btn-p.png_100.webp';
import spinBtnPortraitUrl from '../../assets/mobile-slot/spin-btn.png_80_90.png';
import spinBtnPortraitDisabledUrl from '../../assets/mobile-slot/spin-btn-p.png_80_90.png';
import spinBtnBgUrl from '../../assets/mobile-slot/spin-btn-bg.png_80_90.png';
import autospinBtnPortraitUrl from '../../assets/mobile-slot/autospin-btn.png_80_90.png';
import autospinBtnPortraitDisabledUrl from '../../assets/mobile-slot/autospin-btn-p.png_80_90.png';
import settingsBtnPortraitUrl from '../../assets/mobile-slot/settings-btn.png_80_90.png';
import settingsBtnPortraitDisabledUrl from '../../assets/mobile-slot/settings-btn-p.png_80_90.png';
import infoBtnPortraitUrl from '../../assets/mobile-slot/info-btn.png_80_90.png';
import infoBtnPortraitDisabledUrl from '../../assets/mobile-slot/info-btn-p.png_100.webp';
import tabSettingsUrl from '../../assets/mobile-slot/tab-btn-settings.png_100.webp';
import tabSettingsActiveUrl from '../../assets/mobile-slot/tab-btn-settings-d.png_100.webp';
import tabSndOnUrl from '../../assets/mobile-slot/tab-btn-snd-on.png_80_90.png';
import tabSndOffUrl from '../../assets/mobile-slot/tab-btn-snd-off.png_80_90.png';
import tabPaytableUrl from '../../assets/mobile-slot/tab-btn-paytable.png_80_90.png';
import tabPaytableActiveUrl from '../../assets/mobile-slot/tab-btn-paytable-d.png_80_90.png';
import tabInfoUrl from '../../assets/mobile-slot/tab-btn-info.png_80_90.png';
import tabInfoActiveUrl from '../../assets/mobile-slot/tab-btn-info-d.png_100.webp';
import tabHistoryUrl from '../../assets/mobile-slot/tab-btn-history.png_80_90.png';
import tabHistoryActiveUrl from '../../assets/mobile-slot/tab-btn-history-p.png_80_90.png';
import tabCloseUrl from '../../assets/mobile-slot/tab-btn-close.png_80_90.png';
import tabClosePressedUrl from '../../assets/mobile-slot/tab-btn-close-p.png_80_90.png';
import bonusEnableUrl from '../../assets/bonusenable.webp';
import bonusDisableUrl from '../../assets/bonusdisable.webp';
import grassOfBonusUrl from '../../assets/grassofbonus.webp';
import grassOfBonusBehindUrl from '../../assets/grassofbonusbehind.webp';
import grassPortraitUrl from '../../assets/bonus/grass-portrait.png_80_80.webp';
import bgPortraitGrassUrl from '../../assets/bg-portrait-grass.png_80_80.webp';
import buyBonusUrl from '../../assets/buybonus.png';
import buyBonus2Url from '../../assets/buybonus2.png';
import portraitBuyBonusUrl from '../../assets/portraitbuybonus.png';
import portraitBuyBonus2Url from '../../assets/portraitbuybonus2.webp';

import buyBonusConfirmPopupUrl from '../../assets/buybonusconfirmpopup.webp';
import bgBuyBonusConfirmPopupUrl from '../../assets/bgofbuybonusconfirmpopup.png';
import blueGlowBugUrl from '../../assets/blueglowbug.webp';
import noBuyBonusUrl from '../../assets/nobuybonus.png';
import noBuyBonusHoverUrl from '../../assets/nobuybonushover.png';
import yesBuyBonusUrl from '../../assets/yesbuybonus.webp';
import yesBuyBonusHoverUrl from '../../assets/yesbuybonushover.png';
import bgShineUrl from '../../assets/bgshine.webp';
import shiningUrl from '../../assets/shining.webp';
import ribbonUrl from '../../assets/ribbon.webp';
import bonusBgUrl from '../../assets/bonusbg.webp';
import particleOfBunchUrl from '../../assets/particleofbunch.png';
import blinkUrl from '../../assets/blink.webp';
import giftMultiplierShadowUrl from '../../assets/gift-multiplier-shadow.png_80_90.png';
import winBgSymbolUrl from '../../assets/win-bg.png_80_80.webp';
import winBadgeUrl from '../../assets/win.png_90_90.webp';
import miniPaytableBgUrl from '../../assets/minipaytable-bg.png_80_90.png';
import anticipationBgUrl from '../../assets/anticipation-bg.png_80_90.png';
import anticipationFrameUrl from '../../assets/anticipation-frame.png_80_90.png';
import feature1Url from '../../assets/feature_1.jpg_80_80.webp';
import feature2Url from '../../assets/feature_2.jpg_80_80.webp';

// Gift Pick images
import gift1Url from '../../assets/gift1.webp';
import gift1HoverUrl from '../../assets/gift1hover.webp';
import gift1OpenUrl from '../../assets/gift1open.webp';

import gift2Url from '../../assets/gift2.webp';
import gift2HoverUrl from '../../assets/gift2hover.webp';
import gift2OpenUrl from '../../assets/gift2open.webp';

import gift3Url from '../../assets/gift3.webp';
import gift3HoverUrl from '../../assets/gift3hover.webp';
import gift3OpenUrl from '../../assets/gift3open.webp';

import gift4Url from '../../assets/gift4.webp';
import gift4HoverUrl from '../../assets/gift4hover.webp';
import gift4OpenUrl from '../../assets/gift4open.webp';

import gift5Url from '../../assets/gift5.webp';
import gift5HoverUrl from '../../assets/gift5hover.webp';
import gift5OpenUrl from '../../assets/gift5open.webp';

// Tree shake bunch images
import bunch1Url from '../../assets/bonus_tree_shakes_spine/bunch_1.webp';
import bunch2Url from '../../assets/bonus_tree_shakes_spine/bunch_2.webp';
import bunch3Url from '../../assets/bonus_tree_shakes_spine/bunch_3.webp';
import bunch4Url from '../../assets/bonus_tree_shakes_spine/bunch_4..webp';
import bunch5Url from '../../assets/bonus_tree_shakes_spine/bunch_5.webp';

// Clear symbols
import symSeven from '../../assets/symbols/seven.webp';
import symStar from '../../assets/symbols/star.webp';
import symBell from '../../assets/symbols/bell.webp';
import symGlove from '../../assets/symbols/glove.webp';
import symBall from '../../assets/symbols/ball.webp';
import symBread from '../../assets/symbols/bread.webp';
import symCane from '../../assets/symbols/cane.webp';
import symHat from '../../assets/symbols/hat.webp';
import symBonus from '../../assets/symbols/bonus.webp';

import { TextureAtlas } from 'pixi-spine';
import { AtlasAttachmentLoader, SkeletonJson } from '@pixi-spine/runtime-4.0';
import giftJsonData from '../../assets/spines/gift.json';
import giftAtlasRaw from '../../assets/spines/gift.atlas?raw';
import giftTextureUrl from '../../assets/spines/gift.png_80_80.webp';
import bonusPopUpJsonData from '../../assets/spines/bonus_game_pop_up.json';
import bonusPopUpAtlasRaw from '../../assets/spines/bonus_game_pop_up.atlas?raw';
import bonusPopUpTextureUrl from '../../assets/spines/bonus_game_pop_up.png_80_80.webp';

import winsPopUpJsonData from '../../assets/spines/wins_pop_up.json';
import winsPopUpAtlasRaw from '../../assets/spines/wins_pop_up.atlas?raw';
import winsPopUpTextureUrl from '../../assets/spines/wins_pop_up.png_80_80.webp';

// Bunch tree shake spine files
import bunch1JsonData from '../../assets/bonus_tree_shakes_spine/bunch_1.json';
import bunch1AtlasRaw from '../../assets/bonus_tree_shakes_spine/bunch_1.atlas?raw';
import bunch2JsonData from '../../assets/bonus_tree_shakes_spine/bunch_2.json';
import bunch2AtlasRaw from '../../assets/bonus_tree_shakes_spine/bunch_2.atlas?raw';
import bunch3JsonData from '../../assets/bonus_tree_shakes_spine/bunch_3.json';
import bunch3AtlasRaw from '../../assets/bonus_tree_shakes_spine/bunch_3.atlas?raw';
import bunch4JsonData from '../../assets/bonus_tree_shakes_spine/bunch_4.json';
import bunch4AtlasRaw from '../../assets/bonus_tree_shakes_spine/bunch_4.atlas?raw';
import bunch5JsonData from '../../assets/bonus_tree_shakes_spine/bunch_5.json';
import bunch5AtlasRaw from '../../assets/bonus_tree_shakes_spine/bunch_5.atlas?raw';

import coinJsonData from '../../assets/coins/coin.json';
import coinTextureUrl from '../../assets/coins/coin.png_80_80.webp';

// Symbol spine animation files
import symSpineSevenJson from '../../assets/symbol_spines/seven.json';
import symSpineSevenAtlas from '../../assets/symbol_spines/seven.atlas?raw';
import symSpineSevenUrl from '../../assets/symbol_spines/seven.webp';

import symSpineStarJson from '../../assets/symbol_spines/star.json';
import symSpineStarAtlas from '../../assets/symbol_spines/star.atlas?raw';
import symSpineStarUrl from '../../assets/symbol_spines/star.webp';

import symSpineBellsJson from '../../assets/symbol_spines/bells.json';
import symSpineBellsAtlas from '../../assets/symbol_spines/bells.atlas?raw';
import symSpineBellsUrl from '../../assets/symbol_spines/bells.webp';

import symSpineMittenJson from '../../assets/symbol_spines/mitten.json';
import symSpineMittenAtlas from '../../assets/symbol_spines/mitten.atlas?raw';
import symSpineMittenUrl from '../../assets/symbol_spines/mitten.webp';

import symSpineBallJson from '../../assets/symbol_spines/ball.json';
import symSpineBallAtlas from '../../assets/symbol_spines/ball.atlas?raw';
import symSpineBallUrl from '../../assets/symbol_spines/ball.webp';

import symSpineCookieJson from '../../assets/symbol_spines/cookie.json';
import symSpineCookieAtlas from '../../assets/symbol_spines/cookie.atlas?raw';
import symSpineCookieUrl from '../../assets/symbol_spines/cookie.webp';

import symSpineStickJson from '../../assets/symbol_spines/stick.json';
import symSpineStickAtlas from '../../assets/symbol_spines/stick.atlas?raw';
import symSpineStickUrl from '../../assets/symbol_spines/stick.webp';

import symSpineHatJson from '../../assets/symbol_spines/hat.json';
import symSpineHatAtlas from '../../assets/symbol_spines/hat.atlas?raw';
import symSpineHatUrl from '../../assets/symbol_spines/hat.webp';

import symSpineElfJson from '../../assets/symbol_spines/elf.json';
import symSpineElfAtlas from '../../assets/symbol_spines/elf.atlas?raw';
import symSpineElfUrl from '../../assets/symbol_spines/elf.webp';

/**
 * AssetLoader – Loads high-resolution clear symbol textures, start page, frame decorations, UI images, and Spine data.
 * Dynamic vertical motion blur is calculated logically via PIXI.BlurFilter during spin.
 */
export class AssetLoader {
  /**
   * @param {PIXI.Application} app
   */
  constructor(app) {
    this._app = app;
    /** @type {Map<number, PIXI.Texture>} */
    this._symbolTextures = new Map();
    /** @type {Map<string, PIXI.Texture>} */
    this._uiTextures = new Map();
    /** @type {Map<string, any>} */
    this._spineDatas = new Map();
  }

  /**
   * Generate/load all textures. Call once during loading.
   * @param {Function} onProgress  Called with (percent 0–100)
   */
  async generateAll(onProgress) {
    const total = ALL_SYMBOL_IDS.length + 11; // symbols + UI + backgrounds + start page + decorations
    let done = 0;
    const step = () => { done++; onProgress && onProgress((done / total) * 100); };

    const clearMap = {
      [SYMBOL_IDS.SEVEN]: symSeven,
      [SYMBOL_IDS.STAR]: symStar,
      [SYMBOL_IDS.BELL]: symBell,
      [SYMBOL_IDS.MITTEN]: symGlove,
      [SYMBOL_IDS.ORNAMENT]: symBall,
      [SYMBOL_IDS.GINGERBREAD]: symBread,
      [SYMBOL_IDS.CANDY_CANE]: symCane,
      [SYMBOL_IDS.SANTA_HAT]: symHat,
      [SYMBOL_IDS.BONUS]: symBonus,
    };

    // Load clear symbol textures
    for (const id of ALL_SYMBOL_IDS) {
      try {
        const tex = await PIXI.Assets.load(clearMap[id]);
        this._symbolTextures.set(id, tex);
      } catch (err) {
        console.warn(`Fallback texture load for symbol ${id}:`, err);
        this._symbolTextures.set(id, PIXI.Texture.from(clearMap[id]));
      }
      step();
      await this._frame(); // yield between frames to keep UI responsive
    }

    // Load orientation background images, reel frame, top grass & start page
    try {
      const texLandscape = await PIXI.Assets.load(bgLandscapeUrl);
      const texPortrait = await PIXI.Assets.load(bgPortraitUrl);
      const texReels = await PIXI.Assets.load(reelsFrameUrl);
      const texStartLand = await PIXI.Assets.load(startLandscapeUrl);
      const texStartPort = await PIXI.Assets.load(startPortraitUrl);
      const texClickNext = await PIXI.Assets.load(clickToNextUrl);
      const texTopGrass = await PIXI.Assets.load(topGrassUrl);
      const texBrandLogo = await PIXI.Assets.load(brandLogoUrl);
      const texSoundOn = await PIXI.Assets.load(soundOnUrl);
      const texSoundOff = await PIXI.Assets.load(soundOffUrl);
      const texBottomStrip = await PIXI.Assets.load(bottomStripUrl);
      const texSpinBtn = await PIXI.Assets.load(spinBtnUrl);
      const texSpinDis = await PIXI.Assets.load(spinDisableUrl);
      const texSpinHov = await PIXI.Assets.load(spinHoverUrl);
      const texAutoSpin = await PIXI.Assets.load(autoSpinBtnUrl);
      const texAutoDis = await PIXI.Assets.load(autoSpinDisableUrl);
      const texAutoHov = await PIXI.Assets.load(autoSpinHoverUrl);
      const texAutoSpinStop = await PIXI.Assets.load(autoSpinStopBtnUrl);
      const texAutoSpinStopHov = await PIXI.Assets.load(autoSpinStopHoverUrl);
      const texSettingBtn = await PIXI.Assets.load(settingBtnUrl);
      const texSettingClk = await PIXI.Assets.load(settingClickUrl);
      const texSettingHov = await PIXI.Assets.load(settingHoverUrl);
      const texInfoBtn = await PIXI.Assets.load(infoBtnUrl);
      const texInfoClk = await PIXI.Assets.load(infoClickUrl);
      const texInfoHov = await PIXI.Assets.load(infoHoverUrl);

      const texRulesBtn = await PIXI.Assets.load(rulesBtnUrl);
      const texRulesClk = await PIXI.Assets.load(rulesClickUrl);
      const texRulesHov = await PIXI.Assets.load(rulesHoverUrl);

      const texHistoryBtn = await PIXI.Assets.load(historyBtnUrl);
      const texHistoryClk = await PIXI.Assets.load(historyClickUrl);
      const texHistoryHov = await PIXI.Assets.load(historyHoverUrl);

      const texPaytableBtn = await PIXI.Assets.load(paytableBtnUrl);
      const texPaytableClk = await PIXI.Assets.load(paytableClickUrl);
      const texPaytableHov = await PIXI.Assets.load(paytableHoverUrl);
      const texTotalBetBg = await PIXI.Assets.load(totalBetBgUrl);
      const texBetBtnPortrait = await PIXI.Assets.load(betBtnPortraitUrl);
      const texBetBtnPortraitDisabled = await PIXI.Assets.load(betBtnPortraitDisabledUrl);
      const texSpinBtnPortrait = await PIXI.Assets.load(spinBtnPortraitUrl);
      const texSpinBtnPortraitDisabled = await PIXI.Assets.load(spinBtnPortraitDisabledUrl);
      const texSpinBtnBg = await PIXI.Assets.load(spinBtnBgUrl);
      const texAutospinBtnPortrait = await PIXI.Assets.load(autospinBtnPortraitUrl);
      const texAutospinBtnPortraitDisabled = await PIXI.Assets.load(autospinBtnPortraitDisabledUrl);
      const texSettingsBtnPortrait = await PIXI.Assets.load(settingsBtnPortraitUrl);
      const texSettingsBtnPortraitDisabled = await PIXI.Assets.load(settingsBtnPortraitDisabledUrl);
      const texInfoBtnPortrait = await PIXI.Assets.load(infoBtnPortraitUrl);
      const texInfoBtnPortraitDisabled = await PIXI.Assets.load(infoBtnPortraitDisabledUrl);
      const texBonusEnable = await PIXI.Assets.load(bonusEnableUrl);
      const texBonusDisable = await PIXI.Assets.load(bonusDisableUrl);
      const texGrassBonus = await PIXI.Assets.load(grassOfBonusUrl);
      const texGrassBonusBehind = await PIXI.Assets.load(grassOfBonusBehindUrl);
      const texBuyBonus = await PIXI.Assets.load(buyBonusUrl);
      const texBuyBonus2 = await PIXI.Assets.load(buyBonus2Url);

      const texBuyBonusPopup = await PIXI.Assets.load(buyBonusConfirmPopupUrl);
      const texBgBuyBonusPopup = await PIXI.Assets.load(bgBuyBonusConfirmPopupUrl);
      const texBlueGlowBug = await PIXI.Assets.load(blueGlowBugUrl);
      const texNoBuyBonus = await PIXI.Assets.load(noBuyBonusUrl);
      const texNoBuyBonusHov = await PIXI.Assets.load(noBuyBonusHoverUrl);
      const texYesBuyBonus = await PIXI.Assets.load(yesBuyBonusUrl);
      const texYesBuyBonusHov = await PIXI.Assets.load(yesBuyBonusHoverUrl);
      const texBgShine = await PIXI.Assets.load(bgShineUrl);
      const texRibbon = await PIXI.Assets.load(ribbonUrl);
      const texBonusBg = await PIXI.Assets.load(bonusBgUrl);
      const texParticleOfBunch = await PIXI.Assets.load(particleOfBunchUrl);
      const texBlink = await PIXI.Assets.load(blinkUrl);
      const texGiftMultiplierShadow = await PIXI.Assets.load(giftMultiplierShadowUrl);
      this._uiTextures.set('gift_multiplier_shadow', texGiftMultiplierShadow);

      const texFeature1 = await PIXI.Assets.load(feature1Url);
      const texFeature2 = await PIXI.Assets.load(feature2Url);

      // Load gift textures (gift1..5, gift1..5hover, gift1..5open)
      const giftUrls = [
        { num: 1, url: gift1Url, hoverUrl: gift1HoverUrl, openUrl: gift1OpenUrl },
        { num: 2, url: gift2Url, hoverUrl: gift2HoverUrl, openUrl: gift2OpenUrl },
        { num: 3, url: gift3Url, hoverUrl: gift3HoverUrl, openUrl: gift3OpenUrl },
        { num: 4, url: gift4Url, hoverUrl: gift4HoverUrl, openUrl: gift4OpenUrl },
        { num: 5, url: gift5Url, hoverUrl: gift5HoverUrl, openUrl: gift5OpenUrl },
      ];

      for (const g of giftUrls) {
        this._uiTextures.set(`gift${g.num}`, await PIXI.Assets.load(g.url));
        this._uiTextures.set(`gift${g.num}hover`, await PIXI.Assets.load(g.hoverUrl));
        this._uiTextures.set(`gift${g.num}open`, await PIXI.Assets.load(g.openUrl));
      }

      // Load tree shake bunch textures (bunch_1..bunch_5)
      this._uiTextures.set('bunch_1', await PIXI.Assets.load(bunch1Url));
      this._uiTextures.set('bunch_2', await PIXI.Assets.load(bunch2Url));
      this._uiTextures.set('bunch_3', await PIXI.Assets.load(bunch3Url));
      this._uiTextures.set('bunch_4', await PIXI.Assets.load(bunch4Url));
      this._uiTextures.set('bunch_5', await PIXI.Assets.load(bunch5Url));

      this._uiTextures.set('bg_landscape', texLandscape);
      this._uiTextures.set('bg_portrait', texPortrait);
      this._uiTextures.set('reels_frame', texReels);
      this._uiTextures.set('start_landscape', texStartLand);
      this._uiTextures.set('start_portrait', texStartPort);
      this._uiTextures.set('bonus_bg', texBonusBg);
      this._uiTextures.set('click_to_next', texClickNext);
      this._uiTextures.set('top_grass', texTopGrass);
      this._uiTextures.set('brand_logo', texBrandLogo);
      this._uiTextures.set('sound_on', texSoundOn);
      this._uiTextures.set('sound_off', texSoundOff);
      this._uiTextures.set('bottom_strip', texBottomStrip);
      this._uiTextures.set('spin_btn', texSpinBtn);
      this._uiTextures.set('spin_btn_disabled', texSpinDis);
      this._uiTextures.set('spin_btn_hover', texSpinHov);
      this._uiTextures.set('auto_spin_btn', texAutoSpin);
      this._uiTextures.set('auto_spin_disabled', texAutoDis);
      this._uiTextures.set('auto_spin_hover', texAutoHov);
      this._uiTextures.set('auto_spin_stop_btn', texAutoSpinStop);
      this._uiTextures.set('auto_spin_stop_hover', texAutoSpinStopHov);
      this._uiTextures.set('setting_btn', texSettingBtn);
      this._uiTextures.set('setting_click', texSettingClk);
      this._uiTextures.set('setting_hover', texSettingHov);
      this._uiTextures.set('info_btn', texInfoBtn);
      this._uiTextures.set('info_click', texInfoClk);
      this._uiTextures.set('info_hover', texInfoHov);
      this._uiTextures.set('rules_btn', texRulesBtn);
      this._uiTextures.set('rules_click', texRulesClk);
      this._uiTextures.set('rules_hover', texRulesHov);
      this._uiTextures.set('history_btn', texHistoryBtn);
      this._uiTextures.set('history_click', texHistoryClk);
      this._uiTextures.set('history_hover', texHistoryHov);
      this._uiTextures.set('paytable_btn', texPaytableBtn);
      this._uiTextures.set('paytable_click', texPaytableClk);
      this._uiTextures.set('paytable_hover', texPaytableHov);
      this._uiTextures.set('total_bet_bg', texTotalBetBg);
      this._uiTextures.set('bet_btn_portrait', texBetBtnPortrait);
      this._uiTextures.set('bet_btn_portrait_disabled', texBetBtnPortraitDisabled);
      this._uiTextures.set('spin_btn_portrait', texSpinBtnPortrait);
      this._uiTextures.set('spin_btn_portrait_disabled', texSpinBtnPortraitDisabled);
      this._uiTextures.set('spin_btn_bg', texSpinBtnBg);
      this._uiTextures.set('auto_spin_btn_portrait', texAutospinBtnPortrait);
      this._uiTextures.set('auto_spin_btn_portrait_disabled', texAutospinBtnPortraitDisabled);
      this._uiTextures.set('settings_btn_portrait', texSettingsBtnPortrait);
      this._uiTextures.set('settings_btn_portrait_disabled', texSettingsBtnPortraitDisabled);
      this._uiTextures.set('info_btn_portrait', texInfoBtnPortrait);
      this._uiTextures.set('info_btn_portrait_disabled', texInfoBtnPortraitDisabled);
      const texTabSettings = await PIXI.Assets.load(tabSettingsUrl);
      this._uiTextures.set('tab_settings', texTabSettings);
      const texTabSettingsActive = await PIXI.Assets.load(tabSettingsActiveUrl);
      this._uiTextures.set('tab_settings_active', texTabSettingsActive);
      const texTabSndOn = await PIXI.Assets.load(tabSndOnUrl);
      this._uiTextures.set('tab_snd_on', texTabSndOn);
      const texTabSndOff = await PIXI.Assets.load(tabSndOffUrl);
      this._uiTextures.set('tab_snd_off', texTabSndOff);
      const texTabPaytable = await PIXI.Assets.load(tabPaytableUrl);
      this._uiTextures.set('tab_paytable', texTabPaytable);
      const texTabPaytableActive = await PIXI.Assets.load(tabPaytableActiveUrl);
      this._uiTextures.set('tab_paytable_active', texTabPaytableActive);
      const texTabInfo = await PIXI.Assets.load(tabInfoUrl);
      this._uiTextures.set('tab_info', texTabInfo);
      const texTabInfoActive = await PIXI.Assets.load(tabInfoActiveUrl);
      this._uiTextures.set('tab_info_active', texTabInfoActive);
      const texTabHistory = await PIXI.Assets.load(tabHistoryUrl);
      this._uiTextures.set('tab_history', texTabHistory);
      const texTabHistoryActive = await PIXI.Assets.load(tabHistoryActiveUrl);
      this._uiTextures.set('tab_history_active', texTabHistoryActive);
      const texTabClose = await PIXI.Assets.load(tabCloseUrl);
      this._uiTextures.set('tab_close', texTabClose);
      const texTabClosePressed = await PIXI.Assets.load(tabClosePressedUrl);
      this._uiTextures.set('tab_close_pressed', texTabClosePressed);
      this._uiTextures.set('bonus_enable', texBonusEnable);
      this._uiTextures.set('bonus_disable', texBonusDisable);
      this._uiTextures.set('grass_of_bonus', texGrassBonus);
      this._uiTextures.set('grass_of_bonus_behind', texGrassBonusBehind);
      const texGrassPortrait = await PIXI.Assets.load(grassPortraitUrl);
      this._uiTextures.set('grass_portrait', texGrassPortrait);
      const texBgPortraitGrass = await PIXI.Assets.load(bgPortraitGrassUrl);
      this._uiTextures.set('bg_portrait_grass', texBgPortraitGrass);
      this._uiTextures.set('buy_bonus', texBuyBonus);
      this._uiTextures.set('buy_bonus_2', texBuyBonus2);
      const texPortraitBuyBonus = await PIXI.Assets.load(portraitBuyBonusUrl);
      this._uiTextures.set('portrait_buy_bonus', texPortraitBuyBonus);
      const texPortraitBuyBonus2 = await PIXI.Assets.load(portraitBuyBonus2Url);
      this._uiTextures.set('portrait_buy_bonus_2', texPortraitBuyBonus2);
      this._uiTextures.set('buy_bonus_confirm_popup', texBuyBonusPopup);
      this._uiTextures.set('bg_buy_bonus_confirm_popup', texBgBuyBonusPopup);
      this._uiTextures.set('blue_glow_bug', texBlueGlowBug);
      this._uiTextures.set('no_buy_bonus', texNoBuyBonus);
      this._uiTextures.set('no_buy_bonus_hover', texNoBuyBonusHov);
      this._uiTextures.set('yes_buy_bonus', texYesBuyBonus);
      this._uiTextures.set('yes_buy_bonus_hover', texYesBuyBonusHov);
      this._uiTextures.set('bg_shine', texBgShine);
      const texShining = await PIXI.Assets.load(shiningUrl);
      this._uiTextures.set('shining', texShining);
      this._uiTextures.set('ribbon', texRibbon);
      this._uiTextures.set('bonus_bg', texBonusBg);
      this._uiTextures.set('particle_of_bunch', texParticleOfBunch);
      this._uiTextures.set('blink', texBlink);
      this._uiTextures.set('feature_1', texFeature1);
      this._uiTextures.set('feature_2', texFeature2);
      const texMiniPaytableBg = await PIXI.Assets.load(miniPaytableBgUrl);
      this._uiTextures.set('mini_paytable_bg', texMiniPaytableBg);
      const texWinBgSymbol = await PIXI.Assets.load(winBgSymbolUrl);
      this._uiTextures.set('win_bg_symbol', texWinBgSymbol);
      const texWinBadge = await PIXI.Assets.load(winBadgeUrl);
      this._uiTextures.set('win_badge', texWinBadge);
      const texAnticipationBg = await PIXI.Assets.load(anticipationBgUrl);
      this._uiTextures.set('anticipation_bg', texAnticipationBg);
      const texAnticipationFrame = await PIXI.Assets.load(anticipationFrameUrl);
      this._uiTextures.set('anticipation_frame', texAnticipationFrame);
    } catch (err) {
      console.warn('Could not load backgrounds via PIXI.Assets, falling back to PIXI.Texture.from:', err);
      this._uiTextures.set('feature_1', PIXI.Texture.from(feature1Url));
      this._uiTextures.set('feature_2', PIXI.Texture.from(feature2Url));
      this._uiTextures.set('win_bg_symbol', PIXI.Texture.from(winBgSymbolUrl));
      this._uiTextures.set('win_badge', PIXI.Texture.from(winBadgeUrl));
      this._uiTextures.set('anticipation_bg', PIXI.Texture.from(anticipationBgUrl));
      this._uiTextures.set('anticipation_frame', PIXI.Texture.from(anticipationFrameUrl));
      this._uiTextures.set('bg_landscape', PIXI.Texture.from(bgLandscapeUrl));
      this._uiTextures.set('bg_portrait', PIXI.Texture.from(bgPortraitUrl));
      this._uiTextures.set('reels_frame', PIXI.Texture.from(reelsFrameUrl));
      this._uiTextures.set('start_landscape', PIXI.Texture.from(startLandscapeUrl));
      this._uiTextures.set('start_portrait', PIXI.Texture.from(startPortraitUrl));
      this._uiTextures.set('bonus_bg', PIXI.Texture.from(bonusBgUrl));
      this._uiTextures.set('click_to_next', PIXI.Texture.from(clickToNextUrl));
      this._uiTextures.set('top_grass', PIXI.Texture.from(topGrassUrl));
      this._uiTextures.set('brand_logo', PIXI.Texture.from(brandLogoUrl));
      this._uiTextures.set('sound_on', PIXI.Texture.from(soundOnUrl));
      this._uiTextures.set('sound_off', PIXI.Texture.from(soundOffUrl));
      this._uiTextures.set('bottom_strip', PIXI.Texture.from(bottomStripUrl));
      this._uiTextures.set('spin_btn', PIXI.Texture.from(spinBtnUrl));
      this._uiTextures.set('spin_btn_disabled', PIXI.Texture.from(spinDisableUrl));
      this._uiTextures.set('spin_btn_hover', PIXI.Texture.from(spinHoverUrl));
      this._uiTextures.set('auto_spin_btn', PIXI.Texture.from(autoSpinBtnUrl));
      this._uiTextures.set('auto_spin_disabled', PIXI.Texture.from(autoSpinDisableUrl));
      this._uiTextures.set('auto_spin_hover', PIXI.Texture.from(autoSpinHoverUrl));
      this._uiTextures.set('auto_spin_stop_btn', PIXI.Texture.from(autoSpinStopBtnUrl));
      this._uiTextures.set('auto_spin_stop_hover', PIXI.Texture.from(autoSpinStopHoverUrl));
      this._uiTextures.set('setting_btn', PIXI.Texture.from(settingBtnUrl));
      this._uiTextures.set('setting_click', PIXI.Texture.from(settingClickUrl));
      this._uiTextures.set('setting_hover', PIXI.Texture.from(settingHoverUrl));
      this._uiTextures.set('info_btn', PIXI.Texture.from(infoBtnUrl));
      this._uiTextures.set('info_click', PIXI.Texture.from(infoClickUrl));
      this._uiTextures.set('info_hover', PIXI.Texture.from(infoHoverUrl));
      this._uiTextures.set('rules_btn', PIXI.Texture.from(rulesBtnUrl));
      this._uiTextures.set('rules_click', PIXI.Texture.from(rulesClickUrl));
      this._uiTextures.set('rules_hover', PIXI.Texture.from(rulesHoverUrl));
      this._uiTextures.set('history_btn', PIXI.Texture.from(historyBtnUrl));
      this._uiTextures.set('history_click', PIXI.Texture.from(historyClickUrl));
      this._uiTextures.set('history_hover', PIXI.Texture.from(historyHoverUrl));
      this._uiTextures.set('paytable_btn', PIXI.Texture.from(paytableBtnUrl));
      this._uiTextures.set('paytable_click', PIXI.Texture.from(paytableClickUrl));
      this._uiTextures.set('paytable_hover', PIXI.Texture.from(paytableHoverUrl));
      this._uiTextures.set('total_bet_bg', PIXI.Texture.from(totalBetBgUrl));
      this._uiTextures.set('bet_btn_portrait', PIXI.Texture.from(betBtnPortraitUrl));
      this._uiTextures.set('bet_btn_portrait_disabled', PIXI.Texture.from(betBtnPortraitDisabledUrl));
      this._uiTextures.set('spin_btn_portrait', PIXI.Texture.from(spinBtnPortraitUrl));
      this._uiTextures.set('spin_btn_portrait_disabled', PIXI.Texture.from(spinBtnPortraitDisabledUrl));
      this._uiTextures.set('auto_spin_btn_portrait', PIXI.Texture.from(autospinBtnPortraitUrl));
      this._uiTextures.set('auto_spin_btn_portrait_disabled', PIXI.Texture.from(autospinBtnPortraitDisabledUrl));
      this._uiTextures.set('settings_btn_portrait', PIXI.Texture.from(settingsBtnPortraitUrl));
      this._uiTextures.set('settings_btn_portrait_disabled', PIXI.Texture.from(settingsBtnPortraitDisabledUrl));
      this._uiTextures.set('info_btn_portrait', PIXI.Texture.from(infoBtnPortraitUrl));
      this._uiTextures.set('info_btn_portrait_disabled', PIXI.Texture.from(infoBtnPortraitDisabledUrl));
      this._uiTextures.set('tab_settings', PIXI.Texture.from(tabSettingsUrl));
      this._uiTextures.set('tab_settings_active', PIXI.Texture.from(tabSettingsActiveUrl));
      this._uiTextures.set('tab_snd_on', PIXI.Texture.from(tabSndOnUrl));
      this._uiTextures.set('tab_snd_off', PIXI.Texture.from(tabSndOffUrl));
      this._uiTextures.set('tab_paytable', PIXI.Texture.from(tabPaytableUrl));
      this._uiTextures.set('tab_paytable_active', PIXI.Texture.from(tabPaytableActiveUrl));
      this._uiTextures.set('tab_info', PIXI.Texture.from(tabInfoUrl));
      this._uiTextures.set('tab_info_active', PIXI.Texture.from(tabInfoActiveUrl));
      this._uiTextures.set('tab_history', PIXI.Texture.from(tabHistoryUrl));
      this._uiTextures.set('tab_history_active', PIXI.Texture.from(tabHistoryActiveUrl));
      this._uiTextures.set('tab_close', PIXI.Texture.from(tabCloseUrl));
      this._uiTextures.set('tab_close_pressed', PIXI.Texture.from(tabClosePressedUrl));
      this._uiTextures.set('bonus_enable', PIXI.Texture.from(bonusEnableUrl));
      this._uiTextures.set('bonus_disable', PIXI.Texture.from(bonusDisableUrl));
      this._uiTextures.set('grass_of_bonus', PIXI.Texture.from(grassOfBonusUrl));
      this._uiTextures.set('grass_of_bonus_behind', PIXI.Texture.from(grassOfBonusBehindUrl));
      this._uiTextures.set('grass_portrait', PIXI.Texture.from(grassPortraitUrl));
      this._uiTextures.set('buy_bonus', PIXI.Texture.from(buyBonusUrl));
      this._uiTextures.set('buy_bonus_2', PIXI.Texture.from(buyBonus2Url));
      this._uiTextures.set('portrait_buy_bonus', PIXI.Texture.from(portraitBuyBonusUrl));
      this._uiTextures.set('portrait_buy_bonus_2', PIXI.Texture.from(portraitBuyBonus2Url));
      this._uiTextures.set('buy_bonus_confirm_popup', PIXI.Texture.from(buyBonusConfirmPopupUrl));
      this._uiTextures.set('bg_buy_bonus_confirm_popup', PIXI.Texture.from(bgBuyBonusConfirmPopupUrl));
      this._uiTextures.set('no_buy_bonus', PIXI.Texture.from(noBuyBonusUrl));
      this._uiTextures.set('no_buy_bonus_hover', PIXI.Texture.from(noBuyBonusHoverUrl));
      this._uiTextures.set('yes_buy_bonus', PIXI.Texture.from(yesBuyBonusUrl));
      this._uiTextures.set('yes_buy_bonus_hover', PIXI.Texture.from(yesBuyBonusHoverUrl));
      this._uiTextures.set('bg_shine', PIXI.Texture.from(bgShineUrl));
      this._uiTextures.set('ribbon', PIXI.Texture.from(ribbonUrl));

      const giftUrlsFb = [
        { num: 1, url: gift1Url, hoverUrl: gift1HoverUrl, openUrl: gift1OpenUrl },
        { num: 2, url: gift2Url, hoverUrl: gift2HoverUrl, openUrl: gift2OpenUrl },
        { num: 3, url: gift3Url, hoverUrl: gift3HoverUrl, openUrl: gift3OpenUrl },
        { num: 4, url: gift4Url, hoverUrl: gift4HoverUrl, openUrl: gift4OpenUrl },
        { num: 5, url: gift5Url, hoverUrl: gift5HoverUrl, openUrl: gift5OpenUrl },
      ];
      for (const g of giftUrlsFb) {
        this._uiTextures.set(`gift${g.num}`, PIXI.Texture.from(g.url));
        this._uiTextures.set(`gift${g.num}hover`, PIXI.Texture.from(g.hoverUrl));
        this._uiTextures.set(`gift${g.num}open`, PIXI.Texture.from(g.openUrl));
      }

      this._uiTextures.set('bunch_1', PIXI.Texture.from(bunch1Url));
      this._uiTextures.set('bunch_2', PIXI.Texture.from(bunch2Url));
      this._uiTextures.set('bunch_3', PIXI.Texture.from(bunch3Url));
      this._uiTextures.set('bunch_4', PIXI.Texture.from(bunch4Url));
      this._uiTextures.set('bunch_5', PIXI.Texture.from(bunch5Url));
      this._uiTextures.set('win_bg_symbol', PIXI.Texture.from(winBgSymbolUrl));
    }

    // Load Spine animation data (gift & bonus_game_pop_up)
    try {
      const giftTexture = await PIXI.Assets.load(giftTextureUrl);
      const atlas = new TextureAtlas(giftAtlasRaw, (line, callback) => {
        callback(giftTexture.baseTexture || giftTexture);
      });
      const atlasLoader = new AtlasAttachmentLoader(atlas);
      const skeletonJson = new SkeletonJson(atlasLoader);
      const giftSpineData = skeletonJson.readSkeletonData(giftJsonData);
      this._spineDatas.set('gift', giftSpineData);
    } catch (err) {
      console.warn('Could not load Spine gift animation data:', err);
    }

    try {
      const popUpTexture = await PIXI.Assets.load(bonusPopUpTextureUrl);
      const atlas = new TextureAtlas(bonusPopUpAtlasRaw, (line, callback) => {
        callback(popUpTexture.baseTexture || popUpTexture);
      });
      const atlasLoader = new AtlasAttachmentLoader(atlas);
      const skeletonJson = new SkeletonJson(atlasLoader);
      const popUpSpineData = skeletonJson.readSkeletonData(bonusPopUpJsonData);
      this._spineDatas.set('bonus_game_pop_up', popUpSpineData);
    } catch (err) {
      console.warn('Could not load Spine bonus_game_pop_up animation data:', err);
    }

    try {
      const winsTexture = await PIXI.Assets.load(winsPopUpTextureUrl);
      const atlas = new TextureAtlas(winsPopUpAtlasRaw, (line, callback) => {
        callback(winsTexture.baseTexture || winsTexture);
      });
      const atlasLoader = new AtlasAttachmentLoader(atlas);
      const skeletonJson = new SkeletonJson(atlasLoader);
      const winsSpineData = skeletonJson.readSkeletonData(winsPopUpJsonData);
      this._spineDatas.set('wins_pop_up', winsSpineData);
    } catch (err) {
      console.warn('Could not load Spine wins_pop_up animation data:', err);
    }

    // Load Spine animation data for bunch_1..bunch_5
    const bunchSpines = [
      { key: 'bunch_1', json: bunch1JsonData, atlas: bunch1AtlasRaw, url: bunch1Url },
      { key: 'bunch_2', json: bunch2JsonData, atlas: bunch2AtlasRaw, url: bunch2Url },
      { key: 'bunch_3', json: bunch3JsonData, atlas: bunch3AtlasRaw, url: bunch3Url },
      { key: 'bunch_4', json: bunch4JsonData, atlas: bunch4AtlasRaw, url: bunch4Url },
      { key: 'bunch_5', json: bunch5JsonData, atlas: bunch5AtlasRaw, url: bunch5Url },
    ];

    for (const b of bunchSpines) {
      try {
        const tex = await PIXI.Assets.load(b.url);
        const atlas = new TextureAtlas(b.atlas, (line, callback) => {
          callback(tex.baseTexture || tex);
        });
        const atlasLoader = new AtlasAttachmentLoader(atlas);
        const skeletonJson = new SkeletonJson(atlasLoader);
        const spineData = skeletonJson.readSkeletonData(b.json);
        this._spineDatas.set(b.key, spineData);
      } catch (err) {
        console.warn(`Could not load Spine data for ${b.key}:`, err);
      }
    }

    // Load symbol spine win animations (sym_seven, sym_star, sym_bells, sym_mitten, sym_ball, sym_cookie, sym_stick, sym_hat, sym_elf)
    const symbolSpines = [
      { key: 'sym_seven', json: symSpineSevenJson, atlas: symSpineSevenAtlas, url: symSpineSevenUrl },
      { key: 'sym_star', json: symSpineStarJson, atlas: symSpineStarAtlas, url: symSpineStarUrl },
      { key: 'sym_bells', json: symSpineBellsJson, atlas: symSpineBellsAtlas, url: symSpineBellsUrl },
      { key: 'sym_mitten', json: symSpineMittenJson, atlas: symSpineMittenAtlas, url: symSpineMittenUrl },
      { key: 'sym_ball', json: symSpineBallJson, atlas: symSpineBallAtlas, url: symSpineBallUrl },
      { key: 'sym_cookie', json: symSpineCookieJson, atlas: symSpineCookieAtlas, url: symSpineCookieUrl },
      { key: 'sym_stick', json: symSpineStickJson, atlas: symSpineStickAtlas, url: symSpineStickUrl },
      { key: 'sym_hat', json: symSpineHatJson, atlas: symSpineHatAtlas, url: symSpineHatUrl },
      { key: 'sym_elf', json: symSpineElfJson, atlas: symSpineElfAtlas, url: symSpineElfUrl },
    ];

    for (const s of symbolSpines) {
      try {
        const tex = await PIXI.Assets.load(s.url);
        const atlas = new TextureAtlas(s.atlas, (line, callback) => {
          callback(tex.baseTexture || tex);
        });
        const atlasLoader = new AtlasAttachmentLoader(atlas);
        const skeletonJson = new SkeletonJson(atlasLoader);
        const spineData = skeletonJson.readSkeletonData(s.json);
        this._spineDatas.set(s.key, spineData);
      } catch (err) {
        console.warn(`Could not load symbol spine data for ${s.key}:`, err);
      }
    }

    // Load coin spritesheet textures
    this._coinTextures = [];
    try {
      const coinBaseTex = await PIXI.Assets.load(coinTextureUrl);
      const coinSpritesheet = new PIXI.Spritesheet(coinBaseTex, coinJsonData);
      await coinSpritesheet.parse();
      for (let i = 0; i <= 31; i++) {
        const frameName = `coin${String(i).padStart(4, '0')}.png`;
        if (coinSpritesheet.textures[frameName]) {
          this._coinTextures.push(coinSpritesheet.textures[frameName]);
        }
      }
    } catch (err) {
      console.warn('Could not load coin spritesheet:', err);
    }

    // UI textures
    this._uiTextures.set('reel_bg', this._createReelBg()); step();
    this._uiTextures.set('frame', this._createFrame()); step();
    this._uiTextures.set('background', this._createBackground()); step();
  }

  /** Get loaded coin textures array for animations. */
  getCoinTextures() {
    return this._coinTextures || [];
  }

  /**
   * Get loaded Spine data by key ('gift', 'bonus_game_pop_up', 'bunch_1'..'bunch_5').
   * @param {string} key
   */
  getSpineData(key) {
    return this._spineDatas.get(key);
  }

  /** Get a cached high-res symbol texture by symbol ID. */
  getSymbolTexture(id) {
    let symId = id;
    if (typeof id === 'string') {
      const stringToId = {
        seven: SYMBOL_IDS.SEVEN,
        star: SYMBOL_IDS.STAR,
        bell: SYMBOL_IDS.BELL,
        mitten: SYMBOL_IDS.MITTEN,
        glove: SYMBOL_IDS.MITTEN,
        ornament: SYMBOL_IDS.ORNAMENT,
        ball: SYMBOL_IDS.ORNAMENT,
        gingerbread: SYMBOL_IDS.GINGERBREAD,
        bread: SYMBOL_IDS.GINGERBREAD,
        candy_cane: SYMBOL_IDS.CANDY_CANE,
        cane: SYMBOL_IDS.CANDY_CANE,
        santa_hat: SYMBOL_IDS.SANTA_HAT,
        hat: SYMBOL_IDS.SANTA_HAT,
        bonus: SYMBOL_IDS.BONUS,
      };
      if (stringToId[id.toLowerCase()] !== undefined) {
        symId = stringToId[id.toLowerCase()];
      }
    }
    return this._symbolTextures.get(symId) ?? PIXI.Texture.WHITE;
  }

  /** Get a cached UI texture by name. */
  getUITexture(name) {
    return this._uiTextures.get(name) ?? PIXI.Texture.WHITE;
  }

  /** Get a cached SpineData object by name. */
  getSpineData(name) {
    return this._spineDatas.get(name) ?? null;
  }

  // ── Private texture factories ────────────────────────────────

  _createSymbolTexture(id) {
    const cfg = SymbolConfig[id];
    const size = GameConfig.SYMBOL_SIZE;
    const g = new PIXI.Graphics();

    // ── Background tile ─────────────────────────────────────
    g.beginFill(cfg.bgColor, 1);
    g.drawRoundedRect(0, 0, size, size, 14);
    g.endFill();

    // ── Inner gradient overlay ───────────────────────────────
    g.beginFill(0xFFFFFF, 0.06);
    g.drawRoundedRect(4, 4, size - 8, (size - 8) * 0.5, 10);
    g.endFill();

    // ── Border ───────────────────────────────────────────────
    g.lineStyle(2, cfg.primary, 0.7);
    g.drawRoundedRect(2, 2, size - 4, size - 4, 12);
    g.endFill();

    // ── Glow corner accent ───────────────────────────────────
    g.lineStyle(0);
    g.beginFill(cfg.glow, 0.15);
    g.drawCircle(size * 0.85, size * 0.15, size * 0.2);
    g.endFill();

    // ── Emoji label (rendered as PIXI.Text, then added to g) ─
    // We create a child text to put on top
    const text = new PIXI.Text(cfg.label, {
      fontSize: id === SYMBOL_IDS.SEVEN ? 64 : 52,
      fill: cfg.primary,
      stroke: cfg.accent,
      strokeThickness: 3,
      dropShadow: true,
      dropShadowColor: cfg.glow,
      dropShadowBlur: 6,
      dropShadowDistance: 0,
      fontWeight: 'bold',
      fontFamily: 'Outfit, Arial, sans-serif',
    });
    text.anchor.set(0.5);
    text.position.set(size * 0.5, size * 0.52);

    // Render to texture
    const container = new PIXI.Container();
    container.addChild(g, text);
    const tex = this._app.renderer.generateTexture(container, {
      resolution: 1,
      region: new PIXI.Rectangle(0, 0, size, size),
    });
    container.destroy({ children: true });
    return tex;
  }

  _createReelBg() {
    const w = GameConfig.SYMBOL_SIZE + GameConfig.REEL_GAP;
    const h = GameConfig.SYMBOL_SIZE * GameConfig.ROWS + GameConfig.REEL_GAP;
    const g = new PIXI.Graphics();
    g.beginFill(0x080015, 0.95);
    g.drawRoundedRect(0, 0, w, h, 10);
    g.endFill();
    g.lineStyle(1, 0x330055, 0.6);
    g.drawRoundedRect(0, 0, w, h, 10);
    const tex = this._app.renderer.generateTexture(g);
    g.destroy();
    return tex;
  }

  _createFrame() {
    const S = GameConfig.SYMBOL_SIZE;
    const pad = 20;
    const cols = GameConfig.REELS;
    const rows = GameConfig.ROWS;
    const w = cols * (S + GameConfig.REEL_GAP) + pad * 2;
    const h = rows * S + pad * 2;
    const g = new PIXI.Graphics();

    // Outer glow border
    g.lineStyle(6, 0xAA0044, 0.8);
    g.drawRoundedRect(0, 0, w, h, 18);
    g.lineStyle(3, 0xFF0066, 0.5);
    g.drawRoundedRect(4, 4, w - 8, h - 8, 14);

    // Corner ornaments
    const corners = [[0, 0], [w, 0], [0, h], [w, h]];
    corners.forEach(([cx, cy]) => {
      g.lineStyle(0);
      g.beginFill(0xFFD700, 0.9);
      g.drawCircle(cx, cy, 8);
      g.endFill();
      g.beginFill(0xFF0044, 0.9);
      g.drawCircle(cx, cy, 4);
      g.endFill();
    });

    const tex = this._app.renderer.generateTexture(g,
      { region: new PIXI.Rectangle(0, 0, w, h) });
    g.destroy();
    return tex;
  }

  _createSpinBtn(active) {
    const r = 46;
    const d = r * 2;
    const g = new PIXI.Graphics();
    const c1 = active ? 0xFF2200 : 0xCC1100;
    const c2 = active ? 0xFF6600 : 0xFF3300;
    // Outer ring
    g.lineStyle(4, 0xFFD700, 1);
    g.beginFill(c1);
    g.drawCircle(r, r, r);
    g.endFill();
    // Highlight
    g.lineStyle(0);
    g.beginFill(0xFFFFFF, 0.15);
    g.drawEllipse(r, r * 0.55, r * 0.65, r * 0.3);
    g.endFill();
    const tex = this._app.renderer.generateTexture(g,
      { region: new PIXI.Rectangle(0, 0, d, d) });
    g.destroy();
    return tex;
  }

  _createBackground() {
    const W = GameConfig.WIDTH;
    const H = GameConfig.HEIGHT;
    const g = new PIXI.Graphics();
    // Deep navy gradient approximation
    g.beginFill(0x05000F);
    g.drawRect(0, 0, W, H);
    g.endFill();
    // Snow ground
    g.beginFill(0x1a1040, 0.6);
    g.drawEllipse(W * 0.5, H + 40, W * 0.8, 80);
    g.endFill();
    const tex = this._app.renderer.generateTexture(g,
      { region: new PIXI.Rectangle(0, 0, W, H) });
    g.destroy();
    return tex;
  }

  /** Yield one animation frame (keeps loading UI smooth). */
  _frame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
  }

  destroy() {
    this._symbolTextures.forEach(t => t.destroy());
    this._uiTextures.forEach(t => t.destroy());
    this._symbolTextures.clear();
    this._uiTextures.clear();
  }
}

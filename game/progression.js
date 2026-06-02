/* ===== Hexagon Puzzle — Progression System ===== */
(function() {
  'use strict';

  const SAVE_KEY = 'hexp_progress';

  const UPGRADE_TIERS = {
    weapon: {
      name: 'Hex (Weapon)',
      icon: '⬡',
      maxLevel: 5,
      baseCost: 1000,
      costMultiplier: 2,
      gemCost: 50,
      levels: [
        { level: 0, name: 'Basic Hex',        bonus: { scoreMult: 1.0, pieceBonus: 0 },   gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Stone Hex',        bonus: { scoreMult: 1.1, pieceBonus: 5 },   gemReq: 50,  coinsReq: 1000 },
        { level: 2, name: 'Iron Hex',         bonus: { scoreMult: 1.2, pieceBonus: 10 },  gemReq: 80,  coinsReq: 2000 },
        { level: 3, name: 'Steel Hex',        bonus: { scoreMult: 1.35, pieceBonus: 20 }, gemReq: 120, coinsReq: 4000 },
        { level: 4, name: 'Neon Hex',         bonus: { scoreMult: 1.5, pieceBonus: 35 },  gemReq: 200, coinsReq: 8000 },
        { level: 5, name: '⚡ Void Hex',      bonus: { scoreMult: 2.0, pieceBonus: 60 },  gemReq: 500, coinsReq: 20000 },
      ]
    },
    case: {
      name: 'Grid (Case)',
      icon: '🔲',
      maxLevel: 5,
      baseCost: 800,
      costMultiplier: 2,
      gemCost: 50,
      levels: [
        { level: 0, name: 'Small Grid',       bonus: { bonusCells: 0, startRows: 3 },     gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Medium Grid',      bonus: { bonusCells: 1, startRows: 3 },     gemReq: 40,  coinsReq: 800 },
        { level: 2, name: 'Large Grid',       bonus: { bonusCells: 2, startRows: 4 },     gemReq: 70,  coinsReq: 1600 },
        { level: 3, name: 'Expanded Grid',    bonus: { bonusCells: 3, startRows: 4 },     gemReq: 100, coinsReq: 3200 },
        { level: 4, name: 'Huge Grid',        bonus: { bonusCells: 4, startRows: 5 },     gemReq: 180, coinsReq: 6400 },
        { level: 5, name: '💎 Infinite Grid', bonus: { bonusCells: 5, startRows: 5 },     gemReq: 400, coinsReq: 16000 },
      ]
    },
    outfit: {
      name: 'Frame (Outfit)',
      icon: '🖼️',
      maxLevel: 5,
      baseCost: 600,
      costMultiplier: 2,
      gemCost: 40,
      levels: [
        { level: 0, name: 'Plain Frame',      bonus: { comboBonus: 0, chainMult: 1.0 },   gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Wood Frame',       bonus: { comboBonus: 5, chainMult: 1.1 },   gemReq: 30,  coinsReq: 600 },
        { level: 2, name: 'Metal Frame',      bonus: { comboBonus: 10, chainMult: 1.2 },  gemReq: 60,  coinsReq: 1200 },
        { level: 3, name: 'Gold Frame',       bonus: { comboBonus: 15, chainMult: 1.35 }, gemReq: 90,  coinsReq: 2400 },
        { level: 4, name: 'Crystal Frame',    bonus: { comboBonus: 25, chainMult: 1.5 },  gemReq: 150, coinsReq: 4800 },
        { level: 5, name: '🔥 Phoenix Frame', bonus: { comboBonus: 40, chainMult: 2.0 },  gemReq: 350, coinsReq: 12000 },
      ]
    }
  };

  const PREMIUM_ITEMS = {
    legendarySkins: [
      { id: 'lg_void',       name: 'Void Hex',      desc: 'Dark matter hex skin',          price: 4.99,  gemPrice: 0, type: 'legendary', tier: 'legendary' },
      { id: 'lg_cosmic',     name: 'Cosmic Hex',    desc: 'Galaxy-themed hex pieces',      price: 6.99,  gemPrice: 0, type: 'legendary', tier: 'legendary' },
      { id: 'lg_flame',      name: 'Inferno Hex',   desc: 'Living flame hex pieces',       price: 8.99,  gemPrice: 0, type: 'legendary', tier: 'legendary' },
    ],
    premiumCases: [
      { id: 'pc_royal',      name: 'Royal Pass',    desc: '7 days: 2x points + 50 gems/day', price: 4.99,  gemPrice: 0, type: 'subscription', duration: '7d' },
      { id: 'pc_vip',        name: 'VIP Status',    desc: '30 days: 3x points + 100 gems/day', price: 12.99, gemPrice: 0, type: 'subscription', duration: '30d' },
    ],
    bundles: [
      { id: 'bundle_starter',  name: 'Starter Bundle',   desc: '200 gems + 5000 score boost',                  price: 2.99,  gemPrice: 0, type: 'one_time' },
      { id: 'bundle_mega',     name: 'Mega Hex Pack',    desc: '500 gems + 20000 score + neon theme',          price: 7.99,  gemPrice: 0, type: 'one_time' },
      { id: 'bundle_ultimate', name: 'Ultimate Bundle',  desc: '2000 gems + all themes + legendary hex skin',  price: 19.99, gemPrice: 0, type: 'one_time' },
    ],
    removeAds: { id: 'remove_ads', name: 'Remove Ads', desc: 'Permanently remove all ads', price: 2.99, gemPrice: 0, type: 'one_time' },
  };

  const GEM_PACKS = [
    { id: 'gems_small',  name: 'Small Gem Pack',    gems: 100,  price: 0.99,  bonus: 0,    popular: false },
    { id: 'gems_medium', name: 'Standard Gem Pack', gems: 500,  price: 3.99,  bonus: 50,   popular: true  },
    { id: 'gems_large',  name: 'Large Gem Pack',    gems: 1200, price: 7.99,  bonus: 200,  popular: false },
    { id: 'gems_mega',   name: 'Mega Gem Pack',     gems: 4000, price: 19.99, bonus: 1000, popular: false },
    { id: 'gems_ultra',  name: '🐳 Whale Pack',     gems: 10000,price: 39.99, bonus: 5000, popular: false },
  ];

  const CATALOG = {
    themes: [
      { id: 'default',   name: 'Classic Dark', price: 0,    desc: 'Original dark theme',          colors: { bg: '#0f1020', accent: '#1a1a2e' } },
      { id: 'ocean',     name: 'Ocean Blue',   price: 500,  desc: 'Calming ocean blues',          colors: { bg: '#023047', accent: '#0a4a6e' } },
      { id: 'sunset',    name: 'Sunset Glow',  price: 800,  desc: 'Warm sunset orange & pink',    colors: { bg: '#2d1b3d', accent: '#4a1a3a' } },
      { id: 'neon',      name: 'Neon Nights',  price: 1500, desc: 'Bright neon on dark purple',   colors: { bg: '#1a0030', accent: '#2a0050' } },
    ],
    hexStyles: [
      { id: 'classic',    name: 'Classic Hex',  price: 0,    desc: 'Original hex style',      glow: false, border: true },
      { id: 'rounded',    name: 'Soft Hex',     price: 600,  desc: 'Smoother hex edges',      glow: false, border: true },
      { id: 'glow',       name: 'Glow Hex',     price: 1200, desc: 'Hex with subtle glow',   glow: true,  border: true },
      { id: 'crystal',    name: 'Crystal Hex',  price: 2000, desc: 'Transparent crystal hex', glow: true,  border: false },
    ],
    boosters: [
      { id: 'score_x2',   name: 'Score Booster',   price: 500,  desc: '2x score for next game',   effect: 'scoreMultiplier:2' },
      { id: 'extra_row',  name: 'Row Clear',       price: 800,  desc: 'Auto-clear one row once',  effect: 'autoClear:1' },
    ],
  };

  const ACHIEVEMENTS = [
    { id: 'first_place',   name: 'First Placement',desc: 'Place your first hex piece',        reward: { coins: 50,  gems: 0 },  icon: '⬡', check: p => p.totalPlaced >= 1 },
    { id: 'score_100',     name: 'Century',        desc: 'Score 100 in one game',            reward: { coins: 100, gems: 0 },  icon: '💯', check: p => p.bestScore >= 100 },
    { id: 'score_500',     name: 'High Scorer',    desc: 'Score 500 in one game',            reward: { coins: 250, gems: 0 },  icon: '🎯', check: p => p.bestScore >= 500 },
    { id: 'score_1000',    name: 'Hex Master',     desc: 'Score 1000 in one game',           reward: { coins: 1000, gems: 15 },icon: '🏆', check: p => p.bestScore >= 1000 },
    { id: 'score_5000',    name: 'Legendary Hex',  desc: 'Score 5000 in one game',           reward: { coins: 5000, gems: 50 },icon: '🌟', check: p => p.bestScore >= 5000 },
    { id: 'rows_5',        name: 'Row Clearer',    desc: 'Clear 5 rows total',               reward: { coins: 100, gems: 0 },  icon: '📏', check: p => p.totalRows >= 5 },
    { id: 'rows_25',       name: 'Row Runner',     desc: 'Clear 25 rows total',              reward: { coins: 300, gems: 5 },  icon: '📐', check: p => p.totalRows >= 25 },
    { id: 'rows_100',      name: 'Hex Legend',     desc: 'Clear 100 rows total',             reward: { coins: 2000, gems: 30 },icon: '💠', check: p => p.totalRows >= 100 },
    { id: 'weapon_1',      name: 'Hex Up',         desc: 'Upgrade Hex to level 1',           reward: { coins: 200, gems: 0 },  icon: '⬡', check: p => (p.upgrades?.weapon || 0) >= 1 },
    { id: 'weapon_5',      name: 'Hex Master',     desc: 'Reach max Hex level',              reward: { coins: 2000, gems: 50 },icon: '🗡️', check: p => (p.upgrades?.weapon || 0) >= 5 },
    { id: 'case_1',        name: 'Grid Up',        desc: 'Upgrade Grid to level 1',          reward: { coins: 200, gems: 0 },  icon: '🔲', check: p => (p.upgrades?.case || 0) >= 1 },
    { id: 'case_5',        name: 'Grid Master',    desc: 'Reach max Grid level',             reward: { coins: 2000, gems: 50 },icon: '💎', check: p => (p.upgrades?.case || 0) >= 5 },
    { id: 'outfit_1',      name: 'Framed',         desc: 'Upgrade Frame to level 1',         reward: { coins: 200, gems: 0 },  icon: '🖼️', check: p => (p.upgrades?.outfit || 0) >= 1 },
    { id: 'outfit_5',      name: 'Frame Master',   desc: 'Reach max Frame level',            reward: { coins: 2000, gems: 50 },icon: '👘', check: p => (p.upgrades?.outfit || 0) >= 5 },
    { id: 'gems_100',      name: 'Gem Collector',  desc: 'Earn 100 total gems',             reward: { coins: 500, gems: 20 }, icon: '💎', check: p => p.totalGems >= 100 },
    { id: 'combo_2',       name: 'Combo Starter',  desc: 'Clear 2 rows in one placement',   reward: { coins: 200, gems: 0 },  icon: '2️⃣', check: p => p.bestCombo >= 2 },
    { id: 'combo_3',       name: 'Triple Clear',   desc: 'Clear 3 rows in one placement',   reward: { coins: 500, gems: 10 }, icon: '3️⃣', check: p => p.bestCombo >= 3 },
  ];

  function defaultState() {
    return {
      coins: 100, gems: 0, totalGems: 0, xp: 0, level: 1,
      bestScore: 0, bestCombo: 0, totalPlaced: 0, totalRows: 0, totalPlays: 0,
      upgrades: { weapon: 0, case: 0, outfit: 0 },
      ownedThemes: ['default'], ownedHexStyles: ['classic'],
      activeTheme: 'default', activeHexStyle: 'classic',
      activeBoosters: {}, inventory: {}, achievements: {},
      lastSaveDate: null, adFree: false, subscriptions: {},
    };
  }

  let state = null;

  function save() { state.lastSaveDate = new Date().toISOString(); try {localStorage.setItem(SAVE_KEY, JSON.stringify(state));}catch(e){} }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) { state = {...defaultState(), ...JSON.parse(raw)}; if(!state.upgrades)state.upgrades={weapon:0,case:0,outfit:0}; if(!state.gems&&state.gems!==0)state.gems=0; if(!state.totalGems)state.totalGems=0; save();return true;}
    }catch(e){}
    reset(); return false;
  }
  function reset() { state = defaultState(); save(); }
  function xpForLevel(lvl) { return Math.floor(100 * Math.pow(1.2, lvl-1)); }
  function addXp(amount) { if(!state)return false; state.xp+=amount; let lvl=false; while(state.xp>=xpForLevel(state.level)){state.xp-=xpForLevel(state.level);state.level++;lvl=true;} save(); return lvl; }
  function addCoins(a) { if(!state)return 0; state.coins+=a; save(); return state.coins; }
  function spendCoins(a) { if(!state||state.coins<a)return false; state.coins-=a; save(); return true; }
  function addGems(a) { if(!state)return 0; state.gems+=a; state.totalGems+=a; save(); return state.gems; }
  function spendGems(a) { if(!state||state.gems<a)return false; state.gems-=a; save(); return true; }
  function getUpgradeCost(cat, cur) { const t=UPGRADE_TIERS[cat]; if(!t)return null; const n=t.levels.find(l=>l.level===cur+1); return n?{coins:n.coinsReq,gems:n.gemReq}:null; }
  function upgradeItem(cat,useGems) {
    if(!state)return{success:false,reason:'no_state'}; const t=UPGRADE_TIERS[cat]; if(!t)return{success:false,reason:'invalid'};
    const cur=state.upgrades[cat]||0; if(cur>=t.maxLevel)return{success:false,reason:'max'};
    const c=getUpgradeCost(cat,cur); if(!c)return{success:false,reason:'no_data'};
    if(useGems){if(state.gems<c.gems)return{success:false,reason:'not_enough_gems'};spendGems(c.gems);}else{if(state.coins<c.coins)return{success:false,reason:'not_enough_coins'};spendCoins(c.coins);}
    state.upgrades[cat]++; save(); return{success:true,newLevel:state.upgrades[cat]};
  }
  function getActiveBonuses() {
    if(!state)return{scoreMult:1,pieceBonus:0,bonusCells:0,startRows:3,comboBonus:0,chainMult:1};
    const b={scoreMult:1,pieceBonus:0,bonusCells:0,startRows:3,comboBonus:0,chainMult:1};
    const w=state.upgrades.weapon||0; const wd=UPGRADE_TIERS.weapon.levels[w]; if(wd){b.scoreMult=wd.bonus.scoreMult;b.pieceBonus=wd.bonus.pieceBonus;}
    const c=state.upgrades.case||0; const cd=UPGRADE_TIERS.case.levels[c]; if(cd){b.bonusCells=cd.bonus.bonusCells;b.startRows=cd.bonus.startRows;}
    const o=state.upgrades.outfit||0; const od=UPGRADE_TIERS.outfit.levels[o]; if(od){b.comboBonus=od.bonus.comboBonus;b.chainMult=od.bonus.chainMult;}
    return b;
  }
  function ownsPremiumItem(id) { return state&&state.inventory&&state.inventory[id]===true; }
  function purchasePremiumItem(id) { if(!state)return false; state.inventory[id]=true; if(id==='remove_ads'){state.adFree=true;if(typeof AdsManager!=='undefined'&&AdsManager.onAdsRemoved)AdsManager.onAdsRemoved();} const bg={bundle_starter:200,bundle_mega:500,bundle_ultimate:2000}; if(bg[id])addGems(bg[id]); save(); return true; }
  function checkAchievements() {
    if(!state)return[]; const u=[];
    for(const a of ACHIEVEMENTS){if(state.achievements[a.id])continue;if(a.check(state)){state.achievements[a.id]=true;addCoins(a.reward.coins);if(a.reward.gems)addGems(a.reward.gems);u.push(a);}}
    if(u.length>0)save(); return u;
  }
  function endOfGame(result) {
    if(!state)return; state.totalPlays++;
    if(result.score>state.bestScore)state.bestScore=result.score;
    if((result.combo||0)>state.bestCombo)state.bestCombo=result.combo||0;
    state.totalPlaced+=result.placed||0;
    state.totalRows+=result.rows||0;
    const xp=Math.floor(result.score/10)+(result.rows||0)*5+20; addXp(xp);
    const coins=Math.floor(result.score/20)+(result.rows||0)*2+5; addCoins(coins);
    save();
  }
  function getState(){return state;}
  function getUpgradeTiers(){return UPGRADE_TIERS;}
  function getPremiumItems(){return PREMIUM_ITEMS;}
  function getGemPacks(){return GEM_PACKS;}
  function getCatalog(){return CATALOG;}
  function getAchievements(){return ACHIEVEMENTS;}
  function getCoinBalance(){return state?state.coins:0;}
  function getGemBalance(){return state?state.gems:0;}

  window.ProgressionSystem = {
    load,save,reset,addCoins,spendCoins,getCoinBalance,addGems,spendGems,getGemBalance,
    addXp,xpForLevel,upgradeItem,getUpgradeCost,getActiveBonuses,getUpgradeTiers,UPGRADE_TIERS,
    getPremiumItems,PREMIUM_ITEMS,getGemPacks,GEM_PACKS,ownsPremiumItem,purchasePremiumItem,
    getCatalog,CATALOG,getAchievements,ACHIEVEMENTS,checkAchievements,endOfGame,getState,defaultState,
  };
})();

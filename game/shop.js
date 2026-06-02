/* ===== Hexagon Puzzle — Shop & IAP System ===== */
(function() {
  'use strict';
  let shopContainer = null;
  let activeTab = 'upgrades';
  function fmtPrice(p) { return '€' + p.toFixed(2); }
  function createShopPanel() {
    if(shopContainer){shopContainer.style.display='block';showTab(activeTab);return;}
    shopContainer=document.createElement('div');
    shopContainer.id='shop-panel';
    shopContainer.innerHTML=`<div class="shop-overlay"></div><div class="shop-window"><button class="shop-close">&times;</button><h2 class="shop-title">🛒 Shop</h2><div class="shop-balance-bar"><span class="balance-item"><span class="coin-icon">🪙</span> <span id="shop-coins">0</span></span><span class="balance-item"><span class="gem-icon">💎</span> <span id="shop-gems">0</span></span></div><div class="shop-tabs"><button class="shop-tab" data-tab="coins">🪙 Shop</button><button class="shop-tab" data-tab="gems">💎 Gems</button><button class="shop-tab" data-tab="upgrades">⚡ Upgrades</button><button class="shop-tab" data-tab="premium">👑 Premium</button></div><div class="shop-content" id="shop-content"></div></div>`;
    document.body.appendChild(shopContainer);
    shopContainer.querySelector('.shop-close').addEventListener('click',closeShop);
    shopContainer.querySelector('.shop-overlay').addEventListener('click',closeShop);
    shopContainer.querySelectorAll('.shop-tab').forEach(t=>t.addEventListener('click',()=>showTab(t.dataset.tab)));
    showTab('upgrades');updateBalances();
  }
  function closeShop(){if(shopContainer)shopContainer.style.display='none';}
  function showTab(tabId){
    activeTab=tabId; if(!shopContainer)return;
    shopContainer.querySelectorAll('.shop-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tabId));
    const c=shopContainer.querySelector('#shop-content');
    switch(tabId){case'coins':renderCoinShop(c);break;case'gems':renderGemShop(c);break;case'upgrades':renderUpgradeStation(c);break;case'premium':renderPremiumShop(c);break;}
    updateBalances();
  }
  function updateBalances(){const co=shopContainer?.querySelector('#shop-coins');const ge=shopContainer?.querySelector('#shop-gems');if(co)co.textContent=ProgressionSystem.getCoinBalance();if(ge)ge.textContent=ProgressionSystem.getGemBalance();}
  function renderCoinShop(container){
    const catalog=ProgressionSystem.getCatalog();const state=ProgressionSystem.getState();
    let h='<div class="shop-section"><h3>🎨 Themes</h3><div class="shop-grid">';
    for(const t of catalog.themes){const o=state.ownedThemes.includes(t.id);const a=state.activeTheme===t.id;h+=`<div class="shop-item ${o?'owned':''} ${a?'active':''}" data-type="theme" data-id="${t.id}" data-price="${t.price}"><div class="item-preview theme-preview" style="background:linear-gradient(135deg,${t.colors.bg},${t.colors.accent})"></div><div class="item-name">${t.name}</div><div class="item-desc">${t.desc}</div>${o?(a?'<span class="item-status">✓ Active</span>':'<button class="btn-equip">Equip</button>'):`<button class="btn-buy">🪙 ${t.price}</button>`}</div>`;}
    h+='</div></div><div class="shop-section"><h3>⬡ Hex Styles</h3><div class="shop-grid">';
    for(const s of catalog.hexStyles){const o=state.ownedHexStyles.includes(s.id);const a=state.activeHexStyle===s.id;h+=`<div class="shop-item ${o?'owned':''} ${a?'active':''}" data-type="hexStyle" data-id="${s.id}" data-price="${s.price}"><div class="item-name">${s.name}</div><div class="item-desc">${s.desc}</div>${o?(a?'<span class="item-status">✓ Active</span>':'<button class="btn-equip">Equip</button>'):`<button class="btn-buy">🪙 ${s.price}</button>`}</div>`;}
    h+='</div></div><div class="shop-section"><h3>🚀 Boosters</h3><div class="shop-grid">';
    for(const b of catalog.boosters){h+=`<div class="shop-item" data-type="booster" data-id="${b.id}" data-price="${b.price}"><div class="item-name">${b.name}</div><div class="item-desc">${b.desc}</div><button class="btn-buy">🪙 ${b.price}</button></div>`;}
    h+='</div></div>';container.innerHTML=h;
    container.querySelectorAll('.btn-buy').forEach(b=>b.addEventListener('click',e=>{const i=e.target.closest('.shop-item');handleCoinPurchase(i.dataset.type,i.dataset.id,parseInt(i.dataset.price),i);}));
    container.querySelectorAll('.btn-equip').forEach(b=>b.addEventListener('click',e=>{const i=e.target.closest('.shop-item');handleEquip(i.dataset.type,i.dataset.id);}));
  }
  function handleCoinPurchase(type,id,price){
    const state=ProgressionSystem.getState();
    if(type==='theme'&&state.ownedThemes.includes(id)){handleEquip('theme',id);return;}
    if(type==='hexStyle'&&state.ownedHexStyles.includes(id)){handleEquip('hexStyle',id);return;}
    if(!ProgressionSystem.spendCoins(price)){showNotification('Not enough coins!');return;}
    if(type==='theme'){state.ownedThemes.push(id);state.activeTheme=id;ProgressionSystem.save();}
    else if(type==='hexStyle'){state.ownedHexStyles.push(id);state.activeHexStyle=id;ProgressionSystem.save();}
    else if(type==='booster'){state.activeBoosters[id]=true;ProgressionSystem.save();}
    showNotification('Purchased! ✨');showTab('coins');
  }
  function handleEquip(type,id){
    const state=ProgressionSystem.getState();
    if(type==='theme'){if(!state.ownedThemes.includes(id))return;state.activeTheme=id;ProgressionSystem.save();showTab('coins');showNotification('Theme applied! ✅');}
    else if(type==='hexStyle'){if(!state.ownedHexStyles.includes(id))return;state.activeHexStyle=id;ProgressionSystem.save();showTab('coins');showNotification('Style applied! ✅');}
  }
  function renderGemShop(container){
    const packs=ProgressionSystem.getGemPacks();
    let h='<div class="shop-section"><h3>💎 Buy Gems</h3><p class="shop-subtitle">Premium currency for exclusive upgrades</p><div class="shop-grid gem-grid">';
    for(const p of packs){const t=p.gems+p.bonus;h+=`<div class="shop-item gem-pack ${p.popular?'popular':''}" data-id="${p.id}">${p.popular?'<div class="popular-badge">🔥 Best Value</div>':''}<div class="gem-amount">💎 ${t.toLocaleString()}</div>${p.bonus>0?`<div class="gem-bonus">+${p.bonus} bonus</div>`:''}<div class="gem-base">${p.gems.toLocaleString()} gems</div><button class="btn-buy premium-btn">${fmtPrice(p.price)}</button></div>`;}
    h+='</div></div>';container.innerHTML=h;
    container.querySelectorAll('.gem-pack .btn-buy').forEach(b=>b.addEventListener('click',e=>{const p=e.target.closest('.gem-pack');const d=ProgressionSystem.getGemPacks().find(x=>x.id===p.dataset.id);if(!d)return;ProgressionSystem.addGems(d.gems+d.bonus);showNotification(`💎 Purchased ${d.gems+d.bonus} gems!`);updateBalances();}));
  }
  function renderUpgradeStation(container){
    const tiers=ProgressionSystem.getUpgradeTiers();const state=ProgressionSystem.getState();const bonuses=ProgressionSystem.getActiveBonuses();
    let h='<div class="shop-section"><h3>⚡ Upgrade Station</h3><p class="shop-subtitle">Permanent upgrades that boost your stats</p>';
    h+=`<div class="bonus-summary"><span>⬡ Score: <strong>${bonuses.scoreMult.toFixed(2)}x</strong></span><span>➕ Piece: <strong>+${bonuses.pieceBonus}</strong></span><span>🔲 Grid: <strong>${3+bonuses.bonusCells} tiers</strong></span><span>🖼️ Combo: <strong>+${bonuses.comboBonus}</strong></span><span>⛓️ Chain: <strong>${bonuses.chainMult.toFixed(2)}x</strong></span></div>`;
    h+=`<div class="upgrade-balance"><span>🪙 ${state.coins.toLocaleString()}</span><span>💎 ${state.gems}</span></div>`;
    for(const[cat,tier]of Object.entries(tiers)){const cur=state.upgrades[cat]||0;const curData=tier.levels[cur];const maxed=cur>=tier.maxLevel;const costs=maxed?null:ProgressionSystem.getUpgradeCost(cat,cur);
    h+=`<div class="upgrade-card" data-cat="${cat}"><div class="upgrade-header"><span class="upgrade-icon">${tier.icon}</span><span class="upgrade-name">${tier.name}</span><span class="upgrade-level">Lv.${cur} → ${cur+1}</span></div><div class="upgrade-visual"><div class="upgrade-bar"><div class="upgrade-fill" style="width:${(cur/tier.maxLevel)*100}%"></div></div><div class="upgrade-dots">`;
    for(let i=0;i<=tier.maxLevel;i++)h+=`<span class="upgrade-dot ${i<=cur?'filled':''} ${i===cur+1?'next':''}">${i}</span>`;
    h+=`</div></div>`;if(curData){h+=`<div class="upgrade-current">Current: <strong>${curData.name}</strong></div><div class="upgrade-bonuses">`;for(const[k,v]of Object.entries(curData.bonus)){if(v>0)h+=`<span class="bonus-chip">${v} ${k}</span>`;}h+=`</div>`;}
    if(maxed)h+=`<div class="upgrade-maxed">⭐ MAX LEVEL ⭐</div>`;else if(costs){const cc=state.coins>=costs.coins;const cg=state.gems>=costs.gems;h+=`<div class="upgrade-actions"><button class="btn-upgrade coin-upgrade ${cc?'':'disabled'}" data-cat="${cat}" data-currency="coins">🪙 ${costs.coins.toLocaleString()}</button><button class="btn-upgrade gem-upgrade ${cg?'':'disabled'}" data-cat="${cat}" data-currency="gems">💎 ${costs.gems}</button></div>`;}
    h+=`</div>`;}h+='</div>';container.innerHTML=h;
    container.querySelectorAll('.btn-upgrade:not(.disabled)').forEach(b=>b.addEventListener('click',e=>{const c=e.target.closest('.upgrade-card');const cat=c.dataset.cat;const cur=b.dataset.currency;const r=ProgressionSystem.upgradeItem(cat,cur==='gems');if(r.success){showNotification(`⬆️ ${cat} upgraded to Lv.${r.newLevel}!`);renderUpgradeStation(container);updateBalances();}else showNotification(`Not enough ${cur}!`);}));
  }
  function renderPremiumShop(container){
    const premium=ProgressionSystem.getPremiumItems();const state=ProgressionSystem.getState();
    let h='<div class="shop-section"><h3>👑 Premium Shop</h3><p class="shop-subtitle">Exclusive items — real money only!</p>';
    h+='<h4>⚔️ Legendary Hex Skins</h4><div class="shop-grid">';
    for(const s of premium.legendarySkins){const o=state.inventory[s.id];h+=`<div class="shop-item premium-item ${o?'owned':''}"><div class="premium-tier">${s.tier}</div><div class="item-name">${s.name}</div><div class="item-desc">${s.desc}</div>${o?'<span class="item-status">✓ Owned</span>':`<button class="btn-buy premium-btn iap-btn" data-id="${s.id}" data-price="${s.price}">${fmtPrice(s.price)}</button>`}</div>`;}
    h+='</div><h4>📦 Value Bundles</h4><div class="shop-grid">';
    for(const b of premium.bundles){const o=state.inventory[b.id];h+=`<div class="shop-item premium-item bundle-item ${o?'owned':''}"><div class="item-name">${b.name}</div><div class="item-desc">${b.desc}</div>${o?'<span class="item-status">✓ Owned</span>':`<button class="btn-buy premium-btn iap-btn" data-id="${b.id}" data-price="${b.price}">${fmtPrice(b.price)}</button>`}</div>`;}
    h+='</div><h4>🎫 Premium Pass</h4><div class="shop-grid">';
    for(const p of premium.premiumCases){const o=state.inventory[p.id];h+=`<div class="shop-item premium-item subscription-item ${o?'owned':''}"><div class="item-name">${p.name}</div><div class="item-desc">${p.desc}</div>${o?'<span class="item-status">✓ Owned</span>':`<button class="btn-buy premium-btn iap-btn" data-id="${p.id}" data-price="${p.price}">${fmtPrice(p.price)}</button>`}</div>`;}
    h+='</div><h4>🚫 Ads</h4><div class="shop-grid">';
    h+=`<div class="shop-item premium-item ${state.adFree?'owned':''}"><div class="item-name">${premium.removeAds.name}</div><div class="item-desc">${premium.removeAds.desc}</div>${state.adFree?'<span class="item-status">✓ Purchased</span>':`<button class="btn-buy premium-btn iap-btn" data-id="remove_ads" data-price="${premium.removeAds.price}">${fmtPrice(premium.removeAds.price)}</button>`}</div></div>`;
    h+='</div>';container.innerHTML=h;
    container.querySelectorAll('.iap-btn').forEach(b=>b.addEventListener('click',e=>{const id=b.dataset.id;const p=parseFloat(b.dataset.price);if(confirm(`Purchase this item for ${fmtPrice(p)}? (Real money — simulated)`)){ProgressionSystem.purchasePremiumItem(id);showNotification('✅ Purchased!');renderPremiumShop(container);updateBalances();}}));
  }
  function showNotification(msg){const el=document.getElementById('notification')||(()=>{const n=document.createElement('div');n.id='notification';document.body.appendChild(n);return n;})();el.textContent=msg;el.className='show';clearTimeout(el._timeout);el._timeout=setTimeout(()=>el.className='',2500);}
  window.ShopUI={open:createShopPanel,close:closeShop,showTab,updateBalances};
})();

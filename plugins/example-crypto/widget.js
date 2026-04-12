// Crypto & Stock Tracker Widget Plugin
(function(api) {
  'use strict';

  const PLUGIN_ID = 'example-crypto';

  // Default watchlist — can be customized by user
  const DEFAULT_WATCHLIST = [
    { id: 'bitcoin', symbol: '₿', name: 'Bitcoin', type: 'crypto' },
    { id: 'ethereum', symbol: 'Ξ', name: 'Ethereum', type: 'crypto' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', type: 'crypto' },
  ];

  // Available preset coins for quick add
  const PRESET_COINS = [
    { id: 'bitcoin', symbol: '₿', name: 'Bitcoin', type: 'crypto' },
    { id: 'ethereum', symbol: 'Ξ', name: 'Ethereum', type: 'crypto' },
    { id: 'solana', symbol: 'SOL', name: 'Solana', type: 'crypto' },
    { id: 'binancecoin', symbol: 'BNB', name: 'BNB', type: 'crypto' },
    { id: 'ripple', symbol: 'XRP', name: 'XRP', type: 'crypto' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', type: 'crypto' },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', type: 'crypto' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', type: 'crypto' },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', type: 'crypto' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', type: 'crypto' },
    { id: 'tron', symbol: 'TRX', name: 'TRON', type: 'crypto' },
    { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', type: 'crypto' },
    { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', type: 'crypto' },
    { id: 'polygon-ecosystem-token', symbol: 'POL', name: 'Polygon', type: 'crypto' },
    { id: 'monero', symbol: 'XMR', name: 'Monero', type: 'crypto' },
    { id: 'stellar', symbol: 'XLM', name: 'Stellar', type: 'crypto' },
    { id: 'sui', symbol: 'SUI', name: 'Sui', type: 'crypto' },
    { id: 'pepe', symbol: 'PEPE', name: 'Pepe', type: 'crypto' },
    { id: 'aptos', symbol: 'APT', name: 'Aptos', type: 'crypto' },
    { id: 'render-token', symbol: 'RENDER', name: 'Render', type: 'crypto' },
  ];

  let prices = {};
  let watchlist = [];
  let expanded = false;
  let settingsOpen = false;
  let searchFilter = '';
  let currentContainer = null;
  let currentSize = 'mini';

  function getSettings() {
    return api.getPluginSettings(PLUGIN_ID);
  }

  function loadWatchlist() {
    const settings = getSettings();
    watchlist = settings.watchlist || [...DEFAULT_WATCHLIST];
    expanded = settings.expanded || false;
  }

  async function saveWatchlist() {
    const settings = getSettings();
    settings.watchlist = watchlist;
    settings.expanded = expanded;
    await api.savePluginSettings(PLUGIN_ID, settings);
  }

  async function fetchPrices() {
    if (watchlist.length === 0) return;
    const ids = watchlist.map(c => c.id).join(',');
    try {
      const resp = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`);
      if (resp.ok) {
        prices = await resp.json();
      }
    } catch (e) {
      // Silently fail, keep old data
    }
  }

  function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function formatNumber(num) {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
  }

  function formatPrice(price) {
    if (price >= 1000) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (price >= 1) return '$' + price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (price >= 0.01) return '$' + price.toFixed(4);
    return '$' + price.toFixed(8);
  }

  // ===== MINI RENDER =====
  function renderMini(container) {
    if (watchlist.length === 0) {
      container.innerHTML = `<span class="plugin-crypto-mini-loading">Figyelőlista üres</span>`;
      return;
    }
    const firstCoin = watchlist[0];
    const data = prices[firstCoin.id];
    if (!data) {
      container.innerHTML = `<span class="plugin-crypto-mini-loading">${esc(firstCoin.symbol)} Betöltés...</span>`;
      return;
    }
    const change = data.usd_24h_change || 0;
    const changeClass = change >= 0 ? 'up' : 'down';
    const changeIcon = change >= 0 ? '▲' : '▼';

    // Show first coin + count badge for remaining
    const extraCount = watchlist.length - 1;
    const extraBadge = extraCount > 0 ? `<span class="plugin-crypto-extra">+${extraCount}</span>` : '';

    container.innerHTML = `
      <div class="plugin-crypto-mini" data-action="expand">
        <span class="plugin-crypto-symbol">${esc(firstCoin.symbol)}</span>
        <span class="plugin-crypto-price">${formatPrice(data.usd)}</span>
        <span class="plugin-crypto-change ${changeClass}">${changeIcon} ${Math.abs(change).toFixed(1)}%</span>
        ${extraBadge}
        <button class="plugin-crypto-expand-btn" data-action="expand" title="Kibontás">
          <i class="fa-solid fa-chevron-down"></i>
        </button>
      </div>`;

    bindExpandButton(container);
  }

  // ===== LARGE RENDER =====
  function renderLarge(container) {
    if (settingsOpen) {
      renderSettings(container);
      return;
    }

    if (watchlist.length === 0) {
      container.innerHTML = `
        <div class="plugin-crypto-empty">
          <i class="fa-solid fa-chart-line"></i>
          <span>A figyelőlista üres</span>
          <button class="plugin-crypto-settings-btn" data-action="settings">
            <i class="fa-solid fa-plus"></i> Hozzáadás
          </button>
        </div>`;
      container.querySelector('[data-action="settings"]')?.addEventListener('click', () => {
        settingsOpen = true;
        render(container, 'large');
      });
      return;
    }

    const rows = watchlist.map((coin, idx) => {
      const data = prices[coin.id];
      if (!data) return `
        <div class="plugin-crypto-row">
          <span class="plugin-crypto-coin-rank">${idx + 1}</span>
          <span class="plugin-crypto-coin-symbol">${esc(coin.symbol)}</span>
          <span class="plugin-crypto-coin-name">${esc(coin.name)}</span>
          <span class="plugin-crypto-coin-price" style="color:var(--text-tertiary)">—</span>
        </div>`;

      const change = data.usd_24h_change || 0;
      const changeClass = change >= 0 ? 'up' : 'down';
      const changeIcon = change >= 0 ? '▲' : '▼';
      const mcap = data.usd_market_cap ? formatNumber(data.usd_market_cap) : '—';
      const vol = data.usd_24h_vol ? formatNumber(data.usd_24h_vol) : '—';

      return `
        <div class="plugin-crypto-row" title="MCap: $${mcap} · Vol24h: $${vol}">
          <span class="plugin-crypto-coin-rank">${idx + 1}</span>
          <span class="plugin-crypto-coin-symbol">${esc(coin.symbol)}</span>
          <span class="plugin-crypto-coin-name">${esc(coin.name)}</span>
          <span class="plugin-crypto-coin-price">${formatPrice(data.usd)}</span>
          <span class="plugin-crypto-coin-change ${changeClass}">${changeIcon} ${Math.abs(change).toFixed(1)}%</span>
          <span class="plugin-crypto-coin-mcap">$${mcap}</span>
        </div>`;
    }).join('');

    const collapseBtn = expanded 
      ? `<button class="plugin-crypto-toggle-btn" data-action="collapse" title="Összezárás">
           <i class="fa-solid fa-compress"></i>
         </button>`
      : `<button class="plugin-crypto-toggle-btn" data-action="expand-full" title="Részletek">
           <i class="fa-solid fa-expand"></i>
         </button>`;

    // Market overview stats (only in expanded)
    let statsHtml = '';
    if (expanded && watchlist.length > 0) {
      const totalChange = watchlist.reduce((sum, coin) => {
        const d = prices[coin.id];
        return sum + (d?.usd_24h_change || 0);
      }, 0) / watchlist.length;
      const totalMcap = watchlist.reduce((sum, coin) => {
        const d = prices[coin.id];
        return sum + (d?.usd_market_cap || 0);
      }, 0);
      const overallClass = totalChange >= 0 ? 'up' : 'down';
      
      statsHtml = `
        <div class="plugin-crypto-stats">
          <div class="plugin-crypto-stat">
            <span class="plugin-crypto-stat-label">Átlagos 24h</span>
            <span class="plugin-crypto-stat-value ${overallClass}">${totalChange >= 0 ? '+' : ''}${totalChange.toFixed(1)}%</span>
          </div>
          <div class="plugin-crypto-stat">
            <span class="plugin-crypto-stat-label">Össz. MCap</span>
            <span class="plugin-crypto-stat-value">$${formatNumber(totalMcap)}</span>
          </div>
          <div class="plugin-crypto-stat">
            <span class="plugin-crypto-stat-label">Követett</span>
            <span class="plugin-crypto-stat-value">${watchlist.length} coin</span>
          </div>
        </div>`;
    }

    container.innerHTML = `
      <div class="plugin-crypto-header">
        <i class="fa-solid fa-chart-line"></i>
        <span>Figyelőlista</span>
        <div class="plugin-crypto-header-actions">
          <button class="plugin-crypto-settings-btn" data-action="settings" title="Beállítások">
            <i class="fa-solid fa-gear"></i>
          </button>
          ${collapseBtn}
        </div>
      </div>
      ${statsHtml}
      <div class="plugin-crypto-table-header ${expanded ? 'expanded' : ''}">
        <span class="plugin-crypto-th-rank">#</span>
        <span class="plugin-crypto-th-sym"></span>
        <span class="plugin-crypto-th-name">Név</span>
        <span class="plugin-crypto-th-price">Ár</span>
        <span class="plugin-crypto-th-change">24h</span>
        ${expanded ? '<span class="plugin-crypto-th-mcap">MCap</span>' : ''}
      </div>
      <div class="plugin-crypto-list ${expanded ? 'expanded' : ''}">${rows}</div>`;

    // Bind events
    container.querySelector('[data-action="settings"]')?.addEventListener('click', () => {
      settingsOpen = true;
      render(container, 'large');
    });

    container.querySelector('[data-action="expand-full"]')?.addEventListener('click', () => {
      expanded = true;
      saveWatchlist();
      render(container, 'large');
    });

    container.querySelector('[data-action="collapse"]')?.addEventListener('click', () => {
      expanded = false;
      saveWatchlist();
      render(container, 'large');
    });
  }

  // ===== SETTINGS / WATCHLIST EDITOR =====
  function renderSettings(container) {
    const filteredPresets = PRESET_COINS.filter(coin => {
      const inWatchlist = watchlist.some(w => w.id === coin.id);
      const matchesSearch = !searchFilter || 
        coin.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchFilter.toLowerCase()) ||
        coin.id.toLowerCase().includes(searchFilter.toLowerCase());
      return !inWatchlist && matchesSearch;
    });

    const watchlistHtml = watchlist.map((coin, idx) => `
      <div class="plugin-crypto-wl-item" data-idx="${idx}">
        <span class="plugin-crypto-wl-drag"><i class="fa-solid fa-grip-vertical"></i></span>
        <span class="plugin-crypto-wl-symbol">${esc(coin.symbol)}</span>
        <span class="plugin-crypto-wl-name">${esc(coin.name)}</span>
        <span class="plugin-crypto-wl-type">${coin.type === 'crypto' ? 'CRYPTO' : 'STOCK'}</span>
        <button class="plugin-crypto-wl-remove" data-remove-idx="${idx}" title="Eltávolítás">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>`).join('');

    const availableHtml = filteredPresets.map(coin => `
      <div class="plugin-crypto-preset-item" data-add-id="${esc(coin.id)}">
        <span class="plugin-crypto-preset-symbol">${esc(coin.symbol)}</span>
        <span class="plugin-crypto-preset-name">${esc(coin.name)}</span>
        <button class="plugin-crypto-preset-add" title="Hozzáadás"><i class="fa-solid fa-plus"></i></button>
      </div>`).join('');

    container.innerHTML = `
      <div class="plugin-crypto-header">
        <i class="fa-solid fa-gear"></i>
        <span>Figyelőlista beállítás</span>
        <div class="plugin-crypto-header-actions">
          <button class="plugin-crypto-settings-btn" data-action="close-settings" title="Vissza">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
        </div>
      </div>

      <div class="plugin-crypto-settings-section">
        <h4 class="plugin-crypto-section-title">
          <i class="fa-solid fa-star"></i> Figyelőlista (${watchlist.length})
        </h4>
        <div class="plugin-crypto-wl-list">${watchlistHtml || '<div class="plugin-crypto-wl-empty">Üres figyelőlista — adj hozzá coinokat alább</div>'}</div>
      </div>

      <div class="plugin-crypto-settings-section">
        <h4 class="plugin-crypto-section-title">
          <i class="fa-solid fa-plus-circle"></i> Elérhető coinok
        </h4>
        <div class="plugin-crypto-search-bar">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input type="text" class="plugin-crypto-search-input" placeholder="Keresés..." value="${esc(searchFilter)}">
        </div>
        <div class="plugin-crypto-presets-list">${availableHtml || '<div class="plugin-crypto-wl-empty">Nincs találat</div>'}</div>
      </div>

      <div class="plugin-crypto-settings-section">
        <h4 class="plugin-crypto-section-title">
          <i class="fa-solid fa-keyboard"></i> Egyedi coin hozzáadás
        </h4>
        <div class="plugin-crypto-custom-add">
          <input type="text" class="plugin-crypto-custom-id" placeholder="CoinGecko ID (pl. bitcoin)">
          <input type="text" class="plugin-crypto-custom-symbol" placeholder="Szimbólum (pl. BTC)" maxlength="10">
          <input type="text" class="plugin-crypto-custom-name" placeholder="Név (pl. Bitcoin)">
          <button class="plugin-crypto-custom-btn" data-action="add-custom">
            <i class="fa-solid fa-plus"></i> Hozzáadás
          </button>
        </div>
      </div>`;

    // Bind events
    container.querySelector('[data-action="close-settings"]')?.addEventListener('click', () => {
      settingsOpen = false;
      searchFilter = '';
      render(container, 'large');
    });

    // Search filter
    const searchInput = container.querySelector('.plugin-crypto-search-input');
    searchInput?.addEventListener('input', (e) => {
      searchFilter = e.target.value;
      renderSettings(container);
      // Re-focus and set cursor
      const newInput = container.querySelector('.plugin-crypto-search-input');
      if (newInput) { newInput.focus(); newInput.selectionStart = newInput.selectionEnd = searchFilter.length; }
    });

    // Remove from watchlist
    container.querySelectorAll('[data-remove-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.removeIdx);
        watchlist.splice(idx, 1);
        saveWatchlist();
        fetchPrices();
        renderSettings(container);
      });
    });

    // Add from presets
    container.querySelectorAll('[data-add-id]').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.addId;
        const preset = PRESET_COINS.find(c => c.id === id);
        if (preset && !watchlist.some(w => w.id === id)) {
          watchlist.push({ ...preset });
          saveWatchlist();
          fetchPrices();
          renderSettings(container);
        }
      });
    });

    // Custom add
    container.querySelector('[data-action="add-custom"]')?.addEventListener('click', () => {
      const idInput = container.querySelector('.plugin-crypto-custom-id');
      const symInput = container.querySelector('.plugin-crypto-custom-symbol');
      const nameInput = container.querySelector('.plugin-crypto-custom-name');
      const id = idInput?.value?.trim().toLowerCase();
      const symbol = symInput?.value?.trim().toUpperCase() || id?.toUpperCase();
      const name = nameInput?.value?.trim() || symbol;
      if (!id) { api.toast('CoinGecko ID szükséges!', 'error'); return; }
      if (watchlist.some(w => w.id === id)) { api.toast('Már a figyelőlistán van!', 'error'); return; }
      watchlist.push({ id, symbol, name, type: 'crypto' });
      saveWatchlist();
      fetchPrices();
      renderSettings(container);
      api.toast(`${name} hozzáadva!`, 'success');
    });
  }

  function bindExpandButton(container) {
    container.querySelectorAll('[data-action="expand"]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        // Switch to large mode via the plugin API
        const wrapper = container.closest('.widget-wrapper');
        if (wrapper) {
          wrapper.dataset.widgetSize = 'large';
          // Update config
          const entry = getPluginConfigEntry();
          if (entry) entry.size = 'large';
          saveWatchlist();
        }
        currentSize = 'large';
        render(container, 'large');
      });
    });
  }

  function getPluginConfigEntry() {
    return (api.getConfig().plugins || []).find(p => p.id === PLUGIN_ID);
  }

  function render(container, size) {
    currentContainer = container;
    currentSize = size;
    if (size === 'mini') renderMini(container);
    else renderLarge(container);
  }

  // Register widget
  api.registerWidget({
    id: PLUGIN_ID,
    render: function(container, size) {
      render(container, size);
    },
    init: async function() {
      loadWatchlist();
      await fetchPrices();
    },
    refresh: async function() {
      await fetchPrices();
    }
  });

})(window.__startpagePluginAPI);

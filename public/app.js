/* ============================================
   STARTPAGE v4 — Widget Customization, Themes & Plugins
   ============================================ */

(() => {
  'use strict';

  // --- State ---
  let config = null;
  let editConfig = null;
  let vimMode = 'normal';
  let vimCatIdx = 0;
  let vimLinkIdx = 0;
  let allLinks = [];
  let terminalHistory = [];
  let terminalHistoryIdx = -1;
  let pomodoroTimer = null;
  let pomodoroRemaining = 0;
  let pomodoroTotal = 0;
  let pomodoroIsBreak = false;
  let scratchpadDebounce = null;
  let clipboardLastId = 0;
  let smartResultDebounce = null;
  let rssAllItems = [];
  let customizeMode = false;

  // --- DOM References ---
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    bgLayer: $('#bg-layer'),
    bgOverlay: $('#bg-overlay'),
    clock: $('#clock'),
    date: $('#date'),
    greeting: $('#greeting'),
    searchInput: $('#search-input'),
    searchWrapper: $('#search-wrapper'),
    searchBadge: $('#search-engine-badge'),
    bangDropdown: $('#bang-dropdown'),
    smartResult: $('#smart-result'),
    linksSection: $('#links-section'),
    weatherTemp: $('#weather-temp'),
    weatherDesc: $('#weather-desc'),
    weatherIcon: $('#weather-icon'),
    weatherCity: $('#weather-city'),
    settingsBtn: $('#settings-btn'),
    modalOverlay: $('#modal-overlay'),
    modalClose: $('#modal-close'),
    modalCancel: $('#modal-cancel'),
    modalSave: $('#modal-save'),
    toastContainer: $('#toast-container'),
    cfgName: $('#cfg-name'),
    cfgSearchEngine: $('#cfg-search-engine'),
    cfgSearchEngineName: $('#cfg-search-engine-name'),
    cfgBgUrl: $('#cfg-bg-url'),
    cfgBgUpload: $('#cfg-bg-upload'),
    cfgWeatherCity: $('#cfg-weather-city'),
    cfgThemeMode: $('#cfg-theme-mode'),
    cfgTerminalEnabled: $('#cfg-terminal-enabled'),
    cfgPomodoro: $('#cfg-pomodoro'),
    cfgCurrencyTarget: $('#cfg-currency-target'),
    linksEditor: $('#links-editor'),
    bangsEditor: $('#bangs-editor'),
    feedsEditor: $('#feeds-editor'),
    addCategoryBtn: $('#add-category-btn'),
    addBangBtn: $('#add-bang-btn'),
    addFeedBtn: $('#add-feed-btn'),
    netDot: $('#net-dot'),
    netLabel: $('#net-label'),
    cpuValue: $('#cpu-value'),
    cpuBar: $('#cpu-bar'),
    ramValue: $('#ram-value'),
    ramBar: $('#ram-bar'),
    diskValue: $('#disk-value'),
    uptimeValue: $('#uptime-value'),
    updatesCount: $('#updates-count'),
    sysUpdates: $('#sys-updates'),
    todoList: $('#todo-list'),
    todoInput: $('#todo-input'),
    todoAddBtn: $('#todo-add-btn'),
    todoCount: $('#todo-count'),
    rssScroll: $('#rss-scroll'),
    rssTicker: $('#rss-ticker'),
    rssCards: $('#rss-cards'),
    rssToggleBtn: $('#rss-toggle-btn'),
    rssToggleIcon: $('#rss-toggle-icon'),
    mediaWidget: $('#media-widget'),
    mediaArt: $('#media-art'),
    mediaTitle: $('#media-title'),
    mediaArtist: $('#media-artist'),
    mediaPlayIcon: $('#media-play-icon'),
    mediaPrev: $('#media-prev'),
    mediaPlay: $('#media-play'),
    mediaNext: $('#media-next'),
    terminalOverlay: $('#terminal-overlay'),
    terminalOutput: $('#terminal-output'),
    terminalInput: $('#terminal-input'),
    terminalClose: $('#terminal-close'),
    terminalTitle: $('#terminal-title'),
    vimIndicator: $('#vim-indicator'),
    vimModeEl: $('#vim-mode'),
    pomodoroWidget: $('#pomodoro-widget'),
    pomodoroTime: $('#pomodoro-time'),
    pomodoroProgress: $('#pomodoro-progress'),
    pomodoroBtn: $('#pomodoro-btn'),
    pomodoroIcon: $('#pomodoro-icon'),
    pomodoroLabel: $('#pomodoro-label'),
    scratchpadToggle: $('#scratchpad-toggle'),
    scratchpadPanel: $('#scratchpad-panel'),
    scratchpadClose: $('#scratchpad-close'),
    scratchpadTextarea: $('#scratchpad-textarea'),
    scratchpadStatus: $('#scratchpad-status'),
    agendaList: $('#agenda-list'),
    agendaAddBtn: $('#agenda-add-btn'),
    agendaForm: $('#agenda-form'),
    agendaTitle: $('#agenda-title'),
    agendaDate: $('#agenda-date'),
    agendaTime: $('#agenda-time'),
    agendaCancel: $('#agenda-cancel'),
    agendaSave: $('#agenda-save'),
    airdropPill: $('#airdrop-pill'),
    airdropText: $('#airdrop-text'),
    airdropCopy: $('#airdrop-copy'),
    airdropDismiss: $('#airdrop-dismiss'),
    customizeToggle: $('#customize-toggle'),
    customizeIcon: $('#customize-icon'),
    widgetsList: $('#widgets-list'),
    themeGrid: $('#theme-grid'),
    customThemesGrid: $('#custom-themes-grid'),
    customThemeSection: $('#custom-theme-section'),
    savedThemesSection: $('#saved-themes-section'),
    customThemeName: $('#custom-theme-name'),
    saveCustomTheme: $('#save-custom-theme'),
    exportTheme: $('#export-theme'),
    importTheme: $('#import-theme'),
    importThemeFile: $('#import-theme-file'),
    pluginsList: $('#plugins-list'),
    pluginInstallUrl: $('#plugin-install-url'),
    pluginInstallBtn: $('#plugin-install-btn'),
    pluginUploadManifest: $('#plugin-upload-manifest'),
    pluginUploadJs: $('#plugin-upload-js'),
    pluginUploadCss: $('#plugin-upload-css'),
    pluginPickManifest: $('#plugin-pick-manifest'),
    pluginPickJs: $('#plugin-pick-js'),
    pluginPickCss: $('#plugin-pick-css'),
    pluginUploadStatus: $('#plugin-upload-status'),
    pluginUploadBtn: $('#plugin-upload-btn'),
    pluginWidgetsContainer: $('#plugin-widgets-container'),
    mainContainer: $('#main-container'),
    dockerWrapper: $('.widget-wrapper[data-widget-id="docker"]'),
    dockerList: $('#docker-list'),
    dockerRunning: $('#docker-running'),
    dockerTotal: $('#docker-total'),
    dockerImages: $('#docker-images'),
    dockerRefresh: $('#docker-refresh'),
    dockerLogs: $('#docker-logs'),
    dockerLogsTitle: $('#docker-logs-title'),
    dockerLogsBody: $('#docker-logs-body'),
    dockerLogsClose: $('#docker-logs-close'),
  };

  // ============================================
  // WIDGET MANAGER
  // ============================================
  const BUILT_IN_WIDGETS = [
    { id: 'clock', name: 'Óra & Dátum', icon: 'fa-solid fa-clock', defaultSize: 'large', canResize: true },
    { id: 'agenda', name: 'Napirend', icon: 'fa-solid fa-calendar-day', defaultSize: 'large', canResize: true },
    { id: 'search', name: 'Keresés', icon: 'fa-solid fa-magnifying-glass', defaultSize: 'large', canResize: false },
    { id: 'links', name: 'Gyorslinkek', icon: 'fa-solid fa-link', defaultSize: 'large', canResize: true },
    { id: 'todo', name: 'Teendők', icon: 'fa-solid fa-list-check', defaultSize: 'large', canResize: true },
    { id: 'rss', name: 'RSS Hírek', icon: 'fa-solid fa-rss', defaultSize: 'large', canResize: true },
    { id: 'docker', name: 'Docker', icon: 'fa-brands fa-docker', defaultSize: 'large', canResize: true },
    { id: 'pomodoro', name: 'Pomodoro', icon: 'fa-solid fa-stopwatch', defaultSize: 'mini', canResize: true },
    { id: 'media', name: 'Zenelejátszó', icon: 'fa-solid fa-music', defaultSize: 'mini', canResize: true },
    { id: 'weather', name: 'Időjárás', icon: 'fa-solid fa-cloud-sun', defaultSize: 'mini', canResize: true },
  ];

  const WidgetManager = {
    getLayout() {
      if (config.widgetLayout && config.widgetLayout.length > 0) return config.widgetLayout;
      return BUILT_IN_WIDGETS.map(w => ({ id: w.id, size: w.defaultSize, visible: true, order: 0 }));
    },

    applyLayout() {
      const layout = this.getLayout();
      // Apply visibility and size to each widget wrapper
      layout.forEach(item => {
        const wrapper = document.querySelector(`.widget-wrapper[data-widget-id="${item.id}"]`);
        if (!wrapper) return;
        wrapper.dataset.widgetSize = item.size || 'large';
        if (item.visible === false) {
          wrapper.classList.add('widget-hidden');
        } else {
          wrapper.classList.remove('widget-hidden');
        }
      });

      // Reorder inline widgets in main container
      const inlineIds = layout.filter(item => {
        const w = document.querySelector(`.widget-wrapper[data-widget-id="${item.id}"]`);
        return w && w.classList.contains('widget-wrapper-inline');
      }).map(item => item.id);

      const container = dom.mainContainer;
      inlineIds.forEach(id => {
        const wrapper = document.querySelector(`.widget-wrapper[data-widget-id="${id}"]`);
        if (wrapper && wrapper.parentElement === container) {
          container.appendChild(wrapper);
        }
      });
      // Move plugin container to end
      if (dom.pluginWidgetsContainer && dom.pluginWidgetsContainer.parentElement === container) {
        container.appendChild(dom.pluginWidgetsContainer);
      }
    },

    toggleSize(widgetId) {
      const layout = this.getLayout();
      const item = layout.find(w => w.id === widgetId);
      if (!item) return;
      item.size = item.size === 'mini' ? 'large' : 'mini';
      config.widgetLayout = layout;
      this.applyLayout();
      this.saveLayout();
    },

    toggleVisibility(widgetId) {
      const layout = this.getLayout();
      const item = layout.find(w => w.id === widgetId);
      if (!item) return;
      item.visible = item.visible === false ? true : false;
      config.widgetLayout = layout;
      this.applyLayout();
      this.saveLayout();
    },

    async saveLayout() {
      try {
        await fetch('/api/config', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
      } catch {}
    },

    setupDragDrop() {
      const wrappers = document.querySelectorAll('.widget-wrapper-inline');
      wrappers.forEach(wrapper => {
        wrapper.setAttribute('draggable', 'false');
        const handle = wrapper.querySelector('.widget-drag-handle');
        if (!handle) return;

        handle.addEventListener('mousedown', () => {
          wrapper.setAttribute('draggable', 'true');
        });

        wrapper.addEventListener('dragstart', (e) => {
          if (!customizeMode) { e.preventDefault(); return; }
          wrapper.classList.add('dragging');
          e.dataTransfer.setData('text/plain', wrapper.dataset.widgetId);
          e.dataTransfer.effectAllowed = 'move';
        });

        wrapper.addEventListener('dragend', () => {
          wrapper.classList.remove('dragging');
          wrapper.setAttribute('draggable', 'false');
          document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
          this.saveOrderFromDOM();
        });

        wrapper.addEventListener('dragover', (e) => {
          if (!customizeMode) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          const dragging = document.querySelector('.widget-wrapper.dragging');
          if (dragging && dragging !== wrapper) {
            wrapper.classList.add('drag-over');
          }
        });

        wrapper.addEventListener('dragleave', () => {
          wrapper.classList.remove('drag-over');
        });

        wrapper.addEventListener('drop', (e) => {
          e.preventDefault();
          wrapper.classList.remove('drag-over');
          const draggedId = e.dataTransfer.getData('text/plain');
          const draggedEl = document.querySelector(`.widget-wrapper[data-widget-id="${draggedId}"]`);
          if (draggedEl && draggedEl !== wrapper && draggedEl.parentElement === wrapper.parentElement) {
            const container = wrapper.parentElement;
            const children = Array.from(container.querySelectorAll('.widget-wrapper-inline'));
            const dragIdx = children.indexOf(draggedEl);
            const dropIdx = children.indexOf(wrapper);
            if (dragIdx < dropIdx) {
              container.insertBefore(draggedEl, wrapper.nextSibling);
            } else {
              container.insertBefore(draggedEl, wrapper);
            }
          }
        });
      });

      // Widget control buttons
      document.querySelectorAll('.widget-controls').forEach(controls => {
        controls.addEventListener('click', (e) => {
          const btn = e.target.closest('.widget-ctrl-btn');
          if (!btn) return;
          const wrapper = controls.closest('.widget-wrapper');
          const widgetId = wrapper?.dataset.widgetId;
          if (!widgetId) return;
          const action = btn.dataset.action;
          if (action === 'resize') this.toggleSize(widgetId);
          else if (action === 'hide') this.toggleVisibility(widgetId);
        });
      });
    },

    saveOrderFromDOM() {
      const container = dom.mainContainer;
      const inlineWidgets = Array.from(container.querySelectorAll('.widget-wrapper-inline'));
      const layout = this.getLayout();
      const newLayout = [];
      
      // First add inline widgets in DOM order
      inlineWidgets.forEach(wrapper => {
        const id = wrapper.dataset.widgetId;
        const existing = layout.find(w => w.id === id);
        newLayout.push(existing || { id, size: wrapper.dataset.widgetSize || 'large', visible: true });
      });
      
      // Then add fixed widgets
      layout.forEach(item => {
        if (!newLayout.find(w => w.id === item.id)) {
          newLayout.push(item);
        }
      });

      config.widgetLayout = newLayout;
      this.saveLayout();
    },

    renderManagerList() {
      const layout = this.getLayout();
      const list = dom.widgetsList;
      if (!list) return;

      list.innerHTML = layout.map(item => {
        const def = BUILT_IN_WIDGETS.find(w => w.id === item.id) || { name: item.id, icon: 'fa-solid fa-puzzle-piece', canResize: true };
        const isVisible = item.visible !== false;
        const sizeLabel = item.size === 'mini' ? 'MINI' : 'NAGY';
        return `
          <div class="widget-manager-item" draggable="true" data-widget-id="${item.id}">
            <span class="wm-drag"><i class="fa-solid fa-grip-vertical"></i></span>
            <div class="wm-icon"><i class="${escapeAttr(def.icon)}"></i></div>
            <span class="wm-name">${escapeHtml(def.name)}</span>
            <div class="wm-actions">
              <span class="wm-size-label">${sizeLabel}</span>
              ${def.canResize ? `<button class="wm-action-btn" data-wm-action="resize" data-wm-id="${item.id}" title="Méret váltás"><i class="fa-solid fa-arrows-left-right"></i></button>` : ''}
              <button class="wm-action-btn ${isVisible ? '' : 'hidden-state'}" data-wm-action="toggle" data-wm-id="${item.id}" title="${isVisible ? 'Elrejtés' : 'Megjelenítés'}">
                <i class="fa-solid ${isVisible ? 'fa-eye' : 'fa-eye-slash'}"></i>
              </button>
            </div>
          </div>`;
      }).join('');

      // Bind actions
      list.querySelectorAll('[data-wm-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const action = btn.dataset.wmAction;
          const id = btn.dataset.wmId;
          if (action === 'resize') this.toggleSize(id);
          else if (action === 'toggle') this.toggleVisibility(id);
          this.renderManagerList();
        });
      });

      // Drag reorder in settings list
      this.setupManagerDragReorder();
    },

    setupManagerDragReorder() {
      const items = dom.widgetsList.querySelectorAll('.widget-manager-item');
      items.forEach(item => {
        item.addEventListener('dragstart', (e) => {
          item.classList.add('dragging');
          e.dataTransfer.setData('text/plain', item.dataset.widgetId);
        });
        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
          // Read new order from DOM
          const newOrder = Array.from(dom.widgetsList.querySelectorAll('.widget-manager-item'))
            .map(el => el.dataset.widgetId);
          const layout = this.getLayout();
          const reordered = newOrder.map(id => layout.find(w => w.id === id)).filter(Boolean);
          // Add any missing
          layout.forEach(item => { if (!reordered.find(w => w.id === item.id)) reordered.push(item); });
          config.widgetLayout = reordered;
          this.applyLayout();
          this.saveLayout();
        });
        item.addEventListener('dragover', (e) => {
          e.preventDefault();
          const dragging = dom.widgetsList.querySelector('.dragging');
          if (dragging && dragging !== item) {
            const rect = item.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.clientY < midY) {
              dom.widgetsList.insertBefore(dragging, item);
            } else {
              dom.widgetsList.insertBefore(dragging, item.nextSibling);
            }
          }
        });
      });
    }
  };

  // ============================================
  // THEME MANAGER
  // ============================================
  const BUILT_IN_THEMES = [
    { id: 'midnight-purple', name: 'Midnight Purple', accent: '#7c5cfc', accentLight: '#9b82fc', bg: '#050409', glass: '#0f0f14' },
    { id: 'ocean-blue', name: 'Ocean Blue', accent: '#0ea5e9', accentLight: '#38bdf8', bg: '#020617', glass: '#020617' },
    { id: 'forest-green', name: 'Forest Green', accent: '#22c55e', accentLight: '#4ade80', bg: '#052e16', glass: '#052e16' },
    { id: 'sunset-orange', name: 'Sunset Orange', accent: '#f97316', accentLight: '#fb923c', bg: '#1c0a00', glass: '#1c0a00' },
    { id: 'rose-pink', name: 'Rose Pink', accent: '#ec4899', accentLight: '#f472b6', bg: '#1a0010', glass: '#1a0010' },
    { id: 'arctic', name: 'Arctic', accent: '#67e8f9', accentLight: '#a5f3fc', bg: '#0c1222', glass: '#0c1222' },
    { id: 'cyberpunk', name: 'Cyberpunk', accent: '#facc15', accentLight: '#fde68a', bg: '#0a0118', glass: '#0a0118' },
    { id: 'monochrome', name: 'Monochrome', accent: '#a3a3a3', accentLight: '#d4d4d4', bg: '#0a0a0a', glass: '#141414' },
  ];

  const ThemeManager = {
    apply() {
      const mode = config?.themeMode || 'auto';
      const activeTheme = config?.activeTheme || '';
      
      // Remove all theme classes
      document.body.className = document.body.className
        .replace(/theme-[a-z-]+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      // Re-add non-theme classes
      if (document.body.classList.contains('focus-active')) document.body.classList.add('focus-active');
      if (customizeMode) document.body.classList.add('customize-mode');

      if (mode === 'custom' && activeTheme) {
        // Check if it's a built-in theme
        const builtIn = BUILT_IN_THEMES.find(t => t.id === activeTheme);
        if (builtIn) {
          document.body.classList.add(`theme-${builtIn.id}`);
          document.body.removeAttribute('style');
        } else {
          // Custom user theme
          const customThemes = config.customThemes || [];
          const theme = customThemes.find(t => t.id === activeTheme);
          if (theme && theme.vars) {
            this.applyCustomVars(theme.vars);
          }
        }
      } else if (mode === 'auto') {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 10) document.body.classList.add('theme-morning');
        else if (hour >= 10 && hour < 17) document.body.classList.add('theme-day');
        else if (hour >= 17 && hour < 21) document.body.classList.add('theme-evening');
        else document.body.classList.add('theme-night');
      } else {
        document.body.classList.add(`theme-${mode}`);
      }
    },

    applyCustomVars(vars) {
      const root = document.documentElement;
      if (vars.accent) root.style.setProperty('--accent', vars.accent);
      if (vars.accentLight) root.style.setProperty('--accent-light', vars.accentLight);
      if (vars.bgDeep) root.style.setProperty('--bg-deep', vars.bgDeep);
      if (vars.glassBg) root.style.setProperty('--glass-bg', this.hexToRgba(vars.glassBg, 0.45));
      if (vars.textPrimary) root.style.setProperty('--text-primary', this.hexToRgba(vars.textPrimary, 0.92));
      if (vars.textSecondary) root.style.setProperty('--text-secondary', this.hexToRgba(vars.textSecondary, 0.55));
      if (vars.success) root.style.setProperty('--success', vars.success);
      if (vars.danger) root.style.setProperty('--danger', vars.danger);
      if (vars.accent) {
        const rgb = this.hexToRgbValues(vars.accent);
        root.style.setProperty('--accent-glow', `rgba(${rgb},0.25)`);
        root.style.setProperty('--accent-glow-strong', `rgba(${rgb},0.5)`);
      }
    },

    clearCustomVars() {
      const props = ['--accent','--accent-light','--accent-glow','--accent-glow-strong','--bg-deep','--glass-bg','--text-primary','--text-secondary','--success','--danger'];
      props.forEach(p => document.documentElement.style.removeProperty(p));
    },

    hexToRgba(hex, alpha) {
      const rgb = this.hexToRgbValues(hex);
      return `rgba(${rgb},${alpha})`;
    },

    hexToRgbValues(hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `${r},${g},${b}`;
    },

    renderGrid() {
      if (!dom.themeGrid) return;
      const activeTheme = config?.activeTheme || '';
      const mode = config?.themeMode || 'auto';

      dom.themeGrid.innerHTML = BUILT_IN_THEMES.map(theme => {
        const isActive = mode === 'custom' && activeTheme === theme.id;
        return `
          <div class="theme-card ${isActive ? 'active' : ''}" data-theme-id="${theme.id}" 
               style="background:linear-gradient(135deg, ${theme.bg} 0%, ${theme.accent}22 100%)">
            <span class="theme-name">${escapeHtml(theme.name)}</span>
            <div class="theme-colors">
              <span class="theme-color-dot" style="background:${theme.accent}"></span>
              <span class="theme-color-dot" style="background:${theme.accentLight}"></span>
              <span class="theme-color-dot" style="background:${theme.bg}"></span>
            </div>
          </div>`;
      }).join('');

      dom.themeGrid.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
          config.themeMode = 'custom';
          config.activeTheme = card.dataset.themeId;
          if (dom.cfgThemeMode) dom.cfgThemeMode.value = 'custom';
          this.clearCustomVars();
          this.apply();
          this.renderGrid();
          this.renderCustomGrid();
          this.updateThemeModeUI();
        });
      });
    },

    renderCustomGrid() {
      const customs = config.customThemes || [];
      if (customs.length === 0) {
        if (dom.savedThemesSection) dom.savedThemesSection.style.display = 'none';
        return;
      }
      if (dom.savedThemesSection) dom.savedThemesSection.style.display = 'block';
      if (!dom.customThemesGrid) return;

      const activeTheme = config?.activeTheme || '';
      dom.customThemesGrid.innerHTML = customs.map(theme => {
        const isActive = config.themeMode === 'custom' && activeTheme === theme.id;
        const accent = theme.vars?.accent || '#7c5cfc';
        const accentLight = theme.vars?.accentLight || '#9b82fc';
        const bg = theme.vars?.bgDeep || '#050409';
        return `
          <div class="theme-card ${isActive ? 'active' : ''}" data-custom-theme-id="${escapeAttr(theme.id)}"
               style="background:linear-gradient(135deg, ${bg} 0%, ${accent}22 100%)">
            <button class="theme-delete" data-delete-theme="${escapeAttr(theme.id)}" title="Törlés"><i class="fa-solid fa-xmark"></i></button>
            <span class="theme-name">${escapeHtml(theme.name)}</span>
            <div class="theme-colors">
              <span class="theme-color-dot" style="background:${accent}"></span>
              <span class="theme-color-dot" style="background:${accentLight}"></span>
              <span class="theme-color-dot" style="background:${bg}"></span>
            </div>
          </div>`;
      }).join('');

      dom.customThemesGrid.querySelectorAll('.theme-card').forEach(card => {
        const deleteBtn = card.querySelector('.theme-delete');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = deleteBtn.dataset.deleteTheme;
            config.customThemes = config.customThemes.filter(t => t.id !== id);
            if (config.activeTheme === id) { config.activeTheme = ''; config.themeMode = 'auto'; }
            this.clearCustomVars();
            this.apply();
            this.renderGrid();
            this.renderCustomGrid();
            saveConfigSilent();
          });
        }
        card.addEventListener('click', (e) => {
          if (e.target.closest('.theme-delete')) return;
          const id = card.dataset.customThemeId;
          config.themeMode = 'custom';
          config.activeTheme = id;
          if (dom.cfgThemeMode) dom.cfgThemeMode.value = 'custom';
          this.clearCustomVars();
          this.apply();
          this.renderGrid();
          this.renderCustomGrid();
          this.updateThemeModeUI();
        });
      });
    },

    updateThemeModeUI() {
      const mode = dom.cfgThemeMode?.value || config?.themeMode || 'auto';
      if (dom.customThemeSection) {
        dom.customThemeSection.style.display = mode === 'custom' ? 'block' : 'none';
      }
    },

    saveCustomTheme() {
      const name = dom.customThemeName?.value?.trim();
      if (!name) { toast('Adj nevet a témának!', 'error'); return; }

      const vars = {
        accent: $('#ct-accent')?.value || '#7c5cfc',
        accentLight: $('#ct-accent-light')?.value || '#9b82fc',
        bgDeep: $('#ct-bg-deep')?.value || '#07060b',
        glassBg: $('#ct-glass-bg')?.value || '#0f0f14',
        textPrimary: $('#ct-text-primary')?.value || '#ebebeb',
        textSecondary: $('#ct-text-secondary')?.value || '#8c8c8c',
        success: $('#ct-success')?.value || '#2dd4a8',
        danger: $('#ct-danger')?.value || '#f4426e',
      };

      const id = 'custom-' + Date.now();
      if (!config.customThemes) config.customThemes = [];
      config.customThemes.push({ id, name, vars });
      config.themeMode = 'custom';
      config.activeTheme = id;

      this.clearCustomVars();
      this.apply();
      this.renderGrid();
      this.renderCustomGrid();
      saveConfigSilent();
      toast('Téma mentve!', 'success');
    },

    exportTheme() {
      const activeId = config.activeTheme;
      let themeData;
      const builtIn = BUILT_IN_THEMES.find(t => t.id === activeId);
      if (builtIn) {
        themeData = { name: builtIn.name, type: 'built-in', id: builtIn.id, vars: builtIn };
      } else {
        const custom = (config.customThemes || []).find(t => t.id === activeId);
        if (custom) {
          themeData = { name: custom.name, type: 'custom', vars: custom.vars };
        } else {
          toast('Nincs aktív custom téma az exportáláshoz!', 'error'); return;
        }
      }
      const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `theme-${themeData.name.replace(/\s+/g, '-').toLowerCase()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast('Téma exportálva!', 'success');
    },

    importTheme(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (!data.name || !data.vars) throw new Error('Invalid theme format');
          const id = 'custom-' + Date.now();
          if (!config.customThemes) config.customThemes = [];
          config.customThemes.push({ id, name: data.name, vars: data.vars });
          config.themeMode = 'custom';
          config.activeTheme = id;
          this.clearCustomVars();
          this.apply();
          this.renderGrid();
          this.renderCustomGrid();
          saveConfigSilent();
          toast(`Téma importálva: ${data.name}`, 'success');
        } catch (err) {
          toast('Érvénytelen téma fájl!', 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  // ============================================
  // PLUGIN MANAGER
  // ============================================
  const PluginManager = {
    pluginWidgets: {},
    loadedPlugins: [],
    uploadFiles: { manifest: null, js: null, css: null },

    async init() {
      // Set up the plugin API
      window.__startpagePluginAPI = {
        registerWidget: (widgetDef) => {
          this.pluginWidgets[widgetDef.id] = widgetDef;
        },
        toast: toast,
        getConfig: () => ({ ...config }),
        getPluginSettings: (pluginId) => {
          const entry = (config.plugins || []).find(p => p.id === pluginId);
          return entry?.settings || {};
        },
        savePluginSettings: async (pluginId, settings) => {
          if (!config.plugins) config.plugins = [];
          let entry = config.plugins.find(p => p.id === pluginId);
          if (!entry) { entry = { id: pluginId, enabled: true }; config.plugins.push(entry); }
          entry.settings = settings;
          await saveConfigSilent();
        },
        reRenderPlugin: (pluginId) => {
          const widget = this.pluginWidgets[pluginId];
          if (!widget) return;
          const wrapper = document.querySelector(`.widget-wrapper[data-widget-id="plugin-${pluginId}"]`);
          if (!wrapper) return;
          const card = wrapper.querySelector('.glass-card');
          if (card && widget.render) widget.render(card, wrapper.dataset.widgetSize || 'large');
        },
      };

      await this.loadAll();
    },

    async loadAll() {
      try {
        const res = await fetch('/api/plugins');
        const data = await res.json();
        this.loadedPlugins = data.plugins || [];

        const enabledPlugins = (config.plugins || []).filter(p => p.enabled !== false);

        for (const plugin of this.loadedPlugins) {
          const configEntry = enabledPlugins.find(p => p.id === plugin.id);
          if (!configEntry) continue;

          // Load CSS
          if (plugin.hasCSS) {
            const existingLink = document.querySelector(`link[data-plugin="${plugin.id}"]`);
            if (!existingLink) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = `/plugins/${plugin.id}/widget.css`;
              link.dataset.plugin = plugin.id;
              document.head.appendChild(link);
            }
          }

          // Load JS
          if (plugin.hasJS) {
            try {
              const script = document.createElement('script');
              script.src = `/api/plugins/${plugin.id}/code`;
              script.dataset.plugin = plugin.id;
              const loaded = new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = reject;
              });
              document.body.appendChild(script);
              await loaded;
            } catch {}
          }
        }

        // After loading, render plugin widgets
        setTimeout(() => this.renderWidgets(), 500);
      } catch {}
    },

    renderWidgets() {
      if (!dom.pluginWidgetsContainer) return;
      dom.pluginWidgetsContainer.innerHTML = '';

      for (const [id, widget] of Object.entries(this.pluginWidgets)) {
        const plugin = this.loadedPlugins.find(p => p.id === id);
        if (!plugin) continue;
        const configEntry = (config.plugins || []).find(p => p.id === id);
        if (!configEntry || configEntry.enabled === false) continue;

        const size = configEntry.size || plugin.defaultSize || 'large';
        const wrapper = document.createElement('div');
        wrapper.className = 'widget-wrapper widget-wrapper-inline';
        wrapper.dataset.widgetId = `plugin-${id}`;
        wrapper.dataset.widgetSize = size;

        const controls = document.createElement('div');
        controls.className = 'widget-controls';
        controls.innerHTML = `
          <button class="widget-ctrl-btn" data-action="resize" title="Méret váltás"><i class="fa-solid fa-arrows-left-right"></i></button>
          <button class="widget-ctrl-btn" data-action="hide" title="Elrejtés"><i class="fa-solid fa-eye-slash"></i></button>`;
        wrapper.appendChild(controls);

        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.cssText = 'padding:1rem 1.25rem;width:100%;max-width:960px';
        wrapper.appendChild(card);

        dom.pluginWidgetsContainer.appendChild(wrapper);

        // Initialize and render
        try {
          if (widget.init) widget.init();
          if (widget.render) widget.render(card, size);

          // Set up refresh
          if (widget.refresh && plugin.refreshInterval) {
            setInterval(async () => {
              await widget.refresh();
              if (widget.render) widget.render(card, size);
            }, plugin.refreshInterval);
          }
        } catch (err) {
          card.innerHTML = `<div style="color:var(--danger);font-size:0.82rem"><i class="fa-solid fa-triangle-exclamation"></i> Plugin hiba: ${escapeHtml(err.message)}</div>`;
        }
      }
    },

    renderSettingsList() {
      if (!dom.pluginsList) return;

      if (this.loadedPlugins.length === 0) {
        dom.pluginsList.innerHTML = `<div class="plugins-empty"><i class="fa-solid fa-puzzle-piece"></i> Nincs telepített plugin</div>`;
        return;
      }

      dom.pluginsList.innerHTML = this.loadedPlugins.map(plugin => {
        const configEntry = (config.plugins || []).find(p => p.id === plugin.id);
        const enabled = configEntry ? configEntry.enabled !== false : true;
        return `
          <div class="plugin-card" data-plugin-id="${escapeAttr(plugin.id)}">
            <div class="plugin-icon"><i class="${escapeAttr(plugin.icon || 'fa-solid fa-puzzle-piece')}"></i></div>
            <div class="plugin-info">
              <div class="plugin-name">${escapeHtml(plugin.name || plugin.id)}</div>
              <div class="plugin-desc">${escapeHtml(plugin.description || '')}</div>
              <div class="plugin-version">v${escapeHtml(plugin.version || '1.0.0')} · ${escapeHtml(plugin.author || 'Ismeretlen')}</div>
            </div>
            <div class="plugin-actions">
              <button class="plugin-toggle ${enabled ? 'enabled' : ''}" data-plugin-toggle="${escapeAttr(plugin.id)}" title="${enabled ? 'Letiltás' : 'Engedélyezés'}"></button>
              <button class="plugin-delete-btn" data-plugin-delete="${escapeAttr(plugin.id)}" title="Törlés"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`;
      }).join('');

      // Bind events
      dom.pluginsList.querySelectorAll('[data-plugin-toggle]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.pluginToggle;
          if (!config.plugins) config.plugins = [];
          let entry = config.plugins.find(p => p.id === id);
          if (!entry) { entry = { id, enabled: true }; config.plugins.push(entry); }
          entry.enabled = !entry.enabled;
          btn.classList.toggle('enabled');
          saveConfigSilent();
          toast(entry.enabled ? 'Plugin engedélyezve — frissíts az oldalt!' : 'Plugin letiltva — frissíts az oldalt!', 'success');
        });
      });

      dom.pluginsList.querySelectorAll('[data-plugin-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.pluginDelete;
          try {
            await fetch(`/api/plugins/${id}`, { method: 'DELETE' });
            config.plugins = (config.plugins || []).filter(p => p.id !== id);
            this.loadedPlugins = this.loadedPlugins.filter(p => p.id !== id);
            this.renderSettingsList();
            toast('Plugin törölve!', 'success');
          } catch {
            toast('Törlési hiba!', 'error');
          }
        });
      });
    },

    async installFromUrl(url) {
      try {
        const res = await fetch('/api/plugins/install', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        if (data.success) {
          toast(`Plugin telepítve: ${data.plugin.name || data.plugin.id}`, 'success');
          // Reload plugins list
          const pluginsRes = await fetch('/api/plugins');
          const pluginsData = await pluginsRes.json();
          this.loadedPlugins = pluginsData.plugins || [];
          // Update config
          const cfgRes = await fetch('/api/config');
          config = await cfgRes.json();
          this.renderSettingsList();
        } else {
          toast(`Telepítési hiba: ${data.error}`, 'error');
        }
      } catch (err) {
        toast('Telepítési hiba!', 'error');
      }
    },

    async installFromUpload() {
      const { manifest, js, css } = this.uploadFiles;
      if (!manifest || !js) {
        toast('Manifest.json és widget.js szükséges!', 'error');
        return;
      }

      try {
        const manifestText = await manifest.text();
        const jsText = await js.text();
        const cssText = css ? await css.text() : undefined;

        const res = await fetch('/api/plugins/install', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ manifest: manifestText, code: jsText, css: cssText })
        });
        const data = await res.json();
        if (data.success) {
          toast(`Plugin telepítve: ${data.plugin.name || data.plugin.id}`, 'success');
          const pluginsRes = await fetch('/api/plugins');
          const pluginsData = await pluginsRes.json();
          this.loadedPlugins = pluginsData.plugins || [];
          const cfgRes = await fetch('/api/config');
          config = await cfgRes.json();
          this.renderSettingsList();
          this.resetUpload();
        } else {
          toast(`Telepítési hiba: ${data.error}`, 'error');
        }
      } catch (err) {
        toast('Telepítési hiba!', 'error');
      }
    },

    resetUpload() {
      this.uploadFiles = { manifest: null, js: null, css: null };
      if (dom.pluginPickManifest) dom.pluginPickManifest.classList.remove('selected');
      if (dom.pluginPickJs) dom.pluginPickJs.classList.remove('selected');
      if (dom.pluginPickCss) dom.pluginPickCss.classList.remove('selected');
      if (dom.pluginUploadStatus) dom.pluginUploadStatus.textContent = '';
      if (dom.pluginUploadBtn) dom.pluginUploadBtn.disabled = true;
    },

    updateUploadStatus() {
      const parts = [];
      if (this.uploadFiles.manifest) parts.push('✓ manifest.json');
      if (this.uploadFiles.js) parts.push('✓ widget.js');
      if (this.uploadFiles.css) parts.push('✓ widget.css');
      if (dom.pluginUploadStatus) dom.pluginUploadStatus.textContent = parts.join(' · ');
      if (dom.pluginUploadBtn) {
        dom.pluginUploadBtn.disabled = !(this.uploadFiles.manifest && this.uploadFiles.js);
      }
    }
  };

  // ============================================
  // INIT
  // ============================================
  async function init() {
    try {
      const res = await fetch('/api/config');
      config = await res.json();
    } catch {
      config = getDefaultConfig();
      toast('Nem sikerült betölteni a konfigurációt', 'error');
    }

    // Migrate old config
    if (!config.widgetLayout) {
      config.widgetLayout = BUILT_IN_WIDGETS.map(w => ({ id: w.id, size: w.defaultSize, visible: true }));
    }
    // Add any new built-in widgets missing from a previously saved layout
    BUILT_IN_WIDGETS.forEach(w => {
      if (!config.widgetLayout.find(l => l.id === w.id)) {
        config.widgetLayout.push({ id: w.id, size: w.defaultSize, visible: true });
      }
    });
    if (!config.customThemes) config.customThemes = [];
    if (!config.plugins) config.plugins = [];
    if (!config.activeTheme) config.activeTheme = '';

    startClock();
    renderLinks();
    applyBackground();
    updateSearchBadge();
    ThemeManager.apply();
    fetchWeather();
    fetchSystemInfo();
    fetchUpdates();
    fetchNetwork();
    fetchMedia();
    loadTodos();
    loadRSSFeeds();
    loadScratchpad();
    renderAgenda();
    initPomodoro();
    bindEvents();
    bindDockerEvents();
    fetchDocker();

    // Apply widget layout
    WidgetManager.applyLayout();
    WidgetManager.setupDragDrop();

    // Load plugins
    await PluginManager.init();

    // Show customize toggle on hover at top
    document.addEventListener('mousemove', (e) => {
      if (e.clientY < 60 && e.clientX > window.innerWidth * 0.3 && e.clientX < window.innerWidth * 0.7) {
        dom.customizeToggle?.classList.add('visible');
      } else if (!customizeMode && e.clientY > 100) {
        dom.customizeToggle?.classList.remove('visible');
      }
    });

    // Intervals
    setInterval(fetchWeather, 15 * 60 * 1000);
    setInterval(fetchSystemInfo, 60 * 1000);
    setInterval(fetchUpdates, 30 * 60 * 1000);
    setInterval(fetchNetwork, 30 * 1000);
    setInterval(fetchMedia, 10 * 1000);
    setInterval(() => { if (dockerAvailable || !document.hidden) fetchDocker(); }, 30 * 1000);
    setInterval(() => ThemeManager.apply(), 5 * 60 * 1000);
    setInterval(pollClipboard, 5 * 1000);
  }

  function getDefaultConfig() {
    return {
      searchEngine: 'https://duckduckgo.com/?q=',
      searchEngineName: 'DuckDuckGo',
      bangs: { '!g': 'https://google.com/search?q=' },
      backgroundUrl: '',
      weatherCity: 'Budapest',
      userName: '',
      categories: [],
      todos: [],
      rssFeeds: [],
      events: [],
      githubUser: '',
      terminalEnabled: true,
      themeMode: 'auto',
      activeTheme: '',
      customThemes: [],
      plugins: [],
      widgetLayout: [],
      pomodoroMinutes: 25,
      pomodoroBreak: 5,
      focusCategories: ['Szórakozás'],
      currencyTarget: 'HUF',
      currencyApiUrl: '',
      currencyRates: {},
      translateApiUrl: '',
      rssViewMode: 'compact',
    };
  }

  async function saveConfigSilent() {
    try {
      await fetch('/api/config', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
    } catch {}
  }

  // ============================================
  // CUSTOMIZE MODE
  // ============================================
  function toggleCustomizeMode() {
    customizeMode = !customizeMode;
    document.body.classList.toggle('customize-mode', customizeMode);
    if (dom.customizeToggle) {
      dom.customizeToggle.classList.toggle('visible', customizeMode);
    }
  }

  // ============================================
  // CLOCK & DATE
  // ============================================
  function startClock() { updateClock(); setInterval(updateClock, 1000); }

  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    dom.clock.textContent = `${h}:${m}`;
    dom.clock.style.opacity = now.getSeconds() % 2 === 0 ? '1' : '0.85';
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dom.date.textContent = now.toLocaleDateString('hu-HU', options);
    updateGreeting(now);
  }

  function updateGreeting(now) {
    const hour = now.getHours();
    const name = config?.userName || '';
    let greet = '';
    if (hour >= 5 && hour < 12) greet = 'Jó reggelt';
    else if (hour >= 12 && hour < 18) greet = 'Szép napot';
    else if (hour >= 18 && hour < 22) greet = 'Jó estét';
    else greet = 'Jó éjszakát';
    dom.greeting.textContent = name ? `${greet}, ${name}!` : `${greet}!`;
  }

  // ============================================
  // SMART SEARCH BAR
  // ============================================
  function handleSearch(e) {
    if (e.key !== 'Enter') return;
    const query = dom.searchInput.value.trim();
    if (!query) return;
    hideBangDropdown();
    hideSmartResult();

    // Terminal command
    if (query.startsWith('>')) {
      e.preventDefault();
      const cmd = query.slice(1).trim();
      if (cmd && config.terminalEnabled) { openTerminal(cmd); dom.searchInput.value = ''; }
      return;
    }

    // Bangs
    const firstWord = query.split(' ')[0];
    const rest = query.slice(firstWord.length).trim();
    if (config.bangs && config.bangs[firstWord]) {
      window.location.href = config.bangs[firstWord] + encodeURIComponent(rest);
      return;
    }

    // Translation shortcut
    if (/^[a-z]{2}>[a-z]{2}\s+.+/i.test(query)) {
      return;
    }

    window.location.href = config.searchEngine + encodeURIComponent(query);
  }

  function handleSearchInput() {
    const val = dom.searchInput.value;

    if (val.startsWith('>')) {
      dom.searchWrapper.classList.add('terminal-mode');
      dom.searchWrapper.classList.remove('calc-mode');
      hideSmartResult();
    } else {
      dom.searchWrapper.classList.remove('terminal-mode');
    }

    if (val.startsWith('!') && config.bangs) {
      const typed = val.split(' ')[0].toLowerCase();
      const matches = Object.entries(config.bangs).filter(([key]) => key.toLowerCase().startsWith(typed));
      if (matches.length > 0 && typed.length > 0) { showBangDropdown(matches); hideSmartResult(); return; }
    }
    hideBangDropdown();

    clearTimeout(smartResultDebounce);
    if (val.trim().length > 1 && !val.startsWith('>') && !val.startsWith('!')) {
      smartResultDebounce = setTimeout(() => processSmartInput(val.trim()), 200);
    } else {
      hideSmartResult();
      dom.searchWrapper.classList.remove('calc-mode');
    }
  }

  function processSmartInput(query) {
    if (/^[\d\s+\-*/.()%^,]+$/.test(query) && query.length >= 2) {
      try {
        const expr = query.replace(/,/g, '.').replace(/\^/g, '**');
        if (/[a-zA-Z_$]/.test(expr)) throw new Error('Invalid');
        const result = Function('"use strict"; return (' + expr + ')')();
        if (typeof result === 'number' && isFinite(result)) {
          const formatted = result.toLocaleString('hu-HU', { maximumFractionDigits: 8 });
          showSmartResult('calc', `= ${formatted}`, 'Számológép');
          dom.searchWrapper.classList.add('calc-mode');
          return;
        }
      } catch {}
    }

    dom.searchWrapper.classList.remove('calc-mode');

    const currencyMatch = query.match(/^([\d,.]+)\s*([A-Z]{3})(?:\s+([A-Z]{3}))?$/i);
    if (currencyMatch) {
      const amount = parseFloat(currencyMatch[1].replace(',', '.'));
      const from = currencyMatch[2].toUpperCase();
      const to = (currencyMatch[3] || config.currencyTarget || 'HUF').toUpperCase();
      if (from !== to && !isNaN(amount)) { fetchCurrency(amount, from, to); return; }
    }

    const translateMatch = query.match(/^([a-z]{2})>([a-z]{2})\s+(.+)$/i);
    if (translateMatch) { fetchTranslation(translateMatch[1], translateMatch[2], translateMatch[3]); return; }

    hideSmartResult();
  }

  async function fetchCurrency(amount, from, to) {
    showSmartResult('currency', 'Számítás...', `${amount} ${from} → ${to}`);
    try {
      const res = await fetch(`/api/currency?amount=${amount}&from=${from}&to=${to}`);
      const data = await res.json();
      if (data.error && !data.result) {
        showSmartResult('currency', data.error, `${from} → ${to}`, true);
      } else if (data.result) {
        const formatted = parseFloat(data.result).toLocaleString('hu-HU', { maximumFractionDigits: 2 });
        showSmartResult('currency', `${formatted} ${to}`, `${amount} ${from} — ${data.source || ''}`);
      }
    } catch {
      showSmartResult('currency', 'Nem elérhető', `${from} → ${to}`, true);
    }
  }

  async function fetchTranslation(from, to, text) {
    showSmartResult('translate', 'Fordítás...', `${from} → ${to}`);
    try {
      const res = await fetch(`/api/translate?from=${from}&to=${to}&text=${encodeURIComponent(text)}`);
      const data = await res.json();
      if (data.error) {
        showSmartResult('translate', data.error, `${from} → ${to}`, true);
      } else {
        const result = typeof data.result === 'string' ? data.result : JSON.stringify(data.result);
        showSmartResult('translate', result, `${from} → ${to}`);
      }
    } catch {
      showSmartResult('translate', 'Nem elérhető', '', true);
    }
  }

  function showSmartResult(type, value, label, isError = false) {
    const icons = { calc: 'fa-calculator', currency: 'fa-coins', translate: 'fa-language' };
    dom.smartResult.innerHTML = `
      <div class="smart-result-row">
        <div class="smart-result-icon ${type}"><i class="fa-solid ${icons[type]}"></i></div>
        <span class="${isError ? 'smart-result-error' : 'smart-result-value'}">${escapeHtml(value)}</span>
        <span class="smart-result-label">${escapeHtml(label)}</span>
      </div>`;
    dom.smartResult.classList.add('visible');
  }

  function hideSmartResult() { dom.smartResult.classList.remove('visible'); }

  function showBangDropdown(matches) {
    dom.bangDropdown.innerHTML = matches.map(([key, url]) => `
      <div class="bang-item" data-bang="${escapeAttr(key)}">
        <span class="bang-key">${escapeHtml(key)}</span>
        <span class="bang-url">${cleanUrl(url)}</span>
      </div>`).join('');
    dom.bangDropdown.classList.add('visible');
    dom.bangDropdown.querySelectorAll('.bang-item').forEach((item) => {
      item.addEventListener('click', () => {
        const bang = item.dataset.bang;
        const currentVal = dom.searchInput.value;
        const rest = currentVal.slice(currentVal.indexOf(' ') + 1);
        dom.searchInput.value = bang + ' ' + (currentVal.includes(' ') ? rest : '');
        dom.searchInput.focus();
        hideBangDropdown();
      });
    });
  }

  function hideBangDropdown() { dom.bangDropdown.classList.remove('visible'); }
  function cleanUrl(url) { try { return new URL(url).hostname; } catch { return url; } }

  function updateSearchBadge() {
    const name = config.searchEngineName || 'Search';
    const abbr = name.length <= 4 ? name.toUpperCase() : name.split(/[\s-]+/).map(w => w[0]).join('').toUpperCase().slice(0, 3);
    dom.searchBadge.textContent = abbr || 'DDG';
  }

  // ============================================
  // LINKS RENDERING
  // ============================================
  function renderLinks() {
    dom.linksSection.innerHTML = '';
    if (!config.categories || config.categories.length === 0) {
      dom.linksSection.innerHTML = `<div class="category-card glass-card" style="grid-column:1/-1;text-align:center;padding:2rem"><p style="color:var(--text-secondary)">Nincsenek kategóriák. Kattints a <i class="fa-solid fa-gear"></i> ikonra!</p></div>`;
      return;
    }
    const focusCats = config.focusCategories || [];
    config.categories.forEach((cat, catIdx) => {
      const card = document.createElement('div');
      card.className = 'category-card glass-card';
      card.dataset.catIdx = catIdx;
      if (cat.focusHide || focusCats.includes(cat.name)) {
        card.classList.add('focus-hidden');
      }
      const linksHtml = cat.links?.length
        ? cat.links.map((link, linkIdx) => {
            const domain = getDomain(link.url);
            const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
            return `<a class="link-item" href="${escapeAttr(link.url)}" target="_self" rel="noopener" data-cat="${catIdx}" data-link="${linkIdx}">
                <img class="favicon" src="${faviconUrl}" alt="" loading="lazy" onerror="this.style.display='none'">
                ${escapeHtml(link.name)}</a>`;
          }).join('')
        : `<span class="category-empty">Üres kategória</span>`;
      card.innerHTML = `<div class="category-header"><i class="${escapeAttr(cat.icon || 'fa-solid fa-folder')}"></i><span>${escapeHtml(cat.name)}</span></div><div class="category-links">${linksHtml}</div>`;
      dom.linksSection.appendChild(card);
    });
    allLinks = Array.from(dom.linksSection.querySelectorAll('.link-item'));
  }

  function getDomain(url) { try { return new URL(url).hostname; } catch { return ''; } }

  // ============================================
  // BACKGROUND
  // ============================================
  function applyBackground() {
    if (config.backgroundUrl) {
      dom.bgLayer.style.backgroundImage = `url('${config.backgroundUrl}')`;
    } else {
      dom.bgLayer.style.backgroundImage = `radial-gradient(ellipse at 20% 80%,rgba(124,92,252,0.15) 0%,transparent 50%),radial-gradient(ellipse at 80% 20%,rgba(45,212,168,0.08) 0%,transparent 50%),radial-gradient(ellipse at 50% 50%,rgba(244,66,110,0.06) 0%,transparent 60%)`;
    }
  }

  // ============================================
  // WEATHER
  // ============================================
  const weatherIcons = {
    '113':'fa-sun','116':'fa-cloud-sun','119':'fa-cloud','122':'fa-cloud','143':'fa-smog','176':'fa-cloud-rain','179':'fa-snowflake','182':'fa-cloud-meatball','200':'fa-cloud-bolt','227':'fa-wind','230':'fa-snowflake','248':'fa-smog','260':'fa-smog','263':'fa-cloud-rain','266':'fa-cloud-rain','293':'fa-cloud-rain','296':'fa-cloud-rain','299':'fa-cloud-showers-heavy','302':'fa-cloud-showers-heavy','305':'fa-cloud-showers-heavy','308':'fa-cloud-showers-heavy','323':'fa-snowflake','326':'fa-snowflake','329':'fa-snowflake','332':'fa-snowflake','335':'fa-snowflake','338':'fa-snowflake','353':'fa-cloud-rain','356':'fa-cloud-showers-heavy','386':'fa-cloud-bolt','389':'fa-cloud-bolt','395':'fa-snowflake',
  };

  async function fetchWeather() {
    const city = config.weatherCity || 'Budapest';
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const data = await res.json();
      dom.weatherTemp.textContent = `${data.temp_C}°C`;
      dom.weatherDesc.textContent = data.description || '';
      dom.weatherCity.textContent = data.city || '';
      const iconClass = weatherIcons[data.weatherCode] || 'fa-cloud-sun';
      dom.weatherIcon.className = `fa-solid ${iconClass} weather-icon`;
    } catch { dom.weatherTemp.textContent = '—°C'; dom.weatherDesc.textContent = 'N/A'; }
  }

  // ============================================
  // SYSTEM MONITOR
  // ============================================
  async function fetchSystemInfo() {
    try {
      const res = await fetch('/api/system');
      const data = await res.json();
      dom.cpuValue.textContent = `${data.cpu.percent}%`;
      dom.cpuBar.style.width = `${data.cpu.percent}%`;
      dom.cpuBar.className = 'sys-bar-fill' + (data.cpu.percent > 80 ? ' danger' : data.cpu.percent > 50 ? ' warn' : '');
      dom.ramValue.textContent = `${data.ram.percent}%`;
      dom.ramBar.style.width = `${data.ram.percent}%`;
      dom.ramBar.className = 'sys-bar-fill' + (data.ram.percent > 85 ? ' danger' : data.ram.percent > 60 ? ' warn' : '');
      dom.diskValue.textContent = `${data.disk.percent}%`;
      dom.uptimeValue.textContent = data.uptime;
    } catch {}
  }

  // ============================================
  // ARCH UPDATES
  // ============================================
  async function fetchUpdates() {
    try {
      const res = await fetch('/api/updates');
      const data = await res.json();
      dom.updatesCount.textContent = data.count;
      if (data.count > 0) { dom.sysUpdates.classList.add('has-updates'); dom.sysUpdates.title = `${data.count} frissítés elérhető`; }
      else { dom.sysUpdates.classList.remove('has-updates'); dom.sysUpdates.title = 'Arch naprakész'; }
    } catch { dom.updatesCount.textContent = '?'; }
  }

  // ============================================
  // DOCKER
  // ============================================
  let dockerAvailable = false;

  async function fetchDocker() {
    if (!dom.dockerList) return;
    try {
      const res = await fetch('/api/docker');
      const data = await res.json();
      dockerAvailable = !!data.available;

      if (!data.available) {
        dom.dockerList.innerHTML = '<div class="docker-empty"><i class="fa-brands fa-docker"></i> Docker nem elérhető ezen a gépen</div>';
        dom.dockerRunning.textContent = '0';
        dom.dockerTotal.textContent = '0';
        dom.dockerImages.textContent = '0';
        return;
      }

      dom.dockerRunning.textContent = data.running;
      dom.dockerTotal.textContent = data.total;
      dom.dockerImages.textContent = data.images;

      if (!data.containers.length) {
        dom.dockerList.innerHTML = '<div class="docker-empty"><i class="fa-solid fa-cube"></i> Nincs konténer</div>';
        return;
      }

      dom.dockerList.innerHTML = data.containers.map(c => {
        const running = c.state === 'running';
        const paused = c.state === 'paused';
        return `
        <div class="docker-item" data-container="${escapeAttr(c.name || c.id)}" data-id="${escapeAttr(c.id)}">
          <span class="docker-dot ${running ? 'running' : paused ? 'paused' : 'stopped'}" title="${escapeAttr(c.state)}"></span>
          <div class="docker-item-info">
            <span class="docker-item-name">${escapeHtml(c.name)}</span>
            <span class="docker-item-meta">${escapeHtml(c.image)}${c.ports ? ' · ' + escapeHtml(c.ports) : ''}</span>
            <span class="docker-item-status">${escapeHtml(c.status)}</span>
          </div>
          <div class="docker-item-actions">
            ${running || paused ? `
              <button class="docker-action-btn" data-action="${paused ? 'unpause' : 'pause'}" title="${paused ? 'Folytatás' : 'Szünet'}"><i class="fa-solid fa-${paused ? 'play' : 'pause'}"></i></button>
              <button class="docker-action-btn" data-action="restart" title="Újraindítás"><i class="fa-solid fa-rotate-right"></i></button>
              <button class="docker-action-btn danger" data-action="stop" title="Leállítás"><i class="fa-solid fa-stop"></i></button>
            ` : `
              <button class="docker-action-btn success" data-action="start" title="Indítás"><i class="fa-solid fa-play"></i></button>
            `}
            <button class="docker-action-btn" data-action="logs" title="Logok"><i class="fa-solid fa-file-lines"></i></button>
          </div>
        </div>`;
      }).join('');
    } catch {
      dockerAvailable = false;
      dom.dockerList.innerHTML = '<div class="docker-empty">Hiba a Docker lekérdezésekor</div>';
    }
  }

  async function dockerControl(action, container, btn) {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
    try {
      const res = await fetch('/api/docker/control', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, container })
      });
      const data = await res.json();
      if (data.success) toast(`Docker: ${action} — ${container}`, 'success');
      else toast(`Docker hiba: ${data.error || action + ' sikertelen'}`, 'error');
    } catch {
      toast('Docker hiba!', 'error');
    }
    await fetchDocker();
  }

  async function dockerShowLogs(container) {
    try {
      const res = await fetch(`/api/docker/logs/${encodeURIComponent(container)}`);
      const data = await res.json();
      dom.dockerLogsTitle.textContent = `Logok — ${container}`;
      dom.dockerLogsBody.textContent = data.logs || '(nincs log)';
      dom.dockerLogs.style.display = 'flex';
      dom.dockerLogsBody.scrollTop = dom.dockerLogsBody.scrollHeight;
    } catch {
      toast('Nem sikerült betölteni a logokat', 'error');
    }
  }

  function bindDockerEvents() {
    dom.dockerRefresh?.addEventListener('click', () => fetchDocker());
    dom.dockerLogsClose?.addEventListener('click', () => { dom.dockerLogs.style.display = 'none'; });
    dom.dockerList?.addEventListener('click', (e) => {
      const btn = e.target.closest('.docker-action-btn');
      if (!btn) return;
      const item = btn.closest('.docker-item');
      const container = item?.dataset.container;
      const action = btn.dataset.action;
      if (!container || !action) return;
      if (action === 'logs') dockerShowLogs(container);
      else dockerControl(action, container, btn);
    });
  }

  // ============================================
  // NETWORK / PING
  // ============================================
  async function fetchNetwork() {
    try {
      const res = await fetch('/api/network');
      const data = await res.json();
      if (data.online) {
        dom.netDot.classList.add('online'); dom.netDot.classList.remove('offline');
        dom.netLabel.textContent = data.latency ? `${Math.round(data.latency)}ms` : 'OK';
      } else {
        dom.netDot.classList.remove('online'); dom.netDot.classList.add('offline');
        dom.netLabel.textContent = 'OFF';
      }
    } catch { dom.netDot.classList.remove('online'); dom.netDot.classList.add('offline'); dom.netLabel.textContent = '—'; }
  }

  // ============================================
  // MEDIA (MPRIS / playerctl)
  // ============================================
  async function fetchMedia() {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      if (data.playing || data.paused) {
        dom.mediaWidget.classList.add('visible');
        dom.mediaTitle.textContent = data.title || 'Ismeretlen';
        dom.mediaArtist.textContent = data.artist || '';
        if (data.artUrl) {
          dom.mediaArt.innerHTML = `<img src="${escapeAttr(data.artUrl)}" alt="Album Art" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-music media-art-placeholder\\'></i>'">`;
        } else {
          dom.mediaArt.innerHTML = '<i class="fa-solid fa-music media-art-placeholder"></i>';
        }
        dom.mediaPlayIcon.className = data.playing ? 'fa-solid fa-pause' : 'fa-solid fa-play';
      } else {
        dom.mediaWidget.classList.remove('visible');
      }
    } catch { dom.mediaWidget.classList.remove('visible'); }
  }

  async function mediaControl(action) {
    try {
      await fetch('/api/media/control', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      setTimeout(fetchMedia, 300);
    } catch {}
  }

  // ============================================
  // TODO MODULE
  // ============================================
  function loadTodos() { renderTodos(); }

  function renderTodos() {
    const todos = config.todos || [];
    dom.todoCount.textContent = todos.filter(t => !t.done).length;
    if (todos.length === 0) { dom.todoList.innerHTML = '<div class="todo-empty">Nincs teendő — adj hozzá egyet!</div>'; return; }
    dom.todoList.innerHTML = todos.map((todo, i) => `
      <div class="todo-item ${todo.done ? 'completed' : ''}" data-idx="${i}">
        <div class="todo-checkbox" data-action="toggle" data-idx="${i}"><i class="fa-solid fa-check"></i></div>
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <button class="todo-delete" data-action="delete" data-idx="${i}" title="Törlés"><i class="fa-solid fa-xmark"></i></button>
      </div>`).join('');
  }

  function handleTodoClick(e) {
    const el = e.target.closest('[data-action]'); if (!el) return;
    const idx = parseInt(el.dataset.idx);
    if (el.dataset.action === 'toggle') { config.todos[idx].done = !config.todos[idx].done; }
    else if (el.dataset.action === 'delete') { config.todos.splice(idx, 1); }
    renderTodos(); saveTodos();
  }

  function addTodo() {
    const text = dom.todoInput.value.trim(); if (!text) return;
    if (!config.todos) config.todos = [];
    config.todos.push({ text, done: false, created: Date.now() });
    dom.todoInput.value = ''; renderTodos(); saveTodos();
  }

  async function saveTodos() {
    try { await fetch('/api/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ todos: config.todos }) }); } catch {}
  }

  // ============================================
  // RSS MODULE
  // ============================================
  async function loadRSSFeeds() {
    const feeds = config.rssFeeds || [];
    if (feeds.length === 0) { dom.rssScroll.innerHTML = '<span class="rss-loading">Nincs RSS feed beállítva</span>'; return; }
    dom.rssScroll.innerHTML = '<span class="rss-loading">Hírek betöltése...</span>';
    rssAllItems = [];

    for (const feed of feeds) {
      try {
        const res = await fetch(`/api/rss?url=${encodeURIComponent(feed.url)}`);
        const data = await res.json();
        if (data.items) {
          data.items.forEach(item => { rssAllItems.push({ ...item, source: feed.name || data.title }); });
        }
      } catch {}
    }

    if (rssAllItems.length === 0) { dom.rssScroll.innerHTML = '<span class="rss-loading">Nem sikerült híreket betölteni</span>'; return; }
    rssAllItems.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderRSS();
  }

  function renderRSS() {
    const mode = config.rssViewMode || 'compact';
    renderRSSTicker();
    renderRSSCards();
    toggleRSSView(mode);
  }

  function renderRSSTicker() {
    const items = rssAllItems.slice(0, 30);
    const html = items.map(item => `
      <span class="rss-item">
        <span class="rss-source">${escapeHtml(item.source)}</span>
        <a href="${escapeAttr(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a>
        <span class="rss-sep">◆</span>
      </span>`).join('');
    dom.rssScroll.innerHTML = html + html;
  }

  function renderRSSCards() {
    const items = rssAllItems.slice(0, 12);
    dom.rssCards.innerHTML = items.map(item => {
      const dateStr = item.date ? new Date(item.date).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      const imgHtml = item.image
        ? `<img src="${escapeAttr(item.image)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-newspaper rss-card-placeholder\\'></i>'">`
        : '<i class="fa-solid fa-newspaper rss-card-placeholder"></i>';
      return `
        <a class="rss-card" href="${escapeAttr(item.link)}" target="_blank" rel="noopener">
          <div class="rss-card-img">${imgHtml}</div>
          <div class="rss-card-body">
            <span class="rss-card-source">${escapeHtml(item.source)}</span>
            <span class="rss-card-title">${escapeHtml(item.title)}</span>
            <span class="rss-card-snippet">${escapeHtml(item.contentSnippet || '')}</span>
            <span class="rss-card-date">${escapeHtml(dateStr)}</span>
          </div>
        </a>`;
    }).join('');
  }

  function toggleRSSView(mode) {
    config.rssViewMode = mode;
    if (mode === 'expanded') {
      dom.rssTicker.style.display = 'none';
      dom.rssCards.style.display = 'grid';
      dom.rssToggleIcon.className = 'fa-solid fa-down-left-and-up-right-to-center';
    } else {
      dom.rssTicker.style.display = 'flex';
      dom.rssCards.style.display = 'none';
      dom.rssToggleIcon.className = 'fa-solid fa-up-right-and-down-left-from-center';
    }
  }

  // ============================================
  // TERMINAL MODULE
  // ============================================
  function openTerminal(initialCmd) {
    dom.terminalOverlay.classList.add('open');
    dom.terminalInput.focus();
    if (initialCmd) execTerminalCommand(initialCmd);
    document.addEventListener('keydown', onTerminalKeydown);
  }

  function closeTerminal() {
    dom.terminalOverlay.classList.remove('open');
    document.removeEventListener('keydown', onTerminalKeydown);
  }

  function onTerminalKeydown(e) { if (e.key === 'Escape') { e.preventDefault(); closeTerminal(); } }

  async function execTerminalCommand(cmd) {
    terminalHistory.push(cmd);
    terminalHistoryIdx = terminalHistory.length;
    const cmdLine = document.createElement('div'); cmdLine.className = 'cmd-line'; cmdLine.textContent = `❯ ${cmd}`;
    dom.terminalOutput.appendChild(cmdLine);
    dom.terminalTitle.textContent = `Terminal — ${cmd}`;
    try {
      const res = await fetch('/api/exec', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command: cmd }) });
      const data = await res.json();
      const outputEl = document.createElement('div');
      outputEl.className = data.exitCode === 0 ? 'cmd-output' : 'cmd-error';
      outputEl.textContent = data.output || '(nincs kimenet)';
      dom.terminalOutput.appendChild(outputEl);
    } catch (err) {
      const errorEl = document.createElement('div'); errorEl.className = 'cmd-error'; errorEl.textContent = `Hiba: ${err.message}`;
      dom.terminalOutput.appendChild(errorEl);
    }
    dom.terminalOutput.parentElement.scrollTop = dom.terminalOutput.parentElement.scrollHeight;
    dom.terminalInput.value = '';
  }

  function handleTerminalInput(e) {
    if (e.key === 'Enter') { const cmd = dom.terminalInput.value.trim(); if (cmd) execTerminalCommand(cmd); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (terminalHistoryIdx > 0) { terminalHistoryIdx--; dom.terminalInput.value = terminalHistory[terminalHistoryIdx]; } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (terminalHistoryIdx < terminalHistory.length - 1) { terminalHistoryIdx++; dom.terminalInput.value = terminalHistory[terminalHistoryIdx]; } else { terminalHistoryIdx = terminalHistory.length; dom.terminalInput.value = ''; } }
  }

  // ============================================
  // SCRATCHPAD MODULE
  // ============================================
  async function loadScratchpad() {
    try {
      const res = await fetch('/api/scratchpad');
      const data = await res.json();
      dom.scratchpadTextarea.value = data.text || '';
    } catch {}
  }

  function handleScratchpadInput() {
    dom.scratchpadStatus.textContent = 'Mentés...';
    dom.scratchpadStatus.classList.add('visible');
    clearTimeout(scratchpadDebounce);
    scratchpadDebounce = setTimeout(async () => {
      try {
        await fetch('/api/scratchpad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: dom.scratchpadTextarea.value })
        });
        dom.scratchpadStatus.textContent = 'Mentve ✓';
        setTimeout(() => dom.scratchpadStatus.classList.remove('visible'), 2000);
      } catch {
        dom.scratchpadStatus.textContent = 'Hiba!';
      }
    }, 500);
  }

  function toggleScratchpad() {
    dom.scratchpadPanel.classList.toggle('open');
    if (dom.scratchpadPanel.classList.contains('open')) {
      dom.scratchpadTextarea.focus();
    }
  }

  // ============================================
  // POMODORO MODULE
  // ============================================
  function initPomodoro() {
    pomodoroTotal = (config.pomodoroMinutes || 25) * 60;
    pomodoroRemaining = pomodoroTotal;
    updatePomodoroDisplay();
  }

  function togglePomodoro() {
    if (pomodoroTimer) {
      clearInterval(pomodoroTimer);
      pomodoroTimer = null;
      dom.pomodoroIcon.className = 'fa-solid fa-play';
      dom.pomodoroLabel.textContent = 'Szünet';
      exitFocusMode();
    } else {
      if (pomodoroRemaining <= 0) {
        pomodoroRemaining = pomodoroTotal;
        pomodoroIsBreak = false;
      }
      pomodoroTimer = setInterval(pomodoroTick, 1000);
      dom.pomodoroIcon.className = 'fa-solid fa-pause';
      dom.pomodoroLabel.textContent = pomodoroIsBreak ? 'Szünet' : 'Fókusz';
      if (!pomodoroIsBreak) enterFocusMode();
    }
  }

  function pomodoroTick() {
    pomodoroRemaining--;
    updatePomodoroDisplay();
    if (pomodoroRemaining <= 0) {
      clearInterval(pomodoroTimer);
      pomodoroTimer = null;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = pomodoroIsBreak ? 880 : 660;
        gain.gain.value = 0.15;
        osc.start(); osc.stop(ctx.currentTime + 0.3);
      } catch {}

      if (!pomodoroIsBreak) {
        pomodoroIsBreak = true;
        pomodoroRemaining = (config.pomodoroBreak || 5) * 60;
        pomodoroTotal = pomodoroRemaining;
        dom.pomodoroLabel.textContent = 'Szünet!';
        dom.pomodoroWidget.classList.add('on-break');
        dom.pomodoroIcon.className = 'fa-solid fa-play';
        exitFocusMode();
        toast('🍅 Pomodoro kész! Szünet idő.', 'success');
      } else {
        pomodoroIsBreak = false;
        pomodoroTotal = (config.pomodoroMinutes || 25) * 60;
        pomodoroRemaining = pomodoroTotal;
        dom.pomodoroWidget.classList.remove('on-break');
        dom.pomodoroLabel.textContent = 'Pomodoro';
        dom.pomodoroIcon.className = 'fa-solid fa-play';
        toast('☕ Szünet vége! Készen állsz?', 'success');
      }
      updatePomodoroDisplay();
    }
  }

  function updatePomodoroDisplay() {
    const mins = Math.floor(pomodoroRemaining / 60);
    const secs = pomodoroRemaining % 60;
    dom.pomodoroTime.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    const progress = pomodoroTotal > 0 ? ((pomodoroTotal - pomodoroRemaining) / pomodoroTotal) * 100 : 0;
    dom.pomodoroProgress.style.strokeDashoffset = (100 - progress).toString();
  }

  function enterFocusMode() {
    document.body.classList.add('focus-active');
  }

  function exitFocusMode() {
    document.body.classList.remove('focus-active');
  }

  // ============================================
  // AGENDA / CALENDAR MODULE
  // ============================================
  function renderAgenda() {
    const events = config.events || [];
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);

    const relevant = events
      .filter(ev => ev.date === today || ev.date === tomorrow)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.time || '').localeCompare(b.time || '');
      });

    if (relevant.length === 0) {
      dom.agendaList.innerHTML = '<div class="agenda-empty">Nincs esemény mára.</div>';
      return;
    }

    dom.agendaList.innerHTML = relevant.map((ev, i) => {
      const origIdx = events.indexOf(ev);
      const isPast = ev.date === today && ev.time && ev.time < `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dayLabel = ev.date === tomorrow ? '<span style="color:var(--text-tertiary);font-size:0.65rem;margin-left:4px">holnap</span>' : '';
      return `
        <div class="agenda-event ${isPast ? 'past' : ''}">
          <span class="agenda-event-dot" style="background:${ev.color || 'var(--accent)'}"></span>
          <span class="agenda-event-time">${escapeHtml(ev.time || '—')}</span>
          <span class="agenda-event-title">${escapeHtml(ev.title)}${dayLabel}</span>
          <button class="agenda-event-delete" data-action="delete-event" data-idx="${origIdx}" title="Törlés"><i class="fa-solid fa-xmark"></i></button>
        </div>`;
    }).join('');
  }

  function toggleAgendaForm() {
    const shown = dom.agendaForm.style.display !== 'none';
    dom.agendaForm.style.display = shown ? 'none' : 'flex';
    if (!shown) {
      const now = new Date();
      dom.agendaDate.value = now.toISOString().slice(0, 10);
      dom.agendaTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      dom.agendaTitle.value = '';
      dom.agendaTitle.focus();
    }
  }

  async function saveEvent() {
    const title = dom.agendaTitle.value.trim();
    const date = dom.agendaDate.value;
    const time = dom.agendaTime.value;
    if (!title || !date) { toast('Adj meg címet és dátumot!', 'error'); return; }

    if (!config.events) config.events = [];
    config.events.push({ title, date, time, color: 'var(--accent)', created: Date.now() });
    dom.agendaForm.style.display = 'none';
    renderAgenda();

    try {
      await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: config.events }) });
      toast('Esemény hozzáadva!', 'success');
    } catch { toast('Mentési hiba', 'error'); }
  }

  async function deleteEvent(idx) {
    config.events.splice(idx, 1);
    renderAgenda();
    try {
      await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ events: config.events }) });
    } catch {}
  }

  // ============================================
  // AIRDROP / CLIPBOARD POLLING
  // ============================================
  async function pollClipboard() {
    try {
      const res = await fetch(`/api/clipboard?since=${clipboardLastId}`);
      const data = await res.json();
      if (data.hasNew) {
        clipboardLastId = data.id;
        dom.airdropText.textContent = data.text.slice(0, 80) + (data.text.length > 80 ? '...' : '');
        dom.airdropPill.classList.add('visible');
        dom.airdropPill._fullText = data.text;
      }
    } catch {}
  }

  function copyAirdropText() {
    const text = dom.airdropPill._fullText || dom.airdropText.textContent;
    navigator.clipboard.writeText(text).then(() => {
      toast('📋 Vágólapra másolva!', 'success');
      dom.airdropPill.classList.remove('visible');
    }).catch(() => {
      toast('Másolási hiba', 'error');
    });
  }

  function dismissAirdrop() {
    dom.airdropPill.classList.remove('visible');
    fetch('/api/clipboard', { method: 'DELETE' }).catch(() => {});
  }

  // ============================================
  // VIM NAVIGATION
  // ============================================
  function isInputFocused() {
    const active = document.activeElement;
    return active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable);
  }

  function isModalOpen() {
    return dom.modalOverlay.classList.contains('open') || dom.terminalOverlay.classList.contains('open');
  }

  function handleVimKeydown(e) {
    if (isModalOpen()) return;
    if (isInputFocused()) {
      if (e.key === 'Escape') { document.activeElement.blur(); setVimMode('normal'); e.preventDefault(); }
      return;
    }
    if (vimMode === 'normal') {
      switch (e.key) {
        case '/': e.preventDefault(); dom.searchInput.focus(); setVimMode('insert'); break;
        case 'j': e.preventDefault(); vimMoveLink(1); break;
        case 'k': e.preventDefault(); vimMoveLink(-1); break;
        case 'h': e.preventDefault(); vimMoveCategory(-1); break;
        case 'l': e.preventDefault(); vimMoveCategory(1); break;
        case 'Enter': e.preventDefault(); vimOpenLink(false); break;
        case 'o': e.preventDefault(); vimOpenLink(true); break;
        case 'i': e.preventDefault(); dom.searchInput.focus(); setVimMode('insert'); break;
        case 'g': e.preventDefault(); openSettings(); break;
        case 't': e.preventDefault(); dom.todoInput.focus(); setVimMode('insert'); break;
        case 'n': e.preventDefault(); toggleScratchpad(); break;
        case 'p': e.preventDefault(); togglePomodoro(); break;
        case 'c': e.preventDefault(); toggleCustomizeMode(); break;
      }
    }
  }

  function setVimMode(mode) {
    vimMode = mode;
    dom.vimModeEl.textContent = mode.toUpperCase();
    dom.vimIndicator.classList.add('visible');
    if (mode === 'insert') { dom.vimModeEl.classList.add('insert-mode'); }
    else { dom.vimModeEl.classList.remove('insert-mode'); clearVimHighlight(); }
    clearTimeout(dom.vimIndicator._hideTimeout);
    if (mode === 'normal') { dom.vimIndicator._hideTimeout = setTimeout(() => dom.vimIndicator.classList.remove('visible'), 3000); }
  }

  function vimMoveLink(delta) {
    if (allLinks.length === 0) return;
    let currentIdx = -1;
    allLinks.forEach((link, i) => { if (link.classList.contains('vim-active')) currentIdx = i; });
    clearVimHighlight();
    let nextIdx = currentIdx + delta;
    if (nextIdx < 0) nextIdx = allLinks.length - 1;
    if (nextIdx >= allLinks.length) nextIdx = 0;
    allLinks[nextIdx].classList.add('vim-active');
    allLinks[nextIdx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const catCard = allLinks[nextIdx].closest('.category-card');
    if (catCard) { $$('.category-card').forEach(c => c.classList.remove('vim-focus')); catCard.classList.add('vim-focus'); }
    dom.vimIndicator.classList.add('visible');
    clearTimeout(dom.vimIndicator._hideTimeout);
  }

  function vimMoveCategory(delta) {
    const cards = Array.from($$('.category-card'));
    if (cards.length === 0) return;
    let currentCat = -1;
    cards.forEach((c, i) => { if (c.classList.contains('vim-focus')) currentCat = i; });
    clearVimHighlight();
    let nextCat = currentCat + delta;
    if (nextCat < 0) nextCat = cards.length - 1;
    if (nextCat >= cards.length) nextCat = 0;
    cards[nextCat].classList.add('vim-focus');
    const firstLink = cards[nextCat].querySelector('.link-item');
    if (firstLink) firstLink.classList.add('vim-active');
    cards[nextCat].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    dom.vimIndicator.classList.add('visible');
    clearTimeout(dom.vimIndicator._hideTimeout);
  }

  function vimOpenLink(newTab) {
    const active = document.querySelector('.link-item.vim-active');
    if (!active) return;
    if (newTab) window.open(active.href, '_blank');
    else window.location.href = active.href;
  }

  function clearVimHighlight() {
    $$('.vim-active').forEach(el => el.classList.remove('vim-active'));
    $$('.vim-focus').forEach(el => el.classList.remove('vim-focus'));
  }

  // ============================================
  // SETTINGS MODAL
  // ============================================
  function openSettings() {
    editConfig = JSON.parse(JSON.stringify(config));
    populateGeneralTab();
    populateLinksEditor();
    populateBangsEditor();
    populateFeedsEditor();
    WidgetManager.renderManagerList();
    ThemeManager.renderGrid();
    ThemeManager.renderCustomGrid();
    ThemeManager.updateThemeModeUI();
    PluginManager.renderSettingsList();
    dom.modalOverlay.classList.add('open');
    document.addEventListener('keydown', onModalKeydown);
  }

  function closeSettings() {
    dom.modalOverlay.classList.remove('open');
    document.removeEventListener('keydown', onModalKeydown);
  }

  function onModalKeydown(e) { if (e.key === 'Escape') closeSettings(); }

  function populateGeneralTab() {
    dom.cfgName.value = editConfig.userName || '';
    dom.cfgSearchEngine.value = editConfig.searchEngine || '';
    dom.cfgSearchEngineName.value = editConfig.searchEngineName || '';
    dom.cfgBgUrl.value = editConfig.backgroundUrl || '';
    dom.cfgWeatherCity.value = editConfig.weatherCity || '';
    dom.cfgThemeMode.value = editConfig.themeMode || 'auto';
    dom.cfgTerminalEnabled.checked = editConfig.terminalEnabled !== false;
    dom.cfgPomodoro.value = editConfig.pomodoroMinutes || 25;
    dom.cfgCurrencyTarget.value = editConfig.currencyTarget || 'HUF';
  }

  function readGeneralTab() {
    editConfig.userName = dom.cfgName.value.trim();
    editConfig.searchEngine = dom.cfgSearchEngine.value.trim();
    editConfig.searchEngineName = dom.cfgSearchEngineName.value.trim();
    editConfig.backgroundUrl = dom.cfgBgUrl.value.trim();
    editConfig.weatherCity = dom.cfgWeatherCity.value.trim();
    editConfig.themeMode = dom.cfgThemeMode.value;
    editConfig.terminalEnabled = dom.cfgTerminalEnabled.checked;
    editConfig.pomodoroMinutes = parseInt(dom.cfgPomodoro.value) || 25;
    editConfig.currencyTarget = dom.cfgCurrencyTarget.value.trim().toUpperCase() || 'HUF';
  }

  function handleBgUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { dom.cfgBgUrl.value = ev.target.result; toast('Háttérkép betöltve! Mentsd el.', 'success'); };
    reader.readAsDataURL(file);
  }

  // --- Links Editor ---
  function populateLinksEditor() {
    dom.linksEditor.innerHTML = '';
    editConfig.categories.forEach((cat, catIdx) => {
      const catEl = document.createElement('div'); catEl.className = 'editor-category';
      let linksHtml = '';
      (cat.links || []).forEach((link, linkIdx) => { linksHtml += linkRowHtml(catIdx, linkIdx, link.name, link.url); });
      catEl.innerHTML = `
        <div class="editor-category-header">
          <input type="text" value="${escapeAttr(cat.name)}" data-field="cat-name" data-cat="${catIdx}" placeholder="Kategória neve">
          <label class="editor-focus-toggle"><input type="checkbox" data-field="cat-focus" data-cat="${catIdx}" ${cat.focusHide ? 'checked' : ''}> Rejtés fókuszban</label>
          <button class="btn btn-danger btn-sm" data-action="delete-cat" data-cat="${catIdx}"><i class="fa-solid fa-trash"></i></button>
        </div>
        <div class="editor-links-list" data-cat="${catIdx}">${linksHtml}</div>
        <button class="btn btn-accent btn-sm editor-add-link" data-action="add-link" data-cat="${catIdx}"><i class="fa-solid fa-plus"></i> Link</button>`;
      dom.linksEditor.appendChild(catEl);
    });
    dom.linksEditor.addEventListener('click', onLinksEditorClick);
    dom.linksEditor.addEventListener('input', onLinksEditorInput);
    dom.linksEditor.addEventListener('change', onLinksEditorChange);
  }

  function linkRowHtml(catIdx, linkIdx, name, url) {
    return `<div class="editor-link-row" data-cat="${catIdx}" data-link="${linkIdx}">
      <input type="text" value="${escapeAttr(name)}" placeholder="Név" data-field="link-name" data-cat="${catIdx}" data-link="${linkIdx}">
      <input type="text" value="${escapeAttr(url)}" placeholder="URL" data-field="link-url" data-cat="${catIdx}" data-link="${linkIdx}">
      <button class="btn-icon" data-action="delete-link" data-cat="${catIdx}" data-link="${linkIdx}"><i class="fa-solid fa-xmark"></i></button>
    </div>`;
  }

  function onLinksEditorClick(e) {
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const action = btn.dataset.action;
    const catIdx = parseInt(btn.dataset.cat);
    if (action === 'delete-cat') { editConfig.categories.splice(catIdx, 1); populateLinksEditor(); }
    else if (action === 'add-link') { if (!editConfig.categories[catIdx].links) editConfig.categories[catIdx].links = []; editConfig.categories[catIdx].links.push({ name: '', url: '' }); populateLinksEditor(); }
    else if (action === 'delete-link') { editConfig.categories[catIdx].links.splice(parseInt(btn.dataset.link), 1); populateLinksEditor(); }
  }

  function onLinksEditorInput(e) {
    const input = e.target; const field = input.dataset.field; const catIdx = parseInt(input.dataset.cat);
    if (field === 'cat-name') editConfig.categories[catIdx].name = input.value;
    else if (field === 'link-name') editConfig.categories[catIdx].links[parseInt(input.dataset.link)].name = input.value;
    else if (field === 'link-url') editConfig.categories[catIdx].links[parseInt(input.dataset.link)].url = input.value;
  }

  function onLinksEditorChange(e) {
    if (e.target.dataset.field === 'cat-focus') {
      const catIdx = parseInt(e.target.dataset.cat);
      editConfig.categories[catIdx].focusHide = e.target.checked;
    }
  }

  // --- Bangs Editor ---
  function populateBangsEditor() {
    dom.bangsEditor.innerHTML = '';
    Object.entries(editConfig.bangs || {}).forEach(([key, url]) => {
      dom.bangsEditor.insertAdjacentHTML('beforeend', bangRowHtml(key, url));
    });
    dom.bangsEditor.addEventListener('click', onBangsEditorClick);
    dom.bangsEditor.addEventListener('input', onBangsEditorInput);
  }

  function bangRowHtml(key, url) {
    return `<div class="editor-bang-row" data-bang-key="${escapeAttr(key)}">
      <input type="text" value="${escapeAttr(key)}" placeholder="!bang" data-field="bang-key">
      <input type="text" value="${escapeAttr(url)}" placeholder="URL" data-field="bang-url">
      <button class="btn-icon" data-action="delete-bang" data-bang="${escapeAttr(key)}"><i class="fa-solid fa-xmark"></i></button>
    </div>`;
  }

  function onBangsEditorClick(e) { const btn = e.target.closest('[data-action="delete-bang"]'); if (!btn) return; delete editConfig.bangs[btn.dataset.bang]; populateBangsEditor(); }
  function onBangsEditorInput() { rebuildBangsFromDOM(); }

  function rebuildBangsFromDOM() {
    const newBangs = {};
    dom.bangsEditor.querySelectorAll('.editor-bang-row').forEach((row) => {
      const key = row.querySelector('[data-field="bang-key"]').value.trim();
      const url = row.querySelector('[data-field="bang-url"]').value.trim();
      if (key) newBangs[key] = url;
    });
    editConfig.bangs = newBangs;
  }

  // --- Feeds Editor ---
  function populateFeedsEditor() {
    dom.feedsEditor.innerHTML = '';
    (editConfig.rssFeeds || []).forEach((feed, i) => {
      dom.feedsEditor.insertAdjacentHTML('beforeend', feedRowHtml(i, feed.name, feed.url));
    });
    dom.feedsEditor.addEventListener('click', onFeedsEditorClick);
    dom.feedsEditor.addEventListener('input', onFeedsEditorInput);
  }

  function feedRowHtml(idx, name, url) {
    return `<div class="editor-feed-row" data-feed="${idx}">
      <input type="text" value="${escapeAttr(name)}" placeholder="Név" data-field="feed-name" data-feed="${idx}">
      <input type="text" value="${escapeAttr(url)}" placeholder="RSS URL" data-field="feed-url" data-feed="${idx}">
      <button class="btn-icon" data-action="delete-feed" data-feed="${idx}"><i class="fa-solid fa-xmark"></i></button>
    </div>`;
  }

  function onFeedsEditorClick(e) { const btn = e.target.closest('[data-action="delete-feed"]'); if (!btn) return; editConfig.rssFeeds.splice(parseInt(btn.dataset.feed), 1); populateFeedsEditor(); }
  function onFeedsEditorInput(e) { const i = e.target; const idx = parseInt(i.dataset.feed); if (i.dataset.field === 'feed-name') editConfig.rssFeeds[idx].name = i.value; else if (i.dataset.field === 'feed-url') editConfig.rssFeeds[idx].url = i.value; }

  function addNewBang() { if (!editConfig.bangs) editConfig.bangs = {}; let key = '!new'; let i = 1; while (editConfig.bangs[key]) key = `!new${i++}`; editConfig.bangs[key] = ''; populateBangsEditor(); }
  function addNewCategory() { editConfig.categories.push({ name: 'Új kategória', icon: 'fa-solid fa-folder', links: [], focusHide: false }); populateLinksEditor(); }
  function addNewFeed() { if (!editConfig.rssFeeds) editConfig.rssFeeds = []; editConfig.rssFeeds.push({ name: '', url: '' }); populateFeedsEditor(); }

  // --- Save ---
  async function saveSettings() {
    readGeneralTab();
    rebuildBangsFromDOM();
    // Preserve widget layout, themes, plugins
    editConfig.widgetLayout = config.widgetLayout;
    editConfig.customThemes = config.customThemes;
    editConfig.activeTheme = config.activeTheme;
    editConfig.plugins = config.plugins;
    try {
      const res = await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editConfig) });
      if (!res.ok) throw new Error('Save failed');
      config = JSON.parse(JSON.stringify(editConfig));
      renderLinks(); applyBackground(); updateSearchBadge(); ThemeManager.apply(); fetchWeather(); loadRSSFeeds(); renderAgenda(); initPomodoro();
      WidgetManager.applyLayout();
      closeSettings(); toast('Beállítások mentve!', 'success');
    } catch { toast('Hiba a mentés során!', 'error'); }
  }

  // ============================================
  // TABS
  // ============================================
  function switchTab(tabName) {
    $$('.modal-tab').forEach(t => t.classList.remove('active'));
    $$('.tab-content').forEach(c => c.classList.remove('active'));
    $(`.modal-tab[data-tab="${tabName}"]`)?.classList.add('active');
    $(`#tab-${tabName}`)?.classList.add('active');

    // Special handling for themes tab
    if (tabName === 'themes') {
      ThemeManager.updateThemeModeUI();
    }
  }

  // ============================================
  // TOAST
  // ============================================
  function toast(message, type = 'success') {
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    const el = document.createElement('div'); el.className = `toast ${type}`;
    el.innerHTML = `<i class="fa-solid ${icon}"></i> ${escapeHtml(message)}`;
    dom.toastContainer.appendChild(el);
    setTimeout(() => { el.classList.add('removing'); el.addEventListener('animationend', () => el.remove()); }, 3000);
  }

  // ============================================
  // UTILITY
  // ============================================
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ============================================
  // EVENT BINDINGS
  // ============================================
  function bindEvents() {
    // Search
    dom.searchInput.addEventListener('keydown', handleSearch);
    dom.searchInput.addEventListener('input', handleSearchInput);
    document.addEventListener('click', (e) => { if (!e.target.closest('.search-wrapper')) { hideBangDropdown(); hideSmartResult(); } });
    setTimeout(() => dom.searchInput.focus(), 500);

    // Settings
    dom.settingsBtn.addEventListener('click', openSettings);
    dom.modalClose.addEventListener('click', closeSettings);
    dom.modalCancel.addEventListener('click', closeSettings);
    dom.modalSave.addEventListener('click', saveSettings);
    dom.modalOverlay.addEventListener('click', (e) => { if (e.target === dom.modalOverlay) closeSettings(); });
    $$('.modal-tab').forEach(tab => { tab.addEventListener('click', () => switchTab(tab.dataset.tab)); });
    dom.addCategoryBtn.addEventListener('click', addNewCategory);
    dom.addBangBtn.addEventListener('click', addNewBang);
    dom.addFeedBtn.addEventListener('click', addNewFeed);
    dom.cfgBgUpload.addEventListener('change', handleBgUpload);

    // Theme mode change
    if (dom.cfgThemeMode) {
      dom.cfgThemeMode.addEventListener('change', () => {
        config.themeMode = dom.cfgThemeMode.value;
        if (dom.cfgThemeMode.value !== 'custom') {
          config.activeTheme = '';
          ThemeManager.clearCustomVars();
        }
        ThemeManager.apply();
        ThemeManager.renderGrid();
        ThemeManager.renderCustomGrid();
        ThemeManager.updateThemeModeUI();
      });
    }

    // Custom theme actions
    if (dom.saveCustomTheme) dom.saveCustomTheme.addEventListener('click', () => ThemeManager.saveCustomTheme());
    if (dom.exportTheme) dom.exportTheme.addEventListener('click', () => ThemeManager.exportTheme());
    if (dom.importTheme) dom.importTheme.addEventListener('click', () => dom.importThemeFile?.click());
    if (dom.importThemeFile) dom.importThemeFile.addEventListener('change', (e) => {
      if (e.target.files[0]) ThemeManager.importTheme(e.target.files[0]);
    });

    // Live preview for color pickers
    ['ct-accent', 'ct-accent-light', 'ct-bg-deep', 'ct-glass-bg', 'ct-text-primary', 'ct-text-secondary', 'ct-success', 'ct-danger'].forEach(id => {
      const el = $(`#${id}`);
      if (el) el.addEventListener('input', () => {
        if (config.themeMode === 'custom') {
          ThemeManager.applyCustomVars({
            accent: $('#ct-accent')?.value,
            accentLight: $('#ct-accent-light')?.value,
            bgDeep: $('#ct-bg-deep')?.value,
            glassBg: $('#ct-glass-bg')?.value,
            textPrimary: $('#ct-text-primary')?.value,
            textSecondary: $('#ct-text-secondary')?.value,
            success: $('#ct-success')?.value,
            danger: $('#ct-danger')?.value,
          });
        }
      });
    });

    // Customize mode toggle
    if (dom.customizeToggle) {
      dom.customizeToggle.addEventListener('click', toggleCustomizeMode);
    }

    // Plugin install from URL
    if (dom.pluginInstallBtn) {
      dom.pluginInstallBtn.addEventListener('click', () => {
        const url = dom.pluginInstallUrl?.value?.trim();
        if (url) PluginManager.installFromUrl(url);
      });
    }

    // Plugin file upload pickers
    if (dom.pluginPickManifest) {
      dom.pluginPickManifest.addEventListener('click', () => dom.pluginUploadManifest?.click());
      dom.pluginUploadManifest?.addEventListener('change', (e) => {
        PluginManager.uploadFiles.manifest = e.target.files[0] || null;
        dom.pluginPickManifest.classList.toggle('selected', !!e.target.files[0]);
        PluginManager.updateUploadStatus();
      });
    }
    if (dom.pluginPickJs) {
      dom.pluginPickJs.addEventListener('click', () => dom.pluginUploadJs?.click());
      dom.pluginUploadJs?.addEventListener('change', (e) => {
        PluginManager.uploadFiles.js = e.target.files[0] || null;
        dom.pluginPickJs.classList.toggle('selected', !!e.target.files[0]);
        PluginManager.updateUploadStatus();
      });
    }
    if (dom.pluginPickCss) {
      dom.pluginPickCss.addEventListener('click', () => dom.pluginUploadCss?.click());
      dom.pluginUploadCss?.addEventListener('change', (e) => {
        PluginManager.uploadFiles.css = e.target.files[0] || null;
        dom.pluginPickCss.classList.toggle('selected', !!e.target.files[0]);
        PluginManager.updateUploadStatus();
      });
    }
    if (dom.pluginUploadBtn) {
      dom.pluginUploadBtn.addEventListener('click', () => PluginManager.installFromUpload());
    }

    // Todo
    dom.todoList.addEventListener('click', handleTodoClick);
    dom.todoAddBtn.addEventListener('click', addTodo);
    dom.todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });

    // Media
    dom.mediaPrev.addEventListener('click', () => mediaControl('previous'));
    dom.mediaPlay.addEventListener('click', () => mediaControl('play-pause'));
    dom.mediaNext.addEventListener('click', () => mediaControl('next'));

    // Terminal
    dom.terminalClose.addEventListener('click', closeTerminal);
    dom.terminalInput.addEventListener('keydown', handleTerminalInput);
    dom.terminalOverlay.addEventListener('click', (e) => { if (e.target === dom.terminalOverlay) closeTerminal(); });

    // Vim navigation
    document.addEventListener('keydown', handleVimKeydown);
    document.addEventListener('focusin', (e) => { if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') setVimMode('insert'); });
    document.addEventListener('focusout', () => { if (!isInputFocused()) setTimeout(() => { if (!isInputFocused() && !isModalOpen()) setVimMode('normal'); }, 100); });

    // Updates pill click
    dom.sysUpdates.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/updates'); const data = await res.json();
        if (data.count === 0) { toast('A rendszer naprakész!', 'success'); }
        else { const names = data.packages.map(p => `${p.name} ${p.from} → ${p.to}`).join('\n'); openTerminal(); const out = document.createElement('div'); out.className = 'cmd-output'; out.textContent = `📦 ${data.count} frissítés elérhető:\n\n${names}`; dom.terminalOutput.appendChild(out); }
      } catch {}
    });

    // Pomodoro
    dom.pomodoroBtn.addEventListener('click', togglePomodoro);

    // Scratchpad
    dom.scratchpadToggle.addEventListener('click', toggleScratchpad);
    dom.scratchpadClose.addEventListener('click', () => dom.scratchpadPanel.classList.remove('open'));
    dom.scratchpadTextarea.addEventListener('input', handleScratchpadInput);

    // Agenda
    dom.agendaAddBtn.addEventListener('click', toggleAgendaForm);
    dom.agendaCancel.addEventListener('click', () => { dom.agendaForm.style.display = 'none'; });
    dom.agendaSave.addEventListener('click', saveEvent);
    dom.agendaTitle.addEventListener('keydown', (e) => { if (e.key === 'Enter') saveEvent(); });
    dom.agendaList.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="delete-event"]');
      if (btn) deleteEvent(parseInt(btn.dataset.idx));
    });

    // RSS toggle
    dom.rssToggleBtn.addEventListener('click', () => {
      const newMode = config.rssViewMode === 'compact' ? 'expanded' : 'compact';
      toggleRSSView(newMode);
      fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...config, rssViewMode: newMode }) }).catch(() => {});
    });

    // AirDrop
    dom.airdropCopy.addEventListener('click', copyAirdropText);
    dom.airdropDismiss.addEventListener('click', dismissAirdrop);
  }

  // ============================================
  // START
  // ============================================
  document.addEventListener('DOMContentLoaded', init);
})();

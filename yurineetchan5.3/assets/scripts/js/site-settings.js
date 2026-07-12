(function () {
  const KEY = 'chanSiteSettings';
  const DEFAULTS = {
    theme: 'futaba',
    lang: 'en',
    mediaSize: 'large',
    fontSize: '13px',
    fontFamily: 'Arial'
  };

  const THEMES = [
    ['yotsuba-b', 'Yotsuba B / blue'],
    ['futaba', 'Futaba classic'],
    ['tomorrow', 'Tomorrow dark'],
    ['midnight-blue', 'Midnight blue'],
    ['photon', 'Photon gray'],
    ['dark-red', 'Totally dark / Red'],
    ['dark-green', 'Totally dark / Green']
  ];

  const STRINGS = {
    'pt-BR': {
      settings: 'settings',
      settingsTitle: 'site general settings',
      theme: 'theme',
      language: 'language',
      mediaSize: 'default image size',
      fontSize: 'post font size',
      save: 'save',
      reset: 'reset',
      close: 'close',
      normal: 'normal',
      large: 'large',
      newest: 'newest',
      oldest: 'oldest',
      sort: 'sort',
      quick: 'quick',
      top: 'top',
      bottom: 'bottom'
    },
    en: {
      settings: 'settings',
      settingsTitle: 'site general settings',
      theme: 'theme',
      language: 'language',
      mediaSize: 'default image size',
      fontSize: 'post font size',
      save: 'save',
      reset: 'reset',
      close: 'close',
      normal: 'normal',
      large: 'large',
      newest: 'newest',
      oldest: 'oldest',
      sort: 'sort',
      quick: 'quick',
      top: 'top',
      bottom: 'bottom'
    }
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[c]));
  }

  function readSettings() {
    try {
      return { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) || '{}') || {}) };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  function writeSettings(next) {
    const settings = { ...DEFAULTS, ...next };
    localStorage.setItem(KEY, JSON.stringify(settings));
    applySettings(settings);
    return settings;
  }

  function translateStatic(lang) {
    const dict = STRINGS[lang] || STRINGS['pt-BR'];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (dict[key]) el.title = dict[key];
    });
  }

  function applySettings(settings = readSettings()) {
    const root = document.documentElement;
    const isUserAdmin = window._isAdmin;
    const globalSettings = window._globalSettings || {};

    root.dataset.theme = (isUserAdmin ? settings.theme : (globalSettings.theme || settings.theme)) || DEFAULTS.theme;
    root.dataset.mediaSize = settings.mediaSize === 'large' ? 'large' : 'normal';
    root.lang = settings.lang || DEFAULTS.lang;
    root.style.setProperty('--post-font-size', settings.fontSize || DEFAULTS.fontSize);
    
    const fontFamily = (isUserAdmin ? settings.fontFamily : (globalSettings.fontFamily || settings.fontFamily)) || DEFAULTS.fontFamily;
    root.style.setProperty('--site-font', fontFamily);

    const bannerImg = document.getElementById('banner') || document.querySelector('.board-emblem');
    if (bannerImg && globalSettings.banner) {
        bannerImg.src = globalSettings.banner;
    }

    if (document.body) translateStatic(root.lang);
  }

  function themeOptions(selected) {
    return THEMES.map(([value, label]) => (
      `<option value="${esc(value)}"${value === selected ? ' selected' : ''}>${esc(label)}</option>`
    )).join('');
  }

  function ensureSettingsDialog() {
    let wrap = document.getElementById('siteSettingsDialog');
    if (wrap) return wrap;
    wrap = document.createElement('div');
    wrap.id = 'siteSettingsDialog';
    wrap.className = 'settings-backdrop';
    wrap.addEventListener('click', event => {
      if (event.target === wrap) closeSiteSettings();
    });
    document.body.appendChild(wrap);
    return wrap;
  }

  function renderSettingsDialog() {
    const settings = readSettings();
    const wrap = ensureSettingsDialog();
    const dict = STRINGS[settings.lang] || STRINGS['pt-BR'];
    const isAdmin = window._isAdmin;

    let adminOptions = '';
    if (isAdmin) {
      adminOptions = `
        <label for="siteTheme">${esc(dict.theme)}</label>
        <select id="siteTheme">${themeOptions(settings.theme)}</select>

        <label for="siteMediaSize">${esc(dict.mediaSize)}</label>
        <select id="siteMediaSize">
          <option value="normal"${settings.mediaSize !== 'large' ? ' selected' : ''}>${esc(dict.normal)}</option>
          <option value="large"${settings.mediaSize === 'large' ? ' selected' : ''}>${esc(dict.large)}</option>
        </select>

        <label for="siteFontSize">${esc(dict.fontSize)}</label>
        <select id="siteFontSize">
          <option value="12px"${settings.fontSize === '12px' ? ' selected' : ''}>12px</option>
          <option value="13px"${settings.fontSize === '13px' ? ' selected' : ''}>13px</option>
          <option value="14px"${settings.fontSize === '14px' ? ' selected' : ''}>14px</option>
          <option value="16px"${settings.fontSize === '16px' ? ' selected' : ''}>16px</option>
        </select>

        <label for="siteFontFamily">font</label>
        <select id="siteFontFamily">
          <option value="Arial"${settings.fontFamily === 'Arial' ? ' selected' : ''}>Arial</option>
          <option value="MS Gothic"${settings.fontFamily === 'MS Gothic' ? ' selected' : ''}>MS Gothic</option>
          <option value="Times New Roman"${settings.fontFamily === 'Times New Roman' ? ' selected' : ''}>Times New Roman</option>
        </select>
      `;
    }

    wrap.innerHTML = `
      <div class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <div class="settings-head">
          <span id="settingsTitle">${esc(dict.settingsTitle)}</span>
          <button type="button" class="form-btn" onclick="closeSiteSettings()" title="${esc(dict.close)}">x</button>
        </div>
        <div class="settings-body">
         <div style="grid-column:1 / -1; color:var(--color-fg-muted);">
  nothing yet, adding something soon
</div>
          </select>

          ${adminOptions}

          <div class="settings-actions">
            <button type="button" class="form-btn" onclick="resetSiteSettings()">${esc(dict.reset)}</button>
            <button type="button" class="form-btn" onclick="saveSiteSettings()">${esc(dict.save)}</button>
          </div>
        </div>
      </div>`;
    return wrap;
  }

  function saveSiteSettings() {
    const settings = readSettings();
    const next = {
      lang: document.getElementById('siteLang')?.value || settings.lang
    };
    if (window._isAdmin) {
      next.theme = document.getElementById('siteTheme')?.value || settings.theme;
      next.mediaSize = document.getElementById('siteMediaSize')?.value || settings.mediaSize;
      next.fontSize = document.getElementById('siteFontSize')?.value || settings.fontSize;
      next.fontFamily = document.getElementById('siteFontFamily')?.value || settings.fontFamily;
    } else {
      next.theme = settings.theme;
      next.mediaSize = settings.mediaSize;
      next.fontSize = settings.fontSize;
      next.fontFamily = settings.fontFamily;
    }
    writeSettings(next);
    closeSiteSettings();
  }

  function resetSiteSettings() {
    localStorage.removeItem(KEY);
    applySettings({ ...DEFAULTS });
    renderSettingsDialog();
  }

  function openSiteSettings() {
    const wrap = renderSettingsDialog();
    wrap.classList.add('is-open');
    document.getElementById('siteTheme')?.focus();
  }

  function closeSiteSettings() {
    document.getElementById('siteSettingsDialog')?.classList.remove('is-open');
  }

  function setSiteLanguage(lang) {
    writeSettings({ ...readSettings(), lang });
  }

  function setChanTheme(theme) {
    writeSettings({ ...readSettings(), theme });
  }

  function bindSettingsButtons() {
    document.querySelectorAll('[data-open-settings]').forEach(el => {
      el.addEventListener('click', event => {
        event.preventDefault();
        openSiteSettings();
      });
    });
    translateStatic(readSettings().lang);
  }

  applySettings();

  window.chanReadSettings = readSettings;
  window.openSiteSettings = openSiteSettings;
  window.closeSiteSettings = closeSiteSettings;
  window.saveSiteSettings = saveSiteSettings;
  window.resetSiteSettings = resetSiteSettings;
  window.setSiteLanguage = setSiteLanguage;
  window.setChanTheme = setChanTheme;
  window.getSiteSetting = key => readSettings()[key];

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindSettingsButtons);
  } else {
    bindSettingsButtons();
  }
}());

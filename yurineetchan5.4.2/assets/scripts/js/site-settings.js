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
      settingsTitle: 'configurações gerais do site',
      theme: 'tema',
      language: 'idioma',
      mediaSize: 'tamanho padrão da imagem',
      fontSize: 'tamanho da fonte',
      save: 'salvar',
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
      const stored = { ...DEFAULTS, ...(JSON.parse(localStorage.getItem(KEY) || '{}') || {}) };
      stored.lang = 'en'; // the whole site is English-only; ignore any old saved language.
      return stored;
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
    const dict = STRINGS[lang] || STRINGS['en'];
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
    const globalSettings = window._globalSettings || {};

    root.dataset.theme = 'futaba';
    root.dataset.mediaSize = 'large';
    root.lang = 'en';
    root.style.setProperty('--post-font-size', '13px');
    root.style.setProperty('--site-font', 'MS Gothic');

    const bannerImg = document.getElementById('banner') || document.querySelector('.board-emblem');
    if (bannerImg && globalSettings.banner) {
        bannerImg.src = globalSettings.banner;
    }

    if (document.body) translateStatic(root.lang);
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
    const dict = STRINGS[settings.lang] || STRINGS['en'];

    wrap.innerHTML = `
      <div class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settingsTitle" style="border: 1px solid #800000; box-shadow: 2px 2px 8px rgba(0,0,0,0.5);">
        <div class="settings-head" style="background: #800000; color: #fff; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
          <span id="settingsTitle">${esc(dict.settingsTitle)}</span>
          <button type="button" class="form-btn" onclick="closeSiteSettings()" style="color: #fff; background: none; border: none; cursor: pointer; font-weight: bold;">x</button>
        </div>
        <div class="settings-body" style="padding: 20px 10px; background: var(--color-bg-alt, #fff); color: var(--color-fg-main, #000); display: block; text-align: center;">
          <div style="color: var(--color-fg-muted); margin-bottom: 15px; font-weight: bold;">
            nothing yet, adding something soon
          </div>
          <div style="text-align: center; margin-top: 15px;">
            <button type="button" class="form-btn" onclick="closeSiteSettings()" style="padding: 4px 12px; cursor: pointer;">${esc(dict.close)}</button>
          </div>
        </div>
      </div>`;
    return wrap;
  }

  function saveSiteSettings() {
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

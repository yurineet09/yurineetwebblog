(function () {
  const KEY = 'chanSiteSettings';
  const DEFAULTS = {
    theme: 'futaba',
    lang: 'en',
    mediaSize: 'large',
    fontSize: '13px',
    fontFamily: 'Arial'
  };

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
    root.dataset.mediaSize = settings.mediaSize === 'large' ? 'large' : 'normal';
    root.lang = settings.lang || DEFAULTS.lang;
    root.style.setProperty('--post-font-size', settings.fontSize || DEFAULTS.fontSize);
    
    const fontFamily = globalSettings.fontFamily || settings.fontFamily || DEFAULTS.fontFamily;
    root.style.setProperty('--site-font', fontFamily);

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
      <div class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settingsTitle">
        <div class="settings-head">
          <span id="settingsTitle">${esc(dict.settingsTitle)}</span>
          <button type="button" class="settings-close-btn" onclick="closeSiteSettings()" title="${esc(dict.close)}">X</button>
        </div>
        <div class="settings-body">
          <div class="settings-empty">nothing yet, adding something soon</div>
        </div>
      </div>`;
    return wrap;
  }

  function saveSiteSettings() {
    writeSettings(readSettings());
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
    wrap.querySelector('.settings-close-btn')?.focus();
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

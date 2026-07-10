const EMOTES = { 
  'quiet': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-quietL.png', 
  'smirk': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-smirkL.png', 
  'yawn': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-yawnL.png', 
  'sleeping': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-sleepingL.png', 
  'sick': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-sickL.png', 
  'pirate': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-pirateL.png', 
  'worried': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-worriedL.png', 
  'laughing': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-laughingL.png', 
  'in-love': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-inloveL.png', 
  'glasses': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-glassesL.png', 
  'crying': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-cryingL.png', 
  'grin': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-grinL.png', 
  'confused': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-confusedL.png', 
  'cool': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-coolL.png', 
  'brokenheart': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-heartbrokenL.png', 
  'heart': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-heartL.png', 
  'martini': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-martiniL.png', 
  'star': 'https://emoticons.neocities.org/emo/oxygen/unscaled/oxygen-starL.png' 
}; 
const EMOTE_CATEGORIES = { 
  quiet: 'mood', 
  smirk: 'mood', 
  yawn: 'mood', 
  sleeping: 'mood', 
  sick: 'mood', 
  pirate: 'mood', 
  worried: 'mood', 
  laughing: 'mood', 
  'in-love': 'mood', 
  glasses: 'mood', 
  crying: 'mood', 
  grin: 'mood', 
  confused: 'mood', 
  cool: 'mood', 
  brokenheart: 'emoji', 
  heart: 'emoji', 
  martini: 'emoji', 
  star: 'emoji' 
}; 
const BUNNY_EMOTE_FILES = [
  'bunny.gif',
  ...Array.from({ length: 72 }, (_, i) => `bunny${i + 2}.gif`),
  'bunny75.gif',
  'bunny76.png',
  'bunny77.gif',
  'bunny78.gif',
  'bunny79.gif',
  'bunny80.gif'
];
BUNNY_EMOTE_FILES.forEach(file => {
  const name = file.replace(/\.(gif|png)$/i, '');
  EMOTES[name] = `https://pixelsafari.neocities.org/favicon/animals/bunny/${file}`;
});
const EMOTE_FALLBACK = 'https://img1.picmix.com/output/stamp/normal/3/0/1/6/286103_31d67.gif'; 
const EMOTE_FALLBACK_TITLE = "this post is older than the emotes upgrade...OR...no such emojis were choose"; 
const BLOG_LAST_ONLINE_KEY = 'yurineetAdminLastOnline'; 
const BLOG_POSTS_PER_PAGE = 9;
const POST_SECRET = 'cdaeb22a5cd77d36df622f09873fc4ff5cf81b44ff3b90595df12b7de767059a';
const POST_LOCK_ITERATIONS = 160000;
const POST_ICONS = {
  edit: 'https://greenbox.network/icons/stationary/Pencil-icon.png',
  pin: 'https://greenbox.network/icons/stationary/Pin-red-icon.png',
  key: 'https://greenbox.network/icons/woc2/key.png',
  lock: 'https://greenbox.network/icons/woc1/padlock.png'
};
 
window.YURINEET_GALLERY = window.YURINEET_GALLERY || { sketches: [], pictures: [] }; 
window._allPosts = []; 
window._fbSketches = null; 
window._fbPictures = null; 
window._isAdmin = sessionStorage.getItem('yurineet_isAdmin') === 'true'; 
window._blogSort = 'newest'; 
window._blogVisiblePosts = BLOG_POSTS_PER_PAGE;
window._postViewMode = window._postViewMode || {};
window._unlockedPosts = window._unlockedPosts || {};
window._editingPostId = null;
 
/* ── PAGE TITLE ── */ 
function setPageTitle(section) { document.title = 'DEATH ARCHIVE | ' + section; } 
 
function esc(v) { 
  return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); 
} 

function bytesToBase64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

function base64ToBytes(str) {
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function requireLockCrypto() {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('locked posts need a secure browser context.');
  }
}

async function derivePostLockKey(password, saltBytes, iterations) {
  requireLockCrypto();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: saltBytes, iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptPostPayload(payload, password) {
  if (!password) throw new Error('enter a post password.');
  requireLockCrypto();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await derivePostLockKey(password, salt, POST_LOCK_ITERATIONS);
  const encoded = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    v: 1,
    alg: 'AES-GCM',
    kdf: 'PBKDF2-SHA256',
    iter: POST_LOCK_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(cipher))
  };
}

async function decryptPostPayload(pack, password) {
  if (!pack || !pack.salt || !pack.iv || !pack.data) throw new Error('missing locked post data.');
  if (!password) throw new Error('enter password.');
  const salt = base64ToBytes(pack.salt);
  const iv = base64ToBytes(pack.iv);
  const key = await derivePostLockKey(password, salt, Number(pack.iter) || POST_LOCK_ITERATIONS);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, base64ToBytes(pack.data));
  return JSON.parse(new TextDecoder().decode(plain));
}

function emoteCategory(name) { 
  return EMOTE_CATEGORIES[name] || 'emoji'; 
} 

function emoteImgHTML(name, size = 20) { 
  const src = EMOTES[name]; 
  if (!src) return ''; 
  return `<a href="${esc(src)}" target="_blank" rel="noopener" title="${esc(emoteCategory(name))}" onclick="event.stopPropagation()"><img src="${esc(src)}" alt="${esc(name)}" title="${esc(emoteCategory(name))}" style="vertical-align:middle;height:${Number(size) || 20}px;"></a>`; 
} 
 
function fmtDate(ts) { 
  const d = new Date(Number(ts)); 
  if (!Number.isFinite(d.getTime())) return 'unknown'; 
  const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; 
  const p = n => String(n).padStart(2, '0'); 
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${String(d.getFullYear()).slice(-2)}(${DAY[d.getDay()]})${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; 
} 

function setAdminLastOnline(ts) { 
  // removed
} 
window.setAdminLastOnline = setAdminLastOnline; 

async function touchAdminLastOnline() { 
  // removed
} 
window.touchAdminLastOnline = touchAdminLastOnline; 
 
function showSection(name) { 
  ['home', 'blog', 'gallery', 'links', 'contact'].forEach(s => { 
    document.getElementById('sec-' + s).style.display = s === name ? '' : 'none'; 
    const n = document.getElementById('nav-' + s); 
    if (n) n.className = s === name ? 'active' : ''; 
  }); 
  if (name === 'gallery') renderGalleryTab(window._curGalTab || 'sketches'); 
  setPageTitle(name); 
} 
 
function lbOpen(src) { document.getElementById('lb-img').src = src; document.getElementById('lb').className = 'on'; } 
function lbClose() { document.getElementById('lb').className = ''; document.getElementById('lb-img').src = ''; } 
window.lbClose = lbClose; 
document.addEventListener('keydown', e => { if (e.key === 'Escape') lbClose(); }); 
 
function parse4chan(raw) { 
  if (!raw) return { html: '', embedUrls: [] }; 
 
  const embedUrls = [], linkUrls = []; 
  let s = raw; 
  s = s.replace(/\/url\s+(https?:\/\/[^\s]+)/gi, (m, url) => { embedUrls.push(url); return '\x00EMB' + (embedUrls.length - 1) + '\x00'; }); 
  s = s.replace(/\/(url|emoji|emote|mood|spoiler)\s?/gi, ''); 
 
  // Handle explicit //url or /url 
  s = s.replace(/\/\/(https?:\/\/[^\s]+)/g, (m, url) => { embedUrls.push(url); return '\x00EMB' + (embedUrls.length - 1) + '\x00'; }); 
  s = s.replace(/(?<![:/])\/(?!\/)(https?:\/\/[^\s]+)/g, (m, url) => { linkUrls.push(url); return '\x00LNK' + (linkUrls.length - 1) + '\x00'; }); 
   
  // Auto-detect links that are not already handled 
  const urlRegex = /(?<!["'>])(https?:\/\/[^\s<]+)/g; 
  s = s.replace(urlRegex, (url) => { 
    if (url.includes('\x00')) return url; 
    linkUrls.push(url); 
    return '\x00LNK' + (linkUrls.length - 1) + '\x00'; 
  }); 
 
  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); 
  s = s.split('\n').map(line => { const t = line.trimStart(); if (t.startsWith('&gt;')) return '<span class="redtext">' + line + '</span>'; return line; }).join('\n'); 
  s = s.replace(/\|\|([^|]+)\|\|/g, '<span class="spoiler">$1</span>'); 
   
  // Emotes 
  Object.keys(EMOTES).forEach(name => { 
    const re = new RegExp(`:${name}:`, 'g'); 
    s = s.replace(re, emoteImgHTML(name)); 
  }); 
 
  s = s.replace(/\x00EMB(\d+)\x00/g, (_, i) => { const url = embedUrls[parseInt(i)]; return '<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>'; }); 
  s = s.replace(/\x00LNK(\d+)\x00/g, (_, i) => { const url = linkUrls[parseInt(i)]; return '<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>'; }); 
  s = s.replace(/\n/g, '<br>'); 
  return { html: s, embedUrls }; 
} 
 
const EPATS = [ 
  { name: 'youtube', re: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?[^\s"<]*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g, build: m => ({ src: 'https://www.youtube.com/embed/' + m[1] + '?rel=0', url: m[0] }) }, 
  { name: 'spotify', re: /https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode)\/([a-zA-Z0-9]+)(?:[?&][^\s"<]*)?/g, build: m => ({ src: 'https://open.spotify.com/embed/' + m[1] + '/' + m[2] + '?utm_source=generator&theme=0', url: m[0] }) }, 
  { name: 'soundcloud', re: /https?:\/\/(?:www\.)?soundcloud\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(?:[?&][^\s"<]*)?/g, build: m => ({ src: 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(m[0]) + '&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false', url: m[0] }) } 
]; 
 
function detectEmbeds(text) { 
  const found = []; 
  for (const p of EPATS) { 
    p.re.lastIndex = 0; 
    let m; 
    while ((m = p.re.exec(text)) !== null) { 
      const b = p.build(m); 
      b.name = p.name; 
      if (!found.some(e => e.url === b.url)) found.push(b); 
    } 
  } 
  return found; 
} 
 
function normalizePostMedia(media) {
  return Array.isArray(media) && media.length ? media : null;
}

function postPayloadFrom(data = {}) {
  const media = normalizePostMedia(data.media || (data.imageSrc ? [{ url: data.imageSrc, info: data.imageInfo || null, type: 'image' }] : null));
  const contentRaw = data.contentRaw || data.description || ' ';
  return {
    author: data.author || null,
    options: data.options || null,
    badge: data.badge || null,
    title: data.title || null,
    moodText: data.moodText || null,
    moodEmote: data.moodEmote || null,
    media,
    spoilerImg: !!data.spoilerImg,
    contentRaw: contentRaw,
    ts: data.ts || null
  };
}

function payloadFieldsForSave(payload) {
  return {
    author: payload.author || null,
    options: payload.options || null,
    badge: payload.badge || null,
    title: payload.title || null,
    moodText: payload.moodText || null,
    moodEmote: payload.moodEmote || null,
    media: normalizePostMedia(payload.media),
    spoilerImg: !!payload.spoilerImg,
    contentRaw: payload.contentRaw ?? ' '
  };
}

function hasPostPayloadContent(payload) {
  const fields = payloadFieldsForSave(payload || {});
  return !!((fields.title && fields.title.trim()) || (fields.contentRaw && fields.contentRaw.trim()) || (fields.media && fields.media.length));
}

function isCurrentLocked(p) {
  return !!(p && p.lockedData);
}

function isOriginalLocked(p) {
  return !!(p && p.originalLockedData);
}

function hasPostOriginal(p) {
  return !!(p && p.updatedAt && (p.original || p.originalLockedData));
}

function getCurrentPayload(p) {
  if (!p) return null;
  if (isCurrentLocked(p)) return window._unlockedPosts[p.id]?.current || null;
  return postPayloadFrom(p);
}

function getOriginalPayload(p) {
  if (!p || !hasPostOriginal(p)) return null;
  if (isOriginalLocked(p)) return window._unlockedPosts[p.id]?.original || null;
  return postPayloadFrom(p.original);
}

function buildPostPayloadHTML(payload) {
  const raw = payload.contentRaw || ''; 
  let htmlContent = ''; 
  const titleHTML = payload.title ? `<span class="title">[${esc(payload.title)}]</span><br>` : '';
  if (raw || titleHTML) { 
    const { html } = parse4chan(raw); 
    const embeds = detectEmbeds(raw); 
    let embedsHTML = ''; 
    for (const e of embeds) { 
      embedsHTML += `<iframe src="${esc(e.src)}" width="100%" height="220" style="border:0;display:block;margin-top:4px;" allowfullscreen loading="lazy"></iframe>`;
    } 
    htmlContent = `<div class="comment">${titleHTML}${html}${embedsHTML}</div>`; 
  } 
   
  const mediaItems = payload.media || []; 
  let mediaHTML = ''; 

  const isSimple = mediaItems.length <= 2 && !(mediaItems.filter(m => m.type?.startsWith('image')).length > 1 || mediaItems.filter(m => m.type?.startsWith('audio')).length > 1);

  if (isSimple || mediaItems.length === 0) {
    for (const item of mediaItems) {
      mediaHTML += renderMediaItem(item, payload.spoilerImg);
    }
  } else {
    const images = mediaItems.filter(m => !m.type?.startsWith('audio'));
    const audios = mediaItems.filter(m => m.type?.startsWith('audio'));
    const id = Math.random().toString(36).substr(2, 9);
    
    mediaHTML += `<div class="multi-file-btn">
      [${mediaItems.length}] files: ${mediaItems.map(m => esc(m.info?.name || 'file')).join(', ')} 
      <button class="form-btn" onclick="document.getElementById('multi-${id}').classList.toggle('hidden')">+</button>
    </div>
    <div id="multi-${id}" class="multi-file-dropdown hidden">`;
    
    if (images.length > 0) {
      mediaHTML += `<div class="image-grid">`;
      for (const img of images) {
        mediaHTML += `<div class="grid-item">${renderMediaItem(img, payload.spoilerImg)}</div>`;
      }
      mediaHTML += `</div>`;
    }
    
    for (const aud of audios) {
      mediaHTML += renderMediaItem(aud, false);
    }
    
    mediaHTML += `</div>`;
  }
 
  return { titleHTML: '', mediaHTML, htmlContent };
}

function renderMediaItem(item, isSpoiler) {
  const info = item.info;
  const id = Math.random().toString(36).substr(2, 9);
  const fi = info ? 
    `<div class="filesize">File: <a href="${esc(item.url)}" target="_blank" rel="nofollow">${esc(info.name || '')}</a> (${esc(String(info.sizeKB || ''))} KB${info.w ? `, ${info.w}x${info.h}` : ''}) <a href="${esc(item.url)}" target="_blank">[view in new tab]</a></div>` : 
    `<div class="filesize">File: <a href="${esc(item.url)}" target="_blank" rel="nofollow">${esc(item.url)}</a> <a href="${esc(item.url)}" target="_blank">[view in new tab]</a></div>`;

  if (isSpoiler) {
    return `${fi}<div class="post-img-wrap"><img src="${esc(item.url)}" alt="" loading="lazy" style="display:none;"><div class="spoiler-cover" onclick="this.previousElementSibling.style.display='block';this.style.display='none';"> [Spoiler] CLICK TO REVEAL</div></div>`;
  } else if (item.type?.startsWith('video')) {
    return `${fi}<video src="${esc(item.url)}" controls class="postimg"></video>`;
  } else if (item.type?.startsWith('audio')) {
    return `<div class="audio-container">
      ${fi.replace('File:', '<span class="audio-dropdown-toggle" onclick="document.getElementById(\'aud-'+id+'\').classList.toggle(\'hidden\'); this.textContent = document.getElementById(\'aud-'+id+'\').classList.contains(\'hidden\') ? \'+\' : \'-\'">+</span> File:')}
      <div id="aud-${id}" class="hidden">
        <audio src="${esc(item.url)}" controls class="post-audio"></audio>
      </div>
    </div>`;
  } else {
    return `${fi}<a href="${esc(item.url)}" target="_blank"><img src="${esc(item.url)}" alt="" loading="lazy" class="postimg"></a>`;
  }
}

function buildMoodHTML(payload) {
  let moodIcon = EMOTE_FALLBACK; 
  let moodTitle = EMOTE_FALLBACK_TITLE; 
  if (payload && payload.moodEmote && EMOTES[payload.moodEmote]) { 
    moodIcon = EMOTES[payload.moodEmote]; 
    moodTitle = payload.moodText || payload.moodEmote; 
  } else if (payload && payload.moodText) { 
    moodTitle = payload.moodText; 
  } 
   
const moodLabel = (payload && payload.moodEmote && EMOTES[payload.moodEmote]) || (payload && payload.moodText) ? ` ${esc(moodTitle)}` : '';
return `<span style="margin-left:5px;">mood: <img src="${moodIcon}" title="${esc(moodTitle)}" alt="mood" style="height:14px; vertical-align:middle;">${moodLabel}</span>`; 
}

function buildPosterMetaHTML(payload = {}) {
  const author = String(payload.author || '').trim() || (window._globalSettings?.defaultAuthor || 'yuri.neet');
  const options = String(payload.options || '').trim();
  const badge = String(payload.badge || '').trim();
  return `
    <span class="name">${esc(author)}</span>
    ${options ? `<span class="post-options">[${esc(options)}]</span>` : ''}
    ${badge ? `<span class="post-badge">${esc(badge)}</span>` : ''}`;
}

function repliesForPost(p) {
  const raw = p?.replies || {};
  const entries = Array.isArray(raw)
    ? raw.map((reply, index) => [String(index), reply]).filter(([, reply]) => reply)
    : Object.entries(raw);
  return entries
    .map(([id, reply]) => ({ ...reply, id }))
    .sort((a, b) => (Number(a.ts) || 0) - (Number(b.ts) || 0));
}

function postNumberForId(id) {
  const posts = [...(window._allPosts || [])].sort((a, b) => (Number(b.ts) || 0) - (Number(a.ts) || 0));
  const idx = posts.findIndex(p => p.id === id);
  return idx >= 0 ? posts.length - idx : '?';
}

function buildAdminReplyButtons(postId, replyId) {
  if (!window._isAdmin || !postId || !replyId) return '';
  const safePostId = esc(postId);
  const safeReplyId = esc(replyId);
  return `
    <span class="post-actions">
      <button class="post-icon-btn" title="Edit continuation" onclick="beginEditReply('${safePostId}', '${safeReplyId}')"><img class="post-admin-icon" src="${esc(POST_ICONS.edit)}" alt="Edit continuation" title="Edit continuation"></button>
      <button class="post-del-btn" onclick="deleteReply('${safePostId}', '${safeReplyId}')">delete</button>
    </span>`;
}

function buildReplyCard(parent, reply, idx) {
  const payload = postPayloadFrom(reply || {});
  const bodyParts = buildPostPayloadHTML(payload);
  return `
    <div class="reply-container continuation-container" id="reply-${esc(parent.id || '')}-${esc(reply.id || '')}">
      <div class="doubledash">>></div>
      <div class="post continuation">
        <div class="postinfo">
          ${buildPosterMetaHTML(payload)}
          <span class="time">${fmtDate(reply.ts)}</span>
          <span class="postnum">No.${postNumberForId(parent.id)}.${idx + 1}</span>
          ${buildAdminReplyButtons(parent.id, reply.id)}
          ${buildMoodHTML(payload)}
        </div>
        ${bodyParts.mediaHTML}${bodyParts.htmlContent}
      </div>
    </div>`;
}

function buildRepliesHTML(p) {
  const allReplies = repliesForPost(p);
  if (!allReplies.length) return '';
  
  const limit = 5;
  const omitted = allReplies.length > limit ? allReplies.length - limit : 0;
  const displayedReplies = omitted > 0 ? allReplies.slice(-limit) : allReplies;
  
  let filesOmitted = 0;
  if (omitted > 0) {
    const omittedReplies = allReplies.slice(0, omitted);
    omittedReplies.forEach(r => {
      if (r.media && r.media.length) filesOmitted += r.media.length;
    });
  }

  const omittedText = omitted > 0 ? `<div class="omitted-text">${omitted} replies and ${filesOmitted} files omitted. <a href="blog.html#post-${esc(p.id)}">Click here to view.</a></div>` : '';

  return `<div class="thread-replies">${omittedText}${displayedReplies.map((reply, idx) => buildReplyCard(p, reply, allReplies.length - displayedReplies.length + idx)).join('')}</div>`;
}

function buildLockedPostHTML(p) {
  const id = esc(p.id || '');
  return `
    <div class="post-locked">
      <img src="${esc(POST_ICONS.lock)}" alt="Locked post" title="Locked post" style="height:24px; vertical-align:middle;">
      <span>locked post</span>
      <div class="post-unlock-row">
        <input type="password" id="unlockPw-${id}" autocomplete="current-password" onkeydown="if(event.key==='Enter') unlockPost('${id}')" style="width: 100px;">
        <button class="form-btn" onclick="unlockPost('${id}')">unlock</button>
      </div>
      <div id="unlockStatus-${id}" style="color:var(--color-danger);font-size:10px;margin-top:4px;"></div>
    </div>`;
}

function buildAdminPostButtons(p) {
  if (!window._isAdmin || !p.id) return '';
  const id = esc(p.id);
  const pinClass = p.pinned ? 'post-icon-btn is-active' : 'post-icon-btn';
  return `
  <span class="post-actions">
    <button class="post-icon-btn" title="Continue thread" onclick="beginReplyPost('${id}')">reply</button>
    <button class="post-icon-btn" title="Edit post" onclick="beginEditPost('${id}')"><img class="post-admin-icon" src="${esc(POST_ICONS.edit)}" alt="Edit post" title="Edit post"></button>
    <button class="${pinClass}" title="Pin post" onclick="togglePinPost('${id}')"><img class="post-admin-icon" src="${esc(POST_ICONS.pin)}" alt="Pin post" title="Pin post"></button>
    <button class="post-icon-btn" title="Toggle Private" onclick="togglePrivatePost('${id}')">priv</button>
    <button class="post-del-btn" onclick="deletePost('${id}')">delete</button>
  </span>`;
}

async function togglePrivatePost(id) {
  if (!window._isAdmin || !id) return;
  const p = findPostById(id);
  if (!p) return;
  try {
    const path = getBoardPath();
    await window._set(window._ref(window._db, path + '/' + id + '/private'), !p.private);
    filterPosts();
  } catch (e) { alert('Error: ' + e.message); }
}
window.togglePrivatePost = togglePrivatePost;

function buildPostCard(p, num, isNew = false) { 
  if (p.private && !window._isAdmin) return '';

  const path = getBoardPath();
  const isHome = path === 'home/posts';
  const s = getCurBoardSettings();
  const commentsHTML = (s.comments !== false) ? buildCommentsSectionHTML(p) : '';

  const showOriginal = window._postViewMode[p.id] === 'original' && hasPostOriginal(p);
  const payload = showOriginal ? getOriginalPayload(p) : getCurrentPayload(p);

  if (isHome) {
    const author = String(payload?.author || '').trim() || (window._globalSettings?.defaultAuthor || 'yuri.neet');
    const dateStr = fmtDate(p.ts);
    const bodyParts = payload ? buildPostPayloadHTML(payload) : null;
    const bodyHTML = bodyParts ? `${bodyParts.mediaHTML}${bodyParts.htmlContent}` : buildLockedPostHTML(p);
    const title = payload?.title || 'untitled';

    return `
      <div class="info-box" id="post-${esc(p.id || '')}">
          <div class="info-title">${esc(title)} <span style="font-size: 12px; font-weight: normal; float: right;">${dateStr} ${esc(author)} ${buildAdminPostButtons(p)}</span></div>
          <div class="info-body">
              ${bodyHTML}
              ${commentsHTML}
          </div>
      </div>
    `;
  }

  const moodHTML = payload ? buildMoodHTML(payload) : buildMoodHTML(null);
  const newHTML = isNew ? '<span class="post-new">new!*</span> ' : ''; 
  const adminBtns = buildAdminPostButtons(p);
  const pinnedHTML = p.pinned ? `<img class="post-status-icon" src="${esc(POST_ICONS.pin)}" alt="Pinned post" title="Pinned post"> ` : '';
  const privateHTML = p.private ? `<span style="color:var(--color-danger)">[PRIVATE]</span> ` : '';
  const lockHTML = (isCurrentLocked(p) || isOriginalLocked(p)) ? `<img class="post-status-icon" src="${esc(POST_ICONS.lock)}" alt="Locked post" title="Locked post"> ` : '';
  const updatedHTML = hasPostOriginal(p)
    ? `<div class="post-update-line">post updated ${fmtDate(p.updatedAt)} <button class="form-btn" onclick="togglePostOriginal('${esc(p.id || '')}')">${showOriginal ? 'show updated' : 'show original'}</button></div>`
    : '';
  const bodyParts = payload ? buildPostPayloadHTML(payload) : null;
  const bodyHTML = bodyParts ? `${bodyParts.mediaHTML}${bodyParts.htmlContent}` : buildLockedPostHTML(p);
  const titleHTML = bodyParts ? bodyParts.titleHTML : '';
  const posterHTML = payload ? buildPosterMetaHTML(payload) : buildPosterMetaHTML({});
  const repliesHTML = buildRepliesHTML(p);

  const isSketches = path === 'gallery/sketches';
  const upvotesCount = p.upvotes || 0;
  const sketchUpvoteHTML = isSketches ? `
    <span class="sketch-vote-wrap" style="margin-left: 8px;">
      <button class="form-btn" onclick="voteSketch('${esc(p.id)}', 'up')" style="padding: 1px 4px; font-size: 10px; cursor: pointer;">▲ Upvote (${upvotesCount})</button>
    </span>` : '';

  return ` 
    <div class="reply-container" id="post-${esc(p.id || '')}">
      <div class="doubledash">>></div>
      <div class="post reply"> 
        <div class="postinfo"> 
          ${posterHTML}
          <span class="time">${fmtDate(p.ts)}</span> 
          <span class="postnum">No.${num}</span> 
          ${newHTML}${pinnedHTML}${privateHTML}${lockHTML}${adminBtns}
          ${moodHTML} 
          ${sketchUpvoteHTML}
        </div> 
        ${updatedHTML}
        ${bodyHTML} 
        ${commentsHTML}
      </div>
    </div>
    ${repliesHTML}`; 
} 
 

function setBadgeFilter(badge) {
  window._badgeFilter = badge || null;
  filterPosts();
}
window.setBadgeFilter = setBadgeFilter;

function setSortBlog(order) { 
  window._blogSort = order; 
  window._blogVisiblePosts = BLOG_POSTS_PER_PAGE;
  filterPosts(); 
} 
window.setSortBlog = setSortBlog; 
 
function gettotheend() {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: 'smooth'
  });
}

window.gettotheend = gettotheend;



document.addEventListener('click', e => {
  if (e.target?.matches?.('[data-open-settings]')) return;
});

function initBlogChrome() { 
  const lang = localStorage.getItem('yurineetBlogLanguage');
  if (lang && window.setSiteLanguage) window.setSiteLanguage(lang);
  renderRecentBlogSidebars();
} 

if (document.readyState === 'loading') { 
  document.addEventListener('DOMContentLoaded', initBlogChrome); 
} else { 
  initBlogChrome(); 
} 


function filterPosts() { 
  renderRecentBlogSidebars();
  updateBadgeFilterUI();
  renderSortUI();
  updateBatchPostList();
  updateAdminBoardList();
  const container = document.getElementById('postsContainer'); 
  if (!container) return; 
  const sort = window._blogSort || 'newest'; 
  let posts = [...window._allPosts].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    const at = Number(a.ts) || 0;
    const bt = Number(b.ts) || 0;
    return sort === 'oldest' ? at - bt : bt - at;
  }); 
  if (!posts.length) { container.innerHTML = '<div class="no-posts">loading posts...</div>'; return; } 
  const total = window._allPosts.length; 
  const newest = [...window._allPosts].sort((a, b) => (Number(b.ts) || 0) - (Number(a.ts) || 0)); 
  const visible = Math.max(BLOG_POSTS_PER_PAGE, Number(window._blogVisiblePosts) || BLOG_POSTS_PER_PAGE);
  const visiblePosts = posts.slice(0, visible);
  let html = '';
  const currentBadgeFilter = window._badgeFilter || null;

  visiblePosts.forEach(p => {
    if (currentBadgeFilter && p.badge !== currentBadgeFilter) return;
    const idx = newest.findIndex(x => x.id === p.id);
    html += buildPostCard(p, idx >= 0 ? total - idx : total, idx >= 0 && idx < 3);
  });
  if (visible < posts.length) {
    html += `<div class="show-more-wrap"><button class="form-btn show-more-btn" onclick="showMorePosts()">show more</button></div>`;
  }
  container.innerHTML = html; 
} 
window.filterPosts = filterPosts; 

function showMorePosts() {
  window._blogVisiblePosts = (Number(window._blogVisiblePosts) || BLOG_POSTS_PER_PAGE) + BLOG_POSTS_PER_PAGE;
  filterPosts();
}
window.showMorePosts = showMorePosts;

function recentPostLabel(p) {
  if (isCurrentLocked(p) && !window._unlockedPosts[p.id]?.current) {
    return { title: 'locked post', excerpt: 'password needed' };
  }
  const payload = getCurrentPayload(p) || postPayloadFrom(p);
  const raw = String(payload?.contentRaw || '').replace(/\s+/g, ' ').trim();
  const title = String(payload?.title || raw || 'untitled post').trim();
  const excerpt = raw && raw !== title ? raw.slice(0, 58) + (raw.length > 58 ? '...' : '') : '';
  return { title: title.slice(0, 48) + (title.length > 48 ? '...' : ''), excerpt };
}

function renderRecentBlogSidebars() {
  const targets = document.querySelectorAll('[data-recent-posts]');
  if (!targets.length) return;
  const posts = [...(window._allPosts || [])]
    .sort((a, b) => (Number(b.ts) || 0) - (Number(a.ts) || 0))
    .slice(0, 6);
  const html = posts.length
    ? posts.map(p => {
        const id = esc(p.id || '');
        const label = recentPostLabel(p);
        const href = location.pathname.endsWith('/blog.html') ? `#post-${id}` : `blog.html#post-${id}`;
        const pin = p.pinned ? '<span class="recent-pin">pin</span>' : '';
        return `<li class="recent-post-item"><a href="${href}"><span class="recent-post-title">${esc(label.title)}</span>${pin}<span class="recent-post-date">${esc(fmtDate(p.ts))}</span>${label.excerpt ? `<span class="recent-post-excerpt">${esc(label.excerpt)}</span>` : ''}</a></li>`;
      }).join('')
    : '<li class="recent-post-empty">waiting for posts...</li>';
  targets.forEach(target => { target.innerHTML = html; });
}
window.renderRecentBlogSidebars = renderRecentBlogSidebars;
 
function getBoardPath() {
  const urlParams = new URLSearchParams(window.location.search);
  let boardId = urlParams.get('board');
  if (!boardId) {
    if (window.location.pathname.endsWith('sketches.html')) boardId = 'sketches';
    else if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) boardId = 'home';
    else boardId = 'blog';
  }
  return (boardId === 'blog') ? 'blog/posts' : 
         (boardId === 'sketches') ? 'gallery/sketches' : 
         (boardId === 'home') ? 'home/posts' :
         `boards/${boardId}/posts`;
}

async function deletePost(id) { 
  if (!window._isAdmin || !id) return; 
  if (!confirm('delete?')) return; 
  try { 
    const path = getBoardPath();
    await window._remove(window._ref(window._db, path + '/' + id)); 
  } catch (e) { alert('error: ' + e.message); } 
} 
window.deletePost = deletePost; 

function findPostById(id) {
  return window._allPosts.find(p => p.id === id) || null;
}

function findReplyById(postId, replyId) {
  return repliesForPost(findPostById(postId)).find(reply => reply.id === replyId) || null;
}

async function deleteReply(postId, replyId) {
  if (!window._isAdmin || !postId || !replyId) return;
  if (!confirm('delete continuation?')) return;
  try {
    await window._remove(window._ref(window._db, 'blog/posts/' + postId + '/replies/' + replyId));
    await touchAdminLastOnline();
  } catch (e) {
    alert('error: ' + e.message);
  }
}
window.deleteReply = deleteReply;

function togglePostOriginal(id) {
  if (!id) return;
  window._postViewMode[id] = window._postViewMode[id] === 'original' ? 'current' : 'original';
  filterPosts();
}
window.togglePostOriginal = togglePostOriginal;

async function unlockPost(id) {
  const p = findPostById(id);
  if (!p) return;
  const input = document.getElementById('unlockPw-' + id);
  const status = document.getElementById('unlockStatus-' + id);
  const password = input?.value || '';
  if (!password) { if (status) status.textContent = 'enter password.'; return; }
  if (status) status.textContent = 'unlocking...';
  try {
    const unlocked = window._unlockedPosts[id] || {};
    if (p.lockedData) unlocked.current = postPayloadFrom(await decryptPostPayload(p.lockedData, password));
    if (p.originalLockedData) unlocked.original = postPayloadFrom(await decryptPostPayload(p.originalLockedData, password));
    window._unlockedPosts[id] = unlocked;
    if (status) status.textContent = '';
    filterPosts();
  } catch (e) {
    if (status) status.textContent = 'wrong password.';
  }
}
window.unlockPost = unlockPost;

async function togglePinPost(id) {
  if (!window._isAdmin || !id) return;
  const p = findPostById(id);
  if (!p || !window._set || !window._ref || !window._db) return;
  try {
    await window._set(window._ref(window._db, 'blog/posts/' + id + '/pinned'), !p.pinned);
    await touchAdminLastOnline();
  } catch (e) {
    alert('error: ' + e.message);
  }
}
window.togglePinPost = togglePinPost;
 
async function tryLogin() { 
  const pw = document.getElementById('pwInput')?.value || ''; 
  const errEl = document.getElementById('loginErr'); 
  if (!pw) { if (errEl) errEl.textContent = 'enter password.'; return; } 
  if (errEl) errEl.textContent = 'checking...'; 
  let waited = 0; 
  while ((!window._sha256 || !window._get || !window._ref || !window._db) && waited < 8000) { 
    await new Promise(r => setTimeout(r, 120)); 
    waited += 120; 
  } 
  if (!window._sha256 || !window._get || !window._ref || !window._db) { if (errEl) errEl.textContent = 'firebase not ready.'; return; } 
  try { 
    const hash = await window._sha256(pw); 
    const snap = await window._get(window._ref(window._db, 'admin/passHash')); 
    if (snap.val() === hash) { 
      if (window._signInAnonymously && window._auth) {
        await window._signInAnonymously(window._auth);
      }
      window._isAdmin = true; 
      sessionStorage.setItem('yurineet_isAdmin', 'true');
      await touchAdminLastOnline(); 
      document.getElementById('adminLogin').style.display = 'none'; 
      document.getElementById('adminPanel').style.display = 'block'; 
      if (errEl) errEl.textContent = ''; 
      if (window.chanReadSettings) window.applySettings(window.chanReadSettings());
      if (window.updateEditorFields) window.updateEditorFields();
      filterPosts(); 
    } else { if (errEl) errEl.textContent = 'wrong password.'; } 
  } catch (e) { if (errEl) errEl.textContent = 'error: ' + e.message; } 
} 
window.tryLogin = tryLogin; 
 
function logout() { 
  window._isAdmin = false; 
  sessionStorage.removeItem('yurineet_isAdmin');
  resetPostEditor();
  if (document.getElementById('adminLogin')) document.getElementById('adminLogin').style.display = 'block'; 
  if (document.getElementById('adminPanel')) document.getElementById('adminPanel').style.display = 'none'; 
  if (document.getElementById('pwInput')) document.getElementById('pwInput').value = ''; 
  filterPosts(); 
  if (window.updateLoginNavBtn) window.updateLoginNavBtn();
} 

async function _googleLogin() {
  if (!window._auth || !window._signInWithPopup || !window._googleProvider) {
    alert("Firebase Auth is not ready yet.");
    return;
  }
  try {
    const result = await window._signInWithPopup(window._auth, window._googleProvider);
    const user = result.user;
    const allowedUIDs = ['hTlwbwNnxCXIe96jVdPzPMnq7aw2', 'M6YxrCDxxibc9mkiJN1gWUXmrcG2'];
    const allowedEmails = ['cauelonghi2024@gmail.com', 'yurineet09@gmail.com'];
    
    if (user && (allowedUIDs.includes(user.uid) || allowedEmails.includes(user.email))) {
      window._isAdmin = true;
      sessionStorage.setItem('yurineet_isAdmin', 'true');
      alert("Welcome, Admin!");
    } else {
      await window._signOut(window._auth);
      window._isAdmin = false;
      sessionStorage.removeItem('yurineet_isAdmin');
      alert("Access Denied: You are not authorized as an administrator.");
    }
  } catch (error) {
    alert("Login failed: " + error.message);
  }
  
  if (window.filterPosts) window.filterPosts();
  if (window.injectAdminUI) window.injectAdminUI();
  if (window.injectGalAdminUI) window.injectGalAdminUI();
  if (window.checkLockdown) window.checkLockdown();
  if (window.updateLoginNavBtn) window.updateLoginNavBtn();
}
window._googleLogin = _googleLogin;

async function _googleLogout() {
  if (!window._auth || !window._signOut) {
    alert("Firebase Auth is not ready yet.");
    return;
  }
  try {
    await window._signOut(window._auth);
    window._isAdmin = false;
    sessionStorage.removeItem('yurineet_isAdmin');
    alert("Logged out successfully.");
  } catch (error) {
    alert("Logout failed: " + error.message);
  }
  
  if (window.filterPosts) window.filterPosts();
  if (window.injectAdminUI) window.injectAdminUI();
  if (window.injectGalAdminUI) window.injectGalAdminUI();
  if (window.checkLockdown) window.checkLockdown();
  if (window.updateLoginNavBtn) window.updateLoginNavBtn();
}
window._googleLogout = _googleLogout;

function openLoginModal() {
  let wrap = document.getElementById('adminLoginDialog');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'adminLoginDialog';
    wrap.className = 'settings-backdrop';
    wrap.addEventListener('click', event => {
      if (event.target === wrap) closeLoginModal();
    });
    document.body.appendChild(wrap);
  }
  
  const isAdmin = window._isAdmin;
  
  wrap.innerHTML = `
    <div class="settings-dialog" role="dialog" aria-modal="true" style="max-width: 320px; background: var(--color-bg-alt, #fff); border: 1px solid #000; box-shadow: 2px 2px 8px rgba(0,0,0,0.5);">
      <div class="settings-head" style="background: #800000; color: #fff; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; font-weight: bold;">
        <span>Login</span>
        <button type="button" class="form-btn" onclick="closeLoginModal()" style="color: #fff; background: none; border: none; cursor: pointer; font-weight: bold;">x</button>
      </div>
      <div class="settings-body" style="text-align: center; padding: 20px 10px; background: var(--color-bg-alt, #fff); color: var(--color-fg-main, #000);">
        ${isAdmin ? `
          <p style="margin-bottom: 15px; color: green; font-weight: bold;">You are logged in as Admin!</p>
          <button type="button" class="form-btn" onclick="window._googleLogout(); closeLoginModal();" style="padding: 6px 12px; cursor: pointer;">Logout</button>
        ` : `
          <p style="margin-bottom: 20px; font-size: 11px;">you cannot log in as an administrator if your account does not have admin privileges.</p>
          <button type="button" class="form-btn" onclick="window._googleLogin(); closeLoginModal();" style="padding: 8px 16px; font-weight: bold; background: #800000; color: #fff; border: 1px solid #000; cursor: pointer;">
            Login with Google
          </button>
        `}
      </div>
    </div>
  `;
  wrap.classList.add('is-open');
}
window.openLoginModal = openLoginModal;

function closeLoginModal() {
  document.getElementById('adminLoginDialog')?.classList.remove('is-open');
}
window.closeLoginModal = closeLoginModal;

function updateLoginNavBtn() {
  const rightSpans = document.querySelectorAll('.boardlist-right');
  rightSpans.forEach(span => {
    let loginLink = span.querySelector('#loginBtnNav');
    if (!loginLink) {
      const delimiter = document.createTextNode(' ');
      loginLink = document.createElement('a');
      loginLink.id = 'loginBtnNav';
      loginLink.href = '#';
      span.appendChild(delimiter);
      
      const bracketOpen = document.createTextNode('[');
      span.appendChild(bracketOpen);
      
      span.appendChild(loginLink);
      
      const bracketClose = document.createTextNode(']');
      span.appendChild(bracketClose);
    }
    
    if (window._isAdmin) {
      loginLink.textContent = 'logout';
      loginLink.onclick = (e) => {
        e.preventDefault();
        window._googleLogout();
      };
    } else {
      loginLink.textContent = 'login';
      loginLink.onclick = (e) => {
        e.preventDefault();
        window.openLoginModal();
      };
    }
  });
}
window.updateLoginNavBtn = updateLoginNavBtn;

function checkLockdown() {
  const isLockdown = window._globalSettings && window._globalSettings.lockdown === true;
  const isAdmin = window._isAdmin;
  
  let overlay = document.getElementById('lockdownOverlay');
  
  if (isLockdown && !isAdmin) {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'lockdownOverlay';
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.backgroundColor = '#000000';
      overlay.style.color = '#ffffff';
      overlay.style.zIndex = '999999';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.fontFamily = 'Courier New, monospace';
      overlay.style.textAlign = 'center';
      overlay.style.padding = '20px';
      overlay.style.boxSizing = 'border-box';
      
      document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
      <h1 style="font-size: 24px; color: #ff0000; margin-bottom: 20px; font-weight: bold;">[ TOTAL LOCKDOWN ]</h1>
      <p style="font-size: 14px; max-width: 600px; margin-bottom: 30px; line-height: 1.6;">
        This website is currently locked down by the administrator. 
        All content has been temporarily closed.
      </p>
      <button class="form-btn" id="lockdownLoginBtn" style="padding: 6px 16px; font-size: 12px; cursor: pointer; background: #800000; color: #fff; border: 1px solid #000;">Admin Login</button>
    `;
    
    document.getElementById('lockdownLoginBtn').addEventListener('click', () => {
      if (window.openLoginModal) {
        window.openLoginModal();
      }
    });
    
    const containers = ['postsContainer', 'posts', 'sec-home', 'sec-blog', 'sec-gallery', 'sec-links', 'sec-contact', 'home-box', 'blackcontainer'];
    containers.forEach(id => {
      const el = document.getElementById(id) || document.querySelector('.' + id);
      if (el) {
        el.style.visibility = 'hidden';
      }
    });
  } else {
    if (overlay) {
      overlay.remove();
    }
    const containers = ['postsContainer', 'posts', 'sec-home', 'sec-blog', 'sec-gallery', 'sec-links', 'sec-contact', 'home-box', 'blackcontainer'];
    containers.forEach(id => {
      const el = document.getElementById(id) || document.querySelector('.' + id);
      if (el) {
        el.style.visibility = '';
      }
    });
  }
}
window.checkLockdown = checkLockdown;

function renderBoardList() {
  const containers = document.querySelectorAll('.boardlist-dynamic');
  const footerContainers = document.querySelectorAll('.footer-boardlist');
  const boards = window._boards || {};

  const fixedBoards = [
  { id: 'blog', title: 'blog', url: location.pathname.includes('/assets/pages/') ? 'blog.html' : 'assets/pages/blog.html' },
  { id: 'sketches', title: 'sketches', url: location.pathname.includes('/assets/pages/') ? 'sketches.html' : 'assets/pages/sketches.html' },
];

  const boardEntries = Object.entries(boards);

  const counts = window._boardPostCounts || {};

const getCountText = (id) => {
  if (id === 'home') return '';

  const count = counts[id];
  return count !== undefined ? ` (${count})` : '';
};

 const dynamicHtml = boardEntries
  .map(([id]) =>
    ` [<a href="${location.pathname.includes('/assets/pages/') ? 'blog.html' : 'assets/pages/blog.html'}?board=${esc(id)}">/${esc(id)}</a>${getCountText(id)}] `
  )
.join(' / ');

  const fixedHtml = fixedBoards
  .map(b => ` [<a href="${b.url}">${b.title}</a>${getCountText(b.id)}] `)
.join(' / ');

  containers.forEach(c => {
c.innerHTML = `[${fixedHtml}${boardEntries.length ? ' / ' + dynamicHtml : ''}]`;  });

  const footerHtml = fixedHtml + dynamicHtml;



  footerContainers.forEach(c => {
    if (c.classList.contains('boards-body')) {
     const listHtml =
  fixedBoards
    .map(b => `<a href="${b.url}">/${b.title}/</a>`)
    .join('') +
  boardEntries
    .map(([id]) => `<a href="${location.pathname.includes('/assets/pages/') ? 'blog.html' : 'assets/pages/blog.html'}?board=${esc(id)}">/${esc(id)}/</a>`)
    .join('');

      c.innerHTML = listHtml;
    } else {
      c.innerHTML = footerHtml;
    }
  });
}
window.renderBoardList = renderBoardList;
window.logout = logout; 
 
let _blogMedia = []; 
window._replyingToPostId = null;
window._editingReply = null;
 
function editorMediaPreviewHTML(item) {
  if (!item) return '';
  const url = esc(item.url || '');
  if (item.type?.startsWith('video')) return `<video src="${url}" style="max-width:110px; max-height:90px; border:1px solid #aaaaaa;"></video>`;
  if (item.type?.startsWith('audio')) return `<div style="width:110px; height:90px; border:1px solid #aaaaaa; display:flex; align-items:center; justify-content:center; font-size:10px;">Audio</div>`;
  return `<img src="${url}" alt="" style="max-width:110px;max-height:90px;border:1px solid #aaaaaa;">`;
}

function renderBlogEditorMedia() {
  const fn = document.getElementById('edFileName');
  const rb = document.getElementById('edRemoveImg');
  const pv = document.getElementById('edImgPreview');
  if (fn) fn.textContent = _blogMedia.length ? _blogMedia.length + ' files' : 'none';
  if (rb) rb.style.display = _blogMedia.length ? 'inline-block' : 'none';
  if (pv) {
    pv.style.display = _blogMedia.length ? 'flex' : 'none';
    pv.innerHTML = _blogMedia.map(editorMediaPreviewHTML).join('');
  }
}

function resetPostEditor() {
  window._editingPostId = null;
  window._replyingToPostId = null;
  window._editingReply = null;
  const author = document.getElementById('postAuthor'); if (author) author.value = (window.getSiteSetting?.('defaultName') || '');
  const options = document.getElementById('postOptions'); if (options) options.value = '';
  const badge = document.getElementById('postBadge'); if (badge) badge.value = '';
  const title = document.getElementById('postTitle'); if (title) title.value = '';
  const moodText = document.getElementById('postMoodText'); if (moodText) moodText.value = '';
  const moodEmote = document.getElementById('postMoodEmote'); if (moodEmote) moodEmote.value = '';
  const ta = document.getElementById('postTextarea'); if (ta) ta.value = '';
  const spoiler = document.getElementById('edSpoilerImg'); if (spoiler) spoiler.checked = false;
  const lockOriginal = document.getElementById('edLockOriginal'); if (lockOriginal) lockOriginal.checked = false;
  const lockUpdate = document.getElementById('edLockUpdate'); if (lockUpdate) lockUpdate.checked = false;
  const lockPw = document.getElementById('postLockPassword'); if (lockPw) lockPw.value = '';
  const pinned = document.getElementById('edPinned'); if (pinned) pinned.checked = false;
  const modeTitle = document.getElementById('editorModeTitle'); if (modeTitle) modeTitle.textContent = 'new post';
  const submit = document.getElementById('submitBtn'); if (submit) submit.textContent = 'Post';
  const cancel = document.getElementById('cancelEditBtn'); if (cancel) cancel.style.display = 'none';
  const status = document.getElementById('edStatus'); if (status) status.textContent = '';
  _blogMedia = [];
  renderBlogEditorMedia();
  syncMoodIcon();
}
window.resetPostEditor = resetPostEditor;

function removeBlogEditorImg() { 
  _blogMedia = []; 
  renderBlogEditorMedia();
} 
window.removeBlogEditorImg = removeBlogEditorImg; 
 
async function handleBlogFileSelect(event) { 
  const files = Array.from(event.target.files); event.target.value = ''; 
  if (!files.length) return; 
   
  const statusEl = document.getElementById('edStatus'); 
  if (statusEl) statusEl.textContent = 'uploading...'; 
 
  for (const file of files) { 
    if (file.size > 2000 * 1024) { alert(`File ${file.name} exceeds 2MB limit.`); continue; } 
     
    let w = null, h = null; 
    if (file.type.startsWith('image')) { 
      const tmpUrl = URL.createObjectURL(file); const tmpImg = new Image(); tmpImg.src = tmpUrl; 
      await new Promise(res => { tmpImg.onload = tmpImg.onerror = res; }); 
      w = tmpImg.naturalWidth; h = tmpImg.naturalHeight; URL.revokeObjectURL(tmpUrl); 
    } 
 
    const sizeKB = (file.size / 1024).toFixed(1); 
    try { 
      const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', 'unsigned_upload'); 
      // Use auto/upload to support images, videos, and audio 
      const res = await fetch('https://api.cloudinary.com/v1_1/dagsxkazw/auto/upload', { method: 'POST', body: fd }); 
      const data = await res.json(); 
      if (!data.secure_url) throw new Error('upload failed'); 
       
      _blogMedia.push({ url: data.secure_url, info: { name: file.name, sizeKB, w, h }, type: file.type }); 
       
      renderBlogEditorMedia();
      if (statusEl) statusEl.textContent = 'media ready.'; 
    } catch (err) { if (statusEl) statusEl.textContent = 'upload error: ' + err.message; } 
  } 
} 
window.handleBlogFileSelect = handleBlogFileSelect; 

function beginEditPost(id) {
  if (!window._isAdmin || !id) return;
  const p = findPostById(id);
  const payload = getCurrentPayload(p);
  if (!p || !payload) {
    alert('unlock this post before editing.');
    return;
  }
  window._editingPostId = id;
  window._replyingToPostId = null;
  window._editingReply = null;
  const author = document.getElementById('postAuthor'); if (author) author.value = payload.author || '';
  const options = document.getElementById('postOptions'); if (options) options.value = payload.options || '';
  const badge = document.getElementById('postBadge'); if (badge) badge.value = payload.badge || '';
  const title = document.getElementById('postTitle'); if (title) title.value = payload.title || '';
  const moodText = document.getElementById('postMoodText'); if (moodText) moodText.value = payload.moodText || '';
  const moodEmote = document.getElementById('postMoodEmote'); if (moodEmote) moodEmote.value = payload.moodEmote || '';
  const ta = document.getElementById('postTextarea'); if (ta) ta.value = payload.contentRaw || '';
  const spoiler = document.getElementById('edSpoilerImg'); if (spoiler) spoiler.checked = !!payload.spoilerImg;
  const lockOriginal = document.getElementById('edLockOriginal'); if (lockOriginal) lockOriginal.checked = isOriginalLocked(p);
  const lockUpdate = document.getElementById('edLockUpdate'); if (lockUpdate) lockUpdate.checked = isCurrentLocked(p);
  const lockPw = document.getElementById('postLockPassword'); if (lockPw) lockPw.value = '';
  const pinned = document.getElementById('edPinned'); if (pinned) pinned.checked = !!p.pinned;
  const modeTitle = document.getElementById('editorModeTitle'); if (modeTitle) modeTitle.textContent = 'edit post';
  const submit = document.getElementById('submitBtn'); if (submit) submit.textContent = 'Update';
  const cancel = document.getElementById('cancelEditBtn'); if (cancel) cancel.style.display = 'inline-block';
  _blogMedia = normalizePostMedia(payload.media) ? payload.media.map(item => ({ ...item })) : [];
  renderBlogEditorMedia();
  syncMoodIcon();
  document.getElementById('adminContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.beginEditPost = beginEditPost;

function beginReplyPost(id) {
  if (!window._isAdmin || !id) return;
  const p = findPostById(id);
  if (!p) return;
  resetPostEditor();
  window._replyingToPostId = id;
  const author = document.getElementById('postAuthor'); if (author) author.value = window.getSiteSetting?.('defaultName') || '';
  const ta = document.getElementById('postTextarea'); if (ta) ta.value = `>>${postNumberForId(id)}\n`;
  const modeTitle = document.getElementById('editorModeTitle'); if (modeTitle) modeTitle.textContent = `continue No.${postNumberForId(id)}`;
  const submit = document.getElementById('submitBtn'); if (submit) submit.textContent = 'Reply';
  const cancel = document.getElementById('cancelEditBtn'); if (cancel) cancel.style.display = 'inline-block';
  document.getElementById('adminContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  ta?.focus();
}
window.beginReplyPost = beginReplyPost;

function beginEditReply(postId, replyId) {
  if (!window._isAdmin || !postId || !replyId) return;
  const reply = findReplyById(postId, replyId);
  if (!reply) return;
  resetPostEditor();
  window._editingReply = { postId, replyId };
  const payload = postPayloadFrom(reply);
  const author = document.getElementById('postAuthor'); if (author) author.value = payload.author || '';
  const options = document.getElementById('postOptions'); if (options) options.value = payload.options || '';
  const badge = document.getElementById('postBadge'); if (badge) badge.value = payload.badge || '';
  const title = document.getElementById('postTitle'); if (title) title.value = payload.title || '';
  const moodText = document.getElementById('postMoodText'); if (moodText) moodText.value = payload.moodText || '';
  const moodEmote = document.getElementById('postMoodEmote'); if (moodEmote) moodEmote.value = payload.moodEmote || '';
  const ta = document.getElementById('postTextarea'); if (ta) ta.value = payload.contentRaw || '';
  const spoiler = document.getElementById('edSpoilerImg'); if (spoiler) spoiler.checked = !!payload.spoilerImg;
  const pinned = document.getElementById('edPinned'); if (pinned) pinned.checked = false;
  const modeTitle = document.getElementById('editorModeTitle'); if (modeTitle) modeTitle.textContent = `edit continuation No.${postNumberForId(postId)}`;
  const submit = document.getElementById('submitBtn'); if (submit) submit.textContent = 'Update reply';
  const cancel = document.getElementById('cancelEditBtn'); if (cancel) cancel.style.display = 'inline-block';
  _blogMedia = normalizePostMedia(payload.media) ? payload.media.map(item => ({ ...item })) : [];
  renderBlogEditorMedia();
  syncMoodIcon();
  document.getElementById('adminContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  ta?.focus();
}
window.beginEditReply = beginEditReply;
 
async function submitPost() { 
  if (!window._isAdmin) return; 
  const btn = document.getElementById('submitBtn'), status = document.getElementById('edStatus'); 
  const raw = (document.getElementById('postTextarea')?.value || '').trim(); 
  const author = (document.getElementById('postAuthor')?.value || '').trim();
  const options = (document.getElementById('postOptions')?.value || '').trim();
  const badge = (document.getElementById('postBadge')?.value || '').trim();
  const title = (document.getElementById('postTitle')?.value || '').trim(); 
  const moodText = (document.getElementById('postMoodText')?.value || '').trim(); 
  const moodEmote = document.getElementById('postMoodEmote')?.value || null; 
  const lockPassword = document.getElementById('postLockPassword')?.value || '';
  const lockOriginal = document.getElementById('edLockOriginal')?.checked || false;
  const lockUpdateBox = document.getElementById('edLockUpdate')?.checked || false;
  const pinned = document.getElementById('edPinned')?.checked || false;
  const isPrivate = document.getElementById('edPrivate')?.checked || false;
  const editingId = window._editingPostId;
  const replyingToPostId = window._replyingToPostId;
  const editingReply = window._editingReply;
  const existing = editingId ? findPostById(editingId) : null;
  const payload = postPayloadFrom({
    author: author || null,
    options: options || null,
    badge: badge || null,
    title: title || null,
    moodText: moodText || null,
    moodEmote: moodEmote || null,
    media: _blogMedia.length ? _blogMedia : null,
    spoilerImg: document.getElementById('edSpoilerImg')?.checked || false,
    contentRaw: raw || ' '
  });

  if (!hasPostPayloadContent(payload)) { if (status) status.textContent = 'write something first.'; return; } 
  if (replyingToPostId || editingReply) {
    const parentId = editingReply?.postId || replyingToPostId;
    const currentReply = editingReply ? findReplyById(editingReply.postId, editingReply.replyId) : null;
    if (!parentId) { if (status) status.textContent = 'missing parent post.'; return; }
    btn.disabled = true; if (status) status.textContent = editingReply ? 'updating reply...' : 'replying...';
    try {
      const path = getBoardPath();
      const replyRecord = {
        ...payloadFieldsForSave(payload),
        ts: editingReply ? (currentReply?.ts || Date.now()) : (typeof window._serverTimestamp === 'function' ? window._serverTimestamp() : Date.now()),
        updatedAt: editingReply ? Date.now() : null
      };
      if (!replyRecord.updatedAt) delete replyRecord.updatedAt;
      if (editingReply) {
        await window._set(window._ref(window._db, path + '/' + editingReply.postId + '/replies/' + editingReply.replyId), replyRecord);
      } else {
        await window._push(window._ref(window._db, path + '/' + parentId + '/replies'), replyRecord);
      }
      await touchAdminLastOnline();
      resetPostEditor();
      if (status) { status.textContent = editingReply ? 'reply updated!' : 'reply posted!'; setTimeout(() => { status.textContent = ''; }, 3000); }
    } catch (e) {
      if (status) status.textContent = 'error: ' + e.message;
      btn.disabled = false;
      return;
    }
    btn.disabled = false;
    return;
  }

  const lockUpdate = lockUpdateBox || (!editingId && lockOriginal);
  if ((lockUpdate || (editingId && lockOriginal && !(existing?.originalLockedData && !getOriginalPayload(existing)))) && !lockPassword) {
    if (status) status.textContent = 'enter post password.';
    return;
  }
  btn.disabled = true; if (status) status.textContent = editingId ? 'updating...' : 'posting...'; 
  try { 
    const path = getBoardPath();
    const record = {
      secret: existing?.secret || POST_SECRET,
      pinned,
      private: isPrivate,
      ts: editingId ? (existing?.ts || Date.now()) : (typeof window._serverTimestamp === 'function' ? window._serverTimestamp() : Date.now())
    };
    if (editingId && existing?.replies) record.replies = existing.replies;

    if (lockUpdate) {
      record.lockedData = await encryptPostPayload(payloadFieldsForSave(payload), lockPassword);
    } else {
      Object.assign(record, payloadFieldsForSave(payload));
    }

    if (editingId) {
      let originalPayload = getOriginalPayload(existing);
      if (!originalPayload && existing?.originalLockedData && lockPassword) {
        originalPayload = postPayloadFrom(await decryptPostPayload(existing.originalLockedData, lockPassword));
      }
      const preservingLockedOriginal = !!(existing?.originalLockedData && !originalPayload && lockOriginal);
      if (!originalPayload && !existing?.originalLockedData) originalPayload = getCurrentPayload(existing);
      if (!originalPayload && !preservingLockedOriginal) throw new Error('unlock this post before editing.');

      record.updatedAt = Date.now();
      if (lockOriginal) {
        if (preservingLockedOriginal) {
          record.originalLockedData = existing.originalLockedData;
        } else {
          record.originalLockedData = await encryptPostPayload(payloadFieldsForSave(originalPayload), lockPassword);
        }
      } else if (existing?.originalLockedData && !getOriginalPayload(existing) && !lockPassword) {
        throw new Error('unlock original before removing its lock.');
      } else {
        record.original = { ...payloadFieldsForSave(originalPayload), ts: originalPayload.ts || existing?.ts || null };
      }
      await window._set(window._ref(window._db, path + '/' + editingId), record);
      delete window._unlockedPosts[editingId];
      window._postViewMode[editingId] = 'current';
    } else {
      await window._push(window._ref(window._db, path), record);
    }
    await touchAdminLastOnline(); 
    resetPostEditor();
    if (status) { status.textContent = editingId ? 'updated!' : 'posted!'; setTimeout(() => { status.textContent = ''; }, 3000); } 
  } catch (e) { if (status) status.textContent = 'error: ' + e.message; btn.disabled = false; return; } 
  btn.disabled = false; 
} 
window.submitPost = submitPost; 
 
let _slashSelectedIdx = 0; 
let _slashItems = []; 
let _slashMode = 'commands'; 
const SLASH_COMMANDS = [ 
  { cmd: '/url', desc: 'Embed a link' }, 
  { cmd: '/emoji', desc: 'Insert an emoji' }, 
  { cmd: '/mood', desc: 'Set post mood' }, 
  { cmd: '/spoiler', desc: 'Spoiler text' } 
]; 

function getPostTextarea() { 
  return document.getElementById('postTextarea'); 
} 

function getActiveSlash(ta = getPostTextarea()) { 
  if (!ta) return null; 
  const caret = ta.selectionStart; 
  const before = ta.value.slice(0, caret); 
  const lineStart = before.lastIndexOf('\n') + 1; 
  const segment = before.slice(lineStart); 
  const slashPos = segment.lastIndexOf('/'); 
  if (slashPos < 0) return null; 
  const text = segment.slice(slashPos); 
  const match = text.match(/^\/([a-zA-Z]*)(?:\s+([^\n]*))?$/); 
  if (!match) return null; 
  return { 
    absStart: lineStart + slashPos, 
    command: '/' + (match[1] || ''), 
    query: (match[2] || '').trim().toLowerCase(), 
    caret 
  }; 
} 

function getActiveEmojiName(ta = getPostTextarea()) {
  if (!ta) return null;
  const caret = ta.selectionStart;
  const before = ta.value.slice(0, caret);
  const match = before.match(/(^|[\s([{])(:[a-zA-Z0-9_-]*)$/);
  if (!match) return null;
  const token = match[2];
  return {
    absStart: before.length - token.length,
    query: token.slice(1).toLowerCase(),
    caret
  };
}

function renderSlashItem(item, i) { 
  const active = i === _slashSelectedIdx ? ' active' : ''; 
  if (item.type === 'command') { 
    return `<div class="slash-item${active}" onclick="selectSlashSuggestion(${i})"><b>${esc(item.cmd)}</b> - ${esc(item.desc)}</div>`; 
  } 
  const src = EMOTES[item.name]; 
  const label = item.type === 'mood' ? 'mood' : 'emoji'; 
  return `<div class="slash-item${active}" onclick="selectSlashSuggestion(${i})"><img src="${esc(src)}" alt="" title="${esc(emoteCategory(item.name))}"><b>${esc(item.name)}</b><span style="margin-left:auto;color:inherit;">${label}</span></div>`; 
} 
 
function updateBadgeFilterUI() {
  const container = document.getElementById('badgeFilterContainer');
  if (!container) return;
  const badges = [...new Set(window._allPosts.map(p => p.badge).filter(Boolean))];
  
  let html = `<select class="sort-btn" onchange="setBadgeFilter(this.value || null)" style="padding: 1px 4px;">`;
  html += `<option value="" ${!window._badgeFilter ? 'selected' : ''}>all</option>`;
  badges.forEach(b => {
    html += `<option value="${esc(b)}" ${window._badgeFilter === b ? 'selected' : ''}>${esc(b)}</option>`;
  });
  html += `</select>`;
  container.innerHTML = html;
}

function renderSortUI() {
  const container = document.getElementById('sortContainer');
  if (!container) return;
  const sort = window._blogSort || 'newest';
  
  container.innerHTML = `
    <select class="sort-btn" onchange="setSortBlog(this.value)" style="padding: 1px 4px;">
      <option value="newest" ${sort === 'newest' ? 'selected' : ''}>newest</option>
      <option value="oldest" ${sort === 'oldest' ? 'selected' : ''}>oldest</option>
    </select>
  `;
}

function updateBatchPostList() {
  const container = document.getElementById('batchPostList');
  if (!container) return;
  container.innerHTML = window._allPosts.map(p => `
    <div><input type="checkbox" class="batch-check" data-id="${esc(p.id)}"> No.${postNumberForId(p.id)} - ${esc(p.title || p.contentRaw?.slice(0, 30))}</div>
  `).join('');
}

function updateAdminBoardList() {
  const container = document.getElementById('adminBoardList');
  if (!container) return;
  const boards = window._boards || {};
  container.innerHTML = Object.entries(boards).map(([id, b]) => `
    <div>${esc(b.title)} (${esc(id)}) <button class="form-btn" onclick="deleteBoard('${esc(id)}', '${esc(b.title)}')">delete</button></div>
  `).join('');
}

function updateSlashHelp() { 
  const help = document.getElementById('slashHelp'); 
  const ta = getPostTextarea(); 
  if (!help) return; 
  const active = getActiveSlash(ta); 
  const activeEmoji = active ? null : getActiveEmojiName(ta);
  if (!active && !activeEmoji) { help.style.display = 'none'; return; } 
 
  if (activeEmoji) {
    _slashMode = 'emoji-name';
    _slashItems = Object.keys(EMOTES)
      .filter(name => !activeEmoji.query || name.includes(activeEmoji.query) || emoteCategory(name).includes(activeEmoji.query))
      .map(name => ({ type: 'emoji', name }));
  } else if (active.command === '/emoji') { 
    _slashMode = 'emoji'; 
    _slashItems = Object.keys(EMOTES) 
      .filter(name => !active.query || name.includes(active.query) || emoteCategory(name).includes(active.query)) 
      .map(name => ({ type: 'emoji', name })); 
  } else if (active.command === '/mood') { 
    _slashMode = 'mood'; 
    _slashItems = Object.keys(EMOTES) 
      .filter(name => emoteCategory(name) === 'mood') 
      .filter(name => !active.query || name.includes(active.query)) 
      .map(name => ({ type: 'mood', name })); 
  } else if (active.query && SLASH_COMMANDS.some(c => c.cmd === active.command)) { 
    help.style.display = 'none'; 
    return; 
  } else { 
    _slashMode = 'commands'; 
    const prefix = active.command.toLowerCase(); 
    _slashItems = SLASH_COMMANDS 
      .filter(c => c.cmd.startsWith(prefix)) 
      .map(c => ({ type: 'command', ...c })); 
  } 
 
  if (!_slashItems.length) { help.style.display = 'none'; return; } 
  _slashSelectedIdx = Math.min(_slashSelectedIdx, _slashItems.length - 1); 
  help.innerHTML = _slashItems.map(renderSlashItem).join(''); 
  help.style.display = 'block'; 
} 
 
function insertTextAtCaret(text) { 
  const ta = getPostTextarea(); 
  if (!ta) return; 
  const start = ta.selectionStart; 
  const end = ta.selectionEnd; 
  ta.value = ta.value.slice(0, start) + text + ta.value.slice(end); 
  const pos = start + text.length; 
  ta.focus(); 
  ta.setSelectionRange(pos, pos); 
} 

function replaceActiveSlash(text) { 
  const ta = getPostTextarea(); 
  if (!ta) return false; 
  const active = getActiveSlash(ta); 
  if (!active) return false; 
  const end = ta.selectionStart; 
  ta.value = ta.value.slice(0, active.absStart) + text + ta.value.slice(end); 
  const pos = active.absStart + text.length; 
  ta.focus(); 
  ta.setSelectionRange(pos, pos); 
  return true; 
} 

function replaceActiveEmojiName(text) {
  const ta = getPostTextarea();
  if (!ta) return false;
  const active = getActiveEmojiName(ta);
  if (!active) return false;
  const end = ta.selectionStart;
  ta.value = ta.value.slice(0, active.absStart) + text + ta.value.slice(end);
  const pos = active.absStart + text.length;
  ta.focus();
  ta.setSelectionRange(pos, pos);
  return true;
}

function insertSlashCommand(cmd) { 
  if (!replaceActiveSlash(cmd + ' ')) insertTextAtCaret(cmd + ' '); 
  _slashSelectedIdx = 0; 
  if (cmd === '/emoji' || cmd === '/mood') updateSlashHelp(); 
  else document.getElementById('slashHelp').style.display = 'none'; 
} 
window.insertSlashCommand = insertSlashCommand; 

function insertEmoteToken(name) { 
  const token = ':' + name + ': '; 
  if (!replaceActiveSlash(token) && !replaceActiveEmojiName(token)) insertTextAtCaret(token); 
  closeEmojiPicker(); 
  const help = document.getElementById('slashHelp'); 
  if (help) help.style.display = 'none'; 
} 
window.insertEmoteToken = insertEmoteToken; 

function setMoodFromEmote(name) { 
  const txt = document.getElementById('postMoodText'); 
  const sel = document.getElementById('postMoodEmote'); 
  if (txt) txt.value = name; 
  if (sel) sel.value = name; 
  syncMoodIcon(); 
  const active = getActiveSlash(); 
  if (active && active.command === '/mood') replaceActiveSlash(''); 
  const help = document.getElementById('slashHelp'); 
  if (help) help.style.display = 'none'; 
  closeEmojiPicker(); 
} 
window.setMoodFromEmote = setMoodFromEmote; 

function selectSlashSuggestion(i) { 
  const item = _slashItems[i]; 
  if (!item) return; 
  if (item.type === 'command') insertSlashCommand(item.cmd); 
  if (item.type === 'emoji') insertEmoteToken(item.name); 
  if (item.type === 'mood') setMoodFromEmote(item.name); 
} 
window.selectSlashSuggestion = selectSlashSuggestion; 

function buildEmojiPickerHTML() { 
  return `<div class="emoji-grid">${Object.keys(EMOTES).map(name => { 
    const src = EMOTES[name]; 
    return `<div class="emoji-item" onclick="insertEmoteToken('${esc(name)}')"><a href="${esc(src)}" target="_blank" rel="noopener" title="${esc(emoteCategory(name))}" onclick="event.stopPropagation()"><img src="${esc(src)}" alt="${esc(name)}" title="${esc(emoteCategory(name))}"></a><span>${esc(name)}</span><span class="emoji-insert">use</span></div>`; 
  }).join('')}</div>`; 
} 

function toggleEmojiPicker() { 
  const panel = document.getElementById('emojiPickerPanel'); 
  if (!panel) return; 
  if (!panel.innerHTML) panel.innerHTML = buildEmojiPickerHTML(); 
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block'; 
} 
window.toggleEmojiPicker = toggleEmojiPicker; 

function closeEmojiPicker() { 
  const panel = document.getElementById('emojiPickerPanel'); 
  if (panel) panel.style.display = 'none'; 
} 
window.closeEmojiPicker = closeEmojiPicker; 

function syncMoodIcon() { 
  const sel = document.getElementById('postMoodEmote'); 
  const icon = document.getElementById('postMoodIcon'); 
  if (!sel || !icon) return; 
  const name = sel.value; 
  if (name && EMOTES[name]) { 
    icon.src = EMOTES[name]; 
    icon.title = emoteCategory(name); 
    icon.style.display = 'inline-block'; 
  } else { 
    icon.removeAttribute('src'); 
    icon.title = ''; 
    icon.style.display = 'none'; 
  } 
} 
window.syncMoodIcon = syncMoodIcon; 

function bindBlogEditorControls() { 
  const ta = getPostTextarea(); 
  if (ta && !ta.dataset.slashBound) { 
    ta.dataset.slashBound = 'true'; 
    ta.addEventListener('input', handleSlashInput); 
    ta.addEventListener('keydown', handleSlashKeydown); 
  } 
  const sel = document.getElementById('postMoodEmote'); 
  if (sel && !sel.dataset.moodBound) { 
    sel.dataset.moodBound = 'true'; 
    sel.addEventListener('change', syncMoodIcon); 
  } 
  syncMoodIcon(); 
  if (!window._blogEmojiDocBound) { 
    window._blogEmojiDocBound = true; 
    document.addEventListener('click', e => { 
      const panel = document.getElementById('emojiPickerPanel'); 
      const btn = document.getElementById('emojiPickerBtn'); 
      if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) closeEmojiPicker(); 
    }); 
  } 
} 
 
function handleSlashInput(e) { 
  _slashSelectedIdx = 0; 
  updateSlashHelp(); 
} 
 
function handleSlashKeydown(e) { 
  const help = document.getElementById('slashHelp'); 
  if (help && help.style.display === 'block') { 
    if (e.key === 'ArrowDown') { 
      e.preventDefault(); 
      _slashSelectedIdx = (_slashSelectedIdx + 1) % _slashItems.length; 
      updateSlashHelp(); 
    } else if (e.key === 'ArrowUp') { 
      e.preventDefault(); 
      _slashSelectedIdx = (_slashSelectedIdx - 1 + _slashItems.length) % _slashItems.length; 
      updateSlashHelp(); 
    } else if (e.key === 'Enter' || e.key === 'Tab') { 
      e.preventDefault(); 
      selectSlashSuggestion(_slashSelectedIdx); 
    } else if (e.key === 'Escape') { 
      help.style.display = 'none'; 
    } 
  } 
} 
 
function switchAdminTab(tab) {
  ['editor', 'global', 'boards', 'batch'].forEach(t => {
    const el = document.getElementById('admin-tab-' + t);
    if (el) el.style.display = (t === tab) ? 'block' : 'none';
  });
}
window.switchAdminTab = switchAdminTab;

async function saveGlobalSettings() {
  const theme = document.getElementById('admGlobalTheme').value;
  const font = document.getElementById('admGlobalFont').value;
  const author = document.getElementById('admGlobalAuthor').value;
  const banner = document.getElementById('admGlobalBanner').value.trim();
  const safewords = document.getElementById('admGlobalSafewords')?.value || '';
  const showTopSketches = document.getElementById('admGlobalShowTopSketches')?.checked !== false;
  const lockdown = document.getElementById('admGlobalLockdown')?.checked || false;

  try {
    await window._set(window._ref(window._db, 'admin/settings'), { 
      theme, 
      fontFamily: font, 
      defaultAuthor: author,
      banner: banner || (window._globalSettings?.banner || null),
      showTopSketches,
      safewords,
      lockdown
    });
    alert('Settings saved!');
  } catch (e) { alert('Error: ' + e.message); }
}

async function handleGlobalBannerSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const statusEl = document.getElementById('admGlobalBannerStatus');
  if (statusEl) statusEl.textContent = 'uploading...';
  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', 'unsigned_upload');
    const res = await fetch('https://api.cloudinary.com/v1_1/dagsxkazw/image/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.secure_url) throw new Error('upload failed');
    document.getElementById('admGlobalBanner').value = data.secure_url;
    if (statusEl) statusEl.textContent = 'banner ready!';
  } catch (err) {
    if (statusEl) statusEl.textContent = 'upload error: ' + err.message;
  }
}
window.handleGlobalBannerSelect = handleGlobalBannerSelect;
window.saveGlobalSettings = saveGlobalSettings;

let _boardBannerMedia = null;

async function handleBoardBannerSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const statusEl = document.getElementById('boardBannerStatus');
  if (statusEl) statusEl.textContent = 'uploading banner...';
  try {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', 'unsigned_upload');
    const res = await fetch('https://api.cloudinary.com/v1_1/dagsxkazw/image/upload', { method: 'POST', body: fd });
    const data = await res.json();
    if (!data.secure_url) throw new Error('upload failed');
    _boardBannerMedia = data.secure_url;
    if (statusEl) statusEl.textContent = 'banner uploaded!';
    document.getElementById('boardBannerInput').value = data.secure_url;
  } catch (err) {
    if (statusEl) statusEl.textContent = 'upload error: ' + err.message;
  }
}
window.handleBoardBannerSelect = handleBoardBannerSelect;

async function createBoard() {
  const title = document.getElementById('boardTitleInput').value.trim();
  const banner = document.getElementById('boardBannerInput').value.trim() || _boardBannerMedia;
  const id = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!id) return;
  const settings = {
    images: document.getElementById('chkNewImages')?.checked !== false,
    audio: document.getElementById('chkNewAudio')?.checked !== false,
    video: document.getElementById('chkNewVideo')?.checked !== false,
    links: document.getElementById('chkNewLinks')?.checked !== false,
    subject: document.getElementById('chkNewSubject')?.checked !== false,
    badge: document.getElementById('chkNewBadge')?.checked !== false,
    comments: document.getElementById('chkNewComments')?.checked !== false
  };
  try {
    await window._set(window._ref(window._db, 'admin/boards/' + id), { title, banner, settings });
    document.getElementById('boardTitleInput').value = '';
    document.getElementById('boardBannerInput').value = '';
    _boardBannerMedia = null;
    const statusEl = document.getElementById('boardBannerStatus');
    if (statusEl) statusEl.textContent = '';
    alert('Board created!');
  } catch (e) { alert('Error: ' + e.message); }
}
window.createBoard = createBoard;

async function deleteBoard(id, title) {
  const check = prompt(`Type "${title}" and then "i agree" to delete this board:`);
  if (check === `${title} i agree`) {
    try {
      await window._remove(window._ref(window._db, 'admin/boards/' + id));
      alert('Board deleted.');
    } catch (e) { alert('Error: ' + e.message); }
  } else {
    alert('Verification failed.');
  }
}
window.deleteBoard = deleteBoard;

async function applyBatchBadge() {
  const badge = document.getElementById('batchBadgeInput').value.trim();
  if (!badge) return;
  const checked = Array.from(document.querySelectorAll('.batch-check:checked')).map(cb => cb.dataset.id);
  if (!checked.length) return;
  if (!confirm(`Apply badge "${badge}" to ${checked.length} posts?`)) return;
  try {
    for (const id of checked) {
      await window._set(window._ref(window._db, 'blog/posts/' + id + '/badge'), badge);
    }
    alert('Badges applied!');
    filterPosts();
  } catch (e) { alert('Error: ' + e.message); }
}
window.applyBatchBadge = applyBatchBadge;

function injectAdminUI() { 
  const c = document.getElementById('adminContainer'); if (!c) return; 
  const moodOptions = '<option value="" selected>none</option>' + Object.keys(EMOTES).filter(m => emoteCategory(m) === 'mood').map(m => `<option value="${m}">${m}</option>`).join(''); 
  const currentSettings = window._globalSettings || {};
  renderBoardList();
  
  const curS = window.getCurBoardSettings ? window.getCurBoardSettings() : {
    images: true, audio: true, video: true, links: true, subject: true, badge: true, comments: true
  };
  const curBoardId = window.getCurBoardId ? window.getCurBoardId() : 'blog';

  c.innerHTML = ` 
    <div class="content-box admin-panel-box" style="text-align:left;margin-top:4px;"> 
      <div class="content-box-head">admin panel</div> 
      <div class="content-box-body"> 
        <div id="adminLogin" style="font-size:11px; display: ${window._isAdmin ? 'none' : 'block'};"> 
          password: <input type="password" id="pwInput" style="width:120px;font:11px Verdana,sans-serif;border:1px solid #aaaaaa;padding:2px 4px;background:#ffffff;color:#000000;"> 
          <button class="form-btn" onclick="tryLogin()">enter</button> 
          <div id="loginErr" style="color:#cc0000;font-size:10px;margin-top:3px;"></div> 
          <div style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px; text-align: center;">
            <button class="form-btn" onclick="window._googleLogin()" style="font-weight: bold; background: #800000; color: #fff; padding: 4px 10px; border: 1px solid #000; cursor: pointer;">Login with Google</button>
          </div>
        </div> 
        <div id="adminPanel" style="display: ${window._isAdmin ? 'block' : 'none'};"> 
          <div class="admin-status-line">
            logged in 
            <button class="form-btn" onclick="logout()">logout</button> 
            <button class="form-btn" onclick="openSiteSettings()">site settings</button>
          </div> 
          
          <div class="admin-tabs" style="margin-bottom:10px;">
            <button class="admin-tab-btn" onclick="switchAdminTab('editor')">Post Editor</button>
            <button class="admin-tab-btn" onclick="switchAdminTab('batch')">Batch Actions</button>
            <button class="admin-tab-btn" onclick="switchAdminTab('global')">General Settings</button>
            <button class="admin-tab-btn" onclick="switchAdminTab('boards')">Boards</button>
          </div>

          <div id="admin-tab-editor">
            <div class="admin-section" id="editorModeTitle">new post</div> 
            <table class="form-table"> 
            <tr> 
              <td class="form-label">Name</td> 
              <td><input type="text" id="postAuthor" maxlength="42" placeholder="Anonymous" style="width:45%;box-sizing:border-box;"> <span style="font-size:10px;color:var(--color-fg-muted);">blank = Anonymous</span></td> 
            </tr> 
            <tr> 
              <td class="form-label">Subject</td> 
              <td><input type="text" id="postTitle" style="width:100%;box-sizing:border-box;"></td> 
            </tr> 
            <tr> 
              <td class="form-label">Options</td> 
              <td><input type="text" id="postOptions" placeholder="sage / noko / note" style="width:45%;box-sizing:border-box;"> <input type="text" id="postBadge" placeholder="badge" maxlength="18" style="width:24%;box-sizing:border-box;"></td> 
            </tr> 
            <tr> 
              <td class="form-label">Mood</td> 
              <td> 
                <input type="text" id="postMoodText" placeholder="mood name..." style="width:50%;"> 
                <select id="postMoodEmote" style="width:35%;">${moodOptions}</select> 
                <img id="postMoodIcon" alt="" title="" style="display:none;height:18px;vertical-align:middle;margin-left:4px;"> 
              </td> 
            </tr> 
            <tr> 
              <td class="form-label">Content</td> 
              <td style="position:relative;"> 
                <div class="editor-tools"> 
                  <button type="button" id="emojiPickerBtn" class="emoji-picker-btn" title="emoji" onclick="event.stopPropagation(); toggleEmojiPicker();"><img src="${esc(EMOTES.heart)}" alt=""></button> 
                </div> 
                <div id="emojiPickerPanel" class="emoji-picker-panel"></div> 
                <textarea id="postTextarea" rows="5" style="width:100%;font:11px Verdana,sans-serif;border:1px solid #aaaaaa;padding:2px 4px;box-sizing:border-box;resize:vertical;background:#ffffff;color:#000000;"></textarea> 
                <div id="slashHelp" class="slash-suggest"></div> 
              </td> 
            </tr> 
            <tr> 
              <td class="form-label">Files</td> 
              <td> 
                <button class="form-btn" onclick="document.getElementById('edFileInput').click()">choose</button> 
                <span id="edFileName" style="font-size:10px;margin:0 5px;color:#888888;">none</span> 
                <button class="form-btn" id="edRemoveImg" style="display:none;" onclick="removeBlogEditorImg()">remove</button> 
                <input type="file" id="edFileInput" accept="image/*,video/*,audio/*" multiple onchange="handleBlogFileSelect(event)" style="display:none;"> 
                <div id="edImgPreview" style="display:flex; flex-wrap:wrap; gap:5px; margin-top:4px;"></div> 
              </td> 
            </tr> 
            <tr>
              <td class="form-label"><img class="admin-key-icon" src="${esc(POST_ICONS.key)}" alt="Password" title="Password"></td>
              <td>
                <input type="password" id="postLockPassword" placeholder="post password..." style="width:45%;box-sizing:border-box;">
              </td>
            </tr>
            <tr>
              <td class="form-label">Settings</td>
              <td>
                <label style="font-size:10px;"><input type="checkbox" id="edSpoilerImg"> spoiler</label>
                <label style="font-size:10px;margin-left:5px;"><input type="checkbox" id="edLockOriginal"> lock originals?</label>
                <label style="font-size:10px;margin-left:5px;"><input type="checkbox" id="edLockUpdate"> lock updates?</label>
                <label style="font-size:10px;margin-left:5px;"><input type="checkbox" id="edPinned"> pinned</label>
                <label style="font-size:10px;margin-left:5px;"><input type="checkbox" id="edPrivate"> private</label>
              </td>
            </tr>
            <tr> 
              <td class="form-label"></td> 
              <td><button class="form-btn" id="submitBtn" onclick="submitPost()">Post</button> <button class="form-btn" id="cancelEditBtn" style="display:none;" onclick="resetPostEditor()">Cancel</button> <span id="edStatus" style="margin-left:5px;font-size:10px;"></span></td> 
            </tr> 
          </table> 
          </div>

          <div id="admin-tab-batch" style="display:none;">
            <div class="admin-section">batch actions</div>
            <div style="padding:10px;">
              Apply badge to selected: <input type="text" id="batchBadgeInput" placeholder="badge name">
              <button class="form-btn" onclick="applyBatchBadge()">Apply</button>
              <hr>
              <div id="batchPostList" style="max-height:300px; overflow-y:auto; font-size:11px;">
                <!-- list of posts with checkboxes -->
              </div>
            </div>
          </div>

          <div id="admin-tab-global" style="display:none;">
            <div class="admin-section">general site settings</div>
            <table class="form-table">
              <tr>
                <td class="form-label">Default Theme</td>
                <td>
                  <select id="admGlobalTheme">
                    <option value="futaba" ${currentSettings.theme==='futaba'?'selected':''}>Futaba classic</option>
                    <option value="yotsuba-b" ${currentSettings.theme==='yotsuba-b'?'selected':''}>Yotsuba B</option>
                    <option value="tomorrow" ${currentSettings.theme==='tomorrow'?'selected':''}>Tomorrow</option>
                    <option value="midnight-blue" ${currentSettings.theme==='midnight-blue'?'selected':''}>Midnight blue</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td class="form-label">Site Font</td>
                <td>
                  <select id="admGlobalFont">
                    <option value="Arial" ${currentSettings.fontFamily==='Arial'?'selected':''}>Arial</option>
                    <option value="MS Gothic" ${currentSettings.fontFamily==='MS Gothic'?'selected':''}>MS Gothic</option>
                    <option value="Times New Roman" ${currentSettings.fontFamily==='Times New Roman'?'selected':''}>Times New Roman</option>
                  </select>
                </td>
              </tr>
              <tr>
                <td class="form-label">Global Author</td>
                <td><input type="text" id="admGlobalAuthor" value="${esc(currentSettings.defaultAuthor || 'yuri.neet')}"></td>
              </tr>
              <tr>
                <td class="form-label">Main Banner</td>
                <td>
                  <input type="text" id="admGlobalBanner" value="${esc(currentSettings.banner || '')}" placeholder="URL..." style="width: 70%;">
                  <button class="form-btn" onclick="document.getElementById('admGlobalBannerFile').click()">upload</button>
                  <input type="file" id="admGlobalBannerFile" accept="image/*" onchange="handleGlobalBannerSelect(event)" style="display:none;">
                  <div id="admGlobalBannerStatus" style="font-size:10px; color:var(--color-fg-muted);"></div>
                </td>
              </tr>
              <tr>
                <td class="form-label">Show Top Sketches</td>
                <td>
                  <input type="checkbox" id="admGlobalShowTopSketches" ${currentSettings.showTopSketches !== false ? 'checked' : ''}>
                </td>
              </tr>
              <tr>
                <td class="form-label" style="color:red; font-weight:bold;">TOTAL LOCKDOWN</td>
                <td>
                  <input type="checkbox" id="admGlobalLockdown" ${currentSettings.lockdown === true ? 'checked' : ''}>
                  <span style="font-size:10px; color:var(--color-danger);">Tranca todas as páginas com tela preta</span>
                </td>
              </tr>
              <tr>
                <td class="form-label">Safewords</td>
                <td>
                  <textarea id="admGlobalSafewords" placeholder="one, blocked, word, per, line" style="width: 100%; height: 50px; font: 11px Verdana;">${esc(currentSettings.safewords || '')}</textarea>
                </td>
              </tr>
              <tr>
                <td></td>
                <td><button class="form-btn" onclick="saveGlobalSettings()">Save Global Settings</button></td>
              </tr>
            </table>
          </div>

          <div id="admin-tab-boards" style="display:none;">
            <div class="admin-section">board management</div>
            <table class="form-table">
              <tr><td class="form-label">Board Title</td><td><input type="text" id="boardTitleInput"></td></tr>
              <tr>
                <td class="form-label">Banner</td>
                <td>
                  <input type="text" id="boardBannerInput" placeholder="URL..." style="width: 70%;">
                  <button class="form-btn" onclick="document.getElementById('boardBannerFileInput').click()">upload</button>
                  <input type="file" id="boardBannerFileInput" accept="image/*" onchange="handleBoardBannerSelect(event)" style="display:none;">
                  <div id="boardBannerStatus" style="font-size:10px; color:var(--color-fg-muted);"></div>
                </td>
              </tr>
              <tr>
                <td class="form-label">Board Features</td>
                <td>
                  <label><input type="checkbox" id="chkNewImages" checked> images</label>
                  <label><input type="checkbox" id="chkNewAudio" checked> audio</label>
                  <label><input type="checkbox" id="chkNewVideo" checked> video</label>
                  <label><input type="checkbox" id="chkNewLinks" checked> links</label>
                  <label><input type="checkbox" id="chkNewSubject" checked> subject</label>
                  <label><input type="checkbox" id="chkNewBadge" checked> badge</label>
                  <label><input type="checkbox" id="chkNewComments" checked> comments</label>
                </td>
              </tr>
              <tr><td></td><td><button class="form-btn" onclick="createBoard()">Create Board</button></td></tr>
            </table>
            <hr>
            <div class="admin-section">Current Board Settings (/${esc(curBoardId)})</div>
            <table class="form-table">
              <tr>
                <td class="form-label">Features</td>
                <td>
                  <label><input type="checkbox" id="chkCurImages" ${curS.images !== false ? 'checked' : ''}> images</label>
                  <label><input type="checkbox" id="chkCurAudio" ${curS.audio !== false ? 'checked' : ''}> audio</label>
                  <label><input type="checkbox" id="chkCurVideo" ${curS.video !== false ? 'checked' : ''}> video</label>
                  <label><input type="checkbox" id="chkCurLinks" ${curS.links !== false ? 'checked' : ''}> links</label>
                  <label><input type="checkbox" id="chkCurSubject" ${curS.subject !== false ? 'checked' : ''}> subject</label>
                  <label><input type="checkbox" id="chkCurBadge" ${curS.badge !== false ? 'checked' : ''}> badge</label>
                  <label><input type="checkbox" id="chkCurComments" ${curS.comments !== false ? 'checked' : ''}> comments</label>
                </td>
              </tr>
              <tr><td></td><td><button class="form-btn" onclick="saveCurBoardSettings()">Save Board Settings</button></td></tr>
            </table>
            <hr>
            <div id="adminBoardList" style="font-size:11px; padding:10px;">
              <!-- boards list with delete -->
            </div>
          </div>

        </div> 
      </div> 
    </div>`; 
  const authorInput = document.getElementById('postAuthor');
  if (authorInput && !authorInput.value) authorInput.value = window.getSiteSetting?.('defaultName') || '';
  bindBlogEditorControls(); 
  if (window.updateEditorFields) window.updateEditorFields();
} 
window.injectAdminUI = injectAdminUI; 
 
window._curGalTab = 'sketches'; 
const GAL_PER_PAGE = 8; 
const galPage = { sketches: 0, pictures: 0 }; 
let galSort = 'newest'; 
 
function galData(tab) { 
  const staticItems = (window.YURINEET_GALLERY && window.YURINEET_GALLERY[tab]) || []; 
  if (tab === 'sketches') { if (window._fbSketches !== null) return [...window._fbSketches, ...staticItems]; return staticItems; } 
  if (window._fbPictures !== null) return window._fbPictures; 
  return (window.YURINEET_GALLERY && window.YURINEET_GALLERY.pictures) || []; 
} 
 
function galSorted(tab) { 
  const base = galData(tab).map((item, i) => ({ ...item, _i: i })); 
  return galSort === 'oldest' ? [...base].reverse() : base; 
} 
 
function renderGalleryTab(tab) { 
  const gridId = tab === 'pictures' ? 'picGrid' : 'sketchGrid', pagerId = tab === 'pictures' ? 'picPager' : 'sketchPager'; 
  const grid = document.getElementById(gridId), pager = document.getElementById(pagerId); 
  if (!grid || !pager) return; 
  const all = galSorted(tab), total = all.length, start = galPage[tab] * GAL_PER_PAGE, page = all.slice(start, start + GAL_PER_PAGE), totalPages = Math.max(1, Math.ceil(total / GAL_PER_PAGE)); 
  if (!total) { grid.innerHTML = '<li style="font-size:11px;color:#888888;padding:5px 0;font-style:italic;">nothing here yet.</li>'; pager.innerHTML = ''; return; } 
  const chanDate = item => { 
    if (item.ts) { 
      const d = new Date(Number(item.ts)); 
      const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; 
      const p = n => String(n).padStart(2, '0'); 
      return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${String(d.getFullYear()).slice(-2)}(${DAY[d.getDay()]})${p(d.getHours())}:${p(d.getMinutes())}`; 
    } 
    return item.date || ''; 
  }; 
  grid.innerHTML = ''; 
  page.forEach((item, pi) => { 
    const num = total - (start + pi); 
    const src = item.imageSrc || (tab === 'pictures' ? '../images/pictures/' : '../images/sketches/') + item.file; 
    const delBtn = window._isAdmin ? `<button class="gallery-del" onclick="deleteGalItem('${tab}','${esc(item._fbId || '')}')">delete</button>` : ''; 
    
    const isSketchesTab = tab === 'sketches';
    const upvotesCount = item.upvotes || 0;
    const voteBtn = isSketchesTab ? ` &nbsp; <button class="form-btn" onclick="voteSketch('${esc(item._fbId || '')}', 'up')" style="padding: 1px 4px; font-size: 10px; cursor: pointer;">▲ Upvote (${upvotesCount})</button>` : '';
    
    const li = document.createElement('li'); 
    li.className = 'gallery-item'; 
    li.innerHTML = `<a href="${esc(src)}" target="_blank" rel="noopener" style="display:block;flex-shrink:0;"><img class="gallery-thumb" src="${esc(src)}" alt="${esc(item.title || '')}" loading="lazy"></a><div class="gallery-info"><div class="gallery-title">${esc(item.title || 'untitled')}</div><div class="gallery-desc">${esc(item.description || '')}</div><div class="gallery-meta">${esc(chanDate(item))} &nbsp; No.${num}${voteBtn}</div>${delBtn}</div>`; 
    grid.appendChild(li); 
  }); 
  pager.innerHTML = 'page: '; 
  for (let i = 0; i < totalPages; i++) { 
    const a = document.createElement('a'); 
    a.href = '#'; a.textContent = i + 1; 
    if (i === galPage[tab]) a.className = 'active'; 
    a.onclick = (e => { e.preventDefault(); galPage[tab] = i; renderGalleryTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); }); 
    pager.appendChild(a); 
  } 
} 
window.renderGalleryTab = renderGalleryTab; 
 
function switchGalleryTab(tab) { 
  window._curGalTab = tab; 
  document.getElementById('gal-sketches').style.display = tab === 'sketches' ? '' : 'none'; 
  document.getElementById('gal-pictures').style.display = tab === 'pictures' ? '' : 'none'; 
  document.getElementById('gtab-sketches').className = tab === 'sketches' ? 'active' : ''; 
  document.getElementById('gtab-pictures').className = tab === 'pictures' ? 'active' : ''; 
  renderGalleryTab(tab); 
} 
window.switchGalleryTab = switchGalleryTab; 
 
function galFilterSort() { 
  galSort = document.getElementById('galSortSelect')?.value || 'newest'; 
  galPage.sketches = 0; galPage.pictures = 0; 
  renderGalleryTab(window._curGalTab || 'sketches'); 
} 
window.galFilterSort = galFilterSort; 
 
async function deleteGalItem(section, fbId) { 
  if (!window._isAdmin || !fbId) return; 
  if (!confirm('delete?')) return; 
  try { await window._remove(window._ref(window._db, 'gallery/' + section + '/' + fbId)); } 
  catch (e) { alert('error: ' + e.message); } 
} 
window.deleteGalItem = deleteGalItem; 
 
function injectGalAdminUI() { 
  const c = document.getElementById('galAdminContainer'); if (!c) return; 
  c.innerHTML = `<div class="content-box" style="margin-top:4px;"><div class="content-box-head">Gallery Admin</div><div class="content-box-body"><div id="galAdminLogin" style="font-size:11px;">password: <input type="password" id="galPwInput" style="width:120px;font:11px Verdana,sans-serif;border:1px solid #aaaaaa;padding:2px 4px;background:#ffffff;color:#000000;"> <button class="form-btn" onclick="galTryLogin()">enter</button><div id="galLoginErr" style="color:#cc0000;font-size:10px;margin-top:3px;"></div></div><div id="galAdminPanel" style="display:none;"><div style="font-size:10px;color:#888888;margin-bottom:5px;">logged in &mdash; <button class="form-btn" onclick="galLogout()">logout</button></div><div class="admin-section">add image</div><table class="form-table"><tr><td class="form-label">Section</td><td><select id="galSection" style="font:11px Verdana,sans-serif;border:1px solid #aaaaaa;"><option value="sketches">sketches</option><option value="pictures">pictures</option></select></td></tr><tr><td class="form-label">Title</td><td><input type="text" id="galTitle"></td></tr><tr><td class="form-label">Desc</td><td><input type="text" id="galDesc"></td></tr><tr><td class="form-label">File</td><td><button class="form-btn" onclick="document.getElementById('galFileInput').click()">choose</button> <span id="galFileName" style="font-size:10px;margin:0 5px;color:#888888;">none</span><input type="file" id="galFileInput" accept="image/jpeg,image/png,image/gif,image/webp" onchange="galHandleFile(event)" style="display:none;"><div id="galImgPreview" style="display:none;margin-top:4px;"></div></td></tr><tr><td class="form-label"></td><td><button class="form-btn" id="galSubmitBtn" onclick="galSubmit()">Add</button> <span id="galStatus" style="margin-left:5px;font-size:10px;"></span></td></tr></table></div></div></div>`; 
} 
window.injectGalAdminUI = injectGalAdminUI; 
 
async function galTryLogin() { 
  const pw = document.getElementById('galPwInput')?.value || ''; 
  const errEl = document.getElementById('galLoginErr'); 
  if (!pw) { if (errEl) errEl.textContent = 'enter password.'; return; } 
  if (errEl) errEl.textContent = 'checking...'; 
  let waited = 0; 
  while ((!window._sha256 || !window._get || !window._ref || !window._db) && waited < 8000) { 
    await new Promise(r => setTimeout(r, 120)); waited += 120; 
  } 
  if (!window._sha256 || !window._get || !window._ref || !window._db) { if (errEl) errEl.textContent = 'firebase not ready.'; return; } 
  try { 
    const hash = await window._sha256(pw); 
    const snap = await window._get(window._ref(window._db, 'admin/passHash')); 
    if (snap.val() === hash) { 
      window._isAdmin = true; 
      sessionStorage.setItem('yurineet_isAdmin', 'true');
      await touchAdminLastOnline(); 
      document.getElementById('galAdminLogin').style.display = 'none'; 
      document.getElementById('galAdminPanel').style.display = 'block'; 
      if (errEl) errEl.textContent = ''; 
      if (window.chanReadSettings) window.applySettings(window.chanReadSettings());
      renderGalleryTab(window._curGalTab || 'sketches'); 
    } else { if (errEl) errEl.textContent = 'wrong password.'; } 
  } catch (e) { if (errEl) errEl.textContent = 'error: ' + e.message; } 
} 
window.galTryLogin = galTryLogin; 
 
function galLogout() { 
  window._isAdmin = false; 
  sessionStorage.removeItem('yurineet_isAdmin');
  document.getElementById('galAdminLogin').style.display = 'block'; 
  document.getElementById('galAdminPanel').style.display = 'none'; 
  renderGalleryTab(window._curGalTab || 'sketches'); 
} 
window.galLogout = galLogout; 
 
let _galImgUrl = null, _galImgInfo = null; 
 
async function galHandleFile(event) { 
  const file = event.target.files[0]; event.target.value = ''; 
  if (!file) return; 
  if (file.size > 600 * 1024) { alert('max 600 KB'); return; } 
  const statusEl = document.getElementById('galStatus'); 
  if (statusEl) statusEl.textContent = 'uploading...'; 
  const tmpUrl = URL.createObjectURL(file); const tmpImg = new Image(); tmpImg.src = tmpUrl; 
  await new Promise(res => { tmpImg.onload = tmpImg.onerror = res; }); 
  const w = tmpImg.naturalWidth, h = tmpImg.naturalHeight; URL.revokeObjectURL(tmpUrl); 
  const sizeKB = (file.size / 1024).toFixed(1); 
  try { 
    const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', 'unsigned_upload'); 
    const res = await fetch('https://api.cloudinary.com/v1_1/dagsxkazw/image/upload', { method: 'POST', body: fd }); 
    const data = await res.json(); 
    if (!data.secure_url) throw new Error('upload failed'); 
    _galImgUrl = data.secure_url; _galImgInfo = { name: file.name, sizeKB, w, h }; 
    document.getElementById('galFileName').textContent = file.name; 
    const pv = document.getElementById('galImgPreview'); 
    pv.style.display = 'block'; 
    pv.innerHTML = `<img src="${esc(data.secure_url)}" alt="" style="max-width:90px;max-height:75px;border:1px solid #aaaaaa;">`; 
    if (statusEl) statusEl.textContent = 'image ready.'; 
  } catch (err) { if (statusEl) statusEl.textContent = 'upload error: ' + err.message; } 
} 
window.galHandleFile = galHandleFile; 
 
async function galSubmit() { 
  if (!window._isAdmin) return; 
  const btn = document.getElementById('galSubmitBtn'), status = document.getElementById('galStatus'), 
    section = document.getElementById('galSection')?.value || 'sketches', 
    title = (document.getElementById('galTitle')?.value || '').trim(); 
  if (!_galImgUrl) { if (status) status.textContent = 'choose an image first.'; return; } 
  btn.disabled = true; if (status) status.textContent = 'saving...'; 
  try { 
    await window._push(window._ref(window._db, 'gallery/' + section), { 
      media: [{ url: _galImgUrl, info: _galImgInfo || null, type: 'image' }], 
      title: title || (section === 'pictures' ? 'photo' : 'sketch'), 
      contentRaw: (document.getElementById('galDesc')?.value || '').trim(), 
      author: 'yuri.neet', 
      ts: (typeof window._serverTimestamp === 'function' ? window._serverTimestamp() : Date.now()) 
    }); 
    document.getElementById('galTitle').value = ''; 
    document.getElementById('galDesc').value = ''; 
    _galImgUrl = null; _galImgInfo = null; 
    document.getElementById('galFileName').textContent = 'none'; 
    const pv = document.getElementById('galImgPreview'); pv.style.display = 'none'; pv.innerHTML = ''; 
    if (status) { status.textContent = 'added!'; setTimeout(() => { status.textContent = ''; }, 3000); } 
  } catch (e) { if (status) status.textContent = 'error: ' + e.message; btn.disabled = false; return; } 
  btn.disabled = false; 
} 
window.galSubmit = galSubmit; 
 
if (new URLSearchParams(window.location.search).has('admin')) { 
  if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', () => { injectAdminUI(); injectGalAdminUI(); }); 
  } else { 
    injectAdminUI(); injectGalAdminUI(); 
  } 
} 
 
// ── CONTACT ── 
const CT_SERVICE_ID = 'service_ina2cb8', CT_TEMPLATE_ID = 'template_g7owumb', 
  CLOUD_NAME = 'dagsxkazw', UPLOAD_PRESET = 'unsigned_upload'; 
const ctEditor = document.getElementById('msgEditor'); 
let ctSuppressedEmbeds = new Set(); 
 
function ctGetTime() { 
  const d = new Date(); 
  const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; 
  const p = n => String(n).padStart(2, '0'); 
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${String(d.getFullYear()).slice(-2)}(${DAY[d.getDay()]})${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`; 
} 
 
const CT_EPATS = [ 
  { name: 'youtube', re: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?[^\s"<]*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/g, build: m => ({ src: 'https://www.youtube.com/embed/' + m[1] + '?rel=0', url: m[0], id: m[1] }) }, 
  { name: 'spotify', re: /https?:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist|episode)\/([a-zA-Z0-9]+)(?:[?&][^\s"<]*)?/g, build: m => ({ src: 'https://open.spotify.com/embed/' + m[1] + '/' + m[2] + '?utm_source=generator&theme=0', url: m[0] }) }, 
  { name: 'soundcloud', re: /https?:\/\/(?:www\.)?soundcloud\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+(?:[?&][^\s"<]*)?/g, build: m => ({ src: 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(m[0]) + '&color=%23ff5500&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false', url: m[0] }) } 
]; 
 
function ctDetectEmbeds(text) { 
  const found = []; 
  for (const p of CT_EPATS) { 
    p.re.lastIndex = 0; let m; 
    while ((m = p.re.exec(text)) !== null) { 
      const b = p.build(m); b.name = p.name; 
      if (!found.some(e => e.url === b.url)) found.push(b); 
    } 
  } 
  return found; 
} 
 
function ctUpdatePreview() { 
  const pm = document.getElementById('ctPreviewMsg'), pt = document.getElementById('ctPreviewTime'); 
  if (pt) pt.textContent = ctGetTime(); 
  if (!pm) return; 
  const rawText = (ctEditor?.innerText || '').replace(/\u200B/g, '').trim(); 
  const hasImg = !!ctEditor?.querySelector('img'); 
  if (!rawText && !hasImg) { pm.innerHTML = '<span style="color:#aaaaaa;">your message will appear here...</span>'; return; } 
  const clone = ctEditor.cloneNode(true); 
  clone.querySelectorAll('img').forEach(img => { 
    img.style.cssText = 'max-width:100%;max-height:180px;object-fit:contain;display:block;margin:3px 0;border:1px solid #aaaaaa;float:none;'; 
  }); 
  clone.querySelectorAll('[contenteditable=false]').forEach(el => { 
    el.style.cssText = 'font:10px monospace;color:#888888;margin:0 0 2px;display:block;'; 
  }); 
  pm.innerHTML = clone.innerHTML; 
} 
 
if (ctEditor) { 
  ctEditor.addEventListener('input', () => { ctHighlightLinks(); ctUpdatePreview(); }); 
  ctEditor.addEventListener('paste', e => { e.preventDefault(); const text = e.clipboardData.getData('text/plain'); document.execCommand('insertText', false, text); }); 
} 
 
function ctHighlightLinks() { 
  const linkInput = document.getElementById('linkInput'), dd = document.getElementById('linkDropdown'); 
  if (!linkInput || !dd) return; 
  const rawText = (ctEditor?.innerText || '').replace(/\u200B/g, '').trim(); 
  const allText = rawText + '\n' + (linkInput.value || ''); 
  const embeds = ctDetectEmbeds(allText).filter(e => !ctSuppressedEmbeds.has(e.url)); 
  if (embeds.length) { 
    dd.style.display = 'block'; 
    dd.innerHTML = embeds.map(e => `<div>${esc(e.url)}</div>`).join(''); 
    document.getElementById('ctRemoveEmbedBtn').style.display = 'inline-block'; 
  } else { 
    dd.style.display = 'none'; dd.innerHTML = ''; 
    document.getElementById('ctRemoveEmbedBtn').style.display = 'none'; 
  } 
} 
 
document.getElementById('linkInput')?.addEventListener('input', () => { ctHighlightLinks(); ctUpdatePreview(); }); 
 
async function ctUploadCloudinary(file) { 
  const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', UPLOAD_PRESET); 
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: fd }); 
  const data = await res.json(); 
  if (!data.secure_url) throw new Error('upload failed'); 
  return data.secure_url; 
} 
 
async function ctInsertImage(event) { 
  const file = event.target.files[0]; event.target.value = ''; 
  if (!file) return; 
  if (file.size > 400 * 1024) { document.getElementById('ctStatus').textContent = 'max 400 KB'; return; } 
  const status = document.getElementById('ctStatus'); 
  status.textContent = 'uploading...'; status.className = ''; 
  const tmpURL = URL.createObjectURL(file); const tmpImg = new Image(); tmpImg.src = tmpURL; 
  await new Promise(r => { tmpImg.onload = r; tmpImg.onerror = r; }); 
  const w = tmpImg.naturalWidth, h = tmpImg.naturalHeight; URL.revokeObjectURL(tmpURL); 
  const sizeKB = (file.size / 1024).toFixed(1); 
  const existingText = (ctEditor?.innerText || '').replace(/\u200B/g, '').trim(); 
  try { 
    const imgUrl = await ctUploadCloudinary(file); 
    const specs = document.createElement('div'); 
    specs.contentEditable = 'false'; 
    specs.style.cssText = 'font:10px monospace;color:#888888;margin:0 0 2px;display:block;'; 
    specs.textContent = `File: ${file.name} (${sizeKB} KB, ${w}x${h})`; 
    const img = document.createElement('img'); 
    img.src = imgUrl; 
    img.style.cssText = 'display:block;max-width:100%;max-height:180px;object-fit:contain;margin:0 0 4px 0;border:1px solid #aaaaaa;'; 
    const textNode = document.createTextNode(existingText || '\u200B'); 
    ctEditor.innerHTML = ''; 
    ctEditor.appendChild(specs); 
    ctEditor.appendChild(img); 
    ctEditor.appendChild(textNode); 
    ctEditor.focus(); 
    const range = document.createRange(); 
    range.setStart(textNode, textNode.length); range.collapse(true); 
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); 
    document.getElementById('ctFileName').textContent = file.name; 
    document.getElementById('ctRemoveBtn').style.display = 'inline-block'; 
    status.textContent = 'uploaded!'; status.className = 'status-ok'; 
  } catch (err) { status.textContent = 'upload failed.'; status.className = 'status-err'; } 
  ctHighlightLinks(); ctUpdatePreview(); 
} 
window.ctInsertImage = ctInsertImage; 
 
function ctRemoveAttachment() { 
  ctEditor?.querySelectorAll('img').forEach(el => el.remove()); 
  ctEditor?.querySelectorAll('[contenteditable=false]').forEach(el => el.remove()); 
  document.getElementById('ctFileName').textContent = 'no file'; 
  document.getElementById('ctRemoveBtn').style.display = 'none'; 
  const s = document.getElementById('ctStatus'); if (s) { s.textContent = ''; s.className = ''; } 
  ctHighlightLinks(); ctUpdatePreview(); ctEditor?.focus(); 
} 
window.ctRemoveAttachment = ctRemoveAttachment; 
 
function ctRemoveEmbeds() { 
  const text = (ctEditor?.innerText || '').replace(/\u200B/g, '').trim(); 
  ctDetectEmbeds(text).forEach(e => ctSuppressedEmbeds.add(e.url)); 
  document.getElementById('ctRemoveEmbedBtn').style.display = 'none'; 
  ctUpdatePreview(); ctEditor?.focus(); 
} 
window.ctRemoveEmbeds = ctRemoveEmbeds; 
 
async function ctSendMsg() { 
  const rawText = (ctEditor?.innerText || '').replace(/\u200B/g, '').trim(); 
  const hasImg = !!ctEditor?.querySelector('img'); 
  const status = document.getElementById('ctStatus'), btn = document.getElementById('ctSendBtn'); 
  if (!rawText && !hasImg) { status.textContent = 'write something first.'; status.className = 'status-err'; return; } 
  if (btn.disabled) return; btn.disabled = true; status.className = ''; status.textContent = 'sending...'; 
  const timeStr = ctGetTime(); 
  const tmp = document.createElement('div'); tmp.innerHTML = ctEditor.innerHTML.replace(/\u200B/g, ''); 
  const img = tmp.querySelector('img'); const specs = tmp.querySelector('[contenteditable=false]'); 
  const rawTextClean = tmp.innerText || ''; 
  const embeds = ctDetectEmbeds(rawTextClean + '\n' + (document.getElementById('linkInput')?.value || '')); 
  const embedsHTML = embeds.map(e => { 
    if (e.name === 'youtube') return `<div style="margin:8px 0;"><a href="${e.url}" target="_blank"><img src="https://img.youtube.com/vi/${e.id}/hqdefault.jpg" style="max-width:300px;display:block;border:1px solid #000;"></a></div>`; 
    if (e.name === 'spotify') return `<div style="margin:8px 0;"><a href="${e.url}" target="_blank">▶ Open on Spotify</a></div>`; 
    if (e.name === 'soundcloud') return `<div style="margin:8px 0;"><a href="${e.url}" target="_blank">▶ Open on SoundCloud</a></div>`; 
    return ''; 
  }).join(''); 
  const specsHTML = specs ? `<div style="font:10px monospace;color:#111;margin:0 0 3px;">${esc(specs.textContent)}</div>` : ''; 
  if (specs) specs.remove(); if (img) img.remove(); 
  const textHTML = tmp.innerHTML.trim(); 
  let bodyHTML; 
  if (img) { 
    bodyHTML = `${specsHTML}<img src="${esc(img.src)}" style="max-width:300px;display:block;border:1px solid #000;margin-bottom:6px;"><div style="font-size:12px;line-height:1.5;">${textHTML || ''}</div>`; 
  } else { bodyHTML = tmp.innerHTML; } 
  const finalHTML = bodyHTML + embedsHTML; 
  try { 
    await emailjs.send(CT_SERVICE_ID, CT_TEMPLATE_ID, { 
      name: 'Anonymous', from_email: 'anonymous@noreply.com', 
      subject: 'anonymous message - watanagashi archive', 
      message: rawText, message_html: finalHTML, time: timeStr 
    }); 
    status.textContent = 'sent!'; status.className = 'status-ok'; 
    ctEditor.innerHTML = ''; 
    document.getElementById('ctPreviewMsg').innerHTML = '<span style="color:#aaaaaa;">your message will appear here...</span>'; 
    document.getElementById('ctFileName').textContent = 'no file'; 
    document.getElementById('ctRemoveBtn').style.display = 'none'; 
    document.getElementById('ctRemoveEmbedBtn').style.display = 'none'; 
    ctSuppressedEmbeds.clear(); 
  } catch (err) { status.textContent = 'failed - trenchgun1337@gmail.com'; status.className = 'status-err'; } 
  btn.disabled = false; 
} 
window.ctSendMsg = ctSendMsg; 
 
ctUpdatePreview();

// ── CUSTOM FUNCTIONS AND DYNAMIC BOARD/COMMENT UTILITIES ──

function getCurBoardId() {
  const urlParams = new URLSearchParams(window.location.search);
  let boardId = urlParams.get('board');
  if (!boardId) {
    if (window.location.pathname.endsWith('sketches.html')) boardId = 'sketches';
    else if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) boardId = 'home';
    else boardId = 'blog';
  }
  return boardId;
}
window.getCurBoardId = getCurBoardId;

function getCurBoardSettings() {
  const boardId = getCurBoardId();
  const boards = window._boards || {};
  const boardMeta = boards[boardId] || {};
  return boardMeta.settings || {
    images: true,
    audio: true,
    video: true,
    links: true,
    subject: true,
    badge: true,
    comments: true
  };
}
window.getCurBoardSettings = getCurBoardSettings;

async function saveCurBoardSettings() {
  const boardId = getCurBoardId();
  const settings = {
    images: document.getElementById('chkCurImages').checked,
    audio: document.getElementById('chkCurAudio').checked,
    video: document.getElementById('chkCurVideo').checked,
    links: document.getElementById('chkCurLinks').checked,
    subject: document.getElementById('chkCurSubject').checked,
    badge: document.getElementById('chkCurBadge').checked,
    comments: document.getElementById('chkCurComments').checked
  };
  try {
    await window._set(window._ref(window._db, `admin/boards/${boardId}/settings`), settings);
    alert('Board settings updated in real time!');
    updateEditorFields();
    filterPosts();
  } catch (e) {
    alert('Error updating board settings: ' + e.message);
  }
}
window.saveCurBoardSettings = saveCurBoardSettings;

async function saveGlobalSettings() {
  const theme = document.getElementById('admGlobalTheme').value;
  const font = document.getElementById('admGlobalFont').value;
  const author = document.getElementById('admGlobalAuthor').value;
  const banner = document.getElementById('admGlobalBanner').value.trim();
  const safewords = document.getElementById('admGlobalSafewords')?.value || '';
  const showTopSketches = document.getElementById('admGlobalShowTopSketches')?.checked !== false;
  const lockdown = document.getElementById('admGlobalLockdown')?.checked || false;

  try {
    await window._set(window._ref(window._db, 'admin/settings'), { 
      theme, 
      fontFamily: font, 
      defaultAuthor: author,
      banner: banner || (window._globalSettings?.banner || null),
      showTopSketches,
      safewords,
      lockdown
    });
    alert('Settings saved!');
  } catch (e) { alert('Error: ' + e.message); }
}
window.saveGlobalSettings = saveGlobalSettings;

function updateEditorFields() {
  const s = getCurBoardSettings();
  
  const badgeRow = document.getElementById('postBadge')?.closest('tr');
  if (badgeRow) badgeRow.style.display = s.badge ? '' : 'none';
  
  const subjectRow = document.getElementById('postTitle')?.closest('tr');
  if (subjectRow) subjectRow.style.display = s.subject ? '' : 'none';
  
  const filesRow = document.getElementById('edFileInput')?.closest('tr');
  if (filesRow) {
    if (!s.images && !s.audio && !s.video) {
      filesRow.style.display = 'none';
    } else {
      filesRow.style.display = '';
      const acceptParts = [];
      if (s.images) acceptParts.push('image/*');
      if (s.audio) acceptParts.push('audio/*');
      if (s.video) acceptParts.push('video/*');
      document.getElementById('edFileInput').setAttribute('accept', acceptParts.join(','));
    }
  }
}
window.updateEditorFields = updateEditorFields;

async function movePost(id) {
  if (!window._isAdmin || !id) return;
  const p = findPostById(id);
  if (!p) {
    alert('Post not found.');
    return;
  }
  
  const boardIds = Object.keys(window._boards || {});
  const availableBoards = ['blog', 'sketches', 'home', ...boardIds];
  
  const targetBoard = prompt(`Enter the board ID to move this post to.\nAvailable: ${availableBoards.join(', ')}`);
  if (!targetBoard) return;
  
  const target = targetBoard.trim().toLowerCase();
  if (!availableBoards.includes(target)) {
    alert('Invalid board ID. Move cancelled.');
    return;
  }
  
  const sourcePath = getBoardPath();
  let targetPath = '';
  if (target === 'blog') targetPath = 'blog/posts';
  else if (target === 'sketches') targetPath = 'gallery/sketches';
  else if (target === 'home') targetPath = 'home/posts';
  else targetPath = `boards/${target}/posts`;
  
  if (sourcePath === targetPath) {
    alert('Post is already on that board.');
    return;
  }
  
  try {
    const postData = { ...p };
    delete postData.id;
    
    await window._push(window._ref(window._db, targetPath), postData);
    await window._remove(window._ref(window._db, sourcePath + '/' + id));
    
    alert(`Successfully moved post to /${target}/!`);
  } catch (e) {
    alert('Error moving post: ' + e.message);
  }
}
window.movePost = movePost;

async function voteSketch(id, type) {
  if (!id) return;
  const path = `gallery/sketches/${id}/${type === 'up' ? 'upvotes' : 'downvotes'}`;
  const ref = window._ref(window._db, path);
  try {
    const snap = await window._get(ref);
    const val = (snap.val() || 0) + 1;
    await window._set(ref, val);
  } catch (e) {
    console.error('Error voting: ', e);
  }
}
window.voteSketch = voteSketch;

function initTopSketchesSidebar() {
  const isSketchesPage = window.location.pathname.endsWith('sketches.html');
  const isGalleryPage = window.location.pathname.endsWith('gallery.html');
  if (!isSketchesPage && !isGalleryPage) return;

  let sidebar = document.getElementById('topSketchesSidebar');
  if (!sidebar) {
    sidebar = document.createElement('div');
    sidebar.id = 'topSketchesSidebar';
    sidebar.className = 'top-sketches-box';
    
    const style = document.createElement('style');
    style.textContent = `
      .top-sketches-box {
        position: fixed;
        right: 15px;
        top: 120px;
        width: 220px;
        background: transparent;
        font-family: Arial, sans-serif;
        z-index: 1000;
        text-align: left;
      }
      .top-sketches-head {
        font-weight: bold;
        font-size: 14px;
        margin-bottom: 6px;
        color: #800000;
      }
      .top-sketches-body {
        font-size: 12px;
        color: #000000;
      }
      .top-sketch-item {
        margin-bottom: 4px;
      }
      .top-sketch-links a {
        font-weight: bold;
        text-decoration: underline;
        cursor: pointer;
        color: #800000;
      }
      @media (max-width: 768px) {
        .top-sketches-box {
          position: static;
          width: 100%;
          margin-top: 15px;
          margin-bottom: 15px;
        }
      }
    `;
    document.head.appendChild(style);
    
    sidebar.innerHTML = `
      <div class="top-sketches-head">top sketches</div>
      <div id="topSketchesList" class="top-sketches-body">no sketches yet.</div>
    `;
    document.body.appendChild(sidebar);
  }
  
  sidebar.style.display = window._globalSettings?.showTopSketches === false ? 'none' : 'block';
  updateTopSketchesSidebar();
}
window.initTopSketchesSidebar = initTopSketchesSidebar;

function updateTopSketchesSidebar() {
  const listEl = document.getElementById('topSketchesList');
  if (!listEl) return;
  
  const staticItems = (window.YURINEET_GALLERY && window.YURINEET_GALLERY.sketches) || []; 
  const sketches = (window._fbSketches !== null) ? [...window._fbSketches, ...staticItems] : staticItems;
  
  if (!sketches.length) {
    listEl.innerHTML = 'no sketches yet.';
    return;
  }
  
  const sorted = [...sketches].sort((a, b) => {
    const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
    const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
    return scoreB - scoreA;
  });
  
  const topSketches = sorted.slice(0, 3);
  
  let html = '';
  topSketches.forEach((sketch, index) => {
    const score = (sketch.upvotes || 0) - (sketch.downvotes || 0);
    const title = sketch.title || 'untitled';
    const id = sketch._fbId || sketch.id || `static-${index}`;
    const num = index + 1;
    
    html += `
      <div class="top-sketch-item">
        ${num}. <a onclick="scrollInstantToSketch('${esc(id)}')" style="cursor: pointer; text-decoration: underline; color: #800000; font-weight: bold;">[${num}]</a> ${esc(title)} (score: ${score})
      </div>
    `;
  });
  listEl.innerHTML = html;
}
window.updateTopSketchesSidebar = updateTopSketchesSidebar;

function scrollInstantToSketch(id) {
  let el = document.getElementById('post-' + id) || document.getElementById('sketch-' + id);
  if (!el) {
    const elements = Array.from(document.querySelectorAll('.gallery-item'));
    for (const item of elements) {
      if (item.innerHTML.includes(id)) {
        el = item;
        break;
      }
    }
  }
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.style.outline = '2px solid #800000';
    setTimeout(() => { el.style.outline = 'none'; }, 2000);
  } else {
    alert("Sketch not found on this page!");
  }
}
window.scrollInstantToSketch = scrollInstantToSketch;

// ── ANONYMOUS CHAT COMMENT SYSTEM ──

function buildCommentsSectionHTML(p) {
  const postId = p.id;
  return `
    <div class="comments-section" id="comments-sec-${esc(postId)}" style="margin-top: 8px; border: 1px solid #cccccc; background: var(--color-bg-alt, #fafafa); padding: 6px;">
      <div class="comments-header" onclick="toggleCommentsSection('${esc(postId)}')" style="cursor: pointer; user-select: none; font-size: 11px; font-weight: bold; color: #800000;">
        <span class="comments-toggle-btn">[comments] <span id="comments-btn-icon-${esc(postId)}">[+]</span></span>
      </div>
      <div id="comments-body-${esc(postId)}" class="comments-body" style="display: none; margin-top: 6px; padding-left: 10px; text-align: left;">
        <div id="comments-list-${esc(postId)}" class="comments-list" style="margin-bottom: 8px; max-height: 250px; overflow-y: auto;">loading comments...</div>
        <div class="comment-form-wrap" style="margin-top: 10px; border-top: 1px dashed #cccccc; padding-top: 6px;">
          <textarea id="comment-input-${esc(postId)}" placeholder="Add an anonymous comment... (Max 1000 chars, no URLs)" maxlength="1000" style="width: 100%; font: 11px Verdana; box-sizing: border-box; resize: vertical; background: #fff; color: #000; height: 50px;"></textarea>
          <div style="margin-top: 4px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 10px; color: #666;">Be civil. Everything is text.</span>
            <button class="form-btn" onclick="submitAnonymousComment('${esc(postId)}', null)">Send</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
window.buildCommentsSectionHTML = buildCommentsSectionHTML;

function toggleCommentsSection(postId) {
  const body = document.getElementById('comments-body-' + postId);
  const icon = document.getElementById('comments-btn-icon-' + postId);
  if (!body || !icon) return;
  
  if (body.style.display === 'none') {
    body.style.display = 'block';
    icon.textContent = '[-]';
    loadPostComments(postId);
  } else {
    body.style.display = 'none';
    icon.textContent = '[+]';
  }
}
window.toggleCommentsSection = toggleCommentsSection;

function loadPostComments(postId) {
  const path = getBoardPath() + '/' + postId + '/anonymous_comments';
  const ref = window._ref(window._db, path);
  
  window._onValue(ref, (snapshot) => {
    const data = snapshot.val() || {};
    const comments = Object.entries(data).map(([id, c]) => ({ ...c, id })).sort((a,b) => a.ts - b.ts);
    renderCommentsTree(postId, comments);
  });
}
window.loadPostComments = loadPostComments;

function renderCommentsTree(postId, comments) {
  const listEl = document.getElementById('comments-list-' + postId);
  if (!listEl) return;
  
  if (!comments.length) {
    listEl.innerHTML = '<div style="font-style: italic; color: #888; font-size: 11px;">no comments yet.</div>';
    return;
  }
  
  const rootComments = [];
  const childrenMap = {};
  
  comments.forEach(c => {
    if (c.replyTo) {
      if (!childrenMap[c.replyTo]) childrenMap[c.replyTo] = [];
      childrenMap[c.replyTo].push(c);
    } else {
      rootComments.push(c);
    }
  });
  
  function buildCommentHTML(comment, depth = 0) {
    const id = comment.id;
    const escapedText = esc(comment.text);
    const dateStr = fmtDate(comment.ts);
    const children = childrenMap[id] || [];
    const indent = Math.min(depth * 15, 60);
    
    let html = `
      <div class="anonymous-comment" id="comment-${esc(id)}" style="margin-left: ${indent}px; border-left: 2px solid #800000; padding-left: 8px; margin-top: 6px; margin-bottom: 6px;">
        <div style="font-size: 10px; color: #666; display: flex; align-items: center; gap: 6px;">
          <span style="font-weight: bold; color: #111;">Anonymous</span>
          <span>${dateStr}</span>
          <a onclick="toggleCommentReplyForm('${esc(postId)}', '${esc(id)}')" style="cursor: pointer; text-decoration: underline; color: #800000;">[reply]</a>
        </div>
        <div style="font-size: 11px; margin-top: 2px; white-space: pre-wrap; word-break: break-all;">${escapedText}</div>
        <div id="reply-form-${esc(id)}" style="display: none; margin-top: 4px; padding-left: 10px;">
          <textarea id="reply-input-${esc(id)}" placeholder="Reply to this comment..." maxlength="1000" style="width: 100%; font: 11px Verdana; box-sizing: border-box; resize: vertical; background: #fff; color: #000; height: 40px;"></textarea>
          <div style="margin-top: 2px; text-align: right;">
            <button class="form-btn" style="padding: 1px 4px; font-size: 10px;" onclick="submitAnonymousComment('${esc(postId)}', '${esc(id)}')">Reply</button>
            <button class="form-btn" style="padding: 1px 4px; font-size: 10px;" onclick="toggleCommentReplyForm('${esc(postId)}', '${esc(id)}')">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    children.forEach(child => {
      html += buildCommentHTML(child, depth + 1);
    });
    
    return html;
  }
  
  let finalHTML = '';
  rootComments.forEach(c => {
    finalHTML += buildCommentHTML(c, 0);
  });
  
  listEl.innerHTML = finalHTML;
}
window.renderCommentsTree = renderCommentsTree;

function toggleCommentReplyForm(postId, commentId) {
  const form = document.getElementById('reply-form-' + commentId);
  if (form) {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
    if (form.style.display === 'block') {
      document.getElementById('reply-input-' + commentId)?.focus();
    }
  }
}
window.toggleCommentReplyForm = toggleCommentReplyForm;

async function submitAnonymousComment(postId, replyToCommentId) {
  const inputId = replyToCommentId ? 'reply-input-' + replyToCommentId : 'comment-input-' + postId;
  const input = document.getElementById(inputId);
  let text = input?.value || '';
  text = text.trim();
  
  if (!text) return;
  
  if (text.length > 1000) {
    alert("Comment is too long! Max 1000 characters.");
    return;
  }
  
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|\b[a-zA-Z0-9.-]+\.(?:com|net|org|edu|gov|mil|br)\b)/i;
  if (urlRegex.test(text)) {
    alert("URLs are not allowed in comments to prevent injection/spam.");
    return;
  }
  
  const lines = text.split('\n');
  if (lines.length > 6) {
    alert("ASCII art or excessive line breaks are not allowed.");
    return;
  }
  
  const symbolCount = (text.match(/[^a-zA-Z0-9\s,.:;!?()'"]/g) || []).length;
  if (symbolCount > text.length * 0.2 && text.length > 10) {
    alert("Special characters/ASCII art are not allowed in comments.");
    return;
  }
  
  const safewordsStr = window._globalSettings?.safewords || '';
  const safewords = safewordsStr.toLowerCase().split(/[\n,]+/).map(w => w.trim()).filter(Boolean);
  const textLower = text.toLowerCase();
  for (const word of safewords) {
    if (textLower.includes(word)) {
      alert("Your comment contains blocked/inappropriate words.");
      return;
    }
  }
  
  const now = Date.now();
  let timestamps = JSON.parse(localStorage.getItem('my_comment_timestamps') || '[]');
  timestamps = timestamps.filter(ts => now - ts < 120000);
  
  if (timestamps.length > 0 && now - timestamps[timestamps.length - 1] < 10000) {
    alert("Spam block: Please wait 10 seconds between comments.");
    return;
  }
  if (timestamps.length >= 10) {
    alert("Spam block: Maximum of 10 comments per 2 minutes.");
    return;
  }
  
  const comment = {
    text: text,
    ts: now
  };
  if (replyToCommentId) {
    comment.replyTo = replyToCommentId;
  }
  
  try {
    const path = getBoardPath() + '/' + postId + '/anonymous_comments';
    await window._push(window._ref(window._db, path), comment);
    
    input.value = '';
    if (replyToCommentId) {
      toggleCommentReplyForm(postId, replyToCommentId);
    }
    
    timestamps.push(now);
    localStorage.setItem('my_comment_timestamps', JSON.stringify(timestamps));
  } catch (e) {
    alert("Error posting comment: " + e.message);
  }
}
window.submitAnonymousComment = submitAnonymousComment;

// Initialize sidebar and UI bindings
document.addEventListener('DOMContentLoaded', () => {
  initTopSketchesSidebar();
  updateLoginNavBtn();
});
if (document.readyState !== 'loading') {
  initTopSketchesSidebar();
  updateLoginNavBtn();
}

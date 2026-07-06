import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getDatabase,
  ref,
  push,
  remove,
  onValue,
  get,
  set,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const FB = { 
  apiKey: "AIzaSyBBr6zPaWgGNcGHz9iiNTO8O4EgAzsUMOk", 
  authDomain: "scrapfielddatabase.firebaseapp.com", 
  databaseURL: "https://scrapfielddatabase-default-rtdb.firebaseio.com", 
  projectId: "scrapfielddatabase", 
  storageBucket: "scrapfielddatabase.firebasestorage.app", 
  messagingSenderId: "489751764776", 
  appId: "1:489751764776:web:22255a1e9bf05a538bfa1d" 
}; 
 
const app = initializeApp(FB); 
const db = getDatabase(app); 
const auth = getAuth(app);

async function sha256(str) { 
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)); 
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''); 
} 
 
window._db = db; 
window._auth = auth;
window._signInAnonymously = signInAnonymously;
window._ref = ref; 
window._push = push; 
window._remove = remove; 
window._get = get; 
window._set = set; 
window._sha256 = sha256; 
window._serverTimestamp = serverTimestamp; 
 
function sortNewest(arr) { 
  return [...arr].sort((a, b) => (Number(b.ts) || 0) - (Number(a.ts) || 0)); 
} 
 
function syncPosts() {
  const urlParams = new URLSearchParams(window.location.search);
  let boardId = urlParams.get('board');
  if (!boardId) {
    if (window.location.pathname.endsWith('sketches.html')) boardId = 'sketches';
    else boardId = 'blog';
  }
  const path = (boardId === 'blog') ? 'blog/posts' : 
               (boardId === 'sketches') ? 'gallery/sketches' : 
               (boardId === 'home') ? 'home/posts' :
               `boards/${boardId}/posts`;
  
  onValue(ref(db, path), snap => { 
    const val = snap.val() || {}; 
    window._allPosts = sortNewest(Object.entries(val).map(([id, d]) => ({ ...d, id }))); 
    if (window.filterPosts) window.filterPosts(); 
  }); 
}
syncPosts();

onValue(ref(db, 'blog/adminLastOnline'), snap => { 
  const val = snap.val(); 
  if (window.setAdminLastOnline) window.setAdminLastOnline(val); 
}); 
 
onValue(ref(db, 'gallery/sketches'), snap => { 
  const val = snap.val() || {}; 
  window._fbSketches = sortNewest(Object.entries(val).map(([id, d]) => ({ ...d, _fbId: id }))); 
  // renderGalleryTab('sketches'); 
  if (window._isAdmin && window.renderAdminImageList) window.renderAdminImageList(); 
}); 
 
onValue(ref(db, 'gallery/pictures'), snap => { 
  const val = snap.val() || {}; 
  window._fbPictures = sortNewest(Object.entries(val).map(([id, d]) => ({ ...d, _fbId: id }))); 
  renderGalleryTab('pictures'); 
  if (window._isAdmin && window.renderAdminImageList) window.renderAdminImageList(); 
}); 

onValue(ref(db, 'admin/settings'), snap => {
  window._globalSettings = snap.val() || {};
  if (window.chanReadSettings) {
    const settings = window.chanReadSettings();
    if (window.applySettings) window.applySettings(settings);
  }
});

onValue(ref(db, 'admin/boards'), snap => {
  const boards = snap.val() || {};
  window._boards = boards;
  
  // Also fetch counts for each board
  Object.keys(boards).forEach(bid => {
    onValue(ref(db, `boards/${bid}/posts`), psnap => {
      if (!window._boardPostCounts) window._boardPostCounts = {};
      window._boardPostCounts[bid] = Object.keys(psnap.val() || {}).length;
      if (window.renderBoardList) window.renderBoardList();
    });
  });

  // Fetch counts for fixed boards too
  const fixedMappings = {
    'blog': 'blog/posts',
    'sketches': 'gallery/sketches',
    'pictures': 'gallery/pictures',
    'home': 'home/posts'
  };
  Object.entries(fixedMappings).forEach(([bid, path]) => {
    onValue(ref(db, path), psnap => {
      if (!window._boardPostCounts) window._boardPostCounts = {};
      window._boardPostCounts[bid] = Object.keys(psnap.val() || {}).length;
      if (window.renderBoardList) window.renderBoardList();
    });
  });

  if (window.renderBoardList) window.renderBoardList();
  if (window.updateAdminBoardList) window.updateAdminBoardList();
});

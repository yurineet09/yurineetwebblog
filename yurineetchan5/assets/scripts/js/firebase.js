import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, set, get, push, remove, onValue, off, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Default config that can be overridden by window.firebaseConfig
const firebaseConfig = window.firebaseConfig || {
  databaseURL: "https://yurineet-death-archive-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Expose Firebase functions and DB/Auth to window object for script.js
window._db = db;
window._ref = ref;
window._set = set;
window._get = get;
window._push = push;
window._remove = remove;
window._onValue = onValue;
window._off = off;
window._serverTimestamp = serverTimestamp;
window._auth = auth;
window._signInAnonymously = signInAnonymously;

// Implement _sha256 hash helper function
window._sha256 = async function(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Initialize post count tracker
window._boardPostCounts = window._boardPostCounts || {};

// Listen for global site settings
onValue(ref(db, 'admin/settings'), (snapshot) => {
  window._globalSettings = snapshot.val() || {};
  if (window.applySettings) {
    if (window.chanReadSettings) {
      window.applySettings(window.chanReadSettings());
    } else {
      window.applySettings();
    }
  }
  // If we are on sketches or gallery pages, we might need to hide/show the sidebar based on showTopSketches
  const sidebar = document.getElementById('topSketchesSidebar');
  if (sidebar) {
    sidebar.style.display = window._globalSettings.showTopSketches === false ? 'none' : 'block';
  }
});

// Listen for boards list
onValue(ref(db, 'admin/boards'), (snapshot) => {
  window._boards = snapshot.val() || {};
  if (window.renderBoardList) {
    window.renderBoardList();
  }
  
  // Listen for posts in each dynamic board to update their counts
  const boards = window._boards;
  Object.keys(boards).forEach(boardId => {
    onValue(ref(db, `boards/${boardId}/posts`), (snap) => {
      const postsVal = snap.val() || {};
      window._boardPostCounts[boardId] = Object.keys(postsVal).length;
      if (window.renderBoardList) {
        window.renderBoardList();
      }
    });
  });
});

// Helper to format posts from snapshot
function parsePosts(snapshotValue) {
  if (!snapshotValue) return [];
  return Object.entries(snapshotValue).map(([id, p]) => {
    return { ...p, id };
  });
}

// Listen to static boards to update counts
onValue(ref(db, 'blog/posts'), (snap) => {
  window._boardPostCounts['blog'] = Object.keys(snap.val() || {}).length;
  if (window.renderBoardList) window.renderBoardList();
});
onValue(ref(db, 'gallery/sketches'), (snap) => {
  window._boardPostCounts['sketches'] = Object.keys(snap.val() || {}).length;
  if (window.renderBoardList) window.renderBoardList();
});

// Listen for posts of the current board
const currentBoardPath = window.getBoardPath ? window.getBoardPath() : 'blog/posts';
onValue(ref(db, currentBoardPath), (snapshot) => {
  const posts = parsePosts(snapshot.val());
  window._allPosts = posts;
  if (window.filterPosts) {
    window.filterPosts();
  }
});

// Listen for gallery sketches and pictures
onValue(ref(db, 'gallery/sketches'), (snapshot) => {
  const data = snapshot.val() || {};
  window._fbSketches = Object.entries(data).map(([id, item]) => {
    return { ...item, _fbId: id };
  });
  if (window.renderGalleryTab) {
    window.renderGalleryTab(window._curGalTab || 'sketches');
  }
  // Update top sketches sidebar if active
  if (window.updateTopSketchesSidebar) {
    window.updateTopSketchesSidebar();
  }
});

onValue(ref(db, 'gallery/pictures'), (snapshot) => {
  const data = snapshot.val() || {};
  window._fbPictures = Object.entries(data).map(([id, item]) => {
    return { ...item, _fbId: id };
  });
  if (window.renderGalleryTab) {
    window.renderGalleryTab(window._curGalTab || 'sketches');
  }
});

// Handle Auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Firebase Authenticated anonymously.");
  }
});

let _fb = null;
let _auth = null;

function initFirebase() {
  if (typeof firebase === 'undefined' || !window.FIREBASE_CONFIG) return;
  try {
    if (!firebase.apps.length) _fb = firebase.initializeApp(window.FIREBASE_CONFIG);
    else _fb = firebase.app();
    _auth = firebase.auth();
  } catch (e) { console.warn(e); }
}

async function getMe() {
  try {
    const { user } = await api('/api/auth/me');
    return user;
  } catch { return null; }
}

async function requireAuth() {
  const user = await getMe();
  if (!user) {
    location.href = 'login.html';
    return null;
  }
  return user;
}

async function loginLocal(username, password) {
  return api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

async function registerLocal(username, password, email) {
  return api('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, email })
  });
}

async function loginGoogle() {
  if (!_auth) throw new Error('Firebase belum siap');
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await _auth.signInWithPopup(provider);
  const user = result.user;
  const idToken = await user.getIdToken();
  return api('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      idToken, uid: user.uid, email: user.email,
      name: user.displayName, photoURL: user.photoURL
    })
  });
}

async function loginTelegram(tgUser) {
  return api('/api/auth/telegram', { method: 'POST', body: JSON.stringify(tgUser) });
}

async function logout() {
  try { if (_auth) await _auth.signOut(); } catch {}
  try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
  location.href = 'index.html';
}

window.onTelegramAuth = async function (user) {
  try {
    await loginTelegram(user);
    location.href = 'dashboard.html';
  } catch (e) { alert(e.message); }
};

async function loadAuthConfig() {
  try { return await api('/api/auth/config'); }
  catch { return { telegramBotUsername: '', googleEnabled: true }; }
}

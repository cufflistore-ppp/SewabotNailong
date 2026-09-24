const API = '';

let currentUser = null;
let authConfig = { telegramBotUsername: '', googleEnabled: true };
let firebaseApp = null;
let firebaseAuth = null;

async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function initFirebase() {
  if (typeof firebase === 'undefined' || typeof firebaseConfig === 'undefined') return;
  try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firebaseAuth = firebase.auth();
  } catch (e) {
    console.warn('Firebase init:', e);
  }
}

async function loadAuthConfig() {
  try {
    authConfig = await api('/api/auth/config');
  } catch {}
}

function showModal(type) {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  overlay.classList.remove('hidden');

  const oauthButtons = `
    <div style="display:flex;flex-direction:column;gap:.6rem;margin-bottom:1.25rem">
      <button type="button" class="btn btn-outline" style="width:100%;gap:.6rem" onclick="loginGoogle()">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Masuk dengan Google
      </button>
      <div id="telegramLoginContainer" style="display:flex;justify-content:center"></div>
    </div>
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1rem">
      <div style="flex:1;height:1px;background:var(--border)"></div>
      <span style="font-size:.8rem;color:var(--muted)">atau</span>
      <div style="flex:1;height:1px;background:var(--border)"></div>
    </div>
  `;

  if (type === 'login') {
    content.innerHTML = `
      <h2>Masuk</h2>
      ${oauthButtons}
      <form onsubmit="doLogin(event)">
        <div class="form-group"><label>Username</label><input name="username" required></div>
        <div class="form-group"><label>Password</label><input name="password" type="password" required></div>
        <button class="btn btn-primary" style="width:100%">Masuk</button>
        <p class="form-error" id="formErr"></p>
      </form>
      <p style="margin-top:1rem;font-size:.9rem;color:var(--muted)">Belum punya akun? <a href="#" onclick="showModal('register')">Daftar</a></p>
    `;
    renderTelegramWidget();
  } else if (type === 'register') {
    content.innerHTML = `
      <h2>Daftar Akun</h2>
      ${oauthButtons}
      <form onsubmit="doRegister(event)">
        <div class="form-group"><label>Username</label><input name="username" required minlength="3"></div>
        <div class="form-group"><label>Password</label><input name="password" type="password" required minlength="5"></div>
        <div class="form-group"><label>Email (opsional)</label><input name="email" type="email"></div>
        <button class="btn btn-primary" style="width:100%">Daftar + Trial 18 Jam</button>
        <p class="form-error" id="formErr"></p>
      </form>
    `;
    renderTelegramWidget();
  }
}

function renderTelegramWidget() {
  const box = document.getElementById('telegramLoginContainer');
  if (!box) return;
  if (!authConfig.telegramBotUsername) {
    box.innerHTML = `<button type="button" class="btn btn-outline" style="width:100%;opacity:.6" onclick="alert('Telegram login belum dikonfigurasi.\\nIsi TELEGRAM_BOT_USERNAME & TELEGRAM_BOT_TOKEN di .env')">✈️ Masuk dengan Telegram</button>`;
    return;
  }
  // Telegram Login Widget
  box.innerHTML = '';
  const script = document.createElement('script');
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.setAttribute('data-telegram-login', authConfig.telegramBotUsername);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-radius', '8');
  script.setAttribute('data-onauth', 'onTelegramAuth(user)');
  script.setAttribute('data-request-access', 'write');
  script.async = true;
  box.appendChild(script);
}

window.onTelegramAuth = async function (user) {
  try {
    const data = await api('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify(user)
    });
    currentUser = data.user;
    hideModal();
    afterLogin();
  } catch (e) {
    alert(e.message);
  }
};

async function loginGoogle() {
  if (!firebaseAuth) {
    alert('Firebase belum siap. Refresh halaman.');
    return;
  }
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await firebaseAuth.signInWithPopup(provider);
    const user = result.user;
    const idToken = await user.getIdToken();
    const data = await api('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        idToken,
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL
      })
    });
    currentUser = data.user;
    hideModal();
    afterLogin();
  } catch (e) {
    console.error(e);
    const errEl = document.getElementById('formErr');
    if (errEl) errEl.textContent = e.message || 'Gagal login Google';
    else alert(e.message || 'Gagal login Google');
  }
}

function hideModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

function afterLogin() {
  document.getElementById('btnLogin').classList.add('hidden');
  document.getElementById('btnRegister').classList.add('hidden');
  document.getElementById('btnDashboard').classList.remove('hidden');
  goDashboard();
}

async function doRegister(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(fd))
    });
    currentUser = data.user;
    hideModal();
    afterLogin();
  } catch (err) {
    document.getElementById('formErr').textContent = err.message;
  }
}

async function doLogin(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(fd))
    });
    currentUser = data.user;
    hideModal();
    afterLogin();
  } catch (err) {
    document.getElementById('formErr').textContent = err.message;
  }
}

async function logout() {
  try { if (firebaseAuth) await firebaseAuth.signOut(); } catch {}
  await api('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  document.getElementById('dashboardView').classList.add('hidden');
  document.querySelector('.hero')?.classList.remove('hidden');
  document.querySelectorAll('.section').forEach(s => s.classList.remove('hidden'));
  document.querySelector('.footer')?.classList.remove('hidden');
  document.getElementById('btnLogin').classList.remove('hidden');
  document.getElementById('btnRegister').classList.remove('hidden');
  document.getElementById('btnDashboard').classList.add('hidden');
}

async function checkAuth() {
  try {
    const data = await api('/api/auth/me');
    currentUser = data.user;
    document.getElementById('btnLogin').classList.add('hidden');
    document.getElementById('btnRegister').classList.add('hidden');
    document.getElementById('btnDashboard').classList.remove('hidden');
  } catch {
    currentUser = null;
  }
}

function goDashboard() {
  document.querySelector('.hero')?.classList.add('hidden');
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
  document.querySelector('.footer')?.classList.add('hidden');
  document.getElementById('dashboardView').classList.remove('hidden');
  document.getElementById('dashUser').textContent = currentUser ? '@' + currentUser.username : '';
  loadBots();
  loadOrders();
}

async function loadBots() {
  const el = document.getElementById('botList');
  try {
    const { bots } = await api('/api/bots');
    if (!bots.length) {
      el.innerHTML = '<p style="color:var(--muted)">Belum ada bot. Buat sekarang!</p>';
      return;
    }
    el.innerHTML = bots.map(b => `
      <div class="bot-item">
        <div class="name">${escapeHtml(b.bot_name)} <span class="badge badge-${b.status}">${b.status}</span> · ${b.bot_type}</div>
        <div style="font-size:.85rem;color:var(--muted);margin:.3rem 0">
          ${b.expires_at ? 'Aktif s/d ' + new Date(b.expires_at).toLocaleString('id-ID') : 'Belum aktif'}
          · Link: ${b.link_used}/${b.link_limit}
        </div>
        <div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.5rem">
          ${b.status === 'active' || b.status === 'offline' ? `<button class="btn btn-sm btn-primary" onclick="doPairing(${b.id})">Ambil Pairing</button>` : ''}
          ${b.pairing_code ? `<code style="background:#f3f4f6;padding:.2rem .5rem;border-radius:4px">${b.pairing_code}</code>` : ''}
          <button class="btn btn-sm btn-outline" onclick="showPay(${b.id})">Bayar / Perpanjang</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = `<p class="form-error">${e.message}</p>`;
  }
}

async function loadOrders() {
  const el = document.getElementById('orderList');
  try {
    const { orders } = await api('/api/payment/orders');
    if (!orders.length) {
      el.innerHTML = '<p style="color:var(--muted)">Belum ada pesanan.</p>';
      return;
    }
    el.innerHTML = orders.slice(0, 10).map(o => `
      <div class="order-item">
        <div>${o.package_name || o.package_code} · Rp ${Number(o.total_amount || o.amount).toLocaleString('id-ID')}</div>
        <div style="font-size:.85rem;color:var(--muted)">${o.transaction_id || '-'} · <span class="badge badge-${o.status}">${o.status}</span></div>
      </div>
    `).join('');
  } catch (e) {
    el.innerHTML = `<p class="form-error">${e.message}</p>`;
  }
}

function showCreateBot() {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  overlay.classList.remove('hidden');
  content.innerHTML = `
    <h2>Buat Bot Baru</h2>
    <form onsubmit="doCreateBot(event)">
      <div class="form-group"><label>Nama Bot</label><input name="bot_name" required placeholder="Contoh: Nailong Gembul"></div>
      <div class="form-group">
        <label>Tipe Bot</label>
        <select name="bot_type" required>
          <option value="JB">JB (Group / Jaga Grup)</option>
          <option value="JPM">JPM (Broadcast / Marketing)</option>
        </select>
      </div>
      <div class="form-group"><label>Foto Menu (opsional, max 2MB)</label><input type="file" name="photo" accept="image/*"></div>
      <p style="font-size:.85rem;color:var(--muted);margin-bottom:1rem">Akun baru otomatis dapat trial 18 jam gratis.</p>
      <button class="btn btn-primary" style="width:100%">Buat Bot</button>
      <p class="form-error" id="formErr"></p>
    </form>
  `;
}

async function doCreateBot(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    const res = await fetch('/api/bots/create', { method: 'POST', credentials: 'include', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal');
    hideModal();
    if (data.trial) alert('Bot dibuat! Trial 18 jam aktif. Silakan ambil pairing code.');
    loadBots();
  } catch (err) {
    document.getElementById('formErr').textContent = err.message;
  }
}

async function doPairing(id) {
  try {
    const data = await api('/api/bots/' + id + '/pairing', { method: 'POST' });
    alert('Kode Pairing: ' + data.pairing_code + '\\n\\nBuka WhatsApp → Perangkat Tertaut → Tautkan dengan nomor telepon → masukkan kode.');
    loadBots();
  } catch (e) {
    alert(e.message);
  }
}

async function showPay(botId) {
  const { packages } = await api('/api/bots/packages');
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  overlay.classList.remove('hidden');
  content.innerHTML = `
    <h2>Pilih Paket</h2>
    <div style="max-height:320px;overflow:auto;margin-bottom:1rem">
      ${packages.filter(p => !p.code.startsWith('addon')).map(p => `
        <button class="btn btn-outline" style="width:100%;margin-bottom:.4rem;justify-content:space-between"
          onclick="createPayment('${p.code}', ${botId})">
          <span>${p.name}</span>
          <strong>Rp ${p.price.toLocaleString('id-ID')}</strong>
        </button>
      `).join('')}
      <hr style="margin:1rem 0;border:none;border-top:1px solid var(--border)">
      <p style="font-size:.85rem;color:var(--muted);margin-bottom:.5rem">Add-on link:</p>
      ${packages.filter(p => p.code.startsWith('addon')).map(p => `
        <button class="btn btn-outline" style="width:100%;margin-bottom:.4rem;justify-content:space-between"
          onclick="createPayment('${p.code}', ${botId})">
          <span>${p.name}</span>
          <strong>Rp ${p.price.toLocaleString('id-ID')}</strong>
        </button>
      `).join('')}
    </div>
    <p class="form-error" id="formErr"></p>
  `;
}

async function createPayment(code, botId) {
  try {
    const data = await api('/api/payment/create', {
      method: 'POST',
      body: JSON.stringify({ package_code: code, bot_id: botId })
    });
    const content = document.getElementById('modalContent');
    let qrHtml = '';
    if (data.qr_image) {
      qrHtml = '<img src="data:image/png;base64,' + data.qr_image + '" alt="QRIS">';
    } else if (data.qr_string) {
      qrHtml = '<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(data.qr_string) + '" alt="QRIS">';
    }
    content.innerHTML = `
      <h2>Scan QRIS</h2>
      <div class="qr-box">
        ${qrHtml}
        <div class="qr-amount">Rp ${Number(data.amount).toLocaleString('id-ID')}</div>
        <p style="font-size:.85rem;color:var(--muted)">ID: ${data.transaction_id}</p>
        <p style="font-size:.85rem;margin-top:.5rem">Bayar dalam 30 menit. Setelah lunas bot otomatis aktif.</p>
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="checkPay('${data.transaction_id}')">Cek Status Pembayaran</button>
      <p class="form-error" id="formErr"></p>
    `;
  } catch (e) {
    document.getElementById('formErr').textContent = e.message;
  }
}

async function checkPay(trxId) {
  try {
    const { order } = await api('/api/payment/status/' + trxId);
    if (order.status === 'paid') {
      alert('Pembayaran berhasil! Bot sudah diperpanjang.');
      hideModal();
      loadBots();
      loadOrders();
    } else {
      document.getElementById('formErr').textContent = 'Masih pending. Coba lagi setelah bayar.';
    }
  } catch (e) {
    document.getElementById('formErr').textContent = e.message;
  }
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

const FALLBACK_PACKAGES = [
  { name: '1 Jam', price: 2000, link_limit: 2 },
  { name: '2 Jam', price: 4000, link_limit: 2 },
  { name: '3 Jam', price: 6000, link_limit: 2 },
  { name: '4 Jam', price: 8000, link_limit: 2 },
  { name: '5 Jam', price: 10000, link_limit: 2 },
  { name: '1 Minggu', price: 12000, link_limit: 4 },
  { name: '2 Minggu', price: 14000, link_limit: 4 },
  { name: '3 Minggu', price: 16000, link_limit: 4 },
  { name: '4 Minggu', price: 18000, link_limit: 4 },
  { name: '5 Minggu', price: 20000, link_limit: 4 },
  { name: '1 Bulan', price: 22000, link_limit: 6 },
  { name: '2 Bulan', price: 24000, link_limit: 6 },
  { name: '3 Bulan', price: 26000, link_limit: 6 },
  { name: '4 Bulan', price: 28000, link_limit: 6 },
  { name: '5 Bulan', price: 30000, link_limit: 6 },
  { name: '1 Tahun', price: 78000, link_limit: 8 },
  { name: '2 Tahun', price: 110000, link_limit: 8 },
];

function renderPrices(packages) {
  const grid = document.getElementById('priceGrid');
  if (!grid) return;
  grid.innerHTML = packages.map(p => `
    <div class="price-card">
      <div class="pname">${p.name}</div>
      <div class="pprice">Rp ${Number(p.price).toLocaleString('id-ID')}</div>
      <div class="plink">${p.link_limit}x link grup</div>
    </div>
  `).join('');
}

async function loadPrices() {
  try {
    const { packages } = await api('/api/bots/packages');
    renderPrices(packages.filter(p => !String(p.code||'').startsWith('addon')));
  } catch {
    renderPrices(FALLBACK_PACKAGES);
  }
}

// Init
document.addEventListener('DOMContentLoaded', async () => {
  initFirebase();
  await loadAuthConfig();
  await checkAuth();
  loadPrices();
});

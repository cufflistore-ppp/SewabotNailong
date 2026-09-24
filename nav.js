/** Shared nav + hamburger drawer — SVG icons only, no emoji */
function ico(name) {
  const svg = (window.ICONS && window.ICONS[name]) || '';
  return '<span class="ico-svg" aria-hidden="true">' + svg + '</span>';
}

function renderNav(opts = {}) {
  const active = opts.active || '';
  const showAuth = opts.showAuth !== false;
  const nav = document.getElementById('siteNav');
  if (!nav) return;

  nav.innerHTML = `
    <div class="nav-inner">
      <a href="index.html" class="logo" aria-label="Sewabot Nailong">
        <img src="img/logo.png" alt="Sewabot Nailong" class="logo-img" />
      </a>
      <div class="nav-actions">
        ${showAuth ? `
          <a href="login.html" class="btn btn-ghost btn-sm" id="navLogin">Masuk</a>
          <a href="register.html" class="btn btn-primary btn-sm" id="navRegister">Daftar</a>
          <a href="dashboard.html" class="btn btn-primary btn-sm hidden" id="navDash">Dashboard</a>
        ` : ''}
        <button class="hamburger" id="btnMenu" aria-label="Menu" type="button">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  `;

  if (!document.getElementById('drawerOverlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.id = 'drawerOverlay';
    overlay.onclick = closeDrawer;

    const drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.id = 'sideDrawer';
    drawer.innerHTML = `
      <div class="drawer-head">
        <strong>MENU</strong>
        <button class="drawer-close" type="button" onclick="closeDrawer()" aria-label="Tutup">×</button>
      </div>
      <nav class="drawer-nav">
        <a href="status.html" class="${active==='status'?'active':''}">${ico('status')} Status Bot</a>
        <a href="dashboard.html" class="${active==='saya'?'active':''}">${ico('user')} Saya</a>
        <a href="payment.html" class="${active==='sewa'?'active':''}">${ico('sewa')} Sewa Bot</a>
        <a href="create-bot.html" class="${active==='custom'?'active':''}">${ico('custom')} Custom Bot</a>
        <a href="donasi.html" class="${active==='donasi'?'active':''}">${ico('donasi')} Donasi</a>
        <a href="info.html" class="${active==='info'?'active':''}">${ico('info')} Pusat Info</a>
        <a href="harga.html" class="${active==='harga'?'active':''}">${ico('harga')} Harga</a>
        <a href="faq.html" class="${active==='faq'?'active':''}">${ico('faq')} FAQ</a>
      </nav>
      <div class="drawer-foot">sewabotnailong.my.id</div>
    `;
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  }

  document.getElementById('btnMenu')?.addEventListener('click', toggleDrawer);

  if (typeof getMe === 'function' && showAuth) {
    getMe().then(u => {
      if (u) {
        document.getElementById('navLogin')?.classList.add('hidden');
        document.getElementById('navRegister')?.classList.add('hidden');
        document.getElementById('navDash')?.classList.remove('hidden');
      }
    }).catch(() => {});
  }
}

function toggleDrawer() {
  document.getElementById('btnMenu')?.classList.toggle('open');
  document.getElementById('drawerOverlay')?.classList.toggle('show');
  document.getElementById('sideDrawer')?.classList.toggle('show');
}
function closeDrawer() {
  document.getElementById('btnMenu')?.classList.remove('open');
  document.getElementById('drawerOverlay')?.classList.remove('show');
  document.getElementById('sideDrawer')?.classList.remove('show');
}
window.toggleDrawer = toggleDrawer;
window.closeDrawer = closeDrawer;
window.renderNav = renderNav;

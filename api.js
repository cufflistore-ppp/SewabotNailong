async function api(path, opts = {}) {
  const base = window.API_BASE || '';
  const res = await fetch(base + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request gagal');
  return data;
}

function money(n) {
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

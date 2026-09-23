# Nailong Website (Frontend)

Isi folder ini adalah tampilan website (HTML/CSS/JS).

## Cara pakai
1. Upload seluruh isi folder ini ke hosting static / Nginx / cPanel public_html
2. Pastikan backend panel sudah jalan (API di domain yang sama atau atur CORS)
3. Jika API di domain berbeda, edit di js/app.js baris pertama:
   const API = 'https://panel.domainkamu.com';

## File penting
- index.html   → halaman utama
- css/style.css
- js/app.js
- js/firebase-config.js

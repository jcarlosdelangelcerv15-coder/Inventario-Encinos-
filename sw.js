/* Tiquenda · trabajador sin conexión
   Guarda la app en el teléfono para que abra aunque no haya internet.
   Los datos (conteos, recepciones…) los guarda Firebase en el teléfono y
   los sube solos cuando vuelve la señal. */
const CACHE = 'tiquenda-v2026-10-13c';
const ARCHIVOS = [
  './',
  './index.html',
  './apple-touch-icon.png?v=2',
  './manifest.json',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=> Promise.all(ARCHIVOS.map(u=> c.add(u).catch(()=>{})))).then(()=> self.skipWaiting()));
});

self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(ks=> Promise.all(ks.filter(k=> k !== CACHE).map(k=> caches.delete(k)))).then(()=> self.clients.claim()));
});

self.addEventListener('fetch', (e)=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  const url = new URL(req.url);
  // Firebase (datos e inicio de sesión) se maneja solo: no se toca.
  if(/googleapis\.com|firebaseio\.com|identitytoolkit|securetoken/.test(url.hostname)) return;

  // La app (index.html): primero internet para recibir mejoras; si no hay, la copia guardada.
  if(req.mode === 'navigate' || (url.origin === self.location.origin && /\/(index\.html)?$/.test(url.pathname))){
    e.respondWith(
      fetch(req).then(res=>{ const copia = res.clone(); caches.open(CACHE).then(c=> c.put('./index.html', copia)); return res; })
        .catch(()=> caches.match('./index.html').then(r=> r || caches.match('./')))
    );
    return;
  }

  // Librerías (Firebase, Excel, códigos de barras): primero la copia guardada.
  if(/jsdelivr\.net|gstatic\.com/.test(url.hostname)){
    e.respondWith(
      caches.match(req).then(r=> r || fetch(req).then(res=>{ const copia = res.clone(); caches.open(CACHE).then(c=> c.put(req, copia)); return res; }))
    );
  }
});

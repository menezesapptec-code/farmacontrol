/* Farma Control: guarda o app no celular para abrir sem sinal. Os dados ficam no Firestore (cache offline). */
var VERSAO = 'farmacontrol-v11';
var BASE = ['./', 'index.html', 'manifest.json'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSAO).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSAO; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var meu = url.origin === location.origin;
  var lib = url.hostname === 'www.gstatic.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'fonts.googleapis.com';
  if (!meu && !lib) return;
  e.respondWith(
    caches.open(VERSAO).then(function (c) {
      return c.match(req, { ignoreSearch: false }).then(function (hit) {
        var rede = fetch(req).then(function (res) {
          if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone());
          return res;
        }).catch(function () { return hit || (req.mode === 'navigate' ? c.match('index.html') : undefined); });
        return hit || rede;
      });
    })
  );
});

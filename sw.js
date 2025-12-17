/* =========================================
   BIBLIA YA SAUTI – SERVICE WORKER
   PWABUILDER APPROVED VERSION
========================================= */

const CACHE_VERSION = "biblia-v3";
const STATIC_CACHE = `static-${CACHE_VERSION}`;

/* FILES ZA MSINGI (NO AUDIO HERE) */
const STATIC_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./audio-core.js",

  "./chapter.html",
  "./chapter.js",

  "./notes.html",
  "./notes.js",

  "./bible.json",
  "./manifest.json",

  /* ICONS */
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/nyumbani.png",
  "./icons/pen.png"
];

/* ===============================
   INSTALL
================================ */
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_FILES))
  );
});

/* ===============================
   ACTIVATE
================================ */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== STATIC_CACHE) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* ===============================
   FETCH
================================ */
self.addEventListener("fetch", event => {
  const req = event.request;

  /* 🚫 USIGUSE AUDIO / VIDEO */
  if (req.destination === "audio" || req.destination === "video") {
    return; // browser ichukue direct
  }

  /* CACHE FIRST – STATIC FILES */
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req);
    })
  );
});

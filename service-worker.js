/* =========================================
   SERVICE WORKER – BIBLE APP
   Clean • Offline • Test Friendly
========================================= */

const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = `bible-app-${CACHE_VERSION}`;

/* Files muhimu za msingi */
const CORE_ASSETS = [
  "/",                   // root
  "/index.html",
  "/chapter.html",
  "/notes.html",
  "/settings.html",

  "/style.css",

  "/script.js",
  "/chapter.js",
  "/notes.js",
  "/settings.js",

  "/audio-core.js",
  "/bookmark-core.js",

  "/bible.json",

  "/icons/nyumbani.png"
];

/* =========================================
   INSTALL
========================================= */
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[SW] Caching core assets");
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

/* =========================================
   ACTIVATE
========================================= */
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Removing old cache:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

/* =========================================
   FETCH
   Cache First → Network fallback
========================================= */
self.addEventListener("fetch", event => {
  const req = event.request;

  // skip non-GET requests
  if (req.method !== "GET") return;

  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req)
        .then(res => {
          // cache only valid responses
          if (!res || res.status !== 200 || res.type !== "basic") {
            return res;
          }

          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, clone);
          });

          return res;
        })
        .catch(() => {
          // fallback ya offline (hiari)
          if (req.destination === "document") {
            return caches.match("/index.html");
          }
        });
    })
  );
});

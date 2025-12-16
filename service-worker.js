/* ======================================================
   SERVICE WORKER – FINAL VERSION
   Biblia ya Sauti
====================================================== */

const CACHE_VERSION = "biblia-v3";   // 🔥 BADILISHA HII KILA UPDATE
const APP_CACHE = CACHE_VERSION;

const CORE_FILES = [
  "./",
  "./index.html",
  "./chapter.html",
  "./notes.html",
  "./settings.html",

  "./style.css",
  "./audio-core.js",
  "./script.js",
  "./chapter.js",
  "./notes.js",
  "./settings.js",

  "./bible.json"
];

/* ======================================================
   INSTALL
====================================================== */
self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  self.skipWaiting();

  event.waitUntil(
    caches.open(APP_CACHE).then(cache => {
      return cache.addAll(CORE_FILES);
    })
  );
});

/* ======================================================
   ACTIVATE (CLEAN OLD CACHES)
====================================================== */
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== APP_CACHE) {
            console.log("[SW] Deleting old cache:", k);
            return caches.delete(k);
          }
        })
      )
    )
  );

  self.clients.claim();
});

/* ======================================================
   FETCH (NETWORK FIRST – NO STALE FILES)
====================================================== */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Bible JSON & JS & CSS → ALWAYS FRESH
  if (
    req.url.includes(".js") ||
    req.url.includes(".css") ||
    req.url.includes("bible.json")
  ) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const clone = res.clone();
          caches.open(APP_CACHE).then(c => c.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Default: cache fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

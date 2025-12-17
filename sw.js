/* =========================================
   BIBLIA YA SAUTI – SERVICE WORKER
   OPTION A (sw.js)
========================================= */

const CACHE_VERSION = "biblia-v1";

const STATIC_CACHE = `static-${CACHE_VERSION}`;
const AUDIO_CACHE  = `audio-${CACHE_VERSION}`;

/* Files muhimu za app */
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
  "./manifest.json"
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
          if (key !== STATIC_CACHE && key !== AUDIO_CACHE) {
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
  const url = new URL(req.url);

  /* 🔊 AUDIO – cache on play */
  if (req.destination === "audio" || url.pathname.endsWith(".mp3")) {
    event.respondWith(cacheAudio(req));
    return;
  }

  /* 📄 STATIC FILES */
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});

/* ===============================
   AUDIO CACHE LOGIC
================================ */
async function cacheAudio(request){
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const res = await fetch(request);
    if (res.ok) {
      cache.put(request, res.clone());
    }
    return res;
  } catch (e) {
    return cached;
  }
}

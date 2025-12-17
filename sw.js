/* =========================================
   BIBLIA YA SAUTI – SERVICE WORKER
   FINAL STABLE VERSION
========================================= */

const CACHE_VERSION = "biblia-v2";

/* Cache names */
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const AUDIO_CACHE  = `audio-${CACHE_VERSION}`;

/* Files muhimu za app (STATIC + ICONS) */
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

  /* ICONS & IMAGES (MUHIMU SANA) */
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
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_FILES);
    })
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
  const request = event.request;
  const url = new URL(request.url);

  /* 🔊 AUDIO: cache-on-play */
  if (request.destination === "audio" || url.pathname.endsWith(".mp3")) {
    event.respondWith(cacheAudio(request));
    return;
  }

  /* 🖼️ IMAGES & ICONS */
  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request))
    );
    return;
  }

  /* 📄 OTHER FILES */
  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});

/* ===============================
   AUDIO CACHE LOGIC
================================ */
async function cacheAudio(request){
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return cached;
  }
}

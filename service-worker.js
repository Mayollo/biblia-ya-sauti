/* =========================================
   BIBLIA YA SAUTI – SERVICE WORKER
   APK & OFFLINE READY
========================================= */

const CACHE_VERSION = "biblia-apk-v1";

/* Cache names */
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const AUDIO_CACHE  = `audio-${CACHE_VERSION}`;

/* Files muhimu za app */
const STATIC_FILES = [
  "/",
  "/index.html",
  "/chapter.html",
  "/notes.html",
  "/style.css",
  "/script.js",
  "/chapter.js",
  "/notes.js",
  "/bible.json"
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
          if (
            key !== STATIC_CACHE &&
            key !== AUDIO_CACHE
          ) {
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

  /* 📄 STATIC FILES */
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request);
    })
  );
});

/* ===============================
   AUDIO CACHE LOGIC
================================ */
async function cacheAudio(request){
  const cache = await caches.open(AUDIO_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached; // offline ready
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return cached; // fallback
  }
}

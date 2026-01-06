const CACHE_VERSION = "biblia-v3";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const AUDIO_CACHE = `audio-${CACHE_VERSION}`;

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

// Install event to cache static files
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_FILES))
  );
});

// Activate event to clean up old caches
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

// Fetch event to serve cached files when offline
self.addEventListener("fetch", event => {
  const req = event.request;

  // Cache audio files (optional)
  if (req.destination === "audio" || req.url.includes('.mp3')) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(cache => {
        return cache.match(req).then(cached => {
          if (cached) return cached;
          return fetch(req).then(fetched => {
            cache.put(req, fetched.clone());
            return fetched;
          });
        });
      })
    );
    return;
  }

  // CACHE FIRST – STATIC FILES (INCLUDING AUDIO)
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req);
    })
  );
});

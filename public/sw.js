// Minimal service worker — required for the Android "install app" prompt.
// Intentionally no caching (keeps the live app always fresh; avoids stale pages).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("fetch", () => {
  // Network passthrough — let the browser handle requests normally.
});

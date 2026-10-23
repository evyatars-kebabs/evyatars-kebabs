// כל הקבצים של האתר (הדף, הקוד והעיצוב) תמיד נבדקים מול השרת (no-cache), כך שאחרי עדכון
// השחקנים מקבלים גרסה חדשה ועקבית מיד. אם לא השתנה כלום, השרת עונה "ללא שינוי" והטעינה מהירה.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  if (req.method === 'GET' && sameOrigin) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).catch(() => fetch(req)));
    return;
  }
  e.respondWith(fetch(req));
});

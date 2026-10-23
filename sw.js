// הדף עצמו תמיד נבדק מול השרת (no-cache), כך שאחרי עדכון השחקנים מקבלים את הגרסה החדשה מיד.
// אם לא השתנה כלום, השרת עונה "ללא שינוי" והטעינה כמעט מיידית.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const isPage = req.mode === 'navigate' || (req.destination === 'document');
  if (isPage) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).catch(() => fetch(req)));
    return;
  }
  e.respondWith(fetch(req));
});

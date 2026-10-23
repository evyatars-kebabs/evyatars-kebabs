  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // updateViaCache: 'none' - גם קובץ ה-service worker עצמו תמיד נבדק מול השרת
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
        document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
      }).catch(err => {
        console.log('Service Worker registration failed: ', err);
      });
    });
  }

  /* ---------- עדכון אוטומטי כשהאפליקציה פתוחה ----------
     בודקים מדי פעם (ובכל חזרה לאפליקציה) אם index.html בשרת השתנה. אם כן - שומרים
     את ההתקדמות ומרעננים, אבל אף פעם לא באמצע משחק: מחכים לחזרה למסך הבית. */
  (function watchForUpdates() {
    if (location.protocol === 'file:' || !window.fetch) return;
    let known = null, reloading = false;
    const inGame = () => {
      const res = document.getElementById('screen-result');
      return document.body.classList.contains('in-game') || !!(res && res.classList.contains('active'));
    };
    const reloadNow = () => {
      if (reloading) return;
      reloading = true;
      showToast('🔄 יש גרסה חדשה - מעדכנים...');
      const save = typeof saveCloudNow === 'function' ? saveCloudNow() : Promise.resolve();
      Promise.race([save, new Promise(r => setTimeout(r, 2500))]).then(() => setTimeout(() => location.reload(), 900));
    };
    window.kebabUpdateReady = false;
    window.kebabTryUpdate = () => { if (window.kebabUpdateReady && !inGame()) reloadNow(); };
    // הדף וכל קבצי הקוד והעיצוב - שינוי באחד מהם הוא גרסה חדשה
    const files = [location.pathname].concat(
      [...document.querySelectorAll('script[src], link[rel="stylesheet"][href]')]
        .map(e => e.getAttribute('src') || e.getAttribute('href'))
        .filter(u => u && !/^https?:/.test(u)));
    const check = () => {
      if (reloading) return;
      Promise.all(files.map(f => fetch(f, { method: 'HEAD', cache: 'no-store' })
        .then(r => (r.ok ? (r.headers.get('etag') || r.headers.get('last-modified') || '') : ''))
        .catch(() => '')))
        .then(tags => {
          if (tags.some(t => !t)) return;                 // אין חיבור / אין מידע - מנסים בפעם הבאה
          const tag = tags.join('|');
          if (known === null) { known = tag; return; }
          if (tag !== known) { window.kebabUpdateReady = true; window.kebabTryUpdate(); }
        });
    };
    check();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
    setInterval(check, 5 * 60 * 1000);
  })();

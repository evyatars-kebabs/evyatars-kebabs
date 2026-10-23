/* --- הגדרת Firebase --- */
    // ⚠️ החליפו בערכים מ-Firebase Console (Project settings -> Your apps -> Web app).
    // כל עוד הערכים לא הוחלפו המשחקים עובדים כרגיל, רק בלי טבלאות שיאים.
const firebaseConfig = {
  apiKey: "AIzaSyDQUP26lG2qdseogng96R2kWOVIvuawoLg",
  authDomain: "evyatars-kebabs.firebaseapp.com",
  projectId: "evyatars-kebabs",
  storageBucket: "evyatars-kebabs.firebasestorage.app",
  messagingSenderId: "965270391043",
  appId: "1:965270391043:web:6c1fd7c195a7f1c3030136",
  measurementId: "G-YQQE5G7T4G"
};

    let db = null;
    let auth = null;      // Firebase Authentication - חשבונות שחקנים
    let dbProblem = '';   // config | sdk | init - למה אין חיבור לענן
    try {
        if (typeof firebase === 'undefined') {
            dbProblem = 'sdk';
            console.warn("Firebase SDK לא נטען (אינטרנט / חוסם פרסומות?) - טבלאות השיאים כבויות.");
        } else if (Object.values(firebaseConfig).some(v => String(v).startsWith("YOUR_"))) {
            dbProblem = 'config';
            console.warn("firebaseConfig עדיין מכיל ערכי YOUR_... - יש להדביק את ההגדרות מ-Firebase Console.");
        } else {
            if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            if (typeof firebase.auth === 'function') auth = firebase.auth();
        }
    } catch (err) {
        dbProblem = 'init';
        console.error("שגיאה באתחול Firebase:", err);
        db = null;
    }

    /* --- גישה בטוחה ל-localStorage (חלק מהדפדפנים זורקים שגיאה כשהאחסון חסום) --- */
    const store = {
        mem: {},                              // גיבוי בזיכרון כשהאחסון חסום - כך המטבעות עובדים לפחות לאורך הביקור
        get(k) {
            try { const v = window.localStorage.getItem(k); if (v !== null) return v; } catch (e) { /* ignore */ }
            return Object.prototype.hasOwnProperty.call(this.mem, k) ? this.mem[k] : null;
        },
        set(k, v) {
            this.mem[k] = String(v);
            try { window.localStorage.setItem(k, v); } catch (e) { /* ignore */ }
            if (window.kebabSync) window.kebabSync(k);        // שמירה לחשבון בענן (מוגדר בהמשך)
        },
        remove(k) {
            delete this.mem[k];
            try { window.localStorage.removeItem(k); } catch (e) { /* ignore */ }
        }
    };

    function shuffleArray(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    /* --- משתנים גלובליים לטיימרים (מנוקים ב-stopAllGames) --- */
    let triviaTimeout = null;
    let goodsTimeouts = [];

    /* --- שיאים אישיים (מקומי) + שמירה בענן --- */
    const GAME_STATS = [
        ['🍢 תפוס את הקבב', 'kebab_highScore'],
        ['🥷 קבב נינג\'ה', 'kebab_ninjaHighScore'],
        ['🥙 האכל את השוורץ', 'kebab_shvartzHighScore'],
        ['🥫 סידור המדפים', 'kebab_goodsHighScore'],
        ['🍢 קבבים מול קולסקים', 'kebab_kvkHighScore'],
        ['🧠 חידון האוכל', 'kebab_triviaHighScore']
    ];

    function renderProfileStats() {
        const box = document.getElementById('player-stats');
        if (!box) return;
        box.innerHTML = '';
        GAME_STATS.forEach(([label, key]) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-item';
            const l = document.createElement('span');
            l.textContent = label;
            const v = document.createElement('span');
            v.style.cssText = 'color: var(--accent-gold); font-weight: bold;';
            v.textContent = (parseInt(store.get(key)) || 0) + " נק'";
            row.appendChild(l);
            row.appendChild(v);
            box.appendChild(row);
        });
    }

    function saveLocalBest(localKey, score) {
        if (score > (parseInt(store.get(localKey)) || 0)) {
            store.set(localKey, score);
        }
        renderProfileStats();
    }

    const pendingSaves = new Set();     // שמירות בענן שעדיין רצות
    const lbRequestToken = {};          // מונע מתשובה ישנה לדרוס תשובה חדשה

    function saveBestScore(collectionName, score, localKey) {
        saveLocalBest(localKey, score);
        if (!db || score <= 0) return Promise.resolve();

        const userRef = db.collection(collectionName).doc(playerId);
        const p = userRef.get().then(doc => {
            const data = doc.exists ? doc.data() : {};
            const hasScore = typeof data.score === 'number';
            const currentBest = hasScore ? data.score : 0;
            if (!doc.exists || !hasScore || score > currentBest) {
                return userRef.set({
                    name: playerName,
                    score: Math.max(score, currentBest),
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
        }).catch(err => {
            console.error("שגיאה בשמירה בענן (" + collectionName + "):", err.code || '', err.message || err);
        }).then(() => { delete lbCache[collectionName]; pendingSaves.delete(p); });

        pendingSaves.add(p);
        return p;
    }

    const LB_LIMIT = 500;                 // כמה שחקנים מוצגים בכל טבלה
    const LB_CACHE_MS = 60000;            // שומרים תשובה דקה כדי לא לקרוא 500 מסמכים בכל מעבר בין לשוניות
    const lbCache = {};
    const LB_LOCAL_KEY = {
        leaderboard: 'kebab_highScore',
        leaderboard_goods: 'kebab_goodsHighScore', leaderboard_shvartz: 'kebab_shvartzHighScore',
        leaderboard_ninja: 'kebab_ninjaHighScore', leaderboard_kvk: 'kebab_kvkHighScore'
    };

    function loadLeaderboardInto(containerId, collectionName) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const token = (lbRequestToken[containerId] || 0) + 1;
        lbRequestToken[containerId] = token;
        const isStale = () => lbRequestToken[containerId] !== token;

        const showMsg = (text, color, withRetry) => {
            container.innerHTML = '';
            const li = document.createElement('li');
            li.style.cssText = 'text-align: center; padding: 15px; color: ' + color + ';';
            li.textContent = text;
            if (withRetry) {
                li.appendChild(document.createElement('br'));
                const btn = document.createElement('button');
                btn.className = 'sub-tab-btn';
                btn.style.cssText = 'margin-top: 10px; padding: 8px 18px; flex: none;';
                btn.textContent = '🔄 נסו שוב';
                btn.onclick = () => { delete lbCache[collectionName]; loadLeaderboardInto(containerId, collectionName); };
                li.appendChild(btn);
            }
            container.appendChild(li);
        };

        const render = rows => {
            container.innerHTML = '';
            const frag = document.createDocumentFragment();

            const myIdx = rows.findIndex(r => r.id === playerId);
            const myBest = parseInt(store.get(LB_LOCAL_KEY[collectionName])) || 0;
            if (myIdx >= 0 || myBest > 0) {
                const me = document.createElement('li');
                me.className = 'lb-me';
                const a = document.createElement('span');
                const b = document.createElement('small');
                if (myIdx >= 0) { a.textContent = 'המקום שלך: #' + rows[myIdx].rank; b.textContent = 'מתוך ' + rows.length + ' שחקנים'; }
                else { a.textContent = 'עדיין לא ב-' + LB_LIMIT + ' המובילים'; b.textContent = 'השיא שלך: ' + myBest; }
                me.appendChild(a); me.appendChild(b);
                frag.appendChild(me);
            }

            rows.forEach((row, i) => {
                const li = document.createElement('li');
                li.className = 'leaderboard-item' + (row.rank <= 3 ? ' r' + row.rank : '') + (row.id === playerId ? ' me' : '');

                const left = document.createElement('span');
                const strong = document.createElement('strong');
                strong.textContent = row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : '#' + row.rank;
                left.appendChild(strong);
                // textContent (ולא innerHTML) - מונע הזרקת קוד דרך שם השחקן
                left.appendChild(document.createTextNode(' ' + row.name + (row.id === playerId ? ' (אתה)' : '')));

                const right = document.createElement('span');
                right.style.cssText = 'color: var(--accent-gold); font-weight: bold;';
                right.textContent = row.score + " נק'";

                li.appendChild(left);
                li.appendChild(right);
                frag.appendChild(li);
            });
            container.appendChild(frag);
            if (rows.length === 0) showMsg('אין עדיין שיאים. היו הראשונים!', '#b9a38e', false);
        };

        if (!db) {
            const msgs = {
                config: 'טבלת השיאים עדיין לא מחוברת: חסרה הגדרת Firebase בקובץ (firebaseConfig).',
                sdk: 'לא הצלחנו לטעון את שירות הענן. בדקו חיבור לאינטרנט או חוסם פרסומות.',
                init: 'שגיאה בחיבור לענן. פרטים בקונסולת הדפדפן.'
            };
            showMsg(msgs[dbProblem] || 'טבלת השיאים אינה זמינה כרגע', '#f85149', dbProblem === 'sdk');
            return;
        }

        const cached = lbCache[collectionName];
        if (cached && Date.now() - cached.t < LB_CACHE_MS && pendingSaves.size === 0) {
            render(cached.rows);
            return;
        }
        showMsg('טוען נתונים...', '#b9a38e', false);

        // מחכים לשמירות שעדיין בדרך (כדי שהשיא שהרגע נקבע יופיע), ובכל מקרה לא יותר מ-8 שניות
        const fetchData = Promise.allSettled(Array.from(pendingSaves)).then(() =>
            db.collection(collectionName).orderBy('score', 'desc').limit(LB_LIMIT).get());
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));

        Promise.race([fetchData, timeout])
            .then(snapshot => {
                if (isStale()) return;
                const rows = [];
                snapshot.forEach(doc => {
                    const d = doc.data();
                    if (typeof d.score !== 'number') return;
                    const ts = d.timestamp && typeof d.timestamp.toMillis === 'function' ? d.timestamp.toMillis() : Infinity;
                    rows.push({ id: doc.id, name: String(d.name || 'אורח').slice(0, 20), score: d.score, ts });
                });
                // חשבונות שנוצרו לפני התיקון נשארו גם עם רשומת האורח הישנה.
                // מסתירים רשומת אורח (player_...) כשיש חשבון באותו שם עם ניקוד זהה או גבוה יותר.
                const accountBest = {};
                rows.forEach(r => { if (!r.id.startsWith('player_')) accountBest[r.name] = Math.max(accountBest[r.name] || 0, r.score); });
                for (let i = rows.length - 1; i >= 0; i--) {
                    const r = rows[i];
                    if (r.id.startsWith('player_') && r.id !== playerId && accountBest[r.name] !== undefined && accountBest[r.name] >= r.score) rows.splice(i, 1);
                }
                // סדר יציב: ניקוד יורד, ובשוויון - מי שהגיע ראשון, ואז לפי שם
                rows.sort((a, b) => b.score - a.score || a.ts - b.ts || a.name.localeCompare(b.name));
                // שחקנים עם אותו ניקוד חולקים את אותו מקום
                rows.forEach((r, i) => { r.rank = (i > 0 && rows[i - 1].score === r.score) ? rows[i - 1].rank : i + 1; });
                lbCache[collectionName] = { t: Date.now(), rows };
                render(rows);
            })
            .catch(err => {
                if (isStale()) return;
                console.error("שגיאה בטעינת הטבלה (" + collectionName + "):", err.code || '', err.message || err);
                const msg = err.code === 'permission-denied'
                    ? 'אין הרשאה לקרוא את הטבלה (בדקו את כללי Firestore)'
                    : 'לא הצלחנו לטעון את הטבלה. בדקו את החיבור לאינטרנט.';
                showMsg(msg, '#f85149', true);
            });
    }

    /* --- עצירת כל הטיימרים של כל המשחקים --- */
    function stopAllGames() {
        clearInterval(catchInterval);
        clearTimeout(kebabTimeout);
        clearInterval(goodsInterval);
        goodsTimeouts.forEach(clearTimeout);
        goodsTimeouts = [];
        clearTimeout(triviaTimeout);
        if (typeof svStop === 'function') svStop();
        if (typeof njStop === 'function') njStop();
        if (typeof kvStop === 'function') kvStop();
        const area = document.getElementById('game-area');
        if (area) area.innerHTML = '';
    }

    /* --- משתנים גלובליים ומזהה שחקן ייחודי --- */
    let playerId = store.get('kebab_playerId');
    if (!playerId) {
        playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        store.set('kebab_playerId', playerId);
    }

    let playerName = store.get('kebab_playerName') || 'אורח';

    document.getElementById('player-name-input').value = playerName;
    renderProfileStats();

    /* ============================================================
       חשבון שחקן: שם משתמש + סיסמה
       מאחורי הקלעים זה Firebase Authentication (אימייל + סיסמה): שם המשתמש
       מקודד לכתובת פנימית שהשחקן לא רואה, והמזהה של החשבון (uid) הוא מזהה השחקן.
       ההתקדמות (מטבעות, סקינים, שיאים) נשמרת במסמך players/{uid}.
       ============================================================ */
    const ACCOUNT_KEY = 'kebab_account';           // שם המשתמש שמחובר במכשיר הזה
    const SYNC_DIRTY_KEY = 'kebab_sync_dirty';     // יש שינויים שעוד לא נשמרו בענן
    // kebab_lbId = מזהה השחקן בטבלאות השיאים. חשבון חדש שומר את המזהה שהיה לו כאורח,
    // כך שהשיאים שלו ממשיכים באותה רשומה ולא נוצרת רשומה כפולה.
    const LB_ID_KEY = 'kebab_lbId';
    const PROGRESS_KEYS = ['kebab_lbId', 'kebab_coins', 'kebab_skins_owned', 'kebab_skin_equipped', 'kebab_playerName',
        'kebab_highScore', 'kebab_goodsHighScore', 'kebab_shvartzHighScore', 'kebab_ninjaHighScore',
        'kebab_triviaHighScore', 'kebab_kvkHighScore', 'kebab_kvk_tutorial_done', 'kebab_daily', 'kebab_skin_variant', 'kebab_deal'];
    const USERNAME_RE = /^[\p{L}\p{N}_]{3,15}$/u;
    const PASSWORD_RE = /^[\p{L}\p{N}]{6,30}$/u;
    const LB_BEST = [['leaderboard', 'kebab_highScore'], ['leaderboard_goods', 'kebab_goodsHighScore'],
        ['leaderboard_shvartz', 'kebab_shvartzHighScore'], ['leaderboard_ninja', 'kebab_ninjaHighScore'], ['leaderboard_kvk', 'kebab_kvkHighScore']];

    let accountUser = null;         // משתמש Firebase מחובר
    let cloudReady = false;         // ההתקדמות מהענן כבר נטענה
    let cloudTimer = null;
    let applyingCloud = false;      // בזמן טעינה מהענן לא מסמנים שינויים
    let accountMode = 'signup';     // לשונית פעילה: signup / login
    let syncState = '';

    // שם משתמש -> כתובת פנימית (ASCII בלבד, כדי שגם שמות בעברית יעבדו)
    function usernameToEmail(username) {
        const bytes = new TextEncoder().encode(username.trim().toLowerCase());
        let hex = '';
        bytes.forEach(b => { hex += b.toString(16).padStart(2, '0'); });
        return 'u' + hex + '@players.evyatars-kebabs.app';
    }

    function collectProgress() {
        const data = {};
        PROGRESS_KEYS.forEach(k => { const v = store.get(k); if (v !== null) data[k] = v; });
        return data;
    }

    function refreshAfterProgress() {
        if (typeof renderDaily === 'function') renderDaily();
        playerName = store.get('kebab_playerName') || 'אורח';
        document.getElementById('player-name-input').value = playerName;
        renderProfileStats();
        renderCoinBadges();
        const shop = document.getElementById('screen-shop');
        if (shop && shop.classList.contains('active')) renderShop();
        Object.keys(lbCache).forEach(k => { delete lbCache[k]; });
    }

    function applyProgress(data) {
        applyingCloud = true;
        PROGRESS_KEYS.forEach(k => { if (data && Object.prototype.hasOwnProperty.call(data, k)) store.set(k, data[k]); else store.remove(k); });
        applyingCloud = false;
        refreshAfterProgress();
    }

    // נקרא מכל store.set: שינוי בהתקדמות של שחקן מחובר נשמר לענן אחרי רגע
    window.kebabSync = function (k) {
        if (applyingCloud || !PROGRESS_KEYS.includes(k) || !store.get(ACCOUNT_KEY)) return;
        store.mem[SYNC_DIRTY_KEY] = '1';
        try { window.localStorage.setItem(SYNC_DIRTY_KEY, '1'); } catch (e) { /* ignore */ }
        if (!accountUser || !cloudReady) return;
        clearTimeout(cloudTimer);
        cloudTimer = setTimeout(saveCloudNow, 1500);
        setSyncState('saving');
    };

    function saveCloudNow() {
        clearTimeout(cloudTimer);
        cloudTimer = null;
        if (!accountUser || !cloudReady || !db) return Promise.resolve();
        const uid = accountUser.uid;
        return db.collection('players').doc(uid).set({
            username: store.get(ACCOUNT_KEY) || '',
            data: collectProgress(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            if (accountUser && accountUser.uid === uid) { store.remove(SYNC_DIRTY_KEY); setSyncState('saved'); }
        }).catch(err => {
            console.error('שגיאה בשמירת החשבון:', err.code || '', err.message || err);
            setSyncState(err.code === 'permission-denied' ? 'denied' : 'error');
        });
    }
    document.addEventListener('visibilitychange', () => { if (document.hidden && cloudTimer) saveCloudNow(); });
    window.addEventListener('pagehide', () => { if (cloudTimer) saveCloudNow(); });

    // שיאים מקומיים עוברים לטבלאות תחת מזהה החשבון
    function pushBestScores() {
        LB_BEST.forEach(([col, key]) => {
            const best = parseInt(store.get(key)) || 0;
            if (best > 0) saveBestScore(col, best, key);
        });
    }

    // מזהה הטבלאות של החשבון: מה שנשמר בחשבון, ואם אין (חשבונות ישנים) - מזהה החשבון
    function adoptLeaderboardId(user) {
        if (!store.get(LB_ID_KEY)) store.set(LB_ID_KEY, user.uid);
        playerId = store.get(LB_ID_KEY);
        store.set('kebab_playerId', playerId);
        Object.keys(lbCache).forEach(k => { delete lbCache[k]; });
    }

    function onAccountSignedIn(user) {
        accountUser = user;
        cloudReady = false;
        setSyncState('loading');
        renderAccountUI();
        db.collection('players').doc(user.uid).get().then(doc => {
            if (!accountUser || accountUser.uid !== user.uid) return;
            const savedHere = store.get(ACCOUNT_KEY);
            const cloud = doc.exists ? doc.data() : null;
            if (cloud && cloud.username && !savedHere) store.set(ACCOUNT_KEY, cloud.username);
            // יש שינויים מקומיים שלא נשמרו (למשל שיחקו בלי אינטרנט) - הם עולים לענן במקום להידרס
            const localNewer = store.get(SYNC_DIRTY_KEY) === '1' && savedHere && cloud && cloud.username === savedHere;
            if (cloud && cloud.data && !localNewer) applyProgress(cloud.data);
            adoptLeaderboardId(user);
            cloudReady = true;
            if (!cloud || !cloud.data || localNewer) saveCloudNow(); else setSyncState('saved');
            pushBestScores();
            renderAccountUI();
        }).catch(err => {
            console.error('שגיאה בטעינת החשבון:', err.code || '', err.message || err);
            setSyncState(err.code === 'permission-denied' ? 'denied' : 'error');
            renderAccountUI();
        });
    }

    function resetToGuest() {
        applyingCloud = true;
        PROGRESS_KEYS.forEach(k => store.remove(k));
        store.remove(ACCOUNT_KEY);
        store.remove(SYNC_DIRTY_KEY);
        applyingCloud = false;
        playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        store.set('kebab_playerId', playerId);
        refreshAfterProgress();
    }

    // מתחילים להאזין רק אחרי שכל קבצי הקוד נטענו (הקולבק משתמש בפונקציות מקבצים אחרים)
    if (auth) document.addEventListener('DOMContentLoaded', () => {
        auth.onAuthStateChanged(user => {
            if (user) onAccountSignedIn(user);
            else {
                accountUser = null;
                cloudReady = false;
                // החשבון נותק מבחוץ (למשל נמחק) - המכשיר חוזר להיות אורח
                if (store.get(ACCOUNT_KEY)) resetToGuest();
                renderAccountUI();
            }
        });
    });

    function accountError(err) {
        const code = (err && err.code) || '';
        if (code === 'auth/email-already-in-use') return 'שם המשתמש הזה כבר תפוס';
        if (['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/invalid-email'].includes(code))
            return 'שם משתמש או סיסמה שגויים';
        if (code === 'auth/weak-password') return 'הסיסמה חלשה מדי (לפחות 6 תווים)';
        if (code === 'auth/too-many-requests') return 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות';
        if (code === 'auth/network-request-failed') return 'אין חיבור לאינטרנט';
        // בעיות הגדרה בשרת - לא באשמת השחקן
        if (['auth/configuration-not-found', 'auth/operation-not-allowed', 'auth/admin-restricted-operation'].includes(code))
            return 'החשבונות עדיין לא הופעלו בשרת. נסו שוב מאוחר יותר';
        if (code.startsWith('auth/requests-from-referer') || code === 'auth/api-key-not-valid' || code === 'auth/invalid-api-key')
            return 'האתר הזה לא מורשה להשתמש בחשבונות';
        return 'משהו השתבש. נסו שוב (' + (code || 'שגיאה לא ידועה') + ')';
    }

    function setAccountMsg(text, ok) {
        const m = document.getElementById('account-msg');
        if (!m) return;
        m.textContent = text;
        m.style.color = ok ? '#4ad66d' : '#ff6a5c';
    }

    function readAccountForm() {
        const username = document.getElementById('acc-user').value.trim();
        const password = document.getElementById('acc-pass').value;
        if (!USERNAME_RE.test(username)) { setAccountMsg('שם משתמש: 3-15 אותיות, מספרים או _'); return null; }
        if (!PASSWORD_RE.test(password)) { setAccountMsg('סיסמה: לפחות 6 אותיות או מספרים'); return null; }
        return { username, password };
    }

    function submitAccount() {
        if (!auth || !db) { setAccountMsg('החשבונות לא זמינים כרגע (אין חיבור לשרת)'); return; }
        const f = readAccountForm();
        if (!f) { sfx.err(); return; }
        const btn = document.getElementById('acc-submit');
        btn.disabled = true;
        setAccountMsg('רגע...', true);
        if (accountMode === 'signup') {
            // החשבון החדש מקבל את ההתקדמות שכבר יש במכשיר
            store.set(ACCOUNT_KEY, f.username);
            store.set(LB_ID_KEY, playerId);                // השיאים ממשיכים ברשומה של האורח
            auth.createUserWithEmailAndPassword(usernameToEmail(f.username), f.password).then(() => {
                // שחקן שעדיין "אורח" מקבל את שם המשתמש כשם בטבלאות
                if (!store.get('kebab_playerName') || playerName === 'אורח') {
                    playerName = f.username;
                    store.set('kebab_playerName', f.username);
                    document.getElementById('player-name-input').value = playerName;
                }
                sfx.buy(); confettiBurst(30);
            }).catch(err => {
                console.error('הרשמה נכשלה:', err.code || '', err.message || err);
                store.remove(ACCOUNT_KEY);
                store.remove(LB_ID_KEY);
                btn.disabled = false;
                setAccountMsg(accountError(err));
                sfx.err();
            });
        } else {
            const guestHasProgress = getCoins() > 0 || getOwnedSkins().size > 1;
            if (guestHasProgress && !confirm('ההתקדמות של האורח במכשיר הזה תוחלף בהתקדמות של החשבון. להמשיך?')) { btn.disabled = false; setAccountMsg(''); return; }
            auth.signInWithEmailAndPassword(usernameToEmail(f.username), f.password).then(() => {
                store.set(ACCOUNT_KEY, f.username);
                store.remove(SYNC_DIRTY_KEY);
                sfx.good();
            }).catch(err => {
                console.error('התחברות נכשלה:', err.code || '', err.message || err);
                btn.disabled = false;
                setAccountMsg(accountError(err));
                sfx.err();
            });
        }
    }

    function accountLogout() {
        if (!accountUser) return;
        if (!confirm('להתנתק? ההתקדמות שמורה בחשבון ותחזור כשתתחברו שוב.')) return;
        const done = () => auth.signOut().then(() => { resetToGuest(); renderAccountUI(); });
        (cloudTimer || store.get(SYNC_DIRTY_KEY) === '1' ? saveCloudNow() : Promise.resolve()).then(done, done);
    }

    function setSyncState(s) {
        syncState = s;
        const el = document.getElementById('account-sync');
        if (!el) return;
        el.textContent = { loading: '⏳ טוען את ההתקדמות...', saving: '⏳ שומר...', saved: '☁️ ההתקדמות שמורה בחשבון', error: '⚠️ השמירה נכשלה - ננסה שוב בשינוי הבא',
                          denied: '⚠️ השמירה בענן חסומה כרגע בשרת. ההתקדמות נשמרת במכשיר בינתיים' }[s] || '';
    }

    function renderAccountUI() {
        const box = document.getElementById('account-box');
        if (!box) return;
        box.innerHTML = '';
        const add = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; box.appendChild(e); return e; };
        if (accountUser) {
            add('div', 'account-title', '🔐 מחובר בתור ' + (store.get(ACCOUNT_KEY) || ''));
            const sync = add('div', 'account-sync'); sync.id = 'account-sync';
            setSyncState(syncState);
            add('div', 'account-text', 'המטבעות, הסקינים והשיאים שלך נשמרים בחשבון. אפשר להתחבר איתו מכל מכשיר.');
            const out = add('button', 'btn secondary', 'התנתקות');
            out.onclick = accountLogout;
            return;
        }
        add('div', 'account-title', '🔐 חשבון שחקן');
        add('div', 'account-text', 'צרו חשבון כדי לשמור מטבעות, סקינים ושיאים - ולהמשיך לשחק מכל מכשיר.');
        if (!auth) { add('div', 'account-msg', 'החשבונות לא זמינים כרגע (אין חיבור לשרת).').style.color = '#ff6a5c'; return; }
        const tabs = add('div', 'account-tabs');
        [['signup', 'הרשמה'], ['login', 'התחברות']].forEach(([mode, label]) => {
            const b = document.createElement('button');
            b.textContent = label;
            b.className = accountMode === mode ? 'active' : '';
            b.onclick = () => { accountMode = mode; renderAccountUI(); };
            tabs.appendChild(b);
        });
        const u = add('input'); u.type = 'text'; u.id = 'acc-user'; u.maxLength = 15; u.placeholder = 'שם משתמש'; u.autocomplete = 'username';
        u.setAttribute('autocapitalize', 'none');
        const pw = add('input'); pw.type = 'password'; pw.id = 'acc-pass'; pw.maxLength = 30; pw.placeholder = 'סיסמה';
        pw.autocomplete = accountMode === 'signup' ? 'new-password' : 'current-password';
        if (accountMode === 'signup') add('div', 'account-hint', 'שם משתמש: 3-15 תווים · סיסמה: לפחות 6 אותיות או מספרים');
        pw.addEventListener('keydown', e => { if (e.key === 'Enter') submitAccount(); });
        const go = add('button', 'btn', accountMode === 'signup' ? 'יצירת חשבון' : 'התחברות');
        go.id = 'acc-submit';
        go.onclick = submitAccount;
        add('div', 'account-msg').id = 'account-msg';
    }
    renderAccountUI();


	/* --- החלפה בין טבלאות השיאים בתוך המסך --- */
	const LB_TABS = {
		main:    () => loadLeaderboard(),
		goods:   () => loadGoodsLeaderboard(),
		shvartz: () => loadShvartzLeaderboard(),
		ninja:   () => loadNinjaLeaderboard(),
		kvk:     () => loadKvkLeaderboard()
	};

	function switchLeaderboardTab(type) {
		if (!LB_TABS[type]) type = 'main';
		Object.keys(LB_TABS).forEach(k => {
			document.getElementById('sub-btn-' + k).classList.toggle('active', k === type);
			document.getElementById('sub-screen-' + k).style.display = (k === type) ? 'block' : 'none';
		});
		LB_TABS[type]();
	}

	/* --- ניווט בין מסכים ראשיים --- */
	function switchTab(screenId) {
			stopAllGames();
		if (typeof closeSkinModal === 'function') closeSkinModal();
		if (screenId !== 'result') creditPendingCoins();
		if (window.kebabUpdateReady && ['home', 'shop', 'profile', 'leaderboard'].includes(screenId)) setTimeout(() => window.kebabTryUpdate(), 50);
		document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
		document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));

		const targetScreen = document.getElementById('screen-' + screenId);
		const targetBtn = document.getElementById('btn-' + screenId);

		if (targetScreen) targetScreen.classList.add('active');
		if (targetBtn) targetBtn.classList.add('active');
		document.body.classList.toggle('in-game', ['catch', 'trivia', 'goods', 'shvartz', 'ninja', 'kvk'].includes(screenId));

		// בעת מעבר למסך השיאים, מציגים את הטאב שנבחר כעת (ברירת מחדל: המשחק הראשי)
		if (screenId === 'shop') renderShop();
		if (screenId === 'home') renderDaily();

		if (screenId === 'leaderboard') {
			const active = document.querySelector('.sub-tab-btn.active');
			const type = active ? active.id.replace('sub-btn-', '') : 'main';
			(LB_TABS[type] || LB_TABS.main)();
		}
	}

    /* --- שמירת שם שחקן --- */
    function savePlayerName() {
        const inputVal = document.getElementById('player-name-input').value.trim().slice(0, 20);
        playerName = inputVal !== '' ? inputVal : 'אורח';
        document.getElementById('player-name-input').value = playerName;
        store.set('kebab_playerName', playerName);

        // עדכון השם בכל טבלאות השיאים שבהן השחקן כבר קיים
        if (db) {
            ['leaderboard', 'leaderboard_goods', 'leaderboard_shvartz', 'leaderboard_ninja', 'leaderboard_kvk'].forEach(col => {
                const ref = db.collection(col).doc(playerId);
                ref.get().then(doc => {
                    if (doc.exists && typeof doc.data().score === 'number') return ref.update({ name: playerName });
                }).catch(err => console.error("שגיאה בעדכון שם (" + col + "):", err));
            });
        }

        Object.keys(lbCache).forEach(k => { delete lbCache[k]; });

        const msg = document.getElementById('name-save-msg');
        msg.style.display = 'block';
        setTimeout(() => { msg.style.display = 'none'; }, 2000);
    }

    /* --- שיא "תפוס את הקבב" --- */
    function checkHighScore(score) {
        saveBestScore('leaderboard', score, 'kebab_highScore');
    }

    function loadLeaderboard() {
        loadLeaderboardInto('leaderboard-container', 'leaderboard');
    }


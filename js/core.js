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
        ['🐢 אתגר צבי הנינג\'ה', 'kebab_turtlesHighScore'],
        ['🛵 שליח הקבבים', 'kebab_dlvHighScore'],
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
            window.__newBest = { key: localKey, t: Date.now() };        // בשביל בונוס ה-XP על שיא אישי
        }
        renderProfileStats();
    }

    const pendingSaves = new Set();     // שמירות בענן שעדיין רצות
    const lbRequestToken = {};          // מונע מתשובה ישנה לדרוס תשובה חדשה

    // שמירת שיא בלי לקרוא קודם מהשרת: כותבים רק כשהשיא המקומי השתפר (או force - למשל בהתחברות לחשבון).
    // הכללים בשרת לא מאפשרים לניקוד לרדת, אז אם בשרת כבר יש שיא גבוה יותר הכתיבה פשוט נדחית.
    // שמירה שנכשלה (אין חיבור / נגמרה המכסה) נשמרת בצד ונשלחת שוב בפתיחה הבאה של האפליקציה.
    const LB_PENDING_KEY = 'kebab_lbPending';
    function lbPending() { try { return JSON.parse(store.get(LB_PENDING_KEY) || '{}') || {}; } catch (e) { return {}; } }
    function saveBestScore(collectionName, score, localKey, force) {
        const prevBest = parseInt(store.get(localKey)) || 0;
        saveLocalBest(localKey, score);
        if (!db || score <= 0 || (!force && score <= prevBest)) return Promise.resolve();

        const userRef = db.collection(collectionName).doc(playerId);
        const entry = { name: playerName, score, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
        // שמירה אחת עם הסקין, המטבעות, הצוות, הרמה והשליטה; אם הכללים בשרת לא מאפשרים חלק מהם - מורידים אותם אחד אחד, ובסוף שומרים רק את השיא
        const attempt = extra => userRef.set(Object.assign({}, entry, extra), { merge: true }).catch(err => {
            if (err && err.code === 'permission-denied') {
                const less = lbDropNext(extra);
                if (less) return attempt(less);
                if ('skin' in extra) return attempt({});
            }
            throw err;
        });
        const p = attempt(lbExtras())
            .then(() => {
                const pend = lbPending(); delete pend[collectionName]; store.set(LB_PENDING_KEY, JSON.stringify(pend));
                lbPatchCache(collectionName, { score, name: playerName, ts: Date.now() });
                delete profileCache[playerId];
            })
            .catch(err => {
                if (err && err.code === 'permission-denied') return;      // בשרת כבר יש שיא גבוה יותר
                console.error("שגיאה בשמירה בענן (" + collectionName + "):", err.code || '', err.message || err);
                const pend = lbPending(); pend[collectionName] = Math.max(pend[collectionName] || 0, score); store.set(LB_PENDING_KEY, JSON.stringify(pend));
            }).then(() => { pendingSaves.delete(p); });

        pendingSaves.add(p);
        return p;
    }
    function retryPendingScores() {
        const pend = lbPending();
        Object.entries(pend).forEach(([col, sc]) => { if (LB_LOCAL_KEY[col]) saveBestScore(col, sc, LB_LOCAL_KEY[col], true); });
    }
    // מעדכנים את הטבלה שכבר נטענה במקום לטעון אותה שוב (חוסך עד 100 קריאות אחרי כל משחק)
    function lbPatchCache(col, upd) {
        const lb = lbCache[col];
        if (!lb) return;
        let row = lb.rows.find(r => r.id === playerId);
        if (row) { if (upd.score !== undefined && upd.score < row.score) delete upd.score; Object.assign(row, upd); }
        else if (upd.score !== undefined) {
            const last = lb.rows[lb.rows.length - 1];
            if (lb.rows.length >= LB_LIMIT && last && upd.score <= last.score) return;   // לא נכנס ל-100 המובילים
            lb.rows.push(Object.assign({ id: playerId, name: playerName, skin: currentSkinId(), coins: getCoins(), team: lbTeam(), ts: Date.now(),
                                         mst: typeof mstPublic === 'function' ? mstPublic() : null },
                                       typeof xpPublic === 'function' ? xpPublic() : {}, upd));
        } else return;
        lbSortRows(lb.rows);
        if (lb.rows.length > LB_LIMIT) lb.rows.length = LB_LIMIT;
    }
    // סדר יציב: ניקוד יורד, ובשוויון - מי שהגיע ראשון, ואז לפי שם. שחקנים עם אותו ניקוד חולקים מקום
    function lbSortRows(rows) {
        rows.sort((a, b) => b.score - a.score || a.ts - b.ts || a.name.localeCompare(b.name));
        rows.forEach((r, i) => { r.rank = (i > 0 && rows[i - 1].score === r.score) ? rows[i - 1].rank : i + 1; });
    }

    /* --- הסקין של השחקן בטבלאות השיאים --- */
    function currentSkinId() {
        return typeof getEquippedSkinId === 'function' ? getEquippedSkinId() : 'classic';
    }
    // הסקין, המטבעות, הצוות באירוע, הרמה והשליטה נשמרים ליד השיא. אם הכללים בשרת עוד לא מאפשרים חלק מהם - שומרים בלעדיהם.
    // הסדר: קודם מוותרים על החדשים ביותר
    const LB_OPTIONAL = [['team'], ['mst'], ['lvl', 'title', 'frame'], ['coins']];
    const lbMst = m => typeof mstOk === 'function' && mstOk(m) ? m : null;
    const lbTeam = () => (typeof tmntState === 'function' ? tmntState().team : null);
    const lbExtras = () => {
        const d = { skin: currentSkinId(), coins: getCoins() };
        const team = lbTeam();
        if (team) d.team = team;
        if (typeof xpPublic === 'function') { const x = xpPublic(); d.lvl = x.lvl; d.title = x.title; d.frame = x.frame; }   // רמה, תואר ומסגרת
        if (typeof mstPublic === 'function') d.mst = mstPublic();                                                      // דרגות השליטה
        return d;
    };
    // אחרי דחייה: אותם נתונים בלי הקבוצה הבאה ברשימה (או null אם לא נשאר על מה לוותר).
    // לא זוכרים את הדחייה לשאר הכתיבות: דחייה יכולה לבוא גם מסיבה אחרת (ניקוד נמוך מזה שבשרת, או עדכון של רשומה שלא קיימת),
    // ואז שדה תקין היה נעלם מכל הטבלאות עד סוף הביקור
    function lbDropNext(data) {
        const g = LB_OPTIONAL.find(g => g[0] in data);
        if (!g) return null;
        const d = Object.assign({}, data);
        g.forEach(k => delete d[k]);
        return d;
    }
    // מחזיר את הנתונים שנשמרו בפועל
    function lbWriteExtras(write) {
        // כתיבה שנדחתה מנסה שוב בלי השדה החדש ביותר
        const tryWrite = data => write(data).then(() => data, err => {
            const less = err && err.code === 'permission-denied' ? lbDropNext(data) : null;
            if (less) return tryWrite(less);
            throw err;
        });
        return tryWrite(lbExtras());
    }
    function saveLbSkin(ref) {
        return lbWriteExtras(d => ref.set(d, { merge: true }))
            .catch(err => console.warn('לא נשמר הסקין בטבלה:', err.code || err.message || err));
    }
    // אחרי החלפת סקין, שינוי במטבעות או פתיחת האפליקציה - מעדכנים את כל הטבלאות שבהן השחקן כבר מופיע.
    // update בלי קריאה מראש: בטבלה שהשחקן לא נמצא בה העדכון פשוט נכשל (not-found)
    let lbSkinTimer = null, lbPartialTried = null;
    function syncLeaderboardSkin(delay) {
        clearTimeout(lbSkinTimer);
        lbSkinTimer = setTimeout(() => {
            if (!db) return;
            const xp = typeof xpPublic === 'function' ? xpPublic() : {};
            const mark = playerId + '|' + currentSkinId() + '|' + getCoins() + '|' + (lbTeam() || '') + '|' + [xp.lvl, xp.title, xp.frame].join('/') +
                         '|' + (typeof mstPublic === 'function' ? mstPublic() : '');
            // סימון חלקי (השרת דחה שדות) - מנסים שוב פעם אחת בכל פתיחה של האפליקציה, לא בכל שינוי
            const last = store.get('kebab_lbSkin');
            if (last === mark || (last === mark + '|partial' && lbPartialTried === mark)) return;
            lbPartialTried = mark;
            // רק טבלאות שהשחקן כבר שיחק בהן: עדכון של רשומה שלא קיימת נדחה בשרת כ-permission-denied (ולא not-found)
            const full = Object.keys(lbExtras()).length;
            let partial = false;
            const jobs = Object.keys(LB_LOCAL_KEY).filter(col => (parseInt(store.get(LB_LOCAL_KEY[col])) || 0) > 0).map(col => {
                const ref = db.collection(col).doc(playerId);
                return lbWriteExtras(d => ref.update(d)).then(saved => {
                    if (Object.keys(saved).length < full) partial = true;
                    const row = lbCache[col] && lbCache[col].rows.find(r => r.id === playerId);
                    if (row) Object.assign(row, saved);                 // מעדכנים את הטבלה השמורה בלי לטעון אותה שוב
                }, err => { if (!err || !['not-found', 'permission-denied'].includes(err.code)) throw err; });
            });
            // אם השרת דחה חלק מהשדות - נשמר סימון חלקי, כדי לנסות שוב בפתיחה הבאה (למשל אחרי עדכון הכללים)
            Promise.all(jobs).then(() => { store.set('kebab_lbSkin', mark + (partial ? '|partial' : '')); delete profileCache[playerId]; })
                .catch(err => console.warn('לא עודכן הסקין בטבלאות:', err.code || err.message || err));
        }, delay === undefined ? 1500 : delay);
    }
    // תמונה קטנה של הפנים של הסקין (נשמרת לכל סקין פעם אחת)
    const lbAvatarCache = {};
    function lbAvatar(id) {
        if (typeof skinById !== 'function' || typeof getPreview !== 'function') return null;
        if (!SV_SKINS.some(x => x.id === id)) id = 'classic';
        if (!lbAvatarCache[id]) {
            const cv = document.createElement('canvas');
            cv.width = 84; cv.height = 84;
            try { cv.getContext('2d').drawImage(getPreview(skinById(id)), 60, 66, 240, 240, 0, 0, 84, 84); } catch (e) { return null; }
            lbAvatarCache[id] = cv.toDataURL();
        }
        return lbAvatarCache[id];
    }

    /* --- פרופיל שחקן: השיאים שלו בכל המשחקים --- */
    const PROFILE_BOARDS = [
        ['leaderboard_delivery', '🛵 שליח הקבבים'], ['leaderboard_ninja', '🥷 קבב נינג\'ה'], ['leaderboard_shvartz', '🥙 האכל את השוורץ'],
        ['leaderboard_goods', '🥫 סידור המדפים'], ['leaderboard_kvk', '🍢 קבבים מול קולסקים'], ['leaderboard', '🍢 תפוס את הקבב']
    ];
    const profileCache = {};
    // המקום בטבלה לשחקן מחוץ לטבלה שנטענה: כמה שחקנים עם ניקוד גבוה יותר (+1).
    // ספירה דרך ה-REST של Firestore (ב-SDK שבשימוש אין ספירה) - עולה קריאה אחת בלבד
    function countAbove(col, score) {
        const url = 'https://firestore.googleapis.com/v1/projects/' + firebaseConfig.projectId +
            '/databases/(default)/documents:runAggregationQuery?key=' + firebaseConfig.apiKey;
        const body = { structuredAggregationQuery: {
            aggregations: [{ alias: 'n', count: {} }],
            structuredQuery: { from: [{ collectionId: col }],
                where: { fieldFilter: { field: { fieldPath: 'score' }, op: 'GREATER_THAN', value: { integerValue: String(Math.floor(score)) } } } } } };
        return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            .then(r => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
            .then(j => {
                const res = (Array.isArray(j) ? j : [j]).find(x => x && x.result);
                const n = res && res.result.aggregateFields && res.result.aggregateFields.n;
                return n ? parseInt(n.integerValue) + 1 : null;
            });
    }
    // known = השורה שעליה לחצו ({ col, score, rank, coins }) - לא צריך לקרוא אותה שוב.
    // מחזיר { list: [{ label, score, rank }], coins }
    function getPlayerBests(id, known) {
        const cached = profileCache[id];
        if (cached && Date.now() - cached.t < LB_CACHE_MS) return Promise.resolve(cached.data);
        const me = id === playerId;
        let coins = me ? getCoins() : (known && typeof known.coins === 'number' ? known.coins : null);
        const jobs = PROFILE_BOARDS.map(([col, label]) => {
            if (known && known.col === col) return Promise.resolve({ label, score: known.score, rank: known.rank });
            const lb = lbCache[col];
            const fresh = lb && Date.now() - lb.t < LB_CACHE_MS;
            const row = fresh ? lb.rows.find(r => r.id === id) : null;
            if (row) { if (coins === null && typeof row.coins === 'number') coins = row.coins; return Promise.resolve({ label, score: row.score, rank: row.rank }); }
            const score = me ? Promise.resolve(parseInt(store.get(LB_LOCAL_KEY[col])) || 0)
                : !db ? Promise.resolve(null)
                : db.collection(col).doc(id).get({ source: 'server' }).then(doc => {
                    const d = doc.exists ? doc.data() : {};
                    if (coins === null && typeof d.coins === 'number') coins = d.coins;
                    return typeof d.score === 'number' ? d.score : 0;
                });
            return score.then(sc => {
                if (!(sc > 0)) return { label, score: sc, rank: null };
                return countAbove(col, sc).catch(() => null).then(rank => ({ label, score: sc, rank }));
            }).catch(() => ({ label, score: null, rank: null }));
        });
        return Promise.all(jobs).then(list => {
            const data = { list, coins };
            if (list.every(x => x.score !== null && (!(x.score > 0) || x.rank))) profileCache[id] = { t: Date.now(), data };
            return data;
        });
    }

    const LB_LIMIT = 100;                 // כמה שחקנים מוצגים בכל טבלה
    const LB_CACHE_MS = 300000;           // שומרים תשובה 5 דקות כדי לא לקרוא את כל הטבלה בכל מעבר בין לשוניות
    const lbCache = {};
    const lbInflight = {};             // טעינות טבלה שעדיין בדרך
    const LB_LOCAL_KEY = {
        leaderboard_delivery: 'kebab_dlvHighScore', leaderboard: 'kebab_highScore', leaderboard_turtles: 'kebab_turtlesHighScore',
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

        // תג דרגת השליטה של השחקן במשחק של הטבלה הזאת (מארד ומעלה)
        const mstIdx = typeof MST_GAMES !== 'undefined' ? MST_GAMES.findIndex(g => g.col === collectionName) : -1;
        const lbMstBadge = (row, size) => {
            const m = row.id === playerId && typeof mstPublic === 'function' ? mstPublic() : row.mst;
            const r = mstIdx >= 0 && m ? +m[mstIdx] : 0;
            if (!r) return null;
            const b = mstBadge(r, size); b.classList.add('lb-mst');
            return b;
        };
        const makeRow = row => {
            const li = document.createElement('li');
            li.className = 'leaderboard-item' + (row.rank && row.rank <= 3 ? ' r' + row.rank : '') + (row.id === playerId ? ' me' : '');
            li.onclick = () => openPlayerModal({ id: row.id, name: safeName(row.name), skin: row.id === playerId ? currentSkinId() : row.skin,
                                                 lvl: row.lvl, title: row.title, frame: row.frame, mst: row.mst,
                                                 known: row.rank ? { col: collectionName, score: row.score, rank: row.rank, coins: row.coins } : null });

            const left = document.createElement('span');
            const strong = document.createElement('strong');
            strong.textContent = !row.rank ? '#…' : row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : '#' + row.rank;
            left.appendChild(strong);
            const me = row.id === playerId, xp = me && typeof xpPublic === 'function' ? xpPublic() : row;
            const av = lbAvatar(me ? currentSkinId() : row.skin);
            if (av) {
                const wrap = document.createElement('span');
                wrap.className = 'lb-av' + (xp.frame ? ' fr-' + xp.frame : '');          // מסגרת מהרמות
                const img = document.createElement('img');
                img.className = 'lb-skin'; img.src = av; img.alt = ''; img.loading = 'lazy';
                wrap.appendChild(img);
                if (typeof xpOrbit === 'function') xpOrbit(wrap, xp.frame, xp.lvl || 0, 30);
                if (xp.lvl) { const b = document.createElement('span'); b.className = 'lb-lvl'; b.textContent = xp.lvl; wrap.appendChild(b); }
                left.appendChild(wrap);
            }
            // textContent (ולא innerHTML) - מונע הזרקת קוד דרך שם השחקן
            left.appendChild(document.createTextNode(' ' + safeName(row.name) + (row.id === playerId ? ' (אתה)' : '')));
            const mb = lbMstBadge(row, 18);                                                  // דרגת השליטה במשחק של הטבלה
            if (mb) left.appendChild(mb);
            // הצוות שהשחקן בחר באירוע (מוצג כל עוד האירוע על המסך)
            const team = row.id === playerId ? lbTeam() : row.team;
            if (team && typeof tmntVisible === 'function' && tmntVisible()) {
                const chip = document.createElement('span');
                chip.className = 'lb-team lb-team-' + team;
                chip.textContent = team === 'a' ? '🐀 ספלינטר' : '⚔️ שרדר';
                left.appendChild(chip);
            }

            const right = document.createElement('span');
            right.style.cssText = 'color: var(--accent-gold); font-weight: bold;';
            right.textContent = row.score + " נק'";

            li.appendChild(left);
            li.appendChild(right);
            return { li, strong };
        };
        // במת מנצחים: מקום 2 משמאל, 1 באמצע (הכי גבוה), 3 מימין - עם הסקין, השם מתחת והניקוד
        const makePodium = top => {
            const li = document.createElement('li');
            li.className = 'lb-podium';
            [1, 0, 2].forEach(i => {
                const row = top[i];
                const spot = document.createElement('div');
                if (!row) { spot.className = 'lb-pod empty'; li.appendChild(spot); return; }
                const place = Math.min(3, row.rank || i + 1);    // בתיקו - אותו מקום, אותו צבע ואותו גובה
                spot.className = 'lb-pod p' + place + (row.id === playerId ? ' me' : '');
                spot.onclick = () => openPlayerModal({ id: row.id, name: safeName(row.name), skin: row.id === playerId ? currentSkinId() : row.skin,
                                                       lvl: row.lvl, title: row.title, frame: row.frame, mst: row.mst,
                                                       known: { col: collectionName, score: row.score, rank: row.rank, coins: row.coins } });
                if (place === 1) { const crown = document.createElement('div'); crown.className = 'lb-pod-crown'; crown.textContent = '👑'; spot.appendChild(crown); }
                const av = document.createElement('div');
                const px = row.id === playerId && typeof xpPublic === 'function' ? xpPublic() : row;
                av.className = 'lb-pod-av' + (px.frame ? ' fr-' + px.frame : '');
                const src = lbAvatar(row.id === playerId ? currentSkinId() : row.skin);
                if (src) { const img = document.createElement('img'); img.src = src; img.alt = ''; av.appendChild(img); }
                const medal = document.createElement('span');
                medal.className = 'lb-pod-medal'; medal.textContent = ['🥇', '🥈', '🥉'][place - 1];
                av.appendChild(medal);
                if (typeof xpOrbit === 'function') xpOrbit(av, px.frame, px.lvl || 0, place === 1 ? 74 : 58);
                if (px.lvl) { const b = document.createElement('span'); b.className = 'lb-lvl'; b.textContent = px.lvl; av.appendChild(b); }
                spot.appendChild(av);
                const nm = document.createElement('div');
                nm.className = 'lb-pod-name';
                nm.textContent = safeName(row.name) + (row.id === playerId ? ' (אתה)' : '');   // textContent - בלי הזרקת קוד
                const mb = lbMstBadge(row, 16);
                if (mb) nm.appendChild(mb);
                spot.appendChild(nm);
                const sc = document.createElement('div');
                sc.className = 'lb-pod-score'; sc.textContent = row.score + " נק'";
                spot.appendChild(sc);
                const block = document.createElement('div');
                block.className = 'lb-pod-block'; block.textContent = place;
                spot.appendChild(block);
                li.appendChild(spot);
            });
            return li;
        };
        const note = (text, btnText, onBtn) => {
            const li = document.createElement('li');
            li.className = 'lb-search-note';
            li.textContent = text;
            if (btnText) {
                li.appendChild(document.createElement('br'));
                const b = document.createElement('button');
                b.className = 'sub-tab-btn'; b.textContent = btnText; b.onclick = onBtn;
                li.appendChild(b);
            }
            return li;
        };

        // חיפוש מחוץ לטבלה שנטענה: שמות שמתחילים במה שהוקלד (עד 10 תוצאות), והמקום של כל אחד בספירה
        const serverSearch = (q, shownIds, noteLi) => {
            noteLi.textContent = 'מחפשים בכל השחקנים...';
            db.collection(collectionName).where('name', '>=', q).where('name', '<=', q + '\uf8ff').limit(10).get({ source: 'server' })
                .then(snap => {
                    if (isStale() || lbSearchQuery().raw !== q) return;
                    const found = [];
                    snap.forEach(doc => {
                        const d = doc.data();
                        if (typeof d.score !== 'number' || shownIds.has(doc.id) || isRudeName(d.name)) return;
                        found.push({ id: doc.id, name: String(d.name || 'אורח').slice(0, 20), score: d.score,
                                     skin: typeof d.skin === 'string' ? d.skin.slice(0, 40) : 'classic', coins: typeof d.coins === 'number' ? d.coins : null,
                                     team: d.team === 'a' || d.team === 'b' ? d.team : null,
                                     lvl: Number.isInteger(d.lvl) && d.lvl > 0 ? d.lvl : null, title: typeof xpTitleOk === 'function' && xpTitleOk(d.title) ? d.title : null,
                                     frame: typeof xpFrameOk === 'function' && xpFrameOk(d.frame) ? d.frame : '', mst: lbMst(d.mst) });
                    });
                    found.sort((a, b) => b.score - a.score);
                    if (!found.length) { noteLi.textContent = 'לא נמצאו עוד שחקנים ששמם מתחיל ב-"' + q + '"'; return; }
                    noteLi.textContent = 'תוצאות מכל השחקנים:';
                    let after = noteLi;
                    found.forEach(row => {
                        const { li, strong } = makeRow(row);
                        after.after(li); after = li;
                        countAbove(collectionName, row.score).then(rank => {
                            if (!rank) return;
                            row.rank = rank;
                            strong.textContent = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : '#' + rank;
                        }).catch(() => { strong.textContent = '#?'; });
                    });
                })
                .catch(err => {
                    console.error('חיפוש שחקנים נכשל:', err.code || '', err.message || err);
                    noteLi.textContent = err.code === 'resource-exhausted' ? 'השרת הגיע למגבלת השימוש היומית. נסו מחר.' : 'החיפוש נכשל. בדקו את החיבור לאינטרנט.';
                });
        };

        const render = rows => {
            container.innerHTML = '';
            const frag = document.createDocumentFragment();
            const q = lbSearchQuery();

            const myIdx = rows.findIndex(r => r.id === playerId);
            const myBest = parseInt(store.get(LB_LOCAL_KEY[collectionName])) || 0;
            if (!q.norm && (myIdx >= 0 || myBest > 0)) {
                const me = document.createElement('li');
                me.className = 'lb-me';
                const a = document.createElement('span');
                const b = document.createElement('small');
                if (myIdx >= 0) { a.textContent = 'המקום שלך: #' + rows[myIdx].rank; b.textContent = rows.length >= LB_LIMIT ? 'בין ' + LB_LIMIT + ' המובילים' : 'מתוך ' + rows.length + ' שחקנים'; }
                else { a.textContent = 'עדיין לא ב-' + LB_LIMIT + ' המובילים'; b.textContent = 'השיא שלך: ' + myBest; }
                me.appendChild(a); me.appendChild(b);
                frag.appendChild(me);
            }

            const shown = q.norm ? rows.filter(r => lbNormName(safeName(r.name)).includes(q.norm)) : rows;
            // שלושת הראשונים על במת מנצחים (לא בזמן חיפוש)
            const podium = q.norm ? [] : shown.slice(0, 3);
            if (podium.length) frag.appendChild(makePodium(podium));
            shown.slice(podium.length).forEach(row => frag.appendChild(makeRow(row).li));
            container.appendChild(frag);
            if (!q.norm) { if (rows.length === 0) showMsg('אין עדיין שיאים. היו הראשונים!', '#b9a38e', false); return; }
            // בחיפוש: אם יש עוד שחקנים מעבר למה שנטען, אפשר לחפש גם ביניהם
            const more = rows.length >= LB_LIMIT;
            const text = shown.length ? '' : (more ? 'לא נמצא ב-' + LB_LIMIT + ' המובילים' : 'לא נמצא שחקן בשם הזה');
            if (more) {
                const n = note(text, '🔎 חיפוש בכל השחקנים', () => serverSearch(q.raw, new Set(shown.map(r => r.id)), n));
                container.appendChild(n);
            } else if (text) container.appendChild(note(text));
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
        if (cached && Date.now() - cached.t < LB_CACHE_MS) {
            // שמירה שעוד בדרך תעדכן את הטבלה השמורה - מחכים לה ומציגים בלי לטעון שוב
            if (pendingSaves.size) Promise.allSettled(Array.from(pendingSaves)).then(() => { if (!isStale() && lbCache[collectionName]) render(lbCache[collectionName].rows); });
            else render(cached.rows);
            return;
        }
        showMsg('טוען נתונים...', '#b9a38e', false);

        // מחכים לשמירות שעדיין בדרך (כדי שהשיא שהרגע נקבע יופיע), ובכל מקרה לא יותר מ-8 שניות.
        // אם אותה טבלה כבר נטענת (למשל מעבר למסך ולחיצה על הלשונית) - משתמשים באותה טעינה ולא קוראים פעמיים
        const fetchData = lbInflight[collectionName] || (lbInflight[collectionName] = Promise.allSettled(Array.from(pendingSaves)).then(() =>
            // תמיד מהשרת: כשהשרת לא עונה (למשל כשנגמרה המכסה היומית) Firestore מחזיר בשקט את מה ששמור במכשיר -
            // ובו רק השיא שהשחקן עצמו שמר עכשיו, כך שהוא נראה במקום הראשון
            db.collection(collectionName).orderBy('score', 'desc').limit(LB_LIMIT).get({ source: 'server' }))
            .then(snap => (snap.metadata && snap.metadata.fromCache) ? Promise.reject({ code: 'unavailable' }) : snap)
            .finally(() => { delete lbInflight[collectionName]; }));
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));

        Promise.race([fetchData, timeout])
            .then(snapshot => {
                if (isStale()) return;
                const rows = [];
                snapshot.forEach(doc => {
                    const d = doc.data();
                    if (typeof d.score !== 'number') return;
                    const ts = d.timestamp && typeof d.timestamp.toMillis === 'function' ? d.timestamp.toMillis() : Infinity;
                    rows.push({ id: doc.id, name: String(d.name || 'אורח').slice(0, 20), score: d.score, ts,
                                skin: typeof d.skin === 'string' ? d.skin.slice(0, 40) : 'classic',
                                coins: typeof d.coins === 'number' ? d.coins : null, team: d.team === 'a' || d.team === 'b' ? d.team : null,
                                lvl: Number.isInteger(d.lvl) && d.lvl > 0 ? d.lvl : null, title: typeof xpTitleOk === 'function' && xpTitleOk(d.title) ? d.title : null,
                                frame: typeof xpFrameOk === 'function' && xpFrameOk(d.frame) ? d.frame : '', mst: lbMst(d.mst) });
                });
                // חשבונות שנוצרו לפני התיקון נשארו גם עם רשומת האורח הישנה.
                // מסתירים רשומת אורח (player_...) כשיש חשבון באותו שם עם ניקוד זהה או גבוה יותר.
                const accountBest = {};
                rows.forEach(r => { if (!r.id.startsWith('player_')) accountBest[r.name] = Math.max(accountBest[r.name] || 0, r.score); });
                for (let i = rows.length - 1; i >= 0; i--) {
                    const r = rows[i];
                    if (r.id.startsWith('player_') && r.id !== playerId && accountBest[r.name] !== undefined && accountBest[r.name] >= r.score) rows.splice(i, 1);
                }
                lbSortRows(rows);
                lbCache[collectionName] = { t: Date.now(), rows };
                render(rows);
            })
            .catch(err => {
                if (isStale()) return;
                console.error("שגיאה בטעינת הטבלה (" + collectionName + "):", err.code || '', err.message || err);
                const msg = err.code === 'permission-denied'
                    ? 'אין הרשאה לקרוא את הטבלה (בדקו את כללי Firestore)'
                    : err.code === 'resource-exhausted'
                    ? 'השרת הגיע למגבלת השימוש היומית. הטבלה תחזור מחר.'
                    : 'לא הצלחנו לטעון את הטבלה. בדקו את החיבור לאינטרנט.';
                showMsg(msg, '#f85149', true);
            });
    }

    /* --- עצירת כל הטיימרים של כל המשחקים --- */
    function stopAllGames() {
        if (typeof ttStop === 'function') ttStop();
        clearInterval(catchInterval);
        clearTimeout(kebabTimeout);
        const area = document.getElementById('game-area');
        if (area) area.innerHTML = '';
        clearInterval(goodsInterval);
        goodsTimeouts.forEach(clearTimeout);
        goodsTimeouts = [];
        clearTimeout(triviaTimeout);
        if (typeof svStop === 'function') svStop();
        if (typeof njStop === 'function') njStop();
        if (typeof kvStop === 'function') kvStop();
        if (typeof dlvStop === 'function') dlvStop();
    }

    /* --- משתנים גלובליים ומזהה שחקן ייחודי --- */
    let playerId = store.get('kebab_playerId');
    if (!playerId) {
        playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        store.set('kebab_playerId', playerId);
    }

    let playerName = store.get('kebab_playerName') || 'אורח';
    if (isRudeName(playerName)) { playerName = 'אורח'; store.set('kebab_playerName', playerName); }

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
        'kebab_triviaHighScore', 'kebab_kvkHighScore', 'kebab_dlvHighScore', 'kebab_kvk_tutorial_done', 'kebab_daily', 'kebab_skin_variant', 'kebab_deal', 'kebab_tmnt', 'kebab_turtlesHighScore', 'kebab_tt_boost', 'kebab_collections', 'kebab_xp', 'kebab_mastery', 'kebab_codes_used', 'kebab_friends'];
    const USERNAME_RE = /^[\p{L}\p{N}_]{3,15}$/u;
    const PASSWORD_RE = /^[\p{L}\p{N}]{6,30}$/u;
    const LB_BEST = [['leaderboard_delivery', 'kebab_dlvHighScore'], ['leaderboard', 'kebab_highScore'], ['leaderboard_turtles', 'kebab_turtlesHighScore'], ['leaderboard_goods', 'kebab_goodsHighScore'],
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
        if (isRudeName(playerName)) { playerName = 'אורח'; store.set('kebab_playerName', playerName); }
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
            if (best > 0) saveBestScore(col, best, key, true);     // בהתחברות: שולחים את השיאים גם אם לא השתפרו כאן
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
        if (accountMode === 'signup' && isRudeName(username)) { setAccountMsg('שם המשתמש הזה לא מתאים. בחרו שם אחר'); return null; }
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
            add('div', 'account-title', '🔐 מחובר בתור ' + safeName(store.get(ACCOUNT_KEY) || ''));
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


	/* --- חיפוש שחקן בטבלה לפי שם --- */
	// השוואה בלי הבדלי אותיות גדולות/קטנות, ניקוד ורווחים כפולים
	function lbNormName(s) { return String(s || '').toLowerCase().replace(/[\u0591-\u05C7]/g, '').replace(/\s+/g, ' ').trim(); }
	function lbSearchQuery() {
		const el = document.getElementById('lb-search');
		const raw = el ? el.value.trim().slice(0, 20) : '';
		return { raw, norm: lbNormName(raw) };
	}
	// מסננים את הטבלה שכבר נטענה (בלי קריאות נוספות מהשרת)
	function lbSearchChanged() {
		const active = document.querySelector('#screen-leaderboard .sub-tab-btn.active');
		const type = active ? active.id.replace('sub-btn-', '') : 'shvartz';
		(LB_TABS[type] || LB_TABS.shvartz)();
	}

	/* --- החלפה בין טבלאות השיאים בתוך המסך --- */
	const LB_TABS = {
		delivery: () => loadDeliveryLeaderboard(),
		goods:   () => loadGoodsLeaderboard(),
		shvartz: () => loadShvartzLeaderboard(),
		ninja:   () => loadNinjaLeaderboard(),
		kvk:     () => loadKvkLeaderboard(),
		main:    () => loadLeaderboard(),
		turtles: () => loadTurtlesLeaderboard()
	};

	function switchLeaderboardTab(type) {
		if (!LB_TABS[type]) type = 'shvartz';
		Object.keys(LB_TABS).forEach(k => {
			document.getElementById('sub-btn-' + k).classList.toggle('active', k === type);
			document.getElementById('sub-screen-' + k).style.display = (k === type) ? 'block' : 'none';
		});
		if (typeof friendsBoardOn === 'function' && friendsBoardOn()) { renderFriendsBoard(type); return; }     // טבלת החברים (js/social.js)
		LB_TABS[type]();
	}

	/* --- ניווט בין מסכים ראשיים --- */
	let swipeDir = null;            // נקבע בהחלקה בין מסכים (js/ui.js)
	function switchTab(screenId) {
			stopAllGames();
		if (typeof closeSkinModal === 'function') closeSkinModal();
		if (screenId !== 'result') creditPendingCoins();
		if (window.kebabUpdateReady && ['home', 'shop', 'profile', 'leaderboard'].includes(screenId)) setTimeout(() => window.kebabTryUpdate(), 50);
		document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
		// אנימציית הכניסה: החלקה מהצד (אחרי החלקת אצבע) או הופעה רגילה. נשארת עד המעבר הבא, כדי שהאנימציה לא תתחלף ותרוץ שוב
		document.body.classList.remove('swipe-r', 'swipe-l');
		if (swipeDir) { document.body.classList.add(swipeDir); swipeDir = null; }
		document.querySelectorAll('.icon-btn').forEach(b => b.classList.remove('active'));

		const targetScreen = document.getElementById('screen-' + screenId);
		const targetBtn = document.getElementById('btn-' + screenId);

		if (targetScreen) targetScreen.classList.add('active');
		if (targetBtn) targetBtn.classList.add('active');
		document.body.classList.toggle('in-game', ['catch', 'trivia', 'goods', 'shvartz', 'ninja', 'kvk', 'delivery', 'turtles'].includes(screenId));

		// בעת מעבר למסך השיאים, מציגים את הטאב שנבחר כעת (ברירת מחדל: המשחק הראשי)
		if (screenId === 'shop') renderShop();
		if (screenId === 'profile' && typeof renderXpProfile === 'function') renderXpProfile();
		if (screenId === 'home') { renderDaily(); if (typeof mstCelebrateSoon === 'function') mstCelebrateSoon(900); }

		if (screenId === 'leaderboard') {
			const active = document.querySelector('.sub-tab-btn.active');
			const type = active ? active.id.replace('sub-btn-', '') : 'shvartz';
			(LB_TABS[type] || LB_TABS.shvartz)();
		}
	}

    /* --- שמירת שם שחקן --- */
    function savePlayerName() {
        const inputVal = document.getElementById('player-name-input').value.trim().slice(0, 20);
        const msg = document.getElementById('name-save-msg');
        if (isRudeName(inputVal)) {
            msg.textContent = '❌ השם הזה לא מתאים. בחרו שם אחר';
            msg.style.color = '#ff6a5c';
            msg.style.display = 'block';
            clearTimeout(msg._t);
            msg._t = setTimeout(() => { msg.style.display = 'none'; }, 2500);
            if (typeof sfx !== 'undefined') sfx.err();
            return;
        }
        playerName = inputVal !== '' ? inputVal : 'אורח';
        document.getElementById('player-name-input').value = playerName;
        store.set('kebab_playerName', playerName);

        // עדכון השם בכל טבלאות השיאים שבהן השחקן כבר קיים - בלי לקרוא קודם (בטבלה שהוא לא נמצא בה העדכון נכשל ב-not-found)
        if (db) {
            Object.keys(LB_LOCAL_KEY).forEach(col => {
                db.collection(col).doc(playerId).update({ name: playerName })
                    .then(() => lbPatchCache(col, { name: playerName }))
                    .catch(err => { if (!err || err.code !== 'not-found') console.error("שגיאה בעדכון שם (" + col + "):", err.code || err); });
            });
        }
        Object.keys(LB_LOCAL_KEY).forEach(col => { const r = lbCache[col] && lbCache[col].rows.find(x => x.id === playerId); if (r) r.name = playerName; });

        msg.textContent = '✓ השם עודכן בהצלחה!';
        msg.style.color = '#2ea043';
        msg.style.display = 'block';
        clearTimeout(msg._t);
        msg._t = setTimeout(() => { msg.style.display = 'none'; }, 2000);
    }

    /* --- שיא "תפוס את הקבב" --- */
    function checkHighScore(score) {
        saveBestScore('leaderboard', score, 'kebab_highScore');
    }

    function loadLeaderboard() {
        loadLeaderboardInto('leaderboard-container', 'leaderboard');
    }

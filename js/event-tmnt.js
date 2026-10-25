/* ---------- אירוע קהילתי: צבי הנינג'ה ----------
   שני צוותים. כל שריון שפוגעים בו במשחק לזמן מוגבל "אתגר צבי הנינג'ה" (js/game-turtles.js) נספר לצוות של השחקן.
   צוות שמגיע ל-100,000 פגיעות - כל חבריו מקבלים את 3 הסקינים שלו.
   המונים המשותפים נשמרים במסמך אחד ב-Firestore: events/tmnt (a_hits, b_hits, ומספר החברים a_members, b_members).
   קריאה אחת מציגה את ההתקדמות של שני הצוותים, וכל משחק עולה כתיבה אחת (עד 400 פגיעות בכתיבה).
   שלב ראשון - בחירת צוותים: מ-pollStart ועד שהאירוע מתחיל (start) שחקנים רק בוחרים צוות, ורואים כמה הצטרפו לכל צד.
   כשצוות אחד גדול מדי מהשני, אי אפשר להצטרף אליו (גם הכללים ב-Firestore אוכפים את זה). */

const TMNT = {
    pollStart: Date.parse('2026-10-25T00:00:00+03:00'),
    start: Date.parse('2026-10-25T16:00:00+02:00'),    // 16:00 שעון ישראל - עד אז רק בחירת צוותים, עם ספירה לאחור
    end: Date.parse('2026-11-08T23:59:59+02:00'),
    afterDays: 3,                    // כמה ימים אחרי הסיום עוד מציגים את התוצאות (ואפשר לקבל את הפרס)
    goal: 100000,                    // פגיעות בשריונים לכל צוות
    maxPerWrite: 400,                // אותו גבול כמו בכללי Firestore
    teams: {
        a: { name: 'צוות ספלינטר', skins: ['tmnt_leo', 'tmnt_splinter', 'tmnt_don'] },
        b: { name: 'צוות שרדר', skins: ['tmnt_raph', 'tmnt_shredder', 'tmnt_mikey'] }
    }
};
const TMNT_KEY = 'kebab_tmnt';               // { team, rewarded, hits } - נשמר גם בחשבון
const TMNT_COUNTS_KEY = 'kebab_tmnt_counts'; // עותק אחרון של המונים, להצגה מיידית
const TMNT_CACHE_MS = 90000;

const tmntLive = () => { const n = Date.now(); return !!TMNT.start && n >= TMNT.start && n <= TMNT.end; };
const tmntPoll = () => { const n = Date.now(); return n >= TMNT.pollStart && !(TMNT.start && n >= TMNT.start); };
const tmntVisible = () => tmntPoll() || (!!TMNT.start && Date.now() >= TMNT.start && Date.now() <= TMNT.end + TMNT.afterDays * 864e5);

// איזון: אי אפשר להצטרף לצוות שגדול מהשני ב-3 שחקנים או יותר וגם ב-15% או יותר מכל המשתתפים
// (אותו חישוב בדיוק כמו בכללי Firestore)
function tmntMembers(t) { return tmntCount(t, 'members'); }
function tmntCanJoin(t) {
    const o = t === 'a' ? 'b' : 'a', m = tmntMembers(t), n = tmntMembers(o), diff = m - n;
    return diff < 3 || diff * 100 < 15 * (m + n);
}

// משחקים שעוד לא נשלחו נשמרים בנפרד ולא מסונכרנים לחשבון - כדי ששני מכשירים לא ישלחו את אותם משחקים פעמיים
const TMNT_PENDING_KEY = 'kebab_tmnt_pending';
function tmntState() {
    let st = null, pend = null;
    try { st = JSON.parse(store.get(TMNT_KEY) || 'null'); } catch (e) { st = null; }
    try { pend = JSON.parse(store.get(TMNT_PENDING_KEY) || 'null'); } catch (e) { pend = null; }
    st = st && typeof st === 'object' ? st : {};
    if (st.team !== 'a' && st.team !== 'b') st.team = null;
    st.pending = pend && typeof pend === 'object' ? pend : {};
    st.hits = parseInt(st.hits) || 0;
    return st;
}
function tmntSave(st) {
    store.set(TMNT_KEY, JSON.stringify({ team: st.team, rewarded: !!st.rewarded, hits: st.hits }));
    store.set(TMNT_PENDING_KEY, JSON.stringify(st.pending || {}));
}

let tmntCounts = (() => { try { return JSON.parse(store.get(TMNT_COUNTS_KEY) || '{}') || {}; } catch (e) { return {}; } })();
let tmntFetchedAt = 0, tmntFetching = null;

// מונה של צוות (hits / members), כולל מה שהשחקן עוד לא שלח
function tmntCount(team, key) {
    const f = team + '_' + key, st = tmntState();
    return (parseInt(tmntCounts[f]) || 0) + (st.team === team ? (st.pending[f] || 0) : 0);
}
function tmntTeamDone(team) { return tmntCount(team, 'hits') >= TMNT.goal; }
function tmntTeamPct(team) { return Math.min(1, tmntCount(team, 'hits') / TMNT.goal); }

// מחזיר true כשהגיע מידע חדש מהשרת
function tmntFetch(force) {
    if (!db || !tmntVisible()) return Promise.resolve(false);
    if (!force && Date.now() - tmntFetchedAt < TMNT_CACHE_MS) return Promise.resolve(false);
    if (tmntFetching) return tmntFetching;
    tmntFetchedAt = Date.now();                     // גם כשהטעינה נכשלת - לא מנסים שוב לפני שעבר הזמן
    tmntFetching = db.collection('events').doc('tmnt').get({ source: 'server' })
        .then(doc => {
            const d = doc.exists ? doc.data() : {};
            const next = {};
            for (const t of ['a', 'b']) for (const m of ['hits', 'members']) { const v = d[t + '_' + m]; if (typeof v === 'number') next[t + '_' + m] = v; }
            tmntCounts = next;
            store.set(TMNT_COUNTS_KEY, JSON.stringify(next));
            return true;
        })
        .catch(err => {
            console.warn('אירוע: טעינת ההתקדמות נכשלה', err.code || err.message || err);
            tmntFetchedAt = Date.now() - TMNT_CACHE_MS + 15000;     // טעינה שנכשלה - מנסים שוב בעוד 15 שניות
            return false;
        })
        .finally(() => { tmntFetching = null; });
    return tmntFetching;
}

// שולחים את מה שנצבר במכשיר: הצטרפות לצוות (+1), ופגיעות בחבילות של עד 400
let tmntFlushing = false;
function tmntFlush() {
    if (!db || tmntFlushing || !(tmntLive() || tmntPoll())) return;
    const st = tmntState();
    const f = Object.keys(st.pending).find(k => st.pending[k] > 0);
    if (!f) return;
    tmntFlushing = true;
    const n = f.endsWith('_hits') ? Math.min(st.pending[f], TMNT.maxPerWrite) : 1;
    db.collection('events').doc('tmnt').set({ [f]: firebase.firestore.FieldValue.increment(n) }, { merge: true })
        .then(() => {
            const s2 = tmntState();
            s2.pending[f] = Math.max(0, (s2.pending[f] || 0) - n);
            if (!s2.pending[f]) delete s2.pending[f];
            tmntSave(s2);
            tmntCounts[f] = (parseInt(tmntCounts[f]) || 0) + n;
            tmntFlushing = false;
            tmntFlush();
        })
        .catch(err => {
            tmntFlushing = false;
            // הצטרפות שנדחתה כי הצוות התמלא בינתיים: מבטלים את הבחירה ומבקשים לבחור שוב
            // (אם לפי המספרים העדכניים הצוות לא מלא - זו בעיה אחרת, למשל כללים שעוד לא פורסמו: שומרים ומנסים שוב אחר כך)
            if (f.endsWith('_members') && err && err.code === 'permission-denied') {
                tmntFetch(true).then(() => {
                    if (tmntCanJoin(f[0])) { console.warn('אירוע: ההצטרפות נדחתה (כללי Firestore?), ננסה שוב אחר כך'); return; }
                    const s2 = tmntState();
                    delete s2.pending[f];
                    if (s2.team === f[0]) s2.team = null;
                    tmntSave(s2);
                    renderTmnt();
                    showToast('הצוות התמלא בינתיים - בחרו שוב', false);
                });
                return;
            }
            console.warn('אירוע: שליחה נכשלה, ננסה שוב אחר כך', err.code || err.message || err);
        });
}

// נקרא בסוף כל משחק (מתוך showResultReward): רק הפגיעות באתגר צבי הנינג'ה נספרות
function tmntGamePlayed(gameKey, score) {
    if (!tmntLive() || gameKey !== 'turtles' || !(score > 0)) return;
    const st = tmntState();
    if (!st.team) return;
    const f = st.team + '_hits';
    st.pending[f] = (st.pending[f] || 0) + Math.floor(score);
    st.hits += Math.floor(score);
    tmntSave(st);
    tmntFlush();
}

// הצוות של השחקן השלים את האתגר: מקבלים את 3 הסקינים (פעם אחת)
function tmntCheckReward() {
    const st = tmntState();
    if (!st.team || st.rewarded || !tmntTeamDone(st.team)) return;
    const owned = getOwnedSkins();
    TMNT.teams[st.team].skins.forEach(id => owned.add(id));
    saveOwnedSkins(owned);
    st.rewarded = true;
    tmntSave(st);
    showToast('🐢 ' + TMNT.teams[st.team].name + ' השלים את האתגר! קיבלתם 3 סקינים חדשים', true);
    if (typeof sfx !== 'undefined' && sfx.match) sfx.match(3);
}

function tmntPickTeam(team) {
    if (tmntState().team || !(tmntLive() || tmntPoll())) return;
    // בודקים מול המספרים העדכניים מהשרת לפני שמצטרפים
    tmntFetch(true).then(() => {
        const st = tmntState();
        if (st.team) return;
        const t = TMNT.teams[team];
        if (!tmntCanJoin(team)) { showToast('🔒 ב' + t.name + ' יש כרגע יותר מדי שחקנים - הצטרפו לצוות השני', false); renderTmnt(); return; }
        const names = t.skins.map(id => skinById(id).name).join(', ');
        if (!confirm('להצטרף ל' + t.name + ' (' + names + ')?\nאי אפשר להחליף צוות אחר כך.')) return;
        st.team = team;
        st.pending[team + '_members'] = 1;
        tmntSave(st);
        if (typeof syncLeaderboardSkin === 'function') syncLeaderboardSkin(0);     // הצוות מופיע מיד בשורות שלכם בטבלאות
        if (typeof sfx !== 'undefined' && sfx.tap) sfx.tap();
        renderTmnt();
        tmntFlush();
    });
}

function tmntCountdown() {
    if (tmntPoll()) return TMNT.start ? '🗳️ מתחיל בעוד ' + tmntClock(TMNT.start - Date.now()) : '🗳️ בחירת צוותים';
    const ms = TMNT.end - Date.now();
    if (ms <= 0) return 'האירוע הסתיים';
    return '⏳ ' + tmntDur(ms);
}
// ספירה לאחור בשעון: 2:07:59 (ימים מוצגים בנפרד)
function tmntClock(ms) {
    const sec = Math.max(0, Math.ceil(ms / 1000)), d = Math.floor(sec / 86400);
    const h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s2 = sec % 60;
    const pad = n => String(n).padStart(2, '0');
    return (d > 0 ? d + ' ימים ' : '') + h + ':' + pad(m) + ':' + pad(s2);
}
function tmntDur(ms) {
    const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    return d > 0 ? d + ' ימים ' + h + ' שע\'' : h > 0 ? h + ' שע\' ' + m + ' דק\'' : m + ' דק\'';
}

function renderTmnt() {
    const home = document.getElementById('screen-home');
    const daily = document.getElementById('daily-box');
    if (!home || !daily) return;
    let box = document.getElementById('event-box');
    tmntShown = tmntVisible() + '|' + tmntLive();
    if (!tmntVisible()) {
        if (box) box.remove();
        if (home.firstElementChild !== daily) home.insertBefore(daily, home.firstElementChild);
        return;
    }
    if (!box) { box = document.createElement('div'); box.id = 'event-box'; box.className = 'event-box'; }
    if (home.firstElementChild !== box) home.insertBefore(box, home.firstElementChild);
    // בזמן שהאירוע פעיל - האתגרים היומיים עוברים לתחתית המסך; אחרי שהוא נגמר הם חוזרים למעלה
    if (tmntLive()) { if (home.lastElementChild !== daily) home.appendChild(daily); }
    else if (box.nextElementSibling !== daily) home.insertBefore(daily, box.nextElementSibling);

    const st = tmntState(), live = tmntLive(), poll = tmntPoll();
    // המשחק לזמן מוגבל ולשונית הטבלה שלו מופיעים רק בזמן האירוע
    const card = document.getElementById('tt-card'), tab = document.getElementById('sub-btn-turtles');
    if (card) card.style.display = live ? '' : 'none';
    if (tab) tab.style.display = tmntVisible() ? '' : 'none';
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
    box.innerHTML = '';
    const head = el('div', 'ev-head');
    head.appendChild(el('div', 'ev-title', '🐢 אירוע צבי הנינג\'ה'));
    const cd = el('div', 'ev-timer', tmntCountdown()); cd.id = 'ev-timer';
    head.appendChild(cd);
    box.appendChild(head);
    const goalTxt = TMNT.goal.toLocaleString('en-US');
    box.appendChild(el('div', 'ev-sub', poll
        ? 'בחרו צוות! כשהאירוע יתחיל, כל שריון שתפגעו בו ב"אתגר צבי הנינג\'ה" ייספר לצוות שלכם. צוות שמגיע ל-' + goalTxt + ' פגיעות - כל חבריו מקבלים את 3 הסקינים שלו!'
        : live ? 'שחקו ב"אתגר צבי הנינג\'ה": כל שריון שתפגעו בו נספר לצוות שלכם. צוות שמגיע ל-' + goalTxt + ' פגיעות - כל חבריו מקבלים את 3 הסקינים שלו!'
        : 'האירוע הסתיים. הנה התוצאות:'));

    const row = el('div', 'ev-teams');
    for (const t of ['a', 'b']) {
        const T = TMNT.teams[t], done = tmntTeamDone(t), pct = tmntTeamPct(t);
        const tcard = el('div', 'ev-team ev-' + t + (st.team === t ? ' mine' : '') + (done ? ' done' : ''));
        const avs = el('div', 'ev-avs');
        T.skins.forEach(id => {
            const src = lbAvatar(id);
            if (!src) return;
            const img = el('img'); img.src = src; img.alt = ''; img.title = skinById(id).name;
            avs.appendChild(img);
        });
        tcard.appendChild(avs);
        tcard.appendChild(el('div', 'ev-tname', T.name));
        tcard.appendChild(el('div', 'ev-members', T.skins.map(id => skinById(id).name).join(' · ')));
        tcard.appendChild(el('div', 'ev-count', '👥 ' + tmntMembers(t) + ' שחקנים'));
        if (poll) {
            if (st.team === t) tcard.appendChild(el('div', 'ev-badge', '⭐ הצוות שלכם'));
            else if (!st.team && tmntCanJoin(t)) { const btn = el('button', 'ev-join', 'הצטרפו לצוות'); btn.onclick = () => tmntPickTeam(t); tcard.appendChild(btn); }
            else if (!st.team) tcard.appendChild(el('div', 'ev-full', '🔒 יותר מדי שחקנים כרגע - הצטרפו לצוות השני'));
            row.appendChild(tcard);
            continue;
        }
        const tot = el('div', 'ev-total');
        const bar = el('div', 'ev-bar'); const fill = el('i'); fill.style.width = (pct * 100).toFixed(1) + '%'; bar.appendChild(fill);
        tot.appendChild(bar); tot.appendChild(el('b', '', Math.floor(pct * 100) + '%'));
        tcard.appendChild(tot);
        const hits = tmntCount(t, 'hits');
        tcard.appendChild(el('div', 'ev-hits', '🎯 ' + Math.min(hits, TMNT.goal).toLocaleString('en-US') + ' / ' + goalTxt));
        if (done) tcard.appendChild(el('div', 'ev-badge ok', '✓ הצוות השלים!'));
        else if (st.team === t) tcard.appendChild(el('div', 'ev-badge', '⭐ הצוות שלכם'));
        else if (!st.team && live && tmntCanJoin(t)) {
            const btn = el('button', 'ev-join', 'הצטרפו לצוות');
            btn.onclick = () => tmntPickTeam(t);
            tcard.appendChild(btn);
        } else if (!st.team && live) tcard.appendChild(el('div', 'ev-full', '🔒 יותר מדי שחקנים כרגע - הצטרפו לצוות השני'));
        row.appendChild(tcard);
    }
    box.appendChild(row);
    if (live) {
        const play = el('button', 'ev-play', '🎯 שחקו באתגר צבי הנינג\'ה');
        play.onclick = () => startTurtlesGame();
        box.appendChild(play);
    }
    if (st.team && !poll) box.appendChild(el('div', 'ev-mine', 'פגעתם ב-' + st.hits.toLocaleString('en-US') + ' שריונים בשביל ' + TMNT.teams[st.team].name));

    tmntCheckReward();
    // טוענים מחדש מהשרת (לכל היותר פעם ב-90 שניות) ומציירים שוב כשמגיע מידע חדש
    if (db && Date.now() - tmntFetchedAt >= TMNT_CACHE_MS && !tmntFetching) {
        tmntFetch().then(fresh => { if (fresh && document.getElementById('screen-home').classList.contains('active')) renderTmnt(); });
    }
    tmntFlush();
}

// טיימר: הספירה לאחור מתעדכנת כל שנייה, ומציירים מחדש ברגע שהאירוע מתחיל, נגמר או יורד מהמסך
let tmntShown = null;
setInterval(() => {
    const t = document.getElementById('ev-timer');
    if (t) t.textContent = tmntCountdown();
    if (tmntShown !== null && tmntShown !== tmntVisible() + '|' + tmntLive()) renderTmnt();
}, 1000);
// חזרה לאפליקציה (מהרקע) - טוענים מיד את המספרים העדכניים
document.addEventListener('visibilitychange', () => {
    if (document.hidden || !tmntVisible() || !document.getElementById('screen-home').classList.contains('active')) return;
    tmntFetch(true).then(fresh => { if (fresh) renderTmnt(); });
});
setInterval(() => {
    if (tmntShown !== tmntVisible() + '|' + tmntLive()) renderTmnt();
    // כל עוד מסך הבית פתוח - מרעננים את המספרים (כל דקה וחצי, או 15 שניות אחרי טעינה שנכשלה)
    else if (tmntVisible() && document.getElementById('screen-home').classList.contains('active') && Date.now() - tmntFetchedAt >= TMNT_CACHE_MS) renderTmnt();
}, 15000);

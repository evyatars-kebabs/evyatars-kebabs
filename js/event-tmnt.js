/* ---------- אירוע קהילתי: צבי הנינג'ה ----------
   שני צוותים. כל משחק שמסתיים (חוץ מהחידון) מוסיף 1 לצוות של השחקן במצב המשחק הזה.
   כשצוות מגיע ל-200 משחקים בכל אחד מ-6 המצבים - כל חברי הצוות מקבלים את 3 הסקינים שלו.
   המונים המשותפים נשמרים במסמך אחד ב-Firestore: events/tmnt (שדות כמו a_delivery, b_ninja).
   קריאה אחת מציגה את ההתקדמות של שני הצוותים, וכל משחק עולה כתיבה אחת. */

const TMNT = {
    start: Date.parse('2026-10-25T00:00:00+03:00'),
    end: Date.parse('2026-11-08T23:59:59+02:00'),
    afterDays: 3,                    // כמה ימים אחרי הסיום עוד מציגים את התוצאות (ואפשר לקבל את הפרס)
    goal: 200,
    modes: [['delivery', '🛵', 'שליח'], ['kvk', '🧟', 'קולסקים'], ['ninja', '🥷', "נינג'ה"],
            ['shvartz', '🥙', 'שוורץ'], ['catch', '🍢', 'תפוס'], ['goods', '🥫', 'מדפים']],
    teams: {
        a: { name: 'צוות ספלינטר', skins: ['tmnt_leo', 'tmnt_splinter', 'tmnt_don'] },
        b: { name: 'צוות שרדר', skins: ['tmnt_raph', 'tmnt_shredder', 'tmnt_mikey'] }
    }
};
const TMNT_KEY = 'kebab_tmnt';               // { team, rewarded, mine } - נשמר גם בחשבון
const TMNT_COUNTS_KEY = 'kebab_tmnt_counts'; // עותק אחרון של המונים, להצגה מיידית
const TMNT_CACHE_MS = 90000;

const tmntLive = () => { const n = Date.now(); return n >= TMNT.start && n <= TMNT.end; };
const tmntVisible = () => { const n = Date.now(); return n >= TMNT.start && n <= TMNT.end + TMNT.afterDays * 864e5; };

// משחקים שעוד לא נשלחו נשמרים בנפרד ולא מסונכרנים לחשבון - כדי ששני מכשירים לא ישלחו את אותם משחקים פעמיים
const TMNT_PENDING_KEY = 'kebab_tmnt_pending';
function tmntState() {
    let st = null, pend = null;
    try { st = JSON.parse(store.get(TMNT_KEY) || 'null'); } catch (e) { st = null; }
    try { pend = JSON.parse(store.get(TMNT_PENDING_KEY) || 'null'); } catch (e) { pend = null; }
    st = st && typeof st === 'object' ? st : {};
    if (st.team !== 'a' && st.team !== 'b') st.team = null;
    st.pending = pend && typeof pend === 'object' ? pend : {};
    st.mine = parseInt(st.mine) || 0;
    return st;
}
function tmntSave(st) {
    store.set(TMNT_KEY, JSON.stringify({ team: st.team, rewarded: !!st.rewarded, mine: st.mine }));
    store.set(TMNT_PENDING_KEY, JSON.stringify(st.pending || {}));
}

let tmntCounts = (() => { try { return JSON.parse(store.get(TMNT_COUNTS_KEY) || '{}') || {}; } catch (e) { return {}; } })();
let tmntFetchedAt = 0, tmntFetching = null;

// כמה משחקים הצוות צבר במצב מסוים (כולל משחקים של השחקן שעוד לא נשלחו)
function tmntCount(team, mode) {
    const f = team + '_' + mode, st = tmntState();
    return (parseInt(tmntCounts[f]) || 0) + (st.team === team ? (st.pending[f] || 0) : 0);
}
function tmntTeamDone(team) { return TMNT.modes.every(([m]) => tmntCount(team, m) >= TMNT.goal); }
function tmntTeamPct(team) {
    return TMNT.modes.reduce((s, [m]) => s + Math.min(TMNT.goal, tmntCount(team, m)), 0) / (TMNT.goal * TMNT.modes.length);
}

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
            for (const t of ['a', 'b']) for (const [m] of TMNT.modes) { const v = d[t + '_' + m]; if (typeof v === 'number') next[t + '_' + m] = v; }
            tmntCounts = next;
            store.set(TMNT_COUNTS_KEY, JSON.stringify(next));
            return true;
        })
        .catch(err => { console.warn('אירוע: טעינת ההתקדמות נכשלה', err.code || err.message || err); return false; })
        .finally(() => { tmntFetching = null; });
    return tmntFetching;
}

// שולחים את המשחקים שנצברו במכשיר, אחד אחד (הכללים מאשרים רק +1 בכל כתיבה)
let tmntFlushing = false;
function tmntFlush() {
    if (!db || tmntFlushing || !tmntLive()) return;
    const st = tmntState();
    const f = Object.keys(st.pending).find(k => st.pending[k] > 0);
    if (!f) return;
    tmntFlushing = true;
    db.collection('events').doc('tmnt').set({ [f]: firebase.firestore.FieldValue.increment(1) }, { merge: true })
        .then(() => {
            const s2 = tmntState();
            s2.pending[f] = Math.max(0, (s2.pending[f] || 0) - 1);
            if (!s2.pending[f]) delete s2.pending[f];
            tmntSave(s2);
            tmntCounts[f] = (parseInt(tmntCounts[f]) || 0) + 1;
            tmntFlushing = false;
            tmntFlush();
        })
        .catch(err => { console.warn('אירוע: שליחת משחק נכשלה, ננסה שוב אחר כך', err.code || err.message || err); tmntFlushing = false; });
}

// נקרא בסוף כל משחק (מתוך showResultReward)
function tmntGamePlayed(gameKey, score) {
    if (!tmntLive() || !(score > 0) || !TMNT.modes.some(([m]) => m === gameKey)) return;
    const st = tmntState();
    if (!st.team) return;
    const f = st.team + '_' + gameKey;
    st.pending[f] = (st.pending[f] || 0) + 1;
    st.mine++;
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
    const st = tmntState();
    if (st.team || !tmntLive()) return;
    const t = TMNT.teams[team];
    const names = t.skins.map(id => skinById(id).name).join(', ');
    if (!confirm('להצטרף ל' + t.name + ' (' + names + ')?\nאי אפשר להחליף צוות אחר כך.')) return;
    st.team = team;
    tmntSave(st);
    if (typeof sfx !== 'undefined' && sfx.tap) sfx.tap();
    renderTmnt();
}

function tmntCountdown() {
    const ms = TMNT.end - Date.now();
    if (ms <= 0) return 'האירוע הסתיים';
    const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    return '⏳ ' + (d > 0 ? d + ' ימים ' + h + ' שע\'' : h > 0 ? h + ' שע\' ' + m + ' דק\'' : m + ' דק\'');
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

    const st = tmntState(), live = tmntLive();
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
    box.innerHTML = '';
    const head = el('div', 'ev-head');
    head.appendChild(el('div', 'ev-title', '🐢 אירוע צבי הנינג\'ה'));
    const cd = el('div', 'ev-timer', tmntCountdown()); cd.id = 'ev-timer';
    head.appendChild(cd);
    box.appendChild(head);
    box.appendChild(el('div', 'ev-sub', live
        ? 'כל משחק שאתם מסיימים (חוץ מהחידון) מקדם את הצוות שלכם. צוות שמגיע ל-' + TMNT.goal + ' משחקים בכל מצב - כל חבריו מקבלים את 3 הסקינים שלו!'
        : 'האירוע הסתיים. הנה התוצאות:'));

    const row = el('div', 'ev-teams');
    for (const t of ['a', 'b']) {
        const T = TMNT.teams[t], done = tmntTeamDone(t), pct = tmntTeamPct(t);
        const card = el('div', 'ev-team ev-' + t + (st.team === t ? ' mine' : '') + (done ? ' done' : ''));
        const avs = el('div', 'ev-avs');
        T.skins.forEach(id => {
            const src = lbAvatar(id);
            if (!src) return;
            const img = el('img'); img.src = src; img.alt = ''; img.title = skinById(id).name;
            avs.appendChild(img);
        });
        card.appendChild(avs);
        card.appendChild(el('div', 'ev-tname', T.name));
        card.appendChild(el('div', 'ev-members', T.skins.map(id => skinById(id).name).join(' · ')));
        const tot = el('div', 'ev-total');
        const bar = el('div', 'ev-bar'); const fill = el('i'); fill.style.width = (pct * 100).toFixed(1) + '%'; bar.appendChild(fill);
        tot.appendChild(bar); tot.appendChild(el('b', '', Math.floor(pct * 100) + '%'));
        card.appendChild(tot);
        const modes = el('div', 'ev-modes');
        TMNT.modes.forEach(([m, icon, label]) => {
            const n = tmntCount(t, m), r = el('div', 'ev-mode' + (n >= TMNT.goal ? ' ok' : ''));
            r.title = label;
            r.appendChild(el('span', 'ev-ic', icon));
            const b = el('div', 'ev-bar sm'); const f = el('i'); f.style.width = Math.min(100, n / TMNT.goal * 100) + '%'; b.appendChild(f);
            r.appendChild(b);
            r.appendChild(el('small', '', Math.min(n, TMNT.goal) + '/' + TMNT.goal));
            modes.appendChild(r);
        });
        card.appendChild(modes);
        if (done) card.appendChild(el('div', 'ev-badge ok', '✓ הצוות השלים!'));
        else if (st.team === t) card.appendChild(el('div', 'ev-badge', '⭐ הצוות שלכם'));
        else if (!st.team && live) {
            const btn = el('button', 'ev-join', 'הצטרפו לצוות');
            btn.onclick = () => tmntPickTeam(t);
            card.appendChild(btn);
        }
        row.appendChild(card);
    }
    box.appendChild(row);
    if (st.team) box.appendChild(el('div', 'ev-mine', 'תרמתם ' + st.mine + ' משחקים ל' + TMNT.teams[st.team].name));

    tmntCheckReward();
    // טוענים מחדש מהשרת (לכל היותר פעם ב-90 שניות) ומציירים שוב כשמגיע מידע חדש
    if (db && Date.now() - tmntFetchedAt >= TMNT_CACHE_MS && !tmntFetching) {
        tmntFetch().then(fresh => { if (fresh && document.getElementById('screen-home').classList.contains('active')) renderTmnt(); });
    }
    tmntFlush();
}

// טיימר: מעדכנים את הספירה לאחור, ומציירים מחדש כשהאירוע מתחיל, נגמר או יורד מהמסך
let tmntShown = null;
setInterval(() => {
    const t = document.getElementById('ev-timer');
    if (t) t.textContent = tmntCountdown();
    if (tmntShown !== tmntVisible() + '|' + tmntLive()) renderTmnt();
}, 30000);

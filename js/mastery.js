/* ---------- שליטה במשחקים ----------
   לכל משחק נקודות שליטה משלו, שמצטברות מכל משחק שמסתיים: 100 נקודות על "משחק מעולה" (הניקוד הטוב של אותו משחק),
   ולכל היותר 200 למשחק. הדרגות: ארד 300, כסף 1,000, זהב 3,000, יהלום 7,500, מאסטר 15,000.
   כל דרגה נותנת מטבעות, ומזהב ומעלה - מראה מיוחד בתוך המשחק (אפשר לכבות או לבחור דרגה נמוכה יותר בפרופיל).
   מאסטר בכל 7 המשחקים פותח את התואר "אדון הקבביה" ואת מסגרת המאסטר. שחקנים ותיקים מתחילים מאפס. */

const MST_KEY = 'kebab_mastery';     // { pts: {משחק: נקודות}, cos: {משחק: דרגת המראה שנבחרה}, pending: ['משחק:דרגה'] } - נשמר גם בחשבון
const MST_GAMES = [
    { k: 'delivery', name: 'שליח הקבבים',       icon: '🛵', col: 'leaderboard_delivery', cos: ['קטנוע זהב', 'קטנוע כרום-יהלום', 'קטנוע בוער'] },
    { k: 'ninja',    name: "קבב נינג'ה",          icon: '🥷', col: 'leaderboard_ninja',    cos: ['להב זהב', 'להב קרח', 'להב קשת'] },
    { k: 'shvartz',  name: 'האכל את השוורץ',     icon: '🥙', col: 'leaderboard_shvartz',  cos: ['שובל זהב', 'ניצוצות יהלום', 'כתר וזיקוקים'] },
    { k: 'goods',    name: 'סידור המדפים',       icon: '🥫', col: 'leaderboard_goods',    cos: ['מדפי שיש', 'מדפי קריסטל', 'מדפי ניאון'] },
    { k: 'kvk',      name: 'קבבים מול קולסקים',  icon: '🧟', col: 'leaderboard_kvk',      cos: ['גריל זהב', 'גריל יהלום', 'גריל בוער'] },
    { k: 'catch',    name: 'תפוס את הקבב',       icon: '🍢', col: 'leaderboard',          cos: ['קבב זהב', 'קבב יהלום', 'קבב בוער'] },
    { k: 'trivia',   name: 'חידון האוכל',         icon: '🧠', col: null,                   cos: ['כרטיס זהב', 'כרטיס יהלום', 'כרטיס קוסמי'] }
];
const MST_RANKS = [
    { pts: 0,     name: 'מתחיל', coins: 0 },
    { pts: 300,   name: 'ארד',   coins: 100 },
    { pts: 1000,  name: 'כסף',   coins: 200 },
    { pts: 3000,  name: 'זהב',   coins: 400 },
    { pts: 7500,  name: 'יהלום', coins: 700 },
    { pts: 15000, name: 'מאסטר', coins: 1200 }
];
const MST_COS_FROM = 3;              // מזהב ומעלה יש מראה במשחק
const MST_TITLE = 'אדון הקבביה', MST_FRAME = 'master';
const mstGame = k => MST_GAMES.find(g => g.k === k);
const mstGreat = k => k === 'trivia' ? 100 : (typeof GAME_REWARD !== 'undefined' && GAME_REWARD[k] ? GAME_REWARD[k].great : 100);

function mstState() {
    let st = null;
    try { st = JSON.parse(store.get(MST_KEY) || 'null'); } catch (e) { st = null; }
    st = st && typeof st === 'object' ? st : {};
    const pts = {}, cos = {};
    MST_GAMES.forEach(({ k }) => {
        const p = st.pts && Number(st.pts[k]);
        pts[k] = p > 0 ? Math.floor(p) : 0;
        const c = st.cos && st.cos[k];
        if (c === 0 || (Number.isInteger(c) && c >= MST_COS_FROM && c <= 5)) cos[k] = c;
    });
    const pending = Array.isArray(st.pending) ? st.pending.filter(x => typeof x === 'string' && /^[a-z]+:[1-5]$/.test(x) && mstGame(x.split(':')[0])) : [];
    return { pts, cos, pending };
}
function mstSave(st) { store.set(MST_KEY, JSON.stringify({ pts: st.pts, cos: st.cos, pending: st.pending })); }

function mstRankOf(pts) { let r = 0; MST_RANKS.forEach((x, i) => { if (pts >= x.pts) r = i; }); return r; }
function mstRank(k) { return mstRankOf(mstState().pts[k] || 0); }
// הדרגות של כל 7 המשחקים כמחרוזת של ספרות (לטבלאות השיאים), למשל "3102500"
function mstPublic() { const st = mstState(); return MST_GAMES.map(g => mstRankOf(st.pts[g.k])).join(''); }
const mstOk = s => typeof s === 'string' && /^[0-5]{7}$/.test(s);
function mstAllMaster() { const st = mstState(); return MST_GAMES.every(g => mstRankOf(st.pts[g.k]) === 5); }
// המראה שפעיל עכשיו במשחק: 0 (רגיל) או 3-5. ברירת המחדל - הדרגה הכי גבוהה שנפתחה
function mstCos(k) {
    const st = mstState(), rank = mstRankOf(st.pts[k] || 0);
    const t = Math.min(st.cos[k] === undefined ? rank : st.cos[k], rank);
    return t >= MST_COS_FROM ? t : 0;
}
function mstPoints(k, score) { return score > 0 ? Math.min(200, Math.max(1, Math.round(100 * score / mstGreat(k)))) : 0; }

// נקרא מ-showResultReward
function mstOnGame(k, score) {
    const box = document.getElementById('mst-result');
    if (!mstGame(k)) { if (box) box.style.display = 'none'; return; }
    const gained = mstPoints(k, score);
    if (!gained) { if (box) box.style.display = 'none'; return; }
    const st = mstState();
    const before = st.pts[k], after = before + gained;
    st.pts[k] = after;
    const r0 = mstRankOf(before), r1 = mstRankOf(after);
    for (let r = r0 + 1; r <= r1; r++) st.pending.push(k + ':' + r);
    mstSave(st);
    mstShowResult(k, before, after);
    if (r1 > r0) {
        if (typeof syncLeaderboardSkin === 'function') syncLeaderboardSkin(2000);
        mstCelebrateSoon(3600);
    }
}

/* ---------- תג הדרגה ---------- */
function mstBadge(rank, size) {
    const b = xpEl('span', 'mst-b r' + rank, ['·', '★', '★', '★', '◆', '♛'][rank]);
    if (size) { b.style.width = b.style.height = size + 'px'; b.style.fontSize = Math.round(size * 0.52) + 'px'; }
    b.title = MST_RANKS[rank].name;
    return b;
}
// שורת "עוד X לכסף" עם המספרים משמאל לימין
function mstProgressLine(pts) {
    const r = mstRankOf(pts);
    if (r === 5) return xpLine('mst-sub', ['', pts.toLocaleString('en-US'), ' נקודות · הדרגה הכי גבוהה!']);
    const next = MST_RANKS[r + 1];
    return xpLine('mst-sub', ['', pts.toLocaleString('en-US') + ' / ' + next.pts.toLocaleString('en-US'), ' · עוד ' + (next.pts - pts).toLocaleString('en-US') + ' ל' + next.name]);
}
function mstFrac(pts) {
    const r = mstRankOf(pts);
    if (r === 5) return 1;
    return (pts - MST_RANKS[r].pts) / (MST_RANKS[r + 1].pts - MST_RANKS[r].pts);
}

/* ---------- במסך התוצאה: פס השליטה של המשחק שהסתיים ---------- */
let mstResultTimer = [];
function mstShowResult(k, before, after) {
    let box = document.getElementById('mst-result');
    const anchor = document.getElementById('xp-result') || document.getElementById('result-desc');
    if (!box && anchor) { box = xpEl('div', 'mst-result'); box.id = 'mst-result'; }
    if (!box || !anchor) return;
    if (box.previousElementSibling !== anchor) anchor.after(box);
    mstResultTimer.forEach(clearTimeout); mstResultTimer = [];
    const g = mstGame(k);
    box.style.display = '';
    box.innerHTML = '';
    const badgeWrap = xpEl('div', 'mst-res-badge');
    let shownRank = mstRankOf(before);
    badgeWrap.appendChild(mstBadge(shownRank, 38));
    box.appendChild(badgeWrap);
    const mid = xpEl('div', 'mst-res-mid');
    const head = xpEl('div', 'mst-res-head');
    const nm = xpEl('span', '', 'שליטה ב' + g.name + ' · ');
    const rk = xpEl('b', 'mst-rk r' + shownRank, MST_RANKS[shownRank].name);
    head.appendChild(nm); head.appendChild(rk);
    mid.appendChild(head);
    const bar = xpEl('div', 'xp-bar mst-bar'); const fill = xpEl('i'); bar.appendChild(fill);
    mid.appendChild(bar);
    const sub = xpEl('div', 'mst-sub-wrap'); sub.appendChild(mstProgressLine(before));
    mid.appendChild(sub);
    box.appendChild(mid);
    const plus = xpEl('div', 'mst-res-plus', '+' + (after - before));
    plus.dir = 'ltr';
    box.appendChild(plus);

    fill.style.transition = 'none'; fill.style.width = (mstFrac(before) * 100) + '%'; void fill.offsetWidth;
    mstResultTimer.push(setTimeout(() => {
        const t0 = performance.now(), dur = 1100;
        const step = now => {
            const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
            const v = Math.round(before + (after - before) * e);
            fill.style.width = (mstFrac(v) * 100) + '%';
            const r = mstRankOf(v);
            if (r !== shownRank) {                                  // עלינו דרגה באמצע
                shownRank = r;
                badgeWrap.innerHTML = ''; const nb = mstBadge(r, 38); nb.classList.add('pop'); badgeWrap.appendChild(nb);
                rk.className = 'mst-rk r' + r; rk.textContent = MST_RANKS[r].name;
                bar.classList.remove('flash'); void bar.offsetWidth; bar.classList.add('flash');
                sfx.good();
            }
            if (p < 1) requestAnimationFrame(step);
            else { sub.innerHTML = ''; sub.appendChild(mstProgressLine(after)); plus.classList.add('done'); }
        };
        requestAnimationFrame(step);
    }, 700));
}

/* ---------- חגיגת דרגה חדשה ---------- */
// מחכים שחגיגת הרמה (אם יש) תיסגר, ומציגים רק במסך התוצאה / הבית / הפרופיל - לא באמצע משחק
let mstWaitTimer = null;
function mstCelebrateSoon(delay) {
    clearTimeout(mstWaitTimer);
    mstWaitTimer = setTimeout(function check() {
        if (!mstState().pending.length) return;
        const active = document.querySelector('.screen.active');
        const id = active ? active.id : '';
        if (!['screen-result', 'screen-home', 'screen-profile'].includes(id)) return;     // ממשיך כשחוזרים לבית
        if (document.getElementById('xp-levelup') || document.getElementById('mst-up') || document.getElementById('skin-modal')) { mstWaitTimer = setTimeout(check, 700); return; }
        mstCelebrate();
    }, delay || 0);
}
function mstCelebrate() {
    const st = mstState();
    if (!st.pending.length || document.getElementById('mst-up')) return;
    const key = st.pending[0];
    const [k, rs] = key.split(':'); const rank = +rs, g = mstGame(k), R = MST_RANKS[rank];
    const allNow = rank === 5 && mstAllMaster();

    const ov = xpEl('div', 'xp-levelup mst-up'); ov.id = 'mst-up';
    const card = xpEl('div', 'xp-lu-card mst-card r' + rank);
    card.appendChild(xpEl('div', 'xp-lu-rays'));
    card.appendChild(xpEl('div', 'xp-lu-label', 'דרגת שליטה חדשה!'));
    const bw = xpEl('div', 'mst-up-badge'); bw.appendChild(mstBadge(rank, 92));
    card.appendChild(bw);
    card.appendChild(xpEl('div', 'mst-up-rank r' + rank, R.name));
    card.appendChild(xpEl('div', 'xp-lu-title', g.icon + ' ' + g.name));
    const rew = xpEl('div', 'xp-lu-rewards');
    card.appendChild(rew);
    const btn = xpEl('button', 'xp-lu-btn', 'אספו ' + R.coins.toLocaleString('en-US') + ' 🪙');
    card.appendChild(btn);
    ov.appendChild(card);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('open'));
    sfx.win();
    haptic([60, 40, 60, 40, 160]);
    if (typeof confettiBurst === 'function') confettiBurst(rank >= 4 ? 90 : 60);

    const items = [{ icon: '🪙', text: '+' + R.coins.toLocaleString('en-US') + ' מטבעות' }];
    if (rank >= MST_COS_FROM) items.push({ icon: '✨', text: 'נפתח במשחק: ' + g.cos[rank - MST_COS_FROM] });
    if (allNow) items.push({ icon: '🏷️', text: 'תואר חדש: ' + MST_TITLE }, { frame: MST_FRAME, text: 'מסגרת חדשה: מאסטר' });
    items.forEach((it, i) => setTimeout(() => {
        const row = xpEl('div', 'xp-lu-item');
        if (it.frame) row.appendChild(xpAvatar(currentSkinId(), it.frame, 0, 30));
        else row.appendChild(xpEl('span', 'xp-lu-ic', it.icon));
        row.appendChild(xpEl('span', '', it.text));
        rew.appendChild(row);
        sfx.coin();
        if (i === items.length - 1) btn.classList.add('ready');
    }, 700 + i * 380));

    btn.onclick = () => {
        if (btn.disabled) return;
        btn.disabled = true;
        const s2 = mstState();
        s2.pending = s2.pending.filter(x => x !== key);
        mstSave(s2);
        if (allNow) { const x = xpState(); x.title = MST_TITLE; x.frame = MST_FRAME; xpSave(x); renderXpCard(); }
        sfx.chest();
        if (typeof confettiBurst === 'function') confettiBurst(80);
        flyCoins(btn, R.coins);
        if (typeof syncLeaderboardSkin === 'function') syncLeaderboardSkin(2000);
        setTimeout(() => { ov.classList.remove('open'); setTimeout(() => { ov.remove(); renderXpProfile(); if (mstState().pending.length) mstCelebrate(); }, 300); }, 900);
    };
}

/* ---------- פרופיל: הדרגה בכל משחק ובחירת המראה ---------- */
function renderMstProfile() {
    const xpBox = document.getElementById('xp-profile');
    if (!xpBox) return;
    let box = document.getElementById('mst-profile');
    if (!box) { box = xpEl('div', 'mst-profile'); box.id = 'mst-profile'; }
    if (box.previousElementSibling !== xpBox) xpBox.after(box);
    const st = mstState();
    box.innerHTML = '';
    box.appendChild(xpEl('div', 'xp-prof-h', '🏅 שליטה במשחקים'));
    MST_GAMES.forEach(g => {
        const pts = st.pts[g.k], rank = mstRankOf(pts);
        const row = xpEl('div', 'mst-row');
        row.appendChild(mstBadge(rank, 40));
        const mid = xpEl('div', 'mst-row-mid');
        const top = xpEl('div', 'mst-row-top');
        top.appendChild(xpEl('span', '', g.icon + ' ' + g.name));
        top.appendChild(xpEl('b', 'mst-rk r' + rank, MST_RANKS[rank].name));
        mid.appendChild(top);
        const bar = xpEl('div', 'xp-bar mst-bar'); const fill = xpEl('i'); fill.style.width = (mstFrac(pts) * 100) + '%'; bar.appendChild(fill);
        mid.appendChild(bar);
        mid.appendChild(mstProgressLine(pts));
        // בחירת המראה במשחק (לפני זהב - רק מה שזהב יפתח)
        if (rank < MST_COS_FROM) mid.appendChild(xpEl('div', 'mst-next', '✨ ב' + MST_RANKS[MST_COS_FROM].name + ' נפתח: ' + g.cos[0]));
        else {
            const chips = xpEl('div', 'xp-chips mst-cos');
            const cur = mstCos(g.k);
            const off = xpEl('button', 'xp-pick' + (cur === 0 ? ' on' : ''), 'רגיל');
            off.onclick = () => mstPickCos(g.k, 0);
            chips.appendChild(off);
            g.cos.forEach((name, i) => {
                const t = MST_COS_FROM + i, open = rank >= t;
                if (!open && t > rank + 1) return;                    // רק המראה הנעול הבא
                const c = xpEl('button', 'xp-pick' + (cur === t ? ' on' : '') + (open ? '' : ' locked'), open ? name : '🔒 ' + name + ' · ' + MST_RANKS[t].name);
                if (open) c.onclick = () => mstPickCos(g.k, t);
                chips.appendChild(c);
            });
            mid.appendChild(chips);
        }
        row.appendChild(mid);
        box.appendChild(row);
    });
    const masters = MST_GAMES.filter(g => mstRankOf(st.pts[g.k]) === 5).length;
    const fin = xpEl('div', 'mst-final' + (masters === 7 ? ' done' : ''));
    fin.appendChild(xpAvatar(currentSkinId(), MST_FRAME, 0, 44));
    fin.appendChild(xpLine('mst-final-txt', [masters === 7 ? '👑 אדון הקבביה! ' : '👑 מאסטר בכל המשחקים: התואר "' + MST_TITLE + '" ומסגרת מאסטר · ', masters + ' / 7']));
    box.appendChild(fin);
}
function mstPickCos(k, t) {
    const st = mstState();
    st.cos[k] = t;
    mstSave(st);
    sfx.tap();
    renderMstProfile();
}

/* ---------- חלקיקים לאפקטים בתוך המשחקים (ניצוצות, זיקוקים, גחלים) ---------- */
// כל חלקיק זז לפי הזמן שעבר מאז שנוצר, כך שאין צורך לעדכן אותו בכל פריים
const mstFx = {
    burst(list, x, y, n, colors, speed, life, grav) {
        const now = performance.now();
        for (let i = 0; i < n; i++) {
            const a = Math.random() * Math.PI * 2, v = speed * (0.35 + Math.random() * 0.65);
            list.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t0: now, life: life * (0.7 + Math.random() * 0.5),
                        c: colors[i % colors.length], r: 1.4 + Math.random() * 2.4, g: grav || 0 });
        }
        if (list.length > 400) list.splice(0, list.length - 400);
    },
    draw(c, list) {
        const now = performance.now();
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (let i = list.length - 1; i >= 0; i--) {
            const p = list[i], e = (now - p.t0) / 1000;
            if (e > p.life) { list.splice(i, 1); continue; }
            const k = 1 - e / p.life;
            c.globalAlpha = k;
            c.fillStyle = p.c;
            c.beginPath(); c.arc(p.x + p.vx * e, p.y + p.vy * e + 0.5 * p.g * e * e, p.r * (0.4 + 0.6 * k), 0, Math.PI * 2); c.fill();
        }
        c.restore();
    }
};
const MST_SPARK = ['#ffffff', '#bdf0ff', '#7fdcff'];
const MST_FIRE = ['#ffd23d', '#ff8a1a', '#ff4d1a'];
const MST_GOLD = ['#fff3b0', '#ffd23d', '#ffb020'];

renderMstProfile();
mstCelebrateSoon(2500);              // דרגות שלא נאספו (למשל האפליקציה נסגרה באמצע)

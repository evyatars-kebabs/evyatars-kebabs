/* ============================================================
   אתגרים יומיים
   כל יום נבחרים 3 אתגרים לפי התאריך (אותם אתגרים לכל השחקנים), כל אחד ממשחק אחר.
   ההתקדמות מתעדכנת בסוף כל משחק, ואת הפרס אוספים בבית. השלמת שלושתם = בונוס ורצף ימים.
   ============================================================ */
const DAILY_KEY = 'kebab_daily';
const DAILY_BONUS = 75;
const WEEKLY_PRIZE = 400;                 // כל 7 ימים ברצף
// on = סוג האירוע (שם המשחק, '*' לכל משחק, או 'coupon'); mode: max = הכי טוב במשחק אחד, sum = מצטבר, set = משחקים שונים
const DAILY_POOL = [
    { id: 'dlv_sum',     game: 'delivery', icon: '🛵', text: 'מסרו {t} מנות בשליח הקבבים',             t: 15,  reward: 45, on: 'delivery', mode: 'sum', val: e => e.delivered },
    { id: 'dlv_max',     game: 'delivery', icon: '🛵', text: 'צברו {t} נקודות במשלוח אחד',              t: 120, reward: 45, on: 'delivery', mode: 'max', val: e => e.score },
    { id: 'ninja_slice', game: 'ninja',   icon: '🥷', text: 'חתכו {t} פריטים בקבב נינג\'ה',             t: 60,  reward: 40, on: 'ninja',   mode: 'sum', val: e => e.sliced },
    { id: 'ninja_max',   game: 'ninja',   icon: '🥷', text: 'צברו {t} נקודות במשחק נינג\'ה אחד',        t: 60,  reward: 45, on: 'ninja',   mode: 'max', val: e => e.score },
    { id: 'sv_made',     game: 'shvartz', icon: '🥙', text: 'האכילו את שוורץ {t} פעמים במשחק אחד',     t: 8,   reward: 40, on: 'shvartz', mode: 'max', val: e => e.made },
    { id: 'sv_sum',      game: 'shvartz', icon: '🥙', text: 'צברו {t} נקודות ב"האכל את השוורץ"',        t: 200, reward: 40, on: 'shvartz', mode: 'sum', val: e => e.score },
    { id: 'goods_max',   game: 'goods',   icon: '🥫', text: 'צברו {t} נקודות בסידור המדפים',            t: 30,  reward: 35, on: 'goods',   mode: 'max', val: e => e.score },
    { id: 'trivia_4',    game: 'trivia',  icon: '🧠', text: 'ענו נכון על {t} שאלות בחידון אחד',         t: 4,   reward: 30, on: 'trivia',  mode: 'max', val: e => e.correct },
    { id: 'trivia_sum',  game: 'trivia',  icon: '🧠', text: 'ענו נכון על {t} שאלות בחידון בסך הכול',    t: 10,  reward: 35, on: 'trivia',  mode: 'sum', val: e => e.correct },
    { id: 'kvk_waves',   game: 'kvk',     icon: '🧟', text: 'החזיקו מעמד {t} גלים בקבבים מול קולסקים',  t: 3,   reward: 50, on: 'kvk',     mode: 'max', val: e => e.waves },
    { id: 'kvk_kills',   game: 'kvk',     icon: '🧟', text: 'הביסו {t} קולסקים בסך הכול',              t: 25,  reward: 50, on: 'kvk',     mode: 'sum', val: e => e.kills },
    { id: 'play_5',      game: 'any',     icon: '🎮', text: 'שחקו {t} משחקים',                          t: 5,   reward: 30, on: '*',       mode: 'sum', val: () => 1 },
    { id: 'variety_3',   game: 'any',     icon: '🎲', text: 'שחקו ב-{t} משחקים שונים',                  t: 3,   reward: 40, on: '*',       mode: 'set', val: e => e.game },
    { id: 'coupons_2',   game: 'any',     icon: '🎁', text: 'קבלו {t} קופונים בסוף משחקים',             t: 2,   reward: 35, on: 'coupon',  mode: 'sum', val: () => 1 }
];

function dailyDate(d) { return (d || new Date()).toLocaleDateString('en-CA'); }       // YYYY-MM-DD לפי השעון המקומי

// בחירה דטרמיניסטית לפי התאריך: 3 אתגרים, כל אחד ממשחק אחר (ולכל היותר אחד כללי)
function dailyPick(date) {
    let h = 2166136261;
    for (const ch of date) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    const rnd = () => {                                   // mulberry32 - מפזר היטב גם תאריכים דומים
        h = (h + 0x6D2B79F5) >>> 0;
        let t = h;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pool = DAILY_POOL.slice(), picked = [], games = new Set();
    while (picked.length < 3 && pool.length) {
        const c = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
        if (games.has(c.game)) continue;
        games.add(c.game);
        picked.push(c.id);
    }
    return picked;
}

function dailyLoad() {
    let st = null;
    try { st = JSON.parse(store.get(DAILY_KEY) || 'null'); } catch (e) { st = null; }
    const today = dailyDate();
    if (!st || st.date !== today) {
        st = { date: today, ids: dailyPick(today), prog: {}, claimed: [], notified: [], bonus: false,
               streak: st ? st.streak || 0 : 0, lastFull: st ? st.lastFull || '' : '',
               weekly: st && st.weekly === 'pending' ? 'pending' : null };            // פרס שבועי שלא נאסף נשמר
        dailySave(st);
    }
    // אתגר של משחק שהוסר (למשל "תפוס את הקבב") מוחלף באתגר אחר, כדי שעדיין אפשר יהיה להשלים את כל האתגרים היום
    if (st.ids.some(id => !dailyDef(id))) {
        const spare = dailyPick(today).concat(DAILY_POOL.map(c => c.id)).filter(id => dailyDef(id) && !st.ids.includes(id));
        st.ids = st.ids.map(id => dailyDef(id) ? id : spare.shift());
        dailySave(st);
    }
    return st;
}
function dailySave(st) { store.set(DAILY_KEY, JSON.stringify(st)); }
function dailyDef(id) { return DAILY_POOL.find(c => c.id === id); }
function dailyValue(st, c) {
    const v = st.prog[c.id];
    return c.mode === 'set' ? (Array.isArray(v) ? v.length : 0) : (v || 0);
}

// נקרא בסוף כל משחק (game = שם המשחק) ובכל קופון (game = 'coupon')
function dailyEvent(game, data) {
    const st = dailyLoad();
    const e = Object.assign({ game }, data);
    const done = [];
    st.ids.forEach(id => {
        const c = dailyDef(id);
        if (!c) return;
        if (!(c.on === game || (c.on === '*' && game !== 'coupon'))) return;
        const before = dailyValue(st, c);
        const v = c.val(e);
        if (c.mode === 'max') st.prog[c.id] = Math.max(st.prog[c.id] || 0, v || 0);
        else if (c.mode === 'sum') st.prog[c.id] = (st.prog[c.id] || 0) + (v || 0);
        else if (c.mode === 'set') { const a = Array.isArray(st.prog[c.id]) ? st.prog[c.id] : []; if (!a.includes(v)) a.push(v); st.prog[c.id] = a; }
        if (before < c.t && dailyValue(st, c) >= c.t && !st.notified.includes(c.id)) { st.notified.push(c.id); done.push(c); }
    });
    dailySave(st);
    if (done.length) {
        setTimeout(() => { showToast('🎯 אתגר יומי הושלם! אספו את הפרס במסך הבית'); sfx.match(1); haptic([30, 30, 30]); }, 900);
    }
    renderDaily();
}

function dailyClaim(id, btn) {
    const st = dailyLoad();
    const c = dailyDef(id);
    if (!c || st.claimed.includes(id) || dailyValue(st, c) < c.t) return;
    st.claimed.push(id);
    dailySave(st);
    haptic([90, 40, 90]);
    flyCoins(btn, c.reward);
    renderDaily();
}

function dailyClaimBonus(btn) {
    const st = dailyLoad();
    if (st.bonus || st.claimed.length < st.ids.length) return;
    st.bonus = true;
    // רצף: ימים רצופים שבהם הושלמו כל האתגרים
    const y = new Date(); y.setDate(y.getDate() - 1);
    const prev = st.lastFull === dailyDate(y) ? (st.streak || 0) : 0;
    st.streak = prev + 1;
    st.lastFull = st.date;
    if (st.streak % 7 === 0) st.weekly = 'pending';
    dailySave(st);
    haptic([90, 40, 90, 40, 140]);
    flyCoins(btn, DAILY_BONUS);
    confettiBurst(60);
    renderDaily();
    setTimeout(() => showStreakPop(prev, st.streak), 1400);   // אחרי שהמטבעות נוחתים
}

function dailyClaimWeekly(btn) {
    const st = dailyLoad();
    if (st.weekly !== 'pending') return false;
    st.weekly = 'claimed';
    dailySave(st);
    haptic([60, 40, 60, 40, 200]);
    sfx.chest();
    flyCoins(btn, WEEKLY_PRIZE);
    confettiBurst(90);
    renderDaily();
    return true;
}

// מיקום ברצף השבועי (1-7). ביום שעוד לא הושלם מציגים את הרצף של אתמול.
function streakWeekPos(n) { return n > 0 ? ((n - 1) % 7) + 1 : 0; }

function streakWeekCells(pos, animateNew) {
    const wrap = document.createElement('div');
    wrap.className = 'streak-week';
    for (let i = 1; i <= 7; i++) {
        const d = document.createElement('div');
        d.className = 'streak-day' + (i <= pos ? ' lit' : '') + (i === 7 ? ' prize' : '') + (animateNew && i === pos ? ' new' : '');
        d.style.animationDelay = (animateNew ? 0.35 + i * 0.1 : 0) + 's';
        d.textContent = i === 7 ? '🎁' : (i <= pos ? '🔥' : i);
        wrap.appendChild(d);
    }
    return wrap;
}

/* ---------- חגיגת רצף ---------- */
function showStreakPop(from, to) {
    let pop = document.getElementById('streak-pop');
    if (pop) pop.remove();
    pop = document.createElement('div');
    pop.id = 'streak-pop';
    const card = document.createElement('div');
    card.className = 'streak-card';
    const flame = document.createElement('div');
    flame.className = 'streak-flame';
    flame.innerHTML = '<span class="sf-fire">🔥</span>';
    const num = document.createElement('span');
    num.className = 'sf-num';
    num.textContent = from;
    flame.appendChild(num);
    const title = document.createElement('div');
    title.className = 'streak-title';
    title.textContent = to === 1 ? 'התחלתם רצף!' : 'רצף של ' + to + ' ימים!';
    const pos = streakWeekPos(to);
    const sub = document.createElement('div');
    sub.className = 'streak-sub';
    sub.textContent = pos === 7 ? 'שבוע שלם ברצף - הפרס השבועי שלכם!' : 'עוד ' + (7 - pos) + (7 - pos === 1 ? ' יום' : ' ימים') + ' לפרס השבועי של 🪙' + WEEKLY_PRIZE;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'יאללה! 🔥';
    card.appendChild(flame); card.appendChild(title); card.appendChild(sub);
    card.appendChild(streakWeekCells(pos, true));
    card.appendChild(btn);
    pop.appendChild(card);
    document.body.appendChild(pop);
    requestAnimationFrame(() => pop.classList.add('open'));

    sfx.streak();
    haptic([40, 30, 40, 30, 120]);
    // ספירה עולה של המספר
    let n = from;
    const step = () => {
        if (n >= to) { num.classList.add('done'); return; }
        n++; num.textContent = n; sfx.streakTick(n); num.classList.remove('bump'); void num.offsetWidth; num.classList.add('bump');
        setTimeout(step, 180);
    };
    setTimeout(step, 450);
    // יום חדש נדלק במסלול
    setTimeout(() => { sfx.tap(); haptic(25); }, 450 + pos * 100);

    const close = () => { pop.classList.remove('open'); setTimeout(() => pop.remove(), 300); };
    if (pos === 7 && dailyLoad().weekly === 'pending') {
        // יום 7: תיבת האוצר
        btn.textContent = 'פתחו את התיבה 🎁';
        btn.onclick = () => {
            card.classList.add('chest-mode');
            title.textContent = 'פרס שבועי!';
            sub.textContent = '7 ימים ברצף - אלופים!';
            flame.innerHTML = '<span class="sf-chest">🎁</span><span class="sf-prize">+' + WEEKLY_PRIZE + ' 🪙</span>';
            btn.textContent = 'אסוף 🪙' + WEEKLY_PRIZE;
            sfx.chest();
            haptic([30, 20, 30, 20, 30]);
            btn.onclick = () => { btn.disabled = true; dailyClaimWeekly(btn); setTimeout(close, 1800); };
        };
    } else {
        btn.onclick = close;
        pop.addEventListener('click', e => { if (e.target === pop) close(); });
    }
}

function dailyCountdown() {
    const now = new Date(), next = new Date(now);
    next.setHours(24, 0, 0, 0);
    const s = Math.max(0, Math.floor((next - now) / 1000));
    const p = n => String(n).padStart(2, '0');
    return p(Math.floor(s / 3600)) + ':' + p(Math.floor(s / 60) % 60) + ':' + p(s % 60);
}

function renderDaily() {
    const box = document.getElementById('daily-box');
    if (!box) return;
    const st = dailyLoad();
    // רצף שנשבר (פספסו יום) מוצג כ-0
    const y = new Date(); y.setDate(y.getDate() - 1);
    const streak = (st.lastFull === st.date || st.lastFull === dailyDate(y)) ? st.streak : 0;
    box.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'daily-head';
    const title = document.createElement('div');
    title.className = 'daily-title';
    title.textContent = '🎯 אתגרים יומיים';
    const meta = document.createElement('div');
    meta.className = 'daily-meta';
    const timer = document.createElement('span');
    timer.id = 'daily-timer';
    timer.textContent = '⏳ ' + dailyCountdown();
    meta.appendChild(timer);
    const sk = document.createElement('span');
    sk.className = 'daily-streak' + (streak > 0 ? ' on' : '');
    sk.innerHTML = '<i>🔥</i>' + streak;
    sk.title = 'ימים ברצף';
    meta.appendChild(sk);
    head.appendChild(title);
    head.appendChild(meta);
    box.appendChild(head);

    // מסלול השבוע: 7 ימים, בסופו פרס
    const pos = streakWeekPos(streak);
    const week = document.createElement('div');
    week.className = 'daily-week';
    week.appendChild(streakWeekCells(pos, false));
    const wl = document.createElement('div');
    wl.className = 'daily-week-label';
    const left = 7 - pos;
    wl.textContent = st.weekly === 'pending' ? '🎁 הפרס השבועי מחכה לכם!' :
        (pos === 7 ? '🏆 השלמתם שבוע! רצף חדש מתחיל מחר' : 'עוד ' + left + (left === 1 ? ' יום' : ' ימים') + ' ברצף לפרס של 🪙' + WEEKLY_PRIZE);
    week.appendChild(wl);
    if (st.weekly === 'pending') {
        const wb = document.createElement('button');
        wb.className = 'daily-act ready';
        wb.textContent = 'אסוף 🪙' + WEEKLY_PRIZE;
        wb.onclick = () => dailyClaimWeekly(wb);
        week.appendChild(wb);
    }
    box.appendChild(week);

    st.ids.forEach(id => {
        const c = dailyDef(id);
        if (!c) return;
        const v = Math.min(c.t, dailyValue(st, c)), complete = v >= c.t, claimed = st.claimed.includes(id);
        const row = document.createElement('div');
        row.className = 'daily-row' + (claimed ? ' claimed' : complete ? ' complete' : '');
        const icon = document.createElement('div'); icon.className = 'daily-icon'; icon.textContent = c.icon;
        const body = document.createElement('div'); body.className = 'daily-body';
        const txt = document.createElement('div'); txt.className = 'daily-text'; txt.textContent = c.text.replace('{t}', c.t);
        const bar = document.createElement('div'); bar.className = 'daily-bar';
        const fill = document.createElement('i'); fill.style.width = (v / c.t * 100) + '%'; bar.appendChild(fill);
        const num = document.createElement('div'); num.className = 'daily-num'; num.textContent = v + '/' + c.t;
        body.appendChild(txt); body.appendChild(bar); body.appendChild(num);
        const act = document.createElement('button');
        act.className = 'daily-act';
        if (claimed) { act.textContent = '✓'; act.disabled = true; }
        else if (complete) { act.textContent = 'אסוף 🪙' + c.reward; act.classList.add('ready'); act.onclick = () => dailyClaim(id, act); }
        else { act.textContent = '🪙' + c.reward; act.disabled = true; }
        row.appendChild(icon); row.appendChild(body); row.appendChild(act);
        box.appendChild(row);
    });

    const all = st.claimed.length >= st.ids.length;
    const bonus = document.createElement('div');
    bonus.className = 'daily-bonus' + (st.bonus ? ' claimed' : all ? ' complete' : '');
    const bt = document.createElement('span');
    bt.textContent = st.bonus ? '🏆 כל האתגרים של היום הושלמו! חזרו מחר' : '🏆 השלימו את שלושת האתגרים: בונוס ורצף ימים';
    bonus.appendChild(bt);
    if (!st.bonus) {
        const bb = document.createElement('button');
        bb.className = 'daily-act' + (all ? ' ready' : '');
        bb.textContent = all ? 'אסוף 🪙' + DAILY_BONUS : '🪙' + DAILY_BONUS;
        bb.disabled = !all;
        if (all) bb.onclick = () => dailyClaimBonus(bb);
        bonus.appendChild(bb);
    }
    box.appendChild(bonus);
}

// טיימר המבצע בחנות
setInterval(() => {
    const el = document.getElementById('deal-timer');
    const shop = document.getElementById('screen-shop');
    if (!el || !shop || !shop.classList.contains('active')) return;
    let d = null;
    try { d = JSON.parse(store.get(DEAL_KEY) || 'null'); } catch (e) { d = null; }
    if (!d || d.date !== dailyDate()) { renderShop(); return; }      // יום חדש - מבצע חדש
    el.textContent = '⏳ ' + dailyCountdown();
}, 1000);

// טיימר ההתחלפות + מעבר יום כשהמסך פתוח
setInterval(() => {
    const home = document.getElementById('screen-home');
    if (!home || !home.classList.contains('active')) return;
    const st = (() => { try { return JSON.parse(store.get(DAILY_KEY) || 'null'); } catch (e) { return null; } })();
    if (!st || st.date !== dailyDate()) { renderDaily(); return; }
    const t = document.getElementById('daily-timer');
    if (t) t.textContent = '⏳ ' + dailyCountdown();
}, 1000);

let lastGameKey = null;
function playAgain() {
    const starters = { delivery: startDeliveryGame, trivia: startTriviaGame, goods: startGoodsSortGame, shvartz: startShvartzGame, ninja: startNinjaGame, kvk: startKvkGame };
    (starters[lastGameKey] || (() => switchTab('home')))();
}

function showResultReward(gameKey, score) {
    lastGameKey = gameKey;
    const box = document.getElementById('coupon-box');
    const txt = document.getElementById('coupon-text');
    const coinsEl = document.getElementById('coupon-coins');
    const totalEl = document.getElementById('coupon-total');
    const claimBtn = document.getElementById('claim-btn');
    claimBtn.style.display = 'none';
    pendingCoins = 0;
    if (!GAME_REWARD[gameKey]) { box.style.display = 'none'; return; }

    box.style.display = 'block';
    // מפעילים מחדש את אנימציות הכניסה בכל תוצאה
    box.style.animation = 'none'; void box.offsetWidth; box.style.animation = '';
    coinsEl.style.animation = 'none'; void coinsEl.offsetWidth; coinsEl.style.animation = '';

    const coupon = rollCoupon(gameKey, score);
    if (!coupon) {
        box.classList.add('empty');
        txt.textContent = 'הפעם אין קופון. נסו שוב!';
        coinsEl.textContent = '';
        totalEl.textContent = '';
        sfx.low();
        return;
    }
    box.classList.remove('empty');
    dailyEvent('coupon', {});
    txt.textContent = coupon.text;
    coinsEl.textContent = '+' + coupon.coins + ' 🪙 קבב קוינס';
    totalEl.textContent = '';
    pendingCoins = coupon.coins;                      // המטבעות נכנסים ליתרה רק בלחיצה על "אסוף"
    claimBtn.style.display = 'block';
    claimBtn.disabled = false;
    claimBtn.textContent = 'אסוף ' + coupon.coins + ' 🪙';
    sfx.win();
    confettiBurst(coupon.coins >= 35 ? 70 : 40);
    haptic([20, 40, 20]);
}

/* ---------- סקינים: בעלות ובחירה ---------- */
function getOwnedSkins() {
    let set;
    try {
        const a = JSON.parse(store.get(SKINS_KEY) || '[]');
        set = new Set(['classic'].concat(Array.isArray(a) ? a : []));
    } catch (e) { set = new Set(['classic']); }
    // מי שמחזיק גרסה אחת של סקין מחזיק את כולן
    Object.entries(SKIN_GROUPS).forEach(([base, opts]) => {
        if (set.has(base) || opts.some(o => set.has(o.id))) { set.add(base); opts.forEach(o => set.add(o.id)); }
    });
    return set;
}
function saveOwnedSkins(set) {
    store.set(SKINS_KEY, JSON.stringify(Array.from(set).filter(x => x !== 'classic')));
}
function getEquippedSkinId() {
    const id = store.get(SKIN_EQ_KEY) || 'classic';
    return (SV_SKINS.some(s => s.id === id) && getOwnedSkins().has(id)) ? id : 'classic';
}

let toastTimer = null;
function showToast(text, ok) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = text;
    t.style.borderColor = ok === false ? '#f85149' : 'var(--accent-gold)';
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

function buySkin(id) {
    const sk = skinById(id);
    const owned = getOwnedSkins();
    if (owned.has(id) || SK_RARITY[sk.rarity].codeOnly) return;
    const price = skinPriceNow(sk);
    if (!spendCoins(price)) {
        sfx.err();
        showToast('אין מספיק קבב קוינס 🪙', false);
        return;
    }
    owned.add(id);
    const grp = skinGroupOf(id);
    if (grp) { owned.add(grp); SKIN_GROUPS[grp].forEach(o => owned.add(o.id)); }   // קנייה פותחת את כל הגרסאות
    saveOwnedSkins(owned);
    store.set(SKIN_EQ_KEY, id);               // סקין שנרכש נבחר אוטומטית
    sfx.buy();
    confettiBurst(26);
    showToast('נרכש! ' + sk.name + ' מוכן לאכול 🥙');
    renderShop();
}
function equipSkin(id) {
    if (!getOwnedSkins().has(id)) return;
    store.set(SKIN_EQ_KEY, id);
    showToast('נבחר: ' + skinById(id).name);
    syncLeaderboardSkin();
    renderShop();
}

/* ---------- תצוגה מקדימה של סקין ---------- */
const previewCache = {};
function getPreview(sk) {
    if (!previewCache[sk.id]) {
        const cv = document.createElement('canvas');
        cv.width = 360; cv.height = 400;
        cv.className = 'shop-preview';
        drawSkinPreview(cv, sk);
        previewCache[sk.id] = cv;
    }
    return previewCache[sk.id];
}

// opts.t = זמן (לאנימציה), opts.anim = פה שנפתח ולועס ועיניים שעוקבות, opts.k = רזולוציה (פיקסלים ליחידה)
function drawSkinPreview(cv, skin, opts) {
    opts = opts || {};
    const k = opts.k || 1, W = cv.width / k, H = cv.height / k;
    const c = cv.getContext('2d');
    c.setTransform(k, 0, 0, k, 0, 0);
    c.clearRect(0, 0, W, H);
    const bg = c.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#1a0f0a');
    bg.addColorStop(1, '#3a2012');
    c.fillStyle = bg;
    c.fillRect(0, 0, W, H);

    c.save();
    c.beginPath();
    c.rect(0, 0, W, H);
    c.clip();
    c.translate(W / 2, H * 0.6);
    c.scale(0.85 * W / 360, 0.85 * W / 360);
    const t = opts.t !== undefined ? opts.t : 1.3;
    // מחזור "אכילה": פה נפתח לקראת האוכל, ואז לעיסה
    let ry = 44 * 0.36, chew = 0, surprised = false;
    if (opts.anim) {
        const ph = t % 3;
        if (ph < 0.7) { ry *= 1 + ph * 0.5; surprised = true; }
        else if (ph < 1.6) { chew = 1; ry *= 1 + 0.25 * Math.sin(t * 30); }
    }
    if (skin.kind === 'cone') {
        const saved = sv;                     // הציור של הקונוס משתמש במצב המשחק, אז מחליפים זמנית
        sv = { mouth: { x: 0, y: 0, hw: 44, chew }, ball: null, t: t, aim: null };
        svDrawBody(c);
        svDrawMouthBack(c);
        svDrawLowerLip(c);
        sv = saved;
    } else {
        const tx = opts.anim ? Math.cos(t * 0.9) * 260 : 120, ty = opts.anim ? -120 + Math.sin(t * 1.3) * 160 : -200;
        const st = { x: 0, y: 0, hw: 44, ry, chew, t: t, tx, ty, surprised, mx: 0, my: 0 };
        skDrawHumanBack(c, skin, st);
        skMouthBack(c, skin, st);
        skDrawHumanFront(c, skin, st);
        skMouthFront(c, skin, st);
        skDrawHumanFx(c, skin, st);
    }
    c.restore();
}

/* ---------- מסך החנות ---------- */
/* ---------- קטגוריות החנות ----------
   כל קטגוריה ממוינת לפי נדירות. סקין חדש שלא שויך לקטגוריה יופיע ב"עוד סקינים".
   מהדורה מיוחדת (נדירות 6) מוצגת בנפרד, ורק סקינים שכבר נפתחו בקוד. */
const SHOP_CATEGORIES = [
    { id: 'food',    title: 'אוכל ושתייה',        icon: '🍢', ids: ['kebab', 'laffa', 'bubacola', 'rolazero', 'albanta', 'bambababy'] },
    { id: 'hood',    title: 'אנשי השכונה',        icon: '🏘️', ids: ['danny', 'noa', 'yosi', 'roei', 'michal', 'avi', 'yuval', 'shira', 'omer', 'tamar', 'itay', 'dudu', 'maya', 'gili', 'yacht'] },
    { id: 'jobs',    title: 'מקצועות',            icon: '👷', ids: ['chef', 'waiter', 'farmer', 'beekeeper', 'builder', 'mechanic', 'fire', 'police', 'lifeguard', 'sailor', 'pilot', 'scientist', 'detective', 'dj', 'boxer', 'astronaut'] },
    { id: 'history', title: 'דמויות היסטוריות',   icon: '🏛️', ids: ['pharaoh', 'gladiator', 'samurai', 'knight', 'viking', 'ninja', 'pirate', 'sultan', 'king', 'cowboy', 'hunter', 'gangster', 'einstein', 'newton', 'rhodes', 'frida', 'monalisa'] },
    { id: 'fantasy', title: 'פנטזיה ומיתולוגיה',  icon: '🧙', ids: ['wizard', 'vampire', 'icequeen', 'angel', 'firemage', 'thunder', 'phoenix', 'shadow', 'dragon', 'cosmic', 'voidlord', 'kebabgod'] },
    { id: 'future',  title: 'גיבורים ועתיד',      icon: '🚀', ids: ['hero', 'cyborg', 'hacker'] },
    { id: 'stars',   title: 'כוכבים',             icon: '⭐', ids: ['rocker', 'punk', 'hedgehog', 'spidey', 'voldy', 'deni'] }
];

const VARIANT_KEY = 'kebab_skin_variant';        // הגרסה שנבחרה במתג לכל כרטיס

// הגרסה שמוצגת בכרטיס: זו שבשימוש אם הסקין נבחר, אחרת מה שנבחר במתג, אחרת הראשית
function shopVariantOf(base) {
    const eq = getEquippedSkinId();
    if (skinGroupOf(eq) === base) return eq;
    let pref = {};
    try { pref = JSON.parse(store.get(VARIANT_KEY) || '{}') || {}; } catch (e) { pref = {}; }
    const id = pref[base];
    return SKIN_GROUPS[base] && SKIN_GROUPS[base].some(o => o.id === id) ? id : base;
}
function shopSetVariant(base, id) {
    let pref = {};
    try { pref = JSON.parse(store.get(VARIANT_KEY) || '{}') || {}; } catch (e) { pref = {}; }
    pref[base] = id;
    store.set(VARIANT_KEY, JSON.stringify(pref));
    // אם הסקין הזה בשימוש - מחליפים מיד לגרסה שנבחרה
    if (skinGroupOf(getEquippedSkinId()) === base && getOwnedSkins().has(id)) store.set(SKIN_EQ_KEY, id);
    sfx.tap();
    haptic(10);
    renderShop();
}

const SHOP_PREVIEW = 8;                 // כמה סקינים מוצגים בכל קטגוריה לפני "הצג עוד"
const shopExpanded = new Set();         // קטגוריות שנפתחו במלואן

function copyPreview(sk) {
    const src = getPreview(sk);
    const cv = document.createElement('canvas');
    cv.width = src.width; cv.height = src.height; cv.className = src.className;
    cv.getContext('2d').drawImage(src, 0, 0);
    return cv;
}
function shopScrollTo(id) {
    const head = document.getElementById('shop-cat-' + id);
    if (head) head.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderDealBanner(grid, owned, eq, coins) {
    const d = dealToday();
    if (!d) return;
    const base = skinById(d.id);
    const sk = SKIN_GROUPS[base.id] ? skinById(shopVariantOf(base.id)) : base;
    const rar = SK_RARITY[sk.rarity];
    const box = document.createElement('div');
    box.className = 'shop-deal';
    box.style.setProperty('--rc', rar.color);
    const pv = document.createElement('canvas');
    pv.width = 240; pv.height = 266;
    pv.className = 'shop-deal-pv';
    drawSkinPreview(pv, sk, { k: 240 / 360 });
    pv.onclick = () => openSkinModal(base.id);
    const info = document.createElement('div');
    info.className = 'shop-deal-info';
    const head = document.createElement('div');
    head.className = 'shop-deal-head';
    head.innerHTML = '<b>🔥 מבצע היום</b><span id="deal-timer">⏳ ' + dailyCountdown() + '</span>';
    const nm = document.createElement('div');
    nm.className = 'shop-deal-name';
    nm.textContent = sk.name;
    const tag = document.createElement('span');
    tag.className = 'shop-rarity';
    tag.textContent = rar.name;
    const prices = document.createElement('div');
    prices.className = 'shop-deal-prices';
    prices.innerHTML = '<s>🪙' + skinPrice(sk) + '</s> <b>🪙' + skinPriceNow(sk) + '</b> <em>-' + Math.round(DEAL_OFF * 100) + '%</em>';
    const btn = document.createElement('button');
    btn.className = 'btn shop-btn';
    if (eq === sk.id) { btn.textContent = 'נבחר ✓'; btn.disabled = true; }
    else if (owned.has(sk.id)) { btn.textContent = 'נרכש ✓ · בחר'; btn.onclick = () => equipSkin(sk.id); }
    else {
        btn.textContent = 'קנה עכשיו 🪙 ' + skinPriceNow(sk);
        if (coins < skinPriceNow(sk)) btn.classList.add('cant');
        btn.onclick = () => buySkin(sk.id);
    }
    info.appendChild(head); info.appendChild(nm); info.appendChild(tag); info.appendChild(prices); info.appendChild(btn);
    box.appendChild(pv); box.appendChild(info);
    grid.appendChild(box);
}

/* ---------- תצוגה מקדימה גדולה ומונפשת ---------- */
let skinModal = null;
function closeSkinModal(now) {
    if (!skinModal) return;
    cancelAnimationFrame(skinModal.raf);
    const m = skinModal.el;
    if (now) m.remove();                                  // נפתחת תצוגה אחרת - מסירים מיד
    else { m.classList.remove('open'); setTimeout(() => m.remove(), 220); }
    skinModal = null;
}
function openSkinModal(base) {
    closeSkinModal(true);
    const el = document.createElement('div');
    el.id = 'skin-modal';
    const card = document.createElement('div');
    card.className = 'skin-modal-card';
    const x = document.createElement('button');
    x.className = 'skin-modal-x';
    x.textContent = '✕';
    x.onclick = closeSkinModal;
    const cv = document.createElement('canvas');
    cv.className = 'skin-modal-cv';
    const k = Math.min(3, (window.devicePixelRatio || 1)) * 300 / 360;
    cv.width = Math.round(360 * k); cv.height = Math.round(400 * k);
    const body = document.createElement('div');
    body.className = 'skin-modal-body';
    card.appendChild(x); card.appendChild(cv); card.appendChild(body);
    el.appendChild(card);
    el.addEventListener('click', e => { if (e.target === el) closeSkinModal(); });
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('open'));
    skinModal = { el, cv, body, base, k, raf: 0, t0: performance.now() };
    renderSkinModal();
    const loop = ts => {
        if (!skinModal || skinModal.el !== el) return;
        drawSkinPreview(cv, skinById(skinModal.show), { t: 1 + (ts - skinModal.t0) / 1000, anim: true, k });
        skinModal.raf = requestAnimationFrame(loop);
    };
    skinModal.raf = requestAnimationFrame(loop);
}
function renderSkinModal() {
    if (!skinModal) return;
    const base = skinModal.base, group = SKIN_GROUPS[base];
    const sk = group ? skinById(shopVariantOf(base)) : skinById(base);
    skinModal.show = sk.id;
    const owned = getOwnedSkins(), eq = getEquippedSkinId(), coins = getCoins();
    const rar = SK_RARITY[sk.rarity];
    const b = skinModal.body;
    b.innerHTML = '';
    skinModal.el.style.setProperty('--rc', rar ? rar.color : '#b9a38e');
    const tag = document.createElement('span'); tag.className = 'shop-rarity'; tag.textContent = rar ? rar.name : 'ברירת מחדל';
    const nm = document.createElement('div'); nm.className = 'skin-modal-name'; nm.textContent = sk.name;
    const cat = SHOP_CATEGORIES.find(c => c.ids.includes(base));
    const sub = document.createElement('div'); sub.className = 'skin-modal-sub';
    sub.textContent = (cat ? cat.icon + ' ' + cat.title : (rar && rar.codeOnly ? '🎟 מהדורה מיוחדת' : '')) + ' · יאכל ב"האכל את השוורץ"';
    b.appendChild(tag); b.appendChild(nm); b.appendChild(sub);
    if (group) {
        const sw = document.createElement('div');
        sw.className = 'skin-switch' + (group.length > 2 ? ' triple' : '');
        group.forEach(opt => {
            const o = document.createElement('button');
            o.textContent = opt.label;
            o.className = opt.id === sk.id ? 'on' : '';
            o.onclick = () => { shopSetVariant(base, opt.id); renderSkinModal(); };
            sw.appendChild(o);
        });
        b.appendChild(sw);
    }
    const btn = document.createElement('button');
    btn.className = 'btn';
    if (eq === sk.id) { btn.textContent = 'נבחר ✓'; btn.disabled = true; }
    else if (owned.has(sk.id)) { btn.textContent = 'בחר את ' + sk.name; btn.onclick = () => { equipSkin(sk.id); renderSkinModal(); }; }
    else {
        const price = skinPriceNow(sk);
        btn.textContent = 'קנה 🪙 ' + price;
        if (price < skinPrice(sk)) { const was = document.createElement('s'); was.className = 'shop-was'; was.textContent = skinPrice(sk); btn.appendChild(was); }
        if (coins < price) btn.classList.add('cant');
        btn.onclick = () => { buySkin(sk.id); renderSkinModal(); };
    }
    b.appendChild(btn);
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSkinModal(); });

/* ---------- פרופיל שחקן (נפתח בלחיצה על שורה בטבלת השיאים) ---------- */
function openPlayerModal(p) {
    closeSkinModal(true);
    const sk = SV_SKINS.some(x => x.id === p.skin) ? skinById(p.skin) : skinById('classic');
    const rar = SK_RARITY[sk.rarity];
    const el = document.createElement('div');
    el.id = 'skin-modal';
    el.className = 'player-modal';
    el.style.setProperty('--rc', rar ? rar.color : '#b9a38e');
    const card = document.createElement('div');
    card.className = 'skin-modal-card';
    const x = document.createElement('button');
    x.className = 'skin-modal-x'; x.textContent = '✕'; x.onclick = closeSkinModal;
    const cv = document.createElement('canvas');
    cv.className = 'skin-modal-cv';
    const k = Math.min(3, (window.devicePixelRatio || 1)) * 300 / 360;
    cv.width = Math.round(360 * k); cv.height = Math.round(400 * k);
    const body = document.createElement('div');
    body.className = 'skin-modal-body';
    const nm = document.createElement('div'); nm.className = 'skin-modal-name'; nm.textContent = p.name + (p.id === playerId ? ' (אתה)' : '');
    const skl = document.createElement('div'); skl.className = 'skin-modal-sub';
    const tag = document.createElement('span'); tag.className = 'shop-rarity'; tag.textContent = rar ? rar.name : 'ברירת מחדל';
    // שם של סקין ממהדורה מיוחדת נשאר סוד - אלא אם גם לך יש אותו (או שזה הפרופיל שלך)
    const secret = rar && rar.codeOnly && p.id !== playerId && !getOwnedSkins().has(sk.id);
    skl.appendChild(document.createTextNode('הסקין: ' + (secret ? '???' : sk.name) + ' '));
    skl.appendChild(tag);
    const coinsEl = document.createElement('div'); coinsEl.className = 'player-coins'; coinsEl.textContent = '🪙 ...';
    const list = document.createElement('ul'); list.className = 'player-bests';
    const li = document.createElement('li'); li.className = 'player-bests-wait'; li.textContent = 'טוען שיאים...';
    list.appendChild(li);
    body.appendChild(nm); body.appendChild(skl); body.appendChild(coinsEl); body.appendChild(list);
    card.appendChild(x); card.appendChild(cv); card.appendChild(body);
    el.appendChild(card);
    el.addEventListener('click', e => { if (e.target === el) closeSkinModal(); });
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('open'));
    skinModal = { el, cv, body, k, raf: 0, t0: performance.now(), show: sk.id };
    const loop = ts => {
        if (!skinModal || skinModal.el !== el) return;
        drawSkinPreview(cv, sk, { t: 1 + (ts - skinModal.t0) / 1000, anim: true, k });
        skinModal.raf = requestAnimationFrame(loop);
    };
    skinModal.raf = requestAnimationFrame(loop);

    getPlayerBests(p.id, p.known).then(data => {
        if (!skinModal || skinModal.el !== el) return;
        const rows = data.list;
        coinsEl.textContent = '🪙 ' + (typeof data.coins === 'number' ? data.coins.toLocaleString('en-US') + ' מטבעות' : 'יתרה לא ידועה');
        list.innerHTML = '';
        rows.forEach(r => {
            const row = document.createElement('li');
            const a = document.createElement('span'); a.textContent = r.label;
            const v = document.createElement('b');
            v.textContent = r.score === null ? '—' : (r.score > 0 ? r.score + " נק'" : 'עוד לא שיחק');
            if (r.score > 0 && r.rank) { const m = document.createElement('small'); m.textContent = ' #' + r.rank; v.appendChild(m); }
            if (!(r.score > 0)) row.className = 'none';
            row.appendChild(a); row.appendChild(v);
            list.appendChild(row);
        });
        if (rows.every(r => r.score === null)) list.innerHTML = '<li class="player-bests-wait">אין חיבור לשרת כרגע</li>';
    });
}

function renderShop() {
    const grid = document.getElementById('shop-grid');
    if (!grid) return;
    renderCoinBadges();
    const owned = getOwnedSkins();
    const eq = getEquippedSkinId();
    const coins = getCoins();
    const prevScroll = document.getElementById('screen-shop').scrollTop;
    grid.innerHTML = '';

    const byRarity = (a, b) => a.rarity - b.rarity;
    const isSpecial = s => s.rarity >= 0 && SK_RARITY[s.rarity] && SK_RARITY[s.rarity].codeOnly;
    const placed = new Set(SHOP_CATEGORIES.flatMap(c => c.ids));
    // הקטגוריה הראשונה: הסקינים של השחקן, מהנדיר ביותר לנפוץ (כרטיס אחד לכל סקין עם גרסאות)
    const groups = [{ id: 'owned', title: 'הסקינים שלי', icon: '🎒', color: '#4ad66d',
                      skins: SV_SKINS.filter(s => owned.has(s.id) && !s.variantOf).sort((a, b) => b.rarity - a.rarity) },
                    { id: 'default', title: 'ברירת מחדל', icon: '🥙', color: '#b9a38e', skins: SV_SKINS.filter(s => s.rarity < 0) }];
    SHOP_CATEGORIES.forEach(cat => groups.push({
        id: cat.id, title: cat.title, icon: cat.icon, color: '#ffc233',
        skins: SV_SKINS.filter(s => cat.ids.includes(s.id) && !isSpecial(s) && !s.variantOf).sort(byRarity)
    }));
    groups.push({ id: 'more', title: 'עוד סקינים', icon: '🎨', color: '#ffc233',
                  skins: SV_SKINS.filter(s => s.rarity >= 0 && !isSpecial(s) && !placed.has(s.id) && !s.variantOf).sort(byRarity) });
    // סקינים של מהדורה מיוחדת מופיעים רק אחרי שהושגו עם קוד
    groups.push({ id: 'special', title: 'מהדורה מיוחדת', icon: '🎟', color: SK_RARITY[6].color,
                  skins: SV_SKINS.filter(s => isSpecial(s) && owned.has(s.id) && !s.variantOf) });
    const visible = groups.filter(g => g.skins.length);

    // קיצורי דרך לקטגוריות
    const chips = document.createElement('div');
    chips.className = 'shop-cats';
    visible.filter(g => g.id !== 'default').forEach(g => {
        const chip = document.createElement('button');
        chip.className = 'shop-cat';
        chip.textContent = g.icon + ' ' + g.title;
        chip.onclick = () => {                         // בחירת קטגוריה פותחת אותה במלואה
            shopExpanded.add(g.id);
            renderShop();
            shopScrollTo(g.id);
        };
        chips.appendChild(chip);
    });
    grid.appendChild(chips);
    renderDealBanner(grid, owned, eq, coins);

    visible.forEach(g => {
        const head = document.createElement('div');
        head.className = 'shop-group-head';
        head.id = 'shop-cat-' + g.id;
        head.style.color = g.color;
        head.style.borderColor = g.color;
        const l = document.createElement('span');
        l.textContent = g.icon + ' ' + g.title;
        const r = document.createElement('span');
        r.className = 'shop-group-count';
        const have = g.skins.filter(s => owned.has(s.id)).length;      // כרטיס עם גרסאות נספר פעם אחת
        r.textContent = g.id === 'default' ? 'חינם' : g.id === 'owned' ? (g.skins.length === 1 ? 'סקין אחד' : g.skins.length + ' סקינים') : have + '/' + g.skins.length;
        head.appendChild(l);
        head.appendChild(r);
        grid.appendChild(head);

        const wrap = document.createElement('div');
        wrap.className = 'shop-cards';
        const long = g.skins.length > SHOP_PREVIEW;
        const open = shopExpanded.has(g.id);
        const shown = long && !open ? g.skins.slice(0, SHOP_PREVIEW) : g.skins;
        shown.forEach(baseSk => {
            // בכרטיס עם גרסאות מוצגת הגרסה שנבחרה במתג (או זו שבשימוש)
            const group = SKIN_GROUPS[baseSk.id];
            const sk = group ? skinById(shopVariantOf(baseSk.id)) : baseSk;
            const rar = SK_RARITY[sk.rarity];
            const card = document.createElement('div');
            card.className = 'shop-card r' + sk.rarity + (eq === sk.id ? ' equipped' : '');
            card.style.setProperty('--rc', rar ? rar.color : '#b9a38e');

            // אותו סקין מופיע גם ב"הסקינים שלי" וגם בקטגוריה שלו - לכרטיס השני מעתיקים את התמונה
            const pv = g.id === 'owned' ? copyPreview(sk) : getPreview(sk);
            pv.onclick = () => openSkinModal(baseSk.id);
            card.appendChild(pv);
            const zoom = document.createElement('button');
            zoom.className = 'shop-zoom';
            zoom.textContent = '🔍';
            zoom.title = 'תצוגה מקדימה';
            zoom.onclick = () => openSkinModal(baseSk.id);
            card.appendChild(zoom);

            const tag = document.createElement('div');
            tag.className = 'shop-rarity';
            tag.textContent = rar ? rar.name : 'ברירת מחדל';
            card.appendChild(tag);

            const nm = document.createElement('div');
            nm.className = 'shop-name';
            nm.textContent = sk.name;
            card.appendChild(nm);

            if (group) {
                const sw = document.createElement('div');
                sw.className = 'skin-switch' + (group.length > 2 ? ' triple' : '');
                group.forEach(opt => {
                    const b = document.createElement('button');
                    b.textContent = opt.label;
                    b.className = opt.id === sk.id ? 'on' : '';
                    b.onclick = () => shopSetVariant(baseSk.id, opt.id);
                    sw.appendChild(b);
                });
                card.appendChild(sw);
            }

            const btn = document.createElement('button');
            btn.className = 'btn shop-btn';
            if (eq === sk.id) {
                btn.textContent = 'נבחר ✓';
                btn.disabled = true;
            } else if (owned.has(sk.id)) {
                btn.textContent = 'בחר';
                btn.onclick = () => equipSkin(sk.id);
            } else {
                const price = skinPriceNow(sk);
                btn.textContent = 'קנה 🪙 ' + price;
                if (price < skinPrice(sk)) {
                    const was = document.createElement('s'); was.textContent = skinPrice(sk); was.className = 'shop-was';
                    btn.appendChild(was);
                }
                if (coins < price) btn.classList.add('cant');
                btn.onclick = () => buySkin(sk.id);
            }
            if (skinOnDeal(sk) && !owned.has(sk.id)) {
                const badge = document.createElement('div');
                badge.className = 'shop-deal-badge';
                badge.textContent = '🔥 -' + Math.round(DEAL_OFF * 100) + '%';
                card.appendChild(badge);
                card.classList.add('on-deal');
            }
            card.appendChild(btn);
            wrap.appendChild(card);
        });
        grid.appendChild(wrap);
        if (long) {
            const more = document.createElement('button');
            more.className = 'shop-more';
            more.textContent = open ? 'הצג פחות ▲' : 'הצג עוד (' + (g.skins.length - SHOP_PREVIEW) + ') ▼';
            more.onclick = () => {
                if (open) shopExpanded.delete(g.id); else shopExpanded.add(g.id);
                renderShop();
                if (open) shopScrollTo(g.id);             // אחרי כיווץ חוזרים לראש הקטגוריה
            };
            grid.appendChild(more);
        }
    });
    document.getElementById('screen-shop').scrollTop = prevScroll;
}


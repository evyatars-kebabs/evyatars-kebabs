/* ---------- רמות, XP, תארים ומסגרות ----------
   XP מכל משחק שמסתיים: 10 על הסיום + עד 40 לפי הביצוע (לפי טווח "ניקוד טוב" של כל משחק) + 15 על שיא אישי
   + 25 על המשחק הראשון של היום. אתגר יומי +40, שלושת האתגרים +60, שבוע ברצף +150.
   מרמה L לרמה הבאה צריך 100 + 25*(L-1) XP, ולכל היותר 1,000 - בלי גבול למספר הרמות.
   כל רמה נותנת 20 + 5*L מטבעות (עד 250), ורמות ציון דרך נותנות עוד 300 ותואר ו/או מסגרת חדשים. */

const XP_KEY = 'kebab_xp';           // { xp, lvl (הרמה האחרונה שנחגגה), title, frame, day, seeded, pending } - נשמר גם בחשבון
const XP_TITLES = [[1, 'מתחיל במטבח'], [5, 'שוליית מטבח'], [10, 'שף צעיר'], [15, 'אמן הגריל'], [20, 'מלך השיפודים'],
                   [30, 'שף ראשי'], [40, 'אגדת הקבב'], [50, 'קבב-סאן'], [75, 'אלוף הקבביה'], [100, 'קבב מאסטר']];
const XP_FRAMES = [[5, 'wood', 'עץ'], [10, 'bronze', 'ארד'], [20, 'silver', 'כסף'], [30, 'gold', 'זהב'],
                   [40, 'emerald', 'אזמרגד'], [50, 'diamond', 'יהלום'], [75, 'fire', 'אש'], [100, 'cosmic', 'קוסמי']];
const XP_GAME_BEST = { delivery: 'kebab_dlvHighScore', catch: 'kebab_highScore', goods: 'kebab_goodsHighScore', shvartz: 'kebab_shvartzHighScore',
                       ninja: 'kebab_ninjaHighScore', kvk: 'kebab_kvkHighScore', trivia: 'kebab_triviaHighScore', turtles: 'kebab_turtlesHighScore' };
const XP_SEED_MAX = 1225;            // שחקנים ותיקים מתחילים לכל היותר ברמה 8 (לפי השיאים שלהם)

const xpNeed = L => Math.min(100 + 25 * (L - 1), 1000);
function xpLevelOf(xp) {
    let L = 1, left = Math.max(0, Math.floor(xp));
    while (left >= xpNeed(L)) { left -= xpNeed(L); L++; }
    return { lvl: L, into: left, need: xpNeed(L) };
}
// כל התארים שנפתחו עד רמה מסוימת (אחרי 100: "קבב מאסטר ★2" ברמה 125, ★3 ב-150...)
function xpTitles(lvl) {
    const list = XP_TITLES.map(([l, t]) => ({ lvl: l, name: t }));
    for (let l = 125, n = 2; l <= Math.max(lvl, 125); l += 25, n++) list.push({ lvl: l, name: 'קבב מאסטר ★' + n });
    return list;
}
// "אדון הקבביה" ומסגרת המאסטר - פרס על מאסטר בכל המשחקים (js/mastery.js)
const xpTitleOk = t => typeof t === 'string' && (XP_TITLES.some(x => x[1] === t) || /^קבב מאסטר ★\d{1,4}$/.test(t) || t === 'אדון הקבביה');
const xpFrameOk = f => XP_FRAMES.some(x => x[1] === f) || f === 'master';
const xpMilestone = L => XP_TITLES.some(x => x[0] === L) || XP_FRAMES.some(x => x[0] === L) || (L > 100 && (L - 100) % 25 === 0);
const xpCoinsFor = L => Math.min(20 + 5 * L, 250) + (xpMilestone(L) ? 300 : 0);

function xpState() {
    let st = null;
    try { st = JSON.parse(store.get(XP_KEY) || 'null'); } catch (e) { st = null; }
    st = st && typeof st === 'object' ? st : {};
    st.xp = Math.max(0, Math.floor(Number(st.xp) || 0));
    st.lvl = Math.max(1, parseInt(st.lvl) || 1);
    st.pending = Array.isArray(st.pending) ? st.pending.filter(n => Number.isInteger(n) && n > 1) : [];
    if (!xpTitleOk(st.title)) st.title = XP_TITLES[0][1];
    if (st.frame && !xpFrameOk(st.frame)) st.frame = '';
    return st;
}
function xpSave(st) {
    store.set(XP_KEY, JSON.stringify({ xp: st.xp, lvl: st.lvl, title: st.title, frame: st.frame || '', day: st.day || '', seeded: !!st.seeded, pending: st.pending }));
}
function xpLevel() { return xpLevelOf(xpState().xp).lvl; }
// לתצוגה בטבלאות השיאים
function xpPublic() { const st = xpState(); return { lvl: xpLevelOf(st.xp).lvl, title: st.title, frame: st.frame || '' }; }

/* ---------- הוספת XP ---------- */
// מחזיר { before, after, gained, levels: [רמות חדשות] }. רמות חדשות נשמרות ב-pending עד שאוספים את הפרס
function xpAdd(amount) {
    const st = xpState();
    const before = st.xp;
    st.xp += Math.max(0, Math.floor(amount));
    const lb = xpLevelOf(before).lvl, la = xpLevelOf(st.xp).lvl;
    const levels = [];
    for (let L = Math.max(lb, st.lvl) + 1; L <= la; L++) { levels.push(L); st.pending.push(L); }
    if (la > st.lvl) st.lvl = la;
    xpSave(st);
    if (levels.length && typeof syncLeaderboardSkin === 'function') syncLeaderboardSkin(2000);     // הרמה החדשה מופיעה בטבלאות
    return { before, after: st.xp, gained: st.xp - before, levels };
}

// XP למשחק שהסתיים + פירוט
function xpForGame(gameKey, score) {
    if (!(score > 0)) return { total: 0, parts: [] };
    const parts = [['סיום משחק', 10]];
    let perf = 0;
    if (gameKey === 'trivia') perf = Math.min(1, score / 100);
    else if (typeof GAME_REWARD !== 'undefined' && GAME_REWARD[gameKey]) {
        const g = GAME_REWARD[gameKey];
        perf = Math.max(0, Math.min(1, (score - g.min) / (g.great - g.min)));
    }
    const p = Math.round(40 * perf);
    if (p > 0) parts.push(['ביצוע', p]);
    const nb = window.__newBest;
    if (nb && nb.key === XP_GAME_BEST[gameKey] && Date.now() - nb.t < 5000) parts.push(['שיא אישי חדש!', 15]);
    const st = xpState(), today = typeof dailyDate === 'function' ? dailyDate() : new Date().toDateString();
    if (st.day !== today) { parts.push(['משחק ראשון היום', 25]); st.day = today; xpSave(st); }
    return { total: parts.reduce((s, x) => s + x[1], 0), parts };
}

// נקרא מ-showResultReward: מוסיף XP ומציג את הפאנל המונפש במסך התוצאה
function xpOnGame(gameKey, score) {
    const g = xpForGame(gameKey, score);
    const box = document.getElementById('xp-result');
    if (!g.total) { if (box) box.style.display = 'none'; return; }
    const res = xpAdd(g.total);
    xpShowResult(res, g.parts);
}
// XP מחוץ למשחק (אתגרים יומיים): "+40 XP" עף מהכפתור, ואם עלו רמה - חגיגה
function xpBonus(amount, fromEl, label) {
    const res = xpAdd(amount);
    if (fromEl) xpFloat(fromEl, '+' + amount + ' XP');
    renderXpCard();
    if (res.levels.length) setTimeout(xpCelebrate, 900);
}

/* ---------- תצוגה ---------- */
function xpFrameClass(f) { return f && xpFrameOk(f) ? ' fr-' + f : ''; }
function xpEl(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
// שורת טקסט עם מספרי XP: המספרים נשמרים משמאל לימין בתוך הטקסט העברי
function xpLine(cls, parts) {
    const e = xpEl('div', cls);
    parts.forEach((t, i) => { if (i % 2) { const b = xpEl('bdi', '', t); b.dir = 'ltr'; e.appendChild(b); } else e.appendChild(document.createTextNode(t)); });
    return e;
}

// "+40 XP" שעף למעלה מנקודה על המסך
function xpFloat(fromEl, text) {
    const r = fromEl.getBoundingClientRect();
    const f = xpEl('div', 'xp-float', text);
    f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top) + 'px';
    document.body.appendChild(f);
    f.animate([{ transform: 'translate(-50%, 0) scale(0.6)', opacity: 0 }, { transform: 'translate(-50%, -20px) scale(1.15)', opacity: 1, offset: 0.25 },
               { transform: 'translate(-50%, -70px) scale(1)', opacity: 0 }], { duration: 1300, easing: 'ease-out' }).onfinish = () => f.remove();
}

// פאנל ה-XP במסך התוצאה: פירוט שמופיע שורה אחרי שורה, מונה שעולה ופס שמתמלא (וחוצה רמות)
let xpResultTimer = [];
function xpShowResult(res, parts) {
    let box = document.getElementById('xp-result');
    const desc = document.getElementById('result-desc');
    if (!box && desc) { box = xpEl('div', 'xp-result'); box.id = 'xp-result'; desc.after(box); }
    if (!box) return;
    xpResultTimer.forEach(clearTimeout); xpResultTimer = [];
    box.style.display = '';
    box.innerHTML = '';
    const head = xpEl('div', 'xp-res-head');
    const total = xpEl('div', 'xp-res-total', '+0 XP');
    head.appendChild(total);
    const lvlTag = xpEl('div', 'xp-res-lvl');
    head.appendChild(lvlTag);
    box.appendChild(head);
    const chips = xpEl('div', 'xp-res-parts');
    box.appendChild(chips);
    const bar = xpEl('div', 'xp-bar big'); const fill = xpEl('i'); bar.appendChild(fill);
    const barTxt = xpEl('div', 'xp-bar-txt'); barTxt.dir = 'ltr';
    box.appendChild(bar); box.appendChild(barTxt);

    const show = xp => {
        const l = xpLevelOf(xp);
        lvlTag.textContent = 'רמה ' + l.lvl;
        fill.style.width = (l.into / l.need * 100) + '%';
        barTxt.textContent = l.into + ' / ' + l.need + ' XP';
        return l;
    };
    fill.style.transition = 'none'; show(res.before); void fill.offsetWidth; fill.style.transition = '';
    // שורות הפירוט נכנסות אחת אחרי השנייה
    parts.forEach(([label, v], i) => xpResultTimer.push(setTimeout(() => {
        const c = xpEl('span', 'xp-chip' + (v >= 15 && i > 0 ? ' hot' : ''), label + ' +' + v);
        chips.appendChild(c);
        sfx.tick();
    }, 250 + i * 220)));
    // המונה והפס: מתמלאים בהדרגה; כשעוברים רמה הפס מתמלא עד הסוף, מהבהב ומתחיל מחדש
    const start = 250 + parts.length * 220, dur = 900 + Math.min(1200, res.levels.length * 500);
    xpResultTimer.push(setTimeout(() => {
        const t0 = performance.now();
        let lastLvl = xpLevelOf(res.before).lvl;
        const step = now => {
            const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
            const xp = Math.round(res.before + (res.after - res.before) * e);
            total.textContent = '+' + (xp - res.before) + ' XP';
            fill.style.transition = 'none';
            const l = show(xp);
            if (l.lvl > lastLvl) {                                 // עברנו רמה באמצע
                lastLvl = l.lvl;
                lvlTag.classList.remove('pop'); void lvlTag.offsetWidth; lvlTag.classList.add('pop');
                bar.classList.remove('flash'); void bar.offsetWidth; bar.classList.add('flash');
                sfx.good();
            }
            if (p < 1) requestAnimationFrame(step);
            else {
                total.classList.add('done');
                if (res.levels.length) xpResultTimer.push(setTimeout(xpCelebrate, 600));
            }
        };
        requestAnimationFrame(step);
    }, start));
}

// כרטיס הרמה במסך הבית: הסקין במסגרת, הרמה, התואר ופס ההתקדמות. לחיצה - לפרופיל (בחירת תואר ומסגרת)
function renderXpCard() {
    const home = document.getElementById('screen-home');
    if (!home) return;
    let card = document.getElementById('xp-card');
    if (!card) { card = xpEl('div', 'xp-card'); card.id = 'xp-card'; card.onclick = () => switchTab('profile'); }
    if (home.firstElementChild !== card) home.insertBefore(card, home.firstElementChild);
    const st = xpState(), l = xpLevelOf(st.xp);
    card.innerHTML = '';
    const av = xpAvatar(typeof currentSkinId === 'function' ? currentSkinId() : 'classic', st.frame, l.lvl, 46);
    card.appendChild(av);
    const mid = xpEl('div', 'xp-card-mid');
    const top = xpEl('div', 'xp-card-top');
    top.appendChild(xpEl('b', '', 'רמה ' + l.lvl));
    top.appendChild(xpEl('span', 'xp-card-title', st.title));
    mid.appendChild(top);
    const bar = xpEl('div', 'xp-bar'); const fill = xpEl('i'); fill.style.width = (l.into / l.need * 100) + '%'; bar.appendChild(fill);
    mid.appendChild(bar);
    mid.appendChild(xpLine('xp-card-sub', ['', l.into + ' / ' + l.need + ' XP', ' · עוד ' + (l.need - l.into) + ' לרמה ' + (l.lvl + 1)]));
    card.appendChild(mid);
    if (st.pending.length) {
        const gift = xpEl('button', 'xp-card-gift', '🎁');
        gift.onclick = e => { e.stopPropagation(); xpCelebrate(); };
        card.appendChild(gift);
    }
}
// תמונת הסקין במסגרת, עם תג הרמה בפינה
function xpAvatar(skinId, frame, lvl, size) {
    const w = xpEl('div', 'xp-av' + xpFrameClass(frame));
    w.style.width = w.style.height = size + 'px';
    const src = typeof lbAvatar === 'function' ? lbAvatar(skinId) : null;
    if (src) { const img = document.createElement('img'); img.src = src; img.alt = ''; w.appendChild(img); }
    if (lvl) w.appendChild(xpEl('span', 'xp-av-lvl', String(lvl)));
    return w;
}

/* ---------- חגיגת עלייה ברמה ---------- */
function xpCelebrate() {
    const st = xpState();
    if (!st.pending.length || document.getElementById('xp-levelup')) return;
    const levels = st.pending.slice().sort((a, b) => a - b);
    const from = levels[0] - 1, to = levels[levels.length - 1];
    const coins = levels.reduce((s, L) => s + xpCoinsFor(L), 0);
    const titles = XP_TITLES.filter(([l]) => levels.includes(l)).map(x => x[1])
        .concat(levels.filter(L => L > 100 && (L - 100) % 25 === 0).map(L => 'קבב מאסטר ★' + ((L - 100) / 25 + 1)));
    const frames = XP_FRAMES.filter(([l]) => levels.includes(l));

    const ov = xpEl('div', 'xp-levelup'); ov.id = 'xp-levelup';
    const card = xpEl('div', 'xp-lu-card');
    card.appendChild(xpEl('div', 'xp-lu-rays'));
    card.appendChild(xpEl('div', 'xp-lu-label', 'עליתם רמה!'));
    const num = xpEl('div', 'xp-lu-num', String(from));
    card.appendChild(num);
    card.appendChild(xpEl('div', 'xp-lu-title', titles.length ? titles[titles.length - 1] : st.title));
    const rew = xpEl('div', 'xp-lu-rewards');
    card.appendChild(rew);
    const btn = xpEl('button', 'xp-lu-btn', 'אספו ' + coins.toLocaleString('en-US') + ' 🪙');
    card.appendChild(btn);
    ov.appendChild(card);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('open'));
    sfx.win();
    haptic([60, 40, 60, 40, 160]);
    if (typeof confettiBurst === 'function') confettiBurst(60);

    // המספר עולה רמה אחרי רמה, ואז הפרסים נחשפים אחד אחד
    let n = from;
    const tick = () => {
        n++;
        num.textContent = String(n);
        num.classList.remove('pop'); void num.offsetWidth; num.classList.add('pop');
        sfx.tick();
        if (n < to) setTimeout(tick, Math.max(90, 420 - (to - from) * 25));
        else setTimeout(reveal, 450);
    };
    setTimeout(tick, 500);
    const items = [{ icon: '🪙', text: '+' + coins.toLocaleString('en-US') + ' מטבעות' }]
        .concat(titles.map(t => ({ icon: '🏷️', text: 'תואר חדש: ' + t, title: t })))
        .concat(frames.map(([, id, name]) => ({ icon: '', text: 'מסגרת חדשה: ' + name, frame: id })));
    const reveal = () => items.forEach((it, i) => setTimeout(() => {
        const row = xpEl('div', 'xp-lu-item');
        if (it.frame) row.appendChild(xpAvatar(currentSkinId(), it.frame, 0, 30));
        else row.appendChild(xpEl('span', 'xp-lu-ic', it.icon));
        row.appendChild(xpEl('span', '', it.text));
        rew.appendChild(row);
        sfx.coin();
        if (i === items.length - 1) btn.classList.add('ready');
    }, i * 380));

    btn.onclick = () => {
        if (btn.disabled) return;
        btn.disabled = true;
        const s2 = xpState();
        // תואר / מסגרת חדשים נבחרים אוטומטית (אפשר להחליף בפרופיל)
        if (titles.length) s2.title = titles[titles.length - 1];
        if (frames.length) s2.frame = frames[frames.length - 1][1];
        s2.pending = s2.pending.filter(L => !levels.includes(L));
        xpSave(s2);
        sfx.chest();
        if (typeof confettiBurst === 'function') confettiBurst(80);
        flyCoins(btn, coins);
        if (typeof syncLeaderboardSkin === 'function') syncLeaderboardSkin(2000);
        setTimeout(() => { ov.classList.remove('open'); setTimeout(() => { ov.remove(); renderXpCard(); renderXpProfile(); if (xpState().pending.length) xpCelebrate(); }, 300); }, 900);
    };
}

/* ---------- פרופיל: הרמה, בחירת תואר ובחירת מסגרת ---------- */
function renderXpProfile() {
    const scr = document.getElementById('screen-profile');
    if (!scr) return;
    let box = document.getElementById('xp-profile');
    if (!box) {
        box = xpEl('div', 'xp-profile'); box.id = 'xp-profile';
        const acc = document.getElementById('account-box');
        if (acc) acc.after(box); else scr.appendChild(box);
    }
    const st = xpState(), l = xpLevelOf(st.xp);
    box.innerHTML = '';
    const top = xpEl('div', 'xp-prof-top');
    top.appendChild(xpAvatar(currentSkinId(), st.frame, l.lvl, 64));
    const info = xpEl('div', 'xp-prof-info');
    info.appendChild(xpEl('div', 'xp-prof-lvl', 'רמה ' + l.lvl));
    info.appendChild(xpEl('div', 'xp-prof-title', st.title));
    const bar = xpEl('div', 'xp-bar'); const fill = xpEl('i'); fill.style.width = (l.into / l.need * 100) + '%'; bar.appendChild(fill);
    info.appendChild(bar);
    info.appendChild(xpLine('xp-card-sub', ['', l.into + ' / ' + l.need + ' XP', ' · סה"כ ', st.xp.toLocaleString('en-US') + ' XP']));
    top.appendChild(info);
    box.appendChild(top);

    box.appendChild(xpEl('div', 'xp-prof-h', '🏷️ התואר שלכם'));
    const tl = xpEl('div', 'xp-chips');
    xpTitles(l.lvl).forEach(t => {
        const open = t.lvl <= l.lvl;
        const c = xpEl('button', 'xp-pick' + (st.title === t.name ? ' on' : '') + (open ? '' : ' locked'), open ? t.name : '🔒 ' + t.name + ' · רמה ' + t.lvl);
        if (open) c.onclick = () => { const s = xpState(); s.title = t.name; xpSave(s); sfx.tap(); renderXpProfile(); renderXpCard(); if (typeof syncLeaderboardSkin === 'function') syncLeaderboardSkin(1500); };
        tl.appendChild(c);
    });
    if (typeof mstAllMaster === 'function') {                 // התואר של מאסטר בכל המשחקים
        const open = mstAllMaster();
        const c = xpEl('button', 'xp-pick mst-title' + (st.title === MST_TITLE ? ' on' : '') + (open ? '' : ' locked'), open ? MST_TITLE : '🔒 ' + MST_TITLE + ' · מאסטר בכל המשחקים');
        if (open) c.onclick = () => { const s = xpState(); s.title = MST_TITLE; xpSave(s); sfx.tap(); renderXpProfile(); renderXpCard(); if (typeof syncLeaderboardSkin === 'function') syncLeaderboardSkin(1500); };
        tl.appendChild(c);
    }
    box.appendChild(tl);

    box.appendChild(xpEl('div', 'xp-prof-h', '🖼️ מסגרת לתמונה'));
    const fl = xpEl('div', 'xp-frames');
    const frames = [[1, '', 'בלי']].concat(XP_FRAMES);
    if (typeof mstAllMaster === 'function') frames.push([0, MST_FRAME, 'מאסטר']);
    frames.forEach(([lv, id, name]) => {
        const open = id === 'master' ? mstAllMaster() : lv <= l.lvl;
        const c = xpEl('button', 'xp-frame-pick' + ((st.frame || '') === id ? ' on' : '') + (open ? '' : ' locked'));
        c.appendChild(xpAvatar(currentSkinId(), id, 0, 40));
        c.appendChild(xpEl('small', '', open ? name : id === 'master' ? '🔒 מאסטר' : '🔒 רמה ' + lv));
        if (open) c.onclick = () => { const s = xpState(); s.frame = id; xpSave(s); sfx.tap(); renderXpProfile(); renderXpCard(); if (typeof syncLeaderboardSkin === 'function') syncLeaderboardSkin(1500); };
        fl.appendChild(c);
    });
    box.appendChild(fl);
    if (typeof renderMstProfile === 'function') renderMstProfile();
}

/* ---------- התחלה: שחקנים ותיקים מקבלים רמת פתיחה לפי השיאים שלהם (בלי מטבעות על הרמות שדילגו עליהן) ---------- */
function xpSeed() {
    const st = xpState();
    if (st.seeded) return;
    let seed = 0;
    for (const [game, key] of Object.entries(XP_GAME_BEST)) {
        const best = parseInt(store.get(key)) || 0;
        if (!(best > 0)) continue;
        let perf = 0;
        if (game === 'trivia') perf = Math.min(1, best / 100);
        else if (typeof GAME_REWARD !== 'undefined' && GAME_REWARD[game]) perf = Math.max(0, Math.min(1, (best - GAME_REWARD[game].min) / (GAME_REWARD[game].great - GAME_REWARD[game].min)));
        seed += 40 + Math.round(180 * perf);
    }
    seed = Math.min(XP_SEED_MAX, seed);
    st.seeded = true;
    if (seed > st.xp) {
        st.xp = seed;
        const l = xpLevelOf(seed);
        st.lvl = l.lvl;
        // תואר ומסגרת של הרמה שבה מתחילים
        const t = XP_TITLES.filter(([lv]) => lv <= l.lvl).pop(); if (t) st.title = t[1];
        const f = XP_FRAMES.filter(([lv]) => lv <= l.lvl).pop(); if (f) st.frame = f[1];
        xpSave(st);
        if (l.lvl > 1) setTimeout(() => xpWelcome(l.lvl), 1200);
    } else xpSave(st);
}
function xpWelcome(lvl) {
    if (document.getElementById('xp-levelup')) return;
    const ov = xpEl('div', 'xp-levelup'); ov.id = 'xp-levelup';
    const card = xpEl('div', 'xp-lu-card');
    card.appendChild(xpEl('div', 'xp-lu-rays'));
    card.appendChild(xpEl('div', 'xp-lu-label', '✨ חדש: רמות!'));
    card.appendChild(xpEl('div', 'xp-lu-num pop', String(lvl)));
    card.appendChild(xpEl('div', 'xp-lu-title', xpState().title));
    card.appendChild(xpEl('div', 'xp-lu-text', 'לפי השיאים שלכם התחלתם ברמה ' + lvl + '. כל משחק ואתגר יומי נותנים XP, וכל רמה - מטבעות, תארים ומסגרות!'));
    const btn = xpEl('button', 'xp-lu-btn ready', 'יאללה!');
    btn.onclick = () => { ov.classList.remove('open'); setTimeout(() => ov.remove(), 300); };
    card.appendChild(btn);
    ov.appendChild(card);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('open'));
    sfx.win();
    if (typeof confettiBurst === 'function') confettiBurst(50);
}

xpSeed();
renderXpCard();
renderXpProfile();
// פרסים של רמה שלא נאספו (למשל האפליקציה נסגרה באמצע) - מחכים בכפתור 🎁 בכרטיס הרמה

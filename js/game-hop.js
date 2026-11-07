/* ============================================================
   משחק: קבב ג'אמפ  (מבוסס על Monkey Hop מהריפו platformer)
   הדמות קופצת לבד; מחזיקים את צד ימין / שמאל של המסך כדי לזוז, ונוחתים על פלטפורמות כדי לטפס.
   מצב אינסופי: ככל שעולים זה נעשה קשה יותר, והעולם מתחלף כל 400 מטר (קבביה, כספת, לילה בעיר).
   מטבעות נדירים (כ-3 לכל 1000 מטר) ונכנסים ליתרת הקבב קוינס, ובסוף מקבלים גם קופון כרגיל.
   ============================================================ */
const HP_W = 360;
let HP_H = 600;              // הגובה הלוגי נקבע לפי המקום על המסך (כדי שלא יישארו פסים ריקים)
const HP_GRAV = 1275, HP_JUMP = 528, HP_SPRING_V = 990, HP_MOVE = 250;
const HP_PH = 16;            // עובי פלטפורמה
const HP_SPIKE_H = 11;       // גובה הלהבות מעל גריל לוהט
const HP_SPR_H = 17;         // גובה קפיץ
const HP_HIT_W = 10, HP_HIT_H = 40;
const HP_PX_M = 7.5;         // פיקסלים למטר
const HP_START_Y = 0;
const HP_THEME_M = 400;      // כל כמה מטרים מתחלף העולם
// מטבעות כמו במשחק המקורי (שליש מהפלטפורמות, לפעמים שלישייה, ושרשרת מעל קפיצים), ובסוף הם מומרים לקבב קוינס:
// HP_KC_RATE מטבעות = קבב קוינס אחד, כך שבממוצע יוצאים כ-3 KC לכל 1000 מטר
const HP_KC_RATE = 20;          // נמדד: כ-92 מטבעות נוצרים ונאספים כ-63 לכל 1000 מטר => כ-3 KC
const HP_TUT_KEY = 'kebab_hop_tut';

const HP_THEMES = [
    { id: 'kitchen', name: '🔥 הקבביה' },
    { id: 'cash',    name: '💰 הכספת' },
    { id: 'night',   name: '🌙 לילה בעיר' },
    { id: 'desert',  name: '🐪 מדבר הפלאפל' },
    { id: 'tahini',  name: '🥣 שמי הטחינה' },
    { id: 'space',   name: '🚀 קבב בחלל' }
];

let hp = null, hpRaf = 0, hpCtx = null, hpPx = 1;
const hpRand = (a, b) => a + Math.random() * (b - a);
const hpClamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hpLerp = (a, b, t) => a + (b - a) * t;
const hpThemeAt = m => Math.floor(Math.max(0, m) / HP_THEME_M) % HP_THEMES.length;

function hpNewState() {
    return {
        running: false, paused: false, dead: false, deadT: 0, deadKind: '', t: 0, last: 0,
        camY: HP_START_Y - HP_H * 0.82, maxM: 0, coins: 0,
        P: { x: HP_W / 2, y: HP_START_Y, vx: 0, vy: -HP_JUMP * 0.4, sq: 0, blink: 2, rot: 0, spin: 0 },
        plats: [], coinList: [], parts: [], debris: [], floaters: [], zones: [],
        topY: HP_START_Y, lastX: HP_W / 2 - 40, theme: 0, banner: null, hint: 3.5,
        tut: store.get(HP_TUT_KEY) ? -1 : 0,          // שלב בהדרכה (-1 = אין הדרכה)
        skin: typeof getEquippedSkinId === 'function' ? getEquippedSkinId() : 'classic',
        cos: typeof mstCos === 'function' ? mstCos('hop') : 0,          // שובל מדרגת השליטה: 3 זהב, 4 קרח, 5 קשת
        ptrs: new Map(), keys: {}, shake: 0, flash: 0, bg: [0, 0, 0]
    };
}

function hpStop() {
    cancelAnimationFrame(hpRaf);
    if (hp) { hp.running = false; hp.ptrs.clear(); }
}

function startHopGame() {
    switchTab('hop');                    // עוצר כל משחק אחר ומסתיר את סרגל הניווט
    hp = hpNewState();
    hpResize();
    hp.plats.push(hpMkPlat('normal', HP_W / 2 - 75, HP_START_Y, 150, 0));
    hpGenRows();
    hpHud();
    hp.running = true;
    hp.last = performance.now();
    hpRaf = requestAnimationFrame(hpLoop);
}

function hpResize() {
    const wrap = document.getElementById('hop-wrap');
    const cv = document.getElementById('hop-canvas');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    HP_H = Math.round(hpClamp(HP_W * h / w, 520, 820));
    const scale = Math.min(w / HP_W, h / HP_H);
    const cssW = Math.floor(HP_W * scale), cssH = Math.floor(HP_H * scale);
    cv.style.width = cssW + 'px'; cv.style.height = cssH + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    hpPx = cv.width / HP_W;
    hpCtx = cv.getContext('2d');
    hpCtx.setTransform(hpPx, 0, 0, hpPx, 0, 0);
}
window.addEventListener('resize', () => { if (hp && hp.running) hpResize(); });

/* ---------- יצירת העולם ---------- */
let hpPlatId = 0;
function hpMkPlat(type, x, y, w, theme) {
    return { id: hpPlatId++, type, x, y, w, theme, state: 'ok', crackT: 0, dip: 0, dipV: 0, seed: Math.random() * 1000,
             spring: null, dir: 1, minX: x, maxX: x, spd: 0, shake: 0 };
}
const hpHeightM = y => (HP_START_Y - y) / HP_PX_M;
const hpDiff = m => hpClamp(m / 2500, 0, 1);
function hpExtents(p) { return p.type === 'moving' ? [p.minX, p.maxX + p.w] : [p.x, p.x + p.w]; }
function hpSpotFree(x0, x1, y, vr) {
    for (const p of hp.plats) {
        if (Math.abs(p.y - y) < vr) { const [a, b] = hpExtents(p); if (x0 < b + 14 && x1 > a - 14) return false; }
    }
    return true;
}
function hpInZone(x0, x1, y) { return hp.zones.some(z => x0 < z.x1 && x1 > z.x0 && y > z.y0 && y < z.y1); }
function hpMakeMoving(p, d) {
    p.type = 'moving';
    const range = hpRand(52, 90) * (0.8 + d * 0.5);
    p.minX = hpClamp(p.x - range / 2, 3, HP_W - p.w - 3 - range);
    p.maxX = p.minX + range;
    p.x = hpLerp(p.minX, p.maxX, Math.random());
    p.spd = hpRand(42, 68) + d * 42;
    p.dir = Math.random() < 0.5 ? -1 : 1;
}
function hpAddSpring(p) {
    p.spring = { off: hpRand(17, p.w - 17), k: 1, kv: 0 };
    const sx = p.x + p.spring.off;
    if (p.type === 'normal') hp.zones.push({ x0: sx - 38, x1: sx + 38, y0: p.y - 400, y1: p.y });     // בלי גריל בנתיב ההמראה
}
function hpCoin(x, y) { hp.coinList.push({ x, y, ph: Math.random() * 6, got: false, t: 0 }); }
function hpAddCoins(p) {
    const cx = p.x + p.w / 2;
    if (p.spring && p.type === 'normal' && Math.random() < 0.75) {            // שרשרת מטבעות בנתיב של הקפיץ
        const sx = p.x + p.spring.off;
        for (let i = 0; i < 5; i++) hpCoin(sx, p.y - 98 - i * 46);
        return;
    }
    if (Math.random() < 0.34) {
        if (Math.random() < 0.25) for (let i = -1; i <= 1; i++) hpCoin(cx + i * 28, p.y - 46 - (i === 0 ? 10 : 0));
        else hpCoin(cx, p.y - 45);
    }
}
const hpKC = coins => Math.floor(coins / HP_KC_RATE);
function hpGenRows() {
    while (hp.topY > hp.camY - 260) {
        const m = hpHeightM(hp.topY), d = hpDiff(m), theme = hpThemeAt(m);
        const gap = hpClamp(hpLerp(50, 86, d) + hpRand(-5, 6), 45, 90);
        hp.topY -= gap;
        // הפלטפורמה של השורה שתמיד אפשר להגיע אליה
        const w = hpLerp(78, 56, d), reach = 142 - 37 * d;
        const x = hpClamp(hp.lastX + hpRand(-reach, reach), 5, HP_W - w - 5);
        const main = hpMkPlat('normal', x, hp.topY, w, theme);
        if (m > 60 && Math.random() < 0.12 + 0.3 * d) hpMakeMoving(main, d);
        hp.lastX = main.type === 'moving' ? main.x : main.x;
        if (m > 25 && Math.random() < 0.08) hpAddSpring(main);
        hp.plats.push(main);
        hpAddCoins(main);
        // פלטפורמות נוספות מסוגים אחרים
        const extras = Math.random() < 0.4 + 0.3 * d ? (Math.random() < 0.25 ? 2 : 1) : 0;
        for (let k = 0; k < extras; k++) {
            const ew = hpLerp(72, 54, d), roll = Math.random();
            const spikeP = m > 150 ? 0.07 + 0.17 * d : 0;
            let type = 'normal';
            if (roll < spikeP) type = 'spike';
            else if (roll < spikeP + 0.36) type = m > 40 ? 'breakable' : 'normal';
            else if (roll < spikeP + 0.52 && m > 60) type = 'moving';
            for (let tries = 0; tries < 7; tries++) {
                const ey = hp.topY + hpRand(-gap * 0.45, gap * 0.45), ex = hpRand(5, HP_W - ew - 5);
                const p = hpMkPlat(type, ex, ey, ew, hpThemeAt(hpHeightM(ey)));
                if (type === 'moving') hpMakeMoving(p, d);
                const [a, b] = hpExtents(p);
                if (!hpSpotFree(a, b, ey, type === 'spike' ? 112 : 42)) continue;
                if (type === 'spike' && hpInZone(a, b, ey)) continue;
                if (type === 'normal' && m > 25 && Math.random() < 0.06) hpAddSpring(p);
                hp.plats.push(p);
                if (type !== 'spike') hpAddCoins(p);
                break;
            }
        }
    }
}

/* ---------- שליטה ---------- */
function hpAxis() {
    let a = 0;
    if (hp.keys.ArrowLeft || hp.keys.KeyA) a -= 1;
    if (hp.keys.ArrowRight || hp.keys.KeyD) a += 1;
    for (const v of hp.ptrs.values()) a += v;
    return hpClamp(a, -1, 1);
}
(function hpInput() {
    const cv = document.getElementById('hop-canvas');
    if (!cv) return;
    const dir = e => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) < r.width / 2 ? -1 : 1; };
    cv.addEventListener('pointerdown', e => {
        if (!hp || !hp.running) return;
        e.preventDefault();
        sfx.unlock();
        if (hp.tut >= 0) { hpTutNext(); return; }
        if (hp.paused) { hp.paused = false; hp.last = performance.now(); return; }
        hp.ptrs.set(e.pointerId, dir(e));
        try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    });
    cv.addEventListener('pointermove', e => { if (hp && hp.ptrs.has(e.pointerId)) hp.ptrs.set(e.pointerId, dir(e)); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => cv.addEventListener(n, e => { if (hp) hp.ptrs.delete(e.pointerId); }));
    const onHop = () => hp && hp.running && document.getElementById('screen-hop').classList.contains('active');
    window.addEventListener('keydown', e => {
        if (!onHop()) return;
        if (['ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
        if ((e.code === 'Space' || e.code === 'Enter') && hp.tut >= 0) { hpTutNext(); return; }
        if (e.code === 'Space' && hp.paused) { hp.paused = false; hp.last = performance.now(); return; }
        hp.keys[e.code] = true;
    });
    window.addEventListener('keyup', e => { if (hp) hp.keys[e.code] = false; });
    document.addEventListener('visibilitychange', () => { if (document.hidden && hp && hp.running && !hp.dead && hp.tut < 0) { hp.paused = true; hp.ptrs.clear(); } });
})();

/* ---------- הדרכה (פעם ראשונה) ---------- */
const HP_TUT = [
    { ic: '👆', lines: ['החזיקו את צד ימין או שמאל של המסך', 'כדי לזוז לכיוון הזה'] },
    { ic: '🦘', lines: ['הדמות קופצת לבד!', 'נחתו על הפלטפורמות וטפסו הכי גבוה שאפשר'] },
    { ic: '🔥', lines: ['גריל לוהט שורף מלמעלה, פיתות נשברות,', 'קפיץ מעיף גבוה, ו-🪙 נכנסים ליתרה'] }
];
function hpTutNext() {
    sfx.tap();
    hp.tut++;
    if (hp.tut >= HP_TUT.length) { hp.tut = -1; store.set(HP_TUT_KEY, '1'); hp.last = performance.now(); }
}

/* ---------- עדכון ---------- */
function hpLoop(ts) {
    if (!hp || !hp.running) return;
    const dt = Math.min(0.033, (ts - hp.last) / 1000);
    hp.last = ts;
    if (hp.tut < 0 && !hp.paused) hpStep(dt);
    else hp.t += dt * 0.3;
    hpDraw();
    hpRaf = requestAnimationFrame(hpLoop);
}
function hpBurst(n, x, y, o) {
    for (let i = 0; i < n; i++) {
        const a = o.a0 !== undefined ? hpRand(o.a0, o.a1) : hpRand(0, Math.PI * 2), s = hpRand(o.s0, o.s1);
        const life = hpRand(o.l0, o.l1);
        hp.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: o.g === undefined ? 450 : o.g, life, max: life,
                        size: hpRand(o.z0, o.z1), col: Array.isArray(o.col) ? o.col[(Math.random() * o.col.length) | 0] : o.col,
                        type: o.type || 'c', rot: hpRand(0, 6.28), vr: hpRand(-8, 8) });
    }
    if (hp.parts.length > 500) hp.parts.splice(0, hp.parts.length - 500);
}
function hpFloat(x, y, text, col) { hp.floaters.push({ x, y, text, col: col || '#fff', life: 0.9, max: 0.9 }); }

function hpStep(dt) {
    const P = hp.P;
    hp.t += dt;
    hp.hint = Math.max(0, hp.hint - dt);
    if (hp.banner) { hp.banner.t += dt; if (hp.banner.t > 2.2) hp.banner = null; }
    if (hp.dead) {
        hp.deadT += dt;
        if (hp.deadT > (hp.deadKind === 'burn' ? 1.1 : 0.45)) { hpEnd(); return; }
    }
    // פלטפורמות
    for (const p of hp.plats) {
        if (p.type === 'moving') {
            p.x += p.dir * p.spd * dt;
            if (p.x < p.minX) { p.x = p.minX; p.dir = 1; }
            if (p.x > p.maxX) { p.x = p.maxX; p.dir = -1; }
        }
        p.dipV += (-700 * p.dip - 16 * p.dipV) * dt; p.dip += p.dipV * dt;
        if (p.spring) { const s = p.spring; s.kv += (-(s.k - 1) * 450 - s.kv * 8) * dt; s.k += s.kv * dt; }
        if (p.state === 'crack') {
            p.crackT -= dt; p.shake = hpRand(-2, 2);
            if (p.crackT <= 0) hpBreak(p);
        }
    }
    hp.plats = hp.plats.filter(p => p.state !== 'broken');
    // הדמות
    const ax = hp.dead ? 0 : hpAxis();
    P.vx += hpClamp(ax * HP_MOVE - P.vx, -2400 * dt, 2400 * dt);
    P.vy += HP_GRAV * dt;
    const prevY = P.y;
    P.y += P.vy * dt; P.x += P.vx * dt;
    if (!hp.dead) {
        if (P.x < -HP_HIT_W) P.x = HP_W + HP_HIT_W;
        if (P.x > HP_W + HP_HIT_W) P.x = -HP_HIT_W;
        hpCollide(prevY);
    } else P.rot += P.spin * dt;
    P.sq = Math.max(0, P.sq - dt * 4.5);
    P.blink -= dt; if (P.blink < -0.12) P.blink = hpRand(1.5, 4);
    // מטבעות
    if (!hp.dead) for (const c of hp.coinList) {
        if (c.got) continue;
        // כל גובה הדמות אוסף (גם השוורץ הקלאסי, שיושב גבוה על מוט השיפוד)
        const dx = c.x - P.x, dy = c.y - hpClamp(c.y, P.y - 64, P.y - 6);
        if (dx * dx + dy * dy < 24 * 24) {
            c.got = true; hp.coins++;
            sfx.coin(); haptic(30);
            hpBurst(10, c.x, c.y, { s0: 50, s1: 200, l0: .3, l1: .7, z0: 2, z1: 5, col: ['#fff7a8', '#ffd54a', '#fff'], type: 'star', g: 80 });
            hpFloat(c.x, c.y - 14, '+1', '#ffe066');
            hpHud();
        }
    }
    for (const c of hp.coinList) if (c.got) c.t += dt;
    // מצלמה, גובה ועולם
    if (!hp.dead) {
        const want = P.y - HP_H * 0.42;
        if (want < hp.camY) hp.camY = hpLerp(hp.camY, want, Math.min(1, dt * 14));
        const m = Math.max(0, Math.floor(hpHeightM(P.y)));
        if (m > hp.maxM) { hp.maxM = m; hpHud(); }
        const th = hpThemeAt(hp.maxM);
        if (th !== hp.theme) { hp.theme = th; hp.banner = { t: 0, text: HP_THEMES[th].name, sub: hp.maxM + ' מטר!' }; sfx.good(); }
        if (P.y - hp.camY > HP_H + 45) hpDie('fall');
    }
    // שובל מדרגת השליטה
    if (!hp.dead && hp.cos && P.vy < 0 && Math.random() < 0.7) {
        const col = hp.cos === 3 ? MST_GOLD : hp.cos === 4 ? MST_SPARK : ['hsl(' + Math.round((hp.t * 300) % 360) + ',100%,62%)'];
        hpBurst(1, P.x + hpRand(-8, 8), P.y - hpRand(6, 40), { s0: 10, s1: 50, l0: .35, l1: .7, z0: 2.5, z1: 5, col, type: 'star', g: 60 });
    }
    // שובל מקפיץ
    if (!hp.dead && P.vy < -700) hpBurst(2, P.x + hpRand(-6, 6), P.y - 8, { a0: Math.PI * .4, a1: Math.PI * .6, s0: 110, s1: 220, l0: .2, l1: .35, z0: 2, z1: 3, col: ['#fff', '#ffe066', '#ffb74d'], type: 'line', g: 0 });
    hpGenRows();
    const bottom = hp.camY + HP_H + 110;
    hp.plats = hp.plats.filter(p => p.y < bottom);
    hp.coinList = hp.coinList.filter(c => c.y < bottom && !(c.got && c.t > 0.3));
    hp.zones = hp.zones.filter(z => z.y1 < bottom + 450);
    for (const q of hp.parts) { q.life -= dt; q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt; }
    hp.parts = hp.parts.filter(q => q.life > 0);
    for (const f of hp.floaters) { f.life -= dt; f.y -= 40 * dt; }
    hp.floaters = hp.floaters.filter(f => f.life > 0);
    for (const d of hp.debris) { d.vy += 1100 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.rot += d.vr * dt; }
    hp.debris = hp.debris.filter(d => d.y < hp.camY + HP_H + 150);
    hp.shake *= Math.pow(0.002, dt); if (hp.shake < 0.2) hp.shake = 0;
    hp.flash = Math.max(0, hp.flash - dt * 2.5);
}

function hpCollide(prevY) {
    const P = hp.P;
    for (const p of hp.plats) {
        if (p.type === 'spike') { hpSpikeCollide(p, prevY); if (hp.dead) return; continue; }
        if (p.state !== 'ok') continue;
        if (p.spring && P.vy > 0) {                                  // קפיץ
            const sx = p.x + p.spring.off, top = p.y - HP_SPR_H;
            if (prevY <= top + 1 && P.y >= top && Math.abs(P.x - sx) < 20) {
                P.y = top; P.vy = -HP_SPRING_V; P.sq = 1.2;
                p.spring.k = 0.45; p.spring.kv = 16; p.dip = 0; p.dipV = 170;
                sfx.whoosh(); sfx.good(); haptic(40);
                hpBurst(10, sx, top, { a0: Math.PI * 1.1, a1: Math.PI * 1.9, s0: 80, s1: 200, l0: .3, l1: .6, z0: 2, z1: 5, col: ['#fff', '#ffe066', '#ff8a65'], type: 'star', g: 220 });
                hp.shake = Math.max(hp.shake, 3);
                return;
            }
        }
        if (P.vy > 0 && prevY <= p.y + 1 && P.y >= p.y && P.x + 9 > p.x && P.x - 9 < p.x + p.w) {
            P.y = p.y; P.vy = -HP_JUMP; P.sq = 1;
            p.dip = 0; p.dipV = 130;
            sfx.pop();
            hpBurst(5, P.x, p.y, { a0: Math.PI * 1.05, a1: Math.PI * 1.95, s0: 30, s1: 90, l0: .2, l1: .4, z0: 2, z1: 4, col: ['#f0dcc8', '#c9a574'], g: 60 });
            if (p.type === 'breakable') { p.state = 'crack'; p.crackT = 0.16; sfx.tick(); }
            hpCosLand(P.x, p.y);
            return;
        }
    }
}
function hpSpikeCollide(p, prevY) {
    const P = hp.P;
    const l = p.x, r = p.x + p.w, top = p.y - HP_SPIKE_H, bot = p.y + HP_PH;
    const pl = P.x - HP_HIT_W, pr = P.x + HP_HIT_W, pt = P.y - HP_HIT_H, pb = P.y;
    if (pr <= l || pl >= r || pb <= top || pt >= bot) return;
    if (prevY <= top + 5 && P.vy >= 0) { P.y = top; hpDie('burn'); return; }
    if (prevY - HP_HIT_H >= bot - 5 && P.vy < 0) {             // מכה בראש מלמטה - הגריל חוסם
        P.y = bot + HP_HIT_H; P.vy = 90; p.dip = 0; p.dipV = -90;
        sfx.err(); hp.shake = Math.max(hp.shake, 4);
        hpFloat(P.x, bot + 20, 'בום!', '#ffab91');
        return;
    }
    if (P.x < p.x + p.w / 2) P.x = l - HP_HIT_W; else P.x = r + HP_HIT_W;
    P.vx = 0;
}
function hpBreak(p) {
    p.state = 'broken';
    sfx.slice(1);
    hp.shake = Math.max(hp.shake, 4);
    const hw = p.w / 2;
    hp.debris.push({ x: p.x, y: p.y, w: hw, side: 'L', theme: p.theme, vx: -hpRand(45, 100), vy: -hpRand(130, 240), rot: 0, vr: -hpRand(1.5, 4), seed: p.seed },
                   { x: p.x + hw, y: p.y, w: hw, side: 'R', theme: p.theme, vx: hpRand(45, 100), vy: -hpRand(130, 240), rot: 0, vr: hpRand(1.5, 4), seed: p.seed + 7 });
    hpBurst(10, p.x + p.w / 2, p.y + 5, { a0: Math.PI * 1.1, a1: Math.PI * 1.9, s0: 90, s1: 280, l0: .4, l1: .8, z0: 2, z1: 5, col: HP_CRUMBS[p.theme], type: 'rect', g: 800 });
}
const HP_CRUMBS = [['#e9c98a', '#c99a55', '#f5deb0'], ['#9be3a8', '#4caf6a', '#e8ffe8'], ['#c9a074', '#8a6236', '#e3c9a0'],
                   ['#f0d9a0', '#d9b46a', '#fff1c8'], ['#8fc85a', '#5a9a2a', '#d8f0a0'], ['#cfe8ff', '#8ab8e8', '#ffffff']];

// נחיתה עם מראה מדרגת השליטה: קרח - רסיסי קרח, קשת - פרץ כוכבים צבעוני
function hpCosLand(x, y) {
    if (hp.cos === 4) hpBurst(8, x, y, { a0: Math.PI * 1.05, a1: Math.PI * 1.95, s0: 60, s1: 170, l0: .3, l1: .6, z0: 2, z1: 4, col: MST_SPARK, type: 'rect', g: 500 });
    if (hp.cos === 5) hpBurst(10, x, y - 10, { s0: 60, s1: 200, l0: .35, l1: .7, z0: 2, z1: 5, col: ['#ff5ad1', '#ffd23d', '#5affc8', '#6aa8ff'], type: 'star', g: 120 });
}
function hpDie(kind) {
    if (hp.dead) return;
    const P = hp.P;
    hp.dead = true; hp.deadT = 0; hp.deadKind = kind;
    hp.ptrs.clear();
    if (kind === 'burn') {
        sfx.bomb(); haptic([40, 30, 80]);
        hp.shake = 12; hp.flash = 1;
        P.vy = -400; P.vx = Math.random() < 0.5 ? 120 : -120; P.spin = P.vx > 0 ? 9 : -9;
        hpBurst(16, P.x, P.y - 20, { s0: 90, s1: 320, l0: .3, l1: .7, z0: 2, z1: 5, col: ['#ff5252', '#ffd54a', '#ff8a1a'], type: 'star', g: 380 });
    } else { sfx.low(); P.spin = 0; }
}

function hpEnd() {
    hpStop();
    const m = hp.maxM, coins = hp.coins, kc = hpKC(coins);
    saveBestScore('leaderboard_hop', m, 'kebab_hopHighScore');      // השיא נשמר גם בטבלת השיאים
    if (kc > 0) addCoins(kc);                                        // המטבעות מהמשחק מומרים לקבב קוינס
    document.getElementById('result-desc').textContent =
        (hp.deadKind === 'burn' ? 'אאוץ׳, הגריל לוהט! ' : '') + 'טיפסתם ' + m + ' מטר' +
        (kc ? ' והרווחתם ' + kc + ' 🪙 קבב קוינס!' : '!');
    dailyEvent('hop', { score: m });
    showResultReward('hop', m);
    switchTab('result');
}

function hpHud() {
    const m = document.getElementById('hp-m'), c = document.getElementById('hp-coins');
    if (m) m.textContent = hp.maxM;
    if (c) c.textContent = hp.coins;
}

/* ---------- ציור ---------- */
/* ---------- הדמות: הסקין עם גוף מלא, בפרופורציות של הקוף מהמשחק המקורי ----------
   הראש הוא הראש האמיתי של הסקין (שיער, כובעים, משקפיים...) עם פה קטן, ומתחתיו גוף, ידיים ורגליים
   בצבעים של הסקין. הצבעים נדגמים מציור מלא של הסקין, כך שזה עובד גם לסקינים המיוחדים שמצוירים בדרך משלהם.
   שוורץ הקלאסי (חרוט) - החרוט הוא הגוף, עם ידיים ורגליים. */
const HP_MS = 0.95;                  // גודל הדמות ביחס לקוף המקורי (ראש ברדיוס 15.5, גוף 14.5x16)
const HP_OUT = '#2a160c';
const hpModels = {};
// צבעים קבועים לסקינים שהדגימה לא מתאימה להם
const HP_SKIN_COLORS = {
    dosus:         { body: '#16161c', belly: '#f2f2f2', pants: '#101014' },     // חליפה שחורה וחולצה לבנה
    dosus_cheddar: { body: '#e8952a', belly: '#ffd27a', pants: '#a8601a' }      // גבינה
};
// סקין שהציור שלו הוא דמות שלמה (עם ידיים משלה) - כל הציור הוא הגוף, ומוסיפים רק רגליים
const hpWhole = sk => sk.id === 'shluk' || sk.variantOf === 'shluk';
function hpRenderSkin(c, sk, small, noOutfit) {
    const st = { x: 0, y: 0, hw: small ? 30 : 44, ry: small ? 8 : 12, chew: 0, t: 1.3, tx: 0, ty: 900, surprised: false, mx: 0, my: 0 };
    if (sk.kind === 'cone') { const saved = sv; sv = { mouth: { x: 0, y: 0, hw: small ? 34 : 44, chew: 0 }, ball: null, t: 1.3, aim: null }; svDrawBody(c); svDrawMouthBack(c); svDrawLowerLip(c); sv = saved; return; }
    const keep = skOutfit;                                        // בלי החולצה של המנוע (הגוף שלנו במקומה), כשהזקן יורד על החזה
    if (noOutfit) skOutfit = () => {};
    try { skDrawHumanBack(c, sk, st); skMouthBack(c, sk, st); skDrawHumanFront(c, sk, st); skMouthFront(c, sk, st); }
    finally { skOutfit = keep; }
}
function hpModel(skinId) {
    const key = skinId + '|' + hpPx;
    if (hpModels[key]) return hpModels[key];
    const sk = skinById(skinId), cone = sk.kind === 'cone';
    // צבעים: ציור מלא של הסקין ודגימה של הצוואר (גוון עור) והחולצה
    const full = document.createElement('canvas'); full.width = 320; full.height = 580;
    const fc = full.getContext('2d'); fc.translate(160, 220);
    try { hpRenderSkin(fc, sk, false); } catch (e) { /* ignore */ }
    const px = (x, y, fb) => {
        try {
            const d = fc.getImageData(160 + x, 220 + y, 1, 1).data;
            return d[3] > 120 ? '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('') : fb;
        } catch (e) { return fb; }
    };
    const fix = HP_SKIN_COLORS[sk.id] || {};
    const tone = cone ? '#e8b07a' : (sk.tone || px(0, 72, '#e0a878'));
    const body = fix.body || (cone ? '#c46a2a' : ((sk.outfit && sk.outfit.base) || px(-62, 170, '#3b6fd4')));
    const whole = cone || hpWhole(sk);
    const longBeard = !whole && sk.beard && ['long', 'full', 'braids'].includes(sk.beard.style);
    // איפה נקודת הפה של הציור יושבת על הדמות: ראש אדם במרכז (0,-47), חרוט מ-(-66) עד (-8)
    let k, box, oy;
    if (cone) { k = 58 / 252; box = { x0: -110, x1: 110, y0: -125, y1: 136 }; oy = -8 - 136 * k; }
    else if (whole) {                                             // דמות שלמה: גבולות הציור נמדדים, והיא נמתחת לגובה הדמות
        const d = fc.getImageData(0, 0, full.width, full.height).data;
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        for (let y = 0; y < full.height; y += 2) for (let x = 0; x < full.width; x += 2) {
            if (d[(y * full.width + x) * 4 + 3] > 200) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        }
        box = { x0: x0 - 164, x1: x1 - 156, y0: y0 - 224, y1: y1 - 216 };
        k = 70 / (box.y1 - box.y0); oy = -6 - box.y1 * k;
    } else { k = 15.5 / 91; box = { x0: -180, x1: 180, y0: -240, y1: longBeard ? 300 : 62 }; oy = -47 + 34 * k; }
    const r = k * HP_MS * hpPx;
    const head = document.createElement('canvas');
    head.width = Math.max(1, Math.ceil((box.x1 - box.x0) * r)); head.height = Math.max(1, Math.ceil((box.y1 - box.y0) * r));
    const hc = head.getContext('2d');
    hc.scale(r, r); hc.translate(-box.x0, -box.y0);
    hc.beginPath();
    if (whole) hc.rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
    else {                                                        // ראש: כל הרוחב עד גובה האוזניים, ומשם עד הסנטר רק ברוחב הראש (בלי מה שמאחור)
        hc.rect(box.x0, box.y0, box.x1 - box.x0, 20 - box.y0);
        hc.rect(-108, 20, 216, 42);
    }
    if (longBeard) { hc.moveTo(-62, 62); hc.lineTo(62, 62); hc.lineTo(4, box.y1 - 10); hc.lineTo(-4, box.y1 - 10); hc.closePath(); }   // זקן ארוך: ממשיך על החזה בצורת V (כמו הזקן, בלי הכתפיים ומה שמאחור)
    hc.clip();
    try { hpRenderSkin(hc, sk, true, longBeard); } catch (e) { console.error('hpModel', skinId, e); }
    return (hpModels[key] = { head, box, k, oy, cone, whole, tone, body, pants: fix.pants || skShade(body, -0.45), belly: fix.belly || skShade(body, 0.2) });
}
function hpDrawPlayer(c) {
    const P = hp.P;
    if (hp.dead && P.y - hp.camY > HP_H + 60) return;
    const M = hpModel(hp.skin);
    c.save();
    c.translate(P.x, P.y);
    const stretch = hpClamp(Math.abs(P.vy) / 2000, 0, 0.2), sq = P.sq > 0 ? Math.sin(P.sq * Math.PI * 0.5) : 0;
    let sx = 1 - stretch * 0.5 + sq * 0.22, sy = 1 + stretch - sq * 0.26;
    if (hp.dead) { c.translate(0, -24); c.rotate(P.rot); c.translate(0, 24); sx = sy = 1; }
    else c.rotate(hpClamp(P.vx / HP_MOVE, -1, 1) * 0.1);
    c.scale(sx * HP_MS, sy * HP_MS);
    c.lineJoin = 'round'; c.lineCap = 'round';
    const fo = () => { c.fill(); c.strokeStyle = HP_OUT; c.lineWidth = 2.4; c.stroke(); };
    const rising = hpClamp(-P.vy / 400, -1, 1);                  // 1 = עולה, -1 = נופל
    // רגליים (מקופלות בעלייה)
    const tuck = rising > 0 ? 0.7 : 1;
    c.fillStyle = M.pants;
    c.beginPath(); c.ellipse(-8, -6 * tuck - 1, 7, 6 * tuck + 1, 0, 0, 7); c.ellipse(9, -6 * tuck - 1, 7, 6 * tuck + 1, 0, 0, 7); fo();
    c.fillStyle = '#1c1008';
    c.beginPath(); c.ellipse(-9, -2.5, 6, 3.2, 0, 0, 7); c.ellipse(10, -2.5, 6, 3.2, 0, 0, 7); c.fill();
    // גוף (לחרוט ולדמות שלמה - הציור עצמו הוא הגוף)
    if (!M.whole) {
        c.fillStyle = M.body; c.beginPath(); c.ellipse(0, -23, 14.5, 16, 0, 0, 7); fo();
        c.fillStyle = M.belly; c.beginPath(); c.ellipse(1, -20, 8, 10, 0, 0, 7); c.fill();
    }
    // ידיים - למעלה בקפיצה, לצדדים בנפילה
    const ang = hpLerp(0.2, -0.95, (rising + 1) / 2), sh = M.cone ? 11 : 12;
    if (!M.whole || M.cone) for (const side of [-1, 1]) {              // לדמות שלמה יש ידיים משלה
        c.save(); c.translate(side * sh, -31); c.rotate(side * (Math.PI / 2 - ang) + Math.PI);
        c.strokeStyle = HP_OUT; c.lineWidth = 10.5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 15); c.stroke();
        c.strokeStyle = M.cone ? '#c46a2a' : M.body; c.lineWidth = 6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 15); c.stroke();
        c.fillStyle = M.tone; c.beginPath(); c.arc(0, 16, 4.4, 0, 7); fo();
        c.restore();
    }
    // הראש של הסקין
    const hw = M.head.width / (hpPx * HP_MS), hh = M.head.height / (hpPx * HP_MS);
    c.drawImage(M.head, M.box.x0 * M.k, M.oy + M.box.y0 * M.k, hw, hh);
    c.restore();
}

// רקעים: לכל עולם רקע משלו, ובמעבר ביניהם הם מתמזגים
function hpDrawBg(c) {
    const m = Math.max(0, hpHeightM(hp.camY + HP_H * 0.6));
    const cur = hpThemeAt(m), into = (m % HP_THEME_M) / HP_THEME_M;
    hpBgTheme(c, cur, 1);
    if (into > 0.9) hpBgTheme(c, (cur + 1) % HP_THEMES.length, (into - 0.9) / 0.1);     // מעבר לעולם הבא
}
function hpBgTheme(c, th, a) {
    if (a <= 0) return;
    c.save(); c.globalAlpha = a;
    const t = hp.t, cam = hp.camY;
    if (th === 0) {                                                       // הקבביה: אריחים, מנורות ושוורמה ענקית מסתובבת
        const g = c.createLinearGradient(0, 0, 0, HP_H); g.addColorStop(0, '#5a2a10'); g.addColorStop(1, '#2a1208');
        c.fillStyle = g; c.fillRect(0, 0, HP_W, HP_H);
        const off = ((-cam * 0.3) % 40 + 40) % 40;
        c.strokeStyle = 'rgba(255,200,140,0.06)'; c.lineWidth = 2;
        for (let y = off - 40; y < HP_H; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(HP_W, y); c.stroke(); }
        for (let x = 0; x < HP_W; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, HP_H); c.stroke(); }
        hpShawarma(c, HP_W * 0.74, 250 + ((-cam * 0.08) % 900 + 900) % 900 - 300, t);
        for (const lx of [60, 300]) {                                     // מנורות תלויות
            c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 2; c.beginPath(); c.moveTo(lx, 0); c.lineTo(lx, 50); c.stroke();
            const lg = c.createRadialGradient(lx, 60, 2, lx, 60, 70); lg.addColorStop(0, 'rgba(255,210,120,0.35)'); lg.addColorStop(1, 'rgba(255,210,120,0)');
            c.fillStyle = lg; c.fillRect(lx - 70, -10, 140, 140);
            c.fillStyle = '#3a2214'; c.beginPath(); c.moveTo(lx - 14, 60); c.lineTo(lx + 14, 60); c.lineTo(lx + 7, 48); c.lineTo(lx - 7, 48); c.fill();
            c.fillStyle = '#ffe08a'; c.beginPath(); c.arc(lx, 62, 5, 0, 7); c.fill();
        }
    } else if (th === 1) {                                                // הכספת: מטבע ענק מסתובב ושטרות נופלים
        const g = c.createLinearGradient(0, 0, 0, HP_H); g.addColorStop(0, '#0f4a2c'); g.addColorStop(1, '#06200f');
        c.fillStyle = g; c.fillRect(0, 0, HP_W, HP_H);
        c.fillStyle = 'rgba(160,255,190,0.05)'; c.font = 'bold 30px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        const off = ((-cam * 0.25) % 70 + 70) % 70;
        for (let y = off - 70; y < HP_H + 35; y += 70) for (let x = 35; x < HP_W; x += 70) c.fillText('₪', x + ((y / 70) % 2 ? 35 : 0), y);
        const cy = 230 + ((-cam * 0.06) % 800 + 800) % 800 - 250, s = Math.cos(t * 1.4);
        c.save(); c.translate(HP_W * 0.3, cy); c.scale(Math.max(0.08, Math.abs(s)), 1);
        c.globalAlpha *= 0.35;
        c.fillStyle = '#b8860b'; c.beginPath(); c.arc(0, 0, 70, 0, 7); c.fill();
        c.fillStyle = '#ffd54a'; c.beginPath(); c.arc(0, 0, 60, 0, 7); c.fill();
        c.fillStyle = '#b8860b'; c.font = 'bold 64px Rubik, sans-serif'; c.fillText('₪', 0, 4);
        c.restore();
        for (let i = 0; i < 9; i++) {                                     // שטרות שמתעופפים למטה
            const x = (i * 97 + Math.sin(t * 0.7 + i) * 30 + 400) % HP_W, y = ((t * 30 + i * 83 - cam * 0.15) % (HP_H + 60) + HP_H + 60) % (HP_H + 60) - 30;
            c.save(); c.translate(x, y); c.rotate(Math.sin(t * 1.5 + i) * 0.6); c.globalAlpha *= 0.4;
            c.fillStyle = '#7fd08a'; c.fillRect(-16, -8, 32, 16); c.fillStyle = '#3d8f4d'; c.beginPath(); c.ellipse(0, 0, 6, 5, 0, 0, 7); c.fill();
            c.restore();
        }
    } else if (th === 2) {                                                // לילה בעיר: כוכבים, ירח, קו רקיע ושלט ניאון "קבב"
        const g = c.createLinearGradient(0, 0, 0, HP_H); g.addColorStop(0, '#0a0f2e'); g.addColorStop(1, '#2a1450');
        c.fillStyle = g; c.fillRect(0, 0, HP_W, HP_H);
        for (let i = 0; i < 40; i++) {
            const x = (i * 53) % HP_W, y = ((i * 97 - cam * 0.05) % HP_H + HP_H) % HP_H;
            c.globalAlpha = a * (0.4 + 0.4 * Math.sin(t * 2 + i));
            c.fillStyle = '#fff'; c.fillRect(x, y, 1.6, 1.6);
        }
        c.globalAlpha = a;
        c.fillStyle = '#fff6d0'; c.beginPath(); c.arc(70, 80, 26, 0, 7); c.fill();
        c.fillStyle = '#0a0f2e'; c.beginPath(); c.arc(80, 74, 22, 0, 7); c.fill();
        const sky = ((-cam * 0.12) % 700 + 700) % 700;
        c.fillStyle = '#120a2a';
        for (let i = 0; i < 9; i++) { const bw = 40 + (i * 37) % 30, bh = 90 + (i * 53) % 120; c.fillRect(i * 42 - 10, HP_H - bh + sky * 0.1, bw, bh + 200); }
        const on = Math.sin(t * 3) > -0.7;                                // שלט ניאון מהבהב
        c.save(); c.translate(HP_W * 0.68, 140 + sky * 0.12);
        c.fillStyle = '#1a0c30'; c.fillRect(-58, -26, 116, 52);
        c.font = 'bold 34px "Secular One", Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl';
        c.shadowColor = on ? '#ff3fd1' : 'transparent'; c.shadowBlur = on ? 18 : 0;
        c.fillStyle = on ? '#ff8ae0' : '#5a2a50'; c.fillText('קבב', 0, 2);
        c.restore();
    } else if (th === 3) {                                                // מדבר הפלאפל: שקיעה, דיונות, שמש-פלאפל ודקלים
        const g = c.createLinearGradient(0, 0, 0, HP_H); g.addColorStop(0, '#ff9a4a'); g.addColorStop(0.55, '#ffc878'); g.addColorStop(1, '#e8a050');
        c.fillStyle = g; c.fillRect(0, 0, HP_W, HP_H);
        const sy = 150 + ((-cam * 0.05) % 600 + 600) % 600 - 200;
        c.save(); c.translate(HP_W * 0.3, sy);                            // השמש היא כדור פלאפל ענק
        const sg = c.createRadialGradient(-12, -12, 6, 0, 0, 52); sg.addColorStop(0, '#d9963a'); sg.addColorStop(1, '#7a4214');
        c.globalAlpha = a * 0.75; c.fillStyle = sg; c.beginPath(); c.arc(0, 0, 50, 0, 7); c.fill();
        c.fillStyle = '#4f9a2a'; for (let i = 0; i < 9; i++) { const an = i * 2.3 + 0.4, r = 12 + (i * 7) % 30; c.beginPath(); c.arc(Math.cos(an) * r, Math.sin(an) * r, 3, 0, 7); c.fill(); }
        c.restore(); c.globalAlpha = a;
        const dune = (yb, col, par, amp) => {
            const off = ((-cam * par) % 600 + 600) % 600;
            c.fillStyle = col; c.beginPath(); c.moveTo(0, HP_H);
            for (let x = 0; x <= HP_W; x += 12) c.lineTo(x, yb + off * 0.05 + Math.sin(x / 70 + par * 10) * amp);
            c.lineTo(HP_W, HP_H); c.closePath(); c.fill();
        };
        dune(HP_H * 0.62, 'rgba(214,140,70,0.75)', 0.06, 22); dune(HP_H * 0.75, 'rgba(190,110,50,0.85)', 0.1, 16);
        c.fillStyle = 'rgba(90,45,15,0.55)';                              // דקלים
        for (const [px, ph] of [[60, 120], [290, 150]]) {
            const by = HP_H * 0.7;
            c.fillRect(px - 3, by - ph, 6, ph);
            for (let i = 0; i < 6; i++) { c.save(); c.translate(px, by - ph); c.rotate(-Math.PI / 2 + (i - 2.5) * 0.5); c.beginPath(); c.ellipse(0, -22, 6, 24, 0, 0, 7); c.fill(); c.restore(); }
        }
    } else if (th === 4) {                                                // שמי הטחינה: מערבולות שמנת ובועות
        const g = c.createLinearGradient(0, 0, 0, HP_H); g.addColorStop(0, '#f3e6c8'); g.addColorStop(1, '#d9c49a');
        c.fillStyle = g; c.fillRect(0, 0, HP_W, HP_H);
        const off = ((-cam * 0.2) % 120 + 120) % 120;
        c.strokeStyle = 'rgba(160,120,60,0.16)'; c.lineWidth = 10;
        for (let y = off - 120; y < HP_H + 60; y += 60) { c.beginPath(); for (let x = -20; x <= HP_W + 20; x += 20) c.lineTo(x, y + Math.sin(x / 40 + t * 0.8 + y) * 10); c.stroke(); }
        for (let i = 0; i < 14; i++) {                                    // בועות
            const x = (i * 67 + Math.sin(t + i) * 12) % HP_W, y = ((HP_H - (t * 22 + i * 61) % (HP_H + 40)) - cam * 0.02 % HP_H + HP_H) % HP_H;
            c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, 4 + (i % 4) * 2, 0, 7); c.stroke();
        }
        c.fillStyle = 'rgba(200,60,20,0.18)';                             // פפריקה
        for (let i = 0; i < 30; i++) { const x = (i * 41) % HP_W, y = ((i * 89 - cam * 0.15) % HP_H + HP_H) % HP_H; c.fillRect(x, y, 2.5, 2.5); }
    } else {                                                              // קבב בחלל: כוכבים, כוכבי לכת ולוויין בצורת שיפוד
        const g = c.createLinearGradient(0, 0, 0, HP_H); g.addColorStop(0, '#050414'); g.addColorStop(1, '#14082e');
        c.fillStyle = g; c.fillRect(0, 0, HP_W, HP_H);
        for (let i = 0; i < 70; i++) {
            const x = (i * 37) % HP_W, y = ((i * 113 - cam * (0.03 + (i % 3) * 0.03)) % HP_H + HP_H) % HP_H;
            c.globalAlpha = a * (0.35 + 0.45 * Math.abs(Math.sin(t * 1.5 + i)));
            c.fillStyle = '#fff'; c.fillRect(x, y, 1.4 + (i % 3) * 0.5, 1.4 + (i % 3) * 0.5);
        }
        c.globalAlpha = a;
        const py = 200 + ((-cam * 0.05) % 700 + 700) % 700 - 250;
        const pg = c.createRadialGradient(HP_W * 0.75 - 15, py - 15, 6, HP_W * 0.75, py, 46); pg.addColorStop(0, '#ff9a6a'); pg.addColorStop(1, '#8a2a5a');
        c.fillStyle = pg; c.beginPath(); c.arc(HP_W * 0.75, py, 44, 0, 7); c.fill();
        c.strokeStyle = 'rgba(255,220,180,0.55)'; c.lineWidth = 4; c.beginPath(); c.ellipse(HP_W * 0.75, py, 70, 14, -0.3, 0, 7); c.stroke();
        c.save(); c.translate(80 + Math.sin(t * 0.4) * 20, 120 + ((-cam * 0.09) % 500 + 500) % 500 - 100); c.rotate(t * 0.3);     // לוויין-שיפוד
        c.strokeStyle = '#c9d1d9'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-40, 0); c.lineTo(40, 0); c.stroke();
        for (const [cx, col] of [[-24, '#8a4a1e'], [-8, '#e8402a'], [8, '#8a4a1e'], [24, '#3fa33a']]) { c.fillStyle = col; c.fillRect(cx - 6, -6, 12, 12); }
        c.fillStyle = '#4a7ad0'; c.fillRect(-58, -8, 14, 16); c.fillRect(44, -8, 14, 16);
        c.restore();
    }
    c.restore();
}
// שוורמה מסתובבת: חרוט בשר עם פסים שזזים, שיפוד וגוף חימום זוהר
function hpShawarma(c, x, y, t) {
    c.save(); c.translate(x, y); c.globalAlpha *= 0.5;
    c.fillStyle = '#9aa1ae'; c.fillRect(-3, -120, 6, 250);
    const glow = c.createLinearGradient(-95, 0, -60, 0); glow.addColorStop(0, 'rgba(255,90,20,0.0)'); glow.addColorStop(1, 'rgba(255,90,20,0.55)');
    c.fillStyle = glow; c.fillRect(-95, -100, 40, 200);
    const cone = new Path2D(); cone.moveTo(-60, -100); cone.lineTo(60, -100); cone.lineTo(28, 100); cone.lineTo(-28, 100); cone.closePath();
    const g = c.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, '#5a2a10'); g.addColorStop(0.35, '#c46a2a'); g.addColorStop(0.6, '#e08a3a'); g.addColorStop(1, '#6a3212');
    c.fillStyle = g; c.fill(cone);
    c.save(); c.clip(cone);
    const off = (t * 22) % 16;                                            // הפסים זזים - נראה כמו סיבוב
    c.strokeStyle = 'rgba(70,25,5,0.55)'; c.lineWidth = 3;
    for (let yy = -110 + off; yy < 110; yy += 16) { c.beginPath(); c.moveTo(-70, yy); c.quadraticCurveTo(0, yy + 6, 70, yy); c.stroke(); }
    c.fillStyle = 'rgba(255,220,150,0.25)';
    for (let i = 0; i < 6; i++) { const sx = ((i * 23 + t * 30) % 120) - 60; c.fillRect(sx, -100, 3, 200); }
    c.restore();
    c.fillStyle = '#c9d1d9'; c.beginPath(); c.arc(0, -124, 6, 0, 7); c.fill();
    c.restore();
}

// פלטפורמות לפי העולם שבו נוצרו
function hpDrawPlat(c, p) {
    const bob = hpClamp(p.dip, -5, 6), x = p.x + (p.state === 'crack' ? p.shake : 0), y = p.y + bob, w = p.w, h = HP_PH;
    c.save();
    if (p.type === 'spike') hpGrill(c, x, y, w);
    else hpPlatBody(c, p.theme, p.type, x, y, w, h, p.seed, p.state === 'crack');
    if (p.spring) hpSpring(c, p.x + p.spring.off, y, p.spring.k);
    c.restore();
}
function hpRR(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function hpArrows(c, x, y, w, col) {
    c.fillStyle = col; const cy = y + HP_PH / 2, cx = x + w / 2;
    for (const s of [-1, 1]) { const bx = cx + s * 14; c.beginPath(); c.moveTo(bx + s * 6, cy); c.lineTo(bx - s * 2, cy - 5); c.lineTo(bx - s * 2, cy + 5); c.closePath(); c.fill(); }
}
function hpPlatBody(c, th, type, x, y, w, h, seed, cracking) {
    if (th === 0) {
        if (type === 'breakable') {                                       // פיתה
            c.fillStyle = '#e9c98a'; hpRR(c, x, y, w, h, h / 2); c.fill();
            c.fillStyle = '#c99a55'; for (let i = 0; i < w / 12; i++) { const sx = x + 6 + ((seed * 7 + i * 13) % (w - 12)); c.beginPath(); c.arc(sx, y + 5 + (i % 2) * 6, 1.8, 0, 7); c.fill(); }
            c.strokeStyle = '#9a6a30'; c.lineWidth = 2; hpRR(c, x, y, w, h, h / 2); c.stroke();
        } else if (type === 'moving') {                                   // מגש מתכת
            const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#e6ebf2'); g.addColorStop(1, '#8a94a6');
            c.fillStyle = g; hpRR(c, x, y + 3, w, h - 3, 5); c.fill();
            c.strokeStyle = '#4a5260'; c.lineWidth = 2; hpRR(c, x, y + 3, w, h - 3, 5); c.stroke();
            hpArrows(c, x, y + 2, w, 'rgba(40,50,60,0.6)');
        } else {                                                          // שיפוד
            c.strokeStyle = '#9aa1ae'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 2, y + h / 2); c.lineTo(x + w + 6, y + h / 2); c.stroke();
            c.fillStyle = '#9aa1ae'; c.beginPath(); c.moveTo(x + w + 6, y + h / 2 - 2); c.lineTo(x + w + 11, y + h / 2); c.lineTo(x + w + 6, y + h / 2 + 2); c.fill();
            c.strokeStyle = '#6b7280'; c.lineWidth = 2; c.beginPath(); c.arc(x - 6, y + h / 2, 4, 0, 7); c.stroke();
            const cols = ['#8a4a1e', '#e8402a', '#8a4a1e', '#3fa33a', '#f1e3c4'];
            const n = Math.max(3, Math.floor(w / 13)), cw = w / n;
            for (let i = 0; i < n; i++) {
                const col = cols[(i + Math.floor(seed)) % cols.length];
                c.fillStyle = col; hpRR(c, x + i * cw + 1, y + 1, cw - 2, h - 2, 4); c.fill();
                c.strokeStyle = 'rgba(40,15,5,0.6)'; c.lineWidth = 1.2; hpRR(c, x + i * cw + 1, y + 1, cw - 2, h - 2, 4); c.stroke();
            }
        }
    } else if (th === 1) {
        if (type === 'breakable') {                                       // שטר בודד ומקומט
            c.fillStyle = '#bff0c5'; c.beginPath(); c.moveTo(x, y + 3);
            for (let i = 0; i <= 6; i++) c.lineTo(x + w * i / 6, y + 2 + (i % 2) * 3);
            c.lineTo(x + w, y + h - 2); for (let i = 6; i >= 0; i--) c.lineTo(x + w * i / 6, y + h - 3 - (i % 2) * 3); c.closePath(); c.fill();
            c.strokeStyle = '#4caf6a'; c.lineWidth = 1.5; c.stroke();
            c.fillStyle = '#4caf6a'; c.font = 'bold 10px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('₪', x + w / 2, y + h / 2 + 1);
        } else if (type === 'moving') {                                   // מטיל זהב
            const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#fff1a0'); g.addColorStop(0.5, '#ffd23d'); g.addColorStop(1, '#b8860b');
            c.fillStyle = g; c.beginPath(); c.moveTo(x + 6, y); c.lineTo(x + w - 6, y); c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.fill();
            c.strokeStyle = '#8a5a00'; c.lineWidth = 2; c.stroke();
            hpArrows(c, x, y, w, 'rgba(120,70,0,0.6)');
        } else {                                                          // חבילת שטרות עם גומייה
            for (let i = 2; i >= 0; i--) { c.fillStyle = i ? '#3d8f4d' : '#6cc47a'; hpRR(c, x + i, y + i * 1.5, w - i * 2, h - 2, 3); c.fill(); }
            c.strokeStyle = '#1e5a2a'; c.lineWidth = 1.5; hpRR(c, x, y, w, h - 2, 3); c.stroke();
            c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(x + w * 0.25, y + h / 2 - 1, 5, 4, 0, 0, 7); c.fill();
            c.fillStyle = '#ffd23d'; c.fillRect(x + w / 2 - 6, y - 1, 12, h);
            c.fillStyle = '#8a5a00'; c.font = 'bold 9px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('₪', x + w / 2, y + h / 2 - 1);
        }
    } else if (th === 3) {
        if (type === 'breakable') {                                       // מצה
            c.fillStyle = '#f0d9a0'; hpRR(c, x, y + 2, w, h - 3, 2); c.fill();
            c.strokeStyle = '#b8894a'; c.lineWidth = 1.5; hpRR(c, x, y + 2, w, h - 3, 2); c.stroke();
            c.fillStyle = '#c99a55'; for (let gx = x + 5; gx < x + w - 3; gx += 6) for (const gy of [y + 6, y + 11]) c.fillRect(gx, gy, 1.5, 1.5);
        } else if (type === 'moving') {                                   // שטיח מעופף
            const wave = Math.sin(hp.t * 6 + seed) * 2;
            c.fillStyle = '#b8233a'; c.beginPath(); c.moveTo(x, y + 4 + wave); c.quadraticCurveTo(x + w / 2, y + 2 - wave, x + w, y + 4 + wave);
            c.lineTo(x + w, y + h - 3 + wave); c.quadraticCurveTo(x + w / 2, y + h - 5 - wave, x, y + h - 3 + wave); c.closePath(); c.fill();
            c.strokeStyle = '#ffd23d'; c.lineWidth = 2; c.stroke();
            hpArrows(c, x, y + 1, w, 'rgba(255,210,60,0.85)');
        } else {                                                          // שורת כדורי פלאפל
            const n = Math.max(3, Math.floor(w / 15)), r = w / n / 2;
            for (let i = 0; i < n; i++) {
                const cx = x + r + i * r * 2, cy = y + h / 2;
                const fg = c.createRadialGradient(cx - 2, cy - 2, 1, cx, cy, r); fg.addColorStop(0, '#d9963a'); fg.addColorStop(1, '#7a4214');
                c.fillStyle = fg; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
                c.strokeStyle = 'rgba(50,20,5,0.6)'; c.lineWidth = 1.2; c.stroke();
                c.fillStyle = '#4f9a2a'; c.beginPath(); c.arc(cx + 1, cy - 2, 1.4, 0, 7); c.fill();
            }
        }
    } else if (th === 4) {
        if (type === 'breakable') {                                       // פרוסת מלפפון חמוץ
            c.fillStyle = '#7ab83a'; hpRR(c, x, y + 1, w, h - 2, h / 2); c.fill();
            c.fillStyle = '#c8e890'; hpRR(c, x + 3, y + 4, w - 6, h - 8, h / 2); c.fill();
            c.fillStyle = '#5a9a2a'; for (let i = 0; i < w / 10; i++) { c.beginPath(); c.arc(x + 7 + i * 10, y + h / 2, 1.5, 0, 7); c.fill(); }
            c.strokeStyle = '#3f6e1a'; c.lineWidth = 1.5; hpRR(c, x, y + 1, w, h - 2, h / 2); c.stroke();
        } else if (type === 'moving') {                                   // סירת פיתה
            c.fillStyle = '#e9c98a'; c.beginPath(); c.moveTo(x, y + 2); c.quadraticCurveTo(x + w / 2, y + h + 6, x + w, y + 2); c.closePath(); c.fill();
            c.strokeStyle = '#9a6a30'; c.lineWidth = 2; c.stroke();
            hpArrows(c, x, y - 1, w, 'rgba(120,70,20,0.7)');
        } else {                                                          // צלחת חומוס עם שמן זית ופפריקה
            c.fillStyle = '#fbfbf6'; c.beginPath(); c.ellipse(x + w / 2, y + h / 2 + 1, w / 2, h / 2 + 1, 0, 0, 7); c.fill();
            c.strokeStyle = '#a9a59a'; c.lineWidth = 1.5; c.stroke();
            c.fillStyle = '#e8d2a0'; c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2 - 6, h / 2 - 3, 0, 0, 7); c.fill();
            c.fillStyle = 'rgba(200,170,40,0.8)'; c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 5, 2.5, 0, 0, 7); c.fill();
            c.fillStyle = '#c83a14'; for (const dx of [-0.25, 0.1, 0.3]) c.fillRect(x + w / 2 + dx * w - 1, y + h / 2 - 3, 2.5, 2.5);
        }
    } else if (th === 5) {
        if (type === 'breakable') {                                       // שביט קרח
            c.fillStyle = 'rgba(160,210,255,0.35)'; c.beginPath(); c.moveTo(x + w, y + h / 2); c.lineTo(x + w + 22, y + 2); c.lineTo(x + w + 22, y + h - 2); c.closePath(); c.fill();
            c.fillStyle = '#dff1ff'; hpRR(c, x, y + 1, w, h - 2, 5); c.fill();
            c.strokeStyle = '#8ab8e8'; c.lineWidth = 2; hpRR(c, x, y + 1, w, h - 2, 5); c.stroke();
        } else if (type === 'moving') {                                   // צלחת מעופפת
            c.fillStyle = 'rgba(140,255,200,0.6)'; c.beginPath(); c.ellipse(x + w / 2, y + 2, w / 5, 7, 0, Math.PI, 0); c.fill();
            const ug = c.createLinearGradient(0, y, 0, y + h); ug.addColorStop(0, '#d8dee8'); ug.addColorStop(1, '#6a7484');
            c.fillStyle = ug; c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2 - 1, 0, 0, 7); c.fill();
            c.strokeStyle = '#3a4250'; c.lineWidth = 1.5; c.stroke();
            for (let i = 0; i < 5; i++) { c.fillStyle = Math.sin(hp.t * 8 + i) > 0 ? '#ffe066' : '#ff5ad1'; c.beginPath(); c.arc(x + w * (0.15 + i * 0.175), y + h / 2 + 1, 1.8, 0, 7); c.fill(); }
        } else {                                                          // אסטרואיד
            c.fillStyle = '#6a6070'; c.beginPath(); c.moveTo(x + 4, y + 2);
            for (let i = 0; i <= 8; i++) c.lineTo(x + w * i / 8, y + 1 + ((seed * 3 + i * 7) % 4));
            c.lineTo(x + w - 2, y + h - 3); c.quadraticCurveTo(x + w / 2, y + h + 2, x + 2, y + h - 3); c.closePath(); c.fill();
            c.strokeStyle = '#2a2430'; c.lineWidth = 1.8; c.stroke();
            c.fillStyle = '#4a4252'; for (const dx of [0.2, 0.55, 0.8]) { c.beginPath(); c.arc(x + w * dx, y + h / 2, 2.6, 0, 7); c.fill(); }
        }
    } else {
        if (type === 'breakable') {                                       // קופסת קרטון
            c.fillStyle = '#b8895a'; hpRR(c, x, y, w, h, 2); c.fill();
            c.strokeStyle = '#6e4a26'; c.lineWidth = 1.5; hpRR(c, x, y, w, h, 2); c.stroke();
            c.fillStyle = 'rgba(255,240,200,0.5)'; c.fillRect(x + w / 2 - 8, y, 16, h);
        } else {                                                          // צינור ניאון (נע - סגול עם חצים)
            const col = type === 'moving' ? '#c77dff' : (Math.floor(seed) % 2 ? '#3fe0ff' : '#ff5ad1');
            c.shadowColor = col; c.shadowBlur = 12;
            c.fillStyle = '#140a28'; hpRR(c, x, y + 2, w, h - 4, 6); c.fill();
            c.strokeStyle = col; c.lineWidth = 3; hpRR(c, x + 1, y + 3, w - 2, h - 6, 5); c.stroke();
            c.shadowBlur = 0;
            if (type === 'moving') hpArrows(c, x, y, w, col);
        }
    }
    if (cracking) {
        c.strokeStyle = 'rgba(40,20,5,0.7)'; c.lineWidth = 1.3; const cx = x + w / 2;
        c.beginPath(); c.moveTo(cx - 2, y); c.lineTo(cx + 3, y + 5); c.lineTo(cx - 3, y + 10); c.lineTo(cx + 1, y + h); c.stroke();
    }
}
// גריל לוהט: שורף מלמעלה, חוסם מלמטה (בכל העולמות - כדי שתמיד יהיה ברור שזה מסוכן)
function hpGrill(c, x, y, w) {
    const t = hp.t;
    for (let i = 0; i < w / 10; i++) {                                   // להבות
        const fx = x + 5 + i * 10, fh = HP_SPIKE_H * (0.7 + 0.4 * Math.sin(t * 12 + i * 1.7));
        const g = c.createLinearGradient(0, y - fh, 0, y + 2); g.addColorStop(0, 'rgba(255,230,120,0.95)'); g.addColorStop(1, 'rgba(255,60,20,0.9)');
        c.fillStyle = g; c.beginPath(); c.moveTo(fx - 4, y + 2); c.quadraticCurveTo(fx - 2, y - fh * 0.5, fx, y - fh); c.quadraticCurveTo(fx + 2, y - fh * 0.5, fx + 4, y + 2); c.fill();
    }
    c.fillStyle = '#2a2d34'; hpRR(c, x, y, w, HP_PH, 3); c.fill();
    c.fillStyle = 'rgba(255,90,20,0.85)';
    for (let gx = x + 4; gx < x + w - 4; gx += 8) c.fillRect(gx, y + 3, 4, HP_PH - 6);
    c.strokeStyle = '#111'; c.lineWidth = 2; hpRR(c, x, y, w, HP_PH, 3); c.stroke();
}
function hpSpring(c, sx, y, k) {
    const h = HP_SPR_H * hpClamp(k, 0.3, 1.9);
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = '#263238'; c.lineWidth = 5;
    const coil = () => { c.beginPath(); c.moveTo(sx - 8, y - 2); for (let i = 0; i < 4; i++) { const yy = y - 2 - h * (i + 1) / 4.5; c.lineTo(sx + (i % 2 ? -8 : 8), yy + h * 0.1); c.lineTo(sx + (i % 2 ? 8 : -8), yy); } c.stroke(); };
    coil(); c.strokeStyle = '#cfd8dc'; c.lineWidth = 2.4; coil();
    c.fillStyle = '#e63946'; c.beginPath(); c.arc(sx, y - h - 3, 8, Math.PI, 0); c.fill();     // כרית עגבנייה
    c.fillStyle = '#3fa33a'; c.fillRect(sx - 2, y - h - 13, 4, 4);
}
function hpDrawCoin(c, co) {
    if (co.got) return;
    const bob = Math.sin(hp.t * 3 + co.ph) * 2.5, s = Math.abs(Math.cos(hp.t * 4 + co.ph));
    c.save(); c.translate(co.x, co.y + bob);
    const gl = c.createRadialGradient(0, 0, 3, 0, 0, 20); gl.addColorStop(0, 'rgba(255,230,120,.55)'); gl.addColorStop(1, 'rgba(255,230,120,0)');
    c.fillStyle = gl; c.fillRect(-20, -20, 40, 40);
    c.scale(Math.max(0.12, s), 1);
    c.fillStyle = '#8a5a00'; c.beginPath(); c.arc(0, 0, 11, 0, 7); c.fill();
    c.fillStyle = '#ffd54a'; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.fill();
    c.fillStyle = '#b8860b'; c.font = 'bold 11px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('K', 0, 1);
    c.restore();
}
function hpDrawDebris(c, d) {
    c.save(); c.translate(d.x + d.w / 2, d.y + HP_PH / 2); c.rotate(d.rot); c.translate(-d.w / 2, -HP_PH / 2);
    hpPlatBody(c, d.theme, 'breakable', 0, 0, d.w, HP_PH, d.seed, false);
    c.restore();
}
function hpText(c, text, x, y, size, col, glow) {
    c.font = 'bold ' + size + 'px "Secular One", Rubik, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl';
    c.lineWidth = Math.max(3, size * 0.18); c.strokeStyle = 'rgba(0,0,0,0.75)'; c.strokeText(text, x, y);
    if (glow) { c.shadowColor = glow; c.shadowBlur = 14; }
    c.fillStyle = col; c.fillText(text, x, y); c.shadowBlur = 0;
}

function hpDraw() {
    const c = hpCtx;
    if (!c) return;
    c.setTransform(hpPx, 0, 0, hpPx, 0, 0);
    hpDrawBg(c);
    c.save();
    if (hp.shake) c.translate(hpRand(-hp.shake, hp.shake), hpRand(-hp.shake, hp.shake));
    c.translate(0, -hp.camY);
    for (const p of hp.plats) if (p.y > hp.camY - 60 && p.y < hp.camY + HP_H + 60) hpDrawPlat(c, p);
    for (const co of hp.coinList) if (co.y > hp.camY - 30 && co.y < hp.camY + HP_H + 30) hpDrawCoin(c, co);
    for (const d of hp.debris) hpDrawDebris(c, d);
    hpDrawPlayer(c);
    for (const q of hp.parts) {
        const a = hpClamp(q.life / q.max, 0, 1);
        c.save(); c.translate(q.x, q.y); c.globalAlpha = a; c.fillStyle = q.col; c.strokeStyle = q.col;
        if (q.type === 'rect') { c.rotate(q.rot); c.fillRect(-q.size, -q.size * 0.4, q.size * 2, q.size * 0.8); }
        else if (q.type === 'star') { c.rotate(q.rot); const s = q.size * (0.4 + a * 0.6); c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.4 : s; c.lineTo(Math.cos(i * Math.PI / 4) * r, Math.sin(i * Math.PI / 4) * r); } c.closePath(); c.fill(); }
        else if (q.type === 'line') { c.lineWidth = q.size; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 18 * a + 5); c.stroke(); }
        else { c.beginPath(); c.arc(0, 0, q.size, 0, 7); c.fill(); }
        c.restore();
    }
    for (const f of hp.floaters) { c.globalAlpha = hpClamp(f.life / f.max * 1.5, 0, 1); hpText(c, f.text, f.x, f.y, 14, f.col); c.globalAlpha = 1; }
    c.restore();
    if (hp.flash) { c.fillStyle = 'rgba(255,60,20,' + hp.flash * 0.4 + ')'; c.fillRect(0, 0, HP_W, HP_H); }
    // שם העולם החדש
    if (hp.banner) {
        const t = hp.banner.t, a = t < 0.3 ? t / 0.3 : t > 1.8 ? hpClamp((2.2 - t) / 0.4, 0, 1) : 1;
        c.globalAlpha = a;
        hpText(c, hp.banner.text, HP_W / 2, 170, 34, '#ffe27a', 'rgba(255,170,40,0.8)');
        hpText(c, hp.banner.sub, HP_W / 2, 208, 16, '#fff');
        c.globalAlpha = 1;
    }
    // תזכורת בתחילת כל ריצה
    if (hp.tut < 0 && hp.hint > 0 && !hp.dead) {
        c.globalAlpha = Math.min(1, hp.hint);
        hpText(c, '👉 החזיקו צד כדי לזוז 👈', HP_W / 2, HP_H - 40, 16, '#fff');      // בכתיבה מימין לשמאל החצים מתהפכים - כך הם מצביעים החוצה
        c.globalAlpha = 1;
    }
    if (hp.tut >= 0) hpDrawTut(c);
    else if (hp.paused) {
        c.fillStyle = 'rgba(5,3,10,0.6)'; c.fillRect(0, 0, HP_W, HP_H);
        hpText(c, '⏸ המשחק בהשהיה', HP_W / 2, HP_H / 2 - 16, 28, '#ffe27a');
        hpText(c, 'הקישו כדי להמשיך', HP_W / 2, HP_H / 2 + 24, 16, '#fff');
    }
}
function hpDrawTut(c) {
    const s = HP_TUT[hp.tut];
    c.fillStyle = 'rgba(5,3,10,0.62)'; c.fillRect(0, 0, HP_W, HP_H);
    c.save(); c.translate(HP_W / 2, HP_H / 2);
    c.fillStyle = 'rgba(30,16,8,0.95)'; hpRR(c, -150, -130, 300, 250, 22); c.fill();
    c.strokeStyle = '#ffb020'; c.lineWidth = 3; hpRR(c, -150, -130, 300, 250, 22); c.stroke();
    c.font = '54px ' + (typeof SV_EMOJI_FONT !== 'undefined' ? SV_EMOJI_FONT : 'sans-serif'); c.textAlign = 'center'; c.textBaseline = 'middle';
    const bounce = Math.sin(hp.t * 18) * 6;
    c.fillText(s.ic, hp.tut === 0 ? Math.sin(hp.t * 9) * 30 : 0, -72 + (hp.tut === 1 ? -Math.abs(bounce) * 2 : 0));
    hpText(c, s.lines[0], 0, -10, 17, '#fff');
    hpText(c, s.lines[1], 0, 18, 17, '#fff');
    if (hp.tut === 2) {                                                  // דוגמאות קטנות
        c.save(); c.translate(-118, 50); hpGrill(c, 0, 0, 56); c.restore();
        c.save(); c.translate(-30, 50); hpPlatBody(c, 0, 'breakable', 0, 0, 52, HP_PH, 3, false); c.restore();
        c.save(); c.translate(70, 64); hpSpring(c, 0, 0, 1); c.restore();
        hpDrawCoin(c, { x: 112, y: 54, ph: 0, got: false });
    }
    hpText(c, 'הקישו להמשך (' + (hp.tut + 1) + '/' + HP_TUT.length + ')', 0, 98, 14, '#ffe27a');
    c.restore();
}

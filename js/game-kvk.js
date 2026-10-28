/* ============================================================
   משחק: קבבים מול קולסקים  (בסגנון "צמחים נגד זומבים")
   מציבים קבבים על הגריל כדי לעצור את הקולסקים הרעבים.
   המטבע בתוך המשחק הוא גחלים - נפרד לגמרי מהקבב קוינס.
   ============================================================ */
const KV_W = 360;
const KV_BAR = 66;                         // פס הכרטיסים למעלה
const KV_FOOT = 30;                        // פס התקדמות הגלים למטה
const KV_LANES = 4, KV_COLS = 6;
const KV_GX = 40;                          // אזור הסכינים משמאל
const KV_TILE = (KV_W - KV_GX - 2) / KV_COLS;
const KV_START_BANK = 200;
const KV_TUT_KEY = 'kebab_kvk_tutorial_done';

// הקבבים (המגינים)
const KV_KEBABS = {
    grill:   { name: 'מנגל',  cost: 50,  cd: 5,  hp: 300,  desc: 'מייצר גחלים כל כמה שניות' },
    skewer:  { name: 'שיפוד', cost: 100, cd: 5,  hp: 300,  desc: 'יורה קציצות בקולסקים שבשורה' },
    falafel: { name: 'פלאפל', cost: 175, cd: 7,  hp: 300,  desc: 'יורה פלאפל שמאט את הקולסקים' },
    tahini:  { name: 'טחינה', cost: 50,  cd: 20, hp: 2000, desc: 'חומה עמידה שעוצרת אותם' },
    onion:   { name: 'בצל',   cost: 150, cd: 35, hp: 9999, desc: 'מתפוצץ פעם אחת ופוגע בכל מי שקרוב' }
};
const KV_ORDER = ['grill', 'skewer', 'falafel', 'tahini', 'onion'];

// הקולסקים (התוקפים). speed בפיקסלים לוגיים לשנייה, bite = נזק לשנייה
const KV_KOL = {
    walker: { hp: 170,  speed: 9,  bite: 40,  scale: 1,    score: 10 },
    runner: { hp: 120,  speed: 18, bite: 35,  scale: 0.92, score: 20 },
    heavy:  { hp: 600,  speed: 7,  bite: 60,  scale: 1.22, score: 40 },
    boss:   { hp: 2000, speed: 5,  bite: 100, scale: 1.4,  score: 200 }
};
const KV_HEAVY_SKINS = ['viking', 'king', 'samurai', 'knight', 'sultan', 'gladiator', 'thunder'];

let kv = null;
let kvRaf = 0;
let kvCtx = null;
let kvH = 540;                             // גובה לוגי - נקבע לפי יחס המסך
let kvPx = 1;                              // פיקסלים אמיתיים ליחידה לוגית
const kvSprites = {};

const kvLaneH = () => (kvH - KV_BAR - KV_FOOT) / KV_LANES;
const kvLaneTop = l => KV_BAR + l * kvLaneH();
const kvColX = col => KV_GX + (col + 0.5) * KV_TILE;
// גודל הדמויות: לפי גובה השורה, אבל לעולם לא רחב יותר מהמשבצת (במסכים גבוהים השורות גבוהות)
const kvScale = () => Math.min(kvLaneH() / 108, 1.1);
const kvGround = l => kvLaneTop(l) + kvLaneH() - 20 * kvScale();
const kvMouthY = l => kvGround(l) - 40 * kvScale();
const kvCardRect = i => ({ x: 62 + i * 51, y: 8, w: 48, h: 52 });
const KV_SHOVEL = { x: 319, y: 8, w: 37, h: 52 };
const kvSkipRect = () => ({ x: 12, y: kvH - KV_FOOT - 40, w: 104, h: 30 });
const kvHelpRect = () => ({ x: 326, y: kvH - KV_FOOT + 2, w: 30, h: 26 });
const kvIn = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

function kvNewState() {
    const cds = {};
    KV_ORDER.forEach(k => { cds[k] = 0; });
    return {
        running: false, started: false, over: false, endT: 0, t: 0, last: 0,
        bank: KV_START_BANK, bankBump: 0, score: 0, kills: 0,
        wave: 0, waveState: 'grace', waveTimer: 25, queue: [], spawnIn: 0, waveTotal: 0, waveDone: 0, lastLane: -1,
        kebabs: [], kols: [], shots: [], pickups: [], flying: [], fx: [], knifeRuns: [], mfx: [],
        cos: typeof mstCos === 'function' ? mstCos('kvk') : 0,          // מראה הגריל מדרגת השליטה (זהב / יהלום / בוער)
        knives: [true, true, true, true], cds, selected: null, shovel: false, drag: null, hover: null,
        skyIn: 7, guide: false, banner: null, shake: 0, tut: null, pool: [], shownWave: -1, shownScore: -1
    };
}

function kvStop() {
    cancelAnimationFrame(kvRaf);
    if (kv && kv.running && !kv.over) kvSave();     // יציאה באמצע משחק - נשמר כדי להמשיך אחר כך
    if (kv) { kv.running = false; kv.paused = false; }
    kvHideMenu();
}

/* ---------- השהיה, שמירה והמשך ---------- */
const KV_SAVE_KEY = 'kebab_kvk_save';
const KV_SKIP_SAVE = ['running', 'paused', 'last', 'pool', 'flying', 'fx', 'drag', 'hover', 'selected', 'banner', 'shownWave', 'shownScore'];

function kvSave() {
    if (!kv || kv.over) return;
    const data = { v: 1, savedAt: Date.now(), h: kvH, st: {} };
    for (const k in kv) if (!KV_SKIP_SAVE.includes(k)) data.st[k] = kv[k];
    try { store.set(KV_SAVE_KEY, JSON.stringify(data)); } catch (e) { /* אין מקום - ממשיכים בלי שמירה */ }
}
function kvLoadSave() {
    try {
        const d = JSON.parse(store.get(KV_SAVE_KEY) || 'null');
        return d && d.v === 1 && d.st && Array.isArray(d.st.kebabs) ? d : null;
    } catch (e) { return null; }
}
function kvClearSave() { store.remove(KV_SAVE_KEY); }

function kvShowMenu(title, info, go, alt, extra) {
    document.getElementById('kvk-menu-title').textContent = title;
    document.getElementById('kvk-menu-info').textContent = info;
    [['kvk-menu-go', go], ['kvk-menu-alt', alt], ['kvk-menu-extra', extra]].forEach(([id, b]) => {
        const el = document.getElementById(id);
        el.style.display = b ? '' : 'none';
        if (b) { el.textContent = b[0]; el.onclick = b[1]; }
    });
    document.getElementById('kvk-menu').classList.add('open');
}
function kvHideMenu() {
    const m = document.getElementById('kvk-menu');
    if (m) m.classList.remove('open');
}
const kvSaveInfo = st => 'גל ' + Math.max(1, st.wave) + '  ·  ' + st.score + " נק'  ·  " + st.kills + ' קולסקים';

function kvPause() {
    if (!kv || !kv.running || kv.over || kv.paused) return;
    kv.paused = true;
    kv.drag = null;
    cancelAnimationFrame(kvRaf);
    kvSave();
    sfx.low();
    kvShowMenu('⏸ המשחק מושהה', kvSaveInfo(kv), ['▶️ המשך לשחק', kvResume],
        ['💾 שמור וצא', kvSaveAndLeave], ['🔄 התחל משחק חדש', () => { kvClearSave(); kv.running = false; startKvkGame(true); }]);
}
function kvResume() {
    if (!kv || !kv.paused) return;
    kvHideMenu();
    kv.paused = false;
    kv.last = performance.now();
    kvRaf = requestAnimationFrame(kvLoop);
}
function kvSaveAndLeave() {
    kvSave();
    if (kv) kv.running = false;
    kvHideMenu();
    switchTab('home');
    showToast('💾 המשחק נשמר. אפשר להמשיך מאותה נקודה', true);
}
// ממשיכים משחק שמור: מחזירים את המצב ומתאימים את המיקומים לגובה המסך הנוכחי
function kvContinueSaved(d) {
    kvClearSave();
    switchTab('kvk');
    kv = Object.assign(kvNewState(), d.st);
    kv.pool = kvSkinPool();
    kvResize();
    if (d.h && d.h !== kvH) {
        const f = (kvH - KV_BAR - KV_FOOT) / (d.h - KV_BAR - KV_FOOT);
        const fy = y => KV_BAR + (y - KV_BAR) * f;
        kv.pickups.forEach(c => { c.y = fy(c.y); c.landY = fy(c.landY); });
    }
    kv.banner = { text: 'ממשיכים!', sub: 'גל ' + Math.max(1, kv.wave), t: 0, life: 1.6 };
    kvUpdateHud();
    kv.running = true;
    kv.last = performance.now();
    kvRaf = requestAnimationFrame(kvLoop);
}

function startKvkGame(fresh) {
    const saved = fresh === true ? null : kvLoadSave();
    if (saved) {                            // יש משחק שמור - שואלים אם להמשיך
        switchTab('kvk');
        kv = null;
        kvResize();
        if (kvCtx) { kvCtx.fillStyle = '#0b0604'; kvCtx.fillRect(0, 0, KV_W, kvH); }
        kvShowMenu('💾 יש לך משחק שמור', kvSaveInfo(saved.st), ['▶️ המשך מאיפה שעצרתי', () => kvContinueSaved(saved)],
            ['🆕 משחק חדש', () => { kvClearSave(); startKvkGame(true); }], null);
        return;
    }
    switchTab('kvk');                       // עוצר כל משחק אחר
    kv = kvNewState();
    kv.pool = kvSkinPool();
    if (store.get(KV_TUT_KEY) !== '1') kv.tut = { step: 0, t: 0 };
    kvResize();
    kvUpdateHud();
    kv.running = true;
    kv.last = performance.now();
    kvRaf = requestAnimationFrame(kvLoop);
}

// סקינים שיכולים להופיע כקולסקים: בלי הקונוס הקלאסי,
// וסקינים של מהדורה מיוחדת רק אצל שחקנים שמחזיקים בהם
function kvSkinPool() {
    const owned = getOwnedSkins();
    return SV_SKINS.filter(s => s.kind !== 'cone' && s.rarity >= 0 &&
        !(SK_RARITY[s.rarity] && SK_RARITY[s.rarity].codeOnly && !owned.has(s.id)));
}

function kvResize() {
    const wrap = document.getElementById('kvk-wrap');
    const cv = document.getElementById('kvk-canvas');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    kvH = KV_W * h / w;
    kvPx = cv.width / KV_W;
    kvCtx = cv.getContext('2d');
    kvCtx.setTransform(cv.width / KV_W, 0, 0, cv.height / kvH, 0, 0);
}
window.addEventListener('resize', () => { if (kv && kv.running) { kvResize(); if (kv.paused) kvDraw(); } });
// יציאה מהאפליקציה באמצע משחק - משהים ושומרים
document.addEventListener('visibilitychange', () => { if (document.hidden && kv && kv.running && !kv.over) kvPause(); });
window.addEventListener('pagehide', () => { if (kv && kv.running && !kv.over) kvSave(); });

/* ---------- ספרייטים של קולסקים (נוצרים פעם אחת לכל סקין וגודל) ---------- */
function kvKolScale(type) { return kvScale() * 0.21 * KV_KOL[type].scale; }
function kvSprite(skinId, frame, s) {
    const k = s * kvPx;
    const key = skinId + '|' + frame + '|' + Math.round(k * 1000);
    if (kvSprites[key]) return kvSprites[key];
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(460 * k));
    cv.height = Math.max(1, Math.ceil(720 * k));
    const c = cv.getContext('2d');
    c.translate(230 * k, 350 * k);
    c.scale(k, k);
    const sk = skinById(skinId);
    const st = { x: 0, y: 0, hw: 44, ry: frame ? 24 : 12, chew: frame ? 1 : 0, t: 1.3, tx: -800, ty: 0, surprised: false, mx: 0, my: 0 };
    try {
        skDrawHumanBack(c, sk, st);
        skMouthBack(c, sk, st);
        skDrawHumanFront(c, sk, st);
        skMouthFront(c, sk, st);
    } catch (e) { console.error('kvSprite', skinId, e); }
    kvSprites[key] = cv;
    return cv;
}

/* ---------- גלים ---------- */
function kvWaveList(n) {
    const list = [];
    const count = Math.min(1 + n * 2, 26);
    for (let i = 0; i < count; i++) {
        const r = Math.random();
        let type = 'walker';
        if (n >= 2 && r < Math.min(0.35, 0.08 + n * 0.04)) type = 'runner';
        else if (n >= 3 && r > 1 - Math.min(0.3, 0.04 + n * 0.03)) type = 'heavy';
        list.push(type);
    }
    if (n % 5 === 0) list.push('boss');
    return list;
}

function kvStartWave() {
    kv.wave++;
    kv.queue = kvWaveList(kv.wave);
    kv.waveTotal = kv.queue.length;
    kv.waveDone = 0;
    kv.spawnIn = 1.2;
    kv.waveState = 'spawning';
    const big = kv.wave % 5 === 0;
    kv.banner = { text: 'גל ' + kv.wave, sub: big ? 'גל גדול – קולסקי ראשי בדרך!' : '', t: 0, life: 2.2 };
    sfx.low();
    kvUpdateHud();
}

function kvSpawnKol(type) {
    const def = KV_KOL[type];
    let lane = Math.floor(Math.random() * KV_LANES);
    if (lane === kv.lastLane && Math.random() < 0.6) lane = (lane + 1 + Math.floor(Math.random() * 3)) % KV_LANES;
    kv.lastLane = lane;
    let skin = null;
    if (type === 'boss') skin = kv.pool.find(s => s.id === 'detective');
    if (type === 'heavy') {
        const heavy = kv.pool.filter(s => KV_HEAVY_SKINS.includes(s.id));
        if (heavy.length) skin = heavy[Math.floor(Math.random() * heavy.length)];
    }
    if (!skin) skin = kv.pool[Math.floor(Math.random() * kv.pool.length)] || SV_SKINS[1];
    const mult = 1 + 0.12 * (kv.wave - 1);
    kv.kols.push({
        type, skin: skin.id, lane, x: KV_W + 26, hp: def.hp * mult, max: def.hp * mult,
        speed: def.speed * Math.min(1.35, 1 + 0.02 * (kv.wave - 1)), bite: def.bite,
        eating: false, chewT: 0, slowT: 0, hitT: 0, phase: Math.random() * 6, dying: 0
    });
}

/* ---------- גחלים ---------- */
function kvAddPickup(x, y, landY, sky) {
    kv.pickups.push({ x, y, landY, vy: sky ? 55 : -95, g: sky ? 0 : 300, landed: false, life: 10, value: 25 });
}
function kvGrillCoal(k) {
    kvAddPickup(k.x + 10, kvGround(k.lane) - 30, kvGround(k.lane) - 12, false);
    k.glow = 1;
}

/* ---------- הצבה ---------- */
function kvTileAt(p) {
    if (p.y < KV_BAR || p.y > kvH - KV_FOOT || p.x < KV_GX) return null;
    const lane = Math.floor((p.y - KV_BAR) / kvLaneH());
    const col = Math.floor((p.x - KV_GX) / KV_TILE);
    if (lane < 0 || lane >= KV_LANES || col < 0 || col >= KV_COLS) return null;
    return { lane, col };
}
function kvKebabAt(lane, col) { return kv.kebabs.find(k => k.lane === lane && k.col === col && !k.gone); }
function kvCanAfford(type) { return kv.bank >= KV_KEBABS[type].cost && kv.cds[type] <= 0; }

function kvPlace(type, tile) {
    if (!tile || kvKebabAt(tile.lane, tile.col) || !kvCanAfford(type)) return false;
    const def = KV_KEBABS[type];
    kv.bank -= def.cost;
    kv.cds[type] = def.cd;
    kv.kebabs.push({ type, lane: tile.lane, col: tile.col, x: kvColX(tile.col), hp: def.hp, max: def.hp,
                     t: type === 'grill' ? 4 : 0, fuse: type === 'onion' ? 0.9 : 0, recoil: 0, glow: 0, pop: 0 });
    kv.selected = null;
    kv.drag = null;
    sfx.pop();
    haptic(15);
    kvTutEvent('place-' + type);
    return true;
}

/* ---------- עדכון ---------- */
function kvStep(dt) {
    kv.t += dt;
    const live = kv.started && !kv.tut && !kv.over && !kv.guide;
    if (kv.tut) kv.tut.t += dt;

    if (kv.over) {
        kv.endT += dt;
        if (kv.endT > 1.8) { kvEnd(); return; }
    }

    if (live || kv.tut) for (const k in kv.cds) kv.cds[k] = Math.max(0, kv.cds[k] - dt);
    kv.bankBump = Math.max(0, kv.bankBump - dt * 3);
    kv.shake = Math.max(0, kv.shake - dt * 2.5);

    if (live) {
        if (kv.waveState === 'grace' || kv.waveState === 'break') {
            kv.waveTimer -= dt;
            if (kv.waveTimer <= 0) kvStartWave();
        } else if (kv.waveState === 'spawning') {
            kv.spawnIn -= dt;
            if (kv.spawnIn <= 0 && kv.queue.length) {
                kvSpawnKol(kv.queue.shift());
                const gap = Math.max(1.1, 4.4 - kv.wave * 0.3);
                kv.spawnIn = gap * (0.6 + Math.random() * 0.8);
            }
            if (!kv.queue.length) kv.waveState = 'clearing';
        } else if (kv.waveState === 'clearing' && !kv.kols.some(z => !z.dying)) {
            kv.score += 30 * kv.wave;
            kv.waveState = 'break';
            kv.waveTimer = 7;
            kv.banner = { text: 'הגל נהדף! 🎉', sub: '+' + (30 * kv.wave) + ' נקודות', t: 0, life: 2 };
            sfx.good();
        }
        // גחלים שנופלות מהשמיים
        kv.skyIn -= dt;
        if (kv.skyIn <= 0) {
            const l = Math.floor(Math.random() * KV_LANES);
            kvAddPickup(KV_GX + 20 + Math.random() * (KV_W - KV_GX - 40), KV_BAR + 6, kvLaneTop(l) + kvLaneH() * 0.55, true);
            kv.skyIn = 6 + Math.random() * 3;
        }
    }

    // קבבים
    for (const k of kv.kebabs) {
        k.recoil = Math.max(0, k.recoil - dt * 6);
        k.glow = Math.max(0, k.glow - dt * 1.5);
        k.pop = Math.min(1, k.pop + dt * 5);
        if (!live) continue;
        if (k.type === 'grill') {
            k.t -= dt;
            if (k.t <= 0) { kvGrillCoal(k); k.t = 10; }
        } else if (k.type === 'skewer' || k.type === 'falafel') {
            k.t -= dt;
            const target = kv.kols.some(z => !z.dying && z.lane === k.lane && z.x > k.x - 8 && z.x < KV_W + 6);
            if (k.t <= 0 && target) {
                kv.shots.push({ lane: k.lane, x: k.x + 16, kind: k.type === 'falafel' ? 'falafel' : 'meat', dmg: 20 });
                k.t = 1.45;
                k.recoil = 1;
            }
        } else if (k.type === 'onion') {
            k.fuse -= dt;
            if (k.fuse <= 0) kvExplode(k);
        }
    }
    kv.kebabs = kv.kebabs.filter(k => k.hp > 0 && !k.gone);

    // יריות
    for (const s of kv.shots) {
        s.x += 240 * dt;
        const hit = kv.kols.find(z => !z.dying && z.lane === s.lane && Math.abs(z.x - s.x) < 13);
        if (hit) {
            s.done = true;
            kvDamage(hit, s.dmg);
            if (s.kind === 'falafel') hit.slowT = 3.5;
            kv.fx.push({ kind: 'splat', x: s.x, y: kvMouthY(s.lane) - 4, t: 0, life: 0.3, col: s.kind === 'falafel' ? '#9ac24a' : '#c97a32' });
        }
        if (s.x > KV_W + 20) s.done = true;
    }
    kv.shots = kv.shots.filter(s => !s.done);

    // קולסקים
    for (const z of kv.kols) {
        if (z.dying) { z.dying += dt; continue; }
        z.hitT = Math.max(0, z.hitT - dt);
        z.slowT = Math.max(0, z.slowT - dt);
        if (!live) continue;
        const slow = z.slowT > 0 ? 0.5 : 1;
        const target = kv.kebabs.find(k => k.lane === z.lane && k.type !== 'onion' && z.x > k.x - 4 && z.x - k.x < 24);
        if (target) {
            z.eating = true;
            z.chewT += dt;
            target.hp -= z.bite * slow * dt;
            if (target.hp <= 0) sfx.err();
        } else {
            z.eating = false;
            z.x -= z.speed * slow * dt;
        }
        if (z.x < KV_GX - 6) {
            if (kv.knives[z.lane]) {
                kv.knives[z.lane] = false;
                kv.knifeRuns.push({ lane: z.lane, x: 6 });
                sfx.whoosh();
                haptic(60);
            } else if (z.x < 4 && !kv.over) {
                kvGameOver();
            }
        }
    }
    // סכין שחותכת את כל השורה
    for (const r of kv.knifeRuns) {
        r.x += 420 * dt;
        for (const z of kv.kols) if (!z.dying && z.lane === r.lane && z.x < r.x + 22) kvDamage(z, 99999);
    }
    kv.knifeRuns = kv.knifeRuns.filter(r => r.x < KV_W + 60);
    kv.kols = kv.kols.filter(z => !z.dying || z.dying < 0.6);

    // גחלים על הלוח
    for (const c of kv.pickups) {
        if (!c.landed) {
            c.vy += c.g * dt;
            c.y += c.vy * dt;
            if (c.y >= c.landY && c.vy > 0) { c.y = c.landY; c.landed = true; }
        } else if (!kv.tut) {
            c.life -= dt;
        }
    }
    kv.pickups = kv.pickups.filter(c => c.life > 0);
    for (const f of kv.flying) f.t += dt * 2.4;
    kv.flying = kv.flying.filter(f => f.t < 1);
    for (const f of kv.fx) f.t += dt;
    kv.fx = kv.fx.filter(f => f.t < f.life);
    if (kv.banner) { kv.banner.t += dt; if (kv.banner.t > kv.banner.life) kv.banner = null; }

    kvUpdateHud();
}

function kvDamage(z, dmg) {
    z.hp -= dmg;
    z.hitT = 0.12;
    if (z.hp <= 0 && !z.dying) {
        z.dying = 0.001;
        kv.kills++;
        kv.waveDone++;
        kv.score += KV_KOL[z.type].score;
        if (z.type === 'boss') { kv.banner = { text: 'הקולסקי הראשי הובס! 👑', sub: '', t: 0, life: 2 }; sfx.win(); }
    }
}

function kvExplode(k) {
    k.gone = true;
    for (const z of kv.kols) {
        if (!z.dying && Math.abs(z.lane - k.lane) <= 1 && Math.abs(z.x - k.x) < KV_TILE * 1.5) kvDamage(z, 1800);
    }
    kv.fx.push({ kind: 'boom', x: k.x, y: kvGround(k.lane) - 26, t: 0, life: 0.7 });
    kv.shake = 1;
    sfx.bomb();
    haptic([30, 20, 50]);
}

function kvGameOver() {
    kv.over = true;
    kvClearSave();
    kv.endT = 0;
    kv.selected = null;
    kv.banner = { text: 'הקולסקים אכלו את הקבביה!', sub: '', t: 0, life: 9 };
    sfx.low();
    haptic([80, 40, 120]);
}

function kvEnd() {
    if (!kv || !kv.running) return;
    kv.running = false;
    cancelAnimationFrame(kvRaf);
    saveBestScore('leaderboard_kvk', kv.score, 'kebab_kvkHighScore');
    const waves = Math.max(0, kv.wave - 1);
    const held = waves === 0 ? 'הקולסקים פרצו כבר בגל הראשון' : waves === 1 ? 'החזקתם מעמד גל אחד' : `החזקתם מעמד ${waves} גלים`;
    document.getElementById('result-desc').textContent =
        `${held}, הבסתם ${kv.kills} קולסקים וצברתם ${kv.score} נקודות!`;
    dailyEvent('kvk', { score: kv.score, waves, kills: kv.kills });
    showResultReward('kvk', kv.score);
    switchTab('result');
}

function kvUpdateHud() {
    const w = Math.max(1, kv.wave);
    if (w !== kv.shownWave) { kv.shownWave = w; document.getElementById('kvk-wave').textContent = w; }
    if (kv.score !== kv.shownScore) { kv.shownScore = kv.score; document.getElementById('kvk-score').textContent = kv.score; }
}

function kvLoop(ts) {
    if (!kv || !kv.running) return;
    const dt = Math.min(0.05, (ts - kv.last) / 1000 || 0.016);
    kv.last = ts;
    kvStep(dt);
    if (kv && kv.running) {
        kvDraw();
        kvRaf = requestAnimationFrame(kvLoop);
    }
}

/* ---------- הדרכה לשחקנים חדשים ---------- */
const KV_TUT = [
    { lines: ['הקולסקים רעבים ובדרך לקבביה!', 'הציבו קבבים על הגריל כדי לעצור אותם.'], tap: true },
    { lines: ['בחרו את המנגל', 'הוא מייצר גחלים – הכסף של המשחק.'], wait: 'select-grill' },
    { lines: ['הניחו את המנגל על משבצת בגריל'], wait: 'place-grill' },
    { lines: ['הקישו על הגחלים כדי לאסוף אותן'], wait: 'collect' },
    { lines: ['עכשיו בחרו שיפוד', 'הוא יורה קציצות בקולסקים.'], wait: 'select-skewer' },
    { lines: ['הניחו את השיפוד על משבצת פנויה'], wait: 'place-skewer' },
    { guide: true, tap: true },
    { lines: ['אם קולסקי מגיע לסוף השורה, הסכין חותכת', 'את כל השורה – אבל רק פעם אחת.', 'את המדריך אפשר לפתוח שוב בכפתור (?) למטה.', 'בהצלחה!'], tap: true }
];

function kvTutEvent(ev) {
    if (!kv || !kv.tut) return;
    const st = KV_TUT[kv.tut.step];
    if (st && st.wait === ev) kvTutNext();
}
function kvTutNext() {
    kv.tut.step++;
    kv.tut.t = 0;
    if (kv.tut.step >= KV_TUT.length) { kvTutDone(); return; }
    if (kv.tut.step === 3) {                               // המנגל הראשון מייצר גחלים מיד
        const g = kv.kebabs.find(k => k.type === 'grill');
        if (g) { kvGrillCoal(g); g.t = 10; }
        else kvAddPickup(KV_W / 2, KV_BAR + 10, kvLaneTop(1) + kvLaneH() * 0.55, true);
    }
}
function kvTutDone() {
    kv.tut = null;
    kv.started = true;
    kv.selected = null;
    kv.drag = null;
    kv.waveState = 'grace';
    kv.waveTimer = 25;
    store.set(KV_TUT_KEY, '1');
}
function kvTutTarget() {
    if (!kv.tut) return null;
    const s = kv.tut.step;
    if (s === 1) return kvCardRect(0);
    if (s === 4) return kvCardRect(1);
    if (s === 2 || s === 5) return { x: KV_GX, y: KV_BAR, w: KV_W - KV_GX, h: kvH - KV_BAR - KV_FOOT };
    if (s === 3 && kv.pickups.length) { const c = kv.pickups[0]; return { x: c.x - 22, y: c.y - 22, w: 44, h: 44 }; }
    return null;
}

/* ---------- קלט ---------- */
function kvPointerDown(p) {
    if (!kv || !kv.running || kv.over || kv.paused) return;
    if (kv.guide) { kv.guide = false; return; }             // מדריך פתוח - כל נגיעה סוגרת
    if (!kv.tut && kvIn(p, kvHelpRect())) { kv.guide = true; kv.selected = null; kv.drag = null; return; }
    if (kv.tut) {
        if (kvIn(p, kvSkipRect())) { kvTutDone(); return; }
        if (KV_TUT[kv.tut.step].tap) { if (kv.tut.t > 0.35) kvTutNext(); return; }
    } else if (!kv.started) {
        kv.started = true;                                 // הגלים מתחילים בנגיעה הראשונה
    }

    // איסוף גחלים
    let best = null, bd = 30;
    for (const c of kv.pickups) { const d = Math.hypot(c.x - p.x, c.y - p.y); if (d < bd) { bd = d; best = c; } }
    if (best) {
        kv.pickups = kv.pickups.filter(c => c !== best);
        kv.flying.push({ x: best.x, y: best.y, t: 0 });
        kv.bank += best.value;
        kv.bankBump = 1;
        sfx.coin();
        haptic(10);
        kvTutEvent('collect');
        return;
    }
    // כרטיסים
    for (let i = 0; i < KV_ORDER.length; i++) {
        if (!kvIn(p, kvCardRect(i))) continue;
        const type = KV_ORDER[i];
        if (kv.tut && KV_TUT[kv.tut.step].wait !== 'select-' + type) return;
        if (!kvCanAfford(type)) { sfx.err(); return; }
        kv.shovel = false;
        kv.selected = kv.selected === type ? null : type;
        kv.drag = kv.selected ? { type } : null;
        if (kv.selected) kvTutEvent('select-' + type);
        return;
    }
    if (kvIn(p, KV_SHOVEL)) {
        if (kv.tut) return;
        kv.selected = null;
        kv.shovel = !kv.shovel;
        return;
    }
    // לוח
    const tile = kvTileAt(p);
    if (!tile) return;
    if (kv.shovel) {
        const k = kvKebabAt(tile.lane, tile.col);
        if (k) { k.gone = true; sfx.whoosh(); }
        kv.shovel = false;
        return;
    }
    if (kv.selected) kvPlace(kv.selected, tile);
}
function kvPointerMove(p) {
    if (!kv) return;
    kv.hover = (kv.selected || kv.shovel) ? kvTileAt(p) : null;
}
function kvPointerUp(p) {
    if (!kv || !kv.drag) return;
    const tile = kvTileAt(p);                              // גרירה מהכרטיס אל הלוח
    if (tile && kv.selected === kv.drag.type) kvPlace(kv.drag.type, tile);
    kv.drag = null;
}

(function initKvkInput() {
    const cv = document.getElementById('kvk-canvas');
    if (!cv) return;
    const pt = e => {
        const r = cv.getBoundingClientRect();
        return { x: (e.clientX - r.left) / r.width * KV_W, y: (e.clientY - r.top) / r.height * kvH };
    };
    cv.addEventListener('pointerdown', e => {
        e.preventDefault();
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        kvPointerDown(pt(e));
        kvPointerMove(pt(e));
    });
    cv.addEventListener('pointermove', e => kvPointerMove(pt(e)));
    cv.addEventListener('pointerup', e => kvPointerUp(pt(e)));
    cv.addEventListener('pointercancel', () => { if (kv) kv.drag = null; });
})();

/* ---------- ציור ---------- */
function kvDrawCoal(c, x, y, r, glow) {
    if (glow) skGlow(c, x, y, r * 2.2, '#ff7a1a', 0.55 * glow);
    c.beginPath();
    c.moveTo(x - r, y + r * 0.3);
    c.lineTo(x - r * 0.6, y - r * 0.7); c.lineTo(x + r * 0.2, y - r); c.lineTo(x + r, y - r * 0.2);
    c.lineTo(x + r * 0.7, y + r * 0.7); c.lineTo(x - r * 0.4, y + r * 0.85);
    c.closePath();
    c.fillStyle = '#2a1d1a'; c.fill();
    c.strokeStyle = '#120a08'; c.lineWidth = Math.max(1, r * 0.12); c.stroke();
    c.strokeStyle = '#ff8a1a'; c.lineWidth = Math.max(1, r * 0.16);
    c.beginPath(); c.moveTo(x - r * 0.5, y - r * 0.1); c.lineTo(x, y + r * 0.2); c.lineTo(x + r * 0.5, y - r * 0.3);
    c.moveTo(x - r * 0.1, y - r * 0.6); c.lineTo(x + r * 0.1, y - r * 0.1); c.stroke();
}

function kvEyes(c, x, y, s, angry) {
    for (const o of [-1, 1]) {
        skE(c, x + o * 6 * s, y, 4.2 * s, 4.8 * s, '#fff', '#1a0d06', 1.2);
        skE(c, x + o * 6 * s + 1.2 * s, y + 0.5 * s, 2.1 * s, 2.3 * s, '#1a0d06');
    }
    if (angry) {
        c.strokeStyle = '#1a0d06'; c.lineWidth = 1.8 * s; c.lineCap = 'round';
        c.beginPath(); c.moveTo(x - 10 * s, y - 7 * s); c.lineTo(x - 3 * s, y - 4 * s); c.moveTo(x + 10 * s, y - 7 * s); c.lineTo(x + 3 * s, y - 4 * s); c.stroke();
    }
}

// מצייר קבב כשהבסיס שלו בנקודה (0,0) - הכול ביחידות של משבצת בגובה 108
function kvDrawKebabShape(c, type, k) {
    const t = kv ? kv.t : 0;
    if (type === 'grill') {
        const glow = k ? k.glow : 0;
        c.strokeStyle = '#2a2d34'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(-14, -12); c.lineTo(-20, 0); c.moveTo(14, -12); c.lineTo(20, 0); c.stroke();
        skGlow(c, 0, -30, 26, '#ff6a1a', 0.35 + 0.45 * glow + 0.1 * Math.sin(t * 4));
        c.beginPath(); c.moveTo(-24, -32); c.lineTo(24, -32); c.quadraticCurveTo(22, -10, 0, -10); c.quadraticCurveTo(-22, -10, -24, -32); c.closePath();
        c.fillStyle = kv && kv.cos ? ['', '', '', '#c9962a', '#8fcde8', '#6a1408'][kv.cos] : '#3a3d46'; c.fill(); c.strokeStyle = '#111'; c.lineWidth = 2; c.stroke();
        for (const [x, y] of [[-12, -35], [0, -37], [12, -35], [-6, -40], [7, -41]]) kvDrawCoal(c, x, y, 5, 0.4 + glow);
        c.strokeStyle = '#9aa1ae'; c.lineWidth = 1.5;
        for (let x = -20; x <= 20; x += 8) { c.beginPath(); c.moveTo(x, -33); c.lineTo(x, -31); c.stroke(); }
        c.beginPath(); c.moveTo(-24, -33); c.lineTo(24, -33); c.stroke();
        kvEyes(c, 0, -21, 0.9, false);
    } else if (type === 'skewer') {
        const rc = k ? -k.recoil * 4 : 0;
        c.save(); c.translate(rc, 0);
        skR(c, -2.5, -78, 5, 76, 2, '#d9dee6', '#3a1a08', 1.2);
        skE(c, 0, -80, 4, 4, '#e9c46a', '#3a1a08', 1.2);
        const parts = [['#8a4a1e', -66], ['#e8402a', -52], ['#8a4a1e', -38], ['#3fa33a', -24]];
        for (const [col, py] of parts) skR(c, -14, py, 28, 12, 5, col, '#2a1206', 1.6);
        skR(c, -16, -8, 32, 7, 3, '#2a2d34', '#000', 1);
        kvEyes(c, 0, -60, 0.85, false);
        c.restore();
    } else if (type === 'falafel') {
        const rc = k ? -k.recoil * 3 : 0;
        c.save(); c.translate(rc, 0);
        c.beginPath(); c.moveTo(-22, -40); c.quadraticCurveTo(-26, -2, 0, -2); c.quadraticCurveTo(26, -2, 22, -40); c.closePath();
        c.fillStyle = '#e8c58a'; c.fill(); c.strokeStyle = '#8a6a3a'; c.lineWidth = 1.6; c.stroke();
        for (const [x, y] of [[-11, -44], [11, -44], [0, -52]]) {
            const g = c.createRadialGradient(x - 2, y - 2, 1, x, y, 10);
            g.addColorStop(0, '#c9873a'); g.addColorStop(1, '#6e3a12');
            skE(c, x, y, 9.5, 9.5, g, '#3a1a08', 1.3);
            for (let i = 0; i < 3; i++) skE(c, x - 4 + i * 4, y + (i % 2) * 3 - 2, 1.3, 1, '#4f9a2a');
        }
        kvEyes(c, 0, -22, 0.85, false);
        c.restore();
    } else if (type === 'tahini') {
        const ratio = k ? k.hp / k.max : 1;
        const jar = c.createLinearGradient(-20, 0, 20, 0);
        jar.addColorStop(0, '#c9b07a'); jar.addColorStop(0.45, '#f6ead0'); jar.addColorStop(1, '#bfa36a');
        skR(c, -20, -56, 40, 54, 9, jar, '#5a4626', 1.6);
        skR(c, -22, -66, 44, 12, 3, '#d6291f', '#5a1208', 1.6);
        skR(c, -20, -32, 40, 15, 1, '#2a6fd0', '#14306a', 1);
        c.fillStyle = '#fff'; c.font = 'bold 8px "Secular One", Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('טחינה', 0, -24);
        kvEyes(c, 0, -44, 0.8, true);
        c.strokeStyle = 'rgba(60,40,20,0.8)'; c.lineWidth = 1.5;
        if (ratio < 0.66) { c.beginPath(); c.moveTo(-14, -54); c.lineTo(-8, -46); c.lineTo(-12, -38); c.stroke(); }
        if (ratio < 0.33) { c.beginPath(); c.moveTo(16, -50); c.lineTo(9, -40); c.lineTo(14, -30); c.lineTo(8, -20); c.stroke(); }
    } else if (type === 'onion') {
        const swell = k ? 1 + (0.9 - k.fuse) * 0.35 + Math.sin(t * 30) * 0.03 * (0.9 - k.fuse) : 1;
        c.save(); c.translate(0, -22); c.scale(swell, swell);
        c.beginPath(); c.moveTo(0, -26); c.bezierCurveTo(22, -14, 22, 18, 0, 20); c.bezierCurveTo(-22, 18, -22, -14, 0, -26); c.closePath();
        const g = c.createRadialGradient(-6, -6, 2, 0, 0, 24);
        g.addColorStop(0, '#f6e6f2'); g.addColorStop(1, '#b35aa0');
        c.fillStyle = g; c.fill(); c.strokeStyle = '#5a1e50'; c.lineWidth = 1.6; c.stroke();
        c.strokeStyle = 'rgba(120,40,100,0.5)'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(0, -24); c.quadraticCurveTo(-10, 0, 0, 19); c.moveTo(0, -24); c.quadraticCurveTo(10, 0, 0, 19); c.stroke();
        c.strokeStyle = '#6a4a20'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, -26); c.quadraticCurveTo(6, -34, 2, -40); c.stroke();
        skGlow(c, 2, -41, 7, '#ffcf3a', 0.9);
        skStar(c, 2, -41, 3.5, '#fff3b0', t * 8);
        kvEyes(c, 0, -2, 0.8, true);
        c.restore();
    }
}

function kvNameTag(c, text, x, y) {
    c.font = 'bold 8px Rubik, sans-serif';
    const w = c.measureText(text).width + 8;
    skR(c, x - w / 2, y - 5.5, w, 11, 5.5, 'rgba(10,5,2,0.72)', 'rgba(255,194,51,0.55)', 0.8);
    c.fillStyle = '#ffe9b8'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(text, x, y + 0.5);
}

// צבעי השורות לפי מראה השליטה, ופסי הרשת של הגריל
const KV_LANE_COLORS = { 0: ['#43281a', '#3a2214'], 3: ['#3d2a0e', '#33230a'], 4: ['#1e2c3e', '#182536'], 5: ['#36120a', '#2b0d07'] };
function kvDrawGrate(c, y, LH) {
    const col = kv.cos === 3 ? 'rgba(255, 210, 70, 0.5)' : kv.cos === 4 ? 'rgba(170, 230, 255, 0.35)'
        : 'rgba(255, ' + Math.round(100 + 40 * Math.sin(kv.t * 3)) + ', 30, 0.5)';
    c.strokeStyle = col; c.lineWidth = 2;
    for (let i = 1; i < 4; i++) { const yy = y + LH * i / 4; c.beginPath(); c.moveTo(KV_GX, yy); c.lineTo(KV_W, yy); c.stroke(); }
    if (kv.cos === 5) {                                                  // גחלים לוחשות מתחת לרשת
        const g = c.createLinearGradient(0, y + LH * 0.6, 0, y + LH);
        g.addColorStop(0, 'rgba(255, 80, 20, 0)'); g.addColorStop(1, 'rgba(255, 80, 20, ' + (0.16 + 0.06 * Math.sin(kv.t * 2 + y)) + ')');
        c.fillStyle = g; c.fillRect(0, y + LH * 0.6, KV_W, LH * 0.4);
    }
}

function kvDraw() {
    const c = kvCtx;
    if (!c) return;
    const LH = kvLaneH(), s = kvScale();
    c.save();
    if (kv.shake > 0) c.translate((Math.random() - 0.5) * kv.shake * 8, (Math.random() - 0.5) * kv.shake * 8);

    // רקע ושורות הגריל
    c.fillStyle = '#170c07'; c.fillRect(-10, -10, KV_W + 20, kvH + 20);
    for (let l = 0; l < KV_LANES; l++) {
        const y = kvLaneTop(l);
        c.fillStyle = (KV_LANE_COLORS[kv.cos] || KV_LANE_COLORS[0])[l % 2]; c.fillRect(0, y, KV_W, LH);
        if (kv.cos) kvDrawGrate(c, y, LH);
        for (let j = 0; j < KV_COLS; j++) if ((l + j) % 2) { c.fillStyle = 'rgba(255,190,120,0.045)'; c.fillRect(KV_GX + j * KV_TILE, y, KV_TILE, LH); }
        c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, y); c.lineTo(KV_W, y); c.stroke();
        // הסכין של השורה
        if (kv.knives[l]) {
            const ky = kvMouthY(l) + LH * 0.15;
            skR(c, 4, ky - 3, 12, 8, 2, '#5a3a1a', '#1a0a04', 1);
            c.beginPath(); c.moveTo(16, ky - 4); c.lineTo(36, ky - 2); c.lineTo(38, ky + 1); c.lineTo(16, ky + 4); c.closePath();
            c.fillStyle = '#d9dee6'; c.fill(); c.strokeStyle = '#5a606c'; c.lineWidth = 1; c.stroke();
            skE(c, 10, ky + 1, 1.5, 1.5, '#e9c46a');
        }
    }
    // גריל בוער: גחלים שעולות מהשורות; גריל יהלום: ניצוצות פה ושם
    if (kv.cos >= 4 && !kv.over && Math.random() < (kv.cos === 5 ? 0.5 : 0.12)) {
        const l = Math.floor(Math.random() * KV_LANES);
        mstFx.burst(kv.mfx, KV_GX + Math.random() * (KV_W - KV_GX), kvLaneTop(l) + LH * (0.3 + Math.random() * 0.6), 1,
                    kv.cos === 5 ? MST_FIRE : MST_SPARK, kv.cos === 5 ? 18 : 6, kv.cos === 5 ? 1.4 : 0.7, kv.cos === 5 ? -40 : 0);
    }
    if (kv.mfx.length) mstFx.draw(c, kv.mfx);
    // סימון משבצות כשבוחרים קבב
    if (kv.selected && !kv.over) {
        for (let l = 0; l < KV_LANES; l++) for (let j = 0; j < KV_COLS; j++) {
            if (kvKebabAt(l, j)) continue;
            c.fillStyle = 'rgba(255,215,0,' + (0.04 + 0.03 * Math.sin(kv.t * 5)) + ')';
            c.fillRect(KV_GX + j * KV_TILE + 2, kvLaneTop(l) + 2, KV_TILE - 4, LH - 4);
        }
    }
    if (kv.hover && (kv.selected || kv.shovel)) {
        const hx = KV_GX + kv.hover.col * KV_TILE, hy = kvLaneTop(kv.hover.lane);
        const ok = kv.shovel ? !!kvKebabAt(kv.hover.lane, kv.hover.col) : !kvKebabAt(kv.hover.lane, kv.hover.col);
        c.strokeStyle = ok ? 'rgba(255,215,0,0.85)' : 'rgba(255,80,80,0.8)'; c.setLineDash([5, 4]); c.lineWidth = 2;
        c.strokeRect(hx + 2, hy + 2, KV_TILE - 4, LH - 4); c.setLineDash([]);
        if (ok && kv.selected) {
            c.save(); c.globalAlpha = 0.45; c.translate(hx + KV_TILE / 2, kvGround(kv.hover.lane)); c.scale(s, s);
            kvDrawKebabShape(c, kv.selected, null); c.restore();
        }
    }

    // קבבים וקולסקים - שורה אחרי שורה כדי שהשורה התחתונה תסתיר את העליונה
    for (let l = 0; l < KV_LANES; l++) {
        for (const k of kv.kebabs) {
            if (k.lane !== l) continue;
            const gy = kvGround(l);
            c.save();
            c.translate(k.x, gy);
            const pop = 0.6 + 0.4 * (1 - Math.pow(1 - k.pop, 3));
            c.scale(s * pop, s * pop);
            kvDrawKebabShape(c, k.type, k);
            c.restore();
            if (k.hp < k.max && k.type !== 'onion') {
                const w = 30 * s;
                skR(c, k.x - w / 2, gy - 82 * s, w, 3, 1.5, 'rgba(0,0,0,0.5)');
                c.fillStyle = '#4ac26b'; c.fillRect(k.x - w / 2, gy - 82 * s, w * Math.max(0, k.hp / k.max), 3);
            }
            kvNameTag(c, KV_KEBABS[k.type].name, k.x, gy + 9 * s);
        }
        const lt = kvLaneTop(l);
        for (const z of kv.kols) {
            if (z.lane !== l) continue;
            const sc = kvKolScale(z.type);
            const frame = z.eating && Math.floor(z.chewT * 5) % 2 ? 1 : 0;
            const spr = kvSprite(z.skin, frame, sc);
            let my = kvMouthY(l) + (z.type === 'boss' ? 10 * s : 0);
            if (!z.eating && !z.dying) my += Math.sin(kv.t * 7 + z.phase) * 1.6;
            c.save();
            c.beginPath(); c.rect(-20, lt - 36, KV_W + 80, LH + 36); c.clip();
            if (z.dying) { c.globalAlpha = Math.max(0, 1 - z.dying / 0.6); my += z.dying * 30; }
            c.translate(z.x + (z.hitT > 0 ? 1.5 : 0), my);
            if (!z.eating && !z.dying) c.rotate(Math.sin(kv.t * 7 + z.phase) * 0.04);
            c.drawImage(spr, -230 * sc, -350 * sc, 460 * sc, 720 * sc);
            c.restore();
            if (z.dying) continue;
            if (z.slowT > 0) {
                c.fillStyle = 'rgba(140,200,255,0.35)';
                c.beginPath(); c.ellipse(z.x, kvGround(l) + 4, 18 * s, 5 * s, 0, 0, Math.PI * 2); c.fill();
                for (let i = 0; i < 3; i++) skE(c, z.x - 10 + i * 10, kvGround(l) + 4 + (i % 2) * 2, 2, 1.5, '#b8782e');
            }
            if (z.hp < z.max || z.type === 'boss') {
                const w = (z.type === 'boss' ? 46 : 28) * s, by = my - 200 * sc - 6;
                skR(c, z.x - w / 2, by, w, 4, 2, 'rgba(0,0,0,0.6)');
                c.fillStyle = z.type === 'boss' ? '#ff4d6d' : '#ff9f1c'; c.fillRect(z.x - w / 2, by, w * Math.max(0, z.hp / z.max), 4);
                if (z.type === 'boss') {
                    c.fillStyle = '#ff8aa0'; c.font = 'bold 9px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
                    c.fillText('👑 קולסקי ראשי', z.x, by - 7);
                }
            }
        }
    }

    // יריות
    for (const sh of kv.shots) {
        const y = kvMouthY(sh.lane) - 2;
        const g = c.createLinearGradient(sh.x - 22, 0, sh.x, 0);
        g.addColorStop(0, 'rgba(255,140,40,0)'); g.addColorStop(1, sh.kind === 'falafel' ? 'rgba(160,200,90,0.55)' : 'rgba(255,140,40,0.55)');
        c.fillStyle = g; c.fillRect(sh.x - 22, y - 2.5, 22, 5);
        skE(c, sh.x, y, 5 * Math.max(0.8, s), 5 * Math.max(0.8, s), sh.kind === 'falafel' ? '#7a5a1a' : '#8a3e14', '#2a1206', 1);
        if (sh.kind === 'falafel') skE(c, sh.x - 1, y - 1, 1.4, 1.2, '#6abf4b');
    }
    // סכינים שרצות
    for (const r of kv.knifeRuns) {
        const y = kvMouthY(r.lane) + LH * 0.1;
        skGlow(c, r.x + 16, y, 26, '#ffffff', 0.4);
        c.save(); c.translate(r.x, y); c.scale(1.6, 1.6);
        skR(c, -6, -3, 12, 8, 2, '#5a3a1a', '#1a0a04', 1);
        c.beginPath(); c.moveTo(6, -4); c.lineTo(28, -2); c.lineTo(30, 1); c.lineTo(6, 4); c.closePath();
        c.fillStyle = '#eef1f6'; c.fill(); c.strokeStyle = '#5a606c'; c.lineWidth = 1; c.stroke();
        c.restore();
    }
    // אפקטים
    for (const f of kv.fx) {
        const p = f.t / f.life;
        if (f.kind === 'splat') {
            c.globalAlpha = 1 - p;
            for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; skE(c, f.x + Math.cos(a) * (4 + p * 10), f.y + Math.sin(a) * (3 + p * 8), 2.2, 2.2, f.col); }
            c.globalAlpha = 1;
        } else if (f.kind === 'boom') {
            c.globalAlpha = 1 - p;
            skGlow(c, f.x, f.y, 40 + p * 70, '#ffe7a8', 0.8);
            for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; skE(c, f.x + Math.cos(a) * (12 + p * 60), f.y + Math.sin(a) * (10 + p * 46), 9 * (1 - p * 0.5), 5, null, '#e0a8d8', 3, a); }
            c.globalAlpha = 1;
        }
    }
    // גחלים לאיסוף
    for (const cl of kv.pickups) {
        const blink = cl.life < 2.5 ? (Math.sin(kv.t * 14) > 0 ? 1 : 0.35) : 1;
        c.globalAlpha = blink;
        const bob = cl.landed ? Math.sin(kv.t * 3 + cl.x) * 1.5 : 0;
        kvDrawCoal(c, cl.x, cl.y + bob, 11, 1);
        c.globalAlpha = 1;
    }

    // פס עליון: גחלים, כרטיסים, את
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, KV_W, KV_BAR);
    c.fillStyle = '#8a5a34'; c.fillRect(0, KV_BAR - 3, KV_W, 3);
    const bump = 1 + kv.bankBump * 0.18;
    skR(c, 4, 8, 54, 52, 10, '#2a160c', '#ff8a1a', 1.8);
    kvDrawCoal(c, 31, 26, 9 * bump, 0.6);
    c.fillStyle = '#ffd08a'; c.font = 'bold ' + Math.round(14 * bump) + 'px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(kv.bank, 31, 48);
    KV_ORDER.forEach((type, i) => {
        const r = kvCardRect(i), def = KV_KEBABS[type];
        const sel = kv.selected === type, ok = kvCanAfford(type);
        skR(c, r.x, r.y, r.w, r.h, 8, sel ? '#5a3a1a' : '#3a2416', sel ? '#ffc233' : '#6b4426', sel ? 2.5 : 1.5);
        c.save(); c.beginPath(); c.rect(r.x, r.y, r.w, r.h - 14); c.clip();
        c.translate(r.x + r.w / 2, r.y + 36); c.scale(0.45, 0.45);
        kvDrawKebabShape(c, type, null);
        c.restore();
        const cd = kv.cds[type] / def.cd;
        if (cd > 0) { c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(r.x, r.y, r.w, r.h * cd); }
        else if (!ok) { c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(r.x, r.y, r.w, r.h); }
        kvDrawCoal(c, r.x + 12, r.y + r.h - 8, 4, 0);
        c.fillStyle = kv.bank >= def.cost ? '#ffd08a' : '#9a8a7a'; c.font = 'bold 10px Rubik, sans-serif';
        c.textAlign = 'center'; c.fillText(def.cost, r.x + 29, r.y + r.h - 7);
    });
    skR(c, KV_SHOVEL.x, KV_SHOVEL.y, KV_SHOVEL.w, KV_SHOVEL.h, 8, kv.shovel ? '#5a3a1a' : '#3a2416', kv.shovel ? '#ffc233' : '#6b4426', kv.shovel ? 2.5 : 1.5);
    c.save(); c.translate(KV_SHOVEL.x + KV_SHOVEL.w / 2, KV_SHOVEL.y + 22); c.rotate(-0.6);
    skR(c, -2, -14, 4, 20, 1.5, '#8a5a2c'); skP(c, [[-7, 6], [7, 6], [5, 18], [0, 21], [-5, 18]], '#b8bfcc', '#4a505c', 1);
    c.restore();
    c.fillStyle = '#f0dcc8'; c.font = 'bold 8px Rubik, sans-serif'; c.textAlign = 'center';
    c.fillText('הסרה', KV_SHOVEL.x + KV_SHOVEL.w / 2, KV_SHOVEL.y + KV_SHOVEL.h - 7);

    // גחלים שעפות אל המונה
    for (const f of kv.flying) {
        const e = 1 - Math.pow(1 - f.t, 3);
        kvDrawCoal(c, f.x + (31 - f.x) * e, f.y + (26 - f.y) * e - Math.sin(f.t * Math.PI) * 30, 10 - e * 3, 1);
    }

    // פס תחתון: התקדמות הגלים
    const fy = kvH - KV_FOOT;
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(0, fy, KV_W, KV_FOOT);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 11px Rubik, sans-serif'; c.fillStyle = '#f0dcc8';
    if (!kv.started && !kv.tut) {
        c.fillText('הקישו על המסך כדי להתחיל', KV_W / 2, fy + 15);
    } else if (kv.waveState === 'grace' || kv.waveState === 'break') {
        c.fillText((kv.wave ? 'הגל הבא' : 'הקולסקים מגיעים') + ' בעוד ' + Math.max(0, Math.ceil(kv.waveTimer)) + '…', KV_W / 2, fy + 15);
    } else {
        const prog = kv.waveTotal ? kv.waveDone / kv.waveTotal : 0;
        c.fillText('גל ' + kv.wave, 34, fy + 15);
        skR(c, 70, fy + 9, 240, 12, 6, 'rgba(0,0,0,0.55)', '#6b4426', 1);
        c.fillStyle = '#ff9f1c'; c.fillRect(72, fy + 11, 236 * Math.min(1, prog), 8);
        c.fillStyle = '#ff4d6d'; c.fillRect(306, fy + 4, 2, 16); skP(c, [[308, fy + 4], [317, fy + 8], [308, fy + 12]], '#ff4d6d');
    }

    // לפני הנגיעה הראשונה
    if (!kv.started && !kv.tut) {
        const a = 0.75 + 0.25 * Math.sin(kv.t * 4);
        skR(c, 40, kvH * 0.42 - 34, KV_W - 80, 68, 16, 'rgba(10,5,2,0.8)', 'rgba(255,194,51,' + a + ')', 2);
        c.fillStyle = '#ffd54f'; c.font = 'bold 20px "Secular One", Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('הקישו כדי להתחיל', KV_W / 2, kvH * 0.42 - 10);
        c.fillStyle = '#f0dcc8'; c.font = 'bold 11px Rubik, sans-serif';
        c.fillText('הקולסקים יוצאים לדרך ברגע שתיגעו במסך', KV_W / 2, kvH * 0.42 + 16);
    }

    // באנר
    if (kv.banner) {
        const b = kv.banner, a = Math.min(1, b.t * 4, (b.life - b.t) * 3);
        c.globalAlpha = Math.max(0, a);
        const by = kvH * 0.42;
        skR(c, 30, by - 30, KV_W - 60, b.sub ? 62 : 46, 14, 'rgba(10,5,2,0.82)', '#ffc233', 2);
        c.fillStyle = '#ffd54f'; c.font = 'bold 22px "Secular One", Rubik, sans-serif';
        c.fillText(b.text, KV_W / 2, by - 7);
        if (b.sub) { c.fillStyle = '#ff9f1c'; c.font = 'bold 12px Rubik, sans-serif'; c.fillText(b.sub, KV_W / 2, by + 18); }
        c.globalAlpha = 1;
    }
    c.restore();

    if (!kv.tut) {                                       // כפתור המדריך
        const h = kvHelpRect();
        skE(c, h.x + h.w / 2, h.y + h.h / 2, 11, 11, kv.guide ? '#ffc233' : 'rgba(255,194,51,0.18)', '#ffc233', 1.5);
        c.fillStyle = kv.guide ? '#2a1206' : '#ffd54f'; c.font = 'bold 14px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('?', h.x + h.w / 2, h.y + h.h / 2 + 1);
    }
    if (kv.guide) { kvDrawGuide(c, 'הקישו כדי לחזור למשחק'); }
    if (kv.tut) kvDrawTutorial(c);
}

function kvWrapLines(c, lines, x, y, lh) {
    lines.forEach((ln, i) => c.fillText(ln, x, y + i * lh));
}

// מדריך הקבבים: מה כל קבב עושה ובכמה גחלים
function kvDrawGuide(c, hint) {
    c.save();
    c.fillStyle = 'rgba(0,0,0,0.62)'; c.fillRect(0, 0, KV_W, kvH);
    const rowH = Math.max(40, Math.min(54, (kvH - KV_BAR - 164) / KV_ORDER.length));       // מתכווץ במסכים נמוכים
    const top = Math.max(KV_BAR + 6, kvH / 2 - (KV_ORDER.length * rowH + 74) / 2);
    const h = KV_ORDER.length * rowH + 74;
    skR(c, 14, top, KV_W - 28, h, 16, 'rgba(26,12,6,0.96)', '#ffc233', 2);
    c.fillStyle = '#ffd54f'; c.font = 'bold 18px "Secular One", Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('הכירו את הקבבים', KV_W / 2, top + 22);
    KV_ORDER.forEach((type, i) => {
        const def = KV_KEBABS[type], y = top + 44 + i * rowH;
        skR(c, 24, y, KV_W - 48, rowH - 6, 10, i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.07)');
        c.save(); c.beginPath(); c.rect(26, y, 48, rowH - 6); c.clip();
        c.translate(50, y + rowH - 10); c.scale(0.5, 0.5);
        kvDrawKebabShape(c, type, null);
        c.restore();
        c.textAlign = 'right';
        c.fillStyle = '#fff3d6'; c.font = 'bold 14px Rubik, sans-serif';
        c.fillText(def.name, KV_W - 34, y + 15);
        c.fillStyle = '#e0c9a8'; c.font = '11px Rubik, sans-serif';
        c.fillText(def.desc, KV_W - 34, y + 34);
        c.textAlign = 'center';
        kvDrawCoal(c, 96, y + 16, 6, 0.3);
        c.fillStyle = '#ffd08a'; c.font = 'bold 12px Rubik, sans-serif';
        c.fillText(def.cost, 96, y + 34);
    });
    if (hint) {
        c.fillStyle = 'rgba(255,215,0,' + (0.55 + 0.45 * Math.sin(kv.t * 4)) + ')'; c.font = 'bold 11px Rubik, sans-serif'; c.textAlign = 'center';
        c.fillText(hint, KV_W / 2, top + h - 14);
    }
    c.restore();
}

function kvDrawTutorial(c) {
    const st = KV_TUT[kv.tut.step];
    if (!st) return;
    if (st.guide) {
        kvDrawGuide(c, 'הקישו כדי להמשיך');
        c.save();
        c.fillStyle = '#ffc233'; c.font = 'bold 10px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('הדרכה ' + (kv.tut.step + 1) + '/' + KV_TUT.length, KV_W / 2, KV_BAR - 2);
        const sk = kvSkipRect();
        skR(c, sk.x, sk.y, sk.w, sk.h, 15, 'rgba(0,0,0,0.6)', 'rgba(255,255,255,0.4)', 1);
        c.fillStyle = '#f0dcc8'; c.font = 'bold 11px Rubik, sans-serif';
        c.fillText('דילוג על ההדרכה', sk.x + sk.w / 2, sk.y + sk.h / 2 + 1);
        c.restore();
        return;
    }
    const tg = kvTutTarget();
    // החשכה עם "חור" סביב היעד
    c.save();
    c.beginPath();
    c.rect(0, 0, KV_W, kvH);
    if (tg) c.rect(tg.x + tg.w, tg.y, -tg.w, tg.h);
    c.fillStyle = 'rgba(0,0,0,' + (tg ? 0.5 : 0.62) + ')';
    c.fill('evenodd');
    if (tg) {
        const pulse = 0.5 + 0.5 * Math.sin(kv.t * 6);
        c.strokeStyle = 'rgba(255,215,0,' + (0.6 + 0.4 * pulse) + ')'; c.lineWidth = 2.5 + pulse * 1.5;
        c.strokeRect(tg.x - 2, tg.y - 2, tg.w + 4, tg.h + 4);
    }
    // תיבת הטקסט - בצד שבו היעד לא נמצא
    const lines = st.lines;
    const boxH = 30 + lines.length * 18 + (st.tap ? 18 : 0);
    let by = kvH * 0.5 - boxH / 2;
    if (tg && tg.h < 200) by = tg.y < kvH / 2 ? Math.min(kvH - KV_FOOT - boxH - 50, tg.y + tg.h + 28) : Math.max(KV_BAR + 10, tg.y - boxH - 28);
    if (tg && tg.h >= 200) by = kvH - KV_FOOT - boxH - 52;
    skR(c, 22, by, KV_W - 44, boxH, 14, 'rgba(26,12,6,0.95)', '#ffc233', 2);
    c.fillStyle = '#fff3d6'; c.font = 'bold 14px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    kvWrapLines(c, lines, KV_W / 2, by + 22, 18);
    if (st.tap) {
        c.fillStyle = 'rgba(255,215,0,' + (0.55 + 0.45 * Math.sin(kv.t * 4)) + ')'; c.font = 'bold 11px Rubik, sans-serif';
        c.fillText('הקישו כדי להמשיך', KV_W / 2, by + boxH - 14);
    }
    c.fillStyle = '#ffc233'; c.font = 'bold 10px Rubik, sans-serif';
    c.fillText('הדרכה ' + (kv.tut.step + 1) + '/' + KV_TUT.length, KV_W / 2, by - 9);
    // כפתור דילוג
    const sk = kvSkipRect();
    skR(c, sk.x, sk.y, sk.w, sk.h, 15, 'rgba(0,0,0,0.6)', 'rgba(255,255,255,0.4)', 1);
    c.fillStyle = '#f0dcc8'; c.font = 'bold 11px Rubik, sans-serif';
    c.fillText('דילוג על ההדרכה', sk.x + sk.w / 2, sk.y + sk.h / 2 + 1);
    c.restore();
}

function loadKvkLeaderboard() {
    loadLeaderboardInto('kvk-leaderboard-container', 'leaderboard_kvk');
}


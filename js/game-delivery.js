/* ============================================================
   משחק: שליח הקבבים
   רוכבים על קטנוע בכביש עם 3 נתיבים: מחליקים / מקישים ימינה ושמאלה כדי לעבור נתיב
   ולהתחמק ממכוניות ובורות, ולוחצים בסרגל למטה על המנה שהלקוח על המדרכה ביקש.
   3 לבבות: מאבדים לב על התנגשות או על מנה לא נכונה.
   ============================================================ */
const DLV_W = 360;
const DLV_BAR = 74;                        // סרגל המנות למטה
const DLV_ROAD_L = 72, DLV_ROAD_R = 288;   // הכביש; משני הצדדים מדרכות ובתים
const DLV_LANE_W = (DLV_ROAD_R - DLV_ROAD_L) / 3;
const DLV_HEARTS = 3;
const DLV_ITEMS = [
    { id: 'kebab', emoji: '🍢', name: 'קבב' },
    { id: 'shawarma', emoji: '🥙', name: 'שווארמה' },
    { id: 'wrap', emoji: '🌯', name: 'לאפה' },
    { id: 'drink', emoji: '🥤', name: 'שתייה' }
];
const DLV_CAR_COLORS = ['#e8402a', '#2c6fd0', '#f2c230', '#2ea043', '#9a5bd6', '#f4f4f7', '#ff8a1a'];

let dlv = null;
let dlvRaf = 0;
let dlvCtx = null;
let dlvH = 600;                            // גובה לוגי - לפי יחס המסך
let dlvPx = 1;
const dlvSprites = {};

const dlvLaneX = i => DLV_ROAD_L + DLV_LANE_W * (i + 0.5);
const dlvPlayerY = () => dlvH - DLV_BAR - 70;
const dlvBtnRect = i => { const w = (DLV_W - 20) / 4; return { x: 10 + i * w + 3, y: dlvH - DLV_BAR + 8, w: w - 6, h: DLV_BAR - 16 }; };
const dlvIn = (p, r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

function dlvNewState() {
    return {
        running: false, started: false, paused: false, over: false, endT: 0, t: 0, playT: 0, last: 0,
        hearts: DLV_HEARTS, score: 0, delivered: 0, combo: 0, dist: 0, speed: 170,
        lane: 1, laneX: dlvLaneX(1), vx: 0, tilt: 0, bump: 0, hurtT: 0, shake: 0, flash: 0, puffs: [], puffIn: 0, press: [0, 0, 0, 0],
        obstacles: [], customers: [], throws: [], pickups: [], fx: [],
        obsIn: 1.6, custIn: 1.2, pickIn: 14, scroll: 0,
        down: null,
        pool: [], skin: 'classic',
        shownScore: -1, shownHearts: -1, shownCombo: '#'
    };
}

function dlvStop() {
    cancelAnimationFrame(dlvRaf);
    if (dlv) dlv.running = false;
}

function startDeliveryGame() {
    switchTab('delivery');                 // עוצר כל משחק אחר
    dlv = dlvNewState();
    dlv.pool = typeof kvSkinPool === 'function' ? kvSkinPool() : SV_SKINS.filter(s => s.kind !== 'cone');
    dlv.skin = getEquippedSkinId();
    dlvResize();
    dlvUpdateHud();
    dlv.running = true;
    dlv.last = performance.now();
    dlvRaf = requestAnimationFrame(dlvLoop);
}

function dlvResize() {
    const wrap = document.getElementById('delivery-wrap');
    const cv = document.getElementById('delivery-canvas');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    dlvH = Math.max(480, DLV_W * h / w);
    dlvPx = cv.width / DLV_W;
    dlvCtx = cv.getContext('2d');
    dlvCtx.setTransform(cv.width / DLV_W, 0, 0, cv.height / dlvH, 0, 0);
}
window.addEventListener('resize', () => { if (dlv && dlv.running) dlvResize(); });
// יציאה מהאפליקציה באמצע משחק - משהים עד שחוזרים ומקישים
document.addEventListener('visibilitychange', () => { if (document.hidden && dlv && dlv.running && dlv.started && !dlv.over) dlv.paused = true; });

/* ---------- ספרייט של דמות (לקוח / רוכב), נוצר פעם אחת לכל סקין וגודל ---------- */
function dlvSprite(skinId, s) {
    const k = s * dlvPx;
    const key = skinId + '|' + Math.round(k * 1000);
    if (dlvSprites[key]) return dlvSprites[key];
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.ceil(460 * k));
    cv.height = Math.max(1, Math.ceil(720 * k));
    const c = cv.getContext('2d');
    c.translate(230 * k, 350 * k);
    c.scale(k, k);
    const sk = skinById(skinId);
    const st = { x: 0, y: 0, hw: 44, ry: 12, chew: 0, t: 1.3, tx: 0, ty: 900, surprised: false, mx: 0, my: 0 };
    try {
        if (sk.kind === 'cone') { const saved = sv; sv = { mouth: { x: 0, y: 0, hw: 44, chew: 0 }, ball: null, t: 1.3, aim: null }; svDrawBody(c); svDrawMouthBack(c); svDrawLowerLip(c); sv = saved; }
        else { skDrawHumanBack(c, sk, st); skMouthBack(c, sk, st); skDrawHumanFront(c, sk, st); skMouthFront(c, sk, st); }
    } catch (e) { console.error('dlvSprite', skinId, e); }
    dlvSprites[key] = cv;
    return cv;
}
function dlvDrawSprite(c, skinId, s, x, y) {           // x,y = מרכז הראש בערך
    const sp = dlvSprite(skinId, s);
    const w = sp.width / dlvPx, h = sp.height / dlvPx;
    c.drawImage(sp, x - w / 2, y - h * (350 - 34) / 720 - 0, w, h);
}

/* ---------- יצירת מכשולים, לקוחות ולבבות ---------- */
function dlvSpawnObstacles() {
    const lanes = [0, 1, 2];
    const n = dlv.playT > 25 && Math.random() < 0.35 ? 2 : 1;     // אף פעם לא חוסמים את כל שלושת הנתיבים
    for (let i = 0; i < n; i++) {
        const lane = lanes.splice(Math.floor(Math.random() * lanes.length), 1)[0];
        const r = Math.random();
        const type = r < 0.55 ? 'car' : r < 0.8 ? 'hole' : 'cone';
        dlv.obstacles.push({
            type, lane, x: dlvLaneX(lane), y: -70 - i * 30,
            own: type === 'car' ? 40 + Math.random() * 60 : 0,      // מכונית נוסעת קדימה לאט יותר מאיתנו
            color: DLV_CAR_COLORS[Math.floor(Math.random() * DLV_CAR_COLORS.length)], hit: false
        });
    }
}
function dlvSpawnCustomer() {
    const side = Math.random() < 0.5 ? -1 : 1;
    if (dlv.customers.some(c => c.side === side && c.y < 90)) return;
    const pool = dlv.pool.length ? dlv.pool : [skinById('classic')];
    const sk = pool[Math.floor(Math.random() * pool.length)];
    dlv.customers.push({
        side, x: side < 0 ? 36 : DLV_W - 36, y: -60, skin: sk.id,
        want: Math.floor(Math.random() * DLV_ITEMS.length), vip: Math.random() < 0.1,
        state: 'wait', mood: 0, bob: Math.random() * 6
    });
}

/* ---------- מסירה: לחיצה על מנה שולחת אותה ללקוח שמחכה לה ---------- */
function dlvServe(item) {
    const py = dlvPlayerY();
    const waiting = dlv.customers.filter(c => c.state === 'wait' && c.y > 30 && c.y < py + 30);
    dlv.press[item] = 1;
    if (!waiting.length) {
        sfx.miss();
        dlv.fx.push({ x: DLV_W / 2, y: py - 70, text: 'אין לקוח בטווח', color: '#d9c4a8', size: 14, t: 0, life: 0.8 });
        return;
    }
    // קודם לקוח שמחכה בדיוק למנה הזאת (הקרוב ביותר לקטנוע); אם אין - הלקוח הקרוב ביותר יקבל מנה לא נכונה
    const near = (a, b) => Math.abs(a.y - py) - Math.abs(b.y - py);
    const match = waiting.filter(c => c.want === item).sort(near)[0];
    dlvThrow(item, match || waiting.sort(near)[0]);
}
function dlvThrow(item, target) {
    target.state = 'incoming';
    dlv.throws.push({ item, target, x0: dlv.laneX, y0: dlvPlayerY() - 20, t: 0, dur: 0.32 });
    sfx.whoosh();
}
function dlvArrive(th) {
    const c = th.target;
    if (th.item === c.want) {
        c.state = 'happy'; c.mood = 1;
        dlv.combo = Math.min(dlv.combo + 1, 5);
        dlv.delivered++;
        const pts = 10 * dlv.combo * (c.vip ? 2 : 1);
        dlv.score += pts;
        dlv.fx.push({ x: c.x, y: c.y - 46, text: '+' + pts + (c.vip ? ' ⭐' : ''), color: c.vip ? '#ffd23d' : '#7ee787', size: 20, t: 0, life: 1 });
        if (dlv.combo >= 2) dlv.fx.push({ x: DLV_W / 2, y: 120, text: '🔥 x' + dlv.combo, color: '#ff9a3d', size: 24, t: 0, life: 0.9 });
        sfx.score(dlv.combo >= 3);
        haptic(15);
    } else {
        c.state = 'angry'; c.mood = -1;
        dlv.combo = 0;
        dlv.fx.push({ x: c.x, y: c.y - 46, text: 'לא הזמנתי את זה! 😡', color: '#ff6a5c', size: 15, t: 0, life: 1.2 });
        dlvHurt();
    }
}
function dlvHurt() {
    dlv.hearts--;
    dlv.hurtT = 1.4;
    dlv.shake = 0.5;
    dlv.flash = 0.6;
    sfx.bomb();
    haptic([60, 40, 80]);
    if (dlv.hearts <= 0) dlvGameOver();
}
function dlvGameOver() {
    dlv.over = true;
    dlv.endT = 0;
    dlv.fx.push({ x: DLV_W / 2, y: dlvH / 2 - 40, text: 'המשלוח נגמר!', color: '#ffd23d', size: 30, t: 0, life: 2 });
}

/* ---------- עדכון ---------- */
function dlvStep(dt) {
    dlv.t += dt;
    if (dlv.paused) return;
    if (dlv.over) {
        dlv.endT += dt;
        dlv.speed = Math.max(0, dlv.speed - 400 * dt);
        if (dlv.endT > 1.6) { dlvEnd(); return; }
    }
    // מעבר נתיב עם קפיץ (קצת חורג וחוזר), נטייה לצד ותנודה קלה
    const tx = dlvLaneX(dlv.lane);
    for (let i = 0, n = 4; i < n; i++) {
        const h = dt / n;
        dlv.vx += ((tx - dlv.laneX) * 300 - dlv.vx * 25) * h;
        dlv.laneX += dlv.vx * h;
    }
    dlv.tilt = Math.max(-0.45, Math.min(0.45, dlv.vx * 0.0028));
    dlv.bump = Math.max(0, dlv.bump - dt * 3);
    dlv.press = dlv.press.map(v => Math.max(0, v - dt * 5));
    for (const pf of dlv.puffs) { pf.t += dt; pf.y += (dlv.speed * 0.55 + 30) * dt; pf.x += pf.vx * dt; }
    dlv.puffs = dlv.puffs.filter(pf => pf.t < 0.6);
    if (dlv.started && !dlv.over && !dlv.paused) {
        dlv.puffIn -= dt;
        if (dlv.puffIn <= 0) { dlv.puffs.push({ x: dlv.laneX + (Math.random() - 0.5) * 6, y: dlvPlayerY() + 70, vx: (Math.random() - 0.5) * 30, t: 0 }); dlv.puffIn = 0.07; }
    }
    dlv.hurtT = Math.max(0, dlv.hurtT - dt);
    dlv.shake = Math.max(0, dlv.shake - dt * 2);
    dlv.flash = Math.max(0, dlv.flash - dt * 2);

    if (!dlv.started) return;
    if (!dlv.over) {
        dlv.playT += dt;
        dlv.speed = Math.min(440, 170 + dlv.playT * 5);
        dlv.dist += dlv.speed * dt;
        const distPts = Math.floor(dlv.dist / 400);
        if (distPts > (dlv.distPts || 0)) { dlv.score += distPts - (dlv.distPts || 0); dlv.distPts = distPts; }
    }
    const v = dlv.speed;
    dlv.scroll += v * dt;

    if (!dlv.over) {
        dlv.obsIn -= dt;
        if (dlv.obsIn <= 0) { dlvSpawnObstacles(); dlv.obsIn = Math.max(0.6, 1.7 - dlv.playT * 0.02) * (0.75 + Math.random() * 0.5); }
        dlv.custIn -= dt;
        if (dlv.custIn <= 0) { dlvSpawnCustomer(); dlv.custIn = Math.max(1.5, 3.4 - dlv.playT * 0.025) * (0.8 + Math.random() * 0.4); }
        dlv.pickIn -= dt;
        if (dlv.pickIn <= 0) {
            if (dlv.hearts < DLV_HEARTS) dlv.pickups.push({ lane: Math.floor(Math.random() * 3), y: -40, got: false });
            dlv.pickIn = 16 + Math.random() * 10;
        }
    }

    const py = dlvPlayerY();
    for (const o of dlv.obstacles) {
        o.y += (v - o.own) * dt;
        if (!o.hit && !dlv.over && dlv.hurtT <= 0) {
            const halfH = o.type === 'car' ? 34 : 16;
            if (Math.abs(o.x - dlv.laneX) < DLV_LANE_W * 0.55 && Math.abs(o.y - py) < halfH + 22) {
                o.hit = true;
                dlv.combo = 0;
                dlv.fx.push({ x: dlv.laneX, y: py - 50, text: o.type === 'hole' ? 'בור! 💥' : 'בום! 💥', color: '#ff6a5c', size: 20, t: 0, life: 0.9 });
                dlvHurt();
            }
        }
    }
    dlv.obstacles = dlv.obstacles.filter(o => o.y < dlvH + 80);

    for (const p of dlv.pickups) {
        p.y += v * dt;
        if (!p.got && Math.abs(dlvLaneX(p.lane) - dlv.laneX) < DLV_LANE_W * 0.5 && Math.abs(p.y - py) < 30) {
            p.got = true;
            dlv.hearts = Math.min(DLV_HEARTS, dlv.hearts + 1);
            dlv.fx.push({ x: dlv.laneX, y: py - 50, text: '+❤️', color: '#ff7a8a', size: 22, t: 0, life: 0.9 });
            sfx.good();
        }
    }
    dlv.pickups = dlv.pickups.filter(p => !p.got && p.y < dlvH + 40);

    for (const c of dlv.customers) {
        c.y += v * dt;
        if (c.state === 'wait' && c.y > dlvH - DLV_BAR + 10) {
            c.state = 'missed';
            if (!dlv.over) {
                dlv.combo = 0;
                dlv.fx.push({ x: c.x, y: dlvH - DLV_BAR - 30, text: 'פספסת לקוח 😕', color: '#ffb36b', size: 13, t: 0, life: 1 });
            }
        }
    }
    dlv.customers = dlv.customers.filter(c => c.y < dlvH + 80);

    for (const th of dlv.throws) {
        th.t += dt;
        if (th.t >= th.dur && !th.done) { th.done = true; dlvArrive(th); }
    }
    dlv.throws = dlv.throws.filter(th => !th.done);

    for (const f of dlv.fx) { f.t += dt; f.y -= 30 * dt; }
    dlv.fx = dlv.fx.filter(f => f.t < f.life);
}

function dlvUpdateHud() {
    if (dlv.score !== dlv.shownScore) { dlv.shownScore = dlv.score; document.getElementById('dlv-score').textContent = dlv.score; }
    if (dlv.hearts !== dlv.shownHearts) {
        dlv.shownHearts = dlv.hearts;
        document.getElementById('dlv-hearts').textContent = '❤️'.repeat(Math.max(0, dlv.hearts)) + '🤍'.repeat(Math.max(0, DLV_HEARTS - dlv.hearts));
    }
    const combo = dlv.combo >= 2 ? ('🔥 x' + dlv.combo) : '';
    if (combo !== dlv.shownCombo) { dlv.shownCombo = combo; document.getElementById('dlv-combo').textContent = combo; }
}

function dlvEnd() {
    if (!dlv || !dlv.running) return;
    dlv.running = false;
    cancelAnimationFrame(dlvRaf);
    saveBestScore('leaderboard_delivery', dlv.score, 'kebab_dlvHighScore');
    const d = dlv.delivered;
    document.getElementById('result-desc').textContent =
        (d === 0 ? 'לא הספקתם למסור אף מנה' : d === 1 ? 'מסרתם מנה אחת' : `מסרתם ${d} מנות`) + ` וצברתם ${dlv.score} נקודות!`;
    dailyEvent('delivery', { score: dlv.score, delivered: d });
    showResultReward('delivery', dlv.score);
    switchTab('result');
}

function dlvLoop(ts) {
    if (!dlv || !dlv.running) return;
    const dt = Math.min(0.05, (ts - dlv.last) / 1000 || 0.016);
    dlv.last = ts;
    dlvStep(dt);
    if (dlv && dlv.running) {
        dlvUpdateHud();
        dlvDraw();
        dlvRaf = requestAnimationFrame(dlvLoop);
    }
}

/* ---------- ציור ---------- */
function dlvDrawCar(c, o) {
    c.save(); c.translate(o.x, o.y);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(4, 6, 27, 40, 0, 0, Math.PI * 2); c.fill();
    skR(c, -24, -38, 48, 76, 12, o.color, SK_OUT, 2.5);
    skR(c, -18, -24, 36, 18, 5, '#bfe3ff', SK_OUT, 1.5);                 // שמשה קדמית
    skR(c, -18, 16, 36, 12, 4, '#9cc8ea', SK_OUT, 1.5);                  // שמשה אחורית
    skR(c, -16, -4, 32, 18, 3, skShade(o.color, -0.15));                 // גג
    for (const s of [-1, 1]) { skE(c, s * 15, 36, 5, 3, '#ff3b2f'); skE(c, s * 15, -36, 5, 3, '#fff3b0'); }
    c.restore();
}
function dlvDraw() {
    const c = dlvCtx;
    if (!c) return;
    const H = dlvH, t = dlv.t, sc = dlv.scroll;
    c.save();
    if (dlv.shake > 0) c.translate((Math.random() - 0.5) * 10 * dlv.shake, (Math.random() - 0.5) * 10 * dlv.shake);

    // מדרכות ובתים
    c.fillStyle = '#d8c7a6'; c.fillRect(0, 0, DLV_ROAD_L, H); c.fillRect(DLV_ROAD_R, 0, DLV_W - DLV_ROAD_R, H);
    c.strokeStyle = 'rgba(120,95,60,0.35)'; c.lineWidth = 1.5;
    for (let y = (sc % 40) - 40; y < H; y += 40) {
        c.beginPath(); c.moveTo(0, y); c.lineTo(DLV_ROAD_L, y); c.moveTo(DLV_ROAD_R, y); c.lineTo(DLV_W, y); c.stroke();
    }
    const houseCols = ['#e07a5f', '#81b29a', '#f2cc8f', '#8ecae6', '#cdb4db', '#ffb703'];
    for (let i = -1; i < H / 120 + 2; i++) {
        const k = Math.floor(sc / 120) - i;
        const y = (sc % 120) + i * 120 - 120;
        for (const side of [-1, 1]) {
            const col = houseCols[((k * 7 + (side > 0 ? 3 : 0)) % houseCols.length + houseCols.length) % houseCols.length];
            const x = side < 0 ? 0 : DLV_W - 16;
            c.fillStyle = col; c.fillRect(x, y + 6, 16, 108);
            c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(side < 0 ? 12 : DLV_W - 16, y + 6, 4, 108);
            c.fillStyle = '#6b3a1e'; c.fillRect(side < 0 ? 2 : DLV_W - 14, y + 48, 10, 26);           // דלת
        }
    }
    // כביש
    c.fillStyle = '#3a3a42'; c.fillRect(DLV_ROAD_L, 0, DLV_ROAD_R - DLV_ROAD_L, H);
    c.fillStyle = '#f4f4f7'; c.fillRect(DLV_ROAD_L, 0, 4, H); c.fillRect(DLV_ROAD_R - 4, 0, 4, H);
    c.fillStyle = 'rgba(255,255,255,0.75)';
    for (const lx of [DLV_ROAD_L + DLV_LANE_W, DLV_ROAD_L + DLV_LANE_W * 2])
        for (let y = (sc % 60) - 60; y < H; y += 60) c.fillRect(lx - 2, y, 4, 32);

    // לבבות על הכביש
    for (const p of dlv.pickups) {
        c.save(); c.translate(dlvLaneX(p.lane), p.y); c.scale(1 + 0.08 * Math.sin(t * 6), 1 + 0.08 * Math.sin(t * 6));
        skGlow(c, 0, 0, 30, '#ff5a7a', 0.5);
        drawEmoji(c, '❤️', 28);
        c.restore();
    }
    // מכשולים
    for (const o of dlv.obstacles) {
        if (o.type === 'car') dlvDrawCar(c, o);
        else if (o.type === 'hole') {
            skE(c, o.x, o.y, 26, 14, '#1c1c22', '#55555f', 3);
            skE(c, o.x - 6, o.y - 3, 12, 5, 'rgba(255,255,255,0.08)');
        } else {
            c.save(); c.translate(o.x, o.y); drawEmoji(c, '🚧', 34); c.restore();
        }
    }
    // לקוחות על המדרכה
    for (const cu of dlv.customers) {
        const by = cu.y + Math.sin(t * 4 + cu.bob) * (cu.state === 'happy' ? 4 : 1.5);
        if (cu.vip && cu.state === 'wait') skGlow(c, cu.x, by - 10, 40, '#ffd23d', 0.55 + 0.25 * Math.sin(t * 5));
        dlvDrawSprite(c, cu.skin, 0.11, cu.x, by - 14);
        if (cu.state === 'wait' || cu.state === 'incoming') {
            const bx = cu.x + (cu.side < 0 ? 22 : -22), byy = by - 62;
            const pulse = cu.y > dlvPlayerY() - 120 ? 1 + 0.08 * Math.sin(t * 12) : 1;
            c.save(); c.translate(bx, byy); c.scale(pulse, pulse);
            skR(c, -21, -18, 42, 36, 12, '#ffffff', cu.vip ? '#d9a514' : SK_OUT, cu.vip ? 3 : 2);
            skP(c, [[cu.side < 0 ? -12 : 4, 16], [cu.side < 0 ? -4 : 12, 16], [cu.side < 0 ? -18 : 18, 26]], '#ffffff', null, 0);
            drawEmoji(c, DLV_ITEMS[cu.want].emoji, 22);
            if (cu.vip) { c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText('⭐', 16, -14); }
            c.restore();
        } else if (cu.state === 'happy' || cu.state === 'angry') {
            c.save(); c.translate(cu.x, by - 62); drawEmoji(c, cu.state === 'happy' ? '😋' : '😡', 24); c.restore();
        }
    }
    // השליח על הקטנוע
    const py = dlvPlayerY();
    for (const pf of dlv.puffs) {                                         // עשן מהאגזוז
        const k = pf.t / 0.6;
        skE(c, pf.x, pf.y, 4 + k * 9, 4 + k * 9, 'rgba(220,220,230,' + (0.45 * (1 - k)) + ')');
    }
    const blink = dlv.hurtT > 0 && Math.floor(t * 12) % 2 === 0;
    if (!blink) {
        const bob = Math.sin(dlv.scroll * 0.045) * 1.2 - dlv.bump * 4;
        const steer = Math.max(-0.5, Math.min(0.5, dlv.vx * 0.004));
        const spin = (dlv.scroll * 0.5) % 7;
        const wheel = (wy, rot) => {                                      // גלגל עם חריצים שזזים = מסתובב
            c.save(); c.translate(0, wy); c.rotate(rot);
            skR(c, -8, -15, 16, 30, 7, '#16161c', SK_OUT, 2);
            c.save(); c.beginPath(); c.roundRect ? c.roundRect(-7, -14, 14, 28, 6) : c.rect(-7, -14, 14, 28); c.clip();
            c.fillStyle = '#4a4a56';
            for (let y = -21 + spin; y < 16; y += 7) c.fillRect(-7, y, 14, 2.5);
            c.restore();
            skR(c, -2.5, -9, 5, 18, 2.5, '#b8bfcc');                       // חישוק
            c.restore();
        };
        c.save(); c.translate(dlv.laneX, py + bob); c.rotate(dlv.tilt); c.scale(1.25, 1.25);
        c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(5, 8, 24, 52, 0, 0, Math.PI * 2); c.fill();
        wheel(46, 0);                                                     // גלגל אחורי
        wheel(-42, steer);                                                // גלגל קדמי שמסתובב לכיוון הפנייה
        skR(c, -14, -30, 28, 56, 12, '#d6291f', SK_OUT, 2.5);             // גוף הקטנוע
        skR(c, -9, -16, 18, 10, 4, 'rgba(255,255,255,0.25)');
        c.save(); c.translate(0, -30); c.rotate(steer);                   // כידון
        c.strokeStyle = SK_OUT; c.lineWidth = 6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(-17, 0); c.lineTo(17, 0); c.stroke();
        c.strokeStyle = '#b8bfcc'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(-17, 0); c.lineTo(17, 0); c.stroke();
        skE(c, -18, 0, 4, 4, '#1c1c22'); skE(c, 18, 0, 4, 4, '#1c1c22');
        c.restore();
        skGlow(c, 0, -62, 24, '#fff3b0', 0.45);                           // פנס
        skE(c, 0, -57, 5, 3, '#fff3b0', SK_OUT, 1.5);
        skR(c, -20, 14, 40, 28, 6, '#ffd23d', SK_OUT, 2.5);               // ארגז משלוחים
        c.fillStyle = '#7a3a08'; c.font = 'bold 11px "Secular One", Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('קבב', 0, 28);
        c.restore();
        // קווי מהירות בצדדים
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
        const sp = Math.min(1, dlv.speed / 440);
        for (let i = 0; i < 4; i++) {
            const yy = ((dlv.scroll * 1.4 + i * 37) % 120) + py - 40, side = i % 2 ? 1 : -1;
            c.beginPath(); c.moveTo(dlv.laneX + side * 34, yy); c.lineTo(dlv.laneX + side * 34, yy + 10 + sp * 18); c.stroke();
        }
        dlvDrawSprite(c, dlv.skin, 0.1, dlv.laneX + dlv.tilt * 14, py - 22 + bob);
    }
    // מנות באוויר
    for (const th of dlv.throws) {
        const k = Math.min(1, th.t / th.dur), tg = th.target;
        const x = th.x0 + (tg.x - th.x0) * k, y = th.y0 + (tg.y - 30 - th.y0) * k - Math.sin(k * Math.PI) * 60;
        c.save(); c.translate(x, y); c.rotate(k * 8); drawEmoji(c, DLV_ITEMS[th.item].emoji, 24); c.restore();
    }
    // טקסטים צפים
    for (const f of dlv.fx) {
        c.globalAlpha = Math.max(0, 1 - f.t / f.life);
        c.font = 'bold ' + f.size + 'px "Secular One", Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.direction = /[\u0590-\u05FF]/.test(f.text) ? 'rtl' : 'ltr';         // מספרים כמו "+50" משמאל לימין
        c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.strokeText(f.text, f.x, f.y);
        c.fillStyle = f.color; c.fillText(f.text, f.x, f.y);
        c.globalAlpha = 1;
    }
    c.direction = 'inherit';
    if (dlv.flash > 0) { c.fillStyle = 'rgba(255,40,40,' + dlv.flash * 0.35 + ')'; c.fillRect(0, 0, DLV_W, H); }
    c.restore();

    // סרגל המנות
    c.fillStyle = '#1a0f09'; c.fillRect(0, H - DLV_BAR, DLV_W, DLV_BAR);
    c.fillStyle = 'rgba(255,194,51,0.4)'; c.fillRect(0, H - DLV_BAR, DLV_W, 2);
    DLV_ITEMS.forEach((it, i) => {
        const r = dlvBtnRect(i), pr = dlv.press[i], on = pr > 0.05;
        c.save(); c.translate(r.x + r.w / 2, r.y + r.h / 2); c.scale(1 - pr * 0.1, 1 - pr * 0.1); c.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
        skR(c, r.x, r.y, r.w, r.h, 14, on ? '#ffc233' : '#2e1d14', on ? '#fff3b0' : '#5a3a2a', on ? 3 : 2);
        c.save(); c.translate(r.x + r.w / 2, r.y + r.h / 2 - 7); drawEmoji(c, it.emoji, 30); c.restore();
        c.fillStyle = on ? '#2a1204' : '#d9c4a8'; c.font = 'bold 11px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(it.name, r.x + r.w / 2, r.y + r.h - 9);
        c.restore();
    });

    // הוראות לפני ההתחלה / השהיה
    if (!dlv.started || dlv.paused) {
        c.fillStyle = 'rgba(10,5,2,0.72)'; c.fillRect(0, 0, DLV_W, H - DLV_BAR);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = '#ffd23d'; c.font = '26px "Secular One", Rubik, sans-serif';
        c.fillText(dlv.paused ? '⏸ המשחק מושהה' : '🛵 שליח הקבבים', DLV_W / 2, H * 0.24);
        c.fillStyle = '#f3e3cf'; c.font = '15px Rubik, sans-serif';
        const lines = dlv.paused ? ['הקישו כדי להמשיך'] : [
            '👈 החליקו או הקישו ימינה ושמאלה 👉', 'כדי לעבור נתיב ולהתחמק ממכוניות ובורות',
            '', 'לחצו בסרגל למטה על המנה', 'שהלקוח על המדרכה ביקש - והיא תעוף אליו',
            '', '❤️ טעות במנה או התנגשות = מאבדים לב', '', 'הקישו כדי להתחיל'];
        lines.forEach((l, i) => c.fillText(l, DLV_W / 2, H * 0.34 + i * 24));
    }
}

/* ---------- קלט ---------- */
(function dlvBindInput() {
    const cv = document.getElementById('delivery-canvas');
    if (!cv) return;
    const pt = e => {
        const r = cv.getBoundingClientRect();
        return { x: (e.clientX - r.left) / r.width * DLV_W, y: (e.clientY - r.top) / r.height * dlvH };
    };
    const moveLane = d => {
        const n = Math.max(0, Math.min(2, dlv.lane + d));
        if (n !== dlv.lane) { dlv.lane = n; dlv.bump = 1; sfx.whoosh(); haptic(8); }
    };
    cv.addEventListener('pointerdown', e => {
        if (!dlv || !dlv.running || dlv.over) return;
        e.preventDefault();
        if (!dlv.started) { dlv.started = true; return; }
        if (dlv.paused) { dlv.paused = false; dlv.last = performance.now(); return; }
        const p = pt(e);
        const btn = DLV_ITEMS.findIndex((it, i) => dlvIn(p, dlvBtnRect(i)));
        if (btn >= 0) { dlvServe(btn); return; }           // לחיצה על מנה = משלוח
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        dlv.down = { x: p.x, y: p.y, x0: p.x, swiped: false };
    });
    // החלקה רגישה: מעבר נתיב כבר בזמן התנועה (בלי לחכות שהאצבע תעזוב).
    // כל החלקה מזיזה נתיב אחד בלבד - כדי שאפשר יהיה לעצור בנתיב האמצעי; החלקה חזרה לכיוון השני באותה תנועה מחזירה נתיב
    cv.addEventListener('pointermove', e => {
        if (!dlv || !dlv.down || dlv.over) return;
        const p = pt(e), d = dlv.down;
        const dx = p.x - d.x, dy = p.y - d.y;
        if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 0.7) {
            const dir = dx > 0 ? 1 : -1;
            if (dir !== d.dir) { moveLane(dir); d.dir = dir; d.swiped = true; }
            d.x = p.x; d.y = p.y;
        }
    });
    cv.addEventListener('pointerup', e => {
        if (!dlv || !dlv.running || dlv.over) return;
        const d = dlv.down;
        dlv.down = null;
        if (!d || d.swiped) return;
        // הקשה: מעבר נתיב לכיוון ההקשה
        if (d.x0 < dlv.laneX - 10) moveLane(-1); else if (d.x0 > dlv.laneX + 10) moveLane(1);
    });
    cv.addEventListener('pointercancel', () => { if (dlv) dlv.down = null; });
})();

function loadDeliveryLeaderboard() {
    loadLeaderboardInto('delivery-leaderboard-container', 'leaderboard_delivery');
}

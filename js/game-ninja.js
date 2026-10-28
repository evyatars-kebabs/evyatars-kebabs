/* ============================================================
   משחק: קבב נינג'ה  (בסגנון Fruit Ninja)
   חותכים בהחלקת אצבע את האוכל שעף באוויר, ולא נוגעים בפצצות!
   ============================================================ */
const NJ_W = 360, NJ_H = 540;
const NJ_G = 900;
const NJ_SECONDS = 45;
const NJ_FOODS = ['🍢', '🍢', '🍢', '🥙', '🥩', '🍅', '🧅', '🌶️', '🥒', '🍆', '🥓'];
const NJ_JUICE = {
    '🍢': '#e0793a', '🥙': '#e9c46a', '🥩': '#b8322a', '🍅': '#e63946', '🧅': '#f1e3c4',
    '🌶️': '#d62828', '🥒': '#6abf4b', '🍆': '#7b4fb5', '🥓': '#d96b5b'
};

let nj = null;
let njRaf = 0;
let njCtx = null;

function njNewState() {
    return {
        running: false, time: NJ_SECONDS, score: 0, sliced: 0, t: 0, last: 0,
        spawnIn: 0.5, items: [], halves: [], drops: [], trail: [], fx: [], mfx: [],
        cos: typeof mstCos === 'function' ? mstCos('ninja') : 0,     // מראה הלהב מדרגת השליטה (זהב / קרח / קשת)
        flash: 0, shake: 0, strokeSlices: 0, comboT: 0, aim: false, lastPt: null,
        shownTime: -1, shownScore: -1, shownCombo: '#', started: false, playT: 0
    };
}

function njStop() {
    cancelAnimationFrame(njRaf);
    if (nj) nj.running = false;
}

function startNinjaGame() {
    switchTab('ninja');                  // עוצר כל משחק אחר
    nj = njNewState();
    njResize();
    njUpdateHud();
    nj.running = true;
    nj.last = performance.now();
    njRaf = requestAnimationFrame(njLoop);
}

function njResize() {
    const wrap = document.getElementById('ninja-wrap');
    const cv = document.getElementById('ninja-canvas');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    const scale = Math.min(w / NJ_W, h / NJ_H);
    const cssW = Math.floor(NJ_W * scale), cssH = Math.floor(NJ_H * scale);
    cv.style.width = cssW + 'px';
    cv.style.height = cssH + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(cssH * dpr);
    njCtx = cv.getContext('2d');
    njCtx.setTransform(cv.width / NJ_W, 0, 0, cv.height / NJ_H, 0, 0);
}
window.addEventListener('resize', () => { if (nj && nj.running) njResize(); });

/* ---------- זריקת אוכל ---------- */
function njSpawn() {
    const diff = Math.min(1, nj.t / 35);
    const n = 1 + Math.floor(Math.random() * (1.6 + diff * 2));
    for (let i = 0; i < n; i++) {
        const bomb = nj.t > 4 && Math.random() < 0.11 + 0.12 * diff;
        const x = 50 + Math.random() * (NJ_W - 100);
        const h = 270 + Math.random() * 190;
        nj.items.push({
            x, y: NJ_H + 30 + i * 18,
            vx: (NJ_W / 2 - x) * 0.35 + (Math.random() - 0.5) * 90,
            vy: -Math.sqrt(2 * NJ_G * h),
            rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6,
            r: 32, bomb,
            emoji: bomb ? '💣' : NJ_FOODS[Math.floor(Math.random() * NJ_FOODS.length)],
            golden: !bomb && Math.random() < 0.06
        });
    }
    nj.spawnIn = Math.max(0.55, 1.25 - diff * 0.55) + Math.random() * 0.35;
}

/* ---------- חיתוך ---------- */
function njSegDist(px, py, x0, y0, x1, y1) {
    const dx = x1 - x0, dy = y1 - y0;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? ((px - x0) * dx + (py - y0) * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
}

function njSlice(x0, y0, x1, y1) {
    if (Math.hypot(x1 - x0, y1 - y0) < 2) return;
    const ang = Math.atan2(y1 - y0, x1 - x0);
    for (const it of nj.items.slice()) {
        if (it.sliced) continue;
        if (njSegDist(it.x, it.y, x0, y0, x1, y1) <= it.r) njCut(it, ang);
    }
}

function njBurst(x, y, color, n, speed) {
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = (0.3 + Math.random()) * speed;
        nj.drops.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 60, r: 2 + Math.random() * 3.5, color, life: 0.7 + Math.random() * 0.5, t: 0 });
    }
}

function njCut(it, ang) {
    it.sliced = true;
    nj.items.splice(nj.items.indexOf(it), 1);

    if (it.bomb) {
        nj.score = Math.max(0, nj.score - 10);
        sfx.bomb();
        nj.flash = 1;
        nj.shake = 0.6;
        nj.strokeSlices = 0;
        njBurst(it.x, it.y, '#ff9f1c', 26, 380);
        njBurst(it.x, it.y, '#ffd33d', 16, 260);
        nj.fx.push({ x: it.x, y: it.y - 20, text: '💥 -10', color: '#ff5252', size: 28, t: 0, life: 1 });
        try { if (navigator.vibrate) navigator.vibrate([40, 30, 60]); } catch (e) { /* ignore */ }
        return;
    }

    nj.strokeSlices++;
    nj.comboT = 0.35;
    nj.sliced++;
    sfx.slice(nj.strokeSlices);
    const pts = (it.golden ? 5 : 1) + Math.max(0, nj.strokeSlices - 1);
    nj.score += pts;

    const local = ang - it.rot;
    const nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
    for (const side of [-1, 1]) {
        nj.halves.push({
            x: it.x, y: it.y, vx: it.vx + nx * side * 130, vy: it.vy + ny * side * 130 - 40,
            rot: it.rot, vr: it.vr + side * 3.2, emoji: it.emoji, clip: local, side, golden: it.golden, t: 0
        });
    }
    njBurst(it.x, it.y, NJ_JUICE[it.emoji] || '#e9c46a', it.golden ? 18 : 11, 240);
    nj.fx.push({ x: it.x, y: it.y - 24, text: '+' + pts, color: it.golden ? '#ffd700' : '#ffffff', size: it.golden ? 30 : 22, t: 0, life: 0.8 });
    // כל חיתוך מוסיף קצת זמן (0.3-0.5 שניות)
    const bonus = 0.3 + Math.random() * 0.2;
    nj.time += bonus;
    nj.fx.push({ x: it.x, y: it.y + 6, text: '+' + bonus.toFixed(1) + 's ⏱', color: '#7ee08a', size: 14, t: 0, life: 0.7 });
    if (nj.strokeSlices >= 3) {
        nj.fx.push({ x: NJ_W / 2, y: 120, text: 'קומבו x' + nj.strokeSlices + '!', color: '#ff9f1c', size: 26, t: 0, life: 0.9 });
    }
    try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) { /* ignore */ }
}

/* ---------- לוגיקה ---------- */
function njStep(dt) {
    nj.t += dt;
    if (nj.started) {                         // הטיימר והאוכל מתחילים בנגיעה הראשונה
        nj.playT += dt;
        nj.time -= dt;
        if (nj.time <= 0) { nj.time = 0; njEnd(); return; }

        nj.spawnIn -= dt;
        if (nj.spawnIn <= 0) njSpawn();
    }

    for (const it of nj.items) {
        it.vy += NJ_G * dt;
        it.x += it.vx * dt;
        it.y += it.vy * dt;
        it.rot += it.vr * dt;
    }
    nj.items = nj.items.filter(it => !(it.y > NJ_H + 70 && it.vy > 0));

    for (const h of nj.halves) {
        h.vy += NJ_G * dt;
        h.x += h.vx * dt;
        h.y += h.vy * dt;
        h.rot += h.vr * dt;
        h.t += dt;
    }
    nj.halves = nj.halves.filter(h => h.y < NJ_H + 80);

    for (const d of nj.drops) {
        d.vy += 700 * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.t += dt;
    }
    nj.drops = nj.drops.filter(d => d.t < d.life);

    for (const p of nj.trail) p.t += dt;
    nj.trail = nj.trail.filter(p => p.t < 0.22);

    for (const f of nj.fx) f.t += dt;
    nj.fx = nj.fx.filter(f => f.t < f.life);

    nj.comboT -= dt;
    if (nj.comboT <= 0) nj.strokeSlices = 0;
    nj.flash = Math.max(0, nj.flash - dt * 2.2);
    nj.shake = Math.max(0, nj.shake - dt * 2);

    njUpdateHud();
}

function njUpdateHud() {
    const t = Math.ceil(nj.time);
    if (t !== nj.shownTime) { nj.shownTime = t; document.getElementById('nj-timer').textContent = t; }
    if (nj.score !== nj.shownScore) { nj.shownScore = nj.score; document.getElementById('nj-score').textContent = nj.score; }
    const combo = nj.strokeSlices >= 2 ? ('🔥 x' + nj.strokeSlices) : '';
    if (combo !== nj.shownCombo) { nj.shownCombo = combo; document.getElementById('nj-combo').textContent = combo; }
}

function njEnd() {
    if (!nj.running) return;
    nj.running = false;
    cancelAnimationFrame(njRaf);
    saveBestScore('leaderboard_ninja', nj.score, 'kebab_ninjaHighScore');
    document.getElementById('result-desc').textContent =
        `חתכתם ${nj.sliced} חלקי אוכל וצברתם ${nj.score} נקודות!`;
    dailyEvent('ninja', { score: nj.score, sliced: nj.sliced });
    showResultReward('ninja', nj.score);
    switchTab('result');
}

function njLoop(ts) {
    if (!nj || !nj.running) return;
    const dt = Math.min(0.033, (ts - nj.last) / 1000 || 0.016);
    nj.last = ts;
    njStep(dt);
    if (nj && nj.running) {
        njDraw();
        njRaf = requestAnimationFrame(njLoop);
    }
}

/* ---------- ציור ---------- */
function njDraw() {
    const c = njCtx;
    if (!c || !nj) return;
    c.save();
    if (nj.shake > 0) c.translate((Math.random() - 0.5) * nj.shake * 16, (Math.random() - 0.5) * nj.shake * 16);

    const bg = c.createLinearGradient(0, 0, 0, NJ_H);
    bg.addColorStop(0, '#150b07');
    bg.addColorStop(1, '#341a0d');
    c.fillStyle = bg;
    c.fillRect(-20, -20, NJ_W + 40, NJ_H + 40);
    // "קרשי עץ" עדינים ברקע
    c.strokeStyle = 'rgba(255, 190, 120, 0.05)';
    c.lineWidth = 2;
    for (let y = 40; y < NJ_H; y += 56) { c.beginPath(); c.moveTo(0, y); c.lineTo(NJ_W, y + 8); c.stroke(); }

    c.textAlign = 'center';
    c.textBaseline = 'middle';

    // חצאים חתוכים
    for (const h of nj.halves) {
        c.save();
        c.globalAlpha = Math.max(0, 1 - h.t * 0.5);
        c.translate(h.x, h.y);
        c.rotate(h.rot);
        c.save();
        c.rotate(h.clip);
        c.beginPath();
        c.rect(-80, h.side > 0 ? 0 : -80, 160, 80);
        c.clip();
        c.rotate(-h.clip);
        if (h.golden) { c.shadowColor = '#ffd700'; c.shadowBlur = 16; }
        drawEmoji(c, h.emoji, 66, NJ_JUICE[h.emoji], 3);
        c.restore();
        c.restore();
    }

    // פריטים
    for (const it of nj.items) {
        c.save();
        c.translate(it.x, it.y);
        if (it.bomb) {
            const p = 0.6 + 0.4 * Math.sin(nj.t * 10);
            skGlow(c, 0, 0, 62, '#ff3030', 0.55 * p);
        } else if (it.golden) {
            skGlow(c, 0, 0, 66, '#ffd700', 0.75);
        }
        c.rotate(it.rot);
        drawEmoji(c, it.emoji, 66, it.bomb ? '#3a3a44' : NJ_JUICE[it.emoji], 3);
        c.restore();
    }

    // התזות
    for (const d of nj.drops) {
        c.globalAlpha = Math.max(0, 1 - d.t / d.life);
        c.fillStyle = d.color;
        c.beginPath();
        c.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        c.fill();
    }
    c.globalAlpha = 1;

    // להב
    if (nj.trail.length > 1) {
        for (let i = 1; i < nj.trail.length; i++) {
            const a = nj.trail[i - 1], b = nj.trail[i];
            const life = 1 - b.t / 0.22;
            c.lineCap = 'round';
            c.strokeStyle = nj.cos === 3 ? 'rgba(255, 196, 30, ' + (0.7 * life) + ')'
                : nj.cos === 4 ? 'rgba(100, 200, 255, ' + (0.65 * life) + ')'
                : nj.cos === 5 ? 'hsla(' + Math.round((i * 16 + nj.t * 300) % 360) + ', 100%, 60%, ' + (0.8 * life) + ')'
                : 'rgba(255, 190, 80, ' + (0.5 * life) + ')';
            c.lineWidth = (nj.cos ? 17 : 14) * life + 2;
            c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
            c.strokeStyle = nj.cos === 3 ? 'rgba(255, 248, 200, ' + (0.95 * life) + ')'
                : nj.cos === 4 ? 'rgba(235, 250, 255, ' + (0.95 * life) + ')'
                : 'rgba(255, 255, 255, ' + (0.95 * life) + ')';
            c.lineWidth = 6 * life + 1;
            c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
        }
        // להב קרח וקשת: ניצוצות שנופלים מקצה הלהב
        const tip = nj.trail[nj.trail.length - 1];
        if (nj.cos >= 4 && tip.t < 0.05 && Math.random() < 0.6)
            mstFx.burst(nj.mfx, tip.x, tip.y, 2, nj.cos === 4 ? MST_SPARK : ['#ff5ad1', '#ffd23d', '#5affc8', '#6aa8ff'], 90, 0.5, 300);
    }
    if (nj.mfx.length) mstFx.draw(c, nj.mfx);

    // טקסטים צפים
    for (const f of nj.fx) {
        const p = f.t / f.life;
        c.globalAlpha = 1 - p * p;
        c.fillStyle = f.color;
        c.font = 'bold ' + f.size + 'px Rubik, sans-serif';
        c.fillText(f.text, f.x, f.y - p * 40);
    }
    c.globalAlpha = 1;

    // הדרכה בהתחלה
    if (!nj.started || nj.playT < 1) {
        c.globalAlpha = nj.started ? 1 - nj.playT : 1;
        c.fillStyle = 'rgba(1, 4, 9, 0.72)';
        c.fillRect(20, 250, NJ_W - 40, 52);
        c.fillStyle = '#f0f6fc';
        c.font = 'bold 15px Rubik, sans-serif';
        c.fillText('החליקו כדי לחתוך את האוכל', NJ_W / 2, 268);
        c.fillText('ותתרחקו מהפצצות 💣', NJ_W / 2, 288);
        c.globalAlpha = 1;
    }

    c.restore();

    if (nj.flash > 0) {
        c.fillStyle = 'rgba(255, 40, 40, ' + (nj.flash * 0.35) + ')';
        c.fillRect(0, 0, NJ_W, NJ_H);
    }
}

/* ---------- קלט ---------- */
(function njBindInput() {
    const cv = document.getElementById('ninja-canvas');
    if (!cv) return;
    const pt = e => {
        const r = cv.getBoundingClientRect();
        return { x: (e.clientX - r.left) / r.width * NJ_W, y: (e.clientY - r.top) / r.height * NJ_H };
    };
    const addTrail = p => { nj.trail.push({ x: p.x, y: p.y, t: 0 }); if (nj.trail.length > 24) nj.trail.shift(); };

    cv.addEventListener('pointerdown', e => {
        if (!nj || !nj.running) return;
        nj.started = true;
        const p = pt(e);
        nj.aim = true;
        nj.lastPt = p;
        nj.trail.length = 0;
        addTrail(p);
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        e.preventDefault();
    });
    cv.addEventListener('pointermove', e => {
        if (!nj || !nj.running || !nj.aim) return;
        // מעבדים גם את כל הנקודות המאוחדות כדי לא לפספס חיתוך בהחלקה מהירה
        const evs = (e.getCoalescedEvents && e.getCoalescedEvents().length) ? e.getCoalescedEvents() : [e];
        for (const ev of evs) {
            const p = pt(ev);
            njSlice(nj.lastPt.x, nj.lastPt.y, p.x, p.y);
            addTrail(p);
            nj.lastPt = p;
        }
        e.preventDefault();
    });
    const end = () => { if (nj) nj.aim = false; };
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
})();

function loadNinjaLeaderboard() {
    loadLeaderboardInto('ninja-leaderboard-container', 'leaderboard_ninja');
}


/* ============================================================
   משחק לזמן מוגבל: אתגר צבי הנינג'ה (חלק מהאירוע הקהילתי)
   5 שריונים מסתובבים זזים למעלה ולמטה ב-5 מסלולים. מקישים על מסלול כדי לזרוק קבב:
   הקבב עף עד קו המטרה, ופוגע אם השריון נמצא שם באותו רגע. שריון שנפגע קופא,
   וכשכל ה-5 קפואים - הם משתחררים, זזים מהר יותר ומקבלים 3 שניות בונוס.
   כל פגיעה נספרת לצוות של השחקן באירוע (js/event-tmnt.js).
   ============================================================ */
const TT_W = 360, TT_H = 540;
const TT_LANES = 5, TT_LW = TT_W / TT_LANES;
const TT_SECONDS = 40;
const TT_LINE = 290;               // קו המטרה - לשם הקבב עף
const TT_PAD = 490;                // משטח הזריקה בתחתית
const TT_MID = 190, TT_AMP = 130;  // השריונים נעים בין 60 ל-320
const TT_HIT = 34;                 // מרחק פגיעה (רדיוס השריון + הקבב)
const TT_SPEED = 1150;             // מהירות הקבב
const TT_COOL = 0.32;              // השהיה בין זריקות באותו מסלול
const TT_BANDS = ['#1f5fd8', '#7a3ac8', '#d8202a', '#f2841a', '#3fb950'];

let tt = null;
let ttRaf = 0;
let ttCtx = null;

/* ---------- מכפיל שריונים x2 ----------
   כל פגיעה שווה 2 שריונים, במשך 120 שניות של משחק (הזמן רץ רק בזמן ששוחקים במצב הזה).
   מקבלים אחד בחינם כל 6 שעות, אפשר לקנות ב-200 מטבעות, ומחזיקים עד 5 (קוד יכול לעבור את הגבול). */
const TT_BOOST_KEY = 'kebab_tt_boost';
const TT_BOOST_MAX = 5, TT_BOOST_EVERY = 6 * 36e5, TT_BOOST_SECS = 120, TT_BOOST_PRICE = 200;
function ttBoost() {
    let b = null;
    try { b = JSON.parse(store.get(TT_BOOST_KEY) || 'null'); } catch (e) { b = null; }
    const now = Date.now();
    if (!b || typeof b !== 'object') b = { n: 1, last: now, left: 0 };       // שחקן חדש מתחיל עם אחד
    b.n = Math.max(0, parseInt(b.n) || 0); b.left = Math.max(0, Number(b.left) || 0); b.last = Number(b.last) || now;
    // מילוי חינמי: אחד כל 6 שעות עד 5. כשהמלאי מלא השעון מחכה, ומתחיל לספור מחדש אחרי שמשתמשים באחד
    if (b.n >= TT_BOOST_MAX) b.last = Math.max(b.last, now - TT_BOOST_EVERY + 1);
    else {
        const k = Math.floor((now - b.last) / TT_BOOST_EVERY);
        if (k > 0) { b.n = Math.min(TT_BOOST_MAX, b.n + k); b.last += k * TT_BOOST_EVERY; if (b.n >= TT_BOOST_MAX) b.last = now; }
    }
    return b;
}
function ttBoostSave(b) { store.set(TT_BOOST_KEY, JSON.stringify({ n: b.n, last: b.last, left: Math.round(b.left * 10) / 10, code: !!b.code })); }
function ttBoostActivate() {
    const b = ttBoost();
    if (b.left > 0) return;
    if (b.n <= 0) { showToast('אין לכם מכפילים כרגע - קנו אחד או חכו למילוי החינמי', false); return; }
    if (b.n >= TT_BOOST_MAX) b.last = Date.now();      // מתחילים לספור 6 שעות לאחד הבא
    b.n--; b.left = TT_BOOST_SECS;
    ttBoostSave(b);
    sfx.coin();
    if (tt) tt.boostLeft = b.left;
    ttBoostRender();
}
function ttBoostBuy() {
    const b = ttBoost();
    if (b.n >= TT_BOOST_MAX) { showToast('אפשר להחזיק עד ' + TT_BOOST_MAX + ' מכפילים', false); return; }
    if (!spendCoins(TT_BOOST_PRICE)) { showToast('אין מספיק מטבעות (צריך ' + TT_BOOST_PRICE + ' 🪙)', false); return; }
    b.n++;
    ttBoostSave(b);
    sfx.buy();
    showToast('⚡ קניתם מכפיל שריונים x2', true);
    ttBoostRender();
}
// מהקוד: מוסיף אחד גם מעבר לגבול של 5 (פעם אחת לכל שחקן)
function ttBoostFromCode() {
    const b = ttBoost();
    if (b.code) return false;
    b.n++; b.code = true;
    ttBoostSave(b);
    ttBoostRender();
    return true;
}
const ttClock = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
let ttBoostShown = '';
function ttBoostRender() {
    const box = document.getElementById('tt-boost');
    if (!box) return;
    const b = ttBoost(), left = tt && tt.running ? tt.boostLeft : b.left;
    const next = b.n >= TT_BOOST_MAX ? '' : ttClock((b.last + TT_BOOST_EVERY - Date.now()) / 6e4);   // שעות:דקות עד המכפיל החינמי הבא
    const key = [b.n, Math.ceil(left), next, getCoins() >= TT_BOOST_PRICE].join('|');
    if (key === ttBoostShown) return;
    ttBoostShown = key;
    box.innerHTML = '';
    const info = document.createElement('div');
    info.className = 'tt-boost-info';
    // מספרים ואותיות לועזיות בתוך bdi, כדי שיוצגו נכון בתוך טקסט מימין לשמאל
    const ltr = t => { const e = document.createElement('bdi'); e.dir = 'ltr'; e.textContent = t; return e; };
    if (left > 0) info.append('⚡ ', ltr('x2'), ' פעיל · ', ltr(ttClock(left)));
    else {
        info.append('⚡ ', ltr('x2'), ' · ', ltr(b.n + (b.n > TT_BOOST_MAX ? '' : '/' + TT_BOOST_MAX)));
        if (next) info.append(' · 🎁 ', ltr(next));
    }
    info.title = 'מכפיל שריונים: כל פגיעה שווה 2 במשך 2 דקות משחק. אחד בחינם כל 6 שעות (עד ' + TT_BOOST_MAX + ')';
    if (left > 0) box.classList.add('on'); else box.classList.remove('on');
    box.appendChild(info);
    if (left > 0) return;
    const use = document.createElement('button');
    use.className = 'tt-boost-btn use'; use.textContent = 'הפעל (2 דק\')'; use.disabled = b.n <= 0;
    use.onclick = ttBoostActivate;
    box.appendChild(use);
    const buy = document.createElement('button');
    buy.className = 'tt-boost-btn buy'; buy.textContent = '+1 · ' + TT_BOOST_PRICE + ' 🪙'; buy.disabled = b.n >= TT_BOOST_MAX;
    buy.onclick = ttBoostBuy;
    box.appendChild(buy);
}
setInterval(() => { const scr = document.getElementById('screen-turtles'); if (scr && scr.classList.contains('active') && !(tt && tt.running)) ttBoostRender(); }, 1000);

function ttNewShells(round) {
    const sp = 1 + (round - 1) * 0.18;
    return Array.from({ length: TT_LANES }, (_, i) => ({
        ph: Math.random() * Math.PI * 2,
        w: (1.5 + Math.random() * 1.1) * sp * (Math.random() < 0.5 ? 1 : -1),
        y: TT_MID, spin: Math.random() * 6, spinV: (2.5 + Math.random() * 2) * (i % 2 ? 1 : -1),
        frozen: false, frozenT: 0, cool: 0
    }));
}

function ttNewState() {
    return {
        running: false, started: false, time: TT_SECONDS, score: 0, round: 1, t: 0, last: 0,
        shells: ttNewShells(1), kebabs: [], fx: [], banner: null, nextRoundIn: 0,
        shownTime: -1, shownScore: -1, shownRound: '', boostLeft: ttBoost().left
    };
}

function ttStop() {
    cancelAnimationFrame(ttRaf);
    if (tt) tt.running = false;
}

function startTurtlesGame() {
    switchTab('turtles');
    tt = ttNewState();
    ttResize();
    ttUpdateHud();
    tt.running = true;
    tt.last = performance.now();
    ttBoostShown = '';
    ttBoostRender();
    ttRaf = requestAnimationFrame(ttLoop);
}

function ttResize() {
    const wrap = document.getElementById('turtles-wrap');
    const cv = document.getElementById('turtles-canvas');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    const scale = Math.min(w / TT_W, h / TT_H);
    const cssW = Math.floor(TT_W * scale), cssH = Math.floor(TT_H * scale);
    cv.style.width = cssW + 'px';
    cv.style.height = cssH + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(cssH * dpr);
    ttCtx = cv.getContext('2d');
    ttCtx.setTransform(cv.width / TT_W, 0, 0, cv.height / TT_H, 0, 0);
}
window.addEventListener('resize', () => { if (tt && tt.running) ttResize(); });

function ttThrow(lane) {
    if (!tt || !tt.running || lane < 0 || lane >= TT_LANES) return;
    const s = tt.shells[lane];
    if (!tt.started) tt.started = true;           // השעון מתחיל בזריקה הראשונה
    if (s.frozen) { tt.fx.push({ x: (lane + 0.5) * TT_LW, y: TT_PAD - 40, text: '❄️', color: '#bfe8ff', size: 18, t: 0, life: 0.5 }); return; }
    if (s.cool > 0) return;
    s.cool = TT_COOL;
    tt.kebabs.push({ lane, y: TT_PAD - 10 });
    sfx.whoosh();
}

function ttStep(dt) {
    tt.t += dt;
    if (tt.started) {
        tt.time -= dt;
        if (tt.boostLeft > 0) {                        // זמן המכפיל רץ רק בזמן משחק
            tt.boostLeft = Math.max(0, tt.boostLeft - dt);
            if (Math.floor(tt.boostLeft) !== Math.floor(tt.boostLeft + dt) || tt.boostLeft === 0) {
                const b = ttBoost(); b.left = tt.boostLeft; ttBoostSave(b); ttBoostRender();
            }
        }
        if (tt.time <= 0) { tt.time = 0; ttEnd(); return; }
    }
    tt.shells.forEach(s => {
        s.cool = Math.max(0, s.cool - dt);
        if (s.frozen) { s.frozenT += dt; return; }
        s.ph += s.w * dt;
        s.y = TT_MID + Math.sin(s.ph) * TT_AMP;
        s.spin += s.spinV * dt;
    });
    // קבבים באוויר: כשהם מגיעים לקו - פגיעה אם השריון באותו מסלול נמצא שם
    for (let i = tt.kebabs.length - 1; i >= 0; i--) {
        const k = tt.kebabs[i];
        k.y -= TT_SPEED * dt;
        if (k.y > TT_LINE) continue;
        tt.kebabs.splice(i, 1);
        const s = tt.shells[k.lane], x = (k.lane + 0.5) * TT_LW;
        if (!s.frozen && Math.abs(s.y - TT_LINE) <= TT_HIT) {
            s.frozen = true; s.frozenT = 0;
            const gain = tt.boostLeft > 0 ? 2 : 1;          // מכפיל x2: שני שריונים על כל פגיעה
            tt.score += gain;
            sfx.pop();
            try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) { /* ignore */ }
            tt.fx.push({ x, y: s.y - 34, text: '+' + gain, color: gain > 1 ? '#ffd23d' : '#7ee787', size: gain > 1 ? 28 : 24, t: 0, life: 0.7 });
            if (tt.shells.every(sh => sh.frozen)) tt.nextRoundIn = 0.55;
        } else {
            tt.fx.push({ x, y: TT_LINE, splat: true, t: 0, life: 0.35 });
        }
    }
    // כל ה-5 קפואים: סיבוב חדש, מהר יותר, ועוד 3 שניות
    if (tt.nextRoundIn > 0) {
        tt.nextRoundIn -= dt;
        if (tt.nextRoundIn <= 0) {
            tt.round++;
            tt.shells = ttNewShells(tt.round);
            tt.time += 3;
            tt.banner = { text: 'סיבוב ' + tt.round + '! מהר יותר', sub: '+3 שניות', t: 0 };
            sfx.match(3);
        }
    }
    if (tt.banner) { tt.banner.t += dt; if (tt.banner.t > 1.4) tt.banner = null; }
    for (let i = tt.fx.length - 1; i >= 0; i--) { tt.fx[i].t += dt; if (tt.fx[i].t >= tt.fx[i].life) tt.fx.splice(i, 1); }
    ttUpdateHud();
}

function ttUpdateHud() {
    const t = Math.ceil(tt.time);
    if (t !== tt.shownTime) { tt.shownTime = t; document.getElementById('tt-timer').textContent = t; }
    if (tt.score !== tt.shownScore) { tt.shownScore = tt.score; document.getElementById('tt-score').textContent = tt.score; }
    const frozen = tt.shells.filter(s => s.frozen).length;
    const r = 'סיבוב ' + tt.round + ' · ' + frozen + '/5';
    if (r !== tt.shownRound) { tt.shownRound = r; document.getElementById('tt-round').textContent = r; }
}

function ttEnd() {
    if (!tt.running) return;
    tt.running = false;
    { const b = ttBoost(); b.left = tt.boostLeft; ttBoostSave(b); }
    cancelAnimationFrame(ttRaf);
    saveBestScore('leaderboard_turtles', tt.score, 'kebab_turtlesHighScore');
    document.getElementById('result-desc').textContent =
        `צברתם ${tt.score} שריונים והגעתם לסיבוב ${tt.round}!`;
    dailyEvent('turtles', { score: tt.score });
    showResultReward('turtles', tt.score);
    switchTab('result');
}

function ttLoop(ts) {
    if (!tt || !tt.running) return;
    const dt = Math.min(0.033, (ts - tt.last) / 1000 || 0.016);
    tt.last = ts;
    ttStep(dt);
    if (tt && tt.running) {
        ttDraw();
        ttRaf = requestAnimationFrame(ttLoop);
    }
}

/* ---------- ציור ---------- */
function ttShell(c, x, y, rot, band, frozen) {
    c.save(); c.translate(x, y); c.rotate(rot);
    const r = 27;
    const g = c.createRadialGradient(-8, -8, 3, 0, 0, r);
    g.addColorStop(0, '#7cc04a'); g.addColorStop(0.7, '#3e7a28'); g.addColorStop(1, '#244a16');
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2);
    c.fillStyle = g; c.fill();
    c.lineWidth = 4; c.strokeStyle = '#c8a040'; c.stroke();
    c.lineWidth = 2; c.strokeStyle = '#1a3010'; c.stroke();
    // משושה באמצע ומשבצות מסביב
    c.strokeStyle = 'rgba(20,45,12,0.85)'; c.lineWidth = 2;
    c.beginPath();
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; c[k ? 'lineTo' : 'moveTo'](Math.cos(a) * 10, Math.sin(a) * 10); }
    c.closePath(); c.stroke();
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; c.beginPath(); c.moveTo(Math.cos(a) * 10, Math.sin(a) * 10); c.lineTo(Math.cos(a) * (r - 3), Math.sin(a) * (r - 3)); c.stroke(); }
    // רצועה בצבע הבנדנה
    c.strokeStyle = band; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, r - 7, -0.5, 0.5); c.stroke();
    c.restore();
    if (frozen) {                                  // קפוא: שכבת קרח וסימן וי
        c.save();
        c.fillStyle = 'rgba(180,230,255,0.55)'; c.beginPath(); c.arc(x, y, 30, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(230,250,255,0.95)'; c.lineWidth = 2; c.stroke();
        c.strokeStyle = '#ffffff'; c.lineWidth = 1.6;
        for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + 0.3; c.beginPath(); c.moveTo(x - Math.cos(a) * 14, y - Math.sin(a) * 14); c.lineTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); c.stroke(); }
        c.restore();
    }
}

function ttDraw() {
    const c = ttCtx;
    if (!c || !tt) return;
    const g = c.createLinearGradient(0, 0, 0, TT_H);
    g.addColorStop(0, '#0c1a14'); g.addColorStop(1, '#14301f');
    c.fillStyle = g; c.fillRect(0, 0, TT_W, TT_H);
    if (tt.boostLeft > 0) {                            // מכפיל פעיל: מסגרת זהב
        c.strokeStyle = 'rgba(255,210,60,' + (0.5 + 0.3 * Math.sin(tt.t * 6)) + ')'; c.lineWidth = 6; c.strokeRect(3, 3, TT_W - 6, TT_H - 6);
    }
    // מסלולים
    for (let i = 0; i < TT_LANES; i++) {
        c.fillStyle = i % 2 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.12)';
        c.fillRect(i * TT_LW, 0, TT_LW, TT_H);
        c.fillStyle = 'rgba(120,200,140,0.12)';
        c.fillRect((i + 0.5) * TT_LW - 1, TT_MID - TT_AMP - 30, 2, TT_AMP * 2 + 60);
    }
    // קו המטרה
    const pulse = 0.6 + 0.4 * Math.sin(tt.t * 5);
    c.save();
    c.strokeStyle = 'rgba(255,214,90,' + (0.5 + 0.4 * pulse) + ')'; c.lineWidth = 3; c.setLineDash([10, 8]);
    c.beginPath(); c.moveTo(0, TT_LINE); c.lineTo(TT_W, TT_LINE); c.stroke();
    c.setLineDash([]);
    for (let i = 0; i < TT_LANES; i++) { c.beginPath(); c.arc((i + 0.5) * TT_LW, TT_LINE, 12, 0, Math.PI * 2); c.strokeStyle = 'rgba(255,214,90,0.5)'; c.lineWidth = 2; c.stroke(); }
    c.restore();
    // שריונים
    tt.shells.forEach((s, i) => ttShell(c, (i + 0.5) * TT_LW, s.y, s.spin, TT_BANDS[i], s.frozen));
    // משטחי זריקה
    for (let i = 0; i < TT_LANES; i++) {
        const x = (i + 0.5) * TT_LW, s = tt.shells[i];
        c.beginPath(); c.arc(x, TT_PAD, 24, 0, Math.PI * 2);
        c.fillStyle = s.frozen ? 'rgba(120,180,220,0.25)' : 'rgba(255,140,40,0.22)'; c.fill();
        c.strokeStyle = s.frozen ? 'rgba(170,220,255,0.6)' : 'rgba(255,170,60,0.75)'; c.lineWidth = 2.5; c.stroke();
        if (s.cool > 0) { c.beginPath(); c.moveTo(x, TT_PAD); c.arc(x, TT_PAD, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * s.cool / TT_COOL); c.closePath(); c.fillStyle = 'rgba(0,0,0,0.35)'; c.fill(); }
        c.font = '24px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.save(); c.translate(x, TT_PAD); c.rotate(-Math.PI / 4); c.fillText('🍢', 0, 0); c.restore();
    }
    // קבבים באוויר
    tt.kebabs.forEach(k => {
        const x = (k.lane + 0.5) * TT_LW;
        c.save(); c.translate(x, k.y); c.rotate(-Math.PI / 4);
        c.font = '28px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🍢', 0, 0);
        c.restore();
        c.fillStyle = 'rgba(255,200,120,0.25)'; c.fillRect(x - 2, k.y + 14, 4, 30);
    });
    // אפקטים
    tt.fx.forEach(f => {
        const p = f.t / f.life;
        if (f.splat) {
            c.strokeStyle = 'rgba(255,200,120,' + (1 - p) + ')'; c.lineWidth = 2;
            for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; c.beginPath(); c.moveTo(0, 0); c.moveTo(f.x + Math.cos(a) * 6, f.y + Math.sin(a) * 6); c.lineTo(f.x + Math.cos(a) * (8 + p * 14), f.y + Math.sin(a) * (8 + p * 14)); c.stroke(); }
            return;
        }
        c.globalAlpha = 1 - p;
        c.fillStyle = f.color; c.font = 'bold ' + f.size + 'px "Secular One", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.direction = 'ltr';
        c.fillText(f.text, f.x, f.y - p * 26);
        c.globalAlpha = 1;
    });
    // הסבר לפני הזריקה הראשונה
    if (!tt.started) {
        c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(20, TT_LINE + 34, TT_W - 40, 116);
        c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl';
        c.font = 'bold 17px "Rubik", sans-serif';
        c.fillText('הקישו על מסלול כדי לזרוק קבב', TT_W / 2, TT_LINE + 62);
        c.font = '14px "Rubik", sans-serif';
        c.fillText('פגעו בשריון כשהוא עובר בקו הצהוב', TT_W / 2, TT_LINE + 88);
        c.fillText('הקפיאו את כל ה-5 כדי לעלות סיבוב (+3 שניות)', TT_W / 2, TT_LINE + 112);
        c.direction = 'ltr';
    }
    if (tt.banner) {
        const p = tt.banner.t / 1.4, a = p < 0.15 ? p / 0.15 : p > 0.75 ? (1 - p) / 0.25 : 1;
        c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl';
        c.fillStyle = '#ffd23d'; c.font = 'bold 30px "Secular One", sans-serif'; c.fillText(tt.banner.text, TT_W / 2, TT_LINE + 70);
        c.fillStyle = '#7ee787'; c.font = 'bold 18px "Secular One", sans-serif'; c.fillText(tt.banner.sub, TT_W / 2, TT_LINE + 104);
        c.globalAlpha = 1; c.direction = 'ltr';
    }
}

(function bindTurtles() {
    const cv = document.getElementById('turtles-canvas');
    if (!cv) return;
    cv.addEventListener('pointerdown', e => {
        if (!tt || !tt.running) return;
        const r = cv.getBoundingClientRect();
        ttThrow(Math.floor((e.clientX - r.left) / r.width * TT_LANES));
        e.preventDefault();
    });
})();

function loadTurtlesLeaderboard() {
    loadLeaderboardInto('turtles-leaderboard-container', 'leaderboard_turtles');
}

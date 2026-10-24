/* ============================================================
   משחק: האכל את השוורץ  (בסגנון משחקי הכדורסל של FRVR)
   מחליקים אצבע למעלה כדי לזרוק אוכל לתוך הפה של שוורץ
   ============================================================ */

const SV_W = 360, SV_H = 540;          // מערכת קואורדינטות לוגית של הקנבס
const SV_G = 1700;                     // כוח משיכה (פיקסלים לוגיים / שנייה^2)
const SV_BALL_R = 24;
const SV_START = { x: SV_W / 2, y: 478 };
const SV_BASE_Y = 200;                 // גובה הפה
const SV_GAME_SECONDS = 30;
const SV_FOODS = ['🥙', '🍢', '🍔', '🍟', '🌭', '🍕', '🥒', '🍅', '🧆'];

// רמות קושי לפי מספר הפעמים ששוורץ אכל: הפה מצטמצם, זז ומאיץ
const SV_TIERS = [
    { made: 0,  hw: 48, amp: 0,  speed: 0,   bob: 0,  assist: 0.80, reach: 1.50 },
    { made: 3,  hw: 46, amp: 45, speed: 60,  bob: 0,  assist: 0.65, reach: 1.40 },
    { made: 6,  hw: 42, amp: 70, speed: 100, bob: 0,  assist: 0.55, reach: 1.30 },
    { made: 10, hw: 37, amp: 80, speed: 140, bob: 14, assist: 0.45, reach: 1.20 },
    { made: 15, hw: 32, amp: 82, speed: 180, bob: 24, assist: 0.35, reach: 1.10 },
    { made: 22, hw: 29, amp: 85, speed: 220, bob: 30, assist: 0.25, reach: 1.00 }
];

let sv = null;          // מצב המשחק
let svRaf = 0;
let svCtx = null;

function svNewState() {
    return {
        running: false, over: false, overtime: 0,
        time: SV_GAME_SECONDS, score: 0, made: 0, streak: 0,
        ball: null, respawnIn: 0,
        mouth: { x: SV_W / 2, y: SV_BASE_Y, hw: SV_TIERS[0].hw, amp: 0, bob: 0, phase: 0, chew: 0 },
        tier: SV_TIERS[0],
        fx: [], aim: null, hasShot: false, t: 0, last: 0,
        shownTime: -1, shownScore: -1, shownCombo: '#', skin: null, started: false
    };
}

function svStop() {
    cancelAnimationFrame(svRaf);
    if (sv) sv.running = false;
}

function startShvartzGame() {
    switchTab('shvartz');            // עוצר כל משחק אחר
    sv = svNewState();
    sv.skin = skinById(getEquippedSkinId());
    svResize();
    svSpawnBall();
    svUpdateHud();
    sv.running = true;
    sv.last = performance.now();
    svRaf = requestAnimationFrame(svLoop);
}

function svResize() {
    const wrap = document.getElementById('shvartz-wrap');
    const cv = document.getElementById('shvartz-canvas');
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    const scale = Math.min(w / SV_W, h / SV_H);
    const cssW = Math.floor(SV_W * scale), cssH = Math.floor(SV_H * scale);
    cv.style.width = cssW + 'px';
    cv.style.height = cssH + 'px';
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(cssW * dpr);
    cv.height = Math.round(cssH * dpr);
    svCtx = cv.getContext('2d');
    svCtx.setTransform(cv.width / SV_W, 0, 0, cv.height / SV_H, 0, 0);
}
window.addEventListener('resize', () => { if (sv && sv.running) svResize(); });

function svSpawnBall() {
    sv.ball = {
        x: SV_START.x, y: SV_START.y, vx: 0, vy: 0, prevY: SV_START.y,
        state: 'ready', food: SV_FOODS[Math.floor(Math.random() * SV_FOODS.length)],
        touched: false, rot: 0, pop: 0, eatT: 0, age: 0
    };
}

// גודל "פרספקטיבה": הכדור קטן ככל שהוא מתרחק למעלה
function svScale(y) {
    const t = (SV_START.y - y) / (SV_START.y - SV_BASE_Y);
    return Math.max(0.55, 1 - 0.38 * Math.min(1.2, Math.max(0, t)));
}

/* ---------- זריקה ---------- */
// כיוון ההחלקה קובע לאיזו נקודה (בגובה הפה) הכדור מכוון,
// ואורך ההחלקה קובע את משך הטיסה: החלקה קצרה = זריקה גבוהה ואיטית, ארוכה = מהירה
function svLaunch(dx, dy) {
    const b = sv && sv.ball;
    if (!b || b.state !== 'ready') return false;
    const L = Math.hypot(dx, dy);
    if (dy > -35 || L < 50) return false;                 // חייבים להחליק למעלה

    const slope = Math.max(-1.2, Math.min(1.2, dx / (-dy)));
    const rise = b.y - SV_BASE_Y;
    const aimX = b.x + slope * rise;
    const T = 1.3 - 0.5 * Math.min(1, Math.max(0, (L - 80) / 220));
    b.vx = (aimX - b.x) / T;
    b.vy = (-rise - 0.5 * SV_G * T * T) / T;
    b.state = 'flying';
    b.prevY = b.y;
    sv.hasShot = true;
    sfx.whoosh();
    return true;
}

/* ---------- לוגיקה ---------- */
function svStep(dt) {
    const m = sv.mouth;
    sv.t += dt;

    // רמת קושי
    let tier = SV_TIERS[0];
    for (const t of SV_TIERS) if (sv.made >= t.made) tier = t;
    sv.tier = tier;
    m.hw += (tier.hw - m.hw) * Math.min(1, dt * 3);
    m.amp += (tier.amp - m.amp) * Math.min(1, dt * 2);
    m.bob += (tier.bob - m.bob) * Math.min(1, dt * 2);
    if (tier.amp > 0) m.phase += (tier.speed / tier.amp) * dt;
    m.x = SV_W / 2 + m.amp * Math.sin(m.phase);
    m.y = SV_BASE_Y + m.bob * Math.sin(sv.t * 2.1);
    m.chew = Math.max(0, m.chew - dt * 2);

    // טיימר
    if (!sv.over && sv.started) {             // הטיימר מתחיל בנגיעה הראשונה
        sv.time -= dt;
        if (sv.time <= 0) { sv.time = 0; sv.over = true; }
    } else {
        sv.overtime += dt;
    }

    // כדור
    const b = sv.ball;
    if (!b) {
        if (!sv.over) {
            sv.respawnIn -= dt;
            if (sv.respawnIn <= 0) svSpawnBall();
        }
    } else if (b.state === 'ready') {
        b.pop = Math.min(1, b.pop + dt * 6);
    } else if (b.state === 'flying') {
        b.age += dt;
        b.prevY = b.y;

        // עזר כיוון עדין בשלב הירידה (נחלש ככל שהקושי עולה)
        if (!b.touched && b.vy > 0 && b.y < m.y && b.y > m.y - 210) {
            const ddx = m.x - b.x;
            if (Math.abs(ddx) < m.hw * tier.reach) {
                const tt = (-b.vy + Math.sqrt(b.vy * b.vy + 2 * SV_G * (m.y - b.y))) / SV_G;
                // רק כשנשאר מספיק זמן לתיקון עדין (קרוב מדי לפה זה היה מעיף את הכדור הצידה)
                if (tt > 0.15) {
                    const corr = Math.max(-350, Math.min(350, ddx / tt - b.vx));
                    b.vx += corr * Math.min(1, tier.assist * 6 * dt);
                }
            }
        }

        b.vy += SV_G * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.rot += (b.vx >= 0 ? 1 : -1) * 5 * dt;

        const R = SV_BALL_R * svScale(b.y);

        // קירות
        if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx) * 0.6; }
        if (b.x > SV_W - R) { b.x = SV_W - R; b.vx = -Math.abs(b.vx) * 0.6; }

        // שפתיים: שתי נקודות בקצוות הפה שהכדור קופץ מהן - רק בירידה
        // (בעלייה הכדור עובר "לפני" הפה, כמו מול החישוק במשחקי הכדורסל)
        for (const side of (b.vy > 0 ? [-1, 1] : [])) {
            const lx = m.x + side * m.hw, ly = m.y, lipR = 6;
            const ex = b.x - lx, ey = b.y - ly;
            const d = Math.hypot(ex, ey);
            if (d < R + lipR && d > 0.001) {
                const nx = ex / d, ny = ey / d;
                b.x = lx + nx * (R + lipR);
                b.y = ly + ny * (R + lipR);
                const vn = b.vx * nx + b.vy * ny;
                if (vn < 0) {
                    b.vx -= 1.5 * vn * nx;
                    b.vy -= 1.5 * vn * ny;
                    b.touched = true;
                }
            }
        }

        // חציית קו הפה מלמעלה למטה
        if (b.vy > 0 && b.prevY < m.y && b.y >= m.y) {
            if (Math.abs(b.x - m.x) <= m.hw - R * 0.3) svScoreShot();
        }

        if (sv.ball === b && (b.y > SV_H + 60 || b.x < -80 || b.x > SV_W + 80 || b.age > 4)) svMiss();
    } else if (b.state === 'eaten') {
        b.eatT += dt;
        if (b.eatT >= 0.3) { sv.ball = null; sv.respawnIn = 0.25; }
    }

    // אפקטים צפים
    for (const f of sv.fx) f.t += dt;
    sv.fx = sv.fx.filter(f => f.t < f.life);

    // סיום: נגמר הזמן והכדור האחרון נפתר (או חלף זמן סביר)
    if (sv.over) {
        const bb = sv.ball;
        if (!bb || bb.state === 'ready' || sv.overtime > 2.5) { svEnd(); return; }
    }
    svUpdateHud();
}

const SV_SWISH = ['מושלם!', 'אדיר!', 'מעולה!'];          // הודעה לזריקה נקייה בלי לגעת בשפה
function svScoreShot() {
    const b = sv.ball, m = sv.mouth;
    sv.streak++;
    sv.made++;
    const clean = !b.touched;
    const base = clean ? 3 : 2;
    const mult = sv.streak >= 6 ? 3 : (sv.streak >= 3 ? 2 : 1);
    const pts = base * mult;
    sv.score += pts;

    b.state = 'eaten';
    b.eatT = 0;
    b.x0 = b.x; b.y0 = b.y;
    m.chew = 1;
    sfx.score(clean);

    sv.fx.push({ x: m.x, y: m.y - 70, text: '+' + pts, color: '#ffd700', size: 30, t: 0, life: 0.9 });
    if (clean) sv.fx.push({ x: m.x, y: m.y - 100, text: SV_SWISH[Math.floor(Math.random() * SV_SWISH.length)], color: '#7ee787', size: 20, t: 0, life: 0.9 });
    if (mult > 1) sv.fx.push({ x: m.x, y: m.y - 128, text: '🔥 x' + mult, color: '#ff7b3d', size: 20, t: 0, life: 0.9 });
    try { if (navigator.vibrate) navigator.vibrate(clean ? 18 : 10); } catch (e) { /* ignore */ }
}

function svMiss() {
    const b = sv.ball;
    if (!b) return;
    if (sv.streak > 0) {
        sfx.miss();
        sv.fx.push({ x: Math.max(40, Math.min(SV_W - 40, b.x)), y: SV_H - 90, text: 'פספוס', color: '#f85149', size: 18, t: 0, life: 0.8 });
    }
    sv.streak = 0;
    sv.ball = null;
    sv.respawnIn = 0.3;
}

function svEnd() {
    if (!sv.running) return;
    sv.running = false;
    cancelAnimationFrame(svRaf);
    saveBestScore('leaderboard_shvartz', sv.score, 'kebab_shvartzHighScore');
    document.getElementById('result-desc').textContent =
        `שוורץ אכל ${sv.made} פעמים ואתם צברתם ${sv.score} נקודות!`;
        dailyEvent('shvartz', { score: sv.score, made: sv.made });
        showResultReward('shvartz', sv.score);
    switchTab('result');
}

function svUpdateHud() {
    const t = Math.ceil(sv.time);
    if (t !== sv.shownTime) { sv.shownTime = t; document.getElementById('sv-timer').textContent = t; }
    if (sv.score !== sv.shownScore) { sv.shownScore = sv.score; document.getElementById('sv-score').textContent = sv.score; }
    const mult = sv.streak >= 6 ? 3 : (sv.streak >= 3 ? 2 : 1);
    // רצף והכפלה כשני חלקים נפרדים - כשהם צמודים בטקסט מימין לשמאל זה נראה כמו "3.10"
    const combo = sv.streak >= 2 ? sv.streak + '|' + mult : '';
    if (combo !== sv.shownCombo) {
        sv.shownCombo = combo;
        document.getElementById('sv-combo').innerHTML = !combo ? '' : '<span>🔥 רצף ' + sv.streak + '</span>' +
            (mult > 1 ? '<span class="hud-mult">ניקוד <bdi dir="ltr">×' + mult + '</bdi></span>' : '');
    }
}

function svLoop(ts) {
    if (!sv || !sv.running) return;
    const dt = Math.min(0.033, (ts - sv.last) / 1000 || 0.016);
    sv.last = ts;
    svStep(dt);
    if (sv && sv.running) {
        svDraw();
        svRaf = requestAnimationFrame(svLoop);
    }
}

/* ---------- ציור ---------- */
const SV_EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

/* ---------- ספרייטים של אימוג'י ----------
   ציור אימוג'י גדול ישירות על קנבס יוצא שחור בחלק מהמכשירים: מעל גודל מסוים הדפדפן
   מצייר את התו כצורה חד-צבעית (בצבע ה-fillStyle הנוכחי), או כשאין גופן אימוג'י צבעוני.
   לכן מציירים כל אימוג'י פעם אחת בגודל בטוח לקנבס נפרד ומשתמשים בתמונה.
   אם התוצאה בכל זאת חד-צבעית - צובעים אותה בצבע הגיבוי של הפריט במקום שחור. */
const EMOJI_SPRITE_PX = 96;
const emojiSprites = {};
function emojiSprite(emoji, tint) {
    const key = emoji + '|' + (tint || '');
    if (emojiSprites[key]) return emojiSprites[key];
    const S = Math.round(EMOJI_SPRITE_PX * 1.3);
    const cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const c = cv.getContext('2d');
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = EMOJI_SPRITE_PX + 'px ' + SV_EMOJI_FONT;
    c.fillStyle = '#000000';
    c.fillText(emoji, S / 2, S / 2 + EMOJI_SPRITE_PX * 0.05);

    // בדיקה: האם יצא צבעוני? (תו חד-צבעי ייצא שחור לגמרי)
    let ink = 0, colored = 0;
    try {
        const d = c.getImageData(0, 0, S, S).data;
        for (let i = 0; i < d.length; i += 16) {
            if (d[i + 3] < 40) continue;
            ink++;
            if (d[i] > 40 || d[i + 1] > 40 || d[i + 2] > 40) colored++;
        }
    } catch (e) { colored = ink = 1; }

    if (ink === 0) {                                   // לא צויר כלום - עיגול בצבע הגיבוי
        const col = tint || '#e0793a';
        skE(c, S / 2, S / 2, S * 0.34, S * 0.34, col, skShade(col, -0.45), 4);
        skE(c, S * 0.4, S * 0.38, S * 0.1, S * 0.07, 'rgba(255,255,255,0.45)');
    } else if (colored < ink * 0.1) {                 // צורה חד-צבעית - צובעים אותה
        const col = tint || '#e0793a';
        c.globalCompositeOperation = 'source-in';
        const g = c.createLinearGradient(0, 0, 0, S);
        g.addColorStop(0, skShade(col, 0.3));
        g.addColorStop(1, skShade(col, -0.3));
        c.fillStyle = g;
        c.fillRect(0, 0, S, S);
        c.globalCompositeOperation = 'source-over';
    }
    emojiSprites[key] = cv;
    return cv;
}
// מצייר אימוג'י במרכז (0,0) בגודל size (גובה הגופן)
function drawEmoji(c, emoji, size, tint, dy) {
    const sp = emojiSprite(emoji, tint);
    const w = size * 1.3;
    c.drawImage(sp, -w / 2, -w / 2 + (dy || 0), w, w);
}

function svDraw() {
    const c = svCtx;
    if (!c || !sv) return;
    const m = sv.mouth, b = sv.ball;

    // רקע
    const bg = c.createLinearGradient(0, 0, 0, SV_H);
    bg.addColorStop(0, '#170c07');
    bg.addColorStop(1, '#33190c');
    c.fillStyle = bg;
    c.fillRect(0, 0, SV_W, SV_H);

    const glow = c.createRadialGradient(m.x, m.y, 10, m.x, m.y, 230);
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.16)');
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, SV_W, SV_H);

    const skin = sv.skin || SV_SKINS[0];
    if (skin.kind === 'cone') {
        svDrawCounter(c);
        svDrawBody(c);
        svDrawMouthBack(c);
        // כדור (אחרי החלק האחורי של הפה ולפני השפה התחתונה - כך הוא נראה "נכנס" פנימה)
        if (b) svDrawBall(c, b);
        svDrawLowerLip(c);
    } else {
        const st = svCharState();
        skDrawHumanBack(c, skin, st);
        skMouthBack(c, skin, st);
        skDrawHumanFront(c, skin, st);
        svDrawCounter(c);                       // הדלפק מסתיר את תחתית הגוף
        if (b) svDrawBall(c, b);
        skMouthFront(c, skin, st);
        skDrawHumanFx(c, skin, st);
    }

    // מסלול האצבע
    if (sv.aim) {
        c.strokeStyle = 'rgba(255, 215, 0, 0.45)';
        c.lineWidth = 3;
        c.setLineDash([6, 8]);
        c.beginPath();
        c.moveTo(sv.aim.x0, sv.aim.y0);
        c.lineTo(sv.aim.x, sv.aim.y);
        c.stroke();
        c.setLineDash([]);
    }

    // הדרכה לפני הזריקה הראשונה
    if (!sv.hasShot && b && b.state === 'ready') {
        const bounce = Math.sin(sv.t * 5) * 6;
        c.fillStyle = 'rgba(1, 4, 9, 0.72)';
        c.fillRect(20, 372, SV_W - 40, 40);
        c.fillStyle = 'rgba(240, 246, 252, 0.95)';
        c.font = 'bold 16px Rubik, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('החליקו למעלה כדי להאכיל את שוורץ', SV_W / 2, 392);
        c.font = '30px ' + SV_EMOJI_FONT;
        c.fillText('👆', SV_W / 2 + 70, 436 + bounce);
    }

    // טקסטים צפים
    for (const f of sv.fx) {
        const p = f.t / f.life;
        c.globalAlpha = 1 - p * p;
        c.fillStyle = f.color;
        c.font = 'bold ' + f.size + 'px Rubik, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(f.text, f.x, f.y - p * 38);
    }
    c.globalAlpha = 1;
}

function svDrawCounter(c) {
    const wood = c.createLinearGradient(0, SV_H - 52, 0, SV_H);
    wood.addColorStop(0, '#6b4426');
    wood.addColorStop(1, '#3a2416');
    c.fillStyle = wood;
    c.fillRect(0, SV_H - 52, SV_W, 52);
    c.fillStyle = '#8a5a34';
    c.fillRect(0, SV_H - 52, SV_W, 4);
    c.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    c.lineWidth = 2;
    for (let x = 30; x < SV_W; x += 70) { c.beginPath(); c.moveTo(x, SV_H - 48); c.lineTo(x, SV_H); c.stroke(); }
}

function svCharState() {
    const m = sv.mouth, b = sv.ball;
    return {
        x: m.x, y: m.y, hw: m.hw, ry: svMouthRy(), chew: m.chew, t: sv.t,
        tx: b ? b.x : m.x, ty: b ? b.y : SV_H,
        surprised: !!(b && b.state === 'flying'), mx: m.x, my: m.y
    };
}

function svDrawBall(c, b) {
    let x = b.x, y = b.y, sc = svScale(b.y), alpha = 1;

    if (b.state === 'ready') {
        const pop = 0.6 + 0.4 * (1 - Math.pow(1 - b.pop, 3));
        sc *= pop;
        y += Math.sin(sv.t * 4) * 2;
        // צל על הדלפק
        c.fillStyle = 'rgba(0, 0, 0, 0.35)';
        c.beginPath();
        c.ellipse(x, SV_H - 40, 24 * pop, 6 * pop, 0, 0, Math.PI * 2);
        c.fill();
    } else if (b.state === 'eaten') {
        const p = Math.min(1, b.eatT / 0.3);
        const m = sv.mouth;
        x = b.x0 + (m.x - b.x0) * p;
        y = b.y0 + (m.y + m.hw * 0.2 - b.y0) * p;
        sc *= (1 - p * 0.85);
        alpha = 1 - p * 0.6;
    }

    c.save();
    c.globalAlpha = alpha;
    c.translate(x, y);
    c.rotate(b.rot);
    drawEmoji(c, b.food, SV_BALL_R * 2 * sc, '#e0793a', 2 * sc);
    c.restore();
}

function svMouthRy() {
    const m = sv.mouth, b = sv.ball;
    let ry = m.hw * 0.36;
    if (b && b.state === 'flying' && b.vy > -200 && b.y < m.y) ry *= 1.25;      // פה פעור לקראת הכדור
    if (m.chew > 0) ry *= 1 + 0.22 * Math.sin(sv.t * 32) * m.chew;              // לעיסה
    return ry;
}

function svDrawBody(c) {
    const m = sv.mouth, b = sv.ball;
    const top = m.y - 95, bottom = m.y + 135;

    // מוט השיפוד עד לדלפק
    c.fillStyle = '#b9a38e';
    c.fillRect(m.x - 4, bottom, 8, SV_H - 52 - bottom);
    c.fillRect(m.x - 3, top - 52, 6, 40);
    c.fillStyle = '#c9d1d9';
    c.beginPath();
    c.arc(m.x, top - 54, 6, 0, Math.PI * 2);
    c.fill();
    // צלחת בבסיס
    c.fillStyle = '#484f58';
    c.beginPath();
    c.ellipse(m.x, SV_H - 52, 46, 8, 0, 0, Math.PI * 2);
    c.fill();

    // גוף: חרוט שוורמה
    const body = new Path2D();
    body.moveTo(m.x - 98, top + 6);
    body.quadraticCurveTo(m.x, top - 22, m.x + 98, top + 6);
    body.lineTo(m.x + 46, bottom);
    body.quadraticCurveTo(m.x, bottom + 16, m.x - 46, bottom);
    body.closePath();

    const gr = c.createLinearGradient(m.x - 98, 0, m.x + 98, 0);
    gr.addColorStop(0, '#7a3f17');
    gr.addColorStop(0.35, '#d99a45');
    gr.addColorStop(0.6, '#c9822f');
    gr.addColorStop(1, '#6d3512');
    c.fillStyle = gr;
    c.fill(body);

    // שכבות בשר
    c.save();
    c.clip(body);
    c.strokeStyle = 'rgba(70, 30, 8, 0.38)';
    c.lineWidth = 2.5;
    for (let i = 1; i < 9; i++) {
        const yy = top + i * 27;
        c.beginPath();
        c.moveTo(m.x - 110, yy);
        c.quadraticCurveTo(m.x, yy + 9, m.x + 110, yy);
        c.stroke();
    }
    c.restore();
    c.strokeStyle = '#3b1b08';
    c.lineWidth = 3;
    c.stroke(body);

    // עיניים עוקבות אחרי הכדור
    const happy = m.chew > 0.25;
    const ey = m.y - 58;
    const tx = b ? b.x : m.x, ty = b ? b.y : SV_H;
    const lift = (b && b.state === 'flying') ? 5 : 0;
    for (const o of [-34, 34]) {
        const cx = m.x + o;
        c.strokeStyle = '#2b1608';
        c.lineWidth = 4;
        c.lineCap = 'round';
        if (happy) {
            c.beginPath();
            c.arc(cx, ey + 6, 12, Math.PI * 1.1, Math.PI * 1.9);
            c.stroke();
        } else {
            c.fillStyle = '#fff';
            c.beginPath();
            c.arc(cx, ey, 15, 0, Math.PI * 2);
            c.fill();
            c.lineWidth = 2.5;
            c.stroke();
            const ang = Math.atan2(ty - ey, tx - cx);
            const dist = Math.min(6, Math.hypot(tx - cx, ty - ey) / 25);
            c.fillStyle = '#1a0d04';
            c.beginPath();
            c.arc(cx + Math.cos(ang) * dist, ey + Math.sin(ang) * dist, 7, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = '#fff';
            c.beginPath();
            c.arc(cx + Math.cos(ang) * dist - 2, ey + Math.sin(ang) * dist - 2, 2, 0, Math.PI * 2);
            c.fill();
        }
        // גבה
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(cx - 13, ey - 24 - lift + (o < 0 ? 3 : 0));
        c.lineTo(cx + 13, ey - 24 - lift + (o < 0 ? 0 : 3));
        c.stroke();
    }

    // לחיים
    c.fillStyle = 'rgba(255, 90, 100, 0.28)';
    for (const o of [-62, 62]) {
        c.beginPath();
        c.ellipse(m.x + o, m.y - 22, 11, 7, 0, 0, Math.PI * 2);
        c.fill();
    }
}

function svDrawMouthBack(c) {
    const m = sv.mouth, ry = svMouthRy();

    // חלל הפה
    c.fillStyle = '#36090f';
    c.beginPath();
    c.ellipse(m.x, m.y, m.hw, ry, 0, 0, Math.PI * 2);
    c.fill();

    // לשון
    c.save();
    c.beginPath();
    c.ellipse(m.x, m.y, m.hw - 2, ry - 1, 0, 0, Math.PI * 2);
    c.clip();
    c.fillStyle = '#e8707f';
    c.beginPath();
    c.ellipse(m.x, m.y + ry * 0.75, m.hw * 0.6, ry * 0.6, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    // שפה עליונה
    c.strokeStyle = '#e5566b';
    c.lineWidth = 7;
    c.lineCap = 'round';
    c.beginPath();
    c.ellipse(m.x, m.y, m.hw, ry, 0, Math.PI, Math.PI * 2);
    c.stroke();
}

function svDrawLowerLip(c) {
    const m = sv.mouth, ry = svMouthRy();
    c.strokeStyle = '#d9435a';
    c.lineWidth = 9;
    c.lineCap = 'round';
    c.beginPath();
    c.ellipse(m.x, m.y, m.hw, ry, 0, 0, Math.PI);
    c.stroke();

    // קצוות הפה (נקודות הקפיצה)
    c.fillStyle = '#ffb3be';
    for (const side of [-1, 1]) {
        c.beginPath();
        c.arc(m.x + side * m.hw, m.y, 6, 0, Math.PI * 2);
        c.fill();
    }
}

/* ---------- קלט: החלקה ---------- */
(function svBindInput() {
    const cv = document.getElementById('shvartz-canvas');
    if (!cv) return;
    const pt = e => {
        const r = cv.getBoundingClientRect();
        return { x: (e.clientX - r.left) / r.width * SV_W, y: (e.clientY - r.top) / r.height * SV_H };
    };
    cv.addEventListener('pointerdown', e => {
        if (sv && sv.running) sv.started = true;
        if (!sv || !sv.running || !sv.ball || sv.ball.state !== 'ready') return;
        const p = pt(e);
        if (p.y < SV_H * 0.35) return;               // מתחילים את ההחלקה בחלק התחתון
        sv.aim = { x0: p.x, y0: p.y, x: p.x, y: p.y };
        try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        e.preventDefault();
    });
    cv.addEventListener('pointermove', e => {
        if (!sv || !sv.aim) return;
        const p = pt(e);
        sv.aim.x = p.x;
        sv.aim.y = p.y;
        e.preventDefault();
    });
    const finish = e => {
        if (!sv || !sv.aim) return;
        const a = sv.aim;
        sv.aim = null;
        if (e.type === 'pointercancel') return;
        const p = pt(e);
        svLaunch(p.x - a.x0, p.y - a.y0);
    };
    cv.addEventListener('pointerup', finish);
    cv.addEventListener('pointercancel', finish);
})();



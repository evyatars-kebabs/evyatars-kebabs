/* ============================================================
   סקינים של מהדורה מיוחדת - דמויות לא אנושיות עם ציור משלהן.
   הקואורדינטות יחסיות למרכז הפה (0,0); הפה עצמו מצויר בנפרד.
   ============================================================ */
function skBananaBack(c, sk, st) {
    skAuraBack(c, sk, st.t);
    const peel = '#f6d22e', dk = '#c9a20e';
    // קליפה (גוף הבננה)
    c.beginPath();
    c.moveTo(-84, -110);
    c.bezierCurveTo(-104, 20, -96, 220, -58, 330);
    c.lineTo(58, 330);
    c.bezierCurveTo(100, 220, 108, 20, 84, -110);
    c.closePath();
    const g = c.createLinearGradient(-100, 0, 100, 0);
    g.addColorStop(0, dk); g.addColorStop(0.35, peel); g.addColorStop(0.7, '#ffe066'); g.addColorStop(1, dk);
    c.fillStyle = g; c.fill();
    c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
    c.strokeStyle = skA('#8a6a0a', 0.45); c.lineWidth = 2.5;           // רכסים
    for (const x of [-46, 46]) { c.beginPath(); c.moveTo(x, -100); c.quadraticCurveTo(x * 1.12, 110, x * 0.72, 320); c.stroke(); }
    for (const [x, y, r] of [[-56, 60, 6], [60, 120, 5], [-40, 200, 7], [48, 30, 4], [30, 250, 5]]) skE(c, x, y, r, r * 0.8, '#7a5a1a');
    // הפרי הקלוף
    c.beginPath();
    c.moveTo(-62, -100);
    c.bezierCurveTo(-70, -190, -40, -250, 0, -258);
    c.bezierCurveTo(40, -250, 70, -190, 62, -100);
    c.closePath();
    const f = c.createLinearGradient(-60, 0, 60, 0);
    f.addColorStop(0, '#e9dcb0'); f.addColorStop(0.5, '#fff6d8'); f.addColorStop(1, '#e2d3a2');
    c.fillStyle = f; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
    c.strokeStyle = skA('#b8a46a', 0.6); c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, -250); c.lineTo(0, -110); c.stroke();
    // קליפות מקופלות שנופלות לצדדים
    for (const s of [-1, 1]) {
        c.save(); c.scale(s, 1);
        c.beginPath();
        c.moveTo(30, -110);
        c.bezierCurveTo(70, -150, 140, -120, 162, -40);
        c.quadraticCurveTo(150, -10, 136, -26);
        c.bezierCurveTo(124, -80, 100, -96, 86, -96);
        c.closePath();
        const pg = c.createLinearGradient(40, -130, 160, -20);
        pg.addColorStop(0, '#ffe066'); pg.addColorStop(1, dk);
        c.fillStyle = pg; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
        skE(c, 150, -34, 7, 5, '#5a3e0a');
        c.restore();
    }
    // שפת הקליפה בחזית
    c.beginPath();
    c.moveTo(-84, -110); c.lineTo(-56, -132); c.lineTo(-30, -104); c.lineTo(0, -128); c.lineTo(30, -104); c.lineTo(56, -132); c.lineTo(84, -110);
    c.lineTo(84, -96); c.lineTo(-84, -96); c.closePath();
    c.fillStyle = peel; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
    skEyes(c, sk, st);
}

function skLizardBack(c, sk, st) {
    const t = st.t, g1 = '#4caf3c', g2 = '#2e7d2a';
    skAuraBack(c, sk, t);
    // זנב מתפתל
    const wag = Math.sin(t * 2.2) * 14;
    c.lineCap = 'round';
    for (const [w, col] of [[46, SK_OUT], [40, g2], [28, g1]]) {
        c.strokeStyle = col; c.lineWidth = w;
        c.beginPath(); c.moveTo(70, 250); c.bezierCurveTo(200, 260, 210 + wag, 120, 150 + wag, 60); c.stroke();
    }
    skE(c, 148 + wag, 58, 12, 12, g1);
    // גוף ובטן
    skE(c, 0, 190, 112, 150, g1, SK_OUT, 3);
    skE(c, 0, 200, 64, 122, '#cfe68a', skA('#2e5a1a', 0.5), 2);
    c.strokeStyle = skA('#6a8a2a', 0.5); c.lineWidth = 2;
    for (let y = 110; y < 320; y += 22) { c.beginPath(); c.moveTo(-56, y); c.quadraticCurveTo(0, y + 8, 56, y); c.stroke(); }
    // רגליים קדמיות
    for (const s of [-1, 1]) {
        c.strokeStyle = SK_OUT; c.lineWidth = 34; c.beginPath(); c.moveTo(s * 90, 110); c.lineTo(s * 138, 220); c.stroke();
        c.strokeStyle = g1; c.lineWidth = 28; c.beginPath(); c.moveTo(s * 90, 110); c.lineTo(s * 138, 220); c.stroke();
        for (const d of [-16, 0, 16]) skE(c, s * 138 + d, 238, 9, 9, g1, SK_OUT, 2);
    }
    // ראש
    const hg = c.createRadialGradient(-30, -80, 10, 0, -34, 120);
    hg.addColorStop(0, '#7fd06a'); hg.addColorStop(1, g2);
    for (let i = -3; i <= 3; i++) skP(c, [[i * 22 - 10, -110], [i * 22, -136 - (3 - Math.abs(i)) * 5], [i * 22 + 10, -110]], '#f2c230', SK_OUT, 2);
    skE(c, 0, -30, 104, 84, hg, SK_OUT, 3);
    for (const [x, y, r] of [[-70, -10, 8], [-50, 20, 6], [66, -4, 9], [52, 26, 6], [0, -96, 7], [-26, -104, 5], [28, -104, 5]]) skE(c, x, y, r, r, skA('#1e5a1a', 0.55));
    for (const s of [-1, 1]) skE(c, s * 36, -70, 30, 28, '#5cbf48', SK_OUT, 3);     // בליטות העיניים
    skE(c, -12, -26, 4, 3, '#14300f'); skE(c, 12, -26, 4, 3, '#14300f');               // נחיריים
    skEyes(c, sk, st);
}

const DOSUS_PAL = { hc: '#8a5a32', hd: '#5e3a1c', hl: '#a87044', mane: '#2a1a10', coat: '#15151a', collar: '#f7f7fa',
    payot: '#1a1410', hat: '#15151a', band: '#2b2b33', holes: false };
const DOSUS_CHEDDAR = { hc: '#f2a22a', hd: '#c46e08', hl: '#ffd877', mane: '#b8700c', coat: '#e8961c', collar: '#fff3c4',
    payot: '#b8700c', hat: '#e8961c', band: '#c46e08', holes: true };

function skDosusBack(c, sk, st) {
    const P = sk.pal || DOSUS_PAL;
    const t = st.t, hc = P.hc, hd = P.hd;
    skAuraBack(c, sk, t);
    // זנב
    const sw = Math.sin(t * 2) * 10;
    c.strokeStyle = P.mane; c.lineCap = 'round';
    for (let i = 0; i < 5; i++) { c.lineWidth = 9 - i; c.beginPath(); c.moveTo(196, 90); c.quadraticCurveTo(236 + sw, 130 + i * 6, 214 + sw, 210 + i * 6); c.stroke(); }
    // רגליים
    for (const [x, dk] of [[44, 1], [158, 1], [74, 0], [186, 0]]) {
        skR(c, x - 13, 120, 26, 140, 9, dk ? hd : hc, SK_OUT, 2.5);
        skR(c, x - 15, 252, 30, 16, 4, P.mane);
    }
    // גוף הסוס
    const bg = c.createLinearGradient(0, 50, 0, 170);
    bg.addColorStop(0, P.hl); bg.addColorStop(1, hd);
    skE(c, 116, 110, 96, 56, bg, SK_OUT, 3);
    if (P.holes) { const body = new Path2D(); body.ellipse(116, 110, 95, 55, 0, 0, Math.PI * 2); skCheeseHoles(c, body, 30, 60, 180, 100, 9, 5); }
    // צוואר ורעמה
    skP(c, [[-50, 30], [50, 24], [90, 80], [40, 150]], hc, SK_OUT, 3);
    c.strokeStyle = P.mane; c.lineWidth = 12;
    c.beginPath(); c.moveTo(56, 22); c.quadraticCurveTo(80, 50, 96, 76); c.stroke();
    // צווארון לבן של חולצה וחליפה שחורה
    skP(c, [[-60, 46], [60, 46], [64, 84], [-64, 84]], P.coat, SK_OUT, 2);
    skP(c, [[-34, 40], [0, 70], [34, 40], [30, 56], [0, 84], [-30, 56]], P.collar, SK_OUT, 2);
    // ראש אנושי
    skHead(c, sk);
    skEyes(c, sk, st);
    skBeardBack(c, sk, t);
}
function skDosusFront(c, sk, st) {
    const P = sk.pal || DOSUS_PAL;
    skMustache(c, sk);
    skGlasses(c, sk);
    skHairFront(c, sk, st.t);
    // פאות מסולסלות
    for (const s of [-1, 1]) {
        for (let i = 0; i < 6; i++) {
            const y = -60 + i * 18, x = s * (90 + (i % 2 ? 7 : -3));
            c.beginPath(); c.ellipse(x, y, 9, 10, 0, 0, Math.PI * 2);
            c.strokeStyle = P.payot; c.lineWidth = 5; c.stroke();
        }
    }
    // כובע שחור רחב שוליים
    skR(c, -70, -206, 140, 96, 22, P.hat, SK_OUT, 3);
    if (P.holes) { const crown = new Path2D(); crown.rect(-68, -204, 136, 70); skCheeseHoles(c, crown, -68, -204, 136, 70, 6, 2); }
    c.fillStyle = P.band; c.fillRect(-69, -132, 138, 14);
    c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-6, -200); c.lineTo(-6, -140); c.stroke();
    skE(c, 0, -110, 134, 24, P.hat, SK_OUT, 3);
}

const DOG_PAL = { brown: '#6b3a1e', white: '#f6f1e8', earLine: '#3a1e0e', dot: '#7a4a2a', nose: '#1a1410', muzzleEdge: '#8a7a6a', holes: false };
const DOG_CHEDDAR = { brown: '#d98a14', white: '#ffd877', earLine: '#8a4a04', dot: '#a05a08', nose: '#7a3e02', muzzleEdge: '#c27a10', holes: true };

function skDogBack(c, sk, st) {
    const P = sk.pal || DOG_PAL;
    const t = st.t, brown = P.brown, white = P.white;
    skAuraBack(c, sk, t);
    skOutfit(c, sk, t);
    if (P.holes) skCheeseHoles(c, () => skTorsoPath(c), -120, 80, 240, 260, 12, 4);
    // אוזניים ארוכות ומתנופפות
    const flop = Math.sin(t * 2.4) * 0.06;
    for (const s of [-1, 1]) {
        c.save(); c.translate(s * 76, -84); c.rotate(s * (0.18 + flop));
        skE(c, s * 14, 70, 36, 86, brown, SK_OUT, 3);
        if (P.holes) { const ear = new Path2D(); ear.ellipse(s * 14, 70, 35, 85, 0, 0, Math.PI * 2); skCheeseHoles(c, ear, s * 14 - 30, 0, 60, 150, 4, s > 0 ? 13 : 17); }
        c.strokeStyle = skA(P.earLine, 0.6); c.lineWidth = 2.5;
        for (const d of [-14, 0, 14]) { c.beginPath(); c.moveTo(s * 14 + d, 10); c.quadraticCurveTo(s * 14 + d + 6, 80, s * 14 + d - 4, 146); c.stroke(); }
        c.restore();
    }
    // ראש לבן עם כתמים חומים
    const H = SK_HEAD;
    skE(c, H.cx, H.cy, H.rx, H.ry, white, SK_OUT, 3);
    c.save();
    c.beginPath(); c.ellipse(H.cx, H.cy, H.rx - 1.5, H.ry - 1.5, 0, 0, Math.PI * 2); c.clip();
    skE(c, -44, -86, 52, 58, brown); skE(c, 44, -86, 52, 58, brown);
    skE(c, 0, -134, 18, 40, white);                       // פס לבן באמצע המצח
    c.restore();
    if (P.holes) {
        const head = new Path2D(); head.ellipse(H.cx, H.cy, H.rx - 1.5, H.ry - 1.5, 0, 0, Math.PI * 2);
        skCheeseHoles(c, head, H.cx - H.rx * 0.8, H.cy - H.ry, H.rx * 1.6, H.ry * 0.45, 4, 9);
    }
    // לוע
    skE(c, 0, -6, 60, 44, white, skA(P.muzzleEdge, 0.6), 2);
    for (const [x, y] of [[-30, -10], [-22, 0], [-38, 2], [30, -10], [22, 0], [38, 2]]) skE(c, x, y, 2.6, 2.6, P.dot);
    skE(c, 0, -34, 20, 14, P.nose, SK_OUT, 2);
    skE(c, -6, -38, 6, 3.5, 'rgba(255,255,255,0.5)');
    skEyes(c, sk, st);
}

function skOrangeBack(c, sk, st) {
    const t = st.t;
    skAuraBack(c, sk, t);
    // רגליים קטנות
    for (const s of [-1, 1]) { skR(c, s * 50 - 9, 90, 18, 70, 8, '#2e7d2a', SK_OUT, 2); skE(c, s * 50 + s * 8, 164, 22, 11, '#2e7d2a', SK_OUT, 2); }
    // התפוז
    const g = c.createRadialGradient(-44, -80, 14, 0, -20, 136);
    g.addColorStop(0, '#ffc266'); g.addColorStop(0.55, '#ff9a1f'); g.addColorStop(1, '#d9650a');
    skE(c, 0, -20, 128, 124, g, SK_OUT, 3);
    c.save();
    c.beginPath(); c.ellipse(0, -20, 126, 122, 0, 0, Math.PI * 2); c.clip();
    for (let i = 0; i < 70; i++) {                         // נקבוביות הקליפה
        const x = ((i * 67) % 240) - 120, y = ((i * 43) % 230) - 132;
        skE(c, x, y, 2, 2, 'rgba(160, 70, 0, 0.35)');
    }
    c.restore();
    skE(c, -54, -92, 26, 14, 'rgba(255,255,255,0.35)', null, 0, -0.6);
    // עוקץ ועלה
    skR(c, -5, -160, 10, 22, 3, '#6b4a1a', SK_OUT, 2);
    c.save(); c.translate(6, -152); c.rotate(-0.5 + Math.sin(t * 2) * 0.08);
    skE(c, 34, 0, 36, 14, '#3fa33a', SK_OUT, 2.5);
    c.strokeStyle = '#2a6a26'; c.lineWidth = 2; c.beginPath(); c.moveTo(2, 0); c.lineTo(66, 0); c.stroke();
    c.restore();
    skEyes(c, sk, st);
}

function skCapybaraBack(c, sk, st) {
    const t = st.t, gold = '#e9b830', dk = '#9a6a0c', out = '#5a3a06';
    const goldGrad = (x0, y0, r) => {
        const g = c.createRadialGradient(x0 - r * 0.35, y0 - r * 0.4, r * 0.1, x0, y0, r * 1.1);
        g.addColorStop(0, '#fff3b0'); g.addColorStop(0.35, '#ffd54f'); g.addColorStop(0.75, gold); g.addColorStop(1, dk);
        return g;
    };
    skAuraBack(c, sk, t);
    // גוף ורגליים קדמיות
    skE(c, 0, 200, 134, 140, goldGrad(0, 200, 140), out, 3);
    for (const s of [-1, 1]) {
        skR(c, s * 62 - 20, 230, 40, 90, 16, goldGrad(s * 62, 260, 60), out, 3);
        for (const d of [-10, 0, 10]) skE(c, s * 62 + d, 318, 7, 6, dk);
    }
    // אוזניים קטנות
    for (const s of [-1, 1]) { skE(c, s * 66, -134, 20, 18, goldGrad(s * 66, -134, 20), out, 3); skE(c, s * 66, -132, 9, 8, dk); }
    // ראש מלבני עם חוטם רחב
    c.beginPath();
    c.moveTo(-84, -130);
    c.quadraticCurveTo(0, -164, 84, -130);
    c.quadraticCurveTo(104, -40, 96, 30);
    c.quadraticCurveTo(90, 72, 0, 74);
    c.quadraticCurveTo(-90, 72, -96, 30);
    c.quadraticCurveTo(-104, -40, -84, -130);
    c.closePath();
    c.fillStyle = goldGrad(0, -40, 120); c.fill();
    c.strokeStyle = out; c.lineWidth = 3; c.stroke();
    c.strokeStyle = skA('#8a5a08', 0.35); c.lineWidth = 2;               // פרווה
    for (const [x, y] of [[-50, -110], [-20, -118], [20, -118], [50, -110], [-70, 10], [70, 10]]) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 6, y + 14); c.stroke(); }
    // חוטם ונחיריים
    skE(c, 0, -26, 56, 30, skA('#fff3b0', 0.35));
    skE(c, -18, -34, 7, 5, out); skE(c, 18, -34, 7, 5, out);
    // ברק זהב
    skE(c, -52, -96, 18, 9, 'rgba(255,255,255,0.55)', null, 0, -0.5);
    skStar(c, 70, -100, 7 + Math.sin(t * 4) * 2, '#ffffff', t);
    skEyes(c, sk, st);
}

// צבעי הסקין. גרסת הצ'דר מחליפה את הצבעים ומוסיפה חורי גבינה
const VADER_PAL = { g0: '#5a5f6e', g1: '#23252e', g2: '#07070a', out: '#000000', panel: '#2a2c34', panelEdge: '#5a5f6e', belt: '#c9ccd4',
    beltBox: '#9aa1ae', brow: '#3a3d48', lens: ['#2a0608', '#0a0204', '#3a0a0e'], lensEdge: '#4a4f5c', grille: '#2a2c34', plate: '#5a5f6e',
    hilt: '#b8bfcc', hiltBand: '#14141a', holes: false };
const VADER_CHEDDAR = { g0: '#fff0b0', g1: '#f6b43a', g2: '#c46e08', out: '#7a3e02', panel: '#d98a14', panelEdge: '#ffd877', belt: '#ffd877',
    beltBox: '#f0a62a', brow: '#c27a10', lens: ['#8a3e02', '#5e2a00', '#a04a06'], lensEdge: '#7a3e02', grille: '#b8700c', plate: '#ffcf5a',
    hilt: '#ffe08a', hiltBand: '#c27a10', holes: true };

// חורי גבינה בתוך צורה (Path2D או פונקציה שמציירת נתיב). seed קובע את המיקומים
function skCheeseHoles(c, shape, x, y, w, h, n, seed) {
    c.save();
    if (typeof shape === 'function') { shape(); c.clip(); } else c.clip(shape);
    let r = seed * 9301 + 49297;
    const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
    for (let i = 0; i < n; i++) {
        const hx = x + rnd() * w, hy = y + rnd() * h, rad = 5 + rnd() * 11;
        skE(c, hx, hy, rad, rad * 0.85, 'rgba(160, 80, 0, 0.55)');
        skE(c, hx + rad * 0.15, hy + rad * 0.2, rad * 0.75, rad * 0.6, 'rgba(120, 55, 0, 0.45)');
        c.strokeStyle = 'rgba(255, 245, 200, 0.6)'; c.lineWidth = 1.6;
        c.beginPath(); c.arc(hx, hy, rad, Math.PI * 0.15, Math.PI * 0.85); c.stroke();
    }
    c.restore();
}

function skVaderBack(c, sk, st) {
    const P = sk.pal || VADER_PAL;
    const t = st.t, out = P.out;
    const gloss = (x0, y0, r) => {
        const g = c.createRadialGradient(x0 - r * 0.4, y0 - r * 0.5, r * 0.05, x0, y0, r);
        g.addColorStop(0, P.g0); g.addColorStop(0.3, P.g1); g.addColorStop(1, P.g2);
        return g;
    };
    skAuraBack(c, sk, t);
    skCapeBack(c, sk, t);
    // חרב אור אדומה
    const pulse = 0.8 + 0.2 * Math.sin(t * 9);
    c.save();
    c.translate(132, 210); c.rotate(0.38);
    c.lineCap = 'round';
    c.strokeStyle = skA('#ff2a2a', 0.25 * pulse); c.lineWidth = 34; c.beginPath(); c.moveTo(0, -40); c.lineTo(0, -330); c.stroke();
    c.strokeStyle = skA('#ff3030', 0.7); c.lineWidth = 16; c.beginPath(); c.moveTo(0, -40); c.lineTo(0, -330); c.stroke();
    c.strokeStyle = '#ffe8e8'; c.lineWidth = 6; c.beginPath(); c.moveTo(0, -40); c.lineTo(0, -326); c.stroke();
    skR(c, -9, -44, 18, 70, 4, P.hilt, out, 2);
    c.fillStyle = P.hiltBand; for (const y of [-30, -18, -6, 6]) c.fillRect(-9, y, 18, 5);
    c.restore();
    // שריון וחזה עם לוח בקרה
    skOutfit(c, sk, t);
    if (P.holes) skCheeseHoles(c, () => skTorsoPath(c), -120, 70, 240, 270, 16, 3);
    skR(c, -50, 118, 100, 66, 6, P.panel, P.panelEdge, 2.5);
    const lights = ['#ff3030', '#30d158', '#3b9cff', '#ff3030', '#ffd23d', '#30d158'];
    lights.forEach((col, i) => skR(c, -40 + (i % 3) * 28, 128 + Math.floor(i / 3) * 26, 18, 14, 2, (Math.sin(t * 3 + i * 1.7) > -0.3) ? col : skShade(col, -0.6), out, 1.5));
    c.fillStyle = P.belt; c.fillRect(-124, 286, 248, 22);
    for (const x of [-70, -26, 18, 62]) skR(c, x, 282, 30, 30, 3, P.beltBox, out, 1.5);
    // קסדה: כיפה ושוליים מתרחבים
    const helmet = new Path2D();
    helmet.moveTo(-98, -60);
    helmet.bezierCurveTo(-110, -176, 110, -176, 98, -60);
    helmet.quadraticCurveTo(104, 10, 132, 70);
    helmet.lineTo(84, 76); helmet.lineTo(70, 30);
    helmet.lineTo(-70, 30); helmet.lineTo(-84, 76); helmet.lineTo(-132, 70);
    helmet.quadraticCurveTo(-104, 10, -98, -60);
    helmet.closePath();
    c.fillStyle = gloss(0, -70, 170); c.fill(helmet);
    if (P.holes) skCheeseHoles(c, helmet, -130, -170, 260, 240, 14, 7);
    c.strokeStyle = out; c.lineWidth = 3; c.stroke(helmet);
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-6, -158); c.quadraticCurveTo(-60, -150, -84, -96); c.stroke();
    // מסכת פנים
    const mask = new Path2D();
    mask.moveTo(-74, -98); mask.lineTo(74, -98); mask.lineTo(80, -30); mask.lineTo(56, 40); mask.lineTo(-56, 40); mask.lineTo(-80, -30);
    mask.closePath();
    c.fillStyle = gloss(0, -40, 120); c.fill(mask);
    if (P.holes) skCheeseHoles(c, mask, -78, -30, 156, 70, 4, 11);
    c.strokeStyle = out; c.lineWidth = 3; c.stroke(mask);
    c.strokeStyle = P.brow; c.lineWidth = 6;                         // גבה קשתית
    c.beginPath(); c.moveTo(-76, -96); c.quadraticCurveTo(0, -78, 76, -96); c.stroke();
    // עדשות העיניים
    for (const s of [-1, 1]) {
        c.save(); c.scale(s, 1);
        c.beginPath(); c.moveTo(8, -84); c.lineTo(66, -90); c.lineTo(62, -54); c.lineTo(18, -40); c.closePath();
        const lg = c.createLinearGradient(10, -90, 60, -40);
        lg.addColorStop(0, P.lens[0]); lg.addColorStop(0.6, P.lens[1]); lg.addColorStop(1, P.lens[2]);
        c.fillStyle = lg; c.fill(); c.strokeStyle = P.lensEdge; c.lineWidth = 3; c.stroke();
        skGlow(c, 38, -68, 22, '#ff2a2a', 0.35 * pulse);
        skE(c, 30, -76, 7, 3.5, 'rgba(255,255,255,0.55)', null, 0, -0.2);
        c.restore();
    }
    // אף ולוח הנשימה סביב הפה
    skP(c, [[-12, -50], [12, -50], [6, -18], [-6, -18]], P.grille, out, 2);
    skP(c, [[-66, -14], [66, -14], [24, 70], [-24, 70]], P.plate, out, 2.5);
    c.strokeStyle = P.grille; c.lineWidth = 3;
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 12, 20); c.lineTo(i * 8, 64); c.stroke(); }
}

function skKebabBack(c, sk, st) {
    const t = st.t, out = '#2a1206';
    skAuraBack(c, sk, t);
    // שיפוד מתכת עם ידית מוזהבת
    const rod = c.createLinearGradient(-6, 0, 6, 0);
    rod.addColorStop(0, '#8a919e'); rod.addColorStop(0.5, '#eef1f6'); rod.addColorStop(1, '#7a818e');
    skR(c, -6, -290, 12, 640, 6, rod, out, 2);
    skE(c, 0, -300, 22, 22, null, '#e9c46a', 7);
    skStar(c, 0, -300, 7, '#fff3b0', t);
    // בצל קלוי למעלה ועגבנייה קלויה למטה
    skE(c, 0, -206, 58, 24, '#f3e6f4', out, 3);
    skE(c, 0, -206, 36, 13, null, '#c9a2cf', 4);
    skE(c, 0, 286, 64, 30, '#d8402a', out, 3);
    skE(c, -22, 278, 18, 7, 'rgba(255,180,160,0.6)');
    c.strokeStyle = 'rgba(40,10,4,0.55)'; c.lineWidth = 4;
    for (const x of [-30, 0, 30]) { c.beginPath(); c.moveTo(x - 8, 266); c.lineTo(x + 8, 306); c.stroke(); }
    // גליל הקבב: בשר טחון צלוי
    const log = new Path2D();
    log.moveTo(-80, -120);
    log.bezierCurveTo(-82, -196, 82, -196, 80, -120);
    log.bezierCurveTo(90, 0, 88, 150, 74, 214);
    log.bezierCurveTo(60, 268, -60, 268, -74, 214);
    log.bezierCurveTo(-88, 150, -90, 0, -80, -120);
    log.closePath();
    const meat = c.createLinearGradient(-90, 0, 90, 0);
    meat.addColorStop(0, '#5a2a0c'); meat.addColorStop(0.3, '#a8582a'); meat.addColorStop(0.55, '#c47038'); meat.addColorStop(1, '#4e2208');
    c.fillStyle = meat; c.fill(log);
    c.save(); c.clip(log);
    // גבשושיות הבשר
    for (let i = 0; i < 40; i++) {
        const x = ((i * 53) % 150) - 75, y = -170 + ((i * 89) % 420);
        skE(c, x, y, 9 + (i % 3) * 3, 7 + (i % 2) * 3, i % 2 ? 'rgba(255,190,130,0.16)' : 'rgba(60,20,4,0.22)');
    }
    // סימני גריל חרוכים
    c.strokeStyle = 'rgba(30,8,2,0.7)'; c.lineWidth = 10; c.lineCap = 'round';
    for (let y = -150; y < 260; y += 52) {
        if (y > -120 && y < 30) continue;                 // משאירים את הפנים נקיות
        c.beginPath(); c.moveTo(-90, y + 22); c.lineTo(90, y - 22); c.stroke(); }
    // פטרוזיליה ובצל קצוץ
    for (let i = 0; i < 26; i++) {
        const x = ((i * 37) % 140) - 70, y = -160 + ((i * 61) % 400);
        if (i % 3) skR(c, x, y, 6, 3, 1, '#3f9a2a'); else skR(c, x, y, 5, 4, 1, '#f3ead8');
    }
    // ברק שומן
    skE(c, -38, -60, 10, 70, 'rgba(255,230,180,0.18)', null, 0, 0.05);
    c.restore();
    c.strokeStyle = out; c.lineWidth = 3; c.stroke(log);
    // כתר אגדי קטן ומלוכסן
    c.save(); c.translate(26, -166); c.rotate(0.22);
    skP(c, [[-34, 14], [-38, -22], [-18, -6], [0, -30], [18, -6], [38, -22], [34, 14]], '#f2c230', out, 2.5);
    for (const x of [-38, 0, 38]) skE(c, x, x ? -24 : -32, 5, 5, '#ff4d4d', out, 1.5);
    c.restore();
    skEyes(c, sk, st);
}

function skLaffaBack(c, sk, st) {
    const t = st.t, out = '#2a1206';
    skAuraBack(c, sk, t);

    // ----- אדים חמים -----
    c.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
        const ph = (t * 0.35 + i * 0.25) % 1, x0 = -48 + i * 32;
        c.strokeStyle = 'rgba(255,250,240,' + (0.42 * Math.sin(ph * Math.PI)) + ')'; c.lineWidth = 8 - ph * 4;
        c.beginPath();
        c.moveTo(x0, -196 - ph * 70);
        c.bezierCurveTo(x0 + 20, -222 - ph * 70, x0 - 20, -242 - ph * 70, x0 + 6, -268 - ph * 70);
        c.stroke();
    }

    // ----- הלאפה: גליל מעוגל עם פתח למעלה -----
    const laffa = new Path2D();
    laffa.moveTo(-90, -122);
    laffa.bezierCurveTo(-100, -20, -98, 200, -88, 340);
    laffa.lineTo(88, 340);
    laffa.bezierCurveTo(98, 200, 100, -20, 90, -122);
    laffa.closePath();
    const lg = c.createLinearGradient(-100, 0, 100, 0);
    lg.addColorStop(0, '#a8763c'); lg.addColorStop(0.18, '#dcb478'); lg.addColorStop(0.42, '#f6e2b6');
    lg.addColorStop(0.62, '#efd29c'); lg.addColorStop(0.85, '#d2a666'); lg.addColorStop(1, '#9a6a34');
    c.fillStyle = lg; c.fill(laffa);
    c.save(); c.clip(laffa);
    for (let i = 0; i < 26; i++) {                                         // בועות טאבון חרוכות
        const x = ((i * 47) % 170) - 85, y = -112 + ((i * 71) % 200);
        if (Math.abs(x) < 64 && y > -104 && y < 34) continue;              // לא על הפנים
        const r = 6 + (i % 3) * 4;
        skE(c, x, y, r, r * 0.7, 'rgba(130,70,20,0.22)', null, 0, i);
        skE(c, x + 1, y + 1, r * 0.55, r * 0.4, 'rgba(80,35,8,0.3)', null, 0, i);
    }
    // שכבת הגלגול: הקצה של הלאפה מסתלסל לאורך הצד
    c.strokeStyle = 'rgba(140,90,40,0.55)'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(70, -118); c.bezierCurveTo(82, -30, 80, 40, 66, 120); c.stroke();
    c.strokeStyle = 'rgba(255,240,210,0.45)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(64, -112); c.bezierCurveTo(76, -30, 74, 40, 60, 118); c.stroke();
    c.restore();
    c.strokeStyle = out; c.lineWidth = 3; c.stroke(laffa);

    // פתח הגליל (החלק הפנימי של הלאפה)
    skE(c, 0, -124, 90, 24, '#c9945a', out, 3);
    skE(c, 0, -120, 78, 17, '#7a4a20');

    // ----- המילוי שגולש החוצה (מוגדל כדי שייראה עשיר) -----
    c.save();
    c.translate(0, -126); c.scale(1.15, 1.15); c.translate(0, 156);
    // צ'יפס
    for (const [x, y, r] of [[-58, -206, -0.55], [56, -212, 0.5], [-20, -236, -0.15], [24, -240, 0.2]]) {
        c.save(); c.translate(x, y); c.rotate(r);
        const fg = c.createLinearGradient(-8, 0, 8, 0);
        fg.addColorStop(0, '#e0a52a'); fg.addColorStop(0.5, '#ffe07a'); fg.addColorStop(1, '#d0901c');
        skR(c, -8, -26, 16, 56, 4, fg, '#8a5a10', 2);
        c.restore();
    }
    // ערימת רצועות שווארמה מבריקות
    const strips = [[-62, -166, -0.5], [-36, -184, 0.3], [-6, -172, -0.2], [26, -188, 0.45], [56, -168, -0.35],
                    [-48, -150, 0.2], [-14, -200, -0.6], [18, -156, 0.1], [46, -150, 0.6], [4, -214, 0.25]];
    for (const [x, y, r] of strips) {
        c.save(); c.translate(x, y); c.rotate(r);
        const g = c.createLinearGradient(0, -13, 0, 13);
        g.addColorStop(0, '#e8a050'); g.addColorStop(0.45, '#b45a22'); g.addColorStop(1, '#5a240a');
        c.beginPath();
        c.moveTo(-28, -6); c.quadraticCurveTo(-10, -16, 10, -10); c.quadraticCurveTo(30, -6, 30, 4);
        c.quadraticCurveTo(12, 14, -8, 10); c.quadraticCurveTo(-30, 8, -28, -6); c.closePath();
        c.fillStyle = g; c.fill(); c.strokeStyle = out; c.lineWidth = 2; c.stroke();
        c.strokeStyle = 'rgba(40,10,2,0.65)'; c.lineWidth = 2.5;          // חריכה
        c.beginPath(); c.moveTo(-18, 2); c.lineTo(-4, -4); c.moveTo(4, 4); c.lineTo(18, -2); c.stroke();
        c.strokeStyle = 'rgba(255,230,180,0.55)'; c.lineWidth = 2;        // ברק שומן
        c.beginPath(); c.moveTo(-16, -8); c.quadraticCurveTo(0, -12, 16, -7); c.stroke();
        c.restore();
    }
    // פלחי עגבנייה
    for (const [x, y, r] of [[-70, -178, -0.4], [40, -204, 0.5], [72, -178, 0.3]]) {
        c.save(); c.translate(x, y); c.rotate(r);
        c.beginPath(); c.arc(0, 0, 16, Math.PI, 0); c.closePath();
        c.fillStyle = '#e23a26'; c.fill(); c.strokeStyle = out; c.lineWidth = 2; c.stroke();
        skE(c, 0, -5, 10, 6, '#ff8a6a');
        for (const d of [-5, 0, 5]) skE(c, d, -5, 1.6, 2.2, '#ffe08a');
        c.restore();
    }
    // טבעות בצל סגול עם סומק
    for (const [x, y] of [[-30, -214], [52, -190], [-64, -196]]) {
        skE(c, x, y, 15, 9, null, '#b04aa0', 4);
        skE(c, x, y, 8, 5, null, '#e0a8d8', 2.5);
    }
    // מלפפון חמוץ ומלפפון טרי
    for (const [x, y, r] of [[-4, -230, 0.3], [64, -206, -0.4]]) {
        c.save(); c.translate(x, y); c.rotate(r);
        skE(c, 0, 0, 14, 9, '#5a7a1a', out, 2); skE(c, 0, 0, 9, 5.5, '#c4d880');
        for (const d of [-4, 0, 4]) skE(c, d, 0, 1.2, 1.2, '#7a9a2a');
        c.restore();
    }
    for (const [x, y] of [[-46, -226], [30, -222], [-80, -168], [10, -246]]) skR(c, x - 7, y - 7, 14, 14, 3, '#6abf4b', out, 1.5);
    // פטרוזיליה
    for (let i = 0; i < 16; i++) {
        const x = -70 + (i * 29) % 140, y = -160 - (i * 23) % 90;
        c.save(); c.translate(x, y); c.rotate(i);
        skE(c, -3, 0, 4.5, 3, '#2f8a2a'); skE(c, 3, -1, 4.5, 3, '#3fa33a'); skE(c, 0, -4, 4, 3, '#2f8a2a');
        c.restore();
    }
    // סומק אדום מפוזר
    for (let i = 0; i < 20; i++) skE(c, -70 + (i * 31) % 140, -150 - (i * 19) % 80, 1.6, 1.6, '#9a1a1a');
    // טחינה ועמבה בזיגזג
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = '#f7eedb'; c.lineWidth = 4.5;
    c.beginPath(); c.moveTo(-74, -176); c.lineTo(-44, -206); c.lineTo(-20, -168); c.lineTo(6, -212); c.lineTo(30, -170); c.lineTo(56, -206); c.lineTo(76, -176); c.stroke();
    c.strokeStyle = '#f2a91c'; c.lineWidth = 3.5;
    c.beginPath(); c.moveTo(-62, -200); c.lineTo(-34, -172); c.lineTo(-8, -220); c.lineTo(20, -180); c.lineTo(46, -222); c.lineTo(66, -192); c.stroke();
    c.restore();
    // טפטופי רוטב שזולגים על הלאפה
    const drip = (x, len, col, w) => {
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(x - w, -128); c.lineTo(x - w * 0.8, -128 + len); c.arc(x, -128 + len, w * 0.95, Math.PI, 0, true); c.lineTo(x + w, -128);
        c.closePath(); c.fill();
    };
    const sway = Math.sin(t * 1.5) * 4;
    drip(-56, 34 + sway, '#f7eedb', 7);
    drip(-34, 24, '#f7eedb', 5);
    drip(48, 40 - sway, '#f2a91c', 6);
    drip(70, 30, '#f7eedb', 6);

    // ----- עטיפת נייר חום / עיתון -----
    const paper = new Path2D();
    paper.moveTo(-100, 66);
    paper.lineTo(-66, 46); paper.lineTo(-38, 72); paper.lineTo(-6, 42); paper.lineTo(26, 70); paper.lineTo(60, 44); paper.lineTo(100, 64);
    paper.bezierCurveTo(108, 150, 106, 260, 98, 352);
    paper.lineTo(-98, 352);
    paper.bezierCurveTo(-106, 260, -108, 150, -100, 66);
    paper.closePath();
    const pg = c.createLinearGradient(-106, 0, 106, 0);
    pg.addColorStop(0, '#5e3e1e'); pg.addColorStop(0.25, '#9a7040'); pg.addColorStop(0.45, '#b4884f'); pg.addColorStop(0.7, '#9e7444'); pg.addColorStop(1, '#54361a');
    c.fillStyle = pg; c.fill(paper);
    c.save(); c.clip(paper);
    // צד פנימי בהיר של הנייר בקצה הקרוע
    c.fillStyle = 'rgba(230,205,160,0.55)';
    c.beginPath(); c.moveTo(-66, 46); c.lineTo(-38, 72); c.lineTo(-52, 78); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(60, 44); c.lineTo(26, 70); c.lineTo(46, 76); c.closePath(); c.fill();
    // דפוס עיתון דהוי
    c.save(); c.translate(-4, 112); c.rotate(-0.05);
    c.fillStyle = 'rgba(30,18,8,0.7)';
    c.font = 'bold 22px "Secular One", Rubik, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('חדשות הקבביה', 0, 0);
    c.fillStyle = 'rgba(30,18,8,0.32)'; c.fillRect(-90, 14, 180, 3);
    c.fillStyle = 'rgba(30,18,8,0.45)';
    for (let col = 0; col < 3; col++) {
        for (let r = 0; r < 10; r++) {
            const w = r % 4 === 3 ? 26 : 46;
            c.fillRect(-88 + col * 60 + (46 - w), 24 + r * 11, w, 4);
        }
    }
    c.fillStyle = 'rgba(30,18,8,0.28)'; c.fillRect(-88, 140, 72, 48);
    c.strokeStyle = 'rgba(30,18,8,0.4)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-80, 180); c.lineTo(-60, 154); c.lineTo(-44, 170); c.lineTo(-26, 158); c.stroke();
    c.restore();
    // קמטים בנייר
    for (const [x0, y0, x1, y1] of [[-66, 46, -46, 352], [60, 44, 44, 352], [-6, 42, 2, 130], [-90, 200, -40, 240], [80, 150, 40, 210]]) {
        c.strokeStyle = 'rgba(40,24,10,0.4)'; c.lineWidth = 2.5;
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        c.strokeStyle = 'rgba(255,235,200,0.22)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x0 + 3, y0); c.lineTo(x1 + 3, y1); c.stroke();
    }
    // כתמי שומן שקופים
    for (const [x, y, r] of [[44, 100, 20], [-56, 236, 26], [32, 276, 14], [70, 196, 12]]) {
        skE(c, x, y, r, r * 0.8, 'rgba(60,32,8,0.25)');
        skE(c, x - r * 0.25, y - r * 0.2, r * 0.45, r * 0.3, 'rgba(255,240,200,0.14)');
    }
    c.restore();
    c.strokeStyle = '#3a2410'; c.lineWidth = 3; c.stroke(paper);
    // מדבקה עגולה של הקבביה
    c.save(); c.translate(52, 250); c.rotate(0.18);
    skE(c, 0, 0, 30, 30, '#d6291f', '#7a1208', 3);
    skE(c, 0, 0, 23, 23, null, '#ffd23d', 2.5);
    c.fillStyle = '#ffffff'; c.font = 'bold 13px "Secular One", Rubik, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('הקבביה', 0, -4);
    c.fillStyle = '#ffd23d'; c.font = '12px sans-serif'; c.fillText('★★★', 0, 10);
    c.restore();

    skEyes(c, sk, st);
}

function skMouseBack(c, sk, st) {
    const t = st.t, blk = '#15151a', skin = '#f6c9a0';
    const mag = !!sk.magician;
    skAuraBack(c, sk, t);
    if (mag) skCapeBack(c, sk, t);
    // שרביט ביד עם כפפה לבנה (קוסם: שרביט שחור עם קצוות לבנים)
    c.save(); c.translate(118, 230); c.rotate(0.42 + Math.sin(t * 2) * 0.06);
    if (mag) {
        skR(c, -5, -150, 10, 150, 4, '#111114', '#000', 2);
        skR(c, -5.5, -156, 11, 26, 4, '#ffffff', '#2a2a30', 2);
        for (let i = 0; i < 4; i++) {                                // נצנוצים סביב הקצה
            const a = t * 2.2 + i * Math.PI / 2, tw = 0.5 + 0.5 * Math.sin(t * 6 + i * 2);
            skStar(c, Math.cos(a) * 24, -150 + Math.sin(a) * 24, 4 + tw * 4, 'rgba(255,240,170,' + (0.4 + tw * 0.6) + ')', a);
        }
    } else {
        skR(c, -5, -150, 10, 150, 4, '#6b4a2c', '#2a1206', 2);
        skGlow(c, 0, -158, 34, '#9fd4ff', 0.6 + 0.3 * Math.sin(t * 5));
        skStar(c, 0, -158, 13, '#fff3b0', t * 2);
    }
    skE(c, 0, 4, 24, 20, '#ffffff', '#2a2a30', 2.5);
    for (const x of [-12, 0, 12]) { c.strokeStyle = '#2a2a30'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, -6); c.lineTo(x, 8); c.stroke(); }
    c.restore();
    // גלימה אדומה / טוקסידו של קוסם
    skOutfit(c, sk, t);
    if (mag) skTuxedo(c);
    // אוזניים עגולות גדולות
    for (const s of [-1, 1]) {
        const g = c.createRadialGradient(s * 108 - 14, -164, 6, s * 108, -148, 52);
        g.addColorStop(0, '#3a3a44'); g.addColorStop(1, blk);
        skE(c, s * 110, -146, 50, 50, g, '#000', 3);
    }
    // ראש שחור ופנים בצבע עור
    const H = SK_HEAD;
    skE(c, H.cx, H.cy, H.rx, H.ry, blk, '#000', 3);
    const face = new Path2D();
    face.ellipse(0, -2, 66, 56, 0, 0, Math.PI * 2);
    face.ellipse(-28, -68, 28, 40, 0, 0, Math.PI * 2);
    face.ellipse(28, -68, 28, 40, 0, 0, Math.PI * 2);
    const fg = c.createRadialGradient(-20, -60, 10, 0, -30, 110);
    fg.addColorStop(0, '#ffe2c4'); fg.addColorStop(1, '#e8a878');
    c.fillStyle = fg; c.fill(face, 'nonzero');
    skE(c, 0, -32, 18, 12, blk, '#000', 2);                           // אף
    skE(c, -5, -36, 6, 3.5, 'rgba(255,255,255,0.6)');
    skEyes(c, sk, st);
}
// טוקסידו: דשים שחורים מבריקים מעל חולצה לבנה, פפיון אדום וכפתורים
function skTuxedo(c) {
    c.save(); skTorsoPath(c); c.clip();
    for (const s of [-1, 1]) {
        skP(c, [[s * 124, 340], [s * 124, 100], [s * 62, 84], [s * 8, 170], [s * 10, 340]], '#17171c', 'rgba(0,0,0,0.6)', 3);
        const lg = c.createLinearGradient(s * 60, 84, s * 20, 200);
        lg.addColorStop(0, '#4a4a56'); lg.addColorStop(1, '#22222a');
        skP(c, [[s * 62, 84], [s * 8, 170], [s * 30, 196], [s * 70, 120]], lg, 'rgba(0,0,0,0.7)', 2);   // דש סאטן
    }
    skR(c, 62, 150, 34, 7, 2, '#f3f3f6');                              // ממחטה בכיס
    skP(c, [[64, 150], [72, 138], [80, 150], [88, 140], [94, 150]], '#e03a3e', 'rgba(0,0,0,0.4)', 1.5);
    for (const y of [210, 250]) skE(c, 0, y, 5, 5, '#15151a', '#000', 1);   // כפתורי חולצה
    c.restore();
    skTorsoPath(c); c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
    // צווארון לבן ופפיון אדום
    skP(c, [[-34, 46], [0, 74], [-12, 92]], '#ffffff', SK_OUT, 2);
    skP(c, [[34, 46], [0, 74], [12, 92]], '#ffffff', SK_OUT, 2);
    skP(c, [[0, 80], [-34, 64], [-36, 98]], '#d6291f', SK_OUT, 2.5);
    skP(c, [[0, 80], [34, 64], [36, 98]], '#d6291f', SK_OUT, 2.5);
    skE(c, 0, 80, 9, 9, '#a81c14', SK_OUT, 2.5);
}

// מגבעת של קוסם עם סרט אדום
function skTopHat(c, t) {
    c.save();
    c.translate(0, -122); c.rotate(-0.08 + Math.sin(t * 1.6) * 0.02);
    const g = c.createLinearGradient(-58, 0, 58, 0);
    g.addColorStop(0, '#0c0c10'); g.addColorStop(0.35, '#3a3a46'); g.addColorStop(1, '#0c0c10');
    skE(c, 0, 4, 96, 18, '#121216', '#000', 3);                        // שוליים
    c.beginPath();
    c.moveTo(-56, 0); c.lineTo(-62, -118);
    c.quadraticCurveTo(0, -134, 62, -118);
    c.lineTo(56, 0); c.quadraticCurveTo(0, 12, -56, 0); c.closePath();
    c.fillStyle = g; c.fill(); c.strokeStyle = '#000'; c.lineWidth = 3; c.stroke();
    skE(c, 0, -120, 62, 12, '#1e1e26', '#000', 3);                     // מכסה
    c.save(); c.clip(new Path2D('M-60 -34 L60 -34 L58 -6 Q0 6 -58 -6 Z'));
    c.fillStyle = '#d6291f'; c.fillRect(-64, -40, 128, 50);
    c.restore();
    c.strokeStyle = '#000'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-60, -34); c.quadraticCurveTo(0, -24, 60, -34); c.stroke();
    skStar(c, 34, -20, 7, '#ffd23d', t);
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 6;            // ברק
    c.beginPath(); c.moveTo(-34, -108); c.lineTo(-30, -44); c.stroke();
    c.restore();
}

function skMouseFront(c, sk, st) {
    if (sk.magician) { skTopHat(c, st.t); return; }
    c.save();
    c.translate(0, -40); c.scale(0.86, 0.86);                // הכובע מורם כדי לא להסתיר את הפנים
    skHatOver(c, sk, st.t);
    c.restore();
}

const DENI_PORTLAND = { base: '#121216', stripes: [[30, '#e03a3e'], [10, '#ffffff']], trim: ['#ffffff', '#e03a3e'],
    text: 'PORTLAND', textCol: '#ffffff', numFill: '#e03a3e', numStroke: '#ffffff' };
const DENI_ISRAEL = { base: '#f7f8fc', stripes: [[30, '#0038b8'], [10, '#7fa6ff']], trim: ['#0038b8', '#ffffff'],
    text: 'ISRAEL', textCol: '#0038b8', numFill: '#0038b8', numStroke: '#ffffff', star: true };

// מגן דוד קטן (שני משולשים חופפים)
function skStarOfDavid(c, x, y, r, col, lw) {
    c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = 'round';
    for (const rot of [-Math.PI / 2, Math.PI / 2]) {
        c.beginPath();
        for (let i = 0; i < 3; i++) { const a = rot + i * Math.PI * 2 / 3; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); }
        c.closePath(); c.stroke();
    }
}

function skDeniBack(c, sk, st) {
    const t = st.t, tone = sk.tone, out = SK_OUT, J = sk.jersey || DENI_PORTLAND;
    skAuraBack(c, sk, t);
    // צוואר, כתפיים וזרועות חשופות (גופייה)
    skR(c, -28, 26, 56, 56, 12, skShade(tone, -0.12), null);
    skTorsoPath(c);
    const sg = c.createLinearGradient(-124, 0, 124, 0);
    sg.addColorStop(0, skShade(tone, -0.25)); sg.addColorStop(0.5, tone); sg.addColorStop(1, skShade(tone, -0.25));
    c.fillStyle = sg; c.fill();
    c.strokeStyle = out; c.lineWidth = 3; c.stroke();
    c.strokeStyle = skA(skShade(tone, -0.4), 0.5); c.lineWidth = 2.5;      // שרירי כתפיים
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 112, 120); c.quadraticCurveTo(s * 100, 170, s * 116, 220); c.stroke(); }
    // גופייה שחורה - הכתפיות עולות מעל הכתפיים עד הצוואר (נחתכות לפי קו הכתף)
    const jersey = new Path2D();
    jersey.moveTo(-76, 20);
    jersey.lineTo(-30, 20);
    jersey.lineTo(-30, 62);
    jersey.quadraticCurveTo(0, 150, 30, 62);
    jersey.lineTo(30, 20);
    jersey.lineTo(76, 20);
    jersey.lineTo(70, 76);
    jersey.bezierCurveTo(74, 126, 82, 160, 100, 176);
    jersey.lineTo(98, 350);
    jersey.lineTo(-98, 350);
    jersey.lineTo(-100, 176);
    jersey.bezierCurveTo(-82, 160, -74, 126, -70, 76);
    jersey.closePath();
    c.save();
    skTorsoPath(c); c.clip();
    c.fillStyle = J.base; c.fill(jersey);
    c.save(); c.clip(jersey);
    // פסים אלכסוניים בצד
    for (const [w, col] of J.stripes) {
        c.strokeStyle = col; c.lineWidth = w;
        c.beginPath(); c.moveTo(-130, 250); c.quadraticCurveTo(-70, 300, -40, 360); c.stroke();
    }
    c.restore();
    // שוליים אדומים-לבנים בצוואר ובבתי השרוול
    for (const [w, col] of [[11, SK_OUT], [9, J.trim[0]], [5, J.trim[1]]]) {
        c.strokeStyle = col; c.lineWidth = w;
        c.beginPath(); c.moveTo(-30, 20); c.lineTo(-30, 62); c.quadraticCurveTo(0, 150, 30, 62); c.lineTo(30, 20); c.stroke();
        c.beginPath(); c.moveTo(76, 20); c.lineTo(70, 76); c.bezierCurveTo(74, 126, 82, 160, 100, 176); c.stroke();
        c.beginPath(); c.moveTo(-76, 20); c.lineTo(-70, 76); c.bezierCurveTo(-74, 126, -82, 160, -100, 176); c.stroke();
    }
    // צד הגוף - הזרועות נשארות חשופות
    c.strokeStyle = SK_OUT; c.lineWidth = 3;
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 100, 176); c.lineTo(sd * 98, 350); c.stroke(); }
    c.restore();
    skTorsoPath(c); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
    // כיתוב ומספר
    c.save();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 30px "Arial Black", Arial, sans-serif';
    c.fillStyle = J.textCol;
    c.fillText(J.text, 0, 178);
    c.font = 'bold 74px "Arial Black", Arial, sans-serif';
    c.lineWidth = 7; c.strokeStyle = J.numStroke; c.lineJoin = 'round';
    c.strokeText('8', 0, 246);
    c.fillStyle = J.numFill; c.fillText('8', 0, 246);
    c.restore();
    if (J.star) skStarOfDavid(c, 54, 128, 13, J.textCol, 3.5);
    // ראש ופנים
    skHead(c, sk);
    // לחיים מגולחות - צל זיפים עדין בלבד
    const bc = sk.beard.color;
    c.beginPath();
    c.moveTo(-82, -30); c.quadraticCurveTo(-84, 50, 0, 60); c.quadraticCurveTo(84, 50, 82, -30);
    c.quadraticCurveTo(56, 26, 0, 26); c.quadraticCurveTo(-56, 26, -82, -30); c.closePath();
    c.fillStyle = skA(bc, 0.1); c.fill();
    // זקנקן קצר ומסודר סביב הפה והסנטר
    const goatee = new Path2D();
    goatee.moveTo(-50, -6);
    goatee.bezierCurveTo(-54, 30, -34, 58, 0, 60);
    goatee.bezierCurveTo(34, 58, 54, 30, 50, -6);
    goatee.lineTo(40, -2);
    goatee.bezierCurveTo(40, 22, 24, 34, 0, 34);
    goatee.bezierCurveTo(-24, 34, -40, 22, -40, -2);
    goatee.closePath();
    c.fillStyle = skA(bc, 0.88); c.fill(goatee);
    c.save(); c.clip(goatee);
    for (let i = 0; i < 40; i++) {                                        // מרקם שיער
        const x = ((i * 29) % 104) - 52, y = -6 + ((i * 41) % 66);
        c.fillStyle = i % 2 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.2)';
        c.fillRect(x, y, 2, 4);
    }
    c.restore();
    skEyes(c, sk, st);
}
function skDeniFront(c, sk, st) {
    const t = st.t, col = sk.hair.color, hl = skShade(col, 0.25);
    // שיער גלי עם נפח למעלה וצדדים קצרים
    const hair = new Path2D();
    hair.moveTo(-90, -44);
    hair.bezierCurveTo(-98, -96, -92, -140, -62, -158);
    hair.bezierCurveTo(-46, -178, -20, -172, -8, -180);
    hair.bezierCurveTo(14, -192, 40, -178, 54, -170);
    hair.bezierCurveTo(84, -160, 100, -124, 92, -44);
    hair.lineTo(84, -64);
    hair.bezierCurveTo(78, -104, 56, -116, 30, -114);
    hair.bezierCurveTo(14, -124, -4, -130, -18, -120);         // גל שנופל על המצח
    hair.bezierCurveTo(-30, -110, -40, -112, -50, -116);
    hair.bezierCurveTo(-70, -116, -82, -96, -84, -64);
    hair.closePath();
    const hg = c.createLinearGradient(0, -190, 0, -60);
    hg.addColorStop(0, skShade(col, 0.15)); hg.addColorStop(1, skShade(col, -0.2));
    c.fillStyle = hg; c.fill(hair);
    c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke(hair);
    // קווי גלים בתוך השיער
    c.save(); c.clip(hair);
    c.strokeStyle = skA(hl, 0.8); c.lineWidth = 3; c.lineCap = 'round';
    for (const [x0, y0, x1, y1, cx, cy] of [[-70, -120, -30, -160, -62, -152], [-40, -116, 10, -168, -30, -150],
                                             [-6, -120, 44, -160, 10, -152], [30, -112, 76, -140, 50, -140]]) {
        c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke();
    }
    c.strokeStyle = skA('#000000', 0.25);
    for (const [x0, y0, x1, y1] of [[-56, -110, -20, -140], [14, -110, 50, -134]]) {
        c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 - 10, y1, x1, y1 - 8); c.stroke();
    }
    c.restore();
    // שפם דק שמתחבר לזקן
    c.strokeStyle = skA(sk.beard.color, 0.92); c.lineWidth = 7; c.lineCap = 'round';
    for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 6, -20); c.quadraticCurveTo(s * 30, -24, s * 46, -6); c.stroke(); }
    // כדורסל
    c.save(); c.translate(118, 252); c.rotate(t * 0.8);
    const bg = c.createRadialGradient(-16, -18, 6, 0, 0, 52);
    bg.addColorStop(0, '#ffa64d'); bg.addColorStop(1, '#c4520e');
    skE(c, 0, 0, 50, 50, bg, '#2a1206', 3);
    c.strokeStyle = '#2a1206'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-50, 0); c.lineTo(50, 0); c.moveTo(0, -50); c.lineTo(0, 50); c.stroke();
    c.beginPath(); c.arc(-62, 0, 44, -0.8, 0.8); c.stroke();
    c.beginPath(); c.arc(62, 0, 44, Math.PI - 0.8, Math.PI + 0.8); c.stroke();
    c.restore();
}

function skHedgehogBack(c, sk, st) {
    const t = st.t, blue = '#1f5fd6', dk = '#123c94', peach = '#f3c99a', out = '#0a1a40';
    const bg = (x0, y0, r) => {
        const g = c.createRadialGradient(x0 - r * 0.3, y0 - r * 0.4, r * 0.1, x0, y0, r);
        g.addColorStop(0, '#4a8cff'); g.addColorStop(0.6, blue); g.addColorStop(1, dk);
        return g;
    };
    skAuraBack(c, sk, t);
    // קווי מהירות
    c.strokeStyle = 'rgba(160,210,255,0.45)'; c.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
        const y = -160 + i * 64, ph = (t * 1.6 + i * 0.37) % 1;
        c.lineWidth = 4; c.globalAlpha = 1 - ph;
        c.beginPath(); c.moveTo(150 + ph * 60, y); c.lineTo(210 + ph * 60, y); c.stroke();
        c.beginPath(); c.moveTo(-150 - ph * 60, y + 30); c.lineTo(-210 - ph * 60, y + 30); c.stroke();
    }
    c.globalAlpha = 1;
    // קוצים לאחור
    // קוצים שנסחפים לאחור ולצדדים, עם קצה מעוקל כלפי מטה
    const quills = [[-1, 0.15, 190], [1, 0.15, 190], [-1, 0.55, 200], [1, 0.55, 200], [-1, 0.95, 180], [1, 0.95, 180], [-1, -0.25, 150], [1, -0.25, 150]];
    for (const [sd, a, len] of quills) {
        const cy = -60, ang = Math.PI / 2 + sd * (Math.PI / 2 + a);   // זווית מהמרכז החוצה
        const bx = Math.cos(ang), by = Math.sin(ang);
        const px = -by, py = bx;                                        // ניצב
        const tipX = bx * len + sd * 10, tipY = cy + by * len + 24;
        c.beginPath();
        c.moveTo(px * 46, cy + py * 46);
        c.quadraticCurveTo(bx * len * 0.7 + px * 20, cy + by * len * 0.7 + py * 20 - 10, tipX, tipY);
        c.quadraticCurveTo(bx * len * 0.6 - px * 14, cy + by * len * 0.6 - py * 14 + 14, -px * 46, cy - py * 46);
        c.closePath();
        c.fillStyle = bg(bx * 100, cy + by * 100, 130); c.fill();
        c.strokeStyle = out; c.lineWidth = 3; c.stroke();
    }
    // גוף, בטן וכפפות
    skE(c, 0, 200, 96, 144, bg(0, 180, 150), out, 3);
    skE(c, 0, 222, 54, 94, peach, skA(out, 0.4), 2);
    for (const s of [-1, 1]) {
        skR(c, s * 100 - 22, 196, 44, 22, 8, '#ffffff', out, 2.5);
        skE(c, s * 100, 242, 32, 30, '#ffffff', out, 3);
        c.strokeStyle = '#c9ccd4'; c.lineWidth = 2;
        for (const d of [-10, 2, 14]) { c.beginPath(); c.moveTo(s * 100 + d, 220); c.lineTo(s * 100 + d, 236); c.stroke(); }
    }
    // אוזניים
    for (const s of [-1, 1]) {
        skP(c, [[s * 30, -110], [s * 76, -176], [s * 86, -96]], bg(s * 60, -140, 70), out, 3);
        skP(c, [[s * 46, -112], [s * 74, -158], [s * 76, -106]], peach);
    }
    // ראש
    skE(c, SK_HEAD.cx, SK_HEAD.cy, SK_HEAD.rx, SK_HEAD.ry, bg(0, -40, 120), out, 3);
    // לוע בצבע אפרסק
    const muzzle = new Path2D();
    muzzle.ellipse(0, -4, 66, 54, 0, 0, Math.PI * 2);
    muzzle.ellipse(-46, -30, 26, 22, 0, 0, Math.PI * 2);
    muzzle.ellipse(46, -30, 26, 22, 0, 0, Math.PI * 2);
    c.fillStyle = peach; c.fill(muzzle);
    // עיניים גדולות מחוברות (קו מתאר חיצוני בלבד), אישונים ירוקים שעוקבים אחרי האוכל
    c.lineWidth = 6; c.strokeStyle = out;
    skE(c, -26, -66, 30, 38, null, out, 6, -0.12); skE(c, 26, -66, 30, 38, null, out, 6, 0.12);
    skE(c, -26, -66, 30, 38, '#ffffff', null, 0, -0.12); skE(c, 26, -66, 30, 38, '#ffffff', null, 0, 0.12);
    for (const o of [-24, 24]) {
        if (st.chew > 0.25) {
            c.strokeStyle = '#0a1a40'; c.lineWidth = 5; c.lineCap = 'round';
            c.beginPath(); c.arc(o, -58, 14, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
            continue;
        }
        const ang = Math.atan2(st.ty - (st.my - 62), st.tx - (st.mx + o));
        const d = Math.min(9, Math.hypot(st.tx - (st.mx + o), st.ty - (st.my - 62)) / 22);
        const px = o + Math.cos(ang) * d, py = -62 + Math.sin(ang) * d;
        skE(c, px, py, 13, 16, '#1f9a4a');
        skE(c, px, py, 7, 9, '#0a0a0a');
        skE(c, px - 3, py - 5, 3, 4, '#ffffff');
    }
    skE(c, 0, -30, 14, 10, '#111', out, 1.5);                              // אף
    skE(c, -4, -33, 5, 3, 'rgba(255,255,255,0.7)');
    // טבעות זהב מסתובבות
    for (const [x, y, ph] of [[-150, -110, 0], [150, 10, 1.6], [-136, 150, 3.1]]) {
        const sx = Math.abs(Math.cos(t * 3 + ph));
        c.save(); c.translate(x, y + Math.sin(t * 2 + ph) * 6); c.scale(Math.max(0.12, sx), 1);
        skGlow(c, 0, 0, 30, '#ffd23d', 0.5);
        c.beginPath(); c.arc(0, 0, 16, 0, Math.PI * 2);
        c.strokeStyle = '#a8760a'; c.lineWidth = 8; c.stroke();
        c.strokeStyle = '#ffd54f'; c.lineWidth = 5; c.stroke();
        c.restore();
    }
}

// בקבוק זכוכית של משקה מוגז (צורת "מותניים" קלאסית).
// sk.bottle: { label, labelDark, ribbon, text, textColor, sub, cap, liquid: [ארבעה צבעים, משמאל לימין] }
function skBottleBack(c, sk, st) {
    const t = st.t, bt = sk.bottle, out = '#140806';
    // קו המתאר של הבקבוק: צוואר צר, כתפיים, בטן, מותניים ובסיס
    const glass = new Path2D();
    glass.moveTo(-24, -196);
    glass.lineTo(-24, -170);
    glass.bezierCurveTo(-26, -140, -76, -120, -80, -60);
    glass.bezierCurveTo(-84, -10, -86, 60, -70, 110);
    glass.bezierCurveTo(-60, 150, -62, 190, -76, 240);
    glass.bezierCurveTo(-86, 280, -84, 320, -70, 340);
    glass.lineTo(70, 340);
    glass.bezierCurveTo(84, 320, 86, 280, 76, 240);
    glass.bezierCurveTo(62, 190, 60, 150, 70, 110);
    glass.bezierCurveTo(86, 60, 84, -10, 80, -60);
    glass.bezierCurveTo(76, -120, 26, -140, 24, -170);
    glass.lineTo(24, -196);
    glass.closePath();
    // זכוכית ריקה (צוואר) + נוזל קולה כהה
    c.fillStyle = 'rgba(200,230,215,0.35)'; c.fill(glass);
    c.save(); c.clip(glass);
    const lq = c.createLinearGradient(-86, 0, 86, 0);
    const lc = bt.liquid || ['#1a0804', '#4a1a0a', '#5e2410', '#140604'];
    lq.addColorStop(0, lc[0]); lq.addColorStop(0.3, lc[1]); lq.addColorStop(0.5, lc[2]); lq.addColorStop(1, lc[3]);
    c.fillStyle = lq;
    const level = -150 + Math.sin(t * 2) * 2;                            // פני הנוזל בצוואר
    c.fillRect(-100, level, 200, 520);
    c.fillStyle = 'rgba(160,80,40,0.55)'; c.fillRect(-100, level, 200, 4);
    // בועות בתוך הנוזל
    for (let i = 0; i < 12; i++) {
        const ph = (t * 0.3 + i / 12) % 1, x = ((i * 47) % 130) - 65 + Math.sin(t * 2 + i) * 4;
        const y = 320 - ph * (320 - level);
        if (Math.abs(x) < 64 && y > -100 && y < 34) continue;
        skE(c, x, y, 2 + (i % 3), 2 + (i % 3), 'rgba(255,200,150,0.35)');
    }
    // צלעות זכוכית אנכיות
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 3;
    for (const x of [-56, -34, 34, 56]) { c.beginPath(); c.moveTo(x, 200); c.lineTo(x * 1.1, 330); c.stroke(); }
    // תווית עוטפת במותניים
    c.beginPath();
    c.moveTo(-100, 80); c.bezierCurveTo(-40, 92, 40, 92, 100, 80);
    c.lineTo(100, 196); c.bezierCurveTo(40, 208, -40, 208, -100, 196);
    c.closePath();
    const lb = c.createLinearGradient(-80, 0, 80, 0);
    lb.addColorStop(0, bt.labelDark); lb.addColorStop(0.35, bt.label); lb.addColorStop(0.65, bt.label); lb.addColorStop(1, bt.labelDark);
    c.fillStyle = lb; c.fill();
    c.beginPath();                                                       // סרט גלי בתווית
    c.moveTo(-100, 170); c.bezierCurveTo(-40, 140, 20, 196, 100, 160);
    c.lineTo(100, 174); c.bezierCurveTo(20, 212, -40, 156, -100, 186);
    c.closePath(); c.fillStyle = bt.ribbon; c.fill();
    c.save(); c.translate(0, 126); c.rotate(-0.05);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'italic bold 30px "Secular One", Rubik, sans-serif';
    c.lineWidth = 4; c.strokeStyle = skA('#000000', 0.25); c.strokeText(bt.text, 0, 0);
    c.fillStyle = bt.textColor; c.fillText(bt.text, 0, 0);
    if (bt.sub) { c.font = 'bold 13px Rubik, sans-serif'; c.fillText(bt.sub, 0, 24); }
    c.restore();
    // ברק זכוכית
    c.fillStyle = 'rgba(255,255,255,0.32)';
    c.beginPath(); c.moveTo(-58, -90); c.bezierCurveTo(-68, -20, -68, 40, -56, 80); c.lineTo(-46, 80); c.bezierCurveTo(-56, 40, -56, -20, -48, -90); c.closePath(); c.fill();
    c.fillRect(-16, -192, 7, 40);
    c.beginPath(); c.moveTo(-60, 230); c.bezierCurveTo(-68, 270, -66, 300, -58, 330); c.lineTo(-50, 330); c.bezierCurveTo(-58, 300, -60, 270, -52, 230); c.closePath(); c.fill();
    c.restore();
    c.strokeStyle = skA('#c8e6d8', 0.7); c.lineWidth = 3; c.stroke(glass);
    c.strokeStyle = out; c.lineWidth = 1.5; c.stroke(glass);
    // פקק משונן
    skR(c, -30, -214, 60, 22, 4, bt.cap, out, 2.5);
    c.fillStyle = skShade(bt.cap, -0.35);
    for (let x = -26; x < 28; x += 8) c.fillRect(x, -214, 3, 22);
    skR(c, -30, -214, 60, 6, 3, skShade(bt.cap, 0.25));
    skEyes(c, sk, st);
}

function skSpideyBack(c, sk, st) {
    const t = st.t, red = '#d4141c', dkred = '#8a0a10', blue = '#1f4fc4', out = '#1a0406';
    skAuraBack(c, sk, t);
    // קורי עכביש ברקע
    c.save();
    c.translate(-150, -190);
    c.strokeStyle = 'rgba(235,240,255,0.55)'; c.lineWidth = 2;
    for (let i = 0; i < 7; i++) { const a = i / 6 * Math.PI / 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 150, Math.sin(a) * 150); c.stroke(); }
    for (let r = 30; r <= 150; r += 30) {
        c.beginPath();
        for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2, x = Math.cos(a) * r, y = Math.sin(a) * r; if (i) c.quadraticCurveTo(Math.cos(a - Math.PI / 12) * r * 0.86, Math.sin(a - Math.PI / 12) * r * 0.86, x, y); else c.moveTo(x, y); }
        c.stroke();
    }
    c.restore();
    // חוט קורים שמתנדנד מלמעלה
    const sw = Math.sin(t * 1.6) * 10;
    c.strokeStyle = 'rgba(235,240,255,0.8)'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(150 + sw, -340); c.quadraticCurveTo(140, -200, 110, 120); c.stroke();

    // חליפה: אדום עם קורים, צדדים כחולים וסמל עכביש
    skR(c, -26, 30, 52, 48, 10, dkred, null);
    skTorsoPath(c);
    c.fillStyle = red; c.fill();
    c.save();
    skTorsoPath(c); c.clip();
    c.fillStyle = blue;
    c.beginPath(); c.moveTo(-130, 160); c.lineTo(-62, 170); c.lineTo(-54, 340); c.lineTo(-130, 340); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(130, 160); c.lineTo(62, 170); c.lineTo(54, 340); c.lineTo(130, 340); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(20,0,0,0.55)'; c.lineWidth = 1.6;
    for (let x = -60; x <= 60; x += 20) { c.beginPath(); c.moveTo(x * 0.5, 50); c.quadraticCurveTo(x * 1.1, 170, x * 0.9, 340); c.stroke(); }
    for (let y = 90; y < 340; y += 28) { c.beginPath(); c.moveTo(-62, y); c.quadraticCurveTo(0, y + 12, 62, y); c.stroke(); }
    c.restore();
    c.strokeStyle = out; c.lineWidth = 3; skTorsoPath(c); c.stroke();
    // סמל העכביש
    c.fillStyle = '#111';
    skE(c, 0, 132, 7, 9, '#111'); skE(c, 0, 118, 5, 5, '#111');
    c.strokeStyle = '#111'; c.lineWidth = 3; c.lineCap = 'round';
    for (const s of [-1, 1]) for (const [dy, dx, ey] of [[-6, 22, -22], [0, 26, -6], [6, 24, 12], [12, 18, 28]]) {
        c.beginPath(); c.moveTo(0, 130 + dy); c.quadraticCurveTo(s * dx * 0.7, 130 + dy - 8, s * dx, 130 + ey); c.stroke();
    }

    // ראש: מסכה מגולגלת עד האף - הפה והסנטר חשופים
    skHead(c, sk);
    for (const s of [-1, 1]) skE(c, s * 86, -30, 14, 19, '#b80e16', out, 2.5);   // האוזניים בתוך המסכה
    c.save();
    c.beginPath(); c.ellipse(SK_HEAD.cx, SK_HEAD.cy, SK_HEAD.rx + 1, SK_HEAD.ry + 1, 0, 0, Math.PI * 2); c.clip();
    const mask = new Path2D();
    mask.rect(-120, -160, 240, 134);
    const mg = c.createRadialGradient(-30, -90, 10, 0, -60, 130);
    mg.addColorStop(0, '#f0303a'); mg.addColorStop(1, '#a80c14');
    c.fillStyle = mg; c.fill(mask);
    // קורים על המסכה: קווים שיוצאים מבין העיניים וקשתות
    c.strokeStyle = 'rgba(20,0,0,0.6)'; c.lineWidth = 1.6;
    for (let i = 0; i < 12; i++) { const a = Math.PI + i / 11 * Math.PI; c.beginPath(); c.moveTo(0, -52); c.lineTo(Math.cos(a) * 160, -52 + Math.sin(a) * 160); c.stroke(); }
    for (let r = 26; r < 150; r += 26) { c.beginPath(); c.ellipse(0, -52, r * 1.15, r, 0, Math.PI, Math.PI * 2); c.stroke(); }
    c.restore();
    // שפת המסכה המגולגלת מעל האף
    skR(c, -86, -36, 172, 14, 7, red, out, 2.5);
    c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-76, -32); c.lineTo(76, -32); c.stroke();
    skE(c, 0, -14, 10, 7, skShade(sk.tone, -0.12));                       // קצה האף
    // עדשות עיניים לבנות גדולות (מצמצמות כשלועס)
    const squint = st.chew > 0.25 ? 0.45 : 1;
    for (const s of [-1, 1]) {
        c.save(); c.translate(s * 38, -70); c.scale(s * 1.35, squint * 1.35);
        c.beginPath();
        c.moveTo(-26, 4); c.quadraticCurveTo(-10, -30, 26, -18); c.quadraticCurveTo(24, 14, -26, 4); c.closePath();
        c.fillStyle = '#111'; c.fill();
        c.beginPath();
        c.moveTo(-18, 2); c.quadraticCurveTo(-6, -22, 20, -13); c.quadraticCurveTo(18, 8, -18, 2); c.closePath();
        c.fillStyle = '#f4f6fb'; c.fill();
        c.restore();
    }
}


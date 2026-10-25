/* ---------- רקע מיוחד לכל סקין אגדי / מיתי / מהדורה מיוחדת ----------
   SK_BG[מזהה] = (c, W, H, t, sk) מצייר את הרקע של התצוגה המקדימה.
   גרסה של סקין (בן/בת, צ'דר) מקבלת את הרקע של הסקין הראשי, אלא אם יש לה רקע משלה.
   t = זמן בשניות: בכרטיס הסקין הרקע זז, ברשת החנות הוא תמונה קבועה. */

const bgH = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function bgLinear(c, W, H, stops, x1, y1, x2, y2) {
    const g = c.createLinearGradient(x1 || 0, y1 || 0, x2 === undefined ? 0 : x2, y2 === undefined ? H : y2);
    stops.forEach((col, i) => g.addColorStop(i / (stops.length - 1), col));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
}
function bgGlow(c, x, y, r, rgb, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
function bgStars(c, W, H, t, n, seed, rgb, maxY) {
    for (let i = 0; i < n; i++) {
        const tw = 0.5 + 0.5 * Math.sin(t * 2.6 + i * 2.3);
        c.fillStyle = 'rgba(' + (rgb || '255,255,255') + ',' + (0.25 + 0.65 * tw * bgH(seed + i + 9)) + ')';
        c.beginPath(); c.arc(bgH(seed + i) * W, bgH(seed + i + 300) * H * (maxY || 1), 0.6 + bgH(seed + i + 600) * 1.5, 0, Math.PI * 2); c.fill();
    }
}
function bgSparkle(c, x, y, s, col) {
    c.fillStyle = col;
    c.beginPath(); c.moveTo(x, y - s * 2); c.quadraticCurveTo(x, y, x + s * 2, y); c.quadraticCurveTo(x, y, x, y + s * 2);
    c.quadraticCurveTo(x, y, x - s * 2, y); c.quadraticCurveTo(x, y, x, y - s * 2); c.fill();
}
function bgRays(c, x, y, t, n, rgb, a, R, speed) {
    c.save(); c.translate(x, y); c.rotate(t * (speed || 0.12));
    for (let i = 0; i < n; i++) {
        const ang = i * Math.PI * 2 / n, w = Math.PI / n * 0.55;
        const g = c.createRadialGradient(0, 0, 0, 0, 0, R);
        g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
        c.fillStyle = g;
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, ang - w, ang + w); c.closePath(); c.fill();
    }
    c.restore();
}
// דוגמה של אימוג'י מפוזרים שנעים לאט באלכסון
function bgEmoji(c, W, H, t, emoji, alpha, size, gap, speed) {
    c.save();
    c.globalAlpha = alpha; c.font = size + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const off = (t * (speed || 8)) % gap;
    for (let y = -gap, r = 0; y < H + gap; y += gap, r++) {
        for (let x = -gap; x < W + gap; x += gap) {
            const e = Array.isArray(emoji) ? emoji[(r + Math.round(x / gap)) % emoji.length] : emoji;
            c.save(); c.translate(x + (r % 2) * gap / 2 + off, y + off); c.rotate(((r * 7 + x) % 5 - 2) * 0.15);
            c.fillText(e, 0, 0); c.restore();
        }
    }
    c.restore();
}
function bgCloud(c, x, y, s, col) {
    c.fillStyle = col;
    for (const [dx, dy, r] of [[-1.1, 0.15, 0.55], [-0.45, -0.25, 0.75], [0.35, -0.35, 0.8], [1.05, 0.1, 0.6], [0, 0.25, 0.65]]) {
        c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); c.fill();
    }
}
function bgBokeh(c, W, H, t, n, cols, seed, maxY) {
    for (let i = 0; i < n; i++) {
        const x = bgH(seed + i) * W, y = bgH(seed + i + 50) * H * (maxY || 1), r = 6 + bgH(seed + i + 90) * 16;
        const pulse = 0.6 + 0.4 * Math.sin(t * 1.6 + i);
        bgGlow(c, x, y, r, cols[i % cols.length], 0.35 * pulse);
    }
}
function bgSkyline(c, W, H, base, col, seed, win) {
    c.fillStyle = col;
    let x = -10, i = 0;
    while (x < W + 10) {
        const w = 22 + bgH(seed + i) * 30, h = 40 + bgH(seed + i + 40) * (H * 0.32);
        c.fillRect(x, base - h, w, h + H);
        if (win) {
            c.fillStyle = win;
            for (let wy = base - h + 8; wy < base - 6; wy += 12)
                for (let wx = x + 5; wx < x + w - 6; wx += 9) if (bgH(wx * 3.1 + wy) > 0.55) c.fillRect(wx, wy, 4, 5);
            c.fillStyle = col;
        }
        x += w + 2; i++;
    }
}
function bgCurtains(c, W, H, col, dk, t) {
    for (const sd of [-1, 1]) {
        const x0 = sd < 0 ? 0 : W;
        c.save();
        c.beginPath(); c.moveTo(x0, 0); c.lineTo(W / 2 - sd * W * 0.22, 0);
        c.quadraticCurveTo(W / 2 - sd * W * 0.3, H * 0.5, x0 + sd * -W * 0.12, H); c.lineTo(x0, H); c.closePath();
        const g = c.createLinearGradient(0, 0, W, 0);
        for (let i = 0; i <= 10; i++) g.addColorStop(i / 10, i % 2 ? dk : col);
        c.fillStyle = g; c.fill();
        c.restore();
    }
    // וילון עליון
    c.fillStyle = dk;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, H * 0.07);
    for (let x = W; x >= 0; x -= W / 6) c.quadraticCurveTo(x - W / 12, H * 0.13, x - W / 6, H * 0.07);
    c.closePath(); c.fill();
}
function bgSpot(c, x, W, H, rgb, a) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0.02)');
    c.fillStyle = g;
    c.beginPath(); c.moveTo(x - 14, 0); c.lineTo(x + 14, 0); c.lineTo(x + W * 0.32, H); c.lineTo(x - W * 0.32, H); c.closePath(); c.fill();
}
function bgFallers(c, W, H, t, n, seed, draw, speed) {
    for (let i = 0; i < n; i++) {
        const sp = (speed || 18) * (0.6 + bgH(seed + i + 7));
        const y = ((bgH(seed + i + 3) * H + t * sp) % (H + 30)) - 15;
        const x = bgH(seed + i) * W + Math.sin(t * 1.3 + i) * 8;
        draw(x, y, i);
    }
}
function bgRisers(c, W, H, t, n, seed, draw, speed) {
    bgFallers(c, W, H, t, n, seed, (x, y, i) => draw(x, H - y, i), speed);
}

// מגרש כדורסל באולם: פרקט, קהל מטושטש בצבעי הקבוצה ותאורה מלמעלה
function bgCourt(c, W, H, t, base, a, b) {
    bgLinear(c, W, H, [skShade(base, -0.5), skShade(base, -0.75)]);
    bgBokeh(c, W, H, t, 26, [skHex(a).join(','), skHex(b).join(','), '255,255,255'], 11, 0.55);
    for (let i = 0; i < 4; i++) bgGlow(c, W * (0.12 + i * 0.25), -6, W * 0.22, '255,255,240', 0.35);
    // פרקט
    const fy = H * 0.66;
    const fg = c.createLinearGradient(0, fy, 0, H);
    fg.addColorStop(0, '#c98f4e'); fg.addColorStop(1, '#8a5a2a');
    c.fillStyle = fg; c.fillRect(0, fy, W, H - fy);
    c.strokeStyle = 'rgba(90,50,20,0.35)'; c.lineWidth = 1;
    for (let x = -W; x < W * 2; x += 18) { c.beginPath(); c.moveTo(W / 2 + (x - W / 2) * 0.55, fy); c.lineTo(x, H); c.stroke(); }
    c.strokeStyle = a; c.lineWidth = 4;
    c.beginPath(); c.ellipse(W / 2, H * 0.84, W * 0.36, H * 0.07, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, fy + 4); c.lineTo(W, fy + 4); c.stroke();
}
// במה של קונצרט: קורות אור צבעוניות שזזות וקהל בצללית
function bgConcert(c, W, H, t, cols) {
    bgLinear(c, W, H, ['#0a0612', '#1a0a1e']);
    cols.forEach((rgb, i) => {
        c.save(); c.translate(W * (0.15 + i * 0.35), -10); c.rotate(Math.sin(t * 0.8 + i * 2) * 0.35);
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, 'rgba(' + rgb + ',0.55)'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
        c.fillStyle = g; c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.lineTo(W * 0.22, H); c.lineTo(-W * 0.22, H); c.closePath(); c.fill();
        c.restore();
    });
    bgStars(c, W, H, t, 20, 77, '255,220,240', 0.5);
    c.fillStyle = '#050308';                                     // קהל
    for (let i = 0; i < 12; i++) {
        const x = i * W / 11, y = H * 0.9 + Math.sin(t * 4 + i * 1.7) * 3;
        c.beginPath(); c.arc(x, y, 16, 0, Math.PI * 2); c.fill(); c.fillRect(x - 20, y + 8, 40, 60);
    }
}

const SK_BG = {
    // ---------- אגדי ----------
    king(c, W, H, t) {                                          // מלך הבייגלה: קטיפה מלכותית, קרני זהב ובייגלה
        bgLinear(c, W, H, ['#5a0a1a', '#2a0410']);
        bgRays(c, W / 2, H * 0.4, t, 16, '255,200,80', 0.28, W, 0.1);
        bgEmoji(c, W, H, t, '🥯', 0.22, 26, 64, 6);
        bgGlow(c, W / 2, H * 0.42, W * 0.45, '255,210,110', 0.3);
    },
    angel(c, W, H, t) {                                         // המלאך: שמיים של שחר, עננים וקרני אור מלמעלה
        bgLinear(c, W, H, ['#8fc4ff', '#f7d6ff', '#ffe7c4']);
        bgRays(c, W / 2, -20, t * 0.4, 12, '255,255,220', 0.45, H * 1.2, 0.05);
        const d = Math.sin(t * 0.4) * 10;
        bgCloud(c, W * 0.12 + d, H * 0.7, 40, 'rgba(255,255,255,0.9)'); bgCloud(c, W * 0.9 - d, H * 0.62, 46, 'rgba(255,255,255,0.85)');
        bgCloud(c, W * 0.8 + d, H * 0.18, 26, 'rgba(255,255,255,0.7)'); bgCloud(c, W * 0.15 - d, H * 0.2, 22, 'rgba(255,255,255,0.65)');
        bgFallers(c, W, H, t, 8, 21, (x, y) => { c.fillStyle = 'rgba(255,255,255,0.8)'; c.beginPath(); c.ellipse(x, y, 4, 7, 0.6, 0, Math.PI * 2); c.fill(); }, 12);
    },
    firemage(c, W, H, t) {                                      // הלוחש לאש: לשונות אש בתחתית וגיצים שעולים
        bgLinear(c, W, H, ['#14040a', '#3a0a06', '#7a1a04']);
        for (let i = 0; i < 9; i++) {
            const x = i * W / 8, h = H * (0.22 + 0.08 * Math.sin(t * 5 + i * 1.9));
            const g = c.createLinearGradient(0, H - h, 0, H);
            g.addColorStop(0, 'rgba(255,120,20,0)'); g.addColorStop(0.5, 'rgba(255,120,20,0.5)'); g.addColorStop(1, 'rgba(255,220,80,0.8)');
            c.fillStyle = g; c.beginPath(); c.moveTo(x - 30, H); c.quadraticCurveTo(x - 10, H - h * 0.5, x, H - h); c.quadraticCurveTo(x + 10, H - h * 0.5, x + 30, H); c.fill();
        }
        bgRisers(c, W, H, t, 26, 31, (x, y, i) => { c.fillStyle = i % 2 ? 'rgba(255,200,80,0.9)' : 'rgba(255,110,30,0.8)'; c.fillRect(x, y, 2.5, 2.5); }, 40);
    },
    kebab(c, W, H, t) {                                         // הקבב האגדי: מנגל עם גחלים לוהטות ועשן
        bgLinear(c, W, H, ['#1a0c06', '#2e1408']);
        bgRays(c, W / 2, H * 0.42, t, 14, '255,180,60', 0.22, W, 0.1);
        const gy = H * 0.84;
        c.fillStyle = '#1a1a1e'; c.fillRect(0, gy, W, H - gy);
        for (let i = 0; i < 26; i++) {
            const x = bgH(i + 5) * W, y = gy + 8 + bgH(i + 50) * (H - gy - 10), glow = 0.5 + 0.5 * Math.sin(t * 3 + i);
            bgGlow(c, x, y, 16, '255,' + Math.round(80 + 80 * glow) + ',20', 0.7);
        }
        c.strokeStyle = '#555'; c.lineWidth = 3;
        for (let x = 6; x < W; x += 16) { c.beginPath(); c.moveTo(x, gy); c.lineTo(x, gy + 12); c.stroke(); }
        c.beginPath(); c.moveTo(0, gy + 2); c.lineTo(W, gy + 2); c.stroke();
        bgRisers(c, W, H, t, 6, 61, (x, y) => bgGlow(c, x, y, 30, '180,170,160', 0.12), 14);
    },
    laffa(c, W, H, t) {                                         // שווארמה בלאפה: טאבון לוהט וקמח באוויר
        bgLinear(c, W, H, ['#3a1e0c', '#6a3812']);
        c.fillStyle = '#2a1408';
        c.beginPath(); c.moveTo(W * 0.08, H); c.lineTo(W * 0.08, H * 0.38); c.arc(W / 2, H * 0.38, W * 0.42, Math.PI, 0); c.lineTo(W * 0.92, H); c.fill();
        const fl = 0.85 + 0.15 * Math.sin(t * 6);
        bgGlow(c, W / 2, H * 0.5, W * 0.45, '255,150,40', 0.6 * fl);
        c.strokeStyle = 'rgba(255,190,100,0.3)'; c.lineWidth = 3;
        for (let r = 0; r < 3; r++) { c.beginPath(); c.arc(W / 2, H * 0.38, W * (0.44 + r * 0.03), Math.PI, 0); c.stroke(); }
        bgFallers(c, W, H, t, 30, 71, (x, y) => { c.fillStyle = 'rgba(255,250,235,0.55)'; c.fillRect(x, y, 2, 2); }, 10);
    },
    hedgehog(c, W, H, t) {                                      // סוניק: גבעות משובצות, דקלים וטבעות זהב
        bgLinear(c, W, H, ['#2a8ae8', '#8fd0ff']);
        bgCloud(c, W * 0.2, H * 0.14, 20, 'rgba(255,255,255,0.9)'); bgCloud(c, W * 0.82, H * 0.22, 16, 'rgba(255,255,255,0.85)');
        const hill = (y0, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 10) c.lineTo(x, y0 + Math.sin(x / 50) * 18); c.lineTo(W, H); c.fill(); };
        hill(H * 0.58, '#1f9a3a');
        c.save(); c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 10) c.lineTo(x, H * 0.66 + Math.sin(x / 50) * 18); c.lineTo(W, H); c.clip();
        for (let y = 0; y < H; y += 18) for (let x = 0; x < W; x += 18) { c.fillStyle = ((x + y) / 18) % 2 ? '#a8581c' : '#d0782c'; c.fillRect(x, H * 0.66 + y, 18, 18); }
        c.restore();
        c.fillStyle = '#2ec44a'; c.beginPath(); for (let x = 0; x <= W; x += 10) c.lineTo(x, H * 0.66 + Math.sin(x / 50) * 18); c.lineTo(W, H * 0.66 + 10); c.lineTo(0, H * 0.66 + 10); c.fill();
        for (const sx of [0.08, 0.92]) {                         // דקלים
            c.strokeStyle = '#7a4a1a'; c.lineWidth = 6; c.beginPath(); c.moveTo(W * sx, H * 0.68); c.quadraticCurveTo(W * sx + 10, H * 0.5, W * sx, H * 0.36); c.stroke();
            c.fillStyle = '#1fae3a';
            for (let i = 0; i < 5; i++) { c.save(); c.translate(W * sx, H * 0.36); c.rotate(-Math.PI + i * Math.PI / 4 + 0.3); c.beginPath(); c.ellipse(20, 0, 22, 6, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
        }
        for (let i = 0; i < 5; i++) {                            // טבעות מסתובבות
            const x = W * (0.12 + i * 0.19), y = H * 0.12 + Math.sin(i) * 12, sx = Math.abs(Math.cos(t * 3 + i));
            c.strokeStyle = '#ffd23d'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, y, 8 * sx + 1, 8, 0, 0, Math.PI * 2); c.stroke();
        }
    },
    spidey(c, W, H, t) {                                        // ספיידי: קו רקיע של ניו יורק בלילה, ירח וקורי עכביש
        bgLinear(c, W, H, ['#070b24', '#1c1446', '#3a1240']);
        bgStars(c, W, H, t, 30, 5, '255,255,255', 0.5);
        bgGlow(c, W * 0.78, H * 0.16, 50, '255,240,200', 0.4);
        c.fillStyle = '#f4ecd2'; c.beginPath(); c.arc(W * 0.78, H * 0.16, 22, 0, Math.PI * 2); c.fill();
        bgSkyline(c, W, H, H * 0.98, '#0a0a18', 3, 'rgba(255,220,120,0.55)');
        c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.2;  // קורים בפינה
        for (let i = 0; i <= 5; i++) { const a = i * Math.PI / 10; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 110, Math.sin(a) * 110); c.stroke(); }
        for (let r = 20; r <= 100; r += 20) { c.beginPath(); for (let i = 0; i <= 5; i++) { const a = i * Math.PI / 10; c[i ? 'quadraticCurveTo' : 'moveTo'](...(i ? [Math.cos(a - 0.16) * r * 0.86, Math.sin(a - 0.16) * r * 0.86, Math.cos(a) * r, Math.sin(a) * r] : [Math.cos(a) * r, Math.sin(a) * r])); } c.stroke(); }
    },
    avatar(c, W, H, t) {                                        // האווטאר: ג'ונגל זוהר של פנדורה בלילה עם זרעים מרחפים
        bgLinear(c, W, H, ['#02101e', '#062a3a', '#0a3a3a']);
        c.fillStyle = 'rgba(30,70,90,0.7)';                    // הרים מרחפים
        for (const [x, y, s] of [[0.2, 0.18, 1], [0.8, 0.1, 0.8]]) {
            const fy = Math.sin(t * 0.6 + x * 9) * 4;
            c.beginPath(); c.ellipse(W * x, H * y + fy, 40 * s, 12 * s, 0, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.moveTo(W * x - 30 * s, H * y + fy); c.lineTo(W * x, H * y + 40 * s + fy); c.lineTo(W * x + 30 * s, H * y + fy); c.fill();
        }
        for (let i = 0; i < 8; i++) {                            // צמחים זוהרים
            const x = bgH(i + 8) * W, h = 50 + bgH(i + 18) * 90, col = i % 2 ? '60,230,255' : '190,90,255';
            c.strokeStyle = 'rgba(' + col + ',0.6)'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(x, H); c.quadraticCurveTo(x + 14 * Math.sin(t + i), H - h / 2, x + 6, H - h); c.stroke();
            bgGlow(c, x + 6, H - h, 16, col, 0.8);
        }
        bgRisers(c, W, H, t, 16, 81, (x, y, i) => {               // זרעים של עץ הנשמות
            bgGlow(c, x, y, 7, '200,255,255', 0.7);
            c.strokeStyle = 'rgba(220,255,255,0.7)'; c.lineWidth = 0.8;
            for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + t; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); c.stroke(); }
        }, 10);
    },
    shluk(c, W, H, t) {                                         // שלוקלוס: הר האולימפוס הקפוא - עמודים יווניים ופתיתי שלג
        bgLinear(c, W, H, ['#6ac8ff', '#c8eeff', '#eef9ff']);
        bgRays(c, W / 2, H * 0.36, t, 16, '255,255,255', 0.35, W, 0.08);
        bgCloud(c, W * 0.5 + Math.sin(t * 0.3) * 10, H * 0.9, 60, 'rgba(255,255,255,0.95)');
        for (const sx of [0.08, 0.92]) {                            // עמודים יווניים
            const x = W * sx;
            c.fillStyle = '#f4f1ea'; c.fillRect(x - 16, H * 0.2, 32, H * 0.7);
            c.strokeStyle = 'rgba(150,160,180,0.7)'; c.lineWidth = 1.5;
            for (let k = -10; k <= 10; k += 7) { c.beginPath(); c.moveTo(x + k, H * 0.22); c.lineTo(x + k, H * 0.88); c.stroke(); }
            c.fillStyle = '#e4e0d4'; c.fillRect(x - 24, H * 0.17, 48, 14); c.fillRect(x - 24, H * 0.88, 48, 14);
            c.strokeStyle = 'rgba(120,130,150,0.8)'; c.strokeRect(x - 24, H * 0.17, 48, 14); c.strokeRect(x - 24, H * 0.88, 48, 14);
        }
        bgFallers(c, W, H, t, 22, 331, (x, y, i) => {
            c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 1.3;
            for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + t * 0.5 + i; c.beginPath(); c.moveTo(x - Math.cos(a) * 4, y - Math.sin(a) * 4); c.lineTo(x + Math.cos(a) * 4, y + Math.sin(a) * 4); c.stroke(); }
        }, 16);
    },
    thunder(c, W, H, t) {                                       // אל הרעם: עננים כבדים וברקים מהבהבים
        bgLinear(c, W, H, ['#0a0e22', '#1e2448', '#2a2e4a']);
        const flash = (t % 3.2) < 0.12 ? 0.35 : 0;
        if (flash) { c.fillStyle = 'rgba(200,220,255,' + flash + ')'; c.fillRect(0, 0, W, H); }
        const d = Math.sin(t * 0.3) * 14;
        for (let i = 0; i < 6; i++) bgCloud(c, W * (i / 5) + d * (i % 2 ? 1 : -1), H * (0.06 + (i % 2) * 0.08), 36, 'rgba(40,46,80,0.95)');
        const bolt = (x, seed, a) => {
            c.strokeStyle = 'rgba(190,220,255,' + a + ')'; c.lineWidth = 3; c.shadowColor = '#9fd0ff'; c.shadowBlur = 12;
            c.beginPath(); c.moveTo(x, H * 0.12); let y = H * 0.12, xx = x;
            for (let k = 0; k < 6; k++) { xx += (bgH(seed + k) - 0.5) * 40; y += H * 0.1; c.lineTo(xx, y); }
            c.stroke(); c.shadowBlur = 0;
        };
        bolt(W * 0.12, 3, 0.35 + (flash ? 0.6 : 0)); bolt(W * 0.88, 9, 0.35 + ((t + 1.6) % 3.2 < 0.12 ? 0.6 : 0));
        bgFallers(c, W, H, t, 40, 91, (x, y) => { c.strokeStyle = 'rgba(160,180,255,0.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 10); c.stroke(); }, 160);
    },
    phoenix(c, W, H, t) {                                       // עוף החול: שקיעה בוערת עם נוצות אש עולות
        bgLinear(c, W, H, ['#2a0418', '#8a1a10', '#ff7a1a']);
        bgGlow(c, W / 2, H * 0.9, W * 0.7, '255,200,60', 0.55);
        bgRays(c, W / 2, H * 0.95, t, 12, '255,200,90', 0.22, H, 0.06);
        bgRisers(c, W, H, t, 14, 101, (x, y, i) => {
            c.save(); c.translate(x, y); c.rotate(Math.sin(t + i) * 0.4);
            const g = c.createLinearGradient(0, -10, 0, 10); g.addColorStop(0, 'rgba(255,230,120,0.85)'); g.addColorStop(1, 'rgba(255,80,20,0.2)');
            c.fillStyle = g; c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(7, 0, 0, 12); c.quadraticCurveTo(-7, 0, 0, -12); c.fill();
            c.restore();
        }, 30);
    },
    shadow(c, W, H, t) {                                        // נינג'ת הצללים: ירח מלא, במבוק וגגות יפניים
        bgLinear(c, W, H, ['#0a0820', '#1c1640', '#2a1a40']);
        const mx = W * 0.72, my = H * 0.17, mr = W * 0.15;
        bgGlow(c, mx, my, mr * 2.2, '255,230,200', 0.3);
        c.fillStyle = '#f2e6cc'; c.beginPath(); c.arc(mx, my, mr, 0, Math.PI * 2); c.fill();
        c.fillStyle = 'rgba(200,180,150,0.4)';
        for (const [x, y, r] of [[-0.35, -0.2, 0.18], [0.3, 0.25, 0.12], [0.05, -0.45, 0.09]]) { c.beginPath(); c.arc(mx + x * mr, my + y * mr, r * mr, 0, Math.PI * 2); c.fill(); }
        c.fillStyle = '#05040c';
        for (const sx of [0.05, 0.14, 0.88, 0.96]) {             // במבוק
            const sway = Math.sin(t * 0.8 + sx * 10) * 4;
            c.fillRect(W * sx + sway, 0, 7, H);
            for (let y = 30; y < H; y += 46) { c.fillRect(W * sx - 2 + sway, y, 11, 3); c.save(); c.translate(W * sx + sway, y); c.rotate(sx < 0.5 ? 0.6 : -0.6); c.beginPath(); c.ellipse(sx < 0.5 ? 16 : -16, 0, 16, 4, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
        }
        c.beginPath(); c.moveTo(W * 0.2, H); c.lineTo(W * 0.2, H * 0.86); c.lineTo(W * 0.1, H * 0.86); c.quadraticCurveTo(W * 0.5, H * 0.74, W * 0.9, H * 0.86); c.lineTo(W * 0.8, H * 0.86); c.lineTo(W * 0.8, H); c.fill();
        bgFallers(c, W, H, t, 10, 111, (x, y, i) => { c.fillStyle = 'rgba(255,170,200,0.7)'; c.beginPath(); c.ellipse(x, y, 4, 2.5, t + i, 0, Math.PI * 2); c.fill(); }, 14);
    },

    // ---------- מיתי ----------
    cosmic(c, W, H, t) {                                        // קיסר הגלקסיה: גלקסיה ספירלית מסתובבת
        bgLinear(c, W, H, ['#05021a', '#14063a', '#05021a']);
        bgStars(c, W, H, t, 60, 121);
        c.save(); c.translate(W * 0.22, H * 0.17); c.scale(0.5, 0.5); c.rotate(t * 0.08);
        for (let arm = 0; arm < 3; arm++) {
            for (let k = 0; k < 60; k++) {
                const a = arm * Math.PI * 2 / 3 + k * 0.09, r = k * 3.2;
                const col = k < 20 ? '255,230,200' : (arm % 2 ? '120,160,255' : '230,120,255');
                c.fillStyle = 'rgba(' + col + ',' + (0.5 - k / 140) + ')';
                c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r * 0.6, 4 - k / 20, 0, Math.PI * 2); c.fill();
            }
        }
        c.restore();
        bgGlow(c, W * 0.22, H * 0.17, 34, '255,230,200', 0.6);
        bgGlow(c, W / 2, H * 0.45, W * 0.5, '140,90,255', 0.25);
        c.fillStyle = '#7a5ad8'; c.beginPath(); c.arc(W * 0.86, H * 0.2, 14, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(220,200,255,0.7)'; c.lineWidth = 2; c.beginPath(); c.ellipse(W * 0.86, H * 0.2, 24, 6, -0.3, 0, Math.PI * 2); c.stroke();
    },
    dragon(c, W, H, t) {                                        // אדון הדרקונים: הרי געש, לבה ואפר
        bgLinear(c, W, H, ['#1a0606', '#4a0c08', '#8a2208']);
        bgGlow(c, W * 0.3, H * 0.5, W * 0.5, '255,90,20', 0.35);
        c.fillStyle = '#140606';
        c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * 0.62); c.lineTo(W * 0.2, H * 0.42); c.lineTo(W * 0.28, H * 0.46); c.lineTo(W * 0.42, H * 0.6);
        c.lineTo(W * 0.62, H * 0.5); c.lineTo(W * 0.8, H * 0.34); c.lineTo(W * 0.86, H * 0.38); c.lineTo(W, H * 0.56); c.lineTo(W, H); c.fill();
        c.strokeStyle = 'rgba(255,120,20,0.8)'; c.lineWidth = 3;          // נהרות לבה
        c.beginPath(); c.moveTo(W * 0.83, H * 0.36); c.quadraticCurveTo(W * 0.78, H * 0.5, W * 0.86, H * 0.7); c.stroke();
        c.beginPath(); c.moveTo(W * 0.24, H * 0.44); c.quadraticCurveTo(W * 0.2, H * 0.6, W * 0.1, H * 0.75); c.stroke();
        bgGlow(c, W * 0.83, H * 0.34, 40, '255,140,30', 0.6 + 0.3 * Math.sin(t * 3));
        const fx = ((t * 30) % (W + 120)) - 60;                     // צללית של דרקון עף
        c.fillStyle = 'rgba(10,2,2,0.85)'; c.save(); c.translate(fx, H * 0.16); const fl = Math.sin(t * 6) * 0.5;
        c.beginPath(); c.ellipse(0, 0, 16, 4, 0, 0, Math.PI * 2); c.fill();
        for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(-4, 0); c.lineTo(-10, sd * (14 + fl * 8)); c.lineTo(6, 0); c.fill(); }
        c.beginPath(); c.moveTo(-14, 0); c.lineTo(-28, 3); c.lineTo(-14, 2); c.fill(); c.restore();
        bgRisers(c, W, H, t, 24, 131, (x, y) => { c.fillStyle = 'rgba(255,160,60,0.8)'; c.fillRect(x, y, 2, 2); }, 26);
    },
    bambababy(c, W, H, t) {                                     // התינוק של במבה: צהוב של במבה וחטיפים מרחפים
        bgLinear(c, W, H, ['#ffe066', '#ffc21a']);
        bgRays(c, W / 2, H * 0.42, t, 18, '255,255,255', 0.35, W, 0.1);
        bgFallers(c, W, H, t, 14, 141, (x, y, i) => skBambaPuff(c, x, y, 7, t * 0.8 + i), 16);
        c.fillStyle = '#e8262a'; c.fillRect(0, H * 0.93, W, H * 0.07);
        c.fillStyle = '#1f4fa8'; c.fillRect(0, H * 0.91, W, H * 0.02);
    },
    deni: (c, W, H, t) => bgCourt(c, W, H, t, '#e03a3e', '#e03a3e', '#ffffff'),        // דני: אולם של פורטלנד
    deni_israel: (c, W, H, t) => bgCourt(c, W, H, t, '#0038b8', '#0038b8', '#ffffff'),
    kebabgod(c, W, H, t) {                                      // אל השווארמה: גן עדן זהוב עם שיפודים מרחפים
        bgLinear(c, W, H, ['#fff2c4', '#ffc95a', '#e88a1a']);
        bgRays(c, W / 2, H * 0.4, t, 20, '255,255,255', 0.4, W, 0.08);
        bgCloud(c, W * 0.1, H * 0.86, 40, 'rgba(255,255,255,0.85)'); bgCloud(c, W * 0.92, H * 0.88, 44, 'rgba(255,255,255,0.85)');
        for (let i = 0; i < 6; i++) {
            const x = W * (0.1 + (i % 3) * 0.4) + (i > 2 ? W * 0.1 : 0), y = H * (i > 2 ? 0.5 : 0.14) + Math.sin(t * 1.5 + i) * 6;
            if (x > W * 0.3 && x < W * 0.7 && y > H * 0.3) continue;
            skMiniKebab(c, x, y, 34, 0.5 + Math.sin(t + i) * 0.2);
        }
    },
    voidlord(c, W, H, t) {                                      // שליט הריק: חור שחור עם דיסקת צבירה סגולה
        bgLinear(c, W, H, ['#02010a', '#0a0420', '#02010a']);
        bgStars(c, W, H, t, 40, 151, '220,200,255');
        c.save(); c.translate(W * 0.76, H * 0.16); c.scale(0.55, 0.55); c.rotate(-0.25);
        for (let k = 0; k < 3; k++) {
            c.save(); c.rotate(t * (0.3 + k * 0.15));
            c.strokeStyle = 'rgba(' + ['190,90,255', '255,120,200', '120,140,255'][k] + ',0.5)'; c.lineWidth = 6 - k;
            c.setLineDash([30, 14]); c.beginPath(); c.ellipse(0, 0, W * (0.42 - k * 0.07), W * (0.12 - k * 0.02), 0, 0, Math.PI * 2); c.stroke();
            c.restore();
        }
        c.setLineDash([]);
        c.restore();
        bgGlow(c, W * 0.76, H * 0.16, W * 0.2, '160,60,255', 0.5);
        bgGlow(c, W / 2, H * 0.5, W * 0.5, '120,40,200', 0.2);
        c.fillStyle = '#000'; c.beginPath(); c.arc(W * 0.76, H * 0.16, W * 0.07, 0, Math.PI * 2); c.fill();
        c.strokeStyle = 'rgba(220,170,255,0.8)'; c.lineWidth = 1.5; c.stroke();
    },

    // ---------- מהדורה מיוחדת ----------
    banana(c, W, H, t) {                                        // איתמר האגדי: טרופי עם בננות ועלי דקל
        bgLinear(c, W, H, ['#1fa88a', '#ffe680']);
        bgEmoji(c, W, H, t, '🍌', 0.3, 24, 58, 7);
        c.fillStyle = 'rgba(20,110,50,0.85)';
        for (const [x, y, a] of [[0, 0, 0.6], [W, 0, 2.5], [0, H, -0.6], [W, H, -2.5]]) {
            c.save(); c.translate(x, y); c.rotate(a + Math.sin(t + x) * 0.05);
            for (let i = -2; i <= 2; i++) { c.save(); c.rotate(i * 0.3); c.beginPath(); c.ellipse(60, 0, 60, 12, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
            c.restore();
        }
    },
    lizard(c, W, H, t) {                                        // השרגונת: ג'ונגל ירוק עם אור שמסתנן
        bgLinear(c, W, H, ['#0e3a1a', '#1e6a2a', '#0e3a1a']);
        bgBokeh(c, W, H, t, 14, ['255,255,180', '200,255,150'], 161);
        for (let i = 0; i < 14; i++) {
            const x = bgH(i + 170) * W, y = bgH(i + 180) * H, r = bgH(i + 190) * 6;
            c.save(); c.translate(x, y); c.rotate(r + Math.sin(t * 0.7 + i) * 0.08);
            c.fillStyle = i % 2 ? 'rgba(30,120,40,0.85)' : 'rgba(50,160,60,0.75)';
            c.beginPath(); c.ellipse(0, 0, 34, 12, 0, 0, Math.PI * 2); c.fill();
            c.strokeStyle = 'rgba(10,60,20,0.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-32, 0); c.lineTo(32, 0); c.stroke();
            c.restore();
        }
    },
    dosus(c, W, H, t) {                                         // דוסוס: חומת אבן ירושלמית בשקיעה
        bgLinear(c, W, H, ['#ffb46a', '#e88a4a']);
        c.fillStyle = '#e9d3a6';
        const top = H * 0.3;
        c.fillRect(0, top, W, H - top);
        c.strokeStyle = 'rgba(140,110,70,0.55)'; c.lineWidth = 2;
        for (let r = 0, y = top; y < H; y += 30, r++) {
            c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
            for (let x = (r % 2) * 30; x < W; x += 60) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 30); c.stroke(); }
        }
        c.fillStyle = 'rgba(160,130,80,0.25)';
        for (let i = 0; i < 30; i++) c.fillRect(bgH(i + 200) * W, top + bgH(i + 210) * (H - top), 6, 3);
        bgGlow(c, W * 0.85, top, W * 0.4, '255,220,140', 0.4 + 0.1 * Math.sin(t));
        for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(80,110,50,0.8)'; c.beginPath(); c.ellipse(bgH(i + 220) * W, top + 30 + i * 52, 8, 4, 0.5, 0, Math.PI * 2); c.fill(); }
    },
    yuvaldog(c, W, H, t) {                                      // הכלב של יובל: פארק עם עצמות וטביעות כפות
        bgLinear(c, W, H, ['#7fc8ff', '#c8ecff']);
        bgCloud(c, W * 0.2 + Math.sin(t * 0.3) * 8, H * 0.14, 20, 'rgba(255,255,255,0.95)');
        c.fillStyle = '#4caf50'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * 0.6); c.quadraticCurveTo(W / 2, H * 0.5, W, H * 0.6); c.lineTo(W, H); c.fill();
        bgEmoji(c, W, H, t, ['🦴', '🐾'], 0.28, 20, 62, 5);
        c.fillStyle = '#2f8a3a';
        for (let x = 0; x < W; x += 8) { c.beginPath(); c.moveTo(x, H); c.lineTo(x + 3, H - 10 - (x % 3) * 3); c.lineTo(x + 6, H); c.fill(); }
    },
    tapuzi(c, W, H, t) {                                        // תפוזי: פרדס תפוזים בשמש
        bgLinear(c, W, H, ['#ffd27a', '#ffa64a']);
        bgRays(c, W * 0.8, H * 0.1, t, 12, '255,255,220', 0.4, W, 0.08);
        for (const [x, s] of [[0.08, 1], [0.92, 1.1], [0.5, 0.6]]) {
            c.fillStyle = '#6a3a1a'; c.fillRect(W * x - 5 * s, H * 0.62, 10 * s, H);
            c.fillStyle = '#2f8a3a'; c.beginPath(); c.arc(W * x, H * 0.55, 54 * s, 0, Math.PI * 2); c.fill();
            for (let i = 0; i < 6; i++) { c.fillStyle = '#ff8a1a'; c.beginPath(); c.arc(W * x + (bgH(i + x * 9) - 0.5) * 80 * s, H * 0.55 + (bgH(i + x * 7) - 0.5) * 70 * s, 6 * s, 0, Math.PI * 2); c.fill(); }
        }
        bgFallers(c, W, H, t, 4, 231, (x, y) => { c.fillStyle = '#ff8a1a'; c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill(); }, 20);
    },
    goldcapy(c, W, H, t) {                                      // הקפיברה של שוורץ: מעיין חם עם אדים ומטבעות זהב
        bgLinear(c, W, H, ['#1a3a3a', '#2a6a6a']);
        const wy = H * 0.7;
        c.fillStyle = '#3ab0b0'; c.fillRect(0, wy, W, H - wy);
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
        for (let i = 0; i < 6; i++) { const r = ((t * 20 + i * 30) % 180); c.beginPath(); c.ellipse(W / 2, wy + 40, r, r * 0.2, 0, 0, Math.PI * 2); c.stroke(); }
        c.fillStyle = '#5a5a52';
        for (const [x, r] of [[0.05, 34], [0.95, 40], [0.22, 18], [0.8, 20]]) { c.beginPath(); c.ellipse(W * x, wy, r, r * 0.6, 0, Math.PI, 0); c.fill(); }
        bgRisers(c, W, H * 0.8, t, 8, 241, (x, y) => bgGlow(c, x, y, 26, '255,255,255', 0.15), 12);
        bgFallers(c, W, H * 0.7, t, 10, 251, (x, y, i) => {
            const s = Math.abs(Math.cos(t * 3 + i));
            c.fillStyle = '#ffd23d'; c.strokeStyle = '#a8760a'; c.lineWidth = 1.2;
            c.beginPath(); c.ellipse(x, y, 7 * s + 0.5, 7, 0, 0, Math.PI * 2); c.fill(); c.stroke();
        }, 22);
    },
    vader(c, W, H, t) {                                         // סטארוורס: חלל עם כוכבים שחולפים וכוכב לכת אדום
        bgLinear(c, W, H, ['#020208', '#0a0a1a']);
        for (let i = 0; i < 40; i++) {
            const a = bgH(i + 260) * Math.PI * 2, d = ((bgH(i + 270) + t * 0.15) % 1);
            const x = W / 2 + Math.cos(a) * d * W, y = H * 0.4 + Math.sin(a) * d * W;
            c.strokeStyle = 'rgba(255,255,255,' + d + ')'; c.lineWidth = 1 + d;
            c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 10 * d, y + Math.sin(a) * 10 * d); c.stroke();
        }
        bgGlow(c, W * 0.85, H * 0.82, W * 0.5, '255,40,40', 0.35);
        const g = c.createRadialGradient(W * 0.8, H * 0.78, 4, W * 0.85, H * 0.85, W * 0.32);
        g.addColorStop(0, '#c83a2a'); g.addColorStop(1, '#3a0a0a');
        c.fillStyle = g; c.beginPath(); c.arc(W * 0.85, H * 0.85, W * 0.3, 0, Math.PI * 2); c.fill();
    },
    macmiller(c, W, H, t) { bgConcert(c, W, H, t, ['255,60,80', '180,90,255', '255,160,60']); },
    ella(c, W, H, t) {                                          // אלה הרקדנית: במת בלט ורודה עם זרקור
        bgLinear(c, W, H, ['#2a0a20', '#4a1438']);
        bgSpot(c, W / 2, W, H, '255,230,245', 0.35 + 0.05 * Math.sin(t * 2));
        bgCurtains(c, W, H, '#e8789e', '#a83a64', t);
        c.fillStyle = '#5a2a1a'; c.fillRect(0, H * 0.9, W, H * 0.1);
        bgFallers(c, W, H, t, 10, 281, (x, y, i) => bgSparkle(c, x, y, 2.5, 'rgba(255,240,250,0.8)'), 12);
    },
    shany(c, W, H, t) {                                         // שני הרקדנית: במת פלמנקו אדומה ועלי ורדים נופלים
        bgLinear(c, W, H, ['#1a0404', '#3a0808']);
        bgSpot(c, W / 2, W, H, '255,220,170', 0.35 + 0.05 * Math.sin(t * 2));
        bgCurtains(c, W, H, '#c8102e', '#7a0818', t);
        c.fillStyle = '#3a1a0a'; c.fillRect(0, H * 0.9, W, H * 0.1);
        bgFallers(c, W, H, t, 12, 291, (x, y, i) => { c.fillStyle = i % 3 ? '#e0202e' : '#ff5a6a'; c.beginPath(); c.ellipse(x, y, 5, 3, t * 2 + i, 0, Math.PI * 2); c.fill(); }, 20);
    },
    lebron: (c, W, H, t) => bgCourt(c, W, H, t, '#552583', '#fdb927', '#552583'),    // לברון: אולם בצבעי הקבוצה
    lebron_heat: (c, W, H, t) => bgCourt(c, W, H, t, '#98002e', '#d6243a', '#f9a01b'),
    lebron_cavs: (c, W, H, t) => bgCourt(c, W, H, t, '#6f263d', '#ffb81c', '#041e42'),
    lebron_sixers: (c, W, H, t) => bgCourt(c, W, H, t, '#006bb6', '#ed174c', '#ffffff'),
    tupac(c, W, H, t) {                                         // טופאק: דף מחברת עם שרבוטים בעיפרון
        bgLinear(c, W, H, ['#f3efe5', '#e2dccd']);
        c.strokeStyle = 'rgba(90,140,200,0.25)'; c.lineWidth = 1;
        for (let y = 40; y < H; y += 22) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        c.strokeStyle = 'rgba(220,80,80,0.35)'; c.beginPath(); c.moveTo(W - 34, 0); c.lineTo(W - 34, H); c.stroke();
        c.strokeStyle = 'rgba(50,50,56,0.45)'; c.lineWidth = 1.4; c.lineCap = 'round';
        const w = Math.floor(t * 4) % 2 ? 0.6 : 0;
        // דקל, כוכבים ותווים משורבטים
        c.beginPath(); c.moveTo(30, H * 0.9); c.quadraticCurveTo(40 + w, H * 0.7, 34, H * 0.56); c.stroke();
        for (let i = 0; i < 5; i++) { const a = -Math.PI + i * 0.6 + 0.2; c.beginPath(); c.moveTo(34, H * 0.56); c.quadraticCurveTo(34 + Math.cos(a) * 18, H * 0.56 + Math.sin(a) * 18 - 8, 34 + Math.cos(a) * 32, H * 0.56 + Math.sin(a) * 26 + 8); c.stroke(); }
        for (const [x, y] of [[W * 0.84, H * 0.14], [W * 0.12, H * 0.16], [W * 0.9, H * 0.5]]) {
            c.beginPath(); for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + i * Math.PI * 4 / 5; c[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * 9 + w, y + Math.sin(a) * 9); } c.stroke();
        }
        for (const [x, y] of [[W * 0.78, H * 0.78], [W * 0.18, H * 0.38]]) {
            c.beginPath(); c.ellipse(x, y, 5, 3.5, -0.4, 0, Math.PI * 2); c.stroke();
            c.beginPath(); c.moveTo(x + 5, y); c.lineTo(x + 5, y - 20); c.quadraticCurveTo(x + 12, y - 14, x + 13, y - 8); c.stroke();
        }
    },
    trump(c, W, H, t) {                                         // טראמפ: חוף ים עם שמש, גלים ודקל
        bgLinear(c, W, H, ['#4ab4ff', '#bfe8ff']);
        bgGlow(c, W * 0.82, H * 0.13, 70, '255,240,160', 0.6);
        c.fillStyle = '#ffe680'; c.beginPath(); c.arc(W * 0.82, H * 0.13, 24, 0, Math.PI * 2); c.fill();
        bgCloud(c, W * 0.2 + Math.sin(t * 0.3) * 8, H * 0.12, 18, 'rgba(255,255,255,0.95)');
        const sea = H * 0.56;
        c.fillStyle = '#1e8ad0'; c.fillRect(0, sea, W, H * 0.2);
        c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 2;
        for (let r = 0; r < 4; r++) {
            const y = sea + 8 + r * 12, off = (t * 20 + r * 30) % 40;
            c.beginPath(); for (let x = -40 + off; x < W + 40; x += 40) { c.moveTo(x, y); c.quadraticCurveTo(x + 10, y - 4, x + 20, y); } c.stroke();
        }
        c.fillStyle = '#f2d59a'; c.beginPath(); c.moveTo(0, H); c.lineTo(0, H * 0.76); c.quadraticCurveTo(W / 2, H * 0.72, W, H * 0.76); c.lineTo(W, H); c.fill();
        c.strokeStyle = '#7a4a1a'; c.lineWidth = 7;                 // דקל
        c.beginPath(); c.moveTo(W * 0.06, H); c.quadraticCurveTo(W * 0.14, H * 0.6, W * 0.08, H * 0.3); c.stroke();
        c.fillStyle = '#2a9a3a';
        for (let i = 0; i < 6; i++) { c.save(); c.translate(W * 0.08, H * 0.3); c.rotate(-Math.PI + i * 0.55 + Math.sin(t + i) * 0.05); c.beginPath(); c.ellipse(26, 0, 28, 7, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
        // דגל ארצות הברית קטן על מוט בחול, מתנופף ברוח
        const px = W * 0.8, top = H * 0.34, fw = W * 0.17, fh = fw * 0.55;
        c.strokeStyle = '#d8d8d8'; c.lineWidth = 3; c.beginPath(); c.moveTo(px, H * 0.8); c.lineTo(px, top - 4); c.stroke();
        c.fillStyle = '#ffd23d'; c.beginPath(); c.arc(px, top - 5, 3, 0, Math.PI * 2); c.fill();
        const cols = 24, sw = fw / cols;
        for (let i = 0; i < cols; i++) {
            const x = px + 1.5 + i * sw, dy = Math.sin(t * 4 - i * 0.45) * (i / cols) * 5;
            for (let k = 0; k < 13; k++) {
                c.fillStyle = k % 2 ? '#ffffff' : '#c8102e';
                c.fillRect(x, top + dy + k * fh / 13, sw + 0.6, fh / 13 + 0.6);
            }
            if (i < cols * 0.42) {
                c.fillStyle = '#1f3a8a'; c.fillRect(x, top + dy, sw + 0.6, fh * 7 / 13);
                if (i % 2 === 1) { c.fillStyle = '#ffffff'; for (let k = 0; k < 4; k++) c.fillRect(x + sw * 0.3, top + dy + 2 + k * fh * 7 / 13 / 4.2 + (i % 4 ? 2 : 0), 1.3, 1.3); }
            }
        }
        c.save(); c.translate(W * 0.88, H * 0.86);                 // שמשייה
        c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 30); c.lineTo(0, -40); c.stroke();
        for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#e8262a'; c.beginPath(); c.moveTo(0, -40); c.arc(0, -40, 36, Math.PI + i * Math.PI / 4, Math.PI + (i + 1) * Math.PI / 4); c.fill(); }
        c.restore();
    },
    megatron(c, W, H, t) {                                      // מגהטרון: מפעל רובוטים אפל עם רשת משושים, קרן סריקה אדומה וניצוצות
        bgLinear(c, W, H, ['#07070c', '#14141e', '#07070c']);
        c.strokeStyle = 'rgba(120,130,160,0.14)'; c.lineWidth = 1.2;      // רשת משושים
        const r = 18, hw = r * Math.sqrt(3);
        for (let row = 0, y = 0; y < H + r; y += r * 1.5, row++) {
            for (let x = (row % 2) * hw / 2; x < W + hw; x += hw) {
                c.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; c[k ? 'lineTo' : 'moveTo'](x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.stroke();
            }
        }
        const sy = ((t * 0.35) % 1.3 - 0.15) * H;                        // קרן סריקה
        const sg = c.createLinearGradient(0, sy - 30, 0, sy + 30);
        sg.addColorStop(0, 'rgba(255,30,30,0)'); sg.addColorStop(0.5, 'rgba(255,30,30,0.35)'); sg.addColorStop(1, 'rgba(255,30,30,0)');
        c.fillStyle = sg; c.fillRect(0, sy - 30, W, 60);
        for (const sx of [0.06, 0.94]) {                                // עמודי פלדה עם נורות
            c.fillStyle = '#1c1c26'; c.fillRect(W * sx - 14, 0, 28, H);
            c.strokeStyle = '#3a3a4a'; c.lineWidth = 2; c.strokeRect(W * sx - 14, -2, 28, H + 4);
            for (let y = 30; y < H; y += 60) { const on = Math.sin(t * 4 + y) > 0; skE(c, W * sx, y, 4, 4, on ? '#ff3a3a' : '#4a1a1a'); if (on) bgGlow(c, W * sx, y, 12, '255,50,50', 0.6); }
        }
        bgGlow(c, W / 2, H * 0.45, W * 0.5, '170,40,255', 0.18);
        bgRisers(c, W, H, t, 16, 371, (x, y, i) => { c.fillStyle = i % 3 ? 'rgba(255,170,60,0.85)' : 'rgba(255,255,200,0.9)'; c.fillRect(x, y, 2, 2); }, 40);
    },
    nir(c, W, H, t) { bgCourt(c, W, H, t, '#0038b8', '#0038b8', '#ffffff'); },
    wizmouse(c, W, H, t) {                                      // מיקי המכשף: טירה בלילה, ירח וקסם מסתחרר
        bgLinear(c, W, H, ['#0a0a30', '#1e1a5a', '#2a1a5a']);
        bgStars(c, W, H, t, 40, 301, '255,250,220', 0.7);
        c.fillStyle = '#f4ecc8'; c.beginPath(); c.arc(W * 0.82, H * 0.14, 20, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#1e1a5a'; c.beginPath(); c.arc(W * 0.86, H * 0.12, 18, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#0a0820';                                // טירה
        for (const [x, w, h] of [[0.02, 0.1, 0.42], [0.12, 0.12, 0.3], [0.8, 0.12, 0.34], [0.9, 0.1, 0.46]]) {
            c.fillRect(W * x, H * (1 - h), W * w, H * h);
            c.beginPath(); c.moveTo(W * x - 4, H * (1 - h)); c.lineTo(W * (x + w / 2), H * (1 - h) - 30); c.lineTo(W * (x + w) + 4, H * (1 - h)); c.fill();
            c.fillStyle = 'rgba(255,220,120,0.8)'; c.fillRect(W * (x + w / 2) - 3, H * (1 - h) + 16, 6, 9); c.fillStyle = '#0a0820';
        }
        for (let i = 0; i < 18; i++) {                           // ניצוצות קסם בספירלה
            const a = t * 1.2 + i * 0.7, r = 40 + i * 6;
            bgSparkle(c, W / 2 + Math.cos(a) * r * 1.2, H * 0.42 + Math.sin(a) * r * 0.5, 2 + (i % 3), 'rgba(140,200,255,' + (0.8 - i / 30) + ')');
        }
    },
    wizmouse_magic(c, W, H, t) {                                // מיקי הקוסם: במת מופע קסמים
        bgLinear(c, W, H, ['#1a0410', '#2a0818']);
        bgSpot(c, W / 2, W, H, '255,240,200', 0.4);
        bgCurtains(c, W, H, '#b3121f', '#6a0610', t);
        c.fillStyle = '#2a1408'; c.fillRect(0, H * 0.9, W, H * 0.1);
        bgFallers(c, W, H, t, 16, 311, (x, y, i) => bgSparkle(c, x, y, 2.5, i % 2 ? 'rgba(255,215,90,0.9)' : 'rgba(255,255,255,0.85)'), 14);
    }
};
SK_BG.nir_champ = (c, W, H, t, sk) => {                         // ניר האלוף: אולם + קונפטי זהב
    SK_BG.nir(c, W, H, t, sk);
    bgFallers(c, W, H, t, 22, 321, (x, y, i) => { c.fillStyle = i % 2 ? '#ffd23d' : '#ffffff'; c.save(); c.translate(x, y); c.rotate(t * 3 + i); c.fillRect(-3, -1.5, 6, 3); c.restore(); }, 30);
};

// הרקע שמתאים לסקין (או לסקין הראשי שלו), אם יש
function skSkinBg(sk) { return SK_BG[sk.id] || (sk.variantOf && SK_BG[sk.variantOf]) || null; }

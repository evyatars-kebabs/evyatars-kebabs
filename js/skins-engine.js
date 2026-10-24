/* ============================================================
   מנוע ציור לדמויות אנושיות (סקינים של שוורץ)
   מערכת קואורדינטות: הראשית היא מרכז הפה, הראש ממורכז ב-(0,-34)
   ============================================================ */

const SK_HEAD = { cx: 0, cy: -34, rx: 88, ry: 94 };

function skHex(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
// t>0 מבהיר, t<0 מכהה
function skShade(hex, t) {
    const [r, g, b] = skHex(hex);
    const f = v => Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t));
    return 'rgb(' + f(r) + ',' + f(g) + ',' + f(b) + ')';
}
function skA(hex, a) {
    const [r, g, b] = skHex(hex);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}
function skE(c, x, y, rx, ry, fill, stroke, lw, rot) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); }
}
function skP(c, pts, fill, stroke, lw, open) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    if (!open) c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.lineJoin = 'round'; c.stroke(); }
}
function skR(c, x, y, w, h, r, fill, stroke, lw) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); }
}
function skStar(c, x, y, r, fill, rot) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
        const a = (i * Math.PI) / 5 - Math.PI / 2 + (rot || 0);
        const rr = i % 2 === 0 ? r : r * 0.45;
        c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
    c.fillStyle = fill;
    c.fill();
}
function skGlow(c, x, y, r, color, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, skA(color, a));
    g.addColorStop(1, skA(color, 0));
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
}
const SK_OUT = 'rgba(25, 12, 6, 0.85)';

/* ---------------- אפקטים אחוריים ---------------- */
function skAuraBack(c, sk, t) {
    const a = sk.aura;
    if (!a) return;
    skGlow(c, 0, -40, 190, a.color, a.alpha || 0.35);
    if (a.runes) {                                  // טבעת רונות מסתובבת
        c.save();
        c.translate(0, -30);
        c.rotate(t * 0.5);
        c.strokeStyle = skA(a.color, 0.7);
        c.lineWidth = 3;
        c.beginPath(); c.arc(0, 0, 150, 0, Math.PI * 2); c.stroke();
        c.lineWidth = 1.5;
        c.beginPath(); c.arc(0, 0, 132, 0, Math.PI * 2); c.stroke();
        for (let i = 0; i < 16; i++) {
            c.save(); c.rotate(i * Math.PI / 8);
            c.fillStyle = skA(a.color, 0.85);
            if (i % 2) c.fillRect(-2, -150, 4, 14); else skP(c, [[-5, -132], [5, -132], [0, -152]], skA(a.color, 0.85));
            c.restore();
        }
        c.restore();
    }
    if (a.rings) {                                  // טבעות קוסמיות
        c.save();
        c.translate(0, -34);
        for (let i = 0; i < 2; i++) {
            c.save();
            c.rotate(t * (i ? -0.6 : 0.45) + i);
            c.scale(1, 0.3);
            c.strokeStyle = skA(i ? '#8fd3ff' : a.color, 0.75);
            c.lineWidth = 3;
            c.beginPath(); c.arc(0, 0, 150 - i * 18, 0, Math.PI * 2); c.stroke();
            c.restore();
        }
        c.restore();
    }
}

function skWings(c, sk, t) {
    const w = sk.wings;
    if (!w) return;
    const flap = Math.sin(t * 2.4) * 0.07;
    for (const side of [-1, 1]) {
        c.save();
        c.translate(side * 70, 40);
        c.scale(side, 1);
        if (w.type === 'feather') {
            for (let i = 0; i < 7; i++) {
                c.save();
                c.rotate(-0.25 - i * 0.2 - flap * (i + 1) * 0.4);
                skE(c, 78 + i * 4, 0, 78 - i * 4, 15 - i * 0.7, i % 2 ? '#ffffff' : '#f1f4ff', 'rgba(150,170,210,0.8)', 1.5);
                c.restore();
            }
        } else {                                      // כנפי דרקון
            c.rotate(flap * 0.6);
            const col = w.color || '#2d6a3a';
            skP(c, [[0, 0], [60, -120], [120, -170], [150, -90], [190, -120], [180, -20], [215, -30], [150, 40], [80, 60], [0, 30]], col, '#0e2a14', 3);
            c.strokeStyle = skShade(col, 0.35);
            c.lineWidth = 3;
            for (const p of [[120, -170], [150, -90], [180, -20], [150, 40]]) {
                c.beginPath(); c.moveTo(0, 0); c.lineTo(p[0], p[1]); c.stroke();
            }
        }
        c.restore();
    }
}

function skCapeBack(c, sk, t) {
    const cp = sk.cape;
    if (!cp) return;
    const sway = Math.sin(t * 2) * 8;
    const g = c.createLinearGradient(0, 40, 0, 330);
    g.addColorStop(0, cp.color);
    g.addColorStop(1, skShade(cp.color, -0.45));
    c.beginPath();
    c.moveTo(-80, 50);
    c.quadraticCurveTo(-190 - sway, 170, -170 + sway, 340);
    c.lineTo(170 + sway, 340);
    c.quadraticCurveTo(190 + sway, 170, 80, 50);
    c.closePath();
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = skA('#000000', 0.55);
    c.lineWidth = 3;
    c.stroke();
    if (cp.stars) {                                 // שמיים זרועי כוכבים
        c.save(); c.clip();
        for (let i = 0; i < 26; i++) {
            const sx = ((i * 83) % 300) - 150, sy = 70 + ((i * 47) % 240);
            const tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
            skStar(c, sx, sy, 2 + (i % 3) + tw * 2, 'rgba(255,255,255,' + (0.5 + tw * 0.5) + ')');
        }
        c.restore();
    }
}

/* ---------------- שיער ---------------- */
function skHairBack(c, sk, t) {
    const h = sk.hair;
    if (!h) return;
    const col = h.color || '#222222', dk = skShade(col, -0.35);
    // בגרסאות נשיות שיער ארוך מציץ מתחת לכובע (ולהבות ארוכות לשיער אש)
    const flow = sk.look === 'f' && (h.style === 'flame' || sk.hat && ['bun', 'ponytail', 'short', 'buzz', 'curly', 'bob'].includes(h.style));
    if (h.style === 'flame' && flow) {
        const g = c.createLinearGradient(0, -90, 0, 150);
        g.addColorStop(0, '#ffd33d'); g.addColorStop(0.45, '#ff8a1a'); g.addColorStop(1, 'rgba(255,59,15,0)');
        const w = Math.sin(t * 4) * 6;
        c.beginPath();
        c.moveTo(-96, -90);
        c.bezierCurveTo(-140 + w, -30, -126 - w, 90, -104 + w, 150);
        c.quadraticCurveTo(-80, 120, -60 - w, 160); c.lineTo(60 + w, 160); c.quadraticCurveTo(80, 120, 104 - w, 150);
        c.bezierCurveTo(126 + w, 90, 140 - w, -30, 96, -90);
        c.closePath();
        c.fillStyle = g; c.fill();
    } else if (h.style === 'long' || h.style === 'bob' || h.style === 'wavy' || h.style === 'parted' || flow) {
        const len = flow ? 70 : (h.style === 'bob' ? 40 : (h.style === 'wavy' ? 120 : 110));
        c.beginPath();
        c.moveTo(-96, -90);
        c.bezierCurveTo(-130, -40, -118, len, -100, len + 24);
        c.lineTo(100, len + 24);
        c.bezierCurveTo(118, len, 130, -40, 96, -90);
        c.closePath();
        c.fillStyle = dk; c.fill();
        c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
    } else if (h.style === 'ponytail') {
        c.save();
        c.translate(86, -86);
        c.rotate(-0.25 + Math.sin(t * 2) * 0.05);
        skE(c, 24, 38, 20, 52, col, SK_OUT, 3, -0.15);
        c.restore();
    } else if (h.style === 'afro') {
        skE(c, 0, -76, 124, 112, col, SK_OUT, 3);
        for (let i = 0; i < 14; i++) {
            const a = (i / 14) * Math.PI * 2;
            skE(c, Math.cos(a) * 118, -76 + Math.sin(a) * 106, 14, 14, col);
        }
    } else if (h.style === 'frizz') {                // ענן שיער פרוע (איינשטיין)
        const puffs = [];
        for (let i = 0; i <= 12; i++) {
            const a = Math.PI * 0.92 + (i / 12) * Math.PI * 1.16;
            const r = 96 + (i % 3) * 10 + (i % 2 ? 8 : 0);
            puffs.push([Math.cos(a) * r * 1.12, -52 + Math.sin(a) * r * 0.9, 34 + (i % 3) * 6]);
        }
        for (const s of [-1, 1]) puffs.push([s * 126, -8, 32], [s * 136, -44, 30]);
        for (const [x, y, r] of puffs) skE(c, x, y, r, r * 0.86, skShade(col, -0.18), SK_OUT, 2.5);
        for (const [x, y, r] of puffs) skE(c, x - r * 0.15, y - r * 0.15, r * 0.82, r * 0.7, col);
        c.strokeStyle = skA(skShade(col, -0.3), 0.8); c.lineWidth = 2; c.lineCap = 'round';
        for (let i = 0; i < 18; i++) {                // שערות סוררות
            const a = Math.PI * 0.95 + (i / 17) * Math.PI * 1.1, r = 128 + (i % 4) * 8;
            const x = Math.cos(a) * r * 1.1, y = -52 + Math.sin(a) * r * 0.88;
            c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * 14 + 6, y + Math.sin(a) * 14 - 6, x + Math.cos(a) * 24, y + Math.sin(a) * 22); c.stroke();
        }
    } else if (h.style === 'galaxy') {
        const g = c.createRadialGradient(0, -80, 20, 0, -60, 150);
        g.addColorStop(0, '#7a4bff'); g.addColorStop(0.5, '#3b2a9c'); g.addColorStop(1, '#120a3d');
        c.beginPath();
        c.moveTo(-100, -80);
        c.bezierCurveTo(-170, -10, -140, 130, -90, 160);
        c.lineTo(90, 160);
        c.bezierCurveTo(140, 130, 170, -10, 100, -80);
        c.closePath();
        c.fillStyle = g; c.fill();
        c.save(); c.clip();
        for (let i = 0; i < 34; i++) {
            const sx = ((i * 71) % 260) - 130, sy = -80 + ((i * 53) % 230);
            const tw = 0.5 + 0.5 * Math.sin(t * 2.5 + i * 1.7);
            skE(c, sx, sy, 1.2 + tw * 1.6, 1.2 + tw * 1.6, 'rgba(255,255,255,' + (0.45 + tw * 0.55) + ')');
        }
        c.restore();
        c.strokeStyle = 'rgba(190,170,255,0.8)'; c.lineWidth = 2.5; c.stroke();
    }
}

function skFlameHair(c, t) {
    const cols = ['#ff3b0f', '#ff8a1a', '#ffd33d'];
    for (let layer = 0; layer < 3; layer++) {
        const n = 7 - layer;
        for (let i = 0; i < n; i++) {
            const x = -78 + (i / (n - 1)) * 156;
            const base = -88 + Math.abs(x) * 0.28;
            const hgt = (70 - layer * 16) + Math.sin(t * 7 + i * 1.9 + layer) * 14;
            const sway = Math.sin(t * 5 + i) * 7;
            c.beginPath();
            c.moveTo(x - 18, base + 14);
            c.quadraticCurveTo(x - 6 + sway, base - hgt * 0.5, x + sway * 1.6, base - hgt);
            c.quadraticCurveTo(x + 8 + sway, base - hgt * 0.4, x + 18, base + 14);
            c.closePath();
            c.fillStyle = cols[layer];
            c.fill();
        }
    }
}

function skHairFront(c, sk, t) {
    const h = sk.hair;
    if (!h || h.style === 'bald' || h.style === 'afro' && false) return;
    const col = h.color || '#222222', dk = skShade(col, -0.35), hl = skShade(col, 0.2);
    const cap = () => {
        c.beginPath();
        c.moveTo(-91, -46);
        c.bezierCurveTo(-100, -120, -62, -142, 0, -142);
        c.bezierCurveTo(62, -142, 100, -120, 91, -46);
        c.lineTo(80, -72);
        c.quadraticCurveTo(44, -100, 0, -90);
        c.quadraticCurveTo(-44, -100, -80, -72);
        c.closePath();
    };
    switch (h.style) {
        case 'short': case 'ponytail': case 'long': case 'bob': case 'wavy':
            cap(); c.fillStyle = col; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
            c.strokeStyle = hl; c.lineWidth = 3; c.beginPath(); c.moveTo(-40, -126); c.quadraticCurveTo(-10, -138, 24, -130); c.stroke();
            if (h.style !== 'short' && h.style !== 'ponytail') {      // תלתלים בצדדים
                skE(c, -92, -30, 12, 44, col, SK_OUT, 2.5);
                skE(c, 92, -30, 12, 44, col, SK_OUT, 2.5);
            }
            break;
        case 'buzz':
            cap(); c.fillStyle = skA(col, 0.78); c.fill();
            break;
        case 'parted': {                              // שיער ארוך עם שביל באמצע, בלי פוני
            for (const sd of [-1, 1]) {
                c.beginPath();
                c.moveTo(sd * 2, -142);
                c.bezierCurveTo(sd * 40, -146, sd * 100, -120, sd * 96, -40);
                c.lineTo(sd * 98, 10);
                c.lineTo(sd * 84, 6);
                c.bezierCurveTo(sd * 84, -50, sd * 70, -96, sd * 2, -126);
                c.closePath();
                c.fillStyle = col; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
                c.strokeStyle = hl; c.lineWidth = 2.5;
                c.beginPath(); c.moveTo(sd * 18, -136); c.quadraticCurveTo(sd * 64, -122, sd * 82, -70); c.stroke();
            }
            break;
        }
        case 'sidebald':
            skE(c, -88, -46, 12, 30, col, SK_OUT, 2); skE(c, 88, -46, 12, 30, col, SK_OUT, 2);
            skE(c, -80, -72, 14, 16, col); skE(c, 80, -72, 14, 16, col);
            break;
        case 'bun':
            skE(c, 0, -156, 28, 26, col, SK_OUT, 3);
            cap(); c.fillStyle = col; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
            break;
        case 'curly':
            for (let i = 0; i < 13; i++) {
                const a = Math.PI + (i / 12) * Math.PI;
                skE(c, Math.cos(a) * 82, -62 + Math.sin(a) * 82, 24, 24, col, SK_OUT, 2.5);
            }
            skE(c, -50, -118, 26, 26, col, SK_OUT, 2.5); skE(c, 0, -134, 28, 28, col, SK_OUT, 2.5); skE(c, 50, -118, 26, 26, col, SK_OUT, 2.5);
            skE(c, -20, -112, 40, 22, col); skE(c, 24, -112, 40, 22, col);
            break;
        case 'afro':
            c.beginPath();
            c.moveTo(-84, -64); c.quadraticCurveTo(0, -112, 84, -64); c.lineTo(88, -74);
            c.quadraticCurveTo(0, -150, -88, -74); c.closePath();
            c.fillStyle = col; c.fill();
            break;
        case 'wild':
            for (let i = 0; i < 11; i++) {
                const a = Math.PI * 1.08 + (i / 10) * Math.PI * 0.84;
                const bx = Math.cos(a) * 80, by = -48 + Math.sin(a) * 88;
                const len = 38 + (i % 3) * 18;
                skP(c, [[bx - 14, by + 8], [Math.cos(a) * (80 + len), -48 + Math.sin(a) * (88 + len)], [bx + 14, by + 8]], col, SK_OUT, 2);
            }
            cap(); c.fillStyle = col; c.fill();
            break;
        case 'mohawk': {
            const mc = h.color, mc2 = h.color2 || mc;
            for (let i = 0; i < 7; i++) {
                const x = -30 + i * 10;
                const hh = 70 + (i === 3 ? 22 : (i % 2 ? 0 : 10));
                skP(c, [[x - 8, -120], [x + 1, -120 - hh], [x + 10, -120]], i % 2 ? mc : mc2, SK_OUT, 2);
            }
            skE(c, 0, -118, 30, 12, skShade(mc, -0.25));
            break;
        }
        case 'slick':
            cap(); c.fillStyle = col; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
            c.strokeStyle = hl; c.lineWidth = 3;
            for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-60 + i * 30, -128); c.quadraticCurveTo(-30 + i * 30, -118, -20 + i * 30, -96); c.stroke(); }
            break;
        case 'frizz': {
            for (const s of [-1, 1]) {                // ציציות פרועות שבורחות לצדדים
                skP(c, [[s * 78, -96], [s * 124, -118], [s * 98, -84], [s * 138, -74], [s * 100, -58], [s * 132, -30],
                        [s * 96, -34], [s * 116, -6], [s * 86, -18], [s * 80, -50]].map(([x, y]) => [x, y]), col, SK_OUT, 2.2);
                c.strokeStyle = skA(skShade(col, -0.3), 0.7); c.lineWidth = 1.6;
                c.beginPath(); c.moveTo(s * 86, -80); c.lineTo(s * 114, -96); c.moveTo(s * 90, -56); c.lineTo(s * 124, -64); c.moveTo(s * 88, -30); c.lineTo(s * 110, -18); c.stroke();
            }
            c.lineCap = 'round';
            for (const [x0, y0, x1, y1, cx, cy] of [[-40, -126, -10, -150, -36, -152], [-8, -132, 22, -158, 0, -160], [20, -128, 52, -146, 44, -152], [-58, -112, -76, -140, -74, -124]]) {
                c.strokeStyle = SK_OUT; c.lineWidth = 6.5;
                c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke();
                c.strokeStyle = col; c.lineWidth = 4;
                c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke();
            }
            c.strokeStyle = col; c.lineWidth = 4; c.lineCap = 'round';
            for (const [x0, y0, x1, y1, cx, cy] of [[-40, -126, -10, -150, -36, -152], [-8, -132, 22, -158, 0, -160], [20, -128, 52, -146, 44, -152], [-58, -112, -76, -140, -74, -124]]) {
                c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke();
            }
            break;
        }
        case 'flame':
            skFlameHair(c, t);
            break;
        case 'galaxy':
            cap(); c.fillStyle = '#2b1d82'; c.fill();
            c.strokeStyle = 'rgba(200,180,255,0.9)'; c.lineWidth = 2.5; c.stroke();
            for (let i = 0; i < 10; i++) {
                const tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 2.1);
                skE(c, -60 + (i * 41) % 120, -128 + (i * 17) % 34, 1.4 + tw * 1.4, 1.4 + tw * 1.4, 'rgba(255,255,255,' + (0.5 + tw * 0.5) + ')');
            }
            break;
    }
}

/* ---------------- גוף ולבוש ---------------- */
function skTorsoPath(c) {
    c.beginPath();
    c.moveTo(-32, 44);
    c.bezierCurveTo(-34, 70, -66, 74, -96, 88);
    c.bezierCurveTo(-120, 100, -124, 150, -124, 200);
    c.lineTo(-124, 340);
    c.lineTo(124, 340);
    c.lineTo(124, 200);
    c.bezierCurveTo(124, 150, 120, 100, 96, 88);
    c.bezierCurveTo(66, 74, 34, 70, 32, 44);
    c.closePath();
}

function skOutfit(c, sk, t) {
    const o = sk.outfit || { base: '#3b6fd4' };
    // צוואר
    skR(c, -26, 30, 52, 48, 10, skShade(sk.tone, -0.12), null);
    skTorsoPath(c);
    c.fillStyle = o.base;
    c.fill();
    c.save();
    skTorsoPath(c);
    c.clip();
    const tr = o.trim || skShade(o.base, -0.3);

    switch (o.pattern) {
        case 'stripes':
            c.fillStyle = tr;
            for (let y = 76; y < 340; y += 28) c.fillRect(-130, y, 260, 12);
            break;
        case 'plaid':
            c.fillStyle = skA(tr, 0.55);
            for (let x = -130; x < 130; x += 30) c.fillRect(x, 60, 10, 290);
            for (let y = 70; y < 340; y += 30) c.fillRect(-130, y, 260, 10);
            break;
        case 'plates':
            for (let i = 0; i < 6; i++) {
                const y = 96 + i * 40;
                c.strokeStyle = tr; c.lineWidth = 3;
                c.beginPath(); c.moveTo(-130, y); c.quadraticCurveTo(0, y + 12, 130, y); c.stroke();
                c.fillStyle = skShade(o.base, 0.25);
                for (const x of [-96, -48, 0, 48, 96]) skE(c, x, y + 14, 2.6, 2.6, '#f4e7b0');
            }
            break;
        case 'scales':
            for (let row = 0; row < 9; row++) {
                for (let col = -5; col <= 5; col++) {
                    const x = col * 26 + (row % 2 ? 13 : 0), y = 84 + row * 22;
                    c.beginPath(); c.arc(x, y, 14, 0, Math.PI);
                    c.fillStyle = skShade(o.base, (row + col) % 2 ? 0.12 : -0.08);
                    c.fill();
                    c.strokeStyle = skA('#06200c', 0.7); c.lineWidth = 1.5; c.stroke();
                }
            }
            break;
        case 'stars':
            for (let i = 0; i < 18; i++) {
                const tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.3);
                skStar(c, -105 + (i * 53) % 210, 90 + (i * 37) % 220, 3 + tw * 2, 'rgba(255,255,255,' + (0.45 + tw * 0.5) + ')');
            }
            break;
        case 'ermine':
            c.fillStyle = '#17120f';
            for (let i = 0; i < 12; i++) { const x = -100 + (i * 59) % 200, y = 110 + (i * 41) % 200; skP(c, [[x, y - 6], [x + 3, y + 5], [x - 3, y + 5]], '#17120f'); }
            break;
        case 'neon':
            c.strokeStyle = o.glow || '#35e0ff'; c.lineWidth = 3;
            c.shadowColor = o.glow || '#35e0ff'; c.shadowBlur = 8;
            c.beginPath(); c.moveTo(-70, 90); c.lineTo(-70, 190); c.lineTo(-30, 230); c.lineTo(-30, 340); c.stroke();
            c.beginPath(); c.moveTo(70, 90); c.lineTo(70, 190); c.lineTo(30, 230); c.lineTo(30, 340); c.stroke();
            c.shadowBlur = 0;
            break;
        case 'vest':
            c.fillStyle = o.under || '#6b7280'; c.fillRect(-130, 60, 260, 290);
            skP(c, [[-100, 80], [-40, 80], [-34, 340], [-124, 340]], o.base);
            skP(c, [[100, 80], [40, 80], [34, 340], [124, 340]], o.base);
            c.fillStyle = '#e8eef5';
            c.fillRect(-100, 160, 70, 12); c.fillRect(30, 160, 70, 12);
            c.fillRect(-110, 230, 78, 12); c.fillRect(32, 230, 78, 12);
            break;
    }

    // סינר / סרבל / חגורות
    if (o.apron) {                                    // מעיל שף כפול
        skP(c, [[-90, 80], [0, 100], [90, 80], [100, 340], [-100, 340]], '#fbfbfd', 'rgba(0,0,0,0.25)', 2);
        c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, 100); c.lineTo(0, 340); c.stroke();
        for (const x of [-26, 26]) for (let y = 130; y < 330; y += 46) skE(c, x, y, 6, 6, '#c9ccd4', 'rgba(0,0,0,0.4)', 1.5);
    }
    if (o.overall) {                                  // סרבל
        c.fillStyle = o.overall;
        c.fillRect(-124, 190, 248, 160);
        c.fillRect(-72, 70, 24, 130); c.fillRect(48, 70, 24, 130);
        skR(c, -40, 205, 80, 54, 6, skShade(o.overall, -0.2), 'rgba(0,0,0,0.3)', 2);
        skE(c, -60, 196, 6, 6, '#e9c46a'); skE(c, 60, 196, 6, 6, '#e9c46a');
    }
    if (o.jacket) {                                   // ז'קט עור עם דשים
        skP(c, [[-124, 340], [-124, 120], [-60, 84], [-14, 110], [-30, 340]], o.jacket, 'rgba(0,0,0,0.6)', 3);
        skP(c, [[124, 340], [124, 120], [60, 84], [14, 110], [30, 340]], o.jacket, 'rgba(0,0,0,0.6)', 3);
        c.strokeStyle = '#c9ccd4'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(-14, 110); c.lineTo(-30, 340); c.stroke();
        for (const [x, y] of [[-100, 130], [-78, 112], [100, 130], [78, 112], [-100, 180], [100, 180], [-100, 230], [100, 230]]) skE(c, x, y, 3.5, 3.5, '#e7e9ee');
    }
    if (o.coat) {                                     // מעיל ארוך עם דשים
        skP(c, [[-124, 340], [-124, 100], [-62, 84], [-8, 150], [-14, 340]], o.coat, 'rgba(0,0,0,0.45)', 3);
        skP(c, [[124, 340], [124, 100], [62, 84], [8, 150], [14, 340]], o.coat, 'rgba(0,0,0,0.45)', 3);
        for (const y of [190, 240, 290]) { skE(c, -22, y, 5, 5, '#7a5a2c'); skE(c, 22, y, 5, 5, '#7a5a2c'); }
    }
    if (o.cardigan) {
        skP(c, [[-124, 340], [-124, 100], [-62, 84], [-8, 140], [-14, 340]], o.cardigan, 'rgba(0,0,0,0.4)', 3);
        skP(c, [[124, 340], [124, 100], [62, 84], [8, 140], [14, 340]], o.cardigan, 'rgba(0,0,0,0.4)', 3);
        for (const y of [190, 240, 290]) skE(c, -24, y, 5, 5, '#e9dcc0');
    }
    if (o.straps) {                                   // רצועות אלכסוניות (נינג'ה / אביר)
        c.strokeStyle = o.straps; c.lineWidth = 16;
        c.beginPath(); c.moveTo(-110, 90); c.lineTo(100, 330); c.stroke();
        c.beginPath(); c.moveTo(110, 90); c.lineTo(-100, 330); c.stroke();
    }
    if (o.sash) {
        skP(c, [[-124, 255], [124, 235], [124, 275], [-124, 295]], o.sash, 'rgba(0,0,0,0.4)', 2);
    }
    if (o.fur) {                                      // גלימת פרווה
        for (let i = 0; i < 17; i++) {
            const a = Math.PI + (i / 16) * Math.PI;
            const x = Math.cos(a) * 112, y = 92 + Math.sin(a) * -6 + Math.abs(Math.cos(a)) * 36;
            skE(c, x, y, 24, 22, i % 2 ? '#8a6a45' : '#a07d52', 'rgba(40,24,10,0.6)', 2);
        }
        skR(c, -118, 120, 236, 24, 8, '#4a3220', 'rgba(0,0,0,0.5)', 2);
        skE(c, 0, 132, 9, 9, '#d9b25a');
    }
    if (o.badge) {                                    // תג
        skP(c, [[-72, 130], [-52, 122], [-32, 130], [-36, 154], [-52, 164], [-68, 154]], o.badge, 'rgba(0,0,0,0.5)', 2);
        skStar(c, -52, 142, 8, '#fff6c8');
    }
    if (o.emblem) {                                   // סמל על החזה (גיבור-על)
        skP(c, [[-34, 118], [34, 118], [38, 168], [0, 196], [-38, 168]], o.emblem, 'rgba(0,0,0,0.6)', 3);
        c.fillStyle = '#d6291f';
        c.font = 'bold 44px Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText('ק', 0, 154);
    }
    if (o.patchFlag) {                                // טלאי חלל
        skR(c, 54, 140, 36, 22, 3, '#ffffff', 'rgba(0,0,0,0.4)', 1.5);
        c.fillStyle = '#d6291f'; c.fillRect(54, 146, 36, 5); c.fillRect(54, 154, 36, 5);
        c.fillStyle = '#2a3f9a'; c.fillRect(54, 140, 14, 11);
        skE(c, -64, 150, 14, 14, '#2a3f9a', '#ffffff', 2);
        skE(c, -64, 150, 5, 5, '#ffffff');
    }
    if (o.belt) {
        c.fillStyle = o.belt; c.fillRect(-124, 290, 248, 16);
        skR(c, -14, 288, 28, 20, 3, '#e9c46a', 'rgba(0,0,0,0.5)', 2);
    }
    if (o.tabard) {                                   // טבארד עם צלב
        skP(c, [[-58, 86], [58, 86], [66, 340], [-66, 340]], '#f5f5f7', 'rgba(0,0,0,0.35)', 2);
        c.fillStyle = '#c42b2b'; c.fillRect(-9, 100, 18, 150); c.fillRect(-40, 138, 80, 18);
    }
    if (o.trimEdge) {
        c.strokeStyle = o.trimEdge; c.lineWidth = 8;
        c.beginPath(); c.moveTo(-14, 110); c.lineTo(-30, 340); c.moveTo(14, 110); c.lineTo(30, 340); c.stroke();
    }
    c.restore();
    c.strokeStyle = SK_OUT; c.lineWidth = 3;
    skTorsoPath(c);
    c.stroke();

    // צווארונים
    switch (o.collar) {
        case 'crew':
            skE(c, 0, 52, 36, 16, skShade(o.base, -0.22), SK_OUT, 2.5);
            skE(c, 0, 48, 28, 10, skShade(sk.tone, -0.12));
            break;
        case 'v':
            skP(c, [[-34, 46], [34, 46], [0, 118]], o.inner || '#f3f3f6', SK_OUT, 2.5);
            break;
        case 'hood':
            c.beginPath(); c.arc(0, 60, 66, Math.PI * 1.05, Math.PI * 1.95); c.lineWidth = 22; c.strokeStyle = skShade(o.base, -0.2); c.stroke();
            c.strokeStyle = '#f3f3f6'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(-24, 74); c.lineTo(-26, 130); c.moveTo(24, 74); c.lineTo(26, 130); c.stroke();
            skE(c, -26, 132, 4, 4, '#f3f3f6'); skE(c, 26, 132, 4, 4, '#f3f3f6');
            break;
        case 'tie':
            skP(c, [[-36, 44], [0, 74], [-10, 96]], '#f7f7fa', SK_OUT, 2);
            skP(c, [[36, 44], [0, 74], [10, 96]], '#f7f7fa', SK_OUT, 2);
            skP(c, [[-8, 74], [8, 74], [12, 150], [0, 166], [-12, 150]], o.tie || '#c42b2b', SK_OUT, 2);
            break;
        case 'bandana':
            skP(c, [[-44, 52], [44, 52], [0, 118]], o.bandana || '#c42b2b', SK_OUT, 2.5);
            c.fillStyle = 'rgba(255,255,255,0.7)';
            for (const [x, y] of [[-16, 68], [6, 76], [-4, 92], [14, 62]]) skE(c, x, y, 2.4, 2.4, 'rgba(255,255,255,0.8)');
            break;
        case 'high':
            skR(c, -38, 38, 76, 28, 8, skShade(o.base, -0.15), SK_OUT, 2.5);
            break;
        case 'ring':
            skE(c, 0, 58, 54, 20, '#e8ecf4', 'rgba(60,70,90,0.8)', 3);
            skE(c, 0, 54, 40, 12, '#cdd3e0');
            break;
        case 'crewdark':
            skE(c, 0, 52, 36, 16, '#14171e', SK_OUT, 2.5);
            break;
    }
}

/* ---------------- פנים ---------------- */
function skHead(c, sk) {
    const H = SK_HEAD, tone = sk.tone;
    // אוזניים
    for (const s of [-1, 1]) {
        skE(c, s * 86, -30, 13, 18, tone, SK_OUT, 2.5);
        skE(c, s * 86, -30, 6, 10, skShade(tone, -0.15));
    }
    const g = c.createRadialGradient(-24, -70, 10, 0, -34, 104);
    g.addColorStop(0, skShade(tone, 0.14));
    g.addColorStop(0.7, tone);
    g.addColorStop(1, skShade(tone, -0.16));
    skE(c, H.cx, H.cy, H.rx, H.ry, g, SK_OUT, 3);
    // אף
    skE(c, 0, -30, 11, 9, skShade(tone, -0.14));
    skE(c, -2, -33, 5, 3.5, skShade(tone, 0.22));
}

// ריסים מעל העין (לגרסאות הנשיות)
function skLashes(c, cx, ey, side) {
    c.strokeStyle = '#1a0d06'; c.lineWidth = 2.6; c.lineCap = 'round';
    for (const [a, l] of [[-2.55, 9], [-2.15, 10], [-1.8, 9], [-1.45, 7]]) {
        const ang = side < 0 ? a : -Math.PI - a;
        const sx = cx + Math.cos(ang) * 15, sy = ey + Math.sin(ang) * 16;
        c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo(sx + Math.cos(ang) * l * 0.6, sy + Math.sin(ang) * l * 0.6 - 2, sx + Math.cos(ang) * l, sy + Math.sin(ang) * l - 1); c.stroke();
    }
    // קו איילינר קטן בקצה החיצוני
    const ox = cx + side * 15;
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(ox - side * 2, ey - 4); c.lineTo(ox + side * 7, ey - 9); c.stroke();
}

function skEyes(c, sk, st) {
    const ey = -62;
    const eyeStyle = sk.eyes || {};
    const brow = sk.brow || (sk.hair && sk.hair.color) || '#2b1a0e';
    const happy = st.chew > 0.25;
    for (const o of [-34, 34]) {
        const cx = o;
        const hidden = sk.glasses && (sk.glasses.type === 'shades' || sk.glasses.type === 'aviator') ||
                       sk.eyepatch === (o < 0 ? 'left' : 'right');
        if (!hidden) {
            if (happy) {
                c.strokeStyle = '#2b1608'; c.lineWidth = 4.5; c.lineCap = 'round';
                c.beginPath(); c.arc(cx, ey + 6, 12, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
            } else if (eyeStyle.glow) {
                const pulse = 0.75 + 0.25 * Math.sin(st.t * 5);
                skGlow(c, cx, ey, 30, eyeStyle.glow, 0.8 * pulse);
                skE(c, cx, ey, 12, 12, eyeStyle.glow, 'rgba(0,0,0,0.6)', 2);
                if (eyeStyle.slit) skE(c, cx, ey, 2.6, 11, '#150500');
                else skE(c, cx, ey, 5, 5, '#ffffff');
                if (sk.lashes) skLashes(c, cx, ey - 2, o < 0 ? -1 : 1);
            } else {
                skE(c, cx, ey, 15, 17, '#ffffff', 'rgba(30,15,8,0.85)', 2.5);
                const ang = Math.atan2(st.ty - (st.my + ey), st.tx - (st.mx + cx));
                const dist = Math.min(6.5, Math.hypot(st.tx - (st.mx + cx), st.ty - (st.my + ey)) / 25);
                const px = cx + Math.cos(ang) * dist, py = ey + Math.sin(ang) * dist;
                skE(c, px, py, 8.2, 8.2, eyeStyle.iris || '#3d2a1a');
                skE(c, px, py, 4.2, 4.2, '#0d0604');
                skE(c, px - 2.5, py - 2.6, 2.2, 2.2, '#ffffff');
                if (sk.lashes) skLashes(c, cx, ey, o < 0 ? -1 : 1);
            }
        }
        // גבה
        const lift = st.surprised ? 6 : 0;
        const fem = sk.look === 'f', masc = sk.look === 'm';
        const arch = fem ? 40 : (masc ? 31 : 34), bw = fem ? 4.2 : (masc ? 8 : 6);
        c.strokeStyle = brow; c.lineWidth = bw; c.lineCap = 'round';
        c.beginPath();
        c.moveTo(cx - 15, ey - 26 - lift + (o < 0 ? 3 : 0) - (fem ? 2 : 0));
        c.quadraticCurveTo(cx + (fem ? (o < 0 ? 3 : -3) : 0), ey - arch - lift, cx + 15, ey - 26 - lift + (o < 0 ? 0 : 3) - (fem ? 2 : 0));
        c.stroke();
    }
    // לחיים
    if (sk.blush !== false) {
        const fem = sk.look === 'f';
        c.fillStyle = fem ? 'rgba(255, 80, 120, 0.32)' : 'rgba(255, 90, 100, 0.22)';
        for (const o of [-60, 60]) { c.beginPath(); c.ellipse(o, -16, fem ? 15 : 12, fem ? 9 : 7, 0, 0, Math.PI * 2); c.fill(); }
    }
}

function skFaceMarks(c, sk, t) {
    const f = sk.face || [];
    if (f.includes('freckles')) {
        c.fillStyle = 'rgba(150, 80, 40, 0.65)';
        for (const [x, y] of [[-58, -30], [-48, -22], [-38, -32], [-52, -40], [58, -30], [48, -22], [38, -32], [52, -40], [-30, -22], [30, -22]]) skE(c, x, y, 2.2, 2.2, 'rgba(150,80,40,0.65)');
    }
    if (f.includes('soot')) {
        c.fillStyle = 'rgba(30,25,22,0.35)';
        skE(c, -50, -18, 16, 9, 'rgba(30,25,22,0.32)'); skE(c, 52, -64, 14, 8, 'rgba(30,25,22,0.28)'); skE(c, 6, -88, 18, 7, 'rgba(30,25,22,0.25)');
    }
    if (f.includes('scar')) {
        c.strokeStyle = 'rgba(170, 60, 60, 0.9)'; c.lineWidth = 3; c.lineCap = 'round';
        c.beginPath(); c.moveTo(36, -92); c.lineTo(52, -30); c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 1.5;
        for (const y of [-80, -66, -52, -40]) { c.beginPath(); c.moveTo(35 + (y + 92) * 0.27, y); c.lineTo(45 + (y + 92) * 0.27, y + 3); c.stroke(); }
    }
    if (f.includes('warpaint')) {
        c.strokeStyle = 'rgba(210, 40, 40, 0.9)'; c.lineWidth = 5; c.lineCap = 'round';
        for (const s of [-1, 1]) { c.beginPath(); c.moveTo(s * 42, -30); c.lineTo(s * 70, -16); c.moveTo(s * 40, -20); c.lineTo(s * 68, -4); c.stroke(); }
    }
    if (f.includes('cyberhalf')) {                    // חצי פנים מתכתי
        c.save();
        c.beginPath(); c.ellipse(SK_HEAD.cx, SK_HEAD.cy, SK_HEAD.rx - 1, SK_HEAD.ry - 1, 0, 0, Math.PI * 2); c.clip();
        c.beginPath(); c.moveTo(-8, -140); c.lineTo(-8, -86); c.lineTo(-22, -50); c.lineTo(-14, 10); c.lineTo(-30, 70); c.lineTo(-110, 70); c.lineTo(-110, -140); c.closePath();
        const g = c.createLinearGradient(-90, 0, 0, 0);
        g.addColorStop(0, '#5b6577'); g.addColorStop(0.5, '#b8c2d6'); g.addColorStop(1, '#7c879b');
        c.fillStyle = g; c.fill();
        c.strokeStyle = '#2a3140'; c.lineWidth = 2.5; c.stroke();
        c.strokeStyle = '#35e0ff'; c.lineWidth = 2.5; c.shadowColor = '#35e0ff'; c.shadowBlur = 8;
        c.beginPath(); c.moveTo(-78, -20); c.lineTo(-48, -20); c.lineTo(-34, -4); c.moveTo(-76, -100); c.lineTo(-52, -100); c.lineTo(-40, -84); c.stroke();
        c.shadowBlur = 0;
        c.restore();
        const pulse = 0.7 + 0.3 * Math.sin(t * 4);
        skGlow(c, -34, -62, 36, '#ff2a2a', pulse);
        skE(c, -34, -62, 14, 14, '#2a0505', '#9aa4b8', 3);
        skE(c, -34, -62, 8, 8, '#ff3030');
        skE(c, -37, -65, 2.6, 2.6, '#ffe0e0');
    }
}

function skEyepatch(c, sk) {
    if (!sk.eyepatch) return;
    const x = sk.eyepatch === 'left' ? -34 : 34;
    c.strokeStyle = '#111'; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-86, -92); c.lineTo(x, -62); c.lineTo(86, -88); c.stroke();
    skE(c, x, -62, 19, 17, '#15151a', '#000', 2);
}

/* ---------------- זקן ושפם ---------------- */
function skBeardBack(c, sk, t) {
    const b = sk.beard;
    if (!b) return;
    const col = b.color, dk = skShade(col, -0.3);
    if (b.style === 'stubble') {
        c.beginPath();
        c.moveTo(-78, -30); c.quadraticCurveTo(-82, 54, 0, 64); c.quadraticCurveTo(82, 54, 78, -30);
        c.quadraticCurveTo(52, 22, 0, 18); c.quadraticCurveTo(-52, 22, -78, -30); c.closePath();
        c.fillStyle = skA(col, 0.32); c.fill();
    } else if (b.style === 'full' || b.style === 'long' || b.style === 'braids') {
        const len = b.style === 'long' ? 190 : (b.style === 'braids' ? 120 : 94);
        c.beginPath();
        c.moveTo(-88, -44);
        c.bezierCurveTo(-96, 40, -64, len - 20, 0, len);
        c.bezierCurveTo(64, len - 20, 96, 40, 88, -44);
        c.quadraticCurveTo(70, 8, 36, 22);
        c.lineTo(-36, 22);
        c.quadraticCurveTo(-70, 8, -88, -44);
        c.closePath();
        c.fillStyle = col; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
        c.strokeStyle = dk; c.lineWidth = 2;
        for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 20, 34); c.quadraticCurveTo(i * 24, len * 0.6, i * 14, len - 14); c.stroke(); }
        if (b.style === 'braids') {
            for (const s of [-1, 1]) {
                for (let i = 0; i < 5; i++) skE(c, s * 36, 96 + i * 18, 10, 12, col, SK_OUT, 2);
                skE(c, s * 36, 190, 7, 7, '#d9b25a', SK_OUT, 1.5);
            }
        }
    } else if (b.style === 'trim') {                    // זקן קצר ומסודר לאורך הלסת
        c.beginPath();
        c.moveTo(-87, -40);
        c.bezierCurveTo(-92, 28, -56, 74, 0, 76);
        c.bezierCurveTo(56, 74, 92, 28, 87, -40);
        c.lineTo(76, -26);
        c.quadraticCurveTo(66, 18, 36, 30);
        c.quadraticCurveTo(0, 40, -36, 30);
        c.quadraticCurveTo(-66, 18, -76, -26);
        c.closePath();
        c.fillStyle = col; c.fill(); c.strokeStyle = skA(SK_OUT, 0.7); c.lineWidth = 2; c.stroke();
        c.save(); c.clip();
        for (let i = 0; i < 46; i++) {                    // מרקם שיער
            const x = ((i * 37) % 170) - 85, y = -30 + ((i * 53) % 106);
            c.fillStyle = i % 2 ? skA(skShade(col, 0.25), 0.5) : skA(dk, 0.55);
            c.fillRect(x, y, 2, 5);
        }
        c.restore();
    } else if (b.style === 'goatee') {
        c.beginPath();
        c.moveTo(-26, 24); c.quadraticCurveTo(-30, 70, 0, 84); c.quadraticCurveTo(30, 70, 26, 24); c.closePath();
        c.fillStyle = col; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 2.5; c.stroke();
    }
}

function skMustache(c, sk) {
    const b = sk.beard;
    if (!b || !(b.mustache || b.style === 'mustache' || b.style === 'full' || b.style === 'long' || b.style === 'braids' || b.style === 'trim')) return;
    const col = b.color;
    const w = (b.style === 'long' || b.style === 'braids') ? 1.15 : 1;
    for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(0, -22);
        c.bezierCurveTo(s * 20 * w, -34, s * 52 * w, -30, s * 62 * w, -12);
        c.bezierCurveTo(s * 56 * w, -8, s * 38 * w, -18, s * 20 * w, -14);
        c.quadraticCurveTo(s * 8, -12, 0, -14);
        c.closePath();
        c.fillStyle = col; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 2.2; c.stroke();
    }
}

/* ---------------- משקפיים וכיסויי ראש ---------------- */
function skGlasses(c, sk) {
    const g = sk.glasses;
    if (!g) return;
    const ey = -62;
    if (g.type === 'round') {
        c.strokeStyle = g.color || '#3a2a1a'; c.lineWidth = 4;
        for (const o of [-34, 34]) { skE(c, o, ey, 21, 21, 'rgba(190,225,255,0.16)', g.color || '#3a2a1a', 4); }
        c.beginPath(); c.moveTo(-13, ey); c.quadraticCurveTo(0, ey - 8, 13, ey); c.stroke();
        c.beginPath(); c.moveTo(-55, ey - 2); c.lineTo(-86, ey - 8); c.moveTo(55, ey - 2); c.lineTo(86, ey - 8); c.stroke();
    } else if (g.type === 'bold') {                    // מסגרת עבה ומעוגלת (כהה, עם ניטים קטנים)
        const col = g.color || '#2a1810';
        for (const o of [-34, 34]) {
            skR(c, o - 25, ey - 21, 50, 42, 15, 'rgba(190,225,255,0.14)', col, 6);
            skE(c, o + (o < 0 ? -21 : 21), ey - 15, 1.8, 1.8, '#d8dce4');
            skE(c, o + (o < 0 ? -16 : 16), ey - 15, 1.8, 1.8, '#d8dce4');
        }
        c.strokeStyle = col; c.lineWidth = 5;
        c.beginPath(); c.moveTo(-9, ey - 4); c.quadraticCurveTo(0, ey - 10, 9, ey - 4); c.stroke();
        c.lineWidth = 4;
        c.beginPath(); c.moveTo(-59, ey - 8); c.lineTo(-86, ey - 10); c.moveTo(59, ey - 8); c.lineTo(86, ey - 10); c.stroke();
    } else if (g.type === 'shades') {
        for (const o of [-34, 34]) skR(c, o - 24, ey - 15, 48, 30, 11, '#0e0e12', '#000', 2.5);
        c.fillStyle = '#0e0e12'; c.fillRect(-12, ey - 8, 24, 5);
        c.strokeStyle = '#0e0e12'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(-58, ey - 6); c.lineTo(-88, ey - 10); c.moveTo(58, ey - 6); c.lineTo(88, ey - 10); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.35)';
        for (const o of [-34, 34]) { c.beginPath(); c.moveTo(o - 16, ey - 10); c.lineTo(o - 6, ey - 10); c.lineTo(o - 14, ey + 2); c.lineTo(o - 20, ey + 2); c.closePath(); c.fill(); }
        if (g.neon) { c.strokeStyle = g.neon; c.lineWidth = 2; c.shadowColor = g.neon; c.shadowBlur = 8; for (const o of [-34, 34]) { c.strokeRect(o - 24, ey - 15, 48, 30); } c.shadowBlur = 0; }
    } else if (g.type === 'aviator') {
        const col = g.color || '#d9b25a';
        for (const o of [-34, 34]) {
            c.beginPath();
            c.moveTo(o - 24, ey - 14); c.quadraticCurveTo(o, ey - 20, o + 24, ey - 14);
            c.quadraticCurveTo(o + 22, ey + 26, o, ey + 28);
            c.quadraticCurveTo(o - 22, ey + 26, o - 24, ey - 14); c.closePath();
            const gg = c.createLinearGradient(0, ey - 14, 0, ey + 28);
            gg.addColorStop(0, '#3a3f48'); gg.addColorStop(1, '#111318');
            c.fillStyle = gg; c.fill(); c.strokeStyle = col; c.lineWidth = 3.5; c.stroke();
        }
        c.strokeStyle = col; c.lineWidth = 3.5;
        c.beginPath(); c.moveTo(-10, ey - 8); c.quadraticCurveTo(0, ey - 14, 10, ey - 8); c.stroke();
        c.beginPath(); c.moveTo(-58, ey - 10); c.lineTo(-86, ey - 12); c.moveTo(58, ey - 10); c.lineTo(86, ey - 12); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.3)';
        for (const o of [-34, 34]) skE(c, o - 10, ey - 4, 6, 3, 'rgba(255,255,255,0.3)', null, 0, -0.6);
    } else if (g.type === 'monocle') {
        skE(c, 34, ey, 22, 22, 'rgba(200,230,255,0.2)', '#d9b25a', 4);
        c.strokeStyle = '#d9b25a'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(52, ey + 14); c.quadraticCurveTo(80, 30, 66, 70); c.stroke();
    } else if (g.type === 'goggles') {                // משקפי מעבדה
        for (const o of [-34, 34]) skE(c, o, ey, 22, 20, 'rgba(120,255,200,0.22)', '#555d6a', 5);
        c.strokeStyle = '#3b3f4a'; c.lineWidth = 9;
        c.beginPath(); c.moveTo(-86, ey - 4); c.lineTo(-56, ey - 2); c.moveTo(56, ey - 2); c.lineTo(86, ey - 4); c.moveTo(-12, ey); c.lineTo(12, ey); c.stroke();
    }
}

function skMask(c, sk) {                              // מסכת גיבור-על
    if (!sk.mask) return;
    const col = sk.mask;
    c.beginPath();
    c.moveTo(-84, -76);
    c.quadraticCurveTo(0, -112, 84, -76);
    c.lineTo(82, -52);
    c.quadraticCurveTo(52, -34, 28, -46);
    c.quadraticCurveTo(0, -56, -28, -46);
    c.quadraticCurveTo(-52, -34, -82, -52);
    c.closePath();
    c.fillStyle = col; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
    for (const o of [-34, 34]) skE(c, o, -62, 20, 15, '#ffffff', 'rgba(0,0,0,0.7)', 2.5, o < 0 ? -0.12 : 0.12);
}

function skHatUnder(c, sk, t) {
    const h = sk.hat;
    if (!h) return;
    if (h.type === 'kabuto') {                         // מגן עורף של קסדת סמוראי
        for (let i = 0; i < 4; i++) {
            skP(c, [[-96 - i * 4, -70 + i * 22], [96 + i * 4, -70 + i * 22], [102 + i * 5, -50 + i * 22], [-102 - i * 5, -50 + i * 22]], i % 2 ? '#8a1c1c' : '#a52a2a', 'rgba(0,0,0,0.7)', 2);
        }
    }
    if (h.type === 'astro') {
        skE(c, 0, 62, 70, 22, '#e8ecf4', 'rgba(60,70,90,0.85)', 3);
    }
}

// כיסוי ראש שנמצא "על" הראש אבל לפני הפנים (ברדס נינג'ה)
function skHatMid(c, sk) {
    const h = sk.hat;
    if (!h || h.type !== 'ninja') return;
    c.save();
    c.beginPath(); c.ellipse(SK_HEAD.cx, SK_HEAD.cy, SK_HEAD.rx + 2, SK_HEAD.ry + 2, 0, 0, Math.PI * 2);
    c.fillStyle = '#17181d'; c.fill();
    c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 2;
    for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 24, -126); c.quadraticCurveTo(i * 30, -60, i * 22, 44); c.stroke(); }
    skR(c, -64, -92, 128, 108, 46, sk.tone, SK_OUT, 3);            // חלון הפנים
    skE(c, 0, -30, 11, 9, skShade(sk.tone, -0.14));
    skE(c, -2, -33, 5, 3.5, skShade(sk.tone, 0.22));
    c.restore();
}

function skHatOver(c, sk, t) {
    const h = sk.hat;
    if (!h) return;
    const c1 = h.c1 || '#c42b2b', c2 = h.c2 || '#e9c46a', out = SK_OUT;
    switch (h.type) {
        case 'cap': {
            c.beginPath(); c.moveTo(-86, -78); c.bezierCurveTo(-90, -158, 90, -158, 86, -78); c.closePath();
            c.fillStyle = c1; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            skE(c, 0, -142, 6, 6, skShade(c1, -0.25));
            skE(c, 4, -92, 118, 22, skShade(c1, -0.2), out, 3);          // מצחייה
            break;
        }
        case 'chef': {
            for (const [x, y, r] of [[-44, -150, 30], [44, -150, 30], [0, -172, 36], [-22, -190, 24], [26, -188, 26]]) skE(c, x, y, r, r, '#ffffff', 'rgba(60,60,70,0.55)', 2.5);
            skR(c, -68, -132, 136, 52, 10, '#ffffff', 'rgba(60,60,70,0.55)', 2.5);
            c.strokeStyle = 'rgba(140,140,160,0.45)'; c.lineWidth = 2;
            for (const x of [-34, 0, 34]) { c.beginPath(); c.moveTo(x, -128); c.lineTo(x, -84); c.stroke(); }
            break;
        }
        case 'straw': {
            skE(c, 0, -104, 138, 26, '#e6c46a', out, 3);
            c.beginPath(); c.moveTo(-64, -108); c.bezierCurveTo(-60, -170, 60, -170, 64, -108); c.closePath();
            c.fillStyle = '#efd27c'; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            skR(c, -63, -122, 126, 16, 3, c1, out, 2);
            c.strokeStyle = 'rgba(140,100,30,0.5)'; c.lineWidth = 1.5;
            for (let i = -5; i <= 5; i++) { c.beginPath(); c.moveTo(i * 22, -104 + 18); c.lineTo(i * 25, -104 - 14); c.stroke(); }
            break;
        }
        case 'hardhat': {
            c.beginPath(); c.moveTo(-78, -84); c.bezierCurveTo(-86, -166, 86, -166, 78, -84); c.closePath();
            c.fillStyle = '#f5c518'; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            skR(c, -16, -158, 32, 70, 8, '#d9a90f', out, 2);
            skE(c, 0, -86, 98, 14, '#f5c518', out, 3);
            c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.ellipse(-44, -122, 18, 8, -0.6, 0, Math.PI * 2); c.fill();
            break;
        }
        case 'fire': {
            c.beginPath(); c.moveTo(-82, -80); c.bezierCurveTo(-90, -160, 90, -160, 82, -80); c.closePath();
            c.fillStyle = '#c42b2b'; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            skE(c, 0, -80, 108, 14, '#a82020', out, 3);
            skP(c, [[-24, -150], [24, -150], [30, -100], [0, -86], [-30, -100]], '#f1c40f', out, 2.5);
            skStar(c, 0, -122, 12, '#7a1010');
            c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(-52, -124, 14, 7, -0.6, 0, Math.PI * 2); c.fill();
            break;
        }
        case 'cowboy': {
            c.beginPath(); c.moveTo(-132, -92); c.quadraticCurveTo(-110, -70, 0, -72); c.quadraticCurveTo(110, -70, 132, -92);
            c.quadraticCurveTo(100, -118, 0, -112); c.quadraticCurveTo(-100, -118, -132, -92); c.closePath();
            c.fillStyle = '#8a5a2b'; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            c.beginPath(); c.moveTo(-62, -104); c.quadraticCurveTo(-64, -156, -30, -158); c.quadraticCurveTo(0, -140, 30, -158); c.quadraticCurveTo(64, -156, 62, -104); c.closePath();
            c.fillStyle = '#9b6a36'; c.fill(); c.stroke();
            skR(c, -62, -118, 124, 14, 3, '#3a2412', out, 2);
            skE(c, 0, -111, 8, 8, '#d9b25a', out, 1.5);
            break;
        }
        case 'police': {
            skR(c, -76, -148, 152, 66, 12, '#1d2a52', out, 3);
            skE(c, 0, -86, 96, 18, '#10151f', out, 3);
            skR(c, -76, -108, 152, 12, 3, '#0f1730', null);
            skP(c, [[-14, -142], [14, -142], [18, -116], [0, -104], [-18, -116]], '#d9b25a', out, 2);
            skStar(c, 0, -125, 7, '#fff3b0');
            break;
        }
        case 'pilot': {
            skR(c, -74, -146, 148, 62, 14, '#f4f4f8', out, 3);
            skE(c, 0, -86, 94, 18, '#12161e', out, 3);
            skR(c, -74, -104, 148, 14, 3, '#1d2a52', null);
            c.strokeStyle = '#d9b25a'; c.lineWidth = 4;
            c.beginPath(); c.moveTo(-26, -126); c.quadraticCurveTo(0, -140, 26, -126); c.moveTo(-18, -118); c.quadraticCurveTo(0, -130, 18, -118); c.stroke();
            skE(c, 0, -118, 6, 6, '#d9b25a');
            break;
        }
        case 'tricorn': {
            skP(c, [[-136, -84], [-84, -154], [0, -118], [84, -154], [136, -84], [0, -66]], '#16161c', out, 3);
            skP(c, [[-84, -154], [0, -126], [84, -154], [0, -170]], '#23232b', out, 2.5);
            c.strokeStyle = '#d9b25a'; c.lineWidth = 3;
            c.beginPath(); c.moveTo(-132, -84); c.lineTo(-84, -150); c.moveTo(132, -84); c.lineTo(84, -150); c.stroke();
            skE(c, 0, -112, 15, 14, '#ece8d8', out, 2);                   // גולגולת
            skE(c, -5, -112, 3, 3.5, '#111'); skE(c, 5, -112, 3, 3.5, '#111');
            skR(c, -6, -102, 12, 6, 2, '#ece8d8', out, 1.5);
            break;
        }
        case 'ninja': {                                   // סרט + לוחית
            c.fillStyle = '#c42b2b';
            c.beginPath(); c.moveTo(-90, -86); c.quadraticCurveTo(0, -112, 90, -86); c.lineTo(88, -66); c.quadraticCurveTo(0, -92, -88, -66); c.closePath();
            c.fill(); c.strokeStyle = out; c.lineWidth = 2.5; c.stroke();
            skR(c, -26, -102, 52, 26, 5, '#aeb6c4', out, 2.5);
            c.strokeStyle = '#4a5160'; c.lineWidth = 2.5;
            c.beginPath(); c.moveTo(-14, -92); c.lineTo(14, -92); c.moveTo(0, -98); c.lineTo(0, -80); c.stroke();
            skP(c, [[88, -76], [128, -62], [118, -50]], '#c42b2b', out, 2);
            skP(c, [[88, -72], [134, -84], [124, -96]], '#a82020', out, 2);
            break;
        }
        case 'viking': {
            for (const s of [-1, 1]) {
                c.beginPath(); c.moveTo(s * 70, -98); c.bezierCurveTo(s * 130, -100, s * 150, -150, s * 122, -190);
                c.bezierCurveTo(s * 126, -150, s * 100, -126, s * 60, -118); c.closePath();
                c.fillStyle = '#efe6cf'; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            }
            c.beginPath(); c.moveTo(-78, -86); c.bezierCurveTo(-84, -160, 84, -160, 78, -86); c.closePath();
            const g = c.createLinearGradient(-80, 0, 80, 0);
            g.addColorStop(0, '#6b7280'); g.addColorStop(0.45, '#c3cad6'); g.addColorStop(1, '#6b7280');
            c.fillStyle = g; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            skR(c, -80, -108, 160, 18, 4, '#7a5a2c', out, 2.5);
            for (const x of [-56, -28, 0, 28, 56]) skE(c, x, -99, 3.6, 3.6, '#e7d28a');
            break;
        }
        case 'wizard': {
            skE(c, 0, -100, 130, 24, c1, out, 3);
            c.beginPath(); c.moveTo(-64, -104); c.quadraticCurveTo(-30, -200, 18, -272); c.quadraticCurveTo(30, -190, 64, -104); c.closePath();
            c.fillStyle = c1; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            skR(c, -64, -122, 128, 16, 3, c2, out, 2);
            skStar(c, -10, -170, 11, '#fff3b0'); skStar(c, 24, -214, 7, '#fff3b0'); skE(c, 14, -142, 10, 10, '#fff3b0'); skE(c, 19, -145, 9, 9, c1);
            break;
        }
        case 'fedora': {
            skE(c, 0, -98, 122, 26, '#6b6f78', out, 3, -0.04);
            c.beginPath(); c.moveTo(-62, -102); c.quadraticCurveTo(-60, -158, -20, -158); c.quadraticCurveTo(0, -146, 20, -158); c.quadraticCurveTo(60, -158, 62, -102); c.closePath();
            c.fillStyle = '#7b808a'; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            skR(c, -62, -122, 124, 16, 3, '#1b1d22', out, 2);
            break;
        }
        case 'astro': {                                   // בועת קסדה שקופה
            const g = c.createRadialGradient(-30, -90, 10, 0, -34, 126);
            g.addColorStop(0, 'rgba(210,235,255,0.34)'); g.addColorStop(0.7, 'rgba(120,180,255,0.14)'); g.addColorStop(1, 'rgba(90,150,240,0.34)');
            skE(c, 0, -34, 112, 118, g, 'rgba(210,225,255,0.9)', 4);
            c.fillStyle = 'rgba(255,255,255,0.55)';
            c.beginPath(); c.ellipse(-56, -104, 30, 14, -0.7, 0, Math.PI * 2); c.fill();
            c.fillStyle = 'rgba(255,255,255,0.3)';
            c.beginPath(); c.ellipse(70, 16, 14, 6, -0.8, 0, Math.PI * 2); c.fill();
            skR(c, -9, -174, 18, 36, 6, '#d6291f', out, 2);
            skE(c, 0, -178, 7, 7, '#ffffff', out, 2);
            break;
        }
        case 'kabuto': {
            c.beginPath(); c.moveTo(-84, -76); c.bezierCurveTo(-92, -164, 92, -164, 84, -76); c.closePath();
            const g = c.createLinearGradient(-80, 0, 80, 0);
            g.addColorStop(0, '#7a1c1c'); g.addColorStop(0.5, '#c0342f'); g.addColorStop(1, '#7a1c1c');
            c.fillStyle = g; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2;
            for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * 18, -158 + Math.abs(i) * 4); c.lineTo(i * 20, -84); c.stroke(); }
            skE(c, 0, -80, 96, 12, '#d9b25a', out, 2.5);
            for (const s of [-1, 1]) skP(c, [[s * 8, -158], [s * 60, -214], [s * 30, -158]], '#e9c46a', out, 2.5);   // קרניים זהובות
            skE(c, 0, -164, 10, 10, '#e9c46a', out, 2);
            break;
        }
        case 'knight': {
            c.beginPath(); c.moveTo(-86, -40); c.bezierCurveTo(-96, -170, 96, -170, 86, -40); c.lineTo(66, -46); c.lineTo(62, -86); c.quadraticCurveTo(0, -102, -62, -86); c.lineTo(-66, -46); c.closePath();
            const g = c.createLinearGradient(-86, 0, 86, 0);
            g.addColorStop(0, '#5b6577'); g.addColorStop(0.4, '#d3dae6'); g.addColorStop(1, '#5b6577');
            c.fillStyle = g; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            skR(c, -8, -168, 16, 90, 4, '#aab3c2', out, 2);
            const sway = Math.sin(t * 3) * 6;
            c.beginPath(); c.moveTo(0, -168); c.bezierCurveTo(30 + sway, -230, 80 + sway, -200, 96 + sway, -150); c.bezierCurveTo(60 + sway, -178, 30, -168, 0, -150); c.closePath();
            c.fillStyle = '#c42b2b'; c.fill(); c.strokeStyle = out; c.lineWidth = 2.5; c.stroke();
            break;
        }
        case 'crown': {
            const gold = '#f1c40f';
            c.beginPath();
            c.moveTo(-70, -104); c.lineTo(-76, -170); c.lineTo(-40, -138); c.lineTo(-18, -186); c.lineTo(0, -140); c.lineTo(18, -186); c.lineTo(40, -138); c.lineTo(76, -170); c.lineTo(70, -104); c.closePath();
            const g = c.createLinearGradient(0, -190, 0, -100);
            g.addColorStop(0, '#fff0a0'); g.addColorStop(0.5, gold); g.addColorStop(1, '#b8860b');
            c.fillStyle = g; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            for (const [x, y] of [[-76, -172], [-18, -188], [18, -188], [76, -172]]) skE(c, x, y, 6, 6, '#ffffff', out, 1.5);
            skE(c, 0, -122, 10, 10, '#d6291f', out, 2); skE(c, -36, -118, 7, 7, '#2a7be4', out, 2); skE(c, 36, -118, 7, 7, '#2ea043', out, 2);
            skR(c, -72, -108, 144, 12, 3, '#b8860b', out, 2);
            break;
        }
        case 'halo': {
            const pulse = 0.8 + 0.2 * Math.sin(t * 3);
            const hy = -164 + Math.sin(t * 2.2) * 4;
            skGlow(c, 0, hy, 90, '#ffe27a', 0.55 * pulse);
            c.save(); c.translate(0, hy); c.scale(1, 0.32);
            c.strokeStyle = '#ffe27a'; c.lineWidth = 15; c.shadowColor = '#ffd23d'; c.shadowBlur = 14;
            c.beginPath(); c.arc(0, 0, 58, 0, Math.PI * 2); c.stroke();
            c.restore();
            break;
        }
        case 'dragon': {
            for (const s of [-1, 1]) {
                c.beginPath(); c.moveTo(s * 40, -126); c.bezierCurveTo(s * 70, -150, s * 120, -170, s * 136, -240);
                c.bezierCurveTo(s * 100, -200, s * 70, -184, s * 20, -148); c.closePath();
                const g = c.createLinearGradient(0, -240, 0, -126);
                g.addColorStop(0, '#f4d36a'); g.addColorStop(1, '#2a2118');
                c.fillStyle = g; c.fill(); c.strokeStyle = out; c.lineWidth = 3; c.stroke();
            }
            c.beginPath(); c.moveTo(-70, -108); c.lineTo(-62, -150); c.lineTo(-34, -126); c.lineTo(-16, -166); c.lineTo(0, -128); c.lineTo(16, -166); c.lineTo(34, -126); c.lineTo(62, -150); c.lineTo(70, -108); c.closePath();
            c.fillStyle = '#2a2118'; c.fill(); c.strokeStyle = '#e9c46a'; c.lineWidth = 3; c.stroke();
            skE(c, 0, -122, 9, 9, '#ff6a00', out, 2); skGlow(c, 0, -122, 26, '#ff6a00', 0.6);
            break;
        }
        case 'cosmiccrown': {
            const tw = Math.sin(t * 3) * 0.5 + 0.5;
            c.beginPath(); c.moveTo(-66, -108); c.lineTo(-58, -160); c.lineTo(-30, -130); c.lineTo(0, -178); c.lineTo(30, -130); c.lineTo(58, -160); c.lineTo(66, -108); c.closePath();
            const g = c.createLinearGradient(0, -180, 0, -106);
            g.addColorStop(0, '#e6f0ff'); g.addColorStop(1, '#6e7bd9');
            c.fillStyle = g; c.fill(); c.strokeStyle = '#2b2f6e'; c.lineWidth = 3; c.stroke();
            for (const [x, y, r] of [[0, -180, 7], [-58, -162, 5], [58, -162, 5]]) skStar(c, x, y, r + tw * 3, '#ffffff');
            skE(c, 0, -122, 10, 10, '#35e0ff', '#2b2f6e', 2); skGlow(c, 0, -122, 30, '#35e0ff', 0.7);
            break;
        }
        case 'plate': {                                   // קסדת סייבורג
            c.beginPath(); c.moveTo(-84, -76); c.bezierCurveTo(-90, -150, -30, -146, -4, -140); c.lineTo(-6, -86); c.closePath();
            const g = c.createLinearGradient(-84, 0, 0, 0);
            g.addColorStop(0, '#4b5568'); g.addColorStop(1, '#b8c2d6');
            c.fillStyle = g; c.fill(); c.strokeStyle = '#1f2531'; c.lineWidth = 2.5; c.stroke();
            c.strokeStyle = '#35e0ff'; c.lineWidth = 2; c.shadowColor = '#35e0ff'; c.shadowBlur = 6;
            c.beginPath(); c.moveTo(-70, -100); c.lineTo(-30, -100); c.lineTo(-22, -116); c.stroke(); c.shadowBlur = 0;
            skR(c, 70, -64, 20, 28, 5, '#2a3140', '#9aa4b8', 2);
            c.strokeStyle = '#9aa4b8'; c.lineWidth = 3; c.beginPath(); c.moveTo(80, -64); c.lineTo(84, -104); c.stroke();
            skE(c, 84, -106, 4.5, 4.5, '#ff3030'); skGlow(c, 84, -106, 18, '#ff3030', 0.7);
            break;
        }
        case 'headphones': {
            c.strokeStyle = '#222'; c.lineWidth = 9;
            c.beginPath(); c.arc(0, -40, 96, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
            for (const s of [-1, 1]) skR(c, s * 92 - 12, -50, 24, 44, 8, c1, out, 2.5);
            break;
        }
    }
}

function skEarring(c, sk) {
    if (!sk.earring) return;
    if (sk.look === 'f') {                            // עגילי חישוק תלויים בשתי האוזניים
        for (const s of [-1, 1]) {
            skE(c, s * 94, -14, 3.2, 3.2, '#e9c46a', 'rgba(90,60,10,0.8)', 1);
            skE(c, s * 95, -1, 7, 9, null, 'rgba(90,60,10,0.8)', 4.6);
            skE(c, s * 95, -1, 7, 9, null, '#f2d16b', 3);
        }
        return;
    }
    skE(c, 88, -8, 6, 7, null, '#e9c46a', 3); skE(c, -88, -8, 4, 4, '#e9c46a');
}

// צל זיפים עדין על הלסת (לגרסאות הגבריות)
function skJawShadow(c, sk) {
    if (!sk.jaw || sk.beard) return;
    const col = (sk.hair && sk.hair.color) || sk.brow || '#2b1a0e';
    c.save();
    c.beginPath(); c.ellipse(SK_HEAD.cx, SK_HEAD.cy, SK_HEAD.rx - 1.5, SK_HEAD.ry - 1.5, 0, 0, Math.PI * 2); c.clip();
    c.beginPath();
    c.moveTo(-84, -28); c.quadraticCurveTo(-80, 54, 0, 62); c.quadraticCurveTo(80, 54, 84, -28);
    c.quadraticCurveTo(60, 24, 0, 28); c.quadraticCurveTo(-60, 24, -84, -28); c.closePath();
    c.fillStyle = skA(col, 0.24); c.fill();
    c.restore();
}

/* ---------------- אפקטים קדמיים ---------------- */
function skFxFront(c, sk, t) {
    const f = sk.fx;
    if (!f) return;
    const n = f.count || 14;
    for (let i = 0; i < n; i++) {
        const ph = (t * (f.speed || 0.35) + i / n) % 1;
        const seed = i * 97.31;
        const x = Math.sin(seed) * 130 + Math.sin(t * 1.3 + i) * 10;
        let y, alpha = 1 - ph;
        if (f.type === 'feathers') y = -140 + ph * 340;
        else y = 130 - ph * 300;
        c.globalAlpha = Math.max(0, Math.min(1, alpha * 1.4));
        if (f.type === 'sparkles') skStar(c, x, y, 3 + (i % 3) * 1.6, '#ffe27a', t * 2 + i);
        else if (f.type === 'embers') skE(c, x, y, 2.4 + (i % 3), 2.4 + (i % 3), i % 2 ? '#ff8a1a' : '#ffd33d');
        else if (f.type === 'stars') skStar(c, x, y, 3 + (i % 4) * 1.4, i % 2 ? '#ffffff' : '#9fd4ff', t + i);
        else if (f.type === 'feathers') { c.save(); c.translate(x, y); c.rotate(Math.sin(t * 2 + i) * 0.9); skE(c, 0, 0, 3.6, 9, '#ffffff', 'rgba(150,170,210,0.7)', 1); c.restore(); }
        else if (f.type === 'flames') skE(c, x, y, 3, 6, '#ff8a1a');
    }
    c.globalAlpha = 1;
}

/* ---------------- הרכבה: דמות אנושית מלאה ---------------- */
// st: { x, y (מרכז הפה), hw, ry, chew, t, tx, ty, surprised, mx, my }
// סקין בשחור-לבן: מסנן אפור על כל הציור (הצבעים עצמם כבר אפורים, למקרה שהדפדפן לא תומך במסנן)
function skMono(c, sk) { if (sk.mono) c.filter = 'grayscale(1) contrast(1.12)'; }

function skDrawHumanBack(c, sk, st) {
    const t = st.t;
    c.save();
    c.translate(st.x, st.y);
    skMono(c, sk);
    if (sk.drawBack) { sk.drawBack(c, sk, st); c.restore(); return; }     // סקין מיוחד עם ציור משלו
    skAuraBack(c, sk, t);
    skWings(c, sk, t);
    skCapeBack(c, sk, t);
    skHairBack(c, sk, t);
    skOutfit(c, sk, t);
    skHatUnder(c, sk, t);
    skHead(c, sk);
    skJawShadow(c, sk);
    skHatMid(c, sk);
    skFaceMarks(c, sk, t);
    skEyes(c, sk, st);
    skMask(c, sk);
    skEyepatch(c, sk);
    skBeardBack(c, sk, t);
    c.restore();
}

function skMouthBack(c, sk, st) {
    c.save();
    c.translate(st.x, st.y);
    skMono(c, sk);
    const hw = st.hw, ry = st.ry;
    skE(c, 0, 0, hw, ry, '#3a0a12');
    // שיניים עליונות
    c.save();
    c.beginPath(); c.ellipse(0, 0, hw - 2, ry - 1, 0, 0, Math.PI * 2); c.clip();
    skR(c, -hw + 6, -ry - 2, (hw - 6) * 2, ry * 0.62, 5, '#ffffff', 'rgba(0,0,0,0.25)', 1.5);
    c.fillStyle = '#ec7a89';
    c.beginPath(); c.ellipse(0, ry * 0.78, hw * 0.58, ry * 0.58, 0, 0, Math.PI * 2); c.fill();
    c.restore();
    const lip = sk.lips || '#c4575f';
    c.strokeStyle = lip; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.ellipse(0, 0, hw, ry, 0, Math.PI, Math.PI * 2); c.stroke();
    c.restore();
}

function skMouthFront(c, sk, st) {
    c.save();
    c.translate(st.x, st.y);
    skMono(c, sk);
    const lip = sk.lips || '#c4575f';
    c.strokeStyle = skShade(lip, -0.12); c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.ellipse(0, 0, st.hw, st.ry, 0, 0, Math.PI); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    for (const side of [-1, 1]) { c.beginPath(); c.arc(side * st.hw, 0, 5.5, 0, Math.PI * 2); c.fill(); }
    c.restore();
}

function skDrawHumanFront(c, sk, st) {
    const t = st.t;
    c.save();
    c.translate(st.x, st.y);
    skMono(c, sk);
    if (sk.drawBack) { if (sk.drawFront) sk.drawFront(c, sk, st); c.restore(); return; }
    skMustache(c, sk);
    skGlasses(c, sk);
    skHairFront(c, sk, t);
    skEarring(c, sk);
    skHatOver(c, sk, t);
    if (sk.extra) sk.extra(c, sk, st);                 // פרט ייחודי לסקין (מעל הכול)
    c.restore();
}

/* ---------- פרטים ייחודיים לסקינים היסטוריים ---------- */
function skEinsteinExtra(c, sk, st) {
    // שפם עבות ופרוע
    c.fillStyle = sk.beard.color;
    for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * 2, -24);
        c.quadraticCurveTo(s * 30, -34, s * 56, -14);
        c.quadraticCurveTo(s * 44, -8, s * 36, -10);
        c.quadraticCurveTo(s * 20, -6, s * 2, -14);
        c.closePath(); c.fill();
        c.strokeStyle = 'rgba(160,160,170,0.7)'; c.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(s * (10 + i * 8), -24 + i); c.lineTo(s * (8 + i * 9), -12); c.stroke(); }
    }
    // E=mc² בגיר
    const bob = Math.sin(st.t * 2) * 4;
    c.save();
    c.translate(118, -170 + bob); c.rotate(-0.12);
    skR(c, -54, -26, 108, 48, 8, 'rgba(30,50,40,0.9)', '#8a6a3a', 4);
    c.fillStyle = '#f4f4ec'; c.font = 'bold 26px "Secular One", Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.direction = 'ltr';
    c.fillText('E=mc²', 0, 0);
    c.restore();
}
// ססיל רודז: שביל צד בשיער, פאות קצרות ושרשרת שעון זהב על הווסט
// שני הרקדנית: שמלת פלמנקו אדומה עם נקודות ומלמלות, פרח אדום בשיער ומניפה
// אלה הרקדנית: בגד גוף ורוד עם נצנצים, טוטו מטול, כתר קטן ופפיון סאטן בשיער
// פרידה: צמה כתר עם פרחים, גבה מחוברת, עגילים תלויים, שרשרת ירקן, חולצה רקומה וצעיף רבוזו
// מונה ליזה: מסגרת זהב עם הנוף המעורפל מהציור, צעיף שקוף ושמלה כהה
function skMonaBack(c, sk, st) {
    const t = st.t;
    // הנוף: שמיים ירקרקים, הרים כחולים מעורפלים ושביל מתפתל
    const X = -150, Y = -226, W = 300, H = 600;
    c.save();
    c.beginPath(); c.rect(X, Y, W, H); c.clip();
    const sky = c.createLinearGradient(0, Y, 0, 120);
    sky.addColorStop(0, '#7f9a86'); sky.addColorStop(0.55, '#b9c49a'); sky.addColorStop(1, '#8a7a4a');
    c.fillStyle = sky; c.fillRect(X, Y, W, H);
    c.fillStyle = 'rgba(80,110,110,0.55)';
    c.beginPath(); c.moveTo(X, -40); c.lineTo(-120, -110); c.lineTo(-90, -70); c.lineTo(-60, -130); c.lineTo(-20, -60); c.lineTo(X + W, -60); c.lineTo(X + W, 40); c.lineTo(X, 40); c.closePath(); c.fill();
    c.fillStyle = 'rgba(70,95,90,0.6)';
    c.beginPath(); c.moveTo(20, -50); c.lineTo(70, -140); c.lineTo(110, -90); c.lineTo(150, -120); c.lineTo(150, 40); c.lineTo(20, 40); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(170,140,90,0.75)'; c.lineWidth = 6;
    c.beginPath(); c.moveTo(-140, 20); c.bezierCurveTo(-110, -10, -130, -40, -100, -60); c.stroke();
    c.beginPath(); c.moveTo(146, -10); c.bezierCurveTo(120, -30, 140, -60, 112, -80); c.stroke();
    c.fillStyle = 'rgba(200,210,190,' + (0.18 + 0.06 * Math.sin(t)) + ')'; c.fillRect(X, -150, W, 120);   // ערפל
    c.restore();
    // מסגרת זהב מעוטרת
    const fg = c.createLinearGradient(X, Y, X + W, Y + H);
    fg.addColorStop(0, '#fff0a0'); fg.addColorStop(0.3, '#c9962a'); fg.addColorStop(0.6, '#f1c40f'); fg.addColorStop(1, '#8a5a10');
    c.strokeStyle = SK_OUT; c.lineWidth = 22; c.strokeRect(X, Y, W, H);
    c.strokeStyle = fg; c.lineWidth = 17; c.strokeRect(X, Y, W, H);
    c.strokeStyle = 'rgba(90,50,0,0.6)'; c.lineWidth = 2; c.strokeRect(X - 4, Y - 4, W + 8, H + 8); c.strokeRect(X + 4, Y + 4, W - 8, H - 8);
    for (const [x, y] of [[X, Y], [X + W, Y]]) skE(c, x, y, 13, 13, '#f1c40f', SK_OUT, 2.5);
    // הדמות
    skHairBack(c, sk, t);
    skOutfit(c, sk, t);
    skHead(c, sk);
    skEyes(c, sk, st);
}
function skMonaFront(c, sk, st) {
    skHairFront(c, sk, st.t);
    // צעיף דק ושקוף על השיער (רק על השיער, לא על הפנים)
    c.save();
    c.strokeStyle = 'rgba(20,16,12,0.4)'; c.lineWidth = 7; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-92, -40); c.bezierCurveTo(-104, -150, 104, -150, 92, -40); c.stroke();
    c.strokeStyle = 'rgba(20,16,12,0.55)'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-90, -96); c.quadraticCurveTo(0, -150, 90, -96); c.stroke();
    for (const sd of [-1, 1]) {
        c.fillStyle = 'rgba(20,16,12,0.28)';
        c.beginPath(); c.moveTo(sd * 92, -40); c.lineTo(sd * 104, 60); c.lineTo(sd * 92, 62); c.lineTo(sd * 84, -30); c.closePath(); c.fill();
    }
    c.restore();
    // מחשוף מקומט עם רקמה זהובה
    c.strokeStyle = '#c9962a'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-62, 78); c.quadraticCurveTo(0, 124, 62, 78); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.15)'; c.lineWidth = 2;
    for (let i = -5; i <= 5; i++) { c.beginPath(); c.moveTo(i * 11, 92 + Math.abs(i) * 0.5); c.lineTo(i * 13, 132); c.stroke(); }
    c.strokeStyle = 'rgba(201,150,42,0.8)'; c.lineWidth = 1.6;
    for (let i = -4; i <= 4; i++) { const x = i * 12, y = 84 + 26 * (1 - (i / 5) * (i / 5)); c.beginPath(); c.arc(x, y, 3, 0, Math.PI); c.stroke(); }
    // צעיף כהה על הכתף השמאלית
    c.beginPath(); c.moveTo(-124, 120); c.quadraticCurveTo(-90, 80, -40, 86); c.lineTo(-30, 110); c.quadraticCurveTo(-80, 120, -110, 220); c.closePath();
    c.fillStyle = 'rgba(40,46,30,0.85)'; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 2; c.stroke();
}

// כתר זהב קטן ומוטה על הראש
// התינוק של במבה: תלתל אחד על הראש, לחיים ורודות, אוברול תינוקות, שקית חטיפי בוטנים ובמבות שמרחפות סביבו
function skBambaPuff(c, x, y, r, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.beginPath(); c.moveTo(-r * 1.6, -r * 0.5);
    c.bezierCurveTo(-r * 1.2, -r * 1.3, r * 1.2, -r * 0.6, r * 1.6, -r * 0.2);
    c.bezierCurveTo(r * 1.8, r * 0.6, r * 0.2, r * 1.1, -r * 1.4, r * 0.6);
    c.closePath();
    c.fillStyle = '#f2c14e'; c.fill(); c.strokeStyle = '#a8761c'; c.lineWidth = 1.4; c.stroke();
    c.fillStyle = 'rgba(160,100,20,0.45)';
    for (const [dx, dy] of [[-0.6, 0], [0.3, -0.2], [0.8, 0.3]]) { c.beginPath(); c.arc(dx * r, dy * r, r * 0.15, 0, Math.PI * 2); c.fill(); }
    c.restore();
}
function skBambaBabyExtra(c, sk, st) {
    const t = st.t, tone = sk.tone;
    // סומק ורוד על הלחיים (בלי כתמי צבע עור שנראים כמו זקן)
    for (const sd of [-1, 1]) skE(c, sd * 58, -14, 17, 11, 'rgba(255,110,120,0.38)');
    // תלתל אחד על הראש
    c.strokeStyle = '#a8662a'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-2, -126); c.bezierCurveTo(-6, -160, 26, -168, 26, -146); c.bezierCurveTo(26, -132, 8, -132, 10, -144); c.stroke();
    c.strokeStyle = '#d99a52'; c.lineWidth = 2;
    c.beginPath(); c.moveTo(-1, -132); c.bezierCurveTo(-4, -156, 22, -162, 22, -148); c.stroke();
    // אוברול תינוקות: צווארון עגול, כפתורי לחיצה והדפס במבות קטן
    c.save(); skTorsoPath(c); c.clip();
    for (const [x, y, r] of [[-70, 200, 0.4], [-30, 250, -0.6], [40, 220, 0.9], [-80, 290, -0.2], [20, 300, 0.3], [84, 280, -0.8]])
        skBambaPuff(c, x, y, 6, r);
    c.restore();
    for (const sd of [-1, 1]) {
        c.beginPath(); c.moveTo(0, 74); c.quadraticCurveTo(sd * 34, 104, sd * 58, 76); c.quadraticCurveTo(sd * 40, 58, sd * 10, 60); c.closePath();
        c.fillStyle = '#ffffff'; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 2.2; c.stroke();
    }
    for (const y of [116, 146, 176]) skE(c, 0, y, 5, 5, '#8fc6ff', 'rgba(60,90,140,0.7)', 1.5);
    // שקית במבה ביד
    c.save(); c.translate(70, 150); c.rotate(-0.18 + Math.sin(t * 2) * 0.05);
    c.beginPath(); c.moveTo(-30, -44);
    for (let i = 0; i <= 6; i++) c.lineTo(-30 + i * 10, -44 + (i % 2 ? -5 : 0));
    c.lineTo(30, 40); c.quadraticCurveTo(0, 48, -30, 40); c.closePath();
    const bg = c.createLinearGradient(-30, 0, 30, 0);
    bg.addColorStop(0, '#b3121f'); bg.addColorStop(0.5, '#e8283a'); bg.addColorStop(1, '#a00f1c');
    c.fillStyle = bg; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 2.5; c.stroke();
    skE(c, 0, 4, 22, 15, '#ffd23d', '#a8761c', 1.5);
    skBambaPuff(c, -4, 4, 7, -0.3); skBambaPuff(c, 8, 8, 5, 0.6);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-22, -34); c.lineTo(-20, 30); c.stroke();
    skBambaPuff(c, -10, -52, 8, 0.4); skBambaPuff(c, 10, -56, 7, -0.5);                // במבות שיוצאות מהשקית
    skE(c, -30, 22, 16, 13, tone, SK_OUT, 2.5);                                            // יד שמנמנה
    c.restore();
    // במבות שמרחפות סביב
    for (let i = 0; i < 6; i++) {
        const a = t * 0.6 + i * (Math.PI * 2 / 6), r = 136 + Math.sin(t * 2 + i) * 8;
        skBambaPuff(c, Math.cos(a) * r, -40 + Math.sin(a) * r * 0.75, 7, a + t);
    }
}

// חולצת פולו כחולה של מאמן כדורסל: צווארון, כפתורים, לוגו לבן וסמל קבוצה עם כדור כתום
function skCoachPolo(c, sk, st) {
    const navy = '#1d2b5e', trim = '#2c3f80';
    // תפרים בצדדים בכחול בהיר יותר
    c.save(); skTorsoPath(c); c.clip();
    c.strokeStyle = trim; c.lineWidth = 6;
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * 100, 96); c.quadraticCurveTo(sd * 112, 200, sd * 110, 340); c.stroke(); }
    c.restore();
    // פתח כפתורים
    skR(c, -9, 62, 18, 64, 4, skShade(navy, -0.15), SK_OUT, 2);
    for (const y of [76, 96, 116]) skE(c, 0, y, 3.2, 3.2, '#e8ecf4', 'rgba(0,0,0,0.5)', 1);
    // צווארון פולו
    for (const sd of [-1, 1]) {
        skP(c, [[sd * 4, 60], [sd * 40, 42], [sd * 46, 52], [sd * 26, 86]], navy, SK_OUT, 2.5);
        c.strokeStyle = trim; c.lineWidth = 2;
        c.beginPath(); c.moveTo(sd * 38, 47); c.lineTo(sd * 24, 78); c.stroke();
    }
    // לוגו לבן קטן (צד ימין של המסך = שמאל החולצה)
    c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-64, 128); c.quadraticCurveTo(-56, 116, -46, 122); c.quadraticCurveTo(-40, 128, -48, 132); c.stroke();
    c.beginPath(); c.moveTo(-64, 138); c.lineTo(-44, 138); c.stroke();
    // סמל הקבוצה (אליצור יבנה): טבעת כחולה, כדורסל כתום וספר פתוח עם פסים כחולים וכתומים
    c.save(); c.translate(56, 132);
    const blue = '#1f4fa8', orange = '#f39219';
    skE(c, 0, 0, 19, 19, blue, SK_OUT, 2);
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 1.2;
    c.beginPath(); c.arc(0, 0, 16, Math.PI * 1.1, Math.PI * 1.9); c.stroke();          // הכיתוב בטבעת
    skE(c, 0, 0, 13, 13, '#ffffff');
    c.save(); c.beginPath(); c.arc(0, 0, 13, 0, Math.PI * 2); c.clip();
    skE(c, 0, -4, 9, 9, orange, '#8a4a08', 1);                                            // הכדור
    c.strokeStyle = '#8a4a08'; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(-9, -4); c.lineTo(9, -4); c.moveTo(0, -13); c.lineTo(0, 5);
    c.moveTo(-6, -11); c.quadraticCurveTo(-2, -4, -6, 3); c.moveTo(6, -11); c.quadraticCurveTo(2, -4, 6, 3); c.stroke();
    for (let i = 0; i < 4; i++) {                                                           // הספר הפתוח
        const y = 2 + i * 3.2;
        c.strokeStyle = blue; c.lineWidth = 1.8;
        c.beginPath(); c.moveTo(-14, y); c.quadraticCurveTo(-6, y - 1, 0, y + 4); c.stroke();
        c.strokeStyle = orange;
        c.beginPath(); c.moveTo(14, y); c.quadraticCurveTo(6, y - 1, 0, y + 4); c.stroke();
    }
    c.restore();
    c.restore();
}

function skSmallCrown(c, sk, st) {
    c.save();
    c.translate(10, -108); c.rotate(0.14); c.scale(0.3, 0.3);        // בסיס הכתר (y≈-100) יושב על השיער
    skHatOver(c, { hat: { type: 'crown' } }, st.t);
    c.restore();
}

// סרט ישן: שריטות אנכיות מהבהבות וגרעיניות קלה
function skOldFilmExtra(c, sk, st) {
    const f = Math.floor(st.t * 12);                       // משתנה 12 פעמים בשנייה, כמו מקרן
    const rnd = n => { const x = Math.sin(f * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
    c.save();
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 1.4;
    for (let i = 0; i < 2; i++) {
        if (rnd(i) < 0.45) continue;
        const x = -120 + rnd(i + 5) * 240;
        c.beginPath(); c.moveTo(x, -200 + rnd(i + 9) * 60); c.lineTo(x + (rnd(i + 3) - 0.5) * 8, 120 + rnd(i + 7) * 120); c.stroke();
    }
    for (let i = 0; i < 26; i++) {
        c.fillStyle = rnd(i + 20) > 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.3)';
        c.fillRect(-140 + rnd(i + 40) * 280, -200 + rnd(i + 70) * 420, 2, 2);
    }
    c.restore();
}

// מק מילר: שרשרת דקה עם תליון תו מוזיקלי מזהב על חולצת טי לבנה רחבה
function skMacExtra(c, sk, st) {
    // קפלים בחולצה הלבנה
    c.save(); skTorsoPath(c); c.clip();
    c.strokeStyle = 'rgba(150,150,170,0.35)'; c.lineWidth = 2.5;
    for (const [x0, y0, x1, y1] of [[-90, 120, -60, 220], [70, 110, 96, 200], [-20, 190, 10, 280]]) {
        c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2 + 10, (y0 + y1) / 2, x1, y1); c.stroke();
    }
    c.restore();
    // שרשרת דקה ותליון זהב
    c.strokeStyle = '#8a6410'; c.lineWidth = 2.6;
    c.beginPath(); c.moveTo(-34, 78); c.quadraticCurveTo(-8, 142, 2, 150); c.quadraticCurveTo(12, 142, 34, 78); c.stroke();
    c.strokeStyle = '#f1c40f'; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(-34, 78); c.quadraticCurveTo(-8, 142, 2, 150); c.quadraticCurveTo(12, 142, 34, 78); c.stroke();
    // תליון תו מוזיקלי מזהב
    skE(c, -1, 166, 6, 4.5, '#f1c40f', '#8a6410', 1.2, -0.4);
    skR(c, 3.5, 150, 2.6, 16, 1, '#f1c40f');
    c.strokeStyle = '#8a6410'; c.lineWidth = 1; c.strokeRect(3.5, 150, 2.6, 16);
    skP(c, [[6, 150], [13, 155], [12, 160], [6, 156]], '#f1c40f', '#8a6410', 1);
}

// אווטאר (נאבי): פסים כהים ונקודות זוהרות על הפנים, אוזניים מחודדות, צמה ארוכה עם חרוזים,
// שרשרת שבטית וחולצת עור קלועה. sk.navi = 'm' / 'f'
function skNaviExtra(c, sk, st) {
    const t = st.t, tone = sk.tone, dark = skShade(tone, -0.4), H = SK_HEAD, fem = sk.navi === 'f';
    // פסים כהים על המצח, הלחיים והאף
    c.save();
    c.beginPath(); c.ellipse(H.cx, H.cy, H.rx - 2, H.ry - 2, 0, 0, Math.PI * 2); c.clip();
    c.strokeStyle = skA(dark, 0.55); c.lineWidth = 4; c.lineCap = 'round';
    for (const sd of [-1, 1]) {
        for (const [x0, y0, x1, y1] of [[70, -80, 54, -70], [80, -50, 62, -44], [82, -20, 64, -18], [76, 10, 58, 6]]) {
            c.beginPath(); c.moveTo(sd * x0, y0); c.quadraticCurveTo(sd * (x0 + x1) / 2, y0 + 6, sd * x1, y1); c.stroke();
        }
    }
    for (const [x0, y0, x1, y1] of [[-14, -118, -6, -98], [14, -118, 6, -98], [0, -126, 0, -104]]) {
        c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    }
    c.restore();
    // נקודות ביולומינסנטיות שמנצנצות
    const glow = 0.55 + 0.45 * Math.sin(t * 3);
    for (const [x, y] of [[-8, -48], [8, -48], [-5, -40], [5, -40], [-48, -96], [-40, -102], [48, -96], [40, -102], [-62, -30], [62, -30], [-58, -22], [58, -22]]) {
        skE(c, x, y, 2.6, 2.6, 'rgba(190,240,255,' + (0.5 + glow * 0.5) + ')');
    }
    // אוזניים מחודדות וגבוהות
    for (const sd of [-1, 1]) {
        const flick = Math.sin(t * 1.7 + sd) * 0.05;
        c.save(); c.translate(sd * 86, -36); c.rotate(sd * (0.25 + flick));
        c.beginPath(); c.moveTo(0, 22); c.quadraticCurveTo(sd * 24, -6, sd * 12, -72); c.quadraticCurveTo(sd * -6, -30, sd * -6, 6); c.closePath();
        c.fillStyle = tone; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 2.5; c.stroke();
        c.strokeStyle = skA(dark, 0.6); c.lineWidth = 2;
        c.beginPath(); c.moveTo(sd * 2, 8); c.quadraticCurveTo(sd * 12, -20, sd * 9, -54); c.stroke();
        c.restore();
    }
    // צמה ארוכה עם חרוזים על הכתף
    const bx = fem ? -98 : 98, sw = Math.sin(t * 2) * 3;
    for (let i = 0; i < 9; i++) {
        const y = -6 + i * 20;
        skE(c, bx + Math.sin(i * 0.6) * 6 + sw * (i / 9), y, 11 - i * 0.5, 12, i % 2 ? sk.hair.color : skShade(sk.hair.color, 0.2), SK_OUT, 1.8);
    }
    for (const [i, col] of [[3, '#f2c14e'], [6, '#e8402a'], [8, '#7fe0ff']]) skE(c, bx + Math.sin(i * 0.6) * 6 + sw * (i / 9), -6 + i * 20 + 10, 5, 4, col, SK_OUT, 1);
    // חולצת עור קלועה
    c.save(); skTorsoPath(c); c.clip();
    c.strokeStyle = skA('#3a2414', 0.55); c.lineWidth = 2;
    for (let y = 120; y < 340; y += 16) { c.beginPath(); c.moveTo(-124, y); c.quadraticCurveTo(0, y + 8, 124, y); c.stroke(); }
    for (const x of [-60, 60]) { c.beginPath(); c.moveTo(x, 90); c.lineTo(x * 0.9, 340); c.stroke(); }
    c.restore();
    // שרשרת שבטית: חרוזים, שיניים ונוצה
    const beads = fem ? 15 : 11;
    for (let i = 0; i < beads; i++) {
        const a = Math.PI * 0.1 + i * (Math.PI * 0.8 / (beads - 1));
        const x = Math.cos(a) * (fem ? 58 : 48), y = 60 + Math.sin(a) * (fem ? 44 : 36);
        if (i % 3 === 1) skP(c, [[x - 4, y], [x + 4, y], [x, y + 14]], '#f4ecd0', SK_OUT, 1.2);
        else skE(c, x, y, 5, 5, ['#e8402a', '#f2c14e', '#2ea0a0'][i % 3], SK_OUT, 1.2);
    }
    if (fem) {                                                          // סרט חרוזים על המצח
        c.strokeStyle = '#3a2414'; c.lineWidth = 3;
        c.beginPath(); c.moveTo(-88, -92); c.quadraticCurveTo(0, -128, 88, -92); c.stroke();
        for (let i = 0; i < 7; i++) { const x = -60 + i * 20, y = -104 - Math.sin(i / 6 * Math.PI) * 14; skE(c, x, y, 4, 4, ['#e8402a', '#f2c14e', '#7fe0ff'][i % 3], SK_OUT, 1); }
    }
}

function skFridaExtra(c, sk, st) {
    const t = st.t, hair = sk.hair.color;
    // שיער אסוף לאחור עם שביל באמצע - המצח והגבות גלויים
    for (const sd of [-1, 1]) {
        c.beginPath();
        c.moveTo(sd * 2, -144);
        c.bezierCurveTo(sd * 46, -146, sd * 98, -116, sd * 92, -44);
        c.lineTo(sd * 80, -50);
        c.bezierCurveTo(sd * 80, -92, sd * 52, -116, sd * 2, -122);
        c.closePath();
        c.fillStyle = hair; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 3; c.stroke();
        c.strokeStyle = skShade(hair, 0.3); c.lineWidth = 2;
        c.beginPath(); c.moveTo(sd * 16, -136); c.quadraticCurveTo(sd * 62, -124, sd * 84, -70); c.stroke();
    }
    // גבה מחוברת
    c.strokeStyle = sk.brow; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-21, -86); c.quadraticCurveTo(0, -80, 21, -86); c.stroke();
    // רקמה פרחונית על החולצה
    c.save(); skTorsoPath(c); c.clip();
    c.fillStyle = '#1e2a6a'; c.fillRect(-124, 128, 248, 34);
    for (let x = -112; x <= 112; x += 28) {
        const col = ['#ffd23d', '#ff7ab0', '#4ad66d', '#ffffff'][((x + 112) / 28) % 4];
        for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; skE(c, x + Math.cos(a) * 6, 145 + Math.sin(a) * 6, 4.5, 4.5, col); }
        skE(c, x, 145, 3, 3, '#ff9f1c');
    }
    c.restore();
    // צעיף רבוזו על הכתפיים, עם פרנזים
    for (const s of [-1, 1]) {
        c.beginPath();
        c.moveTo(s * 34, 52); c.quadraticCurveTo(s * 90, 64, s * 124, 110);
        c.lineTo(s * 124, 230); c.quadraticCurveTo(s * 104, 150, s * 54, 96); c.closePath();
        c.fillStyle = '#1f8a86'; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 2.5; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 2;
        for (const k of [0.3, 0.6]) { c.beginPath(); c.moveTo(s * (40 + k * 60), 58 + k * 30); c.quadraticCurveTo(s * (90 + k * 20), 110 + k * 30, s * (120), 140 + k * 70); c.stroke(); }
        c.strokeStyle = '#1f8a86'; c.lineWidth = 2;
        for (let i = 0; i < 6; i++) { const y = 196 + i * 6; c.beginPath(); c.moveTo(s * 122, y); c.lineTo(s * 128, y + 10); c.stroke(); }
    }
    // שרשרת חרוזי ירקן
    for (let i = 0; i < 11; i++) {
        const a = Math.PI * 0.12 + i * (Math.PI * 0.76 / 10);
        skE(c, Math.cos(a) * 44, 56 + Math.sin(a) * 30, 6.5, 6.5, i % 2 ? '#2e9a5a' : '#3fbf76', SK_OUT, 1.5);
    }
    // עגילים תלויים מזהב
    for (const sd of [-1, 1]) {
        const sw = Math.sin(t * 3 + sd) * 0.15;
        c.save(); c.translate(sd * 92, -14); c.rotate(sw);
        c.strokeStyle = '#b8860b'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 10); c.stroke();
        skE(c, 0, 0, 4, 4, '#f1c40f', '#7a5a10', 1.5);
        skP(c, [[0, 8], [8, 20], [0, 32], [-8, 20]], '#f1c40f', '#7a5a10', 1.5);
        skE(c, 0, 20, 3, 3, '#e0283c');
        c.restore();
    }
    // צמה כתר מעל הראש
    const braid = [];
    for (let i = 0; i <= 12; i++) { const a = Math.PI * 1.08 + i * (Math.PI * 0.84 / 12); braid.push([Math.cos(a) * 92, -78 + Math.sin(a) * 74]); }
    braid.forEach(([x, y], i) => {
        skE(c, x, y, 17, 12, i % 2 ? hair : skShade(hair, 0.18), SK_OUT, 2, Math.atan2(y + 78, x) + Math.PI / 2 + (i % 2 ? 0.5 : -0.5));
    });
    // פרחים בשיער
    const flower = (x, y, r, col, mid) => {
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t * 0.2; skE(c, x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.6, r * 0.45, col, SK_OUT, 1.5, a); }
        skE(c, x, y, r * 0.38, r * 0.38, mid, SK_OUT, 1.5);
    };
    skE(c, -40, -150, 12, 6, '#2e7d2a', SK_OUT, 1.5, -0.6); skE(c, 42, -150, 12, 6, '#2e7d2a', SK_OUT, 1.5, 0.6);
    flower(-24, -160, 22, '#e0283c', '#ffd23d');
    flower(18, -164, 19, '#ff7ab0', '#ffd23d');
    flower(48, -146, 14, '#ffd23d', '#ff9f1c');
    flower(-54, -140, 13, '#ff9f1c', '#e0283c');
}

function skEllaExtra(c, sk, st) {
    const t = st.t;
    // נצנצים על בגד הגוף
    c.save(); skTorsoPath(c); c.clip();
    for (let i = 0; i < 16; i++) {
        const x = -90 + (i * 47) % 180, y = 104 + (i * 29) % 72;
        const tw = 0.5 + 0.5 * Math.sin(t * 4 + i * 1.7);
        skStar(c, x, y, 2 + tw * 3, 'rgba(255,255,255,' + (0.35 + tw * 0.6) + ')', t + i);
    }
    // קו מותן עם סרט סאטן
    c.fillStyle = '#e07aa6'; c.fillRect(-124, 178, 248, 12);
    c.restore();
    // טוטו: שכבות טול חצי-שקופות שמתנופפות
    for (let layer = 0; layer < 3; layer++) {
        const y0 = 190 + layer * 9, w = 160 - layer * 10, sw = Math.sin(t * 3 + layer) * 3;
        c.beginPath();
        c.moveTo(-w, y0 + 16);
        for (let i = 0; i <= 12; i++) {
            const x = -w + i * (w * 2 / 12);
            c.quadraticCurveTo(x - w / 12, y0 + 34 + sw * (i % 2 ? 1 : -1), x, y0 + 16);
        }
        c.lineTo(w * 0.8, y0 - 8); c.lineTo(-w * 0.8, y0 - 8); c.closePath();
        c.fillStyle = ['rgba(255,205,225,0.85)', 'rgba(255,182,210,0.8)', 'rgba(255,225,238,0.75)'][layer];
        c.fill(); c.strokeStyle = 'rgba(190,90,130,0.6)'; c.lineWidth = 1.6; c.stroke();
    }
    // פפיון סאטן ורוד בצד השיער
    c.save(); c.translate(70, -118); c.rotate(0.35);
    for (const s of [-1, 1]) skP(c, [[0, 0], [s * 22, -12], [s * 24, 12]], '#f4a6c4', SK_OUT, 2);
    skE(c, 0, 0, 6, 6, '#e07aa6', SK_OUT, 2);
    c.strokeStyle = '#e07aa6'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(-2, 4); c.quadraticCurveTo(-6, 22, -2, 34); c.moveTo(2, 4); c.quadraticCurveTo(8, 20, 6, 32); c.stroke();
    c.restore();
    // כתר קטן עם אבנים
    c.save(); c.translate(-10, -146);
    c.beginPath();
    c.moveTo(-34, 8); c.lineTo(-30, -6); c.lineTo(-18, 2); c.lineTo(-8, -14); c.lineTo(0, -2); c.lineTo(8, -14); c.lineTo(18, 2); c.lineTo(30, -6); c.lineTo(34, 8); c.closePath();
    const g = c.createLinearGradient(0, -16, 0, 8);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#c9d3e6');
    c.fillStyle = g; c.fill(); c.strokeStyle = '#6a7a96'; c.lineWidth = 2; c.stroke();
    for (const [x, y] of [[-8, -14], [8, -14], [-30, -6], [30, -6]]) skE(c, x, y, 3, 3, '#ffd6ea', '#6a7a96', 1.2);
    skE(c, 0, 2, 4, 4, '#f06aa0', '#6a7a96', 1.2);
    const tw = Math.max(0, Math.sin(t * 2.5));
    if (tw > 0.7) skStar(c, 10, -16, 3 + (tw - 0.7) * 16, '#ffffff', t * 3);
    c.restore();
}

function skShanyExtra(c, sk, st) {
    const t = st.t, red = '#c8102e', dk = '#8a0a1e';
    // נקודות לבנות על השמלה (לא על המחשוף)
    c.save(); skTorsoPath(c); c.clip();
    for (let y = 100; y < 340; y += 34) for (let x = -116 + ((y / 34) % 2) * 17; x < 124; x += 34) {
        if (y < 128 && Math.abs(x) < 44) continue;
        skE(c, x, y, 5.5, 5.5, 'rgba(255,255,255,0.9)');
    }
    c.restore();
    // מלמלות על הכתפיים - שלוש שכבות מסולסלות
    for (const s of [-1, 1]) {
        for (let layer = 0; layer < 3; layer++) {
            const y0 = 84 + layer * 15, sway = Math.sin(t * 3 + layer + s) * 2;
            c.beginPath();
            for (let i = 0; i <= 5; i++) {
                const x = s * (40 + i * 16), y = y0 + i * 4 + (layer ? 0 : -4);
                if (i === 0) c.moveTo(x, y); else c.quadraticCurveTo(x - s * 8, y + 14 + sway, x, y);
            }
            c.lineTo(s * 124, y0 + 34); c.lineTo(s * 40, y0 + 10); c.closePath();
            c.fillStyle = layer % 2 ? dk : red; c.fill();
            c.strokeStyle = SK_OUT; c.lineWidth = 2; c.stroke();
        }
    }
    // פרח אדום בשיער
    c.save(); c.translate(-74, -112); c.rotate(-0.3 + Math.sin(t * 1.5) * 0.04);
    skE(c, -16, 10, 16, 8, '#2e7d2a', SK_OUT, 2, 0.5);                    // עלים
    skE(c, 18, 12, 14, 7, '#2e7d2a', SK_OUT, 2, -0.5);
    for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2;
        skE(c, Math.cos(a) * 13, Math.sin(a) * 13, 14, 11, i % 2 ? '#e0283c' : '#c8102e', SK_OUT, 2, a);
    }
    skE(c, 0, 0, 12, 12, '#a00a1e', SK_OUT, 2);
    c.strokeStyle = '#ff7a8a'; c.lineWidth = 2;
    c.beginPath(); c.arc(0, 0, 6, 0.4, Math.PI * 1.6); c.stroke();
    c.restore();
    // מניפת תחרה שחורה-אדומה ביד
    c.save(); c.translate(88, 196); c.rotate(-0.35 + Math.sin(t * 4) * 0.12);
    for (let i = 0; i < 9; i++) {
        const a = -Math.PI * 0.9 + i * (Math.PI * 0.8 / 8);
        c.strokeStyle = '#3a0a10'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 62, Math.sin(a) * 62); c.stroke();
    }
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 62, -Math.PI * 0.9, -Math.PI * 0.1); c.closePath();
    c.fillStyle = 'rgba(200,16,46,0.88)'; c.fill(); c.strokeStyle = SK_OUT; c.lineWidth = 2.5; c.stroke();
    c.strokeStyle = '#1a0508'; c.lineWidth = 3;
    c.beginPath(); c.arc(0, 0, 54, -Math.PI * 0.88, -Math.PI * 0.12); c.stroke();
    for (let i = 0; i < 8; i++) {                                          // תחרה בקצה
        const a = -Math.PI * 0.86 + i * (Math.PI * 0.72 / 7);
        skE(c, Math.cos(a) * 60, Math.sin(a) * 60, 5, 5, '#1a0508');
    }
    skE(c, 0, 0, 6, 6, '#d9b25a', SK_OUT, 1.5);
    skE(c, 4, 10, 14, 11, '#e0b48c', SK_OUT, 2);                         // יד
    c.restore();
}

function skRhodesExtra(c, sk, st) {
    const col = sk.hair.color;
    c.strokeStyle = skShade(col, -0.45); c.lineWidth = 4.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(-40, -140); c.quadraticCurveTo(-46, -118, -44, -94); c.stroke();      // שביל צד
    c.strokeStyle = skShade(col, 0.25); c.lineWidth = 2.5;
    for (const x of [-26, -2, 22, 46]) { c.beginPath(); c.moveTo(x - 6, -136); c.quadraticCurveTo(x + 10, -128, x + 18, -104); c.stroke(); }
    for (const s of [-1, 1]) skR(c, s * 84 - 6, -62, 12, 34, 5, col, SK_OUT, 2);                // פאות קצרות
    // שרשרת שעון מכיס לכפתור
    c.strokeStyle = '#7a5a10'; c.lineWidth = 4.5;
    c.beginPath(); c.moveTo(-58, 176); c.quadraticCurveTo(-30, 200, 0, 182); c.stroke();
    c.strokeStyle = '#f1c40f'; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(-58, 176); c.quadraticCurveTo(-30, 200, 0, 182); c.stroke();
    skE(c, -60, 176, 6, 6, '#f1c40f', '#7a5a10', 2);
    for (const y of [182, 210, 238, 266]) skE(c, 0, y, 4, 4, '#c9a24a', 'rgba(0,0,0,0.5)', 1.2); // כפתורי הווסט
}

function skNewtonExtra(c, sk, st) {
    // תלתלי פאה לאורך הצדדים
    const col = sk.hair.color, dk = skShade(col, -0.25);
    for (const s of [-1, 1]) {
        for (let i = 0; i < 5; i++) {
            const x = s * (96 + (i % 2) * 8), y = -70 + i * 30;
            skE(c, x, y, 17, 15, i % 2 ? col : dk, SK_OUT, 2);
            c.strokeStyle = skA('#ffffff', 0.35); c.lineWidth = 2;
            c.beginPath(); c.arc(x, y, 8, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
        }
    }
    // תפוח שנופל על הראש וקופץ
    const ph = (st.t * 0.9) % 1;
    const y = -168 - Math.abs(Math.sin(ph * Math.PI)) * 34;
    c.save();
    c.translate(16, y); c.rotate(Math.sin(st.t * 3) * 0.2);
    skE(c, 0, 0, 22, 20, '#d8231c', '#5a0a08', 2.5);
    skE(c, -8, -6, 6, 4, 'rgba(255,255,255,0.5)');
    c.strokeStyle = '#5a3a1a'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -18); c.lineTo(2, -28); c.stroke();
    skE(c, 10, -26, 9, 4.5, '#3fa33a', '#1e5a1a', 1.5, -0.4);
    c.restore();
    // כוכבי "אאוץ'" כשהתפוח נוחת
    if (ph < 0.12 || ph > 0.88) {
        for (const [x, yy] of [[-44, -150], [64, -154], [-4, -186]]) skStar(c, x, yy, 7, '#ffe27a', st.t * 4);
    }
}

function skDrawHumanFx(c, sk, st) {
    c.save();
    c.translate(st.x, st.y);
    skMono(c, sk);
    skFxFront(c, sk, st.t);
    c.restore();
}


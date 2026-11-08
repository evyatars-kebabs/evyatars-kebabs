/* ============================================================
   משחק: שוק התבלינים (Spice Market)
   14 ימים. כל יום: הכנה (10 שניות - קנייה, בישול, מחיר, בנק) ואז מכירה (30 שניות - לקוחות,
   גנבים שרצים לקופה, ואירועים). ציור הרחוב על קנבס, והחוקים ב-js/game-market-engine.js.
   ============================================================ */
const MK_PREP = 10, MK_RUSH = 30;        // שניות בכל יום במהירות ×1 (14 ימים = כ-9.5 דקות)
const MK_BEST_KEY = 'kebab_market_best';
const MKC = { W: 360, H: 250 };          // מידות הסצנה (לוגיות)
let mk = null, mkRaf = 0, mkCv = null, mkC = null, mkTab = 'market';

function startMarketGame() {
    switchTab('market');
    mkCv = document.getElementById('mk-canvas');
    mkC = mkCv.getContext('2d');
    mkResize();
    const seed = Math.floor(Math.random() * 2147483646) + 1;
    mk = { run: MK.newRun(seed), phase: 'prep', t: 0, speed: 1, arrivals: [], ai: 0, thieves: [], last: performance.now(),
           customers: [], fx: [], prev: null, banner: '', tick: 0, lastDay: -1 };
    mkBeginDay();
    cancelAnimationFrame(mkRaf);
    mkRaf = requestAnimationFrame(mkFrame);
}
function mkStop() { cancelAnimationFrame(mkRaf); mkRaf = 0; mk = null; }
function mkResize() {
    if (!mkCv) return;
    const w = mkCv.parentNode.clientWidth || MKC.W;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    mkCv.style.height = Math.round(w * MKC.H / MKC.W) + 'px';
    mkCv.width = Math.round(w * dpr); mkCv.height = Math.round(w * MKC.H / MKC.W * dpr);
    mkC.setTransform(mkCv.width / MKC.W, 0, 0, mkCv.height / MKC.H, 0, 0);
}
window.addEventListener('resize', () => { if (mk) mkResize(); });

function mkBeginDay() {
    const r = mk.run;
    mk.phase = 'prep'; mk.t = 0; mk.arrivals = []; mk.ai = 0; mk.thieves = []; mk.logs = [];
    mk.prev = MK.dayPrices(r.market, r.day);
    MK.startDay(r);
    const today = MK.eventsOn(r.market, r.day), tomorrow = r.market.events.filter(e => e.from === r.day + 1);
    mk.banner = (today.length ? today.map(e => e.icon + ' ' + e.name).join('  ·  ') : '🌤️ יום רגיל') +
                (tomorrow.length ? '   ⚠️ מחר: ' + tomorrow.map(e => e.icon + ' ' + e.name).join(' + ') : '');
    if (today.some(e => e.gift || e.loss) || r.day === 0) mkFloat(MKC.W / 2, 60, '📰 יום ' + (r.day + 1), '#ffe27a');
    mkRender();
}
function mkStartRush() {
    const r = mk.run;
    mk.phase = 'rush';
    mk.arrivals = Array.from({ length: r.visitorsLeft }, () => r.rand()).sort((a, b) => a - b);
    // גנבים: זמן הגעה לקופה (בתוך היום)
    mk.thieves = Array.from({ length: r.thieves }, () => ({ at: 0.15 + r.rand() * 0.75, x: MKC.W + 30, caught: false, done: false }));
    mkRender();
}
function mkEndDay() {
    const r = mk.run;
    MK.endDay(r);
    if (r.day >= MK.DAYS) return mkFinish();
    mkBeginDay();
}
function mkFrame(now) {
    if (!mk) return;
    const dt = Math.min(0.1, (now - mk.last) / 1000) * mk.speed;
    mk.last = now; mk.t += dt; mk.tick += dt;
    const r = mk.run;
    if (mk.phase === 'prep' && mk.t >= MK_PREP) mkStartRush();
    if (mk.phase === 'rush') {
        const p = Math.min(1, (mk.t - MK_PREP) / MK_RUSH);
        // גנבים: ריצה לקופה, ונגנבים אם לא נתפסו
        for (const th of mk.thieves) {
            if (th.done) continue;
            const target = 210, start = MKC.W + 30, prog = (p - (th.at - 0.12)) / 0.12;
            th.x = start + (target - start) * Math.min(1, Math.max(0, prog));
            if (p >= th.at && !th.caught) {
                th.done = true;
                const amt = MK.thiefSteal(r);
                mkFloat(210, 150, '-' + amt + ' ₪', '#ff6b6b');
                mkShake(6);
            }
            if (th.caught && !th.done) { th.done = true; th.x = -40; }
        }
        // לקוחות שמגיעים
        while (mk.ai < mk.arrivals.length && mk.arrivals[mk.ai] <= p) {
            const sale = MK.serveOne(r);
            mk.ai++;
            if (sale) { mkCustomer(sale.recipe, sale.price); mk.logs.unshift('🙋 ' + MK.RECIPES[sale.recipe].name + ' · ' + sale.price + ' ₪'); }
            else { mkFloat(90, 130, '😞 אין מנה', '#b9a38e'); mk.logs.unshift('😞 לקוח הלך בלי מנה'); }
            mk.logs.length = Math.min(mk.logs.length, 3);
            mkRender();
        }
        if (p >= 1) mkEndDay();
    }
    mkUpdateLight();
    mkDraw();
    if (mk) mkRaf = requestAnimationFrame(mkFrame);
}
function mkFinish() {
    const r = mk.run, nw = Math.round(MK.netWorth(r)), profit = Math.round(nw - MK.START_CASH);
    const coins = MK.coinsFor(profit, r.sold);
    store.set(MK_BEST_KEY, Math.max(parseInt(store.get(MK_BEST_KEY)) || 0, nw));
    mkStop();
    if (coins > 0) addCoins(coins);
    document.getElementById('result-desc').textContent =
        'סיימתם 14 ימים עם ' + nw + ' ₪ (רווח ' + (profit >= 0 ? '+' : '') + profit + ')' +
        (r.sold ? ' ומכרתם ' + r.sold + ' מנות' : '') + (r.stolen ? ', הגנבים לקחו ' + r.stolen + ' ₪' : '') + '. הרווחתם ' + coins + ' 🪙 קבב קוינס!';
    dailyEvent('market', { score: Math.max(0, profit) });
    showResultReward('market', Math.max(0, profit));
    switchTab('result');
}

/* ---------- פעולות השחקן ---------- */
function mkAct(ok) { if (ok) { sfx.tap(); mkRender(); } else sfx.err(); }
function mkBuy(k, n) { if (mk) mkAct(MK.buy(mk.run, k, n) > 0); }
function mkCook(rid) {
    if (!mk) return;
    if (MK.cookOne(mk.run, rid)) { sfx.pop(); mkFloat(MKC.W / 2 + 40, 150, MK.RECIPES[rid].icon + '+1', '#9be37a'); mkRender(); } else sfx.err();
}
function mkPrice(delta) {
    if (!mk || mk.phase !== 'prep') return;
    const r = mk.run;
    r.priceMult = Math.round(Math.min(1.5, Math.max(0.8, r.priceMult + delta)) * 10) / 10;
    r.visitorsLeft = Math.round(MK.expectedVisitors(r, r.priceMult) * (0.85 + r.rand() * 0.3));
    mkAct(true);
}
function mkUp(what) { if (mk) mkAct(MK.upgrade(mk.run, what)); }
function mkDeposit(amount) { if (mk) mkAct(MK.deposit(mk.run, amount) > 0); }
function mkWithdraw(amount) {
    if (!mk) return;
    const got = MK.withdraw(mk.run, amount);
    if (got > 0) { sfx.coin(); mkFloat(MKC.W / 2, 120, '+' + got + ' ₪', '#ffe27a'); mkRender(); } else sfx.err();
}
function mkSpeed() { if (mk) { mk.speed = mk.speed === 1 ? 2 : mk.speed === 2 ? 4 : 1; sfx.tap(); mkUpdateLight(); } }
// לחיצה על הסצנה: תפיסת גנב שרץ לקופה
function mkTapScene(e) {
    if (!mk || mk.phase !== 'rush') return;
    const r = mkCv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * MKC.W, y = (e.clientY - r.top) / r.height * MKC.H;
    for (const th of mk.thieves) {
        if (th.done || th.caught || th.x > MKC.W) continue;
        if (Math.abs(x - th.x) < 26 && Math.abs(y - 176) < 30) {
            th.caught = true; mk.run.caught++; sfx.win(); mkFloat(th.x, 150, 'תפסתם! 🎯', '#7ee787'); mkShake(2);
            mkRender();
            return;
        }
    }
}
function mkSetTab(name) { mkTab = name; sfx.tap(); mkRender(); }

/* ---------- אפקטים ---------- */
function mkFloat(x, y, text, col) { if (mk) mk.fx.push({ kind: 'text', x, y, text, col, life: 1.3, max: 1.3 }); }
function mkShake(n) { if (mk) mk.shake = Math.max(mk.shake || 0, n); }
function mkCustomer(recipe, price) {
    const col = ['#d64f6b', '#4f8fd6', '#e0a040', '#6bbf6a', '#9a6bd6', '#e07a4f'][Math.floor(Math.random() * 6)];
    mk.customers.push({ x: -20, tx: 58 + (mk.customers.length % 3) * 0, y: 186, col, want: recipe, life: 2.6, leaving: false, phase: Math.random() * 6, price });
    mk.fx.push({ kind: 'text', x: 176, y: 110, text: '+' + price + ' ₪', col: '#ffd23d', life: 1.2, max: 1.2 });
    for (let i = 0; i < 4; i++) mk.fx.push({ kind: 'coin', x: 176, y: 120, vx: (Math.random() - 0.5) * 60, vy: -80 - Math.random() * 60, tx: 300, ty: 16, life: 0.9 + Math.random() * 0.4, max: 1.3 });
}

/* ---------- תצוגה: ציור הרחוב ---------- */
function mkDraw() {
    if (!mkC || !mk) return;
    const c = mkC, t = mk.tick, p = mk.phase === 'rush' ? 0.5 + ((mk.t - MK_PREP) / MK_RUSH) * 0.5 : (mk.t / MK_PREP) * 0.5;
    c.save();
    if (mk.shake > 0.1) { c.translate((Math.random() - 0.5) * mk.shake, (Math.random() - 0.5) * mk.shake); mk.shake *= 0.85; }
    // שמיים: מתחמם לאורך היום
    const sky = c.createLinearGradient(0, 0, 0, 200);
    sky.addColorStop(0, `hsl(${200 - p * 30},70%,${70 + p * 6}%)`); sky.addColorStop(1, `hsl(${28},90%,${86 - p * 6}%)`);
    c.fillStyle = sky; c.fillRect(-10, -10, MKC.W + 20, MKC.H + 20);
    // שמש עם קרניים מסתובבות
    c.save(); c.translate(312, 44); c.rotate(t * 0.2);
    c.fillStyle = 'rgba(255,230,120,0.5)';
    for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, 26); c.lineTo(-6, 44); c.lineTo(6, 44); c.fill(); }
    c.restore();
    c.fillStyle = '#ffd23d'; c.beginPath(); c.arc(312, 44, 24, 0, 7); c.fill();
    c.strokeStyle = '#ffb020'; c.lineWidth = 3; c.stroke();
    // דגלוני חגיגה
    const cols = ['#e63946', '#ffd23d', '#2a9d8f', '#f4a261'];
    c.strokeStyle = '#7a4a1a'; c.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
        const x0 = i * 62 - 6, x1 = x0 + 62;
        c.beginPath(); c.moveTo(x0, 6); c.quadraticCurveTo((x0 + x1) / 2, 26, x1, 6); c.stroke();
        for (let k = 0; k < 3; k++) { const xx = x0 + 10 + k * 20, yy = 6 + 20 * 0.25 + 4 * (k % 2); c.fillStyle = cols[(i + k) % 4]; c.beginPath(); c.moveTo(xx - 6, yy - 4); c.lineTo(xx + 6, yy - 4); c.lineTo(xx, yy + 10); c.fill(); }
    }
    // מסגדים וכיפות ברקע
    c.fillStyle = 'rgba(190,110,60,0.45)';
    for (const [x, w, h] of [[-10, 90, 60], [70, 70, 40], [220, 100, 70]]) { c.fillRect(x, 130 - h, w, h + 80); c.beginPath(); c.arc(x + w / 2, 130 - h, w / 2, Math.PI, 0); c.fill(); }
    c.fillStyle = 'rgba(160,80,40,0.5)';
    c.fillRect(40, 92, 6, 60); c.beginPath(); c.moveTo(37, 92); c.lineTo(43, 70); c.lineTo(49, 92); c.fill();
    c.fillRect(322, 90, 6, 60); c.beginPath(); c.moveTo(319, 90); c.lineTo(325, 68); c.lineTo(331, 90); c.fill();
    // הרחוב
    const street = c.createLinearGradient(0, 180, 0, MKC.H);
    street.addColorStop(0, '#e2b07a'); street.addColorStop(1, '#c58b52');
    c.fillStyle = street; c.fillRect(-10, 182, MKC.W + 20, MKC.H);
    c.fillStyle = 'rgba(120,70,30,0.25)';
    for (let i = 0; i < 40; i++) { const x = (i * 37 + 9) % 380 - 10, y = 196 + ((i * 53) % 50); c.beginPath(); c.ellipse(x, y, 9, 4, 0, 0, 7); c.fill(); }
    // בנק בצד ימין
    drawBank(c, 286, 96, t);
    // דוכן עם סוכך פסים
    drawStall(c);
    // המוכר: האווטאר שלך
    drawSeller(c, t);
    // לקוחות
    mk.customers = mk.customers.filter(cu => cu.life > 0 && cu.x > -40);
    for (const cu of mk.customers) drawCustomer(c, cu, t);
    // גנבים
    for (const th of mk.thieves) if (!th.done || th.x > -30) drawThief(c, th, t);
    // אפקטים
    mk.fx = mk.fx.filter(f => (f.life -= 1 / 60) > 0);
    for (const f of mk.fx) {
        if (f.kind === 'text') {
            c.globalAlpha = Math.min(1, f.life / f.max * 1.4);
            c.font = 'bold 15px "Secular One", Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
            c.lineWidth = 4; c.strokeStyle = 'rgba(40,20,5,0.8)'; c.strokeText(f.text, f.x, f.y - (f.max - f.life) * 18);
            c.fillStyle = f.col; c.fillText(f.text, f.x, f.y - (f.max - f.life) * 18); c.globalAlpha = 1;
        } else if (f.kind === 'coin') {
            f.x += f.vx / 60; f.y += f.vy / 60; f.vy += 160 / 60;
            const k = (f.tx - f.x) * 0.04, j = (f.ty - f.y) * 0.04; f.vx += k; f.vy += j;
            c.fillStyle = '#ffd23d'; c.strokeStyle = '#b8860b'; c.lineWidth = 1.5;
            c.beginPath(); c.arc(f.x, f.y, 5, 0, 7); c.fill(); c.stroke();
        }
    }
    c.restore();
}
function drawBank(c, x, y, t) {
    c.fillStyle = '#f5e6c0'; c.fillRect(x, y + 30, 64, 70);
    c.fillStyle = '#e9d29a'; c.beginPath(); c.arc(x + 32, y + 30, 32, Math.PI, 0); c.fill();
    c.fillStyle = '#c99a4a'; for (let i = 0; i < 4; i++) c.fillRect(x + 6 + i * 16, y + 40, 6, 58);
    c.fillStyle = '#2a6f8f'; c.fillRect(x + 22, y + 74, 20, 26);
    c.fillStyle = '#ffd23d'; c.beginPath(); c.arc(x + 32, y + 22, 6, 0, 7); c.fill();
    c.font = 'bold 12px "Secular One", Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#7a4a1a'; c.fillText('בנק 🏦', x + 32, y + 52);
    c.fillStyle = '#ffd23d'; const sh = 0.5 + 0.5 * Math.sin(t * 2); c.globalAlpha = 0.4 + sh * 0.4;
    c.beginPath(); c.arc(x + 32, y + 22, 12, 0, 7); c.fill(); c.globalAlpha = 1;
}
function drawStall(c) {
    // סוכך פסים עם שוליים מעוגלים
    for (let i = 0; i < 9; i++) {
        c.fillStyle = i % 2 ? '#fff3d6' : '#e63946';
        c.fillRect(64 + i * 24, 110, 24, 24);
        c.beginPath(); c.arc(64 + i * 24 + 12, 134, 12, 0, Math.PI); c.fill();
    }
    c.fillStyle = '#7a4a1a'; c.fillRect(60, 104, 4, 80); c.fillRect(276, 104, 4, 80);
    // דלפק
    c.fillStyle = '#9a5a2a'; c.fillRect(64, 166, 216, 26);
    c.fillStyle = '#c47a3a'; c.fillRect(64, 166, 216, 6);
    // שקי תבלינים על הדלפק
    const sacks = Object.values(MK.INGREDIENTS);
    sacks.forEach((ing, i) => {
        const x = 84 + i * 34;
        c.fillStyle = ing.color; c.beginPath(); c.ellipse(x, 164, 13, 11, 0, 0, 7); c.fill();
        c.strokeStyle = '#4a2a10'; c.lineWidth = 1.5; c.stroke();
        c.font = '13px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ing.icon, x, 165);
    });
}
function drawSeller(c, t) {
    const skin = typeof skinById === 'function' ? skinById(typeof currentSkinId === 'function' ? currentSkinId() : 'classic') : null;
    const bob = Math.sin(t * 3) * 2 + (mk.phase === 'rush' && mk.fx.some(f => f.kind === 'text' && f.life > 1) ? Math.sin(t * 14) * 2 : 0);
    // כרטיס דמות: המוכר עומד מאחורי הדלפק בתוך מסגרת זהב
    const cx = 180, top = 40 + bob;
    const card = c.createLinearGradient(0, top, 0, top + 150);
    card.addColorStop(0, '#5a2c12'); card.addColorStop(1, '#2a1208');
    c.fillStyle = card; c.beginPath(); c.roundRect ? c.roundRect(cx - 62, top, 124, 150, 16) : c.rect(cx - 62, top, 124, 150); c.fill();
    c.strokeStyle = '#ffd23d'; c.lineWidth = 3; c.stroke();
    c.save(); c.clip();
    if (skin && typeof getPreview === 'function') {
        try {
            const pv = getPreview(skin), h = 170, w = h * pv.width / pv.height;
            c.drawImage(pv, cx - w / 2, top + 6, w, h);
        } catch (e) { /* ignore */ }
    }
    c.restore();
}
function drawCustomer(c, cu, t) {
    const bob = Math.sin(t * 6 + cu.phase) * 1.5;
    if (!cu.leaving) cu.x += (cu.tx - cu.x) * 0.08; else cu.x -= 2.2;
    if (!cu.leaving && cu.life < 1.8) cu.leaving = true;
    cu.life -= 1 / 60;
    c.save(); c.globalAlpha = Math.min(1, cu.life);
    c.fillStyle = cu.col; c.strokeStyle = '#3a1e0a'; c.lineWidth = 2;
    c.beginPath(); c.roundRect ? c.roundRect(cu.x - 10, cu.y - 18 + bob, 20, 22, 7) : c.rect(cu.x - 10, cu.y - 18, 20, 22); c.fill(); c.stroke();
    c.fillStyle = '#e0a878'; c.beginPath(); c.arc(cu.x, cu.y - 26 + bob, 9, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#2a160c'; c.beginPath(); c.arc(cu.x - 3, cu.y - 27 + bob, 1.4, 0, 7); c.arc(cu.x + 3, cu.y - 27 + bob, 1.4, 0, 7); c.fill();
    if (cu.want && !cu.leaving) {
        c.fillStyle = '#fff'; c.beginPath(); c.roundRect ? c.roundRect(cu.x + 8, cu.y - 56, 30, 24, 8) : c.rect(cu.x + 8, cu.y - 56, 30, 24); c.fill();
        c.font = '16px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(MK.RECIPES[cu.want].icon, cu.x + 23, cu.y - 44);
    }
    c.restore();
}
function drawThief(c, th, t) {
    const bob = Math.abs(Math.sin(t * 12)) * 3;
    c.save(); c.globalAlpha = th.caught ? 0.5 : 1;
    c.font = '30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('🥷', th.x, 176 - bob);
    if (!th.caught) { c.font = '13px sans-serif'; c.fillText('💰', th.x + 16, 160 - bob); }
    c.restore();
}

/* ---------- פאנל הפעולות ---------- */
function mkArrow(now, before) {
    if (before == null) return '';
    const d = now / before - 1;
    return d > 0.02 ? '<b class="up">↑</b>' : d < -0.02 ? '<b class="down">↓</b>' : '<b class="flat">→</b>';
}
function mkRender() {
    if (!mk) return;
    const r = mk.run, prices = MK.dayPrices(r.market, r.day), rush = mk.phase === 'rush';
    const panel = document.getElementById('mk-panel');
    document.querySelectorAll('.mk-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === mkTab));
    panel.innerHTML = '';
    if (mkTab === 'market') {
        for (const k in MK.INGREDIENTS) {
            const ing = MK.INGREDIENTS[k], row = mkRow('', ing.icon + ' ' + ing.name, 'במלאי ' + (r.stock[k] || 0));
            row.querySelector('.mk-val').innerHTML = Math.round(prices[k] * 10) / 10 + ' ₪ ' + mkArrow(prices[k], mk.prev && mk.prev[k]);
            [1, 5].forEach(n => row.querySelector('.mk-btns').appendChild(mkBtn('+' + n, () => mkBuy(k, n), false)));
            panel.appendChild(row);
        }
    } else if (mkTab === 'cook') {
        const slotsLeft = r.grillSlots - r.cookedToday;
        panel.appendChild(mkInfo('🔥 עמדות פנויות: ' + slotsLeft + ' / ' + r.grillSlots + '   ·   🧾 מחיר התפריט ×' + r.priceMult.toFixed(1) + '   ·   👥 לקוחות ~' + Math.round(MK.expectedVisitors(r, r.priceMult)) + (rush ? '  🔒' : '')));
        if (!rush) {
            const row = mkRow('', 'מחיר התפריט', '×' + r.priceMult.toFixed(1));
            row.querySelector('.mk-btns').appendChild(mkBtn('−', () => mkPrice(-0.1), false));
            row.querySelector('.mk-btns').appendChild(mkBtn('+', () => mkPrice(0.1), false));
            panel.appendChild(row);
        }
        for (const rid in MK.RECIPES) {
            const R = MK.RECIPES[rid], need = Object.keys(R.uses).map(k => R.uses[k] + ' ' + MK.INGREDIENTS[k].name).join(' + ');
            const row = mkRow('', R.icon + ' ' + R.name, need);
            row.querySelector('.mk-val').innerHTML = Math.round(R.price * r.priceMult) + ' ₪<small>מוכן ' + (r.ready[rid] || 0) + '</small>';
            row.querySelector('.mk-btns').appendChild(mkBtn('בשל', () => mkCook(rid), slotsLeft <= 0 || MK.cookable(r, rid) < 1, 'cook'));
            panel.appendChild(row);
        }
        if (r.grillLevel < MK.GRILL_COST.length) panel.appendChild(mkBtn('🔥 עמדה נוספת · ' + MK.GRILL_COST[r.grillLevel] + ' ₪', () => mkUp('grill'), r.cash < MK.GRILL_COST[r.grillLevel], 'wide'));
        if (r.signLevel < MK.SIGN_COST.length) panel.appendChild(mkBtn('🪧 שלט (לקוחות +) · ' + MK.SIGN_COST[r.signLevel] + ' ₪', () => mkUp('sign'), r.cash < MK.SIGN_COST[r.signLevel], 'wide'));
    } else {
        panel.appendChild(mkInfo('💼 במזומן: ' + Math.round(r.cash) + ' ₪   ·   🏦 בבנק: ' + Math.round(r.bank) + ' ₪'));
        panel.appendChild(mkInfo('🏦 הבנק בטוח מגנבים ומשלם ריבית ביום (משתנה לפי אירועים). משיכה עולה ' + MK.WITHDRAW_FEE + ' ₪.'));
        const dep = mkRow('', '⬇️ הפקדה', 'בחינם');
        [50, 200].forEach(n => dep.querySelector('.mk-btns').appendChild(mkBtn('+' + n, () => mkDeposit(n), r.cash < 1, '', n)));
        dep.querySelector('.mk-btns').appendChild(mkBtn('הכל', () => mkDeposit(r.cash), r.cash < 1));
        panel.appendChild(dep);
        const wd = mkRow('', '⬆️ משיכה', 'דמי משיכה ' + MK.WITHDRAW_FEE + ' ₪');
        [200, 500].forEach(n => wd.querySelector('.mk-btns').appendChild(mkBtn('משוך ' + n, () => mkWithdraw(n), r.bank <= MK.WITHDRAW_FEE + 1, '', n)));
        wd.querySelector('.mk-btns').appendChild(mkBtn('הכל', () => mkWithdraw(r.bank), r.bank <= MK.WITHDRAW_FEE + 1));
        panel.appendChild(wd);
    }
    mkUpdateLight();
    document.getElementById('mk-log').innerHTML = (mk.logs || []).slice(0, 3).map(t => '<div>' + t + '</div>').join('');
}
function mkRow(_, title, sub) {
    const row = document.createElement('div'); row.className = 'mk-row';
    row.innerHTML = '<div class="mk-name"><b></b><small></small></div><div class="mk-val"></div><div class="mk-btns"></div>';
    row.querySelector('b').textContent = title; row.querySelector('small').textContent = sub;
    return row;
}
function mkBtn(label, fn, disabled, cls, n) {
    const b = document.createElement('button');
    b.className = 'mk-btn' + (cls === 'cook' ? ' mk-cookbtn' : cls === 'wide' ? ' mk-wide' : '');
    b.textContent = label; b.disabled = !!disabled; b.onclick = fn;
    return b;
}
function mkInfo(text) { const d = document.createElement('div'); d.className = 'mk-info'; d.textContent = text; return d; }
// עדכון קל בכל פריים
function mkUpdateLight() {
    if (!mk) return;
    const r = mk.run, rush = mk.phase === 'rush';
    document.getElementById('mk-day').textContent = (r.day + 1) + ' / ' + MK.DAYS;
    document.getElementById('mk-cash').textContent = Math.round(r.cash) + ' ₪';
    document.getElementById('mk-bank').textContent = Math.round(r.bank) + ' ₪';
    const frac = rush ? (mk.t - MK_PREP) / MK_RUSH : mk.t / MK_PREP;
    const fill = document.getElementById('mk-fill');
    fill.style.width = Math.min(100, Math.max(0, frac) * 100) + '%';
    fill.className = rush ? 'rush' : 'prep';
    document.getElementById('mk-phase').textContent = rush
        ? '🛎️ מכירה! בתור: ' + Math.max(0, r.visitorsLeft) + (mk.thieves.some(th => !th.done && !th.caught) ? '   🥷 גנב בדרך - הקישו עליו!' : '')
        : '🛒 הכנה: קנו, בשלו, תמחרו והפקידו';
    document.getElementById('mk-banner').textContent = mk.banner;
    document.getElementById('mk-speed').textContent = '×' + mk.speed;
    const best = parseInt(store.get(MK_BEST_KEY)) || 0;
    document.getElementById('mk-best').textContent = best ? 'שיא ' + best + ' ₪' : '';
}

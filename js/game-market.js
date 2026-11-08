/* ============================================================
   משחק: שוק התבלינים (Spice Market)
   30 ימים, כ-9 דקות. כל יום: הכנה (5 שניות - מחיר, קנייה, בישול) ואז מכירה (13 שניות -
   הלקוחות מגיעים אחד-אחד). כפתור ×2/×4 מזרז את היום. החוקים ב-js/game-market-engine.js.
   ============================================================ */
const MK_PREP = 5, MK_RUSH = 13;          // שניות בכל יום במהירות ×1 (סה"כ כ-9 דקות)
const MK_BEST_KEY = 'kebab_market_best';
let mk = null, mkRaf = 0;

function startMarketGame() {
    switchTab('market');
    const seed = Math.floor(Math.random() * 2147483646) + 1;      // שוק אקראי בכל ריצה
    mk = { run: MK.newRun(seed), phase: 'prep', t: 0, speed: 1, arrivals: [], ai: 0, last: performance.now(), logs: [], prev: null, banner: '' };
    mkBeginDay();
    cancelAnimationFrame(mkRaf);
    mkRaf = requestAnimationFrame(mkFrame);
}
function mkStop() {
    cancelAnimationFrame(mkRaf);
    mkRaf = 0;
    mk = null;
}
function mkBeginDay() {
    const r = mk.run;
    mk.phase = 'prep'; mk.t = 0; mk.arrivals = []; mk.ai = 0; mk.logs = [];
    mk.prev = MK.dayPrices(r.market, r.day);
    MK.startDay(r);                                              // מספר הלקוחות לפי המחיר שנבחר
    const today = MK.eventsToday(r.market, r.day).map(e => e.name);
    const tomorrow = r.market.events.filter(e => e.from === r.day + 1).map(e => e.name);
    mk.banner = (today.length ? '🔥 היום: ' + today.join(' + ') : 'יום רגיל') + (tomorrow.length ? '   ⚠️ מחר: ' + tomorrow.join(' + ') : '');
    mkRender();
}
// הכנה נגמרה: מחיר נעול, ומגיעים הלקוחות
function mkStartRush() {
    const r = mk.run;
    mk.phase = 'rush';
    mk.arrivals = Array.from({ length: r.visitorsLeft }, () => r.rand()).sort((a, b) => a - b);
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
    mk.last = now;
    mk.t += dt;
    if (mk.phase === 'prep' && mk.t >= MK_PREP) mkStartRush();
    if (mk.phase === 'rush') {
        const r = mk.run, p = Math.min(1, (mk.t - MK_PREP) / MK_RUSH);
        let changed = false;
        while (mk.ai < mk.arrivals.length && mk.arrivals[mk.ai] <= p) {
            const sale = MK.serveOne(r);
            mk.ai++; changed = true;
            mk.logs.unshift(sale ? '🙋 לקוח קנה ' + MK.RECIPES[sale.recipe].name + ' ב-' + sale.price + ' ₪' : '😞 לקוח הלך - אין מנה מוכנה');
        }
        if (mk.logs.length > 4) mk.logs.length = 4;
        if (p >= 1) mkEndDay();                                  // (אם זה היה היום האחרון - המשחק נסגר)
        else if (changed) mkRender(); else mkUpdateLight();
    } else mkUpdateLight();
    if (mk) mkRaf = requestAnimationFrame(mkFrame);
}
function mkFinish() {
    const r = mk.run, profit = Math.round(MK.netWorth(r) - MK.START_CASH), nw = Math.round(MK.netWorth(r));
    const coins = MK.coinsFor(profit, r.sold);
    const best = Math.max(parseInt(store.get(MK_BEST_KEY)) || 0, nw);
    store.set(MK_BEST_KEY, best);
    mkStop();
    if (coins > 0) addCoins(coins);
    document.getElementById('result-desc').textContent =
        'סיימתם 30 ימים עם ' + nw + ' ₪ (רווח ' + (profit >= 0 ? '+' : '') + profit + ')' +
        (r.sold ? ' ומכרתם ' + r.sold + ' מנות' : '') + '. הרווחתם ' + coins + ' 🪙 קבב קוינס!';
    dailyEvent('market', { score: Math.max(0, profit) });
    showResultReward('market', Math.max(0, profit));
    switchTab('result');
}

/* ---------- פעולות השחקן ---------- */
function mkBuy(k, n) {
    if (!mk) return;
    const got = MK.buy(mk.run, k, n);
    if (!got) sfx.err(); else sfx.tap();
    mkRender();
}
function mkCook(rid) {
    if (!mk) return;
    if (MK.cookOne(mk.run, rid)) { sfx.pop(); mkRender(); } else sfx.err();
}
function mkPrice(delta) {
    if (!mk || mk.phase !== 'prep') return;
    const r = mk.run;
    const m = Math.round(Math.min(1.5, Math.max(0.8, r.priceMult + delta)) * 10) / 10;
    r.priceMult = m;
    // רק מספר הלקוחות מתעדכן (המנות שכבר בושלו נשארות)
    r.visitorsLeft = Math.round(MK.expectedVisitors(r, m) * (0.85 + r.rand() * 0.3));
    sfx.tap();
    mkRender();
}
function mkUp(what) {
    if (!mk) return;
    if (MK.upgrade(mk.run, what)) { sfx.buy(); mkRender(); } else sfx.err();
}
function mkSpeed() {
    if (!mk) return;
    mk.speed = mk.speed === 1 ? 2 : mk.speed === 2 ? 4 : 1;
    sfx.tap();
    mkUpdateLight();
}

/* ---------- תצוגה ---------- */
function mkArrow(now, before) {
    if (before == null) return '';
    const d = now / before - 1;
    return d > 0.02 ? '<b class="up">↑</b>' : d < -0.02 ? '<b class="down">↓</b>' : '<b class="flat">→</b>';
}
function mkRender() {
    if (!mk) return;
    const r = mk.run, prices = MK.dayPrices(r.market, r.day), rush = mk.phase === 'rush';
    const mkEl = document.getElementById('mk-market');
    mkEl.innerHTML = '';
    for (const k in MK.INGREDIENTS) {
        const row = document.createElement('div'); row.className = 'mk-row';
        const p = Math.round(prices[k] * 10) / 10;
        row.innerHTML = '<div class="mk-name"><b></b><small></small></div><div class="mk-price"></div><div class="mk-btns"></div>';
        row.querySelector('b').textContent = MK.INGREDIENTS[k].name;
        row.querySelector('small').textContent = 'במלאי ' + (r.stock[k] || 0);
        row.querySelector('.mk-price').innerHTML = p + ' ₪ ' + mkArrow(prices[k], mk.prev && mk.prev[k]);
        const btns = row.querySelector('.mk-btns');
        [1, 5].forEach(n => { const b = document.createElement('button'); b.className = 'mk-btn'; b.textContent = '+' + n; b.onclick = () => mkBuy(k, n); btns.appendChild(b); });
        mkEl.appendChild(row);
    }
    const ck = document.getElementById('mk-cook');
    ck.innerHTML = '';
    const slotsLeft = r.grillSlots - r.cookedToday;
    for (const rid in MK.RECIPES) {
        const R = MK.RECIPES[rid], row = document.createElement('div'); row.className = 'mk-row';
        const need = Object.keys(R.uses).map(k => R.uses[k] + ' ' + MK.INGREDIENTS[k].name).join(' + ');
        row.innerHTML = '<div class="mk-name"><b></b><small></small></div><div class="mk-price"></div><div class="mk-btns"></div>';
        row.querySelector('b').textContent = R.name;
        row.querySelector('small').textContent = need;
        row.querySelector('.mk-price').innerHTML = Math.round(R.price * r.priceMult) + ' ₪<small>מוכן ' + (r.ready[rid] || 0) + '</small>';
        const b = document.createElement('button'); b.className = 'mk-btn mk-cookbtn'; b.textContent = 'בשל';
        b.disabled = slotsLeft <= 0 || MK.cookable(r, rid) < 1;
        b.onclick = () => mkCook(rid);
        row.querySelector('.mk-btns').appendChild(b);
        ck.appendChild(row);
    }
    document.getElementById('mk-slots').textContent = 'עמדות פנויות היום: ' + slotsLeft + ' / ' + r.grillSlots;
    // מחיר: נעול בזמן המכירה
    const pr = document.getElementById('mk-price');
    pr.innerHTML = '';
    const lbl = document.createElement('div'); lbl.className = 'mk-pricelbl';
    lbl.innerHTML = 'מחיר התפריט <b>×' + r.priceMult.toFixed(1) + '</b> · לקוחות צפויים <b>~' + Math.round(MK.expectedVisitors(r, r.priceMult)) + '</b>' + (rush ? ' 🔒' : '');
    pr.appendChild(lbl);
    if (!rush) {
        const dn = document.createElement('button'); dn.className = 'mk-btn'; dn.textContent = '−'; dn.onclick = () => mkPrice(-0.1);
        const up = document.createElement('button'); up.className = 'mk-btn'; up.textContent = '+'; up.onclick = () => mkPrice(0.1);
        const row = document.createElement('div'); row.className = 'mk-btns'; row.appendChild(dn); row.appendChild(up); pr.appendChild(row);
    }
    // שדרוגים
    const up = document.getElementById('mk-up');
    up.innerHTML = '';
    if (r.grillLevel < MK.GRILL_COST.length) up.appendChild(mkUpBtn('🔥 עמדה נוספת', MK.GRILL_COST[r.grillLevel], 'grill'));
    if (r.signLevel < MK.SIGN_COST.length) up.appendChild(mkUpBtn('🪧 שלט (לקוחות +)', MK.SIGN_COST[r.signLevel], 'sign'));
    mkUpdateLight();
    document.getElementById('mk-log').innerHTML = mk.logs.map(t => '<div>' + t + '</div>').join('');
}
function mkUpBtn(label, cost, what) {
    const b = document.createElement('button'); b.className = 'mk-btn mk-upbtn';
    b.textContent = label + ' · ' + cost + ' ₪';
    b.disabled = !mk || mk.run.cash < cost;
    b.onclick = () => mkUp(what);
    return b;
}
// עדכון קל בכל פריים: יום, שעון, מזומן, תור ומהירות
function mkUpdateLight() {
    if (!mk) return;
    const r = mk.run, rush = mk.phase === 'rush';
    document.getElementById('mk-day').textContent = (r.day + 1) + ' / ' + MK.DAYS;
    document.getElementById('mk-cash').textContent = Math.round(r.cash) + ' ₪';
    const frac = rush ? (mk.t - MK_PREP) / MK_RUSH : mk.t / MK_PREP;
    document.getElementById('mk-fill').style.width = Math.min(100, frac * 100) + '%';
    document.getElementById('mk-fill').className = rush ? 'rush' : 'prep';
    document.getElementById('mk-phase').textContent = rush ? '🛎️ מכירה! לקוחות בתור: ' + (r.visitorsLeft - (mk.ai ? 0 : 0)) : '🛒 הכנה - קנו, בשלו וקבעו מחיר';
    document.getElementById('mk-banner').textContent = mk.banner;
    document.getElementById('mk-speed').textContent = '×' + mk.speed;
    document.getElementById('mk-nw').textContent = Math.round(MK.netWorth(r)) + ' ₪';
    const best = parseInt(store.get(MK_BEST_KEY)) || 0;
    document.getElementById('mk-best').textContent = best ? 'שיא: ' + best + ' ₪' : '';
}

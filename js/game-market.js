/* ============================================================
   משחק: שוק התבלינים (Spice Market)
   14 ימים. כל יום: הכנה (12 שניות - קנייה לחומרי גלם, בנק, מחיר), ואז מכירה (48 שניות - לקוחות
   מזמינים מנות שנעשות מהמחסן, גנבים רצים לקופה, ושריפה שמפחידה את הלקוחות עד שמכבים אותה).
   בסוף כל יום מסך סיכום עם רווח, מכירות וגישה לבנק. החוקים ב-js/game-market-engine.js.
   ============================================================ */
const MK_PREP = 12, MK_RUSH = 48;        // שניות ביום במהירות ×1 (60 שניות ליום)
const MK_BEST_KEY = 'kebab_market_best';
const MKC = { W: 360, H: 250 };          // מידות הסצנה הלוגיות (H מתעדכן לפי המסך)
const MK_GROUND = 186;                                    // קו הקרקע (הדוכן עומד עליו)
const MK_TUT_KEY = 'kebab_market_tut';
const MK_COUNTER = 150;                                  // x של הדלפק: הלקוח הראשון בתור עומד כאן
let mk = null, mkRaf = 0, mkCv = null, mkC = null, mkTab = 'market';

function startMarketGame() {
    switchTab('market');
    const old = document.getElementById('mk-tut'); if (old) old.remove();
    mkCv = document.getElementById('mk-canvas');
    mkC = mkCv.getContext('2d');
    mkResize();
    const seed = Math.floor(Math.random() * 2147483646) + 1;
    mk = { run: MK.newRun(seed), phase: 'prep', t: 0, speed: 1, arrivals: [], ai: 0, thieves: [], fires: [], customers: [],
           fx: [], prev: null, banner: '', tick: 0, logs: [], shake: 0, last: performance.now(), tut: null };
    mkBeginDay();
    if (!store.get(MK_TUT_KEY)) mkTutorial(0);
    cancelAnimationFrame(mkRaf);
    mkRaf = requestAnimationFrame(mkFrame);
}
function mkStop() { cancelAnimationFrame(mkRaf); mkRaf = 0; mk = null; const tb = document.getElementById('mk-tut'); if (tb) tb.remove(); const s = document.getElementById('mk-summary'); if (s) s.classList.remove('open'); }
// הקנבס ממלא את כל השטח שמעל הפאנל
function mkResize() {
    if (!mkCv) return;
    const box = mkCv.parentNode, w = box.clientWidth || MKC.W, h = box.clientHeight || 500;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    mkCv.style.width = w + 'px'; mkCv.style.height = h + 'px';
    mkCv.width = Math.round(w * dpr); mkCv.height = Math.round(h * dpr);
    MKC.H = MKC.W * h / w;                                  // גובה לוגי לפי היחס של המסך
    mkC.setTransform(mkCv.width / MKC.W, 0, 0, mkCv.height / MKC.H, 0, 0);
}
window.addEventListener('resize', () => { if (mk) mkResize(); });

function mkBeginDay() {
    const r = mk.run;
    mk.phase = 'prep'; mk.t = 0; mk.arrivals = []; mk.ai = 0; mk.thieves = []; mk.fires = []; mk.logs = [];
    mk.prev = MK.dayPrices(r.market, r.day);
    MK.startDay(r);
    const today = MK.eventsOn(r.market, r.day), tomorrow = r.market.events.filter(e => e.from === r.day + 1);
    mk.banner = (today.length ? today.map(e => e.icon + ' ' + e.name).join('  ·  ') : '🌤️ יום רגיל') +
                (tomorrow.length ? '   ⚠️ מחר: ' + tomorrow.map(e => e.icon + ' ' + e.name).join(' + ') : '');
    mkFloat(MKC.W / 2, 70, '📰 יום ' + (r.day + 1) + ' מתוך ' + MK.DAYS, '#ffe27a');
    mkRender();
}
function mkStartRush() {
    const r = mk.run;
    mk.phase = 'rush';
    mk.arrivals = Array.from({ length: r.visitorsLeft }, () => r.rand()).sort((a, b) => a - b);
    mk.thieves = Array.from({ length: r.thieves }, () => ({ at: 0.12 + r.rand() * 0.75, x: MKC.W + 40, caught: false, done: false }));
    // שריפה: סיכוי ליום, באמצע היום, עד שמכבים אותה (או שהיא נשרפת לבד)
    if (r.rand() < MK.FIRE_CHANCE) mk.fires.push({ at: 0.25 + r.rand() * 0.4, end: 0.95, out: false });
    mkRender();
}
// מדריך לפעם הראשונה: משהה את היום עד שסוגרים אותו
const MK_TUT_STEPS = [
    { t: '👋 ברוכים הבאים לשוק התבלינים', b: 'מוכרים שווארמה, קבב ופלאפל לאנשים שבאים מהרחוב. 14 ימים, ומי שיש לו הכי הרבה כסף בסוף - מנצח.' },
    { t: '🛒 שלב 1: קנו חומרים', b: 'בלשונית "מלאי" קנו בשר, פיתות, ירקות ועוד. לא צריך לבשל - החומרים נשמרים במלאי, וכל מכירה מורידה מהם אוטומטית.' },
    { t: '🏷️ שלב 2: תמחרו', b: 'בלשונית "מחיר" העלו או הורידו את המחיר. מחיר נמוך - יותר לקוחות. מחיר גבוה - רווח גדול יותר לכל מכירה.' },
    { t: '🙋 שלב 3: התור', b: 'לקוחות נכנסים מהרחוב ועומדים בתור מול הדוכן. כשהראשון מגיע לדלפק - נמכר לו. ככל שתמכרו יותר, יגיעו יותר לקוחות.' },
    { t: '🥷 גנבים', b: 'גנבים רצים לדוכן ותופסים מזומן מהקופה. הקישו עליהם על המסך לפני שיגיעו, כדי לתפוס אותם.' },
    { t: '🔥 שריפה', b: 'לפעמים פורצת שריפה והלקוחות בורחים. הקישו עליה על המסך - היא כבית, בחינם.' },
    { t: '🏦 בנק וסיכום יום', b: 'כסף בבנק בטוח מגנבים ומרוויח ריבית של 2% ליום. משיכה עולה 10 ₪. בין הימים מסך סיכום מראה מכירות ורווח, ואפשר לגשת לבנק משם.' }
];
function mkTutorial(i) {
    if (!mk) return;
    const host = document.querySelector('#screen-market .mk-stage');
    if (!host) return;
    mk.tut = i;
    let box = document.getElementById('mk-tut');
    if (!box) { box = document.createElement('div'); box.id = 'mk-tut'; box.className = 'mk-tut'; host.appendChild(box); }
    const s = MK_TUT_STEPS[i], last = i === MK_TUT_STEPS.length - 1;
    const card = document.createElement('div'); card.className = 'mk-tut-card';
    const h = document.createElement('h3'); h.textContent = s.t;
    const p = document.createElement('p'); p.textContent = s.b;
    const cnt = document.createElement('div'); cnt.className = 'mk-tut-count'; cnt.textContent = (i + 1) + ' / ' + MK_TUT_STEPS.length;
    const row = document.createElement('div'); row.className = 'mk-tut-row';
    const skip = document.createElement('button'); skip.className = 'mk-btn'; skip.textContent = 'דלג'; skip.onclick = mkTutEnd;
    const next = document.createElement('button'); next.className = 'mk-btn mk-wide';
    next.textContent = last ? 'יאללה, מתחילים!' : 'הבא';
    next.onclick = () => (last ? mkTutEnd() : mkTutorial(i + 1));
    row.append(skip, next);
    card.append(h, p, cnt, row);
    box.replaceChildren(card);
}
function mkTutEnd() {
    store.set(MK_TUT_KEY, '1');
    const box = document.getElementById('mk-tut'); if (box) box.remove();
    if (mk) { mk.tut = null; mk.last = performance.now(); }
}
function mkFireOn(p) { return mk.fires.find(f => !f.out && p >= f.at && p < f.end); }
function mkFrame(now) {
    if (!mk) return;
    const dt = Math.min(0.1, (now - mk.last) / 1000) * mk.speed;
    mk.last = now; mk.tick += dt;
    const r = mk.run;
    if (mk.tut == null) {
        if (mk.phase === 'prep') { mk.t += dt; if (mk.t >= MK_PREP) mkStartRush(); }
        else if (mk.phase === 'rush') {
            mk.t += dt;
            const p = Math.min(1, (mk.t - MK_PREP) / MK_RUSH);
            for (const th of mk.thieves) {
                if (th.done) continue;
                const prog = (p - (th.at - 0.16)) / 0.16;
                th.x = (MKC.W + 40) + (196 - (MKC.W + 40)) * Math.min(1, Math.max(0, prog));
                if (p >= th.at && !th.caught) {
                    th.done = true;
                    const amt = MK.thiefSteal(r);
                    mkFloat(196, 150, '-' + amt + ' ₪', '#ff6b6b'); mkShake(7);
                    mk.logs.unshift('🥷 גנב לקח ' + amt + ' ₪'); mk.logs.length = Math.min(mk.logs.length, 3);
                }
            }
            // לקוחות נכנסים לרחוב לפי הזמנים; מי שהגיע לדוכן - מזמין
            while (mk.ai < mk.arrivals.length && mk.arrivals[mk.ai] <= p) { mk.ai++; mkArrive(); }
            mkWalk(dt);
            if (p >= 1 && mk.customers.length === 0) return mkEndDay();
        }
    }
    mkUpdateLight();
    mkDraw();
    if (mk) mkRaf = requestAnimationFrame(mkFrame);
}
// לקוח נכנס מהרחוב. אם יש שריפה - הוא מסתובב ורץ, ונחשב כמי שברח
function mkArrive() {
    const r = mk.run, fire = mkFireOn(Math.min(1, (mk.t - MK_PREP) / MK_RUSH));
    if (fire) { MK.scare(r); mkFloat(60, 130, '😱 לקוח ברח מהשריפה', '#ff8a80'); mk.logs.unshift('😱 לקוח ברח מהשריפה'); mk.logs.length = Math.min(mk.logs.length, 3); mkRender(); return; }
    mk.customers.push({ x: -24, y: MK_GROUND + 10, col: ['#d64f6b', '#4f8fd6', '#e0a040', '#6bbf6a', '#9a6bd6', '#e07a4f'][Math.floor(Math.random() * 6)],
                        phase: Math.random() * 6, state: 'walk', want: null, price: 0, wait: 0, t: 0 });
}
// הליכה איטית לתור: כל לקוח עומד מאחורי מי שלפניו. הראשון בתור מזמין כשהגיע לדוכן
function mkWalk(dt) {
    const queue = mk.customers.filter(c => c.state !== 'leave');
    queue.forEach((c, i) => {
        const target = MK_COUNTER - Math.min(26 * i, 120);   // התור נמשך משמאל לדוכן; הראשון עומד מול הדוכן
        const step = 24 * dt;                                // הליכה איטית
        c.x += Math.max(-step, Math.min(step, target - c.x));
        if (c.state === 'walk' && i === 0 && Math.abs(c.x - target) < 0.5) {
            const sale = MK.serveOne(mk.run);
            if (sale) { c.want = sale.recipe; c.price = sale.price; mkFloat(c.x + 24, 118, '+' + sale.price + ' ₪', '#ffd23d'); mkSale(sale); }
            else { c.want = null; mkFloat(c.x + 24, 118, '😞 אין מה להכין', '#b9a38e'); mk.logs.unshift('😞 לקוח הלך - אין חומרים'); mk.logs.length = Math.min(mk.logs.length, 3); mkRender(); }
            c.state = 'wait'; c.wait = 0;
        }
        if (c.state === 'wait') { c.wait += dt; if (c.wait > 2.2) c.state = 'leave'; }
    });
    for (const c of mk.customers) if (c.state === 'leave') c.leaveT = (c.leaveT || 0) + dt;
    mk.customers = mk.customers.filter(c => !(c.state === 'leave' && c.leaveT > 0.6));
}
function mkSale(sale) {
    mk.logs.unshift('🙋 ' + (MK.RECIPES[sale.recipe].name || sale.recipe) + ' · ' + sale.price + ' ₪'); mk.logs.length = Math.min(mk.logs.length, 3);
    for (let i = 0; i < 4; i++) mk.fx.push({ kind: 'coin', x: MK_COUNTER + 26, y: 120, vx: (Math.random() - 0.5) * 60, vy: -80 - Math.random() * 60, tx: 300, ty: 16, life: 0.9 + Math.random() * 0.4, max: 1.3 });
    mkRender();
}
function mkEndDay() {
    const r = mk.run;
    mk.phase = 'summary';
    const sum = MK.endDay(r);
    if (r.day >= MK.DAYS) return mkFinish();
    mkShowSummary(sum);
    mkRaf = requestAnimationFrame(mkFrame);
}
// מסך סיכום בין הימים: מכירות, רווח, בנק, והמשך
function mkShowSummary(sum) {
    const el = document.getElementById('mk-summary');
    const pr = sum.profit;
    const r = mk.run;
    el.innerHTML = '';
    const card = document.createElement('div'); card.className = 'mk-sum-card';
    card.innerHTML = '<h3>סוף יום ' + (sum.day + 1) + '</h3>' +
        '<div class="mk-sum-grid">' +
        '<div><small>נמכרו</small><b>' + sum.sold + ' מנות</b></div>' +
        '<div><small>הכנסות</small><b>' + sum.revenue + ' ₪</b></div>' +
        '<div><small>קניות</small><b>−' + sum.spent + ' ₪</b></div>' +
        '<div><small>גנבים</small><b>−' + sum.stolen + ' ₪</b></div>' +
        '<div><small>לקוחות שהלכו</small><b>' + sum.lost + '</b></div>' +
        '<div><small>פופולריות</small><b>' + sum.pop + '</b></div>' +
        '</div>' +
        '<div class="mk-sum-profit ' + (pr >= 0 ? 'pos' : 'neg') + '">רווח היום: ' + (pr >= 0 ? '+' : '') + Math.round(pr) + ' ₪</div>' +
        (sum.events.length ? '<div class="mk-sum-ev">' + sum.events.join(' · ') + '</div>' : '');
    el.appendChild(card);
    const bank = document.createElement('div'); bank.className = 'mk-sum-card';
    bank.innerHTML = '<h4>🏦 הבנק</h4><div class="mk-sum-bank">במזומן <b>' + Math.round(r.cash) + ' ₪</b> · בבנק <b>' + Math.round(r.bank) + ' ₪</b></div>' +
                     (sum.interest ? '<div class="mk-sum-ev">ריבית היום: +' + sum.interest + ' ₪</div>' : '');
    const row = document.createElement('div'); row.className = 'mk-sum-btns';
    [['הפקד 100', () => mkDeposit(100), r.cash < 1], ['הפקד הכל', () => mkDeposit(r.cash), r.cash < 1],
     ['משוך 100', () => mkWithdraw(100), r.bank <= MK.WITHDRAW_FEE + 1], ['משוך הכל', () => mkWithdraw(r.bank), r.bank <= MK.WITHDRAW_FEE + 1]]
        .forEach(([l, f, d]) => { const b = document.createElement('button'); b.className = 'mk-btn'; b.textContent = l; b.disabled = d; b.onclick = () => { f(); mkShowSummary(sum); }; row.appendChild(b); });
    bank.appendChild(row);
    bank.appendChild(document.createElement('div')).className = 'mk-sum-ev';
    bank.lastChild.textContent = 'דמי משיכה: ' + MK.WITHDRAW_FEE + ' ₪ לכל משיכה';
    el.appendChild(bank);
    const next = document.createElement('button'); next.className = 'mk-btn mk-next';
    next.textContent = sum.day + 1 >= MK.DAYS ? 'לסיכום הסופי ▶' : 'היום הבא ▶';
    next.onclick = () => { el.classList.remove('open'); sfx.tap(); mkBeginDay(); };
    el.appendChild(next);
    el.classList.add('open');
    sfx.tap();
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
function mkPrice(delta) {
    if (!mk || mk.phase !== 'prep') return;
    const r = mk.run;
    r.priceMult = Math.round(Math.min(1.5, Math.max(0.8, r.priceMult + delta)) * 10) / 10;
    r.visitorsLeft = Math.round(MK.expectedVisitors(r, r.priceMult) * (0.85 + r.rand() * 0.3));
    mkAct(true);
}
function mkUp(what) { if (mk) mkAct(MK.upgrade(mk.run, what)); }
function mkDeposit(amount) { if (mk) { const got = MK.deposit(mk.run, amount); if (got > 0) { sfx.coin(); mkRender(); } else sfx.err(); } }
function mkWithdraw(amount) {
    if (!mk) return;
    const got = MK.withdraw(mk.run, amount);
    if (got > 0) { sfx.coin(); mkFloat(MKC.W / 2, 120, '+' + got + ' ₪', '#ffe27a'); mkRender(); } else sfx.err();
}
function mkSpeed() { if (mk) { mk.speed = mk.speed === 1 ? 2 : mk.speed === 2 ? 4 : 1; sfx.tap(); mkUpdateLight(); } }
function mkSetTab(name) { mkTab = name; sfx.tap(); mkRender(); }
// לחיצה על הסצנה: תפיסת גנב, או כיבוי שריפה (בחינם)
function mkTapScene(e) {
    if (!mk || mk.phase !== 'rush') return;
    const r = mkCv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * MKC.W, y = (e.clientY - r.top) / r.height * MKC.H;
    const groundY = MK_GROUND;
    const p = Math.min(1, (mk.t - MK_PREP) / MK_RUSH);
    const fire = mkFireOn(p);
    if (fire && x > 0 && x < 110 && Math.abs(y - (groundY - 16)) < 60) {
        fire.out = true; sfx.win(); mkFloat(60, groundY - 60, 'כבוי בחינם! 🧯', '#7ee787'); mkShake(3); return;
    }
    for (const th of mk.thieves) {
        if (th.done || th.caught || th.x > MKC.W) continue;
        if (Math.abs(x - th.x) < 32 && Math.abs(y - (groundY - 24)) < 40) {
            th.caught = true; mk.run.caught++; sfx.win(); mkFloat(th.x, groundY - 60, 'תפסתם! 🎯', '#7ee787'); mkShake(2); return;
        }
    }
}

/* ---------- אפקטים ---------- */
function mkFloat(x, y, text, col) { if (mk) mk.fx.push({ kind: 'text', x, y, text, col, life: 1.3, max: 1.3 }); }
function mkShake(n) { if (mk) mk.shake = Math.max(mk.shake || 0, n); }
/* ---------- תצוגה: ציור הרחוב ---------- */
function mkDraw() {
    if (!mkC || !mk) return;
    const c = mkC, t = mk.tick, H = MKC.H, G = MK_GROUND;    // G = קו הקרקע, ליד הדוכן (הרחוב ממשיך מתחתיו)
    const p = mk.phase === 'rush' ? 0.5 + ((mk.t - MK_PREP) / MK_RUSH) * 0.5 : mk.phase === 'prep' ? (mk.t / MK_PREP) * 0.5 : 0.5;
    c.save();
    if (mk.shake > 0.1) { c.translate((Math.random() - 0.5) * mk.shake, (Math.random() - 0.5) * mk.shake); mk.shake *= 0.85; }
    c.clearRect(-20, -20, MKC.W + 40, H + 40);
    const sky = c.createLinearGradient(0, 0, 0, G);
    sky.addColorStop(0, `hsl(${200 - p * 30},70%,${70 + p * 6}%)`); sky.addColorStop(1, `hsl(28,90%,${86 - p * 6}%)`);
    c.fillStyle = sky; c.fillRect(-20, -20, MKC.W + 40, G + 40);
    // שמש עם קרניים מסתובבות
    c.save(); c.translate(312, 48); c.rotate(t * 0.15);
    c.fillStyle = 'rgba(255,230,120,0.5)';
    for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(0, 26); c.lineTo(-6, 44); c.lineTo(6, 44); c.fill(); }
    c.restore();
    c.fillStyle = '#ffd23d'; c.beginPath(); c.arc(312, 48, 24, 0, 7); c.fill();
    c.strokeStyle = '#ffb020'; c.lineWidth = 3; c.stroke();
    // דגלוני חגיגה
    const cols = ['#e63946', '#ffd23d', '#2a9d8f', '#f4a261'];
    c.strokeStyle = '#7a4a1a'; c.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
        const x0 = i * 62 - 6, x1 = x0 + 62;
        c.beginPath(); c.moveTo(x0, 6); c.quadraticCurveTo((x0 + x1) / 2, 26, x1, 6); c.stroke();
        for (let k = 0; k < 3; k++) { const xx = x0 + 10 + k * 20, yy = 11 + 4 * (k % 2); c.fillStyle = cols[(i + k) % 4]; c.beginPath(); c.moveTo(xx - 6, yy - 4); c.lineTo(xx + 6, yy - 4); c.lineTo(xx, yy + 10); c.fill(); }
    }
    // מסגדים וכיפות
    c.fillStyle = 'rgba(190,110,60,0.45)';
    for (const [x, w, h] of [[-10, 90, 60], [70, 70, 40], [220, 100, 70]]) { c.fillRect(x, 130 - h, w, h + G); c.beginPath(); c.arc(x + w / 2, 130 - h, w / 2, Math.PI, 0); c.fill(); }
    c.fillStyle = 'rgba(160,80,40,0.5)';
    c.fillRect(40, 92, 6, 60); c.beginPath(); c.moveTo(37, 92); c.lineTo(43, 70); c.lineTo(49, 92); c.fill();
    c.fillRect(322, 90, 6, 60); c.beginPath(); c.moveTo(319, 90); c.lineTo(325, 68); c.lineTo(331, 90); c.fill();
    // הרחוב (עד תחתית המסך)
    const street = c.createLinearGradient(0, G, 0, H + 20);
    street.addColorStop(0, '#e2b07a'); street.addColorStop(1, '#c58b52');
    c.fillStyle = street; c.fillRect(-20, G, MKC.W + 40, H - G + 40);
    c.fillStyle = 'rgba(120,70,30,0.25)';
    for (let i = 0; i < 60; i++) { const x = (i * 37 + 9) % 380 - 10, y = G + 14 + ((i * 53) % Math.max(20, H - G - 20)); c.beginPath(); c.ellipse(x, y, 9, 4, 0, 0, 7); c.fill(); }
    drawBank(c, 286, 96, t, G);
    drawStall(c, G);
    drawSeller(c, t, G);
    for (const cu of mk.customers) drawCustomer(c, cu, t);
    if (mk.fires.some(f => !f.out && mkFireOn(Math.min(1, (mk.t - MK_PREP) / MK_RUSH)) === f)) drawFire(c, t, G);
    for (const th of mk.thieves) if (!th.done || th.x > -30) drawThief(c, th, t, G);
    mk.fx = mk.fx.filter(f => (f.life -= 1 / 60) > 0);
    for (const f of mk.fx) {
        if (f.kind === 'text') {
            c.globalAlpha = Math.min(1, f.life / f.max * 1.4);
            c.font = 'bold 16px "Secular One", Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
            c.lineWidth = 4; c.strokeStyle = 'rgba(40,20,5,0.85)';
            const yy = f.y - (f.max - f.life) * 18;
            c.strokeText(f.text, f.x, yy); c.fillStyle = f.col; c.fillText(f.text, f.x, yy); c.globalAlpha = 1;
        } else if (f.kind === 'coin') {
            f.x += f.vx / 60; f.y += f.vy / 60; f.vy += 160 / 60;
            f.vx += (f.tx - f.x) * 0.04; f.vy += (f.ty - f.y) * 0.04;
            c.fillStyle = '#ffd23d'; c.strokeStyle = '#b8860b'; c.lineWidth = 1.5;
            c.beginPath(); c.arc(f.x, f.y, 5, 0, 7); c.fill(); c.stroke();
        }
    }
    c.restore();
}
function drawFire(c, t, G) {
    // שריפה לפני הדוכן: להבות שרוקדות, ותווית שמזמינה לכבות
    const x = 40, y = G - 6;
    for (let i = 0; i < 9; i++) {
        const fx = x + (i - 4) * 7 + Math.sin(t * 9 + i) * 2, fh = 28 + 10 * Math.sin(t * 13 + i * 1.7) + (i % 3) * 4;
        const g = c.createLinearGradient(0, y - fh, 0, y); g.addColorStop(0, 'rgba(255,240,120,0.95)'); g.addColorStop(0.5, 'rgba(255,120,30,0.9)'); g.addColorStop(1, 'rgba(200,40,10,0.9)');
        c.fillStyle = g; c.beginPath(); c.moveTo(fx - 6, y); c.quadraticCurveTo(fx - 2, y - fh * 0.6, fx, y - fh); c.quadraticCurveTo(fx + 2, y - fh * 0.6, fx + 6, y); c.fill();
    }
    c.fillStyle = '#4a2a10'; c.fillRect(x - 24, y - 2, 48, 6);
    c.font = 'bold 12px "Secular One", Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#fff'; c.fillText('🔥 הקישו לכיבוי!', 66, y - 58 + Math.sin(t * 6) * 2);
}
function drawBank(c, x, y, t, G) {
    c.fillStyle = '#f5e6c0'; c.fillRect(x, y + 30, 64, G - (y + 30));
    c.fillStyle = '#e9d29a'; c.beginPath(); c.arc(x + 32, y + 30, 32, Math.PI, 0); c.fill();
    c.fillStyle = '#c99a4a'; for (let i = 0; i < 4; i++) c.fillRect(x + 6 + i * 16, y + 40, 6, G - y - 42);
    c.fillStyle = '#2a6f8f'; c.fillRect(x + 22, G - 36, 20, 36);
    c.fillStyle = '#ffd23d'; c.beginPath(); c.arc(x + 32, y + 22, 6, 0, 7); c.fill();
    c.font = 'bold 12px "Secular One", Rubik, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#7a4a1a'; c.fillText('בנק 🏦', x + 32, y + 52);
    c.fillStyle = '#ffd23d'; const sh = 0.5 + 0.5 * Math.sin(t * 2); c.globalAlpha = 0.4 + sh * 0.4;
    c.beginPath(); c.arc(x + 32, y + 22, 12, 0, 7); c.fill(); c.globalAlpha = 1;
}
function drawStall(c, G) {
    for (let i = 0; i < 9; i++) {
        c.fillStyle = i % 2 ? '#fff3d6' : '#e63946';
        c.fillRect(64 + i * 24, 110, 24, 24);
        c.beginPath(); c.arc(64 + i * 24 + 12, 134, 12, 0, Math.PI); c.fill();
    }
    c.fillStyle = '#7a4a1a'; c.fillRect(60, 104, 4, G - 104); c.fillRect(276, 104, 4, G - 104);
    c.fillStyle = '#9a5a2a'; c.fillRect(64, 166, 216, 26);
    c.fillStyle = '#c47a3a'; c.fillRect(64, 166, 216, 6);
    Object.values(MK.INGREDIENTS).forEach((ing, i) => {
        const x = 84 + i * 34;
        c.fillStyle = ing.color; c.beginPath(); c.ellipse(x, 164, 13, 11, 0, 0, 7); c.fill();
        c.strokeStyle = '#4a2a10'; c.lineWidth = 1.5; c.stroke();
        c.font = '13px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ing.icon, x, 165);
    });
}
function drawSeller(c, t, G) {
    const skin = typeof skinById === 'function' ? skinById(typeof currentSkinId === 'function' ? currentSkinId() : 'classic') : null;
    const bob = Math.sin(t * 3) * 2;
    const cx = 180, top = 58 + bob;
    const card = c.createLinearGradient(0, top, 0, top + 128);
    card.addColorStop(0, '#5a2c12'); card.addColorStop(1, '#2a1208');
    c.fillStyle = card; c.beginPath(); c.roundRect ? c.roundRect(cx - 62, top, 124, 128, 16) : c.rect(cx - 62, top, 124, 128); c.fill();
    c.strokeStyle = '#ffd23d'; c.lineWidth = 3; c.stroke();
    c.save(); c.clip();
    if (skin && typeof getPreview === 'function') {
        try { const pv = getPreview(skin), h = 146, w = h * pv.width / pv.height; c.drawImage(pv, cx - w / 2, top - 2, w, h); } catch (e) { /* ignore */ }
    }
    c.restore();
}
function drawCustomer(c, cu, t) {
    const bob = cu.state === 'walk' ? Math.abs(Math.sin(t * 9 + cu.phase)) * 3 : Math.sin(t * 4 + cu.phase) * 1;
    c.save();
    if (cu.state === 'leave') c.globalAlpha = Math.max(0, 1 - cu.leaveT / 0.6);   // מי שסיים נעלם בהדרגה
    c.fillStyle = cu.col; c.strokeStyle = '#3a1e0a'; c.lineWidth = 2;
    c.beginPath(); c.roundRect ? c.roundRect(cu.x - 10, cu.y - 18 - bob, 20, 22, 7) : c.rect(cu.x - 10, cu.y - 18 - bob, 20, 22); c.fill(); c.stroke();
    c.fillStyle = '#e0a878'; c.beginPath(); c.arc(cu.x, cu.y - 26 - bob, 9, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#2a160c'; c.beginPath(); c.arc(cu.x - 3, cu.y - 27 - bob, 1.4, 0, 7); c.arc(cu.x + 3, cu.y - 27 - bob, 1.4, 0, 7); c.fill();
    if (cu.state === 'walk') {                                    // "הולך": רגליים מתנדנדות
        c.fillStyle = '#4a2a10'; const sw = Math.sin(t * 9 + cu.phase) * 4;
        c.fillRect(cu.x - 6 + sw, cu.y + 4, 4, 6); c.fillRect(cu.x + 2 - sw, cu.y + 4, 4, 6);
    }
    if (cu.state === 'walk' || cu.state === 'wait') {              // בועה: מה הוא רוצה (או "..." בהליכה)
        c.fillStyle = '#fff'; c.beginPath(); c.roundRect ? c.roundRect(cu.x + 8, cu.y - 58, 32, 24, 8) : c.rect(cu.x + 8, cu.y - 58, 32, 24); c.fill();
        c.font = '16px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(cu.want ? MK.RECIPES[cu.want].icon : (cu.state === 'walk' ? '…' : '❓'), cu.x + 24, cu.y - 46);
    }
    c.restore();
}
// גנב: גדול, אדום-מסגרת, עם "!" שמהבהב - קל לראות ולתפוס
function drawThief(c, th, t, G) {
    const bob = Math.abs(Math.sin(t * 12)) * 4, y = G - 26 - bob;
    c.save(); c.globalAlpha = th.caught ? 0.4 : 1;
    c.fillStyle = 'rgba(230,57,70,0.35)'; c.beginPath(); c.arc(th.x, y, 30 + Math.sin(t * 8) * 3, 0, 7); c.fill();
    c.font = '44px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('🥷', th.x, y);
    if (!th.caught) {
        c.fillStyle = Math.sin(t * 10) > 0 ? '#ff3b3b' : '#ffd23d'; c.font = 'bold 22px sans-serif';
        c.fillText('!', th.x + 22, y - 30);
        c.font = '18px sans-serif'; c.fillText('💰', th.x + 20, y + 22);
    }
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
    const r = mk.run, prices = MK.dayPrices(r.market, r.day), prep = mk.phase === 'prep';
    const panel = document.getElementById('mk-panel');
    document.querySelectorAll('.mk-tab').forEach(b => b.classList.toggle('on', b.dataset.tab === mkTab));
    panel.innerHTML = '';
    if (mkTab === 'market') {
        panel.appendChild(mkInfo('📦 במחסן: ' + Object.keys(MK.INGREDIENTS).map(k => MK.INGREDIENTS[k].icon + (r.stock[k] || 0)).join('  ')));
        for (const k in MK.INGREDIENTS) {
            const ing = MK.INGREDIENTS[k], row = mkRow(ing.icon + ' ' + ing.name, 'במחסן ' + (r.stock[k] || 0));
            row.querySelector('.mk-val').innerHTML = Math.round(prices[k] * 10) / 10 + ' ₪ ' + mkArrow(prices[k], mk.prev && mk.prev[k]);
            [1, 5].forEach(n => row.querySelector('.mk-btns').appendChild(mkBtn('+' + n, () => mkBuy(k, n), false)));
            panel.appendChild(row);
        }
    } else if (mkTab === 'price') {
        panel.appendChild(mkInfo('👥 לקוחות צפויים ~' + Math.round(MK.expectedVisitors(r, r.priceMult)) + '   ·   ⭐ פופולריות ' + Math.round(r.pop) + '   ·   מחיר ×' + r.priceMult.toFixed(1)));
        const row = mkRow('🏷️ מחיר התפריט', 'גבוה = פחות לקוחות, יותר רווח לכל מנה' + (prep ? '' : ' (נעול במכירה)'));
        row.querySelector('.mk-val').innerHTML = '×' + r.priceMult.toFixed(1);
        if (prep) { row.querySelector('.mk-btns').appendChild(mkBtn('−', () => mkPrice(-0.1), false)); row.querySelector('.mk-btns').appendChild(mkBtn('+', () => mkPrice(0.1), false)); }
        panel.appendChild(row);
        for (const rid in MK.RECIPES) {
            const R = MK.RECIPES[rid], need = Object.keys(R.uses).map(k => R.uses[k] + ' ' + MK.INGREDIENTS[k].name).join(' + ');
            const row2 = mkRow(R.icon + ' ' + R.name, need);
            row2.querySelector('.mk-val').innerHTML = Math.round(R.price * r.priceMult) + ' ₪<small>אפשר להכין ' + MK.cookable(r, rid) + '</small>';
            panel.appendChild(row2);
        }
        if (r.signLevel < MK.SIGN_COST.length) panel.appendChild(mkBtn('🪧 שלט (לקוחות +) · ' + MK.SIGN_COST[r.signLevel] + ' ₪', () => mkUp('sign'), r.cash < MK.SIGN_COST[r.signLevel], 'wide'));
    } else {
        panel.appendChild(mkInfo('💼 במזומן: ' + Math.round(r.cash) + ' ₪   ·   🏦 בבנק: ' + Math.round(r.bank) + ' ₪'));
        panel.appendChild(mkInfo('הבנק בטוח מגנבים ומשלם ריבית ביום. משיכה עולה ' + MK.WITHDRAW_FEE + ' ₪.'));
        const dep = mkRow('⬇️ הפקדה', 'בחינם');
        [50, 200].forEach(n => dep.querySelector('.mk-btns').appendChild(mkBtn('+' + n, () => mkDeposit(n), r.cash < n, '', n)));
        dep.querySelector('.mk-btns').appendChild(mkBtn('הכל', () => mkDeposit(r.cash), r.cash < 1));
        panel.appendChild(dep);
        const wd = mkRow('⬆️ משיכה', 'דמי משיכה ' + MK.WITHDRAW_FEE + ' ₪');
        [200, 500].forEach(n => wd.querySelector('.mk-btns').appendChild(mkBtn('משוך ' + n, () => mkWithdraw(n), r.bank <= MK.WITHDRAW_FEE + 1, '', n)));
        wd.querySelector('.mk-btns').appendChild(mkBtn('הכל', () => mkWithdraw(r.bank), r.bank <= MK.WITHDRAW_FEE + 1));
        panel.appendChild(wd);
    }
    mkUpdateLight();
    document.getElementById('mk-log').innerHTML = (mk.logs || []).slice(0, 3).map(t => '<div>' + t + '</div>').join('');
}
function mkRow(title, sub) {
    const row = document.createElement('div'); row.className = 'mk-row';
    row.innerHTML = '<div class="mk-name"><b></b><small></small></div><div class="mk-val"></div><div class="mk-btns"></div>';
    row.querySelector('b').textContent = title; row.querySelector('small').textContent = sub;
    return row;
}
function mkBtn(label, fn, disabled, cls, n) {
    const b = document.createElement('button');
    b.className = 'mk-btn' + (cls === 'wide' ? ' mk-wide' : '');
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
    const frac = rush ? (mk.t - MK_PREP) / MK_RUSH : mk.phase === 'prep' ? mk.t / MK_PREP : 1;
    const fill = document.getElementById('mk-fill');
    fill.style.width = Math.min(100, Math.max(0, frac) * 100) + '%';
    fill.className = rush ? 'rush' : 'prep';
    const p = rush ? Math.min(1, (mk.t - MK_PREP) / MK_RUSH) : 0;
    const fire = rush && mkFireOn(p);
    document.getElementById('mk-phase').textContent = rush
        ? '🛎️ מכירה! בתור: ' + Math.max(0, r.visitorsLeft) + (fire ? '   🔥 שריפה! הקישו עליה לכיבוי' : '') + (mk.thieves.some(th => !th.done && !th.caught) ? '   🥷 גנב! הקישו עליו' : '')
        : mk.phase === 'prep' ? '🛒 הכנה: קנו חומרים, תמחרו ושמרו בבנק' : '📊 סיכום היום';
    document.getElementById('mk-banner').textContent = mk.banner;
    document.getElementById('mk-speed').textContent = '×' + mk.speed;
    const best = parseInt(store.get(MK_BEST_KEY)) || 0;
    document.getElementById('mk-best').textContent = best ? 'שיא ' + best + ' ₪' : '';
}

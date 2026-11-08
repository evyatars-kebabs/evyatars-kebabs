/* ============================================================
   מנוע שוק התבלינים (Spice Market) - חוקי המשחק בלי מסכים.
   משמש גם את המשחק (js/game-market.js) וגם את הסימולטור (tools/spice-sim.js).
   יום = קנייה, בישול, מחיר, ואז לקוחות שמגיעים אחד-אחד ומזמינים מנות.
   ============================================================ */
const MK = (() => {
'use strict';

const DAYS = 30;
const INGREDIENTS = {
    meat:    { name: 'בשר',      base: 12 },
    pita:    { name: 'פיתה',     base: 3 },
    veg:     { name: 'ירקות',    base: 4 },
    tahini:  { name: 'טחינה',    base: 5 },
    spice:   { name: 'תבלינים',  base: 3 },
    pickles: { name: 'חמוצים',   base: 4 },
};
// מתכונים: מה נכנס לכל כבב, מחיר המכירה הבסיסי, והעדפה (משקל בבחירת לקוחות)
const RECIPES = {
    shawarma:  { name: 'שווארמה',  uses: { meat: 1, pita: 1, veg: 1, tahini: 1 },   price: 40, pref: 3 },
    kebab:     { name: 'קבב מנה',  uses: { meat: 2, veg: 1, spice: 1 },            price: 55, pref: 2 },
    falafel:   { name: 'פלאפל',    uses: { pita: 1, veg: 1, tahini: 1, pickles: 1 }, price: 30, pref: 3 },
    schnitzel: { name: 'שניצל',    uses: { meat: 1, pita: 1, pickles: 1 },         price: 35, pref: 2 },
};
const GRILL_BASE = 12;               // מנות ליום בלי שדרוג
const GRILL_STEP = 4;                // כל שדרוג מוסיף
const GRILL_COST = [120, 260, 480];
const SIGN_COST = [90, 200];         // שלט: מגביר את מספר הלקוחות
const SIGN_BOOST = [0.12, 0.25];
const START_CASH = 200;

// מספר אקראי עם זרע (כל ריצה ניתנת לשחזור)
function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

// אירועים: נמשכים כמה ימים ומשנים מחירים או ביקוש. מופיעים ביום אקראי בריצה
const EVENTS = [
    { name: 'גל חום',        mult: { veg: 1.5, pickles: 1.4 }, demand: 0.9,  len: 3 },
    { name: 'שביתת משלוחים', mult: { meat: 1.9, tahini: 1.5 }, demand: 1.0,  len: 4 },
    { name: 'פסטיבל',        mult: {},                        demand: 1.35, len: 3 },
    { name: 'שפל בבשר',      mult: { meat: 0.5, veg: 0.7 },   demand: 1.1,  len: 3 },
];
function makeMarket(rand) {
    const price = {}, base = {};
    for (const k in INGREDIENTS) { base[k] = INGREDIENTS[k].base; price[k] = base[k] * (0.85 + rand() * 0.3); }
    const events = [];
    const n = 1 + (rand() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
        const e = EVENTS[Math.floor(rand() * EVENTS.length)];
        events.push({ ...e, from: 2 + Math.floor(rand() * (DAYS - 8)) });
    }
    return { price, base, events, rand };
}
function eventsToday(m, day) { return m.events.filter(e => day >= e.from && day < e.from + e.len); }
function dayPrices(m, day) {
    const ev = eventsToday(m, day), out = {};
    for (const k in m.price) {
        let mult = 1; for (const e of ev) mult *= (e.mult[k] || 1);
        out[k] = m.price[k] * mult;
    }
    return out;
}
// סחף ליום הבא: אקראיות ±13%, משיכה לבסיס ב-15% מהפער
function stepMarket(m) {
    for (const k in m.price) {
        const drift = (m.rand() - 0.5) * 0.26;
        m.price[k] = m.price[k] * (1 + drift) + (m.base[k] - m.price[k]) * 0.15;
        m.price[k] = Math.max(m.base[k] * 0.4, m.price[k]);
    }
}
// קנייה מעלה את המחיר קצת
function buyImpact(m, k, qty) { m.price[k] *= 1 + Math.min(0.25, qty * 0.004); }

function newRun(seed) {
    const rand = rng(seed);
    return {
        seed, day: 0, cash: START_CASH, stock: {}, ready: {}, rand, market: makeMarket(rand),
        sold: 0, lost: 0, grillLevel: 0, grillSlots: GRILL_BASE, signLevel: 0,
        cookedToday: 0, visitorsLeft: 0, priceMult: 1, takings: 0,
    };
}
function stockValue(run, prices) {
    let v = 0;
    for (const k in run.stock) v += run.stock[k] * (prices[k] || INGREDIENTS[k].base);
    return v;
}
// כמה מנות אפשר לבשל עכשיו מהמלאי
function cookable(run, rid) {
    const u = RECIPES[rid].uses; let n = Infinity;
    for (const k in u) n = Math.min(n, Math.floor((run.stock[k] || 0) / u[k]));
    return Math.max(0, n);
}
// מספר הלקוחות הצפוי: גדל עם הימים, עם אירועים ושלט, ויורד כשהמחיר גבוה מהרגיל
function expectedVisitors(run, mult) {
    const demandEv = eventsToday(run.market, run.day).reduce((m, e) => m * e.demand, 1);
    const signB = run.signLevel > 0 ? SIGN_BOOST[run.signLevel - 1] : 0;
    const elasticity = Math.max(0.3, 1 - 0.6 * (mult - 1));
    return (12 + 0.5 * run.day) * demandEv * (1 + signB) * elasticity;
}
// קנייה שנכנסת לתקציב: מקטינים את כל החומרים באותו יחס
function fitBudget(buy, prices, cash) {
    let cost = 0; for (const k in buy) cost += buy[k] * prices[k];
    if (cost <= cash) return buy;
    const f = cash / cost, out = {};
    for (const k in buy) out[k] = Math.floor(buy[k] * f);
    return out;
}

/* ---------- פעולות שהשחקן (או האסטרטגיה) עושה ---------- */
// שדרוג: 'grill' או 'sign'. מחזיר true אם נקנה
function upgrade(run, what) {
    if (what === 'grill' && run.grillLevel < GRILL_COST.length && run.cash >= GRILL_COST[run.grillLevel]) {
        run.cash -= GRILL_COST[run.grillLevel]; run.grillLevel++; run.grillSlots += GRILL_STEP; return true;
    }
    if (what === 'sign' && run.signLevel < SIGN_COST.length && run.cash >= SIGN_COST[run.signLevel]) {
        run.cash -= SIGN_COST[run.signLevel]; run.signLevel++; return true;
    }
    return false;
}
// קנייה של כמה יחידות מחומר. מחזיר כמה נקנו
function buy(run, k, q) {
    const price = dayPrices(run.market, run.day)[k];
    q = Math.min(Math.floor(q), Math.floor(run.cash / price));
    if (q <= 0) return 0;
    run.cash -= q * price;
    run.stock[k] = (run.stock[k] || 0) + q;
    buyImpact(run.market, k, q);
    return q;
}
// בישול מנה אחת מהמלאי. מוגבל לעמדות היום
function cookOne(run, rid) {
    if (run.cookedToday >= run.grillSlots || cookable(run, rid) < 1) return false;
    for (const k in RECIPES[rid].uses) run.stock[k] -= RECIPES[rid].uses[k];
    run.ready[rid] = (run.ready[rid] || 0) + 1;
    run.cookedToday++;
    return true;
}
// פתיחת היום: נקבע מספר הלקוחות לפי המחיר הנוכחי
function startDay(run) {
    run.cookedToday = 0;
    run.visitorsLeft = Math.round(expectedVisitors(run, run.priceMult) * (0.85 + run.rand() * 0.3));
}
// לקוח אחד מגיע: בוחר מנה מוכנה לפי העדפה ומחיר. מחזיר { recipe, price } או null אם אין מה למכור
function serveOne(run) {
    if (run.visitorsLeft <= 0) return null;
    run.visitorsLeft--;
    const prefs = Object.keys(RECIPES), w = {}; let total = 0;
    for (const r of prefs) {
        w[r] = (run.ready[r] || 0) > 0 ? RECIPES[r].pref * Math.max(0.05, 1.6 - 0.8 * run.priceMult) : 0;
        total += w[r];
    }
    if (total <= 0) { run.lost++; return null; }
    let x = run.rand() * total, pick = prefs[0];
    for (const r of prefs) { x -= w[r]; if (x <= 0) { pick = r; break; } }
    run.ready[pick]--;
    const price = Math.round(RECIPES[pick].price * run.priceMult);
    run.cash += price; run.takings += price; run.sold++;
    return { recipe: pick, price };
}
// סוף היום: מי שלא הגיע - הלך. מנות שלא נמכרו - נזרקות. השוק זז ליום הבא
function endDay(run) {
    run.lost += run.visitorsLeft; run.visitorsLeft = 0;
    run.ready = {};
    stepMarket(run.market);
    run.day++;
}

// יום שלם בבת אחת (לסימולטור): אותו סדר פעולות כמו במשחק
function playDay(run, plan) {
    if (plan.upgrade) upgrade(run, plan.upgrade);
    const prices = dayPrices(run.market, run.day);
    for (const k in plan.buy || {}) buy(run, k, plan.buy[k]);
    for (const rid in plan.cook || {}) {
        const n = Math.min(plan.cook[rid], cookable(run, rid));
        for (let i = 0; i < n; i++) cookOne(run, rid);
    }
    run.priceMult = plan.priceMult || 1;
    startDay(run);
    while (run.visitorsLeft > 0) serveOne(run);
    endDay(run);
    return prices;
}

function netWorth(run) {
    return run.cash + stockValue(run, dayPrices(run.market, Math.min(run.day, DAYS - 1)));
}
// מטבעות בסוף ריצה: בסיס לכל ריצה (גם גרועה), ורווח מוסיף
function coinsFor(profit, sold) {
    return Math.min(400, 40 + Math.max(0, Math.floor(profit / 25)) + Math.floor(sold / 10));
}

/* ---------- שלוש אסטרטגיות לבדיקה (הסימולטור) ---------- */
function careless(run) {
    const buyP = {}; for (const k in INGREDIENTS) buyP[k] = Math.floor(run.rand() * 6);
    return { buy: buyP, cook: { shawarma: 99, kebab: 99, falafel: 99, schnitzel: 99 }, priceMult: 1 };
}
function reasonable(run) {
    const pr = dayPrices(run.market, run.day);
    const margin = r => RECIPES[r].price - Object.keys(RECIPES[r].uses).reduce((a, k) => a + RECIPES[r].uses[k] * pr[k], 0);
    const best = Object.keys(RECIPES).sort((a, b) => margin(b) - margin(a))[0];
    const buyP = {};
    for (const k in RECIPES[best].uses) buyP[k] = RECIPES[best].uses[k] * Math.min(run.grillSlots, 12);
    const up = run.grillLevel < 1 && run.cash > 600 ? 'grill' : null;
    const spent = up ? GRILL_COST[0] : 0;
    return { buy: fitBudget(buyP, pr, (run.cash - spent) * 0.93), cook: { [best]: run.grillSlots }, priceMult: 1, upgrade: up };
}
function strong(run) {
    const pr = dayPrices(run.market, run.day);
    const cost = r => Object.keys(RECIPES[r].uses).reduce((a, k) => a + RECIPES[r].uses[k] * pr[k], 0);
    const ranked = Object.keys(RECIPES).map(r => ({ r, m: RECIPES[r].price - cost(r) })).filter(x => x.m > 0).sort((a, b) => b.m - a.m);
    const cook = {}, buyP = {};
    if (ranked.length) {
        const r = ranked[0].r;
        cook[r] = run.grillSlots;
        for (const k in RECIPES[r].uses) buyP[k] = Math.max(0, RECIPES[r].uses[k] * run.grillSlots - (run.stock[k] || 0));
    }
    const upgradeW = run.grillLevel < GRILL_COST.length && run.day < 20 && run.cash >= GRILL_COST[run.grillLevel] + 60 ? 'grill'
        : run.signLevel < SIGN_COST.length && run.day < 12 && run.cash >= SIGN_COST[run.signLevel] + 500 ? 'sign' : null;
    const spent = upgradeW === 'grill' ? GRILL_COST[run.grillLevel] : upgradeW === 'sign' ? SIGN_COST[run.signLevel] : 0;
    const cookedTotal = Object.values(cook).reduce((a, b) => a + b, 0) || 1;
    let priceMult = 1;
    for (let m = 1.0; m <= 1.6; m += 0.02) { if (expectedVisitors(run, m) >= cookedTotal) priceMult = m; else break; }
    return { buy: fitBudget(buyP, pr, (run.cash - spent) * 0.93), cook, priceMult, upgrade: upgradeW };
}
const STRATS = { careless, reasonable, strong };
function playRun(seed, strat) {
    const run = newRun(seed);
    for (let d = 0; d < DAYS; d++) playDay(run, STRATS[strat](run));
    const nw = netWorth(run), profit = nw - START_CASH;
    return { seed, nw, profit, sold: run.sold, lost: run.lost, coins: coinsFor(profit, run.sold) };
}

return {
    DAYS, INGREDIENTS, RECIPES, GRILL_COST, SIGN_COST, START_CASH, EVENTS,
    rng, newRun, dayPrices, eventsToday, expectedVisitors, cookable, fitBudget,
    upgrade, buy, cookOne, startDay, serveOne, endDay, playDay,
    netWorth, coinsFor, STRATS, playRun,
};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = MK;

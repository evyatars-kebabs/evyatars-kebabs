/* ============================================================
   סימולטור לשוק התבלינים (Spice Market) - בדיקת איזון בלי מסכים.
   הרצה:  node tools/spice-sim.js [מספר ריצות]
   כל ריצה = 30 ימים עם שוק אקראי (זרע שונה). שלוש אסטרטגיות משחקות
   כדי לבדוק שמשחק טוב מנצח, שגם ריצה גרועה משלמת מטבעות, ושהשוק לא רועש מדי.
   ============================================================ */
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
// מתכונים: מה נכנס לכל כבב, ומחיר המכירה הבסיסי. ההעדפה = משקל בבחירת לקוחות
const RECIPES = {
    shawarma: { name: 'שווארמה',   uses: { meat: 1, pita: 1, veg: 1, tahini: 1 }, price: 40, pref: 3 },
    kebab:    { name: 'קבב מנה',   uses: { meat: 2, veg: 1, spice: 1 },          price: 55, pref: 2 },
    falafel:  { name: 'פלאפל',     uses: { pita: 1, veg: 1, tahini: 1, pickles: 1 }, price: 30, pref: 3 },
    schnitzel:{ name: 'שניצל',     uses: { meat: 1, pita: 1, pickles: 1 },       price: 35, pref: 2 },
};
const GRILL_BASE = 12;               // כבבים ליום בלי שדרוג
const GRILL_STEP = 4;                // כל שדרוג מוסיף
const GRILL_COST = [120, 260, 480];  // עלות השדרוגים הבאים
const SIGN_COST = [90, 200];         // שלט: מגביר ביקושים
const SIGN_BOOST = [0.12, 0.25];

// ---------- מספר אקראי עם זרע (כדי שכל ריצה תהיה ניתנת לשחזור) ----------
function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

// ---------- השוק: מחירים עם סחף אקראי, משיכה לבסיס, השפעת קנייה ומכירה, ואירועים ----------
const EVENTS = [
    { name: 'גל חום',       day: [], mult: { veg: 1.5, pickles: 1.4 }, demand: 0.9, len: 3 },
    { name: 'שביתת משלוחים', mult: { meat: 1.9, tahini: 1.5 }, demand: 1.0, len: 4 },
    { name: 'פסטיבל',       mult: {}, demand: 1.35, len: 3 },
    { name: 'שפל בבשר',     mult: { meat: 0.5, veg: 0.7 }, demand: 1.1, len: 3 },
];
function makeMarket(rand) {
    const price = {}, base = {};
    for (const k in INGREDIENTS) { base[k] = INGREDIENTS[k].base; price[k] = base[k] * (0.85 + rand() * 0.3); }
    const events = [];
    // אירוע אחד עד שניים בכל ריצה, ביום אקראי
    const n = 1 + (rand() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) {
        const e = EVENTS[Math.floor(rand() * EVENTS.length)];
        events.push({ ...e, from: 2 + Math.floor(rand() * (DAYS - 8)) });
    }
    return { price, base, events, rand };
}
function eventsToday(m, day) { return m.events.filter(e => day >= e.from && day < e.from + e.len); }
function dayPrices(m, day) {
    const ev = eventsToday(m, day);
    const out = {};
    for (const k in m.price) {
        let mult = 1; for (const e of ev) mult *= (e.mult[k] || 1);
        out[k] = m.price[k] * mult;
    }
    return out;
}
// סחף ליום הבא: אקראיות ±8%, משיכה לבסיס ב-25% מהפער
function stepMarket(m) {
    for (const k in m.price) {
        const drift = (m.rand() - 0.5) * 0.26;
        m.price[k] = m.price[k] * (1 + drift) + (m.base[k] - m.price[k]) * 0.15;
        m.price[k] = Math.max(m.base[k] * 0.4, m.price[k]);
    }
}
// כל קנייה מעלה את המחיר קצת, וכל מכירה של חומר גולמי לא קיימת (אין מכירה חוזרת)
function buyImpact(m, k, qty) { m.price[k] *= 1 + Math.min(0.25, qty * 0.004); }

// ---------- מצב ריצה ----------
function newRun(seed) {
    const rand = rng(seed);
    return {
        day: 0, cash: 200, stock: {}, rand, market: makeMarket(rand),
        sold: 0, lost: 0, grillLevel: 0, grillSlots: GRILL_BASE, signLevel: 0,
    };
}
function stockValue(run, prices) {
    let v = 0;
    for (const k in run.stock) v += run.stock[k] * (prices[k] || INGREDIENTS[k].base);
    return v;
}
// כמה כבבים אפשר לבשל (לפי כמות החומרים והעמדות)
function cookable(run, rid) {
    const u = RECIPES[rid].uses; let n = Infinity;
    for (const k in u) n = Math.min(n, Math.floor((run.stock[k] || 0) / u[k]));
    return Math.max(0, n);
}

// ---------- יום אחד: קנייה, בישול, לקוחות, מכירה ----------
// plan = { buy: {ingredient: qty}, cook: {recipe: qty}, priceMult: מכפיל מחיר התפריט, upgrade: 'grill'|'sign'|null }
function playDay(run, plan) {
    const prices = dayPrices(run.market, run.day);
    // 1. שדרוגים (לפני כל דבר, בתשלום)
    if (plan.upgrade === 'grill' && run.grillLevel < GRILL_COST.length && run.cash >= GRILL_COST[run.grillLevel]) {
        run.cash -= GRILL_COST[run.grillLevel]; run.grillLevel++; run.grillSlots += GRILL_STEP;
    }
    if (plan.upgrade === 'sign' && run.signLevel < SIGN_COST.length && run.cash >= SIGN_COST[run.signLevel]) {
        run.cash -= SIGN_COST[run.signLevel]; run.signLevel++;
    }
    // 2. קנייה (לא יותר ממה שיש כסף)
    for (const k in plan.buy || {}) {
        let q = Math.floor(plan.buy[k]);
        while (q > 0 && q * prices[k] > run.cash) q--;      // לא קונים יותר ממה שמשלמים
        if (q <= 0) continue;
        const cost = q * prices[k];
        run.cash -= cost; run.stock[k] = (run.stock[k] || 0) + q;
        buyImpact(run.market, k, q);
    }
    // 3. בישול לפי התוכנית, עד קיבולת העמדות
    let slots = run.grillSlots;
    const cooked = {};
    for (const rid in plan.cook || {}) {
        let n = Math.min(plan.cook[rid], cookable(run, rid), slots);
        if (n <= 0) continue;
        for (const k in RECIPES[rid].uses) run.stock[k] -= RECIPES[rid].uses[k] * n;
        cooked[rid] = (cooked[rid] || 0) + n; slots -= n;
    }
    // 4. מכירה: לקוחות מגיעים (תלוי ביום, באירועים ובשלט), ובוחרים מנה לפי העדפה ומחיר
    const mult = plan.priceMult || 1;
    const demandEv = eventsToday(run.market, run.day).reduce((m, e) => m * e.demand, 1);
    const signB = run.signLevel > 0 ? SIGN_BOOST[run.signLevel - 1] : 0;
    const visitors = Math.round((12 + 0.5 * run.day) * demandEv * (1 + signB) * (0.85 + run.rand() * 0.3));
    const have = { ...cooked };
    const prefs = Object.keys(RECIPES);
    for (let i = 0; i < visitors; i++) {
        // מחיר גבוה מהרגיל מוריד את הסיכוי לקנות אותה מנה (ולא מוריד את המכירה עצמה)
        const w = {}; let total = 0;
        for (const r of prefs) {
            w[r] = (have[r] || 0) > 0 ? RECIPES[r].pref * Math.max(0.05, 1.6 - 0.8 * mult) : 0;
            total += w[r];
        }
        if (total <= 0) { run.lost += visitors - i; break; }   // אין מה למכור - שאר הלקוחות הולכים
        let x = run.rand() * total, pick = prefs[0];
        for (const r of prefs) { x -= w[r]; if (x <= 0) { pick = r; break; } }
        have[pick]--; run.sold++;
        run.cash += Math.round(RECIPES[pick].price * mult);
    }
    // 5. סוף יום: מחירים זזים, והמלאי שנשאר נשמר
    stepMarket(run.market);
    run.day++;
}

function netWorth(run) {
    const prices = dayPrices(run.market, Math.min(run.day, DAYS - 1));
    return run.cash + stockValue(run, prices);
}
function coinsFor(profit, sold) {
    // ריצה גרועה עדיין מקבלת בסיס; רווח מוסיף. לא יותר מ-SOLD_CAP כדי לא להציף
    return Math.min(400, 40 + Math.max(0, Math.floor(profit / 25)) + Math.floor(sold / 10));
}

// קנייה שנכנסת לתקציב: אם אין כסף לכל הכמות, מקטינים את כל החומרים באותו יחס (כדי לא לקנות בשר בלי ירקות)
function fitBudget(buy, prices, cash) {
    let cost = 0; for (const k in buy) cost += buy[k] * prices[k];
    if (cost <= cash) return buy;
    const f = cash / cost, out = {};
    for (const k in buy) out[k] = Math.floor(buy[k] * f);
    return out;
}

// ---------- שלוש אסטרטגיות לבדיקה ----------
// רשלנית: קונה אקראי מעט, מבשלת מה שיש, מחיר רגיל
function careless(run) {
    const buy = {}; for (const k in INGREDIENTS) buy[k] = Math.floor(run.rand() * 6);
    return { buy, cook: { shawarma: 99, kebab: 99, falafel: 99, schnitzel: 99 }, priceMult: 1 };
}
// סבירה: קונה את מה שנדרש למנה הרווחית ביותר בזול, מבשלת עד התקרה, שדרוג עמדות כשיש כסף
function reasonable(run) {
    const pr = dayPrices(run.market, run.day);
    const margin = r => RECIPES[r].price - Object.keys(RECIPES[r].uses).reduce((a, k) => a + RECIPES[r].uses[k] * pr[k], 0);
    const best = Object.keys(RECIPES).sort((a, b) => margin(b) - margin(a))[0];
    const buy = {};
    for (const k in RECIPES[best].uses) buy[k] = RECIPES[best].uses[k] * Math.min(run.grillSlots, 12);
    const upgrade = run.grillLevel < 1 && run.cash > 600 ? 'grill' : null;
    return { buy: fitBudget(buy, pr, (run.cash - (upgrade ? GRILL_COST[0] : 0)) * 0.93), cook: { [best]: run.grillSlots }, priceMult: 1, upgrade };
}
// חזקה: מדרגת את המנות לפי הרווח בהווה, מתכננת בישול לפי מה שכבר יש במלאי, קונה רק למה שמתכננת,
// מגדילה מלאי כשהמחיר נמוך מהבסיס, משדרגת קודם את העמדות ואז את השלט, ומעלה מחיר רק כשהביקוש גבוה
function strong(run) {
    const pr = dayPrices(run.market, run.day);
    const cost = r => Object.keys(RECIPES[r].uses).reduce((a, k) => a + RECIPES[r].uses[k] * pr[k], 0);
    const ranked = Object.keys(RECIPES).map(r => ({ r, m: RECIPES[r].price - cost(r) })).filter(x => x.m > 0).sort((a, b) => b.m - a.m);
    const cook = {}, buy = {};
    let slots = run.grillSlots;
    // כל העמדות למנה הרווחית ביותר בהווה (ואם היא לא מספיקה למלאי - השנייה ברווח)
    const best = ranked[0];
    if (best) {
        const r = best.r; cook[r] = run.grillSlots; slots = 0;
        for (const k in RECIPES[r].uses) buy[k] = (buy[k] || 0) + Math.max(0, RECIPES[r].uses[k] * run.grillSlots - (run.stock[k] || 0));
    }
    // קנייה מוקדמת כשמחיר נמוך: יום אחד קדימה
    for (const k in buy) if (pr[k] < INGREDIENTS[k].base * 0.9) buy[k] = Math.ceil(buy[k] * 1.15);   // רק תוספת קטנה - מלאי יקר לשמור על השוק
    // שדרוג עמדה משתלם רק אם נשאר זמן להחזיר את העלות (עד היום ה-20 בערך), ושלט - רק כשיש הרבה כסף
    const upgrade = run.grillLevel < GRILL_COST.length && run.day < 20 && run.cash >= GRILL_COST[run.grillLevel] + 60 ? 'grill'
        : run.signLevel < SIGN_COST.length && run.day < 12 && run.cash >= SIGN_COST[run.signLevel] + 500 ? 'sign' : null;
    const spent = upgrade === 'grill' ? GRILL_COST[run.grillLevel] : upgrade === 'sign' ? SIGN_COST[run.signLevel] : 0;
    const priceMult = run.day > DAYS - 6 && ranked.length ? 1.08 : 1;     // מחיר מעט גבוה לקראת הסוף, כשיש ביקוש
    return { buy: fitBudget(buy, pr, (run.cash - spent) * 0.93), cook, priceMult, upgrade };
}
const STRATS = { careless, reasonable, strong };

function playRun(seed, strat) {
    const run = newRun(seed);
    for (let d = 0; d < DAYS; d++) playDay(run, STRATS[strat](run));
    const nw = netWorth(run);
    const profit = nw - 200;
    return { seed, nw, profit, sold: run.sold, lost: run.lost, coins: coinsFor(profit, run.sold) };
}

module.exports = { DAYS, INGREDIENTS, RECIPES, GRILL_COST, SIGN_COST, newRun, playDay, netWorth, coinsFor, dayPrices, cookable, rng, STRATS };
module.exports.playRun = playRun;

if (require.main === module) {
    const N = +process.argv[2] || 1000;
    const stats = {};
    for (const name of Object.keys(STRATS)) {
        const rs = []; for (let i = 1; i <= N; i++) rs.push(playRun(i * 7919, name));
        const nws = rs.map(r => r.nw).sort((a, b) => a - b);
        const pct = q => nws[Math.floor(q * (nws.length - 1))];
        const coins = rs.map(r => r.coins).sort((a, b) => a - b);
        stats[name] = { nws, rs, p10: pct(0.1), med: pct(0.5), p90: pct(0.9), coinsMin: coins[0], coinsMed: coins[Math.floor(coins.length / 2)], soldMed: rs.map(r => r.sold).sort((a, b) => a - b)[Math.floor(N / 2)] };
        const s = stats[name];
        console.log(name.padEnd(11), 'net worth p10/med/p90:', [s.p10, s.med, s.p90].map(v => Math.round(v)).join(' / '), '| coins min/med:', s.coinsMin, '/', s.coinsMed, '| sold med:', s.soldMed);
    }
    // מי מנצח את מי: ריצה לפי ריצה, באותו שוק
    const beats = (a, b) => { let w = 0; for (let i = 0; i < N; i++) if (stats[a].rs[i].nw > stats[b].rs[i].nw) w++; return (100 * w / N).toFixed(1) + '%'; };
    console.log('strong beats reasonable:', beats('strong', 'reasonable'), '| reasonable beats careless:', beats('reasonable', 'careless'), '| strong beats careless:', beats('strong', 'careless'));
    const bad = stats.careless.rs.filter(r => r.profit < 0).length;
    console.log('careless runs at a loss:', bad, '/', N, '| every run pays coins:', stats.careless.coinsMin > 0);
}


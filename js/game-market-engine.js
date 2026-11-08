/* ============================================================
   מנוע שוק התבלינים (Spice Market) - כל החוקים, בלי מסכים.
   משמש את המשחק (js/game-market.js) ואת הסימולטור (tools/spice-sim.js).
   יום = קנייה של חומרי גלם למחסן, לקוחות שמזמינים מנות (המנה נעשית מהחומרים במחסן),
   פופולריות שגדלה במכירות, גנבים שמנסים לגנוב מהקופה, שריפה שמפחידה לקוחות, ואירועים.
   ============================================================ */
const MK = (() => {
'use strict';

const DAYS = 14;
const START_CASH = 200;
const WITHDRAW_FEE = 10;               // דמי משיכה קבועים מהבנק
const BANK_INTEREST = 0.02;            // ריבית יומית על הכסף בבנק
const THIEF_STEAL = 0.12;              // גנב לוקח 12% מהמזומן בקופה
const SIGN_COST = [90, 200];
const SIGN_BOOST = [0.12, 0.25];

const INGREDIENTS = {
    meat:    { name: 'בשר',     base: 12, icon: '🥩', color: '#b8322a' },
    pita:    { name: 'פיתה',    base: 3,  icon: '🫓', color: '#e9c98a' },
    veg:     { name: 'ירקות',   base: 4,  icon: '🥬', color: '#4caf50' },
    tahini:  { name: 'טחינה',   base: 5,  icon: '🫙', color: '#e8d7a0' },
    spice:   { name: 'תבלינים', base: 3,  icon: '🌶️', color: '#d9542a' },
    pickles: { name: 'חמוצים',  base: 4,  icon: '🥒', color: '#7cb342' },
};
const RECIPES = {
    shawarma:  { name: 'שווארמה', uses: { meat: 1, pita: 1, veg: 1, tahini: 1 },      price: 40, pref: 3, icon: '🌯' },
    kebab:     { name: 'קבב מנה', uses: { meat: 2, veg: 1, spice: 1 },               price: 55, pref: 2, icon: '🍢' },
    falafel:   { name: 'פלאפל',   uses: { pita: 1, veg: 1, tahini: 1, pickles: 1 },   price: 30, pref: 3, icon: '🧆' },
    schnitzel: { name: 'שניצל',   uses: { meat: 1, pita: 1, pickles: 1 },            price: 35, pref: 2, icon: '🍗' },
};

function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/* ---------- אירועים: הרבה סוגים. כל אחד משנה מחירים, ביקוש, גנבים או הבנק, או נותן/לוקח כסף חד-פעמי ---------- */
const EVENTS = [
    { id: 'heat',     icon: '🌡️', name: 'גל חום',          mult: { veg: 1.5, pickles: 1.4 }, demand: 0.9, len: 3 },
    { id: 'strike',   icon: '🚚', name: 'שביתת משלוחים',    mult: { meat: 1.9, tahini: 1.5 }, len: 4 },
    { id: 'festival', icon: '🎉', name: 'פסטיבל הכפר',      demand: 1.35, len: 3 },
    { id: 'meatdip',  icon: '🥩', name: 'שפל בבשר',         mult: { meat: 0.5, veg: 0.7 }, demand: 1.1, len: 3 },
    { id: 'rain',     icon: '🌧️', name: 'גשם שוטף',         demand: 0.7, len: 2 },
    { id: 'bakery',   icon: '🫓', name: 'מבצע במאפייה',     mult: { pita: 0.5 }, len: 3 },
    { id: 'spiceimp', icon: '🚢', name: 'יבוא תבלינים',     mult: { spice: 0.5 }, len: 3 },
    { id: 'tahshort', icon: '🫙', name: 'מחסור בטחינה',     mult: { tahini: 1.8 }, len: 3 },
    { id: 'thiefwave',icon: '🥷', name: 'גל גנבים בשוק',    thief: 2.5, len: 3 },
    { id: 'quiet',    icon: '😴', name: 'שקט בשוק',         thief: 0.3, len: 3 },
    { id: 'rate',     icon: '📈', name: 'ריבית מוגברת בבנק', interest: 2, len: 5 },
    { id: 'crisis',   icon: '📉', name: 'משבר כלכלי',       interest: 0, len: 3 },
    { id: 'lottery',  icon: '🎰', name: 'הגרלה בשוק',       gift: 400 },
    { id: 'tax',      icon: '🧾', name: 'מס עירייה',        loss: 150 },
    { id: 'sheikh',   icon: '👑', name: 'ביקור של השייח',   demand: 1.6, len: 1 },
    { id: 'gift',     icon: '🎁', name: 'מתנה מסבתא',       gift: 250 },
    { id: 'sandstorm',icon: '💨', name: 'סופת חול',         demand: 0.6, len: 2 },
    { id: 'party',    icon: '🎵', name: 'מסיבה ברחוב',      demand: 1.25, mult: { veg: 1.2 }, len: 2 },
    { id: 'chicken',  icon: '🐔', name: 'מחיר עוף נמוך',    mult: { meat: 0.8 }, len: 3 },
    { id: 'harvest',  icon: '🍅', name: 'יבול שפע',         mult: { veg: 0.6 }, len: 4 },
    { id: 'fire',     icon: '🔥', name: 'שריפה ליד השוק',   demand: 0.5, mult: { veg: 1.3 }, len: 2 },
    { id: 'bigmatch', icon: '⚽', name: 'משחק גדול',         demand: 1.5, len: 1 },
    { id: 'health',   icon: '🧹', name: 'ביקורת תברואה',    demand: 0.75, len: 2 },
    { id: 'ramadan',  icon: '🌙', name: 'לילה של חגיגה',    demand: 1.4, mult: { veg: 1.2 }, len: 4 },
    { id: 'trend',    icon: '🔥', name: 'טרנד: שווארמה',    demand: 1.2, len: 3 },
    { id: 'caravan',  icon: '🐪', name: 'שיירה מהמדבר',     mult: { spice: 0.7, pita: 0.8 }, len: 3 },
    { id: 'silver',   icon: '🪙', name: 'שוק הכסף',         interest: 1.5, len: 3 },
    { id: 'bonanza',  icon: '💰', name: 'בונזה של תיירים',   demand: 1.45, gift: 150, len: 2 },
    { id: 'pickfest', icon: '🥒', name: 'פסטיבל חמוצים',    mult: { pickles: 0.6 }, len: 3 },
    { id: 'oilcost',  icon: '🫒', name: 'עלייה במחיר השמן', mult: { tahini: 1.3, veg: 1.2 }, len: 3 },
];
// מודיפיקטורים של יום: מכפילים את כל האירועים הפעילים
function eventsOn(m, day) { return m.events.filter(e => day >= e.from && day < e.from + e.len); }
function eventMod(m, day) {
    const mod = { mult: {}, demand: 1, thief: 1, interest: 1 };
    for (const e of eventsOn(m, day)) {
        for (const k in (e.mult || {})) mod.mult[k] = (mod.mult[k] || 1) * e.mult[k];
        if (e.demand) mod.demand *= e.demand;
        if (e.thief) mod.thief *= e.thief;
        if (e.interest != null) mod.interest *= e.interest;
    }
    return mod;
}

function makeMarket(rand) {
    const price = {}, base = {};
    for (const k in INGREDIENTS) { base[k] = INGREDIENTS[k].base; price[k] = base[k] * (0.85 + rand() * 0.3); }
    // 4-5 אירועים בריצה, כל אחד ביום אחר (ולא בסוף המשחק)
    const pool = EVENTS.slice(), events = [], n = 4 + (rand() < 0.5 ? 1 : 0);
    for (let i = 0; i < n && pool.length; i++) {
        const e = pool.splice(Math.floor(rand() * pool.length), 1)[0];
        events.push({ ...e, from: 1 + Math.floor(rand() * (DAYS - 3)) });
    }
    return { price, base, events, rand };
}
function dayPrices(m, day) {
    const mod = eventMod(m, day), out = {};
    for (const k in m.price) out[k] = m.price[k] * (mod.mult[k] || 1);
    return out;
}
function stepMarket(m) {
    for (const k in m.price) {
        const drift = (m.rand() - 0.5) * 0.26;
        m.price[k] = m.price[k] * (1 + drift) + (m.base[k] - m.price[k]) * 0.15;
        m.price[k] = Math.max(m.base[k] * 0.4, m.price[k]);
    }
}
function buyImpact(m, k, qty) { m.price[k] *= 1 + Math.min(0.25, qty * 0.004); }

function newRun(seed) {
    const rand = rng(seed);
    return {
        seed, day: 0, cash: START_CASH, bank: 0, stock: {}, rand, market: makeMarket(rand),
        sold: 0, lost: 0, stolen: 0, caught: 0, signLevel: 0, pop: POP_START,
        visitorsLeft: 0, thieves: 0, priceMult: 1, takings: 0, gifted: 0,
        dayRev: 0, daySpent: 0, daySold: 0, dayStolen: 0, dayLost: 0, log: [],
    };
}
function stockValue(run, prices) { let v = 0; for (const k in run.stock) v += run.stock[k] * (prices[k] || INGREDIENTS[k].base); return v; }
function cookable(run, rid) {
    const u = RECIPES[rid].uses; let n = Infinity;
    for (const k in u) n = Math.min(n, Math.floor((run.stock[k] || 0) / u[k]));
    return Math.max(0, n);
}
// לקוחות: נמשכים לפי הפופולריות (שגדלה במכירות) והמחיר. הרבה פחות לקוחות מקודם
function expectedVisitors(run, mult) {
    const mod = eventMod(run.market, run.day);
    const signB = run.signLevel > 0 ? SIGN_BOOST[run.signLevel - 1] : 0;
    const elasticity = Math.max(0.3, 1 - 0.6 * (mult - 1));
    return (4 + 0.2 * run.day + run.pop * 0.2) * mod.demand * (1 + signB) * elasticity;
}
function thiefCount(run) {
    const mod = eventMod(run.market, run.day);
    const r = run.rand(), base = r < 0.6 ? 1 : r < 0.25 ? 2 : 0;
    return Math.round(base * mod.thief);
}
function fitBudget(buy, prices, cash) {
    let cost = 0; for (const k in buy) cost += buy[k] * prices[k];
    if (cost <= cash) return buy;
    const f = cash / cost, out = {};
    for (const k in buy) out[k] = Math.floor(buy[k] * f);
    return out;
}

/* ---------- פעולות ---------- */
const POP_START = 10, POP_MAX = 100;
const FIRE_CHANCE = 0.2;               // סיכוי ליום לשריפה בשוק (בזמן המכירה)
// שדרוג יחיד: שלט - מגביר את מספר הלקוחות
function upgrade(run, what) {
    if (what === 'sign' && run.signLevel < SIGN_COST.length && run.cash >= SIGN_COST[run.signLevel]) {
        run.cash -= SIGN_COST[run.signLevel]; run.signLevel++; return true;
    }
    return false;
}
// קנייה של חומרי גלם למחסן
function buy(run, k, q) {
    const price = dayPrices(run.market, run.day)[k];
    q = Math.min(Math.floor(q), Math.floor(run.cash / price));
    if (q <= 0) return 0;
    const cost = q * price;
    run.cash -= cost; run.daySpent += cost; run.stock[k] = (run.stock[k] || 0) + q;
    buyImpact(run.market, k, q);
    return q;
}
// הבנק: הפקדה בחינם, משיכה עולה דמי משיכה קבועים
function deposit(run, amount) {
    amount = Math.floor(Math.min(amount, run.cash));
    if (amount <= 0) return 0;
    run.cash -= amount; run.bank += amount; return amount;
}
function withdraw(run, amount) {
    amount = Math.floor(Math.min(amount, run.bank));
    if (amount <= WITHDRAW_FEE) return 0;
    run.bank -= amount; run.cash += amount - WITHDRAW_FEE; return amount - WITHDRAW_FEE;
}
// פתיחת היום: אירועים חד-פעמיים, גנבים, ומספר הלקוחות לפי המחיר והפופולריות
function startDay(run) {
    run.dayRev = 0; run.daySpent = 0; run.daySold = 0; run.dayStolen = 0; run.dayLost = 0;
    for (const e of run.market.events) if (e.from === run.day && e.gift) { run.cash += e.gift; run.gifted += e.gift; }
    for (const e of run.market.events) if (e.from === run.day && e.loss) run.cash = Math.max(0, run.cash - e.loss);
    run.thieves = thiefCount(run);
    run.visitorsLeft = Math.round(expectedVisitors(run, run.priceMult) * (0.85 + run.rand() * 0.3));
}
function thiefSteal(run) {
    const amt = Math.floor(run.cash * THIEF_STEAL);
    run.cash -= amt; run.stolen += amt; run.dayStolen += amt; return amt;
}
// שריפה: לקוחות ברחו - נספר כמו לקוח שהלך, והפופולריות יורדת
function scare(run) {
    if (run.visitorsLeft <= 0) return false;
    run.visitorsLeft--; run.lost++; run.dayLost++;
    run.pop = Math.max(0, run.pop - 2);
    return true;
}
// לקוח מזמין מנה: נעשית מהחומרים במחסן. הפופולריות עולה במכירה ויורדת כשאין מה למכור
function serveOne(run) {
    if (run.visitorsLeft <= 0) return null;
    run.visitorsLeft--;
    const prefs = Object.keys(RECIPES), w = {}; let total = 0;
    for (const r of prefs) {
        w[r] = cookable(run, r) > 0 ? RECIPES[r].pref * Math.max(0.05, 1.6 - 0.8 * run.priceMult) : 0;
        total += w[r];
    }
    if (total <= 0) { run.lost++; run.dayLost++; run.pop = Math.max(0, run.pop - 1); return null; }
    let x = run.rand() * total, pick = prefs[0];
    for (const r of prefs) { x -= w[r]; if (x <= 0) { pick = r; break; } }
    for (const k in RECIPES[pick].uses) run.stock[k] -= RECIPES[pick].uses[k];
    const price = Math.round(RECIPES[pick].price * run.priceMult);
    run.cash += price; run.takings += price; run.dayRev += price; run.sold++; run.daySold++;
    run.pop = Math.min(POP_MAX, run.pop + 1);
    return { recipe: pick, price };
}
// סוף היום: מסכמים את היום, הריבית בבנק, הפופולריות דועכת מעט, והשוק זז
function endDay(run) {
    run.lost += run.visitorsLeft; run.dayLost += run.visitorsLeft; run.visitorsLeft = 0;
    const mod = eventMod(run.market, run.day);
    const bankStart = run.bank;
    run.bank = Math.round(run.bank * (1 + BANK_INTEREST * mod.interest));
    const summary = {
        day: run.day, sold: run.daySold, revenue: run.dayRev, spent: run.daySpent, stolen: run.dayStolen,
        lost: run.dayLost, interest: run.bank - bankStart, profit: run.dayRev - run.daySpent - run.dayStolen,
        pop: Math.round(run.pop), events: eventsOn(run.market, run.day).map(e => e.icon + ' ' + e.name),
    };
    run.log.push(summary);
    run.pop = Math.max(5, run.pop * 0.93);
    stepMarket(run.market);
    run.day++;
    return summary;
}

// המלצה לסימולטור: בזבוז מחומרים לא נחשב, והשריפה מדומה כהפסד חלקי
function playDay(run, plan) {
    if (plan.upgrade) upgrade(run, plan.upgrade);
    startDay(run);
    for (const k in plan.buy || {}) buy(run, k, plan.buy[k]);
    if (plan.deposit) deposit(run, plan.deposit);
    run.priceMult = plan.priceMult || 1;
    run.visitorsLeft = Math.round(expectedVisitors(run, run.priceMult) * (0.85 + run.rand() * 0.3));
    for (let i = 0; i < run.thieves; i++) thiefSteal(run);
    while (run.visitorsLeft > 0) serveOne(run);
    return endDay(run);
}
function netWorth(run) {
    return run.cash + run.bank + stockValue(run, dayPrices(run.market, Math.min(run.day, DAYS - 1)));
}
function coinsFor(profit, sold) {
    return Math.min(400, 40 + Math.max(0, Math.floor(profit / 25)) + Math.floor(sold / 10));
}

/* ---------- אסטרטגיות לסימולטור ---------- */
// כמה מנות אפשר להכין מחומרים לכל מנה, אחרי הקנייה המתוכננת
function bestRecipe(run, pr) {
    const cost = r => Object.keys(RECIPES[r].uses).reduce((a, k) => a + RECIPES[r].uses[k] * pr[k], 0);
    return Object.keys(RECIPES).map(r => ({ r, m: RECIPES[r].price - cost(r) })).sort((a, b) => b.m - a.m)[0].r;
}
function careless(run) {
    const buyP = {}; for (const k in INGREDIENTS) buyP[k] = Math.floor(run.rand() * 6);
    return { buy: buyP, priceMult: 1 };
}
function reasonable(run) {
    const pr = dayPrices(run.market, run.day), best = bestRecipe(run, pr);
    const want = Math.round(expectedVisitors(run, 1) * 0.9);
    const buyP = {}; for (const k in RECIPES[best].uses) buyP[k] = Math.max(0, RECIPES[best].uses[k] * want - (run.stock[k] || 0));
    return { buy: fitBudget(buyP, pr, run.cash * 0.93), priceMult: 1, upgrade: run.signLevel === 0 && run.cash > 400 ? 'sign' : null };
}
function strong(run) {
    const pr = dayPrices(run.market, run.day), best = bestRecipe(run, pr);
    const want = Math.round(expectedVisitors(run, 1.1) * 0.9);
    const buyP = {}; for (const k in RECIPES[best].uses) buyP[k] = Math.max(0, RECIPES[best].uses[k] * want - (run.stock[k] || 0));
    const spent = run.signLevel === 0 && run.day >= 2 && run.cash > 300 ? SIGN_COST[0] : 0;
    // מחיר שממקסם הכנסה: מחיר × מנות שאפשר למכור מהמלאי
    const Q = want + Math.floor((run.stock[Object.keys(RECIPES[best].uses)[0]] || 0) / RECIPES[best].uses[Object.keys(RECIPES[best].uses)[0]]);
    let priceMult = 1, bestRev = -1;
    for (let m = 0.8; m <= 1.6001; m += 0.02) { const rev = m * Math.min(expectedVisitors(run, m), Q); if (rev > bestRev) { bestRev = rev; priceMult = m; } }
    const keep = 150;
    const deposit = run.cash > keep + 250 ? Math.floor(run.cash - keep - 250) : 0;
    return { buy: fitBudget(buyP, pr, (run.cash - spent) * 0.93), priceMult, upgrade: spent ? 'sign' : null, deposit };
}
const STRATS = { careless, reasonable, strong };
function playRun(seed, strat) {
    const run = newRun(seed);
    for (let d = 0; d < DAYS; d++) playDay(run, STRATS[strat](run));
    const nw = netWorth(run), profit = nw - START_CASH;
    return { seed, nw, profit, sold: run.sold, lost: run.lost, stolen: run.stolen, coins: coinsFor(profit, run.sold) };
}

return {
    DAYS, START_CASH, WITHDRAW_FEE, INGREDIENTS, RECIPES, SIGN_COST, EVENTS, FIRE_CHANCE, POP_START, POP_MAX,
    rng, newRun, dayPrices, eventsOn, eventMod, expectedVisitors, cookable, fitBudget,
    upgrade, buy, deposit, withdraw, startDay, thiefSteal, scare, serveOne, endDay, playDay,
    netWorth, coinsFor, STRATS, playRun,
};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = MK;

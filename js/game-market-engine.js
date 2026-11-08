/* ============================================================
   מנוע שוק התבלינים (Spice Market) - כל החוקים, בלי מסכים.
   משמש את המשחק (js/game-market.js) ואת הסימולטור (tools/spice-sim.js).
   יום = מחיר וקנייה ובישול, לקוחות שמגיעים, גנבים שמנסים לגנוב מהקופה, ואירועים.
   ============================================================ */
const MK = (() => {
'use strict';

const DAYS = 14;
const START_CASH = 200;
const WITHDRAW_FEE = 100;              // דמי משיכה קבועים מהבנק
const BANK_INTEREST = 0.02;            // ריבית יומית על הכסף בבנק
const THIEF_STEAL = 0.12;              // גנב לוקח 12% מהמזומן בקופה
const GRILL_BASE = 12, GRILL_STEP = 4;
const GRILL_COST = [120, 260, 480];
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
        seed, day: 0, cash: START_CASH, bank: 0, stock: {}, ready: {}, rand, market: makeMarket(rand),
        sold: 0, lost: 0, stolen: 0, caught: 0, grillLevel: 0, grillSlots: GRILL_BASE, signLevel: 0,
        cookedToday: 0, visitorsLeft: 0, thieves: 0, priceMult: 1, takings: 0, gifted: 0,
    };
}
function stockValue(run, prices) { let v = 0; for (const k in run.stock) v += run.stock[k] * (prices[k] || INGREDIENTS[k].base); return v; }
function cookable(run, rid) {
    const u = RECIPES[rid].uses; let n = Infinity;
    for (const k in u) n = Math.min(n, Math.floor((run.stock[k] || 0) / u[k]));
    return Math.max(0, n);
}
function expectedVisitors(run, mult) {
    const mod = eventMod(run.market, run.day);
    const signB = run.signLevel > 0 ? SIGN_BOOST[run.signLevel - 1] : 0;
    const elasticity = Math.max(0.3, 1 - 0.6 * (mult - 1));
    return (12 + 0.5 * run.day) * mod.demand * (1 + signB) * elasticity;
}
function thiefCount(run) {
    const mod = eventMod(run.market, run.day);
    const r = run.rand(), base = r < 0.3 ? 1 : r < 0.08 ? 2 : 0;
    return Math.round(base * mod.thief + (r < 0.04 ? 1 : 0) * mod.thief);
}
function fitBudget(buy, prices, cash) {
    let cost = 0; for (const k in buy) cost += buy[k] * prices[k];
    if (cost <= cash) return buy;
    const f = cash / cost, out = {};
    for (const k in buy) out[k] = Math.floor(buy[k] * f);
    return out;
}

/* ---------- פעולות ---------- */
function upgrade(run, what) {
    if (what === 'grill' && run.grillLevel < GRILL_COST.length && run.cash >= GRILL_COST[run.grillLevel]) {
        run.cash -= GRILL_COST[run.grillLevel]; run.grillLevel++; run.grillSlots += GRILL_STEP; return true;
    }
    if (what === 'sign' && run.signLevel < SIGN_COST.length && run.cash >= SIGN_COST[run.signLevel]) {
        run.cash -= SIGN_COST[run.signLevel]; run.signLevel++; return true;
    }
    return false;
}
function buy(run, k, q) {
    const price = dayPrices(run.market, run.day)[k];
    q = Math.min(Math.floor(q), Math.floor(run.cash / price));
    if (q <= 0) return 0;
    run.cash -= q * price; run.stock[k] = (run.stock[k] || 0) + q;
    buyImpact(run.market, k, q);
    return q;
}
// הבנק: הפקדה בחינם, משיכה עולה דמי משיכה קבועים (100 ₪)
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
function cookOne(run, rid) {
    if (run.cookedToday >= run.grillSlots || cookable(run, rid) < 1) return false;
    for (const k in RECIPES[rid].uses) run.stock[k] -= RECIPES[rid].uses[k];
    run.ready[rid] = (run.ready[rid] || 0) + 1; run.cookedToday++;
    return true;
}
// פתיחת היום: אירועים חד-פעמיים, גנבים, ומספר הלקוחות לפי המחיר
function startDay(run) {
    run.cookedToday = 0;
    for (const e of run.market.events) if (e.from === run.day && e.gift) { run.cash += e.gift; run.gifted += e.gift; }
    for (const e of run.market.events) if (e.from === run.day && e.loss) run.cash = Math.max(0, run.cash - e.loss);
    run.thieves = thiefCount(run);
    run.visitorsLeft = Math.round(expectedVisitors(run, run.priceMult) * (0.85 + run.rand() * 0.3));
}
// גנב הגיע לקופה ולקח כסף (אם לא נתפס)
function thiefSteal(run) {
    const amt = Math.floor(run.cash * THIEF_STEAL);
    run.cash -= amt; run.stolen += amt; return amt;
}
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
function endDay(run) {
    run.lost += run.visitorsLeft; run.visitorsLeft = 0;
    run.ready = {};
    const mod = eventMod(run.market, run.day);
    run.bank = Math.round(run.bank * (1 + BANK_INTEREST * mod.interest));
    stepMarket(run.market);
    run.day++;
}

function playDay(run, plan) {
    if (plan.upgrade) upgrade(run, plan.upgrade);
    startDay(run);                                             // (לפני הקנייה, כדי שהאירועים יחולו)
    for (const k in plan.buy || {}) buy(run, k, plan.buy[k]);
    for (const rid in plan.cook || {}) { const n = Math.min(plan.cook[rid], cookable(run, rid)); for (let i = 0; i < n; i++) cookOne(run, rid); }
    if (plan.deposit) deposit(run, plan.deposit);
    run.priceMult = plan.priceMult || 1;
    run.visitorsLeft = Math.round(expectedVisitors(run, run.priceMult) * (0.85 + run.rand() * 0.3));
    for (let i = 0; i < run.thieves; i++) thiefSteal(run);
    while (run.visitorsLeft > 0) serveOne(run);
    endDay(run);
}
function netWorth(run) {
    return run.cash + run.bank + stockValue(run, dayPrices(run.market, Math.min(run.day, DAYS - 1)));
}
function coinsFor(profit, sold) {
    return Math.min(400, 40 + Math.max(0, Math.floor(profit / 25)) + Math.floor(sold / 10));
}

/* ---------- אסטרטגיות לסימולטור ---------- */
function careless(run) {
    const buyP = {}; for (const k in INGREDIENTS) buyP[k] = Math.floor(run.rand() * 6);
    return { buy: buyP, cook: { shawarma: 99, kebab: 99, falafel: 99, schnitzel: 99 }, priceMult: 1 };
}
function reasonable(run) {
    const pr = dayPrices(run.market, run.day);
    const margin = r => RECIPES[r].price - Object.keys(RECIPES[r].uses).reduce((a, k) => a + RECIPES[r].uses[k] * pr[k], 0);
    const best = Object.keys(RECIPES).sort((a, b) => margin(b) - margin(a))[0];
    const buyP = {}; for (const k in RECIPES[best].uses) buyP[k] = RECIPES[best].uses[k] * Math.min(run.grillSlots, 12);
    const up = run.grillLevel < 1 && run.cash > 600 ? 'grill' : null;
    return { buy: fitBudget(buyP, pr, (run.cash - (up ? GRILL_COST[0] : 0)) * 0.93), cook: { [best]: run.grillSlots }, priceMult: 1, upgrade: up };
}
function strong(run) {
    const pr = dayPrices(run.market, run.day);
    const cost = r => Object.keys(RECIPES[r].uses).reduce((a, k) => a + RECIPES[r].uses[k] * pr[k], 0);
    const ranked = Object.keys(RECIPES).map(r => ({ r, m: RECIPES[r].price - cost(r) })).filter(x => x.m > 0).sort((a, b) => b.m - a.m);
    const cook = {}, buyP = {};
    if (ranked.length) {
        const r = ranked[0].r; cook[r] = run.grillSlots;
        for (const k in RECIPES[r].uses) buyP[k] = Math.max(0, RECIPES[r].uses[k] * run.grillSlots - (run.stock[k] || 0));
    }
    const upgradeW = run.grillLevel < GRILL_COST.length && run.day >= 2 && run.day < 10 && run.cash >= GRILL_COST[run.grillLevel] + 250 ? 'grill'
        : run.signLevel < SIGN_COST.length && run.day < 7 && run.cash >= SIGN_COST[run.signLevel] + 500 ? 'sign' : null;
    const spent = upgradeW === 'grill' ? GRILL_COST[run.grillLevel] : upgradeW === 'sign' ? SIGN_COST[run.signLevel] : 0;
    const cookedTotal = Object.values(cook).reduce((a, b) => a + b, 0) || 1;
    // המחיר שממקסם הכנסה צפויה: מחיר × מספר מנות שנמכרות (מוגבל גם בכמות הלקוחות שמגיעים)
    let priceMult = 1, bestRev = -1;
    for (let m = 0.8; m <= 1.6001; m += 0.02) {
        const rev = m * Math.min(expectedVisitors(run, m), cookedTotal);
        if (rev > bestRev) { bestRev = rev; priceMult = m; }
    }
    const keep = 150;                                              // מה שנשאר מעל מזומן לקנייה - לבנק (בטוח, וגם מביא ריבית)
    const deposit = run.cash > keep + 250 ? Math.floor(run.cash - keep - 250) : 0;
    return { buy: fitBudget(buyP, pr, (run.cash - spent) * 0.93), cook, priceMult, upgrade: upgradeW, deposit };
}
const STRATS = { careless, reasonable, strong };
function playRun(seed, strat) {
    const run = newRun(seed);
    for (let d = 0; d < DAYS; d++) playDay(run, STRATS[strat](run));
    const nw = netWorth(run), profit = nw - START_CASH;
    return { seed, nw, profit, sold: run.sold, lost: run.lost, stolen: run.stolen, coins: coinsFor(profit, run.sold) };
}

return {
    DAYS, START_CASH, WITHDRAW_FEE, INGREDIENTS, RECIPES, GRILL_COST, SIGN_COST, EVENTS,
    rng, newRun, dayPrices, eventsOn, eventMod, expectedVisitors, cookable, fitBudget,
    upgrade, buy, deposit, withdraw, cookOne, startDay, thiefSteal, serveOne, endDay, playDay,
    netWorth, coinsFor, STRATS, playRun,
};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = MK;

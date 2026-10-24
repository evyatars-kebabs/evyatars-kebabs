/* ============================================================
   כלכלת המשחק: מטבעות קבב, קופונים וחנות סקינים
   ============================================================ */
const COIN_KEY = 'kebab_coins';
const SKINS_KEY = 'kebab_skins_owned';
const SKIN_EQ_KEY = 'kebab_skin_equipped';

function getCoins() { return parseInt(store.get(COIN_KEY)) || 0; }
function setCoins(n) {
    store.set(COIN_KEY, Math.max(0, Math.floor(n)));
    renderCoinBadges();
    if (typeof syncLeaderboardSkin === 'function') syncLeaderboardSkin(3000);     // היתרה מוצגת בפרופיל בטבלאות
}
function addCoins(n) { setCoins(getCoins() + n); }
function spendCoins(n) {
    if (getCoins() < n) return false;
    setCoins(getCoins() - n);
    return true;
}
let lastCoinsShown = null;
function renderCoinBadges() {
    const n = getCoins();
    const grew = lastCoinsShown !== null && n > lastCoinsShown;
    lastCoinsShown = n;
    document.querySelectorAll('.coin-balance').forEach(e => {
        e.textContent = n;
        const chip = e.closest('.coin-chip');
        if (grew && chip) { chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump'); }
    });
}

/* ---------- קופונים ---------- */
// wLow = משקל כשהניקוד נמוך, wHigh = משקל כשהניקוד גבוה מאוד.
// כל קופון נדיר בצורה שונה, וככל שהניקוד עולה הקופונים הנדירים נעשים סבירים יותר.
const COUPONS = [
    { text: "תוספת צ'יפס מוגדל חינם!",                  coins: 5,   wLow: 60, wHigh: 10 },
    { text: 'פחיות שתייה במתנה בארוחת סינגל!',          coins: 15,  wLow: 28, wHigh: 25 },
    { text: 'קינוח מלבי מתנה בהזמנה מעל 100 ש״ח!',      coins: 35,  wLow: 9,  wHigh: 35 },
    { text: '10% הנחה על כל השיפודים!',                 coins: 100, wLow: 3,  wHigh: 30 }
];

// min: עד ניקוד זה (כולל) אין קופון. great: הניקוד שממנו המזל במקסימום.
// חידון לא מופיע כאן - הוא אף פעם לא נותן מטבעות.
const GAME_REWARD = {
    goods:   { min: 16, great: 60 },
    shvartz: { min: 30, great: 140 },
    ninja:   { min: 10, great: 70 },
    kvk:     { min: 80, great: 1500 }
};

function rollCoupon(gameKey, score) {
    const cfg = GAME_REWARD[gameKey];
    if (!cfg || score <= cfg.min) return null;
    const luck = Math.min(1, (score - cfg.min) / (cfg.great - cfg.min));
    const weights = COUPONS.map(c => c.wLow + (c.wHigh - c.wLow) * luck);
    let r = Math.random() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < COUPONS.length; i++) {
        r -= weights[i];
        if (r <= 0) return COUPONS[i];
    }
    return COUPONS[0];
}

/* ---------- איסוף מטבעות: המטבעות עפים אל היתרה ---------- */
let pendingCoins = 0;

// אם יוצאים מהמסך בלי ללחוץ "אסוף" - המטבעות לא הולכים לאיבוד
function creditPendingCoins() {
    if (!pendingCoins) return;
    addCoins(pendingCoins);
    pendingCoins = 0;
}

function claimCoins() {
    const amount = pendingCoins;
    if (!amount) return;
    pendingCoins = 0;
    const btn = document.getElementById('claim-btn');
    btn.disabled = true;
    btn.textContent = 'נאסף ✓';
    // אי אפשר לשלוט בעוצמת הרטט בדפדפן - רק באורך; רטט ארוך מורגש חזק יותר
    haptic([90, 40, 90]);
    flyCoins(btn, amount);
}

// מוסיף מטבעות ליתרה עם אנימציה: המטבעות עפים מ-fromEl אל היתרה למעלה
function flyCoins(fromEl, amount) {
    const before = getCoins();
    store.set(COIN_KEY, before + amount);             // נשמר מיד; התצוגה מתעדכנת עם כל מטבע שמגיע
    const chip = document.querySelector('.top-bar .coin-chip');
    const from = fromEl.getBoundingClientRect();
    const to = chip ? chip.getBoundingClientRect() : { left: 20, top: 20, width: 40, height: 30 };
    const x0 = from.left + from.width / 2, y0 = from.top + from.height / 2;
    const x1 = to.left + to.width / 2, y1 = to.top + to.height / 2;

    const n = Math.min(amount, 10);
    const per = Math.floor(amount / n);
    let shown = before, landed = 0;
    for (let i = 0; i < n; i++) {
        const value = i === n - 1 ? amount - per * (n - 1) : per;
        const coin = document.createElement('div');
        coin.className = 'fly-coin';
        coin.textContent = '🪙';
        document.body.appendChild(coin);
        const sx = x0 + (Math.random() - 0.5) * 70, sy = y0 + (Math.random() - 0.5) * 20;
        const mx = (sx + x1) / 2 + (Math.random() - 0.5) * 120, my = Math.min(sy, y1) - 40 - Math.random() * 60;
        const anim = coin.animate([
            { transform: `translate(${sx}px, ${sy}px) translate(-50%, -50%) scale(0.4)`, opacity: 0 },
            { transform: `translate(${sx}px, ${sy - 30}px) translate(-50%, -50%) scale(1.15)`, opacity: 1, offset: 0.15 },
            { transform: `translate(${mx}px, ${my}px) translate(-50%, -50%) scale(1)`, opacity: 1, offset: 0.55 },
            { transform: `translate(${x1}px, ${y1}px) translate(-50%, -50%) scale(0.55)`, opacity: 0.9 }
        ], { duration: 800, delay: 120 + i * 110, easing: 'cubic-bezier(.45, 0, .55, 1)', fill: 'both' });
        anim.onfinish = () => {
            coin.remove();
            shown += value;
            landed++;
            document.querySelectorAll('.coin-balance').forEach(e => { e.textContent = shown; });
            if (chip) { chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump'); }
            sfx.coin();
            haptic(landed === n ? 140 : 55);             // המטבע האחרון - רטט ארוך לסיום
            if (landed === n) renderCoinBadges();
        };
    }
}


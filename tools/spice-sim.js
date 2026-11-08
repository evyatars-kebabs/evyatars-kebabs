/* ============================================================
   סימולטור לשוק התבלינים: מריץ את המנוע (js/game-market-engine.js) במספר רב של ריצות.
   הרצה:  node tools/spice-sim.js [מספר ריצות]
   ============================================================ */
'use strict';
const MK = require('../js/game-market-engine.js');

const N = +process.argv[2] || 1000;
const names = Object.keys(MK.STRATS);
const res = {};
for (const name of names) {
    const rs = []; for (let i = 1; i <= N; i++) rs.push(MK.playRun(i * 7919, name));
    const nws = rs.map(r => r.nw).sort((a, b) => a - b), coins = rs.map(r => r.coins).sort((a, b) => a - b);
    const pct = q => nws[Math.floor(q * (nws.length - 1))];
    res[name] = { rs, p10: pct(0.1), med: pct(0.5), p90: pct(0.9), coinsMin: coins[0], coinsMed: coins[Math.floor(N / 2)],
                  soldMed: rs.map(r => r.sold).sort((a, b) => a - b)[Math.floor(N / 2)] };
    const s = res[name];
    console.log(name.padEnd(11), 'net worth p10/med/p90:', [s.p10, s.med, s.p90].map(v => Math.round(v)).join(' / '), '| coins min/med:', s.coinsMin, '/', s.coinsMed, '| sold med:', s.soldMed);
}
const beats = (a, b) => { let w = 0; for (let i = 0; i < N; i++) if (res[a].rs[i].nw > res[b].rs[i].nw) w++; return (100 * w / N).toFixed(1) + '%'; };
console.log('strong beats reasonable:', beats('strong', 'reasonable'), '| reasonable beats careless:', beats('reasonable', 'careless'), '| strong beats careless:', beats('strong', 'careless'));
console.log('careless runs at a loss:', res.careless.rs.filter(r => r.profit < 0).length, '/', N, '| every run pays coins:', res.careless.coinsMin > 0);

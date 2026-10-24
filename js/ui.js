/* ============================================================
   UI: צלילים, אפקטי לחיצה, גחלים, קונפטי וקודים
   ============================================================ */

/* ---------- צלילים (WebAudio מסונתז, בלי קבצים) ---------- */
const sfx = (() => {
    let ctx = null;
    let muted = store.get('kebab_muted') === '1';
    let noiseBuf = null;
    let sfxBus = null;
    const SFX_VOL = 1.35;                         // עוצמת האפקטים (1 = המקור)

    function ac() {
        if (muted) return null;
        if (!ctx) {
            try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
            // מדחס בסוף השרשרת מונע עיוות כשכמה צלילים מתנגנים יחד
            const comp = ctx.createDynamicsCompressor();
            comp.threshold.value = -10; comp.ratio.value = 4;
            comp.connect(ctx.destination);
            sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_VOL; sfxBus.connect(comp);
        }
        if (ctx.state === 'suspended') ctx.resume();
        return ctx;
    }
    function tone(freq, dur, type, vol, delay, endFreq) {
        const c = ac(); if (!c) return;
        const t0 = c.currentTime + (delay || 0);
        const o = c.createOscillator(), g = c.createGain();
        o.type = type || 'sine';
        o.frequency.setValueAtTime(freq, t0);
        if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(sfxBus);
        o.start(t0); o.stop(t0 + dur + 0.03);
    }
    function noise(dur, vol, f0, f1, delay) {
        const c = ac(); if (!c) return;
        if (!noiseBuf) {
            noiseBuf = c.createBuffer(1, c.sampleRate * 0.6, c.sampleRate);
            const d = noiseBuf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        }
        const t0 = c.currentTime + (delay || 0);
        const s = c.createBufferSource(); s.buffer = noiseBuf;
        const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
        f.frequency.setValueAtTime(f0, t0);
        f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
        const g = c.createGain();
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        s.connect(f); f.connect(g); g.connect(sfxBus);
        s.start(t0); s.stop(t0 + dur + 0.05);
    }

    // רעש מנוע שקט ומתמשך (לשליח הקבבים): שני מתנדים נמוכים, מסנן, ופעימות של מנוע
    let eng = null;
    function engineSet(level) {
        const c = ac(); if (!c) return;
        if (!eng) {
            const g = c.createGain(); g.gain.value = 0.0001;
            const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 320; f.Q.value = 2;
            const o1 = c.createOscillator(); o1.type = 'sawtooth';
            const o2 = c.createOscillator(); o2.type = 'square'; o2.detune.value = 9;
            const lfo = c.createOscillator(); lfo.type = 'sine';
            const lfoG = c.createGain(); lfoG.gain.value = 0.012;
            const mix = c.createGain(); mix.gain.value = 0.5;
            o1.connect(mix); o2.connect(mix); mix.connect(f); f.connect(g); g.connect(sfxBus);
            lfo.connect(lfoG); lfoG.connect(g.gain);
            o1.start(); o2.start(); lfo.start();
            eng = { g, f, o1, o2, lfo };
        }
        const t = c.currentTime, k = Math.max(0, Math.min(1.3, level));
        eng.o1.frequency.setTargetAtTime(44 + k * 34, t, 0.15);
        eng.o2.frequency.setTargetAtTime(88 + k * 68, t, 0.15);
        eng.lfo.frequency.setTargetAtTime(16 + k * 18, t, 0.15);
        eng.f.frequency.setTargetAtTime(260 + k * 260, t, 0.15);
        eng.g.gain.setTargetAtTime(0.022, t, 0.2);
    }
    function engineStop() {
        if (!eng || !ctx) return;
        const e = eng; eng = null;
        const t = ctx.currentTime;
        e.g.gain.setTargetAtTime(0.0001, t, 0.08);
        [e.o1, e.o2, e.lfo].forEach(o => { try { o.stop(t + 0.4); } catch (err) { /* ignore */ } });
    }

    return {
        engine(level) { engineSet(level); },
        engineStop() { engineStop(); },
        isMuted: () => muted,
        toggle() { muted = !muted; store.set('kebab_muted', muted ? '1' : '0'); if (muted) engineStop(); else this.tap(); return muted; },
        unlock() { if (!muted) ac(); },
        tap()   { tone(640, 0.06, 'triangle', 0.10); tone(960, 0.05, 'sine', 0.05, 0.02); },
        pop()   { tone(420, 0.09, 'sine', 0.16, 0, 760); },
        tick()  { tone(1100, 0.04, 'square', 0.05); },
        good()  { tone(660, 0.1, 'triangle', 0.14); tone(880, 0.14, 'triangle', 0.14, 0.07); },
        score(clean) {
            tone(523, 0.1, 'triangle', 0.16); tone(659, 0.1, 'triangle', 0.16, 0.07); tone(784, 0.18, 'triangle', 0.18, 0.14);
            if (clean) tone(1046, 0.22, 'sine', 0.13, 0.2);
        },
        miss()  { tone(300, 0.2, 'sawtooth', 0.07, 0, 150); },
        err()   { tone(190, 0.18, 'square', 0.09, 0, 130); },
        whoosh(){ noise(0.28, 0.16, 500, 2600); },
        slice(n){ noise(0.14, 0.22, 3200, 900); tone(900 + Math.min(6, n || 1) * 120, 0.08, 'triangle', 0.08, 0.02); },
        bomb()  { noise(0.5, 0.45, 600, 60); tone(110, 0.45, 'sawtooth', 0.16, 0, 40); },
        match(n){ tone(784, 0.1, 'triangle', 0.16); tone(988, 0.1, 'triangle', 0.16, 0.08); tone(1318, 0.2, 'triangle', 0.18, 0.16); },
        coin()  { tone(1318, 0.08, 'square', 0.07); tone(1760, 0.2, 'square', 0.07, 0.07); },
        buy()   { tone(523, 0.1, 'triangle', 0.16); tone(784, 0.1, 'triangle', 0.16, 0.09); tone(1046, 0.1, 'triangle', 0.16, 0.18); tone(1568, 0.3, 'sine', 0.14, 0.27); },
        win()   { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.17, i * 0.1)); tone(1318, 0.5, 'sine', 0.14, 0.4); },
        low()   { tone(330, 0.16, 'triangle', 0.1); tone(262, 0.24, 'triangle', 0.1, 0.12); },
        // רצף: "וושש" של אש + ארפג'ו עולה
        streak() {
            noise(0.6, 0.28, 250, 3200);
            [392, 523, 659, 784].forEach((f, i) => tone(f, 0.16, 'triangle', 0.15, 0.12 + i * 0.09));
            tone(1046, 0.45, 'sine', 0.14, 0.5); tone(1568, 0.35, 'sine', 0.06, 0.55);
        },
        streakTick(i) { tone(700 + i * 60, 0.05, 'square', 0.045); },
        // תיבת אוצר: רעד, פתיחה ופאנפרה
        chest() {
            noise(0.25, 0.2, 2400, 600);
            [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.14, 'square', 0.07, 0.25 + i * 0.08));
            [523, 659, 784].forEach(f => tone(f, 0.8, 'triangle', 0.09, 0.7));
            tone(2093, 0.4, 'sine', 0.05, 0.75);
        }
    };
})();
document.addEventListener('pointerdown', () => sfx.unlock(), { once: true });

function haptic(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ignore */ } }

/* ---------- אפקט לחיצה: ניצוצות + צליל + רטט ---------- */
const PRESS_SELECTOR = '.btn, .game-card, .icon-btn, .sub-tab-btn, .coin-chip, .trivia-option, .goods-slot, .code-btn, .sound-btn, .shop-card .btn, .shop-cat, .shop-more, .daily-act.ready, .skin-switch button, .shop-zoom';
const BURST_COLORS = ['#ffd24a', '#ff9f1c', '#ff6a1a', '#fff2b0'];

function burstAt(x, y, n, spread) {
    for (let i = 0; i < n; i++) {
        const d = document.createElement('div');
        d.className = 'burst-dot';
        d.style.left = x + 'px';
        d.style.top = y + 'px';
        d.style.background = BURST_COLORS[i % BURST_COLORS.length];
        document.body.appendChild(d);
        const a = Math.random() * Math.PI * 2, r = (0.5 + Math.random()) * (spread || 38);
        d.animate([
            { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
            { transform: 'translate(calc(-50% + ' + Math.cos(a) * r + 'px), calc(-50% + ' + (Math.sin(a) * r - 10) + 'px)) scale(0.1)', opacity: 0 }
        ], { duration: 420 + Math.random() * 200, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => d.remove();
    }
}

document.addEventListener('click', e => {
    const t = e.target.closest(PRESS_SELECTOR);
    if (!t || t.disabled) return;
    let x = e.clientX, y = e.clientY;
    if (!x && !y) { const r = t.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    sfx.tap();
    haptic(8);
    burstAt(x, y, t.classList.contains('goods-slot') ? 4 : 7, 36);
}, true);

function confettiBurst(n) {
    const cols = ['#ffd24a', '#ff6a1a', '#ff4d6d', '#4ac26b', '#3b9cff', '#b66bff', '#ffffff'];
    for (let i = 0; i < (n || 46); i++) {
        const c = document.createElement('div');
        c.className = 'confetti-bit';
        c.style.left = (Math.random() * 100) + 'vw';
        c.style.background = cols[i % cols.length];
        document.body.appendChild(c);
        const dx = (Math.random() - 0.5) * 220, rot = (Math.random() - 0.5) * 900;
        c.animate([
            { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
            { transform: 'translate(' + dx + 'px, ' + (window.innerHeight + 40) + 'px) rotate(' + rot + 'deg)', opacity: 0.9 }
        ], { duration: 1500 + Math.random() * 1300, delay: Math.random() * 350, easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'forwards' }).onfinish = () => c.remove();
    }
}

function animateNumber(el, from, to, ms) {
    const t0 = performance.now();
    const step = now => {
        const p = Math.min(1, (now - t0) / ms);
        el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
}

/* ---------- גחלים ברקע ---------- */
(function buildEmbers() {
    const host = document.querySelector('.app-container');
    if (!host) return;
    const box = document.createElement('div');
    box.className = 'embers';
    for (let i = 0; i < 16; i++) {
        const e = document.createElement('i');
        e.style.left = Math.round(Math.random() * 100) + '%';
        e.style.setProperty('--dx', Math.round((Math.random() - 0.5) * 90) + 'px');
        e.style.animationDuration = (7 + Math.random() * 8) + 's';
        e.style.animationDelay = (-Math.random() * 12) + 's';
        const s = 3 + Math.random() * 4;
        e.style.width = e.style.height = s + 'px';
        box.appendChild(e);
    }
    host.insertBefore(box, host.firstChild);
})();

/* ---------- כפתור שמע ---------- */
(function buildSoundButton() {
    const logo = document.querySelector('.brand-logo');
    if (!logo) return;
    const b = document.createElement('button');
    b.className = 'sound-btn';
    b.title = 'צלילים';
    const upd = () => { b.textContent = sfx.isMuted() ? '🔇' : '🔊'; };
    b.onclick = () => { sfx.toggle(); upd(); };
    upd();
    logo.appendChild(b);
})();

/* ---------- טיימרים: אזהרה ב-5 השניות האחרונות ---------- */
(function watchTimers() {
    document.querySelectorAll('.hud-pill span[id$="-timer"]').forEach(span => {
        new MutationObserver(() => {
            const v = parseInt(span.textContent);
            const pill = span.closest('.hud-pill');
            const danger = v > 0 && v <= 5;
            pill.classList.toggle('danger', danger);
            if (danger) sfx.tick();
        }).observe(span, { childList: true, characterData: true, subtree: true });
    });
})();

/* ---------- קודים ---------- */
// קודי הפיתוח (מטבעות / איפוס) נשמרים ב-Firestore, באוסף codes - מזהה המסמך הוא הקוד עצמו.
// שדות אפשריים במסמך: coins (מספר), skin (מזהה סקין), wipe (true).
// הקודים של הסקינים המיוחדים נשארים כאן.
const REDEEM_CODES = {
    'ITAMARTHEAGADI455': { skin: 'banana' },
    'SHRAGONT888':       { skin: 'lizard' },
    'DOSUS505':          { skin: 'dosus' },
    'SPRINGYDADOG3':     { skin: 'yuvaldog' },
    'TAPUZIYUVAL':       { skin: 'tapuzi' },
    'GOLDCAPYSHVARTZ6':  { skin: 'goldcapy' },
    'DARKSIDEKEBAB57':   { skin: 'vader' },
    'WIZMICK6611':       { skin: 'wizmouse' },
    'NIRHANA7':          { skin: 'nir' },
    'IMASHANY1':         { skin: 'shany' },
    'DANCERELLA12':      { skin: 'ella' },
    'MACMILLER30':       { skin: 'macmiller' },
    'KINGJAMES23':       { skin: 'lebron' },
    'TUPACONPAPER2':     { skin: 'tupac' },
    'TRUMPBIKINI47':     { skin: 'trump' },
    // סקין רגיל מהחנות (אגדי) - הקוד נותן אותו בחינם, אבל אפשר גם לקנות אותו
    'AVATARBL88':        { skin: 'avatar' },
    'SHLUK7':            { skin: 'shluk' }
};
// קודי פיתוח: שמורים רק כטביעת אצבע (SHA-256) של הקוד - הקוד עצמו לא מופיע בקבצים,
// והבדיקה נעשית במכשיר, בלי קריאה מהשרת (עובד גם כשנגמרה המכסה היומית של Firebase)
const DEV_CODE_HASHES = {
    '130f07b8829bbcb406ba10bd4fa53490dd768c1e15b813f0a9486f948bffccf6': { coins: 100 },
    '4e992ef896aa5617497a158d9f15c24edd9a4f2a6b056b1ab4dd7a6fe513d015': { coins: 1000 },
    '4349294fed6a3a5825057d55ccb800ee336727c380564f9a95796ac7a700060b': { coins: 10000 },
    'fafdaaf4023195a7a1b13aec563884075beacaedab5cd9ef3703504ebcb5b094': { wipe: true }   // מוחק את כל המטבעות והסקינים
};
function sha256Hex(text) {
    if (!window.crypto || !crypto.subtle) return Promise.resolve('');
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
        .then(buf => [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join(''))
        .catch(() => '');
}
// קודי פיתוח: כל קוד אפשר להפעיל שוב ושוב, ללא הגבלה
function applyReward(reward) {
    if (reward.wipe === true) {                       // איפוס מלא של המלאי
        setCoins(0);
        saveOwnedSkins(new Set(['classic']));
        store.set(SKIN_EQ_KEY, 'classic');
        return { ok: true, wipe: true, msg: 'המלאי נמחק: כל המטבעות והסקינים אופסו' };
    }
    const parts = [];
    const coins = Math.floor(Number(reward.coins) || 0);
    if (coins > 0 && coins <= 1000000) { addCoins(coins); parts.push('+' + coins + ' 🪙'); }
    if (typeof reward.skin === 'string' && SV_SKINS.some(s => s.id === reward.skin)) {
        const owned = getOwnedSkins();
        owned.add(reward.skin);
        saveOwnedSkins(owned);
        store.set(SKIN_EQ_KEY, reward.skin);
        parts.push('סקין חדש: ' + skinById(reward.skin).name);
    }
    if (!parts.length) return { ok: false, msg: 'הקוד לא תקין' };
    return { ok: true, msg: 'הקוד הופעל! ' + parts.join('  ·  ') };
}
// מחזיר תוצאה מיד לקודים שבמשחק, או Promise כשצריך לבדוק בשרת
function redeemCode(raw) {
    const code = String(raw || '').trim().toUpperCase();
    if (!code) return { ok: false, msg: 'הכניסו קוד' };
    if (REDEEM_CODES[code]) return applyReward(REDEEM_CODES[code]);
    if (!/^[A-Z0-9_-]{1,64}$/.test(code)) return { ok: false, msg: 'הקוד לא נמצא' };
    return sha256Hex(code).then(h => {
        if (DEV_CODE_HASHES[h]) return applyReward(DEV_CODE_HASHES[h]);
        // קודים נוספים שנשמרו ב-Firestore (אוסף codes)
        if (!db) return { ok: false, msg: 'הקוד לא נמצא' };
        return db.collection('codes').doc(code).get({ source: 'server' }).then(doc => {
            if (!doc.exists) return { ok: false, msg: 'הקוד לא נמצא' };
            return applyReward(doc.data() || {});
        }).catch(err => {
            console.error('שגיאה בבדיקת קוד:', err.code || '', err.message || err);
            return { ok: false, msg: err && err.code === 'resource-exhausted'
                ? 'השרת הגיע למגבלת השימוש היומית. נסו שוב מחר'
                : 'לא הצלחנו לבדוק את הקוד. בדקו את החיבור ונסו שוב' };
        });
    });
}

function openCodeModal() {
    const m = document.getElementById('code-modal');
    m.classList.add('open');
    document.getElementById('code-msg').textContent = '';
    const inp = document.getElementById('code-input');
    inp.value = '';
    setTimeout(() => inp.focus(), 60);
}
function closeCodeModal() { document.getElementById('code-modal').classList.remove('open'); }
let codeBusy = false;
function submitCode() {
    if (codeBusy) return;
    const msg = document.getElementById('code-msg');
    const res = redeemCode(document.getElementById('code-input').value);
    if (res && typeof res.then === 'function') {
        codeBusy = true;
        msg.style.color = '#b9a38e'; msg.textContent = 'בודק את הקוד...';
        res.then(showCodeResult).finally(() => { codeBusy = false; });
    } else showCodeResult(res);
}
function showCodeResult(r) {
    const msg = document.getElementById('code-msg');
    msg.style.color = r.ok ? '#4ad66d' : '#ff6a5c';
    msg.textContent = r.msg;
    if (r.ok) {
        if (r.wipe) { sfx.bomb(); haptic([40, 30, 60]); } else { sfx.buy(); confettiBurst(30); }
        renderShop();
        document.getElementById('code-input').value = '';
    }
    else sfx.err();
}
document.getElementById('code-input').addEventListener('keydown', e => { if (e.key === 'Enter') submitCode(); });
document.getElementById('code-modal').addEventListener('click', e => { if (e.target.id === 'code-modal') closeCodeModal(); });

renderCoinBadges();
renderDaily();
syncLeaderboardSkin(4000);
setTimeout(retryPendingScores, 5000);              // שיאים שלא נשמרו בפעם הקודמת (אין חיבור / מכסה)

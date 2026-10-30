/* ============================================================
   חברתי: כרטיס שיתוף ואתגר לחבר, התקנת האפליקציה, וחברי קבב
   הכול נשמר במכשיר (וגם בחשבון) - בלי שינויים בכללים של Firebase.
   ציוני החברים נקראים מהרשומות שלהם בטבלאות הקיימות.
   ============================================================ */
const SOCIAL_URL = location.protocol.indexOf('http') === 0
    ? location.origin + location.pathname.replace(/index\.html$/, '')
    : 'https://evyatars-kebabs.github.io/evyatars-kebabs/';
const SOC_START = { delivery: () => startDeliveryGame(), ninja: () => startNinjaGame(), shvartz: () => startShvartzGame(),
                    goods: () => startGoodsSortGame(), kvk: () => startKvkGame(), catch: () => startCatchGame(), trivia: () => startTriviaGame() };
const socGame = k => (typeof MST_GAMES !== 'undefined' && MST_GAMES.find(g => g.k === k)) || null;
const socId = id => typeof id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(id);
const socName = n => {
    n = String(n || '').trim().slice(0, 20);
    if (!n || (typeof isRudeName === 'function' && isRudeName(n))) return 'חבר';
    return n;
};
function socJson(key, fallback) { try { const v = JSON.parse(store.get(key) || 'null'); return v === null ? fallback : v; } catch (e) { return fallback; } }

/* ---------- כרטיס שיתוף ואתגר אחרי משחק ---------- */
const CH_KEY = 'kebab_challenge';            // אתגר שהתקבל בקישור: { k, s, n, f, t, done }
const GAMES_KEY = 'kebab_games_count';
let socLast = null;                          // המשחק האחרון: { k, score, best }

// נקרא מ-showResultReward
function socialOnGame(k, score) {
    store.set(GAMES_KEY, (parseInt(store.get(GAMES_KEY)) || 0) + 1);
    const old = document.getElementById('soc-result');
    if (old) old.remove();
    if (!socGame(k) || !(score > 0)) return;
    const nb = window.__newBest;
    const best = !!(nb && typeof XP_GAME_BEST !== 'undefined' && nb.key === XP_GAME_BEST[k] && Date.now() - nb.t < 5000);
    socLast = { k, score, best };
    const box = xpEl('div', 'soc-result'); box.id = 'soc-result';
    // אתגר שקיבלנו מחבר במשחק הזה
    const ch = socChallenge();
    let beat = null;
    if (ch && ch.k === k && !ch.done) {
        const line = xpEl('div', 'soc-ch-res');
        if (score > ch.s) {
            beat = ch;
            line.classList.add('won');
            line.textContent = '🏆 ניצחתם את ' + ch.n + '! (' + score + ' מול ' + ch.s + ')';
            ch.done = true; store.set(CH_KEY, JSON.stringify(ch));
            setTimeout(() => { if (typeof confettiBurst === 'function') confettiBurst(60); sfx.win(); }, 600);
        } else line.textContent = '⚔️ עוד ' + (ch.s - score + 1) + ' נקודות כדי לנצח את ' + ch.n;
        box.appendChild(line);
    }
    const btn = xpEl('button', 'soc-share-btn' + (best || beat ? ' hot' : ''),
        beat ? '📤 שלחו ל' + beat.n + ' אתגר בחזרה' : best ? '📤 שיא חדש! שתפו ואתגרו חבר' : '📤 שתפו ואתגרו חבר');
    btn.onclick = () => socShare(btn);
    box.appendChild(btn);
    const anchor = document.getElementById('mst-result') || document.getElementById('xp-result') || document.getElementById('result-desc');
    if (anchor) anchor.after(box);
}

// המקום בטבלה (אם הטבלה כבר נטענה)
function socRank(k) {
    const g = socGame(k);
    const lb = g && g.col && typeof lbCache !== 'undefined' && lbCache[g.col];
    const row = lb && lb.rows.find(r => r.id === playerId);
    return row && row.rank ? row.rank : null;
}
function socChallengeLink(k, score) {
    return SOCIAL_URL + '?ch=' + k + '&s=' + score + '&n=' + encodeURIComponent(playerName) + '&f=' + encodeURIComponent(playerId);
}

// מצייר את כרטיס השיתוף: הסקין, השם, הרמה, המשחק, הניקוד והמקום בטבלה
function socCard(s) {
    const W = 720, H = 960, cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const c = cv.getContext('2d');
    const g = socGame(s.k), x = typeof xpPublic === 'function' ? xpPublic() : {};
    const bg = c.createRadialGradient(W / 2, 330, 40, W / 2, 420, 700);
    bg.addColorStop(0, '#6a2a0c'); bg.addColorStop(0.55, '#2a1008'); bg.addColorStop(1, '#0c0503');
    c.fillStyle = bg; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = 0.08; c.translate(W / 2, 330);                     // קרני אור
    for (let i = 0; i < 24; i++) { c.rotate(Math.PI / 12); c.fillStyle = i % 2 ? '#ffd23d' : '#ff8a1a'; c.beginPath(); c.moveTo(0, 0); c.lineTo(-40, -700); c.lineTo(40, -700); c.fill(); }
    c.restore();
    c.strokeStyle = '#ffb020'; c.lineWidth = 8; c.strokeRect(14, 14, W - 28, H - 28);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.direction = 'rtl';
    const text = (t, y, size, color, font, glow) => {
        c.font = size + 'px ' + (font || '"Secular One", Rubik, sans-serif');
        c.shadowColor = glow || 'transparent'; c.shadowBlur = glow ? 24 : 0;
        c.fillStyle = color; c.fillText(t, W / 2, y); c.shadowBlur = 0;
    };
    text('הקבביה של אביתר', 74, 54, '#ffd23d', null, 'rgba(255,140,30,0.8)');
    // הסקין בעיגול
    const sk = typeof skinById === 'function' ? skinById(typeof currentSkinId === 'function' ? currentSkinId() : 'classic') : null;
    c.save(); c.beginPath(); c.arc(W / 2, 280, 150, 0, Math.PI * 2); c.closePath();
    c.shadowColor = 'rgba(255,170,40,0.9)'; c.shadowBlur = 40; c.fillStyle = '#2a160c'; c.fill(); c.shadowBlur = 0; c.clip();
    if (sk && typeof getPreview === 'function') { try { c.drawImage(getPreview(sk), 0, 0, 360, 400, W / 2 - 170, 120, 340, 378); } catch (e) { /* ignore */ } }
    c.restore();
    c.lineWidth = 8; c.strokeStyle = '#ffd23d'; c.beginPath(); c.arc(W / 2, 280, 150, 0, Math.PI * 2); c.stroke();
    text(playerName, 476, 50, '#ffffff');
    if (x.lvl) text('רמה ' + x.lvl + (x.title ? ' · ' + x.title : ''), 530, 30, '#ffe27a', 'Rubik, sans-serif');
    text(g.icon + ' ' + g.name, 600, 38, '#f0dcc8', 'Rubik, sans-serif');
    text(String(s.score), 700, 130, '#ffd23d', null, 'rgba(255,200,40,0.9)');
    text('נקודות', 782, 32, '#f0dcc8', 'Rubik, sans-serif');
    const rank = socRank(s.k);
    const tag = s.best ? '🏆 שיא אישי חדש!' + (rank ? '  ·  מקום #' + rank : '') : rank ? '🏅 מקום #' + rank + ' בטבלה' : '';
    if (tag) text(tag, 834, 30, '#7ee787', 'Rubik, sans-serif');
    text('תצליחו לנצח אותי? 👇', 900, 34, '#ffffff', 'Rubik, sans-serif');
    return cv;
}

let socSharing = false;
function socShare(btn, text) {
    if (socSharing) return;
    const s = socLast;
    if (!s && !text) return;
    socSharing = true;
    if (btn) btn.classList.add('busy');
    const done = () => { socSharing = false; if (btn) btn.classList.remove('busy'); };
    const g = s && socGame(s.k);
    text = text || ('🔥 עשיתי ' + s.score + ' נקודות ב' + g.name + ' בהקבביה של אביתר! תצליחו לנצח אותי? 👇\n' + socChallengeLink(s.k, s.score));
    const wa = () => { window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank'); };
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const file = !s || !text.includes('?ch=') ? Promise.resolve(null) : fonts.then(() => new Promise(res => {
        try { socCard(s).toBlob(b => res(b ? new File([b], 'kebab-score.png', { type: 'image/png' }) : null), 'image/png'); } catch (e) { res(null); }
    }));
    file.then(f => {
        if (f && navigator.canShare && navigator.canShare({ files: [f] })) return navigator.share({ files: [f], text });
        if (navigator.share) return navigator.share({ text });
        wa();
    }).catch(e => { if (!e || e.name !== 'AbortError') wa(); }).then(done, done);
}

/* ---------- אתגר שהתקבל בקישור ---------- */
function socChallenge() {
    const ch = socJson(CH_KEY, null);
    if (!ch || !socGame(ch.k) || !(ch.s > 0)) return null;
    if (Date.now() - (ch.t || 0) > 7 * 86400000) return null;                    // אתגר תקף לשבוע
    return ch;
}
// קישורים: ?ch=משחק&s=ניקוד&n=שם&f=מזהה (אתגר) או ?addfriend=מזהה&n=שם (חברות)
function socReadLink() {
    const q = new URLSearchParams(location.search);
    if (!q.has('ch') && !q.has('addfriend')) return;
    const n = socName(q.get('n'));
    if (q.has('ch')) {
        const k = q.get('ch'), s = parseInt(q.get('s'), 10), f = q.get('f');
        if (socGame(k) && s > 0 && s < 10000000 && f !== playerId) {
            store.set(CH_KEY, JSON.stringify({ k, s, n, f: socId(f) ? f : '', t: Date.now(), done: false }));
            setTimeout(() => switchTab('home'), 0);                              // ישר למסך הבית, שם מחכה האתגר
        }
    }
    const fid = q.get('addfriend');
    if (socId(fid) && fid !== playerId) setTimeout(() => { if (addFriend(fid, n)) showToast('👫 ' + n + ' נוסף/ה לחברי הקבב שלכם!', true); }, 1500);
    try { history.replaceState(null, '', location.pathname); } catch (e) { /* ignore */ }
}

/* ---------- התקנת האפליקציה ---------- */
const INST_KEY = 'kebab_install';            // { dismissed: זמן, done }
let socInstallEvt = null;
const socStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const socIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); socInstallEvt = e; socRenderHome(); });
window.addEventListener('appinstalled', () => {
    socInstallEvt = null;
    store.set(INST_KEY, JSON.stringify({ done: true }));
    socRenderHome();
    showToast('📲 הקבביה הותקנה! תמצאו אותה במסך הבית', true);
});
function socCanInstall() { return !socStandalone() && (!!socInstallEvt || socIOS); }
function socInstall() {
    if (socInstallEvt) {
        const e = socInstallEvt;
        socInstallEvt = null;
        e.prompt();
        (e.userChoice || Promise.resolve({})).then(r => { if (r && r.outcome !== 'accepted') socInstallEvt = null; socRenderHome(); });
        return;
    }
    socInstallHelp();
}
// הוראות לאייפון (ולדפדפנים בלי כפתור התקנה)
function socInstallHelp() {
    if (document.getElementById('soc-help')) return;
    const ov = xpEl('div', 'xp-levelup soc-help'); ov.id = 'soc-help';
    const card = xpEl('div', 'xp-lu-card soc-help-card');
    card.appendChild(xpEl('div', 'xp-lu-label', '📲 התקנת הקבביה'));
    const steps = socIOS
        ? ['1. לחצו על כפתור השיתוף ⬆️ בתחתית ספארי', '2. גללו ובחרו "הוספה למסך הבית" ➕', '3. לחצו "הוסף" - וזהו!']
        : ['1. פתחו את התפריט של הדפדפן (⋮ או ☰)', '2. בחרו "התקנת אפליקציה" או "הוספה למסך הבית"', '3. אשרו - והקבביה תופיע במסך הבית'];
    const list = xpEl('div', 'soc-steps');
    steps.forEach(s => list.appendChild(xpEl('div', 'xp-lu-item', s)));
    card.appendChild(list);
    const btn = xpEl('button', 'xp-lu-btn ready', 'הבנתי');
    const close = () => { ov.classList.remove('open'); setTimeout(() => ov.remove(), 300); };
    btn.onclick = close;
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    card.appendChild(btn);
    ov.appendChild(card);
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('open'));
}

/* ---------- במסך הבית: אתגר מחבר והצעה להתקין ---------- */
function socRenderHome() {
    const home = document.getElementById('screen-home');
    if (!home) return;
    const anchor = document.getElementById('xp-card');
    // אתגר
    let chEl = document.getElementById('soc-ch');
    const ch = socChallenge();
    if (!ch || ch.done) { if (chEl) chEl.remove(); }
    else {
        if (!chEl) { chEl = xpEl('div', 'soc-ch'); chEl.id = 'soc-ch'; }
        const g = socGame(ch.k);
        chEl.innerHTML = '';
        const x = xpEl('button', 'soc-x', '✕');
        x.onclick = () => { ch.done = true; store.set(CH_KEY, JSON.stringify(ch)); socRenderHome(); };
        chEl.appendChild(x);
        chEl.appendChild(xpEl('div', 'soc-ch-h', '⚔️ ' + ch.n + ' מאתגר/ת אתכם!'));
        chEl.appendChild(xpEl('div', 'soc-ch-sub', g.icon + ' ' + g.name + ': נצחו ' + ch.s + ' נקודות'));
        const row = xpEl('div', 'soc-ch-btns');
        const play = xpEl('button', 'soc-ch-play', '🎮 קבלו את האתגר');
        play.onclick = () => { sfx.tap(); SOC_START[ch.k](); };
        row.appendChild(play);
        if (ch.f && !isFriend(ch.f)) {
            const add = xpEl('button', 'soc-ch-add', '➕ לחברים');
            add.onclick = () => { addFriend(ch.f, ch.n); showToast('👫 ' + ch.n + ' נוסף/ה לחברי הקבב!', true); socRenderHome(); };
            row.appendChild(add);
        }
        chEl.appendChild(row);
        if (anchor) anchor.after(chEl); else home.prepend(chEl);
    }
    // התקנה: אחרי 3 משחקים, ואם לא סגרו את ההצעה ב-3 הימים האחרונים
    let inEl = document.getElementById('soc-install');
    const inst = socJson(INST_KEY, {});
    const show = socCanInstall() && !inst.done && (parseInt(store.get(GAMES_KEY)) || 0) >= 3 && !(inst.dismissed && Date.now() - inst.dismissed < 3 * 86400000);
    if (!show) { if (inEl) inEl.remove(); return; }
    if (!inEl) { inEl = xpEl('div', 'soc-install'); inEl.id = 'soc-install'; }
    inEl.innerHTML = '';
    inEl.appendChild(xpEl('div', 'soc-in-ic', '📲'));
    const mid = xpEl('div', 'soc-in-mid');
    mid.appendChild(xpEl('b', '', 'התקינו את הקבביה'));
    mid.appendChild(xpEl('small', '', 'נפתחת כמו אפליקציה ממסך הבית - מהר יותר ובלי שורת כתובת'));
    inEl.appendChild(mid);
    const b = xpEl('button', 'soc-in-btn', 'התקנה');
    b.onclick = () => { sfx.tap(); socInstall(); };
    inEl.appendChild(b);
    const x = xpEl('button', 'soc-x', '✕');
    x.onclick = () => { store.set(INST_KEY, JSON.stringify({ dismissed: Date.now() })); socRenderHome(); };
    inEl.appendChild(x);
    const after = document.getElementById('soc-ch') || anchor;
    if (after) after.after(inEl); else home.prepend(inEl);
}

/* ---------- חברי קבב ---------- */
const FR_KEY = 'kebab_friends';              // [{ id, name }] - נשמר גם בחשבון
const FR_MAX = 60;
function friends() { const a = socJson(FR_KEY, []); return Array.isArray(a) ? a.filter(f => f && socId(f.id)).slice(0, FR_MAX) : []; }
function isFriend(id) { return friends().some(f => f.id === id); }
function addFriend(id, name) {
    if (!socId(id) || id === playerId || isFriend(id)) return false;
    const list = friends();
    if (list.length >= FR_MAX) { showToast('אפשר עד ' + FR_MAX + ' חברים'); return false; }
    list.push({ id, name: socName(name) });
    store.set(FR_KEY, JSON.stringify(list));
    return true;
}
function removeFriend(id) { store.set(FR_KEY, JSON.stringify(friends().filter(f => f.id !== id))); }
// כפתור בכרטיס השחקן
function friendButton(p) {
    const b = xpEl('button', 'fr-btn');
    const draw = () => { const on = isFriend(p.id); b.classList.toggle('on', on); b.textContent = on ? '✓ חבר/ה שלכם · הסרה' : '➕ הוספה לחברי הקבב'; };
    b.onclick = () => {
        if (isFriend(p.id)) removeFriend(p.id);
        else if (addFriend(p.id, p.name)) { sfx.coin(); showToast('👫 ' + socName(p.name) + ' נוסף/ה לחברי הקבב!', true); }
        draw();
        if (friendsBoardOn()) refreshFriendsBoard();
    };
    draw();
    return b;
}
function socFriendLink() { return SOCIAL_URL + '?addfriend=' + encodeURIComponent(playerId) + '&n=' + encodeURIComponent(playerName); }
function shareFriendLink(btn) {
    socShare(btn, '👫 בואו נהיה חברי קבב בהקבביה של אביתר! לחצו על הקישור ונראה מי מנצח 👇\n' + socFriendLink());
}

// טבלת החברים: אותן לשוניות משחקים, רק החברים ואתם
const LB_TYPE_COL = { delivery: 'leaderboard_delivery', goods: 'leaderboard_goods', shvartz: 'leaderboard_shvartz', ninja: 'leaderboard_ninja',
                      kvk: 'leaderboard_kvk', main: 'leaderboard', turtles: 'leaderboard_turtles' };
let lbFriendsMode = false, lbFriendsType = 'shvartz';
const frDocCache = {};
function friendsBoardOn() { return lbFriendsMode; }
function socLbInit() {
    const tabs = document.querySelector('#screen-leaderboard .sub-tabs');
    if (!tabs || document.getElementById('lb-mode')) return;
    const mode = xpEl('div', 'lb-mode'); mode.id = 'lb-mode';
    const all = xpEl('button', 'lb-mode-btn on', '🌍 כולם');
    const fr = xpEl('button', 'lb-mode-btn', '👫 חברים');
    all.onclick = () => setFriendsMode(false);
    fr.onclick = () => setFriendsMode(true);
    mode.appendChild(all); mode.appendChild(fr);
    tabs.before(mode);
    const sub = xpEl('div', 'leaderboard-sub-screen'); sub.id = 'sub-screen-friends'; sub.style.display = 'none';
    const ul = xpEl('ul', 'leaderboard-list'); ul.id = 'friends-lb';
    sub.appendChild(ul);
    tabs.after(sub);
}
// מצב חברים בלי לטעון מחדש (switchTab קורא לזה לפני שהמסך נפתח)
function setFriendsModeQuiet(on) {
    lbFriendsMode = on;
    const btns = document.querySelectorAll('#lb-mode .lb-mode-btn');
    if (btns.length) { btns[0].classList.toggle('on', !on); btns[1].classList.toggle('on', on); }
    const search = document.getElementById('lb-search');
    if (search) search.style.display = on ? 'none' : '';
    const sub = document.getElementById('sub-screen-friends');
    if (!on && sub) sub.style.display = 'none';
}
function setFriendsMode(on) {
    setFriendsModeQuiet(on);
    sfx.tap();
    // הכפתור הדולק בסרגל: חברים או שיאים
    const bf = document.getElementById('btn-friends'), bl = document.getElementById('btn-leaderboard');
    if (bf) bf.classList.toggle('active', on);
    if (bl) bl.classList.toggle('active', !on);
    const active = document.querySelector('#screen-leaderboard .sub-tab-btn.active');
    switchLeaderboardTab(active ? active.id.replace('sub-btn-', '') : 'shvartz');
}
function refreshFriendsBoard() { renderFriendsBoard(lbFriendsType); }
function frDoc(col, id) {
    const key = col + '|' + id, c = frDocCache[key];
    if (c && Date.now() - c.t < 180000) return Promise.resolve(c.d);
    if (!db) return Promise.resolve(undefined);
    return db.collection(col).doc(id).get({ source: 'server' })
        .then(doc => { const d = doc.exists ? doc.data() : null; frDocCache[key] = { t: Date.now(), d }; return d; })
        .catch(() => undefined);
}
function renderFriendsBoard(type) {
    lbFriendsType = type;
    document.querySelectorAll('#screen-leaderboard .leaderboard-sub-screen').forEach(s => { s.style.display = 'none'; });
    const sub = document.getElementById('sub-screen-friends'), ul = document.getElementById('friends-lb');
    if (!sub || !ul) return;
    sub.style.display = 'block';
    ul.innerHTML = '';
    const list = friends();
    const invite = xpEl('button', 'fr-invite', '🔗 שלחו לחברים קישור חברות');
    invite.onclick = () => shareFriendLink(invite);
    if (!list.length) {
        const e = xpEl('li', 'fr-empty');
        e.appendChild(xpEl('div', 'fr-empty-ic', '👫'));
        e.appendChild(xpEl('b', '', 'עוד אין לכם חברי קבב'));
        e.appendChild(xpEl('p', '', 'שלחו לחברים את הקישור שלכם, או לחצו על שחקן בטבלת "כולם" ובחרו "➕ הוספה לחברי הקבב".'));
        e.appendChild(invite);
        ul.appendChild(e);
        return;
    }
    const wait = xpEl('li', 'fr-empty', 'טוען את החברים...');
    ul.appendChild(wait);
    const col = LB_TYPE_COL[type];
    const myBest = parseInt(store.get(typeof LB_LOCAL_KEY !== 'undefined' ? LB_LOCAL_KEY[col] : '')) || 0;
    Promise.all(list.map(f => frDoc(col, f.id).then(d => ({ f, d })))).then(res => {
        if (lbFriendsType !== type || !lbFriendsMode) return;
        let offline = 0, renamed = false;
        const rows = res.map(({ f, d }) => {
            if (d === undefined) offline++;
            const name = d && typeof d.name === 'string' ? socName(d.name) : f.name;
            if (name !== f.name) { f.name = name; renamed = true; }
            return { id: f.id, name, score: d && typeof d.score === 'number' ? d.score : 0, skin: d && typeof d.skin === 'string' ? d.skin : 'classic',
                     lvl: d && Number.isInteger(d.lvl) ? d.lvl : null, title: d && xpTitleOk(d.title) ? d.title : null,
                     frame: d && xpFrameOk(d.frame) ? d.frame : '', mst: d && typeof mstOk === 'function' && mstOk(d.mst) ? d.mst : null };
        });
        if (renamed) store.set(FR_KEY, JSON.stringify(list));
        const me = Object.assign({ id: playerId, name: playerName, score: myBest, skin: currentSkinId(), me: true },
                                 typeof xpPublic === 'function' ? xpPublic() : {}, { mst: typeof mstPublic === 'function' ? mstPublic() : null });
        rows.push(me);
        rows.sort((a, b) => b.score - a.score);
        ul.innerHTML = '';
        if (offline === list.length) ul.appendChild(xpEl('li', 'fr-empty', 'אין חיבור לשרת כרגע - נסו שוב בעוד רגע'));
        const mstIdx = typeof MST_GAMES !== 'undefined' ? MST_GAMES.findIndex(g => g.col === col) : -1;
        let rank = 0, prev = null;
        rows.forEach((r, i) => {
            if (r.score !== prev) { rank = i + 1; prev = r.score; }
            const li = xpEl('li', 'leaderboard-item fr-row' + (r.me ? ' me' : '') + (r.score > 0 && rank <= 3 ? ' r' + rank : ''));
            const left = xpEl('span');
            left.appendChild(xpEl('strong', '', r.score > 0 ? (rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : '#' + rank) : '—'));
            const src = lbAvatar(r.skin);
            if (src) {
                const wrap = xpEl('span', 'lb-av' + (r.frame ? ' fr-' + r.frame : ''));
                const img = document.createElement('img'); img.className = 'lb-skin'; img.src = src; img.alt = '';
                wrap.appendChild(img);
                if (typeof xpOrbit === 'function') xpOrbit(wrap, r.frame, r.lvl || 0, 30);
                if (r.lvl) wrap.appendChild(xpEl('span', 'lb-lvl', String(r.lvl)));
                left.appendChild(wrap);
            }
            left.appendChild(document.createTextNode(' ' + r.name + (r.me ? ' (אתה)' : '')));
            const mr = mstIdx >= 0 && r.mst ? +r.mst[mstIdx] : 0;
            if (mr) { const b = mstBadge(mr, 18); b.classList.add('lb-mst'); left.appendChild(b); }
            const right = xpEl('span', 'fr-score', r.score > 0 ? r.score + " נק'" : 'עוד לא שיחק');
            li.appendChild(left); li.appendChild(right);
            li.onclick = () => openPlayerModal({ id: r.id, name: r.name, skin: r.me ? currentSkinId() : r.skin, lvl: r.lvl, title: r.title, frame: r.frame, mst: r.mst, known: null });
            ul.appendChild(li);
        });
        const foot = xpEl('li', 'fr-foot');
        foot.appendChild(xpEl('small', '', list.length + ' חברים · לחצו על חבר כדי לראות את הכרטיס שלו'));
        foot.appendChild(invite);
        ul.appendChild(foot);
    });
}

/* ---------- התחלה ---------- */
socReadLink();
socLbInit();
socRenderHome();

/* ============================================================
   משחק: קוף קופץ (Monkey Hop) - מהריפו platformer.
   משחק עצמאי בקובץ אחד (games/monkey-hop/index.html) עם שלבים, מטבעות וחנות סקינים משלו,
   ולכן רץ בתוך iframe - כך השמות הגלובליים שלו לא מתנגשים בשלנו.
   ============================================================ */
function startMonkeyGame() {
    switchTab('monkey');                   // עוצר כל משחק אחר ומסתיר את סרגל הניווט
    const f = document.getElementById('mh-frame');
    f.src = 'games/monkey-hop/index.html';
    setTimeout(() => { try { f.focus(); } catch (e) { /* ignore */ } }, 300);     // מקשי החצים עובדים מיד
}
// ביציאה מהמשחק: פורקים את ה-iframe, כך שגם המוזיקה שלו נעצרת
function mhStop() {
    const f = document.getElementById('mh-frame');
    if (f && f.getAttribute('src') && f.getAttribute('src') !== 'about:blank') f.src = 'about:blank';
}

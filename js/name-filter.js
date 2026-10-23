/* ---------- סינון מילים גסות בשמות ---------- */
// בודקים גם כשמנסים לעקוף: רווחים בין אותיות, ניקוד, אותיות סופיות, אותיות כפולות ומספרים במקום אותיות.
// "סקסי" ו-"sexy" מותרים בכוונה.

// מילים שאסורות גם כחלק ממילה ארוכה יותר
const NF_PARTS = [
    'שרמוט', 'זונה', 'מזדיי', 'מניאק', 'קוקסינל', 'ערבוש', 'כוסאמ', 'כוסעמ', 'כוסאוחת', 'כוסית', 'בולבול', 'דילדו', 'פורנו',
    'היטלר', 'נאצי',
    'fuck', 'fuk', 'fck', 'bullshit', 'shithead', 'bitch', 'cunt', 'pussy', 'whore', 'slut', 'nigg', 'fagg', 'porn', 'penis', 'vagina',
    'dildo', 'asshole', 'motherf', 'hitler', 'nazi', 'sharmut', 'manyak', 'kusem', 'kusoh'
];
// מילים שאסורות רק כמילה שלמה (כדי לא לחסום מילים תמימות שמכילות אותן)
const NF_WORDS = [
    'זין', 'זיון', 'זיונים', 'לזיין', 'כוס', 'חרא', 'זבי', 'זובי', 'מפגר', 'מפגרת', 'כושי', 'כושים',
    'dick', 'cock', 'ass', 'tits', 'shit', 'shity', 'shits', 'fag', 'kus', 'zona', 'zain', 'zayin', 'zubi'
];

const NF_FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
const NF_LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i' };

// אותיות בלבד, בלי ניקוד, אותיות סופיות רגילות, ובלי אות שחוזרת ברצף
function nfLetters(s, leet) {
    let out = '';
    for (const ch of String(s).toLowerCase().replace(/[֑-ׇ]/g, '')) {
        let c = NF_FINALS[ch] || ch;
        if (leet && NF_LEET[c]) c = NF_LEET[c];
        out += /\p{L}/u.test(c) ? c : ' ';
    }
    return out.replace(/(\p{L})\1+/gu, '$1');
}
const nfNorm = w => nfLetters(w, false).replace(/\s+/g, '');
const NF_PARTS_N = NF_PARTS.map(nfNorm);
const NF_WORDS_N = new Set(NF_WORDS.map(nfNorm));
const NF_PREFIX = /^[והשלבמכ]{1,2}/;      // ו/ה/ש/ל/ב/מ/כ בתחילת מילה בעברית

function isRudeName(name) {
    if (!name) return false;
    for (const leet of [false, true]) {
        const spaced = nfLetters(name, leet);
        const joined = spaced.replace(/\s+/g, '');
        if (NF_PARTS_N.some(p => joined.includes(p))) return true;
        if (NF_WORDS_N.has(joined)) return true;                       // גם כשהאותיות מופרדות ברווחים
        for (const tok of spaced.split(/\s+/)) {
            if (!tok) continue;
            if (NF_WORDS_N.has(tok)) return true;
            const bare = tok.replace(NF_PREFIX, '');
            if (bare !== tok && bare.length >= 3 && NF_WORDS_N.has(bare)) return true;
        }
    }
    return false;
}
// שם שמוצג לאחרים (טבלאות) - שם גס מוחלף
function safeName(name) { return isRudeName(name) ? 'שחקן' : name; }

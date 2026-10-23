/* ============================================================
   קטלוג הסקינים של שוורץ - 60 דמויות אנושיות
   rarity: 0 נפוץ | 1 לא נפוץ | 2 נדיר | 3 אפי | 4 אגדי | 5 מיתי | 6 מהדורה מיוחדת (קוד בלבד)
   ============================================================ */
const SK_RARITY = [
    { name: 'נפוץ',    price: 50,   color: '#9aa4b2' },
    { name: 'לא נפוץ', price: 120,  color: '#4ac26b' },
    { name: 'נדיר',    price: 300,  color: '#3b9cff' },
    { name: 'אפי',     price: 600,  color: '#b66bff' },
    { name: 'אגדי',    price: 1200, color: '#ff9f1c' },
    { name: 'מיתי',    price: 2500, color: '#ff4d6d' },
    { name: 'מהדורה מיוחדת', price: 0, color: '#ff5ec4', codeOnly: true }
];

const SV_SKINS = [
    { id: 'classic', name: 'שוורץ הקלאסי', kind: 'cone', rarity: -1, price: 0 },

    /* ---------- נפוץ ---------- */
    { id: 'danny', name: 'דניאל', rarity: 0, tone: '#f0c08f', hair: { style: 'short', color: '#4a2e18' },
      outfit: { base: '#3b6fd4', collar: 'crew' } },
    { id: 'noa', name: 'נועה', rarity: 0, tone: '#e0a977', hair: { style: 'ponytail', color: '#2a1a12' }, lips: '#d9566f',
      outfit: { base: '#e86a9a', collar: 'crew' } },
    { id: 'yosi', name: 'סבא יוסי', rarity: 0, tone: '#f3d2b0', hair: { style: 'sidebald', color: '#e8e8ee' }, brow: '#cfcfd6',
      glasses: { type: 'round', color: '#5a4630' }, beard: { style: 'mustache', color: '#e8e8ee' },
      outfit: { base: '#f3f3f6', cardigan: '#4f7a4a', collar: 'v', inner: '#f3f3f6' } },
    { id: 'roei', name: 'רועי', rarity: 0, tone: '#f1c8a0', hair: { style: 'short', color: '#a8641e' }, face: ['freckles'],
      hat: { type: 'cap', c1: '#d6291f' }, outfit: { base: '#f2c230', collar: 'crew' } },
    { id: 'michal', name: 'מיכל', rarity: 0, tone: '#c68642', hair: { style: 'curly', color: '#1f130c' }, lips: '#a8434f',
      outfit: { base: '#f08a2a', collar: 'hood' } },
    { id: 'avi', name: 'אבי', rarity: 0, tone: '#8d5524', hair: { style: 'buzz', color: '#14110f' }, lips: '#7a3a32',
      beard: { style: 'stubble', color: '#14110f' }, outfit: { base: '#7d8590', collar: 'crew' } },
    { id: 'yuval', name: 'יובל', rarity: 0, tone: '#f6d3b8', hair: { style: 'long', color: '#1b1f3a' }, lips: '#d9566f',
      outfit: { base: '#2ea043', collar: 'crew' } },

    /* ---------- לא נפוץ ---------- */
    { id: 'chef', name: 'השף', rarity: 1, tone: '#e8b88a', hair: { style: 'sidebald', color: '#3a2412' },
      beard: { style: 'mustache', color: '#3a2412' }, hat: { type: 'chef' },
      outfit: { base: '#f4f4f7', apron: true, collar: 'bandana', bandana: '#c42b2b' } },
    { id: 'farmer', name: 'האיכר', rarity: 1, tone: '#d9a066', hair: { style: 'short', color: '#d8b24a' },
      beard: { style: 'stubble', color: '#8a6a2a' }, hat: { type: 'straw', c1: '#c42b2b' },
      outfit: { base: '#c24a3a', pattern: 'plaid', trim: '#7a1f18', overall: '#3f6fb0', collar: 'crew' } },
    { id: 'fire', name: 'הכבאי', rarity: 1, tone: '#c68642', hair: { style: 'buzz', color: '#14110f' }, face: ['soot'],
      hat: { type: 'fire' }, lips: '#8a4038',
      outfit: { base: '#e4b521', pattern: 'vest', under: '#3a3d46', collar: 'high' } },
    { id: 'builder', name: 'הבנאי', rarity: 1, tone: '#f0c08f', hair: { style: 'short', color: '#5a3a1a' },
      beard: { style: 'mustache', color: '#5a3a1a' }, hat: { type: 'hardhat' },
      outfit: { base: '#ff7a1a', pattern: 'vest', under: '#6b7280', collar: 'crew' } },
    { id: 'cowboy', name: 'הקאובוי', rarity: 1, tone: '#d9a066', hair: { style: 'short', color: '#4a2e18' },
      beard: { style: 'stubble', color: '#3a2412' }, hat: { type: 'cowboy' },
      outfit: { base: '#b5432b', pattern: 'plaid', trim: '#6a1d12', collar: 'bandana', bandana: '#2a6fd0' } },
    { id: 'police', name: 'השוטר', rarity: 1, tone: '#8d5524', hair: { style: 'buzz', color: '#14110f' }, lips: '#7a3a32',
      beard: { style: 'mustache', color: '#14110f' }, hat: { type: 'police' },
      outfit: { base: '#3b5ca8', badge: '#d9b25a', collar: 'tie', tie: '#14182e' } },
    { id: 'pilot', name: 'הטייס', rarity: 1, tone: '#f0c08f', hair: { style: 'short', color: '#3a2a1a' },
      glasses: { type: 'aviator', color: '#d9b25a' }, hat: { type: 'pilot' },
      outfit: { base: '#f4f4f8', collar: 'tie', tie: '#1d2a52', badge: '#d9b25a' } },
    { id: 'bubacola', name: 'בובה בולה', rarity: 1, brow: '#5a0a0a', lips: '#7a0a10', eyes: { iris: '#3a1a10' }, blush: false,
      bottle: { label: '#d8161e', labelDark: '#7a0a0e', ribbon: '#ffffff', text: 'בובה בולה', textColor: '#ffffff', cap: '#d8161e' }, drawBack: skBottleBack },
    { id: 'rolazero', name: 'רולה זירו', rarity: 1, brow: '#000000', lips: '#d8161e', eyes: { iris: '#2a2a2a' }, blush: false,
      bottle: { label: '#1a1a1e', labelDark: '#050506', ribbon: '#d8161e', text: 'רולה זירו', textColor: '#d8161e', sub: 'אפס סוכר', cap: '#1a1a1e' }, drawBack: skBottleBack },
    { id: 'albanta', name: 'אל-באנטה', rarity: 1, brow: '#7a2a04', lips: '#1f4fb4', eyes: { iris: '#3a1a06' }, blush: false,
      bottle: { label: '#1f4fb4', labelDark: '#0f2a6a', ribbon: '#3fa33a', text: 'אל-באנטה', textColor: '#ff8a1a', sub: 'בטעם תפוז', cap: '#ff7a00',
                liquid: ['#a8400a', '#f07a10', '#ff9a2a', '#8a3004'] }, drawBack: skBottleBack },

    /* ---------- נדיר ---------- */
    { id: 'pirate', name: 'הפיראט', rarity: 2, tone: '#d9a066', hair: { style: 'long', color: '#1a1410' }, eyepatch: 'left', earring: true,
      beard: { style: 'full', color: '#1a1410' }, hat: { type: 'tricorn' }, lips: '#8a4038',
      outfit: { base: '#f1f1f5', pattern: 'stripes', trim: '#1d2a52', jacket: '#4a2a18', collar: 'crew' } },
    { id: 'ninja', name: 'הנינג\'ה', rarity: 2, tone: '#e8b88a', hat: { type: 'ninja' }, brow: '#14110f',
      outfit: { base: '#1b1c22', pattern: 'none', straps: '#c42b2b', sash: '#c42b2b', collar: 'high' } },
    { id: 'viking', name: 'הוויקינג', rarity: 2, tone: '#f3d2b0', hair: { style: 'long', color: '#c8641e' }, brow: '#a8501a',
      beard: { style: 'braids', color: '#c8641e' }, hat: { type: 'viking' }, face: ['warpaint'],
      outfit: { base: '#6b4a2c', fur: true, collar: 'none' } },
    { id: 'wizard', name: 'הקוסם', rarity: 2, tone: '#f3d2b0', hair: { style: 'long', color: '#f0f0f6' }, brow: '#e8e8ee',
      beard: { style: 'long', color: '#f0f0f6' }, hat: { type: 'wizard', c1: '#5b3fb5', c2: '#e9c46a' },
      outfit: { base: '#5b3fb5', pattern: 'stars', collar: 'crew' } },
    { id: 'rocker', name: 'הרוקר', rarity: 2, tone: '#e8b88a', hair: { style: 'mohawk', color: '#ff2f92', color2: '#35c9ff' },
      glasses: { type: 'shades', neon: '#ff2f92' }, earring: true, beard: { style: 'stubble', color: '#2a1a12' },
      outfit: { base: '#23232b', jacket: '#15151a', collar: 'crewdark' } },
    { id: 'detective', name: 'הבלש', rarity: 2, tone: '#f0c08f', hair: { style: 'short', color: '#3a2a1a' },
      glasses: { type: 'monocle' }, beard: { style: 'mustache', color: '#3a2a1a' }, hat: { type: 'fedora' },
      outfit: { base: '#d9d4c5', coat: '#a8875a', collar: 'tie', tie: '#6a1d12' } },
    { id: 'einstein', name: 'אלברט', rarity: 2, tone: '#f0c8a0', hair: { style: 'frizz', color: '#f1f1f5' }, brow: '#b8b8c0',
      beard: { color: '#e4e4ea' }, lips: '#b8676a', eyes: { iris: '#4a3020' },
      outfit: { base: '#e8e4da', cardigan: '#7a6a58', collar: 'tie', tie: '#3a3a46' }, extra: skEinsteinExtra },
    { id: 'newton', name: 'אייזק', rarity: 2, tone: '#f3d2b0', hair: { style: 'wavy', color: '#d6cebe' }, brow: '#7a6a50',
      lips: '#c25a6a', eyes: { iris: '#3a2a1a' },
      outfit: { base: '#2a2a32', trim: '#15151a', collar: 'v', inner: '#f7f7fa', coat: '#3a2a20' }, extra: skNewtonExtra },

    /* ---------- אפי ---------- */
    { id: 'astronaut', name: 'האסטרונאוט', rarity: 3, tone: '#e0a977', hair: { style: 'short', color: '#2a1a12' }, hat: { type: 'astro' },
      outfit: { base: '#eef1f7', patchFlag: true, collar: 'ring' }, aura: { color: '#6ea8ff', alpha: 0.28 }, fx: { type: 'stars', count: 10 } },
    { id: 'samurai', name: 'הסמוראי', rarity: 3, tone: '#e8b88a', hair: { style: 'bald', color: '#111' }, brow: '#14110f',
      beard: { style: 'mustache', color: '#14110f' }, hat: { type: 'kabuto' },
      outfit: { base: '#a52a2a', pattern: 'plates', trim: '#3a0c0c', collar: 'high' }, aura: { color: '#ff4d4d', alpha: 0.2 } },
    { id: 'knight', name: 'האביר', rarity: 3, tone: '#f0c08f', hair: { style: 'bald', color: '#111' },
      beard: { style: 'stubble', color: '#6a4a2a' }, hat: { type: 'knight' },
      outfit: { base: '#b6bfcd', pattern: 'plates', trim: '#4b5568', tabard: true, collar: 'high' }, aura: { color: '#c9d6ff', alpha: 0.18 } },
    { id: 'hero', name: 'גיבור העל', rarity: 3, tone: '#e8b88a', hair: { style: 'slick', color: '#14110f' }, mask: '#2a5bd7',
      outfit: { base: '#2a5bd7', emblem: '#f2c230', belt: '#f2c230', collar: 'crew' }, cape: { color: '#d6291f' }, aura: { color: '#ffd23d', alpha: 0.22 } },
    { id: 'cyborg', name: 'הסייבורג', rarity: 3, tone: '#d9a98a', hair: { style: 'wild', color: '#aeb6c4' }, face: ['cyberhalf'], hat: { type: 'plate' },
      outfit: { base: '#161a22', pattern: 'neon', glow: '#35e0ff', collar: 'high' }, aura: { color: '#35e0ff', alpha: 0.24 }, fx: { type: 'sparkles', count: 8 } },

    /* ---------- אגדי ---------- */
    { id: 'king', name: 'מלך הבייגלה', rarity: 4, tone: '#f0c08f', hair: { style: 'long', color: '#7a4a24' },
      beard: { style: 'full', color: '#7a4a24' }, hat: { type: 'crown' },
      outfit: { base: '#b3202a', pattern: 'none', fur: true, collar: 'none' }, aura: { color: '#ffd23d', alpha: 0.4 }, fx: { type: 'sparkles', count: 16 } },
    { id: 'angel', name: 'המלאך', rarity: 4, tone: '#f6d9bd', hair: { style: 'wavy', color: '#f0cf6a' }, hat: { type: 'halo' }, lips: '#e0707f',
      outfit: { base: '#fbfbff', trim: '#f1c40f', collar: 'crew' }, wings: { type: 'feather' }, aura: { color: '#fff3b0', alpha: 0.45 }, fx: { type: 'feathers', count: 12, speed: 0.18 } },
    { id: 'firemage', name: 'הלוחש לאש', rarity: 4, tone: '#d9a066', hair: { style: 'flame' }, eyes: { glow: '#ffb02e' }, brow: '#7a1f0a',
      outfit: { base: '#5a1410', trim: '#ff8a1a', collar: 'high' }, aura: { color: '#ff6a1a', alpha: 0.5 }, fx: { type: 'embers', count: 20, speed: 0.5 } },
    { id: 'kebab', name: 'הקבב האגדי', rarity: 4, brow: '#2a1206', lips: '#6a2a0c', eyes: { iris: '#3a1a06' },
      aura: { color: '#ff8a1a', alpha: 0.5 }, fx: { type: 'embers', count: 18, speed: 0.45 }, drawBack: skKebabBack },
    { id: 'laffa', name: 'שווארמה בלאפה', rarity: 4, brow: '#5a3a1a', lips: '#8a4a1a', eyes: { iris: '#3a2410' },
      aura: { color: '#ffb02e', alpha: 0.45 }, fx: { type: 'sparkles', count: 14 }, drawBack: skLaffaBack },
    { id: 'hedgehog', name: 'סוניק', rarity: 4, brow: '#123c94', lips: '#8a4a3a', eyes: { iris: '#1f9a4a' }, blush: false,
      aura: { color: '#4a9cff', alpha: 0.45 }, fx: { type: 'sparkles', count: 14, speed: 0.6 }, drawBack: skHedgehogBack },
    { id: 'spidey', name: 'ספיידי', rarity: 4, tone: '#f0c8a0', lips: '#b8576a', blush: false,
      aura: { color: '#ff3040', alpha: 0.4 }, fx: { type: 'sparkles', count: 12, speed: 0.5 }, drawBack: skSpideyBack },

    /* ---------- מיתי ---------- */
    { id: 'cosmic', name: 'קיסר הגלקסיה', rarity: 5, tone: '#e6c6e8', hair: { style: 'galaxy', color: '#3b2a9c' }, eyes: { glow: '#35e0ff' }, brow: '#cfd8ff', hat: { type: 'cosmiccrown' },
      outfit: { base: '#1a1450', pattern: 'stars', collar: 'high' }, cape: { color: '#2a1a78', stars: true },
      aura: { color: '#8f6bff', alpha: 0.5, rings: true }, fx: { type: 'stars', count: 22, speed: 0.3 }, lips: '#c067d9' },
    { id: 'dragon', name: 'אדון הדרקונים', rarity: 5, tone: '#c9a77c', hair: { style: 'slick', color: '#1a1410' }, eyes: { glow: '#ff7a1a', slit: true }, brow: '#14110f', hat: { type: 'dragon' },
      beard: { style: 'goatee', color: '#1a1410' }, wings: { type: 'dragon', color: '#2d6a3a' },
      outfit: { base: '#2f7a42', pattern: 'scales', collar: 'high' }, aura: { color: '#ff6a1a', alpha: 0.45, runes: true }, fx: { type: 'embers', count: 22, speed: 0.45 } },
    { id: 'deni', name: 'דני', rarity: 5, tone: '#e9c09a', hair: { style: 'short', color: '#2e1d12' }, brow: '#1e130b',
      beard: { color: '#24160c' }, lips: '#b8676a', blush: false, eyes: { iris: '#4a3020' },
      aura: { color: '#e03a3e', alpha: 0.45, rings: true }, fx: { type: 'sparkles', count: 20, speed: 0.4 },
      drawBack: skDeniBack, drawFront: skDeniFront },

    /* ============ 30 סקינים חדשים ============ */

    /* ---------- נפוץ ---------- */
    { id: 'shira', name: 'שירה', rarity: 0, tone: '#f3d2b0', hair: { style: 'bun', color: '#7a4a24' }, lips: '#d9566f',
      outfit: { base: '#8f6bd6', collar: 'crew' } },
    { id: 'omer', name: 'עומר', rarity: 0, tone: '#d9a066', hair: { style: 'curly', color: '#2a1a12' },
      hat: { type: 'cap', c1: '#2a6fd0' }, outfit: { base: '#f4f4f7', pattern: 'stripes', trim: '#2a6fd0', collar: 'crew' } },
    { id: 'tamar', name: 'תמר', rarity: 0, tone: '#8d5524', hair: { style: 'afro', color: '#1a120c' }, lips: '#7a3a32',
      outfit: { base: '#f2c230', collar: 'v', inner: '#f4f4f7' } },
    { id: 'itay', name: 'איתי', rarity: 0, tone: '#f1c8a0', hair: { style: 'bob', color: '#d8b24a' },
      glasses: { type: 'round', color: '#222' }, outfit: { base: '#4f7a4a', collar: 'hood' } },
    { id: 'dudu', name: 'דודו', rarity: 0, tone: '#e0a977', hair: { style: 'sidebald', color: '#3a2412' },
      beard: { style: 'full', color: '#3a2412' }, outfit: { base: '#c24a3a', pattern: 'plaid', trim: '#6a1d12', collar: 'crew' } },
    { id: 'maya', name: 'מאיה', rarity: 0, tone: '#f6d3b8', hair: { style: 'wavy', color: '#a8501a' }, face: ['freckles'], lips: '#e0707f',
      outfit: { base: '#35c9b0', collar: 'crew' } },
    { id: 'gili', name: 'גילי', rarity: 0, tone: '#c68642', hair: { style: 'ponytail', color: '#14110f' }, lips: '#a8434f',
      hat: { type: 'cap', c1: '#2ea043' }, outfit: { base: '#23232b', collar: 'crewdark' } },

    /* ---------- לא נפוץ ---------- */
    { id: 'dj', name: 'הדי-ג\'יי', rarity: 1, tone: '#8d5524', hair: { style: 'buzz', color: '#14110f' }, lips: '#7a3a32',
      glasses: { type: 'shades' }, hat: { type: 'headphones', c1: '#ff2f92' },
      outfit: { base: '#1b1c22', pattern: 'neon', glow: '#ff2f92', collar: 'crewdark' } },
    { id: 'scientist', name: 'המדענית', rarity: 1, tone: '#f3d2b0', hair: { style: 'bun', color: '#4a2e18' }, lips: '#c25a6a',
      glasses: { type: 'goggles' }, outfit: { base: '#7fb3e0', coat: '#f7f7fa', collar: 'tie', tie: '#2a6fd0' } },
    { id: 'sailor', name: 'המלח', rarity: 1, tone: '#e8b88a', hair: { style: 'short', color: '#3a2a1a' },
      beard: { style: 'full', color: '#3a2a1a' }, hat: { type: 'cap', c1: '#1d2a52' },
      outfit: { base: '#f4f4f8', pattern: 'stripes', trim: '#1d2a52', collar: 'bandana', bandana: '#c42b2b' } },
    { id: 'waiter', name: 'המלצר', rarity: 1, tone: '#f0c08f', hair: { style: 'slick', color: '#14110f' },
      beard: { style: 'mustache', color: '#14110f' }, outfit: { base: '#f7f7fa', jacket: '#15151a', collar: 'tie', tie: '#14182e' } },
    { id: 'beekeeper', name: 'הכוורן', rarity: 1, tone: '#d9a066', hair: { style: 'short', color: '#5a3a1a' }, hat: { type: 'straw', c1: '#f2c230' },
      outfit: { base: '#f2e6b8', overall: '#e4b521', collar: 'crew' } },
    { id: 'lifeguard', name: 'המציל', rarity: 1, tone: '#c68642', hair: { style: 'wavy', color: '#e8c04a' }, glasses: { type: 'shades' },
      outfit: { base: '#e83a2a', badge: '#f4f4f7', collar: 'crew' } },
    { id: 'mechanic', name: 'המכונאי', rarity: 1, tone: '#e0a977', hair: { style: 'buzz', color: '#3a2412' }, face: ['soot'],
      beard: { style: 'stubble', color: '#3a2412' }, outfit: { base: '#4a6a8a', overall: '#2f4a68', collar: 'crew' } },

    /* ---------- נדיר ---------- */
    { id: 'boxer', name: 'המתאגרף', rarity: 2, tone: '#8d5524', hair: { style: 'buzz', color: '#14110f' }, face: ['scar'], lips: '#7a3a32',
      outfit: { base: '#d6291f', belt: '#f2c230', collar: 'high' } },
    { id: 'yacht', name: 'בעל היאכטה', rarity: 2, tone: '#c9a77c', hair: { style: 'short', color: '#14110f' }, earring: true,
      beard: { style: 'goatee', color: '#14110f' }, hat: { type: 'cap', c1: '#f4f4f7' },
      outfit: { base: '#f7f7fa', trimEdge: '#d9b25a', collar: 'high' } },
    { id: 'gangster', name: 'הגנגסטר', rarity: 2, tone: '#f0c08f', hair: { style: 'slick', color: '#1a1410' }, face: ['scar'],
      beard: { style: 'stubble', color: '#1a1410' }, hat: { type: 'fedora' },
      outfit: { base: '#2a2a32', pattern: 'stripes', trim: '#3a3a46', collar: 'tie', tie: '#c42b2b' } },
    { id: 'punk', name: 'הפאנקיסטית', rarity: 2, tone: '#f6d3b8', hair: { style: 'mohawk', color: '#35e0a0', color2: '#f2c230' }, lips: '#2a1a2a',
      earring: true, outfit: { base: '#d6291f', jacket: '#15151a', collar: 'crewdark' } },
    { id: 'hunter', name: 'הצייד', rarity: 2, tone: '#d9a066', hair: { style: 'long', color: '#4a2e18' }, face: ['warpaint'],
      beard: { style: 'stubble', color: '#4a2e18' }, outfit: { base: '#4f6a3a', fur: true, straps: '#6b4a2c', collar: 'none' } },
    { id: 'pharaoh', name: 'הפרעה', rarity: 2, tone: '#c68642', hair: { style: 'bob', color: '#14110f' }, brow: '#14110f',
      beard: { style: 'goatee', color: '#14110f' }, earring: true,
      outfit: { base: '#f4ecd0', pattern: 'stripes', trim: '#2a5bd7', belt: '#d9b25a', collar: 'ring' } },

    /* ---------- אפי ---------- */
    { id: 'icequeen', name: 'מלכת הקרח', rarity: 3, tone: '#f3e2e8', hair: { style: 'long', color: '#dff3ff' }, brow: '#cfe8ff', lips: '#7aa8d9',
      eyes: { iris: '#5ab4ff' }, hat: { type: 'crown' }, outfit: { base: '#9fd4ff', pattern: 'stars', collar: 'high' },
      cape: { color: '#5ab4ff' }, aura: { color: '#bfe8ff', alpha: 0.3 }, fx: { type: 'sparkles', count: 10 } },
    { id: 'vampire', name: 'הערפד', rarity: 3, tone: '#e6dde6', hair: { style: 'slick', color: '#14110f' }, brow: '#14110f', lips: '#8a1020',
      eyes: { glow: '#ff2a2a' }, blush: false, outfit: { base: '#1b1c22', collar: 'tie', tie: '#8a1020' },
      cape: { color: '#7a0c18' }, aura: { color: '#ff2a4a', alpha: 0.2 } },
    { id: 'gladiator', name: 'הגלדיאטור', rarity: 3, tone: '#d9a066', hair: { style: 'short', color: '#3a2412' }, face: ['scar'],
      beard: { style: 'full', color: '#3a2412' }, hat: { type: 'knight' },
      outfit: { base: '#c9a24a', pattern: 'plates', trim: '#7a5a1a', collar: 'high' }, cape: { color: '#b3202a' }, aura: { color: '#ffb02e', alpha: 0.18 } },
    { id: 'hacker', name: 'ההאקר', rarity: 3, tone: '#e8b88a', hair: { style: 'wild', color: '#1a1410' }, glasses: { type: 'shades', neon: '#35ff6a' },
      hat: { type: 'headphones', c1: '#35ff6a' }, outfit: { base: '#101418', pattern: 'neon', glow: '#35ff6a', collar: 'hood' },
      aura: { color: '#35ff6a', alpha: 0.22 }, fx: { type: 'sparkles', count: 8 } },
    { id: 'sultan', name: 'הסולטן', rarity: 3, tone: '#c9a77c', hair: { style: 'short', color: '#14110f' }, earring: true,
      beard: { style: 'full', color: '#14110f' }, hat: { type: 'crown' },
      outfit: { base: '#5b3fb5', pattern: 'ermine', trimEdge: '#d9b25a', sash: '#d9b25a', collar: 'high' }, aura: { color: '#d9b25a', alpha: 0.26 } },

    /* ---------- אגדי ---------- */
    { id: 'thunder', name: 'אל הרעם', rarity: 4, tone: '#f0c08f', hair: { style: 'wild', color: '#f0cf6a' }, eyes: { glow: '#9fe8ff' },
      beard: { style: 'full', color: '#f0cf6a' }, hat: { type: 'viking' },
      outfit: { base: '#3a4a6a', pattern: 'plates', trim: '#1d2a3a', collar: 'high' }, cape: { color: '#c42b2b' },
      aura: { color: '#9fe8ff', alpha: 0.45 }, fx: { type: 'sparkles', count: 18, speed: 0.6 } },
    { id: 'phoenix', name: 'עוף החול', rarity: 4, tone: '#e8b88a', hair: { style: 'flame' }, eyes: { glow: '#ffd33d' }, brow: '#a8401a', lips: '#c2401a',
      outfit: { base: '#c2401a', pattern: 'scales', collar: 'high' }, wings: { type: 'feather' },
      aura: { color: '#ff8a1a', alpha: 0.5 }, fx: { type: 'flames', count: 18, speed: 0.5 } },
    { id: 'shadow', name: 'נינג\'ת הצללים', rarity: 4, tone: '#d9a98a', hat: { type: 'ninja' }, eyes: { glow: '#b66bff' }, brow: '#14110f',
      outfit: { base: '#15121e', straps: '#6a3fb5', sash: '#6a3fb5', collar: 'high' }, cape: { color: '#2a1a40' },
      aura: { color: '#7a3fff', alpha: 0.42, runes: true }, fx: { type: 'stars', count: 14, speed: 0.4 } },

    /* ---------- מיתי ---------- */
    { id: 'kebabgod', name: 'אל השווארמה', rarity: 5, tone: '#f0c08f', hair: { style: 'long', color: '#f0cf6a' }, eyes: { glow: '#ffd23d' }, brow: '#d9b25a',
      beard: { style: 'long', color: '#f0cf6a' }, hat: { type: 'halo' }, wings: { type: 'feather' },
      outfit: { base: '#d9b25a', pattern: 'plates', trim: '#8a6a1a', trimEdge: '#fff3b0', collar: 'high' }, cape: { color: '#b3202a', stars: true },
      aura: { color: '#ffd23d', alpha: 0.55, rings: true }, fx: { type: 'sparkles', count: 24, speed: 0.4 } },
    { id: 'voidlord', name: 'שליט הריק', rarity: 5, tone: '#cfc6e6', hair: { style: 'galaxy', color: '#120a3d' }, eyes: { glow: '#ff2fd0', slit: true }, brow: '#2a1a5a',
      hat: { type: 'cosmiccrown' }, wings: { type: 'dragon', color: '#2a1a5a' }, lips: '#6a2a9a',
      outfit: { base: '#0e0a24', pattern: 'neon', glow: '#ff2fd0', collar: 'high' }, cape: { color: '#1a0e3a', stars: true },
      aura: { color: '#ff2fd0', alpha: 0.5, runes: true, rings: true }, fx: { type: 'stars', count: 24, speed: 0.35 } },

    /* ---------- מהדורה מיוחדת: זמינים רק עם קוד ---------- */
    { id: 'banana', name: 'איתמר האגדי', rarity: 6, brow: '#5a3e0a', lips: '#b8860b', eyes: { iris: '#4a2e10' },
      aura: { color: '#ffe066', alpha: 0.4 }, drawBack: skBananaBack },
    { id: 'lizard', name: 'השרגונת', rarity: 6, brow: '#1e5a1a', lips: '#2e6a2a', eyes: { iris: '#e0b020' },
      aura: { color: '#7fff6a', alpha: 0.28 }, drawBack: skLizardBack },
    { id: 'dosus', name: 'דוסוס', rarity: 6, tone: '#f0c08f', hair: { style: 'short', color: '#1a1410' },
      beard: { style: 'long', color: '#1a1410' }, glasses: { type: 'round', color: '#15151a' },
      aura: { color: '#9fc4ff', alpha: 0.25 }, drawBack: skDosusBack, drawFront: skDosusFront },
    { id: 'yuvaldog', name: 'הכלב של יובל', rarity: 6, tone: '#f6f1e8', brow: '#4a2814', lips: '#3a1e14', eyes: { iris: '#5a3216' },
      outfit: { base: '#c9b3f2', collar: 'crew' }, aura: { color: '#d9c4ff', alpha: 0.3 }, drawBack: skDogBack },
    { id: 'tapuzi', name: 'תפוזי', rarity: 6, brow: '#8a3a00', lips: '#a8400a', eyes: { iris: '#3a2410' },
      aura: { color: '#ffb347', alpha: 0.35 }, drawBack: skOrangeBack },
    { id: 'goldcapy', name: 'הקפיברה של שוורץ', rarity: 6, brow: '#7a4e06', lips: '#8a5a08', eyes: { iris: '#2a1a06' }, blush: false,
      aura: { color: '#ffd23d', alpha: 0.5, rings: true }, fx: { type: 'sparkles', count: 16 }, drawBack: skCapybaraBack },
    { id: 'vader', name: 'סטארוורס', rarity: 6, tone: '#2a2c34', lips: '#3a3d48', blush: false,
      outfit: { base: '#141418', collar: 'high' }, cape: { color: '#16161c' },
      aura: { color: '#ff2a2a', alpha: 0.3 }, drawBack: skVaderBack },
    { id: 'wizmouse', name: 'מיקי המכשף', rarity: 6, tone: '#f6c9a0', brow: '#15151a', lips: '#7a1a1a', eyes: { iris: '#15151a' },
      hat: { type: 'wizard', c1: '#2a4fb8', c2: '#2a4fb8' }, outfit: { base: '#c42b2b', belt: '#d9b25a', collar: 'v', inner: '#e8a878' },
      aura: { color: '#6ea8ff', alpha: 0.4 }, fx: { type: 'stars', count: 14, speed: 0.3 }, drawBack: skMouseBack, drawFront: skMouseFront }
];

function skinById(id) { return SV_SKINS.find(s => s.id === id) || SV_SKINS[0]; }

/* ============================================================
   גרסאות של סקינים (מתג על כרטיס החנות)
   - בן / בת לכל סקין בקטגוריות: אנשי השכונה, מקצועות, פנטזיה, גיבורים ועתיד
   - שלושת הבקבוקים: קולה / זירו / פאנטה
   גרסה היא סקין נפרד עם variantOf = הסקין הראשי. הוא לא מוצג בחנות בנפרד,
   וקנייה של סקין פותחת את כל הגרסאות שלו.
   ============================================================ */
// g = המין של הסקין המקורי. name = שם הגרסה השנייה. ov = שינויים מיוחדים לגרסה
const GENDER_FLIPS = {
    // אנשי השכונה
    danny: { g: 'm', name: 'דניאלה' },
    noa: { g: 'f', name: 'נועם' },
    yosi: { g: 'm', name: 'סבתא יוספה', ov: { hair: { style: 'bun', color: '#e8e8ee' } } },
    roei: { g: 'm', name: 'רעות' },
    michal: { g: 'f', name: 'מיכאל', ov: { beard: { style: 'stubble', color: '#1f130c' } } },
    avi: { g: 'm', name: 'אביבה', ov: { hair: { style: 'afro', color: '#14110f' } } },
    yuval: { g: 'f', name: 'יואב' },
    shira: { g: 'f', name: 'שי' },
    omer: { g: 'm', name: 'עומרית', ov: { hair: { style: 'long', color: '#2a1a12' } } },
    tamar: { g: 'f', name: 'תומר', ov: { hair: { style: 'buzz', color: '#1a120c' } } },
    itay: { g: 'm', name: 'איילת', ov: { hair: { style: 'long', color: '#d8b24a' } } },
    dudu: { g: 'm', name: 'דורית', ov: { hair: { style: 'bun', color: '#3a2412' } } },
    maya: { g: 'f', name: 'מאור' },
    gili: { g: 'f', name: 'גיל' },
    yacht: { g: 'm', name: 'בעלת היאכטה', ov: { hair: { style: 'long', color: '#14110f' } } },
    // מקצועות
    chef: { g: 'm', name: 'השפית', ov: { hair: { style: 'bun', color: '#3a2412' } } },
    waiter: { g: 'm', name: 'המלצרית', ov: { hair: { style: 'bun', color: '#14110f' } } },
    farmer: { g: 'm', name: 'האיכרה' },
    beekeeper: { g: 'm', name: 'הכוורנית' },
    builder: { g: 'm', name: 'הבנאית' },
    mechanic: { g: 'm', name: 'המכונאית' },
    fire: { g: 'm', name: 'הכבאית' },
    police: { g: 'm', name: 'השוטרת', ov: { hair: { style: 'bun', color: '#14110f' } } },
    lifeguard: { g: 'm', name: 'המצילה', ov: { hair: { style: 'long', color: '#e8c04a' } } },
    sailor: { g: 'm', name: 'המלחית', ov: { hair: { style: 'bob', color: '#3a2a1a' } } },
    pilot: { g: 'm', name: 'הטייסת', ov: { hair: { style: 'bob', color: '#3a2a1a' } } },
    scientist: { g: 'f', name: 'המדען', ov: { hair: { style: 'short', color: '#4a2e18' } } },
    detective: { g: 'm', name: 'הבלשית', ov: { hair: { style: 'wavy', color: '#3a2a1a' } } },
    dj: { g: 'm', name: 'הדי-ג\'יית', ov: { hair: { style: 'long', color: '#14110f' } } },
    boxer: { g: 'm', name: 'המתאגרפת' },
    astronaut: { g: 'm', name: 'האסטרונאוטית', ov: { hair: { style: 'bob', color: '#2a1a12' } } },
    // פנטזיה ומיתולוגיה
    wizard: { g: 'm', name: 'הקוסמת' },
    vampire: { g: 'm', name: 'הערפדית', ov: { lips: '#b0102a' } },
    icequeen: { g: 'f', name: 'מלך הקרח', ov: { hair: { style: 'slick', color: '#dff3ff' }, beard: { style: 'goatee', color: '#dff3ff' } } },
    angel: { g: 'm', name: 'המלאכית' },
    firemage: { g: 'm', name: 'הלוחשת לאש' },
    thunder: { g: 'm', name: 'אלת הרעם', ov: { hair: { style: 'wavy', color: '#f0cf6a' } } },
    phoenix: { g: 'm', name: 'ציפור האש' },
    shadow: { g: 'f', name: 'נינג\'ה הצללים', ov: { beard: { style: 'stubble', color: '#14110f' }, earring: false } },
    dragon: { g: 'm', name: 'גבירת הדרקונים' },
    cosmic: { g: 'm', name: 'קיסרית הגלקסיה' },
    voidlord: { g: 'm', name: 'שליטת הריק' },
    kebabgod: { g: 'm', name: 'אלת השווארמה', ov: { hair: { style: 'long', color: '#f0cf6a' } } },
    // גיבורים ועתיד
    hero: { g: 'm', name: 'גיבורת העל' },
    cyborg: { g: 'm', name: 'הסייבורגית', ov: { hair: { style: 'wavy', color: '#aeb6c4' } } },
    hacker: { g: 'm', name: 'ההאקרית', ov: { hair: { style: 'long', color: '#1a1410' } } }
};
const TO_FEMALE_HAIR = { short: 'ponytail', buzz: 'bob', slick: 'long', sidebald: 'bun', bald: 'bun', wild: 'wavy' };
const TO_MALE_HAIR = { long: 'short', wavy: 'short', ponytail: 'short', bob: 'short', bun: 'short' };

function genderFlip(base, to) {
    const v = {};
    if (base.hair) {
        const map = to === 'f' ? TO_FEMALE_HAIR : TO_MALE_HAIR;
        if (map[base.hair.style]) v.hair = Object.assign({}, base.hair, { style: map[base.hair.style] });
    }
    if (to === 'f') {
        v.beard = null;
        v.lashes = true;
        v.earring = true;
        if (!base.lips) v.lips = '#d9566f';
    } else {
        v.lashes = false;
        v.lips = undefined;
    }
    return v;
}

const SKIN_GROUPS = {};          // מזהה ראשי -> [{ id, label }]
Object.entries(GENDER_FLIPS).forEach(([id, f]) => {
    const base = SV_SKINS.find(x => x.id === id);
    if (!base) return;
    const to = f.g === 'm' ? 'f' : 'm';
    const vid = id + '_' + to;
    SV_SKINS.push(Object.assign({}, base, genderFlip(base, to), f.ov || {}, { id: vid, name: f.name, variantOf: id }));
    if (f.g === 'f') base.lashes = base.lashes !== false;    // לגרסאות הנשיות המקוריות מוסיפים ריסים
    const male = f.g === 'm' ? id : vid, female = f.g === 'm' ? vid : id;
    SKIN_GROUPS[id] = [{ id: male, label: '♂ בן' }, { id: female, label: '♀ בת' }];
});
// שלושת הבקבוקים הם כרטיס אחד
['rolazero', 'albanta'].forEach(id => { const sk = SV_SKINS.find(x => x.id === id); if (sk) sk.variantOf = 'bubacola'; });
SKIN_GROUPS.bubacola = [{ id: 'bubacola', label: 'קולה' }, { id: 'rolazero', label: 'זירו' }, { id: 'albanta', label: 'פאנטה' }];

// גרסאות צ'דר לסקינים של מהדורה מיוחדת - נפתחות עם אותו קוד
const CHEDDAR_VARIANTS = {
    vader: { name: 'סטארוורס צ\'דר', pal: VADER_CHEDDAR, tone: '#e8961c', lips: '#c46e08',
             outfit: { base: '#e8961c', collar: 'high' }, cape: { color: '#d07a10' }, aura: { color: '#ffb02e', alpha: 0.35 } },
    dosus: { name: 'דוסוס צ\'דר', pal: DOSUS_CHEDDAR, tone: '#ffcf5a', lips: '#d98a14',
             hair: { style: 'short', color: '#b8700c' }, beard: { style: 'long', color: '#e8961c' },
             glasses: { type: 'round', color: '#7a3e02' }, aura: { color: '#ffd23d', alpha: 0.3 } },
    yuvaldog: { name: 'הכלב של יובל צ\'דר', pal: DOG_CHEDDAR, tone: '#ffd877', brow: '#8a4a04', lips: '#7a3e02',
                eyes: { iris: '#7a3e02' }, outfit: { base: '#e8961c', collar: 'crew' }, aura: { color: '#ffc83d', alpha: 0.35 } }
};
// מיקי הקוסם - גרסה של מיקי המכשף, נפתחת באותו קוד
(() => {
    const base = SV_SKINS.find(x => x.id === 'wizmouse');
    SV_SKINS.push(Object.assign({}, base, { id: 'wizmouse_magic', name: 'מיקי הקוסם', variantOf: 'wizmouse', magician: true, hat: null,
        outfit: { base: '#ffffff' }, cape: { color: '#b3121f' },
        aura: { color: '#ff4a5a', alpha: 0.35 }, fx: { type: 'sparkles', count: 16, speed: 0.4 } }));
    SKIN_GROUPS.wizmouse = [{ id: 'wizmouse', label: '🧙 מכשף' }, { id: 'wizmouse_magic', label: '🎩 קוסם' }];
})();

// דני בגופיית נבחרת ישראל
(() => {
    const base = SV_SKINS.find(x => x.id === 'deni');
    SV_SKINS.push(Object.assign({}, base, { id: 'deni_israel', name: 'דני - נבחרת ישראל', variantOf: 'deni', jersey: DENI_ISRAEL,
        aura: { color: '#3a7bff', alpha: 0.45, rings: true } }));
    SKIN_GROUPS.deni = [{ id: 'deni', label: 'פורטלנד' }, { id: 'deni_israel', label: '🇮🇱 נבחרת' }];
})();

Object.entries(CHEDDAR_VARIANTS).forEach(([id, ov]) => {
    const base = SV_SKINS.find(x => x.id === id);
    if (!base) return;
    SV_SKINS.push(Object.assign({}, base, ov, { id: id + '_cheddar', variantOf: id }));
    SKIN_GROUPS[id] = [{ id, label: 'רגיל' }, { id: id + '_cheddar', label: '🧀 צ\'דר' }];
});

function skinGroupOf(id) {
    const sk = SV_SKINS.find(x => x.id === id);
    const base = sk && sk.variantOf ? sk.variantOf : id;
    return SKIN_GROUPS[base] ? base : null;
}

function skinPrice(s) { return s.rarity < 0 ? 0 : SK_RARITY[s.rarity].price; }

/* ---------- מבצע יומי: סקין אחד בהנחה כל יום ----------
   נבחר לפי התאריך והשחקן מבין הסקינים שעוד לא בבעלותו (לא נפוץ ומעלה),
   ונשמר כדי שלא יתחלף באמצע היום (גם לא אחרי שקונים אותו). */
const DEAL_KEY = 'kebab_deal';
const DEAL_OFF = 0.4;                    // 40% הנחה
function dealToday() {
    const today = dailyDate();
    let d = null;
    try { d = JSON.parse(store.get(DEAL_KEY) || 'null'); } catch (e) { d = null; }
    if (d && d.date === today && SV_SKINS.some(x => x.id === d.id)) return d;
    const owned = getOwnedSkins();
    const pool = SV_SKINS.filter(x => x.rarity >= 1 && !(SK_RARITY[x.rarity] || {}).codeOnly && !x.variantOf && !owned.has(x.id));
    if (!pool.length) return null;
    let h = 2166136261;
    for (const ch of today + '|' + playerId) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
    d = { date: today, id: pool[h % pool.length].id };
    store.set(DEAL_KEY, JSON.stringify(d));
    return d;
}
function dealPrice(base) { return Math.max(5, Math.round(base * (1 - DEAL_OFF) / 5) * 5); }
function skinOnDeal(sk) { const d = dealToday(); return !!d && d.id === (skinGroupOf(sk.id) || sk.id); }
// המחיר להיום (עם המבצע אם יש)
function skinPriceNow(sk) { const p = skinPrice(sk); return skinOnDeal(sk) ? dealPrice(p) : p; }


    /* --- משחק 1: תפוס את הקבב --- */
    let catchScore = 0;
    let catchTimer = 15;
    let catchInterval = null;
    let kebabTimeout = null;
    let catchStarted = false;

    function startCatchGame() {
        catchScore = 0;
        catchTimer = 15;
        document.getElementById('catch-score').textContent = catchScore;
        document.getElementById('catch-timer').textContent = catchTimer;
        
        switchTab('catch');
        catchStarted = false;
        spawnKebab();
    }

    // הטיימר מתחיל רק בנגיעה הראשונה במסך
    function startCatchTimer() {
        if (catchStarted) return;
        catchStarted = true;
        clearInterval(catchInterval);
        catchInterval = setInterval(() => {
            catchTimer--;
            document.getElementById('catch-timer').textContent = catchTimer;
            if (catchTimer <= 0) {
                endCatchGame();
            }
        }, 1000);
        clearTimeout(kebabTimeout);
        kebabTimeout = setTimeout(spawnKebab, 850);
    }
    document.getElementById('game-area').addEventListener('pointerdown', startCatchTimer);

    let kebabImgFailed = false;   // אם kebab.png לא נטען - לא מנסים שוב בכל הופעה

    function makeKebabFallback() {
        const fb = document.createElement('div');
        fb.className = 'kebab';
        fb.textContent = '🥙';
        fb.style.fontSize = '2.8rem';
        return fb;
    }

    function spawnKebab() {
        const area = document.getElementById('game-area');
        area.innerHTML = '';
        if (catchTimer <= 0) return;

        const SIZE = 65;
        const maxX = Math.max(0, area.clientWidth - SIZE);
        const maxY = Math.max(0, area.clientHeight - SIZE);
        const left = Math.floor(Math.random() * (maxX + 1)) + 'px';
        const top = Math.floor(Math.random() * (maxY + 1)) + 'px';

        let kebab;
        if (kebabImgFailed) {
            kebab = makeKebabFallback();
        } else {
            kebab = document.createElement('img');
            kebab.className = 'kebab';
            kebab.alt = '';
            kebab.draggable = false;
            kebab.src = 'kebab.png';
            // גיבוי: אם התמונה לא נטענת מחליפים באימוג'י ושומרים על אותו מיקום
            kebab.onerror = function () {
                kebabImgFailed = true;
                const fb = makeKebabFallback();
                fb.style.left = this.style.left;
                fb.style.top = this.style.top;
                fb.onclick = this.onclick;
                this.replaceWith(fb);
            };
        }
        kebab.style.left = left;
        kebab.style.top = top;

        kebab.onclick = () => {
            startCatchTimer();
            catchScore += 1;
            sfx.pop();
            document.getElementById('catch-score').textContent = catchScore;
            clearTimeout(kebabTimeout);
            spawnKebab();
        };

        area.appendChild(kebab);
        if (catchStarted) kebabTimeout = setTimeout(spawnKebab, 850);
    }

    function endCatchGame() {
        clearInterval(catchInterval);
        clearTimeout(kebabTimeout);
        document.getElementById('game-area').innerHTML = '';

        checkHighScore(catchScore);
        document.getElementById('result-desc').textContent = `תפסת קבבים בשווי ${catchScore} נקודות!`;
        dailyEvent('catch', { score: catchScore });
        showResultReward('catch', catchScore);
        switchTab('result');
    }

    /* --- משחק 2: חידון האוכל הגדול --- */
    const allTriviaQuestions = [
        { question: "מאיזו מדינה מגיעה המנה המסורתית 'פיצה מרגריטה'?", options: ["איטליה", "צרפת", "יוון", "ספרד"], correct: 0 },
        { question: "מהו המרכיב הראשי שממנו מכינים טופו?", options: ["פולי סויה", "גרגירי חומוס", "אורז לבן", "חיטה"], correct: 0 },
        { question: "איזה פרי נחשב ליוקרתי ביותר ביפן ולעיתים נמכר במכירות פומביות?", options: ["מילון יובארי", "תפוח עץ", "בננה", "ענבים סגולים"], correct: 0 },
        { question: "ממה מכינים את המאכל המקסיקני 'גואקמולה'?", options: ["אבוקדו", "חציל", "קישוא", "עגבנייה"], correct: 0 },
        { question: "איזה תבלין מופק מצלקות של פרח ונחשב ליקר ביותר בעולם?", options: ["זעפרן", "הל", "כמון", "ווניל"], correct: 0 },
        { question: "איזה דג הוא המרכיב המסורתי העיקרי במרק 'חריימה'?", options: ["דג ים (למשל לוקוס/בורי)", "סלמון", "טונה מקופסה", "סרדינים"], correct: 0 },
        { question: "מהי המדינה שנחשבת למקור של מאכל ה'פלאפל'?", options: ["מצרים", "איטליה", "מרוקו", "תאילנד"], correct: 0 },
        { question: "מה הפירוש המילולי של המילה 'סושי' ביפנית?", options: ["אורז חמוץ/חומצי", "דג נא", "אצה ירוקה", "רול מגולגל"], correct: 0 },
        { question: "מאיזה צמח מפיקים את השוקולד?", options: ["עץ הקקאו", "שיח הקפה", "קנה סוכר", "עץ הניל"], correct: 0 },
        { question: "איזה ויטמין מצוי בכמות גבוהה במיוחד בפירות הדר?", options: ["ויטמין C", "ויטמין D", "ויטמין B12", "ויטמין K"], correct: 0 },
        { question: "איזה ירק הוא המרכיב העיקרי במטבל 'ציזיקי' היווני?", options: ["מלפפון", "עגבנייה", "גזר", "צנונית"], correct: 0 },
        { question: "ממה מכינים פסטה מסורתית איטלקית?", options: ["קמח חיטת דורום ומים", "קמח תירס", "אורז טחון", "עמילן תפוחי אדמה"], correct: 0 },
        { question: "איזה ניצן פרח כבוש, שגדל על שיח בר ים-תיכוני, משמש כתבלין חמצמץ?", options: ["צלפים", "זיתים", "חמוצים", "תמרים"], correct: 0 },
        { question: "איזה קינוח צרפתי מפורסם מורכב משכבת קרם אפוי ומעליה סוכר מוקרם שרוף?", options: ["קרם ברולה", "סופלה", "אקלר", "פנקוטה"], correct: 0 },
        { question: "מאיפה מגיע המאכל 'פאד תאי'?", options: ["תאילנד", "סין", "יפן", "הודו"], correct: 0 },
        { question: "איזה חלק בצמח הוא הגזר?", options: ["שורש", "גבעול", "פרח", "פרי"], correct: 0 },
        { question: "ממה מכינים טחינה גולמית?", options: ["שומשום טחון", "גרגירי חומוס", "בוטנים", "חמניות"], correct: 0 },
        { question: "איזה פרי מכונה 'מלך הפירות' במזרח אסיה וידוע בריחו החזק והשנוי במחלוקת?", options: ["דוריאן", "מנגו", "אננס", "פפאיה"], correct: 0 },
        { question: "מהו הרכיב שגורם לבצק להתפוח בעת אפיית לחם?", options: ["שמרים", "מלח", "שמן זית", "חומץ"], correct: 0 },
        { question: "מהי הגבינה המסורתית המשמשת להכנת פיצה איטלקית קלאסית?", options: ["מוצרלה", "גאודה", "פרמזן", "בולגרית"], correct: 0 },
        { question: "איזה סוג אגוז הוא המרכיב המרכזי בממרח 'פסטו' קלאסי?", options: ["צנובר", "אגוז מלך", "שקד", "קשיו"], correct: 0 },
        { question: "איזו מדינה ידועה במאכל הלאומי שלה 'פאייה' (Paella)?", options: ["ספרד", "פורטוגל", "מקסיקו", "ברזיל"], correct: 0 },
        { question: "מהו הקינוח האיטלקי שפירוש שמו הוא 'תרים אותי'?", options: ["טירמיסו", "ג'לאטו", "קנולי", "קאסאטה"], correct: 0 },
        { question: "מהו הירק המרכזי שמרכיב את המאכל הקוריאני המותסס 'קימצ'י'?", options: ["כרוב סיני", "גזר", "מלפפון", "תפוח אדמה"], correct: 0 },
        { question: "איזה משקה מפיקים מפולי קפה קלויים וטחונים?", options: ["קפה", "תה", "קקאו", "מאצ'ה"], correct: 0 },
        { question: "מהם שלושת המרכיבים הבסיסיים של מיונז?", options: ["חלמון ביצה, שמן וחומץ/לימון", "חלב, חמאה ומלח", "שמנת, שום ומים", "חלבון ביצה, סוכר ושמן"], correct: 0 },
        { question: "מהו שמה של הפסטה בצורת דפים המשמשת לאפייה בשכבות עם רוטב ובשר/גבינות?", options: ["לזניה", "פוטוצ'יני", "פנה", "רביולי"], correct: 0 },
        { question: "איזה שמן נחשב לבריא ביותר והוא בסיס למטבח הים-תיכוני?", options: ["שמן זית", "שמן תירס", "שמן דקלים", "שמן סויה"], correct: 0 },
        { question: "איזה דג משמש באופן קלאסי להכנת המנה 'פיש אנד צ'יפס' בבריטניה?", options: ["קד (בקלה)", "סלמון", "אמנון", "נסיכת הנילוס"], correct: 0 },
        { question: "איזה תבלין צהוב מעניק את הצבע האופייני לאורז צהוב ולרוטב עמבה?", options: ["כורכום", "פפריקה", "פלפל שחור", "קינמון"], correct: 0 },
        { question: "מאיזו מדינה מגיע קינוח ה'אלפחורס' המפורסם?", options: ["ארגנטינה", "ספרד", "מקסיקו", "קולומביה"], correct: 0 },
        { question: "מהו המרכיב שממנו מכינים את הגבינה 'קאצ'קבל'?", options: ["חלב צאן/בקר", "סויה", "שיבולת שועל", "אורז"], correct: 0 },
        { question: "איזה מאכל רחוב הודי מורכב ממעטפת בצק מטוגנת במילוי תפוחי אדמה ואפונה?", options: ["סמוסה", "נאן", "דאל", "צ'אטי"], correct: 0 },
        { question: "מהי הגבינה היוונית המלוחה המיוצרת מחלב עיזים או כבשים?", options: ["פטה", "רוקפור", "ברי", "קממבר"], correct: 0 },
        { question: "איזה ירק ידוע בכך שהוא גורם לדמעות בעת חיתוך שלו?", options: ["בצל", "שום", "פלפל", "צנונית"], correct: 0 },
        { question: "איזה פרי יבש מופק מענבים?", options: ["צימוק", "תמר", "תאנה", "משמש"], correct: 0 },
        { question: "ממה מכינים מרק 'מיסו' יפני מסורתי?", options: ["מחית פולי סויה מותססים", "ציר עוף רגיל", "חלב קוקוס", "עגבניות טחונות"], correct: 0 },
        { question: "איזה רוטב אסייתי פופולרי מיוצר מסויה, חיטה, מים ומלח?", options: ["רוטב סויה", "רוטב טריאקי", "רוטב צ'ילי מתוק", "סריראצ'ה"], correct: 0 },
        { question: "איזו קטניה היא הבסיס למאכל המרוקאי המסורתי 'חרירה'?", options: ["עדשים וחומוס", "סויה", "תירס", "אפונה ירוקה"], correct: 0 },
        { question: "איזה תבלין מופק מקליפת עץ פנימית?", options: ["קינמון", "ציפורן", "אגוז מוסקט", "פלפל אנגלי"], correct: 0 },
        { question: "איזו מנה מקסיקנית מורכבת מטורטיה מגולגלת וממולאת שנאפית ברוטב?", options: ["אנצ'ילדה", "נאצ'וס", "טאקו", "בוריטו"], correct: 0 },
        { question: "מהי הדרך הנכונה לבדוק אם פסטה מוכנה לדרגת 'אל דנטה'?", options: ["היא נגיסה אך עדיין מעט מוצקה במרכז", "שהיא רכה לחלוטין ונמעכת", "שהיא קשה וקראנצ'ית", "שהיא נדבקת לקיר"], correct: 0 },
        { question: "איזה פרי הוא המרכיב העיקרי בפאי 'באנופי' הבריטי?", options: ["בננה", "תפוח", "תות", "אפרסק"], correct: 0 },
        { question: "מאיזה עשב תיבול מכינים רוטב צ'ימיצ'ורי?", options: ["פטרוזיליה", "נענע", "בזיליקום", "רוזמרין"], correct: 0 },
        { question: "איזה דג מעובד ומעושן נהוג לאכול לצד בייגל וגבינת שמנת?", options: ["סלמון מעושן (לאקס)", "טונה", "סרדין", "חרינג"], correct: 0 },
        { question: "איזה ירק נחשב לבסיס של רוטב המטבוחה?", options: ["עגבניות ופלפלים", "חצילים וקישואים", "בצל וגזר", "תפוחי אדמה"], correct: 0 },
        { question: "מאיזו מדינה מגיעה גבינת ה'גאודה'?", options: ["הולנד", "שוויץ", "צרפת", "גרמניה"], correct: 0 },
        { question: "איזה משקה מכינים מהצלפת אבקת תה ירוק יפני?", options: ["מאצ'ה", "סיידר", "צ'אי", "אסהי"], correct: 0 },
        { question: "מה מורכב במנה הצרפתית 'רטטוי'?", options: ["ירקות מבושלים (חציל, קישוא, עגבניה)", "בשר בקר ביין", "מרק בצל עם גבינה", "תפוחי אדמה מוקרמים"], correct: 0 },
        { question: "איזה תבלין מתוק מופק מתרמילים של צמח ממשפחת הסחלביים?", options: ["ווניל", "אגוז מוסקט", "שומשום", "הל"], correct: 0 },
        { question: "איזה חלק בביצה מכיל את מרבית השומן והויטמינים?", options: ["חלמון (הצהוב)", "חלבון (הלבן)", "קליפה", "זגיג הביצה"], correct: 0 },
        { question: "מהו השם האיטלקי לגלידה מסורתית?", options: ["ג'לאטו", "סורבה", "גרניטה", "פרפה"], correct: 0 },
        { question: "איזה סוג דגן הוא המרכיב הראשי בדייסת קוואקר?", options: ["שיבולת שועל", "חיטה", "שעורה", "כוסמין"], correct: 0 },
        { question: "מהי הגבינה הצרפתית המפורסמת בעלת המרקם הרך והקליפה הלבנה?", options: ["ברי / קממבר", "פרמזן", "צ'דר", "מוצרלה"], correct: 0 },
        { question: "מהו הקינוח האוסטרי המסורתי המורכב מגלילת בצק דק במילוי תפוחים?", options: ["שטרודל תפוחים", "זאכרטורטה", "סופגניה", "פנקייק"], correct: 0 },
        { question: "מאיזה ירק מכינים את הצ'יפס הקלאסי?", options: ["תפוח אדמה", "בטטה", "שורש סלרי", "גזר"], correct: 0 },
        { question: "איזה מאכל מזרח תיכוני מורכב מפירורי סולת המבושלים על אדים?", options: ["קוסקוס", "בורגול", "פתיתים", "קינואה"], correct: 0 },
        { question: "מהו המאכל הלאומי של שווייץ המבוסס על גבינה מותכת בסיר מרכזי?", options: ["פונדו", "רקלט", "רוסטי", "גרטן"], correct: 0 },
        { question: "איזה סוג בשר משמש להכנת 'המבורגר' קלאסי?", options: ["בקר", "עוף", "דג", "כבש"], correct: 0 },
        { question: "איזה פרי יבש נהוג לאכול בטו בשבט וממנו מפיקים סילאן?", options: ["תמר", "תאנה", "חרוב", "צימוק"], correct: 0 },
        { question: "איזו קטניה היא המרכיב הראשי במאכל 'מג'דרה' לצד אורז?", options: ["עדשים", "שעועית", "חומוס", "תירס"], correct: 0 },
        { question: "מהו השם של הלחם ההודי השטוח שנאפה בתנור טנדור?", options: ["נאן", "פוקאצ'ה", "טורטיה", "פרנה"], correct: 0 },
        { question: "איזה מרק מסורתי מבוסס על סלק אדום?", options: ["בורשט", "חמיצה", "גולאש", "גזפצ'ו"], correct: 0 },
        { question: "מה המרכיב העיקרי במרק 'גזפצ'ו' הספרדי המוגש קר?", options: ["עגבניות", "מלפפונים", "דלעת", "תירס"], correct: 0 },
        { question: "מאיזו מדינה מגיע קינוח ה'צ'ורוס'?", options: ["ספרד ומקסיקו", "איטליה", "צרפת", "יוון"], correct: 0 },
        { question: "איזה אגוז משמש כבסיס העיקרי להכנת ממרח 'נוטלה'?", options: ["אגוז לוז", "שקד", "אגוז מלך", "פיסטוק"], correct: 0 },
        { question: "מה שמו של המאפה הגיאורגי המפורסם במילוי גבינות וביצת עין?", options: ["חצ'פורי", "חינקלי", "לבאש", "סמבוסק"], correct: 0 },
        { question: "איזה ירק הוא המרכיב העיקרי במאכל 'באבא גנוש'?", options: ["חציל", "קישוא", "פלפל קלוי", "דלורית"], correct: 0 },
        { question: "מאיזה דגן מכינים את המשקה 'בירה'?", options: ["שעורה", "אורז", "תירס", "שיפון"], correct: 0 },
        { question: "איזה פרי עשיר בשומן בריא ומשמש להכנת שמן מפורסם למאכל?", options: ["זית", "תפוח", "תפוז", "ענב"], correct: 0 },
        { question: "מהי המדינה המזוהה ביותר עם ייצור שוקולד איכותי לצד שווייץ?", options: ["בלגיה", "יוון", "אנגליה", "ספרד"], correct: 0 },
        { question: "איזה סוג קמח אינו מכיל גלוטן באופן טבעי?", options: ["קמח אורז / קמח תירס", "קמח חיטה", "קמח כוסמין", "קמח שעורה"], correct: 0 },
        { question: "מהי הגבינה האנגלית המפורסמת בעלת הצבע הצהוב-כתום והטעם החריף מעט?", options: ["צ'דר", "גאודה", "פרמזן", "ברי"], correct: 0 },
        { question: "מאיזו ציפור מגיעות ביצי ה'שלוי' הקטנות והמנומרות?", options: ["שלו", "פנינייה", "יענה", "אווז"], correct: 0 },
        { question: "מהו המאפה התימני המסורתי המורכב משכבות בצק עלווה?", options: ["ג'חנון", "קובנה", "סחלב", "כנאפה"], correct: 0 },
        { question: "מהו הקינוח המזרח-תיכוני המורכב מאיטריות קדאיף וגבינה?", options: ["כנאפה", "בקלאווה", "מלבי", "לילות ביירות"], correct: 0 },
        { question: "איזה תבלין מעניק את הטעם והארומה האופייניים למשקה ה'ערק'?", options: ["אניס", "קינמון", "ציפורן", "ווניל"], correct: 0 },
        { question: "מהו השם של הרוטב הצרפתי המורכב מחמאה, חלמונים ומיץ לימון?", options: ["רוטב הולנדז", "רוטב בשמל", "רוטב ברנז", "רוטב ולוטה"], correct: 0 },
        { question: "איזה פרי נחשב לסמל של חג ראש השנה ומרבים לאכול את גרעיניו?", options: ["רימון", "תפוח", "תמר", "תאנה"], correct: 0 },
        { question: "איזה ירק משמש כבסיס העיקרי להכנת סלט 'קולסלאו'?", options: ["כרוב", "חסה", "גזר", "תרד"], correct: 0 },
        { question: "איזה מאכל מורכב מבשר טחון שנעטף בשכבת סולת ומבושל במרק?", options: ["קובה", "קרפלאך", "כיסונים", "גונדי"], correct: 0 },
        { question: "איזה מהפלפלים הבאים הוא החריף ביותר לפי סולם סקוויל?", options: ["הבנרו", "חלפניו", "פפרוצ'יני", "גמבה"], correct: 0 },
        { question: "איזה משקה חם מכינים מחליטת עלים של צמח ה'קמליה סיננסיס'?", options: ["תה", "קפה", "סיידר", "קקאו"], correct: 0 },
        { question: "מאיזו מדינה מגיע המאכל 'סביח' במקור?", options: ["עיראק", "מצרים", "תימן", "סוריה"], correct: 0 },
        { question: "איזה מאכל מורכב מביצים המבושלות ברוטב עגבניות, פלפלים ושום?", options: ["שקשוקה", "מטבוחה", "גזפצ'ו", "רטאטוי"], correct: 0 },
        { question: "ממה מכינים את הקינוח 'מלבי' בגרסתו המקורית?", options: ["חלב, קורנפלור ומי ורדים", "סולת ודבש", "קמח וסוכר", "גבינה לבנה וג'לטין"], correct: 0 },
        { question: "מהו הדגן העיקרי שמשמש להכנת פולנטה איטלקית?", options: ["תירס", "חיטה", "אורז", "שיפון"], correct: 0 },
        { question: "איזה פרי ירוק בעל גלעין גדול במרכזו משמש להכנת ממרחים?", options: ["אבוקדו", "מנגו", "אפרסק", "שזיף"], correct: 0 },
        { question: "איזה תבלין אדום מופק מפלפלים מיובשים וטחונים?", options: ["פפריקה", "כורכום", "סומאק", "כמון"], correct: 0 },
        { question: "איזה מאכל מורכב מדפי אורז ממולאים בירקות ומאפיין את וייטנאם?", options: ["ספרינג רול", "דמפלינג", "באו", "סושי"], correct: 0 },
        { question: "איזה אגוז ירוק ויוקרתי משמש לעיטור כנאפה וגלידות?", options: ["פיסטוק", "שקד", "אגוז מלך", "קשיו"], correct: 0 },
        { question: "איזה עשב תיבול הוא העיקרי בסלט 'טבולה'?", options: ["פטרוזיליה", "כוסברה", "נענע", "שמיר"], correct: 0 },
        { question: "איזה פרי הדר נחשב להכלאה בין פומלה לתפוז?", options: ["אשכולית", "ליים", "קלמנטינה", "אתרוג"], correct: 0 },
        { question: "מהו המאפה הצרפתי הקלאסי בצורת סהר המבוסס על בצק עלים וחמאה?", options: ["קרואסון", "בריוש", "בגט", "אקלר"], correct: 0 }
    ];

    let activeTriviaQuestions = [];
    let currentTriviaIndex = 0;
    let triviaScore = 0;
    let canAnswer = true;

    function startTriviaGame() {
        currentTriviaIndex = 0;
        triviaScore = 0;
        canAnswer = true;
        
        const shuffled = shuffleArray(allTriviaQuestions);
        activeTriviaQuestions = shuffled.slice(0, 5);
        
        switchTab('trivia');
        showTriviaQuestion();
    }

    function showTriviaQuestion() {
        canAnswer = true;
        const q = activeTriviaQuestions[currentTriviaIndex];
        
        document.getElementById('trivia-progress').textContent = `${currentTriviaIndex + 1}/${activeTriviaQuestions.length}`;
        document.getElementById('trivia-score').textContent = triviaScore * 20;
        document.getElementById('trivia-question-text').textContent = q.question;

        const optionsContainer = document.getElementById('trivia-options-container');
        optionsContainer.innerHTML = '';

        // ערבוב אקראי של התשובות עבור השאלה הנוכחית
        const shuffledOptions = shuffleArray(q.options.map((optText, originalIdx) => ({
            text: optText,
            isCorrect: originalIdx === q.correct
        })));

        // יצירת הכפתורים מתוך הרשימה המעורבבת
        shuffledOptions.forEach((item) => {
            const btn = document.createElement('div');
            btn.className = 'trivia-option';
            btn.textContent = item.text;
            
            // סימון התשובה הנכונה ברמת האלמנט
            if (item.isCorrect) {
                btn.dataset.correct = "true";
            }

            btn.onclick = () => selectTriviaAnswer(item.isCorrect, btn);
            optionsContainer.appendChild(btn);
        });
    }

    function selectTriviaAnswer(isCorrect, optionElement) {
        if (!canAnswer) return;
        canAnswer = false;

        const allOptions = document.querySelectorAll('.trivia-option');

        if (isCorrect) {
            optionElement.classList.add('correct');
            sfx.good();
            triviaScore++;
        } else {
            optionElement.classList.add('wrong');
            sfx.err();
            // מציאת התשובה הנכונה מבין האפשרויות המוצגות והדגשתה בירוק
            allOptions.forEach(opt => {
                if (opt.dataset.correct === "true") {
                    opt.classList.add('correct');
                }
            });
        }

        triviaTimeout = setTimeout(() => {
            currentTriviaIndex++;
            if (currentTriviaIndex < activeTriviaQuestions.length) {
                showTriviaQuestion();
            } else {
                endTriviaGame();
            }
        }, 1200);
    }

    function endTriviaGame() {
        const totalPoints = triviaScore * 20;
        saveLocalBest('kebab_triviaHighScore', totalPoints);
        document.getElementById('result-desc').textContent = `ענית נכון על ${triviaScore} מתוך ${activeTriviaQuestions.length} שאלות! (${totalPoints} נקודות)`;
        dailyEvent('trivia', { score: totalPoints, correct: triviaScore });
        showResultReward('trivia', totalPoints);
        switchTab('result');
    }
/* --- משחק: סידור מדפים --- */

let goodsBoard = [];            // 12 מדפים x 3 מקומות
let selectedGoodsSlot = null;   // { shelf, slot }
let goodsScore = 0;
let goodsTimer = 30;
let goodsInterval = null;
let goodsStarted = false;
let goodsLocked = false;        // נעילת קלט בזמן טעינת לוח חדש (אחרי שכל המדפים התפנו)
let goodsVanishing = new Set(); // אינדקסים של מדפים שמוסרים כרגע (רק הם נעולים - שאר הלוח ממשיך לעבוד)
const goodsVanishAt = {};        // מתי התחילה ההיעלמות של כל מדף (כדי שציור מחדש לא יתחיל את האנימציה מההתחלה)
let goodsHolding = false;       // אצבע על הלוח - לא מציירים מחדש מתחתיה (באייפון זה עוצר את האירועים)
let goodsPendingRender = false;
function goodsRenderSafe() { if (goodsHolding) goodsPendingRender = true; else { goodsPendingRender = false; renderGoodsBoard(); } }

const goodsProducts = ['🥩', '🧅', '🍅', '🌶️', '🥫', '🧄'];

function goodsSetTimeout(fn, ms) {
    const id = setTimeout(fn, ms);
    goodsTimeouts.push(id);
    return id;
}

function isGoodsShelfMatch(shelf) {
    return shelf[0] !== null && shelf[0] === shelf[1] && shelf[1] === shelf[2];
}

function startGoodsSortGame() {
    goodsScore = 0;
    goodsTimer = 30;
    selectedGoodsSlot = null;

    document.getElementById('goods-score').textContent = goodsScore;
    document.getElementById('goods-timer').textContent = goodsTimer;
    document.getElementById('goods-msg').textContent = '';

    switchTab('goods');   // עוצר טיימרים קודמים
    goodsStarted = false;
    initGoodsBoard();
}

// הטיימר מתחיל רק בנגיעה הראשונה בלוח
function startGoodsTimer() {
    if (goodsStarted) return;
    goodsStarted = true;
    goodsInterval = setInterval(() => {
        goodsTimer--;
        document.getElementById('goods-timer').textContent = goodsTimer;
        if (goodsTimer <= 0) {
            endGoodsSortGame();
        }
    }, 1000);
}

// 12 שלישיות (36 מוצרים), בלי מדף שכבר מסודר בתחילת הלוח
function initGoodsBoard() {
    goodsLocked = false;
    goodsVanishing = new Set();
    selectedGoodsSlot = null;

    // כל מוצר מופיע ב-2 שלישיות (6 מוצרים x 2 = 12 שלישיות) - מבטיח מגוון ולוח פתיר
    const pool = [];
    goodsProducts.forEach(p => { pool.push(p, p, p, p, p, p); });

    let attempts = 0;
    do {
        // Fisher-Yates
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        goodsBoard = [];
        for (let i = 0; i < 12; i++) {
            goodsBoard.push([pool[i * 3], pool[i * 3 + 1], pool[i * 3 + 2]]);
        }
        attempts++;
    } while (goodsBoard.some(isGoodsShelfMatch) && attempts < 100);

    renderGoodsBoard();
}

function renderGoodsBoard() {
    const boardEl = document.getElementById('goods-board');
    boardEl.innerHTML = '';

    goodsBoard.forEach((shelf, shelfIdx) => {
        const shelfDiv = document.createElement('div');
        shelfDiv.className = 'goods-shelf';
        const vanish = goodsVanishing.has(shelfIdx);
        if (vanish) shelfDiv.classList.add('match-vanish');

        shelf.forEach((item, slotIdx) => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'goods-slot';
            if (selectedGoodsSlot && selectedGoodsSlot.shelf === shelfIdx && selectedGoodsSlot.slot === slotIdx) {
                slotDiv.classList.add('selected');
            }
            slotDiv.textContent = item || '';
            slotDiv.dataset.shelf = shelfIdx;
            slotDiv.dataset.slot = slotIdx;
            if (vanish) slotDiv.style.animationDelay = -(performance.now() - goodsVanishAt[shelfIdx]) + 'ms';
            shelfDiv.appendChild(slotDiv);
        });

        boardEl.appendChild(shelfDiv);
    });
}

// לחיצה: בחירה / ביטול / החלפה בין כל שני תאים
function handleGoodsClick(shelfIdx, slotIdx) {
    if (goodsLocked || goodsTimer <= 0 || goodsVanishing.has(shelfIdx)) return;
    startGoodsTimer();

    const clickedItem = goodsBoard[shelfIdx][slotIdx];

    if (!selectedGoodsSlot) {
        if (clickedItem) selectedGoodsSlot = { shelf: shelfIdx, slot: slotIdx };
    } else if (selectedGoodsSlot.shelf === shelfIdx && selectedGoodsSlot.slot === slotIdx) {
        selectedGoodsSlot = null;
    } else if (!goodsVanishing.has(selectedGoodsSlot.shelf)) {
        goodsSwap(selectedGoodsSlot, { shelf: shelfIdx, slot: slotIdx });
        selectedGoodsSlot = null;
        checkGoodsMatches();
    } else {
        selectedGoodsSlot = null;
    }

    renderGoodsBoard();
}
// בחירה מיידית ברגע הנגיעה - רק מחליפים קלאס, בלי לצייר את הלוח מחדש מתחת לאצבע
function goodsMarkSelected() {
    document.querySelectorAll('#goods-board .goods-slot').forEach(el => el.classList.toggle('selected',
        !!selectedGoodsSlot && +el.dataset.shelf === selectedGoodsSlot.shelf && +el.dataset.slot === selectedGoodsSlot.slot));
}

function goodsSwap(a, b) {
    const temp = goodsBoard[b.shelf][b.slot];
    goodsBoard[b.shelf][b.slot] = goodsBoard[a.shelf][a.slot];
    goodsBoard[a.shelf][a.slot] = temp;
}

// גרירה: מחזיקים מוצר וגוררים אותו לתא אחר כדי להחליף ביניהם. הקשה רגילה (בלי תזוזה) עובדת כמו קודם.
// לא מציירים את הלוח מחדש באמצע גרירה - בטלפונים (במיוחד אייפון) מחיקת התא שמתחת לאצבע עוצרת את האירועים
(function bindGoodsDrag() {
    const board = document.getElementById('goods-board');
    if (!board) return;
    let drag = null;
    const slotAt = (x, y) => {
        const el = document.elementFromPoint(x, y);
        const s = el && el.closest ? el.closest('.goods-slot') : null;
        return s && board.contains(s) ? { el: s, shelf: +s.dataset.shelf, slot: +s.dataset.slot } : null;
    };
    const same = (a, b) => a && b && a.shelf === b.shelf && a.slot === b.slot;
    const clearMarks = () => board.querySelectorAll('.drop-over, .drag-src').forEach(e => e.classList.remove('drop-over', 'drag-src'));
    const dropGhost = () => document.querySelectorAll('.goods-ghost').forEach(g => g.remove());
    board.addEventListener('pointerdown', e => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (drag) return;                                  // אצבע שנייה - מתעלמים
        dropGhost(); clearMarks();
        const s = slotAt(e.clientX, e.clientY);
        if (!s || goodsLocked || goodsTimer <= 0 || goodsVanishing.has(s.shelf)) return;
        drag = { id: e.pointerId, from: s, x0: e.clientX, y0: e.clientY, moving: false, ghost: null, picked: false };
        goodsHolding = true;
        // נגיעה ראשונה במוצר בוחרת אותו מיד (בלי לחכות שהאצבע תעלה)
        if (!selectedGoodsSlot && goodsBoard[s.shelf][s.slot]) {
            startGoodsTimer();
            selectedGoodsSlot = { shelf: s.shelf, slot: s.slot };
            goodsMarkSelected();
            drag.picked = true;
        }
        try { board.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    const move = e => {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.moving) {
            if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 12 || !goodsBoard[drag.from.shelf][drag.from.slot] || goodsLocked || goodsVanishing.has(drag.from.shelf)) return;
            drag.moving = true;
            startGoodsTimer();
            if (selectedGoodsSlot) { selectedGoodsSlot = null; board.querySelectorAll('.goods-slot.selected').forEach(el => el.classList.remove('selected')); }
            drag.from.el.classList.add('drag-src');
            const g = document.createElement('div');
            g.className = 'goods-ghost';
            g.textContent = goodsBoard[drag.from.shelf][drag.from.slot];
            document.body.appendChild(g);
            drag.ghost = g;
            sfx.pop();
        }
        if (e.cancelable) e.preventDefault();
        drag.ghost.style.transform = 'translate(' + (e.clientX - 28) + 'px,' + (e.clientY - 34) + 'px) scale(1.25)';
        board.querySelectorAll('.drop-over').forEach(el => el.classList.remove('drop-over'));
        const over = slotAt(e.clientX, e.clientY);
        if (over && !same(over, drag.from)) over.el.classList.add('drop-over');
    };
    const finish = (e, cancel) => {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag; drag = null;
        goodsHolding = false;
        try { board.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        dropGhost(); clearMarks();
        if (cancel || (d.picked && !d.moving)) { if (goodsPendingRender) goodsRenderSafe(); return; }
        const to = d.moving ? slotAt(e.clientX, e.clientY) : d.from;
        if (!d.moving || same(to, d.from)) {               // הקשה (גם עם רעידה קטנה של האצבע)
            handleGoodsClick(d.from.shelf, d.from.slot);
            return;
        }
        if (to && !goodsLocked && goodsTimer > 0 && !goodsVanishing.has(to.shelf) && !goodsVanishing.has(d.from.shelf)) {
            goodsSwap(d.from, to);
            sfx.tap();
            checkGoodsMatches();
        }
        renderGoodsBoard();
    };
    // מאזינים גם על החלון, כדי שגרירה לעולם לא "תיתקע" אם אירוע הלך לאיבוד
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', e => finish(e, false));
    window.addEventListener('pointercancel', e => finish(e, true));
    // אייפונים ישנים שמתעלמים מ-touch-action: לא לגלול את הדף בזמן גרירה
    board.addEventListener('touchmove', e => { if (drag && e.cancelable) e.preventDefault(); }, { passive: false });
    window.addEventListener('blur', () => { if (drag) { drag = null; goodsHolding = false; dropGhost(); clearMarks(); goodsRenderSafe(); } });
})();

// זיהוי שלישיות: נועלים את הלוח, מנגנים אנימציה (הקלאס נשמר ב-render), ואז מרוקנים
function checkGoodsMatches() {
    const matched = [];
    goodsBoard.forEach((shelf, idx) => {
        if (isGoodsShelfMatch(shelf) && !goodsVanishing.has(idx)) matched.push(idx);
    });
    if (matched.length === 0) return;

    // רק המדפים שנעלמים נעולים - אפשר להמשיך לסדר את שאר הלוח בזמן האנימציה
    const now = performance.now();
    matched.forEach(idx => { goodsVanishing.add(idx); goodsVanishAt[idx] = now; });
    if (selectedGoodsSlot && goodsVanishing.has(selectedGoodsSlot.shelf)) selectedGoodsSlot = null;
    sfx.match(matched.length);

    goodsScore += matched.length * 3;
    document.getElementById('goods-score').textContent = goodsScore;

    const msgEl = document.getElementById('goods-msg');
    msgEl.style.color = '#2ea043';
    msgEl.textContent = '✨ שלישייה מושלמת! +' + (matched.length * 3) + ' נקודות';
    goodsSetTimeout(() => { msgEl.textContent = ''; }, 1200);

    goodsSetTimeout(() => {
        matched.forEach(idx => { goodsBoard[idx] = [null, null, null]; goodsVanishing.delete(idx); });
        goodsRenderSafe();

        const isBoardEmpty = goodsBoard.every(shelf => shelf.every(item => item === null));
        if (isBoardEmpty) {
            msgEl.style.color = '#e3b341';
            msgEl.textContent = '🎉 פיניתם את כל המדפים! טוען מוצרים חדשים...';
            goodsLocked = true;
            goodsSetTimeout(() => {
                initGoodsBoard();   // גם משחרר את הנעילה
                msgEl.textContent = '';
            }, 1000);
        }
    }, 400);   // תואם לאנימציה ב-CSS
}

function endGoodsSortGame() {
    clearInterval(goodsInterval);
    goodsTimeouts.forEach(clearTimeout);
    goodsTimeouts = [];
    goodsLocked = true;

    saveBestScore('leaderboard_goods', goodsScore, 'kebab_goodsHighScore');

    document.getElementById('result-desc').textContent = `סידרתם את המדפים וצברתם ${goodsScore} נקודות!`;
        dailyEvent('goods', { score: goodsScore });
        showResultReward('goods', goodsScore);
    switchTab('result');
}

function loadGoodsLeaderboard() {
    loadLeaderboardInto('goods-leaderboard-container', 'leaderboard_goods');
}

function loadShvartzLeaderboard() {
    loadLeaderboardInto('shvartz-leaderboard-container', 'leaderboard_shvartz');
}


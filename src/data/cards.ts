export type QuartetId =
  | "places"
  | "leaders"
  | "policy"
  | "peoples"
  | "society"
  | "decrees"
  | "religion"
  | "temple"
  | "empires"
  | "sects"
  | "roles"
  | "mattathias_sons";

export interface CardDef {
  id: number;
  title: string;
  quartetId: QuartetId;
  quartetName: string;
  colorHex: string;
  image: string;
  caption: string;
  source: string;
}

export interface QuartetDef {
  id: QuartetId;
  name: string;
  colorHex: string;
  specialMoveTitle?: string;
  specialMoveDesc?: string;
}

export const QUARTETS: QuartetDef[] = [
  {
    id: "places",
    name: "מקומות",
    colorHex: "#D9363E",
    specialMoveTitle: "החלפת קלפים (נמל יפו)",
    specialMoveDesc: "הציעו לשחקן אחר להחליף קלף מסוים מהיד שלכם בקלף מסוים מהיד שלו.",
  },
  {
    id: "leaders",
    name: "מנהיגים",
    colorHex: "#A46BE3",
    specialMoveTitle: "בקשות נוספות או נקודת בונוס",
    specialMoveDesc: "בחרו: לבקש עוד קלף מיד (ואם הצלחתם — עוד אחד), או להפוך רביעייה זו לשווה 3 נקודות בסוף.",
  },
  {
    id: "policy",
    name: "מדיניות החשמונאים",
    colorHex: "#248B45",
  },
  {
    id: "peoples",
    name: "עמים ותרבויות",
    colorHex: "#2256CD",
  },
  {
    id: "society",
    name: "החברה ביהודה",
    colorHex: "#ED841E",
  },
  {
    id: "decrees",
    name: "גזרות אנטיוכוס",
    colorHex: "#F2D02D",
  },
  {
    id: "religion",
    name: "דת ומסורת",
    colorHex: "#ED5896",
    specialMoveTitle: "בקשה מרביעיית המקדש",
    specialMoveDesc: "אם יש לכם קלף מרביעיית \"בבית המקדש\", בקשו מיד קלף אחד שחסר לכם באותה רביעייה.",
  },
  {
    id: "temple",
    name: "בבית המקדש",
    colorHex: "#16BFC5",
  },
  {
    id: "empires",
    name: "ממלכות ששלטו בארץ",
    colorHex: "#939AA1",
  },
  {
    id: "sects",
    name: "זרמים ומוקדי כוח בעם",
    colorHex: "#8B9B2E",
  },
  {
    id: "roles",
    name: "תפקידי ההנהגה",
    colorHex: "#9E6334",
  },
  {
    id: "mattathias_sons",
    name: "בני מתתיהו",
    colorHex: "#9B2660",
  },
];

export const CARDS: CardDef[] = [
  // 1. מקומות
  { id: 1, title: "מודיעין", quartetId: "places", quartetName: "מקומות", colorHex: "#D9363E", image: "/cards/card_01.webp", caption: "מתתיהו התחיל במודיעין את המרד נגד גזרות אנטיוכוס.", source: "מצגת מרד החשמונאים; מקבים א׳ ב׳" },
  { id: 2, title: "ירושלים", quartetId: "places", quartetName: "מקומות", colorHex: "#D9363E", image: "/cards/card_02.webp", caption: "בירושלים עמד בית המקדש והיא הייתה מרכז השלטון.", source: "ויקיספר, עמ׳ 2" },
  { id: 3, title: "אדום", quartetId: "places", quartetName: "מקומות", colorHex: "#D9363E", image: "/cards/card_03.webp", caption: "יוחנן הורקנוס כבש את אדום שבדרום וצירף אותה לממלכה.", source: "מלחמת היהודים א׳; ויקיספר" },
  { id: 4, title: "יפו", quartetId: "places", quartetName: "מקומות", colorHex: "#D9363E", image: "/cards/card_04.webp", caption: "שמעון כבש את יפו, וכך הייתה ליהודה יציאה לים.", source: "ספר מקבים א׳ י״ד, 5" },

  // 2. מנהיגים
  { id: 5, title: "יהודה המכבי", quartetId: "leaders", quartetName: "מנהיגים", colorHex: "#A46BE3", image: "/cards/card_05.webp", caption: "יהודה ניצח את הצבא הסלווקי בכמה קרבות ושחרר את ירושלים.", source: "מצגת מרד החשמונאים" },
  { id: 6, title: "מתתיהו הכהן", quartetId: "leaders", quartetName: "מנהיגים", colorHex: "#A46BE3", image: "/cards/card_06.webp", caption: "מתתיהו היה אבי המשפחה, ולפני מותו מינה את יהודה למנהיג המרד.", source: "ספר מקבים א׳ ב׳" },
  { id: 7, title: "שלומציון המלכה", quartetId: "leaders", quartetName: "מנהיגים", colorHex: "#A46BE3", image: "/cards/card_07.webp", caption: "שלומציון שלטה אחרי ינאי ונתנה לחכמי הפרושים יותר כוח.", source: "ממאבק לשלטון" },
  { id: 8, title: "אלכסנדר ינאי", quartetId: "leaders", quartetName: "מנהיגים", colorHex: "#A46BE3", image: "/cards/card_08.webp", caption: "ינאי היה מלך וכהן גדול, ונלחם מלחמה קשה בפרושים.", source: "מלחמת היהודים א׳ ד׳–ה׳" },

  // 3. מדיניות החשמונאים
  { id: 9, title: "גיור", quartetId: "policy", quartetName: "מדיניות החשמונאים", colorHex: "#248B45", image: "/cards/card_09.webp", caption: "האדומים היו צריכים לקבל את היהדות כדי להישאר בארץ שלהם.", source: "ויקיספר, עמ׳ 2–3" },
  { id: 10, title: "כיבוש שטחים", quartetId: "policy", quartetName: "מדיניות החשמונאים", colorHex: "#248B45", image: "/cards/card_10.webp", caption: "כבשו שטחים כדי להגדיל את המדינה ולשלוט בדרכי מסחר.", source: "ויקיספר, עמ׳ 2–3" },
  { id: 11, title: "יישוב יהודים", quartetId: "policy", quartetName: "מדיניות החשמונאים", colorHex: "#248B45", image: "/cards/card_11.webp", caption: "יהודים עברו לגור בערים שנכבשו, כמו יפו וגזר.", source: "מצגת מרד החשמונאים" },
  { id: 12, title: "צבא שכירים", quartetId: "policy", quartetName: "מדיניות החשמונאים", colorHex: "#248B45", image: "/cards/card_12.webp", caption: "ינאי שילם לחיילים זרים כדי שילחמו בצבא שלו.", source: "מלחמת היהודים א׳ ד׳" },

  // 4. עמים ותרבויות
  { id: 13, title: "יוונים", quartetId: "peoples", quartetName: "עמים ותרבויות", colorHex: "#2256CD", image: "/cards/card_13.webp", caption: "היוונים הביאו ליהודה את השפה והמנהגים שלהם.", source: "מצגת מבוא לבית שני" },
  { id: 14, title: "פרסים", quartetId: "peoples", quartetName: "עמים ותרבויות", colorHex: "#2256CD", image: "/cards/card_14.webp", caption: "ינאי כרת ברית עם הפרתים, ששלטו אז בפרס.", source: "ויקיספר, עמ׳ 1–3" },
  { id: 15, title: "מצרים", quartetId: "peoples", quartetName: "עמים ותרבויות", colorHex: "#2256CD", image: "/cards/card_15.webp", caption: "במצרים שלטה משפחת מלכים שנקראה בית תלמי.", source: "מצגת מבוא לבית שני" },
  { id: 16, title: "רומאים", quartetId: "peoples", quartetName: "עמים ותרבויות", colorHex: "#2256CD", image: "/cards/card_16.webp", caption: "יהודה המכבי היה הראשון שכרת ברית עם רומא.", source: "ויקיספר, עמ׳ 1" },

  // 5. החברה ביהודה
  { id: 17, title: "כוהנים", quartetId: "society", quartetName: "החברה ביהודה", colorHex: "#ED841E", image: "/cards/card_17.webp", caption: "החשמונאים היו כוהנים, אבל לא מבית צדוק שממנו באו הכוהנים הגדולים.", source: "ממאבק לשלטון" },
  { id: 18, title: "מתייוונים", quartetId: "society", quartetName: "החברה ביהודה", colorHex: "#ED841E", image: "/cards/card_18.webp", caption: "יהודים שאימצו את התרבות היוונית, ובירושלים אפילו הקימו בית משחק.", source: "ספר מקבים ב׳ ד׳" },
  { id: 19, title: "סוחרים", quartetId: "society", quartetName: "החברה ביהודה", colorHex: "#ED841E", image: "/cards/card_19.webp", caption: "יהודים ונוכרים התחרו ביניהם על המסחר בערי החוף.", source: "מצגת מרד החשמונאים" },
  { id: 20, title: "חקלאים", quartetId: "society", quartetName: "החברה ביהודה", colorHex: "#ED841E", image: "/cards/card_20.webp", caption: "בימי שלומציון ירדו גשמי ברכה, והיה לחקלאים שפע גדול.", source: "ויקיספר, עמ׳ 2" },

  // 6. גזרות אנטיוכוס
  { id: 21, title: "איסור ברית מילה", quartetId: "decrees", quartetName: "גזרות אנטיוכוס", colorHex: "#F2D02D", image: "/cards/card_21.webp", caption: "המלך ציווה להשאיר את הבנים בלי ברית מילה.", source: "ספר מקבים א׳ א׳, 44–50" },
  { id: 22, title: "איסור שמירת שבת", quartetId: "decrees", quartetName: "גזרות אנטיוכוס", colorHex: "#F2D02D", image: "/cards/card_22.webp", caption: "המלך ציווה לחלל שבתות וחגים, ומי שלא ציית נידון למוות.", source: "ספר מקבים א׳ א׳, 44–50" },
  { id: 23, title: "חיוב בעבודת אלילים", quartetId: "decrees", quartetName: "גזרות אנטיוכוס", colorHex: "#F2D02D", image: "/cards/card_23.webp", caption: "הכריחו את היהודים להקריב קורבנות לאלים אחרים.", source: "ספר מקבים א׳ א׳, 44–50" },
  { id: 24, title: "איסור לימוד תורה", quartetId: "decrees", quartetName: "גזרות אנטיוכוס", colorHex: "#F2D02D", image: "/cards/card_24.webp", caption: "המלך רצה שהיהודים ישכחו את התורה ויחליפו את כל החוקים.", source: "ספר מקבים א׳ א׳, 44–50" },

  // 7. דת ומסורת
  { id: 25, title: "ברית מילה", quartetId: "religion", quartetName: "דת ומסורת", colorHex: "#ED5896", image: "/cards/card_25.webp", caption: "מתתיהו ואנשיו עשו ברית מילה לילדים שלא נימולו בגלל הגזרות.", source: "ספר מקבים א׳ ב׳" },
  { id: 26, title: "שבת", quartetId: "religion", quartetName: "דת ומסורת", colorHex: "#ED5896", image: "/cards/card_26.webp", caption: "בימי הגזרות רבים העדיפו למות ולא לחלל את השבת.", source: "ספר מקבים א׳ ב׳" },
  { id: 27, title: "חנוכה", quartetId: "religion", quartetName: "דת ומסורת", colorHex: "#ED5896", image: "/cards/card_27.webp", caption: "יהודה המכבי קבע את חנוכה לזכר הניצחון וטיהור המקדש.", source: "ספר מקבים א׳ ד׳" },
  { id: 28, title: "ספר תורה", quartetId: "religion", quartetName: "דת ומסורת", colorHex: "#ED5896", image: "/cards/card_28.webp", caption: "אחת המטרות של המרד הייתה להציל את התורה ולהחזיר את כבודה.", source: "ויקיספר, עמ׳ 3" },

  // 8. בבית המקדש
  { id: 29, title: "מזבח", quartetId: "temple", quartetName: "בבית המקדש", colorHex: "#16BFC5", image: "/cards/card_29.webp", caption: "יהודה המכבי בנה מזבח חדש במקום המזבח שהיוונים חיללו.", source: "ספר מקבים א׳ ד׳" },
  { id: 30, title: "מנורת המקדש", quartetId: "temple", quartetName: "בבית המקדש", colorHex: "#16BFC5", image: "/cards/card_30.webp", caption: "אחרי טיהור המקדש הכניסו מנורה חדשה והדליקו אותה.", source: "ספר מקבים א׳ ד׳" },
  { id: 31, title: "כלי זהב", quartetId: "temple", quartetName: "בבית המקדש", colorHex: "#16BFC5", image: "/cards/card_31.webp", caption: "אנטיוכוס לקח את כלי הזהב מהמקדש, ובחנוכה עשו כלים חדשים.", source: "ספר מקבים א׳ א׳ וד׳" },
  { id: 32, title: "קורבנות", quartetId: "temple", quartetName: "בבית המקדש", colorHex: "#16BFC5", image: "/cards/card_32.webp", caption: "אנטיוכוס ביטל את הקורבנות, ויהודה המכבי החזיר אותם.", source: "ספר מקבים א׳ א׳ וד׳" },

  // 9. ממלכות ששלטו בארץ
  { id: 33, title: "פרס", quartetId: "empires", quartetName: "ממלכות ששלטו בארץ", colorHex: "#939AA1", image: "/cards/card_33.webp", caption: "אחרי בבל שלטו בארץ הפרסים, וכורש הרשה ליהודים לחזור.", source: "מצגת מבוא לבית שני" },
  { id: 34, title: "בבל", quartetId: "empires", quartetName: "ממלכות ששלטו בארץ", colorHex: "#939AA1", image: "/cards/card_34.webp", caption: "הבבלים החריבו את בית המקדש הראשון והגלו יהודים לבבל.", source: "מצגת מבוא לבית שני" },
  { id: 35, title: "רומא", quartetId: "empires", quartetName: "ממלכות ששלטו בארץ", colorHex: "#939AA1", image: "/cards/card_35.webp", caption: "פומפיוס הרומאי כבש את ירושלים בשנת 63 לפנה״ס, ויהודה איבדה את עצמאותה.", source: "ויקיספר, עמ׳ 3" },
  { id: 36, title: "יוון", quartetId: "empires", quartetName: "ממלכות ששלטו בארץ", colorHex: "#939AA1", image: "/cards/card_36.webp", caption: "אלכסנדר מוקדון כבש את הארץ מידי הפרסים.", source: "מצגת מבוא לבית שני" },

  // 10. זרמים ומוקדי כוח בעם
  { id: 37, title: "צדוקים", quartetId: "sects", quartetName: "זרמים ומוקדי כוח בעם", colorHex: "#8B9B2E", image: "/cards/card_37.webp", caption: "הצדוקים הדגישו את התורה הכתובה.", source: "ממאבק לשלטון, עמ׳ 3–4" },
  { id: 38, title: "פרושים", quartetId: "sects", quartetName: "זרמים ומוקדי כוח בעם", colorHex: "#8B9B2E", image: "/cards/card_38.webp", caption: "הפרושים שמרו על מסורות לצד התורה הכתובה.", source: "ממאבק לשלטון, עמ׳ 3–4" },
  { id: 39, title: "סנהדרין", quartetId: "sects", quartetName: "זרמים ומוקדי כוח בעם", colorHex: "#8B9B2E", image: "/cards/card_39.webp", caption: "בית דין מרכזי שעסק בענייני משפט והלכה.", source: "ממאבק לשלטון, עמ׳ 3–4" },
  { id: 40, title: "איסיים", quartetId: "sects", quartetName: "זרמים ומוקדי כוח בעם", colorHex: "#8B9B2E", image: "/cards/card_40.webp", caption: "האיסיים חיו בקהילות ושיתפו רכוש.", source: "ממאבק לשלטון, עמ׳ 3–4" },

  // 11. תפקידי ההנהגה
  { id: 41, title: "כהן גדול", quartetId: "roles", quartetName: "תפקידי ההנהגה", colorHex: "#9E6334", image: "/cards/card_41.webp", caption: "יונתן היה החשמונאי הראשון שלבש את בגדי הכהן הגדול, בחג הסוכות.", source: "ממאבק לשלטון, עמ׳ 1–3" },
  { id: 42, title: "שר צבא", quartetId: "roles", quartetName: "תפקידי ההנהגה", colorHex: "#9E6334", image: "/cards/card_42.webp", caption: "יונתן ושמעון פיקדו על הצבא.", source: "ממאבק לשלטון, עמ׳ 1–3" },
  { id: 43, title: "מלך", quartetId: "roles", quartetName: "תפקידי ההנהגה", colorHex: "#9E6334", image: "/cards/card_43.webp", caption: "יהודה אריסטובולוס היה החשמונאי הראשון ששם כתר וקרא לעצמו מלך.", source: "ממאבק לשלטון, עמ׳ 1–3" },
  { id: 44, title: "נשיא", quartetId: "roles", quartetName: "תפקידי ההנהגה", colorHex: "#9E6334", image: "/cards/card_44.webp", caption: "שמעון הוכר כמנהיג יהודה.", source: "ממאבק לשלטון, עמ׳ 1–3" },

  // 12. בני מתתיהו
  { id: 45, title: "יונתן", quartetId: "mattathias_sons", quartetName: "בני מתתיהו", colorHex: "#9B2660", image: "/cards/card_45.webp", caption: "אחרי שיהודה נהרג בקרב, העם ביקש מיונתן להנהיג את הצבא.", source: "ספר מקבים א׳" },
  { id: 46, title: "יוחנן", quartetId: "mattathias_sons", quartetName: "בני מתתיהו", colorHex: "#9B2660", image: "/cards/card_46.webp", caption: "הבן הבכור של מתתיהו, שנלחם יחד עם אחיו במרד.", source: "ספר מקבים א׳ ב׳" },
  { id: 47, title: "אלעזר", quartetId: "mattathias_sons", quartetName: "בני מתתיהו", colorHex: "#9B2660", image: "/cards/card_47.webp", caption: "לפי ספר מקבים א׳, נפל בקרב לאחר שתקף פיל מלחמה.", source: "ספר מקבים א׳ ו׳" },
  { id: 48, title: "שמעון", quartetId: "mattathias_sons", quartetName: "בני מתתיהו", colorHex: "#9B2660", image: "/cards/card_48.webp", caption: "בימיו זכתה יהודה לעצמאות.", source: "ספר מקבים א׳ י״ד" },
];

export const CARD_BY_ID: Record<number, CardDef> = Object.fromEntries(
  CARDS.map((c) => [c.id, c])
);

export const QUARTET_BY_ID: Record<QuartetId, QuartetDef> = Object.fromEntries(
  QUARTETS.map((q) => [q.id, q])
) as Record<QuartetId, QuartetDef>;

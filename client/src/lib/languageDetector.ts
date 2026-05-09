/**
 * Lightweight language detector for conversation text.
 *
 * Strategy:
 * 1. Non-Latin Unicode script ranges → near-perfect accuracy for CJK, Arabic, etc.
 * 2. Distinctive punctuation (¿/¡ → Spanish).
 * 3. Stopword scoring for Latin-script languages.
 *
 * Returns a BCP-47 primary language subtag (e.g. "en", "it", "ja").
 */

// Stopwords are ordered by distinctiveness within each language.
const LATIN_STOPWORDS: Record<string, readonly string[]> = {
	it: [
		"sono",
		"essere",
		"questo",
		"quella",
		"degli",
		"nella",
		"della",
		"anche",
		"però",
		"oppure",
		"molto",
		"bene",
		"grazie",
		"prego",
		"ciao",
		"come",
		"dove",
		"quando",
		"perché",
		"perche",
		"cosa",
		"non",
		"una",
		"uno",
		"gli",
		"hai",
		"siamo",
	],
	es: [
		"estoy",
		"estás",
		"estamos",
		"tengo",
		"tienes",
		"también",
		"porque",
		"cuando",
		"donde",
		"entonces",
		"claro",
		"gracias",
		"hola",
		"muy",
		"pero",
		"para",
		"como",
		"qué",
		"que",
		"una",
		"los",
		"las",
		"del",
		"son",
		"hay",
		"ser",
	],
	fr: [
		"suis",
		"êtes",
		"sommes",
		"aussi",
		"mais",
		"donc",
		"bonjour",
		"merci",
		"oui",
		"bien",
		"très",
		"avec",
		"pour",
		"dans",
		"vous",
		"nous",
		"ils",
		"elles",
		"pas",
		"une",
		"des",
		"les",
		"est",
		"sont",
		"être",
		"avoir",
		"que",
		"qui",
	],
	de: [
		"ich",
		"bin",
		"bist",
		"sind",
		"haben",
		"auch",
		"nicht",
		"eine",
		"einen",
		"einem",
		"einer",
		"dass",
		"wenn",
		"aber",
		"hallo",
		"danke",
		"bitte",
		"wie",
		"was",
		"der",
		"die",
		"das",
		"und",
		"oder",
		"für",
		"mit",
		"von",
		"auf",
	],
	pt: [
		"estou",
		"estás",
		"estamos",
		"tenho",
		"também",
		"porque",
		"quando",
		"onde",
		"então",
		"obrigado",
		"obrigada",
		"olá",
		"muito",
		"mas",
		"para",
		"como",
		"uma",
		"dos",
		"das",
		"não",
		"ele",
		"ela",
		"nos",
		"elas",
		"eles",
	],
	nl: [
		"ben",
		"bent",
		"zijn",
		"hebben",
		"ook",
		"niet",
		"maar",
		"hallo",
		"dank",
		"hoe",
		"wat",
		"een",
		"het",
		"van",
		"voor",
		"met",
		"aan",
		"dat",
		"dit",
		"die",
	],
	sv: [
		"är",
		"har",
		"inte",
		"också",
		"men",
		"hej",
		"tack",
		"hur",
		"vad",
		"och",
		"att",
		"för",
		"med",
		"eller",
		"det",
		"den",
		"som",
		"han",
		"hon",
		"vi",
	],
	pl: [
		"jestem",
		"jesteś",
		"jest",
		"mam",
		"też",
		"ale",
		"cześć",
		"dziękuję",
		"jak",
		"co",
		"nie",
		"tak",
		"się",
		"że",
		"dla",
		"przez",
		"czy",
		"lub",
	],
	tr: [
		"merhaba",
		"teşekkür",
		"evet",
		"hayır",
		"nasıl",
		"nerede",
		"için",
		"ile",
		"çok",
		"ama",
		"bir",
		"ben",
		"sen",
		"var",
	],
	en: [
		"the",
		"and",
		"that",
		"this",
		"with",
		"have",
		"from",
		"hello",
		"thank",
		"please",
		"you",
		"your",
		"are",
		"was",
		"were",
		"been",
		"not",
		"can",
		"will",
		"would",
		"could",
		"should",
		"they",
		"their",
		"what",
		"when",
		"where",
	],
};

// Macron/diacritic-normalised word extraction — keeps accented letters.
const WORD_RE = /[a-záàâäãåæçéèêëíìîïñóòôöõøúùûüýÿšžčřβ]+/gi;

export function detectLanguage(text: string): string {
	if (!text.trim()) return "en";

	// 1. Non-Latin script detection (Unicode ranges).
	if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return "ja"; // Hiragana/Katakana
	if (/[\uAC00-\uD7A3\u1100-\u11FF]/.test(text)) return "ko"; // Hangul
	if (/[\u0400-\u04FF]/.test(text)) return "ru"; // Cyrillic
	if (/[\u0600-\u06FF]/.test(text)) return "ar"; // Arabic
	if (/[\u0590-\u05FF]/.test(text)) return "he"; // Hebrew
	if (/[\u0370-\u03FF]/.test(text)) return "el"; // Greek
	if (/[\u0E00-\u0E7F]/.test(text)) return "th"; // Thai
	if (/[\u0900-\u097F]/.test(text)) return "hi"; // Devanagari
	// CJK without Kana → Mandarin
	if (/[\u4E00-\u9FAF]/.test(text) && !/[\u3040-\u30FF]/.test(text))
		return "zh";

	// 2. Distinctive punctuation.
	if (/[¿¡]/.test(text)) return "es";

	// 3. Stopword scoring for Latin-script languages.
	const words = new Set<string>(text.toLowerCase().match(WORD_RE) ?? []);

	let bestLang = "en";
	let bestScore = 0;

	for (const [lang, stopwords] of Object.entries(LATIN_STOPWORDS)) {
		let score = 0;
		for (const word of stopwords) {
			if (words.has(word)) score++;
		}
		if (score > bestScore) {
			bestScore = score;
			bestLang = lang;
		}
	}

	return bestLang;
}

/**
 * Selects the best available system voice for a given BCP-47 language code.
 *
 * Scoring rules (higher = better):
 *   +20  localService — on-device, fast, works offline
 *   +20  "premium"   — Apple Premium (highest quality on macOS)
 *   +15  "enhanced"  — Apple Enhanced
 *   +15  "neural"    — Windows/Edge neural voices
 *   +12  "natural"   — Windows Natural neural voices
 *   +8   "online"    — Windows Online voices (neural, needs internet)
 *   -20  "compact"   — explicitly low-quality Apple voices
 *   -50  known macOS novelty/effect voice names
 */

// macOS novelty and sound-effect voices — useless for language learning.
const NOVELTY_VOICE_NAMES = new Set([
	"albert",
	"bad news",
	"bahh",
	"bells",
	"boing",
	"bubbles",
	"cellos",
	"deranged",
	"good news",
	"hysterical",
	"jester",
	"junior",
	"kathy",
	"organ",
	"pipe organ",
	"ralph",
	"superstar",
	"trinoids",
	"whisper",
	"wobble",
	"zarvox",
]);

const POSITIVE_QUALITY_MARKERS = [
	{ keyword: "premium", points: 20 },
	{ keyword: "enhanced", points: 15 },
	{ keyword: "neural", points: 15 },
	{ keyword: "natural", points: 12 },
	{ keyword: "online", points: 8 },
];

const NEGATIVE_QUALITY_MARKERS = [{ keyword: "compact", points: -20 }];

export interface VoiceInfo {
	voice: SpeechSynthesisVoice;
	/** Human-readable quality tier label, e.g. "Premium", "Enhanced", "Neural", "Standard". */
	qualityLabel: string;
	/** Flag emoji derived from the BCP-47 country code, e.g. "🇮🇹" for "it-IT". */
	flag: string;
	/** Numeric score used internally for ranking. */
	score: number;
}

let voiceCache: SpeechSynthesisVoice[] = [];

function refreshVoiceCache(): void {
	voiceCache = window.speechSynthesis.getVoices();
}

// Populate the cache immediately and keep it fresh.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
	refreshVoiceCache();
	window.speechSynthesis.addEventListener("voiceschanged", refreshVoiceCache);
}

function scoreVoice(voice: SpeechSynthesisVoice): number {
	let score = 0;
	const nameLower = voice.name.toLowerCase();

	// On-device voices are strongly preferred.
	if (voice.localService) score += 20;

	// Check if this is a known novelty/effect voice.
	const baseName = nameLower.replace(/\s*\(.*\)/, "").trim();
	if (NOVELTY_VOICE_NAMES.has(baseName)) return -999;

	for (const { keyword, points } of POSITIVE_QUALITY_MARKERS) {
		if (nameLower.includes(keyword)) score += points;
	}
	for (const { keyword, points } of NEGATIVE_QUALITY_MARKERS) {
		if (nameLower.includes(keyword)) score += points;
	}

	return score;
}

/**
 * Extracts a human-readable quality label from a voice name.
 * Returns the first matching tier keyword, capitalised. Falls back to "Standard".
 */
export function getQualityLabel(voice: SpeechSynthesisVoice): string {
	const nameLower = voice.name.toLowerCase();

	if (nameLower.includes("premium")) return "Premium";
	if (nameLower.includes("enhanced")) return "Enhanced";
	if (nameLower.includes("neural")) return "Neural";
	if (nameLower.includes("natural")) return "Natural";
	if (nameLower.includes("online")) return "Online";
	if (nameLower.includes("compact")) return "Compact";

	return "Standard";
}

/**
 * Converts a BCP-47 language tag to a flag emoji using the country/region
 * subtag (e.g. "it-IT" → "🇮🇹", "en-US" → "🇺🇸").
 * Returns "🌐" when no country subtag is present or the tag is unrecognised.
 */
export function langToFlag(lang: string): string {
	const parts = lang.split("-");
	// The region subtag is typically the second part: "en-US" → "US".
	// Some tags have three parts: "zh-Hans-CN" → we want the last part.
	const regionCode = parts.length >= 2 ? parts[parts.length - 1] : "";

	if (regionCode.length !== 2) return "🌐";

	const upperCode = regionCode.toUpperCase();

	// Regional indicator symbols start at U+1F1E6 (🇦) for 'A'.
	const flagOffset = 0x1f1e6 - 65; // 65 = char code of 'A'
	const firstChar = upperCode.charCodeAt(0);
	const secondChar = upperCode.charCodeAt(1);

	if (firstChar < 65 || firstChar > 90 || secondChar < 65 || secondChar > 90) {
		return "🌐";
	}

	return (
		String.fromCodePoint(flagOffset + firstChar) +
		String.fromCodePoint(flagOffset + secondChar)
	);
}

/**
 * Returns all available voices enriched with quality label, flag, and score.
 * Novelty voices are excluded. Results are sorted best-first.
 */
export function getAllVoicesWithInfo(): VoiceInfo[] {
	const voices =
		voiceCache.length > 0 ? voiceCache : window.speechSynthesis.getVoices();

	return voices
		.map((voice) => ({
			voice,
			qualityLabel: getQualityLabel(voice),
			flag: langToFlag(voice.lang),
			score: scoreVoice(voice),
		}))
		.filter((info) => info.score > -100) // strip novelty voices
		.sort((a, b) => b.score - a.score);
}

/**
 * Looks up a voice by its `voiceURI`. Returns null if not found.
 */
export function findVoiceByURI(uri: string): SpeechSynthesisVoice | null {
	const voices =
		voiceCache.length > 0 ? voiceCache : window.speechSynthesis.getVoices();

	return voices.find((v) => v.voiceURI === uri) ?? null;
}

/**
 * Returns the highest-scoring voice whose language starts with `langCode`.
 * Returns null if no voice is found — the browser will use its default.
 */
export function selectBestVoice(langCode: string): SpeechSynthesisVoice | null {
	// Refresh in case the cache hasn't populated yet (some browsers are async).
	const voices =
		voiceCache.length > 0 ? voiceCache : window.speechSynthesis.getVoices();

	if (voices.length === 0) return null;

	const lowerLang = langCode.toLowerCase();
	const candidates = voices.filter((v) =>
		v.lang.toLowerCase().startsWith(lowerLang),
	);

	if (candidates.length === 0) return null;

	return candidates
		.map((voice) => ({ voice, score: scoreVoice(voice) }))
		.sort((a, b) => b.score - a.score)[0].voice;
}

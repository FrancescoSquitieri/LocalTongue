export const SUPPORTED_LANGUAGES = [
	{ name: "English", code: "en-US", flag: "🇺🇸" },
	{ name: "Italian", code: "it-IT", flag: "🇮🇹" },
	{ name: "Spanish", code: "es-ES", flag: "🇪🇸" },
	{ name: "French", code: "fr-FR", flag: "🇫🇷" },
	{ name: "German", code: "de-DE", flag: "🇩🇪" },
	{ name: "Portuguese", code: "pt-PT", flag: "🇵🇹" },
	{ name: "Japanese", code: "ja-JP", flag: "🇯🇵" },
	{ name: "Mandarin", code: "zh-CN", flag: "🇨🇳" },
	{ name: "Korean", code: "ko-KR", flag: "🇰🇷" },
	{ name: "Russian", code: "ru-RU", flag: "🇷🇺" },
	{ name: "Arabic", code: "ar-SA", flag: "🇸🇦" },
	{ name: "Dutch", code: "nl-NL", flag: "🇳🇱" },
	{ name: "Polish", code: "pl-PL", flag: "🇵🇱" },
] as const;

export const LANGUAGE_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const CONVERSATION_TOPICS = [
	"Daily Life",
	"Travel",
	"Sport",
	"Cinema & TV",
	"Music",
	"Food & Cooking",
	"Technology",
	"Business",
	"History",
	"Science",
	"Art & Culture",
	"Health & Fitness",
	"Nature",
	"Literature",
] as const;

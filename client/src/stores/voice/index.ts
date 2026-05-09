import { create } from "zustand";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

interface VoiceStore {
	voiceState: VoiceState;
	interimTranscript: string;
	/** BCP-47 tag of the detected conversation language (e.g. "it-IT").
	 *  Set after the first agent response; used to improve subsequent STT accuracy. */
	conversationLanguage: string;
	/** voiceURI of the user-selected voice. Null means auto-detect. */
	preferredVoiceURI: string | null;
	setVoiceState: (state: VoiceState) => void;
	setInterimTranscript: (text: string) => void;
	setConversationLanguage: (lang: string) => void;
	setPreferredVoiceURI: (uri: string | null) => void;
}

export const useVoiceStore = create<VoiceStore>((set) => ({
	voiceState: "idle",
	interimTranscript: "",
	conversationLanguage: "",
	preferredVoiceURI: null,
	setVoiceState: (voiceState) => set({ voiceState }),
	setInterimTranscript: (interimTranscript) => set({ interimTranscript }),
	setConversationLanguage: (conversationLanguage) =>
		set({ conversationLanguage }),
	setPreferredVoiceURI: (preferredVoiceURI) => set({ preferredVoiceURI }),
}));

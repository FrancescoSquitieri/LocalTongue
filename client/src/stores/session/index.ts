import { create } from "zustand";

import type { SessionResponse } from "@/types";

interface SessionStore {
	activeSession: SessionResponse | null;
	isSessionReady: boolean;
	setActiveSession: (session: SessionResponse | null) => void;
	setSessionReady: (ready: boolean) => void;
	clearSession: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
	activeSession: null,
	isSessionReady: false,
	setActiveSession: (activeSession) => set({ activeSession }),
	setSessionReady: (isSessionReady) => set({ isSessionReady }),
	clearSession: () => set({ activeSession: null, isSessionReady: false }),
}));

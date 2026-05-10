import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GlobalNav from "@/components/GlobalNav/Index";
import { Toaster } from "@/components/ui/sonner";
import { useAgentSpeech } from "@/hooks/useAgentSpeech";
import Home from "@/pages/Home/Index";
import Quiz from "@/pages/Quiz/Index";
import QuizDetail from "@/pages/QuizDetail/Index";
import SessionDetail from "@/pages/SessionDetail/Index";
import Sessions from "@/pages/Sessions/Index";
import { websocketService } from "@/services/websocket";

function App() {
	useAgentSpeech();

	useEffect(() => {
		websocketService.connect();
		return () => {
			websocketService.disconnect();
		};
	}, []);

	return (
		<>
			<Toaster />
			<BrowserRouter>
				<GlobalNav />
				<div className="pt-14">
					<Routes>
						<Route path="/" element={<Home />} />
						<Route path="/sessions" element={<Sessions />} />
						<Route path="/sessions/:id" element={<SessionDetail />} />
						<Route path="/quiz" element={<Quiz />} />
						<Route path="/quiz/:id" element={<QuizDetail />} />
					</Routes>
				</div>
			</BrowserRouter>
		</>
	);
}

export default App;

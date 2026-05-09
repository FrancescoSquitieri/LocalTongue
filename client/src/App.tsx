import { useEffect } from "react";

import { BrowserRouter, Route, Routes } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home/Index";
import { websocketService } from "@/services/websocket";

function App() {
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
				<Routes>
					<Route path="/" element={<Home />} />
				</Routes>
			</BrowserRouter>
		</>
	);
}

export default App;

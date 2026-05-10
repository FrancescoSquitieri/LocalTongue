import { GraduationCap, History, Home } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
	{ to: "/", icon: Home, label: "Home", exact: true },
	{ to: "/sessions", icon: History, label: "Sessions", exact: false },
	{ to: "/quiz", icon: GraduationCap, label: "Quiz", exact: false },
] as const;

export default function GlobalNav() {
	return (
		<nav className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
			<div className="flex h-14 items-center justify-center gap-1">
				{NAV_LINKS.map(({ to, icon: Icon, label, exact }) => (
					<NavLink key={to} to={to} end={exact}>
						{({ isActive }) => (
							<Button
								type="button"
								variant="ghost"
								className={cn(
									"h-10 gap-2 px-5 text-sm font-medium",
									isActive
										? "bg-muted text-foreground"
										: "text-muted-foreground",
								)}
							>
								<Icon className="h-4 w-4" />
								{label}
							</Button>
						)}
					</NavLink>
				))}
			</div>
		</nav>
	);
}

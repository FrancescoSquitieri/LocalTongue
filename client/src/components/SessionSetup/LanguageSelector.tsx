import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_LANGUAGES } from "@/lib/constants";

interface LanguageSelectorProps {
	value: string;
	onChange: (value: string) => void;
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
	return (
		<div className="flex flex-col gap-1.5">
			<p className="text-xs font-medium text-muted-foreground">Language</p>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className="w-full">
					<SelectValue placeholder="Select a language" />
				</SelectTrigger>
				<SelectContent position="popper">
					{SUPPORTED_LANGUAGES.map((language) => (
						<SelectItem key={language.code} value={language.code}>
							<span className="flex items-center gap-2">
								<span>{language.flag}</span>
								<span>{language.name}</span>
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

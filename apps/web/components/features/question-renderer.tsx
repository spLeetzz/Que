"use client";

import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Slider } from "~/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";

interface QuestionRendererProps {
	item: {
		id: string;
		value: string;
		questionType: "text" | "slider" | "options" | null;
		required: boolean;
		metadata?: any;
	};
	answer: string[];
	onChange: (value: string[]) => void;
	error?: string;
}

export function QuestionRenderer({ item, answer, onChange, error }: QuestionRendererProps) {
	const renderInput = () => {
		switch (item.questionType) {
			case "text":
				return renderTextInput();
			case "slider":
				return renderSliderInput();
			case "options":
				return renderOptionsInput();
			default:
				return <Input value={answer[0] ?? ""} onChange={(e) => onChange([e.target.value])} placeholder="Your answer" />;
		}
	};

	const renderTextInput = () => {
		const subtype = item.metadata?.subtype ?? "short";
		switch (subtype) {
			case "long":
				return <Textarea value={answer[0] ?? ""} onChange={(e) => onChange([e.target.value])} placeholder="Your answer" rows={4} />;
			case "email":
				return <Input type="email" value={answer[0] ?? ""} onChange={(e) => onChange([e.target.value])} placeholder="email@example.com" />;
			case "number":
				return <Input type="number" value={answer[0] ?? ""} onChange={(e) => onChange([e.target.value])} placeholder="0" />;
			case "date":
				return <Input type="date" value={answer[0] ?? ""} onChange={(e) => onChange([e.target.value])} />;
			default:
				return <Input value={answer[0] ?? ""} onChange={(e) => onChange([e.target.value])} placeholder="Your answer" />;
		}
	};

	const renderSliderInput = () => {
		const min = item.metadata?.min ?? 0;
		const max = item.metadata?.max ?? 100;
		const val = answer[0] ? Number(answer[0]) : min;
		return (
			<div className="space-y-2">
				<Slider min={min} max={max} step={1} value={[val]} onValueChange={([v]) => onChange([String(v)])} />
				<div className="flex justify-between text-xs text-muted-foreground">
					<span>{min}</span>
					<span className="font-medium text-foreground">{val}</span>
					<span>{max}</span>
				</div>
			</div>
		);
	};

	const renderOptionsInput = () => {
		const choices: string[] = item.metadata?.choices ?? [];
		const multiple = item.metadata?.multiple ?? false;
		const isDropdown = item.metadata?.isDropdown ?? false;

		if (isDropdown && !multiple) {
			return (
				<Select value={answer[0] ?? ""} onValueChange={(v) => onChange([v])}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Select an option" />
					</SelectTrigger>
					<SelectContent>
						{choices.map((choice) => (
							<SelectItem key={choice} value={choice}>
								{choice}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			);
		}

		if (multiple) {
			return (
				<div className="space-y-2">
					{choices.map((choice) => (
						<div key={choice} className="flex items-center gap-2">
							<Checkbox
								id={`${item.id}-${choice}`}
								checked={answer.includes(choice)}
								onCheckedChange={(checked) => {
									if (checked) onChange([...answer, choice]);
									else onChange(answer.filter((a) => a !== choice));
								}}
							/>
							<Label htmlFor={`${item.id}-${choice}`} className="cursor-pointer">{choice}</Label>
						</div>
					))}
				</div>
			);
		}

		return (
			<RadioGroup value={answer[0] ?? ""} onValueChange={(v) => onChange([v])}>
				{choices.map((choice) => (
					<div key={choice} className="flex items-center gap-2">
						<RadioGroupItem value={choice} id={`${item.id}-${choice}`} />
						<Label htmlFor={`${item.id}-${choice}`} className="cursor-pointer">{choice}</Label>
					</div>
				))}
			</RadioGroup>
		);
	};

	return (
		<div className="space-y-2">
			<Label className="text-sm font-medium">
				{item.value}
				{item.required && <span className="text-destructive ml-1">*</span>}
			</Label>
			{renderInput()}
			{error && <p className="text-sm text-destructive">{error}</p>}
		</div>
	);
}

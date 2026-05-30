"use client";

import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Slider } from "~/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { 
	Star, 
	Mail, 
	Phone, 
	Globe, 
	Calendar, 
	Clock, 
	ChevronDown, 
	Hash, 
	Link2,
	AlertCircle,
	Smile
} from "lucide-react";
import { cn } from "~/lib/utils";

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
				return (
					<div className="relative">
						<Input 
							value={answer[0] ?? ""} 
							onChange={(e) => onChange([e.target.value])} 
							placeholder="Your answer" 
							className="h-11 px-4 border-muted-foreground/20 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all bg-background/50 backdrop-blur-sm shadow-sm"
						/>
					</div>
				);
		}
	};

	const renderTextInput = () => {
		const inputType = item.metadata?.inputType ?? item.metadata?.subtype ?? "short";
		const placeholder = item.metadata?.placeholder ?? "Your answer";

		// Common styles for inputs
		const inputClassName = "h-11 px-4 border-muted-foreground/20 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all bg-background/50 backdrop-blur-sm shadow-sm";

		switch (inputType) {
			case "long":
				return (
					<Textarea 
						value={answer[0] ?? ""} 
						onChange={(e) => onChange([e.target.value])} 
						placeholder={placeholder || "Type your detailed answer here..."}
						rows={4}
						className="resize-none py-3 px-4 border-muted-foreground/20 rounded-xl focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary transition-all bg-background/50 backdrop-blur-sm shadow-sm"
					/>
				);
			case "email":
				return (
					<div className="relative flex items-center">
						<Mail className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="email" 
							value={answer[0] ?? ""} 
							onChange={(e) => onChange([e.target.value])} 
							placeholder={placeholder || "email@example.com"}
							className={cn(inputClassName, "pl-11")}
						/>
					</div>
				);
			case "number":
				return (
					<div className="relative flex items-center">
						<Hash className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="number" 
							value={answer[0] ?? ""} 
							onChange={(e) => onChange([e.target.value])} 
							placeholder={placeholder || "0"}
							step="any"
							className={cn(inputClassName, "pl-11")}
						/>
					</div>
				);
			case "date":
				return (
					<div className="relative flex items-center">
						<Calendar className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="date" 
							value={answer[0] ?? ""} 
							onChange={(e) => onChange([e.target.value])}
							className={cn(inputClassName, "pl-11 pr-4 appearance-none cursor-pointer")}
						/>
					</div>
				);
			case "time":
				return (
					<div className="relative flex items-center">
						<Clock className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="time" 
							value={answer[0] ?? ""} 
							onChange={(e) => onChange([e.target.value])}
							className={cn(inputClassName, "pl-11 pr-4 cursor-pointer")}
						/>
					</div>
				);
			case "datetime":
				return (
					<div className="relative flex items-center">
						<Calendar className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="datetime-local" 
							value={answer[0] ?? ""} 
							onChange={(e) => onChange([e.target.value])}
							className={cn(inputClassName, "pl-11 pr-4 cursor-pointer")}
						/>
					</div>
				);
			case "url":
				return (
					<div className="relative flex items-center">
						<Globe className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="url" 
							value={answer[0] ?? ""} 
							onChange={(e) => onChange([e.target.value])} 
							placeholder={placeholder || "https://example.com"}
							className={cn(inputClassName, "pl-11")}
						/>
					</div>
				);
			case "phone":
				return (
					<div className="relative flex items-center">
						<Phone className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
						<Input 
							type="tel" 
							value={answer[0] ?? ""} 
							onChange={(e) => onChange([e.target.value])} 
							placeholder={placeholder || "+1 (555) 000-0000"}
							className={cn(inputClassName, "pl-11")}
						/>
					</div>
				);
			case "short":
			default:
				return (
					<Input 
						value={answer[0] ?? ""} 
						onChange={(e) => onChange([e.target.value])} 
						placeholder={placeholder || "Your answer"}
						className={inputClassName}
					/>
				);
		}
	};

	const renderSliderInput = () => {
		const min = item.metadata?.min ?? 0;
		const max = item.metadata?.max ?? 100;
		const val = answer[0] ? Number(answer[0]) : min;
		
		return (
			<div className="space-y-4 pt-3 pb-2 px-1">
				<Slider 
					min={min} 
					max={max} 
					step={0.01}
					value={[val]} 
					onValueChange={([v]) => onChange([String(v)])} 
					className="w-full cursor-pointer py-1"
				/>
				<div className="flex justify-between items-center text-xs text-muted-foreground px-0.5">
					<span className="bg-muted px-2 py-0.5 rounded font-mono">{min}</span>
					<span className="font-semibold text-lg text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 shadow-sm font-mono min-w-16 text-center">
						{val}
					</span>
					<span className="bg-muted px-2 py-0.5 rounded font-mono">{max}</span>
				</div>
			</div>
		);
	};

	const renderOptionsInput = () => {
		const inputType = item.metadata?.inputType ?? (item.metadata?.isDropdown ? "select" : (item.metadata?.multiple ? "checkbox" : "radio"));
		const choices: string[] = item.metadata?.choices ?? [];
		const allowOther = item.metadata?.allowOther ?? false;

		// Rating type
		if (inputType === "rating") {
			return renderRatingInput();
		}

		// Select/Dropdown type
		if (inputType === "select") {
			return (
				<Select value={answer[0] ?? ""} onValueChange={(v) => onChange([v])}>
					<SelectTrigger className="w-full h-11 border-muted-foreground/20 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-background/50 backdrop-blur-sm text-left">
						<SelectValue placeholder="Select an option" />
					</SelectTrigger>
					<SelectContent className="rounded-xl border border-muted-foreground/10 shadow-lg">
						{choices.map((choice, idx) => (
							<SelectItem key={`${choice}-${idx}`} value={choice} className="py-2.5 rounded-lg my-0.5">
								{choice}
							</SelectItem>
						))}
						{allowOther && (
							<SelectItem value="__other__" className="py-2.5 rounded-lg my-0.5 font-medium text-primary">
								Other...
							</SelectItem>
						)}
					</SelectContent>
				</Select>
			);
		}

		// Checkbox type (multiple selection)
		if (inputType === "checkbox") {
			const otherValue = answer.find(a => !choices.includes(a) && a !== "__other__");
			const hasOther = answer.includes("__other__") || !!otherValue;

			return (
				<div className="space-y-2.5">
					{choices.map((choice, idx) => {
						const isChecked = answer.includes(choice);
						return (
							<div 
								key={`${choice}-${idx}`} 
								onClick={() => {
									if (isChecked) {
										onChange(answer.filter((a) => a !== choice));
									} else {
										onChange([...answer.filter(a => a !== "__other__"), choice]);
									}
								}}
								className={cn(
									"flex items-center gap-3 p-3.5 rounded-xl border border-muted-foreground/15 bg-background/40 hover:bg-accent/40 hover:border-muted-foreground/30 transition-all cursor-pointer select-none",
									isChecked && "border-primary bg-primary/5 shadow-sm"
								)}
							>
								<Checkbox
									id={`${item.id}-${choice}`}
									checked={isChecked}
									onCheckedChange={(checked) => {
										if (checked) {
											onChange([...answer.filter(a => a !== "__other__"), choice]);
										} else {
											onChange(answer.filter((a) => a !== choice));
										}
									}}
									className="size-5 rounded-md border-muted-foreground/35 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
								/>
								<Label 
									htmlFor={`${item.id}-${choice}`} 
									className="cursor-pointer font-normal text-sm flex-1"
									onClick={(e) => e.preventDefault()} // Let the div click handle it
								>
									{choice}
								</Label>
							</div>
						);
					})}
					
					{allowOther && (
						<div 
							className={cn(
								"space-y-2.5 p-3.5 rounded-xl border border-muted-foreground/15 bg-background/40 hover:bg-accent/40 hover:border-muted-foreground/30 transition-all cursor-pointer",
								hasOther && "border-primary bg-primary/5 shadow-sm"
							)}
							onClick={() => {
								if (!hasOther) {
									onChange([...answer.filter(a => !choices.includes(a)), "__other__"]);
								}
							}}
						>
							<div className="flex items-center gap-3 select-none">
								<Checkbox
									id={`${item.id}-other`}
									checked={hasOther}
									onCheckedChange={(checked) => {
										if (checked) {
											onChange([...answer.filter(a => !choices.includes(a)), "__other__"]);
										} else {
											onChange(answer.filter(a => choices.includes(a)));
										}
									}}
									className="size-5 rounded-md border-muted-foreground/35 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
									onClick={(e) => e.stopPropagation()} // Stop bubbling to div click
								/>
								<Label 
									htmlFor={`${item.id}-other`} 
									className="cursor-pointer font-normal text-sm flex-1"
									onClick={(e) => e.preventDefault()} // Let the div click handle it
								>
									Other
								</Label>
							</div>
							{hasOther && (
								<div className="ml-8 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
									<Input
										value={otherValue ?? ""}
										onChange={(e) => {
											const filtered = answer.filter(a => choices.includes(a) || a === "__other__");
											onChange([...filtered, e.target.value]);
										}}
										placeholder="Please specify your answer"
										className="h-9 px-3 border-muted-foreground/20 rounded-lg focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary bg-background"
										autoFocus
									/>
								</div>
							)}
						</div>
					)}
				</div>
			);
		}

		// Radio type (single selection) - default
		const otherValue = !choices.includes(answer[0] ?? "") && answer[0] !== "__other__" ? answer[0] : "";
		const hasOther = answer[0] === "__other__" || !!otherValue;

		return (
			<RadioGroup 
				value={choices.includes(answer[0] ?? "") ? answer[0] : (hasOther ? "__other__" : "")} 
				onValueChange={(v) => {
					if (v === "__other__") {
						onChange(["__other__"]);
					} else {
						onChange([v]);
					}
				}}
				className="space-y-2.5"
			>
				{choices.map((choice, idx) => {
					const isSelected = answer[0] === choice;
					return (
						<div 
							key={`${choice}-${idx}`} 
							onClick={() => onChange([choice])}
							className={cn(
								"flex items-center gap-3 p-3.5 rounded-xl border border-muted-foreground/15 bg-background/40 hover:bg-accent/40 hover:border-muted-foreground/30 transition-all cursor-pointer select-none",
								isSelected && "border-primary bg-primary/5 shadow-sm"
							)}
						>
							<RadioGroupItem 
								value={choice} 
								id={`${item.id}-${choice}`} 
								className="size-5 border-muted-foreground/35 text-primary focus-visible:ring-primary"
								onClick={(e) => e.stopPropagation()} // Stop bubbling to div click
							/>
							<Label 
								htmlFor={`${item.id}-${choice}`} 
								className="cursor-pointer font-normal text-sm flex-1"
								onClick={(e) => e.preventDefault()} // Let the div click handle it
							>
								{choice}
							</Label>
						</div>
					);
				})}
				
				{allowOther && (
					<div 
						className={cn(
							"space-y-2.5 p-3.5 rounded-xl border border-muted-foreground/15 bg-background/40 hover:bg-accent/40 hover:border-muted-foreground/30 transition-all cursor-pointer",
							hasOther && "border-primary bg-primary/5 shadow-sm"
						)}
						onClick={() => onChange(["__other__"])}
					>
						<div className="flex items-center gap-3 select-none">
							<RadioGroupItem 
								value="__other__" 
								id={`${item.id}-other`} 
								className="size-5 border-muted-foreground/35 text-primary focus-visible:ring-primary"
								onClick={(e) => e.stopPropagation()} // Stop bubbling to div click
							/>
							<Label 
								htmlFor={`${item.id}-other`} 
								className="cursor-pointer font-normal text-sm flex-1"
								onClick={(e) => e.preventDefault()} // Let the div click handle it
							>
								Other
							</Label>
						</div>
						{hasOther && (
							<div className="ml-8 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
								<Input
									value={otherValue}
									onChange={(e) => onChange([e.target.value])}
									placeholder="Please specify your answer"
									className="h-9 px-3 border-muted-foreground/20 rounded-lg focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary bg-background"
									autoFocus
								/>
							</div>
						)}
					</div>
				)}
			</RadioGroup>
		);
	};

	const renderRatingInput = () => {
		const maxRating = item.metadata?.maxRating ?? 5;
		const currentRating = answer[0] ? Number(answer[0]) : 0;

		return (
			<div className="flex flex-col gap-2 pt-1">
				<div className="flex items-center gap-2">
					{Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => {
						const isFilled = rating <= currentRating;
						return (
							<button
								key={rating}
								type="button"
								onClick={() => onChange([String(rating)])}
								className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg p-1.5 transition-all hover:scale-120 duration-150 group"
							>
								<Star
									className={cn(
										"h-8 w-8 transition-all duration-200 ease-out",
										isFilled
											? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.35)]"
											: "fill-none text-muted-foreground/50 hover:text-amber-400 group-hover:scale-110"
									)}
								/>
							</button>
						);
					})}
				</div>
				{currentRating > 0 && (
					<div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 max-w-fit mt-1 animate-in zoom-in-95 duration-150">
						<Smile className="size-3.5 fill-amber-500/20" />
						<span>Selected {currentRating} out of {maxRating}</span>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="space-y-3 group/question p-4 sm:p-5 rounded-2xl border border-muted-foreground/10 bg-card/60 backdrop-blur-sm shadow-sm transition-all duration-300 hover:shadow-md hover:border-muted-foreground/15">
			<Label className="text-base font-semibold tracking-tight text-foreground flex items-start gap-1">
				<span>{item.value}</span>
				{item.required && <span className="text-destructive font-bold text-sm ml-0.5 animate-pulse" title="Required">*</span>}
			</Label>
			<div className="pt-1">{renderInput()}</div>
			{error && (
				<div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3.5 mt-2 animate-in slide-in-from-top-2 duration-200">
					<AlertCircle className="size-4 shrink-0 text-destructive" />
					<span className="font-medium">{error}</span>
				</div>
			)}
		</div>
	);
}

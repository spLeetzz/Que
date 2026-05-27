"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { useItems } from "~/hooks/use-items";
import { useCreateItem } from "~/hooks/use-create-item";
import { useDeleteItem } from "~/hooks/use-delete-item";
import { useUpdateItem } from "~/hooks/use-update-item";
import { LoadingSpinner } from "~/components/shared/loading-spinner";
import {
	PlusIcon,
	TrashIcon,
	Settings2Icon,
	ChevronUpIcon,
	GripVerticalIcon,
	AlertCircleIcon,
} from "lucide-react";

export type FieldType =
	| "short_answer"
	| "paragraph"
	| "number"
	| "email"
	| "date"
	| "slider"
	| "radio"
	| "checkboxes"
	| "dropdown";

interface ItemEditorProps {
	eventId: string;
	eventType: "form" | "poll" | "banter";
}

const FIELD_TYPES: Record<
	FieldType,
	{
		label: string;
		questionType: "text" | "slider" | "options";
		getDefaultMetadata: () => any;
	}
> = {
	short_answer: {
		label: "Short Answer",
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "short" }),
	},
	paragraph: {
		label: "Paragraph / Long Text",
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "long" }),
	},
	number: {
		label: "Number Input",
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "number" }),
	},
	email: {
		label: "Email Address",
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "email" }),
	},
	date: {
		label: "Date Picker",
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "date" }),
	},
	slider: {
		label: "Slider Range",
		questionType: "slider",
		getDefaultMetadata: () => ({ min: 0, max: 100 }),
	},
	radio: {
		label: "Single Choice (Radio)",
		questionType: "options",
		getDefaultMetadata: () => ({ multiple: false, choices: ["Option 1", "Option 2"] }),
	},
	checkboxes: {
		label: "Multiple Choice (Checkboxes)",
		questionType: "options",
		getDefaultMetadata: () => ({ multiple: true, choices: ["Option 1", "Option 2"] }),
	},
	dropdown: {
		label: "Select Dropdown",
		questionType: "options",
		getDefaultMetadata: () => ({ multiple: false, choices: ["Option 1", "Option 2"], isDropdown: true }),
	},
};

function getItemFieldType(item: any): FieldType {
	if (item.questionType === "slider") return "slider";
	if (item.questionType === "options") {
		if (item.metadata?.isDropdown) return "dropdown";
		return item.metadata?.multiple ? "checkboxes" : "radio";
	}
	if (item.questionType === "text") {
		const sub = item.metadata?.subtype;
		if (sub === "long") return "paragraph";
		if (sub === "number") return "number";
		if (sub === "email") return "email";
		if (sub === "date") return "date";
		return "short_answer";
	}
	return "short_answer";
}

export function ItemEditor({ eventId, eventType }: ItemEditorProps) {
	const { data: items, isLoading } = useItems(eventId);
	const createItem = useCreateItem();

	// Form states
	const [newValue, setNewValue] = useState("");
	const [newType, setNewType] = useState<FieldType>("short_answer");
	const [newRequired, setNewRequired] = useState(false);

	// Dynamic sub-states for slider creation
	const [newMin, setNewMin] = useState(0);
	const [newMax, setNewMax] = useState(100);

	// Dynamic sub-states for choices creation
	const [newChoices, setNewChoices] = useState<string[]>(["Option 1", "Option 2"]);

	const handleAddNewChoice = () => {
		setNewChoices([...newChoices, `Option ${newChoices.length + 1}`]);
	};

	const handleUpdateNewChoice = (idx: number, text: string) => {
		const updated = [...newChoices];
		updated[idx] = text;
		setNewChoices(updated);
	};

	const handleRemoveNewChoice = (idx: number) => {
		setNewChoices(newChoices.filter((_, i) => i !== idx));
	};

	const handleAddItem = async () => {
		if (!newValue.trim()) return;
		const config = FIELD_TYPES[newType];
		
		let metadata = config.getDefaultMetadata();
		if (newType === "slider") {
			metadata = { min: newMin, max: newMax };
		} else if (["radio", "checkboxes", "dropdown"].includes(newType)) {
			metadata = {
				...metadata,
				choices: newChoices.map((c) => c.trim()).filter(Boolean),
			};
		}

		await createItem.mutateAsync({
			eventId,
			category: "question",
			value: newValue.trim(),
			questionType: config.questionType,
			required: newRequired,
			metadata,
		});

		// Reset states
		setNewValue("");
		setNewRequired(false);
		setNewMin(0);
		setNewMax(100);
		setNewChoices(["Option 1", "Option 2"]);
	};

	if (isLoading) {
		return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
	}

	const questionItems = (items ?? []).filter((i: any) => i.category === "question");

	// Validation logic: restrict adding new items if existing ones are invalid
	const hasInvalidItems = questionItems.some((item: any) => {
		if (!item.value?.trim()) return true;
		const type = getItemFieldType(item);
		if (["radio", "checkboxes", "dropdown"].includes(type)) {
			const choices: string[] = item.metadata?.choices || [];
			if (choices.length === 0) return true;
			if (choices.some((c) => !c.trim())) return true;
		}
		return false;
	});

	return (
		<div className="space-y-4">
			<div className="space-y-3">
				{questionItems.length === 0 ? (
					<p className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
						No questions added yet. Create one below to start building your event form!
					</p>
				) : (
					questionItems.map((item: any) => (
						<ItemRow key={item.id} item={item} eventId={eventId} />
					))
				)}
			</div>

			<Card className="border border-primary/20 bg-primary/5">
				<CardContent className="pt-4 space-y-4">
					<div className="flex flex-col sm:flex-row gap-3">
						<div className="flex-1 space-y-1">
							<Label htmlFor="new-question-text" className="text-xs font-semibold">New Question Title</Label>
							<Input
								id="new-question-text"
								value={newValue}
								onChange={(e) => setNewValue(e.target.value)}
								placeholder="What would you like to ask?"
								className="bg-background"
							/>
						</div>
						<div className="w-full sm:w-[220px] space-y-1">
							<Label htmlFor="new-question-type" className="text-xs font-semibold">Question Type</Label>
							<Select value={newType} onValueChange={(v) => setNewType(v as FieldType)}>
								<SelectTrigger id="new-question-type" className="bg-background">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{Object.entries(FIELD_TYPES).map(([key, value]) => (
										<SelectItem key={key} value={key}>
											{value.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* DYNAMIC SUB-CONFIGURATIONS FOR NEW QUESTION */}
					{newType === "slider" && (
						<div className="grid grid-cols-2 gap-4 border-t pt-3">
							<div className="space-y-1">
								<Label className="text-xs font-semibold">Slider Min Boundary</Label>
								<Input
									type="number"
									value={newMin}
									onChange={(e) => setNewMin(Number(e.target.value))}
									className="bg-background h-8 text-xs"
								/>
							</div>
							<div className="space-y-1">
								<Label className="text-xs font-semibold">Slider Max Boundary</Label>
								<Input
									type="number"
									value={newMax}
									onChange={(e) => setNewMax(Number(e.target.value))}
									className="bg-background h-8 text-xs"
								/>
							</div>
						</div>
					)}

					{["radio", "checkboxes", "dropdown"].includes(newType) && (
						<div className="space-y-2 border-t pt-3">
							<div className="flex items-center justify-between">
								<Label className="text-xs font-semibold text-muted-foreground">Options / Choices</Label>
								<Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={handleAddNewChoice}>
									Add Option
								</Button>
							</div>
							<div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
								{newChoices.map((choice, idx) => (
									<div key={idx} className="flex items-center gap-2">
										<span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
										<Input
											value={choice}
											onChange={(e) => handleUpdateNewChoice(idx, e.target.value)}
											className="h-8 py-1 px-2 flex-1 bg-background text-xs"
											placeholder={`Option ${idx + 1}`}
										/>
										<Button
											variant="ghost"
											size="icon"
											className="size-8 text-muted-foreground hover:text-destructive"
											onClick={() => handleRemoveNewChoice(idx)}
											disabled={newChoices.length <= 1}
										>
											<TrashIcon className="size-3.5" />
										</Button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* WARNING BANNER FOR INVALID ITEMS */}
					{hasInvalidItems && (
						<div className="flex items-center gap-2 text-destructive border border-destructive/20 bg-destructive/5 rounded-lg p-3 text-xs">
							<AlertCircleIcon className="size-4 shrink-0" />
							<span>Please fix empty questions or choices in existing fields before adding new questions.</span>
						</div>
					)}

					<div className="flex items-center justify-between border-t pt-3">
						<div className="flex items-center gap-2">
							<Switch id="newRequired" checked={newRequired} onCheckedChange={setNewRequired} />
							<Label htmlFor="newRequired" className="text-sm cursor-pointer select-none">Require an answer</Label>
						</div>
						<Button
							onClick={handleAddItem}
							disabled={!newValue.trim() || hasInvalidItems || createItem.isLoading}
							size="sm"
						>
							<PlusIcon className="size-4 mr-1" />
							Add Question
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function ItemRow({ item, eventId }: { item: any; eventId: string }) {
	const deleteItem = useDeleteItem(item.id, eventId);
	const updateItem = useUpdateItem(item.id, eventId);
	const [isExpanded, setIsExpanded] = useState(false);
	const [value, setValue] = useState(item.value);

	const fieldType = getItemFieldType(item);

	const handleSaveValue = () => {
		if (value.trim() && value !== item.value) {
			updateItem.mutate({
				value: value.trim(),
			});
		}
	};

	const handleTypeChange = (newType: FieldType) => {
		const config = FIELD_TYPES[newType];
		updateItem.mutate({
			questionType: config.questionType,
			metadata: config.getDefaultMetadata(),
		});
	};

	const handleRequiredChange = (checked: boolean) => {
		updateItem.mutate({
			required: checked,
		});
	};

	// Slider bounds editors
	const handleSliderRangeChange = (key: "min" | "max", valStr: string) => {
		const val = valStr === "" ? 0 : Number(valStr);
		const currentMeta = item.metadata || { min: 0, max: 100 };
		updateItem.mutate({
			metadata: {
				...currentMeta,
				[key]: val,
			},
		});
	};

	// Options choices editors
	const handleOptionTextChange = (index: number, newOptionText: string) => {
		const choices: string[] = [...(item.metadata?.choices || [])];
		choices[index] = newOptionText;
		updateItem.mutate({
			metadata: {
				...item.metadata,
				choices,
			},
		});
	};

	const handleAddOption = () => {
		const choices: string[] = [...(item.metadata?.choices || [])];
		choices.push(`Option ${choices.length + 1}`);
		updateItem.mutate({
			metadata: {
				...item.metadata,
				choices,
			},
		});
	};

	const handleRemoveOption = (index: number) => {
		const choices: string[] = (item.metadata?.choices || []).filter((_: any, i: number) => i !== index);
		updateItem.mutate({
			metadata: {
				...item.metadata,
				choices,
			},
		});
	};

	return (
		<Card className="hover:border-muted-foreground/30 transition-all">
			<CardContent className="pt-4 space-y-4">
				<div className="flex items-center gap-3">
					<GripVerticalIcon className="size-4 text-muted-foreground shrink-0 cursor-grab" />
					<div className="flex-1 min-w-0">
						<Input
							value={value}
							onChange={(e) => setValue(e.target.value)}
							onBlur={handleSaveValue}
							className="font-medium h-8 py-1 px-2 border-transparent hover:border-input focus:border-input transition-colors truncate text-sm"
							placeholder="Enter question text"
						/>
					</div>
					<div className="flex items-center gap-1.5">
						<span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full capitalize">
							{FIELD_TYPES[fieldType]?.label}
						</span>
						{item.required && (
							<span className="text-[10px] text-destructive font-semibold border border-destructive/20 bg-destructive/5 px-2 py-0.5 rounded-full uppercase">
								Required
							</span>
						)}
					</div>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? <ChevronUpIcon className="size-4" /> : <Settings2Icon className="size-4" />}
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-8 hover:text-destructive"
							onClick={() => {
								if (window.confirm("Are you sure you want to delete this question? This will permanently remove all collected answers for this question.")) {
									deleteItem.mutate();
								}
							}}
							disabled={deleteItem.isLoading}
						>
							<TrashIcon className="size-4" />
						</Button>
					</div>
				</div>

				{isExpanded && (
					<div className="border-t pt-4 space-y-4 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label className="text-xs font-semibold">Change Type</Label>
								<Select value={fieldType} onValueChange={handleTypeChange}>
									<SelectTrigger className="h-9">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(FIELD_TYPES).map(([key, val]) => (
											<SelectItem key={key} value={key}>
												{val.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex items-center justify-between border rounded-lg p-3 self-end h-9">
								<Label htmlFor={`req-${item.id}`} className="text-xs font-semibold cursor-pointer">Required Field</Label>
								<Switch
									id={`req-${item.id}`}
									checked={item.required}
									onCheckedChange={handleRequiredChange}
								/>
							</div>
						</div>

						{/* Configuration sub-panels depending on questionType */}
						{fieldType === "slider" && (
							<div className="bg-muted/40 rounded-lg p-3 space-y-3">
								<p className="text-xs font-semibold text-muted-foreground">Configure Slider Bounds</p>
								<div className="flex gap-4">
									<div className="flex-1 space-y-1">
										<Label className="text-xs">Min Value</Label>
										<Input
											type="number"
											value={item.metadata?.min ?? 0}
											onChange={(e) => handleSliderRangeChange("min", e.target.value)}
											className="h-8"
										/>
									</div>
									<div className="flex-1 space-y-1">
										<Label className="text-xs">Max Value</Label>
										<Input
											type="number"
											value={item.metadata?.max ?? 100}
											onChange={(e) => handleSliderRangeChange("max", e.target.value)}
											className="h-8"
										/>
									</div>
								</div>
							</div>
						)}

						{["radio", "checkboxes", "dropdown"].includes(fieldType) && (
							<div className="bg-muted/40 rounded-lg p-3 space-y-3">
								<div className="flex items-center justify-between">
									<p className="text-xs font-semibold text-muted-foreground">Configure Choices / Options</p>
									<Button variant="outline" size="sm" className="h-6 text-xs px-2" onClick={handleAddOption}>
										Add Choice
									</Button>
								</div>
								<div className="space-y-2">
									{(item.metadata?.choices || []).map((choice: string, idx: number) => (
										<div key={idx} className="flex items-center gap-2">
											<span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
											<Input
												value={choice}
												onChange={(e) => handleOptionTextChange(idx, e.target.value)}
												className="h-8 py-1 px-2 flex-1"
												placeholder={`Option ${idx + 1}`}
											/>
											<Button
												variant="ghost"
												size="icon"
												className="size-8 text-muted-foreground hover:text-destructive"
												onClick={() => handleRemoveOption(idx)}
												disabled={(item.metadata?.choices || []).length <= 1}
											>
												<TrashIcon className="size-3.5" />
											</Button>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

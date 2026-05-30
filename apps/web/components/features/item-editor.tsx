"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { trpc } from "~/trpc/client";
import { toast } from "sonner";
import { LoadingSpinner } from "~/components/shared/loading-spinner";
import {
	Plus,
	Trash2,
	Copy,
	ArrowUp,
	ArrowDown,
	AlignLeft,
	AlignJustify,
	Hash,
	Mail,
	Calendar,
	Clock,
	CalendarRange,
	Globe,
	Phone,
	Sliders,
	CircleDot,
	SquareCheck,
	ChevronDownCircle,
	Star,
	PlusCircle,
	X,
	FileText,
	Eye,
	Asterisk
} from "lucide-react";
import { cn } from "~/lib/utils";

export type FieldType =
	| "short_answer"
	| "long_answer"
	| "number"
	| "email"
	| "date"
	| "time"
	| "datetime"
	| "url"
	| "phone"
	| "slider"
	| "radio"
	| "checkbox"
	| "select"
	| "rating";

interface ItemEditorProps {
	eventId: string;
	eventType: "form" | "poll" | "banter";
}

const FIELD_TYPES: Record<
	FieldType,
	{
		label: string;
		category: string;
		icon: any;
		questionType: "text" | "slider" | "options";
		getDefaultMetadata: () => any;
	}
> = {
	short_answer: {
		label: "Short Answer",
		category: "Text Inputs",
		icon: AlignLeft,
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "short", inputType: "short" }),
	},
	long_answer: {
		label: "Paragraph",
		category: "Text Inputs",
		icon: AlignJustify,
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "long", inputType: "long" }),
	},
	radio: {
		label: "Multiple Choice",
		category: "Choices",
		icon: CircleDot,
		questionType: "options",
		getDefaultMetadata: () => ({ inputType: "radio", multiple: false, choices: ["Option 1", "Option 2"], allowOther: false }),
	},
	checkbox: {
		label: "Checkboxes",
		category: "Choices",
		icon: SquareCheck,
		questionType: "options",
		getDefaultMetadata: () => ({ inputType: "checkbox", multiple: true, choices: ["Option 1", "Option 2"], allowOther: false }),
	},
	select: {
		label: "Dropdown",
		category: "Choices",
		icon: ChevronDownCircle,
		questionType: "options",
		getDefaultMetadata: () => ({ inputType: "select", multiple: false, choices: ["Option 1", "Option 2"], allowOther: false }),
	},
	rating: {
		label: "Rating",
		category: "Choices",
		icon: Star,
		questionType: "options",
		getDefaultMetadata: () => ({ inputType: "rating", multiple: false, choices: ["1", "2", "3", "4", "5"], maxRating: 5 }),
	},
	slider: {
		label: "Slider",
		category: "Advanced",
		icon: Sliders,
		questionType: "slider",
		getDefaultMetadata: () => ({ min: 0, max: 100 }),
	},
	number: {
		label: "Number",
		category: "Specialized Inputs",
		icon: Hash,
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "number", inputType: "number" }),
	},
	email: {
		label: "Email",
		category: "Specialized Inputs",
		icon: Mail,
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "email", inputType: "email" }),
	},
	date: {
		label: "Date",
		category: "Specialized Inputs",
		icon: Calendar,
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "date", inputType: "date" }),
	},
	time: {
		label: "Time",
		category: "Specialized Inputs",
		icon: Clock,
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "short", inputType: "time" }),
	},
	datetime: {
		label: "Date & Time",
		category: "Specialized Inputs",
		icon: CalendarRange,
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "short", inputType: "datetime" }),
	},
	url: {
		label: "Website URL",
		category: "Specialized Inputs",
		icon: Globe,
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "short", inputType: "url" }),
	},
	phone: {
		label: "Phone",
		category: "Specialized Inputs",
		icon: Phone,
		questionType: "text",
		getDefaultMetadata: () => ({ subtype: "short", inputType: "phone" }),
	},
};

function getItemFieldType(item: any): FieldType {
	if (item.questionType === "slider") return "slider";
	if (item.questionType === "options") {
		const inputType = item.metadata?.inputType;
		if (inputType === "rating") return "rating";
		if (inputType === "select") return "select";
		if (inputType === "checkbox") return "checkbox";
		if (inputType === "radio") return "radio";
		if (item.metadata?.isDropdown) return "select";
		return item.metadata?.multiple ? "checkbox" : "radio";
	}
	if (item.questionType === "text") {
		const inputType = item.metadata?.inputType || item.metadata?.subtype;
		if (inputType === "long") return "long_answer";
		if (inputType === "number") return "number";
		if (inputType === "email") return "email";
		if (inputType === "date") return "date";
		if (inputType === "time") return "time";
		if (inputType === "datetime") return "datetime";
		if (inputType === "url") return "url";
		if (inputType === "phone") return "phone";
		return "short_answer";
	}
	return "short_answer";
}

export function ItemEditor({ eventId, eventType }: ItemEditorProps) {
	const utils = trpc.useUtils();
	const { data: items, isLoading } = trpc.items.listByEvent.useQuery({ eventId });
	const [activeId, setActiveId] = useState<string | null>(null);

	const createItemMutation = trpc.items.create.useMutation({
		onSuccess: () => {
			utils.items.listByEvent.invalidate({ eventId });
		},
		onError: (err) => {
			toast.error(err.message || "Failed to create question");
		}
	});

	const updateItemMutation = trpc.items.update.useMutation({
		onSuccess: () => {
			utils.items.listByEvent.invalidate({ eventId });
		},
		onError: (err) => {
			toast.error(err.message || "Failed to update question");
		}
	});

	const deleteItemMutation = trpc.items.delete.useMutation({
		onSuccess: () => {
			toast.success("Question deleted");
			utils.items.listByEvent.invalidate({ eventId });
		},
		onError: (err) => {
			toast.error(err.message || "Failed to delete question");
		}
	});

	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center py-12 gap-3">
				<LoadingSpinner />
				<p className="text-xs text-muted-foreground animate-pulse">Loading form builder...</p>
			</div>
		);
	}

	const questionItems = (items ?? [])
		.filter((i: any) => i.category === "question")
		.sort((a: any, b: any) => a.order - b.order);

	const handleAddQuestion = async () => {
		const nextOrder = questionItems.length > 0 
			? Math.max(...questionItems.map((i: any) => i.order)) + 1 
			: 1;

		try {
			const newItem = await createItemMutation.mutateAsync({
				eventId,
				category: "question",
				value: "Untitled Question",
				questionType: "text",
				required: false,
				metadata: { subtype: "short", inputType: "short" },
				order: nextOrder
			});

			if (newItem?.id) {
				setActiveId(newItem.id);
				toast.success("Question added!");
			}
		} catch (e) {
			// error handled in mutation onError
		}
	};

	const handleDuplicate = async (item: any) => {
		const nextOrder = item.order + 0.5; // Insert right after
		try {
			const newItem = await createItemMutation.mutateAsync({
				eventId,
				category: "question",
				value: `${item.value} (Copy)`,
				questionType: item.questionType,
				required: item.required,
				metadata: item.metadata,
				order: nextOrder
			});

			if (newItem?.id) {
				setActiveId(newItem.id);
				toast.success("Question duplicated!");
			}
		} catch (e) {}
	};

	const handleMoveUp = async (idx: number) => {
		if (idx <= 0) return;
		const current = questionItems[idx];
		const prev = questionItems[idx - 1];
		if (!current || !prev) return;
		
		try {
			await Promise.all([
				updateItemMutation.mutateAsync({
					itemId: current.id,
					data: { order: prev.order }
				}),
				updateItemMutation.mutateAsync({
					itemId: prev.id,
					data: { order: current.order }
				})
			]);
			toast.success("Question moved up");
		} catch (e) {}
	};

	const handleMoveDown = async (idx: number) => {
		if (idx >= questionItems.length - 1) return;
		const current = questionItems[idx];
		const next = questionItems[idx + 1];
		if (!current || !next) return;
		
		try {
			await Promise.all([
				updateItemMutation.mutateAsync({
					itemId: current.id,
					data: { order: next.order }
				}),
				updateItemMutation.mutateAsync({
					itemId: next.id,
					data: { order: current.order }
				})
			]);
			toast.success("Question moved down");
		} catch (e) {}
	};

	const handleCardClick = (id: string, e: React.MouseEvent) => {
		// Prevent activating card if clicking on action buttons or active selectors
		const target = e.target as HTMLElement;
		if (
			target.closest("button") || 
			target.closest("input") || 
			target.closest("select") || 
			target.closest("[role='combobox']") ||
			target.closest(".switch-element")
		) {
			return;
		}
		setActiveId(id);
	};

	return (
		<div className="space-y-6 max-w-3xl mx-auto pb-12">
			{/* Question List */}
			<div className="space-y-4">
				{questionItems.length === 0 ? (
					<div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-3xl bg-card/40 backdrop-blur-sm border-muted-foreground/10 space-y-4 animate-in fade-in duration-300">
						<div className="p-4 bg-primary/10 rounded-full border border-primary/20">
							<FileText className="size-8 text-primary" />
						</div>
						<div className="text-center space-y-1.5">
							<h3 className="text-base font-semibold">Your Form is Empty</h3>
							<p className="text-xs text-muted-foreground max-w-sm">
								Add questions to start collecting real-time votes, answers, and participant feedback!
							</p>
						</div>
						<Button onClick={handleAddQuestion} className="h-10 px-5 rounded-xl shadow-lg">
							<Plus className="size-4 mr-1.5" />
							Add First Question
						</Button>
					</div>
				) : (
					questionItems.map((item: any, idx: number) => (
						<ItemEditorCard
							key={item.id}
							item={item}
							isActive={activeId === item.id}
							onFocus={(e) => handleCardClick(item.id, e)}
							onDeactivate={() => setActiveId(null)}
							onDuplicate={() => handleDuplicate(item)}
							onDelete={() => {
								if (window.confirm("Delete this question and all its stored responses permanently?")) {
									deleteItemMutation.mutate({ itemId: item.id });
									if (activeId === item.id) setActiveId(null);
								}
							}}
							onMoveUp={() => handleMoveUp(idx)}
							onMoveDown={() => handleMoveDown(idx)}
							isFirst={idx === 0}
							isLast={idx === questionItems.length - 1}
							updateItemMutation={updateItemMutation}
						/>
					))
				)}
			</div>

			{/* Floating bottom action bar */}
			{questionItems.length > 0 && (
				<Button
					onClick={handleAddQuestion}
					className="w-full py-6 border border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 text-primary rounded-2xl flex items-center justify-center gap-2 group transition-all duration-300 shadow-sm hover:shadow-md animate-in slide-in-from-bottom-2 duration-300"
				>
					<PlusCircle className="size-5 transition-transform group-hover:scale-110" />
					<span className="font-semibold text-sm">Add Question</span>
				</Button>
			)}
		</div>
	);
}

interface ItemEditorCardProps {
	item: any;
	isActive: boolean;
	onFocus: (e: React.MouseEvent) => void;
	onDeactivate: () => void;
	onDuplicate: () => void;
	onDelete: () => void;
	onMoveUp: () => void;
	onMoveDown: () => void;
	isFirst: boolean;
	isLast: boolean;
	updateItemMutation: any;
}

function ItemEditorCard({
	item,
	isActive,
	onFocus,
	onDeactivate,
	onDuplicate,
	onDelete,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	updateItemMutation,
}: ItemEditorCardProps) {
	const fieldType = getItemFieldType(item);

	// Local states for instant responsive typing (saves on blur or Enter)
	const [localTitle, setLocalTitle] = useState(item.value);
	const [localChoices, setLocalChoices] = useState<string[]>([]);
	const [focusOptionIdx, setFocusOptionIdx] = useState<number | null>(null);

	// Sync local states with item props
	useEffect(() => {
		setLocalTitle(item.value);
		setLocalChoices(item.metadata?.choices || []);
	}, [item.value, item.metadata?.choices]);

	const handleSaveTitle = () => {
		if (localTitle.trim() && localTitle !== item.value) {
			updateItemMutation.mutate({
				itemId: item.id,
				data: { value: localTitle.trim() }
			});
		}
	};

	const handleTypeChange = (newType: FieldType) => {
		const config = FIELD_TYPES[newType];
		updateItemMutation.mutate({
			itemId: item.id,
			data: {
				questionType: config.questionType,
				metadata: config.getDefaultMetadata(),
			}
		});
	};

	const handleRequiredChange = (checked: boolean) => {
		updateItemMutation.mutate({
			itemId: item.id,
			data: { required: checked }
		});
	};

	const handleSaveChoices = (updatedChoices: string[]) => {
		updateItemMutation.mutate({
			itemId: item.id,
			data: {
				metadata: {
					...item.metadata,
					choices: updatedChoices,
				}
			}
		});
	};

	const handleOptionTextChange = (idx: number, text: string) => {
		const updated = [...localChoices];
		updated[idx] = text;
		setLocalChoices(updated);
	};

	const handleOptionBlur = (idx: number) => {
		// Clean up choice string and save
		const cleaned = localChoices.map(c => c.trim()).filter(Boolean);
		if (cleaned.length === 0) {
			// Restore local choices if blank to avoid empty list
			setLocalChoices(item.metadata?.choices || ["Option 1"]);
		} else {
			setLocalChoices(cleaned);
			handleSaveChoices(cleaned);
		}
	};

	const handleAddOption = () => {
		const newChoice = `Option ${localChoices.length + 1}`;
		const updated = [...localChoices, newChoice];
		setLocalChoices(updated);
		setFocusOptionIdx(updated.length - 1);
		handleSaveChoices(updated);
	};

	const handleRemoveOption = (idx: number) => {
		const updated = localChoices.filter((_, i) => i !== idx);
		setLocalChoices(updated);
		handleSaveChoices(updated);
	};

	const handleToggleOther = (enable: boolean) => {
		updateItemMutation.mutate({
			itemId: item.id,
			data: {
				metadata: {
					...item.metadata,
					allowOther: enable
				}
			}
		});
	};

	const renderActiveContent = () => {
		switch (fieldType) {
			case "slider":
				return (
					<div className="bg-muted/30 border rounded-2xl p-4 space-y-4">
						<div className="flex items-center gap-2">
							<Sliders className="size-4 text-primary" />
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configure Slider Bounds</span>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label className="text-xs">Minimum Boundary</Label>
								<Input
									type="number"
									value={item.metadata?.min ?? 0}
									onChange={(e) => {
										updateItemMutation.mutate({
											itemId: item.id,
											data: {
												metadata: { ...item.metadata, min: Number(e.target.value) }
											}
										});
									}}
									className="h-10 rounded-xl"
								/>
							</div>
							<div className="space-y-1.5">
								<Label className="text-xs">Maximum Boundary</Label>
								<Input
									type="number"
									value={item.metadata?.max ?? 100}
									onChange={(e) => {
										updateItemMutation.mutate({
											itemId: item.id,
											data: {
												metadata: { ...item.metadata, max: Number(e.target.value) }
											}
										});
									}}
									className="h-10 rounded-xl"
								/>
							</div>
						</div>
					</div>
				);

			case "rating":
				return (
					<div className="bg-muted/30 border rounded-2xl p-4 space-y-4">
						<div className="flex items-center gap-2">
							<Star className="size-4 text-primary" />
							<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configure Rating Scale</span>
						</div>
						<div className="space-y-1.5 max-w-[200px]">
							<Label className="text-xs">Maximum Stars</Label>
							<Select 
								value={String(item.metadata?.maxRating ?? 5)} 
								onValueChange={(val) => {
									const maxRating = Number(val);
									const ratingChoices = Array.from({ length: maxRating }, (_, i) => String(i + 1));
									updateItemMutation.mutate({
										itemId: item.id,
										data: {
											metadata: { 
												...item.metadata, 
												maxRating,
												choices: ratingChoices
											}
										}
									});
								}}
							>
								<SelectTrigger className="h-10 rounded-xl">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="rounded-xl">
									{[3, 4, 5, 6, 7, 8, 9, 10].map(stars => (
										<SelectItem key={stars} value={String(stars)} className="rounded-lg">
											{stars} Stars
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-center gap-1 text-muted-foreground/30 pt-1">
							{Array.from({ length: item.metadata?.maxRating ?? 5 }).map((_, i) => (
								<Star key={i} className="size-6 fill-none" />
							))}
						</div>
					</div>
				);

			case "radio":
			case "checkbox":
			case "select":
				const isRadio = fieldType === "radio";
				const isCheckbox = fieldType === "checkbox";
				const isSelect = fieldType === "select";

				return (
					<div className="space-y-3">
						<div className="space-y-2">
							{localChoices.map((choice, idx) => (
								<div key={idx} className="flex items-center gap-3 group/option animate-in fade-in duration-150">
									{isRadio && <div className="size-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />}
									{isCheckbox && <div className="size-5 rounded-md border-2 border-muted-foreground/30 flex-shrink-0" />}
									{isSelect && <span className="text-xs font-mono text-muted-foreground w-5 text-center">{idx + 1}.</span>}

									<Input
										value={choice}
										onChange={(e) => handleOptionTextChange(idx, e.target.value)}
										onBlur={() => handleOptionBlur(idx)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												handleAddOption();
											}
										}}
										autoFocus={focusOptionIdx === idx}
										className="h-9 py-1 px-1 border-b border-t-0 border-l-0 border-r-0 rounded-none focus-visible:ring-0 focus-visible:border-primary border-muted-foreground/20 hover:border-muted-foreground/45 bg-transparent flex-1 text-sm transition-all"
										placeholder={`Option ${idx + 1}`}
									/>

									<Button
										variant="ghost"
										size="icon"
										className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover/option:opacity-100 transition-opacity"
										onClick={() => handleRemoveOption(idx)}
										disabled={localChoices.length <= 1}
									>
										<X className="size-4" />
									</Button>
								</div>
							))}

							{item.metadata?.allowOther && (
								<div className="flex items-center gap-3 py-1">
									{isRadio && <div className="size-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />}
									{isCheckbox && <div className="size-5 rounded-md border-2 border-muted-foreground/30 flex-shrink-0" />}
									{isSelect && <span className="text-xs font-mono text-muted-foreground w-5 text-center">{localChoices.length + 1}.</span>}
									
									<span className="text-sm text-muted-foreground flex-1 pl-1 cursor-default select-none">Other...</span>

									<Button
										variant="ghost"
										size="icon"
										className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
										onClick={() => handleToggleOther(false)}
									>
										<X className="size-4" />
									</Button>
								</div>
							)}
						</div>

						{/* Add option bar */}
						<div className="flex items-center gap-3 text-xs pt-1.5 border-t border-muted/50">
							<Button 
								variant="ghost" 
								size="sm" 
								onClick={handleAddOption}
								className="text-primary hover:text-primary hover:bg-primary/10 rounded-xl h-8 font-semibold flex items-center gap-1"
							>
								<Plus className="size-3.5" />
								Add Option
							</Button>
							
							{!item.metadata?.allowOther && !isSelect && (
								<>
									<span className="text-muted-foreground/40">or</span>
									<Button 
										variant="ghost" 
										size="sm" 
										onClick={() => handleToggleOther(true)}
										className="text-muted-foreground hover:text-foreground rounded-xl h-8"
									>
										Add "Other" option
									</Button>
								</>
							)}
						</div>
					</div>
				);

			default:
				// Visual placeholder preview for text/HTML types so user NEVER has to think about options or text fields!
				const fieldTypeConfig = FIELD_TYPES[fieldType];
				const SubIcon = fieldTypeConfig?.icon ?? FileText;
				
				return (
					<div className="bg-muted/15 border border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground select-none">
						<SubIcon className="size-5 text-muted-foreground/60" />
						<div className="space-y-0.5">
							<span className="text-xs font-semibold">{fieldTypeConfig?.label} preview mode</span>
							<p className="text-[10px] text-muted-foreground/60">
								Participants will see {fieldType === "long_answer" ? "a multi-line textarea" : "an input field"} optimized for this question type.
							</p>
						</div>
					</div>
				);
		}
	};

	const renderPreviewContent = () => {
		switch (fieldType) {
			case "slider":
				return (
					<div className="flex items-center gap-4 text-xs font-mono text-muted-foreground/70 bg-muted/20 border px-3.5 py-2.5 rounded-xl max-w-sm">
						<span>Min: {item.metadata?.min ?? 0}</span>
						<div className="h-2 flex-1 rounded bg-muted-foreground/15 min-w-20" />
						<span>Max: {item.metadata?.max ?? 100}</span>
					</div>
				);

			case "rating":
				return (
					<div className="flex items-center gap-1 text-muted-foreground/30">
						{Array.from({ length: item.metadata?.maxRating ?? 5 }).map((_, i) => (
							<Star key={i} className="size-5 fill-none" />
						))}
					</div>
				);

			case "radio":
			case "checkbox":
			case "select":
				const previewChoices = item.metadata?.choices || [];
				return (
					<div className="space-y-1.5 max-w-md">
						{previewChoices.map((choice: string, i: number) => (
							<div key={i} className="flex items-center gap-2.5 text-sm text-muted-foreground/80 pl-1">
								{fieldType === "radio" && <div className="size-4 rounded-full border border-muted-foreground/30 flex-shrink-0" />}
								{fieldType === "checkbox" && <div className="size-4 rounded border border-muted-foreground/30 flex-shrink-0" />}
								{fieldType === "select" && <span className="text-xs font-mono text-muted-foreground/60 w-4">{i + 1}.</span>}
								<span>{choice}</span>
							</div>
						))}
						{item.metadata?.allowOther && (
							<div className="flex items-center gap-2.5 text-sm text-muted-foreground/50 pl-1">
								{fieldType === "radio" && <div className="size-4 rounded-full border border-muted-foreground/20 flex-shrink-0" />}
								{fieldType === "checkbox" && <div className="size-4 rounded border border-muted-foreground/20 flex-shrink-0" />}
								<span>Other...</span>
							</div>
						)}
					</div>
				);

			default:
				const placeholder = fieldType === "long_answer" ? "Long-answer text placeholder" : "Short-answer text placeholder";
				return (
					<div className="text-sm text-muted-foreground/40 italic pl-1 border-b border-dashed border-muted-foreground/20 w-44 pb-1">
						{placeholder}
					</div>
				);
		}
	};

	return (
		<Card 
			onClick={onFocus}
			className={cn(
				"border transition-all duration-300 overflow-hidden rounded-2xl relative shadow-sm cursor-pointer",
				isActive 
					? "border-primary/50 shadow-md ring-1 ring-primary/10 bg-card" 
					: "hover:border-muted-foreground/30 hover:shadow-md bg-card/65 backdrop-blur-sm"
			)}
		>
			{/* Color stripe for active card matching Google Forms aesthetic */}
			<div 
				className={cn(
					"absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-300",
					isActive ? "bg-primary" : "bg-transparent"
				)} 
			/>

			<CardContent className="p-5 sm:p-6 space-y-4">
				{/* Top Header Grid */}
				<div className="flex flex-col sm:flex-row gap-4 items-start">
					{/* Title Text Input (Active vs Preview) */}
					<div className="flex-1 w-full min-w-0">
						{isActive ? (
							<div className="space-y-1">
								<Input
									value={localTitle}
									onChange={(e) => setLocalTitle(e.target.value)}
									onBlur={handleSaveTitle}
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											handleSaveTitle();
										}
									}}
									className="text-base font-semibold h-11 border-b border-t-0 border-l-0 border-r-0 rounded-none focus-visible:ring-0 focus-visible:border-primary border-muted-foreground/20 hover:border-muted-foreground/35 bg-transparent w-full transition-all"
									placeholder="Question"
									autoFocus
								/>
							</div>
						) : (
							<div className="flex items-start gap-1.5 group/title">
								<h3 className="font-semibold text-base leading-tight tracking-tight text-foreground truncate flex-1">
									{item.value}
								</h3>
								{item.required && (
									<span title="Required field">
										<Asterisk className="size-4 text-destructive shrink-0 animate-pulse mt-0.5" />
									</span>
								)}
							</div>
						)}
					</div>

					{/* Type Selector Dropdown (Only visible when active) */}
					{isActive && (
						<div className="w-full sm:w-[220px] flex-shrink-0 z-50">
							<Select value={fieldType} onValueChange={(val) => handleTypeChange(val as FieldType)}>
								<SelectTrigger className="h-11 bg-background border-muted-foreground/20 rounded-xl focus:ring-primary/20">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="max-h-[350px] rounded-xl border border-muted-foreground/15 shadow-xl">
									{/* Group items by category */}
									{Array.from(new Set(Object.values(FIELD_TYPES).map(v => v.category))).map(category => (
										<div key={category} className="space-y-0.5">
											<div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground/60 px-3 py-1.5 select-none bg-muted/40 first:rounded-t-lg">
												{category}
											</div>
											{Object.entries(FIELD_TYPES)
												.filter(([_, val]) => val.category === category)
												.map(([key, val]) => {
													const Icon = val.icon;
													return (
														<SelectItem key={key} value={key} className="rounded-lg py-2 my-0.5">
															<span className="flex items-center gap-2.5">
																<Icon className="size-4 text-muted-foreground/80 shrink-0" />
																<span className="font-medium text-sm">{val.label}</span>
															</span>
														</SelectItem>
													);
												})}
										</div>
									))}
								</SelectContent>
							</Select>
						</div>
					)}

					{/* Tiny badge indicating type when previewing */}
					{!isActive && (
						<div className="flex items-center gap-1.5 flex-shrink-0 select-none">
							<span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full flex items-center gap-1 border border-muted-foreground/5 shadow-2xs">
								{(() => {
									const config = FIELD_TYPES[fieldType];
									if (config) {
										const Icon = config.icon;
										return (
											<>
												<Icon className="size-3 text-muted-foreground/80" />
												<span>{config.label}</span>
											</>
										);
									}
									return <span>Short Answer</span>;
								})()}
							</span>
						</div>
					)}
				</div>

				{/* Middle Dynamic Area */}
				<div className="pt-1.5">
					{isActive ? renderActiveContent() : renderPreviewContent()}
				</div>

				{/* Active card bottom bar (Actions & Required Toggle) */}
				{isActive && (
					<div className="border-t border-muted pt-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between animate-in fade-in duration-200">
						{/* Position arrangement buttons */}
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
								onClick={onMoveUp}
								disabled={isFirst}
								title="Move Up"
							>
								<ArrowUp className="size-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg"
								onClick={onMoveDown}
								disabled={isLast}
								title="Move Down"
							>
								<ArrowDown className="size-4" />
							</Button>
						</div>

						{/* Edit controls & switches */}
						<div className="flex items-center justify-between sm:justify-end gap-5">
							<div className="flex items-center gap-1.5">
								<Button
									variant="ghost"
									size="icon"
									className="size-9 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
									onClick={onDuplicate}
									title="Duplicate Question"
								>
									<Copy className="size-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="size-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
									onClick={onDelete}
									title="Delete Question"
								>
									<Trash2 className="size-4" />
								</Button>
							</div>

							<div className="h-6 w-px bg-muted" />

							{/* Required status Switch */}
							<div className="flex items-center gap-2.5 switch-element">
								<Switch
									id={`req-toggle-${item.id}`}
									checked={item.required}
									onCheckedChange={handleRequiredChange}
									className="data-[state=checked]:bg-primary"
								/>
								<Label 
									htmlFor={`req-toggle-${item.id}`}
									className="text-xs font-semibold select-none cursor-pointer text-muted-foreground"
								>
									Required
								</Label>
							</div>

							<div className="h-6 w-px bg-muted hidden sm:block" />

							{/* Simple "Done editing" visual trigger */}
							<Button 
								variant="outline" 
								size="sm" 
								onClick={(e) => {
									e.stopPropagation();
									onDeactivate();
								}}
								className="h-8 rounded-xl px-3 border-muted-foreground/15 hover:bg-accent/40 text-xs font-medium shrink-0 hidden sm:flex items-center gap-1"
							>
								<Eye className="size-3.5 text-muted-foreground" />
								<span>Preview</span>
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

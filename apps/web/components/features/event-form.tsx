"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useCreateEvent } from "~/hooks/use-create-event";
import type { EventType } from "@repo/trpc/server/modules/events";
import { Sparkles } from "lucide-react";
import { getEventTabPath } from "~/lib/event-paths";

const quickCreateSchema = z.object({
	title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
	type: z.enum(["form", "poll", "banter"]),
});

type QuickCreateData = z.infer<typeof quickCreateSchema>;

interface EventFormProps {
	eventId?: string;
	onSuccess?: () => void;
}

export function EventForm({ onSuccess }: EventFormProps) {
	const router = useRouter();
	const createEvent = useCreateEvent();
	const [selectedType, setSelectedType] = useState<EventType>("form");

	const form = useForm<QuickCreateData>({
		resolver: zodResolver(quickCreateSchema),
		defaultValues: {
			title: "",
			type: "form",
		},
	});

	const onSubmit = async (data: QuickCreateData) => {
		try {
			const result = await createEvent.mutateAsync({
				title: data.title,
				type: data.type,
				description: "",
				visibility: "public",
				resultVisibility: "all",
				authRequired: false,
				multipleResponses: false,
				receiveEmails: false,
				slug: null,
				expiresAt: null,
				theme: null,
			});
			router.push(getEventTabPath(result, "manage"));
			onSuccess?.();
		} catch {
			// Error handling is handled by mutations
		}
	};

	const isLoading = createEvent.isLoading;
	const { errors } = form.formState;

	const eventTypes = [
		{
			value: "form" as EventType,
			label: "Form",
			description: "Collect detailed responses",
			icon: "📝",
		},
		{
			value: "poll" as EventType,
			label: "Poll",
			description: "Quick opinion gathering",
			icon: "📊",
		},
		{
			value: "banter" as EventType,
			label: "Banter",
			description: "Live interactive session",
			icon: "💬",
		},
	];

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			{/* Event Type Selection */}
			<div className="space-y-3">
				<Label className="text-sm font-medium">What would you like to create?</Label>
				<div className="grid grid-cols-3 gap-3">
					{eventTypes.map((type) => (
						<button
							key={type.value}
							type="button"
							onClick={() => {
								setSelectedType(type.value);
								form.setValue("type", type.value);
							}}
							className={`
								relative p-4 rounded-lg border-2 transition-all text-left
								${
									selectedType === type.value
										? "border-primary bg-primary/5 shadow-sm"
										: "border-border hover:border-primary/50 hover:bg-muted/50"
								}
							`}
						>
							<div className="text-2xl mb-2">{type.icon}</div>
							<div className="font-semibold text-sm mb-1">{type.label}</div>
							<div className="text-xs text-muted-foreground">{type.description}</div>
							{selectedType === type.value && (
								<div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
									<svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
									</svg>
								</div>
							)}
						</button>
					))}
				</div>
			</div>

			{/* Title Input */}
			<div className="space-y-2">
				<Label htmlFor="title" className="text-sm font-medium">
					Give it a name
				</Label>
				<Input
					id="title"
					placeholder="e.g., Customer Feedback Survey"
					{...form.register("title")}
					disabled={isLoading}
					className="text-base"
					autoFocus
				/>
				{errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
				<p className="text-xs text-muted-foreground">
					You can customize settings and add questions in the next step
				</p>
			</div>

			{/* Action Buttons */}
			<div className="flex gap-3 pt-2">
				<Button type="submit" disabled={isLoading} className="flex-1" size="lg">
					{isLoading ? (
						"Creating..."
					) : (
						<>
							<Sparkles className="w-4 h-4 mr-2" />
							Create & Start Building
						</>
					)}
				</Button>
				{onSuccess && (
					<Button type="button" variant="outline" onClick={onSuccess} disabled={isLoading} size="lg">
						Cancel
					</Button>
				)}
			</div>
		</form>
	);
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useEvent } from "~/hooks/use-event";
import { useUpdateEvent } from "~/hooks/use-update-event";
import { Skeleton } from "~/components/ui/skeleton";
import { ThemeSelector } from "~/components/features/theme-selector";
import { toast } from "sonner";

const formatDateTimeLocal = (date: Date | null | undefined | string): string => {
	if (!date) return "";
	const d = new Date(date);
	if (isNaN(d.getTime())) return "";
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	const hours = String(d.getHours()).padStart(2, "0");
	const minutes = String(d.getMinutes()).padStart(2, "0");
	return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const eventSettingsSchema = z.object({
	// Basic Settings
	title: z
		.string()
		.min(1, "Title is required")
		.max(200, "Title must be 200 characters or less"),
	description: z.string().optional(),
	slug: z
		.string()
		.regex(/^[a-z0-9-]*$/, "Slug can only contain lowercase letters, numbers, and hyphens")
		.nullable()
		.optional(),

	// Visibility Settings
	visibility: z.enum(["public", "private"]),
	resultVisibility: z.enum(["all", "creator_only"]),

	// Behavior Settings
	authRequired: z.boolean(),
	multipleResponses: z.boolean(),
	receiveEmails: z.boolean(),

	// Advanced Settings
	theme: z.string().nullable().optional(),
	expiresAt: z.union([z.string(), z.date()]).nullable().optional(),
});

type EventSettingsData = z.infer<typeof eventSettingsSchema>;

interface EventSettingsFormProps {
	eventId: string;
}

export function EventSettingsForm({ eventId }: EventSettingsFormProps) {
	const { data: event, isLoading } = useEvent(eventId);
	const updateEvent = useUpdateEvent(eventId);

	const form = useForm<EventSettingsData>({
		resolver: zodResolver(eventSettingsSchema) as any,
		defaultValues: {
			title: "",
			description: "",
			slug: null,
			visibility: "public",
			resultVisibility: "all",
			authRequired: false,
			multipleResponses: false,
			receiveEmails: false,
			theme: null,
			expiresAt: "",
		},
	});

	// Populate form with event data when loaded
	useEffect(() => {
		if (event) {
			form.reset({
				title: event.title,
				description: event.description ?? "",
				slug: event.slug,
				visibility: event.visibility,
				resultVisibility: event.resultVisibility,
				authRequired: event.authRequired,
				multipleResponses: event.multipleResponses,
				receiveEmails: event.receiveEmails,
				theme: event.theme ?? null,
				expiresAt: formatDateTimeLocal(event.expiresAt),
			});
		}
	}, [event, form]);

	const onSubmit = async (data: EventSettingsData) => {
		try {
			const parsedData = {
				...data,
				expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
			};
			await updateEvent.mutateAsync(parsedData as any);
			toast.success("Event settings updated successfully!");
		} catch (error) {
			toast.error("Failed to update event settings. Please try again.");
		}
	};

	const { errors } = form.formState;
	const isSubmitting = updateEvent.isLoading;

	// Show loading skeleton while event data is being fetched
	if (isLoading) {
		return (
			<div className="max-w-2xl space-y-6">
				<div className="space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-24 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-10 w-full" />
					</div>
				</div>
			</div>
		);
	}

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
			{/* Basic Settings Section */}
			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-semibold">Basic Settings</h3>
					<p className="text-sm text-muted-foreground">
						Configure the basic information for your event
					</p>
				</div>

				{/* Title Field */}
				<div className="space-y-2">
					<Label htmlFor="title" className="text-sm font-medium">
						Title <span className="text-destructive">*</span>
					</Label>
					<Input
						id="title"
						placeholder="Enter event title"
						{...form.register("title")}
						disabled={isSubmitting}
						aria-required="true"
						aria-invalid={!!errors.title}
						aria-describedby={errors.title ? "title-error" : undefined}
					/>
					{errors.title && (
						<p id="title-error" className="text-sm text-destructive">
							{errors.title.message}
						</p>
					)}
				</div>

				{/* Description Field */}
				<div className="space-y-2">
					<Label htmlFor="description" className="text-sm font-medium">
						Description
					</Label>
					<Textarea
						id="description"
						placeholder="Add a description for your event (optional)"
						rows={4}
						{...form.register("description")}
						disabled={isSubmitting}
						aria-describedby="description-help"
					/>
					<p id="description-help" className="text-xs text-muted-foreground">
						Provide additional context or instructions for respondents
					</p>
				</div>

				{/* Slug Field */}
				<div className="space-y-2">
					<Label htmlFor="slug" className="text-sm font-medium">
						Custom URL Slug
					</Label>
					<Input
						id="slug"
						placeholder="custom-url-slug"
						{...form.register("slug")}
						disabled={isSubmitting}
						aria-invalid={!!errors.slug}
						aria-describedby={errors.slug ? "slug-error" : "slug-help"}
					/>
					{errors.slug ? (
						<p id="slug-error" className="text-sm text-destructive">
							{errors.slug.message}
						</p>
					) : (
						<p id="slug-help" className="text-xs text-muted-foreground">
							Leave empty for auto-generated slug. Only lowercase letters, numbers, and hyphens
							allowed.
						</p>
					)}
				</div>
			</div>

			{/* Visibility Settings Section */}
			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-semibold">Visibility Settings</h3>
					<p className="text-sm text-muted-foreground">
						Control who can access your event and view results
					</p>
				</div>

				{/* Event Visibility */}
				<div className="space-y-2">
					<Label className="text-sm font-medium">Event Visibility</Label>
					<div className="flex gap-4">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								value="public"
								{...form.register("visibility")}
								disabled={isSubmitting}
								className="w-4 h-4"
							/>
							<span className="text-sm">Public</span>
						</label>
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								value="private"
								{...form.register("visibility")}
								disabled={isSubmitting}
								className="w-4 h-4"
							/>
							<span className="text-sm">Private</span>
						</label>
					</div>
					<p className="text-xs text-muted-foreground">
						Public events can be accessed by anyone with the link
					</p>
				</div>

				{/* Result Visibility */}
				<div className="space-y-2">
					<Label className="text-sm font-medium">Result Visibility</Label>
					<div className="flex gap-4">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								value="all"
								{...form.register("resultVisibility")}
								disabled={isSubmitting}
								className="w-4 h-4"
							/>
							<span className="text-sm">All</span>
						</label>
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								value="creator_only"
								{...form.register("resultVisibility")}
								disabled={isSubmitting}
								className="w-4 h-4"
							/>
							<span className="text-sm">Creator Only</span>
						</label>
					</div>
					<p className="text-xs text-muted-foreground">
						Choose who can view the event results and analytics
					</p>
				</div>
			</div>

			{/* Behavior Settings Section */}
			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-semibold">Behavior Settings</h3>
					<p className="text-sm text-muted-foreground">
						Configure how users can interact with your event
					</p>
				</div>

				{/* Auth Required */}
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<Label htmlFor="authRequired" className="text-sm font-medium">
							Require Authentication
						</Label>
						<p className="text-xs text-muted-foreground">
							Users must be logged in to respond
						</p>
					</div>
					<input
						type="checkbox"
						id="authRequired"
						{...form.register("authRequired")}
						disabled={isSubmitting}
						className="w-4 h-4"
					/>
				</div>

				{/* Multiple Responses */}
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<Label htmlFor="multipleResponses" className="text-sm font-medium">
							Allow Multiple Responses
						</Label>
						<p className="text-xs text-muted-foreground">
							Users can submit multiple responses
						</p>
					</div>
					<input
						type="checkbox"
						id="multipleResponses"
						{...form.register("multipleResponses")}
						disabled={isSubmitting}
						className="w-4 h-4"
					/>
				</div>

				{/* Receive Emails */}
				<div className="flex items-center justify-between">
					<div className="space-y-0.5">
						<Label htmlFor="receiveEmails" className="text-sm font-medium">
							Email Notifications
						</Label>
						<p className="text-xs text-muted-foreground">
							Receive email alerts for new responses
						</p>
					</div>
					<input
						type="checkbox"
						id="receiveEmails"
						{...form.register("receiveEmails")}
						disabled={isSubmitting}
						className="w-4 h-4"
					/>
				</div>
			</div>

			{/* Advanced Settings Section */}
			<div className="space-y-4">
				<div>
					<h3 className="text-lg font-semibold">Advanced Settings</h3>
					<p className="text-sm text-muted-foreground">
						Optional settings for customization and scheduling
					</p>
				</div>

				{/* Theme Selection */}
				<div className="space-y-2">
					<Label className="text-sm font-medium">Background Theme</Label>
					<ThemeSelector
						value={form.watch("theme") ?? null}
						onChange={(theme) => form.setValue("theme", theme, { shouldDirty: true })}
						disabled={isSubmitting}
					/>
				</div>

				{/* Expiration Date */}
				<div className="space-y-2">
					<Label htmlFor="expiresAt" className="text-sm font-medium">
						Expiration Date
					</Label>
					<Input
						id="expiresAt"
						type="datetime-local"
						{...form.register("expiresAt")}
						disabled={isSubmitting}
						aria-invalid={!!errors.expiresAt}
						aria-describedby={errors.expiresAt ? "expiresAt-error" : "expiresAt-help"}
					/>
					{errors.expiresAt ? (
						<p id="expiresAt-error" className="text-sm text-destructive">
							{errors.expiresAt.message}
						</p>
					) : (
						<p id="expiresAt-help" className="text-xs text-muted-foreground">
							Leave empty for no expiration. Event will automatically close after this date.
						</p>
					)}
				</div>
			</div>

			{/* Form Actions */}
			<div className="flex gap-3 pt-2">
				<Button type="submit" disabled={isSubmitting || !form.formState.isDirty} size="lg">
					{isSubmitting ? "Saving..." : "Save Changes"}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => form.reset()}
					disabled={isSubmitting || !form.formState.isDirty}
					size="lg"
				>
					Cancel
				</Button>
			</div>
		</form>
	);
}

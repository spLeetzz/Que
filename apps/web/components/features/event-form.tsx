"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";
import { useCreateEvent } from "~/hooks/use-create-event";
import { useUpdateEvent } from "~/hooks/use-update-event";
import { useEvent } from "~/hooks/use-event";
import type { EventType } from "@repo/trpc/server/modules/events";
import { DateTimePicker } from "~/components/shared/date-time-picker";
import { trpc } from "~/trpc/client";
import { SearchIcon, CheckIcon, XIcon } from "lucide-react";

const eventFormSchema = z.object({
	title: z.string().min(1, "Title is required").max(200, "Title must be 200 characters or less"),
	description: z.string().max(1000).optional(),
	type: z.enum(["form", "poll", "banter"]),
	slug: z
		.string()
		.regex(/^[a-z0-9-]*$/, "Slug must only contain lowercase letters, numbers, and hyphens")
		.max(50, "Slug must be 50 characters or less")
		.optional(),
	visibility: z.enum(["public", "private"]),
	resultVisibility: z.enum(["all", "creator_only"]),
	authRequired: z.boolean(),
	multipleResponses: z.boolean(),
	receiveEmails: z.boolean(),
	expiresAt: z.string().optional(),
	theme: z.string().optional().nullable(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

interface EventFormProps {
	eventId?: string;
	onSuccess?: () => void;
}

const formatToLocalDatetime = (dateString?: string | Date | null) => {
	if (!dateString) return "";
	const date = new Date(dateString);
	if (isNaN(date.getTime())) return "";
	return date.toISOString();
};

const PRESET_THEMES = [
	{ id: "class:bg-slate-900 text-white border-slate-800", name: "Slate Dark", bgClass: "bg-slate-900 border border-slate-800" },
	{ id: "class:bg-indigo-950 text-white border-indigo-900", name: "Indigo Glow", bgClass: "bg-indigo-950 border border-indigo-900" },
	{ id: "class:bg-purple-950 text-white border-purple-900", name: "Purple Twilight", bgClass: "bg-purple-950 border border-purple-900" },
	{ id: "class:bg-emerald-950 text-white border-emerald-900", name: "Forest Green", bgClass: "bg-emerald-950 border border-emerald-900" },
	{ id: "class:bg-rose-950 text-white border-rose-900", name: "Rose Wine", bgClass: "bg-rose-950 border border-rose-900" },
];

export function EventForm({ eventId, onSuccess }: EventFormProps) {
	const router = useRouter();
	const isEditMode = !!eventId;
	const { data: event, isLoading: isLoadingEvent } = useEvent(eventId ?? "");
	const createEvent = useCreateEvent();
	const updateEvent = useUpdateEvent(eventId ?? "");
	const [origin, setOrigin] = useState("");

	// Unsplash Image Search
	const [searchText, setSearchText] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("background");

	useEffect(() => {
		if (typeof window !== "undefined") {
			setOrigin(window.location.origin);
		}
	}, []);

	// Debounce search input requests
	useEffect(() => {
		const timer = setTimeout(() => {
			if (searchText.trim()) {
				setDebouncedSearch(searchText.trim());
			} else {
				setDebouncedSearch("background");
			}
		}, 600);
		return () => clearTimeout(timer);
	}, [searchText]);

	const { data: unsplashImages, isLoading: isSearchingImages } = trpc.events.searchUnsplash.useQuery(
		{ query: debouncedSearch }
	);

	const form = useForm<EventFormData>({
		resolver: zodResolver(eventFormSchema),
		defaultValues: {
			title: "",
			description: "",
			type: "form" as EventType,
			slug: "",
			visibility: "public",
			resultVisibility: "all",
			authRequired: false,
			multipleResponses: false,
			receiveEmails: false,
			expiresAt: "",
			theme: "",
		},
	});

	useEffect(() => {
		if (event) {
			form.reset({
				title: event.title,
				description: event.description ?? "",
				type: event.type,
				slug: event.slug ?? "",
				visibility: event.visibility,
				resultVisibility: event.resultVisibility,
				authRequired: event.authRequired,
				multipleResponses: event.multipleResponses,
				receiveEmails: event.receiveEmails,
				expiresAt: formatToLocalDatetime(event.expiresAt),
				theme: event.theme ?? "",
			});
		}
	}, [event, form]);

	const onSubmit = async (data: EventFormData) => {
		try {
			const formattedData = {
				...data,
				slug: data.slug?.trim() || null,
				expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
				theme: data.theme || null,
			};

			if (isEditMode) {
				await updateEvent.mutateAsync(formattedData);
			} else {
				const result = await createEvent.mutateAsync(formattedData);
				router.push(`/events/${result.id}/edit`);
			}
			onSuccess?.();
		} catch {
			// Error handling is handled by mutations
		}
	};

	const isLoading = createEvent.isLoading || updateEvent.isLoading;
	const { errors } = form.formState;
	const currentSlug = form.watch("slug");
	const currentTheme = form.watch("theme") || "";

	return (
		<Card>
			<CardHeader>
				<CardTitle>{isEditMode ? "Edit Event" : "Create Event"}</CardTitle>
				<CardDescription>
					{isEditMode ? "Update your event details" : "Create a new form, poll, or banter session"}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="title">Title</Label>
						<Input id="title" placeholder="Enter event title" {...form.register("title")} disabled={isLoading} />
						{errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Description</Label>
						<Textarea id="description" placeholder="Enter event description (optional)" {...form.register("description")} disabled={isLoading} />
						{errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="type">Event Type</Label>
							<Select value={form.watch("type")} onValueChange={(value) => form.setValue("type", value as EventType)} disabled={isLoading || isEditMode}>
								<SelectTrigger id="type"><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="form">Form</SelectItem>
									<SelectItem value="poll">Poll</SelectItem>
									<SelectItem value="banter">Banter</SelectItem>
								</SelectContent>
							</Select>
							{isEditMode && <p className="text-[11px] text-muted-foreground">Type cannot be changed after creation.</p>}
						</div>
						<div className="space-y-2 flex flex-col justify-end">
							<Label htmlFor="expiresAt" className="mb-1">Expiration Date & Time (Optional)</Label>
							<DateTimePicker
								value={form.watch("expiresAt")}
								onChange={(val) => form.setValue("expiresAt", val)}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="slug">Custom URL Slug (Optional)</Label>
						<Input id="slug" placeholder="e.g. customer-survey-2026" {...form.register("slug")} disabled={isLoading} />
						{currentSlug && !errors.slug && (
							<p className="text-xs text-muted-foreground truncate">
								Preview Link: <span className="font-semibold text-primary">{origin}/events/{currentSlug}</span>
							</p>
						)}
						{errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
					</div>

					{/* DYNAMIC VISUAL BACKGROUND THEME SELECTION PANEL */}
					<div className="space-y-3 border-t pt-4">
						<div>
							<Label className="text-sm font-semibold">Background Theme & Layout</Label>
							<p className="text-[11px] text-muted-foreground">Customize how your form background looks to participants</p>
						</div>

						{/* SOLID/GRADIENT THEME PRESETS */}
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground">Solid Color Themes</Label>
							<div className="flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => form.setValue("theme", "")}
									className={`h-9 px-3 rounded-md text-xs font-semibold border transition-all ${
										!currentTheme
											? "border-primary bg-primary/10 text-primary"
											: "border-border bg-background hover:bg-muted"
									}`}
								>
									Default Light
								</button>
								{PRESET_THEMES.map((theme) => (
									<button
										key={theme.id}
										type="button"
										onClick={() => form.setValue("theme", theme.id)}
										className={`h-9 px-3 rounded-md text-xs font-semibold capitalize relative transition-all ${theme.bgClass} ${
											currentTheme === theme.id
												? "ring-2 ring-primary ring-offset-2 ring-offset-background"
												: "hover:opacity-90"
										}`}
									>
										{theme.name}
										{currentTheme === theme.id && (
											<CheckIcon className="size-3.5 absolute right-1 top-1 bg-primary text-primary-foreground rounded-full p-0.5" />
										)}
									</button>
								))}
							</div>
						</div>

						{/* UNSPLASH PHOTO PICKER */}
						<div className="space-y-2 pt-1">
							<Label className="text-xs text-muted-foreground flex justify-between items-center">
								<span>Search Unsplash Custom Background Images</span>
								{currentTheme.startsWith("image:") && (
									<span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-200/50 flex items-center gap-1">
										<CheckIcon className="size-3" /> Image Theme Selected
									</span>
								)}
							</Label>
							<div className="flex gap-2">
								<div className="relative flex-1">
									<SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
									<Input
										placeholder="e.g. sunset, stars, minimalist, office..."
										value={searchText}
										onChange={(e) => setSearchText(e.target.value)}
										className="pl-9 h-9 text-xs"
									/>
								</div>
								{currentTheme.startsWith("image:") && (
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => form.setValue("theme", "")}
										title="Clear background image"
										className="size-9 border text-muted-foreground hover:text-destructive"
									>
										<XIcon className="size-4" />
									</Button>
								)}
							</div>

							{/* Unsplash Search Result Grid */}
							<div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-[140px] overflow-y-auto border rounded-lg p-2 bg-muted/20">
								{isSearchingImages && !unsplashImages ? (
									<div className="col-span-full py-6 text-center text-xs text-muted-foreground">
										Searching premium images...
									</div>
								) : (unsplashImages || []).length === 0 ? (
									<div className="col-span-full py-6 text-center text-xs text-muted-foreground">
										No backgrounds found. Try another search query!
									</div>
								) : (
									(unsplashImages || []).map((img) => {
										const themeId = `image:${img.url}`;
										const isSelected = currentTheme === themeId;
										return (
											<button
												key={img.id}
												type="button"
												onClick={() => form.setValue("theme", themeId)}
												style={{ backgroundImage: `url(${img.thumb})` }}
												title={`Photo by ${img.author}`}
												className={`aspect-video rounded-md bg-cover bg-center border relative transition-all ${
													isSelected ? "ring-2 ring-primary ring-offset-1 border-primary scale-[0.97]" : "border-transparent opacity-85 hover:opacity-100 hover:scale-[1.02]"
												}`}
											>
												{isSelected && (
													<div className="absolute inset-0 bg-primary/20 flex items-center justify-center rounded-md">
														<CheckIcon className="size-4 text-white bg-primary rounded-full p-0.5 shadow-sm" />
													</div>
												)}
											</button>
										);
									})
								)}
							</div>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
						<div className="space-y-2">
							<Label htmlFor="visibility">Visibility</Label>
							<Select value={form.watch("visibility")} onValueChange={(value) => form.setValue("visibility", value as "public" | "private")} disabled={isLoading}>
								<SelectTrigger id="visibility"><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="public">Public</SelectItem>
									<SelectItem value="private">Private</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="resultVisibility">Results Visibility</Label>
							<Select value={form.watch("resultVisibility")} onValueChange={(value) => form.setValue("resultVisibility", value as "all" | "creator_only")} disabled={isLoading}>
								<SelectTrigger id="resultVisibility"><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Everyone can see live results</SelectItem>
									<SelectItem value="creator_only">Only the creator can see results</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<div className="flex items-center justify-between border-t pt-3">
						<Label htmlFor="authRequired" className="cursor-pointer text-sm">Require Authentication to participate</Label>
						<Switch id="authRequired" checked={form.watch("authRequired")} onCheckedChange={(checked) => form.setValue("authRequired", checked)} disabled={isLoading} />
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="multipleResponses" className="cursor-pointer text-sm">Allow Multiple Responses per user</Label>
						<Switch id="multipleResponses" checked={form.watch("multipleResponses")} onCheckedChange={(checked) => form.setValue("multipleResponses", checked)} disabled={isLoading} />
					</div>
					<div className="flex items-center justify-between">
						<Label htmlFor="receiveEmails" className="cursor-pointer text-sm">Receive Email Alerts on responses</Label>
						<Switch id="receiveEmails" checked={form.watch("receiveEmails")} onCheckedChange={(checked) => form.setValue("receiveEmails", checked)} disabled={isLoading} />
					</div>
					<div className="flex gap-2 pt-4 border-t">
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Saving..." : isEditMode ? "Update Event" : "Create Event"}
						</Button>
						{onSuccess && <Button type="button" variant="outline" onClick={onSuccess} disabled={isLoading}>Cancel</Button>}
					</div>
				</form>
			</CardContent>
		</Card>
	);
}

"use client";

import { authClient } from "~/lib/auth";
import { useEvent } from "~/hooks/use-event";
import { useItems } from "~/hooks/use-items";
import { useCreateResponse } from "~/hooks/use-create-response";
import { useCreateItem } from "~/hooks/use-create-item";
import { useCreateParticipant } from "~/hooks/use-create-participant";
import { useSocket } from "~/hooks/use-socket";
import { BackgroundImage } from "~/components/features/background-image";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { LoadingSpinner } from "~/components/shared/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import React, { useState, useEffect } from "react";
import { useParticipants } from "~/hooks/use-participants";
import { MessageSquare, BarChart2, Settings2, Cog, Copy, RefreshCcw, UserPlus, HelpCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ParticipateTab } from "~/components/event-tabs/ParticipateTab";
import { ResultsTab } from "~/components/event-tabs/ResultsTab";
import { ManageTab } from "~/components/event-tabs/ManageTab";
import { SettingsTab } from "~/components/event-tabs/SettingsTab";
import { ChatTab } from "~/components/event-tabs/ChatTab";
import { PollsTab } from "~/components/event-tabs/PollsTab";
import { cn } from "~/lib/utils";

export default function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = React.use(params);
	const router = useRouter();
	const searchParams = useSearchParams();
	const [isMounted, setIsMounted] = useState(false);
	const [participantId, setParticipantId] = useState<string | null>(null);
	const [alias, setAlias] = useState("");
	const [isJoined, setIsJoined] = useState(false);

	const {
		isConnected,
		isFallbackActive,
		onlineCount,
		participantStatuses,
		updateStatus,
	} = useSocket(id, { participantId });

	const { data: event, isLoading: isLoadingEvent } = useEvent(id, {
		enablePolling: !isConnected
	});
	const { data: items, isLoading: isLoadingItems } = useItems(id, { 
		enablePolling: event?.type === "banter" || !isConnected
	});
	const { data: participants, isLoading: isLoadingParticipants } = useParticipants(id, {
		enablePolling: event?.type === "banter" || !isConnected
	});
	const { data: session } = authClient.useSession();
	const currentUser = session?.user;

	useEffect(() => {
		setIsMounted(true);
	}, []);

	const createResponse = useCreateResponse();
	const createItem = useCreateItem();
	const createParticipant = useCreateParticipant();

	const existingParticipant = React.useMemo(() => {
		if (!currentUser || !participants) return null;
		return participants.find(p => p.userId === currentUser.id) ?? null;
	}, [currentUser, participants]);

	// Auto-join if already a participant
	useEffect(() => {
		if (existingParticipant && !isJoined) {
			setParticipantId(existingParticipant.id);
			setAlias(existingParticipant.alias);
			setIsJoined(true);
		}
	}, [existingParticipant, isJoined]);

	const [answers, setAnswers] = useState<Record<string, string[]>>({});
	const [chatMessage, setChatMessage] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});

	// Determine if user is creator
	const isCreator = React.useMemo(() => {
		return currentUser && event && currentUser.id === event.creatorId;
	}, [currentUser, event]);

	// Tab management with URL query params
	const [activeTab, setActiveTab] = useState<string>(event?.type === "banter" ? "chat" : "participate");
	const [tabInitialized, setTabInitialized] = useState(false);

	// Initialize tab from URL or default based on user role
	useEffect(() => {
		if (event && !isLoadingEvent && !tabInitialized) {
			const tabParam = searchParams.get("tab");
			const validTabs = event.type === "banter" 
				? ["chat", "polls", "results", "manage", "settings"]
				: ["participate", "results", "manage", "settings"];
			
			if (tabParam && validTabs.includes(tabParam)) {
				// Check if user has access to this tab
				if ((tabParam === "manage" || tabParam === "settings") && !isCreator) {
					setActiveTab(event.type === "banter" ? "chat" : "participate");
				} else {
					setActiveTab(tabParam);
				}
			} else if (isCreator) {
				// Creators default to manage
				setActiveTab("manage");
			} else {
				setActiveTab(event.type === "banter" ? "chat" : "participate");
			}
			setTabInitialized(true);
		}
	}, [event, isLoadingEvent, isCreator, searchParams, tabInitialized]);

	// Update URL when tab changes
	const handleTabChange = (value: string) => {
		setActiveTab(value);
		const url = new URL(window.location.href);
		url.searchParams.set("tab", value);
		router.replace(url.pathname + url.search, { scroll: false });
	};

	const handleJoinEvent = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!alias.trim()) {
			toast.error("Please enter a nickname/alias to participate");
			return;
		}

		try {
			const res = await createParticipant.mutateAsync({
				eventId: id,
				alias: alias.trim(),
			});
			setParticipantId(res.id);
			setIsJoined(true);
			updateStatus("idle");
			toast.success(`Joined as ${alias.trim()}`);
		} catch (err) {
			console.error("Failed to join event", err);
		}
	};

	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!event || !items) return;

		const questionItems = items.filter((i) => i.category === "question");
		const errors: Record<string, string> = {};

		questionItems.forEach((q) => {
			const ans = answers[q.id];
			if (q.required && (!ans || ans.length === 0 || !ans[0]?.trim())) {
				errors[q.id] = "This question is required";
			}
		});

		if (Object.keys(errors).length > 0) {
			setFormErrors(errors);
			toast.error("Please answer all required questions");
			return;
		}

		setFormErrors({});

		try {
			await createResponse.mutateAsync({
				eventId: id,
				participantId: participantId ?? undefined,
				answers: Object.entries(answers).map(([itemId, val]) => ({
					itemId,
					value: val,
				})),
			});
			updateStatus("completed");
			setSubmitted(true);
		} catch (err) {
			console.error("Submission failed", err);
		}
	};

	const handleSendChatMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!chatMessage.trim() || !participantId) return;

		const text = chatMessage.trim();
		setChatMessage("");
		updateStatus("idle");

		try {
			await createItem.mutateAsync({
				eventId: id,
				category: "chat",
				value: text,
				participantId,
			});
		} catch (err) {
			toast.error("Failed to send message");
		}
	};

	const handleInputChange = (itemId: string, val: string[]) => {
		setAnswers((prev) => ({ ...prev, [itemId]: val }));
		updateStatus("filling");
	};

	const handleChatTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
		setChatMessage(e.target.value);
		updateStatus(e.target.value.trim().length > 0 ? "typing" : "idle");
	};

	const copyLink = () => {
		navigator.clipboard.writeText(window.location.origin + `/events/${id}`);
		toast.success("Link copied!");
	};

	const refresh = () => {
		window.location.reload();
	};

	// Loading gate — wait for all critical data + hydration
	if (!isMounted || isLoadingEvent || isLoadingItems || (event?.type === "banter" && isLoadingParticipants)) {
		return (
			<div className="flex h-screen items-center justify-center bg-background" suppressHydrationWarning>
				<LoadingSpinner size="lg" label="Connecting to console..." />
			</div>
		);
	}

	if (!event) {
		return (
			<div className="container max-w-md py-24 bg-background flex items-center justify-center min-h-[80vh]">
				<Card className="w-full border border-border/50 shadow-xl rounded-2xl overflow-hidden bg-card/60 backdrop-blur-lg">
					<CardContent className="pt-10 pb-10 text-center space-y-6">
						<div className="size-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
							<HelpCircle className="size-8" />
						</div>
						<div className="space-y-2">
							<h3 className="text-xl font-bold text-foreground">Event Not Found</h3>
							<p className="text-sm text-muted-foreground max-w-xs mx-auto">
								The event link is invalid, has expired, or is not published yet.
							</p>
						</div>
						<Link href="/dashboard">
							<Button variant="outline" className="rounded-xl px-6">
								<ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Check if user is creator or already joined
	const shouldShowJoinScreen = event.type === "banter" && !isJoined && !isCreator && !existingParticipant;

	// Compute theme vars early so both screens benefit
	const isImageTheme = event?.theme?.startsWith("image:");
	const themeClass = event?.theme?.startsWith("class:") ? event.theme.substring(6) : "bg-background";

	// Show join screen for banter if not yet joined and not creator
	if (shouldShowJoinScreen) {
		return (
			<div className={cn("min-h-screen w-full relative transition-all duration-500 overflow-hidden flex items-center justify-center py-12 px-4", themeClass)}>
				{/* Background: Unsplash theme if available, otherwise Picsum */}
				{isImageTheme ? (
					<BackgroundImage type="unsplash" themeUrl={event.theme?.substring(6)} isEventPage={true} />
				) : (
					<BackgroundImage type="picsum" isEventPage={true} />
				)}
				
				{/* Background glowing gradients */}
				<div className="absolute top-1/4 left-1/4 -z-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
				<div className="absolute bottom-1/4 right-1/4 -z-10 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

				<div className="w-full max-w-md">
					<Card className="w-full shadow-2xl border border-border/50 backdrop-blur-xl bg-card/75 rounded-2xl overflow-hidden">
						<CardContent className="p-8 space-y-6">
							<div className="text-center space-y-3">
								<div className="size-12 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto shadow-sm">
									<UserPlus className="size-6" />
								</div>
								<h2 className="text-2xl font-extrabold tracking-tight text-foreground">{event.title}</h2>
								<p className="text-sm text-muted-foreground leading-relaxed">
									{event.description || "Enter your nickname to join the active banter room."}
								</p>
							</div>
							<form onSubmit={handleJoinEvent} className="space-y-4">
								<div className="space-y-2">
									<Input
										placeholder="Choose a cool alias/nickname..."
										value={alias}
										onChange={(e) => setAlias(e.target.value)}
										maxLength={30}
										className="rounded-xl h-11 border-border/60 bg-background/50 focus-visible:ring-primary text-sm font-medium"
									/>
								</div>
								<Button 
									type="submit" 
									className="w-full h-11 font-semibold rounded-xl shadow-md hover:shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500 text-white transition-all" 
									disabled={createParticipant.isLoading}
								>
									{createParticipant.isLoading ? "Joining room..." : "Join Banter Room"}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	const statusBadge = () => {
		if (event.status === "published") {
			return (
				<Badge className="bg-green-500/10 text-green-500 border border-green-500/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
					Live
				</Badge>
			);
		}
		if (event.status === "completed") {
			return (
				<Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
					Completed
				</Badge>
			);
		}
		return (
			<Badge className="bg-slate-500/10 text-slate-500 border border-slate-500/20 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
				Draft
			</Badge>
		);
	};

	// Determine ambient glow colors based on category/type
	const getGlowColor = () => {
		switch (event.type) {
			case "banter":
				return "bg-emerald-500/10";
			case "poll":
				return "bg-indigo-500/10";
			default:
				return "bg-primary/8";
		}
	};

	return (
		<div className={cn("min-h-screen w-full relative transition-all duration-500 pb-16 overflow-x-hidden", themeClass)}>
			{/* Background: Unsplash theme if available, otherwise Picsum */}
			{isImageTheme ? (
				<BackgroundImage type="unsplash" themeUrl={event.theme?.substring(6)} isEventPage={true} />
			) : (
				<BackgroundImage type="picsum" isEventPage={true} />
			)}
			
			{/* High-end ambient blurred glows behind page */}
			<div className={cn("absolute top-20 left-10 -z-10 w-96 h-96 rounded-full blur-3xl pointer-events-none", getGlowColor())} />
			<div className={cn("absolute bottom-20 right-10 -z-10 w-96 h-96 rounded-full blur-3xl pointer-events-none", getGlowColor())} />

			<div className="container max-w-4xl py-10 px-4 sm:px-6 space-y-8 animate-in fade-in duration-500">
				
				{/* Back button if creator dashboard is open */}
				{isCreator && (
					<Link href="/dashboard" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group">
						<ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-0.5 transition-transform" />
						<span>Back to Dashboard</span>
					</Link>
				)}

				{/* Floating Header Card */}
				<Card className="border border-border/50 shadow-sm rounded-2xl overflow-hidden bg-card/65 backdrop-blur-md p-6 relative">
					<div className="flex flex-col gap-4">
						<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
							<div className="flex items-center gap-2 flex-wrap">
								{statusBadge()}
								<Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-secondary/50 rounded-full px-2.5 py-0.5 border-border/50">
									{event.type}
								</Badge>
								
								{isConnected ? (
									<div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
										<span className="relative flex h-1.5 w-1.5">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
											<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
										</span>
										<span>{onlineCount} Live Now</span>
									</div>
								) : (
									<div className="bg-amber-500/10 text-amber-500 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border border-amber-500/20">
										Offline {isFallbackActive && "(Polling)"}
									</div>
								)}
							</div>
							<div className="flex items-center gap-1.5 self-end sm:self-auto">
								<Button variant="outline" size="icon" onClick={refresh} title="Refresh Live Data" className="size-8.5 rounded-xl border-border/60 hover:bg-secondary">
									<RefreshCcw className="h-4 w-4 text-muted-foreground" />
								</Button>
								<Button variant="outline" size="icon" onClick={copyLink} title="Copy Sharing Link" className="size-8.5 rounded-xl border-border/60 hover:bg-secondary">
									<Copy className="h-4 w-4 text-muted-foreground" />
								</Button>
							</div>
						</div>
						
						<div className="space-y-1.5">
							<h1 className="text-3xl font-extrabold tracking-tight text-foreground leading-tight">{event.title}</h1>
							{event.description && (
								<p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">{event.description}</p>
							)}
						</div>
					</div>
				</Card>

				{/* Floating Tabs Controller */}
				<Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
					<TabsList className="w-full bg-card/65 backdrop-blur-md border border-border/50 p-1.5 rounded-2xl shadow-sm h-auto flex flex-wrap gap-1">
						{event.type === "banter" ? (
							<>
								<TabsTrigger value="chat" className="flex-1 min-w-[80px] rounded-xl py-2.5 font-semibold text-xs tracking-wide cursor-pointer gap-2 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/10">
									<MessageSquare className="h-3.5 w-3.5" />
									<span>Chat</span>
								</TabsTrigger>
								<TabsTrigger value="polls" className="flex-1 min-w-[80px] rounded-xl py-2.5 font-semibold text-xs tracking-wide cursor-pointer gap-2 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/10">
									<BarChart2 className="h-3.5 w-3.5" />
									<span>Polls</span>
								</TabsTrigger>
								<TabsTrigger value="results" className="flex-1 min-w-[80px] rounded-xl py-2.5 font-semibold text-xs tracking-wide cursor-pointer gap-2 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/10">
									<BarChart2 className="h-3.5 w-3.5" />
									<span>Results</span>
								</TabsTrigger>
								{isCreator && (
									<>
										<TabsTrigger value="manage" className="flex-1 min-w-[80px] rounded-xl py-2.5 font-semibold text-xs tracking-wide cursor-pointer gap-2 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/10">
											<Settings2 className="h-3.5 w-3.5" />
											<span>Manage</span>
										</TabsTrigger>
										<TabsTrigger value="settings" className="flex-1 min-w-[80px] rounded-xl py-2.5 font-semibold text-xs tracking-wide cursor-pointer gap-2 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/10">
											<Cog className="h-3.5 w-3.5" />
											<span>Settings</span>
										</TabsTrigger>
									</>
								)}
							</>
						) : (
							<>
								<TabsTrigger value="participate" className="flex-1 min-w-[100px] rounded-xl py-2.5 font-semibold text-xs tracking-wide cursor-pointer gap-2 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/10">
									<MessageSquare className="h-3.5 w-3.5" />
									<span>Participate</span>
								</TabsTrigger>
								<TabsTrigger value="results" className="flex-1 min-w-[100px] rounded-xl py-2.5 font-semibold text-xs tracking-wide cursor-pointer gap-2 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/10">
									<BarChart2 className="h-3.5 w-3.5" />
									<span>Results</span>
								</TabsTrigger>
								{isCreator && (
									<>
										<TabsTrigger value="manage" className="flex-1 min-w-[100px] rounded-xl py-2.5 font-semibold text-xs tracking-wide cursor-pointer gap-2 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/10">
											<Settings2 className="h-3.5 w-3.5" />
											<span>Manage</span>
										</TabsTrigger>
										<TabsTrigger value="settings" className="flex-1 min-w-[100px] rounded-xl py-2.5 font-semibold text-xs tracking-wide cursor-pointer gap-2 transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md data-[state=active]:shadow-primary/10">
											<Cog className="h-3.5 w-3.5" />
											<span>Settings</span>
										</TabsTrigger>
									</>
								)}
							</>
						)}
					</TabsList>

					{event.type === "banter" ? (
						<>
							<TabsContent value="chat" className="mt-0 outline-none animate-in fade-in-30 duration-300">
								<ChatTab
									items={items ?? []}
									participants={participants ?? []}
									participantId={participantId}
									chatMessage={chatMessage}
									setChatMessage={setChatMessage}
									participantStatuses={participantStatuses}
									onSendChatMessage={handleSendChatMessage}
									onChatTyping={handleChatTyping}
								/>
							</TabsContent>

							<TabsContent value="polls" className="mt-0 outline-none animate-in fade-in-30 duration-300">
								<PollsTab
									eventId={id}
									items={items ?? []}
									participantId={participantId}
								/>
							</TabsContent>

							<TabsContent value="results" className="mt-0 outline-none animate-in fade-in-30 duration-300">
								<ResultsTab eventId={id} eventTitle={event.title} isConnected={isConnected} />
							</TabsContent>

							{isCreator && (
								<>
									<TabsContent value="manage" className="mt-0 outline-none animate-in fade-in-30 duration-300">
										<ManageTab eventId={id} items={items ?? []} eventType={event.type} />
									</TabsContent>

									<TabsContent value="settings" className="mt-0 outline-none animate-in fade-in-30 duration-300">
										<SettingsTab event={event} eventId={id} />
									</TabsContent>
								</>
							)}
						</>
					) : (
						<>
							<TabsContent value="participate" className="mt-0 outline-none animate-in fade-in-30 duration-300">
								<ParticipateTab
									event={event}
									items={items ?? []}
									answers={answers}
									submitted={submitted}
									formErrors={formErrors}
									onFormSubmit={handleFormSubmit}
									onInputChange={handleInputChange}
									isSubmitting={createResponse.isLoading}
								/>
							</TabsContent>

							<TabsContent value="results" className="mt-0 outline-none animate-in fade-in-30 duration-300">
								<ResultsTab eventId={id} eventTitle={event.title} isConnected={isConnected} />
							</TabsContent>

							{isCreator && (
								<>
									<TabsContent value="manage" className="mt-0 outline-none animate-in fade-in-30 duration-300">
										<ManageTab eventId={id} items={items ?? []} eventType={event.type} />
									</TabsContent>

									<TabsContent value="settings" className="mt-0 outline-none animate-in fade-in-30 duration-300">
										<SettingsTab event={event} eventId={id} />
									</TabsContent>
								</>
							)}
						</>
					)}
				</Tabs>
			</div>
		</div>
	);
}

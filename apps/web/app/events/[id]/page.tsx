"use client";

import { useEvent } from "~/hooks/use-event";
import { useItems } from "~/hooks/use-items";
import { useCreateResponse } from "~/hooks/use-create-response";
import { useCreateItem } from "~/hooks/use-create-item";
import { useCreateParticipant } from "~/hooks/use-create-participant";
import { useSocket } from "~/hooks/use-socket";
import { QuestionRenderer } from "~/components/features/question-renderer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { LoadingSpinner } from "~/components/shared/loading-spinner";
import { toast } from "sonner";
import React, { useState, useEffect, useRef } from "react";
import { useParticipants } from "~/hooks/use-participants";
import { SendIcon, UsersIcon, CheckCircleIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

export default function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = React.use(params);
	const [isMounted, setIsMounted] = useState(false);
	const { data: event, isLoading: isLoadingEvent } = useEvent(id);
	const { data: items, isLoading: isLoadingItems } = useItems(id);
	const { data: participants } = useParticipants(id);

	// Ensure component only renders after client-side hydration
	useEffect(() => {
		setIsMounted(true);
	}, []);
	
	const createResponse = useCreateResponse();
	const createItem = useCreateItem();
	const createParticipant = useCreateParticipant();

	const participantMap = React.useMemo(() => {
		const map: Record<string, string> = {};
		if (participants) {
			participants.forEach((p) => {
				map[p.id] = p.alias;
			});
		}
		return map;
	}, [participants]);

	// Live WebSockets Integration
	const {
		isConnected,
		isFallbackActive,
		onlineCount,
		participantStatuses,
		updateStatus,
	} = useSocket(id);

	// Client UI State
	const [participantId, setParticipantId] = useState<string | null>(null);
	const [alias, setAlias] = useState("");
	const [isJoined, setIsJoined] = useState(false);
	
	// Form & Chat State
	const [answers, setAnswers] = useState<Record<string, string[]>>({});
	const [chatMessage, setChatMessage] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	
	const chatBottomRef = useRef<HTMLDivElement | null>(null);

	// Auto scroll banter room to bottom on new messages
	useEffect(() => {
		if (event?.type === "banter") {
			chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
		}
	}, [items, event?.type]);

	// Join event participant session
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

	// Handle standard form/poll responses submission
	const handleFormSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!event || !items) return;

		const questions = items.filter((i) => i.category === "question");
		const errors: Record<string, string> = {};
		
		questions.forEach((q) => {
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
		updateStatus("completed");

		try {
			await createResponse.mutateAsync({
				eventId: id,
				participantId: participantId || undefined,
				answers: Object.entries(answers).map(([itemId, val]) => ({
					itemId,
					value: val,
				})),
			});
			setSubmitted(true);
		} catch (err) {
			console.error("Submission failed", err);
		}
	};

	// Handle sending chat message in Banter event type
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
				participantId: participantId || undefined,
			});
		} catch (err) {
			toast.error("Failed to send message");
		}
	};

	// Track when user is typing to update presence status in real time
	const handleInputChange = (itemId: string, val: string[]) => {
		setAnswers((prev) => ({ ...prev, [itemId]: val }));
		updateStatus("filling");
	};

	const handleChatTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
		setChatMessage(e.target.value);
		if (e.target.value.trim().length > 0) {
			updateStatus("typing");
		} else {
			updateStatus("idle");
		}
	};

	if (!isMounted || isLoadingEvent) {
		return (
			<div className="flex h-screen items-center justify-center bg-background" suppressHydrationWarning={true}>
				<LoadingSpinner />
			</div>
		);
	}

	if (!event) {
		return (
			<div className="container max-w-md py-24 bg-background">
				<Card>
					<CardContent className="pt-6 text-center space-y-4">
						<p className="text-destructive font-semibold">Event Not Found</p>
						<p className="text-sm text-muted-foreground">The event link is invalid or has expired.</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Dynamic Background Theme configuration
	const hasImgBackground = event.theme?.startsWith("image:");
	const bgImgUrl = hasImgBackground ? event.theme?.replace("image:", "") : "";
	const hasClassBackground = event.theme?.startsWith("class:");
	const bgClass = hasClassBackground ? event.theme?.replace("class:", "") : "";

	const wrapperStyle: React.CSSProperties = hasImgBackground
		? {
				backgroundImage: `url(${bgImgUrl})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundAttachment: "fixed",
		  }
		: {};

	const wrapperClass = `min-h-screen w-full relative flex flex-col justify-start transition-all duration-300 ${
		hasClassBackground ? bgClass : "bg-background text-foreground"
	}`;

	// Step 1: Force joining alias to participate (Banter sessions only)
	if (event.type === "banter" && !isJoined) {
		return (
			<div style={wrapperStyle} className={wrapperClass}>
				{hasImgBackground && <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px] pointer-events-none" />}
				<div className="container max-w-md min-h-screen flex items-center justify-center py-12 relative z-10">
					<Card className="w-full shadow-xl border-border bg-card/90 backdrop-blur-md">
						<CardHeader className="text-center">
							<CardTitle>{event.title}</CardTitle>
							<CardDescription>{event.description || "Enter your nickname to join the banter room"}</CardDescription>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleJoinEvent} className="space-y-4">
								<div className="space-y-2">
									<Input
										placeholder="Choose a cool alias/nickname..."
										value={alias}
										onChange={(e) => setAlias(e.target.value)}
										maxLength={30}
										className="bg-background/80"
									/>
								</div>
								<Button type="submit" className="w-full font-semibold" disabled={createParticipant.isLoading}>
									{createParticipant.isLoading ? "Joining room..." : "Join Banter Room"}
								</Button>
							</form>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// Step 2: Show success after response recorded
	if (submitted) {
		return (
			<div style={wrapperStyle} className={wrapperClass}>
				{hasImgBackground && <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px] pointer-events-none" />}
				<div className="container max-w-md min-h-screen flex items-center justify-center py-12 relative z-10">
					<Card className="w-full text-center shadow-xl border-border bg-card/90 backdrop-blur-md">
						<CardContent className="pt-12 pb-12 space-y-5">
							<CheckCircleIcon className="size-16 text-emerald-500 mx-auto animate-bounce" />
							<h2 className="text-2xl font-bold">Response Recorded!</h2>
							<p className="text-muted-foreground text-sm">Thank you for participating in {event.title}. Your feedback has been safely logged.</p>
							<div className="pt-2">
								<Link href="/">
									<Button variant="outline" size="sm" className="gap-2">
										<ArrowLeftIcon className="size-4" /> Go to home
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	const questionItems = (items ?? []).filter((i) => i.category === "question");
	const chatItems = (items ?? []).filter((i) => i.category === "chat");

	return (
		<div style={wrapperStyle} className={wrapperClass}>
			{hasImgBackground && <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px] pointer-events-none" />}
			
			<div className="container max-w-3xl py-12 space-y-6 relative z-10">
				{/* Real-time Header */}
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-6">
					<div>
						<h1 className="text-3xl font-extrabold tracking-tight">{event.title}</h1>
						<p className="text-sm text-muted-foreground mt-1.5">{event.description}</p>
					</div>
					<div className="flex items-center gap-3">
						{isConnected ? (
							<div className="flex items-center gap-2 bg-emerald-500/10 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs px-3.5 py-2 rounded-full border border-emerald-500/20 shadow-sm backdrop-blur-md">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
									<span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
								</span>
								<span className="font-semibold">{onlineCount} online</span>
							</div>
						) : (
							<div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs px-3.5 py-2 rounded-full border border-amber-500/20 shadow-sm backdrop-blur-md">
								Offline Mode {isFallbackActive && "(Polling active)"}
							</div>
						)}
					</div>
				</div>

				{/* Event Forms or Banter Layout */}
				{event.type === "banter" ? (
					<Card className="h-[550px] flex flex-col shadow-xl border-border bg-card/85 backdrop-blur-md">
						<CardHeader className="border-b bg-muted/40 p-4">
							<CardTitle className="text-base flex items-center gap-2">
								<UsersIcon className="size-4 text-primary animate-pulse" /> Banter Chat Room
							</CardTitle>
						</CardHeader>
						<CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-background/30">
							{chatItems.length === 0 ? (
								<div className="text-center text-muted-foreground py-20 text-sm italic">
									No messages yet. Send a message to spark the banter!
								</div>
							) : (
								chatItems.map((msg) => {
									const senderAlias = msg.participantId ? participantMap[msg.participantId] : undefined;
									return (
										<div key={msg.id} className="flex items-start gap-2.5">
											<Avatar className="size-8 border shadow-sm">
												<AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
													{senderAlias?.substring(0, 2).toUpperCase() || "PT"}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col bg-card border rounded-2xl px-3.5 py-2 max-w-[80%] text-sm shadow-sm">
												<span className="font-bold text-[10px] text-primary tracking-wide uppercase">
													{senderAlias || "Anonymous"}
												</span>
												<p className="mt-0.5 break-words font-medium text-foreground">{msg.value}</p>
											</div>
										</div>
									);
								})
							)}
							<div ref={chatBottomRef} />
						</CardContent>
						<div className="p-3 border-t bg-muted/30">
							{/* Typing Indicator */}
							{Object.entries(participantStatuses).some(([pid, status]) => pid !== participantId && status === "typing") && (
								<p className="text-[11px] text-muted-foreground italic mb-2 animate-pulse pl-1">Someone is typing...</p>
							)}
							<form onSubmit={handleSendChatMessage} className="flex gap-2">
								<Input
									placeholder="Say something nice..."
									value={chatMessage}
									onChange={handleChatTyping}
									className="flex-1 bg-background/90"
								/>
								<Button type="submit" size="icon" disabled={!chatMessage.trim()} className="shadow-md">
									<SendIcon className="size-4" />
								</Button>
							</form>
						</div>
					</Card>
				) : (
					<form onSubmit={handleFormSubmit} className="space-y-6">
						<Card className="shadow-xl border-border bg-card/90 backdrop-blur-md">
							<CardContent className="pt-6 space-y-6">
								{questionItems.length === 0 ? (
									<p className="text-center text-muted-foreground py-12 text-sm italic">
										No questions added yet to this event.
									</p>
								) : (
									questionItems.map((item) => (
										<QuestionRenderer
											key={item.id}
											item={item}
											answer={answers[item.id] ?? []}
											onChange={(val) => handleInputChange(item.id, val)}
											error={formErrors[item.id]}
										/>
									))
								)}
							</CardContent>
						</Card>
						{questionItems.length > 0 && (
							<Button type="submit" className="w-full h-11 text-sm font-semibold tracking-wide shadow-lg hover:shadow-xl transition-all" disabled={createResponse.isLoading}>
								{createResponse.isLoading ? "Submitting Answers..." : "Submit Response"}
							</Button>
						)}
					</form>
				)}
			</div>
		</div>
	);
}

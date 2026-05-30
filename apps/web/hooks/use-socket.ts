"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { env } from "~/env.js";
import { trpc } from "~/trpc/client";

export interface SocketUser {
	userId: string;
	username: string;
	status: string;
}

export interface UseSocketOptions {
	enableFallback?: boolean;
	fallbackInterval?: number;
	participantId?: string | null;
	onResponseNew?: (payload: any) => void;
	onItemCreated?: (payload: any) => void;
	onItemUpdated?: (payload: any) => void;
	onItemDeleted?: (payload: any) => void;
}

export function useSocket(eventId: string, options: UseSocketOptions = {}) {
	const {
		enableFallback = true,
		fallbackInterval = 4000,
		participantId,
		onResponseNew,
		onItemCreated,
		onItemUpdated,
		onItemDeleted,
	} = options;

	const [isConnected, setIsConnected] = useState(false);
	const [onlineUsers, setOnlineUsers] = useState<SocketUser[]>([]);
	const [isFallbackActive, setIsFallbackActive] = useState(false);
	const [participantStatuses, setParticipantStatuses] = useState<Record<string, string>>({});
	
	const socketRef = useRef<Socket | null>(null);
	const trpcUtils = trpc.useUtils();

	// Function to update user's own status (typing, filling, idle)
	const updateStatus = useCallback((status: string) => {
		if (socketRef.current && isConnected && participantId) {
			socketRef.current.emit("status:update", { eventId, status, participantId });
		}
	}, [eventId, isConnected, participantId]);

	useEffect(() => {
		if (!eventId) return;

		const socketUrl = env.NEXT_PUBLIC_API_URL
			? env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
			: "http://localhost:8000";

		// Initialize socket connection
		const socket = io(socketUrl, {
			withCredentials: true,
			transports: ["websocket", "polling"],
			autoConnect: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			timeout: 5000,
		});

		socketRef.current = socket;

		// Connection fallback timer
		let fallbackTimer: NodeJS.Timeout;
		if (enableFallback) {
			fallbackTimer = setTimeout(() => {
				if (!socket.connected) {
					setIsFallbackActive(true);
					console.warn("WebSocket connection timeout. Falling back to HTTP polling.");
				}
			}, 4000);
		}

		socket.on("connect", () => {
			setIsConnected(true);
			setIsFallbackActive(false);
			if (fallbackTimer) clearTimeout(fallbackTimer);
			
			// Join the room for this event
			socket.emit("join:room", { eventId, participantId: participantId ?? undefined });

			// Immediately invalidate/refetch current analytics and response queries
			trpcUtils.analytics.getOverview.invalidate({ eventId });
			trpcUtils.analytics.getTimeline.invalidate({ eventId });
			trpcUtils.analytics.getAbandonmentFunnel.invalidate({ eventId });
			trpcUtils.analytics.getQuestionAnalytics.invalidate({ eventId });
			trpcUtils.analytics.getParticipantJourneys.invalidate({ eventId });
			trpcUtils.analytics.getFullAnalytics.invalidate({ eventId });
			trpcUtils.responses.listByEvent.invalidate({ eventId });
			trpcUtils.events.getByIdOrSlug.invalidate({ identifier: eventId });
		});

		socket.on("room:joined", () => {
			console.log(`Successfully joined live room for event ${eventId}`);
		});

		socket.on("room:presence", (payload: { onlineUsers: SocketUser[] }) => {
			setOnlineUsers(payload.onlineUsers);
		});

		socket.on("user:online", (payload: { userId: string; username: string }) => {
			console.log(`User ${payload.username} is online`);
		});

		socket.on("user:offline", (payload: { userId: string; username: string }) => {
			console.log(`User ${payload.username} is offline`);
		});

		socket.on("participant:status_updated", (payload: { participantId: string; status: string }) => {
			setParticipantStatuses((prev) => ({
				...prev,
				[payload.participantId]: payload.status,
			}));
		});

		// Handle live responses / poll filling submissions
		socket.on("response:new", (payload) => {
			console.log("New live response recorded:", payload);
			
			// Auto-invalidate tRPC queries to update the UI instantly
			trpcUtils.responses.listByEvent.invalidate({ eventId });
			trpcUtils.events.getByIdOrSlug.invalidate({ identifier: eventId });
			
						trpcUtils.analytics.getOverview.invalidate({ eventId });
			trpcUtils.analytics.getTimeline.invalidate({ eventId });
			trpcUtils.analytics.getAbandonmentFunnel.invalidate({ eventId });
			trpcUtils.analytics.getQuestionAnalytics.invalidate({ eventId });
			trpcUtils.analytics.getParticipantJourneys.invalidate({ eventId });
			trpcUtils.analytics.getFullAnalytics.invalidate({ eventId });
			
						trpcUtils.answers.listByResponse.invalidate();
			
			if (onResponseNew) onResponseNew(payload);
		});

		socket.on("response:count", (payload: { totalResponses: number }) => {
			console.log(`Total responses for event ${eventId}: ${payload.totalResponses}`);
			trpcUtils.events.getByIdOrSlug.invalidate({ identifier: eventId });
			
			trpcUtils.analytics.getOverview.invalidate({ eventId });
			trpcUtils.analytics.getTimeline.invalidate({ eventId });
			trpcUtils.analytics.getAbandonmentFunnel.invalidate({ eventId });
			trpcUtils.analytics.getQuestionAnalytics.invalidate({ eventId });
			trpcUtils.analytics.getParticipantJourneys.invalidate({ eventId });
			trpcUtils.analytics.getFullAnalytics.invalidate({ eventId });
		});

		socket.on("participant:joined", (payload: { participant: any }) => {
			console.log("New participant joined live:", payload.participant);
			trpcUtils.participants.listByEvent.invalidate({ eventId });
			trpcUtils.events.getByIdOrSlug.invalidate({ identifier: eventId });
			
			trpcUtils.analytics.getOverview.invalidate({ eventId });
			trpcUtils.analytics.getTimeline.invalidate({ eventId });
			trpcUtils.analytics.getAbandonmentFunnel.invalidate({ eventId });
			trpcUtils.analytics.getQuestionAnalytics.invalidate({ eventId });
			trpcUtils.analytics.getParticipantJourneys.invalidate({ eventId });
			trpcUtils.analytics.getFullAnalytics.invalidate({ eventId });
		});

		// Handle live chat / banter and item adjustments
		socket.on("item:created", (payload: { item: any }) => {
			console.log("New item added live:", payload.item);
			
			// Auto-invalidate item queries so lists automatically refresh
			trpcUtils.items.listByEvent.invalidate({ eventId });
			
			if (onItemCreated) onItemCreated(payload.item);
		});

		socket.on("item:updated", (payload: { item: any }) => {
			console.log("Item updated live:", payload.item);
			trpcUtils.items.listByEvent.invalidate({ eventId });
			if (onItemUpdated) onItemUpdated(payload.item);
		});

		socket.on("item:deleted", (payload: { itemId: string }) => {
			console.log("Item deleted live:", payload.itemId);
			trpcUtils.items.listByEvent.invalidate({ eventId });
			if (onItemDeleted) onItemDeleted(payload.itemId);
		});

		socket.on("error", (payload: { message: string }) => {
			console.error("Socket room error:", payload.message);
		});

		socket.on("disconnect", (reason) => {
			setIsConnected(false);
			console.log("Socket disconnected:", reason);
			if (reason === "io client disconnect" || reason === "transport close") {
				if (enableFallback) {
					setIsFallbackActive(true);
				}
			}
		});

		socket.on("connect_error", (error) => {
			console.error("Socket connection error:", error);
			if (enableFallback) {
				setIsFallbackActive(true);
			}
		});

		return () => {
			if (fallbackTimer) clearTimeout(fallbackTimer);
			socket.disconnect();
			socketRef.current = null;
		};
	}, [eventId, enableFallback, participantId, trpcUtils, onResponseNew, onItemCreated, onItemUpdated, onItemDeleted]);

	// Return full reactive controls for developers building event pages
	return {
		isConnected,
		isFallbackActive,
		onlineUsers,
		onlineCount: onlineUsers.length,
		participantStatuses,
		updateStatus,
		socket: socketRef.current,
		// Query options helper for developers:
		// If fallback is active, configure tRPC query with a refetchInterval
		queryOptions: isFallbackActive
			? {
					refetchInterval: fallbackInterval,
					refetchOnWindowFocus: true,
					refetchOnMount: true,
				}
			: {
					refetchInterval: false,
				},
	};
}

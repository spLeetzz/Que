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
	enabled?: boolean;
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
		enabled = true,
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

	// Stable refs — updated every render, never cause effect re-runs
	const participantIdRef = useRef(participantId);
	const onResponseNewRef = useRef(onResponseNew);
	const onItemCreatedRef = useRef(onItemCreated);
	const onItemUpdatedRef = useRef(onItemUpdated);
	const onItemDeletedRef = useRef(onItemDeleted);

	useEffect(() => {
		participantIdRef.current = participantId;
		onResponseNewRef.current = onResponseNew;
		onItemCreatedRef.current = onItemCreated;
		onItemUpdatedRef.current = onItemUpdated;
		onItemDeletedRef.current = onItemDeleted;
	});

	// Re-emit join:room when participantId resolves, without reconnecting
	useEffect(() => {
		if (socketRef.current?.connected && participantId && eventId) {
			socketRef.current.emit("join:room", { eventId, participantId });
		}
	}, [participantId, eventId]);

	const updateStatus = useCallback((status: string) => {
		if (socketRef.current?.connected && participantIdRef.current) {
			socketRef.current.emit("status:update", {
				eventId,
				status,
				participantId: participantIdRef.current,
			});
		}
	}, [eventId]);

	useEffect(() => {
		if (!eventId || !enabled) return;

		const socketUrl = env.NEXT_PUBLIC_API_URL
			? env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
			: "http://localhost:8000";

		const socket = io(socketUrl, {
			withCredentials: true,
			transports: ["websocket", "polling"],
			autoConnect: true,
			reconnectionAttempts: 5,
			reconnectionDelay: 1000,
			timeout: 5000,
		});

		socketRef.current = socket;

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

			// Use ref so this doesn't need participantId in deps
			socket.emit("join:room", { eventId, participantId: participantIdRef.current ?? undefined });

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

		socket.on("response:new", (payload) => {
			console.log("New live response recorded:", payload);
			trpcUtils.responses.listByEvent.invalidate({ eventId });
			trpcUtils.events.getByIdOrSlug.invalidate({ identifier: eventId });
			trpcUtils.analytics.getOverview.invalidate({ eventId });
			trpcUtils.analytics.getTimeline.invalidate({ eventId });
			trpcUtils.analytics.getAbandonmentFunnel.invalidate({ eventId });
			trpcUtils.analytics.getQuestionAnalytics.invalidate({ eventId });
			trpcUtils.analytics.getParticipantJourneys.invalidate({ eventId });
			trpcUtils.analytics.getFullAnalytics.invalidate({ eventId });
			trpcUtils.answers.listByResponse.invalidate();
			onResponseNewRef.current?.(payload);
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

		socket.on("item:created", (payload: { item: any }) => {
			console.log("New item added live:", payload.item);
			trpcUtils.items.listByEvent.invalidate({ eventId });
			onItemCreatedRef.current?.(payload.item);
		});

		socket.on("item:updated", (payload: { item: any }) => {
			console.log("Item updated live:", payload.item);
			trpcUtils.items.listByEvent.invalidate({ eventId });
			onItemUpdatedRef.current?.(payload.item);
		});

		socket.on("item:deleted", (payload: { itemId: string }) => {
			console.log("Item deleted live:", payload.itemId);
			trpcUtils.items.listByEvent.invalidate({ eventId });
			onItemDeletedRef.current?.(payload.itemId);
		});

		socket.on("error", (payload: { message: string }) => {
			console.info("Socket room info:", payload.message);
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
		// participantId intentionally omitted — handled via ref + separate effect
	}, [eventId, enabled, enableFallback, trpcUtils]);

	return {
		isConnected,
		isFallbackActive,
		onlineUsers,
		onlineCount: onlineUsers.length,
		participantStatuses,
		updateStatus,
		socket: socketRef.current,
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
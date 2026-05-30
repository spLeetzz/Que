import { Server as SocketIOServer } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { auth } from "@repo/auth/server";
import { db } from "@repo/database";
import { events, responses, answers } from "@repo/database/schema";
import { eq, count } from "drizzle-orm";
import { appEmitter } from "@repo/trpc/server";
import { logger } from "@repo/logger";
import { allowedOrigin } from "./index";

export interface ClientToServerEvents {
	"join:room": (payload: { eventId: string; participantId?: string }) => void;
	"status:update": (payload: { eventId: string; status: string; participantId?: string }) => void;
}

export interface ServerToClientEvents {
	"room:joined": (payload: { eventId: string }) => void;
	"response:new": (payload: {
		responseId: string;
		participantId: string | null;
		submittedAt: Date;
		answers: Array<{ itemId: string; value: string[] }>;
		totalResponses: number;
	}) => void;
	"response:count": (payload: { totalResponses: number }) => void;
	"participant:status_updated": (payload: { participantId: string; status: string }) => void;
	"item:created": (payload: { item: any }) => void;
	"item:updated": (payload: { item: any }) => void;
	"item:deleted": (payload: { itemId: string }) => void;
	"user:online": (payload: { userId: string; username: string; totalOnline: number }) => void;
	"user:offline": (payload: { userId: string; username: string; totalOnline: number }) => void;
	"room:presence": (payload: {
		eventId: string;
		onlineUsers: Array<{ userId: string; username: string; status: string }>;
	}) => void;
	"participant:joined": (payload: { participant: any }) => void;
	error: (payload: { message: string }) => void;
}

export interface SocketData {
	userId: string;
	username: string;
	participantId?: string;
}

export type IOServer = SocketIOServer<
	ClientToServerEvents,
	ServerToClientEvents,
	Record<string, never>,
	SocketData
>;

let io: IOServer;

// presence map: eventId -> Map<userId, { username, socketIds, status }>
const presenceMap = new Map<
	string,
	Map<string, { username: string; socketIds: Set<string>; status: string }>
>();

function getOnlineUsersArray(eventId: string) {
	const eventPresence = presenceMap.get(eventId);
	if (!eventPresence) return [];
	return Array.from(eventPresence.entries()).map(([userId, data]) => ({
		userId,
		username: data.username,
		status: data.status,
	}));
}

export function setupSocket(server: HttpServer): IOServer {
	io = new SocketIOServer<
		ClientToServerEvents,
		ServerToClientEvents,
		Record<string, never>,
		SocketData
	>(server, {
		cors: {
			origin: allowedOrigin,
			credentials: true,
		},
		transports: ["websocket", "polling"],
	});

	// Better Auth session parsing middleware
	io.use(async (socket, next) => {
		try {
			const cookieHeader = socket.handshake.headers.cookie ?? "";
			const session = await auth.api.getSession({
				headers: { cookie: cookieHeader } as Record<string, string>,
			});

			if (session?.user?.id) {
				socket.data.userId = session.user.id;
				socket.data.username = session.user.name || session.user.email || "Registered User";
			} else {
				// Resilient fallback: allow guests to connect so they can view results & participate anonymously
				const guestId = "guest_" + Math.random().toString(36).substring(2, 11);
				socket.data.userId = guestId;
				socket.data.username = `Guest_${guestId.substring(6, 10)}`;
			}
			next();
		} catch (err) {
			logger.error("Socket authentication error, falling back to Guest session", { err });
			const guestId = "guest_" + Math.random().toString(36).substring(2, 11);
			socket.data.userId = guestId;
			socket.data.username = `Guest_${guestId.substring(6, 10)}`;
			next();
		}
	});

	io.on("connection", (socket) => {
		const roomsJoined = new Set<string>();

		socket.on("join:room", async ({ eventId, participantId }) => {
			try {
				const [event] = await db
					.select()
					.from(events)
					.where(eq(events.id, eventId))
					.limit(1);

				if (!event) {
					socket.emit("error", { message: "Event not found" });
					return;
				}

				// Check access: only creators can view if resultsVisibility is creator_only
				if (event.resultVisibility === "creator_only" && socket.data.userId !== event.creatorId) {
					socket.emit("error", { message: "Access denied: results are private" });
					return;
				}

				await socket.join(eventId);
				roomsJoined.add(eventId);

				// Store participantId in socket data if provided
				if (participantId) {
					socket.data.participantId = participantId;
				}

				// Update presence map
				if (!presenceMap.has(eventId)) {
					presenceMap.set(eventId, new Map());
				}
				const eventPresence = presenceMap.get(eventId)!;
				const userId = socket.data.userId;

				if (!eventPresence.has(userId)) {
					eventPresence.set(userId, {
						username: socket.data.username,
						socketIds: new Set([socket.id]),
						status: "idle",
					});
					// Emit online event
					io.to(eventId).emit("user:online", {
						userId,
						username: socket.data.username,
						totalOnline: eventPresence.size,
					});
				} else {
					eventPresence.get(userId)!.socketIds.add(socket.id);
				}

				socket.emit("room:joined", { eventId });

				// Send updated presence list to the entire room
				io.to(eventId).emit("room:presence", {
					eventId,
					onlineUsers: getOnlineUsersArray(eventId),
				});

				logger.info(`User ${socket.data.username} joined event room: ${eventId}`);
			} catch (err) {
				logger.error("Failed to join room", { err });
				socket.emit("error", { message: "Failed to join room" });
			}
		});

		socket.on("status:update", ({ eventId, status, participantId }) => {
			const eventPresence = presenceMap.get(eventId);
			if (eventPresence) {
				const userPresence = eventPresence.get(socket.data.userId);
				if (userPresence) {
					userPresence.status = status;
					// Use participantId if provided, otherwise fall back to userId
					const statusId = participantId || socket.data.participantId || socket.data.userId;
					io.to(eventId).emit("participant:status_updated", {
						participantId: statusId,
						status,
					});
					io.to(eventId).emit("room:presence", {
						eventId,
						onlineUsers: getOnlineUsersArray(eventId),
					});
				}
			}
		});

		socket.on("disconnect", () => {
			// Clean up presence for all rooms this socket joined
			for (const eventId of roomsJoined) {
				const eventPresence = presenceMap.get(eventId);
				if (eventPresence) {
					const userPresence = eventPresence.get(socket.data.userId);
					if (userPresence) {
						userPresence.socketIds.delete(socket.id);
						if (userPresence.socketIds.size === 0) {
							eventPresence.delete(socket.data.userId);
							// Emit offline event
							io.to(eventId).emit("user:offline", {
								userId: socket.data.userId,
								username: socket.data.username,
								totalOnline: eventPresence.size,
							});
						}
					}
					if (eventPresence.size === 0) {
						presenceMap.delete(eventId);
					} else {
						// Broadcast updated presence list
						io.to(eventId).emit("room:presence", {
							eventId,
							onlineUsers: getOnlineUsersArray(eventId),
						});
					}
				}
			}
			logger.info(`Socket disconnected: ${socket.id} (${socket.data.username})`);
		});
	});

	// Bridge appEmitter events to Socket.io clients
	appEmitter.on("item:created", ({ eventId, item }) => {
		if (io) {
			io.to(eventId).emit("item:created", { item });
			logger.debug(`Socket: Broadcast item:created in ${eventId}`);
		}
	});

	appEmitter.on("item:updated", ({ eventId, item }) => {
		if (io) {
			io.to(eventId).emit("item:updated", { item });
			logger.debug(`Socket: Broadcast item:updated in ${eventId}`);
		}
	});

	appEmitter.on("item:deleted", ({ eventId, itemId }) => {
		if (io) {
			io.to(eventId).emit("item:deleted", { itemId });
			logger.debug(`Socket: Broadcast item:deleted in ${eventId}`);
		}
	});

	appEmitter.on("participant:joined", ({ eventId, participant }) => {
		if (io) {
			io.to(eventId).emit("participant:joined", { participant });
			logger.debug(`Socket: Broadcast participant:joined in ${eventId}`);
		}
	});

	appEmitter.on("response:created", async ({ eventId, responseId, participantId }) => {
		if (!io) return;
		try {
			const itemAnswers = await db
				.select()
				.from(answers)
				.where(eq(answers.responseId, responseId));

			const [respCount] = await db
				.select({ count: count() })
				.from(responses)
				.where(eq(responses.eventId, eventId));

			const totalResponses = respCount?.count ?? 0;

			io.to(eventId).emit("response:new", {
				responseId,
				participantId,
				submittedAt: new Date(),
				answers: itemAnswers.map((a) => ({ itemId: a.itemId, value: a.value })),
				totalResponses,
			});

			io.to(eventId).emit("response:count", { totalResponses });
			logger.debug(`Socket: Broadcast response:created and vote count update in ${eventId}`);
		} catch (err) {
			logger.error("Failed to broadcast socket response updates", { err });
		}
	});

	logger.info("Socket.io server initialized successfully.");
	return io;
}

export function getIo(): IOServer {
	if (!io) throw new Error("Socket.io not initialised, call setupSocket() first");
	return io;
}

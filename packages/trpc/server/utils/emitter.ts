import { EventEmitter } from "node:events";

export interface AppEvents {
	"response:created": (payload: {
		eventId: string;
		responseId: string;
		participantId: string | null;
	}) => void;
	"item:created": (payload: {
		eventId: string;
		item: any;
	}) => void;
	"item:updated": (payload: {
		eventId: string;
		item: any;
	}) => void;
	"item:deleted": (payload: {
		eventId: string;
		itemId: string;
	}) => void;
	"participant:joined": (payload: {
		eventId: string;
		participant: any;
	}) => void;
	"participant:status": (payload: {
		eventId: string;
		participantId: string;
		alias: string;
		status: string;
	}) => void;
}

class AppEventEmitter extends EventEmitter {
	override emit<K extends keyof AppEvents>(event: K, ...args: Parameters<AppEvents[K]>): boolean {
		return super.emit(event, ...args);
	}

	override on<K extends keyof AppEvents>(event: K, listener: AppEvents[K]): this {
		return super.on(event, listener as any);
	}

	override once<K extends keyof AppEvents>(event: K, listener: AppEvents[K]): this {
		return super.once(event, listener as any);
	}

	override off<K extends keyof AppEvents>(event: K, listener: AppEvents[K]): this {
		return super.off(event, listener as any);
	}
}

export const appEmitter = new AppEventEmitter();

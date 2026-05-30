import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { eventsRouter } from "./modules/events";
import { itemsRouter } from "./modules/items";
import { participantsRouter } from "./modules/participants";
import { responsesRouter } from "./modules/responses";
import { answersRouter } from "./modules/answers";
import { analyticsRouter } from "./modules/analytics";
import { patRouter } from "./modules/pat";
import { formStatesRouter } from "./modules/form-states";
import { serviceFormsRouter } from "./modules/service-forms";

export const serverRouter = router({
	health: healthRouter,
	events: eventsRouter,
	items: itemsRouter,
	participants: participantsRouter,
	responses: responsesRouter,
	answers: answersRouter,
	analytics: analyticsRouter,
	pat: patRouter,
	formStates: formStatesRouter,
	serviceForms: serviceFormsRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;

export { publicProcedure } from "./trpc";
export { protectedProcedure, authMiddleware } from "./middlewares/auth";
export { eventProcedure, eventExistsMiddleware, creatorProcedure, creatorOnlyMiddleware } from "./middlewares/event";
export { rateLimitedProcedure, rateLimiterMiddleware } from "./middlewares/rate-limit";
export { appEmitter } from "./utils/emitter";
export { registerResponseNotificationListeners } from "./listeners/response-notifications";

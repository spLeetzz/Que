import express from "express";
import cookieParser from "cookie-parser";
import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";
import { serverRouter, createContext } from "@repo/trpc/server";
import { auth } from "@repo/auth/server";
import { logger } from "@repo/logger";
import { registerDocs } from "./middleware/docs";
import { env } from "./env";

const app = express();

app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "healthy" });
});

registerDocs(app); // setup OpenAPI and Scalar docs

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext,
    onError: ({ error, path }) => {
      if (error.code === "INTERNAL_SERVER_ERROR")
        logger.error(`tRPC error on ${path}`, { error: error.message });
    },
  }),
);

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext,
  }),
);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ error: "Internal server error" });
});

export default app;

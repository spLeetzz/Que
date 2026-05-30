import http from "node:http";
import { logger } from "@repo/logger";
import expressApplication from "./server";
import { auth } from "@repo/auth/server";
import { toNodeHandler } from "better-auth/node";
import { env } from "./env";
import { verifyDbConnection } from "@repo/database";
import { setupSocket } from "./socket";
import { registerResponseNotificationListeners } from "@repo/trpc/server";

const authHandler = toNodeHandler(auth);
export const allowedOrigin = env.NODE_ENV === "production" ? env.WEB_URL : "http://localhost:3000";

function setCorsHeaders(res: http.ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

async function init() {
  try {
    logger.info("Verifying database connection...");
    await verifyDbConnection();
    logger.info("Database connection verified successfully.");

    const server = http.createServer((req, res) => {
      setCorsHeaders(res);

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.url?.startsWith("/api/auth")) {
        return authHandler(req, res);
      }

      expressApplication(req, res);
    });

    registerResponseNotificationListeners(env.WEB_URL);

    // Initialize WebSockets
    setupSocket(server);

    const PORT: number = env.PORT ? +env.PORT : 8000;
    server.listen(PORT, () => {
      logger.info(`Server running on PORT ${PORT}`);
    });
  } catch (err) {
    logger.error("Error creating server", { err });
    process.exit(1);
  }
}

init();

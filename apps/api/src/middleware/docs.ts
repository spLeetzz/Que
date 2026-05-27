import type { Express } from "express"
import { apiReference } from "@scalar/express-api-reference"
import { generateOpenApiDocument } from "trpc-to-openapi"
import { serverRouter } from "@repo/trpc/server"
import { auth } from "@repo/auth/server"
import { logger } from "@repo/logger"
import { env } from "../env"

export function registerDocs(app: Express) {
  if (env.NODE_ENV === "production") return

  const openApiDocument = generateOpenApiDocument(serverRouter, {
    title: "Que API",
    version: "1.0.0",
    baseUrl: env.BASE_URL + "/api",
  })

  app.get("/openapi.json", async (_req, res) => {
    const authSchema = await auth.api.generateOpenAPISchema()
    const mergedPaths = {
      ...openApiDocument.paths,
      ...(authSchema.paths as any),
    }

    // Filter out anonymous auth endpoints from the OpenAPI doc.
    // Note: These are internal Better-Auth plugin endpoints and should never be consumed at the user/client level.
    for (const path of Object.keys(mergedPaths)) {
      if (path.includes("/sign-in/anonymous") || path.includes("/delete-anonymous-user")) {
        delete (mergedPaths as any)[path]
      }
    }

    res.json({
      ...openApiDocument,
      paths: mergedPaths,
      components: {
        ...openApiDocument.components,
        schemas: {
          ...openApiDocument.components?.schemas,
          ...(authSchema.components as any)?.schemas,
        },
      },
    })
  })

  app.use("/docs", apiReference({ url: "/openapi.json" }))
  logger.debug(`docs → ${env.BASE_URL}/docs`)
}

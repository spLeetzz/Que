import { createAuthClient } from "better-auth/react";
import { anonymousClient } from "better-auth/client/plugins";

export function createQueAuthClient(baseURL?: string) {
  return createAuthClient({
    ...(baseURL ? { baseURL } : {}),
    basePath: "/api/auth",
    plugins: [anonymousClient()],
  });
}

export type AuthClient = ReturnType<typeof createQueAuthClient>;

import { createQueAuthClient } from "@repo/auth/client";
import { env } from "../env";

export const authClient = createQueAuthClient(
  env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000",
);

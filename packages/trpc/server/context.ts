import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createCookieFactory, getCookieFactory, clearCookieFactory } from "./utils/cookies.js";
import { auth } from "@repo/auth/server";

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

export interface TRPCContext {
  createCookie: ReturnType<typeof createCookieFactory>;
  getCookie: ReturnType<typeof getCookieFactory>;
  clearCookie: ReturnType<typeof clearCookieFactory>;
  session: Session;
  user: NonNullable<Session>["user"] | null;
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
}

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<TRPCContext> {
  let session = await auth.api.getSession({ headers: req.headers as HeadersInit });

  if (!session) {
    try {
      const response = await auth.api.signInAnonymous({ headers: req.headers as HeadersInit, asResponse: true });
      const cookie = response.headers.get("set-cookie");
      if (cookie) {
        res.setHeader("Set-Cookie", cookie);
        const h = new Headers(req.headers as HeadersInit);
        h.set("cookie", cookie);
        session = await auth.api.getSession({ headers: h });
      }
    } catch (err) {
      console.error("[auth] anon session provision failed:", err);
    }
  }

  return {
    createCookie: createCookieFactory(res),
    getCookie: getCookieFactory(req),
    clearCookie: clearCookieFactory(res),
    session,
    user: session?.user ?? null,
    req,
    res,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
import type { Request, Response, CookieOptions } from "express";

export function createCookieFactory(res: Response) {
  return function (name: string, value: string, options: CookieOptions = {}) {
    return res.cookie(name, value, options);
  };
}

export function getCookieFactory(req: Request) {
  return function (name: string) {
    return req.cookies?.[name] as string | undefined;
  };
}

export function clearCookieFactory(res: Response) {
  return function (name: string) {
    return res.clearCookie(name);
  };
}

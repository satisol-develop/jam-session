import crypto from "crypto";
import type { GsPayload } from "@/types";

const TIMESTAMP_WINDOW_MS = 5 * 60 * 1000;

export function signData(
  secret: string,
  route: string,
  uid: string,
  ts: number,
  body: string,
): string {
  const data = `${route}|${uid}|${ts}|${body}`;
  return crypto.createHmac("sha256", secret).update(data, "utf8").digest("hex");
}

export function buildPayload(opts: {
  route: string;
  body?: unknown;
  secret: string;
  uid?: string;
  ts?: number;
}): GsPayload {
  const uid = opts.uid ?? "";
  const ts = opts.ts ?? Date.now();
  const body = opts.body === undefined ? "" : JSON.stringify(opts.body);
  return {
    route: opts.route,
    uid,
    ts,
    body,
    sig: signData(opts.secret, opts.route, uid, ts, body),
  };
}

export function verifyPayload(payload: GsPayload, secret: string): boolean {
  if (!payload?.route || !payload.sig || !payload.ts) return false;
  if (Math.abs(Date.now() - payload.ts) > TIMESTAMP_WINDOW_MS) return false;
  const expected = signData(
    secret,
    payload.route,
    payload.uid ?? "",
    payload.ts,
    payload.body ?? "",
  );
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(payload.sig, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const PUBLIC_ROUTES = new Set(["public.event", "public.catalog"]);

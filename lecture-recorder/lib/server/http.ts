import { NextResponse } from "next/server";
import { describe } from "./openai";

export function ok<T>(data: T): NextResponse {
  return NextResponse.json(data);
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Turns any thrown value into a Japanese error message with a sane status. */
export function failFrom(err: unknown, fallbackStatus = 500): NextResponse {
  const message = describe(err);
  const status = /見つかりません|not found/i.test(message) ? 404 : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

export function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function routeParams<T extends Record<string, string>>(
  ctx: { params: Promise<T> },
): Promise<T> {
  return ctx.params;
}

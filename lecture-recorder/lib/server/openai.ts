import OpenAI from "openai";
import { CONFIG, hasKey } from "./config";

let client: OpenAI | null = null;

export function openai(): OpenAI {
  if (!hasKey()) {
    throw new ApiKeyMissing();
  }
  if (!client) {
    client = new OpenAI({ maxRetries: 0, timeout: 10 * 60 * 1000 });
  }
  return client;
}

export class ApiKeyMissing extends Error {
  constructor() {
    super("OPENAI_API_KEY が設定されていません。設定画面の手順に従ってキーを登録してください。");
    this.name = "ApiKeyMissing";
  }
}

/** A failure that will never succeed on retry (bad key, bad request). */
export function isPermanent(err: unknown): boolean {
  if (err instanceof ApiKeyMissing) return true;
  if (err instanceof OpenAI.APIError) {
    const status = err.status ?? 0;
    return status === 400 || status === 401 || status === 403 || status === 404 || status === 413;
  }
  return false;
}

/**
 * Retries with exponential backoff. University Wi-Fi drops mid-lecture, so a
 * network failure must never be the end of a chunk: it waits and tries again.
 */
export async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  attempts = CONFIG.maxAttempts,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (isPermanent(err) || attempt === attempts) break;
      const waitMs = Math.min(30000, 1000 * 2 ** (attempt - 1)) + Math.random() * 500;
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw new Error(`${label}: ${describe(lastError)}`);
}

export function describe(err: unknown): string {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 401) return "APIキーが無効です。";
    if (err.status === 429) return "レート制限に達しました。しばらく待って再試行してください。";
    return `OpenAI API エラー (${err.status ?? "?"}): ${err.message}`;
  }
  if (err instanceof Error) {
    if (/fetch failed|ENOTFOUND|ECONNRESET|ETIMEDOUT|network/i.test(err.message)) {
      return "ネットワークに接続できませんでした。";
    }
    return err.message;
  }
  return String(err);
}

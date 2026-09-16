"use client";

/**
 * Uploads to this same computer, so a dropped university Wi-Fi connection
 * cannot interrupt a recording. Retries anyway: the local server may be busy
 * writing a previous chunk.
 */
export class Uploader {
  private chain: Promise<unknown> = Promise.resolve();
  private failures = 0;
  private inFlight = 0;

  constructor(private readonly onFailure: (error: Error) => void) {}

  get pending(): number {
    return this.inFlight;
  }

  get failureCount(): number {
    return this.failures;
  }

  /** Queues an upload. Order is preserved, which the master file depends on. */
  send(run: () => Promise<unknown>, label: string): Promise<void> {
    this.inFlight += 1;
    const next = this.chain.then(async () => {
      try {
        await withRetry(run);
      } catch (err) {
        this.failures += 1;
        this.onFailure(
          new Error(`${label}の保存に失敗しました: ${err instanceof Error ? err.message : err}`),
        );
      } finally {
        this.inFlight -= 1;
      }
    });
    this.chain = next;
    return next;
  }

  /** Resolves when everything queued so far has been written. */
  drain(): Promise<void> {
    return this.chain.then(() => undefined);
  }
}

async function withRetry(run: () => Promise<unknown>, attempts = 5): Promise<void> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await run();
      return;
    } catch (err) {
      lastError = err;
      if (attempt === attempts) break;
      await new Promise((r) => setTimeout(r, 400 * 2 ** (attempt - 1)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

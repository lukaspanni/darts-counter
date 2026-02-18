export type Result<T, TError = Error> =
  | { ok: true; result: T; error?: never }
  | { ok: false; result?: never; error: TError };

export const okResult = <T>(result: T): Result<T> => ({ ok: true, result });

export const errorResult = (error: unknown): Result<never, Error> => ({
  ok: false,
  error:
    error instanceof Error
      ? error
      : new Error("Unknown error", { cause: error }),
});

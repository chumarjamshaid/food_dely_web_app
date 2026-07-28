export function extractApiError(
  err: unknown,
  fallback = "Something went wrong",
): string {
  const e = err as {
    response?: {
      status?: number;
      data?: unknown;
    };
    message?: string;
  };
  const data = e?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.code === "string" && obj.code.trim()) return obj.code.trim();
    if (typeof obj.detail === "string" && obj.detail.trim())
      return obj.detail.trim();
    if (typeof obj.message === "string" && obj.message.trim())
      return obj.message.trim();
    const firstValue = Object.values(obj)[0];
    if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
      return firstValue[0];
    }
    if (typeof firstValue === "string" && firstValue.trim()) {
      return firstValue.trim();
    }
  }

  if (e?.message) return e.message;
  return fallback;
}

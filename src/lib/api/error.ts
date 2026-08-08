export function extractApiError(
  err: unknown,
  fallback = "Something went wrong",
): string {
  if (typeof err === "string" && err.trim()) return err.trim();
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
    if (obj.errors && typeof obj.errors === "object") {
      const fields = obj.errors as Record<string, unknown>;
      const messages = Object.entries(fields).flatMap(([field, value]) => {
        const values = Array.isArray(value) ? value : [value];
        return values.filter((item): item is string => typeof item === "string").map(item => `${field.replaceAll("_", " ")}: ${item}`);
      });
      if (messages.length) return messages.join(" ");
    }
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

const authErrorMessages: Record<string, string> = {
  "Client invalide": "Some account details are invalid. Review the highlighted form information.",
  "Client email invalide": "Enter a valid email address.",
  "Client téléphone invalide": "Enter a valid international phone number.",
  "api.customer_password_not_matching_confirmation": "The passwords do not match.",
  "api.customer_email_already_used": "An account already exists with this email address.",
  "api.customer_phone_already_used": "An account already exists with this phone number.",
  "api.customer_email_invalid": "Enter a valid email address.",
  "api.customer_phone_invalid": "Enter a valid international phone number.",
  "api.customer_missing_data": "Complete all required account fields.",
  "api.customer_invalid": "Some account details are invalid. Check the form and try again.",
  "api.restaurant_email_already_used": "This email is already used by another account.",
  "api.restaurant_phone_invalid": "Enter a valid international phone number.",
  "api.restaurant_password_not_matching_confirmation": "The passwords do not match.",
};

export function extractAuthError(
  error: unknown,
  fallback = "We could not complete the authentication request. Please try again.",
): string {
  const raw = extractApiError(error, fallback);
  if (authErrorMessages[raw]) return authErrorMessages[raw];

  const normalized = raw.toLowerCase();
  if (normalized.includes("no active account found")) {
    return "The email or password is incorrect, or this account is not active yet.";
  }
  if (normalized.includes("network error") || normalized.includes("failed to fetch")) {
    return "The authentication service could not be reached. Check your connection and try again.";
  }
  if (normalized.includes("<!doctype") || normalized.includes("<html")) {
    return fallback;
  }
  return raw;
}

const MESSAGES: Record<string, string> = {
  NETWORK: "Unable to connect. Check your internet connection and try again.",
  TIMEOUT: "The request timed out. Please try again.",
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION: "Please check your input and try again.",
  CONFLICT: "This was modified by another user. Please refresh and try again.",
  SERVER: "Something went wrong on our end. Please try again later.",
  RATE_LIMIT: "Too many requests. Please wait a moment and try again.",
  OFFLINE: "You are currently offline. Please check your internet connection.",
  DEFAULT: "An unexpected error occurred. Please try again.",
};

interface ParsedError {
  message: string;
  retryable: boolean;
  status?: number;
}

export function parseError(error: unknown): ParsedError {
  if (!error || typeof error !== "object") {
    return { message: MESSAGES.DEFAULT, retryable: false };
  }

  const err = error as Record<string, any>;

  if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
    return { message: MESSAGES.NETWORK, retryable: true };
  }

  if (err.code === "ECONNABORTED" || err.message?.includes?.("timeout")) {
    return { message: MESSAGES.TIMEOUT, retryable: true };
  }

  const status = err.response?.status;

  if (status === 429) {
    return { message: MESSAGES.RATE_LIMIT, retryable: true, status };
  }
  if (status === 403) {
    return { message: MESSAGES.FORBIDDEN, retryable: false, status };
  }
  if (status === 404) {
    return { message: MESSAGES.NOT_FOUND, retryable: false, status };
  }
  if (status === 409) {
    return { message: MESSAGES.CONFLICT, retryable: false, status };
  }
  if (status === 422 || status === 400) {
    const serverMsg = err.response?.data?.message;
    return {
      message: serverMsg || MESSAGES.VALIDATION,
      retryable: false,
      status,
    };
  }
  if (status && status >= 500) {
    const serverMsg = err.response?.data?.message;
    return {
      message: serverMsg || MESSAGES.SERVER,
      retryable: true,
      status,
    };
  }

  const serverMsg = err.response?.data?.message || err.message;
  return {
    message: serverMsg || MESSAGES.DEFAULT,
    retryable: false,
  };
}

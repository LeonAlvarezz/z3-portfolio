export enum ErrorCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INVALID_COOKIE = 420,
  RATE_LIMIT = 429,
  INTERNAL_SERVER = 500,
}

export enum DefaultErrorMessage {
  BAD_REQUEST = "Bad Request",
  UNAUTHORIZED = "Unauthorized",
  INVALID_CREDENTIAL = "Invalid Credential",
  FORBIDDEN = "Forbidden",
  NOT_FOUND = "Not Found",
  RATE_LIMIT = "Too many requests",
  INTERNAL_SERVER = "Internal Server",
  NETWORK_ERROR = "Network Error",
  REQUEST_TIMEOUT = "Request timeout",
  INVALID_COOKIE = "Invalid Cookie",
  VALIDATION = "Validation Error",
  ENDPOINT_NOT_FOUND = "Endpoint Not Found",
}

export type CustomError = {
  status: number;
  message: string;
  metadata?: Record<string, string>;
};

export type ErrorParams = {
  error?: unknown;
  message?: string;
  options?: Record<string, any>;
};

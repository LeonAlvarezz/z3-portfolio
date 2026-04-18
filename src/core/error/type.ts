export enum ErrorCode {
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INVALID_COOKIE = 420,
  RATE_LIMIT = 429,
  INTERNAL_SERVER = 500,
  INVALID_CREDENTIAL = 401,
}

export enum DefaultErrorMessage {
  BAD_REQUEST = "Bad Request",
  UNAUTHORIZED = "Unauthorized",
  INVALID_CREDENTIAL = "Invalid Credential",
  FORBIDDEN = "Forbidden",
  NOT_FOUND = "Not Found",
  RATE_LIMIT = "Too many requests",
  CONFLICT = "Conflict",
  INTERNAL_SERVER = "Internal Server",
  NETWORK_ERROR = "Network Error",
  REQUEST_TIMEOUT = "Request timeout",
  INVALID_COOKIE = "Invalid Cookie",
  VALIDATION = "Validation Error",
  ENDPOINT_NOT_FOUND = "Endpoint Not Found",
}

export type DefaultErrorMessageKey = keyof typeof DefaultErrorMessage;
export type ErrorCodeKey = keyof typeof ErrorCode;

export type CustomError = {
  status: number;
  code: DefaultErrorMessageKey;
  message: string;
  metadata?: Record<string, string>;
};

export type ErrorParams = {
  error?: unknown;
  message?: string;
  options?: Record<string, any>;
};

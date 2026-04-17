import {
  ErrorParams,
  CustomError,
  ErrorCode,
  DefaultErrorMessage,
} from "./type";

const createError = (
  status: number,
  defaultMessage: string,
  params?: ErrorParams,
): CustomError => ({
  status,
  message: params?.message || defaultMessage,
  ...(params?.options ? { metadata: params.options } : {}),
});

export class ErrorException extends Error {
  constructor(
    public status: number,
    message: string,
    public metadata?: Record<string, string>,
  ) {
    super(message);
    this.name = this.constructor.name;
  }

  toResponse() {
    return Response.json(
      {
        error: this.message,
        code: this.status,
      },
      {
        status: this.status,
      },
    );
  }
}

export class BadRequestException extends ErrorException {
  constructor(params?: ErrorParams) {
    super(
      ErrorCode.BAD_REQUEST,
      params?.message || DefaultErrorMessage.BAD_REQUEST,
      params?.options,
    );
  }
}

export class RateLimitException extends ErrorException {
  constructor(params?: ErrorParams) {
    super(
      ErrorCode.RATE_LIMIT,
      params?.message || DefaultErrorMessage.RATE_LIMIT,
      params?.options,
    );
  }
}

export class NotFoundException extends ErrorException {
  constructor(params?: ErrorParams) {
    super(
      ErrorCode.NOT_FOUND,
      params?.message || DefaultErrorMessage.NOT_FOUND,
      params?.options,
    );
  }
}

export class UnauthorizedException extends ErrorException {
  constructor(params?: ErrorParams) {
    super(
      ErrorCode.UNAUTHORIZED,
      params?.message || DefaultErrorMessage.INVALID_CREDENTIAL,
      params?.options,
    );
  }
}

export class ForbiddenException extends ErrorException {
  constructor(params?: ErrorParams) {
    super(
      ErrorCode.FORBIDDEN,
      params?.message || DefaultErrorMessage.FORBIDDEN,
      params?.options,
    );
  }
}

export class InternalServerException extends ErrorException {
  constructor(params?: ErrorParams) {
    super(
      ErrorCode.INTERNAL_SERVER,
      params?.message || DefaultErrorMessage.INTERNAL_SERVER,
      params?.options,
    );
  }
}

export class InvalidCookieException extends ErrorException {
  constructor(params?: ErrorParams) {
    super(
      ErrorCode.INVALID_COOKIE,
      params?.message || DefaultErrorMessage.INVALID_COOKIE,
      params?.options,
    );
  }
}

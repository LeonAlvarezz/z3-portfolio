import { ErrorCode } from "@/core/error/type";

// Format any Drizzle/PG error into a readable message
export function isDrizzleError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const errorObj = err as {
    name?: unknown;
    message?: unknown;
    query?: unknown;
    params?: unknown;
    code?: unknown;
    cause?: {
      query?: unknown;
      params?: unknown;
      code?: unknown;
    };
  };

  const hasQuery =
    typeof errorObj.query === "string" ||
    typeof errorObj.cause?.query === "string";
  const hasParams =
    Array.isArray(errorObj.params) || Array.isArray(errorObj.cause?.params);
  const hasPgCode =
    typeof errorObj.code === "string" && /^[A-Z0-9]{5}$/.test(errorObj.code);

  const name = typeof errorObj.name === "string" ? errorObj.name : "";
  const message = typeof errorObj.message === "string" ? errorObj.message : "";
  const looksLikeDrizzle =
    /drizzle/i.test(name) || /failed query:/i.test(message);

  return hasQuery || hasParams || hasPgCode || looksLikeDrizzle;
}

type ParsedDbError = {
  status: number;
  message: string;
};

export function parseDrizzleError(err: any): ParsedDbError {
  if (!err || typeof err !== "object") {
    return {
      status: 500,
      message: "Database operation failed.",
    };
  }

  const pgError = extractOriginalPgError(err);
  const code = pgError?.code as string | undefined;
  const detail = (pgError?.detail ?? "") as string;
  const constraint = (pgError?.constraint ?? "") as string;
  const column = (pgError?.column ?? "") as string;
  const rawMsg = (pgError?.message ?? "") as string;

  switch (code) {
    case "23505":
      return {
        status: ErrorCode.CONFLICT,
        message:
          parseUniqueViolation(constraint) ??
          "Duplicate value. Please use a different value.",
      };

    case "23503": {
      const fk = parseForeignKeyDetail(detail);
      if (fk) {
        return {
          status: ErrorCode.NOT_FOUND,
          message: `Invalid ${fk.column}. Referenced ${fk.resource} does not exist.`,
        };
      }

      return {
        status: ErrorCode.NOT_FOUND,
        message: "Invalid reference. Referenced record was not found.",
      };
    }

    case "23502":
      return {
        status: ErrorCode.BAD_REQUEST,
        message: `Missing required field: ${column || parseColumnFromMessage(rawMsg) || "required field"}.`,
      };

    case "22P02":
      return {
        status: ErrorCode.FORBIDDEN,
        message: `Invalid data format${detail ? `: ${detail}` : "."}`,
      };

    default:
      return {
        status: ErrorCode.INTERNAL_SERVER,
        message: "Database operation failed.",
      };
  }
}

export function formatDrizzleError(err: any): string {
  return parseDrizzleError(err).message;
}

// Extracts underlying PG error from Drizzle's wrapped error
function extractOriginalPgError(err: any): any {
  if (err?.cause && typeof err.cause === "object") return err.cause;
  return err;
}

// Dynamically parse constraint name into human-readable message
function parseConstraint(constraint: string): string {
  if (!constraint) return "A database constraint was violated.";

  const fieldMatch = constraint.match(/_(\w+?)(?:_key|_idx|_fkey)?$/);
  const field = fieldMatch?.[1];
  const prettyField = field ? toTitleCase(field.replace(/_/g, " ")) : null;

  if (constraint.includes("_key"))
    return `${prettyField ?? constraint} must be unique.`;
  if (constraint.includes("_fkey"))
    return `${prettyField ?? constraint} must reference a valid record.`;

  return `Constraint violation on ${prettyField ?? constraint}.`;
}

function parseUniqueViolation(constraint: string): string | null {
  if (!constraint) return null;
  const uniqueField = constraint.match(/_(\w+?)_key$/)?.[1];
  if (!uniqueField) return null;
  return `${uniqueField} already exists.`;
}

function parseForeignKeyDetail(detail: string): {
  column: string;
  resource: string;
} | null {
  const match = detail.match(
    /Key \(([^)]+)\)=\(([^)]+)\) is not present in table "([^"]+)"\./,
  );

  if (!match) return null;

  const [, column, _value, table] = match;
  return {
    column,
    resource: tableToResourceName(table),
  };
}

function tableToResourceName(table: string): string {
  if (table.endsWith("ies")) return `${table.slice(0, -3)}y`;
  if (table.endsWith("s")) return table.slice(0, -1);
  return table;
}

// Converts snake_case to Title Case
function toTitleCase(str: string): string {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Parses column name from a NOT NULL violation message
function parseColumnFromMessage(msg: string): string | null {
  const match = msg.match(/null value in column "(.*?)"/);
  return match ? match[1] : null;
}

// Clean up noisy raw SQL messages
function stripQuery(msg: string): string {
  if (!msg) return "";
  return msg
    .split("\n")[0] // Only keep the first line
    .replace(/^Failed query:\s*/, "")
    .trim();
}

// Function wrapper to catch and rethrow with formatted error
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (err: any) {
      const message = formatDrizzleError(err);
      console.error("🚨 Database Error:", message);
      throw err;
    }
  }) as T;
}

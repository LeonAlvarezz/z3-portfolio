import winston from "winston";
import env from "./env";

type LogLevel =
  | "error"
  | "warn"
  | "info"
  | "http"
  | "verbose"
  | "debug"
  | "silly";

const VALID_LOG_LEVELS: LogLevel[] = [
  "error",
  "warn",
  "info",
  "http",
  "verbose",
  "debug",
  "silly",
];

function isLogLevel(value: string | undefined): value is LogLevel {
  return Boolean(value && VALID_LOG_LEVELS.includes(value as LogLevel));
}

const serviceName =
  process.env.LOG_SERVICE_NAME?.trim() ||
  process.env.npm_package_name?.trim() ||
  "backend";

const level: LogLevel = isLogLevel(process.env.LOG_LEVEL)
  ? process.env.LOG_LEVEL
  : env.NODE_ENV === "production"
    ? "info"
    : "debug";

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

const logger = winston.createLogger({
  level,
  format: jsonFormat,
  defaultMeta: {
    service: serviceName,
    env: env.NODE_ENV,
    pid: process.pid,
  },
  transports: [
    //
    // - Write all logs with importance level of `error` or higher to `error.log`
    //   (i.e., error, fatal, but not other levels)
    //
    new winston.transports.File({ filename: "error.log", level: "error" }),
    //
    // - Write all logs with importance level of `info` or higher to `combined.log`
    //   (i.e., fatal, error, warn, and info, but not trace)
    //
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss.SSS",
        }),
        winston.format.printf((info) => {
          const {
            timestamp,
            level,
            message,
            stack,
            service,
            env,
            pid,
            ...meta
          } = info as Record<string, unknown> & {
            timestamp: string;
            level: string;
            message: unknown;
            stack?: string;
          };

          const normalizedMessage =
            typeof message === "string" ? message : JSON.stringify(message);
          const metaText =
            Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
          const base = `${timestamp} ${level} [${service as string}] (${env as string}) pid=${pid as number}: ${normalizedMessage}${metaText}`;

          return stack ? `${base}\n${stack}` : base;
        }),
      ),
    }),
  );
}

export function createScopedLogger(scope: string) {
  return logger.child({ scope });
}

export default logger;

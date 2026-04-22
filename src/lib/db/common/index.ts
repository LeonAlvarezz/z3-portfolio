import { customType, PgColumn } from "drizzle-orm/pg-core";
import { isoTimestamp } from "./iso-timestamp";
import { ColumnBaseConfig, ColumnDataType, SQL, sql } from "drizzle-orm";

export const timestamps = {
  created_at: isoTimestamp({ mode: "string" }).defaultNow().notNull(),
  updated_at: isoTimestamp({ mode: "string" }).defaultNow(),
  deleted_at: isoTimestamp({ mode: "string" }),
};

export const simpleTimestamps = {
  created_at: isoTimestamp({ mode: "string" }).defaultNow().notNull(),
  updated_at: isoTimestamp({ mode: "string" }).defaultNow(),
};

export const bytea = customType<{
  data: Uint8Array;
  notNull: false;
  default: false;
}>({
  dataType() {
    return "bytea";
  },
});

export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return `tsvector`;
  },
});

export const dateOnly = customType<{
  data: Date | null;
  driverData: string | null;
}>({
  dataType() {
    return "text";
  },
  toDriver(value: Date | null): string | null {
    if (!value) return null;
    // Runtime: value may be string from DTOs, handle both cases
    if (typeof value === "string") {
      return (value as string).split("T")[0];
    }
    return value.toISOString().split("T")[0];
  },
  fromDriver(value: string | null): Date | null {
    if (!value) return null;
    return new Date(value);
  },
});

export function enumToPgEnum<T extends Record<string, any>>(
  myEnum: T,
): [T[keyof T], ...T[keyof T][]] {
  return Object.values(myEnum).map((value: any) => `${value}`) as any;
}

type ColumnDataTypeToTSType<T extends ColumnDataType> = T extends "string"
  ? string
  : T extends "number"
    ? number
    : T extends "boolean"
      ? boolean
      : never;

export function coalesce<TDataType extends ColumnDataType>(
  ...columns: (
    | PgColumn<ColumnBaseConfig<TDataType, string>>
    | SQL<ColumnDataTypeToTSType<TDataType>>
    | ColumnDataTypeToTSType<TDataType>
  )[]
): SQL<ColumnDataTypeToTSType<TDataType> | null> {
  const sqlArgs = sql.join(
    columns.map((a) => sql`${a}`),
    sql.raw(","),
  );
  return sql`coalesce(${sqlArgs})`;
}

// export function coalesce<C extends Column>(
//   column: C,
//   defaultValue: C["_"]["data"] | AnyColumn<{ data: C["_"]["data"] }>,
// ): SQL<C["_"]["data"]> {
//   return sql`coalesce(${column}, ${defaultValue})`.mapWith(column);
// }

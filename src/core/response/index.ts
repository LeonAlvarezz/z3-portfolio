import z from "zod";
import { CursorModel } from "../model/cursor.model";
import { DefaultErrorMessageKey } from "../error/type";

export const FailSchema = (errorSchema: any = z.any()) =>
  z.object({
    success: z.literal(false),
    error: errorSchema,
  });

export const SuccessSchema = <T>(data: T) =>
  z.object({
    success: z.literal(true),
    data,
  });

export const CursorPaginationSchema = <T, U>(data: T, extra?: U) => {
  if (extra) {
    return z.object({
      data,
      meta: z.lazy(() => CursorModel.CursorMetaSchema),
      extra,
    });
  } else {
    return z.object({
      data,
      meta: z.lazy(() => CursorModel.CursorMetaSchema),
    });
  }
};

export const SimpleSuccessSchema = () =>
  z.object({
    success: z.boolean().default(true),
    message: z.string().default("Success"),
  });

export type ApiResult<T> = ApiSuccess<T> | ApiFail;

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFail = {
  success: false;
  error: {
    message: string;
    status: number;
    code: DefaultErrorMessageKey;
  };
};

export type SimpleSuccess = z.infer<typeof SimpleSuccessSchema>;

// Cursor-pagination result shape (use this in services/controllers).
export type CursorPagination<T, U = undefined> = {
  data: T[];
  extra?: U;
  meta: CursorModel.CursorMeta;
};

export const Success = <T>(data: T) => ({ success: true as const, data });
export const Fail = ({
  message,
  status,
  metadata,
  code,
}: {
  message: string;
  status: number;
  metadata?: Record<string, any>;
  code: DefaultErrorMessageKey;
}) => ({
  success: false as const,
  error: {
    message,
    status,
    metadata,
    code,
  },
});

export const SimpleSuccess = (message?: string) => ({
  success: true,
  message: message ?? "Success",
});

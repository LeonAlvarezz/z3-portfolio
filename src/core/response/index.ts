import { Elysia, TSchema } from "elysia";
import z from "zod";
import { BaseModel } from "../model/base.model";

// export const responseWrapper = <E extends Elysia>(app: E) =>
//   new Elysia({
//     name: "response-wrapper",
//   })
// .onAfterHandle(({ responseValue }) => {
//   if (responseValue instanceof Response) return responseValue;

//   return Ok(responseValue);
// })
// .as("global");
// })
// .mapResponse(({ responseValue }) => {
//   if (responseValue instanceof Response) return responseValue;
//   // Wrap the response
//   return new Response(JSON.stringify(Ok(responseValue)), {
//     headers: { "Content-Type": "application/json" },
//   });
// });
// .as("global");

export const Success = <T>(data: T) => ({ success: true as const, data });
export const Fail = ({
  message,
  status,
}: {
  message: string;
  status: number;
}) => ({
  success: false as const,
  message,
  status,
});

export const SimpleSuccess = (message?: string) => ({
  success: true,
  message: message ?? "Success",
});

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

export const SimpleSuccessSchema = () =>
  z.object({
    success: z.boolean().default(true),
    message: z.string().default("Success"),
  });

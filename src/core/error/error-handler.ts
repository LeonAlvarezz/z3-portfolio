import { Elysia } from "elysia";

import { ErrorException } from "@/core/error";
import { resError } from "@/core/error/error-wrapper";
import logger from "@/lib/logger";
import { DefaultErrorMessage } from "./type";
import { Fail } from "../response";

export const errorHandler = new Elysia({ name: "error-handling" })
	.onError(({ error, code, set }) => {
		logger.error("🔥 Error occurred: ", error);

		if (code === "VALIDATION") {
			set.status = (error as any)?.status ?? 400;
			return resError({
				message: DefaultErrorMessage.VALIDATION,
				status: set.status,
				metadata: (error as any)?.messageValue,
			});
		}

		if (error instanceof ErrorException) {
			set.status = error.status;
			return resError({ message: error.message, status: error.status });
		}

		if (code === "NOT_FOUND") {
			set.status = (error as any)?.status ?? 404;
			return Fail({
				message: DefaultErrorMessage.ENDPOINT_NOT_FOUND,
				status: set.status,
			});
		}

		return {
			status: set?.status ?? 500,
			message: (error as any) ?? "Internal Server Error",
			success: false,
		};
	})
	.as("global");

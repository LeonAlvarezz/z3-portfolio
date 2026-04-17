import Elysia from "elysia";

export const ip = new Elysia({ name: "ip" })
  .derive({ as: "global" }, ({ server, request }) => ({
    ip: server?.requestIP(request),
  }))
  .get("/ip", ({ ip }) => ip);

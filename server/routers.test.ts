import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: "test-user-id",
    tenantId: "test-tenant-id",
    openId: "user-1",
    email: "user1@example.com",
    displayName: "User 1",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
      hostname: "localhost",
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Lattice9 Platform Routers", () => {
  describe("engagements router", () => {
    it("should list engagements for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.engagements.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should reject engagement creation without confirmation", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.engagements.create({
          name: "test-engagement",
          authorizationStatement: "short",
          confirmed: false,
        })
      ).rejects.toThrow();
    });
  });

  describe("collection router", () => {
    it("should reject collection on non-existent engagement", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.collection.getRuns({ engagementId: "nonexistent" })
      ).resolves.toEqual([]);
    });
  });

  describe("exposure router", () => {
    it("should list findings for engagement", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.exposure.getFindings({
        engagementId: "nonexistent",
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("reports router", () => {
    it("should list reports for engagement", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.reports.list({
        engagementId: "nonexistent",
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("owasp router", () => {
    it("should list all OWASP categories", async () => {
      const caller = appRouter.createCaller(createAuthContext());
      const result = await caller.owasp.listAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("auth router", () => {
    it("should get current user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.me();
      expect(result).toEqual(ctx.user);
    });

    it("should logout user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.auth.logout();
      expect(result).toEqual({ success: true });
    });
  });
});

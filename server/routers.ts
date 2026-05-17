import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

// Modular Routers
import { engagementsRouter } from "./routers/engagements";
import { reconRouter } from "./routers/recon";
import { vulnerabilityRouter } from "./routers/vulnerability";
import { intelligenceRouter } from "./routers/intelligence";
import { reportsRouter } from "./routers/reports";
import { chatRouter } from "./routers/chat";
import { owaspRouter } from "./routers/owasp";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  
  engagements: engagementsRouter,
  collection: reconRouter,
  exposure: vulnerabilityRouter,
  intelligence: intelligenceRouter,
  reports: reportsRouter,
  advisor: chatRouter,
  owasp: owaspRouter,
});

export type AppRouter = typeof appRouter;

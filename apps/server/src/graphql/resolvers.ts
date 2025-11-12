import prisma from "../services/prisma.js";
import jwt from "jsonwebtoken";
import { getCurrentToken } from "../utils/tokenStore.js";

function verifyToken(token: string): string | null {
  try {
    const payload: any = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    return payload?.sub || null;
  } catch (err) {
    return null;
  }
}

export const resolvers = {
  Query: {
    todayMessageCount: async (_: any, __: any, context: any) => {
      // Try to get token from context or fallback store. If missing, return global stats (no auth required).
      let authToken = context?.authToken || getCurrentToken();

      console.log("[Resolver] Token from context:", !!context?.authToken, "from store:", !!getCurrentToken());

      // Calculate today's date range in local timezone
      const now = new Date();
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
      const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));

      // If there's no auth token, return global today stats (no authentication required)
      if (!authToken) {
        const messageCounts = await prisma.message.groupBy({
          by: ['userId'],
          _count: {
            id: true,
          },
          where: {
            createdAt: { gte: todayStart, lt: todayEnd },
          },
        });

        const userMessageCounts = await Promise.all(
          messageCounts.map(async (entry) => {
            if (!entry.userId) {
              return {
                user: 'Anonymous',
                messageCount: entry._count.id,
              };
            }

            const user = await prisma.user.findUnique({
              where: { id: entry.userId },
              select: { name: true },
            });
            
            return {
              user: user?.name || 'Unknown',
              messageCount: entry._count.id,
            };
          })
        );

        // ✅ Calculate total message count for global stats
        const totalCount = userMessageCounts.reduce((sum, item) => sum + item.messageCount, 0);

        return {
          messageCount: totalCount, // ✅ Add this required field
          messageCounts: userMessageCounts,
          user: null, // ✅ Make user nullable for global stats
          messages: [], // ✅ Empty array for global stats
        };
      }
      // If token present, validate but still return ALL messages from today (not just user's)
      const userId = verifyToken(authToken);
      if (!userId) throw new Error("Unauthorized: Invalid token");

      // Ensure userId is a valid string
      const user = await prisma.user.findUnique({
        where: { id: userId as string }, // Assert that userId is a string
        select: { id: true, email: true, name: true, createdAt: true },
      });

      if (!user) throw new Error("User not found");

      // Get ALL messages from today (all users), not just the authenticated user's
      const allTodayMessages = await prisma.message.findMany({
        where: { 
          createdAt: { gte: todayStart, lt: todayEnd } 
        },
        orderBy: { createdAt: "desc" },
      });

      return {
        user: { ...user, createdAt: user.createdAt.toISOString() },
        messageCount: allTodayMessages.length, // Total count of all messages from today
        messages: allTodayMessages.map((msg) => ({ ...msg, createdAt: msg.createdAt.toISOString() })),
      };
    },
    // Public: return all messages from all users (no authentication required)
    allMessages: async (_: any, __: any, context: any) => {
      const messages = await prisma.message.findMany({
        orderBy: { createdAt: "desc" },
      });

      return messages.map((msg) => ({ ...msg, createdAt: msg.createdAt.toISOString() }));
    },
  },
};
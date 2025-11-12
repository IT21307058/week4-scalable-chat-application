import { ApolloServer } from "@apollo/server";
import http from "http";
import { setCurrentToken } from "../utils/tokenStore.js";

// CORS headers helper
function setCORSHeaders(res: http.ServerResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
}

export async function handleGraphQLRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    apolloServer: ApolloServer
): Promise<void> {
    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
        setCORSHeaders(res);
        res.writeHead(200);
        res.end();
        return;
    }

    const chunks: any[] = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString() || "{}";

    try {
        const requestBody = JSON.parse(body);
        const authHeader = req.headers.authorization;
        console.log("authHeader:", authHeader);
        const token = authHeader?.startsWith("Bearer ") 
            ? authHeader.slice(7) 
            : undefined;

        console.log("[GraphQL] Auth header:", authHeader ? "***present***" : "MISSING");
        console.log("[GraphQL] Token:", token);

        setCurrentToken(token);

        const result = await apolloServer.executeOperation({
            query: requestBody.query,
            variables: requestBody.variables,
        });

        setCORSHeaders(res);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
        setCurrentToken(undefined);
    } catch (err: any) {
        console.error("[GraphQL] Error:", err.message);
        setCORSHeaders(res);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ errors: [{ message: err.message }] }));
    }
}

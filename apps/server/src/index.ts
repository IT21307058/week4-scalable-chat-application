import http from "http";
import SocketService from "./services/socket.js";   
import { startMessageConsumer } from "./services/kafka.js";
import prisma from "./services/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import PrismaClient  from "@prisma/client";

function sendJSON(res: http.ServerResponse, status: number, payload: any) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
}

async function handleRegister(req: http.IncomingMessage, res: http.ServerResponse) {
    try {
        const chunks: any[] = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = Buffer.concat(chunks).toString() || "{}";
        const { email, password, name } = JSON.parse(body);
        if (!email || !password) return sendJSON(res, 400, { success: false, error: "email and password required" });

        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({ data: { email, password: hashed, name } });
        const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });

        return sendJSON(res, 200, { success: true, user: { id: user.id, email: user.email, name: user.name }, token });
    } catch (err: any) {
        console.error("Register error", err);
        return sendJSON(res, 500, { success: false, error: err.message || "internal" });
    }
}

async function handleLogin(req: http.IncomingMessage, res: http.ServerResponse) {
    try {
        const chunks: any[] = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = Buffer.concat(chunks).toString() || "{}";
        const { email, password } = JSON.parse(body);
        if (!email || !password) return sendJSON(res, 400, { success: false, error: "email and password required" });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return sendJSON(res, 400, { success: false, error: "invalid credentials" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return sendJSON(res, 400, { success: false, error: "invalid credentials" });

        const token = jwt.sign({ sub: user.id, email: user.email }, process.env.JWT_SECRET || "dev-secret", { expiresIn: "7d" });
        return sendJSON(res, 200, { success: true, user: { id: user.id, email: user.email, name: user.name }, token });
    } catch (err: any) {
        console.error("Login error", err);
        return sendJSON(res, 500, { success: false, error: err.message || "internal" });
    }
}

async function init() {
    startMessageConsumer();
    const socketService = new SocketService();

    const httpServer = http.createServer(async (req, res) => {
        // Basic health
        if (req.method === "GET" && req.url === "/") {
            return sendJSON(res, 200, { status: "ok" });
        }

        if (req.method === "POST" && req.url === "/register") {
            return await handleRegister(req, res);
        }

        if (req.method === "POST" && req.url === "/login") {
            return await handleLogin(req, res);
        }

        // Not handled: fallthrough (socket.io will use same server)
        res.writeHead(404);
        res.end();
    });

    const PORT = process.env.PORT || 8000;

    socketService.io.attach(httpServer)

    httpServer.listen(PORT, () =>
        console.log(`HTTP Server started at PORT:${PORT}`)
    );

    socketService.initListeners();

}

init();
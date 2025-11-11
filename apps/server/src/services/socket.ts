
import { Server } from "socket.io";
import { Redis } from 'ioredis'
import prismaClient from "./prisma.js";
import { produceMessage } from "./kafka.js";
import jwt from "jsonwebtoken";

const pub = new Redis({
  host: "valkey-191bb006-bhanukalakshitha22-c780.h.aivencloud.com",
  port: 11539,
  username: "default",
  password: "AVNS_BxRLxyDK-kKAggCrQs9",
});

const sub = new Redis({
  host: "valkey-191bb006-bhanukalakshitha22-c780.h.aivencloud.com",
  port: 11539,
  username: "default",
  password: "AVNS_BxRLxyDK-kKAggCrQs9",
});

class SocketService {
  private _io: Server;

  constructor() {
    console.log("Init Socket Service...");
    this._io = new Server({
      cors: {
        allowedHeaders: ["*"],
        origin: "*",
      }
    });

    sub.subscribe("MESSAGES");
  }

  public initListeners() {
    const io = this.io;
    console.log("Init Socket Listeners...");

    io.on("connect", (socket) => {
      console.log(`New Socket Connected`, socket.id);
      socket.on("event:message", async ({ message, token }: { message: string, token?: string }) => {
        try {
          console.log("New Message Rec.", message);

          let userId: string | null = null;
          if (token) {
            try {
              const payload: any = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
              userId = payload?.sub || null;
            } catch (err) {
              console.warn("Invalid token provided for message, continuing as anonymous");
            }
          }

          // fetch user name and publish full payload
          let userName = "Unknown";
          try {
            if (userId) {
              const user = await prismaClient.user.findUnique({ where: { id: userId }, select: { name: true } });
              userName = user?.name || "Unknown";
            }
          } catch (err) {
            console.warn("Failed to fetch user for message", err);
          }

          const payload = { message, userId, userName, createdAt: new Date().toISOString() };
          await pub.publish("MESSAGES", JSON.stringify(payload));
          console.log("Message Published to Redis ✅", message, "userId:", userId, "userName:", userName);
        } catch (err) {
          console.error("Failed to publish message ❌", err);
        }
      });
    });

    sub.on("message", async (channel, message) => {
      if (channel === "MESSAGES") {
        console.log("New Message from Redis ✅", message);
        io.emit("message", message);

        await produceMessage(message);
        console.log("Message Produced to Kafka Broker");
      }
    });
  }

  get io() {
    return this._io;
  }
}

export default SocketService;
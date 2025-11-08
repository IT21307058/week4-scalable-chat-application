import { Server } from "socket.io";
import { Redis } from 'ioredis'
import prismaClient from "./prisma.js";
import { produceMessage } from "./kafka.js";

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
      socket.on("event:message", async ({ message }: { message: string }) => {
        try {
          console.log("New Message Rec.", message);
          await pub.publish("MESSAGES", JSON.stringify({ message }));
          console.log("Message Published to Redis ✅", message);
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
import { Kafka, Producer } from "kafkajs";
import fs from "fs";
import path from "path";
import prismaClient from "./prisma.js";
import { Redis } from "ioredis";

const kafka = new Kafka({
    brokers: ["kafka-2b1ea777-bhanukalakshitha22-c780.i.aivencloud.com:11552"],
    ssl: {
        ca: [fs.readFileSync(path.resolve("./ca.pem"), "utf-8")],
    },
    sasl: {
        username: "avnadmin",
        password: "AVNS_s3TWMg2Q7gXjaM1jkW_",
        mechanism: "plain",
    },
});

let producer: null | Producer = null;

export async function createProducer() {
    if (producer) return producer;

    const _producer = kafka.producer();
    await _producer.connect();
    producer = _producer;
    return producer;
}

export async function produceMessage(message: string) {
    const producer = await createProducer();
    await producer.send({
        messages: [{ key: `message-${Date.now()}`, value: message }],
        topic: "MESSAGES",
    });
    return true;
}


export async function startMessageConsumer() {
    console.log("Consumer is running..");
    const consumer = kafka.consumer({ groupId: "default" });
    await consumer.connect();
    await consumer.subscribe({ topic: "MESSAGES", fromBeginning: true });

        const redis = new Redis({
            host: "valkey-191bb006-bhanukalakshitha22-c780.h.aivencloud.com",
            port: 11539,
            username: "default",
            password: "AVNS_BxRLxyDK-kKAggCrQs9",
        });

    await consumer.run({
        autoCommit: true,
        eachMessage: async ({ message, pause }) => {
            if (!message.value) return;
            console.log(`New Message Recv..`);
            const raw = message.value.toString();
            let payload: any = null;
            try {
                payload = JSON.parse(raw);
            } catch (e) {
                payload = { message: raw };
            }

            const text = payload.message ?? payload.text ?? raw;
            const userId = payload.userId ?? payload.user_id ?? null;

                try {
                const created = await prismaClient.message.create({
                    data: ({
                        text: text,
                        userId: userId ?? undefined,
                    } as any),
                });

                // store recent in Redis
                try {
                    const item = JSON.stringify({ id: created.id, text: created.text, userId: (created as any).userId, createdAt: created.createdAt });
                    await redis.lpush("messages:recent", item);
                    await redis.ltrim("messages:recent", 0, 99);
                    if ((created as any).userId) {
                        await redis.lpush(`user:${(created as any).userId}:messages`, item);
                        await redis.ltrim(`user:${(created as any).userId}:messages`, 0, 99);
                    }
                } catch (rErr) {
                    console.warn("Failed to push message to Redis", rErr);
                }
            } catch (err) {
                console.log("Something is wrong");
                pause();
                setTimeout(() => {
                    consumer.resume([{ topic: "MESSAGES" }]);
                }, 60 * 1000);
            }
        },
    });
}
export default kafka;
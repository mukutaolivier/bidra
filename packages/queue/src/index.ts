import { Queue, QueueOptions } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const createQueue = (name: string, options?: QueueOptions) => {
  return new Queue(name, {
    connection,
    ...options,
  });
};

// Placeholder queue names - actual queues will be added later
export const QueueNames = {
  DEFAULT: "default",
  EMAIL: "email",
  NOTIFICATIONS: "notifications",
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

export { Queue, Worker, Job } from "bullmq";
export { connection };
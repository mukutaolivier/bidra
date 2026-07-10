import { Worker } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

console.log("Worker service starting...");

// Placeholder worker - actual job processors will be added later
const worker = new Worker(
  "default",
  async (job) => {
    console.log(`Processing job ${job.id} of type ${job.name}`);
    // Job processing logic will be implemented here
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log("Worker service ready");
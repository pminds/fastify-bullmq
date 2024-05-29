import { ConnectionOptions, Queue } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';

const connection: ConnectionOptions = {
  host: env.REDISHOST,
  port: env.REDISPORT,
  username: env.REDISUSER,
  password: env.REDISPASSWORD,
};

export const createQueue = (name: string) => new Queue(name, { connection });

const maxCount = 100000;
const maxTime = 30000;

export const getQueueKeys = async () => {
  const client = new Redis({
    host: env.REDISHOST,
    port: env.REDISPORT,
    username: env.REDISUSER,
    password: env.REDISPASSWORD,
  });

  let nodes = [client]
  let keys = [];
  const startTime = Date.now();

  for await (const node of nodes) {
    let cursor = "0";
    do {
      const [nextCursor, scannedKeys] = await node.scan(
        cursor,
        "MATCH",
        "*:*:id",
        "COUNT",
        maxCount
      );
      cursor = nextCursor;

      keys.push(...scannedKeys);
    } while (Date.now() - startTime < maxTime && cursor !== "0");
  }
  return keys;
};
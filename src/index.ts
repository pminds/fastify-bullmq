import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import fastify, { FastifyInstance, FastifyRequest } from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { env } from './env';

import { createQueue, getQueueKeys } from './queue';

const run = async () => {
  const queueKeys = (await getQueueKeys()).map((key) => key.split(':')[1])
  console.log('Listening on queues', queueKeys)
  
  const queues = queueKeys.map(key => createQueue(key));
  const server: FastifyInstance<Server, IncomingMessage, ServerResponse> =
    fastify();

  const serverAdapter = new FastifyAdapter();
  createBullBoard({
    queues: queues.map(queue => new BullMQAdapter(queue)),
    serverAdapter,
  });
  serverAdapter.setBasePath('/');
  server.register(serverAdapter.registerPlugin(), {
    prefix: '/',
    basePath: '/',
  });


  await server.listen({ port: env.PORT, host: '0.0.0.0' });
  console.log(
    `To populate the queue and demo the UI, run: curl https://${env.RAILWAY_STATIC_URL}/add-job?id=1&email=hello%40world.com`
  );
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

const fastify = require('fastify')();
const path = require('path');

// Statische Dateien ausliefern
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
  prefix: '/public/', // z.B. http://localhost:8080/public/index.html
});

fastify.get('/', async (request, reply) => {
  return reply.sendFile('index.html');
});

fastify.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});

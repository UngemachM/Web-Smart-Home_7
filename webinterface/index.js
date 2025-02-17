const fastify = require('fastify')();
const path = require('path');

// Statische Dateien aus dem dist Ordner ausliefern
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'dist'),
  prefix: '/'
});

// Für client-side routing
fastify.setNotFoundHandler((request, reply) => {
  reply.sendFile('index.html');
});

fastify.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
const fastify = require("fastify")();
fastify.get("/", async (request, reply) => {
  reply.send({ message: "Thermostat läuft!" });
});
fastify.listen({ port: 3002, host: "0.0.0.0" });

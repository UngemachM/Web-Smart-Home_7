const fastify = require("fastify")();
fastify.get("/", async (request, reply) => {
  reply.send({ message: "Fensterkontakt läuft!" });
});
fastify.listen({ port: 3001, host: "0.0.0.0" });

const fastify = require("fastify")();
fastify.get("/", async (request, reply) => {
  reply.send({ message: "SmartHome-Backend läuft!" });
});
fastify.listen({ port: 3000, host: "0.0.0.0" });

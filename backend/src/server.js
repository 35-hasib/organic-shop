import "dotenv/config";
import { createApp } from "./app.js";
import { prisma } from "./prisma.js";
import { initRealtime } from "./realtime.js";

const port = parseInt(process.env.PORT, 10) || 4100;
const app = createApp();

const server = app.listen(port, () => {
  console.log(`Organic Shop API listening on http://localhost:${port}`);
});

initRealtime(server);

async function shutdown() {
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
